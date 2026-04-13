import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useGameStore } from '@/stores/gameStore'
import { characterApi } from '@/api/game'
import type { CharacterClassResponse, CharacterResponse } from '@/types'

interface CharacterCreateProps {
  onSuccess: (character: CharacterResponse) => void
}

export function CharacterCreate({ onSuccess }: CharacterCreateProps) {
  const [name, setName]                       = useState('')
  const [selectedClass, setSelectedClass]     = useState<CharacterClassResponse | null>(null)
  const [error, setError]                     = useState<string | null>(null)

  // playerId was set by App.tryLoadCharacter before navigating here
  const playerId = useGameStore(s => s.playerId)

  const { data: classes, isLoading } = useQuery({
    queryKey: ['character-classes'],
    queryFn: () => characterApi.getAllClasses(),
  })

  const createMutation = useMutation({
    mutationFn: () => {
      if (!playerId) throw new Error('Player ID not set')
      return characterApi.create(playerId, {
        name: name.trim(),
        classId: selectedClass!.id,
      })
    },
    onSuccess: (character) => {
      onSuccess(character)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      if (msg?.includes('already')) {
        setError('Character name already taken. Please choose another.')
      } else {
        setError(msg ?? 'Failed to create character. Please try again.')
      }
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim())    { setError('Please enter a character name.'); return }
    if (name.trim().length < 2) { setError('Name must be at least 2 characters.'); return }
    if (!selectedClass)  { setError('Please select a character class.'); return }
    if (!playerId)       { setError('Session error. Please log in again.'); return }
    createMutation.mutate()
  }

  const CLASS_ICONS: Record<string, string> = {
    'Code Wizard':     '🧙',
    'Pattern Knight':  '⚔️',
    'Refactor Rogue':  '🗡️',
  }

  const CLASS_FLAVOR: Record<string, string> = {
    'Code Wizard':     'Glass cannon. High mana & attack. ~8 wrong answers before defeat.',
    'Pattern Knight':  'Tank. High HP & defense. Beginner-friendly. ~25 wrong answers.',
    'Refactor Rogue':  'Balanced all-rounder. ~13 wrong answers before defeat.',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--color-bg-deep)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'radial-gradient(circle at 50% 30%, rgba(0,212,170,0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 560, padding: '0 16px', position: 'relative' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontSize: 18, color: 'var(--color-accent)',
            textShadow: '0 0 16px var(--color-accent-glow)',
            letterSpacing: 3, marginBottom: 8,
          }}>
            CREATE YOUR HERO
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: 1 }}>
            Choose your class and begin the adventure
          </div>
        </div>

        <div className="game-panel-elevated" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>

            {/* Character name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', fontSize: 8,
                color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6,
              }}>
                CHARACTER NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={50}
                placeholder="Enter your hero's name..."
                style={{
                  width: '100%', background: 'var(--color-bg-deep)',
                  border: '2px solid var(--color-border)',
                  color: 'var(--color-text-primary)', padding: '8px 12px',
                  fontSize: 11, fontFamily: 'inherit', borderRadius: 2, outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Class selection */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', fontSize: 8,
                color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 10,
              }}>
                CHOOSE CLASS
              </label>

              {isLoading && (
                <div style={{
                  fontSize: 9, color: 'var(--color-text-muted)',
                  textAlign: 'center', padding: 16,
                }}>
                  Loading classes...
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {classes?.map(cls => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    style={{
                      background: selectedClass?.id === cls.id
                        ? 'rgba(0,212,170,0.1)' : 'var(--color-bg-deep)',
                      border: `2px solid ${selectedClass?.id === cls.id
                        ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      borderRadius: 2, padding: '12px 16px',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: selectedClass?.id === cls.id
                        ? '0 0 12px var(--color-accent-glow)' : 'none',
                    }}
                  >
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    }}>
                      <div>
                        <div style={{
                          fontSize: 12, color: 'var(--color-text-primary)', marginBottom: 4,
                        }}>
                          {CLASS_ICONS[cls.name] ?? '⚔'} {cls.name}
                        </div>
                        <div style={{
                          fontSize: 8, color: 'var(--color-text-muted)', lineHeight: 1.5,
                        }}>
                          {CLASS_FLAVOR[cls.name] ?? cls.description}
                        </div>
                      </div>

                      {/* Base stats */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: '2px 12px', fontSize: 8,
                        color: 'var(--color-text-secondary)',
                        minWidth: 100, marginLeft: 12,
                      }}>
                        <span>HP: <span style={{ color: 'var(--color-hp-high)' }}>{cls.baseHp}</span></span>
                        <span>ATK: <span style={{ color: 'var(--color-danger)' }}>{cls.baseAttack}</span></span>
                        <span>DEF: <span style={{ color: 'var(--color-accent)' }}>{cls.baseDefense}</span></span>
                        <span>MP: <span style={{ color: 'var(--color-mana)' }}>{cls.baseMana}</span></span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                fontSize: 9, color: 'var(--color-danger)', marginBottom: 12,
                padding: '6px 10px', background: 'rgba(232,64,64,0.1)',
                border: '1px solid rgba(232,64,64,0.3)', borderRadius: 2,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="game-btn"
              disabled={createMutation.isPending || !selectedClass || !name.trim()}
              style={{ width: '100%', padding: '10px', fontSize: 10, letterSpacing: 2 }}
            >
              {createMutation.isPending ? 'FORGING HERO...' : 'BEGIN ADVENTURE →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
