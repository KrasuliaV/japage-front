import type kaplay from 'kaplay'
import {
    TILE_SIZE, ENEMY_SCALE,
    SCENES, ZONE_COLORS,
} from '../kaplay'
import { getEnemiesByZone, type EnemyDef } from '../entities/enemies'
import { useGameStore } from '@/stores/gameStore'
import type { PatternCategory } from '@/types'
import { createPlayer, setupPlayerMovement } from '@/game/entities/player'
import { addPortal, portalCollide } from '@/game/entities/portal'

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

const DUNGEON_MAP_CREATIONAL_3 = [
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

const CREATIONAL_DUNGEON_MAPS: Record<number, string[]> = {
    1: DUNGEON_MAP_CREATIONAL_1,
    2: DUNGEON_MAP_CREATIONAL_2,
    3: DUNGEON_MAP_CREATIONAL_3,
    4: DUNGEON_MAP_CREATIONAL_4,
    5: DUNGEON_MAP_CREATIONAL_5,
}

const MINION_SPAWNS: Record<number, Array<{ x: number, y: number }>> = {
    1: [
        { x: 8, y: 3 },
        { x: 15, y: 5 },
        { x: 20, y: 9 },
        { x: 30, y: 3 },
        { x: 35, y: 15 },
    ],
    2: [
        { x: 8, y: 3 },
        { x: 15, y: 5 },
        { x: 20, y: 9 },
        { x: 30, y: 3 },
        { x: 35, y: 15 },
    ],
    3: [
        { x: 8, y: 3 },
        { x: 15, y: 5 },
        { x: 20, y: 9 },
        { x: 30, y: 3 },
        { x: 35, y: 15 },
    ],
    4: [
        { x: 8, y: 3 },
        { x: 15, y: 5 },
        { x: 20, y: 9 },
        { x: 30, y: 3 },
        { x: 35, y: 15 },
    ],
    5: [
        { x: 8, y: 3 },
        { x: 15, y: 5 },
        { x: 20, y: 9 },
        { x: 30, y: 3 },
        { x: 35, y: 15 },
    ],
}

const ZONE_NAME: string = 'CREATIONAL'
const PATTERN_CATEGORY: PatternCategory = 'CREATIONAL'

const CAVE_BOSSES: Record<number, string> = {
    1: 'Singleton',
    2: 'Factory Method',
    3: 'Abstract Factory',
    4: 'Builder',
    5: 'Prototype',
}

export function registerDungeonScenes(k: KCtx) {
    const zones: number[] = [1, 2, 3, 4, 5]
    const sceneName = `dungeon-creational`

    for (const zone of zones) {

        k.scene(sceneName, (caveNumber: number) => {
            const gameStore = useGameStore.getState()
            gameStore.enterZone(ZONE_NAME)

            k.setCamScale(1.5)

            const map = CREATIONAL_DUNGEON_MAPS[caveNumber]
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

            const mapWidthPx = CREATIONAL_DUNGEON_MAPS[zone][0].length * TILE_SIZE + TILE_SIZE;
            const mapHeightPx = CREATIONAL_DUNGEON_MAPS[zone].length * TILE_SIZE + TILE_SIZE;
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

                    // if (ch === '.') {
                    k.add([k.sprite("floor"), k.pos(x, y), k.z(-1),])
                    // }

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

                    if (ch === 'r') {
                        k.add([ k.sprite("boulder-grey"), k.pos(x, y), ])
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
                            addBoss(k, x, y, bossPatternName)
                        }
                    }

                    col++
                }
            }

            const spawns = MINION_SPAWNS[caveNumber] ?? []

            spawns.forEach((spawn, index) => {
                const spriteIndex = index % MINION_SPRITES.length
                addMinion(k, spawn.x * TILE_SIZE, spawn.y * TILE_SIZE, MINION_SPRITES[spriteIndex])
            })

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

            portalCollide(k)

            k.onCollide('player', 'cave-exit', () => {
                const nextCave = caveNumber + 1

                if (CREATIONAL_DUNGEON_MAPS[nextCave]) {
                    k.go('dungeon-creational', nextCave)
                } else {
                    // No more caves — back to overworld
                    useGameStore.getState().exitZone()
                    k.go(SCENES.OVERWORLD)
                }
            })
        })
    }
}

// ============================================================
// Enemy entity in dungeon
// ============================================================


function addMinion(k: KCtx, x: number, y: number, spriteName: string) {
    const minion = k.add([
        k.sprite(`${spriteName}-walk`, { anim: 'walk-down' }),
        k.pos(x, y),
        k.scale(ENEMY_SCALE * 0.7),        // smaller than boss
        k.area({ shape: new k.Rect(k.vec2(0, 0), TILE_SIZE, TILE_SIZE) }),
        k.body(),                           // not static — can move
        k.anchor('center'),
        k.z(5),
        'minion',
        {
            defeated: false,
            speed: 30,
            direction: k.vec2(1, 0),
            directionTimer: 0,
        },
    ])

    // Auto movement — change direction every 2-3 seconds
    k.onUpdate(() => {
        if (minion.defeated) return
        if (useGameStore.getState().isGamePaused) return

        minion.directionTimer += k.dt()

        if (minion.directionTimer > 2 + Math.random()) {
            // Pick a new random direction
            const directions = [
                k.vec2(1, 0),
                k.vec2(-1, 0),
                k.vec2(0, 1),
                k.vec2(0, -1),
            ]
            minion.direction = directions[Math.floor(Math.random() * directions.length)]
            minion.directionTimer = 0

            // Update walk animation
            const animMap: Record<string, string> = {
                '1,0': 'walk-right',
                '-1,0': 'walk-left',
                '0,1': 'walk-down',
                '0,-1': 'walk-up',
            }
            const key = `${minion.direction.x},${minion.direction.y}`
            try {
                minion.play(animMap[key] ?? 'walk-down')
            } catch { /* anim swap in progress */ }
        }

        minion.move(minion.direction.scale(minion.speed))
    })

    // Bounce off walls
    minion.onCollide('wall', () => {
        minion.direction = minion.direction.scale(-1)
        minion.directionTimer = 0
    })

    // Do NOT collide with other minions — they pass through each other
    // (simply don't add onCollide between minions)

    // Player collision — 2 question battle
    minion.onCollide('player', () => {
        if (minion.defeated) return
        if (useGameStore.getState().isGamePaused) return

        const gameStore = useGameStore.getState()
        gameStore.pauseGame()
        gameStore.setBattleRequirements(2)         
        // useGameStore.setState({ currentDungeonPatternId: 'Minion' }) 
        useGameStore.setState({ currentDungeonPatternId: 'Singleton' }) // generic pattern

        showBattleIntro(k, 'A wild enemy appears!', () => {
            gameStore.triggerBattle({} as never)
        })
    })

    // Listen for battle won — destroy minion
    // This needs to be triggered from BattleModal after win
    // Store a reference so BattleModal can destroy it
    useGameStore.setState({
        onBattleWon: () => {
            minion.defeated = true
            k.destroy(minion)
        }
    })

    return minion
}


function addBoss(k: KCtx, x: number, y: number, patternName: string) {
    const enemies = getEnemiesByZone(PATTERN_CATEGORY)
    const enemyDef = enemies.find(e => e.patternName === patternName)
    const sprite = enemyDef?.sprite ?? 'GoldStatue'
    const battleIntro = enemyDef?.battleIntro ?? `${patternName} boss appears!`

    const boss = k.add([
        k.sprite(`${sprite}-idle`, { anim: 'idle' }),
        k.pos(x, y),
        k.scale(ENEMY_SCALE * 1.4),        // bigger than minions
        k.area({ shape: new k.Rect(k.vec2(0, 0), TILE_SIZE, TILE_SIZE) }),
        k.anchor('center'),
        k.z(5),
        'boss',
        {
            patternName,
            defeated: false,
        },
    ])

    // Boss name label
    k.add([
        k.text(patternName, { size: 5, font: 'pixel' }),
        k.pos(x, y - TILE_SIZE * 2),
        k.color(255, 100, 100),            // red — indicates boss
        k.anchor('center'),
        k.z(20),
        { follow: boss },
    ])

    // Player collision — 5 question battle
    boss.onCollide('player', () => {
        if (boss.defeated) return
        if (useGameStore.getState().isGamePaused) return

        const gameStore = useGameStore.getState()
        gameStore.pauseGame()
        gameStore.setBattleRequirements(5)          // 5 questions for boss
        useGameStore.setState({ currentDungeonPatternId: patternName })

        showBattleIntro(k, battleIntro, () => {
            gameStore.triggerBattle({} as never)
        })
    })

    // Listen for battle won
    useGameStore.setState({
        onBattleWon: () => {
            boss.defeated = true
            k.destroy(boss)
        }
    })

    return boss
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