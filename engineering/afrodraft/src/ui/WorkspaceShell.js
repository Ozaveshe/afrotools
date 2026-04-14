import { FileWorkflow } from "./FileWorkflow.js";

const STORAGE_KEY = "afrodraft-workspace-layout-v2";
const VIEW_STORAGE_KEY = "afrodraft-saved-views-v1";
const DEFAULT_OSNAPS = ["endpoint", "midpoint", "center", "intersection", "perpendicular", "nearest"];
const QUICK_ACTIONS = [
  ["new", "New drawing", "Start fresh"],
  ["open", "Open drawing", "ADRAFT, DXF, DWG"],
  ["save", "Save", "Keep this revision"],
  ["save-as", "Save as", "Project, DXF, DWG"],
  ["export-dxf", "Export DXF", "Share with CAD"],
  ["recent", "Recent", "Jump back in"],
];
const TOOL_ACTIONS = [
  ["line", "Line", "btn-line"],
  ["polyline", "Polyline", "btn-polyline"],
  ["circle", "Circle", "btn-circle"],
  ["rect", "Rectangle", "btn-rect"],
  ["text", "Text", "btn-text"],
  ["dimension", "Dimension", "btn-dim"],
  ["hatch", "Hatch", "btn-hatch"],
  ["offset", "Offset", "btn-offset"],
  ["trim", "Trim", "btn-trim"],
  ["layers", "Layers", ""],
  ["blocks", "Blocks", ""],
];
const RIBBON_FILTERS = {
  quick: new Set(["btn-new", "btn-open", "btn-save", "btn-saveas", "btn-line", "btn-polyline", "btn-circle", "btn-rect", "btn-text", "btn-dim", "btn-offset", "btn-trim", "btn-layers", "btn-gridsnap", "btn-print", "btn-recent", "v7-stats", "v7-plot"]),
  draw: new Set(["btn-line", "btn-polyline", "btn-circle", "btn-rect", "btn-arc", "btn-ellipse", "btn-point", "btn-hatch", "btn-blocks"]),
  edit: new Set(["btn-offset", "btn-trim", "btn-extend", "btn-rotate", "btn-scale", "btn-mirror", "btn-explode", "btn-stretch", "btn-array", "btn-break", "btn-join", "btn-fillet", "btn-chamfer"]),
  annotate: new Set(["btn-text", "btn-mtext", "btn-dim", "btn-dimension", "btn-hatch", "btn-table", "btn-leader"]),
  setup: new Set(["btn-new", "btn-open", "btn-save", "btn-saveas", "btn-print", "btn-recent", "btn-layers", "btn-limits", "btn-units", "btn-gridsnap", "v7-stats", "v7-plot", "v7-audit"]),
  all: null,
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function mergeBounds(boundsList) {
  let merged = null;
  for (const bounds of boundsList) {
    if (!bounds) continue;
    if (!merged) {
      merged = { ...bounds };
      continue;
    }
    merged.minX = Math.min(merged.minX, bounds.minX);
    merged.minY = Math.min(merged.minY, bounds.minY);
    merged.maxX = Math.max(merged.maxX, bounds.maxX);
    merged.maxY = Math.max(merged.maxY, bounds.maxY);
  }
  return merged;
}

function normalizeScope(fileState) {
  const fileName = (fileState?.fileName || "untitled-1.adraft").toLowerCase();
  const fileFormat = (fileState?.fileFormat || "adraft").toLowerCase();
  return `${fileFormat}:${fileName}`;
}

export class WorkspaceShell {
  constructor(app) {
    this.app = app;
    this.engine = app.engine;
    this.viewport = app.viewport;
    this.selectionManager = app.selectionManager;
    this.blockManager = app.blockManager || this.engine.blockManager;
    this.state = this._loadState();
    this.dropDepth = 0;
    this._renderShell();
    this._setupInspectorTabs();
    this.fileWorkflow = new FileWorkflow(app, {
      onToast: (message, tone) => this._toast(message, tone),
      onStateChange: () => {
        this._syncSummary();
        this._refreshViewsPanel();
      },
      onNeedDwgImportHelp: (file) => this._showDwgImportModal(file),
      onNeedDwgSaveHelp: () => this._showDwgSaveModal(),
    });
    this.fileWorkflow.bindLegacyControls();
    this.fileWorkflow.bindShortcuts();
    this._setupRibbonModes();
    this._bindEvents();
    this._bindDragAndDrop();
    this._applyLayout();
    this._setInspectorTab(this.state.inspectorTab || "props", false);
    this._setRibbonMode(this.state.ribbonMode || "quick", false);
    this._refreshBlockPanel();
    this._refreshViewsPanel();
    this._syncSummary();
    this.app._workspaceShell = this;
  }

  _renderShell() {
    const appEl = document.getElementById("cad-app");
    const mainArea = document.getElementById("main-area");
    const canvasWrap = document.getElementById("canvas-wrap");
    appEl.classList.add("workspace-shell-ready");
    if (!document.getElementById("workspace-sidebar")) {
      mainArea.insertAdjacentHTML("afterbegin", `
        <aside id="workspace-sidebar">
          <div class="workspace-sidebar__rail">
            <button class="workspace-rail-btn" data-action="open" title="Open">O</button>
            <button class="workspace-rail-btn" data-mode="draw" title="Draw">D</button>
            <button class="workspace-rail-btn" data-mode="annotate" title="Annotate">A</button>
            <button class="workspace-rail-btn" data-action="layers" title="Layers">L</button>
            <button class="workspace-rail-btn" data-action="blocks" title="Blocks">B</button>
            <button class="workspace-rail-btn" data-action="focus" title="Focus">F</button>
          </div>
          <div class="workspace-sidebar__panel">
            <section class="workspace-sidebar__hero">
              <span class="workspace-sidebar__eyebrow">AfroDraft Essentials</span>
              <h2 class="workspace-sidebar__title">2D drafting without the noise</h2>
              <p class="workspace-sidebar__subtitle">Native AfroDraft projects, DXF exchange, and a DWG bridge that stays honest about what is connected.</p>
              <div class="workspace-file-strip">
                <div class="workspace-file-strip__meta">
                  <span class="workspace-file-strip__eyebrow">Current file</span>
                  <strong id="workspace-file-name">Untitled-1.adraft</strong>
                  <span id="workspace-file-copy">Unsaved scratch</span>
                </div>
                <div class="workspace-file-strip__badges">
                  <span class="workspace-file-pill" id="workspace-file-format">ADRAFT</span>
                  <span class="workspace-file-pill" id="workspace-file-state">Saved</span>
                </div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Quick Actions</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">${QUICK_ACTIONS.map(([action, name, hint]) => `<button class="workspace-action-btn" data-action="${action}"><span class="workspace-action-btn__icon">${name.slice(0, 1)}</span><span class="workspace-action-btn__meta"><span class="workspace-action-btn__name">${name}</span><span class="workspace-tool-btn__shortcut">${hint}</span></span></button>`).join("")}</div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Core Tools</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">${TOOL_ACTIONS.map(([action, name, shortcut]) => `<button class="workspace-tool-btn" data-action="${action}"><span class="workspace-tool-btn__icon">${name.slice(0, 2)}</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">${name}</span><span class="workspace-tool-btn__shortcut">${shortcut || "Workspace"}</span></span></button>`).join("")}</div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Workspace</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-summary-grid">
                  <div class="workspace-summary-card"><span>Objects</span><strong id="workspace-entity-count">0</strong></div>
                  <div class="workspace-summary-card"><span>Selected</span><strong id="workspace-selection-count">0</strong></div>
                  <div class="workspace-summary-card"><span>Layer</span><strong id="workspace-layer-name">Layer 0</strong></div>
                  <div class="workspace-summary-card"><span>Units</span><strong id="workspace-units">mm</strong></div>
                </div>
                <div class="workspace-status-row">
                  <button class="workspace-status-chip" data-action="grid" id="workspace-chip-grid">Grid</button>
                  <button class="workspace-status-chip" data-action="osnap" id="workspace-chip-osnap">Osnap</button>
                  <button class="workspace-status-chip" data-action="ortho" id="workspace-chip-ortho">Ortho</button>
                </div>
                <div class="workspace-note">DWG opens and saves through a bridge adapter when one is connected. Without it, AfroDraft stays seamless by guiding the user through DXF plus native project backups.</div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Draft Assist</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-status-row">
                  <button class="workspace-status-chip" data-action="polar" id="workspace-chip-polar">Polar</button>
                  <button class="workspace-status-chip" data-action="tracking" id="workspace-chip-tracking">Track</button>
                  <button class="workspace-status-chip" data-action="axes" id="workspace-chip-axes">Axes</button>
                  <button class="workspace-status-chip" data-action="measure" id="workspace-chip-measure">Measure</button>
                </div>
                <div class="workspace-tool-grid">
                  <button class="workspace-tool-btn" data-action="units"><span class="workspace-tool-btn__icon">Un</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Units</span><span class="workspace-tool-btn__shortcut">Drawing setup</span></span></button>
                  <button class="workspace-tool-btn" data-action="limits"><span class="workspace-tool-btn__icon">Li</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Limits</span><span class="workspace-tool-btn__shortcut">Sheet bounds</span></span></button>
                  <button class="workspace-tool-btn" data-action="drawing-stats"><span class="workspace-tool-btn__icon">St</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Stats</span><span class="workspace-tool-btn__shortcut">Drawing audit</span></span></button>
                  <button class="workspace-tool-btn" data-action="command-palette"><span class="workspace-tool-btn__icon">Cp</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Palette</span><span class="workspace-tool-btn__shortcut">Command search</span></span></button>
                </div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Selection</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                <button class="workspace-tool-btn" data-action="zoom-selection"><span class="workspace-tool-btn__icon">Zs</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Zoom Selected</span><span class="workspace-tool-btn__shortcut">Frame selection</span></span></button>
                <button class="workspace-tool-btn" data-action="zoom-extents"><span class="workspace-tool-btn__icon">Ze</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Zoom Extents</span><span class="workspace-tool-btn__shortcut">Whole drawing</span></span></button>
                <button class="workspace-tool-btn" data-action="duplicate-selection"><span class="workspace-tool-btn__icon">Du</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Duplicate</span><span class="workspace-tool-btn__shortcut">Copy in place</span></span></button>
                <button class="workspace-tool-btn" data-action="erase-selection"><span class="workspace-tool-btn__icon">Er</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Delete</span><span class="workspace-tool-btn__shortcut">Remove objects</span></span></button>
                <button class="workspace-tool-btn" data-action="isolate-selection"><span class="workspace-tool-btn__icon">Iso</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Isolate</span><span class="workspace-tool-btn__shortcut">Focus geometry</span></span></button>
                <button class="workspace-tool-btn" data-action="selection-layer"><span class="workspace-tool-btn__icon">Ly</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">New Layer</span><span class="workspace-tool-btn__shortcut">From selection</span></span></button>
                <button class="workspace-tool-btn" data-action="end-isolation"><span class="workspace-tool-btn__icon">All</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Show All</span><span class="workspace-tool-btn__shortcut">End isolate</span></span></button>
                <button class="workspace-tool-btn" data-action="plot"><span class="workspace-tool-btn__icon">Pt</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Plot</span><span class="workspace-tool-btn__shortcut">Print or export</span></span></button>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Views</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-block-toolbar">
                  <button class="workspace-block-button" data-action="save-view">Save current view</button>
                  <button class="workspace-block-button" data-action="page-setup">Page setup</button>
                </div>
                <div id="workspace-view-list"></div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Layer Ops</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                <button class="workspace-tool-btn" data-action="zoom-layer"><span class="workspace-tool-btn__icon">Zl</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Zoom Layer</span><span class="workspace-tool-btn__shortcut">Current layer extents</span></span></button>
                <button class="workspace-tool-btn" data-action="freeze-others"><span class="workspace-tool-btn__icon">Fo</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Freeze Others</span><span class="workspace-tool-btn__shortcut">Focus current layer</span></span></button>
                <button class="workspace-tool-btn" data-action="thaw-layers"><span class="workspace-tool-btn__icon">Th</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Thaw All</span><span class="workspace-tool-btn__shortcut">Restore visibility</span></span></button>
                <button class="workspace-tool-btn" data-action="purge-layers"><span class="workspace-tool-btn__icon">Pg</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Purge Layers</span><span class="workspace-tool-btn__shortcut">Remove unused</span></span></button>
              </div>
            </section>
          </div>
        </aside>
      `);
    }
    if (!document.getElementById("workspace-dock-controls")) {
      canvasWrap.insertAdjacentHTML("beforeend", `
        <div id="workspace-dock-controls">
          <button class="workspace-dock-pill" data-toggle="sidebarCollapsed" id="workspace-dock-tools">Tools</button>
          <button class="workspace-dock-pill" data-toggle="ribbonCollapsed" id="workspace-dock-ribbon">Ribbon</button>
          <button class="workspace-dock-pill" data-toggle="inspectorCollapsed" id="workspace-dock-inspector">Inspector</button>
          <button class="workspace-dock-pill" data-toggle="commandCollapsed" id="workspace-dock-command">Command</button>
          <button class="workspace-dock-pill is-focus" data-action="focus" id="workspace-dock-focus">Focus</button>
        </div>
        <div id="workspace-dropzone">
          <div class="workspace-dropzone__card">
            <div class="workspace-dropzone__icon">+</div>
            <strong>Drop ADRAFT, DXF, or DWG</strong>
            <span>Projects reopen directly. DXF imports cleanly. DWG follows the bridge when connected.</span>
          </div>
        </div>
      `);
    }
  }

  _setupInspectorTabs() {
    const panel = document.getElementById("properties-panel");
    const header = panel?.querySelector(".panel-header");
    const body = panel?.querySelector(".panel-body");
    const props = document.getElementById("props-content");
    const layers = document.getElementById("layer-panel");
    if (!panel || !header || !body || !props || !layers || document.querySelector(".workspace-inspector-tabs")) return;
    header.querySelector(".panel-title").textContent = "Inspector";
    header.insertAdjacentHTML("beforeend", `
      <div class="workspace-inspector-tabs">
        <button class="workspace-inspector-tab" data-tab="props">Properties</button>
        <button class="workspace-inspector-tab" data-tab="layers">Layers</button>
        <button class="workspace-inspector-tab" data-tab="blocks">Blocks</button>
      </div>
    `);
    const propsView = document.createElement("div");
    const layerView = document.createElement("div");
    const blockView = document.createElement("div");
    propsView.className = "workspace-inspector-view";
    layerView.className = "workspace-inspector-view";
    blockView.className = "workspace-inspector-view";
    propsView.dataset.tab = "props";
    layerView.dataset.tab = "layers";
    blockView.dataset.tab = "blocks";
    blockView.id = "workspace-block-panel";
    propsView.appendChild(props);
    layerView.appendChild(layers);
    body.innerHTML = "";
    body.append(propsView, layerView, blockView);
  }

  _setupRibbonModes() {
    const ribbon = document.getElementById("ribbon");
    if (!ribbon || ribbon.querySelector(".ribbon-modebar")) return;
    ribbon.insertAdjacentHTML("afterbegin", `
      <div class="ribbon-modebar">
        <div class="ribbon-modebar-tools">
          ${["quick", "draw", "edit", "annotate", "setup", "all"].map((mode) => `<button class="ribbon-mode-btn" data-mode="${mode}">${mode}</button>`).join("")}
        </div>
      </div>
    `);
  }

  _bindEvents() {
    document.getElementById("workspace-sidebar")?.addEventListener("click", (event) => this._handleUiClick(event));
    document.getElementById("workspace-dock-controls")?.addEventListener("click", (event) => this._handleUiClick(event));
    document.getElementById("properties-panel")?.addEventListener("click", (event) => this._handleUiClick(event));
    document.getElementById("ribbon")?.addEventListener("click", (event) => this._handleUiClick(event));
    this.engine.on("entity-added", () => { this._refreshBlockPanel(); this._syncSummary(); });
    this.engine.on("entity-removed", () => { this._refreshBlockPanel(); this._syncSummary(); });
    this.engine.on("selection-changed", () => this._syncSummary());
    this.engine.on("layer-changed", () => this._syncSummary());
    this.engine.on("current-layer-changed", () => this._syncSummary());
    this.engine.on("modified-changed", () => this._syncSummary());
    this.engine.on("drawing-loaded", () => { this._refreshBlockPanel(); this._refreshViewsPanel(); this._syncSummary(); });
    this.engine.on("drawing-cleared", () => { this._refreshBlockPanel(); this._refreshViewsPanel(); this._syncSummary(); });
    this.engine.on("block-defined", () => this._refreshBlockPanel());
    this.engine.on("blocks-purged", () => this._refreshBlockPanel());
  }

  _bindDragAndDrop() {
    const canvasWrap = document.getElementById("canvas-wrap");
    if (!canvasWrap) return;
    const activate = (on) => document.getElementById("cad-app")?.classList.toggle("workspace-drop-active", on);
    canvasWrap.addEventListener("dragenter", (event) => {
      event.preventDefault();
      this.dropDepth += 1;
      activate(true);
    });
    canvasWrap.addEventListener("dragover", (event) => event.preventDefault());
    canvasWrap.addEventListener("dragleave", (event) => {
      event.preventDefault();
      this.dropDepth = Math.max(0, this.dropDepth - 1);
      if (!this.dropDepth) activate(false);
    });
    canvasWrap.addEventListener("drop", async (event) => {
      event.preventDefault();
      this.dropDepth = 0;
      activate(false);
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      await this.fileWorkflow.openPickedFile(file);
    });
  }

  _handleUiClick(event) {
    const actionEl = event.target.closest("[data-action],[data-toggle],[data-tab],[data-mode]");
    if (!actionEl) return;
    const { action, toggle, tab, mode } = actionEl.dataset;
    if (toggle) {
      this.state[toggle] = !this.state[toggle];
      this._applyLayout();
      this._saveState();
      return;
    }
    if (tab) {
      this._setInspectorTab(tab);
      return;
    }
    if (mode) {
      this._setRibbonMode(mode);
      return;
    }
    if (action) {
      this._handleAction(action, actionEl);
    }
  }

  _handleAction(action, target) {
    const buttonMap = { line: "btn-line", polyline: "btn-polyline", circle: "btn-circle", rect: "btn-rect", text: "btn-text", dimension: "btn-dim", hatch: "btn-hatch", offset: "btn-offset", trim: "btn-trim", recent: "btn-recent", new: "btn-new" };
    if (buttonMap[action]) {
      this._click(buttonMap[action]) || (action === "rect" && this._click("btn-rectangle")) || (action === "dimension" && this._click("btn-dimension"));
      return;
    }
    if (action === "open") return void this.fileWorkflow.openDrawing();
    if (action === "save") return void this.fileWorkflow.saveDrawing();
    if (action === "save-as") return void this._showSaveChoices();
    if (action === "export-dxf") return void this.fileWorkflow.exportDxf();
    if (action === "select") return void this._syncSummary();
    if (action === "layers") return void this._setInspectorTab("layers");
    if (action === "blocks") return void this._setInspectorTab("blocks");
    if (action === "props") return void this._setInspectorTab("props");
    if (action === "focus") {
      this.state.focusMode = !this.state.focusMode;
      this._applyLayout();
      this._saveState();
      return;
    }
    if (action === "grid") return void this._toggleGrid();
    if (action === "osnap") return void this._toggleOsnap();
    if (action === "ortho") return void this._toggleOrtho();
    if (action === "polar") return void this._togglePolar();
    if (action === "tracking") return void this._toggleTracking();
    if (action === "axes") return void this._toggleAxes();
    if (action === "measure") return void this._toggleMeasure();
    if (action === "units") return void this.app._showUnitsDialog?.();
    if (action === "limits") return void this.app._showLimitsDialog?.();
    if (action === "drawing-stats") return void this.app._showDrawingStats?.();
    if (action === "command-palette") return void this.app._showCommandPalette?.();
    if (action === "zoom-selection") return void this._zoomSelection();
    if (action === "zoom-extents") return void this._zoomExtents();
    if (action === "duplicate-selection") return void this._duplicateSelection();
    if (action === "erase-selection") return void this._eraseSelection();
    if (action === "isolate-selection") return void this.app._isolateSelection?.();
    if (action === "end-isolation") return void this.app._endIsolation?.();
    if (action === "selection-layer") return void this.app._createLayerFromSelection?.();
    if (action === "plot") return void (this.app._showPlotDialog?.() || this._click("btn-print"));
    if (action === "save-view") return void this._showSaveViewDialog();
    if (action === "page-setup") return void (this.app.dialogs?.showPageSetup?.() || this.app._showPageSetup?.());
    if (action === "restore-view") return void this._restoreSavedView(target.dataset.viewName);
    if (action === "delete-view") return void this._deleteSavedView(target.dataset.viewName);
    if (action === "zoom-layer") return void this._zoomCurrentLayer();
    if (action === "freeze-others") return void this._freezeOtherLayers();
    if (action === "thaw-layers") return void this._thawAllLayers();
    if (action === "purge-layers") return void this._purgeUnusedLayers();
    if (action === "create-block") return void this._showCreateBlockDialog();
    if (action === "purge-blocks") return void this._purgeUnusedBlocks();
    if (action === "insert-block") return void this._insertBlockAtView(target.dataset.blockName);
    if (action === "zoom-block") return void this._zoomToBlockReferences(target.dataset.blockName);
    if (action === "save-project") return void this._closeModal(this.fileWorkflow.saveAsProject(true));
    if (action === "save-dxf") return void this._closeModal(this.fileWorkflow.saveAsDxfPrimary());
    if (action === "save-dwg") return void this._closeModal(this.fileWorkflow.saveAsDwg());
    if (action === "choose-dxf") return void this._closeModal(this.fileWorkflow.openDrawing({ dxfOnly: true }));
    if (action === "save-dxf-copy") return void this._closeModal(this.fileWorkflow.exportDxf());
    if (action === "save-project-copy") return void this._closeModal(this.fileWorkflow.saveAsProject(true));
  }

  _setInspectorTab(tab, persist = true) {
    this.state.inspectorTab = tab;
    document.querySelectorAll(".workspace-inspector-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
    document.querySelectorAll(".workspace-inspector-view").forEach((view) => view.classList.toggle("is-active", view.dataset.tab === tab));
    if (persist) this._saveState();
  }

  _setRibbonMode(mode, persist = true) {
    this.state.ribbonMode = mode;
    const allowed = RIBBON_FILTERS[mode];
    document.querySelectorAll(".ribbon-mode-btn").forEach((button) => button.classList.toggle("is-active", button.dataset.mode === mode));
    document.querySelectorAll("#ribbon .ribbon-group").forEach((group) => {
      let visibleButtons = 0;
      group.querySelectorAll(".ribbon-btn").forEach((button) => {
        const show = !allowed || allowed.has(button.id);
        button.style.display = show ? "" : "none";
        if (show) visibleButtons += 1;
      });
      group.style.display = visibleButtons ? "" : "none";
    });
    if (persist) this._saveState();
  }

  _applyLayout() {
    const appEl = document.getElementById("cad-app");
    const ribbon = document.getElementById("ribbon");
    const panel = document.getElementById("properties-panel");
    appEl?.classList.toggle("sidebar-collapsed", this.state.sidebarCollapsed || this.state.focusMode);
    appEl?.classList.toggle("command-collapsed", this.state.commandCollapsed || this.state.focusMode);
    appEl?.classList.toggle("focus-mode", !!this.state.focusMode);
    ribbon?.classList.toggle("workspace-hidden", this.state.ribbonCollapsed || this.state.focusMode);
    panel?.classList.toggle("collapsed", this.state.inspectorCollapsed || this.state.focusMode);
    [["workspace-dock-tools", !(this.state.sidebarCollapsed || this.state.focusMode)], ["workspace-dock-ribbon", !(this.state.ribbonCollapsed || this.state.focusMode)], ["workspace-dock-inspector", !(this.state.inspectorCollapsed || this.state.focusMode)], ["workspace-dock-command", !(this.state.commandCollapsed || this.state.focusMode)], ["workspace-dock-focus", !!this.state.focusMode]].forEach(([id, on]) => document.getElementById(id)?.classList.toggle("is-on", on));
  }

  _syncSummary() {
    const state = this.fileWorkflow.getState();
    document.getElementById("workspace-file-name").textContent = state.fileName;
    document.getElementById("workspace-file-copy").textContent = { new: "Unsaved scratch", project: "Editable project", dxf: "DXF interchange", dwg: "DWG bridge" }[state.sourceKind] || "Workspace";
    document.getElementById("workspace-file-format").textContent = state.fileFormat.toUpperCase();
    const dirty = !!this.engine.modified;
    const fileState = document.getElementById("workspace-file-state");
    fileState.textContent = dirty ? "Unsaved" : "Saved";
    fileState.classList.toggle("is-dirty", dirty);
    document.getElementById("workspace-entity-count").textContent = String(this.engine.entities.size);
    document.getElementById("workspace-selection-count").textContent = String(this.selectionManager?.getSelectedEntities()?.length || 0);
    document.getElementById("workspace-layer-name").textContent = this.engine.currentLayer || "Layer 0";
    document.getElementById("workspace-units").textContent = this.engine.units || "mm";
    document.getElementById("workspace-chip-grid")?.classList.toggle("is-on", !!this.app.gridRenderer?.showGrid);
    document.getElementById("workspace-chip-osnap")?.classList.toggle("is-on", (this.app.snapEngine?.enabledSnaps?.size || 0) > 0);
    document.getElementById("workspace-chip-ortho")?.classList.toggle("is-on", !!this.app.snapEngine?.orthoEnabled);
    document.getElementById("workspace-chip-polar")?.classList.toggle("is-on", !!this.app.snapEngine?.polarEnabled);
    document.getElementById("workspace-chip-tracking")?.classList.toggle("is-on", !!this.app.snapEngine?.trackingEnabled);
    document.getElementById("workspace-chip-axes")?.classList.toggle("is-on", !!this.app.gridRenderer?.showAxes);
    document.getElementById("workspace-chip-measure")?.classList.toggle("is-on", !!this.app._measureMode);
    const tab = this.app._tabs?.[this.app._activeTab];
    if (tab) {
      tab.name = state.fileName.replace(/\.(adraft|json|dxf|dwg)$/i, "");
      tab.modified = dirty;
      this.app._renderTabs?.();
    }
  }

  _refreshBlockPanel() {
    const panel = document.getElementById("workspace-block-panel");
    if (!panel) return;
    const names = this.blockManager?.getAllBlockNames?.() || [];
    panel.innerHTML = `
      <div class="workspace-block-toolbar">
        <button class="workspace-block-button" data-action="create-block">Create from selection</button>
        <button class="workspace-block-button" data-action="purge-blocks">Purge unused</button>
      </div>
      ${names.length ? `<div class="workspace-block-list">${names.map((name) => `<article class="workspace-block-card"><div class="workspace-block-card__head"><strong>${escapeHtml(name)}</strong><span>${this.blockManager.getReferenceCount(name)} refs</span></div><div class="workspace-block-card__actions"><button class="workspace-block-link" data-action="insert-block" data-block-name="${escapeHtml(name)}">Insert</button><button class="workspace-block-link" data-action="zoom-block" data-block-name="${escapeHtml(name)}">Zoom</button></div></article>`).join("")}</div>` : `<div class="workspace-empty-state">Create reusable symbols from a clean selection, then place them anywhere in the drawing.</div>`}
    `;
  }

  _refreshViewsPanel() {
    const panel = document.getElementById("workspace-view-list");
    if (!panel) return;
    const views = this._getSavedViews();
    panel.className = "workspace-view-list";
    if (!views.length) {
      panel.innerHTML = `<div class="workspace-empty-state">Save camera checkpoints for common framing views like plan, detail, title block, or plot extents.</div>`;
      return;
    }
    panel.innerHTML = views.map((view) => `
      <article class="workspace-view-card">
        <div class="workspace-view-card__head">
          <strong>${escapeHtml(view.name)}</strong>
          <span>${Math.round((view.zoom || 1) * 100)}%</span>
        </div>
        <div class="workspace-view-card__meta">
          Center X ${Number(view.panX || 0).toFixed(2)}<br>
          Center Y ${Number(view.panY || 0).toFixed(2)}
        </div>
        <div class="workspace-view-card__actions">
          <button class="workspace-block-link" data-action="restore-view" data-view-name="${escapeHtml(view.name)}">Restore</button>
          <button class="workspace-block-link" data-action="delete-view" data-view-name="${escapeHtml(view.name)}">Delete</button>
        </div>
      </article>
    `).join("");
  }

  _showCreateBlockDialog() {
    if (!(this.selectionManager?.getSelectedEntities()?.length)) {
      this._toast("Select geometry first.", "warning");
      return;
    }
    const modal = this._openModal("Create block", `
      <div class="modal-field"><label>Block name</label><input id="workspace-block-name" type="text" placeholder="Door-900"></div>
      <label class="workspace-checkline"><input id="workspace-block-replace" type="checkbox" checked> Replace the selection with a block reference</label>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-block-create">Create</button>`);
    modal.querySelector("#workspace-block-create")?.addEventListener("click", () => {
      const name = modal.querySelector("#workspace-block-name")?.value?.trim();
      const replace = !!modal.querySelector("#workspace-block-replace")?.checked;
      this._createBlockFromSelection(name, replace);
      this._closeModal();
    });
  }

  _showSaveViewDialog() {
    const modal = this._openModal("Save view", `
      <div class="modal-field"><label>View name</label><input id="workspace-view-name" type="text" placeholder="Plan overview"></div>
      <div class="workspace-note">Saved views remember zoom and center so people can jump between working areas without losing rhythm.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-view-save">Save</button>`);
    modal.querySelector("#workspace-view-save")?.addEventListener("click", () => {
      const name = modal.querySelector("#workspace-view-name")?.value?.trim();
      if (!this._saveCurrentView(name)) return;
      this._closeModal();
    });
  }

  _createBlockFromSelection(name, replaceSelection) {
    const selected = this.selectionManager.getSelectedEntities();
    const bounds = mergeBounds(selected.map((entity) => entity.getBounds?.()));
    if (!name || !bounds) {
      this._toast("Give the block a name.", "warning");
      return;
    }
    const basePoint = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    const created = this.blockManager.defineBlock(name, basePoint, selected);
    if (!created) {
      this._toast("That block name already exists.", "warning");
      return;
    }
    if (replaceSelection) {
      selected.forEach((entity) => this.engine.removeEntity(entity.id));
      const blockRef = this.blockManager.insertBlock(name, basePoint);
      if (blockRef) this.engine.addEntity(blockRef);
    }
    this.selectionManager.deselectAll();
    this._refreshBlockPanel();
    this._toast(`Block ${name} created`, "success");
  }

  _insertBlockAtView(name) {
    const blockRef = this.blockManager.insertBlock(name, { x: this.viewport.panX, y: this.viewport.panY });
    if (!blockRef) return;
    this.engine.addEntity(blockRef);
    this.app.renderer.dirty = true;
    this._toast(`Inserted ${name}`, "success");
  }

  _zoomToBlockReferences(name) {
    const bounds = mergeBounds([...this.engine.entities.values()].filter((entity) => entity.type === "blockref" && entity.blockName === name).map((entity) => entity.getBounds?.()));
    if (!bounds) {
      this._toast(`No references for ${name}`, "warning");
      return;
    }
    this.viewport.zoomExtents(bounds);
    this.app.renderer.dirty = true;
  }

  _purgeUnusedBlocks() {
    const removed = this.blockManager.purgeUnused();
    this._refreshBlockPanel();
    this._toast(removed.length ? `Purged ${removed.length} block${removed.length === 1 ? "" : "s"}` : "No unused blocks found", removed.length ? "success" : "warning");
  }

  _saveCurrentView(name) {
    if (!name) {
      this._toast("Give the view a name.", "warning");
      return false;
    }
    const views = this._getSavedViews().filter((view) => view.name !== name);
    const nextView = {
      name,
      panX: this.viewport.panX,
      panY: this.viewport.panY,
      zoom: this.viewport.zoom,
    };
    this.viewport.saveView?.(name);
    views.unshift(nextView);
    this._setSavedViews(views.slice(0, 12));
    this._refreshViewsPanel();
    this._toast(`Saved view ${name}`, "success");
    return true;
  }

  _restoreSavedView(name) {
    if (!name) return;
    const view = this._getSavedViews().find((entry) => entry.name === name);
    if (!view) {
      this._toast("That saved view no longer exists.", "warning");
      return;
    }
    if (!this.viewport.restoreView?.(name)) {
      this.viewport.panX = view.panX;
      this.viewport.panY = view.panY;
      this.viewport.zoom = view.zoom;
    }
    this.app.renderer.dirty = true;
    this._toast(`Restored ${name}`, "success");
  }

  _deleteSavedView(name) {
    if (!name) return;
    const views = this._getSavedViews();
    if (!views.some((view) => view.name === name)) return;
    this.viewport.deleteView?.(name);
    this._setSavedViews(views.filter((view) => view.name !== name));
    this._refreshViewsPanel();
    this._toast(`Deleted ${name}`, "success");
  }

  _toggleGrid() {
    this.app.gridRenderer.showGrid = !this.app.gridRenderer.showGrid;
    this.app.renderer.dirty = true;
    this._syncSummary();
  }

  _toggleOsnap() {
    const snapEngine = this.app.snapEngine;
    if (!snapEngine) return;
    if (snapEngine.enabledSnaps.size) snapEngine.enabledSnaps.clear();
    else DEFAULT_OSNAPS.forEach((snap) => snapEngine.enabledSnaps.add(snap));
    this._syncSummary();
  }

  _toggleOrtho() {
    this.app.snapEngine.orthoEnabled = !this.app.snapEngine.orthoEnabled;
    this._syncSummary();
  }

  _togglePolar() {
    this.app.snapEngine.polarEnabled = !this.app.snapEngine.polarEnabled;
    this._syncSummary();
  }

  _toggleTracking() {
    this.app.snapEngine.trackingEnabled = !this.app.snapEngine.trackingEnabled;
    this._syncSummary();
  }

  _toggleAxes() {
    this.app.gridRenderer.showAxes = !this.app.gridRenderer.showAxes;
    this.app.renderer.dirty = true;
    this._syncSummary();
  }

  _toggleMeasure() {
    if (typeof this.app._toggleMeasureMode === "function") {
      this.app._toggleMeasureMode();
    }
    this._syncSummary();
  }

  _zoomCurrentLayer() {
    const layerName = this.engine.currentLayer || this.app.layerManager?.currentLayer || "Layer 0";
    const entities = [...this.engine.entities.values()].filter((entity) => entity.layer === layerName);
    const bounds = mergeBounds(entities.map((entity) => entity.getBounds?.()));
    if (!bounds) {
      this._toast(`No geometry on ${layerName}`, "warning");
      return;
    }
    this.viewport.zoomExtents(bounds);
    this.app.renderer.dirty = true;
    this._toast(`Zoomed to ${layerName}`, "success");
  }

  _freezeOtherLayers() {
    const current = this.engine.currentLayer || this.app.layerManager?.currentLayer || "Layer 0";
    const names = this._getLayerNames();
    for (const name of names) {
      this._setLayerProp(name, "frozen", name !== current);
      this._setLayerProp(name, "visible", true);
    }
    this.app.renderer.dirty = true;
    this._syncSummary();
    this._toast(`Focused ${current}`, "success");
  }

  _thawAllLayers() {
    for (const name of this._getLayerNames()) {
      this._setLayerProp(name, "frozen", false);
      this._setLayerProp(name, "visible", true);
    }
    this.app.renderer.dirty = true;
    this._syncSummary();
    this._toast("All layers restored", "success");
  }

  _purgeUnusedLayers() {
    const current = this.engine.currentLayer || this.app.layerManager?.currentLayer || "Layer 0";
    const reserved = new Set(["Layer 0", "Defpoints", current]);
    const used = new Set([...this.engine.entities.values()].map((entity) => entity.layer || "Layer 0"));
    let removed = 0;
    for (const name of this._getLayerNames()) {
      if (reserved.has(name) || used.has(name)) continue;
      const didRemove = this.app.layerManager?.removeLayer?.(name) || this.engine.removeLayer?.(name);
      if (didRemove) removed += 1;
    }
    this.app.renderer.dirty = true;
    this._syncSummary();
    this._toast(removed ? `Purged ${removed} unused layer${removed === 1 ? "" : "s"}` : "No unused layers found", removed ? "success" : "warning");
  }

  _zoomSelection() {
    if (typeof this.app._zoomToSelection === "function") {
      this.app._zoomToSelection();
      return;
    }
    const selected = this.selectionManager.getSelectedEntities();
    const bounds = mergeBounds(selected.map((entity) => entity.getBounds?.()));
    if (!bounds) {
      this._toast("Select geometry first.", "warning");
      return;
    }
    this.viewport.zoomExtents(bounds);
    this.app.renderer.dirty = true;
  }

  _zoomExtents() {
    const bounds = this.engine.getExtents?.();
    if (!bounds) {
      this._toast("Nothing to frame yet.", "warning");
      return;
    }
    this.viewport.zoomExtents(bounds);
    this.app.renderer.dirty = true;
  }

  _duplicateSelection() {
    if (typeof this.app._duplicateInPlace === "function") {
      this.app._duplicateInPlace();
      return;
    }
    this._toast("Duplicate tool is not available.", "warning");
  }

  _eraseSelection() {
    const selected = this.selectionManager.getSelectedEntities();
    if (!selected.length) {
      this._toast("Select geometry first.", "warning");
      return;
    }
    selected.forEach((entity) => this.engine.removeEntity(entity.id));
    this.selectionManager.deselectAll();
    this.app.renderer.dirty = true;
    this._toast(`Deleted ${selected.length} item${selected.length === 1 ? "" : "s"}`, "success");
  }

  _getViewStore() {
    try {
      return JSON.parse(localStorage.getItem(VIEW_STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  _getSavedViews() {
    const scope = normalizeScope(this.fileWorkflow?.getState?.());
    const store = this._getViewStore();
    const views = Array.isArray(store[scope]) ? store[scope] : [];
    for (const view of views) {
      this.viewport.saveView?.(view.name);
      this.viewport._savedViews?.set?.(view.name, { panX: view.panX, panY: view.panY, zoom: view.zoom });
    }
    return views;
  }

  _setSavedViews(views) {
    const scope = normalizeScope(this.fileWorkflow?.getState?.());
    const store = this._getViewStore();
    store[scope] = views;
    localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(store));
  }

  _getLayerNames() {
    if (typeof this.app.layerManager?.getLayerNames === "function") {
      return this.app.layerManager.getLayerNames();
    }
    return Object.keys(this.engine.layers || {});
  }

  _setLayerProp(name, prop, value) {
    if (!name) return;
    this.app.layerManager?.setLayerProperty?.(name, prop, value);
    if (this.engine.layers?.[name] && this.engine.layers[name][prop] !== value) {
      this.engine.setLayerProperty?.(name, prop, value);
    }
  }

  _showSaveChoices() {
    this._openModal("Save drawing", `
      <div class="workspace-file-choice-grid">
        <button class="workspace-file-choice" data-action="save-project"><strong>AfroDraft project</strong><span>Best for editing, autosave, recovery, and working sessions.</span></button>
        <button class="workspace-file-choice" data-action="save-dxf"><strong>DXF exchange</strong><span>Best for AutoCAD-compatible 2D sharing and handoff.</span></button>
        <button class="workspace-file-choice" data-action="save-dwg"><strong>DWG bridge</strong><span>Uses the connected adapter when one is installed.</span></button>
      </div>
    `, `<button class="modal-btn" data-close-modal="true">Close</button>`);
  }

  _showDwgImportModal(file) {
    this._openModal("DWG bridge not connected", `
      <div class="workspace-transition-card">
        <strong>${escapeHtml(file?.name || "DWG file")}</strong>
        <p class="workspace-note">AfroDraft is ready for DWG through an adapter hook, but no converter is wired into this build yet. The clean fallback is DXF plus a native AfroDraft project.</p>
        <div class="workspace-file-choice-grid">
          <button class="workspace-file-choice" data-action="choose-dxf"><strong>Choose converted DXF</strong><span>Continue the import flow immediately.</span></button>
        </div>
      </div>
    `, `<button class="modal-btn" data-close-modal="true">Close</button>`);
  }

  _showDwgSaveModal() {
    this._openModal("DWG save needs a bridge", `
      <div class="workspace-transition-card">
        <p class="workspace-note">This build is prepared for DWG export, but a live DWG adapter is not attached. You can still keep the workflow seamless by saving the editable project and a DXF copy right now.</p>
        <div class="workspace-file-choice-grid">
          <button class="workspace-file-choice" data-action="save-project-copy"><strong>Save AfroDraft project</strong><span>Editable source of truth.</span></button>
          <button class="workspace-file-choice" data-action="save-dxf-copy"><strong>Export DXF copy</strong><span>Shareable 2D CAD handoff.</span></button>
        </div>
      </div>
    `, `<button class="modal-btn" data-close-modal="true">Close</button>`);
  }

  _openModal(title, body, footer = "") {
    const overlay = document.getElementById("modal-overlay");
    overlay.innerHTML = `<div class="modal"><div class="modal-header"><span class="modal-title">${escapeHtml(title)}</span><button class="modal-close" id="workspace-modal-close">&times;</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ""}</div>`;
    overlay.classList.remove("hidden");
    overlay.querySelector("#workspace-modal-close")?.addEventListener("click", () => this._closeModal());
    overlay.querySelectorAll("[data-close-modal='true']").forEach((button) => button.addEventListener("click", () => this._closeModal()));
    overlay.onclick = (event) => {
      if (event.target === overlay) {
        this._closeModal();
        return;
      }
      this._handleUiClick(event);
    };
    return overlay;
  }

  _closeModal(after) {
    document.getElementById("modal-overlay")?.classList.add("hidden");
    document.getElementById("modal-overlay").innerHTML = "";
    return after;
  }

  _toast(message, tone = "") {
    if (typeof this.app._showToast === "function") {
      this.app._showToast(message, tone);
      return;
    }
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = tone ? tone : "";
    toast.classList.remove("hidden");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.add("hidden"), 1800);
  }

  _click(id) {
    const button = document.getElementById(id);
    if (!button) return false;
    button.click();
    return true;
  }

  _loadState() {
    try {
      return { sidebarCollapsed: false, ribbonCollapsed: false, inspectorCollapsed: false, commandCollapsed: false, focusMode: false, inspectorTab: "props", ribbonMode: "quick", ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
    } catch {
      return { sidebarCollapsed: false, ribbonCollapsed: false, inspectorCollapsed: false, commandCollapsed: false, focusMode: false, inspectorTab: "props", ribbonMode: "quick" };
    }
  }

  _saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }
}

export function initWorkspaceShell() {
  const mount = () => {
    if (!window.app || window.app._workspaceShell) return false;
    new WorkspaceShell(window.app);
    return true;
  };
  if (mount()) return;
  window.addEventListener("afrodraft-ready", () => mount(), { once: true });
  let tries = 0;
  const timer = setInterval(() => {
    if (mount() || tries++ > 50) clearInterval(timer);
  }, 200);
}

initWorkspaceShell();
