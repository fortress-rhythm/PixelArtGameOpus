// Static story check for The Hourglass City: catches broken references before you play.
//   node tools/story_check.js             errors and new warnings, as file:line:col: severity: message
//   node tools/story_check.js --json      the same as JSON (the VS Code extension reads this)
//   node tools/story_check.js --strict    warnings count as errors
//   node tools/story_check.js --accept    write every current warning to tools/story_check.known.json
// Exit code 1 when there are errors. Known warnings (listed in story_check.known.json) are counted, not printed:
// they are the existing story's accepted state, so only new problems show up.
//
// Errors:   an exit or room change to a missing room or onto ground Frank can't stand on; a speaker, clue, item or
//           deduction input that doesn't exist; two hotspots with one id in a room.
// Warnings: a flag that is read but never set; a clue nobody can find; a deduction that decides nothing
//           (nothing checks it and nothing builds on it: mark it optional to say that's on purpose);
//           a room no exit leads to; a hotspot whose stand point is off the walkable floor.
const fs = require('fs'), path = require('path');
const { loadGame, ROOT } = require('./load_game');
const KNOWN = path.join(__dirname, 'story_check.known.json');

// opts.override: { 'src/file.js': text } checks other text in place of a source (used by the tests)
function run(opts) {
  opts = opts || {};
  const g = loadGame({ override: opts.override });
  const files = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js')).sort().map(f => 'src/' + f);
  const src = files.map(f => ({ f, text: opts.override && f in opts.override ? opts.override[f] : fs.readFileSync(path.join(ROOT, f), 'utf8') }));
  const out = [];
  const where = (file, index) => { const text = src.find(s => s.f === file).text, pre = text.slice(0, index), line = pre.split('\n').length; return { file, line, col: index - pre.lastIndexOf('\n') }; };
  const report = (sev, loc, msg, key) => out.push(Object.assign({ severity: sev, message: msg, key: key || msg }, loc));
  // every match of a pattern across the sources, with its position
  function scan(re) { const hits = []; for (const s of src) for (const m of s.text.matchAll(re)) hits.push({ m, loc: where(s.f, m.index) }); return hits; }
  // where something is defined: the first match of a pattern, else the top of the first file
  function find(re) { for (const s of src) { const m = s.text.match(re); if (m) return where(s.f, m.index); } return { file: files[0], line: 1, col: 1 }; }
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const ROOMS = g.ROOMS, CLUES = g.CLUES, DEDS = g.DEDS, ITEMS = g.ITEMS;
  const dedIds = new Set(DEDS.map(d => d.id));
  for (const id in ROOMS) g.buildRoomBuffer(ROOMS[id]);
  const roomLoc = (id) => find(new RegExp("id: '" + esc(id) + "'"));
  const hsLoc = (room, hid) => { const r = roomLoc(room), text = src.find(s => s.f === r.file).text, i = text.indexOf("id: '" + hid + "'"); return i >= 0 ? where(r.file, i) : r; };

  // ---------------- rooms, exits, room changes
  const reached = new Set();
  function landing(loc, room, x, y, what) {
    if (!ROOMS[room]) { report('error', loc, what + " goes to '" + room + "': no such room"); return; }
    reached.add(room);
    if (x !== undefined && !g.walkable(ROOMS[room].grid, x, y)) report('error', loc, what + ' lands Frank at ' + x + ', ' + y + " in '" + room + "', which is not walkable");
  }
  for (const id in ROOMS) {
    const r = ROOMS[id], seen = new Set();
    for (const hs of r.hotspots) {
      if (seen.has(hs.id)) report('error', hsLoc(id, hs.id), "two hotspots called '" + hs.id + "' in " + id);
      seen.add(hs.id);
      if (hs.exit) landing(hsLoc(id, hs.id), hs.exit.room, hs.exit.x, hs.exit.y, "Exit '" + hs.id + "' in " + id);
      if (hs.at && !g.walkable(r.grid, hs.at[0], hs.at[1]))
        report('warning', hsLoc(id, hs.id), "'" + hs.id + "' in " + id + ': Frank stands at ' + hs.at.join(', ') + ', off the walkable floor (he will stop at the nearest point)');
    }
  }
  for (const { m, loc } of scan(/\['room', '(\w+)', ([\d.]+), ([\d.]+)/g)) landing(loc, m[1], +m[2], +m[3], 'Room change');
  for (const { m, loc } of scan(/enterRoom\('(\w+)', ([\d.]+), ([\d.]+)/g)) landing(loc, m[1], +m[2], +m[3], 'enterRoom');
  for (const id in ROOMS) if (!reached.has(id)) report('warning', roomLoc(id), "room '" + id + "' is never entered: no exit or room change leads to it");

  // ---------------- speakers
  const speakers = new Set(['narr'].concat(Object.keys(g.CAST_DEFS), Object.keys(g.VOICES)));
  for (const { m } of scan(/makeActor\('(\w+)'/g)) speakers.add(m[1]);
  for (const { m, loc } of scan(/\['say', '(\w+)'/g)) if (!speakers.has(m[1])) report('error', loc, "'" + m[1] + "' speaks but is not in the cast, VOICES or 'narr'");

  // ---------------- clues, deductions, items
  const given = new Set();
  for (const { m, loc } of scan(/(?:\['clue', |addClue\()'(\w+)'/g)) { given.add(m[1]); if (!CLUES[m[1]]) report('error', loc, "clue '" + m[1] + "' is given but never defined"); }
  for (const { m, loc } of scan(/hasClue\('(\w+)'\)/g)) if (!CLUES[m[1]] && !dedIds.has(m[1])) report('error', loc, "hasClue('" + m[1] + "'): no such clue or deduction");
  for (const id in CLUES) if (!given.has(id)) report('warning', find(new RegExp("clue\\('" + esc(id) + "'")), "clue '" + id + "' is defined but nothing gives it");
  const usedAsInput = new Set(), checked = new Set();
  for (const d of DEDS) for (const k of [d.a, d.b]) { usedAsInput.add(k); if (!CLUES[k] && !dedIds.has(k)) report('error', find(new RegExp("ded\\('" + esc(d.id) + "'")), "deduction '" + d.id + "' needs '" + k + "', which is not a clue or deduction"); }
  for (const { m } of scan(/hasClue\('(\w+)'\)/g)) checked.add(m[1]);
  for (const d of DEDS) if (!d.optional && !checked.has(d.id) && !usedAsInput.has(d.id))
    report('warning', find(new RegExp("ded\\('" + esc(d.id) + "'")), "deduction '" + d.id + "' decides nothing: no hasClue('" + d.id + "') and no deduction builds on it (mark it optional if that's intended)");
  for (const { m, loc } of scan(/(?:\['(?:give|take)', |giveItem\(|takeItem\(|\bhas\()'(\w+)'/g)) if (!ITEMS[m[1]]) report('error', loc, "item '" + m[1] + "' is not in ITEMS");

  // ---------------- flags: read somewhere, set somewhere
  const set = new Set();
  for (const { m } of scan(/(?:\['flag', |setFlag\()'(\w+)'/g)) set.add(m[1]);
  for (const { m } of scan(/G\.flags\.(\w+)\s*=[^=]/g)) set.add(m[1]);
  for (const { m } of scan(/once: '(\w+)'/g)) set.add('said_' + m[1]);
  for (const id in ROOMS) set.add('visited_' + id);
  const reads = new Map();
  for (const { m, loc } of scan(/\bflag\('(\w+)'\)/g)) if (!reads.has(m[1])) reads.set(m[1], loc);
  for (const [k, loc] of reads) if (!set.has(k)) report('warning', loc, "flag '" + k + "' is read but never set");

  return out;
}

function main() {
  const args = process.argv.slice(2);
  const all = run();
  if (args.includes('--accept')) {
    const keys = [...new Set(all.filter(r => r.severity === 'warning').map(r => r.key))].sort();
    fs.writeFileSync(KNOWN, JSON.stringify(keys, null, 1) + '\n');
    console.log('accepted ' + keys.length + ' warning(s) into ' + path.relative(ROOT, KNOWN));
    return;
  }
  const known = new Set(fs.existsSync(KNOWN) ? JSON.parse(fs.readFileSync(KNOWN, 'utf8')) : []);
  const strict = args.includes('--strict');
  const shown = all.filter(r => r.severity === 'error' || !known.has(r.key));
  const nKnown = all.length - shown.length;
  const errors = shown.filter(r => r.severity === 'error' || strict).length, warnings = shown.length - errors;
  if (args.includes('--json')) console.log(JSON.stringify({ problems: shown, known: nKnown }, null, 1));
  else {
    for (const r of shown) console.log(r.file + ':' + r.line + ':' + r.col + ': ' + r.severity + ': ' + r.message);
    console.log('story check: ' + errors + ' error(s), ' + warnings + ' warning(s)' + (nKnown ? ', ' + nKnown + ' known warning(s) hidden' : ''));
  }
  process.exitCode = errors ? 1 : 0;
}
if (require.main === module) main();
module.exports = { run };
