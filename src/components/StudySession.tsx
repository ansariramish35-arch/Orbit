import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, X, RotateCcw, ArrowRight, PartyPopper } from "lucide-react";
import { Card, Grade, OrbitState, dueCards, fmtInterval, reviewCard } from "../lib/orbit";
import { hueStyles } from "./ui";

interface Props {
  state: OrbitState;
  commit: (card: Card, grade: Grade) => void;
  onClose: () => void;
  onExplore: () => void;
}

const GRADES: { g: Grade; label: string; key: string; cls: string }[] = [
  { g: 0, label: "Again", key: "1", cls: "border-rose/50 bg-rose/10 text-rose hover:bg-rose/20" },
  { g: 3, label: "Hard", key: "2", cls: "border-iris/50 bg-iris/10 text-iris hover:bg-iris/20" },
  { g: 4, label: "Good", key: "3", cls: "border-teal/50 bg-teal/10 text-teal hover:bg-teal/20" },
  { g: 5, label: "Easy", key: "4", cls: "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20" },
];

export default function StudySession({ state, commit, onClose, onExplore }: Props) {
  const [queue, setQueue] = useState<Card[]>(() => dueCards(state.cards));
  const [total] = useState(() => dueCards(state.cards).length);
  const [flipped, setFlipped] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<Grade[]>([]);
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const card = queue[0];
  const done = sessionLogs.length;
  const progress = total === 0 ? 100 : Math.round((done / total) * 100);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const grade = (g: Grade) => {
    if (!card || !flipped) return;
    const updated = reviewCard(card, g);
    commit(updated, g);
    setSessionLogs((l) => [...l, g]);
    setFlipped(false);
    setQueue((q) => {
      const [, ...rest] = q;
      return g === 0 ? [...rest, updated] : rest;
    });
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (flipped) {
        const hit = GRADES.find((x) => x.key === e.key);
        if (hit) grade(hit.g);
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, card]);

  const deck = card ? state.decks.find((d) => d.id === card.deckId) : undefined;
  const hs = deck ? hueStyles[deck.hue] : hueStyles.teal;

  const previews = useMemo(() => {
    if (!card) return {};
    const out: Partial<Record<Grade, string>> = {};
    for (const { g } of GRADES) {
      const r = reviewCard(card, g);
      out[g] = g === 0 ? "10m" : fmtInterval(r);
    }
    return out;
  }, [card]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // ---------- complete ----------
  if (!card) {
    const kept = sessionLogs.filter((g) => g >= 3).length;
    const acc = sessionLogs.length ? Math.round((kept / sessionLogs.length) * 100) : 0;
    const counts = { 0: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    sessionLogs.forEach((g) => counts[g]++);
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-ink/95 p-5 backdrop-blur">
        <div className="panel w-full max-w-lg animate-pop p-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <PartyPopper size={28} className="text-gold" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold text-fog">Orbit stabilized</h2>
          <p className="mt-2 text-sm text-mist">
            {total === 0
              ? "There was nothing due — your knowledge is fully in orbit."
              : `You cleared all ${total} due card${total === 1 ? "" : "s"}. Every review pushed your forgetting curve further out.`}
          </p>
          <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            <MiniStat label="Reviewed" value={String(done)} tone="text-fog" />
            <MiniStat label="Accuracy" value={`${acc}%`} tone="text-teal" />
            <MiniStat label="Time" value={`${mins}m ${secs.toString().padStart(2, "0")}s`} tone="text-gold" />
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {GRADES.map(({ g, label, cls }) => (
              <span key={g} className={`rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>
                {label} · {counts[g]}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onExplore} className="btn-press inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-extrabold text-ink">
              See your constellation <ArrowRight size={16} />
            </button>
            <button onClick={onClose} className="btn-press flex-1 rounded-xl border border-line bg-panel px-5 py-3 text-sm font-bold text-fog hover:border-teal/50">
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- active ----------
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink/95 backdrop-blur">
      {/* top bar */}
      <div className="flex items-center gap-4 px-5 py-4 md:px-8">
        <button onClick={onClose} className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-bold text-mist hover:text-fog">
          <X size={14} /> Exit
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-bold tabular-nums text-mist">
          {done}/{total} · {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>

      {/* card */}
      <div className="flex flex-1 items-center justify-center px-5 pb-6">
        <div className="w-full max-w-xl">
          <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold text-mist">
            <span className={`h-2 w-2 rounded-full ${hs.dot}`} /> {deck?.name ?? "Orbit"}
          </div>
          <div className="flip-scene">
            <div
              className={`flip-inner relative h-72 cursor-pointer md:h-80 ${flipped ? "is-flipped" : ""}`}
              onClick={() => setFlipped((f) => !f)}
            >
              {/* front */}
              <div className="flip-face panel absolute inset-0 flex flex-col p-7">
                <span className="text-[11px] font-bold uppercase tracking-widest text-dim">Recall the answer</span>
                <p className="mt-4 flex-1 overflow-y-auto font-display text-xl font-semibold leading-snug text-fog md:text-2xl">
                  {card.front}
                </p>
                <span className="flex items-center gap-1.5 text-xs text-dim">
                  <RotateCcw size={13} /> click or press space to reveal
                </span>
              </div>
              {/* back */}
              <div className="flip-face flip-back panel absolute inset-0 flex flex-col border-teal/30 p-7" style={{ borderColor: "rgba(63,216,194,0.35)" }}>
                <span className="text-[11px] font-bold uppercase tracking-widest text-teal">Answer</span>
                <p className="mt-4 flex-1 overflow-y-auto text-base leading-relaxed text-fog md:text-lg">{card.back}</p>
                <span className="text-xs text-dim">How well did you recall it?</span>
              </div>
            </div>
          </div>

          {/* grades */}
          <div className={`mt-6 grid grid-cols-4 gap-2.5 transition-all duration-300 ${flipped ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
            {GRADES.map(({ g, label, key, cls }) => (
              <button key={g} onClick={() => grade(g)} className={`btn-press flex flex-col items-center gap-0.5 rounded-xl border px-2 py-3 ${cls}`}>
                <span className="text-sm font-extrabold">{label}</span>
                <span className="text-[10px] font-semibold opacity-70">
                  {previews[g]} · key {key}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-dim">
            <Keyboard size={13} /> Space flips · 1–4 grade · Esc exits
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-panel px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-dim">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
