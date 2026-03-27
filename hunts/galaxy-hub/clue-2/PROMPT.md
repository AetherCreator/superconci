# Clue 2: Galaxy Layout

## Context
Clue 1 is complete. GalaxyHub.jsx renders a living starfield — 80 stars, 3 size tiers, twinkling, neon-on-dark. You are now placing the planets on top of that canvas.

There are 3 planets:
1. **Number Blasters** — active, tappable, glowing
2. **Word Quest** — locked, dim, coming soon
3. **Nature Lab** — locked, dim, coming soon

The layout should feel like a galaxy map — planets scattered naturally, not in a grid. Think: one planet upper-left area, one center-right, one lower area. Asymmetric and spatial.

## Your Task
Add planets to `src/hub/GalaxyHub.jsx`. Planets are positioned absolutely over the starfield.

Each planet should:
- Be circular, at least 80px diameter (touch target requirement)
- Have a retro pixel-art feel — chunky, glowing ring for the active one
- Show its name below in Press Start 2P font (small, 8-10px)
- Active planet (Number Blasters): bright, colorful, pulsing glow ring
- Locked planets: desaturated/dim, padlock emoji overlay, 50% opacity

Number Blasters planet visual identity: space/rocket theme, orange-red glow (matches the game's energy). Use a rocket emoji or simple CSS planet with rings — no image assets.

Locked planets: muted purple/grey. Simple circle. No interaction feedback yet (that's Clue 4).

## Files to Create/Modify
- `src/hub/GalaxyHub.jsx` — add planets layer on top of existing starfield

## Pass Conditions
- [ ] 3 planets render over the starfield
- [ ] Planets are positioned non-uniformly (not a row, not a grid)
- [ ] Number Blasters planet has a visible glow/pulse animation
- [ ] Locked planets are visually distinct — dim, padlock visible
- [ ] All planets are minimum 80px touch target
- [ ] Planet names visible in retro font below each planet
- [ ] Starfield from Clue 1 still renders correctly behind planets
- [ ] No console errors

## Do Not
- Wire up tap interactions yet — that's Clue 4
- Add the rocket — that's Clue 3
- Use image assets — CSS and emoji only
- Make it look like a mobile app grid — this is a galaxy map

## When You Pass
Write `hunts/galaxy-hub/clue-2/COMPLETE.md` with planet positions used and CSS approach for glow effect. Then open `hunts/galaxy-hub/clue-3/PROMPT.md`.
