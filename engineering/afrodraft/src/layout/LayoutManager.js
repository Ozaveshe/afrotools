/**
 * AfroDraft v6 — Layout Manager
 *
 * Manages Model Space and Paper Space layouts.
 * Each layout has its own paper size, orientation, viewports,
 * and optional title block.
 */

export class LayoutManager {
  /**
   * @param {import('../core/Engine.js').Engine} [engine]
   */
  constructor(engine = null) {
    this.engine = engine;

    /** Model space (uses engine.entities directly) */
    this.modelSpace = {
      name: 'Model',
      type: 'model',
    };

    /** Paper space layouts */
    this.layouts = [
      this._createLayout('Layout1', 'A3', 'landscape'),
    ];

    /** Currently active tab: 'Model' or a layout name */
    this.activeTab = 'Model';
  }

  /**
   * Create a new layout with default settings.
   * @param {string} name
   * @param {string} [paperSize='A3']
   * @param {string} [orientation='landscape']
   * @returns {Object} the layout object
   */
  _createLayout(name, paperSize = 'A3', orientation = 'landscape') {
    const papers = {
      A4: [210, 297], A3: [297, 420], A2: [420, 594],
      A1: [594, 841], A0: [841, 1189],
      Letter: [215.9, 279.4], Legal: [215.9, 355.6],
    };
    const [shortDim, longDim] = papers[paperSize] || papers.A3;
    const width = orientation === 'landscape' ? longDim : shortDim;
    const height = orientation === 'landscape' ? shortDim : longDim;

    return {
      name,
      type: 'paper',
      paperSize,
      orientation,
      width,
      height,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      viewports: [],
      titleBlock: null,
      plotSettings: {
        scale: '1:1',
        plotArea: 'extents',
        colorMode: 'color',
        lineweightScale: 1.0,
      },
    };
  }

  /**
   * Add a new layout.
   * @param {string} name
   * @param {string} [paperSize='A3']
   * @param {string} [orientation='landscape']
   * @returns {Object|null} the new layout, or null if name exists
   */
  addLayout(name, paperSize = 'A3', orientation = 'landscape') {
    if (this.getLayout(name)) return null;
    if (name === 'Model') return null;

    const layout = this._createLayout(name, paperSize, orientation);
    this.layouts.push(layout);
    this._emit('layout-added', { name });
    return layout;
  }

  /**
   * Remove a layout by name.
   * @param {string} name
   * @returns {boolean}
   */
  removeLayout(name) {
    const idx = this.layouts.findIndex(l => l.name === name);
    if (idx < 0) return false;

    this.layouts.splice(idx, 1);
    if (this.activeTab === name) {
      this.activeTab = this.layouts.length > 0 ? this.layouts[0].name : 'Model';
    }
    this._emit('layout-removed', { name });
    return true;
  }

  /**
   * Rename a layout.
   * @param {string} oldName
   * @param {string} newName
   * @returns {boolean}
   */
  renameLayout(oldName, newName) {
    if (this.getLayout(newName)) return false;
    const layout = this.getLayout(oldName);
    if (!layout) return false;
    layout.name = newName;
    if (this.activeTab === oldName) {
      this.activeTab = newName;
    }
    this._emit('layout-renamed', { oldName, newName });
    return true;
  }

  /**
   * Get a layout by name.
   * @param {string} name
   * @returns {Object|null}
   */
  getLayout(name) {
    return this.layouts.find(l => l.name === name) || null;
  }

  /**
   * Get all layout names (excluding Model).
   * @returns {string[]}
   */
  getLayoutNames() {
    return this.layouts.map(l => l.name);
  }

  /**
   * Get all tabs (Model + layouts).
   * @returns {string[]}
   */
  getAllTabs() {
    return ['Model', ...this.layouts.map(l => l.name)];
  }

  /**
   * Set the active tab.
   * @param {string} name — 'Model' or a layout name
   * @returns {boolean}
   */
  setActive(name) {
    if (name === 'Model' || this.getLayout(name)) {
      this.activeTab = name;
      this._emit('active-tab-changed', { name });
      return true;
    }
    return false;
  }

  /**
   * Check if Model Space is active.
   * @returns {boolean}
   */
  isModelSpace() {
    return this.activeTab === 'Model';
  }

  /**
   * Get the active layout (null if Model Space).
   * @returns {Object|null}
   */
  getActiveLayout() {
    if (this.activeTab === 'Model') return null;
    return this.getLayout(this.activeTab);
  }

  // ── Viewport management ──

  /**
   * Add a viewport to a layout.
   * A viewport defines a rectangular window on the paper that shows
   * a portion of model space at a given scale.
   * @param {string} layoutName
   * @param {{x:number, y:number, width:number, height:number}} rect — position on paper (mm)
   * @param {number} [scale=1] — model-to-paper scale
   * @param {{x:number, y:number}} [center] — center of model space view
   * @returns {Object|null} the viewport object
   */
  addViewport(layoutName, rect, scale = 1, center = null) {
    const layout = this.getLayout(layoutName);
    if (!layout) return null;

    const vp = {
      id: `vp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      scale,
      center: center || { x: 0, y: 0 },
      frozen: false,
      locked: false,
      frozenLayers: [],
    };

    layout.viewports.push(vp);
    this._emit('viewport-added', { layoutName, viewport: vp });
    return vp;
  }

  /**
   * Remove a viewport from a layout.
   * @param {string} layoutName
   * @param {string} viewportId
   * @returns {boolean}
   */
  removeViewport(layoutName, viewportId) {
    const layout = this.getLayout(layoutName);
    if (!layout) return false;
    const idx = layout.viewports.findIndex(vp => vp.id === viewportId);
    if (idx < 0) return false;
    layout.viewports.splice(idx, 1);
    return true;
  }

  /**
   * Update viewport properties.
   * @param {string} layoutName
   * @param {string} viewportId
   * @param {Object} changes
   * @returns {boolean}
   */
  updateViewport(layoutName, viewportId, changes) {
    const layout = this.getLayout(layoutName);
    if (!layout) return false;
    const vp = layout.viewports.find(v => v.id === viewportId);
    if (!vp) return false;
    Object.assign(vp, changes);
    return true;
  }

  // ── Paper Size ──

  /**
   * Set paper size for a layout.
   * @param {string} layoutName
   * @param {string} paperSize
   * @param {string} orientation
   */
  setPaperSize(layoutName, paperSize, orientation) {
    const layout = this.getLayout(layoutName);
    if (!layout) return;

    const papers = {
      A4: [210, 297], A3: [297, 420], A2: [420, 594],
      A1: [594, 841], A0: [841, 1189],
      Letter: [215.9, 279.4], Legal: [215.9, 355.6],
    };
    const [shortDim, longDim] = papers[paperSize] || papers.A3;
    layout.paperSize = paperSize;
    layout.orientation = orientation;
    layout.width = orientation === 'landscape' ? longDim : shortDim;
    layout.height = orientation === 'landscape' ? shortDim : longDim;
    this._emit('layout-changed', { name: layoutName });
  }

  // ── Title Block ──

  /**
   * Set a title block for a layout.
   * @param {string} layoutName
   * @param {Object} titleBlock — title block configuration
   */
  setTitleBlock(layoutName, titleBlock) {
    const layout = this.getLayout(layoutName);
    if (!layout) return;
    layout.titleBlock = titleBlock;
    this._emit('layout-changed', { name: layoutName });
  }

  // ── Serialization ──

  serialize() {
    return {
      activeTab: this.activeTab,
      layouts: this.layouts.map(l => ({
        ...l,
        viewports: l.viewports.map(vp => ({ ...vp })),
        titleBlock: l.titleBlock ? { ...l.titleBlock } : null,
      })),
    };
  }

  deserialize(data) {
    if (data.activeTab) this.activeTab = data.activeTab;
    if (data.layouts) {
      this.layouts = data.layouts.map(l => ({
        ...l,
        viewports: (l.viewports || []).map(vp => ({ ...vp })),
        titleBlock: l.titleBlock ? { ...l.titleBlock } : null,
      }));
    }
    if (this.layouts.length === 0) {
      this.layouts.push(this._createLayout('Layout1'));
    }
  }

  /** @private */
  _emit(event, data) {
    if (this.engine && typeof this.engine.emit === 'function') {
      this.engine.emit(event, data);
    }
  }
}
