'use client';

import { useEffect, useRef } from 'react';

interface CausticsBackgroundProps {
  className?: string;
}

export function CausticsBackground({ className = '' }: CausticsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Simplex-like noise function
    const noise = (x: number, y: number, t: number): number => {
      const n1 = Math.sin(x * 0.01 + t) * Math.cos(y * 0.012 + t * 0.8);
      const n2 = Math.sin(x * 0.008 - t * 0.6) * Math.cos(y * 0.009 + t * 1.2);
      const n3 = Math.sin((x + y) * 0.005 + t * 0.4) * 0.5;
      return (n1 + n2 + n3) / 3;
    };

    const draw = () => {
      time += 0.008;
      const width = canvas.width;
      const height = canvas.height;

      // Deep space background (cosmos theme: #0f172a)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw caustic light patterns
      const resolution = 6;

      for (let x = 0; x < width; x += resolution) {
        for (let y = 0; y < height; y += resolution) {
          const n1 = noise(x, y, time);
          const n2 = noise(x * 1.5, y * 1.5, time * 1.3);
          const n3 = noise(x * 0.5, y * 0.5, time * 0.7);

          let intensity = (n1 + n2 * 0.5 + n3 * 0.3) / 1.8;
          intensity = Math.pow(Math.max(0, intensity + 0.3), 3);

          const edgeFade = Math.min(1, x / 200, (width - x) / 200);
          const topFade = Math.min(1, (y + 100) / 300);
          intensity *= edgeFade * topFade * 0.15;

          if (intensity > 0.01) {
            // Cosmos theme colors: indigo (#6366f1) to purple (#a855f7)
            const hue = 240 + noise(x * 0.5, y * 0.5, time * 0.5) * 40;
            ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${intensity})`;
            ctx.fillRect(x, y, resolution, resolution);
          }
        }
      }

      // Larger, softer light pools
      for (let i = 0; i < 5; i++) {
        const px = width * (0.2 + 0.6 * noise(i * 100, 0, time * 0.3));
        const py = height * (0.2 + 0.6 * noise(0, i * 100, time * 0.25));
        const size = 200 + 100 * noise(i * 50, i * 50, time * 0.2);

        const gradient = ctx.createRadialGradient(px, py, 0, px, py, size);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.08)'); // Indigo-500
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)'); // Purple-500
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(px - size, py - size, size * 2, size * 2);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      aria-hidden="true"
    />
  );
}

