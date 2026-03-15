/**
 * AfroDraft v6 — Command Line
 * Input field with history, autocomplete, and output display.
 */

const MAX_HISTORY = 50;

export class CommandLine {
  /**
   * @param {import('../commands/CommandRegistry.js').CommandRegistry} commandRegistry
   */
  constructor(commandRegistry) {
    this.commandRegistry = commandRegistry;

    this.area = document.getElementById('command-area');
    this.historyEl = document.getElementById('cmd-history');
    this.inputEl = document.getElementById('cmd-input');
    this.promptEl = document.getElementById('cmd-prompt');
    this.autocompleteEl = document.getElementById('cmd-autocomplete');

    /** @type {string[]} */
    this.inputHistory = [];
    this.historyIndex = -1;
    this.currentInput = '';

    this._setupEvents();
    this._setupRegistryListeners();
  }

  _setupEvents() {
    this.inputEl.addEventListener('keydown', (e) => this._onKeyDown(e));
    this.inputEl.addEventListener('input', () => this._onInput());

    // Click command area to focus input
    this.area.addEventListener('click', () => this.focus());

    // Close autocomplete on outside click
    document.addEventListener('click', (e) => {
      if (!this.autocompleteEl.contains(e.target) && e.target !== this.inputEl) {
        this._hideAutocomplete();
      }
    });
  }

  _setupRegistryListeners() {
    this.commandRegistry.on('prompt', (text) => {
      this.setPrompt(text || 'Command:');
    });

    this.commandRegistry.on('output', (text) => {
      this.addOutput(text);
    });

    this.commandRegistry.on('command-started', (e) => {
      this.addOutput(e.name, 'cmd');
    });

    this.commandRegistry.on('command-ended', () => {
      this.setPrompt('Command:');
    });
  }

  _onKeyDown(e) {
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        const text = this.inputEl.value;
        this._hideAutocomplete();

        if (text.trim()) {
          this.inputHistory.unshift(text.trim());
          if (this.inputHistory.length > MAX_HISTORY) this.inputHistory.pop();
        }
        this.historyIndex = -1;
        this.inputEl.value = '';

        this.commandRegistry.handleInput(text);
        break;
      }

      case 'Escape': {
        e.preventDefault();
        this._hideAutocomplete();
        this.inputEl.value = '';
        this.commandRegistry.cancel();
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        if (this.historyIndex === -1) {
          this.currentInput = this.inputEl.value;
        }
        if (this.historyIndex < this.inputHistory.length - 1) {
          this.historyIndex++;
          this.inputEl.value = this.inputHistory[this.historyIndex];
        }
        break;
      }

      case 'ArrowDown': {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.inputEl.value = this.inputHistory[this.historyIndex];
        } else if (this.historyIndex === 0) {
          this.historyIndex = -1;
          this.inputEl.value = this.currentInput;
        }
        break;
      }

      case 'Tab': {
        e.preventDefault();
        this._selectAutocomplete();
        break;
      }

      case ' ': {
        // Space repeats last command when input is empty and no command active
        if (!this.inputEl.value.trim() && !this.commandRegistry.isActive()) {
          e.preventDefault();
          this.commandRegistry.repeatLast();
        }
        break;
      }
    }
  }

  _onInput() {
    const text = this.inputEl.value.trim().toUpperCase();
    if (text.length >= 1 && !this.commandRegistry.isActive()) {
      this._showAutocomplete(text);
    } else {
      this._hideAutocomplete();
    }
  }

  _showAutocomplete(prefix) {
    const matches = [];
    const seen = new Set();
    for (const [key, entry] of this.commandRegistry.commands) {
      if (key.startsWith(prefix) && !seen.has(entry.name)) {
        seen.add(entry.name);
        matches.push(entry);
      }
    }
    if (matches.length === 0) {
      this._hideAutocomplete();
      return;
    }

    matches.sort((a, b) => a.name.localeCompare(b.name));
    const max = 10;
    this.autocompleteEl.innerHTML = '';
    this._acItems = [];

    for (let i = 0; i < Math.min(matches.length, max); i++) {
      const entry = matches[i];
      const item = document.createElement('div');
      item.className = 'ac-item' + (i === 0 ? ' selected' : '');
      const aliases = entry.aliases.length ? entry.aliases.join(', ') : '';
      item.innerHTML = `<span>${entry.name}</span>${aliases ? `<span class="ac-shortcut">${aliases}</span>` : ''}`;
      item.dataset.cmd = entry.name;
      item.addEventListener('click', () => {
        this.inputEl.value = entry.name;
        this._hideAutocomplete();
        this.inputEl.focus();
      });
      this.autocompleteEl.appendChild(item);
      this._acItems.push(item);
    }

    // Position above the input
    const rect = this.inputEl.getBoundingClientRect();
    this.autocompleteEl.style.left = rect.left + 'px';
    this.autocompleteEl.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    this.autocompleteEl.style.top = 'auto';
    this.autocompleteEl.classList.remove('hidden');
    this._acIndex = 0;
  }

  _hideAutocomplete() {
    this.autocompleteEl.classList.add('hidden');
    this._acItems = [];
    this._acIndex = -1;
  }

  _selectAutocomplete() {
    if (!this._acItems || this._acItems.length === 0) return;
    const idx = Math.max(0, this._acIndex);
    const item = this._acItems[idx];
    if (item) {
      this.inputEl.value = item.dataset.cmd;
      this._hideAutocomplete();
    }
  }

  /**
   * Set the command prompt text.
   * @param {string} text
   */
  setPrompt(text) {
    this.promptEl.textContent = text;
  }

  /**
   * Add a line to the command history output.
   * @param {string} text
   * @param {'cmd'|'out'|'err'} [type='out']
   */
  addOutput(text, type = 'out') {
    const line = document.createElement('div');
    line.className = `cmd-line ${type}`;
    line.textContent = text;
    this.historyEl.appendChild(line);

    // Trim history
    while (this.historyEl.children.length > MAX_HISTORY) {
      this.historyEl.removeChild(this.historyEl.firstChild);
    }

    this.historyEl.scrollTop = this.historyEl.scrollHeight;

    // Show expanded history
    this.area.classList.add('expanded');
    clearTimeout(this._collapseTimer);
    this._collapseTimer = setTimeout(() => {
      this.area.classList.remove('expanded');
    }, 5000);
  }

  /** Focus the command line input. */
  focus() {
    this.inputEl.focus();
  }

  /** Check if command line is focused. */
  isFocused() {
    return document.activeElement === this.inputEl;
  }
}
