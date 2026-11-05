# Prompt given to Claude Code inside the AgentFoundry terminal

Build Bhugtan Sahayak in this folder, following BRIEF.md. The section "Verified on 05/11/2026" of
BRIEF.md is the only source of rules, paths, fees and numbers: where it differs from the text above
it, it wins. Never invent a rule, number, deadline, helpline or fee. Copy the structure and style of
the sibling projects ../nyaya-sahayak and ../ghar-ki-hawa (read their worker.js, stats.html, app.js
counter lines with ?nostats, tests/, .assetsignore, wrangler.toml, README), but do not modify those
folders or any other folder outside this one. Do not deploy and do not open any issue: stop after
the last commit and push.

## Files

index.html, styles.css, app.js, rules.js, i18n.js (en + hi), worker.js, stats.html, package.json
({"type":"module","scripts":{"test":"node --test"}}), wrangler.toml (name "bhugtan-sahayak", same
account_id as ../ghar-ki-hawa, assets + Durable Object Counter, run_worker_first ["/api/*"]),
.assetsignore (also ignore sources/ and AGENT_PROMPT.md), .gitignore, tests/*.test.mjs, README.md.
No framework, no dependency, total shipped assets under 100 KB, works on 3G.

## The app never asks for Aadhaar, bank account, phone number or name. No free-text field at all.

## rules.js (pure, no DOM)

Inputs: `scheme` in pmkisan | pension (NSAP old-age, widow, disability) | mgnrega | scholarship |
other (LPG subsidy, state cash scheme, anything else paid to the account by Aadhaar);
`symptom` in never_came | stopped | other_account | paid_not_received (portal says paid / credited
but not in the passbook) | rejected (SMS or portal says failed / rejected);
`lastReceived` in never | under1y | 1to2y | over2y;
`changes` (array, may be empty) of new_account (opened a new bank or IPPB account), closed_account,
kyc_pending (bank asked for KYC papers / account blocked), none;
for pmkisan only: `ekyc` yes | no | unsure and `land` yes | no | unsure.

Causes (ids, each with the BRIEF "Verified" item number it relies on and the APB return code where
there is one):
- `mapper_other_bank` (items 1, 3, 4): money goes to the bank seeded last in the NPCI mapper.
- `not_mapped` (items 2 code 64/96, 3, 4; PIB 2152566): Aadhaar not seeded to any account.
- `deseeded` (item 2 code 95, item 1 de-seeding rule; PIB 2152566): bank removed the seeding,
  e.g. after closing or freezing the account.
- `account_closed` (item 2 code 01).
- `inoperative` (item 2 codes 53/54, item 5): no customer-induced transaction for over two years.
  Must say that DBT credits count as customer-induced and that scholarship / DBT zero-balance
  accounts are not to be made inoperative; fix: KYC at any branch (or V-CIP if the bank offers it),
  no charge, within three working days of a complete application.
- `kyc_frozen` (item 2 codes 51/68).
- `pmkisan_ekyc` (item 6): e-KYC pending; OTP on pmkisan.gov.in or the app, biometric at a CSC,
  face authentication in the PM-KISAN app.
- `pmkisan_land` (item 6): land seeding pending; fix at the State's land-record / agriculture
  office that verifies PM-KISAN land records (say "ask your village / block agriculture office";
  no other office names).
- `mgnrega_abps` (item 8): ABPS mandatory since 1 Jan 2024; if APBS fails the alternative is NACH
  to the account.
- `credited_elsewhere` for paid_not_received: check the UTR and bank shown by the scheme status
  (PM-KISAN Know Your Status) or PFMS Know Your Payments, then take the UTR to the bank shown.

`likelyCauses(input)` returns ordered cause ids. Hard rules (tests enforce them):
- symptom other_account, or changes includes new_account: `mapper_other_bank` first.
- changes includes closed_account: `account_closed` and `deseeded` in the top 3.
- lastReceived over2y (or 1to2y with stopped): `inoperative` in the list, and not first when
  symptom is other_account.
- kyc_pending: `kyc_frozen` in the top 2.
- pmkisan with ekyc no/unsure: `pmkisan_ekyc` first unless other_account; land no/unsure:
  `pmkisan_land` in the list.
- mgnrega: `mgnrega_abps` in the list; paid_not_received: `credited_elsewhere` first.
- never_came with no other signal: `not_mapped` first.
- Every result has at least one cause and at most 5, no duplicates.

`checksFor(cause, scheme)` returns official checks: {name, url, path (exact steps from BRIEF
only), needs (what the person types on THAT official site, e.g. "Aadhaar number and OTP on
myAadhaar", never in our app)}. Every cause maps to at least one check with an https url from the
Verified list. Seeding checks: myAadhaar (Bank seeding status) and NPCI BASE "Get Aadhaar Mapped
Status". Scheme checks: PM-KISAN Know Your Status, NSAP Track Pension Payment, NREGA search,
PFMS Know Your Payments (any scheme, scholarship).

`fixFor(cause)` returns {fix, where, carry, source} with `where` among: your bank branch (any
branch for KYC), IPPB postman at your door (nil charge to open an account), CSC, the office of
the scheme. `carry` never asks for anything the source does not need (passbook, Aadhaar card).

`requestText(cause, lang)` builds a short polite letter the person shows at the counter, with
blank lines "______" for name, account and Aadhaar (filled by hand, never by us), asking the bank
to check / update the Aadhaar seeding (mandate and consent form) or reactivate the account by KYC
citing the RBI circular of 1 January 2024 (no charge). It must never contain "will get", "will be
paid", "guaranteed", "मिल जाएगा", "गारंटी" or any rupee amount (₹, Rs, rupee, रुपये).

## Screens (one step per screen, big buttons with an icon + word, 360 px first)

1. Which payment (5). 2. What happened (5). 3. When did you last receive it (4). 4. Since then,
did you (multi: opened a new account / closed an account / bank asked for KYC papers / none).
5. Only for PM-KISAN: e-KYC done? land details verified? (yes / no / not sure).
Result card: "Most likely reasons" in order, each with the plain reason, the APB return code or
source line, "How to check" (link + steps + what that site will ask), "How to fix" (where, what to
carry), and the ready request text (Hindi or English, toggle to show the other language), "Read
aloud" (speechSynthesis hi-IN / en-IN, hidden when no voice), "Copy", "Send on WhatsApp"
(wa.me/?text=). Box "Did it work?" Yes / No / Not yet. Footer: "Not a government service. Rules
from NPCI, UIDAI, RBI and the scheme portals" with link to the README sources, and "Never share
your OTP with anyone" (true and safe). Never promise the money will come.
Language toggle EN / हिंदी on every screen, remembered in localStorage; ?lang=hi works. Hindi:
write it yourself in plain everyday Hindi (no paid API).

## Counter and /stats

worker.js like ../ghar-ki-hawa: POST /api/event {event, lang, cause?}, events: diagnose (result
shown), copy, share, worked_yes, worked_no, worked_notyet; `cause` only on diagnose and only one
of the cause ids (top cause); stored as total / per language / per day / per top cause in one
Durable Object; GET /api/stats; nothing else stored (no scheme answers beyond the cause id, no IP).
app.js sends with navigator.sendBeacon and nothing when the URL has ?nostats (same
`const NOSTATS =` / `const count =` lines as ../nyaya-sahayak so a test can run them). stats.html
shows totals, by language, by day, top causes, and "Did it work?" yes / no / not yet.

## Tests (node --test), written before the code they test

Every scheme x symptom gives >= 1 cause and every cause >= 1 official https check; the hard rules
above, one test each; requestText never contains the forbidden phrases or a rupee amount in either
language and keeps the blanks; no output of any rules.js function contains a 12-digit number;
en and hi have exactly the same keys and no empty string; worker counts valid events and rejects
bad ones (405, 400, 404, unknown cause); ?nostats sends nothing. After the tests pass, do a
mutation check: break one rule at a time (other_account no longer leads with mapper_other_bank;
drop inoperative for over2y; remove the "no charge" line; let requestText say "you will get"),
run the tests, confirm a test fails, restore. Write what you mutated and which test caught it in
README.

## README

What it does, run it (npm test, npx wrangler dev), deploy, every rule with its Verified item and
official link, the size and failure figures from item 6 and 11, privacy (what is counted, nothing
else), limits (portal paths change; some official pages only open from India and were read via
Wayback copies of the official URL; the Hindi was written by an AI agent and needs a native
speaker review), how it was built in AgentFoundry with Claude Code against BRIEF.md and this
prompt, MIT license. Commit after each working step with conventional commits and push to origin main.
