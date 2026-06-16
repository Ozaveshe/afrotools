const assert = require("assert");

function createStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    }
  };
}

global.localStorage = createStorage();
global.crypto = {
  getRandomValues(bytes) {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = index + 42;
    return bytes;
  }
};

const savedProjects = require("../assets/js/ai/saved-projects.js");

function sampleWorkflow(overrides = {}) {
  return Object.assign({
    originalQuery: "Write a CV for an electrical engineer in Ghana with my phone number and full resume",
    selectedToolId: "cv-builder",
    selectedToolRoute: "/tools/cv-builder/",
    confidence: 0.91,
    source: "deterministic",
    missingInputs: ["experienceYears"],
    extractedInputs: {
      country: "Ghana",
      targetRole: "Electrical engineer",
      careerStage: "mid-career",
      email: "person@example.com",
      phone: "+233000000000",
      resumeText: "Long private CV text",
      pdfContent: "Private PDF text",
      profileText: "Private profile paragraph",
      clientName: "Jane User",
      skills: ["maintenance", "solar", "automation"]
    },
    clarificationAnswers: {
      experienceYears: 6,
      address: "Private address"
    },
    prefillPayload: {
      route: "/tools/cv-builder/?prefill=1"
    }
  }, overrides);
}

function assertNoPrivateFields(project) {
  const serialized = JSON.stringify(project);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(project, "originalQuery"), false);
  [
    "email",
    "phone",
    "resumeText",
    "pdfContent",
    "profileText",
    "clientName",
    "customerName",
    "fullDocument",
    "coverLetterBody",
    "rawPrompt",
    "address",
    "linkedin",
    "portfolio"
  ].forEach((key) => {
    assert.strictEqual(project.structuredInputs[key], undefined, `${key} should not be saved`);
  });
  assert(!serialized.includes("person@example.com"));
  assert(!serialized.includes("+233000000000"));
  assert(!serialized.includes("Private PDF text"));
  assert(!serialized.includes("Raw user prompt"));
}

function createWorkflowProject(state, options = {}) {
  return savedProjects.createProjectFromState(state, Object.assign({
    workflowTitle: options.workflowTitle || state.selectedToolId,
    continueUrl: "/ai/",
    exportLinks: [{ label: "Open workflow", href: state.selectedToolRoute || "/tools/", type: "tool" }]
  }, options));
}

(async function run() {
  const project = savedProjects.createProjectFromState(sampleWorkflow(), {
    workflowTitle: "CV Builder",
    continueUrl: "/ai/",
    exportLinks: [
      { label: "Open CV Builder", href: "/tools/cv-builder/?prefill=1", type: "prefill" },
      { label: "Unsafe", href: "javascript:alert(1)", type: "bad" }
    ]
  });

  assert.strictEqual(project.workflowType, "cv-builder");
  assert.strictEqual(project.title, "CV Builder - Ghana");
  assert.strictEqual(project.structuredInputs.country, "Ghana");
  assert.strictEqual(project.structuredInputs.targetRole, "Electrical engineer");
  assert.strictEqual(project.structuredInputs.experienceYears, 6);
  assert.deepStrictEqual(project.structuredInputs.skills, ["maintenance", "solar", "automation"]);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(project, "originalQuery"), false);
  assert.strictEqual(project.structuredInputs.email, undefined);
  assert.strictEqual(project.structuredInputs.phone, undefined);
  assert.strictEqual(project.structuredInputs.resumeText, undefined);
  assert.strictEqual(project.structuredInputs.pdfContent, undefined);
  assert.strictEqual(project.structuredInputs.profileText, undefined);
  assert.strictEqual(project.structuredInputs.clientName, undefined);
  assert.strictEqual(project.structuredInputs.address, undefined);
  assertNoPrivateFields(project);
  assert(project.exportLinks.some((link) => link.href === "/tools/cv-builder/?prefill=1"));
  assert(!project.exportLinks.some((link) => /^javascript:/i.test(link.href)));

  const scholarshipProject = createWorkflowProject({
    originalQuery: "Raw user prompt for scholarships",
    selectedToolId: "scholarship-finder",
    selectedToolRoute: "/tools/scholarship-finder/",
    extractedInputs: {
      country: "Nigeria",
      targetCountry: "Canada",
      studyLevel: "masters",
      field: "engineering",
      budgetAmount: 8000,
      email: "person@example.com"
    },
    educationPlan: { goalSummary: "Study plan ready with scholarship and document checklist." }
  }, { workflowTitle: "Scholarship Finder" });
  assert.strictEqual(scholarshipProject.workflowType, "scholarship-finder");
  assert.strictEqual(scholarshipProject.structuredInputs.country, "Nigeria");
  assert.strictEqual(scholarshipProject.structuredInputs.targetCountry, "Canada");
  assert.strictEqual(scholarshipProject.structuredInputs.email, undefined);
  assertNoPrivateFields(scholarshipProject);

  const importProject = createWorkflowProject({
    originalQuery: "Raw user prompt for import",
    selectedToolId: "import-duty",
    selectedToolRoute: "/tools/import-duty/",
    extractedInputs: {
      destinationCountry: "Nigeria",
      itemCategory: "Toyota Axio",
      year: "2016",
      purchasePrice: 6500,
      shippingCost: 1200,
      insuranceCost: 250,
      fxRate: 1500,
      port: "Lagos"
    },
    importAdvisorPlan: { goalSummary: "Import estimate ready with CIF and duty assumptions.", estimate: { totalLandedCost: 12400000 } }
  }, { workflowTitle: "Import Duty Calculator" });
  assert.strictEqual(importProject.structuredInputs.destinationCountry, "Nigeria");
  assert.strictEqual(importProject.structuredInputs.itemCategory, "Toyota Axio");
  assert.strictEqual(importProject.structuredInputs.purchasePrice, 6500);
  assertNoPrivateFields(importProject);

  const energyProject = createWorkflowProject({
    originalQuery: "Raw user prompt for solar",
    selectedToolId: "solar-roi",
    selectedToolRoute: "/tools/solar-roi/",
    extractedInputs: {
      country: "Nigeria",
      city: "Lagos",
      userType: "shop",
      monthlyBill: 45000,
      generatorHoursPerDay: 6,
      fuelType: "petrol",
      loadSizeKw: 3,
      budgetRange: "medium",
      phone: "+233000000000"
    },
    energyAdvisorPlan: { goalSummary: "Solar decision brief ready with generator exposure." }
  }, { workflowTitle: "Solar ROI Calculator" });
  assert.strictEqual(energyProject.structuredInputs.city, "Lagos");
  assert.strictEqual(energyProject.structuredInputs.generatorHoursPerDay, 6);
  assert.strictEqual(energyProject.structuredInputs.phone, undefined);
  assertNoPrivateFields(energyProject);

  const invoiceProject = createWorkflowProject({
    originalQuery: "Raw user prompt for invoice",
    selectedToolId: "invoice-generator",
    selectedToolRoute: "/tools/invoice-generator/",
    extractedInputs: {
      country: "Ghana",
      invoiceAmount: 12000,
      currency: "GHS",
      vatTreatment: "exclusive",
      businessType: "services",
      clientName: "Private Client",
      customerName: "Private Customer",
      fullDocument: "Private invoice body"
    },
    smeFinancePlan: { goalSummary: "Invoice draft route ready with VAT warning." }
  }, { workflowTitle: "Invoice Generator" });
  assert.strictEqual(invoiceProject.structuredInputs.invoiceAmount, 12000);
  assert.strictEqual(invoiceProject.structuredInputs.currency, "GHS");
  assert.strictEqual(invoiceProject.structuredInputs.clientName, undefined);
  assertNoPrivateFields(invoiceProject);

  const livingProject = createWorkflowProject({
    originalQuery: "Raw user prompt for living costs",
    selectedToolId: "cost-of-living",
    selectedToolRoute: "/tools/cost-of-living/",
    extractedInputs: {
      country: "Kenya",
      city: "Nairobi",
      monthlyBudget: 120000,
      monthlyIncome: 140000,
      rent: 45000,
      transportCost: 12000,
      foodCost: 30000,
      utilityCost: 8000,
      internetCost: 5000,
      householdSize: 3,
      address: "Private address"
    }
  }, { workflowTitle: "Cost of Living Planner", resultSummary: "Living-cost plan saved with budget pressure notes." });
  assert.strictEqual(livingProject.workflowType, "cost-of-living");
  assert.strictEqual(livingProject.structuredInputs.city, "Nairobi");
  assert.strictEqual(livingProject.structuredInputs.monthlyBudget, 120000);
  assert.strictEqual(livingProject.structuredInputs.rent, 45000);
  assert.strictEqual(livingProject.structuredInputs.address, undefined);
  assertNoPrivateFields(livingProject);

  const saved = savedProjects.saveLocal(project);
  assert(saved.projectId);
  let localItems = savedProjects.listLocal();
  assert.strictEqual(localItems.length, 1);
  assert.strictEqual(localItems[0].projectId, saved.projectId);
  assert.strictEqual(localItems[0].structuredInputs.email, undefined);

  const newer = savedProjects.saveLocal(Object.assign({}, saved, { nonSensitiveSummary: "Updated safe summary" }));
  localItems = savedProjects.listLocal();
  assert.strictEqual(localItems.length, 1);
  assert.strictEqual(localItems[0].nonSensitiveSummary, "Updated safe summary");
  assert.strictEqual(localItems[0].projectId, newer.projectId);

  const consentBlocked = await savedProjects.syncProject(saved, {
    workspace: {
      isSignedIn: () => true,
      upsert: async () => ({ id: "workspace-row" })
    }
  });
  assert.strictEqual(consentBlocked.synced, false);
  assert.strictEqual(consentBlocked.reason, "consent_required");

  const signedOut = await savedProjects.syncProject(saved, {
    explicitConsent: true,
    workspace: {
      isSignedIn: () => false,
      upsert: async () => ({ id: "workspace-row" })
    }
  });
  assert.strictEqual(signedOut.synced, false);
  assert.strictEqual(signedOut.reason, "not_signed_in");

  let captured = null;
  const synced = await savedProjects.syncProject(saved, {
    explicitConsent: true,
    workspace: {
      isSignedIn: () => true,
      upsert: async (payload) => {
        captured = payload;
        return { id: "workspace-row", user_id: "user-123" };
      }
    }
  });
  assert.strictEqual(synced.synced, true);
  assert.strictEqual(captured.itemType, "ai-project");
  assert.strictEqual(captured.toolSlug, "ask-afrotools-ai");
  assert.strictEqual(captured.meta.privacy, "sanitized-ai-project");
  assert.strictEqual(captured.payload.structuredInputs.email, undefined);
  assert.strictEqual(captured.payload.structuredInputs.resumeText, undefined);
  assert.strictEqual(captured.payload.structuredInputs.country, "Ghana");
  assert.strictEqual(synced.project.userId, "user-123");

  assert.strictEqual(savedProjects.deleteLocal(saved.projectId), true);
  assert.strictEqual(savedProjects.listLocal().length, 0);

  console.log("ai-saved-projects tests passed");
})();
