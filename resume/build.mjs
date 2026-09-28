// Generates a .docx (and optionally .pdf) resume in the style of the 2020
// Word resume, from resume.json.
//
//   node build.mjs                      # full variant, docx only
//   node build.mjs --variant compact    # compact | full | extended
//   node build.mjs --pdf                # also export PDF via Pages + page check
//   node build.mjs --exclude sensitive  # drop items tagged "sensitive"
//   node build.mjs --data other.json    # alternate data file
//
// Output: out/brandon_barker_resume_<variant>.docx (+ .pdf, + .png preview)

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  Document, Packer, Paragraph, TextRun, ImageRun, ExternalHyperlink,
  TabStopType, LevelFormat, AlignmentType, TextWrappingType,
  HorizontalPositionRelativeFrom, HorizontalPositionAlign, VerticalPositionRelativeFrom,
} from 'docx';
import { ShapeRun } from 'docx/shapes';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- args ----------
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const variantName = opt('variant', 'full');
const dataPath = path.resolve(HERE, opt('data', 'resume.json'));
const exclude = new Set((opt('exclude', '') || '').split(',').filter(Boolean));
const wantPdf = args.includes('--pdf');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const variant = data.variants?.[variantName];
if (!variant) throw new Error(`Unknown variant "${variantName}". Known: ${Object.keys(data.variants).join(', ')}`);

const keep = (item) =>
  (item.priority ?? 1) <= variant.maxPriority &&
  !(item.tags || []).some((t) => exclude.has(t));

// ---------- style tokens (measured from the 2020 docx) ----------
const C = { text: '333333', accent: '0E47A1', muted: '5D5D5D' };
const F = {
  thin: 'Roboto Thin', light: 'Roboto Light', medium: 'Roboto Medium',
  roboto: 'Roboto', body: 'Source Sans Pro',
};
const PAGE_W = 12240, MARGIN_X = 720, MARGIN_Y = 360;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 10800 twips, same as the 2020 tab stops
const pt = (n) => n * 2; // docx sizes are half-points

const run = (text, o = {}) => new TextRun({ text, font: o.font ?? F.body, size: pt(o.size ?? 10), color: o.color ?? C.text, ...o.extra });

// Wrap runs in a hyperlink when a link is given.
const maybeLink = (href, children) => (href ? [new ExternalHyperlink({ link: href, children })] : children);

// ---------- building blocks ----------
function spacer(sizePt = 5) {
  return new Paragraph({ children: [run('', { size: sizePt })] });
}

// "Work Experience ______________________"
function sectionHeading(title) {
  return new Paragraph({
    spacing: { before: 80 },
    keepNext: true,
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W, leader: 'underscore' }],
    children: [
      run(`${title} `, { font: F.roboto, size: 12, extra: { bold: true } }),
      run('\t', { font: F.light, size: 12 }),
    ],
  });
}

// Blue small-caps title .......... right-aligned date
function entryTitle(entry) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    keepNext: true,
    children: [
      ...maybeLink(entry.link, [run(entry.title, { font: F.roboto, size: 11, color: C.accent, extra: { bold: true, smallCaps: true } })]),
      ...(entry.tagline ? [run(`   ${entry.tagline}`, { size: 9, color: C.muted, extra: { italics: true } })] : []),
      run('\t', { font: F.roboto, size: 11 }),
      run(entry.date ?? '', { font: F.light, size: 11 }),
    ],
  });
}

// SMALL-CAPS ROLE .......... italic location
function entrySubtitle(entry) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    keepNext: true,
    children: [
      run(entry.subtitle ?? '', { size: 8, color: C.muted, extra: { allCaps: true } }),
      run('\t', { size: 8, color: C.muted }),
      run(entry.location ?? '', { size: 8, color: C.muted, extra: { italics: true } }),
    ],
  });
}

// Sub-role under one company: "Role title ........ dates".
function roleHeading(r) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    spacing: { before: 60, after: 10 },
    keepNext: true,
    children: [
      run(r.title, { font: F.medium, size: 10.5 }),
      run('\t', { font: F.light, size: 10.5 }),
      run(r.date ?? '', { font: F.light, size: 10.5, color: C.muted }),
    ],
  });
}

// A bullet can link one phrase: { text, link, linkText } renders linkText in
// the accent colour as a hyperlink.
function bullet(b) {
  const { text, link, linkText } = typeof b === 'string' ? { text: b } : b;
  const at = link && linkText ? text.indexOf(linkText) : -1;
  const children = at === -1 ? [run(text)] : [
    run(text.slice(0, at)),
    new ExternalHyperlink({ link, children: [run(linkText, { color: C.accent })] }),
    run(text.slice(at + linkText.length)),
  ];
  return new Paragraph({ numbering: { reference: 'dot', level: 0 }, children });
}

// Inline layout: "COMPANY · Role, Location ........ date" then one plain line.
function inlineEntry(e) {
  return [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      keepNext: true,
      children: [
        ...maybeLink(e.link, [run(e.title, { font: F.roboto, size: 11, color: C.accent, extra: { bold: true, smallCaps: true } })]),
        run(`  ·  ${[e.subtitle, e.location].filter(Boolean).join(', ')}`, { size: 9, color: C.muted, extra: { italics: true } }),
        run('\t', { font: F.roboto, size: 11 }),
        run(e.date ?? '', { font: F.light, size: 11 }),
      ],
    }),
    ...(e.description ? [new Paragraph({ children: [run(e.description)] })] : []),
  ];
}

function entry(e) {
  if (e.layout === 'inline') return inlineEntry(e);
  if (e.layout === 'line') return lineEntry(e);
  const out = [entryTitle(e)];
  if (e.subtitle || e.location) out.push(entrySubtitle(e));
  if (e.description) out.push(new Paragraph({ children: [run(e.description)] }));
  for (const b of (e.bullets || []).filter(keep)) out.push(bullet(b));
  for (const r of e.roles || []) {
    const bs = (r.bullets || []).filter(keep);
    if (!bs.length) continue;
    out.push(roleHeading(r), ...bs.map((b) => bullet(b)));
  }
  return out;
}

// Header: name + titles flow at the left margin; the contact column is a
// floating, borderless text box pinned to the right margin. Same construct as
// the 2020 Word file, and it renders the same in Word and Pages.
function header(h) {
  const titleRuns = [];
  h.titles.forEach((t, i) => {
    if (i) titleRuns.push(run(' // ', { font: F.medium, size: 12 }));
    titleRuns.push(run(t, { font: F.medium, size: 12, color: C.accent }));
  });
  const contactLines = h.contact.map((c) => new Paragraph({
    spacing: { after: 10 },
    children: maybeLink(c.href, [
      new ImageRun({
        type: 'png',
        data: fs.readFileSync(path.join(HERE, 'assets/icons', `${c.icon}.png`)),
        transformation: { width: 13, height: 13 },
      }),
      run(` ${c.text}`, { font: F.medium, size: 10.5 }),
    ]),
  }));
  const contactBox = new ShapeRun({
    type: 'rectangle',
    transformation: { width: 210, height: 102 },
    line: { transparency: 100, width: 0 },
    textOptions: { verticalAlignment: 'top', margins: { top: 0, bottom: 0, left: 0, right: 0 } },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.RIGHT },
      verticalPosition: { relative: VerticalPositionRelativeFrom.MARGIN, offset: 38100 },
      wrap: { type: TextWrappingType.NONE },
      allowOverlap: true,
    },
    children: contactLines,
  });
  return [
    new Paragraph({ children: [
      contactBox,
      run(`${h.first} `, { font: F.thin, size: 36 }),
      run(h.last, { font: F.medium, size: 36 }),
    ] }),
    new Paragraph({ spacing: { after: 300 }, children: titleRuns }),
  ];
}

// Skills as labelled rows ("Languages // ..."): plain text parses cleanly in
// ATS, unlike rating dots.
function skills(rows) {
  return [
    sectionHeading('Skills'),
    ...rows.map((r) => new Paragraph({
      spacing: { after: 20 },
      children: [run(`${r.label} // `, { extra: { bold: true } }), run(r.items)],
    })),
  ];
}

// One-line entry: "TITLE  description ........ date".
function lineEntry(e) {
  return [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    spacing: { after: 30 },
    children: [
      ...maybeLink(e.link, [run(e.title, { font: F.roboto, size: 10.5, color: C.accent, extra: { bold: true, smallCaps: true } })]),
      run(`   ${e.description ?? ''}`),
      run('\t', { font: F.light, size: 10.5 }),
      run(e.date ?? '', { font: F.light, size: 10.5 }),
    ],
  })];
}

function summary(sm) {
  if (!sm || !keep(sm)) return [];
  return [new Paragraph({ spacing: { after: 40 }, alignment: AlignmentType.BOTH, children: [run(sm.text, { size: 10.5 })] })];
}

// ---------- assemble ----------
function makeDoc() {
const children = [...header(data.header), ...summary(data.summary), spacer(2), ...skills(data.skills)];
for (const section of data.sections) {
  const entries = section.entries.filter(keep);
  if (!entries.length) continue;
  children.push(spacer(2), sectionHeading(section.title));
  entries.forEach((e, i) => {
    if (i && e.layout !== 'line') children.push(spacer(e.layout === 'inline' ? 3 : 5));
    children.push(...entry(e));
  });
}

return new Document({
  creator: `${data.header.first} ${data.header.last}`,
  title: `${data.header.first} ${data.header.last} — Resume`,
  styles: { default: { document: { run: { font: F.body, size: pt(10), color: C.text } } } },
  numbering: {
    config: [{
      reference: 'dot',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: {
          paragraph: { indent: { left: 540, hanging: 270 } },
          run: { font: F.body, size: pt(10), color: C.text },
        },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: 15840 },
        margin: { top: MARGIN_Y, bottom: MARGIN_Y, left: MARGIN_X, right: MARGIN_X, header: 720, footer: 720 },
      },
    },
    children,
  }],
});
}

const outDir = path.join(HERE, 'out');
fs.mkdirSync(outDir, { recursive: true });
const suffix = exclude.size ? `-no-${[...exclude].join('-')}` : '';
const base = path.join(outDir, `brandon_barker_resume_${variantName}${suffix}`);
fs.writeFileSync(`${base}.docx`, await Packer.toBuffer(makeDoc()));
console.log(`wrote ${path.relative(process.cwd(), base)}.docx`);

// ---------- PDF export via Pages (macOS) + page-count guard ----------
if (wantPdf) {
  execFileSync(path.join(HERE, 'render-pdf.sh'), [`${base}.docx`, `${base}.pdf`], { stdio: 'inherit' });
  const info = execFileSync('pdfinfo', [`${base}.pdf`]).toString();
  const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1]);
  for (const f of fs.readdirSync(outDir)) if (f.startsWith(path.basename(base) + '-') && f.endsWith('.png')) fs.unlinkSync(path.join(outDir, f));
  execFileSync('pdftoppm', ['-png', '-r', '110', `${base}.pdf`, base]);
  console.log(`wrote ${path.relative(process.cwd(), base)}.pdf (${pages} page${pages === 1 ? '' : 's'})`);
  if (pages > variant.maxPages) {
    console.error(`ERROR: ${variantName} is ${pages} pages; limit is ${variant.maxPages}. Trim content or raise the limit.`);
    process.exit(1);
  }
}
