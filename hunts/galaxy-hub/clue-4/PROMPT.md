# Clue 4: Planet Interaction

## Context
Clue 1: Starfield — done.
Clue 2: Galaxy layout with 3 planets — done.
Clue 3: Coci's rocket with idle animation — done.

The scene looks great. Now it needs to work. Tapping Number Blasters should launch the game. Tapping locked planets should acknowledge the tap kindly. Back from the game returns cleanly to the galaxy.

## Your Task
Wire up planet interactions in `src/hub/GalaxyHub.jsx` and integrate `src/NumberBlasters.jsx`.

**Number Blasters planet tap:**
- Launch animation: brief rocket "zoom" toward the planet (CSS transform scale + translate, 300-400ms)
- Then render NumberBlasters component full-screen in place of the hub
- The transition should feel like launching, not like a page swap

**Back to hub:**
- NumberBlasters needs a way to signal "exit" back to the hub
- Add an `onExit` prop to NumberBlasters — a callback the hub passes in
- When the game ends or player exits, call `onExit()`
- Hub re-renders, rocket returns to idle position, galaxy is back

**Locked planet tap:**
- Show a small toast/popup: "🔒 Coming Soon!" 
- Retro style, auto-dismisses after 1.5 seconds
- No navigation, no full-screen anything

## Files to Create/Modify
- `src/hub/GalaxyHub.jsx` — add interaction logic and NumberBlasters integration
- `src/NumberBlasters.jsx` — add `onExit` prop support (minimal change — just wire the prop to existing game-over/exit logic)

## Pass Conditions
- [ ] Tapping Number Blasters planet triggers launch animation
- [ ] NumberBlasters renders full-screen after animation
- [ ] onExit prop accepted by NumberBlasters
- [ ] Calling onExit returns cleanly to galaxy hub
- [ ] Rocket resumes idle animation on return
- [ ] Tapping locked planets shows "Coming Soon" toast
- [ ] Toast auto-dismisses after 1.5s
- [ ] No state leaks between game and hub (audio, timers cleaned up on exit)
- [ ] No console errors

## Do Not
- Redesign NumberBlasters — minimal changes only, just add onExit prop
- Add router/navigation library — this is component state only
- Add loading states or splash screens — that's polish for later
- Change the game's internal logic

## When You Pass
Write `hunts/galaxy-hub/clue-4/COMPLETE.md` with integration approach and how onExit was wired. Then open `hunts/galaxy-hub/clue-5/PROMPT.md`.
