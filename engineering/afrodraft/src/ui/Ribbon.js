/**
 * AfroDraft v6 — Ribbon Toolbar
 * Horizontal ribbon with grouped tool buttons. Each button triggers a command.
 */

// SVG icon paths (simple 16x16 icons)
const ICONS = {
  // Draw
  line:       '<line x1="2" y1="13" x2="14" y2="3" stroke="currentColor" stroke-width="1.5"/>',
  polyline:   '<polyline points="2,13 6,5 10,10 14,3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  rectangle:  '<rect x="2" y="4" width="12" height="8" fill="none" stroke="currentColor" stroke-width="1.5" rx="0.5"/>',
  circle:     '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  arc:        '<path d="M3 12 A7 7 0 0 1 13 12" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  ellipse:    '<ellipse cx="8" cy="8" rx="6" ry="4" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  polygon:    '<polygon points="8,2 14,6 12,13 4,13 2,6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  spline:     '<path d="M2 12 C5 2, 11 14, 14 4" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  text:       '<text x="3" y="12" font-size="11" font-weight="700" fill="currentColor" font-family="sans-serif">A</text>',
  mtext:      '<text x="1" y="11" font-size="9" font-weight="600" fill="currentColor" font-family="sans-serif">Ab</text>',
  hatch:      '<rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/><line x1="3" y1="7" x2="9" y2="3" stroke="currentColor" stroke-width="0.7"/><line x1="3" y1="11" x2="13" y2="3" stroke="currentColor" stroke-width="0.7"/><line x1="5" y1="13" x2="13" y2="7" stroke="currentColor" stroke-width="0.7"/>',
  table:      '<rect x="2" y="3" width="12" height="10" fill="none" stroke="currentColor" stroke-width="1"/><line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" stroke-width="0.7"/><line x1="2" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="0.7"/><line x1="7" y1="3" x2="7" y2="13" stroke="currentColor" stroke-width="0.7"/>',
  point:      '<circle cx="8" cy="8" r="2" fill="currentColor"/><line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" stroke-width="0.7"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="0.7"/>',
  xline:      '<line x1="0" y1="14" x2="16" y2="2" stroke="currentColor" stroke-width="1" stroke-dasharray="2,2"/>',

  // Modify
  move:       '<path d="M8 2v12M2 8h12M8 2l-2 2M8 2l2 2M8 14l-2-2M8 14l2-2M2 8l2-2M2 8l2 2M14 8l-2-2M14 8l-2 2" fill="none" stroke="currentColor" stroke-width="1"/>',
  copy:       '<rect x="1" y="4" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1" rx="0.5"/><rect x="5" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1" rx="0.5" stroke-dasharray="2,1"/>',
  rotate:     '<path d="M12 4A5.5 5.5 0 1 0 13 9" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="14,2 12,4 14,6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  scale:      '<rect x="6" y="6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/><rect x="2" y="2" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1"/>',
  mirror:     '<line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1"/><polygon points="3,5 3,11 6,8" fill="none" stroke="currentColor" stroke-width="1"/><polygon points="13,5 13,11 10,8" fill="none" stroke="currentColor" stroke-width="1"/>',
  offset:     '<rect x="3" y="5" width="8" height="6" fill="none" stroke="currentColor" stroke-width="1"/><rect x="5" y="3" width="8" height="6" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1"/>',
  trim:       '<line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="5" y1="3" x2="5" y2="13" stroke="currentColor" stroke-width="1.5"/><line x1="11" y1="3" x2="11" y2="13" stroke="currentColor" stroke-width="1.5"/><line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="2.5" stroke="red"/>',
  extend:     '<line x1="2" y1="8" x2="10" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="3" x2="12" y2="13" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2,1"/>',
  fillet:     '<line x1="2" y1="12" x2="7" y2="7" stroke="currentColor" stroke-width="1.5"/><path d="M7 7 Q10 4 13 4" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="13" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.5"/>',
  chamfer:    '<line x1="2" y1="12" x2="6" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="8" x2="10" y2="4" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.5"/>',
  array:      '<circle cx="4" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="4" r="1.5" fill="currentColor"/><circle cx="4" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/>',
  break_:     '<line x1="2" y1="8" x2="6" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5"/><path d="M6 6 L8 10 L10 6" fill="none" stroke="currentColor" stroke-width="1"/>',
  join:       '<line x1="2" y1="8" x2="7" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1"/>',
  explode:    '<line x1="8" y1="8" x2="3" y2="3" stroke="currentColor" stroke-width="1"/><line x1="8" y1="8" x2="13" y2="3" stroke="currentColor" stroke-width="1"/><line x1="8" y1="8" x2="3" y2="13" stroke="currentColor" stroke-width="1"/><line x1="8" y1="8" x2="13" y2="13" stroke="currentColor" stroke-width="1"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/>',
  stretch:    '<rect x="4" y="5" width="8" height="6" fill="none" stroke="currentColor" stroke-width="1"/><line x1="12" y1="5" x2="15" y2="3" stroke="currentColor" stroke-width="1" stroke-dasharray="1,1"/><line x1="12" y1="11" x2="15" y2="13" stroke="currentColor" stroke-width="1" stroke-dasharray="1,1"/>',
  matchprop:  '<rect x="2" y="3" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="8" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1"/><line x1="7" y1="5.5" x2="9" y2="10.5" stroke="currentColor" stroke-width="1"/>',

  // Annotate
  dimlinear:  '<line x1="3" y1="12" x2="3" y2="5" stroke="currentColor" stroke-width="0.7"/><line x1="13" y1="12" x2="13" y2="5" stroke="currentColor" stroke-width="0.7"/><line x1="3" y1="6" x2="13" y2="6" stroke="currentColor" stroke-width="1.2"/><polygon points="4,6 3,5 3,7" fill="currentColor"/><polygon points="12,6 13,5 13,7" fill="currentColor"/><text x="6" y="5" font-size="5" fill="currentColor" font-family="sans-serif">10</text>',
  dimaligned: '<line x1="2" y1="13" x2="14" y2="3" stroke="currentColor" stroke-width="0.7" stroke-dasharray="1,1"/><line x1="2" y1="11" x2="14" y2="1" stroke="currentColor" stroke-width="1.2"/>',
  dimangular: '<line x1="3" y1="12" x2="8" y2="4" stroke="currentColor" stroke-width="1"/><line x1="8" y1="4" x2="13" y2="12" stroke="currentColor" stroke-width="1"/><path d="M5 9 A5 5 0 0 0 11 9" fill="none" stroke="currentColor" stroke-width="1"/>',
  dimradius:  '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="0.7"/><line x1="8" y1="8" x2="13" y2="5" stroke="currentColor" stroke-width="1.2"/><text x="9" y="7" font-size="5" fill="currentColor" font-family="sans-serif">R</text>',
  dimdiameter:'<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="0.7"/><line x1="3" y1="11" x2="13" y2="5" stroke="currentColor" stroke-width="1.2"/>',
  leader:     '<polyline points="2,12 6,6 14,4" fill="none" stroke="currentColor" stroke-width="1.2"/><polygon points="2,12 4,10 3,11" fill="currentColor"/>',
  centermark: '<line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="0.7"/><line x1="8" y1="4" x2="8" y2="12" stroke="currentColor" stroke-width="0.7"/><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1"/>',
  dimordinate:'<line x1="4" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="0.7"/><line x1="4" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="0.7"/><circle cx="10" cy="6" r="1.5" fill="currentColor"/><line x1="10" y1="6" x2="10" y2="12" stroke="currentColor" stroke-width="1" stroke-dasharray="1,1"/>',

  // View
  zoomext:    '<rect x="2" y="2" width="12" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1"/><line x1="8" y1="5" x2="8" y2="11" stroke="currentColor" stroke-width="1"/>',
  zoomwin:    '<rect x="4" y="4" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1"/><line x1="14" y1="14" x2="16" y2="16" stroke="currentColor" stroke-width="1.5"/>',
  zoomprev:   '<path d="M4 8 A5 5 0 1 1 8 13" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="2,6 4,8 6,6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  pan:        '<path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1"/>',
  namedviews: '<rect x="2" y="3" width="12" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1"/>',
  redraw:     '<path d="M12 4A5.5 5.5 0 1 0 13 9" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="14,2 12,4 14,6" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  // Insert
  block:      '<rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/><rect x="6" y="6" width="4" height="4" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="0.7"/>',
  image:      '<rect x="2" y="3" width="12" height="10" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="6" cy="7" r="1.5" fill="currentColor"/><polyline points="2,12 6,8 9,10 12,6 14,8" fill="none" stroke="currentColor" stroke-width="1"/>',
  xref:       '<rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1"/><text x="5" y="11" font-size="8" fill="currentColor" font-family="sans-serif">X</text>',

  // Format
  layers:     '<line x1="2" y1="5" x2="14" y2="5" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" opacity="0.6"/><line x1="2" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>',
  textstyles: '<text x="2" y="12" font-size="11" font-weight="700" fill="currentColor" font-family="serif">T</text><text x="8" y="10" font-size="7" fill="currentColor" font-family="sans-serif" font-style="italic">s</text>',
  dimstyles:  '<text x="2" y="12" font-size="9" font-weight="600" fill="currentColor" font-family="sans-serif">D</text><line x1="9" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1"/>',
  linetype:   '<line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2"/>',
  units:      '<text x="3" y="12" font-size="10" font-weight="600" fill="currentColor" font-family="sans-serif">mm</text>',
};

function svgIcon(name) {
  const path = ICONS[name] || '';
  return `<svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
}

/** Ribbon tool group definitions */
const GROUPS = [
  {
    label: 'Draw',
    tools: [
      { cmd: 'LINE',      icon: 'line',      tip: 'Line',              shortcut: 'L' },
      { cmd: 'POLYLINE',  icon: 'polyline',   tip: 'Polyline',          shortcut: 'PL' },
      { cmd: 'RECTANGLE', icon: 'rectangle',  tip: 'Rectangle',         shortcut: 'REC' },
      { cmd: 'CIRCLE',    icon: 'circle',     tip: 'Circle',            shortcut: 'C' },
      { cmd: 'ARC',       icon: 'arc',        tip: 'Arc',               shortcut: 'A' },
      { cmd: 'ELLIPSE',   icon: 'ellipse',    tip: 'Ellipse',           shortcut: 'EL' },
      { cmd: 'POLYGON',   icon: 'polygon',    tip: 'Polygon',           shortcut: 'POL' },
      { cmd: 'SPLINE',    icon: 'spline',     tip: 'Spline',            shortcut: 'SPL' },
      { cmd: 'TEXT',       icon: 'text',       tip: 'Single Line Text',  shortcut: 'DT' },
      { cmd: 'MTEXT',     icon: 'mtext',      tip: 'Multiline Text',    shortcut: 'MT' },
      { cmd: 'HATCH',     icon: 'hatch',      tip: 'Hatch',             shortcut: 'H' },
      { cmd: 'TABLE',     icon: 'table',      tip: 'Table',             shortcut: 'TB' },
      { cmd: 'POINT',     icon: 'point',      tip: 'Point',             shortcut: 'PO' },
      { cmd: 'XLINE',     icon: 'xline',      tip: 'Construction Line', shortcut: 'XL' },
    ],
  },
  {
    label: 'Modify',
    tools: [
      { cmd: 'MOVE',      icon: 'move',       tip: 'Move',              shortcut: 'M' },
      { cmd: 'COPY',      icon: 'copy',       tip: 'Copy',              shortcut: 'CO' },
      { cmd: 'ROTATE',    icon: 'rotate',     tip: 'Rotate',            shortcut: 'RO' },
      { cmd: 'SCALE',     icon: 'scale',      tip: 'Scale',             shortcut: 'SC' },
      { cmd: 'MIRROR',    icon: 'mirror',     tip: 'Mirror',            shortcut: 'MI' },
      { cmd: 'OFFSET',    icon: 'offset',     tip: 'Offset',            shortcut: 'O' },
      { cmd: 'TRIM',      icon: 'trim',       tip: 'Trim',              shortcut: 'TR' },
      { cmd: 'EXTEND',    icon: 'extend',     tip: 'Extend',            shortcut: 'EX' },
      { cmd: 'FILLET',    icon: 'fillet',      tip: 'Fillet',             shortcut: 'F' },
      { cmd: 'CHAMFER',   icon: 'chamfer',    tip: 'Chamfer',           shortcut: 'CHA' },
      { cmd: 'ARRAY',     icon: 'array',      tip: 'Array',             shortcut: 'AR' },
      { cmd: 'BREAK',     icon: 'break_',     tip: 'Break',             shortcut: 'BR' },
      { cmd: 'JOIN',      icon: 'join',       tip: 'Join',              shortcut: 'J' },
      { cmd: 'EXPLODE',   icon: 'explode',    tip: 'Explode',           shortcut: 'X' },
      { cmd: 'STRETCH',   icon: 'stretch',    tip: 'Stretch',           shortcut: 'S' },
      { cmd: 'MATCHPROP', icon: 'matchprop',  tip: 'Match Properties',  shortcut: 'MA' },
    ],
  },
  {
    label: 'Annotate',
    tools: [
      { cmd: 'DIMLINEAR',   icon: 'dimlinear',  tip: 'Linear Dimension',   shortcut: 'DLI' },
      { cmd: 'DIMALIGNED',  icon: 'dimaligned', tip: 'Aligned Dimension',  shortcut: 'DAL' },
      { cmd: 'DIMANGULAR',  icon: 'dimangular', tip: 'Angular Dimension',  shortcut: 'DAN' },
      { cmd: 'DIMRADIUS',   icon: 'dimradius',  tip: 'Radius Dimension',   shortcut: 'DRA' },
      { cmd: 'DIMDIAMETER', icon: 'dimdiameter',tip: 'Diameter Dimension', shortcut: 'DDI' },
      { cmd: 'LEADER',      icon: 'leader',     tip: 'Leader',             shortcut: 'LE' },
      { cmd: 'CENTERMARK',  icon: 'centermark', tip: 'Center Mark',        shortcut: '' },
      { cmd: 'DIMORDINATE', icon: 'dimordinate', tip: 'Ordinate Dimension', shortcut: 'DOR' },
    ],
  },
  {
    label: 'View',
    tools: [
      { cmd: 'ZOOM_EXTENTS', icon: 'zoomext',    tip: 'Zoom Extents',    shortcut: 'Z E' },
      { cmd: 'ZOOM_WINDOW',  icon: 'zoomwin',    tip: 'Zoom Window',     shortcut: 'Z W' },
      { cmd: 'ZOOM_PREVIOUS',icon: 'zoomprev',   tip: 'Zoom Previous',   shortcut: 'Z P' },
      { cmd: 'PAN',          icon: 'pan',         tip: 'Pan',             shortcut: 'P' },
      { cmd: 'NAMEDVIEWS',   icon: 'namedviews', tip: 'Named Views',     shortcut: '' },
      { cmd: 'REDRAW',       icon: 'redraw',     tip: 'Redraw',          shortcut: '' },
    ],
  },
  {
    label: 'Insert',
    tools: [
      { cmd: 'INSERT',     icon: 'block',  tip: 'Block Insert',      shortcut: 'I' },
      { cmd: 'IMAGEINS',   icon: 'image',  tip: 'Image Insert',      shortcut: '' },
      { cmd: 'TABLE',      icon: 'table',  tip: 'Table',             shortcut: '' },
      { cmd: 'XREF',       icon: 'xref',   tip: 'External Reference', shortcut: '' },
    ],
  },
  {
    label: 'Format',
    tools: [
      { cmd: 'LAYER',       icon: 'layers',     tip: 'Layer Manager',   shortcut: 'LA' },
      { cmd: 'TEXTSTYLE',   icon: 'textstyles',  tip: 'Text Styles',    shortcut: 'ST' },
      { cmd: 'DIMSTYLE',    icon: 'dimstyles',   tip: 'Dim Styles',     shortcut: 'D' },
      { cmd: 'LINETYPE',    icon: 'linetype',    tip: 'Linetype',       shortcut: 'LT' },
      { cmd: 'UNITS',       icon: 'units',       tip: 'Units',          shortcut: 'UN' },
    ],
  },
];

export class Ribbon {
  /**
   * @param {import('../commands/CommandRegistry.js').CommandRegistry} commandRegistry
   */
  constructor(commandRegistry) {
    this.commandRegistry = commandRegistry;
    this.container = document.getElementById('ribbon');
    this.collapsed = false;
    this._activeBtn = null;
    this._tooltipEl = null;
    this.render();

    // Track active command to highlight buttons
    this.commandRegistry.on('command-started', (e) => this._setActive(e.name));
    this.commandRegistry.on('command-ended', () => this._setActive(null));
  }

  render() {
    this.container.innerHTML = '';

    for (const group of GROUPS) {
      const groupEl = document.createElement('div');
      groupEl.className = 'ribbon-group';

      const toolsEl = document.createElement('div');
      toolsEl.className = 'ribbon-group-tools';

      for (const tool of group.tools) {
        const btn = document.createElement('button');
        btn.className = 'ribbon-btn';
        btn.innerHTML = svgIcon(tool.icon);
        btn.title = tool.tip + (tool.shortcut ? ` (${tool.shortcut})` : '');
        btn.dataset.cmd = tool.cmd;
        btn.dataset.shortcut = tool.shortcut || '';

        btn.addEventListener('click', () => {
          this.commandRegistry.execute(tool.cmd);
        });

        btn.addEventListener('mouseenter', (e) => this._showTooltip(e, tool));
        btn.addEventListener('mouseleave', () => this._hideTooltip());

        toolsEl.appendChild(btn);
      }

      const labelEl = document.createElement('div');
      labelEl.className = 'ribbon-group-label';
      labelEl.textContent = group.label;

      groupEl.appendChild(toolsEl);
      groupEl.appendChild(labelEl);
      this.container.appendChild(groupEl);
    }

    // Collapse toggle
    const toggle = document.createElement('button');
    toggle.className = 'ribbon-collapse';
    toggle.innerHTML = '&#9650;';
    toggle.title = 'Collapse/Expand Ribbon';
    toggle.addEventListener('click', () => this.toggleCollapse());
    this.container.appendChild(toggle);
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.container.classList.toggle('collapsed', this.collapsed);
  }

  _setActive(cmdName) {
    if (this._activeBtn) {
      this._activeBtn.classList.remove('active');
      this._activeBtn = null;
    }
    if (cmdName) {
      const btn = this.container.querySelector(`[data-cmd="${cmdName}"]`);
      if (btn) {
        btn.classList.add('active');
        this._activeBtn = btn;
      }
    }
  }

  _showTooltip(event, tool) {
    this._hideTooltip();
    const rect = event.target.getBoundingClientRect();
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = `${tool.tip}${tool.shortcut ? `<span class="tt-shortcut">${tool.shortcut}</span>` : ''}`;
    tip.style.left = rect.left + 'px';
    tip.style.top = (rect.bottom + 4) + 'px';
    document.body.appendChild(tip);
    this._tooltipEl = tip;
  }

  _hideTooltip() {
    if (this._tooltipEl) {
      this._tooltipEl.remove();
      this._tooltipEl = null;
    }
  }
}
