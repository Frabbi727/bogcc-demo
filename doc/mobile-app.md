# The mobile app

There is a Flutter companion to this demo at
`../../bogcc_demo_mobile_app` (GitHub: `Frabbi727/bogcc-demo-mobile-app`,
branch `phase1-citizen`). It is the "staff mobile app" listed as a future step
in `README.md` §6 and `doc/upgrade-doc.md` §20 — built citizen-first, because
the Citizen Corner is the part this web app has not built and the part that is
inherently mobile.

**Read this before changing anything in `src/lib/`, `src/data/` or
`src/registers/`.** Those files have been ported to Dart, and a change here
that is not mirrored there makes the two demos disagree on screen.

## What it is

Bangla-only, Android-only, **no backend and no network permission** — it holds
its own seeded dataset on the device, the same way this app holds one in
`localStorage`. The two do not share data.

Every user — citizen or any of the ten office desks — signs in and lands in a
shell built from their own role config. The citizen side is complete: charter,
application, tracking, messages. The ten office desks each produce their own
shell and inbox already; the screens behind them are its Phase 2.

## What is shared, and how to keep it that way

The mobile repo's `doc/parity-with-web.md` has the file-by-file map. The short
version of what must stay identical:

- `src/lib/bn.ts` — every digit, date and amount a person reads
- `src/lib/sla.ts`, `fiscal.ts`, `ids.ts`, `status.ts` — what a citizen is
  promised, and every number printed on a document
- `src/lib/random.ts` — the seeded RNG
- `src/data/services.ts` — the charter: charter days, fees, `citizenLabels`
- `src/data/businessTypes.ts`, `wards.ts`, `users.ts`, `names.ts`
- `src/registers/*.ts` — the config-driven engine, all nine registers
- `src/types.ts` — the domain model
- `src/index.css` `@theme` — the palette, token names included

`src/data/seed.ts` is matched in **shape and volume only**, not in its exact
random stream. If you change a seed count, change it on both sides.

## Re-checking parity

`tool/parity/` runs this code and prints values that the Dart tests freeze as
expected results. If a Dart test fails after a change here, the port has
drifted — run the script rather than editing the Dart expectation.

```sh
npx tsx tool/parity/bn.mts
npx tsx tool/parity/rules.mts
npx tsx tool/parity/random.mts
npx tsx tool/parity/gen-names.mts > ../../bogcc_demo_mobile_app/lib/catalogue/names.dart
```

## Things the port found that apply here too

- **`amountInWords` recurses through কোটি**, so very large amounts read
  correctly. Worth keeping if this is ever refactored.
- **The Bangla year rolls over on 14 April**, and the 13th/14th boundary is the
  case that catches a wrong implementation.
- **Receipt numbers must run in collection order across every revenue head**,
  the way one book at one counter does — not per head.
- **A licence's `issued` step has no audit line of its own**; the receipt's
  ফি আদায় line records it at the same timestamp. That is fine, but it is
  load-bearing and not obvious from reading `seed.ts`.

## Things the mobile app does that this one could

Not requests, just what the port surfaced:

- A **pure `redirectFor(session, location)`** rule, tested for every role
  against every route including that no redirect target itself redirects.
- **Validation messages that say what to do** — "১১ সংখ্যার মোবাইল নম্বর দিন"
  rather than "অবৈধ" — and an NID rule that accepts 10, 13 and 17 digits,
  since all three are in circulation.
- **Tracking lookup requires tracking number *and* mobile.** A tracking number
  alone is guessable, and someone else's application is not a citizen's to read.
  This app's `/verify` is public by design (a printed QR must open for anyone),
  but "track my application" is a different question.
