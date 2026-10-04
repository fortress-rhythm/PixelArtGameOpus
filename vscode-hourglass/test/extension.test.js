// the extension, loaded against a stub of VS Code
const test = require('node:test'), assert = require('node:assert'), path = require('path');
const { vscode, registered, doc, Position } = require('./vscode-stub');
const ROOT = path.join(__dirname, '..', '..');
vscode.workspace.workspaceFolders = [{ uri: { fsPath: ROOT } }];
const ext = require('../src/extension');
const api = ext.activate({ subscriptions: [] });
const hoverAt = (text, needle, delta) => { const d = doc(text), o = text.indexOf(needle) + (delta || 0); return registered.hovers[0].provideHover(d, d.positionAt(o)); };

test('activation registers the hover, the save hook and both commands', () => {
  assert.strictEqual(registered.hovers.length, 1); assert.strictEqual(registered.saves.length, 1);
  assert.ok(registered.commands['hourglass.check'] && registered.commands['hourglass.openEditor']);
});
test('hovering a palette name shows its colour', () => {
  const h = hoverAt('const x = C.TAN;', 'TAN');
  assert.match(h.contents.value, /`C\.TAN` palette 25 · #7d6752/);
});
test('hovering a string map shows it drawn', () => {
  const h = hoverAt("rStamp(1, 2, 0, ['.oo.', 'oiio'], { o: C.INK, i: C.CREAM });", 'oiio');
  assert.match(h.contents.value, /!\[pixel art\]\(data:image\/png;base64,/);
  assert.match(h.contents.value, /colours from the colour key after it/);
});
test('hovering a speaker shows the doll and the portrait', () => {
  const h = hoverAt("  ['say', 'teague', \"Hm.\"],", 'teague', 2);
  assert.match(h.contents.value, /\*\*Teague\*\*/); assert.match(h.contents.value, /!\[portrait\]/);
});
test('the story check runs and reports the clean story as clean', async () => {
  const res = await api.check();
  assert.ok(res, 'the checker ran'); assert.strictEqual(res.problems, 0); assert.ok(res.known > 0);
  assert.strictEqual([...registered.diagnostics.values()].flat().length, 0);
});
