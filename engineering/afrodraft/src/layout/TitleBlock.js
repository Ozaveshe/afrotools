/**
 * AfroDraft v6 — Title Block Templates
 *
 * Generates entity arrays that form standard title blocks
 * for various paper sizes. These are rendered in paper space.
 */

import { LineEntity, TextEntity, PolylineEntity } from '../core/Entity.js';

/**
 * Pre-built title block templates.
 * Each template returns an array of entities that form the title block.
 */
export class TitleBlock {
  /**
   * Generate a title block for a layout.
   * @param {Object} options
   * @param {number} options.paperWidth — paper width in mm
   * @param {number} options.paperHeight — paper height in mm
   * @param {number} [options.margin=10]
   * @param {string} [options.template='standard'] — 'standard', 'minimal', 'detailed'
   * @param {Object} [options.fields] — title block field values
   * @returns {Object[]} array of entities
   */
  static generate(options) {
    const {
      paperWidth, paperHeight,
      margin = 10,
      template = 'standard',
      fields = {},
    } = options;

    switch (template) {
      case 'minimal':
        return this._generateMinimal(paperWidth, paperHeight, margin, fields);
      case 'detailed':
        return this._generateDetailed(paperWidth, paperHeight, margin, fields);
      case 'standard':
      default:
        return this._generateStandard(paperWidth, paperHeight, margin, fields);
    }
  }

  /**
   * Standard title block (ISO-style).
   */
  static _generateStandard(pw, ph, margin, fields) {
    const entities = [];
    const layer = 'Defpoints';
    const color = { r: 180, g: 180, b: 180, index: 8 };
    const baseProps = { layer, color, linetype: 'Continuous', lineweight: 0.35 };
    const thinProps = { ...baseProps, lineweight: 0.18 };
    const textProps = { layer, color, linetype: 'Continuous', lineweight: 0.0 };

    // Drawing border
    const bx1 = margin, by1 = margin;
    const bx2 = pw - margin, by2 = ph - margin;
    entities.push(new PolylineEntity({
      ...baseProps,
      vertices: [
        { x: bx1, y: by1, bulge: 0 },
        { x: bx2, y: by1, bulge: 0 },
        { x: bx2, y: by2, bulge: 0 },
        { x: bx1, y: by2, bulge: 0 },
      ],
      closed: true,
    }));

    // Title block area (bottom-right corner)
    const tbW = 180;
    const tbH = 56;
    const tbX = bx2 - tbW;
    const tbY = by1;

    // Title block border
    entities.push(new PolylineEntity({
      ...baseProps,
      vertices: [
        { x: tbX, y: tbY, bulge: 0 },
        { x: bx2, y: tbY, bulge: 0 },
        { x: bx2, y: tbY + tbH, bulge: 0 },
        { x: tbX, y: tbY + tbH, bulge: 0 },
      ],
      closed: true,
    }));

    // Internal divisions
    // Row 1: Title (full width, 16mm high)
    const r1y = tbY + 16;
    entities.push(new LineEntity({ ...thinProps, start: { x: tbX, y: r1y }, end: { x: bx2, y: r1y } }));

    // Row 2: Drawing number + Scale (8mm high)
    const r2y = r1y + 8;
    entities.push(new LineEntity({ ...thinProps, start: { x: tbX, y: r2y }, end: { x: bx2, y: r2y } }));

    // Row 3: Date + Drawn by (8mm high)
    const r3y = r2y + 8;
    entities.push(new LineEntity({ ...thinProps, start: { x: tbX, y: r3y }, end: { x: bx2, y: r3y } }));

    // Row 4: Checked + Approved (8mm high)
    const r4y = r3y + 8;
    entities.push(new LineEntity({ ...thinProps, start: { x: tbX, y: r4y }, end: { x: bx2, y: r4y } }));

    // Vertical dividers
    const midX = tbX + tbW / 2;
    entities.push(new LineEntity({ ...thinProps, start: { x: midX, y: r1y }, end: { x: midX, y: tbY + tbH } }));

    // Col divider at 1/3 for labels
    const labelX = tbX + 30;
    entities.push(new LineEntity({ ...thinProps, start: { x: labelX, y: r1y }, end: { x: labelX, y: tbY + tbH } }));
    entities.push(new LineEntity({ ...thinProps, start: { x: midX + 30, y: r1y }, end: { x: midX + 30, y: tbY + tbH } }));

    // Labels (small text)
    const labelH = 1.8;
    const valueH = 2.5;
    const labelColor = { r: 128, g: 128, b: 128, index: 8 };

    const addLabel = (x, y, label) => {
      entities.push(new TextEntity({ ...textProps, position: { x: x + 1, y: y + 1.5 }, text: label, height: labelH, color: labelColor }));
    };
    const addValue = (x, y, value) => {
      entities.push(new TextEntity({ ...textProps, position: { x: x + 1, y: y + 4 }, text: value || '', height: valueH }));
    };

    // Title row (full width)
    entities.push(new TextEntity({
      ...textProps, position: { x: tbX + tbW / 2, y: tbY + 8 },
      text: fields.title || 'DRAWING TITLE',
      height: 5, justification: 'center',
    }));

    // Labels
    addLabel(tbX, r1y, 'Drawing No.');
    addValue(tbX, r1y, fields.drawingNumber || '');
    addLabel(midX, r1y, 'Scale');
    addValue(midX, r1y, fields.scale || '1:1');

    addLabel(tbX, r2y, 'Date');
    addValue(tbX, r2y, fields.date || new Date().toISOString().slice(0, 10));
    addLabel(midX, r2y, 'Drawn by');
    addValue(midX, r2y, fields.drawnBy || '');

    addLabel(tbX, r3y, 'Checked');
    addValue(tbX, r3y, fields.checked || '');
    addLabel(midX, r3y, 'Approved');
    addValue(midX, r3y, fields.approved || '');

    // Company name in top row of title block
    addLabel(tbX, r4y, 'Company');
    addValue(tbX, r4y, fields.company || '');
    addLabel(midX, r4y, 'Sheet');
    addValue(midX, r4y, fields.sheet || '1 of 1');

    return entities;
  }

  /**
   * Minimal title block (just border and small info strip).
   */
  static _generateMinimal(pw, ph, margin, fields) {
    const entities = [];
    const baseProps = { layer: 'Defpoints', color: { r: 180, g: 180, b: 180, index: 8 }, linetype: 'Continuous', lineweight: 0.35 };

    // Border
    const bx1 = margin, by1 = margin;
    const bx2 = pw - margin, by2 = ph - margin;
    entities.push(new PolylineEntity({
      ...baseProps,
      vertices: [
        { x: bx1, y: by1, bulge: 0 },
        { x: bx2, y: by1, bulge: 0 },
        { x: bx2, y: by2, bulge: 0 },
        { x: bx1, y: by2, bulge: 0 },
      ],
      closed: true,
    }));

    // Info strip at bottom
    const stripH = 8;
    entities.push(new LineEntity({ ...baseProps, lineweight: 0.18, start: { x: bx1, y: by1 + stripH }, end: { x: bx2, y: by1 + stripH } }));

    // Title text
    entities.push(new TextEntity({
      layer: 'Defpoints', color: { r: 180, g: 180, b: 180, index: 8 },
      position: { x: bx1 + 5, y: by1 + 3 },
      text: fields.title || 'UNTITLED',
      height: 3,
    }));

    // Scale and date
    entities.push(new TextEntity({
      layer: 'Defpoints', color: { r: 128, g: 128, b: 128, index: 8 },
      position: { x: bx2 - 80, y: by1 + 3 },
      text: `Scale: ${fields.scale || '1:1'}  |  ${fields.date || new Date().toISOString().slice(0, 10)}`,
      height: 2,
    }));

    return entities;
  }

  /**
   * Detailed title block (with revision history area).
   */
  static _generateDetailed(pw, ph, margin, fields) {
    // Start with standard and add revision area
    const entities = this._generateStandard(pw, ph, margin, fields);
    const baseProps = { layer: 'Defpoints', color: { r: 180, g: 180, b: 180, index: 8 }, linetype: 'Continuous', lineweight: 0.18 };

    const bx2 = pw - margin;
    const by2 = ph - margin;

    // Revision table along top-right
    const revW = 180;
    const revH = 30;
    const revX = bx2 - revW;
    const revY = by2 - revH;

    entities.push(new PolylineEntity({
      ...baseProps,
      vertices: [
        { x: revX, y: revY, bulge: 0 },
        { x: bx2, y: revY, bulge: 0 },
        { x: bx2, y: by2, bulge: 0 },
        { x: revX, y: by2, bulge: 0 },
      ],
      closed: true,
    }));

    // Header
    entities.push(new TextEntity({
      layer: 'Defpoints', color: { r: 128, g: 128, b: 128, index: 8 },
      position: { x: revX + revW / 2, y: by2 - 3 },
      text: 'REVISION HISTORY',
      height: 2.5, justification: 'center',
    }));

    // Horizontal divider
    entities.push(new LineEntity({ ...baseProps, start: { x: revX, y: by2 - 8 }, end: { x: bx2, y: by2 - 8 } }));

    // Column headers
    const colW = [20, 80, 40, 40];
    let cx = revX;
    const headers = ['Rev', 'Description', 'Date', 'By'];
    for (let i = 0; i < headers.length; i++) {
      entities.push(new TextEntity({
        layer: 'Defpoints', color: { r: 128, g: 128, b: 128, index: 8 },
        position: { x: cx + 2, y: by2 - 6 },
        text: headers[i], height: 1.8,
      }));
      cx += colW[i];
      if (i < headers.length - 1) {
        entities.push(new LineEntity({ ...baseProps, start: { x: cx, y: revY }, end: { x: cx, y: by2 } }));
      }
    }

    // Row dividers (3 revision rows)
    for (let r = 1; r <= 2; r++) {
      const ry = by2 - 8 - r * 7.33;
      entities.push(new LineEntity({ ...baseProps, start: { x: revX, y: ry }, end: { x: bx2, y: ry } }));
    }

    return entities;
  }

  /**
   * Get list of available title block template names.
   * @returns {string[]}
   */
  static getTemplateNames() {
    return ['standard', 'minimal', 'detailed'];
  }

  /**
   * Get the required field names for a template.
   * @param {string} template
   * @returns {string[]}
   */
  static getFieldNames(template) {
    const common = ['title', 'drawingNumber', 'scale', 'date', 'drawnBy', 'company', 'sheet'];
    if (template === 'detailed') {
      return [...common, 'checked', 'approved'];
    }
    return common;
  }
}
