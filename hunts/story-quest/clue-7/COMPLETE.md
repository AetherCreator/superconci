# Clue 7: COMPLETE — Safety Pipeline

## What Was Built

### `src/games/story-quest/engine/SafetyCheck.js`
- **checkSafety(segmentText, apiKey)** — fast API call to classify content safety. Returns `{ safe, reason }`. Fails open on all errors.
- **runSafetyPipeline({...})** — full pipeline: check → bridge transition → 2 retries with stricter prompts → pack fallback
- **BRIDGE_TRANSITIONS** — per-world bridge text for covering regeneration (exported)
- **RETRY_ADDENDUMS** — progressively stricter prompt additions

### Behavior
1. Safe content → immediate return, no retries
2. Unsafe → show bridge transition → retry with gentler prompt → retry with strictest prompt → pack fallback
3. Retries are buffered (not streamed to screen)
4. Every result has `source`: 'ai', 'ai_retry', or 'fallback'
5. Fail-open on all errors (API, network, JSON parse)

## What Clue 8 Inherits
- Safety pipeline integrates after AI streaming completes, before choices render
- StoryPlayer should: stream text via typewriter → run safety → if safe, show choices → if unsafe, animate bridge transition → replace text with regenerated/fallback content → show choices
- `BRIDGE_TRANSITIONS` exported for bridge text display
- `source` field tells the save system whether content came from AI, retry, or fallback
