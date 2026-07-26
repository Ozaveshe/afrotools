(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.BloodGroupEngine = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
  var RED_CELL_RECIPIENTS = {
    "O-": ["O-"],
    "O+": ["O-", "O+"],
    "A-": ["O-", "A-"],
    "A+": ["O-", "O+", "A-", "A+"],
    "B-": ["O-", "B-"],
    "B+": ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": TYPES.slice()
  };
  var PLASMA_DONORS = {
    O: ["O", "A", "B", "AB"],
    A: ["A", "AB"],
    B: ["B", "AB"],
    AB: ["AB"]
  };

  function validType(value) {
    return TYPES.indexOf(String(value || "").toUpperCase()) !== -1;
  }

  function abo(value) {
    var normalized = String(value || "").toUpperCase();
    return normalized.slice(0, -1);
  }

  function redCellReference(donor, recipient) {
    donor = String(donor || "").toUpperCase();
    recipient = String(recipient || "").toUpperCase();
    if (!validType(donor) || !validType(recipient)) throw new Error("Choose valid ABO/RhD blood groups.");
    var listed = RED_CELL_RECIPIENTS[recipient].indexOf(donor) !== -1;
    return {
      component: "red-cells",
      donor: donor,
      recipient: recipient,
      listed: listed,
      compatibleDonorGroups: RED_CELL_RECIPIENTS[recipient].slice(),
      classification: listed ? "reference-match" : "not-a-reference-match",
      boundary: "ABO/RhD is only an initial red-cell reference. A hospital must type, antibody-screen, select and crossmatch the actual unit."
    };
  }

  function plasmaReference(donor, recipient) {
    donor = String(donor || "").toUpperCase();
    recipient = String(recipient || "").toUpperCase();
    if (!validType(donor) || !validType(recipient)) throw new Error("Choose valid ABO/RhD blood groups.");
    var recipientAbo = abo(recipient);
    var donorAbo = abo(donor);
    var donors = PLASMA_DONORS[recipientAbo];
    var listed = donors.indexOf(donorAbo) !== -1;
    return {
      component: "plasma",
      donor: donor,
      recipient: recipient,
      donorAbo: donorAbo,
      recipientAbo: recipientAbo,
      listed: listed,
      compatibleDonorGroups: donors.slice(),
      classification: listed ? "reference-match" : "not-a-reference-match",
      boundary: "Plasma ABO direction differs from red cells. RhD is not used here as a simple plasma compatibility rule; the transfusion service selects the product."
    };
  }

  function plateletReference(donor, recipient) {
    donor = String(donor || "").toUpperCase();
    recipient = String(recipient || "").toUpperCase();
    if (!validType(donor) || !validType(recipient)) throw new Error("Choose valid ABO/RhD blood groups.");
    return {
      component: "platelets",
      donor: donor,
      recipient: recipient,
      classification: "laboratory-selection-required",
      boundary: "ABO-identical platelets are generally preferred, but inventory, antibodies, patient age, sex, RhD and other clinical requirements can change selection. This page does not classify a platelet unit."
    };
  }

  function componentReference(component, donor, recipient) {
    if (component === "red-cells") return redCellReference(donor, recipient);
    if (component === "plasma") return plasmaReference(donor, recipient);
    if (component === "platelets") return plateletReference(donor, recipient);
    throw new Error("Choose red cells, plasma or platelets.");
  }

  function pregnancyRhReference(pregnantPerson, otherBiologicalParent) {
    pregnantPerson = String(pregnantPerson || "").toUpperCase();
    otherBiologicalParent = String(otherBiologicalParent || "").toUpperCase();
    if (!validType(pregnantPerson) || !validType(otherBiologicalParent)) {
      throw new Error("Choose valid ABO/RhD blood groups.");
    }
    var pregnantRh = pregnantPerson.slice(-1);
    var otherRh = otherBiologicalParent.slice(-1);
    var classification;
    if (pregnantRh === "+") classification = "pregnant-person-rhd-positive";
    else if (otherRh === "+") classification = "baby-may-be-rhd-positive";
    else classification = "both-inputs-rhd-negative";
    return {
      pregnantPerson: pregnantPerson,
      otherBiologicalParent: otherBiologicalParent,
      classification: classification,
      boundary: "Parental ABO/RhD entries do not determine fetal blood group, antibody status, sensitisation or anti-D eligibility. Antenatal testing and the maternity team are authoritative."
    };
  }

  function snapshot(result) {
    if (!result || !result.classification) return null;
    if (result.component) {
      return {
        title: "Blood component compatibility reference",
        component: result.component,
        donor: result.donor,
        recipient: result.recipient,
        classification: result.classification,
        note: result.boundary
      };
    }
    return {
      title: "Pregnancy RhD discussion reference",
      pregnantPerson: result.pregnantPerson,
      otherBiologicalParent: result.otherBiologicalParent,
      classification: result.classification,
      note: result.boundary
    };
  }

  return {
    TYPES: TYPES.slice(),
    componentReference: componentReference,
    redCellReference: redCellReference,
    plasmaReference: plasmaReference,
    plateletReference: plateletReference,
    pregnancyRhReference: pregnancyRhReference,
    snapshot: snapshot
  };
});
