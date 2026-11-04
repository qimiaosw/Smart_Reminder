import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { handleMockRequest } from '../mock/handlers'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

if (USE_MOCK) {
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const method = (config.method || 'get').toLowerCase()
    const url = config.url || ''
    const params = config.params
    const data = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : undefined

    const mockResult = await handleMockRequest(method, url, params, data)
    if (mockResult !== null) {
      // Override adapter to return mock data - this prevents real HTTP calls
      config.adapter = () =>
        Promise.resolve({
          data: mockResult,
          status: 200,
          statusText: 'OK',
          headers: {} as Record<string, string>,
          config,
        })
    }
    return config
  })

  api.interceptors.response.use(
    (res) => res.data,
    (err) => {
      const msg = err.response?.data?.msg || '请求失败'
      console.error(msg)
      return Promise.reject(err)
    }
  )
} else {
  api.interceptors.response.use(
    (res) => res.data,
    (err) => {
      const msg = err.response?.data?.msg || '请求失败'
      console.error(msg)
      return Promise.reject(err)
    }
  )
}

export default api
