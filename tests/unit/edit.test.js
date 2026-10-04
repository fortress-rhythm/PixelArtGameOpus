// edit mode (?edit=1): dragging a handle moves the definition, and the copied text says so
const test = require('node:test'), assert = require('node:assert');
const { loadGame } = require('./helpers');
const g = loadGame({ search: '?edit=1' });
g.buildCast(); for (const id in g.CAST) g.ACT[id] = g.makeActor(id);
g.G.mode = 'play'; g.enterRoom('office', 2, 3.5, 'SE'); g.updateCamera(true);

function drag(label, dx, dy, ev) {
  const h = g.editHandles().find(x => x.label === label), [sx, sy] = g.editScreenOf(h);
  g.UI.mx = sx; g.UI.my = sy; assert.ok(g.editMouse('down', { button: 0 }), 'grabbed ' + label);
  g.UI.mx = sx + dx; g.UI.my = sy + dy; g.editMouse('move', ev || {});
  g.editMouse('up', {});
}
test('edit mode starts from the URL', () => { assert.strictEqual(g.EDIT.on, true); });
test('dragging a stand point moves it, snapped to 0.05 m', () => {
  drag('door at', 16, 8);                                   // one tile right on screen = +1 m in x
  const at = g.ROOMS.office.hotspots.find(h => h.id === 'door').at;
  assert.deepStrictEqual(Array.from(at), [1.45, 3.75]);
  assert.match(g.editSnippet(), /id: 'door', \.\.\., at: \[1\.45, 3\.75\]/);
});
test('dragging a block corner rebuilds the walk grid', () => {
  const b = g.ROOMS.office.block[0], before = g.walkable(g.ROOMS.office.grid, b[2] + 0.4, b[3] + 0.4);
  drag('block 0 max', 16, 8);
  assert.ok(before && !g.walkable(g.ROOMS.office.grid, b[2] - 0.6, b[3] - 0.1));
  assert.match(g.editSnippet(), /block: \[\[/);
});
test('handles are only grabbed in edit mode', () => {
  g.EDIT.on = false;
  const h = g.editHandles()[0], [sx, sy] = g.editScreenOf(h); g.UI.mx = sx; g.UI.my = sy;
  assert.strictEqual(g.editMouse('down', { button: 0 }), false);
  g.EDIT.on = true;
});
