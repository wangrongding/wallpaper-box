import { spawn, execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { basename, isAbsolute, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import type { Connect, Plugin, ViteDevServer } from 'vite'

const clientModuleId = 'wallpaper-box-dev-inspect/client'
const resolvedClientModuleId = `\0${clientModuleId}`

const macLaunchEditorCandidates = [
  '/Applications/Cursor.app/Contents/MacOS/Cursor',
  '/Applications/Visual Studio Code.app/Contents/MacOS/Code',
  '/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Code - Insiders',
  '/Applications/VSCodium.app/Contents/MacOS/Electron',
  '/Applications/Zed.app/Contents/MacOS/zed',
  '/Applications/WebStorm.app/Contents/MacOS/webstorm',
]

const commandLaunchEditorCandidates = ['cursor', 'code-insiders', 'code', 'codium', 'vscodium', 'zed', 'webstorm']

function getRunningProcesses() {
  return execSync('ps x -o comm=', {
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString()
}

function commandExists(command: string) {
  try {
    execSync(`command -v ${command}`, {
      shell: '/bin/zsh',
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

function ensureLaunchEditor(command: string) {
  if (command !== 'serve' || process.platform !== 'darwin' || process.env.LAUNCH_EDITOR) {
    return
  }

  try {
    const runningProcesses = getRunningProcesses()
    const preferredEditor = macLaunchEditorCandidates.find((candidate) => existsSync(candidate) && runningProcesses.includes(candidate))

    if (preferredEditor) {
      process.env.LAUNCH_EDITOR = preferredEditor
    }
  } catch {
    // Keep explicit LAUNCH_EDITOR / command lookup as fallback.
  }
}

function resolveLaunchEditor() {
  if (process.env.LAUNCH_EDITOR) {
    return process.env.LAUNCH_EDITOR
  }

  if (process.platform === 'darwin') {
    try {
      const runningProcesses = getRunningProcesses()
      const preferredEditor = macLaunchEditorCandidates.find((candidate) => existsSync(candidate) && runningProcesses.includes(candidate))

      if (preferredEditor) {
        return preferredEditor
      }
    } catch {
      // Fall through to PATH lookup.
    }
  }

  return commandLaunchEditorCandidates.find((candidate) => commandExists(candidate)) ?? null
}

function parseOpenInEditorTarget(rawTarget: string, root: string) {
  const normalizedTarget = rawTarget.startsWith('file://') ? fileURLToPath(rawTarget) : rawTarget
  const match = normalizedTarget.match(/:(\d+)(?::(\d+))?$/)
  const fileName = (match ? normalizedTarget.slice(0, normalizedTarget.length - match[0].length) : normalizedTarget).replace(/^\/private/, '')

  return {
    columnNumber: match?.[2] ? Number(match[2]) : 1,
    fileName: isAbsolute(fileName) ? fileName : resolve(root, fileName),
    lineNumber: match?.[1] ? Number(match[1]) : 1,
  }
}

function getEditorArgs(editor: string, fileName: string, lineNumber: number, columnNumber: number) {
  switch (basename(editor).replace(/\.(exe|cmd|bat)$/i, '')) {
    case 'Code':
    case 'Code - Insiders':
    case 'code':
    case 'code-insiders':
    case 'codium':
    case 'cursor':
    case 'Electron':
    case 'VSCodium':
    case 'zed':
      return ['-r', '-g', `${fileName}:${lineNumber}:${columnNumber}`]
    case 'webstorm':
      return ['--line', String(lineNumber), '--column', String(columnNumber), fileName]
    default:
      return [fileName]
  }
}

function openInEditorMiddleware(root: string): Connect.NextHandleFunction {
  return (req, res) => {
    const requestUrl = req.url ? new URL(req.url, 'http://localhost') : null
    const rawTarget = requestUrl?.searchParams.get('file')

    if (!rawTarget) {
      res.statusCode = 400
      res.end('missing file query parameter')
      return
    }

    const editor = resolveLaunchEditor()
    if (!editor) {
      res.statusCode = 500
      res.end('no supported editor found; set LAUNCH_EDITOR explicitly')
      return
    }

    const { columnNumber, fileName, lineNumber } = parseOpenInEditorTarget(rawTarget, root)
    if (!existsSync(fileName)) {
      res.statusCode = 404
      res.end(`source file not found: ${fileName}`)
      return
    }

    try {
      const child = spawn(editor, getEditorArgs(editor, fileName, lineNumber, columnNumber), {
        detached: true,
        stdio: 'ignore',
      })

      child.unref()
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ editor, fileName, lineNumber, columnNumber }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[inspect] open-in-editor failed:', message)
      res.statusCode = 500
      res.end(message)
    }
  }
}

export function devInspectPlugin(): Plugin {
  let base = ''
  let clientCode: string | undefined
  let isServe = false
  let root = ''

  return {
    name: 'wallpaper-box:dev-inspect',
    configResolved(config) {
      base = config.base
      isServe = config.command === 'serve'
      root = config.root
      ensureLaunchEditor(config.command)
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__open-in-editor', openInEditorMiddleware(server.config.root))
    },
    load(id) {
      if (id !== resolvedClientModuleId || !isServe) {
        return null
      }

      if (!clientCode) {
        clientCode = readFileSync(join(__dirname, 'dev-inspect-client.js'), 'utf-8')
      }

      return clientCode.replace('__WBX_ROOT__', JSON.stringify(root)).replace('__WBX_BASE__', JSON.stringify(base))
    },
    resolveId(source) {
      if (source === clientModuleId) {
        return resolvedClientModuleId
      }

      return null
    },
    transform: {
      filter: { id: /jsx-dev-runtime\.js/u },
      handler(code) {
        if (!isServe) {
          return null
        }

        if (code.includes('_source')) {
          return code
        }

        const defineIndex = code.indexOf('"_debugInfo"')
        if (defineIndex === -1) {
          return null
        }

        const valueIndex = code.indexOf('value: null', defineIndex)
        if (valueIndex === -1) {
          return null
        }

        let nextCode = code.slice(0, valueIndex) + 'value: source' + code.slice(valueIndex + 11)
        if (code.includes('function ReactElement(type, key, self, source,')) {
          return nextCode
        }

        nextCode = nextCode.replace(/maybeKey,\s*isStaticChildren/gu, 'maybeKey, isStaticChildren, source')
        nextCode = nextCode.replace(/(\w+)?,\s*debugStack,\s*debugTask/gu, (match, previousArg) => {
          if (previousArg === 'source') {
            return match
          }

          return match.replace('debugTask', 'debugTask, source')
        })

        return nextCode
      },
    },
    transformIndexHtml() {
      if (!isServe) {
        return
      }

      return [
        {
          attrs: { type: 'module' },
          children: 'import "/@id/__x00__wallpaper-box-dev-inspect/client";',
          tag: 'script',
        },
      ]
    },
  }
}
