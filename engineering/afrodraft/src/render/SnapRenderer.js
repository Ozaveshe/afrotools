/**
 * AfroDraft v6 - SnapRenderer
 * Draws snap indicators and polar/ortho tracking lines.
 *
 * All indicators are drawn in screen space on top of everything.
 */

/** Default snap indicator color. */
const SNAP_COLOR = '#FFD700'; // gold / yellow
const SNAP_ALT_COLOR = '#00FF88'; // green for some types

export class SnapRenderer {
  /**
   * @param {import('./Viewport.js').Viewport} viewport
   */
  constructor(viewport) {
    this.viewport = viewport;
    /** Size of snap indicators in screen pixels. */
    this.size = 10;
    this.lineWidth = 1.5;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Draw a snap indicator at the given world point.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} snapType  One of: endpoint, midpoint, center, intersection,
   *   perpendicular, tangent, nearest, extension, quadrant, node, parallel
   * @param {number} worldX
   * @param {number} worldY
   */
  renderSnap(ctx, snapType, worldX, worldY) {
    const sp = this.viewport.worldToScreen(worldX, worldY);
    const s = this.size;
    const h = s / 2;

    ctx.save();
    ctx.lineWidth = this.lineWidth;
    ctx.setLineDash([]);

    switch (snapType) {
      case 'endpoint':
        this._drawEndpoint(ctx, sp, h);
        break;
      case 'midpoint':
        this._drawMidpoint(ctx, sp, h);
        break;
      case 'center':
        this._drawCenter(ctx, sp, h);
        break;
      case 'intersection':
        this._drawIntersection(ctx, sp, h);
        break;
      case 'perpendicular':
        this._drawPerpendicular(ctx, sp, h);
        break;
      case 'tangent':
        this._drawTangent(ctx, sp, h);
        break;
      case 'nearest':
        this._drawNearest(ctx, sp, h);
        break;
      case 'extension':
        this._drawExtension(ctx, sp, h);
        break;
      case 'quadrant':
        this._drawQuadrant(ctx, sp, h);
        break;
      case 'node':
        this._drawNode(ctx, sp, h);
        break;
      case 'parallel':
        this._drawParallel(ctx, sp, h);
        break;
      default:
        // Fallback: small diamond
        this._drawQuadrant(ctx, sp, h);
    }

    ctx.restore();
  }

  /**
   * Draw a polar/ortho tracking line extending from basePoint through the cursor.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} baseWorldX
   * @param {number} baseWorldY
   * @param {number} cursorWorldX
   * @param {number} cursorWorldY
   * @param {number} angleDeg   The tracked angle in degrees.
   */
  renderTrackingLine(ctx, baseWorldX, baseWorldY, cursorWorldX, cursorWorldY, angleDeg) {
    const vp = this.viewport;
    const base = vp.worldToScreen(baseWorldX, baseWorldY);
    const cursor = vp.worldToScreen(cursorWorldX, cursorWorldY);

    // Extend the line well beyond the viewport in both directions
    const dx = cursor.x - base.x;
    const dy = cursor.y - base.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const ext = Math.max(vp.width, vp.height) * 2;

    ctx.save();
    ctx.strokeStyle = SNAP_ALT_COLOR;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(base.x - ux * ext, base.y - uy * ext);
    ctx.lineTo(base.x + ux * ext, base.y + uy * ext);
    ctx.stroke();

    // Draw angle label near the cursor
    ctx.fillStyle = SNAP_ALT_COLOR;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${angleDeg.toFixed(1)}\u00B0`, cursor.x + 12, cursor.y - 4);

    ctx.restore();
  }

  /**
   * Draw an extension tracking line (dotted) from a snap point through cursor.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} fromWorldX
   * @param {number} fromWorldY
   * @param {number} toWorldX
   * @param {number} toWorldY
   */
  renderExtensionLine(ctx, fromWorldX, fromWorldY, toWorldX, toWorldY) {
    const vp = this.viewport;
    const from = vp.worldToScreen(fromWorldX, fromWorldY);
    const to = vp.worldToScreen(toWorldX, toWorldY);

    ctx.save();
    ctx.strokeStyle = SNAP_COLOR;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 4]);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Individual snap indicator draw methods
  // -----------------------------------------------------------------------

  /** Endpoint: small square. */
  _drawEndpoint(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    ctx.strokeRect(sp.x - h, sp.y - h, h * 2, h * 2);
  }

  /** Midpoint: triangle pointing up. */
  _drawMidpoint(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y - h);
    ctx.lineTo(sp.x - h, sp.y + h);
    ctx.lineTo(sp.x + h, sp.y + h);
    ctx.closePath();
    ctx.stroke();
  }

  /** Center: circle. */
  _drawCenter(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, h, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** Intersection: X mark. */
  _drawIntersection(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    ctx.beginPath();
    ctx.moveTo(sp.x - h, sp.y - h);
    ctx.lineTo(sp.x + h, sp.y + h);
    ctx.moveTo(sp.x + h, sp.y - h);
    ctx.lineTo(sp.x - h, sp.y + h);
    ctx.stroke();
  }

  /** Perpendicular: right-angle symbol (rotated L with a small square). */
  _drawPerpendicular(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y - h);
    ctx.lineTo(sp.x, sp.y + h);
    // Horizontal line from bottom-left
    ctx.moveTo(sp.x - h, sp.y + h);
    ctx.lineTo(sp.x + h, sp.y + h);
    ctx.stroke();
    // Small square at corner
    const sq = h * 0.4;
    ctx.strokeRect(sp.x, sp.y + h - sq, sq, sq);
  }

  /** Tangent: circle with a tangent line at top. */
  _drawTangent(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    const r = h * 0.6;
    // Circle
    ctx.beginPath();
    ctx.arc(sp.x, sp.y + r * 0.3, r, 0, Math.PI * 2);
    ctx.stroke();
    // Horizontal tangent line at top of circle
    ctx.beginPath();
    ctx.moveTo(sp.x - h, sp.y + r * 0.3 - r);
    ctx.lineTo(sp.x + h, sp.y + r * 0.3 - r);
    ctx.stroke();
  }

  /** Nearest: hourglass / bowtie shape. */
  _drawNearest(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    ctx.beginPath();
    // Top triangle
    ctx.moveTo(sp.x - h, sp.y - h);
    ctx.lineTo(sp.x + h, sp.y - h);
    ctx.lineTo(sp.x, sp.y);
    ctx.closePath();
    ctx.stroke();
    // Bottom triangle
    ctx.beginPath();
    ctx.moveTo(sp.x - h, sp.y + h);
    ctx.lineTo(sp.x + h, sp.y + h);
    ctx.lineTo(sp.x, sp.y);
    ctx.closePath();
    ctx.stroke();
  }

  /** Extension: small + mark (like an endpoint, but a plus instead of square). */
  _drawExtension(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    ctx.beginPath();
    ctx.moveTo(sp.x - h, sp.y);
    ctx.lineTo(sp.x + h, sp.y);
    ctx.moveTo(sp.x, sp.y - h);
    ctx.lineTo(sp.x, sp.y + h);
    ctx.stroke();
  }

  /** Quadrant: diamond (rotated square). */
  _drawQuadrant(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y - h);
    ctx.lineTo(sp.x + h, sp.y);
    ctx.lineTo(sp.x, sp.y + h);
    ctx.lineTo(sp.x - h, sp.y);
    ctx.closePath();
    ctx.stroke();
  }

  /** Node: circle with cross inside (circled plus). */
  _drawNode(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, h, 0, Math.PI * 2);
    ctx.stroke();
    // Cross inside
    ctx.beginPath();
    ctx.moveTo(sp.x - h, sp.y);
    ctx.lineTo(sp.x + h, sp.y);
    ctx.moveTo(sp.x, sp.y - h);
    ctx.lineTo(sp.x, sp.y + h);
    ctx.stroke();
  }

  /** Parallel: two short parallel diagonal lines. */
  _drawParallel(ctx, sp, h) {
    ctx.strokeStyle = SNAP_COLOR;
    const gap = h * 0.35;
    ctx.beginPath();
    // First line (left)
    ctx.moveTo(sp.x - gap - h * 0.4, sp.y + h * 0.6);
    ctx.lineTo(sp.x - gap + h * 0.4, sp.y - h * 0.6);
    // Second line (right)
    ctx.moveTo(sp.x + gap - h * 0.4, sp.y + h * 0.6);
    ctx.lineTo(sp.x + gap + h * 0.4, sp.y - h * 0.6);
    ctx.stroke();
  }
}
