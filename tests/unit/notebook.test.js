// the notebook: a right pair makes a deduction once, a wrong pair costs nothing
const test = require('node:test'), assert = require('node:assert');
const { loadGame } = require('./helpers');
const g = loadGame();

test('connect() finds a deduction once, in either order', () => {
  g.resetGame();
  const d = g.DEDS[0];
  assert.strictEqual(g.connect(d.b, d.a).ok, true);
  assert.ok(g.hasClue(d.id));
  assert.strictEqual(g.connect(d.a, d.b).ok, false);
});
test('a wrong pair is refused', () => {
  g.resetGame();
  assert.strictEqual(g.connect('street_door', 'herald_lights').ok, false);
  assert.strictEqual(g.G.deds.length, 0);
});
