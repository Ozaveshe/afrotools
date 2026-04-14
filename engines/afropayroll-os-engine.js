!function () {
  "use strict";

  function getJourneyStorageKey(journeyId) {
    return "apo_journey_" + journeyId;
  }

  function getFilteredSteps(engine, journeyId, country) {
    var journey = engine.JOURNEYS[journeyId];
    if (!journey || !journey.steps) return [];
    return journey.steps.filter(function (step) {
      return engine.stepAppliesToCountry(step, country);
    });
  }

  var engine = {
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
        steps: [
          { toolId: "minimum-wage", label: "Check Minimum Wage", desc: "Confirm the salary you're offering meets the legal floor in this country and sector.", required: true },
          { toolId: "staff-cost", label: "Calculate Total Staff Cost", desc: "Understand the true monthly cost to the business — salary + all statutory employer contributions.", required: true },
          { toolId: "doc-generator", label: "Generate Offer Letter", desc: "Create a legally compliant offer letter with all mandatory clauses for this country.", required: false, docType: "offer-letter" },
          { toolId: "payslip-generator", label: "Set Up First Payslip", desc: "Configure the payslip template — PAYE, pension, social security all pre-mapped.", required: true },
          {
            toolId: "pension-proj",
            label: "Set Up Pension",
            desc: "Know the pension obligation and register correctly. Country-specific schemes auto-selected.",
            required: true,
            countryVariants: { NG: "ng-pension", KE: "ke-nssf", GH: "gh-ssnit", ZA: "za-gepf" }
          },
          { toolId: "social-security", label: "Register Social Security", desc: "Know the full employer + employee contribution picture before the first remittance date.", required: true },
          { toolId: "compliance-calendar", label: "Set Compliance Alerts", desc: "Never miss a PAYE, pension, or social security filing deadline again.", required: false }
        ]
      },
      "new-job": {
        label: "New Job Evaluation",
        labelFr: "Évaluation Nouvelle Offre",
        icon: "💼",
        audience: "employee",
        color: "#059669",
        desc: "Evaluate any offer before you sign",
        steps: [
          { toolId: "job-offer-evaluator", label: "Evaluate the Offer", desc: "Score the total package — salary, benefits, equity, growth. Is it really a good deal?", required: true },
          { toolId: "minimum-wage", label: "Check Minimum Wage", desc: "Confirm the offer meets the legal minimum. Non-negotiable — don't accept below this.", required: false },
          { toolId: "salary-compare", label: "Benchmark vs Market", desc: "See how this offer compares to what others in your role and city are earning.", required: false },
          { toolId: "leave-calculator", label: "Check Leave Entitlements", desc: "Know your statutory annual leave, sick leave, and maternity/paternity rights.", required: false },
          {
            toolId: "pension-proj",
            label: "Understand Pension Deductions",
            desc: "Project your pension pot over time — what will you actually accumulate?",
            required: false,
            countryVariants: { NG: "ng-pension", KE: "ke-nssf", GH: "gh-ssnit", ZA: "za-gepf" }
          },
          { toolId: "regulatory-alerts", label: "Set Pay Change Alerts", desc: "Get notified if minimum wage or tax rates change and affect your take-home.", required: false }
        ]
      },
      expansion: {
        label: "Expansion Cost Planner",
        labelFr: "Planificateur d'Expansion",
        icon: "🌍",
        audience: "employer",
        color: "#7C3AED",
        desc: "Compare hiring costs across African markets",
        steps: [
          { toolId: "staff-cost", label: "Compare Staff Costs by Country", desc: "Run the full employer cost calculation for each target market side by side.", required: true },
          { toolId: "minimum-wage", label: "Check Minimum Wages", desc: "Know the salary floor in each market before you budget.", required: true },
          { toolId: "social-security", label: "Review Employer Contributions", desc: "Employer social security rates vary 5–20%+ across Africa — model this accurately.", required: true },
          { toolId: "compliance-calendar", label: "Review Filing Deadlines", desc: "Know what you'll need to file and when in each country from day one.", required: true },
          { toolId: "doc-generator", label: "Generate Country Contracts", desc: "Country-specific employment contracts with all mandatory clauses.", required: false, docType: "employment-contract" },
          { toolId: "labour-law-advisor", label: "Get Labour Law Briefing", desc: "AI-powered briefing on the key things to know before hiring in each target country.", required: false }
        ]
      },
      offboarding: {
        label: "Separation & Offboarding",
        labelFr: "Séparation et Départ",
        icon: "🚪",
        audience: "employer",
        color: "#DC2626",
        desc: "Exit employees compliantly, every time",
        steps: [
          { toolId: "leave-calculator", label: "Check Notice Period", desc: "Calculate the statutory minimum notice period for this employee's tenure and contract type.", required: true },
          { toolId: "leave-calculator", label: "Calculate Leave Encashment", desc: "Calculate unused annual leave owed at exit — mandatory in most African jurisdictions.", required: true },
          { toolId: "za-uif", label: "Calculate UIF / Social Security Exit", desc: "Final social security obligations and UIF benefit eligibility (South Africa).", required: false, countryRestricted: ["ZA"] },
          { toolId: "doc-generator", label: "Generate Termination Letter", desc: "Legally compliant termination letter — correct structure protects you from disputes.", required: true, docType: "termination-letter" },
          { toolId: "payslip-generator", label: "Generate Final Payslip", desc: "Pro-rated final salary, leave encashment, and all statutory deductions correctly calculated.", required: true },
          { toolId: "labour-law-advisor", label: "Review Compliance", desc: "AI check: are you following correct procedure? Avoid wrongful dismissal exposure.", required: false }
        ]
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
    getToolForCountry: function (step, country) {
      return step.countryVariants && country && step.countryVariants[country] ? step.countryVariants[country] : step.toolId;
    },
    stepAppliesToCountry: function (step, country) {
      return !step.countryRestricted || !country || step.countryRestricted.indexOf(country) !== -1;
    },
    getToolPath: function (toolId) {
      return this.TOOL_PATHS[toolId] || "/tools/" + toolId + "/";
    },
    buildPreFillUrl: function (toolId, data) {
      var toolPath = this.getToolPath(toolId);
      var params = [];
      var prefill = data || {};

      if (prefill.country) params.push("country=" + encodeURIComponent(prefill.country));
      if (prefill.salary) params.push("salary=" + encodeURIComponent(prefill.salary));
      if (prefill.currency) params.push("currency=" + encodeURIComponent(prefill.currency));
      if (prefill.role) params.push("role=" + encodeURIComponent(prefill.role));
      if (prefill.sector) params.push("sector=" + encodeURIComponent(prefill.sector));
      if (prefill.docType) params.push("docType=" + encodeURIComponent(prefill.docType));

      return params.length ? toolPath + "?" + params.join("&") : toolPath;
    },
    setPreFill: function (data) {
      try {
        localStorage.setItem("apo_prefill", JSON.stringify(data));
      } catch (err) {}
    },
    getPreFill: function () {
      try {
        return JSON.parse(localStorage.getItem("apo_prefill") || "{}");
      } catch (err) {
        return {};
      }
    },
    clearPreFill: function () {
      try {
        localStorage.removeItem("apo_prefill");
      } catch (err) {}
    },
    saveProgress: function (journeyId, currentStep, carryData, country, meta) {
      try {
        var storageKey = getJourneyStorageKey(journeyId);
        var saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
        var extra = meta || {};

        saved.currentStep = currentStep;
        saved.country = country || saved.country;
        saved.carryData = Object.assign({}, saved.carryData || {}, carryData || {});
        if (typeof extra.totalSteps === "number") saved.totalSteps = extra.totalSteps;
        if (Array.isArray(extra.stepStatuses)) saved.stepStatuses = extra.stepStatuses.slice();
        saved.updatedAt = Date.now();

        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch (err) {}
    },
    loadProgress: function (journeyId) {
      try {
        return JSON.parse(localStorage.getItem(getJourneyStorageKey(journeyId)) || "{}");
      } catch (err) {
        return {};
      }
    },
    clearProgress: function (journeyId) {
      try {
        localStorage.removeItem(getJourneyStorageKey(journeyId));
      } catch (err) {}
    },
    getIncompleteJourneys: function () {
      var journeys = [];
      var self = this;

      Object.keys(this.JOURNEYS).forEach(function (journeyId) {
        var progress = self.loadProgress(journeyId);
        if (!progress || progress.currentStep === undefined || !progress.updatedAt) return;

        var steps = getFilteredSteps(self, journeyId, progress.country);
        var totalSteps = typeof progress.totalSteps === "number" ? progress.totalSteps : steps.length;
        if (progress.currentStep >= totalSteps) return;

        var journey = self.JOURNEYS[journeyId];
        journeys.push({
          id: journeyId,
          label: journey.label,
          icon: journey.icon,
          currentStep: progress.currentStep,
          totalSteps: totalSteps,
          updatedAt: progress.updatedAt
        });
      });

      return journeys;
    },
    loadProgressFromSupabase: async function (journeyId, userId) {
      try {
        var supabase = window.AfroAuth && window.AfroAuth.getSupabase ? window.AfroAuth.getSupabase() : null;
        if (!supabase || !userId) return null;

        var response = await supabase
          .from("apo_workflows")
          .select("country, current_step, total_steps, carry_data, step_statuses, updated_at")
          .eq("user_id", userId)
          .eq("journey_type", journeyId)
          .maybeSingle();
        var data = response && response.data;
        if (!data) return null;

        return {
          country: data.country || "",
          currentStep: typeof data.current_step === "number" ? data.current_step : 0,
          totalSteps: typeof data.total_steps === "number" ? data.total_steps : 0,
          carryData: data.carry_data || {},
          stepStatuses: Array.isArray(data.step_statuses) ? data.step_statuses : [],
          updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now()
        };
      } catch (err) {
        return null;
      }
    },
    getIncompleteJourneysFromSupabase: async function (userId) {
      try {
        var supabase = window.AfroAuth && window.AfroAuth.getSupabase ? window.AfroAuth.getSupabase() : null;
        if (!supabase || !userId) return [];

        var response = await supabase
          .from("apo_workflows")
          .select("journey_type, current_step, total_steps, updated_at, status")
          .eq("user_id", userId)
          .neq("status", "complete")
          .order("updated_at", { ascending: false });
        var rows = response && response.data ? response.data : [];
        var self = this;

        return rows
          .filter(function (row) {
            return self.JOURNEYS[row.journey_type];
          })
          .map(function (row) {
            var journey = self.JOURNEYS[row.journey_type];
            return {
              id: row.journey_type,
              label: journey.label,
              icon: journey.icon,
              currentStep: typeof row.current_step === "number" ? row.current_step : 0,
              totalSteps: typeof row.total_steps === "number" ? row.total_steps : 0,
              updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now()
            };
          });
      } catch (err) {
        return [];
      }
    },
    syncToSupabase: async function (journeyId, userId, progressOverride) {
      try {
        var supabase = window.AfroAuth && window.AfroAuth.getSupabase ? window.AfroAuth.getSupabase() : null;
        if (!supabase || !userId) return;

        var progress = progressOverride || this.loadProgress(journeyId);
        var totalSteps = typeof progress.totalSteps === "number"
          ? progress.totalSteps
          : getFilteredSteps(this, journeyId, progress.country).length;
        var currentStep = typeof progress.currentStep === "number" ? progress.currentStep : 0;
        var stepStatuses = Array.isArray(progress.stepStatuses) ? progress.stepStatuses : [];
        var carryData = progress.carryData || {};
        var isComplete = totalSteps > 0 && currentStep >= totalSteps;

        await supabase.from("apo_workflows").upsert({
          user_id: userId,
          journey_type: journeyId,
          country: progress.country || null,
          current_step: currentStep,
          total_steps: totalSteps,
          carry_data: carryData,
          step_statuses: stepStatuses,
          last_completed_at: isComplete ? new Date().toISOString() : null,
          status: isComplete ? "complete" : "in-progress",
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,journey_type"
        });
      } catch (err) {}
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.afropayrollOs = engine;
}();
