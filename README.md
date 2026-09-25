# ডিজিটাল রেজিস্টার ব্যবস্থা — বগুড়া সিটি কর্পোরেশন (ডেমো)

## 1. What this is

A **presentation demo** of a digital register system for Bogura City Corporation, built to show
officers how their handwritten register books (রেজিস্টার খাতা) would work if they were digital.

- **All data is fictional.** Every person, business, NID and phone number here is invented. Only
  the Bogura area names (সাতমাথা, ঠনঠনিয়া, জলেশ্বরীতলা …) are real.
- **There is no backend.** Everything lives in a zustand store persisted to `localStorage` under
  the key `bogcc-demo-v1`, seeded with fake data on first load.
- The UI is Bangla throughout, and every displayed number, date, serial and amount uses Bangla
  digits.
- The real system will be built in Laravel later. The data model and workflows here are kept
  clean so they can be reused.

What it demonstrates:

- **Trade licence** — the full workflow: আবেদন জমা → মাঠ যাচাই → অনুমোদন (this is where the
  register serial is assigned) → ফি আদায় ও ইস্যু, with printable licence and money receipt.
- **Two operational registers** — সড়কবাতি মেরামত and বর্জ্য পরিবহন ট্রিপ, both driven by the same
  config-driven engine.
- **Office rules that the paper book enforces** — serials are sequential per register per fiscal
  year with no gaps; nothing is ever deleted, only cancelled (বাতিল) with a mandatory reason; and
  every action appends to an append-only activity log.

## 2. Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

## 3. Deploy to Vercel

1. Push the repository to GitHub.
2. Import it on [vercel.com](https://vercel.com) — Vite is detected automatically.
3. Build command `npm run build`, output directory `dist`.
4. `vercel.json` rewrites every path to `/index.html`, so refreshing a deep route
   (`/trade-licence/<id>`, `/registers/garbage-trips`) works instead of 404ing.

Because the data is in `localStorage`, each visitor gets their own copy of the demo and nothing
is shared or sent anywhere.

## 4. How to add a new register

Daily operational books all follow the same pattern, so a new register is a config file, not new
screens:

1. **Create the config** — `src/registers/<your-register>.ts`, exporting a `RegisterConfig`
   (see `src/registers/types.ts`). Copy `streetlight-repair.ts` as a starting point and set:
   - `key` (used in the URL), `title`, `section`, `serialPrefix`;
   - `fields` — mark the ones that should be columns in the book with `showInBook: true`;
   - `statuses` — ordered Bangla labels; the first is set on creation;
   - `roles` — who may `create`, `advance` and `cancel`;
   - `dateField` — the field used for fiscal-year and date-range filters;
   - optionally `advancePrompts` (extra fields asked for when moving *into* a status) and
     `totals` (numeric fields summed in the book footer).
2. **Register it** — add it to the `REGISTERS` array in `src/registers/index.ts`.
3. **Seed some entries** — add raw rows and a loop in `buildSeed()` in `src/data/seed.ts`,
   allocating serials with `SEQ.register(prefix, fiscalYear)`.
4. **Add a sidebar link** — add an item under the right section in `src/data/nav.ts`.

The three pages (`/registers/:key`, `/registers/:key/new`, `/registers/:key/:id`) then work with
no further code.

## 5. Five-minute presentation script

1. Log in as **ডাটা এন্ট্রি অপারেটর** and create a trade licence application
   (`ট্রেড লাইসেন্স` → `নতুন আবেদন`). Point out the live fee preview and that Bangla digits can be
   typed straight into the NID and mobile fields.
2. On the record, click **`লাইসেন্স পরিদর্শক হিসেবে দেখুন`** — the role switches in place — write a
   verification note and click `যাচাই সম্পন্ন করুন`.
3. Switch to **লাইসেন্স অফিসার** and click `অনুমোদন দিন`. **The register serial and the licence
   number appear only now** — this is the moment a new line would be written in the paper book.
   The অনুমোদিত rubber stamp appears on the record.
4. Switch to **হিসাবরক্ষক**, choose a payment mode, collect the fee, and print the receipt. Show
   the amount written out in Bangla words and the paper-book reference `বই নং X, পাতা Y`.
5. Print the licence and scan its QR code with a phone — it opens the public `/verify` page with a
   green বৈধ badge, without anyone logging in.
6. Open **ট্রেড লাইসেন্স রেজিস্টার** and print a page. It comes out A4 landscape, ruled, with the
   red margin line — the paper book, on screen.
7. Log a street light complaint in **সড়কবাতি মেরামত রেজিস্টার**, then switch to **ইলেকট্রিশিয়ান**
   and advance it — note that মেরামতের তারিখ and ব্যবহৃত মালামাল are only asked for at the step
   where the paper book would get those columns filled.
8. Show the **বর্জ্য পরিবহন ট্রিপ রেজিস্টার** with its ward and date filters and footer totals.
   Cancel a line to show it stays in the book, struck through, with the বাতিল stamp and a reason.
9. Search for a name, an NID or a vehicle number from the top bar — results are grouped by
   register.
10. Open the **কার্যক্রম লগ**: who did what, when, and what changed (before → after). Nothing in
    it can be edited or deleted.
11. Switch to **প্রধান নির্বাহী কর্মকর্তা** and show the dashboard — collections, pending work and
    the charts.
12. Switch to **মেয়র / প্রশাসক**. The **মেয়র ড্যাশবোর্ড** opens by itself: the KPI row with each
    figure's change against last month, the 21-tile ward map (click a tile to drill into that
    ward), the revenue, channel and complaint charts, the overdue list with the desk each file is
    sitting on, section performance, citizen ratings and the paper-saved estimate. Finish with
    **উপস্থাপনা মোড**, which cycles the same live figures full-screen for a projector — arrow keys
    move between slides, space holds one, Escape comes back.

`ডেমো রিসেট` in the top bar puts everything back to the seeded data at any point.

## 6. Next steps for the real system

- **Laravel backend** — move the data model (licences, receipts, register entries, sequences,
  audit) into MySQL/PostgreSQL, with serial allocation inside a database transaction so two
  clerks can never take the same number.
- **Real user accounts** — replace the role picker with proper authentication, per-section
  permissions and session management.
- **Server-side audit** — write the activity log on the server, immutable and outside the
  application's reach, with signed exports for annual audit.
- **Bangla / English toggle** — extract the strings to a translation layer; the digit and date
  helpers in `src/lib/bn.ts` already isolate most of the locale-specific formatting.
- Further work: licence renewal and expiry reminders (SMS), server-verified QR codes, the
  second-phase modules listed under `দ্বিতীয় ধাপ`, and reporting exports for the CEO.
