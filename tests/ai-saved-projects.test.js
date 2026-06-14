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
  assert(project.exportLinks.some((link) => link.href === "/tools/cv-builder/?prefill=1"));
  assert(!project.exportLinks.some((link) => /^javascript:/i.test(link.href)));

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
