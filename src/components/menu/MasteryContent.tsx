import { useQuery } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { patternApi } from '@/api/game'
import { TYPE_ICONS } from '@/constants/icons'

export function MasteryContent() {
    const character = useGameStore(s => s.character)

    const { data: patterns, isLoading } = useQuery({
        queryKey: ['patterns-mastery', character?.id],
        queryFn: () => patternApi.getMasteryByCharacter(character!.id),
        enabled: !!character?.id,
        staleTime: 30_000,
    })

    if (isLoading) return <div style={{ fontSize: 10 }}>STUDYING PATTERNS...</div>

    const categories = patterns ? [...new Set(patterns.map(p => p.pattern.category))] : []

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {categories.map(cat => (
                <div key={cat}>
                    <h3 style={{
                        fontFamily: 'var(--font-header)',
                        fontSize: 12,
                        color: 'var(--color-gold)',
                        letterSpacing: 2,
                        marginBottom: 16,
                        borderLeft: '4px solid var(--color-gold)',
                        paddingLeft: 12
                    }}>
                        {cat.toUpperCase()} PATTERNS
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 16
                    }}>
                        {patterns?.filter(p => p.pattern.category === cat).map(pattern => (
                            <div key={pattern.id} style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                padding: '16px',
                                transition: 'transform 0.2s',
                                cursor: 'default'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                        {pattern.pattern.name}
                                    </span>
                                    <span style={{ fontSize: 14 }}>{TYPE_ICONS['WEAPON'] || '📜'}</span>
                                    {/* <span style={{ fontSize: 14 }}>{TYPE_ICONS[pattern.type] || '📜'}</span> */}
                                </div>

                                {/* Progress Bar (Visual representation of mastery) */}
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, marginBottom: 4 }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>MASTERY</span>
                                        <span style={{ color: 'var(--color-accent)' }}>{pattern.masteryLevel}</span>
                                    </div>
                                    <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ width: `${pattern.masteryLevel}%`, height: '100%', background: 'var(--color-accent)' }} />
                                    </div>
                                </div>

                                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                    {pattern.pattern.description.substring(0, 80)}...
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}