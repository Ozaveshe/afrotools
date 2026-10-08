const fs = require('node:fs');

// Model the observed CDN's later matching CSP override, including worker responses.
// Live response inspection remains a release gate; this is a local policy emulator.
function readSecurityHeaders(file) {
  const rules = [];
  let pattern;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      pattern = new RegExp('^' + line.trim().split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    } else {
      const match = line.match(/^\s+Content-Security-Policy:\s*(.+)$/i);
      if (match && pattern) rules.push({ pattern, policy: match[1] });
    }
  }
  return pathname => rules.filter(rule => rule.pattern.test(pathname)).map(rule => rule.policy).at(-1);
}

module.exports = { readSecurityHeaders };
