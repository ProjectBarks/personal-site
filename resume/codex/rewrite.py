"""Ask Codex (one isolated call per item) to rewrite each resume line.

Outputs land in out/<id>.txt exactly as Codex returned them. If a response
breaks the hard rules (one line, length budget, keeps required phrase), Codex
gets the feedback and rewrites it again; this script never edits the text.

Usage: python3 rewrite.py [--only id1,id2] [--feedback id=message ...] [-j 6]
"""
import json, pathlib, subprocess, sys, concurrent.futures as cf

HERE = pathlib.Path(__file__).parent
OUT = HERE / 'out'; OUT.mkdir(exist_ok=True)
LOGS = HERE / 'logs'; LOGS.mkdir(exist_ok=True)
MODEL, EFFORT = 'gpt-6-astra', 'max'
items = json.loads((HERE / 'items.json').read_text())

args = sys.argv[1:]
only = set(args[args.index('--only') + 1].split(',')) if '--only' in args else None
jobs = int(args[args.index('-j') + 1]) if '-j' in args else 6
extra = {}
if '--feedback' in args:
    for kv in args[args.index('--feedback') + 1:]:
        if kv.startswith('-'): break
        k, v = kv.split('=', 1); extra[k] = v

GUIDE = """You are rewriting ONE line of a Staff Software Engineer's resume. Apply strong resume-bullet craft:
- Lead with a strong past-tense action verb; show the outcome and its scale, then how.
- Keep every number exactly as given. Use ONLY facts present in the original line and context. Never invent metrics, scope, tools, or claims.
- You may reorder, tighten, or drop minor details to fit the length budget. Prefer concrete results over adjectives.
- No internal jargon a recruiter outside the company would not understand.
- Plain resume voice: no first person, no trailing period is fine either way, no emoji, no quotes around the whole line, no leading bullet character.
- Output EXACTLY the rewritten line and nothing else: a single line, no preamble, no explanation, no markdown."""

def prompt(it, feedback=None):
    ctx = (f"Section: {it['section']}\nCompany: {it['company']}\nRole: {it['role']} ({it['dates']})\nThis is a bullet under that role."
           if it['kind'] == 'bullet' else
           f"Section: {it['section']}\nRow title shown in bold before the line: {it['title']} ({it['date']})\nThis line sits on the same row as the title, so do not repeat the title.")
    rules = f"HARD RULES: one line; at most {it['maxChars']} characters."
    if it.get('linkText'):
        rules += f" Must contain the exact word \"{it['linkText']}\" (it is hyperlinked)."
    fb = f"\n\nYour previous attempt was rejected: {feedback}\nRewrite it again from the original." if feedback else ''
    return f"{GUIDE}\n\n{ctx}\n\nOriginal line:\n{it['text']}\n\n{rules}{fb}\n\nRewritten line:"

def check(it, text):
    if '\n' in text.strip(): return 'it contained more than one line'
    if len(text.strip()) > it['maxChars']: return f"it was {len(text.strip())} characters; the limit is {it['maxChars']}"
    if it.get('linkText') and it['linkText'] not in text: return f"it dropped the required word \"{it['linkText']}\""
    return None

def run(it):
    feedback = extra.get(it['id'])
    for attempt in range(1, 4):
        out = OUT / f"{it['id']}.txt"
        cmd = ['codex', 'exec', '-m', MODEL, '-c', f'model_reasoning_effort="{EFFORT}"',
               '--sandbox', 'read-only', '--skip-git-repo-check', '--ephemeral', '-C', str(HERE),
               '-o', str(out), prompt(it, feedback)]
        log = LOGS / f"{it['id']}.attempt{attempt}.log"
        with open(log, 'w') as fh:
            rc = subprocess.run(cmd, stdout=fh, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, timeout=1800).returncode
        text = out.read_text() if out.exists() else ''
        if rc != 0 or not text.strip():
            feedback = None; print(f"{it['id']}: codex exit {rc}, retrying", flush=True); continue
        problem = check(it, text)
        if not problem:
            print(f"{it['id']}: ok (attempt {attempt}) {text.strip()}", flush=True); return it['id'], True
        feedback = problem
        print(f"{it['id']}: rejected ({problem}), asking codex again", flush=True)
    print(f"{it['id']}: FAILED after 3 attempts", flush=True); return it['id'], False

todo = [it for it in items if not only or it['id'] in only]
with cf.ThreadPoolExecutor(jobs) as ex:
    results = list(ex.map(run, todo))
bad = [i for i, ok in results if not ok]
print('DONE', 'all ok' if not bad else f'failed: {bad}', flush=True)
