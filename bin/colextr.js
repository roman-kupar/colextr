#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { extractColors } from '../src/css.js';
import { fetchStyles } from '../src/fetch.js';
import { FORMATS, format } from '../src/format.js';

const HELP = `
colextr — extract the color palette of any website

Usage
  colextr <url> [options]

Options
  -f, --format <type>   ${FORMATS.join(' | ')}  (default: pretty)
  -n, --limit <number>  Show only the N most used colors
  -t, --timeout <sec>   Network timeout per request  (default: 10)
      --no-color        Don't draw color swatches
  -h, --help            Show this help
  -v, --version         Show the version

Examples
  colextr github.com
  colextr https://stripe.com -n 10
  colextr example.com -f json > palette.json
`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      format: { type: 'string', short: 'f', default: 'pretty' },
      limit: { type: 'string', short: 'n' },
      timeout: { type: 'string', short: 't', default: '10' },
      'no-color': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });

  if (values.version) return console.log(version());
  if (values.help || positionals.length === 0) return console.log(HELP.trim());

  if (!FORMATS.includes(values.format)) {
    throw new Error(`unknown format "${values.format}" (expected ${FORMATS.join(', ')})`);
  }
  const limit = values.limit === undefined ? Infinity : positiveNumber(values.limit, '--limit');
  const timeout = positiveNumber(values.timeout, '--timeout') * 1000;

  const url = withProtocol(positionals[0]);
  const warn = (message) => console.error(`warning: ${message}`);
  const page = await fetchStyles(url, { timeout, onWarning: warn });
  const colors = extractColors(page.sources).slice(0, limit);

  if (colors.length === 0) {
    console.error(`No colors found on ${page.url}`);
    return;
  }

  // Swatches only when a human is looking at a terminal; piped output stays clean.
  const swatches = process.stdout.isTTY && !values['no-color'] && !process.env.NO_COLOR;
  if (values.format === 'pretty') {
    console.error(`${colors.length} colors from ${page.url} (${page.stylesheets} stylesheets)\n`);
  }
  console.log(format(colors, values.format, { swatches }));
}

function withProtocol(input) {
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

function positiveNumber(value, flag) {
  const number = Number(value);
  if (!(number > 0)) throw new Error(`${flag} must be a positive number`);
  return number;
}

function version() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return pkg.version;
}

main().catch((error) => {
  console.error(`colextr: ${error.message}`);
  process.exitCode = 1;
});
