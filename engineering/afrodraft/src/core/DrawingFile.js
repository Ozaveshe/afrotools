/**
 * AfroDraft v6 — Drawing File (Save / Load / Autosave)
 *
 * Handles .adraft JSON format serialization, file I/O via
 * browser APIs (File API + downloads), and autosave via IndexedDB.
 */

import {
  BaseEntity, LineEntity, PolylineEntity, CircleEntity, ArcEntity,
  EllipseEntity, PointEntity, TextEntity, MTextEntity, DimensionEntity,
  HatchEntity, BlockRefEntity, SplineEntity, ConstructionLineEntity,
  RayEntity, ImageEntity, TableEntity,
} from './Entity.js';

const DB_NAME = 'afrodraft-autosave';
const DB_VERSION = 1;
const STORE_NAME = 'drawings';
const AUTOSAVE_KEY = 'current';
const FILE_VERSION = '6.0';

/**
 * Entity type string to class mapping for deserialization.
 */
const ENTITY_MAP = {
  line: LineEntity,
  polyline: PolylineEntity,
  circle: CircleEntity,
  arc: ArcEntity,
  ellipse: EllipseEntity,
  point: PointEntity,
  text: TextEntity,
  mtext: MTextEntity,
  dimension: DimensionEntity,
  hatch: HatchEntity,
  blockref: BlockRefEntity,
  spline: SplineEntity,
  xline: ConstructionLineEntity,
  ray: RayEntity,
  image: ImageEntity,
  table: TableEntity,
};

/**
 * Deserialize a single entity from plain data.
 * @param {Object} data
 * @returns {BaseEntity|null}
 */
export function deserializeEntity(data) {
  if (!data || !data.type) return null;
  const Cls = ENTITY_MAP[data.type];
  if (Cls && typeof Cls.deserialize === 'function') {
    return Cls.deserialize(data);
  }
  // Fallback: base entity
  return BaseEntity.deserialize(data);
}

export class DrawingFile {
  /**
   * Serialize the engine state to a JSON string.
   * @param {import('./Engine.js').Engine} engine
   * @returns {string}
   */
  static serialize(engine) {
    const entities = [];
    for (const entity of engine.entities.values()) {
      if (typeof entity.serialize === 'function') {
        entities.push(entity.serialize());
      }
    }

    const layers = engine.layerManager
      ? engine.layerManager.serialize()
      : Object.entries(engine.layers).map(([name, props]) => ({ name, ...props }));

    const styles = engine.styleManager
      ? engine.styleManager.serialize()
      : {
          textStyles: [...engine.textStyles.values()],
          dimStyles: [...engine.dimStyles.values()],
        };

    const blocks = engine.blockManager
      ? engine.blockManager.serialize()
      : {};

    const data = {
      version: FILE_VERSION,
      created: new Date().toISOString(),
      units: engine.units,
      precision: engine.precision,
      angleFormat: engine.angleFormat,
      anglePrecision: engine.anglePrecision,
      angleBase: engine.angleBase,
      angleDirection: engine.angleDirection,
      origin: { ...engine.origin },
      limitsEnabled: engine.limitsEnabled,
      limitsMin: { ...engine.limitsMin },
      limitsMax: { ...engine.limitsMax },
      currentLayer: engine.currentLayer,
      layers,
      textStyles: styles.textStyles || [],
      dimStyles: styles.dimStyles || [],
      tableStyles: styles.tableStyles || [],
      linetypes: styles.linetypes || [],
      blocks,
      entities,
      nextId: engine.nextId,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Deserialize JSON into the engine, replacing all current data.
   * @param {string} json
   * @param {import('./Engine.js').Engine} engine
   */
  static deserialize(json, engine) {
    const data = JSON.parse(json);

    // Clear existing data
    engine.entities.clear();
    engine.spatialGrid.clear();

    // Restore settings
    if (data.units) engine.units = data.units;
    if (data.precision != null) engine.precision = data.precision;
    if (data.angleFormat) engine.angleFormat = data.angleFormat;
    if (data.anglePrecision != null) engine.anglePrecision = data.anglePrecision;
    if (data.angleBase != null) engine.angleBase = data.angleBase;
    if (data.angleDirection) engine.angleDirection = data.angleDirection;
    if (data.origin) engine.origin = { ...data.origin };
    if (data.limitsEnabled != null) engine.limitsEnabled = data.limitsEnabled;
    if (data.limitsMin) engine.limitsMin = { ...data.limitsMin };
    if (data.limitsMax) engine.limitsMax = { ...data.limitsMax };
    if (data.currentLayer) engine.currentLayer = data.currentLayer;

    // Restore layers
    if (data.layers) {
      if (engine.layerManager) {
        engine.layerManager.deserialize(data.layers);
      } else {
        engine.layers = {};
        for (const l of data.layers) {
          engine.layers[l.name] = { ...l };
        }
      }
    }

    // Restore styles
    if (engine.styleManager) {
      engine.styleManager.deserialize({
        textStyles: data.textStyles || [],
        dimStyles: data.dimStyles || [],
        tableStyles: data.tableStyles || [],
        linetypes: data.linetypes || [],
      });
    } else {
      if (data.textStyles) {
        engine.textStyles = new Map();
        for (const s of data.textStyles) engine.textStyles.set(s.name, s);
      }
      if (data.dimStyles) {
        engine.dimStyles = new Map();
        for (const s of data.dimStyles) engine.dimStyles.set(s.name, s);
      }
    }

    // Restore blocks
    if (data.blocks) {
      if (engine.blockManager) {
        engine.blockManager.deserialize(data.blocks, deserializeEntity);
      } else {
        engine.blocks.clear();
        for (const [name, block] of Object.entries(data.blocks)) {
          engine.blocks.set(name, {
            origin: block.basePoint || block.origin || { x: 0, y: 0 },
            entities: (block.entities || []).map(e => deserializeEntity(e)),
          });
        }
      }
    }

    // Restore entities
    if (data.nextId) engine.nextId = data.nextId;

    for (const eData of (data.entities || [])) {
      const entity = deserializeEntity(eData);
      if (entity) {
        engine.entities.set(entity.id, entity);
        engine._addToSpatialGrid(entity);
      }
    }

    engine.modified = false;
    engine.emit('drawing-loaded', {});
  }

  /**
   * Save the drawing to a file via browser download.
   * @param {import('./Engine.js').Engine} engine
   * @param {string} [filename='drawing.adraft']
   */
  static saveToFile(engine, filename) {
    filename = filename || 'drawing.adraft';
    if (!filename.endsWith('.adraft')) {
      filename += '.adraft';
    }

    const json = this.serialize(engine);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    engine.markSaved();
    engine.emit('file-saved', { filename });
  }

  /**
   * Open a .adraft file via the browser file picker.
   * @param {import('./Engine.js').Engine} engine
   * @returns {Promise<string>} the filename
   */
  static async openFile(engine) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.adraft,.json';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.addEventListener('change', async () => {
        const file = input.files[0];
        document.body.removeChild(input);

        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const text = await file.text();
          DrawingFile.deserialize(text, engine);
          engine.emit('file-opened', { filename: file.name });
          resolve(file.name);
        } catch (err) {
          reject(new Error(`Failed to open file: ${err.message}`));
        }
      });

      input.addEventListener('cancel', () => {
        document.body.removeChild(input);
        reject(new Error('File selection cancelled'));
      });

      input.click();
    });
  }

  // ── IndexedDB Autosave ──

  /**
   * Get (or create) the IndexedDB database.
   * @returns {Promise<IDBDatabase>}
   */
  static getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Autosave the current drawing to IndexedDB.
   * @param {import('./Engine.js').Engine} engine
   * @returns {Promise<void>}
   */
  static async autosave(engine) {
    try {
      const json = this.serialize(engine);
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const data = {
          json,
          timestamp: Date.now(),
          filename: engine._currentFilename || 'untitled.adraft',
        };
        const request = store.put(data, AUTOSAVE_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      });
    } catch (err) {
      console.warn('Autosave failed:', err);
    }
  }

  /**
   * Check if an autosave recovery exists.
   * @returns {Promise<{exists: boolean, timestamp?: number, filename?: string}>}
   */
  static async checkRecovery() {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(AUTOSAVE_KEY);
        request.onsuccess = () => {
          const data = request.result;
          if (data && data.json) {
            resolve({
              exists: true,
              timestamp: data.timestamp,
              filename: data.filename,
            });
          } else {
            resolve({ exists: false });
          }
        };
        request.onerror = () => resolve({ exists: false });
        tx.oncomplete = () => db.close();
      });
    } catch {
      return { exists: false };
    }
  }

  /**
   * Recover the autosaved drawing into the engine.
   * @param {import('./Engine.js').Engine} engine
   * @returns {Promise<boolean>}
   */
  static async recoverAutosave(engine) {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(AUTOSAVE_KEY);
        request.onsuccess = () => {
          const data = request.result;
          if (data && data.json) {
            try {
              DrawingFile.deserialize(data.json, engine);
              engine._currentFilename = data.filename;
              engine.emit('drawing-recovered', { filename: data.filename });
              resolve(true);
            } catch (err) {
              reject(new Error(`Recovery failed: ${err.message}`));
            }
          } else {
            resolve(false);
          }
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      });
    } catch (err) {
      console.warn('Recovery check failed:', err);
      return false;
    }
  }

  /**
   * Clear the autosave data.
   * @returns {Promise<void>}
   */
  static async clearAutosave() {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(AUTOSAVE_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      });
    } catch (err) {
      console.warn('Clear autosave failed:', err);
    }
  }

  /**
   * Start periodic autosave.
   * @param {import('./Engine.js').Engine} engine
   * @param {number} [intervalMs=30000] — autosave interval in milliseconds
   * @returns {number} interval ID (can be used with clearInterval)
   */
  static startAutosave(engine, intervalMs = 30000) {
    return setInterval(async () => {
      if (engine.modified) {
        await this.autosave(engine);
      }
    }, intervalMs);
  }
}
