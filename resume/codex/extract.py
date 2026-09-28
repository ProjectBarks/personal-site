"""Write items.json: one entry per printed bullet / one-line row, with context and a length budget."""
import json, math, pathlib

HERE = pathlib.Path(__file__).parent
data = json.loads((HERE.parent / 'resume.json').read_text())
MAX_PRIORITY = data['variants']['full']['maxPriority']
keep = lambda x: x.get('priority', 1) <= MAX_PRIORITY

items = []
for si, sec in enumerate(data['sections']):
    for ei, e in enumerate(sec['entries']):
        if not keep(e):
            continue
        if e.get('layout') == 'line' and sec['title'] != 'Education & Recognition' or (sec['title'] == 'Education & Recognition' and 'University' not in e['title']):
            if e.get('layout') == 'line' and e.get('description'):
                budget = math.floor(114 - 1.3 * len(e['title']) - max(0, len(e.get('date', '')) - 4))
                items.append({'id': f's{si}e{ei}', 'kind': 'row', 'path': [si, ei, 'description'],
                              'section': sec['title'], 'title': e['title'], 'date': e.get('date'),
                              'text': e['description'], 'maxChars': max(budget, len(e['description']))})
        for ri, r in enumerate(e.get('roles', [])):
            for bi, b in enumerate(r['bullets']):
                if keep(b):
                    items.append({'id': f's{si}e{ei}r{ri}b{bi}', 'kind': 'bullet', 'path': [si, ei, 'roles', ri, 'bullets', bi, 'text'],
                                  'section': sec['title'], 'company': e['title'], 'role': r['title'], 'dates': r['date'],
                                  'text': b['text'], 'linkText': b.get('linkText'), 'maxChars': max(116, len(b['text']))})
(HERE / 'items.json').write_text(json.dumps(items, indent=2, ensure_ascii=False) + '\n')
print(f'{len(items)} items')
for it in items:
    print(f"{it['id']:14} {it['maxChars']:4} {len(it['text']):4}  {it['text'][:70]}")
