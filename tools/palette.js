// Writes the game's palette for pixel-art editors, so you only ever paint with colours the game has.
//   node tools/palette.js          -> palettes/hourglass.gpl  (GIMP palette: Aseprite, Pixelorama, Piskel, Krita, GIMP)
//                                     palettes/hourglass.pal  (JASC: Aseprite, Paint Shop Pro, many others)
//                                     palettes/hourglass.hex  (one hex per line: Lospec, Pixelorama, Paint.NET-style tools)
//                                     palettes/hourglass.png  (one pixel per colour: "load palette from image")
// The order is the game's palette order and every colour is named after its C.NAME, so an index in your editor is
// the same index in the code. tests/unit/palette.test.js fails if these files fall behind src/01_core.js.
const fs = require('fs'), path = require('path');
const { loadGame, ROOT } = require('./load_game');
const { png } = require('./png');

function paletteFiles() {
  const g = loadGame({ files: ['src/01_core.js'] }), hex = g.PAL_HEX, name = [];
  for (const k in g.C) name[g.C[k]] = k;
  const rgb = hex.map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
  const gpl = 'GIMP Palette\nName: Hourglass City\nColumns: 10\n# ' + hex.length + ' colours, in the order of PAL_HEX in src/01_core.js\n' +
    rgb.map((c, i) => c.map(v => String(v).padStart(3)).join(' ') + '\tC.' + (name[i] || i)).join('\n') + '\n';
  const pal = 'JASC-PAL\r\n0100\r\n' + hex.length + '\r\n' + rgb.map(c => c.join(' ')).join('\r\n') + '\r\n';
  const hexTxt = hex.join('\n') + '\n';
  const strip = new Uint8Array(hex.length * 4);
  rgb.forEach((c, i) => { strip[i * 4] = c[0]; strip[i * 4 + 1] = c[1]; strip[i * 4 + 2] = c[2]; strip[i * 4 + 3] = 255; });
  return { 'hourglass.gpl': gpl, 'hourglass.pal': pal, 'hourglass.hex': hexTxt, 'hourglass.png': png(hex.length, 1, strip, 1) };
}
if (require.main === module) {
  const dir = path.join(ROOT, 'palettes'); fs.mkdirSync(dir, { recursive: true });
  const files = paletteFiles();
  for (const f in files) fs.writeFileSync(path.join(dir, f), files[f]);
  console.log('wrote palettes/' + Object.keys(files).join(', palettes/'));
}
module.exports = { paletteFiles };
