'use strict';

const links = [
  ['DGI · CGI 2026, art. 105–113', 'https://dgi.bf/wp-content/uploads/2026/10/CGI-2026-v2.pdf'],
  ['CNSS · cotisations sociales', 'https://cnssbf.org/cotisations-sociales/'],
  ['RAMU · décret 2024-0345', 'https://legiburkina.gov.bf/documents/9c8f3ba2-d13f-4854-a4d3-5f4eccbe067c/download'],
  ['SMIG · salaire minimum mensuel', 'https://gouvernement.gov.bf/actualites/exposition-gouvernementale-le-ministre-des-serviteurs-du-peuple-echange-avec-les-citoyens-sur-les-reformes-de-ladministration/'],
  ['FSP · 2026', 'https://gouvernement.gov.bf/conseil-des-ministres/conseil-des-ministres-du-17-decembre-2025-2/']
];
function sources(c, lang, source) {
  return '<section id="sources-verification" data-tool-verification-panel data-bf-source-id="paye-bf-source" style="padding:20px"><h2>' + c.source + '</h2><ul>' +
    links.map(([label,url]) => '<li><a href="' + url + '">' + label + '</a></li>').join('') +
    '</ul><details><summary>' + c.date + '</summary><a href="/data/source-registry.json">paye-bf-source</a> <time datetime="' + source.lastReviewedAt + '">' + source.lastReviewedAt + '</time></details><a href="' +
    (lang === 'fr' ? '/fr/contact/' : '/contact/') + '?topic=calculation-error&amp;tool=bf-paye">' + c.report + '</a></section>';
}
function render(c) {
  const label = (key, control) => '<label style="display:grid;gap:4px;margin:10px 0">' + c[key] + control + '</label>';
  const number = key => label(key, '<input class="f-input" type="number" name="' + key + '" min="0" max="999999999999" step="1" required>');
  const select = (key, opts) => label(key, '<select class="f-input" name="' + key + '" required>' + opts.map(([v,t])=>'<option value="' + v + '">' + t + '</option>').join('') + '</select>');
  return '<section id="bf-payroll-review" class="card" data-bf-source-id="paye-bf-source" style="padding:20px;line-height:1.6"><h2>' + c.heading + '</h2><p>' + c.scope + '</p><p>' + c.inputs + '</p><p>' + c.recovery + '</p><form id="bf-sheet">' +
    select('method', [['recorded',c.recorded],['estimate',c.estimate]]) +
    '<fieldset data-mode="estimate" disabled hidden><legend>' + c.estimate + '</legend>' + number('basic') +
    select('category',[['',c.pick],['ordinary',c.ordinary],['upper',c.upper]]) +
    select('family',[['',c.pick],...[0,1,2,3,4].map(n=>[n,n])]) +
    select('ramu',[['',c.pick],['active',c.active],['none',c.none]]) + '</fieldset>' +
    '<fieldset data-mode="recorded"><legend>' + c.recorded + '</legend>' + ['gross','tax','cnss','health','credits','paid'].map(number).join('') + '</fieldset>' +
    number('other') + '<button type="submit">' + c.go + '</button></form><p id="bf-status" role="status"></p><section id="bf-output" hidden aria-live="polite"><h3></h3><dl></dl><p></p><button type="button" id="bf-txt">' + c.save + '</button></section>' +
    '<script type="application/json" id="bf-sheet-labels">' + JSON.stringify(Object.fromEntries(Object.entries(c).filter(([k])=>!['sources','old'].includes(k)))).replace(/</g,'\\u003c') + '</script></section>';
}
module.exports = {render, sources};
