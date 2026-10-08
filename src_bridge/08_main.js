// @ts-check
// =================================================================== NIGHT BRIDGE: BUILD, TIME AND RENDER
let simFrame = 0;

// built once by init() in src_cine/99_main.js
function sceneBuild() {
  buildSky(); buildMountain(); buildHills(); buildWater(); buildBanks(); buildLighthouse(); buildTown(); buildCamellia(); buildBridge();
  buildStars(); buildVignette();
}
function loopReset() { /* nothing is simulated: every frame is a function of the time */ }
function update(f) { soundTick(f / FPS, cameraAt(f / FPS).x); }
// after the story the scene loops: from the end of the timeline back to STORY_F, not to the start
function step() {
  simFrame++;
  if (simFrame >= CINE_F) simFrame = STORY_F;
  update(simFrame);
}
// a frame index for things re-rolled by hash (sparkles), wrapped like the clock, so the loop point matches
const loopFrame = (f) => f < STORY_F ? f : STORY_F + (f - STORY_F) % LOOP_F;

const drawn = [];
function render(f) {
  const t = f / FPS, fl = loopFrame(f), cam = cameraAt(t), cx = cam.x, cu = cam.up, rcx = Math.round(cx);
  // far to near: sky and stars, mountain, hills, the world, the beam
  blitWorld(skyL, cx, cu); drawStars(t);
  blitWorld(mountL, cx, cu); blitWorld(hillL, cx, cu);
  blitWorld(worldL, cx, cu);
  drawLighthouseLamp(t, cx, cu);
  // boats upstream of the bridge are seen through it
  const st = storyT(t), fisher = boatAt(FISHER, st), steamer = boatAt(STEAMER, st);
  if (fisher && fisher.s < 0.5) drawFisher(fisher.x, fisher.s, t, cx, cu, 0);
  if (steamer && steamer.s < 0.5) drawSteamer(steamer.x, steamer.s, t, cx, cu);
  // the glass: everything behind the bridge's body shows through it, tinted and brighter
  const ox = rcx - worldL.x0, oy = worldL.h - H - Math.round(cu);
  for (let r = 0; r < H; r++) {
    const ly = r + oy; if (ly < 0 || ly >= worldL.h) continue;
    for (let x = 0; x < W; x++) {
      const lx = x + ox; if (lx < 0 || lx >= worldL.w) continue;
      const m = glassMask[ly * worldL.w + lx];
      if (m) fb[r * W + x] = (m === 1 ? GLASS : GLASS2)[fb[r * W + x]];
    }
  }
  blitWorld(bridgeL, cx, cu);
  drawSpots(t, cx, cu); drawGlows(t, cx, cu);
  blitWorld(camelliaL, cx, cu);
  drawInn(t, cx, cu); drawTowerDoor(t, cx, cu);
  // people, far ones first
  drawn.length = 0;
  for (const who of ORDER) { const p = evalPerson(who, t); if (p.on) drawn.push(p); }
  drawn.sort((a, b) => b.z - a.z || a.x - b.x);
  const moonSx = scrX(MOON_X, LAY.pSky, cx);
  for (const p of drawn) { drawFigure(p); placeFigure(p, scrX(p.x, 1, cx), scrY(p.y, 1, cu), moonSx); }
  drawNearRailing(cx, cu);
  drawReflections(t, fl, cu);
  // boats on our side of the bridge, the one moored near the town, then the small lights
  drawFisher(LAY.rightX - 40 + 3 * osc(1, t, 0), 1.5, t, cx, cu, osc(4, t, 0.2) > 0.5 ? 1 : 0);
  if (fisher && fisher.s >= 0.5) drawFisher(fisher.x, fisher.s, t, cx, cu, 0);
  if (steamer && steamer.s >= 0.5) drawSteamer(steamer.x, steamer.s, t, cx, cu);
  drawFireflies(t, cx, cu);
  for (let i = 0; i < W * H; i++) if (vig[i]) fb[i] = SHD[fb[i]];
}
