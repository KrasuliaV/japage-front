import { create } from 'zustand'
import { tokenStore } from '@/api/client'
import { logout as logoutApi, refreshToken, validateToken } from '@/api/auth'
import type { UserInfo } from '@/types'

interface AuthState {
  token: string | null
  email: string | null
  userInfo: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setEmailAndToken: (token: string, email: string) => void
  setUserInfo: (info: UserInfo) => void
  logout: () => Promise<void>
  restoreSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  email: null,
  userInfo: null,
  isAuthenticated: false,
  isLoading: true,

  setEmailAndToken: (token, email) => {
    tokenStore.set(token)
    set({ token, email, isAuthenticated: true, isLoading: false })
  },
  
  setUserInfo: (userInfo) => {
    set({ userInfo })
  },

  logout: async () => {
    try {
      await logoutApi()
    } finally {
      tokenStore.clear()
      set({
        token: null,
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  // Called on app load — tries to restore session via cookie
  restoreSession: async () => {
    set({ isLoading: true })
    try {
      await refreshToken()
      const userInfo = await validateToken()
      set({
        userInfo,
        isAuthenticated: true,
        isLoading: false,
      })
      return true
    } catch {
      set({
        token: null,
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      })
      return false
    }
  },
}))

// Listen for auth:logout events dispatched by axios interceptor
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout()
})
