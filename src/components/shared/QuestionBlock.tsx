import type {
    QuestionResponse, SubmitAnswerResponse, AnswerResponse,
} from '@/types'

export function QuestionBlock({ question, selectedAnswerId, lastResult, onSelect, isPending }: QuestionBlockProps) {
    const q = question

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
            <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                lineHeight: 1.5,
                marginBottom: 16,
                padding: '16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
            }}>
                {q.description}
            </div>
            <div style={{ fontFamily: '"Courier New"', fontSize: 24, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.answers.map((answer, i) => (
                    <button
                        key={answer.id}
                        className={getAnswerClass(answer)}
                        onClick={() => onSelect(answer.id)}
                        disabled={isPending || lastResult !== null}
                        style={{
                            fontFamily: '"Courier New", Courier, monospace',
                            fontSize: '12px',      
                            fontWeight: 'bold',  
                            textAlign: 'left', 
                            padding: '12px 16px',
                            width: '100%',
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

// ── QuestionBlock Component ───────────────────────────────

interface QuestionBlockProps {
    question: QuestionResponse
    selectedAnswerId: string | null
    lastResult: SubmitAnswerResponse | null
    onSelect: (answerId: string) => void
    isPending: boolean
}