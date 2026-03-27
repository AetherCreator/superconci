/**
 * StoryEngine.js — Core story playback: procedural segments + AI streaming moments.
 * Pure engine logic — no rendering, no audio, no UI.
 */

import { getPackSegment, getStorySegments } from '../db/storyDB.js';
import { injectHero, resolveBranch } from '../db/packLoader.js';
import StreamHandler from './StreamHandler.js';

const MAX_SEGMENTS = 20;

export default class StoryEngine {
  constructor({ storyId, packId, heroData, apiKey, onSegment, onChoices, onEnding, onError }) {
    this.storyId = storyId;
    this.packId = packId;
    this.heroData = heroData; // { name, description, pronoun, possessive }
    this.apiKey = apiKey;
    this.onSegment = onSegment;       // (text, source) — called when text ready/streaming
    this.onChoices = onChoices;       // (choices, allowFreeText) — called when choices ready
    this.onEnding = onEnding;         // (text) — called when story ends
    this.onError = onError;           // (error) — called on failures

    this.history = [];
    this.segmentCount = 0;
    this.currentSegment = null;
    this.currentSource = null;
    this.pendingFreeText = null;

    this.streamHandler = new StreamHandler({
      heroData,
      worldId: null, // Set when playing
      apiKey,
    });
  }

  setWorldId(worldId) {
    this.streamHandler.worldId = worldId;
  }

  // Load history from existing story segments (for resume)
  loadHistory(existingSegments) {
    this.segmentCount = existingSegments.length;
    this.history = existingSegments.map((seg) => ({
      text: seg.content,
      source: seg.source,
    }));
  }

  // Start or resume playing from a specific segment
  async playSegment(segmentId) {
    const packSegment = getPackSegment(this.packId, segmentId);
    if (!packSegment) {
      this.onError(new Error(`Segment ${segmentId} not found in pack ${this.packId}`));
      return;
    }

    this.currentSegment = packSegment;

    if (packSegment.type === 'procedural') {
      this.playProcedural(packSegment);
    } else if (packSegment.type === 'ai_moment') {
      await this.playAIMoment(packSegment);
    }
  }

  // Play a procedural segment — local data, no API call
  playProcedural(segment) {
    const text = injectHero(segment.text, this.heroData);
    this.currentSource = 'pack';

    this.onSegment(text, 'pack');

    // Check for ending
    if (segment.next_map === null && !segment.choices) {
      // This is an ending segment
      this.onEnding(text);
      return;
    }

    const choices = segment.choices || [];
    const injectedChoices = choices.map((c) => injectHero(c, this.heroData));
    this.onChoices(injectedChoices, false);

    this.addToHistory(text, 'pack');
  }

  // Play an AI moment — stream from Claude API with fallback
  async playAIMoment(segment) {
    if (!this.apiKey) {
      this.playFallback(segment);
      return;
    }

    try {
      const result = await this.streamHandler.stream({
        prompt: segment.ai_prompt || 'Continue the story.',
        context: segment.ai_context || '',
        history: this.getFormattedHistory(),
        freeTextInput: this.pendingFreeText,
        isWrapUp: false,
        onTextChunk: (chunk) => {
          this.onSegment(chunk, 'ai-stream');
        },
      });

      this.pendingFreeText = null;
      this.currentSource = 'ai';

      if (result.isEnding) {
        this.addToHistory(result.text, 'ai');
        this.onEnding(result.text);
        return;
      }

      this.addToHistory(result.text, 'ai');
      this.onChoices(result.choices, result.allowFreeText);
    } catch (error) {
      // Network error, API error — fall back to pack data
      this.playFallback(segment);
    }
  }

  // Fallback for offline or failed AI moments
  playFallback(segment) {
    const text = injectHero(segment.fallback_text, this.heroData);
    const choices = segment.fallback_choices
      ? segment.fallback_choices.map((c) => injectHero(c, this.heroData))
      : ['Continue the adventure'];

    this.currentSource = 'fallback';
    this.onSegment(text, 'fallback');
    this.onChoices(choices, false);
    this.addToHistory(text, 'fallback');
  }

  // Process a choice selection and advance
  async selectChoice(choiceIndex, choiceText) {
    const segment = this.currentSegment;
    if (!segment) return;

    let nextSegmentId;

    if (this.currentSource === 'ai' || this.currentSource === 'fallback') {
      // AI moment or fallback — use branchHints or fallback nextMap
      if (segment.next_map) {
        // Fallback path used nextMap
        nextSegmentId = segment.next_map[String(choiceIndex)];
      } else {
        // Parse branchHints from the raw segment data
        // branchHints are stored in ai_context or we need to check
        // For AI moments, resolve via keyword matching
        const branchHintsRaw = this.parseBranchHints(segment);
        if (branchHintsRaw) {
          nextSegmentId = resolveBranch(choiceText, branchHintsRaw);
        }
      }
    } else {
      // Procedural — use nextMap directly
      if (segment.next_map) {
        nextSegmentId = segment.next_map[String(choiceIndex)];
      }
    }

    if (!nextSegmentId) {
      this.onError(new Error('Could not determine next segment'));
      return;
    }

    this.segmentCount++;

    // Check if we should wrap up
    if (this.segmentCount >= MAX_SEGMENTS) {
      await this.playWrapUp();
      return;
    }

    await this.playSegment(nextSegmentId);
  }

  // Handle free text submission
  submitFreeText(userText) {
    this.pendingFreeText = userText;
    this.addToHistory(`[${this.heroData.name} says: "${userText}"]`, 'user');
  }

  // Force wrap-up at segment 20
  async playWrapUp() {
    if (!this.apiKey) {
      const wrapText = `${this.heroData.name} smiled as the adventure came to an end. What a journey it had been! Every step, every choice, every moment of wonder had led to this. And though this story was over, ${this.heroData.name} knew there would always be more adventures waiting just around the corner.`;
      this.onSegment(wrapText, 'fallback');
      this.onEnding(wrapText);
      this.addToHistory(wrapText, 'fallback');
      return;
    }

    try {
      const result = await this.streamHandler.stream({
        prompt: '',
        context: '',
        history: this.getFormattedHistory(),
        freeTextInput: null,
        isWrapUp: true,
        onTextChunk: (chunk) => {
          this.onSegment(chunk, 'ai-stream');
        },
      });

      this.addToHistory(result.text, 'ai');
      this.onEnding(result.text);
    } catch (error) {
      // Fallback wrap-up
      const wrapText = `${this.heroData.name} smiled as the adventure came to an end. What a journey it had been! And ${this.heroData.name} knew — the best adventures never truly end.`;
      this.onSegment(wrapText, 'fallback');
      this.onEnding(wrapText);
      this.addToHistory(wrapText, 'fallback');
    }
  }

  // Parse branchHints from segment data
  // branchHints may be embedded in ai_context as JSON
  parseBranchHints(segment) {
    if (!segment.ai_context) return null;
    try {
      const ctx = JSON.parse(segment.ai_context);
      return ctx.branchHints || null;
    } catch (e) {
      return null;
    }
  }

  // History management
  addToHistory(text, source) {
    this.history.push({ text, source });
  }

  getFormattedHistory() {
    if (this.history.length === 0) return '';
    return this.history
      .map((h, i) => `[Segment ${i + 1}] ${h.text}`)
      .join('\n\n');
  }

  // Get current state for saving
  getState() {
    return {
      segmentCount: this.segmentCount,
      currentSource: this.currentSource,
      currentSegmentId: this.currentSegment?.segment_id,
    };
  }
}
