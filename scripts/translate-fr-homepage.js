/**
 * Translate fr/index.html — replaces all English visible text with French equivalents.
 * Run: node scripts/translate-fr-homepage.js
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'fr', 'index.html');
let html = fs.readFileSync(file, 'utf8');

// Helper: ordered replacements (first match wins per line)
const replacements = [
  // ─── HERO ───
  ['>Africa\'s Financial Operating System<', '>Le Systeme Financier de l\'Afrique<'],
  ['Calculate your salary after tax. Track exchange rates. Plan your budget. Export PDF reports. All with AI guidance — for every African country, in English and French.',
   'Calculez votre salaire net. Suivez les taux de change. Planifiez votre budget. Exportez des rapports PDF. Le tout avec l\'IA — pour chaque pays africain, en anglais et en francais.'],
  ['>Open Dashboard →<', '>Tableau de bord →<'],
  ['>Calculate My Pay<', '>Calculer mon salaire<'],
  ['placeholder="e.g. Nigeria PAYE, PDF merge, currency…"', 'placeholder="ex. PAYE Nigeria, fusion PDF, devises…"'],
  ['aria-label="Search tools"', 'aria-label="Rechercher des outils"'],
  ['placeholder="Search PAYE, invoice, PDF, VAT, currency..."', 'placeholder="Rechercher PAYE, facture, PDF, TVA, devises..."'],
  ['aria-label="Dismiss save and sync message"', "aria-label=\"Fermer le message d'enregistrement et de synchronisation\""],
  ['>Search</button>', '>Rechercher</button>'],
  ['>Search PAYE, invoice, PDF...</strong>', '>Rechercher PAYE, facture, PDF...</strong>'],
  ['label="Search or choose a country"', 'label="Rechercher ou choisir un pays"'],
  ['>Search or choose a country</label>', '>Rechercher ou choisir un pays</label>'],
  ['>Open country hub</a>', '>Ouvrir la page pays</a>'],
  ['>Open</button>', '>Ouvrir</button>'],
  ['>Start by country</a>', '>Commencer par pays</a>'],
  ['aria-label="Start by country"', 'aria-label="Commencer par pays"'],
  ['>Start by country</div>', '>Commencer par pays</div>'],
  ['aria-label="Selected country actions"', 'aria-label="Actions du pays selectionne"'],
  ['aria-label="Choose country"', 'aria-label="Choisir un pays"'],
  ['aria-label="Popular countries"', 'aria-label="Pays populaires"'],
  ['aria-label="Top tools"', 'aria-label="Outils principaux"'],
  ['aria-label="Salary and tax tools"', 'aria-label="Outils salaire et fiscalite"'],
  ['aria-label="Tools"', 'aria-label="Outils"'],
  ['aria-label="Student and education tools"', 'aria-label="Outils etudiants et education"'],

  // ─── USE CASE CARDS ───
  ['>Calculate PAYE Tax<', '>Calculateur d\'impots PAYE<'],
  ['>See your exact take-home pay in 30 seconds<', '>Votre salaire net exact en 30 secondes<'],
  ['>Generate PDF Reports<', '>Generateur de rapports PDF<'],
  ['>Merge, split, and organize documents privately<', '>Fusionnez, divisez et organisez vos documents en prive<'],
  ['>AI Financial Advisor</div>\n        <div class="uc-desc">Get personalized tax guidance powered by AI<', '>Conseiller financier IA</div>\n        <div class="uc-desc">Conseils fiscaux personnalises propulses par l\'IA<'],
  ['>Plan Your Relocation<', '>Planifiez votre expatriation<'],
  ['>Know the true cost of moving abroad<', '>Estimez le cout reel de l\'expatriation<'],

  // ─── SOCIAL PROOF ───
  ['>Trusted by professionals across Africa<', '>Utilise par des professionnels a travers l\'Afrique<'],
  ['>Countries</div>', '>Pays</div>'],
  ['>Tools</div>', '>Outils</div>'],
  ['>Languages</div>', '>Langues</div>'],
  ['>Powered Advisors</div>', '>Conseillers IA</div>'],

  // ─── MY TOOLS ───
  ['> My Tools', '> Mes outils'],
  ['>Clear all</button>', '>Tout effacer</button>'],

  // ─── PLATFORM FEATURES ───
  ['>More Than Calculators — A Complete Financial Platform<', '>Plus que des calculateurs — Une plateforme financiere complete<'],
  ['>Everything you need to manage your finances across Africa.<', '>Tout ce qu\'il vous faut pour gerer vos finances a travers l\'Afrique.<'],
  ['>Smart Dashboard<', '>Tableau de bord intelligent<'],
  ['>Your financial overview in one place. Recent calculations, tax rates, FX watchlist — personalized to your country.<', '>Vue d\'ensemble financiere en un seul endroit. Calculs recents, taux d\'imposition, suivi des devises — personnalise selon votre pays.<'],
  ['>Open Dashboard →</a>', '>Tableau de bord →</a>'],
  ['>Charts & PDF Export<', '>Graphiques et export PDF<'],
  ['>Visual tax breakdowns with donut charts. Download professional PDF summaries for visa applications, bank loans, or records.<', '>Decomposition visuelle des impots avec graphiques. Telechargez des resumes PDF professionnels pour les visas, prets bancaires ou archives.<'],
  // AI Financial Advisor in platform features
  ['>AI Financial Advisor</h3>\n        <p>Ask questions about your tax, salary, or budget in plain language. The AI knows your country\'s tax law and references your calculations.<', '>Conseiller financier IA</h3>\n        <p>Posez vos questions sur vos impots, salaire ou budget en langage courant. L\'IA connait la legislation fiscale de votre pays.<'],
  ['>Live FX Rates<', '>Taux de change en direct<'],
  ['>Daily exchange rates for all African currencies. Bank vs market rates. Rate alerts coming soon.<', '>Taux de change quotidiens pour toutes les devises africaines. Taux bancaires vs marche. Alertes bientot disponibles.<'],
  ['>Check Rates →<', '>Voir les taux →<'],
  ['>Document Vault<', '>Coffre-fort documents<'],
  ['>Save your payslips, tax summaries, and invoices. Access them anytime from your secure vault.<', '>Sauvegardez vos fiches de paie, bilans fiscaux et factures. Accedez-y a tout moment depuis votre coffre-fort securise.<'],
  ['>My Vault →<', '>Mon coffre-fort →<'],

  // ─── PAYE SECTION ───
  ['>Salary &amp; Tax<', '>Salaires et impots<'],
  ['>See All →<', '>Voir tout →<'],
  ['id="paye-heading">PAYE Calculators — 54 Countries<', 'id="paye-heading">Calculateurs PAYE — 54 pays<'],
  ['>Country-accurate income tax with real bands, real deductions, real take-home pay — sourced directly from each country\'s revenue authority. Select tools include an AI Advisor that explains your results.<', '>Impot sur le revenu precis par pays avec de vrais baremes, de vraies deductions, un vrai salaire net — directement des autorites fiscales de chaque pays. Certains outils incluent un conseiller IA.<'],
  // Filter buttons
  ['>All Countries</button>', '>Tous les pays</button>'],
  ['>Available Now</button>', '>Disponible maintenant</button>'],
  ['>AI Advisor Included</button>', '>Conseiller IA inclus</button>'],
  // Feature banner
  ['>Most Used Tool<', '>Outil le plus utilise<'],
  ['>PAYE Tax Calculators<br>for Africa<', '>Calculateurs d\'impots PAYE<br>pour l\'Afrique<'],
  ['>Country-accurate take-home pay across all 54 African countries. Real tax bands, real deductions, AI-powered explanations.<', '>Salaire net precis pour les 54 pays africains. Baremes reels, deductions reelles, explications par IA.<'],
  ['>Calculate Your Tax →<', '>Calculez vos impots →<'],
  // Tool card CTAs
  ['>Calculate →<', '>Calculer →<'],
  // Bottom CTA
  ['>View All PAYE Calculators →<', '>Voir tous les calculateurs PAYE →<'],
  ['>All 54 African countries live<', '>Les 54 pays africains disponibles<'],

  // ─── TOOLS SECTION ───
  ['>Tools</div>\n      <a href="/fr/all-tools/"', '>Outils</div>\n      <a href="/fr/all-tools/"'],
  ['>Built for Africa\'s Everyday Needs<', '>Concu pour les besoins quotidiens de l\'Afrique<'],
  ['>One PDF workspace. Currency tools. Career docs. Financial calculators built for African realities — not Western defaults.<', '>Un espace PDF. Outils de devises. Documents de carriere. Calculateurs financiers concus pour les realites africaines — pas les standards occidentaux.<'],
  // PDF Workspace
  ['>● Available Now<', '>● Disponible maintenant<'],
  ['>AfroTools PDF Workspace<', '>Espace PDF AfroTools<'],
  ['>Everything PDF in one place — merge, split, compress, convert to images, add watermarks, password protect, and add page numbers. All browser-based. Files never leave your device.<', '>Tout le PDF en un seul endroit — fusionner, diviser, compresser, convertir en images, filigranes, protection par mot de passe et numeros de pages. Tout dans le navigateur. Vos fichiers ne quittent jamais votre appareil.<'],
  ['>🔗 Merge &amp; Split<', '>🔗 Fusionner et diviser<'],
  ['>🗜️ Compress<', '>🗜️ Compresser<'],
  ['>🖼️ PDF ↔ Image<', '>🖼️ PDF ↔ Image<'],
  ['>💧 Watermark<', '>💧 Filigrane<'],
  ['>🔐 Password<', '>🔐 Mot de passe<'],
  ['>🔢 Page Numbers<', '>🔢 Numeros de pages<'],
  ['>Open Workspace →<', '>Ouvrir l\'espace →<'],
  // Utility tool cards
  ['>Currency Converter<', '>Convertisseur de devises<'],
  ['>Live forex & crypto rates for all 54 African currencies. Bank rate comparison & remittance corridors.<', '>Taux forex et crypto en direct pour les 54 devises africaines. Comparaison des taux bancaires et corridors de transfert.<'],
  ['>● Live<', '>● En ligne<'],
  ['>Open Tool →<', '>Ouvrir l\'outil →<'],
  ['>VAT Calculator<', '>Calculateur de TVA<'],
  ['>Pan-African VAT across all 54 countries. Nigeria 7.5%, Kenya 16%, South Africa 15%, multi-item invoice mode.<', '>TVA panafricaine pour les 54 pays. Nigeria 7,5 %, Kenya 16 %, Afrique du Sud 15 %, mode facture multi-articles.<'],
  ['>CV / Résumé Builder<', '>Createur de CV<'],
  ['>6 modern templates (Slate, Ember, Phantom, Indigo, Noir, Stone). Africa-country formats. PDF download.<', '>6 modeles modernes (Slate, Ember, Phantom, Indigo, Noir, Stone). Formats par pays africain. Telechargement PDF.<'],
  ['>Invoice Generator<', '>Generateur de factures<'],
  ['>Create professional invoices in any African currency. VAT-aware. Download PDF or send by email.<', '>Creez des factures professionnelles dans toute devise africaine. Compatible TVA. Telechargez en PDF ou envoyez par email.<'],
  ['>Remittance Comparator<', '>Comparateur de transferts<'],
  ['>Compare fees and exchange rates across Western Union, Wise, Remitly, M-Pesa Global and more.<', '>Comparez les frais et taux de change de Western Union, Wise, Remitly, M-Pesa Global et plus.<'],
  ['>Import Duty Calculator<', '>Calculateur de droits de douane<'],
  ['>Real NCS, KRA, SARS, GRA customs duties + all levies (CISS, IDF, RDL). Full landed cost in local currency for 17 African countries.<', '>Droits de douane reels NCS, KRA, SARS, GRA + toutes les taxes (CISS, IDF, RDL). Cout total rendu en monnaie locale pour 17 pays africains.<'],
  ['>Japa Cost Calculator<', '>Calculateur de cout d\'expatriation<'],
  ['>Total relocation cost from Africa. 12 origins, 7 destinations, 17 visa pathways. Full breakdown.<', '>Cout total d\'expatriation depuis l\'Afrique. 12 origines, 7 destinations, 17 voies de visa. Detail complet.<'],
  ['>WAEC / NECO Grade Calc<', '>Calculateur WAEC / NECO<'],
  ['>Aggregate, JAMB + O\'Level eligibility checker, GPA converter (4.0 & 5.0 scale), Ghana WASSCE. All 12 top Nigerian universities + cut-offs.<', '>Agregat, verificateur d\'eligibilite JAMB + O\'Level, convertisseur GPA (echelles 4.0 et 5.0), Ghana WASSCE. Les 12 meilleures universites nigerianes + notes minimales.<'],
  ['>Mobile Money Fee Checker<', '>Verificateur de frais Mobile Money<'],
  ['>M-Pesa, MTN MoMo, Airtel Money — see exact send/withdraw fees before you transact.<', '>M-Pesa, MTN MoMo, Airtel Money — consultez les frais d\'envoi et de retrait exacts avant de transiger.<'],
  ['>See all tools in the pipeline →<', '>Voir tous les outils en developpement →<'],

  // ─── AFRODRAFT ───
  ['Featured Tool · Engineering', 'Outil vedette · Ingenierie'],
  ['>Africa\'s first browser-based CAD tool. 60+ AutoCAD-style features — draw, dimension, annotate, layers, blocks, snap modes. Export to SVG, DXF, PNG. Works on mobile.<', '>Le premier outil CAO africain dans le navigateur. 60+ fonctions style AutoCAD — dessiner, coter, annoter, calques, blocs, modes d\'accrochage. Export SVG, DXF, PNG. Fonctionne sur mobile.<'],
  ['>📐 60+ CAD Commands<', '>📐 60+ commandes CAO<'],
  ['>📱 Touch Enabled<', '>📱 Tactile<'],
  ['>💾 SVG / DXF Export<', '>💾 Export SVG / DXF<'],
  ['>Launch AfroDraft →<', '>Lancer AfroDraft →<'],

  // ─── EDUCATION ───
  ['>Education</div>\n      <a href="/fr/tools/education-hub/"', '>Education</div>\n      <a href="/fr/tools/education-hub/"'],
  ['>Education Hub →<', '>Hub Education →<'],
  ['>Student &amp; Education Tools<', '>Outils etudiants et educatifs<'],
  ['>GPA converters, WAEC grading, JAMB aggregates, IELTS prep, flashcards, scholarships and study planning — built for African students.<', '>Convertisseurs GPA, notes WAEC, agregats JAMB, preparation IELTS, cartes memoire, bourses et planification d\'etudes — concus pour les etudiants africains.<'],
  ['>GPA Calculator</div>', '>Calculateur GPA</div>'],
  ['>Convert grades across African and international GPA scales. CGPA tracking and semester breakdown.<', '>Convertissez les notes entre les echelles GPA africaines et internationales. Suivi du CGPA et detail par semestre.<'],
  ['>WAEC/NECO Calculator</div>', '>Calculateur WAEC/NECO</div>'],
  ['>Calculate WAEC and NECO aggregate scores. Check admission eligibility for Nigerian and Ghanaian universities.<', '>Calculez les scores agregats WAEC et NECO. Verifiez l\'eligibilite aux universites nigerianes et ghaneennes.<'],
  ['>JAMB Aggregate Calculator</div>', '>Calculateur d\'agregat JAMB</div>'],
  ['>Combine JAMB UTME and O\'Level scores. Post-UTME screening aggregate for Nigerian universities.<', '>Combinez les scores JAMB UTME et O\'Level. Agregat de selection post-UTME pour les universites nigerianes.<'],
  ['>IELTS Calculator</div>', '>Calculateur IELTS</div>'],
  ['>Calculate IELTS overall band score from section scores. Check requirements for UK, Canada, Australia admissions.<', '>Calculez le score global IELTS a partir des scores par section. Verifiez les exigences pour le Royaume-Uni, le Canada et l\'Australie.<'],
  ['>Flashcard Maker</div>', '>Createur de cartes memoire</div>'],
  ['>Create, study and share flashcard decks. Spaced repetition for effective revision. Works offline.<', '>Creez, etudiez et partagez des paquets de cartes memoire. Repetition espacee pour une revision efficace. Fonctionne hors ligne.<'],
  ['>Scholarship Finder</div>', '>Recherche de bourses</div>'],
  ['>Discover scholarships for African students. Filter by country, field of study, degree level and deadline.<', '>Decouvrez des bourses pour les etudiants africains. Filtrez par pays, domaine d\'etudes, niveau de diplome et date limite.<'],
  ['>Study Planner</div>', '>Planificateur d\'etudes</div>'],
  ['>Plan your revision timetable. Allocate study hours, track progress and stay on schedule for exams.<', '>Planifiez votre calendrier de revision. Repartissez les heures d\'etude, suivez vos progres et respectez le planning des examens.<'],
  ['>Education Hub</div>', '>Hub Education</div>'],
  ['>All education tools in one place. University rankings, admission guides, exam prep and career resources.<', '>Tous les outils educatifs en un seul endroit. Classements universitaires, guides d\'admission, preparation aux examens et ressources carrieres.<'],

  // ─── CATEGORIES ───
  ['>Categories</div>\n      <a href="/fr/all-tools/"', '>Categories</div>\n      <a href="/fr/all-tools/"'],
  ['>Explore All →<', '>Explorer tout →<'],
  ['id="cats-heading">550+ Tools. 54 Countries. <span id="cats-tool-count">English & French</span>.<', 'id="cats-heading">550+ outils. 54 pays. <span id="cats-tool-count">Anglais et francais</span>.<'],
  ['id="cats-heading">2 594+ Tools. 54 Countries. <span id="cats-tool-count">English, French & Swahili</span>.<', 'id="cats-heading">2 594+ outils. 54 pays. <span id="cats-tool-count">Anglais, francais et swahili</span>.<'],
  ['>AfroTools is Africa\'s financial operating system — every tool you reach for, built for African context, free forever.<', '>AfroTools est le systeme financier de l\'Afrique — chaque outil dont vous avez besoin, concu pour le contexte africain, gratuit pour toujours.<'],

  // ─── ROADMAP ───
  ['>Roadmap 2026</div>', '>Feuille de route 2026</div>'],
  ['id="pipeline-heading" style="text-transform:none;letter-spacing:-0.03em;font-size:clamp(1.6rem,4vw,2.6rem)">Building Africa\'s Financial Operating System<', 'id="pipeline-heading" style="text-transform:none;letter-spacing:-0.03em;font-size:clamp(1.6rem,4vw,2.6rem)">Construire le systeme financier de l\'Afrique<'],
  ['> tools live across 54 countries. New tools ship weekly. Here\'s what\'s coming next.<', '> outils disponibles dans 54 pays. De nouveaux outils chaque semaine. Voici ce qui arrive.<'],
  ['>✅ Q1 2026 — Live Now<', '>✅ T1 2026 — En ligne<'],
  ['id="roadmap-live-count">550+ Tools Across 54 Countries<', 'id="roadmap-live-count">550+ outils dans 54 pays<'],
  ['>Tax calculators, PDF workspace, BOQ builder, business plan generator, crypto suite, currency tools, medical tools, and hundreds more.<', '>Calculateurs d\'impots, espace PDF, generateur BOQ, generateur de business plan, suite crypto, outils de devises, outils medicaux et des centaines d\'autres.<'],
  ['>🔨 Q2 2026 — Building<', '>🔨 T2 2026 — En construction<'],
  ['>Engineering & Health<', '>Ingenierie et sante<'],
  ['>Structural calculators, concrete mix design, electrical load planner, ovulation tracker, sickle cell advisor, African food nutrition counter.<', '>Calculateurs structurels, conception de melange beton, planificateur de charge electrique, suivi d\'ovulation, conseiller drepanocytose, compteur nutritionnel cuisine africaine.<'],
  ['>📋 Q3 2026 — Planned<', '>📋 T3 2026 — Prevu<'],
  ['>Business & Legal<', '>Business et juridique<'],
  ['>Startup valuation, African stock screener, salary benchmark, business registration checker, legal document templates.<', '>Evaluation de startup, screener boursier africain, benchmark salarial, verificateur d\'immatriculation, modeles de documents juridiques.<'],
  ['>🚀 Q4 2026 — The Platform<', '>🚀 T4 2026 — La plateforme<'],
  ['>API, Pro & Community<', '>API, Pro et communaute<'],
  ['>Developer API for tax & currency data, AfroTools Pro with team accounts, community forum, saved work sync across devices.<', '>API developpeur pour les donnees fiscales et devises, AfroTools Pro avec comptes d\'equipe, forum communautaire, synchronisation des travaux entre appareils.<'],
  ['>Get notified when your tool launches →<', '>Soyez notifie au lancement de votre outil →<'],

  // ─── COUNTRIES ───
  ['>54 Countries</div>\n    <h2', '>54 pays</div>\n    <h2'],
  ['>Every Nation. One Platform.<', '>Chaque nation. Une seule plateforme.<'],
  ['>All 54 African countries now have live PAYE calculators with country-specific tax bands, social security, and AI advisor.<', '>Les 54 pays africains disposent desormais de calculateurs PAYE avec baremes fiscaux, securite sociale et conseiller IA specifiques a chaque pays.<'],
  ['>Live — PAYE calculator + tools available<', '>En ligne — Calculateur PAYE + outils disponibles<'],
  ['>West Africa<', '>Afrique de l\'Ouest<'],
  ['>East Africa<', '>Afrique de l\'Est<'],
  ['>North Africa<', '>Afrique du Nord<'],
  ['>Southern Africa<', '>Afrique australe<'],
  ['>Central Africa<', '>Afrique centrale<'],
  ['>Browse All 54 Countries →<', '>Parcourir les 54 pays →<'],

  // ─── LIVE DATA ───
  ['><span class="live-dot"></span> Live Data</div>', '><span class="live-dot"></span> Donnees en direct</div>'],
  ['>Live African Market Data<', '>Donnees des marches africains en direct<'],
  ['>Real-time financial data for all 54 African countries. Updated every 15 minutes.<', '>Donnees financieres en temps reel pour les 54 pays africains. Mise a jour toutes les 15 minutes.<'],
  ['>Live forex rates for 42 African currencies. Historical charts, crypto prices, cross-rate matrix.<', '>Taux forex en direct pour 42 devises africaines. Graphiques historiques, prix crypto, matrice de taux croises.<'],
  ['>42 Currencies<', '>42 devises<'],
  ['>15-min Updates<', '>MAJ toutes les 15 min<'],
  ['>API Access<', '>Acces API<'],
  ['>Pan-African fuel price tracker. Interactive map, country comparison, generator cost calculator.<', '>Suivi des prix du carburant panafricain. Carte interactive, comparaison par pays, calculateur de cout generateur.<'],
  ['>54 Countries</span>', '>54 pays</span>'],
  ['>Interactive Map<', '>Carte interactive<'],
  ['>Gen Calculator<', '>Calculateur generateur<'],
  ['>Central bank rates, inflation, T-bill yields, and MPC calendar for all 54 African countries.<', '>Taux des banques centrales, inflation, rendements des bons du Tresor et calendrier MPC pour les 54 pays africains.<'],
  ['>Inflation Map<', '>Carte d\'inflation<'],
  ['>MPC Calendar<', '>Calendrier MPC<'],

  // ─── WHY AFROTOOLS ───
  ['>Our Standards<', '>Nos standards<'],
  ['>Not Generic Tools<br>With African Flags.<', '>Pas des outils generiques<br>avec des drapeaux africains.<'],
  ['>Every tool passes 6 rules before it ships.<', '>Chaque outil respecte 6 regles avant d\'etre publie.<'],
  ['>Local Accuracy First<', '>Precision locale d\'abord<'],
  ['>Every rate pulled from FIRS, KRA, GRA, SARS. When Kenya repealed SHIF relief in Dec 2024, we updated same day. When Ethiopia restructured to 6 bands in July 2025, same day.<', '>Chaque taux provient de FIRS, KRA, GRA, SARS. Quand le Kenya a abroge l\'allegement SHIF en dec. 2024, mise a jour le jour meme. Quand l\'Ethiopie a restructure en 6 tranches en juil. 2025, le jour meme.<'],
  ['>African Context<', '>Contexte africain<'],
  ['>Nigerian plots. South African morgen. M-Pesa till QR codes. WAEC grade scales. Generator fuel vs solar ROI. No tool is built for London and relabelled for Lagos.<', '>Parcelles nigerianes. Morgen sud-africain. Codes QR M-Pesa. Echelles de notes WAEC. Generateur carburant vs ROI solaire. Aucun outil n\'est concu pour Londres et rebaptise pour Lagos.<'],
  ['>AI That Explains<', '>IA qui explique<'],
  ['>Select tools include an AI Advisor — not just numbers, but context. What your effective tax rate actually means. Powered by Claude Sonnet.<', '>Certains outils incluent un conseiller IA — pas seulement des chiffres, mais du contexte. Ce que votre taux d\'imposition effectif signifie reellement. Propulse par Claude Sonnet.<'],
  ['>Privacy by Default<', '>Confidentialite par defaut<'],
  ['>PDF tools process entirely in your browser. Files never leave your device, never uploaded to any server. No accounts needed for any tool.<', '>Les outils PDF fonctionnent entierement dans votre navigateur. Les fichiers ne quittent jamais votre appareil. Aucun compte requis.<'],
  ['>Mobile First, Bandwidth Aware<', '>Mobile d\'abord, econome en bande passante<'],
  ['>Over 60% of Africa\'s internet users are on mobile. Image compressor defaults to minimal output. Every tool under 100KB uncompressed. Works on 2G.<', '>Plus de 60 % des internautes africains sont sur mobile. Compresseur d\'images optimise au minimum. Chaque outil sous 100 Ko. Fonctionne en 2G.<'],
  ['>Built to Last<', '>Concu pour durer<'],
  ['>Plain HTML, CSS, and JavaScript. No React, no frameworks, no CDN dependencies for core logic. Every tool will still work in 10 years.<', '>HTML, CSS et JavaScript pur. Pas de React, pas de frameworks, pas de dependances CDN. Chaque outil fonctionnera encore dans 10 ans.<'],

  // ─── NEWSLETTER ───
  ['>New Tools.<br>Every Week.<br>Free.<', '>Nouveaux outils.<br>Chaque semaine.<br>Gratuit.<'],
  ['>Get notified when we launch tools for your country. One email per major release. No spam, no marketing. Cancel anytime.<', '>Soyez notifie quand nous lancons des outils pour votre pays. Un email par mise a jour majeure. Pas de spam. Desabonnement libre.<'],
  ['>Notify Me →<', '>Me notifier →<'],
  ['>Join our growing community of African professionals.<', '>Rejoignez notre communaute croissante de professionnels africains.<'],

  // ─── API ───
  ['>Build with AfroTools API<', '>Construisez avec l\'API AfroTools<'],
  ['Tax rates, FX rates, salary benchmarks, and PAYE calculations for all 54 African countries. Free tier: 100 requests/day.', 'Taux d\'imposition, taux de change, benchmarks salariaux et calculs PAYE pour les 54 pays africains. Niveau gratuit : 100 requetes/jour.'],
  ['>Get Your API Key →<', '>Obtenez votre cle API →<'],

  // ─── "Sign in" text in My Tools ───
  ['><a href="/fr/dashboard/" style="color:#0062CC;font-weight:600;text-decoration:none;">Sign in</a> to save and sync your favourite tools across devices.<', '><a href="/fr/dashboard/" style="color:#0062CC;font-weight:600;text-decoration:none;">Connectez-vous</a> pour sauvegarder et synchroniser vos outils favoris.<'],
  ['>No saved tools yet. Browse tools and click the star to save them.<', '>Aucun outil sauvegarde. Parcourez les outils et cliquez sur l\'etoile pour les sauvegarder.<'],
];

// Apply replacements
let count = 0;
for (const [from, to] of replacements) {
  if (html.includes(from)) {
    html = html.replace(from, to);
    count++;
  }
}

// ─── JAVASCRIPT DYNAMIC TEXT ───
// These are in the <script> blocks and need special handling

html = html.split(' Tax &amp; Finance</button>').join(' Fiscalite &amp; finance</button>');
html = html.split(' Business &amp; FX</button>').join(' Entreprise &amp; change</button>');
html = html.split('>Business &amp; FX</div>').join('>Entreprise &amp; change</div>');
html = html.split('placeholder="Rechercher PAYE, invoice, PDF, VAT, currency..."').join('placeholder="Rechercher PAYE, facture, PDF, TVA, devises..."');
html = html.split('aria-label="Rechercher tools"').join('aria-label="Rechercher des outils"');
html = html.split('>Rechercher or choose a country</label>').join('>Rechercher ou choisir un pays</label>');
html = html.split('aria-label="Email address"').join('aria-label="Adresse e-mail"');
html = html.split('aria-label="All 54 African countries"').join('aria-label="Les 54 pays africains"');
html = html.split('All 54 African countries with live PAYE calculators').join('Les 54 pays africains avec calculateurs PAYE en direct');
html = html.split('aria-label="Embed Tools"').join('aria-label="Outils integrables"');
html = html.split("selector.getAttribute('label') || 'Choose country'").join("selector.getAttribute('label') || 'Choisir un pays'");
html = html.split('>Open workspace &rarr;</em>').join(">Ouvrir l'espace &rarr;</em>");
html = html.split('>Open Creator Studio &rarr;</a>').join('>Ouvrir le studio createur &rarr;</a>');
html = html.split('>Open Tool &rarr;</span>').join(">Ouvrir l'outil &rarr;</span>");
html = html.split('>Open Workspace â†’</div>').join(">Ouvrir l'espace â†’</div>");

// Hero h1 override
html = html.replace(
  "el.innerHTML = 'Africa\\'s Financial <span class=\"acc\">Operating System.</span><br><span class=\"hero-sub-line\">' + total + '+ Tools · 54 Countries · AI-Powered</span>'",
  "el.innerHTML = 'Le systeme financier <span class=\"acc\">de l\\'Afrique.</span><br><span class=\"hero-sub-line\">' + total + '+ outils · 54 pays · Propulse par IA</span>'"
);

// PAYE heading dynamic
html = html.replace(
  "el.textContent = 'PAYE Calculators \\u2014 ' + liveF + ' Countr' + (liveF===1?'y':'ies') + ' Live'",
  "el.textContent = 'Calculateurs PAYE \\u2014 ' + liveF + ' pay' + (liveF===1?'s':'s') + ' disponibles'"
);

// cats-heading dynamic
html = html.replace(
  "if (el) el.textContent = total + '+ Tools. 54 Countries. English & French.';",
  "if (el) el.textContent = total + '+ outils. 54 pays. Anglais et francais.';"
);
html = html.replace(
  "if (el) el.textContent = stats.display.liveToolsPlus + ' Tools. 54 Countries. English, French & Swahili.';",
  "if (el) el.textContent = stats.display.liveToolsPlus + ' outils. 54 pays. Anglais, francais et swahili.';"
);

// Roadmap live count
html = html.replace(
  "if (el) el.textContent = total + '+ Tools Across 54 Countries'",
  "if (el) el.textContent = total + '+ outils dans 54 pays'"
);

// renderCategories heading
html = html.replace(
  "h.innerHTML = total + '+ Tools. 54 Countries. <span id=\"cats-tool-count\">English &amp; French</span>.';",
  "h.innerHTML = total + '+ outils. 54 pays. <span id=\"cats-tool-count\">Anglais et fran\\u00e7ais</span>.';"
);
html = html.replace(
  "h.innerHTML = total + ' Tools. 54 Countries. <span id=\"cats-tool-count\">English, French &amp; Swahili</span>.';",
  "h.innerHTML = total + ' outils. 54 pays. <span id=\"cats-tool-count\">Anglais, francais et swahili</span>.';"
);

// Newsletter success button
html = html.replace(
  "btn.textContent = '\\u2713 You\\'re on the list!'",
  "btn.textContent = '\\u2713 Vous \\u00eates inscrit(e) !'"
);
html = html.replace(
  "btn.textContent = 'Notify Me →'",
  "btn.textContent = 'Me notifier →'"
);

// PAYE heading first sync script
html = html.replace(
  "if (ph && liveF > 0) ph.textContent = 'PAYE Calculators — ' + liveF + ' Tools Live'",
  "if (ph && liveF > 0) ph.textContent = 'Calculateurs PAYE — ' + liveF + ' pays disponibles'"
);

// Category labels in search
html = html.replace(
  "'financial':'Salary & Tax','document-pdf':'PDF & Docs',",
  "'financial':'Salaires et impots','document-pdf':'PDF et docs',"
);
html = html.replace(
  "'image-design':'Image & Design','developer':'Dev Tools',",
  "'image-design':'Image et design','developer':'Outils dev',"
);
html = html.replace(
  "'education':'Education','health':'Health & Agri',",
  "'education':'Education','health':'Sante et agri',"
);
html = html.replace(
  "'african':'Uniquely African','data-productivity':'Data & Productivity',",
  "'african':'Afrique unique','data-productivity':'Donnees et productivite',"
);
html = html.replace(
  "'language':'Language','engineering':'Engineering',",
  "'language':'Langues','engineering':'Ingenierie',"
);
html = html.replace(
  "'ecommerce':'VAT & Business','legal':'Mortgage & Property'",
  "'ecommerce':'TVA et business','legal':'Hypotheques et immobilier'"
);

// Pipeline phase labels
html = html.replace("label: '● Available Now'", "label: '● Disponible maintenant'");
html = html.replace("title: 'Live Now'", "title: 'En ligne'");
html = html.replace("label: 'Coming Soon'", "label: 'Bientot disponible'");
html = html.replace("title: 'All 54 PAYEs & VAT'", "title: 'Les 54 PAYE et TVA'");
html = html.replace("label: 'Coming Later'", "label: 'A venir'");
html = html.replace("title: 'Documents & Finance'", "title: 'Documents et finance'");
html = html.replace("label: 'On the Horizon'", "label: 'A l\\'horizon'");
html = html.replace("title: 'The Full Platform'", "title: 'La plateforme complete'");

// Category render labels
html = html.replace(
  "' Tool' + (count === 1 ? '' : 's') + ' Available'",
  "' outil' + (count === 1 ? '' : 's') + ' disponible' + (count === 1 ? '' : 's')"
);
html = html.replace("'Coming Soon'", "'Bient\\u00f4t disponible'");

// "+ more tools…" in pipeline
html = html.replace("'+ more tools…'", "'+ d\\'autres outils…'");

// ─── SCHEMA.ORG descriptions (keep English for SEO but add fr locale) ───
// These are fine in English for international SEO

// Current compact homepage shell introduced after the older translation table.
// Keep this close to the end so newer above-fold copy wins over stale partial
// replacements when the French homepage is refreshed from the English page.
const currentHomepageReplacements = [
  ['aria-label="Sign up prompt"', 'aria-label="Invite a l\'inscription"'],
  ['> Use tools free without an account. Create one only to save and sync calculations.<', '> Utilisez les outils gratuitement sans compte. Creez-en un seulement pour sauvegarder et synchroniser vos calculs.<'],
  ['>Save and sync &rarr;</a>', '>Sauvegarder et synchroniser &rarr;</a>'],
  ['>Salary &amp; Tax</a>', '>Salaire et impots</a>'],
  ['>PDF Tools</a>', '>Outils PDF</a>'],
  ['>Currency</a>', '>Devises</a>'],
  ['>CV Builder</a>', '>CV</a>'],
  ['>Invoice</a>', '>Factures</a>'],
  ['alt="Currency Converter"', 'alt="Convertisseur de devises"'],
  ['alt="Invoice Generator"', 'alt="Generateur de factures"'],
  ['>Countries</a>', '>Pays</a>'],
  ['>For business</a>', '>Business</a>'],
  ['>About</a>', '>A propos</a>'],
  ['href="/fr/tools/pdf-workspace/"', 'href="/fr/tools/espace-pdf/"'],
  ['href="/fr/tools/invoice-generator/"', 'href="/fr/tools/generateur-factures/"'],
  ['href="/fr/tools/currency-converter/"', 'href="/fr/tools/convertisseur-devises/"'],
  ['href="/fr/tools/vat-calculator/"', 'href="/fr/tools/calculateur-tva/"'],
  ['href="/fr/tools/cv-builder/"', 'href="/fr/tools/generateur-cv/"'],
  ['href="/fr/tools/remittance-compare/"', 'href="/fr/tools/transfert-argent/"'],
  ['href="/fr/tools/import-duty/"', 'href="/fr/tools/droits-douane/"'],
  ['href="/fr/tools/japa-calculator/"', 'href="/fr/tools/calculateur-japa/"'],
  ['href="/fr/tools/waec-calculator/"', 'href="/fr/tools/calculateur-waec/"'],
  ['href="/fr/tools/mobile-money-fees/"', 'href="/fr/tools/frais-mobile-money/"'],
  ['href="/fr/tools/education-hub/"', 'href="/fr/tools/hub-education/"'],
  ['href="/fr/tools/gpa-calculator/"', 'href="/fr/tools/calculateur-gpa/"'],
  ['href="/fr/tools/jamb-aggregate/"', 'href="/fr/tools/calculateur-jamb/"'],
  ['href="/fr/tools/ielts-calculator/"', 'href="/fr/tools/calculateur-ielts/"'],
  ['href="/fr/tools/fuel-tracker/"', 'href="/fr/tools/suivi-carburant/"'],
  ['href="/fr/tools/afrorates/"', 'href="/fr/tools/afrotaux/"'],
  ['href="/fr/tools/" class="cat-card', 'href="/fr/all-tools/" class="cat-card'],
  ['>Built for African countries<', '>Concu pour les pays africains<'],
  ['>Calculate PAYE, create invoices, edit PDFs, convert currencies, and plan business decisions with tools built around African currencies, laws, and workflows.<',
   '>Calculez le PAYE, creez des factures, modifiez des PDF, convertissez des devises et planifiez vos decisions business avec des outils adaptes aux monnaies, lois et workflows africains.<'],
  ['label="Use AfroTools for"', 'label="Utiliser AfroTools pour" currency-label="devise" search-placeholder="Rechercher parmi 54 pays africains" search-label="Rechercher des pays" diaspora-prefix="Je vis a l\'etranger mais je gere mon argent en " empty-message="Aucun pays trouve. Essayez Nigeria, Kenya, Ghana ou Afrique du Sud."'],
  ['href="/fr/tools/" class="btn-primary" data-country-tools-href', 'href="/fr/all-tools/" class="btn-primary" data-country-tools-href'],
  ['href="/fr/start/" class="btn-secondary"', 'href="/fr/countries/" class="btn-secondary"'],
  ['>Explore local tools &rarr;</a>', '>Explorer les outils locaux &rarr;</a>'],
  ['>Start by country</a>', '>Commencer par pays</a>'],
  ['<span>tools</span>', '<span>outils</span>'],
  ['<span>countries</span>', '<span>pays</span>'],
  ['<strong>Browser-private</strong><span>where possible</span>', '<strong>Prive dans le navigateur</strong><span>quand possible</span>'],
  ['<strong>Free core</strong><span>tools</span>', '<strong>Outils essentiels</strong><span>gratuits</span>'],
  ['aria-label="AfroTools product preview"', 'aria-label="Apercu produit AfroTools"'],
  ['>Popular workflows<', '>Workflows populaires<'],
  ['>Search PAYE, invoice, PDF...</strong>', '>Rechercher PAYE, facture, PDF...</strong>'],
  ['>Nigeria PAYE Calculator<', '>Calculateur PAYE Nigeria<'],
  ['>Nigeria VAT Calculator<', '>Calculateur TVA Nigeria<'],
  ['>FIRS PAYE, pension, NHF and national payroll assumptions.<', '>PAYE FIRS, pension, NHF et hypotheses de paie nationales.<'],
  ['>NGN business VAT workflow<', '>Workflow TVA business en NGN<'],
  ['>PDF Workspace<', '>Espace PDF<'],
  ['>Merge, split, compress locally<', '>Fusion, decoupe et compression en local<'],
  ['>Invoice Generator<', '>Generateur de factures<'],
  ['>VAT-aware African currencies<', '>TVA et devises africaines<'],
  ['>Calculator preview<', '>Apercu du calculateur<'],
  ['>Take-home estimate<', '>Estimation du net a payer<'],
  ['>NGN currency<', '>Devise NGN<'],
  ['>Income tax<', '>Impot sur le revenu<'],
  ['>Suggestions, examples and disclaimers now use Nigeria context.<', '>Suggestions, exemples et avertissements utilisent maintenant le contexte du Nigeria.<'],
  ['aria-label="Start by country"', 'aria-label="Commencer par pays"'],
  ['>Start by country</div>', '>Commencer par pays</div>'],
  ['>Use the rules, currency, and workflows that match where you work.<', '>Utilisez les regles, la devise et les workflows qui correspondent a votre marche.<'],
  ['label="Search or choose a country"', 'label="Rechercher ou choisir un pays" currency-label="devise" search-placeholder="Rechercher parmi 54 pays africains" search-label="Rechercher des pays" diaspora-prefix="Je vis a l\'etranger mais je gere mon argent en " empty-message="Aucun pays trouve. Essayez Nigeria, Kenya, Ghana ou Afrique du Sud."'],
  ['>Open country hub<', '>Ouvrir la page pays<'],
  ['href="/fr/tools/?country=NG" data-country-tools-href', 'href="/fr/all-tools/?country=NG" data-country-tools-href'],
  ['href="/fr/start/">Choose goal', 'href="/fr/countries/">Choisir un objectif'],
  ["var toolsHref = '/fr/tools/?country=' + encodeURIComponent(code);", "var toolsHref = '/fr/all-tools/?country=' + encodeURIComponent(code);"],
  ['>Browse local tools<', '>Parcourir les outils locaux<'],
  ['>Choose goal<', '>Choisir un objectif<'],
  ['>All countries<', '>Tous les pays<'],
  ['>Start with the common jobs<', '>Commencer avec les taches courantes<'],
  ['>Six useful ways into AfroTools<', '>Six entrees utiles dans AfroTools<'],
  ['>Focused entry points first. The full directory stays available when you need the long tail.<',
   '>Des points d\'entree cibles d\'abord. Le repertoire complet reste disponible quand vous avez besoin de la longue traine.<'],
  ['>Country-accurate take-home pay and deductions.<', '>Salaire net et deductions precis par pays.<'],
  ['>Calculate tax &rarr;<', '>Calculer l\'impot &rarr;<'],
  ['>Merge, split, compress, watermark, and protect files locally.<', '>Fusionnez, separez, compressez, filigranez et protegez les fichiers en local.<'],
  ['>Open workspace &rarr;<', '>Ouvrir l\'espace &rarr;<'],
  ['>Create VAT-aware invoices in African currencies.<', '>Creez des factures avec TVA dans les devises africaines.<'],
  ['>Create invoice &rarr;<', '>Creer une facture &rarr;<'],
  ['>Currency &amp; FX<', '>Devises et change<'],
  ['>Convert currencies and compare African money flows.<', '>Convertissez les devises et comparez les flux d\'argent africains.<'],
  ['>Convert money &rarr;<', '>Convertir l\'argent &rarr;<'],
  ['>VAT &amp; Business Tax<', '>TVA et taxes business<'],
  ['>VAT, margin, markup, and break-even tools.<', '>TVA, marge, majoration et seuil de rentabilite.<'],
  ['>Explore VAT tools &rarr;<', '>Explorer les outils TVA &rarr;<'],
  ['>Career &amp; CV<', '>Carriere et CV<'],
  ['>Build practical documents for African job markets.<', '>Creez des documents pratiques pour les marches de l\'emploi africains.<'],
  ['>Build CV &rarr;<', '>Creer un CV &rarr;<'],
  ['aria-label="Why trust AfroTools"', 'aria-label="Pourquoi faire confiance a AfroTools"'],
  ['>Built around local rules<', '>Construit autour des regles locales<'],
  ['>Tax, VAT, salary, and compliance tools name the country logic they use.<', '>Les outils de taxe, TVA, salaire et conformite indiquent la logique pays utilisee.<'],
  ['>Runs in your browser<', '>Fonctionne dans votre navigateur<'],
  ['>Most calculators and document tools keep your inputs on your device.<', '>La plupart des calculateurs et outils documentaires gardent vos saisies sur votre appareil.<'],
  ['>No account required<', '>Pas de compte obligatoire<'],
  ['>Core tools are free to use. Accounts are optional for saving history.<', '>Les outils essentiels sont gratuits. Le compte sert seulement a sauvegarder l\'historique.<'],
  ['>Updated when laws change<', '>Mis a jour quand les lois changent<'],
  ['>Country pages and tax calculators are maintained around official changes.<', '>Les pages pays et calculateurs fiscaux sont maintenus autour des changements officiels.<'],
  ['>Everything in one place<', '>Tout au meme endroit<'],
  ['>Built for the full <em>African professional journey.</em><', '>Concu pour tout le <em>parcours professionnel africain.</em><'],
  ['>Not tools with African flags pasted on. Real data, real context, real currency &mdash; across every discipline.<', '>Pas des outils generiques avec un drapeau africain colle dessus. Des donnees, du contexte et des devises reels pour chaque discipline.<'],
  ['>See All', '>Tout voir'],
  ['>Ouvrir Workspace', '>Ouvrir l\'espace PDF'],
  ['>Ouvrir Tool', '>Ouvrir l\'outil'],
  ['>Hub Education', '>Hub Education'],
  ['>All 32 Categories<', '>Les 32 categories<'],
  ['>Browse <span id="cats-browse-count">2 594+</span> tools &rarr;<', '>Parcourir <span id="cats-browse-count">2 594+</span> outils &rarr;<'],
  ['>Market Data<', '>Donnees de marche<'],
  ['>Latest African Market Data<', '>Dernieres donnees de marche africaines<'],
  ['>Salary &amp; Tax<', '>Salaire et impots<'],
  ['>AI Advisor Included<', '>Conseiller IA inclus<'],
  ['>PAYE Tax Calculators<br>for Africa<', '>Calculateurs PAYE<br>pour l\'Afrique<'],
  ['>Trusted by professionals<', '>Adopte par les professionnels<'],
  ['>Used daily across <em>the continent.</em><', '>Utilise chaque jour sur <em>le continent.</em><'],
  ['>Uniquely African<', '>Typiquement africain<'],
  ['>Tools You Won\'t Find<br>Anywhere Else.<', '>Des outils introuvables<br>ailleurs.<'],
  ['>Checking latest available rates...<', '>Verification des derniers taux disponibles...<']
];
for (const [from, to] of currentHomepageReplacements) {
  html = html.split(from).join(to);
}

fs.writeFileSync(file, html, 'utf8');
console.log(`Done! Applied ${count} HTML replacements + JS dynamic text updates.`);
