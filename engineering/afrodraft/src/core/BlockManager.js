/**
 * AfroDraft v6 — Block Manager
 *
 * Manages block definitions and block references (inserts).
 * A block is a named collection of entities with a base point.
 * Block references are entities that instance a block at a
 * position, scale, and rotation.
 */

import { BlockRefEntity } from './Entity.js';

export class BlockManager {
  /**
   * @param {import('./Engine.js').Engine} [engine]
   */
  constructor(engine = null) {
    this.engine = engine;
    /** @type {Map<string, {name: string, basePoint: {x:number,y:number}, entities: Object[], attributes: Object[]}>} */
    this.blocks = new Map();
  }

  /**
   * Define a new block (or redefine an existing one).
   * @param {string} name
   * @param {{x:number, y:number}} basePoint
   * @param {Object[]} entities — array of entity objects; cloned on storage
   * @param {Object[]} [attributes] — attribute definitions [{tag, prompt, defaultValue, position, height, rotation}]
   * @returns {boolean}
   */
  defineBlock(name, basePoint, entities, attributes = []) {
    if (!name || name.trim() === '') return false;

    // Clone entities so the block definition is independent
    const clonedEntities = entities.map(e => {
      if (typeof e.clone === 'function') return e.clone();
      return JSON.parse(JSON.stringify(e));
    });

    // Translate entities relative to base point
    const bx = basePoint.x, by = basePoint.y;
    for (const ent of clonedEntities) {
      if (typeof ent.transform === 'function') {
        // Translation matrix: translate by -basePoint
        ent.transform([1, 0, -bx, 0, 1, -by]);
      }
    }

    this.blocks.set(name, {
      name,
      basePoint: { x: 0, y: 0 }, // Now at origin after translation
      entities: clonedEntities,
      attributes: attributes.map(a => ({ ...a })),
    });

    this._emit('block-defined', { name });
    return true;
  }

  /**
   * Get a block definition by name.
   * @param {string} name
   * @returns {Object|null}
   */
  getBlock(name) {
    return this.blocks.get(name) || null;
  }

  /**
   * Create a block reference entity for insertion.
   * Does NOT add it to the engine — caller must do engine.addEntity().
   * @param {string} name — block name
   * @param {{x:number, y:number}} insertPoint
   * @param {number} [scaleX=1]
   * @param {number} [scaleY=1]
   * @param {number} [rotation=0] — radians
   * @param {Object} [attributeValues] — {tag: value} overrides
   * @returns {BlockRefEntity|null}
   */
  insertBlock(name, insertPoint, scaleX = 1, scaleY = 1, rotation = 0, attributeValues = {}) {
    const block = this.blocks.get(name);
    if (!block) return null;

    const ref = new BlockRefEntity({
      blockName: name,
      insertPoint: { x: insertPoint.x, y: insertPoint.y },
      scale: { x: scaleX, y: scaleY },
      rotation,
      attributes: { ...attributeValues },
    });

    return ref;
  }

  /**
   * Edit a block definition, replacing its entities.
   * All block references in the drawing will reflect the change on next render.
   * @param {string} name
   * @param {Object[]} newEntities
   * @returns {boolean}
   */
  editBlock(name, newEntities) {
    const block = this.blocks.get(name);
    if (!block) return false;

    block.entities = newEntities.map(e => {
      if (typeof e.clone === 'function') return e.clone();
      return JSON.parse(JSON.stringify(e));
    });

    this._emit('block-edited', { name });
    return true;
  }

  /**
   * Remove a block definition. Also removes all block references in the engine.
   * @param {string} name
   * @returns {boolean}
   */
  removeBlock(name) {
    if (!this.blocks.has(name)) return false;

    // Remove all references in the engine
    if (this.engine) {
      const toRemove = [];
      for (const [id, entity] of this.engine.entities) {
        if (entity.type === 'blockref' && entity.blockName === name) {
          toRemove.push(id);
        }
      }
      for (const id of toRemove) {
        this.engine.removeEntity(id);
      }
    }

    this.blocks.delete(name);
    this._emit('block-removed', { name });
    return true;
  }

  /**
   * Purge unused block definitions (not referenced by any entity).
   * @returns {string[]} names of purged blocks
   */
  purgeUnused() {
    const usedNames = new Set();
    if (this.engine) {
      for (const entity of this.engine.entities.values()) {
        if (entity.type === 'blockref' && entity.blockName) {
          usedNames.add(entity.blockName);
        }
      }
    }

    const purged = [];
    for (const name of this.blocks.keys()) {
      if (!usedNames.has(name)) {
        this.blocks.delete(name);
        purged.push(name);
      }
    }

    if (purged.length > 0) {
      this._emit('blocks-purged', { names: purged });
    }
    return purged;
  }

  /**
   * Get all block names.
   * @returns {string[]}
   */
  getAllBlockNames() {
    return [...this.blocks.keys()];
  }

  /**
   * Get the number of references to a block in the drawing.
   * @param {string} name
   * @returns {number}
   */
  getReferenceCount(name) {
    if (!this.engine) return 0;
    let count = 0;
    for (const entity of this.engine.entities.values()) {
      if (entity.type === 'blockref' && entity.blockName === name) {
        count++;
      }
    }
    return count;
  }

  /**
   * Explode a block reference entity, replacing it with individual entities.
   * Returns the created entities (already added to engine).
   * @param {BlockRefEntity} blockRef
   * @returns {Object[]} the exploded entities
   */
  explodeBlockRef(blockRef) {
    const block = this.blocks.get(blockRef.blockName);
    if (!block) return [];

    const cos = Math.cos(blockRef.rotation);
    const sin = Math.sin(blockRef.rotation);
    const sx = blockRef.scale.x;
    const sy = blockRef.scale.y;
    const tx = blockRef.insertPoint.x;
    const ty = blockRef.insertPoint.y;

    // Combined scale + rotate + translate matrix
    const matrix = [
      sx * cos, -sy * sin, tx,
      sx * sin,  sy * cos, ty,
    ];

    const created = [];
    for (const ent of block.entities) {
      const clone = typeof ent.clone === 'function' ? ent.clone() : JSON.parse(JSON.stringify(ent));
      clone.layer = blockRef.layer;
      if (typeof clone.transform === 'function') {
        clone.transform(matrix);
      }
      if (this.engine) {
        this.engine.addEntity(clone);
      }
      created.push(clone);
    }

    // Remove the block reference
    if (this.engine && blockRef.id) {
      this.engine.removeEntity(blockRef.id);
    }

    return created;
  }

  // ── Serialization ──

  /**
   * Serialize all block definitions.
   * @returns {Object}
   */
  serialize() {
    const result = {};
    for (const [name, block] of this.blocks) {
      result[name] = {
        name: block.name,
        basePoint: { ...block.basePoint },
        entities: block.entities.map(e =>
          typeof e.serialize === 'function' ? e.serialize() : JSON.parse(JSON.stringify(e))
        ),
        attributes: block.attributes.map(a => ({ ...a })),
      };
    }
    return result;
  }

  /**
   * Restore block definitions from serialized data.
   * @param {Object} data — { blockName: { basePoint, entities[], attributes[] } }
   * @param {Function} deserializeEntity — function(data) => entity instance
   */
  deserialize(data, deserializeEntity) {
    this.blocks.clear();
    for (const [name, block] of Object.entries(data)) {
      this.blocks.set(name, {
        name: block.name || name,
        basePoint: block.basePoint ? { ...block.basePoint } : { x: 0, y: 0 },
        entities: (block.entities || []).map(e => deserializeEntity(e)),
        attributes: (block.attributes || []).map(a => ({ ...a })),
      });
    }
  }

  /** @private */
  _emit(event, data) {
    if (this.engine && typeof this.engine.emit === 'function') {
      this.engine.emit(event, data);
    }
  }
}
