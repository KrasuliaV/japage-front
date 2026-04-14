import type kaplay from 'kaplay'
import {
    TILE_SIZE, SCENES, ZONE_COLORS,
} from '../kaplay'
import { useGameStore } from '@/stores/gameStore'
import type { PatternCategory } from '@/types'
import { createPlayer, setupPlayerMovement } from '@/game/entities/player'
import { addPortal, portalCollide } from '@/game/entities/portal'
import { addMinion, addBoss, initEnemyManager, clearEnemyRegistry } from '@/game/entities/enemies'

type KCtx = ReturnType<typeof kaplay>

const MINION_SPRITES = ['Skeleton', 'GreenPig', 'RobotGrey', 'NinjaGray', 'Caveman']

const DUNGEON_MAP_BEHAVIORAL_1 = [
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
    'b..O........................................5.....E',
    'b......P..........................................E',
    'b..................GG......................Tt.....E',
    'rrrrr.......................................T.rrrrr',
    'vvvvr........................G................r',
    'vvvvr........................G................r',
    'vvvvr......cc......c..........................r',
    'vvvvr.....cc.................G................r',
    'vvvvr..............c..........................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_BEHAVIORAL_2 = [
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
    'e......P....................................5.....E',
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

const DUNGEON_MAP_BEHAVIORAL_3 = [
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
    'e......P....................................5.....E',
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

const DUNGEON_MAP_BEHAVIORAL_4 = [
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
    'e......P....................................5.....E',
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

const DUNGEON_MAP_BEHAVIORAL_5 = [
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
    'e......P....................................5.......O..b',
    'e......................................................b',
    'e..........................................Tt..........b',
    'rrrrr.......................................T.rrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_BEHAVIORAL_6 = [
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
    'e......P....................................5.......O..b',
    'e......................................................b',
    'e..........................................Tt..........b',
    'rrrrr.......................................T.rrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_BEHAVIORAL_7 = [
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
    'e......P....................................5.......O..b',
    'e......................................................b',
    'e..........................................Tt..........b',
    'rrrrr.......................................T.rrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_BEHAVIORAL_8 = [
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
    'e......P....................................5.......O..b',
    'e......................................................b',
    'e..........................................Tt..........b',
    'rrrrr.......................................T.rrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_BEHAVIORAL_9 = [
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
    'e......P....................................5.......O..b',
    'e......................................................b',
    'e..........................................Tt..........b',
    'rrrrr.......................................T.rrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const DUNGEON_MAP_BEHAVIORAL_10 = [
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
    'e......P....................................5.......O..b',
    'e......................................................b',
    'e..........................................Tt..........b',
    'rrrrr.......................................T.rrrrrrrrrr',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvr.........................................r',
    'vvvvrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
]

const BEHAVIOR_DUNGEON_MAPS: Record<number, string[]> = {
    1: DUNGEON_MAP_BEHAVIORAL_1,
    2: DUNGEON_MAP_BEHAVIORAL_2,
    3: DUNGEON_MAP_BEHAVIORAL_3,
    4: DUNGEON_MAP_BEHAVIORAL_4,
    5: DUNGEON_MAP_BEHAVIORAL_5,
    6: DUNGEON_MAP_BEHAVIORAL_6,
    7: DUNGEON_MAP_BEHAVIORAL_7,
    8: DUNGEON_MAP_BEHAVIORAL_8,
    9: DUNGEON_MAP_BEHAVIORAL_9,
    10: DUNGEON_MAP_BEHAVIORAL_10,
}

const MINION_SPAWNS: Record<number, Array<{ x: number, y: number }>> = {
    1: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    2: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    3: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    4: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    5: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    6: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    7: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    8: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    9: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
    10: [
        { x: 9, y: 4 },
        { x: 16, y: 6 },
        { x: 21, y: 10 },
        { x: 31, y: 4 },
        { x: 36, y: 16 },
    ],
}

const PATTERN_CATEGORY: PatternCategory = 'BEHAVIORAL'

const CAVE_BOSSES: Record<number, string> = {
    1: 'Chain of Responsibility',
    2: 'Command',
    3: 'Iterator',
    4: 'Mediator',
    5: 'Memento',
    6: 'Observer',
    7: 'State',
    8: 'Strategy',
    9: 'Template Method',
    10: 'Visitor',
}

export function registerBehaviorDungeonScenes(k: KCtx) {
    const sceneName = `dungeon-behavioral`

    k.scene(sceneName, (caveNumber: number) => {
        const gameStore = useGameStore.getState()
        gameStore.enterZone(PATTERN_CATEGORY)

        k.setCamScale(1.5)
        initEnemyManager(k);
        clearEnemyRegistry();

        const map = BEHAVIOR_DUNGEON_MAPS[caveNumber]
        if (!map) {
            console.error(`No map for cave ${caveNumber}`)
            k.go(SCENES.OVERWORLD)
            return
        }
        let playerSpawn = k.vec2(3 * TILE_SIZE, 3 * TILE_SIZE)

        const [r, g, b] = ZONE_COLORS[PATTERN_CATEGORY]
        k.setBackground(
            Math.floor(r * 0.15),
            Math.floor(g * 0.15),
            Math.floor(b * 0.15)
        )

        const mapWidthPx = BEHAVIOR_DUNGEON_MAPS[caveNumber][0].length * TILE_SIZE + TILE_SIZE;
        const mapHeightPx = BEHAVIOR_DUNGEON_MAPS[caveNumber].length * TILE_SIZE + TILE_SIZE;
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

        // ── Build tile map ─────────────────────────────────────
        for (let row = 0; row < map.length; row++) {
            const cells = map[row].split('')
            let col = 0

            for (const ch of cells) {
                const x = col * TILE_SIZE
                const y = row * TILE_SIZE

                k.add([k.sprite("field-pink"), k.pos(x, y), k.z(-1),])

                if (ch === 'c') {
                    k.add([
                        k.sprite("small-orange-crystal"),
                        k.pos(x, y),
                        k.area(),
                        k.body({ isStatic: true }),
                        'wall',
                    ])
                }
                if (ch === 'G') {
                    k.add([
                        k.sprite("big-green-crystal-rock"),
                        k.pos(x, y),
                        k.area(),
                        k.body({ isStatic: true }),
                        'wall',
                    ])
                }
                if (ch === 'b') {
                    k.add([
                        k.sprite("boulder-grey"),
                        k.pos(x, y),
                        k.area(),
                        k.body({ isStatic: true }),
                        'wall',
                    ])
                }

                if (ch === 'E') {
                    k.add([
                        k.sprite("transition"),
                        k.pos(x, y),
                        k.area(),
                        k.z(1),
                        'cave-exit',
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

                if (ch === 'r') {
                    k.add([k.sprite("boulder-grey"), k.pos(x, y),])
                }

                if (ch === 'O') {
                    addPortal(k, x, y, 'OVERWORLD', [100, 200, 100])
                }

                if (ch === 'P') {
                    playerSpawn = k.vec2(x, y)
                }

                if (ch === '5') {
                    const bossPatternName = CAVE_BOSSES[caveNumber]
                    if (bossPatternName) {
                        addBoss(k, x, y, bossPatternName, PATTERN_CATEGORY)
                    }
                }

                col++
            }
        }

        const spawns = MINION_SPAWNS[caveNumber] ?? []

        spawns.forEach((spawn, index) => {
            const spriteIndex = index % MINION_SPRITES.length
            addMinion(k, spawn.x * TILE_SIZE, spawn.y * TILE_SIZE, MINION_SPRITES[spriteIndex], CAVE_BOSSES[caveNumber])
        })

        const player = createPlayer(k, playerSpawn)

        k.onUpdate(() => {
            k.setCamPos(player.pos)
            setupPlayerMovement(k, player)
        })

        k.onKeyPress('escape', () => {
            if (!useGameStore.getState().isGamePaused) {
                gameStore.exitZone()
                k.go(SCENES.OVERWORLD)
            }
        })

        portalCollide(k)

        k.onCollide('player', 'cave-exit', () => {
            const nextCave = caveNumber + 1

            if (BEHAVIOR_DUNGEON_MAPS[nextCave]) {
                k.go(sceneName, nextCave)
            } else {
                useGameStore.getState().exitZone()
                k.go(SCENES.OVERWORLD)
            }
        })

        k.onSceneLeave(() => {
            clearEnemyRegistry();
        });
    })
}


