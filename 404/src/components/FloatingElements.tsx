import { useEffect, useRef } from "react";

const ORB_CONFIGS = [
  { size: 300, color: "rgba(102, 126, 234, 0.4)", top: "10%", left: "10%" },
  { size: 400, color: "rgba(118, 75, 162, 0.4)", top: "70%", left: "80%" },
  { size: 250, color: "rgba(79, 172, 254, 0.4)", top: "50%", left: "5%" },
  { size: 350, color: "rgba(240, 147, 251, 0.4)", top: "20%", left: "85%" },
];

export function FloatingElements() {
  const orbsRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate orbs
    if (orbsRef.current) {
      ORB_CONFIGS.forEach((cfg, i) => {
        const orb = document.createElement("div");
        orb.className = "orb";
        orb.style.width = cfg.size + "px";
        orb.style.height = cfg.size + "px";
        orb.style.background = cfg.color;
        orb.style.top = cfg.top;
        orb.style.left = cfg.left;
        orb.style.setProperty("--duration", 10 + i * 2 + "s");
        orb.style.setProperty("--tx-start", "0px");
        orb.style.setProperty("--ty-start", "0px");
        orb.style.setProperty("--tx-end", Math.random() * 100 - 50 + "px");
        orb.style.setProperty("--ty-end", Math.random() * 100 - 50 + "px");
        orbsRef.current!.appendChild(orb);
      });
    }

    // Generate shapes
    if (shapesRef.current) {
      for (let i = 0; i < 5; i++) {
        const shape = document.createElement("div");
        shape.className = "floating-shape";
        const size = Math.random() * 200 + 100;
        shape.style.width = size + "px";
        shape.style.height = size + "px";
        shape.style.top = Math.random() * 100 + "%";
        shape.style.left = Math.random() * 100 + "%";
        shape.style.setProperty("--duration", 15 + Math.random() * 10 + "s");
        shape.style.setProperty("--tx-start", "0px");
        shape.style.setProperty("--ty-start", "0px");
        shape.style.setProperty("--tx-end", Math.random() * 200 - 100 + "px");
        shape.style.setProperty("--ty-end", Math.random() * 200 - 100 + "px");
        shape.style.animationDelay = Math.random() * 5 + "s";
        shapesRef.current!.appendChild(shape);
      }
    }

    // Generate lines
    if (linesRef.current) {
      for (let i = 0; i < 8; i++) {
        const line = document.createElement("div");
        line.className = "glow-line";
        line.style.width = Math.random() * 500 + 300 + "px";
        line.style.top = Math.random() * 100 + "%";
        line.style.left = Math.random() * 100 + "%";
        line.style.setProperty("--duration", 3 + Math.random() * 4 + "s");
        line.style.animationDelay = Math.random() * 5 + "s";
        line.style.transform = `rotate(${Math.random() * 360}deg)`;
        linesRef.current!.appendChild(line);
      }
    }

    // Generate ambient particles
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (ambientRef.current) {
      function createAmbientParticle() {
        if (!ambientRef.current) return;
        const particle = document.createElement("div");
        particle.className = "ambient-particle";
        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";
        const dur = 5 + Math.random() * 5;
        particle.style.setProperty("--duration", dur + "s");
        particle.style.setProperty("--tx", Math.random() * 400 - 200 + "px");
        particle.style.setProperty("--ty", Math.random() * 400 - 200 + "px");
        ambientRef.current.appendChild(particle);
        const t = setTimeout(() => {
          particle.remove();
          createAmbientParticle();
        }, dur * 1000);
        timers.push(t);
      }

      for (let i = 0; i < 30; i++) {
        const t = setTimeout(() => createAmbientParticle(), Math.random() * 3000);
        timers.push(t);
      }
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <div ref={orbsRef} />
      <div ref={shapesRef} />
      <div ref={linesRef} />
      <div ref={ambientRef} />
    </>
  );
}
