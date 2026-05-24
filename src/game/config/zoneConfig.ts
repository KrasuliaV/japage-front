/**
 * Zone Visual Configuration
 *
 * Design Pattern: DATA-DRIVEN CONFIGURATION (a form of the Strategy pattern)
 *
 * WHY: Categories are now dynamic — fetched from the backend after login.
 * We must never hardcode category names in UI or game logic. Instead, we
 * provide a registry of VISUAL properties (colors, labels, emoji) that are
 * looked up by name at runtime, with sensible fallbacks for unknown categories.
 *
 * HOW: A priority-ordered lookup:
 *   1. Exact match in ZONE_VISUAL_REGISTRY (known/seeded categories)
 *   2. Deterministic fallback derived from the category name string (hash-based)
 *   3. Absolute default (grey) if all else fails
 *
 * Adding a new category on the backend requires NO frontend code changes —
 * it will automatically receive a deterministic color/label from the fallback.
 */
export interface SpriteConfig {
  name: string;
  frame?: number;
}

export interface ZoneVisual {
  label: string
  emoji: string
  color: [number, number, number]
  cssColor: string
  floorSprite: SpriteConfig;
  enemySprites: string[]
}

// ---------------------------------------------------------------------------
// Registry — extend this when you add a new well-known category
// ---------------------------------------------------------------------------

const ZONE_VISUAL_REGISTRY: Record<string, ZoneVisual> = {
  CREATIONAL: {
    label: 'Creational Forest',
    emoji: '🌿',
    color: [100, 200, 100],
    cssColor: 'var(--color-hp-high)',
    floorSprite: { name: "field-green", frame: 0 },
    enemySprites: ['GoldStatue', 'Monk', 'Sultan', 'Caveman', 'Spirit'],
  },
  STRUCTURAL: {
    label: 'Structural Castle',
    emoji: '🏰',
    color: [100, 150, 220],
    cssColor: 'var(--color-accent)',
    // floorSprite: { name: "floor-tiles", frame: 23 },
    floorSprite: { name: "tileset-floor", frame: 188 },
    enemySprites: [
      'RobotGrey', 'Knight', 'GreenPig', 'Vampire',
      'Noble', 'NinjaGray', 'NinjaMasked',
    ],
  },
  BEHAVIORAL: {
    label: 'Behavioral Dungeon',
    emoji: '☠',
    color: [180, 80, 180],
    cssColor: 'var(--color-danger)',
    floorSprite: { name: "field-pink", frame: 0 },
    enemySprites: [
      'SkeletonDemon', 'SamuraiRed', 'Skeleton', 'Shaman',
      'Tengu', 'NinjaMageBlack', 'DemonGreen', 'NinjaDark',
      'Master', 'SorcererBlack',
    ],
  },
  OVERWORLD: {
    label: 'Overworld',
    emoji: '🗺',
    color: [200, 200, 200],
    cssColor: 'var(--color-text-secondary)',
    floorSprite: 'field-white',
    enemySprites: [],
  },
}

// ---------------------------------------------------------------------------
// Fallback palette — deterministic, so the same unknown category always gets
// the same color across sessions (avoids flickering on reload)
// ---------------------------------------------------------------------------

const FALLBACK_PALETTE: Array<[number, number, number]> = [
  [220, 160, 60],   // amber
  [60, 180, 220],   // cyan
  [220, 80, 140],   // rose
  [140, 220, 80],   // lime
  [80, 140, 220],   // periwinkle
  [220, 140, 80],   // peach
]

const FALLBACK_CSS = [
  '#dc9f3c', '#3cb4dc', '#dc508c', '#8cdc50', '#508cdc', '#dc8c50',
]

const FALLBACK_FLOOR_SPRITES = [
  'floor-tiles', 'field-green', 'field-pink', 'field-white', 'field-light-green',
]

const FALLBACK_ENEMY_POOL = [
  'GoldStatue', 'RobotGrey', 'Knight', 'Shaman', 'Skeleton', 'Spirit',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function buildFallback(categoryName: string): ZoneVisual {
  const h = hashString(categoryName)
  const idx = h % FALLBACK_PALETTE.length
  const label = categoryName.charAt(0) + categoryName.slice(1).toLowerCase() + ' Zone'
  return {
    label,
    emoji: '⚔',
    color: FALLBACK_PALETTE[idx],
    cssColor: FALLBACK_CSS[idx],
    floorSprite: FALLBACK_FLOOR_SPRITES[h % FALLBACK_FLOOR_SPRITES.length],
    enemySprites: FALLBACK_ENEMY_POOL,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the ZoneVisual for a given category name.
 * Falls back gracefully for unknown/future categories.
 */
export function getZoneVisual(categoryName: string): ZoneVisual {
  return ZONE_VISUAL_REGISTRY[categoryName] ?? buildFallback(categoryName)
}

/**
 * Returns only the enemy sprites for a zone (used by asset loader).
 * Includes all boss pool sprites regardless of zone.
 */
export function getZoneEnemySprites(categoryName: string): string[] {
  return getZoneVisual(categoryName).enemySprites
}

/**
 * All known boss sprites — must be loaded for ANY dungeon entry
 * because boss assignment is hash-based, not zone-specific.
 */
export const ALL_BOSS_SPRITES: string[] = [
  'GoldStatue', 'Monk', 'Sultan', 'Caveman', 'Spirit',
  'RobotGrey', 'Knight', 'GreenPig', 'Vampire', 'Noble',
  'NinjaGray', 'NinjaMasked', 'SamuraiRed', 'Shaman',
  'Tengu', 'NinjaMageBlack', 'DemonGreen', 'NinjaDark',
  'Master', 'SorcererBlack',
]

/**
 * Returns the deduplicated set of sprites needed for a given zone.
 */
export function getSpritesForZone(categoryName: string): string[] {
  const minionSprites = getZoneEnemySprites(categoryName)
  return Array.from(new Set([...minionSprites, ...ALL_BOSS_SPRITES]))
}
