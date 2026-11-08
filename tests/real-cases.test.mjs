// Replays real court and Information Commission decisions (evidence/real-cases) through the app's own rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { likelyCauses, checksFor, fixFor, CAUSES, ARREARS, SCHEMES, SYMPTOMS, LAST, CHANGES } from '../rules.js';
import { STRINGS } from '../i18n.js';

const dir = new URL('../evidence/real-cases/', import.meta.url);
const { cases } = JSON.parse(readFileSync(new URL('cases.json', dir), 'utf8'));
const flat = (s) => s.replace(/\s+/g, ' ');
const KINDS = ['aadhaar_not_seeded', 'aadhaar_other_account', 'scheme_ekyc_or_land', 'wrong_account_or_diverted', 'name_or_aadhaar_mismatch', 'bank_limit', 'not_stated'];
// Symptoms the replay covers: the person's own answer, or every answer when the decision does not say what they saw.
const symptomsOf = (c) => (c.answers.symptom ? [c.answers.symptom] : SYMPTOMS);
const rank = (list, id) => (list.includes(id) ? list.indexOf(id) + 1 : null);

test('there are 8 to 15 real cases, ids unique, each from a saved decision', () => {
  assert.ok(cases.length >= 8 && cases.length <= 15, String(cases.length));
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
});

for (const c of cases) {
  test(`${c.id}: every quote is verbatim in the saved decision`, () => {
    assert.match(c.url, /^https:\/\/indiankanoon\.org\/doc\/\d+\/$/);
    assert.equal(c.source, `sources/${c.url.match(/\d+/)[0]}.txt`);
    const src = flat(readFileSync(new URL(c.source, dir), 'utf8'));
    assert.ok(c.quotes.length >= 1);
    for (const q of c.quotes) assert.ok(src.includes(flat(q.text)), q.text);
  });

  test(`${c.id}: answers are ones the screens can give and causes are app causes`, () => {
    assert.ok(KINDS.includes(c.blocked_by), c.blocked_by);
    assert.ok(SCHEMES.includes(c.answers.scheme), c.answers.scheme);
    assert.ok(c.answers.symptom === null || SYMPTOMS.includes(c.answers.symptom));
    assert.ok(c.answers.lastReceived === null || LAST.includes(c.answers.lastReceived));
    for (const ch of c.answers.changes) assert.ok(CHANGES.includes(ch), ch);
    for (const id of c.causes) assert.ok(CAUSES[id], id);
    // Every stated cause is now a reason the app has; only an unstated cause has none.
    assert.equal(c.causes.length === 0, c.blocked_by === 'not_stated', c.blocked_by);
    assert.ok(c.divergence?.length > 20, 'every case records where the app and the decision differ');
  });

  test(`${c.id}: reasons the app lists for the person's answers`, () => {
    const got = Object.fromEntries(symptomsOf(c).map((s) => [s, likelyCauses({ ...c.answers, symptom: s })]));
    assert.deepEqual(got, c.replay);
  });

  test(`${c.id}: the fix, check and letter the app gives point where the decision does`, () => {
    for (const p of c.app_path) {
      const f = fixFor(p.cause);
      if (p.where) assert.ok(f.where.includes(p.where), `${p.cause}: fix not at ${p.where}`);
      if (p.check) assert.ok(checksFor(p.cause, c.answers.scheme).some((k) => k.id === p.check), `${p.cause}: no check ${p.check}`);
      if (p.letter) assert.equal(CAUSES[p.cause].letter, p.letter, p.cause);
    }
    // The bank return code the decision gives is shown by the cause the app gives for it.
    if (c.code) assert.ok(c.causes.some((id) => CAUSES[id].codes.includes(c.code)), `code ${c.code} not shown for ${c.id}`);
  });
}

test('the arrears warning cites exactly the decisions that cut arrears, and names no amount', () => {
  const cut = cases.filter((c) => c.arrears_limit);
  assert.deepEqual(cut.map((c) => [c.id, c.arrears_limit]), [['cic-2019-sushila', '6 months'], ['cic-2025-madhu-devki', '1 year']]);
  assert.deepEqual(ARREARS.source.map((s) => s.url), cut.map((c) => c.url));
  assert.match(STRINGS.en[ARREARS.note], /6 months.*1 year/);
  assert.match(STRINGS.hi[ARREARS.note], /6 महीने.*1 साल/);
});

// The numbers the README and the status write; computed here so a wrong number fails.
function aggregates() {
  const by = (k) => cases.filter((c) => c.blocked_by === k).length;
  const named = cases.filter((c) => c.causes.length);
  const known = named.filter((c) => c.answers.symptom);
  const unknown = named.filter((c) => !c.answers.symptom);
  const knownRanks = known.map((c) => rank(c.replay[c.answers.symptom], c.causes[0]));
  const anyShown = unknown.filter((c) => SYMPTOMS.some((s) => rank(c.replay[s], c.causes[0])));
  return {
    total: cases.length, named: named.length, gaps: cases.filter((c) => !c.causes.length && c.blocked_by !== 'not_stated').length, notStated: by('not_stated'),
    knownShown: knownRanks.filter(Boolean).length, known: known.length, first: knownRanks.filter((r) => r === 1).length,
    unknown: unknown.length, unknownShown: anyShown.length,
    people: cases.reduce((s, c) => s + (c.people || 0), 0),
    pmkisan: cases.filter((c) => c.answers.scheme === 'pmkisan').length,
    kinds: Object.fromEntries(KINDS.map((k) => [k, by(k)])),
  };
}

test('aggregate numbers as computed today (change the README and status together)', () => {
  assert.deepEqual(aggregates(), {
    total: 12, named: 10, gaps: 0, notStated: 2, knownShown: 7, known: 7, first: 1, unknown: 3, unknownShown: 3, people: 11, pmkisan: 6,
    kinds: { aadhaar_not_seeded: 2, aadhaar_other_account: 1, scheme_ekyc_or_land: 2, wrong_account_or_diverted: 2, name_or_aadhaar_mismatch: 2, bank_limit: 1, not_stated: 2 },
  });
});

test('aggregates written in the README match cases.json', () => {
  const a = aggregates();
  const readme = flat(readFileSync(new URL('README.md', dir), 'utf8'));
  for (const s of [
    `${a.total} decisions`, `${a.people} named beneficiaries`, `${a.pmkisan} PM-KISAN`, `${a.named} of ${a.total}`,
    `${a.knownShown} of ${a.known}`, `first in ${a.first}`, `${a.unknownShown} of ${a.unknown}`, `${a.gaps} gaps`, `not stated: ${a.notStated}`,
  ]) assert.ok(readme.includes(s), s);
});
