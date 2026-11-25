/**
 * Color parsing and conversion.
 *
 * Every color is normalized to { r, g, b, a }:
 * r, g, b are integers in 0–255 and a is a number in 0–1.
 */

const FUNCTION_RE = /^(rgba?|hsla?|oklch|oklab)\(\s*([^()]*)\)$/;

/** Parse a CSS color string. Returns null for anything it doesn't understand. */
export function parseColor(input) {
  const str = input.trim().toLowerCase();
  if (str.startsWith('#')) return parseHex(str.slice(1));

  const match = str.match(FUNCTION_RE);
  if (!match) return null;

  const [, fn, body] = match;
  const parts = body.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;

  const [x, y, z] = parts;
  const alpha = parts[3] === undefined ? 1 : number(parts[3], 1);

  switch (fn) {
    case 'rgb':
    case 'rgba':
      return finalize([number(x, 255), number(y, 255), number(z, 255)], alpha);
    case 'hsl':
    case 'hsla':
      return finalize(hslToRgb(hue(x), number(y, 100) / 100, number(z, 100) / 100), alpha);
    case 'oklab':
      return finalize(oklabToRgb(number(x, 1), number(y, 0.4), number(z, 0.4)), alpha);
    case 'oklch': {
      const chroma = number(y, 0.4);
      const angle = (hue(z) * Math.PI) / 180;
      return finalize(oklabToRgb(number(x, 1), chroma * Math.cos(angle), chroma * Math.sin(angle)), alpha);
    }
  }
  return null;
}

export function toHex({ r, g, b, a }) {
  const channels = a < 1 ? [r, g, b, Math.round(a * 255)] : [r, g, b];
  return '#' + channels.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function toRgb({ r, g, b, a }) {
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

export function toHsl(color) {
  const [h, s, l] = rgbToHsl(color);
  return color.a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${color.a})` : `hsl(${h}, ${s}%, ${l}%)`;
}

/** Hue in degrees, saturation and lightness in percent — all rounded. */
export function rgbToHsl({ r, g, b }) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, Math.round(l * 100)];

  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

// --- helpers ---------------------------------------------------------------

function parseHex(hex) {
  if (!/^[0-9a-f]+$/.test(hex) || ![3, 4, 6, 8].includes(hex.length)) return null;
  if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('');

  const [r, g, b, a = 255] = hex.match(/../g).map((pair) => parseInt(pair, 16));
  return finalize([r, g, b], a / 255);
}

/** A number token; percentages are scaled so that 100% equals `percentOf`. */
function number(token, percentOf) {
  if (token === 'none') return 0;
  const value = parseFloat(token);
  return token.endsWith('%') ? (value / 100) * percentOf : value;
}

/** A hue token in degrees, accepting the other CSS angle units too. */
function hue(token) {
  const value = number(token, 1);
  if (token.endsWith('turn')) return value * 360;
  if (token.endsWith('grad')) return value * 0.9;
  if (token.endsWith('rad')) return (value * 180) / Math.PI;
  return value;
}

function finalize(rgb, alpha) {
  if (![...rgb, alpha].every(Number.isFinite)) return null;
  const [r, g, b] = rgb.map((v) => Math.round(clamp(v, 0, 255)));
  const a = Math.round(clamp(alpha, 0, 1) * 100) / 100;
  return { r, g, b, a };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** h in degrees, s and l in 0–1. Returns channels in 0–255. */
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const k = (n) => (n + h / 30) % 12;
  const f = (n) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/** OKLab → sRGB, using the reference matrices from Björn Ottosson. */
function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const gamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  return linear.map((v) => gamma(v) * 255);
}
