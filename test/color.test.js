import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseColor, toHex, toHsl, toRgb } from '../src/color.js';

const hex = (input) => {
  const color = parseColor(input);
  return color && toHex(color);
};

test('parses hex in all lengths', () => {
  assert.equal(hex('#FFF'), '#ffffff');
  assert.equal(hex('#0f08'), '#00ff0088');
  assert.equal(hex('#1a73e8'), '#1a73e8');
  assert.equal(hex('#1a73e880'), '#1a73e880');
});

test('parses legacy and modern rgb/hsl syntax', () => {
  assert.equal(hex('rgb(26, 115, 232)'), '#1a73e8');
  assert.equal(hex('rgba(0,0,0,.5)'), '#00000080');
  assert.equal(hex('rgb(0 128 255 / 50%)'), '#0080ff80');
  assert.equal(hex('hsl(210, 40%, 50%)'), '#4d80b3');
  assert.equal(hex('hsl(0.5turn 100% 50%)'), '#00ffff');
});

test('converts oklch and oklab to sRGB', () => {
  assert.equal(hex('oklch(62.8% 0.2577 29.23)'), '#ff0000');
  assert.equal(hex('oklab(0.628 0.2249 0.1258)'), '#ff0000');
  assert.equal(hex('oklch(1 0 0)'), '#ffffff');
});

test('rejects what it cannot resolve', () => {
  for (const input of ['#zzz', '#12345', 'rgb(var(--x))', 'rgb(1, 2)', 'red', 'color-mix(in srgb, red, blue)']) {
    assert.equal(parseColor(input), null, input);
  }
});

test('formats colors as rgb and hsl', () => {
  const color = parseColor('#1a73e8');
  assert.equal(toRgb(color), 'rgb(26, 115, 232)');
  assert.equal(toHsl(color), 'hsl(214, 82%, 51%)');
  assert.equal(toRgb(parseColor('rgba(0, 0, 0, .5)')), 'rgba(0, 0, 0, 0.5)');
});
