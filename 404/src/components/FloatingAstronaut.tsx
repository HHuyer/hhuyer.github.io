import { useState, useEffect, useCallback, useRef } from "react";

export function FloatingAstronaut() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const keys = useRef(new Set<string>());
  const animRef = useRef<number>();
  const floatPhase = useRef(Math.random() * Math.PI * 2);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keys.current.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keys.current.delete(e.key.toLowerCase());
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const step = () => {
      const k = keys.current;
      const accel = 0.8;
      if (k.has("arrowup") || k.has("w")) velocity.current.y -= accel;
      if (k.has("arrowdown") || k.has("s")) velocity.current.y += accel;
      if (k.has("arrowleft") || k.has("a")) velocity.current.x -= accel;
      if (k.has("arrowright") || k.has("d")) velocity.current.x += accel;

      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;

      floatPhase.current += 0.02;

      setPos((p) => ({
        x: p.x + velocity.current.x,
        y: p.y + velocity.current.y + Math.sin(floatPhase.current) * 0.3,
      }));

      setRotation((r) => {
        const target = velocity.current.x * 2;
        return r + (target - r) * 0.05;
      });

      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const nx = e.clientX - dragStart.current.x;
      const ny = e.clientY - dragStart.current.y;
      velocity.current = { x: (nx - pos.x) * 0.3, y: (ny - pos.y) * 0.3 };
      setPos({ x: nx, y: ny });
    };
    const handleMouseUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pos]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="cursor-grab active:cursor-grabbing select-none"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg)`,
        transition: dragging.current ? "none" : "transform 0.05s linear",
      }}
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Helmet */}
        <circle cx="60" cy="42" r="24" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <circle cx="60" cy="42" r="18" fill="#1e293b" />
        <ellipse cx="54" cy="38" rx="4" ry="5" fill="#60a5fa" opacity="0.6" />

        {/* Body */}
        <rect x="40" y="62" width="40" height="32" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />

        {/* Backpack */}
        <rect x="72" y="66" width="12" height="24" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />

        {/* Arms */}
        <rect x="24" y="66" width="18" height="8" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" transform="rotate(-15 33 70)" />
        <rect x="78" y="66" width="18" height="8" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" transform="rotate(15 87 70)" />

        {/* Legs */}
        <rect x="44" y="90" width="10" height="18" rx="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" transform="rotate(-10 49 99)" />
        <rect x="66" y="90" width="10" height="18" rx="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" transform="rotate(10 71 99)" />

        {/* Visor reflection */}
        <path d="M50 34 Q60 30 68 36" stroke="rgba(147,197,253,0.5)" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}
