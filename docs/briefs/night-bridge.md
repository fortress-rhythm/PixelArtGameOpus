# Night Bridge — cinematic scene brief

A new cinematic scene, separate from Ravenshore Garden and set in the fork's own world (not Ravenshore: that
setting is © Odiriuss). **Built:** `night_bridge.html`, from `src_bridge/` on the shared cinematic core
(`src_cine/`). Where the build had to decide something this brief left open, it says so under **Decided in the
build**; change any of it here and in the sources.

Layout tool: <https://claude.ai/artifact/HWS7V8ao8GacL9atNQLFxC> — set the bridge, land and camera shots there and
paste its "For the brief" text over the **Layout** section below.

## What matters most

1. **The woman is the focus.** When anything competes with her, simplify the background first. Her colours appear
   nowhere else: strawberry-auburn hair, a dark red cloak, then teal / sky-blue tunic and loose trousers.
2. **Secretive, but leisurely.** Nobody is chasing anyone on screen. She hurries only to catch the children; after
   that she moves calmly and checks around her often.
3. **The world keeps its own time.** Boats, the steamer, spotlights and lamps never pause for her. Time them so
   their big moments (the steamer under the arch) fall in her quieter moments, by choosing when they start and how
   fast they drift, so nothing looks staged.
4. **Less at once than the garden.** A few strong lights, not a field of blinking ones.

## Look

- **Night**, violet-leaning throughout. A full moon, silver-violet rather than golden, to the right, behind a
  camellia tree that marks where the town begins.
- **The bridge:** crystalline, silvery, translucent: what is behind shows through, slightly tinted and brightened,
  with bright silver edges and railings. It picks up the amber lamps and the phosphorescent (pale green-cyan) lights
  placed along it, and **glows a little from inside**: lights set inside the girders and along the arch so the
  glass lights up from within.
- **Shape:** a gentle parabola on top; beneath it a hyperbola-shaped arch, thin at the top and deep near the ends;
  triangular girders (alternating diagonals) between them; solid end spans at each bank with a few arched openings.
  The top of the bridge sits left of centre in the opening shot.
- **Trees on the bridge:** thin conifers and a few yellow larches in small translucent pots with little mounds of
  earth, a few roots creeping down the glass. Spotlights from the banks light the bridge from below.
- **Beneath:** a dark, reflective river: the bridge, its lights and the lighthouse mirrored and broken by ripples;
  boats break the reflection where they pass.
- **Distance:** a broad volcanic mountain, Fuji-like but less distinctive (an off-centre shoulder, light snow).
  Nearer, green valley hills with a few cliffs of violet-to-plum earth. The horizon slopes gently across the wide
  world; tall verticals (lighthouse, trees, lamp posts) carry the height.
- **Fireflies:** a few, low over the bridge near the left end and the trees: faint phosphor-green specks, a
  handful at a time, never a swarm.
- **Town, to the right:** a few simple shops; the inn is marked by a lamp at its door.
- **The lighthouse:** narrow, standing behind the top of the bridge. From the top of the deck a short, foreshortened
  staircase climbs to its door. The tower rises out of the opening shot; the ending tilts up to it.
- **Colours:** moderate them where it helps. Earth violet → plum; silver; amber; phosphor green-cyan; the moon's
  silver-violet; her red cloak and teal clothes as the only strong colours on a person.

## Layout

*Replace this section with the text from the layout tool.* Starting values (the tool's defaults):

```
Screen 320×180. World 620 px wide, 70 px of room above the opening shot.
Heights are % of screen height, up from the bottom of the opening shot; x is in world pixels.
River surface 16%. Hills 28% with 3 violet-plum cliffs; horizon slopes 4% across the world.
Mountain at x 300, 64% high, 380 px wide. Moon at x 200, 78%, radius 10 px; camellia at x 500.
Bridge deck: left end x −30 at 22%, top at x 150 and 40%, right end x 420 at 24%.
Arch beneath: 6 px below the deck at the top, 30 px near the ends, sharpness 3. End spans 44 px with 2 openings.
Girders: 12 panels. 6 inner glows, lamps every 18 px, 3 spotlights. 7 trees, 18 px, every 3rd a larch.
Lighthouse behind the top at x 160, 10 px wide, rising 96 px above its door; stairs climb 10 px.
Town: 4 shops from x 470; shop 2 is the inn.
Shots: opening at x 0; shop door at x 300; tower at x 20, tilted up 40 px.
Figures: her 30 px tall, the children 20 px.
Parallax: sky and moon 0, mountain 0.1, hills and cliffs 0.3, camellia 1. Every x is where a thing sits in the
opening shot.
```

## Parallax

The world is wider than the screen and the camera moves (drifts right, back left, tilts up the tower), so each
layer moves at its own fraction of the camera: a layer at 0 stays put, 1 moves with the bridge, above 1 passes
faster than the bridge (foreground).

**The speeds are tuned in the layout tool for now** (its *Parallax* group; scrub the camera or play its moves to
judge them) and come into this brief with the rest of its "For the brief" text. Its starting values: sky and moon 0,
mountain 0.1, hills and cliffs 0.3, the bridge, river, town and figures 1, the camellia 1 (above 1 if it should
pass in front).

- Every x in the layout is where a thing sits in the opening shot. A layer then moves
  `round((camera − opening x) × speed)` pixels as the camera moves, and `round(tilt × speed)` as it tilts, so with
  speed 0 the moon stays at the same place on screen in every shot. The tool reports where the moon and the
  camellia land in the door shot.
- On the tilt up the tower the mountain and moon barely rise, so the tower climbs past them.
- Reflections move with the layer they reflect, so the mirrored moon stays put too.
- Offsets are whole pixels, rounded per layer, so layers step rather than smear; slow layers stepping at different
  moments is part of the look.

## Cast

All original (design logs in `docs/design-log/`, made in the character editor):

- **The woman:** strawberry-auburn hair. A dark red cloak, fitted enough to read as a dress; when she takes it off,
  a teal / sky-blue tunic and loose trousers, the cloak slung over her arm like a bag. Her silhouette must change
  clearly between the two.
- **Two children**, elementary-school age, about two-thirds her height, in muted colours.
- **Two proprietors** at the inn, in muted colours, seen mostly in the doorway.

## Beats

As built (`src_bridge/04_story.js`); story 92 s, then the loop.

| Time | Beat | Camera |
|---|---|---|
| 0–5 s | The scene at rest: bridge, river, the moored fishing boat, lamps, fireflies. | Opening shot |
| 5–10 s | The two children run in from off-screen left, over the top and down the bridge. They stop and look back the way they came. | Opening |
| 10–17 s | Separately: the younger one tries to catch a firefly (reaching, two claps, it gets away upwards); the older one walks on and leans over the far railing, where a fishing boat is coming down the river, then waves the younger one over. | Opening |
| 17–25 s | Together: both lean over the far railing as the boat comes (its engine, then its bell); it passes under them and they cross to lean over the near railing as it comes out on our side. | Opening |
| 21–27 s | The woman hurries in from the left, catches the older child's arm and waves the younger one to follow. | Opening |
| 27–38 s | The three walk down to the inn, her hand on the older child's arm. | Drifts right to the door shot |
| 38–46 s | The innkeepers open the door; she talks with them; the wife beckons the children in. | Door shot |
| 46–52 s | She goes in after them; the upstairs window flickers on. | Door shot |
| 52–58 s | She comes out, the door shuts behind her; she looks up at the lit window, then up and down the street. | Door shot |
| 58–72 s | She walks back up the bridge. | Drifts back to the tower shot |
| 70–76 s | The steamer passes under the arch and sounds its horn, while she stands at the top, facing out. | Tower shot |
| 74–78 s | She takes off the cloak and folds it over her arm. | Tower shot |
| 78–85 s | She looks both ways, climbs the stairs, unlocks the door and goes in. | Tower shot |
| 86 s → | The lighthouse lamp lights; its beam starts to turn. | Tilts up the tower, then holds |

Throughout: one fishing boat is moored near the town, bobbing; another comes down the river past the children.

## Ending

The story plays once, then the scene settles into a seamless ambient loop (river, boats, lamps, spotlights, fireflies,
and the lit lighthouse lamp), so "this goes on all night". A replay starts the story again.

## How it's built

- A timeline that is a pure function of time, as in the garden: `?t=` jumps to any moment, `?freeze=1` holds it.
- The ambient loop follows the garden's rules and gets the same tests: whole cycles per loop, everything reset
  at the loop point, the second loop identical to the first.
- Parallax is an offset per layer, `round(camera × factor)`, computed from time like everything else.
- Built on the cinematic core shared with the garden (`src_cine/`), not a fourth copy of the core.
- Same rendering rules as the other pages: palette-index framebuffer, light by palette remaps, ordered dither,
  whole pixels, no smoothing.

## Decided in the build

Change any of these freely.

- **Screen:** 320×180, no letterbox, as the layout tool's default.
- **Layout:** the tool's default numbers (`LAY` in `src_bridge/01_config.js`, same names as the tool). If you tuned
  the tool, paste its "For the brief" text and the numbers go into `LAY`.
- **Sizes the tool couldn't judge without people,** set to fit a 30 px woman (`SIZE` in the same file): trees in
  pots 38 px (tool 18), the lighthouse 18 px wide (tool 10) with a 10×33 door, a railing 12 px high, the inn's
  door 16×34. The town's street is level with the bridge's right end, and the shops are two and three storeys.
- **Boats:** the river runs towards us under the bridge, so the boats travel in depth: they grow as they come
  nearer. The children's boat comes down from behind the bridge; the steamer does too, under the arch, then turns
  away to the left.
- **The steamer** passes under the bridge at 70 s, not 44 s: the arch is only tall enough near its middle, which
  the door shot doesn't see. It now passes while she stands at the top, a quiet moment.
- **The children's pauses:** firefly (the younger) and the far railing (the older) separately, then both railings
  together, with the boat's sound.
- **Sound:** generated, a few cues: the river, the fishing boat's engine and bell, the inn door, the steamer's
  rumble and horn, the key, the tower door, the lamp. Browsers need a click or a key first (M mutes).
- **The ambient loop** is 24 s on the tilted tower shot: the beam turns three times, lamps, glows, fireflies, stars.
