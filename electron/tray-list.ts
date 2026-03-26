import { getPublicAssetPath } from './paths'
import { nativeImage } from 'electron'
import fs from 'fs'

// 创建原生图像
export function createNativeImage(val: string) {
  const assetPath = getPublicAssetPath(val)

  if (!fs.existsSync(assetPath)) {
    console.warn(`[tray] icon not found: ${assetPath}`)
    return nativeImage.createEmpty()
  }

  return nativeImage.createFromPath(assetPath).resize({ height: 24 })
}

export const trays = {
  runcat: [
    createNativeImage('icons/runcat/0.png'),
    createNativeImage('icons/runcat/1.png'),
    createNativeImage('icons/runcat/2.png'),
    createNativeImage('icons/runcat/3.png'),
    createNativeImage('icons/runcat/4.png'),
  ],
  mario: [createNativeImage('icons/mario/0.png'), createNativeImage('icons/mario/1.png'), createNativeImage('icons/mario/2.png')],
  mona: [
    createNativeImage('icons/mona/0.png'),
    createNativeImage('icons/mona/1.png'),
    createNativeImage('icons/mona/2.png'),
    createNativeImage('icons/mona/3.png'),
    createNativeImage('icons/mona/4.png'),
    createNativeImage('icons/mona/5.png'),
    createNativeImage('icons/mona/6.png'),
  ],
  partyBlobCat: [
    createNativeImage('icons/partyBlobCat/0.png'),
    createNativeImage('icons/partyBlobCat/1.png'),
    createNativeImage('icons/partyBlobCat/2.png'),
    createNativeImage('icons/partyBlobCat/3.png'),
    createNativeImage('icons/partyBlobCat/4.png'),
    createNativeImage('icons/partyBlobCat/5.png'),
    createNativeImage('icons/partyBlobCat/6.png'),
    createNativeImage('icons/partyBlobCat/7.png'),
    createNativeImage('icons/partyBlobCat/8.png'),
    createNativeImage('icons/partyBlobCat/9.png'),
  ],
  points: [
    createNativeImage('icons/points/1.png'),
    createNativeImage('icons/points/2.png'),
    createNativeImage('icons/points/3.png'),
    createNativeImage('icons/points/4.png'),
    createNativeImage('icons/points/5.png'),
    createNativeImage('icons/points/6.png'),
    createNativeImage('icons/points/7.png'),
    createNativeImage('icons/points/8.png'),
  ],
  runcatX: [
    createNativeImage('icons/runcatX/0.png'),
    createNativeImage('icons/runcatX/1.png'),
    createNativeImage('icons/runcatX/2.png'),
    createNativeImage('icons/runcatX/3.png'),
    createNativeImage('icons/runcatX/4.png'),
  ],
}
