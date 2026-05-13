import type kaplay from 'kaplay'
import { TILE_SIZE, ZONE_COLORS } from '@/game/kaplay'
import { SAFE_ZONE } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import { createPlayer, setupPlayerMovement } from '@/game/entities/player'
import { addPortal, portalCollide } from '@/game/entities/portal'
import { addOptimizedCollisions, getOuterWallFrame, getInnerWallFrame } from '@/game/entities/map'
import { getZoneVisual } from '@/game/config/zoneConfig'

// ============================================================
// Overworld Scene
// The top-level world map where the player can see
// three dungeon entrances (Creational, Structural, Behavioral)
// ============================================================

type KCtx = ReturnType<typeof kaplay>

export const OVERWORLD_MAP = [
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR222RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
  "R................WQ......W......S.....W.....Q.W................R",
  "R............Y...W.......W............W.......W...Y............R",
  "R........................W............W........................R",
  "R........................W............W........................R",
  "R................W.......W............W.......W................R",
  "RWWWWWWWWWWWWWWWWWQ......W............W.....Q.WWWWWWWWWWWWWWWWWR",
  "R................W.......WWWWWW...WWWWW.......W................R",
  "R............Y.................................................R",
  "R......................................................Y.......R",
  "R................WQ.............P...........Q.W................R",
  "R................W............................W................R",
  "RWWWWWWWWWWWWWWWWWQ.........................Q.WWWWWWWWWWWWWWWWWR",
  "R................W.......WWWWWW...WWWWW.......W................R",
  "R........................W............W........................R",
  "R........Y...............W............W................Y.......R",
  "R................WQ......W............W.....Q.W................R",
  "R................W.......W............W.......W................R",
  "R................W.......W......S.....W.......W................R",
  "R................W.......W............W.......W................R",
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR111RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
];

export function registerOverworldScene(k: KCtx) {
  k.scene(SAFE_ZONE.toLowerCase(), (spawnX?: number, spawnY?: number) => {
    const gameStore = useGameStore.getState()
    gameStore.enterZone(SAFE_ZONE)

    // ── Camera ─────────────────────────────────────────────
    k.setCamScale(1.5)

    // ── Tile rendering ────────────────────────────────────
    let playerSpawn = k.vec2(8 * TILE_SIZE, 8 * TILE_SIZE)

    const portalsCoordinates: Array<{ x: number, y: number }> = []

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
              k.sprite("tileset-interior", { frame: getInnerWallFrame(OVERWORLD_MAP, row, col) }),
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
          // case 'Q': {
          //   k.add([k.sprite("dark-statue"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'statue'])
          //   break;
          // };
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
          case 'S': {
            k.add([
              k.text("Expect in future", {
                size: 16,
                // font: "pixel",
                // align: "center",
                width: TILE_SIZE * 12,  // wrap width — adjust to your room width
              }),
              k.pos(x + TILE_SIZE, y + TILE_SIZE),  // offset so it sits inside the room
              k.color(255, 255, 255),
              k.outline(3, k.Color.BLACK),           // black outline for readability on any bg
              k.anchor("center"),
              k.z(1),                               // above floor tiles
            ]);
            break;
          };
          case 'Y': {
            portalsCoordinates.push({ x, y })
            break;
          };
          // case 'O': {
          //   addPortal(k, x, y, 'OVERWORLD', [100, 200, 100])
          //   break;
          // };
          // case 'C': {
          //   addPortal(k, x, y, 'CREATIONAL', [100, 200, 100])
          //   break;
          // };
          // case 'S': {
          //   addPortal(k, x, y, 'STRUCTURAL', [100, 150, 220])
          //   break;
          // };
          // case 'B': {
          //   addPortal(k, x, y, 'BEHAVIORAL', [180, 80, 180])
          //   break;
          // };
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

    // ── Portals — driven by active categories from store ────────────────
    // Only active categories get a portal; capped by available 'Y' slots.
    const activeCategories = gameStore.categories.filter(c => c.isActive)

    activeCategories.forEach((category, i) => {
      if (i >= portalsCoordinates.length) return  // no more map slots
      const { x, y } = portalsCoordinates[i]
      const visual = getZoneVisual(category.name)
      addPortal(k, x, y, category.name, visual.color)
    })

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
