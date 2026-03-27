import { useCallback, useRef } from "react";

const WORLD_SIZE = 5000;

export default function useWorld(rocketStateRef) {
  const screenRef = useRef({ width: window.innerWidth, height: window.innerHeight });

  // Wrap a value into [0, WORLD_SIZE) range
  const wrap = useCallback((val) => {
    return ((val % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE;
  }, []);

  // Apply wrap to rocket position (mutates the stateRef directly)
  const applyWrap = useCallback(() => {
    const s = rocketStateRef.current;
    s.x = wrap(s.x);
    s.y = wrap(s.y);
  }, [rocketStateRef, wrap]);

  // Convert world coords to screen coords (relative to rocket-centered camera)
  const worldToScreen = useCallback(
    (worldX, worldY) => {
      const s = rocketStateRef.current;
      const sw = screenRef.current.width;
      const sh = screenRef.current.height;

      // Find shortest path on torus
      let dx = worldX - s.x;
      let dy = worldY - s.y;

      // Wrap delta to [-WORLD_SIZE/2, WORLD_SIZE/2]
      if (dx > WORLD_SIZE / 2) dx -= WORLD_SIZE;
      if (dx < -WORLD_SIZE / 2) dx += WORLD_SIZE;
      if (dy > WORLD_SIZE / 2) dy -= WORLD_SIZE;
      if (dy < -WORLD_SIZE / 2) dy += WORLD_SIZE;

      return {
        x: sw / 2 + dx,
        y: sh / 2 + dy,
      };
    },
    [rocketStateRef]
  );

  return { worldToScreen, applyWrap, wrap, WORLD_SIZE };
}

export { WORLD_SIZE };
