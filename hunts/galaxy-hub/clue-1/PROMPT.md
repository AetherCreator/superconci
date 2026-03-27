# Clue 1: Starfield

## Context
This is the first clue. Nothing has been built yet. You are creating the foundation — the space environment that everything else sits on top of.

Design language (from CLAUDE.md):
- Neon-on-dark palette
- Retro-arcade aesthetic, modern polish
- Press Start 2P for any text
- This is a 5-year-old's screen — it should feel alive and magical, not sterile

## Your Task
Create `src/hub/GalaxyHub.jsx` with a deep space starfield background. This is the canvas the whole hub will be painted on. No planets, no rocket yet — just space that feels like space.

Stars should:
- Number 80, randomly positioned
- Have 3 size tiers (small/medium/large, ~60/30/10 split)
- Twinkle at random intervals with subtle opacity animation
- Have slight color variation — mostly white, some pale blue, some pale yellow
- Create a sense of depth (larger stars feel closer)

The component should fill 100vw × 100vh with overflow hidden. Black background (#0a0a0f — not pure black, space black).

## Files to Create/Modify
- `src/hub/GalaxyHub.jsx` — new file, exports default GalaxyHub component

## Pass Conditions
- [ ] 80 stars render on mount
- [ ] Stars have 3 distinct size tiers
- [ ] Stars twinkle (opacity animation, staggered, not all at once)
- [ ] Color variation present (not all pure white)
- [ ] Component fills full viewport
- [ ] Background is space-black not pure black
- [ ] No console errors
- [ ] Looks alive, not like a static screenshot

## Do Not
- Add planets yet — that's Clue 2
- Add the rocket — that's Clue 3
- Add any UI chrome, buttons, or text — just the starfield
- Use any external libraries — pure React + CSS/inline styles
- Use canvas — use DOM elements (divs) for stars so they're easy to layer on top of

## When You Pass
Write `hunts/galaxy-hub/clue-1/COMPLETE.md` with a summary of what was built and the star generation approach used. Then open `hunts/galaxy-hub/clue-2/PROMPT.md`.
