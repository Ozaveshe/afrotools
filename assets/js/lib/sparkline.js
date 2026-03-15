/**
 * AFROTOOLS — Sparkline Utility
 * =====================================================================
 * Tiny inline chart rendered on a <canvas> element.
 *
 * Usage:
 *   AfroTools.sparkline(canvasElement, [10, 15, 12, 18, 22, 20], {
 *     color: '#007AFF',
 *     width: 80,
 *     height: 24,
 *     lineWidth: 1.5,
 *     filled: true,
 *     showDots: true
 *   });
 * =====================================================================
 */
(function (window) {
  'use strict';

  const DEFAULTS = {
    color: '#007AFF',
    risingColor: '#007AFF',
    fallingColor: '#ef4444',
    width: 80,
    height: 24,
    lineWidth: 1.5,
    filled: false,
    showDots: false,
    dotRadius: 2,
    padding: 2
  };

  /**
   * Draw a sparkline on a canvas element
   * @param {HTMLCanvasElement} canvas - target canvas
   * @param {number[]} data - array of numeric values
   * @param {Object} [opts] - drawing options
   */
  function sparkline(canvas, data, opts) {
    if (!canvas || !data || data.length < 2) return;

    const o = Object.assign({}, DEFAULTS, opts);

    // Set canvas dimensions (account for device pixel ratio)
    const dpr = window.devicePixelRatio || 1;
    const w = o.width;
    const h = o.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Calculate bounds
    const pad = o.padding;
    const drawW = w - pad * 2;
    const drawH = h - pad * 2;

    let min = Infinity, max = -Infinity;
    for (const v of data) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min || 1;

    // Map data to canvas coordinates
    const stepX = drawW / (data.length - 1);
    const points = data.map((v, i) => ({
      x: pad + i * stepX,
      y: pad + drawH - ((v - min) / range) * drawH
    }));

    // Determine trend: last value vs previous
    const rising = data[data.length - 1] >= data[data.length - 2];
    const lineColor = o.color || (rising ? o.risingColor : o.fallingColor);

    // Draw filled area
    if (o.filled) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, h - pad);
      for (const p of points) ctx.lineTo(p.x, p.y);
      ctx.lineTo(points[points.length - 1].x, h - pad);
      ctx.closePath();
      ctx.fillStyle = lineColor.replace(')', ',0.12)').replace('rgb(', 'rgba(');
      // Handle hex colors
      if (lineColor.startsWith('#')) {
        ctx.fillStyle = hexToRgba(lineColor, 0.12);
      }
      ctx.fill();
    }

    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = o.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw endpoint dot
    if (o.showDots) {
      const last = points[points.length - 1];
      const dotColor = rising ? (o.risingColor || '#007AFF') : (o.fallingColor || '#ef4444');
      ctx.beginPath();
      ctx.arc(last.x, last.y, o.dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }
  }

  /**
   * Convert hex color to rgba string
   * @param {string} hex
   * @param {number} alpha
   * @returns {string}
   */
  function hexToRgba(hex, alpha) {
    const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthand, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0,0,0,${alpha})`;
    return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.sparkline = sparkline;

})(window);
