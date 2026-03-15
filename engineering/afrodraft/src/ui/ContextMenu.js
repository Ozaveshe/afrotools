/**
 * AfroDraft v6 — Context Menu
 * Right-click context menu with context-sensitive items.
 */

export class ContextMenu {
  /**
   * @param {import('../commands/CommandRegistry.js').CommandRegistry} commandRegistry
   * @param {import('../core/SelectionManager.js').SelectionManager} selectionManager
   */
  constructor(commandRegistry, selectionManager) {
    this.commandRegistry = commandRegistry;
    this.selectionManager = selectionManager;
    this.el = document.getElementById('context-menu');
    this._visible = false;

    // Close on click outside
    document.addEventListener('click', () => this.hide());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  /**
   * Show context menu at screen position.
   * @param {number} screenX
   * @param {number} screenY
   */
  show(screenX, screenY) {
    const items = this._buildItems();
    if (items.length === 0) return;

    this.el.innerHTML = '';
    for (const item of items) {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'ctx-separator';
        this.el.appendChild(sep);
        continue;
      }

      const el = document.createElement('div');
      el.className = 'ctx-item' + (item.disabled ? ' disabled' : '');
      el.innerHTML = `
        <span class="ctx-item-label">
          ${item.icon ? `<svg viewBox="0 0 16 16" width="14" height="14">${item.icon}</svg>` : ''}
          ${item.label}
        </span>
        ${item.shortcut ? `<span class="ctx-item-shortcut">${item.shortcut}</span>` : ''}
      `;
      if (!item.disabled) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hide();
          if (item.action) item.action();
        });
      }
      this.el.appendChild(el);
    }

    // Position
    const menuW = 200;
    const menuH = items.length * 28;
    let x = screenX;
    let y = screenY;
    if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 4;
    if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 4;
    this.el.style.left = x + 'px';
    this.el.style.top = y + 'px';
    this.el.classList.remove('hidden');
    this._visible = true;
  }

  hide() {
    this.el.classList.add('hidden');
    this._visible = false;
  }

  isVisible() {
    return this._visible;
  }

  _buildItems() {
    const hasSelection = this.selectionManager && this.selectionManager.getSelectedEntities().length > 0;
    const hasCommand = this.commandRegistry.isActive();
    const items = [];

    if (hasCommand) {
      // During a command
      items.push(
        { label: 'Enter', shortcut: 'Enter', action: () => this.commandRegistry.handleInput('') },
        { label: 'Cancel', shortcut: 'Esc', action: () => this.commandRegistry.cancel() },
        { separator: true },
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => this.commandRegistry.execute('UNDO') },
      );
    } else if (hasSelection) {
      // With selection
      items.push(
        { label: 'Move', shortcut: 'M', action: () => this.commandRegistry.execute('MOVE') },
        { label: 'Copy', shortcut: 'CO', action: () => this.commandRegistry.execute('COPY') },
        { label: 'Rotate', shortcut: 'RO', action: () => this.commandRegistry.execute('ROTATE') },
        { label: 'Scale', shortcut: 'SC', action: () => this.commandRegistry.execute('SCALE') },
        { label: 'Mirror', shortcut: 'MI', action: () => this.commandRegistry.execute('MIRROR') },
        { separator: true },
        { label: 'Delete', shortcut: 'Del', action: () => this.commandRegistry.execute('ERASE') },
        { label: 'Explode', shortcut: 'X', action: () => this.commandRegistry.execute('EXPLODE') },
        { separator: true },
        { label: 'Properties', shortcut: 'Ctrl+1', action: () => {} },
      );
    } else {
      // No selection, no command
      items.push(
        { label: 'Repeat Last', shortcut: 'Space', action: () => this.commandRegistry.repeatLast(),
          disabled: !this.commandRegistry.lastCommandName },
        { separator: true },
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => this.commandRegistry.execute('UNDO') },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => this.commandRegistry.execute('REDO') },
        { separator: true },
        { label: 'Pan', shortcut: 'P', action: () => this.commandRegistry.execute('PAN') },
        { label: 'Zoom Extents', shortcut: 'Z E', action: () => this.commandRegistry.execute('ZOOM_EXTENTS') },
        { separator: true },
        { label: 'Select All', shortcut: 'Ctrl+A', action: () => {
          if (this.selectionManager) this.selectionManager.selectAll();
        }},
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => this.commandRegistry.execute('PASTE'), disabled: true },
      );
    }

    return items;
  }
}
