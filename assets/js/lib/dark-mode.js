/**
 * AFROTOOLS — Dark Mode Toggle
 * ===================================================================
 * Manual dark mode toggle that works alongside prefers-color-scheme.
 * Stored in localStorage for persistence.
 *
 * Usage:
 *   AfroTools.darkMode.toggle()
 *   AfroTools.darkMode.set('dark' | 'light' | 'auto')
 *   AfroTools.darkMode.get() → 'dark' | 'light' | 'auto'
 *   AfroTools.darkMode.isDark() → boolean
 *
 * CSS:
 *   [data-theme="dark"] overrides prefers-color-scheme.
 *   [data-theme="light"] forces light mode.
 *   No data-theme → follows system preference ('auto').
 * ===================================================================
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'aft_theme';

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function setStored(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function isDark() {
    var stored = getStored();
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function get() {
    return getStored() || 'auto';
  }

  function set(theme) {
    if (theme === 'auto') {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      document.documentElement.removeAttribute('data-theme');
    } else {
      setStored(theme);
      applyTheme(theme);
    }
    // Dispatch event for components to react
    document.dispatchEvent(new CustomEvent('afrotools:theme-change', { detail: { theme: theme, isDark: isDark() } }));
  }

  function toggle() {
    set(isDark() ? 'light' : 'dark');
  }

  // Apply stored theme on load (before paint)
  var stored = getStored();
  if (stored) applyTheme(stored);

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
      if (!getStored()) { // Only react if user hasn't set manual preference
        document.dispatchEvent(new CustomEvent('afrotools:theme-change', { detail: { theme: 'auto', isDark: isDark() } }));
      }
    });
  }

  // Expose
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.darkMode = { toggle: toggle, set: set, get: get, isDark: isDark };

})();
