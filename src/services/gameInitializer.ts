import { playerApi, characterApi, battleApi } from '@/api/game';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import type { CharacterProgressResponse } from '@/types'

export const GameInitializer = {

    async start() {
        const authState = useAuthStore.getState();
        const { setScreen, setPlayerId, setCharacter } = useGameStore.getState();

        try {
            // const exists = await playerApi.existsByFirebaseUid();
            if (!authState.userInfo?.userId) {
                setScreen('character-create');
                return;
            }
            const player = await playerApi.getByFirebaseUid();
            setPlayerId(player.id);
            const character = await characterApi.getByPlayerId(player.id);
            setCharacter(character);

            await this.restoreProgress(character.id, character.characterProgressResponse);
        } catch (err) {
            console.error('Initialization failed:', err);
            setScreen('character-create');
        }
    },

    async restoreProgress(
        characterId: string,
        progressState: CharacterProgressResponse
    ) {
        const { setScreen, setTargetCave, restoreBattle, setBattleSummary } = useGameStore.getState();
        try {
            const state = progressState.state

            if ('INITIAL' === state) {
                setScreen('overworld')
                return
            }

            else if ('ADVENTURING' === state) {
                console.log('[GameInitializer] Restoring adventuring progress:', progressState)
                const zone = progressState.zone // 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL'
                const caveNumber = progressState.caveNumber
                const defeatedCount = progressState.defeatedEnemiesPerCave
                const bossDef = progressState.caveBossDefeated
                // const spawnX = progressState.coordinateX
                // const spawnY = progressState.coordinateY

                const undefeatedMinions = Math.max(0, 5 - defeatedCount)

                // Tell the dungeon scene what cave to load and with what state
                setTargetCave({
                    zone,
                    caveNumber,
                    spawnX: 0,
                    spawnY: 0,
                    undefeatedMinionCount: undefeatedMinions,
                    bossDefeated: bossDef,
                })

                // Go to the appropriate dungeon scene
                // Your dungeon scene (e.g., 'dungeon-creational') reads setTargetCave from store
                // const sceneMap: Record<string, string> = {
                //   'CREATIONAL': 'dungeon-creational',
                //   'STRUCTURAL': 'dungeon-structural',
                //   'BEHAVIORAL': 'dungeon-behavioral',
                // }
                // setScreen('overworld')
                setScreen('dungeon')  // Canvas must init, then scene transition
                // Scene will be set by your kaplay code: k.go(sceneMap[zone], caveNumber)
                return
            }

            else if ('BATTLE' === state) {
                const battleId = progressState.activeBattleId
                const zone = progressState.zone
                const caveNumber = progressState.caveNumber
                const spawnX = progressState.coordinateX
                const spawnY = progressState.coordinateY
                const defeatedCount = progressState.defeatedEnemiesPerCave
                const bossDef = progressState.caveBossDefeated
                const undefeatedMinions = Math.max(0, 5 - defeatedCount)

                try {
                    const battle = await battleApi.getActiveBattle(characterId)
                    const question = await battleApi.getNextQuestion(characterId, battleId)

                    const patternName = battle.pattern.name

                    // Restore the battle into the store
                    // This will:
                    // - Set activeBattle and currentQuestion
                    // - Set currentDungeonPatternId so BattleModal can find the pattern
                    // - Set isRestoredBattle = true so BattleModal skips creating a new battle
                    // - Show the BattleModal immediately
                    restoreBattle(battle, question, patternName)

                    setTargetCave({
                        zone,
                        caveNumber,
                        spawnX,
                        spawnY,
                        undefeatedMinionCount: undefeatedMinions,
                        bossDefeated: bossDef,
                    })

                     setScreen('dungeon')
                    // setScreen('overworld')

                } catch (err: unknown) {
                    const status = (err as { response?: { status?: number } })?.response?.status
                    if (status === 404) {
                        console.warn('[App] Battle not found, restoring to IN_CAVE state')
                        setTargetCave({
                            zone,
                            caveNumber,
                            spawnX,
                            spawnY,
                            undefeatedMinionCount: undefeatedMinions,
                            bossDefeated: bossDef,
                        })
                        setScreen('overworld')
                    } else {
                        console.error('[App] Failed to restore battle:', err)
                        setScreen('overworld')
                    }
                }
                return
            }

            else if ('BATTLE_COMPLETE' === state) {
                const battleId = progressState.activeBattleId
                const zone = progressState.zone
                const caveNumber = progressState.caveNumber
                const spawnX = progressState.coordinateX
                const spawnY = progressState.coordinateY
                const defeatedCount = progressState.defeatedEnemiesPerCave
                const bossDef = progressState.caveBossDefeated
                const undefeatedMinions = Math.max(0, 5 - defeatedCount)

                try {
                    const summary = await battleApi.getSummary(characterId, battleId)

                    setBattleSummary(summary)

                    setTargetCave({
                        zone,
                        caveNumber,
                        spawnX,
                        spawnY,
                        undefeatedMinionCount: undefeatedMinions,
                        bossDefeated: bossDef,
                    })

                    // Go to overworld, cave scene will load, and BattleSummary modal appears on top
                    setScreen('dungeon')

                } catch (err: unknown) {
                    const status = (err as { response?: { status?: number } })?.response?.status
                    if (status === 404) {
                        console.warn('[App] Battle summary not found, restoring to IN_CAVE')
                        setTargetCave({
                            zone,
                            caveNumber,
                            spawnX,
                            spawnY,
                            undefeatedMinionCount: undefeatedMinions,
                            bossDefeated: bossDef,
                        })
                        setScreen('overworld')
                    } else {
                        console.error('[App] Failed to restore battle summary:', err)
                        setScreen('overworld')
                    }
                }
                return
            }

            console.warn('[App] Unknown character state:', state)
            setScreen('overworld')

        } catch (err) {
            console.error('[App] Error during progress restoration:', err)
            setScreen('overworld')
        }
    }
};