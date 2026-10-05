// Imports a hand-drawn PNG as game pixel art: prints the rows and colours to paste into a character's `art`.
//   node tools/import_art.js head-front.png --for frank            head art, letters from frank's costume
//   node tools/import_art.js portrait.png --as portrait --for mags   a 64x72 portrait
//   node tools/import_art.js sign.png                               any stamp: every colour gets its own letter
//   --json   print { rows, colours } instead of source text
// Draw with the palette from palettes/ (npm run palette). Colours outside it are snapped to the nearest one and
// reported, so you can fix them in the drawing. See docs/characters.md, "Hand-drawn parts".
const fs = require('fs'), path = require('path');
const { readPng } = require('./png_read');
const { artFromRGBA, artRowsSource, artColoursSource } = require('./art_core');
const { loadGame } = require('./load_game');

const LIMITS = { head: [20, 20], portrait: [64, 72], stamp: [320, 180] };
function importArt(file, opts) {
  opts = opts || {};
  const g = loadGame({ files: ['src/01_core.js', 'src/04_people.js'] });
  const as = opts.as || (opts.for ? 'head' : 'stamp');
  if (!LIMITS[as]) throw new Error('--as must be head, portrait or stamp');
  const img = readPng(fs.readFileSync(file));
  const [mw, mh] = LIMITS[as];
  if (img.width > mw || img.height > mh) throw new Error(path.basename(file) + ' is ' + img.width + 'x' + img.height + '; ' + as + ' art can be at most ' + mw + 'x' + mh);
  let key = null;
  if (opts.for) { const d = g.CAST_DEFS[opts.for]; if (!d) throw new Error('no cast member ' + opts.for); key = d.key; }
  const res = artFromRGBA(img.width, img.height, img.rgba, g.PAL_HEX, key);
  const cname = []; for (const k in g.C) cname[g.C[k]] = k;
  return Object.assign(res, { width: img.width, height: img.height, as, cname });
}
if (require.main === module) {
  const args = process.argv.slice(2), opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const file = args.find(a => !a.startsWith('--') && a !== opt('--for') && a !== opt('--as'));
  if (!file) { console.error('usage: node tools/import_art.js <file.png> [--for <castId>] [--as head|portrait|stamp] [--json]'); process.exit(1); }
  try {
    const r = importArt(file, { for: opt('--for'), as: opt('--as') });
    if (args.includes('--json')) console.log(JSON.stringify({ rows: r.rows, colours: r.colours }, null, 1));
    else {
      console.log('// ' + path.basename(file) + ': ' + r.width + 'x' + r.height + ' ' + r.as + (opt('--for') ? ', letters from ' + opt('--for') + "'s costume" : ''));
      console.log(artRowsSource(r.rows, '') + (Object.keys(r.colours).length ? ',\n// colours not in the costume: put these in art.colours\n' + artColoursSource(r.colours, r.cname) : ''));
    }
    if (r.offPalette) console.error('note: ' + r.offPalette + ' pixel(s) were not palette colours and were snapped to the nearest (first at ' + r.offExamples.join(' ') + '). Use palettes/hourglass.gpl.');
  } catch (e) { console.error(e.message); process.exit(1); }
}
module.exports = { importArt };
