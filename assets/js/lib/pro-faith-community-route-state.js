!function(root) {
  "use strict";

  var FAITH_ID = "faith-community";
  var routeLabels = [
    "Local preview only",
    "Device-only records",
    "No live reminders",
    "No account sync"
  ];
  var workflowGaps = [
    "Event reminders are device-only and are not sent by email, SMS, WhatsApp, or a server job yet.",
    "Volunteer rota gaps use local roster labels only until a staffed schedule workflow is reviewed.",
    "Welfare follow-up gaps can be tracked locally with owners and dates, but there is no account sync yet.",
    "Giving and zakat ledger CSV exports are device-only review files, not payment, receipt, or accounting proof.",
    "Certificate packets are not issued or stored yet.",
    "Outreach exports are not connected to messaging or account sync."
  ];
  var privacyBoundary = "Faith member, giving/zakat, volunteer, welfare, certificate, and outreach records stay on this device. There is no live community database, reminder table, account sync, or messaging send yet.";
  var STORAGE_KEY = "afrofaith_community_os_device_v1";
  var EXPORT_TYPE = "text/csv;charset=utf-8";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function patchFaithApp(app) {
    if (!app || app.id !== FAITH_ID) return app;
    var next = clone(app);
    next.shellState = "Local preview only";
    next.statusTone = "local";
    next.oneLine = "A local preview workspace for faith and community member, giving/zakat, volunteer, event, welfare, certificate, and outreach records. Live reminders, account sync, and messaging are not connected yet.";
    next.routeStateLabels = routeLabels.slice();
    next.workflowGaps = workflowGaps.slice();
    next.privacyBoundary = privacyBoundary;
    next.firstBuild = ["member list", "giving/zakat CSV export", "volunteer rota", "event reminder queue", "welfare follow-up queue"];
    return next;
  }

  function patchRegistry(registry) {
    if (!registry || registry.__faithRouteStatePatched) return registry;

    var getApp = registry.getApp;
    var getApps = registry.getApps;
    var getPriorityApps = registry.getPriorityApps;
    var getAgentPrompts = registry.getAgentPrompts;
    var buildAgentPrompt = registry.buildAgentPrompt;

    if (typeof getApp === "function") {
      registry.getApp = function(id) {
        return patchFaithApp(getApp.call(registry, id));
      };
    }

    if (typeof getApps === "function") {
      registry.getApps = function() {
        return getApps.call(registry).map(patchFaithApp);
      };
    }

    if (typeof getPriorityApps === "function") {
      registry.getPriorityApps = function() {
        return getPriorityApps.call(registry).map(patchFaithApp);
      };
    }

    if (typeof buildAgentPrompt === "function") {
      registry.buildAgentPrompt = function(app) {
        var patched = typeof app === "string" ? registry.getApp(app) : patchFaithApp(app);
        var brief = buildAgentPrompt.call(registry, patched);
        if (!patched || patched.id !== FAITH_ID) return brief;
        return [
          brief,
          "",
          "Route state labels: " + routeLabels.join(", ") + ".",
          "Privacy boundary: " + privacyBoundary,
          "Workflow gaps:",
          "- " + workflowGaps.join("\n- ")
        ].join("\n");
      };
    }

    if (typeof getAgentPrompts === "function") {
      registry.getAgentPrompts = function() {
        return registry.getApps().map(function(app) {
          return { id: app.id, name: app.name, prompt: registry.buildAgentPrompt(app) };
        });
      };
    }

    registry.__faithRouteStatePatched = true;
    return registry;
  }

  function createText(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    return node;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function todayIso() {
    return (new Date()).toISOString().slice(0, 10);
  }

  function nowIso() {
    return (new Date()).toISOString();
  }

  function safeText(value, fallback) {
    var text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return text || fallback || "";
  }

  function safeNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function blankState() {
    return {
      version: 1,
      updatedAt: nowIso(),
      members: [],
      giving: [],
      events: [],
      welfare: [],
      exports: []
    };
  }

  function normalizeState(state) {
    var next = state && typeof state === "object" ? state : blankState();
    next.members = Array.isArray(next.members) ? next.members : [];
    next.giving = Array.isArray(next.giving) ? next.giving : [];
    next.events = Array.isArray(next.events) ? next.events : [];
    next.welfare = Array.isArray(next.welfare) ? next.welfare : [];
    next.exports = Array.isArray(next.exports) ? next.exports : [];
    return next;
  }

  function readState() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      return normalizeState(raw ? JSON.parse(raw) : blankState());
    } catch (err) {
      return blankState();
    }
  }

  function writeState(state) {
    var next = normalizeState(state);
    next.updatedAt = nowIso();
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch (err) {
      return false;
    }
  }

  function findMemberName(state, id) {
    var match = (state.members || []).filter(function(member) { return member.id === id; })[0];
    return match ? match.name : "Unassigned";
  }

  function formatMoney(amount, currency) {
    return safeText(currency, "NGN") + " " + safeNumber(amount).toLocaleString("en", { maximumFractionDigits: 2 });
  }

  function isDue(dateValue) {
    return !!dateValue && dateValue <= todayIso();
  }

  function memberOptions(state, selectedId) {
    var options = ['<option value="">Unassigned record</option>'];
    state.members.forEach(function(member) {
      options.push('<option value="' + escapeHtml(member.id) + '"' + (member.id === selectedId ? " selected" : "") + ">" + escapeHtml(member.name) + "</option>");
    });
    return options.join("");
  }

  function metric(label, value) {
    return '<article class="faith-metric"><strong>' + escapeHtml(value) + '</strong><span>' + escapeHtml(label) + "</span></article>";
  }

  function rowFallback(message) {
    return '<div class="faith-empty">' + escapeHtml(message) + "</div>";
  }

  function renderMemberRows(state) {
    if (!state.members.length) return rowFallback("No members yet. Add a member or household to start the local roster.");
    return state.members.slice(0, 8).map(function(member) {
      return [
        '<article class="faith-record-row">',
        '<div><strong>', escapeHtml(member.name), '</strong><span>', escapeHtml(member.role), member.contact ? " | " + escapeHtml(member.contact) : "", "</span></div>",
        '<button type="button" class="faith-mini-btn" data-faith-remove="member" data-faith-id="', escapeHtml(member.id), '">Remove</button>',
        "</article>"
      ].join("");
    }).join("");
  }

  function renderGivingRows(state) {
    if (!state.giving.length) return rowFallback("No giving or zakat records yet. Add a local ledger row, then export CSV for review.");
    return state.giving.slice(0, 8).map(function(entry) {
      return [
        '<article class="faith-record-row">',
        '<div><strong>', escapeHtml(formatMoney(entry.amount, entry.currency)), '</strong><span>', escapeHtml(entry.date), " | ", escapeHtml(entry.type), " | ", escapeHtml(findMemberName(state, entry.memberId)), entry.note ? " | " + escapeHtml(entry.note) : "", "</span></div>",
        '<button type="button" class="faith-mini-btn" data-faith-remove="giving" data-faith-id="', escapeHtml(entry.id), '">Remove</button>',
        "</article>"
      ].join("");
    }).join("");
  }

  function renderEventRows(state) {
    if (!state.events.length) return rowFallback("No event reminders yet. Add one to make the local queue useful.");
    return state.events.slice(0, 8).map(function(event) {
      var due = isDue(event.reminderDate);
      return [
        '<article class="faith-record-row', due ? " is-due" : "", '">',
        '<div><strong>', escapeHtml(event.title), '</strong><span>', escapeHtml(event.date || "No event date"), " | reminder ", escapeHtml(event.reminderDate || "not set"), " | owner ", escapeHtml(event.owner || "Unassigned"), "</span></div>",
        '<span class="faith-state">', escapeHtml(due ? "Due now" : event.status), "</span>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderWelfareRows(state) {
    if (!state.welfare.length) return rowFallback("No welfare follow-ups yet. Add only the minimum non-confidential summary needed to coordinate care.");
    return state.welfare.slice(0, 8).map(function(item) {
      var due = isDue(item.followUpDate);
      return [
        '<article class="faith-record-row', due ? " is-due" : "", '">',
        '<div><strong>', escapeHtml(item.title), '</strong><span>', escapeHtml(findMemberName(state, item.memberId)), " | follow-up ", escapeHtml(item.followUpDate || "not set"), " | owner ", escapeHtml(item.owner || "Unassigned"), item.summary ? " | " + escapeHtml(item.summary) : "", "</span></div>",
        '<span class="faith-state">', escapeHtml(due ? "Follow up" : item.status), "</span>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderLastExport(state) {
    var last = state.exports[0];
    if (!last) return "No giving/zakat CSV exported yet.";
    return "Last CSV export: " + last.rows + " row" + (last.rows === 1 ? "" : "s") + " on " + last.exportedAt.slice(0, 10) + ".";
  }

  function renderWorkspaceHtml(state) {
    var givingTotal = state.giving.reduce(function(sum, entry) { return sum + safeNumber(entry.amount); }, 0);
    var dueEvents = state.events.filter(function(event) { return isDue(event.reminderDate); }).length;
    var dueWelfare = state.welfare.filter(function(item) { return isDue(item.followUpDate); }).length;
    return [
      '<section class="pdo-panel faith-workspace" id="faithDeviceWorkspace" aria-label="Device-only Faith Community workspace">',
      '<div class="pdo-panel-head"><div><div class="pdo-kicker">Device-only workspace</div><h2 class="pdo-h2">Local member, giving, reminder, and welfare slice</h2><p class="pdo-note">This slice writes to this browser only. It does not sync records, send reminders, process payments, issue receipts, or contact members.</p></div><div class="pdo-actions"><button type="button" class="pdo-btn" data-faith-action="reset">Reset local demo</button></div></div>',
      '<div class="pdo-panel-body">',
      '<div class="faith-metrics">',
      metric("Members", state.members.length),
      metric("Giving/zakat total", formatMoney(givingTotal, state.giving[0] && state.giving[0].currency || "NGN")),
      metric("Event reminders due", dueEvents),
      metric("Welfare follow-ups due", dueWelfare),
      "</div>",
      '<div class="faith-grid">',
      '<section class="faith-card"><h3>Member roster</h3><form data-faith-form="member" class="faith-form"><label for="faithMemberName">Member or household name</label><input id="faithMemberName" name="name" required autocomplete="off"><label for="faithMemberRole">Roster role</label><select id="faithMemberRole" name="role"><option>Member</option><option>Volunteer</option><option>Leader</option><option>Trustee</option><option>Visitor</option></select><label for="faithMemberContact">Contact note</label><input id="faithMemberContact" name="contact" autocomplete="off"><button class="pdo-btn primary" type="submit">Add member</button></form><div class="faith-list">', renderMemberRows(state), "</div></section>",
      '<section class="faith-card"><h3>Giving and zakat ledger</h3><form data-faith-form="giving" class="faith-form"><label for="faithGivingDate">Date</label><input id="faithGivingDate" name="date" type="date" value="', escapeHtml(todayIso()), '"><label for="faithGivingMember">Member</label><select id="faithGivingMember" name="memberId">', memberOptions(state), '</select><label for="faithGivingType">Ledger type</label><select id="faithGivingType" name="type"><option>Giving</option><option>Zakat</option><option>Offering</option><option>Donation</option></select><label for="faithGivingAmount">Amount</label><input id="faithGivingAmount" name="amount" type="number" min="0" step="0.01" required><label for="faithGivingCurrency">Currency</label><input id="faithGivingCurrency" name="currency" value="NGN" maxlength="8"><label for="faithGivingNote">Review note</label><input id="faithGivingNote" name="note" autocomplete="off"><div class="faith-actions"><button class="pdo-btn primary" type="submit">Add ledger row</button><button class="pdo-btn" type="button" data-faith-action="export-giving">Export CSV</button></div></form><div class="faith-list">', renderGivingRows(state), '</div><p class="faith-footnote" data-faith-export-status>', escapeHtml(renderLastExport(state)), "</p></section>",
      '<section class="faith-card"><h3>Event reminder queue</h3><form data-faith-form="event" class="faith-form"><label for="faithEventTitle">Event title</label><input id="faithEventTitle" name="title" required autocomplete="off"><label for="faithEventDate">Event date</label><input id="faithEventDate" name="date" type="date"><label for="faithEventReminder">Reminder date</label><input id="faithEventReminder" name="reminderDate" type="date"><label for="faithEventOwner">Owner</label><input id="faithEventOwner" name="owner" autocomplete="off"><button class="pdo-btn primary" type="submit">Add reminder</button></form><div class="faith-list">', renderEventRows(state), "</div></section>",
      '<section class="faith-card"><h3>Welfare follow-up queue</h3><form data-faith-form="welfare" class="faith-form"><label for="faithWelfareTitle">Case title</label><input id="faithWelfareTitle" name="title" required autocomplete="off"><label for="faithWelfareMember">Member</label><select id="faithWelfareMember" name="memberId">', memberOptions(state), '</select><label for="faithWelfareDate">Follow-up date</label><input id="faithWelfareDate" name="followUpDate" type="date"><label for="faithWelfareOwner">Owner</label><input id="faithWelfareOwner" name="owner" autocomplete="off"><label for="faithWelfareSummary">Need summary, no confidential details</label><input id="faithWelfareSummary" name="summary" autocomplete="off"><button class="pdo-btn primary" type="submit">Add follow-up</button></form><div class="faith-list">', renderWelfareRows(state), "</div></section>",
      "</div>",
      '<div class="faith-privacy-note" role="note">Device-only boundary: member names, giving/zakat rows, event reminders, and welfare follow-ups stay in localStorage on this browser. Use CSV export for local review only. Not receipt, payment proof, tax proof, or account sync.</div>',
      '<div class="pdo-status" data-faith-status aria-live="polite">Local workspace ready.</div>',
      "</div>",
      "</section>"
    ].join("");
  }

  function toCsvValue(value) {
    var text = String(value == null ? "" : value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function exportGivingCsv(state) {
    var headers = ["date", "member", "type", "amount", "currency", "review_note", "local_only_notice"];
    var rows = state.giving.map(function(entry) {
      return [
        entry.date,
        findMemberName(state, entry.memberId),
        entry.type,
        entry.amount,
        entry.currency,
        entry.note,
        "Device-only export. Not receipt, payment proof, tax proof, or account sync."
      ];
    });
    var csv = [headers].concat(rows).map(function(row) {
      return row.map(toCsvValue).join(",");
    }).join("\r\n");
    var blob = new Blob([csv], { type: EXPORT_TYPE });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "afrofaith-giving-zakat-ledger-" + todayIso() + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    state.exports.unshift({ type: "giving_zakat_csv", rows: rows.length, exportedAt: nowIso() });
    state.exports = state.exports.slice(0, 10);
    writeState(state);
  }

  function formValue(form, name) {
    return form.elements[name] ? form.elements[name].value : "";
  }

  function addRecord(kind, form) {
    var state = readState();
    if (kind === "member") {
      state.members.unshift({
        id: uid("member"),
        name: safeText(formValue(form, "name"), "Unnamed member"),
        role: safeText(formValue(form, "role"), "Member"),
        contact: safeText(formValue(form, "contact"), ""),
        createdAt: nowIso()
      });
    }
    if (kind === "giving") {
      state.giving.unshift({
        id: uid("giving"),
        date: safeText(formValue(form, "date"), todayIso()),
        memberId: safeText(formValue(form, "memberId"), ""),
        type: safeText(formValue(form, "type"), "Giving"),
        amount: safeNumber(formValue(form, "amount")),
        currency: safeText(formValue(form, "currency"), "NGN").toUpperCase().slice(0, 8),
        note: safeText(formValue(form, "note"), ""),
        createdAt: nowIso()
      });
    }
    if (kind === "event") {
      state.events.unshift({
        id: uid("event"),
        title: safeText(formValue(form, "title"), "Untitled event"),
        date: safeText(formValue(form, "date"), ""),
        reminderDate: safeText(formValue(form, "reminderDate"), ""),
        owner: safeText(formValue(form, "owner"), ""),
        status: "Planned",
        createdAt: nowIso()
      });
    }
    if (kind === "welfare") {
      state.welfare.unshift({
        id: uid("welfare"),
        title: safeText(formValue(form, "title"), "Welfare follow-up"),
        memberId: safeText(formValue(form, "memberId"), ""),
        followUpDate: safeText(formValue(form, "followUpDate"), ""),
        owner: safeText(formValue(form, "owner"), ""),
        summary: safeText(formValue(form, "summary"), ""),
        status: "Open",
        createdAt: nowIso()
      });
    }
    writeState(state);
  }

  function removeRecord(kind, id) {
    var state = readState();
    if (kind === "member") {
      state.members = state.members.filter(function(member) { return member.id !== id; });
      state.giving = state.giving.map(function(entry) {
        if (entry.memberId === id) entry.memberId = "";
        return entry;
      });
      state.welfare = state.welfare.map(function(item) {
        if (item.memberId === id) item.memberId = "";
        return item;
      });
    } else if (Array.isArray(state[kind])) {
      state[kind] = state[kind].filter(function(item) { return item.id !== id; });
    }
    writeState(state);
  }

  function setStatus(text) {
    var status = document.querySelector("[data-faith-status]");
    if (status) status.textContent = text;
  }

  function bindWorkspace(section) {
    if (!section || section.getAttribute("data-faith-bound") === "true") return;
    section.setAttribute("data-faith-bound", "true");
    section.addEventListener("submit", function(event) {
      var form = event.target.closest("[data-faith-form]");
      if (!form) return;
      event.preventDefault();
      addRecord(form.getAttribute("data-faith-form"), form);
      form.reset();
      renderFaithWorkspace();
      setStatus("Saved locally on this device.");
    });
    section.addEventListener("click", function(event) {
      var removeButton = event.target.closest("[data-faith-remove]");
      var actionButton = event.target.closest("[data-faith-action]");
      if (removeButton) {
        removeRecord(removeButton.getAttribute("data-faith-remove"), removeButton.getAttribute("data-faith-id"));
        renderFaithWorkspace();
        setStatus("Removed from this device.");
      }
      if (actionButton && actionButton.getAttribute("data-faith-action") === "export-giving") {
        var state = readState();
        exportGivingCsv(state);
        renderFaithWorkspace();
        setStatus("Giving/zakat CSV exported from local records.");
      }
      if (actionButton && actionButton.getAttribute("data-faith-action") === "reset") {
        writeState(blankState());
        renderFaithWorkspace();
        setStatus("Local Faith workspace reset on this device.");
      }
    });
  }

  function injectWorkspaceStyles() {
    if (document.getElementById("faith-community-workspace-css")) return;
    var style = document.createElement("style");
    style.id = "faith-community-workspace-css";
    style.textContent = [
      ".faith-workspace{margin-top:12px}",
      ".faith-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}",
      ".faith-metric{min-height:76px;padding:12px;border:1px solid var(--pdo-line);border-radius:var(--pdo-radius);background:var(--pdo-soft)}",
      ".faith-metric strong{display:block;color:var(--pdo-ink);font-size:22px;line-height:1;font-weight:900}",
      ".faith-metric span{display:block;margin-top:8px;color:var(--pdo-muted);font-size:11px;font-weight:900}",
      ".faith-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}",
      ".faith-card{display:grid;gap:10px;align-content:start;padding:12px;border:1px solid var(--pdo-line);border-radius:var(--pdo-radius);background:#fff}",
      ".faith-card h3{margin:0;color:var(--pdo-ink);font-size:15px;line-height:1.2;font-weight:900}",
      ".faith-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}",
      ".faith-form label{display:grid;gap:4px;color:#334155;font-size:11px;font-weight:900}",
      ".faith-form input,.faith-form select{width:100%;min-height:34px;border:1px solid var(--pdo-line-strong);border-radius:var(--pdo-radius);background:#fff;color:var(--pdo-ink);padding:7px 9px;font-size:12px;font-weight:700}",
      ".faith-form button,.faith-actions{grid-column:1 / -1}",
      ".faith-actions{display:flex;gap:8px;flex-wrap:wrap}",
      ".faith-list{display:grid;gap:7px}",
      ".faith-record-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 10px;border:1px solid var(--pdo-line);border-radius:var(--pdo-radius);background:var(--pdo-soft)}",
      ".faith-record-row.is-due{border-color:#fde68a;background:var(--pdo-amber-soft)}",
      ".faith-record-row strong{display:block;font-size:12px;line-height:1.2;font-weight:900}",
      ".faith-record-row span{display:block;margin-top:3px;color:var(--pdo-muted);font-size:11px;line-height:1.35}",
      ".faith-state{display:inline-flex!important;align-items:center;min-height:24px;padding:4px 8px;border:1px solid #fde68a;border-radius:999px;background:#fff;color:#92400e!important;font-size:10px!important;font-weight:900;text-transform:uppercase}",
      ".faith-mini-btn{min-height:28px;border:1px solid var(--pdo-line-strong);border-radius:var(--pdo-radius);background:#fff;color:var(--pdo-muted);padding:5px 8px;font-size:11px;font-weight:900}",
      ".faith-empty,.faith-footnote,.faith-privacy-note{color:var(--pdo-muted);font-size:12px;line-height:1.45}",
      ".faith-empty{padding:10px;border:1px dashed var(--pdo-line-strong);border-radius:var(--pdo-radius);background:var(--pdo-soft)}",
      ".faith-privacy-note{margin-top:12px;padding:11px;border-left:4px solid var(--pdo-blue);background:var(--pdo-blue-soft);color:#1e3a8a;font-weight:800}",
      "@media(max-width:1180px){.faith-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.faith-grid{grid-template-columns:1fr}}",
      "@media(max-width:640px){.faith-metrics,.faith-form{grid-template-columns:1fr}.faith-record-row{grid-template-columns:1fr}.faith-actions .pdo-btn{width:100%}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function renderFaithWorkspace() {
    if (!root.document || !document.body || document.body.getAttribute("data-pro-daily-app") !== FAITH_ID) return;
    var content = document.querySelector(".pdo-content");
    if (!content) return;
    injectWorkspaceStyles();
    var state = readState();
    var existing = document.getElementById("faithDeviceWorkspace");
    if (existing) {
      existing.outerHTML = renderWorkspaceHtml(state);
    } else {
      var routePanel = document.getElementById("faithRouteStatePanel");
      var wrapper = document.createElement("div");
      wrapper.innerHTML = renderWorkspaceHtml(state);
      content.insertBefore(wrapper.firstChild, routePanel ? routePanel.nextSibling : content.children[1] || null);
    }
    bindWorkspace(document.getElementById("faithDeviceWorkspace"));
  }

  function renderRouteStatePanel() {
    if (!root.document || !document.body || document.body.getAttribute("data-pro-daily-app") !== FAITH_ID) return;
    var content = document.querySelector(".pdo-content");
    if (!content || document.getElementById("faithRouteStatePanel")) return;

    var panel = document.createElement("section");
    panel.className = "pdo-panel";
    panel.id = "faithRouteStatePanel";
    panel.setAttribute("aria-label", "Faith Community route state");

    var head = document.createElement("div");
    head.className = "pdo-panel-head";
    var headText = document.createElement("div");
    headText.appendChild(createText("div", "pdo-kicker", "Route state"));
    headText.appendChild(createText("h2", "pdo-h2", "Faith Community is a local preview"));
    headText.appendChild(createText("p", "pdo-note", privacyBoundary));
    head.appendChild(headText);

    var body = document.createElement("div");
    body.className = "pdo-panel-body";

    var pillWrap = document.createElement("div");
    pillWrap.className = "pdo-pills";
    routeLabels.forEach(function(label) {
      var pill = createText("span", "pdo-pill local", label);
      pillWrap.appendChild(pill);
    });

    var grid = document.createElement("div");
    grid.className = "pdo-grid";
    workflowGaps.forEach(function(gap) {
      var row = document.createElement("article");
      row.className = "pdo-row";
      row.appendChild(createText("strong", "", gap));
      row.appendChild(createText("span", "", "Needs a reviewed product slice before this can be called live."));
      grid.appendChild(row);
    });

    body.appendChild(pillWrap);
    body.appendChild(grid);
    panel.appendChild(head);
    panel.appendChild(body);
    content.insertBefore(panel, content.children[1] || null);
    renderFaithWorkspace();
  }

  var registry = root.AfroProDailyOsRegistry || root.AfroTools && root.AfroTools.proDailyOsRegistry;
  patchRegistry(registry);

  if (root.AfroTools && root.AfroTools.proDailyOsRegistry) {
    root.AfroTools.proDailyOsRegistry = patchRegistry(root.AfroTools.proDailyOsRegistry);
  }
  if (root.AfroProDailyOsRegistry) {
    root.AfroProDailyOsRegistry = patchRegistry(root.AfroProDailyOsRegistry);
  }

  if (root.document) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        renderRouteStatePanel();
        renderFaithWorkspace();
      });
    } else {
      renderRouteStatePanel();
      renderFaithWorkspace();
    }
    setTimeout(function() {
      renderRouteStatePanel();
      renderFaithWorkspace();
    }, 0);
  }
}("undefined" != typeof window ? window : globalThis);
