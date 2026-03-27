/**
 * storyDB.js — SQLite storage layer for Story Quest
 * Uses sql.js (WebAssembly) with IndexedDB persistence.
 * Completely separate from SuperConci's Dexie setup.
 */

import initSqlJs from 'sql.js';

const IDB_KEY = 'story-quest-db';
const IDB_STORE = 'sqliteStore';
const IDB_DB_NAME = 'StoryQuestSQLite';

let db = null;
let persistTimeout = null;

// ─── IndexedDB helpers ───────────────────────────────────────────────

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIDB() {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(IDB_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => idb.close();
  });
}

async function saveToIDB(data) {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(data, IDB_KEY);
    tx.oncomplete = () => { idb.close(); resolve(); };
    tx.onerror = () => { idb.close(); reject(tx.error); };
  });
}

async function clearIDB() {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.delete(IDB_KEY);
    tx.oncomplete = () => { idb.close(); resolve(); };
    tx.onerror = () => { idb.close(); reject(tx.error); };
  });
}

// ─── Schema ──────────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS heroes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Coci',
  description TEXT,
  hair_color TEXT,
  hair_style TEXT,
  skin_tone TEXT,
  eye_color TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS story_packs (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  title TEXT NOT NULL,
  reading_level INTEGER NOT NULL DEFAULT 1,
  target_age_min INTEGER DEFAULT 4,
  target_age_max INTEGER DEFAULT 8,
  imported_at TEXT DEFAULT (datetime('now'))
);

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
`;

// ─── Database lifecycle ──────────────────────────────────────────────

export async function initDB() {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  const saved = await loadFromIDB();
  if (saved) {
    db = new SQL.Database(new Uint8Array(saved));
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    await persistDB();
  }

  return db;
}

export async function persistDB() {
  if (!db) return;
  const data = db.export();
  await saveToIDB(data);
}

function schedulePersist() {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => persistDB(), 100);
}

export async function destroyDB() {
  if (db) {
    db.close();
    db = null;
  }
  await clearIDB();
}

// ─── Query helpers ───────────────────────────────────────────────────

function run(sql, params = {}) {
  db.run(sql, params);
  schedulePersist();
}

function getOne(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    result = {};
    cols.forEach((col, i) => { result[col] = vals[i]; });
  }
  stmt.free();
  return result;
}

function getAll(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  const cols = stmt.getColumnNames();
  while (stmt.step()) {
    const vals = stmt.get();
    const row = {};
    cols.forEach((col, i) => { row[col] = vals[i]; });
    results.push(row);
  }
  stmt.free();
  return results;
}

function getLastInsertId() {
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

// ─── Heroes ──────────────────────────────────────────────────────────

export function createHero({ profileId, name = 'Coci', description, hairColor, hairStyle, skinTone, eyeColor }) {
  run(
    `INSERT INTO heroes (profile_id, name, description, hair_color, hair_style, skin_tone, eye_color)
     VALUES ($profileId, $name, $description, $hairColor, $hairStyle, $skinTone, $eyeColor)`,
    { $profileId: profileId, $name: name, $description: description, $hairColor: hairColor, $hairStyle: hairStyle, $skinTone: skinTone, $eyeColor: eyeColor }
  );
  return getLastInsertId();
}

export function getHero(profileId) {
  return getOne('SELECT * FROM heroes WHERE profile_id = $profileId ORDER BY created_at DESC LIMIT 1', { $profileId: profileId });
}

export function updateHero(heroId, updates) {
  const fields = [];
  const params = { $heroId: heroId };
  const fieldMap = {
    name: 'name', description: 'description', hairColor: 'hair_color',
    hairStyle: 'hair_style', skinTone: 'skin_tone', eyeColor: 'eye_color',
  };
  for (const [key, col] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      fields.push(`${col} = $${key}`);
      params[`$${key}`] = updates[key];
    }
  }
  if (fields.length === 0) return;
  run(`UPDATE heroes SET ${fields.join(', ')} WHERE id = $heroId`, params);
}

// ─── Story Packs ─────────────────────────────────────────────────────

export function importPack(packJSON) {
  const { id, worldId, title, readingLevel, targetAgeMin, targetAgeMax, segments } = packJSON;

  run(
    `INSERT OR REPLACE INTO story_packs (id, world_id, title, reading_level, target_age_min, target_age_max)
     VALUES ($id, $worldId, $title, $readingLevel, $targetAgeMin, $targetAgeMax)`,
    { $id: id, $worldId: worldId, $title: title, $readingLevel: readingLevel || 1, $targetAgeMin: targetAgeMin || 4, $targetAgeMax: targetAgeMax || 8 }
  );

  for (const seg of segments) {
    run(
      `INSERT INTO pack_segments (pack_id, segment_id, type, text, choices, next_map, ai_context, ai_prompt, allow_free_text, fallback_text, fallback_choices)
       VALUES ($packId, $segmentId, $type, $text, $choices, $nextMap, $aiContext, $aiPrompt, $allowFreeText, $fallbackText, $fallbackChoices)`,
      {
        $packId: id,
        $segmentId: seg.segmentId,
        $type: seg.type,
        $text: seg.text || null,
        $choices: seg.choices ? JSON.stringify(seg.choices) : null,
        $nextMap: seg.nextMap ? JSON.stringify(seg.nextMap) : null,
        $aiContext: seg.aiContext || null,
        $aiPrompt: seg.aiPrompt || null,
        $allowFreeText: seg.allowFreeText ? 1 : 0,
        $fallbackText: seg.fallbackText || null,
        $fallbackChoices: seg.fallbackChoices ? JSON.stringify(seg.fallbackChoices) : null,
      }
    );
  }
}

export function getPack(packId) {
  return getOne('SELECT * FROM story_packs WHERE id = $packId', { $packId: packId });
}

export function getPacksForWorld(worldId) {
  return getAll('SELECT * FROM story_packs WHERE world_id = $worldId', { $worldId: worldId });
}

export function removePack(packId) {
  run('DELETE FROM pack_segments WHERE pack_id = $packId', { $packId: packId });
  run('DELETE FROM story_packs WHERE id = $packId', { $packId: packId });
}

export function getPackSegment(packId, segmentId) {
  const row = getOne(
    'SELECT * FROM pack_segments WHERE pack_id = $packId AND segment_id = $segmentId',
    { $packId: packId, $segmentId: segmentId }
  );
  if (row) {
    if (row.choices) row.choices = JSON.parse(row.choices);
    if (row.next_map) row.next_map = JSON.parse(row.next_map);
    if (row.fallback_choices) row.fallback_choices = JSON.parse(row.fallback_choices);
    row.allow_free_text = !!row.allow_free_text;
  }
  return row;
}

// ─── Stories ─────────────────────────────────────────────────────────

export function createStory({ profileId, heroId, packId, worldId }) {
  run(
    `INSERT INTO stories (profile_id, hero_id, pack_id, world_id)
     VALUES ($profileId, $heroId, $packId, $worldId)`,
    { $profileId: profileId, $heroId: heroId, $packId: packId, $worldId: worldId }
  );
  return getLastInsertId();
}

export function getActiveStories(profileId) {
  return getAll(
    "SELECT * FROM stories WHERE profile_id = $profileId AND status = 'active' ORDER BY last_played DESC",
    { $profileId: profileId }
  );
}

export function getCompletedStories(profileId) {
  return getAll(
    "SELECT * FROM stories WHERE profile_id = $profileId AND status = 'completed' ORDER BY last_played DESC",
    { $profileId: profileId }
  );
}

export function getStory(storyId) {
  const story = getOne('SELECT * FROM stories WHERE id = $storyId', { $storyId: storyId });
  if (story) {
    story.segments = getStorySegments(storyId);
  }
  return story;
}

export function updateStoryStatus(storyId, status) {
  run("UPDATE stories SET status = $status, last_played = datetime('now') WHERE id = $storyId", { $storyId: storyId, $status: status });
}

export function updateStoryTitle(storyId, title) {
  run('UPDATE stories SET title = $title WHERE id = $storyId', { $storyId: storyId, $title: title });
}

// ─── Story Segments ──────────────────────────────────────────────────

export function saveSegment({ storyId, segmentNumber, packSegmentId, content, source, choicesShown, selectedChoice, freeTextInput, safetyPassed }) {
  run(
    `INSERT INTO story_segments (story_id, segment_number, pack_segment_id, content, source, choices_shown, selected_choice, free_text_input, safety_passed)
     VALUES ($storyId, $segmentNumber, $packSegmentId, $content, $source, $choicesShown, $selectedChoice, $freeTextInput, $safetyPassed)`,
    {
      $storyId: storyId,
      $segmentNumber: segmentNumber,
      $packSegmentId: packSegmentId || null,
      $content: content,
      $source: source,
      $choicesShown: choicesShown ? JSON.stringify(choicesShown) : null,
      $selectedChoice: selectedChoice ?? null,
      $freeTextInput: freeTextInput || null,
      $safetyPassed: safetyPassed !== undefined ? (safetyPassed ? 1 : 0) : 1,
    }
  );

  // Update story's current segment and last_played
  run(
    "UPDATE stories SET current_segment = $segmentNumber, last_played = datetime('now') WHERE id = $storyId",
    { $storyId: storyId, $segmentNumber: segmentNumber }
  );

  return getLastInsertId();
}

export function getStorySegments(storyId) {
  return getAll(
    'SELECT * FROM story_segments WHERE story_id = $storyId ORDER BY segment_number',
    { $storyId: storyId }
  );
}

export function getStoryHistory(storyId) {
  const segments = getStorySegments(storyId);
  if (segments.length === 0) return '';

  return segments.map((seg) => {
    let entry = `[Segment ${seg.segment_number}] ${seg.content}`;
    if (seg.selected_choice !== null && seg.choices_shown) {
      const choices = JSON.parse(seg.choices_shown);
      entry += `\nChoice: ${choices[seg.selected_choice] || `Option ${seg.selected_choice}`}`;
    }
    if (seg.free_text_input) {
      entry += `\nHero said: "${seg.free_text_input}"`;
    }
    return entry;
  }).join('\n\n');
}
