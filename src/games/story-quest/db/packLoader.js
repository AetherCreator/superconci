/**
 * packLoader.js — Story pack validation, import, and runtime utilities.
 * Packs are authored as JSON in src/games/story-quest/packs/
 * and imported into SQLite at runtime via storyDB.
 */

import {
  importPack as dbImportPack,
  getPack as dbGetPack,
  getPacksForWorld,
  removePack as dbRemovePack,
  persistDB,
} from './storyDB.js';

// ─── Validation ──────────────────────────────────────────────────────

const REQUIRED_PACK_FIELDS = ['id', 'world', 'title', 'readingLevel', 'segments'];
const REQUIRED_SEGMENT_FIELDS = ['id', 'type'];
const VALID_SEGMENT_TYPES = ['procedural', 'ai_moment'];
const VALID_ENDING_TYPES = ['triumph', 'bittersweet', 'cliffhanger', 'cozy'];

export function validatePack(packJSON) {
  const errors = [];

  // Required top-level fields
  for (const field of REQUIRED_PACK_FIELDS) {
    if (packJSON[field] === undefined || packJSON[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof packJSON.readingLevel === 'number' && (packJSON.readingLevel < 1 || packJSON.readingLevel > 5)) {
    errors.push('readingLevel must be between 1 and 5');
  }

  if (!Array.isArray(packJSON.segments) || packJSON.segments.length === 0) {
    errors.push('segments must be a non-empty array');
    return { valid: false, errors };
  }

  // Collect all segment IDs for reference checking
  const segmentIds = new Set();
  const duplicateIds = [];

  for (const seg of packJSON.segments) {
    if (segmentIds.has(seg.id)) {
      duplicateIds.push(seg.id);
    }
    segmentIds.add(seg.id);
  }

  if (duplicateIds.length > 0) {
    errors.push(`Duplicate segment ids: ${duplicateIds.join(', ')}`);
  }

  // Validate each segment
  for (const seg of packJSON.segments) {
    for (const field of REQUIRED_SEGMENT_FIELDS) {
      if (seg[field] === undefined || seg[field] === null) {
        errors.push(`Segment missing required field: ${field}`);
      }
    }

    if (seg.type && !VALID_SEGMENT_TYPES.includes(seg.type)) {
      errors.push(`Segment ${seg.id}: invalid type "${seg.type}". Must be one of: ${VALID_SEGMENT_TYPES.join(', ')}`);
    }

    if (seg.isEnding && seg.endingType && !VALID_ENDING_TYPES.includes(seg.endingType)) {
      errors.push(`Segment ${seg.id}: invalid endingType "${seg.endingType}". Must be one of: ${VALID_ENDING_TYPES.join(', ')}`);
    }

    // Check nextMap references point to existing segments
    if (seg.nextMap && typeof seg.nextMap === 'object') {
      for (const [choice, targetId] of Object.entries(seg.nextMap)) {
        if (!segmentIds.has(targetId)) {
          errors.push(`Segment ${seg.id}: nextMap choice "${choice}" references non-existent segment ${targetId}`);
        }
      }
    }

    // AI moments must have fallback
    if (seg.type === 'ai_moment') {
      if (!seg.fallback) {
        errors.push(`Segment ${seg.id}: ai_moment must have a fallback object`);
      } else {
        if (!seg.fallback.text) {
          errors.push(`Segment ${seg.id}: ai_moment fallback must have text`);
        }
        if (seg.fallback.nextMap) {
          for (const [choice, targetId] of Object.entries(seg.fallback.nextMap)) {
            if (!segmentIds.has(targetId)) {
              errors.push(`Segment ${seg.id}: fallback nextMap choice "${choice}" references non-existent segment ${targetId}`);
            }
          }
        }
      }

      if (seg.branchHints && typeof seg.branchHints === 'object') {
        for (const [hint, targetId] of Object.entries(seg.branchHints)) {
          if (!segmentIds.has(targetId)) {
            errors.push(`Segment ${seg.id}: branchHint "${hint}" references non-existent segment ${targetId}`);
          }
        }
      }
    }

    // Non-ending procedural segments should have choices and nextMap
    if (seg.type === 'procedural' && !seg.isEnding) {
      if (!seg.choices || !Array.isArray(seg.choices) || seg.choices.length === 0) {
        errors.push(`Segment ${seg.id}: procedural segment must have choices (unless isEnding)`);
      }
      if (!seg.nextMap || typeof seg.nextMap !== 'object') {
        errors.push(`Segment ${seg.id}: procedural segment must have nextMap (unless isEnding)`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Import ──────────────────────────────────────────────────────────

// Track imported pack versions to avoid re-import
const importedVersions = new Map();

export function isPackCurrent(packId, version) {
  return importedVersions.get(packId) === version;
}

export function importPack(packJSON) {
  const validation = validatePack(packJSON);
  if (!validation.valid) {
    return { success: false, segmentCount: 0, errors: validation.errors };
  }

  const version = packJSON.version || 1;

  // Skip if already imported at this version
  if (isPackCurrent(packJSON.id, version)) {
    return { success: true, segmentCount: packJSON.segments.length, skipped: true };
  }

  // If re-importing, remove old data first
  dbRemovePack(packJSON.id);

  // Transform to storyDB format
  const dbPack = {
    id: packJSON.id,
    worldId: packJSON.world,
    title: packJSON.title,
    readingLevel: packJSON.readingLevel,
    targetAgeMin: packJSON.targetAge ? packJSON.targetAge[0] : 4,
    targetAgeMax: packJSON.targetAge ? packJSON.targetAge[1] : 8,
    segments: packJSON.segments.map((seg) => ({
      segmentId: seg.id,
      type: seg.type,
      text: seg.text || null,
      choices: seg.choices || (seg.fallback ? seg.fallback.choices : null),
      nextMap: seg.nextMap || (seg.fallback ? seg.fallback.nextMap : null),
      aiContext: seg.context || null,
      aiPrompt: seg.prompt || null,
      allowFreeText: !!seg.allowFreeText,
      fallbackText: seg.fallback ? seg.fallback.text : null,
      fallbackChoices: seg.fallback ? seg.fallback.choices : null,
    })),
  };

  dbImportPack(dbPack);
  importedVersions.set(packJSON.id, version);

  return { success: true, segmentCount: packJSON.segments.length };
}

export async function importAllPacks() {
  // Dynamically import all pack JSON files from the packs/ directory
  const packModules = import.meta.glob('../packs/*.json', { eager: true });

  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (const [path, module] of Object.entries(packModules)) {
    const packJSON = module.default || module;
    const result = importPack(packJSON);

    if (result.success) {
      if (result.skipped) {
        skipped++;
      } else {
        imported++;
      }
    } else {
      errors.push(`${path}: ${result.errors.join('; ')}`);
    }
  }

  await persistDB();
  return { imported, skipped, errors };
}

// ─── Removal ─────────────────────────────────────────────────────────

export function removePack(packId) {
  dbRemovePack(packId);
  importedVersions.delete(packId);
  return true;
}

// ─── Pack metadata ───────────────────────────────────────────────────

export function getPackMeta(packId) {
  const pack = dbGetPack(packId);
  if (!pack) return null;
  return {
    id: pack.id,
    world: pack.world_id,
    title: pack.title,
    readingLevel: pack.reading_level,
    targetAge: [pack.target_age_min, pack.target_age_max],
  };
}

export function getWorldPacks(worldId) {
  const packs = getPacksForWorld(worldId);
  return packs.sort((a, b) => a.reading_level - b.reading_level);
}

// ─── Placeholder replacement ─────────────────────────────────────────

export function injectHero(text, hero) {
  if (!text) return text;
  return text
    .replace(/\[NAME\]/g, hero.name || 'Coci')
    .replace(/\[PRONOUN\]/g, hero.pronoun || 'he')
    .replace(/\[POSSESSIVE\]/g, hero.possessive || 'his')
    .replace(/\[HERO_DESCRIPTION\]/g, hero.description || '');
}

// ─── Branch resolution ───────────────────────────────────────────────

export function resolveBranch(aiChoice, branchHints) {
  if (!branchHints || typeof branchHints !== 'object') return null;

  const choiceLower = (aiChoice || '').toLowerCase();
  const hints = Object.entries(branchHints);

  if (hints.length === 0) return null;

  // Try to match choice text against hint keywords
  let bestMatch = null;
  let bestScore = 0;

  for (const [keyword, segmentId] of hints) {
    const keyLower = keyword.toLowerCase();
    // Check if the keyword appears in the choice text
    if (choiceLower.includes(keyLower)) {
      const score = keyLower.length; // Longer matches are better
      if (score > bestScore) {
        bestScore = score;
        bestMatch = segmentId;
      }
    }
  }

  // Fallback: return the first hint's segment
  return bestMatch !== null ? bestMatch : hints[0][1];
}
