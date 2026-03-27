# Clue 7: Content Safety Pipeline

## Mission
Build the safety seatbelt that checks AI-generated content before choices appear. Render-then-check pattern — text is already on screen, but unsafe content gets transitioned away and never saved.

## Context
- **Only AI-generated segments need checking.** Procedural pack content is safe by authorship (Tyler wrote it).
- Safety check runs AFTER streaming completes, BEFORE choices render.
- Pattern: render-then-check, 2 retries with progressively stricter prompts, then pack fallback.
- Unsafe segments are never saved to SQLite.
- This is a seatbelt, not a steering wheel — the generation prompt already has strong guardrails.

## Design Decision (Locked)
- **Approach:** Render-then-check — text appears via typewriter during stream, safety runs after
- **On failure:** Transition away with bridge animation, retry up to 2 times, then use pack fallback
- **Retries:** 2 max, each with stricter system prompt language
- **Cost:** Only 3-4 safety checks per story (one per AI moment)

## Build

### File: `src/games/story-quest/engine/SafetyCheck.js`

**Core function:**

```javascript
// Check if a generated segment is appropriate for a 5-year-old
// Returns: { safe: boolean, reason: string | null }
async function checkSafety(segmentText) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: `You are a child content safety reviewer. You will receive a story segment written for a 5-year-old. Evaluate whether it is appropriate. Return ONLY a JSON object, no other text.

SAFE content includes: mild cartoon action, gentle conflict, wonder, discovery, humor, friendship challenges, mild suspense with positive resolution, fantasy elements.

UNSAFE content includes: violence beyond mild cartoon action (no injuries described, no weapons used against characters), genuinely scary imagery (dark creatures, threatening environments without safety), death or serious injury, adult themes, cruel behavior, exclusion or bullying portrayed positively, anything that would cause a 5-year-old distress at bedtime.

When in doubt, mark as safe. This check is for catching obvious problems, not for being overly cautious.`,
      messages: [{
        role: 'user',
        content: `Is this appropriate for a 5-year-old?\n\n"${segmentText}"`
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0]?.text || '';

  try {
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { safe: result.safe !== false, reason: result.reason || null };
  } catch (e) {
    // If we can't parse the safety response, assume safe
    // (fail-open — the generation prompt has guardrails)
    return { safe: true, reason: null };
  }
}
```

**Retry cascade with stricter prompts:**

```javascript
// Regeneration prompts, progressively stricter
const RETRY_ADDENDUMS = [
  // Retry 1: Gentle course correction
  'Keep the tone lighter and more whimsical. Avoid any tension or conflict in this segment. Focus on wonder and discovery.',

  // Retry 2: Maximum safety
  'Write the safest, gentlest, most lighthearted segment possible. No conflict, no tension, no suspense. Pure joy, wonder, and silliness.'
];
```

**Bridge transitions (per-world, pre-written):**
When safety transitions away from unsafe content, the kid needs a seamless cover. These are brief, world-themed transition texts displayed during regeneration:

```javascript
const BRIDGE_TRANSITIONS = {
  iron_rails: "The train whistle sang a cheerful tune as the tracks shifted to a new path...",
  star_sector: "The stars outside the window rearranged themselves, pointing to a new destination...",
  old_realm: "A friendly breeze swept through the forest, carrying whispers of a different adventure...",
  wild_earth: "A curious bird landed nearby and chirped, as if telling a different story...",
  hero_city: "The hero signal in the sky shifted colors, pointing toward a new mission...",
  road_ever_on: "The road bent gently around a hill, revealing something unexpected on the other side..."
};
```

**Full safety pipeline function:**

```javascript
// Run the complete safety pipeline for an AI-generated segment
// Integrates with StoryEngine from Clue 6
async function runSafetyPipeline({
  segmentText,         // The AI-generated text already shown to the kid
  worldId,             // For bridge transition selection
  aiSegment,           // The pack's ai_moment segment definition
  heroData,            // For regeneration
  history,             // Story history for regeneration
  onTransition,        // Callback: show bridge transition text
  onRegenerated,       // Callback: new safe text ready
  onFallback,          // Callback: using pack fallback
  streamHandler        // StreamHandler instance from Clue 6
}) {
  // Step 1: Check the original segment
  const check = await checkSafety(segmentText);

  if (check.safe) {
    return { safe: true, text: segmentText, source: 'ai' };
  }

  // Step 2: Trigger bridge transition
  onTransition(BRIDGE_TRANSITIONS[worldId]);

  // Step 3: Retry up to 2 times with stricter prompts
  for (let retry = 0; retry < 2; retry++) {
    try {
      const retryResult = await streamHandler.stream({
        prompt: aiSegment.ai_prompt + '\n\n' + RETRY_ADDENDUMS[retry],
        context: aiSegment.ai_context,
        history: history,
        onTextChunk: () => {} // Buffer silently during retry — don't stream to screen
      });

      const retryCheck = await checkSafety(retryResult.text);

      if (retryCheck.safe) {
        onRegenerated(retryResult);
        return { safe: true, text: retryResult.text, source: 'ai_retry', retryCount: retry + 1 };
      }
    } catch (e) {
      // Retry failed — continue to next retry or fallback
    }
  }

  // Step 4: All retries failed — use pack fallback
  const fallbackText = injectHero(aiSegment.fallback.text, heroData);
  onFallback({
    text: fallbackText,
    choices: aiSegment.fallback.choices
  });
  return { safe: true, text: fallbackText, source: 'fallback' };
}
```

**Key behaviors:**
- Safety check is a fast, cheap API call (~100ms, minimal tokens)
- Retries are buffered — NOT streamed to screen. Only the final safe text renders.
- Bridge transition covers the regeneration time with world-themed text
- Pack fallback is the final safety net — always works, always safe, always available
- If safety check API itself fails (network error), **fail open** — assume safe. The generation prompt has guardrails.
- Every result includes `source` field so the save system (Clue 9) knows what happened

## Pass Conditions

- [ ] `checkSafety()` returns `{ safe: true }` for normal children's story text
- [ ] `checkSafety()` returns `{ safe: false, reason: "..." }` for test text containing violence/fear
- [ ] `checkSafety()` fails open (returns safe) when API call fails or JSON parsing fails
- [ ] `runSafetyPipeline()` returns immediately for safe content — no retries triggered
- [ ] `runSafetyPipeline()` triggers bridge transition on first safety failure
- [ ] Retry 1 uses the first (gentler) addendum prompt
- [ ] Retry 2 uses the second (strictest) addendum prompt
- [ ] Retries are NOT streamed to screen — buffered silently
- [ ] After 2 failed retries, pack fallback is used
- [ ] Bridge transitions are world-specific (correct text for each worldId)
- [ ] Result object always includes `source` field ('ai', 'ai_retry', 'fallback')
- [ ] No rendering or UI — pure safety logic + API calls
- [ ] Complete file, no fragments
