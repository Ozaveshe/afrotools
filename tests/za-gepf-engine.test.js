const assert = require('assert');
const engine = require('../engines/src/za-gepf-engine.js');
const whatsapp = require('../netlify/functions/afrowork-whatsapp.js')._test;

const normal = engine.calculate({finalAnnualSalary:300000,vestedService:25,savingsService:0.667,retirementService:1.333,retirementAge:60,earlyBasis:'standard',employerType:'other'});
assert.equal(normal.ok,true);
assert.equal(normal.gratuityEstimate,550523.25);
assert.equal(normal.annualAnnuityEstimate,146951.26);
assert.equal(normal.monthlyAnnuityEstimate,12245.94);
assert.equal(normal.memberMonthlyContribution,1875);
assert.equal(normal.employerMonthlyContribution,3250);

const services = engine.calculate({finalAnnualSalary:300000,vestedService:25,savingsService:0.667,retirementService:1.333,retirementAge:60,earlyBasis:'standard',employerType:'services'});
assert.equal(services.employerMonthlyContribution,4000);
assert.equal(services.gratuityEstimate,554725.35);
assert.equal(services.annualAnnuityEstimate,146604.22);

const early = engine.calculate({finalAnnualSalary:300000,vestedService:25,savingsService:0.667,retirementService:1.333,retirementAge:55,earlyBasis:'standard',employerType:'other'});
assert.equal(early.reductionRate,0.2);
assert.equal(early.gratuityEstimate,440418.6);

const approved = engine.calculate({finalAnnualSalary:300000,vestedService:25,savingsService:0.667,retirementService:1.333,retirementAge:55,earlyBasis:'approved',employerType:'other'});
assert.equal(approved.reductionRate,0);
assert.equal(approved.gratuityEstimate,normal.gratuityEstimate);

assert.equal(engine.calculate({finalAnnualSalary:300000,vestedService:8,savingsService:0.3,retirementService:0.6,retirementAge:60}).error,'under_ten_vested');
assert.equal(engine.calculate({finalAnnualSalary:0,vestedService:25,savingsService:0,retirementService:1,retirementAge:60}).error,'invalid_salary');
assert.equal(engine.calculate({finalAnnualSalary:300000,vestedService:-1,savingsService:0,retirementService:11,retirementAge:60}).error,'invalid_service');

assert.deepEqual(whatsapp.calculateSouthAfricaGepf(25000,false),{employee:1875,employer:3250});
assert.deepEqual(whatsapp.calculateSouthAfricaGepf(25000,true),{employee:1875,employer:4000});
console.log('South Africa GEPF engine/function: 9 checks passed');
