import { app } from 'electron'
import path from 'path'

function getAppBasePath() {
  return app.isPackaged ? process.resourcesPath : app.getAppPath()
}

export function getPublicAssetPath(...segments: string[]) {
  return path.join(getAppBasePath(), 'public', ...segments)
}
