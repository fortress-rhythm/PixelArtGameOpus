// the paper dolls: frame sizes, and every existing character drawn exactly as before (golden hashes)
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const { loadGame, hash, feetWindow } = require('./helpers');
const g = loadGame({ files: ['src/01_core.js', 'src/03_iso.js', 'src/04_people.js', 'src/05_engine.js', 'src_test/t30_people.js'] });
const GOLDEN = path.join(__dirname, 'people.golden.json');

function hashes() {
  const out = {};
  g.buildCombatCast();
  const sets = {};
  for (const id in g.CAST_DEFS) sets[id] = g.buildPerson(g.CAST_DEFS[id]);
  for (const id in g.COMBAT_CAST) sets['combat.' + id] = g.COMBAT_CAST[id];       // the test level's derived frames too
  for (const id in sets) {
    const P = sets[id];
    for (const side of ['front', 'back']) for (const anim in P[side]) P[side][anim].forEach((f, i) => { out[id + '.' + side + '.' + anim + '.' + i] = hash(feetWindow(g, f)); });
  }
  return out;
}
test('every frame is SPR_W x SPR_H', () => {
  const P = g.buildPerson(g.CAST_DEFS.frank);
  for (const side of ['front', 'back']) for (const anim in P[side]) for (const f of P[side][anim]) assert.strictEqual(f.length, g.SPR_W * g.SPR_H);
});
test('the existing cast is drawn exactly as before', () => {
  const now = hashes();
  if (process.env.UPDATE_GOLDEN === '1' || !fs.existsSync(GOLDEN)) { fs.writeFileSync(GOLDEN, JSON.stringify(now, null, 1) + '\n'); return; }
  const want = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  const diff = Object.keys(want).filter(k => want[k] !== now[k]);
  assert.deepStrictEqual(diff, [], 'frames changed: ' + diff.slice(0, 8).join(', ') + ' (UPDATE_GOLDEN=1 to accept on purpose)');
});

// the silhouette options: each one changes the figure, and the tallest combination still fits the canvas
const BASE = { h: 30, body: 'suit', hat: 'none', hair: 'short' };
const OPTIONS = {
  neck: { neck: 2 }, shoulders: { shoulders: 2 }, narrow: { shoulders: -1 }, belly: { belly: 2 }, flare: { body: 'coat', flare: 3 },
  stance: { stance: 2 }, leanFwd: { lean: 1 }, leanBack: { lean: -1 }, pockets: { idle: 'pockets' }, crossed: { idle: 'crossed' },
  hips: { idle: 'hips' }, smoke: { idle: 'smoke' }, homburg: { hat: 'homburg' }, bowler: { hat: 'bowler' }, cloche: { hat: 'cloche' },
  newsboy: { hat: 'newsboy' }, beret: { hat: 'beret' }, long: { hair: 'long' }, curly: { hair: 'curly' }, pomp: { hair: 'pomp' },
  glasses: { sig: ['glasses'] }, moustache: { sig: ['moustache'] }, beard: { sig: ['beard'] }, scarf: { sig: ['scarf'] },
  flower: { sig: ['flower'] }, badge: { sig: ['badge'] }, satchel: { sig: ['satchel'] }, cane: { sig: ['cane'] }, case: { sig: ['case'] }
};
const idle = (d) => g.buildPerson(Object.assign({ key: g.costume({}) }, BASE, d)).front.idle[0];
test('every silhouette option and signature feature changes the drawing', () => {
  const base = hash(idle({}));
  for (const name in OPTIONS) assert.notStrictEqual(hash(idle(OPTIONS[name])), base, name + ' draws nothing different');
});
test('stride and bounce change the walk', () => {
  const walk = (d) => hash(g.buildPerson(Object.assign({ key: g.costume({}) }, BASE, d)).front.walk[2]);
  assert.notStrictEqual(walk({ stride: 1.6 }), walk({}));
  assert.notStrictEqual(walk({ bounce: 0 }), walk({}));
});
test('the tallest figure still has an empty top row', () => {
  const f = idle({ h: 36, neck: 2, hat: 'homburg' });
  for (let x = 0; x < g.SPR_W; x++) assert.strictEqual(f[x], g.T);
});
