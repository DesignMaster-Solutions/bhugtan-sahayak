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

## Verified on 05/11/2026 (this section wins over everything above)

Each rule below was read in the official source; the text copy is in `sources/` (files starting
`wb_` are Wayback copies of the official URL, because pmkisan.gov.in, pfms.nic.in, nsap.nic.in,
ippbonline.com and npci.org.in do not answer from outside India). Nothing outside this list may
appear in the app as a rule, number, path or fee.

1. **Last seeded bank gets the money.** NPCI SOP for the Aadhaar Payments Bridge v3.0.2,
   17/02/2021, hosted by DBT Mission:
   https://dbtbharat.gov.in/data/dbt_payments/Standard-Operating-Procedure-of-Aadhaar-Payments-Bridge-(APB).pdf
   "the bank seeding with the latest mandate date will be mapped in the NPCI mapper and all the
   subsidies will be routed to that bank only"; "the mapper will hold good only the last record
   updated". Banks de-seed on account closed / holder expired / account blocked or frozen, and
   "Customer consent is not required for de-seeding". (`sources/dbtbharat_APB_SOP.txt`)
2. **APB return reasons (the official list of why a credit bounces)**, same SOP: 01 Account
   Closed; 10 Unclaimed/DEAF; 51 KYC Documents Pending; 53 Account Inoperative; 54 Account
   dormant; 60 Account Holder Expired; 64 Aadhaar Number not Mapped to Account Number; 68 A/c
   Blocked or Frozen; 71 Invalid Account type (NRE/PPF/CC/Loan/FD); 95 "Aadhaar number de-seeding
   from NPCI mapper by bank - customer to contact his/her bank"; 96 "Aadhaar mapping does not exist".
3. **Check which bank is seeded.** UIDAI FAQ "Direct Benefit Transfer" (updated 02 Jul 2026),
   https://uidai.gov.in/en/direct-benefit-transfer : "You can check your bank seeding status from -
   https://myaadhaar.uidai.gov.in/ ... fetched from the server of National Payment Corporation of
   India (NPCI)" and alternatively https://base.npci.org.in/catalog/seedingRequestDetails . The
   exact myAadhaar menu name is NOT confirmed: say "Bank seeding status in myAadhaar (login with
   Aadhaar and OTP)" without naming more menus. UIDAI helpline 1947.
   NPCI BASE options (MoRD PDF https://nrega.dord.gov.in/MGNREGA_new/Key-Features/Aadhaar_Sheeding_BASE.pdf):
   "Request for Aadhaar Seeding / Check Your Service Status / Get Aadhaar Mapped Status / Get
   Aadhaar Mapping History".
4. **Fix seeding / change the DBT account.** UIDAI FAQ: "visit the bank branch where you have
   opened the account and request the bank to link your Aadhaar with your account by filling up
   the mandate and consent form of the bank"; "To change the bank account for receiving DBT funds,
   please visit the respective bank branch and submit the mandate and consent form"; "You can
   receive DBT benefits only in one account". (Seeding through net banking: NOT confirmed, do not say.)
5. **Inoperative account.** RBI circular RBI/2023-24/105 DOR.SOG(LEG).REC/64/09.08.024/2023-24,
   01/01/2024 (https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12589&Mode=0): inoperative =
   no "customer induced transactions" for over two years; Annex I counts "Direct Benefit Transfer
   (DBT) credits" as customer-induced (so an account that keeps getting DBT should not become
   inoperative); banks must segregate scholarship and DBT zero-balance accounts so "the stipulation
   of 'inoperative' account is not applicable"; activation by KYC "at all branches (including
   non-home branches)" and V-CIP where the bank offers it; "No charges shall be levied for
   activation"; processed within "three working days from the receipt of the complete application".
   Cite it as "RBI circular of 1 January 2024" (it may since be consolidated in a 2025 Direction).
6. **PM-KISAN.** PIB 2112399 (18/03/2025): "land seeding, Aadhaar based payment and eKYC have been
   made mandatory. The benefits of the farmers, who did not complete these mandatory criteria, were
   stopped." PIB 2330414 (30/10/2026): e-KYC by "OTP-based authentication, Biometric authentication,
   Face authentication"; pmkisan.gov.in: biometric e-KYC at "CSC VLE Logins, PM-KISAN Mobile
   Application and State Authorized User Logins". Status: https://pmkisan.gov.in/BeneficiaryStatus_New.aspx
   ("Know Your Status": Registration No. + OTP to the e-KYC mobile; shows Payment Status, Bank Name,
   UTR No., Payment Mode, Account Credited, Credited on; link "Know your registration no.").
   PIB 2152566 (05/08/2025): 19th instalment "transaction success rate of 99.92%"; "major reasons
   for transaction failure are de-seeding of Aadhaar number from NPCI mapper by the bank,
   non-mapping of Aadhaar to account number, and account closure." PIB 1739603 (27/07/2021):
   40,16,867 failed transactions till June 2021 out of 68,76,32,104; reasons include "Account
   Inactive, Account Dormant ... Account Holder Expired, Account Blocked or Frozen, Inactive Aadhar".
   PM-KISAN helpline numbers: NOT confirmed officially, do not show.
7. **NSAP pensions.** nsap.nic.in "Track Pension Payment" (Pension payment detail of Beneficiary):
   https://nsap.nic.in/ledgerHistroy.do?method=intialize , search by Sanction Order No/Application
   No, name or mobile + State, District, captcha.
8. **MGNREGA wages.** PIB 2112199 (18/03/2025, Lok Sabha): payment through ABPS "made mandatory with
   effect from 1st January 2024"; if APBS fails, the alternative route is NACH (account-based);
   "13.55 crore active workers". Status: nrega.dord.gov.in, "Search Job Card/ Work/ Musteroll/
   Wagelist/ FTO" (https://mnregaweb4.dord.gov.in/netnrega/homesearch.htm).
9. **Payments to an account (any scheme).** PFMS "Know Your Payments"
   https://pfms.nic.in/static/KnowYourPayment_new.aspx : bank name, account number twice, word
   verification, OTP to the registered mobile. The person types these on PFMS, never in our app.
   Whether it lists failure reasons: NOT confirmed, do not claim. scholarships.gov.in links to PFMS
   for scholarship payments.
10. **IPPB.** ippbonline.com doorstep banking: "NIL charge for new account opening at your
    doorstep", through the GDS/Postman; DBT page: "link your Aadhaar number with your IPPB savings
    account for receiving your DBT money". (Doorstep seeding fee: NOT confirmed.)
11. **Size.** dbtbharat.gov.in home (05/11/2026): FY 2026-27 so far ₹2,98,573 Cr and 426 Cr
    transactions; cumulative ₹54,15,957 Cr.
12. **Removed:** mylpg.in is no longer an official site (now a blog); LPG gets only the generic
    Aadhaar-payment checks (1-5, 9). No official count of MGNREGA ABPS rejections was found.
13. **Wrong data on the scheme record (added 05/11/2026).** PIB 2152566: "In case of any discrepancy in
    data, the record is sent back to State/UT for correction and on receipt of the corrected data, the
    benefits are released immediately with the upcoming release." PIB 1739603: failure records "are
    opened to respective State/UT for correction under the “Correction Module” tab of PM-KISAN portal".
    The Nanuaram decision (evidence/real-cases) shows the step: "upload the correct form with valid
    AADHAR number". (`sources/pib_2152566_pmkisan_failed_txn.txt`, `sources/pib_1739603_pmkisan_failed_2021.txt`)
14. **Name differs between Aadhaar and the scheme.** UIDAI DBT FAQ: "My name is different in Aadhaar
    vis-à-vis service delivery database. What should I do? For correction of your name in Aadhaar, you may
    visit the nearest Aadhaar Enrolment Centre to update your name". (`sources/uidai_dbt_faq.txt`)
15. **Credit limit (APB codes 57 and 58).** APB SOP v3.0.2, return-code guidelines: 57 "Amount Exceeds
    limit set on Account by Bank for Credit per Transaction", 58 "Account reached maximum Credit limit set
    on account by Bank"; "the limit on balances shall not be considered while making deposit through
    government grants, welfare benefits and payment against procurements" (G.S.R 1038, 21.8.2017); "All
    KYC updated PMJDY accounts are to be converted to regular BSBD accounts, instead of treating them as
    small accounts"; scholarship accounts "free from restrictions of minimum balance and total credit
    limit" (RBI circular of 10.09.2014). (`sources/dbtbharat_APB_SOP.txt`)
16. **Arrears cut after a failed payment.** Two decisions, texts in `evidence/real-cases/sources/`:
    CIC 3 Oct 2019 (Delhi widow pension): "amount pertaining to only 6 months is provided in such cases";
    CIC 16 Jan 2025 (Delhi disability pension, office order of 04.08.2023): "arrears for a maximum period of
    one year only". The app warns to act soon and names no amount.
