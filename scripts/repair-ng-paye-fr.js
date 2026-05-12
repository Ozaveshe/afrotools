const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'fr', 'nigeria', 'ng-salary-tax.html');
let html = fs.readFileSync(target, 'utf8');

function replaceExact(from, to) {
  if (html.includes(from)) {
    html = html.replace(from, to);
    return true;
  }
  return false;
}

function replaceRegex(regex, to, label) {
  if (regex.test(html)) {
    html = html.replace(regex, to);
    return true;
  }
  return false;
}

function replaceAllExact(from, to) {
  if (html.includes(from)) {
    html = html.split(from).join(to);
    return true;
  }
  return false;
}

replaceExact(
  'browserRequirements":"Requires JavaScript"',
  'browserRequirements":"Necessite JavaScript"'
);

replaceRegex(
  /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage".*?<\/script>/,
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Quelles sont les tranches PAYE du Nigeria pour 2026 ?","acceptedAnswer":{"@type":"Answer","text":"Sous la NTA 2026 : 0 % sur les premiers N800,000 ; 15 % de N800,001 a N3,000,000 ; 18 % de N3,000,001 a N12,000,000 ; 21 % de N12,000,001 a N25,000,000 ; 23 % de N25,000,001 a N50,000,000 ; 25 % au-dela de N50,000,000."}},{"@type":"Question","name":"Que devient la CRA sous la NTA 2026 ?","acceptedAnswer":{"@type":"Answer","text":"La CRA est supprimee. Elle est remplacee par l allegement de loyer, egal au plus faible entre 20 % du loyer paye et N500,000 par an."}},{"@type":"Question","name":"Quand la Nigeria Tax Act entre-t-elle en vigueur ?","acceptedAnswer":{"@type":"Answer","text":"La loi a ete signee le 26 juin 2025 et prend effet le 1 janvier 2026. L annee fiscale 2025 utilise encore l ancien systeme PITA."}},{"@type":"Question","name":"Comment calculer le PAYE au Nigeria ?","acceptedAnswer":{"@type":"Answer","text":"Commencez par le salaire brut annuel, deduisez la pension (8 % de Basic+Housing+Transport), deduisez le NHF (2,5 % du salaire de base), appliquez la CRA sous PITA ou le seuil exonere sous NTA 2026, puis appliquez les tranches progressives."}},{"@type":"Question","name":"Quel est le taux PAYE au Nigeria ?","acceptedAnswer":{"@type":"Answer","text":"Les taux PAYE du Nigeria sont progressifs. Sous NTA 2026 : 0 %, puis 15 %, 18 %, 21 %, 23 % et 25 %. Sous PITA : 7 %, 11 %, 15 %, 19 %, 21 % et 24 %."}},{"@type":"Question","name":"Comment calculer un salaire net-vers-brut au Nigeria ?","acceptedAnswer":{"@type":"Answer","text":"Entrez votre salaire net souhaite et utilisez notre calcul inverse pour trouver le salaire brut necessaire. L outil tient compte de la pension, du NHF, du NHIS et du regime applicable."}},{"@type":"Question","name":"Quel est le cout employeur au Nigeria ?","acceptedAnswer":{"@type":"Answer","text":"L employeur paie 10 % de pension, plus le NHF (2,5 %) et le NHIS selon le cas. Utilisez la section cout employeur pour voir le cout total entreprise."}},{"@type":"Question","name":"Existe-t-il un calculateur fiscal gratuit pour le Nigeria ?","acceptedAnswer":{"@type":"Answer","text":"Oui. AfroTools propose un calculateur fiscal gratuit qui prend en charge PITA 2025 et NTA 2026. Aucune inscription requise."}}]}</script>',
  'faq schema'
);

replaceRegex(
  /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"HowTo".*?<\/script>/,
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"HowTo","name":"Comment calculer votre PAYE au Nigeria en 2026","description":"Guide etape par etape pour calculer l impot sur le revenu au Nigeria sous NTA 2026 et PITA 2025, y compris la pension, le NHF et le salaire net.","totalTime":"PT1M","tool":{"@type":"HowToTool","name":"Calculateur PAYE Nigeria AfroTools"},"step":[{"@type":"HowToStep","position":1,"name":"Entrez votre salaire brut","text":"Saisissez votre salaire brut mensuel ou annuel en naira nigerian (NGN) dans le champ de salaire."},{"@type":"HowToStep","position":2,"name":"Choisissez votre regime fiscal","text":"Selectionnez PITA 2025 ou NTA 2026 pour comparer votre salaire net selon chaque systeme."},{"@type":"HowToStep","position":3,"name":"Consultez le detail PAYE","text":"Le calculateur calcule automatiquement la pension (8 %), le NHF (2,5 %), l impot PAYE selon les tranches progressives FIRS et votre salaire net."},{"@type":"HowToStep","position":4,"name":"Obtenez un conseil fiscal IA","text":"Le conseiller fiscal IA analyse vos resultats et vous donne des suggestions legales d optimisation."},{"@type":"HowToStep","position":5,"name":"Telechargez votre PDF","text":"Cliquez sur Telecharger le PDF pour enregistrer un bulletin clair avec toutes les deductions et votre salaire net."}]}</script>',
  'howto schema'
);

replaceRegex(/How to Calculate PAYE in Nigeria\s*[→&rarr;]+/, 'Comment calculer le PAYE au Nigeria &rarr;', 'hero paye link');
replaceRegex(/Nigeria Import Duty Guide\s*[→&rarr;]+/, 'Guide des droits de douane au Nigeria &rarr;', 'hero import link');
replaceRegex(/Derni(?:è|e)re mise [àÃ ] jour : March 2026 [·Â].*?Voir les changements/, 'Derniere mise a jour : mars 2026 &middot; <a href="/fr/blog/tax-updates-2026/" style="color:var(--color-brand);">Voir les changements', 'last updated');
replaceRegex(
  /<strong>PITA \(old\):<\/strong>.*?<em>If you&rsquo;re unsure, calculate both and compare &mdash; the tabs below let you switch instantly\.<\/em>/,
  '<strong>PITA (ancien) :</strong> utilisez-le pour l annee fiscale 2025 ou si votre employeur n a pas encore bascule. La CRA (Consolidated Relief Allowance) reduit votre revenu imposable. <strong>NTA 2026 (nouveau) :</strong> la Nigeria Tax Act est entree en vigueur le 1 janvier 2026. La CRA est supprimee et remplacee par un seuil exonere de &#8358;800K et l allegement de loyer. <em>En cas de doute, calculez les deux et comparez : les onglets ci-dessous permettent de basculer instantanement.</em>',
  'regime helper paragraph'
);
replaceRegex(/After all .*?&amp; tax/, 'Apres deductions et impot', 'results subtitle');
replaceRegex(/Co(?:û|u?)t Employeur Breakdown/, 'Detail du cout employeur', 'employer card title');
replaceRegex(/Co(?:û|u?)t Employeur/, 'Cout employeur', 'tool feat employer');
replaceRegex(
  /This Nigeria tax calculator computes your PAYE \(Pay As You Earn\) income tax.*?when planning landed costs\./,
  'Ce calculateur fiscal Nigeria calcule votre impot PAYE (Pay As You Earn) selon l ancien systeme PITA (2025) et la nouvelle Nigeria Tax Act (NTA 2026). Entrez votre salaire pour voir votre net exact, votre taux effectif, votre taux marginal et un detail complet des deductions, y compris pension, NHF, NHIS et allegement de loyer. Il prend en charge le calcul brut-vers-net et le calcul inverse net-vers-brut. Les entreprises au Nigeria doivent aussi verifier leurs obligations de <a href="/fr/nigeria/ng-vat" style="color:var(--color-brand,#007AFF);">TVA a 7,5%</a> et utiliser notre <a href="/fr/tools/droits-douane/" style="color:var(--color-brand,#007AFF);">calculateur de droits de douane</a> pour estimer les couts d\'importation.',
  'seo intro'
);
replaceRegex(/What is the Allocation de .*? \(CRA\) under PITA\?/, "Qu'est-ce que la CRA sous le PITA ?", 'faq cra question');

const runtimeExactReplacements = [
  ['>Monthly<', '>Mensuel<'],
  ['>Annual<', '>Annuel<'],
  ['>Breakdown<', '>Repartition<'],
  ['>Waterfall<', '>Cascade<'],
  ['Desired Take-Home Pay (Annual)', 'Salaire net souhaite (annuel)'],
  ['Desired Annual Take-Home', 'Net annuel souhaite'],
  ['Annual Gross Salary', 'Salaire brut annuel'],
  ["We'll compute the gross salary needed to achieve this net pay.", 'Nous calculerons le salaire brut necessaire pour atteindre ce net.'],
  ['Gross Income', 'Revenu brut'],
  ['Gross Salary', 'Salaire brut'],
  ['Statutory Déductions', 'Deductions statutaires'],
  ['Statutory Deductions', 'Deductions statutaires'],
  ['Life Insurance', 'Assurance vie'],
  ['Home Loan Interest', 'Interets de pret immobilier'],
  ['Total Statutory', 'Total statutaire'],
  ['Tax Relief', 'Allegements fiscaux'],
  ['Consolidated Relief (CRA)', 'Allegement consolide (CRA)'],
  ['Consolidated Relief Allowance (CRA)', 'Allocation d allegement consolidee (CRA)'],
  ['Rent Relief (NTA 2026)', 'Allegement de loyer (NTA 2026)'],
  ['No Rent Relief applied', 'Aucun allegement de loyer applique'],
  ['Taxable Income', 'Revenu imposable'],
  ['Income Tax', "Impot sur le revenu"],
  ['Below tax-free threshold &mdash; no PAYE applies.', "En dessous du seuil exonere &mdash; aucun PAYE ne s'applique."],
  ['Min tax applied (1% gross)', 'Impot minimum applique (1% du brut)'],
  ['Total Déductions', 'Total des deductions'],
  ['Total Deductions', 'Total des deductions'],
  ['Take-Home Pay', 'Salaire net'],
  ['<th>Band</th><th>Rate</th><th>Income</th><th>Tax</th><th class="cum">Cumulative</th>', '<th>Tranche</th><th>Taux</th><th>Revenu</th><th>Impot</th><th class="cum">Cumul</th>'],
  ['Employee Gross Salary', 'Salaire brut salarie'],
  ['Employer Pension (10%)', 'Pension employeur (10%)'],
  ['Employer NHIS', 'NHIS employeur'],
  ['Employer NHF (2.5%)', 'NHF employeur (2,5%)'],
  ['Total Cost to Company', 'Cout total entreprise'],
  ['Enter a valid salary', 'Entrez un salaire valide'],
  ['Required Gross', 'Brut requis'],
  ['Monthly Take-Home', 'Salaire net mensuel'],
  ['Gross annual:', 'Brut annuel :'],
  ['Net monthly:', 'Net mensuel :'],
  ['Gross monthly:', 'Brut mensuel :'],
  ['Get AI Tax Analysis →', 'Obtenir l analyse fiscale IA →'],
  ['Get AI Tax Analysis ->', 'Obtenir l analyse fiscale IA →'],
  ['Gross: ', 'Brut : '],
  ['Take-home: ', 'Net : '],
  ['Rate: ', 'Taux : '],
  ["You save ", "Vous gagnez "],
  ["/year</strong> under the current regime vs ", "/an</strong> avec le regime actuel par rapport a "],
  ["You'd save ", 'Vous gagneriez '],
  ['/year</strong> under ', '/an</strong> avec '],
  ['NTA 2026 saves you ', 'La NTA 2026 vous fait gagner '],
  ['/year</strong> (', '/an</strong> ('],
  ['/month) compared to PITA 2025. The new ₦800k tax-free threshold and lower starting rate of 15% work in your favour.', '/mois) par rapport au PITA 2025. Le nouveau seuil exonere de ₦800k et le taux initial de 15% vous avantagent.'],
  ['PITA 2025 is better by ', 'Le PITA 2025 est plus favorable de '],
  ['/month). At your income level, the CRA deduction under PITA provides more relief than the NTA threshold.', '/mois). A ce niveau de revenu, la deduction CRA du PITA apporte plus d allegement que le seuil NTA.'],
  [" / ${PERIOD === 'monthly' ? 'month' : 'year'}", " / ${PERIOD === 'monthly' ? 'mois' : 'an'}"],
  [" / ${isMonthly ? 'month' : 'year'}", " / ${isMonthly ? 'mois' : 'an'}"],
  ["const periodLabel = isMonthly ? 'Monthly' : 'Annual';", "const periodLabel = isMonthly ? 'Mensuel' : 'Annuel';"],
  ['First ₦300,000', 'Premiers ₦300,000'],
  ['Next ₦300,000', '₦300,000 suivants'],
  ['Next ₦500,000', '₦500,000 suivants'],
  ['Next ₦1,600,000', '₦1,600,000 suivants'],
  ['Above ₦3,200,000', 'Au-dela de ₦3,200,000'],
  ['0% exempt', '0% exonere'],
  ['Above ₦50,000,000', 'Au-dela de ₦50,000,000'],
  ['CRA = higher of ₦200k or 1% gross, plus 20% gross. Min tax: 1% gross. Source: PITA as amended.', 'CRA = le plus eleve entre ₦200k et 1% du brut, plus 20% du brut. Impot minimum : 1% du brut. Source : PITA modifie.'],
  ['CRA abolished. Rent Relief = lower of 20% rent or ₦500k. Pension on Basic+Housing+Transport only. Effective Jan 1 2026.', 'CRA supprimee. Allegement de loyer = plus faible entre 20% du loyer et ₦500k. Pension sur Basic+Housing+Transport uniquement. En vigueur le 1 janv. 2026.'],
  ["document.getElementById('bandsTitle').textContent = REGIME === 'nta' ? 'NTA 2026 Tax Bands' : 'PITA 2025 Tax Bands';", "document.getElementById('bandsTitle').textContent = REGIME === 'nta' ? 'Tranches fiscales NTA 2026' : 'Tranches fiscales PITA 2025';"],
  ["labels: ['Take-Home', 'PAYE Tax', 'Pension', 'NHF', 'NHIS', 'Other Déductions']", "labels: ['Salaire net', 'Impot PAYE', 'Pension', 'NHF', 'NHIS', 'Autres deductions']"],
  ["labels: ['Take-Home', 'PAYE Tax', 'Pension', 'NHF', 'NHIS', 'Other Deductions']", "labels: ['Salaire net', 'Impot PAYE', 'Pension', 'NHF', 'NHIS', 'Autres deductions']"],
  ["datasets: [{ label: 'Tax (₦)'", "datasets: [{ label: 'Impot (₦)'"],
  ["labels: ['Take-Home', 'Income Tax', 'Statutory']", "labels: ['Salaire net', 'Impot sur le revenu', 'Statutaire']"],
  ["labels: ['Income Distribution']", "labels: ['Repartition du revenu']"],
  ["label: pct(b.rate) + ' band'", "label: pct(b.rate) + ' tranche'"],
  ['Income & Déductions', 'Revenus et deductions'],
  ['Income & Deductions', 'Revenus et deductions'],
  ['Gross Annual Salary', 'Salaire brut annuel'],
  ['Total Statutory Déductions', 'Total des deductions statutaires'],
  ['Total Statutory Deductions', 'Total des deductions statutaires'],
  ['Tax Relief & Taxable Income', 'Allegements fiscaux et revenu imposable'],
  ['Tax Computation', "Calcul de l'impot"],
  ['Total PAYE Tax', 'Impot PAYE total'],
  ['Net Pay Summary', 'Resume du salaire net'],
  ['Total Déductions (Statutory + Tax)', 'Total des deductions (statutaires + impot)'],
  ['Total Deductions (Statutory + Tax)', 'Total des deductions (statutaires + impot)'],
  ['Annual Take-Home Pay', 'Salaire net annuel'],
  ['Monthly Take-Home Pay', 'Salaire net mensuel'],
  ['Effective Tax Rate', 'Taux effectif'],
  ['Regime Comparison', 'Comparaison des regimes'],
  ['PITA 2025 Take-Home', 'Salaire net PITA 2025'],
  ['NTA 2026 Take-Home', 'Salaire net NTA 2026'],
  ['Difference', 'Ecart'],
  [' (NTA better)', ' (NTA plus favorable)'],
  [' (PITA better)', ' (PITA plus favorable)'],
  ['Nigeria PAYE Tax Report', 'Rapport PAYE Nigeria'],
  ['NTA 2026 Calculation', 'Calcul NTA 2026'],
  ['PITA 2025 Calculation', 'Calcul PITA 2025'],
  ['Gross Annual', 'Brut annuel'],
  ['Annual Tax', 'Impot annuel'],
  ['Personal Income Tax Act (PITA), Cap P8 LFN 2004 as amended. CRA per Finance Acts 2019-2023. PAYE bands: 7%-24%. FIRS authority.', 'Personal Income Tax Act (PITA), Cap P8 LFN 2004 modifie. CRA selon les Finance Acts 2019-2023. Tranches PAYE : 7%-24%. Source FIRS.'],
  ['Nigeria Tax Act 2025, signed 26 June 2025, effective 1 January 2026. NTA bands: 0%-25%. Rent Relief replaces CRA. FIRS authority.', 'Nigeria Tax Act 2025, signee le 26 juin 2025 et en vigueur le 1 janvier 2026. Tranches NTA : 0%-25%. L allegement de loyer remplace la CRA. Source FIRS.'],
  ['My Nigeria tax breakdown: Gross ', 'Mon detail fiscal Nigeria : Brut '],
  ['/yr → Take-home ', '/an → Net '],
  [' effective rate)', ' de taux effectif)'],
  ['My Nigeria Tax Breakdown', 'Mon detail fiscal Nigeria'],
  ['My Take-Home Pay', 'Mon salaire net'],
  ["mainValue: fmt(RESULT.netMonthly) + '/mo'", "mainValue: fmt(RESULT.netMonthly) + '/mois'"],
  ["{ label: 'Gross', value: fmt(RESULT.gross) + '/yr' }", "{ label: 'Brut', value: fmt(RESULT.gross) + '/an' }"],
  ["{ label: 'Tax', value: fmt(RESULT.tax) + '/yr' }", "{ label: 'Impot', value: fmt(RESULT.tax) + '/an' }"],
  ["{ label: 'Effective Rate', value: pct(RESULT.effectiveRate) }", "{ label: 'Taux effectif', value: pct(RESULT.effectiveRate) }"],
  ['Analysing...', 'Analyse en cours...'],
  ['Nigerian tax analysis:', 'Analyse fiscale nigeria :'],
  ['- Regime: ', '- Regime : '],
  ['/year', '/an'],
  ['- Gross: ', '- Brut : '],
  ['- Pension: ', '- Pension : '],
  ['Rent Relief: ', 'Allegement de loyer : '],
  ['- Taxable: ', '- Revenu imposable : '],
  [' | Tax: ', ' | Impot : '],
  [' | Take-home: ', ' | Net : '],
  ['- Effective: ', '- Taux effectif : '],
  [' | Marginal: ', ' | Taux marginal : '],
  ['- Under ${otherName}: take-home ${fmt(other.netAnnual)}/yr (${diff > 0 ? \'current better by \' + fmt(diff) : otherName + \' better by \' + fmt(Math.abs(diff))})', '- Sous ${otherName} : net ${fmt(other.netAnnual)}/an (${diff > 0 ? \'regime actuel meilleur de \' + fmt(diff) : otherName + \' meilleur de \' + fmt(Math.abs(diff))})'],
  ['- Below threshold: no PAYE', '- En dessous du seuil : aucun PAYE'],
  ['- Min tax rule applied', '- Regle d impot minimum appliquee'],
  ['Give: 1) Plain-English summary 2) Two specific legal ways to reduce tax 3) Which regime is better and why 4) One risk to watch. Under 200 words. No markdown, no bullet symbols.', 'Donne : 1) un resume simple 2) deux moyens legaux precis de reduire l impot 3) le regime le plus avantageux et pourquoi 4) un risque a surveiller. Moins de 200 mots. Pas de markdown, pas de puces.'],
  ['You are AfroTools AI Tax Advisor for Nigerian personal income tax (PITA 2025 and NTA 2026). Be concise, specific, practical. No markdown, no asterisks.', 'Vous etes le conseiller fiscal IA AfroTools pour l impot sur le revenu des particuliers au Nigeria (PITA 2025 et NTA 2026). Soyez concis, precis et pratique. Pas de markdown, pas d asterisques.'],
  ['Rate limited. Try again in a moment.', 'Limite atteinte. Reessayez dans un instant.'],
  ['Unable to generate analysis.', "Impossible de generer l'analyse."],
  ['Ask a follow-up below', 'Posez une question de suivi ci-dessous'],
  ['AI analysis temporarily unavailable. Your calculation results above are accurate.', "Analyse IA temporairement indisponible. Les resultats ci-dessus restent exacts."],
  ['Try Again', 'Reessayer'],
  ['AfroTools AI Tax Advisor, Nigeria. User: Gross ${fmt(RESULT.gross)}/yr, take-home ${fmt(RESULT.netMonthly)}/mo, rate ${pct(RESULT.effectiveRate)}, regime: ${REGIME}. Concise. No markdown.', 'Conseiller fiscal IA AfroTools, Nigeria. Utilisateur : brut ${fmt(RESULT.gross)}/an, net ${fmt(RESULT.netMonthly)}/mois, taux ${pct(RESULT.effectiveRate)}, regime : ${REGIME}. Soyez concis. Pas de markdown.'],
  ['Unable to respond.', 'Impossible de repondre.'],
  ['Network error. Please try again.', 'Erreur reseau. Reessayez.'],
];

for (const [from, to] of runtimeExactReplacements) {
  replaceAllExact(from, to);
}

const exactReplacements = [
  ['https://afrotools.com/og-image?title=Nigeria%20PAYE%20Calculator&country=NG&sub=Calculate%20your%20take-home%20pay%20in%2030%20seconds', 'https://afrotools.com/og-image?title=Calculateur%20PAYE%20Nigeria&country=NG&sub=Calculez%20votre%20salaire%20net%20en%2030%20secondes'],
  ['Which tax system applies to me?', 'Quel regime fiscal me concerne ?'],
  ['aria-label="Tax regime selection"', 'aria-label="Selection du regime fiscal"'],
  ['Old System &mdash; PITA', 'Ancien systeme &mdash; PITA'],
  ['2025 tax year &middot; CRA applies', 'Annee fiscale 2025 &middot; CRA applicable'],
  ['New System &mdash; NTA 2026', 'Nouveau systeme &mdash; NTA 2026'],
  ['Effective Jan 1 2026 &middot; Rent Relief', 'En vigueur depuis le 1 janv. 2026 &middot; Allegement de loyer'],
  ['<strong>NTA 2026 selected:</strong> CRA abolished. &#8358;800,000 tax-free threshold. Rent Relief replaces CRA. Pension on Basic+Housing+Transport only.', '<strong>NTA 2026 selectionnee :</strong> CRA supprimee. Seuil exonere de &#8358;800,000. L allegement de loyer remplace la CRA. Pension calculee uniquement sur Basic+Housing+Transport.'],
  ['Gross &rarr; Net', 'Brut &rarr; Net'],
  ['Net &rarr; Gross', 'Net &rarr; Brut'],
  ['Entry Period', 'Periode de saisie'],
  ['>Annual<', '>Annuel<'],
  ['>Monthly<', '>Mensuel<'],
  ['Select all that apply', "Selectionnez tout ce qui s'applique"],
  ['8% employee', '8% salarie'],
  ['2.5% of basic', '2.5% du salaire de base'],
  ['Effective Rate', 'Taux effectif'],
  ['Tax / Gross', 'Impot / Brut'],
  ['Marginal Rate', 'Taux marginal'],
  ['Rate on next &#8358;1', 'Taux sur le prochain &#8358;1'],
  ['Breakdown', 'Repartition'],
  ['Waterfall', 'Cascade'],
  ['aria-label="Tax breakdown chart"', 'aria-label="Graphique du detail fiscal"'],
  ['Download PDF', 'Telecharger le PDF'],
  ['Copy Link', 'Copier le lien'],
  ['Total cost to company', "Cout total pour l'entreprise"],
  ["Calculez d'abord votre salaire &mdash; then I'll analyse your position, show legal ways to reduce your tax, and tell you which regime wins for you.", "Calculez d'abord votre salaire &mdash; ensuite j analyserai votre situation, je proposerai des moyens legaux de reduire l impot et j indiquerai le regime le plus avantageux."],
  ['How can I pay less tax?', "Comment payer moins d'impot ?"],
  ['Which regime is better for me?', 'Quel regime est meilleur pour moi ?'],
  ['Should I increase my pension?', 'Dois-je augmenter ma pension ?'],
  ['placeholder="Ask a follow-up..."', 'placeholder="Posez une question de suivi..."'],
  ['aria-label="Ask AI a question"', 'aria-label="Poser une question a l\'IA"'],
  ['aria-label="Send message"', 'aria-label="Envoyer le message"'],
  ['FYI: Development Levy', 'A noter : Development Levy'],
  ['Under NTA 2026, companies pay a <strong>4% Development Levy</strong> on assessable profit. This is an employer/company-level charge, not deducted from employee salary. Shown here for HR professionals calculating total employment cost.', "Sous la NTA 2026, les entreprises paient une <strong>Development Levy de 4%</strong> sur le profit imposable. Il s'agit d'une charge employeur/entreprise, pas d'une retenue sur le salaire du collaborateur. Elle est affichee ici pour les equipes RH qui calculent le cout total d'emploi."],
  ['<strong>Disclaimer:</strong> For informational purposes only. NTA 2026 figures based on the signed Act. Confirm with a qualified Nigerian tax professional. Tax laws may be updated by supplementary instruments.', '<strong>Avertissement :</strong> A titre informatif uniquement. Les chiffres NTA 2026 sont bases sur la loi signee. Confirmez avec un fiscaliste qualifie au Nigeria. Des textes complementaires peuvent modifier les regles fiscales.'],
  ['Tax &amp; Finance', 'Impots &amp; finance'],
  ['Calculations', 'Calculs'],
  ['Rating', 'Note'],
  ['>Free<', '>Gratuit<'],
  ['>Forever<', '>Toujours<'],
  ['Net-to-Gross', 'Net-vers-brut'],
  ['PDF Export', 'Export PDF'],
  ['Updated: Mar 2026', 'Mis a jour : mars 2026'],
  ['>Share<', '>Partager<'],
  ['Nigeria Calculateur Fiscal &mdash; How PAYE Works', 'Calculateur fiscal Nigeria &mdash; comment fonctionne le PAYE'],
  ['Whether you need a salary calculator for Nigeria, want to compare PITA vs NTA, calculate employer cost to company, or find your net-to-gross salary, enter your amount above and get instant, FIRS-accurate results. Also known as: Nigeria salary calculator, Nigeria income tax calculator, FIRS PAYE calculator, net pay calculator Nigeria, take-home pay calculator Nigeria.', 'Que vous cherchiez un calculateur de salaire au Nigeria, un comparatif PITA vs NTA, un calcul de cout employeur ou un estimateur net-vers-brut, saisissez votre montant ci-dessus pour obtenir des resultats immediats et alignes sur les regles FIRS. Egalement connu sous les termes : calculateur salaire Nigeria, calculateur impot Nigeria, calculateur PAYE FIRS, calculateur salaire net Nigeria.'],
  ['Nigeria Tax FAQ', 'FAQ fiscale Nigeria'],
  ['Common PAYE Questions', 'Questions frequentes sur le PAYE'],
  ['What are the new Nigeria PAYE tax bands for 2026?', 'Quelles sont les nouvelles tranches PAYE du Nigeria pour 2026 ?'],
  ['Under NTA 2026: 0% on first &#8358;800,000; 15% on &#8358;800,001&ndash;&#8358;3M; 18% on &#8358;3M&ndash;&#8358;12M; 21% on &#8358;12M&ndash;&#8358;25M; 23% on &#8358;25M&ndash;&#8358;50M; 25% above &#8358;50M.', 'Sous la NTA 2026 : 0% sur les premiers &#8358;800,000 ; 15% de &#8358;800,001 a &#8358;3M ; 18% de &#8358;3M a &#8358;12M ; 21% de &#8358;12M a &#8358;25M ; 23% de &#8358;25M a &#8358;50M ; 25% au-dela de &#8358;50M.'],
  ['What happened to CRA under the new tax law?', 'Que devient la CRA avec la nouvelle loi fiscale ?'],
  ['CRA is abolished under NTA 2026. Replaced by Rent Relief &mdash; the lower of 20% of annual rent paid or &#8358;500,000. If you own your home, you cannot claim Rent Relief.', 'La CRA est supprimee sous la NTA 2026. Elle est remplacee par l allegement de loyer, egal au plus faible entre 20% du loyer annuel paye et &#8358;500,000. Si vous etes proprietaire occupant, vous ne pouvez pas le demander.'],
  ['When does the Nigeria Tax Act take effect?', 'Quand la Nigeria Tax Act entre-t-elle en vigueur ?'],
  ['Signed June 26 2025. Takes effect January 1 2026. Your 2025 payslip still uses PITA with CRA. Select &ldquo;Old System &mdash; PITA&rdquo; above for 2025 calculations.', 'Signee le 26 juin 2025, elle prend effet le 1 janvier 2026. Votre bulletin 2025 utilise encore le PITA avec CRA. Selectionnez &ldquo;Ancien systeme &mdash; PITA&rdquo; ci-dessus pour les calculs 2025.'],
  ['How is pension calculated under NTA 2026?', 'Comment la pension est-elle calculee sous la NTA 2026 ?'],
  ['Under NTA 2026, employee pension (8%) applies only to Basic Salary + Housing + Transport &mdash; not total gross. Enter your pensionable emoluments separately.', 'Sous la NTA 2026, la pension salariee (8%) s applique uniquement a Basic Salary + Housing + Transport, et non au brut total. Saisissez vos elements pensionnables separement.'],
  ['Can I do a net-to-gross calculation?', 'Puis-je faire un calcul net-vers-brut ?'],
  ['Yes. Switch to &ldquo;Net &rarr; Gross&rdquo; mode at the top of the input card. Enter your desired take-home pay and we\'ll compute the gross salary needed under either PITA or NTA.', 'Oui. Basculez vers le mode &ldquo;Net &rarr; Brut&rdquo; en haut de la carte de saisie. Entrez votre salaire net souhaite et nous calculerons le salaire brut necessaire sous PITA ou NTA.'],
  ['What is the employer cost for hiring in Nigeria?', 'Quel est le cout employeur pour recruter au Nigeria ?'],
  ['Employers pay 10% pension contribution plus optional NHF (2.5%) and NHIS (varies). Our employer cost section below the results shows total cost to company including all employer obligations.', 'Les employeurs paient 10% de pension, plus le NHF (2,5%) et le NHIS selon le cas. Notre section cout employeur sous les resultats affiche le cout total entreprise, obligations comprises.'],
  ['What is the effective vs marginal tax rate?', 'Quelle difference entre taux effectif et taux marginal ?'],
  ['Effective rate = total tax paid / gross income. Marginal rate = the tax rate on your next naira earned. A higher earner has a higher marginal rate but may have a moderate effective rate due to progressive bands.', 'Le taux effectif = impot total paye / revenu brut. Le taux marginal = taux applique sur le prochain naira gagne. Un revenu eleve peut avoir un taux marginal important mais un taux effectif modere grace aux tranches progressives.'],
  ['Is there a minimum tax in Nigeria?', 'Existe-t-il un impot minimum au Nigeria ?'],
  ['Under PITA, minimum tax is 1% of gross income when calculated PAYE is less. Under NTA 2026, the &#8358;800,000 tax-free threshold replaces the minimum tax concept for individuals.', 'Sous le PITA, l impot minimum est de 1% du revenu brut lorsque le PAYE calcule est inferieur. Sous la NTA 2026, le seuil exonere de &#8358;800,000 remplace cette logique pour les particuliers.'],
  ['Under the old PITA system (2025 and earlier), CRA equals 20% of gross income plus the higher of &#8358;200,000 or 1% of gross income. This is deducted from gross income before applying the six graduated tax bands (7%&ndash;24%). CRA was the primary tax reduction mechanism under PITA and is abolished under NTA 2026.', "Sous l ancien systeme PITA (2025 et avant), la CRA est egale a 20% du revenu brut plus le plus eleve entre &#8358;200,000 et 1% du revenu brut. Elle est deduite du revenu brut avant l application des six tranches progressives (7%&ndash;24%). La CRA etait le principal mecanisme d allegement fiscal sous PITA et elle est supprimee sous la NTA 2026."],
  ['What is the NHF contribution and is it mandatory?', "Qu'est-ce que la cotisation NHF et est-elle obligatoire ?"],
  ['The Fonds National du Logement (NHF) requires employees earning &#8358;3,000 or more per year to contribute 2.5% of their basic salary. Contributions are tax-deductible and entitle you to access the NHF mortgage scheme. Enforcement varies by employer, but it is technically mandatory for all salaried workers under the NHF Act.', "Le National Housing Fund (NHF) exige des salaries gagnant &#8358;3,000 ou plus par an une cotisation de 2,5% de leur salaire de base. Les cotisations sont deductibles fiscalement et ouvrent l acces au dispositif hypothecaire NHF. L application varie selon l employeur, mais elle reste techniquement obligatoire pour les salaries couverts par la loi NHF."],
  ['Nigeria PAYE Tax Under NTA 2026', 'PAYE du Nigeria sous la NTA 2026'],
  ['Nigeria PAYE Tranches d\'Imposition &mdash; NTA 2026 vs PITA 2025', "Tranches PAYE du Nigeria &mdash; NTA 2026 vs PITA 2025"],
  ['NTA 2026 Band (Annual &#8358;)', 'Tranche NTA 2026 (annuel &#8358;)'],
  ['NTA Rate', 'Taux NTA'],
  ['PITA 2025 Band (Annual &#8358;)', 'Tranche PITA 2025 (annuel &#8358;)'],
  ['PITA Rate', 'Taux PITA'],
  ['First 300,000', 'Premiers 300,000'],
  ['Next 300,000', '300,000 suivants'],
  ['Next 500,000', '500,000 suivants'],
  ['Next 1,600,000', '1,600,000 suivants'],
  ['Over 50,000,000', 'Au-dela de 50,000,000'],
  ['Above 3,200,000', 'Au-dela de 3,200,000'],
  ['More African Tax Tools', "Plus d'outils fiscaux africains"],
  ['Pan-African Calculateur TVA', 'Calculateur TVA panafricain'],
  ['African Currency Converter', 'Convertisseur de devises africaines'],
  ['Related African Tax Tools', 'Outils fiscaux africains lies'],
  ['All Calculateur PAYEs', 'Tous les calculateurs PAYE'],
  ['Calculate 7.5% VAT on goods and services in Nigeria. Inclusive and exclusive modes.', 'Calculez la TVA de 7,5% sur les biens et services au Nigeria, en mode TTC ou hors taxe.'],
  ['Import Duty Calculator', 'Calculateur de droits de douane'],
  ['Estimate customs duties and total landed cost for goods imported into Nigeria.', "Estimez les droits de douane et le cout de revient total des marchandises importees au Nigeria."],
  ["Calculate Ghana net salary with GRA's 7-band tax, SSNIT Tier I/II/III, and reliefs.", 'Calculez le salaire net au Ghana avec les 7 tranches GRA, le SSNIT Tier I/II/III et les allegements.'],
  ['Japa Cost Calculator', 'Calculateur de cout Japa'],
  ['Estimate the total financial cost of relocating from Nigeria to the UK, Canada, or USA.', "Estimez le cout financier total d'un depart du Nigeria vers le Royaume-Uni, le Canada ou les Etats-Unis."],
];

for (const [from, to] of exactReplacements) {
  replaceExact(from, to);
}

replaceRegex(
  /Nigeria&rsquo;s Pay As You Earn \(PAYE\) system underwent a major overhaul.*?their respective states\./,
  "Le systeme nigarian de Pay As You Earn (PAYE) a connu une refonte majeure avec la Nigeria Tax Act (NTA), signee le 26 juin 2025 et entree en vigueur le 1 janvier 2026. La NTA remplace le Personal Income Tax Act (PITA), qui encadrait l'imposition individuelle depuis des decennies. Le Federal Inland Revenue Service (FIRS) administre l'impot pour les residents du FCT, tandis que les State Internal Revenue Services gerent le PAYE pour les salaries de leurs Etats respectifs.",
  'seo para 1'
);

replaceRegex(
  /Under the old PITA system, the key relief was the .*?below &#8358;800,000 per year pays zero income tax\./,
  "Sous l'ancien systeme PITA, l allegement principal etait la CRA (Consolidated Relief Allowance), calculee comme 20% du revenu brut plus le plus eleve entre &#8358;200,000 et 1% du revenu brut. Apres deduction de la CRA, de la pension, du NHF et des autres elements admissibles, le revenu imposable restant etait taxe selon six taux progressifs de 7% a 24%. La NTA supprime completement la CRA et introduit un seuil annuel exonere de &#8358;800,000, ce qui signifie qu'un revenu inferieur a &#8358;800,000 par an ne paie aucun impot sur le revenu.",
  'seo para 2'
);

replaceRegex(
  /The NTA tax bands are:.*?middle-income earners substantially\./,
  "Les tranches NTA sont les suivantes : 0% sur les premiers &#8358;800,000 ; 15% de &#8358;800,001 a &#8358;3,000,000 ; 18% de &#8358;3,000,001 a &#8358;12,000,000 ; 21% de &#8358;12,000,001 a &#8358;25,000,000 ; 23% de &#8358;25,000,001 a &#8358;50,000,000 ; 25% au-dela de &#8358;50,000,000. Cette architecture offre un meilleur allegement aux revenus faibles et moyens grace au seuil exonere et a des tranches plus etendues.",
  'seo para 3'
);

replaceRegex(
  /Mandatory pension contributions remain.*?plan relocation finances\./,
  'Les cotisations de pension obligatoires restent de 8% des elements pensionnables (Basic + Housing + Transport) pour les salaries, avec une part employeur de 10%. Le National Housing Fund (<a href="/fr/tools/ng-nhf/" style="color:var(--color-brand,#007AFF);">calculateur de cotisation NHF</a>) represente 2,5% du salaire de base et reste deductible fiscalement. Sous la NTA, l allegement de loyer remplace la CRA comme principal mecanisme hors pension ; il correspond au plus faible entre 20% du loyer reellement paye et &#8358;500,000 par an. Les proprietaires occupants ne peuvent pas en beneficier. Les professionnels nigerians qui envisagent une expatriation peuvent utiliser notre <a href="/fr/tools/calculateur-japa/" style="color:var(--color-brand,#007AFF);">calculateur de cout Japa</a> pour planifier leur budget.',
  'seo para 4'
);

fs.writeFileSync(target, html, 'utf8');
console.log('French Nigeria PAYE static layer repaired.');
