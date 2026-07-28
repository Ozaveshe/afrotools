'use strict';

/**
 * Mojibake helpers for the one-shot encoding-repair scripts.
 *
 * Mojibake here means: text that was encoded as UTF-8 and then decoded as
 * CP1252. "é" (UTF-8 C3 A9) read as CP1252 becomes "Ã©". This module derives
 * that string from the intended character instead of hard-coding it.
 *
 * Why derive it? Because hard-coded mojibake literals do not survive a repair
 * pass run over the repository: an earlier pass rewrote the mojibake sequences
 * inside four repair scripts' own source, collapsing pairs like
 * ["Ã©", "é"] into ["e", "é"] and ["â€”", "&mdash;"] into ["-", "&mdash;"].
 * Those scripts became repo-destroying (every "e" rewritten) and only failed
 * to detonate because the same rewrite also broke their syntax.
 *
 * Deriving the key at runtime makes the mapping immune to that class of edit,
 * and `assertSafePairs` refuses to run any table that has decayed the same way.
 */

// CP1252 assigns printable characters to 0x80-0x9F where Latin-1 has controls.
const CP1252_HIGH = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„',
  0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ',
  0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ',
  0x8e: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“',
  0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
  0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›',
  0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ'
};

/**
 * The mojibake form of `text`: its UTF-8 bytes read back as CP1252.
 * Returns null when a byte falls on an unassigned CP1252 slot, because such a
 * sequence cannot round-trip and must not be used as a search key.
 */
function mojibakeOf(text) {
  const bytes = Buffer.from(text, 'utf8');
  let out = '';
  for (const b of bytes) {
    if (b < 0x80) out += String.fromCharCode(b);
    else if (b <= 0x9f) {
      const ch = CP1252_HIGH[b];
      if (!ch) return null;
      out += ch;
    } else out += String.fromCharCode(b);
  }
  return out;
}

/**
 * Build [mojibake, replacement] pairs from a plain {character: replacement}
 * map. Characters whose mojibake cannot round-trip are skipped.
 */
function buildPairs(map) {
  const pairs = [];
  for (const [ch, replacement] of Object.entries(map)) {
    const from = mojibakeOf(ch);
    if (from === null || from === ch) continue;
    pairs.push([from, replacement]);
  }
  // Longest key first: "Ã°Å¸" prefixes must not be eaten by a shorter match.
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs;
}

/**
 * Like `buildPairs`, but also emits the double-encoded form (UTF-8 read as
 * CP1252, twice). Pages that went through two bad encoding round-trips carry
 * "Ãƒ©" where one round-trip leaves "Ã©". Double forms sort first so they are
 * consumed before the single form can eat their prefix.
 */
function buildPairsDeep(map) {
  const pairs = [];
  for (const [ch, replacement] of Object.entries(map)) {
    const once = mojibakeOf(ch);
    if (once === null || once === ch) continue;
    const twice = mojibakeOf(once);
    if (twice !== null && twice !== once) pairs.push([twice, replacement]);
    pairs.push([once, replacement]);
  }
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs;
}

/**
 * Refuse to run a replacement table that has decayed into ASCII keys.
 *
 * A search key of "e" or "-" rewrites ordinary prose, not mojibake. Any table
 * containing one is corrupt, and applying it would damage every file it
 * touches. Throwing here is the whole point of this module.
 */
function assertSafePairs(pairs, label) {
  const unsafe = pairs.filter(([from]) => !from || /^[\x20-\x7E]*$/.test(from));
  if (unsafe.length) {
    throw new Error(
      `${label}: ${unsafe.length} replacement key(s) are pure ASCII ` +
      `(${unsafe.slice(0, 5).map(([f]) => JSON.stringify(f)).join(', ')}). ` +
      'A mojibake key always contains a non-ASCII byte; an ASCII key would ' +
      'rewrite ordinary text. Refusing to run.'
    );
  }
  return pairs;
}

/** Apply pairs to `text`, returning [result, replacementCount]. */
function applyPairs(text, pairs) {
  let out = text;
  let count = 0;
  for (const [from, to] of pairs) {
    if (!out.includes(from)) continue;
    count += out.split(from).length - 1;
    out = out.split(from).join(to);
  }
  return [out, count];
}

module.exports = { mojibakeOf, buildPairs, buildPairsDeep, assertSafePairs, applyPairs, CP1252_HIGH };
