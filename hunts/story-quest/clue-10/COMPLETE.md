# Clue 10: COMPLETE — World Audio (6 Procedural Ambient Loops)

## What Was Built

### `src/games/story-quest/audio/StoryAudio.js`
Procedural ambient audio engine using pure Web Audio API:

**6 World Soundscapes:**
- **Iron Rails** — rhythmic pulse (train wheels), steam hiss, metallic chimes, warm drone
- **Star Sector** — deep sub-bass with LFO, shimmer noise, synth plucks, sonar pings
- **Old Realm** — root+fifth drone, wind noise, plucked strings, bird chirps
- **Wild Earth** — layered wind bands, water droplets, FM insect buzz, animal calls
- **Hero City** — kick+hi-hat at 120 BPM, power chord stabs, rising heroic motif, city hum
- **Road Goes Ever On** — gentle walking beat at 80 BPM, warm pad chord, penny whistle melody with vibrato, fire crackle

**4 One-shot Effects:**
- choice_made: ascending two-note chime
- story_complete: three-note fanfare arpeggio
- free_text_prompt: descending sparkle cascade
- bridge_transition: pitch-swept whoosh

**API:** startWorld(), stop(fadeMs), crossfadeTo(worldId, durationMs), playEffect(name), setVolume(), mute()/unmute(), destroy()

All generative with randomized timing — never feels like a short loop repeating.

## What Clue 11 Inherits
- StoryAudio is a standalone class, instantiate and call startWorld(worldId)
- Effects play over ambient without interrupting
- destroy() cleans up all nodes and closes AudioContext
