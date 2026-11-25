/**
 * Turn extracted colors into text: a table for humans, or plain formats for other tools.
 */

import { toHex, toHsl, toRgb } from './color.js';

export const FORMATS = ['pretty', 'hex', 'rgb', 'hsl', 'json', 'css'];

/**
 * @param {{ hex: string, color: object, count: number }[]} entries
 * @param {string} type One of FORMATS.
 * @param {{ swatches?: boolean }} options Whether to draw colored blocks (24-bit ANSI).
 */
export function format(entries, type, { swatches = false } = {}) {
  const prefix = (color) => (swatches ? swatch(color) + '  ' : '');

  switch (type) {
    case 'hex':
      return entries.map(({ color }) => prefix(color) + toHex(color)).join('\n');
    case 'rgb':
      return entries.map(({ color }) => prefix(color) + toRgb(color)).join('\n');
    case 'hsl':
      return entries.map(({ color }) => prefix(color) + toHsl(color)).join('\n');
    case 'json':
      return JSON.stringify(
        entries.map(({ color, count }) => ({
          hex: toHex(color),
          rgb: toRgb(color),
          hsl: toHsl(color),
          count,
        })),
        null,
        2,
      );
    case 'css':
      return [':root {', ...entries.map(({ color }, i) => `  --color-${i + 1}: ${toHex(color)};`), '}'].join('\n');
    default:
      return table(entries, prefix);
  }
}

/** A small block painted with the color's background — works in any truecolor terminal. */
export function swatch({ r, g, b }) {
  return `\x1b[48;2;${r};${g};${b}m    \x1b[0m`;
}

function table(entries, prefix) {
  const rows = entries.map(({ color, count }) => [toHex(color), toRgb(color), toHsl(color), `${count}×`]);
  const widths = rows[0]?.map((_, col) => Math.max(...rows.map((row) => row[col].length))) ?? [];

  return rows
    .map((row, i) => {
      const cells = row.map((cell, col) => (col === row.length - 1 ? cell.padStart(widths[col]) : cell.padEnd(widths[col])));
      return prefix(entries[i].color) + cells.join('   ');
    })
    .join('\n');
}
