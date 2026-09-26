'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TARGETS = {
  en: 'burkina-faso/bf-paye.html',
  fr: 'fr/burkina-faso/calculateur-salaire-net.html',
  sw: 'sw/burkina-faso/kikokotoo-kodi-mshahara/index.html'
};
const COPY = {
  en: { title: 'Burkina Faso salary calculator — review required', heading: 'Payroll calculation unavailable', reason: 'The Burkina Faso tax calculation requires review. Automatic net pay, employer costs, reverse calculations, AI analysis and result exports are unavailable until the rules and their scope are verified.', inputs: 'You can edit your inputs while the calculation is under review.', action: 'Why calculation is unavailable', scope: 'Gross pay alone does not establish contractual base salary, professional category, qualifying allowances or RAMU applicability. CNSS, civil-service and secondary-employment results are not verified here.', source: 'Existing source record', date: 'Historical review date', stale: 'Source stale · formula review required', recovery: 'Check your payslip and current deductions with DGI, CNSS or a qualified payroll adviser. This page has no verified-deductions entry workflow.', option: 'Input retained; calculation unavailable', report: 'Report an evidence error', sources: 'Sources &amp; verification', old: 'The old rate tables and payroll outputs have been withdrawn pending review.' },
  fr: { title: 'Calculateur de salaire Burkina Faso — vérification requise', heading: 'Calcul de paie indisponible', reason: 'Le calcul fiscal du Burkina Faso doit être vérifié. Le salaire net automatique, le coût employeur, le calcul inversé, l’analyse IA et les exports de résultats sont indisponibles jusqu’à la vérification des règles et de leur champ d’application.', inputs: 'Vous pouvez modifier vos données pendant la vérification du calcul.', action: 'Pourquoi le calcul est indisponible', scope: 'Le brut seul ne détermine ni le salaire de base contractuel, ni la catégorie professionnelle, ni les indemnités admissibles, ni l’application du RAMU. Les résultats CNSS, fonction publique et emploi secondaire ne sont pas vérifiés ici.', source: 'Fiche source existante', date: 'Date historique de vérification', stale: 'Source ancienne · formule à vérifier', recovery: 'Vérifiez votre bulletin et les retenues actuelles auprès de la DGI, de la CNSS ou d’un professionnel de la paie. Cette page ne propose pas de saisie de retenues vérifiées.', option: 'Choix conservé ; calcul indisponible', report: 'Signaler une erreur de preuve', sources: 'Sources officielles', old: 'Les anciens barèmes et résultats de paie sont retirés en attendant leur vérification.' },
  sw: { title: 'Kikokotoo cha mshahara Burkina Faso — uhakiki unahitajika', heading: 'Hesabu ya mshahara haipatikani', reason: 'Hesabu ya kodi ya Burkina Faso inahitaji uhakiki. Mshahara halisi wa kiotomatiki, gharama za mwajiri, hesabu ya kinyume, uchambuzi wa AI na upakuaji wa matokeo havipatikani hadi kanuni na matumizi yake yahakikiwe.', inputs: 'Unaweza kubadili taarifa zako wakati hesabu inahakikiwa.', action: 'Kwa nini hesabu haipatikani', scope: 'Mshahara ghafi pekee hautoshi kujua mshahara wa msingi wa mkataba, kundi la kazi, posho zinazostahili au matumizi ya RAMU. Matokeo ya CNSS, utumishi wa umma na ajira ya ziada hayajahakikiwa hapa.', source: 'Rekodi ya chanzo iliyopo', date: 'Tarehe ya uhakiki wa awali', stale: 'Chanzo kimepitwa na muda · hesabu inahitaji uhakiki', recovery: 'Hakiki hati ya mshahara na makato ya sasa kwa DGI, CNSS au mtaalamu wa mishahara. Ukurasa huu hauna njia ya kuingiza makato yaliyohakikiwa.', option: 'Chaguo limehifadhiwa; hesabu haipatikani', report: 'Ripoti hitilafu ya ushahidi', sources: 'Vyanzo na uhakiki', old: 'Viwango na matokeo ya zamani yameondolewa hadi uhakiki ukamilike.' }
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// These bounded elements are outside scripts. Keep all controller text byte-for-byte.
function replaceElement(html, opening, replacement) {
  const match = opening.exec(html);
  if (!match) return html;
  const name = /^<(\w+)/.exec(match[0])[1];
  const tokens = new RegExp('</?' + name + '\\b[^>]*>', 'gi');
  tokens.lastIndex = match.index;
  let depth = 0, token;
  while ((token = tokens.exec(html))) {
    depth += token[0][1] === '/' ? -1 : 1;
    if (!depth) return html.slice(0, match.index) + replacement + html.slice(tokens.lastIndex);
  }
  throw new Error('Unclosed BF review element: ' + name);
}
function transform(html, lang, source) {
  if (!source || source.id !== 'paye-bf-source') throw new Error('Missing historical BF source record');
  const c = COPY[lang];
  const status = '<section id="bf-payroll-review" class="card" tabindex="-1" data-bf-source-id="paye-bf-source" data-formula-status="review-required" style="padding:20px;line-height:1.6"><h2>' + c.heading + '</h2><p>' + c.reason + '</p><p>' + c.inputs + '</p><p>' + c.scope + '</p><p>' + c.recovery + '</p><p id="bf-review-action" role="status" aria-live="polite"></p></section>';
  const sources = '<section id="sources-verification" data-tool-verification-panel data-bf-source-id="paye-bf-source" data-source-freshness="' + escape(source.freshnessStatus) + '" style="padding:20px;line-height:1.6"><h2>' + c.sources + '</h2><p>' + c.stale + '</p><p>' + c.date + ': <time datetime="' + escape(source.lastReviewedAt) + '">' + escape(source.lastReviewedAt) + '</time></p><p>' + c.old + '</p><ul><li><a href="https://dgi.bf/verification/CGI">DGI — Code général des impôts</a></li><li><a href="https://cnss.bf/?p=2078">CNSS — ' + c.sources + '</a></li><li><a href="/data/source-registry.json">' + c.source + ' (paye-bf-source)</a></li></ul><a href="/contact/?topic=calculation-error&amp;tool=bf-paye">' + c.report + '</a></section>';
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + c.title + ' | AfroTools</title>');
  html = html.replace(/<meta\b[^>]*(?:name="description"|property="og:(?:title|description)"|name="twitter:(?:title|description)")[^>]*>/gi, tag => tag.replace(/content="[^"]*"/, 'content="' + escape(c.title + '. ' + c.reason) + '"'));
  if (lang === 'sw') html = html.replace('<span class="slider-label">Mshahara Ghafi wa Mwaka</span>', '<span class="slider-label">Mshahara Ghafi wa Mwezi</span>');
  html = html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, '<h1>' + c.title + '</h1>');
  for (const cls of ['hero-sub', 'tool-hero-sub', 'hero-meta']) html = html.replace(new RegExp('<p\\b[^>]*class="' + cls + '"[^>]*>[\\s\\S]*?<\\/p>'), '<p class="' + cls + '">' + (cls !== 'hero-meta' ? c.reason : c.stale) + '</p>');
  html = replaceElement(html, /<div class="hero-badges">/, '');
  html = replaceElement(html, /<div class="amendment-bar">/, '');
  html = replaceElement(html, /<div class="card results-card" id="resultsCard">/, status);
  html = replaceElement(html, /<section id="bf-payroll-review"[^>]*>/, status);
  html = replaceElement(html, /<div class="sidebar">/, '');
  html = replaceElement(html, /<div class="modal-bg" id="pdfModal">/, '');
  for (const cls of ['ng-save-sec','ng-guide-sec','ng-faq-sec','faq-sec','tool-verification-sec']) html = replaceElement(html, new RegExp('<section class="' + cls + '"[^>]*>'), '');
  if (/<section id="sources-verification"[^>]*>/.test(html)) html = replaceElement(html, /<section id="sources-verification"[^>]*>/, sources);
  else {
    const footer = html.indexOf('<afro-footer');
    if (footer < 0) throw new Error('Missing page footer');
    html = html.slice(0, footer) + sources + '\n' + html.slice(footer);
  }
  html = html.replace(/<p class="f-note"(?: id="schemeNote")?>[\s\S]*?<\/p>/g, '<p class="f-note" id="schemeNote">' + c.scope + '</p>');
  html = html.replace(/<div class="tog-rate">[\s\S]*?<\/div>/g, '<div class="tog-rate">' + c.option + '</div>');
  html = html.replace(/<button type="button" class="calc-btn"[^>]*>[\s\S]*?<\/button>/g, '<button type="button" class="calc-btn" onclick="calculate()">' + c.action + '</button>');
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrs, code) => {
    if (/application\/ld\+json/.test(attrs)) {
      let schema; try { schema = JSON.parse(code); } catch (_) { return whole; }
      if (schema['@type'] === 'FAQPage') return '';
      if (['SoftwareApplication','WebApplication','WebPage'].includes(schema['@type'])) { schema.name = c.title; schema.description = c.reason; delete schema.featureList; return '<script' + attrs + '>' + JSON.stringify(schema) + '</script>'; }
      return whole;
    }
    if (/src=/.test(attrs)) {
      if (/net-to-gross|french-finance-export-contract|sw-paye-local-export/.test(attrs)) return '<script' + attrs.replace(/\s+type="[^"]*"/g, '') + ' type="application/x-bf-review-required"></script>';
      return whole;
    }
    if (/function\s|RESULT|calculate\(/.test(code) && !/application\/json/.test(attrs)) return '<script' + attrs.replace(/\s+type="[^"]*"/g, '') + ' type="application/x-bf-review-required">' + code + '</script>';
    return whole;
  });
  if (!html.includes('/assets/js/pages/bf-payroll-review.js')) html = html.replace('</head>', '<script src="/assets/js/pages/bf-payroll-review.js" defer></script>\n</head>');
  return html.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/gi).map(part => /^<script\b/i.test(part) ? part : part.replace(/^[ \t]+$/gm, '')).join('');
}
function run(write) {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/source-registry.json'), 'utf8'));
  const source = registry.sources.find(item => item.id === 'paye-bf-source');
  let changed = 0;
  for (const [lang, file] of Object.entries(TARGETS)) {
    const target = path.join(ROOT, file), before = fs.readFileSync(target, 'utf8'), after = transform(before, lang, source);
    if (before !== after) { changed++; if (write) fs.writeFileSync(target, after); }
  }
  if (changed && !write) throw new Error('BF review gate drift: ' + changed + ' pages');
  console.log('BF review gate: ' + changed + (write ? ' updated' : ' drift'));
}
if (require.main === module) run(process.argv.includes('--write'));
module.exports = { TARGETS, COPY, transform };
