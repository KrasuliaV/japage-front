import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { characterApi } from '@/api/game'
import type { InventoryResponse } from '@/types'
import { TYPE_ICONS } from '@/constants/icons'

// ============================================================
// Inventory Modal
// Shows equipped items and inventory bag
// Allows equip/unequip of weapon, armor, accessory
// ============================================================

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

export function Inventory() {
  const showInventoryModal = useGameStore(s => s.showInventoryModal)
  const closeInventory = useGameStore(s => s.closeInventory)
  const character = useGameStore(s => s.character)
  const setCharacter = useGameStore(s => s.setCharacter)
  const [hoveredItem, setHoveredItem] = useState<InventoryResponse | null>(null)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const queryClient = useQueryClient()

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', character?.id],
    queryFn: () => characterApi.getInventory(character!.id),
    enabled: !!character?.id && showInventoryModal,
    staleTime: 30_000,
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
    if (equipMutation.isPending || unequipMutation.isPending) return
    if (item.isEquipped) {
      unequipMutation.mutate(item.item.id)
    } else {
      equipMutation.mutate(item.item.id)
    }
  }

  if (!showInventoryModal || !character) return null

  const equipped = {
    WEAPON: character.equippedWeapon,
    ARMOR: character.equippedArmor,
    ACCESSORY: character.equippedAccessory,
  }

  const bagItems = inventory ?? []

  function close() {
    closeInventory()
    const canvas = document.querySelector('canvas')
    canvas?.focus()
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 60 }}>
      <div
        className="game-panel-elevated"
        style={{
          width: '100%',
          maxWidth: 680,
          margin: '0 16px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
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
            color: 'var(--color-accent)',
            textShadow: '0 0 8px var(--color-accent-glow)',
            letterSpacing: 2,
          }}>
            🎒 INVENTORY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {feedback && (
              <div style={{
                fontSize: 9,
                color: feedback.ok ? 'var(--color-accent)' : 'var(--color-danger)',
                letterSpacing: 1,
              }}>
                {feedback.ok ? '✓' : '✗'} {feedback.msg}
              </div>
            )}
            <button
              onClick={close}
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
        </div>

        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          gap: 0,
        }}>

          {/* ── Left: Equipped + Stats ──────────────────── */}
          <div style={{
            width: 220,
            flexShrink: 0,
            borderRight: '2px solid var(--color-border)',
            padding: '16px 14px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {/* Character mini-summary */}
            <div style={{
              textAlign: 'center',
              paddingBottom: 12,
              borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{
                fontSize: 11,
                color: 'var(--color-accent)',
                marginBottom: 2,
              }}>
                {character.name}
              </div>
              <div style={{
                fontSize: 8,
                color: 'var(--color-text-muted)',
                letterSpacing: 1,
              }}>
                {character.characterClass.name} · Lv.{character.level}
              </div>
            </div>

            {/* Base stats */}
            <div>
              <div style={{
                fontSize: 8,
                color: 'var(--color-text-muted)',
                letterSpacing: 1,
                marginBottom: 8,
              }}>
                BASE STATS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: 'HP', val: `${character.currentHp}/${character.maxHp}`, color: 'var(--color-hp-high)' },
                  { label: 'ATK', val: character.attack, color: 'var(--color-danger)' },
                  { label: 'DEF', val: character.defense, color: 'var(--color-accent)' },
                  { label: 'MP', val: `${character.mana}/${character.maxMana}`, color: 'var(--color-mana)' },
                  { label: 'GOLD', val: character.gold, color: 'var(--color-gold)' },
                ].map(s => (
                  <div key={s.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                  }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                    <span style={{ color: s.color }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipped slots */}
            <div>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 22,
                color: 'var(--color-text-muted)',
                letterSpacing: 1,
                marginBottom: 8,
              }}>
                EQUIPPED
              </div>
              {(['WEAPON', 'ARMOR', 'ACCESSORY'] as const).map(slot => {
                const item = equipped[slot]
                return (
                  <div key={slot} style={{
                    padding: '8px 10px',
                    marginBottom: 6,
                    background: 'var(--color-bg-deep)',
                    border: `1px solid ${item ? 'var(--color-border-bright)' : 'var(--color-border)'}`,
                    borderRadius: 2,
                    minHeight: 44,
                  }}>
                    <div style={{
                      fontSize: 8,
                      color: 'var(--color-text-muted)',
                      marginBottom: 3,
                      letterSpacing: 1,
                    }}>
                      {TYPE_ICONS[slot]} {slot}
                    </div>
                    {item ? (
                      <>
                        <div style={{ fontSize: 9, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>
                          {item.attackBonus > 0 && `ATK+${item.attackBonus} `}
                          {item.defenseBonus > 0 && `DEF+${item.defenseBonus} `}
                          {item.hpBonus > 0 && `HP+${item.hpBonus}`}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 8, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        — empty —
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right: Bag ─────────────────────────────── */}
          <div style={{
            flex: 1,
            padding: '16px 14px',
            overflowY: 'auto',
          }}>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 8,
              color: 'var(--color-text-muted)',
              letterSpacing: 1,
              marginBottom: 12,
            }}>
              BAG ({bagItems.length} items)
            </div>

            {isLoading && (
              <div style={{
                textAlign: 'center',
                padding: '40px 0',
                color: 'var(--color-text-muted)',
                fontSize: 9,
              }}>
                Loading inventory...
              </div>
            )}

            {!isLoading && bagItems.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px 0',
                color: 'var(--color-text-muted)',
                fontSize: 9,
              }}>
                Your bag is empty.<br />
                <span style={{ fontSize: 8, opacity: 0.6 }}>Defeat enemies to earn items.</span>
              </div>
            )}

            {/* Item grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}>
              {bagItems.map(inv => {
                const item = inv.item
                const isHovered = hoveredItem?.item.id === item.id
                const isPending = equipMutation.isPending || unequipMutation.isPending

                return (
                  <div
                    key={inv.id}
                    onMouseEnter={() => setHoveredItem(inv)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      padding: '10px 12px',
                      background: inv.isEquipped
                        ? 'rgba(0,212,170,0.06)'
                        : 'var(--color-bg-deep)',
                      border: `2px solid ${inv.isEquipped
                        ? 'var(--color-accent)'
                        : isHovered
                          ? 'var(--color-border-bright)'
                          : 'var(--color-border)'
                        }`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: inv.isEquipped
                        ? '0 0 8px var(--color-accent-glow)'
                        : RARITY_GLOW[item.rarity] ?? 'none',
                      position: 'relative',
                    }}
                    onClick={() => handleEquipToggle(inv)}
                  >
                    {/* Equipped badge */}
                    {inv.isEquipped && (
                      <div style={{
                        position: 'absolute',
                        top: 4,
                        right: 6,
                        fontSize: 7,
                        color: 'var(--color-accent)',
                        letterSpacing: 1,
                      }}>
                        EQ
                      </div>
                    )}

                    {/* Type + name */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                    }}>
                      <span style={{ fontSize: 12 }}>{TYPE_ICONS[item.type]}</span>
                      <span style={{
                        fontSize: 9,
                        color: RARITY_COLORS[item.rarity],
                        fontWeight: 'bold',
                        textShadow: RARITY_GLOW[item.rarity] !== 'none'
                          ? RARITY_GLOW[item.rarity]
                          : undefined,
                      }}>
                        {item.name}
                      </span>
                    </div>

                    {/* Rarity */}
                    <div style={{
                      fontSize: 7,
                      color: RARITY_COLORS[item.rarity],
                      letterSpacing: 1,
                      marginBottom: 6,
                      opacity: 0.8,
                    }}>
                      {item.rarity}
                    </div>

                    {/* Stats */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2px 8px',
                      fontSize: 8,
                    }}>
                      {item.attackBonus > 0 && (
                        <span style={{ color: 'var(--color-danger)' }}>ATK +{item.attackBonus}</span>
                      )}
                      {item.defenseBonus > 0 && (
                        <span style={{ color: 'var(--color-accent)' }}>DEF +{item.defenseBonus}</span>
                      )}
                      {item.hpBonus > 0 && (
                        <span style={{ color: 'var(--color-hp-high)' }}>HP +{item.hpBonus}</span>
                      )}
                      {item.manaBonus > 0 && (
                        <span style={{ color: 'var(--color-mana)' }}>MP +{item.manaBonus}</span>
                      )}
                      {item.hintCharges > 0 && (
                        <span style={{ color: 'var(--color-gold)' }}>💡 ×{item.hintCharges}</span>
                      )}
                      {item.skipCharges > 0 && (
                        <span style={{ color: 'var(--color-gold)' }}>⏭ ×{item.skipCharges}</span>
                      )}
                    </div>

                    {/* Equip action hint */}
                    {isHovered && !isPending && (
                      <div style={{
                        marginTop: 6,
                        fontSize: 7,
                        color: inv.isEquipped
                          ? 'var(--color-danger)'
                          : 'var(--color-accent)',
                        letterSpacing: 1,
                        borderTop: '1px solid var(--color-border)',
                        paddingTop: 4,
                      }}>
                        {inv.isEquipped ? 'CLICK TO UNEQUIP' : 'CLICK TO EQUIP'}
                      </div>
                    )}

                    {/* Quantity badge */}
                    {inv.quantity > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 6,
                        fontSize: 7,
                        color: 'var(--color-text-muted)',
                      }}>
                        ×{inv.quantity}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div style={{
          padding: '10px 20px',
          borderTop: '2px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>
            Click an item to equip / unequip
          </div>
          <button
            className="game-btn"
            onClick={close}
            style={{ fontSize: 9, padding: '6px 16px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}