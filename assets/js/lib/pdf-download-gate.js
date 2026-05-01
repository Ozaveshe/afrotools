!function () {
  "use strict";

  var VERSION = "20260501";
  var AUTH_KEY = "afro_auth_v2";
  var SESSION_KEY = "afro_session_v3";
  var allowedAnchors = typeof WeakSet !== "undefined" ? new WeakSet() : null;
  var nativeAnchorClick = window.HTMLAnchorElement && window.HTMLAnchorElement.prototype.click;
  var activeModal = null;
  var pendingCallbacks = [];

  function getToolSlug() {
    var meta = document.querySelector('meta[name="tool-id"], meta[name="afrotools:tool-slug"]');
    if (meta && meta.content) return meta.content;
    var parts = window.location.pathname.replace(/\/app\.html$/i, "").replace(/\/index\.html$/i, "").replace(/\/$/, "").split("/").filter(Boolean);
    return parts[parts.length - 1] || "pdf-tool";
  }

  function isPdfToolPage() {
    var slug = getToolSlug();
    return /^pdf-/.test(slug) || [
      "html-to-pdf",
      "cv-builder",
      "invoice-generator",
      "cover-letter-generator",
      "meeting-minutes",
      "receipt-generator",
      "business-plan",
      "freelance-invoice"
    ].indexOf(slug) >= 0;
  }

  function storedUser() {
    try {
      var parsed = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
      return parsed && parsed.id && parsed.email ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  function isRegistered() {
    try {
      if (window.AfroAuth && typeof window.AfroAuth.isLoggedIn === "function" && window.AfroAuth.isLoggedIn()) return true;
      return !!storedUser();
    } catch (err) {
      return !!storedUser();
    }
  }

  function ensureAuth() {
    if (window.AfroAuth && typeof window.AfroAuth.login === "function") return Promise.resolve(window.AfroAuth);
    if (document.getElementById("afro-auth-js")) {
      return waitForAuth();
    }
    return new Promise(function (resolve) {
      var script = document.createElement("script");
      script.id = "afro-auth-js";
      script.src = "/assets/js/afro-auth.js?v=6";
      script.onload = function () { waitForAuth().then(resolve); };
      script.onerror = function () { resolve(window.AfroAuth || null); };
      document.head.appendChild(script);
    });
  }

  function waitForAuth() {
    return new Promise(function (resolve) {
      var attempts = 0;
      (function check() {
        attempts += 1;
        if (window.AfroAuth && typeof window.AfroAuth.login === "function") return resolve(window.AfroAuth);
        if (attempts > 40) return resolve(window.AfroAuth || null);
        setTimeout(check, 100);
      }());
    });
  }

  function injectStyles() {
    if (document.getElementById("pdf-download-gate-css")) return;
    var style = document.createElement("style");
    style.id = "pdf-download-gate-css";
    style.textContent = [
      ".pdg-overlay{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.58);backdrop-filter:blur(5px)}",
      ".pdg-card{width:min(440px,100%);max-height:92vh;overflow:auto;border:1px solid #dbe5f2;border-radius:16px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.28);font-family:'DM Sans',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a}",
      ".pdg-head{padding:24px 24px 10px;text-align:center}",
      ".pdg-kicker{display:inline-flex;align-items:center;justify-content:center;min-height:26px;padding:4px 10px;border-radius:999px;background:#eaf3ff;color:#0f4aa2;font-size:.72rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase}",
      ".pdg-head h2{margin:14px 0 8px;font-size:1.28rem;line-height:1.2;font-weight:900}",
      ".pdg-head p{margin:0;color:#64748b;font-size:.88rem;line-height:1.55}",
      ".pdg-tabs{display:grid;grid-template-columns:1fr 1fr;margin:16px 24px 0;border:1px solid #dbe5f2;border-radius:10px;overflow:hidden}",
      ".pdg-tab{min-height:42px;border:0;background:#f8fafc;color:#64748b;font:inherit;font-size:.84rem;font-weight:900;cursor:pointer}",
      ".pdg-tab.on{background:#0f4aa2;color:#fff}",
      ".pdg-body{padding:18px 24px 24px}",
      ".pdg-field{display:grid;gap:6px;margin-bottom:12px}",
      ".pdg-field label{font-size:.76rem;font-weight:900;color:#475569}",
      ".pdg-field input{min-height:42px;border:1.5px solid #dbe5f2;border-radius:10px;padding:9px 12px;font:inherit;font-size:.92rem;color:#0f172a;background:#fff}",
      ".pdg-field input:focus{outline:0;border-color:#0f6ddf;box-shadow:0 0 0 3px rgba(15,109,223,.12)}",
      ".pdg-error{min-height:18px;margin:2px 0 10px;color:#b91c1c;font-size:.78rem;font-weight:800;text-align:center}",
      ".pdg-primary,.pdg-secondary,.pdg-close{border:0;font:inherit;cursor:pointer}",
      ".pdg-primary{width:100%;min-height:44px;border-radius:10px;background:#0f4aa2;color:#fff;font-size:.9rem;font-weight:900}",
      ".pdg-primary:disabled{background:#94a3b8;cursor:wait}",
      ".pdg-secondary{width:100%;margin-top:10px;background:transparent;color:#0f4aa2;font-size:.8rem;font-weight:900}",
      ".pdg-close{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:8px;background:#f1f5f9;color:#475569;font-size:1.15rem}",
      ".pdg-foot{padding:0 24px 22px;text-align:center;color:#64748b;font-size:.74rem;line-height:1.45}",
      "@media(max-width:520px){.pdg-overlay{align-items:flex-end;padding:0}.pdg-card{border-radius:16px 16px 0 0;border-left:0;border-right:0;border-bottom:0}}"
    ].join("");
    document.head.appendChild(style);
  }

  function closeModal() {
    if (activeModal) activeModal.remove();
    activeModal = null;
    document.body.style.overflow = "";
  }

  function flushCallbacks(user) {
    var callbacks = pendingCallbacks.splice(0);
    callbacks.forEach(function (callback) {
      try { callback(user || storedUser() || true); } catch (err) { setTimeout(function () { throw err; }, 0); }
    });
  }

  function showGate(callback, options) {
    options = options || {};
    if (typeof callback === "function") pendingCallbacks.push(callback);
    if (activeModal) return;
    injectStyles();
    var mode = options.mode || "signup";
    var overlay = document.createElement("div");
    overlay.className = "pdg-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Sign in to download PDF result");
    overlay.innerHTML = [
      '<div class="pdg-card" style="position:relative">',
      '<button class="pdg-close" type="button" aria-label="Close">&times;</button>',
      '<div class="pdg-head">',
      '<span class="pdg-kicker">Free account required</span>',
      '<h2>Sign in to download this result</h2>',
      '<p>PDF tools stay private in your browser. Downloads are available to registered AfroTools users so saved work and repeat exports stay connected to an account.</p>',
      '</div>',
      '<div class="pdg-tabs">',
      '<button class="pdg-tab" type="button" data-mode="signup">Create account</button>',
      '<button class="pdg-tab" type="button" data-mode="login">Sign in</button>',
      '</div>',
      '<form class="pdg-body">',
      '<div class="pdg-field pdg-name-field"><label for="pdgName">Full name</label><input id="pdgName" autocomplete="name" placeholder="Your name"></div>',
      '<div class="pdg-field"><label for="pdgEmail">Email</label><input id="pdgEmail" type="email" autocomplete="email" required placeholder="you@example.com"></div>',
      '<div class="pdg-field"><label for="pdgPassword">Password</label><input id="pdgPassword" type="password" autocomplete="current-password" required placeholder="Minimum 6 characters"></div>',
      '<div class="pdg-error" aria-live="polite"></div>',
      '<button class="pdg-primary" type="submit">Continue to download</button>',
      '<button class="pdg-secondary" type="button" data-check-auth>Already signed in? Continue download</button>',
      '</form>',
      '<div class="pdg-foot">Registered users skip this gate automatically. Guests must create or use an account before generated PDF outputs download.</div>',
      '</div>'
    ].join("");
    activeModal = overlay;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    var form = overlay.querySelector("form");
    var submit = overlay.querySelector(".pdg-primary");
    var error = overlay.querySelector(".pdg-error");
    var nameField = overlay.querySelector(".pdg-name-field");
    var emailInput = overlay.querySelector("#pdgEmail");
    var passwordInput = overlay.querySelector("#pdgPassword");

    function paintMode(nextMode) {
      mode = nextMode;
      overlay.querySelectorAll(".pdg-tab").forEach(function (button) {
        button.classList.toggle("on", button.dataset.mode === mode);
      });
      nameField.style.display = mode === "signup" ? "grid" : "none";
      passwordInput.autocomplete = mode === "signup" ? "new-password" : "current-password";
      submit.textContent = mode === "signup" ? "Create account and download" : "Sign in and download";
      error.textContent = "";
    }

    function finish(user) {
      closeModal();
      try {
        if (window.gtag) window.gtag("event", "pdf_download_gate_passed", { tool_slug: getToolSlug(), gate_version: VERSION });
      } catch (err) {}
      flushCallbacks(user);
    }

    overlay.querySelector(".pdg-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeModal();
    });
    overlay.querySelectorAll(".pdg-tab").forEach(function (button) {
      button.addEventListener("click", function () { paintMode(button.dataset.mode); });
    });
    overlay.querySelector("[data-check-auth]").addEventListener("click", function () {
      if (isRegistered()) finish(storedUser());
      else error.textContent = "You are not signed in on this browser yet.";
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      error.textContent = "";
      var email = (emailInput.value || "").trim().toLowerCase();
      var password = passwordInput.value || "";
      var name = (overlay.querySelector("#pdgName").value || "").trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        error.textContent = "Enter a valid email address.";
        emailInput.focus();
        return;
      }
      if (!password || password.length < 6) {
        error.textContent = "Enter a password with at least 6 characters.";
        passwordInput.focus();
        return;
      }
      if (mode === "signup" && !name) {
        error.textContent = "Enter your name to create the account.";
        overlay.querySelector("#pdgName").focus();
        return;
      }
      submit.disabled = true;
      submit.textContent = mode === "signup" ? "Creating account..." : "Signing in...";
      ensureAuth().then(function (auth) {
        if (!auth || typeof auth.login !== "function") throw new Error("Auth system is still loading. Please try again.");
        return mode === "signup" ? auth.signup(email, name, password, "") : auth.login(email, password);
      }).then(function (result) {
        if (!result || !result.ok) throw new Error(result && result.error || "Authentication failed.");
        finish(result.user);
      }).catch(function (err) {
        error.textContent = err && err.message ? err.message : "Could not sign in. Please try again.";
        submit.disabled = false;
        paintMode(mode);
      });
    });
    document.addEventListener("keydown", function esc(event) {
      if (event.key === "Escape") {
        document.removeEventListener("keydown", esc);
        closeModal();
      }
    });
    paintMode(mode);
    setTimeout(function () { (mode === "signup" ? overlay.querySelector("#pdgName") : emailInput).focus(); }, 60);
  }

  function guard(callback, options) {
    if (isRegistered()) {
      if (typeof callback === "function") callback(storedUser() || true);
      return true;
    }
    showGate(callback, options);
    return false;
  }

  function shouldGateAnchor(anchor) {
    if (!anchor || !anchor.download) return false;
    if (!isPdfToolPage()) return false;
    if (anchor.dataset && anchor.dataset.noPdfGate === "true") return false;
    return true;
  }

  function replayFromSnapshot(snapshot) {
    function clickWithHref(href, cleanup) {
      var link = document.createElement("a");
      link.href = href;
      link.download = snapshot.download || "afrotools-download";
      if (snapshot.target) link.target = snapshot.target;
      link.rel = "noopener";
      document.body.appendChild(link);
      if (allowedAnchors) allowedAnchors.add(link);
      nativeAnchorClick.call(link);
      setTimeout(function () {
        if (allowedAnchors) allowedAnchors.delete(link);
        link.remove();
        if (cleanup) cleanup();
      }, 0);
    }
    if (snapshot.blobPromise) {
      snapshot.blobPromise.then(function (blob) {
        if (blob) {
          var href = URL.createObjectURL(blob);
          clickWithHref(href, function () { setTimeout(function () { URL.revokeObjectURL(href); }, 5000); });
        } else {
          clickWithHref(snapshot.href);
        }
      });
    } else {
      clickWithHref(snapshot.href);
    }
  }

  function snapshotAnchor(anchor) {
    var snapshot = {
      href: anchor.href,
      download: anchor.download,
      target: anchor.target
    };
    if (/^blob:/i.test(snapshot.href)) {
      snapshot.blobPromise = fetch(snapshot.href).then(function (response) {
        return response.ok ? response.blob() : null;
      }).catch(function () { return null; });
    }
    return snapshot;
  }

  function installAnchorGuard() {
    if (!nativeAnchorClick || window.__afroPdfDownloadGateAnchorPatch) return;
    window.__afroPdfDownloadGateAnchorPatch = true;
    window.HTMLAnchorElement.prototype.click = function () {
      if (allowedAnchors && allowedAnchors.has(this)) return nativeAnchorClick.call(this);
      if (shouldGateAnchor(this) && !isRegistered()) {
        var snapshot = snapshotAnchor(this);
        guard(function () { replayFromSnapshot(snapshot); });
        return;
      }
      return nativeAnchorClick.call(this);
    };
    document.addEventListener("click", function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest("a[download]") : null;
      if (!anchor || allowedAnchors && allowedAnchors.has(anchor)) return;
      if (shouldGateAnchor(anchor) && !isRegistered()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var snapshot = snapshotAnchor(anchor);
        guard(function () { replayFromSnapshot(snapshot); });
      }
    }, true);
  }

  function defineCompatibilityElement() {
    if (!window.customElements || window.customElements.get("email-gate-modal")) return;
    window.customElements.define("email-gate-modal", class extends HTMLElement {
      show(callback) {
        return guard(callback, { source: "email-gate-modal" });
      }
    });
  }

  var api = {
    version: VERSION,
    isRegistered: isRegistered,
    guard: guard,
    open: showGate
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.pdfDownloadGate = api;
  window.AfroPdfDownloadGate = api;
  defineCompatibilityElement();
  installAnchorGuard();
}();
