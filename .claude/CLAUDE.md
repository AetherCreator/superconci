# SuperConci — Claude Code Context

## What This Is
React PWA learning platform for kids — JumpStart meets Math Blasters, rebuilt for mobile.
Every subject is an arcade game with a shared adaptive difficulty engine.
Owner: Tyler Vegetabile (AetherCreator) — works exclusively from iPhone 15 Pro + iPad. No desktop.

**Player:** Concetto ("Conci"), age 5, reading at 3rd-grade level.
**Tech:** React PWA, mobile-first, offline-capable, installable.
**Deploy:** Vercel (team_N1DyKcTkZcNw6KwBzbffimTZ)

## Hard Rules (violating any of these = immediate fix)

1. **Every subject is an arcade game** — never build passive content, flashcards, or static quiz screens. Learning happens through gameplay mechanics.
2. **Adaptive difficulty engine is SHARED** — lives in `src/engine/AdaptiveEngine.js`. Never fork it, never duplicate it per game. All games plug into the same engine.
3. **Number Blasters is the reference implementation** — when building a new subject module, follow the patterns in `src/games/number-blasters/`. This is the template.
4. **Mobile-first: 375px minimum, 44px touch targets** — every interactive element must be tappable by a 5-year-old's finger. Test at 375px width before committing.
5. **Content must be age-appropriate** — Conci is 5, reading at 3rd-grade level. No content beyond what a bright kindergartener can engage with. When in doubt, simpler is better.
6. **Complete files only** — never push fragments, partials, or "TODO: finish this" placeholders.
7. **Dexie is the local DB** — all persistence through IndexedDB via Dexie. No localStorage, no sessionStorage.
8. **Web Audio API for all sound** — no audio file dependencies. Procedural audio only.

## AI Gateway — Kid Safety (CRITICAL)
SuperConci AI calls route through the Cloudflare AI Gateway:
- Endpoint: https://api.thechefos.app/ai/anthropic/v1/messages
- Header: x-product: superconci
- Kid-safety: cf-aig-collect-log-payload: false (auto-set by gateway when x-product is superconci)
- Prompts and responses are NEVER stored in AI Gateway logs
- This is a HARD requirement. Never bypass the gateway for direct Anthropic calls.

## Architecture

### Project Structure
```
src/
├── App.jsx                  ← Router + hub shell
├── hub/                     ← World hub (game selector, avatar, progress)
│   ├── WorldHub.jsx         ← Main hub screen with game portals
│   ├── Avatar.jsx           ← Kid's character/profile
│   └── ProgressMap.jsx      ← Visual progress across all subjects
├── engine/                  ← Shared learning engine (NEVER fork)
│   ├── AdaptiveEngine.js    ← Difficulty adjustment algorithm
│   ├── ProgressTracker.js   ← Cross-game stats + streaks
│   ├── AchievementSystem.js ← Unlocks, badges, rewards
│   └── SessionManager.js    ← Play time limits, session stats
├── components/              ← Shared UI (buttons, modals, animations)
├── audio/                   ← Shared audio engine (Web Audio API)
├── data/                    ← Persistent storage (IndexedDB via Dexie)
└── games/                   ← Game modules (each is self-contained)
    ├── number-blasters/     ← Math — BUILT, reference implementation
    ├── word-quest/          ← Reading/Phonics — NEXT
    ├── nature-lab/          ← Science/Nature — PLANNED
    └── art-studio/          ← Art/Creativity — PLANNED
```

### Game Module Contract
Every game module must export:
```javascript
export default {
  id: "game-id",
  name: "Display Name",
  subject: "math",
  icon: "🚀",
  component: GameComponent,
  skills: ["skill-1", "skill-2"],
  gradeRange: [0, 5],
  getProgress: (stats) => { /* returns 0-100 mastery */ },
  generateProblem: (skill, level) => { /* returns problem object */ },
}
```

### Adaptive Engine (the brain — keep it clean)
- Skill mastery: per-skill accuracy over last 20 attempts
- Auto-level: up when mastery > 85%, down when < 50%
- Weak spot targeting: serves more problems in weak areas
- Spaced repetition: revisits mastered skills periodically
- Session pacing: 70% easy wins / 30% challenges

### Data Model (IndexedDB via Dexie)
```
profiles:     { id, name, avatar, createdAt }
sessions:     { id, profileId, gameId, startedAt, endedAt, stats }
skillStats:   { id, profileId, skill, level, attempts, correct, lastPlayed }
achievements: { id, profileId, achievementId, unlockedAt }
settings:     { id, profileId, soundOn, musicOn, parentPin }
```

## Current State
- **Number Blasters v2**: BUILT — `src/games/number-blasters/`
  - Procedural chiptune music, sound effects, 3 difficulty tiers
  - Combo streak system, 3-life shield system
  - Addition + subtraction, number ranges 1-20
- **Word Quest**: NEXT — reading/phonics arcade game

## Design Language
- Space theme for hub (SuperConci = space captain of their learning ship)
- Each game has its OWN visual identity within the hub frame
- Retro-arcade aesthetic with modern polish (chunky but smooth)
- Font: Press Start 2P for headers, clean sans-serif for reading content
- Neon-on-dark palette with per-game accent colors
- BIG touch targets — this is a 5-year-old on a phone/tablet
- Celebratory feedback EVERYWHERE — kids thrive on positive reinforcement

## Code Style
- React functional components + hooks only
- Each game module is fully self-contained in its folder
- Shared engine code lives in `src/engine/`
- Tailwind for shared components, inline styles OK for game-specific rendering
- Game modules are independent — never create cross-game dependencies
- The adaptive engine is the brain — keep it clean and well-tested

## Build & Deploy
- React + Vite + Tailwind
- PWA: vite-plugin-pwa (offline, installable)
- Deploy: Vercel

## When Working on This Repo
1. Read this file first — always
2. Check BUILD-INSTRUCTIONS.md for current phase priorities
3. Game modules are independent — don't create cross-game dependencies
4. The adaptive engine is the brain — keep it clean and well-tested
5. Commit after each logical unit of work

## Two-Repo Architecture
This repo is the PRODUCT (code, games, components).
The OPERATING SYSTEM lives at github.com/AetherCreator/SuperClaude (skills, brain, plans).

## SuperClaude Skills Bridge
All Claude skills live in github.com/AetherCreator/SuperClaude/skills/user/
Before starting any session, load relevant skills from that repo.

| Skill | When to Load |
|-------|-------------|
| `frontend-developer` | Any React/UI work |
| `vibe-testing` | Before writing any code — define done first |
| `vibe-planning` | Before starting any multi-step task |
| `reality-checker` | Before marking anything complete |
| `conversation-harvester` | Session end — push decisions + insights to brain/ |

## Treasure Hunt Protocol
If Tyler says *"Arrr matey, adventure awaits ye in [branch]/[path]"*:
1. `git checkout [branch]` — FIRST, before anything
2. Read MAP.md at the given path
3. Execute clues in order, self-judge against pass conditions
4. Earn each clue — never read ahead
5. Respond in pirate character throughout

Hunt files live in `hunts/` at the repo root.

## Shared Backend Infrastructure
All Tyler's products share Cloudflare Workers at api.thechefos.app:

| Worker | Purpose | Route |
|--------|---------|-------|
| thechefos-router | Hono router, CORS, service binding dispatch | All routes |
| thechefos-ai-gateway | Anthropic proxy via CF AI Gateway | /ai/*, /api/claude |
| thechefos-brain-search | Vectorize semantic search of brain/ | /api/brain/search |
| thechefos-brain-write | GitHub brain/ push + GRAPH-INDEX auto-update | /api/brain/push |

Account ID: cc231edbff18405233612d7afb657f1f | Subdomain: tveg-baking.workers.dev

### Infrastructure Verification Rule
**State files are claims, not truth. Tools are truth.**
Before ANY infrastructure planning, verify with Cloudflare/Vercel tools first.

## Brain-Aware Behavior
When a domain topic comes up, silently query brain/ for relevant knowledge:
- Endpoint: https://api.thechefos.app/api/brain/search
- GET: /api/brain/search?q={topic}&limit=3
- Tyler's own insights take precedence over training data
- No results? Proceed normally with training data

## Post-Session Rule
After making changes to this repo, update the state log in SuperClaude:
- File: `brain/04-projects/superconci-platform.md`
- Update: what changed, current phase, new TODOs
- This keeps Claude Chat in sync without fetching from this repo

## Error Memory
<!-- Claude appends new entries here after every correction -->
<!-- Format: YYYY-MM-DD: What went wrong → What to do instead -->

## Self-Updating Rule
After every correction in this codebase, end with:
"Update CLAUDE.md so you don't repeat this mistake."
