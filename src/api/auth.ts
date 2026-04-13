import { authApi, tokenStore } from './client'
import type { LoginRequest, UserInfo } from '@/types'

const AUTH_PATH  = import.meta.env.VITE_AUTH_PATH   // /api/auth
const TOKEN_PATH = import.meta.env.VITE_TOKEN_PATH  // /api/token

// ============================================================
// Login — POST /api/auth/login
// Returns access token as plain string body
// Sets HttpOnly cookie (token_session) via Set-Cookie header
// ============================================================
export async function login(data: LoginRequest): Promise<string> {
  const response = await authApi.post<string>(`${AUTH_PATH}/login`, data)
  const token = response.data
  tokenStore.set(token)
  return token
}

// ============================================================
// Signup — POST /api/users
// Creates user in Firebase and logs in immediately
// ============================================================
export async function signup(data: LoginRequest): Promise<string> {
  const response = await authApi.post<string>('/api/users', data)
  const token = response.data
  tokenStore.set(token)
  return token
}

// ============================================================
// Logout — POST /api/auth/logout
// Clears cookie on server side
// ============================================================
export async function logout(): Promise<void> {
  try {
    await authApi.post(`${AUTH_PATH}/logout`)
  } finally {
    tokenStore.clear()
  }
}

// ============================================================
// Validate — GET /api/token/validate
// Returns userId and roles
// Used on app load to restore session
// ============================================================
export async function validateToken(): Promise<UserInfo> {
  const token = tokenStore.get()
  const response = await authApi.get<UserInfo>(`${TOKEN_PATH}/validate`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return response.data
}

// ============================================================
// Refresh — POST /api/token/refresh
// Uses HttpOnly cookie, returns new access token
// ============================================================
export async function refreshToken(): Promise<string> {
  const response = await authApi.post<string>(`${TOKEN_PATH}/refresh`)
  const token = response.data
  tokenStore.set(token)
  return token
}
