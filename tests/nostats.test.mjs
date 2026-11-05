import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Runs the real counter lines of app.js with a fake browser, so ?nostats is checked on the shipped code.
const src = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const lines = src.split('\n').filter((l) => /^const (NOSTATS|count) =/.test(l)).join('\n');

function beacons(search, call) {
  const sent = [];
  const ctx = { location: { search }, URLSearchParams, lang: 'en', navigator: { sendBeacon: (u, b) => sent.push([u, b]) } };
  vm.runInNewContext(`${lines}\n${call}`, ctx);
  return sent;
}

test('both counter lines exist in app.js', () => assert.equal(lines.split('\n').length, 2));

test('a normal visit counts the event, with the top cause only on diagnose', () => {
  assert.deepEqual(beacons('', "count('copy');"), [['/api/event', JSON.stringify({ event: 'copy', lang: 'en' })]]);
  assert.deepEqual(beacons('', "count('diagnose', 'inoperative');"), [['/api/event', JSON.stringify({ event: 'diagnose', lang: 'en', cause: 'inoperative' })]]);
});

test('?nostats sends nothing', () => {
  assert.deepEqual(beacons('?nostats', "count('diagnose', 'inoperative'); count('copy');"), []);
  assert.deepEqual(beacons('?lang=hi&nostats', "count('share');"), []);
});
