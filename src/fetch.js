/**
 * Download a page and every stylesheet it uses.
 */

import { inlineCss, stylesheetLinks } from './html.js';

const USER_AGENT = 'Mozilla/5.0 (compatible; colextr)';
const IMPORT_RE = /@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi;
const MAX_IMPORT_DEPTH = 3;

/**
 * @param {string} url Page to analyze.
 * @param {{ timeout?: number, onWarning?: (message: string) => void }} options
 * @returns {Promise<{ url: string, sources: string[], stylesheets: number }>}
 *   The final page URL (after redirects), all CSS texts found, and how many stylesheets were downloaded.
 */
export async function fetchStyles(url, { timeout = 10_000, onWarning = () => {} } = {}) {
  const page = await get(url, timeout);
  const pageCss = inlineCss(page.text);
  const sources = [pageCss];

  let queue = [...stylesheetLinks(page.text, page.url), ...importsOf(pageCss, page.url)];
  const seen = new Set(queue);
  let downloaded = 0;

  // Stylesheets can @import other stylesheets, so download them level by level.
  for (let depth = 0; depth < MAX_IMPORT_DEPTH && queue.length > 0; depth++) {
    const results = await Promise.allSettled(queue.map((href) => get(href, timeout)));
    const next = [];

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        onWarning(`skipped ${queue[i]} (${result.reason.message})`);
        return;
      }
      const { text, url: sheetUrl } = result.value;
      sources.push(text);
      downloaded += 1;

      for (const href of importsOf(text, sheetUrl)) {
        if (!seen.has(href)) next.push(href);
        seen.add(href);
      }
    });

    queue = next;
  }

  return { url: page.url, sources, stylesheets: downloaded };
}

async function get(url, timeout) {
  let response;
  try {
    response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,text/css,*/*' },
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    // Node reports network failures as "fetch failed" with the real reason in `cause`.
    throw new Error(error.cause?.message ?? error.message);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { url: response.url, text: await response.text() };
}

function importsOf(css, baseUrl) {
  const urls = [];
  for (const [, href] of css.matchAll(IMPORT_RE)) {
    try {
      urls.push(new URL(href, baseUrl).href);
    } catch {
      // Ignore malformed imports.
    }
  }
  return urls;
}
