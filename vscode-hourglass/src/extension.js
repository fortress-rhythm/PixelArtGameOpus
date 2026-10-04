'use strict';
// The Hourglass City in VS Code: pixel-art and colour previews on hover, cast previews, story-check problems.
const vscode = require('vscode'), fs = require('fs'), path = require('path'), { execFile } = require('child_process');
const lib = require('./lib');

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const folder = () => (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath).find(p => fs.existsSync(path.join(p, 'src', '01_core.js')));
  const diagnostics = vscode.languages.createDiagnosticCollection('hourglass');
  context.subscriptions.push(diagnostics);

  // palette and default costume, re-read when the sources change
  let pal = null, defaultKey = {};
  function readPalette() {
    const root = folder(); if (!root) return;
    try {
      pal = lib.readPalette(fs.readFileSync(path.join(root, 'src', '01_core.js'), 'utf8'));
      defaultKey = pal ? lib.readDefaultKey(fs.readFileSync(path.join(root, 'src', '04_people.js'), 'utf8'), pal) : {};
    } catch (e) { pal = null; }
  }
  readPalette();

  // ---------------- hover: string-map art, palette colours, cast members
  const hover = vscode.languages.registerHoverProvider({ language: 'javascript', scheme: 'file' }, {
    provideHover(doc, pos) {
      if (!pal) readPalette(); if (!pal) return null;
      const text = doc.getText(), offset = doc.offsetAt(pos), line = doc.lineAt(pos.line).text;
      const word = doc.getWordRangeAtPosition(pos, /C\.[A-Z0-9]+/);
      if (word) {
        const name = doc.getText(word).slice(2), i = pal.names[name];
        if (i !== undefined) return new vscode.Hover(new vscode.MarkdownString('![C.' + name + '](' + lib.swatch(pal.hex[i]) + ') `C.' + name + '` palette ' + i + ' · #' + pal.hex[i]), word);
      }
      const cast = lib.castIdAt(line, pos.character);
      if (cast && vscode.workspace.isTrusted) {
        try {
          const p = lib.castPreview(folder(), cast.id);
          if (p) {
            const md = new vscode.MarkdownString('**' + p.name + '** (`' + cast.id + '`)\n\n![doll](' + p.doll + ')' + (p.portrait ? ' ![portrait](' + p.portrait + ')' : ''));
            return new vscode.Hover(md, new vscode.Range(pos.line, cast.start, pos.line, cast.end));
          }
        } catch (e) { /* a half-edited source can fail to load: no preview then */ }
      }
      const art = lib.findArtAt(text, offset);
      if (art) {
        const k = lib.keyAfter(text, art.end, pal, defaultKey), r = lib.renderArt(art.rows, k && k.key, pal);
        const note = k ? 'colours from ' + k.from : 'no colour key found next to it: each letter gets its own colour';
        const md = new vscode.MarkdownString('![pixel art](' + r.uri + ')\n\n' + r.w + ' × ' + r.h + ' · ' + note);
        return new vscode.Hover(md, new vscode.Range(doc.positionAt(art.start), doc.positionAt(art.end + 1)));
      }
      return null;
    }
  });
  context.subscriptions.push(hover);

  // ---------------- story check: on start, and after saving a game source
  let running = null, again = false, last = null;
  /** runs the checker and shows its problems; resolves when they are shown (a save during a run queues one more) */
  function check() {
    const root = folder(); if (!root || !vscode.workspace.isTrusted || !fs.existsSync(path.join(root, 'tools', 'story_check.js'))) return Promise.resolve(null);
    if (running) { again = true; return running; }
    // inside VS Code, execPath is the editor's Electron, which runs as plain Node with ELECTRON_RUN_AS_NODE: no PATH needed
    const env = Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' });
    running = new Promise(resolve => execFile(process.execPath, [path.join(root, 'tools', 'story_check.js'), '--json'], { cwd: root, env, maxBuffer: 8 << 20 }, (err, stdout) => {
      try {
        const json = JSON.parse(stdout), byFile = lib.toProblems(json);
        diagnostics.clear();
        for (const file in byFile) diagnostics.set(vscode.Uri.file(path.join(root, file)), byFile[file].map(p => {
          const d = new vscode.Diagnostic(new vscode.Range(p.line, p.col, p.line, p.col + 1), p.message, p.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning);
          d.source = 'story check'; return d;
        }));
        last = { problems: json.problems.length, known: json.known };
      } catch (e) { /* the checker could not load the sources (mid-edit): keep the last results */ }
      running = null; resolve(last);
      if (again) { again = false; check(); }
    }));
    return running;
  }
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
    const root = folder(); if (!root) return;
    const rel = path.relative(root, doc.uri.fsPath).split(path.sep).join('/');
    if (/^src\/.*\.js$/.test(rel)) { if (/^src\/0[14]_/.test(rel)) readPalette(); check(); }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('hourglass.check', check));
  context.subscriptions.push(vscode.commands.registerCommand('hourglass.openEditor', () => {
    const root = folder(); if (!root) return;
    const file = path.join(root, 'character_editor.html');
    if (fs.existsSync(file)) vscode.env.openExternal(vscode.Uri.file(file));
    else vscode.window.showWarningMessage('character_editor.html is not built yet: run "npm run build".');
  }));
  check();
  return { check, get palette() { return pal; }, get lastCheck() { return last; } };
}
function deactivate() {}
module.exports = { activate, deactivate };
