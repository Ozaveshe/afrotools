'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../assets/js/engines/small-business-parity');
const orchestrator=require('../assets/js/ai/orchestrator');
const manifest=require('../assets/js/ai/tool-manifest').getToolManifestForRouter();
const input={dailyTransactions:80,averageTransaction:10000,operatingDays:26,commissionPct:1,commissionCap:0,failurePct:2,deviceCost:10000,floatCapital:50000,monthlyRent:50000,otherMonthlyCosts:15000};
test('operating break-even rounds up the attempted volume including failed transactions',()=>{
 const result=engine.calculate('pos-agent',input);assert.equal(result.ok,true);assert.equal(result.values.operatingBreakEvenDailyTransactions,26);
 assert.ok(engine.calculate('pos-agent',{...input,dailyTransactions:25}).values.monthlyProfit<0);
 assert.ok(engine.calculate('pos-agent',{...input,dailyTransactions:26}).values.monthlyProfit>=0);
});
test('zero operating costs require no transactions; commission caps increase the required volume',()=>{
 assert.equal(engine.calculate('pos-agent',{...input,monthlyRent:0,otherMonthlyCosts:0}).values.operatingBreakEvenDailyTransactions,0);
 assert.equal(engine.calculate('pos-agent',{...input,commissionCap:50}).values.operatingBreakEvenDailyTransactions,52);
 for(const override of [{operatingDays:0},{failurePct:100},{commissionPct:0}])assert.equal(engine.calculate('pos-agent',{...input,...override}).ok,false);
});
test('explicit POS requests resolve to POS without taking ordinary farm-profit requests',()=>{
 for(const query of ['POS agent profit','POS business break even','point of sale agent profitability']){
  const plan=orchestrator.buildPlan(query,{manifest,locale:'en',consentToModel:false});assert.equal(plan.selectedTool.id,'pos-agent',query);assert.equal(plan.consent.consentToModel,false);assert.equal(plan.query.rawIncluded,false);
 }
 for(const query of ['farm profit','farm break even'])assert.equal(orchestrator.buildPlan(query,{manifest,locale:'en',consentToModel:false}).selectedTool.id,'farm-profit-calculator',query);
});
