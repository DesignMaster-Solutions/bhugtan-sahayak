# Real cases: people whose government payment did not reach them

Every case here is a real, published decision. I searched indiankanoon.org on 5 November 2026 for High Court
and Information Commission decisions where a beneficiary did not get, or stopped getting, a government payment by
DBT (PM-KISAN, a pension, a subsidy, a scholarship) because of Aadhaar seeding, the bank account, e-KYC or land
seeding, a name or Aadhaar number that did not match, or money that went to another account. I read each
decision in full. The text of each one is saved in `sources/`, and `cases.json` keeps the facts each decision
states. A field the decision does not state is `null`; nothing is estimated.

`tests/real-cases.test.mjs` checks every quote word for word against the saved decision, replays the person's
answers through `likelyCauses` in `rules.js`, checks where the cause named in the decision lands in the list the
app shows, checks that the fix, check and letter the app gives for it point where the decision does, and checks
the numbers on this page against `cases.json`.

## The cases

| Case | Forum, date | Scheme | What stopped the money | Result |
|---|---|---|---|---|
| [Vishram Singh](https://indiankanoon.org/doc/107086784/) | Allahabad HC (DB), 8 Oct 2026 | PM-KISAN, UP | wrong IFSC at first; then the only flaw was **e-KYC "No"**; 23 instalments missed | arrears by 30 Nov 2026 with 6% interest and Rs 5,000 costs |
| [Om Prakash Dubey](https://indiankanoon.org/doc/89624512/) | Allahabad HC (DB), 17 Mar 2023 | PM-KISAN, UP | **9 instalments paid into another account** (wrong account number); State first blamed e-KYC and land | State to pay the 9 within a month |
| [Dharam Lal Patel](https://indiankanoon.org/doc/22332517/) | Chhattisgarh HC, 18 Jul 2024 | PM-KISAN, Chhattisgarh | not stated: portal showed **"stop payment"** after the 5th instalment | officer to decide within 4 weeks |
| [Nanuaram](https://indiankanoon.org/doc/110565552/) | Allahabad HC, 10 Apr 2026 | PM-KISAN, UP | **Aadhaar number** first given and given later did not match; only the 1st instalment came | contempt dismissed; told to file a fresh form |
| [Rajendra](https://indiankanoon.org/doc/177549408/) | Central Information Commission, 13 Apr 2023 | PM-KISAN, UP | PFMS rejection, no response from the bank; then **land not seeded**; nothing since Aug 2020 | revised reply ordered |
| [Rampati](https://indiankanoon.org/doc/22062359/) | Central Information Commission, 20 Apr 2022 | PM-KISAN, UP | not stated: registered Jul 2019, **not one instalment** | complaint dismissed |
| [Geeta](https://indiankanoon.org/doc/24499187/) | Central Information Commission, 19 Jun 2020 | widow pension, Delhi | **Aadhaar not linked**; paid again once linked | no further intervention |
| [Sushila](https://indiankanoon.org/doc/55862438/) | Central Information Commission, 3 Oct 2019 | widow pension, Delhi | pension went to **two accounts, one of them Aadhaar linked**; none from Mar 2015 to Jan 2019 | sent back to the appellate officer |
| [Madhu (appeal by her aunt Devki)](https://indiankanoon.org/doc/26867350/) | Central Information Commission, 16 Jan 2025 | disability pension, Delhi | **wrong mapping of name and bank details**; approved May 2020, first paid Nov 2023; arrears cut to one year | Rs 92,000 compensation |
| [Shrinivas Mishra](https://indiankanoon.org/doc/166822003/) | Central Information Commission, 6 Feb 2020 | LPG subsidy | **Aadhaar not linked with his bank account**; credited once linked | no further intervention |
| [Shahjahanpur pensioners](https://indiankanoon.org/doc/18189583/) | Allahabad HC, 25 Jan 2024 | old age pension, UP | FIR alleges officials **changed pensioners' bank accounts** and took Rs 2.52 crore | officer's anticipatory bail refused |
| [Amit Yadav](https://indiankanoon.org/doc/50156077/) | Allahabad HC (DB), 12 Apr 2023 | post-matric scholarship, UP | **credit limit on the account**: Rs 50,000 of Rs 54,400 bounced | State appeal dismissed |

Amit Yadav's case is also in the Chhatravritti Sahayak evidence; it is here because the money was lost at the
bank credit, the step this app is about.

## The numbers

- 12 decisions: 6 High Court orders (5 Allahabad, 1 Chhattisgarh) and 6 Information Commission orders, from
  2019 to 2026. 11 named beneficiaries, plus the old age pensioners of the Shahjahanpur FIR, whose number the
  order does not give. 6 PM-KISAN cases, 4 pensions, 1 LPG subsidy, 1 scholarship.
- What stopped the money, by kind: Aadhaar not seeded: 2, Aadhaar seeded to another account: 1, e-KYC or land:
  2, wrong account or diverted: 2, name or Aadhaar number mismatch: 2, bank credit limit: 1, not stated: 2.
- The cause named in the decision is a reason the app has in 10 of 12, and not stated: 2. The first replay (commit
  `8f27c1d`) found 3 gaps: a wrong Aadhaar number on the scheme record, a name and bank details mismatch, a bank
  credit limit. Each is now a reason with an official source, so 0 gaps remain among the stated causes.
- Where the decision says what the person saw (7 of the 10), the app lists the cause for those answers in 7 of 7,
  first in 1 (Vishram Singh: e-KYC first; Geeta: Aadhaar not seeded second; Nanuaram: wrong Aadhaar number on
  the record second, if he ticks that he gave a different number; Amit Yadav: credit limit second; Madhu: name
  or bank details mismatch third; Rajendra: land fourth; Sushila: Aadhaar seeded to another bank account fourth). Where it does not say (3 of 10),
  the cause is listed for at least one answer in 3 of 3; for the two wrong-account cases if the person answers
  that the status says paid or that it went to another account.
- Money stated in the decisions: 23 instalments (Vishram Singh), 9 instalments (Om Prakash Dubey), Rs 50,000
  (Amit Yadav), Rs 92,000 compensation (Madhu), Rs 2.52 crore alleged (Shahjahanpur).

## Where the app and the decision differ

Every case has a `divergence` in `cases.json`. The main ones:

- **The 3 gaps, closed.** Each new reason has an official source, read and saved in `sources/`, and its own
  letter:
  - wrong Aadhaar number on the scheme record (Nanuaram): `record_aadhaar`, at the scheme office (for PM-KISAN
    the agriculture office), because "In case of any discrepancy in data, the record is sent back to State/UT
    for correction" (PIB 2152566) through the "Correction Module" of the PM-KISAN portal (PIB 1739603). It shows
    when the person ticks "I gave the scheme a different Aadhaar number"; without that tick it is not listed.
  - name or bank details that do not match (Madhu): `name_mismatch`, at the scheme office, or at an Aadhaar
    Enrolment / Update Centre if the name on the Aadhaar is the wrong one (UIDAI DBT FAQ, "My name is different
    in Aadhaar vis-à-vis service delivery database"). Listed third for "it never came" with nothing ticked, first
    when the person ticks "My name is written differently".
  - credit limit on the account (Amit Yadav): `bank_limit`, APB codes 57 and 58, at the bank branch: the APB
    SOP says "the limit on balances shall not be considered while making deposit through government grants,
    welfare benefits" and that "All KYC updated PMJDY accounts are to be converted to regular BSBD accounts".
    Listed for "it was rejected", second for a scholarship.
- **Arrears cut after a failed payment.** Every result now says "Act soon. In two published decisions, after a
  failed payment the department paid arrears for only 6 months (a widow pension) or at most 1 year (a
  disability pension)", linking Sushila's and Madhu's decisions. It names no amount and promises nothing; it
  does not say that compensation or interest can be claimed, as the courts gave Vishram Singh and Madhu.
- **Money sent to another account.** For Om Prakash Dubey and the Shahjahanpur pensioners the decision does not
  say what they saw. The app lists "sent, maybe to a different account" first for "status says paid" and, since
  this round, also for "it went to another account" (after the NPCI mapper); for the other answers it does not.
  Sushila, answering "stopped", sees "seeded to another bank account" fourth since 8 November 2026 (before that
  it showed only for "it went to another account"); its check, myAadhaar Bank seeding status, shows which bank
  the Aadhaar is seeded to, here SBI.
- **Only part came.** Amit Yadav got Rs 4,400 of Rs 54,400; the app has no answer for "only part came", so the
  replay uses "it was rejected".
- **Officials' steps the app does not cover.** A "stop payment" put on the portal with no reason (Dharam Lal
  Patel) and accounts changed by an official (Shahjahanpur): the app has no step for these.
- **Where it matches.** e-KYC at a CSC or in the PM-KISAN app (Vishram Singh), land verification at the
  agriculture office (Rajendra; for Om Prakash Dubey the State named the tehsil), Aadhaar seeding at the bank branch (Geeta, Shrinivas Mishra),
  and the bank branch when the bank did not respond (Rajendra, as the CPIO advised).

## Limits

- This is not use in the field. No person in these cases used the app; the test replays what the decision says
  they would have answered.
- Where the decision does not say when the last payment came, `lastReceived` is `null` and replays as a recent
  one; where it does not say what the person saw, the replay covers every answer.
- The Shahjahanpur facts are allegations in an FIR, quoted in a bail order, not findings.
- Searched on indiankanoon.org only (about 40 searches); published orders are the cases someone took to a court
  or a commission, not a sample of all failed payments.

Read and rejected: decisions on eligibility (age on the Aadhaar card, income tax, service pensions), fraud
prosecutions where the accused took the benefit, RTI requests for village lists, and a farmer whose e-KYC was
late but who got every instalment.
