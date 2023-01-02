import { Button } from 'antd'
import { ipcRenderer } from 'electron'

// 设置动态壁纸
const setLiveWallpaper = async (filePath: string) => {
  ipcRenderer.send('create-live-wallpaper', filePath)
}
export default function LiveWallpaper() {
  // 选择视频文件时触发
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('🚀🚀🚀 / file', file?.path)
    // 选择视频文件后，设置为壁纸
    // file && setLiveWallpaper(file.path)
    file && ipcRenderer.send('change-live-wallpaper', file.path)
    // if (file) {
    //   const url = URL.createObjectURL(file)
    //   console.log(url)
    // }
  }
  return (
    <div className='live-wallpaper-page grid content-center'>
      <h1>视频壁纸</h1>

      {/* 选择本地视频文件 */}
      <input type='file' accept='video/*' onChange={handleFileChange} />

      <Button type='default' onClick={() => setLiveWallpaper('/Users/wangrongding/Downloads/8531378176615536773332883595.mp4')}>
        设置为视频壁纸
      </Button>
    </div>
  )
}
