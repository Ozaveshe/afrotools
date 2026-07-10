#!/usr/bin/env node

'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');

const writeMode = process.argv.includes('--write');
const trackedFiles = execFileSync(
  'git',
  ['ls-files', '-z', '*.css', '*.html', '*.js'],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
)
  .split('\0')
  .filter(Boolean)
  .filter((file) => !file.startsWith('dist/'))
  .filter((file) => !file.includes('/node_modules/'))
  .filter((file) => !/\.min\.(?:css|js)$/i.test(file));

const decorativeBarRule = /(^|})([ \t]*[^\r\n{}<>]*(?:\.ey\b|eyebrow|kicker|overline|section-label)[^\r\n{}<>]*::before\s*\{(?=[^{}]*\bwidth\s*:\s*(?:1[0-9]|2[0-9]|3[0-2])px)(?=[^{}]*\bheight\s*:\s*[123]px)[^{}]*\})/gim;
const insetLeftAccent = /box-shadow\s*:\s*inset\s+[1-9][0-9]*px\s+0\s+0/gi;

const findings = [];
let changedFiles = 0;
let removedRules = 0;

for (const file of trackedFiles) {
  const original = fs.readFileSync(file, 'utf8');
  let source = original;

  if (writeMode) {
    source = source.replace(decorativeBarRule, (match, prefix) => {
      removedRules += 1;
      return prefix;
    });

    if (source !== original) {
      fs.writeFileSync(file, source, 'utf8');
      changedFiles += 1;
    }
  }

  decorativeBarRule.lastIndex = 0;
  insetLeftAccent.lastIndex = 0;

  if (decorativeBarRule.test(source)) {
    findings.push(`${file}: decorative eyebrow/kicker bar`);
  }
  if (insetLeftAccent.test(source)) {
    findings.push(`${file}: inset left-edge selection accent`);
  }
}

if (writeMode) {
  console.log(`Removed ${removedRules} decorative bar rule(s) from ${changedFiles} file(s).`);
}

if (findings.length) {
  console.error('Disallowed decorative UI accent patterns found:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log(`UI accent audit passed across ${trackedFiles.length} tracked source files.`);
}
