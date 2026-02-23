import axios from 'axios'
import { toast } from 'sonner'

// 创建axios实例
const request = axios.create({
  timeout: 15000, // 请求超时时间
})
// request请求拦截器
request.interceptors.request.use(
  (config: any) => {
    const { data = {}, method } = config
    switch (method) {
      case 'post':
        config.data = data.data
        break
      case 'get':
        config.params = data
        break
      case 'delete':
        config.params = data
        break
      case 'put':
        config.data = { ...data.data }
        break
      default:
        break
    }
    return config
  },
  (error: any) => {
    return error
  },
)

// 请求成功回调
async function successCallback(res: any) {
  const { data } = res
  return Promise.resolve(data)
}

// 请求错误回调
function errorCallback(error: any) {
  toast.error(error?.message || '请求出错')
  return Promise.reject(error)
}
// response返回拦截器
request.interceptors.response.use(successCallback, errorCallback)
export default request
