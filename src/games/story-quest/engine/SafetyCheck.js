/**
 * SafetyCheck.js — Content safety pipeline for AI-generated story segments.
 * Render-then-check: text appears via typewriter, safety runs after.
 * Only AI segments are checked — pack content is safe by authorship.
 */

import { injectHero } from '../db/packLoader.js';

const API_URL = '/api/claude';

// Retry prompts, progressively stricter
const RETRY_ADDENDUMS = [
  'Keep the tone lighter and more whimsical. Avoid any tension or conflict in this segment. Focus on wonder and discovery.',
  'Write the safest, gentlest, most lighthearted segment possible. No conflict, no tension, no suspense. Pure joy, wonder, and silliness.',
];

// Per-world bridge transitions — shown during regeneration
const BRIDGE_TRANSITIONS = {
  'iron-rails': 'The train whistle sang a cheerful tune as the tracks shifted to a new path...',
  'star-sector': 'The stars outside the window rearranged themselves, pointing to a new destination...',
  'old-realm': 'A friendly breeze swept through the forest, carrying whispers of a different adventure...',
  'wild-earth': 'A curious bird landed nearby and chirped, as if telling a different story...',
  'hero-city': 'The hero signal in the sky shifted colors, pointing toward a new mission...',
  'road-ever-on': 'The road bent gently around a hill, revealing something unexpected on the other side...',
};

// Check if a segment is appropriate for a 5-year-old
export async function checkSafety(segmentText, apiKey) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        system: `You are a child content safety reviewer. You will receive a story segment written for a 5-year-old. Evaluate whether it is appropriate. Return ONLY a JSON object, no other text.

SAFE content includes: mild cartoon action, gentle conflict, wonder, discovery, humor, friendship challenges, mild suspense with positive resolution, fantasy elements.

UNSAFE content includes: violence beyond mild cartoon action (no injuries described, no weapons used against characters), genuinely scary imagery (dark creatures, threatening environments without safety), death or serious injury, adult themes, cruel behavior, exclusion or bullying portrayed positively, anything that would cause a 5-year-old distress at bedtime.

When in doubt, mark as safe. This check is for catching obvious problems, not for being overly cautious.

Return format: { "safe": true } or { "safe": false, "reason": "brief explanation" }`,
        messages: [{
          role: 'user',
          content: `Is this appropriate for a 5-year-old?\n\n"${segmentText}"`,
        }],
      }),
    });

    if (!response.ok) {
      // API error — fail open
      return { safe: true, reason: null };
    }

    const data = await response.json();
    const text = data.content[0]?.text || '';

    try {
      const result = JSON.parse(text.replace(/```json|```/g, '').trim());
      return { safe: result.safe !== false, reason: result.reason || null };
    } catch (e) {
      // JSON parse failure — fail open
      return { safe: true, reason: null };
    }
  } catch (e) {
    // Network error — fail open
    return { safe: true, reason: null };
  }
}

// Run the complete safety pipeline for an AI-generated segment
export async function runSafetyPipeline({
  segmentText,
  worldId,
  aiSegment,
  heroData,
  history,
  apiKey,
  onTransition,
  onRegenerated,
  onFallback,
  streamHandler,
}) {
  // Step 1: Check the original segment
  const check = await checkSafety(segmentText, apiKey);

  if (check.safe) {
    return { safe: true, text: segmentText, source: 'ai' };
  }

  // Step 2: Trigger bridge transition
  const bridge = BRIDGE_TRANSITIONS[worldId] || 'The story took an unexpected turn...';
  if (onTransition) onTransition(bridge);

  // Step 3: Retry up to 2 times with stricter prompts
  for (let retry = 0; retry < 2; retry++) {
    try {
      const retryResult = await streamHandler.stream({
        prompt: (aiSegment.ai_prompt || 'Continue the story.') + '\n\n' + RETRY_ADDENDUMS[retry],
        context: aiSegment.ai_context || '',
        history: history,
        freeTextInput: null,
        isWrapUp: false,
        onTextChunk: () => {}, // Buffer silently — don't stream retries to screen
      });

      const retryCheck = await checkSafety(retryResult.text, apiKey);

      if (retryCheck.safe) {
        if (onRegenerated) onRegenerated(retryResult);
        return { safe: true, text: retryResult.text, source: 'ai_retry', retryCount: retry + 1 };
      }
    } catch (e) {
      // Retry failed — continue to next retry or fallback
    }
  }

  // Step 4: All retries failed — use pack fallback
  const fallbackText = injectHero(aiSegment.fallback_text, heroData);
  const fallbackChoices = aiSegment.fallback_choices
    ? aiSegment.fallback_choices.map((c) => injectHero(c, heroData))
    : ['Continue the adventure'];

  if (onFallback) {
    onFallback({ text: fallbackText, choices: fallbackChoices });
  }

  return { safe: true, text: fallbackText, source: 'fallback' };
}

export { BRIDGE_TRANSITIONS };
