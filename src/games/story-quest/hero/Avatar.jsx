/**
 * Avatar.jsx — Storybook character avatar with dynamic colors, expressions, and world costumes.
 * Pure CSS/SVG — no external images.
 */

import React from 'react';
import { HAIR_COLORS, SKIN_TONES, EYE_COLORS, DEFAULTS } from './avatarPalette.js';

const SIZES = { small: 80, medium: 120, large: 200 };

// ─── Expression detection ────────────────────────────────────────────

const EXPRESSION_KEYWORDS = {
  excited: ['amazing', 'incredible', 'wow', 'hurray', 'discovered', 'hooray', 'fantastic', 'wonderful', 'brilliant', 'awesome', 'celebrate', 'joy', 'thrilled', 'excited'],
  surprised: ['suddenly', 'gasp', 'unexpected', 'what\'s that', 'whoosh', 'appeared', 'vanished', 'strange', 'mysterious', 'shock', 'couldn\'t believe'],
  determined: ['brave', 'must', 'challenge', 'won\'t give up', 'courage', 'strong', 'fight', 'protect', 'never', 'stood tall', 'ready', 'face'],
  content: ['smiled', 'warm', 'safe', 'home', 'friend', 'cozy', 'peaceful', 'gentle', 'hug', 'thank', 'love', 'happy', 'rest', 'comfort'],
};

export function detectExpression(text) {
  if (!text) return 'neutral';
  const lower = text.toLowerCase();
  let bestMatch = 'neutral';
  let bestCount = 0;

  for (const [expression, keywords] of Object.entries(EXPRESSION_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestMatch = expression;
    }
  }

  return bestMatch;
}

// ─── Hair path generators ────────────────────────────────────────────

function getHairPath(style) {
  switch (style) {
    case 'curly':
      return (
        <g>
          <path d="M30 38 Q25 15 50 12 Q75 15 70 38" fill="currentColor" />
          <circle cx="28" cy="28" r="8" fill="currentColor" />
          <circle cx="72" cy="28" r="8" fill="currentColor" />
          <circle cx="35" cy="16" r="7" fill="currentColor" />
          <circle cx="50" cy="12" r="7" fill="currentColor" />
          <circle cx="65" cy="16" r="7" fill="currentColor" />
          <circle cx="24" cy="38" r="6" fill="currentColor" />
          <circle cx="76" cy="38" r="6" fill="currentColor" />
        </g>
      );
    case 'wavy':
      return (
        <g>
          <path d="M28 42 Q22 30 28 18 Q35 8 50 10 Q65 8 72 18 Q78 30 72 42" fill="currentColor" />
          <path d="M24 42 Q20 52 26 60" fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M76 42 Q80 52 74 60" fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'straight':
      return (
        <g>
          <path d="M28 42 L28 18 Q35 8 50 10 Q65 8 72 18 L72 42" fill="currentColor" />
          <rect x="25" y="38" width="6" height="22" rx="3" fill="currentColor" />
          <rect x="69" y="38" width="6" height="22" rx="3" fill="currentColor" />
        </g>
      );
    case 'coily':
      return (
        <g>
          <path d="M28 38 Q20 10 50 8 Q80 10 72 38" fill="currentColor" />
          <circle cx="30" cy="20" r="6" fill="currentColor" />
          <circle cx="42" cy="14" r="6" fill="currentColor" />
          <circle cx="58" cy="14" r="6" fill="currentColor" />
          <circle cx="70" cy="20" r="6" fill="currentColor" />
          <circle cx="36" cy="10" r="5" fill="currentColor" />
          <circle cx="50" cy="8" r="5" fill="currentColor" />
          <circle cx="64" cy="10" r="5" fill="currentColor" />
          <circle cx="26" cy="32" r="5" fill="currentColor" />
          <circle cx="74" cy="32" r="5" fill="currentColor" />
        </g>
      );
    case 'braided':
      return (
        <g>
          <path d="M28 38 Q25 15 50 12 Q75 15 72 38" fill="currentColor" />
          {/* Two braids */}
          <path d="M30 40 Q26 48 30 56 Q26 64 30 72" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M70 40 Q74 48 70 56 Q74 64 70 72" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="74" r="4" fill="currentColor" />
          <circle cx="70" cy="74" r="4" fill="currentColor" />
        </g>
      );
    case 'short_cropped':
      return (
        <path d="M30 38 Q28 22 50 18 Q72 22 70 38" fill="currentColor" />
      );
    default:
      return (
        <path d="M28 38 Q25 15 50 12 Q75 15 72 38" fill="currentColor" />
      );
  }
}

// ─── Eye shapes by expression ────────────────────────────────────────

function getEyes(expression, eyeColor) {
  const leftX = 40, rightX = 60, y = 42;

  switch (expression) {
    case 'excited':
      return (
        <g>
          <circle cx={leftX} cy={y} r="5" fill={eyeColor} />
          <circle cx={rightX} cy={y} r="5" fill={eyeColor} />
          {/* Sparkle dots */}
          <circle cx={leftX + 2} cy={y - 2} r="1.5" fill="white" />
          <circle cx={rightX + 2} cy={y - 2} r="1.5" fill="white" />
          <circle cx={leftX - 1} cy={y - 3} r="0.8" fill="white" />
          <circle cx={rightX - 1} cy={y - 3} r="0.8" fill="white" />
        </g>
      );
    case 'surprised':
      return (
        <g>
          <ellipse cx={leftX} cy={y} rx="4.5" ry="6" fill={eyeColor} />
          <ellipse cx={rightX} cy={y} rx="4.5" ry="6" fill={eyeColor} />
          <circle cx={leftX + 1} cy={y - 1} r="1.5" fill="white" />
          <circle cx={rightX + 1} cy={y - 1} r="1.5" fill="white" />
        </g>
      );
    case 'determined':
      return (
        <g>
          <ellipse cx={leftX} cy={y} rx="4.5" ry="3.5" fill={eyeColor} />
          <ellipse cx={rightX} cy={y} rx="4.5" ry="3.5" fill={eyeColor} />
          {/* Angled brow lines */}
          <line x1={leftX - 5} y1={y - 7} x2={leftX + 4} y2={y - 5} stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
          <line x1={rightX + 5} y1={y - 7} x2={rightX - 4} y2={y - 5} stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'content':
      return (
        <g>
          {/* Happy crescent eyes */}
          <path d={`M${leftX - 5} ${y} Q${leftX} ${y - 6} ${leftX + 5} ${y}`} fill="none" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
          <path d={`M${rightX - 5} ${y} Q${rightX} ${y - 6} ${rightX + 5} ${y}`} fill="none" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    default: // neutral
      return (
        <g>
          <circle cx={leftX} cy={y} r="4" fill={eyeColor} />
          <circle cx={rightX} cy={y} r="4" fill={eyeColor} />
          <circle cx={leftX + 1} cy={y - 1} r="1.2" fill="white" />
          <circle cx={rightX + 1} cy={y - 1} r="1.2" fill="white" />
        </g>
      );
  }
}

// ─── Mouth shapes by expression ──────────────────────────────────────

function getMouth(expression) {
  const cx = 50, cy = 54;

  switch (expression) {
    case 'excited':
      return (
        <g>
          <path d={`M${cx - 8} ${cy} Q${cx} ${cy + 10} ${cx + 8} ${cy}`} fill="#e06060" stroke="#c04040" strokeWidth="0.5" />
          <path d={`M${cx - 6} ${cy} Q${cx} ${cy + 2} ${cx + 6} ${cy}`} fill="white" />
        </g>
      );
    case 'surprised':
      return <ellipse cx={cx} cy={cy + 2} rx="4" ry="5" fill="#e06060" stroke="#c04040" strokeWidth="0.5" />;
    case 'determined':
      return <line x1={cx - 6} y1={cy + 1} x2={cx + 6} y2={cy + 1} stroke="#c08080" strokeWidth="2" strokeLinecap="round" />;
    case 'content':
      return <path d={`M${cx - 7} ${cy} Q${cx} ${cy + 7} ${cx + 7} ${cy}`} fill="none" stroke="#c08080" strokeWidth="2" strokeLinecap="round" />;
    default: // neutral
      return <path d={`M${cx - 5} ${cy} Q${cx} ${cy + 5} ${cx + 5} ${cy}`} fill="none" stroke="#c08080" strokeWidth="1.8" strokeLinecap="round" />;
  }
}

// ─── World costumes ──────────────────────────────────────────────────

function getCostume(world) {
  switch (world) {
    case 'iron-rails':
      return (
        <g>
          {/* Engineer's cap */}
          <path d="M30 22 L28 18 Q50 8 72 18 L70 22" fill="#546e7a" />
          <rect x="28" y="20" width="44" height="4" rx="1" fill="#37474f" />
          {/* Goggles on forehead */}
          <circle cx="40" cy="26" r="5" fill="none" stroke="#90a4ae" strokeWidth="1.5" />
          <circle cx="60" cy="26" r="5" fill="none" stroke="#90a4ae" strokeWidth="1.5" />
          <line x1="45" y1="26" x2="55" y2="26" stroke="#90a4ae" strokeWidth="1.5" />
        </g>
      );
    case 'star-sector':
      return (
        <g>
          {/* Space helmet dome */}
          <ellipse cx="50" cy="38" rx="30" ry="28" fill="none" stroke="rgba(150,200,255,0.6)" strokeWidth="2" />
          <ellipse cx="50" cy="38" rx="28" ry="26" fill="rgba(150,200,255,0.08)" />
          {/* Antenna */}
          <line x1="50" y1="10" x2="50" y2="2" stroke="#90caf9" strokeWidth="2" />
          <circle cx="50" cy="1" r="2.5" fill="#ff5252" />
        </g>
      );
    case 'old-realm':
      return (
        <g>
          {/* Pointed wizard/adventure hat */}
          <path d="M30 22 L50 -5 L70 22" fill="#5d4037" />
          <path d="M32 22 L50 -2 L68 22" fill="#6d4c41" />
          <rect x="26" y="20" width="48" height="5" rx="2" fill="#4e342e" />
          {/* Star on hat */}
          <circle cx="50" cy="8" r="2.5" fill="#ffd700" />
        </g>
      );
    case 'wild-earth':
      return (
        <g>
          {/* Bear ear headband */}
          <path d="M30 24 Q30 20 34 20 Q38 20 38 24" fill="#8d6e63" />
          <path d="M32 23 Q32 21 34 21 Q36 21 36 23" fill="#d7ccc8" />
          <path d="M62 24 Q62 20 66 20 Q70 20 70 24" fill="#8d6e63" />
          <path d="M64 23 Q64 21 66 21 Q68 21 68 23" fill="#d7ccc8" />
          <rect x="34" y="22" width="32" height="3" rx="1.5" fill="#6d4c41" />
          {/* Leaf pin */}
          <path d="M74 70 Q78 65 76 60 Q72 65 74 70" fill="#66bb6a" />
          <line x1="74" y1="70" x2="75" y2="64" stroke="#388e3c" strokeWidth="0.8" />
        </g>
      );
    case 'hero-city':
      return (
        <g>
          {/* Domino mask */}
          <path d="M30 40 Q35 35 40 38 Q45 41 50 40 Q55 41 60 38 Q65 35 70 40 Q65 45 60 42 Q55 39 50 40 Q45 39 40 42 Q35 45 30 40" fill="#1a237e" />
          {/* Cape collar peek */}
          <path d="M25 72 Q30 68 38 70 Q44 72 50 70 Q56 72 62 70 Q70 68 75 72 L75 85 L25 85 Z" fill="#d32f2f" />
          <path d="M30 72 Q40 68 50 70 Q60 68 70 72" fill="none" stroke="#b71c1c" strokeWidth="1" />
        </g>
      );
    case 'road-ever-on':
      return (
        <g>
          {/* Hobbit traveling cloak */}
          <path d="M22 65 Q24 55 30 50 Q40 42 50 40 Q60 42 70 50 Q76 55 78 65 L80 90 L20 90 Z" fill="#5d4037" opacity="0.7" />
          <path d="M28 52 Q40 44 50 42 Q60 44 72 52" fill="none" stroke="#4e342e" strokeWidth="2" />
          {/* Acorn clasp */}
          <circle cx="50" cy="48" r="3" fill="#8d6e63" />
          <path d="M47 46 Q50 43 53 46" fill="#6d4c41" />
        </g>
      );
    default:
      return null;
  }
}

// ─── Blush circles (always present, warm feel) ───────────────────────

function getBlush(skinHex) {
  return (
    <g opacity="0.3">
      <circle cx="34" cy="50" r="5" fill="#ff8a80" />
      <circle cx="66" cy="50" r="5" fill="#ff8a80" />
    </g>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export default function Avatar({
  hero = {},
  expression = 'neutral',
  world = null,
  size = 'small',
  animated = true,
}) {
  const hairColor = HAIR_COLORS[hero.hairColor] || HAIR_COLORS[DEFAULTS.hairColor];
  const skinTone = SKIN_TONES[hero.skinTone] || SKIN_TONES[DEFAULTS.skinTone];
  const eyeColor = EYE_COLORS[hero.eyeColor] || EYE_COLORS[DEFAULTS.eyeColor];
  const hairStyle = hero.hairStyle || DEFAULTS.hairStyle;

  const px = SIZES[size] || SIZES.small;

  return (
    <div
      style={{
        width: px,
        height: px,
        animation: animated ? 'avatar-bob 3s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes avatar-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
      <svg
        viewBox="0 0 100 90"
        width={px}
        height={px}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Body / tunic */}
        <path
          d="M30 65 Q30 60 35 58 Q42 55 50 55 Q58 55 65 58 Q70 60 70 65 L72 90 L28 90 Z"
          fill="#7e57c2"
        />

        {/* Neck */}
        <rect x="45" y="56" width="10" height="8" rx="4" fill={skinTone} />

        {/* Head */}
        <ellipse cx="50" cy="40" rx="22" ry="24" fill={skinTone} />

        {/* Hair (behind head for some styles, so rendered in two layers) */}
        <g style={{ color: hairColor }}>
          {getHairPath(hairStyle)}
        </g>

        {/* Ears */}
        <ellipse cx="27" cy="42" rx="4" ry="5" fill={skinTone} />
        <ellipse cx="73" cy="42" rx="4" ry="5" fill={skinTone} />

        {/* Blush */}
        {getBlush(skinTone)}

        {/* Eyes */}
        {getEyes(expression, eyeColor)}

        {/* Nose — tiny dot */}
        <circle cx="50" cy="48" r="1.5" fill={skinTone} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />

        {/* Mouth */}
        {getMouth(expression)}

        {/* World costume overlay */}
        {world && getCostume(world)}
      </svg>
    </div>
  );
}
