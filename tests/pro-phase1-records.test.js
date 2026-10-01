'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const entry = require('../assets/js/lib/pro-books-entry');
const route = require('../assets/js/lib/pro-return-route');
const plan = require('../assets/js/lib/pro-plan');
const state = () => ({ currency: 'NGN', invoices: [], payments: [], expenses: [], customers: [], vendors: [], legacyExtension: { preserved: true } });
const invoice = { invoiceNumber:'SYNTHETIC-001',customer:'Synthetic Workshop',description:'Synthetic service',amount:'120.50',currency:'NGN',date:'2026-10-01',dueDate:'2026-10-02',accountCode:'4000' };
const payment = {invoiceNumber:'SYNTHETIC-001',reference:'SYNTHETIC-PAY-001',amount:'40.25',currency:'NGN',date:'2026-10-01',rail:'cash'};
test('review, allocation, correction and stable IDs reconcile invoice and payments', () => {
  let s = state(), original = JSON.stringify(s);
  let inv = entry.prepare(s,'invoice',invoice); assert.equal(JSON.stringify(s),original,'review does not write');
  s = entry.apply(s,'invoice',inv);
  let pay = entry.prepare(s,'payment',payment); s = entry.apply(s,'payment',pay);
  assert.equal(s.invoices[0].received,40.25); assert.equal(s.invoices[0].amount,120.50);
  assert.throws(()=>entry.prepare(s,'payment',{...payment,reference:'SYNTHETIC-2',amount:'81'}),/exceeds/);
  assert.throws(()=>entry.prepare(s,'payment',payment),/already exists/);
  const correction = entry.prepare(s,'payment',{...payment,amount:'30.00'},pay.id);
  s = entry.apply(s,'payment',correction); assert.equal(s.payments.length,1); assert.equal(s.payments[0].id,pay.id); assert.equal(s.invoices[0].received,30);
  assert.throws(()=>entry.prepare(s,'invoice',{...invoice,amount:'20'},inv.id),/below allocated/);
  const corrected = entry.prepare(s,'invoice',{...invoice,amount:'100.50'},inv.id);s=entry.apply(s,'invoice',corrected);
  assert.equal(s.invoices[0].id,inv.id);assert.equal(s.invoices[0].amount-s.invoices[0].received,70.50);
  const settled=entry.prepare(s,"invoice",{...invoice,amount:"30"},inv.id);s=entry.apply(s,"invoice",settled);assert.equal(s.invoices[0].status,"paid");
  assert.deepEqual(s.legacyExtension,{preserved:true});
});
test('invalid amounts, impossible dates and ambiguous legacy allocation are rejected', () => {
  for(const value of ['','abc','-1','NaN','Infinity','1e4','1,000','1.111','9007199254740992']) assert.throws(()=>entry.amount(value,true));
  assert.equal(entry.amount('0',true),0);assert.throws(()=>entry.amount('0',false));
  assert.throws(()=>entry.prepare(state(),'invoice',{...invoice,date:'2026-02-30'}),/calendar/);
  assert.throws(()=>entry.prepare(state(),'invoice',{...invoice,amount:'0'}),/Explain/);
  assert.equal(entry.prepare(state(),'invoice',{...invoice,amount:'0',note:'Synthetic complimentary work'}).amount,0);
  let s=entry.apply(state(),'invoice',entry.prepare(state(),'invoice',invoice));s.invoices[0].received=20;
  assert.throws(()=>entry.prepare(s,'payment',payment),/legacy received/);
});
test('reviewed import preserves valid rows, reports invalid and zero rows, and is idempotent',()=>{
  const csv='date,vendor,category,amount,rail,receipt status,note,due date\n2026-10-01,"Synthetic, Supplier",Materials,15.25,cash,received,"A quoted ""note""",2026-10-02\n2026-10-01,Synthetic Bad,Materials,nonsense,cash,missing,,2026-10-02\n2026-10-01,Synthetic Zero,Materials,0,cash,missing,Complimentary review,2026-10-02\n2026-10-01,Synthetic Missing,Materials,0,cash,missing,,2026-10-02';
  let s=state(), result=entry.importCsv(s,csv,'5000');assert.equal(s.expenses.length,0);assert.equal(result.added.length,2);assert.equal(result.errors.length,2);assert.deepEqual(result.errors.map(e=>e.row),[3,5]);
  assert.equal(result.state.expenses[0].amount,15.25);assert.equal(result.state.expenses[1].amount,0);assert.equal(result.state.expenses[1].paidStatus,'unpaid');
  const retry=entry.importCsv(result.state,csv,'5000');assert.equal(retry.added.length,0);assert.equal(retry.duplicates,2);assert.equal(retry.state.expenses.length,2);
  assert.throws(()=>entry.importCsv(s,'bad,header\n1,2','5000'),/header/);
  assert.throws(()=>entry.importCsv(s,'"unclosed','5000'),/unclosed/);
});
test('route continuity retains safe view context without data, external origins or encoded redirects',()=>{
  assert.equal(route.safe('/pro/apps/books/?view=invoices&customer=private#invoices'),'\/pro/apps/books/?view=invoices#invoices');
  for(const value of ['https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','/pro/apps/books/?next=https://evil.test','/pro/apps/books/?amount=500']){
    const result=route.safe(value); assert(result.startsWith('/pro/'));assert(!result.includes('evil'));assert(!result.includes('amount='));
  }
  assert.equal(route.safe('/pro/apps/books/?view=invoice%20private#secret%20text'),'/pro/apps/books/');
});
test('existing regional plan identifiers and values remain unchanged',()=>{
  assert.deepEqual(Object.values(plan.plans).map(p=>[p.id,p.amount,p.currency]),[['monthly',500,'USD'],['annual',3000,'USD'],['monthly_ngn',400000,'NGN'],['annual_ngn',2200000,'NGN'],['monthly_kes',75000,'KES'],['annual_kes',420000,'KES'],['monthly_zar',8900,'ZAR'],['annual_zar',49900,'ZAR'],['monthly_ghs',5000,'GHS'],['annual_ghs',28000,'GHS']]);
});
