!function() {
  "use strict";
  function e(e) {
    return "apo_journey_" + e;
  }
  function t(e, t, o) {
    var r = e.JOURNEYS[t];
    return r && r.steps ? r.steps.filter(function(t) {
      return e.stepAppliesToCountry(t, o);
    }) : [];
  }
  var o = {
    id: "afropayroll-os",
    version: "1.0.1",
    JOURNEYS: {
      "new-hire": {
        label: "New Hire Checklist",
        labelFr: "Checklist Nouvelle Embauche",
        icon: "👤",
        audience: "employer",
        color: "#1D4ED8",
        desc: "Hire compliantly from offer to first payslip",
        steps: [ {
          toolId: "minimum-wage",
          label: "Check Minimum Wage",
          desc: "Confirm the salary you're offering meets the legal floor in this country and sector.",
          required: !0
        }, {
          toolId: "staff-cost",
          label: "Calculate Total Staff Cost",
          desc: "Understand the true monthly cost to the business — salary + all statutory employer contributions.",
          required: !0
        }, {
          toolId: "doc-generator",
          label: "Generate Offer Letter",
          desc: "Create a legally compliant offer letter with all mandatory clauses for this country.",
          required: !1,
          docType: "offer-letter"
        }, {
          toolId: "payslip-generator",
          label: "Set Up First Payslip",
          desc: "Configure the payslip template — PAYE, pension, social security all pre-mapped.",
          required: !0
        }, {
          toolId: "pension-proj",
          label: "Set Up Pension",
          desc: "Know the pension obligation and register correctly. Country-specific schemes auto-selected.",
          required: !0,
          countryVariants: {
            NG: "ng-pension",
            KE: "ke-nssf",
            GH: "gh-ssnit",
            ZA: "za-gepf"
          }
        }, {
          toolId: "social-security",
          label: "Register Social Security",
          desc: "Know the full employer + employee contribution picture before the first remittance date.",
          required: !0
        }, {
          toolId: "compliance-calendar",
          label: "Set Compliance Alerts",
          desc: "Never miss a PAYE, pension, or social security filing deadline again.",
          required: !1
        } ]
      },
      "new-job": {
        label: "New Job Evaluation",
        labelFr: "Évaluation Nouvelle Offre",
        icon: "💼",
        audience: "employee",
        color: "#059669",
        desc: "Evaluate any offer before you sign",
        steps: [ {
          toolId: "job-offer-evaluator",
          label: "Evaluate the Offer",
          desc: "Score the total package — salary, benefits, equity, growth. Is it really a good deal?",
          required: !0
        }, {
          toolId: "minimum-wage",
          label: "Check Minimum Wage",
          desc: "Confirm the offer meets the legal minimum. Non-negotiable — don't accept below this.",
          required: !1
        }, {
          toolId: "salary-compare",
          label: "Benchmark vs Market",
          desc: "See how this offer compares to what others in your role and city are earning.",
          required: !1
        }, {
          toolId: "leave-calculator",
          label: "Check Leave Entitlements",
          desc: "Know your statutory annual leave, sick leave, and maternity/paternity rights.",
          required: !1
        }, {
          toolId: "pension-proj",
          label: "Understand Pension Deductions",
          desc: "Project your pension pot over time — what will you actually accumulate?",
          required: !1,
          countryVariants: {
            NG: "ng-pension",
            KE: "ke-nssf",
            GH: "gh-ssnit",
            ZA: "za-gepf"
          }
        }, {
          toolId: "regulatory-alerts",
          label: "Set Pay Change Alerts",
          desc: "Get notified if minimum wage or tax rates change and affect your take-home.",
          required: !1
        } ]
      },
      expansion: {
        label: "Expansion Cost Planner",
        labelFr: "Planificateur d'Expansion",
        icon: "🌍",
        audience: "employer",
        color: "#7C3AED",
        desc: "Compare hiring costs across African markets",
        steps: [ {
          toolId: "staff-cost",
          label: "Compare Staff Costs by Country",
          desc: "Run the full employer cost calculation for each target market side by side.",
          required: !0
        }, {
          toolId: "minimum-wage",
          label: "Check Minimum Wages",
          desc: "Know the salary floor in each market before you budget.",
          required: !0
        }, {
          toolId: "social-security",
          label: "Review Employer Contributions",
          desc: "Employer social security rates vary 5–20%+ across Africa — model this accurately.",
          required: !0
        }, {
          toolId: "compliance-calendar",
          label: "Review Filing Deadlines",
          desc: "Know what you'll need to file and when in each country from day one.",
          required: !0
        }, {
          toolId: "doc-generator",
          label: "Generate Country Contracts",
          desc: "Country-specific employment contracts with all mandatory clauses.",
          required: !1,
          docType: "employment-contract"
        }, {
          toolId: "labour-law-advisor",
          label: "Get Labour Law Briefing",
          desc: "AI-powered briefing on the key things to know before hiring in each target country.",
          required: !1
        } ]
      },
      offboarding: {
        label: "Separation & Offboarding",
        labelFr: "Séparation et Départ",
        icon: "🚪",
        audience: "employer",
        color: "#DC2626",
        desc: "Exit employees compliantly, every time",
        steps: [ {
          toolId: "leave-calculator",
          label: "Check Notice Period",
          desc: "Calculate the statutory minimum notice period for this employee's tenure and contract type.",
          required: !0
        }, {
          toolId: "leave-calculator",
          label: "Calculate Leave Encashment",
          desc: "Calculate unused annual leave owed at exit — mandatory in most African jurisdictions.",
          required: !0
        }, {
          toolId: "za-uif",
          label: "Calculate UIF / Social Security Exit",
          desc: "Final social security obligations and UIF benefit eligibility (South Africa).",
          required: !1,
          countryRestricted: [ "ZA" ]
        }, {
          toolId: "doc-generator",
          label: "Generate Termination Letter",
          desc: "Legally compliant termination letter — correct structure protects you from disputes.",
          required: !0,
          docType: "termination-letter"
        }, {
          toolId: "payslip-generator",
          label: "Generate Final Payslip",
          desc: "Pro-rated final salary, leave encashment, and all statutory deductions correctly calculated.",
          required: !0
        }, {
          toolId: "labour-law-advisor",
          label: "Review Compliance",
          desc: "AI check: are you following correct procedure? Avoid wrongful dismissal exposure.",
          required: !1
        } ]
      }
    },
    TOOL_PATHS: {
      "minimum-wage": "/tools/minimum-wage/",
      "staff-cost": "/tools/staff-cost/",
      "doc-generator": "/tools/doc-generator/",
      "payslip-generator": "/tools/payslip-generator/",
      "ng-pension": "/tools/ng-pension/",
      "ke-nssf": "/tools/ke-nssf/",
      "gh-ssnit": "/tools/gh-ssnit/",
      "za-gepf": "/tools/za-gepf/",
      "pension-proj": "/tools/pension-proj/",
      "social-security": "/tools/social-security/",
      "compliance-calendar": "/tools/compliance-calendar/",
      "job-offer-evaluator": "/tools/job-offer-evaluator/",
      "salary-compare": "/tools/salary-compare/",
      "leave-calculator": "/tools/leave-calculator/",
      "regulatory-alerts": "/tools/regulatory-alerts/",
      "za-uif": "/tools/za-uif/",
      "labour-law-advisor": "/tools/labour-law-advisor/"
    },
    getToolForCountry: function(e, t) {
      return e.countryVariants && t && e.countryVariants[t] ? e.countryVariants[t] : e.toolId;
    },
    stepAppliesToCountry: function(e, t) {
      return !e.countryRestricted || !t || -1 !== e.countryRestricted.indexOf(t);
    },
    getToolPath: function(e) {
      return this.TOOL_PATHS[e] || "/tools/" + e + "/";
    },
    buildPreFillUrl: function(e, t) {
      var o = this.getToolPath(e), r = [], a = t || {};
      return a.country && r.push("country=" + encodeURIComponent(a.country)), a.salary && r.push("salary=" + encodeURIComponent(a.salary)),
      a.currency && r.push("currency=" + encodeURIComponent(a.currency)), a.role && r.push("role=" + encodeURIComponent(a.role)),
      a.sector && r.push("sector=" + encodeURIComponent(a.sector)), a.docType && r.push("docType=" + encodeURIComponent(a.docType)),
      r.length ? o + "?" + r.join("&") : o;
    },
    setPreFill: function(e) {
      try {
        localStorage.setItem("apo_prefill", JSON.stringify(e));
      } catch (e) {}
    },
    getPreFill: function() {
      try {
        return JSON.parse(localStorage.getItem("apo_prefill") || "{}");
      } catch (e) {
        return {};
      }
    },
    clearPreFill: function() {
      try {
        localStorage.removeItem("apo_prefill");
      } catch (e) {}
    },
    saveProgress: function(t, o, r, a, n) {
      try {
        var l = e(t), s = JSON.parse(localStorage.getItem(l) || "{}"), i = n || {};
        s.currentStep = o, s.country = a || s.country, s.carryData = Object.assign({}, s.carryData || {}, r || {}),
        "number" == typeof i.totalSteps && (s.totalSteps = i.totalSteps), Array.isArray(i.stepStatuses) && (s.stepStatuses = i.stepStatuses.slice()),
        s.updatedAt = Date.now(), localStorage.setItem(l, JSON.stringify(s));
      } catch (e) {}
    },
    loadProgress: function(t) {
      try {
        return JSON.parse(localStorage.getItem(e(t)) || "{}");
      } catch (e) {
        return {};
      }
    },
    clearProgress: function(t) {
      try {
        localStorage.removeItem(e(t));
      } catch (e) {}
    },
    getIncompleteJourneys: function() {
      var e = [], o = this;
      return Object.keys(this.JOURNEYS).forEach(function(r) {
        var a = o.loadProgress(r);
        if (a && void 0 !== a.currentStep && a.updatedAt) {
          var n = t(o, r, a.country), l = "number" == typeof a.totalSteps ? a.totalSteps : n.length;
          if (!(a.currentStep >= l)) {
            var s = o.JOURNEYS[r];
            e.push({
              id: r,
              label: s.label,
              icon: s.icon,
              currentStep: a.currentStep,
              totalSteps: l,
              updatedAt: a.updatedAt
            });
          }
        }
      }), e;
    },
    loadProgressFromSupabase: async function(e, t) {
      try {
        var o = window.AfroAuth && window.AfroAuth.getSupabase ? window.AfroAuth.getSupabase() : null;
        if (!o || !t) {
          return null;
        }
        var r = await o.from("apo_workflows").select("country, current_step, total_steps, carry_data, step_statuses, updated_at").eq("user_id", t).eq("journey_type", e).maybeSingle(), a = r && r.data;
        return a ? {
          country: a.country || "",
          currentStep: "number" == typeof a.current_step ? a.current_step : 0,
          totalSteps: "number" == typeof a.total_steps ? a.total_steps : 0,
          carryData: a.carry_data || {},
          stepStatuses: Array.isArray(a.step_statuses) ? a.step_statuses : [],
          updatedAt: a.updated_at ? new Date(a.updated_at).getTime() : Date.now()
        } : null;
      } catch (e) {
        return null;
      }
    },
    getIncompleteJourneysFromSupabase: async function(e) {
      try {
        var t = window.AfroAuth && window.AfroAuth.getSupabase ? window.AfroAuth.getSupabase() : null;
        if (!t || !e) {
          return [];
        }
        var o = await t.from("apo_workflows").select("journey_type, current_step, total_steps, updated_at, status").eq("user_id", e).neq("status", "complete").order("updated_at", {
          ascending: !1
        }), r = o && o.data ? o.data : [], a = this;
        return r.filter(function(e) {
          return a.JOURNEYS[e.journey_type];
        }).map(function(e) {
          var t = a.JOURNEYS[e.journey_type];
          return {
            id: e.journey_type,
            label: t.label,
            icon: t.icon,
            currentStep: "number" == typeof e.current_step ? e.current_step : 0,
            totalSteps: "number" == typeof e.total_steps ? e.total_steps : 0,
            updatedAt: e.updated_at ? new Date(e.updated_at).getTime() : Date.now()
          };
        });
      } catch (e) {
        return [];
      }
    },
    syncToSupabase: async function(e, o, r) {
      try {
        var a = window.AfroAuth && window.AfroAuth.getSupabase ? window.AfroAuth.getSupabase() : null;
        if (!a || !o) {
          return;
        }
        var n = r || this.loadProgress(e), l = "number" == typeof n.totalSteps ? n.totalSteps : t(this, e, n.country).length, s = "number" == typeof n.currentStep ? n.currentStep : 0, i = Array.isArray(n.stepStatuses) ? n.stepStatuses : [], c = n.carryData || {}, u = l > 0 && s >= l;
        await a.from("apo_workflows").upsert({
          user_id: o,
          journey_type: e,
          country: n.country || null,
          current_step: s,
          total_steps: l,
          carry_data: c,
          step_statuses: i,
          last_completed_at: u ? (new Date).toISOString() : null,
          status: u ? "complete" : "in-progress",
          updated_at: (new Date).toISOString()
        }, {
          onConflict: "user_id,journey_type"
        });
      } catch (e) {}
    }
  };
  window.AfroTools = window.AfroTools || {}, window.AfroTools.engines = window.AfroTools.engines || {},
  window.AfroTools.engines.afropayrollOs = o;
}();
