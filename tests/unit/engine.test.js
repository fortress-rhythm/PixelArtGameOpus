// rooms bake, the walk grid and A* pathfinding
const test = require('node:test'), assert = require('node:assert');
const { loadGame } = require('./helpers');
const g = loadGame();

test('every room bakes and has a walkable start', () => {
  for (const id in g.ROOMS) {
    const r = g.ROOMS[id]; g.buildRoomBuffer(r);
    assert.ok(r.rb && r.rb.w > 0, id + ' baked');
    if (r.start) assert.ok(g.walkable(r.grid, r.start[0], r.start[1]), id + ' start is walkable');
  }
});
test('paths only cross walkable ground', () => {
  const r = g.ROOMS.office; g.buildRoomBuffer(r);
  const p = g.findPath(r.grid, 0.6, 3.7, 5.5, 4.5);
  assert.ok(p.length > 0);
  let [x, y] = [0.6, 3.7];
  for (const [nx, ny] of p) { assert.ok(g.losClear(r.grid, x, y, nx, ny)); [x, y] = [nx, ny]; }
});
