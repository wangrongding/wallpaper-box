import axios from "axios";
import { message } from "antd";

// 创建axios实例
const request = axios.create({
  timeout: 15000, // 请求超时时间
});
// request请求拦截器
request.interceptors.request.use(
  (config) => {
    const { data = {}, method } = config;
    // if (method === "post") {
    //   config.data = data.data;
    // } else if (method === "get" || method === "delete") {
    //   config.params = data;
    // } else if (method === "put") {
    //   config.data = { ...data.data };
    // }
    switch (method) {
      case "post":
        config.data = data.data;
        break;
      case "get":
        config.params = data;
        break;
      case "delete":
        config.params = data;
        break;
      case "put":
        config.data = { ...data.data };
        break;
      default:
        break;
    }
    return config;
  },
  (error) => {
    return error;
  },
);

// 请求成功回调
async function successCallback(res: any) {
  const { data } = res;
  return Promise.resolve(data);
}

// 请求错误回调
function errorCallback(error: any) {
  message.info(error);
  return Promise.reject(error);
}
// response返回拦截器
request.interceptors.response.use(successCallback, errorCallback);
export default request;
