/**
 * AfroPlan Export — PDF, PNG, SVG, BOQ PDF
 * Lazy-loaded on demand
 */
var FPExport = (function() {
  'use strict';

  // ── PNG Export ──
  function toPNG() {
    var canvas = renderToCanvas();
    var link = document.createElement('a');
    link.download = (FPApp.projectName || 'floor-plan') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (typeof gtag === 'function') gtag('event', 'plan_downloaded', { tool: 'floor-planner', format: 'png' });
  }

  // ── SVG Export ──
  function toSVG() {
    var objects = FPCanvas.getObjects();
    var bounds = getAllBounds(objects);
    var padding = 20;
    var w = (bounds.x2 - bounds.x1) * 100 + padding * 2;
    var h = (bounds.y2 - bounds.y1) * 100 + padding * 2;

    var svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
    svg += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">\n';
    svg += '<rect width="100%" height="100%" fill="#fff"/>\n';

    objects.forEach(function(obj) {
      var ox = (obj.x !== undefined ? obj.x : obj.x1 || 0) - bounds.x1;
      var oy = (obj.y !== undefined ? obj.y : obj.y1 || 0) - bounds.y1;
      if (obj.type === 'wall') {
        var sx = (obj.x1 - bounds.x1) * 100 + padding;
        var sy = (obj.y1 - bounds.y1) * 100 + padding;
        var ex = (obj.x2 - bounds.x1) * 100 + padding;
        var ey = (obj.y2 - bounds.y1) * 100 + padding;
        svg += '<line x1="' + sx + '" y1="' + sy + '" x2="' + ex + '" y2="' + ey + '" stroke="#2a3d55" stroke-width="' + (obj.thickness * 100) + '" stroke-linecap="round"/>\n';
      }
      if (obj.type === 'room' && obj.points) {
        var pts = obj.points.map(function(p) {
          return ((p.x - bounds.x1) * 100 + padding) + ',' + ((p.y - bounds.y1) * 100 + padding);
        }).join(' ');
        svg += '<polygon points="' + pts + '" fill="' + (obj.color || 'rgba(0,122,255,0.04)') + '"/>\n';
        if (obj.name) {
          var cx = 0, cy = 0;
          obj.points.forEach(function(p) { cx += p.x; cy += p.y; });
          cx = (cx / obj.points.length - bounds.x1) * 100 + padding;
          cy = (cy / obj.points.length - bounds.y1) * 100 + padding;
          svg += '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" font-size="12" font-family="DM Sans,sans-serif" font-weight="600" fill="#333">' + escSvg(obj.name) + '</text>\n';
          if (obj.area) {
            svg += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="10" font-family="JetBrains Mono,monospace" fill="#007AFF">' + FPCanvas.formatArea(obj.area) + '</text>\n';
          }
        }
      }
      if (obj.type === 'door') {
        var dx = (obj.x - bounds.x1) * 100 + padding;
        var dy = (obj.y - bounds.y1) * 100 + padding;
        var dw = obj.width * 100;
        svg += '<rect x="' + (dx - dw / 2) + '" y="' + (dy - 3) + '" width="' + dw + '" height="6" fill="#1a1a1a" transform="rotate(' + ((obj.angle || 0) * 180 / Math.PI) + ',' + dx + ',' + dy + ')"/>\n';
      }
      if (obj.type === 'window') {
        var wx = (obj.x - bounds.x1) * 100 + padding;
        var wy = (obj.y - bounds.y1) * 100 + padding;
        var ww = obj.width * 100;
        svg += '<rect x="' + (wx - ww / 2) + '" y="' + (wy - 4) + '" width="' + ww + '" height="8" fill="rgba(135,206,250,0.3)" stroke="#666" stroke-width="2" transform="rotate(' + ((obj.angle || 0) * 180 / Math.PI) + ',' + wx + ',' + wy + ')"/>\n';
      }
      if (obj.type === 'furniture') {
        var fx = (obj.x - bounds.x1) * 100 + padding;
        var fy = (obj.y - bounds.y1) * 100 + padding;
        var fw = obj.w * 100, fh = obj.h * 100;
        svg += '<rect x="' + (fx - fw / 2) + '" y="' + (fy - fh / 2) + '" width="' + fw + '" height="' + fh + '" fill="rgba(100,116,139,0.1)" stroke="#94a3af" stroke-width="1" transform="rotate(' + ((obj.rotation || 0) * 180 / Math.PI) + ',' + fx + ',' + fy + ')"/>\n';
        svg += '<text x="' + fx + '" y="' + fy + '" text-anchor="middle" dominant-baseline="central" font-size="8" font-family="DM Sans,sans-serif" fill="#64748b">' + escSvg(obj.label || '') + '</text>\n';
      }
    });

    svg += '</svg>';

    var blob = new Blob([svg], { type: 'image/svg+xml' });
    var link = document.createElement('a');
    link.download = (FPApp.projectName || 'floor-plan') + '.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ── PDF Export ──
  function toPDF() {
    loadJsPdf(function() {
      var canvas = renderToCanvas();
      var imgData = canvas.toDataURL('image/png');
      var pdf = new jspdf.jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      var pageW = pdf.internal.pageSize.getWidth();
      var pageH = pdf.internal.pageSize.getHeight();
      var margin = 15;

      // Title block
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(FPApp.projectName || 'Floor Plan', margin, margin + 5);
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text('Generated by AfroPlan — AfroTools.com', margin, margin + 11);
      pdf.text(new Date().toLocaleDateString(), pageW - margin, margin + 5, { align: 'right' });

      // Plan image
      var imgW = pageW - margin * 2;
      var imgH = (canvas.height / canvas.width) * imgW;
      if (imgH > pageH - margin * 2 - 20) {
        imgH = pageH - margin * 2 - 20;
        imgW = (canvas.width / canvas.height) * imgH;
      }
      pdf.addImage(imgData, 'PNG', margin, margin + 16, imgW, imgH);

      // Scale bar
      pdf.setFontSize(7);
      pdf.text('Scale: 1:100 | Units: ' + FPCanvas.units, margin, pageH - margin);

      // Room schedule (if rooms exist)
      var rooms = FPCanvas.getObjects('room');
      if (rooms.length > 0 && imgH + 50 < pageH - margin) {
        var startY = margin + 20 + imgH + 5;
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        pdf.text('Room Schedule', margin, startY);
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(7);
        rooms.forEach(function(r, i) {
          if (r.name || r.area) {
            pdf.text((r.name || 'Room ' + (i + 1)) + ': ' + FPCanvas.formatArea(r.area || 0), margin, startY + 5 + i * 4);
          }
        });
      }

      pdf.save((FPApp.projectName || 'floor-plan') + '.pdf');
      if (typeof gtag === 'function') gtag('event', 'plan_downloaded', { tool: 'floor-planner', format: 'pdf' });
    });
  }

  // ── BOQ PDF ──
  function toBOQPDF() {
    if (typeof FPCost === 'undefined') {
      alert('Please run "Estimate Cost" first.');
      return;
    }
    loadJsPdf(function() {
      var planData = FPApp.exportPlanData();
      var result = FPCost.estimate(planData, 'NG');
      var pdf = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      var margin = 15;
      var pageW = pdf.internal.pageSize.getWidth();

      // Title
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Bill of Quantities (BOQ)', margin, margin + 5);
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text(FPApp.projectName || 'Floor Plan', margin, margin + 11);
      pdf.text(new Date().toLocaleDateString(), pageW - margin, margin + 5, { align: 'right' });

      // Table header
      var y = margin + 20;
      var cols = [margin, margin + 60, margin + 85, margin + 105, margin + 135];
      pdf.setFillColor(10, 22, 40);
      pdf.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.text('Item', cols[0] + 2, y);
      pdf.text('Quantity', cols[1] + 2, y);
      pdf.text('Unit', cols[2] + 2, y);
      pdf.text('Unit Price', cols[3] + 2, y);
      pdf.text('Total', cols[4] + 2, y);

      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      y += 7;

      // Rows
      result.items.forEach(function(item) {
        if (y > 270) { pdf.addPage(); y = margin + 10; }
        pdf.text(item.name, cols[0] + 2, y);
        pdf.text(String(item.qty), cols[1] + 2, y);
        pdf.text(item.unit, cols[2] + 2, y);
        pdf.text(FPCost.formatCurrency(item.unitPrice, 'NG'), cols[3] + 2, y);
        pdf.text(FPCost.formatCurrency(item.total, 'NG'), cols[4] + 2, y);
        pdf.setDrawColor(200);
        pdf.line(margin, y + 2, pageW - margin, y + 2);
        y += 6;
      });

      // Totals
      y += 4;
      pdf.setFont(undefined, 'bold');
      pdf.text('Material Total:', cols[3] + 2, y);
      pdf.text(FPCost.formatCurrency(result.materialTotal, 'NG'), cols[4] + 2, y);
      y += 5;
      pdf.text('Labour (' + Math.round(result.labourPercent * 100) + '%):', cols[3] + 2, y);
      pdf.text(FPCost.formatCurrency(result.labourCost, 'NG'), cols[4] + 2, y);
      y += 5;
      pdf.setFontSize(9);
      pdf.text('GRAND TOTAL:', cols[3] + 2, y);
      pdf.text(FPCost.formatCurrency(result.grandTotal, 'NG'), cols[4] + 2, y);

      // Footer
      pdf.setFontSize(6);
      pdf.setFont(undefined, 'normal');
      pdf.text('Generated by AfroPlan — AfroTools.com | Prices are estimates and may vary', margin, 290);

      pdf.save((FPApp.projectName || 'floor-plan') + '-BOQ.pdf');
    });
  }

  // ── Render to offscreen canvas ──
  function renderToCanvas() {
    var objects = FPCanvas.getObjects();
    var bounds = getAllBounds(objects);
    var pad = 1; // 1 metre padding
    var pxPerM = 100;
    var w = Math.max(400, (bounds.x2 - bounds.x1 + pad * 2) * pxPerM);
    var h = Math.max(300, (bounds.y2 - bounds.y1 + pad * 2) * pxPerM);

    var offscreen = document.createElement('canvas');
    offscreen.width = w * 2; // 2x for quality
    offscreen.height = h * 2;
    var ctx = offscreen.getContext('2d');
    ctx.scale(2, 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    var ox = pad * pxPerM - bounds.x1 * pxPerM;
    var oy = pad * pxPerM - bounds.y1 * pxPerM;

    // Draw grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < w; gx += pxPerM) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (var gy = 0; gy < h; gy += pxPerM) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // Draw objects
    objects.forEach(function(obj) {
      if (obj.type === 'room' && obj.points) {
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x * pxPerM + ox, obj.points[0].y * pxPerM + oy);
        obj.points.forEach(function(p, i) {
          if (i > 0) ctx.lineTo(p.x * pxPerM + ox, p.y * pxPerM + oy);
        });
        ctx.closePath();
        ctx.fillStyle = obj.color || 'rgba(0,122,255,0.04)';
        ctx.fill();
        if (obj.name) {
          var cx = 0, cy = 0;
          obj.points.forEach(function(p) { cx += p.x; cy += p.y; });
          cx = cx / obj.points.length * pxPerM + ox;
          cy = cy / obj.points.length * pxPerM + oy;
          ctx.font = '600 12px DM Sans, sans-serif';
          ctx.fillStyle = '#333';
          ctx.textAlign = 'center';
          ctx.fillText(obj.name, cx, cy - 6);
          if (obj.area) {
            ctx.font = '400 11px JetBrains Mono, monospace';
            ctx.fillStyle = '#007AFF';
            ctx.fillText(FPCanvas.formatArea(obj.area), cx, cy + 10);
          }
        }
      }
      if (obj.type === 'wall') {
        ctx.beginPath();
        ctx.moveTo(obj.x1 * pxPerM + ox, obj.y1 * pxPerM + oy);
        ctx.lineTo(obj.x2 * pxPerM + ox, obj.y2 * pxPerM + oy);
        ctx.strokeStyle = '#2a3d55';
        ctx.lineWidth = Math.max(obj.thickness * pxPerM, 2);
        ctx.lineCap = 'round';
        ctx.stroke();
        // Dimension
        var len = Math.sqrt(Math.pow(obj.x2 - obj.x1, 2) + Math.pow(obj.y2 - obj.y1, 2));
        var mx = (obj.x1 + obj.x2) / 2 * pxPerM + ox;
        var my = (obj.y1 + obj.y2) / 2 * pxPerM + oy;
        ctx.font = '500 9px JetBrains Mono, monospace';
        ctx.fillStyle = '#007AFF';
        ctx.textAlign = 'center';
        ctx.fillText(FPCanvas.formatDim(len), mx, my - obj.thickness * pxPerM / 2 - 4);
      }
      if (obj.type === 'door') {
        ctx.save();
        ctx.translate(obj.x * pxPerM + ox, obj.y * pxPerM + oy);
        ctx.rotate(obj.angle || 0);
        var dw = obj.width * pxPerM;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-dw / 2, -3, dw, 6);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(-dw / 2, 0, dw, -Math.PI / 2, 0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      if (obj.type === 'window') {
        ctx.save();
        ctx.translate(obj.x * pxPerM + ox, obj.y * pxPerM + oy);
        ctx.rotate(obj.angle || 0);
        var ww = obj.width * pxPerM;
        ctx.fillStyle = 'rgba(135,206,250,0.3)';
        ctx.fillRect(-ww / 2, -4, ww, 8);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(-ww / 2, -4, ww, 8);
        ctx.restore();
      }
      if (obj.type === 'furniture') {
        ctx.save();
        ctx.translate(obj.x * pxPerM + ox, obj.y * pxPerM + oy);
        ctx.rotate(obj.rotation || 0);
        var fw = obj.w * pxPerM, fh = obj.h * pxPerM;
        ctx.fillStyle = 'rgba(100,116,139,0.1)';
        ctx.strokeStyle = '#94a3af';
        ctx.lineWidth = 1;
        ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
        ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);
        ctx.font = '500 9px DM Sans, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.label || '', 0, 0);
        ctx.restore();
      }
    });

    return offscreen;
  }

  function getAllBounds(objects) {
    var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    objects.forEach(function(o) {
      var b = FPCanvas.getObjBounds(o);
      if (b.x1 < x1) x1 = b.x1;
      if (b.y1 < y1) y1 = b.y1;
      if (b.x2 > x2) x2 = b.x2;
      if (b.y2 > y2) y2 = b.y2;
    });
    if (x1 === Infinity) { x1 = 0; y1 = 0; x2 = 10; y2 = 10; }
    return { x1: x1, y1: y1, x2: x2, y2: y2 };
  }

  function escSvg(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── jsPDF lazy loader ──
  var jsPdfLoaded = false;
  function loadJsPdf(cb) {
    if (jsPdfLoaded) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
    s.onload = function() { jsPdfLoaded = true; cb(); };
    s.onerror = function() { alert('Failed to load PDF library.'); };
    document.head.appendChild(s);
  }

  return {
    toPNG: toPNG,
    toSVG: toSVG,
    toPDF: toPDF,
    toBOQPDF: toBOQPDF
  };
})();
