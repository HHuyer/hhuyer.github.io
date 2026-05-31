import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

const COLORS = [
  "102, 126, 234",
  "118, 75, 162",
  "79, 172, 254",
  "240, 147, 251",
];

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 2 + 1,
    speedX: Math.random() * 0.5 - 0.25,
    speedY: Math.random() * 0.5 - 0.25,
    opacity: Math.random() * 0.5 + 0.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = Array.from({ length: 80 }, () =>
      createParticle(canvas.width, canvas.height)
    );

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      particlesRef.current.forEach((p) => {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const angle = Math.atan2(dy, dx);
          const force = (100 - dist) / 100;
          p.x += Math.cos(angle) * force * 2;
          p.y += Math.sin(angle) * force * 2;
        }
      });
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousemove", handleMouseMove);

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          Object.assign(p, createParticle(canvas.width, canvas.height));
        }

        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(${p.color}, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connect nearby particles
      ctx.shadowBlur = 0;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(102, 126, 234, ${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} id="particles-canvas" />;
}
