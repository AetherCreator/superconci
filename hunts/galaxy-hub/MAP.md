# Hunt: Galaxy Hub — SuperConci Navigation Screen
Goal: A retro space navigation screen where Coci pilots a rocket through the galaxy, landing on planets to launch games. Number Blasters is the first planet. The screen is fun to be on, not just functional.
Repo: AetherCreator/SuperConci
Branch: feature/galaxy-hub
Base: main

## Clue Tree
1. **Starfield** → pass: Deep space background renders — 80 stars, varied sizes, slow parallax twinkle, neon-on-dark, no console errors
2. **Galaxy Layout** → pass: 3 planets positioned in the scene — Number Blasters planet visible and named, 2 future planets shown as "LOCKED" with dim styling, all have big touch targets (min 80px)
3. **Rocket Navigator** → pass: Coci's rocket renders in the scene with idle animation (gentle float), retro pixel-art style consistent with Press Start 2P aesthetic, positioned naturally in the layout
4. **Planet Interaction** → pass: Tapping Number Blasters planet launches the game full-screen, back/exit returns cleanly to the galaxy hub, locked planets show a "Coming Soon" toast on tap
5. **Polish & Audio** → pass: Hub has its own chiptune ambient loop (Web Audio API, matches NumberBlasters audio engine pattern), planet selection has a sound cue, transitions feel snappy not janky

## Dead End Protocol
If any clue fails 3 times:
- Stop immediately
- Write STUCK.md in the failed clue's folder
- Include: what was tried, what broke, what's needed
- Surface to Tyler with one specific question

## Dependencies
Load before starting:
- `src/NumberBlasters.jsx` — understand the AudioEngine class, reuse its pattern for hub audio
- `CLAUDE.md` — design language: Press Start 2P font, neon-on-dark, retro-arcade, chunky touch targets
- Existing `src/` structure — new files go in `src/hub/`

## File Targets
```
src/
└── hub/
    ├── GalaxyHub.jsx        ← Main hub component (clues 1-4 build this)
    └── HubAudio.js          ← Audio engine for hub (clue 5)
```
Plus update `src/NumberBlasters.jsx` only if needed for clean back-navigation.

## Success State (TREASURE)
A player opens SuperConci and sees the galaxy. Space feels alive. They tap a planet. Number Blasters launches. They play, they exit, they're back in space. The whole loop works. Coci would lose his mind.
