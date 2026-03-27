# Clue 5: Polish & Audio

## Context
Clue 1: Starfield — done.
Clue 2: Galaxy layout — done.
Clue 3: Rocket with idle animation — done.
Clue 4: Planet interactions, NumberBlasters launches and returns — done.

The hub works. Now it needs to sound and feel like a SuperConci screen.

## Your Task
Create `src/hub/HubAudio.js` and integrate it into `src/hub/GalaxyHub.jsx`.

**Reference:** Study the AudioEngine class in `src/NumberBlasters.jsx` — specifically how it uses Web Audio API with `AudioContext`, `createOscillator`, `createGain`, and the `musicGain`/`sfxGain` pattern. Mirror this architecture exactly so the hub audio is consistent with the game audio.

**Ambient music loop:**
- Slow, dreamy chiptune loop — space explorer vibes
- Quieter than the game music (musicGain ~0.08 vs game's 0.12)
- Should loop seamlessly
- Starts on first user tap (Web Audio API requires user gesture)
- Pauses when NumberBlasters launches, resumes when hub returns

**Sound cues:**
- Planet tap (active): ascending 3-note arpeggio, bright and quick
- Planet tap (locked): single low muted tone, gentle rejection
- Return to hub from game: soft welcoming chord

**Polish pass:**
- Verify the starfield twinkling feels right at actual mobile screen size
- Verify all touch targets are comfortable for small fingers
- Verify planet glow pulse isn't too fast or too slow (aim for ~2s cycle)
- Verify rocket float animation is calm (aim for ~3s cycle)

## Files to Create/Modify
- `src/hub/HubAudio.js` — new file, exports HubAudio class
- `src/hub/GalaxyHub.jsx` — integrate HubAudio, trigger sounds on interactions

## Pass Conditions
- [ ] HubAudio class created, mirrors NumberBlasters AudioEngine pattern
- [ ] Ambient loop plays after first user interaction
- [ ] Ambient loop pauses on game launch, resumes on return
- [ ] Planet tap sounds play correctly (different for active vs locked)
- [ ] Return-to-hub sound plays
- [ ] No audio overlap or leaked nodes between hub and game
- [ ] Full experience reviewed — starfield, planets, rocket, interactions, audio all feel cohesive
- [ ] No console errors
- [ ] You would show this to a 5-year-old without embarrassment

## Do Not
- Add new visual features — polish only, no new elements
- Use audio files — Web Audio API synthesis only
- Make the ambient music loud or complex — this is background, not foreground
- Skip the full experience review — this is the last clue before TREASURE

## When You Pass
Write `hunts/galaxy-hub/clue-5/COMPLETE.md`. Then read `hunts/galaxy-hub/TREASURE.md` for the final integration check.
