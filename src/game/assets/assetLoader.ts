import type kaplay from 'kaplay'
import { getSpritesForZone } from './zoneAssets'

type KCtx = ReturnType<typeof kaplay>

/**
 * Tracks which sprite names have already been loaded into Kaplay.
 * Kaplay does NOT guard against double-loading — loading the same
 * sprite key twice causes a console warning and wastes a network request.
 */
const loadedSprites = new Set<string>()

/**
 * Loads the three animation sheets (walk/idle/attack) for a single enemy sprite.
 * Idempotent — safe to call multiple times with the same name.
 * Returns a Promise that resolves when all three sheets are loaded.
 */
export async function loadEnemySprite(k: KCtx, spriteName: string): Promise<void> {
    // Guard: already loaded, resolve immediately
    if (loadedSprites.has(spriteName)) {
        return Promise.resolve()
    }

    const base = `/assets/sprites/enemies/${spriteName}`
    try {
        await Promise.all([
            k.loadSprite(`${spriteName}-walk`, `${base}/Walk.png`, {
                sliceX: 4, sliceY: 4,
                anims: {
                    'walk-down': { from: 0, to: 3, loop: true, speed: 6 },
                    'walk-left': { from: 4, to: 7, loop: true, speed: 6 },
                    'walk-right': { from: 8, to: 11, loop: true, speed: 6 },
                    'walk-up': { from: 12, to: 15, loop: true, speed: 6 },
                },
            }),

            k.loadSprite(`${spriteName}-idle`, `${base}/Idle.png`, {
                sliceX: 4, sliceY: 1,
                anims: {
                    idle: { from: 0, to: 3, loop: true, speed: 4 },
                },
            }),

            k.loadSprite(`${spriteName}-attack`, `${base}/Attack.png`, {
                sliceX: 4, sliceY: 1,
                anims: {
                    attack: { from: 0, to: 3, loop: false, speed: 8 },
                },
            }),

        ])
        loadedSprites.add(spriteName)
    } catch (err) {
        console.error(`[AssetLoader] Failed to load sprite ${spriteName}:`, err)
        throw err
    }
    
}

/**
 * Loads all enemy sprites required for a specific dungeon zone.
 * Includes zone minion sprites + full boss pool.
 * Safe to call multiple times — already-loaded sprites are skipped.
 *
 * @returns Promise that resolves when ALL sprites for the zone are ready.
 */
export async function loadZoneAssets(k: KCtx, zone: string): Promise<void> {
    const sprites = getSpritesForZone(zone)
    const unloaded = sprites.filter(name => !loadedSprites.has(name))

    if (unloaded.length === 0) {
        return
    }
    await Promise.all(unloaded.map(name => loadEnemySprite(k, name)))
}

/**
 * Resets the loaded-sprite tracking set.
 * Should only be called if Kaplay is fully re-initialized (page reload).
 * Not needed between scene transitions.
 */
export function resetLoadedSprites(): void {
    loadedSprites.clear()
}