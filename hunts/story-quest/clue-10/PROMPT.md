# Clue 10: World Audio — 6 Procedural Ambient Loops

## Mission
Create procedural ambient audio for each of the 6 worlds using Web Audio API. Each world has a distinct sonic identity that plays during story segments. No audio files — everything synthesized.

## Context
- Web Audio API only (project constraint — no audio file imports)
- Audio plays during StoryPlayer, managed by world ID
- Crossfades when transitioning between worlds (rare but possible via library)
- Respects user sound settings from profile
- Number Blasters already has Web Audio precedent — follow similar patterns

## Build

### File: `src/games/story-quest/audio/StoryAudio.js`

**Module interface:**

```javascript
class StoryAudio {
  constructor()

  // Start ambient loop for a world
  startWorld(worldId) → void

  // Stop current audio with fade-out
  stop(fadeMs = 1000) → void

  // Crossfade to a different world
  crossfadeTo(worldId, durationMs = 2000) → void

  // Play a one-shot effect (choice made, story complete, etc.)
  playEffect(effectName) → void

  // Volume control
  setVolume(0-1) → void
  mute() → void
  unmute() → void

  // Cleanup
  destroy() → void
}
```

**6 World Soundscapes:**

Each world gets a unique procedural ambient loop. These are continuous, generative — they evolve subtly over time so they never feel like a short loop repeating.

**🚂 Iron Rails** — Rhythmic, mechanical, warm
- Base: Low rhythmic pulse (synth kick) at ~100 BPM, simulating train wheels on tracks
- Layer: Periodic steam hiss (filtered white noise burst, every 4 beats)
- Layer: Gentle metallic chime (high sine wave, pentatonic, random notes every 2-4 bars)
- Layer: Low warm drone (sawtooth, heavily filtered, root note)
- Mood: Cozy, rhythmic, industrial-warm

**🚀 Star Sector** — Ethereal, spacious, wonder
- Base: Deep sub-bass pad (sine, very slow LFO on pitch, ±2 semitones)
- Layer: Shimmering high frequencies (filtered noise, slow envelope, random panning)
- Layer: Soft synth plucks (triangle wave, pentatonic scale, sparse random timing)
- Layer: Occasional sonar-like ping (sine burst, high frequency, reverb tail)
- Mood: Vast, quiet, awe-inspiring

**🐉 The Old Realm** — Medieval folk, nature
- Base: Warm drone (filtered sawtooth, root + fifth)
- Layer: Plucked string simulation (Karplus-Strong synthesis, pentatonic melody, slow random)
- Layer: Soft wind (bandpass-filtered noise, slow volume LFO)
- Layer: Bird-like chirps (FM synthesis, brief high notes, random intervals 3-8 seconds)
- Mood: Forest clearing, peaceful, ancient

**🌿 Wild Earth** — Organic, nature, gentle
- Base: Layered nature drone (multiple bandpass-filtered noise at different frequencies = wind in trees)
- Layer: Water droplet sounds (sine wave with fast pitch envelope, random timing)
- Layer: Insect-like soft buzz (very low amplitude FM synthesis, continuous)
- Layer: Occasional animal-like call (pitch-swept sine, random every 5-10 seconds)
- Mood: Rainforest floor, teeming but gentle

**⚡ Hero City** — Upbeat, punchy, heroic
- Base: Driving beat (synth kick + hi-hat pattern at ~120 BPM)
- Layer: Power chord stabs (sawtooth + square, root + fifth, every 2 bars)
- Layer: Rising heroic motif (ascending 4-note pattern, triangle wave, every 8 bars)
- Layer: City ambient (subtle filtered noise, represents urban hum)
- Mood: Action-ready, confident, dawn-of-the-hero

**🌄 Road Goes Ever On** — Wandering, warm, hobbit-cozy
- Base: Gentle walking rhythm (~80 BPM, soft kick, brush-like noise hits)
- Layer: Warm pad (low-pass filtered sawtooth chord, major key, slow evolution)
- Layer: Penny whistle simulation (sine + slight vibrato, simple folk melody, 4-bar phrases, repeating with variation)
- Layer: Fire crackle (random short noise bursts, very low amplitude, warmth texture)
- Mood: Walking through the Shire on a sunny morning

**One-shot effects (shared across worlds):**
- `choice_made`: Soft chime (ascending two-note, major interval)
- `story_complete`: Warm fanfare (3-note ascending arpeggio + sustain, triangle wave + reverb)
- `free_text_prompt`: Gentle sparkle (rapid descending high sine notes, fairy-dust feel)
- `bridge_transition`: Soft whoosh (pitch-swept filtered noise, 500ms)

**Technical approach:**
- Create AudioContext on first user interaction (browser autoplay policy)
- Each world soundscape is a function that creates and connects oscillators/noise nodes
- Use GainNodes for volume control, crossfading, and individual layer mixing
- Generative timing: use `setTimeout` with randomized intervals for organic feel, not strict sequencer
- All oscillator frequencies from a defined scale (pentatonic or world-appropriate) to avoid dissonance
- Memory management: disconnect and close all nodes on `stop()` or `destroy()`

## Pass Conditions

- [ ] Each of the 6 worlds produces a distinct, recognizable soundscape
- [ ] Audio is fully procedural — no audio file imports anywhere
- [ ] `startWorld()` begins audio that evolves over time (not a static loop)
- [ ] `stop()` fades out smoothly over specified duration
- [ ] `crossfadeTo()` blends from current world to new world without gap or harshness
- [ ] `playEffect()` plays one-shot effects without interrupting ambient loop
- [ ] Volume control works (0 = silent, 1 = full)
- [ ] `mute()`/`unmute()` work without losing audio state
- [ ] AudioContext created on first user gesture (not on page load)
- [ ] `destroy()` properly disconnects all nodes and closes context
- [ ] Iron Rails feels rhythmic and train-like
- [ ] Star Sector feels vast and spacious
- [ ] Old Realm feels medieval and natural
- [ ] Wild Earth feels organic and gentle
- [ ] Hero City feels upbeat and heroic
- [ ] Road Goes Ever On feels warm and wandering
- [ ] None of the soundscapes are annoying after 5+ minutes of continuous play
- [ ] No external dependencies — pure Web Audio API
- [ ] Complete file, no fragments
