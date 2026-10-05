// =================================================================== CHARACTER EDITOR
// Edits one CAST_DEFS entry and shows what the game will draw from it: the doll in four directions, walking and
// talking, under venetian-blind light, its portrait in every expression, and its silhouette against the cast.
// The drawing code is the game's own (01_core, 03_iso, 04_people, 13_portraits are built into this page), so
// what you see here is what you get. "Copy definition" gives the line to paste into src/04_people.js.

// ------------------------------------------------------------------ what can be edited
const SLOT_INFO = { C: 'garment', c: 'garment shadow', K: 'garment light', T: 'trousers / skirt', t: 'trousers shadow', W: 'shirt', N: 'tie',
  B: 'belt', k: 'buckle', F: 'shoes', H: 'hat', h: 'hat shadow', b: 'hat band', S: 'skin', s: 'skin shadow', L: 'skin light',
  A: 'hair', a: 'hair light', e: 'eyes', m: 'mouth / lips', G: 'gloves', X: 'buttons, badge', Y: 'glasses', V: 'scarf, flower', P: 'cane, bag, case', o: 'outline' };
const BODY = ['coat', 'long', 'suit', 'vest', 'skirt', 'dress'];
const HATS = ['none', 'fedora', 'homburg', 'bowler', 'cloche', 'newsboy', 'beret', 'cap', 'doorman', 'pillbox'];
const HAIR = ['short', 'slick', 'bob', 'bun', 'bald', 'long', 'curly', 'pomp'];
const IDLE = ['', 'pockets', 'crossed', 'hips', 'smoke'];
const SIGS = ['glasses', 'moustache', 'beard', 'scarf', 'flower', 'badge', 'satchel', 'cane', 'case'];
const SLIDERS = [   // [field, label, min, max, step, default]
  ['h', 'height', 24, 36, 1, 30], ['neck', 'neck', 0, 2, 1, 0], ['shoulders', 'shoulders', -1, 2, 1, 0], ['belly', 'belly', 0, 2, 1, 0],
  ['flare', 'coat flare', 0, 3, 0.1, 1.4], ['stance', 'stance', 0, 2, 1, 0], ['lean', 'lean', -1, 1, 1, 0],
  ['stride', 'stride', 0.5, 1.8, 0.1, 1], ['bounce', 'bounce', 0, 2, 1, 1]];
const FACE = [      // portrait only: [field, label, min, max, step]
  ['faceW', 'face width', 9, 14, 1], ['jawW', 'chin width', 2, 11, 1], ['noseLen', 'nose', 4, 8, 1], ['eyeGap', 'eye spacing', 4, 7, 1], ['brow', 'brow', 1, 2, 1]];
const FACE_FLAGS = ['lips', 'lines', 'stubble', 'freckles'];
const CNAME = []; for (const k in C) CNAME[C[k]] = k;      // palette index -> C.NAME
const DEFAULT_KEY = costume({});

// original example characters (not the game's cast): starting points that show what the options do
const EXAMPLES = {
  undertaker: { h: 34, body: 'long', hat: 'homburg', hair: 'short', name: 'Undertaker', neck: 1, shoulders: 1, lean: -1, idle: 'crossed', sig: ['moustache'], face: { faceW: 10, jaw: 'point', jawW: 3, noseLen: 8, lines: true }, key: { C: C.INK, c: C.BLK, K: C.ST0, H: C.INK, h: C.BLK, b: C.OX } },
  sergeant: { h: 28, body: 'suit', hat: 'bowler', hair: 'short', name: 'Desk sergeant', wide: 1, belly: 2, stance: 1, idle: 'hips', sig: ['badge'], face: { faceW: 14, jawW: 10 }, key: { C: C.BRN, c: C.DBR, K: C.TAN, H: C.INK, h: C.BLK } },
  singer: { h: 29, body: 'dress', hat: 'cloche', hair: 'bob', name: 'Torch singer', flare: 2.5, idle: 'smoke', sig: ['flower'], face: { faceW: 11, jaw: 'round', jawW: 4, lips: true }, key: { C: C.CRIM, c: C.OX, K: C.CORAL, H: C.INK, h: C.BLK, b: C.BRASS, V: C.CREAM, m: C.CRIM } },
  paperboy: { h: 27, body: 'coat', hat: 'newsboy', hair: 'short', name: 'Paperboy', shoulders: -1, lean: 1, stride: 1.4, bounce: 2, idle: 'pockets', sig: ['scarf', 'satchel'], face: { faceW: 11, jaw: 'round', jawW: 5, freckles: true }, key: { C: C.G1, c: C.G0, K: C.G2, H: C.ST1, h: C.ST0, V: C.CRIM } },
  professor: { h: 33, body: 'suit', hat: 'none', hair: 'curly', name: 'Professor', neck: 2, stride: 0.8, sig: ['glasses', 'case'], face: { faceW: 11, noseLen: 7, eyeGap: 5 }, key: { C: C.CREAM, c: C.CRS, K: C.WHITE, A: C.INK, S: C.DSM, s: C.DSS, L: C.SKM } },
  painter: { h: 27, body: 'skirt', hat: 'beret', hair: 'long', name: 'Painter', idle: 'hips', sig: ['scarf'], face: { faceW: 11, jaw: 'round', jawW: 4 }, key: { C: C.LAV, c: C.VIO, K: C.WHITE, H: C.RED, h: C.CRIM, A: C.HAIRL, V: C.PALEY } },
  colonel: { h: 30, body: 'coat', hat: 'none', hair: 'pomp', name: 'Old colonel', stance: 2, stride: 0.7, sig: ['cane', 'beard'], face: { faceW: 12, jawW: 7, lines: true }, key: { C: C.ST1, c: C.ST0, K: C.ST2, A: C.CRS, a: C.S2 } }
};

// ------------------------------------------------------------------ state
let cur = null, curId = 'newcharacter', expr = 'neutral', talkOn = true, pickSlot = null;
const DRAFTS_KEY = 'hourglass_character_drafts';
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function load(id, def) {
  curId = id;
  cur = clone(Object.assign({ h: 30, body: 'suit', hat: 'none', hair: 'short' }, def));
  cur.key = Object.assign({}, DEFAULT_KEY, def.key || {});
  cur.sig = (def.sig || []).slice(); cur.face = Object.assign({}, def.face || {});
  if (!cur.name) cur.name = id;
  buildSide(); redraw();
}
function defForGame() {
  const d = clone(cur);
  if (!d.sig.length) delete d.sig;
  if (!d.idle) delete d.idle;
  return d;
}

// ------------------------------------------------------------------ the definition as source text
function fmtVal(k, v) {
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return "'" + v.replace(/'/g, "\\'") + "'";
  if (Array.isArray(v)) return '[' + v.map(x => fmtVal('', x)).join(', ') + ']';
  return String(+(+v).toFixed(2));
}
function sourceText() {
  const d = cur, parts = [];
  parts.push('h: ' + d.h, "body: '" + d.body + "'", "hat: '" + d.hat + "'", "hair: '" + d.hair + "'");
  parts.push('color: C.' + (CNAME[d.color] || 'CREAM'), "name: " + fmtVal('', d.name || curId));
  const face = Object.keys(d.face).filter(k => d.face[k] !== undefined && d.face[k] !== false);
  if (face.length) parts.push('face: { ' + face.map(k => k + ': ' + fmtVal(k, d.face[k])).join(', ') + ' }');
  if (d.wide) parts.push('wide: 1');
  for (const [f, , , , , def] of SLIDERS) if (f !== 'h' && d[f] !== undefined && d[f] !== def) parts.push(f + ': ' + fmtVal(f, d[f]));
  if (d.idle) parts.push("idle: '" + d.idle + "'");
  if (d.sig.length) parts.push('sig: ' + fmtVal('', d.sig));
  const key = Object.keys(d.key).filter(k => d.key[k] !== DEFAULT_KEY[k]).map(k => k + ': C.' + CNAME[d.key[k]]);
  parts.push('key: costume({ ' + key.join(', ') + ' })');
  // wrap like the game's own definitions: about 120 characters a line
  const lines = []; let line = '  ' + curId + ': { ';
  for (let i = 0; i < parts.length; i++) {
    const piece = parts[i] + (i < parts.length - 1 ? ', ' : ' },');
    if (line.length + piece.length > 120 && line.trim().length > curId.length + 4) { lines.push(line.trimEnd()); line = '           '; }
    line += piece;
  }
  lines.push(line);
  return withArt(lines.join('\n'));
}
// hand-drawn parts go last, one row per line, so they diff well and can be read as pictures
function withArt(text) {
  const a = cur.art; if (!a || (!a.head && !a.portrait)) return text;
  const ind = '           ', out = [];
  if (a.head) out.push(ind + '  head: { ' + Object.keys(a.head).map(v => v + ': ' + artRowsSource(a.head[v], ind + '    ')).join(', ') + ' },');
  if (a.portrait) out.push(ind + '  portrait: {\n' + Object.keys(a.portrait).map(e => ind + '    ' + e + ': ' + artRowsSource(a.portrait[e], ind + '    ')).join(',\n') + '\n' + ind + '  },');
  if (a.colours && Object.keys(a.colours).length) out.push(ind + '  colours: ' + artColoursSource(a.colours, CNAME));
  return text.replace(/ \},$/, ',') + '\n' + ind + 'art: {\n' + out.join('\n').replace(/,$/, '') + '\n' + ind + '} },';
}

// ------------------------------------------------------------------ controls
function el(tag, attrs, kids) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) { if (k === 'text') e.textContent = attrs[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
  for (const c of kids || []) e.appendChild(c);
  return e;
}
function selectRow(label, id, options, value, onChange) {
  const s = el('select', { id, onchange: () => onChange(s.value) }, options.map(o => el('option', { value: o, text: o || '(none)' })));
  s.value = value;
  return el('div', { class: 'row' }, [el('label', { for: id, text: label }), s, el('span')]);
}
function sliderRow(label, id, min, max, step, value, onChange) {
  const out = el('output', { text: String(value) });
  const r = el('input', { type: 'range', id, min, max, step, value, oninput: () => { out.textContent = r.value; onChange(+r.value); } });
  return el('div', { class: 'row' }, [el('label', { for: id, text: label }), r, out]);
}
function buildSide() {
  const side = document.getElementById('side'); side.textContent = '';
  side.appendChild(el('h1', { text: 'Character editor' }));
  // start from
  // Act I's cast is listed last and marked: its designs are © Odiriuss, so they are for study and comparison only
  const starts = [''].concat(Object.keys(EXAMPLES).map(k => 'example:' + k), Object.keys(drafts()).map(k => 'draft:' + k), Object.keys(CAST_DEFS).map(k => 'cast:' + k));
  const sel = selectRow('start from', 'start', starts, '', v => {
    if (!v) return; const [kind, id] = v.split(':');
    load(id, kind === 'cast' ? CAST_DEFS[id] : kind === 'example' ? EXAMPLES[id] : drafts()[id]);
    if (kind === 'cast') toast('Act I cast: © Odiriuss. Study it, but start your own characters from an example.');
  });
  for (const o of sel.querySelectorAll('option')) if (o.value.startsWith('cast:')) o.textContent = o.value + ' (Act I, © Odiriuss: reference only)';
  side.appendChild(sel);
  const idIn = el('input', { type: 'text', id: 'cid', value: curId, oninput: () => { curId = idIn.value.replace(/\W/g, '') || 'newcharacter'; redraw(); } });
  side.appendChild(el('div', { class: 'row' }, [el('label', { for: 'cid', text: 'id' }), idIn, el('span')]));
  const nm = el('input', { type: 'text', id: 'cname', value: cur.name || '', oninput: () => { cur.name = nm.value; redraw(); } });
  side.appendChild(el('div', { class: 'row' }, [el('label', { for: 'cname', text: 'name' }), nm, el('span')]));

  side.appendChild(el('h2', { text: 'Silhouette' }));
  side.appendChild(selectRow('body', 'body', BODY, cur.body, v => { cur.body = v; redraw(); }));
  side.appendChild(selectRow('hat', 'hat', HATS, cur.hat, v => { cur.hat = v; redraw(); }));
  side.appendChild(selectRow('hair', 'hair', HAIR, cur.hair, v => { cur.hair = v; redraw(); }));
  side.appendChild(selectRow('stands', 'idle', IDLE, cur.idle || '', v => { cur.idle = v || undefined; redraw(); }));
  for (const [f, label, min, max, step, def] of SLIDERS) side.appendChild(sliderRow(label, 'f_' + f, min, max, step, cur[f] === undefined ? def : cur[f], v => { cur[f] = v; redraw(); }));
  const wide = el('input', { type: 'checkbox', id: 'wide', onchange: () => { cur.wide = wide.checked ? 1 : 0; redraw(); } }); wide.checked = !!cur.wide;
  side.appendChild(el('div', { class: 'checks' }, [el('label', {}, [wide, document.createTextNode('stocky (wide)')])]));

  side.appendChild(el('h2', { text: 'Signature features (doll and portrait)' }));
  side.appendChild(el('div', { class: 'checks' }, SIGS.map(s => {
    const c = el('input', { type: 'checkbox', onchange: () => { cur.sig = SIGS.filter(x => x === s ? c.checked : cur.sig.includes(x)); redraw(); } }); c.checked = cur.sig.includes(s);
    return el('label', {}, [c, document.createTextNode(s)]);
  })));

  side.appendChild(el('h2', { text: 'Face (portrait only)' }));
  const F = faceOf(defForGame());
  side.appendChild(selectRow('jaw', 'jaw', ['square', 'round', 'point'], cur.face.jaw || F.jaw, v => { cur.face.jaw = v; redraw(); }));
  for (const [f, label, min, max, step] of FACE) side.appendChild(sliderRow(label, 'p_' + f, min, max, step, cur.face[f] !== undefined ? cur.face[f] : F[f], v => { cur.face[f] = v; redraw(); }));
  side.appendChild(el('div', { class: 'checks' }, FACE_FLAGS.map(f => {
    const c = el('input', { type: 'checkbox', onchange: () => { cur.face[f] = c.checked; redraw(); } }); c.checked = !!F[f];
    return el('label', {}, [c, document.createTextNode(f)]);
  })));

  side.appendChild(el('h2', { text: 'Hand-drawn parts' }));
  side.appendChild(el('p', { class: 'note', text: 'PNGs drawn with the game palette (palettes/hourglass.gpl). A head replaces the generated one for that view (max 20×20, bottom row = chin); a portrait is 64×72 at most. Don\'t draw the outer outline: the game adds it.' }));
  const pe = el('select', { id: 'artexpr', 'aria-label': 'Portrait expression' }, PORTRAIT_EXPRS.flatMap(e => [e, e + '_talk']).map(e => el('option', { value: e, text: e })));
  side.appendChild(el('div', { class: 'btns' }, [
    el('button', { type: 'button', text: 'Head, front…', onclick: () => pickArt(['head', 'front'], 20, 20) }),
    el('button', { type: 'button', text: 'Head, back…', onclick: () => pickArt(['head', 'back'], 20, 20) })]));
  side.appendChild(el('div', { class: 'row' }, [el('button', { type: 'button', text: 'Portrait…', onclick: () => pickArt(['portrait', pe.value], PORTRAIT_W, PORTRAIT_H) }), pe, el('span')]));
  const parts = [];
  if (cur.art) for (const kind of ['head', 'portrait']) for (const v in cur.art[kind] || {}) parts.push([kind, v]);
  if (parts.length) side.appendChild(el('div', { class: 'btns' }, parts.map(([kind, v]) => el('button', { type: 'button', title: 'Remove', text: '✕ ' + kind + ' ' + v,
    onclick: () => { delete cur.art[kind][v]; if (!Object.keys(cur.art[kind]).length) delete cur.art[kind]; if (!cur.art.head && !cur.art.portrait) delete cur.art; buildSide(); redraw(); } }))));

  side.appendChild(el('h2', { text: 'Colours (click a slot, then a colour)' }));
  const slots = el('div', { class: 'slots' });
  for (const k in SLOT_INFO) slots.appendChild(el('button', { class: 'slot', type: 'button', 'aria-pressed': String(pickSlot === k), onclick: () => { pickSlot = pickSlot === k ? null : k; buildSide(); } },
    [el('span', { class: 'sw', style: 'background:#' + PAL_HEX[cur.key[k]] }), el('b', { text: k }), document.createTextNode(SLOT_INFO[k])]));
  const speak = el('button', { class: 'slot', type: 'button', 'aria-pressed': String(pickSlot === '$color'), onclick: () => { pickSlot = pickSlot === '$color' ? null : '$color'; buildSide(); } },
    [el('span', { class: 'sw', style: 'background:#' + PAL_HEX[cur.color === undefined ? C.CREAM : cur.color] }), el('b', { text: '"' }), document.createTextNode('speech colour')]);
  slots.appendChild(speak);
  side.appendChild(slots);
  if (pickSlot) {
    const pal = el('div', { class: 'palette', role: 'group', 'aria-label': 'Palette' });
    PAL_HEX.forEach((h, i) => pal.appendChild(el('button', { type: 'button', title: 'C.' + CNAME[i], style: 'background:#' + h, 'aria-label': 'C.' + CNAME[i],
      onclick: () => { if (pickSlot === '$color') cur.color = i; else cur.key[pickSlot] = i; buildSide(); redraw(); } })));
    side.appendChild(pal);
  }
}

// ------------------------------------------------------------------ previews
const VIEW = {};
function card(title, id, note, wide) {
  const c = el('section', { class: 'card' + (wide ? ' wide' : '') }, [el('h2', { text: title }), el('div', { class: 'stage', id })]);
  if (note) c.appendChild(el('p', { class: 'note', text: note }));
  return c;
}
function canvas(parent, w, h, scale) { const cv = el('canvas', { width: w, height: h }); cv.style.width = (w * scale) + 'px'; parent.appendChild(cv); return cv; }
function buildMain() {
  const main = document.getElementById('main');
  main.appendChild(card('Doll: SE · SW · NE · NW', 'dirs', 'SW and NW are mirror images of SE and NE, as in the game.'));
  main.appendChild(card('Walking and talking', 'walk', 'Walk cycle front and back, then the talking gesture.'));
  main.appendChild(card('Under the blinds', 'light', 'Lit row by row with the game\'s own light steps, as slatted light sweeps across.'));
  const pc = card('Portrait', 'portrait');
  const btns = el('div', { class: 'btns', role: 'group', 'aria-label': 'Expression' });
  for (const e of PORTRAIT_EXPRS) btns.appendChild(el('button', { type: 'button', 'aria-pressed': String(e === expr), text: e, onclick: (ev) => { expr = e; for (const b of btns.children) b.setAttribute('aria-pressed', String(b === ev.target)); redraw(); } }));
  const talk = el('button', { type: 'button', 'aria-pressed': 'true', text: 'talking', onclick: () => { talkOn = !talkOn; talk.setAttribute('aria-pressed', String(talkOn)); } });
  btns.appendChild(talk); pc.appendChild(btns); main.appendChild(pc);
  main.appendChild(card('Silhouette against the cast', 'lineup', 'Top: solid black, the way a figure reads across a dark room. If you can still tell this one (left, outlined) from everyone else, the silhouette works. Bottom: the same in colour.', true));
  const ex = el('section', { class: 'card wide' }, [el('h2', { text: 'Definition for src/04_people.js' })]);
  const ta = el('textarea', { id: 'code', spellcheck: 'false', 'aria-label': 'Definition source' }); ex.appendChild(ta);
  ex.appendChild(el('div', { class: 'btns' }, [
    el('button', { type: 'button', text: 'Copy definition', onclick: copyCode }),
    el('button', { type: 'button', text: 'Save draft', onclick: saveDraft }),
    el('button', { type: 'button', text: 'Load from the text above', onclick: loadFromText })]));
  ex.appendChild(el('p', { class: 'note', text: 'Paste the copied line into CAST_DEFS in src/04_people.js, then rebuild. "Load from the text above" reads a definition you pasted in (one CAST_DEFS entry). Drafts stay in this browser only.' }));
  main.appendChild(ex);
  VIEW.dirs = canvas(document.getElementById('dirs'), SPR_W * 4 + 18, SPR_H, 4);
  VIEW.walk = canvas(document.getElementById('walk'), SPR_W * 3 + 12, SPR_H, 4);
  VIEW.light = canvas(document.getElementById('light'), 96, SPR_H + 6, 4);
  VIEW.portrait = canvas(document.getElementById('portrait'), PORTRAIT_W, PORTRAIT_H, 4);
  const n = Object.keys(CAST_DEFS).length + 1;
  VIEW.lineup = canvas(document.getElementById('lineup'), n * (SPR_W - 6), SPR_H * 2 + 4, 3);
}

// ------------------------------------------------------------------ drawing into a canvas
function blitFrame(img, frame, fw, fh, ox, oy, opts) {
  const W = img.width, d = img.data;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    let c = frame[y * fw + (opts && opts.flip ? fw - 1 - x : x)]; if (c === T) continue;
    const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= W || Y >= img.height) continue;
    if (opts && opts.map) c = opts.map(c, x, y);
    const i = (Y * W + X) * 4, h = opts && opts.black ? '000000' : PAL_HEX[c];
    d[i] = parseInt(h.slice(0, 2), 16); d[i + 1] = parseInt(h.slice(2, 4), 16); d[i + 2] = parseInt(h.slice(4, 6), 16); d[i + 3] = 255;
  }
}
function clear(cv, hex) {
  const ctx = cv.getContext('2d'), img = ctx.createImageData(cv.width, cv.height);
  if (hex) for (let i = 0; i < img.data.length; i += 4) { img.data[i] = parseInt(hex.slice(0, 2), 16); img.data[i + 1] = parseInt(hex.slice(2, 4), 16); img.data[i + 2] = parseInt(hex.slice(4, 6), 16); img.data[i + 3] = 255; }
  return { ctx, img };
}
let person = null, castPeople = null;
function redraw() {
  try { person = buildPerson(defForGame()); } catch (e) { toast('Could not draw: ' + e.message); return; }
  for (const k in PCACHE) delete PCACHE[k];
  if (!castPeople) { castPeople = {}; for (const id in CAST_DEFS) castPeople[id] = buildPerson(CAST_DEFS[id]); }
  // lineup is static: draw it here; the rest animates
  const { ctx, img } = clear(VIEW.lineup, '1b1a2a'), step = SPR_W - 6;
  const all = [person].concat(Object.values(castPeople));
  all.forEach((P, i) => {
    blitFrame(img, P.front.idle[0], SPR_W, SPR_H, i * step - 3, 0, { black: true });
    blitFrame(img, P.front.idle[0], SPR_W, SPR_H, i * step - 3, SPR_H + 4);
  });
  for (let x = 0; x < step - 1; x++) for (const y of [0, SPR_H * 2 + 3]) { const q = (y * img.width + x) * 4; img.data[q] = 242; img.data[q + 1] = 184; img.data[q + 2] = 110; img.data[q + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  const code = document.getElementById('code'); if (code && document.activeElement !== code) code.value = sourceText();
}
function frameAt(t) {
  const P = person; if (!P) return;
  const tick = Math.floor(t / (1000 / 60));
  // four directions, idle breathing
  let v = clear(VIEW.dirs, '07060a'), idle = Math.floor(tick / 50) % 2;
  blitFrame(v.img, P.front.idle[idle], SPR_W, SPR_H, 0, 0);
  blitFrame(v.img, P.front.idle[idle], SPR_W, SPR_H, SPR_W + 6, 0, { flip: true });
  blitFrame(v.img, P.back.idle[idle], SPR_W, SPR_H, (SPR_W + 6) * 2, 0);
  blitFrame(v.img, P.back.idle[idle], SPR_W, SPR_H, (SPR_W + 6) * 3, 0, { flip: true });
  v.ctx.putImageData(v.img, 0, 0);
  // walk front, walk back, talk
  v = clear(VIEW.walk, '07060a'); const wf = Math.floor(t / 130) % 6, tf = Math.floor(tick / 7) % 2;
  blitFrame(v.img, P.front.walk[wf], SPR_W, SPR_H, 0, 0);
  blitFrame(v.img, P.back.walk[wf], SPR_W, SPR_H, SPR_W + 6, 0);
  blitFrame(v.img, P.front.talk[tf], SPR_W, SPR_H, (SPR_W + 6) * 2, 0);
  v.ctx.putImageData(v.img, 0, 0);
  // under the blinds: slats of warm light sweep down the figure; everything else in cool shadow
  v = clear(VIEW.light, '07060a');
  const off = (t / 1000) * 3.2;
  for (let x = 0; x < 96; x++) for (let y = SPR_H - 2; y < SPR_H + 6; y++) { const i = (y * 96 + x) * 4, h = PAL_HEX[lightPix(C.WOOD, x, y, off, y)]; v.img.data[i] = parseInt(h.slice(0, 2), 16); v.img.data[i + 1] = parseInt(h.slice(2, 4), 16); v.img.data[i + 2] = parseInt(h.slice(4, 6), 16); v.img.data[i + 3] = 255; }
  blitFrame(v.img, P.front.idle[idle], SPR_W, SPR_H, 8, 0, { map: (c, x, y) => lightPix(c, x + 8, y, off, y) });
  blitFrame(v.img, P.back.idle[idle], SPR_W, SPR_H, 50, 0, { flip: true, map: (c, x, y) => lightPix(c, x + 50, y, off, y) });
  v.ctx.putImageData(v.img, 0, 0);
  // portrait, mouth moving while "talking"
  v = clear(VIEW.portrait, '07060a');
  blitFrame(v.img, drawPortraitCached(expr, talkOn && Math.floor(t / 160) % 2 === 1), PORTRAIT_W, PORTRAIT_H, 0, 0);
  v.ctx.putImageData(v.img, 0, 0);
}
const PCACHE = {};
function drawPortraitCached(e, open) { const k = e + (open ? 1 : 0); return PCACHE[k] || (PCACHE[k] = drawPortrait(defForGame(), e, open)); }
function lightPix(c, x, y, off, row) {
  const z = (SPR_BY - row) / ZH, ph = frac(z / 0.2 + off * 0.25);
  const level = -1.2 + (ph < 0.5 ? 2.0 : 0) + (x < 48 ? 0.2 : 0);
  return quantLight(c, level, bay(x, y));
}

// ------------------------------------------------------------------ hand-drawn parts: a PNG into cur.art
const artInput = el('input', { type: 'file', accept: 'image/png', hidden: '' }); document.body.appendChild(artInput);
function pickArt(where, maxW, maxH) {
  artInput.value = '';
  artInput.onchange = async () => {
    const file = artInput.files[0]; if (!file) return;
    try {
      const bmp = await createImageBitmap(file);
      if (bmp.width > maxW || bmp.height > maxH) { toast(file.name + ' is ' + bmp.width + '×' + bmp.height + '; at most ' + maxW + '×' + maxH); return; }
      const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(bmp, 0, 0);
      cur.art = cur.art || {};
      const res = artFromRGBA(bmp.width, bmp.height, ctx.getImageData(0, 0, bmp.width, bmp.height).data, PAL_HEX, cur.key, cur.art.colours);
      (cur.art[where[0]] = cur.art[where[0]] || {})[where[1]] = res.rows;
      if (Object.keys(res.colours).length) cur.art.colours = res.colours;
      buildSide(); redraw();
      toast(res.offPalette ? res.offPalette + ' pixel(s) were off the palette and snapped to the nearest colour' : 'Imported ' + where.join(' '));
    } catch (e) { toast('Could not import: ' + e.message); }
  };
  artInput.click();
}

// ------------------------------------------------------------------ export, drafts, import
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2200); }
function copyCode() {
  const text = sourceText(), ta = document.getElementById('code'); ta.value = text;
  const done = () => toast('Copied. Paste it into CAST_DEFS.');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => { ta.select(); toast('Select-all done: press Ctrl+C.'); });
  else { ta.select(); toast('Press Ctrl+C to copy.'); }
}
function drafts() { try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}'); } catch (e) { return {}; } }
function saveDraft() {
  const all = drafts(); all[curId] = defForGame();
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(all)); toast('Saved draft "' + curId + '" in this browser.'); buildSide(); } catch (e) { toast('This browser blocks storage: copy the definition instead.'); }
}
function loadFromText() {
  const text = document.getElementById('code').value.trim().replace(/,\s*$/, '');
  const m = text.match(/^(\w+)\s*:\s*([\s\S]*)$/);
  try {
    const def = Function('C', 'costume', '"use strict"; return (' + (m ? m[2] : text) + ');')(C, (o) => Object.assign({}, o));
    load(m ? m[1] : curId, def); toast('Loaded.');
  } catch (e) { toast('Could not read that: ' + e.message); }
}

// ------------------------------------------------------------------ start
buildMain();
load('newcharacter', EXAMPLES.undertaker);
(function loop(t) { frameAt(t); requestAnimationFrame(loop); })(0);
window.__editor = { get cur() { return cur; }, load, sourceText, EXAMPLES };
