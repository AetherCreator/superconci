# 🏴‍☠️ TREASURE: Galaxy Hub Complete

## The Final Check

You've navigated all 5 clues. Before declaring this hunt complete, run the full experience in your head as Coci — age 5, loves rockets and trains, reads at 3rd grade level.

## The Loop

1. App opens → galaxy appears → space feels alive
2. Stars are twinkling → rocket is floating → it feels like a place
3. Coci sees the Number Blasters planet glowing → it's obviously tappable
4. He taps it → rocket zooms → game launches
5. He plays, he wins or loses → he exits
6. Galaxy comes back → rocket is home → ambient music returns
7. He sees the locked planets → taps one → "Coming Soon!" → no frustration
8. He wants to play again → loop repeats

## Final Pass Conditions

- [ ] Full loop above works without any bugs
- [ ] No console errors at any point in the loop
- [ ] Audio never bleeds between hub and game
- [ ] Hub state resets cleanly every time you return from the game
- [ ] The screen is beautiful — not just functional
- [ ] You would sit Coci in front of this right now

## Deliverable

This hunt is complete when:
- `src/hub/GalaxyHub.jsx` exists and works
- `src/hub/HubAudio.js` exists and works  
- `src/NumberBlasters.jsx` has onExit prop wired
- All 5 `clue-N/COMPLETE.md` files exist
- No broken states, no console errors

## Final Action

Create `hunts/galaxy-hub/HUNT-COMPLETE.md`:

```markdown
# Hunt Complete: Galaxy Hub
Date: [today]
Clues: 5/5 passed
Files created: GalaxyHub.jsx, HubAudio.js
Files modified: NumberBlasters.jsx
Result: [one sentence describing the final state]
Ready for: Tyler to open on iPhone and show Coci
```

Then commit everything to `feature/galaxy-hub` with message:
`feat: galaxy hub — Coci's rocket navigation screen with Number Blasters integration`
