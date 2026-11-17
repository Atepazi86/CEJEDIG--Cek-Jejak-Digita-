import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

const PARTICLE_COLORS = [
  '56, 189, 248', // sky-400
  '129, 140, 248', // indigo-400
  '192, 132, 252', // purple-400
  '52, 211, 153', // emerald-400
];

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrameId = 0;

    const mouse = { x: -9999, y: -9999 };

    const updateSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    const particleCount = Math.min(55, Math.max(24, Math.floor((width * height) / 28000)));
    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: 1.2 + Math.random() * 1.8,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      alpha: 0.35 + Math.random() * 0.45,
    }));

    const drawWaves = (t: number) => {
      const waveConfigs = [
        {
          baseY: height * 0.32,
          amp: 44,
          freq: 0.0026,
          speed: 0.00075,
          colors: ['rgba(56,189,248,0)', 'rgba(56,189,248,0.22)', 'rgba(129,140,248,0.22)', 'rgba(192,132,252,0)'],
          lineWidth: 2,
        },
        {
          baseY: height * 0.38,
          amp: 58,
          freq: 0.0021,
          speed: -0.00055,
          colors: ['rgba(192,132,252,0)', 'rgba(192,132,252,0.18)', 'rgba(56,189,248,0.18)', 'rgba(52,211,153,0)'],
          lineWidth: 1.5,
        },
        {
          baseY: height * 0.72,
          amp: 36,
          freq: 0.003,
          speed: 0.0006,
          colors: ['rgba(52,211,153,0)', 'rgba(56,189,248,0.14)', 'rgba(129,140,248,0.14)', 'rgba(56,189,248,0)'],
          lineWidth: 1.25,
        },
      ];

      for (const wave of waveConfigs) {
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, wave.colors[0]);
        grad.addColorStop(0.3, wave.colors[1]);
        grad.addColorStop(0.7, wave.colors[2]);
        grad.addColorStop(1, wave.colors[3]);

        ctx.beginPath();
        for (let x = 0; x <= width; x += 18) {
          const y =
            wave.baseY +
            Math.sin(x * wave.freq + t * wave.speed) * wave.amp +
            Math.cos(x * wave.freq * 0.6 - t * wave.speed * 1.3) * (wave.amp * 0.45);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = wave.lineWidth;
        ctx.stroke();
      }
    };

    const renderFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      drawWaves(time);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        // Draw connecting constellation lines
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 145;
          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Subtle mouse link
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq < 180 * 180) {
          const mAlpha = (1 - Math.sqrt(mDistSq) / 180) * 0.32;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${mAlpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', updateSize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050608]"
    >
      {/* Floating Aurora Orbs */}
      <motion.div
        className="absolute -top-28 left-[12%] h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-[110px] will-change-transform"
        animate={{
          x: [0, 80, -40, 0],
          y: [0, 45, -25, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-[10%] right-[10%] h-[28rem] w-[32rem] rounded-full bg-indigo-500/20 blur-[115px] will-change-transform"
        animate={{
          x: [0, -85, 45, 0],
          y: [0, -35, 55, 0],
          scale: [1, 0.9, 1.12, 1],
        }}
        transition={{
          duration: 17,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-[-8rem] left-[35%] h-[26rem] w-[34rem] rounded-full bg-purple-500/15 blur-[120px] will-change-transform"
        animate={{
          x: [0, 60, -60, 0],
          y: [0, -45, 20, 0],
          scale: [1, 1.1, 0.92, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Live 60fps Particle Constellation & Luminous Flowing Waves */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};
