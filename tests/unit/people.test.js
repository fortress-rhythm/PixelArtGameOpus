// the paper dolls: frame sizes, and every existing character drawn exactly as before (golden hashes)
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const { loadGame, hash, feetWindow } = require('./helpers');
const g = loadGame({ files: ['src/01_core.js', 'src/04_people.js'] });
const GOLDEN = path.join(__dirname, 'people.golden.json');

function hashes() {
  const out = {};
  for (const id in g.CAST_DEFS) {
    const P = g.buildPerson(g.CAST_DEFS[id]);
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
