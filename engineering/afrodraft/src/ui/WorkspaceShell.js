import { TitleBlock } from "../layout/TitleBlock.js";
import { LayoutManager } from "../layout/LayoutManager.js";
import { DrawingFile } from "../core/DrawingFile.js";
import { FileWorkflow } from "./FileWorkflow.js";

const STORAGE_KEY = "afrodraft-workspace-layout-v2";
const VIEW_STORAGE_KEY = "afrodraft-saved-views-v1";
const SELECTION_SET_STORAGE_KEY = "afrodraft-selection-sets-v1";
const LAYER_STATE_STORAGE_KEY = "afrodraft-layer-states-v1";
const LAYOUT_STORAGE_KEY = "afrodraft-layout-tabs-v1";
const DEFAULT_OSNAPS = ["endpoint", "midpoint", "center", "intersection", "perpendicular", "nearest"];
const PAPER_SIZES_MM = {
  A4: { w: 297, h: 210 },
  A3: { w: 420, h: 297 },
  A2: { w: 594, h: 420 },
  A1: { w: 841, h: 594 },
  "ANSI A": { w: 279.4, h: 215.9 },
  "ANSI B": { w: 431.8, h: 279.4 },
  Letter: { w: 279.4, h: 215.9 },
};
const SNAP_PROFILES = {
  precision: { label: "Precision", hint: "Ortho on", snaps: DEFAULT_OSNAPS, ortho: true, polar: false, tracking: true },
  drafting: { label: "Drafting", hint: "Polar on", snaps: ["endpoint", "midpoint", "center", "intersection"], ortho: false, polar: true, tracking: true },
  layout: { label: "Layout", hint: "Sheet work", snaps: ["endpoint", "midpoint", "intersection", "perpendicular"], ortho: true, polar: true, tracking: false },
  review: { label: "Review", hint: "Light snaps", snaps: ["endpoint", "midpoint", "center"], ortho: false, polar: false, tracking: false },
  off: { label: "Off", hint: "Free cursor", snaps: [], ortho: false, polar: false, tracking: false },
};
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

function slugifySection(value) {
  return String(value || "section").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export class WorkspaceShell {
  constructor(app) {
    this.app = app;
    this.engine = app.engine;
    this.viewport = app.viewport;
    this.selectionManager = app.selectionManager;
    this.blockManager = app.blockManager || this.engine.blockManager;
    this.layoutManager = new LayoutManager(this.engine);
    this.state = this._loadState();
    this.dropDepth = 0;
    this._autosaveTimer = null;
    this._panelDrag = null;
    this._renderShell();
    this._setupInspectorTabs();
    this._setupWorkspacePanels();
    this.fileWorkflow = new FileWorkflow(app, {
      onToast: (message, tone) => this._toast(message, tone),
      onStateChange: () => {
        this._rehydrateLayoutState();
        this._syncSummary();
        this._refreshLayoutPanel();
        this._refreshViewsPanel();
        this._refreshSelectionSetsPanel();
        this._refreshLayerStatesPanel();
        this._refreshSessionPanel();
      },
      onNeedDwgImportHelp: (file) => this._showDwgImportModal(file),
      onNeedDwgSaveHelp: () => this._showDwgSaveModal(),
    });
    this.fileWorkflow.bindLegacyControls();
    this.fileWorkflow.bindShortcuts();
    this._rehydrateLayoutState();
    this._syncAutosaveTimer();
    this._setupRibbonModes();
    this._bindEvents();
    this._bindDragAndDrop();
    this._applyLayout();
    this._setInspectorTab(this.state.inspectorTab || "props", false);
    this._setRibbonMode(this.state.ribbonMode || "quick", false);
    this._refreshBlockPanel();
    this._refreshViewsPanel();
    this._refreshSelectionSetsPanel();
    this._refreshLayerStatesPanel();
    this._refreshLayoutPanel();
    this._refreshCommandStack();
    this._refreshSessionPanel();
    this._syncSummary();
    this.app._workspaceShell = this;
  }

  _renderShell() {
    const appEl = document.getElementById("cad-app");
    const mainArea = document.getElementById("main-area");
    const canvasWrap = document.getElementById("canvas-wrap");
    const tabBar = document.getElementById("tab-bar");
    appEl.classList.add("workspace-shell-ready");
    if (tabBar && !document.getElementById("workspace-topbar-controls")) {
      document.getElementById("tab-new")?.insertAdjacentHTML("beforebegin", `
        <div id="workspace-topbar-controls">
          <button class="workspace-topbar-toggle" data-toggle="tabbarCollapsed" id="workspace-top-tabs" title="Toggle tab bar">Tabs</button>
          <button class="workspace-topbar-toggle" data-toggle="ribbonCollapsed" id="workspace-top-ribbon" title="Toggle ribbon">Ribbon</button>
        </div>
      `);
    }
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
              <span class="workspace-sidebar__eyebrow">AfroDraft Control Surface</span>
              <h2 class="workspace-sidebar__title">Precision 2D drafting, simplified</h2>
              <p class="workspace-sidebar__subtitle">Native project sessions, DXF exchange, DWG bridge status, and disciplined layer and view control for technical work.</p>
              <div class="workspace-mode-strip">
                <span class="workspace-mode-strip__eyebrow">Active workspace</span>
                <div class="workspace-mode-strip__row">
                  <strong id="workspace-mode-name">Draft</strong>
                  <span id="workspace-mode-footprint">Full editor</span>
                </div>
              </div>
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
              <div class="workspace-session-strip">
                <div class="workspace-session-strip__row">
                  <span>Save path</span>
                  <strong id="workspace-session-save-mode">Project save</strong>
                </div>
                <div class="workspace-session-strip__row">
                  <span>Autosave</span>
                  <strong id="workspace-session-autosave">Every 3 min</strong>
                </div>
                <div class="workspace-session-strip__row">
                  <span>Recovery</span>
                  <strong id="workspace-session-recovery">Clear</strong>
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
              <summary><span class="workspace-section__title">Snap Profiles</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                ${Object.entries(SNAP_PROFILES).map(([key, profile]) => `<button class="workspace-tool-btn" data-action="snap-${key}"><span class="workspace-tool-btn__icon">${profile.label.slice(0, 2)}</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">${profile.label}</span><span class="workspace-tool-btn__shortcut">${profile.hint}</span></span></button>`).join("")}
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Workspaces</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                <button class="workspace-tool-btn" data-action="workspace-draft"><span class="workspace-tool-btn__icon">Dr</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Draft</span><span class="workspace-tool-btn__shortcut">Full editor</span></span></button>
                <button class="workspace-tool-btn" data-action="workspace-review"><span class="workspace-tool-btn__icon">Rv</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Review</span><span class="workspace-tool-btn__shortcut">Less chrome</span></span></button>
                <button class="workspace-tool-btn" data-action="workspace-plot"><span class="workspace-tool-btn__icon">Pl</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Plot</span><span class="workspace-tool-btn__shortcut">Sheet setup</span></span></button>
                <button class="workspace-tool-btn" data-action="workspace-canvas"><span class="workspace-tool-btn__icon">Mx</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Canvas Max</span><span class="workspace-tool-btn__shortcut">Largest work area</span></span></button>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Workflows</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-flow-list">
                <button class="workspace-flow-card" data-action="workflow-sheet">
                  <span class="workspace-flow-card__eyebrow">Setup</span>
                  <strong>Sheet Setup</strong>
                  <span class="workspace-flow-card__copy">Units, paper limits, and title block in one guided pass.</span>
                </button>
                <button class="workspace-flow-card" data-action="workflow-draft">
                  <span class="workspace-flow-card__eyebrow">Create</span>
                  <strong>Draft Session</strong>
                  <span class="workspace-flow-card__copy">Switch to draw mode, restore drafting aids, and prep the canvas fast.</span>
                </button>
                <button class="workspace-flow-card" data-action="workflow-review">
                  <span class="workspace-flow-card__eyebrow">Review</span>
                  <strong>Markup Review</strong>
                  <span class="workspace-flow-card__copy">Open a calmer review workspace and route notes onto a markups layer.</span>
                </button>
                <button class="workspace-flow-card" data-action="workflow-handoff">
                  <span class="workspace-flow-card__eyebrow">Deliver</span>
                  <strong>Handoff Pack</strong>
                  <span class="workspace-flow-card__copy">Audit, save, export DXF, and prep a clean package for others.</span>
                </button>
                <button class="workspace-flow-card" data-action="workflow-safety">
                  <span class="workspace-flow-card__eyebrow">Protect</span>
                  <strong>Session Safety</strong>
                  <span class="workspace-flow-card__copy">Manage autosave, check recovery, and keep the session resilient.</span>
                </button>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Canvas</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                <button class="workspace-tool-btn" data-action="rulers"><span class="workspace-tool-btn__icon">Ru</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Rulers</span><span class="workspace-tool-btn__shortcut">Top and left</span></span></button>
                <button class="workspace-tool-btn" data-action="minimap"><span class="workspace-tool-btn__icon">Mm</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Minimap</span><span class="workspace-tool-btn__shortcut">View navigator</span></span></button>
                <button class="workspace-tool-btn" data-action="zoom-hud"><span class="workspace-tool-btn__icon">Zh</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Zoom HUD</span><span class="workspace-tool-btn__shortcut">Corner controls</span></span></button>
                <button class="workspace-tool-btn" data-action="status-bar"><span class="workspace-tool-btn__icon">Sb</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Status Bar</span><span class="workspace-tool-btn__shortcut">Bottom toggles</span></span></button>
                <button class="workspace-tool-btn" data-action="theme-picker"><span class="workspace-tool-btn__icon">Th</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Theme</span><span class="workspace-tool-btn__shortcut">CAD palettes</span></span></button>
                <button class="workspace-tool-btn" data-action="canvas-background"><span class="workspace-tool-btn__icon">Bg</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Background</span><span class="workspace-tool-btn__shortcut">Canvas color</span></span></button>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Power Tools</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                <button class="workspace-tool-btn" data-action="quick-select"><span class="workspace-tool-btn__icon">Qs</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Quick Select</span><span class="workspace-tool-btn__shortcut">Filter objects</span></span></button>
                <button class="workspace-tool-btn" data-action="find-text"><span class="workspace-tool-btn__icon">Ft</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Find Text</span><span class="workspace-tool-btn__shortcut">Search notes</span></span></button>
                <button class="workspace-tool-btn" data-action="audit-drawing"><span class="workspace-tool-btn__icon">Au</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Audit</span><span class="workspace-tool-btn__shortcut">Check drawing</span></span></button>
                <button class="workspace-tool-btn" data-action="command-history"><span class="workspace-tool-btn__icon">Ch</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">History</span><span class="workspace-tool-btn__shortcut">Command log</span></span></button>
                <button class="workspace-tool-btn" data-action="entity-list"><span class="workspace-tool-btn__icon">El</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Entity List</span><span class="workspace-tool-btn__shortcut">Object ledger</span></span></button>
                <button class="workspace-tool-btn" data-action="goto-coordinate"><span class="workspace-tool-btn__icon">Go</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Go To</span><span class="workspace-tool-btn__shortcut">Exact coordinate</span></span></button>
                <button class="workspace-tool-btn" data-action="undo-history"><span class="workspace-tool-btn__icon">Uh</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Undo Stack</span><span class="workspace-tool-btn__shortcut">Session trail</span></span></button>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Selection Deck</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                <button class="workspace-tool-btn" data-action="select-layer"><span class="workspace-tool-btn__icon">Sl</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Select Layer</span><span class="workspace-tool-btn__shortcut">Current layer set</span></span></button>
                <button class="workspace-tool-btn" data-action="select-type"><span class="workspace-tool-btn__icon">St</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Select Type</span><span class="workspace-tool-btn__shortcut">Entity family</span></span></button>
                <button class="workspace-tool-btn" data-action="select-similar"><span class="workspace-tool-btn__icon">Ss</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Select Similar</span><span class="workspace-tool-btn__shortcut">Match sample</span></span></button>
                <button class="workspace-tool-btn" data-action="invert-selection"><span class="workspace-tool-btn__icon">Iv</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Invert</span><span class="workspace-tool-btn__shortcut">Flip current pick</span></span></button>
                <button class="workspace-tool-btn" data-action="deselect-all"><span class="workspace-tool-btn__icon">Ds</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Deselect</span><span class="workspace-tool-btn__shortcut">Clear selection</span></span></button>
                <button class="workspace-tool-btn" data-action="selection-color"><span class="workspace-tool-btn__icon">Cl</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Set Color</span><span class="workspace-tool-btn__shortcut">Selection color</span></span></button>
                <button class="workspace-tool-btn" data-action="match-properties"><span class="workspace-tool-btn__icon">Mp</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Match Props</span><span class="workspace-tool-btn__shortcut">Transfer style</span></span></button>
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
              <summary><span class="workspace-section__title">Selection Sets</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-block-toolbar">
                  <button class="workspace-block-button" data-action="save-selection-set">Save current selection</button>
                </div>
                <div id="workspace-selection-set-list"></div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">View Stack</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-block-toolbar">
                  <button class="workspace-block-button" data-action="save-view">Save current view</button>
                  <button class="workspace-block-button" data-action="zoom-previous">Zoom previous</button>
                  <button class="workspace-block-button" data-action="zoom-selection">Zoom selected</button>
                  <button class="workspace-block-button" data-action="zoom-layer">Zoom layer</button>
                  <button class="workspace-block-button" data-action="page-setup">Page setup</button>
                </div>
                <div id="workspace-view-list"></div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Layouts</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-block-toolbar">
                  <button class="workspace-block-button" data-action="add-layout">Add layout</button>
                  <button class="workspace-block-button" data-action="activate-layout" data-layout-name="Model">Model</button>
                  <button class="workspace-block-button" data-action="page-setup">Page setup</button>
                  <button class="workspace-block-button" data-action="plot">Plot</button>
                </div>
                <div id="workspace-layout-list"></div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Layer Deck</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                <button class="workspace-tool-btn" data-action="freeze-current"><span class="workspace-tool-btn__icon">Fc</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Freeze Current</span><span class="workspace-tool-btn__shortcut">Park active layer</span></span></button>
                <button class="workspace-tool-btn" data-action="freeze-others"><span class="workspace-tool-btn__icon">Fo</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Freeze Others</span><span class="workspace-tool-btn__shortcut">Focus current layer</span></span></button>
                <button class="workspace-tool-btn" data-action="thaw-layers"><span class="workspace-tool-btn__icon">Th</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Thaw All</span><span class="workspace-tool-btn__shortcut">Restore visibility</span></span></button>
                <button class="workspace-tool-btn" data-action="move-to-layer"><span class="workspace-tool-btn__icon">Mv</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Move To Layer</span><span class="workspace-tool-btn__shortcut">Reclassify pick</span></span></button>
                <button class="workspace-tool-btn" data-action="lock-selection"><span class="workspace-tool-btn__icon">Lk</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Lock Selected</span><span class="workspace-tool-btn__shortcut">Protect entities</span></span></button>
                <button class="workspace-tool-btn" data-action="purge-layers"><span class="workspace-tool-btn__icon">Pg</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Purge Layers</span><span class="workspace-tool-btn__shortcut">Remove unused</span></span></button>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Layer States</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-block-toolbar">
                  <button class="workspace-block-button" data-action="save-layer-state">Save layer state</button>
                </div>
                <div id="workspace-layer-state-list"></div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Standards</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body workspace-tool-grid">
                <button class="workspace-tool-btn" data-action="title-block"><span class="workspace-tool-btn__icon">Tb</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Title Block</span><span class="workspace-tool-btn__shortcut">Sheet border</span></span></button>
                <button class="workspace-tool-btn" data-action="text-styles"><span class="workspace-tool-btn__icon">Tx</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Text Styles</span><span class="workspace-tool-btn__shortcut">Annotate system</span></span></button>
                <button class="workspace-tool-btn" data-action="dim-styles"><span class="workspace-tool-btn__icon">Dm</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Dim Styles</span><span class="workspace-tool-btn__shortcut">Measurement rules</span></span></button>
                <button class="workspace-tool-btn" data-action="point-style"><span class="workspace-tool-btn__icon">Pt</span><span class="workspace-tool-btn__meta"><span class="workspace-tool-btn__name">Point Style</span><span class="workspace-tool-btn__shortcut">Survey markers</span></span></button>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Session</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-block-toolbar">
                  <button class="workspace-block-button" data-action="recent">Recent</button>
                  <button class="workspace-block-button" data-action="workflow-safety">Safety</button>
                  <button class="workspace-block-button" data-action="save-autosave">Save autosave</button>
                  <button class="workspace-block-button" data-action="clear-autosave">Clear autosave</button>
                </div>
                <div id="workspace-session-panel"></div>
              </div>
            </section>
            <section class="workspace-section" open>
              <summary><span class="workspace-section__title">Command Stack</span><span class="workspace-section__chevron">v</span></summary>
              <div class="workspace-section__body">
                <div class="workspace-block-toolbar">
                  <button class="workspace-block-button" data-action="repeat-last">Repeat last</button>
                  <button class="workspace-block-button" data-action="command-palette">Palette</button>
                  <button class="workspace-block-button" data-action="clear-command-history">Clear</button>
                </div>
                <div id="workspace-command-stack"></div>
              </div>
            </section>
          </div>
        </aside>
      `);
    }
    this._upgradeWorkspaceSections();
    if (!document.getElementById("workspace-dock-controls")) {
      canvasWrap.insertAdjacentHTML("beforeend", `
        <div id="workspace-dock-controls">
          <button class="workspace-dock-pill" data-toggle="tabbarCollapsed" id="workspace-dock-tabs">Tabs</button>
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

  _setupWorkspacePanels() {
    const inspectorPanel = document.getElementById("properties-panel");
    const inspectorHeader = inspectorPanel?.querySelector(".panel-header");
    if (inspectorPanel && inspectorHeader && !inspectorHeader.querySelector(".workspace-panel-actions")) {
      inspectorPanel.dataset.panelId = "inspector";
      inspectorHeader.classList.add("workspace-panel-header");
      inspectorHeader.insertAdjacentHTML("beforeend", `
        <div class="workspace-panel-actions">
          <button class="workspace-panel-chip" data-action="toggle-panel-float" data-panel="inspector" title="Float or dock inspector">Float</button>
        </div>
      `);
      inspectorHeader.addEventListener("mousedown", (event) => this._startPanelDrag(event, "inspector"));
    }

    const commandArea = document.getElementById("command-area");
    if (commandArea && !commandArea.querySelector(".workspace-commandbar")) {
      commandArea.dataset.panelId = "command";
      commandArea.insertAdjacentHTML("afterbegin", `
        <div class="workspace-commandbar">
          <div class="workspace-commandbar__meta">
            <span class="workspace-commandbar__eyebrow">Console</span>
            <strong class="workspace-commandbar__title">Command</strong>
          </div>
          <div class="workspace-commandbar__actions">
            <button class="workspace-panel-chip" data-action="repeat-last">Repeat</button>
            <button class="workspace-panel-chip" data-action="clear-command-history">Clear</button>
            <button class="workspace-panel-chip" data-action="toggle-panel-float" data-panel="command" title="Float or dock command bar">Float</button>
          </div>
        </div>
      `);
      commandArea.querySelector(".workspace-commandbar")?.addEventListener("mousedown", (event) => this._startPanelDrag(event, "command"));
    }

    this._applyFloatingPanels();
  }

  _setupRibbonModes() {
    const ribbon = document.getElementById("ribbon");
    if (!ribbon) return;
    if (!ribbon.querySelector(".ribbon-modebar")) {
      ribbon.insertAdjacentHTML("afterbegin", `
        <div class="ribbon-modebar">
          <div class="ribbon-modebar-tools">
            ${["quick", "draw", "edit", "annotate", "setup", "all"].map((mode) => `<button class="ribbon-mode-btn" data-mode="${mode}">${mode}</button>`).join("")}
          </div>
          <div class="ribbon-modebar-status">
            <span class="ribbon-modebar-chip" id="ribbon-status-workspace">Draft</span>
            <span class="ribbon-modebar-chip" id="ribbon-status-space">Model</span>
            <span class="ribbon-modebar-chip" id="ribbon-status-selection">0 selected</span>
            <span class="ribbon-modebar-chip" id="ribbon-status-units">mm</span>
          </div>
          <div class="ribbon-modebar-actions">
            <button class="ribbon-surface-btn" data-action="undo">Undo</button>
            <button class="ribbon-surface-btn" data-action="redo">Redo</button>
            <button class="ribbon-surface-btn" data-action="focus">Focus</button>
            <button class="ribbon-surface-btn" data-action="toggle-panel-float" data-panel="inspector" id="ribbon-float-inspector">Inspector</button>
            <button class="ribbon-surface-btn" data-action="toggle-panel-float" data-panel="command" id="ribbon-float-command">Command</button>
            <button class="ribbon-surface-btn" data-action="toggle-ribbon-compact" id="ribbon-compact-toggle">Compact</button>
          </div>
        </div>
      `);
    }
    this._enhanceRibbonGroups();
  }

  _enhanceRibbonGroups() {
    const ribbon = document.getElementById("ribbon");
    if (!ribbon) return;
    ribbon.querySelectorAll(".ribbon-group").forEach((group, index) => {
      const label = group.querySelector(".ribbon-group-label");
      if (!label) return;
      const key = slugifySection(label.textContent || `group-${index + 1}`);
      group.dataset.group = key;
      if (!label.querySelector(".ribbon-group-toggle")) {
        const title = label.textContent.trim();
        label.innerHTML = `<span class="ribbon-group-label__text">${escapeHtml(title)}</span><button class="ribbon-group-toggle" data-action="toggle-ribbon-group" data-group="${key}" title="Collapse ${escapeHtml(title)}">v</button>`;
      }
    });
    this._applyRibbonGroupState();
  }

  _applyRibbonGroupState() {
    const ribbon = document.getElementById("ribbon");
    if (!ribbon) return;
    ribbon.classList.toggle("ribbon-compact", !!this.state.ribbonCompact);
    ribbon.querySelectorAll(".ribbon-group").forEach((group) => {
      const key = group.dataset.group;
      const collapsed = !!this.state.ribbonCompact || !!this.state.ribbonGroupState?.[key];
      group.classList.toggle("is-collapsed", collapsed);
    });
    document.getElementById("ribbon-compact-toggle")?.classList.toggle("is-active", !!this.state.ribbonCompact);
  }

  _togglePanelFloating(panelId) {
    if (!panelId) return;
    const current = !!this.state.floatingPanels?.[panelId]?.floating;
    this._setPanelFloating(panelId, !current);
  }

  _setPanelFloating(panelId, floating, position = {}) {
    this.state.floatingPanels ||= {};
    const current = this.state.floatingPanels[panelId] || {};
    const next = { ...current, floating: !!floating };
    if (floating) {
      const fallback = this._getFloatingPanelBounds(panelId, position.width);
      next.x = Number.isFinite(position.x) ? position.x : Number.isFinite(current.x) ? current.x : fallback.x;
      next.y = Number.isFinite(position.y) ? position.y : Number.isFinite(current.y) ? current.y : fallback.y;
      next.width = Number.isFinite(position.width) ? position.width : Number.isFinite(current.width) ? current.width : fallback.width;
    }
    this.state.floatingPanels[panelId] = next;
    this._applyFloatingPanels();
    this._saveState();
  }

  _getFloatingPanelBounds(panelId, widthHint) {
    const isCommand = panelId === "command";
    const width = Math.max(isCommand ? 420 : 296, Math.min(Number(widthHint) || (isCommand ? 560 : 340), window.innerWidth - 32));
    return {
      width,
      x: isCommand ? Math.max(16, window.innerWidth - width - 28) : Math.max(16, window.innerWidth - width - 24),
      y: isCommand ? Math.max(84, window.innerHeight - 212) : 96,
    };
  }

  _applyFloatingPanels() {
    const appEl = document.getElementById("cad-app");
    const panels = {
      inspector: document.getElementById("properties-panel"),
      command: document.getElementById("command-area"),
    };
    Object.entries(panels).forEach(([panelId, panel]) => {
      if (!panel) return;
      const floatingState = this.state.floatingPanels?.[panelId] || {};
      const floating = !!floatingState.floating;
      panel.classList.toggle("workspace-panel-floating", floating);
      panel.classList.toggle("workspace-panel-docked", !floating);
      if (floating) {
        const bounds = this._getFloatingPanelBounds(panelId, floatingState.width);
        const width = Math.max(bounds.width, Math.min(Number(floatingState.width) || bounds.width, window.innerWidth - 32));
        const maxX = Math.max(16, window.innerWidth - width - 16);
        const maxY = Math.max(56, window.innerHeight - (panelId === "command" ? 108 : 180));
        const x = Math.min(Math.max(16, Number(floatingState.x) || bounds.x), maxX);
        const y = Math.min(Math.max(56, Number(floatingState.y) || bounds.y), maxY);
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
        panel.style.width = `${width}px`;
        this.state.floatingPanels[panelId] = { ...floatingState, floating: true, x, y, width };
      } else {
        panel.style.left = "";
        panel.style.top = "";
        panel.style.width = "";
      }
      document.querySelectorAll(`[data-action="toggle-panel-float"][data-panel="${panelId}"]`).forEach((button) => {
        button.classList.toggle("is-active", floating);
        if (button.closest(".ribbon-modebar-actions")) {
          button.textContent = panelId === "inspector" ? "Inspector" : "Command";
        } else {
          button.textContent = floating ? "Dock" : "Float";
        }
      });
      appEl?.classList.toggle(`${panelId}-floating`, floating);
    });

    if (!this._floatingResizeBound) {
      this._floatingResizeBound = () => this._applyFloatingPanels();
      window.addEventListener("resize", this._floatingResizeBound);
    }
  }

  _startPanelDrag(event, panelId) {
    if (event.button !== 0) return;
    if (event.target.closest("button, input, select, textarea, a")) return;
    const panel = panelId === "inspector" ? document.getElementById("properties-panel") : document.getElementById("command-area");
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    if (!this.state.floatingPanels?.[panelId]?.floating) {
      const bounds = this._getFloatingPanelBounds(panelId, rect.width);
      this._setPanelFloating(panelId, true, { x: rect.left, y: rect.top, width: bounds.width });
    }
    const activePanel = panelId === "inspector" ? document.getElementById("properties-panel") : document.getElementById("command-area");
    const activeRect = activePanel.getBoundingClientRect();
    this._panelDrag = {
      panelId,
      offsetX: event.clientX - activeRect.left,
      offsetY: event.clientY - activeRect.top,
      move: (moveEvent) => this._onPanelDrag(moveEvent),
      stop: () => this._endPanelDrag(),
    };
    document.addEventListener("mousemove", this._panelDrag.move);
    document.addEventListener("mouseup", this._panelDrag.stop, { once: true });
    event.preventDefault();
  }

  _onPanelDrag(event) {
    if (!this._panelDrag) return;
    const { panelId, offsetX, offsetY } = this._panelDrag;
    const panelState = this.state.floatingPanels?.[panelId];
    if (!panelState) return;
    const width = panelState.width || this._getFloatingPanelBounds(panelId).width;
    const maxX = Math.max(16, window.innerWidth - width - 16);
    const maxY = Math.max(56, window.innerHeight - (panelId === "command" ? 108 : 180));
    panelState.x = Math.min(Math.max(16, event.clientX - offsetX), maxX);
    panelState.y = Math.min(Math.max(56, event.clientY - offsetY), maxY);
    this._applyFloatingPanels();
  }

  _endPanelDrag() {
    if (!this._panelDrag) return;
    document.removeEventListener("mousemove", this._panelDrag.move);
    this._panelDrag = null;
    this._saveState();
  }

  _clearCommandHistory() {
    document.getElementById("cmd-history")?.replaceChildren();
    if (Array.isArray(this.app._cmdHistory)) this.app._cmdHistory.length = 0;
    if (Array.isArray(this.app._recentCommands)) this.app._recentCommands.length = 0;
    if (this.app.commandRegistry) this.app.commandRegistry.lastCommandName = null;
    const commandInput = document.getElementById("cmd-input");
    if (commandInput) commandInput.value = "";
    this._refreshCommandStack();
    this._toast("Command history cleared", "success");
  }

  _bindEvents() {
    document.getElementById("tab-bar")?.addEventListener("click", (event) => this._handleUiClick(event));
    document.getElementById("workspace-sidebar")?.addEventListener("click", (event) => this._handleUiClick(event));
    document.getElementById("workspace-dock-controls")?.addEventListener("click", (event) => this._handleUiClick(event));
    document.getElementById("properties-panel")?.addEventListener("click", (event) => this._handleUiClick(event));
    document.getElementById("ribbon")?.addEventListener("click", (event) => this._handleUiClick(event));
    this.engine.on("entity-added", () => { this._refreshBlockPanel(); this._refreshSelectionSetsPanel(); this._syncSummary(); });
    this.engine.on("entity-removed", () => { this._refreshBlockPanel(); this._refreshSelectionSetsPanel(); this._syncSummary(); });
    this.engine.on("selection-changed", () => this._syncSummary());
    this.engine.on("layer-changed", () => { this._refreshLayerStatesPanel(); this._syncSummary(); });
    this.engine.on("current-layer-changed", () => { this._refreshLayerStatesPanel(); this._syncSummary(); });
    this.engine.on("modified-changed", () => this._syncSummary());
    this.engine.on("drawing-loaded", () => {
      this._rehydrateLayoutState();
      this._refreshBlockPanel();
      this._refreshViewsPanel();
      this._refreshSelectionSetsPanel();
      this._refreshLayerStatesPanel();
      this._refreshLayoutPanel();
      this._refreshCommandStack();
      this._syncSummary();
    });
    this.engine.on("drawing-cleared", () => {
      this._rehydrateLayoutState();
      this._refreshBlockPanel();
      this._refreshViewsPanel();
      this._refreshSelectionSetsPanel();
      this._refreshLayerStatesPanel();
      this._refreshLayoutPanel();
      this._refreshCommandStack();
      this._syncSummary();
    });
    this.engine.on("block-defined", () => this._refreshBlockPanel());
    this.engine.on("blocks-purged", () => this._refreshBlockPanel());
    ["layout-added", "layout-removed", "layout-renamed", "layout-changed", "active-tab-changed", "viewport-added"].forEach((eventName) => {
      this.engine.on(eventName, () => {
        this._persistLayoutState();
        this._refreshLayoutPanel();
        this._syncSummary();
      });
    });
    const refreshCommands = () => this._refreshCommandStack();
    this.app.commandRegistry?.on?.("command-started", refreshCommands);
    this.app.commandRegistry?.on?.("command-ended", refreshCommands);
    this.app.commandRegistry?.on?.("output", refreshCommands);
  }

  _upgradeWorkspaceSections() {
    const panel = document.querySelector("#workspace-sidebar .workspace-sidebar__panel");
    if (!panel) return;
    Array.from(panel.children)
      .filter((child) => child.matches?.("section.workspace-section"))
      .forEach((section, index) => {
        const title = section.querySelector(".workspace-section__title")?.textContent?.trim() || `section-${index + 1}`;
        const key = slugifySection(title);
        const details = document.createElement("details");
        details.className = section.className;
        details.dataset.section = key;
        const saved = this.state.sectionState?.[key];
        const shouldOpen = saved === undefined ? section.hasAttribute("open") : !!saved;
        if (shouldOpen) details.open = true;
        details.innerHTML = section.innerHTML;
        section.replaceWith(details);
      });
    panel.querySelectorAll("details.workspace-section").forEach((details) => {
      if (details.dataset.enhanced === "true") return;
      details.dataset.enhanced = "true";
      details.addEventListener("toggle", () => {
        this.state.sectionState ||= {};
        this.state.sectionState[details.dataset.section] = details.open;
        this._saveState();
      });
    });
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
    if (action === "undo") return void this.app.commandRegistry?.execute?.("UNDO");
    if (action === "redo") return void this.app.commandRegistry?.execute?.("REDO");
    if (action === "repeat-last") return void (this.app._repeatLastWithToast?.() || this.app.commandRegistry?.repeatLast?.());
    if (action === "clear-command-history") return void this._clearCommandHistory();
    if (action === "toggle-panel-float") return void this._togglePanelFloating(target.dataset.panel);
    if (action === "toggle-ribbon-compact") {
      this.state.ribbonCompact = !this.state.ribbonCompact;
      this._applyRibbonGroupState();
      this._saveState();
      return;
    }
    if (action === "toggle-ribbon-group") {
      const key = target.dataset.group;
      if (!key) return;
      this.state.ribbonCompact = false;
      this.state.ribbonGroupState ||= {};
      this.state.ribbonGroupState[key] = !this.state.ribbonGroupState[key];
      this._applyRibbonGroupState();
      this._saveState();
      return;
    }
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
    if (action.startsWith("snap-")) return void this._applySnapProfile(action.replace("snap-", ""));
    if (action === "workspace-draft") return void this._applyWorkspacePreset("draft");
    if (action === "workspace-review") return void this._applyWorkspacePreset("review");
    if (action === "workspace-plot") return void this._applyWorkspacePreset("plot");
    if (action === "workspace-canvas") return void this._applyWorkspacePreset("canvas");
    if (action === "workflow-sheet") return void this._showSheetWorkflowDialog();
    if (action === "workflow-draft") return void this._runDraftWorkflow();
    if (action === "workflow-review") return void this._runReviewWorkflow();
    if (action === "workflow-handoff") return void this._showHandoffWorkflowDialog();
    if (action === "workflow-safety") return void this._showSafetyWorkflowDialog();
    if (action === "rulers") return void this._toggleLayoutFlag("rulersHidden");
    if (action === "minimap") return void this._toggleLayoutFlag("minimapHidden");
    if (action === "zoom-hud") return void this._toggleLayoutFlag("zoomHudHidden");
    if (action === "status-bar") return void this._toggleLayoutFlag("statusCollapsed");
    if (action === "quick-select") return void (this.app._showQuickSelectDialog?.() || this._click("v7-qselect"));
    if (action === "find-text") return void (this.app._findReplaceText?.() || this._click("v7-findreplace"));
    if (action === "audit-drawing") return void (this.app._auditDrawing?.() || this._click("v7-audit"));
    if (action === "command-history") return void (this.app._showCommandHistory?.() || this._click("v7-cmdhist"));
    if (action === "entity-list") return void this._click("btn-entlist");
    if (action === "goto-coordinate") return void this._click("btn-goto");
    if (action === "undo-history") return void this._click("btn-undo-hist");
    if (action === "units") return void this.app._showUnitsDialog?.();
    if (action === "limits") return void this.app._showLimitsDialog?.();
    if (action === "drawing-stats") return void this.app._showDrawingStats?.();
    if (action === "command-palette") return void this.app._showCommandPalette?.();
    if (action === "theme-picker") return void this.app._showThemePicker?.();
    if (action === "canvas-background") return void this.app._showBackgroundColorPicker?.();
    if (action === "select-layer") return void this._selectByLayer();
    if (action === "select-type") return void this._showSelectTypeDialog();
    if (action === "select-similar") return void this._selectSimilar();
    if (action === "invert-selection") return void this._invertSelection();
    if (action === "deselect-all") return void this.selectionManager?.deselectAll?.();
    if (action === "selection-color") return void (this.app._setSelectionColor?.() || this._click("btn-color"));
    if (action === "match-properties") {
      if (this.app.commandRegistry?.commands?.has?.("MATCHPROP")) return void this.app.commandRegistry.execute("MATCHPROP");
      return void this._click("btn-matchprop");
    }
    if (action === "zoom-selection") return void this._zoomSelection();
    if (action === "zoom-extents") return void this._zoomExtents();
    if (action === "zoom-previous") return void this._zoomPrevious();
    if (action === "duplicate-selection") return void this._duplicateSelection();
    if (action === "erase-selection") return void this._eraseSelection();
    if (action === "isolate-selection") return void this.app._isolateSelection?.();
    if (action === "end-isolation") return void this.app._endIsolation?.();
    if (action === "selection-layer") return void this.app._createLayerFromSelection?.();
    if (action === "plot") return void (this.app._showPlotDialog?.() || this._click("btn-print"));
    if (action === "save-selection-set") return void this._showSaveSelectionSetDialog();
    if (action === "restore-selection-set") return void this._restoreSelectionSet(target.dataset.selectionSet);
    if (action === "delete-selection-set") return void this._deleteSelectionSet(target.dataset.selectionSet);
    if (action === "save-view") return void this._showSaveViewDialog();
    if (action === "page-setup") return void (this.app.dialogs?.showPageSetup?.() || this.app._showPageSetup?.());
    if (action === "restore-view") return void this._restoreSavedView(target.dataset.viewName);
    if (action === "delete-view") return void this._deleteSavedView(target.dataset.viewName);
    if (action === "zoom-layer") return void this._zoomCurrentLayer();
    if (action === "add-layout") return void this._showAddLayoutDialog();
    if (action === "activate-layout") return void this._activateLayout(target.dataset.layoutName);
    if (action === "rename-layout") return void this._showRenameLayoutDialog(target.dataset.layoutName);
    if (action === "delete-layout") return void this._deleteLayout(target.dataset.layoutName);
    if (action === "layout-paper") return void this._showLayoutPaperDialog(target.dataset.layoutName);
    if (action === "layout-title-block") return void this._showLayoutTitleBlockDialog(target.dataset.layoutName);
    if (action === "layout-add-viewport") return void this._addLayoutViewport(target.dataset.layoutName);
    if (action === "freeze-current") return void this._freezeCurrentLayer();
    if (action === "freeze-others") return void this._freezeOtherLayers();
    if (action === "thaw-layers") return void this._thawAllLayers();
    if (action === "move-to-layer") return void this._showMoveToLayerDialog();
    if (action === "lock-selection") return void this._toggleSelectionLock();
    if (action === "purge-layers") return void this._purgeUnusedLayers();
    if (action === "save-layer-state") return void this._showSaveLayerStateDialog();
    if (action === "restore-layer-state") return void this._restoreLayerState(target.dataset.layerState);
    if (action === "delete-layer-state") return void this._deleteLayerState(target.dataset.layerState);
    if (action === "title-block") return void this._showTitleBlockDialog();
    if (action === "text-styles") return void this.app._showTextStyleDialog?.();
    if (action === "dim-styles") return void this.app._showDimStyleDialog?.();
    if (action === "point-style") return void this.app._showPointStyleDialog?.();
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
    if (action === "save-autosave") return void this._saveAutosaveSnapshot();
    if (action === "clear-autosave") return void this._clearAutosaveSnapshot();
    if (action === "open-recent-file") return void this.fileWorkflow.openRecentFile(Number(target.dataset.recentIndex));
    if (action === "run-history-command") return void this.app.commandRegistry?.execute?.(target.dataset.commandName);
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
    this._applyRibbonGroupState();
    if (persist) this._saveState();
  }

  _applyLayout() {
    const appEl = document.getElementById("cad-app");
    const tabBar = document.getElementById("tab-bar");
    const ribbon = document.getElementById("ribbon");
    const panel = document.getElementById("properties-panel");
    const tabbarHidden = this.state.tabbarCollapsed || this.state.focusMode;
    const ribbonHidden = this.state.ribbonCollapsed || this.state.focusMode;
    const rulersHidden = this.state.rulersHidden || this.state.focusMode;
    const minimapHidden = this.state.minimapHidden || this.state.focusMode;
    const zoomHudHidden = this.state.zoomHudHidden || this.state.focusMode;
    const statusHidden = this.state.statusCollapsed || this.state.focusMode;
    appEl?.classList.toggle("sidebar-collapsed", this.state.sidebarCollapsed || this.state.focusMode);
    appEl?.classList.toggle("tabbar-collapsed", !!tabbarHidden);
    appEl?.classList.toggle("command-collapsed", this.state.commandCollapsed || this.state.focusMode);
    appEl?.classList.toggle("status-collapsed", !!statusHidden);
    appEl?.classList.toggle("focus-mode", !!this.state.focusMode);
    appEl?.classList.toggle("rulers-hidden", !!rulersHidden);
    appEl?.classList.toggle("minimap-hidden", !!minimapHidden);
    appEl?.classList.toggle("zoomhud-hidden", !!zoomHudHidden);
    tabBar?.classList.toggle("workspace-hidden", !!tabbarHidden);
    ribbon?.classList.toggle("workspace-hidden", !!ribbonHidden);
    panel?.classList.toggle("collapsed", this.state.inspectorCollapsed || this.state.focusMode);
    this._applyFloatingPanels();
    [["workspace-top-tabs", !tabbarHidden], ["workspace-top-ribbon", !ribbonHidden], ["workspace-dock-tabs", !tabbarHidden], ["workspace-dock-tools", !(this.state.sidebarCollapsed || this.state.focusMode)], ["workspace-dock-ribbon", !ribbonHidden], ["workspace-dock-inspector", !(this.state.inspectorCollapsed || this.state.focusMode)], ["workspace-dock-command", !(this.state.commandCollapsed || this.state.focusMode)], ["workspace-dock-focus", !!this.state.focusMode]].forEach(([id, on]) => document.getElementById(id)?.classList.toggle("is-on", on));
    this._syncWorkspaceControls();
  }

  _syncWorkspaceControls() {
    const profile = this._getWorkspaceProfile();
    const labels = {
      draft: ["Draft", "Full editor"],
      review: ["Review", "Less chrome"],
      plot: ["Plot", "Sheet setup"],
      canvas: ["Canvas Max", "Largest work area"],
    };
    const [modeName, modeFootprint] = labels[profile] || labels.draft;
    document.getElementById("workspace-mode-name")?.replaceChildren(document.createTextNode(modeName));
    document.getElementById("workspace-mode-footprint")?.replaceChildren(document.createTextNode(modeFootprint));
    document.getElementById("ribbon-status-workspace")?.replaceChildren(document.createTextNode(modeName));
    [["workspace-draft", "draft"], ["workspace-review", "review"], ["workspace-plot", "plot"], ["workspace-canvas", "canvas"]].forEach(([action, key]) => {
      document.querySelectorAll(`[data-action="${action}"]`).forEach((button) => button.classList.toggle("is-active", profile === key));
    });
    [["rulers", !(this.state.rulersHidden || this.state.focusMode)], ["minimap", !(this.state.minimapHidden || this.state.focusMode)], ["zoom-hud", !(this.state.zoomHudHidden || this.state.focusMode)], ["status-bar", !(this.state.statusCollapsed || this.state.focusMode)]].forEach(([action, on]) => {
      document.querySelectorAll(`[data-action="${action}"]`).forEach((button) => button.classList.toggle("is-active", !!on));
    });
    Object.keys(SNAP_PROFILES).forEach((key) => {
      document.querySelectorAll(`[data-action="snap-${key}"]`).forEach((button) => button.classList.toggle("is-active", this.state.activeSnapProfile === key));
    });
  }

  _getWorkspaceProfile() {
    if (this.state.focusMode || (this.state.tabbarCollapsed && this.state.ribbonCollapsed && this.state.sidebarCollapsed && this.state.inspectorCollapsed && this.state.commandCollapsed && this.state.statusCollapsed)) {
      return "canvas";
    }
    if (this.state.rulersHidden && this.state.minimapHidden && this.state.zoomHudHidden && this.state.ribbonCollapsed && this.state.commandCollapsed) {
      return "plot";
    }
    if (this.state.ribbonCollapsed && this.state.sidebarCollapsed && this.state.commandCollapsed) {
      return "review";
    }
    return "draft";
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
    document.getElementById("workspace-session-save-mode").textContent = this._getSaveModeLabel(state);
    document.getElementById("workspace-session-autosave").textContent = this.state.autosaveEnabled ? `Every ${this._formatInterval(this.state.autosaveIntervalMs || 180000)}` : "Paused";
    document.getElementById("workspace-session-recovery").textContent = state.recovery?.exists ? "Ready" : "Clear";
    document.getElementById("ribbon-status-selection")?.replaceChildren(document.createTextNode(`${this.selectionManager?.getSelectedEntities?.()?.length || 0} selected`));
    document.getElementById("ribbon-status-space")?.replaceChildren(document.createTextNode(this.layoutManager?.activeTab || "Model"));
    document.getElementById("ribbon-status-units")?.replaceChildren(document.createTextNode(this.engine.units || "mm"));
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

  _refreshSelectionSetsPanel() {
    const panel = document.getElementById("workspace-selection-set-list");
    if (!panel) return;
    const sets = this._getSelectionSets();
    panel.className = "workspace-view-list";
    if (!sets.length) {
      panel.innerHTML = `<div class="workspace-empty-state">Save reusable picks for doors, notes, furniture, or any geometry you revisit often.</div>`;
      return;
    }
    panel.innerHTML = sets.map((entry) => {
      const liveCount = entry.ids.filter((id) => !!this.engine.getEntity(id)).length;
      return `
        <article class="workspace-view-card">
          <div class="workspace-view-card__head">
            <strong>${escapeHtml(entry.name)}</strong>
            <span>${liveCount}/${entry.ids.length} found</span>
          </div>
          <div class="workspace-view-card__meta">
            ${entry.ids.length} saved object${entry.ids.length === 1 ? "" : "s"}
          </div>
          <div class="workspace-view-card__actions">
            <button class="workspace-block-link" data-action="restore-selection-set" data-selection-set="${escapeHtml(entry.name)}">Restore</button>
            <button class="workspace-block-link" data-action="delete-selection-set" data-selection-set="${escapeHtml(entry.name)}">Delete</button>
          </div>
        </article>
      `;
    }).join("");
  }

  _refreshLayerStatesPanel() {
    const panel = document.getElementById("workspace-layer-state-list");
    if (!panel) return;
    const states = this._getLayerStates();
    panel.className = "workspace-view-list";
    if (!states.length) {
      panel.innerHTML = `<div class="workspace-empty-state">Capture layer visibility and freeze patterns for drafting, review, and plotting without rebuilding them each time.</div>`;
      return;
    }
    panel.innerHTML = states.map((entry) => {
      const visibleCount = entry.layers.filter((layer) => layer.visible && !layer.frozen).length;
      return `
        <article class="workspace-view-card">
          <div class="workspace-view-card__head">
            <strong>${escapeHtml(entry.name)}</strong>
            <span>${visibleCount}/${entry.layers.length} visible</span>
          </div>
          <div class="workspace-view-card__meta">
            Current layer ${escapeHtml(entry.currentLayer || "Layer 0")}
          </div>
          <div class="workspace-view-card__actions">
            <button class="workspace-block-link" data-action="restore-layer-state" data-layer-state="${escapeHtml(entry.name)}">Restore</button>
            <button class="workspace-block-link" data-action="delete-layer-state" data-layer-state="${escapeHtml(entry.name)}">Delete</button>
          </div>
        </article>
      `;
    }).join("");
  }

  _refreshSessionPanel() {
    const panel = document.getElementById("workspace-session-panel");
    if (!panel) return;
    const state = this.fileWorkflow.getState();
    const recovery = state.recovery;
    const recentFiles = (state.recentFiles || []).slice(0, 4);
    const sessionAge = this._formatAge(state.sessionAgeMs || 0);
    const lastRecovery = recovery?.timestamp ? this._formatTimestamp(recovery.timestamp) : "No pending recovery file";
    panel.className = "workspace-view-list";
    panel.innerHTML = [
      `
        <article class="workspace-view-card">
          <div class="workspace-view-card__head">
            <strong>Session runtime</strong>
            <span>${escapeHtml(sessionAge)}</span>
          </div>
          <div class="workspace-view-card__meta">
            Save mode ${escapeHtml(this._getSaveModeLabel(state))}<br>
            ${state.canSave ? "Overwrite ready on this session" : "Save As will create the next revision"}
          </div>
          <div class="workspace-view-card__actions">
            <button class="workspace-block-link" data-action="save">Save</button>
            <button class="workspace-block-link" data-action="save-as">Save As</button>
          </div>
        </article>
      `,
      `
        <article class="workspace-view-card">
          <div class="workspace-view-card__head">
            <strong>Recovery monitor</strong>
            <span>${recovery?.exists ? "Ready" : "Clear"}</span>
          </div>
          <div class="workspace-view-card__meta">
            Autosave ${this.state.autosaveEnabled ? `runs every ${this._formatInterval(this.state.autosaveIntervalMs || 180000)}` : "is paused"}<br>
            ${escapeHtml(lastRecovery)}
          </div>
          <div class="workspace-view-card__actions">
            <button class="workspace-block-link" data-action="save-autosave">Save autosave</button>
            <button class="workspace-block-link" data-action="workflow-safety">Safety</button>
          </div>
        </article>
      `,
      ...(recentFiles.length
        ? recentFiles.map((entry, index) => `
          <article class="workspace-view-card">
            <div class="workspace-view-card__head">
              <strong>${escapeHtml(entry.fileName || "Untitled-1.adraft")}</strong>
              <span>${escapeHtml(String(entry.fileFormat || "adraft").toUpperCase())}</span>
            </div>
            <div class="workspace-view-card__meta">
              ${escapeHtml(this._formatTimestamp(entry.lastOpenedAt || entry.lastSavedAt || Date.now()))}<br>
              ${escapeHtml(entry.lastAction === "recover" ? "Recovered session" : entry.lastAction === "save" ? "Saved revision" : entry.lastAction === "new" ? "Started here" : "Opened session")}
            </div>
            <div class="workspace-view-card__actions">
              <button class="workspace-block-link" data-action="open-recent-file" data-recent-index="${index}">Open...</button>
              <button class="workspace-block-link" data-action="recent">History</button>
            </div>
          </article>
        `)
        : [`<div class="workspace-empty-state">Recent drawing history will appear here as the team opens, saves, and recovers sessions.</div>`]),
    ].join("");
  }

  _refreshLayoutPanel() {
    const panel = document.getElementById("workspace-layout-list");
    if (!panel) return;
    const tabs = this.layoutManager?.getAllTabs?.() || ["Model"];
    const savedViewCount = this._getSavedViews().length;
    panel.className = "workspace-view-list";
    if (!tabs.length) {
      panel.innerHTML = `<div class="workspace-empty-state">Model space and paper layouts will appear here as the drawing gets organized for sheets and plotting.</div>`;
      return;
    }
    panel.innerHTML = tabs.map((name) => {
      const isModel = name === "Model";
      const layout = isModel ? null : this.layoutManager.getLayout(name);
      const active = this.layoutManager.activeTab === name;
      const scale = layout?.plotSettings?.scale || "1:1";
      const meta = isModel
        ? `Model space<br>${savedViewCount} saved view${savedViewCount === 1 ? "" : "s"}`
        : `${escapeHtml(layout.paperSize || "A3")} ${escapeHtml(layout.orientation || "landscape")}<br>${layout.viewports?.length || 0} viewport${layout.viewports?.length === 1 ? "" : "s"} | ${escapeHtml(scale)}`;
      const status = isModel ? "Live drawing" : (layout?.titleBlock ? "Title block ready" : "Sheet setup pending");
      return `
        <article class="workspace-view-card workspace-layout-card ${active ? "is-active" : ""}">
          <div class="workspace-view-card__head">
            <strong>${escapeHtml(name)}</strong>
            <span class="workspace-layout-chip ${isModel ? "is-model" : "is-paper"}">${isModel ? "Model" : "Paper"}</span>
          </div>
          <div class="workspace-view-card__meta">
            ${meta}<br>
            ${status}
          </div>
          <div class="workspace-view-card__actions">
            <button class="workspace-block-link" data-action="activate-layout" data-layout-name="${escapeHtml(name)}">${active ? "Active" : "Open"}</button>
            ${isModel ? "" : `<button class="workspace-block-link" data-action="layout-paper" data-layout-name="${escapeHtml(name)}">Paper</button>`}
            ${isModel ? "" : `<button class="workspace-block-link" data-action="layout-title-block" data-layout-name="${escapeHtml(name)}">Title</button>`}
            ${isModel ? "" : `<button class="workspace-block-link" data-action="layout-add-viewport" data-layout-name="${escapeHtml(name)}">Viewport</button>`}
            ${isModel ? "" : `<button class="workspace-block-link" data-action="rename-layout" data-layout-name="${escapeHtml(name)}">Rename</button>`}
            ${isModel ? "" : `<button class="workspace-block-link" data-action="delete-layout" data-layout-name="${escapeHtml(name)}">Delete</button>`}
          </div>
        </article>
      `;
    }).join("");
  }

  _refreshCommandStack() {
    const panel = document.getElementById("workspace-command-stack");
    if (!panel) return;
    const activeName = this.app.commandRegistry?.activeCommand ? this.engine.currentCommand || this.app.commandRegistry?.lastCommandName || "Active" : "";
    const prompt = this.app.commandRegistry?.getPrompt?.() || "Command:";
    const commands = [...new Set((this.app._recentCommands || []).filter(Boolean).reverse())].slice(0, 8);
    panel.className = "workspace-view-list";
    panel.innerHTML = [
      activeName ? `
        <article class="workspace-view-card workspace-command-card is-active">
          <div class="workspace-view-card__head">
            <strong>${escapeHtml(activeName)}</strong>
            <span class="workspace-layout-chip">Live</span>
          </div>
          <div class="workspace-view-card__meta">${escapeHtml(prompt)}</div>
          <div class="workspace-view-card__actions">
            <button class="workspace-block-link" data-action="repeat-last">Repeat</button>
            <button class="workspace-block-link" data-action="command-palette">Palette</button>
          </div>
        </article>
      ` : "",
      commands.length
        ? commands.map((commandName, index) => `
          <article class="workspace-view-card workspace-command-card">
            <div class="workspace-view-card__head">
              <strong>${escapeHtml(commandName)}</strong>
              <span>#${index + 1}</span>
            </div>
            <div class="workspace-view-card__meta">Recent command memory keeps repeat work fast instead of forcing a full ribbon hunt.</div>
            <div class="workspace-view-card__actions">
              <button class="workspace-block-link" data-action="run-history-command" data-command-name="${escapeHtml(commandName)}">Run</button>
            </div>
          </article>
        `).join("")
        : `<div class="workspace-empty-state">Recent commands will collect here as the drafting session develops, so repeated work stays one click away.</div>`,
    ].join("");
  }

  _showSelectTypeDialog() {
    const types = this._getEntityTypes();
    if (!types.length) {
      this._toast("No entity types are available yet.", "warning");
      return;
    }
    const modal = this._openModal("Select by type", `
      <div class="modal-field">
        <label>Entity type</label>
        <select id="workspace-select-type-value">
          ${types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(this._labelizeType(type))}</option>`).join("")}
        </select>
      </div>
      <label class="workspace-checkline"><input id="workspace-select-type-layer" type="checkbox"> Limit to the current layer</label>
      <div class="workspace-note">Quick filters like this keep large technical drawings manageable without zooming around to hunt manually.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-select-type-apply">Select</button>`);
    modal.querySelector("#workspace-select-type-apply")?.addEventListener("click", () => {
      const type = modal.querySelector("#workspace-select-type-value")?.value;
      const currentLayerOnly = !!modal.querySelector("#workspace-select-type-layer")?.checked;
      this._selectByType(type, currentLayerOnly);
      this._closeModal();
    });
  }

  _showMoveToLayerDialog() {
    const selected = this.selectionManager?.getSelectedEntities?.() || [];
    if (!selected.length) {
      this._toast("Select geometry first.", "warning");
      return;
    }
    const layerNames = this._getLayerNames();
    const currentLayer = this.engine.currentLayer || "Layer 0";
    const modal = this._openModal("Move selection to layer", `
      <div class="modal-field">
        <label>Existing layer</label>
        <select id="workspace-move-layer-name">
          ${layerNames.map((name) => `<option value="${escapeHtml(name)}"${name === currentLayer ? " selected" : ""}>${escapeHtml(name)}</option>`).join("")}
        </select>
      </div>
      <div class="modal-field"><label>Or create new layer</label><input id="workspace-move-layer-new" type="text" placeholder="Annotations"></div>
      <div class="workspace-note">${selected.length} selected object${selected.length === 1 ? "" : "s"} will be reassigned and kept in the current view.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-move-layer-apply">Move</button>`);
    modal.querySelector("#workspace-move-layer-apply")?.addEventListener("click", () => {
      const newLayerName = modal.querySelector("#workspace-move-layer-new")?.value?.trim();
      const existingLayer = modal.querySelector("#workspace-move-layer-name")?.value?.trim();
      this._moveSelectionToLayer(newLayerName || existingLayer);
      this._closeModal();
    });
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

  _showAddLayoutDialog() {
    const modal = this._openModal("Add paper layout", `
      <div class="modal-field"><label>Layout name</label><input id="workspace-layout-name" type="text" placeholder="Layout2"></div>
      <div class="modal-row">
        <div class="modal-field">
          <label>Paper</label>
          <select id="workspace-layout-paper">
            ${Object.keys(PAPER_SIZES_MM).map((name) => `<option value="${name}">${name}</option>`).join("")}
          </select>
        </div>
        <div class="modal-field">
          <label>Orientation</label>
          <select id="workspace-layout-orientation">
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
        </div>
      </div>
      <div class="workspace-note">Layouts turn model geometry into printable sheets, which is one of the biggest practical gaps between a sketch tool and a usable CAD workflow.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-layout-create">Create</button>`);
    modal.querySelector("#workspace-layout-create")?.addEventListener("click", () => {
      const name = modal.querySelector("#workspace-layout-name")?.value?.trim() || `Layout${(this.layoutManager?.getLayoutNames?.()?.length || 1) + 1}`;
      const paper = modal.querySelector("#workspace-layout-paper")?.value || "A3";
      const orientation = modal.querySelector("#workspace-layout-orientation")?.value || "landscape";
      if (!this.layoutManager.addLayout(name, paper, orientation)) {
        this._toast("That layout name is already in use.", "warning");
        return;
      }
      this._persistLayoutState();
      this._refreshLayoutPanel();
      this._closeModal();
      this._toast(`Created ${name}`, "success");
    });
  }

  _showRenameLayoutDialog(name) {
    if (!name || name === "Model") return;
    const modal = this._openModal("Rename layout", `
      <div class="modal-field"><label>Layout name</label><input id="workspace-layout-rename" type="text" value="${escapeHtml(name)}"></div>
      <div class="workspace-note">Rename paper tabs so sheet sets stay understandable when drawings start to grow.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-layout-rename-apply">Rename</button>`);
    modal.querySelector("#workspace-layout-rename-apply")?.addEventListener("click", () => {
      const nextName = modal.querySelector("#workspace-layout-rename")?.value?.trim();
      if (!nextName || nextName === name) {
        this._closeModal();
        return;
      }
      if (!this.layoutManager.renameLayout(name, nextName)) {
        this._toast("That layout name could not be used.", "warning");
        return;
      }
      this._persistLayoutState();
      this._refreshLayoutPanel();
      this._closeModal();
      this._toast(`Renamed ${name} to ${nextName}`, "success");
    });
  }

  _showLayoutPaperDialog(name) {
    const layout = name === "Model" ? null : this.layoutManager.getLayout(name);
    if (!layout) {
      this._toast("Choose a paper layout first.", "warning");
      return;
    }
    const modal = this._openModal("Paper setup", `
      <div class="modal-row">
        <div class="modal-field">
          <label>Paper</label>
          <select id="workspace-layout-paper-edit">
            ${Object.keys(PAPER_SIZES_MM).map((paperName) => `<option value="${paperName}" ${paperName === layout.paperSize ? "selected" : ""}>${paperName}</option>`).join("")}
          </select>
        </div>
        <div class="modal-field">
          <label>Orientation</label>
          <select id="workspace-layout-orientation-edit">
            <option value="landscape" ${layout.orientation === "landscape" ? "selected" : ""}>Landscape</option>
            <option value="portrait" ${layout.orientation === "portrait" ? "selected" : ""}>Portrait</option>
          </select>
        </div>
      </div>
      <div class="modal-field">
        <label>Plot scale</label>
        <input id="workspace-layout-scale-edit" type="text" value="${escapeHtml(layout.plotSettings?.scale || "1:1")}">
      </div>
      <div class="workspace-note">This keeps the layout tab honest about paper size, orientation, and intended plot scale before the final print/export step.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-layout-paper-apply">Apply</button>`);
    modal.querySelector("#workspace-layout-paper-apply")?.addEventListener("click", () => {
      const paper = modal.querySelector("#workspace-layout-paper-edit")?.value || layout.paperSize || "A3";
      const orientation = modal.querySelector("#workspace-layout-orientation-edit")?.value || layout.orientation || "landscape";
      const scale = modal.querySelector("#workspace-layout-scale-edit")?.value?.trim() || layout.plotSettings?.scale || "1:1";
      this.layoutManager.setPaperSize(name, paper, orientation);
      const updated = this.layoutManager.getLayout(name);
      if (updated) {
        updated.plotSettings ||= {};
        updated.plotSettings.scale = scale;
      }
      this._persistLayoutState();
      this._refreshLayoutPanel();
      this._closeModal();
      this._toast(`Updated ${name}`, "success");
    });
  }

  _showLayoutTitleBlockDialog(name) {
    const layout = name === "Model" ? null : this.layoutManager.getLayout(name);
    if (!layout) {
      this._toast("Choose a paper layout first.", "warning");
      return;
    }
    this.layoutManager.setActive(name);
    this._persistLayoutState();
    this._refreshLayoutPanel();
    this._showTitleBlockDialog({
      paper: layout.paperSize || "A3",
      orientation: layout.orientation || "landscape",
      scale: layout.plotSettings?.scale || "1:1",
      title: layout.titleBlock?.fields?.title || name,
      company: layout.titleBlock?.fields?.company || "",
      drawnBy: layout.titleBlock?.fields?.drawnBy || "",
      sheet: layout.titleBlock?.fields?.sheet || "1 of 1",
      margin: layout.titleBlock?.margin || 10,
      template: layout.titleBlock?.template || "standard",
    });
  }

  _showSaveSelectionSetDialog() {
    if (!(this.selectionManager?.getSelectedEntities()?.length)) {
      this._toast("Select geometry first.", "warning");
      return;
    }
    const modal = this._openModal("Save selection set", `
      <div class="modal-field"><label>Set name</label><input id="workspace-selection-set-name" type="text" placeholder="Door tags"></div>
      <div class="workspace-note">Selection sets recall useful groups without changing the drawing itself.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-selection-set-save">Save</button>`);
    modal.querySelector("#workspace-selection-set-save")?.addEventListener("click", () => {
      const name = modal.querySelector("#workspace-selection-set-name")?.value?.trim();
      if (!this._saveSelectionSet(name)) return;
      this._closeModal();
    });
  }

  _showSaveLayerStateDialog() {
    const modal = this._openModal("Save layer state", `
      <div class="modal-field"><label>State name</label><input id="workspace-layer-state-name" type="text" placeholder="Plot clean"></div>
      <div class="workspace-note">Layer states store visibility, freeze, lock, and current-layer context for this drawing.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-layer-state-save">Save</button>`);
    modal.querySelector("#workspace-layer-state-save")?.addEventListener("click", () => {
      const name = modal.querySelector("#workspace-layer-state-name")?.value?.trim();
      if (!this._saveLayerState(name)) return;
      this._closeModal();
    });
  }

  _showTitleBlockDialog(defaults = {}) {
    const modal = this._openModal("Insert title block", `
      <div class="modal-row">
        <div class="modal-field">
          <label>Template</label>
          <select id="workspace-titleblock-template">
            ${TitleBlock.getTemplateNames().map((name) => `<option value="${name}" ${name === (defaults.template || "standard") ? "selected" : ""}>${name[0].toUpperCase() + name.slice(1)}</option>`).join("")}
          </select>
        </div>
        <div class="modal-field">
          <label>Paper</label>
          <select id="workspace-titleblock-paper">
            ${Object.keys(PAPER_SIZES_MM).map((name) => `<option value="${name}" ${name === (defaults.paper || "A3") ? "selected" : ""}>${name}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-field">
          <label>Orientation</label>
          <select id="workspace-titleblock-orient">
            <option value="landscape" ${(defaults.orientation || "landscape") === "landscape" ? "selected" : ""}>Landscape</option>
            <option value="portrait" ${(defaults.orientation || "landscape") === "portrait" ? "selected" : ""}>Portrait</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Margin</label>
          <input id="workspace-titleblock-margin" type="number" min="4" step="1" value="${Number(defaults.margin || 10)}">
        </div>
      </div>
      <div class="modal-field"><label>Drawing title</label><input id="workspace-titleblock-title" type="text" placeholder="Site plan" value="${escapeHtml(defaults.title || "")}"></div>
      <div class="modal-row">
        <div class="modal-field"><label>Scale</label><input id="workspace-titleblock-scale" type="text" value="${escapeHtml(defaults.scale || "1:100")}"></div>
        <div class="modal-field"><label>Company</label><input id="workspace-titleblock-company" type="text" placeholder="AfroTools" value="${escapeHtml(defaults.company || "")}"></div>
      </div>
      <div class="modal-row">
        <div class="modal-field"><label>Drawn by</label><input id="workspace-titleblock-drawnby" type="text" placeholder="Designer" value="${escapeHtml(defaults.drawnBy || "")}"></div>
        <div class="modal-field"><label>Sheet</label><input id="workspace-titleblock-sheet" type="text" value="${escapeHtml(defaults.sheet || "1 of 1")}"></div>
      </div>
      <div class="workspace-note">The title block uses the current drawing units and updates limits to match the chosen paper size.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workspace-titleblock-insert">Insert</button>`);
    modal.querySelector("#workspace-titleblock-insert")?.addEventListener("click", () => {
      const template = modal.querySelector("#workspace-titleblock-template")?.value || "standard";
      const paper = modal.querySelector("#workspace-titleblock-paper")?.value || "A3";
      const orientation = modal.querySelector("#workspace-titleblock-orient")?.value || "landscape";
      const margin = Number(modal.querySelector("#workspace-titleblock-margin")?.value || 10);
      const fields = {
        title: modal.querySelector("#workspace-titleblock-title")?.value?.trim() || "DRAWING TITLE",
        scale: modal.querySelector("#workspace-titleblock-scale")?.value?.trim() || "1:100",
        company: modal.querySelector("#workspace-titleblock-company")?.value?.trim() || "",
        drawnBy: modal.querySelector("#workspace-titleblock-drawnby")?.value?.trim() || "",
        sheet: modal.querySelector("#workspace-titleblock-sheet")?.value?.trim() || "1 of 1",
      };
      this._insertTitleBlock({ template, paper, orientation, margin, fields });
      this._closeModal();
    });
  }

  _showSheetWorkflowDialog() {
    const modal = this._openModal("Sheet setup workflow", `
      <div class="modal-row">
        <div class="modal-field">
          <label>Drawing name</label>
          <input id="workflow-sheet-name" type="text" placeholder="Site plan">
        </div>
        <div class="modal-field">
          <label>Units</label>
          <select id="workflow-sheet-units">
            ${["mm", "cm", "m", "inches", "feet"].map((unit) => `<option value="${unit}" ${unit === (this.engine.units || "mm") ? "selected" : ""}>${unit}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-field">
          <label>Paper</label>
          <select id="workflow-sheet-paper">
            ${Object.keys(PAPER_SIZES_MM).map((name) => `<option value="${name}">${name}</option>`).join("")}
          </select>
        </div>
        <div class="modal-field">
          <label>Orientation</label>
          <select id="workflow-sheet-orient">
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-field">
          <label>Border style</label>
          <select id="workflow-sheet-template">
            ${TitleBlock.getTemplateNames().map((name) => `<option value="${name}">${name[0].toUpperCase() + name.slice(1)}</option>`).join("")}
          </select>
        </div>
        <div class="modal-field">
          <label>Scale</label>
          <input id="workflow-sheet-scale" type="text" value="1:100">
        </div>
      </div>
      <div class="modal-field"><label>Title</label><input id="workflow-sheet-title" type="text" placeholder="General arrangement"></div>
      <div class="modal-row">
        <div class="modal-field"><label>Company</label><input id="workflow-sheet-company" type="text" placeholder="AfroTools"></div>
        <div class="modal-field"><label>Drawn by</label><input id="workflow-sheet-drawnby" type="text" placeholder="Designer"></div>
      </div>
      <div class="modal-row">
        <div class="modal-field"><label>Sheet</label><input id="workflow-sheet-sheet" type="text" value="1 of 1"></div>
        <div class="modal-field"><label>Margin</label><input id="workflow-sheet-margin" type="number" min="4" step="1" value="10"></div>
      </div>
      <label class="workspace-checkline"><input id="workflow-sheet-fresh" type="checkbox"> Start with a fresh drawing before applying the sheet setup</label>
      <div class="workspace-note">Use this when you want a fast project kickoff. If the drawing already contains geometry, leave the fresh-drawing option off so nothing gets cleared unexpectedly.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workflow-sheet-run">Apply workflow</button>`);
    modal.querySelector("#workflow-sheet-run")?.addEventListener("click", () => {
      const options = {
        fileName: modal.querySelector("#workflow-sheet-name")?.value?.trim() || "",
        units: modal.querySelector("#workflow-sheet-units")?.value || this.engine.units || "mm",
        paper: modal.querySelector("#workflow-sheet-paper")?.value || "A3",
        orientation: modal.querySelector("#workflow-sheet-orient")?.value || "landscape",
        template: modal.querySelector("#workflow-sheet-template")?.value || "standard",
        scale: modal.querySelector("#workflow-sheet-scale")?.value?.trim() || "1:100",
        title: modal.querySelector("#workflow-sheet-title")?.value?.trim() || "DRAWING TITLE",
        company: modal.querySelector("#workflow-sheet-company")?.value?.trim() || "",
        drawnBy: modal.querySelector("#workflow-sheet-drawnby")?.value?.trim() || "",
        sheet: modal.querySelector("#workflow-sheet-sheet")?.value?.trim() || "1 of 1",
        margin: Number(modal.querySelector("#workflow-sheet-margin")?.value || 10),
        fresh: !!modal.querySelector("#workflow-sheet-fresh")?.checked,
      };
      this._runSheetWorkflow(options);
      this._closeModal();
    });
  }

  _runSheetWorkflow(options) {
    if (options.fresh) {
      this.fileWorkflow.createNewProject({
        fileName: options.fileName || "Untitled-1",
        units: options.units,
      });
    } else if (options.units && options.units !== this.engine.units) {
      this.engine.units = options.units;
      this.app.statusBar?.setUnits?.(options.units);
      this.engine.markModified();
    }
    const activePaperLayout = this.layoutManager.getActiveLayout?.();
    const targetLayoutName = activePaperLayout?.name || "Layout1";
    if (!activePaperLayout && !this.layoutManager.getLayout(targetLayoutName)) {
      this.layoutManager.addLayout(targetLayoutName, options.paper, options.orientation);
    }
    this.layoutManager.setActive(targetLayoutName);
    const targetLayout = this.layoutManager.getLayout(targetLayoutName);
    if (targetLayout) {
      this.layoutManager.setPaperSize(targetLayoutName, options.paper, options.orientation);
      targetLayout.plotSettings ||= {};
      targetLayout.plotSettings.scale = options.scale || targetLayout.plotSettings.scale || "1:1";
    }
    this._insertTitleBlock({
      template: options.template,
      paper: options.paper,
      orientation: options.orientation,
      margin: options.margin,
      fields: {
        title: options.title,
        scale: options.scale,
        company: options.company,
        drawnBy: options.drawnBy,
        sheet: options.sheet,
      },
    });
    this._persistLayoutState();
    this._refreshLayoutPanel();
    this._applyWorkspacePreset("draft", false);
    this._setRibbonMode("setup", false);
    this._syncSummary();
    this._toast("Sheet setup workflow ready", "success");
  }

  _runDraftWorkflow() {
    this._applyWorkspacePreset("draft", false);
    this._setRibbonMode("draw", false);
    this._applySnapProfile("drafting", false);
    if (this.app.gridRenderer) {
      this.app.gridRenderer.showGrid = true;
      this.app.gridRenderer.showAxes = true;
    }
    this.app.renderer.dirty = true;
    this._syncSummary();
    this._toast("Draft workflow ready", "success");
  }

  _runReviewWorkflow() {
    const layerName = "Markups";
    if (!this.engine.layers[layerName]) {
      this.engine.addLayer(layerName, {
        color: { r: 249, g: 115, b: 22, index: 30 },
        lineweight: 0.3,
        plot: true,
      });
    }
    this.engine.currentLayer = layerName;
    this.engine.emit("layer-changed", { name: layerName, prop: "current", value: true });
    this.engine.emit("current-layer-changed", { name: layerName });
    this._applyWorkspacePreset("review", false);
    this._setRibbonMode("annotate", false);
    this._setInspectorTab("props", false);
    this._applySnapProfile("review", false);
    this._syncSummary();
    this._toast("Markup review workflow ready", "success");
  }

  _showHandoffWorkflowDialog() {
    const modal = this._openModal("Handoff workflow", `
      <div class="workspace-checkstack">
        <label class="workspace-checkline"><input id="workflow-handoff-audit" type="checkbox" checked> Run drawing audit</label>
        <label class="workspace-checkline"><input id="workflow-handoff-project" type="checkbox" checked> Save AfroDraft project</label>
        <label class="workspace-checkline"><input id="workflow-handoff-dxf" type="checkbox" checked> Export DXF handoff</label>
        <label class="workspace-checkline"><input id="workflow-handoff-csv" type="checkbox"> Export entity CSV summary</label>
        <label class="workspace-checkline"><input id="workflow-handoff-plot" type="checkbox"> Open plot dialog for final output</label>
      </div>
      <div class="workspace-note">This workflow packages the drawing for another person without forcing you through the full ribbon manually.</div>
    `, `<button class="modal-btn" data-close-modal="true">Cancel</button><button class="modal-btn primary" id="workflow-handoff-run">Run workflow</button>`);
    modal.querySelector("#workflow-handoff-run")?.addEventListener("click", async () => {
      const options = {
        audit: !!modal.querySelector("#workflow-handoff-audit")?.checked,
        project: !!modal.querySelector("#workflow-handoff-project")?.checked,
        dxf: !!modal.querySelector("#workflow-handoff-dxf")?.checked,
        csv: !!modal.querySelector("#workflow-handoff-csv")?.checked,
        plot: !!modal.querySelector("#workflow-handoff-plot")?.checked,
      };
      this._closeModal();
      await this._runHandoffWorkflow(options);
    });
  }

  async _runHandoffWorkflow(options) {
    try {
      if (options.audit) {
        this.app._auditDrawing?.();
      }
      if (options.project) {
        await this.fileWorkflow.saveAsProject(false);
      }
      if (options.dxf) {
        await this.fileWorkflow.exportDxf();
      }
      if (options.csv) {
        this.app._exportEntityCSV?.();
      }
      if (options.plot) {
        this.app._showPlotDialog?.();
      }
      this._toast("Handoff workflow complete", "success");
    } catch (error) {
      this._toast(error?.message || "Handoff workflow failed.", "error");
    }
  }

  async _showSafetyWorkflowDialog() {
    const recovery = await this.fileWorkflow.checkRecovery().catch(() => ({ exists: false }));
    const timeLabel = recovery?.timestamp ? new Date(recovery.timestamp).toLocaleString() : "";
    const modal = this._openModal("Session safety workflow", `
      <label class="workspace-checkline"><input id="workflow-safety-enabled" type="checkbox" ${this.state.autosaveEnabled ? "checked" : ""}> Enable background autosave</label>
      <div class="modal-field">
        <label>Autosave interval</label>
        <select id="workflow-safety-interval">
          ${[
            [60000, "Every 1 minute"],
            [180000, "Every 3 minutes"],
            [300000, "Every 5 minutes"],
          ].map(([value, label]) => `<option value="${value}" ${Number(this.state.autosaveIntervalMs) === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>
      <div class="workspace-note">${recovery?.exists ? `Recovery found for ${escapeHtml(recovery.filename || "Untitled-1.adraft")} from ${escapeHtml(timeLabel)}.` : "No autosave recovery file is waiting right now."}</div>
    `, `
      <button class="modal-btn" data-close-modal="true">Close</button>
      <button class="modal-btn" id="workflow-safety-save">Save backup</button>
      ${recovery?.exists ? `<button class="modal-btn" id="workflow-safety-recover">Recover autosave</button>` : ""}
      <button class="modal-btn primary" id="workflow-safety-apply">Apply safety settings</button>
    `);
    modal.querySelector("#workflow-safety-apply")?.addEventListener("click", () => {
      this.state.autosaveEnabled = !!modal.querySelector("#workflow-safety-enabled")?.checked;
      this.state.autosaveIntervalMs = Number(modal.querySelector("#workflow-safety-interval")?.value || 180000);
      this._syncAutosaveTimer();
      this._saveState();
      this._closeModal();
      this._toast("Session safety updated", "success");
    });
    modal.querySelector("#workflow-safety-save")?.addEventListener("click", async () => {
      this._closeModal();
      await this.fileWorkflow.saveAsProject(false);
    });
    modal.querySelector("#workflow-safety-recover")?.addEventListener("click", async () => {
      this._closeModal();
      await this._recoverAutosaveWorkflow();
    });
  }

  async _recoverAutosaveWorkflow() {
    const restored = await this.fileWorkflow.recoverAutosave().catch(() => false);
    if (!restored) {
      this._toast("No autosave recovery was restored.", "warning");
      return;
    }
    this._refreshViewsPanel();
    this._refreshSelectionSetsPanel();
    this._refreshLayerStatesPanel();
    this._syncSummary();
  }

  _activateLayout(name = "Model") {
    const target = name || "Model";
    if (!this.layoutManager.setActive(target)) {
      this._toast("That layout is no longer available.", "warning");
      return;
    }
    if (target === "Model") {
      this._applyWorkspacePreset("draft", false);
      this._toast("Switched to model space", "success");
    } else {
      const layout = this.layoutManager.getLayout(target);
      if (layout) {
        const width = this.engine.convertUnits?.(layout.width, "mm", this.engine.units) ?? layout.width;
        const height = this.engine.convertUnits?.(layout.height, "mm", this.engine.units) ?? layout.height;
        this.engine.limitsEnabled = true;
        this.engine.limitsMin = { x: 0, y: 0 };
        this.engine.limitsMax = { x: width, y: height };
        this._pushCurrentView();
        this.viewport.zoomExtents({ minX: 0, minY: 0, maxX: width, maxY: height });
        this.app.renderer.dirty = true;
      }
      this._applyWorkspacePreset("plot", false);
      this._setRibbonMode("setup", false);
      this._toast(`Opened ${target}`, "success");
    }
    this._persistLayoutState();
    this._refreshLayoutPanel();
    this._syncSummary();
  }

  _deleteLayout(name) {
    if (!name || name === "Model") return;
    const didDelete = this.layoutManager.removeLayout(name);
    if (!didDelete) {
      this._toast("That layout could not be removed.", "warning");
      return;
    }
    this._persistLayoutState();
    this._refreshLayoutPanel();
    this._syncSummary();
    this._toast(`Deleted ${name}`, "success");
  }

  _addLayoutViewport(name) {
    const layout = name === "Model" ? null : this.layoutManager.getLayout(name);
    if (!layout) {
      this._toast("Choose a paper layout first.", "warning");
      return;
    }
    const viewportRect = {
      x: Math.round(layout.width * 0.1),
      y: Math.round(layout.height * 0.14),
      width: Math.round(layout.width * 0.78),
      height: Math.round(layout.height * 0.62),
    };
    const viewportScale = Number((1 / Math.max(this.viewport.zoom || 1, 0.001)).toFixed(4));
    const created = this.layoutManager.addViewport(name, viewportRect, viewportScale, { x: this.viewport.panX, y: this.viewport.panY });
    if (!created) {
      this._toast("That viewport could not be added.", "warning");
      return;
    }
    this._persistLayoutState();
    this._refreshLayoutPanel();
    this._toast(`Viewport added to ${name}`, "success");
  }

  _syncAutosaveTimer() {
    if (this._autosaveTimer) {
      clearInterval(this._autosaveTimer);
      this._autosaveTimer = null;
    }
    if (!this.state.autosaveEnabled) return;
    this._autosaveTimer = DrawingFile.startAutosave(this.engine, Number(this.state.autosaveIntervalMs) || 180000);
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
    this._pushCurrentView();
    this.viewport.zoomExtents(bounds);
    this.app.renderer.dirty = true;
  }

  _purgeUnusedBlocks() {
    const removed = this.blockManager.purgeUnused();
    this._refreshBlockPanel();
    this._toast(removed.length ? `Purged ${removed.length} block${removed.length === 1 ? "" : "s"}` : "No unused blocks found", removed.length ? "success" : "warning");
  }

  _saveSelectionSet(name) {
    const ids = this.selectionManager?.getSelected?.() || [];
    if (!name || !ids.length) {
      this._toast("Name the set and keep a selection active.", "warning");
      return false;
    }
    const sets = this._getSelectionSets().filter((entry) => entry.name !== name);
    sets.unshift({ name, ids: [...ids] });
    this._setSelectionSets(sets.slice(0, 16));
    this._refreshSelectionSetsPanel();
    this._toast(`Saved selection set ${name}`, "success");
    return true;
  }

  _restoreSelectionSet(name) {
    const entry = this._getSelectionSets().find((set) => set.name === name);
    if (!entry) {
      this._toast("That selection set no longer exists.", "warning");
      return;
    }
    this.selectionManager?.deselectAll?.();
    let restored = 0;
    entry.ids.forEach((id) => {
      if (this.engine.getEntity(id)) {
        this.selectionManager?._addToSelection?.(id);
        restored += 1;
      }
    });
    if (!restored) {
      this._toast("None of those objects are still in this drawing.", "warning");
      return;
    }
    this._zoomSelection();
    this._toast(`Restored ${name}`, "success");
  }

  _deleteSelectionSet(name) {
    if (!name) return;
    this._setSelectionSets(this._getSelectionSets().filter((entry) => entry.name !== name));
    this._refreshSelectionSetsPanel();
    this._toast(`Deleted ${name}`, "success");
  }

  _saveLayerState(name) {
    if (!name) {
      this._toast("Give the layer state a name.", "warning");
      return false;
    }
    const states = this._getLayerStates().filter((entry) => entry.name !== name);
    states.unshift({
      name,
      currentLayer: this.engine.currentLayer || "Layer 0",
      layers: this._getLayerNames().map((layerName) => ({ name: layerName, ...JSON.parse(JSON.stringify(this.engine.layers[layerName] || {})) })),
    });
    this._setLayerStates(states.slice(0, 16));
    this._refreshLayerStatesPanel();
    this._toast(`Saved layer state ${name}`, "success");
    return true;
  }

  _restoreLayerState(name) {
    const entry = this._getLayerStates().find((state) => state.name === name);
    if (!entry) {
      this._toast("That layer state no longer exists.", "warning");
      return;
    }
    entry.layers.forEach((layer) => {
      if (!this.engine.layers[layer.name]) {
        this.engine.addLayer(layer.name, layer);
      }
      ["color", "linetype", "lineweight", "visible", "locked", "frozen", "plot"].forEach((prop) => {
        if (layer[prop] !== undefined) {
          const value = typeof layer[prop] === "object" && layer[prop] !== null ? JSON.parse(JSON.stringify(layer[prop])) : layer[prop];
          this.engine.setLayerProperty(layer.name, prop, value);
        }
      });
    });
    this.engine.currentLayer = this.engine.layers[entry.currentLayer] ? entry.currentLayer : "Layer 0";
    this.engine.markModified();
    this.app.renderer.dirty = true;
    this._refreshLayerStatesPanel();
    this._syncSummary();
    this._toast(`Restored ${name}`, "success");
  }

  _deleteLayerState(name) {
    if (!name) return;
    this._setLayerStates(this._getLayerStates().filter((entry) => entry.name !== name));
    this._refreshLayerStatesPanel();
    this._toast(`Deleted ${name}`, "success");
  }

  _insertTitleBlock({ template, paper, orientation, margin, fields }) {
    const paperSize = PAPER_SIZES_MM[paper] || PAPER_SIZES_MM.A3;
    const landscape = orientation !== "portrait";
    const paperWidthMm = landscape ? Math.max(paperSize.w, paperSize.h) : Math.min(paperSize.w, paperSize.h);
    const paperHeightMm = landscape ? Math.min(paperSize.w, paperSize.h) : Math.max(paperSize.w, paperSize.h);
    const paperWidth = this.engine.convertUnits?.(paperWidthMm, "mm", this.engine.units) ?? paperWidthMm;
    const paperHeight = this.engine.convertUnits?.(paperHeightMm, "mm", this.engine.units) ?? paperHeightMm;
    const convertedMargin = this.engine.convertUnits?.(margin, "mm", this.engine.units) ?? margin;
    const entities = TitleBlock.generate({
      paperWidth,
      paperHeight,
      margin: convertedMargin,
      template,
      fields,
    });
    entities.forEach((entity) => this.engine.addEntity(entity));
    this.engine.limitsEnabled = true;
    this.engine.limitsMin = { x: 0, y: 0 };
    this.engine.limitsMax = { x: paperWidth, y: paperHeight };
    this.engine.markModified();
    this._pushCurrentView();
    this.viewport.zoomExtents({ minX: 0, minY: 0, maxX: paperWidth, maxY: paperHeight });
    this.app.renderer.dirty = true;
    const activeLayout = this.layoutManager?.getActiveLayout?.();
    if (activeLayout) {
      this.layoutManager.setPaperSize(activeLayout.name, paper, orientation);
      this.layoutManager.setTitleBlock(activeLayout.name, {
        template,
        paper,
        orientation,
        margin,
        fields: { ...fields },
        updatedAt: Date.now(),
      });
      const refreshedLayout = this.layoutManager.getLayout(activeLayout.name);
      if (refreshedLayout) {
        refreshedLayout.plotSettings ||= {};
        refreshedLayout.plotSettings.scale = fields.scale || refreshedLayout.plotSettings.scale || "1:1";
      }
      this._persistLayoutState();
      this._refreshLayoutPanel();
    }
    this._toast(`Inserted ${paper} ${template} title block`, "success");
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
    this._pushCurrentView();
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

  _getEntityTypes() {
    return [...new Set([...this.engine.entities.values()].map((entity) => entity.type).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  _labelizeType(type) {
    return String(type || "entity").replace(/[_-]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  _getSaveModeLabel(state) {
    if (state.fileFormat === "dwg") return "DWG bridge";
    if (state.fileFormat === "dxf") return state.hasHandle ? "DXF direct save" : "DXF exchange";
    if (state.hasHandle) return "Project save";
    return state.canSave ? "Browser save" : "Download save";
  }

  _formatInterval(ms) {
    const minutes = Math.max(1, Math.round(Number(ms || 0) / 60000));
    return minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} hr` : `${minutes} min`;
  }

  _formatAge(ms) {
    const totalMinutes = Math.max(0, Math.round(Number(ms || 0) / 60000));
    if (totalMinutes < 1) return "< 1 min";
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }

  _formatTimestamp(timestamp) {
    const value = Number(timestamp || 0);
    if (!value) return "No timestamp";
    const date = new Date(value);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  _isSelectableEntity(entity) {
    if (!entity || entity.visible === false || entity.locked) return false;
    const layer = this.engine.layers?.[entity.layer];
    return !(layer && (layer.visible === false || layer.frozen || layer.locked));
  }

  _selectByLayer(layerName = this.engine.currentLayer || "Layer 0") {
    if (!layerName) return;
    if (typeof this.app._selectByLayer === "function") {
      this.app._selectByLayer(layerName);
      return;
    }
    const selected = this.selectionManager.quickSelect({ layer: layerName });
    this._toast(selected.length ? `Selected ${selected.length} item${selected.length === 1 ? "" : "s"} on ${layerName}` : `No selectable geometry on ${layerName}`, selected.length ? "success" : "warning");
  }

  _selectByType(type, currentLayerOnly = false) {
    if (!type) return;
    if (typeof this.app._selectByType === "function" && !currentLayerOnly) {
      this.app._selectByType(type);
      return;
    }
    const criteria = { type };
    if (currentLayerOnly) criteria.layer = this.engine.currentLayer || "Layer 0";
    const selected = this.selectionManager.quickSelect(criteria);
    this._toast(selected.length ? `Selected ${selected.length} ${this._labelizeType(type).toLowerCase()} object${selected.length === 1 ? "" : "s"}` : `No ${this._labelizeType(type).toLowerCase()} objects matched`, selected.length ? "success" : "warning");
  }

  _selectSimilar() {
    const sample = this.selectionManager?.getSelectedEntities?.()?.[0];
    if (!sample) {
      this._toast("Pick one object first to select similar.", "warning");
      return;
    }
    if (typeof this.app._selectSimilar === "function") {
      this.app._selectSimilar();
      return;
    }
    const criteria = { type: sample.type };
    if (sample.layer) criteria.layer = sample.layer;
    const selected = this.selectionManager.quickSelect(criteria);
    this._toast(selected.length ? `Selected ${selected.length} similar object${selected.length === 1 ? "" : "s"}` : "No similar objects matched", selected.length ? "success" : "warning");
  }

  _invertSelection() {
    if (typeof this.app._invertSelection === "function") {
      this.app._invertSelection();
      return;
    }
    const selected = new Set(this.selectionManager?.getSelected?.() || []);
    const nextIds = [...this.engine.entities.values()].filter((entity) => this._isSelectableEntity(entity) && !selected.has(entity.id)).map((entity) => entity.id);
    this.selectionManager?.deselectAll?.();
    nextIds.forEach((id) => this.selectionManager?._addToSelection?.(id));
    this._toast(nextIds.length ? `Inverted selection to ${nextIds.length} object${nextIds.length === 1 ? "" : "s"}` : "Nothing to invert", nextIds.length ? "success" : "warning");
  }

  _pushCurrentView() {
    const stack = this.app._viewStack ||= [];
    const current = { panX: this.viewport.panX, panY: this.viewport.panY, zoom: this.viewport.zoom };
    const last = stack[stack.length - 1];
    if (last && Math.abs(last.panX - current.panX) < 0.0001 && Math.abs(last.panY - current.panY) < 0.0001 && Math.abs(last.zoom - current.zoom) < 0.0001) {
      return;
    }
    stack.push(current);
    const maxViews = this.app._maxViews || 20;
    if (stack.length > maxViews) stack.splice(0, stack.length - maxViews);
  }

  _zoomPrevious() {
    if (typeof this.app._zoomPrevious === "function") {
      this.app._zoomPrevious();
      return;
    }
    const stack = this.app._viewStack || [];
    while (stack.length) {
      const view = stack.pop();
      if (!view) continue;
      if (Math.abs(view.panX - this.viewport.panX) < 0.0001 && Math.abs(view.panY - this.viewport.panY) < 0.0001 && Math.abs(view.zoom - this.viewport.zoom) < 0.0001) {
        continue;
      }
      this.viewport.panX = view.panX;
      this.viewport.panY = view.panY;
      this.viewport.zoom = view.zoom;
      this.app.renderer.dirty = true;
      this._toast("Restored previous view", "success");
      return;
    }
    this._toast("No previous view is stored yet.", "warning");
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
    this.state.activeSnapProfile = "";
    this._saveState();
    this._syncSummary();
  }

  _toggleOrtho() {
    this.app.snapEngine.orthoEnabled = !this.app.snapEngine.orthoEnabled;
    this.state.activeSnapProfile = "";
    this._saveState();
    this._syncSummary();
  }

  _togglePolar() {
    this.app.snapEngine.polarEnabled = !this.app.snapEngine.polarEnabled;
    this.state.activeSnapProfile = "";
    this._saveState();
    this._syncSummary();
  }

  _toggleTracking() {
    this.app.snapEngine.trackingEnabled = !this.app.snapEngine.trackingEnabled;
    this.state.activeSnapProfile = "";
    this._saveState();
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

  _applySnapProfile(key, announce = true) {
    const profile = SNAP_PROFILES[key];
    const snapEngine = this.app.snapEngine;
    if (!profile || !snapEngine) return;
    snapEngine.enabledSnaps.clear();
    profile.snaps.forEach((snap) => snapEngine.enabledSnaps.add(snap));
    snapEngine.orthoEnabled = !!profile.ortho;
    snapEngine.polarEnabled = !!profile.polar;
    snapEngine.trackingEnabled = !!profile.tracking;
    this.state.activeSnapProfile = key;
    this._saveState();
    this._syncSummary();
    if (announce) {
      this._toast(`${profile.label} snap profile ready`, "success");
    }
  }

  _zoomCurrentLayer() {
    const layerName = this.engine.currentLayer || this.app.layerManager?.currentLayer || "Layer 0";
    const entities = [...this.engine.entities.values()].filter((entity) => entity.layer === layerName);
    const bounds = mergeBounds(entities.map((entity) => entity.getBounds?.()));
    if (!bounds) {
      this._toast(`No geometry on ${layerName}`, "warning");
      return;
    }
    this._pushCurrentView();
    this.viewport.zoomExtents(bounds);
    this.app.renderer.dirty = true;
    this._toast(`Zoomed to ${layerName}`, "success");
  }

  _applyWorkspacePreset(name, announce = true) {
    const presets = {
      draft: {
        focusMode: false,
        tabbarCollapsed: false,
        ribbonCollapsed: false,
        sidebarCollapsed: false,
        inspectorCollapsed: false,
        commandCollapsed: false,
        rulersHidden: false,
        minimapHidden: false,
        zoomHudHidden: false,
        statusCollapsed: false,
      },
      review: {
        focusMode: false,
        tabbarCollapsed: false,
        ribbonCollapsed: true,
        sidebarCollapsed: true,
        inspectorCollapsed: false,
        commandCollapsed: true,
        rulersHidden: false,
        minimapHidden: true,
        zoomHudHidden: false,
        statusCollapsed: false,
      },
      plot: {
        focusMode: false,
        tabbarCollapsed: false,
        ribbonCollapsed: true,
        sidebarCollapsed: false,
        inspectorCollapsed: false,
        commandCollapsed: true,
        rulersHidden: true,
        minimapHidden: true,
        zoomHudHidden: true,
        statusCollapsed: false,
      },
      canvas: {
        focusMode: true,
        tabbarCollapsed: true,
        ribbonCollapsed: true,
        sidebarCollapsed: true,
        inspectorCollapsed: true,
        commandCollapsed: true,
        rulersHidden: true,
        minimapHidden: true,
        zoomHudHidden: true,
        statusCollapsed: true,
      },
    };
    const preset = presets[name];
    if (!preset) return;
    Object.assign(this.state, preset);
    this._applyLayout();
    this._saveState();
    if (announce) {
      this._toast(`${name === "canvas" ? "Canvas Max" : name[0].toUpperCase() + name.slice(1)} workspace ready`, "success");
    }
  }

  _toggleLayoutFlag(key) {
    this.state[key] = !this.state[key];
    if (key === "rulersHidden" && !this.state[key]) {
      this.app.renderer.dirty = true;
    }
    this._applyLayout();
    this._saveState();
  }

  _freezeCurrentLayer() {
    const current = this.engine.currentLayer || this.app.layerManager?.currentLayer || "Layer 0";
    if (!current || current === "Layer 0") {
      this._toast("Switch off Layer 0 before freezing the current layer.", "warning");
      return;
    }
    this.app.layerManager?.setCurrentLayer?.("Layer 0");
    this.engine.currentLayer = this.app.layerManager?.currentLayer || "Layer 0";
    this._setLayerProp(current, "frozen", true);
    this._setLayerProp(current, "visible", true);
    this.app.renderer.dirty = true;
    this._syncSummary();
    this._toast(`Froze ${current}`, "success");
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

  _moveSelectionToLayer(layerName) {
    const targetLayer = String(layerName || "").trim();
    const selected = this.selectionManager?.getSelectedEntities?.() || [];
    if (!selected.length) {
      this._toast("Select geometry first.", "warning");
      return false;
    }
    if (!targetLayer) {
      this._toast("Choose a target layer.", "warning");
      return false;
    }
    if (!this._getLayerNames().includes(targetLayer)) {
      const created = this.app.layerManager?.addLayer?.({
        name: targetLayer,
        color: { ...(this.engine.currentColor || { r: 255, g: 255, b: 255, index: 7 }) },
        linetype: this.engine.currentLinetype || "Continuous",
        lineweight: this.engine.currentLineweight ?? 0.25,
        visible: true,
        frozen: false,
        locked: false,
        plot: true,
      }) || this.engine.addLayer?.(targetLayer);
      if (!created) {
        this._toast("That layer could not be created.", "warning");
        return false;
      }
    }
    selected.forEach((entity) => {
      entity.layer = targetLayer;
    });
    this.app.renderer.dirty = true;
    this.engine.markModified?.();
    this._syncSummary();
    this._toast(`Moved ${selected.length} item${selected.length === 1 ? "" : "s"} to ${targetLayer}`, "success");
    return true;
  }

  _toggleSelectionLock() {
    const selected = this.selectionManager?.getSelectedEntities?.() || [];
    if (!selected.length) {
      this._toast("Select geometry first.", "warning");
      return;
    }
    if (typeof this.app._toggleLockSelected === "function") {
      this.app._toggleLockSelected();
      return;
    }
    const nextLocked = !selected.every((entity) => !!entity.locked);
    selected.forEach((entity) => {
      entity.locked = nextLocked;
    });
    this.engine.markModified?.();
    this.app.renderer.dirty = true;
    this._toast(`${nextLocked ? "Locked" : "Unlocked"} ${selected.length} selected item${selected.length === 1 ? "" : "s"}`, "success");
    this._syncSummary();
  }

  _zoomSelection() {
    if (typeof this.app._zoomToSelection === "function") {
      this._pushCurrentView();
      this.app._zoomToSelection();
      return;
    }
    const selected = this.selectionManager.getSelectedEntities();
    const bounds = mergeBounds(selected.map((entity) => entity.getBounds?.()));
    if (!bounds) {
      this._toast("Select geometry first.", "warning");
      return;
    }
    this._pushCurrentView();
    this.viewport.zoomExtents(bounds);
    this.app.renderer.dirty = true;
  }

  _zoomExtents() {
    const bounds = this.engine.getExtents?.();
    if (!bounds) {
      this._toast("Nothing to frame yet.", "warning");
      return;
    }
    this._pushCurrentView();
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

  async _saveAutosaveSnapshot() {
    await this.fileWorkflow.saveAutosaveNow();
    this._refreshSessionPanel();
    this._toast("Autosave snapshot stored", "success");
  }

  async _clearAutosaveSnapshot() {
    await this.fileWorkflow.clearAutosave();
    this._refreshSessionPanel();
    this._toast("Autosave snapshot cleared", "success");
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

  _rehydrateLayoutState() {
    const serialized = this._getScopedValue(LAYOUT_STORAGE_KEY, null);
    this.layoutManager = new LayoutManager(this.engine);
    if (serialized?.layouts?.length || serialized?.activeTab) {
      this.layoutManager.deserialize(serialized);
    }
  }

  _persistLayoutState() {
    if (!this.layoutManager) return;
    this._setScopedValue(LAYOUT_STORAGE_KEY, this.layoutManager.serialize());
  }

  _getScopedStore(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  }

  _getScopedValue(key, fallback = null) {
    const scope = normalizeScope(this.fileWorkflow?.getState?.());
    const store = this._getScopedStore(key);
    return Object.prototype.hasOwnProperty.call(store, scope) ? store[scope] : fallback;
  }

  _getScopedEntries(key) {
    const scope = normalizeScope(this.fileWorkflow?.getState?.());
    const store = this._getScopedStore(key);
    return Array.isArray(store[scope]) ? store[scope] : [];
  }

  _setScopedValue(key, value) {
    const scope = normalizeScope(this.fileWorkflow?.getState?.());
    const store = this._getScopedStore(key);
    store[scope] = value;
    localStorage.setItem(key, JSON.stringify(store));
  }

  _setScopedEntries(key, entries) {
    const scope = normalizeScope(this.fileWorkflow?.getState?.());
    const store = this._getScopedStore(key);
    store[scope] = entries;
    localStorage.setItem(key, JSON.stringify(store));
  }

  _getSelectionSets() {
    return this._getScopedEntries(SELECTION_SET_STORAGE_KEY);
  }

  _setSelectionSets(entries) {
    this._setScopedEntries(SELECTION_SET_STORAGE_KEY, entries);
  }

  _getLayerStates() {
    return this._getScopedEntries(LAYER_STATE_STORAGE_KEY);
  }

  _setLayerStates(entries) {
    this._setScopedEntries(LAYER_STATE_STORAGE_KEY, entries);
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
      return { tabbarCollapsed: false, sidebarCollapsed: false, ribbonCollapsed: false, ribbonCompact: false, ribbonGroupState: {}, inspectorCollapsed: false, commandCollapsed: false, focusMode: false, rulersHidden: false, minimapHidden: false, zoomHudHidden: false, statusCollapsed: false, activeSnapProfile: "", autosaveEnabled: true, autosaveIntervalMs: 180000, sectionState: {}, floatingPanels: { inspector: { floating: false }, command: { floating: false } }, inspectorTab: "props", ribbonMode: "quick", ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
    } catch {
      return { tabbarCollapsed: false, sidebarCollapsed: false, ribbonCollapsed: false, ribbonCompact: false, ribbonGroupState: {}, inspectorCollapsed: false, commandCollapsed: false, focusMode: false, rulersHidden: false, minimapHidden: false, zoomHudHidden: false, statusCollapsed: false, activeSnapProfile: "", autosaveEnabled: true, autosaveIntervalMs: 180000, sectionState: {}, floatingPanels: { inspector: { floating: false }, command: { floating: false } }, inspectorTab: "props", ribbonMode: "quick" };
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
