import type kaplay from 'kaplay'
import { TILE_SIZE, PLAYER_SCALE, PLAYER_SPEED, SCENES } from '../kaplay'
import { useGameStore } from '@/stores/gameStore'

// ============================================================
// Overworld Scene
// The top-level world map where the player can see
// three dungeon entrances (Creational, Structural, Behavioral)
// ============================================================

type KCtx = ReturnType<typeof kaplay>

// Simple tile map for the overworld
// Legend:
//   . = grass floor
//   T = tree (collision)
//   W = water (collision)
//   C = Creational dungeon entrance
//   S = Structural dungeon entrance
//   B = Behavioral dungeon entrance
//   P = Player spawn

const OVERWORLD_MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T............................................T',
  'T...TTT..........TTT..........TTT.............T',
  'T..TTT............T............TTT............T',
  'T...T.............T.............T.............T',
  'T.............................................T',
  'T....TTTTT........C........TTTTT..............T',
  'T.............................................T',
  'T.............................................T',
  'T......P..........S......................B.....T',
  'T.............................................T',
  'T.............................................T',
  'T....TTT..........T...........TTT.............T',
  'T....TTT..........T...........TTT.............T',
  'T.............................................T',
  'T.............................................T',
  'T...TTT...........T............TTT............T',
  'T.............................................T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
]

export function registerOverworldScene(k: KCtx) {
  k.scene(SCENES.OVERWORLD, () => {
    const gameStore = useGameStore.getState()
    gameStore.enterZone('OVERWORLD')

    // ── Camera ─────────────────────────────────────────────
    k.setCamScale(2)

    // ── Tile rendering ────────────────────────────────────
    let playerSpawn = k.vec2(9 * TILE_SIZE, 9 * TILE_SIZE)

    for (let row = 0; row < OVERWORLD_MAP.length; row++) {
      for (let col = 0; col < OVERWORLD_MAP[row].length; col++) {
        const ch = OVERWORLD_MAP[row][col]
        const x = col * TILE_SIZE
        const y = row * TILE_SIZE

        // Grass floor everywhere
        k.add([
          k.rect(TILE_SIZE, TILE_SIZE),
          k.pos(x, y),
          k.color(34, 85, 34),
          k.z(-1),
        ])

        if (ch === 'T') {
          k.add([
            k.rect(TILE_SIZE, TILE_SIZE),
            k.pos(x, y),
            k.color(20, 60, 20),
            k.area(),
            k.body({ isStatic: true }),
            'wall',
          ])
        }

        if (ch === 'W') {
          k.add([
            k.rect(TILE_SIZE, TILE_SIZE),
            k.pos(x, y),
            k.color(30, 80, 160),
            k.area(),
            k.body({ isStatic: true }),
            'wall',
          ])
        }

        // Dungeon entrances
        if (ch === 'C') {
          addDungeonEntrance(k, x, y, 'CREATIONAL', [100, 200, 100])
        }
        if (ch === 'S') {
          addDungeonEntrance(k, x, y, 'STRUCTURAL', [100, 150, 220])
        }
        if (ch === 'B') {
          addDungeonEntrance(k, x, y, 'BEHAVIORAL', [180, 80, 180])
        }

        if (ch === 'P') {
          playerSpawn = k.vec2(x, y)
        }
      }
    }

    // ── Player ───────────────────────────────────────────────
    const player = createPlayer(k, playerSpawn)

    // ── Camera follows player ────────────────────────────────
    k.onUpdate(() => {
      k.setCamPos(player.pos)
    })

    // ── Keyboard input ───────────────────────────────────────
    setupPlayerMovement(k, player)

    // ── Pause when game is paused ─────────────────────────────
    k.onUpdate(() => {
      if (useGameStore.getState().isGamePaused) {
        player.paused = true
      } else {
        player.paused = false
      }
    })
  })
}

// ============================================================
// Player entity
// ============================================================

function createPlayer(k: KCtx, pos: ReturnType<typeof k.vec2>) {
  const player = k.add([
    k.sprite('player-idle', { anim: 'idle-down' }),
    k.pos(pos),
    k.scale(PLAYER_SCALE),
    k.area({ shape: new k.Rect(k.vec2(4, 12), 24, 20) }),
    k.body(),
    k.anchor('center'),
    k.z(10),
    {
      direction: 'down' as 'down' | 'up' | 'left' | 'right',
      isMoving: false,
      speed: PLAYER_SPEED,
    },
  ])

  return player
}

// ============================================================
// Player movement
// ============================================================

function setupPlayerMovement(
  k: KCtx,
  player: ReturnType<typeof createPlayer>
) {
  k.onUpdate(() => {
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
      // Switch to walk spritesheet
      try {
        const walkAnim = `walk-${player.direction}`
        if (player.getCurAnim()?.name !== walkAnim) {
          player.use(k.sprite('player-walk'))
          player.play(walkAnim)
        }
      } catch {/* sprite switch in progress */}
    } else {
      // Switch to idle spritesheet
      try {
        const idleAnim = `idle-${player.direction}`
        if (player.getCurAnim()?.name !== idleAnim) {
          player.use(k.sprite('player-idle'))
          player.play(idleAnim)
        }
      } catch {/* sprite switch in progress */}
    }
  })
}

// ============================================================
// Dungeon entrance portal
// ============================================================

function addDungeonEntrance(
  k: KCtx,
  x: number,
  y: number,
  zone: 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL',
  color: [number, number, number]
) {
  const portal = k.add([
    k.rect(TILE_SIZE * 2, TILE_SIZE * 2),
    k.pos(x - TILE_SIZE / 2, y - TILE_SIZE / 2),
    k.color(...color),
    k.area(),
    k.anchor('topleft'),
    k.z(1),
    'dungeon-entrance',
    { zone },
  ])

  // Pulsing glow effect
  let t = 0
  k.onUpdate(() => {
    t += k.dt()
    const alpha = 0.6 + Math.sin(t * 2) * 0.3
    portal.opacity = alpha
  })

  // Zone label
  const labels: Record<string, string> = {
    CREATIONAL: 'Creational\nForest',
    STRUCTURAL: 'Structural\nCastle',
    BEHAVIORAL: 'Behavioral\nDungeon',
  }

  k.add([
    k.text(labels[zone] || zone, { size: 6, font: 'pixel' }),
    k.pos(x, y - TILE_SIZE * 2),
    k.color(255, 255, 255),
    k.anchor('center'),
    k.z(20),
  ])

  return portal
}
