/**
 * AfroDraft v6 — Image Exporter
 *
 * Exports the canvas drawing to PNG or JPEG at configurable DPI.
 * Uses OffscreenCanvas for high-resolution rendering.
 */

import { PdfExporter } from './PdfExporter.js';

export class ImageExporter {
  /**
   * Export the drawing to an image Blob.
   * @param {import('../core/Engine.js').Engine} engine
   * @param {import('../render/Viewport.js').Viewport} viewport
   * @param {Object} [options]
   * @param {string} [options.format='png'] — 'png' or 'jpeg'
   * @param {number} [options.dpi=150] — output resolution
   * @param {number} [options.quality=0.92] — JPEG quality (0-1)
   * @param {string} [options.background='#ffffff'] — background color
   * @param {string} [options.colorMode='color'] — 'color' or 'mono'
   * @param {number} [options.width] — explicit pixel width (overrides DPI)
   * @param {number} [options.height] — explicit pixel height (overrides DPI)
   * @param {number} [options.padding=20] — padding in pixels
   * @returns {Promise<Blob>}
   */
  static async export(engine, viewport, options = {}) {
    const format = options.format || 'png';
    const dpi = options.dpi || 150;
    const quality = options.quality ?? 0.92;
    const bgColor = options.background || '#ffffff';
    const colorMode = options.colorMode || 'color';
    const padding = options.padding ?? 20;

    const ext = engine.getExtents();
    if (!ext) {
      // Empty drawing
      const canvas = new OffscreenCanvas(100, 100);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 100, 100);
      return canvas.convertToBlob({ type: `image/${format}`, quality });
    }

    const extW = ext.maxX - ext.minX;
    const extH = ext.maxY - ext.minY;

    // Calculate canvas size
    let canvasW, canvasH, pxPerUnit;
    if (options.width && options.height) {
      canvasW = options.width;
      canvasH = options.height;
      pxPerUnit = Math.min(
        (canvasW - padding * 2) / (extW || 1),
        (canvasH - padding * 2) / (extH || 1)
      );
    } else {
      // Use DPI: assume 1 world unit = 1mm
      pxPerUnit = dpi / 25.4;
      canvasW = Math.round(extW * pxPerUnit + padding * 2);
      canvasH = Math.round(extH * pxPerUnit + padding * 2);

      // Cap at reasonable size
      const maxDim = 8000;
      if (canvasW > maxDim || canvasH > maxDim) {
        const scale = maxDim / Math.max(canvasW, canvasH);
        canvasW = Math.round(canvasW * scale);
        canvasH = Math.round(canvasH * scale);
        pxPerUnit *= scale;
      }
    }

    const canvas = new OffscreenCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Transform: world to canvas
    ctx.save();
    ctx.translate(padding, padding);
    // Center
    const drawW = canvasW - padding * 2;
    const drawH = canvasH - padding * 2;
    const offsetX = (drawW - extW * pxPerUnit) / 2;
    const offsetY = (drawH - extH * pxPerUnit) / 2;
    ctx.translate(offsetX, offsetY);
    // Flip Y
    ctx.translate(0, extH * pxPerUnit);
    ctx.scale(pxPerUnit, -pxPerUnit);
    // Offset to drawing origin
    ctx.translate(-ext.minX, -ext.minY);

    // Render all entities
    PdfExporter._renderEntities(ctx, engine, colorMode, 1 / pxPerUnit);

    ctx.restore();

    // Convert to blob
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return canvas.convertToBlob({ type: mimeType, quality });
  }

  /**
   * Export and trigger browser download.
   * @param {import('../core/Engine.js').Engine} engine
   * @param {import('../render/Viewport.js').Viewport} viewport
   * @param {string} [filename='drawing.png']
   * @param {Object} [options]
   */
  static async exportToFile(engine, viewport, filename = 'drawing.png', options = {}) {
    // Infer format from filename
    if (!options.format) {
      if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        options.format = 'jpeg';
      } else {
        options.format = 'png';
      }
    }

    const blob = await this.export(engine, viewport, options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Export the current viewport (what the user sees) to an image.
   * @param {import('../render/Viewport.js').Viewport} viewport
   * @param {Object} [options]
   * @param {string} [options.format='png']
   * @param {number} [options.scale=2] — DPI multiplier (2 = retina)
   * @param {number} [options.quality=0.92]
   * @returns {Promise<Blob>}
   */
  static async exportViewport(viewport, options = {}) {
    const format = options.format || 'png';
    const scale = options.scale || 2;
    const quality = options.quality ?? 0.92;

    const w = viewport.width * scale;
    const h = viewport.height * scale;

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(viewport.canvas, 0, 0);

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return canvas.convertToBlob({ type: mimeType, quality });
  }
}
