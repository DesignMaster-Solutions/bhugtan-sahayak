import { test } from 'node:test';
import assert from 'node:assert/strict';
import { likelyCauses, fixFor, CAUSES } from '../rules.js';

// Every reason the Union Government has published for a failed PM-KISAN payment, replayed through the app.
// 2025 "major reasons": PIB 2152566 (05/08/2025), sources/pib_2152566_pmkisan_failed_txn.txt.
// 2021 list: PIB 1739603 (27/07/2021), sources/pib_1739603_pmkisan_failed_2021.txt.
// APB return codes: NPCI SOP for the Aadhaar Payments Bridge v3.0.2, sources/dbtbharat_APB_SOP.txt.
// The README table "Official failure reasons" is this list; change both together.
const OFFICIAL = [
  { src: 'PIB 2152566', reason: 'De-seeding of Aadhaar from the NPCI mapper by the bank', cause: 'deseeded' },
  { src: 'PIB 2152566', reason: 'Non-mapping of Aadhaar to account number', code: '64', cause: 'not_mapped' },
  { src: 'PIB 2152566', reason: 'Account closure', code: '01', cause: 'account_closed' },
  { src: 'PIB 1739603', reason: 'Account closed/Transferred', code: '01', cause: 'account_closed' },
  { src: 'PIB 1739603', reason: 'Account Inactive', code: '53', cause: 'inoperative' },
  { src: 'PIB 1739603', reason: 'Account Dormant', code: '54', cause: 'inoperative' },
  { src: 'PIB 1739603', reason: 'Account Blocked or Frozen', code: '68', cause: 'kyc_frozen' },
  // The APB SOP lets a bank link a "fresh insert /inactive Aadhaar number" where the customer has given consent.
  { src: 'PIB 1739603', reason: 'Inactive Aadhar', cause: 'not_mapped' },
  { src: 'PIB 1739603', reason: 'Amount exceeds limit set on Account by Bank for Credit/Debit per transaction', code: '57', cause: null, why: 'gap' },
  // Aadhaar based payment is mandatory for PM-KISAN (PIB 2112399): the mapper routes it, not the IFSC.
  { src: 'PIB 1739603', reason: 'Invalid IFSC', cause: null, why: 'not under Aadhaar based payment' },
  { src: 'PIB 1739603', reason: 'Account Holder Expired', cause: null, why: 'not for the beneficiary to fix' },
  // "If any failed transaction still occurs, it is reprocessed from time to time" (PIB 2152566).
  { src: 'PIB 1739603', reason: 'Network failure', cause: null, why: 'reprocessed by the government' },
];

// What the PM-KISAN status page shows a farmer whose payment failed; e-KYC and land seeding already done.
const failed = likelyCauses({ scheme: 'pmkisan', symptom: 'rejected', lastReceived: 'under1y', ekyc: 'yes', land: 'yes' });

test('every official failure reason a beneficiary can fix at a bank is a reason the app shows, with its APB code', () => {
  for (const r of OFFICIAL.filter((o) => o.cause)) {
    assert.ok(CAUSES[r.cause], `${r.reason}: no cause ${r.cause}`);
    assert.ok(failed.includes(r.cause), `${r.reason}: ${r.cause} is not among ${failed.join(', ')}`);
    if (r.code) assert.ok(fixFor(r.cause).codes.includes(r.code), `${r.reason}: code ${r.code} not shown for ${r.cause}`);
  }
});

test('the reasons the app does not cover stay listed as not covered (no cause shows their code)', () => {
  const shown = new Set(Object.values(CAUSES).flatMap((c) => c.codes));
  for (const r of OFFICIAL.filter((o) => !o.cause && o.code)) assert.ok(!shown.has(r.code), `${r.reason}: code ${r.code} is now shown; update OFFICIAL and the README`);
});

test('coverage numbers in the README', () => {
  const y2025 = OFFICIAL.filter((o) => o.src === 'PIB 2152566');
  const y2021 = OFFICIAL.filter((o) => o.src === 'PIB 1739603');
  assert.deepEqual([y2025.filter((o) => o.cause).length, y2025.length], [3, 3]);
  assert.deepEqual([y2021.filter((o) => o.cause).length, y2021.filter((o) => o.why === 'gap').length, y2021.filter((o) => !o.cause && o.why !== 'gap').length, y2021.length], [5, 1, 3, 9]);
});
