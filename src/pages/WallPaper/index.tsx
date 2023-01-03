import { ipcRenderer } from 'electron'
import path from 'path'
import fs from 'fs'
import stream, { Readable } from 'stream'

// 将node 可读流转换成blob对象
function streamToBlob(stream: any) {
  return new Promise((resolve, reject) => {
    const chunks: any[] = []
    stream.on('data', (chunk: any) => {
      chunks.push(chunk)
    })
    stream.on('end', () => {
      const blob = new Blob(chunks)
      resolve(blob)
    })
    stream.on('error', (err: any) => {
      reject(err)
    })
  })
}

// 将buffer数据转换成node 可读流
function bufferToStream(binary: any) {
  const readableInstanceStream = new stream.Readable({
    read() {
      this.push(binary)
      this.push(null)
    },
  })

  return readableInstanceStream
}

export default function WallPaperPage() {
  const [videoPath, setVideoPath] = useState('')
  // 更换壁纸
  ipcRenderer.on('change-live-wallpaper', (event, arg) => {
    loadFile(arg)
  })

  // 读取文件
  const loadFile = async (filePath: string) => {
    // let songName = path.basename(filePath)
    // console.log("🚀🚀🚀 / songName", songName);
    let buffer = fs.readFileSync(filePath) //读取文件，并将缓存区进行转换
    let stream = bufferToStream(buffer) //将buffer数据转换成node 可读流
    streamToBlob(stream)
      .then((res: any) => {
        //将blob对象转成blob链接
        let blobPath = window.URL.createObjectURL(res)
        console.log('🚀🚀🚀 / blobPath', blobPath)
        setVideoPath(blobPath)
      })
      .catch((err) => {
        console.log(err)
      })
  }
  return (
    <div className='h-[100vh] w-[100vw] overflow-hidden m-[0px] p-[0px]'>
      {/* <video className='text-white object-cover h-full w-full' src='https://assets.fedtop.com/home.mp4' autoPlay loop muted></video> */}
      {/* <video className='text-white object-cover h-full w-full' src='https://assets.fedtop.com/bike.mp4' autoPlay loop muted></video> */}

      <video className='text-white object-cover h-full w-full' src={videoPath || 'https://assets.fedtop.com/bike.mp4'} autoPlay loop muted></video>
    </div>
  )
}
