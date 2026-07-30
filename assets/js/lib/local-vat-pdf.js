(function initLocalVatPdf(root) {
  "use strict";

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.localVatPdf = function localVatPdf(config) {
    if (!root.jspdf || !root.jspdf.jsPDF) {
      throw new Error("jsPDF is not available for the local VAT export.");
    }
    var details = config || {};
    var documentPdf = new root.jspdf.jsPDF({ unit: "mm", format: "a4" });
    var y = 20;
    documentPdf.setFont("helvetica", "bold");
    documentPdf.setFontSize(16);
    documentPdf.text(String(details.title || "Estimation TVA"), 20, y);
    y += 10;
    documentPdf.setFont("helvetica", "normal");
    documentPdf.setFontSize(9);
    if (details.subtitle) {
      documentPdf.text(
        documentPdf.splitTextToSize(String(details.subtitle), 170),
        20,
        y,
      );
      y += 12;
    }
    (details.rows || []).forEach(function renderRow(row) {
      documentPdf.setFont("helvetica", "bold");
      documentPdf.text(String(row.label || ""), 20, y);
      documentPdf.setFont("helvetica", "normal");
      documentPdf.text(String(row.value || ""), 190, y, { align: "right" });
      y += 8;
    });
    if (details.disclaimer) {
      y += 4;
      documentPdf.setFontSize(8);
      documentPdf.text(
        documentPdf.splitTextToSize(String(details.disclaimer), 170),
        20,
        y,
      );
    }

    var blob = documentPdf.output("blob");
    var fileName = String(details.fileName || "estimation-tva.pdf").replace(
      /[\\/:*?"<>|]+/g,
      "-",
    );
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.dataset.noPdfGate = "true";
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function revokeLocalVatPdfUrl() {
      URL.revokeObjectURL(url);
    }, 5000);
    return { blob: blob, fileName: fileName };
  };
})(window);
