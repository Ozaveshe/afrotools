!function (window) {
  "use strict";

  var jsPdfLoaded = false;
  var jsPdfLoading = null;
  var gateLoading = null;
  var colors = {
    dark: [15, 23, 42],
    brand: [0, 122, 255],
    blue: [0, 122, 255],
    red: [192, 57, 43],
    text: [17, 24, 39],
    muted: [107, 114, 128],
    light: [249, 250, 251],
    border: [229, 231, 235],
    white: [255, 255, 255]
  };

  function loadJsPDF() {
    if (jsPdfLoaded && window.jspdf) return Promise.resolve();
    if (jsPdfLoading) return jsPdfLoading;
    jsPdfLoading = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = function () {
        jsPdfLoaded = true;
        resolve();
      };
      script.onerror = function () {
        reject(new Error("Failed to load jsPDF"));
      };
      document.head.appendChild(script);
    });
    return jsPdfLoading;
  }

  function inferCategory(config) {
    var toolId = config && config.toolId || "";
    var path = window.location && window.location.pathname || "";
    if (/paye|salary|tax|vat|payroll/i.test(toolId + " " + path)) return "salary-tax";
    if (/pdf|document/i.test(toolId + " " + path)) return "document-pdf";
    return "generated-report";
  }

  function loadGate() {
    if (window.AfroPdfDownloadGate && typeof window.AfroPdfDownloadGate.guardPromise === "function") {
      return Promise.resolve(window.AfroPdfDownloadGate);
    }
    if (gateLoading) return gateLoading;
    gateLoading = new Promise(function (resolve) {
      var existing = document.querySelector('script[src*="pdf-download-gate.js"]');
      if (existing) {
        var tries = 0;
        (function wait() {
          tries += 1;
          if (window.AfroPdfDownloadGate && typeof window.AfroPdfDownloadGate.guardPromise === "function") return resolve(window.AfroPdfDownloadGate);
          if (tries > 50) return resolve(null);
          setTimeout(wait, 100);
        }());
        return;
      }
      var script = document.createElement("script");
      script.src = "/assets/js/lib/pdf-download-gate.js?v=20260502";
      script.onload = function () { resolve(window.AfroPdfDownloadGate || null); };
      script.onerror = function () { resolve(null); };
      document.head.appendChild(script);
    });
    return gateLoading;
  }

  async function waitForGate(config) {
    if (config && (config.noGate === true || config.skipGate === true)) return { context: null, user: null };
    var gate = await loadGate();
    if (!gate || typeof gate.guardPromise !== "function") return { context: null, user: null };
    var result = await gate.guardPromise({
      source: "pdf-template",
      category: inferCategory(config || {}),
      toolSlug: config && config.toolId || "",
      countryCode: config && config.countryCode || "",
      currency: config && config.currency || "",
      reportTitle: config && (config.reportTitle || config.title) || "Generated report",
      reportConfig: config || {}
    });
    return result || null;
  }

  function drawHeroStats(pdf, config, x, y, width) {
    if (!config.heroStats || !config.heroStats.length) return y;
    pdf.setFillColor.apply(pdf, colors.light);
    pdf.setDrawColor.apply(pdf, colors.border);
    pdf.roundedRect(x, y, width, 22, 3, 3, "FD");
    var cellWidth = width / config.heroStats.length;
    config.heroStats.forEach(function (stat, index) {
      var center = x + cellWidth * index + cellWidth / 2;
      pdf.setFontSize(6.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor.apply(pdf, colors.muted);
      pdf.text(String(stat.label || "").toUpperCase(), center, y + 8, { align: "center" });
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      if (stat.color === "red") pdf.setTextColor.apply(pdf, colors.red);
      else if (stat.highlight) pdf.setTextColor.apply(pdf, colors.brand);
      else pdf.setTextColor.apply(pdf, colors.text);
      pdf.text(String(stat.value || ""), center, y + 16, { align: "center" });
      if (index < config.heroStats.length - 1) {
        pdf.setDrawColor.apply(pdf, colors.border);
        pdf.line(x + cellWidth * (index + 1), y + 4, x + cellWidth * (index + 1), y + 18);
      }
    });
    return y + 28;
  }

  function drawEffectiveRate(pdf, config, x, y) {
    if (config.effectiveRate == null) return y;
    var rate = Math.min(Math.max(config.effectiveRate, 0), 1);
    var barWidth = 110;
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor.apply(pdf, colors.muted);
    pdf.text("EFFECTIVE RATE", x, y + 4);
    pdf.setFillColor.apply(pdf, colors.border);
    pdf.roundedRect(70, y + 1, barWidth, 4, 2, 2, "F");
    if (rate > 0) {
      pdf.setFillColor.apply(pdf, colors.brand);
      pdf.roundedRect(70, y + 1, Math.max(barWidth * rate, 3), 4, 2, 2, "F");
    }
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor.apply(pdf, colors.text);
    pdf.text((100 * rate).toFixed(1) + "%", 184, y + 4.5);
    return y + 12;
  }

  function drawSections(pdf, config, x, y, width) {
    if (!config.sections) return y;
    config.sections.forEach(function (section) {
      if (y > 247) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFillColor(240, 245, 255);
      pdf.setDrawColor.apply(pdf, colors.border);
      pdf.roundedRect(x, y - 3, width, 8, 1.5, 1.5, "FD");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor.apply(pdf, colors.brand);
      pdf.text(String(section.title || "").toUpperCase(), 24, y + 2);
      y += 9;
      var index = 0;
      (section.rows || []).forEach(function (row) {
        if (y > 267) {
          pdf.addPage();
          y = 20;
        }
        var isTotal = row.type === "total";
        var isDeduction = row.type === "deduction";
        var isSubtotal = row.type === "subtotal";
        if (isTotal || isSubtotal) {
          pdf.setDrawColor.apply(pdf, colors.border);
          pdf.line(x, y - 1, 190, y - 1);
          y += 1;
        }
        if (!isTotal && !isSubtotal && index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(x, y - 3.5, width, 5.5, "F");
        }
        pdf.setFontSize(isTotal ? 9 : 8.5);
        pdf.setFont("helvetica", isTotal || isSubtotal ? "bold" : "normal");
        pdf.setTextColor.apply(pdf, colors.text);
        pdf.text(String(row.label || ""), x + (row.indent ? 8 : 0), y);
        pdf.setFont("helvetica", isTotal || isSubtotal ? "bold" : "normal");
        if (isDeduction) pdf.setTextColor.apply(pdf, colors.red);
        else if (isTotal && row.highlight !== false) pdf.setTextColor.apply(pdf, colors.brand);
        else if (row.color === "red") pdf.setTextColor.apply(pdf, colors.red);
        else if (row.color === "green" || row.color === "blue") pdf.setTextColor.apply(pdf, colors.brand);
        else if (row.color === "muted") pdf.setTextColor.apply(pdf, colors.muted);
        else pdf.setTextColor.apply(pdf, colors.text);
        pdf.text(String(row.value || ""), 190, y, { align: "right" });
        y += isTotal ? 7 : 5.5;
        index += 1;
      });
      y += 4;
    });
    return y;
  }

  function drawChart(pdf, config, x, y, width) {
    if (!config.chartImage) return y;
    if (y > 217) {
      pdf.addPage();
      y = 20;
    }
    try {
      var image = typeof config.chartImage === "string" ? config.chartImage : config.chartImage.toDataURL && config.chartImage.toDataURL("image/png");
      if (image) {
        var chartWidth = Math.min(width, 140);
        var chartHeight = 0.55 * chartWidth;
        pdf.addImage(image, "PNG", x + (width - chartWidth) / 2, y, chartWidth, chartHeight);
        y += chartHeight + 8;
      }
    } catch (err) {}
    return y;
  }

  function drawSource(pdf, config, x, y, width) {
    if (!config.source) return y;
    if (y > 267) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor.apply(pdf, colors.muted);
    pdf.text("LEGAL BASIS", x, y);
    y += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    var lines = pdf.splitTextToSize(config.source, width);
    pdf.text(lines, x, y);
    return y + 3.5 * lines.length + 4;
  }

  function drawFooter(pdf, ref, date, disclaimer, pageWidth, x, width) {
    pdf.setFillColor.apply(pdf, colors.brand);
    pdf.rect(0, 273, pageWidth, 1, "F");
    pdf.setFillColor.apply(pdf, colors.light);
    pdf.rect(0, 274, pageWidth, 23, "F");
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor.apply(pdf, colors.text);
    pdf.text("AFROTOOLS", x, 280);
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor.apply(pdf, colors.muted);
    pdf.text("Free tax calculators for all 54 African countries", x, 284);
    var note = disclaimer || "For informational purposes only. Not professional tax or financial advice. Verify with local tax authority.";
    pdf.setFontSize(5.5);
    pdf.text(pdf.splitTextToSize(note, width), x, 289);
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor.apply(pdf, colors.brand);
    pdf.text("afrotools.com", 190, 280, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor.apply(pdf, colors.muted);
    pdf.setFontSize(5.5);
    pdf.text(ref + "  |  " + date, 190, 284, { align: "right" });
  }

  async function generate(config) {
    config = config || {};
    var gateResult = await waitForGate(config);
    if (gateResult === null) return { blocked: true };

    await loadJsPDF();
    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({ unit: "mm", format: "a4" });
    var pageWidth = 210;
    var x = 20;
    var width = 170;
    var y = 0;
    var ref = "AFT-" + (config.toolId || "TOOL").toUpperCase().replace(/-/g, "") + "-" + Date.now().toString(36).toUpperCase().slice(-6);
    var date = (new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    var gateContext = gateResult && gateResult.context ? gateResult.context : null;

    pdf.setFillColor.apply(pdf, colors.dark);
    pdf.rect(0, 0, pageWidth, 42, "F");
    pdf.setFillColor.apply(pdf, colors.brand);
    pdf.rect(0, 42, pageWidth, 1.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor.apply(pdf, colors.white);
    pdf.text("AFROTOOLS", x, 14);
    pdf.setFontSize(7);
    pdf.setTextColor(200, 200, 200);
    pdf.text("Africa's Financial Platform", x, 19);
    pdf.setFontSize(7);
    pdf.setTextColor(180, 180, 180);
    pdf.text("Ref: " + ref, 190, 12, { align: "right" });
    pdf.text(date, 190, 17, { align: "right" });
    pdf.setFontSize(16);
    pdf.setTextColor.apply(pdf, colors.white);
    pdf.text((config.countryFlag ? config.countryFlag + "  " : "") + (config.title || "Tax Report"), x, 32);
    if (config.subtitle) {
      pdf.setFontSize(9);
      pdf.setTextColor.apply(pdf, colors.blue);
      pdf.text(config.subtitle, x, 38);
    }

    y = 50;
    y = drawHeroStats(pdf, config, x, y, width);
    y = drawEffectiveRate(pdf, config, x, y);
    y = drawSections(pdf, config, x, y, width);
    y = drawChart(pdf, config, x, y, width);
    y = drawSource(pdf, config, x, y, width);
    drawFooter(pdf, ref, date, config.disclaimer, pageWidth, x, width);

    var fileName = "afrotools-" + (config.toolId || "report") + "-" + (config.country || "report").toLowerCase().replace(/\s+/g, "-") + "-" + (new Date()).toISOString().slice(0, 10) + ".pdf";
    pdf.save(fileName);

    var blob = null;
    try {
      blob = pdf.output("blob");
      window.dispatchEvent(new CustomEvent("afro-pdf-generated", {
        detail: {
          blob: blob,
          fileName: fileName,
          ref: ref,
          title: config.title || "Tax Report",
          toolId: config.toolId || "",
          country: config.country || "",
          countryCode: config.countryCode || "",
          currency: config.currency || "",
          category: inferCategory(config),
          gateContext: gateContext
        }
      }));
      var vault = document.querySelector("save-to-vault");
      if (vault && vault.setFile) vault.setFile(blob, fileName);
    } catch (err) {}

    if (window.gtag) {
      window.gtag("event", "pdf_download", {
        tool_name: config.toolId || "unknown",
        country: config.country || "unknown",
        method: gateContext ? "account_gate" : "direct"
      });
    }
    if (window.AfroTools && window.AfroTools.toast) window.AfroTools.toast.success("PDF downloaded");
    return { fileName: fileName, blob: blob, gateContext: gateContext };
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.pdf = {
    generate: generate,
    loadJsPDF: loadJsPDF
  };
}(window);
