// Tiny zero-config build for brandonbarker.me.
//   node build.js  →  ./build/   (deployable static site)
//
// Reads:
//   data/resume.json    — content
//   src/index.pug       — single template
//   src/style.css       — single stylesheet
//   src/assets/**       — static (CNAME, favicons, downloads)
//
// Writes:
//   build/index.html
//   build/style.css
//   build/CNAME
//   build/images/favicons/...
//   build/downloads/...

const fs = require('fs');
const path = require('path');
const pug = require('pug');

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

// 1. Wipe build dir
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 2. Render index.pug with data
const data = JSON.parse(fs.readFileSync(path.join(DATA, 'resume.json'), 'utf8'));
const html = pug.renderFile(path.join(SRC, 'index.pug'), { ...data, pretty: false });
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// 3. Stylesheet
fs.copyFileSync(path.join(SRC, 'style.css'), path.join(OUT, 'style.css'));

// 4. Static assets (CNAME, favicons, downloads, etc.)
copyDir(path.join(SRC, 'assets'), OUT);

// 5. Done
const stat = fs.statSync(path.join(OUT, 'index.html'));
console.log(`built → ${path.relative(ROOT, OUT)}/index.html (${stat.size.toLocaleString()} bytes)`);
