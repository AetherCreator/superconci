# Clue 3: Rocket Navigator

## Context
Clue 1: Starfield — done.
Clue 2: 3 planets placed on the galaxy map, Number Blasters glowing, 2 locked planets dim.

Now Coci gets his rocket. This is his avatar in the galaxy — the "you are here" marker and the soul of the navigation screen. It should feel like HIS rocket.

## Your Task
Add Coci's rocket to `src/hub/GalaxyHub.jsx`.

The rocket should:
- Be a retro pixel-art style rocket — built with CSS/divs/emoji, no image assets
- Sit naturally in the scene, positioned between planets (not on top of any planet)
- Have an idle animation: gentle floating/bobbing up and down, slow and peaceful
- Have a subtle exhaust animation below it — small flickering flame particles or a shimmer
- Feel like it's waiting, ready to launch

Rocket design direction: classic retro rocket shape — pointy top, fin bottom, window in the middle. Use CSS shapes or a well-chosen emoji (🚀) as the base. If using emoji, add CSS transforms and animations to make it feel crafted, not lazy.

The rocket does NOT navigate between planets in this clue — it's ambient, not interactive yet. Think of it as the title screen character that makes the world feel inhabited.

Position suggestion: lower-center of the screen, floating gently. Adjust if it conflicts with planet layout from Clue 2.

## Files to Create/Modify
- `src/hub/GalaxyHub.jsx` — add rocket layer

## Pass Conditions
- [ ] Rocket renders in the scene
- [ ] Idle float animation active (smooth, looping, peaceful not bouncy)
- [ ] Exhaust/flame effect present below rocket
- [ ] Rocket does not overlap any planet
- [ ] Rocket style is consistent with retro-arcade aesthetic
- [ ] Starfield and planets from Clues 1-2 still render correctly
- [ ] Scene as a whole feels inhabited — like Coci is there, waiting
- [ ] No console errors

## Do Not
- Make the rocket interactive yet — no tap handlers
- Make it navigate or move to planets — ambient only
- Use image files — CSS and emoji only
- Make the animation frenetic — Coci is 5, this should feel calm and inviting

## When You Pass
Write `hunts/galaxy-hub/clue-3/COMPLETE.md` with rocket CSS approach and animation technique. Then open `hunts/galaxy-hub/clue-4/PROMPT.md`.
