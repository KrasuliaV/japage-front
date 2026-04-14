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

    if (isLoading) return <div style={{ fontSize: 10 }}>LOADING ABILITIES...</div>

    return (
        <div style={{ display: 'grid', gap: 10, padding: '4px' }}>
            {skills?.map(skill => (
                <div
                    key={skill.id}
                    className="game-panel"
                    style={{
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--color-border)'
                    }}>
                    <div>
                        <div style={{
                            fontFamily: "'Nunito', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--color-accent)',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 4
                        }}>{skill.skill.name}</div>
                        <div style={{
                            fontFamily: '"Courier New", monospace',
                            color: 'var(--color-text-primary)',
                            fontSize: 12,
                            lineHeight: 1.4,
                            fontWeight: 600,
                            marginBottom: 6
                        }}>{skill.skill.description}</div>
                        <div style={{
                            fontFamily: '"Courier New"',
                            color: 'var(--color-text-secondary)',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            margin: 4,
                            lineHeight: 1.5
                        }}>{skill.skill.effectDescription}</div>
                    </div>

                    {/* RIGHT SECTION: Level Indicator */}
                    <div style={{
                        width: 80,
                        textAlign: 'center',
                        borderLeft: '1px solid rgba(255,255,255,0.1)',
                        paddingLeft: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            fontSize: 8,
                            color: 'var(--color-text-muted)',
                            letterSpacing: 1,
                            marginBottom: 2
                        }}>
                            LEVEL
                        </div>
                        <div style={{
                            fontSize: 20,
                            color: 'var(--color-mana)',
                            fontWeight: 'bold',
                            fontFamily: 'monospace'
                        }}>
                            {skill.skillLevel}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}