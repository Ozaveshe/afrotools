/**
 * AfroDraft v6 - Viewport
 * Manages world-to-screen coordinate transformation and camera.
 *
 * CAD convention: Y axis points UP in world space, canvas Y points DOWN.
 *   screenX = width/2 + (wx - panX) * zoom
 *   screenY = height/2 - (wy - panY) * zoom
 */

export class Viewport {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Camera: the world-space point at the center of the canvas
    this.panX = 0;
    this.panY = 0;

    // Pixels per world unit
    this.zoom = 1;

    // Cache canvas size
    this.width = canvas.width;
    this.height = canvas.height;

    // Zoom limits
    this.minZoom = 1e-4;
    this.maxZoom = 1e6;

    // Named views store
    this._savedViews = new Map();
  }

  // ---------------------------------------------------------------------------
  // Coordinate transforms
  // ---------------------------------------------------------------------------

  /**
   * Convert a world-space point to screen (canvas) pixel coordinates.
   * @param {number} wx
   * @param {number} wy
   * @returns {{x: number, y: number}}
   */
  worldToScreen(wx, wy) {
    return {
      x: this.width / 2 + (wx - this.panX) * this.zoom,
      y: this.height / 2 - (wy - this.panY) * this.zoom,
    };
  }

  /**
   * Convert screen (canvas) pixel coordinates to world space.
   * @param {number} sx
   * @param {number} sy
   * @returns {{x: number, y: number}}
   */
  screenToWorld(sx, sy) {
    return {
      x: this.panX + (sx - this.width / 2) / this.zoom,
      y: this.panY - (sy - this.height / 2) / this.zoom,
    };
  }

  /**
   * Convert a world-space distance to screen pixels.
   * @param {number} d
   * @returns {number}
   */
  worldToScreenDist(d) {
    return d * this.zoom;
  }

  /**
   * Convert a screen-pixel distance to world units.
   * @param {number} d
   * @returns {number}
   */
  screenToWorldDist(d) {
    return d / this.zoom;
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Zoom centred on a screen point so that the world point under the cursor
   * stays under the cursor after zoom.
   * @param {number} screenX
   * @param {number} screenY
   * @param {number} factor  >1 to zoom in, <1 to zoom out
   */
  zoomAt(screenX, screenY, factor) {
    // World point currently under the cursor
    const before = this.screenToWorld(screenX, screenY);

    // Apply zoom
    this.zoom = this._clampZoom(this.zoom * factor);

    // World point now under the cursor after zoom change
    const after = this.screenToWorld(screenX, screenY);

    // Adjust pan so that 'before' stays under cursor
    this.panX += before.x - after.x;
    this.panY += before.y - after.y;
  }

  /**
   * Pan by a delta expressed in **screen pixels**.
   * @param {number} dx  positive => content moves right (camera moves left)
   * @param {number} dy  positive => content moves down  (camera moves up)
   */
  pan(dx, dy) {
    // Screen right -> world X increases -> panX decreases
    this.panX -= dx / this.zoom;
    // Screen down  -> world Y decreases (Y-up) -> panY increases
    this.panY += dy / this.zoom;
  }

  /**
   * Fit the given world-space bounding box into the viewport.
   * @param {{minX: number, minY: number, maxX: number, maxY: number}} bounds
   * @param {number} [padding=0.05] fraction of viewport to keep as margin
   */
  zoomExtents(bounds, padding = 0.05) {
    if (!bounds) return;
    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    if (bw <= 0 && bh <= 0) return;

    const usableW = this.width * (1 - 2 * padding);
    const usableH = this.height * (1 - 2 * padding);

    if (bw <= 0) {
      this.zoom = this._clampZoom(usableH / bh);
    } else if (bh <= 0) {
      this.zoom = this._clampZoom(usableW / bw);
    } else {
      this.zoom = this._clampZoom(Math.min(usableW / bw, usableH / bh));
    }

    this.panX = (bounds.minX + bounds.maxX) / 2;
    this.panY = (bounds.minY + bounds.maxY) / 2;
  }

  /**
   * Zoom to a world-space rectangle (e.g. from a zoom-window command).
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  zoomWindow(x1, y1, x2, y2) {
    this.zoomExtents({
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    });
  }

  // ---------------------------------------------------------------------------
  // View management
  // ---------------------------------------------------------------------------

  /**
   * Return the world-space bounds currently visible on screen.
   * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
   */
  getVisibleBounds() {
    const tl = this.screenToWorld(0, 0);
    const br = this.screenToWorld(this.width, this.height);
    return {
      minX: Math.min(tl.x, br.x),
      minY: Math.min(tl.y, br.y),
      maxX: Math.max(tl.x, br.x),
      maxY: Math.max(tl.y, br.y),
    };
  }

  /**
   * Respond to canvas resize.
   * @param {number} w new pixel width
   * @param {number} h new pixel height
   */
  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  /**
   * Save the current view under a name.
   * @param {string} name
   */
  saveView(name) {
    this._savedViews.set(name, {
      panX: this.panX,
      panY: this.panY,
      zoom: this.zoom,
    });
  }

  /**
   * Restore a previously saved view.
   * @param {string} name
   * @returns {boolean} true if found
   */
  restoreView(name) {
    const v = this._savedViews.get(name);
    if (!v) return false;
    this.panX = v.panX;
    this.panY = v.panY;
    this.zoom = v.zoom;
    return true;
  }

  /**
   * Delete a saved view.
   * @param {string} name
   */
  deleteView(name) {
    this._savedViews.delete(name);
  }

  /**
   * List all saved view names.
   * @returns {string[]}
   */
  listViews() {
    return [...this._savedViews.keys()];
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /** @private */
  _clampZoom(z) {
    return Math.max(this.minZoom, Math.min(this.maxZoom, z));
  }
}
