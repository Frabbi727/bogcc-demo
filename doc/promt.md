# Build Spec: Digital Register System Demo (Bogura City Corporation)

You are building a **demo web application** inside this existing Vite + React + TypeScript project. Read this whole file before writing code, then build it phase by phase (see "Build phases"). After each phase, run `npm run build` and fix every error before moving on.

---

## 1. Purpose

Bogura City Corporation staff record every service they complete in handwritten **paper register books** (রেজিস্টার খাতা): trade licences, street light repairs, garbage vehicle trips, and more. This demo shows officers how a digital register system would replace that paperwork.

- It is a **presentation demo**, hosted on **Vercel** as a static site and shared by link.
- There is **no backend**. All data lives in a zustand store persisted to `localStorage`, seeded with **fake** data.
- The real system will later be built in Laravel. Keep the data model clean so the flows can be reused.

---

## 2. Tech stack

These are already installed:

- Vite, React, TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite`
- `react-router-dom`, `zustand` (with `persist`), `lucide-react`, `recharts`, `qrcode.react`, `sonner`
- The `@/` import alias points to `./src`

Do **not** add a backend, a database, authentication services, or any paid or external APIs. If you need a small extra library, prefer none.

Before starting, check these and fix them if missing:

- `vite.config.ts` includes the `tailwindcss()` plugin and the `@` alias.
- `src/index.css` starts with `@import "tailwindcss";`.
- `vercel.json` exists at the root with:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

---

## 3. Hard rules

1. **All data is fictional.** Names, NIDs, phone numbers and businesses are invented. Never use real businesses or real people. You may use real Bogura area names in addresses.
2. **Nothing is ever deleted.** Records can be *cancelled* (বাতিল) with a mandatory reason. Cancelled records stay visible.
3. **Every action writes an audit log entry.** The log is append-only: there is no UI to edit or delete it.
4. **Register serial numbers** are sequential per register per fiscal year, with no gaps. They are assigned only at the step where the paper book would get a new line (see each register).
5. **Bangla first.** All UI text is Bangla, and all displayed numbers use Bangla digits.
6. A **demo banner** on every page (except print views): `ডেমো সংস্করণ: সকল তথ্য কাল্পনিক`.
7. Keep the project compiling. `npm run build` must pass at the end.

---

## 4. Language and formatting helpers

Put `<html lang="bn">` in `index.html`, and load these Google Fonts in `index.html`:

- **Hind Siliguri** (400/500/600/700) for body text
- **Tiro Bangla** for headings, register book titles, certificates and stamps

Create `src/lib/bn.ts` with:

| Function | Behaviour |
|---|---|
| `toBnDigits(v)` | Converts `0-9` to `০-৯`. Use it for every displayed number, date, serial and amount. |
| `bnToEnDigits(s)` | Converts Bangla digits to English, so form inputs accept Bangla digits. |
| `formatTaka(n)` | Returns e.g. `৳১,২৫,০০০`, using Indian digit grouping. |
| `formatDateBn(iso)` | Returns e.g. `২৫ সেপ্টেম্বর ২০২৬`. |
| `formatDateTimeBn(iso)` | Date plus time, e.g. `২৫ সেপ্টেম্বর ২০২৬, বিকাল ৩:১০`. |
| `banglaCalendarDate(iso)` | Revised Bangladesh calendar (see the rules below). |
| `amountInWords(n)` | Bangla words using কোটি/লক্ষ/হাজার/শত, ending `টাকা মাত্র`, e.g. `এক হাজার পাঁচশত টাকা মাত্র`. |

Rules for `banglaCalendarDate`:

- 1 Boishakh = 14 April.
- Boishakh to Ashwin (the first six months) have 31 days each.
- Kartik, Agrahayan, Poush, Magh and Chaitra have 30 days each.
- Falgun has 29 days, or 30 when the Gregorian year in which that Falgun falls is a leap year.
- Bangabda = Gregorian year − 593 from 14 April onward (and − 594 before 14 April).
- Output example: `১০ আশ্বিন ১৪৩৩ বঙ্গাব্দ`.

Create `src/lib/fiscal.ts`:

- The fiscal year runs July to June. `fiscalYearOf(iso)` returns e.g. `"2026-27"`.
- `validUntil(fy)` returns 30 June of the fiscal year's end.
- `currentFiscalYear()` uses today's date.

---

## 5. Design

This is a serious, trustworthy government office tool, not a flashy SaaS look.

### Color tokens

Define these as Tailwind v4 `@theme` tokens in `src/index.css`:

| Token | Hex | Use |
|---|---|---|
| forest-700 (primary) | `#0E5A43` | Sidebar, primary buttons |
| forest-800 | `#0A4232` | Hover and active states |
| forest-50 | `#EEF6F2` | Soft highlights |
| paper (app background) | `#F4F6F3` | App background |
| page | `#FFFFFC` | Register pages, printed documents |
| ink | `#1C2B27` | Main text |
| muted | `#5E6E69` | Secondary text |
| rule | `#CFDBEA` | Ledger ruled lines |
| margin | `#E8A0A0` | Ledger red margin line |
| stamp | `#B3261E` | Rubber stamps, cancelled state |
| amber | `#C27C0E` | Pending states, demo banner |

### The memorable element: the register book page

- A ruled ledger: thin blue horizontal rules, a red vertical margin line on the left, and a book-style header block with the register name, section, fiscal year and ward. Headings use Tiro Bangla.
- **Rubber stamps:** a `Stamp` component, slightly rotated (−6°), double border, stamp-red Tiro Bangla text at about 85% opacity.
  - `অনুমোদিত` on approved or issued records.
  - `বাতিল` on cancelled records. Cancelled rows are also struck through.

Keep everything else quiet: clean tables, clear forms, restrained color. Avoid gradients, decorative animations, and all-caps labels.

### Layout

- Left sidebar (forest green) with navigation grouped by section, and a top bar containing:
  - global search;
  - the current user (name + role);
  - a role switcher;
  - a `ডেমো রিসেট` button.
- Works at 1366×768 (typical office PCs). On mobile the sidebar becomes a drawer.
- Visible keyboard focus. Respect `prefers-reduced-motion`.

### Print

- Print views hide the sidebar, top bar and banner (use a `.no-print` class).
- Register pages print A4 **landscape** using a named `@page`.
- Licences and receipts print A4 **portrait**.

---

## 6. Roles

Login is a **role picker**: no passwords. Each role has a fictional person.

| Role key | Bangla title | What they do |
|---|---|---|
| `operator` | ডাটা এন্ট্রি অপারেটর | Creates new applications and register entries |
| `inspector` | লাইসেন্স পরিদর্শক | Field verification of trade licence applications |
| `officer` | লাইসেন্স অফিসার | Approves trade licences (assigns the serial); cancels with a reason |
| `accounts` | হিসাবরক্ষক / ক্যাশিয়ার | Collects fees; issues money receipts |
| `electrician` | ইলেকট্রিশিয়ান | Works on street light repair entries |
| `conservancy` | পরিচ্ছন্নতা পরিদর্শক | Enters and verifies garbage vehicle trips |
| `ceo` | প্রধান নির্বাহী কর্মকর্তা | Read-only access to everything; focuses on the dashboard |

The role switcher in the top bar changes role instantly without logging out. This is essential for presenting the demo.

---

## 7. Module A: Trade licence (full workflow)

### Statuses

`submitted` (আবেদন জমা) → `verified` (যাচাইকৃত) → `approved` (অনুমোদিত) → `issued` (ইস্যুকৃত). A record can also become `cancelled` (বাতিল).

### Steps

1. **Operator** fills the new application form.
   - Business: name in Bangla and English, business type, nature (একক / অংশীদারি / কোম্পানি), address, area, ward (1–21), holding number.
   - Owner: name, father's name, mother's name, NID (10, 13 or 17 digits), mobile (11 digits starting with `01`).
   - Validate every field and show inline Bangla error messages.
   - Show a live fee preview on the side.
   - On submit, create an application number (`আবেদন নং`).
2. **Inspector** adds a verification note and clicks `যাচাই সম্পন্ন করুন`.
3. **Officer** clicks `অনুমোদন দিন`.
   - Only at this moment are the **register serial** and **licence number** assigned, e.g. `BOGCC/TL/2026-27/00013` (sequential per fiscal year).
   - The officer can instead click `বাতিল করুন`, which requires a reason in a dialog.
4. **Accounts** collects the fee.
   - Payment mode: নগদ / বিকাশ / ব্যাংক, plus a transaction reference for non-cash payments.
   - This issues a **money receipt**. The receipt number is sequential and is also shown as a paper receipt-book reference, `বই নং X, পাতা Y` (100 leaves per book).
   - Status becomes `issued`.

### Fees

Fees come from a business type table. Label them clearly as **demo rates** (`ডেমো হার`). Use about 10 types: মুদি দোকান, ঔষধের দোকান, রেস্তোরাঁ, কাপড়ের দোকান, ইলেকট্রনিক্স, দই-মিষ্টির দোকান, মোবাইল সার্ভিসিং, ওয়ার্কশপ, কোচিং সেন্টার, পাইকারি ব্যবসা.

Fee lines:

- লাইসেন্স ফি
- সাইনবোর্ড কর
- ভ্যাট (লাইসেন্স ফির ১৫%)
- আবেদন ফরম ও বই মূল্য (fixed amount)

### Detail page (the heart of the demo)

- A 4-step progress indicator: আবেদন জমা → মাঠ যাচাই → অনুমোদন ও রেজিস্টার নম্বর → ফি আদায় ও ইস্যু.
- Business, owner and fee details.
- A history timeline built from the audit log.
- Action buttons appear **only for the role that acts next**.
- When the current role cannot act, show who acts next, plus a one-click button **`<role> হিসেবে দেখুন`** that switches to that role. This lets a presenter walk the whole flow smoothly.
- When a record is issued, show `লাইসেন্স প্রিন্ট` and `রসিদ প্রিন্ট` buttons.

### Toasts

Toasts (sonner) use the same words as the buttons, e.g. button `অনুমোদন দিন` → toast `অনুমোদিত, ক্রমিক নং ১৩`.

---

## 8. Module B: Generic register engine (config-driven)

Daily operational books (street light repairs, garbage trips, and future ones) all follow the same pattern: a book with columns, serial numbers, ward and date filters, a status, an audit trail, and a print view. Build **one engine** driven by configuration, so a new register is just a new config file.

### `src/registers/types.ts`

```ts
export type FieldType = 'text' | 'number' | 'date' | 'ward' | 'select' | 'textarea' | 'phone';

export interface RegisterField {
  key: string;
  label: string;           // Bangla
  type: FieldType;
  options?: string[];      // for select
  required?: boolean;
  showInBook?: boolean;    // show as a column on the register page
}

export interface RegisterConfig {
  key: string;             // used in the URL
  title: string;           // e.g. 'সড়কবাতি মেরামত রেজিস্টার'
  section: string;         // e.g. 'বিদ্যুৎ শাখা'
  serialPrefix: string;    // e.g. 'SL'
  fields: RegisterField[];
  statuses: string[];      // ordered Bangla labels; the first status is set on creation
  roles: { create: Role[]; advance: Role[]; cancel: Role[] };
  dateField: string;       // field used for the fiscal year and date filters
}
```

Serials for generic registers are assigned **on creation** (the moment a line is written in the paper book), sequential per register per fiscal year.

### Register B1: Street light repair (`streetlight-repair`)

- **Title:** সড়কবাতি মেরামত রেজিস্টার. **Section:** বিদ্যুৎ শাখা. **Serial prefix:** `SL`.
- **Fields:** খুঁটি নং, ওয়ার্ড, রাস্তার নাম, সমস্যার ধরন (বাতি নষ্ট / তার ছেঁড়া / খুঁটি হেলে গেছে / সুইচ নষ্ট), অভিযোগের তারিখ, অভিযোগকারীর নাম, অভিযোগকারীর মোবাইল, নিযুক্ত মিস্ত্রি, মেরামতের তারিখ, ব্যবহৃত মালামাল, মন্তব্য.
- **Statuses:** অভিযোগ গৃহীত → মিস্ত্রি নিযুক্ত → মেরামত সম্পন্ন.
- **Roles:** create = `operator`; advance = `electrician`, `officer`; cancel = `officer`.
- When advancing to মেরামত সম্পন্ন, ask for the repair date and the materials used.

### Register B2: Garbage vehicle trip log (`garbage-trips`)

- **Title:** বর্জ্য পরিবহন গাড়ির ট্রিপ রেজিস্টার. **Section:** পরিচ্ছন্নতা শাখা. **Serial prefix:** `GT`.
- **Fields:** তারিখ, গাড়ি নং, চালকের নাম, ওয়ার্ড/রুট, ট্রিপ সংখ্যা, ডাম্পিং স্থান, জ্বালানি (লিটার), সুপারভাইজার.
- **Statuses:** এন্ট্রি → সুপারভাইজার যাচাইকৃত.
- **Roles:** create = `operator`, `conservancy`; advance = `conservancy`; cancel = `conservancy`.

### Generic pages

These pages read the config:

- `/registers/:key`: the book-style register page. Same ledger design as the trade licence register, with fiscal year, ward and date-range filters, totals in the footer, and an A4 landscape print button.
- `/registers/:key/new`: a form generated from `fields`, with validation.
- `/registers/:key/:id`: a detail page with status steps, an advance-status action for allowed roles (with the same `<role> হিসেবে দেখুন` helper), cancel with a reason, and a history timeline.

---

## 9. Pages and routes

Use `BrowserRouter`.

| Route | Page |
|---|---|
| `/login` | Role picker (title: `ডিজিটাল রেজিস্টার ব্যবস্থা`; subtitle about replacing paper register books) |
| `/` | Dashboard |
| `/trade-licence` | List with status tabs (with counts) and search; `নতুন আবেদন` button (operator only) |
| `/trade-licence/new` | Application form |
| `/trade-licence/:id` | Detail + workflow |
| `/trade-licence/:id/print` | Printable licence (A4 portrait) with QR code |
| `/register` | Trade licence register book |
| `/receipts` | Receipt list + daily collection summary |
| `/receipts/:id/print` | Printable money receipt |
| `/registers/:key`, `/registers/:key/new`, `/registers/:key/:id` | Generic register engine |
| `/search?q=` | Global search |
| `/audit-log` | Audit log |
| `/verify` | Public licence verification (no login required) |
| `/phase-2/:key` | Placeholder modules |

### Dashboard

Stat cards:

- ইস্যুকৃত লাইসেন্স (এ অর্থবছর)
- মোট আদায় (এ অর্থবছর)
- অপেক্ষমাণ আবেদন
- আজকের আদায়
- চালু নষ্ট বাতি (open street light faults)
- আজকের বর্জ্য ট্রিপ

Other sections:

- `আপনার অপেক্ষমাণ কাজ`: items waiting for the current role across all modules, each linking to the record.
- Charts (Recharts):
  - licences issued per month in the fiscal year;
  - open street light faults by ward;
  - average repair time in days.
- Recent activity: the last 8 audit entries.

### Trade licence register book (`/register`)

Book columns: ক্রমিক নং, লাইসেন্স নং, তারিখ, প্রতিষ্ঠানের নাম ও ঠিকানা, মালিক ও পিতার নাম, ব্যবসার ধরন, ওয়ার্ড, ফি (টাকা), রসিদ নং, মন্তব্য, অনুমোদনকারী.

- Only records that have a serial appear.
- Filters: fiscal year and ward.
- Footer: total entries and total fees.
- Print A4 landscape.

### Printable licence

- Header: `বগুড়া সিটি কর্পোরেশন`, then `ট্রেড লাইসেন্স`.
- Licence number, fiscal year, valid until 30 June, business and owner details, fee table, and signature lines.
- A **QR code** encoding a URL to `/verify` with query params: licence no, business name, owner name, valid until. The data lives in the URL, so scanning with a phone works without any shared data.

### Printable receipt

- Receipt number and `বই নং / পাতা`.
- Gregorian and Bangla calendar dates.
- Payer, fee lines, total, amount in Bangla words, payment mode and reference, and a cashier signature line.

### Search (`/search?q=`)

Search from the top bar. Search trade licences by business name, owner name, NID, mobile, licence number and holding number, and search generic register entries by any text field. Group the results by register.

### Audit log

Table columns: time, user, role, action, register/record (linked), note, and field changes (before → after).

- Filter by action and by register.
- Show a note on the page: entries cannot be edited or deleted.

### Verify page

Shows the licence details from the query params, with a green valid / red expired badge based on today's date. Add a note that the real system would check against the server.

### Phase 2 placeholders

Each placeholder page explains what the module will do and lists its planned register columns, with a `দ্বিতীয় ধাপ` badge. Create placeholders for:

- জন্ম-মৃত্যু রেজিস্টার
- হোল্ডিং কর
- সনদপত্র (নাগরিকত্ব / ওয়ারিশ)
- মার্কেট দোকান ভাড়া
- রিকশা/ভ্যান লাইসেন্স
- ইমারত নকশা অনুমোদন

### Sidebar groups

- **সাধারণ:** ড্যাশবোর্ড, অনুসন্ধান, কার্যক্রম লগ
- **রাজস্ব শাখা:** ট্রেড লাইসেন্স, ট্রেড লাইসেন্স রেজিস্টার, রসিদ, হোল্ডিং কর (দ্বিতীয় ধাপ), মার্কেট দোকান ভাড়া (দ্বিতীয় ধাপ)
- **বিদ্যুৎ শাখা:** সড়কবাতি মেরামত রেজিস্টার
- **পরিচ্ছন্নতা শাখা:** বর্জ্য পরিবহন ট্রিপ রেজিস্টার
- **অন্যান্য (দ্বিতীয় ধাপ):** জন্ম-মৃত্যু, সনদপত্র, রিকশা/ভ্যান লাইসেন্স, ইমারত নকশা

---

## 10. Seed data (`src/data/seed.ts`)

Export a `buildSeed()` function that returns consistent licences, receipts, register entries, sequences and audit entries. Use fixed dates.

For addresses, use these Bogura area names: সাতমাথা, ঠনঠনিয়া, জলেশ্বরীতলা, মালতিনগর, চেলোপাড়া, সূত্রাপুর, নামাজগড়, কালিতলা, বাদুড়তলা, ফুলবাড়ি, কামারগাড়ি, রহমাননগর.

- **Trade licences (~16):**
  - about 5 issued in FY 2025-26;
  - in FY 2026-27 (July–September 2026): about 6 issued, 2 approved, 2 verified, 2 submitted and 1 cancelled (with a reason).
  - Serials follow approval order. Every issued licence has a matching receipt.
- **Street light repairs (~15):** spread across wards, with a mix of all three statuses, and repair dates 1–6 days after the report.
- **Garbage trips (~15):** recent days, several vehicles and drivers, mostly verified with a few still at `এন্ট্রি`.
- **Audit entries** are generated for every seeded step, with correct users and timestamps.

All personal data must be clearly fictional.

---

## 11. Code structure

```
src/
  main.tsx, App.tsx, index.css
  types.ts
  lib/bn.ts, lib/fiscal.ts, lib/search.ts
  data/seed.ts                      # business types, wards, users, buildSeed()
  registers/types.ts
  registers/streetlight-repair.ts
  registers/garbage-trips.ts
  registers/index.ts                # registry of all configs
  store/useStore.ts                 # zustand + persist, key "bogcc-demo-v1"
  components/
    Layout.tsx, Sidebar.tsx, TopBar.tsx, DemoBanner.tsx
    StatusBadge.tsx, Stamp.tsx, WorkflowSteps.tsx, Timeline.tsx, RoleHandoff.tsx
    LedgerTable.tsx                 # shared book-style table used by all registers
    ui/ Button, Card, Input, Select, Textarea, Field, Dialog, Tabs, EmptyState
  pages/
    Login, Dashboard, Search, AuditLog, Verify, Phase2
    trade-licence/ List, New, Detail, PrintLicence, Register
    receipts/ List, PrintReceipt
    registers/ RegisterBook, RegisterNew, RegisterDetail
```

### Store actions

`login`, `logout`, `switchRole`, `createLicence`, `verifyLicence`, `approveLicence`, `collectFee`, `cancelLicence`, `createEntry`, `advanceEntry`, `cancelEntry`, `resetDemo`.

Every action writes an audit entry containing: timestamp, user name, role, action, record type/key, record id and label, note, and field changes.

Put a `<Toaster />` (sonner) in `App.tsx`. If there is no session, redirect to `/login`. The exceptions are `/verify` and the print routes, which can be opened directly.

---

## 12. Build phases

Run `npm run build` at the end of each phase and fix everything before continuing.

1. **Foundation:**
   - theme tokens, fonts, and the `bn` and `fiscal` helpers;
   - types, seed data and the store;
   - Layout, Sidebar, TopBar, DemoBanner;
   - Login and role switcher, and reset demo.
2. **Trade licence:**
   - list, new form, detail with workflow and role handoff;
   - fee calculation;
   - receipts list;
   - licence and receipt print pages;
   - `/verify` page with QR.
3. **Register book:**
   - `LedgerTable` and stamps;
   - `/register` page with filters, totals and landscape print.
4. **Generic register engine:**
   - config types and the two configs;
   - RegisterBook / New / Detail pages;
   - seed entries.
5. **Cross-cutting:**
   - dashboard with charts and pending work;
   - global search, audit log, Phase 2 placeholders.
6. **Polish:**
   - mobile drawer;
   - check at 1366×768;
   - print checks (including the Chrome print preview);
   - empty states;
   - keyboard focus.
7. **README.md** (see below), then a final `npm run build`.

---

## 13. README.md contents

Write a README with these sections:

1. **What this is:** a demo, fictional data, no backend.
2. **Run locally:** `npm install`, `npm run dev`, `npm run build`, `npm run preview`.
3. **Deploy to Vercel:**
   1. Push to GitHub.
   2. Import the repo on vercel.com (Vite is detected automatically).
   3. Build command `npm run build`, output folder `dist`.
   4. `vercel.json` handles route refreshes.
4. **How to add a new register:** create a config file in `src/registers/`, add it to `registers/index.ts`, add seed entries, and add a sidebar link.
5. **5-minute presentation script:**
   1. Log in as ডাটা এন্ট্রি অপারেটর and create a trade licence application.
   2. Click `লাইসেন্স পরিদর্শক হিসেবে দেখুন` and verify it.
   3. Switch to লাইসেন্স অফিসার and approve it (the serial number appears).
   4. Switch to হিসাবরক্ষক, collect the fee, and print the receipt (amount in Bangla words).
   5. Print the licence and scan its QR code with a phone.
   6. Open the ট্রেড লাইসেন্স রেজিস্টার and print a page that looks like the paper book.
   7. Log a street light complaint, then switch to ইলেকট্রিশিয়ান and mark it repaired.
   8. Show the garbage trip register.
   9. Search for a name or NID.
   10. Open the কার্যক্রম লগ ("who did what, when").
   11. Switch to প্রধান নির্বাহী কর্মকর্তা and show the dashboard.
6. **Next steps for the real system:** Laravel backend, real user accounts, server-side audit, and a Bangla/English toggle.

---

## 14. Definition of done

- [ ] `npm run build` passes with no TypeScript errors.
- [ ] The full trade licence flow works end to end, using only the role switcher.
- [ ] Both generic registers work: create, advance, cancel, book view and print.
- [ ] All numbers display in Bangla digits; the Bangla calendar date and amount in words are correct.
- [ ] Nothing can be deleted; cancelled records stay visible with the বাতিল stamp.
- [ ] Every action appears in the audit log.
- [ ] Refreshing any route keeps the data (localStorage) and works on Vercel (`vercel.json`).
- [ ] `ডেমো রিসেট` restores the seed data.
- [ ] Print views look clean, and the register prints in landscape.
- [ ] Usable on mobile and at 1366×768.

When finished, give a short summary of what was built, any deviations from this spec, and suggested follow-ups.