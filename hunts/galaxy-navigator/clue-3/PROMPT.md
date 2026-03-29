# Clue 3: Planets in World

## Context
Clue 1: Rocket physics — done.
Clue 2: Infinite scrolling world with parallax — done. worldToScreen() works.

Now you place planets in the world. They exist at fixed world coordinates and render relative to the rocket's position using worldToScreen(). When the rocket flies close, a proximity ring appears — this is how Conci knows he's found something.

## Your Task

### Planet Definitions
3 planets with fixed world positions. Spread them so the starting position (2500, 2500) is near Number Blasters but not on top of it. Word Quest and Nature Lab should require actual exploration to find.

Suggested positions (adjust if needed for good spacing):
- **Number Blasters**: world (2800, 2200) — close to spawn, first discovery
- **Word Quest**: world (1200, 3800) — requires flying left and down
- **Nature Lab**: world (4200, 1400) — requires flying right and up

Each planet:
- Renders via worldToScreen() — moves correctly as rocket flies
- Only renders when within ~800px of screen center (culling — don't render off-screen planets)
- Visual: same retro style as old GalaxyHub — circular, chunky, emoji + name label
- Number Blasters: orange-red glow (#ff6b35), 🚀 emoji, unlocked
- Word Quest: muted purple (#7c6f9c), 📖 emoji, locked styling
- Nature Lab: muted green (#4a7c59), 🔬 emoji, locked styling

### Proximity Detection
When rocket world position is within 120 world units of a planet center:
- Planet displays a pulsing proximity ring — retro dashed circle, glowing
- Ring pulses (scale 1.0→1.2→1.0, 800ms cycle)
- Unlocked planets: ring is bright orange-white
- Locked planets: ring is dim grey — shows proximity but signals locked

No game launch yet — that's Clue 5. Just the visual proximity feedback.

## Files to Modify
- `src/hub/GalaxyNavigator.jsx` — add planet rendering using worldToScreen

## Pass Conditions
- [ ] 3 planets render at correct world positions
- [ ] Planets move correctly relative to rocket (worldToScreen working)
- [ ] Off-screen planets don't render (culling active)
- [ ] Number Blasters is reachable from spawn without excessive travel
- [ ] Proximity ring appears within 120 world units
- [ ] Ring pulses smoothly
- [ ] Locked planets visually distinct from unlocked
- [ ] Planet names visible (Press Start 2P, small)
- [ ] Rocket, joystick, and world from Clues 1-2 still work
- [ ] No console errors

## Do Not
- Trigger game launch yet — Clue 5
- Add quick nav HUD — Clue 4
- Make planets interactive on tap yet — proximity only this clue

## Navigation Note
Use the debug world position readout from Clue 2 to verify planet placement feels right. Number Blasters should be visible or nearly visible from spawn. If the positions above don't feel right, adjust them — document your choices in COMPLETE.md.

## When You Pass
Write `hunts/galaxy-navigator/clue-3/COMPLETE.md` with final planet world positions used and proximity detection approach. Then open `hunts/galaxy-navigator/clue-4/PROMPT.md`.
