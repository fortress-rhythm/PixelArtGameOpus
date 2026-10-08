// Builds the single-file games by concatenating their sources. Plain Node, so it runs the same on Windows,
// macOS and Linux (the old build_*.sh scripts needed a POSIX shell).
//   node tools/build.js            build everything
//   node tools/build.js city       one target: city | test | garden | editor
//   node tools/build.js --watch    rebuild whatever a saved source file belongs to
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const TAIL = '</script>\n</body>\n</html>\n';
const SHARED = ['01_core', '02_font', '03_iso', '04_people', '05_engine', '08_audio', '10_textures', '11_fx', '12_props'];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const jsIn = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.js')).sort().map(f => dir + '/' + f);

// a cinematic scene: the shared core's base, the scene's config (its first file), the shared framebuffer, the rest of
// the scene, the shared main loop
function cine(dir) {
  const own = jsIn(dir);
  return ['src_cine/00_base.js', own[0], 'src_cine/01_frame.js', ...own.slice(1), 'src_cine/99_main.js'];
}

// each target: output file, the head, the sources in order, and whether a newline follows each source
const TARGETS = {
  city:   () => ({ out: 'hourglass_city.html', head: 'src/00_head.html', files: jsIn('src'), nl: true, dirs: ['src'] }),
  test:   () => ({ out: 'hourglass_testlevel.html', head: 'src_test/t00_head.html',
                   files: SHARED.map(f => 'src/' + f + '.js').concat(jsIn('src_test')), nl: true, dirs: ['src', 'src_test'] }),
  garden: () => ({ out: 'ravenshore_garden.html', head: 'src_garden/00_head.html', files: cine('src_garden'), nl: false, dirs: ['src_garden', 'src_cine'] }),
  // the character editor draws with the game's own code
  editor: () => ({ out: 'character_editor.html', head: 'tools/character_editor/head.html',
                   files: ['src/01_core.js', 'src/03_iso.js', 'src/04_people.js', 'src/13_portraits.js', 'tools/art_core.js', 'tools/character_editor/editor.js'], nl: true,
                   dirs: ['src', 'tools', 'tools/character_editor'] })
};

// the page a target builds to, as a string
function render(name) {
  const t = TARGETS[name]();
  let html = read(t.head);
  for (const f of t.files) html += read(f) + (t.nl ? '\n' : '');
  return { out: t.out, html: html + TAIL };
}
function build(name) {
  const { out, html } = render(name);
  fs.writeFileSync(path.join(ROOT, out), html);
  console.log('built ' + out + ': ' + Buffer.byteLength(html) + ' bytes');
}

function buildAll(names) { for (const n of names) build(n); }

function main() {
  const args = process.argv.slice(2), watch = args.includes('--watch');
  const names = args.filter(a => !a.startsWith('--'));
  for (const n of names) if (!TARGETS[n]) { console.error('unknown target ' + n + ' (' + Object.keys(TARGETS).join(', ') + ')'); process.exit(1); }
  const chosen = names.length ? names : Object.keys(TARGETS);
  buildAll(chosen);

  if (watch) {
    // a save often fires several events; rebuild once per burst
    let timer = null; const pending = new Set();
    for (const n of chosen) for (const dir of TARGETS[n]().dirs) {
      fs.watch(path.join(ROOT, dir), (ev, file) => {
        if (!file) return;
        for (const m of chosen) if (TARGETS[m]().dirs.includes(dir)) pending.add(m);
        clearTimeout(timer);
        timer = setTimeout(() => { try { buildAll([...pending]); } catch (e) { console.error(e.message); } pending.clear(); }, 120);
      });
    }
    console.log('watching ' + [...new Set(chosen.flatMap(n => TARGETS[n]().dirs))].join(', ') + ' (Ctrl+C to stop)');
  }
}

if (require.main === module) main();
module.exports = { TARGETS, render, build };
