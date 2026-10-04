
// =================================================================== PEOPLE (procedural paper dolls)
// Two drawn views: FRONT = facing SE (toward the viewer, turned right), BACK = facing NE.
// SW / NW are mirrors. Frames are Uint8 palette buffers, feet anchored at (SPR_AX, SPR_BY).
// The canvas leaves room above the tallest figure for a neck, a tall hat or a big hairdo (h up to about 36).
const SPR_W = 26, SPR_H = 46, SPR_AX = 13, SPR_BY = 44;
let SF = null;                                              // frame being drawn
function newFrame() { return new Uint8Array(SPR_W * SPR_H).fill(T); }
function sp(x, y, c) { if (c !== T && c !== undefined && x >= 0 && y >= 0 && x < SPR_W && y < SPR_H) SF[y * SPR_W + x] = c; }
function spr(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) sp(x + i, y + j, c); }
function spget(x, y) { return (x < 0 || y < 0 || x >= SPR_W || y >= SPR_H) ? T : SF[y * SPR_W + x]; }
function spline(x0, y0, x1, y1, c, w) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let k = 0; k <= n; k++) {
    const x = Math.round(lerp(x0, x1, k / n)), y = Math.round(lerp(y0, y1, k / n));
    for (let j = 0; j < (w || 1); j++) sp(x + j, y, c);
  }
}
// string map at (x0, y0). key maps chars to colours from the costume
function spmap(x0, y0, rows, key, flip) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let i = 0; i < row.length; i++) {
      const ch = row[flip ? row.length - 1 - i : i];
      if (ch === '.' || ch === ' ') continue;
      sp(x0 + i, y0 + r, key[ch]);
    }
  }
}
// dark outline around the silhouette (selective: lit top-left edge gets ink, rest black)
function outline(oc) {
  const src = SF.slice();
  for (let y = 0; y < SPR_H; y++) for (let x = 0; x < SPR_W; x++) {
    if (src[y * SPR_W + x] !== T) continue;
    const n = (x > 0 && src[y * SPR_W + x - 1] !== T) || (x < SPR_W - 1 && src[y * SPR_W + x + 1] !== T) ||
              (y > 0 && src[(y - 1) * SPR_W + x] !== T) || (y < SPR_H - 1 && src[(y + 1) * SPR_W + x] !== T);
    if (n) SF[y * SPR_W + x] = oc;
  }
}

// ------------------------------------------------------------------ costume palettes
// o outline, H/h/b hat, S/s/L skin, e eye, m mouth, A/a hair, C/c/K main garment (mid/dark/light),
// B belt, k buckle, T/t trousers or skirt, F shoes, W shirt, N tie, G gloves/hands override, X extra (buttons, badges),
// Y glasses frames, V accessory (scarf, flower), P prop (cane, satchel, case)
function costume(o) {
  const d = { o: C.BLK, S: C.SKM, s: C.SKS, L: C.SKL, e: C.INK, m: C.SKS, A: C.HAIRD, a: C.HAIRL,
              H: C.ST1, h: C.ST0, b: C.INK, C: C.S1, c: C.S0, K: C.S2, B: C.INK, k: C.BRASS,
              T: C.ST0, t: C.NAV, F: C.INK, W: C.CREAM, N: C.OX, X: C.BRASS, Y: C.CRS, V: C.CRIM, P: C.BRN };
  for (const k in o) d[k] = o[k];
  return d;
}
// ------------------------------------------------------------------ figure builder
// def: {h: height rows, body: 'coat'|'suit'|'skirt'|'dress'|'vest'|'long',
//       hat: 'fedora'|'cap'|'doorman'|'pillbox'|'homburg'|'bowler'|'cloche'|'newsboy'|'beret'|'none',
//       hair: 'short'|'slick'|'bob'|'bun'|'bald'|'long'|'curly'|'pomp', wide: 0|1 (stocky), key: costume}
// Silhouette (all optional; leaving them out draws the figure exactly as before):
//   neck 0..2 rows · shoulders -1..2 px each side · belly 0..2 px · flare (coat hem, default 1.4) · stance 0..2 px
//   lean -1..1 px (upper body back or forward) · stride (walk leg swing, default 1) · bounce (walk bob, default 1)
//   idle 'pockets'|'crossed'|'hips'|'smoke' (the standing pose)
//   sig: signature features, drawn on the doll and on the portrait: 'glasses', 'moustache', 'beard', 'scarf',
//        'flower', 'badge', 'satchel', 'cane', 'case'
// pose: {dir: 0 front / 1 back, q: leg swing -1..1, lift: 0/1 which foot lifted, arm: swing -1..1,
//        reach: 0..1, talk: 0/1, bob: 0/1, hold: item id, style: idle style}
function hasSig(def, name) { return !!def.sig && def.sig.indexOf(name) >= 0; }
function drawFigure(def, pose) {
  const K = def.key, back = pose.dir === 1, wd = def.wide ? 1 : 0;
  const top = SPR_BY - def.h + 1 + pose.bob;
  const fem = def.body === 'skirt' || def.body === 'dress';
  const neck = def.neck || 0, so = def.shoulders || 0, belly = def.belly || 0, stance = def.stance || 0;
  const flareK = def.flare === undefined ? 1.4 : def.flare, style = pose.style || null;
  // vertical landmarks
  const headTop = top + (def.hat === 'none' ? 1 : 3);             // first face row (brim row is headTop-1)
  const faceY = headTop, chin = faceY + 4, sh = chin + 1;           // shoulders row
  const waist = sh + (fem ? 6 : 7), hem = fem ? SPR_BY - 6 : SPR_BY - 6 - (def.body === 'long' ? -2 : def.body === 'coat' ? 0 : 5);
  const cx = SPR_AX;                                                // figure centre column
  const fwdX = 1, fwdY = back ? -0.5 : 0.5;
  // ---------------- neck (only when the definition asks for one: the head is lifted by that many rows)
  for (let r = 1; r <= neck; r++) { sp(cx - 1, chin + 1 - r, K.S); sp(cx, chin + 1 - r, K.S); sp(cx + 1, chin + 1 - r, K.s); }
  // ---------------- far arm (behind torso)
  const as = pose.arm;
  if (style !== 'crossed') {
    const sx = cx + 3 + wd + so;
    if (style === 'hips') { spline(sx, sh + 1, sx + 2, sh + 4, back ? K.C : K.c, 2); spline(sx + 2, sh + 4, sx, waist, back ? K.C : K.c, 2); }
    else if (style === 'pockets') spline(sx, sh + 1, sx, waist + 1, back ? K.C : K.c, 2);
    else {
      const hx = sx + Math.round(-as * 0.8 * fwdX), hy = waist + 1 + Math.round(-as * 0.6 * fwdY);
      spline(sx, sh + 1, hx, hy, back ? K.C : K.c, 2);
      spr(hx, hy + 1, 2, 1, back ? K.s : K.s);
    }
  }
  // ---------------- legs
  const q = pose.q;
  const hipY = hem - 1;
  for (let leg = 0; leg < 2; leg++) {
    const near = leg === 0, sgn = near ? 1 : -1;
    const baseX = near ? cx - 2 - stance : cx + 1 + stance, baseY = near ? SPR_BY : SPR_BY - 1;
    const dx = Math.round(q * sgn * 2.2 * fwdX), dy = Math.round(q * sgn * 2.2 * fwdY);
    const lift = (pose.lift === (near ? 1 : 2)) ? 1 : 0;
    const fx = baseX + dx, fy = baseY + dy - lift;
    const legC = fem ? (near ? K.L : K.S) : (near ? K.T : K.t);
    spline(baseX + (near ? 0 : 0), hipY, fx, fy - 1, legC, 2);
    // shoe: points along facing
    if (back) { sp(fx, fy, K.F); sp(fx + 1, fy, K.F); sp(fx + 1, fy - 1, fem ? K.F : legC); }
    else { spr(fx, fy, 3, 1, K.F); if (fem) sp(fx, fy - 1, K.F); }
  }
  // ---------------- lower garment (coat skirt / skirt / trousers top)
  if (def.body === 'coat' || def.body === 'long') {
    for (let y = waist + 1; y <= hem; y++) {
      const t = (y - waist) / (hem - waist), flare = Math.round(t * flareK);
      const x0 = cx - 3 - wd - flare + (y === hem ? Math.round(q * 0.6) : 0), x1 = cx + 3 + wd + flare + (y === hem ? Math.round(q * 0.6) : 0);
      for (let x = x0; x <= x1; x++) {
        let c = K.C;
        if (x <= x0) c = K.K; else if (x >= x1 - 1) c = K.c;
        if (!back && x === cx + 1) c = K.c;                        // front opening
        if (back && x === cx && y > waist + 3) c = K.c;            // back vent
        if (y === hem) c = x <= x0 + 1 ? K.C : K.c;
        sp(x, y, c);
      }
    }
  } else if (fem) {
    for (let y = waist + 1; y <= hem; y++) {
      const t = (y - waist) / (hem - waist), flare = def.body === 'dress' ? Math.round(t * 2) : 0;
      const x0 = cx - 3 - flare, x1 = cx + 2 + flare;
      for (let x = x0; x <= x1; x++) sp(x, y, x <= x0 ? K.T : x >= x1 ? K.t : K.T);
      if (!back) sp(cx, y, K.t);
    }
  } else {
    // suit / vest: trousers from waist to feet are the legs; add seat
    for (let y = waist + 1; y <= hipY; y++) for (let x = cx - 3 - wd; x <= cx + 2 + wd; x++) sp(x, y, x >= cx + 1 ? K.t : K.T);
  }
  // ---------------- torso
  for (let y = sh; y <= waist; y++) {
    const narrow = (y > waist - 2) ? 1 : 0, sw = (y === sh) ? 1 : 0;
    const sho = y <= sh + 2 ? so : y <= sh + 4 ? Math.trunc(so / 2) : 0;           // broad or narrow shoulders taper to the waist
    const bel = y >= waist - 3 ? belly - (y === waist - 3 || y === waist ? 1 : 0) : 0;  // the belly rounds out the front
    const x0 = cx - 4 - wd + narrow + sw - sho, x1 = cx + 4 + wd - narrow - sw + sho + Math.max(0, bel);
    for (let x = x0; x <= x1; x++) {
      let c = K.C;
      if (x <= x0) c = K.K; else if (x >= x1 - (back ? 0 : 1)) c = K.c;
      sp(x, y, c);
    }
  }
  if (!back) {
    // lapels + shirt + tie (V opening slightly right of centre: the chest faces SE)
    if (def.body === 'vest') {
      for (let y = sh; y <= waist; y++) { sp(cx - 4 - wd + 1, y, K.W); sp(cx + 3 + wd, y, K.W); }
      for (let y = sh; y <= sh + 2; y++) sp(cx, y, K.W), sp(cx + 1, y, K.W);
      sp(cx, sh, K.N); sp(cx + 1, sh, K.N);                       // bow tie
    } else if (def.body !== 'long') {
      const vy = fem ? 2 : 3;
      for (let y = sh; y <= sh + vy; y++) {
        const hw = vy - (y - sh);
        for (let x = cx + 1 - (hw > 1 ? 1 : 0); x <= cx + 1 + (hw > 0 ? 1 : 0); x++) sp(x, y, K.W);
        if (!fem) sp(cx + 1, y, y > sh ? K.N : K.W);
      }
      sp(cx - 1, sh + 2, K.c); sp(cx + 3, sh + 2, K.K);           // lapel edges
      if (!fem) { sp(cx - 1, waist - 2, K.c); sp(cx - 1, waist - 4, K.c); } // buttons
    } else {
      for (let y = sh + 1; y <= waist; y++) sp(cx + 1, y, K.c);
      sp(cx - 2, sh + 3, K.X); sp(cx - 2, sh + 6, K.X);             // brass buttons
    }
  } else {
    sp(cx, sh + 2, K.c); sp(cx, sh + 3, K.c);                     // back seam
  }
  if (def.body === 'coat') {
    // belt with buckle, turned-up collar
    for (let x = cx - 3 - wd; x <= cx + 3 + wd; x++) sp(x, waist, K.B);
    if (!back) sp(cx + 1, waist, K.k); else sp(cx - 3 - wd, waist, K.B);
    if (!back) { sp(cx - 3, sh - 1, K.C); sp(cx - 2, sh - 1, K.K); sp(cx + 3, sh - 1, K.c); sp(cx + 3, sh - 2, K.C); sp(cx - 3, sh - 2, K.K); }
    else { for (let x = cx - 3; x <= cx + 3; x++) sp(x, sh - 1, x < cx - 1 ? K.K : K.C); sp(cx - 3, sh - 2, K.K); sp(cx + 3, sh - 2, K.C); }
  }
  if (def.body === 'suit' || def.body === 'skirt') { for (let x = cx - 2 - wd; x <= cx + 2 + wd; x++) sp(x, waist, K.c); }
  // ---------------- signature features on the body (behind the near arm)
  if (def.sig) drawBodySig(def, K, back, cx, sh, waist, wd);
  // ---------------- head
  drawHead(def, K, back, cx, faceY - neck, pose);
  // ---------------- near arm (in front)
  {
    const sx = cx - 4 - wd - so, reach = pose.reach || 0;
    let hx = sx + Math.round(as * 1.2 * fwdX), hy = waist + 2 + Math.round(as * 0.8 * fwdY);
    if (reach > 0) { hx = Math.round(lerp(hx, cx + 5, reach)); hy = Math.round(lerp(hy, sh + 3 + (back ? -2 : 0), reach)); }
    if (pose.talk) { hx = sx + 1; hy = waist - 1; }
    let hand = true;
    if (style === 'pockets' && !reach && !pose.talk) { hx = sx + 1; hy = waist; hand = false; }
    if (style === 'smoke' && !reach && !pose.talk) { hx = cx + 1; hy = chin - neck; }
    if (style === 'crossed' && !reach && !pose.talk) {
      spline(sx, sh + 1, sx, sh + 4, K.C, 2); spline(sx, sh + 4, cx + 3 + so, sh + 4, K.C, 2); spline(sx + 1, sh + 5, cx + 3 + so, sh + 5, K.c, 1);
      sp(sx, sh + 1, K.K); sp(sx, sh + 2, K.K); sp(cx + 4 + so, sh + 4, K.G !== undefined ? K.G : K.S);
      hand = false; hx = cx + 3; hy = sh + 3;
    } else if (style === 'hips' && !reach && !pose.talk) {
      spline(sx, sh + 1, sx - 2, sh + 4, K.C, 2); spline(sx - 2, sh + 4, sx, waist, K.C, 2);
      sp(sx, sh + 1, K.K); sp(sx, sh + 2, K.K); sp(sx + 1, waist, K.G !== undefined ? K.G : K.S);
      hand = false; hx = sx; hy = waist - 1;
    } else {
      spline(sx, sh + 1, sx + Math.round((hx - sx) * 0.4), sh + 4, K.C, 2);
      spline(sx + Math.round((hx - sx) * 0.4), sh + 4, hx, hy, K.C, 2);
      sp(sx, sh + 1, K.K); sp(sx, sh + 2, K.K);
    }
    if (hand) { if (!back || reach > 0) spr(hx, hy + 1, 2, 2, K.G !== undefined ? K.G : K.S); else spr(hx, hy + 1, 2, 1, K.s); }
    if (style === 'smoke' && !reach && !pose.talk) { sp(hx + 2, hy + 1, C.CREAM); sp(hx + 3, hy + 1, (pose.bob ? C.RED : C.AMB)); }
    if (pose.hold && def.holdDraw) def.holdDraw(hx, hy + 1, back);
    if (def.sig) drawHandSig(def, K, back, hx, hy, style);
  }
  if (def.extra) def.extra(K, back, cx, faceY, sh, waist, hem, pose);
  if (def.lean) leanUpper(def.lean, sh + 3);
  outline(K.o);
}
// upper body leans by d pixels (forward = toward the way the figure faces, which is +x in both drawn views)
function leanUpper(d, rows) {
  const src = SF.slice();
  for (let y = 0; y < rows; y++) for (let x = 0; x < SPR_W; x++) {
    const sx = x - d; SF[y * SPR_W + x] = sx >= 0 && sx < SPR_W ? src[y * SPR_W + sx] : T;
  }
}
// signature features worn on the body: scarf, buttonhole flower, badge, satchel strap and bag
function drawBodySig(def, K, back, cx, sh, waist, wd) {
  if (hasSig(def, 'satchel')) {
    if (!back) { spline(cx + 3 + wd, sh, cx - 2, waist - 1, K.P, 1); spr(cx + 4 + wd, waist - 1, 3, 4, K.P); sp(cx + 4 + wd, waist - 1, K.c); }
    else { spline(cx - 3 - wd, sh, cx + 2, waist - 1, K.P, 1); spr(cx + 3 + wd, waist - 1, 3, 4, K.P); }
  }
  if (hasSig(def, 'badge') && !back) sp(cx - 2, sh + 3, K.X);
  if (hasSig(def, 'flower') && !back) { sp(cx - 1, sh + 1, K.V); sp(cx - 1, sh + 2, C.G2); }
  if (hasSig(def, 'scarf')) {
    for (let x = cx - 3; x <= cx + 3; x++) { sp(x, sh - 1, K.V); sp(x, sh, x < cx ? K.V : C.PLUM); }
    const tx = back ? cx + 2 : cx - 2;
    for (let y = sh + 1; y <= sh + 5; y++) sp(tx, y, y & 1 ? K.V : C.PLUM);
  }
}
// things carried in the near hand: a cane to the ground, a case below the hand
function drawHandSig(def, K, back, hx, hy, style) {
  if (style === 'crossed' || style === 'pockets') return;
  if (hasSig(def, 'cane')) { for (let y = hy + 3; y <= SPR_BY; y++) sp(hx, y, K.P); sp(hx + 1, hy + 2, K.P); }
  else if (hasSig(def, 'case')) { spr(hx - 1, hy + 4, 5, 4, K.P); sp(hx, hy + 3, K.P); sp(hx + 2, hy + 3, K.P); for (let x = hx - 1; x < hx + 4; x++) sp(x, hy + 7, K.c); }
}
function drawHead(def, K, back, cx, fy, pose) {
  // face rows fy..fy+3, chin fy+4; head spans cx-2..cx+2
  const x0 = cx - 2;
  if (!back) {
    spmap(x0, fy, [
      'AsSSS',
      'sSSeS',
      'sSSSSS',
      '.smSs'
    ], K);
    if (pose.talk) sp(x0 + 2, fy + 3, K.e);
    sp(x0 + 1, fy + 4, K.s); sp(x0 + 2, fy + 4, K.s);
  } else {
    spmap(x0, fy, [
      'sAAAa',
      'SAaAA',
      'sSSSs',
      '.sSs.'
    ], K);
    sp(x0 + 1, fy + 4, K.s); sp(x0 + 2, fy + 4, K.s);
  }
  // hair styles
  if (def.hair === 'bob') {
    if (!back) { spmap(x0 - 1, fy - 2, ['.AAAAa.', 'AAAAAAa', 'AAss...', 'AA.....', 'AA.....', '.A.....'], K); }
    else { spmap(x0 - 1, fy - 2, ['.AAAAa.', 'AAAAAAa', 'AAAAAAa', 'AAAAAAa', 'AAAAAa.', '.AAAA..'], K); }
  } else if (def.hair === 'bun') {
    if (!back) { spmap(x0 - 1, fy - 2, ['.AAAa..', 'AAAAAa.', 'AAs....', 'A......'], K); spmap(x0 - 2, fy - 2, ['aA', 'AA'], K); }
    else { spmap(x0 - 1, fy - 2, ['.AAAa..', 'AAAAAa.', 'AAAAAa.', '.AaAA..'], K); spmap(x0 + 1, fy - 3, ['aAa'], K); }
  } else if (def.hair === 'short' || def.hair === 'slick') {
    if (!back) spmap(x0 - 1, fy - 2, ['.AAAa.', 'AAAAAa', 'AA....'], K);
    else spmap(x0 - 1, fy - 2, ['.AAAa.', 'AAAAAa', 'AAAAAa'], K);
  } else if (def.hair === 'bald') {
    if (!back) spmap(x0 - 1, fy - 2, ['..SSL.', '.SSSSL', 'AS....'], K);
    else spmap(x0 - 1, fy - 2, ['..SSs.', '.SSSSs', 'AAAAAA'], K);
  } else if (def.hair === 'long') {
    if (!back) spmap(x0 - 1, fy - 2, ['.AAAAa.', 'AAAAAAa', 'AAss...', 'AA.....', 'AA.....', 'AA.....', 'AAA....', '.AA....'], K);
    else spmap(x0 - 1, fy - 2, ['.AAAAa.', 'AAAAAAa', 'AAAAAAa', 'AAAAAAa', 'AAAAAAa', 'AAAAAAa', 'AAAAAA.', '.AAAA..'], K);
  } else if (def.hair === 'curly') {
    if (!back) spmap(x0 - 2, fy - 3, ['..AaAa..', '.AAAAAAa', 'AAAAAAA.', 'AAAs....', 'AA......', '.A......'], K);
    else spmap(x0 - 2, fy - 3, ['..AaAa..', '.AAAAAAa', 'AAAAAAAa', 'AAAAAAA.', 'AAAAAA..', '.AAAA...'], K);
  } else if (def.hair === 'pomp') {
    if (!back) spmap(x0 - 1, fy - 3, ['..AAa.', '.AAAAa', 'AAAAAa', 'AA....'], K);
    else spmap(x0 - 1, fy - 3, ['.aAA..', 'AAAAA.', 'AAAAAa', 'AAAAAa'], K);
  }
  // signature features on the face (front view; glasses also show from behind as a temple)
  if (!back) {
    if (hasSig(def, 'beard')) { sp(x0 + 1, fy + 3, K.A); sp(x0 + 2, fy + 3, K.A); sp(x0 + 3, fy + 3, K.A); sp(x0 + 4, fy + 3, K.A); sp(x0 + 1, fy + 4, K.A); sp(x0 + 2, fy + 4, K.A); sp(x0 + 3, fy + 4, K.a); }
    if (hasSig(def, 'moustache')) { sp(x0 + 2, fy + 3, K.A); sp(x0 + 3, fy + 3, K.A); sp(x0 + 4, fy + 3, K.A); }
    if (hasSig(def, 'glasses')) { sp(x0 + 2, fy + 1, K.Y); sp(x0 + 3, fy + 1, C.WL); sp(x0 + 4, fy + 1, K.Y); sp(x0 + 1, fy + 1, K.Y); }
  } else if (hasSig(def, 'glasses')) sp(x0 + 4, fy + 1, K.Y);
  // hats
  if (def.hat === 'fedora') {
    if (!back) spmap(x0 - 2, fy - 4, ['...HHH...', '..HHHHH..', '..bbbbb..', 'hhhhhhhhh', '......hh.'], K);
    else spmap(x0 - 2, fy - 4, ['...HHH...', '..HHHHH..', '..bbbbb..', 'hhhhhhhhh', '.hh......'], K);
  } else if (def.hat === 'cap') {
    if (!back) spmap(x0 - 1, fy - 3, ['.HHHH..', 'HHHXHH.', 'hhhhhhh', '....hhh'], K);
    else spmap(x0 - 1, fy - 3, ['.HHHH..', 'HHHHHH.', 'hhhhhh.', '.......'], K);
  } else if (def.hat === 'doorman') {
    if (!back) spmap(x0 - 1, fy - 4, ['.HHHH.', 'HHHHHH', 'XXXXXX', 'hhhhhhh', '....hh.'], K);
    else spmap(x0 - 1, fy - 4, ['.HHHH.', 'HHHHHH', 'XXXXXX', 'hhhhhh.', '......'], K);
  } else if (def.hat === 'pillbox') {
    spmap(x0, fy - 3, ['.HHH.', 'HHHHH'], K);
  } else if (def.hat === 'homburg') {           // tall dented crown, brim curled up at both ends
    if (!back) spmap(x0 - 2, fy - 5, ['...HHH...', '..HHhHH..', '..HHHHH..', '..bbbbb..', 'hhhhhhhhh', 'h.......h'], K);
    else spmap(x0 - 2, fy - 5, ['...HHH...', '..HHhHH..', '..HHHHH..', '..bbbbb..', 'hhhhhhhhh', 'h.......h'], K);
  } else if (def.hat === 'bowler') {            // round crown, narrow brim
    if (!back) spmap(x0 - 1, fy - 4, ['..HHH..', '.HHHHH.', '.bbbbb.', 'hhhhhhh'], K);
    else spmap(x0 - 1, fy - 4, ['..HHH..', '.HHHHH.', '.bbbbb.', 'hhhhhhh'], K);
  } else if (def.hat === 'cloche') {            // bell-shaped, pulled down to the eyes
    if (!back) spmap(x0 - 1, fy - 3, ['.HHHH..', 'HHHHHH.', 'HHHHHHh', 'hbbbh..', 'h......'], K);
    else spmap(x0 - 1, fy - 3, ['..HHHH.', '.HHHHHH', 'hHHHHHH', '..hbbbh', '......h'], K);
  } else if (def.hat === 'newsboy') {           // full flat cap, peak over the face
    if (!back) spmap(x0 - 2, fy - 3, ['..HHHHH..', '.HHHHHHH.', 'HHHHHHHHh', '....hhhhh'], K);
    else spmap(x0 - 2, fy - 3, ['..HHHHH..', '.HHHHHHH.', 'hHHHHHHHH', '.........'], K);
  } else if (def.hat === 'beret') {             // flat, tilted toward the back of the head
    if (!back) spmap(x0 - 2, fy - 3, ['..HHHH..', 'HHHHHHH.', 'hHHHHh..'], K);
    else spmap(x0 - 1, fy - 3, ['..HHHH..', '.HHHHHHH', '..hHHHHh'], K);
  }
}
// ------------------------------------------------------------------ animation sets
// walk: 6 frames per cycle. idle: 2 (breath). talk: 2. reach: 1.
const WALK_Q = [0, 0.7, 1, 0, -0.7, -1], WALK_BOB = [0, 0, 1, 0, 0, 1], WALK_LIFT = [0, 2, 0, 0, 1, 0];
function buildPerson(def) {
  const P = { def, front: {}, back: {} };
  for (let dir = 0; dir < 2; dir++) {
    const set = dir ? P.back : P.front;
    set.idle = []; set.walk = []; set.talk = []; set.reach = [];
    const stride = def.stride === undefined ? 1 : def.stride, bounce = def.bounce === undefined ? 1 : def.bounce;
    for (let f = 0; f < 2; f++) { SF = newFrame(); drawFigure(def, { dir, q: 0, arm: 0, bob: f, lift: 0, style: def.idle }); set.idle.push(SF); }
    for (let f = 0; f < 6; f++) {
      SF = newFrame();
      drawFigure(def, { dir, q: WALK_Q[f] * stride, arm: -WALK_Q[f], bob: Math.round(WALK_BOB[f] * bounce), lift: WALK_LIFT[f] });
      set.walk.push(SF);
    }
    for (let f = 0; f < 2; f++) { SF = newFrame(); drawFigure(def, { dir, q: 0, arm: 0, bob: 0, talk: f }); set.talk.push(SF); }
    SF = newFrame(); drawFigure(def, { dir, q: 0, arm: 0, bob: 0, reach: 1 }); set.reach.push(SF);
    if (def.poses) for (const name in def.poses) {
      set[name] = [];
      for (const pz of def.poses[name]) { SF = newFrame(); drawFigure(def, Object.assign({ dir, q: 0, arm: 0, bob: 0 }, pz)); set[name].push(SF); }
    }
  }
  SF = null;
  return P;
}

// ------------------------------------------------------------------ the cast
const CAST_DEFS = {
  frank: { h: 31, body: 'coat', hat: 'fedora', hair: 'short', color: C.CREAM, name: 'Frank',
           key: costume({ C: C.TAN, c: C.BRN, K: C.TANL, B: C.BRN, k: C.BRASS, H: C.ST1, h: C.ST0, b: C.INK,
                          T: C.ST0, t: C.NAV, F: C.INK, W: C.CREAM, N: C.OX, A: C.HAIRD, a: C.HAIRL }) },
  russo: { h: 29, body: 'skirt', hat: 'none', hair: 'bob', color: C.WL, name: 'Russo',
           key: costume({ C: C.S1, c: C.S0, K: C.S2, T: C.S0, t: C.NAV, W: C.CREAM, A: C.HAIRD, a: C.HAIRL,
                          F: C.INK, S: C.SKM, L: C.SKL, s: C.SKS, m: C.CRIM }) },
  cop:   { h: 31, body: 'suit', hat: 'cap', hair: 'short', color: C.S2, name: 'Mulroney', wide: 1,
           key: costume({ C: C.PNV, c: C.DW, K: C.SLT, T: C.PNV, t: C.DW, H: C.PNV, h: C.DW, X: C.BRASS, W: C.S2, N: C.DW }) },
  clerk: { h: 29, body: 'suit', hat: 'none', hair: 'slick', color: C.PALEY, name: 'Pell',
           key: costume({ C: C.OX, c: C.PLUM, K: C.CRIM, T: C.ST0, t: C.NAV, A: C.INK, a: C.ST1, W: C.CREAM, N: C.INK,
                          S: C.SKL, s: C.SKM, L: C.CREAM }) },
  doorman: { h: 32, body: 'long', hat: 'doorman', hair: 'short', color: C.CORAL, name: 'Gus', wide: 1,
           key: costume({ C: C.OX, c: C.PLUM, K: C.CRIM, H: C.OX, h: C.PLUM, X: C.BRASS, T: C.INK, t: C.INK,
                          S: C.DSM, s: C.DSS, L: C.SKM, A: C.INK }) },
  bartender: { h: 30, body: 'vest', hat: 'none', hair: 'bald', color: C.GLOW, name: 'Lou', wide: 1,
           key: costume({ C: C.INK, c: C.BLK, K: C.ST0, W: C.CREAM, N: C.CRIM, T: C.ST0, t: C.NAV, A: C.CRS }) },
  salvi: { h: 30, body: 'suit', hat: 'fedora', hair: 'slick', color: C.CORAL, name: 'Mickey', wide: 1,
           key: costume({ C: C.ST0, c: C.INK, K: C.ST1, T: C.ST0, t: C.INK, H: C.INK, h: C.BLK, b: C.OX, W: C.CREAM, N: C.CRIM }) },
  goon:  { h: 32, body: 'suit', hat: 'fedora', hair: 'short', color: C.S2, name: 'Bruno', wide: 1,
           key: costume({ C: C.NAV, c: C.BLK, K: C.SLT, T: C.NAV, t: C.BLK, H: C.NAV, h: C.BLK, W: C.S2, N: C.NAV }) },
  teague: { h: 30, body: 'suit', hat: 'none', hair: 'short', color: C.BRASS, name: 'Teague',
           key: costume({ C: C.CREAM, c: C.CRS, K: C.WHITE, T: C.INK, t: C.BLK, W: C.WHITE, N: C.INK,
                          S: C.DSM, s: C.DSS, L: C.SKM, A: C.INK, a: C.HAIRD }) },
  mags:  { h: 27, body: 'dress', hat: 'none', hair: 'bun', color: C.LAV, name: 'Mags',
           key: costume({ C: C.VIO, c: C.VDK, K: C.LAV, T: C.VIO, t: C.VDK, A: C.CRS, a: C.S2, W: C.CREAM }) },
  vendor: { h: 29, body: 'suit', hat: 'cap', hair: 'short', color: C.PALEY, name: 'Sal',
           key: costume({ C: C.BRN, c: C.DBR, K: C.TAN, H: C.ST1, h: C.ST0, X: C.ST1, T: C.ST0, t: C.NAV }) },
  // the Blue Comet's band and customers (no dialogue; 'play' bobs on the beat)
  pianist: { h: 29, body: 'suit', hat: 'none', hair: 'slick', color: C.S2, name: 'Pianist',
           key: costume({ C: C.INK, c: C.BLK, K: C.ST0, T: C.INK, t: C.BLK, W: C.CREAM, N: C.INK, S: C.DSM, s: C.DSS, L: C.SKM }),
           poses: { play: [{ reach: 0.55 }, { reach: 0.7, bob: 1 }] } },
  bassist: { h: 31, body: 'suit', hat: 'none', hair: 'short', color: C.S2, name: 'Bassist',
           key: costume({ C: C.CREAM, c: C.CRS, K: C.WHITE, T: C.INK, t: C.BLK, W: C.WHITE, N: C.INK, A: C.HAIRD }),
           poses: { play: [{ reach: 0.4, arm: 0.3 }, { reach: 0.4, arm: -0.3, bob: 1 }] } },
  drummer: { h: 29, body: 'vest', hat: 'none', hair: 'short', color: C.S2, name: 'Drummer',
           key: costume({ C: C.INK, c: C.BLK, K: C.ST0, W: C.CREAM, N: C.INK, T: C.ST0, t: C.NAV, S: C.SKS, s: C.DSS, L: C.SKM }),
           poses: { play: [{ reach: 0.8, arm: 0.6 }, { reach: 0.3, arm: -0.6, bob: 1 }] } },
  patronF: { h: 27, body: 'dress', hat: 'none', hair: 'bob', color: C.CORAL, name: 'Customer',
           key: costume({ C: C.CRIM, c: C.OX, K: C.CORAL, T: C.CRIM, t: C.OX, A: C.INK, a: C.HAIRD }) },
  patronM: { h: 30, body: 'suit', hat: 'fedora', hair: 'short', color: C.S2, name: 'Customer',
           key: costume({ C: C.ST1, c: C.ST0, K: C.ST2, T: C.ST0, t: C.INK, H: C.BRN, h: C.DBR, W: C.CREAM, N: C.OX }) }
};
const CAST = {};
function buildCast() { for (const id in CAST_DEFS) CAST[id] = buildPerson(CAST_DEFS[id]); }
