/**
 * AfroDraft v6 - CursorRenderer
 * Draws cursor crosshair, dynamic input fields, rubber-band previews,
 * and selection rectangles.
 */

const CROSSHAIR_COLOR_DARK = 'rgba(255,255,255,0.45)';
const CROSSHAIR_COLOR_LIGHT = 'rgba(0,0,0,0.35)';
const DYN_BG = 'rgba(30,30,30,0.85)';
const DYN_FG = '#E0E0E0';
const DYN_BORDER = 'rgba(100,100,100,0.6)';

const WINDOW_SELECT_FILL = 'rgba(50,120,220,0.12)';
const WINDOW_SELECT_STROKE = '#3B82F6';
const CROSSING_SELECT_FILL = 'rgba(50,200,80,0.10)';
const CROSSING_SELECT_STROKE = '#22C55E';

export class CursorRenderer {
  /**
   * @param {import('./Viewport.js').Viewport} viewport
   */
  constructor(viewport) {
    this.viewport = viewport;

    this.showCrosshair = true;
    this.showDynamicInput = true;

    /**
     * Crosshair size as a fraction of viewport (each arm).
     * Use 'full' for full-screen crosshair.
     * @type {number|'full'}
     */
    this.crosshairSize = 'full';

    /** Current world-space cursor position. */
    this.cursorX = 0;
    this.cursorY = 0;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Full cursor overlay render pass.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} worldX   Current world X of cursor
   * @param {number} worldY   Current world Y of cursor
   * @param {object|null} commandState  Active command state for rubber-band preview
   *   Expected shape:
   *   {
   *     command: string,          // 'line', 'circle', 'arc', 'rect', etc.
   *     basePoint?: {x, y},       // first click world coord
   *     points?: [{x, y}],        // accumulated points
   *     radius?: number,           // for circle preview
   *     selectionRect?: {startScreen: {x,y}, endScreen: {x,y}, isWindowSelect: boolean}
   *   }
   * @param {'dark'|'light'|'blueprint'|'highcontrast'} theme
   */
  render(ctx, worldX, worldY, commandState, theme) {
    this.cursorX = worldX;
    this.cursorY = worldY;

    const sp = this.viewport.worldToScreen(worldX, worldY);

    if (this.showCrosshair) {
      this._drawCrosshair(ctx, sp, theme);
    }

    // Rubber-band previews
    if (commandState) {
      this._drawRubberBand(ctx, worldX, worldY, commandState, theme);

      // Selection rectangle
      if (commandState.selectionRect) {
        const sr = commandState.selectionRect;
        this.drawSelectionRect(ctx, sr.startScreen, sr.endScreen, sr.isWindowSelect);
      }
    }

    if (this.showDynamicInput) {
      this._drawDynamicInput(ctx, sp, worldX, worldY, commandState);
    }
  }

  /**
   * Draw a selection rectangle.
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x:number,y:number}} startScreen
   * @param {{x:number,y:number}} endScreen
   * @param {boolean} isWindowSelect  true = left-to-right (solid blue),
   *                                  false = right-to-left crossing (dashed green)
   */
  drawSelectionRect(ctx, startScreen, endScreen, isWindowSelect) {
    const x = Math.min(startScreen.x, endScreen.x);
    const y = Math.min(startScreen.y, endScreen.y);
    const w = Math.abs(endScreen.x - startScreen.x);
    const h = Math.abs(endScreen.y - startScreen.y);

    ctx.save();

    if (isWindowSelect) {
      // Solid blue rectangle
      ctx.fillStyle = WINDOW_SELECT_FILL;
      ctx.strokeStyle = WINDOW_SELECT_STROKE;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    } else {
      // Dashed green rectangle
      ctx.fillStyle = CROSSING_SELECT_FILL;
      ctx.strokeStyle = CROSSING_SELECT_STROKE;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 3]);
    }

    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Crosshair
  // -----------------------------------------------------------------------

  _drawCrosshair(ctx, sp, theme) {
    const vp = this.viewport;
    const color = (theme === 'light')
      ? CROSSHAIR_COLOR_LIGHT
      : CROSSHAIR_COLOR_DARK;

    let armLen;
    if (this.crosshairSize === 'full') {
      armLen = Math.max(vp.width, vp.height);
    } else {
      armLen = Math.max(vp.width, vp.height) * this.crosshairSize;
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 4]);

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(sp.x - armLen, sp.y);
    ctx.lineTo(sp.x + armLen, sp.y);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y - armLen);
    ctx.lineTo(sp.x, sp.y + armLen);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Dynamic input display
  // -----------------------------------------------------------------------

  _drawDynamicInput(ctx, sp, worldX, worldY, commandState) {
    const labels = [];

    if (commandState && commandState.basePoint) {
      const bp = commandState.basePoint;
      const dx = worldX - bp.x;
      const dy = worldY - bp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      labels.push(`L: ${dist.toFixed(4)}`);
      labels.push(`A: ${angle.toFixed(2)}\u00B0`);
    } else {
      // Just show world coordinates
      labels.push(`X: ${worldX.toFixed(4)}`);
      labels.push(`Y: ${worldY.toFixed(4)}`);
    }

    this._drawInputBadges(ctx, sp, labels);
  }

  /**
   * Draw small labelled badges near the cursor.
   */
  _drawInputBadges(ctx, sp, labels) {
    ctx.save();
    ctx.font = '11px monospace';

    const padX = 6;
    const padY = 3;
    const gap = 4;
    const offsetX = 18;
    const offsetY = 18;

    let currentX = sp.x + offsetX;
    const baseY = sp.y + offsetY;

    for (const text of labels) {
      const metrics = ctx.measureText(text);
      const w = metrics.width + padX * 2;
      const h = 16 + padY * 2;

      // Background
      ctx.fillStyle = DYN_BG;
      ctx.strokeStyle = DYN_BORDER;
      ctx.lineWidth = 1;
      this._roundRect(ctx, currentX, baseY, w, h, 3);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = DYN_FG;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, currentX + padX, baseY + h / 2);

      currentX += w + gap;
    }

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // -----------------------------------------------------------------------
  // Rubber-band previews
  // -----------------------------------------------------------------------

  _drawRubberBand(ctx, worldX, worldY, commandState, theme) {
    const vp = this.viewport;
    const cmd = (commandState.command || '').toLowerCase();
    const bp = commandState.basePoint;
    if (!bp && !commandState.points?.length) return;

    const rubberColor = 'rgba(100,200,255,0.7)';

    ctx.save();
    ctx.strokeStyle = rubberColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);

    switch (cmd) {
      case 'line': {
        // Draw from base point (or last point in sequence) to cursor
        const origin = commandState.points?.length
          ? commandState.points[commandState.points.length - 1]
          : bp;
        if (!origin) break;
        const s0 = vp.worldToScreen(origin.x, origin.y);
        const s1 = vp.worldToScreen(worldX, worldY);
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();
        break;
      }

      case 'circle': {
        if (!bp) break;
        const sc = vp.worldToScreen(bp.x, bp.y);
        const dx = worldX - bp.x;
        const dy = worldY - bp.y;
        const r = vp.worldToScreenDist(Math.sqrt(dx * dx + dy * dy));
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, r, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'arc': {
        // If we have center + start, preview arc to cursor
        if (commandState.points?.length >= 2) {
          const center = commandState.points[0];
          const start = commandState.points[1];
          const rWorld = Math.sqrt(
            (start.x - center.x) ** 2 + (start.y - center.y) ** 2,
          );
          const sc = vp.worldToScreen(center.x, center.y);
          const sr = vp.worldToScreenDist(rWorld);
          const a1 = Math.atan2(start.y - center.y, start.x - center.x);
          const a2 = Math.atan2(worldY - center.y, worldX - center.x);
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, sr, -a1, -a2, true);
          ctx.stroke();
        } else if (bp) {
          // Just a line from base to cursor
          const s0 = vp.worldToScreen(bp.x, bp.y);
          const s1 = vp.worldToScreen(worldX, worldY);
          ctx.beginPath();
          ctx.moveTo(s0.x, s0.y);
          ctx.lineTo(s1.x, s1.y);
          ctx.stroke();
        }
        break;
      }

      case 'rect':
      case 'rectangle': {
        if (!bp) break;
        const tl = vp.worldToScreen(
          Math.min(bp.x, worldX),
          Math.max(bp.y, worldY),
        );
        const br = vp.worldToScreen(
          Math.max(bp.x, worldX),
          Math.min(bp.y, worldY),
        );
        ctx.beginPath();
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        break;
      }

      case 'polyline': {
        // Draw from last accumulated point to cursor
        const pts = commandState.points || [];
        if (pts.length === 0 && bp) {
          const s0 = vp.worldToScreen(bp.x, bp.y);
          const s1 = vp.worldToScreen(worldX, worldY);
          ctx.beginPath();
          ctx.moveTo(s0.x, s0.y);
          ctx.lineTo(s1.x, s1.y);
          ctx.stroke();
        } else if (pts.length > 0) {
          // Draw existing segments solid, then rubber-band dashed
          ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(100,200,255,0.5)';
          ctx.beginPath();
          const f = vp.worldToScreen(pts[0].x, pts[0].y);
          ctx.moveTo(f.x, f.y);
          for (let i = 1; i < pts.length; i++) {
            const p = vp.worldToScreen(pts[i].x, pts[i].y);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          // Rubber band from last point to cursor
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = rubberColor;
          const last = pts[pts.length - 1];
          const sl = vp.worldToScreen(last.x, last.y);
          const sc = vp.worldToScreen(worldX, worldY);
          ctx.beginPath();
          ctx.moveTo(sl.x, sl.y);
          ctx.lineTo(sc.x, sc.y);
          ctx.stroke();
        }
        break;
      }

      case 'ellipse': {
        if (!bp) break;
        const dx = Math.abs(worldX - bp.x);
        const dy = Math.abs(worldY - bp.y);
        const sc = vp.worldToScreen(bp.x, bp.y);
        const rx = vp.worldToScreenDist(dx);
        const ry = vp.worldToScreenDist(dy);
        ctx.beginPath();
        ctx.ellipse(sc.x, sc.y, rx || 1, ry || 1, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      default:
        // For unknown commands with a base point, just draw a line
        if (bp) {
          const s0 = vp.worldToScreen(bp.x, bp.y);
          const s1 = vp.worldToScreen(worldX, worldY);
          ctx.beginPath();
          ctx.moveTo(s0.x, s0.y);
          ctx.lineTo(s1.x, s1.y);
          ctx.stroke();
        }
    }

    ctx.setLineDash([]);
    ctx.restore();
  }
}
