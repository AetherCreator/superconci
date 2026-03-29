# Clue 3: Hero Creation — Camera + Claude Vision API

## Mission
Build the hero creation flow: camera capture → Claude Vision describes the child → second call extracts structured avatar properties → kid approves their character. This is Conci's first impression of Story Quest. It must feel magical.

## Context
- Two API calls (design decision — locked):
  - **Call 1 (Vision):** Photo + prompt → beautiful prose character description
  - **Call 2 (Text parse):** Description string → structured avatar properties (enum values from medium palette)
- Photo is captured via HTML5 camera API, used for the single Vision call, then **discarded**. Never saved to storage. Never persisted anywhere.
- Avatar properties use a **medium palette** (12-15 curated values per trait). The parse call must return values from this palette, not freeform.
- Hero is saved to SQLite via `createHero()` from Clue 1.
- This flow runs once per hero. Kid can create a new hero anytime but it's not the hot path.

## Build

### File: `src/games/story-quest/hero/HeroCreation.jsx`

**Flow (4 steps rendered as a wizard):**

**Step 1: Camera**
- Full-screen camera viewfinder using `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })`
- Big circular shutter button (min 64×64px, centered bottom)
- "Take your hero photo!" header text
- On capture: grab frame to canvas, convert to base64 JPEG (quality 0.8, max 512px on longest edge — keep payload small)
- Show captured photo with "Use this photo" and "Try again" buttons (both 44×44px min)
- **Privacy:** The base64 string lives only in React state. It is passed to the API call and then the state is cleared. It never touches storage.

**Step 2: Vision Analysis (loading state)**
- Show the captured photo with a magical shimmer/sparkle animation overlay
- "The storyteller is meeting you..." loading text
- **API Call 1 — Vision:**
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: photoBase64 }
        },
        {
          type: 'text',
          text: `You are a warm, whimsical storyteller meeting a young hero for the first time. Look at this child's photo and write a 2-3 sentence character description for a storybook. Include: hair color and style, eye color, skin tone described warmly, and any distinctive joyful features. Write it as if introducing a beloved storybook character. Example tone: "Conci is a brave adventurer with wild curly dark hair, warm brown eyes that sparkle with curiosity, and a smile that could light up the whole galaxy." Be specific to what you see. Be warm. Be magical.`
        }
      ]
    }]
  })
});
```
- Extract the text description from response
- **Immediately clear the photo base64 from state** — it's no longer needed
- On error: show friendly message, offer "Try again" (re-take photo)

**Step 3: Character Approval**
- Display the generated description in a storybook-styled text panel
- Placeholder for avatar (Clue 4 will render the actual SVG here)
- "That's me!" button (big, celebratory, 44×44px min)
- "Try again" button (smaller, secondary — re-takes photo from Step 1)
- **API Call 2 — Parse (runs before rendering Step 3):**
```javascript
const parseResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: `You extract structured character traits from a description. Return ONLY a JSON object with no other text. Use ONLY these allowed values:

hairColor: "black" | "dark_brown" | "medium_brown" | "light_brown" | "auburn" | "red" | "strawberry_blonde" | "golden_blonde" | "platinum_blonde" | "gray" | "white" | "blue_black"
hairStyle: "curly" | "wavy" | "straight" | "coily" | "braided" | "short_cropped"
skinTone: "porcelain" | "fair" | "light" | "light_medium" | "medium" | "medium_tan" | "olive" | "tan" | "brown" | "dark_brown" | "deep_brown" | "deep"
eyeColor: "dark_brown" | "brown" | "amber" | "hazel" | "green" | "blue_green" | "blue" | "gray_blue" | "gray" | "dark"`,
    messages: [{
      role: 'user',
      content: `Extract character traits from this description: "${generatedDescription}"`
    }]
  })
});
```
- Parse the JSON response. On parse failure, retry once. On second failure, use sensible defaults.

**Step 4: Name Your Hero**
- Pre-filled text input with "Conci" (editable)
- Large, friendly input field
- "Start my adventure!" button
- On confirm: save hero via `createHero()` from storyDB

**Error handling throughout:**
- Camera permission denied → friendly message + "Story Quest needs to see you to make you the hero! Ask a grown-up to help."
- API failure → "The storyteller is resting. Try again in a moment." + retry button
- Parse failure on Call 2 → use defaults, don't block the flow
- All errors are kid-friendly language, never technical

**State management:**
- Use React useState for the wizard step progression
- Photo base64 is local state only, cleared after Vision call
- Generated description persists in state until hero is saved
- Parsed avatar properties persist in state until hero is saved

### File: `src/games/story-quest/hero/avatarPalette.js`

**Export the curated palette as lookup tables:**

```javascript
export const HAIR_COLORS = {
  black: '#1a1a2e',
  dark_brown: '#3d2314',
  medium_brown: '#6b4226',
  light_brown: '#a0734b',
  auburn: '#8b3a3a',
  red: '#c0392b',
  strawberry_blonde: '#d4a373',
  golden_blonde: '#daa520',
  platinum_blonde: '#e8dcc8',
  gray: '#9e9e9e',
  white: '#f0ece2',
  blue_black: '#1a1a3e'
};

export const HAIR_STYLES = ['curly', 'wavy', 'straight', 'coily', 'braided', 'short_cropped'];

export const SKIN_TONES = {
  porcelain: '#fde8d0',
  fair: '#f5d6b8',
  light: '#e8c4a0',
  light_medium: '#d4a574',
  medium: '#c68e5b',
  medium_tan: '#b07940',
  olive: '#a38b5f',
  tan: '#a0744b',
  brown: '#8b6234',
  dark_brown: '#6b4226',
  deep_brown: '#4a2e1a',
  deep: '#3a2010'
};

export const EYE_COLORS = {
  dark_brown: '#3d1c02',
  brown: '#6b3a2a',
  amber: '#c48c32',
  hazel: '#8b7355',
  green: '#4a7c59',
  blue_green: '#3a8b8c',
  blue: '#4a7fb5',
  gray_blue: '#708fa0',
  gray: '#8c9196',
  dark: '#1a1a1a'
};
```

These hex values MUST be hand-verified to look good on the SVG avatar in Clue 4. Adjust as needed during avatar development, but keep the enum keys stable.

## Pass Conditions

- [ ] Camera opens with front-facing mode on iPhone/iPad
- [ ] Captured photo is resized to max 512px before base64 encoding
- [ ] Vision API call returns a character description (2-3 sentences)
- [ ] Photo base64 is cleared from state immediately after Vision call completes
- [ ] Parse API call returns valid JSON with all 4 trait fields
- [ ] Parse response values are all from the allowed palette enums — no freeform values
- [ ] On parse failure: retries once, then uses defaults without blocking flow
- [ ] "Try again" from Step 3 returns to Step 1 (camera)
- [ ] Hero is saved to SQLite with all fields populated
- [ ] Camera permission denial shows kid-friendly message
- [ ] API errors show kid-friendly messages with retry option
- [ ] Touch targets are all ≥44×44px
- [ ] No photo data persists anywhere after hero creation completes
- [ ] avatarPalette.js exports all 4 lookup tables with curated hex values
- [ ] Complete files, no fragments
