import { test } from 'node:test';
import assert from 'node:assert/strict';
import { likelyCauses, checksFor, fixFor, requestText, CAUSES, SCHEMES, SYMPTOMS, LAST, CHANGES, WHERE } from '../rules.js';

const YNU = ['yes', 'no', 'unsure'];
const changeSets = [[], ['none'], ...Array.from({ length: 2 ** CHANGES.length - 1 }, (_, k) => CHANGES.filter((_, i) => (k + 1) & (1 << i)))];

// Every possible set of answers the screens can produce.
const ALL = [];
for (const scheme of SCHEMES) for (const symptom of SYMPTOMS) for (const lastReceived of LAST) for (const changes of changeSets) {
  for (const ekyc of scheme === 'pmkisan' ? YNU : [undefined]) for (const land of scheme === 'pmkisan' ? YNU : [undefined]) {
    ALL.push({ scheme, symptom, lastReceived, changes, ekyc, land });
  }
}
const at = (input) => likelyCauses(input);
const label = (i) => JSON.stringify(i);
// A cause must be within the top n, unless every cause above it is a stronger lead that the person's answers also triggered.
function within(r, id, n, stronger, input) {
  const idx = r.indexOf(id);
  if (idx >= 0 && idx < n) return;
  assert.ok(r.slice(0, n).every((x) => stronger.includes(x)), `${id} not in top ${n}: ${r} for ${label(input)}`);
}

const CAUSE_IDS = Object.keys(CAUSES);
const base = { scheme: 'pension', symptom: 'stopped', lastReceived: 'under1y', changes: [] };

test('the CHANGES list matches the question (new / closed / KYC / Aadhaar number / name)', () => {
  assert.deepEqual(CHANGES, ['new_account', 'closed_account', 'kyc_pending', 'aadhaar_wrong', 'name_differs']);
});

test('every scheme x symptom gives 1 to 6 causes, no duplicates, all known', () => {
  for (const i of ALL) {
    const r = at(i);
    assert.ok(r.length >= 1 && r.length <= 6, `${r.length} causes for ${label(i)}`);
    assert.equal(new Set(r).size, r.length, `duplicate in ${r}`);
    for (const id of r) assert.ok(CAUSE_IDS.includes(id), `unknown cause ${id}`);
  }
});

test('every cause has at least one official https check for every scheme, with path and needs', () => {
  for (const id of CAUSE_IDS) for (const scheme of SCHEMES) {
    const checks = checksFor(id, scheme);
    assert.ok(checks.length >= 1, `${id}/${scheme}`);
    for (const c of checks) {
      assert.match(c.url, /^https:\/\/[a-z0-9.-]+\.(gov\.in|nic\.in|org\.in)\//, `${id}: ${c.url}`);
      assert.ok(c.name && c.path && c.needs, `${id}: incomplete check`);
    }
  }
});

test('every cause has a fix with a known place, a source and its Verified item', () => {
  for (const id of CAUSE_IDS) {
    const f = fixFor(id);
    assert.ok(f.fix && f.where.length >= 1 && Array.isArray(f.carry), id);
    for (const w of f.where) assert.ok(WHERE.includes(w), `${id}: where ${w}`);
    for (const c of f.carry) assert.ok(['passbook', 'aadhaar_card', 'utr'].includes(c), `${id}: carry ${c}`);
    assert.ok(f.source.length >= 1 && f.source.every((s) => s.url.startsWith('https://')), id);
    assert.ok(CAUSES[id].items.length >= 1, `${id} has no Verified item`);
  }
});

test('rule: "went to another account" or a new account leads with the NPCI mapper', () => {
  for (const i of ALL) {
    const r = at(i);
    if (i.symptom === 'other_account') assert.equal(r[0], 'mapper_other_bank', label(i));
    else if (i.changes.includes('new_account')) {
      // Stronger leads: "paid" means the money left (check the UTR first); PM-KISAN e-KYC pending blocks any payment.
      const pmEkyc = i.scheme === 'pmkisan' && i.ekyc !== 'yes';
      if (i.symptom !== 'paid_not_received' && !pmEkyc) assert.equal(r[0], 'mapper_other_bank', label(i));
      else assert.ok(r.includes('mapper_other_bank'), label(i));
    }
  }
});

test('rule: a closed account puts account_closed and deseeded in the top 3', () => {
  const stronger = ['credited_elsewhere', 'mapper_other_bank', 'pmkisan_ekyc', 'kyc_frozen'];
  for (const i of ALL) if (i.changes.includes('closed_account')) {
    const r = at(i);
    within(r, 'account_closed', 3, [...stronger, 'deseeded'], i);
    within(r, 'deseeded', 3, [...stronger, 'account_closed'], i);
  }
  const r = at({ ...base, changes: ['closed_account'] });
  assert.deepEqual(r.slice(0, 2).sort(), ['account_closed', 'deseeded']);
});

test('rule: over two years (or 1-2 years and stopped) lists inoperative, never first when it went to another account', () => {
  for (const i of ALL) {
    const old = i.lastReceived === 'over2y' || (i.lastReceived === '1to2y' && i.symptom === 'stopped');
    if (!old) continue;
    const r = at(i);
    assert.ok(r.includes('inoperative'), label(i));
    if (i.symptom === 'other_account') assert.notEqual(r[0], 'inoperative', label(i));
  }
  assert.equal(at({ ...base, lastReceived: 'over2y' })[0], 'inoperative');
});

test('rule: "bank asked for KYC papers" puts kyc_frozen in the top 2', () => {
  for (const i of ALL) if (i.changes.includes('kyc_pending')) {
    within(at(i), 'kyc_frozen', 2, ['credited_elsewhere', 'mapper_other_bank', 'pmkisan_ekyc'], i);
  }
  assert.equal(at({ ...base, changes: ['kyc_pending'] })[0], 'kyc_frozen');
});

test('rule: PM-KISAN e-KYC not done leads, unless it went to another account; land not verified is listed', () => {
  for (const i of ALL) if (i.scheme === 'pmkisan') {
    const r = at(i);
    if (i.ekyc !== 'yes') {
      if (i.symptom === 'other_account') assert.equal(r[0], 'mapper_other_bank');
      else if (i.symptom === 'paid_not_received') assert.equal(r[0], 'credited_elsewhere');
      else assert.equal(r[0], 'pmkisan_ekyc', label(i));
    }
    if (i.land !== 'yes') assert.ok(r.includes('pmkisan_land'), label(i));
  }
});

test('rule: MGNREGA always lists ABPS; "paid but not in passbook" leads with the UTR check', () => {
  for (const i of ALL) {
    const r = at(i);
    if (i.scheme === 'mgnrega') assert.ok(r.includes('mgnrega_abps'), label(i));
    if (i.symptom === 'paid_not_received') assert.equal(r[0], 'credited_elsewhere', label(i));
  }
});

test('rule: never came with no other signal leads with "Aadhaar not mapped"', () => {
  for (const scheme of SCHEMES) for (const lastReceived of ['never', 'under1y']) for (const changes of [[], ['none']]) {
    const i = { scheme, symptom: 'never_came', lastReceived, changes, ekyc: 'yes', land: 'yes' };
    assert.equal(at(i)[0], 'not_mapped', label(i));
  }
});

test('rule: a wrong Aadhaar number or a name written differently lists its cause, unless stronger leads fill the list', () => {
  // Stronger: the leads the person's other answers trigger, all pushed before these two.
  const stronger = ['credited_elsewhere', 'mapper_other_bank', 'pmkisan_ekyc', 'kyc_frozen', 'account_closed', 'deseeded', 'inoperative', 'mgnrega_abps', 'pmkisan_land'];
  for (const i of ALL) {
    const r = at(i);
    if (i.changes.includes('aadhaar_wrong')) within(r, 'record_aadhaar', 6, [...stronger, 'name_mismatch'], i);
    if (i.changes.includes('name_differs')) within(r, 'name_mismatch', 6, [...stronger, 'record_aadhaar'], i);
  }
  // Ticked alone, it comes right after the leads the person's other answers trigger.
  assert.equal(at({ ...base, changes: ['aadhaar_wrong'] })[0], 'record_aadhaar');
  assert.equal(at({ ...base, changes: ['name_differs'] })[0], 'name_mismatch');
});

test('rule: never came with no other signal also lists a name or bank details mismatch (Madhu, CIC 2025)', () => {
  for (const scheme of SCHEMES) {
    const i = { scheme, symptom: 'never_came', lastReceived: 'never', changes: [], ekyc: 'yes', land: 'yes' };
    assert.ok(at(i).includes('name_mismatch'), label(i));
  }
});

test('rule: rejected lists the credit limit (APB codes 57 / 58); a rejected scholarship lists it second', () => {
  // MGNREGA keeps ABPS in the list (PIB 2112199), so its 6 places go to ABPS and the usual reasons.
  for (const scheme of SCHEMES.filter((s) => s !== 'mgnrega')) {
    const i = { scheme, symptom: 'rejected', lastReceived: 'under1y', changes: [], ekyc: 'yes', land: 'yes' };
    assert.ok(at(i).includes('bank_limit'), label(i));
  }
  assert.equal(at({ scheme: 'scholarship', symptom: 'rejected', lastReceived: 'under1y', changes: [] })[1], 'bank_limit');
  assert.deepEqual(fixFor('bank_limit').codes, ['57', '58']);
  assert.ok(fixFor('bank_limit').where.includes('bank_branch'));
  for (const p of ['limit_not_for_dbt', 'jandhan_bsbd']) assert.ok(fixFor('bank_limit').points.includes(p), p);
});

test('rule: "went to another account" also lists the UTR trace (money sent to a wrong account number)', () => {
  for (const i of ALL) if (i.symptom === 'other_account' && !i.changes.length) assert.ok(at(i).includes('credited_elsewhere'), label(i));
});

test('a wrong Aadhaar number or name on the record is fixed at the scheme office, the name also at an Aadhaar centre', () => {
  assert.deepEqual(fixFor('record_aadhaar').where, ['scheme_office']);
  assert.deepEqual(fixFor('name_mismatch').where, ['scheme_office', 'aadhaar_centre']);
  assert.match(requestText('record_aadhaar', 'en'), /correct the Aadhaar number/);
  assert.match(requestText('name_mismatch', 'en'), /correct my name and bank details/);
});

test('inoperative fix says DBT counts, scholarship/DBT accounts exempt, KYC at any branch, no charge, three working days', () => {
  const f = fixFor('inoperative');
  assert.equal(f.fix, 'fix_inoperative');
  for (const p of ['dbt_counts', 'dbt_accounts_exempt', 'any_branch', 'no_charge', 'three_days']) {
    assert.ok(f.points.includes(p), `inoperative fix lost "${p}"`);
  }
  assert.ok(f.where.includes('bank_branch'));
  assert.ok(f.source.some((s) => s.url.includes('rbi.org.in')));
});

const FORBIDDEN = [/will get/i, /will be paid/i, /guarantee/i, /मिल जाएगा/, /गारंटी/, /₹/, /\bRs\b/i, /rupee/i, /रुपये/, /रुपए/];

test('requestText never promises money, never names an amount, keeps the blanks, in both languages', () => {
  for (const id of CAUSE_IDS) for (const lang of ['en', 'hi']) {
    const t = requestText(id, lang);
    for (const re of FORBIDDEN) assert.doesNotMatch(t, re, `${id}/${lang}`);
    assert.ok((t.match(/______/g) || []).length >= 3, `${id}/${lang} lost its blanks`);
  }
});

test('the reactivation request cites the RBI circular of 1 January 2024 and "no charge"', () => {
  for (const id of ['inoperative', 'kyc_frozen']) {
    assert.match(requestText(id, 'en'), /RBI circular of 1 January 2024/);
    assert.match(requestText(id, 'en'), /no charge/i);
    assert.match(requestText(id, 'hi'), /कोई शुल्क नहीं/);
  }
});

test('no output of any rules.js function contains a 12-digit number (an Aadhaar-like number)', () => {
  const outs = [];
  for (const i of ALL) outs.push(at(i));
  for (const id of CAUSE_IDS) {
    outs.push(fixFor(id), requestText(id, 'en'), requestText(id, 'hi'));
    for (const s of SCHEMES) outs.push(checksFor(id, s));
  }
  for (const o of outs) assert.doesNotMatch(JSON.stringify(o), /\d{12}/);
});
