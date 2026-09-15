import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
  hue: string;
}

const HUES = ["234,238,252", "63,216,194", "246,196,83", "143,147,248"];

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const seed = () => {
      const count = Math.min(170, Math.floor((w * h) / 11000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.4,
        base: Math.random() * 0.5 + 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.4 + 0.5,
        hue: HUES[Math.floor(Math.random() * HUES.length)],
      }));
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;
      for (const s of stars) {
        const tw = s.base + Math.sin(time * s.speed + s.phase) * 0.28;
        const a = Math.max(0.05, Math.min(1, tw));
        ctx.beginPath();
        ctx.arc(s.x, (s.y + time * 2.2) % h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue},${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}
