import { DrawingFile } from "../core/DrawingFile.js";
import { DxfImporter } from "../io/DxfImporter.js";
import { DxfExporter } from "../io/DxfExporter.js";

const DEFAULT_STATE = {
  fileName: "Untitled-1.adraft",
  fileFormat: "adraft",
  sourceKind: "new",
  dirty: false,
};

const RECENT_FILES_STORAGE_KEY = "afrodraft.recent-files";
const RECENT_FILES_LIMIT = 12;

export class FileWorkflow {
  constructor(app, options = {}) {
    this.app = app;
    this.engine = app.engine;
    this.fileHandle = null;
    this.state = { ...DEFAULT_STATE };
    this.engine._currentFilename = this.state.fileName;
    this.toast = options.onToast || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onNeedDwgImportHelp = options.onNeedDwgImportHelp || (() => {});
    this.onNeedDwgSaveHelp = options.onNeedDwgSaveHelp || (() => {});
    this._boundKeydown = null;
    this._sessionStartedAt = Date.now();
    this._lastRecoveryInfo = null;
    this._emitState();
  }

  bindLegacyControls() {
    this._captureButton("btn-open", () => this.openDrawing());
    this._captureButton("btn-save", () => this.saveDrawing());
    this._captureButton("btn-saveas", () => this.saveAsProject(true));
  }

  bindShortcuts() {
    if (this._boundKeydown) return;
    this._boundKeydown = async (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (this._isTextInput(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "o") {
        event.preventDefault();
        await this.openDrawing();
      } else if (key === "s" && event.shiftKey) {
        event.preventDefault();
        await this.saveAsProject(true);
      } else if (key === "s") {
        event.preventDefault();
        await this.saveDrawing();
      }
    };
    document.addEventListener("keydown", this._boundKeydown, true);
  }

  getState() {
    return {
      ...this.state,
      dirty: !!this.engine.modified,
      hasHandle: !!this.fileHandle,
      canSave: this._canOverwriteCurrentFile(),
      canSaveAs: true,
      sessionStartedAt: this._sessionStartedAt,
      sessionAgeMs: Date.now() - this._sessionStartedAt,
      recentFiles: this.getRecentFiles(),
      recovery: this.getRecoveryInfo(),
    };
  }

  getRecentFiles() {
    return this._readRecentFiles();
  }

  getRecoveryInfo() {
    return this._lastRecoveryInfo ? { ...this._lastRecoveryInfo } : null;
  }

  async saveAutosaveNow() {
    await DrawingFile.autosave(this.engine);
    this._lastRecoveryInfo = await this.checkRecovery();
    this._emitState();
    return this._lastRecoveryInfo;
  }

  async clearAutosave() {
    await DrawingFile.clearAutosave();
    this._lastRecoveryInfo = { exists: false };
    this._emitState();
    return true;
  }

  async openRecentFile(entryOrIndex) {
    const recents = this.getRecentFiles();
    const entry = typeof entryOrIndex === "number" ? recents[entryOrIndex] : entryOrIndex;
    if (!entry) return false;
    const fileName = entry.fileName || entry.name;
    if (!fileName) return false;
    this.toast(`Locate ${fileName} in the picker to reopen it from disk.`, "info");
    return this.openDrawing();
  }

  async openDrawing(options = {}) {
    try {
      const picked = await this._pickDrawingFile(options);
      if (!picked) return false;
      await this.openPickedFile(picked.file, picked.handle || null);
      return true;
    } catch (error) {
      if (error?.message !== "cancelled") {
        this.toast(error.message || "Unable to open drawing.", "error");
      }
      return false;
    }
  }

  async openPickedFile(file, handle = null) {
    const name = file?.name || "";
    const ext = this._ext(name);
    if (ext === ".adraft" || ext === ".json") {
      const text = await file.text();
      DrawingFile.deserialize(text, this.engine);
      this._setState({
        fileHandle: handle,
        fileName: name || DEFAULT_STATE.fileName,
        fileFormat: "adraft",
        sourceKind: "project",
      });
      this._finalizeLoad();
      this._rememberRecentFile({
        fileName: this.state.fileName,
        fileFormat: "adraft",
        sourceKind: "project",
        lastAction: "open",
        hasHandle: !!handle,
        handleName: handle?.name || null,
      });
      this.toast(`Opened ${name}`, "success");
      return;
    }
    if (ext === ".dxf") {
      const text = await file.text();
      await this._loadDxfText(text, name, handle, "dxf");
      this._rememberRecentFile({
        fileName: this.state.fileName,
        fileFormat: "dxf",
        sourceKind: "dxf",
        lastAction: "open",
        hasHandle: !!handle,
        handleName: handle?.name || null,
      });
      this.toast(`Imported ${name}`, "success");
      return;
    }
    if (ext === ".dwg") {
      await this._loadDwgFile(file, handle);
      return;
    }
    throw new Error("Supported formats: ADRAFT, JSON, DXF, DWG.");
  }

  async saveDrawing() {
    if (this.state.fileFormat === "dxf") {
      return this.saveAsDxfPrimary();
    }
    if (this.state.fileFormat === "dwg") {
      return this.saveAsDwg();
    }
    return this.saveAsProject(false);
  }

  createNewProject(options = {}) {
    if (this.engine.modified && options.force !== true && options.confirmDiscard !== false) {
      const label = this.state.fileName || DEFAULT_STATE.fileName;
      const confirmed = typeof window === "undefined" || typeof window.confirm !== "function"
        ? true
        : window.confirm(`Start a new project and discard unsaved changes in ${label}?`);
      if (!confirmed) return false;
    }

    const nextName = this._withExt(options.fileName || DEFAULT_STATE.fileName, ".adraft");
    this.engine.clear();
    if (options.units) {
      this.engine.units = options.units;
    }
    this._setState({
      fileHandle: null,
      fileName: nextName,
      fileFormat: "adraft",
      sourceKind: "new",
    });
    this._finalizeLoad();
    this._rememberRecentFile({
      fileName: nextName,
      fileFormat: "adraft",
      sourceKind: "new",
      lastAction: "new",
      hasHandle: false,
    });
    this.toast(`Started ${nextName}`, "success");
    return true;
  }

  async checkRecovery() {
    this._lastRecoveryInfo = await DrawingFile.checkRecovery();
    this._emitState();
    return this._lastRecoveryInfo;
  }

  async recoverAutosave() {
    const recovery = await this.checkRecovery();
    if (!recovery?.exists) return false;
    const restored = await DrawingFile.recoverAutosave(this.engine);
    if (!restored) return false;
    this._setState({
      fileHandle: null,
      fileName: recovery.filename || this.engine._currentFilename || DEFAULT_STATE.fileName,
      fileFormat: "adraft",
      sourceKind: "project",
    });
    this._finalizeLoad();
    this._lastRecoveryInfo = recovery;
    this._rememberRecentFile({
      fileName: this.state.fileName,
      fileFormat: "adraft",
      sourceKind: "project",
      lastAction: "recover",
      lastSavedAt: recovery.timestamp || Date.now(),
      hasHandle: false,
      handleName: null,
    });
    this.toast(`Recovered ${this.state.fileName}`, "success");
    return true;
  }

  async saveAsProject(forceSaveAs = false) {
    const json = DrawingFile.serialize(this.engine);
    const fallbackName = this._withExt(this.state.fileName, ".adraft");
    let handle = this.state.fileFormat === "adraft" ? this.fileHandle : null;

    if (this._supportsSavePicker() && (forceSaveAs || !handle)) {
      handle = await window.showSaveFilePicker({
        suggestedName: fallbackName,
        types: [{ description: "AfroDraft Project", accept: { "application/json": [".adraft", ".json"] } }],
      });
    }

    if (handle) {
      await this._writeHandle(handle, json);
      this.fileHandle = handle;
      this.state.fileName = handle.name || fallbackName;
    } else {
      DrawingFile.saveToFile(this.engine, fallbackName);
      this.state.fileName = fallbackName;
    }

    this._setState({
      fileHandle: handle || null,
      fileName: this.state.fileName,
      fileFormat: "adraft",
      sourceKind: "project",
    });
    this.engine.markSaved();
    this._rememberRecentFile({
      fileName: this.state.fileName,
      fileFormat: "adraft",
      sourceKind: "project",
      lastAction: "save",
      lastSavedAt: Date.now(),
      hasHandle: !!handle,
      handleName: handle?.name || null,
    });
    this.toast(`Saved ${this.state.fileName}`, "success");
    return true;
  }

  async saveAsDxfPrimary() {
    const text = DxfExporter.export(this.engine);
    const fallbackName = this._withExt(this.state.fileName, ".dxf");
    let handle = this.state.fileFormat === "dxf" ? this.fileHandle : null;

    if (this._supportsSavePicker() && !handle) {
      handle = await window.showSaveFilePicker({
        suggestedName: fallbackName,
        types: [{ description: "AutoCAD DXF", accept: { "application/dxf": [".dxf"] } }],
      });
    }

    if (handle) {
      await this._writeHandle(handle, text);
      this.fileHandle = handle;
      this.state.fileName = handle.name || fallbackName;
    } else {
      this._downloadText(fallbackName, text, "application/dxf");
      this.state.fileName = fallbackName;
    }

    this._setState({
      fileHandle: handle || null,
      fileName: this.state.fileName,
      fileFormat: "dxf",
      sourceKind: "dxf",
    });
    this.engine.markSaved();
    this._rememberRecentFile({
      fileName: this.state.fileName,
      fileFormat: "dxf",
      sourceKind: "dxf",
      lastAction: "save",
      lastSavedAt: Date.now(),
      hasHandle: !!handle,
      handleName: handle?.name || null,
    });
    this.toast(`Saved ${this.state.fileName}`, "success");
    return true;
  }

  async exportDxf() {
    const name = this._withExt(this.state.fileName, ".dxf");
    this._downloadText(name, DxfExporter.export(this.engine), "application/dxf");
    this.toast(`Exported ${name}`, "success");
    return true;
  }

  async saveAsDwg() {
    const adapter = this._getDwgAdapter();
    if (!adapter) {
      this.onNeedDwgSaveHelp(this.getState());
      return false;
    }

    const result = adapter.export
      ? await adapter.export(this.engine, { app: this.app, fileName: this._withExt(this.state.fileName, ".dwg") })
      : adapter.save
        ? await adapter.save(this.engine, { app: this.app, fileName: this._withExt(this.state.fileName, ".dwg") })
        : null;

    if (result?.saved) {
      this._setState({ fileFormat: "dwg", sourceKind: "dwg", fileName: result.fileName || this._withExt(this.state.fileName, ".dwg") });
      this.engine.markSaved();
    this._rememberRecentFile({
      fileName: this.state.fileName,
      fileFormat: "dwg",
      sourceKind: "dwg",
      lastAction: "save",
      lastSavedAt: Date.now(),
      hasHandle: false,
      handleName: null,
    });
      this.toast(`Saved ${this.state.fileName}`, "success");
      return true;
    }

    if (result instanceof Blob || typeof result === "string") {
      const blob = result instanceof Blob ? result : new Blob([result], { type: "application/acad" });
      const fileName = this._withExt(this.state.fileName, ".dwg");
      this._downloadBlob(fileName, blob);
      this._setState({ fileFormat: "dwg", sourceKind: "dwg", fileName });
      this.engine.markSaved();
      this._rememberRecentFile({
        fileName,
        fileFormat: "dwg",
        sourceKind: "dwg",
        lastAction: "save",
        lastSavedAt: Date.now(),
        hasHandle: false,
        handleName: null,
      });
      this.toast(`Saved ${fileName}`, "success");
      return true;
    }

    throw new Error("DWG adapter did not return a usable export.");
  }

  async _loadDxfText(text, fileName, handle, sourceKind) {
    this.engine.clear();
    this.engine.layerManager?.deserialize([]);
    this.engine.styleManager?.deserialize({});
    if (this.engine.blockManager?.blocks?.clear) {
      this.engine.blockManager.blocks.clear();
    }
    await DxfImporter.import(text, this.engine);
    this._setState({
      fileHandle: handle,
      fileName: fileName || "drawing.dxf",
      fileFormat: sourceKind === "dwg" ? "dwg" : "dxf",
      sourceKind,
    });
    this._finalizeLoad();
  }

  async _loadDwgFile(file, handle) {
    const adapter = this._getDwgAdapter();
    if (!adapter) {
      this.onNeedDwgImportHelp(file);
      return;
    }

    const result = adapter.import
      ? await adapter.import(file, { app: this.app, engine: this.engine })
      : adapter.open
        ? await adapter.open(file, { app: this.app, engine: this.engine })
        : null;

    if (typeof result === "string") {
      await this._loadDxfText(result, file.name, handle, "dwg");
      this._rememberRecentFile({
        fileName: this.state.fileName,
        fileFormat: "dwg",
        sourceKind: "dwg",
        lastAction: "open",
        hasHandle: !!handle,
        handleName: handle?.name || null,
      });
      this.toast(`Opened ${file.name}`, "success");
      return;
    }
    if (result?.dxfText) {
      await this._loadDxfText(result.dxfText, file.name, handle, "dwg");
      this._rememberRecentFile({
        fileName: this.state.fileName,
        fileFormat: "dwg",
        sourceKind: "dwg",
        lastAction: "open",
        hasHandle: !!handle,
        handleName: handle?.name || null,
      });
      this.toast(`Opened ${file.name}`, "success");
      return;
    }
    if (result?.projectJson) {
      DrawingFile.deserialize(result.projectJson, this.engine);
      this._setState({ fileHandle: handle, fileName: file.name, fileFormat: "dwg", sourceKind: "dwg" });
      this._finalizeLoad();
      this._rememberRecentFile({
        fileName: this.state.fileName,
        fileFormat: "dwg",
        sourceKind: "dwg",
        lastAction: "open",
        hasHandle: !!handle,
        handleName: handle?.name || null,
      });
      this.toast(`Opened ${file.name}`, "success");
      return;
    }
    throw new Error("DWG adapter could not import this file.");
  }

  _finalizeLoad() {
    this.fileHandle = this.state.fileHandle || null;
    this.engine.markSaved();
    this.app.selectionManager?.deselectAll?.();
    const extents = this.engine.getExtents?.();
    if (extents) {
      this.app.viewport?.zoomExtents?.(extents);
    }
    if (this.app.renderer) {
      this.app.renderer.dirty = true;
    }
  }

  _setState(patch) {
    this.state = { ...this.state, ...patch, dirty: !!this.engine.modified };
    this.engine._currentFilename = this.state.fileName;
    this._emitState();
  }

  _canOverwriteCurrentFile() {
    return this.state.fileFormat === "adraft"
      ? !!this.fileHandle || !this._supportsSavePicker()
      : true;
  }

  _rememberRecentFile(details = {}) {
    const entry = this._normalizeRecentFile({
      fileName: details.fileName || this.state.fileName,
      fileFormat: details.fileFormat || this.state.fileFormat,
      sourceKind: details.sourceKind || this.state.sourceKind,
      lastAction: details.lastAction || "open",
      lastOpenedAt: Date.now(),
      lastSavedAt: details.lastSavedAt || null,
      hasHandle: !!details.hasHandle,
    });
    if (!entry) return null;

    const files = this._readRecentFiles();
    const key = this._recentFileKey(entry);
    const next = files.filter((item) => this._recentFileKey(item) !== key);
    next.unshift(entry);
    this._writeRecentFiles(next.slice(0, RECENT_FILES_LIMIT));
    this._emitState();
    return entry;
  }

  _normalizeRecentFile(entry) {
    const fileName = String(entry?.fileName || "").trim() || DEFAULT_STATE.fileName;
    const fileFormat = this._normalizeFormat(entry?.fileFormat || this._ext(fileName) || "adraft");
    const sourceKind = entry?.sourceKind || this._sourceKindFromFormat(fileFormat);
    const lastOpenedAt = Number(entry?.lastOpenedAt || Date.now());
    const lastSavedAt = entry?.lastSavedAt ? Number(entry.lastSavedAt) : null;
    return {
      fileName,
      fileFormat,
      sourceKind,
      lastAction: entry?.lastAction || "open",
      lastOpenedAt,
      lastSavedAt,
      hasHandle: !!entry?.hasHandle,
      handleName: entry?.handleName ? String(entry.handleName) : null,
    };
  }

  _recentFileKey(entry) {
    return `${this._normalizeFormat(entry?.fileFormat || "")}:${String(entry?.sourceKind || "")}:${String(entry?.fileName || "").toLowerCase()}`;
  }

  _normalizeFormat(format) {
    const clean = String(format || "").toLowerCase().replace(/^\./, "");
    if (clean === "json") return "adraft";
    if (clean === "acad") return "dwg";
    if (clean === "dwg" || clean === "dxf" || clean === "adraft") return clean;
    return "adraft";
  }

  _sourceKindFromFormat(format) {
    if (format === "dxf") return "dxf";
    if (format === "dwg") return "dwg";
    if (format === "adraft") return "project";
    return "new";
  }

  _readRecentFiles() {
    try {
      const raw = window.localStorage?.getItem(RECENT_FILES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((entry) => this._normalizeRecentFile(entry))
        .filter(Boolean)
        .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))
        .slice(0, RECENT_FILES_LIMIT);
    } catch {
      return [];
    }
  }

  _writeRecentFiles(entries) {
    try {
      window.localStorage?.setItem(RECENT_FILES_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage quota or privacy restrictions.
    }
  }

  _emitState() {
    this.onStateChange(this.getState());
  }

  _captureButton(id, handler) {
    const button = document.getElementById(id);
    if (!button || button.dataset.workspaceBound === "true") return;
    button.dataset.workspaceBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      handler();
    }, true);
  }

  async _pickDrawingFile(options = {}) {
    if (this._supportsOpenPicker()) {
      const handles = await window.showOpenFilePicker({
        excludeAcceptAllOption: false,
        multiple: false,
        types: [{
          description: "AfroDraft and CAD files",
          accept: {
            "application/json": [".adraft", ".json"],
            "application/dxf": [".dxf"],
            "application/acad": options.dxfOnly ? [".dxf"] : [".dxf", ".dwg"],
          },
        }],
      });
      const handle = handles?.[0];
      if (!handle) throw new Error("cancelled");
      return { handle, file: await handle.getFile() };
    }

    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = options.dxfOnly ? ".dxf" : ".adraft,.json,.dxf,.dwg";
      input.style.display = "none";
      document.body.appendChild(input);
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        input.remove();
        if (!file) {
          reject(new Error("cancelled"));
          return;
        }
        resolve({ file, handle: null });
      });
      input.click();
    });
  }

  async _writeHandle(handle, text) {
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  _downloadText(fileName, text, type) {
    this._downloadBlob(fileName, new Blob([text], { type }));
  }

  _downloadBlob(fileName, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  _withExt(fileName, ext) {
    const clean = (fileName || DEFAULT_STATE.fileName).replace(/\.[a-z0-9]+$/i, "");
    return `${clean}${ext}`;
  }

  _getDwgAdapter() {
    return window.afroDraftDwgAdapter || window.afrodraftDwgAdapter || null;
  }

  _supportsOpenPicker() {
    return typeof window.showOpenFilePicker === "function";
  }

  _supportsSavePicker() {
    return typeof window.showSaveFilePicker === "function";
  }

  _ext(fileName) {
    const match = String(fileName || "").toLowerCase().match(/\.[a-z0-9]+$/);
    return match ? match[0] : "";
  }

  _isTextInput(target) {
    const tag = target?.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable;
  }
}
