import { Deck, newCard, Card } from "./orbit";

export function buildStarterDecks(): { decks: Deck[]; cards: Card[] } {
  const now = Date.now();
  const js: Deck = { id: "deck-js", name: "JavaScript Foundations", hue: "gold", created: now };
  const ls: Deck = { id: "deck-learn", name: "The Science of Learning", hue: "teal", created: now };

  const jsPairs: [string, string][] = [
    ["What does `===` check that `==` does not?", "Strict equality — it compares both value AND type, with no coercion."],
    ["What is a closure?", "A function that remembers the variables from the scope where it was created, even after that scope has finished executing."],
    ["`let` vs `var` — the key difference?", "`let` is block-scoped; `var` is function-scoped and hoisted with an undefined initial value."],
    ["What does `Array.prototype.map` return?", "A brand-new array with the callback applied to every element — the original is untouched."],
    ["What is the event loop's job?", "It moves finished async callbacks from the task queue onto the call stack once the stack is empty."],
    ["`null` vs `undefined`?", "`undefined` means a variable was declared but never assigned; `null` is an intentional empty value set by the developer."],
    ["What does `Promise.all` do?", "Runs promises in parallel and resolves when ALL settle — but rejects immediately if any one rejects."],
    ["What is hoisting?", "Declarations are moved to the top of their scope before execution, so `function foo()` works even if called before its line."],
    ["`map` vs `forEach`?", "`map` returns a new array and is chainable; `forEach` returns undefined and is used purely for side effects."],
    ["What is the spread operator `...`?", "It expands an iterable (array/object/string) into individual elements — great for shallow copies."],
    ["What does `typeof null` return?", "\"object\" — a famous JavaScript bug from 1995 that was kept for backwards compatibility."],
    ["What is debouncing?", "Delaying a function until a pause in calls — e.g. waiting for the user to stop typing before searching."],
  ];

  const lsPairs: [string, string][] = [
    ["What is the forgetting curve?", "Ebbinghaus' finding: memory of new info drops exponentially — ~70% lost within 24 hours without review."],
    ["What is spaced repetition?", "Reviewing material at gradually increasing intervals, timed just before you'd forget — flattening the forgetting curve."],
    ["What is active recall?", "Testing yourself by retrieving an answer from memory, instead of re-reading. Retrieval is what strengthens the trace."],
    ["Why is testing more effective than re-reading?", "The retrieval effort itself rewires memory — struggling to recall builds stronger pathways than passive recognition."],
    ["What is interleaving?", "Mixing different topics in one session. It feels harder, but forces the brain to discriminate between problem types."],
    ["What is the testing effect?", "Each successful recall makes the memory more durable and slower to decay — exams are secretly a study tool."],
    ["Ideal time to review a card?", "Just before you're about to forget it — that's the moment retrieval effort (and learning) is maximal."],
    ["What is desirable difficulty?", "Conditions that make learning feel harder in the moment but produce far better long-term retention."],
  ];

  const cards: Card[] = [
    ...jsPairs.map(([f, b]) => newCard(js.id, f, b)),
    ...lsPairs.map(([f, b]) => newCard(ls.id, f, b)),
  ];

  return { decks: [js, ls], cards };
}
