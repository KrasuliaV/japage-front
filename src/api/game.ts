import { gameApi } from './client'
import type {
  PlayerResponse, CreatePlayerRequest, CharacterResponse, CharacterClassResponse,
  CreateCharacterRequest, CharacterSkillResponse, InventoryResponse,
  PatternResponse, PatternMasteryResponse, BattleResponse, StartBattleRequest,
  NextQuestionResponse, SubmitAnswerRequest, SubmitAnswerResponse,
  BattleSummaryResponse, QuestResponse, CharacterQuestResponse, PatternCategory,
  QuestStatus, SubmitQuestionResponse, QuestionResponse, ItemResponse,
  AdventureRequest,
} from '@/types'

// ============================================================
// Players
// ============================================================

export const playerApi = {
  create: (data: CreatePlayerRequest) =>
    gameApi.post<PlayerResponse>('/api/v1/players', data).then(r => r.data),

  getById: (id: string) =>
    gameApi.get<PlayerResponse>(`/api/v1/players/${id}`).then(r => r.data),

  getByFirebaseUid: () =>
    gameApi.get<PlayerResponse>(`/api/v1/players/firebase`).then(r => r.data),

  existsByFirebaseUid: () =>
    gameApi.get<boolean>(`/api/v1/players/firebase/exists`).then(r => r.data),
}

// ============================================================
// Characters
// ============================================================

export const characterApi = {
  getAllClasses: () =>
    gameApi.get<CharacterClassResponse[]>('/api/v1/classes').then(r => r.data),

  create: (playerId: string, data: CreateCharacterRequest) =>
    gameApi.post<CharacterResponse>(`/api/v1/players/${playerId}/character`, data)
      .then(r => r.data),

  getByPlayerId: (playerId: string) =>
    gameApi.get<CharacterResponse>(`/api/v1/players/${playerId}/character`)
      .then(r => r.data),

  getById: (characterId: string) =>
    gameApi.get<CharacterResponse>(`/api/v1/characters/${characterId}`)
      .then(r => r.data),

  getInventory: (characterId: string) =>
    gameApi.get<InventoryResponse[]>(`/api/v1/characters/${characterId}/inventory`)
      .then(r => r.data),

  getSkills: (characterId: string) =>
    gameApi.get<CharacterSkillResponse[]>(`/api/v1/characters/${characterId}/skills`)
      .then(r => r.data),

  equipItem: (characterId: string, data: { itemId: string }) =>
    gameApi.post<CharacterResponse>(`/api/v1/characters/${characterId}/equip`, data)
      .then(r => r.data),

  unequipItem: (characterId: string, itemId: string) =>
    gameApi.delete<CharacterResponse>(`/api/v1/characters/${characterId}/equip/${itemId}`)
      .then(r => r.data),
  addItemToInventory: (characterId: string, itemId: string) =>
    gameApi.post<void>(`/api/v1/inventory/${characterId}/${itemId}`)
      .then(() => { }),
  removeItemFromInventory: (characterId: string, itemId: string) =>
    gameApi.delete<InventoryResponse>(`/api/v1/inventory/${characterId}/${itemId}`)
      .then(r => r.data),
  startAdventuring: (characterId: string, data: AdventureRequest) =>
    gameApi.post<void>(`/api/v1/characters/${characterId}/adventure`, data)
      .then(() => { }),
  backToSafe: (characterId: string) =>
    gameApi.post<void>(`/api/v1/characters/${characterId}/safe`)
      .then(() => { }),
}

// ============================================================
// Patterns
// ============================================================

export const patternApi = {
  getAll: (category?: PatternCategory) =>
    gameApi.get<PatternResponse[]>('/api/v1/patterns', {
      params: category ? { category } : {}
    }).then(r => r.data),

  getById: (id: string) =>
    gameApi.get<PatternResponse>(`/api/v1/patterns/${id}`).then(r => r.data),

  getMasteryByCharacter: (characterId: string) =>
    gameApi.get<PatternMasteryResponse[]>(`/api/v1/patterns/mastery/${characterId}`)
      .then(r => r.data),

  getMasteryByCharacterAndPattern: (characterId: string, patternId: string) =>
    gameApi.get<PatternMasteryResponse>(
      `/api/v1/patterns/${patternId}/mastery/${characterId}`
    ).then(r => r.data),
}

// ============================================================
// Battles
// ============================================================

export const battleApi = {
  start: (characterId: string, data: StartBattleRequest) =>
    gameApi.post<BattleResponse>(
      `/api/v1/characters/${characterId}/battles`, data
    ).then(r => r.data),

  getActiveBattle: (characterId: string) =>
    gameApi.get<BattleResponse>(
      `/api/v1/characters/${characterId}/battles/active`
    ).then(r => r.data),

  getHistory: (characterId: string) =>
    gameApi.get<BattleResponse[]>(
      `/api/v1/characters/${characterId}/battles`
    ).then(r => r.data),

  getNextQuestion: (characterId: string, battleId: string) =>
    gameApi.get<NextQuestionResponse>(
      `/api/v1/characters/${characterId}/battles/${battleId}/question`
    ).then(r => r.data),

  submitAnswer: (characterId: string, battleId: string, data: SubmitAnswerRequest) =>
    gameApi.post<SubmitAnswerResponse>(
      `/api/v1/characters/${characterId}/battles/${battleId}/answer`, data
    ).then(r => r.data),

  abandon: (characterId: string, battleId: string) =>
    gameApi.post<BattleResponse>(
      `/api/v1/characters/${characterId}/battles/${battleId}/abandon`
    ).then(r => r.data),

  getSummary: (characterId: string, battleId: string) =>
    gameApi.get<BattleSummaryResponse>(
      `/api/v1/characters/${characterId}/battles/${battleId}/summary`
    ).then(r => r.data),
}

// ============================================================
// Quests
// ============================================================

export const questApi = {
  getAll: () =>
    gameApi.get<QuestResponse[]>('/api/v1/quests').then(r => r.data),

  getByCharacter: (characterId: string, status?: QuestStatus) =>
    gameApi.get<CharacterQuestResponse[]>(
      `/api/v1/characters/${characterId}/quests`,
      { params: status ? { status } : {} }
    ).then(r => r.data),

  accept: (characterId: string, questId: string) =>
    gameApi.post<CharacterQuestResponse>(
      `/api/v1/characters/${characterId}/quests/${questId}/accept`
    ).then(r => r.data),
}

export const questionApi = {
  getQuestion: (category: string, subCategory?: string, limit: number = 1) =>
    gameApi.get<QuestResponse[]>(
      '/api/v1/question',
      {
        params: {
          category,
          ...(subCategory ? { subCategory } : {}),
          limit
        }
      }
    ).then(r => {
      const list = r.data as unknown as QuestionResponse[]
      if (!list || list.length === 0) throw new Error('No question returned')
      return list[0]
    }),

  // submitAnswer: (data: SubmitAnswerRequest) =>
  //   gameApi.post<SubmitQuestionResponse>(
  //     `/api/v1/question/answer`, data
  //   ).then(r => r.data),
  submitAnswer: (questionId: string, answerId: string) =>
    gameApi.post<SubmitQuestionResponse>('/api/v1/question/answer', {
      questionId,
      answerId,
    }).then(r => r.data),
}

export const itemApi = {
  getRandom: () =>
    gameApi.get<ItemResponse>('/api/v1/item/random').then(r => r.data),
}

