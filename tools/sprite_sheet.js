// Renders the cast to a PNG so you can compare characters side by side, without opening the game.
//   node tools/sprite_sheet.js                      every cast member, front and back, idle -> shots/cast.png
//   node tools/sprite_sheet.js frank russo mags     only these
//   node tools/sprite_sheet.js --silhouette         solid black: if you can still tell everyone apart, the silhouettes work
//   node tools/sprite_sheet.js --walk               the six walk frames of each character instead of idle
//   --scale N (default 4)   --out file.png
const fs = require('fs'), path = require('path');
const { loadGame, ROOT } = require('./load_game');
const { png, frameToRGBA } = require('./png');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const flags = new Set(args.filter(a => a.startsWith('--')));
const valued = new Set([opt('--scale'), opt('--out')]);
const g = loadGame({ files: ['src/01_core.js', 'src/04_people.js'] });
const ids = args.filter(a => !a.startsWith('--') && !valued.has(a));
const cast = ids.length ? ids : Object.keys(g.CAST_DEFS);
for (const id of cast) if (!g.CAST_DEFS[id]) { console.error('no cast member ' + id); process.exit(1); }

const W = g.SPR_W, H = g.SPR_H, gap = 3, sil = flags.has('--silhouette'), walk = flags.has('--walk');
const cells = [];                                  // rows of frames
for (const id of cast) {
  const P = g.buildPerson(g.CAST_DEFS[id]);
  if (walk) cells.push(P.front.walk.concat(P.back.walk)); else cells.push([P.front.idle[0], P.back.idle[0]]);
}
// characters across, views down (idle), or one character per row (walk)
const cols = walk ? 12 : cast.length, rows = walk ? cast.length : 2;
const ww = cols * (W + gap), hh = rows * (H + gap), rgba = new Uint8Array(ww * hh * 4);
for (let i = 0; i < rgba.length; i += 4) { rgba[i] = 236; rgba[i + 1] = 233; rgba[i + 2] = 239; rgba[i + 3] = 255; }
cells.forEach((frames, ci) => frames.forEach((f, k) => {
  const col = walk ? k : ci, row = walk ? ci : k, px = frameToRGBA(f, W, H, g.PAL_HEX, g.T);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = (y * W + x) * 4; if (!px[s + 3]) continue;
    const d = ((row * (H + gap) + y) * ww + col * (W + gap) + x) * 4;
    if (sil) { rgba[d] = rgba[d + 1] = rgba[d + 2] = 0; } else rgba.set(px.subarray(s, s + 4), d);
  }
}));
const out = path.resolve(ROOT, opt('--out', 'shots/' + (sil ? 'cast_silhouette' : walk ? 'cast_walk' : 'cast') + '.png'));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png(ww, hh, rgba, +opt('--scale', 4)));
console.log('wrote ' + path.relative(ROOT, out) + ' (' + cast.join(', ') + ')');
