# Clue 3: COMPLETE — Hero Creation (Camera + Vision API)

## What Was Built

### `src/games/story-quest/hero/HeroCreation.jsx`
4-step wizard component:
1. **Camera** — front-facing getUserMedia, 512px max resize, circular viewfinder, 72px shutter button
2. **Analyzing** — shimmer animation, Vision API call (Sonnet), photo cleared from state immediately after
3. **Approval** — description panel, avatar placeholder (for Clue 4), "That's me!" / "Try again"
4. **Name** — pre-filled "Coci", editable, saves to SQLite via createHero()

Two API calls:
- Call 1 (Vision): Photo → prose character description
- Call 2 (Parse): Description → structured traits from palette enums, with 1 retry + defaults fallback

Privacy: Photo base64 only ever in React state, cleared after Vision call, never touches storage.

### `src/games/story-quest/hero/avatarPalette.js`
- HAIR_COLORS (12 values with hex)
- HAIR_STYLES (6 values)
- SKIN_TONES (12 values with hex)
- EYE_COLORS (10 values with hex)
- DEFAULTS for fallback

## Props
- `profileId` — string, which kid profile
- `apiKey` — Anthropic API key
- `onComplete({ heroId, name, description, hairColor, hairStyle, skinTone, eyeColor })` — called when hero saved

## What Clue 4 Inherits
- Hero saved to SQLite with: name, description, hairColor, hairStyle, skinTone, eyeColor
- avatarPalette.js has all hex values for mapping trait enums to CSS colors
- HeroCreation.jsx has an avatar placeholder div ready for the Avatar component
- The parse call guarantees returned values are from the palette enums (or defaults)
