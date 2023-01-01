import { nativeImage } from 'electron'
import * as path from 'path'

// 创建原生图像
export function createNativeImage(path: string) {
  return nativeImage.createFromPath(path).resize({ width: 30, height: 28 })
}

export const trays = {
  runcat: [
    createNativeImage(path.join(__dirname, '../public/icons/runcat/0.png')),
    createNativeImage(path.join(__dirname, '../public/icons/runcat/1.png')),
    createNativeImage(path.join(__dirname, '../public/icons/runcat/2.png')),
    createNativeImage(path.join(__dirname, '../public/icons/runcat/3.png')),
    createNativeImage(path.join(__dirname, '../public/icons/runcat/4.png')),
  ],
  mario: [
    createNativeImage(path.join(__dirname, '../public/icons/mario/0.png')),
    createNativeImage(path.join(__dirname, '../public/icons/mario/1.png')),
    createNativeImage(path.join(__dirname, '../public/icons/mario/2.png')),
  ],
  mona: [
    createNativeImage(path.join(__dirname, '../public/icons/mona/0.png')),
    createNativeImage(path.join(__dirname, '../public/icons/mona/1.png')),
    createNativeImage(path.join(__dirname, '../public/icons/mona/2.png')),
    createNativeImage(path.join(__dirname, '../public/icons/mona/3.png')),
    createNativeImage(path.join(__dirname, '../public/icons/mona/4.png')),
    createNativeImage(path.join(__dirname, '../public/icons/mona/5.png')),
    createNativeImage(path.join(__dirname, '../public/icons/mona/6.png')),
  ],
  partyBlobCat: [
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/0.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/1.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/2.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/3.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/4.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/5.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/6.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/7.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/8.png')),
    createNativeImage(path.join(__dirname, '../public/icons/partyBlobCat/9.png')),
  ],
  points: [
    createNativeImage(path.join(__dirname, '../public/icons/points/1.png')),
    createNativeImage(path.join(__dirname, '../public/icons/points/2.png')),
    createNativeImage(path.join(__dirname, '../public/icons/points/3.png')),
    createNativeImage(path.join(__dirname, '../public/icons/points/4.png')),
    createNativeImage(path.join(__dirname, '../public/icons/points/5.png')),
    createNativeImage(path.join(__dirname, '../public/icons/points/6.png')),
    createNativeImage(path.join(__dirname, '../public/icons/points/7.png')),
    createNativeImage(path.join(__dirname, '../public/icons/points/8.png')),
  ],
  runcatX: [
    createNativeImage(path.join(__dirname, '../public/icons/runcatX/0.png')),
    createNativeImage(path.join(__dirname, '../public/icons/runcatX/1.png')),
    createNativeImage(path.join(__dirname, '../public/icons/runcatX/2.png')),
    createNativeImage(path.join(__dirname, '../public/icons/runcatX/3.png')),
    createNativeImage(path.join(__dirname, '../public/icons/runcatX/4.png')),
  ],
}
