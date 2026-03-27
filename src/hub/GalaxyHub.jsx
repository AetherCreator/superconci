import { useState, useEffect, useCallback, useRef } from "react";
import NumberBlasters from "../NumberBlasters";
import hubAudio from "./HubAudio";

const STAR_COUNT = 80;

const PLANETS = [
  {
    id: "number-blasters",
    name: "Number Blasters",
    emoji: "🚀",
    locked: false,
    x: 22,
    y: 25,
    size: 90,
    color: "#ff6b35",
    glowColor: "#ff4500",
  },
  {
    id: "word-quest",
    name: "Word Quest",
    emoji: "📖",
    locked: true,
    x: 65,
    y: 45,
    size: 85,
    color: "#7c6f9c",
    glowColor: "#5a4f7a",
  },
  {
    id: "nature-lab",
    name: "Nature Lab",
    emoji: "🔬",
    locked: true,
    x: 35,
    y: 72,
    size: 85,
    color: "#6b7c8c",
    glowColor: "#4a5a6a",
  },
];

// Generate stars once — 60% small, 30% medium, 10% large
function generateStars() {
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const roll = Math.random();
    let size, tier;
    if (roll < 0.6) {
      size = 1 + Math.random() * 1;
      tier = "small";
    } else if (roll < 0.9) {
      size = 2.5 + Math.random() * 1.5;
      tier = "medium";
    } else {
      size = 4.5 + Math.random() * 2;
      tier = "large";
    }

    const colorRoll = Math.random();
    let color;
    if (colorRoll < 0.6) color = "#ffffff";
    else if (colorRoll < 0.8) color = "#b8d4ff";
    else if (colorRoll < 0.95) color = "#fff5c0";
    else color = "#ffc8e0";

    const twinkleDuration = 2 + Math.random() * 4;
    const twinkleDelay = Math.random() * 5;

    stars.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size,
      tier,
      color,
      twinkleDuration,
      twinkleDelay,
      baseOpacity: tier === "large" ? 0.9 : tier === "medium" ? 0.7 : 0.5,
    });
  }
  return stars;
}

export default function GalaxyHub() {
  const [stars] = useState(generateStars);
  const [activeGame, setActiveGame] = useState(null); // "number-blasters" or null
  const [launching, setLaunching] = useState(false); // launch animation state
  const [toast, setToast] = useState(null); // "Coming Soon" toast
  const audioStarted = useRef(false);

  // Start ambient music on first tap anywhere in the hub
  const ensureAudio = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;
    hubAudio.init();
    hubAudio.resume();
    hubAudio.startMusic();
  }, []);

  // Resume ambient music when returning from game
  useEffect(() => {
    if (activeGame === null && audioStarted.current) {
      hubAudio.init();
      hubAudio.resume();
      hubAudio.startMusic();
    }
  }, [activeGame]);

  const handlePlanetTap = useCallback((planet) => {
    if (launching) return;
    ensureAudio();

    if (planet.locked) {
      hubAudio.planetLocked();
      setToast("🔒 Coming Soon!");
      setTimeout(() => setToast(null), 1500);
      return;
    }

    // Active planet tap sound + launch
    hubAudio.planetSelect();
    setLaunching(true);
    setTimeout(() => {
      hubAudio.stopMusic();
      setActiveGame(planet.id);
      setLaunching(false);
    }, 400);
  }, [launching, ensureAudio]);

  const handleExit = useCallback(() => {
    setActiveGame(null);
    hubAudio.welcomeBack();
  }, []);

  // If a game is active, render it full-screen
  if (activeGame === "number-blasters") {
    return <NumberBlasters onExit={handleExit} />;
  }

  return (
    <div style={styles.space} onClick={ensureAudio}>
      <style>{animationCSS}</style>

      {/* Starfield layer */}
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            backgroundColor: star.color,
            boxShadow:
              star.tier === "large"
                ? `0 0 ${star.size * 2}px ${star.color}40, 0 0 ${star.size * 4}px ${star.color}20`
                : star.tier === "medium"
                  ? `0 0 ${star.size}px ${star.color}30`
                  : "none",
            "--base-opacity": star.baseOpacity,
            opacity: star.baseOpacity,
            animation: `twinkle ${star.twinkleDuration}s ease-in-out ${star.twinkleDelay}s infinite`,
            animationFillMode: "both",
          }}
        />
      ))}

      {/* Rocket — Coci's ship, floating in space */}
      <div
        style={{
          ...styles.rocketContainer,
          animation: launching
            ? "rocketLaunch 0.4s ease-in forwards"
            : "rocketFloat 3s ease-in-out infinite",
        }}
      >
        <div style={styles.rocketBody}>
          <div style={styles.rocketNose} />
          <div style={styles.rocketHull}>
            <div style={styles.rocketWindow}>
              <div style={styles.rocketWindowShine} />
            </div>
          </div>
          <div style={styles.rocketFins}>
            <div style={{ ...styles.fin, ...styles.finLeft }} />
            <div style={styles.finCenter} />
            <div style={{ ...styles.fin, ...styles.finRight }} />
          </div>
        </div>
        <div style={styles.exhaustContainer}>
          <div className="exhaust-flame flame-1" />
          <div className="exhaust-flame flame-2" />
          <div className="exhaust-flame flame-3" />
        </div>
      </div>

      {/* Planets layer */}
      {PLANETS.map((planet) => (
        <div
          key={planet.id}
          onClick={() => handlePlanetTap(planet)}
          style={{
            position: "absolute",
            left: `${planet.x}%`,
            top: `${planet.y}%`,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {/* Planet body */}
          <div
            style={{
              width: planet.size,
              height: planet.size,
              borderRadius: "50%",
              background: planet.locked
                ? `radial-gradient(circle at 35% 35%, ${planet.color}80, ${planet.color}30)`
                : `radial-gradient(circle at 35% 35%, ${planet.color}, ${planet.glowColor})`,
              border: planet.locked
                ? `2px solid ${planet.color}40`
                : `3px solid ${planet.color}cc`,
              boxShadow: planet.locked
                ? "none"
                : `0 0 20px ${planet.glowColor}80, 0 0 40px ${planet.glowColor}40, 0 0 60px ${planet.glowColor}20, inset 0 0 20px ${planet.color}40`,
              opacity: planet.locked ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: planet.locked ? 24 : 32,
              animation: planet.locked ? "none" : "planetPulse 2s ease-in-out infinite",
              position: "relative",
            }}
          >
            {planet.locked ? "🔒" : planet.emoji}
          </div>

          {/* Planet name */}
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              color: planet.locked ? "#555566" : planet.color,
              textAlign: "center",
              textShadow: planet.locked
                ? "none"
                : `0 0 8px ${planet.glowColor}80`,
              letterSpacing: 1,
              maxWidth: 120,
              opacity: planet.locked ? 0.6 : 1,
            }}
          >
            {planet.name}
          </div>

          {/* LOCKED label */}
          {planet.locked && (
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 6,
                color: "#444455",
                letterSpacing: 2,
              }}
            >
              LOCKED
            </div>
          )}
        </div>
      ))}

      {/* Toast notification */}
      {toast && (
        <div style={styles.toast}>
          {toast}
        </div>
      )}
    </div>
  );
}

const animationCSS = `
@keyframes twinkle {
  0%, 100% { opacity: var(--base-opacity, 0.5); }
  50% { opacity: 0.15; }
}
@keyframes planetPulse {
  0%, 100% { box-shadow: 0 0 20px #ff450080, 0 0 40px #ff450040, 0 0 60px #ff450020, inset 0 0 20px #ff6b3540; }
  50% { box-shadow: 0 0 30px #ff4500a0, 0 0 55px #ff450060, 0 0 80px #ff450030, inset 0 0 25px #ff6b3560; }
}
@keyframes rocketFloat {
  0%, 100% { transform: translateX(-50%) translateY(0px); }
  50% { transform: translateX(-50%) translateY(-8px); }
}
@keyframes rocketLaunch {
  0% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
  100% { transform: translateX(-50%) translateY(-120vh) scale(0.3); opacity: 0; }
}
@keyframes flameFlicker1 {
  0%, 100% { height: 12px; opacity: 0.9; }
  25% { height: 18px; opacity: 1; }
  50% { height: 10px; opacity: 0.7; }
  75% { height: 16px; opacity: 0.85; }
}
@keyframes flameFlicker2 {
  0%, 100% { height: 16px; opacity: 0.8; }
  30% { height: 10px; opacity: 0.6; }
  60% { height: 20px; opacity: 1; }
  80% { height: 14px; opacity: 0.75; }
}
@keyframes flameFlicker3 {
  0%, 100% { height: 10px; opacity: 0.7; }
  40% { height: 14px; opacity: 0.9; }
  70% { height: 8px; opacity: 0.5; }
}
@keyframes toastIn {
  0% { transform: translate(-50%, 20px); opacity: 0; }
  20% { transform: translate(-50%, 0); opacity: 1; }
  80% { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -10px); opacity: 0; }
}
.exhaust-flame {
  border-radius: 0 0 50% 50%;
  position: absolute;
  bottom: 0;
}
.flame-1 {
  width: 6px;
  height: 14px;
  background: linear-gradient(to bottom, #ffaa00, #ff4400, transparent);
  left: 50%;
  transform: translateX(-50%);
  animation: flameFlicker1 0.4s ease-in-out infinite;
}
.flame-2 {
  width: 4px;
  height: 10px;
  background: linear-gradient(to bottom, #ffcc00, #ff6600, transparent);
  left: calc(50% - 6px);
  animation: flameFlicker2 0.35s ease-in-out infinite;
}
.flame-3 {
  width: 4px;
  height: 10px;
  background: linear-gradient(to bottom, #ffcc00, #ff6600, transparent);
  left: calc(50% + 2px);
  animation: flameFlicker3 0.45s ease-in-out infinite;
}
`;

const styles = {
  space: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "#0a0a0f",
    overflow: "hidden",
  },
  rocketContainer: {
    position: "absolute",
    left: "50%",
    top: "52%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "rocketFloat 3s ease-in-out infinite",
    zIndex: 10,
  },
  rocketBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    filter: "drop-shadow(0 0 8px #66bbff40)",
  },
  rocketNose: {
    width: 0,
    height: 0,
    borderLeft: "12px solid transparent",
    borderRight: "12px solid transparent",
    borderBottom: "20px solid #ee3344",
  },
  rocketHull: {
    width: 24,
    height: 36,
    background: "linear-gradient(135deg, #e8e8f0, #c0c0d0, #a8a8b8)",
    borderLeft: "2px solid #ccccdd",
    borderRight: "2px solid #999aaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rocketWindow: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, #66ddff, #2288cc)",
    border: "2px solid #88ccee",
    position: "relative",
    overflow: "hidden",
  },
  rocketWindowShine: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: "50%",
    backgroundColor: "#ffffff90",
    top: 2,
    left: 2,
  },
  rocketFins: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    position: "relative",
    width: 40,
    height: 14,
  },
  fin: {
    width: 0,
    height: 0,
    position: "absolute",
    bottom: 0,
  },
  finLeft: {
    borderTop: "14px solid transparent",
    borderRight: "10px solid #cc2233",
    left: 2,
  },
  finRight: {
    borderTop: "14px solid transparent",
    borderLeft: "10px solid #cc2233",
    right: 2,
  },
  finCenter: {
    width: 24,
    height: 6,
    background: "linear-gradient(to bottom, #c0c0d0, #888899)",
    margin: "0 auto",
  },
  exhaustContainer: {
    position: "relative",
    width: 24,
    height: 24,
    marginTop: -2,
  },
  toast: {
    position: "fixed",
    bottom: "15%",
    left: "50%",
    transform: "translateX(-50%)",
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 10,
    color: "#aaaacc",
    background: "#1a1a2eee",
    border: "2px solid #333355",
    borderRadius: 12,
    padding: "12px 24px",
    zIndex: 100,
    animation: "toastIn 1.5s ease-out forwards",
    whiteSpace: "nowrap",
  },
};

