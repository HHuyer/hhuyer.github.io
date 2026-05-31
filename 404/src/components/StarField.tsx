import { useRef, useEffect } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  size: number;
  brightness: number;
}

export function StarField({ isWarping }: { isWarping: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const warpRef = useRef(false);

  useEffect(() => {
    warpRef.current = isWarping;
  }, [isWarping]);

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

    const STAR_COUNT = 400;
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        prevZ: 0,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }
    stars.forEach((s) => (s.prevZ = s.z));
    starsRef.current = stars;

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const speed = warpRef.current ? 60 : 2;

      ctx.fillStyle = "rgba(10, 10, 46, 0.2)";
      ctx.fillRect(0, 0, w, h);

      for (const star of stars) {
        star.prevZ = star.z;
        star.z -= speed;
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * w * 2;
          star.y = (Math.random() - 0.5) * h * 2;
          star.z = w;
          star.prevZ = w;
        }

        const sx = (star.x / star.z) * w * 0.5 + cx;
        const sy = (star.y / star.z) * h * 0.5 + cy;

        if (warpRef.current) {
          const px = (star.x / star.prevZ) * w * 0.5 + cx;
          const py = (star.y / star.prevZ) * h * 0.5 + cy;
          const alpha = Math.min(1, (1 - star.z / w) * 1.5);
          ctx.strokeStyle = `rgba(180, 160, 255, ${alpha})`;
          ctx.lineWidth = star.size * (1 - star.z / w) * 3;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          const r = star.size * (1 - star.z / w) * 2;
          const alpha = star.brightness * (1 - star.z / w);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.2, r), 0, Math.PI * 2);
          ctx.fill();
        }
      }

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
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
