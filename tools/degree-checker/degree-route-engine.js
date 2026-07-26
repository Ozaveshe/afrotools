(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.degreeRouteEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const destinations = {
    us: {
      name: "United States",
      url: "https://www.ed.gov/about/initiatives/international-affairs/recognition-of-foreign-qualifications",
      label: "U.S. Department of Education recognition guidance",
      owners: { study: "The receiving education institution", work: "The prospective employer", immigration: "The relevant federal immigration authority", licensed: "The relevant state licensing board" }
    },
    canada: {
      name: "Canada",
      url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/education-assessment.html",
      label: "IRCC educational credential assessment guidance",
      owners: { study: "The receiving education institution", work: "The prospective employer, or provincial/territorial regulator where applicable", immigration: "IRCC using an assessment from a designated organisation or profession-specific body", licensed: "The provincial or territorial regulator and any designated professional body" }
    },
    uk: {
      name: "United Kingdom",
      url: "https://www.gov.uk/government/publications/initial-teacher-training-itt-bursary-funding-manual/initial-teacher-training-itt-bursary-funding-manual-2026-to-2027-academic-year#assessing-overseas-qualifications",
      label: "GOV.UK overseas qualification guidance",
      owners: { study: "The receiving education institution", work: "The employer, with UK ENIC comparability if requested", immigration: "The relevant UK immigration route owner", licensed: "The relevant UK professional regulator" }
    },
    australia: {
      name: "Australia",
      url: "https://www.education.gov.au/international-education/recognise-overseas-qualifications",
      label: "Australian qualifications recognition guidance",
      owners: { study: "The receiving education institution", work: "The employer or occupation-specific registration/licensing authority", immigration: "Home Affairs and the relevant approved skills assessing authority where required", licensed: "The relevant registration, licensing or professional authority" }
    },
    "south-africa": {
      name: "South Africa",
      url: "https://saqa.org.za/services/saqa-foreign-quals/",
      label: "SAQA foreign qualification evaluation",
      owners: { study: "The receiving education institution, with SAQA evaluation where required", work: "The employer, with SAQA evaluation where required", immigration: "The relevant immigration authority using required SAQA evidence", licensed: "The professional body or regulator, with SAQA evaluation where required" }
    },
    "germany-eu": {
      name: "Germany / Europe",
      url: "https://www.enic-naric.net/",
      label: "ENIC-NARIC national information centres",
      owners: { study: "The receiving education institution or national recognition authority", work: "The employer or destination competent authority", immigration: "The destination immigration authority", licensed: "The competent professional authority in the destination country" }
    },
    other: {
      name: "Selected destination",
      url: "https://www.enic-naric.net/",
      label: "Find the destination recognition information centre",
      owners: { study: "The receiving education institution", work: "The prospective employer", immigration: "The destination immigration authority", licensed: "The destination professional regulator or competent authority" }
    }
  };

  const purposeLabels = {
    study: "admission or further study",
    work: "non-regulated employment",
    immigration: "immigration",
    licensed: "a licensed or regulated profession"
  };

  function build(input) {
    if (!destinations[input.destination]) return { valid: false, error: "Choose a destination." };
    if (!purposeLabels[input.purpose]) return { valid: false, error: "Choose the purpose of recognition." };
    if (!input.qualification) return { valid: false, error: "Choose the qualification you hold." };
    const route = destinations[input.destination];
    const docs = new Set(input.documents || []);
    const gaps = [];
    if (input.institutionStatus !== "confirmed") gaps.push("Confirm the awarding institution with the home-country regulator");
    if (!docs.has("certificate")) gaps.push("Final certificate or official award letter");
    if (!docs.has("transcript")) gaps.push("Official transcript or statement of results");
    if (!docs.has("verification")) gaps.push("Direct issuer or registrar verification route");
    if (!docs.has("translation")) gaps.push("Certified translation if the recipient requires one");
    return {
      valid: true,
      destination: route.name,
      purpose: purposeLabels[input.purpose],
      qualification: input.qualification,
      owner: route.owners[input.purpose],
      link: { url: route.url, label: route.label },
      gaps,
      separation: input.purpose === "licensed"
        ? "A general credential comparison does not itself grant professional registration. Follow the competent regulator's profession-specific process."
        : input.purpose === "immigration"
          ? "An immigration assessment is programme-specific and does not itself grant a professional licence, job or admission."
          : "Recognition for this purpose may not transfer to immigration or professional licensing."
    };
  }

  return { destinations, purposeLabels, build };
});
