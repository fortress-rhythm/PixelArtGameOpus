// Ravenshore Garden: the loop is seamless and every frame depends only on the time in the loop
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const { loadGame } = require('./helpers');
const FILES = fs.readdirSync(path.join(__dirname, '..', '..', 'src_garden')).filter(f => f.endsWith('.js')).sort().map(f => 'src_garden/' + f);
const garden = (search) => loadGame({ files: FILES, search });   // init() runs: builds the scene, seeks to ?t=
// the rendered frame (palette indices) at the current simulation frame
const frame = (g) => { g.render(g.simFrame); return Buffer.from(g.fb); };
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };

test('the second time round is identical to the first (nothing leaks across the loop point)', () => {
  // every 15th frame (4 a second), so even a rare stray drip from an un-reset random generator shows
  const g = garden(''), first = {}, at = (f) => f % 15 === 0;
  for (let f = 0; f < g.LOOP_F; f++) { if (at(g.simFrame)) first[g.simFrame] = frame(g); g.step(); }
  assert.strictEqual(g.simFrame, 0);
  for (let f = 0; f < g.LOOP_F; f++) {
    if (at(g.simFrame)) assert.strictEqual(diff(frame(g), first[g.simFrame]), 0, 'frame ' + g.simFrame + ' (' + (g.simFrame / 60).toFixed(2) + ' s) differs on the second loop');
    g.step();
  }
});

test('nothing transient is left at the loop point', () => {
  // these reset when the loop restarts, so anything still alive here would vanish in a pop
  const g = garden('');
  while (g.simFrame < g.LOOP_F - 1) g.step();
  const water = [g.P_DROP, g.P_SPLASH, g.P_DRIP];
  for (let i = 0; i < g.PN; i++) assert.ok(!water.includes(g.pKind[i]), 'a water particle is still in the air at the loop point');
  assert.ok(g.wsLife.every(v => v <= 0), 'a wet flagstone has not dried by the loop point');
  assert.ok(g.bedWet.every(v => v === 0), 'a bed is still wet at the loop point');
  assert.ok(g.bloomPerk.every(v => v <= 0), 'a flower is still perked up at the loop point');
});

test('the loop point is no bigger a jump than an ordinary frame step, layer by layer', () => {
  // The film grain re-rolls every 5 frames and the bay shimmer every 8, and both happen at the loop point, so it is
  // compared with ordinary steps where both happen too (every 40 frames) and the camera is still. For each layer the
  // pixels that change at the loop point must be within what such a step changes (a little margin: the re-rolls are
  // random, so their size varies). One continuous run, so every frame has its real history.
  const g = garden(''), names = {}; for (const k in g.L) names[g.L[k]] = k;
  const snap = () => { g.render(g.simFrame); return { fb: Buffer.from(g.fb), lid: Buffer.from(g.lid) }; };
  const byLayer = (a, b) => { const c = {}; for (let i = 0; i < a.fb.length; i++) if (a.fb[i] !== b.fb[i]) { const n = names[b.lid[i]]; c[n] = (c[n] || 0) + 1; } return c; };
  const cam = (f) => Math.round(g.camPathX[f]) + ',' + Math.round(g.camPathY[f]);
  const most = {}; let seam = null, samples = 0;
  for (let f = 0; f < g.LOOP_F; f++) {
    const from = g.simFrame;
    if ((from + 1) % 40 !== 0) { g.step(); continue; }
    const a = snap(); g.step();
    if (cam(from) !== cam(g.simFrame)) continue;
    const c = byLayer(a, snap());
    if (from === g.LOOP_F - 1) { seam = c; continue; }
    samples++; for (const k in c) most[k] = Math.max(most[k] || 0, c[k]);
  }
  assert.ok(seam, 'the camera should be still across the loop point');
  assert.ok(samples >= 20, 'too few comparable steps (' + samples + ')');
  for (const k in seam) assert.ok(seam[k] <= 1.25 * (most[k] || 0), 'at the loop point ' + seam[k] + ' ' + k + ' pixels change; comparable steps change at most ' + (most[k] || 0));
});

test('every cycle completes a whole number of times per loop', () => {
  // The loop is seamless because everything that repeats runs a whole number of cycles in LOOP_S: osc(k, t) with a
  // whole k, or an inline N * t / LOOP_S with a whole N. A cycle of 9.3 would jump at the loop point.
  const g = garden('');
  g.$eval('globalThis.oscKs = new Set(); { const o = osc; osc = (k, t, ph) => { oscKs.add(k); return o(k, t, ph); }; }');
  for (let f = 0; f < g.LOOP_F; f++) { g.step(); if (f % 4 === 0) g.render(g.simFrame); }
  const ks = g.$eval('[...oscKs]');
  for (const k of ks) assert.ok(Number.isInteger(k), 'osc() runs ' + k + ' cycles per loop');
  assert.ok(ks.length > 5, 'osc() was hardly called (' + ks.length + ' distinct cycle counts)');
  for (const f of FILES) {
    const text = fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');
    for (const m of text.matchAll(/(\d+(?:\.\d+)?) \* t \/ LOOP_S/g))
      assert.ok(Number.isInteger(+m[1]), f + ': ' + m[0] + ' is not a whole number of cycles per loop');
  }
});

test('seeking with ?t= gives the same frame as playing up to it', () => {
  const played = garden('');
  for (const t of [7.5, 22.5, 38.5]) {
    while (played.simFrame < Math.floor(t * 60)) played.step();
    assert.strictEqual(diff(frame(garden('?t=' + t)), frame(played)), 0, 'seeking to ' + t + ' s differs from playing there');
  }
});

test('two runs to the same moment are identical', () => {
  assert.strictEqual(diff(frame(garden('?t=33.3')), frame(garden('?t=33.3'))), 0);
});
