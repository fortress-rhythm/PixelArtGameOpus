// Turns a picture (RGBA pixels) into the game's string-map format: rows of letters plus the colours they stand for.
// Shared by the command-line importer (tools/import_art.js) and the character editor (built into its page), so both
// make exactly the same text. Plain functions, no dependencies: the palette is passed in.
//
// Letters: when a character's costume key is given, a pixel whose colour is one of that costume's slots gets the slot
// letter (S skin, C coat, A hair...), so the drawing recolours with the costume. Any other colour gets a letter of its
// own from ART_EXTRA, listed in `colours`. Transparent pixels (alpha under 128) are '.'.

// costume slot letters, in the order a colour shared by several slots should prefer
const ART_SLOT_ORDER = 'oSsLAaHhbemYVCcKWNTtBkFGXP';
// letters that are not costume slots, for colours the costume doesn't have
const ART_EXTRA = '0123456789dfgijlnpqruvwxyzDEIJMOQRUZ';

/**
 * @param {number} w @param {number} h @param {Uint8Array|Uint8ClampedArray} rgba
 * @param {string[]} palHex the game's palette ('rrggbb', in order)
 * @param {Object<string, number>} [key] a costume key: slot letter -> palette index
 * @param {Object<string, number>} [known] extra letters already in use (from earlier drawings of the same character):
 *        reused for the same colour, and new colours get new letters
 * @returns {{rows: string[], colours: Object<string, number>, offPalette: number, offExamples: string[]}}
 */
function artFromRGBA(w, h, rgba, palHex, key, known) {
  const pal = palHex.map(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]);
  const slotOf = {};                                   // palette index -> costume slot letter
  if (key) for (const ch of ART_SLOT_ORDER) if (key[ch] !== undefined && slotOf[key[ch]] === undefined) slotOf[key[ch]] = ch;
  const colours = Object.assign({}, known || {}), extraOf = {}, rows = [];
  for (const ch in colours) extraOf[colours[ch]] = ch;
  let next = 0, off = 0; const offEx = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (rgba[i + 3] < 128) { row += '.'; continue; }
      let best = 0, bd = 1e9;
      for (let k = 0; k < pal.length; k++) { const p = pal[k], d = (p[0] - rgba[i]) ** 2 + (p[1] - rgba[i + 1]) ** 2 + (p[2] - rgba[i + 2]) ** 2; if (d < bd) { bd = d; best = k; } }
      if (bd > 0) { off++; if (offEx.length < 5) offEx.push(x + ',' + y); }
      if (slotOf[best] !== undefined) { row += slotOf[best]; continue; }
      if (extraOf[best] === undefined) {
        while (next < ART_EXTRA.length && colours[ART_EXTRA[next]] !== undefined) next++;
        if (next >= ART_EXTRA.length) throw new Error('more than ' + ART_EXTRA.length + ' colours that are not in the costume');
        extraOf[best] = ART_EXTRA[next++]; colours[extraOf[best]] = best;
      }
      row += extraOf[best];
    }
    rows.push(row);
  }
  return { rows, colours, offPalette: off, offExamples: offEx };
}
// the same as source text: "['..ab..', ...]" with one row per line, indented
/** @param {string[]} rows @param {string} indent */
function artRowsSource(rows, indent) { return '[\n' + rows.map(r => indent + "  '" + r + "'").join(',\n') + '\n' + indent + ']'; }
/** @param {Object<string, number>} colours @param {string[]} cname palette index -> C name */
function artColoursSource(colours, cname) { return '{ ' + Object.keys(colours).map(k => (/^\d/.test(k) ? "'" + k + "'" : k) + ': C.' + cname[colours[k]]).join(', ') + ' }'; }

if (typeof module !== 'undefined' && module.exports) module.exports = { artFromRGBA, artRowsSource, artColoursSource, ART_SLOT_ORDER, ART_EXTRA };
