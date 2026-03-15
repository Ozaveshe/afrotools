/**
 * AfroDraft v6 — Annotation & Dimension Commands
 *
 * DIMLINEAR, DIMALIGNED, DIMANGULAR, DIMRADIUS, DIMDIAMETER,
 * DIMORDINATE, DIMBASELINE, DIMCONTINUE, LEADER (annotation),
 * CENTERMARK, CENTERLINE
 */

import {
  BaseCommand,
  parseCoordinate,
  parseNumber,
  dist,
  angleBetween,
  midpoint,
  normalizeAngle,
} from './CommandRegistry.js';

const _DEG = Math.PI / 180;

// ─── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Build a dimension entity with common properties.
 */
function makeDimension(type, props, engine) {
  const dimStyle = engine.dimStyles.get('Standard') || {};
  return {
    type: 'dimension',
    dimType: type,
    textHeight: dimStyle.textHeight || 2.5,
    arrowSize: dimStyle.arrowSize || 2.5,
    extensionOffset: dimStyle.extensionOffset || 1.25,
    extensionOvershoot: dimStyle.extensionOvershoot || 1.25,
    dimLineGap: dimStyle.dimLineGap || 0.625,
    decimalPlaces: dimStyle.decimalPlaces || 2,
    unitScale: dimStyle.unitScale || 1,
    prefix: dimStyle.prefix || '',
    suffix: dimStyle.suffix || '',
    textOverride: null,
    dimStyle: 'Standard',
    layer: 'Defpoints',
    ...props,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIMLINEAR Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DimLinearCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.p1 = null;
    this.p2 = null;
    this.dimLinePos = null;
    this.textOverride = null;
    this.phase = 'p1';
  }

  start() {
    this.prompt('DIMLINEAR — Specify first extension line origin: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'p1') {
      this.p1 = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'p2';
      this.prompt('Specify second extension line origin: ');
      return;
    }
    if (this.phase === 'p2') {
      this.p2 = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'dimline';
      this.prompt('Specify dimension line location or [Text]: ');
      return;
    }
    if (this.phase === 'dimline') {
      this._create(wx, wy);
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.phase === 'dimline' && this.p1 && this.p2) {
      this.preview = {
        type: 'dimension',
        dimType: 'linear',
        x1: this.p1.x, y1: this.p1.y,
        x2: this.p2.x, y2: this.p2.y,
        dimLineX: wx, dimLineY: wy,
      };
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (this.phase === 'dimline' && (t === 't' || t === 'text')) {
      this.prompt('Enter dimension text override: ');
      this.phase = 'text';
      return;
    }
    if (this.phase === 'text') {
      this.textOverride = text;
      this.phase = 'dimline';
      this.prompt('Specify dimension line location: ');
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  _create(wx, wy) {
    // Determine if horizontal or vertical based on dim line position
    const dx = Math.abs(wx - (this.p1.x + this.p2.x) / 2);
    const dy = Math.abs(wy - (this.p1.y + this.p2.y) / 2);
    const horizontal = dy > dx;

    let measurement;
    if (horizontal) {
      measurement = Math.abs(this.p2.x - this.p1.x);
    } else {
      measurement = Math.abs(this.p2.y - this.p1.y);
    }

    this.engine.addEntity(makeDimension('linear', {
      x1: this.p1.x, y1: this.p1.y,
      x2: this.p2.x, y2: this.p2.y,
      dimLineX: wx, dimLineY: wy,
      measurement,
      horizontal,
      textOverride: this.textOverride,
    }, this.engine));

    this.preview = null;
    this.finish();
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIMALIGNED Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DimAlignedCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.p1 = null;
    this.p2 = null;
    this.textOverride = null;
    this.phase = 'p1';
  }

  start() {
    this.prompt('DIMALIGNED — Specify first extension line origin: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'p1') {
      this.p1 = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'p2';
      this.prompt('Specify second extension line origin: ');
      return;
    }
    if (this.phase === 'p2') {
      this.p2 = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'dimline';
      this.prompt('Specify dimension line location or [Text]: ');
      return;
    }
    if (this.phase === 'dimline') {
      this._create(wx, wy);
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.phase === 'dimline' && this.p1 && this.p2) {
      this.preview = {
        type: 'dimension', dimType: 'aligned',
        x1: this.p1.x, y1: this.p1.y,
        x2: this.p2.x, y2: this.p2.y,
        dimLineX: wx, dimLineY: wy,
      };
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (this.phase === 'dimline' && (t === 't' || t === 'text')) {
      this.prompt('Enter dimension text override: ');
      this.phase = 'text';
      return;
    }
    if (this.phase === 'text') {
      this.textOverride = text;
      this.phase = 'dimline';
      this.prompt('Specify dimension line location: ');
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  _create(wx, wy) {
    const measurement = dist(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
    this.engine.addEntity(makeDimension('aligned', {
      x1: this.p1.x, y1: this.p1.y,
      x2: this.p2.x, y2: this.p2.y,
      dimLineX: wx, dimLineY: wy,
      measurement,
      textOverride: this.textOverride,
    }, this.engine));
    this.preview = null;
    this.finish();
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIMANGULAR Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DimAngularCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.line1 = null;
    this.line2 = null;
    this.textOverride = null;
    this.phase = 'line1';
  }

  start() {
    this.prompt('DIMANGULAR — Select first line: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'line1') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && pick.entity.type === 'line') {
        this.line1 = pick.entity;
        this.phase = 'line2';
        this.prompt('Select second line: ');
      } else {
        this.message('Please select a line entity.');
      }
      return;
    }
    if (this.phase === 'line2') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && pick.entity.type === 'line') {
        this.line2 = pick.entity;
        this.phase = 'dimline';
        this.prompt('Specify dimension arc location or [Text]: ');
      } else {
        this.message('Please select a line entity.');
      }
      return;
    }
    if (this.phase === 'dimline') {
      this._create(wx, wy);
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (this.phase === 'dimline' && (t === 't' || t === 'text')) {
      this.prompt('Enter dimension text override: ');
      this.phase = 'text';
      return;
    }
    if (this.phase === 'text') {
      this.textOverride = text;
      this.phase = 'dimline';
      this.prompt('Specify dimension arc location: ');
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  _create(wx, wy) {
    const a1 = angleBetween(this.line1.x1, this.line1.y1, this.line1.x2, this.line1.y2);
    const a2 = angleBetween(this.line2.x1, this.line2.y1, this.line2.x2, this.line2.y2);
    let angle = Math.abs(a2 - a1);
    if (angle > Math.PI) angle = 2 * Math.PI - angle;

    this.engine.addEntity(makeDimension('angular', {
      line1: { x1: this.line1.x1, y1: this.line1.y1, x2: this.line1.x2, y2: this.line1.y2 },
      line2: { x1: this.line2.x1, y1: this.line2.y1, x2: this.line2.x2, y2: this.line2.y2 },
      dimLineX: wx, dimLineY: wy,
      measurement: angle * 180 / Math.PI,
      measurementRadians: angle,
      textOverride: this.textOverride,
    }, this.engine));
    this.preview = null;
    this.finish();
  }

  getPreview() {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIMRADIUS Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DimRadiusCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entity = null;
    this.textOverride = null;
    this.phase = 'pick';
  }

  start() {
    this.prompt('DIMRADIUS — Select arc or circle: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'pick') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && (pick.entity.type === 'circle' || pick.entity.type === 'arc')) {
        this.entity = pick.entity;
        this.phase = 'dimline';
        this.prompt('Specify dimension line location or [Text]: ');
      } else {
        this.message('Select a circle or arc.');
      }
      return;
    }
    if (this.phase === 'dimline') {
      this._create(wx, wy);
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (this.phase === 'dimline' && (t === 't' || t === 'text')) {
      this.prompt('Enter dimension text override: ');
      this.phase = 'text';
      return;
    }
    if (this.phase === 'text') {
      this.textOverride = text;
      this.phase = 'dimline';
      this.prompt('Specify dimension line location: ');
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  _create(wx, wy) {
    const e = this.entity;
    const angle = angleBetween(e.cx, e.cy, wx, wy);
    this.engine.addEntity(makeDimension('radius', {
      cx: e.cx, cy: e.cy,
      r: e.r,
      x1: e.cx, y1: e.cy,
      x2: e.cx + e.r * Math.cos(angle),
      y2: e.cy + e.r * Math.sin(angle),
      dimLineX: wx, dimLineY: wy,
      measurement: e.r,
      textOverride: this.textOverride,
    }, this.engine));
    this.preview = null;
    this.finish();
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.phase === 'dimline' && this.entity) {
      const e = this.entity;
      const angle = angleBetween(e.cx, e.cy, wx, wy);
      this.preview = {
        type: 'dimension', dimType: 'radius',
        x1: e.cx, y1: e.cy,
        x2: e.cx + e.r * Math.cos(angle),
        y2: e.cy + e.r * Math.sin(angle),
      };
    }
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIMDIAMETER Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DimDiameterCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entity = null;
    this.textOverride = null;
    this.phase = 'pick';
  }

  start() {
    this.prompt('DIMDIAMETER — Select arc or circle: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'pick') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && (pick.entity.type === 'circle' || pick.entity.type === 'arc')) {
        this.entity = pick.entity;
        this.phase = 'dimline';
        this.prompt('Specify dimension line location or [Text]: ');
      } else {
        this.message('Select a circle or arc.');
      }
      return;
    }
    if (this.phase === 'dimline') {
      this._create(wx, wy);
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (this.phase === 'dimline' && (t === 't' || t === 'text')) {
      this.prompt('Enter dimension text override: ');
      this.phase = 'text';
      return;
    }
    if (this.phase === 'text') {
      this.textOverride = text;
      this.phase = 'dimline';
      this.prompt('Specify dimension line location: ');
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  _create(wx, wy) {
    const e = this.entity;
    const angle = angleBetween(e.cx, e.cy, wx, wy);
    this.engine.addEntity(makeDimension('diameter', {
      cx: e.cx, cy: e.cy,
      r: e.r,
      x1: e.cx - e.r * Math.cos(angle),
      y1: e.cy - e.r * Math.sin(angle),
      x2: e.cx + e.r * Math.cos(angle),
      y2: e.cy + e.r * Math.sin(angle),
      dimLineX: wx, dimLineY: wy,
      measurement: e.r * 2,
      textOverride: this.textOverride,
    }, this.engine));
    this.preview = null;
    this.finish();
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.phase === 'dimline' && this.entity) {
      const e = this.entity;
      const angle = angleBetween(e.cx, e.cy, wx, wy);
      this.preview = {
        type: 'dimension', dimType: 'diameter',
        x1: e.cx - e.r * Math.cos(angle),
        y1: e.cy - e.r * Math.sin(angle),
        x2: e.cx + e.r * Math.cos(angle),
        y2: e.cy + e.r * Math.sin(angle),
      };
    }
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIMORDINATE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DimOrdinateCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.featurePoint = null;
    this.textOverride = null;
    this.phase = 'feature';
  }

  start() {
    this.prompt('DIMORDINATE — Specify feature location: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'feature') {
      this.featurePoint = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'leader';
      this.prompt('Specify leader endpoint: ');
      return;
    }
    if (this.phase === 'leader') {
      this._create(wx, wy);
    }
  }

  onInput(text) {
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  _create(wx, wy) {
    // Determine X or Y ordinate based on leader direction
    const dx = Math.abs(wx - this.featurePoint.x);
    const dy = Math.abs(wy - this.featurePoint.y);
    const isXOrdinate = dy > dx; // If leader goes more vertically, it's an X ordinate
    const measurement = isXOrdinate
      ? this.featurePoint.x - this.engine.origin.x
      : this.featurePoint.y - this.engine.origin.y;

    this.engine.addEntity(makeDimension('ordinate', {
      x1: this.featurePoint.x, y1: this.featurePoint.y,
      x2: wx, y2: wy,
      dimLineX: wx, dimLineY: wy,
      measurement: Math.abs(measurement),
      isXOrdinate,
      textOverride: this.textOverride,
    }, this.engine));
    this.preview = null;
    this.finish();
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.featurePoint) {
      this.preview = {
        type: 'line',
        x1: this.featurePoint.x, y1: this.featurePoint.y,
        x2: wx, y2: wy,
      };
    }
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIMBASELINE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DimBaselineCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.baseDim = null;
    this.basePoint = null;
    this.dimLineY = null;
    this.spacing = 5;
    this.count = 0;
    this.phase = 'select';
  }

  start() {
    // Try to find last dimension placed
    const dims = [];
    for (const e of this.engine.entities.values()) {
      if (e.type === 'dimension' && (e.dimType === 'linear' || e.dimType === 'aligned')) {
        dims.push(e);
      }
    }
    if (dims.length > 0) {
      this.baseDim = dims[dims.length - 1];
      this.basePoint = { x: this.baseDim.x1, y: this.baseDim.y1 };
      this.dimLineY = this.baseDim.dimLineY;
      this.phase = 'next';
      this.prompt('DIMBASELINE — Specify next extension line origin (Enter to finish): ');
    } else {
      this.prompt('DIMBASELINE — Select base dimension: ');
    }
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && pick.entity.type === 'dimension') {
        this.baseDim = pick.entity;
        this.basePoint = { x: pick.entity.x1, y: pick.entity.y1 };
        this.dimLineY = pick.entity.dimLineY;
        this.phase = 'next';
        this.prompt('Specify next extension line origin (Enter to finish): ');
      }
      return;
    }
    if (this.phase === 'next') {
      this.count++;
      const newDimLineY = this.dimLineY + this.count * this.spacing;
      const measurement = dist(this.basePoint.x, this.basePoint.y, wx, wy);

      this.engine.addEntity(makeDimension(this.baseDim.dimType || 'linear', {
        x1: this.basePoint.x, y1: this.basePoint.y,
        x2: wx, y2: wy,
        dimLineX: (this.basePoint.x + wx) / 2,
        dimLineY: newDimLineY,
        measurement,
      }, this.engine));

      this.setPoint(wx, wy);
      this.prompt('Specify next extension line origin (Enter to finish): ');
    }
  }

  onInput(text) {
    if (text === '') {
      this.finish();
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  onKey(key) {
    if (key === 'Enter') this.finish();
    else if (key === 'Escape') this.cancel();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIMCONTINUE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DimContinueCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.prevDim = null;
    this.prevEnd = null;
    this.phase = 'select';
  }

  start() {
    // Try to find last dimension
    const dims = [];
    for (const e of this.engine.entities.values()) {
      if (e.type === 'dimension' && (e.dimType === 'linear' || e.dimType === 'aligned')) {
        dims.push(e);
      }
    }
    if (dims.length > 0) {
      this.prevDim = dims[dims.length - 1];
      this.prevEnd = { x: this.prevDim.x2, y: this.prevDim.y2 };
      this.phase = 'next';
      this.prompt('DIMCONTINUE — Specify next extension line origin (Enter to finish): ');
    } else {
      this.prompt('DIMCONTINUE — Select dimension to continue from: ');
    }
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && pick.entity.type === 'dimension') {
        this.prevDim = pick.entity;
        this.prevEnd = { x: pick.entity.x2, y: pick.entity.y2 };
        this.phase = 'next';
        this.prompt('Specify next extension line origin (Enter to finish): ');
      }
      return;
    }
    if (this.phase === 'next') {
      const measurement = dist(this.prevEnd.x, this.prevEnd.y, wx, wy);
      this.engine.addEntity(makeDimension(this.prevDim.dimType || 'linear', {
        x1: this.prevEnd.x, y1: this.prevEnd.y,
        x2: wx, y2: wy,
        dimLineX: (this.prevEnd.x + wx) / 2,
        dimLineY: this.prevDim.dimLineY,
        measurement,
      }, this.engine));

      this.prevEnd = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.prompt('Specify next extension line origin (Enter to finish): ');
    }
  }

  onInput(text) {
    if (text === '') {
      this.finish();
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  onKey(key) {
    if (key === 'Enter') this.finish();
    else if (key === 'Escape') this.cancel();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADER (Annotation) Command — reuses the draw LEADER but lives here for
// annotation context; the DrawCommands version is canonical.
// ═══════════════════════════════════════════════════════════════════════════════

// (Reuse from DrawCommands — no duplicate needed.)

// ═══════════════════════════════════════════════════════════════════════════════
// CENTERMARK Command
// ═══════════════════════════════════════════════════════════════════════════════

export class CenterMarkCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.phase = 'pick';
  }

  start() {
    this.prompt('CENTERMARK — Select arc or circle: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'pick') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && (pick.entity.type === 'circle' || pick.entity.type === 'arc')) {
        this._create(pick.entity);
      } else {
        this.message('Select a circle or arc.');
      }
    }
  }

  _create(entity) {
    const cx = entity.cx;
    const cy = entity.cy;
    const r = entity.r;
    const ext = r * 0.2; // extension beyond circle

    // Horizontal cross
    this.engine.addEntity({
      type: 'line',
      x1: cx - r - ext, y1: cy,
      x2: cx + r + ext, y2: cy,
      layer: 'Defpoints',
    });
    // Vertical cross
    this.engine.addEntity({
      type: 'line',
      x1: cx, y1: cy - r - ext,
      x2: cx, y2: cy + r + ext,
      layer: 'Defpoints',
    });

    this.message('Center mark placed.');
    this.finish();
  }

  onInput(text) {
    // No text input needed
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTERLINE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class CenterLineCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.line1 = null;
    this.phase = 'line1';
  }

  start() {
    this.prompt('CENTERLINE — Select first line: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'line1') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && pick.entity.type === 'line') {
        this.line1 = pick.entity;
        this.phase = 'line2';
        this.prompt('Select second line: ');
      } else {
        this.message('Select a line entity.');
      }
      return;
    }
    if (this.phase === 'line2') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick && pick.entity.type === 'line') {
        this._create(this.line1, pick.entity);
      } else {
        this.message('Select a line entity.');
      }
    }
  }

  _create(l1, l2) {
    // Place a centerline between two parallel (or near-parallel) lines
    const mid1 = midpoint(l1.x1, l1.y1, l1.x2, l1.y2);
    const mid2 = midpoint(l2.x1, l2.y1, l2.x2, l2.y2);

    // Average the four endpoints to define the centerline extent
    const startX = (l1.x1 + l2.x1) / 2;
    const startY = (l1.y1 + l2.y1) / 2;
    const endX = (l1.x2 + l2.x2) / 2;
    const endY = (l1.y2 + l2.y2) / 2;

    // Extension beyond the lines
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ext = len * 0.1;
    const ux = len > 0 ? dx / len : 0;
    const uy = len > 0 ? dy / len : 0;

    this.engine.addEntity({
      type: 'line',
      x1: startX - ext * ux,
      y1: startY - ext * uy,
      x2: endX + ext * ux,
      y2: endY + ext * uy,
      linetype: 'Center',
      layer: 'Defpoints',
    });

    this.message('Centerline placed.');
    this.finish();
  }

  onInput(text) {
    // No text input needed
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Registration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register all annotation/dimension commands on a CommandRegistry instance.
 * @param {import('./CommandRegistry.js').CommandRegistry} registry
 */
export function registerAnnotateCommands(registry) {
  registry.register('DIMLINEAR',   ['DLI', 'DIMLIN'],  DimLinearCommand);
  registry.register('DIMALIGNED',  ['DAL', 'DIMALI'],  DimAlignedCommand);
  registry.register('DIMANGULAR',  ['DAN', 'DIMANG'],  DimAngularCommand);
  registry.register('DIMRADIUS',   ['DRA', 'DIMRAD'],  DimRadiusCommand);
  registry.register('DIMDIAMETER', ['DDI', 'DIMDIA'],  DimDiameterCommand);
  registry.register('DIMORDINATE', ['DOR', 'DIMORD'],  DimOrdinateCommand);
  registry.register('DIMBASELINE', ['DBA', 'DIMBASE'], DimBaselineCommand);
  registry.register('DIMCONTINUE', ['DCO', 'DIMCONT'], DimContinueCommand);
  registry.register('CENTERMARK',  ['CM'],             CenterMarkCommand);
  registry.register('CENTERLINE',  ['CL'],             CenterLineCommand);
}
