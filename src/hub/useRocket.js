import { useState, useRef, useCallback, useEffect } from "react";

// Physics constants
const THRUST = 0.15;
const DRAG = 0.98;
const MAX_SPEED = 4;
const AUTOPILOT_MAX_SPEED = 5.5;
const AUTOPILOT_THRUST = 0.25;
const AUTOPILOT_ARRIVAL = 150;
const WORLD_SIZE = 5000;
const START_X = 2500;
const START_Y = 2500;

function runTick(s, setAutopilotTarget) {
  const isAutopilot = s.autopilotX !== null;

  if (isAutopilot) {
    let dx = s.autopilotX - s.x;
    let dy = s.autopilotY - s.y;
    if (dx > WORLD_SIZE / 2) dx -= WORLD_SIZE;
    if (dx < -WORLD_SIZE / 2) dx += WORLD_SIZE;
    if (dy > WORLD_SIZE / 2) dy -= WORLD_SIZE;
    if (dy < -WORLD_SIZE / 2) dy += WORLD_SIZE;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < AUTOPILOT_ARRIVAL) {
      s.autopilotX = null;
      s.autopilotY = null;
      setAutopilotTarget(null);
    } else {
      const nx = dx / dist;
      const ny = dy / dist;
      s.vx += nx * AUTOPILOT_THRUST;
      s.vy += ny * AUTOPILOT_THRUST;

      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (speed > AUTOPILOT_MAX_SPEED) {
        s.vx = (s.vx / speed) * AUTOPILOT_MAX_SPEED;
        s.vy = (s.vy / speed) * AUTOPILOT_MAX_SPEED;
      }
    }
  } else {
    s.vx += s.inputX * THRUST;
    s.vy += s.inputY * THRUST;

    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    if (speed > MAX_SPEED) {
      s.vx = (s.vx / speed) * MAX_SPEED;
      s.vy = (s.vy / speed) * MAX_SPEED;
    }
  }

  // Drag
  s.vx *= DRAG;
  s.vy *= DRAG;

  if (Math.abs(s.vx) < 0.01 && Math.abs(s.vy) < 0.01) {
    s.vx = 0;
    s.vy = 0;
  }

  s.x += s.vx;
  s.y += s.vy;

  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  if (speed > 0.1) {
    s.rotation = Math.atan2(s.vy, s.vx) * (180 / Math.PI);
  }
}

export default function useRocket() {
  const [pos, setPos] = useState({ x: START_X, y: START_Y });
  const [rotation, setRotation] = useState(-90);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [autopilotTarget, setAutopilotTarget] = useState(null);

  const stateRef = useRef({
    x: START_X,
    y: START_Y,
    vx: 0,
    vy: 0,
    rotation: -90,
    inputX: 0,
    inputY: 0,
    autopilotX: null,
    autopilotY: null,
  });
  const rafRef = useRef(null);
  const activeRef = useRef(true);
  const pausedRef = useRef(false);

  // Shared tick loop starter
  const startLoop = useCallback(() => {
    const tick = () => {
      if (!activeRef.current || pausedRef.current) return;
      runTick(stateRef.current, setAutopilotTarget);
      setPos({ x: stateRef.current.x, y: stateRef.current.y });
      setRotation(stateRef.current.rotation);
      setVelocity({ x: stateRef.current.vx, y: stateRef.current.vy });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    startLoop();
  }, [startLoop]);

  const setInput = useCallback((input) => {
    const s = stateRef.current;
    s.inputX = input.x;
    s.inputY = input.y;
    if ((Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1) && s.autopilotX !== null) {
      s.autopilotX = null;
      s.autopilotY = null;
      setAutopilotTarget(null);
    }
  }, []);

  const startAutopilot = useCallback((worldX, worldY) => {
    stateRef.current.autopilotX = worldX;
    stateRef.current.autopilotY = worldY;
    setAutopilotTarget({ x: worldX, y: worldY });
  }, []);

  const cancelAutopilot = useCallback(() => {
    stateRef.current.autopilotX = null;
    stateRef.current.autopilotY = null;
    setAutopilotTarget(null);
  }, []);

  useEffect(() => {
    activeRef.current = true;
    startLoop();
    return () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startLoop]);

  return {
    x: pos.x,
    y: pos.y,
    rotation,
    velocityX: velocity.x,
    velocityY: velocity.y,
    autopilotTarget,
    setInput,
    startAutopilot,
    cancelAutopilot,
    pause,
    resume,
    _stateRef: stateRef,
  };
}

export { THRUST, DRAG, MAX_SPEED };
