# Clue 1: COMPLETE — SQLite + storyDB

## What Was Built
`src/games/story-quest/db/storyDB.js` — the complete SQLite storage layer for Story Quest.

### Key Details
- **sql.js** loaded via CDN WASM, with IndexedDB persistence (serialized blob under key `story-quest-db`)
- **5 tables:** heroes, story_packs, pack_segments, stories, story_segments — all with CHECK constraints and foreign keys
- **Debounced persistence** — 100ms debounce after every write, batches rapid writes
- **All query helpers exported:** initDB, persistDB, destroyDB, createHero, getHero, updateHero, importPack, getPacksForWorld, getPackSegment, createStory, getActiveStories, getCompletedStories, getStory, updateStoryStatus, updateStoryTitle, saveSegment, getStorySegments, getStoryHistory
- **getStoryHistory()** returns formatted text with segment content, chosen options, and free text inputs — ready for Claude API context injection
- **Zero Dexie references** — completely independent storage layer

### Dependencies Added
- `sql.js` npm package

## What Clue 2 Inherits
- `importPack(packJSON)` is ready to receive story pack JSON objects — expects: `{ id, worldId, title, readingLevel, targetAgeMin, targetAgeMax, segments: [{ segmentId, type, text, choices, nextMap, aiContext, aiPrompt, allowFreeText, fallbackText, fallbackChoices }] }`
- `getPackSegment(packId, segmentId)` returns parsed segments with JSON fields deserialized
- All tables exist and persist across page reloads
