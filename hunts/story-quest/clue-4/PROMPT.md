# Clue 4: Avatar Component — CSS/SVG with Expressions + World Costumes

## Mission
Build a charming storybook character as a pure CSS/SVG component. No photos, no AI image generation. A warm, illustrated avatar whose colors come from the hero profile and whose expression reacts to the story.

## Context
- Properties (hair color, hair style, skin tone, eye color) come from `avatarPalette.js` (Clue 3)
- The avatar is a **storybook-style illustrated character** — think Mii meets Stardew Valley meets children's book illustration
- 5 expressions: Neutral / Excited / Surprised / Determined / Content
- 6 world costumes: one per world (space helmet, railway cap, wizard hat, animal ears, hero cape, hobbit cloak)
- Placed bottom-left of story player screen, small (~80-100px), gently animated
- Must look good at small size on iPhone

## Build

### File: `src/games/story-quest/hero/Avatar.jsx`

**Props:**
```javascript
{
  hero: {
    hairColor: 'dark_brown',   // palette enum key
    hairStyle: 'curly',        // style enum key
    skinTone: 'medium',        // palette enum key
    eyeColor: 'brown'          // palette enum key
  },
  expression: 'neutral',       // neutral | excited | surprised | determined | content
  world: null,                 // null (no costume) | world_id string
  size: 'small',               // small (80px) | medium (120px) | large (200px)
  animated: true               // gentle idle animation
}
```

**SVG Character Structure:**
- Head (circle/oval) — filled with skin tone
- Hair — SVG path that changes shape based on `hairStyle`. 6 variants, each a distinct path.
- Eyes — two small shapes filled with eye color. Expression changes eye shape:
  - Neutral: simple circles
  - Excited: wide circles with sparkle dots
  - Surprised: large ovals
  - Determined: slightly narrowed, angled
  - Content: happy crescents (smiling eyes)
- Mouth — simple SVG path that changes per expression:
  - Neutral: gentle smile
  - Excited: big open smile
  - Surprised: small "O"
  - Determined: firm line
  - Content: warm closed smile
- Body — simple torso shape, filled with a default tunic color
- **No legs or complex body** — this is a portrait/bust style at small size

**World Costumes (SVG overlays):**
- `iron_rails`: Engineer's cap (blue-gray) + goggles on forehead
- `star_sector`: Space helmet (translucent dome overlay) + antenna
- `old_realm`: Wizard/adventure hat (pointed, brown) + cloak collar
- `wild_earth`: Animal ear headband (bear ears) + leaf pin
- `hero_city`: Domino mask + cape collar peek
- `road_ever_on`: Hobbit-style traveling cloak with acorn clasp

Each costume is a separate SVG group that renders on top of the base character when `world` prop is set.

**Animation:**
- Idle: gentle floating bob (CSS `@keyframes`, 3s cycle, translateY ±2px)
- Expression transition: 200ms ease-in-out crossfade between expression states
- Costume equip: brief sparkle effect (CSS animation) when world changes

**Expression detection helper (exported):**

```javascript
// Given a story segment text, detect the best expression
export function detectExpression(text) {
  // Keyword matching against the segment content
  // excited: "amazing", "incredible", "wow", "hurray", "discovered"
  // surprised: "suddenly", "gasp", "unexpected", "what's that"
  // determined: "brave", "must", "challenge", "won't give up"
  // content: "smiled", "warm", "safe", "home", "friend"
  // neutral: default fallback
  return 'neutral' | 'excited' | 'surprised' | 'determined' | 'content';
}
```

**Rendering approach:**
- Inline SVG in JSX (not external SVG files)
- Colors injected via CSS custom properties or inline `fill` attributes from palette lookups
- All measurements relative so `size` prop scales everything proportionally
- `viewBox` based — single SVG that scales cleanly from 80px to 200px

## Pass Conditions

- [ ] Avatar renders with correct hair color, skin tone, eye color from palette hex values
- [ ] All 6 hair styles produce visually distinct hair shapes
- [ ] All 5 expressions are visually distinct even at small (80px) size
- [ ] All 6 world costumes render as overlays on the base character
- [ ] `detectExpression()` returns appropriate expression for test strings
- [ ] Idle animation runs smoothly (no layout thrash, CSS-only)
- [ ] Size prop scales the avatar cleanly at all 3 sizes
- [ ] Looks charming and storybook-quality — not sterile or generic
- [ ] No external image files — pure SVG/CSS
- [ ] Color values come from avatarPalette.js imports, not hardcoded
- [ ] Component is self-contained — no dependencies beyond avatarPalette.js
- [ ] Touch targets on avatar (if tappable) are ≥44×44px
