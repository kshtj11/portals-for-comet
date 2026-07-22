# Portals for Comet

Handheld web prototypes of the **XDG desktop portals**, adapted for the Comet
Linux handheld (540 × 620, touch + gamepad + keyboard extension). Built on a
shared **device-kit** design system — single file, no build, opens over `file://`.

## Structure

| Path | What it is |
|---|---|
| `portals/index.html` | The prototype. All portals are rendered in one monolithic file, switched by the rolling navigator. |
| `device-kit/` | Shared design system (tokens, components, runtime). Provides the core UI behaviors like the keyboard, bottom sheets, drag-scrolling, and floating popups. |
| `device-kit/showcase.html` | One canonical instance of every kit component for reference. |
| `server.js` | Tiny local static-preview helper (not part of the design). |

## Running

Open `portals/index.html` directly in a browser, **or** serve locally:

```bash
node server.js       # → http://localhost:8777/portals/index.html
```

## The rolling navigator

Top-center pill shows the current portal number. **Tap** to advance to the next
portal; **long-press** for a named menu to jump directly.

| # | Portal | Notes |
|---|---|---|
| 1 | **Open File** (7.1) | Breadcrumb + large-target list; top bar names the action + requesting app. Clicking a file returns it to the app. |
| 2 | **Save File** (7.1) | Same chooser with a pinned filename field + Save bar at the bottom. |
| 3 | **Access** (7.2) | polkit-style elevated action — auth card rises into the top half, keyboard auto-opens. |
| 4 | **Wi-Fi Connect** (7.3) | Inline password entry expands at the tapped network; Connect disabled until valid. |
| 5 | **Bluetooth Pairing** (7.4) | Apple-style 4-digit passkey; waiting + obvious timeout → retry. |
| 6 | **App Chooser** (7.5) | Choose which app handles a file type. (Triggered natively by clicking a file in the View 6 mockup). |
| 7 | **Share Portal** (7.6) | Native mobile-style share sheet. (Triggered via long-press context menu on a file in View 7). |

## Design rules

Neutral grayscale, elevation encoded as lightness, one functional hue, pointer-
events only, ≥44px touch targets, transform-driven motion. Full contract in
[`device-kit/DEVICE-KIT.md`](../device-kit/DEVICE-KIT.md).
