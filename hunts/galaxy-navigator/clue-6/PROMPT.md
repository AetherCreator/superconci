# Clue 6: Polish & Audio

## Context
Clues 1-5 complete. The full loop works — fly, find planet, dwell, launch, return. Now make it feel alive.

## Your Task

### Extend HubAudio.js
Study the existing `src/hub/HubAudio.js` pattern carefully. Extend it — don't replace it.

New sounds needed:

**Engine thrust** — plays while joystick is active
- Low continuous hum, subtle
- Pitch rises slightly with speed
- Fades out when joystick released
- Use OscillatorNode with frequency modulation

**Warp shimmer** — plays on boundary wrap
- Quick ascending sweep, sci-fi feel
- Short (~200ms), not annoying
- Same pattern as NumberBlasters laser but smoother

**Proximity pulse** — plays when entering planet proximity
- Single soft chime, welcoming
- Different tone per planet (Number Blasters: bright, others: softer)

**Countdown beeps** — during 3-2-1 launch countdown
- 3 beeps, ascending pitch, building tension
- Final beep louder

**Launch whoosh** — on game launch
- Short whoosh/impact sound

**Return chord** — on return from game
- Same welcoming chord as existing HubAudio return sound

### Visual Polish

**Rocket exhaust trail**
- Small particles trailing behind rocket when moving
- Fade out over ~300ms
- Orange-yellow color, retro pixel feel
- Intensity scales with speed

**Warp effect on boundary cross**
- Brief horizontal stretch on rocket sprite (scaleX 1→2→1, 150ms)
- Star blur for 200ms after wrap

**Planet approach glow intensifies**
- As rocket gets closer (120px → 0px), planet glow opacity increases
- Full glow at 0px proximity

**Remove debug readout**
- Remove the world position debug text from Clue 2

### Full Experience Review
Before declaring pass, run the complete loop mentally:
- Open app → space, stars, ambient music ✓
- Grab joystick → engine hum, rocket moves, exhaust trail ✓
- Hit boundary → warp shimmer, stretch effect ✓
- Approach planet → glow intensifies, proximity chime ✓
- Dwell → countdown beeps, launch whoosh ✓
- Game plays → music paused ✓
- Exit → return chord, back in space exactly where you were ✓
- Tap QuickNav → autopilot flies there ✓

## Files to Modify
- `src/hub/HubAudio.js` — add engine, warp, proximity, countdown, launch sounds
- `src/hub/GalaxyNavigator.jsx` — exhaust trail, warp effect, approach glow, remove debug

## Pass Conditions
- [ ] Engine hum plays on joystick, fades on release
- [ ] Warp sound plays on boundary cross
- [ ] Proximity chime on planet approach
- [ ] Countdown beeps during 3-2-1
- [ ] Launch whoosh on game start
- [ ] Return chord on exit
- [ ] Exhaust trail renders behind moving rocket
- [ ] Warp stretch effect on boundary cross
- [ ] Planet glow intensifies on approach
- [ ] Debug readout removed
- [ ] No audio overlap or leaked nodes
- [ ] Full loop feels like a game, not a menu
- [ ] You would hand this to a 5-year-old right now

## When You Pass
Write `hunts/galaxy-navigator/clue-6/COMPLETE.md`. Then read `hunts/galaxy-navigator/TREASURE.md`.
