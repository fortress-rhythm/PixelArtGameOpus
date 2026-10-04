// the committed HTML files are what the sources build to (run `npm run build` after editing src/)
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const { TARGETS, render } = require('../../tools/build');
const ROOT = path.join(__dirname, '..', '..');
test('built games are up to date', () => {
  for (const name in TARGETS) {
    const { out, html } = render(name);
    assert.ok(html === fs.readFileSync(path.join(ROOT, out), 'utf8'), out + ' is stale: run npm run build');
  }
});
