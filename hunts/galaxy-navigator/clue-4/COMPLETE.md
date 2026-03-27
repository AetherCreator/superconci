# Complete: Clue 4 — Quick Nav HUD

## What Was Built
- `src/hub/QuickNav.jsx` — Horizontal planet icon strip at top of screen
- Updated `src/hub/useRocket.js` — Added autopilot system (startAutopilot, cancelAutopilot)
- Updated `src/hub/GalaxyNavigator.jsx` — Integrated QuickNav + autopilot handler

## Autopilot Implementation
- Each frame: compute shortest-path delta on torus (wrap dx/dy to ±2500)
- Apply AUTOPILOT_THRUST (0.25) in direction of target — faster than manual THRUST (0.15)
- Cap at AUTOPILOT_MAX_SPEED (5.5) — noticeably faster than manual MAX_SPEED (4)
- Still uses same DRAG (0.98) — feels like the same physics just turbo-charged
- Arrival at 150 world units — auto-cancels, joystick resumes

## Wrap Path Logic
- dx = target.x - rocket.x, wrap to ±2500
- Same for dy
- This naturally picks the shortest path through wrap boundaries
- Rocket flies through wrap edge seamlessly (world wrap from Clue 2 handles position)

## Joystick Override
- In setInput(): if joystick magnitude > 0.1 while autopilot active, immediately cancel
- Player always has priority over autopilot

## What Clue 5 Receives
- Autopilot can deliver rocket to any planet's proximity
- Proximity detection (Clue 3) + autopilot (Clue 4) = Coci can find and reach any planet
- Next: dwell timer on proximity → game launch
