/**
 * AfroDraft v6 — Snap Engine
 * Implements all 15 snap types, polar tracking, ortho, and object snap tracking.
 */

import { Geometry } from './Geometry.js';

const SNAP_TYPES = [
  'endpoint', 'midpoint', 'center', 'node', 'quadrant',
  'intersection', 'extension', 'insertion', 'perpendicular',
  'tangent', 'nearest', 'apparent', 'parallel',
];

export class SnapEngine {
  /**
   * @param {import('./Engine.js').Engine} engine
   */
  constructor(engine) {
    this.engine = engine;

    // Enabled snap types
    this.enabledSnaps = new Set(['endpoint', 'midpoint', 'center', 'intersection', 'perpendicular', 'nearest']);

    // Polar tracking angles (degrees)
    this.polarAngles = [0, 90, 180, 270];
    this.polarEnabled = false;
    this.polarIncrement = 90; // degrees

    // Ortho mode
    this.orthoEnabled = false;

    // Object snap tracking
    this.trackingPoints = [];    // acquired snap points for OTrack
    this.trackingEnabled = false;

    // Snap aperture in world units (adjusted by zoom)
    this.aperture = 10;

    // Override snap for one pick only
    this._oneTimeSnap = null;

    // Extension tracking state
    this._extensionRef = null;

    // Parallel tracking state
    this._parallelRef = null;
  }

  // ===================== MAIN SNAP FUNCTION =====================

  /**
   * Find the best snap point near the cursor.
   * @param {number} worldX — cursor position in world coordinates
   * @param {number} worldY
   * @param {number} [aperture] — override aperture
   * @param {{ x, y }|null} [basePoint] — for perpendicular/tangent/extension
   * @returns {{ type: string, x: number, y: number, entity: Object|null } | null}
   */
  findSnap(worldX, worldY, aperture, basePoint) {
    const ap = aperture ?? this.aperture;
    const snapsToCheck = this._oneTimeSnap ? new Set([this._oneTimeSnap]) : this.enabledSnaps;
    this._oneTimeSnap = null;

    const candidates = [];

    // Get nearby entities
    const nearby = this.engine.getEntitiesInBounds(
      worldX - ap, worldY - ap, worldX + ap, worldY + ap
    );

    // Also check all entities for snap points that might be within aperture
    // but whose bounding box doesn't overlap (e.g., center of a large circle)
    const allEntities = nearby.length < this.engine.entities.size
      ? [...nearby, ...this._getAdditionalSnapEntities(worldX, worldY, ap)]
      : nearby;

    const checked = new Set();
    for (const entity of allEntities) {
      if (checked.has(entity.id)) continue;
      checked.add(entity.id);
      if (!entity.visible) continue;
      const layer = this.engine.layers[entity.layer];
      if (layer && (!layer.visible || layer.frozen)) continue;

      // Collect snap points from entity
      this._collectEntitySnaps(entity, worldX, worldY, ap, snapsToCheck, candidates, basePoint);
    }

    // Check intersection snaps (pairs of entities)
    if (snapsToCheck.has('intersection')) {
      this._collectIntersectionSnaps(allEntities, worldX, worldY, ap, candidates);
    }

    // Extension snap
    if (snapsToCheck.has('extension') && this._extensionRef) {
      this._collectExtensionSnap(worldX, worldY, ap, candidates);
    }

    // Parallel snap
    if (snapsToCheck.has('parallel') && this._parallelRef && basePoint) {
      this._collectParallelSnap(worldX, worldY, ap, basePoint, candidates);
    }

    if (candidates.length === 0) return null;

    // Return closest candidate
    candidates.sort((a, b) => a.dist - b.dist);
    const best = candidates[0];
    return { type: best.type, x: best.x, y: best.y, entity: best.entity || null };
  }

  // ===================== ENTITY SNAP COLLECTION =====================

  _collectEntitySnaps(entity, wx, wy, ap, enabledSet, out, basePoint) {
    if (typeof entity.getSnapPoints !== 'function') return;

    const snaps = entity.getSnapPoints();
    for (const snap of snaps) {
      if (!enabledSet.has(snap.type)) continue;
      const d = Geometry.distance({ x: wx, y: wy }, { x: snap.x, y: snap.y });
      if (d <= ap) {
        out.push({ type: snap.type, x: snap.x, y: snap.y, dist: d, entity });
      }
    }

    // Perpendicular snap
    if (enabledSet.has('perpendicular') && basePoint) {
      const perp = this._findPerpendicularSnap(entity, wx, wy, ap, basePoint);
      if (perp) out.push(perp);
    }

    // Tangent snap
    if (enabledSet.has('tangent') && basePoint) {
      const tang = this._findTangentSnap(entity, wx, wy, ap, basePoint);
      if (tang) out.push(tang);
    }

    // Nearest snap
    if (enabledSet.has('nearest')) {
      const near = this._findNearestSnap(entity, wx, wy, ap);
      if (near) out.push(near);
    }

    // Extension tracking: record endpoint hovering
    if (enabledSet.has('extension')) {
      this._checkExtensionAcquire(entity, wx, wy, ap);
    }

    // Parallel tracking: record line hovering
    if (enabledSet.has('parallel')) {
      this._checkParallelAcquire(entity, wx, wy, ap);
    }
  }

  // ===================== PERPENDICULAR SNAP =====================

  _findPerpendicularSnap(entity, wx, wy, ap, basePoint) {
    if (entity.type === 'line') {
      const foot = Geometry.perpFoot(basePoint, entity.start, entity.end);
      // Check that foot is on the segment
      const t = this._paramOnSegment(foot, entity.start, entity.end);
      if (t >= -0.01 && t <= 1.01) {
        const d = Geometry.distance({ x: wx, y: wy }, foot);
        if (d <= ap) {
          return { type: 'perpendicular', x: foot.x, y: foot.y, dist: d, entity };
        }
      }
    } else if (entity.type === 'circle') {
      const angle = Geometry.angle(entity.center, basePoint);
      const p = Geometry.pointOnArc(entity.center, entity.radius, angle);
      const d = Geometry.distance({ x: wx, y: wy }, p);
      if (d <= ap) {
        return { type: 'perpendicular', x: p.x, y: p.y, dist: d, entity };
      }
    } else if (entity.type === 'arc') {
      const angle = Geometry.angle(entity.center, basePoint);
      const na = Geometry.normalizeAngle(angle);
      const sa = Geometry.normalizeAngle(entity.startAngle);
      const ea = Geometry.normalizeAngle(entity.endAngle);
      // Check if angle is within arc
      const inArc = sa <= ea ? (na >= sa && na <= ea) : (na >= sa || na <= ea);
      if (inArc) {
        const p = Geometry.pointOnArc(entity.center, entity.radius, angle);
        const d = Geometry.distance({ x: wx, y: wy }, p);
        if (d <= ap) {
          return { type: 'perpendicular', x: p.x, y: p.y, dist: d, entity };
        }
      }
    } else if (entity.type === 'polyline') {
      let bestPerp = null;
      const verts = entity.vertices;
      const n = verts.length;
      const segs = entity.closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const a = verts[i], b = verts[(i + 1) % n];
        const foot = Geometry.perpFoot(basePoint, a, b);
        const t = this._paramOnSegment(foot, a, b);
        if (t >= -0.01 && t <= 1.01) {
          const d = Geometry.distance({ x: wx, y: wy }, foot);
          if (d <= ap && (!bestPerp || d < bestPerp.dist)) {
            bestPerp = { type: 'perpendicular', x: foot.x, y: foot.y, dist: d, entity };
          }
        }
      }
      return bestPerp;
    }
    return null;
  }

  // ===================== TANGENT SNAP =====================

  _findTangentSnap(entity, wx, wy, ap, basePoint) {
    if (entity.type === 'circle' || entity.type === 'arc') {
      const tps = Geometry.tangentPoints(basePoint, entity.center, entity.radius);
      let best = null;
      for (const tp of tps) {
        if (entity.type === 'arc') {
          const angle = Geometry.angle(entity.center, tp);
          const na = Geometry.normalizeAngle(angle);
          const sa = Geometry.normalizeAngle(entity.startAngle);
          const ea = Geometry.normalizeAngle(entity.endAngle);
          const inArc = sa <= ea ? (na >= sa && na <= ea) : (na >= sa || na <= ea);
          if (!inArc) continue;
        }
        const d = Geometry.distance({ x: wx, y: wy }, tp);
        if (d <= ap && (!best || d < best.dist)) {
          best = { type: 'tangent', x: tp.x, y: tp.y, dist: d, entity };
        }
      }
      return best;
    }
    return null;
  }

  // ===================== NEAREST SNAP =====================

  _findNearestSnap(entity, wx, wy, ap) {
    if (typeof entity.distanceTo !== 'function') return null;
    const d = entity.distanceTo(wx, wy);
    if (d > ap) return null;

    // Find the actual nearest point on the entity
    let nearestPt = null;

    if (entity.type === 'line') {
      nearestPt = this._nearestOnSegment({ x: wx, y: wy }, entity.start, entity.end);
    } else if (entity.type === 'circle') {
      const angle = Math.atan2(wy - entity.center.y, wx - entity.center.x);
      nearestPt = Geometry.pointOnArc(entity.center, entity.radius, angle);
    } else if (entity.type === 'arc') {
      const angle = Math.atan2(wy - entity.center.y, wx - entity.center.x);
      nearestPt = Geometry.pointOnArc(entity.center, entity.radius, angle);
    } else if (entity.type === 'polyline') {
      let minD = Infinity;
      const verts = entity.vertices;
      const n = verts.length;
      const segs = entity.closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const a = verts[i], b = verts[(i + 1) % n];
        const np = this._nearestOnSegment({ x: wx, y: wy }, a, b);
        const dd = Geometry.distance({ x: wx, y: wy }, np);
        if (dd < minD) { minD = dd; nearestPt = np; }
      }
    }

    if (nearestPt) {
      return { type: 'nearest', x: nearestPt.x, y: nearestPt.y, dist: d, entity };
    }
    return null;
  }

  // ===================== INTERSECTION SNAP =====================

  _collectIntersectionSnaps(entities, wx, wy, ap, out) {
    // Check pairs of nearby entities for intersections
    const list = entities.filter(e => e.visible);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const pts = this._findEntityIntersections(list[i], list[j]);
        for (const p of pts) {
          const d = Geometry.distance({ x: wx, y: wy }, p);
          if (d <= ap) {
            out.push({ type: 'intersection', x: p.x, y: p.y, dist: d, entity: list[i] });
          }
        }
      }
    }
  }

  _findEntityIntersections(e1, e2) {
    const pts = [];

    // Line-Line
    if (e1.type === 'line' && e2.type === 'line') {
      const ix = Geometry.segmentIntersection(e1.start, e1.end, e2.start, e2.end);
      if (ix) pts.push(ix);
    }
    // Line-Circle
    else if (e1.type === 'line' && e2.type === 'circle') {
      const ips = Geometry.circleLineIntersection(e2.center, e2.radius, e1.start, e1.end);
      for (const p of ips) {
        const t = this._paramOnSegment(p, e1.start, e1.end);
        if (t >= -0.01 && t <= 1.01) pts.push(p);
      }
    }
    else if (e1.type === 'circle' && e2.type === 'line') {
      return this._findEntityIntersections(e2, e1);
    }
    // Circle-Circle
    else if (e1.type === 'circle' && e2.type === 'circle') {
      const ips = Geometry.circleCircleIntersection(e1.center, e1.radius, e2.center, e2.radius);
      pts.push(...ips);
    }
    // Line-Polyline
    else if (e1.type === 'line' && e2.type === 'polyline') {
      const verts = e2.vertices;
      const n = verts.length;
      const segs = e2.closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const ix = Geometry.segmentIntersection(e1.start, e1.end, verts[i], verts[(i + 1) % n]);
        if (ix) pts.push(ix);
      }
    }
    else if (e1.type === 'polyline' && e2.type === 'line') {
      return this._findEntityIntersections(e2, e1);
    }
    // Polyline-Polyline
    else if (e1.type === 'polyline' && e2.type === 'polyline') {
      const v1 = e1.vertices, v2 = e2.vertices;
      const n1 = v1.length, n2 = v2.length;
      const s1 = e1.closed ? n1 : n1 - 1;
      const s2 = e2.closed ? n2 : n2 - 1;
      for (let i = 0; i < s1; i++) {
        for (let j = 0; j < s2; j++) {
          const ix = Geometry.segmentIntersection(v1[i], v1[(i + 1) % n1], v2[j], v2[(j + 1) % n2]);
          if (ix) pts.push(ix);
        }
      }
    }
    // Line-Arc
    else if (e1.type === 'line' && e2.type === 'arc') {
      const ips = Geometry.circleLineIntersection(e2.center, e2.radius, e1.start, e1.end);
      for (const p of ips) {
        const t = this._paramOnSegment(p, e1.start, e1.end);
        const angle = Math.atan2(p.y - e2.center.y, p.x - e2.center.x);
        if (t >= -0.01 && t <= 1.01 && this._angleInArc(angle, e2.startAngle, e2.endAngle)) {
          pts.push(p);
        }
      }
    }
    else if (e1.type === 'arc' && e2.type === 'line') {
      return this._findEntityIntersections(e2, e1);
    }

    return pts;
  }

  // ===================== EXTENSION SNAP =====================

  _checkExtensionAcquire(entity, wx, wy, ap) {
    if (entity.type !== 'line') return;
    const dStart = Geometry.distance({ x: wx, y: wy }, entity.start);
    const dEnd = Geometry.distance({ x: wx, y: wy }, entity.end);
    if (dStart <= ap || dEnd <= ap) {
      this._extensionRef = {
        entity,
        fromEnd: dEnd < dStart,
        endpoint: dEnd < dStart ? entity.end : entity.start,
        direction: dEnd < dStart
          ? Geometry.normalize(Geometry.subVec(entity.end, entity.start))
          : Geometry.normalize(Geometry.subVec(entity.start, entity.end)),
      };
    }
  }

  _collectExtensionSnap(wx, wy, ap, out) {
    const ref = this._extensionRef;
    if (!ref) return;
    // Project cursor onto extension ray
    const ep = ref.endpoint;
    const dir = ref.direction;
    const dx = wx - ep.x, dy = wy - ep.y;
    const t = dx * dir.x + dy * dir.y;
    if (t < 0) { this._extensionRef = null; return; } // behind endpoint
    const px = ep.x + t * dir.x, py = ep.y + t * dir.y;
    const d = Geometry.distance({ x: wx, y: wy }, { x: px, y: py });
    if (d <= ap) {
      out.push({ type: 'extension', x: px, y: py, dist: d, entity: ref.entity });
    }
  }

  // ===================== PARALLEL SNAP =====================

  _checkParallelAcquire(entity, wx, wy, ap) {
    if (entity.type !== 'line') return;
    // If hovering near a line, acquire it for parallel tracking
    if (entity.distanceTo(wx, wy) <= ap) {
      this._parallelRef = {
        entity,
        angle: Geometry.angle(entity.start, entity.end),
      };
    }
  }

  _collectParallelSnap(wx, wy, ap, basePoint, out) {
    const ref = this._parallelRef;
    if (!ref || !basePoint) return;
    const a = ref.angle;
    // Direction from base point
    const dir = { x: Math.cos(a), y: Math.sin(a) };
    const dx = wx - basePoint.x, dy = wy - basePoint.y;
    const t = dx * dir.x + dy * dir.y;
    const px = basePoint.x + t * dir.x, py = basePoint.y + t * dir.y;
    const d = Geometry.distance({ x: wx, y: wy }, { x: px, y: py });
    if (d <= ap) {
      out.push({ type: 'parallel', x: px, y: py, dist: d, entity: ref.entity });
    }
  }

  // ===================== POLAR TRACKING =====================

  /**
   * Find a polar tracking constraint point.
   * @param {number} worldX
   * @param {number} worldY
   * @param {{ x, y }} basePoint — last input point
   * @returns {{ x: number, y: number, angle: number } | null}
   */
  findPolarTrack(worldX, worldY, basePoint) {
    if (!this.polarEnabled || !basePoint) return null;

    const cursorAngle = Geometry.angle(basePoint, { x: worldX, y: worldY });
    const cursorDist = Geometry.distance(basePoint, { x: worldX, y: worldY });
    const cursorDeg = Geometry.toDegrees(Geometry.normalizeAngle(cursorAngle));

    // Check each polar angle
    let bestAngle = null;
    let bestDiff = Infinity;
    const tolerance = 5; // degrees

    for (const pa of this.polarAngles) {
      const diff = Math.abs(this._angleDiffDeg(cursorDeg, pa));
      if (diff < tolerance && diff < bestDiff) {
        bestDiff = diff;
        bestAngle = pa;
      }
    }

    // Also check increment-based angles
    if (this.polarIncrement > 0) {
      for (let a = 0; a < 360; a += this.polarIncrement) {
        const diff = Math.abs(this._angleDiffDeg(cursorDeg, a));
        if (diff < tolerance && diff < bestDiff) {
          bestDiff = diff;
          bestAngle = a;
        }
      }
    }

    if (bestAngle === null) return null;

    const aRad = Geometry.toRadians(bestAngle);
    const p = Geometry.polarPoint(basePoint, aRad, cursorDist);
    return { x: p.x, y: p.y, angle: bestAngle };
  }

  /**
   * Apply ortho constraint: restrict to horizontal or vertical from base.
   * @param {number} worldX
   * @param {number} worldY
   * @param {{ x, y }} basePoint
   * @returns {{ x: number, y: number }}
   */
  applyOrtho(worldX, worldY, basePoint) {
    if (!this.orthoEnabled || !basePoint) return { x: worldX, y: worldY };
    const dx = Math.abs(worldX - basePoint.x);
    const dy = Math.abs(worldY - basePoint.y);
    if (dx > dy) {
      return { x: worldX, y: basePoint.y };
    } else {
      return { x: basePoint.x, y: worldY };
    }
  }

  // ===================== OBJECT SNAP TRACKING =====================

  /**
   * Acquire a snap point for tracking.
   * @param {{ x, y }} point
   */
  acquireTrackingPoint(point) {
    // Avoid duplicates
    for (const tp of this.trackingPoints) {
      if (Geometry.distance(tp, point) < 0.01) return;
    }
    this.trackingPoints.push({ x: point.x, y: point.y });
    if (this.trackingPoints.length > 7) this.trackingPoints.shift(); // max 7 tracking points
  }

  /**
   * Clear all tracking points.
   */
  clearTrackingPoints() {
    this.trackingPoints = [];
    this._extensionRef = null;
    this._parallelRef = null;
  }

  /**
   * Find object snap tracking alignment.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {{ x: number, y: number, fromPoint: { x, y }, direction: string } | null}
   */
  findOSnapTrack(worldX, worldY) {
    if (!this.trackingEnabled || this.trackingPoints.length === 0) return null;

    const tolerance = this.aperture;

    for (const tp of this.trackingPoints) {
      // Check horizontal alignment
      if (Math.abs(worldY - tp.y) < tolerance) {
        return { x: worldX, y: tp.y, fromPoint: tp, direction: 'horizontal' };
      }
      // Check vertical alignment
      if (Math.abs(worldX - tp.x) < tolerance) {
        return { x: tp.x, y: worldY, fromPoint: tp, direction: 'vertical' };
      }
    }

    // Check intersection of two tracking lines
    if (this.trackingPoints.length >= 2) {
      const tp1 = this.trackingPoints[this.trackingPoints.length - 1];
      const tp2 = this.trackingPoints[this.trackingPoints.length - 2];
      // Horizontal from tp1, vertical from tp2
      const ix1 = { x: tp2.x, y: tp1.y };
      if (Geometry.distance({ x: worldX, y: worldY }, ix1) < tolerance) {
        return { x: ix1.x, y: ix1.y, fromPoint: tp1, direction: 'cross' };
      }
      // Vertical from tp1, horizontal from tp2
      const ix2 = { x: tp1.x, y: tp2.y };
      if (Geometry.distance({ x: worldX, y: worldY }, ix2) < tolerance) {
        return { x: ix2.x, y: ix2.y, fromPoint: tp2, direction: 'cross' };
      }
    }

    return null;
  }

  // ===================== SNAP CONFIGURATION =====================

  /**
   * Enable specific snap types.
   * @param {...string} types
   */
  enableSnap(...types) {
    for (const t of types) this.enabledSnaps.add(t);
  }

  /**
   * Disable specific snap types.
   * @param {...string} types
   */
  disableSnap(...types) {
    for (const t of types) this.enabledSnaps.delete(t);
  }

  /**
   * Set a one-time snap override (for the next pick only).
   * @param {string} type
   */
  setOneTimeSnap(type) {
    this._oneTimeSnap = type;
  }

  /**
   * Toggle all snaps on/off.
   * @param {boolean} enabled
   */
  setAllSnaps(enabled) {
    if (enabled) {
      for (const t of SNAP_TYPES) this.enabledSnaps.add(t);
    } else {
      this.enabledSnaps.clear();
    }
  }

  /**
   * Set polar tracking angle increment.
   * @param {number} degrees — e.g. 15, 30, 45, 90
   */
  setPolarIncrement(degrees) {
    this.polarIncrement = degrees;
    this.polarAngles = [];
    for (let a = 0; a < 360; a += degrees) {
      this.polarAngles.push(a);
    }
  }

  // ===================== HELPERS =====================

  _paramOnSegment(point, segStart, segEnd) {
    const dx = segEnd.x - segStart.x, dy = segEnd.y - segStart.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-10) return 0;
    return ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq;
  }

  _nearestOnSegment(point, segStart, segEnd) {
    const t = Math.max(0, Math.min(1, this._paramOnSegment(point, segStart, segEnd)));
    return {
      x: segStart.x + t * (segEnd.x - segStart.x),
      y: segStart.y + t * (segEnd.y - segStart.y),
    };
  }

  _angleInArc(angle, startAngle, endAngle) {
    const a = Geometry.normalizeAngle(angle);
    const s = Geometry.normalizeAngle(startAngle);
    const e = Geometry.normalizeAngle(endAngle);
    if (s <= e) return a >= s && a <= e;
    return a >= s || a <= e;
  }

  _angleDiffDeg(a, b) {
    let diff = a - b;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  _getAdditionalSnapEntities(wx, wy, ap) {
    // For snap types like 'center', the snap point (center) may be far from
    // the bounding box query area. Check circles/arcs specifically.
    const extra = [];
    for (const entity of this.engine.entities.values()) {
      if (!entity.visible) continue;
      if (entity.type === 'circle' || entity.type === 'arc' || entity.type === 'ellipse') {
        if (entity.center) {
          const d = Geometry.distance({ x: wx, y: wy }, entity.center);
          if (d <= ap) extra.push(entity);
        }
      }
    }
    return extra;
  }
}
