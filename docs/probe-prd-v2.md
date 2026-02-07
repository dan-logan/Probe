# Probe Online — Product Requirements Document (v2)

## 1. Overview

A client-side-only React implementation of the classic Parker Brothers word-deduction board game Probe (1964). Single player vs 3 AI opponents. Hosted as a static site on GitHub Pages — no server, no backend, no accounts.

---

## 2. Game Rules

### 2.1 Setup
- 4 players: 1 human, 3 AI
- Each player secretly chooses a word (4–12 letters). No proper nouns, abbreviations, or hyphens.
- Each player must reveal exactly one letter of their choice as a "free letter."
- Turn order is randomized at game start.

### 2.2 Turn Actions
On your turn, do **one** of:

1. **Ask a Letter** — Pick a letter (A–Z) and direct it at one opponent. If the letter exists in their word, **all** instances are revealed and you get another turn. If not, your turn ends.

2. **Guess a Word** — Attempt to guess an opponent's full word. If correct, that opponent is eliminated and you get another turn. If wrong, you must reveal one of your own unrevealed letters as a penalty (you choose which).

### 2.3 Winning
Last player with an unrevealed word wins.

### 2.4 Elimination
- A player is eliminated when their full word is guessed by someone else.
- A player is **not** eliminated just because all their letters happen to be revealed through asks — someone still has to formally guess the word.

---

## 3. Constraints

| Constraint | Detail |
|---|---|
| No backend | All logic runs in the browser |
| Static hosting | GitHub Pages (or any static host) |
| No accounts | No login, no persistence beyond localStorage |
| Single player only | 1 human vs 3 AI opponents |
| Bundled dictionary | Word list shipped with the app (~60KB gzipped for a 50K-word list) |

---

## 4. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18, TypeScript |
| Styling | Tailwind CSS |
| State management | useReducer + Context (single store, reducer pattern) |
| Build | Vite |
| Deployment | `gh-pages` npm package → GitHub Pages |
| Dictionary | Static JSON or text file, imported at build time |
| Testing | Vitest + React Testing Library |

No external runtime dependencies beyond React and Tailwind.

---

## 5. Game State

```typescript
type GamePhase = 'word_selection' | 'playing' | 'finished';

interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  log: LogEntry[];
  winner: string | null;
}

interface Player {
  id: string;                  // 'human' | 'ai-1' | 'ai-2' | 'ai-3'
  name: string;
  word: string;
  revealedMask: boolean[];     // per-letter: true = visible to everyone
  freeLetterIndex: number;
  eliminated: boolean;
  isAI: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  // AI internal state (not displayed)
  aiState?: AIState;
}

interface AIState {
  // Per-opponent tracking
  letterTracking: Record<string, LetterTrack>;  // keyed by opponent player id
}

interface LetterTrack {
  askedLetters: Set<string>;        // letters already tried against this opponent
  candidateWords: string[];         // remaining possible words (hard AI only)
}

interface LogEntry {
  turn: number;
  actorId: string;
  action: 'ask_letter' | 'guess_word';
  targetId: string;
  letter?: string;
  guessedWord?: string;
  result: 'hit' | 'miss' | 'correct_guess' | 'wrong_guess';
  revealedPositions?: number[];     // which slots flipped on a hit
  penaltyPosition?: number;         // which slot the guesser revealed on a wrong guess
}
```

---

## 6. Screens & Components

### 6.1 Screen Flow

```
Title Screen → Word Selection → Game Board → Results
     ↑                                          │
     └──────────── Play Again ←─────────────────┘
```

### 6.2 Component Tree

```
<App>
├── <TitleScreen />
│   ├── <DifficultySelector />       // Easy / Medium / Hard
│   └── <StartButton />
│
├── <WordSelectionScreen />
│   ├── <WordInput />                // text input + validation feedback
│   ├── <FreeLetterPicker />         // click a letter in your word to reveal it
│   ├── <WordLengthIndicator />
│   └── <ConfirmButton />
│
├── <GameBoard />
│   ├── <TurnBanner />               // "Your turn" or "AI-2 is thinking..."
│   ├── <OpponentRacks>
│   │   └── <WordRack />             // ×3, one per AI
│   │       ├── <LetterSlot />       // ×word length
│   │       └── <PlayerLabel />      // name + eliminated badge
│   ├── <MyRack />
│   │   └── <LetterSlot />
│   ├── <ActionPanel />
│   │   ├── <ModeToggle />           // "Ask Letter" vs "Guess Word"
│   │   ├── <TargetSelector />       // pick which AI to target
│   │   ├── <LetterKeyboard />       // A–Z grid, tracks used letters per target
│   │   ├── <GuessInput />           // text field for word guess mode
│   │   └── <SubmitButton />
│   ├── <UsedLettersPanel />         // per-opponent letter tracking summary
│   ├── <GameLog />
│   │   └── <LogEntry />
│   └── <PenaltyPicker />           // appears when you guess wrong — pick your letter to reveal
│
├── <ResultsScreen />
│   ├── <Outcome />                  // "You won!" / "AI-2 won!"
│   ├── <WordReveal />               // shows all 4 words
│   ├── <GameStats />                // turns taken, letters revealed
│   └── <PlayAgainButton />
│
├── <HelpButton />                   // fixed position, visible on every screen
└── <RulesModal />                   // triggered by HelpButton
```

### 6.3 Key Component Behaviors

**`<WordInput />`**
- Text field, uppercase normalized
- Validates on every keystroke against bundled dictionary
- Shows inline feedback: "Valid word", "Not in dictionary", "Too short"
- 4–12 character limit enforced

**`<FreeLetterPicker />`**
- Renders the entered word as clickable letter tiles
- Player clicks one tile to designate it as the free letter
- Selected tile highlights. Must select exactly one before confirming.

**`<WordRack />`** (opponent)
- Row of `<LetterSlot>` components matching the opponent's word length
- States per slot: `hidden` (shows "?"), `revealed` (shows letter), `free` (shows letter, distinct style)
- Word length is visible (this is per classic rules — you can see rack size)
- Eliminated racks: grayed out, all letters revealed, strikethrough on name

**`<LetterKeyboard />`**
- 26 keys in QWERTY layout
- Per-target coloring: when you select AI-1 as target, the keyboard reflects which letters you've already asked AI-1
  - Gray: already asked, miss
  - Green: already asked, hit
  - Default: not yet asked
- Switching targets updates the keyboard colors
- Physical keyboard input works too

**`<TargetSelector />`**
- Three clickable opponent indicators (name + avatar/icon)
- Eliminated opponents are not selectable
- Can also select target by clicking an opponent's rack

**`<GameLog />`**
- Scrollable reverse-chronological list
- Entries like: `"You asked AI-2 for 'E' → Hit! (positions 2, 5)"`
- AI moves logged the same way: `"AI-1 asked you for 'S' → Miss"`
- Auto-scrolls to latest entry

**`<PenaltyPicker />`**
- Modal overlay that appears after an incorrect word guess
- Shows your word with unrevealed letters highlighted as selectable
- You pick one to reveal. Cannot dismiss without picking.

**`<HelpButton />`**
- Fixed-position "?" icon button, bottom-right corner on desktop, top-right on mobile
- Visible on every screen (title, word selection, game board, results)
- Opens `<RulesModal />` on click
- Does not interrupt gameplay — AI turns pause while modal is open, resume on close

**`<RulesModal />`**
- Full-screen overlay with scrollable content
- Sections: Objective, Setup (free letter), Turn Actions (ask letter vs guess word), Penalties, Winning, Tips
- Uses simple language and visual examples (e.g., a mini word rack diagram showing a reveal)
- Close via X button, Escape key, or clicking outside
- Focus trapped inside modal while open

---

## 7. AI Behavior

### 7.1 Overview
AI turns execute sequentially with a short delay (800–1200ms) to feel natural. When multiple AIs chain turns (consecutive hits), each action has its own delay.

### 7.2 AI Turn Logic

```
1. If confident enough to guess a word → guess it
2. Otherwise → ask a letter of the most promising target
```

### 7.3 Difficulty Tiers

**Easy**
- Letter selection: random from unused letters, slight bias toward vowels
- Word guessing: only attempts when 100% of letters are revealed
- Word choice: common 4–6 letter words
- Free letter: random

**Medium**
- Letter selection: frequency-ordered (E, T, A, O, I, N, S, R, H, L...), skipping already-asked
- Word guessing: attempts when ≥80% of letters revealed and a dictionary match exists
- Word choice: 5–8 letter words, moderate difficulty
- Free letter: picks least-useful letter (most common letter in word)

**Hard**
- Letter selection: maintains a candidate word list per opponent, filtered by known revealed/missing letters. Picks the letter that maximally partitions the remaining candidates (information-theoretic approach).
- Word guessing: attempts when candidate list is narrowed to 1–3 words
- Word choice: 7–12 letter uncommon words
- Free letter: picks the letter that gives away the least information (rarest letter in word, or a letter shared by many possible words)

### 7.4 AI Targeting
- Easy: random opponent
- Medium: targets opponent with most revealed letters
- Hard: targets opponent whose candidate list is smallest (closest to being solvable)

### 7.5 AI Penalty Handling
When an AI guesses wrong and must reveal a letter, it picks the letter that leaks the least information:
- Easy: random unrevealed letter
- Medium/Hard: reveals the most common letter among its unrevealed letters

---

## 8. Dictionary

- Source: a curated English word list (e.g., a subset of SOWPODS or TWL06), 4–12 letters only
- Shipped as a static JSON file, imported at build time
- Approximate size: ~40K words, ~250KB raw, ~60KB gzipped
- Used for:
  1. Validating the human player's word
  2. AI word selection
  3. AI candidate filtering (hard mode)
- Words tagged by frequency tier for AI difficulty-appropriate selection

---

## 9. Local Storage

Minimal persistence, all optional:

| Key | Data |
|---|---|
| `probe-settings` | Difficulty preference, sound on/off |
| `probe-stats` | Games played, games won, win streak |

No game-in-progress saving for v1. Refreshing the page loses the current game.

---

## 10. Animations

| Event | Animation |
|---|---|
| Letter reveal (hit) | Card flip (CSS 3D transform, ~400ms) |
| Miss | Brief shake on the targeted rack |
| Wrong word guess | Shake on the guess input + penalty slot pulses |
| Correct word guess | Rack letters cascade-reveal, then rack dims |
| Elimination | Rack slides down and fades to 30% opacity |
| Win | Simple CSS confetti or particle burst |
| AI thinking | Ellipsis pulse on the turn banner |

All CSS-only — no animation libraries.

---

## 11. Responsive Layout

**Desktop (≥768px)**
```
┌─────────────────────────────────┐
│         Turn Banner             │
├─────────┬─────────┬─────────────┤
│  AI-1   │  AI-2   │   AI-3      │
│  rack   │  rack   │   rack      │
├─────────┴─────────┴─────────────┤
│          Your rack              │
├─────────────────┬───────────────┤
│  Action Panel   │   Game Log    │
│  (keyboard +    │               │
│   controls)     │               │
└─────────────────┴───────────────┘
```

**Mobile (<768px)**
- Opponent racks stack vertically (scrollable if needed)
- Your rack pinned above the action panel
- Action panel at bottom (thumb-reachable)
- Game log collapsed into expandable drawer
- Minimum touch target: 44×44px

---

## 12. Accessibility

- Full keyboard navigation (Tab, Enter, Escape)
- `<LetterSlot>` has `aria-label`: e.g., `"AI-2, letter 3 of 7, hidden"` or `"AI-2, letter 3 of 7, revealed: T"`
- Turn changes announced via `aria-live="polite"` region
- Hits/misses announced via `aria-live="assertive"`
- Keyboard colors use symbols in addition to color (✓ for hit, ✗ for miss)
- Focus trapped inside modals (penalty picker, rules)

---

## 13. Build & Deployment

### Development
```bash
npm create vite@latest probe -- --template react-ts
cd probe
npm install
npm run dev
```

### Deployment via GitHub Actions

Triggered on push to `main`. No `gh-pages` branch or npm package needed — uses the newer GitHub Pages artifact-based deployment.

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

Requires: GitHub repo → Settings → Pages → Source set to "GitHub Actions".

`vite.config.ts` must set `base` to the repo name:
```typescript
export default defineConfig({
  base: '/probe/',
  // ...
})
```

### Repository structure
```
probe/
├── public/
│   └── dictionary.json
├── src/
│   ├── components/
│   │   ├── TitleScreen.tsx
│   │   ├── WordSelection.tsx
│   │   ├── GameBoard.tsx
│   │   ├── ResultsScreen.tsx
│   │   ├── WordRack.tsx
│   │   ├── LetterSlot.tsx
│   │   ├── LetterKeyboard.tsx
│   │   ├── ActionPanel.tsx
│   │   ├── TargetSelector.tsx
│   │   ├── GameLog.tsx
│   │   ├── PenaltyPicker.tsx
│   │   ├── HelpButton.tsx
│   │   └── RulesModal.tsx
│   ├── game/
│   │   ├── reducer.ts          // game state reducer
│   │   ├── actions.ts          // action creators
│   │   ├── ai.ts               // AI decision logic
│   │   ├── dictionary.ts       // word validation + lookup
│   │   └── types.ts            // TypeScript interfaces
│   ├── hooks/
│   │   ├── useGame.ts          // main game hook (wraps useReducer)
│   │   └── useAITurn.ts        // schedules AI moves with delays
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 14. Milestones

| Phase | Scope | Estimate |
|---|---|---|
| 1 | Game state reducer, types, word validation, basic turn logic | 2 days |
| 2 | UI: word selection, game board, word racks, letter keyboard | 3 days |
| 3 | AI opponents (easy + medium) | 2 days |
| 4 | Polish: animations, responsive layout, accessibility | 2 days |
| 5 | Hard AI, stats tracking, deploy to GitHub Pages | 2 days |

**Total: ~11 days**

---

## 15. Out of Scope (v1)

- Multiplayer
- Server-side anything
- User accounts
- Game save/resume
- Scoring variant
- Custom word lists
- Spectator mode
