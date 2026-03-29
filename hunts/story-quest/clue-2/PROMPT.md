# Clue 2: Story Pack Schema + Loader

## Mission
Define the canonical story pack JSON format and build the loader that imports packs into SQLite. This is the content pipeline — every story Conci plays flows through this system.

## Context
- Story packs are authored as JSON files in `src/games/story-quest/packs/`
- At runtime, packs are imported into SQLite tables created in Clue 1
- The pack format must support: procedural segments, AI enhancement moments, branching paths, free text prompts, offline fallbacks, and reading level metadata
- Packs are the unit of content scaling — Tyler generates new packs in Claude Chat, commits JSON, app loads them

## Build

### File: `src/games/story-quest/db/packLoader.js`

**Pack JSON Schema:**

```javascript
// Canonical pack format — every pack JSON must match this shape
const PACK_SCHEMA = {
  id: "string",              // e.g. "iron-rails-pack-1"
  world: "string",           // Must match a world_id from WorldSelector
  title: "string",           // e.g. "The Midnight Express"
  readingLevel: "number",    // 1-5 (maps roughly to grade level)
  targetAge: [4, 8],         // [min, max]
  author: "string",          // "tyler+claude" for co-authored
  version: "number",         // Pack version, for future updates
  heroPlaceholders: {
    name: "[NAME]",          // Replaced at runtime with hero name
    pronoun: "[PRONOUN]",    // "he/she/they" based on hero profile
    possessive: "[POSSESSIVE]", // "his/her/their"
    description: "[HERO_DESCRIPTION]"  // Full character description
  },
  segments: [
    // Procedural segment
    {
      id: 1,
      type: "procedural",
      text: "[NAME] stood on the platform...",
      choices: ["Climb aboard!", "Ask about the train"],
      nextMap: { "0": 2, "1": 3 }  // choice index → next segment id
    },
    // AI enhancement moment
    {
      id: 5,
      type: "ai_moment",
      context: "Hero just discovered the engine room. First free text moment.",
      prompt: "The hero has just entered the engine room of the Midnight Express...",
      systemAddendum: "",    // Optional extra system prompt constraints
      allowFreeText: true,
      fallback: {
        text: "[NAME] gasped. The engine room was enormous...",
        choices: ["Touch the glowing wheel", "Pull a lever", "Look through the periscope"],
        nextMap: { "0": 6, "1": 7, "2": 8 }
      },
      // AI-generated choices don't use nextMap — engine picks closest branch
      branchHints: {
        "explore": 6,
        "mechanical": 7,
        "observe": 8
      }
    },
    // Terminal segment (story ending)
    {
      id: 20,
      type: "procedural",
      text: "[NAME] smiled as the train pulled into the station...",
      isEnding: true,
      endingType: "triumph"  // triumph | bittersweet | cliffhanger | cozy
    }
  ]
}
```

**Pack Loader functions:**

```javascript
// Validate a pack JSON against the schema
validatePack(packJSON) → { valid: boolean, errors: string[] }

// Import a validated pack into SQLite
// Idempotent — re-importing same pack.id replaces existing data
importPack(packJSON) → { success: boolean, segmentCount: number }

// Import all packs from the packs/ directory
// Called on app init — detects new/updated packs
importAllPacks() → { imported: number, skipped: number, errors: string[] }

// Check if a pack is already imported and at current version
isPackCurrent(packId, version) → boolean

// Remove a pack and all its segments (for cleanup)
removePack(packId) → boolean

// Get pack metadata without segments (for world selector)
getPackMeta(packId) → { id, world, title, readingLevel, targetAge }

// List all packs for a world, sorted by reading level
getWorldPacks(worldId) → PackMeta[]
```

**Placeholder replacement engine:**

```javascript
// Replace all hero placeholders in a text string
// Called at render time, not import time (heroes can change)
injectHero(text, hero) → string
// hero = { name, pronoun, possessive, description }
// Replaces [NAME], [PRONOUN], [POSSESSIVE], [HERO_DESCRIPTION]
```

**Branch resolution for AI moments:**

```javascript
// After AI generates choices and kid picks one,
// resolve which pack segment to continue from
resolveBranch(aiChoice, branchHints) → segmentId
// Uses keyword matching against branchHints keys
// Fallback: pick the first hint if no match
```

### File: `src/games/story-quest/packs/PACK-FORMAT.md`

A human-readable guide for the pack format, so Tyler knows the schema when authoring packs in Claude Chat. Include:
- Every field explained
- Examples of procedural vs ai_moment segments
- Rules for placeholder usage
- How branching works (nextMap for procedural, branchHints for AI moments)
- Reading level guidelines (what each level means for sentence length, vocab, segment length)

## Pass Conditions

- [ ] `validatePack()` catches: missing required fields, invalid segment types, broken nextMap references (pointing to non-existent segment ids), duplicate segment ids
- [ ] `importPack()` correctly populates both `story_packs` and `pack_segments` tables
- [ ] Re-importing the same pack (same id, same version) is a no-op
- [ ] Re-importing with a bumped version replaces old data
- [ ] `injectHero()` replaces all 4 placeholder types correctly
- [ ] `injectHero()` handles text with zero placeholders (returns unchanged)
- [ ] `resolveBranch()` matches "I want to explore the pipes" to a branchHint key containing "explore"
- [ ] `resolveBranch()` falls back gracefully when no hint matches
- [ ] `getWorldPacks()` returns packs sorted by reading level ascending
- [ ] PACK-FORMAT.md is clear enough for Tyler to author a new pack without asking Claude for help
- [ ] No external dependencies beyond storyDB.js from Clue 1
