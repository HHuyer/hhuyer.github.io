import { useState, useEffect, useCallback, useRef } from "react";
import { StarField } from "./components/StarField";
import { FloatingAstronaut } from "./components/FloatingAstronaut";
import { GlitchText } from "./components/GlitchText";
import { Portal } from "./components/Portal";
import { Particles } from "./components/Particles";
import Gate from "./components/Gate";

const funnyMessages = [
  "Looks like this page took a wrong turn at the Milky Way \u{1F30C}",
  "Houston, we have a problem... this page doesn't exist \u{1F680}",
  "This page is on vacation in another dimension \u{1F300}",
  "404: Page not found, but you found something cool! \u2728",
  "The page you're looking for is in another castle \u{1F3F0}",
  "This page went to get milk and never came back \u{1F95B}",
  "Even Google can't find this page \u{1F50D}",
  "This page has been abducted by aliens \u{1F47D}",
  "Error 404: Page went to space without a helmet \u{1FA90}",
  "The internet hamster powering this page fell asleep \u{1F439}",
];

export function App() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showPortal, setShowPortal] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGate, setShowGate] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % funnyMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handle404Click = () => {
    setClickCount((c) => c + 1);
    if (clickCount >= 9) {
      setEasterEgg(true);
      setTimeout(() => setEasterEgg(false), 3000);
      setClickCount(0);
    }
  };

  const handleShowGate = () => {
    setShowGate(true);
  };

  const handleGateEnter = () => {
    setIsNavigating(true);
    setTimeout(() => {
      window.location.href = "/index";
    }, 2500);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0a0a2e] via-[#16163a] to-[#0d0d2b] text-white select-none"
    >
      <StarField isWarping={isNavigating} />
      <Particles mousePos={mousePos} />

      {showGate && !isNavigating && (
        <Gate onEnter={handleGateEnter} />
      )}

      <div
        className={`transition-all duration-1000 ease-in-out ${
          isNavigating
            ? "opacity-0 scale-150 blur-sm"
            : showGate
              ? "opacity-30 blur-sm pointer-events-none"
              : "opacity-100 scale-100"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-1/4 h-64 w-64 animate-pulse rounded-full bg-purple-600/20 blur-3xl" />
          <div
            className="absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
            style={{ animation: "pulse 4s ease-in-out infinite" }}
          />
          <div
            className="absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full bg-pink-600/10 blur-3xl"
            style={{ animation: "pulse 6s ease-in-out infinite" }}
          />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <FloatingAstronaut />

          <div className="mb-2 mt-4 cursor-pointer" onClick={handle404Click}>
            <GlitchText text="404" />
          </div>

          {easterEgg && (
            <div className="mb-4 animate-bounce rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 text-sm font-bold text-black shadow-lg shadow-yellow-500/30">
              {"\u{1F389}"} You found the easter egg! You're persistent! {"\u{1F95A}"}
            </div>
          )}

          <div className="mb-8 h-8 overflow-hidden">
            <p
              key={messageIndex}
              className="text-center text-lg font-medium text-purple-200/90 md:text-xl"
              style={{ animation: "fadeSlideIn 0.5s ease-out" }}
            >
              {funnyMessages[messageIndex]}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleShowGate}
              disabled={showGate}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10">{"\u{1F3E0}"} Take Me Home</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => setShowPortal(!showPortal)}
              disabled={showGate}
              className="group relative overflow-hidden rounded-xl border-2 border-cyan-500/50 bg-cyan-950/30 px-8 py-3 font-semibold text-cyan-300 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-cyan-400 hover:bg-cyan-900/40 hover:text-white hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10">
                {showPortal ? "\u{1F300} Close Portal" : "\u{1F300} Show Me a Portal"}
              </span>
            </button>
          </div>

          {showPortal && <Portal onNavigate={handleShowGate} />}

          <div className="mt-8 text-center text-xs text-white/30">
            <p>Click the 404 text {10 - clickCount} more times for a surprise {"\u{1F440}"}</p>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-white/20">
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono">{"\u2191"}</kbd>
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono">{"\u2193"}</kbd>
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono">{"\u2190"}</kbd>
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono">{"\u2192"}</kbd>
              <span>or</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono">W</kbd>
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono">A</kbd>
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono">S</kbd>
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono">D</kbd>
            </div>
            <span>Move the astronaut with keys or drag it around! {"\u{1F680}"}</span>
          </div>
        </div>
      </div>

      <div
        className={`pointer-events-none fixed inset-0 z-[100] bg-white transition-opacity duration-500 ease-in ${
          isNavigating ? "opacity-100 delay-[1.5s]" : "opacity-0"
        }`}
      />
    </div>
  );
}
