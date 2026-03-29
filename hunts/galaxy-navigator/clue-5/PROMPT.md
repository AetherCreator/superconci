# Clue 5: Launch & Return

## Context
Clue 1: Rocket physics — done.
Clue 2: Infinite world — done.
Clue 3: Planets with proximity rings — done.
Clue 4: Quick nav HUD + autopilot — done.

The world works. Now it needs to connect to the games. Flying into a planet's proximity ring and dwelling there launches the game. Exiting returns Conci exactly where he was.

## Your Task

### Proximity Dwell Launch
When rocket is within 120 world units of an **unlocked** planet:
- Proximity ring already shows (from Clue 3)
- After 1.5 seconds of continuous proximity (dwell timer): launch sequence begins
- Show a countdown visual on the planet: "3... 2... 1... 🚀" in retro font
- If rocket leaves proximity before countdown ends: timer resets, no launch

Launch sequence animation (600ms total):
- Rocket scales up slightly (1.0 → 1.3)
- Screen flashes white briefly
- Game component renders full screen

For **locked** planets: proximity ring shows but no dwell timer, no launch. Show a brief "🔒 LOCKED" text near the planet on proximity.

### Return System
When game calls `onExit()`:
- Save rocket world position and velocity BEFORE launch
- On return: restore exact position and velocity
- Rocket resumes drifting from where it was
- Galaxy navigator re-renders immediately, no reload
- Ambient music resumes

### State Management
GalaxyNavigator needs a top-level state:
```javascript
const [activeGame, setActiveGame] = useState(null) // null = in space, 'number-blasters' = in game
```
When activeGame is set: render the game full screen, pause the physics loop
When activeGame is null: render the galaxy, resume physics loop

Pause the rAF physics loop when in a game — don't burn CPU while NumberBlasters is running.

## Files to Modify
- `src/hub/GalaxyNavigator.jsx` — dwell detection, launch sequence, return state
- `src/hub/useRocket.js` — pause/resume physics loop

## Pass Conditions
- [ ] Dwell timer starts on proximity to unlocked planet
- [ ] Countdown visible on planet during dwell
- [ ] Leaving proximity resets timer
- [ ] Launch animation plays (scale + flash)
- [ ] NumberBlasters renders full screen after animation
- [ ] onExit returns to exact world position
- [ ] Rocket resumes drifting from saved velocity
- [ ] Physics loop paused during game, resumed on return
- [ ] Locked planets show LOCKED text, no launch
- [ ] No console errors, no state leaks

## Do Not
- Change NumberBlasters internals — onExit prop is already wired
- Auto-launch on QuickNav arrival — QuickNav just navigates, player still has to dwell
- Forget to pause the physics rAF loop — it'll keep running in background otherwise

## The Full Loop Test
Fly to Number Blasters. Hover in the ring. Watch the countdown. Launch. Play. Exit. Land back in space at the same spot, rocket still drifting. This is the moment the whole system becomes real.

## When You Pass
Write `hunts/galaxy-navigator/clue-5/COMPLETE.md` with dwell implementation and state pause/resume approach. Then open `hunts/galaxy-navigator/clue-6/PROMPT.md`.
