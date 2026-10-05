// Minimal PNG reader (no dependencies): 8-bit grey, RGB, grey+alpha, RGBA, and 1/2/4/8-bit indexed, which covers
// what Aseprite, Pixelorama, Piskel, Krita and GIMP save. Interlaced and 16-bit files are refused with a message.
//   readPng(buffer) -> { width, height, rgba: Uint8Array (width*height*4) }
const zlib = require('zlib');
function readPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG file');
  let pos = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0, plte = null, trns = null; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), kind = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; interlace = data[12]; }
    else if (kind === 'PLTE') plte = data;
    else if (kind === 'tRNS') trns = data;
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    pos += 12 + len;
  }
  if (interlace) throw new Error('interlaced PNG: save it again without interlacing');
  if (depth === 16) throw new Error('16-bit PNG: save it as 8-bit');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!channels) throw new Error('unsupported PNG colour type ' + type);
  if (type !== 3 && depth !== 8) throw new Error('unsupported bit depth ' + depth);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bitsPP = channels * depth, stride = Math.ceil(w * bitsPP / 8), bpp = Math.max(1, bitsPP >> 3);
  const px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {                                       // undo the per-row filters
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), o = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[o + x - bpp] : 0, b = y ? px[o - stride + x] : 0, c = x >= bpp && y ? px[o - stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[o + x] = v & 255;
    }
  }
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = (y * w + x) * 4, o = y * stride;
    if (type === 3) {
      const i = depth === 8 ? px[o + x] : (px[o + ((x * depth) >> 3)] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1);
      rgba[d] = plte[i * 3]; rgba[d + 1] = plte[i * 3 + 1]; rgba[d + 2] = plte[i * 3 + 2]; rgba[d + 3] = trns && i < trns.length ? trns[i] : 255;
    } else {
      const s = o + x * channels;
      if (type === 0 || type === 4) { rgba[d] = rgba[d + 1] = rgba[d + 2] = px[s]; rgba[d + 3] = type === 4 ? px[s + 1] : 255; }
      else { rgba[d] = px[s]; rgba[d + 1] = px[s + 1]; rgba[d + 2] = px[s + 2]; rgba[d + 3] = type === 6 ? px[s + 3] : 255; }
    }
  }
  return { width: w, height: h, rgba };
}
module.exports = { readPng };
