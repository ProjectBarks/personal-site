const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// em dashes are banned in copy: year ranges -> hyphen, separators -> comma.
export function deEm(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/(\d{4})\s*—\s*(\d{2,4})/g, '$1-$2').replace(/\s*—\s*/g, ', ');
}

// A purely numeric y-m-d is ambiguous between day-first and month-first
// conventions, and rendering the month as a word sidesteps that ambiguity.
export function humanDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[1]} ${MONTHS[+m[2] - 1]} ${m[3]}` : iso;
}

export function isExternalHref(href) {
  return /^https?:/i.test(href);
}

export function hardenLinks(html) {
  return html.replace(
    /<a href="(https?:[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );
}
