#!/usr/bin/env node
'use strict';
// Bundle the final source HTML as data so Windows and Linux function packages
// do not depend on the deployment archive's filesystem layout.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const templates = Object.fromEntries(['article.html', 'news.html', 'index.html'].map(file => [file, fs.readFileSync(path.join(root, 'tools/afrostream', file), 'utf8')]));
fs.writeFileSync(path.join(root, 'netlify/functions/_shared/afrostream-templates.json'), JSON.stringify(templates) + '\n');
console.log('Bundled three AfroStream HTML templates.');
