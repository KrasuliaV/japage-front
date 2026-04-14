import type kaplay from 'kaplay'
import type { GameObj } from "kaplay";
import { useGameStore } from '@/stores/gameStore'
import {
  TILE_SIZE, ENEMY_SCALE,
} from '../kaplay'
import { processMinionAI } from '@/game/ai/minionAI'
import { getRandomBossAsset, getBossDefinition } from '@/constants/bossAssets';
import { showBattleIntro } from '@/game/ui/battleVisuals';
import { BOSS_SCALE_MULTIPLIER, MINION_SCALE_MULTIPLIER } from '../constants';
import { MinionObj } from '@/types';

type KCtx = ReturnType<typeof kaplay>

let minionRegistry: MinionObj[] = [];

export function initEnemyManager(k: KCtx) {
  k.onUpdate(() => {
    const isPaused = useGameStore.getState().isGamePaused;
    if (isPaused) return;

    // Cleanup the registry: filter out destroyed minions
    minionRegistry = minionRegistry.filter(m => m.exists() && !m.defeated);

    for (const m of minionRegistry) {
      processMinionAI(k, m);
    }
  });
}

export function clearEnemyRegistry() {
  minionRegistry = [];
}
// ============================================================
// Enemy entity in dungeon
// ============================================================

export function addMinion(k: KCtx, x: number, y: number, spriteName: string | null, patternId: string) {
  if (!spriteName) {
    spriteName = getRandomBossAsset();
  }
  const minion = k.add([
    k.sprite(`${spriteName}-walk`, { anim: 'walk-down' }),
    k.pos(x, y),
    k.scale(ENEMY_SCALE * MINION_SCALE_MULTIPLIER),
    k.area({ shape: new k.Rect(k.vec2(0, 0), TILE_SIZE, TILE_SIZE) }),
    k.body(),
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


  minion.onCollide('wall', () => {
    minion.direction = minion.direction.scale(-1)
    minion.directionTimer = 0
  })

  minion.onCollide('player', () => {
    if (minion.defeated) return
    if (useGameStore.getState().isGamePaused) return

    const gameStore = useGameStore.getState()
    gameStore.pauseGame()
    gameStore.setEnemyType('MINION')
    useGameStore.setState({
      currentDungeonPatternId: patternId,
      coordinateX: x,
      coordinateY: y,
      onBattleWon: () => {
        minion.defeated = true
        k.destroy(minion)
      }
    })
    showBattleIntro(k, 'A wild enemy appears!', () => {
      gameStore.triggerBattle()
    })
  })

  minion.play("walk-down")
  minionRegistry.push(minion)

  return minion
}

// ============================================================
// Boss entity in dungeon
// ============================================================

export function addBoss(k: KCtx, x: number, y: number, patternName: string, patternCategory: string) {
  // const enemies = getEnemiesByZone(patternCategory)
  const enemyDef = getBossDefinition(patternName, patternCategory)
  const sprite = enemyDef?.sprite ?? 'GoldStatue'
  const battleIntro = enemyDef?.battleIntro ?? `${patternName} boss appears!`

  const boss = k.add([
    k.sprite(`${sprite}-idle`, { anim: 'idle' }),
    k.pos(x, y),
    k.scale(ENEMY_SCALE * BOSS_SCALE_MULTIPLIER),
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
  boss.add([
    k.text(patternName, { size: 5, font: 'monospace' }),
    k.pos(x, y - TILE_SIZE * 2),
    k.color(255, 100, 100),
    k.anchor('center'),
    k.z(20),
    { follow: boss },
  ])

  boss.onCollide('player', () => {
    if (boss.defeated) return
    if (useGameStore.getState().isGamePaused) return

    const gameStore = useGameStore.getState()
    gameStore.pauseGame()

    gameStore.setEnemyType('BOSS')
    useGameStore.setState({
      currentDungeonPatternId: patternName,
      coordinateX: x,
      coordinateY: y,
      onBattleWon: () => {
        boss.defeated = true
        k.destroy(boss)
      }
    })

    showBattleIntro(k, battleIntro, () => {
      gameStore.triggerBattle()
    })
  })

  return boss
}

