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
