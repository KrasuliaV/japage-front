import type kaplay from 'kaplay'
import {
    TILE_SIZE, SCENES, ZONE_COLORS,
} from '../kaplay'
import { useGameStore } from '@/stores/gameStore'
import type { PatternCategory } from '@/types'
import { createPlayer, setupPlayerMovement } from '@/game/entities/player'
import { addPortal, portalCollide } from '@/game/entities/portal'
import { addMinion, addBoss, initEnemyManager, clearEnemyRegistry } from '@/game/entities/enemies'
import { addChest } from '@/game/entities/chest'
import { characterApi } from '@/api/game'

type KCtx = ReturnType<typeof kaplay>

const MINION_SPRITES = ['Skeleton', 'GreenPig', 'RobotGrey', 'NinjaGray', 'Caveman']

const DUNGEON_MAP_CREATIONAL_1 = [
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.......c.................................r',
    'vvvvr.......c...........................ccc...r',
    'vvvvr..............c..........................r',
    'vvvvr.........................................r',
    'vvvvr...........................G.............r',
    'rrrrr.......................................T.rrrrr',
    'b................G.........................Tt.....E',
    'b.................................................E',
    'b..O.....................i..................B.....E',
    'b......P..........................................E',
    'b..................GG......................Tt.....E',
    'rrrrr.......................................T.rrrrr',
    'vvvvr........................G................r',
    'vvvvr........................G................r',
    'vvvvr......cc......c..........................r',
    'vvvvr.....cc.................G................r',
    'vvvvr..............c..........................r',
    'vvvvr.....i...................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_CREATIONAL_2 = [
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'rrrrr.......................................T.rrrrr',
    'e..........................................Tt.....E',
    'e.................................................E',
    'e......P....................................B.....E',
    'e.................................................E',
    'e..........................................Tt.....E',
    'rrrrr.......................................T.rrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_CREATIONAL_3 = [
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr..................i......................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'rrrrr.......................................T.rrrrr',
    'e..........................................Tt.....E',
    'e.................................................E',
    'e......P....................................B.....E',
    'e.................................................E',
    'e..........................................Tt.....E',
    'rrrrr.......................................T.rrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_CREATIONAL_4 = [
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'rrrrr.......................................T.rrrrr',
    'e..........................................Tt.....E',
    'e.................................................E',
    'e......P....................................B.....E',
    'e.................................................E',
    'e..........................................Tt.....E',
    'rrrrr.......................................T.rrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr........................i................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_CREATIONAL_5 = [
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'rrrrr.......................................T.rrrrrrrrrr',
    'e..........................................Tt..........b',
    'e......................................................b',
    'e......P....................................B.......O..b',
    'e......................................................b',
    'e..........................................Tt..........b',
    'rrrrr.......................................T.rrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........i...............................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const CREATIONAL_DUNGEON_MAPS: Record<number, string[]> = {
    1: DUNGEON_MAP_CREATIONAL_1,
    2: DUNGEON_MAP_CREATIONAL_2,
    3: DUNGEON_MAP_CREATIONAL_3,
    4: DUNGEON_MAP_CREATIONAL_4,
    5: DUNGEON_MAP_CREATIONAL_5,
}

// const MINION_SPAWNS: Record<number, Array<{ x: number, y: number }>> = {
//     1: [
//         { x: 8, y: 3 },
//         { x: 15, y: 5 },
//         { x: 20, y: 9 },
//         { x: 30, y: 3 },
//         { x: 35, y: 15 },
//     ],
//     2: [
//         { x: 8, y: 3 },
//         { x: 15, y: 5 },
//         { x: 20, y: 9 },
//         { x: 30, y: 3 },
//         { x: 35, y: 15 },
//     ],
//     3: [
//         { x: 8, y: 3 },
//         { x: 15, y: 5 },
//         { x: 20, y: 9 },
//         { x: 30, y: 3 },
//         { x: 35, y: 15 },
//     ],
//     4: [
//         { x: 8, y: 3 },
//         { x: 15, y: 5 },
//         { x: 20, y: 9 },
//         { x: 30, y: 3 },
//         { x: 35, y: 15 },
//     ],
//     5: [
//         { x: 8, y: 3 },
//         { x: 15, y: 5 },
//         { x: 20, y: 9 },
//         { x: 30, y: 3 },
//         { x: 35, y: 15 },
//     ],
// }

const PATTERN_CATEGORY: PatternCategory = 'CREATIONAL'

const CAVE_BOSSES: Record<number, string> = {
    1: 'Singleton',
    2: 'Factory Method',
    3: 'Abstract Factory',
    4: 'Builder',
    5: 'Prototype',
}

function shuffle<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export function registerDungeonScenes(k: KCtx) {
    k.scene('dungeon-creational',
        // async (caveNumber: number = 1, spawnX?: number, spawnY?: number, undefeatedMinionsCount: number = 5, isBossDefeated: boolean = false) => {
        async (caveNumber: number = 1) => {
            const store = useGameStore.getState()
            const targetCave = store.targetCave

            // Determine player spawn and enemy count based on restoration state
            let spawnX: number | undefined
            let spawnY: number | undefined
            let undefeatedMinionsCount = 5
            let isBossDefeated = false

            if (targetCave && targetCave.caveNumber === caveNumber) {
                spawnX = targetCave.spawnX
                spawnY = targetCave.spawnY
                undefeatedMinionsCount = targetCave.undefeatedMinionCount
                isBossDefeated = targetCave.bossDefeated

                // IMPORTANT: Clear targetCave after reading it, so if the scene
                // is re-entered naturally (not from restoration), defaults apply
                useGameStore.getState().setTargetCave(null)
            }
            store.enterZone(PATTERN_CATEGORY)

            k.setCamScale(1.5)
            initEnemyManager(k);
            clearEnemyRegistry();

            let playerSpawn = k.vec2(3 * TILE_SIZE, 3 * TILE_SIZE)

            const [r, g, b] = ZONE_COLORS[PATTERN_CATEGORY]
            k.setBackground(
                Math.floor(r * 0.15),
                Math.floor(g * 0.15),
                Math.floor(b * 0.15)
            )

            const map = CREATIONAL_DUNGEON_MAPS[caveNumber] || DUNGEON_MAP_CREATIONAL_1
            const mapWidthPx = map[0].length * TILE_SIZE
            const mapHeightPx = map.length * TILE_SIZE
            const wallThickness = TILE_SIZE * 2;

            const wallDataWithBothEntrance = [
                // 1. TOP Wall
                { w: mapWidthPx, h: wallThickness, x: 4 * TILE_SIZE, y: 0 },
                // 2. BOTTOM Wall
                { w: mapWidthPx, h: wallThickness, x: 4 * TILE_SIZE, y: mapHeightPx - wallThickness },
                // LEFT SIDE (Top part)
                { w: wallThickness, h: 7 * TILE_SIZE, x: 4 * TILE_SIZE, y: wallThickness },
                // LEFT SIDE (Bottom part)
                { w: wallThickness, h: 7 * TILE_SIZE, x: 4 * TILE_SIZE, y: 13 * TILE_SIZE },
                { w: 4 * TILE_SIZE, h: wallThickness, x: 0, y: 7 * TILE_SIZE },
                { w: 4 * TILE_SIZE, h: wallThickness, x: mapWidthPx, y: 7 * TILE_SIZE },
                // 4. RIGHT Wall (Top part)
                { w: wallThickness, h: 7 * TILE_SIZE, x: mapWidthPx - wallThickness, y: wallThickness },
                // 4. RIGHT Wall (Bottom part)
                { w: wallThickness, h: 7 * TILE_SIZE, x: mapWidthPx - wallThickness, y: 13 * TILE_SIZE },
                { w: 4 * TILE_SIZE, h: wallThickness, x: 0, y: 13 * TILE_SIZE },
                { w: 4 * TILE_SIZE, h: wallThickness, x: mapWidthPx, y: 13 * TILE_SIZE },
            ];

            wallDataWithBothEntrance.forEach(wall => {
                k.add([
                    k.rect(wall.w, wall.h),
                    k.pos(wall.x, wall.y),
                    k.area(),
                    k.body({ isStatic: true }),
                    k.opacity(0),
                    "wall"
                ]);
            });

            const occupiedTiles = new Set<string>();
            const floorTiles: Array<{ x: number, y: number }> = [];

            const markOccupied = (startCol: number, startRow: number, width: number, height: number) => {
                for (let x = 0; x < width; x++) {
                    for (let y = 0; y < height; y++) {
                        occupiedTiles.add(`${startCol + x},${startRow + y}`);
                    }
                }
            };

            for (let row = 0; row < map.length; row++) {
                const cells = map[row].split('');
                for (let col = 0; col < cells.length; col++) {
                    const ch = cells[col];
                    if (ch === 'T' || ch === 't' || ch === 'G' || ch === 'p' || ch === 'O') markOccupied(col, row, 2, 2);
                    if (ch === 'b' || ch === 'c' || ch === 'r' || ch === 'v') {
                        markOccupied(col, row, 1, 1); // Standard 1x1 obstacles
                    }
                    if (ch === 'B') markOccupied(col, row, 3, 3);
                }
            }

            // ── Build tile map ─────────────────────────────────────
            for (let row = 0; row < map.length; row++) {
                const cells = map[row].split('')
                let col = 0

                for (const ch of cells) {
                    const x = col * TILE_SIZE
                    const y = row * TILE_SIZE

                    k.add([k.sprite("floor"), k.pos(x, y), k.z(-1),])
                    switch (ch) {
                        case '.': {
                            if (!occupiedTiles.has(`${col},${row}`)) {
                                floorTiles.push({
                                    x: x + TILE_SIZE / 2, 
                                    y: y + TILE_SIZE / 2,
                                });
                            };
                            break;
                        }
                        case 'c':
                            k.add([k.sprite("small-orange-crystal"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                            break;
                        case 'G':
                            k.add([k.sprite("big-green-crystal-rock"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                            break;
                        case 'b':
                            k.add([k.sprite("boulder-grey"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                            break;
                        case 'E':
                            k.add([k.sprite("transition"), k.pos(x, y), k.area(), k.z(1), 'cave-exit']);
                            break;
                        case 'T':
                            k.add([k.sprite("tree-green-2"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                            break;
                        case 't':
                            k.add([k.sprite("tree-green"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                            break;
                        case 'i': {
                            const patternName = CAVE_BOSSES[caveNumber]
                            addChest(k, x, y, patternName)
                            break;
                        };
                        case 'r':
                            k.add([k.sprite("boulder-grey"), k.pos(x, y),])
                            break;
                        case 'O':
                            addPortal(k, x, y, 'OVERWORLD', [100, 200, 100])
                            break;
                        case 'P':
                            if (spawnX === undefined || spawnY === undefined || spawnX === 0 && spawnY === 0) {
                                playerSpawn = k.vec2(x, y);
                            } else {
                                playerSpawn = k.vec2(spawnX, spawnY)
                            }
                            break;
                        case 'B':
                            if (!isBossDefeated) {
                                const bossPatternName = CAVE_BOSSES[caveNumber]
                                if (bossPatternName) {
                                    addBoss(k, x, y, bossPatternName, PATTERN_CATEGORY)
                                }
                            }
                            break;
                    }
                    col++
                }
            }

            // const spawns = MINION_SPAWNS[caveNumber] ?? []

            // spawns.forEach((spawn, index) => {
            //     const spriteIndex = index % MINION_SPRITES.length
            //     addMinion(k, spawn.x * TILE_SIZE, spawn.y * TILE_SIZE, MINION_SPRITES[spriteIndex], CAVE_BOSSES[caveNumber])
            // })
            const safeSpawns = floorTiles.filter(tile =>
                k.vec2(tile.x, tile.y).dist(playerSpawn) > TILE_SIZE * 3
            );

            shuffle(safeSpawns).slice(0, undefeatedMinionsCount).forEach((spawn, i) => {
                addMinion(k, spawn.x, spawn.y, MINION_SPRITES[i % MINION_SPRITES.length], CAVE_BOSSES[caveNumber]);
            });

            // ── Player ──────────────────────────────────────────────
            const player = createPlayer(k, playerSpawn)

            // ── Camera follows player ─────────────────────────────────
            k.onUpdate(() => {
                k.setCamPos(player.pos)
                setupPlayerMovement(k, player)
            })

            // ── Back to overworld (Escape key) ────────────────────────
            // k.onKeyPress('escape', () => {
            //     if (!useGameStore.getState().isGamePaused) {
            //         gameStore.exitZone()
            //         k.go(SCENES.OVERWORLD)
            //     }
            // })

            portalCollide(k)

            k.onCollide('player', 'cave-exit', async () => {
                const nextCave = caveNumber + 1
                const state = useGameStore.getState()
                const characterId = state.character?.id
                if (!characterId) {
                    console.error("No character found in store!")
                    return
                }

                if (CREATIONAL_DUNGEON_MAPS[nextCave]) {
                    await characterApi.startAdventuring(characterId, {
                        category: PATTERN_CATEGORY,
                        caveNumber: nextCave
                    })
                    k.go('dungeon-creational', nextCave)
                } else {
                    try {
                        await characterApi.backToSafe(characterId)
                        state.exitZone()
                        k.go(SCENES.OVERWORLD)
                    } catch (err) {
                        console.error("Failed to sync 'safe' state with BE", err)
                    }
                }
            })

            k.onSceneLeave(() => {
                clearEnemyRegistry();
            });
        })
}


