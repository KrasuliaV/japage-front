import { useEffect, useRef } from 'react'
import { initKaplay, SCENES } from '@/game/kaplay'
import { registerOverworldScene } from '@/game/scenes/overworld'
import { registerDungeonScenes } from '@/game/scenes/dungeon'
import { useGameStore } from '@/stores/gameStore'

// ============================================================
// GameCanvas
// Mounts the Kaplay canvas and initializes all scenes.
// Lives behind the React UI overlay (z-index: 0).
// React UI sits on top (z-index: 10+).
// ============================================================

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const initialized = useRef(false)
  const currentScreen = useGameStore(s => s.currentScreen)

  useEffect(() => {
    if (!canvasRef.current || initialized.current) return
    initialized.current = true

    const k = initKaplay(canvasRef.current)

    // Register all scenes
    registerOverworldScene(k)
    registerDungeonScenes(k)

    // Start at overworld
    k.go(SCENES.OVERWORLD)

    // Handle dungeon entrance collision from overworld
    // This is set up here so k is in scope
    k.onCollide('player', 'dungeon-entrance', (_player, entrance) => {
      const zone = (entrance as unknown as { zone: string }).zone
      const sceneName = `dungeon-${zone.toLowerCase()}`
      useGameStore.getState().enterZone(zone)
      k.go(sceneName)
    })

    return () => {
      // Kaplay doesn't have a destroy — just let the canvas unmount
    }
  }, [])

  // Hide canvas on non-game screens (login, character create, etc.)
  const isGameScreen = ['overworld', 'dungeon', 'battle'].includes(currentScreen)

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: isGameScreen ? 'block' : 'none',
        imageRendering: 'pixelated',
      }}
    />
  )
}
