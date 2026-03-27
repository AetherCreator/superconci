# Clue 1: Rocket Physics

## Context
This is the first clue. You are building the core feel of the game — how the rocket moves. Everything else depends on this feeling right. A 5-year-old will know immediately if it feels wrong. Get the physics right before anything else exists.

Create `src/hub/GalaxyNavigator.jsx` as the main component shell and `src/hub/useRocket.js` as the physics hook. Also create `src/hub/Joystick.jsx`.

## Your Task

### Joystick (`src/hub/Joystick.jsx`)
A virtual joystick in the bottom-left corner.
- Outer ring: ~100px diameter, semi-transparent dark with retro border
- Inner knob: ~44px, drags within the outer ring
- Touch/mouse drag moves the knob, releases snap back to center
- Exports `{ x, y }` normalized direction values (-1 to 1 each axis) via callback prop `onMove`
- Must work with touch events (not just mouse) — this is mobile first
- Position: fixed, bottom-left, 20px from edges

### Rocket Physics (`src/hub/useRocket.js`)
A React hook that takes joystick `{ x, y }` input and returns rocket position and rotation.

Physics model:
- **Thrust**: joystick input applies force in that direction each frame
- **Momentum**: rocket continues moving when joystick released (space has no friction)
- **Drag**: subtle drag (0.98 multiplier per frame) so rocket gradually slows — not instant stop, not infinite drift
- **Max speed**: cap velocity at ~4 units/frame so it never gets uncontrollable
- **Rotation**: rocket visually rotates to face direction of velocity (not input direction)
- Uses `requestAnimationFrame` loop internally
- Returns: `{ x, y, rotation, velocityX, velocityY }`
- Position starts at center of world (2500, 2500)

### GalaxyNavigator shell (`src/hub/GalaxyNavigator.jsx`)
For this clue: render a black screen with the rocket centered and the joystick. The rocket is the 🚀 emoji or a CSS rocket — retro style. It should visually rotate to face its direction of travel.

The world rendering, planets, and HUD come in later clues. This clue is purely: joystick input → physics → rocket moves and rotates on screen.

## Files to Create
- `src/hub/Joystick.jsx`
- `src/hub/useRocket.js`
- `src/hub/GalaxyNavigator.jsx` (shell only)

## Pass Conditions
- [ ] Joystick renders bottom-left, touch draggable
- [ ] Knob snaps back to center on release
- [ ] Rocket moves in joystick direction
- [ ] Rocket has momentum — drifts after release
- [ ] Drag slows rocket gradually, not instantly
- [ ] Max speed feels controlled, not too fast or slow
- [ ] Rocket rotates to face direction of travel
- [ ] Feels analog — variable speed based on joystick deflection
- [ ] Works on touch (not just mouse)
- [ ] No console errors

## Do Not
- Add starfield or world scrolling yet — that's Clue 2
- Add planets — that's Clue 3
- Add HUD — that's Clue 4
- Worry about world boundaries — that's Clue 2
- Use any physics library — vanilla JS only

## The Feel Test
Push the joystick hard — rocket accelerates. Release — it drifts. Tap briefly — small nudge. This should feel like steering a spaceship, not dragging an icon.

## When You Pass
Write `hunts/galaxy-navigator/clue-1/COMPLETE.md` with the physics constants used (thrust, drag, max speed) and why. Then open `hunts/galaxy-navigator/clue-2/PROMPT.md`.
