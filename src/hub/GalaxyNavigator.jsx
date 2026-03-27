import { useCallback, useState, useEffect, useRef } from "react";
import useRocket from "./useRocket";
import useWorld from "./useWorld";
import Joystick from "./Joystick";
import QuickNav from "./QuickNav";
import NumberBlasters from "../NumberBlasters";
import hubAudio from "./HubAudio";

const PLANETS = [
  {
    id: "number-blasters",
    name: "Number Blasters",
    emoji: "🚀",
    locked: false,
    worldX: 2800,
    worldY: 2200,
    size: 90,
    color: "#ff6b35",
    glowColor: "#ff4500",
  },
  {
    id: "word-quest",
    name: "Word Quest",
    emoji: "📖",
    locked: true,
    worldX: 1200,
    worldY: 3800,
    size: 85,
    color: "#7c6f9c",
    glowColor: "#5a4f7a",
  },
  {
    id: "nature-lab",
    name: "Nature Lab",
    emoji: "🔬",
    locked: true,
    worldX: 4200,
    worldY: 1400,
    size: 85,
    color: "#4a7c59",
    glowColor: "#2d5a3a",
  },
];

const PROXIMITY_RANGE = 120;
const CULL_RANGE = 800;
const DWELL_TIME = 1500;
const MAX_TRAIL_PARTICLES = 8;

function generateStarLayers() {
  const layers = [
    { count: 60, size: 1, parallax: 0.1, label: "far" },
    { count: 40, size: 2, parallax: 0.3, label: "mid" },
    { count: 20, size: 3.5, parallax: 0.6, label: "near" },
  ];
  const colors = ["#ffffff", "#ffffff", "#ffffff", "#aaddff", "#aaddff", "#fffaaa"];
  return layers.map((layer) => {
    const stars = [];
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        id: i,
        baseX: Math.random() * 2000 - 500,
        baseY: Math.random() * 2000 - 500,
        size: layer.size + (Math.random() - 0.5) * (layer.size * 0.4),
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.3 + Math.random() * 0.7,
      });
    }
    return { ...layer, stars };
  });
}

const STAR_LAYERS = generateStarLayers();

function torusDist(rx, ry, px, py) {
  let dx = px - rx;
  let dy = py - ry;
  if (dx > 2500) dx -= 5000;
  if (dx < -2500) dx += 5000;
  if (dy > 2500) dy -= 5000;
  if (dy < -2500) dy += 5000;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function GalaxyNavigator() {
  const rocket = useRocket();
  const { worldToScreen, applyWrap } = useWorld(rocket._stateRef);
  const [, forceRender] = useState(0);
  const renderRafRef = useRef(null);

  // Game state
  const [activeGame, setActiveGame] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);

  // Dwell tracking
  const dwellRef = useRef({ planetId: null, startTime: null, lastBeep: -1 });
  const [dwellProgress, setDwellProgress] = useState(null);

  // Proximity tracking for chime (fire once per enter)
  const proximityEnteredRef = useRef(new Set());

  // Warp effect
  const [warpActive, setWarpActive] = useState(false);
  const prevPosRef = useRef({ x: 2500, y: 2500 });

  // Exhaust trail particles
  const trailRef = useRef([]);
  const [trailParticles, setTrailParticles] = useState([]);

  // Audio init on first interaction
  const audioStarted = useRef(false);
  const ensureAudio = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;
    hubAudio.init();
    hubAudio.resume();
    hubAudio.startMusic();
  }, []);

  const handleJoystick = useCallback(
    (input) => {
      ensureAudio();
      rocket.setInput(input);
      // Engine sound
      const mag = Math.sqrt(input.x * input.x + input.y * input.y);
      if (mag > 0.1) {
        const speed = Math.sqrt(
          rocket._stateRef.current.vx ** 2 + rocket._stateRef.current.vy ** 2
        );
        hubAudio.startEngine(speed);
      } else {
        hubAudio.stopEngine();
      }
    },
    [rocket.setInput, ensureAudio, rocket._stateRef]
  );

  const handleNavigate = useCallback(
    (planet) => {
      ensureAudio();
      rocket.startAutopilot(planet.worldX, planet.worldY);
    },
    [rocket.startAutopilot, ensureAudio]
  );

  const handleExit = useCallback(() => {
    setActiveGame(null);
    rocket.resume();
    hubAudio.init();
    hubAudio.resume();
    hubAudio.startMusic();
    hubAudio.welcomeBack();
  }, [rocket]);

  // Main render + dwell + audio + trail loop
  useEffect(() => {
    if (activeGame) return;

    let active = true;
    let trailCounter = 0;
    const tick = () => {
      if (!active) return;
      const s = rocket._stateRef.current;
      const prevX = prevPosRef.current.x;
      const prevY = prevPosRef.current.y;

      applyWrap();

      // Detect warp (position jumps > 1000 in one frame = wrap happened)
      const jumpX = Math.abs(s.x - prevX);
      const jumpY = Math.abs(s.y - prevY);
      if (jumpX > 1000 || jumpY > 1000) {
        setWarpActive(true);
        if (audioStarted.current) hubAudio.warpShimmer();
        setTimeout(() => setWarpActive(false), 200);
      }
      prevPosRef.current = { x: s.x, y: s.y };

      // Exhaust trail
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (speed > 0.5) {
        trailCounter++;
        if (trailCounter % 3 === 0) {
          const trail = trailRef.current;
          trail.push({
            id: Date.now() + Math.random(),
            x: s.x,
            y: s.y,
            born: performance.now(),
            size: 2 + speed * 0.5,
          });
          if (trail.length > MAX_TRAIL_PARTICLES) trail.shift();
        }
      }
      // Age out trail particles
      const now = performance.now();
      trailRef.current = trailRef.current.filter((p) => now - p.born < 300);
      setTrailParticles([...trailRef.current]);

      // Dwell detection
      let closestUnlocked = null;
      for (const p of PLANETS) {
        if (p.locked) continue;
        const d = torusDist(s.x, s.y, p.worldX, p.worldY);
        if (d < PROXIMITY_RANGE) {
          closestUnlocked = p;
          break;
        }
      }

      // Proximity chime (once per entry)
      for (const p of PLANETS) {
        const d = torusDist(s.x, s.y, p.worldX, p.worldY);
        const wasIn = proximityEnteredRef.current.has(p.id);
        if (d < PROXIMITY_RANGE && !wasIn) {
          proximityEnteredRef.current.add(p.id);
          if (audioStarted.current) hubAudio.proximityChime(!p.locked);
        } else if (d >= PROXIMITY_RANGE && wasIn) {
          proximityEnteredRef.current.delete(p.id);
        }
      }

      const dw = dwellRef.current;
      if (closestUnlocked) {
        if (dw.planetId !== closestUnlocked.id) {
          dw.planetId = closestUnlocked.id;
          dw.startTime = performance.now();
          dw.lastBeep = -1;
        }
        const elapsed = performance.now() - dw.startTime;
        const fraction = Math.min(elapsed / DWELL_TIME, 1);
        setDwellProgress({ planetId: closestUnlocked.id, fraction });

        // Countdown beeps
        const beepStep = fraction < 0.33 ? 0 : fraction < 0.66 ? 1 : 2;
        if (beepStep > dw.lastBeep && fraction < 1) {
          dw.lastBeep = beepStep;
          if (audioStarted.current) hubAudio.countdownBeep(beepStep);
        }

        if (fraction >= 1 && !launching) {
          setLaunching(true);
          setFlashVisible(true);
          if (audioStarted.current) hubAudio.launchWhoosh();
          hubAudio.stopEngine();
          hubAudio.stopMusic();
          setTimeout(() => setFlashVisible(false), 150);
          setTimeout(() => {
            rocket.pause();
            setActiveGame(closestUnlocked.id);
            setLaunching(false);
            setDwellProgress(null);
            dw.planetId = null;
            dw.startTime = null;
            dw.lastBeep = -1;
          }, 600);
        }
      } else {
        if (dw.planetId !== null) {
          dw.planetId = null;
          dw.startTime = null;
          dw.lastBeep = -1;
          setDwellProgress(null);
        }
      }

      forceRender((n) => n + 1);
      renderRafRef.current = requestAnimationFrame(tick);
    };
    renderRafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (renderRafRef.current) cancelAnimationFrame(renderRafRef.current);
    };
  }, [activeGame, applyWrap, rocket, launching, ensureAudio]);

  // If a game is active, render it full-screen
  if (activeGame === "number-blasters") {
    return <NumberBlasters onExit={handleExit} />;
  }

  const sw = window.innerWidth;
  const sh = window.innerHeight;

  const getCountdownText = (planetId) => {
    if (!dwellProgress || dwellProgress.planetId !== planetId) return null;
    const f = dwellProgress.fraction;
    if (f < 0.33) return "3";
    if (f < 0.66) return "2";
    if (f < 1) return "1";
    return "🚀";
  };

  const now = performance.now();

  return (
    <div style={styles.space} onClick={ensureAudio}>
      {/* Parallax starfield layers */}
      {STAR_LAYERS.map((layer) => (
        <div key={layer.label} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {layer.stars.map((star) => {
            const ox = ((star.baseX - rocket.x * layer.parallax) % sw + sw) % sw;
            const oy = ((star.baseY - rocket.y * layer.parallax) % sh + sh) % sh;
            return (
              <div
                key={star.id}
                style={{
                  position: "absolute",
                  left: ox,
                  top: oy,
                  width: star.size,
                  height: star.size,
                  borderRadius: "50%",
                  backgroundColor: star.color,
                  opacity: star.opacity,
                  boxShadow:
                    star.size > 2.5
                      ? `0 0 ${star.size * 2}px ${star.color}40`
                      : "none",
                }}
              />
            );
          })}
        </div>
      ))}

      {/* Exhaust trail particles */}
      {trailParticles.map((p) => {
        const screen = worldToScreen(p.x, p.y);
        const age = (now - p.born) / 300; // 0 to 1
        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: screen.x,
              top: screen.y,
              width: p.size * (1 - age * 0.5),
              height: p.size * (1 - age * 0.5),
              borderRadius: "50%",
              background: `radial-gradient(circle, #ffaa00${Math.round((1 - age) * 200).toString(16).padStart(2, "0")}, #ff4400${Math.round((1 - age) * 100).toString(16).padStart(2, "0")})`,
              opacity: 1 - age,
              pointerEvents: "none",
              zIndex: 8,
            }}
          />
        );
      })}

      {/* Planets layer */}
      {PLANETS.map((planet) => {
        const screenPos = worldToScreen(planet.worldX, planet.worldY);
        const distFromCenter = Math.sqrt(
          (screenPos.x - sw / 2) ** 2 + (screenPos.y - sh / 2) ** 2
        );
        if (distFromCenter > CULL_RANGE) return null;

        const s = rocket._stateRef.current;
        const worldDist = torusDist(s.x, s.y, planet.worldX, planet.worldY);
        const inProximity = worldDist < PROXIMITY_RANGE;
        const countdown = getCountdownText(planet.id);

        // Approach glow: intensifies from PROXIMITY_RANGE to 0
        const approachFactor = inProximity
          ? 1 - worldDist / PROXIMITY_RANGE
          : 0;
        const extraGlow = !planet.locked && approachFactor > 0
          ? `0 0 ${30 + approachFactor * 40}px ${planet.glowColor}${Math.round(128 + approachFactor * 127).toString(16)}, 0 0 ${60 + approachFactor * 60}px ${planet.glowColor}${Math.round(64 + approachFactor * 100).toString(16)}`
          : "";

        return (
          <div
            key={planet.id}
            style={{
              position: "absolute",
              left: screenPos.x,
              top: screenPos.y,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              zIndex: 5,
            }}
          >
            {/* Proximity ring */}
            {inProximity && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: planet.size / 2,
                  width: planet.size + 30,
                  height: planet.size + 30,
                  borderRadius: "50%",
                  border: planet.locked
                    ? "2px dashed #555566"
                    : "2px dashed #ffcc88",
                  boxShadow: planet.locked
                    ? "none"
                    : "0 0 15px #ff880040, inset 0 0 15px #ff880020",
                  animation: "proximityPulse 0.8s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}
            {/* Countdown text */}
            {countdown && !planet.locked && (
              <div
                style={{
                  position: "absolute",
                  top: -24,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 14,
                  color: "#ffcc44",
                  textShadow: "0 0 10px #ffaa00",
                  zIndex: 20,
                }}
              >
                {countdown}
              </div>
            )}
            {/* Locked proximity text */}
            {inProximity && planet.locked && (
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  color: "#666677",
                  whiteSpace: "nowrap",
                }}
              >
                🔒 LOCKED
              </div>
            )}
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
                  : extraGlow || `0 0 20px ${planet.glowColor}80, 0 0 40px ${planet.glowColor}40, 0 0 60px ${planet.glowColor}20, inset 0 0 20px ${planet.color}40`,
                opacity: planet.locked ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: planet.locked ? 24 : 32,
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
        );
      })}

      {/* Rocket — always screen center */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) rotate(${rocket.rotation + 90}deg) scale(${launching ? 1.3 : 1}) scaleX(${warpActive ? 2 : 1})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          filter: "drop-shadow(0 0 8px #66bbff40)",
          zIndex: 10,
          transition: launching
            ? "transform 0.6s ease-in"
            : warpActive
              ? "transform 0.15s ease-out"
              : "none",
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

      {/* Launch flash */}
      {flashVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "white",
            opacity: 0.8,
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}

      <QuickNav
        planets={PLANETS}
        autopilotTarget={rocket.autopilotTarget}
        onNavigate={handleNavigate}
      />

      <Joystick onMove={handleJoystick} />

      <style>{flameCSS}</style>
    </div>
  );
}

const flameCSS = `
@keyframes proximityPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
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
.exhaust-flame {
  border-radius: 0 0 50% 50%;
  position: absolute;
  bottom: 0;
}
.flame-1 {
  width: 6px; height: 14px;
  background: linear-gradient(to bottom, #ffaa00, #ff4400, transparent);
  left: 50%; transform: translateX(-50%);
  animation: flameFlicker1 0.4s ease-in-out infinite;
}
.flame-2 {
  width: 4px; height: 10px;
  background: linear-gradient(to bottom, #ffcc00, #ff6600, transparent);
  left: calc(50% - 6px);
  animation: flameFlicker2 0.35s ease-in-out infinite;
}
.flame-3 {
  width: 4px; height: 10px;
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
  rocketBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
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
};
