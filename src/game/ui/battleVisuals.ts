import type kaplay from 'kaplay'
import { BATTLE_INTRO_DURATION } from '../constants';

type KCtx = ReturnType<typeof kaplay>
// ============================================================
// Battle intro dialog
// ============================================================

export function showBattleIntro(k: KCtx, text: string, onDone: () => void) {
  const cp = k.getCamPos();
  k.setCamPos(cp.x - 150, cp.y + 80)
  const dialogBg = k.add([
    k.rect(300, 60),
    k.pos(cp.x - 150, cp.y + 80),
    k.color(10, 14, 26),
    k.outline(2, k.Color.fromArray([0, 212, 170])),
    k.z(100),
    k.anchor('topleft'),
  ])

  const dialogText = k.add([
    k.text(text, { size: 18, font: "'Nunito', sans-serif", width: 280 }),
    k.pos(cp.x - 140, cp.y + 88),
    k.color(232, 234, 240),
    k.z(101),
  ])

//   k.wait(1.5, () => {
  k.wait(BATTLE_INTRO_DURATION / 1000, () => {
    k.destroy(dialogBg)
    k.destroy(dialogText)
    onDone()
  })
}