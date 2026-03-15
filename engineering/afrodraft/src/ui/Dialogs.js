/**
 * AfroDraft v6 — Modal Dialogs
 * Settings, Page Setup, New Drawing, Help, About dialogs.
 */

const PAPER_SIZES = {
  'A4': { w: 297, h: 210 },
  'A3': { w: 420, h: 297 },
  'A2': { w: 594, h: 420 },
  'A1': { w: 841, h: 594 },
  'A0': { w: 1189, h: 841 },
  'ANSI A': { w: 279.4, h: 215.9 },
  'ANSI B': { w: 431.8, h: 279.4 },
  'ANSI C': { w: 558.8, h: 431.8 },
  'ANSI D': { w: 863.6, h: 558.8 },
  'ANSI E': { w: 1117.6, h: 863.6 },
  'Custom': { w: 420, h: 297 },
};

export class Dialogs {
  /**
   * @param {import('../core/Engine.js').Engine} engine
   * @param {import('../render/Viewport.js').Viewport} viewport
   */
  constructor(engine, viewport) {
    this.engine = engine;
    this.viewport = viewport;
    this.overlay = document.getElementById('modal-overlay');

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  close() {
    this.overlay.classList.add('hidden');
    this.overlay.innerHTML = '';
  }

  _open(title, bodyHtml, footerHtml = '') {
    this.overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;
    this.overlay.classList.remove('hidden');
    this.overlay.querySelector('#modal-close-btn')?.addEventListener('click', () => this.close());
  }

  // ── Settings Dialog ──
  showSettings() {
    const e = this.engine;
    this._open('Settings', `
      <div class="modal-row">
        <div class="modal-field">
          <label>Units</label>
          <select id="set-units">
            ${['mm', 'cm', 'm', 'inches', 'feet'].map(u => `<option value="${u}" ${u === e.units ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="modal-field">
          <label>Precision</label>
          <select id="set-precision">
            ${[0,1,2,3,4,5,6].map(p => `<option value="${p}" ${p === e.precision ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-field">
          <label>Angle Format</label>
          <select id="set-angle-fmt">
            ${['decimal', 'dms', 'grads', 'radians'].map(f => `<option value="${f}" ${f === e.angleFormat ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="modal-field">
          <label>Angle Precision</label>
          <select id="set-angle-prec">
            ${[0,1,2,3,4].map(p => `<option value="${p}" ${p === e.anglePrecision ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-field">
          <label>Grid Spacing</label>
          <input id="set-grid" type="number" min="0.1" step="0.5" value="10">
        </div>
        <div class="modal-field">
          <label>Snap Spacing</label>
          <input id="set-snap" type="number" min="0.1" step="0.5" value="5">
        </div>
      </div>
      <div class="modal-field">
        <label>Crosshair Size (%)</label>
        <input id="set-crosshair" type="range" min="5" max="100" value="50" style="width:100%">
      </div>
      <div class="modal-field">
        <label>Theme</label>
        <select id="set-theme">
          <option value="dark" selected>Dark</option>
          <option value="light">Light</option>
          <option value="blueprint">Blueprint</option>
          <option value="high-contrast">High Contrast</option>
        </select>
      </div>
    `, `
      <button class="modal-btn" id="set-cancel">Cancel</button>
      <button class="modal-btn primary" id="set-apply">Apply</button>
    `);

    this.overlay.querySelector('#set-cancel')?.addEventListener('click', () => this.close());
    this.overlay.querySelector('#set-apply')?.addEventListener('click', () => {
      e.units = this.overlay.querySelector('#set-units').value;
      e.precision = parseInt(this.overlay.querySelector('#set-precision').value);
      e.angleFormat = this.overlay.querySelector('#set-angle-fmt').value;
      e.anglePrecision = parseInt(this.overlay.querySelector('#set-angle-prec').value);

      // Theme
      const theme = this.overlay.querySelector('#set-theme').value;
      document.body.className = `theme-${theme}`;
      const themeLink = document.getElementById('theme-css');
      if (themeLink) themeLink.href = `assets/css/themes/${theme}.css`;

      this.close();
    });
  }

  // ── Page Setup Dialog ──
  showPageSetup() {
    this._open('Page Setup', `
      <div class="modal-field">
        <label>Paper Size</label>
        <select id="ps-paper">
          ${Object.keys(PAPER_SIZES).map(k => `<option value="${k}">${k} (${PAPER_SIZES[k].w} x ${PAPER_SIZES[k].h} mm)</option>`).join('')}
        </select>
      </div>
      <div class="modal-row">
        <div class="modal-field">
          <label>Orientation</label>
          <select id="ps-orient">
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Scale</label>
          <select id="ps-scale">
            <option value="1:1">1:1</option>
            <option value="1:2">1:2</option>
            <option value="1:5">1:5</option>
            <option value="1:10">1:10</option>
            <option value="1:20">1:20</option>
            <option value="1:50">1:50</option>
            <option value="1:100">1:100</option>
            <option value="fit">Fit to Page</option>
          </select>
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-field">
          <label>Margin (mm)</label>
          <input id="ps-margin" type="number" min="0" step="1" value="10">
        </div>
      </div>
    `, `
      <button class="modal-btn" onclick="this.closest('#modal-overlay').classList.add('hidden')">Cancel</button>
      <button class="modal-btn primary" id="ps-apply">Apply</button>
    `);

    this.overlay.querySelector('#ps-apply')?.addEventListener('click', () => {
      const paper = this.overlay.querySelector('#ps-paper').value;
      const orient = this.overlay.querySelector('#ps-orient').value;
      const size = PAPER_SIZES[paper] || PAPER_SIZES['A3'];
      const w = orient === 'landscape' ? Math.max(size.w, size.h) : Math.min(size.w, size.h);
      const h = orient === 'landscape' ? Math.min(size.w, size.h) : Math.max(size.w, size.h);
      this.engine.limitsMax = { x: w, y: h };
      this.engine.markModified();
      this.close();
    });
  }

  // ── New Drawing Dialog ──
  showNewDrawing(onConfirm) {
    this._open('New Drawing', `
      <div class="modal-field">
        <label>Template</label>
        <select id="nd-template">
          ${Object.keys(PAPER_SIZES).map(k => `<option value="${k}">${k}</option>`).join('')}
        </select>
      </div>
      <div class="modal-field">
        <label>Drawing Name</label>
        <input id="nd-name" type="text" value="Untitled" style="width:100%">
      </div>
      <div class="modal-field">
        <label>Units</label>
        <select id="nd-units">
          ${['mm', 'cm', 'm', 'inches', 'feet'].map(u => `<option value="${u}">${u}</option>`).join('')}
        </select>
      </div>
    `, `
      <button class="modal-btn" id="nd-cancel">Cancel</button>
      <button class="modal-btn primary" id="nd-create">Create</button>
    `);

    this.overlay.querySelector('#nd-cancel')?.addEventListener('click', () => this.close());
    this.overlay.querySelector('#nd-create')?.addEventListener('click', () => {
      const template = this.overlay.querySelector('#nd-template').value;
      const name = this.overlay.querySelector('#nd-name').value || 'Untitled';
      const units = this.overlay.querySelector('#nd-units').value;
      this.close();
      if (onConfirm) onConfirm({ template, name, units, size: PAPER_SIZES[template] });
    });
  }

  // ── Help Dialog ──
  showHelp(shortcuts = []) {
    const rows = shortcuts.map(s =>
      `<tr><td>${s.keys}</td><td>${s.description}</td></tr>`
    ).join('');

    this._open('Keyboard Shortcuts & Help', `
      <h3 style="margin-bottom:8px;font-size:12px;color:var(--cad-text)">Quick Start</h3>
      <p style="font-size:11px;color:var(--cad-text-dim);margin-bottom:12px;line-height:1.5">
        Type commands in the command line at the bottom. Use the ribbon toolbar buttons or keyboard shortcuts.
        Click to place points, Enter to confirm, Escape to cancel.
      </p>
      <h3 style="margin-bottom:8px;font-size:12px;color:var(--cad-text)">Keyboard Shortcuts</h3>
      <table class="shortcut-table">
        <thead><tr><th>Key</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `);
  }

  // ── About Dialog ──
  showAbout() {
    this._open('About AfroDraft', `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:24px;font-weight:700;color:var(--cad-accent);margin-bottom:8px">AfroDraft v6</div>
        <div style="font-size:12px;color:var(--cad-text-dim);margin-bottom:16px">Professional 2D CAD for Engineers</div>
        <div style="font-size:11px;color:var(--cad-text-muted);line-height:1.6">
          Built by AfroTools<br>
          Free browser-based CAD drafting tool<br>
          An AutoCAD alternative for African engineers
        </div>
      </div>
    `);
  }
}
