import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { characterApi, playerApi } from '@/api/game'
import { validateToken } from '@/api/auth'
import { GameCanvas } from '@/components/GameCanvas'
import { HUD } from '@/components/hud/HUD'
import { BattleModal } from '@/components/battle/BattleModal'
import { BattleSummary } from '@/components/battle/BattleSummary'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { CharacterCreate } from '@/pages/CharacterCreate'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}

function AppInner() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isLoading       = useAuthStore(s => s.isLoading)
  const setEmailAndToken        = useAuthStore(s => s.setEmailAndToken)
  const setUserInfo     = useAuthStore(s => s.setUserInfo)
  const restoreSession  = useAuthStore(s => s.restoreSession)

  const currentScreen = useGameStore(s => s.currentScreen)
  const setScreen     = useGameStore(s => s.setScreen)
  const setCharacter  = useGameStore(s => s.setCharacter)
  const setPlayerId   = useGameStore(s => s.setPlayerId)

  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login')
    async function tryLoadCharacter() {
    try {
      const exists = await playerApi.existsByFirebaseUid()

      if (!exists) {
        setScreen('character-create')
        return
      }

      const player = await playerApi.getByFirebaseUid()
      setPlayerId(player.id)

      try {
        const character = await characterApi.getByPlayerId(player.id)
        setCharacter(character)
        setScreen('overworld')
      } catch {
        setScreen('character-create')
      }
    } catch (err) {
      console.error('[App] Failed to load player/character:', err)
      setScreen('character-create')
    }
  }

  useEffect(() => {
    restoreSession().then(async (restored) => {
      if (!restored) {
        setScreen('login')
        return
      }
      const { userInfo } = useAuthStore.getState()
      if (userInfo?.userId) {
        await tryLoadCharacter()
      } else {
        setScreen('login')
      }
    })
  }, [])



  async function handleAuthSuccess(token: string, email: string) {
    setEmailAndToken(token, email)
    try {
      const userInfo = await validateToken()
      setUserInfo(userInfo)
      await tryLoadCharacter()
    } catch (err) {
      console.error('[App] Failed to validate token after login:', err)
      setScreen('login')
    }
  }

  if (isLoading || currentScreen === 'loading') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--color-bg-deep)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 18,
            color: 'var(--color-accent)',
            textShadow: '0 0 20px var(--color-accent-glow)',
            letterSpacing: 4,
            marginBottom: 16,
          }}>
            CODE REALM
          </div>
          <div style={{
            fontSize: 9,
            color: 'var(--color-text-muted)',
            letterSpacing: 2,
          }}>
            LOADING...
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || currentScreen === 'login' || currentScreen === 'signup') {
    return authPage === 'login'
      ? (
        <Login
          onNavigateToSignup={() => setAuthPage('signup')}
          onSuccess={handleAuthSuccess}
        />
      )
      : (
        <Signup
          onNavigateToLogin={() => setAuthPage('login')}
          onSuccess={handleAuthSuccess}
        />
      )
  }

  if (currentScreen === 'character-create' || currentScreen === 'character-select') {
    return (
      <CharacterCreate
        onSuccess={(character) => {
          setCharacter(character)
          setScreen('overworld')
        }}
      />
    )
  }

  // ── Main game ─────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <GameCanvas />
      <HUD />
      <BattleModal />
      <BattleSummary />
    </div>
  )
}
