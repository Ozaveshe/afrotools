/**
 * AFROTOOLS — PDF Template Library
 * ═══════════════════════════════════════════════════════════
 * Shared branded PDF generation for all tools.
 * Uses jsPDF (loaded lazily) with consistent branding.
 *
 * Usage:
 *   await AfroTools.pdf.generate({
 *     title: 'Nigeria PAYE Tax Report',
 *     subtitle: 'NTA 2026 Calculation',
 *     country: 'Nigeria',
 *     countryFlag: '\uD83C\uDDF3\uD83C\uDDEC',
 *     toolId: 'ng-paye',
 *     heroStats: [
 *       { label: 'Gross Annual', value: '\u20A63,600,000' },
 *       { label: 'Take-Home', value: '\u20A6275,000/mo', highlight: true },
 *       { label: 'Tax Rate', value: '12.5%', color: 'red' },
 *     ],
 *     sections: [
 *       {
 *         title: 'Income Breakdown',
 *         rows: [
 *           { label: 'Gross Salary', value: '\u20A63,600,000' },
 *           { label: 'Pension (8%)', value: '-\u20A6288,000', type: 'deduction' },
 *           { label: 'Take-Home Pay', value: '\u20A62,800,000', type: 'total' },
 *         ],
 *       }
 *     ],
 *     chartImage: canvasElement, // optional — canvas or data URL
 *     disclaimer: 'Custom disclaimer text...',
 *     source: 'Nigeria Tax Act 2025, FIRS',
 *   });
 * ═══════════════════════════════════════════════════════════
 */

(function (window) {
  'use strict';

  let jsPDFLoaded = false;
  let loadPromise = null;

  /**
   * Lazily load jsPDF from CDN
   */
  function loadJsPDF() {
    if (jsPDFLoaded && window.jspdf) return Promise.resolve();
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => { jsPDFLoaded = true; resolve(); };
      script.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(script);
    });
    return loadPromise;
  }

  // Brand colors
  const COLORS = {
    dark: [15, 23, 42],       // #0f172a
    brand: [0, 122, 255],     // #007AFF
    blue:  [0, 122, 255],     // #007AFF
    red: [192, 57, 43],       // #c0392b
    text: [17, 24, 39],       // #111827
    muted: [107, 114, 128],   // #6b7280
    light: [249, 250, 251],   // #f9fafb
    border: [229, 231, 235],  // #e5e7eb
    white: [255, 255, 255],
  };

  /**
   * Generate a branded PDF
   * @param {Object} config
   * @returns {Promise<void>}
   */
  async function generate(config) {
    await loadJsPDF();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const margin = 20;
    const contentW = W - margin * 2;
    let y = 0;

    // ── HEADER BAR ──────────────────────────────────
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, W, 42, 'F');

    // Brand accent line
    doc.setFillColor(...COLORS.brand);
    doc.rect(0, 42, W, 1.5, 'F');

    // Brand name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.white);
    doc.text('AFROTOOLS', margin, 14);

    // Brand tagline
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text("Africa's Financial Platform", margin, 19);

    // Reference & date
    const refNo = 'AFT-' + (config.toolId || 'TOOL').toUpperCase().replace(/-/g, '') + '-' + Date.now().toString(36).toUpperCase().slice(-6);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('Ref: ' + refNo, W - margin, 12, { align: 'right' });
    doc.text(dateStr, W - margin, 17, { align: 'right' });

    // Country flag + title
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.white);
    const titleText = (config.countryFlag ? config.countryFlag + '  ' : '') + (config.title || 'Tax Report');
    doc.text(titleText, margin, 32);

    // Subtitle
    if (config.subtitle) {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.blue);
      doc.text(config.subtitle, margin, 38);
    }

    y = 50;

    // ── HERO STATS BAR ──────────────────────────────
    if (config.heroStats && config.heroStats.length > 0) {
      doc.setFillColor(...COLORS.light);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(margin, y, contentW, 22, 3, 3, 'FD');

      const statW = contentW / config.heroStats.length;
      config.heroStats.forEach((stat, i) => {
        const cx = margin + statW * i + statW / 2;

        // Label
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.muted);
        doc.text(stat.label.toUpperCase(), cx, y + 8, { align: 'center' });

        // Value
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        if (stat.color === 'red') doc.setTextColor(...COLORS.red);
        else if (stat.highlight) doc.setTextColor(...COLORS.brand);
        else doc.setTextColor(...COLORS.text);
        doc.text(stat.value, cx, y + 16, { align: 'center' });

        // Divider
        if (i < config.heroStats.length - 1) {
          doc.setDrawColor(...COLORS.border);
          doc.line(margin + statW * (i + 1), y + 4, margin + statW * (i + 1), y + 18);
        }
      });

      y += 28;
    }

    // ── EFFECTIVE RATE BAR ────────────────────────────
    if (config.effectiveRate != null) {
      const rate = Math.min(Math.max(config.effectiveRate, 0), 1);
      const barW = contentW - 60;
      const barH = 4;
      const barX = margin + 50;
      const barY = y + 1;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.muted);
      doc.text('EFFECTIVE RATE', margin, y + 4);

      // Track
      doc.setFillColor(...COLORS.border);
      doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');

      // Fill
      if (rate > 0) {
        const fillW = Math.max(barW * rate, 3);
        doc.setFillColor(...COLORS.brand);
        doc.roundedRect(barX, barY, fillW, barH, 2, 2, 'F');
      }

      // Percentage
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text((rate * 100).toFixed(1) + '%', barX + barW + 4, y + 4.5);

      y += 12;
    }

    // ── SECTIONS ────────────────────────────────────
    if (config.sections) {
      for (const section of config.sections) {
        // Check for page break
        if (y > H - 50) {
          doc.addPage();
          y = 20;
        }

        // Section title with colored bar
        doc.setFillColor(240, 245, 255);
        doc.setDrawColor(...COLORS.border);
        doc.roundedRect(margin, y - 3, contentW, 8, 1.5, 1.5, 'FD');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.brand);
        doc.text(section.title.toUpperCase(), margin + 4, y + 2);
        y += 9;

        // Rows
        let rowIdx = 0;
        for (const row of section.rows) {
          if (y > H - 30) {
            doc.addPage();
            y = 20;
          }

          const isTotal = row.type === 'total';
          const isDeduction = row.type === 'deduction';
          const isSubtotal = row.type === 'subtotal';

          if (isTotal || isSubtotal) {
            doc.setDrawColor(...COLORS.border);
            doc.line(margin, y - 1, margin + contentW, y - 1);
            y += 1;
          }

          // Alternating row background
          if (!isTotal && !isSubtotal && rowIdx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 3.5, contentW, 5.5, 'F');
          }

          // Label
          doc.setFontSize(isTotal ? 9 : 8.5);
          doc.setFont('helvetica', (isTotal || isSubtotal) ? 'bold' : 'normal');
          doc.setTextColor(...(isTotal ? COLORS.text : COLORS.text));
          doc.text(row.label, margin + (row.indent ? 8 : 0), y);

          // Value
          doc.setFont('helvetica', (isTotal || isSubtotal) ? 'bold' : 'normal');
          if (isDeduction) doc.setTextColor(...COLORS.red);
          else if (isTotal && row.highlight !== false) doc.setTextColor(...COLORS.brand);
          else if (row.color === 'red') doc.setTextColor(...COLORS.red);
          else if (row.color === 'green' || row.color === 'blue') doc.setTextColor(...COLORS.brand);
          else if (row.color === 'muted') doc.setTextColor(...COLORS.muted);
          else doc.setTextColor(...COLORS.text);
          doc.text(row.value, margin + contentW, y, { align: 'right' });

          y += isTotal ? 7 : 5.5;
          rowIdx++;
        }

        y += 4;
      }
    }

    // ── CHART IMAGE ─────────────────────────────────
    if (config.chartImage) {
      if (y > H - 80) {
        doc.addPage();
        y = 20;
      }

      try {
        let imgData;
        if (typeof config.chartImage === 'string') {
          imgData = config.chartImage;
        } else if (config.chartImage.toDataURL) {
          imgData = config.chartImage.toDataURL('image/png');
        }

        if (imgData) {
          const chartW = Math.min(contentW, 140);
          const chartH = chartW * 0.55;
          const cx = margin + (contentW - chartW) / 2;
          doc.addImage(imgData, 'PNG', cx, y, chartW, chartH);
          y += chartH + 8;
        }
      } catch (e) {
        // Silently skip chart if it fails
      }
    }

    // ── LEGAL SOURCE ────────────────────────────────
    if (config.source) {
      if (y > H - 30) { doc.addPage(); y = 20; }
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.muted);
      doc.text('LEGAL BASIS', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const sourceLines = doc.splitTextToSize(config.source, contentW);
      doc.text(sourceLines, margin, y);
      y += sourceLines.length * 3.5 + 4;
    }

    // ── FOOTER ──────────────────────────────────────
    const footerY = H - 20;
    // Blue accent line
    doc.setFillColor(...COLORS.brand);
    doc.rect(0, footerY - 4, W, 1, 'F');
    // Footer background
    doc.setFillColor(...COLORS.light);
    doc.rect(0, footerY - 3, W, 23, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('AFROTOOLS', margin, footerY + 3);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text("Free tax calculators for all 54 African countries", margin, footerY + 7);

    const disclaimer = config.disclaimer || 'For informational purposes only. Not professional tax or financial advice. Verify with local tax authority.';
    const discLines = doc.splitTextToSize(disclaimer, contentW);
    doc.setFontSize(5.5);
    doc.text(discLines, margin, footerY + 12);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.brand);
    doc.text('afrotools.com', W - margin, footerY + 3, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(5.5);
    doc.text(refNo + '  |  ' + dateStr, W - margin, footerY + 7, { align: 'right' });

    // ── SAVE ────────────────────────────────────────
    const fileName = `afrotools-${config.toolId || 'report'}-${(config.country || 'report').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    // Track download
    if (window.gtag) {
      window.gtag('event', 'pdf_download', {
        tool_name: config.toolId || 'unknown',
        country: config.country || 'unknown',
      });
    }

    // Toast feedback
    if (window.AfroTools && window.AfroTools.toast) {
      window.AfroTools.toast.success('PDF downloaded');
    }
  }

  const pdf = {
    generate,
    loadJsPDF,
  };

  // Expose globally
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.pdf = pdf;

})(window);
