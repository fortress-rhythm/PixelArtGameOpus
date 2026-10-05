---
name: new-character
description: Add a character to The Hourglass City — a CAST_DEFS entry that draws the walking doll and the dialogue portrait, with a silhouette nobody else has and one signature feature that reads at both sizes, checked against the cast. Use when the user says "/new-character", "add a character", "make a doll", "design <name>", "give <name> a portrait", or asks about silhouettes.
argument-hint: "[id] [who they are, what they wear, how they stand]"
---

# /new-character — a doll and a portrait from one definition

Read `docs/characters.md` first: it lists every option, colour slot and the rules for a readable silhouette.

## Steps

1. **Pin who they are** in a sentence: job, age, build, one thing people remember about them. That sentence picks
   the options; don't pick options first. Start the design log: copy `docs/design-log/TEMPLATE.md` to
   `docs/design-log/<id>.md` and fill in who they are.
   **Start from blank or an editor example, never from an Act I cast entry** (© Odiriuss). If the user describes a
   character that matches an existing one from Act I or from another work, say so and suggest how to make it theirs.
2. **Silhouette first.** Choose height (`h`), `body`, `hat` and the standing pose (`idle`), then shoulders, neck,
   belly, stance, lean, coat flare. Aim for an outline no current cast member has: run
   `node tools/sprite_sheet.js --silhouette` and compare; if two black shapes look alike, change height, hat or
   stance before anything else.
3. **One signature feature** (`sig`): glasses, moustache, beard, scarf, flower, badge, satchel, cane or case. It must
   show on both the doll and the portrait. If the story needs something not on the list, add it to `drawFigure`
   and `drawPortrait` (see "Adding a new option" in `docs/characters.md`), with its unit-test case.
4. **Face** (`face`, portrait only): face width, jaw and chin width, nose, eye spacing, brow; lips, lines, stubble,
   freckles. Make it differ from every portrait already in the cast (`node tools/sprite_sheet.js --portraits`).
5. **Colours** through the costume key, palette names only (`costume({ C: C.TAN, ... })`). Keep within the noir
   palette: saturated colour is rare and means something.
6. **Write the entry** in `CAST_DEFS` (`src/04_people.js`) in the house format, one entry per character. The user
   can also make it in `character_editor.html` and paste the copied line; offer that for anything visual.
7. **Hand-drawn parts:** if the user has sketches, the head and portrait can be drawn in a pixel editor with
   `palettes/hourglass.gpl` and imported (`node tools/import_art.js file.png --for <id>`, or the editor's
   *Hand-drawn parts* buttons). See "Hand-drawn parts" in `docs/characters.md`.
8. **Check.** `npm run test:unit` (the golden test must still pass: existing characters unchanged), render the
   sheets above and look at them, then `npm run build`. Show the user the silhouette lineup and the portraits.
9. **Log it:** add the silhouette check and the date to the design log.
10. To put them in a room: an actor (`ACT[id]`), `['place', id, x, y, dir]` in a script, and a hotspot with
   `actor: id` and `talk`.

## Don't

- Don't change an existing character's options without being asked: `people.golden.json` will fail, and that
  failure is the point.
- Don't base a new character on Act I's cast (© Odiriuss); the editor's examples are original and free to use.
