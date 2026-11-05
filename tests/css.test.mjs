import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Buttons get display:inline-flex, which beats the hidden attribute unless [hidden] is forced:
// without it "Next" shows on single-choice steps and skips a question unanswered.
test('styles.css keeps [hidden] elements hidden', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important;?\s*\}/);
});
