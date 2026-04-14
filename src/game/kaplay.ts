import kaplay from 'kaplay'

// ============================================================
// Kaplay initialization
// Called once, returns the kaplay context (k)
// The canvas is mounted behind the React UI overlay
// ============================================================

export function initKaplay(canvas: HTMLCanvasElement, onReady: () => void) {
  const k = kaplay({
    canvas,
    width: Number(import.meta.env.VITE_GAME_WIDTH) || 1280,
    height: Number(import.meta.env.VITE_GAME_HEIGHT) || 720,
    letterbox: true,
    background: [10, 14, 26],    // --color-bg-deep
    debug: true,
    global: false,
    scale: 1,
  })

  loadAllAssets(k)
  k.onLoad(() => {
    console.log('[Kaplay] All assets loaded — ready')
    onReady()
  })

  console.log('[Kaplay] ⏳ Initializing...')
  return k
}

// ============================================================
// Asset loading
// All paths relative to /public/assets
// ============================================================

export function loadAllAssets(k: ReturnType<typeof kaplay>) {
  const TILE = 8
  const PLAYER_FRAME = 16
  const ENEMY_FRAME = 8

  // ── Player — NinjaGreen ──────────────────────────────────
  // 4 cols × 4 rows, each frame 32×32, rows = directions (down/left/right/up)

  k.loadSprite('player-walk', '/assets/sprites/player/Walk.png', {
    sliceX: 4, sliceY: 4,
    anims: {
      'walk-down': { from: 0, to: 3, loop: true, speed: 8 },
      'walk-left': { from: 4, to: 7, loop: true, speed: 8 },
      'walk-right': { from: 8, to: 11, loop: true, speed: 8 },
      'walk-up': { from: 12, to: 15, loop: true, speed: 8 },
    },
  })

  k.loadSprite('player-idle', '/assets/sprites/player/Idle.png', {
    sliceX: 4, sliceY: 4,
    anims: {
      'idle-down': { from: 0, to: 3, loop: true, speed: 4 },
      'idle-left': { from: 4, to: 7, loop: true, speed: 4 },
      'idle-right': { from: 8, to: 11, loop: true, speed: 4 },
      'idle-up': { from: 12, to: 15, loop: true, speed: 4 },
    },
  })

  k.loadSprite('player-attack', '/assets/sprites/player/Attack.png', {
    sliceX: 4, sliceY: 4,
    anims: {
      'attack-down': { from: 0, to: 3, loop: false, speed: 10 },
      'attack-left': { from: 4, to: 7, loop: false, speed: 10 },
      'attack-right': { from: 8, to: 11, loop: false, speed: 10 },
      'attack-up': { from: 12, to: 15, loop: false, speed: 10 },
    },
  })

  k.loadSprite('player-hit', '/assets/sprites/player/Hit.png', {
    sliceX: 4, sliceY: 2,
    anims: {
      'hit-down': { from: 0, to: 3, loop: false, speed: 10 },
      'hit-up': { from: 4, to: 7, loop: false, speed: 10 },
    },
  })
  const playerConfig = {
    sliceX: 4,
    sliceY: 7,
    anims: {
      'idle-down': 0,
      'walk-down': { from: 0, to: 3, loop: true },
      'walk-left': { from: 4, to: 7, loop: true },
      'walk-right': { from: 8, to: 11, loop: true },
      'walk-up': { from: 12, to: 15, loop: true },
    }
  }

  k.loadSprite('player-wizard', '/assets/sprites/player/blueNinja/SpriteSheet.png', playerConfig
    // {
    // sliceX: 4,
    // sliceY: 7,
    // anims: {
    //   'idle-down': 0,
    //   'walk-down': { from: 0, to: 3, loop: true },
    //   'walk-left': { from: 4, to: 7, loop: true },
    //   'walk-right': { from: 8, to: 11, loop: true },
    //   'walk-up': { from: 12, to: 15, loop: true },
    // },
    // }
  )
  k.loadSprite('player-rogue', '/assets/sprites/player/darkNinja/SpriteSheet.png', playerConfig
    //   {
    //   sliceX: 4,
    //   sliceY: 7,
    //   anims: {
    //     'idle-down': 0,
    //     'walk-down': { from: 0, to: 3, loop: true },
    //     'walk-left': { from: 4, to: 7, loop: true },
    //     'walk-right': { from: 8, to: 11, loop: true },
    //     'walk-up': { from: 12, to: 15, loop: true },
    //   },
    // }
  )
  k.loadSprite('player-knight', '/assets/sprites/player/SpriteSheet.png', playerConfig
    //   {
    //   sliceX: 4,
    //   sliceY: 7,
    //   anims: {
    //     'idle-down': 0,
    //     'walk-down': { from: 0, to: 3, loop: true },
    //     'walk-left': { from: 4, to: 7, loop: true },
    //     'walk-right': { from: 8, to: 11, loop: true },
    //     'walk-up': { from: 12, to: 15, loop: true },
    //   },
    // }
  )

  // ── Enemies — all 16×16 px ────────────────────────────────
  // Walk: 4 cols × 4 rows (4 directions × 4 frames)
  // Idle: 4 cols × 1 row
  // Attack: 4 cols × 1 row

  const enemies = [
    // Creational zone
    'GoldStatue', 'Monk', 'Sultan', 'Caveman', 'Spirit',
    // Structural zone
    'RobotGrey', 'Knight', 'GreenPig', 'Vampire', 'Noble', 'NinjaGray', 'NinjaMasked',
    // Behavioral zone
    'SkeletonDemon', 'SamuraiRed', 'Skeleton', 'Shaman',
    'Tengu', 'NinjaMageBlack', 'DemonGreen', 'NinjaDark',
    'Master', 'SorcererBlack',
  ]

  for (const enemy of enemies) {
    const base = `/assets/sprites/enemies/${enemy}`

    k.loadSprite(`${enemy}-walk`, `${base}/Walk.png`, {
      sliceX: 4, sliceY: 4,
      anims: {
        'walk-down': { from: 0, to: 3, loop: true, speed: 6 },
        'walk-left': { from: 4, to: 7, loop: true, speed: 6 },
        'walk-right': { from: 8, to: 11, loop: true, speed: 6 },
        'walk-up': { from: 12, to: 15, loop: true, speed: 6 },
      },
    })

    k.loadSprite(`${enemy}-idle`, `${base}/Idle.png`, {
      sliceX: 4, sliceY: 1,
      anims: {
        idle: { from: 0, to: 3, loop: true, speed: 4 },
      },
    })

    k.loadSprite(`${enemy}-attack`, `${base}/Attack.png`, {
      sliceX: 4, sliceY: 1,
      anims: {
        attack: { from: 0, to: 3, loop: false, speed: 8 },
      },
    })
  }

  k.loadSprite('tileset-nature', '/assets/tilesets/TilesetNature.png', { sliceX: 24, sliceY: 21 })

  // ── Tilesets ─────────────────────────────────────────────

  k.loadSpriteAtlas('/assets/tilesets/TilesetNature.png', {
    // ── Trees ─────────────────────────────────────────────────
    'tree-green': { x: 0, y: 0, width: TILE_SIZE * 2, height: TILE_SIZE * 2 },
    'tree-green-2': { x: 32, y: 0, width: TILE_SIZE * 2, height: TILE_SIZE * 2 },
    'tree-pink': { x: 224, y: 0, width: TILE_SIZE * 2, height: TILE_SIZE * 2 },
    'tree-dead': { x: 64, y: 0, width: TILE_SIZE * 2, height: TILE_SIZE * 2 },

    // ── Small objects ─────────────────────────────────────────
    'stump': { x: 0, y: 128, width: TILE_SIZE * 2, height: TILE_SIZE * 2 },
    'bush': { x: 0, y: 160, width: TILE_SIZE, height: TILE_SIZE },
    'flower': { x: 0, y: 176, width: TILE_SIZE, height: TILE_SIZE },

    // ── Rocks ─────────────────────────────────────────────────
    'rock-dark': { x: 112, y: 192, width: TILE_SIZE, height: TILE_SIZE },
    'rock-grey': { x: 128, y: 192, width: TILE_SIZE, height: TILE_SIZE },
    'boulder-brown': { x: 240, y: 192, width: TILE_SIZE * 2, height: TILE_SIZE * 2 },
    'boulder-grey': { x: 240, y: 224, width: TILE_SIZE * 2, height: TILE_SIZE * 2 },

    'small-orange-crystal': { x: 0, y: 224, width: TILE_SIZE, height: TILE_SIZE },
    'big-green-crystal-rock': { x: 144, y: 256, width: TILE_SIZE * 2, height: TILE_SIZE * 2 },
  })
  k.loadSpriteAtlas('/assets/tilesets/TilesetRelief.png', {

  })
  k.loadSpriteAtlas('/assets/tilesets/TilesetFloor.png', {
    'light-green': { x: 36, y: 160, width: TILE_SIZE, height: TILE_SIZE },
  })
  k.loadSpriteAtlas('/assets/tilesets/TilesetField.png', {
    'orange': { x: 24, y: 6, width: TILE_SIZE, height: TILE_SIZE },
    'field-light-green': { x: 24, y: 54, width: TILE_SIZE, height: TILE_SIZE },
    'field-green': { x: 24, y: 102, width: TILE_SIZE, height: TILE_SIZE },
    'field-pink': { x: 24, y: 150, width: TILE_SIZE, height: TILE_SIZE },
    'field-white': { x: 24, y: 198, width: TILE_SIZE, height: TILE_SIZE },
  })
  k.loadSpriteAtlas('/assets/tilesets/floor.png', {
    'floor': {
      x: TILE_SIZE,
      y: TILE_SIZE,
      width: TILE_SIZE * 2,
      height: TILE_SIZE * 2,
    },
  });
  k.loadSpriteAtlas('/assets/tilesets/TilesetDungeon.png', {})
  k.loadSpriteAtlas('/assets/tilesets/TilesetElement.png', {
    'chest-close': { x: 96, y: 0, width: TILE_SIZE, height: TILE_SIZE },
    'chest-open': { x: 112, y: 0, width: TILE_SIZE, height: TILE_SIZE },
  })
  k.loadSpriteAtlas('/assets/tilesets/TilesetHouse.png', {
    'portal': { x: 464, y: 320, width: TILE_SIZE * 3, height: TILE_SIZE * 3 },
    'transition': { x: 144, y: 256, width: TILE_SIZE, height: TILE_SIZE },
  })

  // ── UI sprites ────────────────────────────────────────────

  k.loadSprite('dialog-box', '/assets/ui/dialog/DialogBox.png')
  k.loadSprite('dialog-simple', '/assets/ui/dialog/DialogueBoxSimple.png')

  //── UI sprites ────────────────────────────────────────────

  k.loadSprite('spark', '/assets/sprites/magic/SpriteSheetSpark.png', {
    sliceX: 6, sliceY: 1,
    anims: {
      'move': { from: 0, to: 5, loop: true, speed: 6 },
    },
  })

  // ── Font ─────────────────────────────────────────────────

  k.loadFont('pixel', '/assets/fonts/NormalFont.ttf')

  //  ── New upload type ─────────────────────────────────────────────────

  k.loadSprite('tileset-field', '/assets/tilesets/TilesetField.png', {
    sliceX: 10,
    sliceY: 10,
  })

  // k.loadSprite('tileset-interior', '/assets/tilesets/TilesetInterior.png', {
  //   sliceX: 30,
  //   sliceY: 30,
  // })
  k.loadSprite("tileset-interior", "/assets/tilesets/TilesetInterior.png", {
    sliceX: 16,
    sliceY: 20,
});

  // k.loadSprite('tileset-cave', '/assets/tilesets/TilesetCave.png', {
  //   sliceX: 10,
  //   sliceY: 10,
  // })
  k.loadSprite("floor-tiles", "/assets/tilesets/TilesetInteriorFloor.png", {
    sliceX: 22, // The image is 256px wide (256 / 16 = 16)
    sliceY: 17, // The image is 288px high (288 / 16 = 18)
});
  k.loadSprite('tileset-floor', '/assets/tilesets/TilesetFloor.png', {
    sliceX: 10,
    sliceY: 10,
  })
  k.loadSprite('tileset-dungeon', '/assets/tilesets/TilesetDungeon.png', {
    sliceX: 12,
    sliceY: 4,
  })
  k.loadSprite('tileset-element', '/assets/tilesets/TilesetElement.png', {
    sliceX: 10,
    sliceY: 10,
  })

  // k.loadSprite('portal-gate', '/assets/ninja-adventure/Items/Treasure/Portal.png')

  // The Swirling Portal Core (Animated)
  // k.loadSprite('portal-core', '/assets/ninja-adventure/FX/Magic/Circle/Blue.png', {
  //   sliceX: 4,
  //   anims: {
  //     'active': { from: 0, to: 3, loop: true, speed: 10 },
  //   },
  // })

  // Interactive Fountain (Citadel Pass)
  // k.loadSprite('fountain', '/assets/ninja-adventure/Items/Interactive/Fountain.png', {
  //   sliceX: 3,
  //   anims: {
  //     'flow': { from: 0, to: 2, loop: true, speed: 6 },
  //   },
  // })
  console.log('[Kaplay] All assets loading started')

  return { TILE, PLAYER_FRAME, ENEMY_FRAME }
}

// ============================================================
// Scene constants
// ============================================================

export const SCENES = {
  LOADING: 'loading',
  OVERWORLD: 'overworld',
  CREATIONAL_DUNGEON: 'dungeon-creational',
  STRUCTURAL_DUNGEON: 'dungeon-structural',
  BEHAVIORAL_DUNGEON: 'dungeon-behavioral'
} as const

export type SceneName = typeof SCENES[keyof typeof SCENES]

// ============================================================
// Tile and sprite constants
// ============================================================

export const TILE_SIZE = 16
export const PLAYER_SCALE = 2    // renders at 64×64
export const ENEMY_SCALE = 2    // renders at 32×32
export const PLAYER_SPEED = 120  // pixels per second
export const ENEMY_SPEED = 40

// ============================================================
// Zone color tints for map areas
// ============================================================

export const ZONE_COLORS = {
  CREATIONAL: [100, 200, 100] as [number, number, number],   // green
  STRUCTURAL: [100, 150, 220] as [number, number, number],   // blue
  BEHAVIORAL: [180, 80, 180] as [number, number, number],   // purple
} as const
