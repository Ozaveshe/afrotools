/**
 * AfroDraft v6 — Main Application Entry Point
 * Wires together the CAD engine, viewport, renderers, UI components,
 * and input handling into a working full-screen CAD application.
 */

import { Engine } from './src/core/Engine.js';
import { Viewport } from './src/render/Viewport.js';
import { Renderer } from './src/render/Renderer.js';
import { GridRenderer } from './src/render/GridRenderer.js';
import { SnapRenderer } from './src/render/SnapRenderer.js';
import { CursorRenderer } from './src/render/CursorRenderer.js';
import { SelectionManager } from './src/core/SelectionManager.js';
import { SnapEngine } from './src/core/SnapEngine.js';
import { UndoManager } from './src/core/UndoManager.js';
import { LayerManager } from './src/core/LayerManager.js';
import { StyleManager } from './src/core/StyleManager.js';
import { BlockManager } from './src/core/BlockManager.js';
import { CommandRegistry } from './src/commands/CommandRegistry.js';
import { registerDrawCommands } from './src/commands/DrawCommands.js';
import { registerModifyCommands } from './src/commands/ModifyCommands.js';
import { registerAnnotateCommands } from './src/commands/AnnotateCommands.js';
import { registerInquiryCommands } from './src/commands/InquiryCommands.js';
import { Ribbon } from './src/ui/Ribbon.js';
import { StatusBar } from './src/ui/StatusBar.js';
import { CommandLine } from './src/ui/CommandLine.js';
import { PropertiesPanel } from './src/ui/PropertiesPanel.js';
import { LayerPanel } from './src/ui/LayerPanel.js';
import { ContextMenu } from './src/ui/ContextMenu.js';
import { Dialogs } from './src/ui/Dialogs.js';
import { SHORTCUTS, isModifierShortcut, eventToShortcutKey } from './src/data/shortcuts.js';

class AfroDraftApp {
  constructor() {
    // ── Core engine ──
    this.engine = new Engine({ units: 'mm', precision: 4 });
    this.undoManager = new UndoManager(this.engine);
    this.engine.undoManager = this.undoManager;
    this.layerManager = new LayerManager(this.engine);
    this.engine.layerManager = this.layerManager;
    this.styleManager = new StyleManager(this.engine);
    this.engine.styleManager = this.styleManager;
    this.blockManager = new BlockManager(this.engine);
    this.engine.blockManager = this.blockManager;

    // ── Canvas and viewport ──
    this.canvas = document.getElementById('cad-canvas');
    this.canvasWrap = document.getElementById('canvas-wrap');
    this.viewport = new Viewport(this.canvas);

    // ── Renderers ──
    this.renderer = new Renderer(this.viewport, this.engine);
    this.gridRenderer = new GridRenderer(this.viewport);
    this.snapRenderer = new SnapRenderer(this.viewport);
    this.cursorRenderer = new CursorRenderer(this.viewport);

    // ── Selection and snaps ──
    this.selectionManager = new SelectionManager(this.engine);
    this.snapEngine = new SnapEngine(this.engine);

    // ── Commands ──
    this.commandRegistry = new CommandRegistry(this.engine);
    registerDrawCommands(this.commandRegistry);
    registerModifyCommands(this.commandRegistry);
    registerAnnotateCommands(this.commandRegistry);
    registerInquiryCommands(this.commandRegistry);

    // ── UI components ──
    this.ribbon = new Ribbon(this.commandRegistry);
    this.statusBar = new StatusBar(this.snapEngine, this.gridRenderer);
    this.commandLine = new CommandLine(this.commandRegistry);
    this.propertiesPanel = new PropertiesPanel(this.engine, this.selectionManager);
    this.layerPanel = new LayerPanel(this.engine);
    this.contextMenu = new ContextMenu(this.commandRegistry, this.selectionManager);
    this.dialogs = new Dialogs(this.engine, this.viewport);

    // ── State ──
    this.cursorWorldX = 0;
    this.cursorWorldY = 0;
    this.currentSnap = null;
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._selectionStart = null;
    this._theme = 'dark';

    // ── Tabs ──
    this._tabs = [{ name: 'Untitled-1', modified: false }];
    this._activeTab = 0;
    this._renderTabs();

    // ── Setup ──
    this.setupCanvasEvents();
    this.setupKeyboardShortcuts();
    this.setupResize();
    this._resizeCanvas();

    // Initial zoom to show default A3 limits
    this.viewport.zoomExtents({
      minX: -10, minY: -10,
      maxX: this.engine.limitsMax.x + 10,
      maxY: this.engine.limitsMax.y + 10,
    });

    // Start render loop
    this._animFrame = null;
    this.renderLoop();

    // Set units display
    this.statusBar.setUnits(this.engine.units);

    // Hide loading screen
    setTimeout(() => {
      document.getElementById('loading').classList.add('hidden');
    }, 300);

    console.log('AfroDraft v6 initialized');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Canvas Events
  // ════════════════════════════════════════════════════════════════════════════

  setupCanvasEvents() {
    const wrap = this.canvasWrap;

    // ── Mouse move ──
    wrap.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = this.viewport.screenToWorld(sx, sy);

      // Snap
      const snapped = this._trySnap(world.x, world.y);
      this.cursorWorldX = snapped.x;
      this.cursorWorldY = snapped.y;
      this.currentSnap = snapped.snap;

      // Update status bar coords
      this.statusBar.updateCoords(this.cursorWorldX, this.cursorWorldY, this.engine.precision);

      // Forward to command
      this.commandRegistry.handleMouseMove(this.cursorWorldX, this.cursorWorldY);

      // Panning
      if (this._isPanning) {
        const dx = e.clientX - this._panStartX;
        const dy = e.clientY - this._panStartY;
        this.viewport.pan(dx, dy);
        this._panStartX = e.clientX;
        this._panStartY = e.clientY;
      }

      this.renderer.dirty = true;
    });

    // ── Left click ──
    wrap.addEventListener('click', (e) => {
      if (this._isPanning) return;

      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = this.viewport.screenToWorld(sx, sy);
      const snapped = this._trySnap(world.x, world.y);

      if (this.commandRegistry.isActive()) {
        // Forward click to active command
        this.commandRegistry.handleClick(snapped.x, snapped.y);
      } else {
        // Selection mode: pick entity
        this.selectionManager.selectAt(snapped.x, snapped.y, e.shiftKey);
      }
      this.renderer.dirty = true;
    });

    // ── Right click (context menu) ──
    wrap.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.contextMenu.show(e.clientX, e.clientY);
    });

    // ── Middle mouse pan ──
    wrap.addEventListener('mousedown', (e) => {
      if (e.button === 1) { // middle button
        e.preventDefault();
        this._isPanning = true;
        this._panStartX = e.clientX;
        this._panStartY = e.clientY;
        wrap.classList.add('cursor-panning');
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 1 && this._isPanning) {
        this._isPanning = false;
        this.canvasWrap.classList.remove('cursor-panning');
        this.renderer.dirty = true;
      }
    });

    // ── Mouse wheel zoom ──
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.viewport.zoomAt(sx, sy, factor);
      this._updateZoomDisplay();
      this.renderer.dirty = true;
    }, { passive: false });

    // ── Touch events ──
    let lastTouchDist = 0;
    let lastTouchMid = null;

    wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        lastTouchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        lastTouchMid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      }
    }, { passive: false });

    wrap.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const newMid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

        if (lastTouchDist > 0) {
          // Pinch zoom
          const rect = this.canvas.getBoundingClientRect();
          const factor = newDist / lastTouchDist;
          this.viewport.zoomAt(newMid.x - rect.left, newMid.y - rect.top, factor);
          this._updateZoomDisplay();
        }
        if (lastTouchMid) {
          // Pan
          this.viewport.pan(newMid.x - lastTouchMid.x, newMid.y - lastTouchMid.y);
        }
        lastTouchDist = newDist;
        lastTouchMid = newMid;
        this.renderer.dirty = true;
      }
    }, { passive: false });

    wrap.addEventListener('touchend', () => {
      lastTouchDist = 0;
      lastTouchMid = null;
    });

    // ── Zoom controls ──
    document.getElementById('zoom-in')?.addEventListener('click', () => {
      this.viewport.zoomAt(this.viewport.width / 2, this.viewport.height / 2, 1.3);
      this._updateZoomDisplay();
      this.renderer.dirty = true;
    });
    document.getElementById('zoom-out')?.addEventListener('click', () => {
      this.viewport.zoomAt(this.viewport.width / 2, this.viewport.height / 2, 1 / 1.3);
      this._updateZoomDisplay();
      this.renderer.dirty = true;
    });
    document.getElementById('zoom-ext')?.addEventListener('click', () => {
      this._zoomExtents();
    });

    // ── Tab bar ──
    document.getElementById('tab-new')?.addEventListener('click', () => {
      this.dialogs.showNewDrawing((opts) => {
        this._tabs.push({ name: opts.name, modified: false });
        this._activeTab = this._tabs.length - 1;
        this.engine.clear();
        if (opts.size) {
          this.engine.limitsMax = { x: opts.size.w, y: opts.size.h };
        }
        if (opts.units) {
          this.engine.units = opts.units;
          this.statusBar.setUnits(opts.units);
        }
        this._renderTabs();
        this._zoomExtents();
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Keyboard Shortcuts
  // ════════════════════════════════════════════════════════════════════════════

  setupKeyboardShortcuts() {
    // Buffer for multi-character shortcuts (e.g., PL, REC)
    let keyBuffer = '';
    let bufferTimer = null;

    document.addEventListener('keydown', (e) => {
      // Don't intercept when typing in command line
      if (this.commandLine.isFocused()) {
        // But still handle Escape
        if (e.key === 'Escape') {
          this.commandRegistry.cancel();
          this.commandLine.inputEl.blur();
          e.preventDefault();
        }
        return;
      }

      // Don't intercept if modal is open
      if (!document.getElementById('modal-overlay').classList.contains('hidden')) return;

      // Build shortcut key string
      const shortcutKey = eventToShortcutKey(e);
      if (!shortcutKey) return;

      // Function keys
      if (/^F\d+$/.test(shortcutKey)) {
        if (this.statusBar.handleFKey(shortcutKey)) {
          e.preventDefault();
          return;
        }
      }

      // Modifier shortcuts (Ctrl+Z, Ctrl+S, etc.)
      if (isModifierShortcut(shortcutKey)) {
        const cmd = SHORTCUTS[shortcutKey];
        if (cmd) {
          e.preventDefault();
          this._executeShortcutCommand(cmd);
          return;
        }
      }

      // Special keys
      if (e.key === 'Escape') {
        e.preventDefault();
        this.commandRegistry.cancel();
        this.selectionManager.deselectAll();
        this.renderer.dirty = true;
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        this.commandRegistry.execute('ERASE');
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (!this.commandRegistry.isActive()) {
          this.commandRegistry.repeatLast();
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.commandRegistry.isActive()) {
          this.commandRegistry.handleInput('');
        } else {
          // Focus command line
          this.commandLine.focus();
        }
        return;
      }

      // Single character (letter/number) — build buffer for multi-char shortcuts
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        keyBuffer += e.key.toUpperCase();
        clearTimeout(bufferTimer);

        // Check if buffer matches a shortcut
        const cmd = SHORTCUTS[keyBuffer];
        if (cmd) {
          this.commandRegistry.execute(cmd);
          keyBuffer = '';
          return;
        }

        // Wait for more characters
        bufferTimer = setTimeout(() => {
          // Try to execute whatever we have
          if (keyBuffer.length > 0) {
            const finalCmd = SHORTCUTS[keyBuffer];
            if (finalCmd) {
              this.commandRegistry.execute(finalCmd);
            } else {
              // Maybe it's a command name directly
              this.commandRegistry.handleInput(keyBuffer);
            }
          }
          keyBuffer = '';
        }, 400);
      }
    });
  }

  _executeShortcutCommand(cmd) {
    switch (cmd) {
      case 'UNDO':
        this.commandRegistry.execute('UNDO');
        break;
      case 'REDO':
        this.commandRegistry.execute('REDO');
        break;
      case 'SAVE':
        this._save();
        break;
      case 'NEW':
        this.dialogs.showNewDrawing((opts) => {
          this._tabs.push({ name: opts.name, modified: false });
          this._activeTab = this._tabs.length - 1;
          this.engine.clear();
          this._renderTabs();
          this._zoomExtents();
        });
        break;
      case 'SELECTALL':
        this.selectionManager.selectAll();
        this.renderer.dirty = true;
        break;
      case 'CANCEL':
        this.commandRegistry.cancel();
        break;
      case 'HELP':
        this.dialogs.showHelp(Object.entries(SHORTCUTS).map(([keys, cmd]) => ({ keys, description: cmd })));
        break;
      case 'OSNAP_TOGGLE': this.statusBar.toggle('OSNAP'); break;
      case 'GRID_TOGGLE':  this.statusBar.toggle('GRID'); break;
      case 'ORTHO_TOGGLE': this.statusBar.toggle('ORTHO'); break;
      case 'SNAP_TOGGLE':  this.statusBar.toggle('SNAP'); break;
      case 'POLAR_TOGGLE': this.statusBar.toggle('POLAR'); break;
      case 'OTRACK_TOGGLE': this.statusBar.toggle('OTRACK'); break;
      case 'DYN_TOGGLE':   this.statusBar.toggle('DYN'); break;
      default:
        // Try to execute as a registered command
        this.commandRegistry.execute(cmd);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Resize
  // ════════════════════════════════════════════════════════════════════════════

  setupResize() {
    const resizeObserver = new ResizeObserver(() => {
      this._resizeCanvas();
      this.renderer.dirty = true;
    });
    resizeObserver.observe(this.canvasWrap);

    window.addEventListener('resize', () => {
      this._resizeCanvas();
      this.renderer.dirty = true;
    });
  }

  _resizeCanvas() {
    const rect = this.canvasWrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.viewport.resize(w, h);
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      this.viewport.ctx.scale(dpr, dpr);
      // Adjust viewport dimensions to CSS pixels for transforms
      this.viewport.width = rect.width;
      this.viewport.height = rect.height;
    }

    // Rulers
    this._resizeRuler('ruler-h', rect.width, 20);
    this._resizeRuler('ruler-v', 20, rect.height);
  }

  _resizeRuler(id, w, h) {
    const el = document.getElementById(id);
    if (!el) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = w * dpr;
    el.height = h * dpr;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    const ctx = el.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Render Loop
  // ════════════════════════════════════════════════════════════════════════════

  renderLoop() {
    this._animFrame = requestAnimationFrame(() => this.renderLoop());

    // Only re-render if dirty
    if (!this.renderer.dirty) return;

    const ctx = this.viewport.ctx;

    // 1. Full render (clears, draws bg, entities, selection highlights)
    this.renderer.render(this.selectionManager);

    // 2. Grid (rendered after bg but renderer already handles this; draw on top for theme)
    this.gridRenderer.render(ctx, this._theme);

    // 3. Command preview (rubber-band)
    const previews = this.commandRegistry.getPreview();
    if (previews && previews.length > 0) {
      this.renderer.drawPreview(ctx, previews);
    }

    // 4. Snap indicator
    if (this.currentSnap) {
      this.snapRenderer.renderSnap(
        ctx,
        this.currentSnap.type,
        this.currentSnap.x,
        this.currentSnap.y
      );
    }

    // 5. Cursor crosshair
    this.cursorRenderer.render(
      ctx,
      this.cursorWorldX,
      this.cursorWorldY,
      this.commandRegistry.isActive() ? {
        command: this.engine.activeCommand,
        basePoint: this.commandRegistry.activeCommand?.firstPoint,
        points: this.commandRegistry.activeCommand?.lastPoint ? [this.commandRegistry.activeCommand.lastPoint] : [],
      } : null,
      this._theme
    );

    // 6. Rulers
    this._renderRulers();

    // 7. Minimap
    this._renderMinimap();

    // 8. Zoom display
    this._updateZoomDisplay();

    this.renderer.dirty = false;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Rulers
  // ════════════════════════════════════════════════════════════════════════════

  _renderRulers() {
    this._renderHorizontalRuler();
    this._renderVerticalRuler();
  }

  _renderHorizontalRuler() {
    const el = document.getElementById('ruler-h');
    if (!el) return;
    const ctx = el.getContext('2d');
    const w = parseFloat(el.style.width);
    const h = 20;

    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--cad-ruler-bg').trim() || '#0e1014';
    const textColor = style.getPropertyValue('--cad-ruler-text').trim() || '#555';
    const tickColor = style.getPropertyValue('--cad-ruler-tick').trim() || '#333';

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Determine tick spacing
    const vp = this.viewport;
    let spacing = 10;
    while (vp.worldToScreenDist(spacing) < 50) spacing *= 2;
    while (vp.worldToScreenDist(spacing) > 200) spacing /= 2;

    const bounds = vp.getVisibleBounds();
    const startX = Math.floor(bounds.minX / spacing) * spacing;
    const endX = Math.ceil(bounds.maxX / spacing) * spacing;

    ctx.strokeStyle = tickColor;
    ctx.fillStyle = textColor;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';

    for (let wx = startX; wx <= endX; wx += spacing) {
      const sx = vp.worldToScreen(wx, 0).x;
      if (sx < 0 || sx > w) continue;

      ctx.beginPath();
      ctx.moveTo(sx, h);
      ctx.lineTo(sx, h - 8);
      ctx.stroke();

      ctx.fillText(wx.toFixed(0), sx, h - 9);

      // Minor ticks
      const minor = spacing / 5;
      for (let i = 1; i < 5; i++) {
        const msx = vp.worldToScreen(wx + minor * i, 0).x;
        if (msx >= 0 && msx <= w) {
          ctx.beginPath();
          ctx.moveTo(msx, h);
          ctx.lineTo(msx, h - 4);
          ctx.stroke();
        }
      }
    }
  }

  _renderVerticalRuler() {
    const el = document.getElementById('ruler-v');
    if (!el) return;
    const ctx = el.getContext('2d');
    const w = 20;
    const h = parseFloat(el.style.height);

    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--cad-ruler-bg').trim() || '#0e1014';
    const textColor = style.getPropertyValue('--cad-ruler-text').trim() || '#555';
    const tickColor = style.getPropertyValue('--cad-ruler-tick').trim() || '#333';

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const vp = this.viewport;
    let spacing = 10;
    while (vp.worldToScreenDist(spacing) < 50) spacing *= 2;
    while (vp.worldToScreenDist(spacing) > 200) spacing /= 2;

    const bounds = vp.getVisibleBounds();
    const startY = Math.floor(bounds.minY / spacing) * spacing;
    const endY = Math.ceil(bounds.maxY / spacing) * spacing;

    ctx.strokeStyle = tickColor;
    ctx.fillStyle = textColor;
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';

    for (let wy = startY; wy <= endY; wy += spacing) {
      const sy = vp.worldToScreen(0, wy).y;
      if (sy < 0 || sy > h) continue;

      ctx.beginPath();
      ctx.moveTo(w, sy);
      ctx.lineTo(w - 8, sy);
      ctx.stroke();

      ctx.save();
      ctx.translate(w - 10, sy);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(wy.toFixed(0), 0, 0);
      ctx.restore();

      const minor = spacing / 5;
      for (let i = 1; i < 5; i++) {
        const msy = vp.worldToScreen(0, wy + minor * i).y;
        if (msy >= 0 && msy <= h) {
          ctx.beginPath();
          ctx.moveTo(w, msy);
          ctx.lineTo(w - 4, msy);
          ctx.stroke();
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Minimap
  // ════════════════════════════════════════════════════════════════════════════

  _renderMinimap() {
    const el = document.getElementById('minimap');
    if (!el) return;
    const ctx = el.getContext('2d');
    const w = 160, h = 120;

    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--cad-panel').trim() || '#16213e';

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Draw limits outline
    const lx = this.engine.limitsMax.x;
    const ly = this.engine.limitsMax.y;
    const scale = Math.min((w - 10) / lx, (h - 10) / ly);
    const ox = (w - lx * scale) / 2;
    const oy = (h - ly * scale) / 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, lx * scale, ly * scale);

    // Draw entities as dots
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (const entity of this.engine.entities.values()) {
      if (!entity.visible) continue;
      if (typeof entity.getBounds === 'function') {
        const b = entity.getBounds();
        const mx = ox + ((b.minX + b.maxX) / 2) * scale;
        const my = oy + ly * scale - ((b.minY + b.maxY) / 2) * scale;
        ctx.fillRect(mx - 1, my - 1, 2, 2);
      }
    }

    // Draw viewport rect
    const vis = this.viewport.getVisibleBounds();
    const vx1 = ox + Math.max(0, vis.minX) * scale;
    const vy1 = oy + ly * scale - Math.min(ly, vis.maxY) * scale;
    const vx2 = ox + Math.min(lx, vis.maxX) * scale;
    const vy2 = oy + ly * scale - Math.max(0, vis.minY) * scale;

    ctx.strokeStyle = 'rgba(0,122,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vx1, vy1, vx2 - vx1, vy2 - vy1);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Snap Helper
  // ════════════════════════════════════════════════════════════════════════════

  _trySnap(wx, wy) {
    // Grid snap
    if (this.statusBar.isOn('SNAP')) {
      const snapSpacing = this.gridRenderer.minorSpacing || 10;
      wx = Math.round(wx / snapSpacing) * snapSpacing;
      wy = Math.round(wy / snapSpacing) * snapSpacing;
    }

    // Object snap
    if (this.statusBar.isOn('OSNAP') && this.snapEngine) {
      const tolerance = this.viewport.screenToWorldDist(10);
      const snap = this.snapEngine.findSnap(wx, wy, tolerance);
      if (snap) {
        return { x: snap.x, y: snap.y, snap };
      }
    }

    // Ortho constraint
    if (this.statusBar.isOn('ORTHO') && this.commandRegistry.activeCommand?.lastPoint) {
      const last = this.commandRegistry.activeCommand.lastPoint;
      const dx = Math.abs(wx - last.x);
      const dy = Math.abs(wy - last.y);
      if (dx > dy) {
        wy = last.y;
      } else {
        wx = last.x;
      }
    }

    return { x: wx, y: wy, snap: null };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Utilities
  // ════════════════════════════════════════════════════════════════════════════

  _updateZoomDisplay() {
    const pct = Math.round(this.viewport.zoom * 100);
    const el = document.getElementById('zoom-pct');
    if (el) el.textContent = pct + '%';
  }

  _zoomExtents() {
    const extents = this.engine.getExtents();
    if (extents) {
      this.viewport.zoomExtents(extents);
    } else {
      this.viewport.zoomExtents({
        minX: 0, minY: 0,
        maxX: this.engine.limitsMax.x,
        maxY: this.engine.limitsMax.y,
      });
    }
    this._updateZoomDisplay();
    this.renderer.dirty = true;
  }

  _save() {
    try {
      const data = this.engine.serialize();
      const json = JSON.stringify(data);
      localStorage.setItem('afrodraft-drawing', json);
      this.engine.markSaved();
      if (this._tabs[this._activeTab]) {
        this._tabs[this._activeTab].modified = false;
        this._renderTabs();
      }
      this._showToast('Drawing saved', 'success');
    } catch (e) {
      console.error('Save error:', e);
      this._showToast('Save failed: ' + e.message, 'error');
    }
  }

  _showToast(message, type = '') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = type;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, 3000);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Tab Bar
  // ════════════════════════════════════════════════════════════════════════════

  _renderTabs() {
    const list = document.getElementById('tab-list');
    if (!list) return;
    list.innerHTML = '';

    this._tabs.forEach((tab, i) => {
      const el = document.createElement('div');
      el.className = 'tab' + (i === this._activeTab ? ' active' : '') + (tab.modified ? ' modified' : '');

      el.innerHTML = `
        <span class="tab-modified"></span>
        <span class="tab-name">${tab.name}</span>
        <button class="tab-close" data-idx="${i}">&times;</button>
      `;

      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) return;
        this._activeTab = i;
        this._renderTabs();
      });

      const closeBtn = el.querySelector('.tab-close');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._tabs.length <= 1) return; // Keep at least one tab
        this._tabs.splice(i, 1);
        if (this._activeTab >= this._tabs.length) this._activeTab = this._tabs.length - 1;
        this._renderTabs();
      });

      list.appendChild(el);
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Boot
// ════════════════════════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AfroDraftApp();
});
