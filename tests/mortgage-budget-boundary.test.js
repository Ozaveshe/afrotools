const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../assets/js/engines/mortgage-budget-boundary.js');

test('subtracts only user-entered recurring costs and cushion from the chosen boundary',()=>{
  assert.deepEqual(engine.calculate({monthlyBudget:3000,recurringCosts:450,cushion:300}),{
    valid:true,monthlyBudget:3000,recurringCosts:450,cushion:300,reserved:750,paymentBoundary:2250,shortfall:0
  });
});

test('reports a shortfall without inventing borrowing capacity',()=>{
  assert.deepEqual(engine.calculate({monthlyBudget:500,recurringCosts:450,cushion:200}),{
    valid:true,monthlyBudget:500,recurringCosts:450,cushion:200,reserved:650,paymentBoundary:0,shortfall:150
  });
});

test('rejects missing, negative, zero-budget and out-of-range amounts',()=>{
  assert.equal(engine.calculate({monthlyBudget:0,recurringCosts:0,cushion:0}).valid,false);
  assert.equal(engine.calculate({monthlyBudget:1000,recurringCosts:-1,cushion:0}).valid,false);
  assert.equal(engine.calculate({monthlyBudget:1000000000001,recurringCosts:0,cushion:0}).valid,false);
  assert.equal(engine.calculate({monthlyBudget:'',recurringCosts:0,cushion:0}).valid,false);
});
