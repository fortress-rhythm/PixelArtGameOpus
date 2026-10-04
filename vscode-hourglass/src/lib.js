'use strict';
// Everything the extension knows, without VS Code: reading the palette, finding pixel art in the source,
// drawing it as an image, previewing cast members, and turning story-check output into problems.
// extension.js only wires these to the editor, so the tests can run them in plain Node.
const fs = require('fs'), path = require('path'), { png, frameToRGBA } = require('./png');

// ------------------------------------------------------------------ the palette, read from src/01_core.js
/** @param {string} coreText */
function readPalette(coreText) {
  const pal = coreText.match(/const PAL_HEX = \[([\s\S]*?)\];/), cdef = coreText.match(/const C = \{([\s\S]*?)\};/);
  if (!pal || !cdef) return null;
  const hex = [...pal[1].matchAll(/'([0-9a-fA-F]{6})'/g)].map(m => m[1].toLowerCase());
  const names = {};
  for (const m of cdef[1].matchAll(/(\w+):\s*(\d+)/g)) names[m[1]] = +m[2];
  return { hex, names };
}
/** the default costume key from src/04_people.js: slot letter -> palette index @param {string} peopleText @param {{names: Object}} pal */
function readDefaultKey(peopleText, pal) {
  const m = peopleText.match(/function costume\(o\) \{\s*const d = \{([\s\S]*?)\};/);
  return m ? parseKey(m[1], pal) : {};
}
/** "a: C.NAME, b: C.OTHER" -> {a: index, b: index} @param {string} text @param {{names: Object}} pal */
function parseKey(text, pal) {
  const key = {};
  for (const m of text.matchAll(/(?:^|[\s,{])['"]?(\w)['"]?\s*:\s*C\.(\w+)/g)) if (m[2] in pal.names) key[m[1]] = pal.names[m[2]];
  return key;
}

// ------------------------------------------------------------------ pixel art in the source
// A string map is an array literal of two or more strings of the same length: ['..ooo..', '.oiiio.', ...].
/** @param {string} text @param {number} offset @returns {{rows: string[], start: number, end: number} | null} */
function findArtAt(text, offset) {
  let tries = 0;
  for (let i = offset; i >= 0 && tries < 4 && offset - i < 3000; i--) {
    if (text[i] !== '[') continue;
    tries++;
    const close = matchBracket(text, i);
    if (close < offset) continue;
    const body = text.slice(i + 1, close);
    if (!/^\s*('[^'\n]*'\s*,\s*)+'[^'\n]*'\s*,?\s*$/.test(body)) continue;
    const rows = [...body.matchAll(/'([^'\n]*)'/g)].map(m => m[1]);
    if (rows.length >= 2 && rows[0].length >= 2 && rows.every(r => r.length === rows[0].length)) return { rows, start: i, end: close };
  }
  return null;
}
/** @param {string} text @param {number} i index of '[' */
function matchBracket(text, i) {
  let depth = 0, q = null;
  for (let k = i; k < text.length; k++) {
    const ch = text[k];
    if (q) { if (ch === q && text[k - 1] !== '\\') q = null; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) return k;
  }
  return -1;
}
// the colour key that goes with a string map: an object literal of one-letter keys right after it,
// a `K` (a costume) which means the default costume, or nothing (then each letter gets its own colour)
/** @param {string} text @param {number} end @param {{names: Object}} pal @param {Object} defaultKey */
function keyAfter(text, end, pal, defaultKey) {
  const tail = text.slice(end + 1, end + 400), stop = tail.search(/;|\n\s*\n/), seg = stop >= 0 ? tail.slice(0, stop) : tail;
  const obj = seg.match(/\{([^{}]*C\.\w+[^{}]*)\}/);
  if (obj) { const k = parseKey(obj[1], pal); if (Object.keys(k).length) return { key: k, from: 'the colour key after it' }; }
  if (/^\s*,\s*K\b/.test(seg)) return { key: defaultKey, from: "the default costume (K)" };
  return null;
}
const FALLBACK = ['f2b86e', '5ad1d2', 'd9443a', '9ff0c0', '8b7cb4', 'eed27c', 'd8605c', '7fa8ff', 'c08a69', 'a7adb6'];
/** a data: URI of the map drawn at scale, and a legend @param {string[]} rows @param {Object|null} key @param {{hex: string[]}} pal */
function renderArt(rows, key, pal, scale) {
  const w = rows[0].length, h = rows.length, rgba = new Uint8Array(w * h * 4), legend = {};
  let fb = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x]; if (ch === '.' || ch === ' ') continue;
    let hx;
    if (key && key[ch] !== undefined) hx = pal.hex[key[ch]];
    else { if (!legend[ch]) legend[ch] = FALLBACK[fb++ % FALLBACK.length]; hx = legend[ch]; }
    if (!hx) continue;
    const i = (y * w + x) * 4; rgba[i] = parseInt(hx.slice(0, 2), 16); rgba[i + 1] = parseInt(hx.slice(2, 4), 16); rgba[i + 2] = parseInt(hx.slice(4, 6), 16); rgba[i + 3] = 255;
  }
  return { uri: dataUri(png(w, h, rgba, scale || Math.max(2, Math.min(12, Math.floor(160 / Math.max(w, h)))))), w, h, guessed: Object.keys(legend) };
}
/** @param {Buffer} buf */
function dataUri(buf) { return 'data:image/png;base64,' + buf.toString('base64'); }
/** a small swatch for a palette colour @param {string} hex */
function swatch(hex) {
  const rgba = new Uint8Array(4); rgba[0] = parseInt(hex.slice(0, 2), 16); rgba[1] = parseInt(hex.slice(2, 4), 16); rgba[2] = parseInt(hex.slice(4, 6), 16); rgba[3] = 255;
  return dataUri(png(1, 1, rgba, 24));
}

// ------------------------------------------------------------------ cast previews (runs the game's code: trusted workspaces only)
/** the doll (front and back) and the portrait of a cast member, as data: URIs @param {string} root @param {string} id */
function castPreview(root, id) {
  const loader = path.join(root, 'tools', 'load_game.js');
  if (!fs.existsSync(loader)) return null;
  delete require.cache[require.resolve(loader)];
  const has13 = fs.existsSync(path.join(root, 'src', '13_portraits.js'));
  const g = require(loader).loadGame({ files: ['src/01_core.js', 'src/04_people.js'].concat(has13 ? ['src/13_portraits.js'] : []) });
  const def = g.CAST_DEFS[id]; if (!def) return null;
  const P = g.buildPerson(def), W = g.SPR_W, H = g.SPR_H, gap = 4, rgba = new Uint8Array((W * 2 + gap) * H * 4);
  [P.front.idle[0], P.back.idle[0]].forEach((f, k) => {
    const px = frameToRGBA(f, W, H, g.PAL_HEX, g.T);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (y * W + x) * 4; if (px[s + 3]) rgba.set(px.subarray(s, s + 4), (y * (W * 2 + gap) + k * (W + gap) + x) * 4); }
  });
  const out = { name: def.name || id, doll: dataUri(png(W * 2 + gap, H, rgba, 3)) };
  if (g.drawPortrait) out.portrait = dataUri(png(g.PORTRAIT_W, g.PORTRAIT_H, frameToRGBA(g.drawPortrait(def, 'neutral', false), g.PORTRAIT_W, g.PORTRAIT_H, g.PAL_HEX, g.T), 2));
  return out;
}
// the cast id a position refers to: the key of a CAST_DEFS entry, or the speaker of a say / actor command
/** @param {string} line @param {number} ch */
function castIdAt(line, ch) {
  for (const re of [/\['(?:say|walk|face|place|pose|remove)', '(\w+)'/g, /^\s{2}(\w+):\s*\{\s*h:/g, /makeActor\('(\w+)'/g, /ACT\.(\w+)/g]) {
    for (const m of line.matchAll(re)) { const s = m.index + m[0].indexOf(m[1]), e = s + m[1].length; if (ch >= s && ch <= e) return { id: m[1], start: s, end: e }; }
  }
  return null;
}

// ------------------------------------------------------------------ story check -> problems
/** @param {{problems: Array<{file: string, line: number, col: number, severity: string, message: string}>}} json */
function toProblems(json) {
  const byFile = {};
  for (const p of json.problems || []) (byFile[p.file] = byFile[p.file] || []).push({ line: Math.max(0, p.line - 1), col: Math.max(0, p.col - 1), severity: p.severity, message: p.message });
  return byFile;
}

module.exports = { readPalette, readDefaultKey, parseKey, findArtAt, keyAfter, renderArt, swatch, castPreview, castIdAt, toProblems };
