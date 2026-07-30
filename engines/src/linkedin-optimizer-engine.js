(function (root) {
  "use strict";

  var KEYWORDS = {
    software: ["Software Engineer", "Full Stack Developer", "React", "Node.js", "Python", "API Development", "Cloud", "AWS", "DevOps", "Agile", "Fintech", "Remote Work", "Open Source"],
    product: ["Product Manager", "Product Strategy", "Roadmap", "User Research", "Agile", "Scrum", "OKRs", "Go-to-Market", "B2B SaaS", "African Markets", "Growth"],
    marketing: ["Digital Marketing", "SEO", "Social Media Strategy", "Content Marketing", "Google Analytics", "Paid Ads", "Brand Strategy", "E-commerce", "Growth Hacking", "African Consumer"],
    finance: ["Finance", "Financial Analysis", "IFRS", "Bloomberg", "Excel", "Financial Modelling", "Investment Banking", "Corporate Finance", "Risk Management", "CFA"],
    hr: ["Human Resources", "Talent Acquisition", "HR Business Partner", "HRIS", "Employee Relations", "Organisational Development", "Learning & Development", "SHRM"],
    sales: ["Business Development", "Sales Strategy", "B2B Sales", "Enterprise Sales", "Account Management", "CRM", "Salesforce", "Revenue Growth", "Partnerships"],
    data: ["Data Analyst", "Data Science", "Python", "SQL", "Power BI", "Tableau", "Machine Learning", "Data Visualisation", "Big Data", "Business Intelligence"],
    consulting: ["Management Consulting", "Strategy", "Business Transformation", "Process Improvement", "Stakeholder Management", "Project Management", "PMO"],
    healthcare: ["Healthcare", "Clinical", "Public Health", "Medicine", "Patient Care", "Medical Research", "Health Policy", "WHO", "Africa CDC"],
    legal: ["Legal Counsel", "Corporate Law", "Commercial Law", "Contracts", "Compliance", "Regulatory Affairs", "ADR", "Nigerian Bar", "ICPAK", "LPCSA"],
    creative: ["Graphic Design", "Brand Identity", "UI/UX", "Adobe Creative Suite", "Art Direction", "Visual Storytelling", "Photography", "Video Production"],
    operations: ["Operations Management", "Supply Chain", "Logistics", "Procurement", "Process Optimisation", "Lean", "Six Sigma", "Inventory Management"],
  };

  var HEADLINES = {
    software: { student: "Aspiring Software Developer | Building African Fintech Solutions | BSc Computer Science", junior: "Software Engineer | React & Node.js | Building Scalable Solutions Across Africa", mid: "Senior Software Engineer | Full-Stack | 5+ Years Building Products Used by Millions in Africa", senior: "Engineering Lead | Architecting High-Impact Platforms | Fintech & E-commerce | Africa", manager: "VP Engineering | Scaling Tech Teams in Africa | 10+ Years | Board Advisor", exec: "CTO & Co-Founder | Building Africa's Tech Infrastructure | Angel Investor" },
    marketing: { student: "Marketing Graduate | Digital Content Creator | Africa-Focused Brand Storyteller", junior: "Digital Marketer | SEO & Paid Social | Growing Brands Across West Africa", mid: "Marketing Manager | Brand Strategy | Scaled 3 Brands to 100k+ Followers | Nigeria & Kenya", senior: "Head of Marketing | Digital Strategy | Africa | Revenue Growth Expert", manager: "VP Marketing | African Consumer Brands | Ex-Unilever | ₦1B+ Revenue Impact", exec: "Chief Marketing Officer | Pan-African Brand Builder | Speaker | Investor" },
    finance: { student: "Finance Graduate | CFA L1 Candidate | Passionate About African Capital Markets", junior: "Financial Analyst | Equity Research | Excel & Bloomberg | Sub-Saharan Africa Focus", mid: "Finance Manager | IFRS | Financial Modelling | 6 Years in Banking & FMCG | Nigeria", senior: "Head of Finance | CFO Track | FX Risk | 12+ Years | Listed Companies", manager: "CFO | Financial Transformation | Africa | IPO Experience | Board Director", exec: "Group CFO | Pan-African Operations | Corporate Governance | Capital Raising" },
    data: { student: "Data Science Student | Python & SQL | Building Insights for Africa's Challenges", junior: "Data Analyst | Power BI & Python | Turning African Business Data Into Decisions", mid: "Senior Data Analyst | Business Intelligence | SQL, Tableau, Python | 5 Years", senior: "Data Science Lead | ML/AI | 8+ Years | Fintech & Telco | Africa", manager: "Head of Analytics | Data Strategy | AI & ML | Transforming African Enterprises", exec: "Chief Data Officer | Data-Driven Strategy | Pan-African Markets" },
    hr: { student: "HR Graduate | People & Culture Enthusiast | Championing African Talent", junior: "HR Officer | Talent Acquisition | Employee Engagement | Nigeria/Kenya", mid: "HR Manager | Strategic HRBP | 5 Years | FMCG & Tech | West Africa", senior: "Senior HRBP | Organisational Design | Culture Transformation | 10+ Years", manager: "HR Director | Talent Strategy | Pan-African HR Leader | Board Advisor", exec: "Chief People Officer | Building Africa's Top Employers | DEI Champion" },
    sales: { student: "Sales Graduate | Business Development Trainee | Passionate About African Entrepreneurship", junior: "Business Development Executive | B2B Sales | SaaS & Tech | Nigeria", mid: "Sales Manager | ₦500M+ Revenue Generated | B2B Enterprise | 5+ Years", senior: "Head of Sales | Revenue Growth | West & East Africa | Key Account Management", manager: "VP Sales | Go-To-Market Strategy | Pan-African Markets | $10M+ ARR", exec: "Chief Revenue Officer | Scaling African SaaS | Ex-Google Africa | Board Member" },
    consulting: { student: "Strategy Intern | Aspiring Management Consultant | Africa-Focused", junior: "Management Consultant | Strategy & Operations | Big 4 Trained | West Africa", mid: "Senior Consultant | Business Transformation | 5 Years | Energy & Fintech | Africa", senior: "Principal Consultant | Strategy & Growth | 10+ Years | Pan-African Advisory", manager: "Partner | Management Consulting | Africa Practice Lead | Board Advisor", exec: "Managing Partner | Pan-African Consulting | Keynote Speaker | Author" },
    healthcare: { student: "Medical Student | Global Health Advocate | Africa Health Innovation", junior: "Medical Officer | Public Health | Community Health | Nigeria/Kenya", mid: "Physician | Specialisation in [Field] | Healthcare Innovation | Africa", senior: "Senior Medical Consultant | 10+ Years | Healthcare Strategy | WHO Collaborator", manager: "Medical Director | Healthcare Leadership | Pan-African Health Systems", exec: "Chief Medical Officer | Africa's Healthcare Transformation | Policy Advisor" },
    legal: { student: "Law Student | Commercial Law Focus | Young Bar Association Member", junior: "Solicitor & Barrister | Commercial Law | Corporate Transactions | Nigeria", mid: "Legal Counsel | Contracts & Compliance | 5+ Years | Fintech & Real Estate", senior: "Senior Legal Counsel | M&A | Regulatory Affairs | 10+ Years | Africa", manager: "Head of Legal | General Counsel | Corporate Governance | Pan-African", exec: "Group General Counsel | Pan-African Operations | Board Secretary | Speaker" },
    creative: { student: "Creative Design Student | Visual Storyteller | African Aesthetics", junior: "Graphic Designer | Brand Identity | Adobe Suite | Pan-African Visual Stories", mid: "Senior Designer | Brand Strategy | UI/UX | 5 Years | Award-Winning Work", senior: "Creative Director | Brand & Identity | 10+ Years | Pan-African Campaigns", manager: "Head of Creative | Brand Transformation | Agency & In-House | Africa", exec: "Chief Creative Officer | Pan-African Brand Leader | Keynote Speaker | Jury Member" },
    product: { student: "Product Management Student | Building for Africa | Design Thinking", junior: "Associate Product Manager | Fintech/E-commerce | User Research | Africa", mid: "Product Manager | 0-to-1 Product Builder | 5 Years | 100k+ Users | Nigeria", senior: "Senior PM | Product Strategy | Scaled to 1M+ Users | Africa & Diaspora", manager: "Head of Product | Platform Strategy | Pan-African Markets | Ex-Jumia/Flutterwave", exec: "Chief Product Officer | Pan-African Platforms | Board Advisor | Angel Investor" },
    operations: { student: "Operations Graduate | Supply Chain Enthusiast | FMCG & Logistics", junior: "Operations Analyst | Supply Chain | Process Improvement | West Africa", mid: "Operations Manager | Lean & Six Sigma | FMCG & Manufacturing | 5 Years | Africa", senior: "Senior Operations Manager | Supply Chain Transformation | 10+ Years | Pan-Africa", manager: "Head of Operations | Pan-African Supply Chain | Cost Reduction | ₦1B+ Savings", exec: "COO | Operational Excellence | Pan-African | Board Director | Supply Chain Expert" },
  };

  var CHECKS = [
    { id: "chk_photo", key: "photo", label: "Professional photo", points: 10, tip: "A photo makes profiles 14× more views. Use a clear headshot." },
    { id: "chk_headline", key: "headline", label: "Custom headline", points: 15, tip: "Replace your job title with a keyword-rich value statement. Use the templates below." },
    { id: "chk_about", key: "about", label: "About section (150+ words)", points: 10, tip: "LinkedIn's algorithm ranks profiles with 150+ word About sections higher in search." },
    { id: "chk_experience", key: "experience", label: "3+ experiences with descriptions", points: 15, tip: "Add bullet points with achievements (numbers) in each role." },
    { id: "chk_education", key: "education", label: "Education section", points: 5, tip: "Add degree, institution, graduation year. Add activities/societies." },
    { id: "chk_skills", key: "skills", label: "5+ skills listed", points: 5, tip: "Add your top 10 skills. Prioritise those recruiters search for." },
    { id: "chk_endorsements", key: "endorsements", label: "10+ endorsements", points: 5, tip: "Ask 5 colleagues to endorse your top 3 skills. Return the favour." },
    { id: "chk_recommendations", key: "recommendations", label: "3+ recommendations", points: 10, tip: "A written recommendation carries 10× the weight of an endorsement. Request from managers and clients." },
    { id: "chk_featured", key: "featured", label: "Featured section", points: 5, tip: "Pin your best post, article, or portfolio link here." },
    { id: "chk_creator", key: "creator", label: "Creator Mode ON", points: 5, tip: "Creator Mode adds a Follow button, topic hashtags, and improved algorithm reach." },
    { id: "chk_banner", key: "banner", label: "Custom banner image", points: 5, tip: "Add a banner showing your value prop, website, or professional photo." },
    { id: "chk_location", key: "location", label: "Location set correctly", points: 10, tip: "Recruiter searches filter by location. Ensure yours is set to your city." },
  ];

  var GROWTH_TIPS = {
    "0": "You have under 100 connections. Priority actions: (1) Connect with all colleagues past and present. (2) Import email contacts. (3) Join 5 LinkedIn groups in your industry. Target 500 connections in 90 days.",
    "1": "You have 100–499 connections. To reach the 500+ \"social proof\" threshold: (1) Send 10 personalised connection requests per day. (2) Comment meaningfully on 5 posts daily — this shows up in your connections' feeds. (3) Attend virtual events and connect with attendees.",
    "2": "You have 500+ connections. Focus on quality over quantity now. (1) Identify 20 influencers in your niche — engage daily with their content. (2) Post original thought leadership 2–3x per week. (3) Creator Mode + Newsletter builds a follower base beyond connections.",
  };

  var LEVELS = ["student", "junior", "mid", "senior", "manager", "exec"];
  var POSTING_STRATEGY = "Post on Tuesday, Wednesday, and Thursday mornings (8–10am local time). Mix: 40% insights from your work, 30% opinions on industry trends, 20% personal wins/lessons, 10% questions to spark engagement. Avoid over-promoting — LinkedIn users mute promotional content.";

  function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function normalize(input) {
    var source = input && typeof input === "object" ? input : {};
    var industry = own(HEADLINES, source.industry) ? source.industry : "software";
    var level = LEVELS.indexOf(source.level) !== -1 ? source.level : "student";
    var connections = own(GROWTH_TIPS, String(source.connections)) ? String(source.connections) : "0";
    var selected = source.checks && typeof source.checks === "object" ? source.checks : {};
    var checks = {};

    CHECKS.forEach(function (check) {
      checks[check.id] = selected[check.id] === true;
    });

    return {
      industry: industry,
      level: level,
      connections: connections,
      checks: checks,
    };
  }

  function calculate(input) {
    var normalized = normalize(input);
    var maxPoints = CHECKS.reduce(function (sum, check) {
      return sum + check.points;
    }, 0);
    var checklist = CHECKS.map(function (check) {
      var checked = normalized.checks[check.id];
      return {
        id: check.id,
        key: check.key,
        label: check.label,
        points: check.points,
        tip: check.tip,
        checked: checked,
      };
    });
    var totalPoints = checklist.reduce(function (sum, check) {
      return sum + (check.checked ? check.points : 0);
    }, 0);
    var score = Math.round((totalPoints / maxPoints) * 100);
    var allStar = score >= 90;
    var industryHeadlines = HEADLINES[normalized.industry];

    return {
      input: normalized,
      totalPoints: totalPoints,
      maxPoints: maxPoints,
      score: score,
      allStar: allStar,
      pointsToAllStar: allStar ? 0 : Math.max(0, Math.round(0.9 * maxPoints - totalPoints)),
      checklist: checklist,
      headlines: LEVELS.map(function (level) {
        return {
          level: level,
          text: industryHeadlines[level],
          recommended: level === normalized.level,
        };
      }),
      keywords: KEYWORDS[normalized.industry].slice(),
      growthTip: GROWTH_TIPS[normalized.connections],
      postingStrategy: POSTING_STRATEGY,
    };
  }

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.LinkedInOptimizerEngine = {
    calculate: calculate,
    normalize: normalize,
  };
})(typeof window !== "undefined" ? window : globalThis);
