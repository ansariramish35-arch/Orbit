import { useEffect, useRef, useState } from "react";
import { Telescope } from "lucide-react";
import { Card, OrbitState, fmtInterval, isDue, mastery } from "../lib/orbit";
import { Reveal } from "./ui";

type Status = "new" | "learning" | "due" | "mature";

const statusOf = (c: Card): Status =>
  c.reps === 0 ? "new" : mastery(c) >= 1 ? "mature" : isDue(c) ? "due" : "learning";

const COLORS: Record<Status, string> = {
  new: "141,151,186",
  learning: "63,216,194",
  due: "251,113,133",
  mature: "246,196,83",
};

const LABEL: Record<Status, string> = {
  new: "Uncharted",
  learning: "In learning",
  due: "Needs review",
  mature: "Mastered",
};

export default function Constellation({ state }: { state: OrbitState }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; card: Card } | null>(null);
  const tipRef = useRef<typeof tip>(null);
  tipRef.current = tip;

  const counts = { new: 0, learning: 0, due: 0, mature: 0 } as Record<Status, number>;
  state.cards.forEach((c) => counts[statusOf(c)]++);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const hover = { x: -1, y: -1 };

    const resize = () => {
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pos = (c: Card, t: number, i: number) => ({
      x: c.x * w + Math.sin(t * 0.00014 + i * 1.3) * 6,
      y: c.y * h + Math.cos(t * 0.00011 + i * 2.1) * 6,
    });

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cards = state.cards;

      // links
      for (let i = 0; i < cards.length; i++) {
        const a = cards[i];
        const sa = statusOf(a);
        if (sa === "new" || sa === "due") continue;
        const pa = pos(a, t, i);
        for (let j = i + 1; j < cards.length; j++) {
          const b = cards[j];
          const sb = statusOf(b);
          if (sb === "new" || sb === "due") continue;
          const pb = pos(b, t, j);
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const d = Math.hypot(dx, dy);
          const max = Math.min(w, h) * 0.22;
          if (d < max) {
            const alpha = (1 - d / max) * (sa === "mature" && sb === "mature" ? 0.22 : 0.1);
            ctx.strokeStyle = `rgba(${sa === "mature" && sb === "mature" ? COLORS.mature : COLORS.learning},${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      // stars + hover detection
      let nearest: { card: Card; x: number; y: number; d: number } | null = null;
      cards.forEach((c, i) => {
        const s = statusOf(c);
        const p = pos(c, t, i);
        const m = mastery(c);
        const r = 2 + m * 3.4 + (s === "due" ? Math.sin(t * 0.006) * 1.2 + 1.2 : 0);
        const tw = 0.7 + Math.sin(t * 0.002 + i * 2.4) * 0.3;
        const col = COLORS[s];

        if (s === "mature") {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
          g.addColorStop(0, `rgba(${col},0.35)`);
          g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${s === "new" ? 0.55 * tw : tw})`;
        ctx.fill();

        if (s === "due") {
          ctx.strokeStyle = `rgba(${col},${0.5 + Math.sin(t * 0.006) * 0.3})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        const hd = Math.hypot(hover.x - p.x, hover.y - p.y);
        if (hd < Math.max(14, r + 8) && (!nearest || hd < nearest.d)) nearest = { card: c, x: p.x, y: p.y, d: hd };
      });

      const n = nearest as { card: Card; x: number; y: number } | null;
      if (n) {
        const cur = tipRef.current;
        if (!cur || cur.card.id !== n.card.id) setTip({ x: n.x, y: n.y, card: n.card });
      } else if (tipRef.current) setTip(null);

      raf = requestAnimationFrame(draw);
    };

    const move = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      hover.x = e.clientX - rect.left;
      hover.y = e.clientY - rect.top;
    };
    const leave = () => {
      hover.x = -1;
      hover.y = -1;
    };

    resize();
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseleave", leave);
    };
  }, [state.cards]);

  if (state.cards.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-5 pt-16">
        <div className="panel flex flex-col items-start gap-3 p-10">
          <Telescope size={28} className="text-iris" />
          <h2 className="font-display text-xl font-bold text-fog">No stars yet</h2>
          <p className="text-sm text-mist">Add cards to any deck and they'll appear here as uncharted stars. Master them to light up the constellation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-fog">Knowledge constellation</h1>
            <p className="mt-1 text-sm text-mist">Every card is a star. Mastery makes it burn gold and link to what you already know.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LABEL) as Status[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold text-mist">
                <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${COLORS[s]})` }} />
                {LABEL[s]} · {counts[s]}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div ref={wrapRef} className="panel relative mt-6 h-[440px] overflow-hidden md:h-[520px]">
          <canvas ref={canvasRef} className="absolute inset-0" />
          {tip && (
            <div
              className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-xl border border-line bg-ink-2/95 p-3 shadow-xl"
              style={{ left: tip.x, top: Math.max(70, tip.y - 14), transform: "translate(-50%, -100%)" }}
            >
              <p className="line-clamp-2 text-xs font-semibold leading-snug text-fog">{tip.card.front}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                <span style={{ color: `rgb(${COLORS[statusOf(tip.card)]})` }}>{LABEL[statusOf(tip.card)]}</span>
                <span className="text-dim">next: {tip.card.reps === 0 ? "now" : fmtInterval(tip.card)}</span>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute bottom-4 left-4 text-[11px] font-semibold text-dim">
            hover a star to inspect · {state.cards.length} stars charted
          </div>
        </div>
      </Reveal>
    </div>
  );
}
