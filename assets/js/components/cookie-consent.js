!function () {
  "use strict";

  var key = "afrotools_cookie_consent";
  var consent = null;

  try {
    consent = localStorage.getItem(key);
  } catch (err) {}

  if (consent === "accepted" || consent === "declined") {
    if (consent === "declined") disableAnalytics();
    return;
  }

  var lang = (document.documentElement.lang || "en").substring(0, 2);
  var copy = {
    msg: {
      fr: "AfroTools utilise des cookies pour l'analyse et la sauvegarde de vos preferences.",
      sw: "AfroTools inatumia kuki kwa uchambuzi na kuhifadhi mapendeleo yako."
    },
    accept: { fr: "Accepter", sw: "Kubali" },
    privacy: { fr: "Politique de confidentialite", sw: "Sera ya Faragha" },
    dismiss: { fr: "Fermer", sw: "Funga" }
  };
  var t = function (name) {
    return copy[name] && copy[name][lang] ? copy[name][lang] : null;
  };

  var style = document.createElement("style");
  style.id = "afro-cookie-consent-style";
  style.textContent = ""
    + "#afro-cookie-consent{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));z-index:99999;max-width:720px;margin:0 auto;background:#111827;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:12px;font-family:'DM Sans',system-ui,sans-serif;box-shadow:0 18px 48px rgba(15,23,42,.24);transition:transform .4s cubic-bezier(.16,1,.3,1);transform:translateY(calc(100% + 28px))}"
    + "#afro-cookie-consent .afro-cc-inner{display:flex;align-items:center;gap:12px}"
    + "#afro-cookie-consent p{flex:1;margin:0;min-width:180px;color:#d1d5db;font-size:13px;line-height:1.45}"
    + "#afro-cookie-consent .afro-cc-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}"
    + "#afro-cookie-consent button,#afro-cookie-consent a{font-family:inherit}"
    + "#afro-cc-accept{min-height:40px;padding:0 16px;background:#0062cc;color:#fff;border:0;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer}"
    + "#afro-cc-learn{align-items:center;color:#c5cedb;display:flex;font-size:13px;font-weight:700;min-height:40px;padding:0 10px;text-decoration:none}"
    + "#afro-cc-close{align-items:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#c5cedb;cursor:pointer;display:inline-flex;font-size:20px;height:40px;justify-content:center;line-height:1;padding:0;width:40px}"
    + "#afro-cc-accept:hover{background:#004fa3}"
    + "#afro-cc-learn:hover,#afro-cc-close:hover{color:#fff}"
    + "@media(max-width:560px){#afro-cookie-consent{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));border-radius:14px;padding:10px}#afro-cookie-consent .afro-cc-inner{display:grid;gap:9px}#afro-cookie-consent p{font-size:12.5px;line-height:1.42;min-width:0}#afro-cookie-consent .afro-cc-actions{display:flex!important;flex-wrap:nowrap;gap:7px;min-width:0}#afro-cookie-consent #afro-cc-accept,#afro-cookie-consent #afro-cc-learn{flex:1 1 0;font-size:12.5px;justify-content:center;min-height:38px;min-width:0;padding:0 8px;width:auto!important}#afro-cookie-consent #afro-cc-close{flex:0 0 38px;height:38px;width:38px!important}}";
  document.head.appendChild(style);

  var banner = document.createElement("div");
  banner.id = "afro-cookie-consent";
  banner.setAttribute("role", "dialog");
  banner.setAttribute(
    "aria-label",
    lang === "fr" ? "Consentement aux cookies" : lang === "sw" ? "Idhini ya kuki" : "Cookie consent"
  );
  banner.innerHTML = '<div class="afro-cc-inner">'
    + '<p>' + (t("msg") || "AfroTools uses cookies for analytics and saving your preferences.") + '</p>'
    + '<div class="afro-cc-actions">'
    + '<button id="afro-cc-accept" type="button">' + (t("accept") || "Accept") + '</button>'
    + '<a href="/privacy/" id="afro-cc-learn">' + (t("privacy") || "Privacy Policy") + '</a>'
    + '<button id="afro-cc-close" type="button" aria-label="' + (t("dismiss") || "Dismiss") + '">&times;</button>'
    + '</div></div>';

  document.body.appendChild(banner);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      banner.style.transform = "translateY(0)";
    });
  });

  document.getElementById("afro-cc-accept").addEventListener("click", function () {
    save("accepted");
    close();
  });
  document.getElementById("afro-cc-close").addEventListener("click", function () {
    save("declined");
    disableAnalytics();
    close();
  });

  function save(value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {}
  }

  function close() {
    banner.style.transform = "translateY(calc(100% + 28px))";
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
      if (style.parentNode) style.parentNode.removeChild(style);
    }, 500);
  }

  function disableAnalytics() {
    window["ga-disable-G-D859CGF391"] = true;
  }
}();
