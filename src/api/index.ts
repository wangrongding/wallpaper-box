import request from "@/utils/request";

// 获取wallhaven.cc的图片列表
export function getWallHavenAssets(data?: object) {
  return request.get(
    // "https://wallhaven.cc/api/v1/search?q=yellow&apikey=SrJFwIqcWTCYMdRuSiF6LBzEqexFAuoB&page=1&purity=111&categories=111",
    "https://wallhaven.cc/api/v1/search?apikey=SrJFwIqcWTCYMdRuSiF6LBzEqexFAuoB&sorting=toplist&page=1&purity=000&categories=000",
    { data },
  );
}
