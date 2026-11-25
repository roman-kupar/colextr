import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractColors } from '../src/css.js';
import { inlineCss, stylesheetLinks } from '../src/html.js';

test('counts colors across sources, most used first', () => {
  const colors = extractColors(['a { color: #000; } b { color: #FFF }', 'c { border: 1px solid rgb(255,255,255) }']);
  assert.deepEqual(
    colors.map(({ hex, count }) => [hex, count]),
    [['#ffffff', 2], ['#000000', 1]],
  );
});

test('ignores selectors, comments and transparent colors', () => {
  const css = '#add, a:hover { color: #123456 } /* #abcdef; */ .x { background: rgba(0,0,0,0) }';
  assert.deepEqual(extractColors([css]).map((c) => c.hex), ['#123456']);
});

test('finds stylesheet links and resolves them', () => {
  const html = `
    <link rel="stylesheet" href="/main.css">
    <link rel=preload as=style href="fonts.css">
    <link rel="icon" href="/favicon.png">`;
  assert.deepEqual(stylesheetLinks(html, 'https://example.com/docs/'), [
    'https://example.com/main.css',
    'https://example.com/docs/fonts.css',
  ]);
});

test('collects inline styles, SVG paint and theme-color', () => {
  const html = `
    <meta name="theme-color" content="#0af">
    <style>body { background: #eee }</style>
    <div style="color: #111"></div>
    <svg><path fill="#f00"/></svg>`;
  const hexes = extractColors([inlineCss(html)]).map((c) => c.hex).sort();
  assert.deepEqual(hexes, ['#00aaff', '#111111', '#eeeeee', '#ff0000']);
});
