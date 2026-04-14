import type kaplay from 'kaplay'
import { TILE_SIZE, SCENES } from '../kaplay'
import { useGameStore } from '@/stores/gameStore'
import { createPlayer, setupPlayerMovement } from '@/game/entities/player'
import { addPortal, portalCollide } from '@/game/entities/portal'
import { addOptimizedCollisions, getOuterWallFrame, getInnerWallFrame } from '@/game/entities/map'

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

// const OVERWORLD_MAP = [
//   'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
//   'R.............................................R',
//   'R.............................................R',
//   'R...TTT..........TTT....................T.T.T.R',
//   'R..TtT............T...........................R',
//   'R...T.............T.......................C.T.R',
//   'R.............................................R',
//   'R....TtTtT..............................T.T.T.R',
//   'R.............................................R',
//   'R.......................................T.T.T.R',
//   'R......P....C....c............................R',
//   'R.........................................B.T.R',
//   'R.............................................R',
//   'R....TTT................................T.T.T.R',
//   'R....TtT..........T...........................R',
//   'R.......................................T.T.T.R',
//   'R.............................................R',
//   'R...TTT...........T.......................S.T.R',
//   'R.................T...........................R',
//   'R.................t.....................T.T.T.R',
//   'R.............................................R',
//   'R.............................................R',
//   'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
// ]
export const OVERWORLD_MAP = [
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR222RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", // 00
  "R................W.......W............W.......W................R",
  "R................W.......W............W.......W................R", // 01 (Portal 1: Wizard)
  "R........T...............W............W................T.......R", // 02
  "R........................W............W........................R",
  "R................W.......W............W.......W................R", // 03
  "RWWWWWWWWWWWWWWWWW.......W............W.......WWWWWWWWWWWWWWWWWR", // 04
  "R................W.......WWWWWW...WWWWW.......W................R", // 05
  "R..............................................................R", // 06
  "R........T.............................................T.......R", // 07 (Portal 2: Knight | Portal 4: Citadel)
  "R................W..............P.............W................R", // 08 (S: Spawn Point)
  "R................W............................W................R", // 09
  "RWWWWWWWWWWWWWWWWW............................WWWWWWWWWWWWWWWWWR", // 10
  "R................W.......WWWWWW...WWWWW.......W................R", // 11 (V: Void/Dungeon Walls)
  "R........................W............W........................R", // 12
  "R.........T..............W............W................T.......R", // 13 (Portal 5: Echo Void)
  "R................W.......W............W.......W................R", // 14 (Portal 3: Rogue)
  "R................W.......W............W.......W................R", // 15
  "R................W.......W............W.......W................R", // 17
  "R................W.......W............W.......W................R", // 18
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR111RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", // 20
];

export function registerOverworldScene(k: KCtx) {
  k.scene(SCENES.OVERWORLD, (spawnX?: number, spawnY?: number) => {
    const gameStore = useGameStore.getState()
    gameStore.enterZone('OVERWORLD')

    // ── Camera ─────────────────────────────────────────────
    k.setCamScale(1.5)

    // ── Tile rendering ────────────────────────────────────
    let playerSpawn = k.vec2(8 * TILE_SIZE, 8 * TILE_SIZE)

    for (let row = 0; row < OVERWORLD_MAP.length; row++) {
      for (let col = 0; col < OVERWORLD_MAP[row].length; col++) {
        const ch = OVERWORLD_MAP[row][col]
        const x = col * TILE_SIZE
        const y = row * TILE_SIZE

        // Floor bg everywhere
        // if (ch === '.') {
        k.add([
          // k.sprite("floor-tiles", { frame: 233 }),
          k.sprite("floor-tiles", { frame: 99 }),
          // k.sprite("orange"),
          // k.sprite("field-white"),
          k.pos(x, y),
          k.z(-1),
        ])
        // }
        switch (ch) {
          case 'R': {
            // k.add([k.sprite("rock-grey"), k.pos(x, y)]);
            // waterRects.push({ x, y });
            k.add([
              k.sprite("tileset-interior", { frame: getOuterWallFrame(OVERWORLD_MAP, row, col) }),
              k.pos(col * TILE_SIZE, row * TILE_SIZE),
            ]);
            break;
          };
          case 'W': {
            k.add([
              // [k.sprite("rock-grey"), k.pos(x, y)]
              // k.sprite("tileset-interior", { frame: 251 }),
              k.sprite("tileset-interior", { frame: getInnerWallFrame(OVERWORLD_MAP, row, col) }),
              k.pos(col * TILE_SIZE, row * TILE_SIZE),
            ]);
            // waterRects.push({ x, y });
            break;
          };
          case 'w': {
            k.add([
              // [k.sprite("rock-grey"), k.pos(x, y)]
              k.sprite("tileset-interior", { frame: 298 }),
              k.pos(col * TILE_SIZE, row * TILE_SIZE),
            ]);
            break;
          };
          case 'T': {
            k.add([k.sprite("tree-green-2"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall'])
            break;
          };
          case 't': {
            k.add([k.sprite("tree-green"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall'])
            break;
          };
          case '1': {
            k.add(
              [k.sprite("tileset-dungeon", { frame: 24 }),
              k.pos(col * TILE_SIZE, row * TILE_SIZE), k.area(), k.body({ isStatic: true }), 'hall-entrance']
            )
            break;
          };
          case '2': {
            k.add(
              [k.sprite("tileset-dungeon", { frame: 37 }),
              k.pos(col * TILE_SIZE, row * TILE_SIZE), k.area(), k.body({ isStatic: true }), 'hall-entrance']
            )
            break;
          };
          case 'O': {
            addPortal(k, x, y, 'OVERWORLD', [100, 200, 100])
            break;
          };
          case 'C': {
            addPortal(k, x, y, 'CREATIONAL', [100, 200, 100])
            break;
          };
          case 'S': {
            addPortal(k, x, y, 'STRUCTURAL', [100, 150, 220])
            break;
          };
          case 'B': {
            addPortal(k, x, y, 'BEHAVIORAL', [180, 80, 180])
            break;
          };
          case 'P': {
            if (spawnX === undefined || spawnY === undefined) {
              playerSpawn = k.vec2(x, y);
            } else {
              playerSpawn = k.vec2(spawnX, spawnY)
            }
            break;
          };
        }
      }
    }
    // if (waterRects.length > 0) {
    // Option A: Create one large compound shape from water tiles
    // const waterPolygon = mergeRectangles(k, waterRects, TILE_SIZE);

    // k.add([
    //   k.polygon(waterPolygon),
    //   k.pos(0, 0),
    //   k.area(),
    //   k.body({ isStatic: true }),
    //   k.color(30, 80, 160),
    //   'water-barrier' 
    // ]);

    // Option B: Visual water tiles (no physics)
    // waterRects.forEach(rect => {
    //   k.add([
    //     k.rect(TILE_SIZE, TILE_SIZE),
    //     k.pos(rect.x, rect.y),
    //     k.color(30, 80, 160),
    //     k.z(0),  // Render above background, below sprites
    //     // NO k.area(), NO k.body() — visual only!
    //   ]);
    // });
    // }
    addOptimizedCollisions(k, OVERWORLD_MAP, 'R', 'wall');
    addOptimizedCollisions(k, OVERWORLD_MAP, 'W', 'water-barrier');

    const player = createPlayer(k, playerSpawn)

    k.onUpdate(() => {
      k.setCamPos(player.pos)
      const isPaused = useGameStore.getState().isGamePaused
      player.paused = isPaused
      setupPlayerMovement(k, player)
    })

    portalCollide(k)
  })
}
