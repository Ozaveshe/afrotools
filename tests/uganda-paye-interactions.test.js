const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('uganda/ug-paye.html', 'utf8');
const nodes = new Map();
const node = id => { if (!nodes.has(id)) nodes.set(id, {textContent:'', disabled:false}); return nodes.get(id); };
const context = { document:{getElementById:node}, window:{}, Date,
 RESULT:{netMonthly:1073000,annualNet:12876000,gross:1500000,annualGross:18000000},
 PERIOD:'annual', fmt:String, pct:String, renderRows:(_,period)=>period };
vm.createContext(context);
vm.runInContext(html.slice(html.indexOf('function renderPeriodResult()'), html.indexOf('// ── BANDS TOGGLE')), context);
vm.runInContext(html.slice(html.indexOf('async function downloadPdfSummary()'), html.indexOf('function openPdfModal()')), context);
(async () => {
 context.renderPeriodResult();
 assert.equal(node('resLabel').textContent,'Annual Take-Home Pay');
 assert.equal(node('resAmount').textContent,'12876000');
 context.RESULT.annualNet = 24000000;
 context.renderPeriodResult();
 assert.equal(node('resAmount').textContent,'24000000');
 context.PERIOD='monthly'; context.renderPeriodResult();
 assert.equal(node('resLabel').textContent,'Monthly Take-Home Pay');
 assert.equal(node('resAmount').textContent,'1073000');
 await context.downloadPdfSummary();
 assert.match(node('pdfStatus').textContent,/could not load/);
 context.window.AfroTools={pdf:{generate:async()=>{throw Error('offline');}}};
 await context.downloadPdfSummary();
 assert.match(node('pdfStatus').textContent,/failed/);
 assert.equal(node('pdfBtn').disabled,false);
 let payload;
 context.window.AfroTools.pdf.generate=async options=>{payload=options;};
 await context.downloadPdfSummary();
 assert.equal(payload.skipGate,true);
 assert.equal(payload.sections.length,3);
 assert.match(payload.filename,/afrotools-ug-paye-uganda-\d{4}-\d{2}-\d{2}\.pdf/);
 assert.match(node('pdfStatus').textContent,/prepared/);
 assert.equal(node('pdfBtn').disabled,false);
 console.log('Uganda period and export interaction regression checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
