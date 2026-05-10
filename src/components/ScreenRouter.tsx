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

    // One GameCanvas instance for the whole app lifetime. Kaplay binds to a specific
    // DOM canvas; if GameCanvas unmounted/remounted across router branches, the
    // singleton would keep rendering to a detached canvas (black screen after logout→login).
    let overlay: React.ReactNode

    if (!isAuthenticated || currentScreen === 'login' || currentScreen === 'signup') {
        overlay = (
            <>
                {authPage === 'login'
                    ? <Login onNavigateToSignup={() => setAuthPage('signup')} onSuccess={handleAuthSuccess} />
                    : <Signup onNavigateToLogin={() => setAuthPage('login')} onSuccess={handleAuthSuccess} />
                }
            </>
        )
    } else if (currentScreen === 'character-create' || currentScreen === 'character-select') {
        overlay = (
            <CharacterCreate onSuccess={({ character, categories }) => {
                setCharacter(character)
                setCategories(categories)
                setScreen('overworld')
            }} />
        )
    } else {
        overlay = (
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
                <HUD />
                <BattleModal />
                <BattleSummary />
                <ChestModal />
                <ChestRewardModal />
            </div>
        )
    }

    return (
        <>
            {/* display:none when not on a game screen — see GameCanvas */}
            <GameCanvas />
            {overlay}
        </>
    )
}
