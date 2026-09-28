"""Merge Codex's rewrites into resume.json verbatim, rebuild, and report wraps.

- Backs up resume.json to codex/resume.before-codex.json (first run only).
- Each out/<id>.txt is inserted exactly as written; only surrounding
  whitespace/newlines are trimmed.
- Rebuilds the PDF and lists any line that no longer fits on one line, so it
  can be sent back to Codex (rewrite.py --only ... --feedback id=...).
"""
import json, pathlib, shutil, subprocess

HERE = pathlib.Path(__file__).parent
RESUME = HERE.parent / 'resume.json'
BACKUP = HERE / 'resume.before-codex.json'
items = json.loads((HERE / 'items.json').read_text())

if not BACKUP.exists():
    shutil.copy(RESUME, BACKUP)
data = json.loads(RESUME.read_text())

def set_path(obj, path, value):
    si, ei, *rest = path
    node = data['sections'][si]['entries'][ei]
    for key in rest[:-1]:
        node = node[key]
    node[rest[-1]] = value

merged, missing = [], []
for it in items:
    f = HERE / 'out' / f"{it['id']}.txt"
    if not f.exists() or not f.read_text().strip():
        missing.append(it['id']); continue
    new = f.read_text().strip()
    set_path(data, it['path'], new)
    merged.append((it['id'], it['text'], new))

RESUME.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
for i, old, new in merged:
    print(f"{i}\n  before: {old}\n  after:  {new}")
print(f"\nmerged {len(merged)}, missing {missing or 'none'}")

res = subprocess.run(['node', 'build.mjs', '--pdf'], cwd=HERE.parent, capture_output=True, text=True)
print(res.stdout.strip().splitlines()[-1] if res.stdout.strip() else res.stderr)
pdf = HERE.parent / 'out' / 'brandon_barker_resume_full.pdf'
lines = subprocess.run(['pdftotext', str(pdf), '-'], capture_output=True, text=True).stdout.splitlines()
wrapped = [i for i, _, new in merged if not any(new in ln for ln in lines)]
print('wrapped (not on a single line):', wrapped or 'none')
