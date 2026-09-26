'use strict';
function installReorderRuntime(html, app) {
  if (app.id !== 'pdf-reorder') return html;
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, block =>
    block.includes('async function buildPdfBytes') && block.includes('pageGrid')
      ? '<script src="/assets/js/pages/pdf-reorder.js"></script>' : block);
}
module.exports = { installReorderRuntime };
