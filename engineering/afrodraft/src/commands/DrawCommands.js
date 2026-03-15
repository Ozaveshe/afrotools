/**
 * AfroDraft v6 — Drawing Commands
 *
 * LINE, POLYLINE, RECTANGLE, CIRCLE, ARC, ELLIPSE, POLYGON, SPLINE,
 * XLINE (construction line), RAY, POINT, DTEXT, MTEXT, HATCH, TABLE,
 * REVCLOUD, DONUT, LEADER
 */

import {
  BaseCommand,
  parseCoordinate,
  parseNumber,
  dist,
  angleBetween,
  midpoint,
  pointOnCircle,
  normalizeAngle,
  circumcenter,
} from './CommandRegistry.js';

// Re-export DEG locally since it's used everywhere
const _DEG = Math.PI / 180;

// ─── Helper: build a closed polyline from points ───────────────────────────────

function closedPolylineEntity(points) {
  return {
    type: 'polyline',
    points: points.map(p => ({ x: p.x, y: p.y, bulge: 0 })),
    closed: true,
    globalWidth: 0,
  };
}

// ─── Helper: circle from 3 points ─────────────────────────────────────────────

function circleFrom3Points(p1, p2, p3) {
  const cc = circumcenter(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  if (!cc) return null;
  const r = dist(cc.x, cc.y, p1.x, p1.y);
  return { cx: cc.x, cy: cc.y, r };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LINE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class LineCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.points = [];
    this.prompts = ['Specify first point: ', 'Specify next point or [Close/Undo]: '];
  }

  start() {
    this.prompt('LINE — Specify first point: ');
  }

  onClick(wx, wy) {
    this._addPoint(wx, wy);
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
    if (t === '') {
      // Enter: finish
      this._finishLines();
      return;
    }
    if (t === 'c' || t === 'close') {
      this._close();
      return;
    }
    if (t === 'u' || t === 'undo') {
      this._undo();
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this._addPoint(pt.x, pt.y);
    } else {
      this.message('Invalid input.');
    }
  }

  onKey(key) {
    if (key === 'Escape') {
      if (this.points.length >= 2) {
        this._finishLines();
      } else {
        this.cancel();
      }
    } else if (key === 'Enter' || key === 'Return') {
      this._finishLines();
    }
  }

  _addPoint(x, y) {
    this.setPoint(x, y);
    this.points.push({ x, y });
    if (this.points.length === 1) {
      this.prompt('Specify next point or [Close/Undo]: ');
    } else {
      this.prompt('Specify next point or [Close/Undo]: ');
    }
  }

  _close() {
    if (this.points.length < 3) {
      this.message('Need at least 3 points to close.');
      return;
    }
    // Add closing segment
    this.points.push({ ...this.points[0] });
    this._finishLines();
  }

  _undo() {
    if (this.points.length > 1) {
      this.points.pop();
      const last = this.points[this.points.length - 1];
      this.lastPoint = last;
      this.message('Last point undone.');
    } else {
      this.message('Nothing to undo.');
    }
  }

  _finishLines() {
    if (this.points.length < 2) {
      this.cancel();
      return;
    }
    // Create one line entity per segment
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      this.engine.addEntity({
        type: 'line',
        x1: p1.x, y1: p1.y,
        x2: p2.x, y2: p2.y,
      });
    }
    this.preview = null;
    this.finish();
  }

  getPreview() {
    const previews = [];
    // Completed segments as previews
    for (let i = 0; i < this.points.length - 1; i++) {
      previews.push({
        type: 'line',
        x1: this.points[i].x, y1: this.points[i].y,
        x2: this.points[i + 1].x, y2: this.points[i + 1].y,
      });
    }
    // Rubber-band
    if (this.preview) previews.push(this.preview);
    return previews;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLYLINE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class PolylineCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.vertices = [];  // { x, y, bulge }
    this.arcMode = false;
    this.startWidth = 0;
    this.endWidth = 0;
  }

  start() {
    this.prompt('PLINE — Specify start point: ');
  }

  onClick(wx, wy) {
    this._addVertex(wx, wy);
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.vertices.length > 0) {
      const last = this.vertices[this.vertices.length - 1];
      if (this.arcMode) {
        this.preview = {
          type: 'arc-preview',
          x1: last.x, y1: last.y,
          x2: wx, y2: wy,
        };
      } else {
        this.preview = {
          type: 'line',
          x1: last.x, y1: last.y,
          x2: wx, y2: wy,
        };
      }
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === '') {
      this._finishPolyline(false);
      return;
    }
    if (t === 'c' || t === 'close') {
      this._finishPolyline(true);
      return;
    }
    if (t === 'u' || t === 'undo') {
      if (this.vertices.length > 1) {
        this.vertices.pop();
        const last = this.vertices[this.vertices.length - 1];
        this.lastPoint = { x: last.x, y: last.y };
        this.message('Last segment undone.');
      }
      return;
    }
    if (t === 'a' || t === 'arc') {
      this.arcMode = true;
      this.message('Arc mode ON.');
      return;
    }
    if (t === 'l' || t === 'line') {
      this.arcMode = false;
      this.message('Line mode ON.');
      return;
    }
    if (t.startsWith('w') || t === 'width') {
      this.message('Specify start width: ');
      // Width will be handled in a sub-step; simplified here
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this._addVertex(pt.x, pt.y);
    } else {
      this.message('Invalid input.');
    }
  }

  onKey(key) {
    if (key === 'Escape') {
      if (this.vertices.length >= 2) {
        this._finishPolyline(false);
      } else {
        this.cancel();
      }
    } else if (key === 'Enter' || key === 'Return') {
      this._finishPolyline(false);
    }
  }

  _addVertex(x, y) {
    let bulge = 0;
    if (this.arcMode && this.vertices.length > 0) {
      // Compute bulge for a 180-degree arc as a simple default
      // In a full implementation this would use the user's arc specification
      const last = this.vertices[this.vertices.length - 1];
      const d = dist(last.x, last.y, x, y);
      const sagitta = d * 0.25;
      bulge = (2 * sagitta) / d || 0;
    }
    // Store bulge on the PREVIOUS vertex
    if (this.vertices.length > 0 && this.arcMode) {
      this.vertices[this.vertices.length - 1].bulge = bulge;
    }
    this.vertices.push({ x, y, bulge: 0 });
    this.setPoint(x, y);
    this.prompt('Specify next point or [Arc/Line/Close/Undo]: ');
  }

  _finishPolyline(closed) {
    if (this.vertices.length < 2) {
      this.cancel();
      return;
    }
    this.engine.addEntity({
      type: 'polyline',
      points: this.vertices.map(v => ({ x: v.x, y: v.y, bulge: v.bulge || 0 })),
      closed,
      globalWidth: this.startWidth,
    });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    const previews = [];
    for (let i = 0; i < this.vertices.length - 1; i++) {
      previews.push({
        type: 'line',
        x1: this.vertices[i].x, y1: this.vertices[i].y,
        x2: this.vertices[i + 1].x, y2: this.vertices[i + 1].y,
      });
    }
    if (this.preview) previews.push(this.preview);
    return previews;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECTANGLE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class RectangleCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.corner1 = null;
    this.chamfer = 0;
    this.fillet = 0;
    this.rotation = 0;
  }

  start() {
    this.prompt('RECTANG — Specify first corner point or [Chamfer/Fillet/Rotation]: ');
  }

  onClick(wx, wy) {
    if (!this.corner1) {
      this.corner1 = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.prompt('Specify other corner point: ');
    } else {
      this._createRect(wx, wy);
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.corner1) {
      const c1 = this.corner1;
      this.preview = {
        type: 'rectangle-preview',
        x1: c1.x, y1: c1.y,
        x2: wx, y2: wy,
        rotation: this.rotation,
      };
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t.startsWith('c') && !this.corner1) {
      this.prompt('Specify chamfer distance: ');
      this.step = 10; // sub-step for chamfer
      return;
    }
    if (t.startsWith('f') && !this.corner1) {
      this.prompt('Specify fillet radius: ');
      this.step = 11;
      return;
    }
    if (t.startsWith('r') && !this.corner1) {
      this.prompt('Specify rotation angle: ');
      this.step = 12;
      return;
    }
    if (this.step === 10) {
      const v = parseNumber(text);
      if (v !== null) { this.chamfer = v; this.step = 0; }
      this.prompt('RECTANG — Specify first corner point or [Chamfer/Fillet/Rotation]: ');
      return;
    }
    if (this.step === 11) {
      const v = parseNumber(text);
      if (v !== null) { this.fillet = v; this.step = 0; }
      this.prompt('RECTANG — Specify first corner point or [Chamfer/Fillet/Rotation]: ');
      return;
    }
    if (this.step === 12) {
      const v = parseNumber(text);
      if (v !== null) { this.rotation = v * _DEG; this.step = 0; }
      this.prompt('RECTANG — Specify first corner point or [Chamfer/Fillet/Rotation]: ');
      return;
    }

    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      if (!this.corner1) {
        this.corner1 = { x: pt.x, y: pt.y };
        this.setPoint(pt.x, pt.y);
        this.prompt('Specify other corner point: ');
      } else {
        this._createRect(pt.x, pt.y);
      }
    }
  }

  _createRect(x2, y2) {
    const c1 = this.corner1;
    let pts;
    if (this.rotation === 0) {
      pts = [
        { x: c1.x, y: c1.y },
        { x: x2, y: c1.y },
        { x: x2, y: y2 },
        { x: c1.x, y: y2 },
      ];
    } else {
      // Rotated rectangle
      const cos = Math.cos(this.rotation);
      const sin = Math.sin(this.rotation);
      const dx = x2 - c1.x;
      const dy = y2 - c1.y;
      // Project onto rotated axes
      const w = dx * cos + dy * sin;
      const h = -dx * sin + dy * cos;
      const corners = [
        { lx: 0, ly: 0 },
        { lx: w, ly: 0 },
        { lx: w, ly: h },
        { lx: 0, ly: h },
      ];
      pts = corners.map(c => ({
        x: c1.x + c.lx * cos - c.ly * sin,
        y: c1.y + c.lx * sin + c.ly * cos,
      }));
    }

    if (this.fillet > 0) {
      // Create polyline with arc segments at corners
      const filletPts = this._applyFillet(pts, this.fillet);
      this.engine.addEntity({
        type: 'polyline',
        points: filletPts,
        closed: true,
        globalWidth: 0,
      });
    } else if (this.chamfer > 0) {
      const chamferPts = this._applyChamfer(pts, this.chamfer);
      this.engine.addEntity({
        type: 'polyline',
        points: chamferPts.map(p => ({ x: p.x, y: p.y, bulge: 0 })),
        closed: true,
        globalWidth: 0,
      });
    } else {
      this.engine.addEntity(closedPolylineEntity(pts));
    }
    this.preview = null;
    this.finish();
  }

  _applyFillet(pts, r) {
    // Simplified fillet: offset each corner by r along both edges, add arc bulge
    const result = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const curr = pts[i];
      const next = pts[(i + 1) % n];
      const d1 = dist(curr.x, curr.y, prev.x, prev.y);
      const d2 = dist(curr.x, curr.y, next.x, next.y);
      const t1 = Math.min(r, d1 / 2) / d1;
      const t2 = Math.min(r, d2 / 2) / d2;
      const p1 = {
        x: curr.x + t1 * (prev.x - curr.x),
        y: curr.y + t1 * (prev.y - curr.y),
      };
      const p2 = {
        x: curr.x + t2 * (next.x - curr.x),
        y: curr.y + t2 * (next.y - curr.y),
      };
      // Bulge for a 90-degree fillet arc = tan(pi/8)
      const bulge = Math.tan(Math.PI / 8);
      result.push({ x: p1.x, y: p1.y, bulge });
      result.push({ x: p2.x, y: p2.y, bulge: 0 });
    }
    return result;
  }

  _applyChamfer(pts, d) {
    const result = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const curr = pts[i];
      const next = pts[(i + 1) % n];
      const d1 = dist(curr.x, curr.y, prev.x, prev.y);
      const d2 = dist(curr.x, curr.y, next.x, next.y);
      const t1 = Math.min(d, d1 / 2) / d1;
      const t2 = Math.min(d, d2 / 2) / d2;
      result.push({
        x: curr.x + t1 * (prev.x - curr.x),
        y: curr.y + t1 * (prev.y - curr.y),
      });
      result.push({
        x: curr.x + t2 * (next.x - curr.x),
        y: curr.y + t2 * (next.y - curr.y),
      });
    }
    return result;
  }

  getPreview() {
    if (!this.corner1) return [];
    if (!this.preview) return [];
    const c1 = this.corner1;
    const x2 = this._mouseX;
    const y2 = this._mouseY;
    return [{
      type: 'polyline',
      points: [
        { x: c1.x, y: c1.y, bulge: 0 },
        { x: x2, y: c1.y, bulge: 0 },
        { x: x2, y: y2, bulge: 0 },
        { x: c1.x, y: y2, bulge: 0 },
      ],
      closed: true,
      globalWidth: 0,
    }];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCLE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class CircleCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.center = null;
    this.mode = 'center-radius'; // 'center-radius', '2p', '3p', 'ttr'
    this.tempPoints = [];
  }

  start() {
    this.prompt('CIRCLE — Specify center point or [2P/3P/Ttr]: ');
  }

  onClick(wx, wy) {
    switch (this.mode) {
      case 'center-radius':
        if (!this.center) {
          this.center = { x: wx, y: wy };
          this.setPoint(wx, wy);
          this.prompt('Specify radius or [Diameter]: ');
        } else {
          const r = dist(this.center.x, this.center.y, wx, wy);
          this._createCircle(this.center.x, this.center.y, r);
        }
        break;
      case '2p':
        this.tempPoints.push({ x: wx, y: wy });
        this.setPoint(wx, wy);
        if (this.tempPoints.length === 1) {
          this.prompt('Specify second point on diameter: ');
        } else {
          const p1 = this.tempPoints[0];
          const p2 = this.tempPoints[1];
          const mid = midpoint(p1.x, p1.y, p2.x, p2.y);
          const r = dist(p1.x, p1.y, p2.x, p2.y) / 2;
          this._createCircle(mid.x, mid.y, r);
        }
        break;
      case '3p':
        this.tempPoints.push({ x: wx, y: wy });
        this.setPoint(wx, wy);
        if (this.tempPoints.length === 1) {
          this.prompt('Specify second point on circle: ');
        } else if (this.tempPoints.length === 2) {
          this.prompt('Specify third point on circle: ');
        } else {
          const c = circleFrom3Points(this.tempPoints[0], this.tempPoints[1], this.tempPoints[2]);
          if (c) {
            this._createCircle(c.cx, c.cy, c.r);
          } else {
            this.message('Points are collinear — cannot form a circle.');
            this.cancel();
          }
        }
        break;
      case 'ttr':
        // Simplified: collect two entity picks then radius
        this.tempPoints.push({ x: wx, y: wy });
        this.setPoint(wx, wy);
        if (this.tempPoints.length === 1) {
          this.prompt('Specify second tangent entity: ');
        } else {
          this.prompt('Specify radius: ');
          this.step = 10; // waiting for radius
        }
        break;
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.mode === 'center-radius' && this.center) {
      const r = dist(this.center.x, this.center.y, wx, wy);
      this.preview = {
        type: 'circle',
        cx: this.center.x, cy: this.center.y, r,
      };
    } else if (this.mode === '2p' && this.tempPoints.length === 1) {
      const p1 = this.tempPoints[0];
      const mid = midpoint(p1.x, p1.y, wx, wy);
      const r = dist(p1.x, p1.y, wx, wy) / 2;
      this.preview = { type: 'circle', cx: mid.x, cy: mid.y, r };
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === '2p') {
      this.mode = '2p';
      this.prompt('Specify first point on diameter: ');
      return;
    }
    if (t === '3p') {
      this.mode = '3p';
      this.prompt('Specify first point on circle: ');
      return;
    }
    if (t === 'ttr' || t === 't') {
      this.mode = 'ttr';
      this.prompt('Specify first tangent entity: ');
      return;
    }
    if (t === 'd' || t === 'diameter') {
      if (this.center) {
        this.prompt('Specify diameter: ');
        this.step = 20;
        return;
      }
    }
    if (this.step === 20) {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this._createCircle(this.center.x, this.center.y, v / 2);
      }
      return;
    }
    if (this.step === 10) {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        // TTR simplified: use the two picked points as centers on the tangent entities
        // and compute circle of given radius tangent to both
        const p1 = this.tempPoints[0];
        const p2 = this.tempPoints[1];
        const mid = midpoint(p1.x, p1.y, p2.x, p2.y);
        this._createCircle(mid.x, mid.y, v);
      }
      return;
    }
    // Try as radius value when we have center
    if (this.center && this.mode === 'center-radius') {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this._createCircle(this.center.x, this.center.y, v);
        return;
      }
    }
    // Try as coordinate
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  _createCircle(cx, cy, r) {
    this.engine.addEntity({ type: 'circle', cx, cy, r });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARC Command
// ═══════════════════════════════════════════════════════════════════════════════

export class ArcCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.mode = '3point'; // '3point', 'sce', 'sca', 'ser', 'cse', 'csa', 'continue'
    this.tempPoints = [];
    this.angleValue = null;
  }

  start() {
    this.prompt('ARC — Specify start point or [Center]: ');
  }

  onClick(wx, wy) {
    this.tempPoints.push({ x: wx, y: wy });
    this.setPoint(wx, wy);

    switch (this.mode) {
      case '3point':
        if (this.tempPoints.length === 1) {
          this.prompt('Specify second point of arc: ');
        } else if (this.tempPoints.length === 2) {
          this.prompt('Specify end point of arc: ');
        } else {
          this._createArc3Point();
        }
        break;
      case 'sce':
        if (this.tempPoints.length === 1) {
          this.prompt('Specify center of arc: ');
        } else if (this.tempPoints.length === 2) {
          this.prompt('Specify end point of arc: ');
        } else {
          this._createArcSCE();
        }
        break;
      case 'sca':
        if (this.tempPoints.length === 1) {
          this.prompt('Specify center of arc: ');
        } else if (this.tempPoints.length === 2) {
          this.prompt('Specify included angle: ');
          this.step = 10;
        }
        break;
      case 'ser':
        if (this.tempPoints.length === 1) {
          this.prompt('Specify end point: ');
        } else if (this.tempPoints.length === 2) {
          this.prompt('Specify radius: ');
          this.step = 11;
        }
        break;
      case 'cse':
        if (this.tempPoints.length === 1) {
          this.prompt('Specify start point: ');
        } else if (this.tempPoints.length === 2) {
          this.prompt('Specify end point: ');
        } else {
          this._createArcCSE();
        }
        break;
      case 'csa':
        if (this.tempPoints.length === 1) {
          this.prompt('Specify start point: ');
        } else if (this.tempPoints.length === 2) {
          this.prompt('Specify included angle: ');
          this.step = 12;
        }
        break;
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.mode === '3point') {
      if (this.tempPoints.length === 2) {
        const c = circumcenter(
          this.tempPoints[0].x, this.tempPoints[0].y,
          this.tempPoints[1].x, this.tempPoints[1].y,
          wx, wy,
        );
        if (c) {
          const r = dist(c.x, c.y, this.tempPoints[0].x, this.tempPoints[0].y);
          const startAngle = angleBetween(c.x, c.y, this.tempPoints[0].x, this.tempPoints[0].y);
          const endAngle = angleBetween(c.x, c.y, wx, wy);
          this.preview = { type: 'arc', cx: c.x, cy: c.y, r, startAngle, endAngle, ccw: true };
        }
      }
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === 'c' || t === 'center') {
      this.mode = 'cse';
      this.tempPoints = [];
      this.prompt('Specify center of arc: ');
      return;
    }
    if (t === 'e' || t === 'end') {
      if (this.tempPoints.length >= 1) {
        this.mode = 'sce';
        this.prompt('Specify center of arc: ');
        return;
      }
    }
    if (this.step === 10 || this.step === 12) {
      const v = parseNumber(text);
      if (v !== null) {
        this._createArcWithAngle(v * _DEG);
      }
      return;
    }
    if (this.step === 11) {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this._createArcSER(v);
      }
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  _createArc3Point() {
    const [p1, p2, p3] = this.tempPoints;
    const c = circumcenter(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    if (!c) { this.message('Points are collinear.'); this.cancel(); return; }
    const r = dist(c.x, c.y, p1.x, p1.y);
    const startAngle = angleBetween(c.x, c.y, p1.x, p1.y);
    const endAngle = angleBetween(c.x, c.y, p3.x, p3.y);
    // Determine direction: is p2 on the CCW side?
    const midAngle = angleBetween(c.x, c.y, p2.x, p2.y);
    const ccw = this._isAngleBetween(midAngle, startAngle, endAngle, true);
    this.engine.addEntity({ type: 'arc', cx: c.x, cy: c.y, r, startAngle, endAngle, ccw });
    this.preview = null;
    this.finish();
  }

  _createArcSCE() {
    const [start, center, end] = this.tempPoints;
    const r = dist(center.x, center.y, start.x, start.y);
    const startAngle = angleBetween(center.x, center.y, start.x, start.y);
    const endAngle = angleBetween(center.x, center.y, end.x, end.y);
    this.engine.addEntity({ type: 'arc', cx: center.x, cy: center.y, r, startAngle, endAngle, ccw: true });
    this.preview = null;
    this.finish();
  }

  _createArcCSE() {
    const [center, start, end] = this.tempPoints;
    const r = dist(center.x, center.y, start.x, start.y);
    const startAngle = angleBetween(center.x, center.y, start.x, start.y);
    const endAngle = angleBetween(center.x, center.y, end.x, end.y);
    this.engine.addEntity({ type: 'arc', cx: center.x, cy: center.y, r, startAngle, endAngle, ccw: true });
    this.preview = null;
    this.finish();
  }

  _createArcWithAngle(angle) {
    if (this.mode === 'sca') {
      const [start, center] = this.tempPoints;
      const r = dist(center.x, center.y, start.x, start.y);
      const startAngle = angleBetween(center.x, center.y, start.x, start.y);
      const endAngle = startAngle + angle;
      this.engine.addEntity({ type: 'arc', cx: center.x, cy: center.y, r, startAngle, endAngle, ccw: angle > 0 });
    } else if (this.mode === 'csa') {
      const [center, start] = this.tempPoints;
      const r = dist(center.x, center.y, start.x, start.y);
      const startAngle = angleBetween(center.x, center.y, start.x, start.y);
      const endAngle = startAngle + angle;
      this.engine.addEntity({ type: 'arc', cx: center.x, cy: center.y, r, startAngle, endAngle, ccw: angle > 0 });
    }
    this.preview = null;
    this.finish();
  }

  _createArcSER(radius) {
    const [start, end] = this.tempPoints;
    const d = dist(start.x, start.y, end.x, end.y);
    if (radius < d / 2) { this.message('Radius too small.'); this.cancel(); return; }
    const mid = midpoint(start.x, start.y, end.x, end.y);
    const a = angleBetween(start.x, start.y, end.x, end.y);
    const h = Math.sqrt(radius * radius - (d / 2) * (d / 2));
    const cx = mid.x + h * Math.cos(a + Math.PI / 2);
    const cy = mid.y + h * Math.sin(a + Math.PI / 2);
    const startAngle = angleBetween(cx, cy, start.x, start.y);
    const endAngle = angleBetween(cx, cy, end.x, end.y);
    this.engine.addEntity({ type: 'arc', cx, cy, r: radius, startAngle, endAngle, ccw: true });
    this.preview = null;
    this.finish();
  }

  _isAngleBetween(mid, start, end, ccw) {
    const s = normalizeAngle(start);
    const e = normalizeAngle(end);
    const m = normalizeAngle(mid);
    if (ccw) {
      if (s <= e) return m >= s && m <= e;
      return m >= s || m <= e;
    } else {
      if (e <= s) return m >= e && m <= s;
      return m >= e || m <= s;
    }
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ELLIPSE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class EllipseCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.center = null;
    this.axisEnd = null;
    this.isArc = false;
    this.startAngle = 0;
    this.endAngle = 2 * Math.PI;
  }

  start() {
    this.prompt('ELLIPSE — Specify center or [Arc]: ');
  }

  onClick(wx, wy) {
    if (!this.center) {
      this.center = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.prompt('Specify endpoint of first axis: ');
    } else if (!this.axisEnd) {
      this.axisEnd = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.prompt('Specify distance to other axis: ');
    } else {
      const otherAxisLen = dist(this.center.x, this.center.y, wx, wy);
      this._createEllipse(otherAxisLen);
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.center && this.axisEnd) {
      const rx = dist(this.center.x, this.center.y, this.axisEnd.x, this.axisEnd.y);
      const ry = dist(this.center.x, this.center.y, wx, wy);
      const rotation = angleBetween(this.center.x, this.center.y, this.axisEnd.x, this.axisEnd.y);
      this.preview = {
        type: 'ellipse', cx: this.center.x, cy: this.center.y,
        rx, ry, rotation, startAngle: 0, endAngle: 2 * Math.PI,
      };
    } else if (this.center && !this.axisEnd) {
      const rx = dist(this.center.x, this.center.y, wx, wy);
      const rotation = angleBetween(this.center.x, this.center.y, wx, wy);
      this.preview = {
        type: 'ellipse', cx: this.center.x, cy: this.center.y,
        rx, ry: rx * 0.5, rotation, startAngle: 0, endAngle: 2 * Math.PI,
      };
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === 'a' || t === 'arc') {
      this.isArc = true;
      this.message('Elliptical arc mode.');
      return;
    }
    const v = parseNumber(text);
    if (v !== null && this.center && this.axisEnd) {
      if (this.isArc && this.step === 0) {
        this.prompt('Specify start angle: ');
        this.step = 10;
        return;
      }
      if (this.step === 10) {
        this.startAngle = v * _DEG;
        this.prompt('Specify end angle: ');
        this.step = 11;
        return;
      }
      if (this.step === 11) {
        this.endAngle = v * _DEG;
        const rx = dist(this.center.x, this.center.y, this.axisEnd.x, this.axisEnd.y);
        this._createEllipse(v); // v is end angle here, need otherAxisLen
        return;
      }
      this._createEllipse(v);
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  _createEllipse(otherAxisLen) {
    const rx = dist(this.center.x, this.center.y, this.axisEnd.x, this.axisEnd.y);
    const ry = otherAxisLen;
    const rotation = angleBetween(this.center.x, this.center.y, this.axisEnd.x, this.axisEnd.y);
    this.engine.addEntity({
      type: 'ellipse',
      cx: this.center.x, cy: this.center.y,
      rx, ry, rotation,
      startAngle: this.startAngle,
      endAngle: this.endAngle,
    });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLYGON Command
// ═══════════════════════════════════════════════════════════════════════════════

export class PolygonCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.sides = 0;
    this.center = null;
    this.mode = 'inscribed'; // 'inscribed', 'circumscribed', 'edge'
    this.edgeStart = null;
  }

  start() {
    this.prompt('POLYGON — Enter number of sides (3-1024): ');
  }

  onClick(wx, wy) {
    if (this.sides === 0) return;

    if (this.mode === 'edge') {
      if (!this.edgeStart) {
        this.edgeStart = { x: wx, y: wy };
        this.setPoint(wx, wy);
        this.prompt('Specify second endpoint of edge: ');
      } else {
        this._createPolygonByEdge(wx, wy);
      }
      return;
    }

    if (!this.center) {
      this.center = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.prompt('Specify radius or [Inscribed/Circumscribed]: ');
    } else {
      const r = dist(this.center.x, this.center.y, wx, wy);
      this._createPolygon(r);
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.sides > 0 && this.center) {
      const r = dist(this.center.x, this.center.y, wx, wy);
      const angle0 = angleBetween(this.center.x, this.center.y, wx, wy);
      this.preview = this._buildPolygonPreview(this.center, this.sides, r, angle0);
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (this.sides === 0) {
      const n = parseInt(text, 10);
      if (n >= 3 && n <= 1024) {
        this.sides = n;
        this.prompt(`Specify center of polygon or [Edge]: `);
      } else {
        this.message('Number must be between 3 and 1024.');
      }
      return;
    }
    if (t === 'i' || t === 'inscribed') {
      this.mode = 'inscribed';
      this.message('Inscribed in circle mode.');
      return;
    }
    if (t === 'c' || t === 'circumscribed') {
      this.mode = 'circumscribed';
      this.message('Circumscribed about circle mode.');
      return;
    }
    if (t === 'e' || t === 'edge') {
      this.mode = 'edge';
      this.prompt('Specify first endpoint of edge: ');
      return;
    }
    const v = parseNumber(text);
    if (v !== null && this.center) {
      this._createPolygon(v);
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  _createPolygon(r) {
    const pts = [];
    const angleStep = (2 * Math.PI) / this.sides;
    const effectiveR = this.mode === 'circumscribed' ? r / Math.cos(angleStep / 2) : r;
    for (let i = 0; i < this.sides; i++) {
      const a = Math.PI / 2 + i * angleStep; // start from top
      pts.push({
        x: this.center.x + effectiveR * Math.cos(a),
        y: this.center.y + effectiveR * Math.sin(a),
      });
    }
    this.engine.addEntity(closedPolylineEntity(pts));
    this.preview = null;
    this.finish();
  }

  _createPolygonByEdge(x2, y2) {
    const p1 = this.edgeStart;
    const edgeLen = dist(p1.x, p1.y, x2, y2);
    const edgeAngle = angleBetween(p1.x, p1.y, x2, y2);
    const r = edgeLen / (2 * Math.sin(Math.PI / this.sides));
    const midX = (p1.x + x2) / 2;
    const midY = (p1.y + y2) / 2;
    const perpAngle = edgeAngle + Math.PI / 2;
    const apothem = r * Math.cos(Math.PI / this.sides);
    const cx = midX + apothem * Math.cos(perpAngle);
    const cy = midY + apothem * Math.sin(perpAngle);

    const pts = [];
    const angleStep = (2 * Math.PI) / this.sides;
    const startAngle = angleBetween(cx, cy, p1.x, p1.y);
    for (let i = 0; i < this.sides; i++) {
      const a = startAngle + i * angleStep;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    this.engine.addEntity(closedPolylineEntity(pts));
    this.preview = null;
    this.finish();
  }

  _buildPolygonPreview(center, sides, r, angle0) {
    const pts = [];
    const step = (2 * Math.PI) / sides;
    for (let i = 0; i < sides; i++) {
      pts.push({
        x: center.x + r * Math.cos(angle0 + i * step),
        y: center.y + r * Math.sin(angle0 + i * step),
        bulge: 0,
      });
    }
    return { type: 'polyline', points: pts, closed: true, globalWidth: 0 };
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPLINE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class SplineCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.controlPoints = [];
    this.fitMode = false;
    this.closed = false;
    this.degree = 3;
  }

  start() {
    this.prompt('SPLINE — Specify first point or [Fit]: ');
  }

  onClick(wx, wy) {
    this.controlPoints.push({ x: wx, y: wy });
    this.setPoint(wx, wy);
    this.prompt('Specify next point or [Close/Fit] (Enter to finish): ');
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.controlPoints.length > 0) {
      const last = this.controlPoints[this.controlPoints.length - 1];
      this.preview = { type: 'line', x1: last.x, y1: last.y, x2: wx, y2: wy };
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === '') {
      this._finishSpline();
      return;
    }
    if (t === 'c' || t === 'close') {
      this.closed = true;
      this._finishSpline();
      return;
    }
    if (t === 'f' || t === 'fit') {
      this.fitMode = true;
      this.message('Fit points mode ON.');
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  onKey(key) {
    if (key === 'Enter' || key === 'Return') {
      this._finishSpline();
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  _finishSpline() {
    if (this.controlPoints.length < 2) {
      this.cancel();
      return;
    }
    this.engine.addEntity({
      type: 'spline',
      controlPoints: this.controlPoints.map(p => ({ x: p.x, y: p.y })),
      degree: this.degree,
      closed: this.closed,
      fitMode: this.fitMode,
    });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    const previews = [];
    for (let i = 0; i < this.controlPoints.length - 1; i++) {
      previews.push({
        type: 'line',
        x1: this.controlPoints[i].x, y1: this.controlPoints[i].y,
        x2: this.controlPoints[i + 1].x, y2: this.controlPoints[i + 1].y,
      });
    }
    if (this.preview) previews.push(this.preview);
    return previews;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// XLINE (Construction Line) Command
// ═══════════════════════════════════════════════════════════════════════════════

export class XLineCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.basePoint = null;
    this.mode = 'twopoint'; // 'twopoint', 'horizontal', 'vertical', 'angle', 'bisect'
    this.angleValue = null;
  }

  start() {
    this.prompt('XLINE — Specify a point or [Hor/Ver/Ang/Bisect]: ');
  }

  onClick(wx, wy) {
    switch (this.mode) {
      case 'horizontal':
        this.engine.addEntity({
          type: 'xline',
          x: wx, y: wy,
          dx: 1, dy: 0,
        });
        this.message(`Construction line placed at Y=${wy.toFixed(4)}`);
        this.prompt('Specify through point (or Enter to finish): ');
        break;
      case 'vertical':
        this.engine.addEntity({
          type: 'xline',
          x: wx, y: wy,
          dx: 0, dy: 1,
        });
        this.message(`Construction line placed at X=${wx.toFixed(4)}`);
        this.prompt('Specify through point (or Enter to finish): ');
        break;
      case 'angle':
        if (this.angleValue !== null) {
          const a = this.angleValue * _DEG;
          this.engine.addEntity({
            type: 'xline',
            x: wx, y: wy,
            dx: Math.cos(a), dy: Math.sin(a),
          });
          this.prompt('Specify through point (or Enter to finish): ');
        }
        break;
      case 'bisect':
        if (!this.basePoint) {
          this.basePoint = { x: wx, y: wy };
          this.setPoint(wx, wy);
          this.prompt('Specify angle vertex: ');
        } else if (!this._vertex) {
          this._vertex = { x: wx, y: wy };
          this.prompt('Specify angle endpoint: ');
        } else {
          const a1 = angleBetween(this._vertex.x, this._vertex.y, this.basePoint.x, this.basePoint.y);
          const a2 = angleBetween(this._vertex.x, this._vertex.y, wx, wy);
          const bisect = (a1 + a2) / 2;
          this.engine.addEntity({
            type: 'xline',
            x: this._vertex.x, y: this._vertex.y,
            dx: Math.cos(bisect), dy: Math.sin(bisect),
          });
          this.preview = null;
          this.finish();
        }
        break;
      default: // twopoint
        if (!this.basePoint) {
          this.basePoint = { x: wx, y: wy };
          this.setPoint(wx, wy);
          this.prompt('Specify through point: ');
        } else {
          const a = angleBetween(this.basePoint.x, this.basePoint.y, wx, wy);
          this.engine.addEntity({
            type: 'xline',
            x: this.basePoint.x, y: this.basePoint.y,
            dx: Math.cos(a), dy: Math.sin(a),
          });
          // Allow placing more xlines from same base
          this.prompt('Specify through point (or Enter to finish): ');
        }
        break;
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === '') { this.finish(); return; }
    if (t === 'h' || t === 'hor' || t === 'horizontal') {
      this.mode = 'horizontal';
      this.prompt('Specify through point: ');
      return;
    }
    if (t === 'v' || t === 'ver' || t === 'vertical') {
      this.mode = 'vertical';
      this.prompt('Specify through point: ');
      return;
    }
    if (t === 'a' || t === 'ang' || t === 'angle') {
      this.mode = 'angle';
      this.prompt('Specify angle: ');
      this.step = 10;
      return;
    }
    if (t === 'b' || t === 'bisect') {
      this.mode = 'bisect';
      this.prompt('Specify first angle point: ');
      return;
    }
    if (this.step === 10) {
      const v = parseNumber(text);
      if (v !== null) {
        this.angleValue = v;
        this.step = 0;
        this.prompt('Specify through point: ');
      }
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.basePoint && this.mode === 'twopoint') {
      this.preview = {
        type: 'xline',
        x: this.basePoint.x, y: this.basePoint.y,
        dx: wx - this.basePoint.x, dy: wy - this.basePoint.y,
      };
    }
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAY Command
// ═══════════════════════════════════════════════════════════════════════════════

export class RayCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.startPoint = null;
  }

  start() {
    this.prompt('RAY — Specify start point: ');
  }

  onClick(wx, wy) {
    if (!this.startPoint) {
      this.startPoint = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.prompt('Specify through point: ');
    } else {
      const a = angleBetween(this.startPoint.x, this.startPoint.y, wx, wy);
      this.engine.addEntity({
        type: 'ray',
        x: this.startPoint.x, y: this.startPoint.y,
        dx: Math.cos(a), dy: Math.sin(a),
      });
      // Allow more rays from same start
      this.prompt('Specify through point (or Enter to finish): ');
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.startPoint) {
      this.preview = {
        type: 'ray',
        x: this.startPoint.x, y: this.startPoint.y,
        dx: wx - this.startPoint.x, dy: wy - this.startPoint.y,
      };
    }
  }

  onInput(text) {
    if (text === '') { this.finish(); return; }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POINT Command
// ═══════════════════════════════════════════════════════════════════════════════

export class PointCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
  }

  start() {
    this.prompt('POINT — Specify a point: ');
  }

  onClick(wx, wy) {
    this.engine.addEntity({ type: 'point', x: wx, y: wy });
    this.setPoint(wx, wy);
    this.prompt('Specify a point (or Enter to finish): ');
  }

  onInput(text) {
    if (text === '') { this.finish(); return; }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.engine.addEntity({ type: 'point', x: pt.x, y: pt.y });
      this.setPoint(pt.x, pt.y);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DTEXT (single-line text) Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DTextCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.position = null;
    this.height = 2.5;
    this.rotation = 0;
    this.justify = 'left';
    this.textContent = '';
    this.phase = 'position'; // 'position', 'height', 'rotation', 'text'
  }

  start() {
    const style = this.engine.textStyles.get('Standard');
    if (style) this.height = style.height;
    this.prompt('DTEXT — Specify start point or [Justify/Height]: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'position') {
      this.position = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'height';
      this.prompt(`Specify height <${this.height}>: `);
    } else if (this.phase === 'text') {
      // Clicking in text mode places a new text position
      this._commitText();
      this.position = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.prompt('Enter text (Enter to finish): ');
    }
  }

  onInput(text) {
    if (this.phase === 'position') {
      const t = text.toLowerCase();
      if (t === 'j' || t === 'justify') {
        this.prompt('Specify justification [L/C/R/TL/TC/TR/ML/MC/MR/BL/BC/BR]: ');
        this.phase = 'justify-input';
        return;
      }
      if (t === 'h' || t === 'height') {
        this.prompt('Specify text height: ');
        this.phase = 'height-input';
        return;
      }
      const pt = this.parsePoint(text);
      if (pt && pt.x !== undefined) {
        this.onClick(pt.x, pt.y);
      }
      return;
    }
    if (this.phase === 'justify-input') {
      this.justify = text.trim().toLowerCase() || 'left';
      this.phase = 'position';
      this.prompt('Specify start point: ');
      return;
    }
    if (this.phase === 'height-input') {
      const v = parseNumber(text);
      if (v !== null && v > 0) this.height = v;
      this.phase = 'position';
      this.prompt('Specify start point: ');
      return;
    }
    if (this.phase === 'height') {
      if (text === '') {
        // Accept default
      } else {
        const v = parseNumber(text);
        if (v !== null && v > 0) this.height = v;
      }
      this.phase = 'rotation';
      this.prompt(`Specify rotation angle <${this.rotation}>: `);
      return;
    }
    if (this.phase === 'rotation') {
      if (text !== '') {
        const v = parseNumber(text);
        if (v !== null) this.rotation = v;
      }
      this.phase = 'text';
      this.prompt('Enter text: ');
      return;
    }
    if (this.phase === 'text') {
      if (text === '') {
        this._commitText();
        this.finish();
        return;
      }
      this.textContent = text;
      this._commitText();
      this.prompt('Enter text (Enter to finish): ');
      // Move position down for next line
      this.position = { x: this.position.x, y: this.position.y - this.height * 1.6 };
    }
  }

  _commitText() {
    if (this.textContent && this.position) {
      this.engine.addEntity({
        type: 'text',
        x: this.position.x,
        y: this.position.y,
        text: this.textContent,
        height: this.height,
        rotation: this.rotation,
        justify: this.justify,
        style: 'Standard',
      });
      this.textContent = '';
    }
  }

  getPreview() {
    if (this.position && this.phase === 'text') {
      return [{
        type: 'text-preview',
        x: this.position.x, y: this.position.y,
        height: this.height,
        rotation: this.rotation,
        text: this.textContent || '|',
      }];
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MTEXT (multiline text) Command
// ═══════════════════════════════════════════════════════════════════════════════

export class MTextCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.corner1 = null;
    this.corner2 = null;
    this.textContent = '';
    this.height = 2.5;
    this.phase = 'corner1'; // 'corner1', 'corner2', 'text'
  }

  start() {
    const style = this.engine.textStyles.get('Standard');
    if (style) this.height = style.height;
    this.prompt('MTEXT — Specify first corner of text box: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'corner1') {
      this.corner1 = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'corner2';
      this.prompt('Specify opposite corner: ');
    } else if (this.phase === 'corner2') {
      this.corner2 = { x: wx, y: wy };
      this.phase = 'text';
      this.prompt('Enter text (Enter twice to finish): ');
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.phase === 'corner2' && this.corner1) {
      this.preview = {
        type: 'rectangle-preview',
        x1: this.corner1.x, y1: this.corner1.y,
        x2: wx, y2: wy,
      };
    }
  }

  onInput(text) {
    if (this.phase === 'text') {
      if (text === '') {
        // Finish
        if (this.textContent) {
          this.engine.addEntity({
            type: 'mtext',
            x: Math.min(this.corner1.x, this.corner2.x),
            y: Math.max(this.corner1.y, this.corner2.y),
            width: Math.abs(this.corner2.x - this.corner1.x),
            text: this.textContent,
            height: this.height,
            style: 'Standard',
          });
        }
        this.preview = null;
        this.finish();
      } else {
        this.textContent += (this.textContent ? '\n' : '') + text;
        this.prompt('Enter text (Enter twice to finish): ');
      }
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  getPreview() {
    if (this.preview) return [this.preview];
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HATCH Command
// ═══════════════════════════════════════════════════════════════════════════════

export class HatchCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.boundaryPoints = [];
    this.pattern = 'ANSI31';
    this.scale = 1;
    this.angle = 0;
    this.phase = 'pick'; // 'pick', 'pattern', 'scale', 'angle'
  }

  start() {
    this.prompt('HATCH — Pick internal point or [Pattern/Scale/Angle]: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'pick') {
      this.boundaryPoints.push({ x: wx, y: wy });
      this.setPoint(wx, wy);
      this.prompt('Pick another point or Enter to accept boundary: ');
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === '') {
      if (this.boundaryPoints.length >= 3) {
        this._createHatch();
      } else {
        this.message('Need at least 3 boundary points.');
      }
      return;
    }
    if (t === 'p' || t === 'pattern') {
      this.prompt('Specify pattern name: ');
      this.phase = 'pattern';
      return;
    }
    if (t === 's' || t === 'scale') {
      this.prompt('Specify pattern scale: ');
      this.phase = 'scale';
      return;
    }
    if (t === 'a' || t === 'angle') {
      this.prompt('Specify pattern angle: ');
      this.phase = 'angle';
      return;
    }
    if (this.phase === 'pattern') {
      this.pattern = text.trim();
      this.phase = 'pick';
      this.prompt('HATCH — Pick internal point or [Pattern/Scale/Angle]: ');
      return;
    }
    if (this.phase === 'scale') {
      const v = parseNumber(text);
      if (v !== null && v > 0) this.scale = v;
      this.phase = 'pick';
      this.prompt('HATCH — Pick internal point or [Pattern/Scale/Angle]: ');
      return;
    }
    if (this.phase === 'angle') {
      const v = parseNumber(text);
      if (v !== null) this.angle = v;
      this.phase = 'pick';
      this.prompt('HATCH — Pick internal point or [Pattern/Scale/Angle]: ');
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  _createHatch() {
    this.engine.addEntity({
      type: 'hatch',
      boundary: this.boundaryPoints.map(p => ({ x: p.x, y: p.y })),
      pattern: this.pattern,
      scale: this.scale,
      angle: this.angle,
    });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    if (this.boundaryPoints.length < 2) return [];
    const previews = [];
    for (let i = 0; i < this.boundaryPoints.length - 1; i++) {
      previews.push({
        type: 'line',
        x1: this.boundaryPoints[i].x, y1: this.boundaryPoints[i].y,
        x2: this.boundaryPoints[i + 1].x, y2: this.boundaryPoints[i + 1].y,
      });
    }
    return previews;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class TableCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.rows = 3;
    this.cols = 3;
    this.rowHeight = 5;
    this.colWidth = 25;
    this.insertionPoint = null;
    this.phase = 'rows'; // 'rows', 'cols', 'insert'
  }

  start() {
    this.prompt('TABLE — Specify number of rows: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'insert') {
      this.insertionPoint = { x: wx, y: wy };
      this._createTable();
    }
  }

  onInput(text) {
    if (this.phase === 'rows') {
      const v = parseInt(text, 10);
      if (v > 0) {
        this.rows = v;
        this.phase = 'cols';
        this.prompt('Specify number of columns: ');
      }
      return;
    }
    if (this.phase === 'cols') {
      const v = parseInt(text, 10);
      if (v > 0) {
        this.cols = v;
        this.phase = 'insert';
        this.prompt('Specify insertion point: ');
      }
      return;
    }
    if (this.phase === 'insert') {
      const pt = this.parsePoint(text);
      if (pt && pt.x !== undefined) {
        this.insertionPoint = { x: pt.x, y: pt.y };
        this._createTable();
      }
    }
  }

  _createTable() {
    this.engine.addEntity({
      type: 'table',
      x: this.insertionPoint.x,
      y: this.insertionPoint.y,
      rows: this.rows,
      cols: this.cols,
      rowHeight: this.rowHeight,
      colWidth: this.colWidth,
      cells: Array.from({ length: this.rows }, () =>
        Array.from({ length: this.cols }, () => ''),
      ),
    });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    if (this.phase === 'insert') {
      return [{
        type: 'table-preview',
        x: this._mouseX, y: this._mouseY,
        rows: this.rows, cols: this.cols,
        rowHeight: this.rowHeight, colWidth: this.colWidth,
      }];
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVISION CLOUD Command
// ═══════════════════════════════════════════════════════════════════════════════

export class RevCloudCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.points = [];
    this.arcLength = 5;
  }

  start() {
    this.prompt('REVCLOUD — Specify first point or [Arc length]: ');
  }

  onClick(wx, wy) {
    this.points.push({ x: wx, y: wy });
    this.setPoint(wx, wy);
    if (this.points.length === 1) {
      this.prompt('Trace cloud path... Enter to close: ');
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.points.length > 0) {
      const last = this.points[this.points.length - 1];
      const d = dist(last.x, last.y, wx, wy);
      // Auto-add points when mouse has moved far enough
      if (d >= this.arcLength) {
        this.points.push({ x: wx, y: wy });
        this.setPoint(wx, wy);
      }
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (t === '') {
      this._finishCloud();
      return;
    }
    if (t === 'a' || t === 'arc length') {
      this.prompt('Specify arc length: ');
      this.step = 10;
      return;
    }
    if (this.step === 10) {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this.arcLength = v;
        this.step = 0;
      }
      this.prompt('REVCLOUD — Specify first point: ');
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  onKey(key) {
    if (key === 'Enter' || key === 'Return') {
      this._finishCloud();
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  _finishCloud() {
    if (this.points.length < 3) {
      this.cancel();
      return;
    }
    // Create revision cloud as a polyline with bulge values for arcs
    const vertices = [];
    const n = this.points.length;
    for (let i = 0; i < n; i++) {
      const p = this.points[i];
      // Alternate bulge for cloud effect
      const bulge = (i % 2 === 0) ? 0.5 : -0.5;
      vertices.push({ x: p.x, y: p.y, bulge });
    }
    this.engine.addEntity({
      type: 'polyline',
      points: vertices,
      closed: true,
      globalWidth: 0,
      isRevCloud: true,
    });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    if (this.points.length < 2) return [];
    const previews = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      previews.push({
        type: 'line',
        x1: this.points[i].x, y1: this.points[i].y,
        x2: this.points[i + 1].x, y2: this.points[i + 1].y,
      });
    }
    return previews;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DONUT Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DonutCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.innerRadius = 0.5;
    this.outerRadius = 1.0;
    this.phase = 'inner'; // 'inner', 'outer', 'center'
  }

  start() {
    this.prompt(`DONUT — Specify inner radius <${this.innerRadius}>: `);
  }

  onClick(wx, wy) {
    if (this.phase === 'center') {
      this._createDonut(wx, wy);
      this.prompt('Specify center of donut (Enter to finish): ');
    }
  }

  onInput(text) {
    if (this.phase === 'inner') {
      if (text === '') {
        // Accept default
      } else {
        const v = parseNumber(text);
        if (v !== null && v >= 0) this.innerRadius = v;
      }
      this.phase = 'outer';
      this.prompt(`Specify outer radius <${this.outerRadius}>: `);
      return;
    }
    if (this.phase === 'outer') {
      if (text === '') {
        // Accept default
      } else {
        const v = parseNumber(text);
        if (v !== null && v > 0) this.outerRadius = v;
      }
      this.phase = 'center';
      this.prompt('Specify center of donut: ');
      return;
    }
    if (this.phase === 'center') {
      if (text === '') {
        this.finish();
        return;
      }
      const pt = this.parsePoint(text);
      if (pt && pt.x !== undefined) {
        this._createDonut(pt.x, pt.y);
        this.prompt('Specify center of donut (Enter to finish): ');
      }
    }
  }

  _createDonut(cx, cy) {
    // A donut is a closed polyline with two semicircular arcs (width = outer - inner)
    const avgR = (this.innerRadius + this.outerRadius) / 2;
    const width = this.outerRadius - this.innerRadius;
    this.engine.addEntity({
      type: 'polyline',
      points: [
        { x: cx + avgR, y: cy, bulge: 1 },
        { x: cx - avgR, y: cy, bulge: 1 },
      ],
      closed: true,
      globalWidth: width,
      isDonut: true,
    });
    this.setPoint(cx, cy);
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.phase === 'center') {
      const avgR = (this.innerRadius + this.outerRadius) / 2;
      this.preview = {
        type: 'circle',
        cx: wx, cy: wy,
        r: avgR,
      };
    }
  }

  getPreview() {
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADER Command
// ═══════════════════════════════════════════════════════════════════════════════

export class LeaderCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.points = [];
    this.text = '';
    this.phase = 'points'; // 'points', 'text'
  }

  start() {
    this.prompt('LEADER — Specify first leader point: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'points') {
      this.points.push({ x: wx, y: wy });
      this.setPoint(wx, wy);
      if (this.points.length === 1) {
        this.prompt('Specify next point: ');
      } else {
        this.prompt('Specify next point (Enter to add text): ');
      }
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.points.length > 0 && this.phase === 'points') {
      const last = this.points[this.points.length - 1];
      this.preview = { type: 'line', x1: last.x, y1: last.y, x2: wx, y2: wy };
    }
  }

  onInput(text) {
    if (this.phase === 'points') {
      if (text === '') {
        if (this.points.length >= 2) {
          this.phase = 'text';
          this.prompt('Enter leader text: ');
        }
        return;
      }
      const pt = this.parsePoint(text);
      if (pt && pt.x !== undefined) {
        this.onClick(pt.x, pt.y);
      }
      return;
    }
    if (this.phase === 'text') {
      this.text = text;
      this._createLeader();
    }
  }

  onKey(key) {
    if (key === 'Enter' || key === 'Return') {
      if (this.phase === 'points' && this.points.length >= 2) {
        this.phase = 'text';
        this.prompt('Enter leader text: ');
      }
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  _createLeader() {
    this.engine.addEntity({
      type: 'leader',
      points: this.points.map(p => ({ x: p.x, y: p.y })),
      text: this.text,
      arrowSize: 2.5,
      textHeight: 2.5,
    });
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
    return previews;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Registration helper
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register all draw commands on a CommandRegistry instance.
 * @param {import('./CommandRegistry.js').CommandRegistry} registry
 */
export function registerDrawCommands(registry) {
  registry.register('LINE',      ['L'],           LineCommand);
  registry.register('PLINE',     ['PL', 'POLYLINE'], PolylineCommand);
  registry.register('RECTANG',   ['REC', 'RECTANGLE'], RectangleCommand);
  registry.register('CIRCLE',    ['C'],           CircleCommand);
  registry.register('ARC',       ['A'],           ArcCommand);
  registry.register('ELLIPSE',   ['EL'],          EllipseCommand);
  registry.register('POLYGON',   ['POL'],         PolygonCommand);
  registry.register('SPLINE',    ['SPL'],         SplineCommand);
  registry.register('XLINE',     ['XL'],          XLineCommand);
  registry.register('RAY',       [],              RayCommand);
  registry.register('POINT',     ['PO'],          PointCommand);
  registry.register('DTEXT',     ['DT', 'TEXT'],  DTextCommand);
  registry.register('MTEXT',     ['MT', 'T'],     MTextCommand);
  registry.register('HATCH',     ['H', 'BH'],     HatchCommand);
  registry.register('TABLE',     ['TB'],          TableCommand);
  registry.register('REVCLOUD',  ['RC'],          RevCloudCommand);
  registry.register('DONUT',     ['DO'],          DonutCommand);
  registry.register('LEADER',    ['LE', 'QLEADER'], LeaderCommand);
}
