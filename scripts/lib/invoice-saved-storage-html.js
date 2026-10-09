'use strict';

// The maintained invoice controller owns the complete saved-document workflow.
// Apply to authored pages and from localized-page owners to prevent old inline
// summary-only save handlers from being regenerated.
function installInvoiceSavedStorage(html) {
  html = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, script => {
    if (script.includes('window.invDelSaved=function') && script.includes('window.invSaveCurrentInvoice=function')) {
      return '<!-- Saved invoices are managed by invoice-generator-enhancements.js. -->';
    }
    if (!script.includes('function getSavedInvoices()')) return script;
    return script.replace(/function getSavedInvoices\(\) \{[\s\S]*?\n  \}/, `function getSavedInvoices() {
    return window.AfroInvoiceSaved ? window.AfroInvoiceSaved.getAll() : null;
  }`).replaceAll('var invoices = getSavedInvoices();', 'var invoices = getSavedInvoices();\n    if (!invoices) return;');
  });
  // Idempotence for already-normalized authored or localized pages.
  return html.replaceAll('if (!invoices) return;\n    if (!invoices) return;', 'if (!invoices) return;');
}

module.exports = { installInvoiceSavedStorage };
