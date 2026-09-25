/**
 * Seeded pseudo-random numbers.
 *
 * The seed data is generated relative to "today" so the dashboards always look
 * alive, but it must still be identical on every machine and on every reload of
 * the same day. A seeded PRNG gives both: fresh dates, fixed choices.
 */

/** mulberry32 — small, fast, good enough for demo data. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A stable numeric seed from a string, so `buildSeed('2026-09-25')` is repeatable. */
export function seedFrom(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface Rng {
  /** Float in [0, 1). */
  next: () => number
  /** Integer in [min, max], inclusive. */
  int: (min: number, max: number) => number
  /** One element of a non-empty array. */
  pick: <T>(items: readonly T[]) => T
  /** True with the given probability. */
  chance: (probability: number) => boolean
  /** A shuffled copy, Fisher-Yates. */
  shuffle: <T>(items: readonly T[]) => T[]
}

export function makeRandom(seed: string | number): Rng {
  const next = makeRng(typeof seed === 'string' ? seedFrom(seed) : seed)
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  return {
    next,
    int,
    pick: (items) => items[int(0, items.length - 1)],
    chance: (probability) => next() < probability,
    shuffle: (items) => {
      const out = [...items]
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = int(0, i)
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
  }
}
