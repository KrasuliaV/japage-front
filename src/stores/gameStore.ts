import { create } from 'zustand'
import { GameInitializer } from '@/services/gameInitializer'
import type {
  CharacterResponse, PatternResponse, BattleResponse, NextQuestionResponse,
  SubmitAnswerResponse, BattleSummaryResponse, GameScreen, EnemyType, 
  QuestionResponse, ItemResponse, TargetCave
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
  coordinateX: number
  coordinateY: number

  // ── World state ──────────────────────────────────────────
  // Set by Kaplay when player enters a dungeon
  currentZone: string | null       // 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL'
  currentDungeonPatternId: string | null
  targetCave: TargetCave | null

  // ── Battle state ─────────────────────────────────────────
  activeBattle: BattleResponse | null
  currentQuestion: NextQuestionResponse | null
  lastAnswerResult: SubmitAnswerResponse | null
  battleSummary: BattleSummaryResponse | null
  enemyType: EnemyType | null
  isRestoredBattle: boolean

  // ── UI flags ─────────────────────────────────────────────
  showBattleModal: boolean
  showInventoryModal: boolean
  showMasteryModal: boolean
  showSummaryModal: boolean
  isGamePaused: boolean    // true when any React modal is open

  showChestModal: boolean
  showChestRewardModal: boolean
  isChestAnswered: boolean
  chestQuestion: QuestionResponse | null
  chestReward: ItemResponse | null

  // ── Actions ──────────────────────────────────────────────

  // Navigation
  setScreen: (screen: GameScreen) => void

  initializeGame: () => Promise<void>

  // Player/character
  setPlayerId: (id: string) => void
  setCharacter: (character: CharacterResponse | null) => void
  // updateCharacterHp: (hp: number) => void
  // updateCharacterGold: (gold: number) => void
  // updateCharacterExp: (exp: number, level: number, expToNext: number) => void

  // Battle flow — called by Kaplay when player touches enemy
  triggerBattle: (pattern: PatternResponse) => void
  setBattle: (battle: BattleResponse) => void
  setCurrentQuestion: (question: NextQuestionResponse) => void
  setLastAnswerResult: (result: SubmitAnswerResponse | null) => void
  setBattleSummary: (summary: BattleSummaryResponse) => void
  endBattle: () => void
  onBattleWon: (() => void) | null
  setEnemyType: (enemyType: EnemyType) => void
  restoreBattle: (battle: BattleResponse, question: NextQuestionResponse, patternName: string) => void

  // Chest flow — called by Kaplay when player touches chest
  triggerChestBattle: (pattern: PatternResponse) => void
  closeChestModal: () => void
  closeChestRewardModal: () => void
  onChestAnswered: (() => void) | null
  setChestQuestion: (question: QuestionResponse) => void
  setChestReward: (question: ItemResponse) => void

  // Zone
  enterZone: (zone: string) => void
  exitZone: () => void

  setTargetCave: (cave: TargetCave | null) => void

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
  targetCave: null as TargetCave | null,
  activeBattle: null,
  currentQuestion: null,
  lastAnswerResult: null,
  battleSummary: null,
  showBattleModal: false,
  showInventoryModal: false,
  showMasteryModal: false,
  showSummaryModal: false,
  isGamePaused: false,
  onBattleWon: null,
  enemyType: 'MINION' as EnemyType,
  showChestModal: false,
  showChestRewardModal: false,
  // chestReward: null as InventoryResponse | null,
  isChestAnswered: false,
  onChestAnswered: null,
  chestQuestion: null,
  chestReward: null as ItemResponse | null,
  coordinateX: 0,
  coordinateY: 0,
  isRestoredBattle: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  initializeGame: async () => GameInitializer.start(),

  setScreen: (screen) => set({ currentScreen: screen }),

  setPlayerId: (playerId) => set({ playerId }),

  setCharacter: (character) => set({ character }),

  // ── Battle flow ────────────────────────────────────────

  // Called by Kaplay when player walks into an enemy
  triggerBattle: () => {
    set({
      showBattleModal: true,
      isGamePaused: true,
    })
  },

  setBattle: (battle) => set({ activeBattle: battle }),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  setLastAnswerResult: (result) => {
    set({ lastAnswerResult: result })
  },

  setBattleSummary: (summary) => set({
    battleSummary: summary,
    showBattleModal: false,
    showSummaryModal: true,
  }),

  restoreBattle: (battle, question, patternName) => set({
    activeBattle: battle,
    currentQuestion: question,
    currentDungeonPatternId: patternName,  // BattleModal uses this to find the pattern
    isRestoredBattle: true,
    showBattleModal: true,
    isGamePaused: true,
  }),

  endBattle: () => {
    const { lastAnswerResult, activeBattle, character } = get()

    const finalHp = lastAnswerResult?.characterHpCurrent
      ?? activeBattle?.characterHpCurrent
      ?? character?.currentHp

    set({
      activeBattle: null,
      currentQuestion: null,
      lastAnswerResult: null,
      showBattleModal: false,
      isGamePaused: false,
      isRestoredBattle: false,
      character: character ? {
        ...character,
        currentHp: finalHp ?? character.currentHp
      } : null,
    })
  },

  setEnemyType: (enemyType) => set({
    enemyType: enemyType,
  }),

  // ── Zone ────────────────────────────────────────────────

  enterZone: (zone) => set({ currentZone: zone }),

  exitZone: () => set({ currentZone: null }),

  setTargetCave: (cave) => set({ targetCave: cave }),

  // ── Modals ──────────────────────────────────────────────

  openInventory: () => set({ showInventoryModal: true, isGamePaused: true }),
  closeInventory: () => set({ showInventoryModal: false, isGamePaused: false }),

  openMastery: () => set({ showMasteryModal: true, isGamePaused: true }),
  closeMastery: () => set({ showMasteryModal: false, isGamePaused: false }),

  closeSummary: () => {
    set({
      showSummaryModal: false,
      battleSummary: null,
      isGamePaused: false,
      activeBattle: null,
      currentQuestion: null,
      lastAnswerResult: null,
    })
  },

  // ── Chest flow ────────────────────────────────────────
  triggerChestBattle: () => set({
    showChestModal: true,
    isGamePaused: true
  }),

  closeChestModal: () => set({
    showChestModal: false,
    chestReward: null,
    isGamePaused: false
  }),

  setChestQuestion: (question) => set({ chestQuestion: question }),

  setChestReward: (reward) => set({
    chestReward: reward,
    showChestModal: false,
    showChestRewardModal: true,
  }),

  closeChestRewardModal: () => set({
    showChestRewardModal: false,
    chestReward: null,
    isGamePaused: false
  })
  ,
  // ── Kaplay pause/resume ─────────────────────────────────

  pauseGame: () => set({ isGamePaused: true }),
  resumeGame: () => set({ isGamePaused: false }),

  // ── Reset ────────────────────────────────────────────────

  reset: () => set(initialState),
}))
