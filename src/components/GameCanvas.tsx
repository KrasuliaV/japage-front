import { useEffect, useRef } from 'react'
import { initKaplay, SCENES } from '@/game/kaplay'
import { registerOverworldScene } from '@/game/scenes/overworld'
import { registerDungeonScenes } from '@/game/scenes/creationalDungeon'
import { registerStructuralDungeonScenes } from '@/game/scenes/structuralDungeon'
import { registerBehaviorDungeonScenes } from '@/game/scenes/behavioralDungeon'
import { useGameStore } from '@/stores/gameStore'

// ============================================================
// GameCanvas
// Mounts the Kaplay canvas and initializes all scenes.
// Lives behind the React UI overlay (z-index: 0).
// React UI sits on top (z-index: 10+).
// ============================================================

let kaplayInstance: ReturnType<typeof initKaplay> | null = null

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // const kaplayRef = useRef<ReturnType<typeof initKaplay> | null>(null)
  const currentScreen = useGameStore(s => s.currentScreen)
  const targetCave = useGameStore(s => s.targetCave)

   // useEffect(() => {
  async function navigate() {


    if (!kaplayInstance) return
    const k = kaplayInstance

    if (currentScreen === 'overworld') {
      k.go(SCENES.OVERWORLD)
    }
    else if (currentScreen === 'dungeon' && targetCave) {
      const sceneMap: Record<string, string> = {
        'CREATIONAL': 'dungeon-creational',
        'STRUCTURAL': 'dungeon-structural',
        'BEHAVIORAL': 'dungeon-behavioral',
      }
      console.log(`[GameCanvas] Navigating to dungeon scene for cave: `, sceneMap[targetCave.zone])
      // Navigate to the specific dungeon and cave number saved in the store
      k.go(sceneMap[targetCave.zone], targetCave.caveNumber)
    }
  }
  // }, [currentScreen, targetCave])
  useEffect(() => {
    if (!canvasRef.current) return
    if (kaplayInstance) return
    // if (kaplayRef.current) return

    // const k = initKaplay(canvasRef.current, () => {
    //   registerOverworldScene(k)
    //   registerDungeonScenes(k)
    //   registerStructuralDungeonScenes(k)
    //   registerBehaviorDungeonScenes(k)
    //   k.go(SCENES.OVERWORLD)
    // })
    // kaplayRef.current = k

    // return () => {
    //   try {
    //     k.quit?.()
    //   } catch {}
    //   kaplayRef.current = null
    // }

    kaplayInstance = initKaplay(canvasRef.current, () => {
      const k = kaplayInstance!
      registerOverworldScene(k)
      registerDungeonScenes(k)
      registerStructuralDungeonScenes(k)
      registerBehaviorDungeonScenes(k)
      navigate()
      // k.go(SCENES.OVERWORLD)
      const state = useGameStore.getState();
      console.log('[GameCanvas] Initializing Kaplay and starting overworld scene: ', state.character?.characterProgressResponse)
    })
  }, [])

 

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
