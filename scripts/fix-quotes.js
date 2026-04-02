#!/usr/bin/env node
/**
 * Fix unescaped single quotes inside JS string values in tool-registry.js
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'assets', 'js', 'components', 'tool-registry.js');
let code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');
let fixed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.includes("{ id:")) continue;

  // Count unescaped single quotes (ignore escaped ones)
  const stripped = line.replace(/\\'/g, '__ESC__');
  const parts = stripped.split("'");

  // If even number of parts → odd number of quotes → broken
  if (parts.length % 2 === 0) {
    // Replace common possessive/contraction patterns
    let newLine = line;
    // Match: letter + ' + letter (possessive/contraction inside a string)
    // But NOT the structural quotes around key values
    newLine = newLine.replace(/([a-zA-Z])'([a-zA-Z])/g, "$1\\'$2");

    // Also handle: d' (as in Côte d'Ivoire)
    newLine = newLine.replace(/d'([A-Z])/g, "d\\'$1");

    if (newLine !== line) {
      lines[i] = newLine;
      fixed++;

      // Recheck
      const recheck = newLine.replace(/\\'/g, '__ESC__');
      const reParts = recheck.split("'");
      if (reParts.length % 2 === 0) {
        console.log('STILL BROKEN line ' + (i + 1) + ': ' + newLine.substring(0, 120));
      }
    } else {
      console.log('UNFIXED line ' + (i + 1) + ': ' + line.substring(0, 120));
    }
  }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Fixed ' + fixed + ' lines');
