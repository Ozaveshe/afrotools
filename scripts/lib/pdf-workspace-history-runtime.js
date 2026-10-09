'use strict';
function installPdfWorkspaceHistory(html) {
  return html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, script => script.includes("DB_NAME='afrotools-pdf-workspace'") && script.includes('window.pdfSaveOp=') ? '<script src="/assets/js/pages/pdf-workspace-history.js"></script>' : script);
}
module.exports={installPdfWorkspaceHistory};
