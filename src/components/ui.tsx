import { ReactNode, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Deck } from "../lib/orbit";

// ---------- logo -------------------------------------------------------------
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden>
        <circle cx="24" cy="24" r="6.5" fill="#f6c453" />
        <circle cx="24" cy="24" r="6.5" fill="url(#lg)" opacity="0.55" />
        <g className="animate-orbit" style={{ transformOrigin: "24px 24px" }}>
          <ellipse cx="24" cy="24" rx="20" ry="8.5" stroke="#3fd8c2" strokeWidth="1.6" transform="rotate(-24 24 24)" />
          <circle cx="41" cy="17" r="2.6" fill="#3fd8c2" />
        </g>
        <g className="animate-orbit-slow" style={{ transformOrigin: "24px 24px" }}>
          <ellipse cx="24" cy="24" rx="15" ry="19" stroke="#8f93f8" strokeWidth="1.2" opacity="0.8" transform="rotate(30 24 24)" />
          <circle cx="12" cy="36" r="2" fill="#8f93f8" />
        </g>
        <defs>
          <radialGradient id="lg" cx="0.3" cy="0.3" r="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#f59e42" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </span>
  );
}

// ---------- scroll reveal ----------------------------------------------------
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ---------- animated counter -------------------------------------------------
export function CountUp({ to, suffix = "", duration = 900 }: { to: number; suffix?: string; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span>
      {v}
      {suffix}
    </span>
  );
}

// ---------- hue map ----------------------------------------------------------
export const hueStyles: Record<Deck["hue"], { dot: string; text: string; ring: string; soft: string }> = {
  gold: { dot: "bg-gold", text: "text-gold", ring: "border-gold/40", soft: "bg-gold/10" },
  teal: { dot: "bg-teal", text: "text-teal", ring: "border-teal/40", soft: "bg-teal/10" },
  iris: { dot: "bg-iris", text: "text-iris", ring: "border-iris/40", soft: "bg-iris/10" },
  rose: { dot: "bg-rose", text: "text-rose", ring: "border-rose/40", soft: "bg-rose/10" },
};

// ---------- modal ------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`panel relative w-full ${wide ? "max-w-2xl" : "max-w-md"} animate-pop p-6`}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-fog">{title}</h3>
          <button
            onClick={onClose}
            className="btn-press rounded-lg p-1.5 text-mist hover:bg-panel-2 hover:text-fog"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- field ------------------------------------------------------------
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mist">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-ink-2/70 px-3.5 py-2.5 text-sm text-fog placeholder:text-dim outline-none transition focus:border-teal/60 focus:ring-2 focus:ring-teal/20";
