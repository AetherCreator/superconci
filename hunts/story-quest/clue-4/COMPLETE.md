# Clue 4: COMPLETE — Avatar Component (SVG + Expressions)

## What Was Built

### `src/games/story-quest/hero/Avatar.jsx`
Pure CSS/SVG storybook character avatar:
- **Dynamic colors** from avatarPalette.js — hairColor, skinTone, eyeColor mapped to hex
- **6 hair styles** — curly, wavy, straight, coily, braided, short_cropped (each a distinct SVG path group)
- **5 expressions** — neutral, excited (sparkle eyes), surprised (wide ovals), determined (narrowed + brows), content (crescent eyes)
- **6 world costumes** — iron-rails (cap+goggles), star-sector (helmet+antenna), old-realm (wizard hat), wild-earth (bear ears+leaf), hero-city (domino mask+cape), road-ever-on (cloak+acorn clasp)
- **3 sizes** — small (80px), medium (120px), large (200px) via viewBox scaling
- **Idle animation** — CSS keyframes, 3s bob cycle, translateY ±2px
- **Blush circles** for warmth, tiny nose dot, charming tunic body

### Exported: `detectExpression(text)`
Keyword-matching function that returns expression based on story segment text. Keywords per expression: excited (amazing, incredible, wow...), surprised (suddenly, gasp...), determined (brave, must, challenge...), content (smiled, warm, safe...).

## Props
```
hero: { hairColor, hairStyle, skinTone, eyeColor }  // palette enum keys
expression: 'neutral' | 'excited' | 'surprised' | 'determined' | 'content'
world: null | world_id string (triggers costume overlay)
size: 'small' | 'medium' | 'large'
animated: boolean
```

## What Clue 5 Inherits
- Avatar component ready for rendering in WorldSelector, StoryPlayer, and HeroCreation
- detectExpression() available for story engine to set avatar mood
- World costume system keyed by world_id strings matching the 6 worlds
