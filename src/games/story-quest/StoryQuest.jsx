/**
 * StoryQuest.jsx — Module entry point and internal router.
 * Manages: Hero Creation → World Selector → Story Player → Story Library → Parent View
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initDB, getHero, createStory, persistDB } from './db/storyDB.js';
import { importAllPacks } from './db/packLoader.js';
import HeroCreation from './hero/HeroCreation.jsx';
import WorldSelector from './worlds/WorldSelector.jsx';
import StoryPlayer from './player/StoryPlayer.jsx';
import StoryLibrary from './library/StoryLibrary.jsx';
import ParentView from './library/ParentView.jsx';
import StoryEngine from './engine/StoryEngine.js';
import { StorySaver, StoryResumer } from './engine/StorySaver.js';
import StoryAudio from './audio/StoryAudio.js';

const SCREENS = {
  LOADING: 'loading',
  HERO_CREATION: 'hero_creation',
  WORLD_SELECTOR: 'world_selector',
  STORY_PLAYER: 'story_player',
  STORY_LIBRARY: 'story_library',
  PARENT_VIEW: 'parent_view',
};

function StoryQuest({ profile, onExit }) {
  const profileId = profile?.id || 'default';
  const [screen, setScreen] = useState(SCREENS.LOADING);
  const [hero, setHero] = useState(null);
  const [storyEngine, setStoryEngine] = useState(null);
  const [currentWorldId, setCurrentWorldId] = useState(null);
  const [currentStoryId, setCurrentStoryId] = useState(null);

  const audioRef = useRef(null);
  const saverRef = useRef(null);
  const resumer = useRef(new StoryResumer());

  // Initialize on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDB();
        await importAllPacks();
        if (!mounted) return;

        const existingHero = getHero(profileId);
        if (existingHero) {
          setHero(existingHero);
          setScreen(SCREENS.WORLD_SELECTOR);
        } else {
          setScreen(SCREENS.HERO_CREATION);
        }
      } catch (err) {
        console.error('Story Quest init failed:', err);
        setScreen(SCREENS.HERO_CREATION);
      }
    })();
    return () => { mounted = false; };
  }, [profileId]);

  // Audio lifecycle
  useEffect(() => {
    audioRef.current = new StoryAudio();
    return () => {
      if (audioRef.current) audioRef.current.destroy();
    };
  }, []);

  // Hero creation complete
  const handleHeroComplete = useCallback((heroData) => {
    setHero({
      id: heroData.heroId,
      name: heroData.name,
      description: heroData.description,
      hair_color: heroData.hairColor,
      hair_style: heroData.hairStyle,
      skin_tone: heroData.skinTone,
      eye_color: heroData.eyeColor,
    });
    setScreen(SCREENS.WORLD_SELECTOR);
  }, []);

  // World selected → start or resume story
  const handleSelectWorld = useCallback(async (worldId, packId, storyId) => {
    setCurrentWorldId(worldId);

    let sId = storyId;
    const heroData = {
      name: hero.name,
      description: hero.description,
      pronoun: 'he', // Could be configurable
      possessive: 'his',
    };

    // Start audio
    if (audioRef.current) audioRef.current.startWorld(worldId);

    if (storyId) {
      // Resume existing story
      const resumeData = resumer.current.resumeStory(storyId);
      if (resumeData) {
        const engine = new StoryEngine({
          storyId,
          packId: resumeData.story.pack_id,
          heroData,
          onSegment: () => {},
          onChoices: () => {},
          onEnding: () => {},
          onError: () => {},
        });
        engine.setWorldId(worldId);
        engine.loadHistory(resumeData.history.map((h) => ({ content: h.text, source: h.source })));

        setStoryEngine(engine);
        saverRef.current = new StorySaver({ storyId });
        setCurrentStoryId(storyId);
        setScreen(SCREENS.STORY_PLAYER);
        return;
      }
    }

    // Create new story
    sId = createStory({ profileId, heroId: hero.id, packId, worldId });
    await persistDB();

    const engine = new StoryEngine({
      storyId: sId,
      packId,
      heroData,
      onSegment: () => {},
      onChoices: () => {},
      onEnding: () => {},
      onError: () => {},
    });
    engine.setWorldId(worldId);

    setStoryEngine(engine);
    saverRef.current = new StorySaver({ storyId: sId });
    setCurrentStoryId(sId);
    setScreen(SCREENS.STORY_PLAYER);
  }, [hero, profileId]);

  // Story complete
  const handleStoryComplete = useCallback(async (storyId) => {
    if (saverRef.current) await saverRef.current.completeStory();
    if (audioRef.current) {
      audioRef.current.playEffect('story_complete');
      audioRef.current.stop(2000);
    }
    setScreen(SCREENS.WORLD_SELECTOR);
    setStoryEngine(null);
    setCurrentStoryId(null);
  }, []);

  // Exit story player
  const handleExitPlayer = useCallback(() => {
    if (audioRef.current) audioRef.current.stop(1000);
    setScreen(SCREENS.WORLD_SELECTOR);
    setStoryEngine(null);
    setCurrentStoryId(null);
  }, []);

  // Resume from library
  const handleResumeFromLibrary = useCallback((story) => {
    handleSelectWorld(story.world_id, story.pack_id, story.id);
  }, [handleSelectWorld]);

  // Exit module → back to galaxy hub
  const handleExit = useCallback(() => {
    if (audioRef.current) audioRef.current.stop(500);
    onExit();
  }, [onExit]);

  // Hero avatar props
  const heroAvatar = hero ? {
    hairColor: hero.hair_color,
    hairStyle: hero.hair_style,
    skinTone: hero.skin_tone,
    eyeColor: hero.eye_color,
  } : {};

  // ─── Render ──────────────────────────────────────────────────────

  if (screen === SCREENS.LOADING) {
    return (
      <div style={styles.loading}>
        <p style={styles.loadingText}>Opening your storybook...</p>
      </div>
    );
  }

  if (screen === SCREENS.HERO_CREATION) {
    return (
      <HeroCreation
        profileId={profileId}
        onComplete={handleHeroComplete}
      />
    );
  }

  if (screen === SCREENS.WORLD_SELECTOR) {
    return (
      <WorldSelector
        heroName={hero?.name || 'Coci'}
        profileId={profileId}
        onSelectWorld={handleSelectWorld}
        onBack={handleExit}
      />
    );
  }

  if (screen === SCREENS.STORY_PLAYER && storyEngine) {
    return (
      <StoryPlayer
        storyEngine={storyEngine}
        hero={heroAvatar}
        worldId={currentWorldId}
        onExit={handleExitPlayer}
        onStoryComplete={handleStoryComplete}
      />
    );
  }

  if (screen === SCREENS.STORY_LIBRARY) {
    return (
      <StoryLibrary
        profileId={profileId}
        heroData={hero}
        onResumeStory={handleResumeFromLibrary}
        onNewStory={() => setScreen(SCREENS.WORLD_SELECTOR)}
        onBack={() => setScreen(SCREENS.WORLD_SELECTOR)}
      />
    );
  }

  if (screen === SCREENS.PARENT_VIEW) {
    return (
      <ParentView
        profileId={profileId}
        heroData={hero}
        onBack={() => setScreen(SCREENS.WORLD_SELECTOR)}
        onChangeHero={() => setScreen(SCREENS.HERO_CREATION)}
      />
    );
  }

  return null;
}

// Module export matching SuperConci contract
const StoryQuestModule = {
  id: 'story-quest',
  name: 'Story Quest',
  subject: 'reading',
  icon: '📖',
  component: StoryQuest,
  skills: ['reading', 'creativity', 'decision-making', 'vocabulary'],
  gradeRange: [0, 5],
  getProgress: (stats) => {
    // Simple: 20% per completed story, cap at 100
    const completed = stats?.completedStories || 0;
    return Math.min(100, completed * 20);
  },
  description: 'Be the hero of your own story',
};

export default StoryQuestModule;
export { StoryQuest };

const styles = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a3e 100%)',
  },
  loadingText: {
    fontSize: '12px',
    fontFamily: "'Press Start 2P', monospace",
    color: '#ffd700',
  },
};
