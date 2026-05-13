import type kaplay from 'kaplay'
import { useGameStore } from '@/stores/gameStore'
import { SCENES, ZONE_COLORS, TILE_SIZE } from '@/game/kaplay'
import { addPortal, portalCollide } from '@/game/entities/portal'
import { addMinion, addBoss, clearEnemyRegistry, initEnemyManager, disposeEnemyManager } from '@/game/entities/enemies'
import { addChest } from '@/game/entities/chest'
import {
    addOptimizedCollisions, getFloorSprite, getInnerWallFrame, getOuterWallFrame,
    getInnerCaveWallFrame, getOuterCaveWallFrame
} from '@/game/entities/map'
import { createPlayer, setupPlayerMovement } from '@/game/entities/player'
import { characterApi } from '@/api/game'
import { PatternOption } from '@/types'
import { MINION_COUNT, SAFE_SPAWN_RADIUS_TILES } from '../constants'

type KCtx = ReturnType<typeof kaplay>

const DUNGEON_MAP_INITIAL = [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'R...W.........................................W...R',
    'R...W.......c.................................W...R',
    'R...W.......c...........................ccc...W...R',
    'R...W..............c..........................W...R',
    'R...W.........................................W...R',
    'R...W...........................G.............W...R',
    'RWWWW.......................................T.WWWWR',
    'R................G.........................Tt.....E',
    'R.................................................E',
    'R..O.....................i..................B.....E',
    'R.......P.........................................E',
    'R..................GG......................Tt.....E',
    'RWWWW.......................................T.WWWWR',
    'R...W........................G................W...R',
    'R...W........................G................W...R',
    'R...W......cc......c..........................W...R',
    'R...W.....cc.................G................W...R',
    'R...W..............c..........................W...R',
    'R...W.....i...................................W...R',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
]

const DUNGEON_MAP_MIDDLE = [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'R...W.........................................W...R',
    'R...W.....................G...................W...R',
    'R...W.........................................W...R',
    'R...W.........................................W...R',
    'R...W.......G.............G...................W...R',
    'R...W.............................c...........W...R',
    'RWWWW.........G.............................T.WWWWR',
    'R..........................................Tt.....E',
    'R.............................ccc.................E',
    'R......P......................cc............B.....E',
    'R.................c...............................E',
    'R................cc........................Tt.....E',
    'RWWWW.............cc........................T.WWWWR',
    'R...W.........................................W...R',
    'R...W........G..................G.............W...R',
    'R...W.........................................W...R',
    'R...W.....................G...................W...R',
    'R...W.........................................W...R',
    'R...W.........................................W...R',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
]

const DUNGEON_MAP_FINAL = [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'R...W.........................................W........R',
    'R...W.........................................W........R',
    'R...W.........................................W........R',
    'R...W.........................................W........R',
    'R...W.........................................W........R',
    'R...W.........................................W........R',
    'RWWWW.......................................T.WWWWWWWWWR',
    'e..........................................Tt..........R',
    'e......................................................R',
    'e......P....................................B.......O..R',
    'e......................................................R',
    'e..........................................Tt..........R',
    'RWWWW.......................................T.WWWWWWWWWR',
    'R...W.........................................W........R',
    'R...W.........................................W........R',
    'R...W.........................................W........R',
    'R...W.........................................W........R',
    'R...W.........i...............................W........R',
    'R...W.........................................W........R',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
]

function shuffle<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export function registerDungeonScenes(k: KCtx) {
    k.scene("dungeon-run", async (categoryName: string, patternSequenceNumber: number, caveNumber: number = 1) => {
        const state = useGameStore.getState()
        const category = state.categories.find(c => c.name === categoryName);
        const characterId = state.character?.id
        if (!characterId) {
            console.error("No character found in store!")
            return
        }
        if (!category) {
            console.error("Category data missing for :", categoryName);
            await characterApi.backToSafe(characterId)
            k.go(SCENES.OVERWORLD)
            return;
        }
        const pattern = category.patterns.find(p => p.sequenceNumber === patternSequenceNumber);
        if (!pattern) {
            console.error("Pattern data missing for :", patternSequenceNumber, "in category:", categoryName);
            await characterApi.backToSafe(characterId)
            k.go(SCENES.OVERWORLD)
            return;
        }
        const totalCavesForPattern = Math.ceil(pattern.questionsNumber / 10);

        const isFirstCaveInCategory = pattern.sequenceNumber === 1;
        const isLastCaveInCategory = pattern.sequenceNumber === category.patterns.length && caveNumber === totalCavesForPattern;
        const isLastCaveInPattern = caveNumber === totalCavesForPattern;

        const mapTemplate = selectTemplate(isFirstCaveInCategory, isLastCaveInCategory);

        const randomNumber = Math.floor(Math.random() * 3) + 1;
        const [r, g, b] = ZONE_COLORS[randomNumber];
        k.setBackground(Math.floor(r * 0.15), Math.floor(g * 0.15), Math.floor(b * 0.15));

        initEnemyManager(k)

        buildMap(k, mapTemplate, {
            floor: getFloorSprite(categoryName),
            bossName: isLastCaveInPattern ? pattern.name : null,
            hasOverworldPortal: isFirstCaveInCategory || isLastCaveInCategory,
            caveNumber: caveNumber,
            categoryName: categoryName,
            pattern: pattern,
        });


        k.onCollide('player', 'cave-exit', async () => {
            const state = useGameStore.getState()
            const characterId = state.character?.id
            if (!characterId) {
                console.error("No character found in store!")
                return
            }
            if (caveNumber < totalCavesForPattern) {
                await characterApi.startAdventuring(characterId, {
                    category: categoryName,
                    patternId: pattern?.id || '',
                    caveNumber: caveNumber + 1
                })
                k.go("dungeon-run", categoryName, patternSequenceNumber, caveNumber + 1);
            } else if (patternSequenceNumber < category.patterns.length) {
                await characterApi.startAdventuring(characterId, {
                    category: categoryName,
                    patternId: pattern?.id || '',
                    caveNumber: 1
                })
                k.go("dungeon-run", categoryName, patternSequenceNumber + 1, 1);
            } else {
                await characterApi.backToSafe(characterId)
                state.exitZone()
                k.go(SCENES.OVERWORLD)
            }
        });
    });
}

function selectTemplate(isFirstCaveInCategory: boolean, isLastCaveInCategory: boolean): string[] {
    if (isFirstCaveInCategory) {
        return DUNGEON_MAP_INITIAL;
    } else if (isLastCaveInCategory) {
        return DUNGEON_MAP_FINAL;
    } else {
        return DUNGEON_MAP_MIDDLE;
    }
}

function buildMap(k: KCtx, template: string[],
    assets: {
        floor: string, bossName: string | null, hasOverworldPortal: boolean,
        caveNumber: number, categoryName: string, pattern: PatternOption
    }) {
    const store = useGameStore.getState()
    const targetCave = store.targetCave

    let spawnX: number | undefined
    let spawnY: number | undefined
    let undefeatedMinionsCount = MINION_COUNT
    let isBossDefeated = false

    if (targetCave && targetCave.caveNumber === assets.caveNumber) {
        spawnX = targetCave.spawnX
        spawnY = targetCave.spawnY
        undefeatedMinionsCount = targetCave.undefeatedMinionCount
        isBossDefeated = targetCave.bossDefeated

        // IMPORTANT: Clear targetCave after reading it, so if the scene
        // is re-entered naturally (not from restoration), defaults apply
        useGameStore.getState().setTargetCave(null)
    }

    store.enterZone(assets.categoryName)

    k.setCamScale(1.5)
    clearEnemyRegistry();

    let playerSpawn = k.vec2(3 * TILE_SIZE, 3 * TILE_SIZE)

    const occupiedTiles = new Set<string>();
    const floorTiles: Array<{ x: number, y: number }> = [];

    const markOccupied = (startCol: number, startRow: number, width: number, height: number) => {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                occupiedTiles.add(`${startCol + x},${startRow + y}`);
            }
        }
    };

    for (let row = 0; row < template.length; row++) {
        const cells = template[row].split('');
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
    for (let row = 0; row < template.length; row++) {
        const cells = template[row].split('')
        let col = 0

        for (const ch of cells) {
            const x = col * TILE_SIZE
            const y = row * TILE_SIZE

            k.add(
                [
                    // k.sprite("tileset-floor", { frame: 88 }),
                    // k.sprite("tileset-floor", { frame: 242 }),
                    k.sprite("tileset-floor", { frame: 177 }),
                    k.pos(col * TILE_SIZE, row * TILE_SIZE),
                    k.z(-1),
                ])
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
                case 'R': {
                    k.add([
                        k.sprite("tileset-interior", { frame: getOuterCaveWallFrame(template, row, col) }),
                        k.pos(col * TILE_SIZE, row * TILE_SIZE),
                        'wall'
                    ]);
                    break;
                };
                case 'W': {
                    k.add([
                        k.sprite("tileset-interior", { frame: getInnerCaveWallFrame(template, row, col) }),
                        k.pos(col * TILE_SIZE, row * TILE_SIZE),
                        'wall'
                    ]);
                    break;
                };
                case 'c': {
                    k.add([k.sprite("small-orange-crystal"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                    break;
                };
                case 'G': {
                    k.add([k.sprite("big-green-crystal-rock"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                    break;
                };
                case 'b': {
                    k.add([k.sprite("boulder-grey"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                    break;
                };
                case 'E': {
                    k.add([k.sprite("transition"), k.pos(x, y), k.area(), k.z(1), 'cave-exit']);
                    break;
                };
                case 'T': {
                    k.add([k.sprite("tree-green-2"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                    break;
                };
                case 't': {
                    k.add([k.sprite("tree-green"), k.pos(x, y), k.area(), k.body({ isStatic: true }), 'wall']);
                    break;
                };
                case 'i': {
                    if (assets.bossName) {
                        addChest(k, x, y, assets.bossName)
                    }
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
                        if (assets.bossName) {
                            addBoss(k, x, y, assets.bossName, assets.categoryName)
                        }
                    }
                    break;
            }
            col++
        }
    }

    const safeSpawns = floorTiles.filter(tile =>
        k.vec2(tile.x, tile.y).dist(playerSpawn) > TILE_SIZE * SAFE_SPAWN_RADIUS_TILES
    );

    shuffle(safeSpawns).slice(0, undefeatedMinionsCount).forEach((spawn, i) => {
        addMinion(k, spawn.x, spawn.y, null, assets.pattern.name);
    });

    addOptimizedCollisions(k, template, 'R', 'wall');
    addOptimizedCollisions(k, template, 'W', 'water-barrier');

    // ── Player ──────────────────────────────────────────────
    spawnPlayer(k, playerSpawn);

    // ── Back to overworld (Escape key) ────────────────────────
    // k.onKeyPress('escape', () => {
    //     const state = useGameStore.getState()
    //     if (!state.isGamePaused) {
    //         const characterId = state.character?.id
    //         if (!characterId) {
    //             console.error("No character found in store!")
    //             return
    //         }
    //         useGameStore.getState().exitZone()
    //         characterApi.backToSafe(characterId)
    //         k.go(SCENES.OVERWORLD)
    //     }
    // })

    portalCollide(k)

    k.onSceneLeave(() => {
        clearEnemyRegistry();
        disposeEnemyManager();
    });
}

function spawnPlayer(k: KCtx, playerSpawn: ReturnType<typeof k.vec2>) {
    const player = createPlayer(k, playerSpawn);
    
    k.onUpdate(() => {
        const isPaused = useGameStore.getState().isGamePaused
        player.paused = isPaused
        k.setCamPos(player.pos);
        setupPlayerMovement(k, player);
    });

    return player;
}