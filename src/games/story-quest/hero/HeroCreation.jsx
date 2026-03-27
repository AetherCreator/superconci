/**
 * HeroCreation.jsx — Camera capture → Vision API → Character description → Save hero
 * Fixed for iOS Safari: camera starts on explicit user tap, not on mount
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createHero } from '../db/storyDB.js';
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES, EYE_COLORS, DEFAULTS } from './avatarPalette.js';

const STEPS = { CAMERA_PROMPT: 0, CAMERA: 1, ANALYZING: 2, APPROVAL: 3, NAME: 4 };

const API_URL = '/api/claude'; // Proxied through Vercel serverless function

export default function HeroCreation({ profileId, onComplete }) {
  const [step, setStep] = useState(STEPS.CAMERA_PROMPT);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [description, setDescription] = useState('');
  const [avatarProps, setAvatarProps] = useState(null);
  const [heroName, setHeroName] = useState('Coci');
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ─── Camera ──────────────────────────────────────────────────────
  // iOS FIX: Camera ONLY starts when user explicitly taps the button.
  // Never auto-start in useEffect — iOS treats getUserMedia outside a
  // user gesture as a permission violation and reloads the page.

  const startCamera = useCallback(async () => {
    setError(null);
    setStep(STEPS.CAMERA);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      setError('camera');
      setStep(STEPS.CAMERA_PROMPT);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Cleanup on unmount only
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const maxDim = 512;
    const scale = Math.min(maxDim / vw, maxDim / vh, 1);
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];
    setPhotoBase64(base64);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setPhotoBase64(null);
    setError(null);
    setStep(STEPS.CAMERA_PROMPT);
  }, []);

  // ─── Vision API ──────────────────────────────────────────────────

  const analyzePhoto = useCallback(async () => {
    setStep(STEPS.ANALYZING);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: photoBase64 },
              },
              {
                type: 'text',
                text: 'You are a warm, whimsical storyteller meeting a young hero for the first time. Look at this child\'s photo and write a 2-3 sentence character description for a storybook. Include: hair color and style, eye color, skin tone described warmly, and any distinctive joyful features. Write it as if introducing a beloved storybook character. Example tone: "Coci is a brave adventurer with wild curly dark hair, warm brown eyes that sparkle with curiosity, and a smile that could light up the whole galaxy." Be specific to what you see. Be warm. Be magical.',
              },
            ],
          }],
        }),
      });

      if (!response.ok) throw new Error('Vision API failed');

      const data = await response.json();
      const desc = data.content[0].text;

      setPhotoBase64(null); // Clear immediately — privacy

      setDescription(desc);
      const props = await parseDescription(desc);
      setAvatarProps(props);
      setStep(STEPS.APPROVAL);
    } catch (err) {
      setPhotoBase64(null);
      setError('api');
      setStep(STEPS.CAMERA_PROMPT);
    }
  }, [photoBase64, apiKey]);

  // ─── Parse description ───────────────────────────────────────────

  async function parseDescription(desc, retryCount = 0) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          system: `You extract structured character traits from a description. Return ONLY a JSON object with no other text. Use ONLY these allowed values:

hairColor: "black" | "dark_brown" | "medium_brown" | "light_brown" | "auburn" | "red" | "strawberry_blonde" | "golden_blonde" | "platinum_blonde" | "gray" | "white" | "blue_black"
hairStyle: "curly" | "wavy" | "straight" | "coily" | "braided" | "short_cropped"
skinTone: "porcelain" | "fair" | "light" | "light_medium" | "medium" | "medium_tan" | "olive" | "tan" | "brown" | "dark_brown" | "deep_brown" | "deep"
eyeColor: "dark_brown" | "brown" | "amber" | "hazel" | "green" | "blue_green" | "blue" | "gray_blue" | "gray" | "dark"`,
          messages: [{
            role: 'user',
            content: `Extract character traits from this description: "${desc}"`,
          }],
        }),
      });

      if (!response.ok) throw new Error('Parse API failed');

      const data = await response.json();
      const text = data.content[0].text.trim();
      const parsed = JSON.parse(text);

      return {
        hairColor: (parsed.hairColor in HAIR_COLORS) ? parsed.hairColor : DEFAULTS.hairColor,
        hairStyle: HAIR_STYLES.includes(parsed.hairStyle) ? parsed.hairStyle : DEFAULTS.hairStyle,
        skinTone: (parsed.skinTone in SKIN_TONES) ? parsed.skinTone : DEFAULTS.skinTone,
        eyeColor: (parsed.eyeColor in EYE_COLORS) ? parsed.eyeColor : DEFAULTS.eyeColor,
      };
    } catch (err) {
      if (retryCount < 1) return parseDescription(desc, retryCount + 1);
      return { ...DEFAULTS };
    }
  }

  // ─── Save hero ───────────────────────────────────────────────────

  const saveHero = useCallback(() => {
    const heroId = createHero({
      profileId,
      name: heroName.trim() || 'Coci',
      description,
      hairColor: avatarProps.hairColor,
      hairStyle: avatarProps.hairStyle,
      skinTone: avatarProps.skinTone,
      eyeColor: avatarProps.eyeColor,
    });
    onComplete({ heroId, name: heroName.trim() || 'Coci', description, ...avatarProps });
  }, [profileId, heroName, description, avatarProps, onComplete]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Step 0: Camera prompt — iOS FIX: user must tap to start camera */}
      {step === STEPS.CAMERA_PROMPT && (
        <div style={styles.step}>
          <h2 style={styles.title}>Take your hero photo!</h2>
          {error === 'camera' && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>Story Quest needs to see you to make you the hero!</p>
              <p style={styles.errorHint}>Ask a grown-up to help turn on the camera.</p>
            </div>
          )}
          {error === 'api' && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>The storyteller is resting. Try again in a moment.</p>
            </div>
          )}
          <div style={styles.cameraPromptIcon}>📸</div>
          <p style={styles.promptText}>Tap the button to open your camera</p>
          <button onClick={startCamera} style={styles.primaryButton}>
            Open Camera
          </button>
        </div>
      )}

      {/* Step 1: Live camera */}
      {step === STEPS.CAMERA && !photoBase64 && (
        <div style={styles.step}>
          <h2 style={styles.title}>Smile, hero!</h2>
          <div style={styles.viewfinder}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
          </div>
          {cameraReady && (
            <button onClick={capturePhoto} style={styles.shutterButton}>
              <div style={styles.shutterInner} />
            </button>
          )}
          {!cameraReady && (
            <p style={styles.loadingText}>Camera loading...</p>
          )}
        </div>
      )}

      {/* Step 1b: Photo preview */}
      {step === STEPS.CAMERA && photoBase64 && (
        <div style={styles.step}>
          <h2 style={styles.title}>Looking good, hero!</h2>
          <div style={styles.photoPreview}>
            <img src={`data:image/jpeg;base64,${photoBase64}`} alt="Your hero" style={styles.previewImage} />
          </div>
          <div style={styles.buttonRow}>
            <button onClick={analyzePhoto} style={styles.primaryButton}>Use this photo</button>
            <button onClick={retakePhoto} style={styles.secondaryButton}>Try again</button>
          </div>
        </div>
      )}

      {/* Step 2: Analyzing */}
      {step === STEPS.ANALYZING && (
        <div style={styles.step}>
          <h2 style={styles.title}>The storyteller is meeting you...</h2>
          <div style={styles.shimmerBox}>
            <div style={styles.shimmer} />
          </div>
          <p style={styles.loadingText}>Creating your character...</p>
        </div>
      )}

      {/* Step 3: Approval */}
      {step === STEPS.APPROVAL && (
        <div style={styles.step}>
          <h2 style={styles.title}>Your hero has arrived!</h2>
          <div style={styles.descriptionPanel}>
            <p style={styles.descriptionText}>{description}</p>
          </div>
          <div style={styles.avatarPlaceholder}>
            <span style={styles.avatarEmoji}>🦸</span>
          </div>
          <div style={styles.buttonRow}>
            <button onClick={() => setStep(STEPS.NAME)} style={styles.primaryButton}>That's me!</button>
            <button onClick={retakePhoto} style={styles.secondaryButton}>Try again</button>
          </div>
        </div>
      )}

      {/* Step 4: Name */}
      {step === STEPS.NAME && (
        <div style={styles.step}>
          <h2 style={styles.title}>Name your hero</h2>
          <input
            type="text"
            value={heroName}
            onChange={(e) => setHeroName(e.target.value)}
            placeholder="Your hero's name"
            style={styles.nameInput}
            maxLength={20}
          />
          <button onClick={saveHero} style={styles.primaryButton}>
            Start my adventure!
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%)',
    color: '#f0f0ff',
    padding: '20px',
    fontFamily: "'Press Start 2P', monospace",
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '16px',
    textAlign: 'center',
    color: '#ffd700',
    textShadow: '0 0 10px rgba(255,215,0,0.5)',
    margin: 0,
    lineHeight: 1.5,
  },
  cameraPromptIcon: {
    fontSize: '72px',
    lineHeight: 1,
  },
  promptText: {
    fontSize: '11px',
    color: '#aaa',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.6,
  },
  viewfinder: {
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '4px solid #ffd700',
    boxShadow: '0 0 20px rgba(255,215,0,0.3)',
  },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  shutterButton: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: '4px solid #ffd700',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    WebkitTapHighlightColor: 'transparent',
  },
  shutterInner: { width: '56px', height: '56px', borderRadius: '50%', background: '#ffd700' },
  photoPreview: {
    width: '280px',
    height: '280px',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '4px solid #ffd700',
  },
  previewImage: { width: '100%', height: '100%', objectFit: 'cover' },
  buttonRow: { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' },
  primaryButton: {
    minWidth: '220px',
    minHeight: '52px',
    padding: '14px 28px',
    fontSize: '14px',
    fontFamily: "'Press Start 2P', monospace",
    background: 'linear-gradient(180deg, #ffd700 0%, #ffaa00 100%)',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(255,215,0,0.4)',
    WebkitTapHighlightColor: 'transparent',
  },
  secondaryButton: {
    minWidth: '160px',
    minHeight: '44px',
    padding: '10px 20px',
    fontSize: '11px',
    fontFamily: "'Press Start 2P', monospace",
    background: 'transparent',
    color: '#ffd700',
    border: '2px solid #ffd700',
    borderRadius: '12px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  descriptionPanel: {
    background: 'rgba(255,215,0,0.1)',
    border: '2px solid rgba(255,215,0,0.3)',
    borderRadius: '16px',
    padding: '20px',
    width: '100%',
  },
  descriptionText: {
    fontSize: '13px',
    lineHeight: 1.8,
    fontFamily: 'Georgia, serif',
    color: '#f0f0ff',
    textAlign: 'center',
    margin: 0,
  },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'rgba(255,215,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid rgba(255,215,0,0.3)',
  },
  avatarEmoji: { fontSize: '48px' },
  nameInput: {
    width: '100%',
    maxWidth: '280px',
    padding: '16px',
    fontSize: '18px',
    fontFamily: "'Press Start 2P', monospace",
    background: 'rgba(255,255,255,0.1)',
    border: '2px solid #ffd700',
    borderRadius: '12px',
    color: '#f0f0ff',
    textAlign: 'center',
    outline: 'none',
  },
  shimmerBox: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'rgba(255,215,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(45deg, transparent 30%, rgba(255,215,0,0.2) 50%, transparent 70%)',
    animation: 'shimmer 1.5s infinite',
  },
  loadingText: { fontSize: '11px', color: '#aaa', fontFamily: "'Press Start 2P', monospace", margin: 0 },
  errorBox: {
    background: 'rgba(255,100,100,0.1)',
    border: '2px solid rgba(255,100,100,0.3)',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    width: '100%',
  },
  errorText: { fontSize: '12px', lineHeight: 1.6, color: '#ffaaaa', margin: '0 0 8px 0' },
  errorHint: { fontSize: '10px', color: '#999', margin: 0 },
};
