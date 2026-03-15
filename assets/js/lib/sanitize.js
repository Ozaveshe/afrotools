/**
 * AfroTools Input Sanitization Library
 * Use these functions to sanitize all user input before DOM insertion.
 */

/**
 * Sanitize HTML — strips all tags, returns plain text safe for textContent
 * @param {string} str - Raw user input
 * @returns {string} Safe text with HTML entities escaped
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize number — parse and clamp to safe range
 * @param {*} val - Raw input
 * @param {number} min - Minimum allowed value (default 0)
 * @param {number} max - Maximum allowed value (default 1e12)
 * @returns {number} Safe numeric value or 0
 */
function sanitizeNumber(val, min, max) {
  min = typeof min === 'number' ? min : 0;
  max = typeof max === 'number' ? max : 1e12;
  var num = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.min(Math.max(num, min), max);
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  // RFC 5322 simplified pattern
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Sanitize URL — basic protocol whitelist
 * @param {string} url - Raw URL
 * @returns {string} Safe URL or empty string
 */
function sanitizeURL(url) {
  if (typeof url !== 'string') return '';
  url = url.trim();
  if (/^(https?:\/\/|\/[^\/]|#)/.test(url)) return url;
  return '';
}

// Expose globally
window.AfroSanitize = {
  html: sanitizeHTML,
  number: sanitizeNumber,
  email: isValidEmail,
  url: sanitizeURL
};
