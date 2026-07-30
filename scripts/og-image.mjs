// Renders a 1200x630 open-graph card for a post in the site's terminal style
// and writes it to public/images/og/<slug>.png. Run once per post:
//   node scripts/og-image.mjs <slug> "<title line 1>" "<line 2>" ["<line 3>"]
// The title is passed pre-wrapped because a monospace face makes line width a
// character count, and choosing the break points by hand reads better than any
// greedy wrapper.
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const [slug, ...lines] = process.argv.slice(2);
if (!slug || lines.length === 0) {
  console.error('usage: node scripts/og-image.mjs <slug> <title line>...');
  process.exit(1);
}

const BG = '#0a0b0d';
const INK = '#e8e9ed';
const MUTED = '#a4a6b0';
const ACCENT = '#5f82ff';
const MONO = 'Menlo, Monaco, monospace'; // build-machine face; close enough to JetBrains Mono

const SIZE = 58;
const LINE = SIZE * 1.45;
const top = 315 - ((lines.length - 1) * LINE) / 2;

const title = lines
  .map(
    (l, i) =>
      `<text x="84" y="${top + i * LINE}" font-family="${MONO}" font-size="${SIZE}" font-weight="bold" fill="${INK}">${l
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</text>`
  )
  .join('\n');

// cobalt block cursor after the last line
const last = lines[lines.length - 1];
const cursorX = 84 + last.length * SIZE * 0.602 + SIZE * 0.25;
const cursorY = top + (lines.length - 1) * LINE;

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>
  <radialGradient id="aurora" cx="1" cy="0" r="1.1">
    <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.22"/>
    <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="630" fill="url(#aurora)"/>
  <text x="84" y="120" font-family="${MONO}" font-size="26">
    <tspan fill="${ACCENT}" font-weight="bold">brandon@nyc</tspan><tspan fill="${MUTED}"> :~$ cat ${slug}.mdx</tspan>
  </text>
  ${title}
  <rect x="${cursorX}" y="${cursorY - SIZE * 0.78}" width="${SIZE * 0.55}" height="${SIZE * 0.95}" fill="${ACCENT}"/>
  <text x="84" y="562" font-family="${MONO}" font-size="24" fill="${MUTED}">brandonbarker.me/writing</text>
</svg>`;

mkdirSync('public/images/og', { recursive: true });
const out = `public/images/og/${slug}.png`;
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('wrote', out);
