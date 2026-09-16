"use strict";
// Compatibility entry point for pages that still load this script. Keep one
// paginator so UI/download API bindings cannot race different clipping rules.
(function (window, document) {
  function bindCanonicalExporter() {
    var owner = window.CVExportPdfQuality;
    if (!owner || typeof owner.exportPdf !== "function") return;
    if (window.CVExportUpgrade) window.CVExportUpgrade.exportPdf = owner.exportPdf;
    if (window.CVApp) window.CVApp.downloadPDF = owner.exportPdf;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindCanonicalExporter);
  else bindCanonicalExporter();
  setTimeout(bindCanonicalExporter, 900);
})(window, document);
