import type kaplay from 'kaplay'
import type { MinionObj } from '@/types'

type KCtx = ReturnType<typeof kaplay>

// 3. Move the AI logic into a pure processing function
export function processMinionAI(k: KCtx, m: MinionObj) {
  m.directionTimer += k.dt()

  // Fixed interval per wander step (don't call Math.random() every frame on the predicate)
  if (m.directionTimer >= m.nextDirectionChangeIn) {
    const directions = [
      k.vec2(1, 0), k.vec2(-1, 0),
      k.vec2(0, 1), k.vec2(0, -1),
    ]
    m.direction = directions[Math.floor(Math.random() * directions.length)]
    m.directionTimer = 0
    m.nextDirectionChangeIn = 2 + Math.random() * 2

    // Update animation
    const animMap: Record<string, string> = {
      '1,0': 'walk-right',
      '-1,0': 'walk-left',
      '0,1': 'walk-down',
      '0,-1': 'walk-up',
    }
    const key = `${m.direction.x},${m.direction.y}`
    try {
      // Only play if it's a different animation to avoid frame flickering
      const newAnim = animMap[key] ?? 'walk-down'
      if (m.curAnim() !== newAnim) {
        m.play(newAnim)
      }
    } catch { /* ignore */ }
  }

  // CRITICAL: Actually call the move function
  m.move(m.direction.scale(m.speed))
}
