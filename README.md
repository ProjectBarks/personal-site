# brandonbarker.me

Source of [brandonbarker.me](https://brandonbarker.me), a terminal-aesthetic
personal site and blog, built with Astro and MDX.

```text
src/data/resume.json  →  content (work, projects, awards, articles, contact)
src/content/posts/    →  blog posts, one .mdx file each
src/styles/global.css →  one stylesheet
public/               →  static (CNAME, favicons, resume PDFs, papers)
build/                →  generated output, deployed to GitHub Pages
```

## edit content

Almost everything you'd want to change lives in **`src/data/resume.json`**,
add a project, swap a link, fix a year, update the now-line.

```bash
npm install            # one-time
npm run dev            # build + open http://localhost:4747/
```

## deploy

```bash
npm run release        # builds, pushes ./build to ProjectBarks/projectbarks.github.io master
```

`release` runs `gh-pages` against
[ProjectBarks/projectbarks.github.io](https://github.com/ProjectBarks/projectbarks.github.io),
which serves at `https://projectbarks.github.io/` and redirects to
[brandonbarker.me](https://brandonbarker.me) via the `CNAME` file.

## scripts

| | |
|---|---|
| `npm run build`   | build `src/pages` + `src/content/posts` → `./build/` |
| `npm run dev`     | dev server with hot reload on `:4747` |
| `npm run preview` | serve the existing `./build/` (no rebuild) |
| `npm run release` | build + `gh-pages` push to the deploy repo |
| `npm test`        | run `src/lib` unit tests |

## write a post

Add a file to `src/content/posts/your-slug.mdx`:

```mdx
---
title: your post title
date: 2026-08-01
description: one sentence, shown in the writing list.
---

your post body, in markdown, with JSX available if you need it.
```

It appears at `/writing/your-slug.html`, merged into the writing list on both
`/` and `/cv.html`, sorted by date alongside the outbound article links in
`src/data/resume.json`.

## the design

- Background: warm-black `#0a0b0d`, with a soft cobalt aurora bleed in the corner.
- Type: **JetBrains Mono** throughout.
- Accent: a single cobalt `#2e5bff` — used on the prompt, the ASCII banner,
  links, the live "now" pulse, and the blinking cursor. Nothing else.
- Sections rendered as `## work`, `## projects`, `## awards`, etc.
- A tiny dotted-line list per section, year tabular-aligned on the left.
- Live status pill at the top with a pulsing cobalt dot.
- Mobile-responsive at 375px.

## file map

```text
.
├── src/
│   ├── data/resume.json     ← edit this (work, projects, awards, contact)
│   ├── content/posts/*.mdx  ← write a post: add a file here
│   ├── content.config.ts
│   ├── layouts/Base.astro
│   ├── components/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── cv.astro
│   │   ├── 404.astro
│   │   └── writing/[...slug].astro
│   ├── styles/global.css
│   └── lib/text.js
├── public/
│   ├── CNAME
│   ├── images/favicons/
│   └── downloads/
│       ├── brandon_barker_resume_2020.pdf
│       └── quadtree_spatialhash.pdf
├── pdf-resume/              ← .docx + PDF source for the resume PDF
├── astro.config.mjs
├── package.json
└── README.md
```

## history

- **v.2.0** — terminal-blue redesign, dropped webpack, JSON → Pug → static.
- **v.1.7** — last Materialize / Pug / webpack release. Source preserved in
  the git history (commit `943df4e` and earlier).

## DNS note

`brandonbarker.me` is on Cloudflare. For GitHub Pages to serve it, the apex
`A` records must point at GitHub Pages — either:

```
A  @  185.199.108.153
A  @  185.199.109.153
A  @  185.199.110.153
A  @  185.199.111.153
```

…**or** keep your existing records and flip the orange cloud to a **gray
cloud** (DNS-only) in the Cloudflare dashboard. Otherwise Cloudflare can return
error 1000 (`DNS points to prohibited IP`) when the records resolve to
Cloudflare's own anycast IPs.

After DNS is healthy, enable enforced HTTPS:

```bash
gh api -X PUT repos/ProjectBarks/projectbarks.github.io/pages \
  -f https_enforced=true
```

## license

MIT.
