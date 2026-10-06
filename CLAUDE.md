# PixelArtGameOpus — working notes for Claude

Noir pixel-art games in the browser, every pixel and sound generated in code (no image, font or audio files).
This is fortress-rhythm's fork of Odiriuss's repository. Three games and one tool, each a single HTML file built
from sources:

| Page | Sources | What |
|---|---|---|
| `hourglass_city.html` | `src/*.js` | **The Hourglass City**, isometric point-and-click adventure, Act I |
| `hourglass_testlevel.html` | `src/01–12` + `src_test/` | **The Black Sedan**, driving and gunplay on the same engine |
| `ravenshore_garden.html` | `src_garden/` | **Ravenshore Garden**, a cinematic loop (its own engine) |
| `character_editor.html` | `src/01,03,04,13` + `tools/character_editor/` | the character editor |

**Licence:** the code is MIT. The story, characters, setting, names and dialogue of *The Hourglass City* are
© Odiriuss, all rights reserved. A new story for this fork gets its own cast and world; don't copy Act I's text
into new material.

## Commands

```bash
npm install                       # once (puppeteer-core, typescript)
npm run build                     # all pages; node tools/build.js city|test|garden|editor for one
npm run watch                     # rebuild on save
npm run check                     # story check: file:line problems in the adventure's story and rooms
npm run test:unit                 # Node only: engine, story check, edit mode, people, portraits, extension, garden loop
npm test                          # everything, including the browser playthroughs (needs Chrome; CHROME_PATH)
npm run typecheck                 # files that start with // @ts-check
node tools/sprite_sheet.js [ids] [--silhouette|--walk|--portraits]   # cast to shots/*.png
```

The user is on Windows. Give `npm`/`node` commands; nothing the user runs may need bash.

## How the code works

- **One global scope.** `tools/build.js` concatenates a game's files into one `<script>`; the number in the
  filename is the load order. A new file's number says where it belongs (`13_portraits` before the rooms, `47_edit`
  after them, `90_main` last). `tools/load_game.js` runs the sources in Node (stub DOM) for tests and tools.
- **Rendering:** a 320×180 framebuffer of palette indices plus depth, hotspot and material buffers
  (`01_core.js`). Light is palette remaps (`LIT`, `SHD`) with Bayer dither. Rooms are baked once (`03_iso.js`,
  `05_engine.js`).
- **Rooms** (`src/30_*.js`–`45_*.js`): `defRoom({ id, bounds, walk, block, lights, occluders, hotspots, build() })`,
  coordinates in metres. Hotspot fields: `id, name, at` (where Frank stands), `pos` (the object), `face, look, use,
  talk, items{}, cond, exit{room,x,y,dir}`.
- **Scripts** are arrays of commands: `['say', who, text]`, `['walk', who, x, y, dir]`, `['face', who, target]`,
  `['pose', who, name, secs, block]`, `['wait', s]`, `['fade', 'out'|'in', s]`, `['room', id, x, y, dir]`,
  `['choice', [{ t, c, d, once, say }]]`, `['give'|'take', item]`, `['clue', id]`, `['ded', id]`, `['flag', k, v]`,
  `['goal', text]`, `['sfx', name]`, `['caption', text, s]`, `['doc', id]`, `['lb', 0|1]`, `['place', who, x, y, dir]`,
  `['remove', who]`, `['cam', ...]`, `['fn', f]`, `['save']`, `['end']`.
- **Story data:** `item(id, {...})`, `clue(id, title, text)`, `ded(id, a, b, title, text, then, need, needText)`
  in `20_story.js`/`21_story2.js`. `ded(...)` returns the deduction: `.optional = true` marks one that only adds
  flavour. A choice option's `c: () => hasClue('d_x')` gates it on a deduction.
- **People:** `CAST_DEFS` in `04_people.js` draws both the doll and the portrait (`13_portraits.js`). Every option
  is in `docs/characters.md`.

## Rules

- **The story check must pass with 0 errors** (`npm run check`). A PostToolUse hook rebuilds the game and runs it
  after every edit to `src/`; fix what it reports before doing anything else. It shows new warnings only: the 16
  "decides nothing" warnings for Act I are accepted in `tools/story_check.known.json`. Don't edit the story to
  silence them unless asked, and don't `--accept` new warnings without saying so.
- **Rebuild before committing.** The built `.html` files are committed and `tests/unit/build.test.js` fails when
  they are stale. Never edit a built `.html` directly.
- **New characters are original.** Start every new character from blank or from the editor's examples, never by
  editing an Act I cast entry (those designs are © Odiriuss). Keep a design log from `docs/design-log/TEMPLATE.md`.
  Never generate a character to resemble an existing game, comic or film character, and say so if asked to.
- **Don't change how existing characters look by accident.** `tests/unit/people.golden.json` pins every frame of
  every cast member and the test level's combat frames. A new option must draw nothing different when it is left
  out. Accept intentional changes with `UPDATE_GOLDEN=1 npm run test:unit` and say so in the commit.
- **Code style** (`docs/code-style.md`): don't reformat existing code (no Prettier over old files); engine code
  stays dense, content reads like data; name numbers used across files; new game source files start with
  `// @ts-check`; prefix new globals by subsystem; check the name is free first (everything is global: a local
  `has()` once shadowed the item check).
- **Run the browser tests after engine or story changes** (`npm run test:city`, `npm run test:level`); they take
  about five minutes.
- **Room geometry:** use edit mode (`hourglass_city.html?edit=1&room=<id>`, or F2) to place things and copy the
  lines, rather than guessing coordinates. Exits must land on walkable ground (the story check enforces it).
- **The garden loop must stay seamless** (`tests/unit/garden.test.js`): anything that repeats runs a whole number
  of cycles per loop (`osc(k, …)` or `N * t / LOOP_S` with whole k, N), and anything with state resets in `loopReset`.
- **Git:** small commits that each do one thing; fast-forward merges only.

## Skills

- `/new-room`: add a room to the adventure.
- `/new-character`: add a character (doll, portrait, silhouette check).
- `/story-beat`: add a scene, clue, deduction or puzzle, wired so the notebook decides something.
