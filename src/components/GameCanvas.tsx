import { useCallback, useEffect, useRef } from 'react'
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
  const isGamePaused = useGameStore(s => s.isGamePaused)

  const isGameScreen = ['overworld', 'dungeon', 'battle'].includes(currentScreen)

  const focusCanvas = useCallback(() => {
    if (!isGameScreen || isGamePaused) return

    canvasRef.current?.focus({ preventScroll: true })
  }, [isGamePaused, isGameScreen])

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

  useEffect(() => {
    if (!isGameScreen) return

    focusCanvas()
    const animationFrame = window.requestAnimationFrame(focusCanvas)
    const timer = window.setTimeout(focusCanvas, 0)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(timer)
    }
  }, [focusCanvas, isGameScreen, currentScreen, isGamePaused])

  useEffect(() => {
    if (!isGameScreen || isGamePaused) return

    const isTextEntryTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false

      return Boolean(
        target.closest('input, textarea, select, [contenteditable="true"], [data-keep-focus="true"]'),
      )
    }

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false

      return Boolean(target.closest('button, a, [role="button"], input, textarea, select, [contenteditable="true"], [data-keep-focus="true"]'))
    }

    const movementKeys = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's'])

    const refocusForGameInput = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (!movementKeys.has(event.key.toLowerCase())) return
      if (isTextEntryTarget(event.target)) return

      focusCanvas()
    }

    const refocusAfterBackgroundPointer = (event: PointerEvent) => {
      if (isInteractiveTarget(event.target)) return

      window.requestAnimationFrame(focusCanvas)
    }

    window.addEventListener('keydown', refocusForGameInput, true)
    window.addEventListener('pointerdown', refocusAfterBackgroundPointer, true)

    return () => {
      window.removeEventListener('keydown', refocusForGameInput, true)
      window.removeEventListener('pointerdown', refocusAfterBackgroundPointer, true)
    }
  }, [focusCanvas, isGamePaused, isGameScreen])

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
