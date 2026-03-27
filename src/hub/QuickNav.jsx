export default function QuickNav({ planets, autopilotTarget, onNavigate }) {
  return (
    <div style={styles.strip}>
      {planets.map((planet) => {
        const isTarget =
          autopilotTarget &&
          autopilotTarget.x === planet.worldX &&
          autopilotTarget.y === planet.worldY;

        return (
          <div
            key={planet.id}
            onClick={() => onNavigate(planet)}
            style={{
              ...styles.item,
              opacity: planet.locked ? 0.5 : 1,
              border: isTarget
                ? "2px solid #ffcc44"
                : "2px solid transparent",
              boxShadow: isTarget
                ? "0 0 10px #ffcc4480, inset 0 0 6px #ffcc4430"
                : "none",
            }}
          >
            <span style={{ fontSize: 18 }}>
              {planet.locked ? "🔒" : planet.emoji}
            </span>
            <span
              style={{
                ...styles.name,
                color: planet.locked ? "#555566" : planet.color,
              }}
            >
              {planet.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  strip: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "rgba(10, 10, 30, 0.7)",
    borderBottom: "1px solid rgba(100, 120, 200, 0.25)",
    zIndex: 50,
    padding: "0 12px",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "4px 12px",
    borderRadius: 8,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  name: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 6,
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  },
};
