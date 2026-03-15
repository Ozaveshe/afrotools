/**
 * AfroDraft v6 — Inquiry Commands
 *
 * DIST, AREA, ANGLE, ID, LIST
 *
 * All results are emitted via the 'output' event so that the command-line
 * UI can display them.
 */

import {
  BaseCommand,
  parseCoordinate,
  parseNumber,
  dist,
  angleBetween,
  normalizeAngle,
} from './CommandRegistry.js';

const _DEG = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// ═══════════════════════════════════════════════════════════════════════════════
// DIST Command — measure distance between two points
// ═══════════════════════════════════════════════════════════════════════════════

export class DistCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.p1 = null;
    this.phase = 'p1';
  }

  start() {
    this.prompt('DIST — Specify first point: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'p1') {
      this.p1 = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'p2';
      this.prompt('Specify second point: ');
      return;
    }
    if (this.phase === 'p2') {
      this._measure(wx, wy);
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.p1) {
      this.preview = {
        type: 'line',
        x1: this.p1.x, y1: this.p1.y,
        x2: wx, y2: wy,
      };
    }
  }

  onInput(text) {
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  _measure(x2, y2) {
    const dx = x2 - this.p1.x;
    const dy = y2 - this.p1.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * RAD2DEG;

    const fmt = this.engine.formatDistance.bind(this.engine);
    this.message('');
    this.message(`Distance = ${fmt(d)}`);
    this.message(`Angle in XY Plane = ${angle.toFixed(this.engine.anglePrecision)}\u00B0`);
    this.message(`Delta X = ${fmt(dx)}, Delta Y = ${fmt(dy)}`);
    this.message('');

    this.preview = null;
    this.finish();
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AREA Command — compute area and perimeter of a polygon
// ═══════════════════════════════════════════════════════════════════════════════

export class AreaCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.points = [];
    this.phase = 'pick'; // 'pick' or 'entity'
  }

  start() {
    this.prompt('AREA — Specify first corner point or [Entity]: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'pick') {
      this.points.push({ x: wx, y: wy });
      this.setPoint(wx, wy);
      if (this.points.length === 1) {
        this.prompt('Specify next corner point (Enter to calculate): ');
      } else {
        this.prompt('Specify next corner point (Enter to calculate): ');
      }
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.points.length > 0) {
      const last = this.points[this.points.length - 1];
      this.preview = {
        type: 'line',
        x1: last.x, y1: last.y,
        x2: wx, y2: wy,
      };
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === '' && this.points.length >= 3) {
      this._calculate();
      return;
    }
    if (t === 'e' || t === 'entity') {
      this.phase = 'entity';
      this.prompt('Select entity: ');
      return;
    }
    if (this.phase === 'entity') {
      // Handled via click
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  onKey(key) {
    if (key === 'Enter' || key === 'Return') {
      if (this.phase === 'pick' && this.points.length >= 3) {
        this._calculate();
      }
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  _calculate() {
    const pts = this.points;
    const n = pts.length;

    // Shoelace formula for area
    let area = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += pts[i].x * pts[j].y;
      area -= pts[j].x * pts[i].y;
    }
    area = Math.abs(area) / 2;

    // Perimeter
    let perimeter = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      perimeter += dist(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
    }

    const fmt = this.engine.formatDistance.bind(this.engine);
    this.message('');
    this.message(`Area = ${fmt(area)} sq ${this.engine.units}`);
    this.message(`Perimeter = ${fmt(perimeter)} ${this.engine.units}`);
    this.message('');

    this.preview = null;
    this.finish();
  }

  getPreview() {
    const previews = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      previews.push({
        type: 'line',
        x1: this.points[i].x, y1: this.points[i].y,
        x2: this.points[i + 1].x, y2: this.points[i + 1].y,
      });
    }
    if (this.preview) previews.push(this.preview);
    // Close back to first point
    if (this.points.length > 2) {
      previews.push({
        type: 'line',
        x1: this.points[this.points.length - 1].x,
        y1: this.points[this.points.length - 1].y,
        x2: this.points[0].x,
        y2: this.points[0].y,
      });
    }
    return previews;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANGLE Command — measure angle between two lines
// ═══════════════════════════════════════════════════════════════════════════════

export class AngleCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.line1 = null;
    this.phase = 'line1';
  }

  start() {
    this.prompt('ANGLE — Select first line: ');
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
        this._measure(this.line1, pick.entity);
      } else {
        this.message('Select a line entity.');
      }
    }
  }

  _measure(l1, l2) {
    const a1 = angleBetween(l1.x1, l1.y1, l1.x2, l1.y2);
    const a2 = angleBetween(l2.x1, l2.y1, l2.x2, l2.y2);
    let angle = Math.abs(a2 - a1);
    if (angle > Math.PI) angle = 2 * Math.PI - angle;
    const supplement = Math.PI - angle;

    this.message('');
    this.message(`Angle = ${(angle * RAD2DEG).toFixed(this.engine.anglePrecision)}\u00B0`);
    this.message(`Supplement = ${(supplement * RAD2DEG).toFixed(this.engine.anglePrecision)}\u00B0`);
    this.message('');

    this.finish();
  }

  onInput(text) {
    // No text input needed
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ID Command — show coordinates of a point
// ═══════════════════════════════════════════════════════════════════════════════

export class IdCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
  }

  start() {
    this.prompt('ID — Specify point: ');
  }

  onClick(wx, wy) {
    const fmt = this.engine.formatDistance.bind(this.engine);
    this.message('');
    this.message(`X = ${fmt(wx)}, Y = ${fmt(wy)}`);
    this.message('');
    this.setPoint(wx, wy);
    this.finish();
  }

  onInput(text) {
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST Command — show properties of an entity
// ═══════════════════════════════════════════════════════════════════════════════

export class ListCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
  }

  start() {
    this.prompt('LIST — Select entity: ');
  }

  onClick(wx, wy) {
    const pick = this.engine.pickEntity(wx, wy);
    if (pick) {
      this._listEntity(pick.entity);
    } else {
      this.message('No entity found.');
    }
    this.finish();
  }

  onInput(text) {
    // No text input
  }

  _listEntity(e) {
    const fmt = this.engine.formatDistance.bind(this.engine);
    this.message('');
    this.message(`--- Entity Properties ---`);
    this.message(`  Type:      ${e.type}`);
    this.message(`  ID:        ${e.id}`);
    this.message(`  Layer:     ${e.layer}`);
    this.message(`  Linetype:  ${e.linetype}`);
    this.message(`  Lineweight:${e.lineweight}`);

    switch (e.type) {
      case 'line':
        this.message(`  From:      (${fmt(e.x1)}, ${fmt(e.y1)})`);
        this.message(`  To:        (${fmt(e.x2)}, ${fmt(e.y2)})`);
        this.message(`  Length:    ${fmt(dist(e.x1, e.y1, e.x2, e.y2))}`);
        this.message(`  Angle:     ${(angleBetween(e.x1, e.y1, e.x2, e.y2) * RAD2DEG).toFixed(2)}\u00B0`);
        break;
      case 'circle':
        this.message(`  Center:    (${fmt(e.cx)}, ${fmt(e.cy)})`);
        this.message(`  Radius:    ${fmt(e.r)}`);
        this.message(`  Diameter:  ${fmt(e.r * 2)}`);
        this.message(`  Circumf.:  ${fmt(2 * Math.PI * e.r)}`);
        this.message(`  Area:      ${fmt(Math.PI * e.r * e.r)}`);
        break;
      case 'arc':
        this.message(`  Center:    (${fmt(e.cx)}, ${fmt(e.cy)})`);
        this.message(`  Radius:    ${fmt(e.r)}`);
        this.message(`  Start Ang: ${(e.startAngle * RAD2DEG).toFixed(2)}\u00B0`);
        this.message(`  End Ang:   ${(e.endAngle * RAD2DEG).toFixed(2)}\u00B0`);
        break;
      case 'ellipse':
        this.message(`  Center:    (${fmt(e.cx)}, ${fmt(e.cy)})`);
        this.message(`  Semi-major:${fmt(e.rx)}`);
        this.message(`  Semi-minor:${fmt(e.ry)}`);
        this.message(`  Rotation:  ${((e.rotation || 0) * RAD2DEG).toFixed(2)}\u00B0`);
        break;
      case 'polyline': {
        this.message(`  Closed:    ${e.closed ? 'Yes' : 'No'}`);
        this.message(`  Vertices:  ${e.points.length}`);
        let perimeter = 0;
        const n = e.points.length;
        const limit = e.closed ? n : n - 1;
        for (let i = 0; i < limit; i++) {
          const p1 = e.points[i];
          const p2 = e.points[(i + 1) % n];
          perimeter += dist(p1.x, p1.y, p2.x, p2.y);
        }
        this.message(`  Perimeter: ${fmt(perimeter)}`);
        if (e.closed && n >= 3) {
          let area = 0;
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += e.points[i].x * e.points[j].y;
            area -= e.points[j].x * e.points[i].y;
          }
          this.message(`  Area:      ${fmt(Math.abs(area) / 2)}`);
        }
        break;
      }
      case 'spline':
        this.message(`  Degree:    ${e.degree}`);
        this.message(`  Control pts: ${e.controlPoints.length}`);
        this.message(`  Closed:    ${e.closed ? 'Yes' : 'No'}`);
        break;
      case 'text':
      case 'mtext':
        this.message(`  Position:  (${fmt(e.x)}, ${fmt(e.y)})`);
        this.message(`  Height:    ${fmt(e.height)}`);
        this.message(`  Text:      "${e.text}"`);
        break;
      case 'point':
        this.message(`  Position:  (${fmt(e.x)}, ${fmt(e.y)})`);
        break;
      case 'dimension':
        this.message(`  Dim Type:  ${e.dimType}`);
        this.message(`  Measurement: ${e.measurement != null ? e.measurement.toFixed(e.decimalPlaces || 2) : 'N/A'}`);
        break;
      case 'hatch':
        this.message(`  Pattern:   ${e.pattern}`);
        this.message(`  Scale:     ${e.scale}`);
        this.message(`  Angle:     ${e.angle}\u00B0`);
        this.message(`  Boundary pts: ${e.boundary.length}`);
        break;
      default:
        this.message(`  (No detailed info for type "${e.type}")`);
    }

    this.message(`--- End ---`);
    this.message('');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Registration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register all inquiry commands on a CommandRegistry instance.
 * @param {import('./CommandRegistry.js').CommandRegistry} registry
 */
export function registerInquiryCommands(registry) {
  registry.register('DIST',   ['DI'],         DistCommand);
  registry.register('AREA',   ['AA'],         AreaCommand);
  registry.register('ANGLE',  ['ANG'],        AngleCommand);
  registry.register('ID',     [],             IdCommand);
  registry.register('LIST',   ['LI', 'LS'],   ListCommand);
}
