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

module.exports = { repairFrenchBoqWorkspaceLinks };
