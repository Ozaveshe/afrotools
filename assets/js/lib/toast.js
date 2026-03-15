/**
 * AFROTOOLS — Toast Notification Library
 * ═══════════════════════════════════════════════════════════
 * Lightweight toast notifications. Bottom-right, auto-dismiss,
 * max 3 visible, accessible (role="alert").
 *
 * Usage:
 *   AfroTools.toast.success('Copied to clipboard');
 *   AfroTools.toast.error('Calculation failed');
 *   AfroTools.toast.info('PDF downloading...');
 *   AfroTools.toast.show('Custom message', 'success', 5000);
 * ═══════════════════════════════════════════════════════════
 */

(function (window) {
  'use strict';

  const MAX_VISIBLE = 3;
  let container = null;

  function ensureContainer() {
    if (container && document.body.contains(container)) return;
    container = document.createElement('div');
    container.className = 'afro-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }

  // Inject styles once
  if (!document.getElementById('afro-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'afro-toast-styles';
    style.textContent = `
      .afro-toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        max-width: 380px;
      }
      @media (max-width: 480px) {
        .afro-toast-container {
          left: 16px;
          right: 16px;
          bottom: 16px;
          max-width: none;
        }
      }
      .afro-toast {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 14px 18px;
        border-radius: 10px;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.5;
        color: #fff;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12);
        pointer-events: auto;
        cursor: default;
        transform: translateX(100%) scale(0.95);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      }
      .afro-toast.show {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      .afro-toast.hide {
        transform: translateX(100%) scale(0.95);
        opacity: 0;
      }
      .afro-toast--success { background: #0f172a; }
      .afro-toast--error   { background: #991b1b; }
      .afro-toast--info    { background: #0f172a; }
      .afro-toast--warning { background: #92400e; }
      .afro-toast-icon {
        flex-shrink: 0;
        font-size: 1.1rem;
        line-height: 1;
        margin-top: 1px;
      }
      .afro-toast-msg { flex: 1; }
      .afro-toast-close {
        flex-shrink: 0;
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        cursor: pointer;
        font-size: 1rem;
        padding: 0;
        margin-left: 4px;
        line-height: 1;
        transition: color 0.15s;
      }
      .afro-toast-close:hover { color: #fff; }
    `;
    document.head.appendChild(style);
  }

  const ICONS = {
    success: '\u2713',
    error: '\u2717',
    info: '\u2139',
    warning: '\u26A0',
  };

  function show(message, type = 'info', duration = 3500) {
    ensureContainer();

    // Enforce max visible
    const existing = container.querySelectorAll('.afro-toast');
    if (existing.length >= MAX_VISIBLE) {
      dismiss(existing[0]);
    }

    const el = document.createElement('div');
    el.className = `afro-toast afro-toast--${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <span class="afro-toast-icon">${ICONS[type] || ICONS.info}</span>
      <span class="afro-toast-msg">${escapeHtml(message)}</span>
      <button class="afro-toast-close" aria-label="Dismiss">&times;</button>
    `;

    el.querySelector('.afro-toast-close').addEventListener('click', () => dismiss(el));

    container.appendChild(el);

    // Trigger show animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('show');
      });
    });

    // Auto-dismiss
    if (duration > 0) {
      el._timeout = setTimeout(() => dismiss(el), duration);
    }

    return el;
  }

  function dismiss(el) {
    if (!el || !el.parentNode) return;
    clearTimeout(el._timeout);
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 350);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const toast = {
    show,
    success: (msg, duration) => show(msg, 'success', duration),
    error:   (msg, duration) => show(msg, 'error', duration),
    info:    (msg, duration) => show(msg, 'info', duration),
    warning: (msg, duration) => show(msg, 'warning', duration),
    dismiss,
  };

  // Expose globally
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.toast = toast;

})(window);
