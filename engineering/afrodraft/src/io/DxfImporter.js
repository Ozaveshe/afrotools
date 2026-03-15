/**
 * AfroDraft v6 — DXF Importer
 *
 * Imports DXF files (AutoCAD 2000+) into the engine.
 * Parses HEADER, TABLES (layers, linetypes, styles), and ENTITIES sections.
 */

import {
  LineEntity, PolylineEntity, CircleEntity, ArcEntity,
  EllipseEntity, PointEntity, TextEntity, MTextEntity,
  DimensionEntity, HatchEntity, BlockRefEntity, SplineEntity,
  ConstructionLineEntity, RayEntity,
} from '../core/Entity.js';

const DEG = Math.PI / 180;

export class DxfImporter {
  /**
   * Import a DXF file into the engine.
   * @param {string} fileContent — raw DXF text
   * @param {import('../core/Engine.js').Engine} engine
   */
  static async import(fileContent, engine) {
    const groups = this.parseGroupCodes(fileContent);
    const sections = this.parseSections(groups);

    // Import layers
    if (sections.tables) {
      this.importLayers(sections.tables, engine);
      this.importLinetypes(sections.tables, engine);
      this.importStyles(sections.tables, engine);
    }

    // Import block definitions
    if (sections.blocks) {
      this.importBlocks(sections.blocks, engine);
    }

    // Import entities
    if (sections.entities) {
      this.importEntities(sections.entities, engine);
    }

    engine.rebuildSpatialIndex();
    engine.emit('drawing-loaded', {});
  }

  /**
   * Import from a File object (browser).
   * @param {File} file
   * @param {import('../core/Engine.js').Engine} engine
   */
  static async importFile(file, engine) {
    const text = await file.text();
    return this.import(text, engine);
  }

  /**
   * Open a file picker and import.
   * @param {import('../core/Engine.js').Engine} engine
   * @returns {Promise<string>} filename
   */
  static async openAndImport(engine) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.dxf';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', async () => {
        const file = input.files[0];
        document.body.removeChild(input);
        if (!file) { reject(new Error('No file selected')); return; }
        try {
          await DxfImporter.importFile(file, engine);
          resolve(file.name);
        } catch (err) {
          reject(err);
        }
      });
      input.click();
    });
  }

  // ── Parsing ──

  /**
   * Parse DXF text into group code pairs.
   * @param {string} text
   * @returns {{code: number, value: string}[]}
   */
  static parseGroupCodes(text) {
    const lines = text.split(/\r?\n/);
    const groups = [];
    for (let i = 0; i < lines.length - 1; i += 2) {
      const code = parseInt(lines[i].trim(), 10);
      const value = lines[i + 1] != null ? lines[i + 1].trim() : '';
      if (!isNaN(code)) {
        groups.push({ code, value });
      }
    }
    return groups;
  }

  /**
   * Split group codes into named sections.
   * @param {{code: number, value: string}[]} groups
   * @returns {Object}
   */
  static parseSections(groups) {
    const sections = {};
    let currentSection = null;
    let sectionGroups = [];

    for (const g of groups) {
      if (g.code === 0 && g.value === 'SECTION') {
        sectionGroups = [];
        continue;
      }
      if (g.code === 2 && sectionGroups.length === 0 && currentSection === null) {
        currentSection = g.value.toLowerCase();
        sectionGroups = [];
        continue;
      }
      if (g.code === 0 && g.value === 'ENDSEC') {
        if (currentSection) {
          sections[currentSection] = sectionGroups;
        }
        currentSection = null;
        sectionGroups = [];
        continue;
      }
      if (currentSection) {
        sectionGroups.push(g);
      }
    }

    return sections;
  }

  // ── Layer Import ──

  static importLayers(tableGroups, engine) {
    const entities = this._splitByEntityType(tableGroups, 'LAYER');
    for (const layerGroups of entities) {
      const name = this._findValue(layerGroups, 2) || 'Layer 0';
      const colorIndex = parseInt(this._findValue(layerGroups, 62) || '7', 10);
      const linetype = this._findValue(layerGroups, 6) || 'Continuous';
      const flags = parseInt(this._findValue(layerGroups, 70) || '0', 10);
      const lineweightRaw = parseInt(this._findValue(layerGroups, 370) || '25', 10);

      const visible = colorIndex >= 0;
      const frozen = !!(flags & 1);
      const locked = !!(flags & 4);
      const absColor = Math.abs(colorIndex);

      const color = this._indexToColor(absColor);

      if (engine.layerManager) {
        engine.layerManager.addLayer({
          name, color, linetype,
          lineweight: lineweightRaw / 100,
          visible, frozen, locked, plot: true,
        });
      } else {
        engine.addLayer(name, {
          color, linetype,
          lineweight: lineweightRaw / 100,
          visible, frozen, locked, plot: true,
        });
      }
    }
  }

  static importLinetypes(tableGroups, engine) {
    const entities = this._splitByEntityType(tableGroups, 'LTYPE');
    for (const ltGroups of entities) {
      const name = this._findValue(ltGroups, 2);
      if (!name) continue;
      const desc = this._findValue(ltGroups, 3) || '';
      const pattern = [];
      for (const g of ltGroups) {
        if (g.code === 49) {
          pattern.push(parseFloat(g.value));
        }
      }
      if (engine.styleManager) {
        engine.styleManager.addLinetype(name, desc, pattern);
      } else if (!engine.linetypes.has(name)) {
        engine.linetypes.set(name, { name, description: desc, pattern });
      }
    }
  }

  static importStyles(tableGroups, engine) {
    const entities = this._splitByEntityType(tableGroups, 'STYLE');
    for (const styleGroups of entities) {
      const name = this._findValue(styleGroups, 2);
      if (!name) continue;
      const font = this._findValue(styleGroups, 3) || 'Arial';
      const height = parseFloat(this._findValue(styleGroups, 40) || '0');
      const widthFactor = parseFloat(this._findValue(styleGroups, 41) || '1');
      const oblique = parseFloat(this._findValue(styleGroups, 50) || '0');

      if (engine.styleManager) {
        engine.styleManager.addTextStyle({ name, font, height, widthFactor, oblique });
      } else if (!engine.textStyles.has(name)) {
        engine.textStyles.set(name, { name, fontFamily: font, height, widthFactor, oblique });
      }
    }
  }

  // ── Block Import ──

  static importBlocks(blockGroups, engine) {
    let currentBlock = null;
    let blockEntities = [];
    let basePoint = { x: 0, y: 0 };

    for (let i = 0; i < blockGroups.length; i++) {
      const g = blockGroups[i];
      if (g.code === 0 && g.value === 'BLOCK') {
        currentBlock = null;
        blockEntities = [];
        basePoint = { x: 0, y: 0 };
        continue;
      }
      if (g.code === 2 && currentBlock === null) {
        currentBlock = g.value;
        continue;
      }
      if (currentBlock && g.code === 10) {
        basePoint.x = parseFloat(g.value);
      }
      if (currentBlock && g.code === 20) {
        basePoint.y = parseFloat(g.value);
      }
      if (g.code === 0 && g.value === 'ENDBLK') {
        if (currentBlock && !currentBlock.startsWith('*')) {
          if (engine.blockManager) {
            engine.blockManager.blocks.set(currentBlock, {
              name: currentBlock,
              basePoint: { ...basePoint },
              entities: blockEntities,
              attributes: [],
            });
          } else {
            engine.blocks.set(currentBlock, {
              origin: { ...basePoint },
              entities: blockEntities,
            });
          }
        }
        currentBlock = null;
        blockEntities = [];
        continue;
      }
      // Collect entity groups within block
      if (currentBlock && g.code === 0) {
        // Start of an entity inside the block - parse it
        const entGroups = [g];
        let j = i + 1;
        while (j < blockGroups.length && !(blockGroups[j].code === 0)) {
          entGroups.push(blockGroups[j]);
          j++;
        }
        const entity = this._parseEntity(g.value, entGroups);
        if (entity) blockEntities.push(entity);
        i = j - 1;
      }
    }
  }

  // ── Entity Import ──

  static importEntities(entityGroups, engine) {
    let i = 0;
    while (i < entityGroups.length) {
      const g = entityGroups[i];
      if (g.code === 0) {
        const entityType = g.value;
        const entGroups = [g];
        i++;
        while (i < entityGroups.length && entityGroups[i].code !== 0) {
          entGroups.push(entityGroups[i]);
          i++;
        }
        const entity = this._parseEntity(entityType, entGroups);
        if (entity) {
          engine.addEntity(entity);
        }
      } else {
        i++;
      }
    }
  }

  // ── Entity Parsers ──

  static _parseEntity(type, groups) {
    // Common properties
    const layer = this._findValue(groups, 8) || 'Layer 0';
    const colorIndex = parseInt(this._findValue(groups, 62) || '7', 10);
    const linetype = this._findValue(groups, 6) || 'Continuous';
    const lineweightRaw = parseInt(this._findValue(groups, 370) || '25', 10);
    const color = this._indexToColor(Math.abs(colorIndex));
    const baseProps = { layer, color, linetype, lineweight: lineweightRaw / 100 };

    switch (type) {
      case 'LINE': {
        const x1 = parseFloat(this._findValue(groups, 10) || '0');
        const y1 = parseFloat(this._findValue(groups, 20) || '0');
        const x2 = parseFloat(this._findValue(groups, 11) || '0');
        const y2 = parseFloat(this._findValue(groups, 21) || '0');
        return new LineEntity({ ...baseProps, start: { x: x1, y: y1 }, end: { x: x2, y: y2 } });
      }

      case 'CIRCLE': {
        const cx = parseFloat(this._findValue(groups, 10) || '0');
        const cy = parseFloat(this._findValue(groups, 20) || '0');
        const r = parseFloat(this._findValue(groups, 40) || '0');
        return new CircleEntity({ ...baseProps, center: { x: cx, y: cy }, radius: r });
      }

      case 'ARC': {
        const cx = parseFloat(this._findValue(groups, 10) || '0');
        const cy = parseFloat(this._findValue(groups, 20) || '0');
        const r = parseFloat(this._findValue(groups, 40) || '0');
        const sa = parseFloat(this._findValue(groups, 50) || '0') * DEG;
        const ea = parseFloat(this._findValue(groups, 51) || '180') * DEG;
        return new ArcEntity({ ...baseProps, center: { x: cx, y: cy }, radius: r, startAngle: sa, endAngle: ea });
      }

      case 'ELLIPSE': {
        const cx = parseFloat(this._findValue(groups, 10) || '0');
        const cy = parseFloat(this._findValue(groups, 20) || '0');
        const mx = parseFloat(this._findValue(groups, 11) || '10');
        const my = parseFloat(this._findValue(groups, 21) || '0');
        const ratio = parseFloat(this._findValue(groups, 40) || '0.5');
        const sa = parseFloat(this._findValue(groups, 41) || '0');
        const ea = parseFloat(this._findValue(groups, 42) || String(Math.PI * 2));
        return new EllipseEntity({ ...baseProps, center: { x: cx, y: cy }, majorAxis: { x: mx, y: my }, ratio, startAngle: sa, endAngle: ea });
      }

      case 'LWPOLYLINE': {
        const verts = [];
        const closed = (parseInt(this._findValue(groups, 70) || '0', 10) & 1) !== 0;
        const width = parseFloat(this._findValue(groups, 43) || '0');
        let vx = 0, vy = 0, bulge = 0;
        let hasX = false;
        for (const g of groups) {
          if (g.code === 10) {
            if (hasX) verts.push({ x: vx, y: vy, bulge });
            vx = parseFloat(g.value);
            vy = 0; bulge = 0; hasX = true;
          } else if (g.code === 20 && hasX) {
            vy = parseFloat(g.value);
          } else if (g.code === 42 && hasX) {
            bulge = parseFloat(g.value);
          }
        }
        if (hasX) verts.push({ x: vx, y: vy, bulge });
        return new PolylineEntity({ ...baseProps, vertices: verts, closed, width });
      }

      case 'POLYLINE': {
        // 2D polyline (legacy format) — vertices follow as separate entities
        // This is handled specially if the caller collects VERTEX entities
        const closed = (parseInt(this._findValue(groups, 70) || '0', 10) & 1) !== 0;
        return new PolylineEntity({ ...baseProps, vertices: [], closed });
      }

      case 'TEXT': {
        const px = parseFloat(this._findValue(groups, 10) || '0');
        const py = parseFloat(this._findValue(groups, 20) || '0');
        const height = parseFloat(this._findValue(groups, 40) || '2.5');
        const text = this._findValue(groups, 1) || '';
        const rotDeg = parseFloat(this._findValue(groups, 50) || '0');
        const style = this._findValue(groups, 7) || 'Standard';
        const wf = parseFloat(this._findValue(groups, 41) || '1');
        const just = parseInt(this._findValue(groups, 72) || '0', 10);
        const justMap = { 0: 'left', 1: 'center', 2: 'right' };
        return new TextEntity({ ...baseProps, position: { x: px, y: py }, text, height, rotation: rotDeg * DEG, style, widthFactor: wf, justification: justMap[just] || 'left' });
      }

      case 'MTEXT': {
        const px = parseFloat(this._findValue(groups, 10) || '0');
        const py = parseFloat(this._findValue(groups, 20) || '0');
        const height = parseFloat(this._findValue(groups, 40) || '2.5');
        const width = parseFloat(this._findValue(groups, 41) || '100');
        const text = this._findValue(groups, 1) || '';
        const style = this._findValue(groups, 7) || 'Standard';
        const rotDeg = parseFloat(this._findValue(groups, 50) || '0');
        return new MTextEntity({ ...baseProps, position: { x: px, y: py }, text, height, width, style, rotation: rotDeg * DEG });
      }

      case 'DIMENSION': {
        const dimType = parseInt(this._findValue(groups, 70) || '0', 10) & 0x0F;
        const typeMap = { 0: 'linear', 1: 'aligned', 2: 'angular', 3: 'diameter', 4: 'radius', 6: 'ordinate' };
        const defPoints = [];
        // Collect definition points from various group codes
        const p10x = parseFloat(this._findValue(groups, 10) || '0');
        const p10y = parseFloat(this._findValue(groups, 20) || '0');
        defPoints.push({ x: p10x, y: p10y });
        const p13x = this._findValue(groups, 13);
        const p13y = this._findValue(groups, 23);
        if (p13x != null) defPoints.push({ x: parseFloat(p13x), y: parseFloat(p13y || '0') });
        const p14x = this._findValue(groups, 14);
        const p14y = this._findValue(groups, 24);
        if (p14x != null) defPoints.push({ x: parseFloat(p14x), y: parseFloat(p14y || '0') });
        const text = this._findValue(groups, 1) || '';
        const style = this._findValue(groups, 3) || 'Standard';
        const rotDeg = parseFloat(this._findValue(groups, 50) || '0');
        const tpx = this._findValue(groups, 11);
        const tpy = this._findValue(groups, 21);
        const textPosition = tpx != null ? { x: parseFloat(tpx), y: parseFloat(tpy || '0') } : null;
        return new DimensionEntity({ ...baseProps, dimType: typeMap[dimType] || 'linear', defPoints, text, textPosition, style, rotation: rotDeg * DEG });
      }

      case 'HATCH': {
        const pattern = this._findValue(groups, 2) || 'ANSI31';
        const solid = this._findValue(groups, 70) === '1';
        const scale = parseFloat(this._findValue(groups, 41) || '1');
        const angleDeg = parseFloat(this._findValue(groups, 52) || '0');
        const boundary = [];
        // Collect boundary vertices (simplified: assumes polyline boundary)
        let collectingBoundary = false;
        for (let i = 0; i < groups.length; i++) {
          if (groups[i].code === 92) collectingBoundary = true;
          if (collectingBoundary && groups[i].code === 10) {
            const bx = parseFloat(groups[i].value);
            const byGroup = groups[i + 1];
            const by = byGroup && byGroup.code === 20 ? parseFloat(byGroup.value) : 0;
            boundary.push({ x: bx, y: by });
          }
          if (groups[i].code === 97) collectingBoundary = false;
        }
        return new HatchEntity({ ...baseProps, boundary, pattern, scale, angle: angleDeg * DEG, solid });
      }

      case 'INSERT': {
        const blockName = this._findValue(groups, 2) || '';
        const ix = parseFloat(this._findValue(groups, 10) || '0');
        const iy = parseFloat(this._findValue(groups, 20) || '0');
        const sx = parseFloat(this._findValue(groups, 41) || '1');
        const sy = parseFloat(this._findValue(groups, 42) || '1');
        const rotDeg = parseFloat(this._findValue(groups, 50) || '0');
        return new BlockRefEntity({ ...baseProps, blockName, insertPoint: { x: ix, y: iy }, scale: { x: sx, y: sy }, rotation: rotDeg * DEG });
      }

      case 'POINT': {
        const px = parseFloat(this._findValue(groups, 10) || '0');
        const py = parseFloat(this._findValue(groups, 20) || '0');
        return new PointEntity({ ...baseProps, position: { x: px, y: py } });
      }

      case 'SPLINE': {
        const degree = parseInt(this._findValue(groups, 71) || '3', 10);
        const closed = (parseInt(this._findValue(groups, 70) || '0', 10) & 1) !== 0;
        const knots = [];
        const controlPoints = [];
        const fitPoints = [];
        for (const g of groups) {
          if (g.code === 40) knots.push(parseFloat(g.value));
        }
        // Control points (code 10/20) and fit points (code 11/21)
        let cpx = null, fpx = null;
        for (const g of groups) {
          if (g.code === 10) { cpx = parseFloat(g.value); }
          else if (g.code === 20 && cpx !== null) {
            controlPoints.push({ x: cpx, y: parseFloat(g.value) });
            cpx = null;
          }
          else if (g.code === 11) { fpx = parseFloat(g.value); }
          else if (g.code === 21 && fpx !== null) {
            fitPoints.push({ x: fpx, y: parseFloat(g.value) });
            fpx = null;
          }
        }
        return new SplineEntity({ ...baseProps, controlPoints, degree, knots, fitPoints, closed });
      }

      case 'XLINE': {
        const px = parseFloat(this._findValue(groups, 10) || '0');
        const py = parseFloat(this._findValue(groups, 20) || '0');
        const dx = parseFloat(this._findValue(groups, 11) || '1');
        const dy = parseFloat(this._findValue(groups, 21) || '0');
        return new ConstructionLineEntity({ ...baseProps, point: { x: px, y: py }, direction: { x: dx, y: dy } });
      }

      case 'RAY': {
        const px = parseFloat(this._findValue(groups, 10) || '0');
        const py = parseFloat(this._findValue(groups, 20) || '0');
        const dx = parseFloat(this._findValue(groups, 11) || '1');
        const dy = parseFloat(this._findValue(groups, 21) || '0');
        return new RayEntity({ ...baseProps, point: { x: px, y: py }, direction: { x: dx, y: dy } });
      }

      case 'LEADER': {
        // Import as a polyline for now
        const verts = [];
        let lx = null;
        for (const g of groups) {
          if (g.code === 10) { lx = parseFloat(g.value); }
          else if (g.code === 20 && lx !== null) {
            verts.push({ x: lx, y: parseFloat(g.value), bulge: 0 });
            lx = null;
          }
        }
        return new PolylineEntity({ ...baseProps, vertices: verts, closed: false });
      }

      default:
        return null;
    }
  }

  // ── Helpers ──

  static _findValue(groups, code) {
    for (const g of groups) {
      if (g.code === code) return g.value;
    }
    return null;
  }

  static _splitByEntityType(groups, typeName) {
    const result = [];
    let current = null;
    for (const g of groups) {
      if (g.code === 0 && g.value === typeName) {
        if (current) result.push(current);
        current = [g];
      } else if (g.code === 0 && current) {
        result.push(current);
        current = null;
      } else if (current) {
        current.push(g);
      }
    }
    if (current) result.push(current);
    return result;
  }

  /**
   * Convert AutoCAD color index to RGB.
   * @param {number} index — ACI (1-255)
   * @returns {{r:number, g:number, b:number, index:number}}
   */
  static _indexToColor(index) {
    // Standard ACI colors (simplified)
    const aciColors = {
      1: { r: 255, g: 0, b: 0 },       // Red
      2: { r: 255, g: 255, b: 0 },     // Yellow
      3: { r: 0, g: 255, b: 0 },       // Green
      4: { r: 0, g: 255, b: 255 },     // Cyan
      5: { r: 0, g: 0, b: 255 },       // Blue
      6: { r: 255, g: 0, b: 255 },     // Magenta
      7: { r: 255, g: 255, b: 255 },   // White/Black
      8: { r: 128, g: 128, b: 128 },   // Gray
      9: { r: 192, g: 192, b: 192 },   // Light gray
    };
    const c = aciColors[index] || { r: 255, g: 255, b: 255 };
    return { ...c, index };
  }
}
