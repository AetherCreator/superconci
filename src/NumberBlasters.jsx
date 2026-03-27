import { useState, useEffect, useCallback, useRef } from "react";

const STAR_COUNT = 60;
const GAME_DURATION = 60;
const MAX_LIVES = 3;

const DIFFICULTIES = {
  easy: { label: "Cadet", range: [1, 5], ops: ["+"], speed: 11000, emoji: "🚀" },
  medium: { label: "Pilot", range: [1, 10], ops: ["+", "-"], speed: 8000, emoji: "🛸" },
  hard: { label: "Commander", range: [1, 20], ops: ["+", "-"], speed: 5500, emoji: "⭐" },
};

// ─── AUDIO ENGINE (Web Audio API) ───────────────────────────────────

class AudioEngine {
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
    this.musicGain.gain.value = 0.12;
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.25;
    this.sfxGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  playNote(freq, duration, type = "square", gainNode = this.sfxGain, vol = 0.3) {
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

  // Laser zap - ascending sweep
  laserShoot() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Correct answer - happy arpeggio
  correctHit() {
    this.laserShoot();
    const notes = [523, 659, 784]; // C5 E5 G5
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(n, 0.15, "square", this.sfxGain, 0.2), i * 60);
    });
  }

  // Wrong answer - descending buzz
  wrongHit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // Asteroid hits ship - explosion rumble
  asteroidImpact() {
    if (!this.ctx) return;
    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start();
    noise.stop(this.ctx.currentTime + 0.3);
    // Low thud
    this.playNote(60, 0.3, "sine", this.sfxGain, 0.4);
  }

  // Combo milestone
  comboUp() {
    const notes = [784, 988, 1175]; // G5 B5 D6
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(n, 0.12, "square", this.sfxGain, 0.15), i * 50);
    });
  }

  // Game over
  gameOver() {
    const notes = [392, 330, 262, 196]; // G4 E4 C4 G3
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(n, 0.4, "triangle", this.sfxGain, 0.2), i * 200);
    });
  }

  // Victory fanfare
  victory() {
    const notes = [523, 523, 523, 659, 784, 784]; // C C C E G G
    const durs = [0.1, 0.1, 0.2, 0.15, 0.3, 0.3];
    let t = 0;
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(n, durs[i] + 0.1, "square", this.sfxGain, 0.2), t);
      t += durs[i] * 1000 + 40;
    });
  }

  // Menu select
  menuSelect() {
    this.playNote(880, 0.08, "square", this.sfxGain, 0.15);
    setTimeout(() => this.playNote(1100, 0.1, "square", this.sfxGain, 0.15), 60);
  }

  // Background chiptune loop
  startMusic() {
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;

    // Simple space-themed bass line pattern
    const bassLine = [131, 131, 165, 165, 175, 175, 147, 147]; // C3 C3 E3 E3 F3 F3 D3 D3
    const melody = [523, 0, 659, 0, 784, 659, 523, 0]; // C5 _ E5 _ G5 E5 C5 _
    let step = 0;
    const bpm = 140;
    const stepMs = (60 / bpm) * 1000 / 2;

    this.musicInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const idx = step % bassLine.length;

      // Bass
      this.playNote(bassLine[idx], stepMs / 1000 * 0.8, "triangle", this.musicGain, 0.3);

      // Melody (every other measure add variation)
      const melodyNote = melody[idx];
      if (melodyNote > 0) {
        const octaveShift = Math.floor(step / 16) % 2 === 0 ? 1 : 1.5;
        this.playNote(melodyNote * octaveShift, stepMs / 1000 * 0.5, "square", this.musicGain, 0.12);
      }

      // Hi-hat on every beat
      if (this.ctx) {
        const bufSize = this.ctx.sampleRate * 0.02;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const hg = this.ctx.createGain();
        hg.gain.value = step % 2 === 0 ? 0.06 : 0.03;
        const hf = this.ctx.createBiquadFilter();
        hf.type = "highpass";
        hf.frequency.value = 8000;
        src.connect(hf);
        hf.connect(hg);
        hg.connect(this.musicGain);
        src.start();
        src.stop(this.ctx.currentTime + 0.02);
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

  setMusicVolume(v) {
    if (this.musicGain) this.musicGain.gain.value = v * 0.12;
  }

  setSfxVolume(v) {
    if (this.sfxGain) this.sfxGain.gain.value = v * 0.25;
  }
}

const audio = new AudioEngine();

// ─── GAME LOGIC ─────────────────────────────────────────────────────

function generateProblem(difficulty) {
  const config = DIFFICULTIES[difficulty];
  const op = config.ops[Math.floor(Math.random() * config.ops.length)];
  let a = Math.floor(Math.random() * (config.range[1] - config.range[0] + 1)) + config.range[0];
  let b = Math.floor(Math.random() * (config.range[1] - config.range[0] + 1)) + config.range[0];
  if (op === "-" && b > a) [a, b] = [b, a];
  const answer = op === "+" ? a + b : a - b;
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const wrong = answer + (Math.random() > 0.5 ? offset : -offset);
    if (wrong !== answer && wrong >= 0) wrongs.add(wrong);
  }
  const choices = [...wrongs, answer].sort(() => Math.random() - 0.5);
  return { a, b, op, answer, choices };
}

// ─── COMPONENTS ─────────────────────────────────────────────────────

function Starfield() {
  const stars = useRef(
    Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 15 + 8,
      delay: Math.random() * 5,
      brightness: Math.random() * 0.5 + 0.5,
    }))
  ).current;
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: "50%",
            backgroundColor: `rgba(255,255,255,${s.brightness})`,
            animation: `twinkle ${s.speed}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Asteroid({ choice, onSelect, onMiss, index, total, falling, speed, problemKey }) {
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA"];
  const color = colors[index % colors.length];
  const startX = 10 + (index / (total - 1)) * 80;
  const ref = useRef(null);

  useEffect(() => {
    if (!falling) return;
    const timeout = setTimeout(() => {
      if (onMiss) onMiss();
    }, speed);
    return () => clearTimeout(timeout);
  }, [falling, speed, onMiss, problemKey]);

  return (
    <button
      ref={ref}
      onClick={() => onSelect(choice)}
      style={{
        position: "absolute",
        left: `${startX}%`,
        top: falling ? "0%" : "-18%",
        transform: "translate(-50%, 0)",
        animation: falling ? `asteroidFall ${speed}ms linear forwards` : "none",
        background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88, ${color}44)`,
        border: `3px solid ${color}`,
        borderRadius: "50%",
        width: "72px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "28px",
        fontWeight: "900",
        color: "#fff",
        fontFamily: "'Press Start 2P', monospace",
        textShadow: `0 0 10px ${color}, 0 0 20px ${color}88`,
        boxShadow: `0 0 15px ${color}66, inset 0 0 15px ${color}33`,
        transition: "transform 0.1s",
        zIndex: 10,
        WebkitTapHighlightColor: "transparent",
      }}
      onPointerDown={(e) => { e.currentTarget.style.transform = "translate(-50%, 0) scale(0.9)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "translate(-50%, 0) scale(1)"; }}
    >
      {choice}
    </button>
  );
}

function Ship({ shake, lives }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontSize: "48px",
          filter: `drop-shadow(0 0 12px ${lives <= 1 ? "#FF6B6B" : "#4ECDC4"})`,
          animation: shake ? "shipShake 0.4s ease-out" : "shipFloat 3s ease-in-out infinite",
          lineHeight: 1,
        }}
      >
        🚀
      </div>
      {/* Shield / lives display */}
      <div style={{ marginTop: "6px", display: "flex", gap: "4px", justifyContent: "center" }}>
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <div
            key={i}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: i < lives
                ? (lives <= 1 ? "#FF6B6B" : "#4ECDC4")
                : "#333366",
              boxShadow: i < lives ? `0 0 6px ${lives <= 1 ? "#FF6B6B" : "#4ECDC4"}88` : "none",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function LaserBeam({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: "absolute", bottom: "17%", left: "50%", transform: "translateX(-50%)",
      width: "4px", height: "40%",
      background: "linear-gradient(to top, #4ECDC4, #4ECDC400)",
      animation: "laserFire 0.3s ease-out forwards",
      zIndex: 4, borderRadius: "2px",
      boxShadow: "0 0 8px #4ECDC4, 0 0 16px #4ECDC488",
    }} />
  );
}

function ScreenFlash({ color }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none",
      background: color,
      animation: "flashFade 0.4s ease-out forwards",
    }} />
  );
}

function HUD({ score, streak, timeLeft, combo, lives }) {
  const pct = (timeLeft / GAME_DURATION) * 100;
  const barColor = pct > 50 ? "#4ECDC4" : pct > 25 ? "#FFE66D" : "#FF6B6B";
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      padding: "12px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      zIndex: 20, fontFamily: "'Press Start 2P', monospace",
      background: "linear-gradient(to bottom, #0a0a2eee, #0a0a2e00)",
    }}>
      <div style={{ color: "#FFE66D", fontSize: "14px", textShadow: "0 0 8px #FFE66D88" }}>
        ⭐ {score}
      </div>
      <div style={{ flex: 1, margin: "0 12px", height: "8px", background: "#1a1a4e", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: barColor,
          borderRadius: "4px", transition: "width 1s linear, background 0.5s",
          boxShadow: `0 0 8px ${barColor}88`,
        }} />
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {streak >= 3 && (
          <span style={{ color: "#FF6B6B", fontSize: "10px", animation: "pulse 0.6s ease-in-out infinite" }}>
            🔥x{combo}
          </span>
        )}
        <span style={{ color: "#A78BFA", fontSize: "12px" }}>{timeLeft}s</span>
      </div>
    </div>
  );
}

// ─── SCREENS ────────────────────────────────────────────────────────

function TitleScreen({ onStart, onExit, soundOn, setSoundOn }) {
  const [selected, setSelected] = useState("easy");
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", textAlign: "center", padding: "20px", zIndex: 10, position: "relative",
    }}>
      {/* Sound toggle */}
      <button
        onClick={() => { audio.init(); audio.resume(); setSoundOn(!soundOn); if (!soundOn) audio.menuSelect(); }}
        style={{
          position: "absolute", top: 16, right: 16, background: "none", border: "none",
          fontSize: "24px", cursor: "pointer", opacity: soundOn ? 1 : 0.4,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {soundOn ? "🔊" : "🔇"}
      </button>

      <div style={{
        fontSize: "20px", fontFamily: "'Press Start 2P', monospace",
        color: "#FFE66D", textShadow: "0 0 20px #FFE66D88, 0 0 40px #FFE66D44",
        lineHeight: 1.8, marginBottom: "8px", animation: "titleGlow 2s ease-in-out infinite",
      }}>
        NUMBER<br />BLASTERS
      </div>
      <div style={{ fontSize: "56px", marginBottom: "24px", animation: "shipFloat 3s ease-in-out infinite", filter: "drop-shadow(0 0 16px #4ECDC4)" }}>
        🚀
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: "9px",
        color: "#A78BFA", marginBottom: "28px", letterSpacing: "2px",
      }}>
        BLAST THE RIGHT ANSWER!
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap", justifyContent: "center" }}>
        {Object.entries(DIFFICULTIES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => {
              setSelected(key);
              if (soundOn) { audio.init(); audio.resume(); audio.menuSelect(); }
            }}
            style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: "10px",
              padding: "10px 14px", borderRadius: "8px",
              border: selected === key ? "2px solid #4ECDC4" : "2px solid #333366",
              background: selected === key ? "#4ECDC422" : "#1a1a4e44",
              color: selected === key ? "#4ECDC4" : "#666699",
              cursor: "pointer", transition: "all 0.2s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {config.emoji} {config.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart(selected)}
        style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "14px",
          padding: "16px 32px", borderRadius: "12px",
          border: "2px solid #4ECDC4",
          background: "linear-gradient(135deg, #4ECDC422, #4ECDC411)",
          color: "#4ECDC4", cursor: "pointer",
          textShadow: "0 0 10px #4ECDC488",
          boxShadow: "0 0 20px #4ECDC433",
          animation: "pulse 2s ease-in-out infinite",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        LAUNCH!
      </button>

      {onExit && (
        <button
          onClick={() => { audio.stopMusic(); onExit(); }}
          style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: "9px",
            padding: "10px 20px", borderRadius: "8px", marginTop: "16px",
            border: "2px solid #666699", background: "#66669922", color: "#666699",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}
        >
          ← GALAXY
        </button>
      )}
    </div>
  );
}

function ResultsScreen({ score, correct, total, lives, onRestart, onMenu, onExit, soundOn }) {
  const survived = lives > 0;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const grade = !survived
    ? { label: "SHIP DOWN!", color: "#FF6B6B", emoji: "💥" }
    : pct >= 90 ? { label: "LEGENDARY!", color: "#FFE66D", emoji: "🏆" }
    : pct >= 70 ? { label: "AWESOME!", color: "#4ECDC4", emoji: "⭐" }
    : pct >= 50 ? { label: "NICE TRY!", color: "#A78BFA", emoji: "👍" }
    : { label: "KEEP GOING!", color: "#FF6B6B", emoji: "💪" };

  useEffect(() => {
    if (!soundOn) return;
    audio.init(); audio.resume();
    if (survived && pct >= 70) audio.victory();
    else audio.gameOver();
  }, [survived, pct, soundOn]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", textAlign: "center", padding: "20px", zIndex: 10, position: "relative",
    }}>
      <div style={{ fontSize: "56px", marginBottom: "12px", animation: "titleGlow 1.5s ease-in-out infinite" }}>
        {grade.emoji}
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: "18px",
        color: grade.color, textShadow: `0 0 20px ${grade.color}88`, marginBottom: "28px",
      }}>
        {grade.label}
      </div>

      <div style={{
        background: "#1a1a4e88", borderRadius: "16px", padding: "20px 28px",
        marginBottom: "28px", border: "1px solid #333366",
        fontFamily: "'Press Start 2P', monospace",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        <div style={{ color: "#FFE66D", fontSize: "22px" }}>⭐ {score}</div>
        <div style={{ color: "#4ECDC4", fontSize: "11px" }}>
          {correct}/{total} correct ({pct}%)
        </div>
        {survived && (
          <div style={{ color: "#A78BFA", fontSize: "9px" }}>
            {lives === MAX_LIVES ? "PERFECT SHIELDS!" : `${lives} shield${lives !== 1 ? "s" : ""} remaining`}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onRestart}
          style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: "11px",
            padding: "14px 20px", borderRadius: "10px",
            border: "2px solid #4ECDC4", background: "#4ECDC422", color: "#4ECDC4",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}
        >
          AGAIN!
        </button>
        <button
          onClick={onMenu}
          style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: "11px",
            padding: "14px 20px", borderRadius: "10px",
            border: "2px solid #A78BFA", background: "#A78BFA22", color: "#A78BFA",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}
        >
          MENU
        </button>
        {onExit && (
          <button
            onClick={onExit}
            style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: "11px",
              padding: "14px 20px", borderRadius: "10px",
              border: "2px solid #666699", background: "#66669922", color: "#666699",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}
          >
            ← GALAXY
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MAIN GAME ──────────────────────────────────────────────────────

export default function NumberBlasters({ onExit }) {
  const [screen, setScreen] = useState("title");
  const [difficulty, setDifficulty] = useState("easy");
  const [problem, setProblem] = useState(null);
  const [problemKey, setProblemKey] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [laser, setLaser] = useState(false);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(null);
  const [falling, setFalling] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const timerRef = useRef(null);
  const answeredRef = useRef(false);
  const gameActiveRef = useRef(false);

  const nextProblem = useCallback((diff) => {
    answeredRef.current = false;
    setFalling(false);
    setTimeout(() => {
      setProblem(generateProblem(diff || difficulty));
      setProblemKey((k) => k + 1);
      setFalling(true);
    }, 350);
  }, [difficulty]);

  const endGame = useCallback((remainingLives) => {
    gameActiveRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    audio.stopMusic();
    setScreen("results");
    setLives(remainingLives);
  }, []);

  const startGame = (diff) => {
    if (soundOn) { audio.init(); audio.resume(); audio.menuSelect(); }
    setDifficulty(diff);
    setScore(0);
    setStreak(0);
    setCombo(1);
    setCorrect(0);
    setTotal(0);
    setLives(MAX_LIVES);
    setTimeLeft(GAME_DURATION);
    setScreen("game");
    gameActiveRef.current = true;
    nextProblem(diff);

    if (soundOn) audio.startMusic();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setLives((l) => {
            endGame(l);
            return l;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audio.stopMusic();
    };
  }, []);

  // Asteroid reaches the ship
  const handleMiss = useCallback(() => {
    if (answeredRef.current || !gameActiveRef.current) return;
    answeredRef.current = true;
    if (soundOn) audio.asteroidImpact();
    setShake(true);
    setFlash("#FF6B6B33");
    setStreak(0);
    setCombo(1);
    setTotal((t) => t + 1);
    setFeedback({ text: "IMPACT!", color: "#FF6B6B" });

    setTimeout(() => setShake(false), 400);
    setTimeout(() => setFlash(null), 400);
    setTimeout(() => setFeedback(null), 1000);

    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        setTimeout(() => endGame(0), 600);
        return next;
      }
      nextProblem();
      return next;
    });
  }, [soundOn, nextProblem, endGame]);

  const handleSelect = (choice) => {
    if (screen !== "game" || !problem || answeredRef.current || !gameActiveRef.current) return;
    answeredRef.current = true;
    setTotal((t) => t + 1);

    if (choice === problem.answer) {
      const newStreak = streak + 1;
      const newCombo = newStreak >= 10 ? 4 : newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
      const points = 100 * newCombo;

      if (soundOn) {
        audio.correctHit();
        if (newCombo > combo) audio.comboUp();
      }

      setStreak(newStreak);
      setCombo(newCombo);
      setScore((s) => s + points);
      setCorrect((c) => c + 1);
      setLaser(true);
      setFeedback({ text: `+${points}`, color: "#4ECDC4" });

      setTimeout(() => setLaser(false), 300);
      setTimeout(() => setFeedback(null), 800);
      nextProblem();
    } else {
      if (soundOn) audio.wrongHit();
      setStreak(0);
      setCombo(1);
      setShake(true);
      setFeedback({ text: `= ${problem.answer}`, color: "#FF6B6B" });
      setTimeout(() => setShake(false), 400);
      setTimeout(() => setFeedback(null), 1200);
      nextProblem();
    }
  };

  return (
    <div style={{
      width: "100%", height: "100vh",
      background: "linear-gradient(180deg, #0a0a2e 0%, #1a0a3e 50%, #0a1a3e 100%)",
      position: "relative", overflow: "hidden",
      touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes shipFloat { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-8px); } }
        @keyframes shipShake { 0%, 100% { transform: translateX(-50%); } 20% { transform: translateX(calc(-50% - 6px)); } 40% { transform: translateX(calc(-50% + 6px)); } 60% { transform: translateX(calc(-50% - 4px)); } 80% { transform: translateX(calc(-50% + 4px)); } }
        @keyframes asteroidFall { 0% { top: -18%; } 100% { top: 72%; } }
        @keyframes laserFire { 0% { opacity: 1; height: 0; } 50% { opacity: 1; height: 40%; } 100% { opacity: 0; height: 40%; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes titleGlow { 0%, 100% { text-shadow: 0 0 20px #FFE66D88, 0 0 40px #FFE66D44; } 50% { text-shadow: 0 0 30px #FFE66Dcc, 0 0 60px #FFE66D66; } }
        @keyframes feedbackPop { 0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; } 30% { transform: translate(-50%, 0) scale(1.3); opacity: 1; } 100% { transform: translate(-50%, -40px) scale(1); opacity: 0; } }
        @keyframes problemPulse { 0%, 100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-50%, 0) scale(1.05); } }
        @keyframes flashFade { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes warningPulse { 0%, 100% { border-color: transparent; } 50% { border-color: #FF6B6B44; } }
      `}</style>

      <Starfield />
      {flash && <ScreenFlash color={flash} />}

      {screen === "title" && <TitleScreen onStart={startGame} onExit={onExit} soundOn={soundOn} setSoundOn={setSoundOn} />}

      {screen === "game" && problem && (
        <>
          <HUD score={score} streak={streak} timeLeft={timeLeft} combo={combo} lives={lives} />

          <div style={{
            position: "absolute", top: "15%", left: "50%",
            transform: "translate(-50%, 0)",
            fontFamily: "'Press Start 2P', monospace", fontSize: "28px",
            color: "#fff", textShadow: "0 0 16px #A78BFA88",
            zIndex: 15, animation: "problemPulse 2s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}>
            {problem.a} {problem.op} {problem.b} = ?
          </div>

          <div style={{ position: "absolute", top: "28%", left: 0, right: 0, height: "50%" }}>
            {problem.choices.map((c, i) => (
              <Asteroid
                key={`${problemKey}-${c}-${i}`}
                choice={c}
                onSelect={handleSelect}
                onMiss={handleMiss}
                index={i}
                total={problem.choices.length}
                falling={falling}
                speed={DIFFICULTIES[difficulty].speed}
                problemKey={problemKey}
              />
            ))}
          </div>

          {feedback && (
            <div style={{
              position: "absolute", top: "45%", left: "50%",
              transform: "translate(-50%, 0)",
              fontFamily: "'Press Start 2P', monospace", fontSize: "24px",
              color: feedback.color, textShadow: `0 0 12px ${feedback.color}88`,
              animation: "feedbackPop 0.8s ease-out forwards",
              zIndex: 30, pointerEvents: "none",
            }}>
              {feedback.text}
            </div>
          )}

          <LaserBeam active={laser} />
          <Ship shake={shake} lives={lives} />

          {/* Low shields warning border */}
          {lives <= 1 && (
            <div style={{
              position: "fixed", inset: 0, border: "3px solid transparent",
              animation: "warningPulse 1s ease-in-out infinite",
              pointerEvents: "none", zIndex: 25, borderRadius: "4px",
            }} />
          )}
        </>
      )}

      {screen === "results" && (
        <ResultsScreen
          score={score} correct={correct} total={total} lives={lives}
          onRestart={() => startGame(difficulty)}
          onMenu={() => { audio.stopMusic(); setScreen("title"); }}
          onExit={onExit ? () => { audio.stopMusic(); onExit(); } : null}
          soundOn={soundOn}
        />
      )}
    </div>
  );
}

