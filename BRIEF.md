# Bhugtan Sahayak — brief (Code for a Billion 2026, track Financial Inclusion)

Goal: a free, open-source agent for the person whose government payment did not arrive (PM-KISAN
installment, old-age, widow or disability pension, MGNREGA wages, scholarship, LPG subsidy, or a
state cash scheme). In a few questions it finds the most likely reason the Direct Benefit Transfer
failed or went to another account, the official way to check it, the exact fix and where to do it
(bank branch, India Post Payments Bank postman, CSC, block office), and gives a ready-to-show
request in Hindi or English. Cheap phone, no account, no install, no Aadhaar or bank number asked.

Why this one: on 05/11/2026 the hub's Financial Inclusion track has three entries: two scam
shields (#43, #29) and a self-help-group tea business (#44). Yojana Sathi (#25, another track)
helps people find schemes they are eligible for. Nothing covers the money that was approved and
never reached the account, which is where the poorest families lose it: an account not seeded
with Aadhaar in the NPCI mapper, the last-seeded account being an old one, an inoperative or
frozen account, a missing scheme e-KYC.

## Facts we may use (cite each one in the README; nothing else is a fact)

All of these are from memory or secondary pages on 05/11/2026. VERIFY EACH ONE in the official
source (UIDAI / myAadhaar, NPCI, PFMS, DBT Mission dbtbharat.gov.in, RBI circulars, pmkisan.gov.in,
nsap.nic.in, nrega.nic.in, India Post Payments Bank, PIB, Lok Sabha / Rajya Sabha answers) and cite
that, not a secondary page. What cannot be found in an official source does not go in the app.

- Aadhaar-based DBT goes through the Aadhaar Payment Bridge System, which pays the bank account last
  seeded against the Aadhaar number in the NPCI mapper; seeding a new account moves future payments.
- A resident can see which bank their Aadhaar is seeded to in the NPCI mapper through UIDAI's
  myAadhaar "Bank Seeding Status" service (VERIFY the current name and path).
- PFMS "Know Your Payments" shows DBT payments to an account, including failed ones and the reason
  (VERIFY what it asks for and the list of failure reasons it shows).
- RBI rules on inoperative accounts (no customer-induced transaction for two years) and how DBT
  credits and scholarship accounts are treated (VERIFY the circular and its date).
- Scheme-specific blocks: PM-KISAN requires e-KYC and land-record seeding (VERIFY on pmkisan.gov.in
  and its FAQ); NSAP pensions and MGNREGA wages have their own status pages (VERIFY).
- India Post Payments Bank can open an account and seed Aadhaar for DBT at the doorstep (VERIFY).
- Size and severity: DBT Mission totals (schemes, beneficiaries, amount transferred in the latest
  full year) and any official figure on failed or rejected DBT transactions (Lok Sabha answers,
  PFMS, Ministry of Rural Development). If no official failure figure exists, do not invent one.

Not allowed: asking for Aadhaar, bank account or phone numbers; promising that money will arrive;
naming an amount the person "will get"; a reason or fix without its official source; any paid
API; any tracking beyond the anonymous counter below.

## Build (same pattern as Ghar Ki Hawa, Nyaya Sahayak and the two siblings in ~/Backups/impressora)

- Static web app (index.html + app.js + i18n en/hi), no framework, < 100 KB, works on 3G; one
  Cloudflare Worker for the anonymous counter. Read-aloud button (Web Speech API, hi-IN, optional).
- Flow, one step per screen: which payment -> what happened (never came, stopped after some
  installments, went to another account, shows "paid" but not in the passbook, rejected) -> when it
  was last received -> did you open, close or change a bank account or update Aadhaar since then ->
  scheme-specific question (PM-KISAN: e-KYC done? land details verified?).
- Result card: the most likely reasons in order, each with the official check (link and the exact
  menu path), the fix, where to go, what to carry, and a ready-to-show request text for the bank or
  office in Hindi and English; "Copy" and WhatsApp share; "Did it work?" yes/no box for the counter.
- rules.js = pure functions (likelyCauses, checksFor, fixFor, requestText) with `node --test`
  tests: each payment x symptom maps to at least one official check, "went to another account"
  always leads with NPCI mapper seeding, an inoperative-account path, the text never promising
  money, Hindi and English keys complete. See each test fail once against a broken rule before
  trusting it (mutation check).
- /stats page and /api/stats JSON like the others: diagnoses, causes shown, requests copied or
  shared, "Did it work?" yes/no, by language and day; no personal data. This is the Proven impact
  evidence.
- README: setup, sources for every rule, how AgentFoundry was used, MIT license.

## AgentFoundry requirement (eligibility)

Build inside the AgentFoundry IDE (/Applications, login info@designmastersolutions.com, vault
`agentfoundry:dms`): open this folder in AF and run Claude Code from the AF integrated terminal
against this brief, as Nyaya Sahayak (Impressora R144) and Ghar Ki Hawa were built. Decline the AF
migration wizard. R144 notes: `caffeinate -u`; type into the IDE only with `osascript activate` +
keystroke in the same call. The IDE is shared with two sibling builds (Fasal Nuksan Sahayak,
terminal 2948b368; Chhatravritti Sahayak, terminal cd794098): before typing into AF, take the lock
with `cld board "AF: digitando" --files /Users/alandebortolo/Backups/impressora/.af-lock` (if it reports someone else
holds it, wait and retry), use your own AF window for this folder, and release it with
`cld board done "AF livre"` as soon as the prompt is typed.

## Submission (issue form `submission.yml` in karlmehta/code-for-a-billion)

Title "[Submission] Bhugtan Sahayak (Design Master Solutions)", track Financial Inclusion, team
Alan De Bortolo (@alandebortolo), repo + live URL + a short demo video, problem statement, what you
built (and how AF was used), scale and severity with the sources above, deployment and impact data
with the /stats link. Deadline: deployed and filed before 15/11/2026; target 12/11/2026. Winners
05/12/2026.

## Judging (JUDGING.md, 25% each)

Size of the problem, Severity, Quality of the solution, Proven impact (also the tie-breaker).
Prizes per track on codeforindia.org/hackathon (read on 05/11/2026): 1st Rs 1,50,000,
2nd Rs 1,00,000, 3rd Rs 50,000 "per track / category"; the hub README (August) and the welcome
e-mail say an overall podium instead. Discussion #52 asks which one applies. The FAQ sets no limit
on projects per participant.
