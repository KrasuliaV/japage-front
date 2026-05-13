import { create } from 'zustand'
import { tokenStore } from '@/api/client'
import { logout as logoutApi, refreshToken, validateToken } from '@/api/auth'
import type { UserInfo } from '@/types'
import { useGameStore } from './gameStore'
import { safeResetScene } from '@/game/kaplay'

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
  // restoreSession: () => Promise<boolean>
  restoreSession: () => Promise<UserInfo | null>
}

let isLoggingOut = false

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
    if (isLoggingOut) {
      console.warn('[Auth] Logout already in progress')
      return
    }

    isLoggingOut = true

    const sessionTokenAtLogoutStart = get().token

    try {
      await logoutApi()
    } catch (err) {
      console.warn('[Auth] ⚠ Backend logout failed (non-blocking):', err)
    } finally {
      isLoggingOut = false
    }

    const currentToken = get().token
    if (currentToken !== sessionTokenAtLogoutStart && currentToken !== null) {
      console.warn('[Auth] ⚠ New session detected during logout — aborting state clear')
      return
    }

    safeResetScene()
    tokenStore.clear()
    useGameStore.getState().reset()
    useGameStore.getState().setScreen('login')

    set({
      token: null,
      userInfo: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  restoreSession: async () => {
    set({ isLoading: true })
    try {
      const newToken = await refreshToken()
      const userInfo = await validateToken()
      set({
        userInfo,
        token: newToken,
        isAuthenticated: true,
        isLoading: false,
      })
      return userInfo;
    } catch {
      set({
        token: null,
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      })
      return null;
    }
  },
}))

window.addEventListener('auth:logout', () => {
  const { isAuthenticated } = useAuthStore.getState()
  if (isAuthenticated) {
    useAuthStore.getState().logout()
  }
})
