// portraits: drawn for every cast member and expression, from the same definition as the doll
const test = require('node:test'), assert = require('node:assert');
const { loadGame, hash } = require('./helpers');
const g = loadGame({ files: ['src/01_core.js', 'src/04_people.js', 'src/13_portraits.js'] });

test('every cast member has a portrait in every expression', () => {
  for (const id in g.CAST_DEFS) for (const e of g.PORTRAIT_EXPRS) {
    const f = g.portraitOf(id, e);
    assert.strictEqual(f.length, g.PORTRAIT_W * g.PORTRAIT_H);
    assert.ok(f.some(c => c !== g.T), id + ' ' + e + ' is empty');
    for (const c of f) if (c !== g.T) assert.ok(c < g.NPAL, id + ' ' + e + ' uses colour ' + c);
  }
});
test('expressions and the talking mouth all differ', () => {
  const seen = new Set(g.PORTRAIT_EXPRS.map(e => hash(g.portraitOf('frank', e))));
  assert.strictEqual(seen.size, g.PORTRAIT_EXPRS.length);
  assert.notStrictEqual(hash(g.portraitOf('frank', 'neutral', true)), hash(g.portraitOf('frank', 'neutral')));
});
test('signature features show on the portrait too', () => {
  const base = { h: 30, body: 'suit', hat: 'none', hair: 'short', key: g.costume({}) };
  const plain = hash(g.drawPortrait(base, 'neutral', false));
  for (const s of ['glasses', 'moustache', 'beard', 'scarf', 'flower', 'badge', 'satchel'])
    assert.notStrictEqual(hash(g.drawPortrait(Object.assign({}, base, { sig: [s] }), 'neutral', false)), plain, s);
});
test('every hat and hair style draws', () => {
  const base = { h: 30, body: 'suit', hat: 'none', hair: 'short', key: g.costume({}) }, seen = new Set();
  for (const hat of ['none', 'fedora', 'homburg', 'bowler', 'cloche', 'newsboy', 'beret', 'cap', 'doorman', 'pillbox']) seen.add(hash(g.drawPortrait(Object.assign({}, base, { hat }), 'neutral', false)));
  for (const hair of ['short', 'slick', 'bob', 'bun', 'bald', 'long', 'curly', 'pomp']) seen.add(hash(g.drawPortrait(Object.assign({}, base, { hair }), 'neutral', false)));
  assert.strictEqual(seen.size, 10 + 8 - 1);   // 'none' with 'short' hair appears in both lists
});
