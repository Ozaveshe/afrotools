/**
 * AfroDraft v6 — Geometry Utilities
 * Pure geometric computation functions for the CAD engine.
 */

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const EPSILON = 1e-10;

export const Geometry = {

  // ===================== POINT OPERATIONS =====================

  /**
   * Euclidean distance between two points.
   */
  distance(p1, p2) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Midpoint of two points.
   */
  midpoint(p1, p2) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  },

  /**
   * Angle from p1 to p2 in radians (0 = east, CCW positive).
   */
  angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  },

  /**
   * Point at a given angle and distance from a base point.
   */
  polarPoint(base, angle, distance) {
    return {
      x: base.x + distance * Math.cos(angle),
      y: base.y + distance * Math.sin(angle),
    };
  },

  /**
   * Dot product of two vectors.
   */
  dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  },

  /**
   * Cross product (z-component) of two 2D vectors.
   */
  cross(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
  },

  /**
   * Normalize a vector to unit length.
   */
  normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len < EPSILON) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  },

  /**
   * Scale a vector.
   */
  scaleVec(v, s) {
    return { x: v.x * s, y: v.y * s };
  },

  /**
   * Add two vectors.
   */
  addVec(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  /**
   * Subtract: a - b.
   */
  subVec(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  // ===================== LINE OPERATIONS =====================

  /**
   * Intersection of two line segments.
   * Returns {x, y, t1, t2} or null. t1/t2 are parameters [0,1] on each segment.
   */
  lineIntersection(l1start, l1end, l2start, l2end) {
    const d1x = l1end.x - l1start.x, d1y = l1end.y - l1start.y;
    const d2x = l2end.x - l2start.x, d2y = l2end.y - l2start.y;
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < EPSILON) return null; // parallel

    const dx = l2start.x - l1start.x;
    const dy = l2start.y - l1start.y;
    const t1 = (dx * d2y - dy * d2x) / denom;
    const t2 = (dx * d1y - dy * d1x) / denom;

    return {
      x: l1start.x + t1 * d1x,
      y: l1start.y + t1 * d1y,
      t1,
      t2,
    };
  },

  /**
   * Intersection of two infinite lines (not clipped to segments).
   */
  lineLineIntersection(l1start, l1end, l2start, l2end) {
    const result = Geometry.lineIntersection(l1start, l1end, l2start, l2end);
    return result ? { x: result.x, y: result.y } : null;
  },

  /**
   * Intersection clipped to both segments [0,1].
   */
  segmentIntersection(l1start, l1end, l2start, l2end) {
    const result = Geometry.lineIntersection(l1start, l1end, l2start, l2end);
    if (!result) return null;
    if (result.t1 >= -EPSILON && result.t1 <= 1 + EPSILON &&
        result.t2 >= -EPSILON && result.t2 <= 1 + EPSILON) {
      return { x: result.x, y: result.y };
    }
    return null;
  },

  /**
   * Test if a point lies on a line segment within tolerance.
   */
  pointOnLine(point, lineStart, lineEnd, tolerance = 1) {
    const d = Geometry._pointToSegmentDist(point.x, point.y, lineStart.x, lineStart.y, lineEnd.x, lineEnd.y);
    return d <= tolerance;
  },

  /**
   * Perpendicular foot from a point to a line (infinite).
   */
  perpFoot(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x, dy = lineEnd.y - lineStart.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < EPSILON) return { x: lineStart.x, y: lineStart.y };
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
    return { x: lineStart.x + t * dx, y: lineStart.y + t * dy };
  },

  /**
   * Offset a line segment by a distance. side > 0 = left, < 0 = right.
   */
  lineOffset(start, end, distance, side = 1) {
    const dx = end.x - start.x, dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < EPSILON) return { start: { ...start }, end: { ...end } };
    const nx = -dy / len * distance * side;
    const ny = dx / len * distance * side;
    return {
      start: { x: start.x + nx, y: start.y + ny },
      end: { x: end.x + nx, y: end.y + ny },
    };
  },

  /**
   * Extend a line from start through end to a new total length.
   */
  extendLine(start, end, newLength) {
    const a = Geometry.angle(start, end);
    return Geometry.polarPoint(start, a, newLength);
  },

  // ===================== CIRCLE OPERATIONS =====================

  /**
   * Intersection of a circle and an infinite line.
   * Returns array of {x,y} (0, 1, or 2 points).
   */
  circleLineIntersection(center, radius, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x, dy = lineEnd.y - lineStart.y;
    const fx = lineStart.x - center.x, fy = lineStart.y - center.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    let disc = b * b - 4 * a * c;
    if (disc < -EPSILON) return [];
    if (disc < 0) disc = 0;

    const points = [];
    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    points.push({ x: lineStart.x + t1 * dx, y: lineStart.y + t1 * dy });
    if (Math.abs(t1 - t2) > EPSILON) {
      points.push({ x: lineStart.x + t2 * dx, y: lineStart.y + t2 * dy });
    }
    return points;
  },

  /**
   * Intersection of two circles. Returns 0, 1, or 2 points.
   */
  circleCircleIntersection(c1, r1, c2, r2) {
    const d = Geometry.distance(c1, c2);
    if (d > r1 + r2 + EPSILON || d < Math.abs(r1 - r2) - EPSILON || d < EPSILON) return [];

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - a * a;
    if (h2 < -EPSILON) return [];
    const h = h2 < 0 ? 0 : Math.sqrt(h2);

    const mx = c1.x + a * (c2.x - c1.x) / d;
    const my = c1.y + a * (c2.y - c1.y) / d;

    if (h < EPSILON) return [{ x: mx, y: my }];

    const ox = h * (c2.y - c1.y) / d;
    const oy = h * (c2.x - c1.x) / d;
    return [
      { x: mx + ox, y: my - oy },
      { x: mx - ox, y: my + oy },
    ];
  },

  /**
   * Tangent points from an external point to a circle.
   */
  tangentPoints(externalPoint, center, radius) {
    const d = Geometry.distance(externalPoint, center);
    if (d < radius - EPSILON) return []; // inside circle
    if (d < radius + EPSILON) {
      // On circle — single tangent point
      return [{ x: externalPoint.x, y: externalPoint.y }];
    }
    const a = Math.acos(radius / d);
    const baseAngle = Geometry.angle(externalPoint, center);
    return [
      Geometry.polarPoint(center, baseAngle + HALF_PI + a, radius),
      Geometry.polarPoint(center, baseAngle - HALF_PI - a, radius),
    ];
  },

  /**
   * Arc length given center, radius, and angle span.
   */
  arcLength(center, radius, startAngle, endAngle) {
    let span = endAngle - startAngle;
    if (span < 0) span += TWO_PI;
    return radius * span;
  },

  /**
   * Point on circle/arc at given angle.
   */
  pointOnArc(center, radius, angle) {
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  },

  /**
   * Three-point circle: returns {center, radius} or null.
   */
  circleFrom3Points(p1, p2, p3) {
    const ax = p1.x, ay = p1.y;
    const bx = p2.x, by = p2.y;
    const cx = p3.x, cy = p3.y;
    const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(D) < EPSILON) return null; // collinear
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
    const center = { x: ux, y: uy };
    return { center, radius: Geometry.distance(center, p1) };
  },

  // ===================== POLYLINE OPERATIONS =====================

  /**
   * Total length of a polyline (array of {x,y}).
   */
  polylineLength(vertices) {
    let len = 0;
    for (let i = 0; i < vertices.length - 1; i++) {
      len += Geometry.distance(vertices[i], vertices[i + 1]);
    }
    return len;
  },

  /**
   * Signed area of a polygon (positive = CCW).
   */
  polylineArea(vertices) {
    const n = vertices.length;
    if (n < 3) return 0;
    let area = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    return area / 2;
  },

  /**
   * Test if a point lies on a polyline within tolerance.
   */
  pointOnPolyline(point, vertices, tolerance = 1) {
    for (let i = 0; i < vertices.length - 1; i++) {
      if (Geometry.pointOnLine(point, vertices[i], vertices[i + 1], tolerance)) return true;
    }
    return false;
  },

  /**
   * Offset a simple polyline by distance (positive = left).
   * Returns new array of vertices.
   */
  offsetPolyline(vertices, distance) {
    if (vertices.length < 2) return vertices.map(v => ({ ...v }));

    const offSegments = [];
    for (let i = 0; i < vertices.length - 1; i++) {
      const seg = Geometry.lineOffset(vertices[i], vertices[i + 1], Math.abs(distance), distance >= 0 ? 1 : -1);
      offSegments.push(seg);
    }

    const result = [{ x: offSegments[0].start.x, y: offSegments[0].start.y }];
    for (let i = 0; i < offSegments.length - 1; i++) {
      const ix = Geometry.lineLineIntersection(
        offSegments[i].start, offSegments[i].end,
        offSegments[i + 1].start, offSegments[i + 1].end
      );
      result.push(ix || { x: offSegments[i].end.x, y: offSegments[i].end.y });
    }
    result.push({ x: offSegments[offSegments.length - 1].end.x, y: offSegments[offSegments.length - 1].end.y });

    return result;
  },

  // ===================== BOUNDING BOX =====================

  /**
   * Test if a rect contains a point.
   */
  rectContains(rect, point) {
    return point.x >= rect.minX && point.x <= rect.maxX &&
           point.y >= rect.minY && point.y <= rect.maxY;
  },

  /**
   * Test if two rects overlap.
   */
  rectIntersects(r1, r2) {
    return r1.minX <= r2.maxX && r1.maxX >= r2.minX &&
           r1.minY <= r2.maxY && r1.maxY >= r2.minY;
  },

  /**
   * Test if outer rect fully contains inner rect.
   */
  rectContainsRect(outer, inner) {
    return inner.minX >= outer.minX && inner.maxX <= outer.maxX &&
           inner.minY >= outer.minY && inner.maxY <= outer.maxY;
  },

  /**
   * Compute the union bounding box of two rects.
   */
  rectUnion(r1, r2) {
    return {
      minX: Math.min(r1.minX, r2.minX),
      minY: Math.min(r1.minY, r2.minY),
      maxX: Math.max(r1.maxX, r2.maxX),
      maxY: Math.max(r1.maxY, r2.maxY),
    };
  },

  // ===================== TRANSFORMATION =====================

  /**
   * Apply a 2D affine matrix [a,b,tx,c,d,ty] to a point.
   */
  transformPoint(point, matrix) {
    return {
      x: matrix[0] * point.x + matrix[1] * point.y + matrix[2],
      y: matrix[3] * point.x + matrix[4] * point.y + matrix[5],
    };
  },

  /**
   * Create a rotation matrix around a center point.
   * Returns [a,b,tx,c,d,ty].
   */
  rotationMatrix(angle, center = { x: 0, y: 0 }) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const cx = center.x, cy = center.y;
    return [
      cos, -sin, cx - cos * cx + sin * cy,
      sin,  cos, cy - sin * cx - cos * cy,
    ];
  },

  /**
   * Create a scale matrix around a center point.
   */
  scaleMatrix(factor, center = { x: 0, y: 0 }) {
    const fx = typeof factor === 'number' ? factor : factor.x;
    const fy = typeof factor === 'number' ? factor : factor.y;
    return [
      fx, 0, center.x * (1 - fx),
      0, fy, center.y * (1 - fy),
    ];
  },

  /**
   * Create a translation matrix.
   */
  translationMatrix(dx, dy) {
    return [1, 0, dx, 0, 1, dy];
  },

  /**
   * Create a mirror matrix across a line defined by two points.
   */
  mirrorMatrix(p1, p2) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < EPSILON) return [1, 0, 0, 0, 1, 0]; // identity
    const a = (dx * dx - dy * dy) / lenSq;
    const b = 2 * dx * dy / lenSq;
    return [
      a, b, p1.x - a * p1.x - b * p1.y,
      b, -a, p1.y - b * p1.x + a * p1.y,
    ];
  },

  /**
   * Multiply two 2D affine matrices.
   */
  multiplyMatrices(m1, m2) {
    return [
      m1[0] * m2[0] + m1[1] * m2[3],
      m1[0] * m2[1] + m1[1] * m2[4],
      m1[0] * m2[2] + m1[1] * m2[5] + m1[2],
      m1[3] * m2[0] + m1[4] * m2[3],
      m1[3] * m2[1] + m1[4] * m2[4],
      m1[3] * m2[2] + m1[4] * m2[5] + m1[5],
    ];
  },

  /**
   * Identity matrix.
   */
  identityMatrix() {
    return [1, 0, 0, 0, 1, 0];
  },

  // ===================== TRIM / EXTEND =====================

  /**
   * Trim a line segment at cutting edges. Returns the portion of the line
   * between pick point and nearest intersection, or null.
   * @param {{ start, end }} line
   * @param {Array<{start, end}>} cuttingEdges
   * @param {{ x, y }} pickPoint — which side to keep
   * @returns {{ start, end } | null}
   */
  trimLine(line, cuttingEdges, pickPoint) {
    const intersections = [];
    for (const edge of cuttingEdges) {
      const ix = Geometry.segmentIntersection(line.start, line.end, edge.start, edge.end);
      if (ix) {
        const result = Geometry.lineIntersection(line.start, line.end, edge.start, edge.end);
        if (result) intersections.push({ point: ix, t: result.t1 });
      }
    }
    if (intersections.length === 0) return null;

    // Determine parameter of pick point on the line
    const dx = line.end.x - line.start.x, dy = line.end.y - line.start.y;
    const lenSq = dx * dx + dy * dy;
    const tPick = lenSq < EPSILON ? 0 : ((pickPoint.x - line.start.x) * dx + (pickPoint.y - line.start.y) * dy) / lenSq;

    intersections.sort((a, b) => a.t - b.t);

    // Find the two bounding intersections around tPick
    let lower = null, upper = null;
    for (const ix of intersections) {
      if (ix.t <= tPick + EPSILON) lower = ix;
      if (ix.t >= tPick - EPSILON && upper === null) upper = ix;
    }

    // Trim: remove the segment containing the pick point
    if (lower && upper && Math.abs(lower.t - upper.t) > EPSILON) {
      // Pick is between two intersections — remove that segment
      // Return the larger remaining portion
      const leftLen = lower.t;
      const rightLen = 1 - upper.t;
      if (leftLen > rightLen) {
        return { start: { ...line.start }, end: { ...lower.point } };
      } else {
        return { start: { ...upper.point }, end: { ...line.end } };
      }
    } else if (lower) {
      return { start: { ...line.start }, end: { ...lower.point } };
    } else if (upper) {
      return { start: { ...upper.point }, end: { ...line.end } };
    }
    return null;
  },

  /**
   * Extend a line segment to reach a boundary edge.
   * @param {{ start, end }} entity
   * @param {{ start, end }} boundaryEdge
   * @returns {{ start, end } | null}
   */
  extendToEdge(entity, boundaryEdge) {
    // Extend the line in its direction and find intersection with boundary
    const dx = entity.end.x - entity.start.x, dy = entity.end.y - entity.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < EPSILON) return null;

    // Extend far in both directions
    const farStart = { x: entity.start.x - dx * 1e6, y: entity.start.y - dy * 1e6 };
    const farEnd = { x: entity.end.x + dx * 1e6, y: entity.end.y + dy * 1e6 };

    const ix = Geometry.lineIntersection(farStart, farEnd, boundaryEdge.start, boundaryEdge.end);
    if (!ix || ix.t2 < -EPSILON || ix.t2 > 1 + EPSILON) return null;

    // Determine which end to extend
    const tOrigStart = 0, tOrigEnd = 1;
    // Map intersection t back to original parametrization
    const intPoint = { x: ix.x, y: ix.y };
    const dToStart = Geometry.distance(intPoint, entity.start);
    const dToEnd = Geometry.distance(intPoint, entity.end);

    if (dToEnd < dToStart) {
      return { start: { ...entity.start }, end: intPoint };
    } else {
      return { start: intPoint, end: { ...entity.end } };
    }
  },

  // ===================== FILLET / CHAMFER =====================

  /**
   * Compute a fillet arc between two line segments.
   * Returns { center, radius, startAngle, endAngle, trimLine1, trimLine2 } or null.
   */
  filletLines(l1, l2, radius) {
    // l1, l2: { start: {x,y}, end: {x,y} }
    const ix = Geometry.lineLineIntersection(l1.start, l1.end, l2.start, l2.end);
    if (!ix) return null;

    const a1 = Geometry.angle(ix, l1.end);
    const a2 = Geometry.angle(ix, l2.end);
    const bisect = (a1 + a2) / 2;

    const halfAngle = Math.abs(a2 - a1) / 2;
    if (Math.abs(Math.sin(halfAngle)) < EPSILON) return null;
    const d = radius / Math.sin(halfAngle);
    const center = Geometry.polarPoint(ix, bisect, d);

    // Tangent points
    const tp1 = Geometry.perpFoot(center, l1.start, l1.end);
    const tp2 = Geometry.perpFoot(center, l2.start, l2.end);

    const sa = Geometry.angle(center, tp1);
    const ea = Geometry.angle(center, tp2);

    return {
      center,
      radius,
      startAngle: sa,
      endAngle: ea,
      trimPoint1: tp1,
      trimPoint2: tp2,
    };
  },

  /**
   * Compute chamfer points between two line segments.
   * Returns { p1, p2 } — the two chamfer endpoints, or null.
   */
  chamferLines(l1, l2, dist1, dist2) {
    const ix = Geometry.lineLineIntersection(l1.start, l1.end, l2.start, l2.end);
    if (!ix) return null;

    const a1 = Geometry.angle(ix, l1.end);
    const a2 = Geometry.angle(ix, l2.end);

    return {
      p1: Geometry.polarPoint(ix, a1, dist1),
      p2: Geometry.polarPoint(ix, a2, dist2),
    };
  },

  // ===================== BOOLEAN / POLYGON =====================

  /**
   * Test if a point is inside a polygon (array of {x,y}).
   * Uses ray casting.
   */
  pointInPolygon(point, polygon) {
    const px = point.x, py = point.y;
    const n = polygon.length;
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  },

  /**
   * Polygon union using Sutherland-Hodgman clipping approach.
   * Simplified: returns convex hull of combined points for convex polygons.
   * For production use, replace with a full polygon boolean library.
   */
  polygonUnion(p1, p2) {
    const all = [...p1, ...p2];
    return Geometry._convexHull(all);
  },

  /**
   * Polygon subtraction (simplified).
   * Returns p1 vertices not inside p2 + intersection points.
   */
  polygonSubtract(p1, p2) {
    const result = [];
    for (const pt of p1) {
      if (!Geometry.pointInPolygon(pt, p2)) result.push({ ...pt });
    }
    // Add intersection points
    for (let i = 0; i < p1.length; i++) {
      const a1 = p1[i], b1 = p1[(i + 1) % p1.length];
      for (let j = 0; j < p2.length; j++) {
        const a2 = p2[j], b2 = p2[(j + 1) % p2.length];
        const ix = Geometry.segmentIntersection(a1, b1, a2, b2);
        if (ix) result.push(ix);
      }
    }
    return result.length > 2 ? Geometry._convexHull(result) : result;
  },

  /**
   * Polygon intersection (simplified).
   * Uses Sutherland-Hodgman algorithm (works for convex clip polygon).
   */
  polygonIntersect(subject, clip) {
    let output = [...subject.map(p => ({ ...p }))];
    const clipLen = clip.length;

    for (let i = 0; i < clipLen; i++) {
      if (output.length === 0) return [];
      const input = output;
      output = [];
      const edgeStart = clip[i];
      const edgeEnd = clip[(i + 1) % clipLen];

      for (let j = 0; j < input.length; j++) {
        const current = input[j];
        const prev = input[(j + input.length - 1) % input.length];
        const currInside = Geometry._isLeft(edgeStart, edgeEnd, current);
        const prevInside = Geometry._isLeft(edgeStart, edgeEnd, prev);

        if (currInside) {
          if (!prevInside) {
            const ix = Geometry.lineLineIntersection(prev, current, edgeStart, edgeEnd);
            if (ix) output.push(ix);
          }
          output.push(current);
        } else if (prevInside) {
          const ix = Geometry.lineLineIntersection(prev, current, edgeStart, edgeEnd);
          if (ix) output.push(ix);
        }
      }
    }
    return output;
  },

  _isLeft(a, b, point) {
    return ((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)) >= 0;
  },

  /**
   * Convex hull (Andrew's monotone chain).
   */
  _convexHull(points) {
    if (points.length < 3) return points.map(p => ({ ...p }));
    const sorted = points.slice().sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    const lower = [];
    for (const p of sorted) {
      while (lower.length >= 2 && Geometry.cross(
        Geometry.subVec(lower[lower.length - 1], lower[lower.length - 2]),
        Geometry.subVec(p, lower[lower.length - 2])
      ) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && Geometry.cross(
        Geometry.subVec(upper[upper.length - 1], upper[upper.length - 2]),
        Geometry.subVec(p, upper[upper.length - 2])
      ) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  },

  // ===================== UTILITY =====================

  /**
   * Normalize angle to [0, 2PI).
   */
  normalizeAngle(angle) {
    angle = angle % TWO_PI;
    if (angle < 0) angle += TWO_PI;
    return angle;
  },

  /**
   * Radians to degrees.
   */
  toDegrees(radians) {
    return (radians * 180) / Math.PI;
  },

  /**
   * Degrees to radians.
   */
  toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  },

  /**
   * Parse a coordinate input string.
   * Supports:
   *   "100,200"       — absolute
   *   "@50,30"        — relative to lastPoint
   *   "@100<45"       — relative polar (distance<angle in degrees)
   * @param {string} input
   * @param {{ x: number, y: number }} [lastPoint]
   * @returns {{ x: number, y: number, relative: boolean } | null}
   */
  parseCoordinate(input, lastPoint) {
    if (!input || typeof input !== 'string') return null;
    input = input.trim();

    const relative = input.startsWith('@');
    if (relative) input = input.substring(1);

    // Polar: distance<angle
    const polarMatch = input.match(/^([\d.+-]+)<([\d.+-]+)$/);
    if (polarMatch) {
      const distance = parseFloat(polarMatch[1]);
      const angleDeg = parseFloat(polarMatch[2]);
      if (isNaN(distance) || isNaN(angleDeg)) return null;
      const angleRad = Geometry.toRadians(angleDeg);
      const dx = distance * Math.cos(angleRad);
      const dy = distance * Math.sin(angleRad);
      if (relative && lastPoint) {
        return { x: lastPoint.x + dx, y: lastPoint.y + dy, relative: true };
      }
      return { x: dx, y: dy, relative };
    }

    // Cartesian: x,y
    const parts = input.split(',');
    if (parts.length !== 2) return null;
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (isNaN(x) || isNaN(y)) return null;

    if (relative && lastPoint) {
      return { x: lastPoint.x + x, y: lastPoint.y + y, relative: true };
    }
    return { x, y, relative };
  },

  /**
   * Round a value to a given number of decimal places.
   */
  roundTo(value, precision) {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  },

  /**
   * Clamp a value between min and max.
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  // ===================== INTERNAL HELPERS =====================

  /**
   * Point to segment distance (internal).
   */
  _pointToSegmentDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const fx = ax + t * dx, fy = ay + t * dy;
    return Math.sqrt((px - fx) ** 2 + (py - fy) ** 2);
  },

  /**
   * Check if a segment intersects a rectangle.
   */
  segmentIntersectsRect(p1, p2, rect) {
    // Cohen-Sutherland style: quick reject then check intersections
    if (Math.max(p1.x, p2.x) < rect.minX || Math.min(p1.x, p2.x) > rect.maxX) return false;
    if (Math.max(p1.y, p2.y) < rect.minY || Math.min(p1.y, p2.y) > rect.maxY) return false;

    // Check if either endpoint is inside
    if (Geometry.rectContains(rect, p1) || Geometry.rectContains(rect, p2)) return true;

    // Check against each edge
    const edges = [
      [{ x: rect.minX, y: rect.minY }, { x: rect.maxX, y: rect.minY }],
      [{ x: rect.maxX, y: rect.minY }, { x: rect.maxX, y: rect.maxY }],
      [{ x: rect.maxX, y: rect.maxY }, { x: rect.minX, y: rect.maxY }],
      [{ x: rect.minX, y: rect.maxY }, { x: rect.minX, y: rect.minY }],
    ];
    for (const [a, b] of edges) {
      if (Geometry.segmentIntersection(p1, p2, a, b)) return true;
    }
    return false;
  },
};
