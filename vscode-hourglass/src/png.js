// Minimal PNG writer (a copy of tools/png.js, so the extension works when copied out of the repository).
//   png(width, height, rgba, scale) -> Buffer      rgba: Uint8Array of width*height*4
//   frameToRGBA(frame, w, h, palHex, transparent) -> Uint8Array
const zlib = require('zlib');
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc(buf) { let x = 0xffffffff; for (const v of buf) x = CRC[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(w, h, rgba, scale) {
  scale = scale || 1;
  const W = w * scale, H = h * scale, raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = (((y / scale) | 0) * w + ((x / scale) | 0)) * 4, d = y * (W * 4 + 1) + 1 + x * 4;
    raw[d] = rgba[s]; raw[d + 1] = rgba[s + 1]; raw[d + 2] = rgba[s + 2]; raw[d + 3] = rgba[s + 3];
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function frameToRGBA(frame, w, h, palHex, transparent) {
  const out = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const c = frame[i]; if (c === transparent || palHex[c] === undefined) continue;
    const hx = palHex[c]; out[i * 4] = parseInt(hx.slice(0, 2), 16); out[i * 4 + 1] = parseInt(hx.slice(2, 4), 16); out[i * 4 + 2] = parseInt(hx.slice(4, 6), 16); out[i * 4 + 3] = 255;
  }
  return out;
}
module.exports = { png, frameToRGBA };
