/**
 * AfroDraft v6 — Layer Panel
 * Layer manager within the properties panel.
 */

export class LayerPanel {
  /**
   * @param {import('../core/Engine.js').Engine} engine
   */
  constructor(engine) {
    this.engine = engine;
    this.container = document.getElementById('layer-panel');
    this.filterText = '';

    this.engine.on('layer-added', () => this.render());
    this.engine.on('layer-removed', () => this.render());
    this.engine.on('layer-changed', () => this.render());
    this.engine.on('drawing-loaded', () => this.render());
    this.engine.on('drawing-cleared', () => this.render());

    this.render();
  }

  render() {
    const layers = this.engine.layers;
    const current = this.engine.currentLayer;
    const names = Object.keys(layers).filter(n =>
      !this.filterText || n.toLowerCase().includes(this.filterText.toLowerCase())
    );

    this.container.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-header">
          Layers
          <span style="font-size:9px;color:var(--cad-text-muted)">(${Object.keys(layers).length})</span>
        </div>
        <div class="layer-toolbar">
          <button id="layer-add" title="New Layer">+ New</button>
          <button id="layer-del" title="Delete Layer">Delete</button>
          <input class="layer-search" id="layer-search" type="text" placeholder="Filter..." value="${this.filterText}">
        </div>
        <ul class="layer-list">
          ${names.map(name => {
            const l = layers[name];
            const isCurrent = name === current;
            const c = l.color || { r: 255, g: 255, b: 255 };
            return `
              <li class="layer-item${isCurrent ? ' current' : ''}" data-layer="${name}">
                <span class="color-swatch" style="background:rgb(${c.r},${c.g},${c.b})" data-action="color" title="Color"></span>
                <button class="layer-icon-btn${l.visible ? '' : ' off'}" data-action="visible" title="Visible">
                  ${l.visible ? '&#128065;' : '&#128064;'}
                </button>
                <button class="layer-icon-btn${l.frozen ? ' off' : ''}" data-action="frozen" title="Freeze">
                  ${l.frozen ? '&#10052;' : '&#9728;'}
                </button>
                <button class="layer-icon-btn${l.locked ? ' off' : ''}" data-action="locked" title="Lock">
                  ${l.locked ? '&#128274;' : '&#128275;'}
                </button>
                <span class="layer-name" data-action="select">${isCurrent ? '&#10003; ' : ''}${name}</span>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;

    // Event: add layer
    this.container.querySelector('#layer-add')?.addEventListener('click', () => {
      let i = 1;
      while (this.engine.layers[`Layer ${i}`]) i++;
      this.engine.addLayer(`Layer ${i}`);
    });

    // Event: delete layer
    this.container.querySelector('#layer-del')?.addEventListener('click', () => {
      if (current !== 'Layer 0' && current !== 'Defpoints') {
        this.engine.removeLayer(current);
      }
    });

    // Event: search filter
    this.container.querySelector('#layer-search')?.addEventListener('input', (e) => {
      this.filterText = e.target.value;
      this.render();
    });

    // Event: layer item actions
    this.container.querySelectorAll('.layer-item').forEach(item => {
      const name = item.dataset.layer;

      item.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        switch (action) {
          case 'select':
            this.engine.currentLayer = name;
            this.render();
            break;
          case 'visible':
            this.engine.setLayerProperty(name, 'visible', !layers[name].visible);
            break;
          case 'frozen':
            this.engine.setLayerProperty(name, 'frozen', !layers[name].frozen);
            break;
          case 'locked':
            this.engine.setLayerProperty(name, 'locked', !layers[name].locked);
            break;
          case 'color':
            // Simple color prompt (could be a proper color picker dialog)
            this._pickColor(name);
            break;
        }
      });

      // Double-click layer name to rename
      const nameEl = item.querySelector('.layer-name');
      nameEl?.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (name === 'Layer 0' || name === 'Defpoints') return;
        const newName = prompt('Rename layer:', name);
        if (newName && newName !== name && !this.engine.layers[newName]) {
          const props = { ...this.engine.layers[name] };
          this.engine.addLayer(newName, props);
          // Move entities
          for (const ent of this.engine.getAllEntities()) {
            if (ent.layer === name) ent.layer = newName;
          }
          if (this.engine.currentLayer === name) this.engine.currentLayer = newName;
          this.engine.removeLayer(name);
        }
      });
    });
  }

  _pickColor(layerName) {
    // Create a temporary color input
    const input = document.createElement('input');
    input.type = 'color';
    const c = this.engine.layers[layerName]?.color || { r: 255, g: 255, b: 255 };
    input.value = `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1)}`;
    input.addEventListener('change', () => {
      const hex = input.value;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      this.engine.setLayerProperty(layerName, 'color', { r, g, b, index: 7 });
    });
    input.click();
  }
}
