'use strict';
// Replace only the historical inline AcroForm controller, preserving page metadata and other scripts.
function installFormFillerRuntime(html, app) {
  if (app.id !== 'pdf-form-filler') return html;
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, block =>
    block.includes('function getPDFLib()') && block.includes('fieldElements')
      ? '<script src="/assets/js/pages/pdf-form-filler.js"></script>' : block);
}
module.exports = { installFormFillerRuntime };
