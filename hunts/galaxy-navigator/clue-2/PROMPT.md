# Clue 2: Infinite World

## Context
Clue 1 complete. Rocket moves with momentum, joystick works, rotation follows velocity.

Now you build the world around it. The rocket stays centered on screen — the world scrolls past it. Space feels infinite because the starfield wraps seamlessly and the boundaries loop.

## Your Task

### World System (`src/hub/useWorld.js`)
A hook that manages the camera/viewport.
- World is 5000×5000 virtual units, wraps in all directions
- Rocket world position comes from useRocket
- Camera always centers on rocket
- Exports a `worldToScreen(worldX, worldY)` function — converts world coords to screen pixels
- Handles wrap-around: when rocket crosses world edge, it reappears on opposite side seamlessly

Wrap logic: if rocketX > 5000, rocketX = rocketX - 5000. Same for Y. Same inverted for 0 boundary. The world is a torus.

### Parallax Starfield
Three layers of stars — each scrolls at different speed relative to rocket movement:
- **Far stars** (60 stars, 1px, scroll at 0.1× rocket speed) — barely move, feel distant
- **Mid stars** (40 stars, 2px, scroll at 0.3× rocket speed) — gentle drift
- **Near stars** (20 stars, 3-4px, scroll at 0.6× rocket speed) — noticeable parallax

Stars also wrap at screen edges so the field feels infinite. Each star layer is positioned in screen space, offset by rocket world position × its parallax factor.

Color variation: mostly white (#ffffff), some pale blue (#aaddff), some pale yellow (#fffaaa). Random on mount, same seed each session.

Background: #0a0a0f (space black).

### Update GalaxyNavigator
- Import useWorld, pass rocket position to it
- Render 3 star layers behind everything
- Rocket renders centered on screen regardless of world position
- Show a tiny debug readout (world X, Y) in corner during development — easy to remove later

## Files to Create/Modify
- `src/hub/useWorld.js` — new
- `src/hub/GalaxyNavigator.jsx` — add world system + starfield

## Pass Conditions
- [ ] Starfield renders with 3 visible depth layers
- [ ] Stars parallax at different speeds as rocket moves
- [ ] Rocket stays centered on screen while world scrolls
- [ ] Boundary wrap works in all 4 directions — no hard edge, no jump
- [ ] Wrap feels seamless — stars don't pop or flash
- [ ] Space feels infinite — no visible boundary
- [ ] Joystick and rocket physics from Clue 1 still work perfectly
- [ ] worldToScreen function correctly maps world coords to screen
- [ ] No console errors

## Do Not
- Add planets yet — Clue 3
- Add HUD — Clue 4
- Remove the debug world position readout — useful for Clue 3 planet placement

## The Feel Test
Fly in one direction for 10 seconds. You should feel like you're going somewhere. Stars stream past at different speeds. When you hit the edge — you're back on the other side instantly, stars continuous. It feels like space, not a screensaver.

## When You Pass
Write `hunts/galaxy-navigator/clue-2/COMPLETE.md` with the parallax multipliers used and the wrap implementation approach. Then open `hunts/galaxy-navigator/clue-3/PROMPT.md`.
