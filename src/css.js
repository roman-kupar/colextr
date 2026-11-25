/**
 * Find colors inside CSS text and count how often each one is used.
 */

import { parseColor, toHex } from './color.js';

const COMMENT_RE = /\/\*[\s\S]*?\*\//g;

// A declaration value: text after a colon that ends with `;` or `}`.
// Selectors end with `{`, so ids like `#fade` or `:hover` are never matched.
const VALUE_RE = /:([^;{}]+)(?=[;}])/g;

// Hex literals and color functions inside a value.
const TOKEN_RE = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\([^()]*\)/gi;

/**
 * @param {string[]} sources CSS texts to scan.
 * @returns {{ hex: string, color: object, count: number }[]} Unique colors, most used first.
 */
export function extractColors(sources) {
  const found = new Map();

  for (const source of sources) {
    const css = source.replace(COMMENT_RE, '');

    for (const [, value] of css.matchAll(VALUE_RE)) {
      for (const [token] of value.matchAll(TOKEN_RE)) {
        const color = parseColor(token);
        if (!color || color.a === 0) continue; // invisible colors aren't part of a palette

        const hex = toHex(color);
        const entry = found.get(hex) ?? { hex, color, count: 0 };
        entry.count += 1;
        found.set(hex, entry);
      }
    }
  }

  return [...found.values()].sort((a, b) => b.count - a.count);
}
