'use strict';
const acorn = require('acorn');

const LEGACY_GUARD = 'if (!RESULT || !window.Chart) return;';
const READY_GUARD = 'if (!RESULT || !window.Chart || !window.AfroChartColors) return;';
const normalize = value => value.replace(/\s+/g, ' ').trim();

function chartGuard(html) {
  const guards = [];
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (!match[1].includes('function renderChart')) continue;
    const tree = acorn.parse(match[1], { ecmaVersion: 'latest' });
    for (const node of tree.body) {
      if (node.type !== 'FunctionDeclaration' || node.id.name !== 'renderChart') continue;
      const statement = node.body.body[0];
      if (!statement || statement.type !== 'IfStatement' || statement.consequent.type !== 'ReturnStatement' || statement.alternate) {
        throw new Error('Unrecognised renderChart readiness guard');
      }
      const start = match.index + match[0].indexOf(match[1]) + statement.start;
      const end = start + statement.end - statement.start;
      guards.push({ start, end, text: html.slice(start, end) });
    }
  }
  if (guards.length !== 1) throw new Error('Expected exactly one renderChart readiness guard');
  return guards[0];
}

function refreshChartReadiness(translatedHtml, englishHtml) {
  const source = chartGuard(englishHtml), target = chartGuard(translatedHtml);
  if (normalize(source.text) !== READY_GUARD) throw new Error('English source must already wait for its chart palette');
  const targetText = normalize(target.text);
  if (![LEGACY_GUARD, READY_GUARD].includes(targetText)) throw new Error('Translated chart guard differs from the supported source contract');
  if (targetText === READY_GUARD) return translatedHtml;
  return translatedHtml.slice(0, target.start) + source.text + translatedHtml.slice(target.end);
}

module.exports = { refreshChartReadiness };

// Preserve each locale's chart labels and calculation code while isolating the
// optional rendering dependency. Called by the targeted Cameroon locale owner.
function addCameroonChartRecovery(html, locale) {
  if (!['en', 'fr'].includes(locale)) throw new Error('Unsupported chart recovery locale');
  const emptyMessage = locale === 'fr' ? 'Aucun impôt IRPP pour ce calcul.' : 'No IRPP tax applies to this calculation.';
  const emptyStatus = value => value.replace('if(!bands.length)return;', 'if(!bands.length){chartCanvas.hidden=true;chartStatus.hidden=false;chartStatus.textContent=' + JSON.stringify(emptyMessage) + ';return;}');
  const marker = '/* Cameroon optional chart recovery */';
  if (html.includes(marker)) return emptyStatus(locale === 'fr' ? html.replace('Chart unavailable. Your calculation and figures remain available above.', 'Graphique indisponible. Le calcul et les montants restent disponibles ci-dessus.').replace('No IRPP tax applies to this calculation.', emptyMessage) : html);
  let target;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/src=|ld\+json/i.test(match[1]) || !match[2].includes('function renderChart')) continue;
    const tree = acorn.parse(match[2], {ecmaVersion:'latest'});
    const node = tree.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'renderChart');
    if (node) {
      if (target) throw new Error('Multiple chart functions');
      target = {node, offset:match.index + match[0].indexOf('>') + 1};
    }
  }
  if (!target) throw new Error('Missing chart function');
  const start = target.offset + target.node.body.start + 1;
  const end = target.offset + target.node.body.end - 1;
  const body = html.slice(start, end);
  if (!body.includes("getElementById('mainChart')") || !body.includes('new Chart(')) throw new Error('Unexpected chart contract');
  const message = locale === 'fr'
    ? 'Graphique indisponible. Le calcul et les montants restent disponibles ci-dessus.'
    : 'Chart unavailable. Your calculation and figures remain available above.';
  const wrapped = `\n${marker}
if (!RESULT) return;
const chartCanvas = document.getElementById('mainChart');
const chartStatus = document.getElementById('chartStatus');
const unavailable = () => {
  chartCanvas.hidden = true;
  chartStatus.hidden = false;
  chartStatus.textContent = ${JSON.stringify(message)};
};
if (typeof Chart !== 'function' || typeof AfroChartColors === 'undefined') { unavailable(); return; }
try {
  chartCanvas.hidden = false;
  chartStatus.hidden = true;
  chartStatus.textContent = '';
${body}
} catch (_) { unavailable(); }
`;
  html = html.slice(0,start) + wrapped + html.slice(end);
  const canvas = '<div class="chart-canvas-wrap"><canvas id="mainChart"></canvas></div>';
  if (!html.includes(canvas) || html.includes('id="chartStatus"')) throw new Error('Unexpected chart status markup');
  return emptyStatus(html.replace(canvas, canvas + '\n          <p id="chartStatus" role="status" hidden></p>'));
}
module.exports.addCameroonChartRecovery = addCameroonChartRecovery;
