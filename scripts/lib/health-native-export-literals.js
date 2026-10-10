"use strict";

const { parse } = require("acorn");

// These controllers provide their own French export copy. The locale page
// builders still collect English UI text from them, without translating French
// report branches or mistaking code between quote marks for visible text.
const NATIVE_EXPORT_ROUTES = new Set([
  "/health/calorie-counter", "/tools/childbirth-cost", "/tools/ovulation-calc",
  "/tools/water-intake", "/tools/waist-hip-ratio", "/tools/water-quality",
  "/tools/vaccine-schedule", "/health/pregnancy-due-date", "/tools/drug-dosage",
  "/health/bmi-calculator", "/tools/blood-pressure"
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
  const strings = new Set();
  const add = (value) => {
    if (typeof value === "string" && !/^\s*<[^>]+>/.test(value)) strings.add(value);
  };
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
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
  visit(parse(source, { ecmaVersion: "latest", sourceType: "script" }));
  return strings;
}

module.exports = { NATIVE_EXPORT_ROUTES, collectEnglishLiteralText };
