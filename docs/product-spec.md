# SuperConci — Product Spec v0.1

*"A learning platform that grows with your kid."*

## The Problem
Educational apps for kids are either high-stimulation dopamine traps with minimal
learning value (most App Store games), or boring drill-and-practice tools that kids
refuse to use after day one.

The golden era of educational software — JumpStart (1994), Math Blasters (1987),
Reader Rabbit, Oregon Trail — got it RIGHT. Low stimulation, high yield. The game
mechanics were genuinely fun AND the education was real. Those products died because
they were tied to CD-ROMs and desktop computers.

Nobody has rebuilt that formula for the mobile era.

## The Vision
SuperConci is a personalized learning platform where every subject is a different
arcade game — all sharing one adaptive engine that tracks what the kid knows, what
they struggle with, and what they're ready to learn next.

The games are genuinely fun (Dad is a game designer). The education is real
(adaptive difficulty, spaced repetition, mastery-based progression). The platform
grows with the kid from pre-K through 5th grade.

## Core Principles
1. **Low stim, high yield** — no flashing ads, no lootboxes, no manipulation
2. **Adaptive, not fixed** — difficulty follows the kid, not a preset curriculum
3. **Celebrate everything** — positive reinforcement is the entire pedagogy
4. **Offline-first** — works in the car, at grandma's house, on a plane
5. **Dad-built** — every design decision filtered through "would I want Conci using this?"

## Platform Architecture

### The Hub — Space Command
Conci is the captain of their learning ship. Each subject is a destination —
a planet, a station, a nebula. Progress unlocks new areas. The hub is the home
screen, the progress map, and the reward showcase all in one.

### Game Modules — Pluggable Arcade Learning
Each subject gets its own game with its own mechanic and visual identity:
- 🚀 **Number Blasters** (Math) — shoot asteroids with correct answers
- 📖 **Word Quest** (Reading/Phonics) — adventure collecting letters and words
- 🔬 **Nature Lab** (Science) — experiment puzzles
- 🎨 **Art Studio** (Creativity) — drawing, patterns, color theory

### Adaptive Engine — The Brain
Shared across all games. Tracks per-skill mastery, auto-adjusts difficulty,
targets weak spots, paces sessions with a confidence/challenge mix.

### Parent Dashboard
PIN-protected. Progress charts, time controls, skill heatmaps.

## Subjects & Grade Progression

### Math (Number Blasters)
- K: Addition 1-5
- 1st: Addition/subtraction 1-10
- 2nd: Addition/subtraction 1-20
- 3rd: Multiplication tables
- 4th: Division, multi-step problems
- 5th: Fractions, decimals, order of operations

### Reading / Phonics (Word Quest)
- Pre-K: Letter recognition, letter sounds
- K: CVC words, sight words
- 1st: Blends, digraphs, sentences
- 2nd: Vocabulary, reading comprehension
- 3rd+: Paragraph comprehension, context clues

### Science / Nature (Nature Lab)
- K: Animals, plants, weather, senses
- 1st: Habitats, life cycles, materials
- 2nd: Simple machines, states of matter
- 3rd+: Solar system, ecosystems, human body

### Art / Creativity (Art Studio)
- All ages: Color mixing, patterns, symmetry
- Drawing prompts, pixel art, music maker
- Cross-subject connections (draw a habitat, illustrate a word)

## Monetization (Future)
- Free: full platform, all games, all subjects
- Premium (maybe): additional game modules, custom content tools for parents
- Or: completely free, open source, built for Conci and shared with the world

## Tech Stack
- React 18 + Vite + Tailwind
- PWA (offline, installable)
- IndexedDB via Dexie.js
- Web Audio API (procedural — no audio files)
- Vercel deployment

## Phases
- Phase 1: Platform foundation + Number Blasters integration + hub + adaptive engine
- Phase 2: Number Blasters expansion (mult/div) + Word Quest (reading module)
- Phase 3: Nature Lab + Art Studio + polish
- Phase 4: AI tutor (Claude) + multi-child + content expansion

*Authored 2026-03-25 by Tyler + Claude*
