/**
 * AfroDraft v6 — Modify Commands
 *
 * MOVE, COPY, ROTATE, SCALE, MIRROR, OFFSET, ARRAY_RECT, ARRAY_POLAR,
 * TRIM, EXTEND, FILLET, CHAMFER, BREAK, JOIN, EXPLODE, STRETCH,
 * LENGTHEN, DIVIDE, MEASURE, MATCHPROP
 */

import {
  BaseCommand,
  SelectionCollector,
  parseCoordinate,
  parseNumber,
  dist,
  angleBetween,
  pointOnCircle,
  normalizeAngle,
  lineLineIntersect,
} from './CommandRegistry.js';

const _DEG = Math.PI / 180;

// ─── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Clone entity data (shallow-deep enough for our plain-object entities).
 */
function cloneEntity(entity) {
  const e = JSON.parse(JSON.stringify(entity));
  delete e.id;  // engine will assign a new id
  return e;
}

/**
 * Translate an entity by dx, dy. Mutates in place.
 */
function translateEntity(entity, dx, dy) {
  switch (entity.type) {
    case 'line':
      entity.x1 += dx; entity.y1 += dy;
      entity.x2 += dx; entity.y2 += dy;
      break;
    case 'circle':
    case 'arc':
    case 'ellipse':
      entity.cx += dx; entity.cy += dy;
      break;
    case 'point':
    case 'text':
    case 'mtext':
    case 'table':
      entity.x += dx; entity.y += dy;
      break;
    case 'polyline':
      for (const p of entity.points) { p.x += dx; p.y += dy; }
      break;
    case 'spline':
      for (const p of entity.controlPoints) { p.x += dx; p.y += dy; }
      break;
    case 'xline':
    case 'ray':
      entity.x += dx; entity.y += dy;
      break;
    case 'hatch':
      for (const p of entity.boundary) { p.x += dx; p.y += dy; }
      break;
    case 'leader':
      for (const p of entity.points) { p.x += dx; p.y += dy; }
      break;
    case 'dimension':
      entity.x1 += dx; entity.y1 += dy;
      entity.x2 += dx; entity.y2 += dy;
      if (entity.dimLineX != null) { entity.dimLineX += dx; entity.dimLineY += dy; }
      break;
  }
}

/**
 * Rotate an entity about (cx, cy) by angle (radians). Mutates in place.
 */
function rotateEntity(entity, cx, cy, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rot = (x, y) => ({
    x: cx + (x - cx) * cos - (y - cy) * sin,
    y: cy + (x - cx) * sin + (y - cy) * cos,
  });

  switch (entity.type) {
    case 'line': {
      const p1 = rot(entity.x1, entity.y1);
      const p2 = rot(entity.x2, entity.y2);
      entity.x1 = p1.x; entity.y1 = p1.y;
      entity.x2 = p2.x; entity.y2 = p2.y;
      break;
    }
    case 'circle': {
      const c = rot(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      break;
    }
    case 'arc': {
      const c = rot(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      entity.startAngle += angle;
      entity.endAngle += angle;
      break;
    }
    case 'ellipse': {
      const c = rot(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      entity.rotation = (entity.rotation || 0) + angle;
      break;
    }
    case 'point':
    case 'text':
    case 'mtext':
    case 'table': {
      const p = rot(entity.x, entity.y);
      entity.x = p.x; entity.y = p.y;
      if (entity.rotation != null) entity.rotation += angle * 180 / Math.PI;
      break;
    }
    case 'polyline':
      for (const p of entity.points) {
        const r = rot(p.x, p.y);
        p.x = r.x; p.y = r.y;
      }
      break;
    case 'spline':
      for (const p of entity.controlPoints) {
        const r = rot(p.x, p.y);
        p.x = r.x; p.y = r.y;
      }
      break;
    case 'xline':
    case 'ray': {
      const p = rot(entity.x, entity.y);
      entity.x = p.x; entity.y = p.y;
      const d = rot(entity.x + entity.dx, entity.y + entity.dy);
      entity.dx = d.x - entity.x; entity.dy = d.y - entity.y;
      break;
    }
    case 'hatch':
      for (const p of entity.boundary) {
        const r = rot(p.x, p.y);
        p.x = r.x; p.y = r.y;
      }
      break;
    case 'leader':
      for (const p of entity.points) {
        const r = rot(p.x, p.y);
        p.x = r.x; p.y = r.y;
      }
      break;
    case 'dimension': {
      const p1 = rot(entity.x1, entity.y1);
      const p2 = rot(entity.x2, entity.y2);
      entity.x1 = p1.x; entity.y1 = p1.y;
      entity.x2 = p2.x; entity.y2 = p2.y;
      if (entity.dimLineX != null) {
        const dl = rot(entity.dimLineX, entity.dimLineY);
        entity.dimLineX = dl.x; entity.dimLineY = dl.y;
      }
      break;
    }
  }
}

/**
 * Scale an entity about (cx, cy) by factor. Mutates in place.
 */
function scaleEntity(entity, cx, cy, factor) {
  const sc = (x, y) => ({
    x: cx + (x - cx) * factor,
    y: cy + (y - cy) * factor,
  });

  switch (entity.type) {
    case 'line': {
      const p1 = sc(entity.x1, entity.y1);
      const p2 = sc(entity.x2, entity.y2);
      entity.x1 = p1.x; entity.y1 = p1.y;
      entity.x2 = p2.x; entity.y2 = p2.y;
      break;
    }
    case 'circle': {
      const c = sc(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      entity.r *= factor;
      break;
    }
    case 'arc': {
      const c = sc(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      entity.r *= factor;
      break;
    }
    case 'ellipse': {
      const c = sc(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      entity.rx *= factor;
      entity.ry *= factor;
      break;
    }
    case 'point':
    case 'text':
    case 'mtext':
    case 'table': {
      const p = sc(entity.x, entity.y);
      entity.x = p.x; entity.y = p.y;
      if (entity.height) entity.height *= factor;
      if (entity.width) entity.width *= factor;
      break;
    }
    case 'polyline':
      for (const p of entity.points) {
        const r = sc(p.x, p.y);
        p.x = r.x; p.y = r.y;
      }
      if (entity.globalWidth) entity.globalWidth *= factor;
      break;
    case 'spline':
      for (const p of entity.controlPoints) {
        const r = sc(p.x, p.y);
        p.x = r.x; p.y = r.y;
      }
      break;
    case 'hatch':
      for (const p of entity.boundary) {
        const r = sc(p.x, p.y);
        p.x = r.x; p.y = r.y;
      }
      if (entity.scale) entity.scale *= factor;
      break;
    case 'leader':
      for (const p of entity.points) {
        const r = sc(p.x, p.y);
        p.x = r.x; p.y = r.y;
      }
      break;
    case 'dimension': {
      const p1 = sc(entity.x1, entity.y1);
      const p2 = sc(entity.x2, entity.y2);
      entity.x1 = p1.x; entity.y1 = p1.y;
      entity.x2 = p2.x; entity.y2 = p2.y;
      if (entity.dimLineX != null) {
        const dl = sc(entity.dimLineX, entity.dimLineY);
        entity.dimLineX = dl.x; entity.dimLineY = dl.y;
      }
      break;
    }
  }
}

/**
 * Mirror an entity across the line from p1 to p2. Mutates in place.
 */
function mirrorEntity(entity, p1x, p1y, p2x, p2y) {
  const dx = p2x - p1x;
  const dy = p2y - p1y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return;

  const mirrorPt = (x, y) => {
    const t = ((x - p1x) * dx + (y - p1y) * dy) / len2;
    const px = p1x + t * dx;
    const py = p1y + t * dy;
    return { x: 2 * px - x, y: 2 * py - y };
  };

  switch (entity.type) {
    case 'line': {
      const a = mirrorPt(entity.x1, entity.y1);
      const b = mirrorPt(entity.x2, entity.y2);
      entity.x1 = a.x; entity.y1 = a.y;
      entity.x2 = b.x; entity.y2 = b.y;
      break;
    }
    case 'circle': {
      const c = mirrorPt(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      break;
    }
    case 'arc': {
      const c = mirrorPt(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      // Mirror angles: reflect and swap start/end
      const mirrorAngle = Math.atan2(dy, dx);
      const s = 2 * mirrorAngle - entity.endAngle;
      const e = 2 * mirrorAngle - entity.startAngle;
      entity.startAngle = s;
      entity.endAngle = e;
      entity.ccw = !entity.ccw;
      break;
    }
    case 'ellipse': {
      const c = mirrorPt(entity.cx, entity.cy);
      entity.cx = c.x; entity.cy = c.y;
      const mirrorAngle = Math.atan2(dy, dx);
      entity.rotation = 2 * mirrorAngle - (entity.rotation || 0);
      break;
    }
    case 'point':
    case 'text':
    case 'mtext':
    case 'table': {
      const p = mirrorPt(entity.x, entity.y);
      entity.x = p.x; entity.y = p.y;
      break;
    }
    case 'polyline':
      for (const p of entity.points) {
        const m = mirrorPt(p.x, p.y);
        p.x = m.x; p.y = m.y;
        if (p.bulge) p.bulge = -p.bulge;
      }
      break;
    case 'spline':
      for (const p of entity.controlPoints) {
        const m = mirrorPt(p.x, p.y);
        p.x = m.x; p.y = m.y;
      }
      break;
    case 'hatch':
      for (const p of entity.boundary) {
        const m = mirrorPt(p.x, p.y);
        p.x = m.x; p.y = m.y;
      }
      break;
    case 'leader':
      for (const p of entity.points) {
        const m = mirrorPt(p.x, p.y);
        p.x = m.x; p.y = m.y;
      }
      break;
    case 'dimension': {
      const a = mirrorPt(entity.x1, entity.y1);
      const b = mirrorPt(entity.x2, entity.y2);
      entity.x1 = a.x; entity.y1 = a.y;
      entity.x2 = b.x; entity.y2 = b.y;
      if (entity.dimLineX != null) {
        const dl = mirrorPt(entity.dimLineX, entity.dimLineY);
        entity.dimLineX = dl.x; entity.dimLineY = dl.y;
      }
      break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOVE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class MoveCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entities = null;
    this.basePoint = null;
    this.selector = null;
    this.phase = 'select'; // 'select', 'base', 'dest'
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this.entities = entities;
      this.phase = 'base';
      this.prompt('Specify base point: ');
    });
    this.prompt('MOVE — Select objects: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
      return;
    }
    if (this.phase === 'base') {
      this.basePoint = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'dest';
      this.prompt('Specify destination point: ');
      return;
    }
    if (this.phase === 'dest') {
      this._doMove(wx, wy);
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.phase === 'dest' && this.basePoint) {
      const dx = wx - this.basePoint.x;
      const dy = wy - this.basePoint.y;
      this.preview = {
        type: 'move-preview',
        entities: this.entities,
        dx, dy,
      };
    }
  }

  onInput(text) {
    if (this.phase === 'select') {
      if (this.selector.onInput(text)) return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    } else if (text === '' && this.phase === 'select') {
      this.selector.onInput(text);
    }
  }

  onKey(key) {
    if (this.phase === 'select') {
      if (this.selector.onKey(key)) return;
    }
    if (key === 'Escape') this.cancel();
  }

  _doMove(destX, destY) {
    const dx = destX - this.basePoint.x;
    const dy = destY - this.basePoint.y;
    for (const entity of this.entities) {
      this.engine._removeFromSpatialGrid(entity);
      translateEntity(entity, dx, dy);
      this.engine._addToSpatialGrid(entity);
    }
    this.engine.modified = true;
    this.engine.emit('entities-modified', { entities: this.entities });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    if (this.phase === 'select' && this.selector) {
      return this.selector.getPreview(this._mouseX, this._mouseY);
    }
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COPY Command
// ═══════════════════════════════════════════════════════════════════════════════

export class CopyCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entities = null;
    this.basePoint = null;
    this.selector = null;
    this.phase = 'select';
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this.entities = entities;
      this.phase = 'base';
      this.prompt('Specify base point: ');
    });
    this.prompt('COPY — Select objects: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
      return;
    }
    if (this.phase === 'base') {
      this.basePoint = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'dest';
      this.prompt('Specify destination point (Enter to finish): ');
      return;
    }
    if (this.phase === 'dest') {
      this._doCopy(wx, wy);
    }
  }

  onInput(text) {
    if (this.phase === 'select') {
      if (this.selector.onInput(text)) return;
    }
    if (this.phase === 'dest' && text === '') {
      this.finish();
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) {
      this.onClick(pt.x, pt.y);
    }
  }

  onKey(key) {
    if (this.phase === 'select') {
      if (this.selector.onKey(key)) return;
    }
    if (key === 'Enter' && this.phase === 'dest') {
      this.finish();
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
  }

  _doCopy(destX, destY) {
    const dx = destX - this.basePoint.x;
    const dy = destY - this.basePoint.y;
    for (const entity of this.entities) {
      const clone = cloneEntity(entity);
      translateEntity(clone, dx, dy);
      this.engine.addEntity(clone);
    }
    this.setPoint(destX, destY);
    this.prompt('Specify next destination point (Enter to finish): ');
  }

  getPreview() {
    if (this.phase === 'select' && this.selector) {
      return this.selector.getPreview(this._mouseX, this._mouseY);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROTATE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class RotateCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entities = null;
    this.basePoint = null;
    this.selector = null;
    this.refAngle = null;
    this.phase = 'select';
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this.entities = entities;
      this.phase = 'base';
      this.prompt('Specify base point: ');
    });
    this.prompt('ROTATE — Select objects: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
      return;
    }
    if (this.phase === 'base') {
      this.basePoint = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'angle';
      this.prompt('Specify rotation angle or [Reference]: ');
      return;
    }
    if (this.phase === 'angle') {
      const angle = angleBetween(this.basePoint.x, this.basePoint.y, wx, wy);
      this._doRotate(angle);
    }
    if (this.phase === 'ref-new') {
      const newAngle = angleBetween(this.basePoint.x, this.basePoint.y, wx, wy);
      this._doRotate(newAngle - this.refAngle);
    }
  }

  onInput(text) {
    if (this.phase === 'select') {
      if (this.selector.onInput(text)) return;
    }
    const t = text.toLowerCase();
    if (t === 'r' || t === 'reference') {
      this.prompt('Specify reference angle: ');
      this.phase = 'ref';
      return;
    }
    if (this.phase === 'ref') {
      const v = parseNumber(text);
      if (v !== null) {
        this.refAngle = v * _DEG;
        this.phase = 'ref-new';
        this.prompt('Specify new angle: ');
      }
      return;
    }
    if (this.phase === 'ref-new') {
      const v = parseNumber(text);
      if (v !== null) {
        this._doRotate(v * _DEG - this.refAngle);
      }
      return;
    }
    if (this.phase === 'angle') {
      const v = parseNumber(text);
      if (v !== null) {
        this._doRotate(v * _DEG);
        return;
      }
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  onKey(key) {
    if (this.phase === 'select' && this.selector.onKey(key)) return;
    if (key === 'Escape') this.cancel();
  }

  _doRotate(angle) {
    for (const entity of this.entities) {
      this.engine._removeFromSpatialGrid(entity);
      rotateEntity(entity, this.basePoint.x, this.basePoint.y, angle);
      this.engine._addToSpatialGrid(entity);
    }
    this.engine.modified = true;
    this.engine.emit('entities-modified', { entities: this.entities });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    if (this.phase === 'select' && this.selector) {
      return this.selector.getPreview(this._mouseX, this._mouseY);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCALE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class ScaleCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entities = null;
    this.basePoint = null;
    this.selector = null;
    this.refLength = null;
    this.phase = 'select';
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this.entities = entities;
      this.phase = 'base';
      this.prompt('Specify base point: ');
    });
    this.prompt('SCALE — Select objects: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
      return;
    }
    if (this.phase === 'base') {
      this.basePoint = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'factor';
      this.prompt('Specify scale factor or [Reference]: ');
      return;
    }
    if (this.phase === 'factor') {
      const factor = dist(this.basePoint.x, this.basePoint.y, wx, wy);
      this._doScale(factor);
    }
    if (this.phase === 'ref-new') {
      const newLen = dist(this.basePoint.x, this.basePoint.y, wx, wy);
      this._doScale(newLen / this.refLength);
    }
  }

  onInput(text) {
    if (this.phase === 'select') {
      if (this.selector.onInput(text)) return;
    }
    const t = text.toLowerCase();
    if (t === 'r' || t === 'reference') {
      this.prompt('Specify reference length: ');
      this.phase = 'ref';
      return;
    }
    if (this.phase === 'ref') {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this.refLength = v;
        this.phase = 'ref-new';
        this.prompt('Specify new length: ');
      }
      return;
    }
    if (this.phase === 'ref-new') {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this._doScale(v / this.refLength);
      }
      return;
    }
    if (this.phase === 'factor') {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this._doScale(v);
        return;
      }
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  onKey(key) {
    if (this.phase === 'select' && this.selector.onKey(key)) return;
    if (key === 'Escape') this.cancel();
  }

  _doScale(factor) {
    for (const entity of this.entities) {
      this.engine._removeFromSpatialGrid(entity);
      scaleEntity(entity, this.basePoint.x, this.basePoint.y, factor);
      this.engine._addToSpatialGrid(entity);
    }
    this.engine.modified = true;
    this.engine.emit('entities-modified', { entities: this.entities });
    this.preview = null;
    this.finish();
  }

  getPreview() {
    if (this.phase === 'select' && this.selector) {
      return this.selector.getPreview(this._mouseX, this._mouseY);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIRROR Command
// ═══════════════════════════════════════════════════════════════════════════════

export class MirrorCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entities = null;
    this.mirrorP1 = null;
    this.selector = null;
    this.phase = 'select';
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this.entities = entities;
      this.phase = 'mirror1';
      this.prompt('Specify first point of mirror line: ');
    });
    this.prompt('MIRROR — Select objects: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
      return;
    }
    if (this.phase === 'mirror1') {
      this.mirrorP1 = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'mirror2';
      this.prompt('Specify second point of mirror line: ');
      return;
    }
    if (this.phase === 'mirror2') {
      this._mirrorP2 = { x: wx, y: wy };
      this.phase = 'delete';
      this.prompt('Delete source objects? [Yes/No] <N>: ');
    }
  }

  onInput(text) {
    if (this.phase === 'select') {
      if (this.selector.onInput(text)) return;
    }
    if (this.phase === 'delete') {
      const t = text.toLowerCase();
      const deleteSource = t === 'y' || t === 'yes';
      this._doMirror(deleteSource);
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  onKey(key) {
    if (this.phase === 'select' && this.selector.onKey(key)) return;
    if (key === 'Enter' && this.phase === 'delete') {
      this._doMirror(false); // default: keep source
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  _doMirror(deleteSource) {
    const p1 = this.mirrorP1;
    const p2 = this._mirrorP2;
    for (const entity of this.entities) {
      const clone = cloneEntity(entity);
      mirrorEntity(clone, p1.x, p1.y, p2.x, p2.y);
      this.engine.addEntity(clone);
    }
    if (deleteSource) {
      for (const entity of this.entities) {
        this.engine.removeEntity(entity.id);
      }
    }
    this.preview = null;
    this.finish();
  }

  onMouseMove(wx, wy) {
    super.onMouseMove(wx, wy);
    if (this.phase === 'mirror2' && this.mirrorP1) {
      this.preview = {
        type: 'line',
        x1: this.mirrorP1.x, y1: this.mirrorP1.y,
        x2: wx, y2: wy,
      };
    }
  }

  getPreview() {
    if (this.phase === 'select' && this.selector) {
      return this.selector.getPreview(this._mouseX, this._mouseY);
    }
    return this.preview ? [this.preview] : [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFSET Command
// ═══════════════════════════════════════════════════════════════════════════════

export class OffsetCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.distance = 0;
    this.entity = null;
    this.phase = 'distance'; // 'distance', 'select', 'side'
  }

  start() {
    this.prompt('OFFSET — Specify offset distance: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.entity = pick.entity;
        this.phase = 'side';
        this.prompt('Specify side to offset: ');
      }
      return;
    }
    if (this.phase === 'side') {
      this._doOffset(wx, wy);
    }
  }

  onInput(text) {
    if (this.phase === 'distance') {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this.distance = v;
        this.phase = 'select';
        this.prompt('Select entity to offset: ');
      }
      return;
    }
    if (text === '' && this.phase === 'side') {
      this.phase = 'select';
      this.prompt('Select entity to offset (Enter to finish): ');
      return;
    }
    if (text === '' && this.phase === 'select') {
      this.finish();
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  _doOffset(sideX, sideY) {
    const e = this.entity;
    if (!e) return;

    const clone = cloneEntity(e);

    if (e.type === 'line') {
      const dx = e.x2 - e.x1;
      const dy = e.y2 - e.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-12) return;
      // Normal direction
      let nx = -dy / len;
      let ny = dx / len;
      // Determine side: is sidePoint on the positive or negative side of the normal?
      const midX = (e.x1 + e.x2) / 2;
      const midY = (e.y1 + e.y2) / 2;
      const dot = (sideX - midX) * nx + (sideY - midY) * ny;
      if (dot < 0) { nx = -nx; ny = -ny; }
      const d = this.distance;
      clone.x1 = e.x1 + nx * d; clone.y1 = e.y1 + ny * d;
      clone.x2 = e.x2 + nx * d; clone.y2 = e.y2 + ny * d;
    } else if (e.type === 'circle') {
      const dx = sideX - e.cx;
      const dy = sideY - e.cy;
      const outside = Math.sqrt(dx * dx + dy * dy) > e.r;
      clone.r = outside ? e.r + this.distance : Math.max(0.01, e.r - this.distance);
    } else if (e.type === 'polyline') {
      // Simplified offset: translate each vertex along its local normal
      const pts = e.points;
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const prev = pts[(i - 1 + n) % n];
        const curr = pts[i];
        const next = pts[(i + 1) % n];
        let nx = -(next.y - prev.y);
        let ny = (next.x - prev.x);
        const len = Math.sqrt(nx * nx + ny * ny);
        if (len > 1e-12) { nx /= len; ny /= len; }
        // Determine side
        const dot = (sideX - curr.x) * nx + (sideY - curr.y) * ny;
        const sign = dot >= 0 ? 1 : -1;
        clone.points[i].x = curr.x + sign * nx * this.distance;
        clone.points[i].y = curr.y + sign * ny * this.distance;
      }
    } else if (e.type === 'arc') {
      const dx = sideX - e.cx;
      const dy = sideY - e.cy;
      const outside = Math.sqrt(dx * dx + dy * dy) > e.r;
      clone.r = outside ? e.r + this.distance : Math.max(0.01, e.r - this.distance);
    }

    this.engine.addEntity(clone);
    this.entity = null;
    this.phase = 'select';
    this.prompt('Select entity to offset (Enter to finish): ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARRAY (Rectangular) Command
// ═══════════════════════════════════════════════════════════════════════════════

export class ArrayRectCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entities = null;
    this.rows = 2;
    this.cols = 2;
    this.rowSpacing = 10;
    this.colSpacing = 10;
    this.selector = null;
    this.phase = 'select';
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this.entities = entities;
      this.phase = 'rows';
      this.prompt('Enter number of rows: ');
    });
    this.prompt('ARRAYRECT — Select objects: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
    }
  }

  onInput(text) {
    if (this.phase === 'select') {
      if (this.selector.onInput(text)) return;
    }
    if (this.phase === 'rows') {
      const v = parseInt(text, 10);
      if (v > 0) { this.rows = v; this.phase = 'cols'; this.prompt('Enter number of columns: '); }
      return;
    }
    if (this.phase === 'cols') {
      const v = parseInt(text, 10);
      if (v > 0) { this.cols = v; this.phase = 'rowsp'; this.prompt('Enter row spacing: '); }
      return;
    }
    if (this.phase === 'rowsp') {
      const v = parseNumber(text);
      if (v !== null) { this.rowSpacing = v; this.phase = 'colsp'; this.prompt('Enter column spacing: '); }
      return;
    }
    if (this.phase === 'colsp') {
      const v = parseNumber(text);
      if (v !== null) { this.colSpacing = v; this._doArray(); }
    }
  }

  onKey(key) {
    if (this.phase === 'select' && this.selector.onKey(key)) return;
    if (key === 'Escape') this.cancel();
  }

  _doArray() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 && c === 0) continue; // skip original position
        const dx = c * this.colSpacing;
        const dy = r * this.rowSpacing;
        for (const entity of this.entities) {
          const clone = cloneEntity(entity);
          translateEntity(clone, dx, dy);
          this.engine.addEntity(clone);
        }
      }
    }
    this.finish();
  }

  getPreview() {
    if (this.phase === 'select' && this.selector) {
      return this.selector.getPreview(this._mouseX, this._mouseY);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARRAY (Polar) Command
// ═══════════════════════════════════════════════════════════════════════════════

export class ArrayPolarCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entities = null;
    this.center = null;
    this.count = 6;
    this.totalAngle = 360;
    this.selector = null;
    this.phase = 'select';
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this.entities = entities;
      this.phase = 'center';
      this.prompt('Specify center point of array: ');
    });
    this.prompt('ARRAYPOLAR — Select objects: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
      return;
    }
    if (this.phase === 'center') {
      this.center = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'count';
      this.prompt('Enter number of items: ');
    }
  }

  onInput(text) {
    if (this.phase === 'select') {
      if (this.selector.onInput(text)) return;
    }
    if (this.phase === 'count') {
      const v = parseInt(text, 10);
      if (v > 1) {
        this.count = v;
        this.phase = 'angle';
        this.prompt(`Enter angle to fill <${this.totalAngle}>: `);
      }
      return;
    }
    if (this.phase === 'angle') {
      if (text === '') {
        this._doArray();
      } else {
        const v = parseNumber(text);
        if (v !== null) { this.totalAngle = v; this._doArray(); }
      }
      return;
    }
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  onKey(key) {
    if (this.phase === 'select' && this.selector.onKey(key)) return;
    if (key === 'Escape') this.cancel();
  }

  _doArray() {
    const angleStep = (this.totalAngle * _DEG) / this.count;
    for (let i = 1; i < this.count; i++) {
      const angle = i * angleStep;
      for (const entity of this.entities) {
        const clone = cloneEntity(entity);
        rotateEntity(clone, this.center.x, this.center.y, angle);
        this.engine.addEntity(clone);
      }
    }
    this.finish();
  }

  getPreview() {
    if (this.phase === 'select' && this.selector) {
      return this.selector.getPreview(this._mouseX, this._mouseY);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRIM Command
// ═══════════════════════════════════════════════════════════════════════════════

export class TrimCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.cuttingEdges = [];
    this.phase = 'edges'; // 'edges', 'trim'
  }

  start() {
    this.prompt('TRIM — Select cutting edges (Enter for all): ');
  }

  onClick(wx, wy) {
    if (this.phase === 'edges') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.cuttingEdges.push(pick.entity);
        this.prompt(`TRIM — Cutting edges selected: ${this.cuttingEdges.length}. Select more or Enter: `);
      }
      return;
    }
    if (this.phase === 'trim') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this._trimEntity(pick.entity, wx, wy);
      }
    }
  }

  onInput(text) {
    if (this.phase === 'edges' && text === '') {
      // Use all entities as cutting edges
      if (this.cuttingEdges.length === 0) {
        this.cuttingEdges = this.engine.getAllEntities().filter(e => e.type === 'line' || e.type === 'circle' || e.type === 'arc');
      }
      this.phase = 'trim';
      this.prompt('Select entity to trim (Enter to finish): ');
      return;
    }
    if (this.phase === 'trim' && text === '') {
      this.finish();
      return;
    }
  }

  onKey(key) {
    if (key === 'Enter') {
      if (this.phase === 'edges') {
        this.onInput('');
      } else {
        this.finish();
      }
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  _trimEntity(entity, pickX, pickY) {
    // Simplified trim: for lines, find intersections with cutting edges
    // and remove the segment containing the pick point
    if (entity.type !== 'line') {
      this.message('Trim currently supports lines only.');
      return;
    }

    const intersections = [];
    for (const edge of this.cuttingEdges) {
      if (edge.id === entity.id) continue;
      if (edge.type === 'line') {
        const ix = lineLineIntersect(
          entity.x1, entity.y1, entity.x2, entity.y2,
          edge.x1, edge.y1, edge.x2, edge.y2,
        );
        if (ix) {
          // Check if intersection is on both segments
          const t1 = this._paramOnSegment(entity.x1, entity.y1, entity.x2, entity.y2, ix.x, ix.y);
          const t2 = this._paramOnSegment(edge.x1, edge.y1, edge.x2, edge.y2, ix.x, ix.y);
          if (t1 >= -1e-9 && t1 <= 1 + 1e-9 && t2 >= -1e-9 && t2 <= 1 + 1e-9) {
            intersections.push({ x: ix.x, y: ix.y, t: t1 });
          }
        }
      }
    }

    if (intersections.length === 0) {
      this.message('No intersection found.');
      return;
    }

    // Sort by parameter
    intersections.sort((a, b) => a.t - b.t);

    // Find parameter of pick point on line
    const pickT = this._paramOnSegment(entity.x1, entity.y1, entity.x2, entity.y2, pickX, pickY);

    // Find which segment the pick point is in
    const allT = [0, ...intersections.map(i => i.t), 1];
    for (let i = 0; i < allT.length - 1; i++) {
      if (pickT >= allT[i] - 0.01 && pickT <= allT[i + 1] + 0.01) {
        // Remove this segment — modify the entity to the remaining segments
        // If it's the first or last segment, just trim the line
        if (allT.length === 3) {
          // One intersection: keep the other half
          const ix = intersections[0];
          if (i === 0) {
            entity.x1 = ix.x; entity.y1 = ix.y;
          } else {
            entity.x2 = ix.x; entity.y2 = ix.y;
          }
        } else {
          // Multiple intersections: remove the picked segment
          this.engine.removeEntity(entity.id);
          // Recreate non-picked segments
          for (let j = 0; j < allT.length - 1; j++) {
            if (j === i) continue;
            const t1 = allT[j];
            const t2 = allT[j + 1];
            this.engine.addEntity({
              type: 'line',
              x1: entity.x1 + t1 * (entity.x2 - entity.x1),
              y1: entity.y1 + t1 * (entity.y2 - entity.y1),
              x2: entity.x1 + t2 * (entity.x2 - entity.x1),
              y2: entity.y1 + t2 * (entity.y2 - entity.y1),
              layer: entity.layer,
            });
          }
        }
        this.engine.modified = true;
        break;
      }
    }
    this.prompt('Select entity to trim (Enter to finish): ');
  }

  _paramOnSegment(x1, y1, x2, y2, px, py) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-12) return 0;
    return ((px - x1) * dx + (py - y1) * dy) / len2;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXTEND Command
// ═══════════════════════════════════════════════════════════════════════════════

export class ExtendCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.boundaryEdges = [];
    this.phase = 'edges';
  }

  start() {
    this.prompt('EXTEND — Select boundary edges (Enter for all): ');
  }

  onClick(wx, wy) {
    if (this.phase === 'edges') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.boundaryEdges.push(pick.entity);
        this.prompt(`Boundary edges: ${this.boundaryEdges.length}. Select more or Enter: `);
      }
      return;
    }
    if (this.phase === 'extend') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this._extendEntity(pick.entity, wx, wy);
      }
    }
  }

  onInput(text) {
    if (this.phase === 'edges' && text === '') {
      if (this.boundaryEdges.length === 0) {
        this.boundaryEdges = this.engine.getAllEntities().filter(e => e.type === 'line' || e.type === 'circle' || e.type === 'arc');
      }
      this.phase = 'extend';
      this.prompt('Select entity to extend (Enter to finish): ');
      return;
    }
    if (this.phase === 'extend' && text === '') {
      this.finish();
    }
  }

  onKey(key) {
    if (key === 'Enter') {
      this.onInput('');
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  _extendEntity(entity, pickX, pickY) {
    if (entity.type !== 'line') {
      this.message('Extend currently supports lines only.');
      return;
    }

    // Find nearest intersection with boundary edges by extending the line
    const dx = entity.x2 - entity.x1;
    const dy = entity.y2 - entity.y1;
    let bestT = null;
    let bestDist = Infinity;

    // Determine which end is closer to pick point
    const d1 = dist(entity.x1, entity.y1, pickX, pickY);
    const d2 = dist(entity.x2, entity.y2, pickX, pickY);
    const extendEnd = d2 < d1; // true = extend end (t>1), false = extend start (t<0)

    for (const edge of this.boundaryEdges) {
      if (edge.id === entity.id) continue;
      if (edge.type === 'line') {
        const ix = lineLineIntersect(
          entity.x1, entity.y1, entity.x1 + dx * 1000, entity.y1 + dy * 1000,
          edge.x1, edge.y1, edge.x2, edge.y2,
        );
        if (ix) {
          const t = ((ix.x - entity.x1) * dx + (ix.y - entity.y1) * dy) / (dx * dx + dy * dy);
          const tEdge = ((ix.x - edge.x1) * (edge.x2 - edge.x1) + (ix.y - edge.y1) * (edge.y2 - edge.y1)) /
            ((edge.x2 - edge.x1) ** 2 + (edge.y2 - edge.y1) ** 2);
          if (tEdge >= -1e-9 && tEdge <= 1 + 1e-9) {
            if (extendEnd && t > 1 && t < bestT || bestT === null) {
              bestT = t;
              bestDist = dist(entity.x2, entity.y2, ix.x, ix.y);
            } else if (!extendEnd && t < 0) {
              if (bestT === null || t > bestT) {
                bestT = t;
                bestDist = dist(entity.x1, entity.y1, ix.x, ix.y);
              }
            }
          }
        }
      }
    }

    if (bestT !== null) {
      this.engine._removeFromSpatialGrid(entity);
      if (extendEnd) {
        entity.x2 = entity.x1 + bestT * dx;
        entity.y2 = entity.y1 + bestT * dy;
      } else {
        entity.x1 = entity.x1 + bestT * dx;
        entity.y1 = entity.y1 + bestT * dy;
      }
      this.engine._addToSpatialGrid(entity);
      this.engine.modified = true;
    } else {
      this.message('No boundary edge found to extend to.');
    }
    this.prompt('Select entity to extend (Enter to finish): ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILLET Command
// ═══════════════════════════════════════════════════════════════════════════════

export class FilletCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.radius = 0;
    this.entity1 = null;
    this.phase = 'radius';
  }

  start() {
    this.prompt(`FILLET — Specify fillet radius <${this.radius}>: `);
  }

  onClick(wx, wy) {
    if (this.phase === 'pick1') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.entity1 = pick.entity;
        this.phase = 'pick2';
        this.prompt('Select second entity: ');
      }
      return;
    }
    if (this.phase === 'pick2') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this._doFillet(this.entity1, pick.entity);
      }
    }
  }

  onInput(text) {
    if (this.phase === 'radius') {
      if (text === '') {
        // Accept current radius
      } else {
        const v = parseNumber(text);
        if (v !== null && v >= 0) this.radius = v;
      }
      this.phase = 'pick1';
      this.prompt('Select first entity: ');
      return;
    }
  }

  _doFillet(e1, e2) {
    if (e1.type !== 'line' || e2.type !== 'line') {
      this.message('Fillet currently supports two lines.');
      this.finish();
      return;
    }

    const ix = lineLineIntersect(e1.x1, e1.y1, e1.x2, e1.y2, e2.x1, e2.y1, e2.x2, e2.y2);
    if (!ix) {
      this.message('Lines do not intersect.');
      this.finish();
      return;
    }

    if (this.radius === 0) {
      // Just trim/extend to intersection
      this.engine._removeFromSpatialGrid(e1);
      this.engine._removeFromSpatialGrid(e2);
      // Move the endpoint nearest to intersection
      if (dist(e1.x2, e1.y2, ix.x, ix.y) < dist(e1.x1, e1.y1, ix.x, ix.y)) {
        e1.x2 = ix.x; e1.y2 = ix.y;
      } else {
        e1.x1 = ix.x; e1.y1 = ix.y;
      }
      if (dist(e2.x1, e2.y1, ix.x, ix.y) < dist(e2.x2, e2.y2, ix.x, ix.y)) {
        e2.x1 = ix.x; e2.y1 = ix.y;
      } else {
        e2.x2 = ix.x; e2.y2 = ix.y;
      }
      this.engine._addToSpatialGrid(e1);
      this.engine._addToSpatialGrid(e2);
    } else {
      // Compute fillet arc
      const a1 = angleBetween(ix.x, ix.y, e1.x1, e1.y1);
      const a2 = angleBetween(ix.x, ix.y, e2.x1, e2.y1);

      // Determine the angle between the two lines
      let halfAngle = Math.abs(a2 - a1) / 2;
      if (halfAngle > Math.PI / 2) halfAngle = Math.PI - halfAngle;

      const trimDist = this.radius / Math.tan(halfAngle);

      // Trim lines
      const bisect = (a1 + a2) / 2;
      const centerDist = this.radius / Math.sin(halfAngle);
      const arcCx = ix.x + centerDist * Math.cos(bisect);
      const arcCy = ix.y + centerDist * Math.sin(bisect);

      // Trim e1 and e2 at distance trimDist from intersection
      this.engine._removeFromSpatialGrid(e1);
      this.engine._removeFromSpatialGrid(e2);

      // Trim nearest ends
      const trim1End = dist(e1.x2, e1.y2, ix.x, ix.y) < dist(e1.x1, e1.y1, ix.x, ix.y);
      if (trim1End) {
        e1.x2 = ix.x + trimDist * Math.cos(a1);
        e1.y2 = ix.y + trimDist * Math.sin(a1);
      } else {
        e1.x1 = ix.x + trimDist * Math.cos(a1);
        e1.y1 = ix.y + trimDist * Math.sin(a1);
      }

      const trim2End = dist(e2.x1, e2.y1, ix.x, ix.y) < dist(e2.x2, e2.y2, ix.x, ix.y);
      if (trim2End) {
        e2.x1 = ix.x + trimDist * Math.cos(a2);
        e2.y1 = ix.y + trimDist * Math.sin(a2);
      } else {
        e2.x2 = ix.x + trimDist * Math.cos(a2);
        e2.y2 = ix.y + trimDist * Math.sin(a2);
      }

      this.engine._addToSpatialGrid(e1);
      this.engine._addToSpatialGrid(e2);

      // Add the fillet arc
      const startAngle = angleBetween(arcCx, arcCy, trim1End ? e1.x2 : e1.x1, trim1End ? e1.y2 : e1.y1);
      const endAngle = angleBetween(arcCx, arcCy, trim2End ? e2.x1 : e2.x2, trim2End ? e2.y1 : e2.y2);
      this.engine.addEntity({
        type: 'arc',
        cx: arcCx, cy: arcCy,
        r: this.radius,
        startAngle, endAngle,
        ccw: true,
      });
    }

    this.engine.modified = true;
    this.finish();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAMFER Command
// ═══════════════════════════════════════════════════════════════════════════════

export class ChamferCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.dist1 = 0;
    this.dist2 = 0;
    this.entity1 = null;
    this.phase = 'dist1';
  }

  start() {
    this.prompt(`CHAMFER — Specify first chamfer distance <${this.dist1}>: `);
  }

  onClick(wx, wy) {
    if (this.phase === 'pick1') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.entity1 = pick.entity;
        this.phase = 'pick2';
        this.prompt('Select second entity: ');
      }
      return;
    }
    if (this.phase === 'pick2') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this._doChamfer(this.entity1, pick.entity);
      }
    }
  }

  onInput(text) {
    if (this.phase === 'dist1') {
      if (text === '') {
        // Accept default
      } else {
        const v = parseNumber(text);
        if (v !== null && v >= 0) this.dist1 = v;
      }
      this.phase = 'dist2';
      this.prompt(`Specify second chamfer distance <${this.dist1}>: `);
      return;
    }
    if (this.phase === 'dist2') {
      if (text === '') {
        this.dist2 = this.dist1;
      } else {
        const v = parseNumber(text);
        if (v !== null && v >= 0) this.dist2 = v;
      }
      this.phase = 'pick1';
      this.prompt('Select first entity: ');
      return;
    }
  }

  _doChamfer(e1, e2) {
    if (e1.type !== 'line' || e2.type !== 'line') {
      this.message('Chamfer currently supports two lines.');
      this.finish();
      return;
    }

    const ix = lineLineIntersect(e1.x1, e1.y1, e1.x2, e1.y2, e2.x1, e2.y1, e2.x2, e2.y2);
    if (!ix) {
      this.message('Lines do not intersect.');
      this.finish();
      return;
    }

    if (this.dist1 === 0 && this.dist2 === 0) {
      // Just meet at corner, like fillet with r=0
      this.engine._removeFromSpatialGrid(e1);
      this.engine._removeFromSpatialGrid(e2);
      if (dist(e1.x2, e1.y2, ix.x, ix.y) < dist(e1.x1, e1.y1, ix.x, ix.y)) {
        e1.x2 = ix.x; e1.y2 = ix.y;
      } else {
        e1.x1 = ix.x; e1.y1 = ix.y;
      }
      if (dist(e2.x1, e2.y1, ix.x, ix.y) < dist(e2.x2, e2.y2, ix.x, ix.y)) {
        e2.x1 = ix.x; e2.y1 = ix.y;
      } else {
        e2.x2 = ix.x; e2.y2 = ix.y;
      }
      this.engine._addToSpatialGrid(e1);
      this.engine._addToSpatialGrid(e2);
    } else {
      // Trim and add chamfer line
      const a1 = angleBetween(ix.x, ix.y, e1.x2, e1.y2);
      const a2 = angleBetween(ix.x, ix.y, e2.x2, e2.y2);

      const cp1 = { x: ix.x + this.dist1 * Math.cos(a1), y: ix.y + this.dist1 * Math.sin(a1) };
      const cp2 = { x: ix.x + this.dist2 * Math.cos(a2), y: ix.y + this.dist2 * Math.sin(a2) };

      this.engine._removeFromSpatialGrid(e1);
      this.engine._removeFromSpatialGrid(e2);

      if (dist(e1.x2, e1.y2, ix.x, ix.y) < dist(e1.x1, e1.y1, ix.x, ix.y)) {
        e1.x2 = cp1.x; e1.y2 = cp1.y;
      } else {
        e1.x1 = cp1.x; e1.y1 = cp1.y;
      }
      if (dist(e2.x1, e2.y1, ix.x, ix.y) < dist(e2.x2, e2.y2, ix.x, ix.y)) {
        e2.x1 = cp2.x; e2.y1 = cp2.y;
      } else {
        e2.x2 = cp2.x; e2.y2 = cp2.y;
      }

      this.engine._addToSpatialGrid(e1);
      this.engine._addToSpatialGrid(e2);

      // Add chamfer line
      this.engine.addEntity({
        type: 'line',
        x1: cp1.x, y1: cp1.y,
        x2: cp2.x, y2: cp2.y,
      });
    }

    this.engine.modified = true;
    this.finish();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BREAK Command
// ═══════════════════════════════════════════════════════════════════════════════

export class BreakCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entity = null;
    this.point1 = null;
    this.phase = 'pick';
  }

  start() {
    this.prompt('BREAK — Select entity: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'pick') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.entity = pick.entity;
        this.point1 = { x: wx, y: wy };
        this.setPoint(wx, wy);
        this.phase = 'point2';
        this.prompt('Specify second break point: ');
      }
      return;
    }
    if (this.phase === 'point2') {
      this._doBreak(wx, wy);
    }
  }

  onInput(text) {
    if (this.phase === 'point2') {
      const pt = this.parsePoint(text);
      if (pt && pt.x !== undefined) {
        this._doBreak(pt.x, pt.y);
      }
    }
  }

  _doBreak(x2, y2) {
    const e = this.entity;
    if (e.type !== 'line') {
      this.message('Break currently supports lines.');
      this.finish();
      return;
    }

    const dx = e.x2 - e.x1;
    const dy = e.y2 - e.y1;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-12) { this.finish(); return; }

    let t1 = ((this.point1.x - e.x1) * dx + (this.point1.y - e.y1) * dy) / len2;
    let t2 = ((x2 - e.x1) * dx + (y2 - e.y1) * dy) / len2;

    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    t1 = Math.max(0, t1);
    t2 = Math.min(1, t2);

    this.engine.removeEntity(e.id);

    // Create up to two segments
    if (t1 > 0.001) {
      this.engine.addEntity({
        type: 'line',
        x1: e.x1, y1: e.y1,
        x2: e.x1 + t1 * dx, y2: e.y1 + t1 * dy,
        layer: e.layer,
      });
    }
    if (t2 < 0.999) {
      this.engine.addEntity({
        type: 'line',
        x1: e.x1 + t2 * dx, y1: e.y1 + t2 * dy,
        x2: e.x2, y2: e.y2,
        layer: e.layer,
      });
    }

    this.finish();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOIN Command
// ═══════════════════════════════════════════════════════════════════════════════

export class JoinCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entities = null;
    this.selector = null;
    this.phase = 'select';
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this.entities = entities;
      this._doJoin();
    });
    this.prompt('JOIN — Select entities to join: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
    }
  }

  onInput(text) {
    if (this.phase === 'select') {
      this.selector.onInput(text);
    }
  }

  onKey(key) {
    if (this.phase === 'select' && this.selector.onKey(key)) return;
    if (key === 'Escape') this.cancel();
  }

  _doJoin() {
    // Collect all line entities and join into a polyline
    const lines = this.entities.filter(e => e.type === 'line');
    if (lines.length < 2) {
      this.message('Need at least 2 lines to join.');
      this.finish();
      return;
    }

    // Simple chain: start from first line, find connected endpoints
    const pts = [{ x: lines[0].x1, y: lines[0].y1 }, { x: lines[0].x2, y: lines[0].y2 }];
    const used = new Set([lines[0].id]);

    let changed = true;
    while (changed) {
      changed = false;
      for (const line of lines) {
        if (used.has(line.id)) continue;
        const last = pts[pts.length - 1];
        const first = pts[0];
        const tol = 0.01;
        if (dist(last.x, last.y, line.x1, line.y1) < tol) {
          pts.push({ x: line.x2, y: line.y2 });
          used.add(line.id); changed = true;
        } else if (dist(last.x, last.y, line.x2, line.y2) < tol) {
          pts.push({ x: line.x1, y: line.y1 });
          used.add(line.id); changed = true;
        } else if (dist(first.x, first.y, line.x2, line.y2) < tol) {
          pts.unshift({ x: line.x1, y: line.y1 });
          used.add(line.id); changed = true;
        } else if (dist(first.x, first.y, line.x1, line.y1) < tol) {
          pts.unshift({ x: line.x2, y: line.y2 });
          used.add(line.id); changed = true;
        }
      }
    }

    // Remove original entities
    for (const line of lines) {
      if (used.has(line.id)) {
        this.engine.removeEntity(line.id);
      }
    }

    // Check if closed
    const closed = dist(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y) < 0.01;
    if (closed) pts.pop();

    this.engine.addEntity({
      type: 'polyline',
      points: pts.map(p => ({ x: p.x, y: p.y, bulge: 0 })),
      closed,
      globalWidth: 0,
    });

    this.message(`Joined ${used.size} entities into a polyline.`);
    this.finish();
  }

  getPreview() {
    if (this.selector) return this.selector.getPreview(this._mouseX, this._mouseY);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLODE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class ExplodeCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.selector = null;
    this.phase = 'select';
  }

  start() {
    this.selector = new SelectionCollector(this.engine, ({ entities }) => {
      this._doExplode(entities);
    });
    this.prompt('EXPLODE — Select objects: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      this.selector.onClick(wx, wy);
      this.prompt(this.selector.getPrompt());
    }
  }

  onInput(text) {
    if (this.phase === 'select') this.selector.onInput(text);
  }

  onKey(key) {
    if (this.phase === 'select' && this.selector.onKey(key)) return;
    if (key === 'Escape') this.cancel();
  }

  _doExplode(entities) {
    let count = 0;
    for (const entity of entities) {
      if (entity.type === 'polyline') {
        const pts = entity.points;
        const n = pts.length;
        const limit = entity.closed ? n : n - 1;
        for (let i = 0; i < limit; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % n];
          if (p1.bulge && Math.abs(p1.bulge) > 1e-6) {
            // Convert bulge segment to arc entity
            const arc = this._bulgeToArc(p1, p2);
            if (arc) this.engine.addEntity(arc);
          } else {
            this.engine.addEntity({
              type: 'line',
              x1: p1.x, y1: p1.y,
              x2: p2.x, y2: p2.y,
              layer: entity.layer,
            });
          }
        }
        this.engine.removeEntity(entity.id);
        count++;
      } else if (entity.type === 'dimension') {
        // Explode dimension into lines and text
        // (Simplified: just keep the entity — full implementation would decompose)
        this.message('Dimension explode not fully implemented.');
      }
    }
    this.message(`Exploded ${count} entities.`);
    this.finish();
  }

  _bulgeToArc(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-12) return null;
    const s = d / 2;
    const bulge = p1.bulge;
    const r = s * (bulge * bulge + 1) / (2 * Math.abs(bulge));
    const sagitta = Math.abs(bulge) * s;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const perpX = -dy / d;
    const perpY = dx / d;
    const h = r - sagitta;
    const sign = bulge > 0 ? 1 : -1;
    const cx = midX + sign * h * perpX;
    const cy = midY + sign * h * perpY;
    const startAngle = angleBetween(cx, cy, p1.x, p1.y);
    const endAngle = angleBetween(cx, cy, p2.x, p2.y);
    return {
      type: 'arc',
      cx, cy, r,
      startAngle, endAngle,
      ccw: bulge > 0,
    };
  }

  getPreview() {
    if (this.selector) return this.selector.getPreview(this._mouseX, this._mouseY);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRETCH Command
// ═══════════════════════════════════════════════════════════════════════════════

export class StretchCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.windowCorner1 = null;
    this.windowCorner2 = null;
    this.basePoint = null;
    this.affected = []; // { entity, vertexIndices }
    this.phase = 'window1';
  }

  start() {
    this.prompt('STRETCH — Specify first corner of crossing window: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'window1') {
      this.windowCorner1 = { x: wx, y: wy };
      this.phase = 'window2';
      this.prompt('Specify opposite corner: ');
      return;
    }
    if (this.phase === 'window2') {
      this.windowCorner2 = { x: wx, y: wy };
      this._collectAffected();
      this.phase = 'base';
      this.prompt('Specify base point: ');
      return;
    }
    if (this.phase === 'base') {
      this.basePoint = { x: wx, y: wy };
      this.setPoint(wx, wy);
      this.phase = 'dest';
      this.prompt('Specify displacement point: ');
      return;
    }
    if (this.phase === 'dest') {
      this._doStretch(wx, wy);
    }
  }

  onInput(text) {
    const pt = this.parsePoint(text);
    if (pt && pt.x !== undefined) this.onClick(pt.x, pt.y);
  }

  _collectAffected() {
    const minX = Math.min(this.windowCorner1.x, this.windowCorner2.x);
    const minY = Math.min(this.windowCorner1.y, this.windowCorner2.y);
    const maxX = Math.max(this.windowCorner1.x, this.windowCorner2.x);
    const maxY = Math.max(this.windowCorner1.y, this.windowCorner2.y);

    for (const entity of this.engine.entities.values()) {
      if (entity.type === 'line') {
        const indices = [];
        if (entity.x1 >= minX && entity.x1 <= maxX && entity.y1 >= minY && entity.y1 <= maxY) indices.push(0);
        if (entity.x2 >= minX && entity.x2 <= maxX && entity.y2 >= minY && entity.y2 <= maxY) indices.push(1);
        if (indices.length > 0) this.affected.push({ entity, indices });
      } else if (entity.type === 'polyline') {
        const indices = [];
        entity.points.forEach((p, i) => {
          if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) indices.push(i);
        });
        if (indices.length > 0) this.affected.push({ entity, indices });
      }
    }
    this.message(`${this.affected.length} entities affected.`);
  }

  _doStretch(destX, destY) {
    const dx = destX - this.basePoint.x;
    const dy = destY - this.basePoint.y;

    for (const { entity, indices } of this.affected) {
      this.engine._removeFromSpatialGrid(entity);
      if (entity.type === 'line') {
        for (const idx of indices) {
          if (idx === 0) { entity.x1 += dx; entity.y1 += dy; }
          if (idx === 1) { entity.x2 += dx; entity.y2 += dy; }
        }
      } else if (entity.type === 'polyline') {
        for (const idx of indices) {
          entity.points[idx].x += dx;
          entity.points[idx].y += dy;
        }
      }
      this.engine._addToSpatialGrid(entity);
    }
    this.engine.modified = true;
    this.finish();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LENGTHEN Command
// ═══════════════════════════════════════════════════════════════════════════════

export class LengthenCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.mode = 'delta'; // 'delta', 'percent', 'total', 'dynamic'
    this.value = 0;
    this.phase = 'mode';
  }

  start() {
    this.prompt('LENGTHEN — Select entity or [DElta/Percent/Total/DYnamic]: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'select') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this._doLengthen(pick.entity, wx, wy);
      }
    }
  }

  onInput(text) {
    const t = text.toLowerCase();
    if (this.phase === 'mode') {
      if (t === 'de' || t === 'delta') {
        this.mode = 'delta';
        this.prompt('Specify delta length: ');
        this.phase = 'value';
      } else if (t === 'p' || t === 'percent') {
        this.mode = 'percent';
        this.prompt('Specify percentage: ');
        this.phase = 'value';
      } else if (t === 't' || t === 'total') {
        this.mode = 'total';
        this.prompt('Specify total length: ');
        this.phase = 'value';
      } else if (t === 'dy' || t === 'dynamic') {
        this.mode = 'dynamic';
        this.phase = 'select';
        this.prompt('Select entity to lengthen: ');
      } else {
        // Try picking entity directly
        const pick = this.engine.pickEntity(this._mouseX, this._mouseY);
        if (pick) {
          if (pick.entity.type === 'line') {
            const len = dist(pick.entity.x1, pick.entity.y1, pick.entity.x2, pick.entity.y2);
            this.message(`Current length: ${len.toFixed(4)}`);
          }
        }
      }
      return;
    }
    if (this.phase === 'value') {
      const v = parseNumber(text);
      if (v !== null) {
        this.value = v;
        this.phase = 'select';
        this.prompt('Select entity to lengthen (Enter to finish): ');
      }
      return;
    }
    if (this.phase === 'select' && text === '') {
      this.finish();
    }
  }

  _doLengthen(entity, pickX, pickY) {
    if (entity.type !== 'line') {
      this.message('Lengthen currently supports lines.');
      return;
    }

    const dx = entity.x2 - entity.x1;
    const dy = entity.y2 - entity.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-12) return;

    // Determine which end to lengthen (nearest to pick)
    const d1 = dist(entity.x1, entity.y1, pickX, pickY);
    const d2 = dist(entity.x2, entity.y2, pickX, pickY);
    const extendEnd = d2 < d1;

    let newLen;
    switch (this.mode) {
      case 'delta': newLen = len + this.value; break;
      case 'percent': newLen = len * (this.value / 100); break;
      case 'total': newLen = this.value; break;
      default: newLen = len; break;
    }
    if (newLen <= 0) { this.message('Length must be positive.'); return; }

    const ux = dx / len;
    const uy = dy / len;

    this.engine._removeFromSpatialGrid(entity);
    if (extendEnd) {
      entity.x2 = entity.x1 + ux * newLen;
      entity.y2 = entity.y1 + uy * newLen;
    } else {
      entity.x1 = entity.x2 - ux * newLen;
      entity.y1 = entity.y2 - uy * newLen;
    }
    this.engine._addToSpatialGrid(entity);
    this.engine.modified = true;
    this.prompt('Select entity to lengthen (Enter to finish): ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIVIDE Command
// ═══════════════════════════════════════════════════════════════════════════════

export class DivideCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entity = null;
    this.phase = 'pick';
  }

  start() {
    this.prompt('DIVIDE — Select entity to divide: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'pick') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.entity = pick.entity;
        this.phase = 'count';
        this.prompt('Enter number of segments: ');
      }
    }
  }

  onInput(text) {
    if (this.phase === 'count') {
      const n = parseInt(text, 10);
      if (n >= 2) {
        this._doDivide(n);
      } else {
        this.message('Number must be >= 2.');
      }
    }
  }

  _doDivide(n) {
    const e = this.entity;
    if (e.type === 'line') {
      for (let i = 1; i < n; i++) {
        const t = i / n;
        this.engine.addEntity({
          type: 'point',
          x: e.x1 + t * (e.x2 - e.x1),
          y: e.y1 + t * (e.y2 - e.y1),
          layer: 'Defpoints',
        });
      }
    } else if (e.type === 'circle') {
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / n;
        this.engine.addEntity({
          type: 'point',
          x: e.cx + e.r * Math.cos(a),
          y: e.cy + e.r * Math.sin(a),
          layer: 'Defpoints',
        });
      }
    } else if (e.type === 'polyline') {
      // Compute total length, then place at equal intervals
      const pts = e.points;
      let totalLen = 0;
      const segs = [];
      const limit = e.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < limit; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const d = dist(p1.x, p1.y, p2.x, p2.y);
        segs.push({ p1, p2, len: d, cumLen: totalLen });
        totalLen += d;
      }
      const step = totalLen / n;
      for (let i = 1; i < n; i++) {
        const target = i * step;
        for (const seg of segs) {
          if (target >= seg.cumLen && target <= seg.cumLen + seg.len) {
            const t = (target - seg.cumLen) / seg.len;
            this.engine.addEntity({
              type: 'point',
              x: seg.p1.x + t * (seg.p2.x - seg.p1.x),
              y: seg.p1.y + t * (seg.p2.y - seg.p1.y),
              layer: 'Defpoints',
            });
            break;
          }
        }
      }
    }
    this.message(`Placed ${n - 1} division points.`);
    this.finish();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEASURE (Mark at intervals) Command
// ═══════════════════════════════════════════════════════════════════════════════

export class MeasureMarkCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.entity = null;
    this.phase = 'pick';
  }

  start() {
    this.prompt('MEASURE — Select entity to measure: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'pick') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.entity = pick.entity;
        this.phase = 'interval';
        this.prompt('Specify interval distance: ');
      }
    }
  }

  onInput(text) {
    if (this.phase === 'interval') {
      const v = parseNumber(text);
      if (v !== null && v > 0) {
        this._doMeasure(v);
      }
    }
  }

  _doMeasure(interval) {
    const e = this.entity;
    if (e.type === 'line') {
      const len = dist(e.x1, e.y1, e.x2, e.y2);
      let count = 0;
      for (let d = interval; d < len; d += interval) {
        const t = d / len;
        this.engine.addEntity({
          type: 'point',
          x: e.x1 + t * (e.x2 - e.x1),
          y: e.y1 + t * (e.y2 - e.y1),
          layer: 'Defpoints',
        });
        count++;
      }
      this.message(`Placed ${count} points at ${interval} intervals.`);
    } else if (e.type === 'polyline') {
      const pts = e.points;
      let totalLen = 0;
      const segs = [];
      const limit = e.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < limit; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const d = dist(p1.x, p1.y, p2.x, p2.y);
        segs.push({ p1, p2, len: d, cumLen: totalLen });
        totalLen += d;
      }
      let count = 0;
      for (let d = interval; d < totalLen; d += interval) {
        for (const seg of segs) {
          if (d >= seg.cumLen && d <= seg.cumLen + seg.len) {
            const t = (d - seg.cumLen) / seg.len;
            this.engine.addEntity({
              type: 'point',
              x: seg.p1.x + t * (seg.p2.x - seg.p1.x),
              y: seg.p1.y + t * (seg.p2.y - seg.p1.y),
              layer: 'Defpoints',
            });
            count++;
            break;
          }
        }
      }
      this.message(`Placed ${count} points at ${interval} intervals.`);
    }
    this.finish();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHPROP Command
// ═══════════════════════════════════════════════════════════════════════════════

export class MatchPropCommand extends BaseCommand {
  constructor(engine, registry) {
    super(engine, registry);
    this.source = null;
    this.phase = 'source';
  }

  start() {
    this.prompt('MATCHPROP — Select source entity: ');
  }

  onClick(wx, wy) {
    if (this.phase === 'source') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this.source = pick.entity;
        this.phase = 'target';
        this.prompt('Select target entities (Enter to finish): ');
      }
      return;
    }
    if (this.phase === 'target') {
      const pick = this.engine.pickEntity(wx, wy);
      if (pick) {
        this._applyProps(pick.entity);
        this.prompt('Select target entities (Enter to finish): ');
      }
    }
  }

  onInput(text) {
    if (this.phase === 'target' && text === '') {
      this.finish();
    }
  }

  onKey(key) {
    if (key === 'Enter' && this.phase === 'target') {
      this.finish();
    } else if (key === 'Escape') {
      this.cancel();
    }
  }

  _applyProps(target) {
    target.layer = this.source.layer;
    target.color = { ...this.source.color };
    target.linetype = this.source.linetype;
    target.lineweight = this.source.lineweight;
    this.engine.modified = true;
    this.engine.emit('entities-modified', { entities: [target] });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Registration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register all modify commands on a CommandRegistry instance.
 * @param {import('./CommandRegistry.js').CommandRegistry} registry
 */
export function registerModifyCommands(registry) {
  registry.register('MOVE',       ['M'],           MoveCommand);
  registry.register('COPY',       ['CO', 'CP'],    CopyCommand);
  registry.register('ROTATE',     ['RO'],          RotateCommand);
  registry.register('SCALE',      ['SC'],          ScaleCommand);
  registry.register('MIRROR',     ['MI'],          MirrorCommand);
  registry.register('OFFSET',     ['O'],           OffsetCommand);
  registry.register('ARRAYRECT',  ['AR'],          ArrayRectCommand);
  registry.register('ARRAYPOLAR', ['AP'],          ArrayPolarCommand);
  registry.register('TRIM',       ['TR'],          TrimCommand);
  registry.register('EXTEND',     ['EX'],          ExtendCommand);
  registry.register('FILLET',     ['F'],           FilletCommand);
  registry.register('CHAMFER',    ['CHA'],         ChamferCommand);
  registry.register('BREAK',      ['BR'],          BreakCommand);
  registry.register('JOIN',       ['J'],           JoinCommand);
  registry.register('EXPLODE',    ['X'],           ExplodeCommand);
  registry.register('STRETCH',    ['S'],           StretchCommand);
  registry.register('LENGTHEN',   ['LEN'],         LengthenCommand);
  registry.register('DIVIDE',     ['DIV'],         DivideCommand);
  registry.register('MEASURE',    ['ME'],          MeasureMarkCommand);
  registry.register('MATCHPROP',  ['MA'],          MatchPropCommand);
}
