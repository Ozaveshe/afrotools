(function (global) {
  "use strict";
  var SUMMARY = Object.freeze({
    "A+": "World-class personal brand. You are a recognised authority in your field.",
    A: "Strong personal brand. Recruiters and clients find you easily. Keep building.",
    "B+": "Good brand. You are visible and credible. A few focused efforts will break into the top tier.",
    B: "Developing brand. You have foundations. Consistent content creation is your next move.",
    C: "Emerging brand. Your offline reputation may be stronger than your digital presence.",
    D: "Early stage. Start with LinkedIn optimisation and one content channel.",
    F: "Brand building hasn't started. LinkedIn profile creation is your first action today.",
  });
  var ACTIONS = Object.freeze({
    LinkedIn: "Complete every section of your LinkedIn profile. Request 3 recommendations from former colleagues. Turn on Creator Mode.",
    "Social Media": "Pick ONE platform (Twitter or Instagram) and post daily for 30 days. Engage with 10 accounts in your industry every day.",
    "Digital / SEO": "Create a free portfolio site on Carrd.co (30 mins). Add your name as a keyword in your LinkedIn headline and bio.",
    "Content Creation": "Write one article per week on Medium, LinkedIn, or your blog. Repurpose each article into 5 Twitter/LinkedIn posts.",
    "Offline Reputation": "Email 3 conference organisers requesting a speaking slot. Attend 2 industry events and introduce yourself to 10 people.",
    Credentials: "Research one internationally recognised certification relevant to your field. Start the prep course this week.",
  });
  function integer(value) { return parseInt(value, 10) || 0; }
  function calculate(input) {
    var linkedin = Math.min(20, integer(input.liConnections) + integer(input.liPosting));
    var social = Math.min(15, Math.max(integer(input.twFollowers), integer(input.igFollowers) * 0.7));
    var digital = Math.min(15, integer(input.website) + integer(input.googleResult));
    var content = Math.min(20, integer(input.articles) + integer(input.book) + integer(input.podcast));
    var offline = Math.min(15, integer(input.speaking) + integer(input.awards));
    var credentials = Math.min(15, integer(input.education) + integer(input.certs));
    var total = Math.round(linkedin + social + digital + content + offline + credentials);
    var grade = total >= 90 ? "A+" : total >= 80 ? "A" : total >= 70 ? "B+" : total >= 60 ? "B" : total >= 50 ? "C" : total >= 40 ? "D" : "F";
    var categories = [
      { name: "LinkedIn", score: linkedin, max: 20, icon: "🔗" },
      { name: "Social Media", score: social, max: 15, icon: "📱" },
      { name: "Digital / SEO", score: digital, max: 15, icon: "🌐" },
      { name: "Content Creation", score: content, max: 20, icon: "✍️" },
      { name: "Offline Reputation", score: offline, max: 15, icon: "🎤" },
      { name: "Credentials", score: credentials, max: 15, icon: "🎓" },
    ];
    var weakest = categories.slice().sort(function (a, b) { return a.score / a.max - b.score / b.max; })[0];
    return {
      total: total, grade: grade,
      gradeClass: grade.indexOf("A") === 0 ? "grade-A" : grade.indexOf("B") === 0 ? "grade-B" : grade === "C" ? "grade-C" : grade === "D" ? "grade-D" : "grade-F",
      summary: SUMMARY[grade] || SUMMARY.C, categories: categories, weakest: weakest,
      weakestAction: ACTIONS[weakest.name] || "Focus on building your presence in this area through consistent effort.",
      years: integer(input.yearsExp), industry: input.industry,
      monetizationScore: total >= 70 ? "High" : total >= 50 ? "Medium" : "Early Stage",
    };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.PersonalBrandAuditEngine = Object.freeze({ calculate: calculate });
})(typeof window !== "undefined" ? window : globalThis);
