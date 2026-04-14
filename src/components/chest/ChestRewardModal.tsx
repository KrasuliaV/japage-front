import { useGameStore } from '@/stores/gameStore'
import { characterApi } from '@/api/game'
import { TYPE_ICONS } from '@/constants/icons'

export function ChestRewardModal() {
  const { showChestRewardModal, chestReward, closeChestRewardModal, character } = useGameStore()

  if (!showChestRewardModal || !chestReward) return null

  const handleTake = async () => {
    await characterApi.addItemToInventory(character!.id, chestReward.id)
    closeChestRewardModal()
    const canvas = document.querySelector('canvas')
    canvas?.focus()
  }

  const handleThrow = () => {
    closeChestRewardModal()
    const canvas = document.querySelector('canvas')
    canvas?.focus()
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 2000 }}>
      <div className="game-panel-elevated" style={{ width: 300, textAlign: 'center', padding: 20 }}>
        <h2 style={{ color: 'var(--color-gold)', fontSize: 14 }}>CHEST OPENED!</h2>

        <div style={{ margin: '20px 0', border: '1px solid #444', padding: 15 }}>
          <div style={{ fontSize: 40 }}>{TYPE_ICONS[chestReward.type]}</div>
          <div style={{ color: 'var(--color-text-primary)', marginTop: 10 }}>{chestReward.name}</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{chestReward.rarity}</div>
          <div style={{
            fontSize: 10,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontStyle: 'italic'
          }}>
            "{chestReward.description}"
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="game-btn" onClick={handleTake} style={{ flex: 1 }}>TAKE</button>
          <button className="game-btn game-btn-danger" onClick={handleThrow} style={{ flex: 1 }}>THROW</button>
        </div>
      </div>
    </div>
  )
}