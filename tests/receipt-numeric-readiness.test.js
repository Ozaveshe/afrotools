"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const runtime=fs.readFileSync(path.join(__dirname,"../assets/js/pages/receipt-generator.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"../tools/receipt-generator/index.html"),"utf8");
const start=runtime.indexOf('f("metricBalance").textContent=P(e.balance),function(){');
assert.ok(start>=0,"maintained readiness owner must exist");
const qualityStart=runtime.indexOf("function(){",start);
const qualityEnd=runtime.indexOf("}(),u&&",qualityStart);
assert.ok(qualityEnd>qualityStart,"exact readiness function boundary");
const quality=runtime.slice(qualityStart,qualityEnd+1);
const inlineStart=html.indexOf("<script>\n(function(){\n  var review=");
assert.ok(inlineStart>=0,"maintained final-export guard must exist");
const inline=html.slice(inlineStart+8,html.indexOf("</script>",inlineStart));
const finals=["downloadPdfBtn","printBtn","copySummaryBtn","txtBtn","csvBtn"];
function fixture(){
 const nodes={},fields=[],listeners={},window={};let focused=null;
 function field(id,label,value,opts={}){
  const node={id,value:String(value),checked:false,textContent:"",style:{},
   getAttribute(name){return name==="aria-label"?label:name==="data-item-field"?(opts.item||null):null;},
   focus(){focused=node;},addEventListener(){},
   closest(selector){return selector===".receipt-app"?{}:null;},
   get validity(){const text=this.value.trim(),n=Number(text);return {valid:!text||Number.isFinite(n)&&(opts.min==null||n>=opts.min)&&(opts.max==null||n<=opts.max)&&Math.abs(n*100-Math.round(n*100))<1e-7};}};
  nodes[id]=node;if(opts.numeric)fields.push(node);return node;
 }
 const qty=field("qty-one","Item quantity",2,{numeric:true,min:0,item:"qty"});
 const rate=field("rate-one","Item rate",30000,{numeric:true,min:0,item:"rate"});
 const itemDiscount=field("item-discount","Item discount percent",0,{numeric:true,min:0,max:100,item:"discount"});
 const qty2=field("qty-two","Item quantity",1,{numeric:true,min:0,item:"qty"});
 const rate2=field("rate-two","Item rate",10000,{numeric:true,min:0,item:"rate"});
 field("taxRate","TaxRate",0,{numeric:true,min:0,max:100});
 field("discount","Discount",0,{numeric:true,min:0});field("discountType","Discount type","percent");
 field("serviceCharge","ServiceCharge",0,{numeric:true,min:0});field("shipping","Shipping",0,{numeric:true,min:0});
 field("rounding","Rounding",0,{numeric:true});field("amountPaid","Auto when paid","",{numeric:true,min:0});
 for(const [id,value]of Object.entries({businessName:"Synthetic Shop",receiptNumber:"TEST-RECEIPT",receiptDate:"2026-10-22",paymentMethod:"Cash",paymentReference:"",authCode:"",qrData:""}))field(id,id,value);
 for(const id of ["receiptReviewConfirm","receiptReviewStatus","scoreValue","scoreMeter","scoreBadge","checkList"])field(id,id,"");
 nodes.receiptReviewConfirm.checked=true;
 for(const id of [...finals,"jsonBtn"])field(id,id,"");
 const rows=[{desc:"Synthetic item",qty,rate},{desc:"Synthetic service",qty:qty2,rate:rate2}].map(row=>({querySelector(selector){if(selector.includes('"desc"'))return {value:row.desc};if(selector.includes('"qty"'))return row.qty;if(selector.includes('"rate"'))return row.rate;return null;}}));
 const document={readyState:"loading",getElementById(id){return nodes[id]||null;},
  querySelectorAll(selector){if(selector==='.receipt-app input[type="number"]')return fields;if(selector==='#itemsList [data-item-row]')return rows;return [];},
  querySelector(selector){return selector==='[data-item-field="desc"]'?rows[0].querySelector('[data-item-field="desc"]'):null;},
  addEventListener(type,fn,capture){(listeners[type]||=([])).push({fn,capture});}};
 const state={business:{name:"Synthetic Shop",address:"Synthetic address"},customer:{name:"Synthetic Buyer"},receipt:{number:"TEST-RECEIPT",date:"2026-10-22"},items:[{desc:"Synthetic item",qty:2,rate:30000},{desc:"Synthetic service",qty:1,rate:10000}],payment:{method:"Cash"},totals:{taxRate:0},status:"PARTIAL",docType:"sale",notes:"Thank you",terms:""};
 const context=vm.createContext({window,document,console,setTimeout(){return 1;},clearTimeout(){},localStorage:{},navigator:{}});
 vm.runInContext(runtime,context,{filename:"actual-receipt-controller.js",timeout:1000});
 vm.runInContext(inline,context,{filename:"actual-page-export-guard.js",timeout:1000});
 function readiness(){
  context.o=state;context.f=id=>nodes[id];context.D=()=>({balance:20000});context.T=(v,d)=>Number.isFinite(Number(v))?Number(v):d;context.C=value=>String(value);
  // Exact maintained readiness function; unrelated preview/arithmetic is not mocked as acceptance.
  const helper=window.AfroReceiptNumericProblem;
  context.receiptNumericProblem=helper;
  vm.runInContext('('+quality+')()',context,{timeout:1000});
  return {score:nodes.scoreValue.textContent,badge:nodes.scoreBadge.textContent,checks:nodes.checkList.innerHTML};
 }
 function click(id){const event={target:{closest(selector){return selector==='button'?nodes[id]:null;}},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};for(const {fn}of listeners.click||[]){fn(event);if(event.stopped)break;}return event;}
 return {nodes,fields,qty,rate,itemDiscount,window,readiness,click,input(field){for(const {fn}of listeners.input||[])fn({target:field});},get focused(){return focused;}};
}
test("one invalid item cannot be hidden by a second valid item or readiness score",()=>{
 const f=fixture();f.qty.value="-1";
 const r=f.readiness();assert.equal(r.score,"84");assert.equal(r.badge,"Review");assert.match(r.checks,/Correct Item quantity/);
 for(const id of finals){assert.equal(f.click(id).prevented,true,id);assert.equal(f.focused,f.qty);assert.match(f.nodes.receiptReviewStatus.textContent,/Item quantity/);}
 assert.ok(!f.click("jsonBtn").prevented,"JSON draft backup remains available after review");
});
test("all numeric rows and totals reject invalid ranges, steps and non-finite input",()=>{
 for(const [id,value]of [["rate-two","-1"],["item-discount","101"],["taxRate","101"],["serviceCharge","-1"],["shipping","-1"],["amountPaid","-1"],["qty-two","1.001"],["rate-one","Infinity"]]){
  const f=fixture();f.nodes[id].value=value;assert.equal(f.click("txtBtn").prevented,true,id);assert.equal(f.focused,f.nodes[id],id);assert.equal(f.readiness().badge,"Review",id);
 }
});
test("blank item quantities or prices fail while intentional zero price remains valid",()=>{
 for(const id of ["qty-one","rate-one"]){const f=fixture();f.nodes[id].value="";assert.equal(f.click("csvBtn").prevented,true);assert.match(f.nodes.receiptReviewStatus.textContent,/Enter Item/);}
 const f=fixture();f.rate.value="0";assert.ok(!f.click("txtBtn").prevented);assert.equal(f.readiness().score,"100");
});
test("discount over100 is invalid in Percent mode but valid in Amount mode",()=>{
 const f=fixture();f.nodes.discount.value="101";assert.equal(f.click("txtBtn").prevented,true);assert.match(f.nodes.receiptReviewStatus.textContent,/100% or less/);
 f.nodes.discountType.value="amount";assert.ok(!f.click("txtBtn").prevented);assert.equal(f.readiness().badge,"Ready");
 f.nodes.discount.value="-1";assert.equal(f.click("txtBtn").prevented,true);
});
test("signed rounding and automatic blank amount received keep their existing meaning",()=>{
 const f=fixture();for(const value of ["-0.25","0","0.25"]){f.nodes.rounding.value=value;assert.ok(!f.click("txtBtn").prevented);assert.equal(f.readiness().badge,"Ready");}
 assert.equal(f.nodes.amountPaid.value,"");
});
test("correction restores readiness and every existing final-export guard",()=>{
 const f=fixture();f.qty.value="-1";assert.equal(f.click("txtBtn").prevented,true);f.qty.value="2";
 assert.equal(f.readiness().score,"100");assert.equal(f.readiness().badge,"Ready");
 for(const id of finals)assert.ok(!f.click(id).prevented,id);
});
test("existing explicit final review still applies to documents and JSON draft backup",()=>{
 const f=fixture();f.nodes.receiptReviewConfirm.checked=false;
 for(const id of [...finals,"jsonBtn"]){assert.equal(f.click(id).prevented,true,id);assert.match(f.nodes.receiptReviewStatus.textContent,/Review the final receipt preview/);}
});
test("missing controller validation fails closed for final documents without disabling JSON backup",()=>{
 const f=fixture();delete f.window.AfroReceiptNumericProblem;assert.equal(f.click("txtBtn").prevented,true);assert.match(f.nodes.receiptReviewStatus.textContent,/still loading/);assert.ok(!f.click("jsonBtn").prevented);
});

test("correcting a numeric error before first review replaces obsolete field feedback",()=>{
 const f=fixture();f.nodes.receiptReviewConfirm.checked=false;f.qty.value="-1";f.click("txtBtn");
 assert.match(f.nodes.receiptReviewStatus.textContent,/Correct Item quantity/);
 f.qty.value="2";f.input(f.qty);
 assert.doesNotMatch(f.nodes.receiptReviewStatus.textContent,/Correct Item quantity/);
 assert.match(f.nodes.receiptReviewStatus.textContent,/Review the final preview again/);
 assert.equal(f.nodes.receiptReviewConfirm.checked,false);
 assert.equal(f.click("txtBtn").prevented,true,"review still required after numeric correction");
 f.nodes.receiptReviewConfirm.checked=true;assert.ok(!f.click("txtBtn").prevented);
});
