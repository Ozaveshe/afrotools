(function (root) {
  'use strict';

  // Navigation groups only. Names, descriptions, routes and country scope come
  // from the public tool registry, which remains the capability source of truth.
  var groups = [
    { key: 'practice', title: 'Practise for an exam', ids: ['ssce-practice', 'flashcard-maker', 'exam-countdown', 'exam-timetable'] },
    { key: 'admissions', title: 'Check results and admissions', ids: ['university-admission', 'waec-calculator', 'jamb-aggregate', 'kcse-calculator', 'matric-points', 'gpa-calculator'] },
    { key: 'finance', title: 'Pay for education', ids: ['school-fees', 'student-budget', 'boarding-school', 'edu-savings', 'student-loan-repay', 'ke-helb'] },
    { key: 'abroad', title: 'Plan study abroad', ids: ['scholarship-finder', 'study-abroad-cost', 'degree-checker', 'university-ranking', 'ielts-calculator'] },
    { key: 'coursework', title: 'Study and coursework', ids: ['study-planner', 'course-load', 'citation-generator', 'word-counter', 'plagiarism-pct', 'periodic-table', 'algebra-solver', 'statistics-calc', 'fraction-calc', 'percentage-calc', 'scientific-calc', 'roman-numerals', 'binary-converter'] },
    { key: 'teaching', title: 'Teaching and school operations', ids: ['teacher-salary', 'tutoring-rate', 'classroom-size'] },
    { key: 'after', title: 'After graduation', ids: ['cert-roi', 'coding-bootcamp', 'interview-prep', 'nysc-allowance', 'national-service-gh'] },
    { key: 'saved', title: 'My Study Space', ids: ['education-hub'] }
  ];

  var focus = {
    fees: { title: 'Compare school fees', lead: 'Start with a fee quote you have. Compare the annual total, then plan monthly costs and savings.', ids: ['school-fees', 'student-budget', 'boarding-school', 'edu-savings'], related: ['loans', 'scholarships'] },
    loans: { title: 'Plan student loan repayment', lead: 'Estimate repayment from your own terms. Check Kenya HELB separately and test the monthly budget.', ids: ['student-loan-repay', 'ke-helb', 'student-budget', 'edu-savings'], related: ['fees', 'scholarships'] },
    scholarships: { title: 'Find and assess scholarships', lead: 'Search source-linked opportunities, check each eligibility rule and deadline, then save an application plan.', ids: ['scholarship-finder', 'study-abroad-cost', 'degree-checker', 'university-ranking'], related: ['study-abroad', 'fees'] },
    'study-abroad': { title: 'Plan study abroad', lead: 'Build a destination budget from known costs, check your qualification and language plan, then compare institutions.', ids: ['study-abroad-cost', 'degree-checker', 'ielts-calculator', 'university-ranking', 'scholarship-finder'], related: ['scholarships', 'fees'] }
  };

  function registryTools(rows) {
    var source = rows || (typeof AFRO_TOOLS !== 'undefined' ? AFRO_TOOLS : []);
    return source.filter(function (tool) { return tool.category === 'education' && (tool.lang || 'en') === 'en'; });
  }
  function byId(rows) {
    var map = Object.create(null);
    registryTools(rows).forEach(function (tool) { map[tool.id] = tool; });
    return map;
  }
  function resolve(ids, rows) {
    var map = byId(rows);
    return ids.map(function (id) { return map[id]; }).filter(Boolean);
  }
  var api = {
    getRegistryTools: registryTools,
    getRegistryCount: function (rows) { return registryTools(rows).length; },
    getBuckets: function (rows) {
      return groups.map(function (group) {
        var tools = resolve(group.ids, rows);
        return { key: group.key, title: group.title, allTools: tools, featuredTools: tools, registryCount: tools.length, featuredCount: tools.length };
      });
    },
    getSubhub: function (key, rows) {
      var item = focus[key];
      if (!item) return null;
      return { key: key, title: item.title, description: item.lead, tools: resolve(item.ids, rows), relatedLinks: item.related.map(function (slug) { return { href: '/education/' + slug + '/', label: focus[slug].title }; }) };
    },
    auditTaxonomy: function (rows) {
      var seen = Object.create(null);
      var duplicateIds = [];
      groups.forEach(function (group) { group.ids.forEach(function (id) { if (seen[id]) duplicateIds.push(id); seen[id] = true; }); });
      return { registryCount: registryTools(rows).length, assignedCount: Object.keys(seen).length, duplicateIds: duplicateIds, missingIds: registryTools(rows).filter(function (tool) { return !seen[tool.id]; }).map(function (tool) { return tool.id; }) };
    }
  };
  root.AfroEducation = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
