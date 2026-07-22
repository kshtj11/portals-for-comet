# Device Kit

Design system for **540 × 620 touch-handheld prototypes** (Linux handheld with a
keyboard extension — the "Comet" family). Single, self-contained, no build, no
frameworks. Runs over `file://` or any static server.

### Files
| File | Role |
|---|---|
| `device-kit.css` | All tokens, color/elevation, z-index, and every component style. |
| `device-kit.js` | Runtime: pointer helpers, keyboard, overlays, snackbar, gestures. Exposes `window.Kit`. |
| `base.html` | Lean starter — copy this to begin a new app; build inside `#content`. |
| `showcase.html` | One canonical instance of each component + its rule. |

> **For a future Claude instance:** read *this file* to understand and extend the
> system — you do **not** need to read the CSS/JS or any prototype's HTML first.
> The class names, tokens, and `Kit` API below are the contract. Open the CSS/JS
> only when you need to change the system itself.

---

## Hard rules (always hold)

1. **Single file per app** (plus the shared `device-kit.{css,js}`). No frameworks, no build step.
2. **Pointer Events only.** Use `pointerdown/move/up/cancel` — never mix in `mouse*` or `touch*`. This makes touch the target while a desktop mouse emulates it with the same feel.
3. **`touch-action: none` on `.device`.** Opt scrollable regions back in with `touch-action: pan-y`.
4. **Capture after a threshold.** `setPointerCapture` only once movement exceeds ~4px (`Kit.DRAG_THRESHOLD`), so taps still reach child buttons. Release on up/cancel. Swallow the click that follows a real drag.
5. **Touch targets ≥ 44px** (`--tap`). The `.big` modifier raises it to 56px.
6. **No scrollbars** anywhere (handled globally in the CSS).
7. **Device is centered** on a black page; the page never scrolls.
8. **Neutral grayscale** UI (R=G=B). Exactly one functional hue: `--hue` (links, undo, focus).
9. **Transform-driven motion** — `translate`/`scale` with a `transform-origin`; no layout animation.
10. **Keyboard is on-screen and custom.** Text inputs raise it on focus; non-text controls (sliders, toggles) must not.

---

## Tokens (`:root` / `.device`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#070707` | L0 device base (darkest) |
| `--surface` | `#161616` | L1 cards, inputs, sheets |
| `--surface-2` | `#212121` | L2 raised inside a surface |
| `--surface-3` | `#2c2c2c` | L3 controls, chips, keys |
| `--overlay` | `#242424` | L4 floating popups/menus (lightest) |
| `--text` / `--dim` | `#eaeaea` / `#888888` | foreground / secondary |
| `--line` | `#2c2c2c` | hairline dividers |
| `--accent` / `--on-accent` | `#cacaca` / `#161616` | neutral accent fill / text on it |
| `--hue` | `#7fb0ff` | the one functional color |
| `--radius` / `--radius-md` / `--radius-sm` | `22 / 16 / 12px` | corner radii |
| `--tap` | `44px` | minimum touch target |
| `--font` | `16px` | base font — user-scalable, drives all `calc()` type |
| `--bar-h` | `64px` | bottom bar height |
| `--window-h` / `--window-w` / `--window-max` | `402px / 64% / 348px` | standard floating-window size |

**Modifiers on `.device`:** `.hc` (high contrast), `.big` (56px targets),
`.kbd-open` (keyboard up), `.shift-on` (keyboard shift latched).

### Color & elevation rule
**Elevation is encoded as lightness — the higher a layer floats, the lighter its
background.** Base is darkest; a sheet is one step up; a popup/menu is the
lightest. Use the helper classes `.elev-0 … .elev-4` to set a layer's background
by rank. This is the core visual law of the system.

### Z-index scale
Layer order **matches** the color rule (top = lightest). Use the variables, never raw numbers.

| Token | z | Layer | Surface |
|---|---|---|---|
| `--z-base` | 0 | page / screen | `--bg` |
| `--z-bar` | 10 | bottom bar | `--surface` |
| `--z-sheet` | 20 | bottom sheet | `--surface` |
| `--z-scrim` | 30 | scrim | — |
| `--z-popup` | 40 | menus / popups | `--overlay` |
| `--z-panel` | 50 | full slide-in panel | `--bg` |
| `--z-snack` | 60 | snackbar | `--surface-3` |
| `--z-keyboard` | 70 | on-screen keyboard | — |
| `--z-gesture` | 80 | edge-swipe affordance | — |

### Window sizing
Floating windows (popups, lists) share `--window-h` / `--window-w` /
`--window-max` so stacked windows feel consistent. A popup that needs to scroll
caps its inner `.popscroll` (default `max-height: 330px`) and shows fades.

---

## Components

Each entry: **class → structure → rule.** State is expressed with classes
(`.open`, `.on`, `.show`, `.hidden`), never inline.

- **Device** — `.device#device` → wraps everything. The only element with
  `touch-action:none`. Apply modifiers here.
- **Screen** — `.screen > .content + .bottombar`. `.content` is the pan-y
  scroller; build your UI inside it.
- **Bottom bar** — `.bottombar` with `.addr` (pill, contains `<input>`) and
  `.iconbtn`s. Add `.hidden` to slide it away (see `Kit.autoHideBar`).
- **Scrim** — `.scrim` → `.open` dims behind any overlay. One scrim, shared.
- **Bottom sheet** — `.sheet > .grab + .head + .content`. `.open` slides it up.
  Drag the `.grab` to dismiss.
- **Popup menu** — `.popup > .scrollfades > (.popscroll + .fade.top + .fade.bottom)`,
  optional pinned `.menu-row` after. Items: `.menu-item > svg + .label`
  (+ `.check` for a checkbox item; add `.on` when checked). `.menu-sep` divides
  groups. Scales from its corner; lightest surface.
- **Slide-in panel** — `.panel > .phead(.back + h2) + .body`. Full-screen sub
  page; `.open` slides in from the right.
- **List row** — `.listrow > .ico + .txt(.t + .s)`. Min height `--tap`.
- **Toggle** — `.toggle(.tl + .sw)`; add `.on` for active.
- **Segmented control** — `.segctl > .seg`; exactly one `.seg.on`.
- **Chip** — `.chip` (pill button); `.chip.hue` for the accented variant.
- **Snackbar** — `.snack > .snmsg + .action`; `.show` reveals it in the bottom
  half. Optional action (e.g. Undo); auto-dismisses.
- **Keyboard** — `.kbd > .krow > .key[data-k]`. **Hardcoded** — copy the markup
  verbatim from `base.html` (it's the exact Comet keyboard). Letter keys are
  42×48px; special keys carry `data-k` *and* a matching width class:
  `.shift` / `.back` / `.sym` / `.fn` / `.comma` / `.dot` / `.space` / `.enter`
  (enter holds an inline SVG glyph). `sym`/`fn` are visual-only; `shift` latches
  (`.kbd.shift-on`), `back` deletes, `enter` submits the input's form. Shift
  uppercases the *inserted* character only — key labels stay lowercase.
- **Edge-back affordance** — `.backhint` bubble; `Kit.edgeBack` positions it and
  fires your commit callback.

---

## `Kit` API (`device-kit.js`)

All take DOM elements. Wire once on load.

| Call | Purpose |
|---|---|
| `Kit.dragScroll(el)` | Mouse drag-to-scroll for a scroller (touch keeps native momentum). |
| `Kit.bindFades(scroller, topEl, botEl)` → `update()` | Toggle `.fade.show` on overflow. Call returned `update()` after render/open. |
| `Kit.sheetDrag(handle, sheet, onDismiss[, commit])` | Drag a sheet's grab handle to dismiss. |
| `Kit.pullScroll(el, onDismiss[, commit])` | One region that both scrolls and pull-to-dismisses (element needs `touch-action:none`). |
| `Kit.makeKeyboard(device, kbd)` → `{open, close, isTyping}` | Wires focus→keyboard and key handling. |
| `Kit.makeSnack(snack[, ms])` → `{show(msg[, onAction, label]), hide()}` | Snackbar controller. |
| `Kit.makeOverlays(scrim)` → `{open(el), close(el), closeAll(), isOpen(el)}` | Coordinates the shared scrim with any `.open` overlay. |
| `Kit.edgeBack(device, hint, onCommit(side)[, {edge,commit}])` | Android-style edge back-swipe. |
| `Kit.autoHideBar(scroller, bar)` | Hide the bar on scroll-down, reveal on the slightest scroll-up. |
| `Kit.applyFontSize(device, px[, label])` | Set `--font` (text-size control); updates optional label. |

---

## Starting a new app

1. Copy `device-kit.css`, `device-kit.js`, and `base.html` into the project.
2. Rename `base.html` (e.g. `index.html`) and build your screen inside `#content`.
3. Reuse the component markup above; add app screens as `.panel`s or `.sheet`s.
4. Wire interactions through `Kit`. Keep to the **Hard rules**.
5. Verify with the preview tools (pointer-driven; check console for errors).

### What goes where
- **App-specific** markup/logic → the app's own HTML file.
- **Reusable** styles or behaviors used by more than one app → promote into
  `device-kit.css` / `device-kit.js`, then document the new class/API here.

Keep this file in sync when the system changes — it is the contract other
instances read instead of the source.
