# Clue 8: Story Player UI — Typewriter + Choices + Free Text

## Mission
Build the screen where Conci actually plays the story. Text typewriters onto the screen, choices appear as big tappable buttons, free text input shows when the pack allows it, and the avatar reacts to the story mood. This is where the magic happens.

## Context
- Receives text and choices from StoryEngine (Clue 6)
- Safety pipeline (Clue 7) runs between text rendering and choice display for AI moments
- Avatar (Clue 4) shows in bottom-left with expression matching story mood
- World-specific background colors/theme from WorldSelector data
- Save happens after choice selection (Clue 9 handles persistence)
- Must feel like a storybook coming alive

## Build

### File: `src/games/story-quest/player/Typewriter.js`

**Character-by-character text animation engine:**

```javascript
class Typewriter {
  constructor({
    onChar,        // callback(char) — each character as it appears
    onWord,        // callback(word) — each complete word (for expression detection)
    onComplete,    // callback() — all text rendered
    speed = 40     // ms per character (40ms = ~25 chars/sec, natural reading pace for a kid)
  })

  // Start typing text (for procedural segments — text is already available)
  typeText(text) → Promise<void>

  // Receive streaming chunks (for AI segments — text arrives in pieces)
  addChunk(textDelta) → void   // buffers and types at consistent speed

  // Signal that streaming is complete (flush remaining buffer)
  endStream() → void

  // Control
  skip() → void    // Immediately show all remaining text (tap-to-skip)
  pause() → void
  resume() → void
  
  // Speed adjustment
  setSpeed(ms) → void   // For parent settings or adaptive pacing
}
```

**Key behaviors:**
- For procedural segments: full text is known upfront, typewriter animates it character by character
- For AI streaming: chunks arrive from StreamHandler, Typewriter buffers and plays them at a consistent pace. If chunks arrive faster than typing speed, buffer grows. If slower, typing naturally pauses (feels like the narrator is thinking).
- `onWord` fires after each complete word — used for expression detection
- `skip()` on tap shows all remaining text instantly (impatient kid UX)

### File: `src/games/story-quest/player/StoryPlayer.jsx`

**Layout (iPhone portrait):**

```
┌────────────────────────┐
│  World Header Bar      │  ← world icon + name, small
├────────────────────────┤
│                        │
│   Story Text Area      │  ← scrollable, text typewriters here
│   (70% of screen)      │
│                        │
│                        │
│  [Avatar]              │  ← bottom-left, small, animated
├────────────────────────┤
│  Choice Buttons        │  ← 2-3 buttons, stacked vertically
│  (or Free Text Input)  │
│  (or "tap to continue")│
└────────────────────────┘
```

**Story Text Area:**
- Dark background with world-specific tint (from world bgGradient)
- Text in light color, readable font (not Press Start 2P — a clean serif or sans-serif for readability at reading level 3)
- Font size: 18-20px for readability on iPhone
- Previous segments show dimmed above current segment (scrollable history)
- Current segment text typewriters at the bottom of the scroll area
- Auto-scrolls down as new text appears
- Tap anywhere on text area during typewriter → `skip()` to show all text immediately

**Choice Buttons:**
- Appear AFTER typewriter completes (+ after safety check for AI moments)
- 2-3 buttons stacked vertically, full-width
- Minimum 48px height each, generous padding
- World-colored background with white text
- Brief appear animation (fade + slide up, 200ms)
- On tap: button pulses, choice is locked in, advance to next segment

**Free Text Input:**
- Shows when `allowFreeText` is true (from pack data or AI response)
- Friendly prompt: "What do YOU want to do?"
- Large text input field with Submit button
- Soft keyboard opens — text area scrolls to stay visible
- On submit: input sent to StoryEngine.submitFreeText(), advance

**Avatar Integration:**
- Import Avatar component from Clue 4
- Position: fixed bottom-left, overlapping the text area edge slightly
- Expression updates on each `onWord` callback via `detectExpression()`
- World costume matches current world

**Segment Transitions:**
- Between segments: brief fade/dissolve (300ms)
- Bridge transitions (from safety pipeline): text appears in italic, dimmed, with a shimmer effect
- Story ending: special treatment — text centers, larger font, "The End" badge, fireworks/sparkle CSS animation

**Loading States:**
- AI moment loading: avatar does a "thinking" animation (eyes look up, slight bounce)
- Text: "The storyteller is weaving your adventure..."
- If loading takes >5s: add "Almost there..." reassurance

**Props:**
```javascript
{
  storyEngine: StoryEngine,    // Engine instance from Clue 6
  hero: HeroData,              // For avatar rendering
  worldId: string,             // For theming
  onExit: () => void,          // Back to world selector
  onStoryComplete: (storyId) => void
}
```

## Pass Conditions

- [ ] Typewriter animates text character by character at ~25 chars/sec
- [ ] Typewriter handles both full-text (procedural) and streaming chunks (AI) smoothly
- [ ] Tap on text area during typewriter → shows all remaining text instantly
- [ ] Choice buttons appear only after typewriter completes
- [ ] Choice buttons are stacked vertically, full-width, ≥48px height
- [ ] Free text input shows when allowFreeText is true
- [ ] Free text input scrolls properly when soft keyboard opens on iPhone
- [ ] Avatar renders in bottom-left with correct colors and world costume
- [ ] Avatar expression changes based on story text keywords
- [ ] Previous segments visible by scrolling up, dimmed
- [ ] Bridge transition text (from safety pipeline) renders in italic/dimmed
- [ ] Story ending shows "The End" treatment with celebration animation
- [ ] Loading state shows avatar thinking animation + reassurance text
- [ ] All touch targets ≥44×44px
- [ ] Readable on iPhone in portrait — text size ≥18px, good contrast
- [ ] No audio (Clue 10 handles that separately)
- [ ] Complete files, no fragments
