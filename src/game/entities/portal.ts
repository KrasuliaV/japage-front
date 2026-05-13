import type kaplay from 'kaplay'
import type { GameObj } from "kaplay";
import { characterApi } from '@/api/game'
import { useGameStore } from '@/stores/gameStore'
import { TILE_SIZE, SCENES } from '../kaplay'
import { SAFE_ZONE } from '@/types'
import { loadZoneAssets } from '@/game/assets/assetLoader'
import type { ZoneName } from '@/game/assets/zoneAssets'
import { getZoneVisual } from '@/game/config/zoneConfig'

type KCtx = ReturnType<typeof kaplay>

export function addPortal(
  k: KCtx,
  x: number,
  y: number,
  zone: string,    // was: 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL' | 'OVERWORLD'
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

  const visual = getZoneVisual(zone)
  const labelText = zone === SAFE_ZONE
    ? 'Home'
    : visual.label.replace(' ', '\n')   // wrap long names for 2-line display

  k.add([
    k.text(labelText, { size: 14, font: "'Nunito', sans-serif" }),
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

    if (zone === SAFE_ZONE) {
      try {
        await characterApi.backToSafe(characterId)
        state.exitZone()
        k.go(SCENES.OVERWORLD)
      } catch (err) {
        console.error("Failed to sync 'safe' state with BE", err)
      }
      return
    }

    const { setZoneLoading } = useGameStore.getState()


    try {
      setZoneLoading(true, zone)

      // 2. Load zone-specific enemy sprites (idempotent — skips if cached)
      await loadZoneAssets(k, zone as ZoneName)

      const pattern = state.categories
        .find(cat => cat.name === zone)
        ?.patterns.find(p => p.sequenceNumber === 1)

      await characterApi.startAdventuring(characterId, {
        category: zone,
        patternId: pattern?.id || '',
        caveNumber: 1
      })

      state.enterZone(zone)
      k.go("dungeon-run", zone, 1, 1)

    } catch (err) {
      console.error("Failed to start adventure on BE", err)
      // Show error in HUD, don't leave player in broken state
      // TODO: dispatch a toast notification
    } finally {
      // 5. Always clear loading state
      setZoneLoading(false)
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