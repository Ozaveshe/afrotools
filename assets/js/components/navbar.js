/**
 * AFROTOOLS NAVBAR — Everything Platform Edition
 * Mega-menu with 34 categories from tool registry. Mobile drawer. Web Component.
 */
(function () {
  'use strict';

  const THEME_KEY = 'aft_theme';
  let darkModeRuntimePromise = null;

  function readThemePreference() {
    try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; }
  }

  function writeThemePreference(theme) {
    try {
      if (theme === 'dark' || theme === 'light') localStorage.setItem(THEME_KEY, theme);
      else localStorage.removeItem(THEME_KEY);
    } catch (_) {}
  }

  function effectiveTheme(theme) {
    var selected = theme || readThemePreference();
    if (selected === 'dark' || selected === 'light') return selected;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function syncThemeMeta(theme) {
    var active = effectiveTheme(theme);
    document.documentElement.style.colorScheme = active;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = active === 'dark' ? '#09111F' : '#F8FAFD';
  }

  function syncCountrySelectorThemes(theme) {
    var isDark = effectiveTheme(theme) === 'dark';
    var roots = [document];
    document.querySelectorAll('afro-navbar').forEach(function (nav) { if (nav.shadowRoot) roots.push(nav.shadowRoot); });
    roots.forEach(function (root) {
      root.querySelectorAll('afro-country-selector').forEach(function (selector) {
        if (isDark) selector.setAttribute('data-theme-dark', '');
        else selector.removeAttribute('data-theme-dark');
      });
    });
  }

  function ensureDarkModeRuntime() {
    if (window.AfroTools && window.AfroTools.darkMode) return Promise.resolve(window.AfroTools.darkMode);
    if (darkModeRuntimePromise) return darkModeRuntimePromise;
    darkModeRuntimePromise = new Promise(function (resolve) {
      var settled = false;
      var finish = function () { if (!settled) { settled = true; resolve(window.AfroTools && window.AfroTools.darkMode || null); } };
      var loadDirect = function () {
        var existing = document.querySelector('script[src*="/assets/js/lib/dark-mode.js"]');
        if (existing) { existing.addEventListener('load', finish, { once: true }); existing.addEventListener('error', finish, { once: true }); return; }
        var script = document.createElement('script');
        script.src = '/assets/js/lib/dark-mode.js';
        script.onload = finish; script.onerror = finish; document.head.appendChild(script);
      };
      var core = document.querySelector('script[src*="/assets/js/bundles/core."]');
      if (core) {
        core.addEventListener('load', finish, { once: true });
        core.addEventListener('error', loadDirect, { once: true });
        setTimeout(function () { if (!settled && !(window.AfroTools && window.AfroTools.darkMode)) loadDirect(); else finish(); }, 1500);
      } else loadDirect();
    });
    return darkModeRuntimePromise;
  }

  function applyThemePreference(theme, options) {
    var selected = theme === 'dark' || theme === 'light' ? theme : 'auto';
    writeThemePreference(selected);
    var active = effectiveTheme(selected);
    document.documentElement.setAttribute('data-theme', active);
    document.documentElement.setAttribute('data-theme-choice', selected);
    syncThemeMeta(active);
    syncCountrySelectorThemes(active);
    var runtime = window.AfroTools && window.AfroTools.darkMode;
    if (runtime && typeof runtime.set === 'function') runtime.set(selected);
    else {
      ensureDarkModeRuntime();
      if (!options || !options.silent) document.dispatchEvent(new CustomEvent('afrotools:theme-change', { detail: { theme: selected, activeTheme: active, isDark: active === 'dark' } }));
    }
  }

  applyThemePreference(readThemePreference() || 'auto', { silent: true });

  // NAVBAR_CSS_HREF_START
  const NAVBAR_CSS_HREF = '/assets/css/navbar.min.css?v=b7a1deaf';
  // NAVBAR_CSS_HREF_END

  // NAVBAR_TOP_LEVEL_DATA_START
  let NAV_ITEMS = [
    {
      "id": "financial",
      "label": "Salary & Tax",
      "labelFr": "Salaire & Impôts",
      "labelSw": "Mshahara & Kodi",
      "icon": "💰",
      "desc": "PAYE, income tax, FX, crypto",
      "descFr": "PAYE, impôt, change, crypto",
      "descSw": "PAYE, kodi, sarafu, crypto",
      "href": "/salary-tax/",
      "hrefFr": "/fr/salary-tax/",
      "hrefSw": "/sw/mshahara-na-kodi/",
      "color": "#e8f0fd",
      "accent": "#0062CC"
    },
    {
      "id": "hr-payroll",
      "label": "HR & Payroll",
      "labelFr": "RH & Paie",
      "labelSw": "Rasilimali Watu",
      "icon": "💼",
      "desc": "Employee cost, leave, severance",
      "descFr": "Coût employé, congés, licenciement",
      "descSw": "Gharama, likizo, fidia",
      "href": "/hr-payroll/",
      "hrefHa": "/ha/albashi-da-haraji/",
      "color": "#f0fdfa",
      "accent": "#0d9488"
    },
    {
      "id": "document-pdf",
      "label": "Document & PDF",
      "labelFr": "Documents & PDF",
      "labelSw": "Nyaraka na PDF",
      "icon": "📄",
      "desc": "Merge, split, compress, convert",
      "descFr": "Fusionner, diviser, compresser, convertir",
      "descSw": "Unganisha, gawanya, bana, badilisha",
      "href": "/document-pdf/",
      "hrefFr": "/fr/document-pdf/",
      "hrefSw": "/sw/hati-na-pdf/",
      "hrefHa": "/ha/takardu-da-pdf/",
      "hrefYo": "/yo/iwe-ati-pdf/",
      "color": "#eff6ff",
      "accent": "#3b82f6"
    },
    {
      "id": "image-design",
      "label": "Image & Design",
      "labelFr": "Image & Design",
      "labelSw": "Picha na Ubunifu",
      "icon": "🖼️",
      "desc": "Compress, resize, QR codes",
      "descFr": "Compresser, redimensionner, codes QR",
      "descSw": "Bana, badilisha ukubwa, misimbo QR",
      "href": "/image-design/",
      "hrefFr": "/fr/image-design/",
      "color": "#fdf2f8",
      "accent": "#ec4899"
    },
    {
      "id": "developer",
      "label": "Developer Tools",
      "labelFr": "Outils Dev",
      "labelSw": "Zana za Wasanidi",
      "icon": "⌨️",
      "desc": "JSON, Base64, hash, regex",
      "descFr": "JSON, Base64, hachage, regex",
      "descSw": "JSON, Base64, hash, regex",
      "href": "/developer-tools/",
      "hrefFr": "/fr/developer-tools/",
      "color": "#ede9fe",
      "accent": "#8b5cf6"
    },
    {
      "id": "education",
      "label": "Education",
      "labelFr": "Éducation",
      "labelSw": "Elimu",
      "icon": "🎓",
      "desc": "GPA, WAEC, loans, fees",
      "descFr": "GPA, WAEC, prêts, frais scolaires",
      "descSw": "GPA, NECTA, mikopo, ada",
      "href": "/education/",
      "hrefFr": "/fr/education/",
      "hrefSw": "/sw/elimu/",
      "color": "#EEF4FF",
      "accent": "#3B82F6"
    },
    {
      "id": "health",
      "label": "Health & Wellness",
      "labelFr": "Santé & Bien-être",
      "labelSw": "Afya na Ustawi",
      "icon": "🏥",
      "desc": "Disease tools, hospital costs, nutrition — 27 tools, always free",
      "descFr": "Maladies, frais d'hôpital, nutrition — 27 outils",
      "descSw": "Magonjwa, gharama za hospitali, lishe — zana 27",
      "href": "/health/",
      "hrefFr": "/fr/health/",
      "hrefSw": "/sw/afya/",
      "hrefYo": "/yo/ilera/",
      "color": "#fce8e8",
      "accent": "#dc2626"
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "labelFr": "Assurance",
      "labelSw": "Bima",
      "icon": "🛡️",
      "desc": "Car, health, life, funeral, business, travel — 300+ calculators, 54 countries",
      "descFr": "Auto, santé, vie, obsèques, entreprise, voyage — 300+ calculateurs, 54 pays",
      "descSw": "Gari, afya, maisha, mazishi, biashara, safari — vikokotoo 300+, nchi 54",
      "href": "/insurance/",
      "hrefFr": "/fr/health-insurance/",
      "color": "#f0f4f8",
      "accent": "#1e3a5f"
    },
    {
      "id": "fintech",
      "label": "Fintech & Banking",
      "labelFr": "Fintech & Banque",
      "labelSw": "Fintech na Benki",
      "icon": "💳",
      "desc": "Savings, loans, mobile money, remittance — 54 countries",
      "descFr": "Épargne, prêts, mobile money, transferts — 54 pays",
      "descSw": "Akiba, mikopo, pesa za simu, uhamisho — nchi 54",
      "href": "/fintech/",
      "color": "#f5f3ff",
      "accent": "#8b5cf6"
    },
    {
      "id": "agriculture",
      "label": "Agriculture",
      "labelFr": "Agriculture",
      "labelSw": "Kilimo",
      "labelHa": "Noma",
      "icon": "🌾",
      "desc": "Crop yield, seed rate, fertilizer, irrigation, farm profit — 54 countries",
      "descFr": "Rendement, semences, engrais, irrigation, profit agricole — 54 pays",
      "descSw": "Mavuno, mbegu, mbolea, umwagiliaji, faida ya shamba — nchi 54",
      "descHa": "Amfanin gona, taki, riba, rogo da kasuwa ga Najeriya",
      "href": "/agriculture/",
      "hrefFr": "/fr/agriculture/",
      "hrefSw": "/sw/kilimo/",
      "hrefHa": "/ha/noma/",
      "hrefYo": "/yo/ogbin/",
      "color": "#E8F2FF",
      "accent": "#0062CC"
    },
    {
      "id": "ecommerce",
      "label": "VAT & Business Tax",
      "labelFr": "TVA & Fiscalité",
      "labelSw": "VAT na Kodi",
      "icon": "🧾",
      "desc": "VAT, margins, break-even",
      "descFr": "TVA, marges, seuil de rentabilité",
      "descSw": "VAT, faida, hatua ya usawa",
      "href": "/vat-business-tax/",
      "hrefFr": "/fr/vat-business-tax/",
      "hrefSw": "/sw/vat-na-kodi/",
      "hrefHa": "/ha/kasuwanci-da-haraji/",
      "hrefYo": "/yo/owo-ori-owo-ise/",
      "color": "#fff7ed",
      "accent": "#f59e0b"
    },
    {
      "id": "legal",
      "label": "Legal & Compliance",
      "labelFr": "Juridique & Conformité",
      "labelSw": "Kisheria & Uzingatiaji",
      "icon": "⚖️",
      "desc": "Business registration, contracts, data privacy, personal legal — 54 countries",
      "descFr": "Enregistrement, contrats, confidentialité, juridique personnel — 54 pays",
      "descSw": "Usajili wa biashara, mikataba, faragha ya data, kisheria — nchi 54",
      "href": "/legal/",
      "hrefFr": "/fr/legal/",
      "color": "#f5f3ff",
      "accent": "#7c3aed"
    },
    {
      "id": "data-productivity",
      "label": "Business & ROI",
      "labelFr": "Business & ROI",
      "labelSw": "Biashara na Faida",
      "icon": "📊",
      "desc": "Productivity, data, investment",
      "descFr": "Productivité, données, investissement",
      "descSw": "Tija, data, uwekezaji",
      "href": "/data-productivity/",
      "hrefFr": "/fr/data-productivity/",
      "hrefSw": "/sw/data-na-tija/",
      "color": "#eef2ff",
      "accent": "#6366f1"
    },
    {
      "id": "language",
      "label": "Language & Translation",
      "labelFr": "Langues & Traduction",
      "labelSw": "Lugha na Tafsiri",
      "icon": "🗣️",
      "desc": "Yoruba, Swahili, Hausa, Amharic",
      "descFr": "Yoruba, Swahili, Haoussa, Amharique",
      "descSw": "Kiyoruba, Kiswahili, Kihausa, Kiamhari",
      "href": "/language/",
      "hrefFr": "/fr/language/",
      "hrefSw": "/sw/lugha-na-tafsiri/",
      "hrefHa": "/ha/harshe-da-fassara/",
      "hrefYo": "/yo/ede-ati-itumo/",
      "color": "#faf5ff",
      "accent": "#a855f7"
    },
    {
      "id": "african",
      "label": "Uniquely African",
      "labelFr": "Spécialités Africaines",
      "labelSw": "Vya Kiafrika",
      "icon": "🌍",
      "desc": "Japa, generator, ajo, mobile money",
      "descFr": "Épargne collective, mobile money, recettes",
      "descSw": "Japa, jenereta, chama, pesa za simu",
      "href": "/african/",
      "hrefFr": "/fr/african/",
      "color": "#fef2f2",
      "accent": "#dc2626"
    },
    {
      "id": "francophone",
      "label": "Outils en Français",
      "icon": "🇫🇷",
      "desc": "Salaire net, TVA — 14 pays",
      "href": "/fr/",
      "color": "#eef6ff",
      "accent": "#0055A4"
    },
    {
      "id": "trade",
      "label": "Trade & Import",
      "labelFr": "Commerce & Import",
      "labelSw": "Biashara na Uagizaji",
      "icon": "🚢",
      "desc": "LC, duties, incoterms, ECOWAS, SADC, AfCFTA",
      "descFr": "LC, droits de douane, incotermes",
      "descSw": "LC, ushuru, incoterms, ECOWAS, SADC, AfCFTA",
      "href": "/trade/",
      "hrefFr": "/fr/trade/",
      "color": "#E8F2FF",
      "accent": "#0062CC"
    },
    {
      "id": "telecom",
      "label": "Telecom & Mobile",
      "labelFr": "Télécom & Mobile",
      "labelSw": "Mawasiliano",
      "icon": "📱",
      "desc": "Data plans, USSD codes, roaming, ISPs",
      "descFr": "Forfaits data, codes USSD, itinérance",
      "descSw": "Mipango ya data, misimbo ya USSD",
      "href": "/telecom/",
      "hrefSw": "/sw/mawasiliano-na-mtandao/",
      "hrefHa": "/ha/sadarwa/",
      "hrefYo": "/yo/ibaraenisoro/",
      "color": "#ECFEFF",
      "accent": "#06B6D4"
    },
    {
      "id": "energy",
      "label": "Energy & Utilities",
      "labelFr": "Énergie & Utilitaires",
      "labelSw": "Nishati na Huduma",
      "icon": "⚡",
      "desc": "Electricity tariff, solar ROI, generator fuel, water bills",
      "descFr": "Tarifs électricité, ROI solaire, coût générateur",
      "descSw": "Umeme, jua, mafuta ya jenereta, bili ya maji",
      "href": "/energy/",
      "hrefFr": "/fr/energy/",
      "color": "#FFFBEB",
      "accent": "#F59E0B"
    },
    {
      "id": "engineering",
      "label": "Engineering",
      "labelFr": "Ingénierie",
      "labelSw": "Uhandisi",
      "icon": "🔧",
      "desc": "BOQ, concrete, electrical, rebar, roofing, construction budgets",
      "descFr": "Métré, béton, électrique, ferraillage",
      "descSw": "BOQ, zege, umeme, nondo, paa",
      "href": "/engineering/",
      "hrefSw": "/sw/ujenzi-na-uhandisi/",
      "color": "#f5f5f4",
      "accent": "#78716c"
    },
    {
      "id": "government",
      "label": "Government & Civic",
      "labelFr": "Gouvernement & Civique",
      "labelSw": "Serikali na Uraia",
      "icon": "🏛️",
      "desc": "Passports, ID, voter registration, pensions, land fees — 20 tools",
      "descFr": "Passeports, identité, vote, retraites, foncier — 20 outils",
      "descSw": "Pasipoti, vitambulisho, upigaji kura, pensheni — zana 20",
      "href": "/government/",
      "color": "#eff6ff",
      "accent": "#1d4ed8"
    },
    {
      "id": "small-business",
      "label": "Small Business",
      "labelFr": "Petites Entreprises",
      "labelSw": "Biashara Ndogo",
      "icon": "🏪",
      "desc": "POS agents, mini-importation, market stalls, e-commerce — 45 tools",
      "descFr": "Agents POS, mini-import, marchés, e-commerce — 45 outils",
      "descSw": "Wakala wa POS, uagizaji, masoko, e-commerce — zana 45",
      "href": "/small-business/",
      "color": "#fff7ed",
      "accent": "#ea580c"
    },
    {
      "id": "transport",
      "label": "Transport & Logistics",
      "labelFr": "Transport & Logistique",
      "labelSw": "Usafiri na Usafirishaji",
      "icon": "🚛",
      "desc": "Fuel, vehicle import, ride fares, boda-boda — 54 countries",
      "descFr": "Carburant, importation véhicule, tarifs taxi, logistique — 54 pays",
      "descSw": "Mafuta, gari, nauli, boda-boda — nchi 54",
      "href": "/transport/",
      "hrefFr": "/fr/transport/",
      "color": "#fef3c7",
      "accent": "#d97706"
    },
    {
      "id": "personal-finance",
      "label": "Personal Finance",
      "labelFr": "Finance Personnelle",
      "labelSw": "Fedha Binafsi",
      "icon": "💼",
      "desc": "Budgeting, life events, tax extensions — 25 tools for African realities",
      "descFr": "Budget, événements de vie, impôts — 25 outils pour réalités africaines",
      "descSw": "Bajeti, matukio ya maisha, kodi — zana 25 kwa hali ya Afrika",
      "href": "/personal-finance/",
      "color": "#f0fdf4",
      "accent": "#16a34a"
    },
    {
      "id": "diaspora",
      "label": "Diaspora",
      "labelFr": "Diaspora",
      "labelSw": "Diaspora",
      "icon": "✈️",
      "desc": "Visa tracking, immigration, remittances — 17 tools for Africans abroad",
      "descFr": "Visa, immigration, transferts — 17 outils pour Africains à l'étranger",
      "descSw": "Visa, uhamiaji, uhamisho — zana 17 kwa Waafrika nje",
      "href": "/diaspora/",
      "color": "#eff6ff",
      "accent": "#2563eb"
    },
    {
      "id": "religious-cultural",
      "label": "Religious & Cultural",
      "labelFr": "Religieux & Culturel",
      "labelSw": "Dini na Utamaduni",
      "icon": "🕌",
      "desc": "Zakat, prayer times, Ramadan, halal, proverbs — Islamic, Christian & Traditional",
      "descFr": "Zakat, heures de prière, Ramadan, halal, proverbes — Islam, Christianisme & Tradition",
      "descSw": "Zaka, nyakati za sala, Ramadhan, halali, methali — Kiislamu, Kikristo & Jadi",
      "href": "/religious-cultural/",
      "color": "#fffbeb",
      "accent": "#d97706"
    },
    {
      "id": "climate",
      "label": "Climate & Environment",
      "labelFr": "Climat & Environnement",
      "labelSw": "Hali ya Hewa na Mazingira",
      "icon": "🌿",
      "desc": "Carbon credits, drought risk, flood risk, air quality, e-waste — 54 countries",
      "descFr": "Crédits carbone, risque sécheresse, qualité air, déchets — 54 pays",
      "descSw": "Mikopo ya kaboni, ukame, mafuriko, hali ya hewa — nchi 54",
      "href": "/climate/",
      "color": "#f0fdf4",
      "accent": "#059669"
    },
    {
      "id": "sports",
      "label": "Sports & Entertainment",
      "labelFr": "Sports & Divertissement",
      "labelSw": "Michezo na Burudani",
      "icon": "⚽",
      "desc": "Betting odds, AFCON predictor, music royalties, Nollywood — 54 countries",
      "descFr": "Cotes paris, prédicteur AFCON, redevances musicales, Nollywood — 54 pays",
      "descSw": "Uwezekano wa kubeti, AFCON, mrabaha wa muziki — nchi 54",
      "href": "/sports/",
      "color": "#fdf4ff",
      "accent": "#9333ea"
    },
    {
      "id": "mining",
      "label": "Mining & Extractives",
      "labelFr": "Mines & Extractives",
      "labelSw": "Madini na Uchimbaji",
      "icon": "⛏️",
      "desc": "Gold, diamonds, oil, mining royalties — Africa holds 30% of world minerals",
      "descFr": "Or, diamants, pétrole, redevances minières — l'Afrique détient 30% des minéraux",
      "descSw": "Dhahabu, almasi, mafuta, mrabaha wa madini — Afrika ina 30% ya madini",
      "href": "/mining/",
      "color": "#fef9c3",
      "accent": "#ca8a04"
    },
    {
      "id": "creative",
      "label": "Creative Economy",
      "labelFr": "Économie Créative",
      "labelSw": "Uchumi wa Ubunifu",
      "icon": "🎨",
      "desc": "Music royalties, Nollywood, African fashion, content creator tools",
      "descFr": "Droits musicaux, Nollywood, mode africaine, créateurs de contenu",
      "descSw": "Mrabaha wa muziki, Nollywood, mitindo ya Afrika, waundaji wa maudhui",
      "href": "/creative/",
      "color": "#FDF4FF",
      "accent": "#DB2777"
    },
    {
      "id": "afrostream",
      "label": "AfroStream",
      "labelFr": "AfroStream",
      "labelSw": "AfroStream",
      "icon": "🎬",
      "desc": "African creator streaming hub — live streams, rankings, net worth, news",
      "descFr": "Hub de streaming pour créateurs africains — lives, classements, actualités",
      "descSw": "Kituo cha utiririshaji wa waundaji wa Afrika — moja kwa moja, viwango",
      "href": "/tools/afrostream/",
      "color": "#FAF5FF",
      "accent": "#A855F7"
    },
    {
      "id": "security",
      "label": "Security & Safety",
      "labelFr": "Sécurité & Sûreté",
      "labelSw": "Usalama na Ulinzi",
      "icon": "🔒",
      "desc": "Home security, cybersecurity, business continuity, risk",
      "descFr": "Sécurité domicile, cybersécurité, continuité d'activité",
      "descSw": "Usalama wa nyumba, mtandao, uendelevu wa biashara",
      "href": "/security/",
      "color": "#F8FAFC",
      "accent": "#475569"
    },
    {
      "id": "travel",
      "label": "Travel & Tourism",
      "labelFr": "Voyage & Tourisme",
      "labelSw": "Usafiri na Utalii",
      "icon": "🌍",
      "desc": "Safari cost, beach holidays, airport transfers, packing lists",
      "descFr": "Coût safari, vacances plage, transferts aéroport, listes d'emballage",
      "descSw": "Gharama ya safari, likizo pwani, usafiri wa uwanja",
      "href": "/travel/",
      "color": "#F0F9FF",
      "accent": "#0EA5E9"
    },
    {
      "id": "career",
      "label": "Career & Development",
      "labelFr": "Carrière & Développement",
      "labelSw": "Kazi na Maendeleo",
      "icon": "📈",
      "desc": "Salary negotiation, freelance, personal brand, retirement",
      "descFr": "Négociation salaire, freelance, marque personnelle, retraite",
      "descSw": "Mazungumzo ya mshahara, uhuru, chapa ya kibinafsi, kustaafu",
      "href": "/career/",
      "color": "#EEF2FF",
      "accent": "#6366F1"
    },
    {
      "id": "afrowork",
      "label": "AfroWork Suite",
      "labelFr": "Suite AfroWork",
      "labelSw": "Mfumo wa AfroWork",
      "icon": "⚙️",
      "desc": "Payroll OS, compliance calendar, salary database, AI labour law advisor, document generator",
      "descFr": "OS de paie, calendrier conformité, base salaires, conseiller juridique IA, générateur docs",
      "descSw": "Mfumo wa mishahara, kalenda ya uzingatifu, hifadhidata ya mishahara, mshauri wa kisheria AI",
      "href": "/afrowork/",
      "color": "#FFFBEB",
      "accent": "#D97706"
    }
  ];
  // NAVBAR_TOP_LEVEL_DATA_END
  const NAV_DATA_URL = '/assets/js/components/navbar-data.json';
  let SW_CATEGORY_HREFS = {};
  let HA_CATEGORY_HREFS = {};
  let YO_CATEGORY_HREFS = {};
  let TOOL_MENU_IDS = ['image-design','developer','education','health','insurance','fintech','agriculture','legal','language','trade','telecom','energy','engineering','government','transport','personal-finance'];
  let TOOL_MENU_COPY = {};
  let BUSINESS_LINKS = [];
  let SW_BUSINESS_LINKS = [];
  let HA_BUSINESS_LINKS = [];
  let YO_BUSINESS_LINKS = [];
  let COUNTRY_LINKS = [];
  let COUNTRY_LINKS_HA = [];
  let COUNTRY_LINKS_SW = [];
  let COUNTRY_LINKS_YO = [];
  let SW_DISCOVERY_OVERRIDES = {};
  let HA_DISCOVERY_OVERRIDES = {};
  let SW_SEARCH_INTENT_TARGETS = {};
  let SW_SEARCH_DIRECT_RESULTS = {};
  let navbarDataPromise = null;
  let navbarDataLoaded = false;

  function localizedItemText(item, field, lang) {
    var overrides = TOOL_MENU_COPY[lang] && TOOL_MENU_COPY[lang][item.id];
    if (overrides && overrides[field]) return overrides[field];
    if (lang === 'fr' && item[field + 'Fr']) return item[field + 'Fr'];
    if (lang === 'sw' && item[field + 'Sw']) return item[field + 'Sw'];
    return item[field] || '';
  }

  function localizedBusinessLinks(lang) {
    if (lang === 'sw') return SW_BUSINESS_LINKS;
    if (lang === 'ha') return HA_BUSINESS_LINKS;
    if (lang === 'yo') return YO_BUSINESS_LINKS;
    return BUSINESS_LINKS;
  }

  function localizedCountryLinks(lang) {
    if (lang === 'sw') return COUNTRY_LINKS_SW;
    if (lang === 'ha') return COUNTRY_LINKS_HA;
    if (lang === 'yo') return COUNTRY_LINKS_YO;
    return COUNTRY_LINKS;
  }

  function applyNavbarData(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.navItems)) throw new Error('Invalid navbar data');
    NAV_ITEMS = data.navItems;
    SW_CATEGORY_HREFS = data.swCategoryHrefs || {}; HA_CATEGORY_HREFS = data.haCategoryHrefs || {}; YO_CATEGORY_HREFS = data.yoCategoryHrefs || {};
    TOOL_MENU_IDS = data.toolMenuIds || TOOL_MENU_IDS; TOOL_MENU_COPY = data.toolMenuCopy || {};
    BUSINESS_LINKS = data.businessLinks || []; SW_BUSINESS_LINKS = data.swBusinessLinks || []; HA_BUSINESS_LINKS = data.haBusinessLinks || []; YO_BUSINESS_LINKS = data.yoBusinessLinks || [];
    COUNTRY_LINKS = data.countryLinks || []; COUNTRY_LINKS_HA = data.countryLinksHa || []; COUNTRY_LINKS_SW = data.countryLinksSw || []; COUNTRY_LINKS_YO = data.countryLinksYo || [];
    SW_DISCOVERY_OVERRIDES = data.swDiscoveryOverrides || {}; HA_DISCOVERY_OVERRIDES = data.haDiscoveryOverrides || {};
    SW_SEARCH_INTENT_TARGETS = data.swSearchIntentTargets || {}; SW_SEARCH_DIRECT_RESULTS = data.swSearchDirectResults || {};
    navbarDataLoaded = true;
    if (typeof _localizedGlobalNavItems === 'function') window.__AFRO_NAV_ITEMS = _localizedGlobalNavItems();
    window.__AFRO_BUSINESS_NAV_ITEMS = localizedBusinessLinks(_globalNavLang()).slice();
    document.dispatchEvent(new CustomEvent('afrotools:navbar-data-ready'));
    return data;
  }

  function ensureNavbarData() {
    if (navbarDataLoaded) return Promise.resolve(true);
    if (!navbarDataPromise) navbarDataPromise = fetch(NAV_DATA_URL, { credentials: 'same-origin', cache: 'force-cache' })
      .then(function (response) { if (!response.ok) throw new Error('Navbar data HTTP ' + response.status); return response.json(); })
      .then(applyNavbarData)
      .catch(function () { navbarDataPromise = null; return null; });
    return navbarDataPromise;
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.loadNavbarData = ensureNavbarData;
  const MARK = `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:30px;width:30px;flex-shrink:0">
    <polygon points="34,20 48,34 34,48 20,34" fill="#0062CC"/>
    <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
    <polygon points="34,48 44,60 34,68 24,60" fill="#0047AB"/>
    <polygon points="2,24  14,34 2,44  -10,34" fill="#0062CC" opacity="0.7"/>
    <polygon points="52,24 64,34 52,44 40,34"  fill="#0062CC" opacity="0.55"/>
  </svg>`;

  class AfroNavbar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._menuOpen = false;
      this._megaOpen = false;
      this._lockedScrollY = 0;
      this._bodyLocked = false;
    }

    connectedCallback() {
      this.classList.toggle('theme-dark', effectiveTheme() === 'dark');
      this._ensureLocalizedMobileCss();
      // P4-03: Inject favicon if not already present
      if (!document.querySelector('link[rel="icon"]')) {
        var link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = '/assets/img/logo-mark.svg';
        document.head.appendChild(link);
      }
      this._render(); this._bind();
      this._ensureLocalizationAssets();
      this._ensureLocaleRouteResolver();
    }

    disconnectedCallback() {
      if (this._bodyLocked) this._unlockBodyScroll();
      if (this._themeChangeFn) document.removeEventListener('afrotools:theme-change', this._themeChangeFn);
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      if (this._outsideFn) document.removeEventListener('click', this._outsideFn);
      if (this._langCloseFn) document.removeEventListener('click', this._langCloseFn);
      if (this._keydownFn) document.removeEventListener('keydown', this._keydownFn);
    }
    get active() { return this.getAttribute('active') || ''; }

    _getLang() {
      var segs = window.location.pathname.split('/');
      var first = segs[1];
      if (['fr','sw','yo','ha'].indexOf(first) !== -1) return first;
      return document.documentElement.lang || 'en';
    }

    _ensureLocalizedMobileCss() {
      if (['ha', 'sw'].indexOf(this._getLang()) === -1) return;
      if (document.getElementById('afrotools-localized-mobile-css')) return;
      var link = document.createElement('link');
      link.id = 'afrotools-localized-mobile-css';
      link.rel = 'stylesheet';
      link.href = '/assets/css/localized-mobile.css';
      document.head.appendChild(link);
    }

    _ensureLocaleRouteResolver() {
      if (window.AfroLocaleRouteResolver || document.querySelector('script[data-afro-locale-route-resolver]')) return;
      var script = document.createElement('script');
      script.src = '/assets/js/lib/locale-route-resolver.js';
      script.dataset.afroLocaleRouteResolver = 'true';
      script.addEventListener('load', () => {
        this._render();
        this._bind();
      });
      document.head.appendChild(script);
    }

    _ensureLocalizationAssets() {
      if (this._localizationLoading || (window.AfroTools && window.AfroTools.i18n && window.AfroToolsLocaleManifest)) return;
      this._localizationLoading = true;
      var sources = ['/assets/js/data/locale-manifest.js', '/assets/js/data/ui-translations.js', '/assets/js/lib/localization.js', '/assets/js/lib/localize-shared-ui.js'];
      var load = function(src) {
        return new Promise(function(resolve) {
          var existing = document.querySelector('script[src="' + src + '"], script[src$="' + src + '"]');
          if (existing) {
            if (existing.dataset.loaded === 'true') return resolve();
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', resolve, { once: true });
            return;
          }
          var script = document.createElement('script');
          script.src = src;
          script.addEventListener('load', function() { script.dataset.loaded = 'true'; resolve(); }, { once: true });
          script.addEventListener('error', resolve, { once: true });
          document.head.appendChild(script);
        });
      };
      sources.reduce(function(chain, src) { return chain.then(function() { return load(src); }); }, Promise.resolve()).then(() => {
        if (window.AfroToolsLocalization && window.AfroToolsLocaleManifest && window.AfroToolsTranslations) {
          window.AfroToolsLocalization.install({ root: window, manifest: window.AfroToolsLocaleManifest, catalogs: window.AfroToolsTranslations, locale: this._getLang() });
          this._render();
          this._bind();
        }
        this._localizationLoading = false;
      });
    }

    _translation(key, fallback) {
      var runtime = window.AfroTools && window.AfroTools.i18n;
      if (!runtime || typeof runtime.t !== 'function') return fallback;
      var resolved = runtime.t(key);
      return resolved && resolved.state !== 'missing' ? resolved.value : fallback;
    }

    _availableLocales() {
      var configured = window.AfroToolsLocaleManifest && window.AfroToolsLocaleManifest.locales;
      if (Array.isArray(configured) && configured.length) {
        return configured.filter(function(locale) { return ['default', 'launched', 'partial'].indexOf(locale.launchStatus) !== -1; });
      }
      return [
        { id: 'en', nativeName: 'English', launchStatus: 'default' },
        { id: 'fr', nativeName: 'Français', launchStatus: 'launched' },
        { id: 'sw', nativeName: 'Kiswahili', launchStatus: 'launched' },
        { id: 'yo', nativeName: 'Yorùbá', launchStatus: 'partial' },
        { id: 'ha', nativeName: 'Hausa', launchStatus: 'partial' }
      ];
    }

    _languageDestinationFor(targetLang, currentLang) {
      var alternates = {};
      Array.prototype.forEach.call(document.querySelectorAll('link[rel="alternate"][hreflang]'), function(link) {
        var lang = link.getAttribute('hreflang');
        var href = link.getAttribute('href');
        if (lang && href && !alternates[lang]) alternates[lang] = href;
      });
      var canonicalLink = document.querySelector('link[rel="canonical"]');
      var canonicalRoute = canonicalLink && canonicalLink.getAttribute('href') || window.location.pathname || '/';
      var coverageMeta = document.querySelector('meta[name="afrotools-locale-coverage"]');
      var fallbackMeta = document.querySelector('meta[name="afrotools-locale-fallback"]');
      var coverageState = coverageMeta && coverageMeta.getAttribute('content');
      var explicitFallback = fallbackMeta && fallbackMeta.getAttribute('content');
      if (coverageState === 'english-fallback' && explicitFallback) {
        alternates.en = explicitFallback;
        alternates['x-default'] = explicitFallback;
        if (targetLang !== currentLang) {
          var fallbackLabels = window.AfroLocaleRouteResolver && window.AfroLocaleRouteResolver.fallbackLabels || {};
          return {
            requestedLocale: targetLang,
            route: explicitFallback,
            relationship: 'english-fallback',
            label: fallbackLabels[targetLang] || fallbackLabels.en || 'English fallback',
            advertisedAsEquivalent: false
          };
        }
      }
      var resolver = window.AfroLocaleRouteResolver;
      if (resolver && typeof resolver.resolve === 'function') {
        return resolver.resolve({
          currentLocale: currentLang,
          targetLocale: targetLang,
          currentRoute: window.location.pathname || '/',
          canonicalRoute: canonicalRoute,
          alternates: alternates
        });
      }
      var nativeHref = alternates[targetLang];
      var labels = { en: 'English', fr: 'Fran?ais', sw: 'Kiswahili', yo: 'Yor?b?', ha: 'Hausa' };
      if (nativeHref) {
        return { requestedLocale: targetLang, route: nativeHref, relationship: 'equivalent', label: labels[targetLang] || targetLang, advertisedAsEquivalent: true };
      }
      var englishHref = alternates.en || alternates['x-default'] || canonicalRoute || '/';
      return { requestedLocale: targetLang, route: englishHref, relationship: 'english-fallback', label: (labels[targetLang] || targetLang) + ' unavailable ? English fallback', advertisedAsEquivalent: false };
    }

    _languageHrefFor(targetLang, currentLang) {
      return this._languageDestinationFor(targetLang, currentLang).route;
    }

    _langSwitcherHTML() {
      var cur = this._getLang();
      var LANGS = this._availableLocales().map(function(locale) { return { code: locale.id, label: locale.nativeName || locale.displayName || locale.id, launchStatus: locale.launchStatus }; });
      var curObj = LANGS.find(function(l){ return l.code === cur; }) || LANGS[0];
      var opts = LANGS.map(function(l) {
        var active = l.code === cur ? ' active' : '';
        var check = l.code === cur ? '✓' : '';
        var destination = this._languageDestinationFor(l.code, cur);
        var fallback = !destination.advertisedAsEquivalent && l.code !== cur;
        var fallbackClass = fallback ? ' fallback' : '';
        var fallbackLabel = fallback ? '<small class="lang-opt-fallback">' + this._escapeHtml(destination.label) + '</small>' : '';
        var partialLabel = l.launchStatus === 'partial' ? '<small class="lang-opt-partial">' + this._escapeHtml(this._translation('navigation.partialCoverage', 'Partial coverage')) + '</small>' : '';
        var ariaLabel = fallback ? ' aria-label="' + this._escapeHtml(l.label + ': ' + destination.label) + '"' : '';
        return '<a href="' + this._escapeHtml(destination.route) + '" data-locale-target="' + this._escapeHtml(l.code) + '" data-locale-relationship="' + this._escapeHtml(destination.relationship) + '" class="lang-opt' + active + fallbackClass + '"' + ariaLabel + '><span class="lang-opt-check">' + check + '</span><span class="lang-opt-label">' + l.label + partialLabel + fallbackLabel + '</span></a>';
      }, this).join('');
      var switchLabel = this._translation('navigation.changeLanguage', 'Change language');
      return '<div class="lang-switch"><button class="lang-btn" id="langBtn" type="button" aria-label="' + this._escapeHtml(switchLabel) + '"><span aria-hidden="true">🌐</span> <span class="lang-btn-label">' + curObj.label + '</span></button><div class="lang-drop" id="langDrop" role="menu" aria-label="' + this._escapeHtml(this._translation('accessibility.languageMenu', 'Language menu')) + '">' + opts + '</div></div>';
    }

    _navItems() {
      var lang = this._getLang();
      return (lang === 'fr' || lang === 'sw' || lang === 'yo' || lang === 'ha') ? NAV_ITEMS.filter(c => c.id !== 'francophone') : NAV_ITEMS;
    }

    _prepareNavData() {
      return ensureNavbarData().then((data) => {
        if (!data || !this.shadowRoot) return data;
        var sr = this.shadowRoot;
        var toolsGrid = sr.querySelector('.tools-mega-grid');
        var businessGrid = sr.querySelector('.business-mega-grid');
        var countryQuickLinks = sr.querySelector('.country-quick-links');
        var mobileCountries = sr.querySelector('.mob-country-grid');
        var mobileBusiness = sr.querySelector('.mob-business-block');
        var mobileCategories = sr.querySelector('#mobCategoriesWrap');
        if (toolsGrid) toolsGrid.innerHTML = this._megaContent();
        if (businessGrid) businessGrid.innerHTML = this._businessContent();
        if (countryQuickLinks) {
          var parser = document.createElement('div');
          parser.innerHTML = this._countriesContent();
          var hydratedLinks = parser.querySelector('.country-quick-links');
          if (hydratedLinks) countryQuickLinks.innerHTML = hydratedLinks.innerHTML;
        }
        if (mobileCountries) mobileCountries.innerHTML = this._mobileCountriesContent();
        if (mobileBusiness) {
          var businessLabel = mobileBusiness.querySelector('.mob-section-label');
          mobileBusiness.innerHTML = (businessLabel ? businessLabel.outerHTML : '') + this._mobileBusinessContent();
        }
        if (mobileCategories) {
          var categoryLabel = mobileCategories.querySelector('.mob-section-label');
          mobileCategories.innerHTML = (categoryLabel ? categoryLabel.outerHTML : '') + this._mobileContent();
        }
        return data;
      });
    }

    _localizedHref(item, lang) {
      if (!item) return '#';
      var cur = lang || this._getLang();
      if (cur === 'fr' && item.hrefFr) return item.hrefFr;
      if (cur === 'sw') return SW_CATEGORY_HREFS[item.id] || item.hrefSw || item.href || '#';
      if (cur === 'ha') return HA_CATEGORY_HREFS[item.id] || item.hrefHa || item.href || '#';
      if (cur === 'yo') return YO_CATEGORY_HREFS[item.id] || item.hrefYo || item.href || '#';
      return item.href || '#';
    }

    _megaContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var featured = TOOL_MENU_IDS.map(id => this._navItems().find(c => c.id === id)).filter(Boolean);
      var html = featured.map(cat => {
        var href = this._localizedHref(cat, lang);
        var label = localizedItemText(cat, 'label', lang);
        var desc = localizedItemText(cat, 'desc', lang);
        return `
        <a href="${href}" class="mega-col" data-cat="${cat.id}" style="--col-accent:${cat.accent}">
          <div class="mega-col-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mega-col-name">${label}</div>
            <div class="mega-col-desc">${desc}</div>
          </div>
        </a>`;
      }).join('');
      return html;
    }

    _countriesHref() {
      var lang = this._getLang();
      if (lang === 'fr') return '/fr/countries/';
      if (lang === 'sw') return '/sw/nchi/';
      if (lang === 'yo') return '/yo/naijiria/';
      if (lang === 'ha') return '/countries/';
      return '/countries/';
    }

    _countriesContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var isYo = lang === 'yo';
      var isHa = lang === 'ha';
      var searchLabel = isSw ? 'Tafuta nchi' : isFr ? 'Rechercher un pays' : isYo ? 'Wá orílẹ̀-èdè' : isHa ? 'Nemi kasa' : 'Country search';
      var searchPlaceholder = isSw ? 'Tafuta Nigeria, Kenya...' : isFr ? 'Rechercher Nigeria, Kenya...' : isYo ? 'Wá Naijiria, Ghana, Kenya...' : isHa ? 'Nemi Najeriya, Ghana, Kenya...' : 'Search Nigeria, Kenya, Ghana...';
      var itemDesc = isSw ? 'Zana za nchi' : isFr ? 'Outils par pays' : isYo ? 'Ojú ìwé Gẹẹsi fún báyìí' : isHa ? 'Kayan aiki na kasa' : 'Country tools and tax pages';
      var countryLinks = localizedCountryLinks(lang);
      var html = `
        <div class="country-search-panel">
          <div>
            <label class="country-search-label" for="countrySearchInput">${searchLabel}</label>
            <div class="country-search-box">
              <input id="countrySearchInput" class="country-search-input" type="search" placeholder="${searchPlaceholder}" autocomplete="off" aria-label="${searchLabel}">
            </div>
          </div>
          <div class="country-search-results" id="countrySearchResults" role="listbox" aria-label="${searchLabel}"></div>
        </div>`;
      html += '<div class="country-quick-links">';
      html += countryLinks.map(country => `
        <a href="${country.href || this._countryHref(country.label)}" class="mega-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">${country.label.charAt(0)}</div>
          <div>
            <div class="mega-col-name">${country.label}</div>
            <div class="mega-col-desc">${itemDesc}</div>
          </div>
        </a>`).join('');
      var allLabel = isSw ? 'Nchi zote 54 ->' : isFr ? 'Les 54 pays ->' : isYo ? 'Orílẹ̀-èdè 54 - ojú ìwé Gẹẹsi ->' : isHa ? 'Kasashe 54 - shafi na Turanci ->' : 'All 54 countries ->';
      var allDesc = isSw ? 'Chagua nchi yako' : isFr ? 'Choisissez votre pays' : isYo ? 'Yan orílẹ̀-èdè rẹ ní Gẹẹsi' : isHa ? 'Zabi kasa daga shafin Turanci' : 'Choose your country';
      html += `
        <a href="${this._countriesHref()}" class="mega-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">54</div>
          <div>
            <div class="mega-col-name">${allLabel}</div>
            <div class="mega-col-desc">${allDesc}</div>
          </div>
        </a>`;
      html += '</div>';
      return html;
    }

    _businessContent() {
      var lang = this._getLang();
      return localizedBusinessLinks(lang).map(item => `
        <a href="${item.href}" class="mega-col business-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">${item.icon}</div>
          <div>
            <div class="mega-col-name">${item.label}</div>
            <div class="mega-col-desc">${item.desc}</div>
          </div>
        </a>`).join('');
    }

    _mobileBusinessContent() {
      var lang = this._getLang();
      return localizedBusinessLinks(lang).map(item => `
        <a href="${item.href}" class="mob-cat">
          <div class="mob-cat-icon" style="background:#EEF4FF;color:#0062CC;font-size:0.75rem;font-weight:800">${item.icon}</div>
          <div>
            <div class="mob-cat-label">${item.label}</div>
            <div class="mob-cat-desc">${item.desc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`).join('');
    }

    _mobileContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var isYo = lang === 'yo';
      var isHa = lang === 'ha';
      var featured = TOOL_MENU_IDS.map(id => this._navItems().find(c => c.id === id)).filter(Boolean);
      var html = featured.map(cat => {
        var href = this._localizedHref(cat, lang);
        var label = localizedItemText(cat, 'label', lang);
        var desc = localizedItemText(cat, 'desc', lang);
        return `
        <a href="${href}" class="mob-cat">
          <div class="mob-cat-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mob-cat-label">${label}</div>
            <div class="mob-cat-desc">${desc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`;
      }).join('');
      var allLabel = isSw ? 'Makundi Yote →' : isFr ? 'Toutes les catégories →' : isYo ? 'Gbogbo ẹ̀ka - ojú ìwé Gẹẹsi ->' : isHa ? 'Dukkan rukuni →' : 'All 28 Categories →';
      var allDesc = isSw ? 'Tazama makundi yote' : isFr ? 'Voir toutes les catégories' : isYo ? 'Wo gbogbo ẹ̀ka ní Gẹẹsi' : isHa ? 'Duba kowane rukuni na kayan aiki' : 'Browse every tool category';
      var allHref = isFr ? '/fr/categories/' : '/categories/';
      allLabel = isSw ? 'Zana zote za Kiswahili ->' : isFr ? 'Tous les outils ->' : isYo ? 'Gbogbo irinṣẹ - ojú ìwé Gẹẹsi ->' : isHa ? 'Duk kayan aikin Hausa ->' : 'All Tools ->';
      allDesc = isSw ? 'PAYE, PDF, VAT, nchi na makundi yote' : isFr ? 'Rechercher et filtrer tous les outils' : isYo ? 'PAYE, PDF, VAT, JAMB, WAEC àti orílẹ̀-èdè' : isHa ? 'PAYE, PDF, VAT, JAMB, WAEC da kasashe' : 'Search and filter every tool';
      allHref = isSw ? '/sw/zana-zote/' : isFr ? '/fr/all-tools/' : isHa ? '/ha/kayan-aiki/' : '/tools/';
      html += `
        <a href="${allHref}" class="mob-cat" style="border-top:2px solid #e5e7eb;margin-top:4px">
          <div class="mob-cat-icon" style="background:#EEF4FF">🧭</div>
          <div>
            <div class="mob-cat-label" style="color:#0062CC">${allLabel}</div>
            <div class="mob-cat-desc">${allDesc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`;
      return html;
    }

    _mobileCountriesContent() {
      var lang = this._getLang();
      var html = localizedCountryLinks(lang).slice(0, 6).map(country => {
        return '<a href="' + (country.href || this._countryHref(country.label)) + '" class="mob-country-link">' + country.label + '</a>';
      }).join('');
      var allLabel = lang === 'sw' ? 'Nchi zote' : lang === 'fr' ? 'Tous les pays' : lang === 'yo' ? 'Gbogbo orílẹ̀-èdè - ojú ìwé Gẹẹsi' : lang === 'ha' ? 'Duk kasashe - shafi na Turanci' : 'All countries';
      html += '<a href="' + this._countriesHref() + '" class="mob-country-link">' + allLabel + '</a>';
      return html;
    }

    _countryHref(name) {
      var lang = this._getLang();
      var overrides = {
        'Cabo Verde': 'cape-verde',
        'Central African Republic': 'central-african-republic',
        'Côte d\'Ivoire': 'cote-divoire',
        'DR Congo': 'dr-congo',
        'Republic of the Congo': 'congo',
        'Congo': 'congo',
        'São Tomé and Príncipe': 'sao-tome',
        'São Tomé & Príncipe': 'sao-tome',
      };
      var slug = overrides[name] || String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (lang === 'ha' && slug === 'nigeria') return '/ha/najeriya/';
      if (lang === 'yo' && slug === 'nigeria') return '/yo/naijiria/';
      var prefix = lang === 'fr' ? '/fr' : lang === 'sw' ? '/sw' : '';
      return slug ? prefix + '/' + slug + '/' : this._countriesHref();
    }

    _countrySearchItems(countries) {
      var lang = this._getLang();
      var source = Array.isArray(countries) && countries.length
        ? (lang === 'ha' || lang === 'yo' ? localizedCountryLinks(lang).concat(countries) : countries)
        : localizedCountryLinks(lang).map(function(country) {
          return { name: country.label, href: country.href, currency: country.currency || '' };
        });
      return source.map(country => {
        var name = country.name || country.label || '';
        return {
          label: name,
          href: country.href || this._countryHref(name),
          meta: country.currency || '',
        };
      });
    }

    _loadCountryData() {
      return new Promise(resolve => {
        if (Array.isArray(window.AFRICAN_COUNTRIES)) {
          resolve(window.AFRICAN_COUNTRIES);
          return;
        }
        var src = '/assets/js/data/african-countries.js';
        var existing = document.querySelector('script[src="' + src + '"], script[src$="/assets/js/data/african-countries.js"]');
        var finish = () => resolve(Array.isArray(window.AFRICAN_COUNTRIES) ? window.AFRICAN_COUNTRIES : []);
        if (existing) {
          existing.addEventListener('load', finish, { once: true });
          existing.addEventListener('error', () => resolve([]), { once: true });
          setTimeout(finish, 500);
          return;
        }
        var script = document.createElement('script');
        script.src = src;
        script.onload = finish;
        script.onerror = () => resolve([]);
        document.head.appendChild(script);
      });
    }

    _mobileLangHTML() {
      var cur = this._getLang();
      var LANGS = this._availableLocales().map(function(locale) { return { code: locale.id, label: locale.nativeName || locale.displayName || locale.id, launchStatus: locale.launchStatus }; });
      var opts = LANGS.map(function(l) {
        var active = l.code === cur ? ' active' : '';
        var destination = this._languageDestinationFor(l.code, cur);
        var fallback = !destination.advertisedAsEquivalent && l.code !== cur;
        var fallbackClass = fallback ? ' fallback' : '';
        var fallbackLabel = fallback ? '<small class="lang-opt-fallback">' + this._escapeHtml(destination.label) + '</small>' : '';
        var partialLabel = l.launchStatus === 'partial' ? '<small class="lang-opt-partial">' + this._escapeHtml(this._translation('navigation.partialCoverage', 'Partial coverage')) + '</small>' : '';
        var ariaLabel = fallback ? ' aria-label="' + this._escapeHtml(l.label + ': ' + destination.label) + '"' : '';
        return '<a href="' + this._escapeHtml(destination.route) + '" data-locale-target="' + this._escapeHtml(l.code) + '" data-locale-relationship="' + this._escapeHtml(destination.relationship) + '" class="mob-lang-opt' + active + fallbackClass + '"' + ariaLabel + '><span aria-hidden="true">' + l.code.toUpperCase() + '</span><span class="lang-opt-label">' + l.label + partialLabel + fallbackLabel + '</span></a>';
      }, this).join('');
      var langLabel = this._translation('navigation.language', 'Language');
      return '<div class="mob-lang-section"><div class="mob-section-label">' + langLabel + '</div><div class="mob-lang-row">' + opts + '</div></div>';
    }

    _escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    _cleanDisplayName(value, fallback) {
      const cleaned = String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned || fallback || 'Dashboard';
    }

    _render() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var T = {
        homeHref:     isSw ? '/sw/'                         : isFr ? '/fr/'                                             : '/',
        tag:          isSw ? 'Zana za Afrika kwa Kiswahili'             : isFr ? 'La plateforme africaine'                          : "Africa's Everything Platform",
        allTools:     isSw ? 'Zana zote'                    : isFr ? 'Tous les outils'                                  : 'All Tools',
        tools:        isSw ? 'Zana'                         : isFr ? 'Outils'                                           : 'Tools',
        countries:    isSw ? 'Nchi'                         : isFr ? 'Pays'                                             : 'Countries',
        countriesHref:isSw ? '/sw/nchi/'                    : isFr ? '/fr/countries/'                                  : '/countries/',
        business:     isSw ? 'Kwa Biashara'                     : isFr ? 'Entreprise'                                       : 'For business',
        businessNote: isSw ? 'API, zana maalum, VAT, ushirikiano na mawasiliano ya biashara' : isFr ? 'Widgets, API, sponsoring, calculateurs sur mesure' : 'Widgets, API, sponsorships, custom calculators, and media inventory',
        businessBrowse:isSw ? 'Wasiliana na timu ->'         : isFr ? 'Ouvrir le media kit ->'                           : 'Open media kit ->',
        businessBrowseHref:isSw ? '/sw/wasiliana/' : '/media-kit/',
        resources:    isSw ? 'Miongozo'                   : isFr ? 'Ressources'                                       : 'Resources',
        resourcesHref:isSw ? '/sw/blogu/'                         : isFr ? '/fr/blog/'                                        : '/blog/',
        search:       isSw ? 'Tafuta'                       : isFr ? 'Recherche'                                        : 'Search',
        startByCountry:isSw ? 'Anza kwa nchi'               : isFr ? 'Commencer par pays'                               : 'Start by country',
        countrySearchPh:isSw ? 'Tafuta nchi...'             : isFr ? 'Rechercher un pays...'                            : 'Search countries...',
        salaryTax:    isSw ? 'Mshahara na PAYE'          : isFr ? 'Salaire &amp; Impôts'                             : 'Salary &amp; Tax',
        salaryHref:   isSw ? '/sw/mshahara-na-kodi/'        : isFr ? '/fr/salary-tax/'                                  : '/salary-tax/',
        pdfTools:     isSw ? 'PDF na Nyaraka'                  : isFr ? 'Outils PDF'                                       : 'PDF Tools',
        pdfHref:      isSw ? '/sw/hati-na-pdf/'             : isFr ? '/fr/document-pdf/'                                : '/document-pdf/',
        devTools:     isSw ? 'Wasanidi'                   : isFr ? 'Outils Dev'                                       : 'Dev Tools',
        devHref:      isSw ? '/sw/zana-za-developer/'       : isFr ? '/fr/developer-tools/'                             : '/developer-tools/',
        african:      isSw ? 'Nchi na Zana za Afrika'                     : isFr ? 'Africain'                                         : 'African',
        africanHref:  isSw ? '/sw/nchi/'                    : isFr ? '/fr/african/'                                     : '/african/',
        education:    isSw ? 'Elimu'                        : isFr ? 'Éducation'                                        : 'Education',
        educationHref:isSw ? '/sw/elimu/'                   : isFr ? '/fr/education/'                                   : '/education/',
        insurance:    isSw ? 'Bima'                         : isFr ? 'Santé &amp; Assurance'                            : 'Insurance',
        insuranceHref:isSw ? '/sw/bima/'                    : isFr ? '/fr/health-insurance/'                            : '/insurance/',
        countries54:  isSw ? 'Nchi 54'                   : isFr ? '54 pays'                                       : '54 countries',
        signIn:       isSw ? 'Ingia'                        : isFr ? 'Connexion'                                        : 'Sign in',
        ariaNav:      isSw ? 'Urambazaji mkuu'              : isFr ? 'Navigation principale'                            : 'Main navigation',
        ariaMenu:     isSw ? 'Menyu ya urambazaji'          : isFr ? 'Menu de navigation'                               : 'Navigation menu',
        ariaSearch:   isSw ? 'Tafuta zana'                  : isFr ? 'Rechercher des outils'                            : 'Search tools',
        megaNote:     isSw ? 'Nchi 54 za Afrika · bure · bila usajili'       : isFr ? '54 pays africains · gratuit · sans inscription': '54 African countries · Core use without a paid subscription · no sign-up required',
        browseAll:    isSw ? 'Tazama zana zote →'           : isFr ? 'Voir tous les outils →'                           : 'Browse all tools →',
        browseHref:   isSw ? '/sw/zana-zote/'               : isFr ? '/fr/all-tools/'                                   : '/tools/',
        allCats:      isSw ? 'Makundi yote'                 : isFr ? 'Toutes les catégories'                            : 'All Categories',
        searchPh:     isSw ? 'Tafuta PAYE, PDF, VAT, WAEC...'               : isFr ? 'Rechercher des outils...'                         : 'Search tools...',
        mobSignIn:    isSw ? 'Ingia'                        : isFr ? 'Connexion'                                        : 'Sign In',
        proHref:      isSw ? '/sw/bei/'                     : isFr ? '/fr/pro/' : '/pro/',
        proLabel:     isSw ? 'Pro'                          : isFr ? 'Pro'                                              : 'Pro',
        proUpgrade:   isSw ? 'Pata Pro'                     : isFr ? 'Passer Pro'                                       : 'Upgrade Pro',
        proWorkspace: isSw ? 'Eneo la Pro'                  : isFr ? 'Espace Pro'                                       : 'Pro Workspace',
        dashboardHref:isSw ? '/sw/dashboard/'               : isFr ? '/fr/dashboard/' : '/dashboard/',
        authHref:     (isSw ? '/sw/auth/' : isFr ? '/fr/auth/' : '/auth/') + '?mode=login&next=' + encodeURIComponent(isSw ? '/sw/dashboard/' : isFr ? '/fr/dashboard/' : '/dashboard/'),
        vaultHref:    isSw ? '/sw/vault/'                   : isFr ? '/fr/dashboard/vault/' : '/dashboard/vault/',
        mobNote:      isSw ? 'Nchi 54 · bure · bila usajili'                 : isFr ? '54 pays · gratuit · sans inscription'          : '54 countries · always free · no sign-up required',
        srchEmpty:    isSw ? 'Tafuta zana za Kiswahili na Afrika'          : isFr ? '2 594+ outils africains'                            : 'Search 2,594+ African tools',
        srchHint:     isSw ? 'Jaribu "PAYE", "PDF", "kodi", "BMI"…'            : isFr ? 'Essayez "PAYE", "salaire", "TVA"…'               : 'Try "PAYE", "PDF", "japa", "BMI"…',
        countriesFooterNote: isSw ? 'Nchi 54 za Afrika' : '54 African countries',
        viewAll:      isSw ? 'Tazama zote'                    : 'View all',
        loadingTools: isSw ? 'Inapakia zana…'                 : 'Loading tools…',
        registryWait: isSw ? 'Orodha ya zana bado inapakia'  : 'Tool registry not loaded yet',
        recentlyUsed: isSw ? 'Zilizotumika hivi karibuni'      : 'Recently Used',
        clearRecent:  isSw ? 'Futa'                           : 'Clear',
        vaultLabel:   isSw ? 'Hifadhi yangu'                   : 'My Vault',
        allToolsLabel:isSw ? 'Zana zote'                      : 'All Tools',
        typeToSearch: isSw ? 'Andika PAYE, PDF, VAT, WAEC au jina la nchi' : 'Type to search 2,594+ tools',
        noToolsFound: isSw ? 'Hakuna zana iliyopatikana'       : 'No tools found',
        differentSearch: isSw ? 'Jaribu neno jingine'          : 'Try a different search term',
        themeLabel:   isSw ? 'Mandhari' : isFr ? 'Theme' : 'Theme',
        themeLight:   isSw ? 'Mwanga' : isFr ? 'Clair' : 'Light',
        themeDark:    isSw ? 'Giza' : isFr ? 'Sombre' : 'Dark',
        themeToLight: isSw ? 'Badili kwenda mwanga' : isFr ? 'Passer en mode clair' : 'Switch to light mode',
        themeToDark:  isSw ? 'Badili kwenda giza' : isFr ? 'Passer en mode sombre' : 'Switch to dark mode',
      };
      var T_BY_LANG = {
        yo: {
          homeHref: '/yo/',
          tag: 'Pẹpẹ irinṣẹ Afirika',
          allTools: 'Gbogbo irinṣẹ',
          tools: 'Irinṣẹ',
          countries: 'Naijiria',
          countriesHref: '/yo/naijiria/',
          business: 'Fún iṣẹ́',
          businessNote: 'Ojú ìwé Gẹẹsi: widgets, API, sponsorships, calculators àkànṣe àti media kit',
          businessBrowse: 'Ṣí media kit - ojú ìwé Gẹẹsi ->',
          businessBrowseHref: '/media-kit/',
          resources: 'Ìmọ̀ràn - ojú ìwé Gẹẹsi',
          resourcesHref: '/blog/',
          search: 'Wa',
          startByCountry: 'Bẹ̀rẹ̀ pẹ̀lú orílẹ̀-èdè',
          countrySearchPh: 'Wá orílẹ̀-èdè...',
          salaryTax: 'Owó oṣù ati owó-orí',
          salaryHref: '/yo/owo-osu-ati-owo-ori/',
          pdfTools: 'PDF ati iwe',
          pdfHref: '/yo/iwe-ati-pdf/',
          education: 'Ẹ̀kọ́',
          educationHref: '/yo/eko/',
          signIn: 'Wọlé - Gẹẹsi',
          ariaNav: 'Ìrìnàjò àkọ́kọ́',
          ariaMenu: 'Menyu ìrìnàjò',
          ariaSearch: 'Wa irinṣẹ',
          megaNote: 'Orílẹ̀-èdè Afirika 54 · ọfẹ · kò sí ìforúkọsílẹ̀',
          browseAll: 'Wo gbogbo irinṣẹ ->',
          browseHref: '/yo/awon-ise/',
          allCats: 'Gbogbo Ẹ̀ka',
          searchPh: 'Wa irinṣẹ...',
          mobSignIn: 'Wọlé - Gẹẹsi',
          proLabel: 'Pro',
          proUpgrade: 'Ṣí Pro - Gẹẹsi',
          proWorkspace: 'Pro Workspace - Gẹẹsi',
          mobNote: 'Orílẹ̀-èdè 54 · ọfẹ · kò sí ìforúkọsílẹ̀',
          srchEmpty: 'Wa irinṣẹ Afirika 2,594+',
          srchHint: 'Gbìyànjú "PAYE", "PDF", "owó-orí"...',
          countriesFooterNote: 'Orílẹ̀-èdè 54 ti Afirika',
          viewAll: 'Wo gbogbo rẹ̀',
          loadingTools: 'Ó ń kojú irinṣẹ...',
          registryWait: 'Àtòjọ irinṣẹ kò tíì parí kíkójú',
          recentlyUsed: 'Èyí tí a lo laipẹ',
          clearRecent: 'Pa rẹ́',
          vaultLabel: 'Vault mi',
          allToolsLabel: 'Irinṣẹ Yorùbá',
          typeToSearch: 'Tẹ PAYE, PDF, VAT, JAMB, WAEC tàbí Naijiria',
          noToolsFound: 'A kò rí irinṣẹ kankan',
          differentSearch: 'Gbìyànjú ọ̀rọ̀ míràn tàbí orúkọ orílẹ̀-èdè',
          themeLabel: 'Àwọ̀n ojú',
          themeLight: 'Ìmọ́lẹ̀',
          themeDark: 'Òkùnkùn',
          themeToLight: 'Yí padà sí ìmọ́lẹ̀',
          themeToDark: 'Yí padà sí òkùnkùn'
        },
        ha: {
          homeHref: '/ha/',
          tag: 'Dandalin kayan aikin Afirka',
          allTools: 'Dukkan kayan aiki',
          tools: 'Kayan aiki',
          countries: 'Kasashe',
          countriesHref: '/ha/kasashe/',
          business: 'Na kasuwanci',
          businessNote: 'Kayan sakawa, API, tallafi, kalkuleta na musamman da kunshin yaɗa labarai; cikakken shafin yana Turanci',
          businessBrowse: 'Bude gadar media kit ->',
          businessBrowseHref: '/ha/kayan-kasuwanci/',
          resources: 'Labarai - gadar Turanci',
          resourcesHref: '/ha/labarai/',
          search: 'Bincike',
          startByCountry: 'Fara da ƙasa',
          countrySearchPh: 'Nemi ƙasa...',
          salaryTax: 'Albashi da PAYE',
          salaryHref: '/ha/albashi-da-haraji/',
          pdfTools: 'PDF da Takardu',
          pdfHref: '/ha/takardu-da-pdf/',
          devTools: 'Masu haɓakawa - gadar Turanci',
          devHref: '/ha/masu-habaka/',
          african: 'Kasashe da kayan Afirka',
          africanHref: '/ha/kasashe/',
          education: 'Ilimi',
          educationHref: '/ha/ilimi/',
          insurance: 'Inshora - gadar Turanci',
          insuranceHref: '/ha/inshora/',
          signIn: 'Shiga',
          ariaNav: 'Babban kewayawa',
          ariaMenu: 'Menu na kewayawa',
          ariaSearch: 'Bincika kayan aiki',
          megaNote: 'Kasashen Afirka 54 · kyauta · babu rajista',
          browseAll: 'Duba duk kayan aiki ->',
          browseHref: '/ha/kayan-aiki/',
          allCats: 'Dukkan Rukuni',
          searchPh: 'Bincika PAYE, PDF, VAT, JAMB, WAEC...',
          mobSignIn: 'Shiga',
          authHref: '/ha/shiga/?next=%2Fha%2Fallon-aiki%2F',
          dashboardHref: '/ha/allon-aiki/',
          vaultHref: '/ha/maajiyar-takardu/',
          proHref: '/ha/farashi/',
          proLabel: 'Pro',
          proUpgrade: 'Samu Pro',
          proWorkspace: 'Wurin Pro',
          mobNote: 'Kasashe 54 · kyauta · babu rajista',
          srchEmpty: 'Bincika kayan aikin Hausa da Afirka',
          srchHint: 'Gwada "PAYE", "JAMB", "WAEC", "PDF"...',
          countriesFooterNote: 'Kasashe 54 na Afirka - shafi na Turanci',
          viewAll: 'Duba duka',
          loadingTools: 'Ana loda kayan aiki...',
          registryWait: 'Jerin kayan aiki bai gama lodi ba',
          recentlyUsed: 'An yi amfani da su kwanan nan',
          clearRecent: 'Goge',
          vaultLabel: "Ma'ajiyata",
          allToolsLabel: 'Kayan aikin Hausa',
          typeToSearch: 'Rubuta PAYE, PDF, VAT, JAMB, WAEC ko Nigeria',
          noToolsFound: 'Ba a sami kayan aiki ba',
          differentSearch: 'Gwada wata kalma ko sunan kasa',
          themeLabel: 'Jigo',
          themeLight: 'Haske',
          themeDark: 'Duhu',
          themeToLight: 'Canza zuwa haske',
          themeToDark: 'Canza zuwa duhu'
        }
      };
      if (T_BY_LANG[lang]) Object.assign(T, T_BY_LANG[lang]);

      this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="${NAVBAR_CSS_HREF}">
        <nav role="navigation" aria-label="${T.ariaNav}">
          <div class="inner">
            <a href="${T.homeHref}" class="logo" aria-label="AfroTools home">
              ${MARK}
              <div>
                <span class="logo-name">AFRO<b>TOOLS</b></span>
                <span class="logo-tag">${T.tag}</span>
              </div>
            </a>

            <ul class="nav-links">
              <li>
                <button class="lnk" id="allBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.tools}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li>
                <button class="lnk" id="countriesBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.countries}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li><a href="${T.salaryHref}" class="lnk">${T.salaryTax}</a></li>
              <li><a href="${T.pdfHref}" class="lnk">${T.pdfTools || 'PDF'}</a></li>
              <li>
                <button class="lnk" id="businessBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.business}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li><a href="${T.resourcesHref}" class="lnk">${T.resources}</a></li>
            </ul>

            <div class="right">
              <div class="country-control-shell">
                ${isSw ? '<a class="sw-country-link" href="/sw/nchi/" aria-label="Chagua nchi bila kubadili lugha">Chagua nchi</a>' : `<afro-country-selector variant="nav" redirect="country" label="${isFr ? 'Changer de pays' : lang === 'ha' ? 'Canja ƙasa' : 'Change country'}" ${lang === 'ha' ? 'search-placeholder="Nemi ƙasa..." search-label="Bincika ƙasashe" currency-label="kuɗin ƙasa" empty-message="Ba a sami ƙasar da ta dace ba" diaspora-prefix="Ina zaune a waje amma ina kula da kuɗi a "' : ''}></afro-country-selector>`}
              </div>
              ${this._langSwitcherHTML()}
              <button class="theme-toggle" id="themeToggle" type="button" aria-label="${T.themeToDark}" title="${T.themeToDark}" aria-pressed="false" data-to-dark="${T.themeToDark}" data-to-light="${T.themeToLight}" data-state-dark="${T.themeDark}" data-state-light="${T.themeLight}">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7.5 7.5 0 1 0 20.5 14.5Z"/>
                </svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.57 4.57l1.41 1.41M18.02 18.02l1.41 1.41M2.5 12h2M19.5 12h2M4.57 19.43l1.41-1.41M18.02 5.98l1.41-1.41"/>
                </svg>
              </button>
              <button class="search-btn cp-trigger" id="searchBtn" type="button" aria-label="${T.ariaSearch}">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
                </svg>
                <span class="search-btn-label">${T.search}</span>
                <span class="search-kbd cp-trigger-kbd">Ctrl K</span>
              </button>
              <a href="${T.proHref}" class="btn-pro" data-pro-nav="true">${T.proLabel}</a>
              <a href="${T.authHref}" class="btn-login">${T.signIn}</a>
              <button class="burger" type="button" aria-label="${isSw ? 'Fungua menyu' : isFr ? 'Ouvrir le menu' : lang === 'ha' ? 'Bude menu' : 'Open menu'}" aria-expanded="false">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </nav>

        <div class="mega" id="mega" role="menu" aria-label="${T.allTools}">
          <div class="mega-inner tools-mega-grid">
            ${this._megaContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.megaNote}</span>
            <a href="${T.browseHref}" class="mega-footer-lnk">${T.browseAll}</a>
          </div>
        </div>

        <div class="mega" id="countriesMega" role="menu" aria-label="${T.countries}">
          <div class="mega-inner">
            ${this._countriesContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.countries} - ${T.countriesFooterNote}</span>
            <a href="${T.countriesHref}" class="mega-footer-lnk">${T.viewAll}</a>
          </div>
        </div>

        <div class="mega" id="businessMega" role="menu" aria-label="${T.business}">
          <div class="mega-inner business-mega-grid">
            ${this._businessContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.businessNote}</span>
            <a href="${T.businessBrowseHref}" class="mega-footer-lnk">${T.businessBrowse}</a>
          </div>
        </div>

        <div class="mob" role="dialog" aria-modal="true" aria-label="${T.ariaMenu}">
          <div class="mob-search-bar">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
            </svg>
            <input class="mob-search-input" type="text" placeholder="${T.searchPh}" aria-label="${T.ariaSearch}" autocomplete="off"/>
          </div>
            <div class="mob-search-results" id="mobSearchResults" role="listbox" aria-label="${isSw ? 'Matokeo ya utafutaji' : lang === 'ha' ? 'Sakamakon bincike' : 'Search results'}"></div>
          <div class="mob-theme-section">
            <button class="mob-theme-toggle" id="mobThemeToggle" type="button" aria-label="${T.themeToDark}" aria-pressed="false" data-to-dark="${T.themeToDark}" data-to-light="${T.themeToLight}" data-state-dark="${T.themeDark}" data-state-light="${T.themeLight}">
              <span class="mob-theme-copy">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7.5 7.5 0 1 0 20.5 14.5Z"/>
                </svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.57 4.57l1.41 1.41M18.02 18.02l1.41 1.41M2.5 12h2M19.5 12h2M4.57 19.43l1.41-1.41M18.02 5.98l1.41-1.41"/>
                </svg>
                <span>${T.themeLabel}</span>
              </span>
              <span class="mob-theme-state">${T.themeLight}</span>
            </button>
          </div>
          <div class="mob-country-block">
            <div class="mob-section-label">${T.startByCountry}</div>
            <div class="mob-country-search">
              <input id="mobileCountrySearchInput" class="mob-country-search-input" type="search" placeholder="${T.countrySearchPh}" autocomplete="off" aria-label="${T.startByCountry}">
            </div>
            <div class="mob-country-results" id="mobileCountrySearchResults" role="listbox" aria-label="${T.startByCountry}"></div>
            <div class="mob-country-grid">${this._mobileCountriesContent()}</div>
          </div>
          <div class="mob-business-block">
            <div class="mob-section-label">${T.business}</div>
            ${this._mobileBusinessContent()}
          </div>
          <div id="mobCategoriesWrap">
            <div class="mob-section-label">${T.allCats}</div>
            ${this._mobileContent()}
          </div>
          ${this._mobileLangHTML()}
          <div class="mob-country-context">
            ${isSw ? '<a class="mob-country-link" href="/sw/nchi/">Chagua nchi — lugha itaendelea kuwa Kiswahili</a>' : `<afro-country-selector variant="mobile" redirect="country" diaspora label="${T.startByCountry}"></afro-country-selector>`}
          </div>
          <div class="mob-footer">
            <a href="${T.proHref}" class="mob-pro-link" data-pro-nav="mobile">${T.proLabel}</a>
            <a href="${T.authHref}" class="mob-login">${T.mobSignIn}</a>
            <a href="${T.vaultHref}" class="mob-vault-link" style="display:none;padding:10px 13px;border-radius:8px;font-size:0.85rem;font-weight:600;text-decoration:none;color:#0062CC;border:1px solid #b8c8dc;text-align:center;">${T.vaultLabel}</a>
            <a href="/tools/afropoints/" class="mob-points-link" style="display:none;padding:10px 13px;border-radius:8px;font-size:0.85rem;font-weight:700;text-decoration:none;color:#92400E;border:1px solid #f4d58a;background:#fffaf0;text-align:center;">AfroPoints</a>
            <p class="mob-note">${T.mobNote}</p>
          </div>
        </div>

        <dialog class="lang-fallback-dialog" id="languageFallbackDialog" aria-labelledby="languageFallbackTitle" aria-describedby="languageFallbackBody">
          <div class="lang-fallback-card">
            <h2 id="languageFallbackTitle">${this._translation('navigation.fallbackWarningTitle', 'This page is not available in the selected language')}</h2>
            <p id="languageFallbackBody">${this._translation('navigation.fallbackWarningBody', 'The next page is in English. Your current work will not be translated.')}</p>
            <div class="lang-fallback-actions">
              <button class="lang-fallback-cancel" id="languageFallbackCancel" type="button">${this._translation('navigation.cancelFallback', 'Stay on this page')}</button>
              <button class="lang-fallback-confirm" id="languageFallbackConfirm" type="button">${this._translation('navigation.continueToEnglish', 'Continue to English')}</button>
            </div>
          </div>
        </dialog>

`;
    }

    _bind() {
      const sr     = this.shadowRoot;
      const nav    = sr.querySelector('nav');
      const allBtn = sr.querySelector('#allBtn');
      const mega   = sr.querySelector('#mega');
      const countriesBtn = sr.querySelector('#countriesBtn');
      const countriesMega = sr.querySelector('#countriesMega');
      const businessBtn = sr.querySelector('#businessBtn');
      const businessMega = sr.querySelector('#businessMega');
      const searchBtn = sr.querySelector('#searchBtn');
      const themeBtn = sr.querySelector('#themeToggle');
      const mobThemeBtn = sr.querySelector('#mobThemeToggle');
      const burger = sr.querySelector('.burger');
      const mob    = sr.querySelector('.mob');

      const syncThemeControls = () => {
        const isDark = effectiveTheme() === 'dark';
        this.classList.toggle('theme-dark', isDark);
        syncCountrySelectorThemes(isDark ? 'dark' : 'light');
        [themeBtn, mobThemeBtn].forEach(btn => {
          if (!btn) return;
          const label = isDark ? btn.dataset.toLight : btn.dataset.toDark;
          btn.setAttribute('aria-label', label || (isDark ? 'Switch to light mode' : 'Switch to dark mode'));
          btn.setAttribute('title', label || '');
          btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
          const state = btn.querySelector('.mob-theme-state');
          if (state) state.textContent = isDark ? (btn.dataset.stateDark || 'Dark') : (btn.dataset.stateLight || 'Light');
        });
      };
      const toggleTheme = () => {
        const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        writeThemePreference(next);
        applyThemePreference(next);
        syncThemeControls();
      };
      themeBtn?.addEventListener('click', toggleTheme);
      mobThemeBtn?.addEventListener('click', toggleTheme);
      if (this._themeChangeFn) document.removeEventListener('afrotools:theme-change', this._themeChangeFn);
      this._themeChangeFn = syncThemeControls;
      document.addEventListener('afrotools:theme-change', this._themeChangeFn);
      syncThemeControls();

      // Scroll shadow
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      this._scrollFn = () => nav.classList.toggle('scrolled', window.scrollY > 4);
      window.addEventListener('scroll', this._scrollFn, { passive: true });
      this._scrollFn();

      const prepareForOpen = (action) => {
        if (navbarDataLoaded) { action(); return; }
        [allBtn, countriesBtn, businessBtn, burger, searchBtn].forEach(btn => btn?.setAttribute('aria-busy', 'true'));
        this._prepareNavData().finally(() => {
          [allBtn, countriesBtn, businessBtn, burger, searchBtn].forEach(btn => btn?.removeAttribute('aria-busy'));
          action();
        });
      };
      const showMega = () => {
        this._megaOpen = true;
        closeCountries();
        closeBusiness();
        allBtn?.classList.add('open');
        mega?.classList.add('open');
        allBtn?.setAttribute('aria-expanded','true');
      };
      const openMega = () => prepareForOpen(showMega);
      const closeMega = () => {
        this._megaOpen = false;
        allBtn?.classList.remove('open');
        mega?.classList.remove('open');
        allBtn?.setAttribute('aria-expanded','false');
      };
      const showCountries = () => {
        this._countriesOpen = true;
        closeMega();
        closeBusiness();
        countriesBtn?.classList.add('open');
        countriesMega?.classList.add('open');
        countriesBtn?.setAttribute('aria-expanded','true');
      };
      const openCountries = () => prepareForOpen(showCountries);
      const closeCountries = () => {
        this._countriesOpen = false;
        countriesBtn?.classList.remove('open');
        countriesMega?.classList.remove('open');
        countriesBtn?.setAttribute('aria-expanded','false');
      };
      const showBusiness = () => {
        this._businessOpen = true;
        closeMega();
        closeCountries();
        businessBtn?.classList.add('open');
        businessMega?.classList.add('open');
        businessBtn?.setAttribute('aria-expanded','true');
      };
      const openBusiness = () => prepareForOpen(showBusiness);
      const closeBusiness = () => {
        this._businessOpen = false;
        businessBtn?.classList.remove('open');
        businessMega?.classList.remove('open');
        businessBtn?.setAttribute('aria-expanded','false');
      };
      const closeMenus = () => { closeMega(); closeCountries(); closeBusiness(); };
      const resetMobileSearch = () => {
        const mobSearchInput = sr.querySelector('.mob-search-input');
        const mobSearchResults = sr.querySelector('#mobSearchResults');
        const mobCategoriesWrap = sr.querySelector('#mobCategoriesWrap');
        const mobCountryBlock = sr.querySelector('.mob-country-block');
        const mobBusinessBlock = sr.querySelector('.mob-business-block');
        const mobileCountrySearchInput = sr.querySelector('#mobileCountrySearchInput');
        const mobileCountrySearchResults = sr.querySelector('#mobileCountrySearchResults');
        if (mobSearchInput) mobSearchInput.value = '';
        if (mobSearchResults) mobSearchResults.innerHTML = '';
        if (mobCategoriesWrap) mobCategoriesWrap.style.display = '';
        if (mobCountryBlock) mobCountryBlock.style.display = '';
        if (mobBusinessBlock) mobBusinessBlock.style.display = '';
        if (mobileCountrySearchInput) mobileCountrySearchInput.value = '';
        if (mobileCountrySearchResults) mobileCountrySearchResults.innerHTML = '';
      };
      const setMenuOpen = (isOpen) => {
        this._menuOpen = isOpen;
        burger?.classList.toggle('open', this._menuOpen);
        mob?.classList.toggle('open', this._menuOpen);
        burger?.setAttribute('aria-expanded', String(this._menuOpen));
        if (this._menuOpen) {
          closeMenus();
          this._lockBodyScroll();
          return;
        }
        this._unlockBodyScroll();
        resetMobileSearch();
      };

      // Click toggle
      allBtn?.addEventListener('click', e => { e.stopPropagation(); this._megaOpen ? closeMega() : openMega(); });
      countriesBtn?.addEventListener('click', e => { e.stopPropagation(); this._countriesOpen ? closeCountries() : openCountries(); });
      businessBtn?.addEventListener('click', e => { e.stopPropagation(); this._businessOpen ? closeBusiness() : openBusiness(); });
      searchBtn?.addEventListener('click', e => {
        e.preventDefault();
        prepareForOpen(() => {
          if (typeof window.__openCommandPalette === 'function') {
            window.__openCommandPalette();
            return;
          }
          window.location.href = this._getLang() === 'sw' ? '/sw/zana-zote/' : '/search/';
        });
      });

      // Hover — keep open while moving between button and mega
      let hoverTimer;
      const navEl = allBtn?.closest('li');
      navEl?.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); openMega(); });
      navEl?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 200); });
      mega?.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
      mega?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 200); });

      let countriesHoverTimer;
      const countriesNavEl = countriesBtn?.closest('li');
      countriesNavEl?.addEventListener('mouseenter', () => { clearTimeout(countriesHoverTimer); openCountries(); });
      countriesNavEl?.addEventListener('mouseleave', () => { countriesHoverTimer = setTimeout(closeCountries, 200); });
      countriesMega?.addEventListener('mouseenter', () => clearTimeout(countriesHoverTimer));
      countriesMega?.addEventListener('mouseleave', () => { countriesHoverTimer = setTimeout(closeCountries, 200); });

      let businessHoverTimer;
      const businessNavEl = businessBtn?.closest('li');
      businessNavEl?.addEventListener('mouseenter', () => { clearTimeout(businessHoverTimer); openBusiness(); });
      businessNavEl?.addEventListener('mouseleave', () => { businessHoverTimer = setTimeout(closeBusiness, 200); });
      businessMega?.addEventListener('mouseenter', () => clearTimeout(businessHoverTimer));
      businessMega?.addEventListener('mouseleave', () => { businessHoverTimer = setTimeout(closeBusiness, 200); });

      // Tool sub-panels: disabled — category cards navigate directly to their pages

      // Click outside
      if (this._outsideFn) document.removeEventListener('click', this._outsideFn);
      this._outsideFn = e => { if (!this.contains(e.target)) closeMenus(); };
      document.addEventListener('click', this._outsideFn);

      // Language switcher toggle
      const langBtn = sr.querySelector('#langBtn');
      const langDrop = sr.querySelector('#langDrop');
      langBtn?.addEventListener('click', e => {
        e.stopPropagation();
        langDrop.classList.toggle('open');
      });
      if (this._langCloseFn) document.removeEventListener('click', this._langCloseFn);
      this._langCloseFn = () => langDrop?.classList.remove('open');
      document.addEventListener('click', this._langCloseFn);

      const fallbackDialog = sr.querySelector('#languageFallbackDialog');
      const fallbackCancel = sr.querySelector('#languageFallbackCancel');
      const fallbackConfirm = sr.querySelector('#languageFallbackConfirm');
      let fallbackHref = '';
      sr.querySelectorAll('a[data-locale-relationship="english-fallback"]').forEach(link => {
        link.addEventListener('click', event => {
          event.preventDefault();
          fallbackHref = link.getAttribute('href') || '/';
          langDrop?.classList.remove('open');
          if (fallbackDialog && typeof fallbackDialog.showModal === 'function') fallbackDialog.showModal();
          else if (window.confirm(this._translation('navigation.fallbackWarningBody', 'The next page is in English. Your current work will not be translated.'))) window.location.assign(fallbackHref);
        });
      });
      fallbackCancel?.addEventListener('click', () => fallbackDialog?.close('cancel'));
      fallbackConfirm?.addEventListener('click', () => {
        if (fallbackHref) window.location.assign(fallbackHref);
      });
      fallbackDialog?.addEventListener('close', () => {
        if (fallbackDialog.returnValue !== 'confirm') langBtn?.focus();
      });

      // Escape
      if (this._keydownFn) document.removeEventListener('keydown', this._keydownFn);
      this._keydownFn = e => {
        if (e.key === 'Escape') {
          closeMenus();
          langDrop?.classList.remove('open');
          if (this._menuOpen) setMenuOpen(false);
        }
      };
      document.addEventListener('keydown', this._keydownFn);

      // Mobile hamburger
      burger?.addEventListener('click', () => {
        // The drawer already contains useful server-rendered navigation. Open it
        // immediately, then hydrate registry-backed search data in the background.
        // Waiting for that optional data made the first mobile tap appear broken on
        // slower devices and left aria-expanded unchanged until the promise settled.
        if (!navbarDataLoaded) this._prepareNavData();
        setMenuOpen(!this._menuOpen);
      });

      mob?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        setMenuOpen(false);
      }));

      // ── ACTIVE PAGE INDICATOR ──
      const path = window.location.pathname;
      sr.querySelectorAll('.nav-links .lnk[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '/' && path.startsWith(href)) {
          link.classList.add('active');
        }
      });
      const activePath = path.replace(/^\/(fr|sw)(?=\/)/, '');
      if (/^\/(countries|nchi|nigeria|kenya|ghana|south-africa|egypt|tanzania|rwanda|senegal)(\/|$)/.test(activePath)) {
        countriesBtn?.classList.add('active');
      }
      if (/^\/(all-tools|zana-zote|categories|tools|zana)(\/|$)/.test(activePath)) {
        allBtn?.classList.add('active');
      }
      if (/^\/(widgets|api|sponsored-tools|custom-calculators|media-kit|business-enquiry)(\/|$)/.test(activePath)) {
        businessBtn?.classList.add('active');
      }

      // ── RECENTLY USED TOOLS (localStorage) ──
      const RECENT_KEY = 'aft_recent_tools';
      const MAX_RECENT = 5;

      const getRecent = () => {
        try {
          return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
        } catch { return []; }
      };

      const saveRecent = (tool) => {
        try {
          let recent = getRecent().filter(t => t.href !== tool.href);
          recent.unshift(tool);
          if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
          localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
        } catch {}
      };

      // Track page visit as recently used
      if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
        const currentTool = AFRO_TOOLS.find(t => t.status === 'live' && path.startsWith(t.href));
        if (currentTool) {
          saveRecent({ name: currentTool.name, href: currentTool.href, icon: currentTool.icon || '🔧' });
        }
      }

      // ── SEARCH (desktop handled by command-palette.js) ──
      const mobSearchInput   = sr.querySelector('.mob-search-input');
      const mobSearchResults = sr.querySelector('#mobSearchResults');
      const mobCategoriesWrap = sr.querySelector('#mobCategoriesWrap');
      const mobCountryBlock = sr.querySelector('.mob-country-block');
      const mobBusinessBlock = sr.querySelector('.mob-business-block');
      const countrySearchInput = sr.querySelector('#countrySearchInput');
      const countrySearchResults = sr.querySelector('#countrySearchResults');
      const mobileCountrySearchInput = sr.querySelector('#mobileCountrySearchInput');
      const mobileCountrySearchResults = sr.querySelector('#mobileCountrySearchResults');

      let _activeIdx = -1;

      // Swahili discovery fallback: current pages may load an older minified registry,
      // so map English source rows to verified /sw/ pages until the registry bundle is refreshed.


      const localizeSwDiscoveryTool = (tool) => {
        const override = SW_DISCOVERY_OVERRIDES[tool.id];
        return override ? Object.assign({}, tool, override, { lang: 'sw', status: tool.status || 'live' }) : null;
      };

      const localizeHaDiscoveryTool = (tool) => {
        const override = HA_DISCOVERY_OVERRIDES[tool.id];
        return override ? Object.assign({}, tool, override, { lang: override.lang || 'ha', status: override.status || tool.status || 'live' }) : null;
      };

      const dedupeToolsByHref = (items) => {
        const seen = new Set();
        return items.filter(tool => {
          const key = normalizeDiscoveryHref(tool.href || tool.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      let toolRegistryLoadPromise = null;
      const ensureToolRegistry = () => {
        if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
          return Promise.resolve(AFRO_TOOLS);
        }
        if (toolRegistryLoadPromise) return toolRegistryLoadPromise;
        toolRegistryLoadPromise = new Promise(resolve => {
          let settled = false;
          let tries = 0;
          const MAX_TRIES = 15; // poll ~200ms x15 ≈ 3s before giving up
          let pollTimer = null;
          const registryReady = () => (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS));
          const finish = value => {
            if (settled) return;
            settled = true;
            if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
            document.removeEventListener('afrotools:registry-ready', check);
            // Never cache a failed (null) resolution permanently — allow a later call to retry.
            if (!value) toolRegistryLoadPromise = null;
            resolve(value);
          };
          // Ready-event / script-load handler: only resolve once AFRO_TOOLS is actually present.
          const check = () => { if (!settled && registryReady()) finish(AFRO_TOOLS); };
          // Independent poll chain: keeps retrying until the registry appears or MAX_TRIES is hit.
          const poll = () => {
            if (settled) return;
            if (registryReady()) { finish(AFRO_TOOLS); return; }
            if (tries >= MAX_TRIES) { finish(null); return; }
            tries++;
            pollTimer = setTimeout(poll, 200);
          };
          document.addEventListener('afrotools:registry-ready', check);
          const existing = document.querySelector('script[src*="tool-registry"]');
          if (existing) {
            // Script tag already present but may still be loading — wait for its load event and poll.
            existing.addEventListener('load', check, { once: true });
            existing.addEventListener('error', check, { once: true });
          } else {
            const script = document.createElement('script');
            script.src = '/assets/js/components/tool-registry.min.js';
            script.defer = true;
            script.onload = check;
            script.onerror = check;
            document.head.appendChild(script);
          }
          poll();
        });
        return toolRegistryLoadPromise;
      };

      const getTools = () => {
        if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
          var pageLang = this._getLang();
          if (pageLang === 'sw') {
            var swTools = AFRO_TOOLS.filter(t => (t.status === 'live' || t.status === 'new') && (t.lang || 'en') === 'sw');
            var swHrefs = new Set(swTools.map(t => normalizeDiscoveryHref(t.href || t.id)));
            var swFallbackTools = AFRO_TOOLS
              .filter(t => (t.status === 'live' || t.status === 'new') && (t.lang || 'en') === 'en')
              .map(localizeSwDiscoveryTool)
              .filter(Boolean)
              .filter(t => !swHrefs.has(normalizeDiscoveryHref(t.href || t.id)));

            return dedupeToolsByHref(swTools.concat(swFallbackTools));
          }

          if (pageLang === 'ha') {
            var haTools = AFRO_TOOLS.filter(t => (t.status === 'live' || t.status === 'new') && (t.lang || 'en') === 'ha');
            var haHrefs = new Set(haTools.map(t => normalizeDiscoveryHref(t.href || t.id)));
            var haFallbackTools = AFRO_TOOLS
              .filter(t => (t.status === 'live' || t.status === 'new') && (t.lang || 'en') === 'en')
              .map(localizeHaDiscoveryTool)
              .filter(Boolean)
              .filter(t => !haHrefs.has(normalizeDiscoveryHref(t.href || t.id)));

            return dedupeToolsByHref(haTools.concat(haFallbackTools));
          }

          return AFRO_TOOLS.filter(t => t.status === 'live' && (t.lang || 'en') === pageLang);
        }
        return null;
      };

      const escapeHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

      const highlightMatch = (text, query) => {
        if (!query) return escapeHtml(text);
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return escapeHtml(text).replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
      };

      const normalizeSearchText = value => String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();



      const getCategoryLabel = (catId) => {
        const cat = NAV_ITEMS.find(c => c.id === catId);
        return cat ? localizedItemText(cat, 'label', this._getLang()) : catId;
      };

      const searchTools = (query) => {
        const tools = getTools();
        if (!tools) return null;
        if (!query || query.length < 1) return [];
        const q = normalizeSearchText(query);
        const queryTokens = q.split(/\s+/).filter(Boolean);
        const pageLang = this._getLang();
        const intentTargets = pageLang === 'sw' ? (SW_SEARCH_INTENT_TARGETS[q] || []) : [];
        const directResults = pageLang === 'sw' ? (SW_SEARCH_DIRECT_RESULTS[q] || []) : [];
        const scored = [];
        for (const t of tools) {
          const nameL = normalizeSearchText(t.name);
          const descL = normalizeSearchText(t.desc);
          const metaL = [
            descL,
            normalizeSearchText(t.href || ''),
            normalizeSearchText(t.id || ''),
            normalizeSearchText(t.category || '')
          ].join(' ');
          let score = 0;
          if (nameL === q) score = 100;
          else if (nameL.startsWith(q)) score = 80;
          else if (nameL.includes(q)) score = 60;
          else if (metaL.includes(q)) score = 30;
          else {
            const allMatch = queryTokens.every(w => nameL.includes(w) || metaL.includes(w));
            if (allMatch) score = 20;
          }
          const intentRank = intentTargets.indexOf(normalizeDiscoveryHref(t.href || t.id));
          if (intentRank !== -1) score += 90 - (intentRank * 10);
          if (score > 0) scored.push({ tool: t, score });
        }
        scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (b.tool.priority || 0) - (a.tool.priority || 0);
        });
        const seen = new Set();
        return directResults.concat(scored.map(s => s.tool)).filter(tool => {
          const key = normalizeDiscoveryHref(tool.href || tool.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 8);
      };

      const normalizeCountryQuery = value => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const renderCountryResults = (input, container, limit) => {
        if (!input || !container) return;
        var lang = this._getLang();
        var countryUi = {
          loading: lang === 'sw' ? 'Inapakia nchi...' : lang === 'ha' ? 'Ana loda kasashe...' : lang === 'yo' ? 'Ó ń kojú àwọn orílẹ̀-èdè...' : 'Loading countries...',
          empty: lang === 'sw' ? 'Hakuna nchi inayolingana' : lang === 'ha' ? 'Ba a sami kasar da ta dace ba' : lang === 'yo' ? 'A kò rí orílẹ̀-èdè tó bá mu' : 'No exact country found',
          viewAll: lang === 'sw' ? 'Nchi zote' : lang === 'ha' ? 'Duk kasashe' : lang === 'yo' ? 'Wo gbogbo rẹ̀' : 'View all',
          open: lang === 'sw' ? 'Fungua' : lang === 'ha' ? 'Bude' : lang === 'yo' ? 'Ṣí' : 'Open',
        };
        var query = input.value.trim();
        if (!query) {
          container.innerHTML = '';
          return;
        }
        container.innerHTML = '<div class="country-search-result" aria-live="polite">' + countryUi.loading + '</div>';
        this._loadCountryData().then(countries => {
          var q = normalizeCountryQuery(query);
          var results = this._countrySearchItems(countries).filter(country => {
            return normalizeCountryQuery(country.label + ' ' + country.meta).indexOf(q) !== -1;
          }).slice(0, limit || 6);
          if (!results.length) {
            container.innerHTML = '<a class="country-search-result" href="' + this._countriesHref() + '"><span>' + countryUi.empty + '</span><span class="country-search-meta">' + countryUi.viewAll + '</span></a>';
            return;
          }
          container.innerHTML = results.map(country => {
            return '<a class="country-search-result" role="option" href="' + country.href + '"><span>' + escapeHtml(country.label) + '</span><span class="country-search-meta">' + escapeHtml(country.meta || countryUi.open) + '</span></a>';
          }).join('');
        });
      };

      const bindCountrySearch = (input, container, limit) => {
        if (!input || !container) return;
        input.addEventListener('focus', () => this._loadCountryData());
        input.addEventListener('input', () => renderCountryResults(input, container, limit));
        input.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          var first = container.querySelector('a');
          window.location.href = first ? first.href : this._countriesHref();
        });
      };

      bindCountrySearch(countrySearchInput, countrySearchResults, 6);
      bindCountrySearch(mobileCountrySearchInput, mobileCountrySearchResults, 5);

      // ── Search capture: send queries to /api/capture-search for product intelligence ──
      let _captureTimer = null;
      let _captureCount = 0;
      const _canCaptureSearch = !/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname) && location.protocol !== 'file:';
      const _captureSessionId = (() => {
        try {
          let sid = sessionStorage.getItem('_afro_search_sid');
          if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('_afro_search_sid', sid); }
          return sid;
        } catch { return null; }
      })();

      const captureSearch = (query, resultsCount, source) => {
        clearTimeout(_captureTimer);
        if (!_canCaptureSearch || !query || query.length < 2 || _captureCount >= 20) return;
        _captureTimer = setTimeout(() => {
          _captureCount++;
          try {
            const payload = JSON.stringify({
              query: query.slice(0, 200),
              results_count: resultsCount,
              source: source || 'navbar',
              page_url: location.href,
              session_id: _captureSessionId
            });
            if (navigator.sendBeacon) {
              navigator.sendBeacon('/api/capture-search', payload);
            }
          } catch {}
        }, 500);
      };

      const renderResults = (tools, query, container) => {
        const lang = this._getLang();
        const searchUi = {
          loadingTools: lang === 'sw' ? 'Inapakia zana…' : lang === 'ha' ? 'Ana loda kayan aiki...' : lang === 'yo' ? 'Ó ń kojú irinṣẹ...' : 'Loading tools…',
          registryWait: lang === 'sw' ? 'Orodha ya zana bado inapakia' : lang === 'ha' ? 'Jerin kayan aiki bai gama lodi ba' : lang === 'yo' ? 'Àtòjọ irinṣẹ kò tíì parí kíkójú' : 'Tool registry not loaded yet',
          recentlyUsed: lang === 'sw' ? 'Zilizotumika hivi karibuni' : lang === 'ha' ? 'An yi amfani da su kwanan nan' : lang === 'yo' ? 'Èyí tí a lo laipẹ' : 'Recently Used',
          clearRecent: lang === 'sw' ? 'Futa' : lang === 'ha' ? 'Goge' : lang === 'yo' ? 'Pa rẹ́' : 'Clear',
          allToolsLabel: lang === 'sw' ? 'Zana zote za Kiswahili' : lang === 'ha' ? 'Kayan aikin Hausa' : lang === 'yo' ? 'Irinṣẹ Yorùbá' : 'All Tools',
          typeToSearch: lang === 'sw' ? 'Andika PAYE, PDF, VAT, WAEC au jina la nchi' : lang === 'ha' ? 'Rubuta PAYE, PDF, VAT, JAMB, WAEC ko Nigeria' : lang === 'yo' ? 'Tẹ PAYE, PDF, VAT, JAMB, WAEC tàbí Naijiria' : 'Type to search 2,594+ tools',
          searchEmpty: lang === 'sw' ? 'Tafuta zana za Kiswahili na Afrika' : lang === 'ha' ? 'Bincika kayan aikin Hausa da Afirka' : lang === 'yo' ? 'Wá irinṣẹ Yoruba àti Afirika' : 'Search 2,594+ African tools',
          searchHint: lang === 'sw' ? 'Jaribu "PAYE", "PDF", "VAT", "WAEC"...' : lang === 'ha' ? 'Gwada "PAYE", "JAMB", "WAEC", "PDF"...' : lang === 'yo' ? 'Gbìyànjú "PAYE", "JAMB", "WAEC", "PDF"...' : 'Try "PAYE", "PDF", "japa", "BMI"...',
          noToolsFound: lang === 'sw' ? 'Hakuna zana iliyopatikana' : lang === 'ha' ? 'Ba a sami kayan aiki ba' : lang === 'yo' ? 'A kò rí irinṣẹ kankan' : 'No tools found',
          differentSearch: lang === 'sw' ? 'Jaribu neno jingine au jina la nchi' : lang === 'ha' ? 'Gwada wata kalma ko sunan kasa' : lang === 'yo' ? 'Gbìyànjú ọ̀rọ̀ míràn tàbí orúkọ orílẹ̀-èdè' : 'Try a different search term',
        };
        if (tools === null) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">⏳</div><div class="search-empty-text">' + searchUi.loadingTools + '</div><div class="search-empty-hint">' + searchUi.registryWait + '</div></div>';
          return;
        }
        if (!query || query.length < 1) {
          // Show recently used tools if any
          const recent = getRecent();
          if (recent.length > 0) {
            container.innerHTML = '<div class="search-section-label">' + searchUi.recentlyUsed + ' <button class="recent-clear" id="clearRecent">' + searchUi.clearRecent + '</button></div>' +
              recent.map((t, i) => `
                <a href="${escapeHtml(t.href || '#')}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}" role="option" aria-selected="${i === 0}">
                  <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
                  <div>
                    <div class="search-result-name">${escapeHtml(t.name)}</div>
                  </div>
                </a>`).join('') +
              '<div class="search-section-label" style="padding-top:16px">' + searchUi.allToolsLabel + '</div>' +
              '<div class="search-empty" style="padding:16px"><div class="search-empty-hint">' + searchUi.typeToSearch + '</div></div>';
            _activeIdx = 0;
            container.querySelector('#clearRecent')?.addEventListener('click', e => {
              e.preventDefault(); e.stopPropagation();
              try { localStorage.removeItem(RECENT_KEY); } catch {}
              container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">' + searchUi.searchEmpty + '</div><div class="search-empty-hint">' + searchUi.searchHint + '</div></div>';
            });
            return;
          }
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">' + searchUi.searchEmpty + '</div><div class="search-empty-hint">' + searchUi.searchHint + '</div></div>';
          return;
        }
        if (tools.length === 0) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">😔</div><div class="search-empty-text">' + searchUi.noToolsFound + '</div><div class="search-empty-hint">' + searchUi.differentSearch + '</div></div>';
          return;
        }
        _activeIdx = 0;
        container.innerHTML = tools.map((t, i) => `
          <a href="${escapeHtml(t.href || '#')}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}" role="option" aria-selected="${i === 0}">
            <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
            <div>
              <div class="search-result-name">${highlightMatch(t.name, query)}</div>
              <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              <div class="search-result-cat">${escapeHtml(getCategoryLabel(t.category))}</div>
            </div>
          </a>`).join('');
      };

      // ── MOBILE SEARCH (desktop search handled by command-palette.js) ──
      const mobileSearchText = () => {
        var lang = this._getLang();
        return {
          loading: lang === 'sw' ? 'Inapakia zana...' : lang === 'ha' ? 'Ana loda kayan aiki...' : lang === 'yo' ? 'Ó ń kojú irinṣẹ...' : 'Loading tools...',
          empty: lang === 'sw' ? 'Hakuna zana iliyopatikana' : lang === 'ha' ? 'Ba a sami kayan aiki ba' : lang === 'yo' ? 'A kò rí irinṣẹ kankan' : 'No tools found',
        };
      };
      let _mobDebounce;
      mobSearchInput?.addEventListener('input', () => {
        clearTimeout(_mobDebounce);
        _mobDebounce = setTimeout(() => {
          const q = mobSearchInput.value.trim();
          if (!q) {
            mobSearchResults.innerHTML = '';
            mobCategoriesWrap.style.display = '';
            if (mobCountryBlock) mobCountryBlock.style.display = '';
            if (mobBusinessBlock) mobBusinessBlock.style.display = '';
            return;
          }
          const results = searchTools(q);
          if (results === null) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">' + mobileSearchText().loading + '</div>';
            mobCategoriesWrap.style.display = 'none';
            if (mobCountryBlock) mobCountryBlock.style.display = 'none';
            if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
            ensureToolRegistry().then(tools => {
              if (mobSearchInput.value.trim() !== q) return;
              if (Array.isArray(tools)) {
                mobSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
              } else {
                mobSearchResults.innerHTML = '<div class="mob-search-empty">' + mobileSearchText().empty + '</div>';
              }
            });
            return;
          }
          if (results.length === 0) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">' + mobileSearchText().empty + '</div>';
            mobCategoriesWrap.style.display = 'none';
            if (mobCountryBlock) mobCountryBlock.style.display = 'none';
            if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
            // Analytics: track mobile search no results
            if (q && q.length >= 2 && window.AfroTools?.analytics) {
              window.AfroTools.analytics.trackSearch(q, 0, 'navbar');
              window.AfroTools.analytics.trackSearchNoResults(q, 'navbar');
            }
            captureSearch(q, 0, 'navbar');
            return;
          }
          mobCategoriesWrap.style.display = 'none';
          if (mobCountryBlock) mobCountryBlock.style.display = 'none';
          if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
          mobSearchResults.innerHTML = results.map(t => `
            <a href="${escapeHtml(t.href || '#')}" class="search-result" role="option">
              <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
              <div>
                <div class="search-result-name">${highlightMatch(t.name, q)}</div>
                <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              </div>
            </a>`).join('');
          // Analytics: track mobile search
          if (q && q.length >= 2 && window.AfroTools?.analytics) {
            window.AfroTools.analytics.trackSearch(q, results.length, 'navbar');
          }
          captureSearch(q, results.length, 'navbar');
        }, 100);
      });

      // Clear mobile search when closing drawer
      // ── AUTH STATE: update Sign-in button when user logs in/out ──
      const loginBtn = sr.querySelector('.btn-login');
      const proBtn = sr.querySelector('.btn-pro');
      const mobLoginBtn = sr.querySelector('.mob-login');
      const mobProLink = sr.querySelector('.mob-pro-link');
      const mobVaultLink = sr.querySelector('.mob-vault-link');
      const mobPointsLink = sr.querySelector('.mob-points-link');

      var _apBadgeLoaded = false;
      var _apBadgeRequestToken = '';
      var _proNavRequestToken = 0;
      const readNavJson = (key) => {
        try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e) { return null; }
      };
      const isExpiredProValue = (value) => {
        if (!value) return false;
        var time = Date.parse(value);
        return !Number.isNaN(time) && time <= Date.now();
      };
      const sameNavUser = (base, extra) => {
        if (!base || !extra) return false;
        if (base.id && extra.id && base.id === extra.id) return true;
        if (base.email && extra.email && String(base.email).toLowerCase() === String(extra.email).toLowerCase()) return true;
        return false;
      };
      const mergeCachedProUser = (user, status) => {
        if (!user || !user.id) return null;
        var merged = Object.assign({}, user);
        var profile = status && status.profile || status && status.user || null;
        if (profile && sameNavUser(user, profile)) {
          merged = Object.assign(merged, profile, {
            tier: profile.subscription_tier || profile.tier || merged.tier || 'free',
            subscription_tier: profile.subscription_tier || profile.tier || merged.subscription_tier || merged.tier || 'free',
            subscription_expires_at: profile.subscription_expires_at || merged.subscription_expires_at || null
          });
        }
        var cachedProfile = readNavJson('afro_profile_cache');
        if (cachedProfile && cachedProfile.user && sameNavUser(user, cachedProfile.user)) {
          var cachedUser = cachedProfile.user;
          merged = Object.assign(merged, cachedUser, {
            tier: cachedUser.subscription_tier || cachedUser.tier || merged.tier || 'free',
            subscription_tier: cachedUser.subscription_tier || cachedUser.tier || merged.subscription_tier || merged.tier || 'free',
            subscription_expires_at: cachedUser.subscription_expires_at || merged.subscription_expires_at || null
          });
        }
        var cachedStatus = readNavJson('afro_pro_status_cache');
        var cacheFresh = cachedStatus && cachedStatus.cachedAt && Date.now() - Number(cachedStatus.cachedAt) < 5 * 60 * 1000;
        var cacheMatches = cachedStatus && (!cachedStatus.email || String(cachedStatus.email).toLowerCase() === String(user.email || '').toLowerCase());
        if (cacheFresh && cacheMatches) {
          merged.tier = cachedStatus.tier || merged.tier;
          merged.subscription_tier = cachedStatus.tier || merged.subscription_tier || merged.tier;
          merged.subscription_expires_at = cachedStatus.expiresAt || merged.subscription_expires_at || null;
          if (cachedStatus.isPro && !isExpiredProValue(merged.subscription_expires_at)) {
            merged.tier = merged.tier || 'pro';
            merged.subscription_tier = merged.subscription_tier || 'pro';
          }
        }
        return merged;
      };
      const isProUser = (user) => {
        var tier = String((user && (user.subscription_tier || user.tier || user.plan)) || '').toLowerCase();
        var role = String((user && user.role) || '').toLowerCase();
        var expiry = user && (user.subscription_expires_at || user.pro_expires_at || user.expires_at);
        return (role === 'admin' || role === 'owner' || ['pro', 'premium', 'team', 'business', 'enterprise', 'lifetime', 'trialing'].indexOf(tier) !== -1) && !isExpiredProValue(expiry);
      };
      const setProNav = (user, status) => {
        user = mergeCachedProUser(user, status);
        var _lang = this._getLang();
        var _proHref = _lang === 'sw' ? '/sw/bei/' : _lang === 'fr' ? '/fr/pro/' : _lang === 'ha' ? '/ha/farashi/' : '/pro/';
        var _workspaceHref = _lang === 'sw' ? '/sw/dashboard/' : _lang === 'fr' ? '/fr/pro/' : _lang === 'ha' ? '/ha/farashi/?destination=%2Fpro%2Fworkspace%2F&return_to=%2Fha%2F' : '/pro/workspace/';
        var _isPro = isProUser(user);
        var _hasUser = !!(user && user.id);
        var _label = _isPro
          ? (_lang === 'sw' ? 'Eneo la Pro' : _lang === 'fr' ? 'Espace Pro' : _lang === 'ha' ? 'Wurin Pro' : 'Pro Workspace')
          : _hasUser
            ? (_lang === 'sw' ? 'Pata Pro' : _lang === 'fr' ? 'Passer Pro' : _lang === 'ha' ? 'Samu Pro' : 'Upgrade Pro')
            : 'Pro';
        var _href = _isPro ? _workspaceHref : _proHref;
        var _proAria = _isPro
          ? (_lang === 'sw' ? 'Fungua eneo la AfroTools Pro' : _lang === 'fr' ? 'Ouvrir l’espace Pro AfroTools' : _lang === 'ha' ? 'Bude wurin AfroTools Pro' : 'Open AfroTools Pro Workspace')
          : (_lang === 'sw' ? 'Fungua bei na hali ya AfroTools Pro kwa Kiswahili' : _lang === 'fr' ? 'Ouvrir les offres AfroTools Pro' : _lang === 'ha' ? 'Bude tsarin AfroTools Pro' : 'Open AfroTools Pro plans');
        if (proBtn) {
          proBtn.textContent = _label;
          proBtn.href = _href;
          proBtn.className = 'btn-pro' + (_isPro ? ' is-pro' : _hasUser ? ' is-free' : '');
          proBtn.setAttribute('aria-label', _proAria);
        }
        if (mobProLink) {
          mobProLink.textContent = _isPro ? _label : (_hasUser ? _label : 'AfroTools Pro');
          mobProLink.href = _href;
          mobProLink.className = 'mob-pro-link' + (_isPro ? ' is-pro' : _hasUser ? ' is-free' : '');
          mobProLink.setAttribute('aria-label', _proAria);
        }
      };
      const refreshProNavFromGate = (user) => {
        if (!user || !user.id || !window.AfroProGate || typeof window.AfroProGate.getStatus !== 'function') return;
        var requestToken = ++_proNavRequestToken;
        window.AfroProGate.getStatus({ fresh: false }).then(function(status) {
          if (requestToken !== _proNavRequestToken) return;
          if (!window.AfroAuth || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) return;
          var activeUser = AfroAuth.getUser ? AfroAuth.getUser() : user;
          if (!sameNavUser(user, activeUser)) return;
          setProNav(activeUser, status);
        }).catch(function() {});
      };
      const resetSignedOutAuthUI = () => {
        _apBadgeLoaded = false;
        _apBadgeRequestToken = '';
        sr.querySelectorAll('.ap-nav-badge').forEach(function(el) { el.remove(); });
        setProNav(null);
        if (mobVaultLink) mobVaultLink.style.display = 'none';
        if (mobPointsLink) {
          mobPointsLink.style.display = 'none';
          mobPointsLink.textContent = 'AfroPoints';
        }
      };
      const clearRejectedAuth = (reason) => {
        if (window.AfroAuthSessionBridge && typeof window.AfroAuthSessionBridge.clear === 'function') {
          window.AfroAuthSessionBridge.clear(reason);
          return;
        }
        try {
          localStorage.removeItem('afro_auth_v2');
          localStorage.removeItem('afro_session_v3');
          localStorage.removeItem('afro_profile_cache');
        } catch(e) {}
        window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: null, authenticated: false, reason: reason || 'session-rejected' } }));
      };
      const updateAuthUI = () => {
        var _lang = this._getLang();
        var _dashboardHref = _lang === 'sw' ? '/sw/dashboard/' : _lang === 'fr' ? '/fr/dashboard/' : _lang === 'ha' ? '/ha/allon-aiki/' : '/dashboard/';
        var _authHref = _lang === 'ha' ? '/ha/shiga/?next=%2Fha%2Fallon-aiki%2F' : (_lang === 'sw' ? '/sw/auth/' : _lang === 'fr' ? '/fr/auth/' : '/auth/') + '?mode=login&next=' + encodeURIComponent(_dashboardHref);
        var _dashboardLabel = _lang === 'sw' ? 'Dashibodi' : _lang === 'fr' ? 'Tableau de bord' : _lang === 'ha' ? 'Allon aiki' : 'Dashboard';
        setProNav(null);
        if (typeof AfroAuth === 'undefined' || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) {
          resetSignedOutAuthUI();
          // Not logged in — show Sign in (i18n)
          var _signLabel = _lang === 'sw' ? 'Ingia' : _lang === 'fr' ? 'Connexion' : _lang === 'ha' ? 'Shiga' : 'Sign in';
          if (loginBtn) {
            loginBtn.className = 'btn-login';
            loginBtn.textContent = _signLabel;
            loginBtn.href = _authHref;
            loginBtn.removeAttribute('aria-label');
            loginBtn.removeAttribute('title');
            loginBtn.onclick = _lang === 'ha' ? null : function(e) { if (typeof AfroAuth !== 'undefined' && AfroAuth.openModal) { e.preventDefault(); AfroAuth.openModal(); } };
          }
          if (mobLoginBtn) {
            mobLoginBtn.textContent = _signLabel;
            mobLoginBtn.href = _authHref;
            mobLoginBtn.onclick = _lang === 'ha' ? null : function(e) { if (typeof AfroAuth !== 'undefined' && AfroAuth.openModal) { e.preventDefault(); AfroAuth.openModal(); } };
          }
          return;
        }
        const user = AfroAuth.getUser();
        setProNav(user);
        refreshProNavFromGate(user);
        const displayName = this._cleanDisplayName(user && user.name, _dashboardLabel);
        const name = displayName.split(' ')[0] || _dashboardLabel;
        const safeName = this._escapeHtml(name);
        const initial = this._escapeHtml((name[0] || 'D').toUpperCase());
        // Desktop: show avatar initial + first name
        if (loginBtn) {
          loginBtn.className = 'btn-login is-user';
          loginBtn.href = _dashboardHref;
          loginBtn.onclick = null;
          loginBtn.setAttribute('aria-label', displayName + ' - ' + _dashboardLabel);
          loginBtn.setAttribute('title', displayName + ' - ' + _dashboardLabel);
          loginBtn.innerHTML = '<span class="nav-user-avatar" aria-hidden="true">' + initial + '</span><span class="nav-user-name user-menu-name">' + safeName + '</span>';
        }
        // AfroPoints badge — show points balance next to avatar (once only)
        if (!_apBadgeLoaded) {
          _apBadgeLoaded = true;
          try {
            var token = AfroAuth.getSessionToken ? AfroAuth.getSessionToken() : null;
            if (token) {
              _apBadgeRequestToken = token;
              fetch('/.netlify/functions/afropoints-profile', { headers: { Authorization: 'Bearer ' + token } })
                .then(function(r) {
                  if (r.status === 401 || r.status === 403) {
                    resetSignedOutAuthUI();
                    clearRejectedAuth('afropoints-profile-rejected');
                    return null;
                  }
                  return r.json();
                })
                .then(function(p) {
                  if (!p || p.error || !(p.current_balance >= 0)) return;
                  var activeToken = null;
                  try { activeToken = AfroAuth.getSessionToken ? AfroAuth.getSessionToken() : null; } catch(e) {}
                  if (!AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn() || activeToken !== _apBadgeRequestToken) return;
                  sr.querySelectorAll('.ap-nav-badge').forEach(function(el) { el.remove(); });
                  var badge = document.createElement('a');
                  badge.href = '/tools/afropoints/';
                  badge.className = 'ap-nav-badge';
                  badge.title = 'AfroPoints Balance';
                  var pts = p.current_balance || 0;
                  var display = pts >= 10000 ? (pts / 1000).toFixed(1) + 'k' : pts.toLocaleString();
                  badge.textContent = display;
                  if (p.current_streak > 0) badge.textContent += ' 🔥';
                  if (loginBtn && loginBtn.parentNode) loginBtn.parentNode.insertBefore(badge, loginBtn.nextSibling);
                  // Update mobile points link with balance
                  if (mobPointsLink) mobPointsLink.textContent = 'AfroPoints - ' + display + (p.current_streak > 0 ? ' streak' : '');
                }).catch(function() {});
            }
          } catch(e) {}
        }
        // Mobile: show name + vault link
        if (mobLoginBtn) {
          mobLoginBtn.href = _dashboardHref;
          mobLoginBtn.onclick = null;
          mobLoginBtn.textContent = name + ' \u2014 ' + _dashboardLabel;
        }
        if (mobVaultLink) mobVaultLink.style.display = '';
        if (mobPointsLink) mobPointsLink.style.display = '';
      };

      // Run on initial load (auth may already be ready)
      const tryInitialAuth = () => {
        if (typeof AfroAuth !== 'undefined' && AfroAuth.isLoggedIn) {
          updateAuthUI();
        }
      };
      // Check immediately and also after a short delay (auth script may not be loaded yet)
      tryInitialAuth();
      setTimeout(tryInitialAuth, 500);
      setTimeout(tryInitialAuth, 1500);

      // Listen for auth state changes
      window.addEventListener('afro-auth-change', updateAuthUI);
      window.addEventListener('afro-pro-gate-ready', updateAuthUI);
      window.addEventListener('dashboard-auth-state-change', function(event) {
        var state = event && event.detail && event.detail.state;
        if (state === 'signedOut' || state === 'sessionError') {
          resetSignedOutAuthUI();
          clearRejectedAuth('dashboard-' + state);
        }
      });
    }

    _lockBodyScroll() {
      if (this._bodyLocked) return;
      this._lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + this._lockedScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      this._bodyLocked = true;
    }

    _unlockBodyScroll() {
      if (!this._bodyLocked) return;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, this._lockedScrollY || 0);
      this._bodyLocked = false;
    }
  }

  function _globalNavLang() {
    var segs = window.location.pathname.split('/');
    var first = segs[1];
    if (['fr','sw','yo','ha'].indexOf(first) !== -1) return first;
    return document.documentElement.lang || 'en';
  }

  function _markEnglishOnlyToolsForLang(tools, lang) {
    if ((lang !== 'sw' && lang !== 'yo' && lang !== 'ha') || !Array.isArray(tools)) return tools;
    var localizedRoot = '/' + lang + '/';
    var marker = lang === 'yo' ? '(ojú ìwé Gẹẹsi)' : lang === 'ha' ? '- shafi na Turanci' : '(Kiingereza tu)';
    return tools.map(function(tool) {
      var href = tool.href || '';
      if (href.indexOf(localizedRoot) === 0 || tool.badge === 'EN') return tool;
      var copy = Object.assign({}, tool);
      if (copy.label && copy.label.indexOf(marker) === -1) {
        copy.label += ' ' + marker;
      }
      copy.badge = 'EN';
      return copy;
    });
  }

  function _localizedGlobalNavItems() {
    var lang = _globalNavLang();
    if (lang !== 'fr' && lang !== 'sw' && lang !== 'yo' && lang !== 'ha') return NAV_ITEMS;
    return NAV_ITEMS.map(function(item) {
      var copy = Object.assign({}, item);
      if (lang === 'fr') {
        if (item.hrefFr) copy.href = item.hrefFr;
        if (item.labelFr) copy.label = item.labelFr;
        if (item.descFr) copy.desc = item.descFr;
        if (item.toolsFr) copy.tools = item.toolsFr;
      } else if (lang === 'sw') {
        var swHref = SW_CATEGORY_HREFS[item.id] || item.hrefSw;
        if (swHref) copy.href = swHref;
        copy.label = localizedItemText(item, 'label', lang);
        copy.desc = localizedItemText(item, 'desc', lang);
        copy.tools = item.toolsSw || _markEnglishOnlyToolsForLang(item.tools, lang);
      } else if (lang === 'ha') {
        var haHref = HA_CATEGORY_HREFS[item.id] || item.hrefHa;
        if (haHref) copy.href = haHref;
        copy.label = localizedItemText(item, 'label', lang);
        copy.desc = localizedItemText(item, 'desc', lang);
        copy.tools = item.toolsHa || _markEnglishOnlyToolsForLang(item.tools, lang);
      } else if (lang === 'yo') {
        var yoHref = YO_CATEGORY_HREFS[item.id] || item.hrefYo;
        if (yoHref) copy.href = yoHref;
        copy.label = localizedItemText(item, 'label', lang);
        copy.desc = localizedItemText(item, 'desc', lang);
        copy.tools = item.toolsYo || _markEnglishOnlyToolsForLang(item.tools, lang);
      }
      return copy;
    });
  }

  /* Expose localized NAV_ITEMS globally for command palette + other consumers */
  window.__AFRO_NAV_ITEMS = _localizedGlobalNavItems();
  window.__AFRO_BUSINESS_NAV_ITEMS = localizedBusinessLinks(_globalNavLang()).slice();

  if (!customElements.get('afro-navbar')) {
    customElements.define('afro-navbar', AfroNavbar);
  }

  (function _countrySelectorLoader() {
    if (customElements.get('afro-country-selector')) return;
    if (document.querySelector('script[src*="country-selector.js"]')) return;
    function loadSelector() {
      if (customElements.get('afro-country-selector') || document.querySelector('script[src*="country-selector.js"]')) return;
      var selectorScript = document.createElement('script');
      selectorScript.id = 'afro-country-selector-js';
      selectorScript.src = '/assets/js/components/country-selector.js?v=3';
      selectorScript.defer = true;
      document.head.appendChild(selectorScript);
    }
    if (Array.isArray(window.AFRICAN_COUNTRIES) && window.AFRICAN_COUNTRIES.length) {
      loadSelector();
      return;
    }
    var existing = document.querySelector('script[src*="african-countries.js"]');
    if (existing) {
      existing.addEventListener('load', loadSelector, { once: true });
      return;
    }
    var registryScript = document.createElement('script');
    registryScript.id = 'afro-country-registry-js';
    registryScript.src = '/assets/js/data/african-countries.js';
    registryScript.onload = loadSelector;
    document.head.appendChild(registryScript);
  })();

  /* ── LAZY-LOAD AUTH SYSTEM (every page gets login/signup capability) ── */
  function _hasLocalAuthHint() {
    try {
      return !!(window.localStorage && (localStorage.getItem('afro_auth_v2') || localStorage.getItem('afro_session_v3')));
    } catch (err) {
      return false;
    }
  }

  setTimeout(function() {
    function _authLS(src, cb) {
      if (document.querySelector('script[src*="' + src.split('/').pop() + '"]')) { if (cb) cb(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function() { if (cb) cb(); };
      s.onerror = function() { if (cb) cb(); };
      document.body.appendChild(s);
    }
    function _canUseAuthCookieBridge() {
      try {
        var host = window.location.hostname || '';
        return !/^(localhost|127\.0\.0\.1|::1)$/.test(host) || !!window.AFROTOOLS_ENABLE_LOCAL_AUTH_API;
      } catch (err) {
        return true;
      }
    }
    _authLS('/assets/js/data/african-countries.js', function() {
      _authLS('/assets/js/afro-auth.js', function() {
        _authLS('/assets/js/components/auth-modal.js', function() {
          if (_canUseAuthCookieBridge()) _authLS('/assets/js/auth-cookie-upgrade.js?v=4');
        });
      });
    });
  }, _hasLocalAuthHint() ? 800 : 12000);

  /* ── PWA: inject manifest, theme-color & service worker from navbar (every page) ── */
  (function _pwa() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.json';
      document.head.appendChild(l);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#0062CC';
      document.head.appendChild(m);
    }
    const s = document.createElement('script'); s.src = '/assets/js/pwa-install.js'; s.defer = true;
    document.head.appendChild(s);
  })();

  /* ── DEFERRED SCRIPTS: load after main thread is idle ── */
  var _idle = window.requestIdleCallback || function(cb) { setTimeout(cb, 1500); };

  /* Analytics: load early (not idle-deferred) so auto-tracking initializes on DOMContentLoaded */
  if (!document.getElementById('afro-analytics-js')) {
    var _as = document.createElement('script'); _as.id = 'afro-analytics-js';
    _as.src = '/assets/js/lib/analytics.js'; document.head.appendChild(_as);
  }

  _idle(function() {
    /* Animations */
    var skipDecorativeMotion = false;
    try {
      skipDecorativeMotion = window.matchMedia && window.matchMedia('(max-width: 720px), (prefers-reduced-motion: reduce)').matches;
    } catch (err) {}
    if (skipDecorativeMotion) {
      document.querySelectorAll('.rv, .rv-scale').forEach(function(el) { el.classList.add('in'); });
    } else {
      if (!document.getElementById('afro-animations-css')) {
        var l = document.createElement('link'); l.id = 'afro-animations-css';
        l.rel = 'stylesheet'; l.href = '/assets/css/animations.css';
        document.head.appendChild(l);
      }
      if (!document.getElementById('afro-animations-js')) {
        var s = document.createElement('script'); s.id = 'afro-animations-js';
        s.src = '/assets/js/animations.js'; s.defer = true;
        document.head.appendChild(s);
      }
    }

    /* Error boundary (global error handler + UI helpers) */
    if (!document.getElementById('afro-error-boundary-js')) {
      var eb = document.createElement('script'); eb.id = 'afro-error-boundary-js';
      eb.src = '/assets/js/lib/error-boundary.js'; eb.defer = true;
      document.head.appendChild(eb);
    }

    /* Command Palette (Ctrl+K search) */
    if (!document.getElementById('afro-cmd-palette-js')) {
      var cp = document.createElement('script'); cp.id = 'afro-cmd-palette-js';
      cp.src = '/assets/js/components/command-palette.js'; cp.defer = true;
      document.head.appendChild(cp);
    }

    /* Pro gate */
    if (window.AfroProGate || document.getElementById('afro-pro-gate-js') || document.querySelector('script[src*="/assets/js/pro-gate.js"]')) {
      window.dispatchEvent(new CustomEvent('afro-pro-gate-ready'));
    } else {
      var pg = document.createElement('script'); pg.id = 'afro-pro-gate-js'; pg.src = '/assets/js/pro-gate.js'; pg.defer = true;
      pg.onload = function() { window.dispatchEvent(new CustomEvent('afro-pro-gate-ready')); };
      document.head.appendChild(pg);
    }

    /* Share image (tool pages only) */
    if (document.querySelector('.action-row') && !document.getElementById('afro-share-img-js')) {
      var si = document.createElement('script'); si.id = 'afro-share-img-js';
      si.src = '/assets/js/share-image-inject.js'; si.defer = true;
      document.head.appendChild(si);
    }
  });

  /* Auth: load afro-auth.js (consolidated Supabase auth) */
  setTimeout(function() { _idle(function() {
    if (window._afroAuthLoaded) return;
    if (!document.getElementById('afro-auth-js')) {
      var s = document.createElement('script'); s.id = 'afro-auth-js';
      s.src = '/assets/js/afro-auth.js?v=6'; document.head.appendChild(s);
    }
  }); }, _hasLocalAuthHint() ? 800 : 12000);
})();
