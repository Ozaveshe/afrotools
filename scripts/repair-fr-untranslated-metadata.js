#!/usr/bin/env node
'use strict';

/**
 * Translate French pages whose <title>/description/<h1> are still English.
 *
 * 154 pages under fr/tools/ carry metadata byte-identical to the English page
 * they name in hreflang. A French URL with an English SERP snippet competes
 * with its own English twin and reads as untranslated to the reader it was
 * built for.
 *
 * Three page families, each generated from one template, so the repair is a
 * template substitution rather than free translation:
 *
 *   suivi-carburant  title, description and h1 fully English
 *   contrat-bail     description English (title already part-French)
 *   contrat-travail  description English (title already part-French)
 *
 * Country names and the French locative form ("en Algerie", "au Cameroun",
 * "aux Comores") come from scripts/lib/fr-country-names.js. Prices, currency
 * codes and statute names are carried through untouched — this script does not
 * restate a legal or numeric claim, it only translates the sentence around it.
 *
 * Usage: node scripts/repair-fr-untranslated-metadata.js [--write]
 */

const fs = require('fs');
const path = require('path');
const { frCountry } = require('./lib/fr-country-names');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

function slugOf(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const base = rel.endsWith('/index.html') ? rel.slice(0, -'/index.html'.length) : rel.replace(/\.html$/, '');
  return base.split('/').pop();
}

function listPages(dir) {
  const full = path.join(ROOT, dir);
  let entries;
  try { entries = fs.readdirSync(full, { withFileTypes: true }); } catch { return []; }
  const out = [];
  for (const entry of entries) {
    if (entry.name === 'index.html') continue;
    if (entry.isDirectory()) {
      const idx = path.join(full, entry.name, 'index.html');
      if (entry.name !== 'index' && fs.existsSync(idx)) out.push(idx);
    } else if (entry.name.endsWith('.html')) {
      out.push(path.join(full, entry.name));
    }
  }
  return out;
}

function replaceTitle(html, next) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + next + '</title>');
}

/** Replace a meta content value, preserving whichever quote char it used. */
function replaceMeta(html, attr, name, next) {
  const re = new RegExp('(<meta[^>]+' + attr + '=["\']' + name + '["\'][^>]*content=)("([^"]*)"|\'([^\']*)\')', 'i');
  return html.replace(re, (m, head) => head + '"' + next.replace(/"/g, '&quot;') + '"');
}

const FAMILIES = [
  {
    dir: 'fr/tools/suivi-carburant',
    apply(html, c) {
      let out = html;
      // "Fuel prices in Algeria: petrol, diesel and LPG | AfroFuel", and a
      // shorter variant without the fuel list that two markets use.
      out = out.replace(
        /<title>Fuel prices in .+?: petrol, diesel and LPG \| AfroFuel<\/title>/i,
        '<title>Prix des carburants ' + c.loc + ' : essence, gazole et GPL | AfroFuel</title>'
      );
      out = out.replace(
        /<title>Fuel prices in [^<:]+ \| AfroFuel<\/title>/i,
        '<title>Prix des carburants ' + c.loc + ' | AfroFuel</title>'
      );
      // "Latest available fuel prices in X: petrol DZD 46/L, ... Compare generator fuel costs and African countries."
      out = out.replace(
        /(<meta[^>]+name=["']description["'][^>]*content=")Latest available fuel prices in [^:"]+:([^"]*?)Compare generator fuel costs and African countries\.(")/i,
        (m, head, middle, tail) =>
          head + 'Derniers prix des carburants connus ' + c.loc + ' :' +
          // The middle carries live prices; only the fuel nouns are translated.
          middle.replace(/\bpetrol\b/gi, 'essence').replace(/\bdiesel\b/gi, 'gazole').replace(/\bLPG\b/g, 'GPL') +
          'Comparez le coût du carburant pour groupe électrogène entre pays africains.' + tail
      );
      out = out.replace(/(<h1[^>]*>)\s*Fuel prices in .+?(<\/h1>)/i,
        (m, open, close) => open + 'Prix des carburants ' + c.loc + close);
      // og:/twitter: copies of the same two strings
      for (const [attr, name] of [['property', 'og:title'], ['name', 'twitter:title']]) {
        out = out.replace(
          new RegExp('(<meta[^>]+' + attr + '=["\']' + name + '["\'][^>]*content=")Fuel prices in .+?: petrol, diesel and LPG \\| AfroFuel(")', 'i'),
          (m, head, tail) => head + 'Prix des carburants ' + c.loc + ' : essence, gazole et GPL | AfroFuel' + tail
        );
        out = out.replace(
          new RegExp('(<meta[^>]+' + attr + '=["\']' + name + '["\'][^>]*content=")Fuel prices in [^"<:]+ \\| AfroFuel(")', 'i'),
          (m, head, tail) => head + 'Prix des carburants ' + c.loc + ' | AfroFuel' + tail
        );
      }
      return out;
    }
  },
  {
    dir: 'fr/tools/contrat-bail',
    apply(html, c) {
      // "Generate a professional tenancy agreement compliant with X rental law.
      //  Landlord/tenant details, deposit, rent, utilities, and legal clauses."
      const next = 'Générez un contrat de bail professionnel conforme au droit locatif ' + c.loc +
        '. Coordonnées du bailleur et du locataire, dépôt de garantie, loyer, charges et clauses légales.';
      let out = html;
      for (const [attr, name] of [['name', 'description'], ['property', 'og:description'], ['name', 'twitter:description']]) {
        if (/Generate a professional tenancy agreement compliant with/i.test(out)) out = replaceMeta(out, attr, name, next);
      }
      return out;
    }
  },
  {
    dir: 'fr/tools/contrat-travail',
    apply(html, c) {
      // "Generate professional employment contracts compliant with X labour law
      //  (<statute>). Minimum wage, pension, leave, notice periods, and more."
      // The statute often nests its own parentheses, e.g.
      // "(Labour Law No. 90-11 of 1990 (as amended))". Matching to the first
      // ")" drops the outer one and ships an unbalanced string, so match up
      // to the sentence end instead.
      const m = html.match(/Generate professional employment contracts compliant with .+? labour law \((.*?)\)\.\s/i);
      const statute = m ? m[1] : null;
      const next = 'Générez des contrats de travail professionnels conformes au droit du travail ' + c.loc +
        (statute ? ' (' + statute + ')' : '') +
        '. Salaire minimum, retraite, congés, préavis et davantage.';
      let out = html;
      for (const [attr, name] of [['name', 'description'], ['property', 'og:description'], ['name', 'twitter:description']]) {
        if (/Generate professional employment contracts compliant with/i.test(out)) out = replaceMeta(out, attr, name, next);
      }
      return out;
    }
  }
];

function main() {
  let changed = 0;
  let skipped = [];
  for (const family of FAMILIES) {
    for (const file of listPages(family.dir)) {
      const slug = slugOf(file);
      const c = frCountry(slug);
      if (!c) { skipped.push(path.relative(ROOT, file)); continue; }
      const original = fs.readFileSync(file, 'utf8');
      const next = family.apply(original, c);
      if (next === original) continue;
      changed += 1;
      if (WRITE) fs.writeFileSync(file, next, 'utf8');
    }
  }
  console.log(`${WRITE ? 'Translated' : 'Would translate'} metadata on ${changed} French page(s).`);
  if (skipped.length) console.log(`No French country name for ${skipped.length} page(s): ${skipped.slice(0, 5).join(', ')}`);
  if (!WRITE && changed) console.log('Dry run. Pass --write to apply.');
}

main();
