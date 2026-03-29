# Clue 12: Hub Integration + Launch Story Packs

## Mission
Wire Story Quest into SuperConci's world hub as a game module, and generate the 3 launch story packs. This is the final assembly — when this clue passes, Story Quest is playable.

## Context
- SuperConci uses a module contract (see CLAUDE.md — every game exports id, name, component, etc.)
- Story Quest needs to register itself with the hub
- The 3 launch packs are generated and committed as JSON files
- This clue depends on ALL previous clues being complete

## Build

### Part 1: Module Registration

### File: `src/games/story-quest/StoryQuest.jsx`

**Module entry point and internal router:**

```javascript
// This is the top-level component that the hub renders
// Manages internal navigation: Hero Creation → World Selector → Story Player → Story Library
function StoryQuest({ profile, onExit }) {
  // Internal routing states:
  // 'hero_creation' — first time, no hero exists
  // 'world_selector' — main menu, pick a world
  // 'story_player' — playing a story
  // 'story_library' — browsing saved stories
  // 'parent_view' — PIN-protected parent dashboard

  // On mount:
  // 1. Initialize Story Quest's SQLite database (storyDB)
  // 2. Import any new/updated packs from packs/ directory
  // 3. Check if hero exists for this profile
  //    - No hero → route to 'hero_creation'
  //    - Has hero → route to 'world_selector'
}
```

**Module export (matching SuperConci contract):**

```javascript
export default {
  id: 'story-quest',
  name: 'Story Quest',
  subject: 'reading',
  icon: '📖',
  component: StoryQuest,
  skills: ['reading', 'creativity', 'decision-making', 'vocabulary'],
  gradeRange: [0, 5],
  getProgress: (stats) => {
    // Calculate from: stories completed, segments played, worlds explored
    // Returns 0-100
  },
  description: 'Be the hero of your own story'
};
```

### Part 2: Hub Wiring

Add Story Quest to the hub's game registry. This may require editing `src/App.jsx` or `src/hub/WorldHub.jsx` depending on how Number Blasters is registered. **Follow the exact same pattern.**

Story Quest portal card in the hub should show:
- 📖 icon
- "Story Quest" title
- "Be the hero of your own story" subtitle
- Progress indicator (stories completed / worlds explored)
- Tapping navigates into StoryQuest component

### Part 3: Launch Story Packs

Generate 3 complete story packs as JSON files. Each pack must:
- Follow the pack schema exactly (Clue 2's PACK-FORMAT.md)
- Be calibrated for reading level 3 (3rd grade — Conci's actual level)
- Have 15-20 segments with 3-4 meaningful branch paths
- Include 3-4 AI enhancement moments with fallbacks
- Use hero placeholders throughout ([NAME], [PRONOUN], [POSSESSIVE])
- Have at least one free text moment per pack
- End with a satisfying conclusion (one ending per branch path)

### File: `src/games/story-quest/packs/iron-rails-pack-1.json`

**"The Midnight Express"** — Iron Rails world
- Conci becomes an apprentice engineer on a magical steam train
- Core plot: the Midnight Express is losing steam and only a new engineer can find the Crystal Coal to power it
- Branch paths: take the mountain route vs the bridge route vs the underground tunnel
- AI moments: first free text in the engine room, mid-story encounter with the Conductor's riddle, climax choice at the Crystal Cavern
- Tone: engineering puzzles, bravery, problem-solving
- Reading level 3: rich descriptive language, compound sentences, engineering vocabulary (gauge, piston, throttle)

### File: `src/games/story-quest/packs/road-ever-on-pack-1.json`

**"The Green Door"** — Road Goes Ever On world
- Conci discovers a round green door in a hillside (very Tolkien)
- Core plot: beyond the door is a cozy underground home, and its owner has gone on a journey, leaving a map and a note: "Follow the road — it goes ever on"
- Branch paths: follow the river road vs take the high hills vs explore the old forest
- AI moments: free text when Conci finds the map, mid-story meeting with a friendly wandering storyteller, climax at the ancient tree
- Tone: wonder, home, belonging, walking, nature
- Reading level 3: archaic-flavored prose ("Indeed!" "What a curious thing!"), Tolkien-adjacent vocabulary (hobbit-hole, waistcoat, second breakfast)

### File: `src/games/story-quest/packs/star-sector-pack-1.json`

**"The Star Map"** — Star Sector world
- Conci is a junior captain whose ship receives a mysterious star map
- Core plot: the map leads to three uncharted planets, each with a piece of a signal that when combined, sends a message home
- Branch paths: visit the ice planet first vs the jungle planet vs the crystal planet
- AI moments: free text when decoding the star map, mid-story first contact with a friendly alien, climax assembling the signal
- Tone: discovery, science wonder, communication, teamwork
- Reading level 3: science vocabulary (orbit, atmosphere, frequency), descriptive alien landscapes

**Pack quality standards:**
- Every segment should be 4-6 sentences for reading level 3
- Choices should be action-oriented, starting with a verb
- AI moment prompts should give Claude clear context + constraints
- Fallback text for AI moments should be indistinguishable in quality from procedural segments
- Hero placeholders used naturally — not every sentence, but the hero is always the central actor
- No dead ends — every branch path reaches a satisfying conclusion
- Conclusion segments should feel like the last page of a storybook chapter

## Pass Conditions

- [ ] StoryQuest.jsx renders and routes correctly between all internal screens
- [ ] Module export matches SuperConci's game module contract exactly
- [ ] Story Quest appears in the hub alongside Number Blasters
- [ ] Hub portal card shows correct icon, name, description, progress
- [ ] Tapping the portal card launches Story Quest
- [ ] onExit returns to the hub cleanly
- [ ] SQLite initializes on module mount without affecting Dexie
- [ ] Pack import runs on mount and imports all 3 launch packs
- [ ] iron-rails-pack-1.json validates against pack schema
- [ ] road-ever-on-pack-1.json validates against pack schema
- [ ] star-sector-pack-1.json validates against pack schema
- [ ] Each pack has 15-20 segments with complete branching
- [ ] Each pack has 3-4 AI moments with fallbacks
- [ ] Each pack has at least 1 free text moment
- [ ] All packs use hero placeholders correctly
- [ ] Reading level is appropriate for 3rd grade (verified by reading sample segments aloud)
- [ ] Every branch path reaches a conclusion segment
- [ ] Pack content is engaging, warm, and Conci-appropriate
- [ ] Complete files, no fragments
