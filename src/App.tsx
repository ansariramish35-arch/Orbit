import { useEffect, useMemo, useState } from "react";
import { BarChart3, Compass, Flame, Layers, Sparkles } from "lucide-react";
import Starfield from "./components/Starfield";
import Dashboard from "./components/Dashboard";
import StudySession from "./components/StudySession";
import Decks from "./components/Decks";
import Constellation from "./components/Constellation";
import StatsView from "./components/StatsView";
import { Logo } from "./components/ui";
import { buildStarterDecks } from "./lib/sample";
import { Card, Deck, Grade, OrbitState, loadState, newCard, saveState, streakDays, uid } from "./lib/orbit";

type View = "today" | "decks" | "constellation" | "stats";

const NAV: { id: View; label: string; icon: typeof Compass }[] = [
  { id: "today", label: "Today", icon: Compass },
  { id: "decks", label: "Decks", icon: Layers },
  { id: "constellation", label: "Constellation", icon: Sparkles },
  { id: "stats", label: "Stats", icon: BarChart3 },
];

export default function App() {
  const [state, setState] = useState<OrbitState>(loadState);
  const [view, setView] = useState<View>("today");
  const [studying, setStudying] = useState(false);

  useEffect(() => saveState(state), [state]);

  const streak = useMemo(() => streakDays(state.logs), [state.logs]);

  // ---- mutators ----
  const addDeck = (name: string, hue: Deck["hue"]) =>
    setState((s) => ({ ...s, decks: [...s.decks, { id: uid(), name, hue, created: Date.now() }] }));

  const addCard = (deckId: string, front: string, back: string) =>
    setState((s) => ({ ...s, cards: [...s.cards, newCard(deckId, front, back)] }));

  const updateCard = (card: Card) =>
    setState((s) => ({ ...s, cards: s.cards.map((c) => (c.id === card.id ? card : c)) }));

  const deleteCard = (id: string) => setState((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }));

  const deleteDeck = (id: string) =>
    setState((s) => ({
      ...s,
      decks: s.decks.filter((d) => d.id !== id),
      cards: s.cards.filter((c) => c.deckId !== id),
    }));

  const loadStarter = () =>
    setState((s) => {
      const { decks, cards } = buildStarterDecks();
      const freshDecks = decks.filter((d) => !s.decks.some((x) => x.id === d.id));
      return { ...s, decks: [...s.decks, ...freshDecks], cards: [...s.cards, ...cards] };
    });

  const commit = (card: Card, grade: Grade) =>
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) => (c.id === card.id ? card : c)),
      logs: [...s.logs, { ts: Date.now(), grade, cardId: card.id, deckId: card.deckId }],
    }));

  return (
    <div className="relative min-h-screen font-body">
      <Starfield />

      <div className="relative z-10 flex">
        {/* sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line/60 bg-ink-2/40 p-5 backdrop-blur-sm md:flex">
          <div className="flex items-center gap-3 px-1">
            <Logo size={38} />
            <div>
              <p className="font-display text-lg font-bold leading-none tracking-tight text-fog">Orbit</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-dim">never forget</p>
            </div>
          </div>

          <nav className="mt-9 space-y-1.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`btn-press flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                  view === id ? "bg-panel-2 text-fog shadow-inner shadow-teal/10 ring-1 ring-teal/30" : "text-mist hover:bg-panel hover:text-fog"
                }`}
              >
                <Icon size={17} className={view === id ? "text-teal" : ""} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-panel px-3.5 py-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${streak > 0 ? "bg-ember/15 text-ember" : "bg-panel-2 text-dim"}`}>
                <Flame size={17} />
              </span>
              <div>
                <p className="font-display text-base font-bold leading-none text-fog">{streak}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-dim">day streak</p>
              </div>
            </div>
            <p className="px-1 text-[10px] leading-relaxed text-dim">
              Built for the Skill Nexis Weekly Innovation Challenge.
            </p>
          </div>
        </aside>

        {/* main */}
        <main className="min-w-0 flex-1 pb-24 md:pb-10">
          {/* mobile top bar */}
          <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/80 backdrop-blur md:hidden">
            <div className="flex items-center justify-between px-5 pt-4">
              <div className="flex items-center gap-2.5">
                <Logo size={30} />
                <span className="font-display text-base font-bold text-fog">Orbit</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${streak > 0 ? "border-ember/40 bg-ember/10 text-ember" : "border-line bg-panel text-mist"}`}>
                <Flame size={13} /> {streak}
              </span>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-4 py-3">
              {NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`btn-press flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold ${
                    view === id ? "bg-panel-2 text-teal ring-1 ring-teal/30" : "text-mist hover:text-fog"
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </nav>
          </header>

          {view === "today" && (
            <Dashboard
              state={state}
              onStart={() => setStudying(true)}
              onLoadStarter={loadStarter}
              onNav={(v) => setView(v)}
            />
          )}
          {view === "decks" && (
            <Decks
              state={state}
              addDeck={addDeck}
              addCard={addCard}
              updateCard={updateCard}
              deleteCard={deleteCard}
              deleteDeck={deleteDeck}
              loadStarter={loadStarter}
            />
          )}
          {view === "constellation" && <Constellation state={state} />}
          {view === "stats" && <StatsView state={state} />}

          <footer className="mx-auto mt-14 max-w-6xl px-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/50 pt-5 text-[11px] font-semibold text-dim">
              <span className="flex items-center gap-2">
                <Logo size={18} /> Orbit · spaced repetition, reimagined
              </span>
              <span>SM-2 scheduling · local-first · zero accounts</span>
            </div>
          </footer>
        </main>
      </div>

      {studying && (
        <StudySession
          state={state}
          commit={commit}
          onClose={() => setStudying(false)}
          onExplore={() => {
            setStudying(false);
            setView("constellation");
          }}
        />
      )}
    </div>
  );
}
