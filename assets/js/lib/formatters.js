/**
 * AFROTOOLS — Formatters Library
 * ===================================================================
 * Number, percentage, date, and compact formatting utilities.
 *
 * Usage:
 *   AfroTools.fmt.number(1234567)         // '1,234,567'
 *   AfroTools.fmt.number(1234.567, 2)     // '1,234.57'
 *   AfroTools.fmt.percent(0.175)          // '17.5%'
 *   AfroTools.fmt.percent(0.175, 0)       // '18%'
 *   AfroTools.fmt.compact(1500000)        // '1.5M'
 *   AfroTools.fmt.date(new Date())        // '15 March 2026'
 *   AfroTools.fmt.ordinal(1)              // '1st'
 *   AfroTools.fmt.duration(3661)          // '1h 1m'
 *   AfroTools.fmt.fileSize(1048576)       // '1.0 MB'
 *   AfroTools.fmt.parseNum('3,500,000')   // 3500000
 * ===================================================================
 */

(function (window) {
  'use strict';

  const fmt = {
    /**
     * Format a number with thousand separators
     * @param {number} n - The number
     * @param {number} [decimals=0] - Decimal places
     * @returns {string}
     */
    number(n, decimals = 0) {
      if (n == null || isNaN(n)) return '0';
      return Number(n).toLocaleString('en', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },

    /**
     * Format as percentage
     * @param {number} n - Ratio (0.175) or direct percentage (17.5)
     * @param {number} [decimals=1] - Decimal places
     * @param {boolean} [isRatio=true] - If true, multiply by 100
     * @returns {string}
     */
    percent(n, decimals = 1, isRatio = true) {
      if (n == null || isNaN(n)) return '0%';
      const val = isRatio ? n * 100 : n;
      return val.toFixed(decimals) + '%';
    },

    /**
     * Compact number: 1,200,000 -> '1.2M'
     * @param {number} n
     * @param {number} [decimals=1]
     * @returns {string}
     */
    compact(n, decimals = 1) {
      if (n == null || isNaN(n)) return '0';
      const abs = Math.abs(n);
      const sign = n < 0 ? '-' : '';
      if (abs >= 1e12) return sign + (abs / 1e12).toFixed(decimals) + 'T';
      if (abs >= 1e9)  return sign + (abs / 1e9).toFixed(decimals) + 'B';
      if (abs >= 1e6)  return sign + (abs / 1e6).toFixed(decimals) + 'M';
      if (abs >= 1e3)  return sign + (abs / 1e3).toFixed(decimals) + 'K';
      return sign + Math.round(abs).toString();
    },

    /**
     * Format a date in human-readable format
     * @param {Date|string|number} date
     * @param {string} [locale='en-GB'] - Locale string
     * @param {Object} [opts] - Intl.DateTimeFormat options
     * @returns {string}
     */
    date(date, locale = 'en-GB', opts) {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      const defaults = { day: 'numeric', month: 'long', year: 'numeric' };
      return d.toLocaleDateString(locale, opts || defaults);
    },

    /**
     * Short date: '15 Mar 2026'
     * @param {Date|string|number} date
     * @returns {string}
     */
    dateShort(date) {
      return this.date(date, 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    /**
     * ISO date: '2026-03-15'
     * @param {Date|string|number} date
     * @returns {string}
     */
    dateISO(date) {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    },

    /**
     * Relative time: '2 days ago', 'in 3 hours'
     * @param {Date|string|number} date
     * @returns {string}
     */
    timeAgo(date) {
      const d = date instanceof Date ? date : new Date(date);
      const now = Date.now();
      const diff = now - d.getTime();
      const abs = Math.abs(diff);
      const future = diff < 0;

      const units = [
        { label: 'year',   ms: 365.25 * 24 * 60 * 60 * 1000 },
        { label: 'month',  ms: 30.44 * 24 * 60 * 60 * 1000 },
        { label: 'week',   ms: 7 * 24 * 60 * 60 * 1000 },
        { label: 'day',    ms: 24 * 60 * 60 * 1000 },
        { label: 'hour',   ms: 60 * 60 * 1000 },
        { label: 'minute', ms: 60 * 1000 },
      ];

      for (const unit of units) {
        const count = Math.floor(abs / unit.ms);
        if (count >= 1) {
          const plural = count === 1 ? '' : 's';
          return future
            ? `in ${count} ${unit.label}${plural}`
            : `${count} ${unit.label}${plural} ago`;
        }
      }
      return 'just now';
    },

    /**
     * Ordinal number: 1 -> '1st', 2 -> '2nd', 3 -> '3rd', 4 -> '4th'
     * @param {number} n
     * @returns {string}
     */
    ordinal(n) {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },

    /**
     * Duration in seconds to human-readable: 3661 -> '1h 1m 1s'
     * @param {number} seconds
     * @param {boolean} [showSeconds=false]
     * @returns {string}
     */
    duration(seconds, showSeconds = false) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const parts = [];
      if (h > 0) parts.push(h + 'h');
      if (m > 0) parts.push(m + 'm');
      if (showSeconds && s > 0) parts.push(s + 's');
      return parts.join(' ') || '0m';
    },

    /**
     * File size: 1048576 -> '1.0 MB'
     * @param {number} bytes
     * @returns {string}
     */
    fileSize(bytes) {
      if (bytes === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      const val = bytes / Math.pow(1024, i);
      return val.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
    },

    /**
     * Parse a formatted number string back to a number
     * Handles commas, currency symbols, spaces
     * @param {string|number} str
     * @returns {number}
     */
    parseNum(str) {
      if (typeof str === 'number') return str;
      if (!str) return 0;
      // Remove everything except digits, dots, minus
      const cleaned = String(str).replace(/[^\d.\-]/g, '');
      return parseFloat(cleaned) || 0;
    },

    /**
     * Clamp a number between min and max
     * @param {number} n
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    clamp(n, min, max) {
      return Math.min(Math.max(n, min), max);
    },

    /**
     * Round to N decimal places (avoids floating point issues)
     * @param {number} n
     * @param {number} decimals
     * @returns {number}
     */
    round(n, decimals = 0) {
      const factor = Math.pow(10, decimals);
      return Math.round((n + Number.EPSILON) * factor) / factor;
    },
  };

  // ── EXPOSE ─────────────────────────────────────
  window.AfroTools = window.AfroTools || {};
  // Merge with existing fmt (from utils.js backward compat)
  window.AfroTools.fmt = Object.assign(fmt, window.AfroTools.fmt || {});

})(window);
