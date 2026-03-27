/**
 * ParentView.jsx — PIN-protected parent dashboard.
 * Story logs, stats, Read Together mode, settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getActiveStories,
  getCompletedStories,
  getStory,
  getStorySegments,
  getHero,
  destroyDB,
  persistDB,
} from '../db/storyDB.js';
import { WORLDS } from '../worlds/WorldSelector.jsx';

// ─── PIN management (uses Dexie settings table) ─────────────────────
// Since we can't import Dexie directly here without creating a cross-dependency,
// we use IndexedDB directly for the PIN in the existing SuperConci settings store.

const SETTINGS_DB = 'SuperConciDB';
const SETTINGS_STORE = 'settings';

async function getPin() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(SETTINGS_DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(SETTINGS_STORE)) {
          req.result.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction(SETTINGS_STORE, 'readonly');
          const store = tx.objectStore(SETTINGS_STORE);
          const get = store.get('parentPin');
          get.onsuccess = () => {
            db.close();
            resolve(get.result?.value || null);
          };
          get.onerror = () => { db.close(); resolve(null); };
        } catch (e) {
          db.close();
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function setPin(pin) {
  return new Promise((resolve) => {
    const req = indexedDB.open(SETTINGS_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(SETTINGS_STORE)) {
        req.result.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(SETTINGS_STORE, 'readwrite');
      tx.objectStore(SETTINGS_STORE).put({ id: 'parentPin', value: pin });
      tx.oncomplete = () => { db.close(); resolve(); };
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────

const TABS = { STORIES: 0, STATS: 1, SETTINGS: 2 };

export default function ParentView({ profileId, heroData, onBack, onChangeHero }) {
  const [pinState, setPinState] = useState('loading'); // loading | create | enter | authenticated
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savedPin, setSavedPin] = useState(null);
  const [pinError, setPinError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [tab, setTab] = useState(TABS.STORIES);
  const [stories, setStories] = useState([]);
  const [readingStory, setReadingStory] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const worldMap = {};
  for (const w of WORLDS) worldMap[w.id] = w;

  // Load PIN state
  useEffect(() => {
    getPin().then((p) => {
      setSavedPin(p);
      setPinState(p ? 'enter' : 'create');
    });
  }, []);

  // Load stories
  useEffect(() => {
    if (pinState === 'authenticated') {
      const active = getActiveStories(profileId);
      const completed = getCompletedStories(profileId);
      setStories([...active, ...completed].filter((s) => s.status !== 'abandoned'));
    }
  }, [pinState, profileId]);

  // PIN handlers
  const handlePinDigit = (digit) => {
    if (cooldown) return;
    if (pinState === 'create') {
      if (confirmPin !== null && confirmPin.length < 4 && pin.length === 4) {
        setConfirmPin((prev) => prev + digit);
      } else if (pin.length < 4) {
        setPin((prev) => prev + digit);
      }
    } else {
      if (pin.length < 4) setPin((prev) => prev + digit);
    }
  };

  const handlePinDelete = () => {
    if (pinState === 'create' && pin.length === 4 && confirmPin.length > 0) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  // Auto-submit PIN
  useEffect(() => {
    if (pinState === 'enter' && pin.length === 4) {
      if (pin === savedPin) {
        setPinState('authenticated');
        setPin('');
        setPinError(null);
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');
        if (newAttempts >= 3) {
          setCooldown(true);
          setPinError('Too many attempts. Wait 30 seconds.');
          setTimeout(() => { setCooldown(false); setAttempts(0); setPinError(null); }, 30000);
        } else {
          setPinError('Wrong PIN. Try again.');
        }
      }
    }
  }, [pin, pinState, savedPin, attempts]);

  // Auto-submit create PIN
  useEffect(() => {
    if (pinState === 'create' && pin.length === 4 && confirmPin.length === 4) {
      if (pin === confirmPin) {
        setPin(pin).then ? null : null;
        setPin('');
        setConfirmPin('');
        (async () => {
          await setPin(pin);
          setSavedPin(pin);
          setPinState('authenticated');
        })();
      } else {
        setPinError('PINs don\'t match. Try again.');
        setPin('');
        setConfirmPin('');
      }
    }
  }, [pin, confirmPin, pinState]);

  // Fix: the create PIN auto-submit has a name collision with setPin state setter
  // Let me use a separate handler
  const submitCreatePin = useCallback(async () => {
    if (pin.length === 4 && confirmPin.length === 4 && pin === confirmPin) {
      await setPin(pin); // saves to IDB
      setSavedPin(pin);
      setPinState('authenticated');
    }
  }, [pin, confirmPin]);

  // Read Together
  const openReadTogether = useCallback((storyId) => {
    const story = getStory(storyId);
    const segments = getStorySegments(storyId);
    const hero = getHero(story?.profile_id);
    setReadingStory({ story, segments, hero });
  }, []);

  const copyStory = useCallback(async () => {
    if (!readingStory) return;
    const { story, segments, hero } = readingStory;
    const world = worldMap[story.world_id];

    let text = `${story.title || 'An Adventure'}\n`;
    text += `A ${world?.name || ''} story starring ${hero?.name || 'Coci'}\n\n`;
    if (hero?.description) text += `${hero.description}\n\n---\n\n`;

    for (const seg of segments) {
      text += seg.content + '\n\n';
      if (seg.selected_choice !== null && seg.choices_shown) {
        const choices = JSON.parse(seg.choices_shown);
        text += `  → ${choices[seg.selected_choice] || ''}\n\n`;
      }
      if (seg.free_text_input) {
        text += `  ${hero?.name || 'Coci'} decided: "${seg.free_text_input}"\n\n`;
      }
    }

    if (story.status === 'completed') text += '— The End —\n';

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback for older browsers
    }
  }, [readingStory, worldMap]);

  const handleClearData = useCallback(async () => {
    await destroyDB();
    setClearConfirm(false);
    setStories([]);
  }, []);

  // ─── Compute Stats ──────────────────────────────────────────────

  const stats = (() => {
    const active = stories.filter((s) => s.status === 'active');
    const completed = stories.filter((s) => s.status === 'completed');

    const allSegments = stories.flatMap((s) => getStorySegments(s.id));
    const aiSegments = allSegments.filter((s) => s.source === 'ai' || s.source === 'ai_retry');
    const fallbackSegments = allSegments.filter((s) => s.source === 'fallback');
    const safetyRetries = allSegments.filter((s) => s.source === 'ai_retry').length;

    const worldCounts = {};
    for (const s of stories) {
      worldCounts[s.world_id] = (worldCounts[s.world_id] || 0) + 1;
    }
    const favoriteWorld = Object.entries(worldCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalStarted: stories.length,
      totalCompleted: completed.length,
      totalSegments: allSegments.length,
      avgLength: stories.length ? Math.round(allSegments.length / stories.length) : 0,
      aiCount: aiSegments.length,
      fallbackCount: fallbackSegments.length,
      safetyEvents: safetyRetries,
      favoriteWorld: favoriteWorld ? worldMap[favoriteWorld[0]]?.name || favoriteWorld[0] : 'None yet',
    };
  })();

  // ─── Render ────────────────────────────────────────────────────

  // PIN screens
  if (pinState === 'loading') return <div style={styles.container}><p style={styles.loadingText}>Loading...</p></div>;

  if (pinState === 'create' || pinState === 'enter') {
    const isCreate = pinState === 'create';
    const showConfirm = isCreate && pin.length === 4;

    return (
      <div style={styles.container}>
        <button onClick={onBack} style={styles.backButton}>{'<'} Back</button>
        <div style={styles.pinScreen}>
          <h2 style={styles.pinTitle}>{isCreate ? (showConfirm ? 'Confirm PIN' : 'Set a Parent PIN') : 'Enter Parent PIN'}</h2>
          <div style={styles.pinDots}>
            {[0,1,2,3].map((i) => {
              const val = showConfirm ? confirmPin : pin;
              return <div key={i} style={{ ...styles.pinDot, background: i < val.length ? '#ffd700' : 'rgba(255,255,255,0.2)' }} />;
            })}
          </div>
          {pinError && <p style={styles.pinError}>{pinError}</p>}
          {cooldown && <p style={styles.pinCooldown}>Ask a grown-up for help</p>}
          <div style={styles.numpad}>
            {[1,2,3,4,5,6,7,8,9,null,0,'del'].map((d, i) => (
              <button
                key={i}
                onClick={() => d === 'del' ? handlePinDelete() : d !== null ? handlePinDigit(String(d)) : null}
                style={{ ...styles.numButton, visibility: d === null ? 'hidden' : 'visible' }}
                disabled={cooldown}
              >
                {d === 'del' ? '←' : d}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Read Together mode
  if (readingStory) {
    const { story, segments, hero } = readingStory;
    const world = worldMap[story.world_id] || {};

    return (
      <div style={{ ...styles.container, background: `linear-gradient(180deg, ${world.bgGradient?.[0] || '#0a0a2e'}, ${world.bgGradient?.[1] || '#1a1a3e'})` }}>
        <div style={styles.readHeader}>
          <button onClick={() => setReadingStory(null)} style={styles.backButton}>{'<'} Back</button>
          <button onClick={copyStory} style={styles.shareButton}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={styles.readContent}>
          <h1 style={styles.readTitle}>{story.title || 'An Adventure'}</h1>
          <p style={styles.readSubtitle}>{world.icon} {world.name} — {new Date(story.created_at + 'Z').toLocaleDateString()}</p>
          {hero?.description && (
            <div style={styles.dedication}>
              <p style={styles.dedicationText}>For our hero: {hero.description}</p>
            </div>
          )}
          <div style={styles.readBody}>
            {segments.map((seg, i) => (
              <div key={i}>
                <p style={styles.readParagraph}>{seg.content}</p>
                {seg.selected_choice !== null && seg.choices_shown && (
                  <p style={styles.readChoice}>→ {JSON.parse(seg.choices_shown)[seg.selected_choice]}</p>
                )}
                {seg.free_text_input && (
                  <div style={styles.readFreeText}>
                    <p style={styles.readFreeTextContent}>{hero?.name || 'Coci'} decided: "{seg.free_text_input}"</p>
                  </div>
                )}
              </div>
            ))}
            {story.status === 'completed' && (
              <p style={styles.readEnd}>— The End —</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={styles.container}>
      <div style={styles.dashHeader}>
        <button onClick={onBack} style={styles.backButton}>{'<'} Back</button>
        <h1 style={styles.dashTitle}>Parent Dashboard</h1>
      </div>

      <div style={styles.tabBar}>
        {['Stories', 'Stats', 'Settings'].map((name, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{ ...styles.tabButton, borderBottomColor: tab === i ? '#ffd700' : 'transparent', color: tab === i ? '#ffd700' : '#888' }}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === TABS.STORIES && (
        <div style={styles.tabContent}>
          {stories.length === 0 ? (
            <p style={styles.emptyText}>No stories yet.</p>
          ) : stories.map((story) => {
            const world = worldMap[story.world_id] || {};
            const segCount = getStorySegments(story.id).length;
            return (
              <button key={story.id} onClick={() => openReadTogether(story.id)} style={styles.storyCard}>
                <div style={styles.storyCardHeader}>
                  <span>{world.icon} {world.name}</span>
                  <span style={styles.storyStatus}>{story.status === 'completed' ? '✅' : '🟡'}</span>
                </div>
                <h3 style={styles.storyCardTitle}>{story.title || 'Untitled'}</h3>
                <p style={styles.storyCardMeta}>{segCount} segments — {new Date(story.last_played + 'Z').toLocaleDateString()}</p>
              </button>
            );
          })}
        </div>
      )}

      {tab === TABS.STATS && (
        <div style={styles.tabContent}>
          <div style={styles.statGrid}>
            <StatItem label="Stories Started" value={stats.totalStarted} />
            <StatItem label="Completed" value={stats.totalCompleted} />
            <StatItem label="Total Segments" value={stats.totalSegments} />
            <StatItem label="Avg Length" value={`${stats.avgLength} seg`} />
            <StatItem label="AI Moments" value={stats.aiCount} />
            <StatItem label="Fallbacks Used" value={stats.fallbackCount} />
            <StatItem label="Safety Retries" value={stats.safetyEvents} />
            <StatItem label="Favorite World" value={stats.favoriteWorld} />
          </div>
        </div>
      )}

      {tab === TABS.SETTINGS && (
        <div style={styles.tabContent}>
          <button onClick={onChangeHero} style={styles.settingButton}>Change Hero</button>
          <button onClick={() => { setPin(''); setPinState('create'); }} style={styles.settingButton}>Change PIN</button>
          <button onClick={() => setClearConfirm(true)} style={{ ...styles.settingButton, color: '#ff6666', borderColor: 'rgba(255,100,100,0.3)' }}>
            Clear All Story Data
          </button>
        </div>
      )}

      {clearConfirm && (
        <div style={styles.overlay} onClick={() => setClearConfirm(false)}>
          <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <p style={styles.dialogText}>This will delete ALL of {heroData?.name || 'Coci'}'s stories. Are you sure?</p>
            <div style={styles.dialogButtons}>
              <button onClick={handleClearData} style={styles.dialogDanger}>Delete Everything</button>
              <button onClick={() => setClearConfirm(false)} style={styles.dialogCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={styles.statItem}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a3e 100%)',
    color: '#f0f0ff',
    fontFamily: "'Press Start 2P', monospace",
    padding: '16px',
  },
  loadingText: { textAlign: 'center', marginTop: '40vh', color: '#888', fontSize: '11px' },
  backButton: {
    minWidth: '60px', minHeight: '44px', padding: '10px 14px', fontSize: '11px',
    fontFamily: "'Press Start 2P', monospace", background: 'transparent', color: '#ffd700',
    border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  // PIN
  pinScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px', gap: '20px' },
  pinTitle: { fontSize: '13px', color: '#ffd700', margin: 0 },
  pinDots: { display: 'flex', gap: '16px' },
  pinDot: { width: '20px', height: '20px', borderRadius: '50%', transition: 'background 0.2s' },
  pinError: { fontSize: '9px', color: '#ff6666', margin: 0 },
  pinCooldown: { fontSize: '9px', color: '#888', margin: 0 },
  numpad: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '240px' },
  numButton: {
    width: '64px', height: '64px', fontSize: '20px', fontFamily: "'Press Start 2P', monospace",
    background: 'rgba(255,255,255,0.08)', color: '#f0f0ff', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
  },
  // Dashboard
  dashHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  dashTitle: { fontSize: '12px', color: '#ffd700', margin: 0 },
  tabBar: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' },
  tabButton: {
    flex: 1, padding: '12px 8px', fontSize: '9px', fontFamily: "'Press Start 2P', monospace",
    background: 'transparent', color: '#888', border: 'none', borderBottom: '2px solid transparent',
    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
  },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px', margin: '0 auto' },
  emptyText: { textAlign: 'center', color: '#888', fontSize: '10px' },
  storyCard: {
    padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', textAlign: 'left', cursor: 'pointer', minHeight: '44px',
    fontFamily: "'Press Start 2P', monospace", color: '#f0f0ff',
    WebkitTapHighlightColor: 'transparent',
  },
  storyCardHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#aaa', marginBottom: '6px' },
  storyCardTitle: { fontSize: '10px', margin: '0 0 4px 0', color: '#fff' },
  storyCardMeta: { fontSize: '8px', color: '#888', margin: 0 },
  storyStatus: { fontSize: '12px' },
  // Stats
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  statItem: {
    padding: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
  },
  statValue: { fontSize: '16px', color: '#ffd700', fontWeight: 'bold' },
  statLabel: { fontSize: '7px', color: '#888', textAlign: 'center' },
  // Settings
  settingButton: {
    width: '100%', minHeight: '48px', padding: '14px 16px', fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace", background: 'rgba(255,255,255,0.05)',
    color: '#f0f0ff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px',
    cursor: 'pointer', textAlign: 'left', WebkitTapHighlightColor: 'transparent',
  },
  // Read Together
  readHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  shareButton: {
    minWidth: '80px', minHeight: '44px', padding: '10px 16px', fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace", background: 'rgba(255,215,0,0.1)',
    color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px',
    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
  },
  readContent: { maxWidth: '600px', margin: '0 auto' },
  readTitle: { fontSize: '18px', color: '#ffd700', textAlign: 'center', margin: '0 0 8px 0' },
  readSubtitle: { fontSize: '10px', color: '#aaa', textAlign: 'center', margin: '0 0 20px 0' },
  dedication: {
    background: 'rgba(255,215,0,0.08)', borderRadius: '12px', padding: '16px',
    marginBottom: '24px', borderLeft: '3px solid rgba(255,215,0,0.3)',
  },
  dedicationText: { fontSize: '14px', fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 },
  readBody: { padding: '0 4px' },
  readParagraph: { fontSize: '20px', lineHeight: 2, fontFamily: 'Georgia, serif', color: '#f0f0ff', margin: '0 0 20px 0' },
  readChoice: { fontSize: '14px', fontFamily: 'Georgia, serif', color: 'rgba(255,215,0,0.6)', fontStyle: 'italic', margin: '-12px 0 20px 16px' },
  readFreeText: {
    background: 'rgba(255,215,0,0.08)', borderRadius: '8px', padding: '12px 16px',
    margin: '-8px 0 20px 0', borderLeft: '3px solid rgba(255,215,0,0.4)',
  },
  readFreeTextContent: { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd700', margin: 0, fontStyle: 'italic' },
  readEnd: { fontSize: '16px', fontFamily: "'Press Start 2P', monospace", color: '#ffd700', textAlign: 'center', margin: '40px 0' },
  // Dialog
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
  },
  dialog: { background: '#1a1a3e', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '300px', textAlign: 'center' },
  dialogText: { fontSize: '10px', lineHeight: 1.6, margin: '0 0 20px 0' },
  dialogButtons: { display: 'flex', gap: '10px' },
  dialogDanger: {
    flex: 1, minHeight: '44px', padding: '10px', fontSize: '9px',
    fontFamily: "'Press Start 2P', monospace", background: '#c0392b', color: '#fff',
    border: 'none', borderRadius: '10px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
  },
  dialogCancel: {
    flex: 1, minHeight: '44px', padding: '10px', fontSize: '9px',
    fontFamily: "'Press Start 2P', monospace", background: 'transparent', color: '#aaa',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
};
