// Someone at home can run the questions and send the same result to the relative whose money stopped.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shareUrl, answersFrom, likelyCauses } from '../rules.js';
import { STRINGS } from '../i18n.js';

const O = 'https://x.example';
const CASES = [
  { scheme: 'pension', symptom: 'stopped', last: 'under1y', changes: [] },
  { scheme: 'mgnrega', symptom: 'never_came', last: 'never', changes: ['new_account', 'name_differs'] },
  { scheme: 'pmkisan', symptom: 'rejected', last: '1to2y', changes: ['kyc_pending'], ekyc: 'no', land: 'unsure' },
];
const causes = (a) => likelyCauses({ ...a, lastReceived: a.last });

test('answers round-trip through the link and give the same reasons', () => {
  for (const a of CASES) {
    for (const lang of ['en', 'hi']) {
      const url = new URL(shareUrl(O, a, lang));
      assert.equal(url.searchParams.get('lang'), lang);
      assert.equal(url.pathname, '/');
      const back = answersFrom(url.search);
      assert.deepEqual(back, a);
      assert.deepEqual(causes(back), causes(a));
    }
  }
});

test('the link carries only the language and the answers; e-KYC and land only for PM-KISAN', () => {
  const keys = (a) => [...new URL(shareUrl(O, { ...a, name: 'x', aadhaar: '1234' }, 'hi')).searchParams.keys()].sort();
  assert.deepEqual(keys(CASES[0]), ['changes', 'lang', 'last', 'scheme', 'symptom']);
  assert.deepEqual(keys(CASES[2]), ['changes', 'ekyc', 'land', 'lang', 'last', 'scheme', 'symptom']);
});

test('a missing or unknown answer opens the normal first screen', () => {
  const edit = (a, fn) => { const p = new URL(shareUrl(O, a, 'en')).searchParams; fn(p); return `?${p}`; };
  const bad = [
    '', '?lang=hi',
    edit(CASES[0], (p) => p.delete('last')),
    edit(CASES[0], (p) => p.delete('changes')),
    edit(CASES[0], (p) => p.set('scheme', '<script>')),
    edit(CASES[1], (p) => p.set('changes', 'new_account,none')),
    edit(CASES[2], (p) => p.delete('ekyc')),
    edit(CASES[2], (p) => p.set('land', 'maybe')),
  ];
  for (const s of bad) assert.equal(answersFrom(s), null, s);
});

test('app.js opens a shared link on the result and offers the link; worker and /stats know the event', () => {
  const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  const app = read('app.js');
  assert.match(app, /answersFrom\(location\.search\)/);
  assert.match(app, /shareUrl\(location\.origin, answers, lang\)/);
  assert.match(app, /count\('share_link'\)/);
  assert.match(read('index.html'), /id="pass"/);
  for (const f of ['worker.js', 'stats.html']) assert.ok(read(f).includes("'share_link'"), f);
  for (const l of ['en', 'hi']) for (const k of ['pass_on', 'pass_text']) assert.ok(STRINGS[l][k], `${l}.${k}`);
});
