# Characters: dolls, portraits and silhouettes

Every person in the game is one entry in `CAST_DEFS` (`src/04_people.js`). The same entry draws the
26×46 **doll** that walks around the rooms and the 64×72 **portrait** (`src/13_portraits.js`). Nothing is
hand-drawn: the entry is a handful of choices and a colour key.

Open **`character_editor.html`** to make one. It draws with the game's own code, shows the doll in four
directions, walking, talking and under slatted light, the portrait in every expression, and the new character's
silhouette against the whole cast. **Copy definition** gives the line to paste into `CAST_DEFS`.

## Identity in two sizes

At 30 pixels tall a face is five pixels wide, so the doll is recognised by its **outline**; the portrait carries
the **face**. Give each character:

1. **A silhouette nobody else has.** Check it in the editor's black lineup (or `node tools/sprite_sheet.js
   --silhouette`): if you can name every figure from the black shapes alone, it works. Height, hat and stance do
   most of the work; then shoulders, coat length, the standing pose and a carried prop.
2. **One signature feature** that shows at both sizes: glasses, a scarf, a buttonhole flower, a badge, a beard,
   a cane. It is how the player connects the portrait to the figure across the room.
3. **A face of their own** in the portrait: face width, jaw shape, chin width, nose length and eye spacing.

What keeps the style: the 60-colour palette, the one-pixel dark outline, light from the left (light edge left,
shadow right), the three-quarter view, and one pixel size everywhere. Every option below stays inside those.

## The definition

```js
inspector: { h: 33, body: 'long', hat: 'homburg', hair: 'short', color: C.CREAM, name: 'Inspector',
             face: { faceW: 10, jaw: 'point', jawW: 3, noseLen: 8, lines: true }, neck: 1, shoulders: 1,
             idle: 'crossed', sig: ['moustache'], key: costume({ C: C.INK, c: C.BLK, K: C.ST0, H: C.INK, h: C.BLK, b: C.OX }) },
```

| Field | Values | Effect |
|---|---|---|
| `h` | 24–36 | height in rows, feet to crown (before neck and hat) |
| `body` | `coat` `long` `suit` `vest` `skirt` `dress` | torso and lower garment, lapels or bow tie, belt |
| `hat` | `none` `fedora` `homburg` `bowler` `cloche` `newsboy` `beret` `cap` `doorman` `pillbox` | |
| `hair` | `short` `slick` `bob` `bun` `bald` `long` `curly` `pomp` | |
| `wide` | 0 / 1 | one extra column each side (stocky) |
| `neck` | 0–2 | rows of neck: lifts the head |
| `shoulders` | −1–2 | pixels per side, tapering to the waist |
| `belly` | 0–2 | rounds out the front |
| `flare` | 0–3 | how far a coat hem flares (default 1.4) |
| `stance` | 0–2 | feet further apart |
| `lean` | −1–1 | upper body back or forward |
| `stride`, `bounce` | default 1 | walk: leg swing and bob |
| `idle` | `pockets` `crossed` `hips` `smoke` | the standing pose |
| `sig` | `glasses` `moustache` `beard` `scarf` `flower` `badge` `satchel` `cane` `case` | signature features, on doll and portrait |
| `face` | `faceW` `jaw` (`square` `round` `point`) `jawW` `noseLen` `eyeGap` `brow` `lips` `lines` `stubble` `freckles` | portrait only |
| `color`, `name` | | speech colour and the name shown in the game |
| `key` | `costume({ slot: C.COLOUR })` | colours; anything left out keeps the default |

Colour slots: `C c K` garment (mid, shadow, light), `T t` trousers or skirt, `W` shirt, `N` tie, `B k` belt and
buckle, `F` shoes, `H h b` hat and band, `S s L` skin, `A a` hair, `e` eyes, `m` mouth or lips, `G` gloves,
`X` buttons and badge, `Y` glasses, `V` scarf and flower, `P` cane, bag and case, `o` outline.

## Tools

- `palettes/`: the game's 60 colours for your pixel editor, in the game's order and named after `C.*`:
  `hourglass.gpl` (Aseprite, Pixelorama, Piskel, Krita, GIMP), `hourglass.pal` (JASC), `hourglass.hex`, and
  `hourglass.png` (one pixel per colour, for "load palette from image"). Regenerate with `npm run palette` if
  `PAL_HEX` ever changes; a unit test fails while they are stale.

- `character_editor.html`: build with `npm run build` (or `node tools/build.js editor`), open in a browser.
- `node tools/sprite_sheet.js [ids] [--silhouette | --walk | --portraits]` writes a PNG to `shots/`.
- The unit tests pin every existing frame (`tests/unit/people.golden.json`): adding options never changes a
  character that doesn't use them. To change an existing character on purpose, accept the new frames with
  `UPDATE_GOLDEN=1 npm run test:unit`.

## Importing a drawing

Draw in any pixel editor with the palette from `palettes/`, save a PNG, then:

```sh
node tools/import_art.js head-front.png --for inspector      # letters from that character's costume
node tools/import_art.js sign.png                           # any stamp: each colour gets its own letter
```

It prints the drawing as rows of letters, ready to paste. Where a pixel's colour is one of the character's costume
colours it gets that slot's letter (`S` skin, `A` hair, `H` hat…), so the drawing recolours with the costume. Other
colours get letters of their own, listed as `colours`. Pixels that aren't palette colours are snapped to the
nearest one and reported. The reader handles what pixel editors save (8-bit RGB/RGBA/grey and indexed PNGs).

## Adding a new option

Add it to `drawFigure` (doll) and, if it should show in the portrait, `drawPortrait`, with a default that draws
nothing different. Then add it to the editor's lists in `tools/character_editor/editor.js`, a line in the table
above, and a case in `tests/unit/people.test.js` (`OPTIONS`) so the test proves it changes the drawing.
