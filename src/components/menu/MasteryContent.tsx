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

    if (isLoading) return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 11 }}>
            Studying patterns...
        </div>
    )

    const categories = patterns ? [...new Set(patterns.map(p => p.pattern.category))] : []

    // return (
    //     <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    //         {categories.map(cat => (
    //             <div key={cat}>
    //                 <h3 style={{
    //                     fontFamily: 'var(--font-header)',
    //                     fontSize: 12,
    //                     color: 'var(--color-gold)',
    //                     letterSpacing: 2,
    //                     marginBottom: 16,
    //                     borderLeft: '4px solid var(--color-gold)',
    //                     paddingLeft: 12
    //                 }}>
    //                     {cat.toUpperCase()} PATTERNS
    //                 </h3>

    //                 <div style={{
    //                     display: 'grid',
    //                     gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    //                     gap: 16
    //                 }}>
    //                     {patterns?.filter(p => p.pattern.category === cat).map(pattern => (
    //                         <div key={pattern.id} style={{
    //                             background: 'rgba(255,255,255,0.03)',
    //                             border: '1px solid var(--color-border)',
    //                             borderRadius: '8px',
    //                             padding: '16px',
    //                             transition: 'transform 0.2s',
    //                             cursor: 'default'
    //                         }}>
    //                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
    //                                 <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
    //                                     {pattern.pattern.name}
    //                                 </span>
    //                                 <span style={{ fontSize: 14 }}>{TYPE_ICONS['WEAPON'] || '📜'}</span>
    //                                 {/* <span style={{ fontSize: 14 }}>{TYPE_ICONS[pattern.type] || '📜'}</span> */}
    //                             </div>

    //                             {/* Progress Bar (Visual representation of mastery) */}
    //                             <div style={{ marginBottom: 8 }}>
    //                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, marginBottom: 4 }}>
    //                                     <span style={{ color: 'var(--color-text-muted)' }}>MASTERY</span>
    //                                     <span style={{ color: 'var(--color-accent)' }}>{pattern.masteryLevel}</span>
    //                                 </div>
    //                                 <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
    //                                     <div style={{ width: `${pattern.masteryLevel}%`, height: '100%', background: 'var(--color-accent)' }} />
    //                                 </div>
    //                             </div>

    //                             <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
    //                                 {pattern.pattern.description.substring(0, 80)}...
    //                             </div>
    //                         </div>
    //                     ))}
    //                 </div>
    //             </div>
    //         ))}
    //     </div>
    // )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"DM Sans", sans-serif' }}>
            {categories.map(cat => (
                <div key={cat}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 12,
                    }}>
                        <div style={{ width: 3, height: 16, background: '#8a6820', borderRadius: 2, flexShrink: 0 }} />
                        <div style={{
                            fontFamily: '"Cinzel", serif',
                            fontSize: 10,
                            letterSpacing: '2px',
                            color: '#a07828',
                        }}>
                            {String(cat).toUpperCase()} PATTERNS
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 10,
                        alignItems: 'stretch',   // all cards same height in a row
                    }}>
                        {patterns?.filter(p => p.pattern.category === cat).map(pm => {
                            const pct = Math.min(100, pm.masteryLevel)
                            const barColor = pct >= 75 ? '#c8a046' : pct >= 40 ? '#3db89a' : '#5a6080'

                            return (
                                <div key={pm.id} style={{
                                    background: '#13181f',
                                    border: '1px solid rgba(180,150,80,0.18)',
                                    borderRadius: 8,
                                    padding: '14px 16px',
                                    transition: 'border-color 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column', // column layout
                                    gap: 8,
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,170,100,0.4)')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(180,150,80,0.18)')}
                                >
                                    {/* Name + percentage */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        gap: 8,
                                    }}>
                                        <span style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#e8e2d4',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {pm.pattern.name}
                                        </span>
                                        <span style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: barColor,
                                            flexShrink: 0,
                                        }}>
                                            {pct}%
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ height: 4, background: '#1a2130', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${pct}%`, height: '100%',
                                            background: `linear-gradient(90deg, ${barColor}66, ${barColor})`,
                                            borderRadius: 2,
                                            transition: 'width 0.4s ease',
                                        }} />
                                    </div>

                                    {/* Description — fixed 2-line height, never pushes stats down */}
                                    <div style={{
                                        fontSize: 11,
                                        color: '#8a8070',
                                        lineHeight: 1.55,
                                        flex: 1,             // takes remaining space
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}>
                                        {pm.pattern.description}
                                    </div>

                                    {/* Stats — always pinned to bottom */}
                                    <div style={{
                                        display: 'flex',
                                        gap: 16,
                                        paddingTop: 8,
                                        borderTop: '1px solid rgba(180,150,80,0.1)',
                                        marginTop: 'auto',   // pushes to bottom regardless of description length
                                    }}>
                                        <div style={{ fontSize: 12, color: '#6a6060', whiteSpace: 'nowrap' }}>
                                            Tried <span style={{ color: '#a09080', fontWeight: 600 }}>{pm.timesAttempted}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#6a6060', whiteSpace: 'nowrap' }}>
                                            Correct <span style={{ color: '#3db89a', fontWeight: 600 }}>{pm.timesCorrect}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}