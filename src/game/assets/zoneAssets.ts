// /**
//  * Maps each game zone to the enemy sprite names it requires.
//  *
//  * IMPORTANT: Boss sprites use BOSS_ASSET_BANK with a hash function,
//  * meaning any zone can technically display any sprite. We map sprites
//  * to the zone where they appear as MINIONS (deterministic), and treat
//  * all boss sprites as "zone-shared" loaded at dungeon entry (not overworld).
//  *
//  * Pattern: Strategy — each zone has its own loading strategy.
//  */

// export type ZoneName = 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL'

// export const ZONE_ENEMY_SPRITES: Record<ZoneName, string[]> = {
//   CREATIONAL: [
//     'GoldStatue',
//     'Monk',
//     'Sultan',
//     'Caveman',
//     'Spirit',
//   ],
//   STRUCTURAL: [
//     'RobotGrey',
//     'Knight',
//     'GreenPig',
//     'Vampire',
//     'Noble',
//     'NinjaGray',
//     'NinjaMasked',
//   ],
//   BEHAVIORAL: [
//     'SkeletonDemon',
//     'SamuraiRed',
//     'Skeleton',
//     'Shaman',
//     'Tengu',
//     'NinjaMageBlack',
//     'DemonGreen',
//     'NinjaDark',
//     'Master',
//     'SorcererBlack',
//   ],
// }

// /**
//  * Boss sprites come from BOSS_ASSET_BANK and are assigned via hash —
//  * they are NOT zone-deterministic. All boss sprites must be loaded
//  * when entering ANY dungeon. This is the full pool.
//  */
// export const ALL_BOSS_SPRITES: string[] = [
//   'GoldStatue', 'Monk', 'Sultan', 'Caveman', 'Spirit',
//   'RobotGrey', 'Knight', 'GreenPig', 'Vampire', 'Noble',
//   'NinjaGray', 'NinjaMasked', 'SamuraiRed', 'Shaman',
//   'Tengu', 'NinjaMageBlack', 'DemonGreen', 'NinjaDark',
//   'Master', 'SorcererBlack',
// ]

// /**
//  * Returns the deduplicated set of sprites needed for a given zone.
//  * Includes zone-specific minion sprites + all boss pool sprites.
//  */
// export function getSpritesForZone(zone: ZoneName): string[] {
//   const minionSprites = ZONE_ENEMY_SPRITES[zone] ?? []
//   const combined = new Set([...minionSprites, ...ALL_BOSS_SPRITES])
//   return Array.from(combined)
// }

export type ZoneName = string

export {
  getSpritesForZone,
  getZoneEnemySprites,
  ALL_BOSS_SPRITES,
} from '@/game/config/zoneConfig'