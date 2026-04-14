import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { QuestionBlock } from '../shared/QuestionBlock'
import { patternApi, questionApi, itemApi } from '@/api/game'
import type { SubmitQuestionResponse, QuestionResponse } from '@/types'

export function ChestModal() {
    const showChestModal = useGameStore(s => s.showChestModal)

    const currentDungeonPatternId = useGameStore(s => s.currentDungeonPatternId)

    const currentZone = useGameStore(s => s.currentZone)
    const chestQuestion = useGameStore(s => s.chestQuestion)
    const setChestQuestion = useGameStore(s => s.setChestQuestion)
    const setChestReward = useGameStore(s => s.setChestReward)
    const closeChestModal = useGameStore(s => s.closeChestModal)
    const [lastResult, setLastResult] = useState<SubmitQuestionResponse | null>(null)
    const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null)
    const [phase, setPhase] = useState<'starting' | 'question' | 'result' | 'ended'>('starting')
    const [apiError, setApiError] = useState<string | null>(null)

    const { data: allPatterns } = useQuery({
        queryKey: ['patterns'],
        queryFn: () => patternApi.getAll(),
        staleTime: Infinity,
    })

    const pattern = allPatterns?.find(p => p.name === currentDungeonPatternId)

    const startChestBattleMutation = useMutation({
        mutationFn: () => {
            if (!currentZone || !pattern?.name) {
                throw new Error("Cannot fetch question: Zone or Pattern is missing.");
            }
            return questionApi.getQuestion(currentZone, pattern?.name);
        },
        onSuccess: (questionResponse: QuestionResponse) => {
            setChestQuestion(questionResponse)
            setSelectedAnswerId(null)
            setLastResult(null)
            setPhase('question')
        },
        onError: (error: unknown) => {
            const status = (error as { response?: { status?: number; data?: { message?: string } } })
                ?.response?.status
            const message = (error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message

            if (status === 422) {
                setApiError(message ?? 'Invalid challenge parameters.');
            } else if (status === 500) {
                setApiError('The Ancient Archives are unstable (Server Error). Please try again later.');
            } else if (status === 404) {
                setApiError('This pattern’s knowledge has been lost to time (Not Found).');
            } else {
                setApiError('A mysterious force blocked your path. Check your connection.');
            }
        },
    })

    function handleSelectAnswer(answerId: string) {
        if (phase !== 'question' || submitAnswerMutation.isPending) return
        setSelectedAnswerId(answerId)
        submitAnswerMutation.mutate(answerId)
    }


    const submitAnswerMutation = useMutation({
        mutationFn: (answerId: string) =>
            questionApi.submitAnswer(chestQuestion!.id, answerId),
        onSuccess: (result: SubmitQuestionResponse) => {
            setLastResult(result)
            setPhase('result')

            if (result.correct) {
                setTimeout(async () => {
                    setPhase('ended')
                    const currentState = useGameStore.getState()
                    currentState.onChestAnswered?.()
                    try {
                        const reward = await itemApi.getRandom()
                        setChestReward(reward);
                    } catch (error) {
                        console.error("Failed to get reward info:", error);
                        handleExit();
                    }
                }, 1500)

            } else {
                setTimeout(() => {
                    const currentState = useGameStore.getState()
                    currentState.onChestAnswered?.()
                    handleExit()
                }, 1800)

            }
        },
        onError: () => {
            setApiError('Failed to submit answer. Please try again.')
        },

    })

    async function handleExit() {
        setPhase('starting')
        setSelectedAnswerId(null)
        setLastResult(null)
        setApiError(null)
        closeChestModal()

        const canvas = document.querySelector('canvas')
        canvas?.focus()
    }

    function handleRetry() {
        setApiError(null)
        setPhase('starting')
    }

    useEffect(() => {
        if (showChestModal && pattern && phase === 'starting' && !startChestBattleMutation.isPending) {
            startChestBattleMutation.mutate()
        }
    }, [showChestModal, pattern, phase])

    useEffect(() => {
        if (showChestModal) {
            setTimeout(() => {
                setPhase('starting');
                setApiError(null);
                setSelectedAnswerId(null);
                setLastResult(null);
            })
        }
    }, [showChestModal]);

    if (!showChestModal) return null


    //     return (
    //         <div className="modal-backdrop" style={{ zIndex: 60 }}>
    //             <div className="game-panel-elevated">
    //                 {apiError ? (
    //                     <div style={{ textAlign: 'center', padding: '20px' }}>
    //                         <div style={{
    //                             color: 'var(--color-danger)',
    //                             fontSize: 12,
    //                             marginBottom: 20,
    //                             textTransform: 'uppercase',
    //                             letterSpacing: '1px'
    //                         }}>
    //                             ⚠️ Transmission Error
    //                         </div>
    //                         <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
    //                             {apiError}
    //                         </p>

    //                         <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
    //                             <button
    //                                 className="game-btn"
    //                                 onClick={() => {
    //                                     setApiError(null);
    //                                     startChestBattleMutation.mutate();
    //                                 }}
    //                             >
    //                                 Try to Re-Open
    //                             </button>

    //                             <button
    //                                 className="game-btn game-btn-danger"
    //                                 onClick={() => handleExit()}
    //                                 style={{ opacity: 0.8, fontSize: 9 }}
    //                             >
    //                                 Leave Chest
    //                             </button>
    //                         </div>
    //                     </div>
    //                 ) : step === 'QUESTION' && chestQuestion ? (
    //                     <>
    //                         <h2 style={{ color: 'var(--color-gold)' }}>CHEST CHALLENGE</h2>
    //                         {startChestBattleMutation.isPending && (
    //                             <div style={{ textAlign: 'center', padding: '20px', fontSize: 10 }}>
    //                                 Unlocking challenge...
    //                             </div>
    //                         )}
    //                         {chestQuestion && !apiError && (
    //                             <QuestionBlock
    //                                 question={chestQuestion}
    //                                 selectedAnswerId={selectedAnswerId}
    //                                 lastResult={null}
    //                                 onSelect={handleSelectAnswer}
    //                                 isPending={submitAnswerMutation.isPending}
    //                             />
    //                         )}
    //                     </>
    //                 ) : (
    //                     <ChestRewardModal />
    //                 )}
    //             </div>
    //         </div>
    //     )
    // }


    return (
        <div className="modal-backdrop" style={{ zIndex: 60 }}>
            <div
                className="game-panel-elevated"
                style={{
                    width: '100%',
                    maxWidth: 600,
                    margin: '0 16px',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* ── Header ──────────────────────────────── */}
                <div style={{
                    padding: '16px 20px 12px',
                    borderBottom: '2px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{
                        fontSize: 13,
                        color: 'var(--color-gold)',
                        textShadow: '0 0 8px var(--color-gold-glow)',
                        letterSpacing: 2,
                    }}>
                        📦 CHEST CHALLENGE
                    </div>
                    <button
                        onClick={handleExit}
                        style={{
                            background: 'none', border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer', fontSize: 18, lineHeight: 1,
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                        ✕
                    </button>
                </div>

                {/* ── Hint bar ────────────────────────────── */}
                <div style={{
                    padding: '8px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 8,
                    color: 'var(--color-text-muted)',
                    letterSpacing: 1,
                    flexShrink: 0,
                }}>
                    {pattern?.name
                        ? `PATTERN: ${pattern.name} · ${pattern.category}`
                        : 'Loading pattern...'}
                    &nbsp;·&nbsp;
                    Answer correctly to claim the reward
                </div>

                {/* ── Body ────────────────────────────────── */}
                <div style={{ padding: '20px', flex: 1 }}>

                    {/* Error state */}
                    {apiError && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                fontSize: 12,
                                color: 'var(--color-danger)',
                                textShadow: '0 0 8px var(--color-danger-glow)',
                                letterSpacing: 1,
                                marginBottom: 12,
                            }}>
                                ⚠ CHALLENGE ERROR
                            </div>
                            <p style={{
                                fontSize: 10,
                                color: 'var(--color-text-secondary)',
                                marginBottom: 20,
                                lineHeight: 1.6,
                            }}>
                                {apiError}
                            </p>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                <button className="game-btn" onClick={handleRetry}>
                                    Try Again
                                </button>
                                <button
                                    className="game-btn game-btn-danger"
                                    onClick={handleExit}
                                    style={{ opacity: 0.8 }}
                                >
                                    Leave
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loading state */}
                    {!apiError && (phase === 'starting' || startChestBattleMutation.isPending) && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 0',
                            color: 'var(--color-text-muted)',
                            fontSize: 9,
                            letterSpacing: 1,
                        }}>
                            Unlocking challenge...
                        </div>
                    )}

                    {/* Question state */}
                    {!apiError && phase === 'question' && chestQuestion && (
                        <QuestionBlock
                            question={chestQuestion}
                            selectedAnswerId={selectedAnswerId}
                            lastResult={null}
                            onSelect={handleSelectAnswer}
                            isPending={submitAnswerMutation.isPending}
                        />
                    )}

                    {/* Result state — show highlighted answers */}
                    {!apiError && phase === 'result' && chestQuestion && lastResult && (
                        <>
                            <QuestionBlock
                                question={chestQuestion}
                                selectedAnswerId={selectedAnswerId}
                                lastResult={null}
                                onSelect={() => { }}
                                isPending={false}
                            />
                            <div style={{ marginTop: 16, textAlign: 'center' }}>
                                {lastResult.correct ? (
                                    <div style={{
                                        fontSize: 11,
                                        color: 'var(--color-accent)',
                                        textShadow: '0 0 8px var(--color-accent-glow)',
                                        letterSpacing: 1,
                                    }}>
                                        ✓ Correct! Opening chest...
                                    </div>
                                ) : (
                                    <div style={{
                                        fontSize: 11,
                                        color: 'var(--color-danger)',
                                        textShadow: '0 0 8px var(--color-danger-glow)',
                                        letterSpacing: 1,
                                    }}>
                                        ✗ Wrong! The chest disappears...
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
