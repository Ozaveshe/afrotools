/**
 * AfroDraft v6 - Renderer
 * Draws ALL entity types on an HTML5 Canvas via the Viewport transform.
 */

// ---------------------------------------------------------------------------
// Theme palettes
// ---------------------------------------------------------------------------
const THEMES = {
  dark: {
    background: '#1E1E1E',
    gridMinor: 'rgba(255,255,255,0.06)',
    gridMajor: 'rgba(255,255,255,0.14)',
    defaultEntity: '#CCCCCC',
    selection: '#60A5FA',
    grip: '#60A5FA',
    dimText: '#BBBBBB',
    dimLine: '#888888',
  },
  light: {
    background: '#FFFFFF',
    gridMinor: 'rgba(0,0,0,0.06)',
    gridMajor: 'rgba(0,0,0,0.14)',
    defaultEntity: '#000000',
    selection: '#2563EB',
    grip: '#2563EB',
    dimText: '#333333',
    dimLine: '#666666',
  },
  blueprint: {
    background: '#002244',
    gridMinor: 'rgba(255,255,255,0.05)',
    gridMajor: 'rgba(255,255,255,0.12)',
    defaultEntity: '#E0E0FF',
    selection: '#FFD700',
    grip: '#FFD700',
    dimText: '#CCCCEE',
    dimLine: '#8888AA',
  },
  highcontrast: {
    background: '#000000',
    gridMinor: 'rgba(255,255,255,0.08)',
    gridMajor: 'rgba(255,255,255,0.20)',
    defaultEntity: '#FFFFFF',
    selection: '#FF4444',
    grip: '#FF4444',
    dimText: '#FFFFFF',
    dimLine: '#AAAAAA',
  },
};

// ---------------------------------------------------------------------------
// Linetype dash patterns (screen pixels, repeated)
// ---------------------------------------------------------------------------
const LINETYPE_PATTERNS = {
  continuous: [],
  dashed: [10, 5],
  dotted: [2, 4],
  dashdot: [10, 4, 2, 4],
  dashdotdot: [10, 4, 2, 4, 2, 4],
  center: [16, 4, 4, 4],
  phantom: [20, 4, 4, 4, 4, 4],
  hidden: [6, 4],
  border: [16, 4, 4, 4, 4, 4],
};

export class Renderer {
  /**
   * @param {import('./Viewport.js').Viewport} viewport
   * @param {object} engine  Drawing engine holding entities, layerManager, blockManager, etc.
   */
  constructor(viewport, engine) {
    this.viewport = viewport;
    this.engine = engine;

    /** @type {'dark'|'light'|'blueprint'|'highcontrast'} */
    this.theme = 'dark';
    this.dirty = true;
    this.showLineweights = false;

    this.selectionColor = '#60A5FA';
    this.gripColor = '#60A5FA';
    this.gripSize = 6; // screen pixels
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Get current theme palette. */
  get palette() {
    return THEMES[this.theme] || THEMES.dark;
  }

  /**
   * Full redraw pass.
   * @param {object} selectionManager  Has .isSelected(id) and .getSelectedIds()
   */
  render(selectionManager) {
    if (!this.dirty) return;
    const ctx = this.viewport.ctx;
    const vp = this.viewport;
    ctx.save();
    ctx.clearRect(0, 0, vp.width, vp.height);

    // Background
    this.drawBackground(ctx);

    // Visible bounds for culling
    const vb = vp.getVisibleBounds();

    // Draw entities
    const entities = this.engine.entities; // Map<id, entity>
    for (const [id, entity] of entities) {
      if (!entity.visible) continue;

      // Layer visibility check
      const layer = this.engine.layerManager?.getLayer(entity.layer);
      if (layer && (!layer.visible || layer.frozen)) continue;

      const isSelected = selectionManager?.isSelected(id) ?? false;
      this.drawEntity(ctx, entity, isSelected, layer);
    }

    // Draw grips on selected entities
    if (selectionManager) {
      for (const id of selectionManager.getSelectedIds?.() ?? []) {
        const entity = entities.get(id);
        if (entity) this.drawGrips(ctx, entity);
      }
    }

    ctx.restore();
    this.dirty = false;
  }

  /** Mark renderer as needing a repaint. */
  invalidate() {
    this.dirty = true;
  }

  // -------------------------------------------------------------------------
  // Background
  // -------------------------------------------------------------------------

  drawBackground(ctx) {
    ctx.fillStyle = this.palette.background;
    ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);
  }

  // -------------------------------------------------------------------------
  // Entity dispatch
  // -------------------------------------------------------------------------

  drawEntity(ctx, entity, isSelected, layer) {
    switch (entity.type) {
      case 'line': this.drawLine(ctx, entity, isSelected, layer); break;
      case 'circle': this.drawCircle(ctx, entity, isSelected, layer); break;
      case 'arc': this.drawArc(ctx, entity, isSelected, layer); break;
      case 'polyline': this.drawPolyline(ctx, entity, isSelected, layer); break;
      case 'ellipse': this.drawEllipse(ctx, entity, isSelected, layer); break;
      case 'text': this.drawText(ctx, entity, isSelected, layer); break;
      case 'mtext': this.drawMText(ctx, entity, isSelected, layer); break;
      case 'dimension': this.drawDimension(ctx, entity, isSelected, layer); break;
      case 'hatch': this.drawHatch(ctx, entity, isSelected, layer); break;
      case 'spline': this.drawSpline(ctx, entity, isSelected, layer); break;
      case 'point': this.drawPoint(ctx, entity, isSelected, layer); break;
      case 'block_ref': this.drawBlockRef(ctx, entity, isSelected, layer); break;
      case 'construction_line': this.drawConstructionLine(ctx, entity, isSelected, layer); break;
      case 'ray': this.drawRay(ctx, entity, isSelected, layer); break;
      case 'leader': this.drawLeader(ctx, entity, isSelected, layer); break;
      case 'table': this.drawTable(ctx, entity, isSelected, layer); break;
      case 'revision_cloud': this.drawRevisionCloud(ctx, entity, isSelected, layer); break;
      case 'image': this.drawImage(ctx, entity, isSelected, layer); break;
      default: break;
    }
  }

  // -------------------------------------------------------------------------
  // Color / style helpers
  // -------------------------------------------------------------------------

  /**
   * Resolve the effective CSS color string for an entity.
   */
  resolveColor(entity, isSelected, layer) {
    if (isSelected) return this.palette.selection;

    const raw = entity.color;
    if (!raw || raw === 'bylayer') {
      return layer?.color
        ? this._colorToCSS(layer.color)
        : this.palette.defaultEntity;
    }
    if (raw === 'byblock') {
      // During block_ref rendering the caller should override
      return this.palette.defaultEntity;
    }
    return this._colorToCSS(raw);
  }

  _colorToCSS(c) {
    if (typeof c === 'string') return c;
    if (c && typeof c.r === 'number') {
      return `rgb(${c.r},${c.g},${c.b})`;
    }
    return this.palette.defaultEntity;
  }

  /**
   * Apply stroke style, linewidth, and linetype dash to context.
   */
  applyStroke(ctx, entity, isSelected, layer) {
    ctx.strokeStyle = this.resolveColor(entity, isSelected, layer);

    // Lineweight
    let lw = 1;
    if (this.showLineweights) {
      const raw = entity.lineweight ?? (layer?.lineweight);
      if (raw && raw > 0) {
        // lineweight is in mm -- approximate 1mm ~ 3px on screen, scaled
        lw = Math.max(1, raw * 0.3 * Math.sqrt(this.viewport.zoom));
      }
    }
    ctx.lineWidth = lw;

    // Linetype dashing
    const lt = (entity.linetype ?? layer?.linetype ?? 'continuous').toLowerCase();
    const pattern = LINETYPE_PATTERNS[lt] || [];
    ctx.setLineDash(pattern);
    ctx.lineDashOffset = 0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  // -------------------------------------------------------------------------
  // LINE
  // -------------------------------------------------------------------------

  drawLine(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const p1 = vp.worldToScreen(entity.start.x, entity.start.y);
    const p2 = vp.worldToScreen(entity.end.x, entity.end.y);

    ctx.beginPath();
    this.applyStroke(ctx, entity, isSelected, layer);
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // CIRCLE
  // -------------------------------------------------------------------------

  drawCircle(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const c = vp.worldToScreen(entity.center.x, entity.center.y);
    const r = vp.worldToScreenDist(entity.radius);
    if (r < 0.5) return; // too small to see

    ctx.beginPath();
    this.applyStroke(ctx, entity, isSelected, layer);
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // ARC
  // -------------------------------------------------------------------------

  drawArc(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const c = vp.worldToScreen(entity.center.x, entity.center.y);
    const r = vp.worldToScreenDist(entity.radius);
    if (r < 0.5) return;

    // Canvas arc goes clockwise. World angles are CCW from +X.
    // Because of the Y-flip, a world-CCW arc becomes canvas-CW.
    // ctx.arc(... , startAngle, endAngle, anticlockwise)
    // We negate angles and swap start/end to handle the Y-flip.
    const startAngle = -entity.endAngle;
    const endAngle = -entity.startAngle;

    ctx.beginPath();
    this.applyStroke(ctx, entity, isSelected, layer);
    ctx.arc(c.x, c.y, r, startAngle, endAngle, false);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // POLYLINE (with bulge support)
  // -------------------------------------------------------------------------

  drawPolyline(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const verts = entity.vertices; // [{x, y, bulge?}, ...]
    if (!verts || verts.length < 2) return;

    ctx.beginPath();
    this.applyStroke(ctx, entity, isSelected, layer);

    const p0 = vp.worldToScreen(verts[0].x, verts[0].y);
    ctx.moveTo(p0.x, p0.y);

    const count = entity.closed ? verts.length : verts.length - 1;

    for (let i = 0; i < count; i++) {
      const curr = verts[i];
      const next = verts[(i + 1) % verts.length];
      const bulge = curr.bulge ?? 0;

      if (Math.abs(bulge) < 1e-10) {
        // Straight segment
        const pn = vp.worldToScreen(next.x, next.y);
        ctx.lineTo(pn.x, pn.y);
      } else {
        // Arc segment via bulge
        this._drawBulgeSegment(ctx, vp, curr, next, bulge);
      }
    }

    if (entity.closed) ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw a polyline arc segment defined by bulge value.
   * Bulge = tan(includedAngle / 4).  Positive = CCW, negative = CW.
   */
  _drawBulgeSegment(ctx, vp, v1, v2, bulge) {
    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;
    const chord = Math.sqrt(dx * dx + dy * dy);
    if (chord < 1e-12) return;

    const s = chord / 2;
    const sagitta = Math.abs(bulge) * s;
    const radius = (s * s + sagitta * sagitta) / (2 * sagitta);

    // Midpoint of chord
    const mx = (v1.x + v2.x) / 2;
    const my = (v1.y + v2.y) / 2;

    // Unit normal to chord (pointing toward center for positive bulge)
    const nx = -dy / chord;
    const ny = dx / chord;

    // Distance from midpoint to center along normal
    const d = radius - sagitta;
    const sign = bulge > 0 ? 1 : -1;

    const cx = mx + sign * d * nx;
    const cy = my + sign * d * ny;

    // Convert to screen
    const sc = vp.worldToScreen(cx, cy);
    const sr = vp.worldToScreenDist(radius);

    // Compute angles in screen space (Y flipped)
    const sv1 = vp.worldToScreen(v1.x, v1.y);
    const sv2 = vp.worldToScreen(v2.x, v2.y);

    const a1 = Math.atan2(sv1.y - sc.y, sv1.x - sc.x);
    const a2 = Math.atan2(sv2.y - sc.y, sv2.x - sc.x);

    // In screen space, Y flip reverses winding: positive bulge (CCW in world)
    // becomes CW in screen, so anticlockwise param should be false for
    // positive bulge (after flip).
    const anticlockwise = bulge > 0;

    ctx.arc(sc.x, sc.y, sr, a1, a2, anticlockwise);
  }

  // -------------------------------------------------------------------------
  // ELLIPSE
  // -------------------------------------------------------------------------

  drawEllipse(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const c = vp.worldToScreen(entity.center.x, entity.center.y);

    // entity.majorAxis = {x, y} direction/length of semi-major axis
    // entity.minorRatio = ratio of semi-minor to semi-major
    const maj = entity.majorAxis || { x: entity.radiusX || 1, y: 0 };
    const semiMajor = Math.sqrt(maj.x * maj.x + maj.y * maj.y);
    const semiMinor = semiMajor * (entity.minorRatio ?? (entity.radiusY / semiMajor) ?? 1);
    const rotation = Math.atan2(maj.y, maj.x);

    const rMaj = vp.worldToScreenDist(semiMajor);
    const rMin = vp.worldToScreenDist(semiMinor);
    if (rMaj < 0.5) return;

    const startAngle = entity.startAngle ?? 0;
    const endAngle = entity.endAngle ?? Math.PI * 2;

    ctx.beginPath();
    this.applyStroke(ctx, entity, isSelected, layer);
    // Y-flip: negate the rotation
    ctx.ellipse(c.x, c.y, rMaj, rMin, -rotation, -endAngle, -startAngle, false);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // TEXT
  // -------------------------------------------------------------------------

  drawText(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const pos = vp.worldToScreen(entity.position.x, entity.position.y);
    const height = vp.worldToScreenDist(entity.height || 2.5);
    if (height < 2) return; // too small

    const color = this.resolveColor(entity, isSelected, layer);
    const fontFamily = entity.fontFamily || 'sans-serif';
    const rotation = entity.rotation || 0; // degrees, CCW

    ctx.save();
    ctx.translate(pos.x, pos.y);
    // Y-flip means CCW rotation in world becomes CW on canvas
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.font = `${Math.round(height)}px ${fontFamily}`;
    ctx.fillStyle = color;

    // Horizontal justification
    const hJust = (entity.horizontalAlignment || 'left').toLowerCase();
    if (hJust === 'center') ctx.textAlign = 'center';
    else if (hJust === 'right') ctx.textAlign = 'right';
    else ctx.textAlign = 'left';

    // Vertical justification
    const vJust = (entity.verticalAlignment || 'baseline').toLowerCase();
    if (vJust === 'top') ctx.textBaseline = 'top';
    else if (vJust === 'middle') ctx.textBaseline = 'middle';
    else if (vJust === 'bottom') ctx.textBaseline = 'bottom';
    else ctx.textBaseline = 'alphabetic';

    ctx.fillText(entity.text || '', 0, 0);
    ctx.restore();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // MTEXT (multiline text)
  // -------------------------------------------------------------------------

  drawMText(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const pos = vp.worldToScreen(entity.position.x, entity.position.y);
    const height = vp.worldToScreenDist(entity.height || 2.5);
    if (height < 2) return;

    const color = this.resolveColor(entity, isSelected, layer);
    const fontFamily = entity.fontFamily || 'sans-serif';
    const rotation = entity.rotation || 0;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.font = `${Math.round(height)}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Split on newlines and render each line
    const text = entity.text || '';
    const lines = text.split('\n');
    const lineSpacing = height * (entity.lineSpacingFactor || 1.4);

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 0, i * lineSpacing);
    }
    ctx.restore();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // DIMENSION (linear, aligned, angular, radius, diameter)
  // -------------------------------------------------------------------------

  drawDimension(ctx, entity, isSelected, layer) {
    const subType = (entity.dimType || entity.subType || 'linear').toLowerCase();
    switch (subType) {
      case 'linear':
      case 'aligned':
        this._drawLinearDimension(ctx, entity, isSelected, layer, subType === 'aligned');
        break;
      case 'angular':
        this._drawAngularDimension(ctx, entity, isSelected, layer);
        break;
      case 'radius':
        this._drawRadiusDimension(ctx, entity, isSelected, layer, false);
        break;
      case 'diameter':
        this._drawRadiusDimension(ctx, entity, isSelected, layer, true);
        break;
      default:
        this._drawLinearDimension(ctx, entity, isSelected, layer, false);
    }
  }

  _drawLinearDimension(ctx, entity, isSelected, layer, aligned) {
    const vp = this.viewport;
    // Points: defPoint1, defPoint2 (definition), dimLinePoint (where dim line sits)
    const dp1 = entity.defPoint1 || entity.start || { x: 0, y: 0 };
    const dp2 = entity.defPoint2 || entity.end || { x: 10, y: 0 };
    const dPos = entity.dimLinePoint || entity.textPosition || {
      x: (dp1.x + dp2.x) / 2,
      y: (dp1.y + dp2.y) / 2 + 5,
    };

    // Direction of dimension line
    let dir, perp;
    if (aligned) {
      const dx = dp2.x - dp1.x;
      const dy = dp2.y - dp1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      dir = { x: dx / len, y: dy / len };
      perp = { x: -dir.y, y: dir.x };
    } else {
      // Horizontal or vertical based on angle
      const angle = entity.angle ?? 0; // radians
      dir = { x: Math.cos(angle), y: Math.sin(angle) };
      perp = { x: -dir.y, y: dir.x };
    }

    // Project definition points onto dim line through dPos
    const proj1 = this._projectOntoLine(dp1, dPos, dir);
    const proj2 = this._projectOntoLine(dp2, dPos, dir);

    const color = this.resolveColor(entity, isSelected, layer);
    const dimColor = isSelected ? color : this.palette.dimLine;
    const textColor = isSelected ? color : this.palette.dimText;

    ctx.save();
    this.applyStroke(ctx, entity, isSelected, layer);
    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Extension lines
    const s1 = vp.worldToScreen(dp1.x, dp1.y);
    const e1 = vp.worldToScreen(proj1.x, proj1.y);
    const s2 = vp.worldToScreen(dp2.x, dp2.y);
    const e2 = vp.worldToScreen(proj2.x, proj2.y);

    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(e1.x, e1.y);
    ctx.moveTo(s2.x, s2.y);
    ctx.lineTo(e2.x, e2.y);
    ctx.stroke();

    // Dimension line
    ctx.beginPath();
    ctx.moveTo(e1.x, e1.y);
    ctx.lineTo(e2.x, e2.y);
    ctx.stroke();

    // Arrowheads
    const arrowSize = Math.max(6, vp.worldToScreenDist(entity.arrowSize || 2));
    this._drawArrowhead(ctx, e2, e1, arrowSize, dimColor);
    this._drawArrowhead(ctx, e1, e2, arrowSize, dimColor);

    // Measurement text
    const dist = Math.sqrt(
      (proj2.x - proj1.x) ** 2 + (proj2.y - proj1.y) ** 2,
    );
    const text = entity.text ?? dist.toFixed(entity.precision ?? 2);
    const mid = vp.worldToScreen(
      (proj1.x + proj2.x) / 2,
      (proj1.y + proj2.y) / 2,
    );
    const fontSize = Math.max(10, vp.worldToScreenDist(entity.textHeight || 2.5));
    ctx.font = `${Math.round(fontSize)}px sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, mid.x, mid.y - 2);

    ctx.restore();
  }

  _drawAngularDimension(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const center = entity.center || { x: 0, y: 0 };
    const r = entity.radius || 10;
    const startAngle = entity.startAngle || 0;
    const endAngle = entity.endAngle || Math.PI / 2;

    const sc = vp.worldToScreen(center.x, center.y);
    const sr = vp.worldToScreenDist(r);

    const color = this.resolveColor(entity, isSelected, layer);
    const dimColor = isSelected ? color : this.palette.dimLine;
    const textColor = isSelected ? color : this.palette.dimText;

    ctx.save();
    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Arc for dimension
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sr, -endAngle, -startAngle, false);
    ctx.stroke();

    // Extension lines from center to arc endpoints
    const p1 = vp.worldToScreen(
      center.x + r * Math.cos(startAngle),
      center.y + r * Math.sin(startAngle),
    );
    const p2 = vp.worldToScreen(
      center.x + r * Math.cos(endAngle),
      center.y + r * Math.sin(endAngle),
    );

    ctx.beginPath();
    ctx.moveTo(sc.x, sc.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.moveTo(sc.x, sc.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Arrowheads at arc endpoints
    const arrowSize = Math.max(6, vp.worldToScreenDist(entity.arrowSize || 2));
    // Tangent at start (perpendicular to radius, pointing CCW)
    const t1From = {
      x: p1.x + sr * Math.sin(-startAngle),
      y: p1.y + sr * Math.cos(-startAngle),
    };
    this._drawArrowhead(ctx, t1From, p1, arrowSize, dimColor);

    const t2From = {
      x: p2.x - sr * Math.sin(-endAngle),
      y: p2.y - sr * Math.cos(-endAngle),
    };
    this._drawArrowhead(ctx, t2From, p2, arrowSize, dimColor);

    // Angle text
    let angleDeg = ((endAngle - startAngle) * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;
    const text = entity.text ?? `${angleDeg.toFixed(entity.precision ?? 1)}\u00B0`;
    const midAngle = (startAngle + endAngle) / 2;
    const textPos = vp.worldToScreen(
      center.x + (r + 2) * Math.cos(midAngle),
      center.y + (r + 2) * Math.sin(midAngle),
    );
    const fontSize = Math.max(10, vp.worldToScreenDist(entity.textHeight || 2.5));
    ctx.font = `${Math.round(fontSize)}px sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, textPos.x, textPos.y);

    ctx.restore();
  }

  _drawRadiusDimension(ctx, entity, isSelected, layer, isDiameter) {
    const vp = this.viewport;
    const center = entity.center || { x: 0, y: 0 };
    const r = entity.radius || 5;
    const angle = entity.angle ?? 0;

    const endPt = {
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
    };

    const sc = vp.worldToScreen(center.x, center.y);
    const se = vp.worldToScreen(endPt.x, endPt.y);

    const color = this.resolveColor(entity, isSelected, layer);
    const dimColor = isSelected ? color : this.palette.dimLine;
    const textColor = isSelected ? color : this.palette.dimText;

    ctx.save();
    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Leader line
    if (isDiameter) {
      const oppPt = vp.worldToScreen(
        center.x - r * Math.cos(angle),
        center.y - r * Math.sin(angle),
      );
      ctx.beginPath();
      ctx.moveTo(oppPt.x, oppPt.y);
      ctx.lineTo(se.x, se.y);
      ctx.stroke();

      const arrowSize = Math.max(6, vp.worldToScreenDist(entity.arrowSize || 2));
      this._drawArrowhead(ctx, sc, se, arrowSize, dimColor);
      this._drawArrowhead(ctx, sc, oppPt, arrowSize, dimColor);
    } else {
      ctx.beginPath();
      ctx.moveTo(sc.x, sc.y);
      ctx.lineTo(se.x, se.y);
      ctx.stroke();

      const arrowSize = Math.max(6, vp.worldToScreenDist(entity.arrowSize || 2));
      this._drawArrowhead(ctx, sc, se, arrowSize, dimColor);
    }

    // Text
    const prefix = isDiameter ? '\u2300' : 'R';
    const val = isDiameter ? r * 2 : r;
    const text = entity.text ?? `${prefix}${val.toFixed(entity.precision ?? 2)}`;
    const mid = {
      x: (sc.x + se.x) / 2,
      y: (sc.y + se.y) / 2,
    };
    const fontSize = Math.max(10, vp.worldToScreenDist(entity.textHeight || 2.5));
    ctx.font = `${Math.round(fontSize)}px sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, mid.x, mid.y - 2);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // HATCH
  // -------------------------------------------------------------------------

  drawHatch(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const boundaries = entity.boundaries || []; // array of vertex-arrays
    if (boundaries.length === 0) return;

    const color = this.resolveColor(entity, isSelected, layer);
    const patternType = (entity.patternType || 'solid').toLowerCase();

    ctx.save();

    // Build clip path from boundaries
    ctx.beginPath();
    for (const boundary of boundaries) {
      if (!boundary.length) continue;
      const p0 = vp.worldToScreen(boundary[0].x, boundary[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < boundary.length; i++) {
        const p = vp.worldToScreen(boundary[i].x, boundary[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
    }

    if (patternType === 'solid') {
      ctx.fillStyle = isSelected
        ? this.palette.selection + '66'
        : (color + (color.length <= 7 ? '66' : ''));
      ctx.fill('evenodd');
    } else {
      // Pattern hatch: draw parallel lines clipped to boundary
      ctx.clip('evenodd');

      const angle = entity.patternAngle || 0; // degrees
      const spacing = entity.patternScale || 5; // world units
      this._drawHatchPattern(ctx, vp, boundaries, angle, spacing, color);
    }

    // Outline the boundary
    ctx.beginPath();
    for (const boundary of boundaries) {
      if (!boundary.length) continue;
      const p0 = vp.worldToScreen(boundary[0].x, boundary[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < boundary.length; i++) {
        const p = vp.worldToScreen(boundary[i].x, boundary[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.restore();
  }

  _drawHatchPattern(ctx, vp, boundaries, angleDeg, spacingWorld, color) {
    // Compute bounding box in world
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of boundaries) {
      for (const v of b) {
        if (v.x < minX) minX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.x > maxX) maxX = v.x;
        if (v.y > maxY) maxY = v.y;
      }
    }

    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Diagonal of bounding box
    const diag = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Number of lines to cover the bounding box
    const numLines = Math.ceil(diag / spacingWorld) + 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();

    for (let i = -numLines; i <= numLines; i++) {
      const offset = i * spacingWorld;
      // Line passes through (cx + offset * perpX, cy + offset * perpY) along direction
      const px = cx + offset * (-sin);
      const py = cy + offset * cos;

      const x1 = px - diag * cos;
      const y1 = py - diag * sin;
      const x2 = px + diag * cos;
      const y2 = py + diag * sin;

      const s1 = vp.worldToScreen(x1, y1);
      const s2 = vp.worldToScreen(x2, y2);
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
    }
    ctx.stroke();
  }

  // -------------------------------------------------------------------------
  // SPLINE
  // -------------------------------------------------------------------------

  drawSpline(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const pts = entity.controlPoints || entity.fitPoints || [];
    if (pts.length < 2) return;

    ctx.beginPath();
    this.applyStroke(ctx, entity, isSelected, layer);

    if (pts.length === 2) {
      const p0 = vp.worldToScreen(pts[0].x, pts[0].y);
      const p1 = vp.worldToScreen(pts[1].x, pts[1].y);
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
    } else if (pts.length === 3) {
      const p0 = vp.worldToScreen(pts[0].x, pts[0].y);
      const p1 = vp.worldToScreen(pts[1].x, pts[1].y);
      const p2 = vp.worldToScreen(pts[2].x, pts[2].y);
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    } else {
      // Approximate with Catmull-Rom -> Bezier conversion
      const sp = pts.map(p => vp.worldToScreen(p.x, p.y));
      ctx.moveTo(sp[0].x, sp[0].y);

      for (let i = 0; i < sp.length - 1; i++) {
        const p0 = sp[Math.max(0, i - 1)];
        const p1 = sp[i];
        const p2 = sp[Math.min(sp.length - 1, i + 1)];
        const p3 = sp[Math.min(sp.length - 1, i + 2)];

        // Catmull-Rom to cubic bezier control points
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // POINT
  // -------------------------------------------------------------------------

  drawPoint(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const p = vp.worldToScreen(entity.position.x, entity.position.y);
    const color = this.resolveColor(entity, isSelected, layer);
    const size = entity.size ?? 4;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const style = entity.pointStyle ?? 'cross';

    switch (style) {
      case 'dot':
        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'cross':
      default:
        ctx.beginPath();
        ctx.moveTo(p.x - size, p.y);
        ctx.lineTo(p.x + size, p.y);
        ctx.moveTo(p.x, p.y - size);
        ctx.lineTo(p.x, p.y + size);
        ctx.stroke();
        break;
      case 'x':
        ctx.beginPath();
        ctx.moveTo(p.x - size, p.y - size);
        ctx.lineTo(p.x + size, p.y + size);
        ctx.moveTo(p.x + size, p.y - size);
        ctx.lineTo(p.x - size, p.y + size);
        ctx.stroke();
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK REFERENCE
  // -------------------------------------------------------------------------

  drawBlockRef(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const blockDef = this.engine.blockManager?.getBlock(entity.blockName || entity.name);
    if (!blockDef || !blockDef.entities) return;

    const insert = entity.position || { x: 0, y: 0 };
    const scaleX = entity.scaleX ?? 1;
    const scaleY = entity.scaleY ?? 1;
    const rotation = entity.rotation ?? 0; // degrees

    ctx.save();

    // Transform: translate to insert point (in screen space), then scale+rotate
    const sp = vp.worldToScreen(insert.x, insert.y);
    ctx.translate(sp.x, sp.y);
    ctx.rotate((-rotation * Math.PI) / 180); // negate for Y-flip
    ctx.scale(scaleX, -scaleY); // negate Y to re-enter world convention

    // Draw each sub-entity manually in local block space
    for (const subEntity of blockDef.entities) {
      // Resolve 'byblock' color to the block ref's color
      const effectiveEntity = { ...subEntity };
      if (effectiveEntity.color === 'byblock') {
        effectiveEntity.color = entity.color;
      }
      // For block sub-entities we need to draw in the local coordinate system
      // We temporarily adjust the viewport zoom to account for block scale
      // Instead, we convert entity coords to world and draw normally
      const worldEntity = this._transformBlockEntity(effectiveEntity, insert, scaleX, scaleY, rotation);
      // But since we already applied the canvas transform, just draw at local coords
      // Reset the transform approach: draw sub-entities directly
    }

    ctx.restore();

    // Simpler approach: transform each sub-entity to world coords and draw
    for (const subEntity of blockDef.entities) {
      const effectiveEntity = { ...subEntity };
      if (effectiveEntity.color === 'byblock') {
        effectiveEntity.color = entity.color;
      }
      const worldEntity = this._transformBlockEntity(effectiveEntity, insert, scaleX, scaleY, rotation);
      if (worldEntity) {
        this.drawEntity(ctx, worldEntity, isSelected, layer);
      }
    }
  }

  /**
   * Transform a block-definition entity into world coordinates given the block ref's
   * insertion point, scale, and rotation.
   */
  _transformBlockEntity(entity, insert, sx, sy, rotDeg) {
    const rad = (rotDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const tx = (x, y) => ({
      x: insert.x + (x * sx * cos - y * sy * sin),
      y: insert.y + (x * sx * sin + y * sy * cos),
    });

    const result = { ...entity };

    switch (entity.type) {
      case 'line':
        result.start = tx(entity.start.x, entity.start.y);
        result.end = tx(entity.end.x, entity.end.y);
        return result;
      case 'circle':
        result.center = tx(entity.center.x, entity.center.y);
        result.radius = entity.radius * Math.abs(sx);
        return result;
      case 'arc':
        result.center = tx(entity.center.x, entity.center.y);
        result.radius = entity.radius * Math.abs(sx);
        result.startAngle = entity.startAngle + rad;
        result.endAngle = entity.endAngle + rad;
        return result;
      case 'text':
      case 'mtext':
        result.position = tx(entity.position.x, entity.position.y);
        result.height = (entity.height || 2.5) * Math.abs(sy);
        result.rotation = (entity.rotation || 0) + rotDeg;
        return result;
      case 'polyline':
        result.vertices = entity.vertices.map(v => ({
          ...tx(v.x, v.y),
          bulge: v.bulge,
        }));
        return result;
      case 'point':
        result.position = tx(entity.position.x, entity.position.y);
        return result;
      default:
        // For unsupported sub-entity types, attempt simple point transforms
        if (entity.center) result.center = tx(entity.center.x, entity.center.y);
        if (entity.position) result.position = tx(entity.position.x, entity.position.y);
        if (entity.start) result.start = tx(entity.start.x, entity.start.y);
        if (entity.end) result.end = tx(entity.end.x, entity.end.y);
        return result;
    }
  }

  // -------------------------------------------------------------------------
  // CONSTRUCTION LINE (infinite line through two points)
  // -------------------------------------------------------------------------

  drawConstructionLine(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const base = entity.basePoint || entity.start || { x: 0, y: 0 };
    const dir = entity.direction || entity.end
      ? {
          x: (entity.direction?.x ?? entity.end.x) - base.x,
          y: (entity.direction?.y ?? entity.end.y) - base.y,
        }
      : { x: 1, y: 0 };

    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
    const ux = dir.x / len;
    const uy = dir.y / len;

    // Extend far beyond visible area
    const bounds = vp.getVisibleBounds();
    const diag =
      Math.sqrt(
        (bounds.maxX - bounds.minX) ** 2 + (bounds.maxY - bounds.minY) ** 2,
      ) * 2;

    const p1 = vp.worldToScreen(base.x - ux * diag, base.y - uy * diag);
    const p2 = vp.worldToScreen(base.x + ux * diag, base.y + uy * diag);

    this.applyStroke(ctx, entity, isSelected, layer);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // RAY (half-infinite line from a point)
  // -------------------------------------------------------------------------

  drawRay(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const base = entity.basePoint || entity.start || { x: 0, y: 0 };
    const dir = entity.direction || {
      x: (entity.end?.x ?? 1) - base.x,
      y: (entity.end?.y ?? 0) - base.y,
    };

    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
    const ux = dir.x / len;
    const uy = dir.y / len;

    const bounds = vp.getVisibleBounds();
    const diag =
      Math.sqrt(
        (bounds.maxX - bounds.minX) ** 2 + (bounds.maxY - bounds.minY) ** 2,
      ) * 2;

    const p1 = vp.worldToScreen(base.x, base.y);
    const p2 = vp.worldToScreen(base.x + ux * diag, base.y + uy * diag);

    this.applyStroke(ctx, entity, isSelected, layer);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // LEADER
  // -------------------------------------------------------------------------

  drawLeader(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const points = entity.points || [];
    if (points.length < 2) return;

    this.applyStroke(ctx, entity, isSelected, layer);
    ctx.beginPath();
    const sp0 = vp.worldToScreen(points[0].x, points[0].y);
    ctx.moveTo(sp0.x, sp0.y);

    for (let i = 1; i < points.length; i++) {
      const sp = vp.worldToScreen(points[i].x, points[i].y);
      ctx.lineTo(sp.x, sp.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead at the first point (pointing from second toward first)
    const color = this.resolveColor(entity, isSelected, layer);
    const arrowSize = Math.max(6, vp.worldToScreenDist(entity.arrowSize || 2));
    const s0 = vp.worldToScreen(points[0].x, points[0].y);
    const s1 = vp.worldToScreen(points[1].x, points[1].y);
    this._drawArrowhead(ctx, s1, s0, arrowSize, color);

    // Text annotation at last point
    if (entity.text) {
      const last = vp.worldToScreen(
        points[points.length - 1].x,
        points[points.length - 1].y,
      );
      const fontSize = Math.max(10, vp.worldToScreenDist(entity.textHeight || 2.5));
      ctx.font = `${Math.round(fontSize)}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(entity.text, last.x + 4, last.y - 2);
    }
  }

  // -------------------------------------------------------------------------
  // TABLE
  // -------------------------------------------------------------------------

  drawTable(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const pos = entity.position || { x: 0, y: 0 };
    const cols = entity.columns || []; // [{width: number}]
    const rows = entity.rows || []; // [{height: number, cells: [string]}]
    if (cols.length === 0 || rows.length === 0) return;

    const color = this.resolveColor(entity, isSelected, layer);
    const fontSize = Math.max(8, vp.worldToScreenDist(entity.textHeight || 2));

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.font = `${Math.round(fontSize)}px sans-serif`;

    // Compute column x-offsets in world coords
    const colX = [0];
    for (const col of cols) {
      colX.push(colX[colX.length - 1] + col.width);
    }
    const totalWidth = colX[colX.length - 1];

    // Draw row by row from top
    let worldY = pos.y;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rowH = row.height || 5;
      const nextY = worldY - rowH; // Y goes down in table

      // Draw horizontal line at top of row
      const lineStart = vp.worldToScreen(pos.x, worldY);
      const lineEnd = vp.worldToScreen(pos.x + totalWidth, worldY);
      ctx.beginPath();
      ctx.moveTo(lineStart.x, lineStart.y);
      ctx.lineTo(lineEnd.x, lineEnd.y);
      ctx.stroke();

      // Draw cell text
      const cells = row.cells || [];
      for (let c = 0; c < cols.length; c++) {
        const cellText = cells[c] ?? '';
        const cellCenter = vp.worldToScreen(
          pos.x + colX[c] + cols[c].width / 2,
          worldY - rowH / 2,
        );
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cellText, cellCenter.x, cellCenter.y);
      }

      worldY = nextY;
    }

    // Bottom line
    const botStart = vp.worldToScreen(pos.x, worldY);
    const botEnd = vp.worldToScreen(pos.x + totalWidth, worldY);
    ctx.beginPath();
    ctx.moveTo(botStart.x, botStart.y);
    ctx.lineTo(botEnd.x, botEnd.y);
    ctx.stroke();

    // Vertical lines
    for (let c = 0; c <= cols.length; c++) {
      const top = vp.worldToScreen(pos.x + colX[c], pos.y);
      const bot = vp.worldToScreen(pos.x + colX[c], worldY);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(bot.x, bot.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // REVISION CLOUD
  // -------------------------------------------------------------------------

  drawRevisionCloud(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    const points = entity.vertices || entity.points || [];
    if (points.length < 3) return;

    const color = this.resolveColor(entity, isSelected, layer);
    const arcLen = entity.arcLength || 5; // world units per arc

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 2 : 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const numArcs = Math.max(1, Math.round(segLen / arcLen));
      const stepX = dx / numArcs;
      const stepY = dy / numArcs;

      for (let j = 0; j < numArcs; j++) {
        const ax = p1.x + stepX * j;
        const ay = p1.y + stepY * j;
        const bx = p1.x + stepX * (j + 1);
        const by = p1.y + stepY * (j + 1);

        const sa = vp.worldToScreen(ax, ay);
        const sb = vp.worldToScreen(bx, by);

        // Bulge outward: control point perpendicular to segment
        const mx = (sa.x + sb.x) / 2;
        const my = (sa.y + sb.y) / 2;
        const nx = -(sb.y - sa.y) * 0.35;
        const ny = (sb.x - sa.x) * 0.35;

        if (i === 0 && j === 0) ctx.moveTo(sa.x, sa.y);
        ctx.quadraticCurveTo(mx + nx, my + ny, sb.x, sb.y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // IMAGE
  // -------------------------------------------------------------------------

  drawImage(ctx, entity, isSelected, layer) {
    const vp = this.viewport;
    if (!entity._imageElement) {
      // Lazy load
      if (entity._imageLoading) return;
      entity._imageLoading = true;
      const img = new Image();
      img.onload = () => {
        entity._imageElement = img;
        entity._imageLoading = false;
        this.invalidate();
      };
      img.onerror = () => {
        entity._imageLoading = false;
      };
      img.src = entity.src || entity.path || '';
      return;
    }

    const img = entity._imageElement;
    const pos = entity.position || { x: 0, y: 0 };
    const w = entity.width || img.naturalWidth;
    const h = entity.height || img.naturalHeight;

    const tl = vp.worldToScreen(pos.x, pos.y + h); // top-left in screen (Y-flip)
    const sw = vp.worldToScreenDist(w);
    const sh = vp.worldToScreenDist(h);

    ctx.save();
    if (isSelected) {
      ctx.globalAlpha = 0.85;
    }
    ctx.drawImage(img, tl.x, tl.y, sw, sh);

    if (isSelected) {
      ctx.strokeStyle = this.palette.selection;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(tl.x, tl.y, sw, sh);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // GRIPS (drawn on selected entities)
  // -------------------------------------------------------------------------

  drawGrips(ctx, entity) {
    const pts = this._getGripPoints(entity);
    const vp = this.viewport;
    const half = this.gripSize / 2;

    ctx.fillStyle = this.palette.grip;

    for (const pt of pts) {
      const sp = vp.worldToScreen(pt.x, pt.y);
      ctx.fillRect(sp.x - half, sp.y - half, this.gripSize, this.gripSize);
    }
  }

  /**
   * Return world-space grip points for an entity.
   */
  _getGripPoints(entity) {
    switch (entity.type) {
      case 'line':
        return [entity.start, entity.end];
      case 'circle':
        return [
          entity.center,
          { x: entity.center.x + entity.radius, y: entity.center.y },
          { x: entity.center.x, y: entity.center.y + entity.radius },
          { x: entity.center.x - entity.radius, y: entity.center.y },
          { x: entity.center.x, y: entity.center.y - entity.radius },
        ];
      case 'arc':
        return [
          entity.center,
          {
            x: entity.center.x + entity.radius * Math.cos(entity.startAngle),
            y: entity.center.y + entity.radius * Math.sin(entity.startAngle),
          },
          {
            x: entity.center.x + entity.radius * Math.cos(entity.endAngle),
            y: entity.center.y + entity.radius * Math.sin(entity.endAngle),
          },
        ];
      case 'polyline':
        return (entity.vertices || []).map(v => ({ x: v.x, y: v.y }));
      case 'text':
      case 'mtext':
        return [entity.position];
      case 'point':
        return [entity.position];
      case 'spline':
        return entity.controlPoints || entity.fitPoints || [];
      case 'block_ref':
        return [entity.position || { x: 0, y: 0 }];
      case 'ellipse':
        return [entity.center];
      case 'leader':
        return entity.points || [];
      default:
        if (entity.position) return [entity.position];
        if (entity.center) return [entity.center];
        return [];
    }
  }

  // -------------------------------------------------------------------------
  // Shared helpers
  // -------------------------------------------------------------------------

  /**
   * Draw a filled arrowhead at `tip`, pointing from `from` toward `tip`.
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x:number,y:number}} from  screen coords
   * @param {{x:number,y:number}} tip   screen coords
   * @param {number} size  screen pixels
   * @param {string} color
   */
  _drawArrowhead(ctx, from, tip, size, color) {
    const dx = tip.x - from.x;
    const dy = tip.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;

    const halfW = size * 0.3;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - ux * size + px * halfW, tip.y - uy * size + py * halfW);
    ctx.lineTo(tip.x - ux * size - px * halfW, tip.y - uy * size - py * halfW);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Project a point onto a line through `linePoint` in direction `dir` and return
   * the projected world-space point.
   */
  _projectOntoLine(point, linePoint, dir) {
    const dx = point.x - linePoint.x;
    const dy = point.y - linePoint.y;
    const t = dx * dir.x + dy * dir.y;
    return {
      x: linePoint.x + t * dir.x,
      y: linePoint.y + t * dir.y,
    };
  }
}
