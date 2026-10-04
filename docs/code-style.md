# Code style

How the sources are written today, why, and the rules for changing them. The short version: keep the engine
dense, make new content readable, and lean on tools (the story checker, the unit tests, the type checker)
rather than a rewrite.

## What the code is like

The games were grown from prompts by successive Claude Code sessions. That shows:

- **One global scope.** `tools/build.js` concatenates the files of a game into one `<script>`. There are no
  modules: a file uses anything an earlier file declared. The number in the filename is the load order
  (`01_core` before `03_iso` before `30_office`), so a new file's number is part of its meaning.
- **Short names for hot data.** `fb` (framebuffer), `zb` (depth), `hb` (hotspot ids), `mb` (materials), `RB` (the
  room buffer being drawn), `SF` (the sprite frame being drawn), `K` (a costume key), `C.TAN` (palette colours).
  These are used thousands of times in inner loops; the comment where each is declared is the glossary.
- **Dense lines.** Several statements per line, up to about 200 characters. Rooms read like tables: one hotspot or
  one light per line.
- **Numbers inline.** Positions in metres, timings in frames (60 per second) or seconds, palette indices. A room's
  numbers only mean something next to that room's floor plan.
- **Content is code.** A hotspot's `use` is a function that returns a script (`[['say', 'frank', '...'], ...]`),
  so story logic, data and drawing sit side by side.
- **Comments explain why, at the top.** Each file and each section opens with a short paragraph. Inside, comments
  are rare and mark the non-obvious (`// the Mirador's sign through the blinds`).

The good side: no build step, fast (typed arrays, baked lighting, nothing allocated per frame), consistent with
itself, and easy for an AI to search. The bad side: hard for a person to navigate, and a change can break
something three files away without any warning.

## Rules

1. **Don't reformat old code.** No Prettier or ESLint `--fix` over existing files: it explodes the one-liners and
   ruins `git blame`. Format new files however reads best.
2. **Two layers.** The engine (`01`–`12`, `47_edit`) stays dense and fast. Content (rooms, story, cast, portraits)
   should read like data: one thing per line, named fields, comments on anything a writer would ask about.
3. **Name the numbers that matter across files.** A constant used in more than one place, or one a designer will
   tune, gets a name and a comment where it is declared (`WALK_SPEED`, `ACTOR_DEPTH`, `DITHER_SPREAD`). A
   coordinate inside one room's `build()` stays a number.
4. **New game source files start with `// @ts-check`.** The type checker then runs on them (`npm run typecheck`). Write a
   JSDoc type where inference gives up (`/** @type {number[]} */`). Old files are not checked: turning it on
   shows about 40 complaints, almost all about mixed-type script arrays, and fixing them is not worth the churn.
5. **Pure parts get unit tests.** Projection, lighting, the people builder, pathfinding and the notebook have
   tests in `tests/unit/` that load the sources in Node (`tools/load_game.js`). If you change how the existing
   cast is drawn on purpose, accept the new frames with `UPDATE_GOLDEN=1 npm run test:unit` and say so in the commit.
6. **The story check must pass.** `npm run check` (also run by the Claude hook after every edit, and by
   `npm test`). It reports new problems only; the existing Act I warnings are listed in `tools/story_check.known.json`.
7. **Rebuild before committing.** The built `.html` files are committed; `tests/unit/build.test.js` fails if they
   are stale. `npm run watch` rebuilds on every save.
8. **No new globals by accident.** Everything is global, so prefix a new subsystem's names (`edit…`, `EDIT`,
   `portrait…`) and check `Ctrl+T` in VS Code for the name before you take it.

## Editor support

Each game folder has a `jsconfig.json` that tells VS Code its files are one program, so go to definition, hover
and find references work across files (open the repo folder, not a single file). The `types/game.d.ts` file
declares the few browser globals the DOM typings miss.

## If you want to go further

The step after this is ES modules bundled into the same single HTML file (esbuild can do this in one command,
with no runtime cost). It would make dependencies explicit and let the editor check everything. It touches every
file, so do it as a single mechanical commit, before a new story starts, if at all.
