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

export const fs = requireFromRenderer<typeof import('fs')>('fs')
export const ipcRenderer = electron.ipcRenderer
export const os = requireFromRenderer<typeof import('os')>('os')
export const path = requireFromRenderer<typeof import('path')>('path')
export const stream = requireFromRenderer<typeof import('stream')>('stream')
