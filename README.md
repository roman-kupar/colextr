# colextr

Extract the color palette of any website, right from your terminal.

```
$ colextr github.com -n 6
6 colors from https://github.com/ (20 stylesheets)

████  #ffffff   rgb(255, 255, 255)   hsl(0, 0%, 100%)     241×
████  #59636e   rgb(89, 99, 110)     hsl(211, 11%, 39%)   122×
████  #a7bbad   rgb(167, 187, 173)   hsl(138, 13%, 69%)   103×
████  #d1d9e0   rgb(209, 217, 224)   hsl(208, 19%, 85%)    94×
████  #0969da   rgb(9, 105, 218)     hsl(212, 92%, 45%)    75×
████  #08872b   rgb(8, 135, 43)      hsl(137, 89%, 28%)    64×
```

In a terminal, each `████` is a real swatch of that color.

- **Zero dependencies.** Plain Node.js, about 450 lines you can read in one sitting.
- **Modern CSS.** Understands hex, `rgb()`, `hsl()`, `oklch()` and `oklab()` in both legacy and modern syntax.
- **Ranked by usage.** Colors are sorted by how often the site uses them, so the brand colors float to the top.
- **Pipe-friendly.** Export as hex, rgb, hsl, JSON or CSS custom properties.

## Install

Requires Node.js 18.3 or newer.

```sh
git clone https://github.com/<your-username>/colextr.git
cd colextr
npm link        # makes the `colextr` command available globally
```

## Usage

```
colextr <url> [options]

  -f, --format <type>   pretty | hex | rgb | hsl | json | css  (default: pretty)
  -n, --limit <number>  Show only the N most used colors
  -t, --timeout <sec>   Network timeout per request  (default: 10)
      --no-color        Don't draw color swatches
  -h, --help            Show this help
  -v, --version         Show the version
```

The `https://` prefix is optional.

### Export formats

```sh
colextr stripe.com -n 3 -f hex
# #000000
# #ffffff
# #ff8769

colextr stripe.com -n 2 -f css > palette.css
# :root {
#   --color-1: #000000;
#   --color-2: #ffffff;
# }

colextr stripe.com -f json > palette.json
# [{ "hex": "#000000", "rgb": "rgb(0, 0, 0)", "hsl": "hsl(0, 0%, 0%)", "count": 64 }, ...]
```

When the output is piped or redirected, swatches are left out automatically and the summary line goes to stderr, so files stay clean. Swatches are also disabled by `--no-color` or the [`NO_COLOR`](https://no-color.org) environment variable.

## How it works

1. Download the page and every stylesheet it links to, following `@import`s.
2. Collect CSS written into the page itself: `<style>` blocks, `style=""` attributes, inline SVG `fill`/`stroke` and the `theme-color` meta tag.
3. Scan CSS declaration values for colors (selectors and comments are skipped), convert each one to sRGB, and count how often each appears.

```
bin/colextr.js    command-line interface
src/fetch.js      downloads the page and its stylesheets
src/html.js       finds stylesheet links and inline CSS in HTML
src/css.js        finds and counts colors in CSS
src/color.js      parses and converts color notations
src/format.js     renders the result as a table, list, JSON or CSS
```

## Limitations

- **CSS added by JavaScript isn't seen.** Some single-page apps and CSS-in-JS libraries inject their styles at runtime. colextr reads what the server sends and doesn't run a browser, which is what keeps it fast and light.
- **Named colors** like `red` or `white`, and colors built at runtime from `var()` or `color-mix()`, are skipped.
- **Swatches need a truecolor terminal.** iTerm2, the macOS Terminal app, Windows Terminal, VS Code, kitty, WezTerm and most modern terminals support it.

## Development

```sh
npm test   # runs the suite with Node's built-in test runner
```

## License

[MIT](LICENSE)
