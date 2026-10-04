// the story checker: clean on the real story, and it catches each kind of broken reference
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const { run } = require('../../tools/story_check');
const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const errors = (r) => r.filter(p => p.severity === 'error').map(p => p.message);

test('the story has no errors', () => { assert.deepStrictEqual(errors(run()), []); });

test('broken references are errors', () => {
  const story = read('src/20_story.js') + `
function __broken() { return [['say', 'nobody', "Hi."], ['clue', 'no_such_clue'], ['give', 'no_such_item'], ['room', 'attic', 1, 1]]; }
ded('d_bad', 'no_such_clue', 'letter', 'Bad', 'Bad.');`;
  const msgs = errors(run({ override: { 'src/20_story.js': story } })).join('\n');
  for (const want of ["'nobody' speaks", "clue 'no_such_clue' is given", "item 'no_such_item'", "goes to 'attic'", "'d_bad' needs 'no_such_clue'"])
    assert.ok(msgs.includes(want), 'missing: ' + want + '\n' + msgs);
});

test('landing off the floor is an error', () => {
  const story = read('src/20_story.js') + "\nfunction __offFloor() { return [['room', 'office', 40, 40]]; }";
  assert.ok(errors(run({ override: { 'src/20_story.js': story } })).some(m => m.includes('not walkable')));
});

test('a deduction marked optional is not reported', () => {
  const plain = read('src/20_story.js') + "\nded('d_extra', 'letter', 'matchbook', 'Extra', 'Extra.');";
  const marked = read('src/20_story.js') + "\nded('d_extra', 'letter', 'matchbook', 'Extra', 'Extra.').optional = true;";
  const has = (r) => r.some(p => p.message.includes("'d_extra' decides nothing"));
  assert.ok(has(run({ override: { 'src/20_story.js': plain } })));
  assert.ok(!has(run({ override: { 'src/20_story.js': marked } })));
});

test('a flag that is read but never set is a warning', () => {
  const story = read('src/20_story.js') + "\nfunction __f() { return flag('never_set_anywhere'); }";
  assert.ok(run({ override: { 'src/20_story.js': story } }).some(p => p.severity === 'warning' && p.message.includes("'never_set_anywhere'")));
});
