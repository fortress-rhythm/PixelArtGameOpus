// the extension's pure parts, against the real sources
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const lib = require('../src/lib');
const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pal = lib.readPalette(read('src/01_core.js'));

test('the palette and colour names are read from the source', () => {
  assert.strictEqual(pal.hex.length, 60);
  assert.strictEqual(pal.hex[pal.names.TAN], '7d6752');
});
test('the default costume key is read', () => {
  const k = lib.readDefaultKey(read('src/04_people.js'), pal);
  assert.strictEqual(k.S, pal.names.SKM); assert.strictEqual(k.o, pal.names.BLK);
});
test('a string map is found from anywhere inside it, with its colour key', () => {
  const src = read('src/30_office.js'), at = src.indexOf("'oiioeoiio'") + 3;
  const art = lib.findArtAt(src, at);
  assert.ok(art); assert.strictEqual(art.rows.length, 6); assert.strictEqual(art.rows[0], '..ooooo..');
  const text = "drawStampLive(1, 2, 0, ['.sss', 'sisi', 'sss.'], { s: C.CRS, i: C.ST1 }, 0, cx, cy);";
  const a2 = lib.findArtAt(text, text.indexOf('sisi')), k = lib.keyAfter(text, a2.end, pal, {});
  assert.deepStrictEqual(k.key, { s: pal.names.CRS, i: pal.names.ST1 });
});
test('art drawn with K uses the default costume; art with no key still draws', () => {
  const text = "spmap(x0, fy, ['AsSSS', 'sSSeS'], K);";
  const a = lib.findArtAt(text, 18), k = lib.keyAfter(text, a.end, pal, { A: 1 });
  assert.strictEqual(k.from, 'the default costume (K)');
  const r = lib.renderArt(['ab', 'ba'], null, pal);
  assert.match(r.uri, /^data:image\/png;base64,/); assert.deepStrictEqual(r.guessed, ['a', 'b']);
});
test('a list of ordinary strings is not mistaken for art', () => {
  const text = "const MENU = ['Resume', 'Save', 'Quit'];";
  assert.strictEqual(lib.findArtAt(text, 18), null);
});
test('cast ids are found in say commands and definitions', () => {
  assert.strictEqual(lib.castIdAt("  ['say', 'russo', \"Who called you?\"],", 13).id, 'russo');
  assert.strictEqual(lib.castIdAt("  frank: { h: 31, body: 'coat',", 4).id, 'frank');
  assert.strictEqual(lib.castIdAt("  ['say', 'russo', \"Who called you?\"],", 25), null);
});
test('a cast preview draws the doll and the portrait', () => {
  const p = lib.castPreview(ROOT, 'mags');
  assert.strictEqual(p.name, 'Mags'); assert.match(p.doll, /^data:image\/png/); assert.match(p.portrait, /^data:image\/png/);
});
test('story check output becomes zero-based problems per file', () => {
  const by = lib.toProblems({ problems: [{ file: 'src/20_story.js', line: 3, col: 5, severity: 'error', message: 'x' }] });
  assert.deepStrictEqual(by['src/20_story.js'][0], { line: 2, col: 4, severity: 'error', message: 'x' });
});
