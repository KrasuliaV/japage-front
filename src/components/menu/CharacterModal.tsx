import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { InventoryContent } from '@/components/menu/InventoryContent' // We will extract this
import { MasteryContent } from '@/components/menu/MasteryContent'     // We will extract this
import { SkillsContent } from '@/components/menu/SkillsContent'       // New content

export function CharacterModal() {
    const showInventoryModal = useGameStore(s => s.showInventoryModal)
    const closeInventory = useGameStore(s => s.closeInventory)
    const [activeTab, setActiveTab] = useState<'GEAR' | 'SKILLS' | 'MASTERY'>('GEAR')

    if (!showInventoryModal) return null

    function close() {
        closeInventory()
        const canvas = document.querySelector('canvas')
        canvas?.focus()
    }

    return (
        <div
            className="modal-overlay"
            onClick={close}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20,
                pointerEvents: 'auto' // CRITICAL FIX
            }}
        >
            <div
                className="game-panel"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 800, height: '85vh', display: 'flex',
                    flexDirection: 'column', background: 'var(--color-bg-panel)',
                    border: '2px solid var(--color-border)', borderRadius: 4,
                    position: 'relative'
                }}
            >
                {/* <button 
          onClick={close}
          style={{
            position: 'absolute', right: 10, top: 10, background: 'none',
            border: 'none', color: '#666', cursor: 'pointer', zIndex: 10
          }}
        >✕</button> */}

                {/* ── Tabs Header ────────────────────────────────── */}
                <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', background: 'rgba(0,0,0,0.2)' }}>
                    {(['GEAR', 'SKILLS', 'MASTERY'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="game-btn"
                            style={{
                                flex: 1, padding: '16px', borderRadius: 0, border: 'none',
                                background: activeTab === tab ? 'var(--color-accent)' : 'transparent',
                                color: activeTab === tab ? '#000' : 'var(--color-text-secondary)',
                                fontSize: 10, letterSpacing: 1, cursor: 'pointer'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Content Area ───────────────────────────────── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {activeTab === 'GEAR' && <InventoryContent />}
                    {activeTab === 'SKILLS' && <SkillsContent />}
                    {activeTab === 'MASTERY' && <MasteryContent />}
                </div>

                {/* ── Footer ─────────────────────────────────────── */}
                <div style={{ padding: 12, borderTop: '2px solid var(--color-border)', textAlign: 'right' }}>
                    <button className="game-btn" onClick={close} style={{ fontSize: 9 }}>
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    )
}