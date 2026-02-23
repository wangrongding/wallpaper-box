import { app } from 'electron'
import fs from 'fs-extra'
import path from 'path'

// 应用配置和持久化
export const appConfig = () => {
  const userDataPath = app.getPath('userData')
  const configPath = path.join(userDataPath, 'wallpaper-box-config.json')
  const config = fs.readJsonSync(configPath, { throws: false }) || {}
  return {
    get: (key: string) => config[key],
    set: (key: string, value: any) => {
      config[key] = value
      fs.writeJsonSync(configPath, config)
    },
  }
}
