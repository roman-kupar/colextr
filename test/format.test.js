import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseColor } from '../src/color.js';
import { format } from '../src/format.js';

const entries = ['#1a73e8', '#ffffff'].map((hex, i) => ({ hex, color: parseColor(hex), count: 2 - i }));

test('plain list formats', () => {
  assert.equal(format(entries, 'hex'), '#1a73e8\n#ffffff');
  assert.equal(format(entries, 'rgb'), 'rgb(26, 115, 232)\nrgb(255, 255, 255)');
});

test('css custom properties', () => {
  assert.equal(format(entries, 'css'), ':root {\n  --color-1: #1a73e8;\n  --color-2: #ffffff;\n}');
});

test('json includes every notation and the count', () => {
  const [first] = JSON.parse(format(entries, 'json'));
  assert.deepEqual(first, { hex: '#1a73e8', rgb: 'rgb(26, 115, 232)', hsl: 'hsl(214, 82%, 51%)', count: 2 });
});

test('swatches use 24-bit ANSI background colors', () => {
  assert.match(format(entries, 'hex', { swatches: true }), /^\x1b\[48;2;26;115;232m {4}\x1b\[0m {2}#1a73e8/);
});
