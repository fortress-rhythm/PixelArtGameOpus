---
name: new-room
description: Add a room to The Hourglass City — a new src/NN_<room>.js with defRoom (bounds, walk and block areas, lights, hotspots, build()), connected by exits both ways, placed with edit mode, story-checked and tested. Use when the user says "/new-room", "add a room", "a new location", "make the <place>", or asks to connect a new area.
argument-hint: "[room id] [what it is] [which room it connects to]"
---

# /new-room — one room, from plan to playable

Read `CLAUDE.md` first if you haven't this session. Rooms are code: copy the shape of a room of similar size
(`30_office.js` is small, `32_ferrier.js` is a street, `41_club.js` a big interior), not its content.

## Steps

1. **Pin the brief.** Room id (lowercase, no spaces), name, what happens there, which room(s) it connects to and
   through what (door, stairs, lift, street edge). If the user hasn't said what the player does there, ask: a room
   with nothing to decide is a corridor, and the review of this game found too many of those.
2. **Pick the file number.** Rooms are `30`–`45`; take the next free number after the rooms it belongs with.
   Content is code that loads in order, so a room must load after `20_story.js` if it uses its items or clues.
3. **Write the definition** with `defRoom({ id, name, bounds: [x0, y0, x1, y1], zmax, start: [x, y, 'SE'], ambient,
   lights, occluders, walk, block, hotspots, build(rb, HS) {...} })`. Coordinates are metres; `x` runs down-right
   on screen, `y` down-left. Keep the room small: 6×5 m is an office, 15×10 m a street. Use the palette (`C.*`)
   only; shade with the existing helpers (`flat`, `papered`, `carpet`, …) and stamps (`rStamp`, `rDecalX/Y`).
4. **Hotspots:** every one has `id`, `name`, `at` (where Frank stands, on the walkable floor), `pos` (the object),
   `look`. Things you can do get `use`/`talk`/`items`. Exits get `exit: { room, x, y, dir }` — and the target room
   gets the matching exit back.
5. **Build and place.** `npm run build`, then open `hourglass_city.html?edit=1&room=<id>`: drag stand points,
   blocked areas and lights until they sit right, press C, and paste the copied lines over the guesses. Tell the
   user to do this step if you can't open a browser; give them the URL.
6. **Check.** `npm run check` (0 errors: exits land on walkable ground both ways, speakers and items exist),
   `npm run test:unit`, then `npm run test:city`. Add the new exits to `tests/city_exits.json` if it lists them.
7. **Commit** the room, the exits in the neighbouring room and the rebuilt `hourglass_city.html` together.

## Don't

- Don't reuse Act I's text or characters in new material (© Odiriuss).
- Don't add a room whose only purpose is to walk through it; merge it into its neighbour instead.
