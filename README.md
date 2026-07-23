# Portals for Comet

Handheld web prototypes of the **XDG desktop portals**, adapted for the Comet
Linux handheld (540 × 620, touch + gamepad + keyboard extension).

The prototype is a single, self-contained `index.html` — the **device-kit**
design system is inlined into it, so it has zero dependencies and opens straight
over `file://` or any static server. No build step.

## Structure

| Path | What it is |
|---|---|
| `index.html` | **The prototype.** All seven portals in one self-contained file (device-kit inlined), switched by the rolling navigator. |
| `device-kit/` | The standalone device-kit — the modular source & component reference the prototype was built from. Read `DEVICE-KIT.md` for the design contract. |
| `device-kit/showcase.html` | One canonical instance of every kit component. |
| `server.js` | Tiny local static-preview helper (not part of the design). |

## Running

Open `index.html` directly in a browser, **or** serve locally:

```bash
node server.js       # → http://localhost:8777/
```

## The rolling navigator

The top-center pill shows the current portal number. **Tap** to advance to the
next portal (cycles through all eight); **long-press** for a named menu to jump
directly.

| # | Portal | Notes |
|---|---|---|
| 1 | **Open File** (7.1) | Breadcrumb + large-target list; the top bar names the action + requesting app. Tapping a file returns it to the app. |
| 2 | **Save File** (7.1) | The same chooser with a pinned filename field and a Save bar. |
| 3 | **Access** (7.2) | polkit-style elevated action — the auth card rises into the top half and the keyboard auto-opens. |
| 4 | **Wi-Fi Connect** (7.3) | Modal connect dialog with the full state machine: typing → connecting → success / wrong-password / network-error. Show/hide toggle, Connect disabled until valid (8-char WPA2 min), "Connect automatically". |
| 5 | **Bluetooth Pairing** (7.4) | Apple-style 4-digit passkey; waiting state + an obvious timeout → retry. |
| 6 | **App Chooser** (7.5) | "Open with" modal — searchable app grid + "Always use this app". Triggered by opening a file in the File Manager mockup. |
| 7 | **Share** (7.6) | Mobile-style bottom share sheet — file preview, quick actions, a drag-scrollable "Send to" row, and a KDE Connect device sheet. Triggered by long-pressing a file in the File Manager mockup. |
| 8 | **Permissions** (7.7) | App mockup (Comet Camera) → central permission dialog with three choices (While using / Allow / Don't allow) and a plain-English reason; safer option holds gamepad focus. Top-right button opens a full Android/iOS-style permissions page with per-app toggles + a permission manager. |

## Design rules

Neutral grayscale, elevation encoded as lightness, one functional hue, pointer-
events only, ≥44px touch targets, transform-driven motion. Full contract in
[`device-kit/DEVICE-KIT.md`](device-kit/DEVICE-KIT.md).
