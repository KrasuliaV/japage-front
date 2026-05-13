import { useQuery } from '@tanstack/react-query'
import { characterApi } from '@/api/game'
import { useGameStore } from '@/stores/gameStore'

export function SkillsContent() {
    const character = useGameStore(s => s.character)
    const { data: skills, isLoading } = useQuery({
        queryKey: ['character-skills', character?.id],
        queryFn: () => characterApi.getSkills(character!.id),
        enabled: !!character?.id,
    })

        if (isLoading) return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 11 }}>
            Loading abilities...
        </div>
    )

    if (!skills || skills.length === 0) return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 11 }}>
            No skills unlocked yet.
        </div>
    )

    // return (
    //     <div style={{ display: 'grid', gap: 10, padding: '4px' }}>
    //         {skills?.map(skill => (
    //             <div
    //                 key={skill.id}
    //                 className="game-panel"
    //                 style={{
    //                     padding: '16px',
    //                     display: 'flex',
    //                     alignItems: 'center',
    //                     justifyContent: 'space-between',
    //                     background: 'rgba(255, 255, 255, 0.02)',
    //                     border: '1px solid var(--color-border)'
    //                 }}>
    //                 <div>
    //                     <div style={{
    //                         fontFamily: "'Nunito', sans-serif",
    //                         fontSize: 14,
    //                         fontWeight: 700,
    //                         color: 'var(--color-accent)',
    //                         textTransform: 'uppercase',
    //                         letterSpacing: 1,
    //                         marginBottom: 4
    //                     }}>{skill.skill.name}</div>
    //                     <div style={{
    //                         fontFamily: '"Courier New", monospace',
    //                         color: 'var(--color-text-primary)',
    //                         fontSize: 12,
    //                         lineHeight: 1.4,
    //                         fontWeight: 600,
    //                         marginBottom: 6
    //                     }}>{skill.skill.description}</div>
    //                     <div style={{
    //                         fontFamily: '"Courier New"',
    //                         color: 'var(--color-text-secondary)',
    //                         fontSize: 12,
    //                         fontWeight: 600,
    //                         display: 'flex',
    //                         flexDirection: 'column',
    //                         gap: 4,
    //                         margin: 4,
    //                         lineHeight: 1.5
    //                     }}>{skill.skill.effectDescription}</div>
    //                 </div>

    //                 {/* RIGHT SECTION: Level Indicator */}
    //                 <div style={{
    //                     width: 80,
    //                     textAlign: 'center',
    //                     borderLeft: '1px solid rgba(255,255,255,0.1)',
    //                     paddingLeft: 16,
    //                     display: 'flex',
    //                     flexDirection: 'column',
    //                     justifyContent: 'center'
    //                 }}>
    //                     <div style={{
    //                         fontSize: 8,
    //                         color: 'var(--color-text-muted)',
    //                         letterSpacing: 1,
    //                         marginBottom: 2
    //                     }}>
    //                         LEVEL
    //                     </div>
    //                     <div style={{
    //                         fontSize: 20,
    //                         color: 'var(--color-mana)',
    //                         fontWeight: 'bold',
    //                         fontFamily: 'monospace'
    //                     }}>
    //                         {skill.skillLevel}
    //                     </div>
    //                 </div>
    //             </div>
    //         ))}
    //     </div>
    // )
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: '"DM Sans", sans-serif' }}>
            {skills.map(cs => {
                const pips = Array.from({ length: MAX_SKILL_LEVEL }, (_, i) => i < cs.skillLevel)

                return (
                    <div key={cs.id} style={{
                        background: '#13181f',
                        border: '1px solid rgba(180,150,80,0.18)',
                        borderRadius: 10,
                        padding: '14px 16px',
                        display: 'flex',
                        gap: 14,
                        alignItems: 'flex-start',
                        transition: 'border-color 0.15s',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,170,100,0.35)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(180,150,80,0.18)')}
                    >
                        {/* Icon */}
                        <div style={{
                            width: 42, height: 42,
                            borderRadius: 10,
                            background: '#1a2130',
                            border: '1px solid rgba(180,150,80,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, flexShrink: 0,
                        }}>
                            {getSkillIcon(cs.skill.category)}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontFamily: '"Cinzel", serif',
                                fontSize: 12, fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                marginBottom: 4,
                            }}>
                                {cs.skill.name}
                            </div>
                            <div style={{
                                fontSize: 11,
                                color: 'var(--color-text-muted)',
                                lineHeight: 1.55,
                                marginBottom: 8,
                            }}>
                                {cs.skill.description}
                            </div>
                            <div style={{
                                display: 'inline-block',
                                fontSize: 10,
                                color: '#3db89a',
                                background: 'rgba(61,184,154,0.08)',
                                border: '1px solid rgba(61,184,154,0.15)',
                                borderRadius: 4,
                                padding: '3px 8px',
                            }}>
                                {cs.skill.effectDescription}
                            </div>
                        </div>

                        {/* Level */}
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 4, flexShrink: 0,
                        }}>
                            <div style={{
                                fontFamily: '"Cinzel", serif',
                                fontSize: 22, fontWeight: 600,
                                color: '#c8a046', lineHeight: 1,
                            }}>
                                {cs.skillLevel}
                            </div>
                            <div style={{ fontSize: 8, color: '#504840', letterSpacing: '0.8px' }}>
                                LEVEL
                            </div>
                            <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                                {pips.map((filled, i) => (
                                    <div key={i} style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: filled ? '#c8a046' : 'rgba(180,150,80,0.18)',
                                        transition: 'background 0.2s',
                                    }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function getSkillIcon(category: string): string {
    const icons: Record<string, string> = {
        CREATIONAL: '🌱',
        STRUCTURAL: '🏗️',
        BEHAVIORAL: '⚡',
        GENERAL: '🧠',
    }
    return icons[category] ?? '✨'
}