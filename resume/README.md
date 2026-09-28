# Resume generator

Builds a Word + PDF resume in the style of the 2020 resume (`pdf-resume/brandon_barker_resume_2020.docx`) from `resume.json`.

```sh
cd resume && npm install                      # once
./setup-fonts.sh                              # once: fetch, de-ligature, install fonts
npm run build -- --pdf                        # builds the full resume
```

Output lands in `resume/out/` (gitignored): `.docx`, `.pdf`, and a `.png` preview per page.

## Editing content

Everything lives in `resume.json`.

- `priority` on entries and bullets: 1 or 2 = on the resume, 3 = kept in the data as a reserve but not printed. Set a bullet to 2 to swap it in.
- `tags` let a build drop items, e.g. `"tags": ["sensitive"]` with `--exclude sensitive`.
- `source` records where a claim came from (IR23 / PERF24 / IR25 impact resumes, CV20 = 2020 resume).
- `layout: "line"` renders an entry as one line: title, description, right-aligned date (internships, education, honors).
- `links: [{ "text": "phrase", "href": "url" }]` on a bullet or row turns each phrase in its text into a hyperlink.
- `summary` is the two-line intro under the name. `skills` are labelled rows, not rating dots, so ATS parsers read them.
- `variants` sets each variant's `maxPriority` and `maxPages`. The build fails if the PDF runs over.

To make a tailored copy, duplicate `resume.json` and pass `--data my-copy.json`.

## Notes

- PDF export drives Apple Pages over AppleScript (`render-pdf.sh`). Pages needs the fonts installed.
- The contact column is a floating text box, because Pages ignores table-cell insets, floating tables, and Word frames.
- The bundled fonts have ligature features stripped (`strip-ligatures.py`), because Pages writes ff/ft ligatures with no text mapping and "software" would extract as "so ware". `setup-fonts.sh` does this; don't use stock copies.
- An entry can have `roles` (sub-roles with their own title, dates, and bullets) and a `tagline` shown beside the company name.

## Codex rewrite pass (`codex/`)

Optional pass that has Codex rewrite every printed line, one isolated call per line, and merges the results verbatim.

```sh
python3 codex/extract.py                    # list printed lines + length budgets -> codex/items.json
python3 codex/rewrite.py -j 6               # gpt-6-astra @ max, outputs in codex/out/<id>.txt
python3 codex/rewrite.py --only ID --feedback "ID=what to fix"   # targeted redo
python3 codex/merge.py                      # verbatim merge, rebuild, report wrapped lines
```

`merge.py` backs up the data to `codex/resume.before-codex.json` first. Run outputs and logs are gitignored.
