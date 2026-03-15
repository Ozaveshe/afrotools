/**
 * AfroDraft v6 - GridRenderer
 * Draws an infinite adaptive grid with origin axes.
 */

const THEME_COLORS = {
  dark: {
    minor: 'rgba(255,255,255,0.06)',
    major: 'rgba(255,255,255,0.14)',
    axisX: 'rgba(220,60,60,0.6)',
    axisY: 'rgba(60,180,60,0.6)',
  },
  light: {
    minor: 'rgba(0,0,0,0.06)',
    major: 'rgba(0,0,0,0.14)',
    axisX: 'rgba(200,40,40,0.5)',
    axisY: 'rgba(40,160,40,0.5)',
  },
  blueprint: {
    minor: 'rgba(255,255,255,0.04)',
    major: 'rgba(255,255,255,0.10)',
    axisX: 'rgba(255,100,100,0.5)',
    axisY: 'rgba(100,255,100,0.5)',
  },
  highcontrast: {
    minor: 'rgba(255,255,255,0.07)',
    major: 'rgba(255,255,255,0.18)',
    axisX: 'rgba(255,80,80,0.7)',
    axisY: 'rgba(80,255,80,0.7)',
  },
};

export class GridRenderer {
  /**
   * @param {import('./Viewport.js').Viewport} viewport
   */
  constructor(viewport) {
    this.viewport = viewport;

    /** Major grid spacing in world units. */
    this.majorSpacing = 100;
    /** Minor grid spacing in world units. */
    this.minorSpacing = 10;

    this.showGrid = true;
    this.showAxes = true;

    /** Minimum screen-pixel distance between grid lines before we skip the level. */
    this.minPixelSpacing = 6;
  }

  /**
   * Render the grid (and origin axes) into the given context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {'dark'|'light'|'blueprint'|'highcontrast'} theme
   */
  render(ctx, theme) {
    if (!this.showGrid && !this.showAxes) return;

    const vp = this.viewport;
    const colors = THEME_COLORS[theme] || THEME_COLORS.dark;
    const bounds = vp.getVisibleBounds();

    if (this.showGrid) {
      // Determine the adaptive grid spacing levels to draw.
      // We use a power-of-ten scheme: pick a base spacing such that lines
      // are comfortably visible, then draw a coarser level on top.
      const levels = this._computeGridLevels(vp.zoom);

      for (const level of levels) {
        this._drawGridLevel(ctx, vp, bounds, level.spacing, level.color(colors));
      }
    }

    if (this.showAxes) {
      this._drawAxes(ctx, vp, bounds, colors);
    }
  }

  // -----------------------------------------------------------------------
  // Grid level computation
  // -----------------------------------------------------------------------

  /**
   * Return an array of {spacing, color(colors)} objects to draw, from finest
   * to coarsest.  We pick spacings from a {1, 2, 5} * 10^n series so the
   * grid is always clean, and skip levels that would be too dense.
   */
  _computeGridLevels(zoom) {
    // Minimum world-unit spacing so that lines are >= minPixelSpacing apart
    const minWorld = this.minPixelSpacing / zoom;

    // Walk up the 1-2-5 series until we exceed minWorld
    const series = [1, 2, 5];
    let exp = Math.floor(Math.log10(minWorld)) - 1;
    let fineSpacing = 0;

    outer:
    for (let e = exp; e < exp + 10; e++) {
      for (const s of series) {
        const sp = s * Math.pow(10, e);
        if (sp >= minWorld) {
          fineSpacing = sp;
          break outer;
        }
      }
    }

    if (fineSpacing <= 0) fineSpacing = 1;

    // Coarse level: 5x or 10x the fine level
    const coarseSpacing = fineSpacing * 10;

    // Pixel spacing of each level (for alpha modulation)
    const finePx = fineSpacing * zoom;
    const coarsePx = coarseSpacing * zoom;

    const levels = [];

    // Fine level (minor)
    if (finePx >= this.minPixelSpacing) {
      levels.push({
        spacing: fineSpacing,
        color: (c) => c.minor,
      });
    }

    // Coarse level (major)
    if (coarsePx >= this.minPixelSpacing) {
      levels.push({
        spacing: coarseSpacing,
        color: (c) => c.major,
      });
    }

    return levels;
  }

  // -----------------------------------------------------------------------
  // Drawing
  // -----------------------------------------------------------------------

  _drawGridLevel(ctx, vp, bounds, spacing, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();

    // Vertical lines (constant world X)
    const startX = Math.floor(bounds.minX / spacing) * spacing;
    const endX = bounds.maxX;
    for (let wx = startX; wx <= endX; wx += spacing) {
      const sx = vp.worldToScreen(wx, 0).x;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, vp.height);
    }

    // Horizontal lines (constant world Y)
    const startY = Math.floor(bounds.minY / spacing) * spacing;
    const endY = bounds.maxY;
    for (let wy = startY; wy <= endY; wy += spacing) {
      const sy = vp.worldToScreen(0, wy).y;
      ctx.moveTo(0, sy);
      ctx.lineTo(vp.width, sy);
    }

    ctx.stroke();
  }

  _drawAxes(ctx, vp, bounds, colors) {
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);

    // X-axis (world Y = 0)
    const y0 = vp.worldToScreen(0, 0).y;
    if (y0 >= 0 && y0 <= vp.height) {
      ctx.strokeStyle = colors.axisX;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(vp.width, y0);
      ctx.stroke();
    }

    // Y-axis (world X = 0)
    const x0 = vp.worldToScreen(0, 0).x;
    if (x0 >= 0 && x0 <= vp.width) {
      ctx.strokeStyle = colors.axisY;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, vp.height);
      ctx.stroke();
    }
  }
}
