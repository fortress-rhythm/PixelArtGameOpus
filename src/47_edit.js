// @ts-check
// =================================================================== EDIT MODE (?edit=1, or F2 in play)
// Shows a room's hidden geometry and lets you drag it, then copies the changed definition lines.
//   handles   hotspot stand point (at, yellow) and object point (pos, cyan), lights (amber), room start (white),
//             corners of walk areas (green) and blocked areas (red)
//   drag      left button; positions snap to 0.05 m (hold Shift for 0.01 m)
//   wheel     over a light: radius; with Shift: height
//   C         copy the changed lines to the clipboard (also logged to the console)
//   G         toggle the walk grid      F2  leave edit mode
// Walk and block edits rebuild the walk grid at once; light edits re-bake the room when you let go.
const EDIT = {
  on: new URLSearchParams(location.search).get('edit') === '1',
  grid: false, drag: null, hover: null, changed: new Map(), msg: '', msgT: 0, bakeT: 0, off: [0, 0]
};
function editSnap(v, fine) { const s = fine ? 0.01 : 0.05; return Math.round(v / s) * s; }
function editFmt(v) { return +v.toFixed(3); }
function editList(o) { return JSON.stringify(o).replace(/,/g, ', '); }

// every draggable point of the current room: {kind, label, get() -> [x, y, z], set(x, y), key, owner}
function editHandles() {
  const r = room, out = [];
  if (!r) return out;
  if (r.start) out.push({ kind: 'start', label: 'start', key: 'start', get: () => [r.start[0], r.start[1], 0],
    set: (x, y) => { r.start[0] = x; r.start[1] = y; } });
  for (const hs of r.hotspots) {
    if (hs.at) out.push({ kind: 'at', label: hs.id + ' at', key: 'hs:' + hs.id, owner: hs, get: () => [hs.at[0], hs.at[1], 0],
      set: (x, y) => { hs.at = [x, y]; } });
    if (hs.pos) out.push({ kind: 'pos', label: hs.id + ' pos', key: 'hs:' + hs.id, owner: hs, get: () => [hs.pos[0], hs.pos[1], 0],
      set: (x, y) => { hs.pos = [x, y]; } });
  }
  (r.lights || []).forEach((L, i) => {
    if (L.slat) return;
    out.push({ kind: 'light', label: 'light ' + i, key: 'lights', light: L, get: () => [L.x, L.y, L.z], set: (x, y) => { L.x = x; L.y = y; } });
  });
  for (const [name, list] of [['walk', r.walk || []], ['block', r.block || []]]) list.forEach((b, i) => {
    out.push({ kind: name, label: name + ' ' + i + ' min', key: name, get: () => [b[0], b[1], 0], set: (x, y) => { b[0] = Math.min(x, b[2] - 0.05); b[1] = Math.min(y, b[3] - 0.05); } });
    out.push({ kind: name, label: name + ' ' + i + ' max', key: name, get: () => [b[2], b[3], 0], set: (x, y) => { b[2] = Math.max(x, b[0] + 0.05); b[3] = Math.max(y, b[1] + 0.05); } });
  });
  return out;
}
function editScreenOf(h) { const p = h.get(); return [toScreenX(p[0], p[1]), toScreenY(p[0], p[1], h.kind === 'light' ? p[2] : 0)]; }
function editHandleAt(mx, my) {
  let best = null, bd = 25;
  for (const h of editHandles()) { const s = editScreenOf(h), d = (s[0] - mx) ** 2 + (s[1] - my) ** 2; if (d < bd) { bd = d; best = h; } }
  return best;
}
function editMark(h) { EDIT.changed.set(room.id + '|' + h.key, { room: room.id, key: h.key, owner: h.owner }); }

// the floor point under the mouse; lights are dragged at their own height, so undo that offset first
function editFloorAt(h) { return screenToFloor(UI.mx, UI.my + (h.kind === 'light' ? h.get()[2] * ZH : 0)); }

// ------------------------------------------------------------------ input (called first by the handlers in 90_main)
function editMouse(type, e) {
  if (!EDIT.on || G.mode !== 'play') return false;
  if (type === 'down') {
    if (e.button !== 0) return false;
    const h = editHandleAt(UI.mx, UI.my);
    if (!h) return false;
    // keep the grab offset, so picking a point up without moving it changes nothing
    const p = h.get(), f = editFloorAt(h);
    EDIT.drag = h; EDIT.off = [p[0] - f[0], p[1] - f[1]]; return true;
  }
  if (type === 'move') {
    EDIT.hover = EDIT.drag || editHandleAt(UI.mx, UI.my);
    if (!EDIT.drag) return false;
    const h = EDIT.drag, f = editFloorAt(h);
    h.set(editFmt(editSnap(f[0] + EDIT.off[0], e.shiftKey)), editFmt(editSnap(f[1] + EDIT.off[1], e.shiftKey)));
    editMark(h);
    if (h.kind === 'walk' || h.kind === 'block') buildGrid(room);
    return true;
  }
  if (type === 'up') {
    const h = EDIT.drag; EDIT.drag = null;
    if (h && h.kind === 'light') editRebake();
    return !!h;
  }
  if (type === 'wheel') {
    const h = editHandleAt(UI.mx, UI.my);
    if (!h || h.kind !== 'light') return false;
    const L = h.light, d = e.deltaY < 0 ? 1 : -1;
    if (e.shiftKey) L.z = editFmt(Math.max(0, L.z + d * 0.05)); else L.r = editFmt(Math.max(0.2, L.r + d * 0.1));
    editMark(h); window.clearTimeout(EDIT.bakeT); EDIT.bakeT = window.setTimeout(editRebake, 250);
    return true;
  }
  return false;
}
function editKey(k) {
  if (k === 'f2') { EDIT.on = !EDIT.on; EDIT.drag = null; return true; }
  if (!EDIT.on || G.mode !== 'play') return false;
  if (k === 'c') { editCopy(); return true; }
  if (k === 'g') { EDIT.grid = !EDIT.grid; return true; }
  return false;
}
function editRebake() { room.rb = null; buildRoomBuffer(room); }

// ------------------------------------------------------------------ the copied text: one block per changed thing, ready to paste over
function editSnippet() {
  const out = [];
  for (const c of EDIT.changed.values()) {
    const r = ROOMS[c.room];
    out.push('// ' + c.room + ' (' + r.name + ')');
    if (c.key === 'start') out.push('start: ' + editList(r.start) + ',');
    else if (c.key.startsWith('hs:')) {
      const hs = c.owner, parts = [];
      if (hs.at) parts.push('at: ' + editList(hs.at.map(editFmt)));
      if (hs.pos) parts.push('pos: ' + editList(hs.pos.map(editFmt)));
      out.push("{ id: '" + hs.id + "', ..., " + parts.join(', ') + ', ... }');
    } else if (c.key === 'lights') {
      out.push('lights: [');
      for (const L of r.lights) {
        const o = Object.keys(L).map(k => k + ': ' + (typeof L[k] === 'string' ? "'" + L[k] + "'" : typeof L[k] === 'number' ? editFmt(L[k]) : k === 'map' ? '/* map */' : JSON.stringify(L[k])));
        out.push('  { ' + o.join(', ') + ' },');
      }
      out.push('],');
    } else out.push(c.key + ': ' + editList(r[c.key].map(b => b.map(editFmt))) + ',');
  }
  return out.join('\n');
}
function editCopy() {
  if (!EDIT.changed.size) { editSay('Nothing changed yet.'); return; }
  const text = editSnippet();
  console.log(text);
  const done = () => editSay('Copied ' + EDIT.changed.size + ' change(s). Also in the console.');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => editSay('Clipboard blocked: see the console.'));
  else editSay('No clipboard here: see the console.');
}
function editSay(m) { EDIT.msg = m; EDIT.msgT = 180; }

// ------------------------------------------------------------------ drawing (after the room and actors, before the UI)
const EDIT_COL = { start: C.WHITE, at: C.PALEY, pos: C.CYAN, light: C.GLOW, walk: C.GRNL, block: C.RED };
function editLine3(xa, ya, za, xb, yb, zb, c, dotted) {
  const sxa = toScreenX(xa, ya), sya = toScreenY(xa, ya, za), sxb = toScreenX(xb, yb), syb = toScreenY(xb, yb, zb);
  const n = Math.max(1, Math.abs(sxb - sxa), Math.abs(syb - sya));
  for (let k = 0; k <= n; k++) if (!dotted || (k & 1)) pset(Math.round(lerp(sxa, sxb, k / n)), Math.round(lerp(sya, syb, k / n)), c);
}
function editRect(b, c) {
  editLine3(b[0], b[1], 0, b[2], b[1], 0, c); editLine3(b[2], b[1], 0, b[2], b[3], 0, c);
  editLine3(b[2], b[3], 0, b[0], b[3], 0, c); editLine3(b[0], b[3], 0, b[0], b[1], 0, c);
}
function editDraw() {
  if (!EDIT.on || G.mode !== 'play' || !room) return;
  if (EDIT.grid) { const gr = room.grid; for (let j = 0; j < gr.gh; j++) for (let i = 0; i < gr.gw; i++) if (gr.g[j * gr.gw + i]) { const x = gr.x0 + (i + 0.5) * GRID, y = gr.y0 + (j + 0.5) * GRID; pset(toScreenX(x, y), toScreenY(x, y, 0), C.G2); } }
  for (const b of room.walk || []) editRect(b, C.GRNL);
  for (const b of room.block || []) editRect(b, C.RED);
  for (const L of room.lights || []) {
    if (L.slat) continue;
    editLine3(L.x, L.y, 0, L.x, L.y, L.z, C.GLOW, true);
    for (let k = 0; k < 32; k++) { const a = k / 32 * TAU; pset(toScreenX(L.x + Math.cos(a) * L.r, L.y + Math.sin(a) * L.r), toScreenY(L.x + Math.cos(a) * L.r, L.y + Math.sin(a) * L.r, 0), C.AMB); }
  }
  for (const hs of room.hotspots) if (hs.at && hs.pos) editLine3(hs.at[0], hs.at[1], 0, hs.pos[0], hs.pos[1], 0, C.SLT, true);
  for (const h of editHandles()) {
    const [sx, sy] = editScreenOf(h), c = EDIT_COL[h.kind], big = h === EDIT.hover;
    if (h.kind === 'walk' || h.kind === 'block') { fillRect(sx - 1, sy - 1, 3, 3, c); continue; }
    pset(sx, sy, c); pset(sx - 1, sy, c); pset(sx + 1, sy, c); pset(sx, sy - 1, c); pset(sx, sy + 1, c);
    if (big) rectOutline(sx - 3, sy - 3, 7, 7, c);
  }
  // readout: the floor point under the mouse, the hovered handle, changes waiting to be copied
  const f = screenToFloor(UI.mx, UI.my);
  let top = room.id + '  x ' + f[0].toFixed(2) + '  y ' + f[1].toFixed(2);
  if (EDIT.hover) { const p = EDIT.hover.get(); top += '   ' + EDIT.hover.label + ' [' + p.map(v => v.toFixed(2)).join(', ') + ']' + (EDIT.hover.light ? ' r ' + EDIT.hover.light.r.toFixed(1) : ''); }
  fillRect(0, 0, W, 9, C.INK); drawText(top, 2, 1, C.PALEY);
  const bottom = EDIT.msgT > 0 ? EDIT.msg : 'EDIT  drag points   wheel: light r (Shift: z)   C copy (' + EDIT.changed.size + ')   G grid   F2 off';
  if (EDIT.msgT > 0) EDIT.msgT--;
  fillRect(0, H - 9, W, 9, C.INK); drawText(bottom, 2, H - 8, EDIT.msgT > 0 ? C.GLOW : C.CRS);
}
window.__edit = { EDIT, snippet: editSnippet, handles: editHandles };
