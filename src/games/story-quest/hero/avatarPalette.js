/**
 * avatarPalette.js — Curated color and style lookup tables for hero avatars.
 * These enum keys are what Claude's parse call returns.
 * Hex values map to CSS variables for the SVG avatar in Avatar.jsx.
 */

export const HAIR_COLORS = {
  black: '#1a1a2e',
  dark_brown: '#3d2314',
  medium_brown: '#6b4226',
  light_brown: '#a0734b',
  auburn: '#8b3a3a',
  red: '#c0392b',
  strawberry_blonde: '#d4a373',
  golden_blonde: '#daa520',
  platinum_blonde: '#e8dcc8',
  gray: '#9e9e9e',
  white: '#f0ece2',
  blue_black: '#1a1a3e',
};

export const HAIR_STYLES = ['curly', 'wavy', 'straight', 'coily', 'braided', 'short_cropped'];

export const SKIN_TONES = {
  porcelain: '#fde8d0',
  fair: '#f5d6b8',
  light: '#e8c4a0',
  light_medium: '#d4a574',
  medium: '#c68e5b',
  medium_tan: '#b07940',
  olive: '#a38b5f',
  tan: '#a0744b',
  brown: '#8b6234',
  dark_brown: '#6b4226',
  deep_brown: '#4a2e1a',
  deep: '#3a2010',
};

export const EYE_COLORS = {
  dark_brown: '#3d1c02',
  brown: '#6b3a2a',
  amber: '#c48c32',
  hazel: '#8b7355',
  green: '#4a7c59',
  blue_green: '#3a8b8c',
  blue: '#4a7fb5',
  gray_blue: '#708fa0',
  gray: '#8c9196',
  dark: '#1a1a1a',
};

export const DEFAULTS = {
  hairColor: 'dark_brown',
  hairStyle: 'curly',
  skinTone: 'medium',
  eyeColor: 'brown',
};
