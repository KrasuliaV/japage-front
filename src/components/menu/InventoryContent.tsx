import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { characterApi } from '@/api/game'

import type { InventoryResponse } from '@/types'
import { TYPE_ICONS } from '@/constants/icons'

const RARITY_COLORS: Record<string, string> = {
    COMMON: 'var(--color-text-secondary)',
    RARE: '#4a9eff',
    EPIC: '#aa3bff',
    LEGENDARY: 'var(--color-gold)',
}
const RARITY_GLOW: Record<string, string> = {
    COMMON: 'none',
    RARE: '0 0 8px rgba(74,158,255,0.4)',
    EPIC: '0 0 8px rgba(170,59,255,0.4)',
    LEGENDARY: '0 0 8px var(--color-gold-glow)',
}

export function InventoryContent() {
    const queryClient = useQueryClient()
    const character = useGameStore(s => s.character)
    const setCharacter = useGameStore(s => s.setCharacter)
    const [hoveredItem, setHoveredItem] = useState<InventoryResponse | null>(null)
    const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory', character?.id],
        queryFn: () => characterApi.getInventory(character!.id),
        enabled: !!character?.id,
        staleTime: 10_000,
    })

    const equipMutation = useMutation({
        mutationFn: (itemId: string) => characterApi.equipItem(character!.id, { itemId }),
        onSuccess: (updatedChar) => {
            setCharacter(updatedChar)
            queryClient.invalidateQueries({ queryKey: ['inventory', character?.id] })
            showFeedback('Item equipped!', true)
        },
        onError: () => showFeedback('Failed to equip item', false),
    })

    const unequipMutation = useMutation({
        mutationFn: (itemId: string) =>
            characterApi.unequipItem(character!.id, itemId),
        onSuccess: (updatedChar) => {
            setCharacter(updatedChar)
            queryClient.invalidateQueries({ queryKey: ['inventory', character?.id] })
            showFeedback('Item unequipped!', true)
        },
        onError: () => showFeedback('Failed to unequip item', false),
    })

    function showFeedback(msg: string, ok: boolean) {
        setFeedback({ msg, ok })
        setTimeout(() => setFeedback(null), 2000)
    }

    function handleEquipToggle(item: InventoryResponse) {
        if (equipMutation.isPending || unequipMutation.isPending) return;
        setHoveredItem(null);
        if (item.isEquipped) {
            unequipMutation.mutate(item.item.id)
        } else {
            equipMutation.mutate(item.item.id)
        }
    }

    if (!character) return null
    if (isLoading) return <div style={{ padding: 20, fontSize: 10 }}>Loading Bag...</div>

    const equippedItems = inventory?.filter(inv => inv.isEquipped) || []
    const bagItems = inventory?.filter(inv => !inv.isEquipped) || []

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {feedback && (
                <div style={{
                    position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 10, padding: '4px 12px', borderRadius: 2, fontSize: 9,
                    background: feedback.ok ? 'rgba(78,204,163,0.9)' : 'rgba(232,64,64,0.9)',
                    color: '#000', fontWeight: 'bold', border: '1px solid rgba(0,0,0,0.2)'
                }}>
                    {feedback.msg}
                </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>

                {/* ── Equipped Section ──────────────── */}
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 12 }}>EQUIPPED</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {['WEAPON', 'ARMOR', 'ACCESSORY'].map(slot => {
                            const equipped = equippedItems.find(inv => inv.item.type === slot)
                            return (
                                <div key={slot}
                                    onClick={() => equipped && handleEquipToggle(equipped)}
                                    onMouseEnter={() => equipped && setHoveredItem(equipped)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    style={{
                                        height: 80, background: 'rgba(0,0,0,0.4)', border: '1px dashed #444',
                                        borderRadius: 4, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', position: 'relative'
                                    }}>
                                    <span style={{ fontSize: 7, color: '#666', position: 'absolute', top: 4 }}>{slot}</span>
                                    {equipped ? (
                                        <div style={{ textAlign: 'center', color: RARITY_COLORS[equipped.item.rarity] }}>
                                            <div style={{ fontSize: 26, marginBottom: 4 }}>{TYPE_ICONS[equipped.item.type]}</div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 14, opacity: 0.2 }}>{TYPE_ICONS[slot as keyof typeof TYPE_ICONS]}</div>
                                    )}
                                    {hoveredItem?.id === equipped?.id && equipped && (
                                        <div style={{
                                            fontFamily: "'Nunito', sans-serif",
                                            position: 'absolute', top: '100%', left: 0, zIndex: 20,
                                            background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)',
                                            padding: 8, minWidth: 120, pointerEvents: 'none', marginTop: 4
                                        }}>
                                            <div style={{ fontSize: 14, fontWeight: 900, color: RARITY_COLORS[equipped.item.rarity] }}>{equipped.item.name}</div>
                                            <div style={{ fontSize: 9, color: '#888' }}>{equipped.item.rarity} {equipped.item.type}</div>
                                            <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {[
                                                { key: 'attackBonus', label: 'Attack' },
                                                { key: 'defenseBonus', label: 'Defense' },
                                                { key: 'hpBonus', label: 'HP' },
                                                { key: 'xpMultiplier', label: 'XP Multiplier', isMult: true },
                                                { key: 'goldMultiplier', label: 'Gold Multiplier', isMult: true },
                                            ].map(stat => {
                                                const value = equipped.item[stat.key as keyof typeof equipped.item];
                                                // Only render if value is not 0, null, or undefined
                                                if (!value || value === 0) return null;
                                                if (stat.isMult && value === 1) return null;

                                                return (
                                                    <div key={stat.key} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#aaa' }}>{stat.label}:</span>
                                                        <span style={{ color: 'var(--color-gold)', fontWeight: 900 }}>
                                                            {stat.isMult ? `x${value}` : `+${value}`}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── Bag Section ──────────────────── */}

                <div>
                    <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 12 }}>BAG</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: 12
                    }}>
                        {bagItems?.map((inv) => (
                            <div
                                key={inv.id}
                                onMouseEnter={() => setHoveredItem(inv)}
                                onMouseLeave={() => setHoveredItem(null)}
                                onClick={() => handleEquipToggle(inv)}
                                style={{
                                    aspectRatio: '1',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${inv.isEquipped ? 'var(--color-accent)' : '#333'}`,
                                    borderRadius: 4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '4px 2px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    boxShadow: inv.isEquipped ? RARITY_GLOW[inv.item.rarity] : 'none'
                                }}
                            >
                                {/* Item Name (Above Icon) */}
                                <div style={{
                                    fontFamily: "'Nunito', sans-serif",
                                    fontWeight: 900,
                                    fontSize: 10,
                                    textAlign: 'center',
                                    color: 'var(--color-text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%'
                                }}>
                                    {inv.item.name}
                                </div>

                                {/* Icon */}
                                <div style={{ fontSize: 32, margin: '4px 0' }}>{TYPE_ICONS[inv.item.type]}</div>

                                {/* Item Rarity (Under Icon) */}
                                <div style={{
                                    fontSize: 7,
                                    color: RARITY_COLORS[inv.item.rarity],
                                    fontWeight: 'bold',
                                    letterSpacing: '0.5px'
                                }}>
                                    {inv.item.rarity}
                                </div>

                                {/* Tooltip with Detailed Characteristics */}
                                {hoveredItem?.id === inv.id && (
                                    <div style={{
                                        fontFamily: "'Nunito', sans-serif",
                                        fontWeight: 900,
                                        position: 'absolute',
                                        bottom: '105%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        zIndex: 100,
                                        background: 'var(--color-bg-panel)',
                                        border: `1px solid ${RARITY_COLORS[inv.item.rarity]}`,
                                        padding: '10px',
                                        minWidth: 160,
                                        pointerEvents: 'none',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                        borderRadius: '2px'
                                    }}>

                                        {/* --- Dynamic Stats Section --- */}
                                        <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {[
                                                { key: 'attackBonus', label: 'Attack' },
                                                { key: 'defenseBonus', label: 'Defense' },
                                                { key: 'hpBonus', label: 'HP' },
                                                // { key: 'manaBonus', label: 'Mana' },
                                                // { key: 'hintCharges', label: 'Hints' },
                                                // { key: 'skipCharges', label: 'Skips' },
                                                { key: 'xpMultiplier', label: 'XP Multiplier', isMult: true },
                                                { key: 'goldMultiplier', label: 'Gold Multiplier', isMult: true },
                                            ].map(stat => {
                                                const value = inv.item[stat.key as keyof typeof inv.item];
                                                // Only render if value is not 0, null, or undefined
                                                if (!value || value === 0) return null;
                                                if (stat.isMult && value === 1) return null;

                                                return (
                                                    <div key={stat.key} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#aaa' }}>{stat.label}:</span>
                                                        <span style={{ color: 'var(--color-gold)', fontWeight: 900 }}>
                                                            {stat.isMult ? `x${value}` : `+${value}`}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div style={{
                                            fontSize: 10,
                                            color: 'var(--color-text-secondary)',
                                            lineHeight: 1.4,
                                            fontStyle: 'italic',
                                            borderTop: '1px solid #333',
                                            paddingTop: 6
                                        }}>
                                            "{inv.item.description}"
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Badge */}
                                {inv.quantity > 1 && (
                                    <div style={{
                                        position: 'absolute', top: 2, right: 4,
                                        fontSize: 7, color: 'var(--color-gold)',
                                        background: 'rgba(0,0,0,0.6)', padding: '0 2px'
                                    }}>
                                        ×{inv.quantity}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}