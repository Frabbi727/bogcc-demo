# Parity scripts

The Flutter app at `../../bogcc_demo_mobile_app` is a port of this codebase's
domain logic. These scripts run **this** code and print values, so the Dart
tests can freeze them as expected results.

The expected values in these Dart tests were produced here, and each says so in
a comment:

| Dart test | Script |
|---|---|
| `test/core/bn/bn_test.dart` | `bn.mts` |
| `test/domain/rules/rules_test.dart` | `rules.mts` |
| `test/core/random/seeded_rng_test.dart` | `random.mts` |

If a Dart test fails after a change here, the port has drifted and the two
demos will disagree on screen. **Do not edit the expected value in the Dart
test by hand** — run the script and work out which side is wrong.

```sh
npx tsx tool/parity/bn.mts
npx tsx tool/parity/rules.mts
npx tsx tool/parity/random.mts

# Regenerate the Flutter app's names.dart from names.ts
npx tsx tool/parity/gen-names.mts > ../../bogcc_demo_mobile_app/lib/catalogue/names.dart
```

`random.mts` is the one that matters most. mulberry32 relies on JavaScript's
32-bit coercion in `Math.imul`, `^`, `|` and `>>>`; Dart integers are 64-bit, so
the port masks explicitly at every step. Getting that subtly wrong still yields
a perfectly deterministic stream — just a different one — so the Dart test
freezes literals from here rather than asserting two Dart runs agree.
