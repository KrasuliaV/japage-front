import type kaplay from 'kaplay'

import { useGameStore } from '@/stores/gameStore'

import { TILE_SIZE } from '../kaplay'

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
    k.text(labels[zone] || zone, { size: 12, font: 'pixel' }),
    k.pos(x, y),
    k.color(255, 255, 255),
    k.anchor('center'),
    k.z(20),
  ])

  return portal
}

export function portalCollide(k: KCtx,) {
  k.onCollide('player', 'dungeon-entrance', (_player, entrance) => {
    const zone = (entrance as unknown as { zone: string }).zone
    // const sceneName = zone === 'OVERWORLD'
    //   ? 'overworld'
    //   : `dungeon-${zone.toLowerCase()}`;
    // console.log('sceneName: ' + sceneName)
    // useGameStore.getState().enterZone(zone)
    // k.go(sceneName, 1)
    if (zone === 'OVERWORLD') {
      useGameStore.getState().enterZone(zone)
      k.go('overworld')
    } else {
      useGameStore.getState().enterZone(zone)
      k.go(`dungeon-${zone.toLowerCase()}`, 1)
    }
  })
}