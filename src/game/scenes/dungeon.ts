import type kaplay from 'kaplay'
import {
  TILE_SIZE, PLAYER_SCALE, ENEMY_SCALE,
  PLAYER_SPEED, SCENES, ZONE_COLORS,
} from '../kaplay'
import { getEnemiesByZone, type EnemyDef } from '../entities/enemies'
import { useGameStore } from '@/stores/gameStore'
import type { PatternCategory } from '@/types'

type KCtx = ReturnType<typeof kaplay>

// ============================================================
// Dungeon tile maps — one per zone
// Legend:
//   # = wall
//   . = floor
//   P = player spawn
//   numbers = enemy slot indices (resolved from ENEMY_DEFINITIONS)
// ============================================================

const DUNGEON_MAP_CREATIONAL = [
  '#############################',
  '#...........................#',
  '#...#######.....#######.....#',
  '#...#.....#.....#.....#.....#',
  '#...#..1..#.....#..2..#.....#',
  '#...#.....#.....#.....#.....#',
  '#...#######.....#######.....#',
  '#...........................#',
  '#.......P...................#',
  '#...........................#',
  '#...#######.....#######.....#',
  '#...#.....#.....#.....#.....#',
  '#...#..3..#.....#..4..#.....#',
  '#...#.....#.....#.....#.....#',
  '#...#######.....#######.....#',
  '#...........................#',
  '#...........5...............#',
  '#...........................#',
  '#############################',
]

const DUNGEON_MAP_STRUCTURAL = [
  '#############################',
  '#...........................#',
  '#.....1.......2.......3.....#',
  '#...........................#',
  '#...........................#',
  '#.....4.......P.......5.....#',
  '#...........................#',
  '#...........................#',
  '#.....6.......7.............#',
  '#...........................#',
  '#############################',
]

const DUNGEON_MAP_BEHAVIORAL = [
  '#############################',
  '#...........................#',
  '#..1.....2.....3.....4......#',
  '#...........................#',
  '#...........................#',
  '#..P.....5.....6.....7......#',
  '#...........................#',
  '#...........................#',
  '#..8.....9.....10.....11....#',
  '#...........................#',
  '#############################',
]

const DUNGEON_MAPS: Record<PatternCategory, string[]> = {
  CREATIONAL: DUNGEON_MAP_CREATIONAL,
  STRUCTURAL: DUNGEON_MAP_STRUCTURAL,
  BEHAVIORAL: DUNGEON_MAP_BEHAVIORAL,
}

// ============================================================
// Register dungeon scenes for all three zones
// ============================================================

export function registerDungeonScenes(k: KCtx) {
  const zones: PatternCategory[] = ['CREATIONAL', 'STRUCTURAL', 'BEHAVIORAL']

  for (const zone of zones) {
    const sceneName = `dungeon-${zone.toLowerCase()}`

    k.scene(sceneName, () => {
      const gameStore = useGameStore.getState()
      gameStore.enterZone(zone)

      k.setCamScale(2)

      const map = DUNGEON_MAPS[zone]
      const enemies = getEnemiesByZone(zone)
      let enemyIndex = 0
      let playerSpawn = k.vec2(5 * TILE_SIZE, 5 * TILE_SIZE)

      // Dungeon background color tint
      const [r, g, b] = ZONE_COLORS[zone]
      k.setBackground(
        Math.floor(r * 0.15),
        Math.floor(g * 0.15),
        Math.floor(b * 0.15)
      )

      // ── Build tile map ─────────────────────────────────────
      for (let row = 0; row < map.length; row++) {
        const cells = map[row].split('')
        let col = 0

        for (const ch of cells) {
          const x = col * TILE_SIZE
          const y = row * TILE_SIZE

          if (ch === '#') {
            // Wall
            k.add([
              k.rect(TILE_SIZE, TILE_SIZE),
              k.pos(x, y),
              k.color(40, 40, 60),
              k.area(),
              k.body({ isStatic: true }),
              'wall',
            ])
          } else {
            // Floor
            k.add([
              k.rect(TILE_SIZE, TILE_SIZE),
              k.pos(x, y),
              k.color(
                Math.floor(r * 0.25),
                Math.floor(g * 0.25),
                Math.floor(b * 0.25)
              ),
              k.z(-1),
            ])
          }

          if (ch === 'P') {
            playerSpawn = k.vec2(x, y)
          }

          // Enemy slots — single digit or multi-digit number
          const numMatch = ch.match(/\d/)
          if (numMatch) {
            const idx = parseInt(ch) - 1
            if (enemies[idx]) {
              addEnemy(k, x, y, enemies[idx], zone)
            }
          }

          col++
        }
      }

      // ── Player ──────────────────────────────────────────────
      const player = createDungeonPlayer(k, playerSpawn)

      // ── Camera follows player ─────────────────────────────────
      k.onUpdate(() => {
        k.setCamPos(player.pos)
      })

      // ── Movement ─────────────────────────────────────────────
      setupDungeonMovement(k, player)

      // ── Back to overworld (Escape key) ────────────────────────
      k.onKeyPress('escape', () => {
        if (!useGameStore.getState().isGamePaused) {
          gameStore.exitZone()
          k.go(SCENES.OVERWORLD)
        }
      })
    })
  }
}

// ============================================================
// Enemy entity in dungeon
// ============================================================

function addEnemy(
  k: KCtx,
  x: number,
  y: number,
  enemyDef: EnemyDef,
  _zone: PatternCategory
) {
  const enemy = k.add([
    k.sprite(`${enemyDef.sprite}-idle`, { anim: 'idle' }),
    k.pos(x, y),
    k.scale(ENEMY_SCALE),
    k.area({ shape: new k.Rect(k.vec2(0, 0), TILE_SIZE, TILE_SIZE) }),
    k.anchor('center'),
    k.z(5),
    'enemy',
    {
      patternName: enemyDef.patternName,
      battleIntro: enemyDef.battleIntro,
      defeated: false,
    },
  ])

  // Pattern name label above enemy
  k.add([
    k.text(enemyDef.patternName, { size: 5, font: 'pixel' }),
    k.pos(x, y - TILE_SIZE * 1.5),
    k.color(255, 220, 100),
    k.anchor('center'),
    k.z(20),
    { follow: enemy },
  ])

  // Player collision — triggers battle
  enemy.onCollide('player', () => {
    if (enemy.defeated) return
    if (useGameStore.getState().isGamePaused) return

    const gameStore = useGameStore.getState()

    // Find pattern from store to get full PatternResponse
    // GameStore.triggerBattle pauses the game and opens the battle modal
    // The React BattleModal will read currentDungeonPatternId and start the API call

    gameStore.pauseGame()

    // Store pattern name so React can look it up
    useGameStore.setState({ currentDungeonPatternId: enemy.patternName })

    // Show battle intro dialog briefly then open modal
    showBattleIntro(k, enemy.battleIntro, () => {
      gameStore.triggerBattle({} as never)
    })
  })

  return enemy
}

// ============================================================
// Battle intro dialog
// ============================================================

function showBattleIntro(k: KCtx, text: string, onDone: () => void) {
  const cp = k.getCamPos(); 
  const dialogBg = k.add([
    k.rect(300, 60),
    k.setCamPos(cp.x - 150, cp.y + 80),
    k.color(10, 14, 26),
    k.outline(2, k.Color.fromArray([0, 212, 170])),
    k.z(100),
    k.anchor('topleft'),
  ])

  const dialogText = k.add([
    k.text(text, { size: 6, font: 'pixel', width: 280 }),
    k.setCamPos(cp.x - 140, cp.y + 88),
    k.color(232, 234, 240),
    k.z(101),
  ])

  k.wait(2.5, () => {
    k.destroy(dialogBg)
    k.destroy(dialogText)
    onDone()
  })
}

// ============================================================
// Dungeon player (same as overworld but with dungeon context)
// ============================================================

function createDungeonPlayer(k: KCtx, pos: ReturnType<typeof k.vec2>) {
  return k.add([
    k.sprite('player-idle', { anim: 'idle-down' }),
    k.pos(pos),
    k.scale(PLAYER_SCALE),
    k.area({ shape: new k.Rect(k.vec2(4, 12), 24, 20) }),
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

function setupDungeonMovement(
  k: KCtx,
  player: ReturnType<typeof createDungeonPlayer>
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
      try {
        const walkAnim = `walk-${player.direction}`
        if (player.getCurAnim()?.name !== walkAnim) {
          player.use(k.sprite('player-walk'))
          player.play(walkAnim)
        }
      } catch {/* swap in progress */}
    } else {
      try {
        const idleAnim = `idle-${player.direction}`
        if (player.getCurAnim()?.name !== idleAnim) {
          player.use(k.sprite('player-idle'))
          player.play(idleAnim)
        }
      } catch {/* swap in progress */}
    }
  })
}
