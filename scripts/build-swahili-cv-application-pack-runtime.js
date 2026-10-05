#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const acorn = require('acorn');
const COPY = require('../data/localization/sw-cv-application-pack-copy.json');
const ROOT = path.resolve(__dirname, '..');
const SOURCE = 'tools/cv-builder/js';
const OUTPUT = 'sw/zana/mjenzi-cv/js';
const FILES = ['cv-application-pack.js', 'cv-application-pack-export.js', 'cv-application-pack-polish.js', 'cv-job-tracker.js'];
const STRUCTURED_VALUES = new Set(['id', 'status', 'tone', 'active', 'type', 'mode', 'action', 'source']);

function exact(value) {
  return Object.hasOwn(COPY.literals, value) ? COPY.literals[value] : value;
}

function markup(value) {
  let result = value.replace(/>([^<>]+)</g, (match, text) => {
    const trimmed = text.trim();
    return `>${Object.hasOwn(COPY.literals, trimmed) ? text.replace(trimmed, exact(trimmed)) : text}<`;
  }).replace(/\b(placeholder|title|aria-label|aria-description)=("|')([^"']*)\2/g,
    (match, name, quote, text) => `${name}=${quote}${exact(text)}${quote}`);
  // The legacy module builds this placeholder around the output-name slot.
  result = result.replace('placeholder="Generate or write your ', 'placeholder="Tengeneza au andika ');
  // This native status contains authored role/company suffixes. Its source
  // supplies all copy, so the generic DOM dictionary must not rewrite it.
  result = result.replace('data-pack-status>', 'data-pack-status translate="no" data-cv-user-text>');
  return result;
}

function keyName(property) {
  return property.key.type === 'Identifier' ? property.key.name : property.key.value;
}

function compile(source, filename) {
  const ast = acorn.parse(source, {ecmaVersion: 'latest', sourceType: 'script'});
  const edits = [];
  let pdfRepairs = 0;
  function nodesWithin(node,predicate) {
    const found=[];
    function find(current) {
      if (!current || typeof current !== 'object') return;
      if (predicate(current)) found.push(current);
      Object.values(current).forEach(child=>Array.isArray(child)?child.forEach(find):find(child));
    }
    find(node);return found;
  }
  function walk(node, ancestors) {
    if (!node || typeof node !== 'object') return;
    const parent = ancestors[ancestors.length - 1];
    if (filename === 'cv-application-pack.js' && node.type === 'BlockStatement' && parent && parent.type === 'TryStatement') {
      const constructors=nodesWithin(node,entry=>entry.type==='NewExpression' && entry.callee.type==='MemberExpression' && entry.callee.property.name==='jsPDF');
      if (constructors.length) {
        const lines=nodesWithin(node,entry=>entry.type==='CallExpression' && entry.callee.type==='MemberExpression' && entry.callee.property.name==='splitTextToSize');
        const downloads=nodesWithin(node,entry=>entry.type==='CallExpression' && entry.arguments[2] && entry.arguments[2].value==='application/pdf');
        if (constructors.length!==1 || lines.length!==1 || downloads.length!==1) throw new Error('Standalone pack PDF owner changed; review its native adapter.');
        const scope=constructors[0].callee.object.object;
        if (!scope || scope.type!=='Identifier') throw new Error('Unsupported standalone pack PDF scope.');
        const rootName=scope.name;
        const text=source.slice(lines[0].arguments[0].start,lines[0].arguments[0].end);
        const downloader=source.slice(downloads[0].callee.start,downloads[0].callee.end);
        const filenameExpression=source.slice(downloads[0].arguments[1].start,downloads[0].arguments[1].end);
        // The legacy Helvetica writer loses authored Unicode. Reuse the
        // existing local embedded-font text-PDF helper only on this SW route.
        edits.push({start:node.start,end:node.end,value:`{if(!${rootName}.CVExportAtsPlainPdf||!${rootName}.CVExportAtsPlainPdf.buildPdf)throw new Error(${JSON.stringify(COPY.literals['ATS Plain PDF export is unavailable.'])});const swPackPdf=await ${rootName}.CVExportAtsPlainPdf.buildPdf(${text});${downloader}(new ${rootName}.Blob([swPackPdf],{type:"application/pdf"}),${filenameExpression},"application/pdf");}`});
        pdfRepairs++;return;
      }
    }
    if (node.type === 'Literal' && typeof node.value === 'string') {
      if (parent && parent.type === 'Property' && parent.key === node) return;
      // IDs, status/tone enums and source metadata keep their English contract.
      if (ancestors.some(entry => entry.type === 'Property' && entry.value !== undefined
        && STRUCTURED_VALUES.has(keyName(entry)))) return;
      let translated = exact(node.value);
      if (filename === 'cv-job-tracker.js' && parent && parent.type === 'ArrayExpression'
        && parent.elements[0] && parent.elements[0].value === 'job_title') {
        translated = COPY.trackerHeaders[node.value] || node.value;
      } else if (filename === 'cv-job-tracker.js' && parent && parent.type === 'ConditionalExpression'
        && parent.consequent.value === 'yes' && parent.alternate.value === 'no') {
        translated = node.value === 'yes' ? 'Ndiyo' : 'Hapana';
      } else if (translated === node.value && /[<>]/.test(node.value)) {
        translated = markup(node.value);
      }
      if (translated !== node.value) edits.push({start: node.start, end: node.end, value: JSON.stringify(translated)});
      return;
    }
    // Localize only the printable tone name; the select/JSON enum stays intact.
    if (filename === 'cv-application-pack.js' && node.type === 'BinaryExpression'
      && node.left.type === 'Literal' && node.left.value === 'Tone: '
      && node.right.type === 'MemberExpression' && node.right.property.name === 'tone') {
      const expression = source.slice(node.right.start, node.right.end);
      edits.push({start: node.right.start, end: node.right.end,
        value: `(${JSON.stringify(COPY.toneLabels)}[${expression}]||${expression})`});
    }
    if (filename === 'cv-job-tracker.js' && node.type === 'ArrayExpression' && node.elements.length===15
      && node.elements[0] && node.elements[0].type==='MemberExpression' && node.elements[0].property.name==='jobTitle') {
      const status=node.elements[8];
      if (!status || status.type!=='CallExpression') throw new Error('CSV status owner changed; review its presentation mapping.');
      const expression=source.slice(status.start,status.end);
      edits.push({start:status.start,end:status.end,value:`(${JSON.stringify(COPY.trackerStatusLabels)}[${expression}]||${expression})`});
    }
    Object.keys(node).forEach(key => {
      if (['start', 'end', 'loc'].includes(key)) return;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(entry => walk(entry, ancestors.concat(node)));
      else if (child && typeof child === 'object' && typeof child.type === 'string') walk(child, ancestors.concat(node));
    });
  }
  walk(ast, []);
  if (filename==='cv-application-pack.js' && pdfRepairs!==1) throw new Error('Expected one standalone pack PDF writer.');
  let output = source;
  edits.sort((a,b) => b.start-a.start).forEach(edit => {
    output = output.slice(0,edit.start)+edit.value+output.slice(edit.end);
  });
  acorn.parse(output, {ecmaVersion: 'latest', sourceType: 'script'});
  return {output, edits: edits.length};
}

function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

function build({write = false} = {}) {
  const outputs = [];
  const stale = [];
  FILES.forEach(filename => {
    const source = fs.readFileSync(path.join(ROOT,SOURCE,filename),'utf8');
    const localized = compile(source,filename);
    const target = path.join(ROOT,OUTPUT,filename);
    if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== localized.output) stale.push(`${OUTPUT}/${filename}`);
    if (write) { fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,localized.output,'utf8'); }
    outputs.push({filename,sourceHash:hash(source),outputHash:hash(localized.output),edits:localized.edits});
  });
  const manifest = JSON.stringify({schemaVersion:1,locale:'sw',copyOwner:'data/localization/sw-cv-application-pack-copy.json',source:SOURCE,files:outputs},null,2)+'\n';
  const manifestPath = path.join(ROOT,OUTPUT,'application-pack-manifest.json');
  if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath,'utf8') !== manifest) stale.push(`${OUTPUT}/application-pack-manifest.json`);
  if (write) fs.writeFileSync(manifestPath,manifest,'utf8');
  if (!write && stale.length) throw new Error('Stale Swahili application-pack output: '+stale.join(', '));
  return outputs;
}

function rewriteAssets(html) {
  const styled=html.includes('/assets/css/sw-cv-application-pack.css') ? html
    : html.replace('</head>','<link rel="stylesheet" href="/assets/css/sw-cv-application-pack.css">\n</head>');
  return styled.replace(/(src=["'])\/tools\/cv-builder\/js\/(cv-application-pack(?:-export|-polish)?|cv-job-tracker)\.js(?:\?[^"']*)?(["'])/g,
    (match,prefix,name,quote) => {
      const filename=name+'.js';
      const target=path.join(ROOT,OUTPUT,filename);
      if (!fs.existsSync(target)) throw new Error('Missing scoped Swahili runtime: '+filename);
      return `${prefix}/${OUTPUT}/${filename}?v=${hash(fs.readFileSync(target)).slice(0,8)}${quote}`;
    });
}

if (require.main === module) {
  const result = build({write:process.argv.includes('--write')});
  console.log(`Swahili application pack: ${result.length} scoped modules reconciled.`);
}
module.exports = {compile,build,rewriteAssets,FILES};
