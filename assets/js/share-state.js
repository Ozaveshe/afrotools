/* AfroTools Share State — shared state bus for cross-component communication */
window.AfroState = window.AfroState || {
  _listeners: {},
  set: function(key, val) { this[key] = val; (this._listeners[key] || []).forEach(function(fn){ fn(val); }); },
  get: function(key) { return this[key]; },
  on: function(key, fn) { (this._listeners[key] = this._listeners[key] || []).push(fn); }
};
