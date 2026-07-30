/* PostHog web analytics for brandonbarker.me.
 *
 * The rest of this site ships no client JavaScript. This file is the one
 * exception, so it is written defensively: every entry point is wrapped, and a
 * failure anywhere inside must leave the page working exactly as it would with
 * analytics absent. Nothing here is allowed to throw into page scope.
 *
 * Events
 *   $pageview / $pageleave   impressions, from posthog's own defaults
 *   link_clicked             any anchor, tagged internal / outbound / anchor
 *   button_clicked           real buttons and role=button elements
 *   blog_read_started        a /writing/ page was opened
 *   blog_read_progress       first time past 25 / 50 / 75 / 100 percent
 *   blog_read_ended          engaged seconds, depth reached, and exit point
 *   page_exited              the same exit shape for non-blog pages
 */
import posthog from 'posthog-js';

const KEY = import.meta.env.PUBLIC_POSTHOG_KEY || 'phc_zUEL8ZYufd2os6ckVP5V5fGN8mrpvkyJMhAzkAzqz7wq';
const HOST = import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Stop counting engaged time after this long with no interaction, so a tab
// left open overnight does not report as an eight hour read.
const IDLE_MS = 60_000;
const MILESTONES = [25, 50, 75, 100];

/** Wrap a function so it can never throw into page scope. */
function safe(fn) {
  return function wrapped(...args) {
    try {
      return fn.apply(this, args);
    } catch {
      /* analytics must never break the page */
    }
  };
}

let ph = null;
const send = safe((event, props) => {
  if (ph) ph.capture(event, props);
});

/** Localhost stays out of the dataset unless explicitly forced with ?ph_debug=1. */
function shouldRun() {
  const host = location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
  const forced = new URLSearchParams(location.search).has('ph_debug');
  if (local && !forced) return false;
  // honour an explicit browser opt out rather than making people use a blocker
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return false;
  return true;
}

/** Percent of the scrollable height currently scrolled past, 0 to 100. */
function scrollPct() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  if (max <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100)));
}

/** The last section heading the reader scrolled past: where they got to. */
function currentSection() {
  const mid = window.scrollY + window.innerHeight / 2;
  let seen = null;
  for (const h of document.querySelectorAll('.prose h2, .post h1')) {
    if (h.getBoundingClientRect().top + window.scrollY <= mid) seen = h.textContent.trim();
    else break;
  }
  return seen;
}

function initClicks() {
  document.addEventListener(
    'click',
    safe((e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;

      const btn = el.closest('button, [role="button"], input[type="submit"], label[for]');
      if (btn) {
        send('button_clicked', {
          label: (btn.textContent || btn.getAttribute('aria-label') || '').trim().slice(0, 80),
          element: btn.tagName.toLowerCase(),
          path: location.pathname,
        });
        return;
      }

      const a = el.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const outbound = /^https?:/i.test(href) && !href.includes(location.host);
      send('link_clicked', {
        href,
        text: (a.textContent || '').trim().slice(0, 80),
        kind: href.startsWith('#') ? 'anchor' : outbound ? 'outbound' : 'internal',
        path: location.pathname,
      });
    }),
    true // capture phase, so it still fires if something calls stopPropagation
  );
}

function initEngagement() {
  const isBlog = location.pathname.startsWith('/writing/');
  const slug = isBlog ? location.pathname.replace(/^\/writing\//, '').replace(/\.html$/, '') : null;
  const base = isBlog ? { slug, title: document.title } : { path: location.pathname };

  let engagedMs = 0;
  let lastTick = Date.now();
  let lastActive = Date.now();
  let maxPct = scrollPct();
  const hit = new Set();
  let ended = false;

  if (isBlog) send('blog_read_started', base);

  const bump = safe(() => {
    lastActive = Date.now();
  });
  for (const ev of ['scroll', 'keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart']) {
    window.addEventListener(ev, bump, { passive: true });
  }

  const tick = setInterval(
    safe(() => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      const active = document.visibilityState === 'visible' && now - lastActive < IDLE_MS;
      if (active) engagedMs += delta;
    }),
    1000
  );

  window.addEventListener(
    'scroll',
    safe(() => {
      const pct = scrollPct();
      if (pct > maxPct) maxPct = pct;
      if (!isBlog) return;
      for (const m of MILESTONES) {
        if (maxPct >= m && !hit.has(m)) {
          hit.add(m);
          send('blog_read_progress', { ...base, percent: m });
        }
      }
    }),
    { passive: true }
  );

  // Fires once, on whichever teardown signal arrives first. pagehide and the
  // hidden visibility change are the two that survive a mobile tab switch or a
  // bfcache navigation; unload does not reliably fire on iOS Safari.
  const finish = safe(() => {
    if (ended) return;
    ended = true;
    clearInterval(tick);
    const payload = {
      ...base,
      engaged_seconds: Math.round(engagedMs / 1000),
      total_seconds: Math.round((Date.now() - START) / 1000),
      max_scroll_percent: maxPct,
      exit_scroll_percent: scrollPct(),
      exit_section: currentSection(),
      reached_end: maxPct >= 90,
    };
    send(isBlog ? 'blog_read_ended' : 'page_exited', payload);
  });

  window.addEventListener('pagehide', finish);
  document.addEventListener(
    'visibilitychange',
    safe(() => {
      if (document.visibilityState === 'hidden') finish();
    })
  );
}

const START = Date.now();

export const initAnalytics = safe(function initAnalytics() {
  if (typeof window === 'undefined' || !shouldRun()) return;

  posthog.init(KEY, {
    api_host: HOST,
    defaults: '2025-05-24', // enables $pageview and $pageleave capture
    persistence: 'localStorage+cookie',
    autocapture: false, // the handlers below are explicit and cheaper
    capture_exceptions: false,
    on_xhr_error: () => {}, // a failed analytics request is not a page error
  });
  ph = posthog;

  // Only reachable via ?ph_debug=1, which already gates sending at all. Gives
  // a handle for confirming events actually leave the browser.
  if (new URLSearchParams(location.search).has('ph_debug')) {
    window.__posthog = posthog;
  }

  initClicks();
  initEngagement();
});
