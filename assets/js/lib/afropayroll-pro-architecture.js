!function(root) {
  "use strict";

  var architecture = {
    schemaVersion: "2026-05-02.1",
    product: "AfroPayroll Pro",
    principle: "Africa-first payroll workspace, not a statutory filing or salary disbursement system.",
    guardrails: [
      "Salary data is private and must be role-gated when synced.",
      "Country pack status controls confidence language, not filing authority.",
      "Every synced mutation that changes a run, output, import, export, approval, or member should create an audit event.",
      "Local exports remain local unless a signed-in user explicitly syncs the run.",
      "No UI or API should claim filing, remittance, money movement, or guaranteed compliance."
    ],
    roleGroups: {
      viewPayroll: ["owner", "admin", "payroll_admin", "accountant", "approver"],
      editPayroll: ["owner", "admin", "payroll_admin", "accountant"],
      approvePayroll: ["owner", "admin", "accountant", "approver"],
      manageMembers: ["owner", "admin", "payroll_admin"]
    },
    roles: [
      { role: "owner", viewSalary: true, editSalary: true, approveRuns: true, manageMembers: true },
      { role: "admin", viewSalary: true, editSalary: true, approveRuns: true, manageMembers: true },
      { role: "payroll_admin", viewSalary: true, editSalary: true, approveRuns: false, manageMembers: false },
      { role: "accountant", viewSalary: true, editSalary: true, approveRuns: true, manageMembers: false },
      { role: "approver", viewSalary: true, editSalary: false, approveRuns: true, manageMembers: false },
      { role: "viewer", viewSalary: false, editSalary: false, approveRuns: false, manageMembers: false }
    ],
    layers: [
      {
        id: "local_workspace",
        name: "Local Draft Workspace",
        responsibility: "Capture company header, payroll rows, estimates, local saved history, and local packet downloads.",
        primaryFiles: ["tools/afropayroll-os/workspace.html"],
        persistence: "browser localStorage",
        risk: "Shared-device exposure if users treat local drafts as cloud records."
      },
      {
        id: "country_pack_layer",
        name: "Country Pack Confidence Layer",
        responsibility: "Expose country support level, source links, language lanes, confidence, and display warnings.",
        primaryFiles: ["data/hr/afropayroll-country-packs.js", "assets/js/lib/afropayroll-country-packs.js"],
        persistence: "static data",
        risk: "Must not be interpreted as statutory filing readiness."
      },
      {
        id: "calculation_layer",
        name: "Calculation Preview Layer",
        responsibility: "Run local country engines for supported launch packs and arithmetic fallback for estimate rows.",
        primaryFiles: [
          "assets/js/engines/ng-paye.js",
          "assets/js/engines/ke-paye.js",
          "assets/js/engines/gh-paye.js",
          "assets/js/engines/za-paye.js"
        ],
        persistence: "none",
        risk: "Engine outputs must stay labelled as preview until statutory packs are fully verified."
      },
      {
        id: "cloud_workspace",
        name: "Cloud Tenant Workspace",
        responsibility: "Persist clients, companies, runs, rows, roles, approvals, imports, exports, payslips, statutory pack records, and audit events.",
        primaryFiles: [
          "netlify/functions/api-afropayroll.js",
          "supabase/migrations/033-afropayroll-pro-schema.sql",
          "supabase/migrations/034-afropayroll-pro-rls-helper-hardening.sql",
          "supabase/migrations/035-afropayroll-pro-fk-indexes.sql"
        ],
        persistence: "Supabase Postgres with RLS",
        risk: "Netlify function uses service role, so every action must enforce application RBAC before data access."
      },
      {
        id: "workflow_outputs",
        name: "Workflow And Output Layer",
        responsibility: "Coordinate imports, approvals, payslip generation, statutory pack drafts, branded exports, dashboard counts, and audit trail.",
        primaryFiles: ["tools/afropayroll-os/workspace.html", "netlify/functions/api-afropayroll.js"],
        persistence: "local downloads plus synced metadata when a run is saved",
        risk: "Downloads must not imply salary payment, tax filing, or statutory remittance."
      },
      {
        id: "growth_connectors",
        name: "Acquisition And Cross-Sell Layer",
        responsibility: "Connect payslip, staff cost, wage, leave, and social-security tools into the Pro workspace.",
        primaryFiles: [
          "tools/payslip-generator/index.html",
          "tools/staff-cost/index.html",
          "tools/minimum-wage/index.html",
          "tools/leave-calculator/index.html",
          "tools/social-security/index.html"
        ],
        persistence: "static links",
        risk: "Do not gate free calculators behind the Pro workspace."
      }
    ],
    entities: [
      { table: "payroll_clients", owner: "cloud_workspace", containsSalaryData: false },
      { table: "payroll_memberships", owner: "cloud_workspace", containsSalaryData: false },
      { table: "payroll_role_permissions", owner: "cloud_workspace", containsSalaryData: false },
      { table: "payroll_companies", owner: "cloud_workspace", containsSalaryData: false },
      { table: "payroll_employees", owner: "cloud_workspace", containsSalaryData: true },
      { table: "payroll_runs", owner: "cloud_workspace", containsSalaryData: true },
      { table: "payroll_run_rows", owner: "cloud_workspace", containsSalaryData: true },
      { table: "payroll_payslips", owner: "workflow_outputs", containsSalaryData: true },
      { table: "payroll_approvals", owner: "workflow_outputs", containsSalaryData: false },
      { table: "payroll_workspace_comments", owner: "workflow_outputs", containsSalaryData: false },
      { table: "payroll_import_batches", owner: "workflow_outputs", containsSalaryData: false },
      { table: "payroll_exports", owner: "workflow_outputs", containsSalaryData: true },
      { table: "payroll_statutory_packs", owner: "workflow_outputs", containsSalaryData: true },
      { table: "payroll_country_pack_versions", owner: "country_pack_layer", containsSalaryData: false },
      { table: "payroll_audit_events", owner: "workflow_outputs", containsSalaryData: false }
    ],
    workflowStates: {
      draft: ["needs_review", "ready", "approval_requested", "archived"],
      needs_review: ["draft", "approval_requested", "ready", "archived"],
      ready: ["approval_requested", "exported", "closed", "archived"],
      approval_requested: ["approved", "needs_review", "archived"],
      approved: ["exported", "closed", "archived"],
      exported: ["closed", "archived"],
      closed: ["archived"],
      archived: []
    },
    apiActions: [
      { action: "list", method: "GET", roleGroup: "viewPayroll", tables: ["payroll_run_dashboard"], audit: false },
      { action: "dashboard", method: "GET", roleGroup: "viewPayroll", tables: ["payroll_run_dashboard"], audit: false },
      { action: "load", method: "GET", roleGroup: "viewPayroll", tables: ["payroll_runs", "payroll_run_rows", "payroll_companies"], audit: false },
      { action: "roles", method: "GET", roleGroup: "viewPayroll", tables: ["payroll_role_permissions", "payroll_memberships"], audit: false },
      { action: "audit", method: "GET", roleGroup: "viewPayroll", tables: ["payroll_audit_events"], audit: false },
      { action: "save_run", method: "POST", roleGroup: "editPayroll", tables: ["payroll_runs", "payroll_run_rows", "payroll_companies"], audit: true },
      { action: "request_approval", method: "POST", roleGroup: "editPayroll", tables: ["payroll_approvals", "payroll_runs"], audit: true },
      { action: "approve_run", method: "POST", roleGroup: "approvePayroll", tables: ["payroll_approvals", "payroll_runs"], audit: true },
      { action: "reject_run", method: "POST", roleGroup: "approvePayroll", tables: ["payroll_approvals", "payroll_runs"], audit: true },
      { action: "generate_payslips", method: "POST", roleGroup: "editPayroll", tables: ["payroll_payslips", "payroll_run_rows"], audit: true },
      { action: "generate_statutory_packs", method: "POST", roleGroup: "editPayroll", tables: ["payroll_statutory_packs", "payroll_run_rows"], audit: true },
      { action: "record_export", method: "POST", roleGroup: "editPayroll", tables: ["payroll_exports", "payroll_runs"], audit: true },
      { action: "record_import", method: "POST", roleGroup: "editPayroll", tables: ["payroll_import_batches"], audit: true },
      { action: "invite_member", method: "POST", roleGroup: "manageMembers", tables: ["payroll_memberships"], audit: true },
      { action: "delete", method: "DELETE", roleGroup: "editPayroll", tables: ["payroll_runs"], audit: true }
    ],
    featureGates: [
      { id: "local_only", meaning: "Works without login and must keep salary data in the browser." },
      { id: "account_required", meaning: "Requires AfroTools auth but not necessarily a synced run." },
      { id: "synced_run_required", meaning: "Requires a saved cloud run id before action can write audit, roles, approvals, or output metadata." },
      { id: "full_pack_recommended", meaning: "Country should be full_pack for stronger preview confidence." },
      { id: "human_review_required", meaning: "Output can be prepared, but final filing or client sign-off needs qualified human review." }
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function findBy(list, key, value) {
    return list.filter(function(item) {
      return item && item[key] === value;
    })[0] || null;
  }

  var api = {
    payload: architecture,
    listLayers: function() { return clone(architecture.layers); },
    getLayer: function(id) { return clone(findBy(architecture.layers, "id", id)); },
    listRoles: function() { return clone(architecture.roles); },
    getRole: function(role) { return clone(findBy(architecture.roles, "role", role)); },
    listEntities: function() { return clone(architecture.entities); },
    listApiActions: function() { return clone(architecture.apiActions); },
    getApiAction: function(action) { return clone(findBy(architecture.apiActions, "action", action)); },
    roleGroup: function(name) {
      return (architecture.roleGroups[name] || []).slice();
    },
    canRoleUseAction: function(role, action) {
      var item = findBy(architecture.apiActions, "action", action);
      if (!item) return false;
      return (architecture.roleGroups[item.roleGroup] || []).indexOf(role) !== -1;
    },
    nextStatuses: function(status) {
      return (architecture.workflowStates[status] || []).slice();
    },
    buildCoverage: function() {
      return architecture.layers.map(function(layer) {
        return {
          layer: layer.id,
          files: layer.primaryFiles.length,
          entities: architecture.entities.filter(function(entity) { return entity.owner === layer.id; }).length,
          apiActions: architecture.apiActions.filter(function(action) {
            return action.tables.some(function(table) {
              var entity = findBy(architecture.entities, "table", table);
              return entity && entity.owner === layer.id;
            });
          }).length
        };
      });
    }
  };

  root.AFROPAYROLL_PRO_ARCHITECTURE = architecture;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.afropayrollProArchitecture = api;
  root.AfroTools.afroPayroll = root.AfroTools.afroPayroll || {};
  root.AfroTools.afroPayroll.proArchitecture = api;
  root.AfroPayrollProArchitecture = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
}("undefined" !== typeof globalThis ? globalThis : this);
