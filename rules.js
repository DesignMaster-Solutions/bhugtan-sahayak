// Bhugtan Sahayak rules: pure functions, no DOM. Every cause, check and fix cites a numbered item of
// "Verified on 05/11/2026" in BRIEF.md. Texts are i18n keys (i18n.js) so one rule set serves both languages.
import { STRINGS } from './i18n.js';

export const SCHEMES = ['pmkisan', 'pension', 'mgnrega', 'scholarship', 'other'];
export const SYMPTOMS = ['never_came', 'stopped', 'other_account', 'paid_not_received', 'rejected'];
export const LAST = ['never', 'under1y', '1to2y', 'over2y'];
export const CHANGES = ['new_account', 'closed_account', 'kyc_pending', 'aadhaar_wrong', 'name_differs'];
export const WHERE = ['bank_branch', 'ippb', 'csc', 'scheme_office', 'aadhaar_centre'];

const PIB = (id) => `https://www.pib.gov.in/PressReleasePage.aspx?PRID=${id}`;
export const SOURCES = {
  apb_sop: { name: 'NPCI SOP, Aadhaar Payments Bridge v3.0.2 (17/02/2021)', url: 'https://dbtbharat.gov.in/data/dbt_payments/Standard-Operating-Procedure-of-Aadhaar-Payments-Bridge-(APB).pdf' },
  uidai_faq: { name: 'UIDAI FAQ: Direct Benefit Transfer', url: 'https://uidai.gov.in/en/direct-benefit-transfer' },
  rbi_2024: { name: 'RBI circular of 1 January 2024 (RBI/2023-24/105)', url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12589&Mode=0' },
  ippb: { name: 'India Post Payments Bank: doorstep banking and DBT', url: 'https://www.ippbonline.com/' },
  pib_1739603: { name: 'PIB 1739603 (27/07/2021): PM-KISAN transaction failures and the Correction Module', url: PIB(1739603) },
  pib_2152566: { name: 'PIB 2152566 (05/08/2025): PM-KISAN transaction failures', url: PIB(2152566) },
  pib_2112399: { name: 'PIB 2112399 (18/03/2025): PM-KISAN land seeding, Aadhaar payment and e-KYC mandatory', url: PIB(2112399) },
  pib_2330414: { name: 'PIB 2330414 (30/10/2026): PM-KISAN e-KYC by OTP, biometric or face', url: PIB(2330414) },
  pib_2112199: { name: 'PIB 2112199 (18/03/2025): MGNREGA wages through ABPS', url: PIB(2112199) },
  vbgramg_faq: { name: 'PIB FAQ on the VB-G RAM G Act, 2025 (11/05/2026): MGNREGA repealed from 1 July 2026, job cards, wages in 15 days', url: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/may/doc2026511867701.pdf' },
  pmkisan: { name: 'PM-KISAN: Know Your Status', url: 'https://pmkisan.gov.in/BeneficiaryStatus_New.aspx' },
  pfms: { name: 'PFMS: Know Your Payments', url: 'https://pfms.nic.in/static/KnowYourPayment_new.aspx' },
  rti_online: { name: 'RTI Online (DoPT) FAQ: no fee below the poverty line, first appeal free and after 30 days', url: 'https://rtionline.gov.in/faq.php' },
  cpgrams: { name: 'CPGRAMS (DARPG) FAQ: 21 days to redress, appeal within 30 days', url: 'https://pgportal.gov.in/Home/Faq' },
};

// items = BRIEF "Verified" item numbers; codes = APB return codes (item 2); points = extra i18n lines (p_*).
export const CAUSES = {
  mapper_other_bank: { items: [1, 3, 4], codes: [], src: ['apb_sop', 'uidai_faq'], fix: ['bank_branch'], carry: ['passbook', 'aadhaar_card'], letter: 'seed', points: ['one_account'] },
  not_mapped: { items: [2, 3, 4, 10], codes: ['64', '96'], src: ['apb_sop', 'uidai_faq', 'pib_2152566', 'ippb'], fix: ['bank_branch', 'ippb'], carry: ['passbook', 'aadhaar_card'], letter: 'seed', points: ['ippb_open'] },
  deseeded: { items: [1, 2, 4], codes: ['95'], src: ['apb_sop', 'uidai_faq', 'pib_2152566'], fix: ['bank_branch'], carry: ['passbook', 'aadhaar_card'], letter: 'seed', points: ['deseed_no_consent'] },
  account_closed: { items: [2, 4, 10], codes: ['01'], src: ['apb_sop', 'uidai_faq', 'pib_2152566', 'ippb'], fix: ['bank_branch', 'ippb'], carry: ['passbook', 'aadhaar_card'], letter: 'seed', points: ['ippb_open'] },
  inoperative: { items: [2, 5], codes: ['53', '54'], src: ['apb_sop', 'rbi_2024'], fix: ['bank_branch'], carry: ['passbook', 'aadhaar_card'], letter: 'reactivate', points: ['dbt_counts', 'dbt_accounts_exempt', 'any_branch', 'no_charge', 'three_days'] },
  kyc_frozen: { items: [2], codes: ['51', '68'], src: ['apb_sop'], fix: ['bank_branch'], carry: ['passbook', 'aadhaar_card'], letter: 'reactivate', points: [] },
  pmkisan_ekyc: { items: [6], codes: [], src: ['pib_2112399', 'pib_2330414'], fix: ['csc'], carry: ['aadhaar_card'], letter: 'ekyc', points: ['ekyc_ways'] },
  pmkisan_land: { items: [6], codes: [], src: ['pib_2112399'], fix: ['scheme_office'], carry: [], letter: 'land', points: [] },
  mgnrega_abps: { items: [8, 4], codes: [], src: ['pib_2112199', 'vbgramg_faq', 'uidai_faq'], fix: ['bank_branch', 'scheme_office'], carry: ['passbook', 'aadhaar_card'], letter: 'seed', points: ['nach', 'job_card', 'delay_comp'] },
  credited_elsewhere: { items: [6, 9], codes: [], src: ['pmkisan', 'pfms'], fix: ['bank_branch'], carry: ['passbook', 'utr'], letter: 'utr', points: [] },
  record_aadhaar: { items: [13], codes: [], src: ['pib_2152566', 'pib_1739603'], fix: ['scheme_office'], carry: ['aadhaar_card'], letter: 'record', points: ['record_state'] },
  name_mismatch: { items: [13, 14], codes: [], src: ['uidai_faq', 'pib_2152566'], fix: ['scheme_office', 'aadhaar_centre'], carry: ['passbook', 'aadhaar_card'], letter: 'name', points: ['record_state'] },
  bank_limit: { items: [15], codes: ['57', '58'], src: ['apb_sop'], fix: ['bank_branch'], carry: ['passbook', 'aadhaar_card'], letter: 'limit', points: ['limit_not_for_dbt', 'jandhan_bsbd'] },
  office_stop: { items: [17], codes: [], src: ['rti_online', 'cpgrams'], fix: ['scheme_office'], carry: ['passbook', 'aadhaar_card'], letter: 'reason', points: ['written_reason', 'rti_route', 'cpgrams_route'] },
};

// Shown on every result: two published decisions where arrears were cut after a failed payment (item 16).
const IK = (doc) => `https://indiankanoon.org/doc/${doc}/`;
export const ARREARS = {
  note: 'arrears_note',
  source: [
    { name: 'CIC, 3 Oct 2019: widow pension, Delhi (6 months)', url: IK(55862438) },
    { name: 'CIC, 16 Jan 2025: disability pension, Delhi (1 year)', url: IK(26867350) },
  ],
};

const SCHEME_CHECK = { pmkisan: 'pmkisan_status', pension: 'nsap', mgnrega: 'nrega', scholarship: 'pfms', other: 'pfms' };
export const CHECKS = {
  myaadhaar: { name: 'myAadhaar: Bank seeding status', url: 'https://myaadhaar.uidai.gov.in/' },
  npci_base: { name: 'NPCI BASE: Get Aadhaar Mapped Status', url: 'https://base.npci.org.in/catalog/seedingRequestDetails' },
  pmkisan_status: { name: 'PM-KISAN: Know Your Status', url: 'https://pmkisan.gov.in/BeneficiaryStatus_New.aspx' },
  pmkisan_ekyc: { name: 'PM-KISAN: e-KYC', url: 'https://pmkisan.gov.in/' },
  nsap: { name: 'NSAP: Track Pension Payment', url: 'https://nsap.nic.in/ledgerHistroy.do?method=intialize' },
  nrega: { name: 'NREGA: Search Job Card / Wagelist / FTO', url: 'https://mnregaweb4.dord.gov.in/netnrega/homesearch.htm' },
  pfms: { name: 'PFMS: Know Your Payments', url: 'https://pfms.nic.in/static/KnowYourPayment_new.aspx' },
};
const SEEDING = ['myaadhaar', 'npci_base'];
const CAUSE_CHECKS = {
  mapper_other_bank: (s) => [...SEEDING, s],
  not_mapped: () => SEEDING,
  deseeded: () => SEEDING,
  account_closed: () => SEEDING,
  inoperative: (s) => [s, 'pfms'],
  kyc_frozen: (s) => [s, 'pfms'],
  pmkisan_ekyc: () => ['pmkisan_ekyc', 'pmkisan_status'],
  pmkisan_land: () => ['pmkisan_status'],
  mgnrega_abps: () => ['nrega', ...SEEDING],
  credited_elsewhere: (s) => [s, 'pfms'],
  record_aadhaar: (s) => [s],
  name_mismatch: (s) => [s, 'pfms'],
  bank_limit: (s) => [s, 'pfms'],
  office_stop: (s) => [s, 'pfms'],
};

const has = (arr, x) => Array.isArray(arr) && arr.includes(x);

export function likelyCauses({ scheme, symptom, lastReceived, changes = [], ekyc, land } = {}) {
  const pm = scheme === 'pmkisan';
  const old = lastReceived === 'over2y' || (lastReceived === '1to2y' && symptom === 'stopped');
  const out = [];
  const push = (...ids) => { for (const id of ids) if (!out.includes(id)) out.push(id); };
  // Strongest signal first. Order of precedence when two rules both want the top (README, "Order of reasons").
  if (symptom === 'paid_not_received') push('credited_elsewhere');
  if (symptom === 'other_account') push('mapper_other_bank');
  if (pm && ekyc !== 'yes') push('pmkisan_ekyc');
  if (has(changes, 'new_account')) push('mapper_other_bank');
  if (has(changes, 'kyc_pending')) push('kyc_frozen');
  if (has(changes, 'closed_account')) push('account_closed', 'deseeded');
  if (has(changes, 'aadhaar_wrong')) push('record_aadhaar');
  if (has(changes, 'name_differs')) push('name_mismatch');
  if (old) push('inoperative');
  // Base lead per symptom, then the scheme blocks, then the rest of the usual reasons (PIB 2152566 order).
  const BASE = {
    never_came: ['not_mapped', 'mapper_other_bank', 'name_mismatch'],
    stopped: ['deseeded', 'not_mapped', 'mapper_other_bank', 'account_closed', 'office_stop'],
    other_account: ['mapper_other_bank', 'credited_elsewhere', 'office_stop'],
    paid_not_received: ['credited_elsewhere', 'mapper_other_bank', 'account_closed'],
    rejected: ['not_mapped', 'deseeded', 'account_closed', 'kyc_frozen', 'inoperative', 'bank_limit'],
  }[symptom] || ['not_mapped'];
  push(BASE[0]);
  if (scheme === 'mgnrega') push('mgnrega_abps');
  if (pm && land !== 'yes') push('pmkisan_land');
  // Scholarship accounts are to be free of a total credit limit (APB SOP), so a bounced scholarship checks it early.
  if (scheme === 'scholarship' && symptom === 'rejected') push('bank_limit');
  push(...BASE.slice(1));
  // At most 6 (the official PM-KISAN failure list a farmer can fix has 6); trim from the end but never drop a
  // cause the answers make certain to list.
  // Stopped with nothing changed at the bank: the stop may be the office's (Dharam Lal Patel, Chhattisgarh HC 2024), so keep that step.
  const must = new Set([old && 'inoperative', scheme === 'mgnrega' && 'mgnrega_abps', pm && land !== 'yes' && 'pmkisan_land', symptom === 'stopped' && !changes.length && 'office_stop'].filter(Boolean));
  while (out.length > 6) {
    const i = out.findLastIndex((id) => !must.has(id));
    out.splice(i, 1);
  }
  return out;
}

export function checksFor(cause, scheme) {
  const ids = [...new Set(CAUSE_CHECKS[cause](SCHEME_CHECK[scheme] || 'pfms'))];
  return ids.map((id) => ({ id, ...CHECKS[id], path: `path_${id}`, needs: `needs_${id}` }));
}

export function fixFor(cause) {
  const c = CAUSES[cause];
  return { fix: `fix_${cause}`, where: c.fix, carry: c.carry, points: c.points, codes: c.codes, source: c.src.map((s) => SOURCES[s]) };
}

// Letter to show at the counter. Name, account and Aadhaar stay as blanks filled by hand, never by us.
export function requestText(cause, lang) {
  const t = STRINGS[lang] || STRINGS.en;
  const k = CAUSES[cause].letter;
  return [t[`l_to_${k}`], '', t[`l_subject_${k}`], '', t.l_greet, t[`l_body_${k}`], '', t.l_fields, '', t.l_close].join('\n');
}

// Link that opens straight on the same result for whoever receives it. Only the language and the
// answers travel (e-KYC and land only for PM-KISAN): nothing typed, no name, account or Aadhaar.
export function shareUrl(origin, a, lang) {
  const p = new URLSearchParams({ lang, scheme: a.scheme, symptom: a.symptom, last: a.last, changes: (a.changes || []).join(',') });
  if (a.scheme === 'pmkisan') { p.set('ekyc', a.ekyc); p.set('land', a.land); }
  return `${origin}/?${p}`;
}

// Answers from a shared link, or null unless every question asked for that scheme has one of its own options.
export function answersFrom(search) {
  const p = new URLSearchParams(search);
  const ynu = (k) => ['yes', 'no', 'unsure'].includes(p.get(k));
  const changes = (p.get('changes') || '').split(',').filter(Boolean);
  const ok = SCHEMES.includes(p.get('scheme')) && SYMPTOMS.includes(p.get('symptom')) && LAST.includes(p.get('last'))
    && p.has('changes') && changes.every((c) => CHANGES.includes(c));
  if (!ok) return null;
  const a = { scheme: p.get('scheme'), symptom: p.get('symptom'), last: p.get('last'), changes: [...new Set(changes)] };
  if (a.scheme !== 'pmkisan') return a;
  return ynu('ekyc') && ynu('land') ? { ...a, ekyc: p.get('ekyc'), land: p.get('land') } : null;
}
