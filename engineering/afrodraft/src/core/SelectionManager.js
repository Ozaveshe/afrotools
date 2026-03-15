/**
 * AfroDraft v6 — Selection Manager
 * Handles all selection modes: click, window, crossing, fence, lasso,
 * quick select, and selection cycling.
 */

import { Geometry } from './Geometry.js';

export class SelectionManager {
  /**
   * @param {import('./Engine.js').Engine} engine
   */
  constructor(engine) {
    this.engine = engine;
    this.selected = new Set();       // Set<entityId>
    this.pickTolerance = 5;          // world units
    this.cycleIndex = 0;             // for selection cycling
    this._lastPickPoint = null;
    this._lastPickCandidates = [];
  }

  // ===================== SINGLE PICK =====================

  /**
   * Select an entity at a point. Shift-click toggles.
   * @param {number} x
   * @param {number} y
   * @param {boolean} [addToSelection=false] — if true, toggle the entity
   * @returns {Object|null} the selected entity, or null
   */
  selectAt(x, y, addToSelection = false) {
    const candidates = this._getCandidatesAtPoint(x, y);

    if (candidates.length === 0) {
      if (!addToSelection) this.deselectAll();
      return null;
    }

    // Selection cycling: if picking same spot, cycle through candidates
    if (this._lastPickPoint &&
        Math.abs(this._lastPickPoint.x - x) < 0.5 &&
        Math.abs(this._lastPickPoint.y - y) < 0.5 &&
        this._lastPickCandidates.length === candidates.length) {
      this.cycleIndex = (this.cycleIndex + 1) % candidates.length;
    } else {
      this.cycleIndex = 0;
    }

    this._lastPickPoint = { x, y };
    this._lastPickCandidates = candidates;

    const entity = candidates[this.cycleIndex];

    if (addToSelection) {
      this.toggleEntity(entity.id);
    } else {
      this.deselectAll();
      this._addToSelection(entity.id);
    }

    return entity;
  }

  /**
   * Get all entities near a point, sorted by distance.
   */
  _getCandidatesAtPoint(x, y) {
    const candidates = [];
    for (const entity of this.engine.entities.values()) {
      if (!this._isSelectable(entity)) continue;
      if (typeof entity.distanceTo === 'function') {
        const d = entity.distanceTo(x, y);
        if (d <= this.pickTolerance) {
          candidates.push({ entity, distance: d });
        }
      }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.map(c => c.entity);
  }

  // ===================== WINDOW SELECTION =====================

  /**
   * Window selection (left-to-right): selects only entities fully enclosed.
   * Blue solid box in the UI.
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {boolean} [addToSelection=false]
   * @returns {Object[]} selected entities
   */
  selectWindow(x1, y1, x2, y2, addToSelection = false) {
    if (!addToSelection) this.deselectAll();

    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
    const rect = { minX, minY, maxX, maxY };
    const result = [];

    for (const entity of this.engine.entities.values()) {
      if (!this._isSelectable(entity)) continue;
      if (typeof entity.getBounds !== 'function') continue;
      const b = entity.getBounds();
      if (Geometry.rectContainsRect(rect, b)) {
        this._addToSelection(entity.id);
        result.push(entity);
      }
    }

    return result;
  }

  // ===================== CROSSING SELECTION =====================

  /**
   * Crossing selection (right-to-left): selects any entity touched or enclosed.
   * Green dashed box in the UI.
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {boolean} [addToSelection=false]
   * @returns {Object[]} selected entities
   */
  selectCrossing(x1, y1, x2, y2, addToSelection = false) {
    if (!addToSelection) this.deselectAll();

    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
    const rect = { minX, minY, maxX, maxY };
    const result = [];

    // Get candidates from spatial grid
    const candidates = this.engine.getEntitiesInBounds(minX, minY, maxX, maxY);
    for (const entity of candidates) {
      if (!this._isSelectable(entity)) continue;
      // Entity overlaps the crossing rect (already confirmed by getEntitiesInBounds)
      this._addToSelection(entity.id);
      result.push(entity);
    }

    return result;
  }

  /**
   * Auto-detect window vs crossing based on drag direction.
   * Left-to-right = window, right-to-left = crossing.
   */
  selectBox(x1, y1, x2, y2, addToSelection = false) {
    if (x2 >= x1) {
      return { mode: 'window', entities: this.selectWindow(x1, y1, x2, y2, addToSelection) };
    } else {
      return { mode: 'crossing', entities: this.selectCrossing(x1, y1, x2, y2, addToSelection) };
    }
  }

  // ===================== FENCE SELECTION =====================

  /**
   * Fence selection: a polyline path — selects any entity the fence crosses.
   * @param {{ x: number, y: number }[]} points — fence polyline vertices
   * @param {boolean} [addToSelection=false]
   * @returns {Object[]}
   */
  selectFence(points, addToSelection = false) {
    if (!addToSelection) this.deselectAll();
    if (points.length < 2) return [];

    const result = [];
    for (const entity of this.engine.entities.values()) {
      if (!this._isSelectable(entity)) continue;
      if (this._fenceCrossesEntity(points, entity)) {
        this._addToSelection(entity.id);
        result.push(entity);
      }
    }
    return result;
  }

  _fenceCrossesEntity(fencePoints, entity) {
    // Check if any fence segment intersects the entity
    // For lines/polylines: segment-segment intersection
    // For others: segment vs bounding box as approximation

    for (let i = 0; i < fencePoints.length - 1; i++) {
      const fp1 = fencePoints[i], fp2 = fencePoints[i + 1];

      if (entity.type === 'line') {
        const ix = Geometry.segmentIntersection(fp1, fp2, entity.start, entity.end);
        if (ix) return true;
      } else if (entity.type === 'polyline') {
        const verts = entity.vertices;
        const n = verts.length;
        const segs = entity.closed ? n : n - 1;
        for (let j = 0; j < segs; j++) {
          const ix = Geometry.segmentIntersection(fp1, fp2, verts[j], verts[(j + 1) % n]);
          if (ix) return true;
        }
      } else if (entity.type === 'circle') {
        const pts = Geometry.circleLineIntersection(entity.center, entity.radius, fp1, fp2);
        for (const p of pts) {
          // Check that intersection is within the fence segment
          const t = Geometry._pointToSegmentDist(p.x, p.y, fp1.x, fp1.y, fp2.x, fp2.y);
          if (t < 0.01) return true;
        }
      } else {
        // Generic: check against bounding box edges
        if (typeof entity.getBounds === 'function') {
          const b = entity.getBounds();
          if (Geometry.segmentIntersectsRect(fp1, fp2, b)) return true;
        }
      }
    }
    return false;
  }

  // ===================== LASSO SELECTION =====================

  /**
   * Lasso selection: freehand loop — selects entities inside or crossed.
   * @param {{ x: number, y: number }[]} points — lasso polygon vertices
   * @param {boolean} [fullyEnclosed=false] — if true, only fully enclosed
   * @param {boolean} [addToSelection=false]
   * @returns {Object[]}
   */
  selectLasso(points, fullyEnclosed = false, addToSelection = false) {
    if (!addToSelection) this.deselectAll();
    if (points.length < 3) return [];

    // Ensure closed polygon
    const polygon = [...points];
    const first = polygon[0], last = polygon[polygon.length - 1];
    if (Geometry.distance(first, last) > 0.1) {
      polygon.push({ ...first });
    }

    const result = [];
    for (const entity of this.engine.entities.values()) {
      if (!this._isSelectable(entity)) continue;

      if (fullyEnclosed) {
        if (this._entityFullyInLasso(entity, polygon)) {
          this._addToSelection(entity.id);
          result.push(entity);
        }
      } else {
        if (this._entityTouchedByLasso(entity, polygon)) {
          this._addToSelection(entity.id);
          result.push(entity);
        }
      }
    }
    return result;
  }

  _entityFullyInLasso(entity, polygon) {
    if (typeof entity.getSnapPoints !== 'function') return false;
    const snaps = entity.getSnapPoints();
    for (const snap of snaps) {
      if (!Geometry.pointInPolygon(snap, polygon)) return false;
    }
    return snaps.length > 0;
  }

  _entityTouchedByLasso(entity, polygon) {
    // Check if any snap point is inside, or if the lasso boundary intersects
    if (this._entityFullyInLasso(entity, polygon)) return true;
    return this._fenceCrossesEntity(polygon, entity);
  }

  // ===================== SELECT ALL / DESELECT =====================

  /**
   * Select all visible, unlocked entities.
   * @returns {Object[]}
   */
  selectAll() {
    const result = [];
    for (const entity of this.engine.entities.values()) {
      if (!this._isSelectable(entity)) continue;
      this._addToSelection(entity.id);
      result.push(entity);
    }
    return result;
  }

  /**
   * Deselect all.
   */
  deselectAll() {
    if (this.selected.size === 0) return;
    this.selected.clear();
    this._lastPickPoint = null;
    this._lastPickCandidates = [];
    this.cycleIndex = 0;
    this.engine.emit('selection-changed', { selected: [] });
  }

  /**
   * Toggle an entity in the selection.
   * @param {number} id
   */
  toggleEntity(id) {
    if (this.selected.has(id)) {
      this._removeFromSelection(id);
    } else {
      this._addToSelection(id);
    }
  }

  // ===================== QUICK SELECT =====================

  /**
   * Quick Select: filter entities by property.
   * @param {Object} filter — e.g. { type: 'line', layer: 'Layer 0' }
   * @param {boolean} [addToSelection=false]
   * @returns {Object[]}
   */
  quickSelect(filter, addToSelection = false) {
    if (!addToSelection) this.deselectAll();
    const result = [];

    for (const entity of this.engine.entities.values()) {
      if (!this._isSelectable(entity)) continue;

      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        if (key === 'color') {
          // Compare color index or RGB
          if (typeof value === 'number') {
            if (entity.color.index !== value) { matches = false; break; }
          } else {
            if (entity.color.r !== value.r || entity.color.g !== value.g || entity.color.b !== value.b) {
              matches = false; break;
            }
          }
        } else if (entity[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        this._addToSelection(entity.id);
        result.push(entity);
      }
    }
    return result;
  }

  // ===================== QUERY =====================

  /**
   * Get selected entity IDs.
   * @returns {number[]}
   */
  getSelected() {
    return [...this.selected];
  }

  /**
   * Get selected entity objects.
   * @returns {Object[]}
   */
  getSelectedEntities() {
    const entities = [];
    for (const id of this.selected) {
      const e = this.engine.getEntity(id);
      if (e) entities.push(e);
    }
    return entities;
  }

  /**
   * Check if an entity is selected.
   * @param {number} id
   * @returns {boolean}
   */
  isSelected(id) {
    return this.selected.has(id);
  }

  /**
   * Number of selected entities.
   * @returns {number}
   */
  get count() {
    return this.selected.size;
  }

  // ===================== INTERNAL =====================

  _isSelectable(entity) {
    if (!entity.visible || entity.locked) return false;
    const layer = this.engine.layers[entity.layer];
    if (layer && (!layer.visible || layer.frozen || layer.locked)) return false;
    return true;
  }

  _addToSelection(id) {
    if (this.selected.has(id)) return;
    this.selected.add(id);
    this.engine.emit('selection-changed', { selected: this.getSelected(), added: id });
  }

  _removeFromSelection(id) {
    if (!this.selected.has(id)) return;
    this.selected.delete(id);
    this.engine.emit('selection-changed', { selected: this.getSelected(), removed: id });
  }
}
