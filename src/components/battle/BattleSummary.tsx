import { useGameStore } from '@/stores/gameStore'

// ============================================================
// BattleSummary
// Shown after a battle ends — win or loss
// Shows XP/gold earned, mastery gained, question log
// ============================================================

export function BattleSummary() {
  const showSummaryModal = useGameStore(s => s.showSummaryModal)
  const battleSummary    = useGameStore(s => s.battleSummary)
  const closeSummary     = useGameStore(s => s.closeSummary)
  const updateCharacterExp  = useGameStore(s => s.updateCharacterExp)
  const updateCharacterGold = useGameStore(s => s.updateCharacterGold)
  const character        = useGameStore(s => s.character)

  if (!showSummaryModal || !battleSummary || !character) return null

  const won  = battleSummary.status === 'WON'
  const accuracy = battleSummary.questionsAnswered > 0
    ? Math.round((battleSummary.questionsCorrect / battleSummary.questionsAnswered) * 100)
    : 0

  function handleClose() {
    // Apply rewards/penalties to character in store
    if (won) {
      const newExp = character!.exp + battleSummary!.xpEarned
      updateCharacterExp(newExp, character!.level, character!.expToNextLevel)
      updateCharacterGold(character!.gold + battleSummary!.goldEarned)
    } else {
      updateCharacterGold(Math.max(0, character!.gold - battleSummary!.goldLost))
    }
    closeSummary()
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 60 }}>
      <div
        className="game-panel-elevated"
        style={{
          width: '100%',
          maxWidth: 580,
          margin: '0 16px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '2px solid var(--color-border)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 20,
            marginBottom: 8,
          }}>
            {won ? '⚔ VICTORY' : '💀 DEFEAT'}
          </div>
          <div style={{
            fontSize: 11,
            color: won ? 'var(--color-accent)' : 'var(--color-danger)',
            textShadow: won
              ? '0 0 8px var(--color-accent-glow)'
              : '0 0 8px var(--color-danger-glow)',
            letterSpacing: 2,
          }}>
            {battleSummary.pattern.name}
          </div>
        </div>

        <div style={{ padding: '16px 24px' }}>

          {/* ── Stats row ──────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}>
            <StatCard
              label="Accuracy"
              value={`${accuracy}%`}
              color={accuracy >= 70 ? 'var(--color-accent)' : 'var(--color-danger)'}
            />
            <StatCard
              label="Correct"
              value={`${battleSummary.questionsCorrect}/${battleSummary.questionsAnswered}`}
              color="var(--color-text-primary)"
            />
            <StatCard
              label={won ? 'Mastery +' : 'Mastery −'}
              value={won
                ? `+${battleSummary.questionsCorrect * 3}`
                : `-${battleSummary.masteryLost}`}
              color={won ? 'var(--color-accent)' : 'var(--color-danger)'}
            />
          </div>

          {/* ── Rewards / Penalties ─────────────────────────── */}
          <div
            className="game-panel"
            style={{ padding: '12px 16px', marginBottom: 16 }}
          >
            {won ? (
              <div style={{ display: 'flex', gap: 24 }}>
                <RewardItem
                  icon="✨"
                  label="XP Earned"
                  value={`+${battleSummary.xpEarned}`}
                  color="var(--color-mana)"
                />
                <RewardItem
                  icon="💰"
                  label="Gold Earned"
                  value={`+${battleSummary.goldEarned}`}
                  color="var(--color-gold)"
                />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 24 }}>
                <RewardItem
                  icon="💔"
                  label="Gold Lost"
                  value={`-${battleSummary.goldLost}`}
                  color="var(--color-danger)"
                />
                <RewardItem
                  icon="📉"
                  label="Mastery Lost"
                  value={`-${battleSummary.masteryLost}`}
                  color="var(--color-danger)"
                />
              </div>
            )}
          </div>

          {/* ── Question log ────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 9,
              color: 'var(--color-text-muted)',
              letterSpacing: 1,
              marginBottom: 8,
            }}>
              QUESTION LOG
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {battleSummary.questionLog.map((bq, i) => (
                <div
                  key={bq.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 10px',
                    background: 'var(--color-bg-deep)',
                    border: `1px solid ${bq.correct
                      ? 'rgba(0,212,170,0.3)'
                      : 'rgba(232,64,64,0.3)'}`,
                    borderRadius: 2,
                    fontSize: 9,
                  }}
                >
                  <span style={{
                    color: 'var(--color-text-muted)',
                    minWidth: 16,
                  }}>
                    {i + 1}.
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: 'var(--color-text-secondary)',
                      marginBottom: 2,
                      lineHeight: 1.4,
                    }}>
                      {bq.question.description.length > 80
                        ? bq.question.description.slice(0, 80) + '...'
                        : bq.question.description}
                    </div>
                    <div style={{
                      color: 'var(--color-text-muted)',
                      fontSize: 8,
                    }}>
                      Your answer: {bq.selectedAnswer?.description ?? '—'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12,
                    color: bq.correct
                      ? 'var(--color-accent)'
                      : 'var(--color-danger)',
                  }}>
                    {bq.correct ? '✓' : `✗ -${bq.damageTaken}HP`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Close button ────────────────────────────────── */}
          <button
            className="game-btn"
            onClick={handleClose}
            style={{ width: '100%' }}
          >
            {won ? 'Continue Adventure →' : 'Try Again →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Small sub-components ──────────────────────────────────────

function StatCard({
  label, value, color,
}: { label: string; value: string; color: string }) {
  return (
    <div
      className="game-panel"
      style={{ padding: '10px 8px', textAlign: 'center' }}
    >
      <div style={{ fontSize: 16, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  )
}

function RewardItem({
  icon, label, value, color,
}: { icon: string; label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: 'var(--color-text-muted)', marginBottom: 2 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 14, color }}>
        {value}
      </div>
    </div>
  )
}
