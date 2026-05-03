const DEFAULT_INPUT_CHAR_LIMIT = 420000;
const MAX_INPUT_CHAR_LIMIT = 520000;
const MIN_INPUT_CHAR_LIMIT = 50000;

function getInputCharLimit() {
  var configured = Number(process.env.ANTHROPIC_INPUT_CHAR_LIMIT || DEFAULT_INPUT_CHAR_LIMIT);
  if (!Number.isFinite(configured)) configured = DEFAULT_INPUT_CHAR_LIMIT;
  return Math.max(MIN_INPUT_CHAR_LIMIT, Math.min(MAX_INPUT_CHAR_LIMIT, configured));
}

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

function truncateTextForAnthropic(value, limit, label) {
  if (typeof value !== 'string') return value;
  if (!Number.isFinite(limit) || limit <= 0 || value.length <= limit) return value;

  var notice = '\n\n[' + (label || 'Content') + ' truncated to keep the AI request under Anthropic standard input limits.]';
  var separator = '\n\n';
  var allowed = Math.max(0, limit - notice.length - separator.length);
  if (allowed <= 0) return notice.trim();

  var headLength = Math.ceil(allowed * 0.75);
  var tailLength = allowed - headLength;
  return value.slice(0, headLength) + notice + (tailLength > 0 ? separator + value.slice(-tailLength) : '');
}

function safeAnthropicText(value, label, limit) {
  var text = value === null || value === undefined ? '' : String(value);
  return sanitizeString(truncateTextForAnthropic(text, limit || getInputCharLimit(), label));
}

module.exports = {
  getInputCharLimit,
  safeAnthropicText,
  sanitizeString,
  truncateTextForAnthropic,
};
