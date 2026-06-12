"use strict";
(function (window, document) {
  var activeId = "";

  var starters = {
    graduate: {
      id: "graduate",
      label: "Graduate / No Experience",
      bestFor: "First CVs, internships, NYSC or national-service applications.",
      country: "GH",
      template: "accra-graduate",
      required: ["personal", "summary", "edu", "skills", "projs", "langs"],
      support: ["certs", "extras", "refs"],
      open: ["personal", "summary", "edu", "skills", "projs", "langs"],
      toggles: { showProjs: true, showRefs: false },
      guidance: {
        summary: "Write a short objective around the role you want, your field of study, practical strengths, and honest availability. Do not invent experience.",
        edu: "Lead with education, relevant coursework, grades where useful, national service, and training that supports the target role.",
        skills: "Group proven tools, communication strengths, languages, and workplace basics. Keep every skill defensible.",
        projs: "Use school, volunteer, capstone, portfolio, or community projects as evidence only when you actually did the work.",
        extras: "Add volunteering, awards, or interests only when they support reliability, leadership, or role fit."
      }
    },
    professional: {
      id: "professional",
      label: "Professional",
      bestFor: "Mid-career roles where recent work proof matters most.",
      country: "NG",
      template: "lagos-corporate",
      required: ["personal", "summary", "exp", "skills", "edu"],
      support: ["certs", "langs", "refs"],
      open: ["personal", "summary", "exp", "skills", "edu"],
      toggles: { showProjs: false, showRefs: true },
      guidance: {
        summary: "Summarize your current function, years or scope, strongest tools, and the role you are targeting.",
        exp: "Put recent roles first. Use bullets with action, tool or method, scope, and measurable result where you have proof.",
        skills: "Prioritize skills that match the vacancy and appear in your experience or certifications.",
        certs: "Add licenses, professional memberships, and short courses that strengthen credibility for the target role."
      }
    },
    tech: {
      id: "tech",
      label: "Tech / Developer",
      bestFor: "Developers, data, product, QA, cloud, and support roles.",
      country: "KE",
      template: "nairobi-tech",
      required: ["personal", "summary", "skills", "projs", "exp", "edu"],
      support: ["certs", "langs"],
      open: ["personal", "summary", "skills", "projs", "exp"],
      toggles: { showProjs: true, showRefs: false },
      guidance: {
        summary: "Name your target tech lane, strongest stack, product domain, and the kind of problems you can prove you have solved.",
        skills: "Separate languages, frameworks, tools, cloud, data, testing, and workflow tools so recruiters can scan fast.",
        projs: "Include deployed links, GitHub, dashboards, APIs, automations, or technical case studies you can discuss in an interview.",
        exp: "For each role or internship, show what you built, debugged, shipped, supported, or improved."
      }
    },
    government: {
      id: "government",
      label: "Government / NGO",
      bestFor: "Public service, NGO, donor, M&E, and programme roles.",
      country: "NG",
      template: "ngo-development",
      required: ["personal", "summary", "exp", "edu", "skills", "langs", "refs"],
      support: ["certs", "extras", "country"],
      open: ["personal", "summary", "exp", "edu", "skills", "langs", "refs"],
      toggles: { showProjs: false, showRefs: true },
      guidance: {
        summary: "Use a formal profile focused on sector, stakeholders, reporting, field work, policy, research, or programme support you can evidence.",
        exp: "Emphasize responsibilities, project scope, donor or public-sector reporting, field locations, and outcomes without exaggeration.",
        langs: "Language ability can matter for field work and regional programmes. State honest proficiency.",
        refs: "Prepare references carefully. Add full contact details only when you are ready to share them."
      }
    },
    diaspora: {
      id: "diaspora",
      label: "Diaspora / International",
      bestFor: "Remote, relocation, scholarship, and international applications.",
      country: "INTL",
      template: "diaspora-international",
      required: ["personal", "summary", "exp", "skills", "edu", "langs"],
      support: ["certs", "projs"],
      open: ["personal", "summary", "exp", "skills", "edu", "langs"],
      toggles: { showProjs: true, showRefs: false, showPhoto: false, sp: false },
      guidance: {
        personal: "Keep contact details international and professional. Avoid sensitive personal details unless the target process explicitly asks.",
        summary: "Translate local achievements into portable evidence: scope, tools, sectors, customers, budgets, risk, or delivery outcomes.",
        edu: "Clarify qualification names and add useful equivalence notes only when you know they are accurate.",
        refs: "For international roles, keep references available on request unless the employer asks for full details."
      }
    },
    trade: {
      id: "trade",
      label: "Trade / Apprenticeship",
      bestFor: "Artisans, technicians, apprentices, drivers, and skilled trades.",
      country: "ZA",
      template: "ats-classic",
      required: ["personal", "summary", "skills", "exp", "certs", "refs"],
      support: ["edu", "langs", "extras"],
      open: ["personal", "summary", "skills", "exp", "certs", "refs"],
      toggles: { showProjs: false, showRefs: true },
      guidance: {
        summary: "Lead with trade area, training level, safety awareness, tools handled, and the kind of site or workshop work you can prove.",
        skills: "List tools, machines, safety practices, driving classes, measurements, installation, maintenance, or customer-facing skills honestly.",
        exp: "Apprenticeships, attachments, casual jobs, family business work, and site practice can count when clearly described as such.",
        certs: "Trade tests, licences, safety training, driving permits, and equipment certificates should be easy to find.",
        refs: "Trade roles often rely on supervisors, trainers, or clients. Share full details only when appropriate."
      }
    }
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    if (window.CVApp && typeof window.CVApp.esc === "function") return window.CVApp.esc(value || "");
    var div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
  }

  function getStarter(id) {
    return starters[id] || starters.professional;
  }

  function scrollToBuilder() {
    var app = qs(".cv-app");
    if (!app) return;
    var header = qs(".cv-product-header");
    var offset = header ? header.getBoundingClientRect().height + 12 : 12;
    var top = app.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function setTemplateAndCountry(starter) {
    if (!window.CVApp || typeof window.CVApp.getState !== "function") return;
    var state = window.CVApp.getState();
    if (typeof window.CVApp.setTopState === "function") {
      window.CVApp.setTopState("country", starter.country);
      window.CVApp.setTopState("template", starter.template);
    } else {
      state.country = starter.country;
      state.template = starter.template;
    }
    Object.keys(starter.toggles || {}).forEach(function (key) {
      if (state.data && key in state.data) state.data[key] = starter.toggles[key];
    });
    if (state.colOpen) {
      Object.keys(state.colOpen).forEach(function (key) {
        state.colOpen[key] = starter.open.indexOf(key) >= 0 || starter.open.indexOf(key === "country" ? "nysc" : key) >= 0;
      });
      starter.open.forEach(function (id) {
        state.colOpen[id === "country" ? "nysc" : id] = true;
      });
    }
    if (typeof window.CVApp.renderAll === "function") window.CVApp.renderAll();
  }

  function updateCards() {
    qsa("[data-cv-preset]").forEach(function (card) {
      var isActive = card.dataset.cvPreset === activeId;
      card.classList.toggle("is-active", isActive);
      if (isActive) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
    });
  }

  function panelHtml(starter) {
    var required = starter.required.map(function (id) { return sectionLabel(id); }).join(", ");
    var support = starter.support.map(function (id) { return sectionLabel(id); }).join(", ");
    return [
      '<div class="cv-starter-guidance-panel" data-cv-starter-panel data-starter-id="' + esc(starter.id) + '" tabindex="-1">',
      "<strong>" + esc(starter.label) + " starter</strong>",
      "<p><b>Best for:</b> " + esc(starter.bestFor) + "</p>",
      "<ul>",
      "<li>Recommended template: " + esc(templateName(starter.template)) + ".</li>",
      "<li>Recommended country mode: " + esc(countryName(starter.country)) + ".</li>",
      "<li>Focus first: " + esc(required) + ".</li>",
      "<li>Support with: " + esc(support) + " when you have real evidence.</li>",
      "</ul>",
      "</div>"
    ].join("");
  }

  function sectionLabel(id) {
    return ({
      personal: "personal details",
      summary: "summary",
      exp: "experience",
      edu: "education",
      skills: "skills",
      certs: "certifications",
      projs: "projects",
      langs: "languages",
      refs: "references",
      country: "country-specific details",
      extras: "awards and volunteering"
    })[id] || id;
  }

  function templateName(id) {
    var registry = window.CVTemplateRegistry || (typeof CVTemplateRegistry !== "undefined" ? CVTemplateRegistry : null);
    if (registry && registry.get) {
      var template = registry.get(id);
      if (template && template.name) return template.name;
    }
    return id;
  }

  function countryName(code) {
    var norms = window.COUNTRY_NORMS || (typeof COUNTRY_NORMS !== "undefined" ? COUNTRY_NORMS : null);
    if (norms && norms[code]) return norms[code].n;
    var option = qs('.cv-country-sel option[value="' + code + '"]');
    if (option && option.textContent) return option.textContent.replace(/^[^\s]+\s+/, "").trim() || code;
    return code === "INTL" ? "International" : code;
  }

  function sectionNode(id) {
    var target = id === "country" ? "nysc" : id;
    return qs('.cv-section[data-section="' + target + '"]');
  }

  function updateGuidance(starter) {
    qsa(".cv-section").forEach(function (section) {
      section.classList.remove("cv-starter-priority", "cv-starter-support");
    });
    starter.required.forEach(function (id) {
      var node = sectionNode(id);
      if (node) node.classList.add("cv-starter-priority");
    });
    starter.support.forEach(function (id) {
      var node = sectionNode(id);
      if (node) node.classList.add("cv-starter-support");
    });
    Object.keys(starter.guidance || {}).forEach(function (id) {
      var node = sectionNode(id);
      var guidance = node && qs(".cv-section-guidance p", node);
      if (guidance) guidance.textContent = starter.guidance[id];
    });
    var form = qs(".cv-form-inner");
    if (form) {
      var existing = qs("[data-cv-starter-panel]", form);
      if (!existing || existing.dataset.starterId !== starter.id) {
        if (existing) existing.remove();
        form.insertAdjacentHTML("afterbegin", panelHtml(starter));
      }
    }
    var progress = qs(".cv-workspace-progress-note");
    if (progress) {
      progress.textContent = starter.label + ": focus on " + starter.required.map(sectionLabel).join(", ") + ". Add support sections only with real evidence.";
    }
  }

  function safeTrack(starter) {
    if (window.CVAnalytics && typeof window.CVAnalytics.track === "function") {
      window.CVAnalytics.track("cv_builder_started", {
        source: "starter_" + starter.id,
        country_code: starter.country,
        template_id: starter.template
      });
    }
  }

  function applyStarter(id, options) {
    var starter = getStarter(id);
    activeId = starter.id;
    try { window.sessionStorage.setItem("afro_cv_starter_path", activeId); } catch (err) {}
    setTemplateAndCountry(starter);
    updateCards();
    updateGuidance(starter);
    if (window.CVCareerCopilot && typeof window.CVCareerCopilot.render === "function") window.CVCareerCopilot.render();
    if (!options || !options.silent) safeTrack(starter);
    if (window.CVApp && typeof window.CVApp.showToast === "function") {
      window.CVApp.showToast(starter.label + " starter applied. Fill the sections with your own real evidence.");
    }
    if (!options || !options.noScroll) scrollToBuilder();
    return starter;
  }

  function restore() {
    var stored = "";
    try { stored = window.sessionStorage.getItem("afro_cv_starter_path") || ""; } catch (err) {}
    if (stored && starters[stored]) {
      activeId = stored;
      updateCards();
      updateGuidance(starters[stored]);
    }
  }

  function onClick(event) {
    var card = event.target.closest && event.target.closest("[data-cv-preset]");
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    if (!window.CVApp) {
      scrollToBuilder();
      return;
    }
    applyStarter(card.dataset.cvPreset);
  }

  function init() {
    document.addEventListener("click", onClick, true);
    var waitCount = 0;
    var timer = window.setInterval(function () {
      waitCount += 1;
      if (window.CVApp && qs(".cv-form-inner")) {
        window.clearInterval(timer);
        restore();
      } else if (waitCount > 60) {
        window.clearInterval(timer);
      }
    }, 150);
    if (window.MutationObserver) {
      var pending = null;
      var observer = new MutationObserver(function () {
        if (!activeId || !starters[activeId]) return;
        window.clearTimeout(pending);
        pending = window.setTimeout(function () {
          updateGuidance(starters[activeId]);
        }, 40);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  window.CVStarterPaths = {
    applyStarter: applyStarter,
    getActive: function () { return activeId ? getStarter(activeId) : null; },
    getStarters: function () {
      return Object.keys(starters).map(function (key) { return Object.assign({}, starters[key]); });
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);
