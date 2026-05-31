import { useState, useEffect } from "react";

export default function Gate({ onEnter }: { onEnter: () => void }) {
  const [scale, setScale] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setScale(1));
    const t = setTimeout(() => setPulse(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="flex flex-col items-center gap-8"
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Gate ring */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 260,
            height: 260,
          }}
        >
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #7c3aed, #3b82f6, #06b6d4, #8b5cf6, #ec4899, #7c3aed)",
              animation: "spin 4s linear infinite",
              filter: "blur(2px)",
            }}
          />
          {/* Inner cutout */}
          <div
            className="absolute rounded-full bg-[#0a0a2e]"
            style={{
              inset: 8,
              boxShadow: "inset 0 0 60px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.3)",
            }}
          />
          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <span className="text-4xl">{"\u{1F30C}"}</span>
            <button
              onClick={onEnter}
              className={`rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-violet-500/50 ${
                pulse ? "animate-pulse" : ""
              }`}
            >
              Enter Gate
            </button>
          </div>
        </div>

        <p className="text-sm text-violet-300/60">
          Step through to go home
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
