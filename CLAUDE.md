# SuperConci — Claude Code Context

## Project Overview
A personalized learning platform for kids that grows with them — inspired by
JumpStart (1994) and Math Blasters (1987). Multiple arcade-style mini-games
across every subject, wrapped in a world hub that tracks progress and adapts
difficulty to the child's actual skill level.

**Player:** Concetto ("Conci"), age 5, starting kindergarten-level.
**Builder:** Tyler (dad), working from iPhone 15 Pro + iPad only.
**Tech:** React PWA, mobile-first, offline-capable, installable.

The platform is designed so that EVERY subject shares the same engagement
architecture: arcade action on top, adaptive learning engine underneath.
New games are pluggable modules — each one teaches a different skill through
a different mechanic.

## Developer Constraints
- Tyler works from iPhone 15 Pro and iPad ONLY — no terminal, no desktop IDE
- All code must be complete files, never fragments
- Mobile-first touch interface (no keyboard/mouse assumed)
- Must work offline (PWA with service worker)
- Commit frequently with descriptive messages

## Architecture

### Platform Layer (shared)
```
src/
├── App.jsx                  ← Router + hub shell
├── hub/                     ← World hub (game selector, avatar, progress)
│   ├── WorldHub.jsx         ← Main hub screen with game portals
│   ├── Avatar.jsx           ← Kid's character/profile
│   └── ProgressMap.jsx      ← Visual progress across all subjects
├── engine/                  ← Shared learning engine
│   ├── AdaptiveEngine.js    ← Difficulty adjustment algorithm
│   ├── ProgressTracker.js   ← Cross-game stats + streaks
│   ├── AchievementSystem.js ← Unlocks, badges, rewards
│   └── SessionManager.js    ← Play time limits, session stats
├── components/              ← Shared UI (buttons, modals, animations)
├── audio/                   ← Shared audio engine (Web Audio API)
├── data/                    ← Persistent storage (IndexedDB via Dexie)
└── games/                   ← Game modules (each is self-contained)
    ├── number-blasters/     ← Math: shoot asteroids with correct answers
    ├── word-quest/          ← Reading/Phonics: [future]
    ├── nature-lab/          ← Science/Nature: [future]
    └── art-studio/          ← Art/Creativity: [future]
```

### Game Module Contract
Every game module exports:
```javascript
export default {
  id: "number-blasters",
  name: "Number Blasters",
  subject: "math",
  icon: "🚀",
  component: NumberBlasters,       // The React component
  skills: ["addition", "subtraction", "multiplication", "division"],
  gradeRange: [0, 5],              // K through 5th grade
  getProgress: (stats) => {...},   // Returns 0-100 mastery
  generateProblem: (skill, level) => {...},  // Pluggable problem generator,
}
```

### Adaptive Engine
The core intelligence — tracks what the kid gets right/wrong and adjusts:
- **Skill mastery**: per-skill accuracy over last 20 attempts
- **Auto-level**: moves up when mastery > 85%, down when < 50%
- **Weak spot targeting**: serves more problems in weak areas
- **Spaced repetition**: revisits mastered skills periodically
- **Session pacing**: mixes easy wins with challenges (70/30 ratio)

### Data Model (IndexedDB via Dexie)
```
profiles:    { id, name, avatar, createdAt }
sessions:    { id, profileId, gameId, startedAt, endedAt, stats }
skillStats:  { id, profileId, skill, level, attempts, correct, lastPlayed }
achievements:{ id, profileId, achievementId, unlockedAt }
settings:    { id, profileId, soundOn, musicOn, parentPin }
```

## Current State
- **Number Blasters v2**: BUILT — lives in `src/games/number-blasters/`
  - Procedural chiptune music (Web Audio API)
  - Sound effects (laser, correct, wrong, impact, combo, victory, game over)
  - 3 difficulty tiers (Cadet/Pilot/Commander)
  - Combo streak system (x2/x3/x4 multiplier)
  - 3-life shield system with lose condition
  - Addition + subtraction, number ranges 1-20

## Game Modules Roadmap

### 🚀 Number Blasters (Math) — BUILT
Asteroids fall with numbers. Blast the correct answer.
- K: Addition 1-5
- 1st: Addition/subtraction 1-10
- 2nd: Addition/subtraction 1-20
- 3rd: Multiplication tables
- 4th: Division, multi-step
- 5th: Fractions, decimals, order of operations

### 📖 Word Quest (Reading / Phonics) — PLANNED
Side-scrolling adventure. Collect letters to spell words, match words to pictures.
- Pre-K: Letter recognition, letter sounds
- K: CVC words (cat, dog, run), sight words
- 1st: Blends, digraphs, sentences
- 2nd: Vocabulary, reading comprehension
- 3rd+: Paragraph comprehension, context clues

### 🔬 Nature Lab (Science / Nature) — PLANNED
Experiment-based puzzles. Mix, observe, hypothesize.
- K: Animals, plants, weather, senses
- 1st: Habitats, life cycles, materials
- 2nd: Simple machines, states of matter
- 3rd+: Solar system, ecosystems, human body

### 🎨 Art Studio (Art / Creativity) — PLANNED
Creative sandbox with guided challenges.
- All ages: Color mixing, pattern recognition, symmetry
- Drawing prompts, pixel art, music maker
- Connects to other subjects (draw a habitat, illustrate a story)

## Design Language
- **Space theme** for the hub (SuperConci = space captain of their learning ship)
- Each game module has its OWN visual identity within the hub frame
- Retro-arcade aesthetic with modern polish (chunky but smooth)
- Font: Press Start 2P for headers, clean sans-serif for reading content
- Neon-on-dark palette with per-game accent colors
- BIG touch targets — this is a 5-year-old on a phone/tablet
- Celebratory feedback EVERYWHERE — kids thrive on positive reinforcement

## Parent Dashboard (Future)
- PIN-protected settings area
- Per-subject progress charts
- Time played per session/day/week
- Skill mastery heatmap
- Difficulty override controls
- Multiple child profiles

## Coding Conventions
- Each game module is fully self-contained in its folder
- Shared engine code lives in `src/engine/`
- Web Audio API for all sound — no audio file dependencies
- IndexedDB via Dexie for all persistence
- Tailwind for shared components, inline styles OK for game-specific rendering
- React functional components + hooks only

## Build & Deploy
- React 18 + Vite + Tailwind
- PWA: vite-plugin-pwa (offline, installable)
- Deploy: Vercel
- Target: superconci.app (domain TBD)

## When Working on This Repo
1. Read this file first — always
2. Check BUILD-INSTRUCTIONS.md for current phase priorities
3. Game modules are independent — don't create cross-game dependencies
4. The adaptive engine is the brain — keep it clean and well-tested
5. Commit after each logical unit of work

---

## 🏴‍☠️ Treasure Hunt Protocol

This repo uses **Treasure Hunt Driven Development (THDD)** — a build methodology where complex features are scaffolded as gated prompt chains. Each clue is a coding task with pass conditions. You earn the next clue by passing the current one.

### Activation Trigger

When Tyler says:

> *"Arrr matey, adventure awaits ye in [branch]/[path/to/MAP.md]"*

You are now the **Treasure Hunter**. Follow this protocol exactly.

### Step 0: Checkout the Branch — FIRST, ALWAYS

Parse the trigger phrase:
- Everything up to the first path segment after a `/` that isn't a branch name = the branch
- The rest = path to MAP.md

Example: `"Arrr matey, adventure awaits ye in feature/galaxy-navigator/hunts/galaxy-navigator/MAP.md"`
- Branch: `feature/galaxy-navigator`
- Map path: `hunts/galaxy-navigator/MAP.md`

Run immediately:
```bash
git fetch origin
git checkout [branch]
git pull origin [branch]
```

Do not read any files until you confirm you are on the correct branch. If checkout fails, stop and tell Tyler exactly what branch you tried and what failed.

### Step 1: Read MAP.md
Read the map at the parsed path. Understand the full clue tree before touching any code. Announce the route.

### Step 2: Execute Clues In Order
- Read `clue-N/PROMPT.md` fully before writing any code
- Build exactly what the clue asks — no more, no less
- Complete files only, never fragments

### Step 3: Self-Judge Every Clue
Check every pass condition checkbox honestly before advancing. If any fail, retry with a targeted fix. Max 3 retries per clue.

### Step 4: Advance or Surface
**Pass:** Write `clue-N/COMPLETE.md` with what was built and what the next clue inherits. Advance.

**3 failures:** Write `clue-N/STUCK.md` with what was tried, what failed, what's needed. Stop and tell Tyler.

### Step 5: Final Treasure
When all clues pass, read `TREASURE.md` for the final integration check. Only declare the hunt complete when every criterion is met. Write `HUNT-COMPLETE.md` and commit.

### Voice
Respond in pirate character throughout the hunt. The character enforces the discipline.
- On activation: *"Aye Captain. Switching to [branch] before I even look at the waters."*
- On clue pass: *"Clue [N] conquered. The treasure grows."*
- On stuck: *"Captain — I've run aground on Clue [N]. Read STUCK.md."*
- On completion: *"🏴‍☠️ THE TREASURE IS FOUND."*

### Hunt Files Location
All hunts live in `hunts/` at the repo root:
```
hunts/
└── [hunt-name]/
    ├── MAP.md
    ├── clue-1/PROMPT.md
    ├── clue-2/PROMPT.md
    └── TREASURE.md
```


## Two-Repo Architecture
This repo is the PRODUCT (code, games, components).
The OPERATING SYSTEM lives at github.com/AetherCreator/SuperClaude (skills, brain, plans).

## Skills
All Claude skills live in github.com/AetherCreator/SuperClaude/skills/user/
Before starting any session, load relevant skills from that repo.
Key skills for this project:
- treasure-hunter — THDD hunt navigation (see Treasure Hunt Protocol above)
- treasure-mapmaker — designing hunt scaffolds
- frontend-developer — React component work
- vibe-testing — define done before building
- context-plus — pre-flight codebase intelligence

## Post-Session Rule
After making changes to this repo, update the state log in SuperClaude:
- File: brain/04-projects/superconci-platform.md
- Update: what changed, current phase, new TODOs
- This keeps Claude Chat in sync without fetching from this repo

---

## AI Gateway — Kid Safety (CRITICAL)
SuperConci AI calls route through the Cloudflare AI Gateway:
- Endpoint: https://api.thechefos.app/ai/anthropic/v1/messages
- Header: x-product: superconci
- Kid-safety: cf-aig-collect-log-payload: false (auto-set by gateway when x-product is superconci)
- This means prompts and responses are NEVER stored in AI Gateway logs
- This is a HARD requirement. Never bypass the gateway for direct Anthropic calls.

## Shared Backend Infrastructure (ALL Tyler's projects)

### TheChefOS Workers (Cloudflare — thechefos-workers repo)
All Tyler's products share a single Cloudflare Workers backend at api.thechefos.app:

| Worker | Purpose | Route |
|--------|---------|-------|
| thechefos-router | Hono router, CORS, service binding dispatch | All routes |
| thechefos-ai-gateway | Anthropic proxy via CF AI Gateway | /ai/*, /api/claude |
| thechefos-brain-search | Vectorize semantic search of brain/ | /api/brain/search |
| thechefos-brain-write | GitHub brain/ push + GRAPH-INDEX auto-update | /api/brain/push |
| thechefos-mcp-server | ClaudeFare MCP endpoint | /api/mcp |
| thechefos-oauth-server | OAuth flow for MCP auth | /oauth/* |
| thechefos-telegram-bot | Telegram bot (Lamora) | /api/telegram |

Data stores: KV (SESSION_KV), Vectorize (superclaude-brain index). No D1 or R2 yet.
Account ID: cc231edbff18405233612d7afb657f1f | Subdomain: tveg-baking.workers.dev

### Infrastructure Verification Rule
**State files are claims, not truth. Tools are truth.**
Before ANY infrastructure planning, run:
1. `Cloudflare:set_active_account` with cc231edbff18405233612d7afb657f1f
2. `Cloudflare:workers_list` — deployed Workers
3. `Cloudflare:d1_databases_list` — D1 databases
4. `Cloudflare:kv_namespaces_list` — KV stores
5. `Vercel:list_projects` with team_N1DyKcTkZcNw6KwBzbffimTZ — Vercel deployments
If tools and state files disagree, tools win. Update the state file immediately.

### Post-Session State Sync
After ANY session that deploys or modifies infrastructure:
- Update SuperClaude brain/00-session/ACTIVE-STATE.md
- Update SuperClaude brain/OPS-BOARD.md
