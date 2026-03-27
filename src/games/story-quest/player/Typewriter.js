/**
 * Typewriter.js — Character-by-character text animation engine.
 * Handles both full-text (procedural) and streaming chunks (AI).
 */

export default class Typewriter {
  constructor({ onChar, onWord, onComplete, speed = 40 }) {
    this.onChar = onChar;
    this.onWord = onWord;
    this.onComplete = onComplete;
    this.speed = speed;

    this.buffer = '';
    this.bufferIndex = 0;
    this.currentWord = '';
    this.timer = null;
    this.isStreaming = false;
    this.streamEnded = false;
    this.isComplete = false;
    this.isPaused = false;
    this.fullText = '';
  }

  // Start typing pre-known text (procedural segments)
  typeText(text) {
    return new Promise((resolve) => {
      this.reset();
      this.buffer = text;
      this.fullText = text;
      this.streamEnded = true;
      this._onCompleteResolve = resolve;
      this._startTicking();
    });
  }

  // Receive streaming chunks (AI segments)
  addChunk(textDelta) {
    this.isStreaming = true;
    this.buffer += textDelta;
    this.fullText += textDelta;
    if (!this.timer && !this.isPaused) {
      this._startTicking();
    }
  }

  // Signal streaming is done
  endStream() {
    this.streamEnded = true;
    if (!this.timer && !this.isPaused && this.bufferIndex < this.buffer.length) {
      this._startTicking();
    }
  }

  // Show all remaining text immediately
  skip() {
    if (this.isComplete) return;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Emit all remaining characters at once
    const remaining = this.buffer.slice(this.bufferIndex);
    if (remaining) {
      this.onChar(remaining);
      // Emit remaining words
      const words = remaining.split(/\s+/).filter(Boolean);
      for (const word of words) {
        this.onWord(word);
      }
    }

    this.bufferIndex = this.buffer.length;
    this._finish();
  }

  pause() {
    this.isPaused = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resume() {
    this.isPaused = false;
    if (this.bufferIndex < this.buffer.length) {
      this._startTicking();
    }
  }

  setSpeed(ms) {
    this.speed = ms;
    if (this.timer) {
      clearInterval(this.timer);
      this._startTicking();
    }
  }

  reset() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.buffer = '';
    this.bufferIndex = 0;
    this.currentWord = '';
    this.isStreaming = false;
    this.streamEnded = false;
    this.isComplete = false;
    this.isPaused = false;
    this.fullText = '';
    this._onCompleteResolve = null;
  }

  _startTicking() {
    if (this.timer) return;
    this.timer = setInterval(() => this._tick(), this.speed);
  }

  _tick() {
    if (this.isPaused) return;

    if (this.bufferIndex >= this.buffer.length) {
      // Buffer exhausted
      if (this.streamEnded) {
        clearInterval(this.timer);
        this.timer = null;
        this._finish();
      } else {
        // Waiting for more chunks — pause naturally
        clearInterval(this.timer);
        this.timer = null;
      }
      return;
    }

    const char = this.buffer[this.bufferIndex];
    this.bufferIndex++;
    this.onChar(char);

    // Track words
    if (/\s/.test(char)) {
      if (this.currentWord) {
        this.onWord(this.currentWord);
        this.currentWord = '';
      }
    } else {
      this.currentWord += char;
    }
  }

  _finish() {
    if (this.isComplete) return;
    this.isComplete = true;

    // Emit final word if pending
    if (this.currentWord) {
      this.onWord(this.currentWord);
      this.currentWord = '';
    }

    this.onComplete();
    if (this._onCompleteResolve) {
      this._onCompleteResolve();
      this._onCompleteResolve = null;
    }
  }
}
