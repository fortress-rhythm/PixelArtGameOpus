// Runs the game's sources in Node without a browser, for unit tests and the story checker.
// The DOM is a stub: enough for the sources to load and for the pure parts (rasteriser, lighting, people,
// pathfinding, story data, script runner) to work. Nothing is drawn to a real screen.
//   const g = loadGame();                 the whole adventure (src/*.js), init() not run
//   const g = loadGame({ files: [...] }); only these sources, in this order
// Every top-level name the sources declare is reachable as g.NAME (looked up lazily in the shared scope).
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

function stubCanvas() {
  const ctx = new Proxy({}, { get: (t, k) => k === 'createImageData' || k === 'getImageData' ? (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }) : t[k] !== undefined ? t[k] : () => {},
                              set: (t, k, v) => { t[k] = v; return true; } });
  return { width: 0, height: 0, style: {}, getContext: () => ctx, addEventListener() {}, removeEventListener() {}, focus() {},
           getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) };
}
function sandbox(search) {
  const store = {};
  const win = {
    console, Math, JSON, Date, Array, Object, Number, String, Boolean, Map, Set, WeakMap, Promise, Symbol, Error, RegExp, Proxy, Reflect,
    Uint8Array, Uint8ClampedArray, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array, ArrayBuffer, DataView,
    parseInt, parseFloat, isNaN, isFinite, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, performance: { now: () => 0 }, URLSearchParams,
    location: { search: search || '', href: 'file:///game.html' + (search || '') },
    navigator: { userAgent: 'node' }, innerWidth: 960, innerHeight: 540, devicePixelRatio: 1,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    addEventListener() {}, removeEventListener() {},
    document: { getElementById: () => stubCanvas(), createElement: () => stubCanvas(), addEventListener() {}, body: {}, fonts: { ready: Promise.resolve() } }
  };
  win.window = win; win.self = win; win.globalThis = win;
  return win;
}

function loadGame(opts) {
  opts = opts || {};
  const files = opts.files || fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js')).sort().map(f => 'src/' + f);
  let code = '';
  for (const f of files) {
    let s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (f.endsWith('90_main.js')) s = s.replace(/\ninit\(\);\s*$/, '\n');       // load everything, start nothing
    code += s + '\n';
  }
  const ctx = vm.createContext(sandbox(opts.search));
  // a getter per top-level binding, so const/let/class/function are all reachable from outside
  code += '\n;globalThis.__get = (n) => eval(n);';
  vm.runInContext(code, ctx, { filename: 'game.js' });
  return new Proxy({}, { get: (t, k) => typeof k === 'string' ? ctx.__get(k) : undefined });
}
module.exports = { loadGame, ROOT };
