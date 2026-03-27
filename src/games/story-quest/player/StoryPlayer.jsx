/**
 * StoryPlayer.jsx — The story playback screen.
 * Typewriter text, choice buttons, free text input, avatar with expressions.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Avatar, { detectExpression } from '../hero/Avatar.jsx';
import Typewriter from './Typewriter.js';
import { WORLDS } from '../worlds/WorldSelector.jsx';

export default function StoryPlayer({ storyEngine, hero, worldId, onExit, onStoryComplete }) {
  const [segments, setSegments] = useState([]);       // {text, source, isCurrent}
  const [currentText, setCurrentText] = useState('');  // text being typewritered
  const [typing, setTyping] = useState(false);
  const [choices, setChoices] = useState(null);
  const [allowFreeText, setAllowFreeText] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [expression, setExpression] = useState('neutral');
  const [isEnding, setIsEnding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLong, setLoadingLong] = useState(false);
  const [bridgeText, setBridgeText] = useState(null);

  const scrollRef = useRef(null);
  const typewriterRef = useRef(null);
  const loadingTimerRef = useRef(null);

  const world = WORLDS.find((w) => w.id === worldId) || WORLDS[0];

  // Initialize typewriter
  useEffect(() => {
    typewriterRef.current = new Typewriter({
      onChar: (char) => {
        setCurrentText((prev) => prev + char);
      },
      onWord: (word) => {
        setExpression(detectExpression(word));
      },
      onComplete: () => {
        setTyping(false);
      },
      speed: 40,
    });

    return () => {
      if (typewriterRef.current) typewriterRef.current.reset();
    };
  }, []);

  // Auto-scroll as text appears
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentText, choices]);

  // Wire up engine callbacks
  useEffect(() => {
    if (!storyEngine) return;

    storyEngine.onSegment = (text, source) => {
      setLoading(false);
      clearTimeout(loadingTimerRef.current);
      setLoadingLong(false);

      if (source === 'ai-stream') {
        // Streaming — add chunks to typewriter
        setTyping(true);
        typewriterRef.current.addChunk(text);
      } else {
        // Procedural/fallback — full text, typewriter it
        setCurrentText('');
        setTyping(true);
        typewriterRef.current.typeText(text);
      }
    };

    storyEngine.onChoices = (choiceList, freeTextAllowed) => {
      setChoices(choiceList);
      setAllowFreeText(freeTextAllowed);
      // End stream for AI segments
      if (typewriterRef.current) typewriterRef.current.endStream();
    };

    storyEngine.onEnding = (text) => {
      setIsEnding(true);
      if (typewriterRef.current) typewriterRef.current.endStream();
    };

    storyEngine.onError = (error) => {
      setLoading(false);
      clearTimeout(loadingTimerRef.current);
      console.error('StoryEngine error:', error);
    };
  }, [storyEngine]);

  // Start first segment
  useEffect(() => {
    if (storyEngine) {
      setLoading(true);
      loadingTimerRef.current = setTimeout(() => setLoadingLong(true), 5000);
      storyEngine.playSegment(1);
    }
  }, [storyEngine]);

  const handleSkip = useCallback(() => {
    if (typing && typewriterRef.current) {
      typewriterRef.current.skip();
    }
  }, [typing]);

  const handleChoice = useCallback((index, text) => {
    // Archive current segment
    setSegments((prev) => [...prev, { text: currentText, source: 'read' }]);
    setCurrentText('');
    setChoices(null);
    setAllowFreeText(false);
    setBridgeText(null);

    // Show loading for AI moments
    setLoading(true);
    loadingTimerRef.current = setTimeout(() => setLoadingLong(true), 5000);

    typewriterRef.current.reset();
    storyEngine.selectChoice(index, text);
  }, [currentText, storyEngine]);

  const handleFreeTextSubmit = useCallback(() => {
    if (!freeText.trim()) return;

    storyEngine.submitFreeText(freeText.trim());

    // Archive current segment
    setSegments((prev) => [...prev, { text: currentText, source: 'read' }]);
    setCurrentText('');
    setChoices(null);
    setAllowFreeText(false);
    setFreeText('');

    setLoading(true);
    loadingTimerRef.current = setTimeout(() => setLoadingLong(true), 5000);

    typewriterRef.current.reset();
    // The engine will advance when it gets the next AI result
    // For now, trigger the same segment to regenerate with free text
    const currentSegId = storyEngine.currentSegment?.segment_id;
    if (currentSegId) storyEngine.playSegment(currentSegId);
  }, [freeText, currentText, storyEngine]);

  const handleComplete = useCallback(() => {
    if (onStoryComplete) onStoryComplete(storyEngine.storyId);
  }, [storyEngine, onStoryComplete]);

  return (
    <div style={{ ...styles.container, background: `linear-gradient(180deg, ${world.bgGradient[0]}, ${world.bgGradient[1]})` }}>
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sparkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes ending-glow { 0%, 100% { text-shadow: 0 0 10px rgba(255,215,0,0.5); } 50% { text-shadow: 0 0 30px rgba(255,215,0,0.8); } }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <button onClick={onExit} style={styles.exitButton}>{'<'}</button>
        <span style={styles.worldLabel}>{world.icon} {world.name}</span>
      </div>

      {/* Story Text Area */}
      <div ref={scrollRef} style={styles.textArea} onClick={handleSkip}>
        {/* Previous segments */}
        {segments.map((seg, i) => (
          <p key={i} style={styles.previousText}>{seg.text}</p>
        ))}

        {/* Bridge transition text */}
        {bridgeText && (
          <p style={styles.bridgeText}>{bridgeText}</p>
        )}

        {/* Loading state */}
        {loading && !currentText && (
          <div style={styles.loadingBox}>
            <p style={styles.loadingText}>The storyteller is weaving your adventure...</p>
            {loadingLong && <p style={styles.loadingHint}>Almost there...</p>}
          </div>
        )}

        {/* Current text */}
        {currentText && (
          <p style={isEnding ? styles.endingText : styles.currentText}>
            {currentText}
          </p>
        )}

        {/* Ending treatment */}
        {isEnding && !typing && (
          <div style={styles.endingBadge}>
            <span style={styles.endingTitle}>The End</span>
            <span style={styles.endingStar}>✨</span>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={styles.avatarContainer}>
        <Avatar
          hero={hero}
          expression={expression}
          world={worldId}
          size="small"
          animated={true}
        />
      </div>

      {/* Choices / Free Text / Ending Actions */}
      <div style={styles.bottomBar}>
        {isEnding && !typing ? (
          <div style={styles.choicesContainer}>
            <button onClick={handleComplete} style={{ ...styles.choiceButton, background: `linear-gradient(180deg, #ffd700, #ffaa00)`, color: '#1a1a2e' }}>
              Close the book
            </button>
            <button onClick={onExit} style={styles.secondaryChoice}>
              Back to worlds
            </button>
          </div>
        ) : choices && !typing ? (
          <div style={styles.choicesContainer}>
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(i, choice)}
                style={{ ...styles.choiceButton, background: world.color }}
              >
                {choice}
              </button>
            ))}
            {allowFreeText && (
              <div style={styles.freeTextContainer}>
                <p style={styles.freeTextPrompt}>What do YOU want to do?</p>
                <div style={styles.freeTextRow}>
                  <input
                    type="text"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Type your idea..."
                    style={styles.freeTextInput}
                    maxLength={100}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleFreeTextSubmit(); }}
                  />
                  <button onClick={handleFreeTextSubmit} style={styles.freeTextSubmit}>
                    Go!
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : typing ? (
          <p style={styles.tapHint}>Tap to skip</p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    color: '#f0f0ff',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    flexShrink: 0,
  },
  exitButton: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffd700',
    fontSize: '18px',
    fontFamily: "'Press Start 2P', monospace",
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  worldLabel: {
    fontSize: '12px',
    fontFamily: "'Press Start 2P', monospace",
    color: '#fff',
  },
  textArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 20px 100px 20px',
    WebkitOverflowScrolling: 'touch',
  },
  previousText: {
    fontSize: '18px',
    lineHeight: 1.8,
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: 'rgba(240,240,255,0.4)',
    margin: '0 0 16px 0',
  },
  currentText: {
    fontSize: '20px',
    lineHeight: 1.8,
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#f0f0ff',
    margin: '0 0 16px 0',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  endingText: {
    fontSize: '22px',
    lineHeight: 2,
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#ffd700',
    margin: '20px 0',
    textAlign: 'center',
    animation: 'ending-glow 3s ease-in-out infinite',
  },
  endingBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    margin: '24px 0',
    animation: 'fade-up 0.5s ease',
  },
  endingTitle: {
    fontSize: '24px',
    fontFamily: "'Press Start 2P', monospace",
    color: '#ffd700',
    textShadow: '0 0 20px rgba(255,215,0,0.6)',
  },
  endingStar: {
    fontSize: '40px',
    animation: 'sparkle 1.5s ease-in-out infinite',
  },
  bridgeText: {
    fontSize: '18px',
    lineHeight: 1.8,
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: 'rgba(255,215,0,0.6)',
    fontStyle: 'italic',
    margin: '0 0 16px 0',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  loadingText: {
    fontSize: '12px',
    fontFamily: "'Press Start 2P', monospace",
    color: 'rgba(255,255,255,0.5)',
    margin: '0 0 12px 0',
    lineHeight: 1.6,
  },
  loadingHint: {
    fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace",
    color: 'rgba(255,255,255,0.3)',
    margin: 0,
  },
  avatarContainer: {
    position: 'fixed',
    bottom: '180px',
    left: '12px',
    zIndex: 10,
    pointerEvents: 'none',
  },
  bottomBar: {
    flexShrink: 0,
    padding: '12px 16px',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
  },
  choicesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  choiceButton: {
    width: '100%',
    minHeight: '52px',
    padding: '14px 16px',
    fontSize: '14px',
    fontFamily: "'Press Start 2P', monospace",
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    lineHeight: 1.4,
    animation: 'fade-up 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
  },
  secondaryChoice: {
    width: '100%',
    minHeight: '44px',
    padding: '10px 16px',
    fontSize: '11px',
    fontFamily: "'Press Start 2P', monospace",
    color: 'rgba(255,255,255,0.6)',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  freeTextContainer: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  freeTextPrompt: {
    fontSize: '11px',
    fontFamily: "'Press Start 2P', monospace",
    color: '#ffd700',
    textAlign: 'center',
    margin: 0,
  },
  freeTextRow: {
    display: 'flex',
    gap: '8px',
  },
  freeTextInput: {
    flex: 1,
    minHeight: '48px',
    padding: '12px',
    fontSize: '16px',
    fontFamily: 'Georgia, serif',
    background: 'rgba(255,255,255,0.1)',
    border: '2px solid rgba(255,215,0,0.3)',
    borderRadius: '12px',
    color: '#f0f0ff',
    outline: 'none',
  },
  freeTextSubmit: {
    minWidth: '60px',
    minHeight: '48px',
    padding: '12px',
    fontSize: '14px',
    fontFamily: "'Press Start 2P', monospace",
    background: '#ffd700',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    WebkitTapHighlightColor: 'transparent',
  },
  tapHint: {
    textAlign: 'center',
    fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace",
    color: 'rgba(255,255,255,0.3)',
    margin: '8px 0',
  },
};
