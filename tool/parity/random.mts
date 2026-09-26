/**
 * Prints the seeded RNG stream for the Flutter port to freeze.
 *
 * A fresh generator per check: they must each start from the seed, or the
 * printed sequences continue one stream and the Dart test compares the wrong
 * thing. See tool/parity/README.md.
 */
import { makeRandom, makeRng, seedFrom } from '../../src/lib/random'

const SEED = 'bogcc-2026-09-26'

console.log('seedFrom(bogcc-2026-09-26) =>', seedFrom(SEED))
console.log('seedFrom(2026-09-25)       =>', seedFrom('2026-09-25'))

const first = makeRng(seedFrom(SEED))
console.log(
  'makeRng first 10           =>',
  JSON.stringify(Array.from({ length: 10 }, () => first())),
)

const zero = makeRng(0)
console.log('makeRng(0) first           =>', zero())

console.log(
  'int(1, 21) x8              =>',
  JSON.stringify(Array.from({ length: 8 }, ((r) => () => r.int(1, 21))(makeRandom(SEED)))),
)
console.log(
  'chance(0.4) x8             =>',
  JSON.stringify(Array.from({ length: 8 }, ((r) => () => r.chance(0.4))(makeRandom(SEED)))),
)
console.log(
  'pick(ক খ গ ঘ) x5           =>',
  JSON.stringify(
    Array.from({ length: 5 }, ((r) => () => r.pick(['ক', 'খ', 'গ', 'ঘ']))(makeRandom(SEED))),
  ),
)
console.log(
  'shuffle(1..10)             =>',
  JSON.stringify(makeRandom(SEED).shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])),
)
