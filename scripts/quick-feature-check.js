#!/usr/bin/env node
// Fast per-page feature probe mirroring audit-tool-quality.js detection regexes.
// Usage: node scripts/quick-feature-check.js <file.html> [file2.html ...]
const fs = require('fs');
const path = require('path');

function stripScriptStyle(h) {
  return String(h || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
}
function stripTags(h) { return String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

const RX = {
  methodology: /\b(methodology|how it works|calculation method|formula|assumptions|breakdown|we calculate|calculated by|calculated with|calculated from|calculated using|rules applied)\b/i,
  disclaimer: /\b(disclaimer|estimate only|planning estimate|not legal advice|not tax advice|not medical advice|informational|verify with|confirm with|not official|does not replace)\b/i,
  sourceWords: /\b(source|official|authority|gazette|verified|reference|last verified|data source|based on)\b/i,
  businessCta: /afro-business-cta|business-enquiry|custom-calculators|sponsored-tools|widgets\/|\/api\//i,
  verificationPanel: /data-tool-verification-panel|Sources\s*&(?:amp;)?\s*verification/i,
  currentYearExplicit: /\b(updated|last verified|as of|reviewed)\b[^.]{0,40}\b20\d{2}\b/i,
  // FR
  fr_methodology: /\b(méthodologie|methodologie|méthode de calcul|methode de calcul|formule|hypothèses|hypotheses|ventilation|répartition|repartition|nous calculons|calculé par|calcule par|règles appliquées|regles appliquees|détail du calcul|detail du calcul)\b/i,
  fr_disclaimer: /\b(avertissement|estimation seulement|information générale|information generale|vérifier avec|verifier avec|confirmer avec|non officiel|ne remplace pas|à confirmer|a confirmer|limites|conseil professionnel|hypothèses à valider|hypotheses a valider)\b/i,
  // Hausa
  ha_methodology: /\b(hanyar lissafi|hanyar tsara|tsarin lissafi|yana kwatanta|ana kwatanta|lissafa|an tsara shafin|ma'aunin)\b/i,
  ha_disclaimer: /\b(ba shafin hukuma ba|ba hukuma ba|ba hukumar|bai tabbatar|ba ya tabbatar|bayani mai muhimmanci|ka duba|kada a dauka)\b/i,
  // Swahili
  sw_methodology: /\b(njia ya kukokotoa|mbinu|formula|kanuni|makisio|dhana|tunachokokotoa|imekokotolewa|tunatumia|kizingiti cha faida|gharama zisizobadilika)\b/i,
  sw_disclaimer: /\b(kanusho|si ushauri wa kodi|si ushauri wa kisheria|si taarifa rasmi|thibitisha na|hakiki na|haibadili ushauri|mwongozo wa jumla|makadirio tu)\b/i,
};

for (const f of process.argv.slice(2)) {
  const html = fs.readFileSync(f, 'utf8');
  // include app.html if present, as the audit does
  const appPath = path.join(path.dirname(f), 'app.html');
  const appHtml = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
  const interactionHtml = [html, appHtml].join('\n');
  const text = stripTags(stripScriptStyle(interactionHtml));
  const links = (interactionHtml.match(/<a\b[^>]*href=["']https?:\/\//gi) || []).length;
  const out = {
    methodology: RX.methodology.test(text) || RX.fr_methodology.test(text) || RX.ha_methodology.test(text) || RX.sw_methodology.test(text),
    disclaimer: RX.disclaimer.test(text) || RX.fr_disclaimer.test(text) || RX.ha_disclaimer.test(text) || RX.sw_disclaimer.test(text),
    sources: links > 0 || RX.sourceWords.test(text),
    businessCta: RX.businessCta.test(interactionHtml),
    verificationPanel: RX.verificationPanel.test(interactionHtml),
    extLinks: links,
  };
  console.log(f);
  console.log('  ' + Object.entries(out).map(([k, v]) => `${k}=${v}`).join('  '));
}
