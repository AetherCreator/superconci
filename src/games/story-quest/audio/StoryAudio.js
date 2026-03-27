/**
 * StoryAudio.js — Procedural ambient audio for 6 Story Quest worlds.
 * Pure Web Audio API — no audio files.
 */

export default class StoryAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentWorld = null;
    this.activeNodes = [];
    this.activeTimers = [];
    this.volume = 0.3;
    this.isMuted = false;
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ─── Public API ────────────────────────────────────────────────────

  startWorld(worldId) {
    this._ensureContext();
    this._stopAll(0);
    this.currentWorld = worldId;
    this._startSoundscape(worldId);
  }

  stop(fadeMs = 1000) {
    this._stopAll(fadeMs / 1000);
    this.currentWorld = null;
  }

  crossfadeTo(worldId, durationMs = 2000) {
    if (worldId === this.currentWorld) return;
    this._ensureContext();

    const fadeSec = durationMs / 2000;
    // Fade out current
    this._stopAll(fadeSec);

    // Start new after half the crossfade
    setTimeout(() => {
      this.currentWorld = worldId;
      this._startSoundscape(worldId);
    }, durationMs / 2);
  }

  playEffect(effectName) {
    this._ensureContext();
    const effects = {
      choice_made: () => this._effectChime(),
      story_complete: () => this._effectFanfare(),
      free_text_prompt: () => this._effectSparkle(),
      bridge_transition: () => this._effectWhoosh(),
    };
    const fn = effects[effectName];
    if (fn) fn();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.value = this.volume;
    }
  }

  mute() {
    this.isMuted = true;
    if (this.masterGain) this.masterGain.gain.value = 0;
  }

  unmute() {
    this.isMuted = false;
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  destroy() {
    this._stopAll(0);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }

  // ─── Internal helpers ──────────────────────────────────────────────

  _stopAll(fadeSec) {
    const now = this.ctx ? this.ctx.currentTime : 0;

    for (const node of this.activeNodes) {
      try {
        if (node.gain) {
          node.gain.linearRampToValueAtTime(0, now + fadeSec);
        }
        setTimeout(() => {
          try { node.disconnect(); } catch (e) {}
          try { if (node.stop) node.stop(); } catch (e) {}
        }, (fadeSec + 0.1) * 1000);
      } catch (e) {}
    }
    this.activeNodes = [];

    for (const t of this.activeTimers) clearTimeout(t);
    this.activeTimers = [];
  }

  _makeGain(value = 0.5) {
    const g = this.ctx.createGain();
    g.gain.value = value;
    g.connect(this.masterGain);
    this.activeNodes.push(g);
    return g;
  }

  _makeOsc(type, freq, gainVal = 0.3) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = this._makeGain(gainVal);
    osc.connect(gain);
    osc.start();
    this.activeNodes.push(osc);
    return { osc, gain };
  }

  _makeNoise(gainVal = 0.1) {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    const gain = this._makeGain(gainVal);
    this.activeNodes.push(source);
    return { source, gain };
  }

  _scheduleRecurring(fn, minMs, maxMs) {
    const schedule = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      const t = setTimeout(() => {
        if (this.currentWorld) {
          fn();
          schedule();
        }
      }, delay);
      this.activeTimers.push(t);
    };
    schedule();
  }

  // Pentatonic scale notes (C major pentatonic)
  _penta(octave = 4) {
    const base = 261.63 * Math.pow(2, octave - 4);
    return [base, base * 9/8, base * 5/4, base * 3/2, base * 5/3];
  }

  _randomNote(octave = 4) {
    const notes = this._penta(octave);
    return notes[Math.floor(Math.random() * notes.length)];
  }

  // ─── Soundscapes ───────────────────────────────────────────────────

  _startSoundscape(worldId) {
    const scapes = {
      'iron-rails': () => this._ironRails(),
      'star-sector': () => this._starSector(),
      'old-realm': () => this._oldRealm(),
      'wild-earth': () => this._wildEarth(),
      'hero-city': () => this._heroCity(),
      'road-ever-on': () => this._roadEverOn(),
    };
    const fn = scapes[worldId];
    if (fn) fn();
  }

  _ironRails() {
    // Low warm drone
    this._makeOsc('sawtooth', 65, 0.06);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    // Rhythmic pulse ~100 BPM (600ms)
    this._scheduleRecurring(() => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55;
      const g = this._makeGain(0);
      osc.connect(g);
      osc.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.stop(now + 0.2);
    }, 580, 620);

    // Steam hiss every 4 beats
    this._scheduleRecurring(() => {
      const { source, gain } = this._makeNoise(0);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      source.disconnect();
      source.connect(filter);
      filter.connect(gain);
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      setTimeout(() => { try { source.stop(); } catch(e){} }, 500);
    }, 2200, 2600);

    // Metallic chime
    this._scheduleRecurring(() => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = this._randomNote(6);
      const g = this._makeGain(0);
      osc.connect(g);
      osc.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.stop(now + 1.6);
    }, 3000, 6000);
  }

  _starSector() {
    // Deep sub-bass pad with slow LFO
    const { osc } = this._makeOsc('sine', 55, 0.1);
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    this.activeNodes.push(lfo);

    // Shimmer (filtered noise)
    const { source, gain } = this._makeNoise(0.02);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4000;
    filter.Q.value = 2;
    source.disconnect();
    source.connect(filter);
    filter.connect(gain);

    // Soft synth plucks
    this._scheduleRecurring(() => {
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = this._randomNote(5);
      const g = this._makeGain(0);
      o.connect(g);
      o.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2);
      o.stop(now + 2.1);
    }, 2000, 5000);

    // Sonar ping
    this._scheduleRecurring(() => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 1200 + Math.random() * 400;
      const g = this._makeGain(0);
      o.connect(g);
      o.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      o.stop(now + 1.6);
    }, 5000, 10000);
  }

  _oldRealm() {
    // Warm drone (root + fifth)
    this._makeOsc('sawtooth', 130, 0.04);
    this._makeOsc('sawtooth', 195, 0.03);

    // Soft wind
    const { source: windSrc, gain: windGain } = this._makeNoise(0.03);
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 400;
    windFilter.Q.value = 0.5;
    windSrc.disconnect();
    windSrc.connect(windFilter);
    windFilter.connect(windGain);

    // Plucked string (Karplus-Strong approximation)
    this._scheduleRecurring(() => {
      const freq = this._randomNote(4);
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      const g = this._makeGain(0);
      o.connect(g);
      o.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1);
      o.stop(now + 1.1);
    }, 2000, 5000);

    // Bird chirps
    this._scheduleRecurring(() => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      const baseFreq = 2000 + Math.random() * 1000;
      o.frequency.value = baseFreq;
      const g = this._makeGain(0);
      o.connect(g);
      o.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.03, now);
      o.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + 0.08);
      o.frequency.linearRampToValueAtTime(baseFreq, now + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.stop(now + 0.25);
    }, 3000, 8000);
  }

  _wildEarth() {
    // Layered wind drones at different bands
    for (const freq of [200, 500, 1200]) {
      const { source, gain } = this._makeNoise(0.015);
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq;
      f.Q.value = 1;
      source.disconnect();
      source.connect(f);
      f.connect(gain);
    }

    // Water droplets
    this._scheduleRecurring(() => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 1000 + Math.random() * 500;
      const g = this._makeGain(0);
      o.connect(g);
      o.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.06, now);
      o.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o.stop(now + 0.35);
    }, 1000, 3000);

    // Soft insect buzz
    const buzzOsc = this.ctx.createOscillator();
    buzzOsc.type = 'sine';
    buzzOsc.frequency.value = 180;
    const modOsc = this.ctx.createOscillator();
    modOsc.type = 'sine';
    modOsc.frequency.value = 40;
    const modGain = this.ctx.createGain();
    modGain.gain.value = 20;
    modOsc.connect(modGain);
    modGain.connect(buzzOsc.frequency);
    const buzzGain = this._makeGain(0.015);
    buzzOsc.connect(buzzGain);
    buzzOsc.start();
    modOsc.start();
    this.activeNodes.push(buzzOsc, modOsc);

    // Animal-like call
    this._scheduleRecurring(() => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 600;
      const g = this._makeGain(0);
      o.connect(g);
      o.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.04, now);
      o.frequency.linearRampToValueAtTime(900, now + 0.3);
      o.frequency.linearRampToValueAtTime(500, now + 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      o.stop(now + 0.9);
    }, 5000, 10000);
  }

  _heroCity() {
    // Driving beat ~120 BPM (500ms)
    let beat = 0;
    this._scheduleRecurring(() => {
      beat++;
      // Kick on every beat
      const kick = this.ctx.createOscillator();
      kick.type = 'sine';
      kick.frequency.value = 150;
      const kg = this._makeGain(0);
      kick.connect(kg);
      kick.start();
      const now = this.ctx.currentTime;
      kg.gain.setValueAtTime(0.12, now);
      kick.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      kg.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      kick.stop(now + 0.2);

      // Hi-hat on offbeats
      if (beat % 2 === 0) {
        const { source, gain } = this._makeNoise(0);
        const hf = this.ctx.createBiquadFilter();
        hf.type = 'highpass';
        hf.frequency.value = 8000;
        source.disconnect();
        source.connect(hf);
        hf.connect(gain);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        setTimeout(() => { try { source.stop(); } catch(e){} }, 100);
      }
    }, 480, 520);

    // Power chord stabs every 2 bars
    this._scheduleRecurring(() => {
      const root = 130;
      for (const [type, freq, vol] of [['sawtooth', root, 0.06], ['square', root * 1.5, 0.04]]) {
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;
        const g = this._makeGain(0);
        o.connect(g);
        o.start();
        const now = this.ctx.currentTime;
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.stop(now + 0.5);
      }
    }, 3800, 4200);

    // City ambient hum
    this._makeNoise(0.008);

    // Rising heroic motif every 8 bars
    this._scheduleRecurring(() => {
      const notes = [261, 329, 392, 523];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const o = this.ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.value = freq;
          const g = this._makeGain(0);
          o.connect(g);
          o.start();
          const now = this.ctx.currentTime;
          g.gain.setValueAtTime(0.06, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          o.stop(now + 0.6);
        }, i * 200);
      });
    }, 14000, 18000);
  }

  _roadEverOn() {
    // Gentle walking rhythm ~80 BPM (750ms)
    this._scheduleRecurring(() => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 80;
      const g = this._makeGain(0);
      o.connect(g);
      o.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      o.stop(now + 0.2);

      // Brush noise on offbeat
      setTimeout(() => {
        const { source, gain } = this._makeNoise(0);
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 3000;
        f.Q.value = 2;
        source.disconnect();
        source.connect(f);
        f.connect(gain);
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        setTimeout(() => { try { source.stop(); } catch(e){} }, 120);
      }, 375);
    }, 730, 770);

    // Warm pad chord
    for (const freq of [196, 246, 294]) {
      const { osc } = this._makeOsc('sawtooth', freq, 0.025);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      osc.disconnect();
      const g = this.activeNodes[this.activeNodes.length - 1]; // last gain
      osc.connect(filter);
      filter.connect(g);
    }

    // Penny whistle melody (simple folk motif)
    const melody = [392, 440, 523, 587, 523, 440, 392, 329];
    let noteIndex = 0;
    this._scheduleRecurring(() => {
      const freq = melody[noteIndex % melody.length];
      noteIndex++;
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      // Slight vibrato
      const vib = this.ctx.createOscillator();
      vib.type = 'sine';
      vib.frequency.value = 5;
      const vibG = this.ctx.createGain();
      vibG.gain.value = 3;
      vib.connect(vibG);
      vibG.connect(o.frequency);
      vib.start();
      const g = this._makeGain(0);
      o.connect(g);
      o.start();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      o.stop(now + 0.9);
      vib.stop(now + 0.9);
      this.activeNodes.push(vib);
    }, 800, 1200);

    // Fire crackle
    this._scheduleRecurring(() => {
      const { source, gain } = this._makeNoise(0);
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 5000;
      source.disconnect();
      source.connect(f);
      f.connect(gain);
      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      setTimeout(() => { try { source.stop(); } catch(e){} }, 80);
    }, 100, 400);
  }

  // ─── One-shot effects ──────────────────────────────────────────────

  _effectChime() {
    const notes = [523, 659];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq;
        const g = this._makeGain(0);
        o.connect(g);
        o.start();
        const now = this.ctx.currentTime;
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        o.stop(now + 0.6);
      }, i * 120);
    });
  }

  _effectFanfare() {
    const notes = [392, 523, 659];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const o = this.ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = freq;
        const g = this._makeGain(0);
        o.connect(g);
        o.start();
        const now = this.ctx.currentTime;
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        o.stop(now + 1.6);
      }, i * 200);
    });
  }

  _effectSparkle() {
    const freqs = [2000, 1600, 1200, 900, 700];
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq;
        const g = this._makeGain(0);
        o.connect(g);
        o.start();
        const now = this.ctx.currentTime;
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.stop(now + 0.25);
      }, i * 60);
    });
  }

  _effectWhoosh() {
    const { source, gain } = this._makeNoise(0);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 1;
    source.disconnect();
    source.connect(filter);
    filter.connect(gain);
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.1, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    setTimeout(() => { try { source.stop(); } catch(e){} }, 600);
  }
}
