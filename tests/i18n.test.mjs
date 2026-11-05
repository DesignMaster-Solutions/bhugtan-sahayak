import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS } from '../i18n.js';
import { CAUSES, CHECKS, WHERE, SCHEMES, SYMPTOMS, LAST, CHANGES, fixFor } from '../rules.js';

test('en and hi have exactly the same keys and no empty string', () => {
  assert.deepEqual(Object.keys(STRINGS.hi).sort(), Object.keys(STRINGS.en).sort());
  for (const lang of ['en', 'hi']) for (const [k, v] of Object.entries(STRINGS[lang])) {
    assert.ok(typeof v === 'string' && v.trim(), `${lang}.${k} is empty`);
  }
});

test('every key the rules and screens refer to exists', () => {
  const keys = [
    ...[...SCHEMES, ...SYMPTOMS, ...LAST, ...CHANGES, 'none', 'yes', 'no', 'unsure'].map((o) => `o_${o}`),
    ...Object.keys(CAUSES).flatMap((id) => [`c_${id}`, `d_${id}`, fixFor(id).fix, ...CAUSES[id].points.map((p) => `p_${p}`)]),
    ...Object.keys(CHECKS).flatMap((id) => [`path_${id}`, `needs_${id}`]),
    ...WHERE.map((w) => `where_${w}`),
    ...['passbook', 'aadhaar_card', 'utr'].map((c) => `carry_${c}`),
  ];
  for (const k of keys) assert.ok(k in STRINGS.en, `missing ${k}`);
});

test('no string promises money or names an amount', () => {
  for (const lang of ['en', 'hi']) for (const [k, v] of Object.entries(STRINGS[lang])) {
    assert.doesNotMatch(v, /will get|will be paid|guarantee|मिल जाएगा|गारंटी|₹|\bRs\b|rupee|रुपये|रुपए/i, `${lang}.${k}`);
  }
});
