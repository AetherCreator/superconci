# Complete: Clue 1 — Rocket Physics

## What Was Built
- `src/hub/Joystick.jsx` — Virtual joystick, bottom-left fixed, touch+mouse, normalized output
- `src/hub/useRocket.js` — Physics hook with thrust/momentum/drag/rotation
- `src/hub/GalaxyNavigator.jsx` — Shell component, black screen, centered rocket, joystick wired

## Physics Constants
- **THRUST: 0.15** — Force per frame at full joystick deflection. Responsive but not twitchy for a 5-year-old.
- **DRAG: 0.98** — Velocity multiplied each frame. Rocket drifts for ~2-3 seconds after release, feels spacey.
- **MAX_SPEED: 4** — Caps velocity magnitude. Fast enough to explore, slow enough to control.
- **Start position: (2500, 2500)** — Center of the 5000x5000 world.

## Why These Values
- Thrust is low enough that brief taps give small nudges, sustained push gives real speed
- Drag at 0.98 means ~50 frames to near-zero from max speed — noticeable drift without endless coasting
- Max speed of 4 keeps the rocket controllable even when a kid mashes the joystick

## What Clue 2 Receives
- `useRocket` returns `{ x, y, rotation, velocityX, velocityY, setInput, _stateRef }`
- `_stateRef` provides direct mutable access for the world/camera system to read without re-renders
- Position is in world coordinates (starts 2500,2500), not screen coordinates
- GalaxyNavigator currently renders rocket at screen center — Clue 2 will add camera offset
