import type { PatternCategory } from '@/types'

// ============================================================
// Enemy definitions
// Maps each pattern to a sprite and dungeon zone
// ============================================================

export interface EnemyDef {
  patternName: string
  sprite: string
  zone: PatternCategory
  // Starting position in the dungeon map (tile coordinates)
  tileX: number
  tileY: number
  // Lore description shown before battle starts
  battleIntro: string
}

export const ENEMY_DEFINITIONS: Record<string, EnemyDef> = {
  // ── CREATIONAL ZONE ──────────────────────────────────────

  'Singleton': {
    patternName: 'Singleton',
    sprite: 'GoldStatue',
    zone: 'CREATIONAL',
    tileX: 8,  tileY: 6,
    battleIntro: 'The Gold Statue stirs. "There can be only ONE instance of me!"',
  },
  'Factory Method': {
    patternName: 'Factory Method',
    sprite: 'Monk',
    zone: 'CREATIONAL',
    tileX: 14, tileY: 4,
    battleIntro: 'The Monk raises his hand. "I delegate creation to my disciples!"',
  },
  'Abstract Factory': {
    patternName: 'Abstract Factory',
    sprite: 'Sultan',
    zone: 'CREATIONAL',
    tileX: 6,  tileY: 12,
    battleIntro: 'The Sultan commands his court. "My factory produces entire families!"',
  },
  'Builder': {
    patternName: 'Builder',
    sprite: 'Caveman',
    zone: 'CREATIONAL',
    tileX: 18, tileY: 10,
    battleIntro: 'The Caveman growls. "Me build complex object... step by step!"',
  },
  'Prototype': {
    patternName: 'Prototype',
    sprite: 'Spirit',
    zone: 'CREATIONAL',
    tileX: 12, tileY: 15,
    battleIntro: 'The Spirit flickers and splits. "I clone myself rather than be created anew!"',
  },

  // ── STRUCTURAL ZONE ──────────────────────────────────────

  'Adapter': {
    patternName: 'Adapter',
    sprite: 'RobotGrey',
    zone: 'STRUCTURAL',
    tileX: 7,  tileY: 5,
    battleIntro: 'The Robot buzzes. "I convert incompatible interfaces. Resistance is futile!"',
  },
  'Bridge': {
    patternName: 'Bridge',
    sprite: 'Knight',
    zone: 'STRUCTURAL',
    tileX: 15, tileY: 8,
    battleIntro: 'The Knight stands firm. "Abstraction and implementation shall vary independently!"',
  },
  'Composite': {
    patternName: 'Composite',
    sprite: 'GreenPig',
    zone: 'STRUCTURAL',
    tileX: 10, tileY: 14,
    battleIntro: 'The Pig snorts. "Treat me as one or as many — I am the tree and its leaves!"',
  },
  'Decorator': {
    patternName: 'Decorator',
    sprite: 'Vampire',
    zone: 'STRUCTURAL',
    tileX: 4,  tileY: 11,
    battleIntro: 'The Vampire grins. "I wrap you in new behaviour... without changing your class!"',
  },
  'Facade': {
    patternName: 'Facade',
    sprite: 'Noble',
    zone: 'STRUCTURAL',
    tileX: 19, tileY: 6,
    battleIntro: 'The Noble bows. "I present a simple face. The complexity behind me is none of your concern."',
  },
  'Flyweight': {
    patternName: 'Flyweight',
    sprite: 'NinjaGray',
    zone: 'STRUCTURAL',
    tileX: 8,  tileY: 16,
    battleIntro: 'The gray ninja flickers — a hundred of him at once. "We share state to save memory!"',
  },
  'Proxy': {
    patternName: 'Proxy',
    sprite: 'NinjaMasked',
    zone: 'STRUCTURAL',
    tileX: 14, tileY: 12,
    battleIntro: 'The masked figure steps forward. "I am the surrogate. You deal with me, not the real object."',
  },

  // ── BEHAVIORAL ZONE ──────────────────────────────────────

  'Chain of Responsibility': {
    patternName: 'Chain of Responsibility',
    sprite: 'SkeletonDemon',
    zone: 'BEHAVIORAL',
    tileX: 6,  tileY: 6,
    battleIntro: 'The demon rattles its chains. "Your request passes through us all... until one of us handles it!"',
  },
  'Command': {
    patternName: 'Command',
    sprite: 'SamuraiRed',
    zone: 'BEHAVIORAL',
    tileX: 14, tileY: 5,
    battleIntro: 'The samurai draws his blade. "Every order is an object. I can queue them, log them... undo them!"',
  },
  'Iterator': {
    patternName: 'Iterator',
    sprite: 'Skeleton',
    zone: 'BEHAVIORAL',
    tileX: 9,  tileY: 13,
    battleIntro: 'The skeleton marches in sequence. "I traverse the collection without revealing its structure!"',
  },
  'Mediator': {
    patternName: 'Mediator',
    sprite: 'Shaman',
    zone: 'BEHAVIORAL',
    tileX: 17, tileY: 9,
    battleIntro: 'The shaman raises his staff. "All communication flows through me. None speak directly to each other!"',
  },
  'Memento': {
    patternName: 'Memento',
    sprite: 'Tengu',
    zone: 'BEHAVIORAL',
    tileX: 5,  tileY: 15,
    battleIntro: 'The tengu unfurls a scroll. "I hold the snapshot of your state. Undo is my power!"',
  },
  'Observer': {
    patternName: 'Observer',
    sprite: 'NinjaMageBlack',
    zone: 'BEHAVIORAL',
    tileX: 12, tileY: 7,
    battleIntro: 'The black mage watches silently. "I see all state changes. My subjects notify me automatically!"',
  },
  'State': {
    patternName: 'State',
    sprite: 'DemonGreen',
    zone: 'BEHAVIORAL',
    tileX: 8,  tileY: 11,
    battleIntro: 'The demon shifts form. "My behaviour changes with my internal state. I am never the same twice!"',
  },
  'Strategy': {
    patternName: 'Strategy',
    sprite: 'NinjaDark',
    zone: 'BEHAVIORAL',
    tileX: 15, tileY: 14,
    battleIntro: 'The dark ninja vanishes and reappears. "I swap my algorithm at runtime. Predict me if you can!"',
  },
  'Template Method': {
    patternName: 'Template Method',
    sprite: 'Master',
    zone: 'BEHAVIORAL',
    tileX: 4,  tileY: 8,
    battleIntro: 'The master stands unmoved. "The skeleton of the algorithm is mine. Only the steps are yours to fill."',
  },
  'Visitor': {
    patternName: 'Visitor',
    sprite: 'SorcererBlack',
    zone: 'BEHAVIORAL',
    tileX: 19, tileY: 12,
    battleIntro: 'The sorcerer gestures. "I separate the algorithm from the structure it operates on. Nothing is safe from my visit!"',
  },
}

// Helper — get enemies by zone
export function getEnemiesByZone(zone: PatternCategory): EnemyDef[] {
  return Object.values(ENEMY_DEFINITIONS).filter(e => e.zone === zone)
}

// Helper — get enemy by pattern name
export function getEnemyByPattern(patternName: string): EnemyDef | undefined {
  return ENEMY_DEFINITIONS[patternName]
}
