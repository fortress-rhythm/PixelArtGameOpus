// palette remaps, the isometric projection and light quantising
const test = require('node:test'), assert = require('node:assert');
const { loadGame } = require('./helpers');
const g = loadGame({ files: ['src/01_core.js', 'src/03_iso.js'] });

test('light remaps stay inside the palette', () => {
  for (const m of [g.LIT, g.SHD, g.REDW, g.BLUW, g.CYNW, g.GRNW, g.REFL])
    for (let i = 0; i < g.NPAL; i++) assert.ok(m[i] < g.NPAL, 'colour ' + i + ' maps to ' + m[i]);
});
test('transparent index is never remapped', () => {
  for (const m of [g.LIT, g.SHD]) assert.strictEqual(m[g.T], g.T);
});
test('screen to floor inverts the projection', () => {
  for (const [x, y] of [[0, 0], [3.25, 1.5], [12, 7.75]]) {
    const sx = g.isoX(x, y), sy = g.isoY(x, y, 0), a = sx / g.TW, b = sy / g.TH;
    assert.ok(Math.abs((a + b) / 2 - x) < 1e-9 && Math.abs((b - a) / 2 - y) < 1e-9);
  }
});
test('light steps never go down as light goes up', () => {
  for (let b = 0; b < 1; b += 0.0625) {
    let last = -99;
    for (let L = -4; L <= 4; L += 0.05) { const s = g.lightSteps(L, b); assert.ok(s >= last); last = s; }
  }
});
