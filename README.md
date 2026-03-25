# 🚀 Number Blasters

A Math Blasters-inspired arcade learning game for kids. Built as a React artifact with procedural chiptune audio.

## What It Is

Asteroids fall toward your ship — each one has a number on it. Blast the asteroid with the **correct answer** to the math problem before they reach you!

**Three difficulty tiers:**
- 🚀 **Cadet** — Addition 1-5 (kindergarten)
- 🛸 **Pilot** — Addition & subtraction 1-10 (1st grade)
- ⭐ **Commander** — Addition & subtraction 1-20 (2nd grade)

## Features

- **Procedural chiptune music** — Web Audio API synth, no audio files needed
- **Sound effects** — laser zaps, hit confirmations, impact rumbles, victory fanfares
- **Combo system** — streak multiplier rewards consecutive correct answers (x2, x3, x4)
- **Lives system** — 3 shields; miss an asteroid and it hits your ship
- **Adaptive speed** — asteroids fall faster at higher difficulties
- **iPhone-first** — touch-optimized, no keyboard required

## Tech

Single-file React component. No dependencies beyond React. All audio generated procedurally via Web Audio API.

## Roadmap

This is the seed of a personalized learning platform:
- [ ] Adaptive difficulty (track weak spots, serve more of those)
- [ ] Multiplication & division modules
- [ ] Word problems
- [ ] Parent dashboard with progress tracking
- [ ] Unlock/reward system
- [ ] Reading/phonics module (same arcade mechanic)

## License

MIT
