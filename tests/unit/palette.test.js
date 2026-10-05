// the palette files in palettes/ match the game's palette (run `node tools/palette.js` after changing PAL_HEX)
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const { paletteFiles } = require('../../tools/palette');
test('palette files are up to date', () => {
  const want = paletteFiles();
  for (const f in want) {
    const have = fs.readFileSync(path.join(__dirname, '..', '..', 'palettes', f));
    assert.ok(Buffer.compare(have, Buffer.from(want[f])) === 0, 'palettes/' + f + ' is stale: run node tools/palette.js');
  }
});
