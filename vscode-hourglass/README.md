# The Hourglass City for VS Code

Authoring help for this repository's sources. Plain JavaScript, no build step, no dependencies, no network.

- **Pixel art on hover.** Hover any string map (`['..ooooo..', '.oiiiio.', ...]`) to see it drawn. The colours come
  from the object key right after it (`{ o: C.INK, i: C.CREAM }`), or the default costume when it is drawn with `K`;
  otherwise each letter gets its own colour so you can still see the shape.
- **Palette on hover.** Hover `C.TAN` to see the colour, its index and hex.
- **Cast on hover.** Hover a cast id (a `CAST_DEFS` entry, `['say', 'russo', ...]`, `ACT.frank`) to see the doll from
  the front and back and the portrait, drawn by the game's own code.
- **Story check as problems.** The checker (`tools/story_check.js`) runs when the folder opens and after you save a
  file in `src/`; its errors and new warnings appear in the Problems panel and as squiggles.
- **Commands:** *Hourglass: Run story check*, *Hourglass: Open character editor*.

Cast previews and the story check run the repository's code, so they only work in a trusted workspace.

## Install

```sh
node vscode-hourglass/install.js
```

Then restart VS Code and open the repository folder. To work on the extension itself, open `vscode-hourglass/`
and press F5.

## Tests

```sh
node --test "vscode-hourglass/test/*.test.js"
```

They run in plain Node with a small stub of the VS Code API, and are part of `npm run test:unit`.
