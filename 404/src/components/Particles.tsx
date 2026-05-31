import { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export function Particles({ mousePos }: { mousePos: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mousePosRef = useRef(mousePos);

  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let lastMouse = { x: 0, y: 0 };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mp = mousePosRef.current;
      const dx = mp.x - lastMouse.x;
      const dy = mp.y - lastMouse.y;
      const moving = Math.abs(dx) + Math.abs(dy) > 2;
      lastMouse = { ...mp };

      if (moving && particles.current.length < 80) {
        for (let i = 0; i < 2; i++) {
          particles.current.push({
            x: mp.x,
            y: mp.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0,
            maxLife: 40 + Math.random() * 30,
            size: Math.random() * 3 + 1,
            hue: 260 + Math.random() * 60,
          });
        }
      }

      particles.current = particles.current.filter((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) return false;

        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[5]"
    />
  );
}
