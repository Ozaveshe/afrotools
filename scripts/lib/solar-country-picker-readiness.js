"use strict";
const acorn = require('acorn');

function readyController(source) {
  if (!source.includes('function setupCountryPicker(')) return source;
  const tree = acorn.parse(source, { ecmaVersion: 'latest' });
  let picker;
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && node.id.name === 'setupCountryPicker') picker = node;
    for (const [key, value] of Object.entries(node)) {
      if (['start', 'end', 'raw'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  };
  walk(tree);
  if (!picker) throw new Error('Country picker readiness owner is missing');
  const body = source.slice(picker.start, picker.end);
  if (body.includes('select.disabled=false') && body.includes('input.disabled=false')) return source;
  if (!/var select=byId\(prefix\+"Select"\)/.test(body) || !/var input=byId\(prefix\+"Search"\)/.test(body)) {
    throw new Error('Inspect changed Solar country control bindings before enabling them');
  }
  const at = picker.body.end - 1;
  return source.slice(0, at) + '\n  select.disabled=false;if(input)input.disabled=false;\n' + source.slice(at);
}

function ensureSolarCountryPickerReadiness(html) {
  const markup = fragment => fragment.replace(/<(?:input|select)\b(?=[^>]*\bid=["']solarCountryPage(?:Search|Select)["'])[^>]*>/gi,
    tag => /\sdisabled(?:\s|=|>|$)/i.test(tag) ? tag : tag.replace(/(\s*\/?\s*)>$/, ' disabled$1>'));
  let output = '', cursor = 0;
  for (const match of html.matchAll(/<(script|style|textarea|pre|code)\b[\s\S]*?<\/\1\s*>/gi)) {
    output += markup(html.slice(cursor, match.index));
    const block = match[0];
    output += match[1].toLowerCase() !== 'script' ? block : block.replace(/(<script\b([^>]*)>)([\s\S]*?)(<\/script>)/i,
      (whole, open, attributes, source, close) => /\bsrc\s*=|application\/(?:ld\+json|json)/i.test(attributes)
        ? whole : open + readyController(source) + close);
    cursor = match.index + block.length;
  }
  return output + markup(html.slice(cursor));
}
module.exports = { ensureSolarCountryPickerReadiness };
