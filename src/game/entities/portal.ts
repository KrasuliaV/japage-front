import type kaplay from 'kaplay'
import type { GameObj } from "kaplay";
import { characterApi } from '@/api/game'

import { useGameStore } from '@/stores/gameStore'

import { TILE_SIZE, SCENES } from '../kaplay'

type KCtx = ReturnType<typeof kaplay>

export function addPortal(
  k: KCtx,
  x: number,
  y: number,
  zone: 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL' | 'OVERWORLD',
  color: [number, number, number]
) {
  const portal = k.add([
    k.rect(TILE_SIZE * 2, TILE_SIZE * 2),
    k.pos(x, y + TILE_SIZE / 4),
    k.color(...color),
    k.opacity(0.6),
    k.area(),
    k.anchor('topleft'),
    k.z(1),
    'dungeon-entrance',
    { zone },
  ])

  let t = 0
  k.onUpdate(() => {
    t += k.dt()
    portal.opacity = 0.6 + Math.sin(t * 2) * 0.3
  })

  k.add([
    k.sprite('spark', { anim: 'move' }),
    k.pos(x + TILE_SIZE, y + TILE_SIZE / 2),
    k.anchor('top'),
    k.opacity(0.6),
    pulse(k, 3, 0.4, 0.8),
    k.z(2),
  ])

  k.add([
    k.sprite("portal"),
    k.pos(x - TILE_SIZE / 2, y - TILE_SIZE / 2),
    k.anchor('topleft'),
    k.z(3),
  ])

  const labels: Record<string, string> = {
    CREATIONAL: 'Creational\nForest',
    STRUCTURAL: 'Structural\nCastle',
    BEHAVIORAL: 'Behavioral\nDungeon',
    INITIAL: 'Home',
  }

  k.add([
    k.text(labels[zone] || zone, { size: 14, font: "'Nunito', sans-serif" }),
    k.outline(5, k.Color.BLACK),
    k.pos(x, y),
    k.color(255, 255, 255),
    k.anchor('center'),
    k.z(4),
  ])

  return portal
}

export function portalCollide(k: KCtx,) {
  k.onCollide('player', 'dungeon-entrance', async (_player, entrance) => {
    const zone = (entrance as unknown as { zone: string }).zone
    const state = useGameStore.getState()
    const characterId = state.character?.id
    if (!characterId) {
      console.error("No character found in store!")
      return
    }
    if (zone === 'OVERWORLD') {
      try {
        await characterApi.backToSafe(characterId) // Notify BE player is safe
        state.exitZone()
        k.go(SCENES.OVERWORLD)
      } catch (err) {
        console.error("Failed to sync 'safe' state with BE", err)
      }
    } else {
      try {
        await characterApi.startAdventuring(characterId, {
          category: zone,
          caveNumber: 1
        })
        state.enterZone(zone)

        // Navigate Kaplay to the dungeon scene
        // Pass parameters to k.scene (Zone, Cave, Coords, MinionCount)
        k.go(`dungeon-${zone.toLowerCase()}`, 1)
      } catch (err) {
        console.error("Failed to start adventure on BE", err)
        // Optionally: Show a notification to the player that they can't enter
      }
    }
  })
}

function pulse(k: KCtx, speed = 2, min = 0.3, max = 0.9) {
  let t = 0;
  return {
    id: "pulse",
    update(this: GameObj) {
      t += k.dt();
      this.opacity = min + (Math.sin(t * speed) + 1) / 2 * (max - min);
    },
  };
}