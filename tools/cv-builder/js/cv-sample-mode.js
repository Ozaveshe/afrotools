"use strict";
(function (window, document) {
  var SAMPLE_STATUS = "Synthetic sample loaded. It is fake demo data and is not saved unless you choose Save.";
  var RESET_STATUS = "Blank CV restored. Saved CVs were not deleted.";

  var sampleCv = {
    fn: "Demo-Only Amina",
    ln: "Example",
    title: "Entry Operations Assistant",
    email: "sample.cv@example.test",
    phoneCode: "+254",
    phone: "000 000 000",
    loc: "Demo City, Kenya",
    web: "",
    linkedin: "",
    summary: "This is a clearly synthetic sample CV for testing AfroTools only. It describes a fictional African job seeker so users can preview templates, ATS checks, and exports without pasting private data.",
    exps: [{
      t: "Demo Operations Assistant",
      c: "Example Solar Cooperative (Synthetic)",
      l: "Demo City, Kenya",
      s: "2025-01",
      e: "",
      cur: true,
      d: "Supported a fictional stock-count workflow for a training dashboard.\nPrepared demo-only weekly summaries using spreadsheet and communication tools."
    }],
    edus: [{
      deg: "Diploma in Business Operations",
      sch: "Pan-African Demo College",
      loc: "Demo City",
      y1: "2022",
      y2: "2024",
      g: "Demo pass"
    }],
    projs: [{
      n: "Synthetic Market Desk",
      url: "",
      tech: "Sheets, email templates, stock log",
      d: "Practice project with fake records used only to demonstrate CV sections."
    }],
    showProjs: true,
    skills: {
      h: "Spreadsheet tracking, basic SQL, stock reports",
      s: "Customer communication, teamwork, time management",
      t: "Google Sheets, Excel, Power BI demo dashboards"
    },
    certs: [{
      n: "Demo Workplace Readiness Certificate",
      i: "Example Training Centre",
      y: "2025"
    }],
    langs: [
      { l: "English", lv: "Fluent" },
      { l: "Kiswahili", lv: "Fluent" }
    ],
    refs: [{ n: "", t: "", org: "", p: "", e: "", rel: "" }],
    showRefs: false,
    extras: {
      awards: "",
      hobbies: "Reading public career guides and practising interview answers with fake examples.",
      volunteer: "Demo community noticeboard assistant for a fictional youth group.",
      publications: "",
      memberships: ""
    },
    customSections: [{
      title: "Demo notice",
      content: "This profile is synthetic. Replace every field before applying for a real role."
    }]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function emptyCv() {
    if (typeof window.createEmptyCV === "function") return window.createEmptyCV();
    return {
      fn: "", ln: "", title: "", email: "", phone: "", phoneCode: "+234", loc: "",
      web: "", linkedin: "", summary: "",
      exps: [{ t: "", c: "", l: "", s: "", e: "", cur: false, d: "" }],
      edus: [{ deg: "", sch: "", loc: "", y1: "", y2: "", g: "" }],
      projs: [{ n: "", url: "", tech: "", d: "" }],
      showProjs: false,
      skills: { h: "", s: "", t: "" },
      certs: [{ n: "", i: "", y: "" }],
      langs: [{ l: "", lv: "Fluent" }],
      refs: [{ n: "", t: "", org: "", p: "", e: "", rel: "" }],
      showRefs: true,
      extras: { awards: "", hobbies: "", volunteer: "", publications: "", memberships: "" },
      customSections: []
    };
  }

  function status(message) {
    var node = document.querySelector("[data-cv-sample-status]");
    if (node) node.textContent = message;
  }

  function stopAutosave(state) {
    if (state && state.autoSaveTimer) {
      window.clearTimeout(state.autoSaveTimer);
      state.autoSaveTimer = null;
    }
    if (state) state.dirty = false;
  }

  function render() {
    if (window.CVApp && typeof window.CVApp.renderAll === "function") {
      window.CVApp.renderAll();
    }
    if (window.CVBuilderPolish && typeof window.CVBuilderPolish.updateExportReadiness === "function") {
      window.CVBuilderPolish.updateExportReadiness();
    }
  }

  function scrollToBuilder() {
    var app = document.querySelector(".cv-app");
    if (app && typeof app.scrollIntoView === "function") {
      app.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function safeTrack(source) {
    if (window.CVAnalytics && typeof window.CVAnalytics.track === "function") {
      window.CVAnalytics.track("cv_builder_started", { source: source });
    }
  }

  function loadSample() {
    if (!window.CVApp || typeof window.CVApp.getState !== "function") return false;
    var state = window.CVApp.getState();
    state.data = Object.assign(emptyCv(), clone(sampleCv));
    state.country = "KE";
    state.template = "ats-classic";
    state.currentCVId = null;
    stopAutosave(state);
    render();
    status(SAMPLE_STATUS);
    if (window.CVApp.showToast) window.CVApp.showToast("Synthetic sample loaded. Replace it before applying.");
    safeTrack("sample_cv");
    scrollToBuilder();
    return true;
  }

  function resetBlank() {
    if (!window.CVApp || typeof window.CVApp.getState !== "function") return false;
    var state = window.CVApp.getState();
    state.data = emptyCv();
    state.country = "NG";
    state.template = "ats-classic";
    state.currentCVId = null;
    stopAutosave(state);
    try {
      window.localStorage.removeItem("afro_cv_data");
      window.localStorage.removeItem("afro_cv_sample_mode");
    } catch (err) {}
    render();
    status(RESET_STATUS);
    if (window.CVApp.showToast) window.CVApp.showToast("Blank CV restored. Saved CVs are still available.");
    scrollToBuilder();
    return true;
  }

  function onClick(event) {
    var sampleButton = event.target.closest && event.target.closest("[data-cv-sample]");
    if (sampleButton) {
      event.preventDefault();
      loadSample();
      return;
    }
    var resetButton = event.target.closest && event.target.closest("[data-cv-reset]");
    if (resetButton) {
      event.preventDefault();
      resetBlank();
      return;
    }
    var atsButton = event.target.closest && event.target.closest('[data-action="ats"], [data-proxy-action="ats"]');
    if (atsButton) {
      window.setTimeout(function () {
        var open = document.querySelector("#cv-adv-ats.open");
        if (!open && typeof CVAdvanced !== "undefined" && CVAdvanced && typeof CVAdvanced.runATSSimulator === "function" && window.CVApp && window.CVApp.getState) {
          var state = window.CVApp.getState();
          CVAdvanced.runATSSimulator(state.data || {}, state.country || "NG");
        }
      }, 80);
    }
  }

  function init() {
    document.addEventListener("click", onClick, true);
  }

  window.CVSampleMode = {
    loadSample: loadSample,
    resetBlank: resetBlank,
    getSample: function () { return clone(sampleCv); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);
