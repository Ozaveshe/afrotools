/**
 * AfroDraft v6 — Layer Manager
 *
 * Full layer system with visibility, freeze, lock, color, linetype,
 * lineweight, and plot control. Integrates with Engine via events.
 */

const DEFAULT_COLOR = { r: 255, g: 255, b: 255, index: 7 };

/**
 * @typedef {Object} LayerProps
 * @property {string} name
 * @property {{r:number, g:number, b:number, index:number}} color
 * @property {string} linetype
 * @property {number} lineweight
 * @property {boolean} visible
 * @property {boolean} frozen
 * @property {boolean} locked
 * @property {boolean} plot
 */

export class LayerManager {
  /**
   * @param {import('./Engine.js').Engine} [engine] — optional engine reference for events
   */
  constructor(engine = null) {
    /** @type {Map<string, LayerProps>} */
    this.layers = new Map();
    this.currentLayer = 'Layer 0';
    this.engine = engine;

    // Create mandatory default layers
    this.addLayer({
      name: 'Layer 0',
      color: { r: 255, g: 255, b: 255, index: 7 },
      linetype: 'Continuous',
      lineweight: 0.25,
      visible: true,
      frozen: false,
      locked: false,
      plot: true,
    });
    this.addLayer({
      name: 'Defpoints',
      color: { r: 128, g: 128, b: 128, index: 8 },
      linetype: 'Continuous',
      lineweight: 0.0,
      visible: true,
      frozen: false,
      locked: false,
      plot: false,
    });
  }

  /**
   * Add a new layer.
   * @param {Partial<LayerProps> & {name: string}} props
   * @returns {boolean} true if added, false if name already exists
   */
  addLayer(props) {
    if (!props.name || this.layers.has(props.name)) return false;
    const layer = {
      name: props.name,
      color: props.color ? { ...props.color } : { ...DEFAULT_COLOR },
      linetype: props.linetype || 'Continuous',
      lineweight: props.lineweight ?? 0.25,
      visible: props.visible ?? true,
      frozen: props.frozen ?? false,
      locked: props.locked ?? false,
      plot: props.plot ?? true,
    };
    this.layers.set(layer.name, layer);
    this._emit('layer-added', { name: layer.name, layer });
    return true;
  }

  /**
   * Remove a layer by name. Cannot remove 'Layer 0' or 'Defpoints'.
   * Entities on the removed layer are moved to 'Layer 0'.
   * @param {string} name
   * @returns {boolean}
   */
  removeLayer(name) {
    if (name === 'Layer 0' || name === 'Defpoints') return false;
    if (!this.layers.has(name)) return false;

    // Move entities to Layer 0 if engine is available
    if (this.engine) {
      for (const entity of this.engine.entities.values()) {
        if (entity.layer === name) {
          entity.layer = 'Layer 0';
        }
      }
    }

    this.layers.delete(name);
    if (this.currentLayer === name) {
      this.currentLayer = 'Layer 0';
    }
    this._emit('layer-removed', { name });
    return true;
  }

  /**
   * Rename a layer. Cannot rename 'Layer 0' or 'Defpoints'.
   * @param {string} oldName
   * @param {string} newName
   * @returns {boolean}
   */
  renameLayer(oldName, newName) {
    if (oldName === 'Layer 0' || oldName === 'Defpoints') return false;
    if (!this.layers.has(oldName)) return false;
    if (this.layers.has(newName)) return false;
    if (!newName || newName.trim() === '') return false;

    const layer = this.layers.get(oldName);
    layer.name = newName;
    this.layers.delete(oldName);
    this.layers.set(newName, layer);

    // Update entities
    if (this.engine) {
      for (const entity of this.engine.entities.values()) {
        if (entity.layer === oldName) {
          entity.layer = newName;
        }
      }
    }

    if (this.currentLayer === oldName) {
      this.currentLayer = newName;
    }

    this._emit('layer-renamed', { oldName, newName });
    return true;
  }

  /**
   * Get a layer by name.
   * @param {string} name
   * @returns {LayerProps|undefined}
   */
  getLayer(name) {
    return this.layers.get(name);
  }

  /**
   * Set the current (active) layer.
   * @param {string} name
   * @returns {boolean}
   */
  setCurrentLayer(name) {
    if (!this.layers.has(name)) return false;
    const layer = this.layers.get(name);
    if (layer.frozen) return false; // Cannot set frozen layer as current
    this.currentLayer = name;
    this._emit('current-layer-changed', { name });
    return true;
  }

  /**
   * Get all layers as an array, sorted by name.
   * @returns {LayerProps[]}
   */
  getAllLayers() {
    return [...this.layers.values()].sort((a, b) => {
      // Layer 0 first, then Defpoints, then alphabetical
      if (a.name === 'Layer 0') return -1;
      if (b.name === 'Layer 0') return 1;
      if (a.name === 'Defpoints') return -1;
      if (b.name === 'Defpoints') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get all layer names.
   * @returns {string[]}
   */
  getLayerNames() {
    return [...this.layers.keys()];
  }

  /**
   * Toggle visibility of a layer.
   * @param {string} name
   * @returns {boolean} the new visibility state
   */
  toggleVisibility(name) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.visible = !layer.visible;
    this._emit('layer-changed', { name, prop: 'visible', value: layer.visible });
    return layer.visible;
  }

  /**
   * Toggle freeze state of a layer.
   * Cannot freeze the current layer.
   * @param {string} name
   * @returns {boolean} the new frozen state
   */
  toggleFreeze(name) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    if (name === this.currentLayer && !layer.frozen) return layer.frozen; // Can't freeze current
    layer.frozen = !layer.frozen;
    this._emit('layer-changed', { name, prop: 'frozen', value: layer.frozen });
    return layer.frozen;
  }

  /**
   * Toggle lock state of a layer.
   * @param {string} name
   * @returns {boolean} the new locked state
   */
  toggleLock(name) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.locked = !layer.locked;
    this._emit('layer-changed', { name, prop: 'locked', value: layer.locked });
    return layer.locked;
  }

  /**
   * Set a specific property on a layer.
   * @param {string} name
   * @param {string} prop
   * @param {*} value
   */
  setLayerProperty(name, prop, value) {
    const layer = this.layers.get(name);
    if (!layer) return;
    if (prop === 'color' && value && typeof value === 'object') {
      layer.color = { ...value };
    } else {
      layer[prop] = value;
    }
    this._emit('layer-changed', { name, prop, value });
  }

  /**
   * Check if a layer is drawable (visible, not frozen, not locked).
   * @param {string} name
   * @returns {boolean}
   */
  isLayerDrawable(name) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    return layer.visible && !layer.frozen && !layer.locked;
  }

  /**
   * Check if a layer is visible (visible and not frozen).
   * @param {string} name
   * @returns {boolean}
   */
  isLayerVisible(name) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    return layer.visible && !layer.frozen;
  }

  /**
   * Serialize all layers for saving.
   * @returns {Object[]}
   */
  serialize() {
    return this.getAllLayers().map(l => ({
      name: l.name,
      color: { ...l.color },
      linetype: l.linetype,
      lineweight: l.lineweight,
      visible: l.visible,
      frozen: l.frozen,
      locked: l.locked,
      plot: l.plot,
    }));
  }

  /**
   * Restore layers from serialized data.
   * @param {Object[]} data
   */
  deserialize(data) {
    this.layers.clear();
    for (const item of data) {
      this.addLayer(item);
    }
    // Ensure defaults exist
    if (!this.layers.has('Layer 0')) {
      this.addLayer({ name: 'Layer 0', color: { r: 255, g: 255, b: 255, index: 7 }, linetype: 'Continuous', lineweight: 0.25, visible: true, frozen: false, locked: false, plot: true });
    }
    if (!this.layers.has('Defpoints')) {
      this.addLayer({ name: 'Defpoints', color: { r: 128, g: 128, b: 128, index: 8 }, linetype: 'Continuous', lineweight: 0.0, visible: true, frozen: false, locked: false, plot: false });
    }
    if (!this.layers.has(this.currentLayer)) {
      this.currentLayer = 'Layer 0';
    }
  }

  /** @private */
  _emit(event, data) {
    if (this.engine && typeof this.engine.emit === 'function') {
      this.engine.emit(event, data);
    }
  }
}
