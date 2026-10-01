// Readable owner; scripts/minify.js generates ../source-confidence.js.
!function(e, n) {
    "object" == typeof module && module.exports ? module.exports = n(e) : e.AfroToolsSourceConfidence = n(e);
}("undefined" != typeof globalThis ? globalThis : this, function(e) {
    "use strict";
    // Exact English-copy matches keep translations from masking later source changes.
    var SOURCE_COPY = [
        [
            "Fuel prices may vary by city, station, supplier, and timing. Verify locally before buying fuel or quoting transport.",
            "Les prix du carburant peuvent varier selon la ville, la station, le fournisseur et la date. Vérifiez localement avant d’acheter du carburant ou de chiffrer un transport.",
            "Bei za mafuta zinaweza kutofautiana kwa mji, kituo, msambazaji na wakati. Thibitisha mahali ulipo kabla ya kununua mafuta au kutoa bei ya usafiri."
        ],
        [
            "Rates and inflation values are planning context, not investment advice. Check the relevant central bank before pricing loans or financial products.",
            "Les taux et l’inflation servent à la planification, pas au conseil en investissement. Consultez la banque centrale concernée avant de fixer le prix d’un prêt ou d’un produit financier.",
            "Viwango na takwimu za mfumuko wa bei ni muktadha wa kupanga, si ushauri wa uwekezaji. Hakiki na benki kuu husika kabla ya kuweka gharama za mikopo au bidhaa za kifedha."
        ],
        [
            "Internal operational status. Verify failing endpoints before changing public copy, rates, or source claims.",
            "État opérationnel interne. Vérifiez les points d’accès en échec avant de modifier le texte public, les taux ou les affirmations sur les sources.",
            "Hali ya ndani ya uendeshaji. Hakiki sehemu za API zinazoshindwa kabla ya kubadilisha maelezo ya umma, viwango au madai kuhusu vyanzo."
        ],
        [
            "Planning comparison only. Confirm load and surge sizing, usable battery capacity, component life, solar yield, current local prices, written quotes, installation and electrical safety before purchase.",
            "Comparaison de planification uniquement. Confirmez la puissance de charge et de démarrage, la capacité utilisable des batteries, la durée de vie des composants, la production solaire, les prix locaux actuels, les devis écrits, l’installation et la sécurité électrique avant l’achat.",
            "Ulinganisho wa kupanga tu. Thibitisha ukubwa wa mzigo na nguvu ya kuanzisha, uwezo unaotumika wa betri, maisha ya vipengele, uzalishaji wa jua, bei za sasa za eneo, nukuu zilizoandikwa, ufungaji na usalama wa umeme kabla ya kununua."
        ],
        [
            "User-entered fee comparison only. Confirm product-specific transaction bands, taxes, waivers, limits, exchange rates, third-party charges, eligibility and effective dates with each provider.",
            "Comparaison des frais saisis par l’utilisateur uniquement. Confirmez auprès de chaque fournisseur les tranches propres au produit, taxes, dispenses, limites, taux de change, frais de tiers, conditions d’éligibilité et dates d’application.",
            "Ulinganisho wa ada zilizoingizwa na mtumiaji tu. Thibitisha makundi ya miamala ya kila bidhaa, kodi, misamaha, mipaka, viwango vya ubadilishaji, ada za wengine, ustahiki na tarehe za kuanza na kila mtoa huduma."
        ],
        [
            "User-entered loan and operating-cost plan only. Confirm rate basis, APR, fees, tax, balloon, insurance and repayment schedule with the provider.",
            "Plan de prêt et de coûts d’utilisation saisi par l’utilisateur uniquement. Confirmez la base du taux, le taux annuel effectif, les frais, la fiscalité, le paiement final majoré, l’assurance et l’échéancier auprès du fournisseur.",
            "Mpango wa mkopo na gharama za matumizi ulioingizwa na mtumiaji tu. Thibitisha msingi wa kiwango, APR, ada, kodi, malipo makubwa ya mwisho, bima na ratiba ya marejesho na mtoa huduma."
        ],
        [
            "CBK figures are indicative market-opening averages, not executable quotes. Confirm the dated official row and obtain a bank, bureau, card, wallet or remittance quote before committing funds.",
            "Les chiffres de la CBK sont des moyennes indicatives à l’ouverture du marché, pas des cours exécutables. Confirmez la ligne officielle datée et obtenez un devis d’une banque, d’un bureau de change, d’un service de carte, de portefeuille ou de transfert avant d’engager des fonds.",
            "Takwimu za CBK ni wastani elekezi wa ufunguzi wa soko, si bei za kutekeleza muamala. Thibitisha rekodi rasmi yenye tarehe na upate nukuu ya benki, bureau ya kubadilisha fedha, kadi, pochi au huduma ya kutuma fedha kabla ya kutumia fedha."
        ],
        [
            "Confirm the assigned risk rate, current floor and ceilings, worker status, declaration schedule and remittance with CNPS before payroll or submission.",
            "Confirmez auprès de la CNPS le taux de risque attribué, le plancher et les plafonds actuels, le statut du travailleur, le calendrier de déclaration et le reversement avant la paie ou le dépôt.",
            "Thibitisha kiwango cha hatari kilichopangiwa, kiwango cha chini na mipaka ya juu ya sasa, hali ya mfanyakazi, ratiba ya kutangaza na kuwasilisha malipo na CNPS kabla ya mishahara au uwasilishaji."
        ],
        [
            "Cost-planning estimate only. Worker status depends on the real relationship and current local law, not the cheaper path. Confirm classification, withholding, benefits and contract obligations with the relevant authority or a qualified professional.",
            "Estimation de coûts uniquement. Le statut du travailleur dépend de la relation réelle et du droit local actuel, pas de l’option la moins chère. Confirmez la classification, les retenues, les avantages et les obligations contractuelles auprès de l’autorité compétente ou d’un professionnel qualifié.",
            "Makadirio ya gharama ya kupanga tu. Hali ya mfanyakazi hutegemea uhusiano halisi na sheria za sasa za eneo, si njia ya bei ndogo. Thibitisha uainishaji, zuio, mafao na wajibu wa mkataba na mamlaka husika au mtaalamu mwenye sifa."
        ],
        [
            "Country statistics are for planning context. Check official statistical agencies or current authority publications for high-stakes decisions.",
            "Les statistiques nationales servent à la planification. Pour les décisions importantes, consultez les organismes statistiques officiels ou les publications actuelles des autorités.",
            "Takwimu za nchi ni muktadha wa kupanga. Hakiki mashirika rasmi ya takwimu au machapisho ya sasa ya mamlaka kwa maamuzi yenye athari kubwa."
        ],
        [
            "Crypto capital-gains planning estimate only. Confirm classification, residence, valuation, cost-basis evidence, filing and payment with the relevant tax authority or a qualified tax professional.",
            "Estimation de l’impôt sur les plus-values crypto uniquement. Confirmez la classification, la résidence, la valorisation, les preuves du coût d’acquisition, la déclaration et le paiement auprès de l’autorité fiscale compétente ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga kodi ya faida ya mali za kidijitali tu. Thibitisha uainishaji, makazi, thamani, ushahidi wa gharama ya ununuzi, kutangaza na kulipa na mamlaka ya kodi husika au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Historical CoinGecko daily reference points are not exchange execution quotes, forecasts, guarantees, or investment recommendations.",
            "Les points de référence quotidiens historiques de CoinGecko ne sont ni des cours d’exécution, ni des prévisions, garanties ou recommandations d’investissement.",
            "Rekodi za kihistoria za kila siku za CoinGecko si nukuu za kutekeleza miamala, utabiri, dhamana au mapendekezo ya uwekezaji."
        ],
        [
            "Planning estimate only. Confirm current wage floors, hours, overtime, leave, rest days, in-kind treatment, social contributions, records and contract requirements with the relevant authority or a qualified labour or payroll professional.",
            "Estimation de planification uniquement. Confirmez les minima salariaux actuels, les heures, heures supplémentaires, congés, jours de repos, avantages en nature, cotisations sociales, registres et exigences contractuelles auprès de l’autorité compétente ou d’un professionnel du travail ou de la paie qualifié.",
            "Makadirio ya kupanga tu. Thibitisha viwango vya chini vya sasa vya mishahara, saa, muda wa ziada, likizo, siku za kupumzika, mafao yasiyo fedha, michango ya kijamii, rekodi na masharti ya mkataba na mamlaka husika au mtaalamu mwenye sifa wa kazi au mishahara."
        ],
        [
            "Electricity tariffs vary by provider, band, taxes, subsidies, and billing period. Confirm your current utility tariff before budgeting.",
            "Les tarifs électriques varient selon le fournisseur, la tranche, les taxes, les subventions et la période de facturation. Confirmez le tarif actuel de votre fournisseur avant d’établir un budget.",
            "Bei za umeme hutofautiana kwa mtoa huduma, kundi, kodi, ruzuku na kipindi cha bili. Thibitisha bei ya sasa ya huduma yako kabla ya kupanga bajeti."
        ],
        [
            "Hiring-cost planning estimate only. Confirm current rates, ceilings, risk classes, contract terms and filing treatment with the responsible authority or a qualified payroll or legal professional.",
            "Estimation des coûts d’embauche uniquement. Confirmez les taux actuels, plafonds, classes de risque, conditions contractuelles et règles déclaratives auprès de l’autorité compétente ou d’un professionnel de la paie ou du droit qualifié.",
            "Makadirio ya kupanga gharama za kuajiri tu. Thibitisha viwango vya sasa, mipaka, makundi ya hatari, masharti ya mkataba na namna ya kutangaza na mamlaka husika au mtaalamu mwenye sifa wa mishahara au sheria."
        ],
        [
            "FX values can move quickly. Verify a current quote from your bank, broker, or payment provider before committing funds.",
            "Les taux de change peuvent évoluer rapidement. Vérifiez un cours actuel auprès de votre banque, courtier ou prestataire de paiement avant d’engager des fonds.",
            "Viwango vya kubadilisha fedha vinaweza kubadilika haraka. Thibitisha nukuu ya sasa kutoka benki, dalali au mtoa huduma ya malipo kabla ya kutumia fedha."
        ],
        [
            "Planning estimate only. Confirm eligibility, exit reason, service definition, pay basis, eligible days, divisor, caps, rounding, notice, leave, pension, tax, deductions and contract terms with the responsible authority or a qualified labour, legal or payroll professional.",
            "Estimation de planification uniquement. Confirmez l’éligibilité, le motif de départ, la définition de l’ancienneté, la base salariale, les jours admissibles, le diviseur, les plafonds, l’arrondi, le préavis, les congés, la pension, les impôts, les retenues et les conditions contractuelles auprès de l’autorité compétente ou d’un professionnel du travail, du droit ou de la paie qualifié.",
            "Makadirio ya kupanga tu. Thibitisha ustahiki, sababu ya kuondoka, maana ya muda wa huduma, msingi wa malipo, siku zinazostahiki, kigawanyo, mipaka, kuzungusha, notisi, likizo, pensheni, kodi, makato na masharti ya mkataba na mamlaka husika au mtaalamu mwenye sifa wa kazi, sheria au mishahara."
        ],
        [
            "Planning estimate only. Final customs assessment may differ. Confirm classification, customs value, rates, exemptions and declaration charges with the destination authority or a licensed customs professional.",
            "Estimation de planification uniquement. L’évaluation douanière finale peut différer. Confirmez la classification, la valeur en douane, les taux, les exemptions et les frais de déclaration auprès de l’autorité de destination ou d’un professionnel des douanes agréé.",
            "Makadirio ya kupanga tu. Tathmini ya mwisho ya forodha inaweza kutofautiana. Thibitisha uainishaji, thamani ya forodha, viwango, misamaha na ada za kutangaza na mamlaka ya nchi ya mwisho au mtaalamu wa forodha mwenye leseni."
        ],
        [
            "Amounts entered by the user are not independently verified by AfroTools.",
            "Les montants saisis par l’utilisateur ne sont pas vérifiés indépendamment par AfroTools.",
            "Kiasi kinachoingizwa na mtumiaji hakijahakikiwa kwa kujitegemea na AfroTools."
        ],
        [
            "User-entered constant-rate scenario only. Confirm geography, period, measure, source and publication date. Headline CPI may not match a personal basket.",
            "Scénario à taux constant saisi par l’utilisateur uniquement. Confirmez le territoire, la période, la mesure, la source et la date de publication. L’IPC général peut ne pas correspondre à votre panier personnel.",
            "Hali ya kiwango kisichobadilika iliyoingizwa na mtumiaji tu. Thibitisha eneo, kipindi, kipimo, chanzo na tarehe ya kuchapishwa. CPI ya jumla huenda isilingane na kikapu binafsi cha matumizi."
        ],
        [
            "Planning estimate only. Entered return and inflation rates are assumptions, not forecasts. Confirm fees, taxes, liquidity, risk and provider terms independently before acting.",
            "Estimation de planification uniquement. Les taux de rendement et d’inflation saisis sont des hypothèses, pas des prévisions. Confirmez indépendamment les frais, impôts, liquidité, risques et conditions du fournisseur avant d’agir.",
            "Makadirio ya kupanga tu. Viwango vya faida na mfumuko wa bei vilivyoingizwa ni dhana, si utabiri. Thibitisha ada, kodi, ukwasi, hatari na masharti ya mtoa huduma kwa kujitegemea kabla ya kuchukua hatua."
        ],
        [
            "Kenya capital-gains-tax planning estimate only. Confirm valuation, adjusted-cost evidence, exemptions, filing and payment with KRA or a qualified tax professional.",
            "Estimation de l’impôt sur les plus-values au Kenya uniquement. Confirmez la valorisation, les preuves du coût ajusté, les exemptions, la déclaration et le paiement auprès de la KRA ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga kodi ya faida ya mali Kenya tu. Thibitisha thamani, ushahidi wa gharama iliyorekebishwa, misamaha, kutangaza na kulipa na KRA au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Kenya withholding-tax planning estimate only. Confirm payment classification, residence, thresholds, special-treatment evidence, source conflicts, filing and remittance with KRA before acting.",
            "Estimation des retenues à la source au Kenya uniquement. Confirmez la classification du paiement, la résidence, les seuils, les preuves des régimes particuliers, les divergences entre sources, la déclaration et le reversement auprès de la KRA avant d’agir.",
            "Makadirio ya kupanga kodi ya zuio Kenya tu. Thibitisha uainishaji wa malipo, makazi, vizingiti, ushahidi wa utaratibu maalum, tofauti kati ya vyanzo, kutangaza na kuwasilisha malipo na KRA kabla ya kuchukua hatua."
        ],
        [
            "Confirm current eTIMS scope, solution eligibility, invoice treatment and expense requirements with KRA or a qualified Kenyan tax professional.",
            "Confirmez le périmètre actuel d’eTIMS, l’éligibilité de la solution, le traitement des factures et les exigences de dépenses auprès de la KRA ou d’un fiscaliste kenyan qualifié.",
            "Thibitisha wigo wa sasa wa eTIMS, ustahiki wa suluhisho, namna ya kushughulikia ankara na masharti ya matumizi na KRA au mtaalamu wa kodi Kenya mwenye sifa."
        ],
        [
            "Confirm the registered obligation, filing period and required records in the official KRA portal or with KRA support before submitting a return.",
            "Confirmez l’obligation enregistrée, la période déclarative et les pièces nécessaires dans le portail officiel de la KRA ou auprès de son assistance avant de déposer une déclaration.",
            "Thibitisha wajibu uliosajiliwa, kipindi cha kutangaza na rekodi zinazohitajika kwenye tovuti rasmi ya KRA au kwa msaada wa KRA kabla ya kuwasilisha tamko."
        ],
        [
            "Official source pages can change. Verify the current fee, rate, notice, or schedule on the linked authority before paying or making a high-stakes decision.",
            "Les pages des sources officielles peuvent changer. Vérifiez les frais, taux, avis ou calendriers actuels auprès de l’autorité liée avant de payer ou de prendre une décision importante.",
            "Kurasa za vyanzo rasmi zinaweza kubadilika. Thibitisha ada, kiwango, tangazo au ratiba ya sasa kwenye mamlaka iliyounganishwa kabla ya kulipa au kufanya uamuzi wenye athari kubwa."
        ],
        [
            "Planning comparison only. Confirm each lender's APR or effective cost, fees, repayment schedule, default terms, insurance, taxes and approval conditions before acting.",
            "Comparaison de planification uniquement. Confirmez pour chaque prêteur le taux annuel effectif ou coût réel, les frais, l’échéancier, les conditions de défaut, l’assurance, les impôts et les conditions d’approbation avant d’agir.",
            "Ulinganisho wa kupanga tu. Thibitisha APR au gharama halisi ya kila mkopeshaji, ada, ratiba ya marejesho, masharti ya kushindwa kulipa, bima, kodi na masharti ya kuidhinisha kabla ya kuchukua hatua."
        ],
        [
            "Planning estimate only. Confirm the lender rate, APR or effective cost, fees, insurance, taxes, adjustable-rate rules and approval terms before acting.",
            "Estimation de planification uniquement. Confirmez le taux du prêteur, le taux annuel effectif ou coût réel, les frais, l’assurance, les impôts, les règles de taux variable et les conditions d’approbation avant d’agir.",
            "Makadirio ya kupanga tu. Thibitisha kiwango cha mkopeshaji, APR au gharama halisi, ada, bima, kodi, kanuni za kiwango kinachobadilika na masharti ya kuidhinisha kabla ya kuchukua hatua."
        ],
        [
            "User-entered CPS contribution and RSA planning scenario only. Confirm coverage, pensionable emoluments, rates, balances, fees, returns and benefit options with PenCom, the employer and a licensed provider.",
            "Scénario de cotisation CPS et de compte RSA saisi par l’utilisateur uniquement. Confirmez la couverture, les rémunérations cotisables, les taux, soldes, frais, rendements et options de prestations auprès de PenCom, de l’employeur et d’un fournisseur agréé.",
            "Hali ya kupanga michango ya CPS na RSA iliyoingizwa na mtumiaji tu. Thibitisha wigo, mapato yanayostahiki pensheni, viwango, salio, ada, faida na chaguo za mafao na PenCom, mwajiri na mtoa huduma mwenye leseni."
        ],
        [
            "Nigeria disposal-tax planning estimate only. Confirm classification, deductions, exemptions, filing and payment with NRS, the relevant state tax authority or a qualified tax professional.",
            "Estimation de l’impôt sur les cessions au Nigeria uniquement. Confirmez la classification, les déductions, exemptions, déclaration et paiement auprès du NRS, de l’autorité fiscale de l’État concerné ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga kodi ya uuzaji wa mali Nigeria tu. Thibitisha uainishaji, makato, misamaha, kutangaza na kulipa na NRS, mamlaka ya kodi ya jimbo husika au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Nigeria company-tax planning estimate only. Confirm the company classification, statutory profit bases, incentives, losses, specialised-sector treatment, section 57 position, filing and payment with NRS or a qualified tax professional.",
            "Estimation de l’impôt des sociétés au Nigeria uniquement. Confirmez la catégorie de société, les bases légales du bénéfice, incitations, pertes, régimes sectoriels, application de l’article 57, déclaration et paiement auprès du NRS ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga kodi ya kampuni Nigeria tu. Thibitisha uainishaji wa kampuni, msingi wa kisheria wa faida, motisha, hasara, masharti ya sekta maalum, hali ya kifungu cha 57, kutangaza na kulipa na NRS au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Nigeria withholding-tax planning estimate only. Confirm the relevant authority, transaction classification, recipient facts, Tax ID, treaty or exemption evidence, filing and remittance before acting.",
            "Estimation des retenues à la source au Nigeria uniquement. Confirmez l’autorité compétente, la classification de la transaction, la situation du bénéficiaire, l’identifiant fiscal, les preuves de convention ou d’exemption, la déclaration et le reversement avant d’agir.",
            "Makadirio ya kupanga kodi ya zuio Nigeria tu. Thibitisha mamlaka husika, uainishaji wa muamala, hali ya mpokeaji, namba ya kodi, ushahidi wa mkataba wa kodi au msamaha, kutangaza na kuwasilisha malipo kabla ya kuchukua hatua."
        ],
        [
            "This authority source was checked for availability. Confirm the current publication, notice, schedule, and effective date before relying on a fee or rate.",
            "La disponibilité de cette source officielle a été vérifiée. Confirmez la publication, l’avis, le calendrier et la date d’application actuels avant de vous fier à des frais ou à un taux.",
            "Upatikanaji wa chanzo hiki cha mamlaka ulihakikiwa. Thibitisha chapisho, tangazo, ratiba na tarehe ya kuanza ya sasa kabla ya kutegemea ada au kiwango."
        ],
        [
            "Planning estimate only. Confirm current leave duration, eligibility, payer, caps, tax, social-insurance claim steps, adoption or birth rules, service requirements, collective agreement and employer policy in the issuing country official source before action.",
            "Estimation de planification uniquement. Confirmez dans les sources officielles du pays la durée actuelle du congé, l’éligibilité, le payeur, les plafonds, la fiscalité, les démarches d’assurance sociale, les règles d’adoption ou de naissance, l’ancienneté requise, la convention collective et la politique de l’employeur avant d’agir.",
            "Makadirio ya kupanga tu. Thibitisha muda wa sasa wa likizo, ustahiki, mlipaji, mipaka, kodi, hatua za kudai bima ya kijamii, kanuni za kuasili au kuzaliwa, masharti ya muda wa huduma, mkataba wa pamoja na sera ya mwajiri katika chanzo rasmi cha nchi husika kabla ya hatua."
        ],
        [
            "PAYE and payroll results are planning estimates. Confirm current rates, reliefs, filing, and remittance treatment with the relevant authority or a qualified payroll professional.",
            "Les résultats PAYE et de paie sont des estimations de planification. Confirmez les taux actuels, allègements, déclarations et modalités de reversement auprès de l’autorité compétente ou d’un professionnel de la paie qualifié.",
            "Matokeo ya PAYE na mishahara ni makadirio ya kupanga. Thibitisha viwango vya sasa, nafuu, kutangaza na namna ya kuwasilisha malipo na mamlaka husika au mtaalamu wa mishahara mwenye sifa."
        ],
        [
            "Benin ITS and CNSS results are planning estimates. Confirm benefits in kind, exceptional remuneration, exemptions, variable pay and filing treatment with DGI, CNSS or a qualified payroll professional.",
            "Les résultats ITS et CNSS du Bénin sont des estimations de planification. Confirmez les avantages en nature, rémunérations exceptionnelles, exemptions, rémunérations variables et règles déclaratives auprès de la DGI, de la CNSS ou d’un professionnel de la paie qualifié.",
            "Matokeo ya ITS na CNSS Benin ni makadirio ya kupanga. Thibitisha mafao yasiyo fedha, malipo ya kipekee, misamaha, malipo yanayobadilika na namna ya kutangaza na DGI, CNSS au mtaalamu wa mishahara mwenye sifa."
        ],
        [
            "Djibouti ITS and CNSS results are planning estimates. Confirm benefits, exceptional remuneration, exemptions, special regimes, filing and remittance treatment with DGI, CNSS or a qualified payroll professional.",
            "Les résultats ITS et CNSS de Djibouti sont des estimations de planification. Confirmez les avantages, rémunérations exceptionnelles, exemptions, régimes particuliers, déclarations et reversements auprès de la DGI, de la CNSS ou d’un professionnel de la paie qualifié.",
            "Matokeo ya ITS na CNSS Djibouti ni makadirio ya kupanga. Thibitisha mafao, malipo ya kipekee, misamaha, mifumo maalum, kutangaza na kuwasilisha malipo na DGI, CNSS au mtaalamu wa mishahara mwenye sifa."
        ],
        [
            "Algeria salary results are planning estimates. Confirm the employee category, non-monthly pay, benefits, contribution reductions, filing and remittance treatment with DGI, CNAS or a qualified payroll professional.",
            "Les résultats salariaux de l’Algérie sont des estimations de planification. Confirmez la catégorie du salarié, les rémunérations non mensuelles, avantages, réductions de cotisations, déclarations et reversements auprès de la DGI, de la CNAS ou d’un professionnel de la paie qualifié.",
            "Matokeo ya mishahara Algeria ni makadirio ya kupanga. Thibitisha kundi la mfanyakazi, malipo yasiyo ya kila mwezi, mafao, punguzo la michango, kutangaza na kuwasilisha malipo na DGI, CNAS au mtaalamu wa mishahara mwenye sifa."
        ],
        [
            "Statutory-reference planning estimate only. Confirm later amendments, exemptions, benefit treatment, withholding and pension coverage with the competent Eritrean authority or a qualified professional.",
            "Estimation de planification fondée sur une référence légale uniquement. Confirmez les modifications ultérieures, exemptions, traitement des avantages, retenues et couverture de retraite auprès de l’autorité érythréenne compétente ou d’un professionnel qualifié.",
            "Makadirio ya kupanga kwa rejea ya kisheria tu. Thibitisha marekebisho ya baadaye, misamaha, namna ya mafao, zuio na wigo wa pensheni na mamlaka husika ya Eritrea au mtaalamu mwenye sifa."
        ],
        [
            "CGI 2023 statutory-reference planning estimate only. Confirm later amendments, benefits in kind, actual-expense claims, the approved contribution rate on the payslip, withholding and remittance with DGI or a qualified professional.",
            "Estimation de planification fondée sur le CGI 2023 uniquement. Confirmez les modifications ultérieures, avantages en nature, déductions de frais réels, taux de cotisation approuvé sur le bulletin, retenues et reversements auprès de la DGI ou d’un professionnel qualifié.",
            "Makadirio ya kupanga kwa rejea ya CGI 2023 tu. Thibitisha marekebisho ya baadaye, mafao yasiyo fedha, madai ya gharama halisi, kiwango cha mchango kilichoidhinishwa kwenye hati ya mshahara, zuio na kuwasilisha malipo na DGI au mtaalamu mwenye sifa."
        ],
        [
            "Federal income-tax planning estimate only. Confirm residence, federal member-state treatment, benefits, other payroll obligations, filing and remittance with the Revenue Directorate or a qualified professional.",
            "Estimation de l’impôt fédéral sur le revenu uniquement. Confirmez la résidence, le régime de l’État fédéré, les avantages, autres obligations de paie, déclaration et reversement auprès de la Direction des recettes ou d’un professionnel qualifié.",
            "Makadirio ya kupanga kodi ya mapato ya serikali ya shirikisho tu. Thibitisha makazi, namna ya jimbo la shirikisho, mafao, wajibu mwingine wa mishahara, kutangaza na kuwasilisha malipo na Kurugenzi ya Mapato au mtaalamu mwenye sifa."
        ],
        [
            "Statutory-reference planning estimate only. Confirm later amendments, national or state administration, taxpayer scope, approved-pension treatment, filing and remittance with the South Sudan Revenue Authority or a qualified professional.",
            "Estimation de planification fondée sur une référence légale uniquement. Confirmez les modifications ultérieures, l’administration nationale ou régionale, le champ des contribuables, le traitement des retraites agréées, la déclaration et le reversement auprès de l’Autorité des recettes du Soudan du Sud ou d’un professionnel qualifié.",
            "Makadirio ya kupanga kwa rejea ya kisheria tu. Thibitisha marekebisho ya baadaye, usimamizi wa kitaifa au jimbo, wigo wa walipa kodi, namna ya pensheni zilizoidhinishwa, kutangaza na kuwasilisha malipo na Mamlaka ya Mapato ya Sudan Kusini au mtaalamu mwenye sifa."
        ],
        [
            "INSS results are planning estimates. IRS and final take-home are intentionally not calculated; confirm current tax and payroll treatment with the authorities.",
            "Les résultats INSS sont des estimations de planification. L’IRS et le salaire net final ne sont volontairement pas calculés ; confirmez le traitement fiscal et salarial actuel auprès des autorités.",
            "Matokeo ya INSS ni makadirio ya kupanga. IRS na mshahara halisi wa mwisho havihesabiwi kwa makusudi; thibitisha namna ya sasa ya kodi na mishahara na mamlaka."
        ],
        [
            "Annual planning estimate with the general rebate only. Additional age relief, part-year payroll, retirement and redundancy require separate ERS guidance. Use the official ERS workbook for payroll calculations.",
            "Estimation annuelle avec l’abattement général uniquement. Les allègements liés à l’âge, la paie sur une partie de l’année, la retraite et le licenciement nécessitent des consignes ERS distinctes. Utilisez le classeur officiel ERS pour les calculs de paie.",
            "Makadirio ya mwaka yenye punguzo la jumla tu. Nafuu za umri, mishahara ya sehemu ya mwaka, kustaafu na kupunguzwa kazi zinahitaji mwongozo tofauti wa ERS. Tumia kitabu rasmi cha hesabu cha ERS kwa mishahara."
        ],
        [
            "Use payroll and tax outputs as planning estimates. Confirm filing decisions with the relevant tax authority or qualified payroll professional.",
            "Utilisez les résultats salariaux et fiscaux comme estimations de planification. Confirmez les décisions déclaratives auprès de l’autorité fiscale compétente ou d’un professionnel de la paie qualifié.",
            "Tumia matokeo ya mishahara na kodi kama makadirio ya kupanga. Thibitisha maamuzi ya kutangaza na mamlaka ya kodi husika au mtaalamu wa mishahara mwenye sifa."
        ],
        [
            "Togo PAYE results are planning estimates. Confirm benefits, other mandatory insurance, special regimes, filing and remittance treatment with OTR, CNSS or a qualified payroll professional.",
            "Les résultats PAYE du Togo sont des estimations de planification. Confirmez les avantages, autres assurances obligatoires, régimes particuliers, déclaration et reversement auprès de l’OTR, de la CNSS ou d’un professionnel de la paie qualifié.",
            "Matokeo ya PAYE Togo ni makadirio ya kupanga. Thibitisha mafao, bima nyingine za lazima, mifumo maalum, kutangaza na kuwasilisha malipo na OTR, CNSS au mtaalamu wa mishahara mwenye sifa."
        ],
        [
            "Draft only. Confirm employee identity, earnings, deduction authority, statutory treatment, payment, remittance, filing and local payslip requirements with the employer, relevant authority or a qualified payroll professional before issue or reliance.",
            "Brouillon uniquement. Confirmez l’identité du salarié, les rémunérations, l’autorisation des retenues, le traitement légal, le paiement, le reversement, la déclaration et les exigences locales du bulletin auprès de l’employeur, de l’autorité compétente ou d’un professionnel de la paie qualifié avant émission ou utilisation.",
            "Rasimu tu. Thibitisha utambulisho wa mfanyakazi, mapato, mamlaka ya makato, namna ya kisheria, malipo, kuwasilisha malipo, kutangaza na masharti ya eneo ya hati ya mshahara na mwajiri, mamlaka husika au mtaalamu wa mishahara mwenye sifa kabla ya kutoa au kutegemea hati."
        ],
        [
            "Planning estimate only. Confirm scheme values, fees, guarantees, tax, access, beneficiaries and retirement-income options with the provider, authority or a licensed adviser.",
            "Estimation de planification uniquement. Confirmez les valeurs du régime, frais, garanties, fiscalité, accès, bénéficiaires et options de revenu de retraite auprès du fournisseur, de l’autorité ou d’un conseiller agréé.",
            "Makadirio ya kupanga tu. Thibitisha thamani za mpango, ada, dhamana, kodi, upatikanaji, wanufaika na chaguo za mapato ya uzeeni na mtoa huduma, mamlaka au mshauri mwenye leseni."
        ],
        [
            "User-entered quote comparison only. Recheck the provider quote, expiry, total debit, recipient amount, payout route, limits, identity requirements and safety before sending money.",
            "Comparaison de devis saisis par l’utilisateur uniquement. Revérifiez le devis du fournisseur, son expiration, le débit total, le montant reçu, le mode de versement, les limites, les exigences d’identité et la sécurité avant d’envoyer de l’argent.",
            "Ulinganisho wa nukuu zilizoingizwa na mtumiaji tu. Hakiki tena nukuu ya mtoa huduma, muda wa kuisha, jumla inayokatwa, kiasi kinachopokelewa, njia ya kulipa, mipaka, masharti ya utambulisho na usalama kabla ya kutuma fedha."
        ],
        [
            "Deterministic planning scenario only. Confirm current pension statements, tax treatment, fees, benefit access, inflation basis and investment assumptions. This is not a forecast, guaranteed outcome, safe withdrawal recommendation, investment advice, tax advice or legal advice.",
            "Scénario de planification déterministe uniquement. Confirmez les relevés de retraite actuels, la fiscalité, les frais, l’accès aux prestations, la base d’inflation et les hypothèses d’investissement. Ce n’est ni une prévision, ni un résultat garanti, ni une recommandation de retrait sûr, ni un conseil en investissement, fiscalité ou droit.",
            "Hali ya kupanga kwa hesabu zisizo za bahati tu. Thibitisha taarifa za sasa za pensheni, kodi, ada, upatikanaji wa mafao, msingi wa mfumuko wa bei na dhana za uwekezaji. Huu si utabiri, matokeo yenye dhamana, pendekezo la uondoaji salama, ushauri wa uwekezaji, kodi au sheria."
        ],
        [
            "Planning estimate only. Confirm consultation, alternatives, eligibility, selection fairness, severance rules, caps, rounding, notice, leave records, tax, deductions, contract and collective agreement with the responsible authority or a qualified labour, legal or payroll professional.",
            "Estimation de planification uniquement. Confirmez la consultation, les alternatives, l’éligibilité, l’équité de sélection, les règles d’indemnité, plafonds, arrondis, préavis, registres de congés, fiscalité, retenues, contrat et convention collective auprès de l’autorité compétente ou d’un professionnel du travail, du droit ou de la paie qualifié.",
            "Makadirio ya kupanga tu. Thibitisha mashauriano, njia mbadala, ustahiki, haki ya uchaguzi, kanuni za fidia, mipaka, kuzungusha, notisi, rekodi za likizo, kodi, makato, mkataba na makubaliano ya pamoja na mamlaka husika au mtaalamu mwenye sifa wa kazi, sheria au mishahara."
        ],
        [
            "Planning estimate only. Confirm the current fare, transfers, luggage, booking and peak-time charges with the operator, stage, ticket seller or transport app before travel.",
            "Estimation de planification uniquement. Confirmez le tarif actuel, les correspondances, bagages, réservations et suppléments de pointe auprès de l’opérateur, de l’arrêt, du vendeur de billets ou de l’application de transport avant le voyage.",
            "Makadirio ya kupanga tu. Thibitisha nauli ya sasa, kubadilisha usafiri, mizigo, uhifadhi na ada za saa za msongamano na mwendeshaji, kituo, muuzaji wa tiketi au programu ya usafiri kabla ya safari."
        ],
        [
            "Descriptive sample summary only. It is not an official wage schedule, representative market benchmark, job offer, tax or net-pay result, fair-pay conclusion, legal advice or recommendation.",
            "Résumé descriptif d’un échantillon uniquement. Il ne constitue ni barème officiel, ni référence représentative du marché, ni offre d’emploi, résultat fiscal ou salarial net, conclusion sur une rémunération équitable, conseil juridique ou recommandation.",
            "Muhtasari wa maelezo ya sampuli tu. Si ratiba rasmi ya mishahara, kipimo wakilishi cha soko, ofa ya kazi, matokeo ya kodi au mshahara halisi, hitimisho la malipo ya haki, ushauri wa sheria au pendekezo."
        ],
        [
            "Planning comparison only. Confirm the written offers, currency, pay period, benefit values, working time, tax treatment and current local rules. This is not market salary evidence, a net-pay result, legal advice or a recommendation.",
            "Comparaison de planification uniquement. Confirmez les offres écrites, la devise, la période de paie, les avantages, le temps de travail, la fiscalité et les règles locales actuelles. Ce n’est ni une preuve des salaires du marché, ni un calcul du net, ni un conseil juridique ou une recommandation.",
            "Ulinganisho wa kupanga tu. Thibitisha ofa zilizoandikwa, sarafu, kipindi cha malipo, thamani za mafao, muda wa kazi, kodi na kanuni za sasa za eneo. Huu si ushahidi wa mishahara ya soko, matokeo ya mshahara halisi, ushauri wa sheria au pendekezo."
        ],
        [
            "Confirm the live filing window, obligation, assessment, amount and action in official SARS systems or with SARS support before submission or payment.",
            "Confirmez la période de dépôt ouverte, l’obligation, l’évaluation, le montant et l’action dans les systèmes officiels SARS ou auprès de son assistance avant un dépôt ou un paiement.",
            "Thibitisha kipindi cha sasa cha kuwasilisha, wajibu, tathmini, kiasi na hatua kwenye mifumo rasmi ya SARS au kwa msaada wa SARS kabla ya kuwasilisha au kulipa."
        ],
        [
            "User-entered constant-return plan only. Confirm interest method, fees, tax, access restrictions, risk and current provider terms.",
            "Plan à rendement constant saisi par l’utilisateur uniquement. Confirmez la méthode d’intérêt, les frais, impôts, restrictions d’accès, risques et conditions actuelles du fournisseur.",
            "Mpango wa faida isiyobadilika ulioingizwa na mtumiaji tu. Thibitisha njia ya riba, ada, kodi, vizuizi vya upatikanaji, hatari na masharti ya sasa ya mtoa huduma."
        ],
        [
            "Scholarship details can change. Verify deadlines and eligibility on the official provider page before applying.",
            "Les informations sur les bourses peuvent changer. Vérifiez les échéances et l’éligibilité sur la page officielle du fournisseur avant de candidater.",
            "Maelezo ya ufadhili wa masomo yanaweza kubadilika. Thibitisha tarehe za mwisho na ustahiki kwenye ukurasa rasmi wa mtoa ufadhili kabla ya kutuma ombi."
        ],
        [
            "Profile details are user-entered and should be checked before applications or reminders are created.",
            "Les informations du profil sont saisies par l’utilisateur et doivent être vérifiées avant la création de candidatures ou de rappels.",
            "Maelezo ya wasifu yameingizwa na mtumiaji na yanapaswa kuhakikiwa kabla ya kuunda maombi au vikumbusho."
        ],
        [
            "Planning worksheet only. Confirm taxpayer type, taxable income, deductions, withholding treatment, current rates, reliefs, thresholds, registration and deadlines with the responsible tax authority or a qualified tax adviser.",
            "Feuille de planification uniquement. Confirmez la catégorie de contribuable, le revenu imposable, les déductions, retenues, taux actuels, allègements, seuils, immatriculation et échéances auprès de l’autorité fiscale compétente ou d’un conseiller fiscal qualifié.",
            "Karatasi ya kupanga tu. Thibitisha aina ya mlipa kodi, mapato yanayotozwa kodi, makato, zuio, viwango vya sasa, nafuu, vizingiti, usajili na tarehe za mwisho na mamlaka ya kodi husika au mshauri wa kodi mwenye sifa."
        ],
        [
            "Contribution estimates are for planning. Confirm current caps, rates, eligibility, and remittance rules with the relevant scheme or payroll professional.",
            "Les estimations de cotisations servent à la planification. Confirmez les plafonds actuels, taux, éligibilité et règles de reversement auprès du régime concerné ou d’un professionnel de la paie.",
            "Makadirio ya michango ni ya kupanga. Thibitisha mipaka ya sasa, viwango, ustahiki na kanuni za kuwasilisha malipo na mpango husika au mtaalamu wa mishahara."
        ],
        [
            "Contribution results are planning estimates. Confirm current rates and caps with the relevant statutory scheme.",
            "Les résultats de cotisations sont des estimations de planification. Confirmez les taux et plafonds actuels auprès du régime légal compétent.",
            "Matokeo ya michango ni makadirio ya kupanga. Thibitisha viwango na mipaka ya sasa na mpango husika wa kisheria."
        ],
        [
            "South Africa CGT planning estimate only. Confirm classification, valuation, exclusions, losses, filing and payment with SARS or a qualified tax professional.",
            "Estimation de l’impôt sur les plus-values en Afrique du Sud uniquement. Confirmez la classification, la valorisation, les exclusions, pertes, déclaration et paiement auprès de SARS ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga kodi ya faida ya mali Afrika Kusini tu. Thibitisha uainishaji, thamani, visivyohusika, hasara, kutangaza na kulipa na SARS au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "South Africa dividends-tax planning estimate only. Confirm scope, beneficial ownership, declaration validity, treaty or exemption eligibility, filing and payment with SARS or a qualified tax professional.",
            "Estimation de l’impôt sur les dividendes en Afrique du Sud uniquement. Confirmez le champ, le bénéficiaire effectif, la validité des déclarations, l’éligibilité aux conventions ou exemptions, le dépôt et le paiement auprès de SARS ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga kodi ya gawio Afrika Kusini tu. Thibitisha wigo, umiliki halisi, uhalali wa tamko, ustahiki wa mkataba wa kodi au msamaha, kutangaza na kulipa na SARS au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "GEPF planning estimate only. Confirm service records, actuarial factors, tax, early-retirement approval and final benefits with GEPF before acting.",
            "Estimation GEPF uniquement. Confirmez les états de service, facteurs actuariels, impôts, autorisation de retraite anticipée et prestations finales auprès du GEPF avant d’agir.",
            "Makadirio ya kupanga GEPF tu. Thibitisha rekodi za huduma, vigezo vya kihesabu vya pensheni, kodi, idhini ya kustaafu mapema na mafao ya mwisho na GEPF kabla ya hatua."
        ],
        [
            "South Africa transfer-duty planning estimate only. Confirm the acquisition date, declared value, VAT treatment, exemptions, filing and payment with SARS and the conveyancer.",
            "Estimation des droits de mutation en Afrique du Sud uniquement. Confirmez la date d’acquisition, la valeur déclarée, le traitement TVA, les exemptions, déclaration et paiement auprès de SARS et du professionnel chargé du transfert.",
            "Makadirio ya kupanga ushuru wa uhamisho Afrika Kusini tu. Thibitisha tarehe ya ununuzi, thamani iliyotangazwa, namna ya VAT, misamaha, kutangaza na kulipa na SARS na mtaalamu wa uhamisho wa mali."
        ],
        [
            "UIF results are planning estimates. Confirm current contribution, credit, eligibility, claim and payment rules with SARS, UIF or the Department of Employment and Labour.",
            "Les résultats UIF sont des estimations de planification. Confirmez les règles actuelles de cotisation, crédit, éligibilité, demande et paiement auprès de SARS, de l’UIF ou du ministère de l’Emploi et du Travail.",
            "Matokeo ya UIF ni makadirio ya kupanga. Thibitisha kanuni za sasa za michango, haki zilizokusanywa, ustahiki, madai na malipo na SARS, UIF au Idara ya Ajira na Kazi."
        ],
        [
            "Staff-budget planning estimate only. Confirm current employment status, rates, ceilings, risk classes, contract terms, accounting treatment and filing obligations with the responsible authority or a qualified payroll, accounting or legal professional.",
            "Estimation du budget de personnel uniquement. Confirmez le statut d’emploi actuel, les taux, plafonds, classes de risque, conditions contractuelles, traitement comptable et obligations déclaratives auprès de l’autorité compétente ou d’un professionnel de la paie, de la comptabilité ou du droit qualifié.",
            "Makadirio ya kupanga bajeti ya wafanyakazi tu. Thibitisha hali ya sasa ya ajira, viwango, mipaka, makundi ya hatari, masharti ya mkataba, namna ya uhasibu na wajibu wa kutangaza na mamlaka husika au mtaalamu mwenye sifa wa mishahara, uhasibu au sheria."
        ],
        [
            "User-entered fixed-rate plan only. Confirm the official balance, rate method, fees, interest during study or grace, deductions, penalties, waivers and repayment schedule with the provider.",
            "Plan à taux fixe saisi par l’utilisateur uniquement. Confirmez le solde officiel, la méthode de taux, les frais, intérêts pendant les études ou le différé, retenues, pénalités, dispenses et échéancier auprès du fournisseur.",
            "Mpango wa kiwango kisichobadilika ulioingizwa na mtumiaji tu. Thibitisha salio rasmi, njia ya kiwango, ada, riba wakati wa masomo au muda wa kusubiri, makato, adhabu, misamaha na ratiba ya marejesho na mtoa huduma."
        ],
        [
            "Study abroad costs and visa requirements change frequently. Confirm tuition, proof-of-funds, insurance, visa, and deadline details with official university and government sources before applying or paying.",
            "Les coûts d’études à l’étranger et les conditions de visa changent fréquemment. Confirmez les frais de scolarité, preuves de fonds, assurance, visa et échéances auprès des sources officielles universitaires et gouvernementales avant de candidater ou de payer.",
            "Gharama za kusoma nje na masharti ya visa hubadilika mara kwa mara. Thibitisha ada za masomo, ushahidi wa fedha, bima, visa na tarehe za mwisho na vyanzo rasmi vya chuo na serikali kabla ya ombi au malipo."
        ],
        [
            "Planning-grade archived Telecom data only. Verify every current tariff, offer, code, coverage result, availability claim, deadline, and legal requirement with the relevant operator or regulator.",
            "Données télécom archivées destinées à la planification uniquement. Vérifiez chaque tarif, offre, code, résultat de couverture, affirmation de disponibilité, échéance et exigence légale actuels auprès de l’opérateur ou du régulateur concerné.",
            "Data za mawasiliano zilizohifadhiwa kwa kupanga tu. Thibitisha kila bei, ofa, msimbo, matokeo ya wigo, dai la upatikanaji, tarehe ya mwisho na sharti la sasa la sheria na mwendeshaji au mdhibiti husika."
        ],
        [
            "Planning worksheet only. Confirm the functional analysis, method, comparables, range, adjustments, local law, documentation and filing with the relevant authority or a qualified transfer-pricing professional.",
            "Feuille de planification uniquement. Confirmez l’analyse fonctionnelle, la méthode, les comparables, la fourchette, les ajustements, le droit local, la documentation et la déclaration auprès de l’autorité compétente ou d’un professionnel des prix de transfert qualifié.",
            "Karatasi ya kupanga tu. Thibitisha uchambuzi wa shughuli, njia, mifano linganishi, wigo wa bei, marekebisho, sheria za eneo, nyaraka na kutangaza na mamlaka husika au mtaalamu wa bei za uhamisho mwenye sifa."
        ],
        [
            "Source confidence is unavailable. Treat this output as a planning estimate until metadata is reviewed.",
            "La confiance dans la source n’est pas disponible. Traitez ce résultat comme une estimation de planification jusqu’à la révision des métadonnées.",
            "Uhakika wa chanzo haupatikani. Chukulia matokeo haya kama makadirio ya kupanga mpaka maelezo ya chanzo yakaguliwe."
        ],
        [
            "Angola VAT planning estimate only. Confirm classification, regime, Cabinda or hospitality eligibility, captive-tax status, invoicing, input tax, filing and payment with AGT or a qualified tax professional.",
            "Estimation de TVA en Angola uniquement. Confirmez la classification, le régime, l’éligibilité de Cabinda ou de l’hôtellerie, le statut de TVA captive, la facturation, la TVA déductible, la déclaration et le paiement auprès de l’AGT ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Angola tu. Thibitisha uainishaji, mfumo, ustahiki wa Cabinda au huduma za ukarimu, hali ya kodi inayozuiliwa, ankara, kodi ya pembejeo, kutangaza na kulipa na AGT au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "VAT results are planning estimates. Confirm current rates, exemptions, registration, invoicing, and filing treatment with the relevant authority or a qualified tax professional.",
            "Les résultats TVA sont des estimations de planification. Confirmez les taux actuels, exemptions, immatriculation, facturation et règles déclaratives auprès de l’autorité compétente ou d’un fiscaliste qualifié.",
            "Matokeo ya VAT ni makadirio ya kupanga. Thibitisha viwango vya sasa, misamaha, usajili, ankara na namna ya kutangaza na mamlaka husika au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Benin VAT planning estimate only. Confirm classification, export or exemption treatment, the current registration threshold, invoicing, input tax, filing and payment with DGI Benin or a qualified tax professional.",
            "Estimation de TVA au Bénin uniquement. Confirmez la classification, le traitement des exportations ou exemptions, le seuil actuel d’immatriculation, la facturation, la TVA déductible, la déclaration et le paiement auprès de la DGI Bénin ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Benin tu. Thibitisha uainishaji, namna ya mauzo nje au misamaha, kizingiti cha sasa cha usajili, ankara, kodi ya pembejeo, kutangaza na kulipa na DGI Benin au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Botswana VAT planning estimate only. Confirm classification, registration, digital-services treatment, input tax, invoicing, filing and payment with BURS or a qualified tax adviser.",
            "Estimation de TVA au Botswana uniquement. Confirmez la classification, l’immatriculation, le traitement des services numériques, la TVA déductible, la facturation, la déclaration et le paiement auprès de BURS ou d’un conseiller fiscal qualifié.",
            "Makadirio ya kupanga VAT Botswana tu. Thibitisha uainishaji, usajili, namna ya huduma za kidijitali, kodi ya pembejeo, ankara, kutangaza na kulipa na BURS au mshauri wa kodi mwenye sifa."
        ],
        [
            "DR Congo TVA planning estimate only. Confirm classification, registration, normalized invoicing, filing, deductions, refunds and remittance with DGI or a qualified professional.",
            "Estimation de TVA en RD Congo uniquement. Confirmez la classification, l’immatriculation, la facturation normalisée, les déclarations, déductions, remboursements et reversements auprès de la DGI ou d’un professionnel qualifié.",
            "Makadirio ya kupanga TVA DR Congo tu. Thibitisha uainishaji, usajili, ankara zilizosanifishwa, kutangaza, makato, marejesho na kuwasilisha malipo na DGI au mtaalamu mwenye sifa."
        ],
        [
            "Central African Republic TVA planning estimate only. Confirm tariff or export classification, registration, invoicing, filing frequency, deductions, designated-entity treatment and remittance with DGID or a qualified professional.",
            "Estimation de TVA en République centrafricaine uniquement. Confirmez la classification tarifaire ou des exportations, l’immatriculation, la facturation, la fréquence déclarative, les déductions, le traitement des entités désignées et le reversement auprès de la DGID ou d’un professionnel qualifié.",
            "Makadirio ya kupanga TVA Jamhuri ya Afrika ya Kati tu. Thibitisha uainishaji wa ushuru au mauzo nje, usajili, ankara, marudio ya kutangaza, makato, namna ya taasisi zilizoteuliwa na kuwasilisha malipo na DGID au mtaalamu mwenye sifa."
        ],
        [
            "Congo TVA planning estimate only. Confirm tariff or zero-rate evidence, exemption, regime, statutory rounding, invoicing, filing, deductions and remittance with DGI or a qualified professional.",
            "Estimation de TVA au Congo uniquement. Confirmez les preuves de tarif ou taux zéro, exemptions, régime, arrondi légal, facturation, déclaration, déductions et reversement auprès de la DGI ou d’un professionnel qualifié.",
            "Makadirio ya kupanga TVA Congo tu. Thibitisha ushahidi wa ushuru au kiwango cha sifuri, msamaha, mfumo, kuzungusha kisheria, ankara, kutangaza, makato na kuwasilisha malipo na DGI au mtaalamu mwenye sifa."
        ],
        [
            "Côte d’Ivoire VAT planning estimate only. Confirm classification, regime, invoicing, filing and remittance with DGI or a qualified professional.",
            "Estimation de TVA en Côte d’Ivoire uniquement. Confirmez la classification, le régime, la facturation, la déclaration et le reversement auprès de la DGI ou d’un professionnel qualifié.",
            "Makadirio ya kupanga VAT Côte d’Ivoire tu. Thibitisha uainishaji, mfumo, ankara, kutangaza na kuwasilisha malipo na DGI au mtaalamu mwenye sifa."
        ],
        [
            "Cameroon VAT planning estimate only. Confirm classification, social-housing qualification, registration, withholding authorization, input tax, invoicing, filing and payment with DGI Cameroon or a qualified tax adviser.",
            "Estimation de TVA au Cameroun uniquement. Confirmez la classification, l’éligibilité au logement social, l’immatriculation, l’autorisation de retenue, la TVA déductible, la facturation, la déclaration et le paiement auprès de la DGI Cameroun ou d’un conseiller fiscal qualifié.",
            "Makadirio ya kupanga VAT Cameroon tu. Thibitisha uainishaji, ustahiki wa makazi ya kijamii, usajili, idhini ya zuio, kodi ya pembejeo, ankara, kutangaza na kulipa na DGI Cameroon au mshauri wa kodi mwenye sifa."
        ],
        [
            "Use VAT outputs as planning estimates. Confirm registration, invoicing, and filing treatment with the relevant authority or tax professional.",
            "Utilisez les résultats TVA comme estimations de planification. Confirmez l’immatriculation, la facturation et les règles déclaratives auprès de l’autorité compétente ou d’un professionnel fiscal.",
            "Tumia matokeo ya VAT kama makadirio ya kupanga. Thibitisha usajili, ankara na namna ya kutangaza na mamlaka husika au mtaalamu wa kodi."
        ],
        [
            "Djibouti VAT planning estimate only. Confirm the current consolidated CGI, classification, evidence, registration, invoicing, filing and payment with DGI or a qualified professional.",
            "Estimation de TVA à Djibouti uniquement. Confirmez le CGI consolidé actuel, la classification, les preuves, l’immatriculation, la facturation, la déclaration et le paiement auprès de la DGI ou d’un professionnel qualifié.",
            "Makadirio ya kupanga VAT Djibouti tu. Thibitisha CGI ya sasa iliyojumuishwa, uainishaji, ushahidi, usajili, ankara, kutangaza na kulipa na DGI au mtaalamu mwenye sifa."
        ],
        [
            "Algeria VAT planning estimate only. Confirm the exact TCA treatment, taxpayer regime, invoicing, deduction, filing and payment position with DGI or a qualified tax professional.",
            "Estimation de TVA en Algérie uniquement. Confirmez le traitement TCA exact, le régime du contribuable, la facturation, les déductions, la déclaration et la situation de paiement auprès de la DGI ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Algeria tu. Thibitisha namna sahihi ya TCA, mfumo wa mlipa kodi, ankara, makato, kutangaza na hali ya malipo na DGI au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Egypt VAT planning estimate only. Confirm classification, registration, invoicing, filing and remittance with ETA or a qualified tax professional.",
            "Estimation de TVA en Égypte uniquement. Confirmez la classification, l’immatriculation, la facturation, la déclaration et le reversement auprès de l’ETA ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Egypt tu. Thibitisha uainishaji, usajili, ankara, kutangaza na kuwasilisha malipo na ETA au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Historical planning arithmetic only, not a current VAT result. Confirm the current Eritrean tax system, rates, classification, registration, invoicing, filing, and payment duties with a current authority or qualified adviser.",
            "Calcul historique de planification uniquement, pas un résultat actuel de TVA. Confirmez le système fiscal érythréen actuel, les taux, la classification, l’immatriculation, la facturation, la déclaration et les obligations de paiement auprès d’une autorité actuelle ou d’un conseiller qualifié.",
            "Hesabu ya kihistoria ya kupanga tu, si matokeo ya sasa ya VAT. Thibitisha mfumo wa sasa wa kodi Eritrea, viwango, uainishaji, usajili, ankara, kutangaza na wajibu wa kulipa na mamlaka ya sasa au mshauri mwenye sifa."
        ],
        [
            "Equatorial Guinea IVA planning estimate only. Confirm product and tariff classification, import evidence, registration, invoicing, filing, deductions and remittance with DGIC or a qualified professional.",
            "Estimation d’IVA en Guinée équatoriale uniquement. Confirmez la classification des produits et tarifs, les preuves d’importation, l’immatriculation, la facturation, la déclaration, les déductions et le reversement auprès de la DGIC ou d’un professionnel qualifié.",
            "Makadirio ya kupanga IVA Guinea ya Ikweta tu. Thibitisha uainishaji wa bidhaa na ushuru, ushahidi wa kuagiza, usajili, ankara, kutangaza, makato na kuwasilisha malipo na DGIC au mtaalamu mwenye sifa."
        ],
        [
            "Comoros TC planning estimate only. Confirm Article 152 classification and evidence, Article 141 threshold status, invoicing, filing, deductions and remittance with DGI or a qualified professional.",
            "Estimation de TC aux Comores uniquement. Confirmez la classification et les preuves de l’article 152, le statut au regard du seuil de l’article 141, la facturation, la déclaration, les déductions et le reversement auprès de la DGI ou d’un professionnel qualifié.",
            "Makadirio ya kupanga TC Comoros tu. Thibitisha uainishaji na ushahidi wa kifungu cha 152, hali ya kizingiti cha kifungu cha 141, ankara, kutangaza, makato na kuwasilisha malipo na DGI au mtaalamu mwenye sifa."
        ],
        [
            "Morocco VAT planning estimate only. Confirm the exact CGI classification, taxable scope, export evidence, invoice, deduction, withholding, filing and payment with DGI or a qualified tax professional.",
            "Estimation de TVA au Maroc uniquement. Confirmez la classification exacte du CGI, le champ imposable, les preuves d’exportation, la facture, la déduction, la retenue, la déclaration et le paiement auprès de la DGI ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Morocco tu. Thibitisha uainishaji sahihi wa CGI, wigo wa kodi, ushahidi wa mauzo nje, ankara, makato, zuio, kutangaza na kulipa na DGI au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Mauritius VAT planning estimate only. Confirm classification, schedule evidence, registration, invoicing, filing, input tax and payment with MRA or a qualified tax professional.",
            "Estimation de TVA à Maurice uniquement. Confirmez la classification, les preuves des annexes, l’immatriculation, la facturation, la déclaration, la TVA déductible et le paiement auprès de la MRA ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Mauritius tu. Thibitisha uainishaji, ushahidi wa majedwali, usajili, ankara, kutangaza, kodi ya pembejeo na kulipa na MRA au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Rwanda VAT planning estimate only. Confirm classification, registration, input tax, withholding, invoicing, filing and remittance with RRA or a qualified tax professional.",
            "Estimation de TVA au Rwanda uniquement. Confirmez la classification, l’immatriculation, la TVA déductible, la retenue, la facturation, la déclaration et le reversement auprès de la RRA ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Rwanda tu. Thibitisha uainishaji, usajili, kodi ya pembejeo, zuio, ankara, kutangaza na kuwasilisha malipo na RRA au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Eswatini VAT planning estimate only. Confirm classification, evidence, registration, invoicing, filing and payment with ERS or a qualified professional.",
            "Estimation de TVA en Eswatini uniquement. Confirmez la classification, les preuves, l’immatriculation, la facturation, la déclaration et le paiement auprès de l’ERS ou d’un professionnel qualifié.",
            "Makadirio ya kupanga VAT Eswatini tu. Thibitisha uainishaji, ushahidi, usajili, ankara, kutangaza na kulipa na ERS au mtaalamu mwenye sifa."
        ],
        [
            "Chad TVA planning estimate only. Confirm Article 238 classification, Article 230 exemptions, regime and IGL status, invoicing, statutory rounding, filing and remittance with DGI or a qualified professional.",
            "Estimation de TVA au Tchad uniquement. Confirmez la classification de l’article 238, les exemptions de l’article 230, le régime et le statut IGL, la facturation, l’arrondi légal, la déclaration et le reversement auprès de la DGI ou d’un professionnel qualifié.",
            "Makadirio ya kupanga TVA Chad tu. Thibitisha uainishaji wa kifungu cha 238, misamaha ya kifungu cha 230, mfumo na hali ya IGL, ankara, kuzungusha kisheria, kutangaza na kuwasilisha malipo na DGI au mtaalamu mwenye sifa."
        ],
        [
            "Tanzania VAT planning estimate only. Confirm the current public-notice eligibility, classification, registration, invoicing, filing, remittance and Zanzibar treatment with TRA or a qualified tax professional.",
            "Estimation de TVA en Tanzanie uniquement. Confirmez l’éligibilité selon l’avis public actuel, la classification, l’immatriculation, la facturation, la déclaration, le reversement et le traitement de Zanzibar auprès de la TRA ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Tanzania tu. Thibitisha ustahiki wa tangazo la sasa la umma, uainishaji, usajili, ankara, kutangaza, kuwasilisha malipo na namna ya Zanzibar na TRA au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Uganda VAT planning estimate only. Confirm classification, registration, VAT-withholding designation and exemption status, input tax, invoicing, filing and remittance with URA or a qualified tax professional.",
            "Estimation de TVA en Ouganda uniquement. Confirmez la classification, l’immatriculation, la désignation pour retenue de TVA et le statut d’exemption, la TVA déductible, la facturation, la déclaration et le reversement auprès de l’URA ou d’un fiscaliste qualifié.",
            "Makadirio ya kupanga VAT Uganda tu. Thibitisha uainishaji, usajili, uteuzi wa kuzuia VAT na hali ya msamaha, kodi ya pembejeo, ankara, kutangaza na kuwasilisha malipo na URA au mtaalamu wa kodi mwenye sifa."
        ],
        [
            "Planning reference only. Use the official links and review date on the selected route, then confirm current rates, scope, exemptions, filing and payment treatment with the responsible authority.",
            "Référence de planification uniquement. Utilisez les liens officiels et la date de révision de la page choisie, puis confirmez les taux actuels, le champ, les exemptions et les règles de déclaration et de paiement auprès de l’autorité compétente.",
            "Rejea ya kupanga tu. Tumia viungo rasmi na tarehe ya ukaguzi kwenye ukurasa uliochaguliwa, kisha thibitisha viwango vya sasa, wigo, misamaha na namna ya kutangaza na kulipa na mamlaka husika."
        ],
        [
            "Indicative snapshot only. Recheck timestamp, venue price, spread, liquidity, fees, taxes and execution terms before acting.",
            "Instantané indicatif uniquement. Revérifiez l’horodatage, le prix de la plateforme, l’écart de cours, la liquidité, les frais, impôts et conditions d’exécution avant d’agir.",
            "Rekodi ya muda elekezi tu. Hakiki tena muda, bei ya jukwaa, tofauti ya bei, ukwasi, ada, kodi na masharti ya kutekeleza kabla ya hatua."
        ],
        [
            "Educational or format evidence only. Verify identities, regulator registers, contract records, transaction history and professional advice before transferring assets.",
            "Preuve pédagogique ou de format uniquement. Vérifiez les identités, registres des régulateurs, contrats, historiques de transaction et avis professionnels avant de transférer des actifs.",
            "Ushahidi wa elimu au umbizo tu. Hakiki utambulisho, rejesta za wadhibiti, rekodi za mikataba, historia ya miamala na ushauri wa kitaalamu kabla ya kuhamisha mali."
        ],
        [
            "User-entered scenario only. Verify the venue, quote timestamp, fees, spread, network costs, taxes, liquidity, counterparty and execution risk independently.",
            "Scénario saisi par l’utilisateur uniquement. Vérifiez indépendamment la plateforme, l’horodatage du devis, les frais, écarts de cours, coûts réseau, impôts, liquidité, contrepartie et risque d’exécution.",
            "Hali iliyoingizwa na mtumiaji tu. Hakiki jukwaa, muda wa nukuu, ada, tofauti ya bei, gharama za mtandao, kodi, ukwasi, upande wa pili wa muamala na hatari ya utekelezaji kwa kujitegemea."
        ],
        [
            "Planning or evidence workflow only. Confirm current country law, collective agreements, employer policy, authority guidance and the dated evidence shown on the route before acting.",
            "Parcours de planification ou de preuves uniquement. Confirmez le droit national actuel, les conventions collectives, la politique de l’employeur, les consignes des autorités et les preuves datées affichées sur la page avant d’agir.",
            "Mchakato wa kupanga au ushahidi tu. Thibitisha sheria za sasa za nchi, mikataba ya pamoja, sera ya mwajiri, mwongozo wa mamlaka na ushahidi wenye tarehe unaoonyeshwa kwenye ukurasa kabla ya hatua."
        ],
        [
            "Planning estimate only. Confirm current provider tariff, taxes, meter treatment, fuel price, generator consumption and maintenance before budgeting or disputing a bill.",
            "Estimation de planification uniquement. Confirmez le tarif actuel du fournisseur, les taxes, le traitement du compteur, le prix du carburant, la consommation et l’entretien du groupe électrogène avant d’établir un budget ou de contester une facture.",
            "Makadirio ya kupanga tu. Thibitisha bei ya sasa ya mtoa huduma, kodi, namna ya mita, bei ya mafuta, matumizi na matengenezo ya jenereta kabla ya kupanga bajeti au kupinga bili."
        ],
        [
            "Readiness checklist only. Confirm current programme scope, lender criteria, collateral, rates, fees, deadlines and approval directly with the named provider.",
            "Liste de préparation uniquement. Confirmez directement auprès du fournisseur nommé le périmètre actuel du programme, les critères de prêt, garanties, taux, frais, échéances et approbation.",
            "Orodha ya maandalizi tu. Thibitisha wigo wa sasa wa mpango, vigezo vya mkopeshaji, dhamana, viwango, ada, tarehe za mwisho na idhini moja kwa moja na mtoa huduma aliyetajwa."
        ],
        [
            "User-entered planning scenario only. Confirm current provider terms, effective rates, fees, taxes, legal rules and eligibility with the responsible provider or authority.",
            "Scénario de planification saisi par l’utilisateur uniquement. Confirmez les conditions actuelles du fournisseur, taux effectifs, frais, impôts, règles légales et éligibilité auprès du fournisseur ou de l’autorité compétente.",
            "Hali ya kupanga iliyoingizwa na mtumiaji tu. Thibitisha masharti ya sasa ya mtoa huduma, viwango halisi, ada, kodi, kanuni za sheria na ustahiki na mtoa huduma au mamlaka husika."
        ],
        [
            "Contribution estimates are planning aids. Confirm current tiers, ceilings, eligibility, employer treatment and remittance rules with the named national scheme.",
            "Les estimations de cotisations sont des aides à la planification. Confirmez les tranches actuelles, plafonds, éligibilité, traitement de l’employeur et règles de reversement auprès du régime national nommé.",
            "Makadirio ya michango ni msaada wa kupanga. Thibitisha makundi ya sasa, mipaka, ustahiki, namna ya mwajiri na kanuni za kuwasilisha malipo na mpango wa kitaifa uliotajwa."
        ],
        [
            "Use this as a planning estimate and verify high-stakes decisions with the relevant source.",
            "Utilisez ceci comme une estimation de planification et vérifiez les décisions importantes auprès de la source compétente.",
            "Tumia haya kama makadirio ya kupanga na hakiki maamuzi yenye athari kubwa na chanzo husika."
        ],
        [
            "This result combines multiple sources. Treat it as a planning estimate and verify high-stakes decisions with the relevant source.",
            "Ce résultat combine plusieurs sources. Traitez-le comme une estimation de planification et vérifiez les décisions importantes auprès de la source compétente.",
            "Matokeo haya yanajumuisha vyanzo kadhaa. Yachukulie kama makadirio ya kupanga na hakiki maamuzi yenye athari kubwa na chanzo husika."
        ]
    ];

    var n = [ "official", "regulator", "central_bank", "university", "foundation", "reviewed_dataset", "third_party_snapshot", "user_input", "estimate" ], r = [ "tax", "fuel", "fx", "import_duty", "scholarships", "education", "salary", "business", "energy", "country_profile", "documents", "other" ], t = [ "fresh", "acceptable", "stale", "unknown", "unavailable" ], o = [ "official_verified", "reviewed", "estimated", "low_confidence", "user_entered" ], c = {
        official_verified: "Official verified",
        reviewed: "Reviewed",
        estimated: "Estimated",
        low_confidence: "Low confidence",
        user_entered: "User entered"
    }, a = {
        fresh: "Fresh",
        acceptable: "Acceptable",
        stale: "Stale",
        unknown: "Freshness unknown",
        unavailable: "Unavailable"
    }, i = {
        official: "Official source",
        regulator: "Regulator source",
        central_bank: "Central bank source",
        university: "University source",
        foundation: "Foundation source",
        reviewed_dataset: "Reviewed dataset",
        third_party_snapshot: "Snapshot",
        user_input: "User input",
        estimate: "Estimate"
    }, s = {
        fresh: 0,
        acceptable: 1,
        unknown: 2,
        stale: 3,
        unavailable: 4
    }, u = {
        official_verified: 0,
        reviewed: 1,
        user_entered: 2,
        estimated: 3,
        low_confidence: 4
    }, d = null;
    var UI_COPY = {
        fr: {
            "Official verified": "Source officielle vérifiée", "Reviewed": "Révisé", "Estimated": "Estimé", "Low confidence": "Confiance limitée", "User entered": "Saisi par l’utilisateur",
            "Fresh": "À jour", "Acceptable": "Acceptable", "Stale": "Ancien", "Freshness unknown": "Actualité inconnue", "Unavailable": "Indisponible",
            "Official source": "Source officielle", "Regulator source": "Source du régulateur", "Central bank source": "Source de la banque centrale", "University source": "Source universitaire", "Foundation source": "Source de la fondation", "Reviewed dataset": "Données révisées", "Snapshot": "Instantané", "User input": "Saisie de l’utilisateur", "Estimate": "Estimation",
            "Reviewed source": "Source révisée", "Estimate basis": "Base de l’estimation", "User-entered data": "Données saisies par l’utilisateur", "Unknown source": "Source inconnue", "Mixed sources": "Sources multiples",
            "Source note in English": "Note de source en anglais", "Source freshness is limited for ": "L’actualité de la source est limitée pour ", ". Verify before making a high-stakes decision.": ". Vérifiez avant de prendre une décision importante."
        },
        sw: {
            "Official verified": "Chanzo rasmi kilichohakikiwa", "Reviewed": "Imekaguliwa", "Estimated": "Imekadiriwa", "Low confidence": "Uhakika mdogo", "User entered": "Imeingizwa na mtumiaji",
            "Fresh": "Ya karibuni", "Acceptable": "Inakubalika", "Stale": "Ya zamani", "Freshness unknown": "Umri wa data haujulikani", "Unavailable": "Haipatikani",
            "Official source": "Chanzo rasmi", "Regulator source": "Chanzo cha mdhibiti", "Central bank source": "Chanzo cha benki kuu", "University source": "Chanzo cha chuo kikuu", "Foundation source": "Chanzo cha taasisi", "Reviewed dataset": "Data zilizokaguliwa", "Snapshot": "Rekodi ya muda", "User input": "Maingizo ya mtumiaji", "Estimate": "Makadirio",
            "Reviewed source": "Chanzo kilichokaguliwa", "Estimate basis": "Msingi wa makadirio", "User-entered data": "Data zilizoingizwa na mtumiaji", "Unknown source": "Chanzo kisichojulikana", "Mixed sources": "Vyanzo mchanganyiko",
            "Source note in English": "Maelezo ya chanzo kwa Kiingereza", "Source freshness is limited for ": "Ukaribuni wa chanzo una mipaka kwa ", ". Verify before making a high-stakes decision.": ". Hakiki kabla ya kufanya uamuzi wenye athari kubwa."
        }
    };
    function localeFor(locale) {
        var language = locale || (e && e.document && e.document.documentElement && e.document.documentElement.getAttribute("lang")) || "en";
        language = String(language).toLowerCase().split(/[-_]/)[0];
        return language === "fr" || language === "sw" ? language : "en";
    }
    function uiText(text, locale) {
        var copy = UI_COPY[localeFor(locale)];
        return copy && Object.prototype.hasOwnProperty.call(copy, text) ? copy[text] : text;
    }
    function localizeDisclaimer(text, locale) {
        var language = localeFor(locale);
        text = String(text || "");
        if (language === "en") return { text: text, language: "en", state: "original" };
        var row = SOURCE_COPY.find(function(row) { return row[0] === text; });
        return row ? { text: row[language === "fr" ? 1 : 2], language: language, state: "translated" } : { text: text, language: "en", state: "untranslated" };
    }
    function l(e) {
        return Array.isArray(e) ? e.filter(Boolean) : null == e || "" === e ? [] : [ e ];
    }
    function f(e, n, r) {
        return function(e, n) {
            return -1 !== e.indexOf(n);
        }(n, e) ? e : r;
    }
    function p(e) {
        if (!e) return null;
        if (e instanceof Date && !Number.isNaN(e.getTime())) return e.toISOString().slice(0, 10);
        var n = String(e).trim();
        if (!n) return null;
        var r = g(n);
        return r ? n.length >= 10 ? n.slice(0, 10) : r.toISOString().slice(0, 10) : null;
    }
    function g(e) {
        if (!e) return null;
        if (e instanceof Date && !Number.isNaN(e.getTime())) return e;
        var n = String(e).trim(), r = n.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (r) return new Date(Date.UTC(Number(r[1]), Number(r[2]) - 1, Number(r[3])));
        var t = new Date(n);
        return Number.isNaN(t.getTime()) ? null : new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
    }
    function m(e) {
        var c = e && "object" == typeof e ? e : {}, a = l(c.countryCodes).map(function(e) {
            return String(e).toUpperCase();
        }), i = l(c.appliesTo).map(function(e) {
            return f(e, r, "other");
        });
        return {
            id: String(c.id || "unknown-source"),
            sourceName: String(c.sourceName || "Unknown source"),
            sourceUrl: c.sourceUrl ? String(c.sourceUrl) : "",
            sourceType: f(c.sourceType, n, "estimate"),
            countryCodes: a.length ? a : [ "ALL" ],
            appliesTo: i.length ? i : [ "other" ],
            effectiveFrom: p(c.effectiveFrom),
            effectiveTo: p(c.effectiveTo),
            lastCheckedAt: p(c.lastCheckedAt),
            lastReviewedAt: p(c.lastReviewedAt),
            freshnessStatus: f(c.freshnessStatus, t, "unknown"),
            confidence: f(c.confidence, o, "low_confidence"),
            reviewCadenceDays: Number(c.reviewCadenceDays) > 0 ? Number(c.reviewCadenceDays) : null,
            notes: c.notes ? String(c.notes) : "",
            displayDisclaimer: c.displayDisclaimer ? String(c.displayDisclaimer) : ""
        };
    }
    function b(e, n) {
        var r = m(e);
        if ("unavailable" === r.freshnessStatus) return "unavailable";
        var t = function(e) {
            return g(e.lastCheckedAt || e.lastReviewedAt || e.effectiveFrom);
        }(r);
        if (!t) return r.freshnessStatus || "unknown";
        var o = g(n) || new Date, c = new Date(Date.UTC(o.getUTCFullYear(), o.getUTCMonth(), o.getUTCDate())), a = Math.max(0, Math.floor((c.getTime() - t.getTime()) / 864e5)), i = r.reviewCadenceDays || 90;
        return a <= i ? "fresh" : a <= 2 * i ? "acceptable" : "stale";
    }
    function h(e, locale) {
        var n = m(e);
        return uiText(c[n.confidence] || c.low_confidence, locale);
    }
    function v(e, n, locale) {
        var r = m(e), t = b(r, n), o = i[r.sourceType] || i.estimate, c = "neutral";
        return "official_verified" === r.confidence ? (o = "Official verified", c = "official") : "reviewed" === r.confidence ? (o = "Reviewed source",
        c = "reviewed") : "estimated" === r.confidence || "estimate" === r.sourceType || "third_party_snapshot" === r.sourceType ? (o = "third_party_snapshot" === r.sourceType ? "Snapshot" : "Estimate basis",
        c = "estimate") : "user_entered" !== r.confidence && "user_input" !== r.sourceType || (o = "User-entered data",
        c = "user"), "low_confidence" !== r.confidence && "stale" !== t && "unknown" !== t || (c = "warn"),
        "unavailable" === t && (c = "unavailable"), {
            label: uiText(o, locale),
            tone: c,
            title: r.sourceName,
            sourceName: r.sourceName,
            sourceUrl: r.sourceUrl,
            freshnessStatus: t,
            confidence: r.confidence
        };
    }
    function w(e, n) {
        var r = m(e), t = b(r, n);
        return "stale" === t || "unknown" === t || "unavailable" === t || "low_confidence" === r.confidence;
    }
    function y(e) {
        var n = Object.create(null);
        return e.filter(function(e) {
            return !(!e || n[e] || (n[e] = !0, 0));
        });
    }
    function S(e, n) {
        return e.reduce(function(e, r) {
            return e ? (n[r] || 0) > (n[e] || 0) ? r : e : r;
        }, "");
    }
    function T(e) {
        return String(null == e ? "" : e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function _(e, n, locale) {
        var r = v(e, n, locale), t = "source-confidence-badge source-confidence-badge--" + T(r.tone);
        return r.sourceUrl ? '<a class="' + t + '" href="' + T(r.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + T(r.label) + "</a>" : '<span class="' + t + '">' + T(r.label) + "</span>";
    }
    function k(e, n, locale) {
        var r = b(e, n);
        return '<span class="source-confidence-badge source-confidence-badge--freshness-' + T(r) + '">' + T(uiText(a[r] || a.unknown, locale)) + "</span>";
    }
    function C(e, locale) {
        var n = m(e), r = h(n, locale), t = n.displayDisclaimer || n.notes || "Use this as a planning estimate and verify high-stakes decisions with the relevant source.";
        var copy = localizeDisclaimer(t, locale);
        if (localeFor(locale) === "en") return '<p class="source-confidence-notice"><strong>' + T(r) + ":</strong> " + T(copy.text) + "</p>";
        var fallback = copy.state === "untranslated" ? '<span class="source-confidence-copy-fallback">' + T(uiText("Source note in English", locale)) + ": </span>" : "";
        return '<p class="source-confidence-notice" data-source-copy-state="' + copy.state + '"><strong>' + T(r) + ":</strong> " + fallback + '<span lang="' + copy.language + '">' + T(copy.text) + "</span></p>";
    }
    function x(e, n, locale) {
        return w(e, n) ? '<p class="source-confidence-warning" role="note">' + T(uiText("Source freshness is limited for ", locale)) + T(uiText(m(e).sourceName, locale)) + T(uiText(". Verify before making a high-stakes decision.", locale)) + "</p>" : "";
    }
    function D(e, n) {
        var r = m(e), locale = n && n.locale;
        return '<div class="source-confidence-card' + (n && n.compact ? " source-confidence-card--compact" : "") + '"><div class="source-confidence-badges">' + _(r, undefined, locale) + k(r, undefined, locale) + '<span class="source-confidence-badge source-confidence-badge--confidence">' + T(h(r, locale)) + '</span></div><div class="source-confidence-title">' + T(uiText(r.sourceName, locale)) + "</div>" + C(r, locale) + x(r, undefined, locale) + "</div>";
    }
    function N() {
        return d || (d = e && "function" == typeof e.fetch ? e.fetch("/data/source-registry.json", {
            credentials: "same-origin"
        }).then(function(e) {
            if (!e.ok) throw new Error("source registry unavailable");
            return e.json();
        }).catch(function() {
            return {
                sources: []
            };
        }) : Promise.resolve({
            sources: []
        }));
    }
    function U(e, n) {
        var r = {
            id: e || "unknown-source",
            sourceName: "Unknown source",
            sourceType: "estimate",
            countryCodes: [ "ALL" ],
            appliesTo: [ "other" ],
            lastCheckedAt: null,
            lastReviewedAt: null,
            freshnessStatus: "unknown",
            confidence: "low_confidence",
            notes: "No source metadata has been added yet.",
            displayDisclaimer: "Source confidence is unavailable. Treat this output as a planning estimate until metadata is reviewed."
        };
        return m((n && Array.isArray(n.sources) ? n.sources : []).find(function(n) {
            return n && n.id === e;
        }) || r);
    }
    function A(n, r) {
        var t = n && n.ownerDocument ? n.ownerDocument : e && e.document;
        if (!t || !t.querySelectorAll) return Promise.resolve([]);
        !function(e) {
            if (e && !e.getElementById("source-confidence-styles")) {
                var n = e.createElement("style");
                n.id = "source-confidence-styles", n.textContent = [ ".source-confidence-card{border:1px solid #dbeafe;border-radius:12px;background:#f8fbff;color:#334155;padding:12px;margin:12px 0;line-height:1.5}", ".source-confidence-card--compact{padding:10px;margin:10px 0}", ".source-confidence-badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:7px}", ".source-confidence-badge{display:inline-flex;align-items:center;min-height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#334155;padding:3px 8px;font-size:.69rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;text-decoration:none}", ".source-confidence-badge--official{border-color:#86efac;background:#f0fdf4;color:#166534}", ".source-confidence-badge--reviewed{border-color:#93c5fd;background:#eff6ff;color:#1d4ed8}", ".source-confidence-badge--estimate,.source-confidence-badge--freshness-acceptable{border-color:#fcd34d;background:#fffbeb;color:#92400e}", ".source-confidence-badge--user{border-color:#c4b5fd;background:#f5f3ff;color:#5b21b6}", ".source-confidence-badge--warn,.source-confidence-badge--freshness-stale,.source-confidence-badge--freshness-unknown{border-color:#fdba74;background:#fff7ed;color:#9a3412}", ".source-confidence-badge--unavailable,.source-confidence-badge--freshness-unavailable{border-color:#fecaca;background:#fef2f2;color:#991b1b}", ".source-confidence-badge--freshness-fresh{border-color:#86efac;background:#f0fdf4;color:#166534}", ".source-confidence-badge--confidence{border-color:#bae6fd;background:#f0f9ff;color:#075985}", ".source-confidence-title{font-weight:900;color:#0f172a;font-size:.86rem;margin-bottom:3px}", ".source-confidence-notice,.source-confidence-warning{margin:0;color:#475569;font-size:.78rem}", ".source-confidence-warning{margin-top:6px;color:#9a3412}" ].join(""),
                e.head.appendChild(n);
                n.textContent += ".source-confidence-card{min-width:0;overflow-wrap:anywhere}.source-confidence-badges a{min-height:44px;max-width:100%}.source-confidence-badges a:focus-visible{outline:2px solid #0062cc;outline-offset:2px}";
            }
        }(t);
        var o = Array.prototype.slice.call((n || t).querySelectorAll("[data-source-meta-id]"));
        return o.length ? Promise.resolve(r || N()).then(function(e) {
            return o.forEach(function(n) {
                var r = n.getAttribute("data-source-meta-id"), t = "true" === n.getAttribute("data-source-meta-compact");
                n.innerHTML = D(U(r, e), {
                    compact: t,
                    locale: n.ownerDocument.documentElement.getAttribute("lang")
                });
            }), o;
        }) : Promise.resolve([]);
    }
    return e && e.document && ("loading" === e.document.readyState ? e.document.addEventListener("DOMContentLoaded", function() {
        A(e.document);
    }) : A(e.document)), {
        SOURCE_TYPES: n,
        APPLIES_TO: r,
        FRESHNESS_STATUSES: t,
        CONFIDENCE_LEVELS: o,
        normalizeSourceMeta: m,
        calculateFreshnessStatus: b,
        getConfidenceLabel: h,
        localizeDisclaimer: localizeDisclaimer,
        getSourceBadgeProps: v,
        shouldShowStaleWarning: w,
        mergeSourceMetaForResult: function(e, n) {
            var r = l(e).map(m);
            if (!r.length) return m({});
            if (1 === r.length) return r[0];
            var t = r.map(function(e) {
                return e.displayDisclaimer;
            }).filter(Boolean).sort(function(e, n) {
                return n.length - e.length;
            });
            return m({
                id: "merged-source-result",
                sourceName: "Mixed sources",
                sourceType: r.some(function(e) {
                    return "user_input" === e.sourceType;
                }) ? "user_input" : "reviewed_dataset",
                countryCodes: y([].concat.apply([], r.map(function(e) {
                    return e.countryCodes;
                }))),
                appliesTo: y([].concat.apply([], r.map(function(e) {
                    return e.appliesTo;
                }))),
                lastCheckedAt: null,
                lastReviewedAt: null,
                freshnessStatus: S(r.map(function(e) {
                    return b(e, n);
                }), s) || "unknown",
                confidence: S(r.map(function(e) {
                    return e.confidence;
                }), u) || "low_confidence",
                notes: r.map(function(e) {
                    return e.notes;
                }).filter(Boolean).join(" "),
                displayDisclaimer: t[0] || "This result combines multiple sources. Treat it as a planning estimate and verify high-stakes decisions with the relevant source."
            });
        },
        SourceBadge: _,
        FreshnessBadge: k,
        ConfidenceNotice: C,
        StaleDataWarning: x,
        renderSourceSummary: D,
        loadRegistry: N,
        getSourceMetaById: U,
        hydrate: A
    };
});
