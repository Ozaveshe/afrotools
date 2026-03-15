/**
 * AfroDraft v6 — Core CAD Engine
 * Central engine managing entities, drawing state, units, and event dispatch.
 */

const DEFAULT_LAYERS = {
  'Layer 0': { color: { r: 255, g: 255, b: 255, index: 7 }, linetype: 'Continuous', lineweight: 0.25, visible: true, locked: false, frozen: false, plot: true },
  'Defpoints': { color: { r: 128, g: 128, b: 128, index: 8 }, linetype: 'Continuous', lineweight: 0.0, visible: true, locked: false, frozen: false, plot: false },
};

const UNIT_SCALES = {
  mm: 1,
  cm: 10,
  m: 1000,
  inches: 25.4,
  feet: 304.8,
};

const ANGLE_FORMATS = ['decimal', 'dms', 'grads', 'radians'];

export class Engine {
  /**
   * @param {Object} [options]
   * @param {string} [options.units='mm']
   * @param {number} [options.precision=4]
   */
  constructor(options = {}) {
    // --- Entity storage ---
    this.entities = new Map();     // id -> entity
    this.nextId = 1;

    // --- Layer system ---
    this.layers = {};
    for (const [name, props] of Object.entries(DEFAULT_LAYERS)) {
      this.layers[name] = { ...props };
    }

    // --- Drawing state ---
    this.currentLayer = 'Layer 0';
    this.currentColor = { r: 255, g: 255, b: 255, index: 7 };  // ByLayer
    this.currentLinetype = 'Continuous';
    this.currentLineweight = 0.25;
    this.colorMode = 'ByLayer';   // 'ByLayer', 'ByBlock', or explicit
    this.linetypeMode = 'ByLayer';

    // --- Units ---
    this.units = options.units || 'mm';
    this.precision = options.precision ?? 4;
    this.angleFormat = 'decimal';
    this.anglePrecision = 2;
    this.angleBase = 0;           // radians, 0 = east
    this.angleDirection = 'ccw';  // 'ccw' or 'cw'

    // --- Coordinate system ---
    this.origin = { x: 0, y: 0 };
    this.ucsOrigin = { x: 0, y: 0 };
    this.ucsXAxis = { x: 1, y: 0 };
    this.ucsYAxis = { x: 0, y: 1 };

    // --- Command state ---
    this.activeCommand = null;
    this.commandData = {};

    // --- Dirty tracking ---
    this.modified = false;
    this.savedUndoIndex = 0;

    // --- Drawing limits ---
    this.limitsEnabled = false;
    this.limitsMin = { x: 0, y: 0 };
    this.limitsMax = { x: 420, y: 297 };  // A3 in mm

    // --- Block definitions ---
    this.blocks = new Map();      // name -> { entities: [], origin: {x,y} }

    // --- Linetypes ---
    this.linetypes = new Map();
    this._initLinetypes();

    // --- Text styles ---
    this.textStyles = new Map();
    this.textStyles.set('Standard', {
      name: 'Standard',
      fontFamily: 'Arial',
      height: 2.5,
      widthFactor: 1.0,
      oblique: 0,
    });

    // --- Dimension styles ---
    this.dimStyles = new Map();
    this.dimStyles.set('Standard', {
      name: 'Standard',
      textHeight: 2.5,
      arrowSize: 2.5,
      extensionOffset: 1.25,
      extensionOvershoot: 1.25,
      dimLineGap: 0.625,
      decimalPlaces: 2,
      unitScale: 1,
      prefix: '',
      suffix: '',
      textStyle: 'Standard',
      arrowType: 'closed',
    });

    // --- Event system ---
    this.listeners = {};

    // --- Spatial index grid ---
    this.gridSize = 100;
    this.spatialGrid = new Map();  // "gx,gy" -> Set<id>
  }

  // ===================== ENTITY MANAGEMENT =====================

  /**
   * Add an entity to the drawing.
   * @param {Object} entity — must have a `type` property
   * @returns {number} the assigned entity ID
   */
  addEntity(entity) {
    const id = this.nextId++;
    entity.id = id;

    if (!entity.layer) entity.layer = this.currentLayer;
    if (!entity.color) entity.color = { ...this.currentColor };
    if (!entity.linetype) entity.linetype = this.currentLinetype;
    if (entity.lineweight == null) entity.lineweight = this.currentLineweight;
    if (entity.visible == null) entity.visible = true;
    if (entity.locked == null) entity.locked = false;

    this.entities.set(id, entity);
    this._addToSpatialGrid(entity);
    this.modified = true;
    this.emit('entity-added', { entity });
    return id;
  }

  /**
   * Remove an entity by ID.
   * @param {number} id
   * @returns {Object|null} the removed entity, or null
   */
  removeEntity(id) {
    const entity = this.entities.get(id);
    if (!entity) return null;
    this._removeFromSpatialGrid(entity);
    this.entities.delete(id);
    this.modified = true;
    this.emit('entity-removed', { entity });
    return entity;
  }

  /**
   * Get an entity by ID.
   * @param {number} id
   * @returns {Object|undefined}
   */
  getEntity(id) {
    return this.entities.get(id);
  }

  /**
   * Get all entities as an array.
   * @returns {Object[]}
   */
  getAllEntities() {
    return [...this.entities.values()];
  }

  /**
   * Query entities whose bounding box overlaps the given rectangle.
   * Uses spatial grid for acceleration.
   * @param {number} minX
   * @param {number} minY
   * @param {number} maxX
   * @param {number} maxY
   * @returns {Object[]}
   */
  getEntitiesInBounds(minX, minY, maxX, maxY) {
    const candidates = this._getSpatialCandidates(minX, minY, maxX, maxY);
    const result = [];
    for (const id of candidates) {
      const entity = this.entities.get(id);
      if (!entity || !entity.visible) continue;
      if (typeof entity.getBounds !== 'function') continue;
      const b = entity.getBounds();
      if (b.maxX >= minX && b.minX <= maxX && b.maxY >= minY && b.minY <= maxY) {
        result.push(entity);
      }
    }
    return result;
  }

  /**
   * Query entities fully contained within the given rectangle.
   * @param {number} minX
   * @param {number} minY
   * @param {number} maxX
   * @param {number} maxY
   * @returns {Object[]}
   */
  getEntitiesFullyInBounds(minX, minY, maxX, maxY) {
    const candidates = this._getSpatialCandidates(minX, minY, maxX, maxY);
    const result = [];
    for (const id of candidates) {
      const entity = this.entities.get(id);
      if (!entity || !entity.visible) continue;
      if (typeof entity.getBounds !== 'function') continue;
      const b = entity.getBounds();
      if (b.minX >= minX && b.minY >= minY && b.maxX <= maxX && b.maxY <= maxY) {
        result.push(entity);
      }
    }
    return result;
  }

  /**
   * Get entities on a specific layer.
   * @param {string} layerName
   * @returns {Object[]}
   */
  getEntitiesByLayer(layerName) {
    const result = [];
    for (const entity of this.entities.values()) {
      if (entity.layer === layerName) result.push(entity);
    }
    return result;
  }

  /**
   * Get entities of a specific type.
   * @param {string} type
   * @returns {Object[]}
   */
  getEntitiesByType(type) {
    const result = [];
    for (const entity of this.entities.values()) {
      if (entity.type === type) result.push(entity);
    }
    return result;
  }

  /**
   * Find the entity nearest to a point within a tolerance.
   * @param {number} x
   * @param {number} y
   * @param {number} [tolerance=5]
   * @returns {Object|null} { entity, distance }
   */
  pickEntity(x, y, tolerance = 5) {
    let closest = null;
    let minDist = tolerance;

    for (const entity of this.entities.values()) {
      if (!entity.visible || entity.locked) continue;
      const layer = this.layers[entity.layer];
      if (layer && (!layer.visible || layer.frozen)) continue;

      if (typeof entity.distanceTo === 'function') {
        const d = entity.distanceTo(x, y);
        if (d < minDist) {
          minDist = d;
          closest = { entity, distance: d };
        }
      }
    }
    return closest;
  }

  /**
   * Compute drawing extents (bounding box of all entities).
   * @returns {{ minX: number, minY: number, maxX: number, maxY: number } | null}
   */
  getExtents() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasEntities = false;

    for (const entity of this.entities.values()) {
      if (typeof entity.getBounds !== 'function') continue;
      const b = entity.getBounds();
      if (b.minX < minX) minX = b.minX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.maxY > maxY) maxY = b.maxY;
      hasEntities = true;
    }

    return hasEntities ? { minX, minY, maxX, maxY } : null;
  }

  // ===================== SPATIAL INDEX =====================

  _gridKey(gx, gy) {
    return `${gx},${gy}`;
  }

  _getGridCells(bounds) {
    const gs = this.gridSize;
    const gxMin = Math.floor(bounds.minX / gs);
    const gyMin = Math.floor(bounds.minY / gs);
    const gxMax = Math.floor(bounds.maxX / gs);
    const gyMax = Math.floor(bounds.maxY / gs);
    const cells = [];
    for (let gx = gxMin; gx <= gxMax; gx++) {
      for (let gy = gyMin; gy <= gyMax; gy++) {
        cells.push(this._gridKey(gx, gy));
      }
    }
    return cells;
  }

  _addToSpatialGrid(entity) {
    if (typeof entity.getBounds !== 'function') return;
    const b = entity.getBounds();
    const cells = this._getGridCells(b);
    for (const key of cells) {
      if (!this.spatialGrid.has(key)) this.spatialGrid.set(key, new Set());
      this.spatialGrid.get(key).add(entity.id);
    }
  }

  _removeFromSpatialGrid(entity) {
    if (typeof entity.getBounds !== 'function') return;
    const b = entity.getBounds();
    const cells = this._getGridCells(b);
    for (const key of cells) {
      const set = this.spatialGrid.get(key);
      if (set) {
        set.delete(entity.id);
        if (set.size === 0) this.spatialGrid.delete(key);
      }
    }
  }

  /**
   * Rebuild the entire spatial index. Call after bulk operations.
   */
  rebuildSpatialIndex() {
    this.spatialGrid.clear();
    for (const entity of this.entities.values()) {
      this._addToSpatialGrid(entity);
    }
  }

  /**
   * Update one entity's position in the spatial grid (after a move/transform).
   */
  updateSpatialIndex(entity) {
    this._removeFromSpatialGrid(entity);
    this._addToSpatialGrid(entity);
  }

  _getSpatialCandidates(minX, minY, maxX, maxY) {
    const cells = this._getGridCells({ minX, minY, maxX, maxY });
    const ids = new Set();
    for (const key of cells) {
      const set = this.spatialGrid.get(key);
      if (set) {
        for (const id of set) ids.add(id);
      }
    }
    return ids;
  }

  // ===================== LAYER MANAGEMENT =====================

  /**
   * Add a new layer.
   * @param {string} name
   * @param {Object} [props]
   * @returns {boolean} true if created
   */
  addLayer(name, props = {}) {
    if (this.layers[name]) return false;
    this.layers[name] = {
      color: props.color || { r: 255, g: 255, b: 255, index: 7 },
      linetype: props.linetype || 'Continuous',
      lineweight: props.lineweight ?? 0.25,
      visible: props.visible ?? true,
      locked: props.locked ?? false,
      frozen: props.frozen ?? false,
      plot: props.plot ?? true,
    };
    this.modified = true;
    this.emit('layer-added', { name });
    return true;
  }

  /**
   * Remove a layer (moves entities to Layer 0).
   * @param {string} name
   * @returns {boolean}
   */
  removeLayer(name) {
    if (name === 'Layer 0' || name === 'Defpoints') return false;
    if (!this.layers[name]) return false;

    for (const entity of this.entities.values()) {
      if (entity.layer === name) entity.layer = 'Layer 0';
    }
    delete this.layers[name];
    if (this.currentLayer === name) this.currentLayer = 'Layer 0';
    this.modified = true;
    this.emit('layer-removed', { name });
    return true;
  }

  /**
   * Set a layer property.
   * @param {string} name
   * @param {string} prop
   * @param {*} value
   */
  setLayerProperty(name, prop, value) {
    if (!this.layers[name]) return;
    this.layers[name][prop] = value;
    this.modified = true;
    this.emit('layer-changed', { name, prop, value });
  }

  // ===================== BLOCK DEFINITIONS =====================

  defineBlock(name, entities, origin = { x: 0, y: 0 }) {
    this.blocks.set(name, { entities: entities.map(e => e.clone()), origin: { ...origin } });
    this.modified = true;
    this.emit('block-defined', { name });
  }

  getBlock(name) {
    return this.blocks.get(name) || null;
  }

  // ===================== LINETYPES =====================

  _initLinetypes() {
    this.linetypes.set('Continuous', { name: 'Continuous', pattern: [] });
    this.linetypes.set('Dashed', { name: 'Dashed', pattern: [5, -3] });
    this.linetypes.set('Dotted', { name: 'Dotted', pattern: [0.5, -2] });
    this.linetypes.set('DashDot', { name: 'DashDot', pattern: [5, -2, 0.5, -2] });
    this.linetypes.set('DashDotDot', { name: 'DashDotDot', pattern: [5, -2, 0.5, -2, 0.5, -2] });
    this.linetypes.set('Center', { name: 'Center', pattern: [12, -3, 2, -3] });
    this.linetypes.set('Phantom', { name: 'Phantom', pattern: [12, -3, 2, -3, 2, -3] });
    this.linetypes.set('Hidden', { name: 'Hidden', pattern: [3, -2] });
    this.linetypes.set('Border', { name: 'Border', pattern: [12, -3, 12, -3, 2, -3] });
  }

  // ===================== UNITS =====================

  /**
   * Convert a value from one unit to another.
   * @param {number} value
   * @param {string} fromUnit
   * @param {string} toUnit
   * @returns {number}
   */
  convertUnits(value, fromUnit, toUnit) {
    const from = UNIT_SCALES[fromUnit];
    const to = UNIT_SCALES[toUnit];
    if (!from || !to) return value;
    return (value * from) / to;
  }

  /**
   * Format a distance value according to current units and precision.
   * @param {number} value
   * @returns {string}
   */
  formatDistance(value) {
    return value.toFixed(this.precision);
  }

  /**
   * Format an angle according to the current angle format.
   * @param {number} radians
   * @returns {string}
   */
  formatAngle(radians) {
    switch (this.angleFormat) {
      case 'decimal': {
        const deg = (radians * 180) / Math.PI;
        return deg.toFixed(this.anglePrecision) + '\u00B0';
      }
      case 'dms': {
        let deg = (radians * 180) / Math.PI;
        const d = Math.floor(deg);
        const mFloat = (deg - d) * 60;
        const m = Math.floor(mFloat);
        const s = ((mFloat - m) * 60).toFixed(this.anglePrecision);
        return `${d}\u00B0${m}'${s}"`;
      }
      case 'grads': {
        const g = (radians * 200) / Math.PI;
        return g.toFixed(this.anglePrecision) + 'g';
      }
      case 'radians': {
        return radians.toFixed(this.anglePrecision) + 'r';
      }
      default:
        return radians.toFixed(4);
    }
  }

  // ===================== COMMAND STATE =====================

  setCommand(commandName, data = {}) {
    this.activeCommand = commandName;
    this.commandData = data;
    this.emit('command-started', { command: commandName, data });
  }

  endCommand() {
    const cmd = this.activeCommand;
    this.activeCommand = null;
    this.commandData = {};
    this.emit('command-ended', { command: cmd });
  }

  // ===================== DIRTY TRACKING =====================

  markModified() {
    this.modified = true;
    this.emit('modified-changed', { modified: true });
  }

  markSaved() {
    this.modified = false;
    this.emit('modified-changed', { modified: false });
  }

  // ===================== EVENT SYSTEM =====================

  /**
   * Register an event listener.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  /**
   * Remove an event listener.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const list = this.listeners[event];
    if (!list) return;
    const idx = list.indexOf(callback);
    if (idx >= 0) list.splice(idx, 1);
  }

  /**
   * Emit an event.
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    const list = this.listeners[event];
    if (!list) return;
    for (const fn of list) {
      try { fn(data); } catch (e) { console.error(`Event handler error [${event}]:`, e); }
    }
  }

  // ===================== SERIALIZATION =====================

  /**
   * Serialize the entire drawing to a plain object.
   * @returns {Object}
   */
  serialize() {
    const entities = [];
    for (const entity of this.entities.values()) {
      if (typeof entity.serialize === 'function') {
        entities.push(entity.serialize());
      }
    }

    const blocks = {};
    for (const [name, block] of this.blocks.entries()) {
      blocks[name] = {
        origin: { ...block.origin },
        entities: block.entities.map(e => (typeof e.serialize === 'function' ? e.serialize() : e)),
      };
    }

    return {
      version: 6,
      units: this.units,
      precision: this.precision,
      angleFormat: this.angleFormat,
      anglePrecision: this.anglePrecision,
      angleBase: this.angleBase,
      angleDirection: this.angleDirection,
      origin: { ...this.origin },
      limitsEnabled: this.limitsEnabled,
      limitsMin: { ...this.limitsMin },
      limitsMax: { ...this.limitsMax },
      layers: JSON.parse(JSON.stringify(this.layers)),
      textStyles: Object.fromEntries(this.textStyles),
      dimStyles: Object.fromEntries(this.dimStyles),
      blocks,
      entities,
      nextId: this.nextId,
    };
  }

  /**
   * Load a drawing from serialized data.
   * @param {Object} data
   * @param {Function} deserializeEntity — function(data) => entity instance
   */
  load(data, deserializeEntity) {
    this.entities.clear();
    this.spatialGrid.clear();

    if (data.units) this.units = data.units;
    if (data.precision != null) this.precision = data.precision;
    if (data.angleFormat) this.angleFormat = data.angleFormat;
    if (data.anglePrecision != null) this.anglePrecision = data.anglePrecision;
    if (data.angleBase != null) this.angleBase = data.angleBase;
    if (data.angleDirection) this.angleDirection = data.angleDirection;
    if (data.origin) this.origin = { ...data.origin };
    if (data.limitsEnabled != null) this.limitsEnabled = data.limitsEnabled;
    if (data.limitsMin) this.limitsMin = { ...data.limitsMin };
    if (data.limitsMax) this.limitsMax = { ...data.limitsMax };
    if (data.layers) this.layers = JSON.parse(JSON.stringify(data.layers));

    if (data.textStyles) {
      this.textStyles = new Map(Object.entries(data.textStyles));
    }
    if (data.dimStyles) {
      this.dimStyles = new Map(Object.entries(data.dimStyles));
    }

    if (data.blocks) {
      this.blocks.clear();
      for (const [name, block] of Object.entries(data.blocks)) {
        this.blocks.set(name, {
          origin: { ...block.origin },
          entities: block.entities.map(e => deserializeEntity(e)),
        });
      }
    }

    if (data.nextId) this.nextId = data.nextId;

    for (const eData of data.entities) {
      const entity = deserializeEntity(eData);
      if (entity) {
        this.entities.set(entity.id, entity);
        this._addToSpatialGrid(entity);
      }
    }

    this.modified = false;
    this.emit('drawing-loaded', {});
  }

  /**
   * Clear the entire drawing.
   */
  clear() {
    this.entities.clear();
    this.spatialGrid.clear();
    this.nextId = 1;
    this.layers = {};
    for (const [name, props] of Object.entries(DEFAULT_LAYERS)) {
      this.layers[name] = { ...props };
    }
    this.currentLayer = 'Layer 0';
    this.blocks.clear();
    this.modified = false;
    this.emit('drawing-cleared', {});
  }
}
