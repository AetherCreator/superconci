# Story Pack Format Guide

Story packs are JSON files that define interactive stories for Story Quest. Each pack is a self-contained adventure with branching paths, AI-enhanced moments, and offline fallbacks.

---

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique pack identifier, e.g. `"iron-rails-pack-1"` |
| `world` | string | Yes | Must match a world_id: `iron-rails`, `star-sector`, `old-realm`, `wild-earth`, `hero-city`, `road-ever-on` |
| `title` | string | Yes | Story title, e.g. `"The Midnight Express"` |
| `readingLevel` | number | Yes | 1-5 (see Reading Levels below) |
| `targetAge` | [min, max] | No | Age range, defaults to [4, 8] |
| `author` | string | No | e.g. `"tyler+claude"` |
| `version` | number | No | Pack version for updates, defaults to 1 |
| `heroPlaceholders` | object | No | Custom placeholder tokens (defaults provided) |
| `segments` | array | Yes | Array of story segments (see below) |

---

## Placeholders

Use these tokens in segment text — they're replaced at runtime with the hero's actual data:

| Token | Replaced With | Example |
|-------|---------------|---------|
| `[NAME]` | Hero's name | "Conci" |
| `[PRONOUN]` | he/she/they | "he" |
| `[POSSESSIVE]` | his/her/their | "his" |
| `[HERO_DESCRIPTION]` | Full character description | "a brave adventurer with curly dark hair..." |

---

## Segment Types

### Procedural Segment

Pre-authored content with fixed choices. No AI needed, works offline.

```json
{
  "id": 1,
  "type": "procedural",
  "text": "[NAME] stood on the platform as the train whistled. Steam billowed around [POSSESSIVE] boots.",
  "choices": ["Climb aboard the train!", "Ask the conductor where it's going"],
  "nextMap": { "0": 2, "1": 3 }
}
```

- `id` — Unique integer within this pack
- `text` — The story segment (use placeholders)
- `choices` — Array of choice strings the kid taps
- `nextMap` — Object mapping choice index (as string) to next segment id

### AI Moment

A segment enhanced by Claude at runtime. Always has an offline fallback.

```json
{
  "id": 5,
  "type": "ai_moment",
  "context": "Hero just discovered the engine room. This is the first free text moment.",
  "prompt": "The hero has just entered the engine room of the Midnight Express. Write a vivid 3-sentence description of what they see, then offer 3 exciting choices.",
  "allowFreeText": true,
  "fallback": {
    "text": "[NAME] gasped. The engine room was enormous, filled with glowing pipes and spinning gears.",
    "choices": ["Touch the glowing wheel", "Pull a big red lever", "Look through the brass periscope"],
    "nextMap": { "0": 6, "1": 7, "2": 8 }
  },
  "branchHints": {
    "explore": 6,
    "mechanical": 7,
    "observe": 8
  }
}
```

- `context` — Background for Claude (not shown to kid)
- `prompt` — The actual prompt sent to Claude API
- `allowFreeText` — If true, kid can type their own action
- `fallback` — Used when offline or if AI fails. Same format as procedural.
- `branchHints` — Maps keywords to segment ids. After AI generates choices and kid picks one, the engine matches their choice text against these keywords to determine which pack segment to continue from. First match wins; if none match, first hint is used.

### Ending Segment

A procedural segment that ends the story.

```json
{
  "id": 20,
  "type": "procedural",
  "text": "[NAME] smiled as the train pulled into the station. What an adventure!",
  "isEnding": true,
  "endingType": "triumph"
}
```

- `isEnding` — Marks this as a story conclusion
- `endingType` — One of: `triumph`, `bittersweet`, `cliffhanger`, `cozy`
- No choices or nextMap needed

---

## Branching

### Procedural Branching
Choices map directly to next segments via `nextMap`:
```
Segment 1 → choice 0 → Segment 2
           → choice 1 → Segment 3
```

### AI Moment Branching
AI generates dynamic choices. The engine matches the kid's selection against `branchHints` keywords:
```
Segment 5 (AI) → kid picks "I want to explore the pipes" → matches "explore" → Segment 6
                → kid picks "Let me fix this machine"     → matches "mechanical" → Segment 7
```

---

## Reading Levels

| Level | Grade | Sentences | Words per sentence | Vocabulary |
|-------|-------|-----------|-------------------|------------|
| 1 | Pre-K | 2-3 per segment | 5-8 | Simple, concrete nouns and verbs |
| 2 | K | 2-3 per segment | 6-10 | Basic adjectives, simple emotions |
| 3 | 1st | 3-4 per segment | 8-12 | Descriptive, compound sentences OK |
| 4 | 2nd | 3-5 per segment | 10-15 | Richer vocabulary, metaphors |
| 5 | 3rd+ | 4-6 per segment | 12-20 | Complex sentences, literary language |

---

## Pack Authoring Tips

1. **Start with segment 1** — the engine always begins here
2. **Every non-ending segment must lead somewhere** — no dead ends
3. **Use 1-2 AI moments per story** — they're the spice, not the meal
4. **Always write good fallbacks** — they ARE the story when offline
5. **Keep choices action-oriented** — start with a verb ("Climb", "Ask", "Run")
6. **Branch hints should be broad keywords** — "explore", "fight", "help", not full sentences
7. **Test your nextMap** — every choice index must point to a real segment id
8. **15-20 segments is a good story** — about 15 minutes of play
9. **End with a satisfying conclusion** — kids remember how stories end
