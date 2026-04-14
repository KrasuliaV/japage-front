import { useState } from 'react'
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

export function ScreenRouter() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const setEmailAndToken = useAuthStore(s => s.setEmailAndToken)
  const setUserInfo = useAuthStore(s => s.setUserInfo)
  
  const currentScreen = useGameStore(s => s.currentScreen)
  const setScreen = useGameStore(s => s.setScreen)
  const setCharacter = useGameStore(s => s.setCharacter)
  const setCategories = useGameStore(s => s.setCategories)
  const initializeGame = useGameStore(s => s.initializeGame)

  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login')

  async function handleAuthSuccess(token: string, email: string) {
    setEmailAndToken(token, email)
    try {
      const userInfo = await validateToken()
      setUserInfo(userInfo)
      await initializeGame()
    } catch (err) {
      console.error('[Router] Failed to validate token:', err)
      setScreen('login')
    }
  }

  // 1. Auth Screens
  if (!isAuthenticated || currentScreen === 'login' || currentScreen === 'signup') {
    return authPage === 'login'
      ? <Login onNavigateToSignup={() => setAuthPage('signup')} onSuccess={handleAuthSuccess} />
      : <Signup onNavigateToLogin={() => setAuthPage('login')} onSuccess={handleAuthSuccess} />
  }

  // 2. Character Logic
  if (currentScreen === 'character-create' || currentScreen === 'character-select') {
    return (
      <CharacterCreate
        onSuccess={({ character, categories }) => {
          setCharacter(character)
          setCategories(categories)
          setScreen('overworld')
        }}
      />
    )
  }

  // 3. Main Game Loop (Overworld/Dungeon)
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