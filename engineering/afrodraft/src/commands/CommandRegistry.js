/**
 * AfroDraft v6 — Command Registry & Base Command
 *
 * Central registry for all CAD commands. Commands follow a state-machine
 * pattern: when active, the command receives mouse/keyboard events and
 * builds an entity step by step.
 *
 * Coordinate input parsing supports:
 *   "100,200"     — absolute world coordinates
 *   "@50,30"      — relative to last point
 *   "@100<45"     — polar (distance<angle) relative to last point
 */

// ─── Geometry helpers ──────────────────────────────────────────────────────────

const DEG = Math.PI / 180;

export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function midpoint(x1, y1, x2, y2) {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

export function pointOnCircle(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function normalizeAngle(a) {
  a = a % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a;
}

/**
 * Compute center of a circle through three points.
 * Returns null if the points are collinear.
 */
export function circumcenter(x1, y1, x2, y2, x3, y3) {
  const ax = x1, ay = y1;
  const bx = x2, by = y2;
  const cx = x3, cy = y3;
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-12) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
  return { x: ux, y: uy };
}

/**
 * Line-line intersection. Returns null if parallel.
 */
export function lineLineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(d) < 1e-12) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
  return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
}

// ─── Coordinate input parser ───────────────────────────────────────────────────

/**
 * Parse a text coordinate input. Returns { x, y } in world coords or null.
 *
 * @param {string} text        Raw text from the command line
 * @param {{x:number,y:number}|null} lastPt  Last input point (for relative/polar)
 * @returns {{x:number, y:number}|null}
 */
export function parseCoordinate(text, lastPt) {
  if (!text || typeof text !== 'string') return null;
  text = text.trim();

  // Polar: @distance<angle
  const polarMatch = text.match(/^@\s*([-+]?[\d.]+)\s*<\s*([-+]?[\d.]+)$/);
  if (polarMatch) {
    if (!lastPt) return null;
    const distance = parseFloat(polarMatch[1]);
    const angleDeg = parseFloat(polarMatch[2]);
    const angle = angleDeg * DEG;
    return {
      x: lastPt.x + distance * Math.cos(angle),
      y: lastPt.y + distance * Math.sin(angle),
    };
  }

  // Relative: @x,y
  const relMatch = text.match(/^@\s*([-+]?[\d.]+)\s*,\s*([-+]?[\d.]+)$/);
  if (relMatch) {
    if (!lastPt) return null;
    return {
      x: lastPt.x + parseFloat(relMatch[1]),
      y: lastPt.y + parseFloat(relMatch[2]),
    };
  }

  // Absolute: x,y
  const absMatch = text.match(/^([-+]?[\d.]+)\s*,\s*([-+]?[\d.]+)$/);
  if (absMatch) {
    return { x: parseFloat(absMatch[1]), y: parseFloat(absMatch[2]) };
  }

  // Single number (for commands that expect a distance/radius/angle)
  const numMatch = text.match(/^([-+]?[\d.]+)$/);
  if (numMatch) {
    return { value: parseFloat(numMatch[1]) };
  }

  return null;
}

/**
 * Parse a single numeric value from text.
 */
export function parseNumber(text) {
  if (!text) return null;
  const n = parseFloat(text.trim());
  return isFinite(n) ? n : null;
}

// ─── Selection helpers ─────────────────────────────────────────────────────────

/**
 * Prompt-driven object selection state machine.
 * Collects entities via clicks or window/crossing selection.
 */
export class SelectionCollector {
  /**
   * @param {import('../core/Engine.js').Engine} engine
   * @param {Function} onDone  called with {entities: Object[]} when selection confirmed
   */
  constructor(engine, onDone) {
    this.engine = engine;
    this.onDone = onDone;
    this.selected = [];
    this.windowStart = null;
    this.prompt = 'Select objects: ';
  }

  onClick(wx, wy) {
    if (this.windowStart) {
      // Second corner of selection window
      const p1 = this.windowStart;
      this.windowStart = null;
      const minX = Math.min(p1.x, wx);
      const minY = Math.min(p1.y, wy);
      const maxX = Math.max(p1.x, wx);
      const maxY = Math.max(p1.y, wy);
      // Left-to-right = window (fully contained), right-to-left = crossing
      const leftToRight = wx >= p1.x;
      const ents = leftToRight
        ? this.engine.getEntitiesFullyInBounds(minX, minY, maxX, maxY)
        : this.engine.getEntitiesInBounds(minX, minY, maxX, maxY);
      for (const e of ents) {
        if (!this.selected.includes(e)) this.selected.push(e);
      }
      this.prompt = `Select objects (${this.selected.length} found): `;
      return;
    }

    // Try pick
    const pick = this.engine.pickEntity(wx, wy, 5);
    if (pick) {
      if (!this.selected.includes(pick.entity)) {
        this.selected.push(pick.entity);
      }
      this.prompt = `Select objects (${this.selected.length} found): `;
    } else {
      // Start a selection window
      this.windowStart = { x: wx, y: wy };
      this.prompt = 'Specify opposite corner: ';
    }
  }

  onInput(text) {
    const t = text.trim().toLowerCase();
    if (t === '' || t === 'enter') {
      if (this.selected.length > 0) {
        this.onDone({ entities: this.selected });
      }
      return true; // consumed
    }
    return false;
  }

  onKey(key) {
    if (key === 'Enter' || key === 'Return') {
      if (this.selected.length > 0) {
        this.onDone({ entities: this.selected });
      }
      return true;
    }
    if (key === 'Escape') {
      this.selected = [];
      return true;
    }
    return false;
  }

  getPreview(mx, my) {
    if (!this.windowStart) return [];
    return [{
      type: 'selection-window',
      x1: this.windowStart.x,
      y1: this.windowStart.y,
      x2: mx,
      y2: my,
      crossing: mx < this.windowStart.x,
    }];
  }

  getPrompt() {
    return this.prompt;
  }
}

// ─── Base command class ────────────────────────────────────────────────────────

export class BaseCommand {
  /**
   * @param {import('../core/Engine.js').Engine} engine
   * @param {CommandRegistry} registry
   */
  constructor(engine, registry) {
    this.engine = engine;
    this.registry = registry;
    this.step = 0;
    this.prompts = [];
    this.preview = null;
    this.lastPoint = null;
    this.firstPoint = null;
    this._mouseX = 0;
    this._mouseY = 0;
  }

  /** Called when command is first activated. */
  start() {
    this.registry.emit('prompt', this.getPrompt());
  }

  /**
   * Handle a click at world coordinates.
   * @param {number} wx
   * @param {number} wy
   */
  onClick(wx, wy) {}

  /**
   * Update preview as mouse moves.
   * @param {number} wx
   * @param {number} wy
   */
  onMouseMove(wx, wy) {
    this._mouseX = wx;
    this._mouseY = wy;
  }

  /**
   * Handle text input from the command line.
   * @param {string} text
   */
  onInput(text) {}

  /**
   * Handle a special key press.
   * @param {string} key
   */
  onKey(key) {
    if (key === 'Escape') {
      this.cancel();
    }
  }

  /** Finalize the command, add entities, close undo group. */
  finish() {
    this.registry.emit('prompt', '');
    this.registry.deactivate();
  }

  /** Cancel the command, clean up. */
  cancel() {
    this.preview = null;
    this.registry.emit('prompt', '');
    this.registry.deactivate();
  }

  /**
   * Return preview entities for rubber-band rendering.
   * @returns {Object[]}
   */
  getPreview() {
    return this.preview ? [this.preview] : [];
  }

  /**
   * Return current prompt text.
   * @returns {string}
   */
  getPrompt() {
    return this.prompts[this.step] || '';
  }

  // ─── Helpers ───

  /** Parse typed input as a point (absolute, relative, or polar). */
  parsePoint(text) {
    return parseCoordinate(text, this.lastPoint);
  }

  /** Set the last input point and optionally the first point. */
  setPoint(x, y) {
    const pt = { x, y };
    this.lastPoint = pt;
    if (!this.firstPoint) this.firstPoint = pt;
  }

  /** Emit a message to the command line output area. */
  message(text) {
    this.registry.emit('output', text);
  }

  /** Shorthand for updating the prompt display. */
  prompt(text) {
    this.registry.emit('prompt', text);
  }
}

// ─── Command Registry ──────────────────────────────────────────────────────────

export class CommandRegistry {
  /**
   * @param {import('../core/Engine.js').Engine} engine
   */
  constructor(engine) {
    this.engine = engine;
    this.commands = new Map();       // name (upper) → { aliases, CommandClass }
    this.activeCommand = null;
    this.lastCommandName = null;
    this.listeners = {};
  }

  // ── Event system ──

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const list = this.listeners[event];
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  }

  emit(event, data) {
    const list = this.listeners[event];
    if (!list) return;
    for (const fn of list) {
      try { fn(data); } catch (e) { console.error(`CommandRegistry event error [${event}]:`, e); }
    }
  }

  // ── Registration ──

  /**
   * Register a command class.
   * @param {string} name       Primary name (e.g. 'LINE')
   * @param {string[]} aliases  Alternative names (e.g. ['L'])
   * @param {typeof BaseCommand} CommandClass
   */
  register(name, aliases, CommandClass) {
    const key = name.toUpperCase();
    const entry = { name: key, aliases: aliases.map(a => a.toUpperCase()), CommandClass };
    this.commands.set(key, entry);
    for (const alias of entry.aliases) {
      this.commands.set(alias, entry);
    }
  }

  // ── Execution ──

  /**
   * Execute a command by name.
   * @param {string} name
   * @param  {...any} args  Extra arguments forwarded to the command
   */
  execute(name, ...args) {
    const key = name.toUpperCase();
    const entry = this.commands.get(key);
    if (!entry) {
      this.emit('output', `Unknown command: ${name}`);
      return;
    }
    // Cancel any active command first
    if (this.activeCommand) {
      this.activeCommand.cancel();
      this.activeCommand = null;
    }
    const cmd = new entry.CommandClass(this.engine, this, ...args);
    this.activeCommand = cmd;
    this.lastCommandName = entry.name;
    this.engine.setCommand(entry.name);
    cmd.start();
    this.emit('command-started', { name: entry.name });
  }

  /**
   * Cancel the active command.
   */
  cancel() {
    if (this.activeCommand) {
      this.activeCommand.cancel();
      this.activeCommand = null;
      this.engine.endCommand();
      this.emit('command-ended', {});
    }
  }

  /**
   * Called by a command when it finishes or is cancelled.
   * @internal
   */
  deactivate() {
    this.activeCommand = null;
    this.engine.endCommand();
    this.emit('command-ended', {});
  }

  // ── Input forwarding ──

  handleClick(worldX, worldY) {
    if (this.activeCommand) {
      this.activeCommand.onClick(worldX, worldY);
    }
  }

  handleMouseMove(worldX, worldY) {
    if (this.activeCommand) {
      this.activeCommand.onMouseMove(worldX, worldY);
    }
  }

  handleKey(key) {
    if (this.activeCommand) {
      this.activeCommand.onKey(key);
    }
  }

  /**
   * Handle text input from the command line.
   * If no command is active, try to execute the text as a command name.
   */
  handleInput(text) {
    if (!text || typeof text !== 'string') return;
    const trimmed = text.trim();
    if (!trimmed) {
      // Empty enter — if a command is active, forward; otherwise repeat last
      if (this.activeCommand) {
        this.activeCommand.onInput('');
      } else {
        this.repeatLast();
      }
      return;
    }

    if (this.activeCommand) {
      this.activeCommand.onInput(trimmed);
    } else {
      // Try to execute as a command
      this.execute(trimmed);
    }
  }

  /**
   * Re-execute the last command.
   */
  repeatLast() {
    if (this.lastCommandName) {
      this.execute(this.lastCommandName);
    }
  }

  /**
   * Get preview entities for the currently active command.
   * @returns {Object[]}
   */
  getPreview() {
    if (this.activeCommand) {
      return this.activeCommand.getPreview();
    }
    return [];
  }

  /**
   * Get the current prompt text.
   * @returns {string}
   */
  getPrompt() {
    if (this.activeCommand) {
      return this.activeCommand.getPrompt();
    }
    return 'Command: ';
  }

  /**
   * Check if a command is currently active.
   * @returns {boolean}
   */
  isActive() {
    return this.activeCommand !== null;
  }
}
