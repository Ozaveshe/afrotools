import { DrawingFile } from "../core/DrawingFile.js";
import { DxfImporter } from "../io/DxfImporter.js";
import { DxfExporter } from "../io/DxfExporter.js";

const DEFAULT_STATE = {
  fileName: "Untitled-1.adraft",
  fileFormat: "adraft",
  sourceKind: "new",
  dirty: false,
};

export class FileWorkflow {
  constructor(app, options = {}) {
    this.app = app;
    this.engine = app.engine;
    this.fileHandle = null;
    this.state = { ...DEFAULT_STATE };
    this.toast = options.onToast || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onNeedDwgImportHelp = options.onNeedDwgImportHelp || (() => {});
    this.onNeedDwgSaveHelp = options.onNeedDwgSaveHelp || (() => {});
    this._boundKeydown = null;
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
    return { ...this.state, dirty: !!this.engine.modified };
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
      this.toast(`Opened ${name}`, "success");
      return;
    }
    if (ext === ".dxf") {
      const text = await file.text();
      await this._loadDxfText(text, name, handle, "dxf");
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
      this.toast(`Saved ${this.state.fileName}`, "success");
      return true;
    }

    if (result instanceof Blob || typeof result === "string") {
      const blob = result instanceof Blob ? result : new Blob([result], { type: "application/acad" });
      const fileName = this._withExt(this.state.fileName, ".dwg");
      this._downloadBlob(fileName, blob);
      this._setState({ fileFormat: "dwg", sourceKind: "dwg", fileName });
      this.engine.markSaved();
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
      this.toast(`Opened ${file.name}`, "success");
      return;
    }
    if (result?.dxfText) {
      await this._loadDxfText(result.dxfText, file.name, handle, "dwg");
      this.toast(`Opened ${file.name}`, "success");
      return;
    }
    if (result?.projectJson) {
      DrawingFile.deserialize(result.projectJson, this.engine);
      this._setState({ fileHandle: handle, fileName: file.name, fileFormat: "dwg", sourceKind: "dwg" });
      this._finalizeLoad();
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
    this._emitState();
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
