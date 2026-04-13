import axios, { AxiosError } from 'axios'
import type { ErrorResponse } from '@/types'

// ============================================================
// Auth API client — talks to auth_proxy (port 8082)
// ============================================================
export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BASE_URL,
  withCredentials: true,          // always send cookies
  headers: {
    'Content-Type': 'application/json',
    [import.meta.env.VITE_APP_HEADER]: import.meta.env.VITE_APP_NAME,
  },
})

// ============================================================
// Game API client — talks to game backend (port 8080)
// ============================================================
export const gameApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    [import.meta.env.VITE_APP_HEADER]: import.meta.env.VITE_APP_NAME,
  },
})

// ============================================================
// Token store — keeps access token in memory (not localStorage)
// Mirrors your previous AuthContext pattern
// ============================================================
let accessToken: string | null = null

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token
    console.log('Token saved: ' + accessToken)
  },
  clear: () => {
    accessToken = null
  },
}

// ============================================================
// Game API interceptors
// ============================================================

// Request — attach Bearer token to every game API call
gameApi.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response — handle 401 by attempting token refresh
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

gameApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        // Queue requests that come in while refresh is in progress
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(gameApi(originalRequest))
            }
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt token refresh via auth_proxy
        const response = await authApi.post<string>(
          `${import.meta.env.VITE_TOKEN_PATH}/refresh`
        )
        const newToken = response.data
        tokenStore.set(newToken)

        // Flush queued requests
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        // Retry original request
        if (originalRequest) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return gameApi(originalRequest)
        }
      } catch {
        // Refresh failed — clear token and redirect to login
        tokenStore.clear()
        refreshQueue = []
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Auth API response — capture new token from refresh responses
authApi.interceptors.response.use((response) => {
  // Auth endpoints return the access token as plain text in the body
  if (
    typeof response.data === 'string' &&
    response.data.length > 0 &&
    response.config.url?.includes('/login') ||
    response.config.url?.includes('/refresh')
  ) {
    tokenStore.set(response.data)
  }
  return response
})
