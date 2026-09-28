import { supportsOmarchyWallpaper } from './omarchy-wallpaper'
import { execFile as execFileCallback } from 'child_process'
import type { BrowserWindow } from 'electron'
import { promisify } from 'util'

const execFile = promisify(execFileCallback)

type HyprlandClient = {
  address?: unknown
  pid?: unknown
  mapped?: unknown
  floating?: unknown
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

// Omarchy's Super+T toggles this same Hyprland floating state. Target only our
// own window, so launching the app never changes whichever window has focus.
export async function floatWindowOnOmarchy(window: BrowserWindow, width: number, height: number) {
  if (!process.env.HYPRLAND_INSTANCE_SIGNATURE || !(await supportsOmarchyWallpaper())) return

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (window.isDestroyed()) return

    try {
      const { stdout } = await execFile('hyprctl', ['-j', 'clients'], { timeout: 1500 })
      const clients = JSON.parse(stdout) as HyprlandClient[]
      const client = clients.find(
        (item) =>
          item.pid === process.pid &&
          item.mapped === true &&
          typeof item.address === 'string' &&
          /^0x[0-9a-f]+$/i.test(item.address),
      )

      if (client) {
        if (client.floating) return
        const target = `address:${client.address}`
        let modernHyprland = true
        try {
          // Hyprland 0.55+ uses Lua dispatchers.
          await execFile('hyprctl', ['eval', `hl.dispatch(hl.dsp.window.float({ action = "set", window = "${target}" }))`], {
            timeout: 1500,
          })
        } catch {
          // Older Omarchy releases use the legacy dispatcher syntax.
          modernHyprland = false
          await execFile('hyprctl', ['dispatch', 'setfloating', target], { timeout: 1500 })
        }
        if (!window.isDestroyed()) {
          if (modernHyprland) {
            await execFile(
              'hyprctl',
              ['eval', `hl.dispatch(hl.dsp.window.resize({ x = ${width}, y = ${height}, relative = false, window = "${target}" }))`],
              { timeout: 1500 },
            )
            await execFile('hyprctl', ['eval', `hl.dispatch(hl.dsp.window.center({ window = "${target}" }))`], {
              timeout: 1500,
            })
          } else {
            await execFile('hyprctl', ['dispatch', 'resizewindowpixel', `exact ${width} ${height},${target}`], {
              timeout: 1500,
            })
          }
        }
        return
      }
    } catch (error) {
      if (attempt === 19) console.warn('Unable to float Wallpaper Box window on Omarchy:', error)
    }

    await wait(100)
  }

  console.warn('Wallpaper Box window did not appear in Hyprland client list')
}
