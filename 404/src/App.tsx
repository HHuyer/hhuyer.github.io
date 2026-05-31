import { useEffect, useRef, useCallback } from "react";
import { ParticleCanvas } from "./components/ParticleCanvas";
import { CustomCursor } from "./components/CustomCursor";
import { FloatingElements } from "./components/FloatingElements";

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = useCallback((x: number, y: number) => {
    const ripple = document.createElement("div");
    ripple.className = "ripple";
    ripple.style.left = x - 150 + "px";
    ripple.style.top = y - 150 + "px";
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (Math.random() > 0.95) {
        createRipple(e.clientX, e.clientY);
      }
    };
    const handleClick = (e: MouseEvent) => {
      createRipple(e.clientX, e.clientY);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("click", handleClick);
    };
  }, [createRipple]);

  useEffect(() => {
    const handleParallax = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
      const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
      if (containerRef.current) {
        containerRef.current.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
      }
    };
    document.addEventListener("mousemove", handleParallax);
    return () => document.removeEventListener("mousemove", handleParallax);
  }, []);

  return (
    <>
      {/* Background Layers */}
      <div className="gradient-bg" />
      <div className="mesh-gradient" />
      <div className="grid-bg" />
      <div className="scanline" />

      {/* Particle Canvas */}
      <ParticleCanvas />

      {/* Floating Elements (Orbs, Shapes, Lines, Ambient Particles) */}
      <FloatingElements />

      {/* Main Content */}
      <div className="main-container" ref={containerRef}>
        <div className="error-number glitch">404</div>
        <div className="glass-card">
          <div className="status-badge">
            <span className="status-dot" />
            ERROR
          </div>
          <h1 className="title">Page Not Found</h1>
          <p className="description">
            The page you're looking for seems to have vanished into the digital
            void.
            <br />
            Let's get you back on track.
          </p>
          <a href="/" className="modern-button">
            Return Home
          </a>
        </div>
      </div>

      {/* Custom Cursors */}
      <CustomCursor />
    </>
  );
}
