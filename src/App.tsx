import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { validateToken } from '@/api/auth'
import { GameCanvas } from '@/components/GameCanvas'
import { HUD } from '@/components/hud/HUD'
import { BattleModal } from '@/components/battle/BattleModal'
import { BattleSummary } from '@/components/battle/BattleSummary'
import { ChestModal } from '@/components/chest/ChestModal'
import { ChestRewardModal } from '@/components/chest/ChestRewardModal'
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
  console.log('[App] AppInner render. currentScreen:', useGameStore(s => s.currentScreen))
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isLoading = useAuthStore(s => s.isLoading)
  const setEmailAndToken = useAuthStore(s => s.setEmailAndToken)
  const setUserInfo = useAuthStore(s => s.setUserInfo)
  const restoreSession = useAuthStore(s => s.restoreSession)

  const currentScreen = useGameStore(s => s.currentScreen)
  const setScreen = useGameStore(s => s.setScreen)
  const setCharacter = useGameStore(s => s.setCharacter)
  const initializeGame = useGameStore(s => s.initializeGame);

  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login')

  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    // This runs ONCE on mount
    const boot = async () => {
      console.log('[App] 🚀 Boot started')
      try {
        const user = await restoreSession();
        console.log('[App] ✓ Session restored:', user?.userId)
        if (user?.userId) {
          console.log('[App] 🎮 Initializing game...')
          await initializeGame();
          console.log('[App] ✓ Game initialized. Screen:', useGameStore.getState().currentScreen)
        } else {
          setScreen('login')
        }
      } catch (err) {
        console.error('[App] Boot failed:', err)
        setScreen('login')
      }
    };
    boot();
  }, []);

  async function handleAuthSuccess(token: string, email: string) {
    setEmailAndToken(token, email)
    try {
      const userInfo = await validateToken()
      setUserInfo(userInfo)
      // await tryLoadCharacter()
      await initializeGame()
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
      <ChestModal />
      <ChestRewardModal />
    </div>
  )
}
