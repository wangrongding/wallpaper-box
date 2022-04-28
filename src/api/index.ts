import request from "@/utils/request";

// 获取wallhaven.cc的图片列表
export function getWallHavenAssets(data?: object) {
  return request.get(
    "https://wallhaven.cc/api/v1/search?apikey=SrJFwIqcWTCYMdRuSiF6LBzEqexFAuoB&sorting=favorites",
    { data },
  );
}
