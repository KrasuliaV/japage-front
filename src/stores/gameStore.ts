import { create } from 'zustand'
import type {
  CharacterResponse, PatternResponse,
  BattleResponse, NextQuestionResponse,
  SubmitAnswerResponse, BattleSummaryResponse,
  GameScreen,
} from '@/types'

// ============================================================
// Game Store
// The central bridge between Kaplay (canvas world) and
// React (UI overlay). Kaplay writes to this store,
// React reads from it and vice versa.
// ============================================================

interface GameState {
  // ── Navigation ──────────────────────────────────────────
  currentScreen: GameScreen

  // ── Player data ──────────────────────────────────────────
  playerId: string | null
  character: CharacterResponse | null

  // ── World state ──────────────────────────────────────────
  // Set by Kaplay when player enters a dungeon
  currentZone: string | null       // 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL'
  currentDungeonPatternId: string | null

  // ── Battle state ─────────────────────────────────────────
  activeBattle: BattleResponse | null
  currentQuestion: NextQuestionResponse | null
  lastAnswerResult: SubmitAnswerResponse | null
  battleSummary: BattleSummaryResponse | null

  // ── UI flags ─────────────────────────────────────────────
  showBattleModal: boolean
  showInventoryModal: boolean
  showMasteryModal: boolean
  showSummaryModal: boolean
  isGamePaused: boolean    // true when any React modal is open

  // ── Actions ──────────────────────────────────────────────

  // Navigation
  setScreen: (screen: GameScreen) => void

  // Player/character
  setPlayerId: (id: string) => void
  setCharacter: (character: CharacterResponse) => void
  updateCharacterHp: (hp: number) => void
  updateCharacterGold: (gold: number) => void
  updateCharacterExp: (exp: number, level: number, expToNext: number) => void

  // Battle flow — called by Kaplay when player touches enemy
  triggerBattle: (pattern: PatternResponse) => void
  setBattle: (battle: BattleResponse) => void
  setCurrentQuestion: (question: NextQuestionResponse) => void
  setLastAnswerResult: (result: SubmitAnswerResponse) => void
  setBattleSummary: (summary: BattleSummaryResponse) => void
  endBattle: () => void

  // Zone
  enterZone: (zone: string) => void
  exitZone: () => void

  // Modal toggles
  openInventory: () => void
  closeInventory: () => void
  openMastery: () => void
  closeMastery: () => void
  closeSummary: () => void

  // Pause/resume Kaplay game loop
  pauseGame: () => void
  resumeGame: () => void

  // Reset everything (on logout)
  reset: () => void
}

const initialState = {
  currentScreen: 'loading' as GameScreen,
  playerId: null,
  character: null,
  currentZone: null,
  currentDungeonPatternId: null,
  activeBattle: null,
  currentQuestion: null,
  lastAnswerResult: null,
  battleSummary: null,
  showBattleModal: false,
  showInventoryModal: false,
  showMasteryModal: false,
  showSummaryModal: false,
  isGamePaused: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setScreen: (screen) => set({ currentScreen: screen }),

  setPlayerId: (playerId) => set({ playerId }),

  setCharacter: (character) => set({ character }),

  updateCharacterHp: (hp) => {
    const { character } = get()
    if (!character) return
    set({ character: { ...character, currentHp: hp } })
  },

  updateCharacterGold: (gold) => {
    const { character } = get()
    if (!character) return
    set({ character: { ...character, gold } })
  },

  updateCharacterExp: (exp, level, expToNextLevel) => {
    const { character } = get()
    if (!character) return
    set({ character: { ...character, exp, level, expToNextLevel } })
  },

  // ── Battle flow ────────────────────────────────────────

  // Called by Kaplay when player walks into an enemy
  triggerBattle: (_pattern) => {
    set({
      showBattleModal: true,
      isGamePaused: true,
    })
  },

  setBattle: (battle) => set({ activeBattle: battle }),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  setLastAnswerResult: (result) => {
    set({ lastAnswerResult: result })
    // Update character HP from result
    get().updateCharacterHp(result.characterHpCurrent)
  },

  setBattleSummary: (summary) => set({
    battleSummary: summary,
    showBattleModal: false,
    showSummaryModal: true,
  }),

  endBattle: () => {
    set({
      activeBattle: null,
      currentQuestion: null,
      lastAnswerResult: null,
      showBattleModal: false,
      isGamePaused: false,
    })
  },

  // ── Zone ────────────────────────────────────────────────

  enterZone: (zone) => set({ currentZone: zone }),

  exitZone: () => set({ currentZone: null }),

  // ── Modals ──────────────────────────────────────────────

  openInventory: () => set({ showInventoryModal: true, isGamePaused: true }),
  closeInventory: () => set({ showInventoryModal: false, isGamePaused: false }),

  openMastery: () => set({ showMasteryModal: true, isGamePaused: true }),
  closeMastery: () => set({ showMasteryModal: false, isGamePaused: false }),

  closeSummary: () => set({
    showSummaryModal: false,
    battleSummary: null,
    isGamePaused: false,
  }),

  // ── Kaplay pause/resume ─────────────────────────────────

  pauseGame: () => set({ isGamePaused: true }),
  resumeGame: () => set({ isGamePaused: false }),

  // ── Reset ────────────────────────────────────────────────

  reset: () => set(initialState),
}))
