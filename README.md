<p align="center">
  <a href="https://github.com/wangrongding/wallpaper-box" target="_blank">
    <img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021532343.svg" width="300" alt="wallpaper-box logo"/>
  </a>
</p>

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [Español](./README.es.md)

🏞️ `wallpaper-box` is more than just another wallpaper downloader — it's a desktop client that truly brings your desktop to life: static wallpapers, video wallpapers, web wallpapers, AI-generated wallpapers, plus a fun RunCat-style animated tray icon that reacts to your CPU usage.

## Features

- [x] AI text-to-image wallpaper generation
- [x] Browse and search online wallpapers
- [x] Download wallpapers locally
- [x] Set static wallpapers
- [x] Set video wallpapers (on macOS the dynamic wallpaper window is fullscreen but doesn't cover the entire screen — PRs welcome!)
- [x] Download YouTube / Bilibili videos via `yt-dlp` and set them as video wallpapers directly
- [x] Set web wallpapers
- [x] Generate AI wallpapers from text prompts
- [x] Support both online URLs and local HTML files as web wallpapers
- [x] Animated tray icons (RunCat style) that change speed based on CPU usage
- [x] Launch at login
- [x] HTTP proxy support

## Platform Notes

- The built-in packaging scripts focus on macOS.
- Default builds are `universal` (compatible with both Apple Silicon and Intel Macs).
- Separate `x64` / `arm64` build commands are also available.
- Minimum supported macOS version is `10.13`.
- The app is not Apple Developer signed. You will need to manually allow it on first launch.

## Usage

### Wallpaper List

Wallpapers are sourced from wallhaven.cc.

- Search, filter, preview, download, and set wallpapers directly.
- Downloaded static wallpapers are saved to `~/wallpaper-box` by default.

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021543565.png"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021752830.gif"/></td>
  </tr>
</table>

### Live (Video) Wallpapers

Set local video files as dynamic desktop wallpapers. You can also paste YouTube / Bilibili links to download and use them directly.

- Supports clicking to select or drag & drop video files.
- Paste `YouTube / Bilibili` links to download videos.
- Common formats like `MP4`, `MOV`, `WebM` are supported.
- On macOS the dynamic wallpaper window may not perfectly cover the entire screen — contributions welcome.

<img width="1441" height="900" alt="image" src="https://github.com/user-attachments/assets/ad7e851d-6c14-4780-87d4-bf0c4d1651da" />

Notes:

- Downloaded videos are saved to `~/wallpaper-box/videos`
- The video is automatically set as wallpaper after download
- Pre-built release packages include `yt-dlp` and `Deno` — no manual installation required
- For videos with separate audio/video streams, you may also need to include `ffmpeg` and `ffprobe` in `resources/bin/`
- Using the official `yt-dlp_macos` binary may raise the effective minimum system version closer to `macOS 10.15+`

<table>
  <tr>
      <td width="50%" align="center"><b>Windows:</b></td>
      <td width="50%" align="center"><b>macOS:</b></td>
  </tr>
  <tr>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204250101273.gif"/></td>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/Kapture%202025-07-09%20at%2000.53.05.gif"/></td>
  </tr>
</table>

### Web Wallpapers

Set any webpage as your desktop wallpaper. Supports both online URLs and local HTML files.

- **Online URLs**: Just enter the address.
  - Example: `https://wangrongding.github.io/jellyfish/`
  - `google.com` or `localhost:3000` will automatically add the protocol.
- **Local files**: Select or drag & drop local `HTML/HTM/SVG` files.
  - macOS/Linux example: `/Users/your-name/Coding/jellyfish/index.html`
  - Windows example: `C:\Users\your-name\Coding\jellyfish\index.html`

### AI Wallpapers

Generate wallpapers directly from text prompts.

- AI settings are located in the **AI Wallpaper** page (not in global Settings).
- Generated images are automatically saved to `~/wallpaper-box`.
- After generation you can set it as wallpaper or open the folder.

<img width="1441" height="900" alt="image" src="https://github.com/user-attachments/assets/cf239b2a-e9c7-4a59-9ec0-9c36689af1a6" />

Currently supports two common APIs:

- OpenAI Images API compatible endpoints
- Zhipu `glm-image`

Recommended configuration examples:

- OpenAI
  - `API Base URL`: `https://api.openai.com/v1`
  - `Model`: `gpt-image-1`
- Zhipu BigModel
  - `API Base URL`: `https://open.bigmodel.cn/api/paas/v4`
  - `Model`: `glm-image`

Notes:

- If you use the full Zhipu endpoint `https://open.bigmodel.cn/api/paas/v4/images/generations`, it is also supported.
- `glm-image` supports custom width/height.
- Custom size limits: `512-2048`, and both width and height must be multiples of `32`.

Prompt tips:

- Recommended structure: `main subject + style/texture + lighting/time + camera composition + wallpaper requirements`
- Example: `futuristic coastal city, golden hour backlighting, cinematic wide-angle composition, clean negative space, suitable as widescreen desktop wallpaper, no people, no text, no watermark`

### Animated Tray Icons

The tray icon changes animation speed based on real-time CPU usage. You can preview and switch themes from the tray menu or the dedicated **Animated Icons** page.

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021550728.png"/></td>
  </tr>
</table>

<img width="1390" alt="image" src="https://github.com/user-attachments/assets/470fcc81-5348-41be-9b1f-d55f0f6d07c5" />

You no longer need to manually edit [electron/tray-list.ts](./electron/tray-list.ts).

- Built-in icons are automatically scanned from subfolders under [public/icons](./public/icons).
- Custom icons can be imported/deleted from the **Animated Icons** page, or simply dropped into `~/wallpaper-box/tray-icons/<your-icon-name>/`.
- Frames in a set are played in filename order (e.g. `001.png`, `002.png`...).

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030045464.gif" width="600" />

### Settings

The global Settings page contains general options:

- Launch at login
- HTTP proxy
- Proxy connectivity test
- Default wallpaper storage location (currently `~/wallpaper-box`)

Notes:

- Proxy test attempts to reach Google.
- AI API configuration lives in the **AI Wallpaper** page, not here.
- Tray icon preview, switching, and custom imports have been moved to the standalone **Animated Icons** page.

<img width="1000" alt="531b7f4d-270e-4233-8a14-fbc2d4d4c2ff" src="https://github.com/user-attachments/assets/2987e3fa-08f5-4251-bd06-8d0a451d30f7" />

## Development

### Install Dependencies

```sh
pnpm install
```

Notes:

- `pnpm install` automatically runs `prepare` and downloads `yt-dlp` / `Deno` / `ffmpeg` / `ffprobe` into `resources/bin/`.
- If the binaries already exist they are skipped.
- To force refresh the binaries: `pnpm prepare:video-downloader`

### Prepare Video Download Binaries (Manual)

```sh
pnpm prepare:video-downloader
```

This downloads the following into `resources/bin/`:

- `yt-dlp_macos`
- `deno-aarch64-apple-darwin`
- `deno-x86_64-apple-darwin`
- `ffmpeg-darwin-arm64`
- `ffprobe-darwin-arm64`
- `ffmpeg-darwin-x64`
- `ffprobe-darwin-x64`

Notes:

- These are bundled into the app via `electron-builder.extraResources`.
- `yt-dlp` automatically selects the matching `ffmpeg`/`ffprobe` for the current architecture when dealing with separate audio/video streams.
- Development overrides are supported via environment variables: `WALLPAPER_BOX_YT_DLP_PATH`, `WALLPAPER_BOX_DENO_PATH`, `WALLPAPER_BOX_FFMPEG_PATH`, `WALLPAPER_BOX_FFPROBE_PATH`.

### Local Development

Start both web and Electron:

```sh
pnpm dev
```

Separate terminals:

```sh
pnpm dev:web
pnpm dev:electron
```

Run Electron against a locally built bundle:

```sh
pnpm build:web
pnpm build:electron
pnpm electron:start
```

## Packaging

Build artifacts are written to the `out/` directory.

Architecture notes:

- `universal`: Single package supporting both Intel (x64) and Apple Silicon (arm64).
- `x64`: For older Intel Macs.
- `arm64`: For M1/M2/M3/M4 Macs.

```sh
# Recommended default (universal)
pnpm build

# Explicit universal build
pnpm build:mac:universal

# Intel only
pnpm build:mac:x64

# Apple Silicon only
pnpm build:mac:arm64

# DMG installer (universal)
pnpm build:dmg

# ZIP portable (universal)
pnpm build:zip
```

## FAQ

### 1. macOS says the app cannot be opened

The app is not Apple Developer signed. Run these commands in Terminal:

```sh
sudo spctl --master-disable
sudo xattr -r -d com.apple.quarantine /Applications/wallpaper-box.app
```

If the app is not in `/Applications`, replace the path with the actual `.app` location (drag the app from Finder into Terminal).

### 2. "This application is not supported on this Mac"

- Your macOS version is below `10.13`
- You downloaded the wrong architecture build

Prefer the default `universal` package. You can also build `x64` or `arm64` separately if needed.

### 3. AI generation returns `404 not found`

If using Zhipu BigModel, the current version supports both:

- `https://open.bigmodel.cn/api/paas/v4`
- `https://open.bigmodel.cn/api/paas/v4/images/generations`

Still failing? Check:

- API Key
- Model is set to `glm-image`
- No obvious typos in `API Base URL`

### 4. Custom AI size errors

`glm-image` custom width/height limits:

- Range: `512-2048`
- Both width and height must be multiples of `32`

Valid examples:

- `2048x1152`
- `2048x1280`
- `1792x1024`

## Directory Tips

- Static & AI wallpapers: `~/wallpaper-box`
- AI configuration: **AI Wallpaper** page → top-right **Settings** button

## Finally

If you find this project useful, please consider giving it a ⭐️ — thank you!

Contributions, issues, and PRs are very welcome.
