// @ts-check
// =================================================================== CINEMATIC CORE: DISPLAY AND MAIN LOOP
// Loads last. The scene provides sceneBuild(), loopReset(), update(f), step(), render(f), simFrame and CINE_S.
// step() advances simFrame by one and wraps it where the scene's loop starts again.
const screenCv = /** @type {HTMLCanvasElement} */ (document.getElementById('screen'));
const sctx = screenCv.getContext('2d', { alpha: false });
const offCv = document.createElement('canvas');
offCv.width = W; offCv.height = H;
const octx = offCv.getContext('2d');
const img = octx.createImageData(W, H);
const out32 = new Uint32Array(img.data.buffer);
const PAL32 = new Uint32Array(256);
for (let i = 0; i < NPAL; i++) {
  const v = parseInt(PAL_HEX[i], 16);
  PAL32[i] = (0xff << 24 | (v & 0xff) << 16 | (v >> 8 & 0xff) << 8 | (v >> 16 & 0xff)) >>> 0;
}
let scale = 1, offX = 0, offY = 0;
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const bw = Math.floor(window.innerWidth * dpr), bh = Math.floor(window.innerHeight * dpr);
  screenCv.width = bw; screenCv.height = bh;
  scale = Math.max(1, Math.floor(Math.min(bw / W, bh / H)));
  offX = Math.floor((bw - W * scale) / 2); offY = Math.floor((bh - H * scale) / 2);
  sctx.imageSmoothingEnabled = false;
  sctx.fillStyle = '#000'; sctx.fillRect(0, 0, bw, bh);
}
function present() {
  for (let i = 0; i < W * H; i++) out32[i] = PAL32[fb[i]];
  octx.putImageData(img, 0, 0);
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(offCv, 0, 0, W, H, offX, offY, W * scale, H * scale);
}

const params = new URLSearchParams(location.search);
const FREEZE = params.get('freeze') === '1';
// mutable doubles live in a typed array so per-frame stores never box a heap number
const clk = new Float64Array(5);            // 0 accumulator, 1 last timestamp, 2 stat sum, 3 stat max, 4 stat count
clk[1] = -1;
// perf probe for verification (?stats=1 writes the mean frame cost into the title)
const STATS = params.get('stats') === '1';
function frameLoop(now) {
  if (clk[1] < 0) clk[1] = now;
  let dt = (now - clk[1]) / 1000; clk[1] = now;
  if (dt > 0.25) dt = 0.25;
  const c0 = STATS ? performance.now() : 0;
  if (!FREEZE) { clk[0] += dt; while (clk[0] >= DT) { step(); clk[0] -= DT; } }
  render(simFrame); present();
  if (STATS) {
    const c = performance.now() - c0; clk[4]++; clk[2] += c; if (c > clk[3] && clk[4] > 60) clk[3] = c;
    if ((clk[4] % 120) === 0) document.title = 'avg ' + (clk[2] / clk[4]).toFixed(2) + 'ms max ' + clk[3].toFixed(2) + 'ms f' + simFrame;
  }
  requestAnimationFrame(frameLoop);
}
function init() {
  sceneBuild();
  loopReset();
  const seek = parseFloat(params.get('t') || '0');
  const target = Math.floor(clamp(isNaN(seek) ? 0 : seek, 0, CINE_S - DT) * FPS);
  simFrame = 0; update(0);
  while (simFrame < target) step();
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frameLoop);
}
init();
