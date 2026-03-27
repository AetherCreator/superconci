# Hunt: Galaxy Navigator — Coci Flies the Rocket
Goal: Replace the static galaxy hub with a playable space navigation mini-game. Coci steers a rocket through infinite space with a virtual joystick, discovers planets by flying to them, and launches games by proximity landing. Quick-nav HUD lets him jump to any planet instantly.
Repo: AetherCreator/SuperConci
Branch: feature/galaxy-navigator
Base: main

## Clue Tree
1. **Rocket Physics** → pass: Virtual joystick renders bottom-left, rocket moves with momentum and drag, movement feels analog not digital, no jitter
2. **Infinite World** → pass: Starfield parallax scrolls as rocket moves, wrap-around boundaries work in all 4 directions, rocket always stays centered on screen, space feels infinite
3. **Planets in World** → pass: 3 planets exist at fixed world coordinates, render correctly relative to rocket position, proximity ring appears when rocket is within 120px, Number Blasters planet is reachable from spawn
4. **Quick Nav HUD** → pass: Planet icons strip renders top of screen, tapping a planet icon activates autopilot, rocket smoothly flies to target planet, joystick resumes control on arrival
5. **Launch & Return** → pass: Flying into proximity ring + 1.5s dwell triggers game launch, onExit returns to galaxy at exact world position, rocket resumes from where it was
6. **Polish & Audio** → pass: Engine thrust sound on joystick use, warp shimmer on boundary wrap, planet approach pulse animation, ambient space music loop, full experience feels like a game not a menu

## Dead End Protocol
If any clue fails 3 times:
- Stop immediately
- Write STUCK.md in failed clue folder
- Include: what was tried, what broke, what's specifically needed
- Surface to Tyler with one question

## Architecture Notes
This replaces GalaxyHub.jsx entirely. New files:
```
src/
└── hub/
    ├── GalaxyNavigator.jsx    ← Main component (replaces GalaxyHub.jsx)
    ├── useRocket.js           ← Rocket physics hook
    ├── useWorld.js            ← World/camera system hook
    ├── Joystick.jsx           ← Virtual joystick component
    ├── QuickNav.jsx           ← Planet HUD strip
    └── HubAudio.js            ← Keep existing, extend for engine sounds
```
App.jsx should import GalaxyNavigator instead of GalaxyHub when done.

## World Coordinate System
- World is large (5000×5000 virtual units) but wraps infinitely
- Rocket position is in world coords, camera follows rocket
- Planets have fixed world positions spread across the space
- Screen renders a viewport window centered on rocket

## Dependencies
Load before starting:
- `src/hub/GalaxyHub.jsx` — understand existing planet data, reuse planet definitions
- `src/hub/HubAudio.js` — extend don't replace
- `src/NumberBlasters.jsx` — onExit prop already wired, don't break it
- `CLAUDE.md` — retro aesthetic, Press Start 2P, neon-on-dark, big touch targets

## Success State (TREASURE)
Coci picks up the phone. Space. He grabs the joystick. The rocket moves — it has weight, it drifts. He finds a glowing planet. He flies into it. Number Blasters launches. He plays. He exits. He's back exactly where he was in space, rocket drifting. He immediately grabs the joystick again.
