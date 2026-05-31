import { useEffect, useState } from "react";

export function GlitchText({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative select-none">
      <span
        className="text-[8rem] font-black leading-none md:text-[12rem]"
        style={{
          background: "linear-gradient(135deg, #a78bfa, #818cf8, #c084fc, #e879f9)",
          backgroundSize: "300% 300%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "gradientShift 6s ease infinite",
          filter: "drop-shadow(0 0 40px rgba(139, 92, 246, 0.5))",
        }}
      >
        {text}
      </span>

      {glitching && (
        <>
          <span
            className="absolute inset-0 text-[8rem] font-black leading-none md:text-[12rem]"
            style={{
              WebkitTextFillColor: "rgba(239,68,68,0.7)",
              clipPath: "inset(20% 0 30% 0)",
              transform: "translate(-4px, -2px)",
            }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 text-[8rem] font-black leading-none md:text-[12rem]"
            style={{
              WebkitTextFillColor: "rgba(59,130,246,0.7)",
              clipPath: "inset(50% 0 10% 0)",
              transform: "translate(4px, 2px)",
            }}
          >
            {text}
          </span>
        </>
      )}

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
