import { useEffect, useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { battleApi, patternApi, characterApi } from '@/api/game'
import { QuestionBlock } from '@/components/shared/QuestionBlock'
import type {
  BattleResponse, NextQuestionResponse,
  SubmitAnswerResponse
} from '@/types'

export function BattleModal() {
  const showBattleModal = useGameStore(s => s.showBattleModal)
  const character = useGameStore(s => s.character)
  const currentDungeonPatternId = useGameStore(s => s.currentDungeonPatternId)
  const activeBattle = useGameStore(s => s.activeBattle)
  const currentQuestion = useGameStore(s => s.currentQuestion)
  const lastAnswerResult = useGameStore(s => s.lastAnswerResult)
  const battle = useGameStore(s => s.activeBattle)
  const setBattle = useGameStore(s => s.setBattle)
  const setCurrentQuestion = useGameStore(s => s.setCurrentQuestion)
  const setLastAnswerResult = useGameStore(s => s.setLastAnswerResult)
  const setBattleSummary = useGameStore(s => s.setBattleSummary)
  const endBattle = useGameStore(s => s.endBattle)
  const enemyType = useGameStore(s => s.enemyType)
  const coordinateX = useGameStore(s => s.coordinateX)
  const coordinateY = useGameStore(s => s.coordinateY)
  const setCharacter = useGameStore(s => s.setCharacter)
  // const isRestoredBattle = useGameStore(s => s.isRestoredBattle)

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null)
  // const [phase, setPhase] = useState<'starting' | 'question' | 'result' | 'ended'>('starting')
  const isRestoredBattle = useGameStore(s => s.isRestoredBattle)
  const [phase, setPhase] = useState<'starting' | 'question' | 'result' | 'ended'>(
    () => isRestoredBattle ? 'question' : 'starting'
  )
  const [damageFlash, setDamageFlash] = useState(false)
  const [healFlash, setHealFlash] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { data: allPatterns } = useQuery({
    queryKey: ['patterns'],
    queryFn: () => patternApi.getAll(),
    staleTime: Infinity,
  })

  const pattern = allPatterns?.find(p => p.name === currentDungeonPatternId)

  const startBattleMutation = useMutation({
    // mutationFn: ({ patternId, enemyType }: { patternId: string, enemyType: EnemyType | null }) =>
    //   battleApi.start(character!.id, { patternId, enemyType, coordinateX, coordinateY }),
    mutationFn: () => {
      if (!character?.id || !pattern?.id) {
        throw new Error("Missing required battle data");
      }
      return battleApi.start(character.id, {
        patternId: pattern.id,
        enemyType,
        coordinateX,
        coordinateY
      });
    },

    onSuccess: (battle: BattleResponse) => {
      setBattle(battle)
      setPhase('question')
      fetchNextQuestion(battle.id)
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number; data?: { message?: string } } })
        ?.response?.status
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message

      if (status === 422) {
        setApiError(message ?? 'Battle cannot be started. Please try again.')
      }
    },
  })

  const nextQuestionMutation = useMutation({
    mutationFn: (battleId: string) =>
      battleApi.getNextQuestion(character!.id, battleId),
    onSuccess: (q: NextQuestionResponse) => {
      setCurrentQuestion(q)
      setSelectedAnswerId(null)
      setPhase('question')
    },
  })

  async function handleExit() {
    endBattle()

    setPhase('starting')
    setSelectedAnswerId(null)
    setLastAnswerResult(null)

    if (character?.id) {
      try {
        const updatedCharacter = await characterApi.getById(character.id);
        setCharacter(updatedCharacter);
      } catch (error) {
        console.error("Failed to sync character info:", error);
      }
    }

    const canvas = document.querySelector('canvas')
    canvas?.focus()
  }

  const submitAnswerMutation = useMutation({
    mutationFn: (answerId: string) =>
      battleApi.submitAnswer(character!.id, activeBattle!.id, {
        questionId: currentQuestion!.question.id,
        answerId: answerId,
      }),
    onSuccess: (result: SubmitAnswerResponse) => {
      setLastAnswerResult(result)

      if (activeBattle) {
        setBattle({
          ...activeBattle,
          characterHpCurrent: result.characterHpCurrent
        })
      }

      const isBattleOver = result.battleEnded

      setPhase('result')

      if (result.correct) {
        setHealFlash(true)
        setTimeout(() => setHealFlash(false), 400)
      } else {
        setDamageFlash(true)
        setTimeout(() => setDamageFlash(false), 400)
      }

      if (isBattleOver) {
        setTimeout(async () => {
          setPhase('ended')
          const currentState = useGameStore.getState()
          currentState.onBattleWon?.()

          if (character?.id && activeBattle?.id) {
            // if (result.battleResult && character?.id && activeBattle?.id) {
            try {
              try {
                const updatedCharacter = await characterApi.getById(character.id);
                setCharacter(updatedCharacter);
              } catch (error) {
                console.error("Failed to sync character info:", error);
              }

              const summary = await battleApi.getSummary(character!.id, activeBattle!.id)
              setBattleSummary(summary)
            } catch (err) {
              console.error("Failed to fetch summary", err);
              handleExit();
            }
          } else {
            handleExit();
          }
        }, 1800)
      }
    },
  })

  useEffect(() => {
    if (!showBattleModal || !character) return

    // Normal flow — start a fresh battle
    if (pattern && phase === 'starting' && !startBattleMutation.isPending) {
      startBattleMutation.mutate()
    }
  }, [showBattleModal, pattern, phase])

  const prevShowBattleModal = useRef(false)

  useEffect(() => {
    if (prevShowBattleModal.current && !showBattleModal) {
      setTimeout(() => {
        setPhase('starting');
        setSelectedAnswerId(null)
      }, 0)
    }
    prevShowBattleModal.current = showBattleModal
  }, [showBattleModal])

  if (!showBattleModal || !character) return null

  function fetchNextQuestion(battleId: string) {
    nextQuestionMutation.mutate(battleId)
  }

  function handleSelectAnswer(answerId: string) {
    if (phase !== 'question' || submitAnswerMutation.isPending) return
    setSelectedAnswerId(answerId)
    submitAnswerMutation.mutate(answerId)
  }

  function handleNextQuestion() {
    if (!activeBattle) return
    fetchNextQuestion(activeBattle.id)
  }

  function handleAbandon() {
    if (!activeBattle) {
      handleExit()
      return
    }
    battleApi.abandon(character!.id, activeBattle.id).finally(() => {
      handleExit()
    })
  }

  function handleCloseApiError() {
    setApiError(null)
    setPhase('starting')
    endBattle()

    const canvas = document.querySelector('canvas')
    canvas?.focus()
  }

  const hpCurrent = lastAnswerResult?.characterHpCurrent
    ?? activeBattle?.characterHpCurrent
    ?? character.currentHp
  const hpMax = currentQuestion?.characterHpMax ?? character.maxHp
  const hpPercent = Math.max(0, (hpCurrent / hpMax) * 100)
  const hpColor =
    hpPercent > 60 ? 'var(--color-hp-high)' :
      hpPercent > 30 ? 'var(--color-hp-mid)' :
        'var(--color-hp-low)'

  const qNum = currentQuestion?.questionNumber ?? 0
  // const qTotal = currentQuestion?.totalQuestions ?? 2

  // const enemyMaxHp = lastAnswerResult?.battleResult?.enemyHpStart ?? battle?.enemyHpStart ?? 0
  const enemyMaxHp = battle?.enemyHpStart ?? 0
  const enemyCurrentHp = lastAnswerResult?.enemyHpCurrent ?? battle?.enemyHpCurrent ?? 0

  return (
    <>
      {apiError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={() => handleCloseApiError()}
        >
          <div
            className="game-panel-elevated"
            style={{
              padding: '24px 28px',
              maxWidth: 380,
              width: '90%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => handleCloseApiError()}
              style={{
                position: 'absolute',
                top: 10,
                right: 12,
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              ✕
            </button>

            {/* Icon + title */}
            <div style={{
              fontSize: 13,
              color: 'var(--color-danger)',
              textShadow: '0 0 8px var(--color-danger-glow)',
              letterSpacing: 2,
              marginBottom: 12,
            }}>
              ⚠ BATTLE ERROR
            </div>

            {/* Message */}
            <div style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              marginBottom: 20,
              fontFamily: '"Courier New", Courier, monospace',
            }}>
              {apiError}
            </div>

            {/* OK button */}
            <button
              className="game-btn"
              onClick={() => handleCloseApiError()}
              style={{ width: '100%' }}
            >
              OK, Continue
            </button>
          </div>
        </div>
      )}
      {
        showBattleModal && character && (
          <div className="modal-backdrop" style={{ zIndex: 50 }}>
            {damageFlash && <div className="damage-flash" style={{ position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none' }} />}
            {healFlash && <div className="heal-flash" style={{ position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none' }} />}

            <div className="game-panel-elevated" style={{ width: '100%', maxWidth: 640, margin: '0 16px', padding: 24, position: 'relative' }}>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 16,
                  color: 'var(--color-accent)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  letterSpacing: '1px',
                  fontWeight: 600,
                }}>
                  ⚔ BATTLE
                </div>

                <button
                  onClick={handleAbandon}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: '4px',
                    lineHeight: 1,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                  ✕
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {pattern?.name ?? '...'} · {pattern?.category ?? ''}
                </div>

                <div style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  fontFamily: '"Courier New", Courier, monospace',
                }}>
                  {qNum > 0 && `${enemyCurrentHp} / ${enemyMaxHp}`}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  <span>{character.name}</span>
                  <span style={{ color: hpColor }}>{hpCurrent} / {hpMax} HP</span>
                </div>
                <div className="hp-bar" style={{ height: 10 }}>
                  <div className="hp-bar-fill" style={{ width: `${hpPercent}%`, background: hpColor, transition: 'width 0.3s ease' }} />
                </div>
              </div>

              <div className="pixel-divider" style={{ marginBottom: 16 }} />

              {(startBattleMutation.isPending || nextQuestionMutation.isPending) && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-secondary)', fontSize: 10 }}>Loading...</div>
              )}

              {phase === 'question' && currentQuestion && (
                <QuestionBlock
                  question={currentQuestion.question}
                  selectedAnswerId={selectedAnswerId}
                  lastResult={null}
                  onSelect={handleSelectAnswer}
                  isPending={submitAnswerMutation.isPending}
                />
              )}

              {phase === 'result' && currentQuestion && lastAnswerResult && (
                <>
                  <QuestionBlock
                    question={currentQuestion.question}
                    selectedAnswerId={selectedAnswerId}
                    lastResult={lastAnswerResult}
                    onSelect={() => { }}
                    isPending={false}
                  />
                  <div style={{ marginTop: 16 }}>
                    {lastAnswerResult.correct ? (
                      <div style={{ fontSize: 11, color: 'var(--color-accent)', textShadow: '0 0 8px var(--color-accent-glow)', marginBottom: 8 }}>✓ Correct!</div>
                    ) : (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-danger)', textShadow: '0 0 8px var(--color-danger-glow)', marginBottom: 4 }}>✗ Wrong! -{lastAnswerResult.damageTaken} HP</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}>Correct answer: {lastAnswerResult.correctAnswerDescription}</div>
                      </div>
                    )}
                    {!lastAnswerResult.battleEnded && (
                      <button className="game-btn" onClick={handleNextQuestion} style={{ width: '100%', marginTop: 8 }}>Next Question →</button>
                    )}
                  </div>
                </>
              )}

              {phase === 'ended' && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-secondary)', fontSize: 10 }}>Battle complete! Loading results...</div>
              )}

              {(startBattleMutation.isError || submitAnswerMutation.isError) && (
                <div style={{ fontSize: 9, color: 'var(--color-danger)', marginTop: 8 }}>An error occurred. Please try again.</div>
              )}

              {phase !== 'ended' && (
                <button className="game-btn game-btn-danger" onClick={handleAbandon} style={{ marginTop: 16, fontSize: 9, opacity: 0.7 }}>
                  Flee Battle (lose gold)
                </button>
              )}
            </div>
          </div>
        )
      }
    </>
  )
}



