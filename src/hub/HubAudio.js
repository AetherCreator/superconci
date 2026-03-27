// Hub Audio Engine — mirrors NumberBlasters AudioEngine pattern
// Web Audio API synthesis only, no audio files

class HubAudio {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicInterval = null;
    this.isPlaying = false;
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

    // Pentatonic scale for dreamy space feel
    const melody = [330, 0, 392, 0, 0, 494, 0, 330, 0, 0, 392, 0, 587, 0, 494, 0];
    // Slow pad drone notes
    const pad = [131, 131, 165, 165, 175, 175, 131, 131, 147, 147, 165, 165, 131, 131, 131, 131];
    let step = 0;
    const bpm = 50;
    const stepMs = (60 / bpm) * 1000;

    this.musicInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const idx = step % melody.length;

      // Deep pad — very quiet sine drone
      this.playNote(pad[idx], stepMs / 1000 * 1.2, "sine", this.musicGain, 0.15);

      // Melody — sparse, high, trianglewave for softness
      const note = melody[idx];
      if (note > 0) {
        this.playNote(note, stepMs / 1000 * 0.6, "triangle", this.musicGain, 0.08);
        // Subtle octave shimmer on some notes
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
}

const hubAudio = new HubAudio();
export default hubAudio;
