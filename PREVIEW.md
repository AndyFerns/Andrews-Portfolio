# PREVIEW

Redesign of the portfolio: Catppuccin-style ricing palette, Persona-style scroll
choreography, Linux/tiling-WM chrome, and a set of quiet references.

Still 100% static. No build step, no package.json, no runtime CDN request — fonts
and every asset are vendored. Drop the folder on GitHub Pages as-is.

---

## Local preview

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Any static server works; the site is plain
files. `.claude/launch.json` wires the same command into the editor's preview
pane.

---

## What changed, per file

### New files

| File | What it is |
|---|---|
| `styles/fonts.css` | The four `@font-face` blocks. Points at `assets/fonts/`. |
| `styles/accents.css` | Type badges, ball spinner, shiny sparkle, gold/grace details. Self-contained. |
| `scripts/accents.js` | The rare hover sparkle. The only scripted accent. |
| `assets/fonts/*.woff2` | JetBrains Mono, Anton, Inter, Cormorant Garamond. Latin subsets, 121 KB total. |
| `.claude/launch.json` | Preview-server config for the editor. Not used at runtime. |

### Changed files

| File | What changed |
|---|---|
| `styles/themes.css` | **Rewritten.** The single source of truth: colour, type stacks, space scale, radius, motion curves, z-index, badge palette. Edit this file to reskin everything. |
| `styles/main.css` | Body/heading type moved to the font tokens, h1/h2 on the display face. Section headers left-aligned with a shell-prompt line. Tiling grid utilities. `overflow-x: clip`, `scroll-padding-top`, `.visually-hidden`, focus rings, accent scrollbar. |
| `styles/components.css` | Nav rebuilt as the status bar (+ the scroll-progress hairline). Project cards rebuilt as WM tiles with title bars. Buttons re-cut as mono, hard-edged, offset-shadow press. |
| `styles/components-extended.css` | Hero re-laid out around the terminal card; all the `.term-*` / `.fetch-*` styles are new. Cards, tags, stats, footer retuned to the tokens. |
| `styles/animations.css` | **Rewritten.** The whole reveal system, kinetic titles, cut-in bar, diagonal dividers, hero entrance, and the full reduced-motion fallback. |
| `index.html` | Content preserved and semantics unchanged. Added: pre-paint inline script, terminal hero card, status bar markup, `data-reveal` hooks, shell-prompt headings, window dots, `data-type` on tech tags. Removed: Google Fonts link, emoji icons. |
| `scripts/animations.js` | Reveal engine, status bar clock, scroll progress, active-section tracking (now also sets `aria-current`). |
| `scripts/main.js` | Added `initFetchCard()` (the live Uptime row). Dropped console noise. |
| `scripts/github-api.js` | Repo cards join the reveal system; language renders as a type badge instead of a colour dot. |
| `scripts/particles.js` | Performance fix, see below. Colours retuned. |

---

## The CSS variables you can tweak

All in `styles/themes.css`. Two theme blocks plus one theme-independent block.

### Reskinning

The accent tokens are **split by usage**, which is what keeps contrast safe:

| Token | Use it for | Must clear |
|---|---|---|
| `--accent-primary` | accent as text/icon on `--bg-primary/secondary/tertiary` | 4.5:1 on all three |
| `--accent-bright` | accent as text on `--bg-surface` (cards) | 4.5:1 on surface |
| `--accent-fill` | accent as a **solid block** background | pair only with `--accent-on-fill` |
| `--accent-on-fill` | text sitting on `--accent-fill` | 4.5:1 on the fill |

Same pattern for `--gold` / `--gold-fill` / `--gold-on-fill`. If you swap the
scarlet for another hue, change all four accent tokens together and re-check —
`--accent-primary` being readable does not mean `--accent-fill` is.

### The rest

- **Surfaces** — `--bg-primary` (base), `--bg-secondary` (alternating sections),
  `--bg-tertiary` (footer, terminal body), `--bg-surface` / `--bg-surface-2` (cards).
- **Text** — `--text-primary` / `--text-secondary` / `--text-muted` / `--text-inverse`.
  Note `--text-muted` has to clear 4.5:1 on `--bg-surface`, not just on the base.
- **Terminal chrome** — `--term-bg`, `--term-header`, `--term-prompt`, `--term-path`,
  `--term-key`, `--dot-close/min/max`. The light values are deliberately darker
  than stock Catppuccin Latte; the stock ones fail on these surfaces.
- **Type** — `--font-mono`, `--font-display`, `--font-body`, `--font-accent`.
  Swap a face here *and* in `styles/fonts.css`.
- **Space** — `--space-1` … `--space-9` (4px base). **Radius** — `--radius-sm/md/lg/pill`;
  raise these for a softer, less "riced" look.
- **Motion** — `--dur-1` … `--dur-4`, `--ease-cut` (the house curve),
  `--ease-snap` (overshoot), `--stagger` (delay between staggered items).
  Raising `--stagger` slows every sequence at once.
- **Layout** — `--statusbar-h`. `--divider-h` (on `section`) controls the diagonal depth.
- **Badges** — `--type-*` and its matching `--type-*-ink`, 14 pairs.

---

## The scroll animation system

Declared in markup, driven by CSS. `scripts/animations.js` only adds a class and
writes an index.

```html
<div data-reveal="left">…</div>          <!-- one element -->
<div data-stagger>                        <!-- children fire in sequence -->
  <div data-reveal="auto">…</div>
  <div data-reveal="auto">…</div>
</div>
```

| Variant | Behaviour |
|---|---|
| `up` | rises and locks |
| `left` / `right` | enters from that lower diagonal |
| `auto` | inside `data-stagger`, alternates diagonals per child |
| `wipe` | hard-edged clip-path wipe, no fade |
| `panel` | skewed panel that straightens as it lands |
| `title` | kinetic heading + the scarlet cut-in bar |

To animate something new, add `data-reveal="…"` to it. Nothing else is needed —
content injected later (the GitHub repo cards) goes through `registerReveals()`.

Everything animates `transform` / `opacity` / `clip-path` only, so nothing here
can trigger layout. `will-change` is dropped once an element lands rather than
held for the life of the page.

---

## Where each easter egg lives

| Reference | Where | File |
|---|---|---|
| Type-badge pills | tech tags, skills, repo languages | `styles/accents.css` §1, `--type-*` in `themes.css`, `data-type` in `index.html`, `LANGUAGE_TYPES` in `github-api.js` |
| Ball spinner | shows while GitHub repos load | `styles/accents.css` §2 (`.loading-spinner`) |
| Shiny sparkle | hover the sigil on the terminal card, 1 in 16 | `styles/accents.css` §3 + `scripts/accents.js` (`SHINY_ODDS`) |
| Gold on the diagonals | every section divider | `styles/accents.css` §4 (`section::before/::after`) |
| Grace glow | the focused workspace pill in the status bar | `styles/accents.css` §4 (`.nav-link.active`) |
| Golden bloom | fades in behind each section title as it reveals | `styles/accents.css` §4 (`grace-bloom`) |
| Serif small-caps | the footer colophon line | `styles/accents.css` §4 (`.footer-colophon`) |
| Piano | *removed* — see "Not shipped" below | — |

None of it is load-bearing. A visitor who recognises none of it should just see
colour-coded tags, a stylish spinner and gold dividers.

---

## Reverting individual features

| To remove | Do this |
|---|---|
| **All easter eggs** | Delete the `styles/accents.css` and `scripts/accents.js` tags from `index.html`. Tech tags fall back to plain mono pills. |
| **One easter egg** | Each block in `accents.css` is numbered and self-contained; delete the block. |
| **Just the sparkle** | Drop the `scripts/accents.js` tag. |
| **Scroll animations** | Drop the `scripts/animations.js` tag — the `html.js` gate means everything renders statically. To remove the code too, delete the reveal section of `animations.css` and the `data-reveal` / `data-stagger` attributes. |
| **Diagonal dividers** | Delete `section::before` in `animations.css` and `section::before/::after` in `accents.css`. |
| **Kinetic titles** | Delete the "KINETIC SECTION TITLES" block in `animations.css`. The `<span class="section-title-inner">` wrappers are harmless if left. |
| **Status bar → plain nav** | Replace the `.statusbar` block in `components.css`. The markup keeps the original `.nav` / `.nav-links` / `.nav-link` class names, so nothing in JS needs touching. |
| **Scroll progress hairline** | Delete `.statusbar::after` in `components.css` and the `initScrollProgress()` call. |
| **Terminal hero card** | Replace the `.hero-image` block in `index.html` with a plain `<img>`; the `.term-*` / `.fetch-*` CSS then goes unused. |
| **Tiling card look** | In `components.css`, drop the `box-shadow: inset …` from `.project-card:hover` and the `.project-card-header` title-bar styling. |
| **Particle background** | Drop the `scripts/particles.js` tag. |
| **Old palette** | `git revert` the theme commit, or paste the old values back into the two blocks in `themes.css`. |

---

## Things worth knowing

**Content you may want to edit.** The fastfetch rows are plain `<dt>`/`<dd>` pairs
in `index.html`. Two are worth a look:

- **Uptime** counts from `CODING_SINCE` in `scripts/main.js`, currently
  `2022-01-01`, to match the "4+ Years Coding" stat. The markup carries a static
  `4 years` as the JS-disabled fallback — change both together.
- **Now Playing** is a fixed string, not a live feed. There is no way to make it
  live without a server or a third-party API call, which the static/no-CDN
  constraint rules out.

**A performance bug fixed along the way.** `particles.js` resolved its theme
colours with `getComputedStyle` inside the draw calls — once per particle and
once per connection line, every frame. That is a forced style recalculation a few
thousand times a second. Colours are now read once and re-read only when the
theme attribute changes.

**Not shipped: the piano progress bar.** Built as one octave with working
white/black key layout and a held-down key for the current section, then removed
at your call — at 18–22px tall it read as clutter under the status bar. It is in
git history at commit `9b2ca94` if you ever want it back; `git show 9b2ca94` has
`styles/piano.css` intact.

**Verified, not assumed.** Zero WCAG AA failures across every rendered text node
in both themes (audited in-browser against effective backgrounds, not against the
token table). No horizontal scroll at 320 / 375 / 768 / 1280. All reveal targets
visible with `html.js` absent. Skip link legible on focus.

**Not measured:** Lighthouse. There is no Chrome/Lighthouse binary available in
this environment, so the 95+ target is designed for — self-hosted subset fonts
with `font-display: swap`, explicit image dimensions, transform/opacity-only
animation, no third-party requests — but not confirmed. Worth one run before you
publish.

Added JS is **7.7 KB uncompressed** against the pre-redesign baseline
(`animations.js` +4.3 KB, `main.js` +1.2 KB, `accents.js` +2.1 KB), against the
~15 KB budget. No animation library. Fonts add 121 KB across four latin-subset
woff2 files, replacing two render-blocking CDN round-trips.
