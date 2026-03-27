# Clue 5: World Selector UI

## Mission
Build the world selection screen — 6 themed world cards that Coci taps to start (or continue) a story. Each world has its own visual identity, icon, and available story packs.

## Context
- This screen appears after hero creation (first time) or as the main Story Quest menu (returning)
- Each world card shows: icon, name, pack availability, and whether a story is in progress
- Reading level filtering may be needed later but v1 shows all worlds
- Coci's 3 launch worlds (Iron Rails, Road Goes Ever On, Star Sector) will have packs; the other 3 show as "Coming Soon"

## Build

### File: `src/games/story-quest/worlds/WorldSelector.jsx`

**The 6 Worlds (data):**

```javascript
const WORLDS = [
  {
    id: 'iron_rails',
    name: 'Iron Rails',
    icon: '🚂',
    description: 'A steam-powered railway kingdom',
    tone: 'Engineering puzzles and adventure',
    role: 'Engineer apprentice',
    color: '#4a6fa5',      // Steel blue
    bgGradient: ['#2c3e50', '#4a6fa5'],
    available: true
  },
  {
    id: 'star_sector',
    name: 'Star Sector',
    icon: '🚀',
    description: 'Far future space exploration',
    tone: 'Discovery and wonder',
    role: 'Junior space captain',
    color: '#6c3d8f',      // Deep purple
    bgGradient: ['#1a1a2e', '#6c3d8f'],
    available: true
  },
  {
    id: 'old_realm',
    name: 'The Old Realm',
    icon: '🐉',
    description: 'Classic fantasy adventure',
    tone: 'Courage and friendship',
    role: 'Young adventurer',
    color: '#2d6a2e',      // Forest green
    bgGradient: ['#1a3a1a', '#2d6a2e'],
    available: false        // Coming Soon in v1
  },
  {
    id: 'wild_earth',
    name: 'Wild Earth',
    icon: '🌿',
    description: 'The animal kingdom',
    tone: 'Empathy and curiosity',
    role: 'Animal guardian',
    color: '#5d8a3c',      // Leaf green
    bgGradient: ['#2a4a1a', '#5d8a3c'],
    available: false
  },
  {
    id: 'hero_city',
    name: 'Hero City',
    icon: '⚡',
    description: 'Superhero urban world',
    tone: 'Action and justice',
    role: 'New hero in training',
    color: '#c0392b',      // Hero red
    bgGradient: ['#2c1320', '#c0392b'],
    available: false
  },
  {
    id: 'road_ever_on',
    name: 'The Road Goes Ever On',
    icon: '🌄',
    description: 'Hobbit-inspired wandering',
    tone: 'Wonder, home, and belonging',
    role: 'Small but brave traveler',
    color: '#b07940',      // Warm brown
    bgGradient: ['#3a2a1a', '#b07940'],
    available: true
  }
];
```

**Layout:**
- Header: "Choose Your World" with hero name ("Where will [NAME] go today?")
- 2-column grid of world cards on iPhone, 3-column on iPad
- Each card is a full-bleed gradient rectangle with:
  - Large emoji icon (32px+)
  - World name (bold, white)
  - One-line description
  - Role badge: "You are: [role]"
  - Status indicator:
    - Has active story → "Continue your adventure" with progress dots
    - Has packs but no active story → "Begin" 
    - No packs yet → "Coming Soon" (dimmed, not tappable)
- Cards have subtle border glow in their world color
- Active story card gets a gentle pulse animation

**Behavior:**
- On tap (available world with packs):
  - If active story exists → navigate to StoryPlayer with that story
  - If no active story → show pack selection (or auto-start if only one pack)
  - Pack selection: simple list of available packs for this world, with title and reading level badge
- On tap (coming soon) → nothing, or brief "More worlds coming!" toast
- Query `getActiveStories()` and `getWorldPacks()` from storyDB on mount

**Props:**
```javascript
{
  heroName: 'Coci',
  profileId: string,
  onSelectWorld: (worldId, packId, storyId?) => void,
  onBack: () => void   // Return to hero screen or hub
}
```

## Pass Conditions

- [ ] All 6 world cards render with correct icons, names, descriptions, and colors
- [ ] Available worlds are tappable, "Coming Soon" worlds are visually dimmed and not tappable
- [ ] Active story indicator shows correctly when a story is in progress
- [ ] Tapping a world with an active story passes the storyId to onSelectWorld
- [ ] Tapping a world with no active story triggers pack selection or auto-starts
- [ ] Layout is 2-column on iPhone viewport, responsive
- [ ] All touch targets ≥44×44px
- [ ] Cards look distinct — each world has its own visual identity
- [ ] Hero name is injected into the header
- [ ] Queries storyDB for active stories and packs on mount
- [ ] No external image files — pure CSS/emoji/gradient
