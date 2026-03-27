/**
 * StorySaver.js — Save story progress after each choice + auto-title generation.
 */

import {
  saveSegment as dbSaveSegment,
  getStory,
  getStorySegments,
  getHero,
  updateStoryStatus,
  updateStoryTitle,
  persistDB,
} from '../db/storyDB.js';
import { getPackMeta } from '../db/packLoader.js';

export class StorySaver {
  constructor({ storyId }) {
    this.storyId = storyId;
    this.segmentNumber = 0;
  }

  async saveSegment({
    segmentNumber,
    packSegmentId,
    content,
    source,
    choicesShown,
    selectedChoice,
    freeTextInput,
    safetyPassed,
  }) {
    this.segmentNumber = segmentNumber;

    dbSaveSegment({
      storyId: this.storyId,
      segmentNumber,
      packSegmentId: packSegmentId || null,
      content,
      source,
      choicesShown,
      selectedChoice: selectedChoice ?? null,
      freeTextInput: freeTextInput || null,
      safetyPassed: safetyPassed !== false,
    });

    await persistDB();
  }

  async completeStory() {
    updateStoryStatus(this.storyId, 'completed');

    // Generate title if not already set
    const story = getStory(this.storyId);
    if (!story.title) {
      const title = this.generateTitle(this.storyId);
      updateStoryTitle(this.storyId, title);
    }

    await persistDB();
  }

  generateTitle(storyId) {
    const segments = getStorySegments(storyId);
    if (segments.length === 0) return 'An Adventure';

    // Get the story to find hero name
    const story = getStory(storyId);
    const hero = story ? getHero(story.profile_id) : null;
    const heroName = hero ? hero.name : 'Coci';

    // Extract key nouns/themes from first 3 segments
    const sampleText = segments
      .slice(0, 3)
      .map((s) => s.content)
      .join(' ')
      .toLowerCase();

    // Theme keywords to check, ordered by specificity
    const themes = [
      { keywords: ['train', 'railway', 'locomotive', 'express', 'station', 'tracks'], title: 'the Midnight Express' },
      { keywords: ['engine room', 'engine', 'steam', 'boiler', 'coal'], title: 'the Steam Engine' },
      { keywords: ['star', 'galaxy', 'nebula', 'constellation'], title: 'the Star Map' },
      { keywords: ['planet', 'space', 'rocket', 'orbit'], title: 'the Cosmic Voyage' },
      { keywords: ['dragon', 'castle', 'kingdom', 'quest'], title: 'the Dragon\'s Quest' },
      { keywords: ['sword', 'shield', 'knight', 'armor'], title: 'the Enchanted Blade' },
      { keywords: ['forest', 'tree', 'woodland', 'grove'], title: 'the Whispering Woods' },
      { keywords: ['animal', 'creature', 'fox', 'owl', 'bear', 'deer'], title: 'the Wild Friends' },
      { keywords: ['hero', 'power', 'mask', 'cape', 'super'], title: 'the Hero\'s Call' },
      { keywords: ['road', 'path', 'journey', 'wander', 'hill', 'meadow'], title: 'the Wandering Road' },
      { keywords: ['mountain', 'peak', 'climb', 'summit'], title: 'the Mountain Peak' },
      { keywords: ['river', 'stream', 'waterfall', 'bridge'], title: 'the Crystal River' },
      { keywords: ['treasure', 'gold', 'chest', 'jewel', 'gem'], title: 'the Hidden Treasure' },
      { keywords: ['map', 'compass', 'adventure', 'discover'], title: 'the Great Discovery' },
      { keywords: ['friend', 'companion', 'together', 'team'], title: 'the Brave Companions' },
    ];

    for (const theme of themes) {
      if (theme.keywords.some((kw) => sampleText.includes(kw))) {
        return `${heroName} and ${theme.title}`;
      }
    }

    // Fallback titles based on world
    const worldFallbacks = {
      'iron-rails': 'the Railway Adventure',
      'star-sector': 'the Space Mission',
      'old-realm': 'the Ancient Quest',
      'wild-earth': 'the Nature Trail',
      'hero-city': 'the Hero Training',
      'road-ever-on': 'the Long Road Home',
    };

    const worldId = story?.world_id;
    const fallback = worldFallbacks[worldId] || 'the Great Adventure';
    return `${heroName} and ${fallback}`;
  }
}

export class StoryResumer {
  resumeStory(storyId) {
    const story = getStory(storyId);
    if (!story) return null;

    const segments = getStorySegments(storyId);
    const hero = getHero(story.profile_id);
    const pack = getPackMeta(story.pack_id);

    return {
      story,
      hero,
      pack,
      history: segments.map((s) => ({
        text: s.content,
        source: s.source,
        choice: s.selected_choice,
        freeText: s.free_text_input,
      })),
      currentSegment: story.current_segment,
      segmentCount: segments.length,
      formattedHistory: segments
        .map((s, i) => `[Segment ${i + 1}] ${s.content}`)
        .join('\n\n'),
    };
  }

  canResume(storyId) {
    const story = getStory(storyId);
    if (!story) return false;
    if (story.status !== 'active') return false;
    const segments = getStorySegments(storyId);
    return segments.length > 0;
  }

  getLastSegment(storyId) {
    const segments = getStorySegments(storyId);
    if (segments.length === 0) return null;
    const last = segments[segments.length - 1];
    return {
      content: last.content,
      choicesShown: last.choices_shown ? JSON.parse(last.choices_shown) : null,
      selectedChoice: last.selected_choice,
    };
  }
}
