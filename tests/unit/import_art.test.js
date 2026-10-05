// the PNG reader and the art importer
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), os = require('os'), path = require('path'), zlib = require('zlib');
const { readPng } = require('../../tools/png_read');
const { png } = require('../../tools/png');
const { importArt } = require('../../tools/import_art');
const { artFromRGBA } = require('../../tools/art_core');

// a PNG writer with any colour type and row filter, to test what editors actually save
function crc(b) { let c, x = 0xffffffff; for (const v of b) { c = (x ^ v) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; x = c ^ (x >>> 8); } return (x ^ 0xffffffff) >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); }
function makePng(w, h, type, depth, rows, filter, extra) {
  const stride = rows[0].length, raw = [];
  for (let y = 0; y < h; y++) {
    const cur = rows[y], prev = y ? rows[y - 1] : Buffer.alloc(stride), bpp = Math.max(1, ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type] * depth) >> 3), out = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let p = 0; if (filter === 1) p = a; else if (filter === 2) p = b; else if (filter === 3) p = (a + b) >> 1;
      else if (filter === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[x] = (cur[x] - p) & 255;
    }
    raw.push(Buffer.from([filter]), out);
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = depth; ih[9] = type;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih)].concat(extra || [], [chunk('IDAT', zlib.deflateSync(Buffer.concat(raw))), chunk('IEND', Buffer.alloc(0))]));
}

test('reads RGBA as the game writes it', () => {
  const rgba = new Uint8Array([255, 0, 0, 255, 0, 0, 0, 0, 1, 2, 3, 255, 9, 8, 7, 200]);
  assert.deepStrictEqual([...readPng(png(2, 2, rgba, 1)).rgba], [...rgba]);
});
test('reads RGB with every row filter', () => {
  const rows = [Buffer.from([10, 20, 30, 40, 50, 60]), Buffer.from([70, 80, 90, 100, 110, 120]), Buffer.from([5, 15, 25, 35, 45, 55])];
  for (const f of [0, 1, 2, 3, 4]) {
    const img = readPng(makePng(2, 3, 2, 8, rows, f));
    assert.deepStrictEqual([...img.rgba.slice(0, 8)], [10, 20, 30, 255, 40, 50, 60, 255], 'filter ' + f);
    assert.deepStrictEqual([...img.rgba.slice(16, 24)], [5, 15, 25, 255, 35, 45, 55, 255], 'filter ' + f);
  }
});
test('reads 4-bit indexed with a transparent colour (as pixel editors save small palettes)', () => {
  const plte = chunk('PLTE', Buffer.from([0, 0, 0, 125, 103, 82, 241, 199, 160])), trns = chunk('tRNS', Buffer.from([0]));
  const img = readPng(makePng(3, 1, 3, 4, [Buffer.from([0x12, 0x00])], 0, [plte, trns]));
  assert.deepStrictEqual([...img.rgba], [125, 103, 82, 255, 241, 199, 160, 255, 0, 0, 0, 0]);
});
test('refuses interlaced and 16-bit files with a useful message', () => {
  const ih = (depth, inter) => { const b = makePng(1, 1, 2, 8, [Buffer.alloc(3)], 0); b[24] = depth; b[28] = inter; return b; };
  assert.throws(() => readPng(ih(8, 1)), /interlac/); assert.throws(() => readPng(ih(16, 0)), /16-bit/);
});
test('costume colours become slot letters; other colours get their own', () => {
  const pal = ['000000', '7d6752', 'c08a69', 'd9443a'], key = { o: 0, C: 1, S: 2 };
  const rgba = new Uint8Array([125, 103, 82, 255, 192, 138, 105, 255, 217, 68, 58, 255, 0, 0, 0, 0, 200, 70, 60, 255, 0, 0, 0, 255]);
  const r = artFromRGBA(3, 2, rgba, pal, key);
  assert.deepStrictEqual(r.rows, ['CS0', '.0o']);
  assert.deepStrictEqual(r.colours, { 0: 3 });
  assert.strictEqual(r.offPalette, 1);
});
test('the importer reads a file, checks its size and uses the cast member\'s costume', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hg-art-')), f = path.join(dir, 'head.png');
  // 3x2: Frank's coat tan, his skin, and red
  fs.writeFileSync(f, png(3, 2, new Uint8Array([125, 103, 82, 255, 192, 138, 105, 255, 217, 68, 58, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 1));
  const r = importArt(f, { for: 'frank' });
  assert.strictEqual(r.rows[0][0], 'C'); assert.strictEqual(r.rows[0][1], 'S'); assert.strictEqual(r.rows[1], '...');
  fs.writeFileSync(f, png(30, 30, new Uint8Array(30 * 30 * 4), 1));
  assert.throws(() => importArt(f, { for: 'frank' }), /at most 20x20/);
  fs.rmSync(dir, { recursive: true, force: true });
});
