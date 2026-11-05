import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { Counter } from '../worker.js';

class FakeStorage {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.get(k); }
  async put(k, v) { this.m.set(k, v); }
  async list() { return new Map(this.m); }
}
const counter = () => new Counter({ storage: new FakeStorage() });
const post = (body, path = '/api/event') => new Request(`https://x${path}`, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
const stats = async (c) => (await (await c.fetch(new Request('https://x/api/stats'))).json()).counts;
const today = () => new Date().toISOString().slice(0, 10);

test('a diagnosis is counted in total, per language, per day and per top cause', async () => {
  const c = counter();
  for (let n = 0; n < 2; n++) assert.equal((await c.fetch(post({ event: 'diagnose', lang: 'hi', cause: 'inoperative' }))).status, 204);
  const s = await stats(c);
  assert.equal(s['total:diagnose'], 2);
  assert.equal(s['lang:hi:diagnose'], 2);
  assert.equal(s[`day:${today()}:diagnose`], 2);
  assert.equal(s['cause:inoperative'], 2);
});

test('copy, share and the three "Did it work?" answers are counted', async () => {
  const c = counter();
  for (const event of ['copy', 'share', 'worked_yes', 'worked_no', 'worked_notyet']) {
    assert.equal((await c.fetch(post({ event, lang: 'en' }))).status, 204, event);
  }
  const s = await stats(c);
  for (const event of ['copy', 'share', 'worked_yes', 'worked_no', 'worked_notyet']) assert.equal(s[`total:${event}`], 1);
});

test('bad events are rejected with 400 and nothing is stored', async () => {
  const c = counter();
  const bad = [
    { event: 'name', lang: 'en' },
    { event: 'copy', lang: 'xx' },
    { event: 'diagnose', lang: 'en' },
    { event: 'diagnose', lang: 'en', cause: 'aadhaar_123' },
    { event: 'copy', lang: 'en', cause: 'inoperative' },
    '{not json',
  ];
  for (const b of bad) assert.equal((await c.fetch(post(b))).status, 400, JSON.stringify(b));
  assert.deepEqual(await stats(c), {});
});

test('only event name, language, day and top cause are stored, never extra fields', async () => {
  const c = counter();
  await c.fetch(post({ event: 'diagnose', lang: 'en', cause: 'not_mapped', scheme: 'pmkisan', aadhaar: 'x' }));
  const keys = Object.keys(await stats(c)).sort();
  assert.deepEqual(keys, ['cause:not_mapped', `day:${today()}:diagnose`, 'lang:en:diagnose', 'total:diagnose']);
});

test('the worker routes /api/event (POST) and /api/stats (GET); wrong method 405, unknown /api 404, rest is static', async () => {
  const seen = [];
  const env = {
    ASSETS: { fetch: async (r) => { seen.push(new URL(r.url).pathname); return new Response('asset'); } },
    COUNTER: { idFromName: (n) => n, get: () => counter() },
  };
  assert.equal(await (await worker.fetch(new Request('https://x/'), env)).text(), 'asset');
  assert.equal(await (await worker.fetch(new Request('https://x/stats'), env)).text(), 'asset');
  assert.equal((await worker.fetch(new Request('https://x/api/stats'), env)).status, 200);
  assert.equal((await worker.fetch(post({ event: 'share', lang: 'en' }), env)).status, 204);
  assert.equal((await worker.fetch(new Request('https://x/api/event'), env)).status, 405);
  assert.equal((await worker.fetch(post({}, '/api/stats'), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://x/api/other'), env)).status, 404);
  assert.deepEqual(seen, ['/', '/stats']);
});
