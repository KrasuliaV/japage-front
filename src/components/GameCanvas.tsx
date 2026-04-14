import { useEffect, useRef } from 'react'
import type kaplay from 'kaplay'
import { initKaplay, getKaplayInstance, SCENES } from '@/game/kaplay'
import { registerOverworldScene } from '@/game/scenes/overworld'
import { registerDungeonScenes } from '@/game/scenes/sceneInitializer'
import { loadZoneAssets } from '@/game/assets/assetLoader'
import type { ZoneName } from '@/game/assets/zoneAssets'
import { useGameStore } from '@/stores/gameStore'

type KCtx = ReturnType<typeof kaplay>

async function navigateTo(
  k: KCtx,
  currentScreen: string,
  targetCave: ReturnType<typeof useGameStore.getState>['targetCave'],
  categories: ReturnType<typeof useGameStore.getState>['categories']
) {
  if (currentScreen === 'overworld') {
    console.log('[GameCanvas] → navigating to overworld')
    k.go(SCENES.OVERWORLD)
    return
  }

  if (currentScreen === 'dungeon' && targetCave) {
    const { setZoneLoading } = useGameStore.getState()
    try {
      setZoneLoading(true, targetCave.zone)
      await loadZoneAssets(k, targetCave.zone as ZoneName)

      const pattern = categories
        .find(cat => cat.name === targetCave.zone)
        ?.patterns.find(p => p.id === targetCave.patternId)

      console.log(`[GameCanvas] → navigating to dungeon: ${targetCave.zone}, pattern: ${pattern?.sequenceNumber}, cave: ${targetCave.caveNumber}`)
      k.go('dungeon-run', targetCave.zone, pattern?.sequenceNumber, targetCave.caveNumber)
    } catch (err) {
      console.error('[GameCanvas] Failed to load zone assets:', err)
    } finally {
      setZoneLoading(false)
    }
  }
}
// ============================================================
// GameCanvas
// Mounts the Kaplay canvas and initializes all scenes.
// Lives behind the React UI overlay (z-index: 0).
// React UI sits on top (z-index: 10+).
// ============================================================

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scenesReadyRef = useRef(false)

  const currentScreen = useGameStore(s => s.currentScreen)
  const targetCave = useGameStore(s => s.targetCave)
  const categories = useGameStore(s => s.categories)

  useEffect(() => {
    if (!canvasRef.current) return
    if (getKaplayInstance()) {
      scenesReadyRef.current = true
      return
    }

    initKaplay(canvasRef.current, () => {
      const k = getKaplayInstance()!

      k.scene('__empty__', () => { })
      registerOverworldScene(k)
      registerDungeonScenes(k)
      scenesReadyRef.current = true

      console.log('[GameCanvas] Scenes registered, ready to navigate.')
      const screen = useGameStore.getState().currentScreen
      const cave = useGameStore.getState().targetCave
      const cats = useGameStore.getState().categories
      navigateTo(k, screen, cave, cats)
    })
  }, [])

  useEffect(() => {
    const k = getKaplayInstance()

    // Guard 1: Kaplay not initialized yet
    if (!k) return

    // Guard 2: Scenes not registered yet (onReady hasn't fired)
    // navigateTo() will be called by onReady when it completes.
    if (!scenesReadyRef.current) return

    navigateTo(k, currentScreen, targetCave, categories)
  }, [currentScreen, targetCave, categories])

  const isGameScreen = ['overworld', 'dungeon', 'battle'].includes(currentScreen)

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: isGameScreen ? 'block' : 'none',
        imageRendering: 'smooth',
        outline: 'none',
      }}
    />
  )
}
