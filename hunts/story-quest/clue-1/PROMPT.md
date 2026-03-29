# Clue 1: SQLite + storyDB

## Mission
Initialize sql.js as Story Quest's storage layer. Create all tables. Build query helpers. This is the foundation — every other clue writes to or reads from this database.

## Context
- SuperConci uses Dexie (IndexedDB) for Number Blasters. **Do not touch Dexie.**
- Story Quest gets its own SQLite database via sql.js (WebAssembly).
- The database lives in IndexedDB as a serialized blob (sql.js pattern for persistence).
- This module must handle: init, migrations, auto-save to IndexedDB, and restore on reload.

## Build

### File: `src/games/story-quest/db/storyDB.js`

**Database initialization:**
- Load sql.js WASM from CDN (`https://sql.js.org/dist/sql-wasm.wasm`) or bundle it
- On first load: create all tables
- On subsequent loads: restore from IndexedDB blob
- Auto-persist: serialize and save to IndexedDB after every write operation
- Export a singleton `db` instance and query helper functions

**Tables:**

```sql
-- Hero profiles (one per kid, could support siblings later)
CREATE TABLE IF NOT EXISTS heroes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Conci',
  description TEXT,
  hair_color TEXT,
  hair_style TEXT,
  skin_tone TEXT,
  eye_color TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Story packs imported from JSON
CREATE TABLE IF NOT EXISTS story_packs (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  title TEXT NOT NULL,
  reading_level INTEGER NOT NULL DEFAULT 1,
  target_age_min INTEGER DEFAULT 4,
  target_age_max INTEGER DEFAULT 8,
  imported_at TEXT DEFAULT (datetime('now'))
);

-- Pack segments (the pre-authored content)
CREATE TABLE IF NOT EXISTS pack_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pack_id TEXT NOT NULL,
  segment_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('procedural', 'ai_moment')),
  text TEXT,
  choices TEXT,
  next_map TEXT,
  ai_context TEXT,
  ai_prompt TEXT,
  allow_free_text INTEGER DEFAULT 0,
  fallback_text TEXT,
  fallback_choices TEXT,
  FOREIGN KEY (pack_id) REFERENCES story_packs(id)
);

-- Active/completed stories
CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL,
  hero_id INTEGER NOT NULL,
  pack_id TEXT NOT NULL,
  world_id TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned')),
  current_segment INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  last_played TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (hero_id) REFERENCES heroes(id),
  FOREIGN KEY (pack_id) REFERENCES story_packs(id)
);

-- Played story segments (the kid's actual journey)
CREATE TABLE IF NOT EXISTS story_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  segment_number INTEGER NOT NULL,
  pack_segment_id INTEGER,
  content TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('pack', 'ai', 'fallback')),
  choices_shown TEXT,
  selected_choice INTEGER,
  free_text_input TEXT,
  safety_passed INTEGER DEFAULT 1,
  played_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES stories(id)
);
```

**Query helpers to export:**

```javascript
// Database lifecycle
initDB()              // Load sql.js, create/restore database
persistDB()           // Serialize to IndexedDB
destroyDB()           // Clear everything (dev/testing)

// Heroes
createHero({ profileId, name, description, hairColor, hairStyle, skinTone, eyeColor })
getHero(profileId)
updateHero(heroId, updates)

// Story Packs
importPack(packJSON)          // Parse JSON, insert into story_packs + pack_segments
getPacksForWorld(worldId)     // List available packs for a world
getPackSegment(packId, segmentId)  // Get a specific segment from a pack

// Stories
createStory({ profileId, heroId, packId, worldId })
getActiveStories(profileId)   // All in-progress stories
getCompletedStories(profileId)
getStory(storyId)             // Full story with all segments
updateStoryStatus(storyId, status)
updateStoryTitle(storyId, title)

// Story Segments
saveSegment({ storyId, segmentNumber, packSegmentId, content, source, choicesShown, selectedChoice, freeTextInput, safetyPassed })
getStorySegments(storyId)     // All segments in order — ORDER BY segment_number
getStoryHistory(storyId)      // Formatted for Claude API context injection
```

**Persistence strategy:**
- After every write operation (insert/update), call `persistDB()` which serializes the database to a Uint8Array and stores it in IndexedDB under key `story-quest-db`
- On init, check IndexedDB first. If blob exists, restore from it. If not, create fresh.
- Use a debounced persist (100ms) to batch rapid writes

## Pass Conditions

- [ ] sql.js loads and initializes without errors
- [ ] All 5 tables created with correct schemas
- [ ] Database persists across page reloads (IndexedDB round-trip)
- [ ] `createHero()` → `getHero()` returns the hero
- [ ] `importPack()` accepts a JSON object matching the pack schema and populates both tables
- [ ] `getPackSegment()` returns correct segment with all fields
- [ ] `createStory()` + `saveSegment()` × 3 + `getStorySegments()` returns segments in order
- [ ] `getStoryHistory()` returns formatted string suitable for Claude API context
- [ ] `destroyDB()` wipes everything cleanly
- [ ] No Dexie imports or references anywhere in this file
- [ ] File is complete and self-contained
