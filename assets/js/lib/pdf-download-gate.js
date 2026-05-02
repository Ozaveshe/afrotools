!function (window, document) {
  "use strict";

  var VERSION = "20260502";
  var activeModal = null;
  var activeKeyHandler = null;
  var pending = [];
  var bypassedAnchors = typeof WeakSet !== "undefined" ? new WeakSet() : null;
  var nativeAnchorClick = window.HTMLAnchorElement && window.HTMLAnchorElement.prototype.click;
  var lastContext = null;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage && window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {}
  }

  function getToolSlug(options) {
    if (options && options.toolSlug) return String(options.toolSlug);
    if (options && options.toolId) return String(options.toolId);
    if (options && options.reportConfig && options.reportConfig.toolId) return String(options.reportConfig.toolId);
    var meta = document.querySelector('meta[name="tool-id"], meta[name="afrotools:tool-slug"]');
    if (meta && meta.content) return meta.content;
    var parts = window.location.pathname.replace(/\/app\.html$/i, "").replace(/\/index\.html$/i, "").replace(/\/$/, "").split("/").filter(Boolean);
    return parts[parts.length - 1] || "pdf-tool";
  }

  function getCountryCode(options) {
    if (options && options.countryCode) return String(options.countryCode).toUpperCase();
    if (options && options.reportConfig && options.reportConfig.countryCode) return String(options.reportConfig.countryCode).toUpperCase();
    var meta = document.querySelector('meta[name="country-code"], meta[name="afrotools:country"]');
    if (meta && meta.content) return meta.content.toUpperCase();
    var match = window.location.pathname.match(/\/([a-z]{2})-[a-z]/i);
    return match ? match[1].toUpperCase() : "";
  }

  function inferCategory(options) {
    if (options && options.category) return options.category;
    var slug = getToolSlug(options);
    var path = window.location.pathname;
    if (/paye|salary-tax|salary|tax|vat|payroll/i.test(slug + " " + path)) return "salary-tax";
    if (/pdf|document/i.test(slug + " " + path)) return "document-pdf";
    return "generated-report";
  }

  function getCachedUser() {
    if (window.AfroAuth) {
      try {
        if (typeof window.AfroAuth.getUser === "function") {
          var user = window.AfroAuth.getUser();
          if (user && (user.id || user.email)) return user;
        }
      } catch (err) {}
      try {
        if (typeof window.AfroAuth.getCachedProfile === "function") {
          var profile = window.AfroAuth.getCachedProfile();
          if (profile && (profile.id || profile.email)) return profile;
        }
      } catch (err) {}
    }
    var auth = readJson("afro_auth_v2", null);
    if (auth && (auth.id || auth.email)) return auth;
    var legacy = readJson("afrotools-auth", null);
    if (legacy && legacy.email) return legacy;
    return null;
  }

  function isRegistered() {
    try {
      if (window.AfroAuth && typeof window.AfroAuth.isLoggedIn === "function" && window.AfroAuth.isLoggedIn()) return true;
    } catch (err) {}
    try {
      if (window.AfroWorkspace && typeof window.AfroWorkspace.isSignedIn === "function" && window.AfroWorkspace.isSignedIn()) return true;
    } catch (err) {}
    return !!getCachedUser();
  }

  function loadAuth() {
    return new Promise(function (resolve) {
      var tries = 0;
      function check() {
        tries += 1;
        if (window.AfroAuth && typeof window.AfroAuth.login === "function") return resolve(window.AfroAuth);
        if (tries > 50) return resolve(window.AfroAuth || null);
        window.setTimeout(check, 100);
      }
      if (window.AfroAuth && typeof window.AfroAuth.login === "function") return resolve(window.AfroAuth);
      if (document.getElementById("afro-auth-js")) return check();
      var script = document.createElement("script");
      script.id = "afro-auth-js";
      script.src = "/assets/js/afro-auth.js?v=6";
      script.onload = check;
      script.onerror = function () { resolve(window.AfroAuth || null); };
      document.head.appendChild(script);
    });
  }

  function deviceType() {
    var width = window.innerWidth || 1024;
    if (width < 640) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  function attribution() {
    var params = new URLSearchParams(window.location.search || "");
    return {
      pageUrl: window.location.href,
      referrerUrl: document.referrer || "",
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || ""
    };
  }

  function buildContext(options, profile) {
    var report = options && options.reportConfig ? options.reportConfig : {};
    var toolSlug = getToolSlug(options);
    var title = options && options.reportTitle || report.reportTitle || report.title || "Generated report";
    var category = inferCategory(options);
    return {
      version: VERSION,
      toolSlug: toolSlug,
      category: category,
      reportTitle: title,
      countryCode: getCountryCode(options),
      currency: options && options.currency || report.currency || "",
      fileName: options && options.fileName || "",
      source: options && options.source || "pdf-download-gate",
      useCase: profile && profile.useCase || options && options.useCase || "",
      user: profile || getCachedUser() || null,
      capturedAt: new Date().toISOString()
    };
  }

  function persistContext(context, profile) {
    lastContext = Object.assign({}, context || {}, { user: profile || context.user || getCachedUser() || null });
    writeJson("afro_pdf_gate_context_v1", lastContext);
    try {
      window.dispatchEvent(new CustomEvent("afro-pdf-gate-passed", { detail: lastContext }));
    } catch (err) {}
  }

  function captureLead(profile, context) {
    var payload = Object.assign({}, attribution(), {
      email: profile.email,
      name: profile.name || profile.fullName || "",
      company: profile.company || "",
      role: profile.role || "",
      industry: profile.industry || "",
      companySize: profile.companySize || "",
      source: context && context.source || "pdf-gate",
      toolSlug: context && context.toolSlug || getToolSlug(),
      countryCode: context && context.countryCode || getCountryCode(),
      currency: context && context.currency || "",
      deviceType: deviceType(),
      optInDigest: profile.optInDigest !== false,
      conversionValue: 1
    });
    try {
      window.fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (err) {}
    try {
      var formPayload = {
        "form-name": "pdf-leads",
        email: payload.email,
        source: payload.source,
        tool: payload.toolSlug
      };
      ["name", "company", "role", "industry", "companySize", "countryCode"].forEach(function (key) {
        if (payload[key]) formPayload[key] = payload[key];
      });
      window.fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formPayload).toString()
      }).catch(function () {});
    } catch (err) {}
  }

  function injectStyles() {
    if (document.getElementById("pdf-download-gate-css")) return;
    var style = document.createElement("style");
    style.id = "pdf-download-gate-css";
    style.textContent = [
      ".pdg-overlay{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.62);backdrop-filter:blur(5px)}",
      ".pdg-card{width:min(520px,100%);max-height:92vh;overflow:auto;border:1px solid #dbe5f2;border-radius:8px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.28);font-family:'DM Sans',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a}",
      ".pdg-card *{box-sizing:border-box}",
      ".pdg-close{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:8px;background:#f1f5f9;color:#475569;font:inherit;font-size:1.15rem;cursor:pointer}",
      ".pdg-head{padding:24px 24px 12px}",
      ".pdg-kicker{display:inline-flex;align-items:center;min-height:26px;padding:4px 10px;border-radius:999px;background:#eaf3ff;color:#0f4aa2;font-size:.72rem;font-weight:900;letter-spacing:0;text-transform:uppercase}",
      ".pdg-head h2{margin:14px 0 8px;font-size:1.28rem;line-height:1.2;font-weight:900;letter-spacing:0;color:#0f172a}",
      ".pdg-head p{margin:0;color:#64748b;font-size:.88rem;line-height:1.55}",
      ".pdg-proof{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:0 24px 14px}",
      ".pdg-proof span{border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;padding:8px;font-size:.72rem;font-weight:800;color:#334155;text-align:center}",
      ".pdg-tabs{display:grid;grid-template-columns:1fr 1fr;margin:0 24px;border:1px solid #dbe5f2;border-radius:8px;overflow:hidden}",
      ".pdg-tab{min-height:42px;border:0;background:#f8fafc;color:#64748b;font:inherit;font-size:.84rem;font-weight:900;cursor:pointer}",
      ".pdg-tab.on{background:#0f4aa2;color:#fff}",
      ".pdg-body{padding:18px 24px 24px}",
      ".pdg-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
      ".pdg-field{display:grid;gap:6px;margin-bottom:12px}",
      ".pdg-field label{font-size:.76rem;font-weight:900;color:#475569}",
      ".pdg-field input,.pdg-field select{width:100%;min-height:42px;border:1.5px solid #dbe5f2;border-radius:8px;padding:9px 12px;font:inherit;font-size:.92rem;color:#0f172a;background:#fff}",
      ".pdg-field input:focus,.pdg-field select:focus{outline:0;border-color:#0f6ddf;box-shadow:0 0 0 3px rgba(15,109,223,.12)}",
      ".pdg-error{min-height:18px;margin:2px 0 10px;color:#b91c1c;font-size:.78rem;font-weight:800;text-align:center}",
      ".pdg-primary,.pdg-secondary{border:0;font:inherit;cursor:pointer}",
      ".pdg-primary{width:100%;min-height:44px;border-radius:8px;background:#0f4aa2;color:#fff;font-size:.9rem;font-weight:900}",
      ".pdg-primary:disabled{background:#94a3b8;cursor:wait}",
      ".pdg-secondary{width:100%;margin-top:10px;background:transparent;color:#0f4aa2;font-size:.8rem;font-weight:900}",
      ".pdg-foot{padding:0 24px 22px;text-align:center;color:#64748b;font-size:.74rem;line-height:1.45}",
      "@media(max-width:560px){.pdg-overlay{align-items:flex-end;padding:0}.pdg-card{border-radius:8px 8px 0 0;border-left:0;border-right:0;border-bottom:0}.pdg-proof,.pdg-grid{grid-template-columns:1fr}.pdg-proof span{text-align:left}}"
    ].join("");
    document.head.appendChild(style);
  }

  function closeModal(reason) {
    if (activeModal) activeModal.remove();
    activeModal = null;
    document.body.style.overflow = "";
    if (activeKeyHandler) document.removeEventListener("keydown", activeKeyHandler);
    activeKeyHandler = null;
    if (reason === "cancel") {
      var canceled = pending.splice(0);
      canceled.forEach(function (item) {
        if (item.options && typeof item.options.onCancel === "function") {
          try { item.options.onCancel(); } catch (err) {}
        }
      });
    }
  }

  function flushSuccess(profile, context) {
    closeModal("success");
    persistContext(context, profile);
    try {
      if (window.gtag) window.gtag("event", "pdf_download_gate_passed", { tool_slug: context.toolSlug, gate_version: VERSION, category: context.category });
    } catch (err) {}
    pending.splice(0).forEach(function (item) {
      try { item.callback(profile || getCachedUser() || true, context); } catch (err) { window.setTimeout(function () { throw err; }, 0); }
    });
  }

  function setMode(root, mode) {
    root.dataset.mode = mode;
    root.querySelectorAll(".pdg-tab").forEach(function (tab) {
      tab.classList.toggle("on", tab.dataset.mode === mode);
    });
    root.querySelectorAll("[data-signup-only]").forEach(function (field) {
      field.style.display = mode === "signup" ? "grid" : "none";
    });
    var password = root.querySelector("#pdgPassword");
    if (password) password.autocomplete = mode === "signup" ? "new-password" : "current-password";
    var primary = root.querySelector(".pdg-primary");
    if (primary) primary.textContent = mode === "signup" ? "Create account and download" : "Sign in and download";
    var error = root.querySelector(".pdg-error");
    if (error) error.textContent = "";
  }

  function openModal(options) {
    if (activeModal) return;
    injectStyles();
    var context = buildContext(options || {});
    var root = document.createElement("div");
    root.className = "pdg-overlay";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Create an account to download this report");
    root.innerHTML = [
      '<div class="pdg-card" style="position:relative">',
      '<button class="pdg-close" type="button" aria-label="Close">&times;</button>',
      '<div class="pdg-head">',
      '<span class="pdg-kicker">Free account required</span>',
      '<h2>Download and save this report</h2>',
      '<p>Your generated file stays in this browser. Create or use an AfroTools account so repeat downloads, saved reports, and dashboard handoff stay connected.</p>',
      '</div>',
      '<div class="pdg-proof"><span>Private browser export</span><span>Saved report trail</span><span>Dashboard ready</span></div>',
      '<div class="pdg-tabs">',
      '<button class="pdg-tab" type="button" data-mode="signup">Create account</button>',
      '<button class="pdg-tab" type="button" data-mode="login">Sign in</button>',
      '</div>',
      '<form class="pdg-body">',
      '<div class="pdg-field"><label for="pdgReportTitle">Report name</label><input id="pdgReportTitle" autocomplete="off" value="' + esc(context.reportTitle) + '" placeholder="Payroll tax report"></div>',
      '<div class="pdg-grid">',
      '<div class="pdg-field" data-signup-only><label for="pdgName">Full name</label><input id="pdgName" autocomplete="name" placeholder="Your name"></div>',
      '<div class="pdg-field"><label for="pdgEmail">Work email</label><input id="pdgEmail" type="email" autocomplete="email" required placeholder="you@example.com"></div>',
      '<div class="pdg-field" data-signup-only><label for="pdgCompany">Company or client</label><input id="pdgCompany" autocomplete="organization" placeholder="Company, client, or personal"></div>',
      '<div class="pdg-field" data-signup-only><label for="pdgRole">Role</label><input id="pdgRole" autocomplete="organization-title" placeholder="Founder, HR, accountant"></div>',
      '<div class="pdg-field" data-signup-only><label for="pdgUseCase">Use case</label><select id="pdgUseCase"><option value="personal salary">Personal salary</option><option value="employer payroll">Employer payroll</option><option value="client advisory">Client advisory</option><option value="business planning">Business planning</option></select></div>',
      '<div class="pdg-field"><label for="pdgPassword">Password</label><input id="pdgPassword" type="password" autocomplete="new-password" required placeholder="Minimum 6 characters"></div>',
      '</div>',
      '<div class="pdg-error" aria-live="polite"></div>',
      '<button class="pdg-primary" type="submit">Create account and download</button>',
      '<button class="pdg-secondary" type="button" data-check-auth>Already signed in on this browser? Continue download</button>',
      '</form>',
      '<div class="pdg-foot">Registered users skip this gate automatically. Guests can calculate first, then create an account only when they need the generated download.</div>',
      '</div>'
    ].join("");
    activeModal = root;
    document.body.appendChild(root);
    document.body.style.overflow = "hidden";

    var form = root.querySelector("form");
    var error = root.querySelector(".pdg-error");
    var primary = root.querySelector(".pdg-primary");
    var email = root.querySelector("#pdgEmail");
    var password = root.querySelector("#pdgPassword");

    root.querySelector(".pdg-close").addEventListener("click", function () { closeModal("cancel"); });
    root.addEventListener("click", function (event) {
      if (event.target === root) closeModal("cancel");
    });
    root.querySelectorAll(".pdg-tab").forEach(function (tab) {
      tab.addEventListener("click", function () { setMode(root, tab.dataset.mode); });
    });
    root.querySelector("[data-check-auth]").addEventListener("click", function () {
      if (isRegistered()) flushSuccess(getCachedUser(), buildContext(options || {}, getCachedUser()));
      else error.textContent = "You are not signed in on this browser yet.";
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      error.textContent = "";
      var mode = root.dataset.mode || "signup";
      var profile = {
        name: (root.querySelector("#pdgName").value || "").trim(),
        email: (email.value || "").trim().toLowerCase(),
        company: (root.querySelector("#pdgCompany").value || "").trim(),
        role: (root.querySelector("#pdgRole").value || "").trim(),
        industry: "Finance/Banking",
        companySize: "",
        useCase: (root.querySelector("#pdgUseCase").value || "").trim(),
        optInDigest: true
      };
      var reportTitle = (root.querySelector("#pdgReportTitle").value || "").trim();
      if (reportTitle) options = Object.assign({}, options || {}, { reportTitle: reportTitle });
      if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(profile.email)) {
        error.textContent = "Enter a valid email address.";
        email.focus();
        return;
      }
      if (!password.value || password.value.length < 6) {
        error.textContent = "Enter a password with at least 6 characters.";
        password.focus();
        return;
      }
      if (mode === "signup" && !profile.name) {
        error.textContent = "Enter your name to create the account.";
        root.querySelector("#pdgName").focus();
        return;
      }
      if (mode === "signup" && (!profile.company || !profile.role)) {
        error.textContent = "Add company/client and role so the report trail is useful later.";
        (!profile.company ? root.querySelector("#pdgCompany") : root.querySelector("#pdgRole")).focus();
        return;
      }

      var context = buildContext(options || {}, profile);
      primary.disabled = true;
      primary.textContent = mode === "signup" ? "Creating account..." : "Signing in...";
      captureLead(profile, context);
      loadAuth().then(function (auth) {
        if (!auth || typeof auth.login !== "function") throw new Error("Auth system is still loading. Please try again.");
        return mode === "signup" ? auth.signup(profile.email, profile.name, password.value, "") : auth.login(profile.email, password.value);
      }).then(function (result) {
        if (!result || !result.ok) throw new Error(result && result.error || "Authentication failed.");
        var user = Object.assign({}, profile, result.user || {});
        flushSuccess(user, buildContext(options || {}, user));
      }).catch(function (err) {
        error.textContent = err && err.message ? err.message : "Could not sign in. Please try again.";
        primary.disabled = false;
        setMode(root, mode);
      });
    });
    activeKeyHandler = function (event) {
      if (event.key === "Escape") closeModal("cancel");
    };
    document.addEventListener("keydown", activeKeyHandler);
    setMode(root, options && options.mode || "signup");
    window.setTimeout(function () {
      var target = root.dataset.mode === "signup" ? root.querySelector("#pdgName") : email;
      if (target) target.focus();
    }, 60);
  }

  function guard(callback, options) {
    var opts = options || {};
    if (isRegistered()) {
      var context = buildContext(opts, getCachedUser());
      persistContext(context, getCachedUser());
      if (typeof callback === "function") callback(getCachedUser() || true, context);
      return true;
    }
    if (typeof callback === "function") pending.push({ callback: callback, options: opts });
    openModal(opts);
    return false;
  }

  function guardPromise(options) {
    return new Promise(function (resolve) {
      guard(function (user, context) {
        resolve({ user: user, context: context || lastContext });
      }, Object.assign({}, options || {}, {
        onCancel: function () { resolve(null); }
      }));
    });
  }

  function isPdfLikeDownload(anchor) {
    if (!anchor || !anchor.download) return false;
    if (anchor.dataset && anchor.dataset.noPdfGate === "true") return false;
    var name = String(anchor.download || anchor.href || "").toLowerCase();
    return /\.(pdf|zip|docx)$/i.test(name) || /^blob:/i.test(anchor.href || "");
  }

  function runDownload(download) {
    function click(href, cleanup) {
      var anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = download.download || "afrotools-download";
      if (download.target) anchor.target = download.target;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      if (bypassedAnchors) bypassedAnchors.add(anchor);
      nativeAnchorClick.call(anchor);
      window.setTimeout(function () {
        if (bypassedAnchors) bypassedAnchors.delete(anchor);
        anchor.remove();
        if (cleanup) cleanup();
      }, 0);
    }
    if (download.blobPromise) {
      download.blobPromise.then(function (blob) {
        if (!blob) return click(download.href);
        var href = URL.createObjectURL(blob);
        click(href, function () { window.setTimeout(function () { URL.revokeObjectURL(href); }, 5000); });
      });
    } else {
      click(download.href);
    }
  }

  function snapshotAnchor(anchor) {
    var data = { href: anchor.href, download: anchor.download, target: anchor.target };
    if (/^blob:/i.test(data.href)) {
      data.blobPromise = window.fetch(data.href).then(function (res) { return res.ok ? res.blob() : null; }).catch(function () { return null; });
    }
    return data;
  }

  function installAnchorPatch() {
    if (!nativeAnchorClick || window.__afroPdfDownloadGateAnchorPatch) return;
    window.__afroPdfDownloadGateAnchorPatch = true;
    window.HTMLAnchorElement.prototype.click = function () {
      if (bypassedAnchors && bypassedAnchors.has(this)) return nativeAnchorClick.call(this);
      if (!isPdfLikeDownload(this) || isRegistered()) return nativeAnchorClick.call(this);
      var data = snapshotAnchor(this);
      guard(function () { runDownload(data); }, { source: "anchor-download", fileName: data.download });
    };
    document.addEventListener("click", function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest("a[download]") : null;
      if (!anchor || bypassedAnchors && bypassedAnchors.has(anchor)) return;
      if (!isPdfLikeDownload(anchor) || isRegistered()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var data = snapshotAnchor(anchor);
      guard(function () { runDownload(data); }, { source: "anchor-click", fileName: data.download });
    }, true);
  }

  var api = {
    version: VERSION,
    isRegistered: isRegistered,
    guard: guard,
    guardPromise: guardPromise,
    open: function (callback, options) { return guard(callback, options); },
    close: function () { closeModal("cancel"); },
    captureLead: captureLead,
    getLastContext: function () { return lastContext; }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.pdfDownloadGate = api;
  window.AfroTools.captureLeadEnriched = captureLead;
  window.AfroPdfDownloadGate = api;

  if (window.customElements && !window.customElements.get("email-gate-modal")) {
    window.customElements.define("email-gate-modal", class extends HTMLElement {
      show(callback, options) {
        return guard(callback, Object.assign({ source: "email-gate-modal" }, options || {}));
      }
    });
  }

  installAnchorPatch();
}(window, document);
