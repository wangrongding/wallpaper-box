type RendererRequire = <T = unknown>(moduleId: string) => T

type RendererStore = {
  delete: (key: string) => void
  get: (key: string) => any
  set: (key: string, value: unknown) => void
}

type RendererStoreConstructor = new () => RendererStore

function getRendererRequire() {
  const runtimeRequire = (globalThis as typeof globalThis & { require?: RendererRequire }).require

  if (typeof runtimeRequire !== 'function') {
    throw new Error('Electron renderer require is unavailable in the current window.')
  }

  return runtimeRequire
}

export function requireFromRenderer<T = unknown>(moduleId: string) {
  return getRendererRequire()<T>(moduleId)
}

export function createStore() {
  const ElectronStore = requireFromRenderer<RendererStoreConstructor>('electron-store')
  return new ElectronStore()
}

const electron = requireFromRenderer<typeof import('electron')>('electron')
const { pathToFileURL } = requireFromRenderer<typeof import('url')>('url')

export const fs = requireFromRenderer<typeof import('fs')>('fs')
export const ipcRenderer = electron.ipcRenderer
export const os = requireFromRenderer<typeof import('os')>('os')
export const path = requireFromRenderer<typeof import('path')>('path')
export const stream = requireFromRenderer<typeof import('stream')>('stream')
export const webUtils = electron.webUtils

type RendererFileUrlSearchValue = boolean | number | string | null | undefined

export function getRendererFilePath(file?: File | null) {
  if (!file) {
    return ''
  }

  const resolvedPath = webUtils?.getPathForFile(file)
  if (resolvedPath) {
    return resolvedPath
  }

  const legacyFile = file as File & { path?: string }
  return typeof legacyFile.path === 'string' ? legacyFile.path : ''
}

export function toRendererFileUrl(targetPath?: string | null, searchParams?: Record<string, RendererFileUrlSearchValue>) {
  if (!targetPath) {
    return ''
  }

  const nextUrl = pathToFileURL(targetPath)

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null) {
        continue
      }

      nextUrl.searchParams.set(key, String(value))
    }
  }

  return nextUrl.href
}
