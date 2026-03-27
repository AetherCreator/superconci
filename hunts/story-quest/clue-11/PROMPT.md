# Clue 11: Parent View — PIN-Protected Story Logs + Stats

## Mission
Build the parent dashboard — PIN-protected access to full story text logs, time spent, and a "Read Together" mode for bedtime. This is where Tyler sees the magic from the outside.

## Context
- PIN protection reuses the existing SuperConci parent PIN system (check `settings` table in Dexie — this is one place Story Quest reads from the platform layer)
- If no PIN exists yet, prompt to create one (4-digit)
- All data comes from Story Quest's SQLite database
- "Read Together" mode = full story rendered as a readable document, like a bedtime storybook

## Build

### File: `src/games/story-quest/library/ParentView.jsx`

**PIN Gate:**
- 4-digit PIN entry screen with large number buttons (48×48px each)
- If no PIN set: "Set a parent PIN" flow (enter + confirm)
- PIN stored in SuperConci's existing Dexie `settings` table (not in Story Quest's SQLite)
- 3 wrong attempts → 30-second cooldown with "Ask a grown-up for help" message
- PIN entry uses a simple grid layout, friendly to adult thumbs

**Dashboard (after PIN):**

```
┌────────────────────────────┐
│  Parent Dashboard          │
│  [Stories] [Stats] [Settings]  ← tab bar
└────────────────────────────┘
```

**Tab 1: Stories**
- List of all stories (active + completed)
- Each card shows: world, title, status, date range, segment count
- Tap a story → Read Together mode

**Tab 2: Stats**
- Total stories started / completed
- Total time spent in Story Quest (sum of session durations, estimated from segment timestamps)
- Favorite world (most stories started in)
- Average story length (segments played)
- AI vs procedural ratio (how often AI moments were used vs skipped/fallback)
- Safety events: count of times safety check flagged content (hopefully 0)
- Simple, clean presentation — no fancy charts needed for v1

**Tab 3: Settings**
- Sound on/off toggle
- Music volume slider
- Change hero (navigate to hero creation)
- Change PIN
- Clear all story data (with serious confirmation: "This will delete all of [Name]'s stories. Are you sure?")

**Read Together Mode:**
- Full story rendered as a scrollable, beautiful document
- Each segment flows as continuous prose (no choice indicators)
- Where a choice was made: subtle "→ [choice text]" in italics
- Where free text was entered: "[Name] decided: '[text]'" in a highlighted callout
- World-themed background color, clean readable font
- "The End" marker for completed stories
- Share button (copies story text to clipboard for pasting elsewhere)
- Font size: slightly larger than story player (20-22px) for comfortable adult reading

**Read Together special touches:**
- The hero's character description as an opening "dedication" at the top
- World name and date as a subtitle
- Story flows like a real chapter book — this is what makes Tyler tear up

## Pass Conditions

- [ ] PIN entry screen shows with 4-digit number pad
- [ ] PIN creation flow works (enter + confirm)
- [ ] Wrong PIN shows error, 3 failures triggers cooldown
- [ ] PIN reads from / writes to SuperConci's Dexie settings table
- [ ] Stories tab lists all stories with correct metadata
- [ ] Stats tab shows accurate counts derived from SQLite queries
- [ ] Safety event count is accurate (counts segments where safety_passed = false... wait, unsafe segments aren't saved. Count retries from source = 'ai_retry' or 'fallback')
- [ ] Read Together mode renders full story as continuous prose
- [ ] Choice indicators appear subtly in Read Together mode
- [ ] Free text inputs are highlighted in Read Together mode
- [ ] Share button copies story text to clipboard
- [ ] Settings: sound toggle, volume, change hero, change PIN, clear data all work
- [ ] Clear data confirmation requires explicit action
- [ ] All touch targets ≥44×44px
- [ ] Layout works on both iPhone and iPad
- [ ] Complete file, no fragments
