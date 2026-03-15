/**
 * AfroDraft v6 — Style Manager
 *
 * Manages text styles, dimension styles, table styles, and linetypes.
 * Integrates with Engine for event dispatch and serialization.
 */

import { LINETYPES } from '../data/linetypes.js';

export class StyleManager {
  /**
   * @param {import('./Engine.js').Engine} [engine]
   */
  constructor(engine = null) {
    this.engine = engine;

    /** @type {Map<string, Object>} */
    this.textStyles = new Map();
    /** @type {Map<string, Object>} */
    this.dimStyles = new Map();
    /** @type {Map<string, Object>} */
    this.tableStyles = new Map();
    /** @type {Map<string, Object>} */
    this.linetypes = new Map();

    this._initDefaults();
  }

  /** @private */
  _initDefaults() {
    // Default text styles
    this.addTextStyle({
      name: 'Standard',
      font: 'Arial',
      height: 2.5,
      widthFactor: 1.0,
      oblique: 0,
      bold: false,
      italic: false,
    });
    this.addTextStyle({
      name: 'Annotative',
      font: 'Arial',
      height: 0, // 0 = user specifies at placement
      widthFactor: 1.0,
      oblique: 0,
      bold: false,
      italic: false,
    });
    this.addTextStyle({
      name: 'Title',
      font: 'Arial',
      height: 5.0,
      widthFactor: 1.0,
      oblique: 0,
      bold: true,
      italic: false,
    });

    // Default dimension styles
    this.addDimStyle({
      name: 'ISO-25',
      arrowSize: 2.5,
      textHeight: 2.5,
      precision: 2,
      arrowType: 'closed',         // closed, open, tick, dot, none
      extensionOffset: 1.25,
      extensionOvershoot: 1.25,
      dimLineGap: 0.625,
      unitScale: 1,
      prefix: '',
      suffix: '',
      textStyle: 'Standard',
      textColor: { r: 255, g: 255, b: 255, index: 7 },
      dimLineColor: { r: 255, g: 255, b: 255, index: 7 },
      extLineColor: { r: 255, g: 255, b: 255, index: 7 },
      suppressExtLine1: false,
      suppressExtLine2: false,
      textPlacement: 'above',      // above, centered, outside
      linearUnit: 'decimal',       // decimal, engineering, architectural, fractional
      angularUnit: 'decimal',      // decimal, dms, grads, radians
      angularPrecision: 0,
      toleranceDisplay: 'none',    // none, symmetrical, deviation, limits
      toleranceUpper: 0,
      toleranceLower: 0,
    });

    this.addDimStyle({
      name: 'ANSI',
      arrowSize: 3.0,
      textHeight: 3.0,
      precision: 4,
      arrowType: 'closed',
      extensionOffset: 1.5,
      extensionOvershoot: 1.5,
      dimLineGap: 0.75,
      unitScale: 1,
      prefix: '',
      suffix: '',
      textStyle: 'Standard',
      textColor: { r: 255, g: 255, b: 255, index: 7 },
      dimLineColor: { r: 255, g: 255, b: 255, index: 7 },
      extLineColor: { r: 255, g: 255, b: 255, index: 7 },
      suppressExtLine1: false,
      suppressExtLine2: false,
      textPlacement: 'above',
      linearUnit: 'decimal',
      angularUnit: 'decimal',
      angularPrecision: 0,
      toleranceDisplay: 'none',
      toleranceUpper: 0,
      toleranceLower: 0,
    });

    this.addDimStyle({
      name: 'Architectural',
      arrowSize: 2.0,
      textHeight: 2.0,
      precision: 2,
      arrowType: 'tick',
      extensionOffset: 1.0,
      extensionOvershoot: 2.0,
      dimLineGap: 0.5,
      unitScale: 1,
      prefix: '',
      suffix: '',
      textStyle: 'Standard',
      textColor: { r: 255, g: 255, b: 255, index: 7 },
      dimLineColor: { r: 255, g: 255, b: 255, index: 7 },
      extLineColor: { r: 255, g: 255, b: 255, index: 7 },
      suppressExtLine1: false,
      suppressExtLine2: false,
      textPlacement: 'above',
      linearUnit: 'architectural',
      angularUnit: 'dms',
      angularPrecision: 0,
      toleranceDisplay: 'none',
      toleranceUpper: 0,
      toleranceLower: 0,
    });

    // Default table style
    this.addTableStyle({
      name: 'Standard',
      textHeight: 2.5,
      headerTextHeight: 3.5,
      titleTextHeight: 5.0,
      rowHeight: 8,
      colWidth: 30,
      borderColor: { r: 255, g: 255, b: 255, index: 7 },
      textStyle: 'Standard',
      gridLineweight: 0.25,
      headerBackground: null,
    });

    // Initialize linetypes from data
    this.initLinetypes();
  }

  /**
   * Initialize standard linetypes from the linetypes data file.
   */
  initLinetypes() {
    for (const [name, lt] of Object.entries(LINETYPES)) {
      this.linetypes.set(name, { ...lt });
    }
  }

  // ── Text Styles ──

  /**
   * Add a text style.
   * @param {Object} style
   * @returns {boolean}
   */
  addTextStyle(style) {
    if (!style.name || this.textStyles.has(style.name)) return false;
    this.textStyles.set(style.name, {
      name: style.name,
      font: style.font || 'Arial',
      height: style.height ?? 2.5,
      widthFactor: style.widthFactor ?? 1.0,
      oblique: style.oblique ?? 0,
      bold: style.bold ?? false,
      italic: style.italic ?? false,
    });
    this._emit('textstyle-added', { name: style.name });
    return true;
  }

  /**
   * Update an existing text style.
   * @param {string} name
   * @param {Object} changes
   * @returns {boolean}
   */
  updateTextStyle(name, changes) {
    const style = this.textStyles.get(name);
    if (!style) return false;
    Object.assign(style, changes);
    style.name = name; // prevent name change through this method
    this._emit('textstyle-changed', { name });
    return true;
  }

  /**
   * Remove a text style. Cannot remove 'Standard'.
   * @param {string} name
   * @returns {boolean}
   */
  removeTextStyle(name) {
    if (name === 'Standard') return false;
    if (!this.textStyles.has(name)) return false;
    this.textStyles.delete(name);
    this._emit('textstyle-removed', { name });
    return true;
  }

  /**
   * Get a text style by name.
   * @param {string} name
   * @returns {Object|undefined}
   */
  getTextStyle(name) {
    return this.textStyles.get(name);
  }

  /**
   * Get all text style names.
   * @returns {string[]}
   */
  getTextStyleNames() {
    return [...this.textStyles.keys()];
  }

  // ── Dimension Styles ──

  /**
   * Add a dimension style.
   * @param {Object} style
   * @returns {boolean}
   */
  addDimStyle(style) {
    if (!style.name || this.dimStyles.has(style.name)) return false;
    this.dimStyles.set(style.name, { ...style });
    this._emit('dimstyle-added', { name: style.name });
    return true;
  }

  /**
   * Update an existing dimension style.
   * @param {string} name
   * @param {Object} changes
   * @returns {boolean}
   */
  updateDimStyle(name, changes) {
    const style = this.dimStyles.get(name);
    if (!style) return false;
    Object.assign(style, changes);
    style.name = name;
    this._emit('dimstyle-changed', { name });
    return true;
  }

  /**
   * Remove a dimension style. Cannot remove default styles.
   * @param {string} name
   * @returns {boolean}
   */
  removeDimStyle(name) {
    if (name === 'ISO-25' || name === 'ANSI' || name === 'Architectural') return false;
    if (!this.dimStyles.has(name)) return false;
    this.dimStyles.delete(name);
    this._emit('dimstyle-removed', { name });
    return true;
  }

  /**
   * Get a dimension style by name.
   * @param {string} name
   * @returns {Object|undefined}
   */
  getDimStyle(name) {
    return this.dimStyles.get(name);
  }

  /**
   * Get all dimension style names.
   * @returns {string[]}
   */
  getDimStyleNames() {
    return [...this.dimStyles.keys()];
  }

  // ── Table Styles ──

  addTableStyle(style) {
    if (!style.name || this.tableStyles.has(style.name)) return false;
    this.tableStyles.set(style.name, { ...style });
    return true;
  }

  updateTableStyle(name, changes) {
    const style = this.tableStyles.get(name);
    if (!style) return false;
    Object.assign(style, changes);
    style.name = name;
    return true;
  }

  removeTableStyle(name) {
    if (name === 'Standard') return false;
    return this.tableStyles.delete(name);
  }

  getTableStyle(name) {
    return this.tableStyles.get(name);
  }

  // ── Linetypes ──

  /**
   * Get a linetype pattern by name.
   * @param {string} name
   * @returns {number[]} dash array in world units, or [] for continuous
   */
  getLinetypePattern(name) {
    const lt = this.linetypes.get(name);
    return lt ? [...lt.pattern] : [];
  }

  /**
   * Get a linetype definition by name.
   * @param {string} name
   * @returns {Object|undefined}
   */
  getLinetype(name) {
    return this.linetypes.get(name);
  }

  /**
   * Add a custom linetype.
   * @param {string} name
   * @param {string} description
   * @param {number[]} pattern
   * @returns {boolean}
   */
  addLinetype(name, description, pattern) {
    if (this.linetypes.has(name)) return false;
    this.linetypes.set(name, { name, description, pattern: [...pattern] });
    return true;
  }

  /**
   * Get all linetype names.
   * @returns {string[]}
   */
  getLinetypeNames() {
    return [...this.linetypes.keys()];
  }

  // ── Serialization ──

  /**
   * Serialize all styles.
   * @returns {Object}
   */
  serialize() {
    return {
      textStyles: [...this.textStyles.values()].map(s => ({ ...s })),
      dimStyles: [...this.dimStyles.values()].map(s => ({
        ...s,
        textColor: s.textColor ? { ...s.textColor } : undefined,
        dimLineColor: s.dimLineColor ? { ...s.dimLineColor } : undefined,
        extLineColor: s.extLineColor ? { ...s.extLineColor } : undefined,
      })),
      tableStyles: [...this.tableStyles.values()].map(s => ({ ...s })),
      linetypes: [...this.linetypes.values()]
        .filter(lt => !LINETYPES[lt.name]) // Only save custom linetypes
        .map(lt => ({ ...lt, pattern: [...lt.pattern] })),
    };
  }

  /**
   * Restore styles from serialized data.
   * @param {Object} data
   */
  deserialize(data) {
    // Reset to defaults first
    this.textStyles.clear();
    this.dimStyles.clear();
    this.tableStyles.clear();
    this.linetypes.clear();
    this._initDefaults();

    if (data.textStyles) {
      for (const s of data.textStyles) {
        if (!this.textStyles.has(s.name)) {
          this.addTextStyle(s);
        } else {
          this.updateTextStyle(s.name, s);
        }
      }
    }
    if (data.dimStyles) {
      for (const s of data.dimStyles) {
        if (!this.dimStyles.has(s.name)) {
          this.addDimStyle(s);
        } else {
          this.updateDimStyle(s.name, s);
        }
      }
    }
    if (data.tableStyles) {
      for (const s of data.tableStyles) {
        if (!this.tableStyles.has(s.name)) {
          this.addTableStyle(s);
        } else {
          this.updateTableStyle(s.name, s);
        }
      }
    }
    if (data.linetypes) {
      for (const lt of data.linetypes) {
        this.addLinetype(lt.name, lt.description, lt.pattern);
      }
    }
  }

  /** @private */
  _emit(event, data) {
    if (this.engine && typeof this.engine.emit === 'function') {
      this.engine.emit(event, data);
    }
  }
}
