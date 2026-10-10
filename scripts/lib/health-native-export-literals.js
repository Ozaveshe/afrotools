"use strict";

const { parse } = require("acorn");

// These controllers provide their own French export copy. The locale page
// builders still collect English UI text from them, without translating French
// report branches or mistaking code between quote marks for visible text.
const NATIVE_EXPORT_ROUTES = new Set([
  "/health/calorie-counter", "/tools/childbirth-cost", "/tools/ovulation-calc",
  "/tools/water-intake", "/tools/waist-hip-ratio", "/tools/water-quality",
  "/tools/vaccine-schedule", "/health/pregnancy-due-date", "/tools/drug-dosage",
  "/health/bmi-calculator", "/tools/blood-pressure", "/tools/hospital-cost",
  "/tools/clinic-costs", "/tools/pharmacy-prices", "/tools/dental-cost",
  "/tools/eye-care-cost", "/tools/mental-health-cost"
]);
const FRENCH_BINDINGS = new Set([
  "frenchItems", "frenchSources", "frenchText", "frenchReport", "frenchWaterCopy",
  "frenchBriefText", "frenchDate", "frenchPlanText", "foldFrenchCalendar",
  "frenchWorksheetText", "frenchExportText"
]);

function isFrenchCondition(node) {
  if (node?.type === "Identifier" && node.name === "isFrench") return true;
  if (node?.type === "CallExpression" && node.callee?.type === "Identifier" &&
      ["isFrench", "isFrenchReport"].includes(node.callee.name)) return true;
  return node?.type === "BinaryExpression" && node.operator === "===" &&
    node.right?.type === "Literal" && node.right.value === "fr";
}

function collectEnglishLiteralText(source) {
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "script" });
  const bilingualNames = new Set();
  const findBilingualFunctions = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(findBilingualFunctions);
    if (node.type === "FunctionDeclaration" && node.params.length === 2 &&
        node.params.every((param) => param.type === "Identifier") && node.body.body.length === 1) {
      const statement = node.body.body[0];
      const value = statement.argument;
      if (statement.type === "ReturnStatement" && value?.type === "ConditionalExpression" &&
          value.test.type === "CallExpression" && value.test.callee.type === "Identifier" &&
          value.test.callee.name === "fr" && value.test.arguments.length === 0 &&
          value.consequent.type === "Identifier" && value.consequent.name === node.params[1].name &&
          value.alternate.type === "Identifier" && value.alternate.name === node.params[0].name) {
        bilingualNames.add(node.id.name);
      }
    }
    Object.values(node).forEach((value) => {
      if (value && typeof value === "object") findBilingualFunctions(value);
    });
  };
  findBilingualFunctions(ast);
  const strings = new Set();
  const add = (value) => {
    if (typeof value === "string" && !/^\s*<[^>]+>/.test(value)) strings.add(value);
  };
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    // These explicit English/French pairs already own their report translation.
    // Unknown helpers and dynamic arguments still enter normal collection.
    if (node.type === "CallExpression" && node.callee.type === "Identifier" &&
        bilingualNames.has(node.callee.name) && node.arguments.length === 2 &&
        node.arguments.every((argument) => argument.type === "Literal" && typeof argument.value === "string")) return;
    if ((node.type === "VariableDeclarator" || node.type === "FunctionDeclaration") &&
        FRENCH_BINDINGS.has(node.id?.name)) return;
    if ((node.type === "ConditionalExpression" || node.type === "IfStatement") && isFrenchCondition(node.test)) {
      visit(node.alternate);
      return;
    }
    if (node.type === "Literal") {
      add(node.value);
      return;
    }
    if (node.type === "TemplateLiteral") {
      if (node.expressions.length === 0) add(node.quasis[0].value.cooked);
      node.expressions.forEach(visit);
      return;
    }
    Object.values(node).forEach((value) => {
      if (value && typeof value === "object") visit(value);
    });
  };
  visit(ast);
  return strings;
}

module.exports = { NATIVE_EXPORT_ROUTES, collectEnglishLiteralText };
