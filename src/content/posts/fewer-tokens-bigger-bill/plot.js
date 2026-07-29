// Build-time Observable Plot rendering. Plot and jsdom run during `astro build`
// and only the serialised SVG is emitted, so these charts ship zero client JS.
//
// Plot emits a viewBox, and a viewBox scales label text down along with the box.
// Every chart is therefore rendered twice, at a desktop and a phone width, and
// swapped with a media query, which keeps 11px labels at 11px on a phone without
// any client script.
import * as Plot from '@observablehq/plot';
import { JSDOM } from 'jsdom';

export const WIDE = 700;
export const NARROW = 380;

export const BASE_STYLE = { background: 'transparent', fontSize: '11px' };

function renderOne(spec, label) {
  const { document } = new JSDOM('').window;
  const svg = Plot.plot({ ...spec, document, style: { ...BASE_STYLE, ...spec.style } });
  // drop the fixed width so CSS can stretch it; the viewBox carries the ratio
  svg.removeAttribute('width');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  return svg.outerHTML;
}

/**
 * @param build  (width) => Plot.plot spec
 * @param label  the sentence a screen reader gets instead of the marks
 * @param widths [desktop, phone]
 */
export function responsive(build, label, widths = [WIDE, NARROW]) {
  return {
    wide: renderOne(build(widths[0]), label),
    narrow: renderOne(build(widths[1]), label),
  };
}
