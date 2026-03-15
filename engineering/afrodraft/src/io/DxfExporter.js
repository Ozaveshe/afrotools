/**
 * AfroDraft v6 — DXF Exporter
 *
 * Exports the drawing to AutoCAD DXF format (AC1027 / AutoCAD 2013).
 * Produces a complete DXF file with HEADER, TABLES, BLOCKS, and ENTITIES sections.
 */

let _handleCounter = 100;
function nextHandle() {
  return (_handleCounter++).toString(16).toUpperCase();
}

function gc(code, value) {
  // DXF group code line
  return `  ${code}\n${value}\n`;
}

export class DxfExporter {
  /**
   * Export the entire drawing to a DXF string.
   * @param {import('../core/Engine.js').Engine} engine
   * @returns {string}
   */
  static export(engine) {
    _handleCounter = 100;
    let dxf = '';
    dxf += this.writeHeader(engine);
    dxf += this.writeTables(engine);
    dxf += this.writeBlocks(engine);
    dxf += this.writeEntities(engine);
    dxf += gc(0, 'EOF');
    return dxf;
  }

  /**
   * Export and trigger browser download.
   * @param {import('../core/Engine.js').Engine} engine
   * @param {string} [filename='drawing.dxf']
   */
  static exportToFile(engine, filename = 'drawing.dxf') {
    const dxf = this.export(engine);
    const blob = new Blob([dxf], { type: 'application/dxf' });
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

  static writeHeader(engine) {
    let s = '';
    s += gc(0, 'SECTION');
    s += gc(2, 'HEADER');

    // AutoCAD version
    s += gc(9, '$ACADVER');
    s += gc(1, 'AC1027');

    // Insert base
    s += gc(9, '$INSBASE');
    s += gc(10, '0.0'); s += gc(20, '0.0'); s += gc(30, '0.0');

    // Drawing extents
    const ext = engine.getExtents();
    if (ext) {
      s += gc(9, '$EXTMIN');
      s += gc(10, ext.minX.toFixed(6)); s += gc(20, ext.minY.toFixed(6)); s += gc(30, '0.0');
      s += gc(9, '$EXTMAX');
      s += gc(10, ext.maxX.toFixed(6)); s += gc(20, ext.maxY.toFixed(6)); s += gc(30, '0.0');
    }

    // Limits
    s += gc(9, '$LIMMIN');
    s += gc(10, engine.limitsMin.x.toFixed(6)); s += gc(20, engine.limitsMin.y.toFixed(6));
    s += gc(9, '$LIMMAX');
    s += gc(10, engine.limitsMax.x.toFixed(6)); s += gc(20, engine.limitsMax.y.toFixed(6));

    // Units
    s += gc(9, '$INSUNITS');
    const unitMap = { mm: 4, cm: 5, m: 6, inches: 1, feet: 2 };
    s += gc(70, unitMap[engine.units] || 4);

    // Current layer
    s += gc(9, '$CLAYER');
    s += gc(8, engine.currentLayer);

    s += gc(0, 'ENDSEC');
    return s;
  }

  static writeTables(engine) {
    let s = '';
    s += gc(0, 'SECTION');
    s += gc(2, 'TABLES');

    // LTYPE table
    s += this._writeLinetypeTable(engine);
    // LAYER table
    s += this._writeLayerTable(engine);
    // STYLE table
    s += this._writeStyleTable(engine);
    // DIMSTYLE table
    s += this._writeDimStyleTable(engine);

    s += gc(0, 'ENDSEC');
    return s;
  }

  static _writeLinetypeTable(engine) {
    let s = '';
    s += gc(0, 'TABLE');
    s += gc(2, 'LTYPE');
    s += gc(5, nextHandle());
    s += gc(100, 'AcDbSymbolTable');

    const linetypes = engine.styleManager
      ? [...engine.styleManager.linetypes.values()]
      : [...engine.linetypes.values()];

    s += gc(70, linetypes.length);

    for (const lt of linetypes) {
      s += gc(0, 'LTYPE');
      s += gc(5, nextHandle());
      s += gc(100, 'AcDbSymbolTableRecord');
      s += gc(100, 'AcDbLinetypeTableRecord');
      s += gc(2, lt.name);
      s += gc(70, 0);
      s += gc(3, lt.description || '');
      s += gc(72, 65); // Alignment 'A'
      const pattern = lt.pattern || [];
      s += gc(73, pattern.length);
      const totalLen = pattern.reduce((sum, v) => sum + Math.abs(v), 0);
      s += gc(40, totalLen.toFixed(6));
      for (const dash of pattern) {
        s += gc(49, dash.toFixed(6));
        s += gc(74, 0);
      }
    }

    s += gc(0, 'ENDTAB');
    return s;
  }

  static _writeLayerTable(engine) {
    let s = '';
    s += gc(0, 'TABLE');
    s += gc(2, 'LAYER');
    s += gc(5, nextHandle());
    s += gc(100, 'AcDbSymbolTable');

    const layers = engine.layerManager
      ? engine.layerManager.getAllLayers()
      : Object.entries(engine.layers).map(([name, props]) => ({ name, ...props }));

    s += gc(70, layers.length);

    for (const layer of layers) {
      s += gc(0, 'LAYER');
      s += gc(5, nextHandle());
      s += gc(100, 'AcDbSymbolTableRecord');
      s += gc(100, 'AcDbLayerTableRecord');
      s += gc(2, layer.name);
      let flags = 0;
      if (layer.frozen) flags |= 1;
      if (layer.locked) flags |= 4;
      s += gc(70, flags);
      s += gc(62, layer.visible ? (layer.color?.index || 7) : -(layer.color?.index || 7));
      s += gc(6, layer.linetype || 'Continuous');
      // Lineweight in 100ths of mm
      s += gc(370, Math.round((layer.lineweight || 0.25) * 100));
      s += gc(390, layer.plot === false ? '0' : 'F');
    }

    s += gc(0, 'ENDTAB');
    return s;
  }

  static _writeStyleTable(engine) {
    let s = '';
    s += gc(0, 'TABLE');
    s += gc(2, 'STYLE');
    s += gc(5, nextHandle());
    s += gc(100, 'AcDbSymbolTable');

    const styles = engine.styleManager
      ? [...engine.styleManager.textStyles.values()]
      : [...engine.textStyles.values()];

    s += gc(70, styles.length);

    for (const style of styles) {
      s += gc(0, 'STYLE');
      s += gc(5, nextHandle());
      s += gc(100, 'AcDbSymbolTableRecord');
      s += gc(100, 'AcDbTextStyleTableRecord');
      s += gc(2, style.name);
      s += gc(70, 0);
      s += gc(40, style.height || 0);
      s += gc(41, style.widthFactor || 1.0);
      s += gc(50, style.oblique || 0);
      s += gc(3, style.font || style.fontFamily || 'Arial');
    }

    s += gc(0, 'ENDTAB');
    return s;
  }

  static _writeDimStyleTable(engine) {
    let s = '';
    s += gc(0, 'TABLE');
    s += gc(2, 'DIMSTYLE');
    s += gc(5, nextHandle());
    s += gc(100, 'AcDbSymbolTable');

    const dimStyles = engine.styleManager
      ? [...engine.styleManager.dimStyles.values()]
      : [...engine.dimStyles.values()];

    s += gc(70, dimStyles.length);

    for (const ds of dimStyles) {
      s += gc(0, 'DIMSTYLE');
      s += gc(5, nextHandle());
      s += gc(100, 'AcDbSymbolTableRecord');
      s += gc(100, 'AcDbDimStyleTableRecord');
      s += gc(2, ds.name);
      s += gc(70, 0);
      s += gc(41, ds.arrowSize || 2.5);      // DIMASZ
      s += gc(42, ds.extensionOffset || 1.25); // DIMEXO
      s += gc(44, ds.extensionOvershoot || 1.25); // DIMEXE
      s += gc(140, ds.textHeight || 2.5);     // DIMTXT
      s += gc(147, ds.dimLineGap || 0.625);   // DIMGAP
      s += gc(271, ds.precision || 2);         // DIMDEC
      s += gc(340, ds.textStyle || 'Standard');
    }

    s += gc(0, 'ENDTAB');
    return s;
  }

  static writeBlocks(engine) {
    let s = '';
    s += gc(0, 'SECTION');
    s += gc(2, 'BLOCKS');

    // *MODEL_SPACE
    s += gc(0, 'BLOCK');
    s += gc(5, nextHandle());
    s += gc(100, 'AcDbEntity');
    s += gc(8, '0');
    s += gc(100, 'AcDbBlockBegin');
    s += gc(2, '*MODEL_SPACE');
    s += gc(70, 0);
    s += gc(10, '0.0'); s += gc(20, '0.0'); s += gc(30, '0.0');
    s += gc(0, 'ENDBLK');
    s += gc(5, nextHandle());
    s += gc(100, 'AcDbEntity');
    s += gc(8, '0');
    s += gc(100, 'AcDbBlockEnd');

    // *PAPER_SPACE
    s += gc(0, 'BLOCK');
    s += gc(5, nextHandle());
    s += gc(100, 'AcDbEntity');
    s += gc(8, '0');
    s += gc(100, 'AcDbBlockBegin');
    s += gc(2, '*PAPER_SPACE');
    s += gc(70, 0);
    s += gc(10, '0.0'); s += gc(20, '0.0'); s += gc(30, '0.0');
    s += gc(0, 'ENDBLK');
    s += gc(5, nextHandle());
    s += gc(100, 'AcDbEntity');
    s += gc(8, '0');
    s += gc(100, 'AcDbBlockEnd');

    // User-defined blocks
    const blocks = engine.blockManager
      ? engine.blockManager.blocks
      : engine.blocks;

    for (const [name, block] of blocks) {
      const bp = block.basePoint || block.origin || { x: 0, y: 0 };
      s += gc(0, 'BLOCK');
      s += gc(5, nextHandle());
      s += gc(100, 'AcDbEntity');
      s += gc(8, '0');
      s += gc(100, 'AcDbBlockBegin');
      s += gc(2, name);
      s += gc(70, 0);
      s += gc(10, bp.x.toFixed(6)); s += gc(20, bp.y.toFixed(6)); s += gc(30, '0.0');

      // Write block entities
      for (const ent of block.entities) {
        s += this.writeDxfEntity(ent);
      }

      s += gc(0, 'ENDBLK');
      s += gc(5, nextHandle());
      s += gc(100, 'AcDbEntity');
      s += gc(8, '0');
      s += gc(100, 'AcDbBlockEnd');
    }

    s += gc(0, 'ENDSEC');
    return s;
  }

  static writeEntities(engine) {
    let s = '';
    s += gc(0, 'SECTION');
    s += gc(2, 'ENTITIES');

    for (const entity of engine.entities.values()) {
      s += this.writeDxfEntity(entity);
    }

    s += gc(0, 'ENDSEC');
    return s;
  }

  /**
   * Convert a single entity to DXF group codes.
   * @param {Object} entity
   * @returns {string}
   */
  static writeDxfEntity(entity) {
    // Use serialized form if entity is a plain object
    const e = typeof entity.serialize === 'function' ? entity : entity;
    const type = e.type;

    let s = '';
    const handle = nextHandle();

    // Common entity header
    const writeHeader = (dxfType) => {
      let h = '';
      h += gc(0, dxfType);
      h += gc(5, handle);
      h += gc(100, 'AcDbEntity');
      h += gc(8, e.layer || 'Layer 0');
      if (e.color && e.color.index != null && e.color.index !== 7) {
        h += gc(62, e.color.index);
      }
      if (e.linetype && e.linetype !== 'Continuous') {
        h += gc(6, e.linetype);
      }
      if (e.lineweight && e.lineweight !== 0.25) {
        h += gc(370, Math.round(e.lineweight * 100));
      }
      return h;
    };

    switch (type) {
      case 'line':
        s += writeHeader('LINE');
        s += gc(100, 'AcDbLine');
        s += gc(10, (e.start?.x ?? 0).toFixed(6));
        s += gc(20, (e.start?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        s += gc(11, (e.end?.x ?? 0).toFixed(6));
        s += gc(21, (e.end?.y ?? 0).toFixed(6));
        s += gc(31, '0.0');
        break;

      case 'circle':
        s += writeHeader('CIRCLE');
        s += gc(100, 'AcDbCircle');
        s += gc(10, (e.center?.x ?? 0).toFixed(6));
        s += gc(20, (e.center?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        s += gc(40, (e.radius ?? 0).toFixed(6));
        break;

      case 'arc':
        s += writeHeader('ARC');
        s += gc(100, 'AcDbCircle');
        s += gc(10, (e.center?.x ?? 0).toFixed(6));
        s += gc(20, (e.center?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        s += gc(40, (e.radius ?? 0).toFixed(6));
        s += gc(100, 'AcDbArc');
        s += gc(50, ((e.startAngle ?? 0) * 180 / Math.PI).toFixed(6));
        s += gc(51, ((e.endAngle ?? Math.PI) * 180 / Math.PI).toFixed(6));
        break;

      case 'ellipse':
        s += writeHeader('ELLIPSE');
        s += gc(100, 'AcDbEllipse');
        s += gc(10, (e.center?.x ?? 0).toFixed(6));
        s += gc(20, (e.center?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        s += gc(11, (e.majorAxis?.x ?? 10).toFixed(6));
        s += gc(21, (e.majorAxis?.y ?? 0).toFixed(6));
        s += gc(31, '0.0');
        s += gc(40, (e.ratio ?? 0.5).toFixed(6));
        s += gc(41, (e.startAngle ?? 0).toFixed(6));
        s += gc(42, (e.endAngle ?? Math.PI * 2).toFixed(6));
        break;

      case 'polyline': {
        s += writeHeader('LWPOLYLINE');
        s += gc(100, 'AcDbPolyline');
        const verts = e.vertices || [];
        s += gc(90, verts.length);
        s += gc(70, e.closed ? 1 : 0);
        if (e.width) {
          s += gc(43, e.width.toFixed(6));
        }
        for (const v of verts) {
          s += gc(10, (v.x ?? 0).toFixed(6));
          s += gc(20, (v.y ?? 0).toFixed(6));
          if (v.bulge) {
            s += gc(42, v.bulge.toFixed(6));
          }
        }
        break;
      }

      case 'text':
        s += writeHeader('TEXT');
        s += gc(100, 'AcDbText');
        s += gc(10, (e.position?.x ?? 0).toFixed(6));
        s += gc(20, (e.position?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        s += gc(40, (e.height ?? 2.5).toFixed(6));
        s += gc(1, e.text || '');
        if (e.rotation) s += gc(50, (e.rotation * 180 / Math.PI).toFixed(6));
        if (e.style && e.style !== 'Standard') s += gc(7, e.style);
        if (e.widthFactor && e.widthFactor !== 1.0) s += gc(41, e.widthFactor.toFixed(6));
        if (e.oblique) s += gc(51, (e.oblique * 180 / Math.PI).toFixed(6));
        // Justification
        const justMap = { left: 0, center: 1, right: 2, middle: 1 };
        s += gc(72, justMap[e.justification] ?? 0);
        s += gc(100, 'AcDbText');
        break;

      case 'mtext':
        s += writeHeader('MTEXT');
        s += gc(100, 'AcDbMText');
        s += gc(10, (e.position?.x ?? 0).toFixed(6));
        s += gc(20, (e.position?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        s += gc(40, (e.height ?? 2.5).toFixed(6));
        s += gc(41, (e.width ?? 100).toFixed(6));
        s += gc(71, 1); // attachment point
        s += gc(1, e.text || '');
        if (e.style && e.style !== 'Standard') s += gc(7, e.style);
        if (e.rotation) s += gc(50, (e.rotation * 180 / Math.PI).toFixed(6));
        break;

      case 'dimension':
        s += writeHeader('DIMENSION');
        s += gc(100, 'AcDbDimension');
        // Write definition points
        if (e.defPoints && e.defPoints.length > 0) {
          s += gc(10, e.defPoints[0].x.toFixed(6));
          s += gc(20, e.defPoints[0].y.toFixed(6));
          s += gc(30, '0.0');
        }
        if (e.textPosition) {
          s += gc(11, e.textPosition.x.toFixed(6));
          s += gc(21, e.textPosition.y.toFixed(6));
          s += gc(31, '0.0');
        }
        if (e.text) s += gc(1, e.text);
        // Dim type
        const dimTypeMap = { linear: 0, aligned: 1, angular: 2, radius: 4, diameter: 3, ordinate: 6 };
        s += gc(70, dimTypeMap[e.dimType] ?? 0);
        if (e.style) s += gc(3, e.style);
        if (e.rotation) s += gc(50, (e.rotation * 180 / Math.PI).toFixed(6));
        // Additional def points
        if (e.defPoints) {
          if (e.defPoints.length > 1) {
            s += gc(100, 'AcDbAlignedDimension');
            s += gc(13, e.defPoints[1].x.toFixed(6));
            s += gc(23, e.defPoints[1].y.toFixed(6));
            s += gc(33, '0.0');
          }
          if (e.defPoints.length > 2) {
            s += gc(14, e.defPoints[2].x.toFixed(6));
            s += gc(24, e.defPoints[2].y.toFixed(6));
            s += gc(34, '0.0');
          }
        }
        break;

      case 'hatch': {
        s += writeHeader('HATCH');
        s += gc(100, 'AcDbHatch');
        s += gc(10, '0.0'); s += gc(20, '0.0'); s += gc(30, '0.0');
        // Normal
        s += gc(210, '0.0'); s += gc(220, '0.0'); s += gc(230, '1.0');
        s += gc(2, e.pattern || 'ANSI31');
        s += gc(70, e.solid ? 1 : 0);
        s += gc(71, 0); // associative
        // Boundary loops
        s += gc(91, 1); // number of loops
        s += gc(92, 1); // polyline boundary
        s += gc(72, 0); // has bulge
        s += gc(73, 1); // closed
        const boundary = e.boundary || [];
        s += gc(93, boundary.length);
        for (const p of boundary) {
          s += gc(10, (p.x ?? 0).toFixed(6));
          s += gc(20, (p.y ?? 0).toFixed(6));
        }
        s += gc(97, 0); // source boundary objects
        // Pattern data
        s += gc(75, 0); // hatch style
        s += gc(76, 1); // pattern type (predefined)
        if (!e.solid) {
          s += gc(52, ((e.angle ?? 0) * 180 / Math.PI).toFixed(6));
          s += gc(41, (e.scale ?? 1).toFixed(6));
        }
        break;
      }

      case 'blockref':
        s += writeHeader('INSERT');
        s += gc(100, 'AcDbBlockReference');
        s += gc(2, e.blockName || '');
        s += gc(10, (e.insertPoint?.x ?? 0).toFixed(6));
        s += gc(20, (e.insertPoint?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        if (e.scale) {
          s += gc(41, (e.scale.x ?? 1).toFixed(6));
          s += gc(42, (e.scale.y ?? 1).toFixed(6));
          s += gc(43, '1.0');
        }
        if (e.rotation) s += gc(50, (e.rotation * 180 / Math.PI).toFixed(6));
        break;

      case 'point':
        s += writeHeader('POINT');
        s += gc(100, 'AcDbPoint');
        s += gc(10, (e.position?.x ?? 0).toFixed(6));
        s += gc(20, (e.position?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        break;

      case 'spline': {
        s += writeHeader('SPLINE');
        s += gc(100, 'AcDbSpline');
        s += gc(70, e.closed ? 1 : 0);
        s += gc(71, e.degree ?? 3);
        const knots = e.knots || [];
        const cps = e.controlPoints || [];
        const fps = e.fitPoints || [];
        s += gc(72, knots.length);
        s += gc(73, cps.length);
        s += gc(74, fps.length);
        for (const k of knots) {
          s += gc(40, k.toFixed(6));
        }
        for (const cp of cps) {
          s += gc(10, (cp.x ?? 0).toFixed(6));
          s += gc(20, (cp.y ?? 0).toFixed(6));
          s += gc(30, '0.0');
        }
        for (const fp of fps) {
          s += gc(11, (fp.x ?? 0).toFixed(6));
          s += gc(21, (fp.y ?? 0).toFixed(6));
          s += gc(31, '0.0');
        }
        break;
      }

      case 'xline':
        s += writeHeader('XLINE');
        s += gc(100, 'AcDbXline');
        s += gc(10, (e.point?.x ?? 0).toFixed(6));
        s += gc(20, (e.point?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        s += gc(11, (e.direction?.x ?? 1).toFixed(6));
        s += gc(21, (e.direction?.y ?? 0).toFixed(6));
        s += gc(31, '0.0');
        break;

      case 'ray':
        s += writeHeader('RAY');
        s += gc(100, 'AcDbRay');
        s += gc(10, (e.point?.x ?? 0).toFixed(6));
        s += gc(20, (e.point?.y ?? 0).toFixed(6));
        s += gc(30, '0.0');
        s += gc(11, (e.direction?.x ?? 1).toFixed(6));
        s += gc(21, (e.direction?.y ?? 0).toFixed(6));
        s += gc(31, '0.0');
        break;

      default:
        // Skip unsupported entity types
        break;
    }

    return s;
  }
}
