# Clue 4: Quick Nav HUD

## Context
Clue 1: Rocket physics — done.
Clue 2: Infinite world, parallax — done.
Clue 3: 3 planets at world positions, proximity rings — done.

Coci can fly to planets now. But a 5-year-old might get lost or frustrated if he can't find what he's looking for. The quick nav HUD is his escape hatch — a strip of planet icons at the top of the screen. Tap one, the rocket flies there automatically.

## Your Task

### QuickNav Component (`src/hub/QuickNav.jsx`)
A horizontal strip fixed at the top of the screen.
- Shows one icon per planet: emoji + short name
- Unlocked planets: full color, tappable
- Locked planets: dimmed, show 🔒, still tappable (autopilot still works, game just won't launch)
- Currently targeted planet (if autopiloting): highlighted with a glow border
- Thin retro border below the strip, semi-transparent dark background

### Autopilot System (in useRocket.js or GalaxyNavigator.jsx)
When a planet is tapped in QuickNav:
- Autopilot activates — rocket steers itself toward target planet world position
- Autopilot steering: each frame, calculate angle to target, apply thrust in that direction
- Rocket still has physics (momentum, drag) — it doesn't teleport, it flies there
- Speed during autopilot: slightly faster than manual max speed (feels purposeful)
- On arrival (within 150 world units of target): autopilot deactivates, joystick resumes
- If player touches joystick during autopilot: autopilot cancels immediately, player takes control

### Autopilot Handles World Wrapping
The autopilot should take the shortest path — if the planet is closer going through a wrap boundary, take that route. Calculate both direct distance and wrapped distance, use the shorter one.

## Files to Create/Modify
- `src/hub/QuickNav.jsx` — new
- `src/hub/useRocket.js` — add autopilot logic
- `src/hub/GalaxyNavigator.jsx` — integrate QuickNav, pass autopilot state

## Pass Conditions
- [ ] QuickNav strip renders at top of screen
- [ ] All 3 planets shown with emoji + name
- [ ] Locked planets dimmed with 🔒
- [ ] Tapping a planet activates autopilot
- [ ] Rocket visibly flies toward target (not teleport)
- [ ] Autopilot takes shortest path including wrap
- [ ] Joystick touch cancels autopilot
- [ ] Active autopilot target highlighted in HUD
- [ ] On arrival, control returns to joystick smoothly
- [ ] All prior clues still work perfectly
- [ ] No console errors

## Do Not
- Launch games on arrival — Clue 5 handles that
- Make the HUD too tall — max 60px, this is Coci's screen space
- Remove joystick control during autopilot — player can always override

## The Feel Test
Tap Word Quest in the HUD. Rocket turns, accelerates, flies across space. Stars stream by. Rocket arrives at Word Quest, slows, stops near the planet. Control returns. The whole trip should feel like watching a spaceship navigate, not watching a loading bar.

## When You Pass
Write `hunts/galaxy-navigator/clue-4/COMPLETE.md` with autopilot steering implementation and wrap path logic. Then open `hunts/galaxy-navigator/clue-5/PROMPT.md`.
