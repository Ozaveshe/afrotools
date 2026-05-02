#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const architecture = require(path.join(root, "assets/js/lib/afropayroll-pro-architecture.js"));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  console.error("FAIL " + message);
  process.exitCode = 1;
}

function pass(message) {
  console.log("PASS " + message);
}

const payload = architecture.payload;
const apiFile = read("netlify/functions/api-afropayroll.js");
const migration = fs.readdirSync(path.join(root, "supabase/migrations"))
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => read(path.join("supabase/migrations", file)))
  .join("\n");
const workspace = read("tools/afropayroll-os/workspace.html");

if (!payload || payload.product !== "AfroPayroll Pro") fail("architecture payload missing product");
else pass("architecture payload loaded");

if (!workspace.includes("/assets/js/lib/afropayroll-pro-architecture.js")) {
  fail("workspace does not load architecture helper");
} else {
  pass("workspace loads architecture helper");
}

payload.roles.forEach((role) => {
  const needle = "'" + role.role + "'";
  if (!migration.includes(needle)) fail("role missing from migration: " + role.role);
});
pass("role names checked against migration");

Object.entries(payload.roleGroups).forEach(([group, roles]) => {
  if (!roles.length) fail("role group is empty: " + group);
  roles.forEach((role) => {
    if (!payload.roles.some((item) => item.role === role)) fail("role group references unknown role: " + group + " -> " + role);
  });
});
pass("role groups reference known roles");

payload.entities.forEach((entity) => {
  if (!migration.includes("public." + entity.table)) fail("entity table missing from migration: " + entity.table);
});
pass("entity tables checked against migration");

payload.apiActions.forEach((action) => {
  if (action.action === "delete") return;
  if (!apiFile.includes(action.action)) fail("API action missing from function: " + action.action);
});
pass("API actions checked against function");

Object.keys(payload.workflowStates).forEach((status) => {
  if (!migration.includes("'" + status + "'")) fail("workflow status missing from migration: " + status);
});
pass("workflow states checked against migration");

const approvalRoles = payload.roleGroups.approvePayroll.join("', '");
if (!apiFile.includes("const APPROVE_PAYROLL_ROLES = ['" + approvalRoles + "'];")) {
  fail("approval role group is not aligned with API constant");
} else {
  pass("approval role group aligned with API constant");
}

const coverage = architecture.buildCoverage();
if (!coverage.length) fail("coverage matrix is empty");
else pass("coverage matrix generated: " + coverage.length + " layers");

if (process.exitCode) process.exit(process.exitCode);
