# GNOS3 — Marketing Site (remix)

Single-page static marketing site for GNOS3, ported from the Claude Design
handoff bundle. **Independent from the existing `Gnos3-website` Next.js
project** — this folder is where the site is iterated in Claude Code going
forward.

## Structure

```
index.html                  # the site (inline CSS + JS, one file)
screenshots/                # reference screenshots from the design handoff
.design-handoff-readme.md   # original bundle README
.design-handoff-chat.md     # full design chat transcript (iteration history)
```

Everything lives in `index.html` — CSS is inline in `<style>`, JS is inline
at the bottom. Google Fonts (Geist / Geist Mono / Inter / IBM Plex Mono /
Space Grotesk) are loaded from the public CDN.

## Preview locally

```bash
npm run dev
```

Serves the site on <http://localhost:4300> (no install needed — uses
`npx serve`).

Alternatively, any static HTTP server works:

```bash
python3 -m http.server 4300
```

## Deploy

It's one `index.html` — drop the folder onto any static host:

- Nginx / Caddy / Apache — point root at this folder
- Cloudflare Pages / Netlify / Vercel — "Other" framework, no build step,
  publish directory is the repo root
- GitHub Pages — same

No build step, no transpiling, no bundling.

## Editing

- `TWEAK_DEFAULTS` at the top of `index.html` flips individual FX effects
  on/off (`fxDeviceParallax`, `fxTileRipple`, `fxMagneticCta`, etc.)
- All sections are plain HTML with class-based styling — grep for the
  section id (e.g. `#privacy`, `#how`, `#cases`, `#compare`, `#order`).
- The mini-PC illustration is an inline SVG inside the `.device` element.
- The hero backdrop tile grid is generated at runtime by the script at
  the bottom of the file (`buildBackdrop`).

## Handoff context

See `.design-handoff-chat.md` for the full back-and-forth with the design
assistant — copy direction, accent choice (muted steel-blue), mini-PC
illustration decisions, FX lab rationale, mobile rework, etc.
