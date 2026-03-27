# Complete: Clue 2 — Infinite World

## What Was Built
- `src/hub/useWorld.js` — Camera/viewport hook with torus wrap and worldToScreen
- Updated `src/hub/GalaxyNavigator.jsx` — 3-layer parallax starfield, world wrap, debug readout

## Parallax Multipliers
- **Far (0.1×)**: 60 stars, 1px — barely moves, distant galaxy feel
- **Mid (0.3×)**: 40 stars, 2px — gentle drift, depth cue
- **Near (0.6×)**: 20 stars, 3.5px — noticeable parallax, nearby star feel

## Wrap Implementation
- World is 5000×5000 torus
- `applyWrap()` runs each frame, applies modulo to rocket stateRef: `((val % SIZE) + SIZE) % SIZE`
- `worldToScreen()` uses shortest-path delta on torus (wraps delta to ±WORLD_SIZE/2)
- Stars wrap at screen edges using modulo on their offset position

## What Clue 3 Receives
- `worldToScreen(wx, wy)` — converts any world coordinate to screen pixel position
- Rocket stays centered, world objects will be positioned via worldToScreen
- Debug readout shows world coordinates (top-right corner)
- applyWrap ensures rocket.x/y are always in [0, 5000) range
