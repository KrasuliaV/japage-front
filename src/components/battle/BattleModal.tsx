import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { battleApi, patternApi } from '@/api/game'
import type {
  BattleResponse, NextQuestionResponse,
  SubmitAnswerResponse, AnswerResponse,
} from '@/types'

export function BattleModal() {
  const showBattleModal = useGameStore(s => s.showBattleModal)
  const character = useGameStore(s => s.character)
  const currentDungeonPatternId = useGameStore(s => s.currentDungeonPatternId)
  const activeBattle = useGameStore(s => s.activeBattle)
  const currentQuestion = useGameStore(s => s.currentQuestion)
  const lastAnswerResult = useGameStore(s => s.lastAnswerResult)
  const setBattle = useGameStore(s => s.setBattle)
  const setCurrentQuestion = useGameStore(s => s.setCurrentQuestion)
  const setLastAnswerResult = useGameStore(s => s.setLastAnswerResult)
  const setBattleSummary = useGameStore(s => s.setBattleSummary)
  const endBattle = useGameStore(s => s.endBattle)
  const correctAnswersRequired = useGameStore(s => s.correctAnswersRequired)
  const correctAnswersCount = useGameStore(s => s.correctAnswersCount)
  const incrementCorrectAnswers = useGameStore(s => s.incrementCorrectAnswers)
  const resetCorrectAnswers = useGameStore(s => s.resetCorrectAnswers)
  const onBattleWon = useGameStore(s => s.onBattleWon)

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'starting' | 'question' | 'result' | 'ended'>('starting')
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
    mutationFn: ({ patternId, questionsToWin }: { patternId: string, questionsToWin: number | null }) =>
      battleApi.start(character!.id, { patternId, questionsToWin: questionsToWin ?? 1 }),
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

  const submitAnswerMutation = useMutation({
    mutationFn: (data: { answerId: string }) =>
      battleApi.submitAnswer(character!.id, activeBattle!.id, {
        questionId: currentQuestion!.question.id,
        answerId: data.answerId,
      }),
    onSuccess: (result: SubmitAnswerResponse) => {
      setLastAnswerResult(result)

      if (activeBattle) {
        setBattle({
          ...activeBattle,
          characterHpCurrent: result.characterHpCurrent
        })
      }

      // Track correct answers
      let newCorrectCount = correctAnswersCount
      if (result.correct) {
        newCorrectCount = correctAnswersCount + 1
        incrementCorrectAnswers()
      }

      // Check if battle should end
      const reachedCorrectLimit = correctAnswersRequired !== null
        && newCorrectCount >= correctAnswersRequired
      const isBattleOver = result.battleEnded || reachedCorrectLimit

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
          onBattleWon?.()
          resetCorrectAnswers()

          console.log("result.battleResult: " + result.battleResult);
          if (result.battleResult) {
            try {
              const summary = await battleApi.getSummary(character!.id, activeBattle!.id)
              console.log("Summary fetched successfully:", summary);
              setBattleSummary(summary)
            } catch (err) {
              console.error("Failed to fetch summary", err);
              // Fallback to exit if API fails
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
    if (showBattleModal && pattern && phase === 'starting' && !startBattleMutation.isPending) {
      startBattleMutation.mutate({
        patternId: pattern.id,
        questionsToWin: correctAnswersRequired ?? 1
      })
    }
  }, [showBattleModal, pattern, phase])

  if (!showBattleModal || !character) return null

  function fetchNextQuestion(battleId: string) {
    nextQuestionMutation.mutate(battleId)
  }

  function handleSelectAnswer(answer: AnswerResponse) {
    if (phase !== 'question' || submitAnswerMutation.isPending) return
    setSelectedAnswerId(answer.id)
    submitAnswerMutation.mutate({ answerId: answer.id })
  }

  function handleNextQuestion() {
    if (!activeBattle) return
    fetchNextQuestion(activeBattle.id)
  }

  function handleExit() {
    endBattle()
    setPhase('starting')
    setSelectedAnswerId(null)
    setLastAnswerResult(null)

    const canvas = document.querySelector('canvas')
    canvas?.focus()
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
  const qTotal = currentQuestion?.totalQuestions ?? 2

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
                  fontSize: 14,
                  color: 'var(--color-accent)',
                  textShadow: '0 0 8px var(--color-accent-glow)',
                  letterSpacing: 2,
                  fontWeight: 'bold',
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
                  {correctAnswersRequired !== null
                    ? `✓ ${correctAnswersCount} / ${correctAnswersRequired}`
                    : qNum > 0 && `${qNum} / ${qTotal}`
                  }
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
                  question={currentQuestion}
                  selectedAnswerId={selectedAnswerId}
                  lastResult={null}
                  onSelect={handleSelectAnswer}
                  isPending={submitAnswerMutation.isPending}
                />
              )}

              {phase === 'result' && currentQuestion && lastAnswerResult && (
                <>
                  <QuestionBlock
                    question={currentQuestion}
                    selectedAnswerId={selectedAnswerId}
                    lastResult={lastAnswerResult}
                    onSelect={() => { }}
                    isPending={false}
                  />
                  <div style={{ marginTop: 16 }}>
                    {lastAnswerResult.correct ? (
                      <div style={{ fontSize: 11, color: 'var(--color-accent)', textShadow: '0 0 8px var(--color-accent-glow)', marginBottom: 8 }}>✓ Correct! ({correctAnswersCount}/{correctAnswersRequired ?? '?'} needed)</div>
                    ) : (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-danger)', textShadow: '0 0 8px var(--color-danger-glow)', marginBottom: 4 }}>✗ Wrong! -{lastAnswerResult.damageTaken} HP</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}>Correct answer: {lastAnswerResult.correctAnswerDescription}</div>
                      </div>
                    )}
                    {!lastAnswerResult.battleEnded && !(correctAnswersRequired !== null && correctAnswersCount >= correctAnswersRequired) && (
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

// ── QuestionBlock Component ───────────────────────────────

interface QuestionBlockProps {
  question: NextQuestionResponse
  selectedAnswerId: string | null
  lastResult: SubmitAnswerResponse | null
  onSelect: (answer: AnswerResponse) => void
  isPending: boolean
}

function QuestionBlock({ question, selectedAnswerId, lastResult, onSelect, isPending }: QuestionBlockProps) {
  const q = question.question

  function getAnswerClass(answer: AnswerResponse): string {
    if (!lastResult) return selectedAnswerId === answer.id ? 'answer-btn selected' : 'answer-btn'
    if (answer.id === lastResult.correctAnswerId) return 'answer-btn correct'
    if (answer.id === selectedAnswerId && !lastResult.correct) return 'answer-btn wrong'
    return 'answer-btn'
  }

  return (
    <div>
      <div style={{ fontSize: 8, color: 'var(--color-text-muted)', marginBottom: 8 }}>
        {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)} · {q.type.replace('_', ' ')}
      </div>
      <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: 16, padding: '12px 16px', background: 'var(--color-bg-deep)', border: '2px solid var(--color-border)', borderRadius: 2 }}>
        {q.description}
      </div>
      <div style={{ fontFamily: '"Courier New"', fontSize: 24, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.answers.map((answer, i) => (
          <button
            key={answer.id}
            className={getAnswerClass(answer)}
            onClick={() => onSelect(answer)}
            disabled={isPending || lastResult !== null}
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '12px',      // Larger, readable size
              fontWeight: 'bold',    // Ensures thickness
              textAlign: 'left',     // Keeps text aligned correctly
              padding: '12px 16px',  // More "hit area" for the button
              width: '100%',         // Fill container width
            }}
          >
            <span style={{
              color: 'var(--color-text-muted)',
              marginRight: 12,
              fontSize: '14px',      // Larger letter label (A, B, C)
              fontWeight: 'normal'
            }}>
              {String.fromCharCode(65 + i)}.
            </span>
            {answer.description}
          </button>
        ))}
      </div>
    </div>
  )
}