// Copies this extension into VS Code's extensions folder (Windows, macOS, Linux). Restart VS Code afterwards.
//   node vscode-hourglass/install.js
const fs = require('fs'), path = require('path'), os = require('os');
const pkg = require('./package.json');
const dest = path.join(os.homedir(), '.vscode', 'extensions', pkg.publisher + '.' + pkg.name + '-' + pkg.version);
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const f of ['package.json', 'README.md']) fs.copyFileSync(path.join(__dirname, f), path.join(dest, f));
fs.cpSync(path.join(__dirname, 'src'), path.join(dest, 'src'), { recursive: true });
console.log('installed to ' + dest + '\nrestart VS Code (or run "Developer: Reload Window")');
