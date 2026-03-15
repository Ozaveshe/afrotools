/**
 * AfroDraft v6 — Undo/Redo Manager
 * Records entity additions, removals, and property modifications
 * grouped by command for atomic undo/redo.
 */

export class UndoManager {
  /**
   * @param {import('./Engine.js').Engine} engine
   * @param {number} [maxSteps=500]
   */
  constructor(engine, maxSteps = 500) {
    this.engine = engine;
    this.maxSteps = maxSteps;
    this.undoStack = [];   // Array<CommandGroup>
    this.redoStack = [];   // Array<CommandGroup>
    this.recording = false;
    this.currentGroup = null;
  }

  // ===================== COMMAND GROUPING =====================

  /**
   * Begin recording changes for a command.
   * All changes between beginCommand and endCommand are grouped.
   * @param {string} name — command name (e.g., "LINE", "MOVE", "ERASE")
   */
  beginCommand(name) {
    if (this.recording && this.currentGroup) {
      // Nested command — auto-end previous
      this.endCommand();
    }
    this.recording = true;
    this.currentGroup = {
      name,
      actions: [],
      timestamp: Date.now(),
    };
  }

  /**
   * End the current command and push it to the undo stack.
   */
  endCommand() {
    if (!this.recording || !this.currentGroup) return;

    if (this.currentGroup.actions.length > 0) {
      this.undoStack.push(this.currentGroup);
      // Clear redo stack on new action
      this.redoStack = [];

      // Enforce max steps
      while (this.undoStack.length > this.maxSteps) {
        this.undoStack.shift();
      }
    }

    this.recording = false;
    this.currentGroup = null;
  }

  /**
   * Discard the current command without saving.
   */
  cancelCommand() {
    if (!this.recording || !this.currentGroup) return;

    // Reverse all actions in the current group
    const actions = this.currentGroup.actions;
    for (let i = actions.length - 1; i >= 0; i--) {
      this._applyInverse(actions[i]);
    }

    this.recording = false;
    this.currentGroup = null;
  }

  // ===================== RECORDING =====================

  /**
   * Record that an entity was added.
   * @param {Object} entity — the entity that was added (must have serialize())
   */
  recordAdd(entity) {
    if (!this.recording || !this.currentGroup) return;
    this.currentGroup.actions.push({
      type: 'add',
      entityId: entity.id,
      entityData: typeof entity.serialize === 'function' ? entity.serialize() : { ...entity },
    });
  }

  /**
   * Record that an entity was removed.
   * @param {Object} entity — the entity that was removed
   */
  recordRemove(entity) {
    if (!this.recording || !this.currentGroup) return;
    this.currentGroup.actions.push({
      type: 'remove',
      entityId: entity.id,
      entityData: typeof entity.serialize === 'function' ? entity.serialize() : { ...entity },
    });
  }

  /**
   * Record that an entity's properties were modified.
   * @param {number} entityId
   * @param {Object} oldProps — snapshot of old property values
   * @param {Object} newProps — snapshot of new property values
   */
  recordModify(entityId, oldProps, newProps) {
    if (!this.recording || !this.currentGroup) return;
    this.currentGroup.actions.push({
      type: 'modify',
      entityId,
      oldProps: this._deepCopy(oldProps),
      newProps: this._deepCopy(newProps),
    });
  }

  // ===================== UNDO / REDO =====================

  /**
   * Undo the last command group.
   * @param {Function} [deserializeEntity] — function to reconstruct entity from data
   * @returns {string|null} the name of the undone command, or null
   */
  undo(deserializeEntity) {
    if (this.undoStack.length === 0) return null;
    if (this.recording) this.endCommand();

    const group = this.undoStack.pop();

    // Apply actions in reverse order
    for (let i = group.actions.length - 1; i >= 0; i--) {
      this._applyInverse(group.actions[i], deserializeEntity);
    }

    this.redoStack.push(group);
    this.engine.emit('undo', { command: group.name });
    return group.name;
  }

  /**
   * Redo the last undone command group.
   * @param {Function} [deserializeEntity] — function to reconstruct entity from data
   * @returns {string|null} the name of the redone command, or null
   */
  redo(deserializeEntity) {
    if (this.redoStack.length === 0) return null;
    if (this.recording) this.endCommand();

    const group = this.redoStack.pop();

    // Apply actions in forward order
    for (const action of group.actions) {
      this._applyForward(action, deserializeEntity);
    }

    this.undoStack.push(group);
    this.engine.emit('redo', { command: group.name });
    return group.name;
  }

  // ===================== STATE QUERIES =====================

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get the name of the next undo command.
   * @returns {string|null}
   */
  undoName() {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].name;
  }

  /**
   * Get the name of the next redo command.
   * @returns {string|null}
   */
  redoName() {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].name;
  }

  /**
   * Clear all undo/redo history.
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.recording = false;
    this.currentGroup = null;
  }

  /**
   * Mark the current position as "saved" (for dirty tracking).
   * @returns {number} the current undo stack index
   */
  markSaved() {
    return this.undoStack.length;
  }

  /**
   * Check if the drawing has been modified since last save.
   * @param {number} savedIndex — from markSaved()
   * @returns {boolean}
   */
  isModifiedSince(savedIndex) {
    return this.undoStack.length !== savedIndex;
  }

  // ===================== INTERNAL =====================

  /**
   * Apply the inverse of an action (for undo / cancel).
   */
  _applyInverse(action, deserializeEntity) {
    switch (action.type) {
      case 'add': {
        // Inverse of add = remove
        const entity = this.engine.entities.get(action.entityId);
        if (entity) {
          this.engine.removeEntity(action.entityId);
        }
        break;
      }
      case 'remove': {
        // Inverse of remove = re-add
        let entity;
        if (deserializeEntity) {
          entity = deserializeEntity(action.entityData);
        } else {
          entity = action.entityData;
        }
        entity.id = action.entityId;
        this.engine.entities.set(entity.id, entity);
        this.engine._addToSpatialGrid(entity);
        if (entity.id >= this.engine.nextId) {
          this.engine.nextId = entity.id + 1;
        }
        this.engine.emit('entity-added', { entity });
        break;
      }
      case 'modify': {
        // Inverse of modify = restore old props
        const entity = this.engine.entities.get(action.entityId);
        if (entity) {
          this.engine._removeFromSpatialGrid(entity);
          this._applyProps(entity, action.oldProps);
          this.engine._addToSpatialGrid(entity);
          this.engine.emit('entity-modified', { entity });
        }
        break;
      }
    }
    this.engine.modified = true;
  }

  /**
   * Apply an action forward (for redo).
   */
  _applyForward(action, deserializeEntity) {
    switch (action.type) {
      case 'add': {
        let entity;
        if (deserializeEntity) {
          entity = deserializeEntity(action.entityData);
        } else {
          entity = action.entityData;
        }
        entity.id = action.entityId;
        this.engine.entities.set(entity.id, entity);
        this.engine._addToSpatialGrid(entity);
        if (entity.id >= this.engine.nextId) {
          this.engine.nextId = entity.id + 1;
        }
        this.engine.emit('entity-added', { entity });
        break;
      }
      case 'remove': {
        const entity = this.engine.entities.get(action.entityId);
        if (entity) {
          this.engine.removeEntity(action.entityId);
        }
        break;
      }
      case 'modify': {
        const entity = this.engine.entities.get(action.entityId);
        if (entity) {
          this.engine._removeFromSpatialGrid(entity);
          this._applyProps(entity, action.newProps);
          this.engine._addToSpatialGrid(entity);
          this.engine.emit('entity-modified', { entity });
        }
        break;
      }
    }
    this.engine.modified = true;
  }

  /**
   * Apply a set of properties to an entity.
   */
  _applyProps(entity, props) {
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Deep assign for nested objects (e.g., start, end, center)
        if (typeof entity[key] === 'object' && entity[key] !== null) {
          Object.assign(entity[key], value);
        } else {
          entity[key] = this._deepCopy(value);
        }
      } else if (Array.isArray(value)) {
        entity[key] = this._deepCopy(value);
      } else {
        entity[key] = value;
      }
    }
  }

  /**
   * Deep copy a plain object/array.
   */
  _deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this._deepCopy(item));
    const copy = {};
    for (const [key, value] of Object.entries(obj)) {
      copy[key] = this._deepCopy(value);
    }
    return copy;
  }
}
