/**
 * AfroDraft v6 — PDF Exporter
 *
 * Exports the drawing to PDF by rendering to a high-DPI offscreen
 * canvas and embedding the image in a minimal PDF document.
 *
 * Produces a valid PDF 1.4 file without external dependencies.
 */

export class PdfExporter {
  /**
   * Export the drawing to a PDF Blob.
   * @param {import('../core/Engine.js').Engine} engine
   * @param {import('../render/Viewport.js').Viewport} viewport
   * @param {Object} [options]
   * @param {string} [options.paperSize='A4']
   * @param {string} [options.orientation='landscape']
   * @param {number} [options.dpi=300]
   * @param {number} [options.margin=10] — margin in mm
   * @param {string} [options.colorMode='color'] — 'color' or 'mono'
   * @param {string} [options.background='#ffffff']
   * @returns {Promise<Blob>}
   */
  static async export(engine, viewport, options = {}) {
    const paperSize = options.paperSize || 'A4';
    const orientation = options.orientation || 'landscape';
    const dpi = options.dpi || 300;
    const marginMm = options.margin ?? 10;
    const colorMode = options.colorMode || 'color';
    const bgColor = options.background || '#ffffff';

    // Paper dimensions in mm
    const papers = {
      A4: [210, 297], A3: [297, 420], A2: [420, 594],
      A1: [594, 841], A0: [841, 1189],
      Letter: [215.9, 279.4], Legal: [215.9, 355.6],
      Tabloid: [279.4, 431.8],
    };

    let [shortMm, longMm] = papers[paperSize] || papers.A4;
    let paperW, paperH;
    if (orientation === 'landscape') {
      paperW = longMm; paperH = shortMm;
    } else {
      paperW = shortMm; paperH = longMm;
    }

    // Pixels per mm at target DPI
    const pxPerMm = dpi / 25.4;
    const canvasW = Math.round(paperW * pxPerMm);
    const canvasH = Math.round(paperH * pxPerMm);

    // Drawing area in mm (after margins)
    const drawW = paperW - marginMm * 2;
    const drawH = paperH - marginMm * 2;

    // Compute scale to fit drawing
    const ext = engine.getExtents();
    if (!ext) {
      // Empty drawing — return blank PDF
      return this._buildPdf(canvasW, canvasH, paperW, paperH, null);
    }

    const extW = ext.maxX - ext.minX;
    const extH = ext.maxY - ext.minY;
    const scale = Math.min(drawW / (extW || 1), drawH / (extH || 1));
    const drawPxW = Math.round(drawW * pxPerMm);
    const drawPxH = Math.round(drawH * pxPerMm);

    // Render to offscreen canvas
    const offscreen = new OffscreenCanvas(canvasW, canvasH);
    const ctx = offscreen.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Set up coordinate transform: world -> canvas
    const marginPx = marginMm * pxPerMm;
    const pxPerUnit = scale * pxPerMm;

    ctx.save();
    ctx.translate(marginPx, marginPx);
    // CAD Y-up -> canvas Y-down
    ctx.translate(0, drawPxH);
    ctx.scale(pxPerUnit, -pxPerUnit);
    // Center the drawing
    const offsetX = (drawW / scale - extW) / 2 - ext.minX;
    const offsetY = (drawH / scale - extH) / 2 - ext.minY;
    ctx.translate(offsetX, offsetY);

    // Render entities
    this._renderEntities(ctx, engine, colorMode, 1 / pxPerUnit);

    ctx.restore();

    // Get image data
    const imageBlob = await offscreen.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
    const imageData = new Uint8Array(await imageBlob.arrayBuffer());

    return this._buildPdf(canvasW, canvasH, paperW, paperH, imageData);
  }

  /**
   * Export and trigger download.
   * @param {import('../core/Engine.js').Engine} engine
   * @param {import('../render/Viewport.js').Viewport} viewport
   * @param {string} [filename='drawing.pdf']
   * @param {Object} [options]
   */
  static async exportToFile(engine, viewport, filename = 'drawing.pdf', options = {}) {
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
   * Render entities to a 2D context (used for both PDF and image export).
   * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} ctx
   * @param {import('../core/Engine.js').Engine} engine
   * @param {string} colorMode — 'color' or 'mono'
   * @param {number} worldPixelSize — size of one pixel in world units
   */
  static _renderEntities(ctx, engine, colorMode, worldPixelSize) {
    const minLineWidth = worldPixelSize * 0.5;

    for (const entity of engine.entities.values()) {
      if (!entity.visible) continue;
      const layerName = entity.layer || 'Layer 0';
      const layer = engine.layerManager
        ? engine.layerManager.getLayer(layerName)
        : engine.layers[layerName];
      if (layer && (!layer.visible || layer.frozen)) continue;

      // Determine color
      let color;
      if (colorMode === 'mono') {
        color = '#000000';
      } else {
        const c = entity.color || (layer && layer.color) || { r: 0, g: 0, b: 0 };
        color = `rgb(${c.r},${c.g},${c.b})`;
      }

      const lw = Math.max(entity.lineweight || 0.25, minLineWidth);

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      this._drawEntity(ctx, entity, engine);
    }
  }

  static _drawEntity(ctx, e, engine) {
    switch (e.type) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(e.start.x, e.start.y);
        ctx.lineTo(e.end.x, e.end.y);
        ctx.stroke();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(e.center.x, e.center.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'arc':
        ctx.beginPath();
        ctx.arc(e.center.x, e.center.y, e.radius, e.startAngle, e.endAngle);
        ctx.stroke();
        break;

      case 'polyline':
        if (e.vertices.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(e.vertices[0].x, e.vertices[0].y);
        for (let i = 1; i < e.vertices.length; i++) {
          ctx.lineTo(e.vertices[i].x, e.vertices[i].y);
        }
        if (e.closed) ctx.closePath();
        ctx.stroke();
        break;

      case 'ellipse': {
        const a = Math.sqrt(e.majorAxis.x ** 2 + e.majorAxis.y ** 2);
        const b = a * e.ratio;
        const rot = Math.atan2(e.majorAxis.y, e.majorAxis.x);
        ctx.save();
        ctx.translate(e.center.x, e.center.y);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, a, b, 0, e.startAngle, e.endAngle);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'text': {
        ctx.save();
        ctx.translate(e.position.x, e.position.y);
        ctx.scale(1, -1); // Flip text upright
        if (e.rotation) ctx.rotate(-e.rotation);
        ctx.font = `${e.height}px ${e.style || 'Arial'}`;
        ctx.textAlign = e.justification === 'center' ? 'center' : e.justification === 'right' ? 'right' : 'left';
        ctx.fillText(e.text, 0, 0);
        ctx.restore();
        break;
      }

      case 'mtext': {
        ctx.save();
        ctx.translate(e.position.x, e.position.y);
        ctx.scale(1, -1);
        ctx.font = `${e.height}px ${e.style || 'Arial'}`;
        ctx.fillText(e.text, 0, 0);
        ctx.restore();
        break;
      }

      case 'point': {
        const size = 1;
        ctx.beginPath();
        ctx.moveTo(e.position.x - size, e.position.y);
        ctx.lineTo(e.position.x + size, e.position.y);
        ctx.moveTo(e.position.x, e.position.y - size);
        ctx.lineTo(e.position.x, e.position.y + size);
        ctx.stroke();
        break;
      }

      case 'hatch': {
        if (e.boundary.length < 3) break;
        ctx.beginPath();
        ctx.moveTo(e.boundary[0].x, e.boundary[0].y);
        for (let i = 1; i < e.boundary.length; i++) {
          ctx.lineTo(e.boundary[i].x, e.boundary[i].y);
        }
        ctx.closePath();
        if (e.solid) {
          ctx.globalAlpha = 0.3;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.stroke();
        break;
      }

      default:
        break;
    }
  }

  /**
   * Build a minimal valid PDF with an embedded JPEG image.
   * @param {number} imgW — image width in pixels
   * @param {number} imgH — image height in pixels
   * @param {number} paperW — paper width in mm
   * @param {number} paperH — paper height in mm
   * @param {Uint8Array|null} jpegData
   * @returns {Blob}
   */
  static _buildPdf(imgW, imgH, paperW, paperH, jpegData) {
    // Convert mm to PDF points (1 mm = 2.83465 points)
    const ptW = (paperW * 72 / 25.4).toFixed(2);
    const ptH = (paperH * 72 / 25.4).toFixed(2);

    const enc = new TextEncoder();
    const parts = [];
    const offsets = [];

    const addObj = (num, content) => {
      const header = `${num} 0 obj\n`;
      const footer = `\nendobj\n`;
      offsets[num] = parts.reduce((s, p) => s + p.length, 0);
      if (typeof content === 'string') {
        const data = enc.encode(header + content + footer);
        parts.push(data);
      } else {
        // Binary content (for image stream)
        const hdr = enc.encode(header);
        const ftr = enc.encode(footer);
        parts.push(hdr);
        parts.push(content);
        parts.push(ftr);
      }
    };

    // Header
    parts.push(enc.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));

    // Object 1: Catalog
    addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

    // Object 2: Pages
    addObj(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);

    if (jpegData) {
      // Object 3: Page
      addObj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW} ${ptH}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>`);

      // Object 4: Content stream (draw image to fill page)
      const streamContent = `q\n${ptW} 0 0 ${ptH} 0 0 cm\n/Im1 Do\nQ`;
      addObj(4, `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`);

      // Object 5: Image XObject
      const imgHeader = `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegData.length} >>\nstream\n`;
      const imgFooter = `\nendstream`;
      const imgHeaderBytes = enc.encode(`5 0 obj\n${imgHeader}`);
      const imgFooterBytes = enc.encode(`${imgFooter}\nendobj\n`);
      offsets[5] = parts.reduce((s, p) => s + p.length, 0);
      parts.push(imgHeaderBytes);
      parts.push(jpegData);
      parts.push(imgFooterBytes);
    } else {
      // Empty page
      addObj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW} ${ptH}] >>`);
    }

    // Cross-reference table
    const xrefOffset = parts.reduce((s, p) => s + p.length, 0);
    const objCount = jpegData ? 6 : 4;
    let xref = `xref\n0 ${objCount}\n0000000000 65535 f \n`;
    for (let i = 1; i < objCount; i++) {
      const off = (offsets[i] || 0).toString().padStart(10, '0');
      xref += `${off} 00000 n \n`;
    }

    xref += `trailer\n<< /Size ${objCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    parts.push(enc.encode(xref));

    return new Blob(parts, { type: 'application/pdf' });
  }
}
