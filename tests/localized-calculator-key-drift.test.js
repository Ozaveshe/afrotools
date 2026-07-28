#!/usr/bin/env node
'use strict';

/**
 * A localisation pass rewrites strings. It must never rewrite an identifier.
 *
 * sw/egypt's did: the bracket-exclusion table's `extraTax` field became
 * `extraKodi` while the loop reading it kept `extraTax`, so `exclusionExtra`
 * was `0 + undefined` and every Egyptian salary over ~639,000 gross rendered a
 * NaN tax. Sweeping the other 46 Swahili PAYE calculators found the same shape
 * in 22 of them: the result object's period keys had been translated
 * (`annualGross` -> `annualGhafi`, `monthlyTax` -> `monthlyKodi`, and so on)
 * while every reader kept the English name. The pages looked fine on load and
 * rendered NaN the moment the user pressed the other period button.
 *
 * The defect is invisible to a spot check — you have to drive the non-default
 * period — but it is trivially visible statically: the page reads a property
 * that nothing in the same file ever defines.
 *
 * This test fails on any such read. It deliberately checks the localized pages
 * against themselves rather than against their English originals: several
 * Swahili pages track an older English implementation, so a cross-file diff
 * measures vintage drift, not this bug.
 *
 * Run: node tests/localized-calculator-key-drift.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Scoped to the 47 Swahili PAYE calculators, which is what this test was
// written against and what was swept page by page.
//
// Not widened further on purpose. The French, Hausa and Yoruba surfaces and
// the sw/zana/* tools have their own dangling reads: some are cross-file
// globals this checker cannot see (AfroTools.*, Chart, gtag) or DOM APIs
// outside the allowlist, and some are real — three fr PAYE pages guarded a
// share on `navigator.partager`, which never exists, so the native share sheet
// never fired. Padding the allowlist until those go quiet would hide the real
// ones. Sweep a surface first, then add it here.
const CALCULATOR_GLOB = 'sw/*/kikokotoo-kodi-mshahara/index.html';

/**
 * Properties that legitimately come from outside the file — DOM, JS builtins,
 * Chart.js config, and the custom elements the pages mount.
 */
const EXTERNAL = new Set((`
length name message stack constructor prototype toString valueOf hasOwnProperty
push pop shift unshift slice splice concat join reverse sort indexOf lastIndexOf
includes find findIndex filter map reduce forEach some every flat flatMap fill keys values entries
charAt startsWith endsWith padStart padEnd repeat replace replaceAll
split substring substr trim trimStart trimEnd toLowerCase toUpperCase match matchAll search localeCompare
toFixed toPrecision toLocaleString toLocaleDateString toLocaleTimeString toISOString toJSON
getTime getFullYear getMonth getDate getDay getHours getMinutes getSeconds now parse stringify
add has delete clear get set size then catch finally all race resolve reject
apply call bind arguments
document window location navigator history localStorage sessionStorage console
getElementById querySelector querySelectorAll getElementsByClassName getElementsByTagName
createElement createTextNode appendChild removeChild insertBefore replaceChild cloneNode
remove closest matches contains addEventListener removeEventListener dispatchEvent
preventDefault stopPropagation innerHTML outerHTML textContent innerText value checked
disabled selected placeholder classList className id dataset style src href target rel type alt title
setAttribute getAttribute removeAttribute hasAttribute toggleAttribute
parentNode parentElement children childNodes firstChild lastChild nextSibling previousSibling
nextElementSibling previousElementSibling firstElementChild lastElementChild
offsetWidth offsetHeight offsetTop offsetLeft clientWidth clientHeight
scrollTop scrollLeft scrollHeight scrollWidth getBoundingClientRect scrollIntoView
focus blur click submit reset select top left right bottom width height x y
getContext canvas fillText fillRect clearRect beginPath moveTo lineTo stroke fill arc save restore
toDataURL drawImage measureText font fillStyle strokeStyle lineWidth
readyState body head documentElement cookie
pathname search hash host hostname protocol port origin reload assign
pushState replaceState back forward go getItem setItem removeItem key
userAgent language languages clipboard writeText share
ok status statusText json text blob arrayBuffer headers method mode credentials
data datasets labels options plugins scales legend tooltip responsive maintainAspectRatio
update destroy resize render config
files result readAsText readAsDataURL onload onerror onchange oninput onclick
open close print alert confirm prompt
max min abs floor ceil round pow sqrt random log exp sign trunc
MAX_SAFE_INTEGER MIN_SAFE_INTEGER EPSILON POSITIVE_INFINITY NEGATIVE_INFINITY
isInteger isFinite isNaN parseFloat parseInt format formatToParts resolvedOptions
default raw createObjectURL revokeObjectURL getPropertyValue setProperty from of
isArray freeze fromEntries getOwnPropertyNames defineProperty create seal
toggle item namedItem indeterminate
padding margin border color background display position opacity transform transition
cssText visibility zIndex pointerEvents sheet rules insertRule
crypto randomUUID getRandomValues media addListener removeListener
observe unobserve disconnect signal abort
setData setResult setRunState shareState openModal closeModal getSessionToken
doughnut series tickText tooltipBg titleColor bodyColor AfroAuth reply
Chart response answer gtag error matchMedia elements fromCharCode charCodeAt
`).trim().split(/\s+/));

/**
 * Reads of globals that genuinely do not exist anywhere in the repository.
 *
 * Empty, and it should stay that way. It briefly held `openPayePdfModal`:
 * sw/liberia, sw/sierra-leone and sw/guinea-bissau each wired their
 * "Pakua PDF" button to a global defined in no file, so the button produced no
 * PDF and alerted "PDF inatengenezwa..." ("PDF is being generated") while not
 * generating one. All three now load /assets/js/lib/pdf-template.js and call
 * window.AfroTools.pdf like their English originals.
 */
const RECORDED_GAPS = new Set([]);

/** Strip comments and string/template text, keeping ${...} expression bodies. */
function codeOnly(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i += 1; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i += 1; i += 2; continue; }
    if (c === '"' || c === "'") {
      const q = c;
      i += 1;
      while (i < n && src[i] !== q) { if (src[i] === '\\') i += 1; i += 1; }
      i += 1; out += ' _S_ '; continue;
    }
    if (c === '`') {
      i += 1;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') {
          i += 2;
          let depth = 1;
          out += ' ';
          while (i < n && depth > 0) {
            if (src[i] === '{') depth += 1;
            else if (src[i] === '}') { depth -= 1; if (!depth) { i += 1; break; } }
            out += src[i];
            i += 1;
          }
          continue;
        }
        if (src[i] === '`') { i += 1; break; }
        i += 1;
      }
      out += ' _S_ '; continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

function inlineJs(html) {
  return [...html.matchAll(
    /<script(?![^>]*\bsrc=)(?![^>]*ld\+json)(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/gi
  )].map((m) => m[1]).join('\n');
}

function danglingReads(js) {
  const code = codeOnly(js);
  const defined = new Set();
  for (const m of code.matchAll(/[{,]\s*(?:get\s+|set\s+|async\s+)?([A-Za-z_$][\w$]*)\s*[:(]/g)) defined.add(m[1]);
  for (const m of code.matchAll(/\.([A-Za-z_$][\w$]*)\s*(?:=[^=]|\+\+|--|\+=|-=)/g)) defined.add(m[1]);
  for (const m of code.matchAll(/[{,]\s*([A-Za-z_$][\w$]*)\s*[,}]/g)) defined.add(m[1]);
  for (const m of code.matchAll(/\b(?:var|let|const|function|class)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);

  const dangling = new Map();
  // `el.dataset.foo` reads a data-* attribute off the DOM, not a local object.
  for (const m of code.replace(/\.dataset\.[A-Za-z_$][\w$]*/g, '.dataset').matchAll(/\.([A-Za-z_$][\w$]*)/g)) {
    const prop = m[1];
    if (EXTERNAL.has(prop) || RECORDED_GAPS.has(prop) || defined.has(prop)) continue;
    dangling.set(prop, (dangling.get(prop) || 0) + 1);
  }
  return dangling;
}

function localizedCalculators() {
  const found = [];
  const base = path.join(ROOT, 'sw');
  if (!fs.existsSync(base)) return found;
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(base, entry.name, 'kikokotoo-kodi-mshahara', 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    // Only pages that actually compute something.
    if (!/function\s+calcTax|function\s+calculate\s*\(/.test(html)) continue;
    found.push({ rel: path.relative(ROOT, file).replace(/\\/g, '/'), html });
  }
  return found;
}

/**
 * The English original each Swahili page declares via its own hreflang link.
 * Some Swahili pages track an OLDER English implementation, so this is used
 * only to subtract pre-existing dangling reads — never to diff wholesale.
 */
function englishOriginal(html) {
  const m = html.match(/hreflang="en"[^>]*href="https:\/\/afrotools\.com\/([^"]+)"/);
  if (!m) return null;
  for (const candidate of [m[1] + '.html', m[1] + '/index.html']) {
    const file = path.join(ROOT, candidate);
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  }
  return null;
}

const pages = localizedCalculators();
assert.ok(pages.length >= 45, `expected at least 45 Swahili PAYE calculators (${CALCULATOR_GLOB}), found ${pages.length}`);

const offenders = [];
let withOriginal = 0;
for (const page of pages) {
  const dangling = danglingReads(inlineJs(page.html));
  if (!dangling.size) continue;

  // Subtract reads that dangle in the English original too: those are
  // pre-existing (usually a dead `A || B` fallback), not introduced by the
  // translation, and fixing them on one side only would create divergence.
  const original = englishOriginal(page.html);
  if (original) {
    withOriginal += 1;
    for (const prop of danglingReads(inlineJs(original)).keys()) dangling.delete(prop);
  }
  if (dangling.size) {
    offenders.push(`${page.rel}\n      ${[...dangling].map(([p, n]) => `.${p} (x${n})`).join(', ')}`);
  }
}
assert.ok(withOriginal >= 15, `expected to resolve English originals for cross-checking, resolved ${withOriginal}`);

assert.deepStrictEqual(
  offenders, [],
  'Localized calculator(s) read a property nothing in the same file defines,\n' +
  'and their English original does not read it either — so the translation\n' +
  'introduced it. This is the sw/egypt extraTax/extraKodi defect: a pass renamed\n' +
  'a key but not its readers, so the page renders undefined or NaN. Either\n' +
  'restore the identifier the readers use, or point the readers at the key that\n' +
  'exists.\n\n    ' +
  offenders.join('\n    ') + '\n'
);

console.log(`localized calculator key drift: PASS (${pages.length} Swahili PAYE calculators, no dangling property reads)`);
