#!/usr/bin/python3
"""Wayland wallpaper surface for Omarchy. Messages on stdout are JSON lines."""

import argparse
import http.server
import json
import mimetypes
import os
import secrets
import signal
import sys
import threading
from pathlib import Path
from urllib.parse import urlsplit

import cairo
import gi

gi.require_version('Gtk', '4.0')
gi.require_version('Gdk', '4.0')
gi.require_version('Gtk4LayerShell', '1.0')
gi.require_version('WebKit', '6.0')
from gi.repository import Gdk, GLib, Gtk, Gtk4LayerShell, WebKit


def report(event, **details):
    print(json.dumps({'event': event, **details}), flush=True)

# WebKitGTK's DMABUF renderer outputs green-shifted video on NVIDIA (chroma
# planes are misread), so opt out of it before any WebKit object is created.
os.environ.setdefault('WEBKIT_DISABLE_DMABUF_RENDERER', '1')


class MediaHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def do_GET(self):
        self.serve_media(False)

    def do_HEAD(self):
        self.serve_media(True)

    def serve_media(self, head_only):
        if self.path != self.server.media_path:
            self.send_error(404)
            return

        source = self.server.source
        try:
            size = os.path.getsize(source)
        except OSError:
            self.send_error(404)
            return
        start, end = 0, size - 1
        range_header = self.headers.get('Range')
        if range_header:
            try:
                unit, interval = range_header.split('=', 1)
                first, last = interval.split('-', 1)
                if unit != 'bytes':
                    raise ValueError()
                if first:
                    start = int(first)
                    end = min(int(last), end) if last else end
                else:
                    suffix = int(last)
                    start = max(0, size - suffix)
                if start < 0 or end < start or start >= size:
                    raise ValueError()
            except (ValueError, OverflowError):
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.end_headers()
                return

        self.send_response(206 if range_header else 200)
        self.send_header('Content-Type', mimetypes.guess_type(source)[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if range_header:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        if head_only:
            return
        try:
            with open(source, 'rb') as media:
                media.seek(start)
                remaining = end - start + 1
                while remaining:
                    chunk = media.read(min(1024 * 1024, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass


class WallpaperApp(Gtk.Application):
    def __init__(self, kind, source):
        # Two instances briefly overlap while the new wallpaper becomes ready.
        super().__init__(application_id=None)
        self.kind = kind
        self.source = source
        self.windows = []
        self.ready = set()
        self.reported_ready = False
        self.failed = False
        self.generation = 0
        self.media_server = None
        self.media_url = None
        if kind == 'video':
            self.start_media_server()

    def start_media_server(self):
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), MediaHandler)
        server.daemon_threads = True
        server.source = self.source
        server.media_path = f'/{secrets.token_urlsafe(32)}/media'
        self.media_server = server
        self.media_url = f'http://127.0.0.1:{server.server_port}{server.media_path}'
        threading.Thread(target=server.serve_forever, daemon=True).start()

    def do_activate(self):
        display = Gdk.Display.get_default()
        if not display or not Gtk4LayerShell.is_supported():
            report('error', message='当前 Wayland 合成器不支持 layer-shell')
            self.quit()
            return
        self.monitors = display.get_monitors()
        self.monitors.connect('items-changed', self.on_monitors_changed)
        self.make_windows()
        GLib.io_add_watch(sys.stdin, GLib.IO_IN | GLib.IO_HUP, self.on_parent_input)

    def on_parent_input(self, _fd, _condition):
        if not sys.stdin.readline():
            self.quit()
            return False
        return True

    def on_monitors_changed(self, *_args):
        self.generation += 1
        previous = self.windows
        self.windows = []
        self.ready.clear()
        self.reported_ready = False
        self.make_windows()
        for window in previous:
            window.close()

    def make_windows(self, index=0):
        count = self.monitors.get_n_items()
        if not count:
            report('error', message='没有可用的显示器')
            self.quit()
            return
        if index >= count:
            return
        generation = self.generation
        monitor = self.monitors.get_item(index)
        window = Gtk.ApplicationWindow(application=self)
        Gtk4LayerShell.init_for_window(window)
        Gtk4LayerShell.set_monitor(window, monitor)
        Gtk4LayerShell.set_layer(window, Gtk4LayerShell.Layer.BOTTOM)
        Gtk4LayerShell.set_namespace(window, 'wallpaper-box')
        Gtk4LayerShell.set_keyboard_mode(window, Gtk4LayerShell.KeyboardMode.NONE)
        # Ignore the top bar's reserved area so the wallpaper fills the output.
        Gtk4LayerShell.set_exclusive_zone(window, -1)
        for edge in (Gtk4LayerShell.Edge.TOP, Gtk4LayerShell.Edge.BOTTOM,
                     Gtk4LayerShell.Edge.LEFT, Gtk4LayerShell.Edge.RIGHT):
            Gtk4LayerShell.set_anchor(window, edge, True)

        manager = WebKit.UserContentManager()
        if self.kind == 'video':
            manager.register_script_message_handler('wallpaper')
            manager.connect('script-message-received::wallpaper', self.on_video_message, index, generation)
        view = WebKit.WebView(user_content_manager=manager)
        view.set_background_color(Gdk.RGBA(0, 0, 0, 1))
        view.set_can_focus(False)
        view.get_settings().set_media_playback_requires_user_gesture(False)
        view.get_settings().set_media_playback_allows_inline(True)
        view.connect('load-failed', self.on_load_failed, generation)
        view.connect('web-process-terminated',
                     lambda _view, _reason, gen=generation: self.fail('网页渲染进程已退出', gen))
        if self.kind == 'web':
            view.connect('load-changed', self.on_web_load_changed, index, generation)
            view.connect('decide-policy', self.on_web_policy, generation)
        window.set_child(view)
        window.present()
        window.get_surface().set_input_region(cairo.Region())
        self.windows.append(window)

        if self.kind == 'video':
            html = f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body,video{{width:100%;height:100%;margin:0;background:#000}} video{{object-fit:cover}}</style></head>
<body><video autoplay loop muted playsinline src="{self.media_url}"></video><script>
const v=document.querySelector('video');
v.addEventListener('playing',()=>window.webkit.messageHandlers.wallpaper.postMessage('playing'));
v.addEventListener('error',()=>window.webkit.messageHandlers.wallpaper.postMessage('error: '+(v.error?.message||'unknown')));
v.play().catch(e=>window.webkit.messageHandlers.wallpaper.postMessage('error: '+e.message));
</script></body></html>'''
            view.load_html(html, 'http://127.0.0.1/')
        else:
            view.load_uri(self.source)

        # Presenting several layer-shell windows within one main-loop
        # iteration makes GTK 4.22 drop every later window's first frame, so
        # all monitors except the first stay black. Defer the next window to
        # the next iteration instead.
        GLib.idle_add(self.make_windows, index + 1)

    def on_web_load_changed(self, _view, event, index, generation):
        if event == WebKit.LoadEvent.FINISHED and not self.failed:
            self.mark_ready(index, generation)

    def on_web_policy(self, _view, decision, kind, generation):
        if generation != self.generation:
            return False
        if kind == WebKit.PolicyDecisionType.RESPONSE and decision.is_main_frame_main_resource():
            status = decision.get_response().get_status_code()
            if status >= 400:
                self.fail(f'网页服务器返回 HTTP {status}', generation)
                decision.ignore()
                return True
        if kind in (WebKit.PolicyDecisionType.NAVIGATION_ACTION, WebKit.PolicyDecisionType.NEW_WINDOW_ACTION):
            uri = decision.get_navigation_action().get_request().get_uri()
            allowed = ('http', 'https', 'file') if self.source.startswith('file:') else ('http', 'https')
            if urlsplit(uri).scheme not in allowed:
                decision.ignore()
                return True
        return False

    def on_video_message(self, _manager, value, index, generation):
        message = value.to_string()
        if message == 'playing':
            self.mark_ready(index, generation)
        elif message.startswith('error:'):
            self.fail(message, generation)

    def on_load_failed(self, _view, _event, _uri, error, generation):
        self.fail(str(error), generation)
        return False

    def fail(self, message, generation=None):
        if self.failed or (generation is not None and generation != self.generation):
            return
        self.failed = True
        report('error', message=message)
        self.quit()

    def mark_ready(self, index, generation):
        if self.failed or generation != self.generation:
            return
        self.ready.add(index)
        if len(self.ready) == len(self.windows) and not self.reported_ready:
            self.reported_ready = True
            report('ready', monitors=len(self.windows))

    def do_shutdown(self):
        if self.media_server:
            self.media_server.shutdown()
            self.media_server.server_close()
        Gtk.Application.do_shutdown(self)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('kind', choices=('web', 'video'))
    parser.add_argument('source')
    args = parser.parse_args()
    if args.kind == 'video' and not Path(args.source).is_file():
        report('error', message='视频文件不存在')
        return 1
    application = WallpaperApp(args.kind, args.source)
    signal.signal(signal.SIGTERM, lambda *_: application.quit())
    return application.run([])


if __name__ == '__main__':
    sys.exit(main())
