/**
 * WorldSelector.jsx — 6 themed world cards for Story Quest.
 * Coci picks a world → starts or continues a story.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getActiveStories } from '../db/storyDB.js';
import { getWorldPacks } from '../db/packLoader.js';

const WORLDS = [
  {
    id: 'iron-rails',
    name: 'Iron Rails',
    icon: '🚂',
    description: 'A steam-powered railway kingdom',
    tone: 'Engineering puzzles and adventure',
    role: 'Engineer apprentice',
    color: '#4a6fa5',
    bgGradient: ['#2c3e50', '#4a6fa5'],
    available: true,
  },
  {
    id: 'star-sector',
    name: 'Star Sector',
    icon: '🚀',
    description: 'Far future space exploration',
    tone: 'Discovery and wonder',
    role: 'Junior space captain',
    color: '#6c3d8f',
    bgGradient: ['#1a1a2e', '#6c3d8f'],
    available: true,
  },
  {
    id: 'old-realm',
    name: 'The Old Realm',
    icon: '🐉',
    description: 'Classic fantasy adventure',
    tone: 'Courage and friendship',
    role: 'Young adventurer',
    color: '#2d6a2e',
    bgGradient: ['#1a3a1a', '#2d6a2e'],
    available: false,
  },
  {
    id: 'wild-earth',
    name: 'Wild Earth',
    icon: '🌿',
    description: 'The animal kingdom',
    tone: 'Empathy and curiosity',
    role: 'Animal guardian',
    color: '#5d8a3c',
    bgGradient: ['#2a4a1a', '#5d8a3c'],
    available: false,
  },
  {
    id: 'hero-city',
    name: 'Hero City',
    icon: '⚡',
    description: 'Superhero urban world',
    tone: 'Action and justice',
    role: 'New hero in training',
    color: '#c0392b',
    bgGradient: ['#2c1320', '#c0392b'],
    available: false,
  },
  {
    id: 'road-ever-on',
    name: 'The Road Goes Ever On',
    icon: '🌄',
    description: 'Hobbit-inspired wandering',
    tone: 'Wonder, home, and belonging',
    role: 'Small but brave traveler',
    color: '#b07940',
    bgGradient: ['#3a2a1a', '#b07940'],
    available: true,
  },
];

export { WORLDS };

export default function WorldSelector({ heroName = 'Coci', profileId, onSelectWorld, onBack }) {
  const [activeStories, setActiveStories] = useState({});
  const [worldPacks, setWorldPacks] = useState({});
  const [packPicker, setPackPicker] = useState(null); // worldId when showing pack list
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Query active stories and packs for each world
    const stories = getActiveStories(profileId);
    const storyMap = {};
    for (const s of stories) {
      if (!storyMap[s.world_id]) storyMap[s.world_id] = s;
    }
    setActiveStories(storyMap);

    const packsMap = {};
    for (const w of WORLDS) {
      if (w.available) {
        packsMap[w.id] = getWorldPacks(w.id);
      }
    }
    setWorldPacks(packsMap);
  }, [profileId]);

  const handleCardTap = useCallback((world) => {
    if (!world.available) {
      setToast('More worlds coming!');
      setTimeout(() => setToast(null), 2000);
      return;
    }

    const active = activeStories[world.id];
    if (active) {
      onSelectWorld(world.id, active.pack_id, active.id);
      return;
    }

    const packs = worldPacks[world.id] || [];
    if (packs.length === 0) {
      setToast('No stories here yet!');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (packs.length === 1) {
      onSelectWorld(world.id, packs[0].id, null);
      return;
    }
    setPackPicker(world.id);
  }, [activeStories, worldPacks, onSelectWorld]);

  const handlePickPack = useCallback((worldId, packId) => {
    setPackPicker(null);
    onSelectWorld(worldId, packId, null);
  }, [onSelectWorld]);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.3); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.6); }
        }
        @keyframes toast-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>{'<'} Back</button>
        <h1 style={styles.title}>Choose Your World</h1>
        <p style={styles.subtitle}>Where will {heroName} go today?</p>
      </div>

      <div style={styles.grid}>
        {WORLDS.map((world) => {
          const active = activeStories[world.id];
          const packs = worldPacks[world.id] || [];
          const isAvailable = world.available && packs.length > 0;

          return (
            <button
              key={world.id}
              onClick={() => handleCardTap(world)}
              disabled={!world.available}
              style={{
                ...styles.card,
                background: `linear-gradient(135deg, ${world.bgGradient[0]}, ${world.bgGradient[1]})`,
                borderColor: world.available ? world.color : 'rgba(255,255,255,0.1)',
                opacity: world.available ? 1 : 0.5,
                cursor: world.available ? 'pointer' : 'default',
                animation: active ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              }}
            >
              <span style={styles.icon}>{world.icon}</span>
              <span style={styles.worldName}>{world.name}</span>
              <span style={styles.description}>{world.description}</span>
              <span style={styles.role}>You are: {world.role}</span>
              <span style={{
                ...styles.status,
                color: active ? '#ffd700' : isAvailable ? '#aaffaa' : '#888',
              }}>
                {active
                  ? 'Continue your adventure'
                  : isAvailable
                    ? 'Begin'
                    : 'Coming Soon'}
              </span>
              {active && (
                <div style={styles.progressDots}>
                  {Array.from({ length: Math.min(active.current_segment, 10) }, (_, i) => (
                    <div key={i} style={styles.dot} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Pack picker overlay */}
      {packPicker && (
        <div style={styles.overlay} onClick={() => setPackPicker(null)}>
          <div style={styles.packList} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.packTitle}>Choose a Story</h2>
            {(worldPacks[packPicker] || []).map((pack) => (
              <button
                key={pack.id}
                onClick={() => handlePickPack(packPicker, pack.id)}
                style={styles.packItem}
              >
                <span style={styles.packName}>{pack.title}</span>
                <span style={styles.packLevel}>Level {pack.reading_level}</span>
              </button>
            ))}
            <button onClick={() => setPackPicker(null)} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={styles.toast}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a3e 100%)',
    color: '#f0f0ff',
    padding: '20px',
    fontFamily: "'Press Start 2P', monospace",
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  backButton: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    minWidth: '60px',
    minHeight: '44px',
    padding: '10px 14px',
    fontSize: '11px',
    fontFamily: "'Press Start 2P', monospace",
    background: 'transparent',
    color: '#ffd700',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  title: {
    fontSize: '14px',
    color: '#ffd700',
    textShadow: '0 0 10px rgba(255,215,0,0.5)',
    margin: '0 0 8px 0',
    paddingTop: '40px',
  },
  subtitle: {
    fontSize: '10px',
    color: '#aaa',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '16px 10px',
    borderRadius: '16px',
    border: '2px solid',
    minHeight: '160px',
    textAlign: 'center',
    WebkitTapHighlightColor: 'transparent',
    fontFamily: "'Press Start 2P', monospace",
    transition: 'transform 0.1s ease',
  },
  icon: {
    fontSize: '32px',
    lineHeight: 1,
  },
  worldName: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 1.3,
  },
  description: {
    fontSize: '7px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.4,
  },
  role: {
    fontSize: '7px',
    color: 'rgba(255,215,0,0.7)',
    fontStyle: 'italic',
  },
  status: {
    fontSize: '8px',
    fontWeight: 'bold',
    marginTop: '4px',
  },
  progressDots: {
    display: 'flex',
    gap: '3px',
    justifyContent: 'center',
    marginTop: '4px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#ffd700',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  packList: {
    background: '#1a1a3e',
    borderRadius: '16px',
    padding: '20px',
    width: '100%',
    maxWidth: '350px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  packTitle: {
    fontSize: '12px',
    color: '#ffd700',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  packItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    minHeight: '48px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,215,0,0.2)',
    borderRadius: '12px',
    color: '#f0f0ff',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '10px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  packName: {
    flex: 1,
  },
  packLevel: {
    fontSize: '8px',
    color: '#ffd700',
    marginLeft: '8px',
  },
  cancelButton: {
    padding: '12px',
    minHeight: '44px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    color: '#999',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '9px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  toast: {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.85)',
    color: '#ffd700',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace",
    animation: 'toast-in 0.3s ease',
    zIndex: 200,
  },
};
