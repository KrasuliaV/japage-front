# CLAUDE.md — japage-front Project Intelligence

> This file is the authoritative knowledge base for AI-assisted development on this project.
> It describes architecture, conventions, workflows, and guardrails.
> Keep it updated whenever the architecture changes.

---

## 1. Project Overview

**japage-front** is the React/TypeScript frontend for **Code Realm** — a browser-based RPG game where players explore dungeons themed around software design patterns (Creational, Structural, Behavioral). The game uses a HTML5 canvas rendered by the [Kaplay](https://kaplayjs.com/) game engine, overlaid with a React UI for menus, battles, inventory, and HUD.

### Key Characteristics
- A hybrid app: a **game engine** (Kaplay on `<canvas>`) runs beneath a **React overlay** (modals, HUD, menus).
- State is the **bridge** between these two worlds — Kaplay writes to Zustand, React reads from it.
- Authentication is handled by a dedicated **auth_proxy** microservice (Spring Boot, port 8082).
- Game data (characters, battles, patterns) is served by a separate **game backend** (Spring Boot, port 8080).

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Build tool | Vite | ^8.0.4 |
| UI framework | React | ^19.2 |
| Language | TypeScript | ~6.0 |
| Styling | Tailwind CSS v4 | ^4.2 |
| Game engine | Kaplay | ^3001.0.19 |
| State management | Zustand | ^5.0 |
| Data fetching | TanStack React Query | ^5.98 |
| HTTP client | Axios | ^1.15 |
| Routing | React Router DOM | ^7.14 |
| CSS utilities | clsx + tailwind-merge | latest |
| Icons | lucide-react | ^1.8 |
| Linting | ESLint + typescript-eslint | ^9 / ^8 |

---

## 3. Repository Structure

```
japage-front/
├── src/
│   ├── api/
│   │   ├── auth.ts          # Login, signup, logout, token refresh, validate
│   │   ├── client.ts        # Axios instances (authApi, gameApi), tokenStore, interceptors
│   │   └── game.ts          # All game REST calls (player, character, battle, items, etc.)
│   ├── components/
│   │   ├── battle/
│   │   │   ├── BattleModal.tsx       # Full battle flow UI
│   │   │   └── BattleSummary.tsx     # Post-battle results screen
│   │   ├── chest/
│   │   │   ├── ChestModal.tsx        # Chest challenge (single-question)
│   │   │   └── ChestRewardModal.tsx  # Item reward picker
│   │   ├── hud/
│   │   │   └── HUD.tsx               # Always-visible HP/XP/gold overlay + buttons
│   │   ├── menu/
│   │   │   ├── CharacterModal.tsx    # Tabbed modal: GEAR | SKILLS | MASTERY
│   │   │   ├── Inventory.tsx         # Legacy inventory modal (being phased out)
│   │   │   ├── InventoryContent.tsx  # Active gear + bag grid
│   │   │   ├── MasteryContent.tsx    # Pattern mastery progress bars
│   │   │   └── SkillsContent.tsx     # Character skills list
│   │   ├── shared/
│   │   │   └── QuestionBlock.tsx     # Reusable multiple-choice question UI
│   │   └── GameCanvas.tsx            # Mounts Kaplay canvas + scene navigation
│   ├── constants/
│   │   └── icons.ts          # TYPE_ICONS map (WEAPON/ARMOR/ACCESSORY → emoji)
│   ├── game/
│   │   ├── entities/
│   │   │   ├── chest.ts      # Chest entity: collision → ChestModal
│   │   │   ├── enemies.ts    # Minion + Boss entities, AI movement, battle trigger
│   │   │   ├── map.ts        # Tile collision merging, wall frame logic, portal helper
│   │   │   ├── player.ts     # Player sprite, movement (WASD/arrows)
│   │   │   └── portal.ts     # Portal entity + zone transition on collision
│   │   ├── scenes/
│   │   │   ├── overworld.ts          # Overworld map (hub with 3 dungeon portals)
│   │   │   └── sceneInitializer.ts  # Registers dungeon-run scene (universal dungeon)
│   │   └── kaplay.ts         # Kaplay init, ALL asset loading, scene/tile constants
│   ├── pages/
│   │   ├── CharacterCreate.tsx  # Class selection + name → POST /character
│   │   ├── Login.tsx            # Email/password login form
│   │   └── Signup.tsx           # Account creation form
│   ├── services/
│   │   └── gameInitializer.ts   # Boot logic: player → character → progress restore
│   ├── stores/
│   │   ├── authStore.ts    # Auth state: token, userInfo, login/logout/restoreSession
│   │   └── gameStore.ts    # Game state: character, battle, modals, zones, pause
│   ├── types/
│   │   └── index.ts        # All TypeScript interfaces & enums (mirrors Java DTOs)
│   ├── App.tsx             # Root component: boot sequence + screen router
│   ├── index.css           # CSS custom properties (design tokens) + component classes
│   └── main.tsx            # React DOM entry point
├── .env.development        # Local env vars (API URLs, app header name)
├── vite.config.ts          # Vite config: aliases, proxy rules, plugins
├── tsconfig.app.json       # TypeScript config (strict mode on)
└── CLAUDE.md               # ← This file
```

---

## 4. Architecture: The Two-World Pattern

The most important architectural concept in this project is the **separation between the game world (Kaplay) and the UI world (React)**.

```
┌─────────────────────────────────────────────────────┐
│  React Layer (z-index: 10+)                         │
│  HUD, Modals, Menus — pointer-events on overlays   │
└───────────────────────┬─────────────────────────────┘
                        │  reads / writes
                        ▼
┌─────────────────────────────────────────────────────┐
│  Zustand Store (gameStore + authStore)              │
│  The ONLY bridge between Kaplay and React           │
└───────────────────────┬─────────────────────────────┘
                        │  reads / writes
                        ▼
┌─────────────────────────────────────────────────────┐
│  Kaplay Layer (z-index: 0, canvas)                  │
│  Player, enemies, map, collision, game loop         │
└─────────────────────────────────────────────────────┘
```

**Rules of this pattern:**
1. Kaplay entities NEVER import React components.
2. React components NEVER call Kaplay APIs directly.
3. All communication happens through `useGameStore` (Zustand).
4. `isGamePaused` in the store is the master pause signal — Kaplay checks this on every `onUpdate`.

---

## 5. State Management (`gameStore.ts`)

The game store is the backbone of the app. Key state groups:

### Navigation
| Field | Type | Purpose |
|---|---|---|
| `currentScreen` | `GameScreen` | Controls which top-level screen renders (`loading`, `login`, `overworld`, `dungeon`, etc.) |
| `categories` | `Category[]` | All dungeon zones + their patterns, loaded at boot |

### Player
| Field | Purpose |
|---|---|
| `playerId` | Firebase/backend player UUID |
| `character` | Full `CharacterResponse` (HP, stats, equipped items) |
| `coordinateX/Y` | Last known map position (for battle restoration) |

### Battle Flow
```
triggerBattle() → showBattleModal=true, isGamePaused=true
  └─ BattleModal: start → question loop → submitAnswer
       └─ setBattleSummary() → showSummaryModal=true, showBattleModal=false
            └─ closeSummary() → isGamePaused=false
```

### Chest Flow
```
triggerChestBattle() → showChestModal=true, isGamePaused=true
  └─ ChestModal: question → correct? → setChestReward()
       └─ showChestRewardModal=true → closeChestRewardModal() → isGamePaused=false
```

### Callbacks (Kaplay → React → Kaplay)
Two one-shot callbacks bridge the boundary:
- `onBattleWon: () => void` — set by enemy entity; called when React confirms victory → destroys the enemy sprite.
- `onChestAnswered: () => void` — set by chest entity; called after answer → destroys chest sprite.

---

## 6. Authentication Architecture

Two Axios instances are configured in `src/api/client.ts`:

### `authApi` (port 8082 — auth_proxy)
- Sends `Cookie` header automatically (`withCredentials: true`).
- Sends `App-name` header on every request (required by `HeaderFilter.java`).
- Login/refresh responses return an **access token as a plain string body**.

### `gameApi` (port 8080 — game backend)
- Attaches `Authorization: Bearer <token>` via request interceptor from `tokenStore`.
- On 401: attempts token refresh via `authApi`, then retries original request.
- Queues concurrent requests during refresh to prevent race conditions.

### `tokenStore`
- In-memory only (never `localStorage` or `sessionStorage`).
- Simple `get/set/clear` interface.

### Session Restoration Flow (on app load)
```
App.boot()
  └─ restoreSession()
       ├─ POST /api/token/refresh  (uses HttpOnly cookie)
       ├─ GET  /api/token/validate (returns userId + roles)
       └─ initializeGame()
            ├─ GET /api/v1/players/firebase
            ├─ GET /api/v1/players/:id/character
            ├─ GET /api/v1/category/:characterId
            └─ restoreProgress(characterProgressResponse)
                 ├─ INITIAL        → go('overworld')
                 ├─ ADVENTURING    → setTargetCave() → setScreen('dungeon')
                 ├─ BATTLE         → restoreBattle() + setTargetCave() → setScreen('dungeon')
                 └─ BATTLE_COMPLETE→ getBattleSummary() + setTargetCave() → setScreen('dungeon')
```

---

## 7. Dungeon System

### Scene Architecture
The **universal dungeon scene** (`dungeon-run`, registered in `sceneInitializer.ts`) accepts:
```
k.go("dungeon-run", categoryName: string, patternIndex: number, caveNumber: number)
```

It selects one of three map templates based on position:
- `DUNGEON_MAP_INITIAL` — first cave in a category (has overworld portal back)
- `DUNGEON_MAP_MIDDLE` — subsequent caves
- `DUNGEON_MAP_FINAL` — last cave (has overworld portal exit)

### Map Character Legend
| Char | Entity |
|---|---|
| `R` | Outer wall (solid) |
| `W` | Inner wall partition |
| `.` | Walkable floor |
| `E` | Cave exit trigger |
| `e` | Cave exit (final template side entrance) |
| `P` | Player spawn point |
| `B` | Boss spawn |
| `i` | Chest spawn |
| `O` | Overworld portal |
| `T`/`t` | Large/small tree (obstacle) |
| `G` | Crystal rock (obstacle) |
| `c` | Small crystal (obstacle) |

### Enemy AI
Minions use a simple **random walk** AI: change direction every 2+ seconds. All active minions are tracked in `minionRegistry` (module-level array). The `initEnemyManager(k)` call registers a single `k.onUpdate()` loop that processes all minions — this is a **Flyweight-inspired** approach to avoid per-entity update loops.

---

## 8. API Layer Conventions

All API calls live in `src/api/game.ts`, organized by domain:

```typescript
// Pattern: domain object + method
characterApi.getInventory(characterId)
battleApi.start(characterId, startBattleRequest)
patternApi.getMasteryByCharacter(characterId)
```

**Rules:**
- Every function returns the `.data` property directly (never the raw Axios response).
- Errors bubble up to React Query's `onError` callback.
- Never call `gameApi` or `authApi` directly from components — always go through the domain API objects.

---

## 9. Component Conventions

### Modal Pattern
All modals follow this structure:
1. Check visibility flag from store: `if (!showXModal) return null`
2. `modal-backdrop` div for overlay
3. `game-panel-elevated` div for content
4. On close: clear store flag + `canvas?.focus()` to restore keyboard input to game

```tsx
function MyModal() {
  const show = useGameStore(s => s.showMyModal)
  const close = useGameStore(s => s.closeMyModal)
  if (!show) return null
  function handleClose() {
    close()
    document.querySelector('canvas')?.focus()  // ALWAYS restore canvas focus
  }
  return (
    <div className="modal-backdrop" style={{ zIndex: 60 }}>
      <div className="game-panel-elevated">
        {/* content */}
        <button onClick={handleClose}>Close</button>
      </div>
    </div>
  )
}
```

### QuestionBlock (Shared Component)
`src/components/shared/QuestionBlock.tsx` is the single source of truth for rendering questions. Both `BattleModal` and `ChestModal` use it. Props:

```typescript
interface QuestionBlockProps {
  question: QuestionResponse
  selectedAnswerId: string | null
  lastResult: SubmitAnswerResponse | null  // null = question still active
  onSelect: (answerId: string) => void
  isPending: boolean
}
```

Answer button state is derived: if `lastResult` is present, answers lock and show correct/wrong highlighting.

---

## 10. Styling System

Styles live in **two places**:

### `src/index.css` — Design Tokens + Component Classes
CSS custom properties defined in `:root` under `@layer base`:

```css
--color-accent: #00d4aa;      /* teal glow — primary interactive color */
--color-danger: #e84040;      /* red — damage, wrong answers */
--color-gold: #f0c040;        /* gold — rewards, XP, items */
--color-mana: #6080f0;        /* blue/purple — mana */
--color-bg-deep: #0a0e1a;     /* darkest background */
--color-bg-panel: #151c2e;    /* panel background */
--color-text-primary: #e8eaf0;
--color-text-muted: #4a5270;
```

Reusable component classes (in `@layer components`):
- `.game-panel` — dark bordered panel
- `.game-panel-elevated` — elevated panel with rounded corners (modals)
- `.game-btn` — standard game button (hover → accent glow)
- `.game-btn-danger` — danger variant (hover → red glow)
- `.answer-btn`, `.answer-btn.correct`, `.answer-btn.wrong` — battle answer states
- `.modal-backdrop` — full-screen dim overlay with blur
- `.hp-bar`, `.xp-bar` — progress bar containers
- `.pixel-divider` — dotted horizontal rule

### Inline Styles
Components use inline `style` objects extensively for dynamic values (colors, dimensions, conditional rendering). This is intentional — it keeps game UI state visually synchronized without a CSS-in-JS overhead.

---

## 11. Environment Variables

Defined in `.env.development`:

```bash
VITE_AUTH_BASE_URL=http://localhost:8082   # auth_proxy base URL
VITE_AUTH_PATH=/api/auth                   # login/logout path prefix
VITE_TOKEN_PATH=/api/token                 # refresh/validate path prefix
VITE_API_BASE_URL=http://localhost:8080    # game backend base URL

VITE_APP_NAME=japage-front                 # sent as App-name header (MUST match backend allowedApps)
VITE_APP_HEADER=App-name                   # header name

VITE_TILE_SIZE=16                          # game tile size in pixels
VITE_PLAYER_SCALE=2
VITE_ENEMY_SCALE=2
VITE_GAME_WIDTH=800
VITE_GAME_HEIGHT=600
VITE_DEBUG_ENABLE=true
```

Vite dev proxy (in `vite.config.ts`) forwards `/api/*` paths to the respective backend, so CORS is not an issue in development.

---

## 12. Backend Security Context (auth_proxy)

Understanding the Java filters is essential for frontend auth debugging:

### Filter Chain Order (WebConfig.java)
```
OriginCheckFilter → HeaderFilter → AuthFilter → Spring Security
```

### OriginCheckFilter
- Only applies to `POST /api/token/refresh` and `POST /api/auth/logout`.
- Validates `Origin` or `Referer` header against `cors.allowed-origins`.

### HeaderFilter
- Applies to ALL `/api/**` paths.
- Rejects requests without a valid `App-name` header matching `securityProperties.allowedApps`.
- **Frontend implication:** Every Axios instance must send this header.

### AuthFilter
- `PUBLIC_API_PATH`: `/api/auth/login`, `/api/users` — no auth required.
- `/refresh` and `/logout`: require `token_session` cookie only.
- All other paths: require both `Authorization: Bearer <token>` AND `App-name` header.

---

## 13. Common Workflows

### Adding a New Modal
1. Add `showXModal: boolean` + `openX/closeX` actions to `gameStore.ts`.
2. Create `src/components/menu/XModal.tsx` following the modal pattern (section 9).
3. Mount it in `App.tsx` inside the main game `return` block.
4. Wrap in a `<div style={{ pointerEvents: 'auto' }}>` inside the HUD if triggered from HUD buttons.

### Adding a New API Endpoint
1. Add the TypeScript interface to `src/types/index.ts`.
2. Add the function to the appropriate domain object in `src/api/game.ts`.
3. Use it via React Query in components (`useQuery` / `useMutation`).

### Adding a New Dungeon Entity
1. Create entity function in `src/game/entities/`.
2. Add a new map character to the template strings in `sceneInitializer.ts`.
3. Handle the character in the `switch(ch)` block in `buildMap()`.
4. If it triggers a React modal, follow the Kaplay→Zustand→React bridge pattern.

### Adding a New Scene
1. Register it with `k.scene('scene-name', async (...args) => { ... })` in a `register*` function.
2. Call the register function from `GameCanvas.tsx` after Kaplay init.
3. Transition to it with `k.go('scene-name', ...args)`.

---

## 14. Known Technical Debt & Gotchas

### Legacy Dungeon Files
`src/game/scenes/creationalDungeon.ts` is the **old** per-zone dungeon system. It has been superseded by `src/services/sceneInitializer.ts` (`dungeon-run` scene). Do not add new features to the legacy file. The structural and behavioral dungeon scene files were removed but are still referenced as commented-out imports in `GameCanvas.tsx`.

### Duplicate Inventory Components
`src/components/menu/Inventory.tsx` and `src/components/menu/Mastery.tsx` are the **legacy** standalone modals. The active system uses `CharacterModal.tsx` with tab-based `InventoryContent`, `MasteryContent`, and `SkillsContent`. The legacy files can be deleted.

### Canvas Focus
After any modal closes, `document.querySelector('canvas')?.focus()` must be called. Forgetting this breaks WASD movement. Every `close*` handler in every modal must include this line.

### Single Kaplay Instance
`GameCanvas.tsx` guards Kaplay initialization with `if (kaplayInstance) return`. Kaplay must only be instantiated once per page lifecycle. React Strict Mode double-invocation in development can cause issues — the ref guard prevents duplicate initialization.

### `startAdventuring` requires `patternId`
`characterApi.startAdventuring()` takes an `AdventureRequest` that now requires `patternId`. The old `creationalDungeon.ts` called it without this field. Ensure all `startAdventuring` calls include a valid pattern UUID.

### `pointerEvents` on HUD
The HUD root div sets `pointerEvents: none` to pass clicks through to the canvas. Interactive elements (buttons, modals) inside the HUD must be wrapped in `<div style={{ pointerEvents: 'auto' }}>`. Missing this makes buttons unclickable.

---

## 15. Design Patterns in Use

| Pattern | Location | Purpose |
|---|---|---|
| **Observer** | `authStore.ts` → `window.addEventListener('auth:logout')` | Axios 401 interceptor dispatches a custom DOM event; the auth store listens and triggers logout |
| **Facade** | `src/api/game.ts` domain objects | Simplifies multi-endpoint interactions behind a clean domain API |
| **Bridge** | Zustand store between Kaplay and React | Decouples the abstraction (game logic) from the implementation (UI rendering) |
| **Flyweight** | `enemies.ts` — `minionRegistry` + `initEnemyManager` | Single update loop shared across all minion instances |
| **Command** | `onBattleWon` / `onChestAnswered` callbacks in store | Kaplay entities register a command; React executes it on confirmation |
| **Strategy** | `gameInitializer.ts` — `restoreProgress` | Different restoration strategies per `CharacterState` (INITIAL, ADVENTURING, BATTLE, BATTLE_COMPLETE) |
| **Template Method** | `buildMap()` in `sceneInitializer.ts` | Skeleton algorithm for dungeon building; `selectTemplate()` fills in the variable step |

---

## 16. Security Checklist

Before every PR, verify:
- [ ] No API keys, tokens, or credentials are hardcoded anywhere.
- [ ] `tokenStore` stores the access token in memory only (never `localStorage`).
- [ ] All new Axios calls go through `authApi` or `gameApi` (never raw `fetch`).
- [ ] New environment variables are added to `.env.development` AND documented here.
- [ ] CORS-sensitive endpoints (refresh, logout) send `Origin` header — this is automatic in browsers but must be verified in test environments.
- [ ] Any new public route in the backend is mirrored in `AuthFilter.PUBLIC_API_PATH`.

---

## 17. Development Commands

```bash
# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# Type check + build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

---

*Last updated: generated by `/init` analysis — keep this file in sync with architectural changes.*
