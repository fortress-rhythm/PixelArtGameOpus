// @ts-check
// =================================================================== CINEMATIC CORE: FRAMEBUFFER AND LAYERS
// After the scene's config: needs W, H, IY0, IY1 (the image rows between any letterbox bars), IH and T.
const fb = new Uint8Array(W * H);     // palette indices
const lid = new Uint8Array(W * H);    // layer ids (light masks)

function pset(x, y, c, id) {
  if (x < 0 || x >= W || y < IY0 || y >= IY1) return;
  const i = y * W + x; fb[i] = c; lid[i] = id;
}
function fillRect(x, y, w, h, c, id) {
  const x0 = Math.max(0, x), x1 = Math.min(W, x + w), y0 = Math.max(IY0, y), y1 = Math.min(IY1, y + h);
  for (let yy = y0; yy < y1; yy++) {
    let i = yy * W + x0;
    for (let xx = x0; xx < x1; xx++, i++) { fb[i] = c; lid[i] = id; }
  }
}
// remap a single pixel if its layer id is accepted by mask (bitmask of layer ids)
function premap(x, y, map, mask) {
  if (x < 0 || x >= W || y < IY0 || y >= IY1) return;
  const i = y * W + x;
  if (mask & (1 << lid[i])) fb[i] = map[fb[i]];
}

// ------------------------------------------------------------------ layer buffers
function makeLayer(w, h, f, defId) {
  return { w, h, f, buf: new Uint8Array(w * h).fill(T), ids: new Uint8Array(w * h).fill(defId), defId };
}
function lset(ly, x, y, c, id) {
  if (x < 0 || y < 0 || x >= ly.w || y >= ly.h) return;
  const i = y * ly.w + x; ly.buf[i] = c; ly.ids[i] = id === undefined ? ly.defId : id;
}
function lget(ly, x, y) { return (x < 0 || y < 0 || x >= ly.w || y >= ly.h) ? T : ly.buf[y * ly.w + x]; }
function lrect(ly, x, y, w, h, c, id) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) lset(ly, xx, yy, c, id);
}
// blit a layer at camera offset (layer y maps to image row y when offset is 0)
function blit(ly, ox, oy) {
  const buf = ly.buf, ids = ly.ids, lw = ly.w;
  for (let r = 0; r < IH; r++) {
    const sy = r + oy;
    if (sy < 0 || sy >= ly.h) continue;
    let si = sy * lw + ox, di = (r + IY0) * W;
    for (let x = 0; x < W; x++, si++, di++) {
      const sx = x + ox;
      if (sx < 0 || sx >= lw) continue;
      const c = buf[si];
      if (c !== T) { fb[di] = c; lid[di] = ids[si]; }
    }
  }
}
