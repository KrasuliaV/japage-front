import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { CharacterModal } from '@/components/menu/CharacterModal'

// ============================================================
// HUD
// Always-visible game overlay — HP, XP, gold, level
// Positioned top-left over the Kaplay canvas
// ============================================================

export function HUD() {
  const character = useGameStore(s => s.character)
  const currentZone = useGameStore(s => s.currentZone)
  const openInventory = useGameStore(s => s.openInventory)
  // const openMastery = useGameStore(s => s.openMastery)
  const logout = useAuthStore(s => s.logout)
  const currentScreen = useGameStore(s => s.currentScreen)

  // Only show on game screens
  if (!['overworld', 'dungeon'].includes(currentScreen)) return null
  if (!character) return null

  const hpPercent = Math.max(0, (character.currentHp / character.maxHp) * 100)
  const xpPercent = Math.max(0, (character.exp / character.expToNextLevel) * 100)

  const hpColor =
    hpPercent > 60 ? 'var(--color-hp-high)' :
      hpPercent > 30 ? 'var(--color-hp-mid)' :
        'var(--color-hp-low)'

  const zoneLabels: Record<string, string> = {
    OVERWORLD: '🗺 Overworld',
    CREATIONAL: '🌿 Creational Forest',
    STRUCTURAL: '🏰 Structural Castle',
    BEHAVIORAL: '☠ Behavioral Dungeon',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',    // pass clicks through to canvas by default
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <CharacterModal />
      </div>

      {/* ── Top-left: Character stats ─────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          pointerEvents: 'auto',
        }}
        className="game-panel"
      >
        <div style={{ padding: '8px 12px', minWidth: 180 }}>

          {/* Name + Level */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 18,
              color: 'var(--color-accent)',
              textShadow: '0 0 6px var(--color-accent-glow)',
              letterSpacing: 1,
            }}>
              {character.name}
            </span>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 10,
              color: 'var(--color-gold)',
              marginLeft: 8,
            }}>
              Lv.{character.level}
            </span>
          </div>

          {/* HP bar */}
          <div style={{ marginBottom: 4 }}>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--color-text-secondary)',
              marginBottom: 2,
            }}>
              <span>HP</span>
              <span style={{ color: hpColor }}>
                {character.currentHp}/{character.maxHp}
              </span>
            </div>
            <div className="hp-bar">
              <div
                className="hp-bar-fill"
                style={{ width: `${hpPercent}%`, background: hpColor }}
              />
            </div>
          </div>

          {/* XP bar */}
          <div style={{ marginBottom: 6 }}>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--color-text-secondary)',
              marginBottom: 2,
            }}>
              <span>XP</span>
              <span>{character.exp}/{character.expToNextLevel}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>

          {/* Gold */}
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 12,
            color: 'var(--color-gold)',
            textShadow: '0 0 6px var(--color-gold-glow)',
          }}>
            💰 {character.gold.toLocaleString()} gold
          </div>
        </div>
      </div>

      {/* ── Top-center: Zone name ─────────────────────────── */}
      {currentZone && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          <div className="game-panel" style={{ padding: '4px 12px' }}>
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 14,
                color: 'var(--color-text-secondary)'
              }}>
              {zoneLabels[currentZone] || currentZone}
            </span>
          </div>
        </div>
      )}

      {/* ── Top-right: Action buttons ─────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        pointerEvents: 'auto',
      }}>
        <button className="game-btn" onClick={openInventory} style={{ fontSize: 9 }}>
          👤 CHARACTER
          {/* 🎒 Inventory */}
        </button>
        {/* <button className="game-btn" onClick={openMastery} style={{ fontSize: 9 }}>
          📖 Mastery
        </button> */}
        <button
          className="game-btn game-btn-danger"
          onClick={logout}
          style={{ fontSize: 9 }}
        >
          ⚡ Logout
        </button>
      </div>

      {/* ── Bottom-left: Controls hint ────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        fontSize: 8,
        color: 'var(--color-text-muted)',
      }}>
        WASD / ↑↓←→ to move
        {currentZone && currentZone !== 'OVERWORLD' && ' · ESC to exit dungeon'}
      </div>
    </div>
  )
}
