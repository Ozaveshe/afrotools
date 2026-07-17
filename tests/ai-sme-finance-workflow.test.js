#!/usr/bin/env node

const assert = require("assert");
const workflow = require("../assets/js/ai/sme-finance-workflow.js");

function plan(query, inputs = {}) {
  const extracted = workflow.normalizeInputs(query, inputs);
  return workflow.buildFinancePlan(extracted, { query, source: "deterministic", consentToModel: false });
}

const kenyaPayroll = plan("Help me calculate payroll for 5 employees in Kenya with KES 250000 monthly salary");
assert.strictEqual(kenyaPayroll.kind, "sme_finance_assistant");
assert.strictEqual(kenyaPayroll.inputs.workflowKind, "payroll");
assert.strictEqual(kenyaPayroll.inputs.country, "Kenya");
assert.strictEqual(kenyaPayroll.inputs.numberOfEmployees, 5);
assert.strictEqual(kenyaPayroll.inputs.grossPay, 250000);
assert.strictEqual(kenyaPayroll.inputs.currency, "KES");
assert.strictEqual(kenyaPayroll.selectedRoute, "/kenya/ke-paye");
assert.deepStrictEqual(kenyaPayroll.missingInputs, []);
assert.ok(kenyaPayroll.warning.includes("not tax"));
assert.ok(kenyaPayroll.warning.includes("qualified accountant"));
assert.strictEqual(kenyaPayroll.payrollPrefillInputs.employeeCount, 5);
assert.strictEqual(kenyaPayroll.cashflowPrefillInputs.fixedMonthlyCosts, 1250000);
assert.ok(kenyaPayroll.sourceConfidence.some((item) => item.includes("sponsor placements do not alter formulas")));
const payrollHtml = workflow.renderFinancePanel(kenyaPayroll);
assert.ok(payrollHtml.includes("Partner surface"));
assert.ok(payrollHtml.includes("Open cashflow planner"));
assert.ok(payrollHtml.includes("TIN guide"));

const nigeriaInvoice = plan("Create a VAT invoice in Nigeria for NGN 500000 consulting services");
assert.strictEqual(nigeriaInvoice.inputs.workflowKind, "invoice");
assert.strictEqual(nigeriaInvoice.inputs.country, "Nigeria");
assert.strictEqual(nigeriaInvoice.inputs.invoiceAmount, 500000);
assert.strictEqual(nigeriaInvoice.inputs.vatRate, 7.5);
assert.strictEqual(nigeriaInvoice.selectedRoute, "/tools/invoice-generator/");
assert.ok(nigeriaInvoice.invoicePrefillInputs.taxRate >= 7.5);
assert.ok(nigeriaInvoice.decisionBriefText.includes("Invoice total"));

const southAfricaVat = plan("Calculate VAT for ZAR 10000 in South Africa standard");
assert.strictEqual(southAfricaVat.inputs.workflowKind, "vat");
assert.strictEqual(southAfricaVat.inputs.country, "South Africa");
assert.strictEqual(southAfricaVat.inputs.vatRate, 15);
assert.strictEqual(southAfricaVat.metrics.find((item) => item.label === "VAT estimate").value, "ZAR 1,500");
assert.strictEqual(southAfricaVat.selectedRoute, "/tools/vat-calculator/");

const ghanaPaye = plan("Ghana PAYE on GHS 120000 annual salary");
assert.strictEqual(ghanaPaye.inputs.workflowKind, "payroll");
assert.strictEqual(ghanaPaye.inputs.country, "Ghana");
assert.strictEqual(ghanaPaye.inputs.payPeriod, "annual");
assert.strictEqual(ghanaPaye.inputs.grossPay, 120000);
assert.strictEqual(ghanaPaye.selectedRoute, "/ghana/gh-paye");

const tinChecklist = plan("TIN checklist for a shop in Ghana");
assert.strictEqual(tinChecklist.inputs.workflowKind, "registration");
assert.strictEqual(tinChecklist.inputs.country, "Ghana");
assert.strictEqual(tinChecklist.inputs.businessType, "shop");
assert.strictEqual(tinChecklist.selectedRoute, "/tools/business-registration/");
assert.ok(tinChecklist.checklist.some((item) => item.toLowerCase().includes("official")));
const tinHtml = workflow.renderFinancePanel(tinChecklist);
assert.ok(tinHtml.includes("/tools/tin-guide/"));

const cashflowPlan = plan("Build a cashflow forecast for a retail shop in Kenya with KES 250000 monthly payroll");
assert.strictEqual(cashflowPlan.inputs.workflowKind, "cashflow");
assert.strictEqual(cashflowPlan.inputs.country, "Kenya");
assert.strictEqual(cashflowPlan.selectedRoute, "/tools/cash-flow-forecast/");
assert.strictEqual(cashflowPlan.recommendedTool, "Cash Flow Forecast");
assert.ok(workflow.renderFinancePanel(cashflowPlan).includes("Cash Flow Forecast"));

const cashflowRevenuePlan = plan("Build a cashflow forecast for a retail shop in Kenya with KES 750000 monthly revenue and KES 250000 fixed costs");
assert.strictEqual(cashflowRevenuePlan.inputs.monthlyRevenue, 750000);
assert.strictEqual(cashflowRevenuePlan.inputs.fixedMonthlyCosts, 250000);
assert.strictEqual(cashflowRevenuePlan.cashflowPrefillInputs.monthlyRevenue, 750000);
assert.strictEqual(cashflowRevenuePlan.cashflowPrefillInputs.fixedMonthlyCosts, 250000);

const missingPayroll = workflow.getMissingInputs(workflow.normalizeInputs("Calculate payroll for employees", {}));
assert.deepStrictEqual(missingPayroll, ["country", "numberOfEmployees", "grossPay", "payPeriod"]);

console.log("AI SME finance workflow validated: payroll, VAT, invoice, PAYE, registration, cashflow, warnings, and missing inputs.");
