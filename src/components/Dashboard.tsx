import { ArrowRight, Flame, Orbit, Play, Sparkles, Plus, Brain } from "lucide-react";
import { OrbitState, dueCards, mastery, retention, reviewsPerDay, streakDays } from "../lib/orbit";
import { CountUp, Reveal, hueStyles, Logo } from "./ui";

interface Props {
  state: OrbitState;
  onStart: () => void;
  onLoadStarter: () => void;
  onNav: (v: "decks" | "constellation" | "stats") => void;
}

export default function Dashboard({ state, onStart, onLoadStarter, onNav }: Props) {
  const { decks, cards, logs } = state;
  const due = dueCards(cards);
  const mature = cards.filter((c) => mastery(c) >= 1).length;
  const streak = streakDays(logs);
  const ret = retention(logs);
  const activity = reviewsPerDay(logs, 14);
  const maxAct = Math.max(1, ...activity.map((a) => a.count));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  if (decks.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-5 pt-10 md:pt-16">
        <Reveal>
          <div className="panel relative overflow-hidden p-8 md:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 opacity-60">
              <Logo size={260} />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal">
              <Sparkles size={13} /> Spaced repetition engine
            </span>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-bold leading-tight text-fog md:text-5xl">
              Put everything you learn into <span className="text-gold">stable orbit.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-mist">
              Orbit schedules every card at the exact moment you're about to forget it, so knowledge
              compounds instead of fading. Mastered cards light up your personal constellation.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onLoadStarter}
                className="btn-press inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-ink shadow-lg shadow-gold/20 hover:shadow-gold/35"
              >
                <Brain size={17} /> Load two starter decks
              </button>
              <button
                onClick={() => onNav("decks")}
                className="btn-press inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-5 py-3 text-sm font-bold text-fog hover:border-teal/50"
              >
                <Plus size={17} /> Build my own deck
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 pt-8 md:pt-12">
      {/* header */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mist">{today}</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-fog md:text-4xl">
              {greet}, pilot.
            </h1>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${
              streak > 0 ? "border-ember/40 bg-ember/10 text-ember" : "border-line bg-panel text-mist"
            }`}
          >
            <Flame size={16} className={streak > 0 ? "animate-pulse" : ""} />
            {streak > 0 ? `${streak}-day streak` : "No streak yet"}
          </div>
        </div>
      </Reveal>

      {/* mission strip */}
      <Reveal delay={80}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-4">
          <Stat label="Cards in orbit" value={<CountUp to={cards.length} />} accent="text-fog" />
          <Stat label="Due for review" value={<CountUp to={due.length} />} accent={due.length ? "text-rose" : "text-teal"} hot={due.length > 0} />
          <Stat label="Mastered" value={<CountUp to={mature} />} accent="text-gold" />
          <Stat label="Retention" value={<CountUp to={ret} suffix="%" />} accent="text-teal" />
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* queue */}
        <Reveal delay={140} className="lg:col-span-3">
          <div className="panel h-full p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-fog">Ready for recall</h2>
              <span className="text-xs font-semibold text-mist">
                {due.length ? `${due.length} card${due.length === 1 ? "" : "s"} waiting` : "queue clear"}
              </span>
            </div>

            {due.length > 0 ? (
              <>
                <ul className="mt-5 space-y-2.5">
                  {due.slice(0, 4).map((c) => {
                    const deck = decks.find((d) => d.id === c.deckId);
                    const hs = deck ? hueStyles[deck.hue] : hueStyles.teal;
                    return (
                      <li key={c.id} className="flex items-center gap-3 rounded-xl border border-line bg-ink-2/50 px-4 py-3">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${hs.dot}`} />
                        <span className="truncate text-sm text-fog">{c.front}</span>
                        <span className="ml-auto shrink-0 text-[11px] font-semibold text-dim">{deck?.name}</span>
                      </li>
                    );
                  })}
                </ul>
                {due.length > 4 && (
                  <p className="mt-3 text-xs text-dim">+ {due.length - 4} more in the queue</p>
                )}
                <button
                  onClick={onStart}
                  className="btn-press animate-pulse-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-5 py-3.5 text-sm font-extrabold text-ink hover:bg-teal/90"
                >
                  <Play size={17} fill="currentColor" /> Launch study session
                </button>
              </>
            ) : (
              <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-dashed border-line bg-ink-2/40 px-5 py-8">
                <Orbit size={26} className="text-teal" />
                <p className="text-sm leading-relaxed text-mist">
                  All cards are in stable orbit — nothing due right now. Add new material or check
                  your constellation while you wait.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onNav("decks")}
                    className="btn-press rounded-lg border border-line bg-panel px-4 py-2 text-xs font-bold text-fog hover:border-teal/50"
                  >
                    Add cards
                  </button>
                  <button
                    onClick={() => onNav("constellation")}
                    className="btn-press inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-teal hover:bg-teal/10"
                  >
                    View constellation <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* activity */}
        <Reveal delay={200} className="lg:col-span-2">
          <div className="panel flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-fog">Last 14 days</h2>
              <button onClick={() => onNav("stats")} className="btn-press inline-flex items-center gap-1 text-xs font-bold text-mist hover:text-teal">
                Full stats <ArrowRight size={12} />
              </button>
            </div>
            <div className="mt-6 flex flex-1 items-end gap-1.5" style={{ minHeight: 120 }}>
              {activity.map((a, i) => (
                <div key={i} className="group relative flex-1">
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      a.count ? "bg-gradient-to-t from-teal/40 to-teal" : "bg-line/60"
                    } group-hover:from-gold/40 group-hover:to-gold`}
                    style={{ height: `${8 + (a.count / maxAct) * 110}px` }}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md border border-line bg-ink-2 px-1.5 py-0.5 text-[10px] font-bold text-fog opacity-0 transition group-hover:opacity-100">
                    {a.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-semibold text-dim">
              <span>{activity[0]?.label}</span>
              <span>today</span>
            </div>
          </div>
        </Reveal>
      </div>

      {/* decks */}
      <Reveal delay={260}>
        <div className="grid gap-4 md:grid-cols-2">
          {decks.map((d) => {
            const dcards = cards.filter((c) => c.deckId === d.id);
            const ddue = dueCards(dcards).length;
            const hs = hueStyles[d.hue];
            return (
              <button
                key={d.id}
                onClick={() => onNav("decks")}
                className="btn-press panel group flex items-center gap-4 p-5 text-left hover:border-teal/40"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${hs.ring} ${hs.soft}`}>
                  <span className={`h-3 w-3 rounded-full ${hs.dot}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display font-semibold text-fog">{d.name}</span>
                  <span className="text-xs text-mist">{dcards.length} cards</span>
                </span>
                {ddue > 0 ? (
                  <span className="rounded-full bg-rose/15 px-2.5 py-1 text-xs font-bold text-rose">{ddue} due</span>
                ) : (
                  <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal">stable</span>
                )}
              </button>
            );
          })}
        </div>
      </Reveal>
    </div>
  );
}

function Stat({ label, value, accent, hot }: { label: string; value: React.ReactNode; accent: string; hot?: boolean }) {
  return (
    <div className="relative bg-panel px-5 py-5">
      {hot && <span className="absolute right-3 top-3 h-2 w-2 animate-ping rounded-full bg-rose" />}
      <p className="text-[11px] font-bold uppercase tracking-widest text-dim">{label}</p>
      <p className={`mt-1.5 font-display text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
