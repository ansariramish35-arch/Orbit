// ---------------------------------------------------------------------------
// Orbit core — types, SM-2 spaced-repetition scheduler, persistence, analytics
// ---------------------------------------------------------------------------

export type Grade = 0 | 3 | 4 | 5; // again · hard · good · easy

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  ease: number;
  interval: number; // days
  reps: number;
  lapses: number;
  due: number; // epoch ms
  created: number;
  lastReview: number | null;
  x: number; // constellation coords 0..1
  y: number;
}

export interface Deck {
  id: string;
  name: string;
  hue: "teal" | "gold" | "iris" | "rose";
  created: number;
}

export interface ReviewLog {
  ts: number;
  grade: Grade;
  cardId: string;
  deckId: string;
}

export interface OrbitState {
  decks: Deck[];
  cards: Card[];
  logs: ReviewLog[];
}

export const DAY = 86_400_000;

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const newCard = (deckId: string, front: string, back: string): Card => ({
  id: uid(),
  deckId,
  front,
  back,
  ease: 2.5,
  interval: 0,
  reps: 0,
  lapses: 0,
  due: Date.now(),
  created: Date.now(),
  lastReview: null,
  x: 0.06 + Math.random() * 0.88,
  y: 0.08 + Math.random() * 0.84,
});

// ---- SM-2 -----------------------------------------------------------------
export function reviewCard(c: Card, g: Grade, now = Date.now()): Card {
  let { ease, interval, reps, lapses } = c;
  if (g === 0) {
    reps = 0;
    interval = 0;
    lapses += 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.max(1, Math.round(interval * ease));
    ease = Math.min(2.9, Math.max(1.3, ease + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02))));
  }
  const due = g === 0 ? now + 10 * 60_000 : now + interval * DAY;
  return { ...c, ease, interval, reps, lapses, due, lastReview: now };
}

// ---- derived metrics -------------------------------------------------------
export const isDue = (c: Card, now = Date.now()) => c.due <= now;

/** 0 → brand new, 1 → mature (interval ≥ 21 days) */
export const mastery = (c: Card) =>
  c.reps === 0 ? 0 : Math.min(1, c.interval / 21);

export type StarStatus = "due" | "learning" | "mature";
export const starStatus = (c: Card, now = Date.now()): StarStatus => {
  if (isDue(c, now) && c.reps > 0) return "due";
  if (mastery(c) >= 1) return "mature";
  return c.reps > 0 ? "learning" : "due";
};

export const dueCards = (cards: Card[], now = Date.now()) =>
  cards.filter((c) => isDue(c, now)).sort((a, b) => a.due - b.due);

export const retention = (logs: ReviewLog[]) => {
  if (!logs.length) return 0;
  const kept = logs.filter((l) => l.grade >= 3).length;
  return Math.round((kept / logs.length) * 100);
};

export function streakDays(logs: ReviewLog[], now = Date.now()): number {
  if (!logs.length) return 0;
  const days = new Set(logs.map((l) => new Date(l.ts).toDateString()));
  let streak = 0;
  const d = new Date(now);
  // allow today to be unfinished: start from today if present, else yesterday
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** review counts bucketed over the last `days` days, oldest → today */
export function reviewsPerDay(logs: ReviewLog[], days: number, now = Date.now()) {
  const buckets: { label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    const key = d.toDateString();
    buckets.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      count: logs.filter((l) => new Date(l.ts).toDateString() === key).length,
    });
  }
  return buckets;
}

export function gradeBreakdown(logs: ReviewLog[]) {
  const b = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const l of logs) {
    if (l.grade === 0) b.again++;
    else if (l.grade === 3) b.hard++;
    else if (l.grade === 4) b.good++;
    else b.easy++;
  }
  return b;
}

// ---- persistence -----------------------------------------------------------
const KEY = "orbit.state.v1";

export const emptyState: OrbitState = { decks: [], cards: [], logs: [] };

export function loadState(): OrbitState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as OrbitState;
    if (!Array.isArray(parsed.decks) || !Array.isArray(parsed.cards) || !Array.isArray(parsed.logs))
      return emptyState;
    return parsed;
  } catch {
    return emptyState;
  }
}

export function saveState(s: OrbitState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full / private mode — ignore */
  }
}

export const fmtInterval = (c: Card) => {
  if (c.reps === 0) return "new";
  if (c.interval < 1) return "<1d";
  if (c.interval < 30) return `${c.interval}d`;
  return `${Math.round(c.interval / 30 * 10) / 10}mo`;
};
