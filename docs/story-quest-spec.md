# Story Quest — Product Spec v1.0
**SuperConci Module 2**
Last updated: 2026-03-27

---

## The Big Picture

Story Quest is an AI-powered interactive story experience where Coci IS the hero. He takes a selfie, becomes a storybook character, picks a world, and Claude writes the adventure around him in real-time. Every choice he makes shapes the story. Every story is saved so he can continue tomorrow.

It's a stress test for THDD and the best thing Tyler has ever built for his son.

---

## The Hero Creation Flow

First time only (or when Coci wants a new look):

**Step 1: Take your hero photo**
Big camera button. Coci takes a selfie or Tyler takes one of him.
Photo stays on device — never stored on a server. Only sent to Claude API for the single analysis call, then discarded.

**Step 2: Claude Vision reads the photo**
Single API call with the image:
```
Analyze this child's photo and generate a warm, descriptive character profile for a storybook hero. Include: hair color and style, eye color, skin tone, any distinctive features. Write it as a storybook character description, 2-3 sentences, whimsical and positive. Example: "Coci is a brave adventurer with wild curly dark hair, warm brown eyes that sparkle with curiosity, and a smile that could light up the whole galaxy."
```

**Step 3: Meet your hero**
Show the generated description on screen with a big illustrated avatar.
The avatar is a CSS/SVG illustrated character — not a photo, not AI-generated imagery. A charming storybook silhouette with color properties (hair color, skin tone, eye color) mapped from the character description.
Coci can tap "That's me!" or "Try again."

**Step 4: Name your hero**
Pre-filled with "Coci" but editable.
This name + character description gets injected into every story forever.

---

## The 6 Worlds

Each world has its own visual theme, story tone, character roster, ambient audio, and opening narrative hook.

| World | Setting | Tone | Coci's role |
|-------|---------|------|-------------|
| 🚂 Iron Rails | Steam-powered railway kingdom | Engineering puzzles, adventure | Engineer apprentice |
| 🚀 Star Sector | Far future space exploration | Discovery, wonder | Junior space captain |
| 🐉 The Old Realm | Classic fantasy, Tolkien-adjacent | Courage, friendship | Young adventurer |
| 🌿 Wild Earth | Animal kingdom, nature | Empathy, curiosity | Animal guardian |
| ⚡ Hero City | Superhero urban world | Action, justice | New hero in training |
| 🌄 The Road Goes Ever On | Hobbit-inspired wandering | Wonder, home, belonging | Small but brave traveler |

---

## The Story Engine

### Generation Architecture
Every story generation call:
```
System: You are a master storyteller writing for a 5-year-old named [name].
[Character description injected here.]
Current world: [world name and setting].
Story so far: [full story history].
Write the next story segment (3-5 sentences, age-appropriate, vivid, engaging).
Then generate 2-3 choices for what happens next, plus occasionally one "What do YOU want to do?" free text prompt.
Format as JSON: { segment: string, choices: string[], allowFreeText: boolean }
```

**Streaming:** Story text streams word by word via Claude API streaming. Text appears like it's being typed by a magical narrator.

**Choice generation:** Dynamic — Claude generates choices based on story context. Each choice is 1 short sentence, action-oriented, starts with a verb.

**Free text moments:** allowFreeText: true appears roughly every 4-5 segments. Coci types what happens next. His input gets incorporated into the next segment naturally.

### Story Memory
Full story history passed on every call.
Stories auto-save after every segment to SQLite.
Max story length: 20 segments (~15-20 minutes of play). After 20, Claude is prompted to wrap up with a satisfying conclusion.

### Character Injection
Every generation prompt includes:
```
Hero: [name] — [character description]
Always refer to the hero by name. Make them the central actor in every segment.
```

---

## Content Safety Pipeline

Every generated segment passes through safety check before rendering:

1. Claude generates segment + choices (streamed)
2. After full segment received, run safety check:
```
Is this content appropriate for a 5-year-old? Check for: violence beyond mild cartoon action, scary content, adult themes, anything distressing. Return: { safe: boolean, reason: string }
```
3. Safe → render. Unsafe → silently regenerate with stricter prompt, max 2 retries. Still unsafe → show generic bridge segment.

Safety check is a separate API call. Fast, cheap. Runs after streaming completes, before choices appear.

---

## The Avatar System

CSS/SVG illustrated character. No image generation API. No photos stored.

**Properties mapped from character description:**
- Hair color → CSS variable
- Hair style → one of 6 sprite variants (curly, straight, short, long, braided, wild)
- Skin tone → CSS variable (warm spectrum)
- Eye color → CSS variable

**5 expressions:** Neutral / Excited / Surprised / Determined / Content
Triggered by sentiment keywords in generated segment.

**Placement:** Bottom-left of story screen, small, gently animated. World-specific costume overlay per world (space helmet, railway cap, wizard hat, etc.)

---

## The Story Library

- All saved stories with world icon, auto-generated title, last played date
- "Continue" resumes from exact point
- Completed stories show badge
- Max 10 saved stories
- Auto-generated title: "Coci and the Midnight Express" style

---

## Parent View

PIN-protected. Shows all stories, full text log, time spent, "Read Together" mode.

---

## Audio

Web Audio API. Per-world ambient loops — procedural chiptune, distinct per world:
- Iron Rails: rhythmic, mechanical, steam-whistle accents
- Star Sector: ethereal, spacious, soft synth
- Old Realm: medieval folk feel, plucked strings simulation
- Wild Earth: gentle, organic, nature sounds
- Hero City: upbeat, punchy, heroic
- Road Goes Ever On: wandering, warm, hobbit-cozy

---

## Tech Stack

SuperConci repo, new module:
```
src/games/story-quest/
├── StoryQuest.jsx
├── HeroCreation.jsx
├── WorldSelector.jsx
├── StoryEngine.jsx
├── StoryPlayer.jsx
├── Avatar.jsx
├── StoryLibrary.jsx
├── ParentView.jsx
├── SafetyCheck.js
├── StoryAudio.js
└── storyDB.js
```

New SQLite tables:
```sql
heroes: id, profile_id, name, description, hair_color, hair_style, skin_tone, eye_color, created_at
stories: id, profile_id, hero_id, world_id, title, status, created_at, last_played
story_segments: id, story_id, segment_number, content, choices, selected_choice, free_text_input
```

---

## Build Order

1. SQLite tables + storyDB module
2. Hero creation — camera, Claude Vision, character description generation
3. Avatar component — CSS/SVG with expressions + world costumes
4. World selector UI — 6 themed world cards
5. Story engine — Claude API streaming, choice generation, history management
6. Story player UI — text rendering, choice buttons, free text input
7. Content safety pipeline
8. Story persistence + save/resume
9. Story library screen
10. World-specific audio (6 worlds)
11. Parent view
12. SuperConci integration — onExit back to galaxy hub

---

## Opus Assessment

✅ Route to Opus for mapmaking.

Hard clues requiring tight specs:
- Clue 2: Claude Vision + avatar property extraction — image API, structured output parsing
- Clue 5: Streaming engine — most architecturally complex, cascade risk if wrong
- Clue 7: Content safety pipeline — renders to a 5-year-old, zero tolerance for bad output

---

## Success Metrics

- Coci asks to play Story Quest unprompted
- He recognizes himself in the avatar
- He makes a choice that surprises Tyler
- A story makes him laugh out loud
- Tyler reads a saved story and tears up a little
