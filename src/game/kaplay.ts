import kaplay from 'kaplay'

// ============================================================
// Kaplay initialization
// Called once, returns the kaplay context (k)
// The canvas is mounted behind the React UI overlay
// ============================================================

export function initKaplay(canvas: HTMLCanvasElement) {
  const k = kaplay({
    canvas,
    width:      Number(import.meta.env.VITE_GAME_WIDTH)  || 800,
    height:     Number(import.meta.env.VITE_GAME_HEIGHT) || 600,
    letterbox:  true,
    background: [10, 14, 26],    // --color-bg-deep
    debug:      import.meta.env.DEV,
    global:     false,           // no global pollution — use k.xxx
    scale:      1,
  })

  loadAllAssets(k)

  return k
}

// ============================================================
// Asset loading
// All paths relative to /public/assets
// ============================================================

export function loadAllAssets(k: ReturnType<typeof kaplay>) {
  const TILE = 16
  const PLAYER_FRAME = 32
  const ENEMY_FRAME  = 16

  // ── Player — NinjaGreen ──────────────────────────────────
  // 4 cols × 4 rows, each frame 32×32, rows = directions (down/left/right/up)

  k.loadSprite('player-walk', '/assets/sprites/player/Walk.png', {
    sliceX: 4, sliceY: 4,
    anims: {
      'walk-down':  { from: 0,  to: 3,  loop: true, speed: 8 },
      'walk-left':  { from: 4,  to: 7,  loop: true, speed: 8 },
      'walk-right': { from: 8,  to: 11, loop: true, speed: 8 },
      'walk-up':    { from: 12, to: 15, loop: true, speed: 8 },
    },
  })

  k.loadSprite('player-idle', '/assets/sprites/player/Idle.png', {
    sliceX: 4, sliceY: 4,
    anims: {
      'idle-down':  { from: 0,  to: 3,  loop: true, speed: 4 },
      'idle-left':  { from: 4,  to: 7,  loop: true, speed: 4 },
      'idle-right': { from: 8,  to: 11, loop: true, speed: 4 },
      'idle-up':    { from: 12, to: 15, loop: true, speed: 4 },
    },
  })

  k.loadSprite('player-attack', '/assets/sprites/player/Attack.png', {
    sliceX: 4, sliceY: 4,
    anims: {
      'attack-down':  { from: 0,  to: 3,  loop: false, speed: 10 },
      'attack-left':  { from: 4,  to: 7,  loop: false, speed: 10 },
      'attack-right': { from: 8,  to: 11, loop: false, speed: 10 },
      'attack-up':    { from: 12, to: 15, loop: false, speed: 10 },
    },
  })

  k.loadSprite('player-hit', '/assets/sprites/player/Hit.png', {
    sliceX: 4, sliceY: 2,
    anims: {
      'hit-down': { from: 0, to: 3, loop: false, speed: 10 },
      'hit-up':   { from: 4, to: 7, loop: false, speed: 10 },
    },
  })

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
        'walk-down':  { from: 0,  to: 3,  loop: true, speed: 6 },
        'walk-left':  { from: 4,  to: 7,  loop: true, speed: 6 },
        'walk-right': { from: 8,  to: 11, loop: true, speed: 6 },
        'walk-up':    { from: 12, to: 15, loop: true, speed: 6 },
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

  // ── Tilesets ─────────────────────────────────────────────

  k.loadSpriteAtlas('/assets/tilesets/TilesetNature.png', {})
  k.loadSpriteAtlas('/assets/tilesets/TilesetRelief.png', {})
  k.loadSpriteAtlas('/assets/tilesets/TilesetFloor.png', {})
  k.loadSpriteAtlas('/assets/tilesets/TilesetDungeon.png', {})
  k.loadSpriteAtlas('/assets/tilesets/TilesetElement.png', {})

  // ── UI sprites ────────────────────────────────────────────

  k.loadSprite('dialog-box', '/assets/ui/dialog/DialogBox.png')
  k.loadSprite('dialog-simple', '/assets/ui/dialog/DialogueBoxSimple.png')

  // ── Font ─────────────────────────────────────────────────

  k.loadFont('pixel', '/assets/fonts/NormalFont.ttf')

  console.log('[Kaplay] All assets loading started')

  return { TILE, PLAYER_FRAME, ENEMY_FRAME }
}

// ============================================================
// Scene constants
// ============================================================

export const SCENES = {
  LOADING:   'loading',
  OVERWORLD: 'overworld',
  CREATIONAL_DUNGEON:  'dungeon-creational',
  STRUCTURAL_DUNGEON:  'dungeon-structural',
  BEHAVIORAL_DUNGEON:  'dungeon-behavioral',
} as const

export type SceneName = typeof SCENES[keyof typeof SCENES]

// ============================================================
// Tile and sprite constants
// ============================================================

export const TILE_SIZE     = 16
export const PLAYER_SCALE  = 2    // renders at 64×64
export const ENEMY_SCALE   = 2    // renders at 32×32
export const PLAYER_SPEED  = 120  // pixels per second
export const ENEMY_SPEED   = 40

// ============================================================
// Zone color tints for map areas
// ============================================================

export const ZONE_COLORS = {
  CREATIONAL:  [100, 200, 100] as [number, number, number],   // green
  STRUCTURAL:  [100, 150, 220] as [number, number, number],   // blue
  BEHAVIORAL:  [180,  80, 180] as [number, number, number],   // purple
} as const
