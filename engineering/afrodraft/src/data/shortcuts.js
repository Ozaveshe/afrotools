/**
 * AfroDraft v6 — Default Keyboard Shortcuts
 *
 * Maps key sequences to command names. Single characters are
 * command-line aliases; modifier combos are keyboard shortcuts.
 *
 * Note: the CommandRegistry resolves uppercase command names.
 */

export const SHORTCUTS = {
  // ── Draw commands ──
  'L':    'LINE',
  'C':    'CIRCLE',
  'A':    'ARC',
  'PL':   'POLYLINE',
  'REC':  'RECTANGLE',
  'POL':  'POLYGON',
  'EL':   'ELLIPSE',
  'SPL':  'SPLINE',
  'XL':   'XLINE',
  'RAY':  'RAY',
  'T':    'TEXT',
  'MT':   'MTEXT',
  'H':    'HATCH',
  'B':    'BLOCK',
  'I':    'INSERT',
  'PT':   'POINT',
  'DO':   'DONUT',
  'REV':  'REVCLOUD',

  // ── Modify commands ──
  'M':    'MOVE',
  'CO':   'COPY',
  'RO':   'ROTATE',
  'SC':   'SCALE',
  'MI':   'MIRROR',
  'O':    'OFFSET',
  'TR':   'TRIM',
  'EX':   'EXTEND',
  'F':    'FILLET',
  'CHA':  'CHAMFER',
  'AR':   'ARRAY',
  'BR':   'BREAK',
  'J':    'JOIN',
  'X':    'EXPLODE',
  'S':    'STRETCH',
  'LEN':  'LENGTHEN',
  'MA':   'MATCHPROP',
  'PE':   'PEDIT',
  'AL':   'ALIGN',

  // ── Inquiry commands ──
  'DI':   'DIST',
  'AA':   'AREA',
  'ID':   'ID',
  'LI':   'LIST',

  // ── Dimension commands ──
  'DIM':  'DIMLINEAR',
  'DAL':  'DIMALIGNED',
  'DAN':  'DIMANGULAR',
  'DRA':  'DIMRADIUS',
  'DDI':  'DIMDIAMETER',
  'LE':   'LEADER',
  'DOR':  'DIMORDINATE',
  'QD':   'QDIM',
  'DCO':  'DIMCONTINUE',
  'DBA':  'DIMBASELINE',

  // ── Utilities ──
  'DIV':  'DIVIDE',
  'ME':   'MEASURE',
  'LA':   'LAYER',
  'LT':   'LINETYPE',
  'ST':   'STYLE',

  // ── Keyboard shortcuts (modifier combos) ──
  'Ctrl+Z':        'UNDO',
  'Ctrl+Y':        'REDO',
  'Ctrl+S':        'SAVE',
  'Ctrl+Shift+S':  'SAVEAS',
  'Ctrl+O':        'OPEN',
  'Ctrl+N':        'NEW',
  'Ctrl+A':        'SELECTALL',
  'Ctrl+P':        'PLOT',
  'Ctrl+C':        'COPYCLIP',
  'Ctrl+V':        'PASTECLIP',
  'Ctrl+X':        'CUTCLIP',
  'Ctrl+D':        'DXFEXPORT',
  'Ctrl+E':        'SVGEXPORT',
  'Ctrl+Shift+E':  'PDFEXPORT',
  'Ctrl+Shift+I':  'IMGEXPORT',

  // ── Special keys ──
  'Delete':  'ERASE',
  'Escape':  'CANCEL',
  'Space':   'REPEAT',
  'F1':      'HELP',
  'F2':      'CMDHISTORY',
  'F3':      'OSNAP_TOGGLE',
  'F7':      'GRID_TOGGLE',
  'F8':      'ORTHO_TOGGLE',
  'F9':      'SNAP_TOGGLE',
  'F10':     'POLAR_TOGGLE',
  'F11':     'OTRACK_TOGGLE',
  'F12':     'DYN_TOGGLE',
};

/**
 * Determine if a key string is a modifier-based shortcut (e.g. 'Ctrl+S').
 * @param {string} key
 * @returns {boolean}
 */
export function isModifierShortcut(key) {
  return /^(Ctrl|Alt|Shift|Meta|Cmd)\+/i.test(key);
}

/**
 * Build a lookup map from keyboard event to command name.
 * For modifier shortcuts, normalizes to 'Ctrl+Shift+KEY' format.
 * @param {Object} shortcuts — map like SHORTCUTS
 * @returns {Map<string, string>}
 */
export function buildShortcutMap(shortcuts) {
  const map = new Map();
  for (const [key, cmd] of Object.entries(shortcuts)) {
    map.set(key, cmd);
  }
  return map;
}

/**
 * Convert a KeyboardEvent to our shortcut key string.
 * @param {KeyboardEvent} e
 * @returns {string}
 */
export function eventToShortcutKey(e) {
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');

  let key = e.key;
  // Normalize single-character keys to uppercase
  if (key.length === 1) {
    key = key.toUpperCase();
  }
  // Don't include modifier keys themselves
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return '';

  if (parts.length > 0) {
    parts.push(key);
    return parts.join('+');
  }
  return key;
}
