# 🏴‍☠️ TREASURE: Galaxy Navigator Complete

## The Final Check

You've conquered 6 clues. Before declaring complete, run the full Conci test.

## The Loop

1. App opens → space, stars twinkling, ambient music breathing
2. Rocket floating center screen, exhaust glowing
3. Conci grabs the joystick → engine hums, rocket moves, stars parallax
4. He explores → finds the glowing planet
5. He flies into the ring → countdown beeps → launch whoosh → Number Blasters
6. He plays, wins or loses → exits → return chord → back in space, rocket drifting
7. He grabs joystick again immediately
8. He gets lost → taps QuickNav → autopilot flies him home
9. He hits the edge of space → warp shimmer → appears on other side → laughs

## Final Pass Conditions

- [ ] Full loop above works without bugs
- [ ] No console errors at any point
- [ ] Physics loop correctly pauses/resumes around game sessions
- [ ] Audio never bleeds between hub and game
- [ ] Wrap boundaries seamless in all 4 directions
- [ ] Autopilot takes shortest path including wraps
- [ ] Dwell timer resets correctly when leaving proximity
- [ ] App.jsx imports GalaxyNavigator (not GalaxyHub)
- [ ] Old GalaxyHub.jsx can stay but is no longer the entry point

## The Real Test

Would Conci put this down? If yes — ship it. If no — what's the one thing that would make him stay?

## Final Action

Create `hunts/galaxy-navigator/HUNT-COMPLETE.md`:

```markdown
# Hunt Complete: Galaxy Navigator
Date: [today]
Clues: 6/6 passed
Files created: GalaxyNavigator.jsx, useRocket.js, useWorld.js, Joystick.jsx, QuickNav.jsx
Files modified: HubAudio.js, App.jsx
Result: [one sentence]
Conci test: [would he put it down?]
```

Commit everything to `feature/galaxy-navigator`:
`feat: galaxy navigator — Conci flies the rocket through infinite space`

Then update App.jsx on the feature branch to import GalaxyNavigator.
