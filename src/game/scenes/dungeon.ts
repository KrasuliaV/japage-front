import type kaplay from 'kaplay'
import {
  TILE_SIZE, ENEMY_SCALE,
  SCENES, ZONE_COLORS,
} from '../kaplay'
import { getEnemiesByZone, type EnemyDef } from '../entities/enemies'
import { useGameStore } from '@/stores/gameStore'
import type { PatternCategory } from '@/types'
import { createPlayer, setupPlayerMovement } from '@/game/entities/player'
import { addPortal } from '@/game/entities/portal'

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
  'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
  'r...........................#',
  'r...#######.....#######.....#',
  'r...#.....#.....#.....#.....#',
  'r...#..1..#.....#..2..#.....#',
  'r...#.....#.....#.....#.....#',
  'r...#######.....#######.....#',
  '#...........................#',
  '#.......P................O..#',
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

          if (ch === 'O') {
            addPortal(k, x, y, 'OVERWORLD', [100, 200, 100])
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
      const player = createPlayer(k, playerSpawn)

      // ── Camera follows player ─────────────────────────────────
      k.onUpdate(() => {
        k.setCamPos(player.pos)
      })

      // ── Movement ─────────────────────────────────────────────
      setupPlayerMovement(k, player)

      // ── Back to overworld (Escape key) ────────────────────────
      k.onKeyPress('escape', () => {
        if (!useGameStore.getState().isGamePaused) {
          gameStore.exitZone()
          k.go(SCENES.OVERWORLD)
        }
      })

      k.onCollide('player', 'dungeon-entrance', (_player, entrance) => {
        const zone = (entrance as unknown as { zone: string }).zone
        const sceneName = zone === 'OVERWORLD'
          ? 'overworld'
          : `dungeon-${zone.toLowerCase()}`;
        useGameStore.getState().enterZone(zone)
        k.go(sceneName)
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
  k.setCamPos(cp.x - 150, cp.y + 80)
  const dialogBg = k.add([
    k.rect(300, 60),
    k.pos(cp.x - 150, cp.y + 80),
    k.color(10, 14, 26),
    k.outline(2, k.Color.fromArray([0, 212, 170])),
    k.z(100),
    k.anchor('topleft'),
  ])

  const dialogText = k.add([
    k.text(text, { size: 16, font: 'pixel', width: 280 }),
    k.pos(cp.x - 140, cp.y + 88),
    k.color(232, 234, 240),
    k.z(101),
  ])

  k.wait(2.5, () => {
    k.destroy(dialogBg)
    k.destroy(dialogText)
    onDone()
  })
}
