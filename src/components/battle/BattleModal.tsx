import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { battleApi, patternApi } from '@/api/game'
import type {
  BattleResponse, NextQuestionResponse,
  SubmitAnswerResponse, AnswerResponse,
} from '@/types'

// ============================================================
// BattleModal
// Opens when player touches an enemy in Kaplay.
// Manages the full battle flow:
//   1. Start battle (POST)
//   2. Get next question (GET) — loops
//   3. Submit answer (POST) — updates HP, checks win/loss
//   4. Battle ends → open BattleSummary
// ============================================================

export function BattleModal() {
  const showBattleModal      = useGameStore(s => s.showBattleModal)
  const character            = useGameStore(s => s.character)
  const currentDungeonPatternId = useGameStore(s => s.currentDungeonPatternId)
  const activeBattle         = useGameStore(s => s.activeBattle)
  const currentQuestion      = useGameStore(s => s.currentQuestion)
  const lastAnswerResult     = useGameStore(s => s.lastAnswerResult)
  const setBattle            = useGameStore(s => s.setBattle)
  const setCurrentQuestion   = useGameStore(s => s.setCurrentQuestion)
  const setLastAnswerResult  = useGameStore(s => s.setLastAnswerResult)
  const setBattleSummary     = useGameStore(s => s.setBattleSummary)
  const endBattle            = useGameStore(s => s.endBattle)

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null)
  const [phase, setPhase] = useState<
    'starting' | 'question' | 'result' | 'ended'
  >('starting')
  const [damageFlash, setDamageFlash] = useState(false)
  const [healFlash, setHealFlash] = useState(false)

  if (!showBattleModal || !character) return null

  // ── Step 1: Find pattern by name then start battle ─────────

  const { data: allPatterns } = useQuery({
    queryKey: ['patterns'],
    queryFn: () => patternApi.getAll(),
    staleTime: Infinity,
  })

  const pattern = allPatterns?.find(p => p.name === currentDungeonPatternId)

  // Start battle mutation
  const startBattleMutation = useMutation({
    mutationFn: () => battleApi.start(character.id, { patternId: pattern!.id }),
    onSuccess: (battle: BattleResponse) => {
      setBattle(battle)
      setPhase('question')
      fetchNextQuestion(battle.id)
    },
  })

  // Get next question mutation
  const nextQuestionMutation = useMutation({
    mutationFn: (battleId: string) =>
      battleApi.getNextQuestion(character.id, battleId),
    onSuccess: (q: NextQuestionResponse) => {
      setCurrentQuestion(q)
      setSelectedAnswerId(null)
      setPhase('question')
    },
  })

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: (data: { answerId: string }) =>
      battleApi.submitAnswer(character.id, activeBattle!.id, {
        questionId: currentQuestion!.question.id,
        answerId: data.answerId,
      }),
    onSuccess: (result: SubmitAnswerResponse) => {
      setLastAnswerResult(result)
      setPhase('result')

      // Flash effect
      if (result.correct) {
        setHealFlash(true)
        setTimeout(() => setHealFlash(false), 400)
      } else {
        setDamageFlash(true)
        setTimeout(() => setDamageFlash(false), 400)
      }

      if (result.battleEnded && result.battleResult) {
        setTimeout(async () => {
          setPhase('ended')
          const summary = await battleApi.getSummary(
            character.id, activeBattle!.id
          )
          setBattleSummary(summary)
        }, 1800)
      }
    },
  })

  // Auto-start battle when modal opens
  useEffect(() => {
    if (showBattleModal && pattern && phase === 'starting') {
      startBattleMutation.mutate()
    }
  }, [showBattleModal, pattern])

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

  function handleAbandon() {
    if (!activeBattle) {
      endBattle()
      return
    }
    battleApi.abandon(character.id, activeBattle.id).then(() => {
      endBattle()
    })
  }

  // ── Derived state ───────────────────────────────────────
  const hpCurrent = lastAnswerResult?.characterHpCurrent
    ?? activeBattle?.characterHpCurrent
    ?? character.currentHp
  const hpMax     = currentQuestion?.characterHpMax ?? character.maxHp
  const hpPercent = Math.max(0, (hpCurrent / hpMax) * 100)
  const hpColor   =
    hpPercent > 60 ? 'var(--color-hp-high)' :
    hpPercent > 30 ? 'var(--color-hp-mid)' :
    'var(--color-hp-low)'

  const qNum   = currentQuestion?.questionNumber ?? 0
  const qTotal = currentQuestion?.totalQuestions ?? 10

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 50 }}
    >
      {/* Flash overlays */}
      {damageFlash && (
        <div className="damage-flash" style={{
          position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none',
        }} />
      )}
      {healFlash && (
        <div className="heal-flash" style={{
          position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none',
        }} />
      )}

      {/* Battle panel */}
      <div
        className="game-panel-elevated"
        style={{
          width: '100%',
          maxWidth: 640,
          margin: '0 16px',
          padding: 24,
          position: 'relative',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}>
          <div>
            <div style={{
              fontSize: 14,
              color: 'var(--color-accent)',
              textShadow: '0 0 8px var(--color-accent-glow)',
              letterSpacing: 2,
              marginBottom: 4,
            }}>
              ⚔ BATTLE
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {pattern?.name ?? '...'} · {pattern?.category ?? ''}
            </div>
          </div>

          {/* Question counter */}
          <div style={{
            fontSize: 10,
            color: 'var(--color-text-muted)',
            textAlign: 'right',
          }}>
            {qNum > 0 && `${qNum} / ${qTotal}`}
          </div>
        </div>

        {/* ── HP Bar ─────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 9,
            color: 'var(--color-text-secondary)',
            marginBottom: 4,
          }}>
            <span>{character.name}</span>
            <span style={{ color: hpColor }}>
              {hpCurrent} / {hpMax} HP
            </span>
          </div>
          <div className="hp-bar" style={{ height: 10 }}>
            <div
              className="hp-bar-fill"
              style={{ width: `${hpPercent}%`, background: hpColor }}
            />
          </div>
        </div>

        <div className="pixel-divider" style={{ marginBottom: 16 }} />

        {/* ── Loading ─────────────────────────────────────── */}
        {(startBattleMutation.isPending || nextQuestionMutation.isPending) && (
          <div style={{
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--color-text-secondary)',
            fontSize: 10,
          }}>
            Loading...
          </div>
        )}

        {/* ── Question ────────────────────────────────────── */}
        {phase === 'question' && currentQuestion && (
          <QuestionBlock
            question={currentQuestion}
            selectedAnswerId={selectedAnswerId}
            lastResult={null}
            onSelect={handleSelectAnswer}
            isPending={submitAnswerMutation.isPending}
          />
        )}

        {/* ── Answer result ────────────────────────────────── */}
        {phase === 'result' && currentQuestion && lastAnswerResult && (
          <>
            <QuestionBlock
              question={currentQuestion}
              selectedAnswerId={selectedAnswerId}
              lastResult={lastAnswerResult}
              onSelect={() => {}}
              isPending={false}
            />

            {/* Result feedback */}
            <div style={{ marginTop: 16 }}>
              {lastAnswerResult.correct ? (
                <div style={{
                  fontSize: 11,
                  color: 'var(--color-accent)',
                  textShadow: '0 0 8px var(--color-accent-glow)',
                  marginBottom: 8,
                }}>
                  ✓ Correct!
                </div>
              ) : (
                <div style={{ marginBottom: 8 }}>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--color-danger)',
                    textShadow: '0 0 8px var(--color-danger-glow)',
                    marginBottom: 4,
                  }}>
                    ✗ Wrong! -{lastAnswerResult.damageTaken} HP
                  </div>
                  <div style={{
                    fontSize: 9,
                    color: 'var(--color-text-secondary)',
                  }}>
                    Correct answer: {lastAnswerResult.correctAnswerDescription}
                  </div>
                </div>
              )}

              {!lastAnswerResult.battleEnded && (
                <button
                  className="game-btn"
                  onClick={handleNextQuestion}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  Next Question →
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Battle ended ─────────────────────────────────── */}
        {phase === 'ended' && (
          <div style={{
            textAlign: 'center',
            padding: '24px 0',
            color: 'var(--color-text-secondary)',
            fontSize: 10,
          }}>
            Battle complete! Loading results...
          </div>
        )}

        {/* ── Error ────────────────────────────────────────── */}
        {(startBattleMutation.isError || submitAnswerMutation.isError) && (
          <div style={{
            fontSize: 9,
            color: 'var(--color-danger)',
            marginTop: 8,
          }}>
            An error occurred. Please try again.
          </div>
        )}

        {/* ── Abandon button ───────────────────────────────── */}
        {phase !== 'ended' && (
          <button
            className="game-btn game-btn-danger"
            onClick={handleAbandon}
            style={{ marginTop: 16, fontSize: 9, opacity: 0.7 }}
          >
            Flee Battle (lose gold)
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// QuestionBlock — renders the question and shuffled answers
// ============================================================

interface QuestionBlockProps {
  question: NextQuestionResponse
  selectedAnswerId: string | null
  lastResult: SubmitAnswerResponse | null
  onSelect: (answer: AnswerResponse) => void
  isPending: boolean
}

function QuestionBlock({
  question,
  selectedAnswerId,
  lastResult,
  onSelect,
  isPending,
}: QuestionBlockProps) {
  const q = question.question

  function getAnswerClass(answer: AnswerResponse): string {
    if (!lastResult) {
      return selectedAnswerId === answer.id ? 'answer-btn selected' : 'answer-btn'
    }
    if (answer.id === lastResult.correctAnswerId) return 'answer-btn correct'
    if (answer.id === selectedAnswerId && !lastResult.correct) return 'answer-btn wrong'
    return 'answer-btn'
  }

  return (
    <div>
      {/* Difficulty */}
      <div style={{
        fontSize: 8,
        color: 'var(--color-text-muted)',
        marginBottom: 8,
      }}>
        {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)}
        {' '}· {q.type.replace('_', ' ')}
      </div>

      {/* Question text */}
      <div style={{
        fontSize: 11,
        color: 'var(--color-text-primary)',
        lineHeight: 1.6,
        marginBottom: 16,
        padding: '12px 16px',
        background: 'var(--color-bg-deep)',
        border: '1px solid var(--color-border)',
        borderRadius: 2,
      }}>
        {q.description}
      </div>

      {/* Answer options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.answers.map((answer, i) => (
          <button
            key={answer.id}
            className={getAnswerClass(answer)}
            onClick={() => onSelect(answer)}
            disabled={isPending || lastResult !== null}
          >
            <span style={{
              color: 'var(--color-text-muted)',
              marginRight: 8,
              fontSize: 9,
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
