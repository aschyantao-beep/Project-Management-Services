import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // 如果响应成功但业务逻辑失败
    if (!data.success && data.error) {
      ElMessage.error(data.error)
      return Promise.reject(new Error(data.error))
    }
    
    // 显示成功消息
    if (data.message) {
      ElMessage.success(data.message)
    }
    
    return data
  },
  (error) => {
    // 网络错误处理
    if (error.message === 'Network Error') {
      ElMessage.error('网络连接失败，请检查网络连接')
    } else if (error.response?.status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request