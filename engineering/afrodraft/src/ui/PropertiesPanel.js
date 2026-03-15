/**
 * AfroDraft v6 — Properties Panel
 * Right-side panel showing entity properties or drawing defaults.
 */

export class PropertiesPanel {
  /**
   * @param {import('../core/Engine.js').Engine} engine
   * @param {import('../core/SelectionManager.js').SelectionManager} selectionManager
   */
  constructor(engine, selectionManager) {
    this.engine = engine;
    this.selectionManager = selectionManager;

    this.panel = document.getElementById('properties-panel');
    this.content = document.getElementById('props-content');
    this.toggleBtn = this.panel.querySelector('.panel-toggle');

    this.collapsed = false;

    this.toggleBtn.addEventListener('click', () => this.toggleCollapse());

    // Listen for selection changes (SelectionManager emits via engine)
    this.engine.on('selection-changed', () => this.update());
    this.engine.on('layer-changed', () => this.update());
    this.engine.on('entity-added', () => this.update());
    this.engine.on('entity-removed', () => this.update());

    this.update();
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.panel.classList.toggle('collapsed', this.collapsed);
    this.toggleBtn.innerHTML = this.collapsed ? '&lsaquo;' : '&rsaquo;';
  }

  update() {
    const selected = this.selectionManager ? this.selectionManager.getSelectedEntities() : [];

    if (selected.length === 0) {
      this._showDefaults();
    } else if (selected.length === 1) {
      this._showEntityProps(selected[0]);
    } else {
      this._showMultiProps(selected);
    }
  }

  _showDefaults() {
    const e = this.engine;
    const layerNames = Object.keys(e.layers);
    const linetypes = [...e.linetypes.keys()];

    this.content.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-header">Drawing Defaults</div>
        <div class="panel-section-body">
          <div class="prop-row">
            <span class="prop-label">Layer</span>
            <div class="prop-value">
              <select class="prop-select" id="prop-layer">
                ${layerNames.map(n => `<option value="${n}" ${n === e.currentLayer ? 'selected' : ''}>${n}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="prop-row">
            <span class="prop-label">Color</span>
            <div class="prop-value" style="display:flex;align-items:center;gap:4px;">
              <span class="color-swatch" id="prop-color-swatch" style="background:rgb(${e.currentColor.r},${e.currentColor.g},${e.currentColor.b})"></span>
              <span style="font-size:10px;color:var(--cad-text-dim)">${e.colorMode}</span>
            </div>
          </div>
          <div class="prop-row">
            <span class="prop-label">Linetype</span>
            <div class="prop-value">
              <select class="prop-select" id="prop-linetype">
                ${linetypes.map(n => `<option value="${n}" ${n === e.currentLinetype ? 'selected' : ''}>${n}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="prop-row">
            <span class="prop-label">Lineweight</span>
            <div class="prop-value">
              <input class="prop-input" id="prop-lineweight" type="number" step="0.05" min="0" value="${e.currentLineweight}">
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind events
    const layerSel = this.content.querySelector('#prop-layer');
    layerSel?.addEventListener('change', () => {
      this.engine.currentLayer = layerSel.value;
    });

    const ltSel = this.content.querySelector('#prop-linetype');
    ltSel?.addEventListener('change', () => {
      this.engine.currentLinetype = ltSel.value;
    });

    const lwInput = this.content.querySelector('#prop-lineweight');
    lwInput?.addEventListener('change', () => {
      const v = parseFloat(lwInput.value);
      if (isFinite(v) && v >= 0) this.engine.currentLineweight = v;
    });
  }

  _showEntityProps(entity) {
    const rows = [
      { label: 'Type', value: entity.type, readonly: true },
      { label: 'Layer', value: entity.layer, field: 'layer' },
      { label: 'Color', value: `rgb(${entity.color?.r || 255},${entity.color?.g || 255},${entity.color?.b || 255})`, type: 'color' },
      { label: 'Linetype', value: entity.linetype || 'Continuous', field: 'linetype' },
      { label: 'Lineweight', value: entity.lineweight ?? 0.25, field: 'lineweight', type: 'number' },
    ];

    // Type-specific properties
    switch (entity.type) {
      case 'line':
        rows.push(
          { label: 'Start X', value: entity.x1?.toFixed(4), field: 'x1', type: 'number' },
          { label: 'Start Y', value: entity.y1?.toFixed(4), field: 'y1', type: 'number' },
          { label: 'End X', value: entity.x2?.toFixed(4), field: 'x2', type: 'number' },
          { label: 'End Y', value: entity.y2?.toFixed(4), field: 'y2', type: 'number' },
        );
        break;
      case 'circle':
        rows.push(
          { label: 'Center X', value: entity.cx?.toFixed(4), field: 'cx', type: 'number' },
          { label: 'Center Y', value: entity.cy?.toFixed(4), field: 'cy', type: 'number' },
          { label: 'Radius', value: entity.radius?.toFixed(4), field: 'radius', type: 'number' },
        );
        break;
      case 'rectangle':
        rows.push(
          { label: 'X', value: entity.x?.toFixed(4), field: 'x', type: 'number' },
          { label: 'Y', value: entity.y?.toFixed(4), field: 'y', type: 'number' },
          { label: 'Width', value: entity.width?.toFixed(4), field: 'width', type: 'number' },
          { label: 'Height', value: entity.height?.toFixed(4), field: 'height', type: 'number' },
        );
        break;
      case 'arc':
        rows.push(
          { label: 'Center X', value: entity.cx?.toFixed(4), field: 'cx', type: 'number' },
          { label: 'Center Y', value: entity.cy?.toFixed(4), field: 'cy', type: 'number' },
          { label: 'Radius', value: entity.radius?.toFixed(4), field: 'radius', type: 'number' },
          { label: 'Start Angle', value: entity.startAngle?.toFixed(2), field: 'startAngle', type: 'number' },
          { label: 'End Angle', value: entity.endAngle?.toFixed(2), field: 'endAngle', type: 'number' },
        );
        break;
    }

    this.content.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-header">Entity Properties</div>
        <div class="panel-section-body">
          ${rows.map(r => `
            <div class="prop-row">
              <span class="prop-label">${r.label}</span>
              <div class="prop-value">
                ${r.readonly
                  ? `<span style="font-size:11px;color:var(--cad-text)">${r.value}</span>`
                  : r.type === 'color'
                    ? `<span class="color-swatch" style="background:${r.value}"></span>`
                    : `<input class="prop-input" type="${r.type || 'text'}" value="${r.value ?? ''}" data-field="${r.field || ''}" ${r.type === 'number' ? 'step="any"' : ''}>`
                }
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Bind change events for editable fields
    this.content.querySelectorAll('.prop-input[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;
        if (!field) return;
        const val = input.type === 'number' ? parseFloat(input.value) : input.value;
        if (input.type === 'number' && !isFinite(val)) return;
        entity[field] = val;
        this.engine.updateSpatialIndex(entity);
        this.engine.markModified();
      });
    });
  }

  _showMultiProps(entities) {
    const count = entities.length;
    const layers = new Set(entities.map(e => e.layer));
    const layerText = layers.size === 1 ? [...layers][0] : '*VARIES*';

    this.content.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-header">Selection (${count} objects)</div>
        <div class="panel-section-body">
          <div class="prop-row">
            <span class="prop-label">Count</span>
            <div class="prop-value"><span style="font-size:11px">${count}</span></div>
          </div>
          <div class="prop-row">
            <span class="prop-label">Layer</span>
            <div class="prop-value"><span style="font-size:11px">${layerText}</span></div>
          </div>
        </div>
      </div>
    `;
  }
}
