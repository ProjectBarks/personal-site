// Zero-config build for brandonbarker.me.
//   node build.js  →  ./build/   (deployable static site)
//
// Multi-page terminal site: index (~/root: whoami + banner + about + writing)
// and cv (~/cv: everything). Resume PDF + instagram + birth-year chip are hidden;
// the corny lede sentence is cut; em dashes are removed from copy; stack data
// stays in resume.json but is never rendered. Original style.css is used verbatim.
//
// Reads:  data/resume.json · src/style.css · src/assets/**
// Writes: build/index.html · build/cv.html · build/CNAME · build/images/** · build/downloads/**

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'build');

function copyDir(src, dest){
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })){
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const data = JSON.parse(fs.readFileSync(path.join(DATA, 'resume.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
const m = data.meta;

/* ---- shared transforms ------------------------------------------------ */
// em dashes are banned in copy: year ranges -> hyphen, separators -> comma.
const deEm = s => typeof s === 'string'
  ? s.replace(/(\d{4})\s*—\s*(\d{2,4})/g, '$1-$2').replace(/\s*—\s*/g, ', ')
  : s;
const link = (href, label) => href
  ? `<a href="${href}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
  : label;
// The lede arrives as raw HTML from resume.json, so its outbound links bypass
// link() and would open in-tab while the identical URL in the posts list opens
// a new tab. Same destination, same page, two behaviours.
const hardenLinks = html => html.replace(
  /<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
// Projects the home page lede deep-links to. Nothing is collapsed on the cv any
// more, so these resolve on arrival without special handling.
const ledeIds = new Set([...data.lede_html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]));
const lede = hardenLinks(deEm(data.lede_html.replace(/\s*innovating for the future[^.]*\.\s*$/i, '').trim())
  .replace(/href="#/g, 'href="cv.html#'));
const chips = data.meta_chips.filter(c => !/est\.\s*2001/i.test(c));
const contact = data.contact.filter(c => !/resume|instagram/i.test(c.label));

/* ---- extra CSS for the top bar (appended to the untouched original) --- */
const NAV_CSS = `
/* ---- one top bar: shell prompt on the left, page tabs on the right ---- */
.topbar{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;
  gap:6px 22px;margin:0 0 30px;padding-bottom:14px;border-bottom:1px dashed var(--rule)}
.tabs{display:flex;gap:22px;font-size:14px}
.tabs a{color:var(--muted);border-bottom:none;position:relative;padding:2px 0}
.tabs a:hover{color:var(--accent-text)}
.tabs a.active{color:var(--ink)}
.tabs a.active::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--accent)}
.topbar + .ascii{margin-top:6px}

/* ---- cv section index: the tall page needs a way in other than scrolling ---- */
.jump{display:flex;flex-wrap:wrap;gap:8px 20px;margin:0 0 8px;font-size:14px}
.jump a{color:var(--dim);border-bottom:1px dotted var(--rule)}
.jump a:hover{color:var(--accent-text);border-bottom-color:var(--accent-text)}
.block{scroll-margin-top:24px}
.totop a{color:var(--muted);border-bottom:none}
.totop a:hover{color:var(--accent-text)}
`;

/* ---- layout ----------------------------------------------------------- */
const FAVICONS = `
<link rel="icon" type="image/x-icon" href="./images/favicons/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="./images/favicons/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="./images/favicons/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="./images/favicons/apple-touch-icon-180x180.png">
<link rel="apple-touch-icon" sizes="152x152" href="./images/favicons/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="120x120" href="./images/favicons/apple-touch-icon-120x120.png">`;

// The page's own shell prompt and the page tabs share a single bar: the prompt
// is the command, the tabs are the paths. Never two stacked prompt lines.
function topbar(active, cmd){
  const items = [
    ['index.html', '~/root', 'home'],
    ['cv.html', '~/cv', 'cv'],
  ];
  const tabs = items.map(([href, label, key]) =>
    `<a href="${href}"${key === active ? ' class="active"' : ''}>${label}</a>`).join('');
  return `<div class="topbar" id="top">
  <span class="prompt"><b>${data.shell.prompt}</b> :~$ ${cmd}<span class="cursor"></span></span>
  <nav class="tabs">${tabs}</nav>
</div>`;
}

function page(active, title, ogUrl, cmd, bodyHtml, backToTop){
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${deEm(title)}</title>
<meta name="description" content="${deEm(m.description)}">
<meta name="theme-color" content="${m.theme_color}">
${FAVICONS}
<meta property="og:title" content="${deEm(m.title)}">
<meta property="og:description" content="${deEm(m.og_description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${ogUrl}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500&display=swap">
<style>${CSS}${NAV_CSS}</style>
</head><body><main class="wrap">
${topbar(active, cmd)}
${bodyHtml}
<hr>
<footer>
  <span class="prompt"><b>${data.shell.prompt}</b> :~$ contact</span>
  <span>${contact.map((c, i) => (i ? ' · ' : '') + link(c.href, c.label)).join('')}</span>
  ${backToTop ? '<span class="totop"><a href="#top">^ top</a></span>' : ''}
</footer>
</main></body></html>`;
}

/* ---- content renderers (original markup / classes) -------------------- */
const rowHtml = (yr, nameHtml, blurb, where, id) => `
  <div class="row"${id ? ` id="${id}"` : ''}><div class="yr">${deEm(yr)}</div>
    <div class="what"><b>${nameHtml}</b><span>${deEm(blurb)}</span></div>
    <div class="where">${deEm(where)}</div></div>`;

// The cv is the complete record, so nothing is folded away: a closed <details>
// is display:none, which hides its rows from find-in-page and makes any deep
// link into them unreachable. The section index carries navigation instead.
function block(label, rows){
  return `
<div class="block" id="${label.replace(/\s+/g, '-')}">
  <h2>${label}</h2>
  ${rows.join('')}
</div>`;
}

const byYearDesc = (a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
const projectsSorted = [...data.projects].sort(byYearDesc);

const projectsBlock = () => block('projects',
  projectsSorted.map(p => rowHtml(p.year, link(p.link, p.name), p.blurb_html, p.scope, p.id)));
const workBlock = () => block('work',
  data.work.map(w => rowHtml(w.year, link(w.link, w.name), w.role_html, w.location)));
const activitiesBlock = () => block('activities',
  data.activities.map(a => rowHtml(a.year, link(a.link, a.name), a.role_html, a.location)));
const awardsBlock = () => block('awards',
  data.awards.map(a => rowHtml(a.year, link(a.link, a.name), a.blurb_html, a.org)));
// writing/articles carry a full date. The month renders as a word: a purely
// numeric y-m-d is ambiguous between day-first and month-first conventions, and
// the machine-readable form stays in the <time> datetime attribute regardless.
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const humanDate = iso => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[1]} ${MONTHS[+m[2] - 1]} ${m[3]}` : iso;
};
const articleRows = () => data.articles.map(a => `
  <div class="row"><div class="yr"><time datetime="${a.date}">${humanDate(a.date)}</time></div>
    <div class="what"><b>${link(a.link, a.title)}</b><span>${deEm(a.blurb)}</span></div></div>`).join('');
const articlesBlock = () => `
<div class="block articles" id="writing">
  <h2>writing</h2>
  ${articleRows()}
</div>`;
// root: the posts on their own, no visible section heading. The aria-label gives
// screen readers a landmark name without putting a title on the page.
const postsBlock = () => `<section class="block articles posts" aria-label="writing">${articleRows()}</section>`;
const eduBlock = () => `
<div class="block" id="education"><h2>education</h2>
  <div class="edu"><div class="yr">${deEm(data.education.year)}</div>
    <div><b>${data.education.institution}</b><span>${deEm(data.education.majors)}</span></div></div>
</div>`;

/* ---- pages ------------------------------------------------------------ */
// home: the h1 is the real text name so the page has a heading in the a11y tree
// and copy/paste yields the name rather than ASCII garbage. The art is purely
// decorative. Below 500px the art renders at ~8px and stops being legible, so
// the CSS hides it there and shows the h1 instead.
const home = page('home', m.title, m.url, 'whoami', `
  <h1 class="name">${data.name.toLowerCase()}</h1>
  <pre class="ascii" aria-hidden="true">${data.ascii}</pre>
  <p class="lede">${lede}</p>
  <hr>
  ${postsBlock()}`);

// The cv is one long scroll. Its opening line is the section index rather than a
// sentence restating the headings: same words, but each one goes somewhere.
const jump = () => {
  const ids = ['projects', 'writing', 'work', 'activities', 'awards', 'education'];
  return `<nav class="jump" aria-label="sections">${ids.map(id =>
    `<a href="#${id}">${id}</a>`).join('')}</nav>`;
};

const cv = page('cv', `cv · ${data.name}`, m.url.replace(/\/?$/, '/') + 'cv.html', 'cat cv.txt',
  `<h1>${data.name.toLowerCase()}</h1>
  <p class="role">${data.title}</p>
  <div class="meta">${chips.map(c => `<span>${c}</span>`).join('')}</div>` +
  jump() + projectsBlock() + articlesBlock() + workBlock() + activitiesBlock() + awardsBlock() + eduBlock(),
  true);

// GitHub Pages serves this for any unmatched path; without it you get GitHub's
// own 404, which is the one place the shell metaphor would break.
const notFound = page('none', `404 · ${data.name}`, m.url, 'cd /nope', `
  <p class="lede">no such file or directory.</p>
  <p class="lede">the path you asked for is not on this machine. try
  <a href="index.html">~/root</a> or <a href="cv.html">~/cv</a>.</p>`);

/* ---- write ------------------------------------------------------------ */
// Empty the build dir but keep the directory itself. A long-running preview
// server (npm run preview) holds this directory open; deleting and recreating
// it leaves that server serving an unlinked, permanently stale copy.
fs.mkdirSync(OUT, { recursive: true });
for (const entry of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, entry), { recursive: true, force: true });
fs.writeFileSync(path.join(OUT, 'index.html'), home);
fs.writeFileSync(path.join(OUT, 'cv.html'), cv);
fs.writeFileSync(path.join(OUT, '404.html'), notFound);
copyDir(path.join(SRC, 'assets'), OUT);

for (const f of ['index.html', 'cv.html', '404.html']){
  const s = fs.statSync(path.join(OUT, f));
  console.log(`built → build/${f} (${s.size.toLocaleString()} bytes)`);
}
