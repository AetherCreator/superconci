// Hub Audio Engine — mirrors NumberBlasters AudioEngine pattern
// Web Audio API synthesis only, no audio files

class HubAudio {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicInterval = null;
    this.isPlaying = false;
    // Engine hum state
    this.engineOsc = null;
    this.engineGain = null;
    this.engineActive = false;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.08;
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.2;
    this.sfxGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  playNote(freq, duration, type = "sine", gainNode = this.sfxGain, vol = 0.2) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(gainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Dreamy ambient space loop — slow, quiet, ethereal
  startMusic() {
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;

    const melody = [330, 0, 392, 0, 0, 494, 0, 330, 0, 0, 392, 0, 587, 0, 494, 0];
    const pad = [131, 131, 165, 165, 175, 175, 131, 131, 147, 147, 165, 165, 131, 131, 131, 131];
    let step = 0;
    const bpm = 50;
    const stepMs = (60 / bpm) * 1000;

    this.musicInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const idx = step % melody.length;

      this.playNote(pad[idx], stepMs / 1000 * 1.2, "sine", this.musicGain, 0.15);

      const note = melody[idx];
      if (note > 0) {
        this.playNote(note, stepMs / 1000 * 0.6, "triangle", this.musicGain, 0.08);
        if (step % 4 === 0) {
          this.playNote(note * 2, stepMs / 1000 * 0.3, "sine", this.musicGain, 0.03);
        }
      }

      step++;
    }, stepMs);
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Planet tap (active) — bright ascending arpeggio
  planetSelect() {
    const notes = [523, 659, 784]; // C5 E5 G5
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(n, 0.12, "square", this.sfxGain, 0.15), i * 50);
    });
  }

  // Planet tap (locked) — single low muted tone
  planetLocked() {
    this.playNote(165, 0.3, "triangle", this.sfxGain, 0.1);
  }

  // Return to hub — soft welcoming chord
  welcomeBack() {
    const chord = [262, 330, 392, 523]; // C4 E4 G4 C5
    chord.forEach((n, i) => {
      setTimeout(() => this.playNote(n, 0.5, "sine", this.sfxGain, 0.1), i * 30);
    });
  }

  // ── New sounds for Galaxy Navigator ──

  // Engine thrust — continuous hum while joystick active
  startEngine(speed = 0) {
    if (!this.ctx) return;
    if (this.engineActive) {
      // Update pitch based on speed
      if (this.engineOsc) {
        this.engineOsc.frequency.setTargetAtTime(
          60 + speed * 20,
          this.ctx.currentTime,
          0.1
        );
      }
      return;
    }
    this.engineActive = true;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 60;
    this.engineGain.gain.value = 0;
    this.engineGain.gain.setTargetAtTime(0.04, this.ctx.currentTime, 0.1);
    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);
    this.engineOsc.start();
  }

  stopEngine() {
    if (!this.engineActive || !this.ctx) return;
    this.engineActive = false;
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    }
    const osc = this.engineOsc;
    setTimeout(() => {
      try { osc.stop(); } catch (e) { /* already stopped */ }
    }, 300);
    this.engineOsc = null;
    this.engineGain = null;
  }

  // Warp shimmer — quick ascending sweep on boundary wrap
  warpShimmer() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.2);
    g.gain.setValueAtTime(0.12, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Proximity chime — soft chime when entering planet proximity
  proximityChime(bright = true) {
    if (!this.ctx) return;
    if (bright) {
      // Number Blasters: bright C major
      this.playNote(523, 0.3, "triangle", this.sfxGain, 0.12);
      setTimeout(() => this.playNote(659, 0.25, "triangle", this.sfxGain, 0.08), 60);
    } else {
      // Locked planets: softer, lower
      this.playNote(330, 0.3, "sine", this.sfxGain, 0.06);
    }
  }

  // Countdown beeps — 3 ascending beeps during dwell
  countdownBeep(step) {
    if (!this.ctx) return;
    // step: 0=first, 1=second, 2=third (loudest)
    const freqs = [440, 554, 698];
    const vols = [0.08, 0.1, 0.15];
    this.playNote(freqs[step] || 698, 0.1, "square", this.sfxGain, vols[step] || 0.15);
  }

  // Launch whoosh — short impact on game start
  launchWhoosh() {
    if (!this.ctx) return;
    // Noise-like whoosh using detuned oscillators
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc1.type = "sawtooth";
    osc2.type = "square";
    osc1.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);
    osc2.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc1.connect(g);
    osc2.connect(g);
    g.connect(this.sfxGain);
    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.35);
    osc2.stop(this.ctx.currentTime + 0.35);
  }
}

const hubAudio = new HubAudio();
export default hubAudio;
