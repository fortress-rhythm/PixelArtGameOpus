// @ts-check
// =================================================================== PORTRAITS (bust, 64 x 72, generated like the dolls)
// A portrait is drawn from the same definition as the character's doll (04_people.js): the same costume key, hat,
// hair, body and signature features, plus a few facial measurements in def.face. So the doll and the portrait
// always agree, and a signature feature (glasses, a scarf, a buttonhole flower) reads at both sizes.
//
// def.face (all optional; defaults follow the doll):
//   faceW 10..14   half-width of the face in pixels        jaw 'square' | 'round' | 'point'   jawW 3..10  chin half-width
//   noseLen 4..8   eyeGap 4..7 (eye centre from the middle)  brow 1 | 2 (thickness)
//   lips (coloured lips)  lines (age lines)  stubble  freckles
// Expressions: neutral, happy, wry, angry, worried, surprised. A second frame per expression has the mouth open,
// for talking. Light comes from the left, like everywhere else in the game.
const PORTRAIT_W = 64, PORTRAIT_H = 72;
const PORTRAIT_EXPRS = ['neutral', 'happy', 'wry', 'angry', 'worried', 'surprised'];
const PORTRAITS = {};                                   // cache: id|expr|open -> frame

/** @param {any} def */
function faceOf(def) {
  const f = def.face || {}, fem = def.body === 'skirt' || def.body === 'dress';
  return {
    faceW: f.faceW || (def.wide ? 13 : fem ? 11 : 12), jaw: f.jaw || (fem ? 'round' : 'square'),
    jawW: f.jawW !== undefined ? f.jawW : (def.wide ? 8 : fem ? 4 : 6), noseLen: f.noseLen || (fem ? 5 : 6),
    eyeGap: f.eyeGap || (fem ? 5 : 6), brow: f.brow || (fem ? 1 : 2),
    lips: f.lips !== undefined ? f.lips : fem, lines: !!f.lines, stubble: !!f.stubble, freckles: !!f.freckles
  };
}
/**
 * @param {any} def the character definition (CAST_DEFS entry)
 * @param {string} expr one of PORTRAIT_EXPRS
 * @param {boolean} open mouth open (talking)
 */
function drawPortrait(def, expr, open) {
  const f = new Uint8Array(PORTRAIT_W * PORTRAIT_H).fill(T), K = def.key, F = faceOf(def), cx = 32;
  const sig = (/** @type {string} */ n) => !!def.sig && def.sig.indexOf(n) >= 0;
  /** @param {number} x @param {number} y @param {number|undefined} c */
  function p(x, y, c) { if (c === undefined || c === T) return; x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < PORTRAIT_W && y < PORTRAIT_H) f[y * PORTRAIT_W + x] = c; }
  /** @param {number} x @param {number} y */
  function g(x, y) { return (x < 0 || y < 0 || x >= PORTRAIT_W || y >= PORTRAIT_H) ? T : f[y * PORTRAIT_W + x]; }
  const top = 14, eyeY = 32, chinY = 47, fw = F.faceW;
  /** half-width of the face at row y, or -1 outside it @param {number} y */
  function hw(y) {
    if (y < top || y > chinY) return -1;
    if (y < 31) { const t = (y - 31) / (31 - top + 0.5); return fw * Math.sqrt(Math.max(0, 1 - t * t)); }
    const u = (y - 31) / (chinY - 31), pw = F.jaw === 'square' ? 3.2 : F.jaw === 'round' ? 1.7 : 1.05;
    return fw + (F.jawW - fw) * Math.pow(u, pw);
  }
  // ---------------- hair behind the head
  if (def.hair === 'bob' || def.hair === 'long') {
    const bottom = def.hair === 'long' ? 62 : 46;
    for (let y = 11; y <= bottom; y++) { const w = fw + 3 - (y > bottom - 6 ? (y - bottom + 6) * 0.6 : 0) - (y < 16 ? (16 - y) * 1.1 : 0); for (let x = -w; x <= w; x++) p(cx + x, y, (x < -w + 3 && y < 30) ? K.a : K.A); }
  }
  if (def.hair === 'curly') for (let y = 8; y <= 40; y++) { const w = fw + 4 - (y > 32 ? (y - 32) : 0) - (y < 13 ? (13 - y) * 1.2 : 0); for (let x = -w; x <= w; x++) p(cx + x, y, (hashi(Math.round(x) >> 1, y >> 1) & 3) === 0 ? K.a : K.A); }
  if (def.hair === 'bun') for (let y = 6; y <= 18; y++) for (let x = -6; x <= 6; x++) if (x * x + (y - 12) * (y - 12) <= 34) p(cx - fw + 3 + x, y, (x < -2 && y < 11) ? K.a : K.A);
  // ---------------- neck and body
  for (let y = 40; y <= 60; y++) for (let x = -6; x <= 5; x++) p(cx + x, y, x > 1 ? K.s : K.S);
  for (let y = 56; y < PORTRAIT_H; y++) {
    const w = Math.min(31, 13 + (y - 56) * 1.7 + (def.wide ? 1 : 0));
    for (let x = -w; x <= w; x++) p(cx + x, y, x < -w * 0.55 ? K.K : x > w * 0.4 ? K.c : K.C);
  }
  const fem = def.body === 'skirt' || def.body === 'dress';
  if (def.body === 'vest') {                                               // waistcoat over a shirt, bow tie
    for (let y = 56; y < PORTRAIT_H; y++) { const v = Math.min(9, 4 + (y - 56) * 0.4); for (let x = -v; x <= v; x++) p(cx + x, y, K.W); }
    for (let x = -3; x <= 3; x++) p(cx + x, 57, K.N); p(cx - 4, 56, K.N); p(cx + 4, 56, K.N); p(cx - 4, 58, K.N); p(cx + 4, 58, K.N);
  } else if (fem) {                                                        // neckline, no tie
    for (let y = 56; y < 63; y++) { const v = 6 - (y - 56); for (let x = -v; x <= v; x++) p(cx + x, y, x > 1 ? K.s : K.S); }
  } else {                                                                 // shirt, lapels, tie
    for (let y = 56; y < PORTRAIT_H; y++) { const v = Math.min(6, (y - 55) * 0.5); for (let x = -v; x <= v; x++) p(cx + x, y, K.W); p(cx - v - 1, y, K.c); p(cx + v + 1, y, K.c); if (y > 57 && def.body !== 'long') { p(cx, y, K.N); if (y > 60) p(cx + 1, y, K.N); } }
    if (def.body === 'coat' || def.body === 'long') for (let y = 52; y <= 58; y++) { p(cx - 9 + (y - 52) * 0.3, y, K.K); p(cx - 8 + (y - 52) * 0.3, y, K.C); p(cx + 8 - (y - 52) * 0.3, y, K.c); p(cx + 9 - (y - 52) * 0.3, y, K.c); }  // turned-up collar
  }
  if (sig('badge')) { p(cx - 15, 62, K.X); p(cx - 14, 62, K.X); p(cx - 15, 63, K.X); p(cx - 14, 63, C.HOT); }
  if (sig('flower')) { p(cx - 10, 60, K.V); p(cx - 11, 61, K.V); p(cx - 9, 61, K.V); p(cx - 10, 62, K.V); p(cx - 10, 61, C.PALEY); p(cx - 10, 63, C.G2); }
  if (sig('satchel')) for (let y = 56; y < PORTRAIT_H; y++) { const x = cx + 14 - (y - 56) * 1.6; p(x, y, K.P); p(x + 1, y, K.P); }
  if (sig('scarf')) {
    for (let y = 50; y <= 57; y++) { const w = 8 + (y - 50) * 0.4; for (let x = -w; x <= w; x++) p(cx + x, y, x > w * 0.4 ? C.PLUM : K.V); }
    for (let y = 58; y < PORTRAIT_H; y++) for (let x = -12; x <= -7; x++) p(cx + x, y, ((y >> 1) & 1) ? K.V : C.PLUM);
  }
  // ---------------- ears and face
  for (let y = eyeY - 1; y <= eyeY + 5; y++) { p(cx - fw - 1, y, K.S); p(cx - fw, y, K.S); p(cx + fw, y, K.s); p(cx + fw + 1, y, K.s); }
  for (let y = top; y <= chinY; y++) { const w = hw(y); if (w < 0) continue; for (let x = -w; x <= w; x++) p(cx + x, y, x > w * 0.38 ? K.s : (x < -w * 0.55 && y > 22 && y < 41) ? K.L : K.S); }
  for (let x = -4; x <= 4; x++) p(cx + x, chinY + 1, K.s);
  // ---------------- brows
  let bL = [0, 0, 0, 0], bR = [0, 0, 0, 0];
  if (expr === 'angry') { bL = [-1, 0, 1, 2]; bR = [2, 1, 0, -1]; }
  else if (expr === 'worried') { bL = [1, 0, -1, -1]; bR = [-1, -1, 0, 1]; }
  else if (expr === 'surprised') { bL = [-2, -2, -2, -2]; bR = [-2, -2, -2, -2]; }
  else if (expr === 'wry') bR = [-1, -2, -2, -1];
  else if (expr === 'happy') { bL = [0, -1, -1, 0]; bR = [0, -1, -1, 0]; }
  const by = eyeY - 3, ex1 = cx - F.eyeGap, ex2 = cx + F.eyeGap - 1;
  for (let i = 0; i < 4; i++) { p(ex1 - 2 + i, by + bL[i], K.A); p(ex2 - 1 + i, by + bR[i], K.A); if (F.brow > 1) { p(ex1 - 2 + i, by + bL[i] - 1, K.A); p(ex2 - 1 + i, by + bR[i] - 1, K.A); } }
  // ---------------- eyes
  /** @param {number} x */
  function eye(x) {
    const lid = expr === 'angry', smile = expr === 'happy';
    if (expr === 'surprised') { p(x - 1, eyeY - 1, C.CREAM); p(x, eyeY - 1, C.CREAM); p(x + 1, eyeY - 1, C.CREAM); }
    if (smile) { p(x - 1, eyeY + 1, C.INK); p(x, eyeY, C.INK); p(x + 1, eyeY + 1, C.INK); return; }
    if (lid) { p(x - 1, eyeY, K.s); p(x, eyeY, C.INK); p(x + 1, eyeY, C.INK); }
    else { p(x - 1, eyeY, C.INK); p(x, eyeY, C.INK); p(x + 1, eyeY, C.INK); }
    p(x - 1, eyeY + 1, C.CREAM); p(x, eyeY + 1, C.INK); p(x + 1, eyeY + 1, C.INK);
    if (expr === 'worried') p(x, eyeY + 2, K.s);
  }
  eye(ex1); eye(ex2);
  if (F.lines) { p(ex1 - 3, eyeY + 1, K.s); p(ex2 + 3, eyeY + 1, K.s); p(ex2 + 3, eyeY + 2, K.s); p(cx - 6, eyeY + 8, K.s); p(cx + 6, eyeY + 8, K.s); }
  if (F.freckles) for (const [dx, dy] of [[-7, 5], [-5, 6], [-8, 7], [5, 5], [7, 6], [4, 7]]) p(cx + dx, eyeY + dy, K.s);
  if (sig('glasses')) for (const ex of [ex1, ex2]) {
    for (let x = ex - 3; x <= ex + 3; x++) { p(x, eyeY - 2, K.Y); p(x, eyeY + 3, K.Y); }
    for (let y = eyeY - 1; y <= eyeY + 2; y++) { p(ex - 3, y, K.Y); p(ex + 3, y, K.Y); }
    p(ex - 2, eyeY - 1, C.WL);
    if (ex === ex1) for (let x = ex + 4; x < ex2 - 3; x++) p(x, eyeY, K.Y);
  }
  // ---------------- nose and mouth
  const nt = eyeY + F.noseLen;
  for (let y = eyeY + 1; y < nt; y++) p(cx + 1, y, K.s);
  p(cx - 1, nt, K.s); p(cx, nt, K.S); p(cx + 1, nt, K.s); p(cx + 2, nt, K.s); p(cx - 2, nt + 1, K.s); p(cx + 2, nt + 1, K.s);
  const my = nt + 4, mw = F.lips ? 2 : 3, m = F.lips ? K.m : K.s;
  if (sig('moustache')) for (let x = -4; x <= 4; x++) { p(cx + x, my - 2, K.A); if (Math.abs(x) < 4) p(cx + x, my - 1, K.A); }
  if (open || expr === 'surprised') {
    for (let x = -mw + 1; x <= mw - 1; x++) { p(cx + x, my, C.INK); p(cx + x, my + 1, C.INK); }
    p(cx - mw, my, m); p(cx + mw, my, m); p(cx - mw + 1, my + 2, m); p(cx + mw - 1, my + 2, m); p(cx, my + 2, m);
  } else if (expr === 'happy') { for (let x = -mw + 1; x <= mw - 1; x++) p(cx + x, my + 1, m); p(cx - mw, my, m); p(cx + mw, my, m); }
  else if (expr === 'wry') { for (let x = -mw; x <= 0; x++) p(cx + x, my, m); for (let x = 1; x <= mw + 1; x++) p(cx + x, my - 1, m); p(cx + mw + 2, my - 2, K.s); }
  else if (expr === 'angry') { for (let x = -mw; x <= mw; x++) p(cx + x, my, m); p(cx - mw - 1, my + 1, m); p(cx + mw + 1, my + 1, m); }
  else if (expr === 'worried') { for (let x = -mw + 1; x <= mw - 1; x++) p(cx + x, my, m); p(cx - mw, my + 1, m); p(cx + mw, my + 1, m); }
  else for (let x = -mw; x <= mw; x++) p(cx + x, my, m);
  if (F.lips && !open && expr !== 'surprised') { p(cx - 1, my + 1, C.OX); p(cx, my + 1, C.OX); p(cx + 1, my + 1, C.OX); }
  if (def.idle === 'smoke' && !open) { for (let x = 3; x <= 8; x++) p(cx + x, my + 1, C.CREAM); p(cx + 9, my + 1, C.AMB); p(cx + 10, my, C.CRS); }
  if (sig('beard')) for (let y = my - 1; y <= chinY + 2; y++) { const w = hw(Math.min(y, chinY)) + 1; for (let x = -w; x <= w; x++) { const q = g(cx + Math.round(x), y); if (y > my + 2 || Math.abs(x) > mw + 1) if (q !== C.INK && (Math.abs(x) > 4 || y > my + 2)) p(cx + x, y, (x + y) % 4 ? K.A : K.a); } }
  if (F.stubble) for (let y = my - 1; y <= chinY; y++) { const w = hw(y); for (let x = -w + 1; x <= w - 1; x++) { const q = g(cx + Math.round(x), y); if (((x + y) & 1) === 0 && (y > my + 1 || Math.abs(x) > mw + 1) && y > nt + 1 && q !== C.INK && q !== m) p(cx + x, y, K.s); } }
  // ---------------- hair in front
  if (def.hair === 'short' || def.hair === 'slick') for (let y = top - 1; y <= top + 9; y++) { const w = hw(Math.max(top, y)) + 1; for (let x = -w; x <= w; x++) { const edge = Math.abs(x) > w - 3; if (y < top + 5 || (edge && y < top + 11)) p(cx + x, y, (x < -w * 0.3 && y < top + 4) || (def.hair === 'slick' && y === top + 1 && x < 4) ? K.a : K.A); } }
  if (def.hair === 'bob' || def.hair === 'long') for (let y = top - 2; y <= top + 7; y++) { const w = hw(Math.max(top, y)) + 2; for (let x = -w; x <= w; x++) if (y < top + 3 || (x > -2 && y < top + 5 + (x > 2 ? 2 : 0)) || Math.abs(x) > w - 3) p(cx + x, y, (x < -w * 0.4 && y < top + 3) ? K.a : K.A); }
  if (def.hair === 'bun') for (let y = top - 1; y <= top + 6; y++) { const w = hw(Math.max(top, y)) + 1; for (let x = -w; x <= w; x++) if (y < top + 3 || Math.abs(x) > w - 2) p(cx + x, y, x < -w * 0.3 ? K.a : K.A); }
  if (def.hair === 'curly') for (let y = top - 3; y <= top + 5; y++) { const w = hw(Math.max(top, y)) + 3; for (let x = -w; x <= w; x++) if (y < top + 2 || Math.abs(x) > w - 4) p(cx + x, y, (hashi(Math.round(x) >> 1, y >> 1) & 3) === 0 ? K.a : K.A); }
  if (def.hair === 'pomp') for (let y = top - 6; y <= top + 7; y++) { const w = hw(Math.max(top, y)) + 1 - (y < top - 2 ? (top - 2 - y) * 1.5 : 0); for (let x = -w; x <= w; x++) if (y < top + 4 || Math.abs(x) > w - 3) p(cx + x + (y < top ? 2 : 0), y, (x < -w * 0.2 && y < top + 2) ? K.a : K.A); }
  if (def.hair === 'bald') for (let y = top + 6; y <= top + 14; y++) { const w = hw(y) + 1; p(cx - w, y, K.A); p(cx - w + 1, y, K.A); p(cx + w, y, K.A); p(cx + w - 1, y, K.A); }
  // ---------------- hats
  const hat = def.hat;
  /** a crown from row y0 to y1, half-width w, with an optional band (rows bandY..bandY+1) @param {number} y0 @param {number} y1 @param {number} w @param {number} bandY */
  function crown(y0, y1, w, bandY) { for (let y = y0; y <= y1; y++) { const ww = w - (y < y0 + 3 ? (y0 + 3 - y) : 0); for (let x = -ww; x <= ww; x++) p(cx + x, y, (y >= bandY && y <= bandY + 1) ? K.b : (x < -ww * 0.5 ? C.ST2 : x > ww * 0.4 ? K.h : K.H)); } }
  /** @param {number} y0 @param {number} y1 @param {number} w */
  function brim(y0, y1, w) { for (let y = y0; y <= y1; y++) { const ww = w - (y === y1 ? 2 : 0) - (y === y0 ? 1 : 0); for (let x = -ww; x <= ww; x++) p(cx + x, y, y >= y1 - 1 ? K.h : K.H); } }
  /** shadow the hat throws on the forehead @param {number} y0 @param {number} y1 */
  function shade(y0, y1) { for (let y = y0; y <= y1; y++) { const w = hw(y); for (let x = -w; x <= w; x++) { const q = g(cx + Math.round(x), y); if (q === K.S || q === K.L) p(cx + x, y, K.s); } } }
  if (hat === 'fedora') { crown(6, 19, fw - 1, 16); for (let x = -3; x <= 3; x++) p(cx + x, 6, K.h); brim(19, 22, fw + 8); shade(23, 24); }
  else if (hat === 'homburg') { crown(3, 19, fw - 1, 16); for (let x = -2; x <= 2; x++) p(cx + x, 4, K.h); brim(19, 21, fw + 6); p(cx - fw - 6, 18, K.H); p(cx + fw + 6, 18, K.h); shade(22, 23); }
  else if (hat === 'bowler') { for (let y = 5; y <= 19; y++) { const t = (y - 13) / 9, w = (fw - 1) * Math.sqrt(Math.max(0, 1 - t * t * (y < 13 ? 1 : 0))); for (let x = -w; x <= w; x++) p(cx + x, y, (y >= 16 && y <= 17) ? K.b : x < -w * 0.4 ? C.ST2 : x > w * 0.4 ? K.h : K.H); } brim(19, 21, fw + 4); shade(22, 23); }
  else if (hat === 'cloche') { for (let y = 8; y <= 27; y++) { const t = (y - 20) / 13, w = (fw + 2) * Math.sqrt(Math.max(0, 1 - (y < 20 ? t * t : 0))); for (let x = -w; x <= w; x++) p(cx + x, y, (y >= 22 && y <= 23) ? K.b : x < -w * 0.4 ? C.ST2 : x > w * 0.4 ? K.h : K.H); } shade(28, 29); }
  else if (hat === 'newsboy') { for (let y = 8; y <= 20; y++) { const w = fw + 3 - (y < 11 ? (11 - y) * 2 : 0); for (let x = -w; x <= w; x++) p(cx + x + 1, y, x < -w * 0.4 ? C.ST2 : x > w * 0.5 ? K.h : K.H); } for (let x = -fw + 1; x <= fw + 1; x++) { p(cx + x, 21, K.h); p(cx + x, 22, C.INK); } shade(23, 24); }
  else if (hat === 'beret') { for (let y = 7; y <= 17; y++) { const w = fw + 4 - Math.abs(y - 12) * 0.9; for (let x = -w; x <= w; x++) p(cx + x - 3, y, x > w * 0.5 ? K.h : K.H); } p(cx - 3, 6, K.h); p(cx - 3, 5, K.h); }
  else if (hat === 'cap' || hat === 'doorman') { crown(7, 19, fw, 15); if (hat === 'cap') { p(cx, 11, K.X); p(cx - 1, 12, K.X); p(cx + 1, 12, K.X); } else { p(cx, 11, K.b); } for (let y = 20; y <= 21; y++) for (let x = -fw + 2; x <= fw + 3; x++) p(cx + x, y, C.INK); shade(22, 23); }
  else if (hat === 'pillbox') { for (let y = 8; y <= 14; y++) for (let x = -7; x <= 7; x++) p(cx + x - 4, y, x > 3 ? K.h : K.H); }
  // ---------------- outline
  const src = f.slice();
  for (let y = 0; y < PORTRAIT_H; y++) for (let x = 0; x < PORTRAIT_W; x++) {
    if (src[y * PORTRAIT_W + x] !== T) continue;
    const n = (x > 0 && src[y * PORTRAIT_W + x - 1] !== T) || (x < PORTRAIT_W - 1 && src[y * PORTRAIT_W + x + 1] !== T) ||
              (y > 0 && src[(y - 1) * PORTRAIT_W + x] !== T) || (y < PORTRAIT_H - 1 && src[(y + 1) * PORTRAIT_W + x] !== T);
    if (n) f[y * PORTRAIT_W + x] = K.o;
  }
  return f;
}
/** the portrait of a cast member, cached @param {string} id @param {string} expr @param {boolean} [open] */
function portraitOf(id, expr, open) {
  const k = id + '|' + expr + '|' + (open ? 1 : 0);
  return PORTRAITS[k] || (PORTRAITS[k] = drawPortrait(CAST_DEFS[id], expr, !!open));
}
