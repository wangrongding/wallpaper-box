import { app } from 'electron'
import os from 'os'
import path from 'path'

function getDevelopmentProjectRoot() {
  const appPath = app.getAppPath()

  if (path.basename(appPath) === 'dist-electron') {
    return path.resolve(appPath, '..')
  }

  return appPath
}

function getResourceBasePath() {
  return app.isPackaged ? process.resourcesPath : getDevelopmentProjectRoot()
}

export function getPublicAssetPath(...segments: string[]) {
  return path.join(getResourceBasePath(), 'public', ...segments)
}

export function getBundledBinaryPath(...segments: string[]) {
  if (app.isPackaged) {
    return path.join(getResourceBasePath(), 'bin', ...segments)
  }

  return path.join(getDevelopmentProjectRoot(), 'resources', 'bin', ...segments)
}

export function getWallpaperRootPath() {
  return path.join(os.homedir(), 'wallpaper-box')
}

export function getWallpaperVideoDirectory() {
  return path.join(getWallpaperRootPath(), 'videos')
}
