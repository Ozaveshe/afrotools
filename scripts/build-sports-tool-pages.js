const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PAGES = [
  {
    id: 'betting-odds',
    title: 'Football Betting Odds Calculator',
    seoTitle: 'Football Betting Odds Calculator - Value, Profit, Implied Probability | AfroTools',
    description: 'Convert football betting odds, calculate profit, implied probability, expected value, fair odds, and stake returns for African bettors.',
    eyebrow: 'Odds and value',
    h1: 'Football Betting Odds Calculator',
    intro: 'Turn a betting slip into a decision. Convert odds formats, compare the market implied chance against your own estimate, and see whether the bet is positive value.',
    promise: ['Decimal, fractional, American, and local multiplier odds.', 'Expected value and fair-odds comparison.', 'Currency-aware stake and payout planning.']
  },
  {
    id: 'afcon-predictor',
    title: 'AFCON Tournament Predictor',
    seoTitle: 'AFCON Tournament Predictor - 2025 Review and 2027 Planning | AfroTools',
    description: 'Model AFCON title probability, compare contenders, and run 2025 review or 2027 planning assumptions with official CAF context.',
    eyebrow: 'Tournament model',
    h1: 'AFCON Tournament Predictor',
    intro: 'Stress-test African national teams with a transparent title model. Use it for 2025 review content, 2027 planning, fan analysis, and pre-tournament scenario writing.',
    promise: ['Top contender ranking across a 24-team field.', 'Adjustable form, defensive, and host assumptions.', 'Official CAF source card for tournament and appeal context.']
  },
  {
    id: 'fantasy-football',
    title: 'Fantasy Football Points Calculator',
    seoTitle: 'Fantasy Football Points Calculator - FPL 2025/26, AFCON, BetKing | AfroTools',
    description: 'Calculate fantasy football points with 2025/26 FPL scoring, captaincy, clean sheets, saves, bonus, cards, and defensive contributions.',
    eyebrow: 'FPL 2025/26',
    h1: 'Fantasy Football Points Calculator',
    intro: 'Score a player performance before the official table settles. The calculator includes the 2025/26 defensive contribution rule so deeper midfielders and defenders are not undercounted.',
    promise: ['Position-specific goals, clean sheets, saves, and concessions.', 'Captain and triple-captain multipliers.', 'Official Premier League scoring reference.']
  },
  {
    id: 'betting-tax',
    title: 'Sports Betting Tax Calculator',
    seoTitle: 'Sports Betting Tax Calculator Africa - Net Payout and WHT | AfroTools',
    description: 'Estimate betting tax, winnings withholding, deposit duty, net payout, and net profit for priority African betting markets.',
    eyebrow: 'Tax and payout',
    h1: 'Sports Betting Tax Calculator',
    intro: 'Separate the sportsbook headline payout from what actually reaches the player. Model deposit duty, winnings withholding, and custom country rates without hiding the assumptions.',
    promise: ['Nigeria Lagos, Kenya, Ghana, Tanzania, South Africa, and custom mode.', 'Deposit duty and WHT shown separately.', 'Official-source cards for Kenya and Ghana changes.']
  },
  {
    id: 'streaming-royalties',
    title: 'Music Streaming Royalty Calculator',
    seoTitle: 'Music Streaming Royalty Calculator - Spotify, Apple, Boomplay, Audiomack | AfroTools',
    description: 'Estimate artist streaming income across Spotify, Apple Music, Boomplay, Audiomack, YouTube Music, Deezer, and Tidal after distributor and split assumptions.',
    eyebrow: 'Creator earnings',
    h1: 'Music Streaming Royalty Calculator',
    intro: 'Give artists a grounded royalty planner instead of a fantasy number. Estimate platform mix, distributor fees, master share, publishing share, and streams needed for a target.',
    promise: ['Africa-relevant platform mix including Boomplay and Audiomack.', 'Distributor, master, and songwriter split controls.', 'Clear warning that streaming services do not pay one fixed rate.']
  },
  {
    id: 'nollywood-box-office',
    title: 'Nollywood Box Office Estimator',
    seoTitle: 'Nollywood Box Office Estimator - Producer Recoupment and ROI | AfroTools',
    description: 'Estimate Nollywood film recoupment from admissions, ticket price, cinema split, distributor fee, streaming deals, brand tie-ins, budget, and marketing.',
    eyebrow: 'Film recoupment',
    h1: 'Nollywood Box Office Estimator',
    intro: 'Model producer-side economics before a release campaign gets emotional. Box office gross is only the start; this shows cinema share, distributor fee, streaming, sponsors, and break-even admissions.',
    promise: ['Producer revenue after exhibitor and distributor split.', 'Break-even admissions and ROI.', 'FilmOne yearbook source card for market benchmarking.']
  },
  {
    id: 'dj-booking-rate',
    title: 'DJ Booking Rate Calculator',
    seoTitle: 'DJ Booking Rate Calculator Africa - Wedding, Club, Festival Rates | AfroTools',
    description: 'Build a DJ quote for weddings, clubs, festivals, corporate events, and private parties across African markets with equipment and travel lines.',
    eyebrow: 'Quote builder',
    h1: 'DJ Booking Rate Calculator',
    intro: 'A useful DJ quote should explain itself. Price the performance, equipment, peak-date pressure, crowd size, travel, and deposit separately so clients understand the fee.',
    promise: ['Country-aware quote benchmarks.', 'Equipment and logistics lines.', 'Suggested deposit and quote range.']
  },
  {
    id: 'concert-budget',
    title: 'Concert and Festival Budget Planner',
    seoTitle: 'Concert and Festival Budget Planner - Break-even Ticket Price | AfroTools',
    description: 'Plan concert or festival economics with capacity, ticket tiers, sponsorship, artist fees, venue, production, security, marketing, ticketing fees, and contingency.',
    eyebrow: 'Break-even plan',
    h1: 'Concert and Festival Budget Planner',
    intro: 'Before announcing a lineup, test the economics. This planner connects ticket yield, sponsorship, artist guarantees, venue, production, security, marketing, fees, and contingency.',
    promise: ['Break-even average ticket price.', 'Sponsor cover and contingency visibility.', 'Profit warning before the event is announced.']
  },
  {
    id: 'gym-roi-business',
    title: 'Gym and Fitness Center ROI Calculator',
    seoTitle: 'Gym and Fitness Center ROI Calculator Africa - Members, Churn, Payback | AfroTools',
    description: 'Estimate gym profitability, break-even members, startup payback, LTV/CAC, churn impact, and monthly operating profit in African markets.',
    eyebrow: 'Fitness business',
    h1: 'Gym and Fitness Center ROI Calculator',
    intro: 'A gym succeeds or fails on member economics. Calculate operating profit, break-even members, startup payback, churn, LTV/CAC, and equipment finance pressure.',
    promise: ['Break-even member count.', 'Retention and acquisition economics.', 'Startup payback in months.']
  },
  {
    id: 'event-ticket-revenue',
    title: 'Event Ticket Revenue Calculator',
    seoTitle: 'Event Ticket Revenue Calculator - VIP, Regular, Student, Fees | AfroTools',
    description: 'Calculate net event ticket revenue across VIP, regular, and student tiers after platform fees, gateway fees, refunds, marketing, comps, and fixed costs.',
    eyebrow: 'Ticket yield',
    h1: 'Event Ticket Revenue Calculator',
    intro: 'Ticket revenue can look healthy until fees, refunds, comps, and marketing are deducted. This tool shows the real yield from VIP, regular, and student tiers.',
    promise: ['Tier-by-tier gross revenue.', 'Platform, gateway, refund, and marketing deductions.', 'Comp ticket capacity warning.']
  },
  {
    id: 'match-tickets',
    title: 'Match Ticket Price Comparator',
    seoTitle: 'Match Ticket Price Comparator Africa - League, Derby, VIP, Season Pass | AfroTools',
    description: 'Compare football match ticket cost by country, competition level, seat type, demand, purchase channel, quantity, and season pass value.',
    eyebrow: 'Football tickets',
    h1: 'Match Ticket Price Comparator',
    intro: 'Compare a match-day ticket before paying gate or reseller prices. The comparator adjusts for country, competition level, seat type, rivalry demand, channel fees, and season-pass value.',
    promise: ['Single-match and multi-ticket cost.', 'Official online, gate, and reseller channel comparison.', 'Season pass per-match value check.']
  },
  {
    id: 'sports-scholarship',
    title: 'Sports Scholarship Eligibility Checker',
    seoTitle: 'Sports Scholarship Eligibility Checker - NCAA, NAIA, UK, Canada | AfroTools',
    description: 'Check sports scholarship readiness for NCAA, NAIA, UK, and Canada pathways with GPA, core courses, age, transcripts, video, English score, and competition level.',
    eyebrow: 'Student-athlete',
    h1: 'Sports Scholarship Eligibility Checker',
    intro: 'Help African athletes understand the recruiting gap before paying an agent. Score athletic proof, academics, documents, video, English readiness, and timing against the target pathway.',
    promise: ['NCAA, NAIA, UK, and Canada pathway modes.', 'Document and highlight-video checklist.', 'Official NCAA and NAIA source cards.']
  },
  {
    id: 'athlete-earnings',
    title: 'Athlete Career Earnings Calculator',
    seoTitle: 'Athlete Career Earnings Calculator Africa - Salary, Endorsements, Savings | AfroTools',
    description: 'Project athlete career earnings by sport, country, level, salary, endorsements, contract growth, agent fees, tax reserve, injury reserve, and savings rate.',
    eyebrow: 'Career finance',
    h1: 'Athlete Career Earnings Calculator',
    intro: 'A sports career can be short and uneven. Project contract income, endorsements, agent fees, tax reserve, injury reserve, savings, and next-contract targets.',
    promise: ['Career gross and net estimate.', 'Agent, tax, and injury reserves.', 'Savings and next-contract target.']
  },
  {
    id: 'gaming-pc-build',
    title: 'Gaming PC Build Calculator for Africa',
    seoTitle: 'Gaming PC Build Calculator Africa - GPU, CPU, FPS, Import Uplift | AfroTools',
    description: 'Allocate a gaming PC budget across GPU, CPU, RAM, storage, motherboard, case, PSU, cooling, peripherals, and Africa import or retail uplift.',
    eyebrow: 'Parts budget',
    h1: 'Gaming PC Build Calculator for Africa',
    intro: 'Build for frames, not bragging rights. Convert a local budget into a balanced component plan after African retail or import uplift, then see the likely gaming tier.',
    promise: ['GPU-first budget allocation.', 'Local retail vs import uplift.', 'Expected esports, AAA, or creator performance tier.']
  },
  {
    id: 'photo-video-pricing',
    title: 'Photography and Videography Pricing Tool',
    seoTitle: 'Photography and Videography Pricing Tool Africa - Wedding, Event, Commercial | AfroTools',
    description: 'Build a photo or video quote with shoot days, editing, crew, gear, deliverables, travel, rush delivery, and usage rights across African markets.',
    eyebrow: 'Creative quote',
    h1: 'Photography and Videography Pricing Tool',
    intro: 'Creative pricing should protect time, gear, and usage rights. Quote shoot days, editing, crew, rental, deliverables, rush, travel, and campaign usage without guessing.',
    promise: ['Wedding, event, portrait, real estate, music video, and commercial modes.', 'Usage-rights and rush-delivery lines.', 'Deposit, shoot fee, edit fee, and add-on breakdown.']
  }
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);
}

function jsonLd(page) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: page.title,
    description: page.description,
    url: `https://afrotools.com/tools/${page.id}/`,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    provider: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' }
  });
}

function breadcrumbLd(page) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://afrotools.com/' },
      { '@type': 'ListItem', position: 2, name: 'Sports and Entertainment', item: 'https://afrotools.com/sports/' },
      { '@type': 'ListItem', position: 3, name: page.title, item: `https://afrotools.com/tools/${page.id}/` }
    ]
  });
}

function renderPage(page) {
  const promise = page.promise.concat(['PDF-ready report unlock, lead capture, and dashboard save after the result.']).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  return `<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.e57fe38a.min.js" lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(page.seoTitle)}</title>
<meta name="description" content="${escapeHtml(page.description)}">
<link rel="canonical" href="https://afrotools.com/tools/${escapeHtml(page.id)}/">
<meta property="og:title" content="${escapeHtml(page.title)} | AfroTools">
<meta property="og:description" content="${escapeHtml(page.description)}">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://afrotools.com/tools/${escapeHtml(page.id)}/">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">
<script type="application/ld+json">${jsonLd(page)}</script>
<script type="application/ld+json">${breadcrumbLd(page)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f"><link rel="stylesheet" href="/assets/css/global.min.css?v=c94dde91"><link rel="stylesheet" href="/assets/css/energy.css?v=f8aae7a5"><link rel="stylesheet" href="/assets/css/sports-tools.css">
<script src="/assets/js/components/navbar.min.js?v=e84bb500" defer></script><script src="/assets/js/components/footer.min.js?v=d0d64671" defer></script>
</head>
<body data-sports-tool="${escapeHtml(page.id)}">
<afro-navbar theme="dark" active="sports"></afro-navbar>

<section class="en-tool-hero sports-hero">
<div class="container">
<nav class="en-breadcrumb" aria-label="Breadcrumb">
<a href="/">Home</a><span class="en-breadcrumb-sep">/</span>
<a href="/sports/">Sports and Entertainment</a><span class="en-breadcrumb-sep">/</span>
<span class="en-breadcrumb-current">${escapeHtml(page.title)}</span>
</nav>
<h1>${escapeHtml(page.h1)}</h1>
<p>${escapeHtml(page.intro)}</p>
<div class="en-tool-hero-meta">
<span class="en-tool-hero-pill">${escapeHtml(page.eyebrow)}</span>
<span class="en-tool-hero-pill">Africa-first assumptions</span>
<span class="en-tool-hero-pill">Free interactive calculator</span>
<span class="en-tool-hero-pill">PDF-ready report</span>
</div>
</div>
</section>

<main class="sports-page-main">
<div class="sports-tool-layout">
<section class="sports-tool-intro">
<div class="sports-tool-brief">
<h2>What this app does</h2>
<p>${escapeHtml(page.intro)}</p>
</div>
<div class="sports-tool-promise">
<h2>Built for this use case</h2>
<ul>${promise}</ul>
</div>
</section>
<div id="sports-tool-root" class="sports-tool-root"></div>
</div>
</main>

<afro-footer></afro-footer>
<script src="/assets/js/sports-toolkit.js"></script>
<script>window.AfroSports&&window.AfroSports.init&&window.AfroSports.init();</script>
</body>
</html>
`;
}

for (const page of PAGES) {
  const dir = path.join(ROOT, 'tools', page.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderPage(page), 'utf8');
}

console.log(`Built ${PAGES.length} sports tool pages.`);
