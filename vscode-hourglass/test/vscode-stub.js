// Just enough of the VS Code API to load the extension in Node and call what it registers.
const Module = require('node:module');
class Position { constructor(line, character) { this.line = line; this.character = character; } }
class Range { constructor(a, b, c, d) { this.start = a instanceof Position ? a : new Position(a, b); this.end = a instanceof Position ? b : new Position(c, d); } }
class Hover { constructor(contents, range) { this.contents = contents; this.range = range; } }
class MarkdownString { constructor(value) { this.value = value || ''; } }
class Diagnostic { constructor(range, message, severity) { Object.assign(this, { range, message, severity }); } }
const registered = { hovers: [], commands: {}, saves: [], diagnostics: new Map() };
const vscode = {
  Position, Range, Hover, MarkdownString, Diagnostic, DiagnosticSeverity: { Error: 0, Warning: 1 },
  Uri: { file: (p) => ({ fsPath: p, toString: () => 'file://' + p }) },
  workspace: { workspaceFolders: [], isTrusted: true, onDidSaveTextDocument: (f) => { registered.saves.push(f); return { dispose() {} }; } },
  languages: {
    registerHoverProvider: (sel, p) => { registered.hovers.push(p); return { dispose() {} }; },
    createDiagnosticCollection: () => ({ clear: () => registered.diagnostics.clear(), set: (uri, list) => registered.diagnostics.set(uri.fsPath, list), dispose() {} })
  },
  commands: { registerCommand: (id, f) => { registered.commands[id] = f; return { dispose() {} }; } },
  window: { showWarningMessage() {} }, env: { openExternal() {} }
};
const load = Module._load;
Module._load = function (request, ...rest) { return request === 'vscode' ? vscode : load.call(this, request, ...rest); };
// a text document over a string
function doc(text, file) {
  const lines = text.split('\n'), offs = [0]; for (const l of lines) offs.push(offs[offs.length - 1] + l.length + 1);
  return {
    uri: { fsPath: file || '/x.js' }, getText: (r) => r ? text.slice(offs[r.start.line] + r.start.character, offs[r.end.line] + r.end.character) : text,
    offsetAt: (p) => offs[p.line] + p.character, positionAt: (o) => { let l = 0; while (offs[l + 1] <= o) l++; return new Position(l, o - offs[l]); },
    lineAt: (l) => ({ text: lines[l] }),
    getWordRangeAtPosition: (p, re) => { const line = lines[p.line]; for (const m of line.matchAll(new RegExp(re.source, 'g'))) if (p.character >= m.index && p.character <= m.index + m[0].length) return new Range(p.line, m.index, p.line, m.index + m[0].length); return undefined; }
  };
}
module.exports = { vscode, registered, doc, Position };
