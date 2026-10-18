'use strict';

// The French BOQ landing page has a native review workflow; its complete
// line-item workspace is currently the maintained English app.
function repairFrenchBoqWorkspaceLinks(row, html) {
  if (row.id !== 'boq-generator') return html;
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (anchor, attributes, content) => {
    if (!/\bhref\s*=\s*(['"])(?:app\.html|\/tools\/boq-builder\/app)\1/i.test(attributes)) return anchor;
    const classes = attributes.match(/\bclass\s*=\s*(['"])(.*?)\1/i)?.[2].split(/\s+/) || [];
    let label;
    if (classes.includes('landing-saved-new')) label = '+ Nouveau devis (en anglais)';
    else if (classes.includes('tool-verification-report')) label = 'Ouvrir l’éditeur de devis (en anglais)';
    else if (classes.includes('landing-cta-primary')) label = 'Créer un devis (en anglais)';
    else return anchor;
    const icon = content.match(/<svg\b[\s\S]*$/i)?.[0] || '';
    const next = attributes
      .replace(/\bhref\s*=\s*(['"])(?:app\.html|\/tools\/boq-builder\/app)\1/i, 'href="/tools/boq-builder/app"')
      .replace(/\s+(?:aria-label|hreflang)\s*=\s*(['"])[\s\S]*?\1/gi, '');
    return `<a${next} hreflang="en" aria-label="${label}">${label}${icon}</a>`;
  });
}

// BOQ-only module projection. Shared SaveState and other locale owners remain unchanged.
function repairFrenchBoqSavedWorkspaceRuntime(row, code) {
  if (row.id !== 'boq-generator') return code;
  const before = "renderSavedItems('boq-builder', 'saved-boqs', { appUrl: 'app.html', itemNoun: 'BOQ' });";
  const after = "function discloseSavedBoqWorkspace() {\n  const target = document.getElementById('saved-boqs');\n  if (!target) return;\n  target.querySelectorAll('.saved-card-open').forEach(link => {\n    link.textContent = 'Ouvrir ce devis (éditeur en anglais)';\n    link.setAttribute('hreflang', 'en');\n    link.setAttribute('aria-label', 'Ouvrir ce devis dans l’éditeur de devis (en anglais)');\n  });\n}\nrenderSavedItems('boq-builder', 'saved-boqs', {\n  appUrl: '/tools/boq-builder/app',\n  itemNoun: 'BOQ',\n  onDelete() { queueMicrotask(discloseSavedBoqWorkspace); }\n});\ndiscloseSavedBoqWorkspace();";
  const beforeCount = code.split(before).length - 1;
  const afterCount = code.split(after).length - 1;
  const callCount = (code.match(/\brenderSavedItems\s*\(\s*(['"])boq-builder\1\s*,\s*(['"])saved-boqs\2\s*,/g) || []).length;
  if (callCount === 0 && beforeCount === 0 && afterCount === 0) return code;
  if (callCount !== 1 || beforeCount + afterCount !== 1) {
    throw new Error('Ambiguous French BOQ saved-workspace module');
  }
  if (afterCount === 1) return code;
  return code.replace(before, after);
}

module.exports = { repairFrenchBoqWorkspaceLinks, repairFrenchBoqSavedWorkspaceRuntime };
