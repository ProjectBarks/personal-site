import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deEm, humanDate, isExternalHref, hardenLinks } from './text.js';

test('deEm collapses a year-range em dash into a hyphen', () => {
  assert.equal(deEm('2017—21'), '2017-21');
});

test('deEm turns other em dashes into a comma separator', () => {
  assert.equal(deEm('tinkerer — inventor'), 'tinkerer, inventor');
});

test('deEm passes non-string input through unchanged', () => {
  assert.equal(deEm(42), 42);
  assert.equal(deEm(undefined), undefined);
});

test('humanDate renders the month as a lowercase word', () => {
  assert.equal(humanDate('2020-06-18'), '2020 jun 18');
  assert.equal(humanDate('2016-12-15'), '2016 dec 15');
});

test('humanDate passes through strings that are not ISO dates', () => {
  assert.equal(humanDate('not-a-date'), 'not-a-date');
});

test('isExternalHref is true only for http(s) URLs', () => {
  assert.equal(isExternalHref('https://example.com'), true);
  assert.equal(isExternalHref('http://example.com'), true);
  assert.equal(isExternalHref('/cv.html'), false);
  assert.equal(isExternalHref('mailto:contact@brandonbarker.me'), false);
});

test('hardenLinks adds target=_blank only to http(s) anchors', () => {
  const html = '<a href="https://x.com">x</a> <a href="/cv.html#foo">foo</a>';
  const out = hardenLinks(html);
  assert.match(out, /<a href="https:\/\/x\.com" target="_blank" rel="noopener noreferrer">/);
  assert.doesNotMatch(out, /"\/cv\.html#foo" target="_blank"/);
});
