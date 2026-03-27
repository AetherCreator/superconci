# Clue 6: COMPLETE — Story Engine (Procedural + AI Hybrid)

## What Was Built

### `src/games/story-quest/engine/StoryEngine.js`
Core playback engine:
- **playSegment(segmentId)** — routes to procedural or AI moment handlers
- **playProcedural()** — injects hero placeholders, emits text + choices via callbacks
- **playAIMoment()** — streams from Claude API, falls back to pack data on failure
- **playFallback()** — offline/error fallback using pack's fallback text + choices
- **selectChoice(choiceIndex, choiceText)** — resolves next segment via nextMap or branchHints
- **submitFreeText(userText)** — queues user input for next AI call
- **playWrapUp()** — forces conclusion at segment 20 via AI or fallback
- **loadHistory(existingSegments)** — restores state for resume
- **getFormattedHistory()** — builds context string for Claude API

Callbacks: onSegment(text, source), onChoices(choices, allowFreeText), onEnding(text), onError(error)

### `src/games/story-quest/engine/StreamHandler.js`
Claude API streaming handler:
- **stream()** — SSE streaming with delimiter parsing
- Delimiter pattern: text streams → `---CHOICES---` → JSON choices
- **parseSSEChunk()** — extracts text deltas from content_block_delta events
- System prompts with hero name, description, world, safety rules
- Wrap-up variant prompt for story conclusions
- Handles: missing delimiter (default choices), JSON parse failure (default choices)

## What Clue 7 Inherits
- StoryEngine emits text via `onSegment(text, source)` where source is 'pack', 'ai-stream', or 'fallback'
- Source 'ai-stream' means text comes in chunks (for typewriter effect)
- Source 'pack'/'fallback' means text arrives all at once
- Safety pipeline needs to intercept AI segments after streaming completes, before choices render
- Engine's `currentSource` field indicates whether safety check is needed (only for 'ai')
