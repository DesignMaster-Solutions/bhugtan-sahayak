// Anonymous usage counter for the impact data. It stores only: event name, language, day (UTC) and,
// on "diagnose", the id of the top cause shown. Never scheme answers, names, numbers or IPs.
// One Durable Object holds the counts, so increments are atomic. GET /api/stats is public.
import { CAUSES } from './rules.js';

const EVENTS = new Set(['diagnose', 'copy', 'share', 'share_link', 'worked_yes', 'worked_no', 'worked_notyet']);
const LANGS = new Set(['en', 'hi']);

export class Counter {
  constructor(state) { this.storage = state.storage; }

  async fetch(req) {
    if (req.method === 'POST') {
      let body;
      try { body = JSON.parse(await req.text()); } catch { return new Response('bad json', { status: 400 }); }
      if (!EVENTS.has(body?.event) || !LANGS.has(body?.lang)) return new Response('bad event', { status: 400 });
      const diagnose = body.event === 'diagnose';
      if (diagnose ? !Object.hasOwn(CAUSES, body.cause) : 'cause' in body) return new Response('bad cause', { status: 400 });
      const day = new Date().toISOString().slice(0, 10);
      const keys = [`total:${body.event}`, `lang:${body.lang}:${body.event}`, `day:${day}:${body.event}`];
      if (diagnose) keys.push(`cause:${body.cause}`);
      for (const k of keys) await this.storage.put(k, ((await this.storage.get(k)) || 0) + 1);
      return new Response(null, { status: 204 });
    }
    const counts = Object.fromEntries(await this.storage.list());
    return Response.json({ since: '2026-11-05', counts }, { headers: { 'cache-control': 'no-store' } });
  }
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/event' || pathname === '/api/stats') {
      const wanted = pathname === '/api/event' ? 'POST' : 'GET';
      if (req.method !== wanted) return new Response(null, { status: 405 });
      return env.COUNTER.get(env.COUNTER.idFromName('global')).fetch(req);
    }
    if (pathname.startsWith('/api/')) return new Response(null, { status: 404 });
    return env.ASSETS.fetch(req);
  },
};
