# Clue 9: Save/Resume + Story Library

## Mission
Build the persistence layer that saves story progress after each choice and the library screen where Coci browses his stories. Resume must reconstruct exact story state — segment, choices, history — so the kid picks up right where they left off.

## Context
- Save triggers after choice selection (confirmed state — design decision locked)
- Story segments table tracks: what text was shown, which choice was picked, any free text input, whether content was from pack/AI/fallback, whether safety passed
- Story Library is the "bookshelf" — all saved stories with world icon, title, status, last played
- Max 10 saved stories per profile
- Auto-generated titles: "Coci and the Midnight Express" style

## Build

### File: `src/games/story-quest/engine/StorySaver.js`

**Save after each choice:**

```javascript
class StorySaver {
  constructor({ storyId, storyDB }) {}

  // Save a completed segment (called after choice selection)
  async saveSegment({
    segmentNumber,       // Sequential position in this playthrough
    packSegmentId,       // Which pack segment this corresponds to (nullable for pure AI)
    content,             // The actual text that was displayed
    source,              // 'pack' | 'ai' | 'ai_retry' | 'fallback'
    choicesShown,        // Array of choice strings that were displayed
    selectedChoice,      // Index of the choice the kid picked
    freeTextInput,       // What the kid typed (if free text moment), null otherwise
    safetyPassed         // Boolean — did the safety check pass on first try?
  })

  // Update story metadata
  async updateStoryProgress(currentSegment) {
    // Updates stories.current_segment and stories.last_played
  }

  // Mark story as completed
  async completeStory() {
    // Sets stories.status = 'completed'
    // Generates auto-title if not already set
  }

  // Auto-generate a storybook title
  async generateTitle(storyId) {
    // Read first 3 segments from story_segments
    // Extract key nouns/themes
    // Format as "[HeroName] and the [Key Theme]"
    // e.g., "Coci and the Midnight Express"
    // "Coci and the Star Map"
    // "Coci and the Wandering Road"
    // Simple keyword extraction — no API call needed
  }
}
```

**Resume logic:**

```javascript
class StoryResumer {
  constructor({ storyDB }) {}

  // Reconstruct full story state for resume
  async resumeStory(storyId) {
    const story = await getStory(storyId);
    const segments = await getStorySegments(storyId);  // ORDER BY segment_number
    const hero = await getHero(story.profile_id);
    const pack = await getPackMeta(story.pack_id);

    return {
      story,
      hero,
      pack,
      // Rebuild history from saved segments
      history: segments.map(s => ({
        text: s.content,
        source: s.source,
        choice: s.selected_choice,
        freeText: s.free_text_input
      })),
      // Current position
      currentSegment: story.current_segment,
      segmentCount: segments.length,
      // For StoryEngine initialization
      formattedHistory: segments.map(s => s.content).join('\n\n')
    };
  }

  // Check if a story can be resumed (has segments, isn't completed)
  canResume(storyId) → boolean

  // Get last played segment for preview
  getLastSegment(storyId) → { content, choicesShown, selectedChoice }
}
```

### File: `src/games/story-quest/library/StoryLibrary.jsx`

**Layout:**
- Header: "Story Library" with a bookshelf emoji 📚
- Scrollable vertical list of story cards
- Each card shows:
  - World icon (emoji) + world name badge
  - Auto-generated title (large, bold)
  - Last played date ("Played 2 days ago" or "Today")
  - Status badge:
    - Active: pulsing dot + "Continue" button
    - Completed: ✅ badge + "Read Again" button (starts from beginning)
  - Brief preview: first sentence of the story, truncated
- Empty state: "No stories yet! Choose a world to begin your first adventure."
- If 10 stories saved: oldest completed story gets a "Replace?" prompt when starting a new one

**Card interaction:**
- Tap active story → resume via StoryResumer → navigate to StoryPlayer
- Tap completed story → "Read Again" starts fresh with same pack + hero
- Swipe left on a card → delete option (with confirmation: "Remove this story?")

**Sorting:** Active stories first (sorted by last_played desc), then completed (sorted by last_played desc)

**Props:**
```javascript
{
  profileId: string,
  heroData: HeroData,
  onResumeStory: (resumeData) => void,
  onNewStory: () => void,        // Navigate to world selector
  onBack: () => void
}
```

## Pass Conditions

- [ ] `saveSegment()` writes all fields correctly to story_segments table
- [ ] `updateStoryProgress()` updates current_segment and last_played
- [ ] `completeStory()` sets status to 'completed' and generates a title
- [ ] `generateTitle()` produces readable "[Name] and the [Theme]" titles without API calls
- [ ] `resumeStory()` reconstructs full story state: history, current position, segment count
- [ ] Resumed story feeds correct formatted history to StoryEngine for AI context
- [ ] Story Library renders all stories with correct world icons and status badges
- [ ] Active stories appear before completed stories
- [ ] "Continue" button on active story triggers resume flow
- [ ] Empty state shows when no stories exist
- [ ] Story deletion works with confirmation dialog
- [ ] 10-story limit is enforced with replacement prompt
- [ ] All touch targets ≥44×44px
- [ ] Cards are readable on iPhone — title, date, preview all visible without scrolling within card
- [ ] Complete files, no fragments
