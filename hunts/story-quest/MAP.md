# 🗺️ Story Quest — Treasure Hunt Map

**Module:** SuperConci Module 2 — Story Quest
**Branch:** `feature/story-quest`
**Hunter:** Claude Code
**Cartographer:** Tyler + Claude Chat (2026-03-27)

---

## The Treasure

An AI-powered interactive story experience where Conci IS the hero. He takes a selfie, becomes a storybook character, picks a world, and the story unfolds around him — part hand-crafted adventure, part AI magic. Every choice shapes the story. Every story is saved.

## Architecture Decisions (Locked)

These were decided in the design session. Do not deviate.

| Decision | Choice |
|---|---|
| Storage | SQLite via sql.js — new for this module, Dexie untouched |
| Vision extraction | Two API calls — prose description first, structured parse second |
| Avatar palette | Medium (12-15 curated values per trait, mapped to CSS variables) |
| Engine architecture | Hybrid — procedural story packs + AI enhancement at key moments |
| Story packs | JSON files for authoring → imported to SQLite at runtime |
| Streaming | Delimiter pattern: stream plain text, `---CHOICES---`, then JSON |
| Token strategy | 3-4 AI calls per story (only at pack-defined AI moments) |
| Save timing | After choice selection only (confirmed state) |
| Safety pipeline | Render-then-check, 2 retries with stricter prompt, then pack fallback |
| Launch packs | 3 packs at reading level 3: Iron Rails, Road Goes Ever On, Star Sector |

## File Structure

```
src/games/story-quest/
├── StoryQuest.jsx           ← Module entry point + router
├── db/
│   ├── storyDB.js           ← sql.js init, migrations, query helpers
│   └── packLoader.js        ← JSON → SQLite pack importer
├── hero/
│   ├── HeroCreation.jsx     ← Camera capture + Vision API flow
│   ├── Avatar.jsx           ← CSS/SVG character with expressions + costumes
│   └── avatarPalette.js     ← Curated color/style lookup tables
├── worlds/
│   └── WorldSelector.jsx    ← 6 themed world cards
├── engine/
│   ├── StoryEngine.js       ← Core playback: procedural + AI hybrid
│   ├── StreamHandler.js     ← Claude API streaming + delimiter parsing
│   └── SafetyCheck.js       ← Post-render safety classification
├── player/
│   ├── StoryPlayer.jsx      ← Typewriter renderer + choices + free text
│   └── Typewriter.js        ← Character-by-character text animation
├── library/
│   ├── StoryLibrary.jsx     ← Saved stories list + continue/badge
│   └── ParentView.jsx       ← PIN-protected story logs + stats
├── audio/
│   └── StoryAudio.js        ← Per-world procedural ambient loops
└── packs/                   ← Story pack JSON files
    ├── iron-rails-pack-1.json
    ├── road-ever-on-pack-1.json
    └── star-sector-pack-1.json
```

## The Route (12 Clues)

```
[1] SQLite + storyDB
 │
 ├──[2] Story Pack Schema + Loader
 │   │
 │   ├──[5] World Selector UI
 │   │
 │   └──[6] Story Engine (procedural + AI hybrid)
 │       │
 │       ├──[7] Safety Pipeline
 │       │
 │       └──[8] Story Player UI (typewriter + choices)
 │           │
 │           └──[9] Save/Resume + Story Library
 │               │
 │               └──[11] Parent View
 │
 ├──[3] Hero Creation (camera + Vision API)
 │   │
 │   └──[4] Avatar Component (SVG + expressions)
 │
 ├──[10] World Audio (6 ambient loops)
 │
 └──[12] Hub Integration + Launch Packs ← TREASURE
```

### Critical Path
`1 → 2 → 6 → 8 → 9` (storage → packs → engine → player → persistence)

### Parallel Tracks After Clue 2
- Track A: `3 → 4` (hero + avatar) — independent of engine
- Track B: `5` (world selector) — independent, just UI
- Track C: `10` (audio) — independent, just Web Audio

### Hard Clues (flagged for Opus)
- **Clue 3:** Claude Vision API + structured extraction from two calls
- **Clue 6:** Hybrid engine — procedural playback + streaming AI with delimiter parsing
- **Clue 7:** Content safety — render-then-check with retry cascade + pack fallback

## Non-Negotiable Constraints

- Touch targets: 44×44px minimum everywhere
- Web Audio API only — no audio file imports
- sql.js for Story Quest storage — do not touch existing Dexie setup
- Complete files only — never fragments
- iPhone/iPad only — no desktop assumptions
- Each story pack is fully self-contained JSON
- Hero photos never persist — used for one Vision call, then discarded
- Offline-first: every AI moment has a pack fallback

## Success Metrics

- Conci asks to play Story Quest unprompted
- He recognizes himself in the avatar
- He makes a choice that surprises Tyler
- A story makes him laugh out loud
- Tyler reads a saved story and tears up a little
