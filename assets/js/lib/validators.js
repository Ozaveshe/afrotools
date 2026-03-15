/**
 * AFROTOOLS — Input Validation Library
 * ===================================================================
 * Validate and sanitize user inputs for all calculator tools.
 *
 * Usage:
 *   AfroTools.validate.salary(value, 'NGN')
 *   AfroTools.validate.email('user@example.com')
 *   AfroTools.validate.range(value, 0, 100000000)
 *   AfroTools.validate.required(value, 'Salary')
 *   AfroTools.validate.phone('+2348012345678')
 * ===================================================================
 */

(function (window) {
  'use strict';

  /**
   * Currency-aware salary limits
   */
  const SALARY_LIMITS = {
    NGN: { min: 0, max: 1_000_000_000, label: 'Naira' },
    KES: { min: 0, max: 100_000_000,   label: 'Shilling' },
    GHS: { min: 0, max: 10_000_000,    label: 'Cedi' },
    ZAR: { min: 0, max: 100_000_000,   label: 'Rand' },
    EGP: { min: 0, max: 100_000_000,   label: 'Pound' },
    TZS: { min: 0, max: 1_000_000_000, label: 'Shilling' },
    UGX: { min: 0, max: 1_000_000_000, label: 'Shilling' },
    USD: { min: 0, max: 10_000_000,    label: 'Dollar' },
    EUR: { min: 0, max: 10_000_000,    label: 'Euro' },
    GBP: { min: 0, max: 10_000_000,    label: 'Pound' },
  };

  const DEFAULT_LIMIT = { min: 0, max: 1_000_000_000, label: 'amount' };

  const validate = {
    /**
     * Validate a salary/income value
     * @param {number|string} value - The input value
     * @param {string} [currency='NGN'] - Currency code for limits
     * @returns {{ valid: boolean, value: number, error: string|null }}
     */
    salary(value, currency = 'NGN') {
      const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.\-]/g, '')) : value;
      const limits = SALARY_LIMITS[currency] || DEFAULT_LIMIT;

      if (num == null || isNaN(num)) {
        return { valid: false, value: 0, error: 'Please enter a valid amount' };
      }
      if (num < limits.min) {
        return { valid: false, value: num, error: `Amount cannot be negative` };
      }
      if (num > limits.max) {
        return { valid: false, value: num, error: `Amount exceeds maximum (${limits.max.toLocaleString()})` };
      }
      if (num === 0) {
        return { valid: false, value: 0, error: 'Please enter an amount greater than zero' };
      }
      return { valid: true, value: num, error: null };
    },

    /**
     * Validate a numeric value within a range
     * @param {number|string} value
     * @param {number} min
     * @param {number} max
     * @param {string} [fieldName='Value']
     * @returns {{ valid: boolean, value: number, clamped: number, error: string|null }}
     */
    range(value, min, max, fieldName = 'Value') {
      const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.\-]/g, '')) : value;

      if (num == null || isNaN(num)) {
        return { valid: false, value: 0, clamped: min, error: `${fieldName} must be a number` };
      }
      if (num < min) {
        return { valid: false, value: num, clamped: min, error: `${fieldName} must be at least ${min}` };
      }
      if (num > max) {
        return { valid: false, value: num, clamped: max, error: `${fieldName} cannot exceed ${max}` };
      }
      return { valid: true, value: num, clamped: num, error: null };
    },

    /**
     * Validate a required field is not empty
     * @param {*} value
     * @param {string} [fieldName='This field']
     * @returns {{ valid: boolean, error: string|null }}
     */
    required(value, fieldName = 'This field') {
      if (value === null || value === undefined || value === '' ||
          (typeof value === 'string' && value.trim() === '')) {
        return { valid: false, error: `${fieldName} is required` };
      }
      return { valid: true, error: null };
    },

    /**
     * Validate an email address
     * @param {string} email
     * @returns {boolean}
     */
    email(email) {
      if (!email || typeof email !== 'string') return false;
      // RFC 5322 simplified
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    },

    /**
     * Validate a phone number (international format)
     * @param {string} phone
     * @returns {{ valid: boolean, cleaned: string, error: string|null }}
     */
    phone(phone) {
      if (!phone) return { valid: false, cleaned: '', error: 'Phone number is required' };
      const cleaned = phone.replace(/[\s\-\(\)]/g, '');
      if (!/^\+?\d{7,15}$/.test(cleaned)) {
        return { valid: false, cleaned, error: 'Please enter a valid phone number' };
      }
      return { valid: true, cleaned, error: null };
    },

    /**
     * Validate a percentage (0-100)
     * @param {number|string} value
     * @param {string} [fieldName='Percentage']
     * @returns {{ valid: boolean, value: number, error: string|null }}
     */
    percentage(value, fieldName = 'Percentage') {
      return this.range(value, 0, 100, fieldName);
    },

    /**
     * Validate a date string or Date object
     * @param {string|Date} date
     * @param {Object} [opts] - { minDate, maxDate }
     * @returns {{ valid: boolean, date: Date|null, error: string|null }}
     */
    date(date, opts = {}) {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) {
        return { valid: false, date: null, error: 'Please enter a valid date' };
      }
      if (opts.minDate && d < new Date(opts.minDate)) {
        return { valid: false, date: d, error: `Date must be after ${opts.minDate}` };
      }
      if (opts.maxDate && d > new Date(opts.maxDate)) {
        return { valid: false, date: d, error: `Date must be before ${opts.maxDate}` };
      }
      return { valid: true, date: d, error: null };
    },

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} str
     * @returns {string}
     */
    sanitize(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    /**
     * Show inline validation error on an input element
     * @param {HTMLElement} input
     * @param {string} message
     * @param {number} [duration=3000]
     */
    showError(input, message, duration = 3000) {
      if (!input) return;

      // Visual feedback on input
      input.style.borderColor = 'var(--color-error, #ef4444)';
      input.setAttribute('aria-invalid', 'true');

      // Find or create error message element
      let errorEl = input.parentElement.querySelector('.field-error');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        errorEl.setAttribute('role', 'alert');
        errorEl.style.cssText = 'display:block;font-size:0.75rem;color:var(--color-error,#ef4444);margin-top:4px;font-weight:500;';
        input.parentElement.appendChild(errorEl);
      }
      errorEl.textContent = message;

      // Auto-clear
      if (duration > 0) {
        setTimeout(() => {
          input.style.borderColor = '';
          input.removeAttribute('aria-invalid');
          if (errorEl && errorEl.parentElement) errorEl.remove();
        }, duration);
      }
    },

    /**
     * Clear validation error from an input element
     * @param {HTMLElement} input
     */
    clearError(input) {
      if (!input) return;
      input.style.borderColor = '';
      input.removeAttribute('aria-invalid');
      const errorEl = input.parentElement.querySelector('.field-error');
      if (errorEl) errorEl.remove();
    },
  };

  // ── EXPOSE ─────────────────────────────────────
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.validate = validate;

})(window);
