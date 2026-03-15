/**
 * AfroDraft v6 — Status Bar
 * Bottom status bar: coordinate display, toggle buttons, units display.
 */

const TOGGLES = [
  { id: 'SNAP',   label: 'SNAP',   key: 'F9',  default: true },
  { id: 'GRID',   label: 'GRID',   key: 'F7',  default: true },
  { id: 'ORTHO',  label: 'ORTHO',  key: 'F8',  default: false },
  { id: 'POLAR',  label: 'POLAR',  key: 'F10', default: false },
  { id: 'OSNAP',  label: 'OSNAP',  key: 'F3',  default: true },
  { id: 'OTRACK', label: 'OTRACK', key: 'F11', default: false },
  { id: 'DYN',    label: 'DYN',    key: 'F12', default: false },
  { id: 'LWT',    label: 'LWT',    key: '',    default: false },
  { id: 'MODEL',  label: 'MODEL',  key: '',    default: true },
];

export class StatusBar {
  /**
   * @param {Object} snapEngine
   * @param {Object} gridRenderer
   */
  constructor(snapEngine, gridRenderer) {
    this.snapEngine = snapEngine;
    this.gridRenderer = gridRenderer;

    this.togglesContainer = document.getElementById('status-toggles');
    this.coordX = document.getElementById('coord-x');
    this.coordY = document.getElementById('coord-y');
    this.unitsEl = document.getElementById('status-units');

    /** @type {Object<string, boolean>} */
    this.state = {};
    this._buttons = {};

    this._buildToggles();
  }

  _buildToggles() {
    this.togglesContainer.innerHTML = '';
    for (const t of TOGGLES) {
      this.state[t.id] = t.default;
      const btn = document.createElement('button');
      btn.className = 'status-toggle' + (t.default ? ' on' : '');
      btn.textContent = t.label;
      btn.title = t.label + (t.key ? ` (${t.key})` : '');
      btn.dataset.id = t.id;

      btn.addEventListener('click', () => {
        this.toggle(t.id);
      });

      this._buttons[t.id] = btn;
      this.togglesContainer.appendChild(btn);
    }
  }

  /**
   * Toggle a status bar item on/off.
   * @param {string} id
   */
  toggle(id) {
    if (!(id in this.state)) return;
    this.state[id] = !this.state[id];
    const btn = this._buttons[id];
    if (btn) btn.classList.toggle('on', this.state[id]);

    // Apply side-effects
    if (id === 'GRID' && this.gridRenderer) {
      this.gridRenderer.visible = this.state[id];
    }
    if (id === 'SNAP' && this.snapEngine) {
      this.snapEngine.gridSnapEnabled = this.state[id];
    }
    if (id === 'OSNAP' && this.snapEngine) {
      this.snapEngine.objectSnapEnabled = this.state[id];
    }
    if (id === 'ORTHO') {
      // stored in state, queried by commands
    }
    if (id === 'POLAR') {
      // stored in state, queried by commands
      if (this.state[id]) this.state['ORTHO'] = false;
      this._buttons['ORTHO']?.classList.toggle('on', this.state['ORTHO']);
    }
    if (id === 'ORTHO' && this.state[id]) {
      this.state['POLAR'] = false;
      this._buttons['POLAR']?.classList.toggle('on', false);
    }
  }

  /**
   * Get a toggle state.
   * @param {string} id
   * @returns {boolean}
   */
  isOn(id) {
    return !!this.state[id];
  }

  /**
   * Handle function key press.
   * @param {string} key
   * @returns {boolean} true if handled
   */
  handleFKey(key) {
    for (const t of TOGGLES) {
      if (t.key && t.key === key) {
        this.toggle(t.id);
        return true;
      }
    }
    return false;
  }

  /**
   * Update coordinate display.
   * @param {number} x
   * @param {number} y
   * @param {number} [precision=4]
   */
  updateCoords(x, y, precision = 4) {
    this.coordX.innerHTML = `X: <b>${x.toFixed(precision)}</b>`;
    this.coordY.innerHTML = `Y: <b>${y.toFixed(precision)}</b>`;
  }

  /**
   * Set the units label.
   * @param {string} units
   */
  setUnits(units) {
    this.unitsEl.textContent = units;
  }
}
