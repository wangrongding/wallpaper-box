import fs from 'fs'
import http from 'http'
import https from 'https'

interface Options {
  url: string
  dest: string
  [key: string]: any
}

export function downloadImage({ url, dest, ...options }: Options): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = url.trimLeft().startsWith('https') ? https : http

    request
      .get(url, options, (res) => {
        if (res.statusCode !== 200) {
          // Consume response data to free up memory
          res.resume()
          reject(new Error('Request Failed.\n' + `Status Code: ${res.statusCode}`))
          return
        }

        res
          .pipe(fs.createWriteStream(dest))
          .on('error', reject)
          .once('close', () => resolve(dest))
      })
      .on('timeout', () => reject(new Error('Request timed out')))
      .on('error', reject)
  })
}

/**
 * 在本地进行文件保存
 * @param {String} data 要保存到本地的图片数据
 * @param {String} filename 文件名
 */
export function saveFile(data: any, filename: string, cors: boolean = false) {
  if (cors) {
    // 同源
    const save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a') as HTMLAnchorElement
    save_link.href = data
    save_link.download = filename
    const event = document.createEvent('MouseEvents')
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    save_link.dispatchEvent(event)
  } else {
    //不同源
    const x = new window.XMLHttpRequest()
    x.open('GET', data, true)
    x.responseType = 'blob'
    x.onload = () => {
      const url = window.URL.createObjectURL(x.response)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
    }
    x.send()
  }
}

// 图片转base64
const convertToBase64 = (img: HTMLImageElement) => {
  let canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  let context = canvas.getContext('2d')!
  context.drawImage(img, 0, 0)
  let dataURL = canvas.toDataURL('image/jpg')
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, '')
}
