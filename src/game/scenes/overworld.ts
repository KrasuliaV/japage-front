import type kaplay from 'kaplay'
import { TILE_SIZE, SCENES } from '../kaplay'
import { useGameStore } from '@/stores/gameStore'
import { createPlayer, setupPlayerMovement } from '@/game/entities/player'
import { addPortal, portalCollide } from '@/game/entities/portal'

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
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'R.............................................R',
  'R.............................................R',
  'R...TTT..........TTT....................T.T.T.R',
  'R..TtT............T...........................R',
  'R...T.............T.......................C.T.R',
  'R.............................................R',
  'R....TtTtT..............................T.T.T.R',
  'R.............................................R',
  'R.......................................T.T.T.R',
  'R......P....C.................................R',
  'R.........................................B.T.R',
  'R.............................................R',
  'R....TTT................................T.T.T.R',
  'R....TtT..........T...........................R',
  'R.......................................T.T.T.R',
  'R.............................................R',
  'R...TTT...........T.......................S.T.R',
  'R.................T...........................R',
  'R.................t.....................T.T.T.R',
  'R.............................................R',
  'R.............................................R',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
]

export function registerOverworldScene(k: KCtx) {
  k.scene(SCENES.OVERWORLD, () => {
    const gameStore = useGameStore.getState()
    gameStore.enterZone('OVERWORLD')

    // ── Camera ─────────────────────────────────────────────
    k.setCamScale(1.5)

    // ── Tile rendering ────────────────────────────────────
    let playerSpawn = k.vec2(8 * TILE_SIZE, 8 * TILE_SIZE)

    const mapWidthPx = OVERWORLD_MAP[0].length * TILE_SIZE + TILE_SIZE;
    const mapHeightPx = OVERWORLD_MAP.length * TILE_SIZE + TILE_SIZE;
    const wallThickness = TILE_SIZE * 2;

    const wallData = [
      // 1. TOP Wall
      { w: mapWidthPx, h: wallThickness, x: 0, y: 0 },
      // 2. BOTTOM Wall
      { w: mapWidthPx, h: wallThickness, x: 0, y: mapHeightPx - wallThickness },
      // 3. LEFT Wall
      { w: wallThickness, h: mapHeightPx, x: 0, y: 0 },
      // 4. RIGHT Wall
      { w: wallThickness, h: mapHeightPx, x: mapWidthPx - wallThickness, y: 0 },
    ];

    wallData.forEach(wall => {
      k.add([
        k.rect(wall.w, wall.h),
        k.pos(wall.x, wall.y),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "wall"
      ]);
    });

    for (let row = 0; row < OVERWORLD_MAP.length; row++) {
      for (let col = 0; col < OVERWORLD_MAP[row].length; col++) {
        const ch = OVERWORLD_MAP[row][col]
        const x = col * TILE_SIZE
        const y = row * TILE_SIZE

        // Floor bg everywhere
        // if (ch === '.') {
        k.add([
          // k.sprite("crystal"),
          k.sprite("field-light-green"),
          k.pos(x, y),
          k.z(-1),
        ])
        // }

        if (ch === 'R') {
          k.add([
            k.sprite("boulder-grey"),
            k.pos(x, y),
          ])
        }
        if (ch === 'T') {
          k.add([
            k.sprite("tree-green-2"),
            k.pos(x, y),
            k.area(),
            k.body({ isStatic: true }),
            'wall',
          ])
        }
        if (ch === 't') {
          k.add([
            k.sprite("tree-green"),
            k.pos(x, y),
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

        if (ch === 'O') {
          addPortal(k, x, y, 'OVERWORLD', [100, 200, 100])
        }

        if (ch === 'C') {
          addPortal(k, x, y, 'CREATIONAL', [100, 200, 100])
        }
        if (ch === 'S') {
          addPortal(k, x, y, 'STRUCTURAL', [100, 150, 220])
        }
        if (ch === 'B') {
          addPortal(k, x, y, 'BEHAVIORAL', [180, 80, 180])
        }

        if (ch === 'P') {
          playerSpawn = k.vec2(x, y)
        }
      }
    }

    const player = createPlayer(k, playerSpawn)

    k.onUpdate(() => {
      k.setCamPos(player.pos)
    })

    setupPlayerMovement(k, player)

    k.onUpdate(() => {
      if (useGameStore.getState().isGamePaused) {
        player.paused = true
      } else {
        player.paused = false
      }
    })

    portalCollide(k)
  })
}
