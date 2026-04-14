import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { InventoryContent } from '@/components/menu/InventoryContent'
import { MasteryContent } from '@/components/menu/MasteryContent'
import { SkillsContent } from '@/components/menu/SkillsContent'
import { releaseToGame } from '@/game/kaplay'

type Tab = 'GEAR' | 'SKILLS' | 'MASTERY'

export function CharacterModal() {
    const showInventoryModal = useGameStore(s => s.showInventoryModal)
    const closeInventory = useGameStore(s => s.closeInventory)
    const character = useGameStore(s => s.character)
    const [activeTab, setActiveTab] = useState<Tab>('GEAR')

    if (!showInventoryModal || !character) return null

    function close() {
        closeInventory()
        releaseToGame();
    }

    const hpPct = Math.max(0, (character.currentHp / character.maxHp) * 100)
    const xpPct = Math.max(0, (character.exp / character.expToNextLevel) * 100)

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: 20, pointerEvents: 'auto',
                fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
            }}
            onClick={close}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 860,
                    height: '85vh',
                    background: '#0d1117',
                    border: '1px solid var(--color-border-gold-bright, rgba(200,170,100,0.35))',
                    borderRadius: 16,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Top shimmer line */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent, var(--color-gold, #c8a046), transparent)',
                    zIndex: 1,
                }} />

                {/* ── Header ── */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px 0',
                    borderBottom: '1px solid var(--color-border-gold, rgba(180,150,80,0.18))',
                }}>
                    {/* Character identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 46, height: 46, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1a2a1a, #0a1a28)',
                            border: '1.5px solid var(--color-gold-dim, #8a6820)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20,
                        }}>⚔️</div>
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-display, "Cinzel", serif)',
                                fontSize: 15, fontWeight: 600,
                                color: 'var(--color-gold, #c8a046)', letterSpacing: '0.5px',
                            }}>
                                {character.name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.8px', marginTop: 2 }}>
                                {character.characterClass.name.toUpperCase()} · LV. {character.level}
                            </div>
                        </div>
                    </div>

                    {/* Stats + close */}
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingBottom: 14 }}>
                        {[
                            { val: `${character.currentHp}/${character.maxHp}`, label: 'HEALTH', color: '#5dc080' },
                            { val: `${character.mana}/${character.maxMana}`, label: 'MANA', color: '#9a7fe0' },
                            { val: character.gold.toLocaleString(), label: 'GOLD', color: 'var(--color-gold, #c8a046)' },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: s.color }}>{s.val}</div>
                                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.6px', marginTop: 1 }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}

                        {/* XP + HP bars (compact) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 80 }}>
                            <div style={{ height: 3, background: 'var(--color-bg-deep)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${hpPct}%`, height: '100%', background: '#5dc080', borderRadius: 2, transition: 'width 0.4s ease' }} />
                            </div>
                            <div style={{ height: 3, background: 'var(--color-bg-deep)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${xpPct}%`, height: '100%', background: '#9a7fe0', borderRadius: 2, transition: 'width 0.4s ease' }} />
                            </div>
                        </div>

                        <button
                            onClick={close}
                            style={{
                                width: 28, height: 28,
                                border: '1px solid var(--color-border)',
                                borderRadius: 6, background: 'transparent',
                                color: 'var(--color-text-muted)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, transition: 'all 0.15s',
                                marginBottom: 14,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-danger)'; e.currentTarget.style.color = 'var(--color-danger)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                        >✕</button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div style={{
                    display: 'flex', gap: 2, padding: '0 24px',
                    borderBottom: '1px solid var(--color-border-gold, rgba(180,150,80,0.18))',
                    background: '#0d1117',
                    marginTop: -1,
                }}>
                    {(['GEAR', 'SKILLS', 'MASTERY'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 18px',
                                fontSize: 11, letterSpacing: '1.2px',
                                fontFamily: 'var(--font-display, "Cinzel", serif)',
                                fontWeight: 400,
                                color: activeTab === tab ? 'var(--color-gold, #c8a046)' : 'var(--color-text-muted)',
                                background: 'none', border: 'none',
                                borderBottom: `2px solid ${activeTab === tab ? 'var(--color-gold, #c8a046)' : 'transparent'}`,
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Content ── */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: 20,
                    scrollbarWidth: 'thin',
                }}>
                    {activeTab === 'GEAR' && <InventoryContent />}
                    {activeTab === 'SKILLS' && <SkillsContent />}
                    {activeTab === 'MASTERY' && <MasteryContent />}
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: '10px 20px',
                    borderTop: '1px solid var(--color-border-gold, rgba(180,150,80,0.18))',
                    display: 'flex', justifyContent: 'flex-end',
                }}>
                    <button className="game-btn" onClick={close} style={{ fontSize: 10, padding: '6px 20px' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}