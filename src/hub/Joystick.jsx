import { useState, useRef, useCallback, useEffect } from "react";

export default function Joystick({ onMove }) {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const outerRef = useRef(null);
  const dragging = useRef(false);
  const centerRef = useRef({ x: 0, y: 0 });

  const OUTER_SIZE = 100;
  const KNOB_SIZE = 44;
  const MAX_DIST = (OUTER_SIZE - KNOB_SIZE) / 2;

  const getCenter = useCallback(() => {
    if (!outerRef.current) return { x: 0, y: 0 };
    const rect = outerRef.current.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const handleInput = useCallback(
    (clientX, clientY) => {
      const center = centerRef.current;
      let dx = clientX - center.x;
      let dy = clientY - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > MAX_DIST) {
        dx = (dx / dist) * MAX_DIST;
        dy = (dy / dist) * MAX_DIST;
      }
      setKnobPos({ x: dx, y: dy });
      onMove({ x: dx / MAX_DIST, y: dy / MAX_DIST });
    },
    [MAX_DIST, onMove]
  );

  const release = useCallback(() => {
    dragging.current = false;
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  // Touch events
  const onTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      dragging.current = true;
      centerRef.current = getCenter();
      const t = e.touches[0];
      handleInput(t.clientX, t.clientY);
    },
    [getCenter, handleInput]
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      const t = e.touches[0];
      handleInput(t.clientX, t.clientY);
    },
    [handleInput]
  );

  const onTouchEnd = useCallback(() => release(), [release]);

  // Mouse events (for dev/testing)
  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      dragging.current = true;
      centerRef.current = getCenter();
      handleInput(e.clientX, e.clientY);
    },
    [getCenter, handleInput]
  );

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      handleInput(e.clientX, e.clientY);
    };
    const onMouseUp = () => {
      if (dragging.current) release();
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleInput, release]);

  return (
    <div
      ref={outerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        width: OUTER_SIZE,
        height: OUTER_SIZE,
        borderRadius: "50%",
        background: "rgba(10, 10, 30, 0.6)",
        border: "2px solid rgba(100, 120, 200, 0.4)",
        boxShadow: "inset 0 0 12px rgba(80, 100, 180, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 35%, rgba(120, 140, 220, 0.7), rgba(60, 70, 130, 0.5))",
          border: "2px solid rgba(130, 150, 230, 0.5)",
          boxShadow: "0 0 8px rgba(100, 120, 220, 0.3)",
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: dragging.current ? "none" : "transform 0.15s ease-out",
        }}
      />
    </div>
  );
}
