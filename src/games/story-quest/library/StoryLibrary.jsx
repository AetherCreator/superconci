/**
 * StoryLibrary.jsx — Bookshelf of saved stories.
 * Browse, continue, re-read, and delete stories.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getActiveStories, getCompletedStories, getStory, getStorySegments, updateStoryStatus, persistDB } from '../db/storyDB.js';
import { WORLDS } from '../worlds/WorldSelector.jsx';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr + 'Z'); // SQLite datetime is UTC
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return `${Math.floor(diff / 86400)} days ago`;
}

function getPreview(storyId) {
  const segments = getStorySegments(storyId);
  if (segments.length === 0) return '';
  const first = segments[0].content || '';
  return first.length > 80 ? first.slice(0, 80) + '...' : first;
}

const MAX_STORIES = 10;

export default function StoryLibrary({ profileId, heroData, onResumeStory, onNewStory, onBack }) {
  const [stories, setStories] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [replacePrompt, setReplacePrompt] = useState(false);

  const loadStories = useCallback(() => {
    const active = getActiveStories(profileId);
    const completed = getCompletedStories(profileId);
    // Active first, then completed — each sorted by last_played desc (from query)
    setStories([...active, ...completed]);
  }, [profileId]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const worldMap = {};
  for (const w of WORLDS) worldMap[w.id] = w;

  const handleResume = useCallback((story) => {
    onResumeStory(story);
  }, [onResumeStory]);

  const handleNewStory = useCallback(() => {
    if (stories.length >= MAX_STORIES) {
      setReplacePrompt(true);
      return;
    }
    onNewStory();
  }, [stories, onNewStory]);

  const handleDelete = useCallback(async (storyId) => {
    updateStoryStatus(storyId, 'abandoned');
    await persistDB();
    setDeleteConfirm(null);
    loadStories();
  }, [loadStories]);

  const handleReplaceOldest = useCallback(async () => {
    // Find oldest completed story
    const completed = stories.filter((s) => s.status === 'completed');
    if (completed.length > 0) {
      const oldest = completed[completed.length - 1];
      updateStoryStatus(oldest.id, 'abandoned');
      await persistDB();
    }
    setReplacePrompt(false);
    onNewStory();
  }, [stories, onNewStory]);

  const displayStories = stories.filter((s) => s.status !== 'abandoned');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>{'<'} Back</button>
        <h1 style={styles.title}>📚 Story Library</h1>
      </div>

      {displayStories.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📖</span>
          <p style={styles.emptyText}>No stories yet!</p>
          <p style={styles.emptyHint}>Choose a world to begin your first adventure.</p>
          <button onClick={onNewStory} style={styles.newStoryButton}>
            Start a Story
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {displayStories.map((story) => {
            const world = worldMap[story.world_id] || {};
            const isActive = story.status === 'active';
            const preview = getPreview(story.id);

            return (
              <div key={story.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.worldBadge}>
                    {world.icon || '📖'} {world.name || story.world_id}
                  </span>
                  <span style={styles.timeBadge}>{timeAgo(story.last_played)}</span>
                </div>

                <h3 style={styles.storyTitle}>
                  {story.title || 'Untitled Adventure'}
                </h3>

                {preview && <p style={styles.preview}>{preview}</p>}

                <div style={styles.cardActions}>
                  {isActive ? (
                    <button
                      onClick={() => handleResume(story)}
                      style={{ ...styles.actionButton, background: world.color || '#4a6fa5' }}
                    >
                      <span style={styles.pulseDot} /> Continue
                    </button>
                  ) : (
                    <button
                      onClick={() => handleResume(story)}
                      style={styles.readAgainButton}
                    >
                      ✅ Read Again
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(story.id)}
                    style={styles.deleteButton}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          <button onClick={handleNewStory} style={styles.newStoryButton}>
            + New Story
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div style={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <p style={styles.dialogText}>Remove this story?</p>
            <div style={styles.dialogButtons}>
              <button onClick={() => handleDelete(deleteConfirm)} style={styles.dialogConfirm}>
                Remove
              </button>
              <button onClick={() => setDeleteConfirm(null)} style={styles.dialogCancel}>
                Keep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace prompt */}
      {replacePrompt && (
        <div style={styles.overlay} onClick={() => setReplacePrompt(false)}>
          <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <p style={styles.dialogText}>Your bookshelf is full! Replace the oldest finished story?</p>
            <div style={styles.dialogButtons}>
              <button onClick={handleReplaceOldest} style={styles.dialogConfirm}>
                Replace
              </button>
              <button onClick={() => setReplacePrompt(false)} style={styles.dialogCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a3e 100%)',
    color: '#f0f0ff',
    padding: '20px',
    fontFamily: "'Press Start 2P', monospace",
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    margin: '0',
    paddingTop: '8px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: '12px',
    textAlign: 'center',
  },
  emptyIcon: { fontSize: '48px' },
  emptyText: { fontSize: '14px', color: '#ffd700', margin: 0 },
  emptyHint: { fontSize: '10px', color: '#888', margin: 0, lineHeight: 1.5 },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  worldBadge: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.6)',
  },
  timeBadge: {
    fontSize: '8px',
    color: 'rgba(255,255,255,0.4)',
  },
  storyTitle: {
    fontSize: '12px',
    color: '#fff',
    margin: '0 0 6px 0',
    lineHeight: 1.4,
  },
  preview: {
    fontSize: '11px',
    fontFamily: 'Georgia, serif',
    color: 'rgba(255,255,255,0.4)',
    margin: '0 0 12px 0',
    lineHeight: 1.5,
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    minHeight: '44px',
    padding: '10px 16px',
    fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace",
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    WebkitTapHighlightColor: 'transparent',
  },
  readAgainButton: {
    flex: 1,
    minHeight: '44px',
    padding: '10px 16px',
    fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace",
    color: '#aaffaa',
    background: 'rgba(100,255,100,0.1)',
    border: '1px solid rgba(100,255,100,0.2)',
    borderRadius: '10px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  pulseDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ffd700',
    animation: 'pulse-glow 2s ease-in-out infinite',
  },
  deleteButton: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,100,100,0.1)',
    border: '1px solid rgba(255,100,100,0.2)',
    borderRadius: '10px',
    color: '#ff6666',
    fontSize: '14px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  newStoryButton: {
    minHeight: '52px',
    padding: '14px 20px',
    fontSize: '12px',
    fontFamily: "'Press Start 2P', monospace",
    background: 'linear-gradient(180deg, #ffd700, #ffaa00)',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    WebkitTapHighlightColor: 'transparent',
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
  dialog: {
    background: '#1a1a3e',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '300px',
    textAlign: 'center',
  },
  dialogText: {
    fontSize: '11px',
    lineHeight: 1.5,
    margin: '0 0 20px 0',
  },
  dialogButtons: {
    display: 'flex',
    gap: '10px',
  },
  dialogConfirm: {
    flex: 1,
    minHeight: '44px',
    padding: '10px',
    fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace",
    background: '#c0392b',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  dialogCancel: {
    flex: 1,
    minHeight: '44px',
    padding: '10px',
    fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace",
    background: 'transparent',
    color: '#aaa',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
};
