---
name: story-beat
description: Add a story beat to The Hourglass City — a scene, clue, deduction, puzzle or dialogue choice — wired so the notebook and the player's choices decide something, then story-checked and played through. Use when the user says "/story-beat", "add a clue", "add a deduction", "add a puzzle", "write the scene where…", "add a choice", or asks to make the notebook matter.
argument-hint: "[what happens] [where] [what it unlocks]"
---

# /story-beat — content that changes what the player can do

The review of Act I found its notebook decided nothing: 20 deductions, none checked. New beats must not repeat
that. Every clue leads somewhere; every deduction opens something.

## The words belong to the user

Write dialogue only when the user asks you to; otherwise lay out the structure (clues, deductions, gates, choices)
with placeholder lines marked `TODO:` and let them write. Never rewrite Act I's existing lines (© Odiriuss).

## Steps

1. **Pin the beat:** what the player learns or does, where, and what it unlocks. If it unlocks nothing, ask what
   it should unlock before writing it.
2. **Clues:** `clue(id, title, text)` in the story file, given by a script `['clue', id]` from a look, use, talk or
   choice. The checker warns about clues nobody gives.
3. **Deductions:** `ded(id, a, b, title, text)`, where `a`/`b` are clues or other deductions. Then make it decide
   something, in one of these ways:
   - a dialogue option only offered once it is worked out: `{ t: '[Notebook] …', c: () => hasClue('d_x'), d: [...] }`
   - a hotspot whose `use` branches on `hasClue('d_x')`
   - a gate: `ded(...)` with `need`/`needText`, or a `cond` on an exit or hotspot
   If it truly only adds flavour, mark it: `ded(...).optional = true`.
4. **Two keys for important locks.** A gate the story depends on opens by deduction *or* by a costlier route
   (a bribe, waiting, a risk), so a stuck player isn't blocked.
5. **Flags:** `['flag', k]` to set, `flag(k)` to read. Name them for what happened (`lied_to_russo`), not for the
   code (`f17`).
6. **Check:** `npm run check` — 0 errors and no new warnings (a new "decides nothing" warning means step 3 is
   unfinished). Then `npm run test:unit` and `npm run test:city`. If the beat is on the main route, extend the
   route test in `tools/play.js` so it covers the new step.
7. **Commit** the beat with the rebuilt `hourglass_city.html`.
