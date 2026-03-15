/**
 * AfroDraft v6 — SVG Exporter
 *
 * Exports the drawing to SVG format, grouped by layer.
 * Produces clean, standards-compliant SVG output.
 */

export class SvgExporter {
  /**
   * Export the drawing to an SVG string.
   * @param {import('../core/Engine.js').Engine} engine
   * @param {Object} [options]
   * @param {boolean} [options.flipY=true] — flip Y axis (CAD Y-up to SVG Y-down)
   * @param {number} [options.padding=10] — padding around the drawing
   * @param {string} [options.background] — background color (null = transparent)
   * @returns {string}
   */
  static export(engine, options = {}) {
    const flipY = options.flipY !== false;
    const padding = options.padding ?? 10;
    const background = options.background || null;

    const bounds = engine.getExtents();
    if (!bounds) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
    }

    const w = bounds.maxX - bounds.minX + padding * 2;
    const h = bounds.maxY - bounds.minY + padding * 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" `;
    svg += `width="${w.toFixed(2)}" height="${h.toFixed(2)}" `;
    svg += `viewBox="${(bounds.minX - padding).toFixed(2)} `;
    if (flipY) {
      svg += `${(-bounds.maxY - padding).toFixed(2)} `;
    } else {
      svg += `${(bounds.minY - padding).toFixed(2)} `;
    }
    svg += `${w.toFixed(2)} ${h.toFixed(2)}">\n`;

    // Background
    if (background) {
      svg += `  <rect x="${(bounds.minX - padding).toFixed(2)}" `;
      svg += `y="${flipY ? (-bounds.maxY - padding).toFixed(2) : (bounds.minY - padding).toFixed(2)}" `;
      svg += `width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${background}"/>\n`;
    }

    // Linetype defs
    svg += this._writeLinetypeDefs(engine);

    // Group entities by layer
    const byLayer = this.groupByLayer(engine);
    for (const [layerName, entities] of byLayer) {
      const layerData = engine.layerManager
        ? engine.layerManager.getLayer(layerName)
        : engine.layers[layerName];

      if (layerData && (!layerData.visible || layerData.frozen)) continue;

      const strokeColor = layerData ? this.colorToHex(layerData.color) : '#ffffff';
      const lineweight = layerData ? (layerData.lineweight || 0.25) : 0.25;

      const safeName = layerName.replace(/[^a-zA-Z0-9_-]/g, '_');
      svg += `  <g id="layer-${safeName}" stroke="${strokeColor}" stroke-width="${lineweight}" fill="none"`;
      if (flipY) {
        svg += ` transform="scale(1,-1)"`;
      }
      svg += `>\n`;

      for (const entity of entities) {
        const entSvg = this.entityToSvg(entity, engine);
        if (entSvg) {
          svg += `    ${entSvg}\n`;
        }
      }

      svg += `  </g>\n`;
    }

    svg += `</svg>`;
    return svg;
  }

  /**
   * Export and trigger browser download.
   * @param {import('../core/Engine.js').Engine} engine
   * @param {string} [filename='drawing.svg']
   * @param {Object} [options]
   */
  static exportToFile(engine, filename = 'drawing.svg', options = {}) {
    const svg = this.export(engine, options);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
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
   * Group engine entities by layer name.
   * @param {import('../core/Engine.js').Engine} engine
   * @returns {Map<string, Object[]>}
   */
  static groupByLayer(engine) {
    const map = new Map();
    for (const entity of engine.entities.values()) {
      const layer = entity.layer || 'Layer 0';
      if (!map.has(layer)) map.set(layer, []);
      map.get(layer).push(entity);
    }
    return map;
  }

  /**
   * Convert an entity to an SVG element string.
   * @param {Object} entity
   * @param {import('../core/Engine.js').Engine} engine
   * @returns {string}
   */
  static entityToSvg(entity, engine) {
    const e = entity;
    const strokeAttr = this._entityStrokeAttr(e);

    switch (e.type) {
      case 'line':
        return `<line x1="${e.start.x.toFixed(4)}" y1="${e.start.y.toFixed(4)}" x2="${e.end.x.toFixed(4)}" y2="${e.end.y.toFixed(4)}"${strokeAttr}/>`;

      case 'circle':
        return `<circle cx="${e.center.x.toFixed(4)}" cy="${e.center.y.toFixed(4)}" r="${e.radius.toFixed(4)}"${strokeAttr}/>`;

      case 'arc': {
        const r = e.radius;
        const sx = e.center.x + r * Math.cos(e.startAngle);
        const sy = e.center.y + r * Math.sin(e.startAngle);
        const ex = e.center.x + r * Math.cos(e.endAngle);
        const ey = e.center.y + r * Math.sin(e.endAngle);
        let sweep = e.endAngle - e.startAngle;
        if (sweep < 0) sweep += Math.PI * 2;
        const largeArc = sweep > Math.PI ? 1 : 0;
        return `<path d="M ${sx.toFixed(4)} ${sy.toFixed(4)} A ${r.toFixed(4)} ${r.toFixed(4)} 0 ${largeArc} 1 ${ex.toFixed(4)} ${ey.toFixed(4)}"${strokeAttr}/>`;
      }

      case 'ellipse': {
        const a = Math.sqrt(e.majorAxis.x ** 2 + e.majorAxis.y ** 2);
        const b = a * e.ratio;
        const rot = Math.atan2(e.majorAxis.y, e.majorAxis.x) * 180 / Math.PI;
        if (Math.abs(e.endAngle - e.startAngle - Math.PI * 2) < 0.01) {
          return `<ellipse cx="${e.center.x.toFixed(4)}" cy="${e.center.y.toFixed(4)}" rx="${a.toFixed(4)}" ry="${b.toFixed(4)}" transform="rotate(${rot.toFixed(2)} ${e.center.x.toFixed(4)} ${e.center.y.toFixed(4)})"${strokeAttr}/>`;
        }
        // Partial ellipse — approximate with path
        const steps = 64;
        const span = e.endAngle - e.startAngle;
        let d = 'M';
        for (let i = 0; i <= steps; i++) {
          const t = e.startAngle + (span * i) / steps;
          const p = this._ellipsePoint(e, t);
          d += ` ${p.x.toFixed(4)} ${p.y.toFixed(4)}`;
          if (i === 0) d += ' L';
        }
        return `<path d="${d}"${strokeAttr}/>`;
      }

      case 'polyline': {
        if (e.vertices.length < 2) return '';
        const hasBulge = e.vertices.some(v => v.bulge && Math.abs(v.bulge) > 1e-6);
        if (!hasBulge) {
          const pts = e.vertices.map(v => `${v.x.toFixed(4)},${v.y.toFixed(4)}`).join(' ');
          if (e.closed) {
            return `<polygon points="${pts}"${strokeAttr}/>`;
          }
          return `<polyline points="${pts}"${strokeAttr}/>`;
        }
        // Path with bulge arcs
        let d = `M ${e.vertices[0].x.toFixed(4)} ${e.vertices[0].y.toFixed(4)}`;
        const n = e.closed ? e.vertices.length : e.vertices.length - 1;
        for (let i = 0; i < n; i++) {
          const v1 = e.vertices[i];
          const v2 = e.vertices[(i + 1) % e.vertices.length];
          if (v1.bulge && Math.abs(v1.bulge) > 1e-6) {
            const bulge = v1.bulge;
            const dx = v2.x - v1.x, dy = v2.y - v1.y;
            const chord = Math.sqrt(dx * dx + dy * dy);
            const sagitta = Math.abs(bulge) * chord / 2;
            const r = (chord * chord / 4 + sagitta * sagitta) / (2 * sagitta);
            const largeArc = Math.abs(bulge) > 1 ? 1 : 0;
            const sweep = bulge > 0 ? 1 : 0;
            d += ` A ${r.toFixed(4)} ${r.toFixed(4)} 0 ${largeArc} ${sweep} ${v2.x.toFixed(4)} ${v2.y.toFixed(4)}`;
          } else {
            d += ` L ${v2.x.toFixed(4)} ${v2.y.toFixed(4)}`;
          }
        }
        if (e.closed) d += ' Z';
        return `<path d="${d}"${strokeAttr}/>`;
      }

      case 'text': {
        const fontSize = e.height || 2.5;
        const rot = e.rotation ? (e.rotation * 180 / Math.PI) : 0;
        let anchor = 'start';
        if (e.justification === 'center' || e.justification === 'middle') anchor = 'middle';
        else if (e.justification === 'right') anchor = 'end';
        const transform = rot ? ` transform="rotate(${rot.toFixed(2)} ${e.position.x.toFixed(4)} ${e.position.y.toFixed(4)})"` : '';
        return `<text x="${e.position.x.toFixed(4)}" y="${e.position.y.toFixed(4)}" font-size="${fontSize}" text-anchor="${anchor}" fill="currentColor" stroke="none"${transform}>${this._escapeXml(e.text)}</text>`;
      }

      case 'mtext': {
        const fontSize = e.height || 2.5;
        return `<text x="${e.position.x.toFixed(4)}" y="${e.position.y.toFixed(4)}" font-size="${fontSize}" fill="currentColor" stroke="none">${this._escapeXml(e.text)}</text>`;
      }

      case 'point':
        return `<circle cx="${e.position.x.toFixed(4)}" cy="${e.position.y.toFixed(4)}" r="0.5" fill="currentColor" stroke="none"/>`;

      case 'hatch': {
        if (e.boundary.length < 3) return '';
        const pts = e.boundary.map(p => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join(' ');
        if (e.solid) {
          return `<polygon points="${pts}" fill="currentColor" stroke="none" opacity="0.5"/>`;
        }
        return `<polygon points="${pts}" fill="url(#hatch-${e.pattern})" stroke="currentColor" stroke-width="0.1"/>`;
      }

      case 'spline': {
        if (e.controlPoints.length < 2) return '';
        // Approximate by evaluating points
        const steps = Math.max(32, e.controlPoints.length * 8);
        const maxT = e.controlPoints.length - (e.degree || 3);
        let d = 'M';
        for (let i = 0; i <= steps; i++) {
          const t = (maxT * i) / steps;
          const p = typeof e._evaluatePoint === 'function'
            ? e._evaluatePoint(t)
            : e.controlPoints[Math.min(i, e.controlPoints.length - 1)];
          d += ` ${p.x.toFixed(4)} ${p.y.toFixed(4)}`;
          if (i === 0) d += ' L';
        }
        return `<path d="${d}"${strokeAttr}/>`;
      }

      case 'blockref': {
        // Render block reference as a group with transform
        const block = engine.blockManager
          ? engine.blockManager.getBlock(e.blockName)
          : engine.blocks.get(e.blockName);
        if (!block) return '';
        const sx = e.scale?.x ?? 1, sy = e.scale?.y ?? 1;
        const rot = (e.rotation || 0) * 180 / Math.PI;
        const tx = e.insertPoint?.x ?? 0, ty = e.insertPoint?.y ?? 0;
        let g = `<g transform="translate(${tx.toFixed(4)},${ty.toFixed(4)}) rotate(${rot.toFixed(2)}) scale(${sx},${sy})">`;
        for (const ent of block.entities) {
          const entSvg = this.entityToSvg(ent, engine);
          if (entSvg) g += entSvg;
        }
        g += '</g>';
        return g;
      }

      case 'xline':
      case 'ray':
        // Infinite lines: draw as very long lines clipped to extents
        return '';

      default:
        return '';
    }
  }

  // ── Helpers ──

  static _writeLinetypeDefs(engine) {
    // Define basic hatch patterns as SVG patterns
    return '  <defs>\n' +
      '    <pattern id="hatch-ANSI31" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">\n' +
      '      <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" stroke-width="0.5"/>\n' +
      '    </pattern>\n' +
      '  </defs>\n';
  }

  static _entityStrokeAttr(entity) {
    let attrs = '';
    if (entity.color) {
      const hex = this.colorToHex(entity.color);
      if (hex !== '#ffffff') {
        attrs += ` stroke="${hex}"`;
      }
    }
    if (entity.lineweight && entity.lineweight !== 0.25) {
      attrs += ` stroke-width="${entity.lineweight}"`;
    }
    return attrs;
  }

  static _ellipsePoint(e, t) {
    const a = Math.sqrt(e.majorAxis.x ** 2 + e.majorAxis.y ** 2);
    const b = a * e.ratio;
    const rot = Math.atan2(e.majorAxis.y, e.majorAxis.x);
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const lx = a * Math.cos(t), ly = b * Math.sin(t);
    return {
      x: e.center.x + lx * cosR - ly * sinR,
      y: e.center.y + lx * sinR + ly * cosR,
    };
  }

  /**
   * Convert a color object to hex string.
   * @param {{r:number, g:number, b:number}} color
   * @returns {string}
   */
  static colorToHex(color) {
    if (!color) return '#ffffff';
    const r = (color.r ?? 255).toString(16).padStart(2, '0');
    const g = (color.g ?? 255).toString(16).padStart(2, '0');
    const b = (color.b ?? 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  static _escapeXml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
