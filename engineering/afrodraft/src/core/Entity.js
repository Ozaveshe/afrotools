/**
 * AfroDraft v6 — Entity System
 * Base entity class and all CAD entity types.
 */

// ===================== BASE ENTITY =====================

export class BaseEntity {
  /**
   * @param {string} type
   * @param {Object} [props]
   */
  constructor(type, props = {}) {
    this.id = props.id || 0;
    this.type = type;
    this.layer = props.layer || 'Layer 0';
    this.color = props.color ? { ...props.color } : { r: 255, g: 255, b: 255, index: 7 };
    this.linetype = props.linetype || 'Continuous';
    this.lineweight = props.lineweight ?? 0.25;
    this.visible = props.visible ?? true;
    this.locked = props.locked ?? false;
  }

  getBounds() { return { minX: 0, minY: 0, maxX: 0, maxY: 0 }; }
  containsPoint(x, y, tolerance = 3) { return this.distanceTo(x, y) <= tolerance; }
  distanceTo(x, y) { return Infinity; }
  getSnapPoints() { return []; }
  getGripPoints() { return []; }
  transform(matrix) {}
  clone() { return new BaseEntity(this.type, this); }

  _baseProps() {
    return {
      id: this.id,
      type: this.type,
      layer: this.layer,
      color: { ...this.color },
      linetype: this.linetype,
      lineweight: this.lineweight,
      visible: this.visible,
      locked: this.locked,
    };
  }

  serialize() { return this._baseProps(); }

  static deserialize(data) {
    return new BaseEntity(data.type, data);
  }
}

// ===================== HELPERS =====================

function dist(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(px, py, ax, ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return dist(px, py, ax + t * dx, ay + t * dy);
}

function transformPt(x, y, m) {
  return {
    x: m[0] * x + m[1] * y + m[2],
    y: m[3] * x + m[4] * y + m[5],
  };
}

function normalizeAngle(a) {
  const TWO_PI = Math.PI * 2;
  a = a % TWO_PI;
  if (a < 0) a += TWO_PI;
  return a;
}

function angleInArc(angle, startAngle, endAngle) {
  const a = normalizeAngle(angle);
  const s = normalizeAngle(startAngle);
  const e = normalizeAngle(endAngle);
  if (s <= e) return a >= s && a <= e;
  return a >= s || a <= e;
}

// ===================== LINE ENTITY =====================

export class LineEntity extends BaseEntity {
  constructor(props = {}) {
    super('line', props);
    this.start = { x: props.start?.x ?? 0, y: props.start?.y ?? 0 };
    this.end = { x: props.end?.x ?? 0, y: props.end?.y ?? 0 };
  }

  getBounds() {
    return {
      minX: Math.min(this.start.x, this.end.x),
      minY: Math.min(this.start.y, this.end.y),
      maxX: Math.max(this.start.x, this.end.x),
      maxY: Math.max(this.start.y, this.end.y),
    };
  }

  distanceTo(x, y) {
    return pointToSegmentDist(x, y, this.start.x, this.start.y, this.end.x, this.end.y);
  }

  getSnapPoints() {
    const mx = (this.start.x + this.end.x) / 2;
    const my = (this.start.y + this.end.y) / 2;
    return [
      { type: 'endpoint', x: this.start.x, y: this.start.y },
      { type: 'endpoint', x: this.end.x, y: this.end.y },
      { type: 'midpoint', x: mx, y: my },
    ];
  }

  getGripPoints() {
    const mx = (this.start.x + this.end.x) / 2;
    const my = (this.start.y + this.end.y) / 2;
    return [
      { x: this.start.x, y: this.start.y, key: 'start' },
      { x: this.end.x, y: this.end.y, key: 'end' },
      { x: mx, y: my, key: 'mid' },
    ];
  }

  transform(matrix) {
    const s = transformPt(this.start.x, this.start.y, matrix);
    const e = transformPt(this.end.x, this.end.y, matrix);
    this.start = s;
    this.end = e;
  }

  clone() {
    return new LineEntity({ ...this._baseProps(), start: { ...this.start }, end: { ...this.end } });
  }

  serialize() {
    return { ...this._baseProps(), start: { ...this.start }, end: { ...this.end } };
  }

  static deserialize(data) {
    return new LineEntity(data);
  }
}

// ===================== POLYLINE ENTITY =====================

export class PolylineEntity extends BaseEntity {
  constructor(props = {}) {
    super('polyline', props);
    this.vertices = (props.vertices || []).map(v => ({ x: v.x, y: v.y, bulge: v.bulge || 0 }));
    this.closed = props.closed ?? false;
    this.width = props.width ?? 0;
  }

  getBounds() {
    if (this.vertices.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const v of this.vertices) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
    }
    return { minX, minY, maxX, maxY };
  }

  distanceTo(x, y) {
    let minD = Infinity;
    const n = this.vertices.length;
    const segs = this.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = this.vertices[i];
      const b = this.vertices[(i + 1) % n];
      const d = pointToSegmentDist(x, y, a.x, a.y, b.x, b.y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  getSnapPoints() {
    const pts = [];
    for (const v of this.vertices) {
      pts.push({ type: 'endpoint', x: v.x, y: v.y });
    }
    const n = this.vertices.length;
    const segs = this.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = this.vertices[i];
      const b = this.vertices[(i + 1) % n];
      pts.push({ type: 'midpoint', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    }
    return pts;
  }

  getGripPoints() {
    return this.vertices.map((v, i) => ({ x: v.x, y: v.y, key: `v${i}` }));
  }

  transform(matrix) {
    for (let i = 0; i < this.vertices.length; i++) {
      const p = transformPt(this.vertices[i].x, this.vertices[i].y, matrix);
      this.vertices[i].x = p.x;
      this.vertices[i].y = p.y;
    }
  }

  clone() {
    return new PolylineEntity({
      ...this._baseProps(),
      vertices: this.vertices.map(v => ({ ...v })),
      closed: this.closed,
      width: this.width,
    });
  }

  serialize() {
    return {
      ...this._baseProps(),
      vertices: this.vertices.map(v => ({ ...v })),
      closed: this.closed,
      width: this.width,
    };
  }

  static deserialize(data) { return new PolylineEntity(data); }
}

// ===================== CIRCLE ENTITY =====================

export class CircleEntity extends BaseEntity {
  constructor(props = {}) {
    super('circle', props);
    this.center = { x: props.center?.x ?? 0, y: props.center?.y ?? 0 };
    this.radius = props.radius ?? 0;
  }

  getBounds() {
    return {
      minX: this.center.x - this.radius,
      minY: this.center.y - this.radius,
      maxX: this.center.x + this.radius,
      maxY: this.center.y + this.radius,
    };
  }

  distanceTo(x, y) {
    return Math.abs(dist(x, y, this.center.x, this.center.y) - this.radius);
  }

  getSnapPoints() {
    const cx = this.center.x, cy = this.center.y, r = this.radius;
    return [
      { type: 'center', x: cx, y: cy },
      { type: 'quadrant', x: cx + r, y: cy },
      { type: 'quadrant', x: cx, y: cy + r },
      { type: 'quadrant', x: cx - r, y: cy },
      { type: 'quadrant', x: cx, y: cy - r },
    ];
  }

  getGripPoints() {
    const cx = this.center.x, cy = this.center.y, r = this.radius;
    return [
      { x: cx, y: cy, key: 'center' },
      { x: cx + r, y: cy, key: 'right' },
      { x: cx, y: cy + r, key: 'top' },
      { x: cx - r, y: cy, key: 'left' },
      { x: cx, y: cy - r, key: 'bottom' },
    ];
  }

  transform(matrix) {
    const c = transformPt(this.center.x, this.center.y, matrix);
    const edge = transformPt(this.center.x + this.radius, this.center.y, matrix);
    this.center = c;
    this.radius = dist(c.x, c.y, edge.x, edge.y);
  }

  clone() {
    return new CircleEntity({ ...this._baseProps(), center: { ...this.center }, radius: this.radius });
  }

  serialize() {
    return { ...this._baseProps(), center: { ...this.center }, radius: this.radius };
  }

  static deserialize(data) { return new CircleEntity(data); }
}

// ===================== ARC ENTITY =====================

export class ArcEntity extends BaseEntity {
  constructor(props = {}) {
    super('arc', props);
    this.center = { x: props.center?.x ?? 0, y: props.center?.y ?? 0 };
    this.radius = props.radius ?? 0;
    this.startAngle = props.startAngle ?? 0;
    this.endAngle = props.endAngle ?? Math.PI;
  }

  getBounds() {
    const cx = this.center.x, cy = this.center.y, r = this.radius;
    const pts = [this._pointAtAngle(this.startAngle), this._pointAtAngle(this.endAngle)];
    // Check if cardinal angles are within the arc
    for (const a of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
      if (angleInArc(a, this.startAngle, this.endAngle)) {
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }

  _pointAtAngle(a) {
    return { x: this.center.x + this.radius * Math.cos(a), y: this.center.y + this.radius * Math.sin(a) };
  }

  distanceTo(x, y) {
    const d = dist(x, y, this.center.x, this.center.y);
    const angle = Math.atan2(y - this.center.y, x - this.center.x);
    if (angleInArc(angle, this.startAngle, this.endAngle)) {
      return Math.abs(d - this.radius);
    }
    const sp = this._pointAtAngle(this.startAngle);
    const ep = this._pointAtAngle(this.endAngle);
    return Math.min(dist(x, y, sp.x, sp.y), dist(x, y, ep.x, ep.y));
  }

  getSnapPoints() {
    const sp = this._pointAtAngle(this.startAngle);
    const ep = this._pointAtAngle(this.endAngle);
    const midA = (this.startAngle + this.endAngle) / 2;
    const mp = this._pointAtAngle(midA);
    return [
      { type: 'endpoint', x: sp.x, y: sp.y },
      { type: 'endpoint', x: ep.x, y: ep.y },
      { type: 'midpoint', x: mp.x, y: mp.y },
      { type: 'center', x: this.center.x, y: this.center.y },
    ];
  }

  getGripPoints() {
    const sp = this._pointAtAngle(this.startAngle);
    const ep = this._pointAtAngle(this.endAngle);
    const midA = (this.startAngle + this.endAngle) / 2;
    const mp = this._pointAtAngle(midA);
    return [
      { x: sp.x, y: sp.y, key: 'start' },
      { x: ep.x, y: ep.y, key: 'end' },
      { x: mp.x, y: mp.y, key: 'mid' },
      { x: this.center.x, y: this.center.y, key: 'center' },
    ];
  }

  transform(matrix) {
    const c = transformPt(this.center.x, this.center.y, matrix);
    const sp = this._pointAtAngle(this.startAngle);
    const ep = this._pointAtAngle(this.endAngle);
    const tsp = transformPt(sp.x, sp.y, matrix);
    const tep = transformPt(ep.x, ep.y, matrix);
    this.center = c;
    this.radius = dist(c.x, c.y, tsp.x, tsp.y);
    this.startAngle = Math.atan2(tsp.y - c.y, tsp.x - c.x);
    this.endAngle = Math.atan2(tep.y - c.y, tep.x - c.x);
  }

  clone() {
    return new ArcEntity({ ...this._baseProps(), center: { ...this.center }, radius: this.radius, startAngle: this.startAngle, endAngle: this.endAngle });
  }

  serialize() {
    return { ...this._baseProps(), center: { ...this.center }, radius: this.radius, startAngle: this.startAngle, endAngle: this.endAngle };
  }

  static deserialize(data) { return new ArcEntity(data); }
}

// ===================== ELLIPSE ENTITY =====================

export class EllipseEntity extends BaseEntity {
  constructor(props = {}) {
    super('ellipse', props);
    this.center = { x: props.center?.x ?? 0, y: props.center?.y ?? 0 };
    this.majorAxis = { x: props.majorAxis?.x ?? 10, y: props.majorAxis?.y ?? 0 };
    this.ratio = props.ratio ?? 0.5;
    this.startAngle = props.startAngle ?? 0;
    this.endAngle = props.endAngle ?? Math.PI * 2;
  }

  getBounds() {
    const a = Math.sqrt(this.majorAxis.x ** 2 + this.majorAxis.y ** 2);
    const b = a * this.ratio;
    const rot = Math.atan2(this.majorAxis.y, this.majorAxis.x);
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const hw = Math.sqrt((a * cosR) ** 2 + (b * sinR) ** 2);
    const hh = Math.sqrt((a * sinR) ** 2 + (b * cosR) ** 2);
    return {
      minX: this.center.x - hw, minY: this.center.y - hh,
      maxX: this.center.x + hw, maxY: this.center.y + hh,
    };
  }

  _pointAtParam(t) {
    const a = Math.sqrt(this.majorAxis.x ** 2 + this.majorAxis.y ** 2);
    const b = a * this.ratio;
    const rot = Math.atan2(this.majorAxis.y, this.majorAxis.x);
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const lx = a * Math.cos(t), ly = b * Math.sin(t);
    return {
      x: this.center.x + lx * cosR - ly * sinR,
      y: this.center.y + lx * sinR + ly * cosR,
    };
  }

  distanceTo(x, y) {
    // Approximate: sample points along ellipse
    let minD = Infinity;
    const steps = 64;
    const sa = this.startAngle, ea = this.endAngle;
    const span = ea > sa ? ea - sa : ea - sa + Math.PI * 2;
    for (let i = 0; i <= steps; i++) {
      const t = sa + (span * i) / steps;
      const p = this._pointAtParam(t);
      const d = dist(x, y, p.x, p.y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  getSnapPoints() {
    const pts = [{ type: 'center', x: this.center.x, y: this.center.y }];
    if (Math.abs(this.endAngle - this.startAngle - Math.PI * 2) < 0.001) {
      for (const t of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
        const p = this._pointAtParam(t);
        pts.push({ type: 'quadrant', x: p.x, y: p.y });
      }
    } else {
      const sp = this._pointAtParam(this.startAngle);
      const ep = this._pointAtParam(this.endAngle);
      pts.push({ type: 'endpoint', x: sp.x, y: sp.y });
      pts.push({ type: 'endpoint', x: ep.x, y: ep.y });
    }
    return pts;
  }

  getGripPoints() {
    return this.getSnapPoints().map((p, i) => ({ x: p.x, y: p.y, key: `snap${i}` }));
  }

  transform(matrix) {
    const c = transformPt(this.center.x, this.center.y, matrix);
    const majEnd = { x: this.center.x + this.majorAxis.x, y: this.center.y + this.majorAxis.y };
    const tMajEnd = transformPt(majEnd.x, majEnd.y, matrix);
    this.center = c;
    this.majorAxis = { x: tMajEnd.x - c.x, y: tMajEnd.y - c.y };
  }

  clone() {
    return new EllipseEntity({ ...this._baseProps(), center: { ...this.center }, majorAxis: { ...this.majorAxis }, ratio: this.ratio, startAngle: this.startAngle, endAngle: this.endAngle });
  }

  serialize() {
    return { ...this._baseProps(), center: { ...this.center }, majorAxis: { ...this.majorAxis }, ratio: this.ratio, startAngle: this.startAngle, endAngle: this.endAngle };
  }

  static deserialize(data) { return new EllipseEntity(data); }
}

// ===================== POINT ENTITY =====================

export class PointEntity extends BaseEntity {
  constructor(props = {}) {
    super('point', props);
    this.position = { x: props.position?.x ?? 0, y: props.position?.y ?? 0 };
    this.pointStyle = props.pointStyle ?? 0; // 0=dot, 1=cross, 2=x, 3=plus
  }

  getBounds() {
    return { minX: this.position.x, minY: this.position.y, maxX: this.position.x, maxY: this.position.y };
  }

  distanceTo(x, y) { return dist(x, y, this.position.x, this.position.y); }

  getSnapPoints() { return [{ type: 'node', x: this.position.x, y: this.position.y }]; }
  getGripPoints() { return [{ x: this.position.x, y: this.position.y, key: 'position' }]; }

  transform(matrix) {
    const p = transformPt(this.position.x, this.position.y, matrix);
    this.position = p;
  }

  clone() { return new PointEntity({ ...this._baseProps(), position: { ...this.position }, pointStyle: this.pointStyle }); }

  serialize() { return { ...this._baseProps(), position: { ...this.position }, pointStyle: this.pointStyle }; }
  static deserialize(data) { return new PointEntity(data); }
}

// ===================== TEXT ENTITY =====================

export class TextEntity extends BaseEntity {
  constructor(props = {}) {
    super('text', props);
    this.position = { x: props.position?.x ?? 0, y: props.position?.y ?? 0 };
    this.text = props.text ?? '';
    this.height = props.height ?? 2.5;
    this.rotation = props.rotation ?? 0;
    this.style = props.style ?? 'Standard';
    this.justification = props.justification ?? 'left'; // left, center, right, middle
    this.widthFactor = props.widthFactor ?? 1.0;
    this.oblique = props.oblique ?? 0;
  }

  getBounds() {
    const approxWidth = this.text.length * this.height * 0.6 * this.widthFactor;
    const h = this.height;
    const cos = Math.cos(this.rotation), sin = Math.sin(this.rotation);
    // Corners of unrotated bbox
    const corners = [
      { x: 0, y: 0 },
      { x: approxWidth, y: 0 },
      { x: approxWidth, y: h },
      { x: 0, y: h },
    ];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of corners) {
      const rx = this.position.x + c.x * cos - c.y * sin;
      const ry = this.position.y + c.x * sin + c.y * cos;
      if (rx < minX) minX = rx;
      if (ry < minY) minY = ry;
      if (rx > maxX) maxX = rx;
      if (ry > maxY) maxY = ry;
    }
    return { minX, minY, maxX, maxY };
  }

  distanceTo(x, y) {
    const b = this.getBounds();
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cy = Math.max(b.minY, Math.min(y, b.maxY));
    return dist(x, y, cx, cy);
  }

  getSnapPoints() { return [{ type: 'insertion', x: this.position.x, y: this.position.y }]; }
  getGripPoints() { return [{ x: this.position.x, y: this.position.y, key: 'position' }]; }

  transform(matrix) {
    const p = transformPt(this.position.x, this.position.y, matrix);
    this.position = p;
    // Rotation from matrix
    const rot = Math.atan2(matrix[3], matrix[0]);
    if (Math.abs(rot) > 1e-10) this.rotation += rot;
  }

  clone() {
    return new TextEntity({ ...this._baseProps(), position: { ...this.position }, text: this.text, height: this.height, rotation: this.rotation, style: this.style, justification: this.justification, widthFactor: this.widthFactor, oblique: this.oblique });
  }

  serialize() {
    return { ...this._baseProps(), position: { ...this.position }, text: this.text, height: this.height, rotation: this.rotation, style: this.style, justification: this.justification, widthFactor: this.widthFactor, oblique: this.oblique };
  }

  static deserialize(data) { return new TextEntity(data); }
}

// ===================== MTEXT ENTITY =====================

export class MTextEntity extends BaseEntity {
  constructor(props = {}) {
    super('mtext', props);
    this.position = { x: props.position?.x ?? 0, y: props.position?.y ?? 0 };
    this.text = props.text ?? '';
    this.width = props.width ?? 100;
    this.height = props.height ?? 2.5;
    this.style = props.style ?? 'Standard';
    this.rotation = props.rotation ?? 0;
    this.attachment = props.attachment ?? 'topLeft'; // topLeft, topCenter, topRight, middleLeft, etc.
    this.lineSpacing = props.lineSpacing ?? 1.0;
  }

  getBounds() {
    const lines = Math.max(1, Math.ceil((this.text.length * this.height * 0.6) / this.width));
    const totalH = lines * this.height * this.lineSpacing;
    return {
      minX: this.position.x, minY: this.position.y - totalH,
      maxX: this.position.x + this.width, maxY: this.position.y,
    };
  }

  distanceTo(x, y) {
    const b = this.getBounds();
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cy = Math.max(b.minY, Math.min(y, b.maxY));
    return dist(x, y, cx, cy);
  }

  getSnapPoints() { return [{ type: 'insertion', x: this.position.x, y: this.position.y }]; }
  getGripPoints() { return [{ x: this.position.x, y: this.position.y, key: 'position' }]; }

  transform(matrix) {
    this.position = transformPt(this.position.x, this.position.y, matrix);
  }

  clone() {
    return new MTextEntity({ ...this._baseProps(), position: { ...this.position }, text: this.text, width: this.width, height: this.height, style: this.style, rotation: this.rotation, attachment: this.attachment, lineSpacing: this.lineSpacing });
  }

  serialize() {
    return { ...this._baseProps(), position: { ...this.position }, text: this.text, width: this.width, height: this.height, style: this.style, rotation: this.rotation, attachment: this.attachment, lineSpacing: this.lineSpacing };
  }

  static deserialize(data) { return new MTextEntity(data); }
}

// ===================== DIMENSION ENTITY =====================

export class DimensionEntity extends BaseEntity {
  constructor(props = {}) {
    super('dimension', props);
    this.dimType = props.dimType ?? 'linear'; // linear, aligned, angular, radius, diameter, ordinate
    this.defPoints = (props.defPoints || []).map(p => ({ x: p.x, y: p.y }));
    this.text = props.text ?? '';       // override text (empty = auto)
    this.textPosition = props.textPosition ? { ...props.textPosition } : null;
    this.style = props.style ?? 'Standard';
    this.rotation = props.rotation ?? 0;
  }

  getBounds() {
    if (this.defPoints.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.defPoints) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    // Pad for text/arrows
    const pad = 5;
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
  }

  distanceTo(x, y) {
    let minD = Infinity;
    for (let i = 0; i < this.defPoints.length - 1; i++) {
      const d = pointToSegmentDist(x, y, this.defPoints[i].x, this.defPoints[i].y, this.defPoints[i + 1].x, this.defPoints[i + 1].y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  getSnapPoints() {
    return this.defPoints.map(p => ({ type: 'endpoint', x: p.x, y: p.y }));
  }

  getGripPoints() {
    return this.defPoints.map((p, i) => ({ x: p.x, y: p.y, key: `def${i}` }));
  }

  transform(matrix) {
    for (let i = 0; i < this.defPoints.length; i++) {
      this.defPoints[i] = transformPt(this.defPoints[i].x, this.defPoints[i].y, matrix);
    }
    if (this.textPosition) {
      this.textPosition = transformPt(this.textPosition.x, this.textPosition.y, matrix);
    }
  }

  clone() {
    return new DimensionEntity({ ...this._baseProps(), dimType: this.dimType, defPoints: this.defPoints.map(p => ({ ...p })), text: this.text, textPosition: this.textPosition ? { ...this.textPosition } : null, style: this.style, rotation: this.rotation });
  }

  serialize() {
    return { ...this._baseProps(), dimType: this.dimType, defPoints: this.defPoints.map(p => ({ ...p })), text: this.text, textPosition: this.textPosition ? { ...this.textPosition } : null, style: this.style, rotation: this.rotation };
  }

  static deserialize(data) { return new DimensionEntity(data); }
}

// ===================== HATCH ENTITY =====================

export class HatchEntity extends BaseEntity {
  constructor(props = {}) {
    super('hatch', props);
    this.boundary = (props.boundary || []).map(p => ({ x: p.x, y: p.y }));
    this.pattern = props.pattern ?? 'ANSI31';
    this.scale = props.scale ?? 1;
    this.angle = props.angle ?? 0;
    this.solid = props.solid ?? false;
  }

  getBounds() {
    if (this.boundary.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.boundary) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }

  distanceTo(x, y) {
    // Distance to boundary edges
    let minD = Infinity;
    const n = this.boundary.length;
    for (let i = 0; i < n; i++) {
      const a = this.boundary[i], b = this.boundary[(i + 1) % n];
      const d = pointToSegmentDist(x, y, a.x, a.y, b.x, b.y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  getSnapPoints() { return []; }
  getGripPoints() { return this.boundary.map((p, i) => ({ x: p.x, y: p.y, key: `b${i}` })); }

  transform(matrix) {
    for (let i = 0; i < this.boundary.length; i++) {
      this.boundary[i] = transformPt(this.boundary[i].x, this.boundary[i].y, matrix);
    }
  }

  clone() {
    return new HatchEntity({ ...this._baseProps(), boundary: this.boundary.map(p => ({ ...p })), pattern: this.pattern, scale: this.scale, angle: this.angle, solid: this.solid });
  }

  serialize() {
    return { ...this._baseProps(), boundary: this.boundary.map(p => ({ ...p })), pattern: this.pattern, scale: this.scale, angle: this.angle, solid: this.solid };
  }

  static deserialize(data) { return new HatchEntity(data); }
}

// ===================== BLOCK REFERENCE ENTITY =====================

export class BlockRefEntity extends BaseEntity {
  constructor(props = {}) {
    super('blockref', props);
    this.blockName = props.blockName ?? '';
    this.insertPoint = { x: props.insertPoint?.x ?? 0, y: props.insertPoint?.y ?? 0 };
    this.scale = { x: props.scale?.x ?? 1, y: props.scale?.y ?? 1 };
    this.rotation = props.rotation ?? 0;
    this.attributes = props.attributes ? { ...props.attributes } : {};
  }

  getBounds() {
    // Approximate: insert point +/- scaled extent
    const s = Math.max(Math.abs(this.scale.x), Math.abs(this.scale.y)) * 10;
    return {
      minX: this.insertPoint.x - s, minY: this.insertPoint.y - s,
      maxX: this.insertPoint.x + s, maxY: this.insertPoint.y + s,
    };
  }

  distanceTo(x, y) { return dist(x, y, this.insertPoint.x, this.insertPoint.y); }

  getSnapPoints() { return [{ type: 'insertion', x: this.insertPoint.x, y: this.insertPoint.y }]; }
  getGripPoints() { return [{ x: this.insertPoint.x, y: this.insertPoint.y, key: 'insert' }]; }

  transform(matrix) {
    this.insertPoint = transformPt(this.insertPoint.x, this.insertPoint.y, matrix);
    const rot = Math.atan2(matrix[3], matrix[0]);
    if (Math.abs(rot) > 1e-10) this.rotation += rot;
  }

  clone() {
    return new BlockRefEntity({ ...this._baseProps(), blockName: this.blockName, insertPoint: { ...this.insertPoint }, scale: { ...this.scale }, rotation: this.rotation, attributes: { ...this.attributes } });
  }

  serialize() {
    return { ...this._baseProps(), blockName: this.blockName, insertPoint: { ...this.insertPoint }, scale: { ...this.scale }, rotation: this.rotation, attributes: { ...this.attributes } };
  }

  static deserialize(data) { return new BlockRefEntity(data); }
}

// ===================== SPLINE ENTITY =====================

export class SplineEntity extends BaseEntity {
  constructor(props = {}) {
    super('spline', props);
    this.controlPoints = (props.controlPoints || []).map(p => ({ x: p.x, y: p.y }));
    this.degree = props.degree ?? 3;
    this.knots = props.knots ? [...props.knots] : [];
    this.fitPoints = (props.fitPoints || []).map(p => ({ x: p.x, y: p.y }));
    this.closed = props.closed ?? false;
    this._generateKnots();
  }

  _generateKnots() {
    if (this.knots.length > 0) return;
    const n = this.controlPoints.length;
    if (n === 0) return;
    const k = this.degree + 1;
    const total = n + k;
    this.knots = [];
    for (let i = 0; i < total; i++) {
      if (i < k) this.knots.push(0);
      else if (i >= n) this.knots.push(n - k + 1);
      else this.knots.push(i - k + 1);
    }
  }

  _evaluatePoint(t) {
    const pts = this.controlPoints;
    const n = pts.length;
    if (n === 0) return { x: 0, y: 0 };
    const k = this.degree;
    const knots = this.knots;

    // De Boor's algorithm
    const d = pts.map(p => ({ x: p.x, y: p.y }));
    const knotSpan = Math.min(Math.max(k, Math.floor(t) + k), n - 1);

    for (let r = 1; r <= k; r++) {
      for (let j = knotSpan; j >= knotSpan - k + r; j--) {
        const idx = Math.max(0, Math.min(j, knots.length - 1));
        const idxPK = Math.max(0, Math.min(j + k - r + 1, knots.length - 1));
        const denom = knots[idxPK] - knots[idx];
        const alpha = denom === 0 ? 0 : (t - knots[idx]) / denom;
        const jIdx = Math.min(j, d.length - 1);
        const jM1 = Math.max(0, jIdx - 1);
        d[jIdx] = {
          x: (1 - alpha) * d[jM1].x + alpha * d[jIdx].x,
          y: (1 - alpha) * d[jM1].y + alpha * d[jIdx].y,
        };
      }
    }
    const idx = Math.min(knotSpan, d.length - 1);
    return d[idx];
  }

  getBounds() {
    if (this.controlPoints.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    // Use control points as conservative bounds
    for (const p of this.controlPoints) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }

  distanceTo(x, y) {
    let minD = Infinity;
    const steps = Math.max(32, this.controlPoints.length * 8);
    const maxT = this.controlPoints.length - this.degree;
    for (let i = 0; i <= steps; i++) {
      const t = (maxT * i) / steps;
      const p = this._evaluatePoint(t);
      const d = dist(x, y, p.x, p.y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  getSnapPoints() {
    const pts = [];
    if (this.controlPoints.length > 0) {
      const first = this.controlPoints[0];
      const last = this.controlPoints[this.controlPoints.length - 1];
      pts.push({ type: 'endpoint', x: first.x, y: first.y });
      pts.push({ type: 'endpoint', x: last.x, y: last.y });
    }
    for (const p of this.fitPoints) {
      pts.push({ type: 'node', x: p.x, y: p.y });
    }
    return pts;
  }

  getGripPoints() {
    return this.controlPoints.map((p, i) => ({ x: p.x, y: p.y, key: `cp${i}` }));
  }

  transform(matrix) {
    for (let i = 0; i < this.controlPoints.length; i++) {
      this.controlPoints[i] = transformPt(this.controlPoints[i].x, this.controlPoints[i].y, matrix);
    }
    for (let i = 0; i < this.fitPoints.length; i++) {
      this.fitPoints[i] = transformPt(this.fitPoints[i].x, this.fitPoints[i].y, matrix);
    }
  }

  clone() {
    return new SplineEntity({ ...this._baseProps(), controlPoints: this.controlPoints.map(p => ({ ...p })), degree: this.degree, knots: [...this.knots], fitPoints: this.fitPoints.map(p => ({ ...p })), closed: this.closed });
  }

  serialize() {
    return { ...this._baseProps(), controlPoints: this.controlPoints.map(p => ({ ...p })), degree: this.degree, knots: [...this.knots], fitPoints: this.fitPoints.map(p => ({ ...p })), closed: this.closed };
  }

  static deserialize(data) { return new SplineEntity(data); }
}

// ===================== CONSTRUCTION LINE (XLINE) ENTITY =====================

export class ConstructionLineEntity extends BaseEntity {
  constructor(props = {}) {
    super('xline', props);
    this.point = { x: props.point?.x ?? 0, y: props.point?.y ?? 0 };
    this.direction = { x: props.direction?.x ?? 1, y: props.direction?.y ?? 0 };
  }

  getBounds() {
    // Infinite line — return a large bounding box
    const BIG = 1e8;
    return { minX: -BIG, minY: -BIG, maxX: BIG, maxY: BIG };
  }

  distanceTo(x, y) {
    const dx = this.direction.x, dy = this.direction.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return dist(x, y, this.point.x, this.point.y);
    // Distance from point to infinite line
    return Math.abs((x - this.point.x) * dy - (y - this.point.y) * dx) / len;
  }

  getSnapPoints() { return [{ type: 'midpoint', x: this.point.x, y: this.point.y }]; }
  getGripPoints() { return [{ x: this.point.x, y: this.point.y, key: 'point' }]; }

  transform(matrix) {
    const p = transformPt(this.point.x, this.point.y, matrix);
    const p2 = transformPt(this.point.x + this.direction.x, this.point.y + this.direction.y, matrix);
    this.point = p;
    this.direction = { x: p2.x - p.x, y: p2.y - p.y };
  }

  clone() {
    return new ConstructionLineEntity({ ...this._baseProps(), point: { ...this.point }, direction: { ...this.direction } });
  }

  serialize() { return { ...this._baseProps(), point: { ...this.point }, direction: { ...this.direction } }; }
  static deserialize(data) { return new ConstructionLineEntity(data); }
}

// ===================== RAY ENTITY =====================

export class RayEntity extends BaseEntity {
  constructor(props = {}) {
    super('ray', props);
    this.point = { x: props.point?.x ?? 0, y: props.point?.y ?? 0 };
    this.direction = { x: props.direction?.x ?? 1, y: props.direction?.y ?? 0 };
  }

  getBounds() {
    const BIG = 1e8;
    const dx = this.direction.x, dy = this.direction.y;
    return {
      minX: Math.min(this.point.x, this.point.x + dx * BIG),
      minY: Math.min(this.point.y, this.point.y + dy * BIG),
      maxX: Math.max(this.point.x, this.point.x + dx * BIG),
      maxY: Math.max(this.point.y, this.point.y + dy * BIG),
    };
  }

  distanceTo(x, y) {
    const dx = this.direction.x, dy = this.direction.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return dist(x, y, this.point.x, this.point.y);
    // Project onto ray
    const t = ((x - this.point.x) * dx + (y - this.point.y) * dy) / lenSq;
    if (t < 0) return dist(x, y, this.point.x, this.point.y);
    const px = this.point.x + t * dx, py = this.point.y + t * dy;
    return dist(x, y, px, py);
  }

  getSnapPoints() { return [{ type: 'endpoint', x: this.point.x, y: this.point.y }]; }
  getGripPoints() { return [{ x: this.point.x, y: this.point.y, key: 'point' }]; }

  transform(matrix) {
    const p = transformPt(this.point.x, this.point.y, matrix);
    const p2 = transformPt(this.point.x + this.direction.x, this.point.y + this.direction.y, matrix);
    this.point = p;
    this.direction = { x: p2.x - p.x, y: p2.y - p.y };
  }

  clone() {
    return new RayEntity({ ...this._baseProps(), point: { ...this.point }, direction: { ...this.direction } });
  }

  serialize() { return { ...this._baseProps(), point: { ...this.point }, direction: { ...this.direction } }; }
  static deserialize(data) { return new RayEntity(data); }
}

// ===================== IMAGE ENTITY =====================

export class ImageEntity extends BaseEntity {
  constructor(props = {}) {
    super('image', props);
    this.position = { x: props.position?.x ?? 0, y: props.position?.y ?? 0 };
    this.width = props.width ?? 100;
    this.height = props.height ?? 100;
    this.src = props.src ?? '';
    this.opacity = props.opacity ?? 1.0;
    this.rotation = props.rotation ?? 0;
  }

  getBounds() {
    // Simplified (no rotation)
    return {
      minX: this.position.x, minY: this.position.y,
      maxX: this.position.x + this.width, maxY: this.position.y + this.height,
    };
  }

  distanceTo(x, y) {
    const b = this.getBounds();
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cy = Math.max(b.minY, Math.min(y, b.maxY));
    return dist(x, y, cx, cy);
  }

  getSnapPoints() {
    const p = this.position;
    return [
      { type: 'insertion', x: p.x, y: p.y },
      { type: 'endpoint', x: p.x + this.width, y: p.y },
      { type: 'endpoint', x: p.x + this.width, y: p.y + this.height },
      { type: 'endpoint', x: p.x, y: p.y + this.height },
    ];
  }

  getGripPoints() {
    return this.getSnapPoints().map((s, i) => ({ x: s.x, y: s.y, key: `corner${i}` }));
  }

  transform(matrix) {
    this.position = transformPt(this.position.x, this.position.y, matrix);
  }

  clone() {
    return new ImageEntity({ ...this._baseProps(), position: { ...this.position }, width: this.width, height: this.height, src: this.src, opacity: this.opacity, rotation: this.rotation });
  }

  serialize() {
    return { ...this._baseProps(), position: { ...this.position }, width: this.width, height: this.height, src: this.src, opacity: this.opacity, rotation: this.rotation };
  }

  static deserialize(data) { return new ImageEntity(data); }
}

// ===================== TABLE ENTITY =====================

export class TableEntity extends BaseEntity {
  constructor(props = {}) {
    super('table', props);
    this.position = { x: props.position?.x ?? 0, y: props.position?.y ?? 0 };
    this.rows = props.rows ?? 3;
    this.cols = props.cols ?? 3;
    this.rowHeight = props.rowHeight ?? 8;
    this.colWidth = props.colWidth ?? 30;
    this.cellData = props.cellData ? props.cellData.map(r => [...r]) : this._emptyGrid();
    this.styles = props.styles ?? { textHeight: 2.5, headerHeight: 10 };
  }

  _emptyGrid() {
    const grid = [];
    for (let r = 0; r < this.rows; r++) {
      grid.push(new Array(this.cols).fill(''));
    }
    return grid;
  }

  getBounds() {
    return {
      minX: this.position.x,
      minY: this.position.y - this.rows * this.rowHeight,
      maxX: this.position.x + this.cols * this.colWidth,
      maxY: this.position.y,
    };
  }

  distanceTo(x, y) {
    const b = this.getBounds();
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cy = Math.max(b.minY, Math.min(y, b.maxY));
    return dist(x, y, cx, cy);
  }

  getSnapPoints() { return [{ type: 'insertion', x: this.position.x, y: this.position.y }]; }
  getGripPoints() { return [{ x: this.position.x, y: this.position.y, key: 'position' }]; }

  transform(matrix) {
    this.position = transformPt(this.position.x, this.position.y, matrix);
  }

  clone() {
    return new TableEntity({ ...this._baseProps(), position: { ...this.position }, rows: this.rows, cols: this.cols, rowHeight: this.rowHeight, colWidth: this.colWidth, cellData: this.cellData.map(r => [...r]), styles: { ...this.styles } });
  }

  serialize() {
    return { ...this._baseProps(), position: { ...this.position }, rows: this.rows, cols: this.cols, rowHeight: this.rowHeight, colWidth: this.colWidth, cellData: this.cellData.map(r => [...r]), styles: { ...this.styles } };
  }

  static deserialize(data) { return new TableEntity(data); }
}

// ===================== LEADER ENTITY =====================

export class LeaderEntity extends BaseEntity {
  constructor(props = {}) {
    super('leader', props);
    this.points = (props.points || []).map(p => ({ x: p.x, y: p.y }));
    this.text = props.text ?? '';
    this.arrowType = props.arrowType ?? 'closed'; // closed, open, dot, none
    this.textHeight = props.textHeight ?? 2.5;
  }

  getBounds() {
    if (this.points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = this.text.length * this.textHeight * 0.6;
    return { minX, minY: minY - this.textHeight, maxX: maxX + pad, maxY: maxY + this.textHeight };
  }

  distanceTo(x, y) {
    let minD = Infinity;
    for (let i = 0; i < this.points.length - 1; i++) {
      const d = pointToSegmentDist(x, y, this.points[i].x, this.points[i].y, this.points[i + 1].x, this.points[i + 1].y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  getSnapPoints() {
    return this.points.map(p => ({ type: 'endpoint', x: p.x, y: p.y }));
  }

  getGripPoints() {
    return this.points.map((p, i) => ({ x: p.x, y: p.y, key: `pt${i}` }));
  }

  transform(matrix) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i] = transformPt(this.points[i].x, this.points[i].y, matrix);
    }
  }

  clone() {
    return new LeaderEntity({ ...this._baseProps(), points: this.points.map(p => ({ ...p })), text: this.text, arrowType: this.arrowType, textHeight: this.textHeight });
  }

  serialize() {
    return { ...this._baseProps(), points: this.points.map(p => ({ ...p })), text: this.text, arrowType: this.arrowType, textHeight: this.textHeight };
  }

  static deserialize(data) { return new LeaderEntity(data); }
}

// ===================== REGION ENTITY =====================

export class RegionEntity extends BaseEntity {
  constructor(props = {}) {
    super('region', props);
    this.boundary = (props.boundary || []).map(p => ({ x: p.x, y: p.y }));
    this.holes = (props.holes || []).map(hole => hole.map(p => ({ x: p.x, y: p.y })));
  }

  getBounds() {
    if (this.boundary.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.boundary) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }

  distanceTo(x, y) {
    let minD = Infinity;
    const n = this.boundary.length;
    for (let i = 0; i < n; i++) {
      const a = this.boundary[i], b = this.boundary[(i + 1) % n];
      const d = pointToSegmentDist(x, y, a.x, a.y, b.x, b.y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  getSnapPoints() { return this.boundary.map(p => ({ type: 'endpoint', x: p.x, y: p.y })); }
  getGripPoints() { return this.boundary.map((p, i) => ({ x: p.x, y: p.y, key: `b${i}` })); }

  transform(matrix) {
    for (let i = 0; i < this.boundary.length; i++) {
      this.boundary[i] = transformPt(this.boundary[i].x, this.boundary[i].y, matrix);
    }
    for (const hole of this.holes) {
      for (let i = 0; i < hole.length; i++) {
        hole[i] = transformPt(hole[i].x, hole[i].y, matrix);
      }
    }
  }

  clone() {
    return new RegionEntity({ ...this._baseProps(), boundary: this.boundary.map(p => ({ ...p })), holes: this.holes.map(h => h.map(p => ({ ...p }))) });
  }

  serialize() {
    return { ...this._baseProps(), boundary: this.boundary.map(p => ({ ...p })), holes: this.holes.map(h => h.map(p => ({ ...p }))) };
  }

  static deserialize(data) { return new RegionEntity(data); }
}

// ===================== REVISION CLOUD ENTITY =====================

export class RevisionCloudEntity extends BaseEntity {
  constructor(props = {}) {
    super('revcloud', props);
    this.points = (props.points || []).map(p => ({ x: p.x, y: p.y }));
    this.arcLength = props.arcLength ?? 10;
  }

  getBounds() {
    if (this.points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const pad = this.arcLength;
    for (const p of this.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
  }

  distanceTo(x, y) {
    let minD = Infinity;
    const n = this.points.length;
    for (let i = 0; i < n; i++) {
      const a = this.points[i], b = this.points[(i + 1) % n];
      const d = pointToSegmentDist(x, y, a.x, a.y, b.x, b.y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  getSnapPoints() { return this.points.map(p => ({ type: 'endpoint', x: p.x, y: p.y })); }
  getGripPoints() { return this.points.map((p, i) => ({ x: p.x, y: p.y, key: `pt${i}` })); }

  transform(matrix) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i] = transformPt(this.points[i].x, this.points[i].y, matrix);
    }
  }

  clone() {
    return new RevisionCloudEntity({ ...this._baseProps(), points: this.points.map(p => ({ ...p })), arcLength: this.arcLength });
  }

  serialize() {
    return { ...this._baseProps(), points: this.points.map(p => ({ ...p })), arcLength: this.arcLength };
  }

  static deserialize(data) { return new RevisionCloudEntity(data); }
}

// ===================== ENTITY REGISTRY =====================

const ENTITY_TYPES = {
  line: LineEntity,
  polyline: PolylineEntity,
  circle: CircleEntity,
  arc: ArcEntity,
  ellipse: EllipseEntity,
  point: PointEntity,
  text: TextEntity,
  mtext: MTextEntity,
  dimension: DimensionEntity,
  hatch: HatchEntity,
  blockref: BlockRefEntity,
  spline: SplineEntity,
  xline: ConstructionLineEntity,
  ray: RayEntity,
  image: ImageEntity,
  table: TableEntity,
  leader: LeaderEntity,
  region: RegionEntity,
  revcloud: RevisionCloudEntity,
};

/**
 * Deserialize any entity from plain data.
 * @param {Object} data — must have a `type` field
 * @returns {BaseEntity}
 */
export function deserializeEntity(data) {
  const Ctor = ENTITY_TYPES[data.type];
  if (Ctor && typeof Ctor.deserialize === 'function') {
    return Ctor.deserialize(data);
  }
  return new BaseEntity(data.type, data);
}
