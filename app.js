import { likelyCauses, checksFor, fixFor, requestText, ARREARS, SCHEMES, SYMPTOMS, LAST, CHANGES } from './rules.js';
import { STRINGS } from './i18n.js';

const $ = (id) => document.getElementById(id);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const LANGS = ['en', 'hi'];
const qLang = new URLSearchParams(location.search).get('lang');
let lang = LANGS.includes(qLang) ? qLang : localStorage.getItem('bs-lang') || (navigator.language?.startsWith('hi') ? 'hi' : 'en');
const t = (key) => STRINGS[lang][key];
// Anonymous usage count for the impact data: event name, language and, on diagnose, the top cause id only.
// ?nostats keeps our own tests and demo recordings out of the public impact numbers.
const NOSTATS = new URLSearchParams(location.search).has('nostats');
const count = (event, cause) => NOSTATS || navigator.sendBeacon?.('/api/event', JSON.stringify(cause ? { event, lang, cause } : { event, lang }));

const ICON = {
  pmkisan: '🌾', pension: '👵', mgnrega: '⛏️', scholarship: '🎓', other: '🏦',
  never_came: '🚫', stopped: '⏸️', other_account: '🔀', paid_not_received: '📒', rejected: '❌',
  never: '🚫', under1y: '📅', '1to2y': '📆', over2y: '⌛',
  new_account: '🆕', closed_account: '🔒', kyc_pending: '📄', aadhaar_wrong: '🔢', name_differs: '🔤', none: '➖',
  yes: '✅', no: '❌', unsure: '❓',
};
const YNU = ['yes', 'no', 'unsure'];
const pm = (a) => a.scheme === 'pmkisan';
const QUESTIONS = [
  { id: 'scheme', opts: SCHEMES },
  { id: 'symptom', opts: SYMPTOMS },
  { id: 'last', opts: LAST },
  { id: 'changes', opts: [...CHANGES, 'none'], multi: true },
  { id: 'ekyc', opts: YNU, when: pm },
  { id: 'land', opts: YNU, when: pm },
];

let view = 'intro';
let answers = {};
let index = 0;
let causes = [];
let letterLang = {};
let worked = false;

const steps = () => QUESTIONS.filter((q) => !q.when || q.when(answers));
const input = () => ({ scheme: answers.scheme, symptom: answers.symptom, lastReceived: answers.last, changes: answers.changes || [], ekyc: answers.ekyc, land: answers.land });

function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));
  return e;
}

function show(id) {
  view = id;
  for (const s of ['intro', 'quiz', 'result']) $(s).hidden = s !== id;
  render();
  $(id).querySelector('[tabindex="-1"]')?.focus();
}

function render() {
  document.documentElement.lang = lang;
  document.title = `${t('title')} · ${t('tagline')}`;
  for (const e of document.querySelectorAll('[data-t]')) e.textContent = t(e.dataset.t);
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', b.dataset.lang === lang);
  if (view === 'quiz') renderQuestion();
  if (view === 'result') renderResult();
}

function optButton(opt, chosen, onclick) {
  const hint = t(`h_${opt}`);
  return el('button', { type: 'button', className: chosen ? 'opt chosen' : 'opt', onclick },
    el('span', { className: 'ico', ariaHidden: 'true', textContent: ICON[opt] }),
    el('span', {}, el('span', { className: 'lbl', textContent: t(`o_${opt}`) }), hint && el('small', { textContent: hint })));
}

function renderQuestion() {
  const list = steps();
  const q = list[index];
  $('step').textContent = fill(t('step'), { n: index + 1, total: list.length });
  $('bar').style.width = `${(index / list.length) * 100}%`;
  $('question').textContent = t(`q_${q.id}`);
  $('pick').hidden = !q.multi;
  $('next').hidden = !q.multi;
  if (q.multi) {
    const sel = answers.changes || [];
    $('answers').replaceChildren(...q.opts.map((opt) => {
      const on = opt === 'none' ? answers.changes !== undefined && sel.length === 0 : sel.includes(opt);
      const b = optButton(opt, on, () => toggle(opt));
      b.setAttribute('aria-pressed', on);
      return b;
    }));
  } else {
    $('answers').replaceChildren(...q.opts.map((opt) => optButton(opt, answers[q.id] === opt, () => answer(q.id, opt))));
  }
}

function toggle(opt) {
  const sel = new Set(answers.changes || []);
  if (opt === 'none') sel.clear();
  else if (sel.has(opt)) sel.delete(opt);
  else sel.add(opt);
  answers.changes = [...sel];
  renderQuestion();
}

function advance() {
  if (++index < steps().length) { renderQuestion(); $('question').focus(); return; }
  causes = likelyCauses(input());
  letterLang = {};
  worked = false;
  show('result');
  count('diagnose', causes[0]);
}

function answer(id, value) {
  answers[id] = value;
  advance();
}

const voiceFor = (l) => {
  const vs = globalThis.speechSynthesis?.getVoices() || [];
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  return l === 'hi' ? vs.find((v) => norm(v).startsWith('hi')) : vs.find((v) => norm(v) === 'en-in') || vs.find((v) => norm(v).startsWith('en'));
};

function letterBlock(cause, i) {
  const l = letterLang[cause] || lang;
  const text = requestText(cause, l);
  const other = l === 'en' ? 'hi' : 'en';
  const voice = voiceFor(l);
  const copyBtn = el('button', { type: 'button', className: 'link', textContent: t('copy') });
  copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* old browsers: the text stays selectable on screen */ }
    copyBtn.textContent = t('copied');
    count('copy');
  };
  const readBtn = voice && el('button', { type: 'button', className: 'link', textContent: t('read_aloud') });
  if (readBtn) {
    readBtn.onclick = () => {
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); readBtn.textContent = t('read_aloud'); return; }
      const u = Object.assign(new SpeechSynthesisUtterance(text.replace(/_{3,}/g, ' ')), { voice, lang: voice.lang });
      u.onend = () => { readBtn.textContent = t('read_aloud'); };
      speechSynthesis.speak(u);
      readBtn.textContent = t('stop_reading');
    };
  }
  return el('details', { className: 'letter', open: i === 0 },
    el('summary', { textContent: t('letter_title') }),
    el('p', { className: 'hint', textContent: t('letter_hint') }),
    el('pre', { lang: l, textContent: text }),
    el('div', { className: 'actions' },
      el('a', { className: 'btn primary', href: `https://wa.me/?text=${encodeURIComponent(text)}`, target: '_blank', rel: 'noopener', textContent: t('share_wa'), onclick: () => count('share') }),
      copyBtn,
      readBtn,
      el('button', { type: 'button', className: 'link', lang: other, textContent: STRINGS[l].other_lang, onclick: () => { letterLang[cause] = other; renderResult(); } })));
}

function causeCard(cause, i) {
  const f = fixFor(cause);
  const codes = f.codes.length ? `${t('code_label')}: ${f.codes.join(', ')} · ` : '';
  return el('article', { className: 'cause' },
    el('p', { className: 'step', textContent: fill(t('reason_n'), { n: i + 1 }) }),
    el('h3', { textContent: t(`c_${cause}`) }),
    el('p', { textContent: t(`d_${cause}`) }),
    el('p', { className: 'src' }, codes, `${t('source_label')}: `,
      f.source.flatMap((s, j) => [j ? ' · ' : '', el('a', { href: s.url, target: '_blank', rel: 'noopener', textContent: s.name })])),
    el('h4', { textContent: t('check_title') }),
    el('ul', { className: 'checks' }, checksFor(cause, answers.scheme).map((c) => el('li', {},
      el('a', { href: c.url, target: '_blank', rel: 'noopener', textContent: c.name }),
      el('p', { textContent: t(c.path) }),
      el('p', { className: 'hint', textContent: `${t('needs_label')}: ${t(c.needs)}` })))),
    el('h4', { textContent: t('fix_title') }),
    el('p', { textContent: t(f.fix) }),
    f.points.length > 0 && el('ul', { className: 'points' }, f.points.map((p) => el('li', { textContent: t(`p_${p}`) }))),
    el('p', {}, el('b', { textContent: `${t('where_label')}: ` }), f.where.map((w) => t(`where_${w}`)).join(' / ')),
    el('p', {}, el('b', { textContent: `${t('carry_label')}: ` }), f.carry.length ? f.carry.map((c) => t(`carry_${c}`)).join(', ') : t('carry_ask')),
    letterBlock(cause, i));
}

function renderResult() {
  $('arrears').replaceChildren(el('b', { textContent: t(ARREARS.note) }), ` ${t('source_label')}: `,
    ARREARS.source.flatMap((s, j) => [j ? ' · ' : '', el('a', { href: s.url, target: '_blank', rel: 'noopener', textContent: s.name })]));
  $('causes').replaceChildren(...causes.map(causeCard));
  $('worked-btns').hidden = worked;
  $('worked-thanks').hidden = !worked;
}

$('start').onclick = () => { answers = {}; index = 0; show('quiz'); };
$('next').onclick = () => { answers.changes ||= []; advance(); };
$('back').onclick = () => { if (index > 0) { index--; renderQuestion(); } else show('intro'); };
$('restart').onclick = () => show('intro');
for (const b of document.querySelectorAll('[data-worked]')) {
  b.onclick = () => { worked = true; count(`worked_${b.dataset.worked}`); renderResult(); };
}
for (const b of document.querySelectorAll('[data-lang]')) {
  b.onclick = () => { lang = b.dataset.lang; localStorage.setItem('bs-lang', lang); render(); };
}
globalThis.speechSynthesis?.addEventListener?.('voiceschanged', () => view === 'result' && renderResult());
render();
