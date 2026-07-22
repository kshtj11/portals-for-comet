/* =====================================================================
   DEVICE KIT — runtime (Pointer Events only)
   Exposes a single global: window.Kit
   Pair with device-kit.css. See DEVICE-KIT.md.

   POINTER RULES (enforced throughout):
   - Use only pointerdown/move/up/cancel. Never mix in mouse* / touch*.
   - Capture the pointer ONLY after a movement threshold (~4px) so a tap
     still reaches child buttons; release on up/cancel.
   - Swallow the click that immediately follows a real drag.
   - This makes touch the target while letting a desktop mouse emulate it
     with the same feel.
   ===================================================================== */
(function (global) {
  "use strict";

  const DRAG_THRESHOLD = 4;

  /* ---------- Mouse drag-to-scroll (touch uses native momentum) ---------- */
  function dragScroll(el) {
    let down = false, capturing = false, startY = 0, startTop = 0, moved = false, pid = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;        // leave touch to native scroll
      down = true; capturing = false; moved = false;
      startY = e.clientY; startTop = el.scrollTop; pid = e.pointerId;
    });
    el.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dy = e.clientY - startY;
      if (!capturing) {
        if (Math.abs(dy) <= DRAG_THRESHOLD) return; // still a tap, not a drag
        capturing = true; moved = true;
        try { el.setPointerCapture(pid); } catch (_) {}
        el.style.cursor = 'grabbing';
      }
      el.scrollTop = startTop - dy;
    });
    const up = () => {
      if (!down) return;
      down = false;
      if (capturing) { try { el.releasePointerCapture(pid); } catch (_) {} }
      capturing = false; el.style.cursor = '';
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', (e) => {              // swallow the post-drag click
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);
  }

  /* ---------- Scroll fades — show top/bottom gradients on overflow ---------- */
  function bindFades(scroller, topEl, botEl) {
    const update = () => {
      topEl.classList.toggle('show', scroller.scrollTop > 2);
      botEl.classList.toggle('show',
        scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 2);
    };
    scroller.addEventListener('scroll', update, { passive: true });
    return update;   // call after rendering content / opening
  }

  /* ---------- Bottom-sheet drag-to-dismiss ---------- */
  function sheetDrag(handle, sheet, onDismiss, commit) {
    commit = commit || 120;
    let dragging = false, startY = 0, dy = 0, pid = null;
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; startY = e.clientY; dy = 0; pid = e.pointerId;
      sheet.style.transition = 'none'; try { handle.setPointerCapture(pid); } catch (_) {}
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      sheet.style.transform = 'translateY(' + dy + 'px)';
    });
    const end = () => {
      if (!dragging) return;
      dragging = false; sheet.style.transition = ''; sheet.style.transform = '';
      if (dy > commit && onDismiss) onDismiss();
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /* ---------- Pull-to-dismiss + scroll for a single region (touch & mouse) ----
     Used when a scroller doubles as a "pull down at the top to close" target.
     touch-action must be none on the element so we drive it ourselves.       */
  function pullScroll(el, onDismiss, commit) {
    commit = commit || 120;
    let sy = 0, startScroll = 0, pid = null, mode = null, pdy = 0, moved = false;
    const host = el.closest('.sheet') || el;
    el.addEventListener('pointerdown', (e) => {
      sy = e.clientY; startScroll = el.scrollTop; pid = e.pointerId; mode = null; pdy = 0; moved = false;
    });
    el.addEventListener('pointermove', (e) => {
      if (pid === null) return;
      const dy = e.clientY - sy;
      if (mode === null) {
        if (Math.abs(dy) <= DRAG_THRESHOLD) return;
        moved = true;
        mode = (dy > 0 && el.scrollTop <= 0) ? 'dismiss' : 'scroll';
        try { el.setPointerCapture(pid); } catch (_) {}
        if (mode === 'dismiss') host.style.transition = 'none';
      }
      e.preventDefault();
      if (mode === 'scroll') el.scrollTop = startScroll - dy;
      else { pdy = Math.max(0, dy); host.style.transform = 'translateY(' + pdy + 'px)'; }
    });
    const end = () => {
      if (pid === null) return;
      const m = mode, d = pdy;
      try { el.releasePointerCapture(pid); } catch (_) {}
      pid = null; mode = null; pdy = 0;
      if (m === 'dismiss') { host.style.transition = ''; host.style.transform = ''; if (d > commit && onDismiss) onDismiss(); }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  /* ---------- On-screen keyboard ---------- */
  function makeKeyboard(device, kbd) {
    let input = null, shiftOn = false;
    const TYPING = ['text', 'search', 'url', 'email', 'tel', 'password', 'number'];
    const isTyping = (el) => el && el.tagName === 'INPUT' && TYPING.includes(el.type || 'text');
    const refreshShift = () => kbd.classList.toggle('shift-on', shiftOn); // .kbd.shift-on

    function open(el) { input = el; device.classList.add('kbd-open'); }
    function close() { device.classList.remove('kbd-open'); input = null; shiftOn = false; refreshShift(); }

    // text fields auto-open the keyboard; non-text controls (sliders, etc.) don't
    device.addEventListener('focusin', (e) => { if (isTyping(e.target)) open(e.target); });
    device.addEventListener('focusout', (e) => {
      if (!isTyping(e.target)) return;
      setTimeout(() => { if (!isTyping(document.activeElement)) close(); }, 0);
    });

    function insert(t) {
      const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, s) + t + input.value.slice(e);
      const p = s + t.length; try { input.setSelectionRange(p, p); } catch (_) {}
      input.dispatchEvent(new Event('input'));
    }
    function del() {
      const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? input.value.length;
      if (s !== e) { input.value = input.value.slice(0, s) + input.value.slice(e); try { input.setSelectionRange(s, s); } catch (_) {} }
      else if (s > 0) { input.value = input.value.slice(0, s - 1) + input.value.slice(s); try { input.setSelectionRange(s - 1, s - 1); } catch (_) {} }
      input.dispatchEvent(new Event('input'));
    }

    kbd.addEventListener('pointerdown', (e) => { if (e.target.closest('.key')) e.preventDefault(); }); // keep focus
    kbd.addEventListener('click', (e) => {
      const k = e.target.closest('.key'); if (!k || !input) return;
      const v = k.getAttribute('data-k');
      if (v === 'shift') { shiftOn = !shiftOn; refreshShift(); return; }
      if (v === 'sym' || v === 'fn') return;              // visual only
      if (v === 'back') { del(); return; }
      if (v === 'enter') {
        const f = input.form;
        if (f) { if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true })); }
        input.blur(); close(); return;
      }
      let ch = (v === ' ') ? ' ' : v;
      if (shiftOn && ch.length === 1) ch = ch.toUpperCase();
      insert(ch);
      if (shiftOn) { shiftOn = false; refreshShift(); }
    });

    return { open, close, isTyping };
  }

  /* ---------- Snackbar / toast ---------- */
  function makeSnack(snack, msFn) {
    const msgEl = snack.querySelector('.snmsg');
    const actEl = snack.querySelector('.action');
    let timer = null, action = null, ms = msFn || 4500;
    function hide() { snack.classList.remove('show'); action = null; }
    function show(msg, onAction, label) {
      msgEl.textContent = msg;
      if (actEl) { actEl.style.display = onAction ? '' : 'none'; if (label) actEl.textContent = label; }
      action = onAction || null;
      snack.classList.add('show');
      clearTimeout(timer); timer = setTimeout(hide, ms);
    }
    if (actEl) actEl.addEventListener('click', () => { const f = action; hide(); if (f) f(); });
    return { show, hide };
  }

  /* ---------- Overlay manager — coordinates scrim + open/close ---------- */
  function makeOverlays(scrim) {
    const openSet = new Set();
    function open(el) { el.classList.add('open'); openSet.add(el); scrim.classList.add('open'); }
    function close(el) { el.classList.remove('open'); openSet.delete(el); if (!openSet.size) scrim.classList.remove('open'); }
    function closeAll() { openSet.forEach(el => el.classList.remove('open')); openSet.clear(); scrim.classList.remove('open'); }
    scrim.addEventListener('click', closeAll);
    return { open, close, closeAll, isOpen: (el) => openSet.has(el) };
  }

  /* ---------- Edge-swipe back gesture (left/right edge, Android-style) ----
     onCommit(side) fires when the swipe passes the commit threshold.        */
  function edgeBack(device, hint, onCommit, opts) {
    opts = opts || {};
    const EDGE = opts.edge || 24, COMMIT = opts.commit || 84;
    let st = null;
    const rect = () => device.getBoundingClientRect();
    device.addEventListener('pointerdown', (e) => {
      if (st) return;
      const r = rect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let side = null;
      if (x <= EDGE) side = 'left'; else if (x >= r.width - EDGE) side = 'right';
      if (!side) return;
      st = { side, startX: x, startY: y, pid: e.pointerId, inward: 0, gesturing: false, pending: true };
    }, true);
    device.addEventListener('pointermove', (e) => {
      if (!st) return;
      const r = rect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const dx = x - st.startX, dy = y - st.startY;
      const inward = st.side === 'left' ? dx : -dx;
      if (st.pending) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) { st = null; return; } // vertical -> scroll
        if (inward > 5 && Math.abs(dx) > Math.abs(dy)) {
          st.pending = false; st.gesturing = true;
          try { device.setPointerCapture(st.pid); } catch (_) {}
          hint.className = 'backhint' + (st.side === 'right' ? ' right' : '');
        } else return;
      }
      e.preventDefault();
      st.inward = Math.max(0, inward);
      const reveal = Math.min(st.inward * 0.62, 54);
      if (st.side === 'left') hint.style.left = (-44 + reveal) + 'px';
      else hint.style.right = (-44 + reveal) + 'px';
      hint.style.top = Math.max(8, Math.min(r.height - 66, y - 29)) + 'px';
      hint.style.opacity = Math.min(1, st.inward / 22);
      hint.classList.toggle('committed', st.inward >= COMMIT);
    }, true);
    const up = () => {
      if (!st) return;
      const commit = st.gesturing && st.inward >= COMMIT, side = st.side;
      try { device.releasePointerCapture(st.pid); } catch (_) {}
      hint.style.opacity = '0'; hint.style.left = ''; hint.style.right = '';
      hint.classList.remove('committed'); st = null;
      if (commit && onCommit) onCommit(side);
    };
    device.addEventListener('pointerup', up, true);
    device.addEventListener('pointercancel', up, true);
  }

  /* ---------- Scroll-to-hide a bar ---------- */
  function autoHideBar(scroller, bar) {
    let last = 0;
    scroller.addEventListener('scroll', () => {
      const y = scroller.scrollTop;
      if (y <= 4) { bar.classList.remove('hidden'); last = y; return; }
      const dy = y - last;
      if (dy > 6 && y > 60) bar.classList.add('hidden');   // committed down -> hide
      else if (dy < -2) bar.classList.remove('hidden');    // slightest up -> show
      last = y;
    }, { passive: true });
  }

  /* ---------- Text-size control — drives --font on the device ---------- */
  function applyFontSize(device, px, label) {
    device.style.setProperty('--font', px + 'px');
    if (label) label.textContent = px + ' pt';
  }

  global.Kit = {
    DRAG_THRESHOLD,
    dragScroll, bindFades, sheetDrag, pullScroll,
    makeKeyboard, makeSnack, makeOverlays, edgeBack, autoHideBar, applyFontSize
  };
})(window);
