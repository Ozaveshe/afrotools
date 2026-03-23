import { Engine } from "./src/core/Engine.js";
import { Viewport } from "./src/render/Viewport.js";
import { Renderer } from "./src/render/Renderer.js";
import { GridRenderer } from "./src/render/GridRenderer.js";
import { SnapRenderer } from "./src/render/SnapRenderer.js";
import { CursorRenderer } from "./src/render/CursorRenderer.js";
import { SelectionManager } from "./src/core/SelectionManager.js";
import { SnapEngine } from "./src/core/SnapEngine.js";
import { UndoManager } from "./src/core/UndoManager.js";
import { LayerManager } from "./src/core/LayerManager.js";
import { StyleManager } from "./src/core/StyleManager.js";
import { BlockManager } from "./src/core/BlockManager.js";
import { CommandRegistry } from "./src/commands/CommandRegistry.js";
import { registerDrawCommands } from "./src/commands/DrawCommands.js";
import { registerModifyCommands } from "./src/commands/ModifyCommands.js";
import { registerAnnotateCommands } from "./src/commands/AnnotateCommands.js";
import { registerInquiryCommands } from "./src/commands/InquiryCommands.js";
import { Ribbon } from "./src/ui/Ribbon.js";
import { StatusBar } from "./src/ui/StatusBar.js";
import { CommandLine } from "./src/ui/CommandLine.js";
import { PropertiesPanel } from "./src/ui/PropertiesPanel.js";
import { LayerPanel } from "./src/ui/LayerPanel.js";
import { ContextMenu } from "./src/ui/ContextMenu.js";
import { Dialogs } from "./src/ui/Dialogs.js";
import { SHORTCUTS, isModifierShortcut, eventToShortcutKey } from "./src/data/shortcuts.js";

class AfroDraftApp {
  constructor() {
    // Core engine
    this.engine = new Engine({ units: "mm", precision: 4 });
    this.undoManager = new UndoManager(this.engine);
    this.engine.undoManager = this.undoManager;
    this.layerManager = new LayerManager(this.engine);
    this.engine.layerManager = this.layerManager;
    this.styleManager = new StyleManager(this.engine);
    this.engine.styleManager = this.styleManager;
    this.blockManager = new BlockManager(this.engine);
    this.engine.blockManager = this.blockManager;

    // Canvas + viewport
    this.canvas = document.getElementById("cad-canvas");
    this.canvasWrap = document.getElementById("canvas-wrap");
    this.viewport = new Viewport(this.canvas);

    // Renderers
    this.renderer = new Renderer(this.viewport, this.engine);
    this.gridRenderer = new GridRenderer(this.viewport);
    this.snapRenderer = new SnapRenderer(this.viewport);
    this.cursorRenderer = new CursorRenderer(this.viewport);

    // Selection + Snap
    this.selectionManager = new SelectionManager(this.engine);
    this.snapEngine = new SnapEngine(this.engine);

    // Commands
    this.commandRegistry = new CommandRegistry(this.engine);
    registerDrawCommands(this.commandRegistry);
    registerModifyCommands(this.commandRegistry);
    registerAnnotateCommands(this.commandRegistry);
    registerInquiryCommands(this.commandRegistry);

    // Register additional utility commands
    this._registerUtilityCommands();

    // UI
    this.ribbon = new Ribbon(this.commandRegistry);
    this.statusBar = new StatusBar(this.snapEngine, this.gridRenderer);
    this.commandLine = new CommandLine(this.commandRegistry);
    this.propertiesPanel = new PropertiesPanel(this.engine, this.selectionManager);
    this.layerPanel = new LayerPanel(this.engine);
    this.contextMenu = new ContextMenu(this.commandRegistry, this.selectionManager);
    this.dialogs = new Dialogs(this.engine, this.viewport);

    // State
    this.cursorWorldX = 0;
    this.cursorWorldY = 0;
    this.currentSnap = null;
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._selectionStart = null;
    this._theme = "dark";
    this._customBg = null;
    this._tabs = [{ name: "Untitled-1", modified: false }];
    this._activeTab = 0;
    this._autosaveInterval = null;

    // Build UI
    this._renderTabs();
    this._buildToolbar();
    this.setupCanvasEvents();
    this.setupKeyboardShortcuts();
    this.setupResize();
    this._resizeCanvas();

    // Initial view
    this.viewport.zoomExtents({
      minX: -10, minY: -10,
      maxX: this.engine.limitsMax.x + 10,
      maxY: this.engine.limitsMax.y + 10
    });

    // Start render loop
    this._animFrame = null;
    this.renderLoop();
    this.statusBar.setUnits(this.engine.units);

    // Load autosaved drawing if exists
    this._loadAutosave();

    // Start autosave timer (every 60s)
    this._autosaveInterval = setInterval(() => this._autosave(), 60000);

    // Dismiss loading
    setTimeout(() => {
      document.getElementById("loading").classList.add("hidden");
    }, 400);

    console.log("AfroDraft v6.1 initialized");
  }

  /* ─── Additional Toolbar Buttons ─── */
  _buildToolbar() {
    const ribbon = document.getElementById("ribbon");
    if (!ribbon) return;

    // Add a "File" group at the beginning
    const fileGroup = document.createElement("div");
    fileGroup.className = "ribbon-group";
    fileGroup.innerHTML = `
      <div class="ribbon-group-tools">
        <button class="ribbon-btn" id="btn-new" title="New Drawing (Ctrl+N)">
          <svg width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" stroke-width="0.8"/><line x1="5" y1="7.5" x2="11" y2="7.5" stroke="currentColor" stroke-width="0.8"/></svg>
        </button>
        <button class="ribbon-btn" id="btn-open" title="Open Drawing (Ctrl+O)">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 4h4l1.5-2H14v10H2z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>
        <button class="ribbon-btn" id="btn-save" title="Save Drawing (Ctrl+S)">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 2h8l3 3v9H3z" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="5" y="2" width="5" height="4" fill="none" stroke="currentColor" stroke-width="0.8"/><rect x="5" y="9" width="6" height="4" rx="0.5" fill="none" stroke="currentColor" stroke-width="0.8"/></svg>
        </button>
        <button class="ribbon-btn" id="btn-saveas" title="Save As JSON">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 2h8l3 3v9H3z" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="8" y1="7" x2="8" y2="13" stroke="currentColor" stroke-width="1"/><polyline points="5.5,10 8,13 10.5,10" fill="none" stroke="currentColor" stroke-width="1"/></svg>
        </button>
        <button class="ribbon-btn" id="btn-export-svg" title="Export SVG (Ctrl+E)">
          <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><text x="8" y="10.5" text-anchor="middle" font-size="5" fill="currentColor" font-weight="600">SVG</text></svg>
        </button>
        <button class="ribbon-btn" id="btn-export-png" title="Export PNG (Ctrl+Shift+I)">
          <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><text x="8" y="10.5" text-anchor="middle" font-size="5" fill="currentColor" font-weight="600">PNG</text></svg>
        </button>
      </div>
      <div class="ribbon-group-label">File</div>
    `;
    ribbon.insertBefore(fileGroup, ribbon.firstChild);

    // Add a "Settings" group at the end
    const settingsGroup = document.createElement("div");
    settingsGroup.className = "ribbon-group";
    settingsGroup.innerHTML = `
      <div class="ribbon-group-tools">
        <button class="ribbon-btn" id="btn-settings" title="Settings">
          <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" stroke="currentColor" stroke-width="1"/></svg>
        </button>
        <button class="ribbon-btn" id="btn-bg-color" title="Background Color">
          <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="4" y="8" width="8" height="4" rx="1" fill="currentColor" opacity="0.4"/></svg>
        </button>
        <button class="ribbon-btn" id="btn-theme" title="Change Theme">
          <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 3a5 5 0 0 1 0 10z" fill="currentColor" opacity="0.5"/></svg>
        </button>
        <button class="ribbon-btn" id="btn-help" title="Help (F1)">
          <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><text x="8" y="11" text-anchor="middle" font-size="9" fill="currentColor" font-weight="700">?</text></svg>
        </button>
        <button class="ribbon-btn" id="btn-about" title="About AfroDraft">
          <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><text x="8" y="11" text-anchor="middle" font-size="9" fill="currentColor" font-weight="700">i</text></svg>
        </button>
      </div>
      <div class="ribbon-group-label">Settings</div>
    `;
    ribbon.appendChild(settingsGroup);

    // Wire up file buttons
    document.getElementById("btn-new")?.addEventListener("click", () => {
      this.dialogs.showNewDrawing(cfg => {
        this._tabs.push({ name: cfg.name, modified: false });
        this._activeTab = this._tabs.length - 1;
        this.engine.clear();
        if (cfg.size) this.engine.limitsMax = { x: cfg.size.w, y: cfg.size.h };
        if (cfg.units) { this.engine.units = cfg.units; this.statusBar.setUnits(cfg.units); }
        this._renderTabs();
        this._zoomExtents();
      });
    });

    document.getElementById("btn-open")?.addEventListener("click", () => this._openFile());
    document.getElementById("btn-save")?.addEventListener("click", () => this._save());
    document.getElementById("btn-saveas")?.addEventListener("click", () => this._saveAsFile());
    document.getElementById("btn-export-svg")?.addEventListener("click", () => this._exportSVG());
    document.getElementById("btn-export-png")?.addEventListener("click", () => this._exportPNG());
    document.getElementById("btn-settings")?.addEventListener("click", () => this.dialogs.showSettings());
    document.getElementById("btn-bg-color")?.addEventListener("click", () => this._showBackgroundColorPicker());
    document.getElementById("btn-theme")?.addEventListener("click", () => this._showThemePicker());
    document.getElementById("btn-help")?.addEventListener("click", () => {
      this.dialogs.showHelp(Object.entries(SHORTCUTS).map(([k, v]) => ({ keys: k, description: v })));
    });
    document.getElementById("btn-about")?.addEventListener("click", () => this.dialogs.showAbout());
  }

  /* ─── Register Utility Commands ─── */
  _registerUtilityCommands() {
    const self = this;

    // Create simple command classes for utility commands
    class EraseCommand {
      constructor(engine, registry) {
        this.engine = engine;
        this.registry = registry;
        this.lastPoint = null;
        this.firstPoint = null;
        this._mouseX = 0;
        this._mouseY = 0;
      }
      start() {
        const sel = self.selectionManager?.getSelectedIds?.() || [];
        if (sel.length > 0) {
          for (const id of sel) {
            const ent = this.engine.getEntity(id);
            if (ent) {
              self.undoManager?.recordRemove?.(ent);
              this.engine.removeEntity(id);
            }
          }
          self.selectionManager.deselectAll();
          self.renderer.dirty = true;
          this.registry.emit("output", `${sel.length} object(s) erased`);
          this.finish();
          return;
        }
        this.registry.emit("prompt", "Select objects to erase:");
      }
      onClick(x, y) {
        const pick = this.engine.pickEntity(x, y, self.viewport.screenToWorldDist(8));
        if (pick) {
          self.undoManager?.recordRemove?.(pick.entity);
          this.engine.removeEntity(pick.entity.id);
          self.renderer.dirty = true;
          this.registry.emit("output", "1 object erased");
        }
      }
      onInput(t) {
        if (t === "") this.finish();
      }
      onMouseMove(x, y) { this._mouseX = x; this._mouseY = y; }
      onKey(k) { if (k === "Escape") this.cancel(); }
      getPreview() { return []; }
      getPrompt() { return "Select objects to erase:"; }
      finish() { this.registry.emit("prompt", ""); this.registry.deactivate(); }
      cancel() { this.registry.emit("prompt", ""); this.registry.deactivate(); }
    }

    class UndoCommand {
      constructor(engine, registry) { this.engine = engine; this.registry = registry; }
      start() { self.undoManager?.undo?.(); self.renderer.dirty = true; this.finish(); }
      onClick() {} onInput() {} onMouseMove() {} onKey() {}
      getPreview() { return []; } getPrompt() { return ""; }
      finish() { this.registry.emit("prompt", ""); this.registry.deactivate(); }
      cancel() { this.finish(); }
    }

    class RedoCommand {
      constructor(engine, registry) { this.engine = engine; this.registry = registry; }
      start() { self.undoManager?.redo?.(); self.renderer.dirty = true; this.finish(); }
      onClick() {} onInput() {} onMouseMove() {} onKey() {}
      getPreview() { return []; } getPrompt() { return ""; }
      finish() { this.registry.emit("prompt", ""); this.registry.deactivate(); }
      cancel() { this.finish(); }
    }

    // Only register if not already registered
    if (!this.commandRegistry.commands.has("ERASE")) {
      this.commandRegistry.register("ERASE", ["DEL", "DELETE"], EraseCommand);
    }
    if (!this.commandRegistry.commands.has("UNDO")) {
      this.commandRegistry.register("UNDO", [], UndoCommand);
    }
    if (!this.commandRegistry.commands.has("REDO")) {
      this.commandRegistry.register("REDO", [], RedoCommand);
    }
  }

  /* ─── Canvas Events ─── */
  setupCanvasEvents() {
    const wrap = this.canvasWrap;

    wrap.addEventListener("mousemove", e => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = this.viewport.screenToWorld(sx, sy);
      const snapped = this._trySnap(world.x, world.y);

      this.cursorWorldX = snapped.x;
      this.cursorWorldY = snapped.y;
      this.currentSnap = snapped.snap;

      this.statusBar.updateCoords(this.cursorWorldX, this.cursorWorldY, this.engine.precision);
      this.commandRegistry.handleMouseMove(this.cursorWorldX, this.cursorWorldY);

      if (this._isPanning) {
        const dx = e.clientX - this._panStartX;
        const dy = e.clientY - this._panStartY;
        this.viewport.pan(dx, dy);
        this._panStartX = e.clientX;
        this._panStartY = e.clientY;
      }
      this.renderer.dirty = true;
    });

    wrap.addEventListener("click", e => {
      if (this._isPanning) return;
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = this.viewport.screenToWorld(sx, sy);
      const snapped = this._trySnap(world.x, world.y);

      if (this.commandRegistry.isActive()) {
        this.commandRegistry.handleClick(snapped.x, snapped.y);
      } else {
        this.selectionManager.selectAt(snapped.x, snapped.y, e.shiftKey);
      }
      this.renderer.dirty = true;
    });

    wrap.addEventListener("dblclick", e => {
      // Double-click to zoom extents
      if (!this.commandRegistry.isActive()) {
        this._zoomExtents();
      }
    });

    wrap.addEventListener("contextmenu", e => {
      e.preventDefault();
      this.contextMenu.show(e.clientX, e.clientY);
    });

    // Middle-mouse panning
    wrap.addEventListener("mousedown", e => {
      if (e.button === 1) {
        e.preventDefault();
        this._isPanning = true;
        this._panStartX = e.clientX;
        this._panStartY = e.clientY;
        wrap.classList.add("cursor-panning");
      }
    });

    window.addEventListener("mouseup", e => {
      if (e.button === 1 && this._isPanning) {
        this._isPanning = false;
        this.canvasWrap.classList.remove("cursor-panning");
        this.renderer.dirty = true;
      }
    });

    // Scroll wheel zoom
    wrap.addEventListener("wheel", e => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.viewport.zoomAt(sx, sy, factor);
      this._updateZoomDisplay();
      this.renderer.dirty = true;
    }, { passive: false });

    // Touch pinch-zoom
    let pinchDist = 0, pinchCenter = null;
    wrap.addEventListener("touchstart", e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        pinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      }
    }, { passive: false });

    wrap.addEventListener("touchmove", e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const newCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        if (pinchDist > 0) {
          const rect = this.canvas.getBoundingClientRect();
          const scale = newDist / pinchDist;
          this.viewport.zoomAt(newCenter.x - rect.left, newCenter.y - rect.top, scale);
          this._updateZoomDisplay();
        }
        if (pinchCenter) {
          this.viewport.pan(newCenter.x - pinchCenter.x, newCenter.y - pinchCenter.y);
        }
        pinchDist = newDist;
        pinchCenter = newCenter;
        this.renderer.dirty = true;
      }
    }, { passive: false });

    wrap.addEventListener("touchend", () => { pinchDist = 0; pinchCenter = null; });

    // Zoom buttons
    document.getElementById("zoom-in")?.addEventListener("click", () => {
      this.viewport.zoomAt(this.viewport.width / 2, this.viewport.height / 2, 1.3);
      this._updateZoomDisplay();
      this.renderer.dirty = true;
    });
    document.getElementById("zoom-out")?.addEventListener("click", () => {
      this.viewport.zoomAt(this.viewport.width / 2, this.viewport.height / 2, 1 / 1.3);
      this._updateZoomDisplay();
      this.renderer.dirty = true;
    });
    document.getElementById("zoom-ext")?.addEventListener("click", () => this._zoomExtents());

    // New tab button
    document.getElementById("tab-new")?.addEventListener("click", () => {
      this.dialogs.showNewDrawing(cfg => {
        this._tabs.push({ name: cfg.name, modified: false });
        this._activeTab = this._tabs.length - 1;
        this.engine.clear();
        if (cfg.size) this.engine.limitsMax = { x: cfg.size.w, y: cfg.size.h };
        if (cfg.units) { this.engine.units = cfg.units; this.statusBar.setUnits(cfg.units); }
        this._renderTabs();
        this._zoomExtents();
      });
    });
  }

  /* ─── Keyboard Shortcuts ─── */
  setupKeyboardShortcuts() {
    let accum = "";
    let accumTimer = null;

    document.addEventListener("keydown", e => {
      // If command line is focused, only intercept Escape
      if (this.commandLine.isFocused()) {
        if (e.key === "Escape") {
          this.commandRegistry.cancel();
          this.commandLine.inputEl.blur();
          e.preventDefault();
        }
        return;
      }

      // Don't handle keys when modal is open
      if (!document.getElementById("modal-overlay").classList.contains("hidden")) return;

      const key = eventToShortcutKey(e);
      if (!key) return;

      // F-keys for status bar toggles
      if (/^F\d+$/.test(key) && this.statusBar.handleFKey(key)) {
        e.preventDefault();
        return;
      }

      // Modifier shortcuts (Ctrl+Z, etc.)
      if (isModifierShortcut(key)) {
        const cmd = SHORTCUTS[key];
        if (cmd) {
          e.preventDefault();
          this._executeShortcutCommand(cmd);
          return;
        }
      }

      // Escape
      if (e.key === "Escape") {
        e.preventDefault();
        this.commandRegistry.cancel();
        this.selectionManager.deselectAll();
        this.renderer.dirty = true;
        return;
      }

      // Delete
      if (e.key === "Delete") {
        e.preventDefault();
        this.commandRegistry.execute("ERASE");
        return;
      }

      // Space to repeat last command
      if (e.key === " ") {
        e.preventDefault();
        if (!this.commandRegistry.isActive()) {
          this.commandRegistry.repeatLast();
        }
        return;
      }

      // Enter
      if (e.key === "Enter") {
        e.preventDefault();
        if (this.commandRegistry.isActive()) {
          this.commandRegistry.handleInput("");
        } else {
          this.commandLine.focus();
        }
        return;
      }

      // Single character accumulation for multi-key shortcuts
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        accum += e.key.toUpperCase();
        clearTimeout(accumTimer);

        const cmd = SHORTCUTS[accum];
        if (cmd) {
          this.commandRegistry.execute(cmd);
          accum = "";
          return;
        }

        accumTimer = setTimeout(() => {
          if (accum.length > 0) {
            const cmd = SHORTCUTS[accum];
            if (cmd) {
              this.commandRegistry.execute(cmd);
            } else {
              this.commandRegistry.handleInput(accum);
            }
          }
          accum = "";
        }, 400);
      }
    });
  }

  _executeShortcutCommand(cmd) {
    switch (cmd) {
      case "UNDO": this.commandRegistry.execute("UNDO"); break;
      case "REDO": this.commandRegistry.execute("REDO"); break;
      case "SAVE": this._save(); break;
      case "SAVEAS": this._saveAsFile(); break;
      case "OPEN": this._openFile(); break;
      case "NEW":
        this.dialogs.showNewDrawing(cfg => {
          this._tabs.push({ name: cfg.name, modified: false });
          this._activeTab = this._tabs.length - 1;
          this.engine.clear();
          this._renderTabs();
          this._zoomExtents();
        });
        break;
      case "SELECTALL":
        this.selectionManager.selectAll();
        this.renderer.dirty = true;
        break;
      case "CANCEL": this.commandRegistry.cancel(); break;
      case "HELP":
        this.dialogs.showHelp(Object.entries(SHORTCUTS).map(([k, v]) => ({ keys: k, description: v })));
        break;
      case "DXFEXPORT": this._exportDXF(); break;
      case "SVGEXPORT": this._exportSVG(); break;
      case "PDFEXPORT": this._exportPDF(); break;
      case "IMGEXPORT": this._exportPNG(); break;
      case "OSNAP_TOGGLE": this.statusBar.toggle("OSNAP"); break;
      case "GRID_TOGGLE": this.statusBar.toggle("GRID"); break;
      case "ORTHO_TOGGLE": this.statusBar.toggle("ORTHO"); break;
      case "SNAP_TOGGLE": this.statusBar.toggle("SNAP"); break;
      case "POLAR_TOGGLE": this.statusBar.toggle("POLAR"); break;
      case "OTRACK_TOGGLE": this.statusBar.toggle("OTRACK"); break;
      case "DYN_TOGGLE": this.statusBar.toggle("DYN"); break;
      default: this.commandRegistry.execute(cmd);
    }
  }

  /* ─── Resize ─── */
  setupResize() {
    new ResizeObserver(() => {
      this._resizeCanvas();
      this.renderer.dirty = true;
    }).observe(this.canvasWrap);
    window.addEventListener("resize", () => {
      this._resizeCanvas();
      this.renderer.dirty = true;
    });
  }

  _resizeCanvas() {
    const rect = this.canvasWrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.floor(rect.width * dpr);
    const ph = Math.floor(rect.height * dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.viewport.resize(pw, ph);
      this.canvas.style.width = rect.width + "px";
      this.canvas.style.height = rect.height + "px";
      this.viewport.ctx.scale(dpr, dpr);
      this.viewport.width = rect.width;
      this.viewport.height = rect.height;
    }
    this._resizeRuler("ruler-h", rect.width, 20);
    this._resizeRuler("ruler-v", 20, rect.height);
  }

  _resizeRuler(id, w, h) {
    const el = document.getElementById(id);
    if (!el) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = w * dpr;
    el.height = h * dpr;
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.getContext("2d").scale(dpr, dpr);
  }

  /* ─── Render Loop (FIXED ORDER: bg → grid → entities → preview → snap → cursor) ─── */
  renderLoop() {
    this._animFrame = requestAnimationFrame(() => this.renderLoop());
    if (!this.renderer.dirty) return;

    const ctx = this.viewport.ctx;

    // 1. Clear + draw background
    ctx.save();
    ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
    this.renderer.drawBackground(ctx);

    // 2. Draw grid BEFORE entities (was incorrectly after)
    this.gridRenderer.render(ctx, this._theme);

    // 3. Draw entities + grips
    const entities = this.engine.entities;
    for (const [id, ent] of entities) {
      if (!ent.visible) continue;
      const layer = this.engine.layerManager?.getLayer(ent.layer) || this.engine.layers?.[ent.layer] || null;
      if (layer && (!layer.visible || layer.frozen)) continue;
      const selected = this.selectionManager?.isSelected(id) ?? false;
      this.renderer.drawEntity(ctx, ent, selected, layer);
    }

    // Draw grips for selected entities
    const selIds = this.selectionManager?.getSelectedIds?.() ?? [];
    for (const id of selIds) {
      const ent = entities.get(id);
      if (ent) this.renderer.drawGrips(ctx, ent);
    }

    // 4. Draw command preview
    const preview = this.commandRegistry.getPreview();
    if (preview && preview.length > 0) {
      this.renderer.drawPreview(ctx, preview);
    }

    // 5. Draw snap indicator
    if (this.currentSnap) {
      this.snapRenderer.renderSnap(ctx, this.currentSnap.type, this.currentSnap.x, this.currentSnap.y);
    }

    // 6. Draw cursor crosshair
    this.cursorRenderer.render(ctx, this.cursorWorldX, this.cursorWorldY,
      this.commandRegistry.isActive() ? {
        command: this.engine.activeCommand,
        basePoint: this.commandRegistry.activeCommand?.firstPoint,
        points: this.commandRegistry.activeCommand?.lastPoint
          ? [this.commandRegistry.activeCommand.lastPoint] : []
      } : null,
      this._theme
    );

    ctx.restore();

    // 7. Rulers + minimap
    this._renderRulers();
    this._renderMinimap();
    this._updateZoomDisplay();

    this.renderer.dirty = false;
  }

  /* ─── Rulers ─── */
  _renderRulers() {
    this._renderHorizontalRuler();
    this._renderVerticalRuler();
  }

  _renderHorizontalRuler() {
    const el = document.getElementById("ruler-h");
    if (!el) return;
    const ctx = el.getContext("2d");
    const w = parseFloat(el.style.width);
    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue("--cad-ruler-bg").trim() || "#0e1014";
    const textC = css.getPropertyValue("--cad-ruler-text").trim() || "#555";
    const tickC = css.getPropertyValue("--cad-ruler-tick").trim() || "#333";

    ctx.clearRect(0, 0, w, 20);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, 20);

    const vp = this.viewport;
    let spacing = 10;
    while (vp.worldToScreenDist(spacing) < 50) spacing *= 2;
    while (vp.worldToScreenDist(spacing) > 200) spacing /= 2;

    const bounds = vp.getVisibleBounds();
    const start = Math.floor(bounds.minX / spacing) * spacing;
    const end = Math.ceil(bounds.maxX / spacing) * spacing;

    ctx.strokeStyle = tickC;
    ctx.fillStyle = textC;
    ctx.font = "9px monospace";
    ctx.textAlign = "center";

    for (let v = start; v <= end; v += spacing) {
      const x = vp.worldToScreen(v, 0).x;
      if (x < 0 || x > w) continue;
      ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, 12); ctx.stroke();
      ctx.fillText(v.toFixed(0), x, 11);
      const minor = spacing / 5;
      for (let j = 1; j < 5; j++) {
        const mx = vp.worldToScreen(v + minor * j, 0).x;
        if (mx >= 0 && mx <= w) {
          ctx.beginPath(); ctx.moveTo(mx, 20); ctx.lineTo(mx, 16); ctx.stroke();
        }
      }
    }
  }

  _renderVerticalRuler() {
    const el = document.getElementById("ruler-v");
    if (!el) return;
    const ctx = el.getContext("2d");
    const h = parseFloat(el.style.height);
    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue("--cad-ruler-bg").trim() || "#0e1014";
    const textC = css.getPropertyValue("--cad-ruler-text").trim() || "#555";
    const tickC = css.getPropertyValue("--cad-ruler-tick").trim() || "#333";

    ctx.clearRect(0, 0, 20, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 20, h);

    const vp = this.viewport;
    let spacing = 10;
    while (vp.worldToScreenDist(spacing) < 50) spacing *= 2;
    while (vp.worldToScreenDist(spacing) > 200) spacing /= 2;

    const bounds = vp.getVisibleBounds();
    const start = Math.floor(bounds.minY / spacing) * spacing;
    const end = Math.ceil(bounds.maxY / spacing) * spacing;

    ctx.strokeStyle = tickC;
    ctx.fillStyle = textC;
    ctx.font = "9px monospace";
    ctx.textAlign = "right";

    for (let v = start; v <= end; v += spacing) {
      const y = vp.worldToScreen(0, v).y;
      if (y < 0 || y > h) continue;
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(12, y); ctx.stroke();
      ctx.save();
      ctx.translate(10, y);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(v.toFixed(0), 0, 0);
      ctx.restore();
      const minor = spacing / 5;
      for (let j = 1; j < 5; j++) {
        const my = vp.worldToScreen(0, v + minor * j).y;
        if (my >= 0 && my <= h) {
          ctx.beginPath(); ctx.moveTo(20, my); ctx.lineTo(16, my); ctx.stroke();
        }
      }
    }
  }

  /* ─── Minimap ─── */
  _renderMinimap() {
    const el = document.getElementById("minimap");
    if (!el) return;
    const ctx = el.getContext("2d");
    const panelBg = getComputedStyle(document.documentElement).getPropertyValue("--cad-panel").trim() || "#16213e";

    ctx.clearRect(0, 0, 160, 120);
    ctx.fillStyle = panelBg;
    ctx.fillRect(0, 0, 160, 120);

    const lx = this.engine.limitsMax.x;
    const ly = this.engine.limitsMax.y;
    const scale = Math.min(150 / lx, 110 / ly);
    const ox = (160 - lx * scale) / 2;
    const oy = (120 - ly * scale) / 2;

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, lx * scale, ly * scale);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (const ent of this.engine.entities.values()) {
      if (ent.visible && typeof ent.getBounds === "function") {
        const b = ent.getBounds();
        const cx = ox + (b.minX + b.maxX) / 2 * scale;
        const cy = oy + ly * scale - (b.minY + b.maxY) / 2 * scale;
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
      }
    }

    const vis = this.viewport.getVisibleBounds();
    const vx1 = ox + Math.max(0, vis.minX) * scale;
    const vy1 = oy + ly * scale - Math.min(ly, vis.maxY) * scale;
    const vx2 = ox + Math.min(lx, vis.maxX) * scale;
    const vy2 = oy + ly * scale - Math.max(0, vis.minY) * scale;

    ctx.strokeStyle = "rgba(0,122,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vx1, vy1, vx2 - vx1, vy2 - vy1);
  }

  /* ─── Snap ─── */
  _trySnap(x, y) {
    if (this.statusBar.isOn("SNAP")) {
      const sp = this.gridRenderer.minorSpacing || 10;
      x = Math.round(x / sp) * sp;
      y = Math.round(y / sp) * sp;
    }
    if (this.statusBar.isOn("OSNAP") && this.snapEngine) {
      const tol = this.viewport.screenToWorldDist(10);
      const snap = this.snapEngine.findSnap(x, y, tol);
      if (snap) return { x: snap.x, y: snap.y, snap };
    }
    if (this.statusBar.isOn("ORTHO") && this.commandRegistry.activeCommand?.lastPoint) {
      const lp = this.commandRegistry.activeCommand.lastPoint;
      if (Math.abs(x - lp.x) > Math.abs(y - lp.y)) y = lp.y;
      else x = lp.x;
    }
    return { x, y, snap: null };
  }

  /* ─── Zoom ─── */
  _updateZoomDisplay() {
    const pct = Math.round(this.viewport.zoom * 100);
    const el = document.getElementById("zoom-pct");
    if (el) el.textContent = pct + "%";
  }

  _zoomExtents() {
    const ext = this.engine.getExtents();
    if (ext) {
      this.viewport.zoomExtents(ext);
    } else {
      this.viewport.zoomExtents({
        minX: 0, minY: 0,
        maxX: this.engine.limitsMax.x,
        maxY: this.engine.limitsMax.y
      });
    }
    this._updateZoomDisplay();
    this.renderer.dirty = true;
  }

  /* ─── File Operations ─── */
  _save() {
    try {
      const data = this.engine.serialize();
      const json = JSON.stringify(data);
      localStorage.setItem("afrodraft-drawing", json);
      this.engine.markSaved();
      if (this._tabs[this._activeTab]) {
        this._tabs[this._activeTab].modified = false;
        this._renderTabs();
      }
      this._showToast("Drawing saved", "success");
    } catch (err) {
      console.error("Save error:", err);
      this._showToast("Save failed: " + err.message, "error");
    }
  }

  _autosave() {
    if (!this.engine.modified) return;
    try {
      const data = this.engine.serialize();
      localStorage.setItem("afrodraft-autosave", JSON.stringify(data));
    } catch (_) { }
  }

  _loadAutosave() {
    try {
      const saved = localStorage.getItem("afrodraft-drawing");
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.entities) {
          this._loadDrawingData(data);
          this._showToast("Previous drawing restored", "success");
        }
      }
    } catch (err) {
      console.warn("Could not load autosave:", err);
    }
  }

  _loadDrawingData(data) {
    try {
      // Import Entity deserializer
      import("./src/core/Entity.js").then(mod => {
        const deserialize = mod.deserializeEntity || ((d) => {
          const EntityTypes = mod.ENTITY_TYPES || {};
          const Cls = EntityTypes[d.type];
          if (Cls && Cls.deserialize) return Cls.deserialize(d);
          return d;
        });
        this.engine.load(data, deserialize);
        this.renderer.dirty = true;
        this._zoomExtents();
      }).catch(() => {
        // Fallback: just load raw data
        if (data.entities) {
          for (const e of data.entities) {
            this.engine.addEntity(e);
          }
        }
        this.renderer.dirty = true;
        this._zoomExtents();
      });
    } catch (err) {
      console.error("Load error:", err);
    }
  }

  _saveAsFile() {
    try {
      const data = this.engine.serialize();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (this._tabs[this._activeTab]?.name || "drawing") + ".afrodraft.json";
      a.click();
      URL.revokeObjectURL(url);
      this._showToast("File downloaded", "success");
    } catch (err) {
      this._showToast("Export failed: " + err.message, "error");
    }
  }

  _openFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.afrodraft.json,.dxf";
    input.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const text = ev.target.result;
          if (file.name.endsWith(".json")) {
            const data = JSON.parse(text);
            this.engine.clear();
            this._loadDrawingData(data);
            this._tabs.push({ name: file.name.replace(/\.[^.]+$/, ""), modified: false });
            this._activeTab = this._tabs.length - 1;
            this._renderTabs();
            this._showToast("Drawing opened", "success");
          } else if (file.name.endsWith(".dxf")) {
            import("./src/io/DxfImporter.js").then(mod => {
              const importer = new mod.DxfImporter(this.engine);
              importer.import(text);
              this._tabs.push({ name: file.name.replace(/\.[^.]+$/, ""), modified: false });
              this._activeTab = this._tabs.length - 1;
              this._renderTabs();
              this._zoomExtents();
              this._showToast("DXF imported", "success");
            }).catch(err => {
              this._showToast("DXF import failed: " + err.message, "error");
            });
          }
        } catch (err) {
          this._showToast("Open failed: " + err.message, "error");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  /* ─── Export Functions ─── */
  _exportSVG() {
    import("./src/io/SvgExporter.js").then(mod => {
      const exporter = new mod.SvgExporter(this.engine);
      const svg = exporter.export();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      this._downloadBlob(blob, (this._tabs[this._activeTab]?.name || "drawing") + ".svg");
      this._showToast("SVG exported", "success");
    }).catch(err => {
      this._showToast("SVG export failed: " + err.message, "error");
    });
  }

  _exportPNG() {
    import("./src/io/ImageExporter.js").then(mod => {
      const exporter = new mod.ImageExporter(this.engine, this.viewport, this.renderer);
      const dataUrl = exporter.export("png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = (this._tabs[this._activeTab]?.name || "drawing") + ".png";
      a.click();
      this._showToast("PNG exported", "success");
    }).catch(err => {
      // Fallback: export canvas directly
      try {
        const dataUrl = this.canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = (this._tabs[this._activeTab]?.name || "drawing") + ".png";
        a.click();
        this._showToast("PNG exported (canvas)", "success");
      } catch (e2) {
        this._showToast("PNG export failed: " + err.message, "error");
      }
    });
  }

  _exportDXF() {
    import("./src/io/DxfExporter.js").then(mod => {
      const exporter = new mod.DxfExporter(this.engine);
      const dxf = exporter.export();
      const blob = new Blob([dxf], { type: "application/dxf" });
      this._downloadBlob(blob, (this._tabs[this._activeTab]?.name || "drawing") + ".dxf");
      this._showToast("DXF exported", "success");
    }).catch(err => {
      this._showToast("DXF export failed: " + err.message, "error");
    });
  }

  _exportPDF() {
    import("./src/io/PdfExporter.js").then(mod => {
      const exporter = new mod.PdfExporter(this.engine, this.viewport, this.renderer);
      const blob = exporter.export();
      this._downloadBlob(blob, (this._tabs[this._activeTab]?.name || "drawing") + ".pdf");
      this._showToast("PDF exported", "success");
    }).catch(err => {
      this._showToast("PDF export failed: " + err.message, "error");
    });
  }

  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Background Color Picker ─── */
  _showBackgroundColorPicker() {
    const overlay = document.getElementById("modal-overlay");
    const currentBg = this._customBg || this.renderer.palette.background;

    const presets = [
      { name: "Default Dark", color: "#1E1E1E" },
      { name: "Deep Navy", color: "#0a0a1a" },
      { name: "Midnight Blue", color: "#001133" },
      { name: "Charcoal", color: "#2d2d2d" },
      { name: "Dark Slate", color: "#1a2332" },
      { name: "True Black", color: "#000000" },
      { name: "Blueprint Blue", color: "#002244" },
      { name: "Forest Dark", color: "#0a1a0a" },
      { name: "Warm Dark", color: "#1a1512" },
      { name: "Cool Gray", color: "#1e2128" },
      { name: "White", color: "#ffffff" },
      { name: "Light Gray", color: "#f0f0f0" },
      { name: "Cream", color: "#faf8f0" },
      { name: "Light Blue", color: "#e8f0ff" },
      { name: "Sepia", color: "#f5f0e8" },
    ];

    const swatches = presets.map(p =>
      `<button class="bg-swatch" data-color="${p.color}" title="${p.name}" style="background:${p.color};width:32px;height:32px;border:2px solid ${p.color === currentBg ? 'var(--cad-accent)' : 'var(--cad-border)'};border-radius:var(--cad-radius);cursor:pointer;transition:border-color 0.15s"></button>`
    ).join("");

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Canvas Background Color</span>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-field">
            <label>Preset Colors</label>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px" id="bg-presets">${swatches}</div>
          </div>
          <div class="modal-field" style="margin-top:16px">
            <label>Custom Color</label>
            <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
              <input type="color" id="bg-custom-color" value="${currentBg}" style="width:48px;height:32px;border:1px solid var(--cad-border);border-radius:var(--cad-radius);cursor:pointer;background:none;padding:0">
              <input type="text" id="bg-hex-input" value="${currentBg}" class="prop-input" style="width:100px;font-family:var(--cad-font-mono)">
              <div id="bg-preview" style="flex:1;height:32px;background:${currentBg};border:1px solid var(--cad-border);border-radius:var(--cad-radius)"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn" id="bg-reset">Reset to Theme Default</button>
          <button class="modal-btn" id="bg-cancel">Cancel</button>
          <button class="modal-btn primary" id="bg-apply">Apply</button>
        </div>
      </div>
    `;
    overlay.classList.remove("hidden");

    let selectedColor = currentBg;

    // Preset clicks
    overlay.querySelector("#bg-presets")?.addEventListener("click", e => {
      const btn = e.target.closest("[data-color]");
      if (!btn) return;
      selectedColor = btn.dataset.color;
      overlay.querySelector("#bg-custom-color").value = selectedColor;
      overlay.querySelector("#bg-hex-input").value = selectedColor;
      overlay.querySelector("#bg-preview").style.background = selectedColor;
      overlay.querySelectorAll(".bg-swatch").forEach(s => {
        s.style.borderColor = s.dataset.color === selectedColor ? "var(--cad-accent)" : "var(--cad-border)";
      });
    });

    // Color picker
    overlay.querySelector("#bg-custom-color")?.addEventListener("input", e => {
      selectedColor = e.target.value;
      overlay.querySelector("#bg-hex-input").value = selectedColor;
      overlay.querySelector("#bg-preview").style.background = selectedColor;
    });

    // Hex input
    overlay.querySelector("#bg-hex-input")?.addEventListener("change", e => {
      const val = e.target.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        selectedColor = val;
        overlay.querySelector("#bg-custom-color").value = val;
        overlay.querySelector("#bg-preview").style.background = val;
      }
    });

    overlay.querySelector("#modal-close-btn")?.addEventListener("click", () => {
      overlay.classList.add("hidden"); overlay.innerHTML = "";
    });
    overlay.querySelector("#bg-cancel")?.addEventListener("click", () => {
      overlay.classList.add("hidden"); overlay.innerHTML = "";
    });
    overlay.querySelector("#bg-reset")?.addEventListener("click", () => {
      this._customBg = null;
      this.renderer.setCustomBackground(null);
      this.renderer.dirty = true;
      overlay.classList.add("hidden"); overlay.innerHTML = "";
      this._showToast("Background reset to theme default", "success");
    });
    overlay.querySelector("#bg-apply")?.addEventListener("click", () => {
      this._customBg = selectedColor;
      this.renderer.setCustomBackground(selectedColor);
      this.renderer.dirty = true;
      overlay.classList.add("hidden"); overlay.innerHTML = "";
      localStorage.setItem("afrodraft-bg-color", selectedColor);
      this._showToast("Background color updated", "success");
    });

    // Restore saved bg color
    const savedBg = localStorage.getItem("afrodraft-bg-color");
    if (savedBg && !this._customBg) {
      this._customBg = savedBg;
      this.renderer.setCustomBackground(savedBg);
    }
  }

  /* ─── Theme Picker ─── */
  _showThemePicker() {
    const overlay = document.getElementById("modal-overlay");
    const themes = [
      { id: "dark", name: "Dark", desc: "Default dark theme — easy on the eyes", preview: "#1E1E1E" },
      { id: "light", name: "Light", desc: "Classic light theme for well-lit environments", preview: "#FFFFFF" },
      { id: "blueprint", name: "Blueprint", desc: "Classic CAD blueprint aesthetic", preview: "#002244" },
      { id: "high-contrast", name: "High Contrast", desc: "Maximum visibility for accessibility", preview: "#000000" },
    ];

    const cards = themes.map(t => `
      <div class="theme-card" data-theme="${t.id}" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:2px solid ${t.id === this._theme ? 'var(--cad-accent)' : 'var(--cad-border)'};border-radius:var(--cad-radius-lg);cursor:pointer;transition:border-color 0.15s;margin-bottom:6px">
        <div style="width:40px;height:40px;background:${t.preview};border:1px solid var(--cad-border);border-radius:var(--cad-radius);flex-shrink:0"></div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--cad-text)">${t.name}</div>
          <div style="font-size:10px;color:var(--cad-text-dim);margin-top:2px">${t.desc}</div>
        </div>
      </div>
    `).join("");

    overlay.innerHTML = `
      <div class="modal" style="min-width:360px">
        <div class="modal-header">
          <span class="modal-title">Choose Theme</span>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">${cards}</div>
        <div class="modal-footer">
          <button class="modal-btn" id="theme-cancel">Cancel</button>
        </div>
      </div>
    `;
    overlay.classList.remove("hidden");

    overlay.querySelector("#modal-close-btn")?.addEventListener("click", () => {
      overlay.classList.add("hidden"); overlay.innerHTML = "";
    });
    overlay.querySelector("#theme-cancel")?.addEventListener("click", () => {
      overlay.classList.add("hidden"); overlay.innerHTML = "";
    });

    overlay.querySelectorAll(".theme-card").forEach(card => {
      card.addEventListener("click", () => {
        const themeId = card.dataset.theme;
        this._applyTheme(themeId);
        overlay.classList.add("hidden"); overlay.innerHTML = "";
      });
    });
  }

  _applyTheme(themeId) {
    this._theme = themeId;
    document.body.className = `theme-${themeId}`;
    const link = document.getElementById("theme-css");
    if (link) link.href = `assets/css/themes/${themeId}.css`;
    this.renderer.theme = themeId;
    this.renderer.dirty = true;
    localStorage.setItem("afrodraft-theme", themeId);
    this._showToast(`Theme: ${themeId}`, "success");
  }

  /* ─── Toast ─── */
  _showToast(msg, type = "") {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = type;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.add("hidden"), 3000);
  }

  /* ─── Tabs ─── */
  _renderTabs() {
    const list = document.getElementById("tab-list");
    if (!list) return;
    list.innerHTML = "";
    this._tabs.forEach((tab, idx) => {
      const div = document.createElement("div");
      div.className = "tab" + (idx === this._activeTab ? " active" : "") + (tab.modified ? " modified" : "");
      div.innerHTML = `
        <span class="tab-modified"></span>
        <span class="tab-name">${tab.name}</span>
        <button class="tab-close" data-idx="${idx}">&times;</button>
      `;
      div.addEventListener("click", e => {
        if (!e.target.classList.contains("tab-close")) {
          this._activeTab = idx;
          this._renderTabs();
        }
      });
      div.querySelector(".tab-close").addEventListener("click", e => {
        e.stopPropagation();
        if (this._tabs.length <= 1) return;
        this._tabs.splice(idx, 1);
        if (this._activeTab >= this._tabs.length) this._activeTab = this._tabs.length - 1;
        this._renderTabs();
      });
      list.appendChild(div);
    });
  }
}

/* ─── Bootstrap ─── */
window.addEventListener("DOMContentLoaded", () => {
  // Restore theme from localStorage
  const savedTheme = localStorage.getItem("afrodraft-theme");
  if (savedTheme) {
    document.body.className = `theme-${savedTheme}`;
    const link = document.getElementById("theme-css");
    if (link) link.href = `assets/css/themes/${savedTheme}.css`;
  }

  // Restore background color
  const savedBg = localStorage.getItem("afrodraft-bg-color");

  const app = new AfroDraftApp();

  // Apply saved background
  if (savedBg) {
    app._customBg = savedBg;
    app.renderer.setCustomBackground(savedBg);
    app.renderer.dirty = true;
  }

  // Apply saved theme to renderer
  if (savedTheme) {
    app._theme = savedTheme;
    app.renderer.theme = savedTheme;
    app.renderer.dirty = true;
  }

  window.app = app;
});
