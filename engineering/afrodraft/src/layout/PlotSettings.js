/**
 * AfroDraft v6 — Plot Settings
 *
 * Page setup configuration for plotting/printing.
 * Controls paper size, orientation, scale, margins,
 * color mode, and lineweight behaviour.
 */

/**
 * Standard paper sizes in mm [width, height] (portrait orientation).
 */
export const PAPER_SIZES = {
  A4:       { width: 210,   height: 297,   name: 'A4' },
  A3:       { width: 297,   height: 420,   name: 'A3' },
  A2:       { width: 420,   height: 594,   name: 'A2' },
  A1:       { width: 594,   height: 841,   name: 'A1' },
  A0:       { width: 841,   height: 1189,  name: 'A0' },
  Letter:   { width: 215.9, height: 279.4, name: 'Letter' },
  Legal:    { width: 215.9, height: 355.6, name: 'Legal' },
  Tabloid:  { width: 279.4, height: 431.8, name: 'Tabloid' },
  ANSIA:    { width: 215.9, height: 279.4, name: 'ANSI A' },
  ANSIB:    { width: 279.4, height: 431.8, name: 'ANSI B' },
  ANSIC:    { width: 431.8, height: 558.8, name: 'ANSI C' },
  ANSID:    { width: 558.8, height: 863.6, name: 'ANSI D' },
  ANSIE:    { width: 863.6, height: 1117.6, name: 'ANSI E' },
  Arch24x36: { width: 609.6, height: 914.4, name: '24x36 Arch' },
  Arch30x42: { width: 762,   height: 1066.8, name: '30x42 Arch' },
  Arch36x48: { width: 914.4, height: 1219.2, name: '36x48 Arch' },
};

/**
 * Standard plot scale list.
 */
export const PLOT_SCALES = [
  { label: 'Fit to Paper', value: 0 },
  { label: '1:1',    value: 1 },
  { label: '1:2',    value: 0.5 },
  { label: '1:5',    value: 0.2 },
  { label: '1:10',   value: 0.1 },
  { label: '1:20',   value: 0.05 },
  { label: '1:50',   value: 0.02 },
  { label: '1:100',  value: 0.01 },
  { label: '1:200',  value: 0.005 },
  { label: '1:500',  value: 0.002 },
  { label: '1:1000', value: 0.001 },
  { label: '2:1',    value: 2 },
  { label: '5:1',    value: 5 },
  { label: '10:1',   value: 10 },
];

export class PlotSettings {
  constructor() {
    /** Paper size key (e.g., 'A3') */
    this.paperSize = 'A3';

    /** 'landscape' or 'portrait' */
    this.orientation = 'landscape';

    /** Scale factor (0 = fit to paper) */
    this.scale = 0;

    /** Margins in mm */
    this.margins = { top: 10, right: 10, bottom: 10, left: 10 };

    /** 'color', 'mono', or 'grayscale' */
    this.colorMode = 'color';

    /** Whether to plot lineweights */
    this.plotLineweights = true;

    /** Lineweight scale multiplier */
    this.lineweightScale = 1.0;

    /** What to plot: 'extents', 'limits', 'window', 'display' */
    this.plotArea = 'extents';

    /** Custom window bounds (when plotArea = 'window') */
    this.plotWindow = null;

    /** Center the drawing on paper */
    this.centerPlot = true;

    /** Plot title block */
    this.plotTitleBlock = true;

    /** DPI for raster output */
    this.dpi = 300;

    /** Output format: 'pdf', 'png', 'svg' */
    this.outputFormat = 'pdf';
  }

  /**
   * Get the effective paper dimensions in mm.
   * @returns {{width: number, height: number}}
   */
  getPaperDimensions() {
    const paper = PAPER_SIZES[this.paperSize] || PAPER_SIZES.A3;
    if (this.orientation === 'landscape') {
      return { width: paper.height, height: paper.width };
    }
    return { width: paper.width, height: paper.height };
  }

  /**
   * Get the printable area in mm (paper minus margins).
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getPrintableArea() {
    const paper = this.getPaperDimensions();
    return {
      x: this.margins.left,
      y: this.margins.bottom,
      width: paper.width - this.margins.left - this.margins.right,
      height: paper.height - this.margins.top - this.margins.bottom,
    };
  }

  /**
   * Compute the effective scale to fit drawing extents into the printable area.
   * @param {{minX: number, minY: number, maxX: number, maxY: number}} extents
   * @returns {number} scale factor (world units per mm)
   */
  computeFitScale(extents) {
    if (!extents) return 1;
    const area = this.getPrintableArea();
    const extW = extents.maxX - extents.minX;
    const extH = extents.maxY - extents.minY;
    if (extW <= 0 && extH <= 0) return 1;
    return Math.min(
      area.width / (extW || 1),
      area.height / (extH || 1)
    );
  }

  /**
   * Get the active scale, computing fit if scale is 0.
   * @param {{minX: number, minY: number, maxX: number, maxY: number}} [extents]
   * @returns {number}
   */
  getEffectiveScale(extents) {
    if (this.scale > 0) return this.scale;
    return this.computeFitScale(extents);
  }

  /**
   * Create a copy of these settings.
   * @returns {PlotSettings}
   */
  clone() {
    const ps = new PlotSettings();
    ps.paperSize = this.paperSize;
    ps.orientation = this.orientation;
    ps.scale = this.scale;
    ps.margins = { ...this.margins };
    ps.colorMode = this.colorMode;
    ps.plotLineweights = this.plotLineweights;
    ps.lineweightScale = this.lineweightScale;
    ps.plotArea = this.plotArea;
    ps.plotWindow = this.plotWindow ? { ...this.plotWindow } : null;
    ps.centerPlot = this.centerPlot;
    ps.plotTitleBlock = this.plotTitleBlock;
    ps.dpi = this.dpi;
    ps.outputFormat = this.outputFormat;
    return ps;
  }

  /**
   * Serialize to a plain object.
   * @returns {Object}
   */
  serialize() {
    return {
      paperSize: this.paperSize,
      orientation: this.orientation,
      scale: this.scale,
      margins: { ...this.margins },
      colorMode: this.colorMode,
      plotLineweights: this.plotLineweights,
      lineweightScale: this.lineweightScale,
      plotArea: this.plotArea,
      plotWindow: this.plotWindow ? { ...this.plotWindow } : null,
      centerPlot: this.centerPlot,
      plotTitleBlock: this.plotTitleBlock,
      dpi: this.dpi,
      outputFormat: this.outputFormat,
    };
  }

  /**
   * Restore from serialized data.
   * @param {Object} data
   */
  deserialize(data) {
    if (!data) return;
    if (data.paperSize) this.paperSize = data.paperSize;
    if (data.orientation) this.orientation = data.orientation;
    if (data.scale != null) this.scale = data.scale;
    if (data.margins) this.margins = { ...data.margins };
    if (data.colorMode) this.colorMode = data.colorMode;
    if (data.plotLineweights != null) this.plotLineweights = data.plotLineweights;
    if (data.lineweightScale != null) this.lineweightScale = data.lineweightScale;
    if (data.plotArea) this.plotArea = data.plotArea;
    if (data.plotWindow) this.plotWindow = { ...data.plotWindow };
    if (data.centerPlot != null) this.centerPlot = data.centerPlot;
    if (data.plotTitleBlock != null) this.plotTitleBlock = data.plotTitleBlock;
    if (data.dpi != null) this.dpi = data.dpi;
    if (data.outputFormat) this.outputFormat = data.outputFormat;
  }

  /**
   * Get all available paper size names.
   * @returns {string[]}
   */
  static getPaperSizeNames() {
    return Object.keys(PAPER_SIZES);
  }

  /**
   * Get all standard plot scales.
   * @returns {Object[]}
   */
  static getPlotScales() {
    return [...PLOT_SCALES];
  }
}
