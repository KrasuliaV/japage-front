// ============================================================
// Enums — mirror Java enums exactly
// ============================================================

export type PatternCategory = 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL'
export type SkillCategory   = 'CREATIONAL' | 'STRUCTURAL' | 'BEHAVIORAL' | 'GENERAL'
export type QuestionType    = 'MULTIPLE_CHOICE' | 'PATTERN_RECOGNITION'
export type AnswerType      = 'CORRECT' | 'WRONG'
export type ItemType        = 'WEAPON' | 'ARMOR' | 'ACCESSORY'
export type ItemRarity      = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
export type BattleStatus    = 'IN_PROGRESS' | 'WON' | 'LOST' | 'ABANDONED'
export type QuestStatus     = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

// ============================================================
// Auth — from auth_proxy service
// ============================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface UserInfo {
  userId: string
  userRoles: string[]
}

// ============================================================
// Player
// ============================================================

export interface CreatePlayerRequest {
  username: string
  email: string
}

export interface PlayerResponse {
  id: string
  username: string
  email: string
  createdAt: string
}

// ============================================================
// Character Class
// ============================================================

export interface CharacterClassResponse {
  id: string
  name: string
  description: string
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseMana: number
}

// ============================================================
// Character
// ============================================================

export interface CreateCharacterRequest {
  name: string
  classId: string
}

export interface EquippedItemResponse {
  id: string
  name: string
  type: ItemType
  rarity: ItemRarity
  attackBonus: number
  defenseBonus: number
  hpBonus: number
  manaBonus: number
  hintCharges: number
  skipCharges: number
}

export interface CharacterResponse {
  id: string
  playerId: string
  name: string
  characterClass: CharacterClassResponse
  level: number
  exp: number
  expToNextLevel: number
  gold: number
  currentHp: number
  maxHp: number
  attack: number
  defense: number
  mana: number
  maxMana: number
  equippedWeapon:    EquippedItemResponse | null
  equippedArmor:     EquippedItemResponse | null
  equippedAccessory: EquippedItemResponse | null
  createdAt: string
}

// ============================================================
// Skills
// ============================================================

export interface SkillResponse {
  id: string
  name: string
  description: string
  category: SkillCategory
}

export interface CharacterSkillResponse {
  id: string
  skill: SkillResponse
  skillLevel: number
  exp: number
}

// ============================================================
// Patterns
// ============================================================

export interface PatternResponse {
  id: string
  name: string
  category: PatternCategory
  difficulty: number
  description: string
  refactoringGuruUrl: string
}

export interface PatternMasteryResponse {
  id: string
  pattern: PatternResponse
  masteryLevel: number
  timesAttempted: number
  timesCorrect: number
  lastPracticed: string | null
}

// ============================================================
// Questions & Answers
// ============================================================

export interface AnswerResponse {
  id: string
  description: string
}

export interface QuestionResponse {
  id: string
  description: string
  type: QuestionType
  difficulty: number
  answers: AnswerResponse[]
}

// ============================================================
// Battle
// ============================================================

export interface StartBattleRequest {
  patternId: string
  questionsToWin: number
}

export interface SubmitAnswerRequest {
  questionId: string
  answerId: string
}

export interface BattleResponse {
  id: string
  characterId: string
  pattern: PatternResponse
  status: BattleStatus
  characterHpStart: number
  characterHpCurrent: number
  xpEarned: number
  goldEarned: number
  goldLost: number
  masteryLost: number
  questionsAnswered: number
  questionsCorrect: number
  startedAt: string
  endedAt: string | null
}

export interface NextQuestionResponse {
  battleId: string
  questionNumber: number
  totalQuestions: number
  characterHpCurrent: number
  characterHpMax: number
  question: QuestionResponse
}

export interface SubmitAnswerResponse {
  battleId: string
  questionId: string
  correct: boolean
  correctAnswerId: string
  correctAnswerDescription: string
  damageTaken: number
  characterHpCurrent: number
  questionsAnswered: number
  questionsCorrect: number
  battleEnded: boolean
  battleResult: BattleResponse | null
}

export interface BattleQuestionResponse {
  id: string
  question: QuestionResponse
  selectedAnswer: AnswerResponse
  correct: boolean
  damageTaken: number
  answeredAt: string
}

export interface BattleSummaryResponse {
  battleId: string
  pattern: PatternResponse
  status: BattleStatus
  characterHpStart: number
  characterHpEnd: number
  questionsAnswered: number
  questionsCorrect: number
  xpEarned: number
  goldEarned: number
  goldLost: number
  masteryLost: number
  questionLog: BattleQuestionResponse[]
  startedAt: string
  endedAt: string
}

// ============================================================
// Items & Inventory
// ============================================================

export interface ItemResponse {
  id: string
  name: string
  description: string
  type: ItemType
  rarity: ItemRarity
  attackBonus: number
  defenseBonus: number
  hpBonus: number
  manaBonus: number
  hintCharges: number
  skipCharges: number
  xpMultiplier: number
  goldMultiplier: number
  price: number
}

export interface InventoryResponse {
  id: string
  item: ItemResponse
  quantity: number
  isEquipped: boolean
  acquiredAt: string
}

// ============================================================
// Quests
// ============================================================

export interface QuestResponse {
  id: string
  name: string
  description: string
  pattern: PatternResponse | null
  requiredBattles: number
  requiredCorrectAnswers: number
  rewardXp: number
  rewardGold: number
  rewardItem: ItemResponse | null
}

export interface CharacterQuestResponse {
  id: string
  quest: QuestResponse
  status: QuestStatus
  startedAt: string | null
  completedAt: string | null
}

// ============================================================
// Error
// ============================================================

export interface FieldError {
  field: string
  message: string
}

export interface ErrorResponse {
  status: number
  error: string
  message: string
  path: string
  timestamp: string
  fieldErrors: FieldError[]
}

// ============================================================
// Game state types — used in Zustand + Kaplay bridge
// ============================================================

export interface GameZone {
  id: string
  name: string
  category: PatternCategory
  tileset: string
  enemySprite: string
  x: number
  y: number
  width: number
  height: number
}

export interface EnemyDefinition {
  patternId: string
  patternName: string
  sprite: string
  x: number
  y: number
  zone: PatternCategory
}

export type GameScreen =
  | 'loading'
  | 'login'
  | 'signup'
  | 'character-select'
  | 'character-create'
  | 'overworld'
  | 'dungeon'
  | 'battle'
  | 'inventory'
  | 'mastery'
  | 'summary'
