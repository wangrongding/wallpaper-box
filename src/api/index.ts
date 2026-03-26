import { buildWallhavenSearchUrl } from '@/lib/wallhaven'
import request from '@/utils/request'

// 获取wallhaven.cc的图片列表
export function getWallHavenAssets(data?: object & { apiKey?: string }) {
  return request.get(buildWallhavenSearchUrl({ apiKey: data?.apiKey }), { data })
}

// 获取 bing 壁纸列表
export function getBingAssets(data?: object) {
  return request.get('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8', { data })
}

// 获取必应每日壁纸
export function getBingDailyAssets(data?: object) {
  return request.get('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1', { data })
}
