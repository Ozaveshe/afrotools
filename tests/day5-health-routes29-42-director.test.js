#!/usr/bin/env node
"use strict";

const assert = require("assert");
const test = require("node:test");

const meal = require("../tools/african-meal-plan/meal-logistics-engine.js");
const travel = require("../tools/medical-tourism/medical-travel-budget-engine.js");
const eye = require("../tools/eye-care-cost/eye-care-quote-engine.js");
const mental = require("../tools/mental-health-cost/mental-health-cost-engine.js");
const gym = require("../tools/gym-cost-compare/gym-quote-engine.js");
const home = require("../tools/home-workout/home-activity-engine.js");
const pharmacy = require("../tools/pharmacy-prices/pharmacy-quote-engine.js");
const medicine = require("../tools/drug-price-compare/exact-medicine-compare-engine.js");
const dental = require("../tools/dental-cost/dental-quote-engine.js");
const care = require("../tools/traditional-vs-western/care-plan-compare-engine.js");

function baseTravel(overrides) {
  return Object.assign({
    destination: "Synthetic destination",
    provider: "Synthetic provider",
    quoteDate: "2026-07-26",
    currency: "USD",
    clinicalQuote: 5000,
    tests: 500,
    aftercare: 500,
    internationalTransport: 1000,
    documents: 200,
    nights: 10,
    nightlyRate: 100,
    localCosts: 300,
    companionCosts: 500,
    insuranceContribution: 1000,
    contingencyPercent: 10,
    localAlternative: 6000
  }, overrides);
}

test("meal logistics rejects impossible dates and fractional schedule counts", () => {
  const base = {
    days: 7,
    people: 2,
    mealsPerDay: 3,
    dailyBudget: 1000,
    bufferPercent: 10,
    currency: "NGN",
    priceDate: "2026-07-26"
  };
  assert.throws(() => meal.calculate(Object.assign({}, base, { priceDate: "2026-02-30" })), /real calendar date/i);
  assert.throws(() => meal.calculate(Object.assign({}, base, { people: 1.5 })), /whole number/i);
  assert.throws(() => meal.calculate(Object.assign({}, base, { mealsPerDay: 2.5 })), /whole number/i);
});

test("medical travel and provider-cost tools reject impossible quote dates", () => {
  assert.throws(() => travel.calculate(baseTravel({ quoteDate: "2026-13-01" })), /real calendar/i);
  assert.throws(() => eye.calculate({
    provider: "Synthetic provider", currency: "GHS", quoteDate: "2026-02-30",
    exam: 1, tests: 1, lenses: 1, frames: 1, fitting: 1, followup: 1, travel: 1,
    insuranceContribution: 0, bufferPercent: 0
  }), /real calendar/i);
  assert.throws(() => mental.calculate({
    provider: "Synthetic provider", currency: "KES", quoteDate: "2026-00-10",
    sessions: 1, assessment: 0, sessionFee: 1, transportPerSession: 0, other: 0,
    insuranceContribution: 0, bufferPercent: 0
  }), /real calendar/i);
});

test("gym and home schedules require whole count inputs", () => {
  const gymInput = {
    currency: "NGN", quoteDate: "2026-07-26", months: 12, visitsPerMonth: 8,
    aName: "A", aMonthly: 10, aJoining: 0, aTransport: 0, aExtras: 0,
    bName: "B", bMonthly: 10, bJoining: 0, bTransport: 0, bExtras: 0
  };
  assert.throws(() => gym.calculate(Object.assign({}, gymInput, { months: 1.5 })), /whole number/i);
  assert.throws(() => gym.calculate(Object.assign({}, gymInput, { visitsPerMonth: 3.5 })), /whole number/i);
  assert.throws(() => gym.calculate(Object.assign({}, gymInput, { quoteDate: "2026-04-31" })), /real calendar/i);
  assert.throws(() => home.calculate({
    activity: "Synthetic routine", weeks: 2.5, sessionsPerWeek: 3, activeMinutes: 20, breakMinutes: 5
  }), /whole number/i);
  assert.throws(() => home.calculate({
    activity: "Synthetic routine", weeks: 2, sessionsPerWeek: 3, activeMinutes: 20.5, breakMinutes: 5
  }), /whole number/i);
});

test("pharmacy, medicine, dental and care-plan quotes reject impossible dates", () => {
  assert.throws(() => pharmacy.calculate({
    medicine: "Exact", strength: "5 mg", dosageForm: "tablet", pharmacy: "P",
    currency: "NGN", quoteDate: "2026-02-30", packSize: 10, packPrice: 100,
    requiredUnits: 12, fee: 0
  }), /real calendar/i);
  assert.throws(() => medicine.calculate({
    medicine: "Exact", strength: "5 mg", dosageForm: "tablet", requiredUnits: 12,
    currency: "NGN", quoteDate: "2026-13-01",
    aProvider: "A", aPackSize: 10, aPackPrice: 100, aFee: 0,
    bProvider: "B", bPackSize: 10, bPackPrice: 100, bFee: 0
  }), /real calendar/i);
  assert.throws(() => dental.calculate({
    provider: "D", service: "Quoted", currency: "NGN", quoteDate: "2026-04-31",
    quantity: 1, unitPrice: 100, consultation: 0, imaging: 0, followup: 0,
    medicines: 0, travel: 0, insuranceContribution: 0, bufferPercent: 0
  }), /real calendar/i);
  assert.throws(() => care.calculate({
    currency: "NGN", quoteDate: "2026-00-10",
    aName: "A", aProvider: "A", aInitial: 1, aFollowups: 0, aFollowupCost: 0, aTravel: 0, aOther: 0,
    bName: "B", bProvider: "B", bInitial: 1, bFollowups: 0, bFollowupCost: 0, bTravel: 0, bOther: 0
  }), /real calendar/i);
});
