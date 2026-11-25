/**
 * Pull styling information out of an HTML document.
 *
 * This is regex-based on purpose: we only need a handful of well-known tags
 * and attributes, and it keeps the tool free of dependencies.
 */

const STYLE_BLOCK_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTR_RE = /\s(style|fill|stroke|stop-color)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

/** Read one attribute's value from a single HTML tag string. */
export function attr(tag, name) {
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i');
  const match = tag.match(re);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

/** Absolute URLs of the external stylesheets a page links to. */
export function stylesheetLinks(html, pageUrl) {
  const urls = new Set();

  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = (attr(tag, 'rel') ?? '').toLowerCase().split(/\s+/);
    const isStylesheet =
      rel.includes('stylesheet') || (rel.includes('preload') && attr(tag, 'as') === 'style');
    const href = attr(tag, 'href');
    if (!isStylesheet || !href) continue;

    try {
      urls.add(new URL(href, pageUrl).href);
    } catch {
      // Ignore malformed hrefs.
    }
  }

  return [...urls];
}

/**
 * CSS embedded in the page itself: <style> blocks, style="" attributes,
 * inline SVG paint attributes and the theme-color meta tag.
 * Attributes are wrapped as `{name: value;}` so they parse like regular CSS.
 */
export function inlineCss(html) {
  const parts = [];

  for (const [, css] of html.matchAll(STYLE_BLOCK_RE)) parts.push(css);

  for (const [, name, doubleQuoted, singleQuoted] of html.matchAll(STYLE_ATTR_RE)) {
    const value = doubleQuoted ?? singleQuoted;
    parts.push(name.toLowerCase() === 'style' ? `{${value};}` : `{${name}: ${value};}`);
  }

  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const content = attr(tag, 'content');
    if (attr(tag, 'name')?.toLowerCase() === 'theme-color' && content) {
      parts.push(`{theme-color: ${content};}`);
    }
  }

  return parts.join('\n');
}
