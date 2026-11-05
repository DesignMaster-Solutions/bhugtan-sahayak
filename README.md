# Bhugtan Sahayak (भुगतान सहायक)

A free, open-source helper for a person in India whose **government payment did not arrive**: a
PM-KISAN instalment, an old-age, widow or disability pension, MGNREGA wages, a scholarship, an LPG
subsidy or a State cash scheme that was approved but never reached the bank account, stopped,
went to another account, shows "paid" but is not in the passbook, or was rejected.

In four or five taps it shows the **most likely reasons** the Direct Benefit Transfer (DBT) failed,
in order; for each one the **official way to check it** (link, steps, and what that official site
will ask for), **how to fix it**, **where to go** (bank branch, IPPB postman, CSC, scheme office),
**what to carry**, and a **ready request to show at the counter** in Hindi or English, with
Read aloud, Copy and Send on WhatsApp.

It **never asks for an Aadhaar, bank account or phone number, or a name**, and has no free-text
field at all. It never promises that money will come.

Built for *Code for a Billion 2026*, track **Financial Inclusion** ([submission #54](https://github.com/karlmehta/code-for-a-billion/issues/54)).

Live app: <https://bhugtan-sahayak.designmaster.workers.dev> · usage numbers: [/stats](https://bhugtan-sahayak.designmaster.workers.dev/stats) · demo video (74 s): [video/demo.mp4](video/demo.mp4)

- Static web app: `index.html`, `app.js`, `rules.js`, `i18n.js`, `styles.css`, `stats.html`. No
  framework, no dependency, no paid API, no cookies, no account. About 67 KB shipped in total, so
  it loads on a cheap phone over 3G. One step per screen, big buttons with an icon and a word,
  designed for 360 px first. English and Hindi on every screen (remembered on the device; `?lang=hi`
  also works).
- `worker.js` is a tiny Cloudflare Worker that only counts anonymous events (see *Privacy*).

## Run it

Requirements: Node.js 20+ (only for the tests and `wrangler`).

```sh
npm test            # node --test: rules, strings, counter, ?nostats
npx wrangler dev    # app + counter at http://localhost:8787
```

The app uses ES modules, so open it through a server, not as `file://`. Add `?nostats` to any URL
to keep test visits out of the public counter.

### Deploy (Cloudflare Workers static assets)

`wrangler.toml` deploys the folder as static assets under the Worker name `bhugtan-sahayak`;
`worker.js` answers only `/api/*` (`run_worker_first`), with a SQLite-backed Durable Object
(`Counter`, migration `v1`). `.assetsignore` keeps tests, sources, docs and config out of the upload.
Both fit in the free plan.

```sh
npx wrangler login
npx wrangler deploy
```

## How it decides

`rules.js` holds pure functions with no DOM:

- `likelyCauses({scheme, symptom, lastReceived, changes, ekyc, land})` returns 1 to 5 cause ids,
  most likely first.
- `checksFor(cause, scheme)` returns the official checks `{name, url, path, needs}`.
- `fixFor(cause)` returns `{fix, where, carry, points, codes, source}`.
- `requestText(cause, lang)` builds the counter letter, with `______` blanks for name, account,
  Aadhaar, date and signature, filled by hand, never by the app.

### Order of reasons

1. "Shows paid, but not in my passbook": first check the UTR and bank on the payment status
   (`credited_elsewhere`).
2. "Went to another account": the NPCI mapper (`mapper_other_bank`), always first.
3. PM-KISAN with e-KYC not done or not sure: `pmkisan_ekyc`.
4. Opened a new account: `mapper_other_bank`. Bank asked for KYC papers: `kyc_frozen`.
   Closed an account: `account_closed` and `deseeded`.
5. Last received over two years ago (or 1 to 2 years ago and it stopped): `inoperative`.
6. Then the usual lead for the symptom (never came: `not_mapped`; stopped: `deseeded`; rejected:
   `not_mapped`), MGNREGA `mgnrega_abps`, PM-KISAN land `pmkisan_land`, and the other reasons PIB
   2152566 names (de-seeding, non-mapping, account closure).

The tests enforce each of these as a hard rule (see *Tests*).

## Every rule and its source

Each rule was read in the official source on 05/11/2026; a text copy is in `sources/`. Files
starting `wb_` are Wayback Machine copies of the official URL, because pmkisan.gov.in,
pfms.nic.in, nsap.nic.in, ippbonline.com and npci.org.in do not answer from outside India.
"Item n" is the numbered item of "Verified on 05/11/2026" in `BRIEF.md`.

| Cause | What the app says | Item | Official source |
|---|---|---|---|
| `mapper_other_bank` | Aadhaar payments go to the account seeded last in the NPCI mapper; DBT only in one account; change it with the bank's mandate and consent form | 1, 3, 4 | NPCI APB SOP v3.0.2 (17/02/2021), <https://dbtbharat.gov.in/data/dbt_payments/Standard-Operating-Procedure-of-Aadhaar-Payments-Bridge-(APB).pdf>; UIDAI DBT FAQ, <https://uidai.gov.in/en/direct-benefit-transfer> |
| `not_mapped` | Return codes 64 / 96; link Aadhaar at the branch (mandate and consent form) or open an IPPB account at the door | 2, 3, 4, 10 | APB SOP; UIDAI FAQ; PIB 2152566, <https://www.pib.gov.in/PressReleasePage.aspx?PRID=2152566>; IPPB, <https://www.ippbonline.com/> |
| `deseeded` | Return code 95; banks de-seed on closed / blocked / frozen accounts without consent | 1, 2, 4 | APB SOP; UIDAI FAQ; PIB 2152566 |
| `account_closed` | Return code 01 | 2, 4, 10 | APB SOP; UIDAI FAQ; PIB 2152566; IPPB |
| `inoperative` | Return codes 53 / 54; no customer-induced transaction for over two years; DBT credits count as customer-induced; scholarship / DBT zero-balance accounts are not to be made inoperative; KYC at any branch or V-CIP if offered; no charge; within three working days of a complete application | 2, 5 | APB SOP; RBI circular of 1 January 2024 (RBI/2023-24/105), <https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12589&Mode=0> |
| `kyc_frozen` | Return codes 51 / 68 | 2 | APB SOP |
| `pmkisan_ekyc` | e-KYC mandatory; OTP (pmkisan.gov.in or app), biometric at a CSC, face authentication in the app | 6 | PIB 2112399, <https://www.pib.gov.in/PressReleasePage.aspx?PRID=2112399>; PIB 2330414, <https://www.pib.gov.in/PressReleasePage.aspx?PRID=2330414> |
| `pmkisan_land` | Land seeding mandatory; ask your village / block agriculture office | 6 | PIB 2112399 |
| `mgnrega_abps` | ABPS mandatory from 1 January 2024; if APBS fails, NACH to the account | 8 | PIB 2112199, <https://www.pib.gov.in/PressReleasePage.aspx?PRID=2112199> |
| `credited_elsewhere` | Note the UTR and bank on Know Your Status or PFMS Know Your Payments and take the UTR to that bank | 6, 9 | PM-KISAN Know Your Status; PFMS Know Your Payments |

Official checks (`checksFor`), each with what that site asks for:

| Check | URL | Item |
|---|---|---|
| myAadhaar, Bank seeding status (Aadhaar number + OTP) | <https://myaadhaar.uidai.gov.in/> | 3 |
| NPCI BASE, Get Aadhaar Mapped Status | <https://base.npci.org.in/catalog/seedingRequestDetails> | 3 |
| PM-KISAN Know Your Status (Registration No. + OTP to the e-KYC mobile) | <https://pmkisan.gov.in/BeneficiaryStatus_New.aspx> | 6 |
| NSAP Track Pension Payment (Sanction Order / Application No, name or mobile, State, District, captcha) | <https://nsap.nic.in/ledgerHistroy.do?method=intialize> | 7 |
| NREGA Search Job Card / Work / Musteroll / Wagelist / FTO | <https://mnregaweb4.dord.gov.in/netnrega/homesearch.htm> | 8 |
| PFMS Know Your Payments (bank name, account number twice, word verification, OTP), any scheme and scholarships | <https://pfms.nic.in/static/KnowYourPayment_new.aspx> | 9 |

What the app deliberately does **not** say, because no official source confirmed it: the exact
myAadhaar menu path beyond "Bank seeding status"; seeding through net banking; whether PFMS lists
failure reasons; the IPPB doorstep seeding fee; PM-KISAN helpline numbers; any mylpg.in check
(no longer official, so LPG gets only the generic Aadhaar-payment checks); any count of MGNREGA
ABPS rejections. The only helpline-like line shown is "Never share your OTP with anyone".

## Size and severity

- DBT Mission (<https://dbtbharat.gov.in>, home page on 05/11/2026): FY 2026-27 so far
  **₹2,98,573 crore in 426 crore transactions**; cumulative **₹54,15,957 crore** (item 11).
- PM-KISAN 19th instalment: transaction success rate **99.92%**; "major reasons for transaction
  failure are de-seeding of Aadhaar number from NPCI mapper by the bank, non-mapping of Aadhaar to
  account number, and account closure" (PIB 2152566, 05/08/2025, item 6).
- PM-KISAN till June 2021: **40,16,867 failed transactions out of 68,76,32,104**, with reasons
  including account inactive, dormant, holder expired, blocked or frozen, inactive Aadhaar
  (PIB 1739603, 27/07/2021, <https://www.pib.gov.in/PressReleasePage.aspx?PRID=1739603>, item 6).
- MGNREGA: **13.55 crore active workers**, paid through ABPS since 1 January 2024 (PIB 2112199, item 8).

## Privacy and usage numbers

Live and public at `/stats` (JSON at `/api/stats`). The app sends, with `navigator.sendBeacon`,
only these events, each with the language: `diagnose` (result shown, plus the id of the top cause
only, e.g. `inoperative`), `copy`, `share`, `worked_yes`, `worked_no`, `worked_notyet`. The Worker
rejects anything else (unknown event, language or cause, a cause on any other event, broken JSON)
and stores only totals, per language, per day (UTC) and per top cause in one Durable Object.
Nothing else is sent or stored: no scheme answers beyond the cause id, no names, no Aadhaar, bank
or phone numbers, no IP. `?nostats` sends nothing.

## Tests

`npm test` (27 tests, written before the code they test):

- every scheme x symptom x last-received x changes (x PM-KISAN answers) gives 1 to 5 known causes,
  no duplicates; every cause has at least one official `https` check for every scheme and a fix
  with a known place and source;
- one test per hard rule (another account, closed account, two years, KYC, PM-KISAN e-KYC and land,
  MGNREGA and "paid but not received", never came with no other signal);
- the inoperative fix keeps "DBT counts", "DBT / scholarship accounts exempt", "any branch",
  "no charge" and "three working days";
- `requestText` never contains "will get", "will be paid", "guaranteed", "मिल जाएगा", "गारंटी" or
  a rupee amount in either language and keeps its blanks; the reactivation letter cites the RBI
  circular of 1 January 2024 and "no charge"; no output of any `rules.js` function contains a
  12-digit number;
- `en` and `hi` have exactly the same keys and no empty string;
- `styles.css` keeps `[hidden]` elements hidden (added after the walk-through on a real browser found "Next" showing on single-choice steps, where it skipped a question unanswered);
- the Worker counts valid events and rejects bad ones (405 wrong method, 400 bad event / language /
  cause / JSON, 404 unknown `/api` path); the real counter lines of `app.js` send nothing with `?nostats`.

### Mutation check (05/11/2026)

Each rule was broken on purpose, `npm test` was run, a test failed, and the file was restored:

| Mutation | Caught by |
|---|---|
| "went to another account" no longer leads with `mapper_other_bank` | rule: "went to another account" or a new account leads with the NPCI mapper (also the PM-KISAN and two-years rules) |
| `inoperative` dropped for over two years | rule: over two years (or 1-2 years and stopped) lists inoperative |
| "no charge" line removed from the inoperative fix | inoperative fix says DBT counts, ... no charge, three working days |
| "no charge" removed from the English reactivation letter | the reactivation request cites the RBI circular of 1 January 2024 and "no charge" |
| the letter says "You will get the money." | requestText never promises money ...; no string promises money or names an amount |

Re-run after the build, with 12 more mutations of `rules.js` and `i18n.js`, each making at least one test fail: new account ignored, closed account without `deseeded`, 1-2 years + stopped not counted as old, KYC ignored, PM-KISAN e-KYC ignored, land ignored, MGNREGA without `mgnrega_abps`, "paid but not received" without `credited_elsewhere`, never came led by the mapper, limit of 5 raised to 6, letter without the blanks, one `en` key removed (keys no longer match `hi`).

The flow was also driven end to end in Chrome at 360 px through `wrangler dev`: answers, result
card, Hindi toggle, letter language toggle, Copy, "Did it work?", and the counter (counted without
`?nostats`, nothing counted with it).

## Limits

- Official portal paths and menu names change; the app shows only what was read on 05/11/2026.
- Some official pages only open from India and were read through Wayback copies of the official URL.
- The app cannot see anyone's account: it ranks the usual reasons for the answers given.
- The Hindi was written by an AI agent and needs a native speaker's review.
- Not a government service.

## How it was built

Built in the **AgentFoundry IDE** with **Claude Code** running in the AgentFoundry integrated
terminal, against `BRIEF.md` (scope and the "Verified on 05/11/2026" rules) and `AGENT_PROMPT.md`
(the single build prompt). Claude Code read the sources, wrote the tests first, then `rules.js`,
the bilingual strings, the counter Worker, the UI and `/stats`, ran the mutation check, and
committed each working step with conventional commits.

## Sources

The official documents behind every rule are listed in the tables above, with text copies in
[`sources/`](sources/).

## License

MIT, see [LICENSE](LICENSE).
