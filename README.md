# brandonbarker.me

Single-page terminal-aesthetic personal site. JSON-driven, zero webpack.

```
data/resume.json    →   content (work, projects, awards, articles, education, stack, contact)
src/index.pug       →   single Pug template
src/style.css       →   single stylesheet
src/assets/         →   static (CNAME, favicons, resume PDF, papers)
build.js            →   tiny Node build (~30 lines)
```

## edit content

Everything you'd want to update is in `data/resume.json` — add a project, change a
role, swap a link. Run `npm run dev` to preview.

## scripts

```bash
npm install        # one-time
npm run build      # → ./build/
npm run dev        # build + open http://localhost:4747/
npm run release    # build + push ./build/ to ProjectBarks/projectbarks.github.io master
```

`release` deploys to GitHub Pages. The site serves from
`https://projectbarks.github.io/`, redirects to `https://brandonbarker.me/` via
the `CNAME` file in `src/assets/`.

## the design

Dark warm-black `#0a0b0d`, JetBrains Mono everywhere, single cobalt accent
`#2e5bff`. ASCII banner up top, `## section` headers, dotted dividers, blinking
cursor. Inspired by an SSH session prompt — terminal soul, no retro tropes.

## DNS note

`brandonbarker.me` is on Cloudflare. For GitHub Pages to serve it, the apex `A`
records should point at GitHub Pages (`185.199.108-111.153`) — or, if you keep
Cloudflare proxy on, make sure the records are configured for the
GitHub Pages origin and the domain isn't pointing at Cloudflare itself.
