import { useState } from "react";
import { Layers, Pencil, Plus, Trash2, Brain, Check } from "lucide-react";
import { Card, Deck, OrbitState, fmtInterval, isDue, mastery } from "../lib/orbit";
import { Field, Modal, Reveal, hueStyles, inputCls } from "./ui";

interface Props {
  state: OrbitState;
  addDeck: (name: string, hue: Deck["hue"]) => void;
  addCard: (deckId: string, front: string, back: string) => void;
  updateCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  deleteDeck: (id: string) => void;
  loadStarter: () => void;
}

const HUES: Deck["hue"][] = ["teal", "gold", "iris", "rose"];

export default function Decks({ state, addDeck, addCard, updateCard, deleteCard, deleteDeck, loadStarter }: Props) {
  const [selected, setSelected] = useState<string | null>(state.decks[0]?.id ?? null);
  const [deckModal, setDeckModal] = useState(false);
  const [cardModal, setCardModal] = useState<null | { card?: Card }>(null);
  const [confirmDeck, setConfirmDeck] = useState<string | null>(null);

  const deck = state.decks.find((d) => d.id === selected) ?? state.decks[0];
  const cards = deck ? state.cards.filter((c) => c.deckId === deck.id) : [];

  return (
    <div className="mx-auto max-w-6xl px-5 pt-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-fog">Decks</h1>
            <p className="mt-1 text-sm text-mist">Your material, organized into orbits of knowledge.</p>
          </div>
          <div className="flex gap-3">
            {state.decks.length === 0 && (
              <button onClick={loadStarter} className="btn-press inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink">
                <Brain size={16} /> Load starter decks
              </button>
            )}
            <button onClick={() => setDeckModal(true)} className="btn-press inline-flex items-center gap-2 rounded-xl border border-teal/40 bg-teal/10 px-4 py-2.5 text-sm font-bold text-teal hover:bg-teal/20">
              <Plus size={16} /> New deck
            </button>
          </div>
        </div>
      </Reveal>

      {state.decks.length === 0 ? (
        <Reveal delay={80}>
          <div className="panel mt-6 flex flex-col items-start gap-3 p-10">
            <Layers size={28} className="text-iris" />
            <h2 className="font-display text-xl font-bold text-fog">No decks in orbit</h2>
            <p className="max-w-md text-sm leading-relaxed text-mist">
              Create a deck for any subject — formulas, vocabulary, interview questions — or load the
              two starter decks to try Orbit instantly.
            </p>
          </div>
        </Reveal>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          {/* deck list */}
          <Reveal delay={60} className="lg:col-span-1">
            <div className="space-y-2.5">
              {state.decks.map((d) => {
                const dc = state.cards.filter((c) => c.deckId === d.id);
                const ddue = dc.filter((c) => isDue(c)).length;
                const hs = hueStyles[d.hue];
                const active = deck?.id === d.id;
                return (
                  <div key={d.id} className="group relative">
                    <button
                      onClick={() => setSelected(d.id)}
                      className={`btn-press w-full rounded-2xl border p-4 text-left transition ${
                        active ? "border-teal/50 bg-panel-2" : "border-line bg-panel hover:border-teal/30"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${hs.dot}`} />
                        <span className="truncate font-display text-sm font-semibold text-fog">{d.name}</span>
                      </span>
                      <span className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-dim">
                        {dc.length} cards
                        {ddue > 0 && <span className="text-rose">{ddue} due</span>}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirmDeck === d.id) {
                          deleteDeck(d.id);
                          setConfirmDeck(null);
                          if (selected === d.id) setSelected(null);
                        } else {
                          setConfirmDeck(d.id);
                          setTimeout(() => setConfirmDeck((c) => (c === d.id ? null : c)), 2600);
                        }
                      }}
                      className={`btn-press absolute right-2.5 top-2.5 rounded-md p-1.5 text-[10px] font-bold transition ${
                        confirmDeck === d.id ? "bg-rose text-ink" : "text-dim opacity-0 hover:text-rose group-hover:opacity-100"
                      }`}
                      aria-label="Delete deck"
                    >
                      {confirmDeck === d.id ? "sure?" : <Trash2 size={13} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* cards */}
          <Reveal delay={120} className="lg:col-span-3">
            <div className="panel h-full p-6">
              {deck ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-3 w-3 rounded-full ${hueStyles[deck.hue].dot}`} />
                      <h2 className="font-display text-lg font-semibold text-fog">{deck.name}</h2>
                      <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs font-bold text-mist">{cards.length}</span>
                    </div>
                    <button onClick={() => setCardModal({})} className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-2 px-3.5 py-2 text-xs font-bold text-fog hover:border-teal/50">
                      <Plus size={14} /> Add card
                    </button>
                  </div>

                  {cards.length === 0 ? (
                    <p className="mt-8 rounded-xl border border-dashed border-line px-5 py-10 text-center text-sm text-dim">
                      This deck is empty — add your first card to launch it into orbit.
                    </p>
                  ) : (
                    <ul className="mt-5 space-y-2.5">
                      {cards.map((c) => {
                        const m = mastery(c);
                        const status = c.reps === 0 ? "new" : m >= 1 ? "mature" : isDue(c) ? "due" : "learning";
                        const badge =
                          status === "mature"
                            ? "bg-gold/10 text-gold"
                            : status === "due"
                              ? "bg-rose/10 text-rose"
                              : status === "learning"
                                ? "bg-teal/10 text-teal"
                                : "bg-panel-2 text-mist";
                        return (
                          <li key={c.id} className="group flex items-start gap-4 rounded-xl border border-line bg-ink-2/50 px-4 py-3 transition hover:border-teal/30">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-fog">{c.front}</p>
                              <p className="mt-0.5 truncate text-xs text-mist">{c.back}</p>
                            </div>
                            <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${badge}`}>
                              {status === "new" ? "new" : `${fmtInterval(c)}`}
                            </span>
                            <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                              <button onClick={() => setCardModal({ card: c })} className="btn-press rounded-md p-1.5 text-mist hover:bg-panel-2 hover:text-fog" aria-label="Edit card">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => deleteCard(c.id)} className="btn-press rounded-md p-1.5 text-mist hover:bg-rose/15 hover:text-rose" aria-label="Delete card">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <p className="py-10 text-center text-sm text-dim">Select a deck to see its cards.</p>
              )}
            </div>
          </Reveal>
        </div>
      )}

      <NewDeckModal
        open={deckModal}
        onClose={() => setDeckModal(false)}
        onCreate={(name, hue) => {
          addDeck(name, hue);
          setDeckModal(false);
        }}
      />

      <CardModal
        key={cardModal?.card?.id ?? "new"}
        open={cardModal !== null}
        card={cardModal?.card}
        onClose={() => setCardModal(null)}
        onSave={(front, back) => {
          if (!deck) return;
          if (cardModal?.card) updateCard({ ...cardModal.card, front, back });
          else addCard(deck.id, front, back);
          setCardModal(null);
        }}
      />
    </div>
  );
}

function NewDeckModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (n: string, h: Deck["hue"]) => void }) {
  const [name, setName] = useState("");
  const [hue, setHue] = useState<Deck["hue"]>("teal");
  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), hue);
    setName("");
  };
  return (
    <Modal open={open} onClose={onClose} title="New deck">
      <div className="space-y-4">
        <Field label="Deck name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Organic Chemistry" onKeyDown={(e) => e.key === "Enter" && submit()} autoFocus />
        </Field>
        <Field label="Color">
          <div className="flex gap-2.5">
            {HUES.map((h) => (
              <button key={h} onClick={() => setHue(h)} className={`btn-press relative flex h-9 w-9 items-center justify-center rounded-xl border ${hue === h ? "border-fog/60" : "border-line"}`} aria-label={h}>
                <span className={`h-4 w-4 rounded-full ${hueStyles[h].dot}`} />
                {hue === h && <Check size={12} className="absolute text-ink" />}
              </button>
            ))}
          </div>
        </Field>
        <button onClick={submit} disabled={!name.trim()} className="btn-press w-full rounded-xl bg-teal px-4 py-3 text-sm font-extrabold text-ink disabled:opacity-40">
          Create deck
        </button>
      </div>
    </Modal>
  );
}

function CardModal({ open, card, onClose, onSave }: { open: boolean; card?: Card; onClose: () => void; onSave: (f: string, b: string) => void }) {
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const valid = front.trim() && back.trim();
  return (
    <Modal open={open} onClose={onClose} title={card ? "Edit card" : "New card"} wide>
      <div className="space-y-4">
        <Field label="Front — the question">
          <input className={inputCls} value={front} onChange={(e) => setFront(e.target.value)} placeholder="What is a closure?" autoFocus />
        </Field>
        <Field label="Back — the answer">
          <textarea className={`${inputCls} min-h-24 resize-y`} value={back} onChange={(e) => setBack(e.target.value)} placeholder="A function that remembers the scope it was created in…" />
        </Field>
        <button
          onClick={() => valid && onSave(front.trim(), back.trim())}
          disabled={!valid}
          className="btn-press w-full rounded-xl bg-gold px-4 py-3 text-sm font-extrabold text-ink disabled:opacity-40"
        >
          {card ? "Save changes" : "Add to deck"}
        </button>
      </div>
    </Modal>
  );
}
