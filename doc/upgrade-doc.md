# Build Spec v2: Bogura City Corporation Digital Service & Register System (Demo)

You are building a **high-quality demo web application** in this Vite + React + TypeScript project. It will be shown to the **Mayor / Administrator (মেয়র / প্রশাসক)** of Bogura City Corporation, so it must feel complete, polished and convincing from end to end.

Read this whole file before writing any code. Then build phase by phase (section 16). Run `npm run build` after each phase and fix every error before continuing.

If the project already contains code from an earlier spec, **extend and refactor it**. Do not throw away work that already matches this spec.

---

## 1. The story this demo must tell

Today, city corporation staff record every service by hand in **paper register books** (রেজিস্টার খাতা). Citizens have to visit the office repeatedly just to learn the status of their application.

This demo shows one connected system with two faces:

1. **Office side (অফিস):** staff at every desk (data entry, inspection, approval, accounts, electricians, conservancy, ward councillors) do their daily work digitally. Every entry becomes a line in a **digital register book** that looks and prints like the paper one.
2. **Citizen side (নাগরিক কর্নার):** citizens read the citizen charter, apply online, submit complaints with a photo, **track progress step by step**, receive SMS-style updates, pay fees online, download certificates, verify documents with a QR code, and rate the service.

On top of both sits a **Mayor dashboard** (মেয়র ড্যাশবোর্ড). It gives a live view of the whole city: services delivered, on-time percentage, revenue, open complaints by ward, section performance and citizen satisfaction.

**The key "wow" moment:** the presenter opens the Citizen Corner in one browser window and the Office in another, side by side. A citizen submits a complaint, it appears instantly in the office, staff act on it, and the citizen's tracking page and the Mayor dashboard update live.

---

## 2. Tech stack and constraints

Already installed:

- Vite, React, TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `react-router-dom`, `zustand` (with `persist`), `lucide-react`, `recharts`, `qrcode.react`, `sonner`
- The `@/` alias points to `./src`

Constraints:

- **No backend, no database, no external APIs, no paid services.** It is hosted on Vercel as a static site.
- All data lives in one zustand store persisted to `localStorage` (key `bogcc-demo-v2`).
- **Cross-tab live sync:** listen to the `window` `storage` event and call `useStore.persist.rehydrate()`, so two open windows update each other within about a second. This is essential for the side-by-side demo.
- `vercel.json` at the root:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- Avoid new dependencies. If a map or other heavy library is tempting, don't use it; use the SVG ward grid described below instead.

---

## 3. Hard rules

1. **All data is fictional.** Names, NIDs, phones and businesses are invented. Never use real businesses or real people. Real Bogura area names are allowed in addresses.
2. **Nothing is ever deleted.** Records are *cancelled* (বাতিল) with a mandatory reason and stay visible.
3. **Every action writes an append-only audit entry.** There is no UI to edit or delete the log.
4. **Serial numbers** are sequential per register per fiscal year, with no gaps.
5. **Bangla first:** all UI text is Bangla, and all displayed numbers use Bangla digits.
6. **A demo banner** appears on every non-print page: `ডেমো সংস্করণ: সকল তথ্য কাল্পনিক`. The payment screen must also say clearly that no real money is involved.
7. **No real OTP or SMS.** OTP codes and SMS messages are simulated and shown on screen, clearly labelled `ডেমো`.
8. `npm run build` must pass.

---

## 4. Helpers (`src/lib/`)

### `bn.ts`

| Function | Behaviour |
|---|---|
| `toBnDigits(v)` | Converts digits to Bangla digits. |
| `bnToEnDigits(s)` | Converts Bangla digits to English; use it on all numeric inputs so Bangla typing works. |
| `formatTaka(n)` | e.g. `৳১,২৫,০০০`, using Indian grouping. |
| `formatDateBn(iso)` | Bangla Gregorian date. |
| `formatDateTimeBn(iso)` | Bangla Gregorian date with time. |
| `timeAgoBn(iso)` | e.g. `৫ মিনিট আগে`. |
| `banglaCalendarDate(iso)` | Revised Bangladesh calendar (rules below). |
| `amountInWords(n)` | Bangla words using কোটি/লক্ষ/হাজার/শত, ending `টাকা মাত্র`. |

Rules for `banglaCalendarDate`:

- 1 Boishakh = 14 April.
- The first six months have 31 days each.
- Kartik, Agrahayan, Poush, Magh and Chaitra have 30 days each.
- Falgun has 29 days, or 30 when the Gregorian year in which that Falgun falls is a leap year.
- Bangabda = Gregorian year − 593 from 14 April onward (− 594 before 14 April).

### Other helpers

- **`fiscal.ts`:** July–June fiscal year (`"2026-27"`), `validUntil(fy)` returns 30 June, `currentFiscalYear()`.
- **`sla.ts`:** `dueDate(createdAt, days)` counting working days (skip Friday and Saturday); `isOverdue(record)`; `slaStatus(record)` returns `on-time`, `due-soon` or `overdue`.
- **`ids.ts`:** tracking numbers `BOGCC-2026-000123`; register serials; receipt numbers with `বই নং / পাতা` (100 leaves per book).
- **`csv.ts`:** export an array to CSV with a UTF-8 BOM (so Excel shows Bangla correctly) and trigger a download.
- **`image.ts`:** compress an uploaded photo in a canvas to max 800 px, JPEG quality about 0.7, stored as a data URL. Reject files over 5 MB.
- **`random.ts`:** a seeded PRNG (mulberry32) for deterministic seed data.

---

## 5. Design system

The office side should feel like a serious, trustworthy government tool. The Citizen Corner should be friendly, mobile-first, with large touch targets and simple language. Both share one palette.

### Color tokens

Define these as Tailwind v4 `@theme` tokens:

| Token | Hex | Use |
|---|---|---|
| forest-700 (primary) | `#0E5A43` | Sidebar, primary buttons |
| forest-800 | `#0A4232` | Hover/active states |
| forest-50 | `#EEF6F2` | Soft highlights |
| paper | `#F4F6F3` | App background |
| page | `#FFFFFC` | Register pages, printed documents |
| ink | `#1C2B27` | Main text |
| muted | `#5E6E69` | Secondary text |
| rule | `#CFDBEA` | Ledger ruled lines |
| margin | `#E8A0A0` | Ledger margin line |
| stamp | `#B3261E` | Stamps, cancelled, overdue |
| amber | `#C27C0E` | Pending, due soon, demo banner |
| sky | `#1D6FA3` | Info, online channel |

### Fonts

Load in `index.html`: **Hind Siliguri** (body) and **Tiro Bangla** (headings, register titles, certificates, stamps). Set `<html lang="bn">`.

### Signature elements

- **Register book page:**
  - ruled blue lines;
  - a red margin line;
  - a book-style header block (register name, section, fiscal year, ward);
  - a rubber-`Stamp` component (rotated −6°, double border, stamp red): `অনুমোদিত`, `বাতিল`, `নিষ্পন্ন`.
  - Cancelled rows are struck through.
- **Progress tracker:** a clear vertical stepper for citizens and a horizontal one for staff, both using the same steps. Show a timestamp and responsible desk under each completed step, and the expected date under pending steps.
- **Ward map:** a stylised SVG grid of 21 tiles labelled ওয়ার্ড ১–২১. Tiles are coloured by a chosen metric; clicking one drills into that ward. Say clearly that it is schematic, not geographic.

### Rules

- Keep decoration minimal: no gradients, no scattered animations, no all-caps labels. Use one tasteful page-load moment at most, on the Mayor presentation mode.
- Office pages must work at 1366×768.
- Citizen Corner is mobile-first (test at 375 px).
- Visible keyboard focus; respect `prefers-reduced-motion`.

### Print

- Print views hide the app chrome.
- Registers print A4 landscape using a named `@page`.
- Licences, certificates and receipts print A4 portrait.

---

## 6. Users and roles

Office login is a **role picker** (no passwords). Each role has a fictional person. The top bar has an instant role switcher.

| Role key | Bangla title | Main work |
|---|---|---|
| `operator` | ডাটা এন্ট্রি অপারেটর | Walk-in applications, register entries |
| `inspector` | লাইসেন্স পরিদর্শক | Field verification (trade licence) |
| `licenceOfficer` | লাইসেন্স অফিসার | Approve or cancel trade licences |
| `accounts` | হিসাবরক্ষক / ক্যাশিয়ার | Fee collection, receipts, daily cash |
| `revenueOfficer` | রাজস্ব কর্মকর্তা | Holding tax demands and collection |
| `electrician` | ইলেকট্রিশিয়ান | Street light repairs |
| `conservancy` | পরিচ্ছন্নতা পরিদর্শক | Garbage complaints, vehicle trips |
| `councillor` | ওয়ার্ড কাউন্সিলর | Approves citizenship/warish certificates for their ward (demo user: Ward 5) |
| `ceo` | প্রধান নির্বাহী কর্মকর্তা | Oversight, reports, notices |
| `mayor` | মেয়র / প্রশাসক | Mayor dashboard, presentation mode |

- The **Citizen Corner** needs no role. A citizen identifies with a mobile number and a simulated OTP.
- A **public landing page** at `/` offers two big entry points, `নাগরিক কর্নার` and `অফিস লগইন`, plus a short strip of live public stats.

---

## 7. Service catalogue (citizen charter)

`src/data/services.ts` defines every service once. Both the office and the Citizen Corner use it. Mark fees and times as **demo values** (`ডেমো হার`).

| Service | Key | Charter time | Fee | Handled by |
|---|---|---|---|---|
| নতুন ট্রেড লাইসেন্স | `tl-new` | ৭ কর্মদিবস | by business type | Module A |
| ট্রেড লাইসেন্স নবায়ন | `tl-renew` | ৩ কর্মদিবস | by business type | Module A |
| হোল্ডিং কর পরিশোধ | `holding-pay` | তাৎক্ষণিক | as billed | Module B |
| সড়কবাতি অভিযোগ | `streetlight` | ৩ কর্মদিবস | free | Module C |
| বর্জ্য/পরিচ্ছন্নতা অভিযোগ | `garbage` | ২ কর্মদিবস | free | Module C |
| নাগরিকত্ব সনদ | `cert-citizen` | ২ কর্মদিবস | ৳১০০ | Module C |
| ওয়ারিশ সনদ | `cert-warish` | ৭ কর্মদিবস | ৳২০০ | Module C |
| জন্ম-মৃত্যু নিবন্ধন | `bdris` | national system | — | Info page only |

Each service entry includes: key, name, description, charter days, fee rule, required documents list, responsible section, the internal status list, and a mapping from internal statuses to **citizen-friendly step labels**.

The birth/death registration entry is an info page only. It explains that registration happens in the national BDRIS system (external link to `https://bdris.gov.bd`), and that in the real system the city corporation would keep a reference register keyed by the 17-digit registration number.

---

## 8. Common record model

Every service request, whether a licence, complaint, certificate or payment, shares these base fields. This lets tracking, SLA, dashboards, search and audit work across everything:

```ts
interface BaseRecord {
  id: string;
  serviceKey: string;
  trackingNo: string;          // BOGCC-2026-000123, shown to citizens
  channel: 'office' | 'online';
  applicantName: string;
  applicantMobile: string;     // used for citizen tracking and SMS
  ward: number;                // 1-21
  status: string;              // internal status key
  history: {
    status: string;
    at: string;
    byName: string;
    byRole: string;
    note?: string;
  }[];
  createdAt: string;
  dueAt: string;               // from charter days
  closedAt?: string;
  serial?: number;             // register serial when assigned
  registerNo?: string;
  cancelled?: { at: string; by: string; reason: string };
  feedback?: { rating: 1 | 2 | 3 | 4 | 5; comment?: string; at: string };
}
```

The store also holds: `receipts`, `payments`, `holdings`, `notifications` (SMS log), `notices`, `auditLog`, `sequences`, `session`, and `seedDate`.

---

## 9. Module A: Trade licence (new + renewal)

### Statuses

| Internal status | Citizen label |
|---|---|
| `submitted` | আবেদন গৃহীত |
| `verified` | মাঠ পর্যায়ে যাচাই সম্পন্ন |
| `approved` | অনুমোদিত, ফি পরিশোধ করুন |
| `issued` | লাইসেন্স প্রস্তুত |
| `cancelled` | বাতিল (কারণসহ) |

### Flow

1. **Application**, either by the operator at the desk (`channel: office`) or online by a citizen (`channel: online`).
   - Business: name (Bangla + English), type, nature (একক/অংশীদারি/কোম্পানি), address, area, ward, holding number.
   - Owner: name, father, mother, NID (10/13/17 digits), mobile (11 digits starting `01`).
   - Validate every field and show a live fee preview.
2. **Inspector** adds a verification note (and optionally a photo) and clicks `যাচাই সম্পন্ন করুন`.
3. **Licence officer** clicks `অনুমোদন দিন`. Only now are the **register serial** and **licence number** assigned (`BOGCC/TL/2026-27/00013`). Alternatively `বাতিল করুন` with a mandatory reason.
4. **Fee payment**, either way:
   - the citizen pays online through the mock gateway (section 11); or
   - accounts collects at the counter (নগদ / বিকাশ / ব্যাংক + reference).
   Both issue a **money receipt** with `বই নং / পাতা`, and the status becomes `issued`.
5. **Renewal:** a citizen or operator enters an existing licence number. The system pre-fills the details, calculates the next fiscal year fee (add a 10% late surcharge if after 30 September, labelled demo), and follows the same approval flow with a shortened inspection step (auto-verified). Renewals appear in the register with a `নবায়ন` remark.

### Fees

Fees come from about 10 business types (demo rates): মুদি দোকান, ঔষধের দোকান, রেস্তোরাঁ, কাপড়ের দোকান, ইলেকট্রনিক্স, দই-মিষ্টির দোকান, মোবাইল সার্ভিসিং, ওয়ার্কশপ, কোচিং সেন্টার, পাইকারি ব্যবসা.

Fee lines: লাইসেন্স ফি, সাইনবোর্ড কর, ভ্যাট (লাইসেন্স ফির ১৫%), আবেদন ফরম ও বই মূল্য.

### Staff detail page

- Horizontal progress stepper.
- SLA badge (সময়মতো / শীঘ্রই মেয়াদ শেষ / মেয়াদোত্তীর্ণ).
- Details, fee table and history timeline.
- Action buttons **only for the role that acts next**.
- When the current role cannot act, show who acts next and a one-click **`<role> হিসেবে দেখুন`** button that switches role.
- When the licence is issued, show buttons to print the licence and the receipt.

### Printables

- **Licence (A4 portrait):** header `বগুড়া সিটি কর্পোরেশন` / `ট্রেড লাইসেন্স`, licence number, fiscal year, valid until 30 June, details, fees and signature lines.
- A **QR code** that encodes a `/verify` URL containing the key details as query params (licence no, business name, owner name, valid until, type `tl`). Scanning with a phone therefore works without shared data.

---

## 10. Module B: Holding tax

- **Holdings seed:** about 60 holdings across wards. Each has: holding number (`W05-0123`), owner, address, property type (আবাসিক / বাণিজ্যিক / মিশ্র), floors, and annual valuation.
- **Yearly bill (demo rates on annual valuation):**
  - হোল্ডিং কর 7%
  - পরিচ্ছন্নতা রেট 3%
  - সড়কবাতি রেট 2%
  Split into four quarterly instalments. Some holdings have arrears; add a 5% surcharge on arrears (demo).
- **Citizen:** search by holding number and see owner, bill breakdown, paid and due. Pay a chosen instalment or the full amount through the mock gateway. A receipt is issued.
- **Office (revenue officer, accounts):** holding register (book style), collection register, a defaulter list with total arrears per ward, and a **counter collection** form.
- **Mayor dashboard:** holding tax collection vs demand for the fiscal year.

---

## 11. Mock payment gateway (`/pay/:paymentId`)

A realistic but clearly fake checkout page, with a big `ডেমো পেমেন্ট: কোনো আসল টাকা লেনদেন হবে না` notice.

1. Choose a method: bKash / Nagad / card. Use neutral labelled buttons; **do not use official logos**.
2. Enter a mobile number and a fake PIN (any 4–5 digits).
3. Show a short "processing" state.
4. Success: generate a transaction id, mark the payment as paid, create the receipt, advance the linked record, and send an SMS to the applicant.

Also provide a `ব্যর্থ পেমেন্ট দেখান` toggle to demonstrate the failure path (the citizen can retry).

Online payments appear in the accounts daily collection report with channel `অনলাইন`.

---

## 12. Module C: Config-driven register engine

Street light complaints, garbage complaints, garbage trips and certificates all use **one generic engine**. A new register is just a new config file.

### `src/registers/types.ts`

```ts
type FieldType =
  | 'text' | 'number' | 'date' | 'ward' | 'select'
  | 'textarea' | 'phone' | 'nid' | 'photo' | 'heirs';

interface RegisterField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  showInBook?: boolean;       // show as a column in the register book
  citizenInput?: boolean;     // shown on the citizen form
  staffOnly?: boolean;        // filled by staff during processing
}

interface RegisterStep {
  key: string;
  label: string;              // staff label
  citizenLabel: string;       // shown to citizens
  actors: Role[];             // who can move a record INTO this step
  requiredFields?: string[];  // staff fields that must be filled at this step
}

interface RegisterConfig {
  key: string;
  serviceKey?: string;        // links to the service catalogue if citizen-facing
  title: string;
  section: string;
  serialPrefix: string;
  fields: RegisterField[];
  steps: RegisterStep[];      // the first step is set on creation
  createRoles: Role[];
  cancelRoles: Role[];
  citizenFacing: boolean;
  wardScoped?: boolean;       // councillor sees only their ward
  printable?: 'certificate';  // shows a printable certificate at the final step
  dateField: string;
}
```

Serials for engine registers are assigned **on creation**: the moment a line would be written in the paper book.

### C1: Street light complaint and repair (`streetlight`)

- **Section:** বিদ্যুৎ শাখা. **Citizen-facing:** yes.
- **Fields:** খুঁটি নং (optional for citizens), ওয়ার্ড, রাস্তা/এলাকা, সমস্যার ধরন (বাতি নষ্ট / তার ছেঁড়া / খুঁটি হেলে গেছে / সুইচ নষ্ট), ছবি, বিবরণ, অভিযোগকারীর নাম ও মোবাইল. Staff-only: নিযুক্ত মিস্ত্রি, মেরামতের তারিখ, ব্যবহৃত মালামাল.
- **Steps:**

| Step | Staff label | Citizen label | Actors / required fields |
|---|---|---|---|
| 1 | অভিযোগ গৃহীত | অভিযোগ গৃহীত | (on creation) |
| 2 | মিস্ত্রি নিযুক্ত | মিস্ত্রি পাঠানো হয়েছে | operator / licenceOfficer |
| 3 | মেরামত সম্পন্ন | সমস্যার সমাধান হয়েছে | electrician; needs repair date and materials, optional "after" photo |

### C2: Garbage / cleanliness complaint (`garbage`)

- **Section:** পরিচ্ছন্নতা শাখা. **Citizen-facing:** yes.
- **Fields:** ওয়ার্ড, এলাকা/ল্যান্ডমার্ক, সমস্যার ধরন (ময়লা জমে আছে / ডাস্টবিন উপচে পড়ছে / ড্রেন বন্ধ / মৃত প্রাণী), ছবি, বিবরণ, নাম ও মোবাইল. Staff-only: নিযুক্ত দল, সমাধানের তারিখ.
- **Steps:** অভিযোগ গৃহীত → পরিচ্ছন্নতা দল পাঠানো হয়েছে → পরিষ্কার সম্পন্ন (with an "after" photo). Actor: `conservancy`.

### C3: Garbage vehicle trip log (`garbage-trips`)

- **Section:** পরিচ্ছন্নতা শাখা. **Citizen-facing:** no.
- **Fields:** তারিখ, গাড়ি নং, চালক, ওয়ার্ড/রুট, ট্রিপ সংখ্যা, ডাম্পিং স্থান, জ্বালানি (লিটার), সুপারভাইজার.
- **Steps:** এন্ট্রি → সুপারভাইজার যাচাইকৃত.

### C4: Citizenship certificate (`cert-citizen`)

- **Citizen-facing:** yes. **Ward-scoped:** yes. **Fee:** ৳১০০.
- **Fields:** নাম, পিতা, মাতা, জন্ম তারিখ, NID/জন্ম নিবন্ধন নং, ঠিকানা, ওয়ার্ড, মোবাইল.
- **Steps:** আবেদন গৃহীত → ফি পরিশোধিত (payment) → কাউন্সিলর অনুমোদিত (councillor of that ward) → সনদ প্রস্তুত.
- **Printable certificate** with a QR code to `/verify` (type `cert`).

### C5: Warish (inheritance) certificate (`cert-warish`)

- Same flow as C4, with a **heirs table** field: name, relation, age.
- The certificate prints the full heirs list.
- A verification step by the operator happens before the councillor approves.

### Generic office pages (for every register)

- `/office/registers/:key`: book-style register with:
  - fiscal year, ward, date range and status filters;
  - an SLA column;
  - footer totals;
  - A4 landscape print;
  - CSV export.
- `/office/registers/:key/new`: form generated from the config (walk-in entry).
- `/office/registers/:key/:id`: detail page with:
  - the stepper and SLA badge;
  - photos (before/after);
  - the action for the next step, with its required fields;
  - the role handoff button;
  - cancel with a reason;
  - the history timeline.

---

## 13. Citizen Corner (নাগরিক কর্নার), under `/nagorik`

Mobile-first, simple language, large buttons. A persistent bottom navigation bar on mobile with four tabs: হোম · সেবা · ট্র্যাক · বার্তা.

### Pages

1. **Home (`/nagorik`):**
   - welcome;
   - big action tiles: আবেদন করুন, অভিযোগ করুন, আবেদন ট্র্যাক করুন, হোল্ডিং কর দিন, সনদ যাচাই;
   - latest notices;
   - "এই মাসে আমরা" public stats (services delivered, complaints solved, average solve time).
2. **Citizen charter (`/nagorik/services`):** every service from the catalogue: description, charter time, fee, required documents, and an `আবেদন করুন` button.
3. **Apply (`/nagorik/apply/:serviceKey`):**
   - a step-by-step form (info → documents/photo → review → submit);
   - photo upload with compression;
   - document fields are simulated: file-name chips only, no real storage needed.
   - On submit, show a big confirmation with the **tracking number**, a copy button, and the note "এসএমএস পাঠানো হয়েছে (ডেমো)".
4. **Track (`/nagorik/track`):**
   - Enter tracking number + mobile, or "আমার সব আবেদন", which asks for a mobile, shows a simulated OTP on screen, then lists all of that mobile's requests.
   - The tracking page shows:
     - service name and submitted date;
     - a **vertical stepper** with citizen labels, timestamps and the responsible desk;
     - the expected completion date (charter) with an on-time / delayed indicator;
     - staff notes marked public (e.g. "আগামীকাল মিস্ত্রি যাবেন");
     - before/after photos;
     - a **pay** button when payment is due;
     - **download/print** buttons when a licence, certificate or receipt is ready;
     - the cancellation reason if cancelled.
   - Once complete, prompt for a **1–5 star rating and comment**, saved to the record.
5. **Messages (`/nagorik/messages`):** a simulated SMS inbox for the logged-in mobile. Show every status change as an SMS-style bubble, e.g. `আপনার অভিযোগ BOGCC-2026-000123: সমস্যার সমাধান হয়েছে। ধন্যবাদ, বগুড়া সিটি কর্পোরেশন`.
6. **Holding tax (`/nagorik/holding`):** search a holding, see dues, and pay.
7. **Verify (`/verify`):** public page that reads query params and shows a licence or certificate as valid / expired / cancelled. Add a note that the real system checks the server.
8. **Notices (`/nagorik/notices`):** public notice board.
9. **My ward (`/nagorik/ward/:n`):** councillor name (fictional), office hours, a phone placeholder, and the ward's open-complaint count.

### Rules

- A citizen can only see requests matching their mobile.
- Staff-only fields and internal notes are never shown to citizens. Staff choose, per note, whether it is public.

---

## 14. Office side, under `/office`

### Layout

- **Left sidebar grouped by section:**
  - সাধারণ: ড্যাশবোর্ড, আমার কাজ, অনুসন্ধান, নোটিশ, রিপোর্ট, কার্যক্রম লগ
  - রাজস্ব শাখা: ট্রেড লাইসেন্স, ট্রেড লাইসেন্স রেজিস্টার, হোল্ডিং কর, রসিদ ও দৈনিক আদায়
  - বিদ্যুৎ শাখা: সড়কবাতি রেজিস্টার
  - পরিচ্ছন্নতা শাখা: অভিযোগ রেজিস্টার, গাড়ির ট্রিপ রেজিস্টার
  - সনদপত্র: নাগরিকত্ব সনদ, ওয়ারিশ সনদ
  - দ্বিতীয় ধাপ (placeholders): জন্ম-মৃত্যু রেফারেন্স রেজিস্টার, মার্কেট দোকান ভাড়া, রিকশা/ভ্যান লাইসেন্স, ইমারত নকশা অনুমোদন
- **Top bar:** global search, a notification bell (new online submissions and overdue items for this role), the role switcher, and `ডেমো রিসেট`.

### Pages

- **Dashboard (`/office`):** a role-aware home.
  - `আমার অপেক্ষমাণ কাজ`, sorted by SLA urgency.
  - Today's numbers for this role's section.
  - Recent activity.
  - New online submissions get a `অনলাইন` badge.
- **My work (`/office/tasks`):** one inbox across all modules for the current role, with filters. Overdue items are highlighted.
- **Trade licence pages:** list with status tabs and counts, new, renewal, detail, and print, as in Module A.
- **Trade licence register (`/office/register/trade-licence`):** book columns: ক্রমিক নং, লাইসেন্স নং, তারিখ, প্রতিষ্ঠানের নাম ও ঠিকানা, মালিক ও পিতার নাম, ব্যবসার ধরন, ওয়ার্ড, ফি, রসিদ নং, মন্তব্য (নতুন/নবায়ন), অনুমোদনকারী.
- **Receipts & daily collection:**
  - receipt list;
  - daily summary by channel (counter/online) and by head (trade licence, holding tax, certificates);
  - a printable daily cash statement (দৈনিক আদায় বিবরণী).
- **Reports (`/office/reports`):**
  - monthly summary per service: received, completed, on-time %, revenue;
  - ward-wise summary;
  - fiscal year selector;
  - print and CSV export.
- **Notices:** `ceo`, `mayor` and `licenceOfficer` can post a notice (title, body, date). Notices appear in the Citizen Corner immediately (cross-tab sync).
- **Search (`/office/search?q=`):** across all modules by name, mobile, NID, tracking number, licence number and holding number. Results are grouped.
- **Audit log:** time, user, role, action, record (linked), note and field changes, filterable. A note says entries cannot be edited or deleted.

---

## 15. Mayor dashboard, under `/office/mayor` (the showpiece)

Visible to `mayor` and `ceo`. It is the default page when logged in as mayor.

### KPI row

- এ মাসে সেবা প্রদান
- সময়মতো সেবা (%), meaning within charter time
- মোট রাজস্ব (অর্থবছর)
- অনলাইন আবেদন (%)
- অমীমাংসিত অভিযোগ
- নাগরিক সন্তুষ্টি (★ average)

Each KPI shows its change vs last month.

### Other panels

- **Ward map:** the 21-tile SVG grid. A metric switcher recolours it: open complaints / revenue / average solve time. Clicking a ward opens the ward drill-down (`/office/mayor/ward/:n`): KPIs, open items, councillor and recent activity for that ward.
- **Charts:**
  - monthly revenue by head (stacked bars);
  - requests by channel (office vs online) over months;
  - complaints received vs resolved;
  - average processing days vs charter days per service.
- **Overdue list:** SLA-breached items with section, days overdue, and responsible role.
- **Section performance table:** per section: received, completed, on-time %, average days, average rating.
- **Citizen voice:** the latest ratings and comments.
- **Paper saved (কাগজ সাশ্রয়):** total register entries and an estimate of paper pages not written. Label it clearly as an estimate.
- **Live activity feed:** updates live via cross-tab sync.

### Presentation mode

`/office/mayor/present`: a full-screen, large-type, TV-friendly view.

- It cycles every 10 seconds through: KPIs, ward map, revenue, and citizen voice.
- Pause/next controls.
- It updates live when actions happen in another window.

---

## 16. Demo guide (for the presenter)

A floating `ডেমো গাইড` button, available on both the office side and the Citizen Corner, opens a side panel with a scripted checklist. Each step has a `এখানে যান` button that sets the right role (or citizen mobile) and navigates to the right page. Steps tick automatically when the action is detected in the store.

Script:

1. **Citizen:** open the Citizen Corner and read the citizen charter.
2. **Citizen:** submit a street light complaint with a photo (ward 5) and get a tracking number.
3. **Office (operator):** see it appear with an `অনলাইন` badge and assign the electrician.
4. **Office (electrician):** mark it repaired with an "after" photo.
5. **Citizen:** check tracking: every step done, the SMS arrived. Give a 5-star rating.
6. **Citizen:** apply for a new trade licence online.
7. **Office:** inspector verifies, then licence officer approves (the serial number appears in the register).
8. **Citizen:** pay the fee with the mock gateway, then download the licence and scan its QR.
9. **Office:** open the trade licence register and print a page that looks like the paper book.
10. **Office:** apply for a citizenship certificate, then approve it as the ward councillor and print it.
11. **Office:** show the daily collection, including online payments.
12. **Mayor:** open the Mayor dashboard, click ward 5 on the ward map, then open presentation mode.
13. **Office:** show the audit log ("who did what, when").

Also give the panel a `পাশাপাশি দেখান` tip explaining how to open `/nagorik` and `/office` in two windows side by side.

---

## 17. Seed data (`src/data/seed.ts`)

- `buildSeed(today)` generates data **relative to the current date** (the last 14 months) using the seeded PRNG, so the dashboards look alive whenever the demo is shown. Store `seedDate`. `ডেমো রিসেট` calls `buildSeed(new Date())`.
- **Area names** for addresses: সাতমাথা, ঠনঠনিয়া, জলেশ্বরীতলা, মালতিনগর, চেলোপাড়া, সূত্রাপুর, নামাজগড়, কালিতলা, বাদুড়তলা, ফুলবাড়ি, কামারগাড়ি, রহমাননগর.
- **Volumes (approximate):**
  - 45 trade licences (new + renewal; mixed statuses; about 40% online; 2 cancelled);
  - 60 holdings with payments and arrears;
  - 35 street light complaints;
  - 30 garbage complaints;
  - 40 vehicle trips;
  - 20 citizenship certificates;
  - 8 warish certificates;
  - 10 notices.
- **Mix:** mostly on time, with **5–8 overdue items** so the SLA features have something to show. Different wards should differ noticeably, so the ward map has contrast.
- **Consistency:** receipts, payments, SMS notifications, feedback ratings (average around 4.2) and audit entries must all match the record histories.
- **A demo citizen:** mobile `01700000000` with 4 requests at different stages, for quick tracking demos.
- All personal data is obviously fictional.

---

## 18. Routes summary

| Area | Routes |
|---|---|
| Public | `/` (landing), `/verify`, `/pay/:paymentId` |
| Citizen | `/nagorik`, `/nagorik/services`, `/nagorik/apply/:serviceKey`, `/nagorik/track`, `/nagorik/track/:trackingNo`, `/nagorik/messages`, `/nagorik/holding`, `/nagorik/notices`, `/nagorik/ward/:n` |
| Office auth | `/office/login` |
| Office | `/office`, `/office/tasks`, `/office/search`, `/office/notices`, `/office/reports`, `/office/audit-log` |
| Trade licence | `/office/trade-licence`, `/office/trade-licence/new`, `/office/trade-licence/renew`, `/office/trade-licence/:id`, `/office/register/trade-licence` |
| Holding tax | `/office/holding`, `/office/holding/:holdingNo`, `/office/holding/defaulters` |
| Receipts | `/office/receipts`, `/office/receipts/daily` |
| Engine | `/office/registers/:key`, `/office/registers/:key/new`, `/office/registers/:key/:id` |
| Mayor | `/office/mayor`, `/office/mayor/ward/:n`, `/office/mayor/present` |
| Printables | `/print/licence/:id`, `/print/receipt/:id`, `/print/certificate/:id`, `/print/daily/:date` |
| Phase 2 | `/office/phase-2/:key` |

Office routes redirect to `/office/login` when there is no session. Citizen, public and print routes do not need a login.

---

## 19. Suggested code structure

```
src/
  main.tsx, App.tsx, index.css, types.ts
  lib/ bn.ts fiscal.ts sla.ts ids.ts csv.ts image.ts random.ts search.ts
  data/ services.ts businessTypes.ts users.ts wards.ts seed.ts
  registers/ types.ts streetlight.ts garbage.ts garbageTrips.ts
             certCitizen.ts certWarish.ts index.ts
  store/ useStore.ts            # zustand + persist + cross-tab sync
  store/actions/                # licence.ts holding.ts engine.ts payment.ts
                                # notify.ts audit.ts
  components/
    shell/ OfficeLayout Sidebar TopBar CitizenLayout BottomNav DemoBanner DemoGuide
    ui/ Button Card Input Select Textarea Field Dialog Tabs Badge EmptyState
        StarRating PhotoUpload
    domain/ Stamp StatusBadge SlaBadge Stepper Timeline RoleHandoff LedgerTable
            WardMap KpiCard SmsBubble QrBlock
  pages/
    public/ Landing Verify Pay
    citizen/ Home Services Apply Track TrackDetail Messages Holding Notices Ward
    office/ Login Dashboard Tasks Search Notices Reports AuditLog Phase2
    office/trade-licence/ List New Renew Detail Register
    office/holding/ List Detail Defaulters
    office/receipts/ List Daily
    office/registers/ Book New Detail
    office/mayor/ Mayor WardDrill Present
    print/ Licence Receipt Certificate DailyStatement
```

**Every state-changing action must:**

1. update the record and its `history`;
2. write an audit entry;
3. create an SMS notification for citizen-facing records;
4. show a toast.

Toast text uses the button's verb, e.g. button `অনুমোদন দিন` → toast `অনুমোদিত, ক্রমিক নং ১৩`.

---

## 20. Build phases

Run `npm run build` after each phase.

1. **Foundation:**
   - theme and fonts;
   - all `lib` helpers;
   - types, service catalogue, users, business types;
   - store with persist + cross-tab sync;
   - seed generator;
   - landing page, office login/role switcher, office and citizen layouts, demo banner, reset.
2. **Trade licence end to end** (office side): new, detail workflow, role handoff, receipts, printable licence with QR, `/verify`, and the trade licence register book with print.
3. **Register engine:** config types, the five configs, generic Book/New/Detail pages, photo upload, and certificate printing.
4. **Citizen Corner:**
   - home, charter, apply wizard, tracking (single + by mobile with simulated OTP);
   - messages, notices, my ward;
   - rating.
5. **Payments & holding tax:** mock gateway with success/failure, holding tax module (citizen + office), and daily collection with the printable statement.
6. **Oversight:**
   - My Work inbox, notification bell, search, reports with CSV;
   - notices posting;
   - audit log.
7. **Mayor dashboard:** KPIs, ward map + drill-down, charts, overdue list, section performance, citizen voice, paper saved, live feed, presentation mode.
8. **Demo guide** with auto-ticking steps and navigation helpers.
9. **Polish:**
   - Office pages checked at 1366×768.
   - Citizen Corner checked at 375 px.
   - Print checks.
   - Empty/error states.
   - Keyboard focus and reduced motion.
   - Two-window sync test.
10. **README.md:**
    - what this is (a demo, fictional data, no backend);
    - run: `npm install`, `npm run dev`, `npm run build`, `npm run preview`;
    - deploy to Vercel (push to GitHub, import, framework Vite, output `dist`);
    - how to add a new register (one config file + seed + sidebar link);
    - the presentation script from section 16, with the side-by-side tip;
    - next steps for the real system: Laravel backend, real accounts and OTP/SMS gateway, a real payment gateway, a BDRIS reference register, a Bangla/English toggle, and a staff mobile app.

---

## 21. Definition of done

- [ ] `npm run build` passes with zero TypeScript errors.
- [ ] A citizen can submit a complaint in one window, and it appears in the office window within about 1 second without a refresh. Status changes flow back to the citizen's tracking page and SMS inbox.
- [ ] The full trade licence journey works end to end: online application → inspection → approval (serial assigned) → online payment → licence download → QR verification.
- [ ] Renewal, holding tax payment, and both certificate flows work, including councillor ward scoping.
- [ ] Every register book view shows serials, filters, totals and stamps, prints in landscape, and exports CSV that opens in Excel with correct Bangla.
- [ ] SLA badges and overdue lists are correct; seed data contains overdue items.
- [ ] The Mayor dashboard KPIs, ward map drill-down, charts and presentation mode all work and update live.
- [ ] All numbers use Bangla digits. The Bangla calendar date and amount in words are correct.
- [ ] Nothing can be deleted. Every action is in the audit log.
- [ ] `ডেমো রিসেট` restores fresh data relative to today.
- [ ] Refreshing any route works (localStorage + `vercel.json`).
- [ ] The demo guide can walk through the whole script.
- [ ] Citizen Corner works on a phone at 375 px; office pages work at 1366×768.

When finished, report what was built, any deviations from this spec, and any known limitations.