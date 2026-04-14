import { create } from 'zustand'
import { tokenStore } from '@/api/client'
import { logout as logoutApi, refreshToken, validateToken } from '@/api/auth'
import type { UserInfo } from '@/types'
import { useGameStore } from './gameStore'

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

    try {
      console.log('[Auth] 🚪 Logout initiated')

      // Attempt backend logout (non-critical)
      try {
        await logoutApi()
        console.log('[Auth] ✓ Backend logout succeeded')
      } catch (err) {
        console.warn('[Auth] ⚠ Backend logout failed (non-blocking):',
          (err as any)?.response?.status)
      }

      // Always clear client state
      tokenStore.clear()
      useGameStore.getState().reset()
      useGameStore.getState().setScreen('login')  // ← Force login screen

      set({
        token: null,
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      })

      console.log('[Auth] ✓ Logout complete')
    } finally {
      isLoggingOut = false
    }
  },

  // logout: async () => {
  //   try {
  //     // Attempt to notify backend, but don't fail if it errors
  //     await logoutApi()
  //     console.log('[Auth] Backend logout succeeded')
  //   } catch (err) {
  //     console.warn('[Auth] Backend logout failed (non-blocking):', err)
  //     // Continue anyway — client-side cleanup is what matters
  //   } finally {
  //     tokenStore.clear()
  //     const gameState = useGameStore.getState()
  //     gameState.reset()
  //     gameState.setScreen('login')
  //     set({
  //       token: null,
  //       userInfo: null,
  //       isAuthenticated: false,
  //       isLoading: false,
  //     })
  //     console.log('[Auth] Logout complete')
  //   }
  // },

  // Called on app load — tries to restore session via cookie
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

// Listen for auth:logout events dispatched by axios interceptor
// window.addEventListener('auth:logout', () => {
//   useAuthStore.getState().logout()
// })
window.addEventListener('auth:logout', () => {
  const { isAuthenticated } = useAuthStore.getState()
  if (isAuthenticated) {
    console.log('[Auth] 🔐 401 interceptor triggered logout')
    useAuthStore.getState().logout()
  }
})
