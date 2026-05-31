import { useRef, useEffect } from "react";

export function Portal({ onNavigate }: { onNavigate: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    const SIZE = 280;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const animate = () => {
      t += 0.02;
      ctx.clearRect(0, 0, SIZE, SIZE);

      for (let ring = 6; ring >= 0; ring--) {
        const r = 20 + ring * 18;
        const alpha = 0.15 + ring * 0.08;
        const hue = (270 + ring * 25 + t * 30) % 360;

        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.02) {
          const wobble = Math.sin(a * 3 + t * 2 + ring) * 4;
          const px = cx + Math.cos(a + t * (0.5 + ring * 0.1)) * (r + wobble);
          const py = cy + Math.sin(a + t * (0.5 + ring * 0.1)) * (r + wobble);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${hue}, 80%, 65%, 0.5)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Center glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
      grad.addColorStop(0, `hsla(${(280 + t * 20) % 360}, 90%, 80%, 0.8)`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="cursor-pointer rounded-full"
        onClick={onNavigate}
        style={{ filter: "drop-shadow(0 0 30px rgba(139, 92, 246, 0.4))" }}
      />
      <p className="animate-pulse text-sm text-purple-300/70">
        Click the portal to enter...
      </p>
    </div>
  );
}
