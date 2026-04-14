import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { characterApi } from '@/api/game'

import type { InventoryResponse } from '@/types'
import { TYPE_ICONS } from '@/constants/icons'

// const RARITY_COLORS: Record<string, string> = {
//     COMMON: 'var(--color-text-secondary)',
//     RARE: '#4a9eff',
//     EPIC: '#aa3bff',
//     LEGENDARY: 'var(--color-gold)',
// }
// const RARITY_GLOW: Record<string, string> = {
//     COMMON: 'none',
//     RARE: '0 0 8px rgba(74,158,255,0.4)',
//     EPIC: '0 0 8px rgba(170,59,255,0.4)',
//     LEGENDARY: '0 0 8px var(--color-gold-glow)',
// }


const RARITY_COLORS: Record<string, string> = {
    COMMON: '#7a7870', RARE: '#4a9eff', EPIC: '#aa3bff', LEGENDARY: '#e0a030',
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


    // function handleEquipToggle(item: InventoryResponse) {
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
    // const bagItems = inventory?.filter(inv => !inv.isEquipped) || []
    const bagItems = inventory || []

    // return (
    //     <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    //         {feedback && (
    //             <div style={{
    //                 position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
    //                 zIndex: 10, padding: '4px 12px', borderRadius: 2, fontSize: 9,
    //                 background: feedback.ok ? 'rgba(78,204,163,0.9)' : 'rgba(232,64,64,0.9)',
    //                 color: '#000', fontWeight: 'bold', border: '1px solid rgba(0,0,0,0.2)'
    //             }}>
    //                 {feedback.msg}
    //             </div>
    //         )}

    //         <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>

    //             {/* ── Equipped Section ──────────────── */}
    //             <div style={{ marginBottom: 24 }}>
    //                 <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 12 }}>EQUIPPED</h3>
    //                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
    //                     {['WEAPON', 'ARMOR', 'ACCESSORY'].map(slot => {
    //                         const equipped = equippedItems.find(inv => inv.item.type === slot)
    //                         return (
    //                             <div key={slot}
    //                                 onClick={() => equipped && handleEquipToggle(equipped)}
    //                                 onMouseEnter={() => equipped && setHoveredItem(equipped)}
    //                                 onMouseLeave={() => setHoveredItem(null)}
    //                                 style={{
    //                                     height: 80, background: 'rgba(0,0,0,0.4)', border: '1px dashed #444',
    //                                     borderRadius: 4, display: 'flex', flexDirection: 'column',
    //                                     alignItems: 'center', justifyContent: 'center', position: 'relative'
    //                                 }}>
    //                                 <span style={{ fontSize: 7, color: '#666', position: 'absolute', top: 4 }}>{slot}</span>
    //                                 {equipped ? (
    //                                     <div style={{ textAlign: 'center', color: RARITY_COLORS[equipped.item.rarity] }}>
    //                                         <div style={{ fontSize: 26, marginBottom: 4 }}>{TYPE_ICONS[equipped.item.type]}</div>
    //                                     </div>
    //                                 ) : (
    //                                     <div style={{ fontSize: 14, opacity: 0.2 }}>{TYPE_ICONS[slot as keyof typeof TYPE_ICONS]}</div>
    //                                 )}
    //                                 {hoveredItem?.id === equipped?.id && equipped && (
    //                                     <div style={{
    //                                         fontFamily: "'Nunito', sans-serif",
    //                                         position: 'absolute', top: '100%', left: 0, zIndex: 20,
    //                                         background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)',
    //                                         padding: 8, minWidth: 120, pointerEvents: 'none', marginTop: 4
    //                                     }}>
    //                                         <div style={{ fontSize: 14, fontWeight: 900, color: RARITY_COLORS[equipped.item.rarity] }}>{equipped.item.name}</div>
    //                                         <div style={{ fontSize: 9, color: '#888' }}>{equipped.item.rarity} {equipped.item.type}</div>
    //                                         <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
    //                                         {[
    //                                             { key: 'attackBonus', label: 'Attack' },
    //                                             { key: 'defenseBonus', label: 'Defense' },
    //                                             { key: 'hpBonus', label: 'HP' },
    //                                             { key: 'xpMultiplier', label: 'XP Multiplier', isMult: true },
    //                                             { key: 'goldMultiplier', label: 'Gold Multiplier', isMult: true },
    //                                         ].map(stat => {
    //                                             const value = equipped.item[stat.key as keyof typeof equipped.item];
    //                                             // Only render if value is not 0, null, or undefined
    //                                             if (!value || value === 0) return null;
    //                                             if (stat.isMult && value === 1) return null;

    //                                             return (
    //                                                 <div key={stat.key} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
    //                                                     <span style={{ color: '#aaa' }}>{stat.label}:</span>
    //                                                     <span style={{ color: 'var(--color-gold)', fontWeight: 900 }}>
    //                                                         {stat.isMult ? `x${value}` : `+${value}`}
    //                                                     </span>
    //                                                 </div>
    //                                             );
    //                                         })}
    //                                     </div>
    //                                     </div>
    //                                 )}
    //                             </div>
    //                         )
    //                     })}
    //                 </div>
    //             </div>

    //             {/* ── Bag Section ──────────────────── */}

    //             <div>
    //                 <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 12 }}>BAG</h3>
    //                 <div style={{
    //                     display: 'grid',
    //                     gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    //                     gap: 12
    //                 }}>
    //                     {bagItems?.map((inv) => (
    //                         <div
    //                             key={inv.id}
    //                             onMouseEnter={() => setHoveredItem(inv)}
    //                             onMouseLeave={() => setHoveredItem(null)}
    //                             onClick={() => handleEquipToggle(inv)}
    //                             style={{
    //                                 aspectRatio: '1',
    //                                 background: 'rgba(255,255,255,0.03)',
    //                                 border: `1px solid ${inv.isEquipped ? 'var(--color-accent)' : '#333'}`,
    //                                 borderRadius: 4,
    //                                 display: 'flex',
    //                                 flexDirection: 'column',
    //                                 alignItems: 'center',
    //                                 justifyContent: 'space-between',
    //                                 padding: '4px 2px',
    //                                 cursor: 'pointer',
    //                                 position: 'relative',
    //                                 transition: 'all 0.2s ease',
    //                                 boxShadow: inv.isEquipped ? RARITY_GLOW[inv.item.rarity] : 'none'
    //                             }}
    //                         >
    //                             {/* Item Name (Above Icon) */}
    //                             <div style={{
    //                                 fontFamily: "'Nunito', sans-serif",
    //                                 fontWeight: 900,
    //                                 fontSize: 10,
    //                                 textAlign: 'center',
    //                                 color: 'var(--color-text-primary)',
    //                                 overflow: 'hidden',
    //                                 textOverflow: 'ellipsis',
    //                                 whiteSpace: 'nowrap',
    //                                 width: '100%'
    //                             }}>
    //                                 {inv.item.name}
    //                             </div>

    //                             {/* Icon */}
    //                             <div style={{ fontSize: 32, margin: '4px 0' }}>{TYPE_ICONS[inv.item.type]}</div>

    //                             {/* Item Rarity (Under Icon) */}
    //                             <div style={{
    //                                 fontSize: 7,
    //                                 color: RARITY_COLORS[inv.item.rarity],
    //                                 fontWeight: 'bold',
    //                                 letterSpacing: '0.5px'
    //                             }}>
    //                                 {inv.item.rarity}
    //                             </div>

    //                             {/* Tooltip with Detailed Characteristics */}
    //                             {hoveredItem?.id === inv.id && (
    //                                 <div style={{
    //                                     fontFamily: "'Nunito', sans-serif",
    //                                     fontWeight: 900,
    //                                     position: 'absolute',
    //                                     bottom: '105%',
    //                                     left: '50%',
    //                                     transform: 'translateX(-50%)',
    //                                     zIndex: 100,
    //                                     background: 'var(--color-bg-panel)',
    //                                     border: `1px solid ${RARITY_COLORS[inv.item.rarity]}`,
    //                                     padding: '10px',
    //                                     minWidth: 160,
    //                                     pointerEvents: 'none',
    //                                     boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    //                                     borderRadius: '2px'
    //                                 }}>

    //                                     {/* --- Dynamic Stats Section --- */}
    //                                     <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
    //                                         {[
    //                                             { key: 'attackBonus', label: 'Attack' },
    //                                             { key: 'defenseBonus', label: 'Defense' },
    //                                             { key: 'hpBonus', label: 'HP' },
    //                                             // { key: 'manaBonus', label: 'Mana' },
    //                                             // { key: 'hintCharges', label: 'Hints' },
    //                                             // { key: 'skipCharges', label: 'Skips' },
    //                                             { key: 'xpMultiplier', label: 'XP Multiplier', isMult: true },
    //                                             { key: 'goldMultiplier', label: 'Gold Multiplier', isMult: true },
    //                                         ].map(stat => {
    //                                             const value = inv.item[stat.key as keyof typeof inv.item];
    //                                             // Only render if value is not 0, null, or undefined
    //                                             if (!value || value === 0) return null;
    //                                             if (stat.isMult && value === 1) return null;

    //                                             return (
    //                                                 <div key={stat.key} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
    //                                                     <span style={{ color: '#aaa' }}>{stat.label}:</span>
    //                                                     <span style={{ color: 'var(--color-gold)', fontWeight: 900 }}>
    //                                                         {stat.isMult ? `x${value}` : `+${value}`}
    //                                                     </span>
    //                                                 </div>
    //                                             );
    //                                         })}
    //                                     </div>

    //                                     <div style={{
    //                                         fontSize: 10,
    //                                         color: 'var(--color-text-secondary)',
    //                                         lineHeight: 1.4,
    //                                         fontStyle: 'italic',
    //                                         borderTop: '1px solid #333',
    //                                         paddingTop: 6
    //                                     }}>
    //                                         "{inv.item.description}"
    //                                     </div>
    //                                 </div>
    //                             )}

    //                             {/* Quantity Badge */}
    //                             {inv.quantity > 1 && (
    //                                 <div style={{
    //                                     position: 'absolute', top: 2, right: 4,
    //                                     fontSize: 7, color: 'var(--color-gold)',
    //                                     background: 'rgba(0,0,0,0.6)', padding: '0 2px'
    //                                 }}>
    //                                     ×{inv.quantity}
    //                                 </div>
    //                             )}
    //                         </div>
    //                     ))}
    //                 </div>
    //             </div>

    //         </div>
    //     </div>
    // )

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, position: 'relative', fontFamily: '"DM Sans", sans-serif' }}>

            {/* ── Left: Equipped + Stats ── */}
            <div style={{ background: '#13181f', border: '1px solid rgba(180,150,80,0.18)', borderRadius: 10, padding: 14 }}>
                <SectionLabel>Equipped</SectionLabel>
                {(['WEAPON', 'ARMOR', 'ACCESSORY'] as const).map(slot => {
                    const item = equippedItems.find(inv => inv.item.type === slot)
                    return (
                        <div key={slot}
                            // onClick={() => item && handleEquipToggle({ item, isEquipped: true, id: item.id, quantity: 1, acquiredAt: '' })}
                            onClick={() => item && handleEquipToggle(item)}
                            style={{
                                background: '#1a2130',
                                border: `1px solid ${item ? 'rgba(200,160,70,0.25)' : 'rgba(180,150,80,0.18)'}`,
                                borderRadius: 8, padding: '10px', marginBottom: 8,
                                display: 'flex', alignItems: 'center', gap: 10,
                                cursor: item ? 'pointer' : 'default', transition: 'border-color 0.15s',
                            }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 6,
                                background: '#0d1117', border: '1px solid rgba(180,150,80,0.18)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                            }}>
                                {TYPE_ICONS[slot] ?? '—'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, color: item ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item?.item?.name ?? 'Empty slot'}
                                </div>
                                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.6px', marginTop: 2 }}>{slot}</div>
                            </div>
                            {item && (
                                <div style={{ fontSize: 10, color: '#3db89a', fontWeight: 500, flexShrink: 0 }}>
                                    {item.item.attackBonus > 0 ? `+${item.item.attackBonus} ATK` : item.item.defenseBonus > 0 ? `+${item.item.defenseBonus} DEF` : `+${item.item.hpBonus} HP`}
                                </div>
                            )}
                        </div>
                    )
                })}

                <div style={{ height: 1, background: 'rgba(180,150,80,0.18)', margin: '12px 0' }} />
                <SectionLabel>Base Stats</SectionLabel>
                {[
                    { label: 'HP', val: `${character.currentHp}/${character.maxHp}`, color: '#5dc080' },
                    { label: 'ATK', val: character.attack, color: 'var(--color-danger)' },
                    { label: 'DEF', val: character.defense, color: '#3db89a' },
                    { label: 'MP', val: `${character.mana}/${character.maxMana}`, color: '#9a7fe0' },
                ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                        <span style={{ fontWeight: 500, color: s.color }}>{s.val}</span>
                    </div>
                ))}
            </div>

            {/* ── Right: Bag ── */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <SectionLabel style={{ margin: 0 }}>Inventory</SectionLabel>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.8px' }}>{bagItems.length} ITEMS</span>
                </div>

                {isLoading && <LoadingText>Loading inventory...</LoadingText>}
                {!isLoading && bagItems.length === 0 && <LoadingText>Your bag is empty.</LoadingText>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                    {/* {bagItems.map(inv => ( */}
                    {bagItems.map(inv => (
                        <ItemCard key={inv.id} inv={inv} isHovered={hoveredItem?.item.id === inv.item.id}
                            onEnter={() => setHoveredItem(inv)} onLeave={() => setHoveredItem(null)}
                            onClick={() => handleEquipToggle(inv)} isPending={equipMutation.isPending || unequipMutation.isPending}
                        />
                    ))}
                </div>
            </div>

            {feedback && (
                <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    padding: '5px 14px', borderRadius: 6, fontSize: 10,
                    background: feedback.ok ? 'rgba(61,184,154,0.9)' : 'rgba(224,85,85,0.9)',
                    color: '#000', fontWeight: 500,
                }}>
                    {feedback.ok ? '✓' : '✗'} {feedback.msg}
                </div>
            )}
        </div>
    )

    function SectionLabel({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
        return (
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 9, letterSpacing: '1.8px', color: '#504840', marginBottom: 10, ...style }}>
                {String(children).toUpperCase()}
            </div>
        )
    }

    function LoadingText({ children }: { children: React.ReactNode }) {
        return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 11 }}>{children}</div>
    }

    function ItemCard({ inv, isHovered, onEnter, onLeave, onClick, isPending }:
        { inv: InventoryResponse, isHovered: boolean, onEnter: () => void, onLeave: () => void, onClick: () => void, isPending: boolean }) {
        const rarityColor = RARITY_COLORS[inv.item.rarity] ?? '#7a7870'
        return (
            <div onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick}
                style={{
                    background: inv.isEquipped ? 'rgba(200,160,70,0.06)' : '#13181f',
                    border: `1px solid ${inv.isEquipped ? 'rgba(200,160,70,0.4)' : isHovered ? 'rgba(200,170,100,0.35)' : 'rgba(180,150,80,0.18)'}`,
                    borderRadius: 8, padding: '10px 8px',
                    cursor: isPending ? 'wait' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    position: 'relative', transition: 'all 0.18s',
                    transform: isHovered ? 'translateY(-2px)' : 'none',
                    zIndex: isHovered ? 50 : 1,
                }}>
                {inv.isEquipped && (
                    <div style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 14, height: 14, borderRadius: '50%',
                        background: '#c8a046', fontSize: 7,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#000', fontWeight: 600,
                    }}>E</div>
                )}
                {isHovered && (
                    <div style={{
                        position: 'absolute',
                        top: '110%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 100,
                        width: 180,
                        background: '#1a2130',
                        border: `1px solid ${rarityColor}`,
                        borderRadius: 6,
                        padding: 10,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: rarityColor, marginBottom: 4 }}>
                            {inv.item.name}
                        </div>
                        <div style={{ fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                            {inv.item.rarity} {inv.item.type}
                        </div>

                        {/* Stats List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                            {[
                                { key: 'attackBonus', label: 'Attack' },
                                { key: 'defenseBonus', label: 'Defense' },
                                { key: 'hpBonus', label: 'HP' },
                                { key: 'xpMultiplier', label: 'XP Mult', isMult: true },
                                { key: 'goldMultiplier', label: 'Gold Mult', isMult: true },
                            ].map(stat => {
                                const value = inv.item[stat.key as keyof typeof inv.item];
                                if (!value || value === 0 || (stat.isMult && value === 1)) return null;
                                return (
                                    <div key={stat.key} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#888' }}>{stat.label}</span>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>
                                            {stat.isMult ? `x${value}` : `+${value}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {inv.item.description && (
                            <div style={{
                                fontSize: 9,
                                color: '#aaa',
                                fontStyle: 'italic',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                paddingTop: 6
                            }}>
                                "{inv.item.description}"
                            </div>
                        )}
                    </div>
                )}
                <div style={{ fontSize: 26 }}>{TYPE_ICONS[inv.item.type]}</div>
                <div style={{ fontSize: 9, textAlign: 'center', color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.3 }}>
                    {inv.item.name}
                </div>
                <div style={{ fontSize: 9, color: '#3db89a' }}>
                    {inv.item.attackBonus > 0 ? `+${inv.item.attackBonus} ATK`
                        : inv.item.defenseBonus > 0 ? `+${inv.item.defenseBonus} DEF`
                            : inv.item.hpBonus > 0 ? `+${inv.item.hpBonus} HP`
                                : inv.item.xpMultiplier > 1 ? `×${inv.item.xpMultiplier} XP` : ''}
                </div>
                <div style={{ width: '100%', height: 2, borderRadius: 1, background: rarityColor, marginTop: 2 }} />
                {inv.quantity > 1 && (
                    <div style={{ position: 'absolute', bottom: 3, right: 5, fontSize: 7, color: 'var(--color-gold)' }}>×{inv.quantity}</div>
                )}
            </div>
        )
    }
}