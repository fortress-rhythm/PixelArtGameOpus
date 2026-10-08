// Night Bridge: the story plays once, then the ambient loop is seamless; every frame depends only on the time
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const { loadGame } = require('./helpers');
const FILES = require('../../tools/build').TARGETS.bridge().files;
const bridge = (search) => loadGame({ files: FILES, search });      // init() runs: builds the scene, seeks to ?t=
const g = bridge('');
const frame = (f) => { g.render(f); return Buffer.from(g.fb); };
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };

test('the loop point is seamless: the frame after the last is the loop\'s first frame', () => {
  // render() takes any frame number, so the one past the end can be drawn and compared with where the clock wraps to
  assert.strictEqual(diff(frame(g.CINE_F), frame(g.STORY_F)), 0);
  assert.strictEqual(diff(frame(g.CINE_F + 377), frame(g.STORY_F + 377)), 0);
});

test('after the last frame the clock goes back to the start of the loop, not of the story', () => {
  const h = bridge('?t=' + (g.CINE_S - 0.01));
  while (h.simFrame !== h.STORY_F) h.step();
  assert.strictEqual(h.simFrame, h.STORY_F);
});

test('every cycle completes a whole number of times per loop', () => {
  const h = bridge('');
  h.$eval('globalThis.oscKs = new Set(); { const o = osc; osc = (k, t, ph) => { oscKs.add(k); return o(k, t, ph); }; }');
  for (let f = 0; f < h.CINE_F; f += 7) h.render(f);
  const ks = h.$eval('[...oscKs]');
  for (const k of ks) assert.ok(Number.isInteger(k), 'osc() runs ' + k + ' cycles per loop');
  assert.ok(ks.length > 8, 'osc() was hardly called (' + ks.length + ' distinct cycle counts)');
  for (const f of FILES) {
    const text = fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');
    for (const m of text.matchAll(/(\d+(?:\.\d+)?) \* t \/ LOOP_S/g))
      assert.ok(Number.isInteger(+m[1]), f + ': ' + m[0] + ' is not a whole number of cycles per loop');
  }
});

test('seeking with ?t= gives the same frame as playing up to it, and two runs agree', () => {
  for (const t of [9.5, 47, 76.2, 100]) {
    const s = bridge('?t=' + t);
    assert.strictEqual(diff(Buffer.from((s.render(s.simFrame), s.fb)), frame(s.simFrame)), 0, 'seeking to ' + t + ' s');
  }
});

test('her colours appear nowhere until she does', () => {
  // the brief: her hair, cloak and tunic are the only colours of their kind in the scene
  const hers = new Set(['HR0', 'HR1', 'HR2', 'CK0', 'CK1', 'CK2', 'TU0', 'TU1', 'TU2'].map(n => g.C[n]));
  for (let t = 0; t < 21; t += 0.5) {
    const fb = frame(Math.round(t * 60));
    for (let i = 0; i < fb.length; i++) assert.ok(!hers.has(fb[i]), 'one of her colours shows at ' + t + ' s before she arrives');
  }
});

test('the story ends with everyone indoors and the lamp lit', () => {
  const on = (t) => g.ORDER.filter(w => g.evalPerson(w, t).on);
  assert.deepStrictEqual(on(g.STORY_S + 5), []);
  assert.ok(g.lampOn(g.STORY_S) === 1 && g.lampOn(g.LAMP_T - 0.1) === 0);
  assert.ok(on(30).includes('her') && on(30).includes('kidA') && on(30).includes('kidB'), 'the three walk to the inn together');
  assert.deepStrictEqual(on(50), [], 'everyone is inside the inn at 50 s');
});
