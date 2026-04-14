import type kaplay from 'kaplay'

import { useGameStore } from '@/stores/gameStore'
import { PLAYER_SCALE, PLAYER_SPEED } from '../kaplay'
import { Vec2 } from "kaplay";

type KCtx = ReturnType<typeof kaplay>

export function createPlayer(k: KCtx, pos: ReturnType<typeof k.vec2>) {
  return createAnyPlayer(k, pos, k.vec2(0, 4), 10, 8)
}

export function createDungeonPlayer(k: KCtx, pos: ReturnType<typeof k.vec2>) {
  return createAnyPlayer(k, pos, k.vec2(4, 12), 24, 20)
}

function createAnyPlayer(k: KCtx, pos: ReturnType<typeof k.vec2>, offset: Vec2, w: number, h: number) {
  return k.add([
    k.sprite('player-idle', { anim: 'idle-down' }),
    k.pos(pos),
    k.scale(PLAYER_SCALE),
    k.area({ shape: new k.Rect(offset, w, h) }),
    k.body(),
    k.anchor('center'),
    k.z(10),
    'player',
    {
      direction: 'down' as 'down' | 'up' | 'left' | 'right',
      isMoving: false,
      speed: PLAYER_SPEED,
    },
  ])
}
// ============================================================
// Player movement
// ============================================================

export function setupPlayerMovement(
  k: KCtx,
  player: ReturnType<typeof createPlayer>
) {
  if (useGameStore.getState().isGamePaused) return

  const vel = k.vec2(0, 0)

  if (k.isKeyDown('left') || k.isKeyDown('a')) {
    vel.x = -player.speed
    player.direction = 'left'
  } else if (k.isKeyDown('right') || k.isKeyDown('d')) {
    vel.x = player.speed
    player.direction = 'right'
  }

  if (k.isKeyDown('up') || k.isKeyDown('w')) {
    vel.y = -player.speed
    player.direction = 'up'
  } else if (k.isKeyDown('down') || k.isKeyDown('s')) {
    vel.y = player.speed
    player.direction = 'down'
  }

  player.isMoving = vel.x !== 0 || vel.y !== 0

  if (player.isMoving) {
    player.move(vel)
    try {
      const walkAnim = `walk-${player.direction}`
      if (player.getCurAnim()?.name !== walkAnim) {
        player.use(k.sprite('player-walk'))
        player.play(walkAnim)
      }
    } catch {/* sprite switch in progress */ }
  } else {
    // Switch to idle spritesheet
    try {
      const idleAnim = `idle-${player.direction}`
      if (player.getCurAnim()?.name !== idleAnim) {
        player.use(k.sprite('player-idle'))
        player.play(idleAnim)
      }
    } catch {/* sprite switch in progress */ }
  }
}
