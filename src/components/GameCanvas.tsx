import { useEffect, useRef } from 'react'
import type kaplay from 'kaplay'

import {
  initKaplay, getKaplayInstance,
  areScenesReady, markScenesReady, SCENES
} from '@/game/kaplay'
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
  // const scenesReadyRef = useRef(false)

  const currentScreen = useGameStore(s => s.currentScreen)
  const targetCave = useGameStore(s => s.targetCave)
  const categories = useGameStore(s => s.categories)

  useEffect(() => {
    const existingInstance = getKaplayInstance()

    if (existingInstance && areScenesReady()) {
      const { currentScreen, targetCave, categories } = useGameStore.getState()
      navigateTo(existingInstance, currentScreen, targetCave, categories)
      return
    }

    if (existingInstance && !areScenesReady()) {
      // Kaplay init started but onReady hasn't fired yet.
      // Effect 2 will handle navigation once markScenesReady() is called.
      return
    }

    // First ever mount — initialize Kaplay
    if (!canvasRef.current) return

    initKaplay(canvasRef.current, () => {
      const k = getKaplayInstance()!

      k.scene('__empty__', () => { })
      registerOverworldScene(k)
      registerDungeonScenes(k)
      markScenesReady()

      const { currentScreen, targetCave, categories } = useGameStore.getState()
      navigateTo(k, currentScreen, targetCave, categories)
    })
    return () => {};
  }, [])

  useEffect(() => {
    const k = getKaplayInstance()
    if (!k) return

    if (!areScenesReady()) return

    navigateTo(k, currentScreen, targetCave, categories)
  }, [currentScreen, targetCave, categories])

  const isGameScreen = ['overworld', 'dungeon', 'battle'].includes(currentScreen)

  useEffect(() => {
    if (!isGameScreen) return

    const focusCanvas = () => canvasRef.current?.focus()

    focusCanvas()
    const timer = window.setTimeout(focusCanvas, 0)
    return () => window.clearTimeout(timer)
  }, [isGameScreen, currentScreen])

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
