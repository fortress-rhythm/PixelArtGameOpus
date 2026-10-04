// PostToolUse hook: after Claude edits a game source, rebuild that game and, for the adventure, run the story check.
// Errors exit 2, which feeds them back to Claude so a broken story is fixed before anything else happens.
// New warnings are passed along as context and don't block. Plain Node, so it runs on Windows too.
const path = require('path'), { execFileSync } = require('child_process');
let input = '';
process.stdin.on('data', d => { input += d; });
process.stdin.on('end', () => {
  let file = '';
  try { file = (JSON.parse(input).tool_input || {}).file_path || ''; } catch (e) { return; }
  const root = path.join(__dirname, '..', '..'), rel = path.relative(root, file).split(path.sep).join('/');
  const target = /^src\/.*\.js$/.test(rel) ? ['city', 'test'] : /^src_test\/.*\.js$/.test(rel) ? ['test'] : /^src_garden\/.*\.js$/.test(rel) ? ['garden'] : null;
  if (!target) return;
  try { execFileSync(process.execPath, [path.join(root, 'tools', 'build.js')].concat(target), { stdio: 'pipe' }); }
  catch (e) { process.stderr.write('build failed after editing ' + rel + ':\n' + e.stderr); process.exit(2); }
  if (!rel.startsWith('src/')) return;
  let res;
  try { res = JSON.parse(execFileSync(process.execPath, [path.join(root, 'tools', 'story_check.js'), '--json'], { encoding: 'utf8' })); }
  catch (e) { res = e.stdout ? JSON.parse(e.stdout) : null; if (!res) { process.stderr.write('story check crashed:\n' + e.stderr); process.exit(2); } }
  const lines = res.problems.map(p => p.file + ':' + p.line + ': ' + p.severity + ': ' + p.message);
  const errors = res.problems.filter(p => p.severity === 'error').length;
  if (errors) { process.stderr.write('story check: ' + errors + ' error(s) after editing ' + rel + ':\n' + lines.join('\n') + '\n'); process.exit(2); }
  if (lines.length) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: 'story check: ' + lines.length + ' new warning(s):\n' + lines.join('\n') } }));
});
