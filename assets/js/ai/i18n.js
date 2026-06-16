/**
 * Deterministic UI translations for Ask AfroTools AI.
 *
 * This intentionally localizes labels, examples, warnings, and router copy only.
 * It does not translate model-generated text or alter routing decisions.
 */
(function initAfroToolsAII18n(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAII18n = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createAfroToolsAII18n() {
  "use strict";

  var DEFAULT_LOCALE = "en";
  var SUPPORTED_LOCALES = ["en", "fr", "pt", "ar", "sw"];
  var RTL_LOCALES = { ar: true };
  var LOCALE_ALIASES = {
    english: "en",
    "en-us": "en",
    "en-gb": "en",
    french: "fr",
    francais: "fr",
    "fr-fr": "fr",
    portuguese: "pt",
    portugues: "pt",
    "pt-br": "pt",
    "pt-pt": "pt",
    arabic: "ar",
    kiswahili: "sw",
    swahili: "sw",
    "sw-ke": "sw",
    "sw-tz": "sw",
  };

  var TRANSLATIONS = {
    en: {
      homeHero: {
        kicker: "Ask AfroTools AI",
        title: "AfroTools AI - Africa's Practical AI Hub",
        subtitle: "Calculate, compare, write, plan, and make decisions with local African tools.",
        label: "Ask AfroTools AI",
        placeholder: "What do you want to calculate, compare, write, or plan?",
        submit: "Ask AfroTools AI",
        browseAll: "Browse all tools",
        trust: "AfroTools routes your request to practical tools. Some workflows run in your browser. AI-assisted workflows ask before sending private content.",
      },
      page: {
        title: "Ask AfroTools AI",
        copy: "Route a practical African task into the right AfroTools calculator, planner, document workflow, source-aware estimate, or export. The AI layer helps choose and prefill tools; it does not replace the underlying workflows.",
        inputLabel: "What do you want to calculate, compare, write, or plan?",
        inputPlaceholder: "What do you want to calculate, compare, write, or plan?",
        submit: "Find workflow",
        trust: "Some AfroTools workflows run in your browser. AI-assisted workflows ask before sending private content. This page may send your prompt to the AfroTools routing endpoint to choose a workflow, but it does not require login and does not store raw queries in analytics.",
        browseCommon: "Browse common workflows",
      },
      states: {
        emptyTitle: "Start with a practical task.",
        emptyBody: "Try a question about CVs, scholarships, import duty, solar, PAYE, invoices, PDFs, fuel, or floor planning.",
        loadingTitle: "Finding the best workflow",
        loadingBody: "Checking AfroTools routing first, with deterministic fallback ready.",
        errorTitle: "Router unavailable",
        errorBody: "Using deterministic routing instead.",
        noMatchTitle: "No clear workflow match yet",
        noMatchBody: "Add a country, amount, document type, destination, or sector, or continue browsing the tool directory.",
      },
      consent: {
        title: "Optional AI assist",
        body: "AfroTools can retry routing with a model provider only after you consent. Avoid adding CVs, PDFs, financial records, profile data, or personal identifiers unless a workflow explicitly asks and you choose to continue.",
        checkbox: "I understand this may send my current prompt to AfroTools servers and a configured model provider for routing help.",
        retry: "Retry with AI assist",
        continue: "Continue browsing",
      },
      projects: {
        title: "Recent AI projects",
        body: "Saved on this device by default. Account sync is optional and uses sanitized project summaries only.",
        refresh: "Refresh",
      },
      result: {
        inputsDetected: "Inputs already detected",
        missingInputs: "Missing required inputs",
        privacyConfidence: "Privacy and confidence",
        openTool: "Open tool",
        continueBrowsing: "Continue browsing",
        saveProject: "Save project",
        syncSummary: "Sync sanitized summary",
        syncTitle: "Sync sanitized project summary only",
        confidenceMatch: "% match",
        browse: "Browse",
        noInputs: "No inputs detected yet.",
        noMissing: "No required inputs missing.",
        addDetailsTitle: "Add details before opening",
        addDetailsBody: "AfroTools found the workflow. Add up to three practical details now, or skip and fill them inside the tool.",
        updatePrefill: "Update prefill",
        skipOpen: "Skip and open tool",
        browseInstead: "Browse instead",
        keptLocal: "kept in this browser session",
        choose: "Choose",
      },
      router: {
        matched: "Matched obvious AfroTools workflow keywords.",
        fallback: "No strong workflow match; falling back to AfroTools search.",
        validated: "Matched against AfroTools tool registry.",
        openWorkflow: "Open the recommended AfroTools workflow",
        answerClarification: "Answer the clarification question",
        usePrefill: "Use extracted fields as prefill candidates after user review",
        searchIfWrong: "Search AfroTools if the match is not right",
      },
      privacyNotices: {
        generic: "Core routing can run without model consent.",
        sensitive: "Do not add private CV, financial, document, or identity details unless a workflow asks and you choose to continue.",
        sourceConfidence: "Source, freshness, and confidence warnings appear where rates, rules, prices, deadlines, or external data can change.",
        modelConsent: "Optional AI text help should ask before sending sensitive details.",
      },
      clarification: {
        country: "Which country should AfroTools use for this workflow?",
        destinationCountry: "Which destination country should AfroTools calculate for?",
        targetCountry: "Which destination country are you considering?",
        grossPay: "What gross pay amount should be used for the PAYE estimate?",
        itemValue: "What item or vehicle value should AfroTools use for the import estimate?",
        itemCategory: "What item or vehicle are you importing?",
        studyLevel: "What study level are you targeting?",
        monthlyBill: "What is the current monthly power bill or generator fuel spend?",
        default: "Can you add the missing detail so AfroTools can prepare the workflow?",
      },
      fields: {
        country: "Country",
        destinationCountry: "Destination country",
        targetCountry: "Destination country",
        grossPay: "Gross pay",
        itemValue: "Item value",
        itemCategory: "Vehicle or item",
        productCategory: "Product category",
        studyLevel: "Study level",
        monthlyBill: "Monthly electricity bill",
        targetRole: "Target role",
        languagePreference: "Language preference",
        currency: "Currency",
        budget: "Available budget",
        budgetAmount: "Budget range",
        invoiceAmount: "Invoice amount",
        vatTreatment: "VAT treatment",
        businessType: "Business type",
        pdfAction: "PDF action",
      },
      categories: {
        education: "Education",
        studyAbroad: "Study abroad",
        scholarships: "Scholarships",
        career: "Career",
        cvJobs: "CV and jobs",
        employment: "Career",
        business: "Business",
        businessTax: "Business tax",
        finance: "Business and finance",
        tax: "Tax",
        salaryTax: "Salary and tax",
        trade: "Trade",
        importDuty: "Import duty",
        energy: "Energy",
        solarEnergy: "Solar and energy",
        fuelEnergy: "Fuel and generators",
        localLife: "Local life",
        construction: "Construction",
        documents: "Documents",
        search: "Search",
        immigration: "Immigration",
        legal: "Legal",
        health: "Health",
        none: "General",
      },
      examples: {
        education: "I want to study in Canada from Nigeria with a budget of $8,000.",
        career: "Write me a CV for an electrical engineer in Ghana.",
        business: "Help me calculate payroll for 5 employees in Kenya.",
        trade: "How much duty will I pay to import a 2016 Toyota Axio into Nigeria?",
        energy: "Should I install solar for my shop in Lagos?",
        localLife: "Can I live in Nairobi on a budget of $1,200 per month?",
      },
      highStakes: {
        tax: "Planning estimate only. Confirm tax, PAYE, VAT, filing, and compliance decisions with official revenue authority guidance or a qualified professional.",
        immigration: "Planning estimate only. Confirm visa, immigration, and relocation decisions with official government sources or a qualified adviser.",
        legal: "Planning estimate only. This is not legal advice; confirm with official sources or a qualified legal professional.",
        health: "Informational only. Do not use this as medical advice; consult a qualified health professional.",
        finance: "Planning estimate only. Confirm financial, customs, lending, and business decisions with official sources or a qualified professional.",
        employment: "Planning support only. Review employment, hiring, salary, and application decisions with qualified local guidance where needed.",
        education: "Planning estimate only. Confirm eligibility, fees, deadlines, and admissions details with official school or scholarship sources.",
        energy: "Planning estimate only. Confirm tariffs, fuel prices, installation sizing, and safety requirements with current local suppliers or qualified installers.",
        none: "",
      },
    },
    fr: {
      homeHero: {
        kicker: "Demander à AfroTools AI",
        title: "AfroTools AI - le hub pratique de l'Afrique",
        subtitle: "Calculez, comparez, rédigez, planifiez et décidez avec des outils africains locaux.",
        label: "Demander à AfroTools AI",
        placeholder: "Que voulez-vous calculer, comparer, rédiger ou planifier ?",
        submit: "Demander à AfroTools AI",
        browseAll: "Parcourir tous les outils",
        trust: "AfroTools dirige votre demande vers des outils pratiques. Certains workflows fonctionnent dans votre navigateur. Les workflows avec IA demandent avant d'envoyer du contenu privé.",
      },
      page: {
        title: "Demander à AfroTools AI",
        copy: "Dirigez une tâche africaine pratique vers le bon calculateur, planificateur, workflow documentaire, estimation avec sources ou export AfroTools. L'IA aide à choisir et préremplir les outils ; elle ne remplace pas les workflows.",
        inputLabel: "Que voulez-vous calculer, comparer, rédiger ou planifier ?",
        inputPlaceholder: "Que voulez-vous calculer, comparer, rédiger ou planifier ?",
        submit: "Trouver le workflow",
        trust: "Certains workflows AfroTools fonctionnent dans votre navigateur. Les workflows avec IA demandent avant d'envoyer du contenu privé. Cette page peut envoyer votre prompt au routeur AfroTools pour choisir un workflow, sans connexion ni stockage de requêtes brutes dans l'analytics.",
        browseCommon: "Parcourir les workflows courants",
      },
      states: {
        emptyTitle: "Commencez par une tâche pratique.",
        emptyBody: "Essayez une question sur les CV, bourses, droits d'importation, solaire, PAYE, factures, PDF, carburant ou plans de maison.",
        loadingTitle: "Recherche du meilleur workflow",
        loadingBody: "Vérification du routage AfroTools d'abord, avec secours déterministe prêt.",
        errorTitle: "Routeur indisponible",
        errorBody: "Routage déterministe utilisé à la place.",
        noMatchTitle: "Aucun workflow clair pour le moment",
        noMatchBody: "Ajoutez un pays, un montant, un type de document, une destination ou un secteur, ou parcourez le répertoire d'outils.",
      },
      consent: {
        title: "Assistance IA facultative",
        body: "AfroTools peut réessayer avec un fournisseur de modèle seulement après votre consentement. Évitez d'ajouter CV, PDF, dossiers financiers, données de profil ou identifiants personnels sauf si un workflow le demande explicitement.",
        checkbox: "Je comprends que mon prompt actuel peut être envoyé aux serveurs AfroTools et à un fournisseur de modèle configuré pour aider au routage.",
        retry: "Réessayer avec l'IA",
        continue: "Continuer à parcourir",
      },
      projects: {
        title: "Projets IA récents",
        body: "Enregistrés sur cet appareil par défaut. La synchronisation de compte est facultative et utilise seulement des résumés assainis.",
        refresh: "Actualiser",
      },
      result: {
        inputsDetected: "Infos déjà détectées",
        missingInputs: "Infos requises manquantes",
        privacyConfidence: "Confidentialité et confiance",
        openTool: "Ouvrir l'outil",
        continueBrowsing: "Continuer à parcourir",
        saveProject: "Enregistrer le projet",
        syncSummary: "Synchroniser le résumé assaini",
        syncTitle: "Synchroniser seulement le résumé assaini du projet",
        confidenceMatch: "% de correspondance",
        browse: "Parcourir",
        noInputs: "Aucune info détectée pour le moment.",
        noMissing: "Aucune info requise manquante.",
        addDetailsTitle: "Ajouter des détails avant d'ouvrir",
        addDetailsBody: "AfroTools a trouvé le workflow. Ajoutez jusqu'à trois détails pratiques maintenant, ou ignorez et complétez dans l'outil.",
        updatePrefill: "Mettre à jour le préremplissage",
        skipOpen: "Ignorer et ouvrir l'outil",
        browseInstead: "Parcourir à la place",
        keptLocal: "conservé dans cette session navigateur",
        choose: "Choisir",
      },
      router: {
        matched: "Mots-clés évidents associés à un workflow AfroTools.",
        fallback: "Aucune correspondance forte ; bascule vers la recherche AfroTools.",
        validated: "Associé au registre d'outils AfroTools.",
        openWorkflow: "Ouvrir le workflow AfroTools recommandé",
        answerClarification: "Répondre à la question de clarification",
        usePrefill: "Utiliser les champs détectés comme préremplissage après votre vérification",
        searchIfWrong: "Rechercher dans AfroTools si la correspondance n'est pas correcte",
      },
      privacyNotices: {
        generic: "Le routage de base peut fonctionner sans consentement modèle.",
        sensitive: "N'ajoutez pas de données privées de CV, finance, document ou identité sauf si un workflow le demande et que vous choisissez de continuer.",
        sourceConfidence: "Les avertissements de source, fraîcheur et confiance apparaissent quand les taux, règles, prix, échéances ou données externes peuvent changer.",
        modelConsent: "L'aide IA facultative doit demander avant d'envoyer des détails sensibles.",
      },
      clarification: {
        country: "Quel pays AfroTools doit-il utiliser pour ce workflow ?",
        destinationCountry: "Pour quel pays de destination AfroTools doit-il calculer ?",
        targetCountry: "Quel pays de destination envisagez-vous ?",
        grossPay: "Quel salaire brut faut-il utiliser pour l'estimation PAYE ?",
        itemValue: "Quelle valeur d'article ou de véhicule AfroTools doit-il utiliser ?",
        itemCategory: "Quel article ou véhicule importez-vous ?",
        studyLevel: "Quel niveau d'études visez-vous ?",
        monthlyBill: "Quelle est votre facture d'électricité ou dépense carburant mensuelle actuelle ?",
        default: "Pouvez-vous ajouter le détail manquant pour préparer le workflow ?",
      },
      fields: {
        country: "Pays",
        destinationCountry: "Pays de destination",
        targetCountry: "Pays de destination",
        grossPay: "Salaire brut",
        itemValue: "Valeur de l'article",
        itemCategory: "Véhicule ou article",
        productCategory: "Catégorie de produit",
        studyLevel: "Niveau d'études",
        monthlyBill: "Facture électrique mensuelle",
        targetRole: "Poste visé",
        languagePreference: "Langue préférée",
        currency: "Devise",
        budget: "Budget disponible",
        budgetAmount: "Fourchette de budget",
        invoiceAmount: "Montant de la facture",
        vatTreatment: "Traitement TVA",
        businessType: "Type d'entreprise",
        pdfAction: "Action PDF",
      },
      categories: {
        education: "Éducation",
        studyAbroad: "Études à l'étranger",
        scholarships: "Bourses",
        career: "Carrière",
        cvJobs: "CV et emplois",
        employment: "Carrière",
        business: "Entreprise",
        businessTax: "Fiscalité d'entreprise",
        finance: "Entreprise et finance",
        tax: "Fiscalité",
        salaryTax: "Salaire et fiscalité",
        trade: "Commerce",
        importDuty: "Droits d'importation",
        energy: "Énergie",
        solarEnergy: "Solaire et énergie",
        fuelEnergy: "Carburant et générateurs",
        localLife: "Vie locale",
        construction: "Construction",
        documents: "Documents",
        search: "Recherche",
        immigration: "Immigration",
        legal: "Juridique",
        health: "Santé",
        none: "Général",
      },
      examples: {
        education: "Je veux étudier au Canada depuis le Nigeria avec un budget de 8 000 $.",
        career: "Rédigez un CV pour un ingénieur électricien au Ghana.",
        business: "Aidez-moi à calculer la paie de 5 employés au Kenya.",
        trade: "Combien de droits paierai-je pour importer une Toyota Axio 2016 au Nigeria ?",
        energy: "Devrais-je installer du solaire pour ma boutique à Lagos ?",
        localLife: "Puis-je vivre à Nairobi avec un budget de 1 200 $ par mois ?",
      },
      highStakes: {
        tax: "Estimation de planification uniquement. Confirmez les décisions fiscales, PAYE, TVA, déclarations et conformité auprès de l'administration fiscale ou d'un professionnel qualifié.",
        immigration: "Estimation de planification uniquement. Confirmez visa, immigration et relocalisation avec des sources gouvernementales officielles ou un conseiller qualifié.",
        legal: "Estimation de planification uniquement. Ceci n'est pas un avis juridique ; confirmez auprès de sources officielles ou d'un professionnel qualifié.",
        health: "Information uniquement. Ne l'utilisez pas comme avis médical ; consultez un professionnel de santé qualifié.",
        finance: "Estimation de planification uniquement. Confirmez les décisions financières, douanières, de crédit et d'affaires auprès de sources officielles ou d'un professionnel qualifié.",
        employment: "Aide à la planification uniquement. Vérifiez les décisions d'emploi, recrutement, salaire et candidature avec des conseils locaux qualifiés si nécessaire.",
        education: "Estimation de planification uniquement. Confirmez admissibilité, frais, échéances et admissions auprès des écoles ou sources de bourses officielles.",
        energy: "Estimation de planification uniquement. Confirmez tarifs, prix du carburant, dimensionnement et sécurité auprès de fournisseurs locaux ou installateurs qualifiés.",
        none: "",
      },
    },
    pt: {
      homeHero: {
        kicker: "Pergunte ao AfroTools AI",
        title: "AfroTools AI - o hub prático de África",
        subtitle: "Calcule, compare, escreva, planeie e decida com ferramentas africanas locais.",
        label: "Pergunte ao AfroTools AI",
        placeholder: "O que pretende calcular, comparar, escrever ou planear?",
        submit: "Pergunte ao AfroTools AI",
        browseAll: "Ver todas as ferramentas",
        trust: "AfroTools encaminha o seu pedido para ferramentas práticas. Alguns fluxos funcionam no navegador. Fluxos com IA pedem consentimento antes de enviar conteúdo privado.",
      },
      page: {
        title: "Pergunte ao AfroTools AI",
        copy: "Encaminhe uma tarefa africana prática para o calculador, planeador, fluxo documental, estimativa com fontes ou exportação AfroTools correta. A IA ajuda a escolher e preencher ferramentas; não substitui os fluxos reais.",
        inputLabel: "O que pretende calcular, comparar, escrever ou planear?",
        inputPlaceholder: "O que pretende calcular, comparar, escrever ou planear?",
        submit: "Encontrar fluxo",
        trust: "Alguns fluxos AfroTools funcionam no navegador. Fluxos com IA pedem consentimento antes de enviar conteúdo privado. Esta página pode enviar o seu prompt ao endpoint de roteamento AfroTools para escolher um fluxo, mas não exige login nem guarda consultas brutas em analytics.",
        browseCommon: "Ver fluxos comuns",
      },
      states: {
        emptyTitle: "Comece com uma tarefa prática.",
        emptyBody: "Tente uma pergunta sobre CVs, bolsas, direitos de importação, solar, PAYE, faturas, PDFs, combustível ou plantas.",
        loadingTitle: "A encontrar o melhor fluxo",
        loadingBody: "A verificar primeiro o roteamento AfroTools, com fallback determinístico pronto.",
        errorTitle: "Router indisponível",
        errorBody: "A usar roteamento determinístico.",
        noMatchTitle: "Ainda não há fluxo claro",
        noMatchBody: "Adicione país, valor, tipo de documento, destino ou setor, ou continue no diretório de ferramentas.",
      },
      consent: {
        title: "Assistência IA opcional",
        body: "AfroTools só pode tentar novamente com um fornecedor de modelo depois do seu consentimento. Evite CVs, PDFs, registos financeiros, dados de perfil ou identificadores pessoais salvo se um fluxo pedir explicitamente.",
        checkbox: "Entendo que o meu prompt atual pode ser enviado aos servidores AfroTools e a um fornecedor de modelo configurado para ajudar no roteamento.",
        retry: "Tentar com IA",
        continue: "Continuar a navegar",
      },
      projects: {
        title: "Projetos IA recentes",
        body: "Guardados neste dispositivo por padrão. A sincronização de conta é opcional e usa apenas resumos sanitizados.",
        refresh: "Atualizar",
      },
      result: {
        inputsDetected: "Dados já detetados",
        missingInputs: "Dados obrigatórios em falta",
        privacyConfidence: "Privacidade e confiança",
        openTool: "Abrir ferramenta",
        continueBrowsing: "Continuar a navegar",
        saveProject: "Guardar projeto",
        syncSummary: "Sincronizar resumo sanitizado",
        syncTitle: "Sincronizar apenas o resumo sanitizado do projeto",
        confidenceMatch: "% de correspondência",
        browse: "Navegar",
        noInputs: "Ainda não há dados detetados.",
        noMissing: "Não faltam dados obrigatórios.",
        addDetailsTitle: "Adicionar detalhes antes de abrir",
        addDetailsBody: "AfroTools encontrou o fluxo. Adicione até três detalhes práticos agora, ou ignore e preencha dentro da ferramenta.",
        updatePrefill: "Atualizar preenchimento",
        skipOpen: "Ignorar e abrir ferramenta",
        browseInstead: "Navegar em vez disso",
        keptLocal: "mantido nesta sessão do navegador",
        choose: "Escolher",
      },
      router: {
        matched: "Palavras-chave claras associadas a um fluxo AfroTools.",
        fallback: "Sem correspondência forte; a usar a pesquisa AfroTools.",
        validated: "Correspondido com o registo de ferramentas AfroTools.",
        openWorkflow: "Abrir o fluxo AfroTools recomendado",
        answerClarification: "Responder à pergunta de clarificação",
        usePrefill: "Usar campos extraídos como candidatos a preenchimento após revisão",
        searchIfWrong: "Pesquisar no AfroTools se a correspondência não estiver certa",
      },
      privacyNotices: {
        generic: "O roteamento básico pode funcionar sem consentimento para modelo.",
        sensitive: "Não adicione dados privados de CV, finanças, documentos ou identidade salvo se um fluxo pedir e escolher continuar.",
        sourceConfidence: "Avisos de fonte, frescura e confiança aparecem onde taxas, regras, preços, prazos ou dados externos podem mudar.",
        modelConsent: "Ajuda opcional de IA deve pedir antes de enviar detalhes sensíveis.",
      },
      clarification: {
        country: "Que país deve o AfroTools usar para este fluxo?",
        destinationCountry: "Para que país de destino o AfroTools deve calcular?",
        targetCountry: "Que país de destino está a considerar?",
        grossPay: "Que valor de salário bruto deve ser usado para a estimativa PAYE?",
        itemValue: "Que valor do item ou veículo o AfroTools deve usar?",
        itemCategory: "Que item ou veículo está a importar?",
        studyLevel: "Que nível de estudo pretende?",
        monthlyBill: "Qual é a conta mensal de energia ou gasto atual com combustível do gerador?",
        default: "Pode adicionar o detalhe em falta para o AfroTools preparar o fluxo?",
      },
      fields: {
        country: "País",
        destinationCountry: "País de destino",
        targetCountry: "País de destino",
        grossPay: "Salário bruto",
        itemValue: "Valor do item",
        itemCategory: "Veículo ou item",
        productCategory: "Categoria do produto",
        studyLevel: "Nível de estudo",
        monthlyBill: "Conta mensal de eletricidade",
        targetRole: "Função alvo",
        languagePreference: "Preferência de idioma",
        currency: "Moeda",
        budget: "Orçamento disponível",
        budgetAmount: "Faixa de orçamento",
        invoiceAmount: "Valor da fatura",
        vatTreatment: "Tratamento de IVA",
        businessType: "Tipo de negócio",
        pdfAction: "Ação PDF",
      },
      categories: {
        education: "Educação",
        studyAbroad: "Estudar no estrangeiro",
        scholarships: "Bolsas",
        career: "Carreira",
        cvJobs: "CV e empregos",
        employment: "Carreira",
        business: "Negócios",
        businessTax: "Impostos empresariais",
        finance: "Negócios e finanças",
        tax: "Impostos",
        salaryTax: "Salário e impostos",
        trade: "Comércio",
        importDuty: "Direitos de importação",
        energy: "Energia",
        solarEnergy: "Solar e energia",
        fuelEnergy: "Combustível e geradores",
        localLife: "Vida local",
        construction: "Construção",
        documents: "Documentos",
        search: "Pesquisa",
        immigration: "Imigração",
        legal: "Jurídico",
        health: "Saúde",
        none: "Geral",
      },
      examples: {
        education: "Quero estudar no Canadá a partir da Nigéria com orçamento de 8.000 USD.",
        career: "Escreva um CV para um engenheiro eletricista no Gana.",
        business: "Ajude-me a calcular a folha de pagamento de 5 empregados no Quénia.",
        trade: "Quanto de imposto pagarei para importar um Toyota Axio 2016 para a Nigéria?",
        energy: "Devo instalar solar para a minha loja em Lagos?",
        localLife: "Posso viver em Nairobi com orçamento de 1.200 USD por mês?",
      },
      highStakes: {
        tax: "Apenas estimativa de planeamento. Confirme impostos, PAYE, IVA, declarações e conformidade com a autoridade fiscal ou profissional qualificado.",
        immigration: "Apenas estimativa de planeamento. Confirme vistos, imigração e mudança com fontes governamentais oficiais ou consultor qualificado.",
        legal: "Apenas estimativa de planeamento. Isto não é aconselhamento jurídico; confirme com fontes oficiais ou profissional qualificado.",
        health: "Apenas informação. Não use como aconselhamento médico; consulte profissional de saúde qualificado.",
        finance: "Apenas estimativa de planeamento. Confirme decisões financeiras, alfandegárias, crédito e negócios com fontes oficiais ou profissional qualificado.",
        employment: "Apenas apoio ao planeamento. Reveja decisões de emprego, contratação, salário e candidatura com orientação local qualificada quando necessário.",
        education: "Apenas estimativa de planeamento. Confirme elegibilidade, taxas, prazos e admissões com escolas ou fontes oficiais de bolsas.",
        energy: "Apenas estimativa de planeamento. Confirme tarifas, preços de combustível, dimensionamento e segurança com fornecedores locais ou instaladores qualificados.",
        none: "",
      },
    },
    ar: {
      homeHero: {
        kicker: "اسأل AfroTools AI",
        title: "AfroTools AI - مركز أفريقيا العملي للذكاء الاصطناعي",
        subtitle: "احسب وقارن واكتب وخطط واتخذ قرارات باستخدام أدوات أفريقية محلية.",
        label: "اسأل AfroTools AI",
        placeholder: "ما الذي تريد حسابه أو مقارنته أو كتابته أو التخطيط له؟",
        submit: "اسأل AfroTools AI",
        browseAll: "تصفح كل الأدوات",
        trust: "يوجه AfroTools طلبك إلى أدوات عملية. تعمل بعض المسارات داخل المتصفح. تطلب المسارات المدعومة بالذكاء الاصطناعي موافقتك قبل إرسال محتوى خاص.",
      },
      page: {
        title: "اسأل AfroTools AI",
        copy: "حوّل مهمة أفريقية عملية إلى الحاسبة أو المخطط أو مسار المستندات أو التقدير المدعوم بالمصادر أو التصدير المناسب في AfroTools. تساعد طبقة الذكاء الاصطناعي في الاختيار والتعبئة المسبقة ولا تستبدل المسارات الأساسية.",
        inputLabel: "ما الذي تريد حسابه أو مقارنته أو كتابته أو التخطيط له؟",
        inputPlaceholder: "ما الذي تريد حسابه أو مقارنته أو كتابته أو التخطيط له؟",
        submit: "ابحث عن المسار",
        trust: "تعمل بعض مسارات AfroTools داخل المتصفح. تطلب المسارات المدعومة بالذكاء الاصطناعي موافقتك قبل إرسال محتوى خاص. قد ترسل هذه الصفحة سؤالك إلى نقطة توجيه AfroTools لاختيار مسار، ولا تتطلب تسجيل الدخول أو تخزين الاستفسارات الخام في التحليلات.",
        browseCommon: "تصفح المسارات الشائعة",
      },
      states: {
        emptyTitle: "ابدأ بمهمة عملية.",
        emptyBody: "جرّب سؤالاً عن السيرة الذاتية أو المنح أو رسوم الاستيراد أو الطاقة الشمسية أو PAYE أو الفواتير أو PDF أو الوقود أو تخطيط المساحات.",
        loadingTitle: "جارٍ العثور على أفضل مسار",
        loadingBody: "يتم فحص توجيه AfroTools أولاً مع وجود بديل حتمي جاهز.",
        errorTitle: "الموجّه غير متاح",
        errorBody: "سيتم استخدام التوجيه الحتمي بدلاً من ذلك.",
        noMatchTitle: "لا يوجد مسار واضح بعد",
        noMatchBody: "أضف بلداً أو مبلغاً أو نوع مستند أو وجهة أو قطاعاً، أو واصل تصفح دليل الأدوات.",
      },
      consent: {
        title: "مساعدة ذكاء اصطناعي اختيارية",
        body: "يمكن لـ AfroTools إعادة المحاولة مع مزود نموذج فقط بعد موافقتك. تجنب إضافة السير الذاتية أو ملفات PDF أو السجلات المالية أو بيانات الملف الشخصي أو المعرفات الشخصية ما لم يطلبها مسار محدد وتختار المتابعة.",
        checkbox: "أفهم أن سؤالي الحالي قد يُرسل إلى خوادم AfroTools ومزود نموذج مهيأ للمساعدة في التوجيه.",
        retry: "أعد المحاولة بالذكاء الاصطناعي",
        continue: "متابعة التصفح",
      },
      projects: {
        title: "مشاريع الذكاء الاصطناعي الأخيرة",
        body: "تُحفظ على هذا الجهاز افتراضياً. مزامنة الحساب اختيارية وتستخدم ملخصات منقحة فقط.",
        refresh: "تحديث",
      },
      result: {
        inputsDetected: "المدخلات المكتشفة",
        missingInputs: "المدخلات المطلوبة الناقصة",
        privacyConfidence: "الخصوصية والثقة",
        openTool: "افتح الأداة",
        continueBrowsing: "متابعة التصفح",
        saveProject: "حفظ المشروع",
        syncSummary: "مزامنة الملخص المنقح",
        syncTitle: "مزامنة ملخص المشروع المنقح فقط",
        confidenceMatch: "% تطابق",
        browse: "تصفح",
        noInputs: "لا توجد مدخلات مكتشفة بعد.",
        noMissing: "لا توجد مدخلات مطلوبة ناقصة.",
        addDetailsTitle: "أضف تفاصيل قبل الفتح",
        addDetailsBody: "وجد AfroTools المسار. أضف حتى ثلاثة تفاصيل عملية الآن، أو تخطَّ ذلك وأكملها داخل الأداة.",
        updatePrefill: "تحديث التعبئة المسبقة",
        skipOpen: "تخط وافتح الأداة",
        browseInstead: "تصفح بدلاً من ذلك",
        keptLocal: "محفوظ في جلسة المتصفح هذه",
        choose: "اختر",
      },
      router: {
        matched: "تمت مطابقة كلمات مفتاحية واضحة مع مسار AfroTools.",
        fallback: "لا توجد مطابقة قوية؛ سيتم الرجوع إلى بحث AfroTools.",
        validated: "تمت المطابقة مع سجل أدوات AfroTools.",
        openWorkflow: "افتح مسار AfroTools الموصى به",
        answerClarification: "أجب عن سؤال التوضيح",
        usePrefill: "استخدم الحقول المستخرجة كمرشحات للتعبئة المسبقة بعد المراجعة",
        searchIfWrong: "ابحث في AfroTools إذا لم تكن المطابقة صحيحة",
      },
      privacyNotices: {
        generic: "يمكن للتوجيه الأساسي أن يعمل دون موافقة نموذج.",
        sensitive: "لا تضف بيانات خاصة عن السيرة الذاتية أو المال أو المستندات أو الهوية إلا إذا طلبها مسار واخترت المتابعة.",
        sourceConfidence: "تظهر تحذيرات المصدر والحداثة والثقة عندما يمكن أن تتغير الأسعار أو القواعد أو الرسوم أو المواعيد أو البيانات الخارجية.",
        modelConsent: "يجب أن تطلب مساعدة الذكاء الاصطناعي الاختيارية موافقتك قبل إرسال تفاصيل حساسة.",
      },
      clarification: {
        country: "أي بلد يجب أن يستخدمه AfroTools لهذا المسار؟",
        destinationCountry: "لأي بلد وجهة يجب أن يحسب AfroTools؟",
        targetCountry: "أي بلد وجهة تفكر فيه؟",
        grossPay: "ما مبلغ الراتب الإجمالي الذي يجب استخدامه لتقدير PAYE؟",
        itemValue: "ما قيمة السلعة أو المركبة التي يجب أن يستخدمها AfroTools؟",
        itemCategory: "ما السلعة أو المركبة التي تستوردها؟",
        studyLevel: "ما مستوى الدراسة الذي تستهدفه؟",
        monthlyBill: "ما فاتورة الكهرباء الشهرية الحالية أو إنفاق وقود المولد؟",
        default: "هل يمكنك إضافة التفصيل الناقص ليحضّر AfroTools المسار؟",
      },
      fields: {
        country: "البلد",
        destinationCountry: "بلد الوجهة",
        targetCountry: "بلد الوجهة",
        grossPay: "الراتب الإجمالي",
        itemValue: "قيمة السلعة",
        itemCategory: "مركبة أو سلعة",
        productCategory: "فئة المنتج",
        studyLevel: "مستوى الدراسة",
        monthlyBill: "فاتورة الكهرباء الشهرية",
        targetRole: "الدور المستهدف",
        languagePreference: "تفضيل اللغة",
        currency: "العملة",
        budget: "الميزانية المتاحة",
        budgetAmount: "نطاق الميزانية",
        invoiceAmount: "مبلغ الفاتورة",
        vatTreatment: "معالجة ضريبة القيمة المضافة",
        businessType: "نوع النشاط",
        pdfAction: "إجراء PDF",
      },
      categories: {
        education: "التعليم",
        studyAbroad: "الدراسة في الخارج",
        scholarships: "المنح",
        career: "المسار المهني",
        cvJobs: "السيرة الذاتية والوظائف",
        employment: "المسار المهني",
        business: "الأعمال",
        businessTax: "ضرائب الأعمال",
        finance: "الأعمال والتمويل",
        tax: "الضرائب",
        salaryTax: "الراتب والضرائب",
        trade: "التجارة",
        importDuty: "رسوم الاستيراد",
        energy: "الطاقة",
        solarEnergy: "الطاقة الشمسية والطاقة",
        fuelEnergy: "الوقود والمولدات",
        localLife: "الحياة المحلية",
        construction: "البناء",
        documents: "المستندات",
        search: "البحث",
        immigration: "الهجرة",
        legal: "قانوني",
        health: "الصحة",
        none: "عام",
      },
      examples: {
        education: "أريد الدراسة في كندا من نيجيريا بميزانية 8000 دولار.",
        career: "اكتب لي سيرة ذاتية لمهندس كهربائي في غانا.",
        business: "ساعدني في حساب الرواتب لخمسة موظفين في كينيا.",
        trade: "كم سأدفع كرسوم لاستيراد Toyota Axio 2016 إلى نيجيريا؟",
        energy: "هل يجب أن أركب طاقة شمسية لمتجري في لاغوس؟",
        localLife: "هل يمكنني العيش في نيروبي بميزانية 1200 دولار شهرياً؟",
      },
      highStakes: {
        tax: "تقدير للتخطيط فقط. أكد قرارات الضرائب وPAYE وضريبة القيمة المضافة والإقرارات والامتثال مع إرشادات جهة الإيرادات الرسمية أو مهني مؤهل.",
        immigration: "تقدير للتخطيط فقط. أكد قرارات التأشيرة والهجرة والانتقال مع مصادر حكومية رسمية أو مستشار مؤهل.",
        legal: "تقدير للتخطيط فقط. هذا ليس نصيحة قانونية؛ أكد مع مصادر رسمية أو مهني قانوني مؤهل.",
        health: "للمعلومات فقط. لا تستخدمه كنصيحة طبية؛ استشر مختصاً صحياً مؤهلاً.",
        finance: "تقدير للتخطيط فقط. أكد القرارات المالية والجمركية والإقراض والأعمال مع مصادر رسمية أو مهني مؤهل.",
        employment: "دعم للتخطيط فقط. راجع قرارات التوظيف والراتب والتقديم مع إرشاد محلي مؤهل عند الحاجة.",
        education: "تقدير للتخطيط فقط. أكد الأهلية والرسوم والمواعيد وتفاصيل القبول مع المدرسة أو مصادر المنحة الرسمية.",
        energy: "تقدير للتخطيط فقط. أكد التعرفة وأسعار الوقود وحجم التركيب ومتطلبات السلامة مع الموردين المحليين أو فنيين مؤهلين.",
        none: "",
      },
    },
    sw: {
      homeHero: {
        kicker: "Uliza AfroTools AI",
        title: "AfroTools AI - kituo cha vitendo cha AI Afrika",
        subtitle: "Kokotoa, linganisha, andika, panga na amua kwa zana za Kiafrika za eneo lako.",
        label: "Uliza AfroTools AI",
        placeholder: "Unataka kukokotoa, kulinganisha, kuandika au kupanga nini?",
        submit: "Uliza AfroTools AI",
        browseAll: "Vinjari zana zote",
        trust: "AfroTools huelekeza ombi lako kwenye zana za vitendo. Baadhi ya mtiririko hufanya kazi kwenye kivinjari. Msaada wa AI huomba ruhusa kabla ya kutuma maudhui binafsi.",
      },
      page: {
        title: "Uliza AfroTools AI",
        copy: "Elekeza kazi ya Kiafrika ya vitendo kwenye kikokotoo, mpangaji, mtiririko wa nyaraka, makadirio yenye vyanzo au usafirishaji wa AfroTools. AI husaidia kuchagua na kujaza awali zana; haibadilishi mtiririko wenyewe.",
        inputLabel: "Unataka kukokotoa, kulinganisha, kuandika au kupanga nini?",
        inputPlaceholder: "Unataka kukokotoa, kulinganisha, kuandika au kupanga nini?",
        submit: "Tafuta mtiririko",
        trust: "Baadhi ya mitiririko ya AfroTools hufanya kazi kwenye kivinjari. Mitiririko yenye AI huomba ruhusa kabla ya kutuma maudhui binafsi. Ukurasa huu unaweza kutuma ombi lako kwenye njia ya AfroTools ya kuchagua mtiririko, bila kuhitaji kuingia au kuhifadhi maswali ghafi kwenye analytics.",
        browseCommon: "Vinjari mitiririko ya kawaida",
      },
      states: {
        emptyTitle: "Anza na kazi ya vitendo.",
        emptyBody: "Jaribu swali kuhusu CV, ufadhili, ushuru wa kuagiza, sola, PAYE, ankara, PDF, mafuta au mpango wa nyumba.",
        loadingTitle: "Inatafuta mtiririko bora",
        loadingBody: "Inakagua kwanza uelekezaji wa AfroTools, ikiwa na njia mbadala tayari.",
        errorTitle: "Kielekezi hakipatikani",
        errorBody: "Inatumia uelekezaji wa ndani badala yake.",
        noMatchTitle: "Hakuna mtiririko ulio wazi bado",
        noMatchBody: "Ongeza nchi, kiasi, aina ya hati, mahali pa kwenda au sekta, au endelea kuvinjari orodha ya zana.",
      },
      consent: {
        title: "Msaada wa AI wa hiari",
        body: "AfroTools inaweza kujaribu tena na mtoa modeli baada tu ya ruhusa yako. Epuka kuongeza CV, PDF, rekodi za fedha, data ya wasifu au vitambulisho binafsi isipokuwa mtiririko umeomba wazi.",
        checkbox: "Ninaelewa kuwa ombi langu la sasa linaweza kutumwa kwenye seva za AfroTools na mtoa modeli aliyesanidiwa kusaidia uelekezaji.",
        retry: "Jaribu tena kwa AI",
        continue: "Endelea kuvinjari",
      },
      projects: {
        title: "Miradi ya AI ya hivi karibuni",
        body: "Huhifadhiwa kwenye kifaa hiki kwa chaguo-msingi. Usawazishaji wa akaunti ni wa hiari na hutumia muhtasari uliosafishwa tu.",
        refresh: "Onyesha upya",
      },
      result: {
        inputsDetected: "Taarifa zilizogunduliwa",
        missingInputs: "Taarifa muhimu zinazokosekana",
        privacyConfidence: "Faragha na uaminifu",
        openTool: "Fungua zana",
        continueBrowsing: "Endelea kuvinjari",
        saveProject: "Hifadhi mradi",
        syncSummary: "Sawazisha muhtasari uliosafishwa",
        syncTitle: "Sawazisha muhtasari uliosafishwa wa mradi pekee",
        confidenceMatch: "% ya ulinganifu",
        browse: "Vinjari",
        noInputs: "Hakuna taarifa zilizogunduliwa bado.",
        noMissing: "Hakuna taarifa muhimu zinazokosekana.",
        addDetailsTitle: "Ongeza maelezo kabla ya kufungua",
        addDetailsBody: "AfroTools imepata mtiririko. Ongeza hadi maelezo matatu ya vitendo sasa, au ruka na uyajaze ndani ya zana.",
        updatePrefill: "Sasisha ujazaji wa awali",
        skipOpen: "Ruka na ufungue zana",
        browseInstead: "Vinjari badala yake",
        keptLocal: "imehifadhiwa kwenye kipindi hiki cha kivinjari",
        choose: "Chagua",
      },
      router: {
        matched: "Maneno muhimu yameonyesha mtiririko wa AfroTools.",
        fallback: "Hakuna ulinganifu thabiti; inarudi kwenye utafutaji wa AfroTools.",
        validated: "Imelinganishwa na rejista ya zana za AfroTools.",
        openWorkflow: "Fungua mtiririko uliopendekezwa wa AfroTools",
        answerClarification: "Jibu swali la ufafanuzi",
        usePrefill: "Tumia taarifa zilizotolewa kama mapendekezo ya kujaza baada ya ukaguzi",
        searchIfWrong: "Tafuta AfroTools ikiwa ulinganifu si sahihi",
      },
      privacyNotices: {
        generic: "Uelekezaji wa msingi unaweza kufanya kazi bila ruhusa ya modeli.",
        sensitive: "Usiongeze data binafsi ya CV, fedha, nyaraka au utambulisho isipokuwa mtiririko umeomba na umechagua kuendelea.",
        sourceConfidence: "Maonyo ya chanzo, upya na uaminifu huonekana pale viwango, sheria, bei, tarehe au data ya nje vinaweza kubadilika.",
        modelConsent: "Msaada wa AI wa hiari unapaswa kuomba ruhusa kabla ya kutuma maelezo nyeti.",
      },
      clarification: {
        country: "AfroTools itumie nchi gani kwa mtiririko huu?",
        destinationCountry: "AfroTools ihesabu kwa nchi gani ya kwenda?",
        targetCountry: "Unazingatia nchi gani ya kwenda?",
        grossPay: "Ni kiasi gani cha mshahara ghafi kitumike kwa makadirio ya PAYE?",
        itemValue: "AfroTools itumie thamani gani ya bidhaa au gari?",
        itemCategory: "Unaagiza bidhaa au gari gani?",
        studyLevel: "Unalenga kiwango gani cha masomo?",
        monthlyBill: "Bili yako ya umeme ya mwezi au matumizi ya mafuta ya jenereta ni kiasi gani?",
        default: "Unaweza kuongeza taarifa inayokosekana ili AfroTools iandae mtiririko?",
      },
      fields: {
        country: "Nchi",
        destinationCountry: "Nchi ya kwenda",
        targetCountry: "Nchi ya kwenda",
        grossPay: "Mshahara ghafi",
        itemValue: "Thamani ya bidhaa",
        itemCategory: "Gari au bidhaa",
        productCategory: "Aina ya bidhaa",
        studyLevel: "Kiwango cha masomo",
        monthlyBill: "Bili ya umeme ya mwezi",
        targetRole: "Kazi unayolenga",
        languagePreference: "Lugha unayopendelea",
        currency: "Sarafu",
        budget: "Bajeti iliyopo",
        budgetAmount: "Kiwango cha bajeti",
        invoiceAmount: "Kiasi cha ankara",
        vatTreatment: "Ushughulikiaji wa VAT",
        businessType: "Aina ya biashara",
        pdfAction: "Kitendo cha PDF",
      },
      categories: {
        education: "Elimu",
        studyAbroad: "Kusoma nje ya nchi",
        scholarships: "Ufadhili",
        career: "Kazi",
        cvJobs: "CV na kazi",
        employment: "Kazi",
        business: "Biashara",
        businessTax: "Kodi za biashara",
        finance: "Biashara na fedha",
        tax: "Kodi",
        salaryTax: "Mshahara na kodi",
        trade: "Biashara ya nje",
        importDuty: "Ushuru wa kuagiza",
        energy: "Nishati",
        solarEnergy: "Sola na nishati",
        fuelEnergy: "Mafuta na jenereta",
        localLife: "Maisha ya eneo",
        construction: "Ujenzi",
        documents: "Nyaraka",
        search: "Utafutaji",
        immigration: "Uhamiaji",
        legal: "Kisheria",
        health: "Afya",
        none: "Jumla",
      },
      examples: {
        education: "Nataka kusoma Canada kutoka Nigeria nikiwa na bajeti ya dola 8,000.",
        career: "Niandikie CV ya mhandisi wa umeme nchini Ghana.",
        business: "Nisaidie kukokotoa mishahara ya wafanyakazi 5 nchini Kenya.",
        trade: "Nitalipa ushuru kiasi gani kuingiza Toyota Axio ya 2016 Nigeria?",
        energy: "Je, niweke sola kwa duka langu Lagos?",
        localLife: "Naweza kuishi Nairobi kwa bajeti ya dola 1,200 kwa mwezi?",
      },
      highStakes: {
        tax: "Makadirio ya kupanga pekee. Thibitisha kodi, PAYE, VAT, uwasilishaji na utii wa sheria kwa mamlaka rasmi ya mapato au mtaalamu aliyehitimu.",
        immigration: "Makadirio ya kupanga pekee. Thibitisha visa, uhamiaji na kuhamia kwa vyanzo rasmi vya serikali au mshauri aliyehitimu.",
        legal: "Makadirio ya kupanga pekee. Huu si ushauri wa kisheria; thibitisha kwa vyanzo rasmi au mtaalamu wa sheria.",
        health: "Kwa taarifa pekee. Usitumie kama ushauri wa kitabibu; wasiliana na mtaalamu wa afya.",
        finance: "Makadirio ya kupanga pekee. Thibitisha maamuzi ya fedha, forodha, mikopo na biashara kwa vyanzo rasmi au mtaalamu aliyehitimu.",
        employment: "Msaada wa kupanga pekee. Kagua maamuzi ya ajira, kuajiri, mshahara na maombi kwa mwongozo wa eneo husika inapohitajika.",
        education: "Makadirio ya kupanga pekee. Thibitisha ustahiki, ada, tarehe na udahili kwa shule au vyanzo rasmi vya ufadhili.",
        energy: "Makadirio ya kupanga pekee. Thibitisha bei, gharama za mafuta, ukubwa wa mfumo na usalama kwa wauzaji wa eneo au mafundi waliohitimu.",
        none: "",
      },
    },
  };

  function normalizeLocale(value) {
    var raw = String(value || "").trim().toLowerCase().replace(/_/g, "-");
    if (!raw) return DEFAULT_LOCALE;
    if (LOCALE_ALIASES[raw]) return LOCALE_ALIASES[raw];
    var base = raw.split("-")[0];
    return SUPPORTED_LOCALES.indexOf(base) !== -1 ? base : DEFAULT_LOCALE;
  }

  function detectLocale(options) {
    var opts = options && typeof options === "object" ? options : { locale: options };
    if (opts.locale || opts.lang || opts.uiLocale) return normalizeLocale(opts.locale || opts.lang || opts.uiLocale);
    var search = opts.search;
    if (!search && typeof window !== "undefined" && window.location) search = window.location.search;
    if (search && typeof URLSearchParams !== "undefined") {
      try {
        var params = new URLSearchParams(String(search).replace(/^\?/, ""));
        if (params.get("locale") || params.get("lang")) return normalizeLocale(params.get("locale") || params.get("lang"));
      } catch (err) {}
    }
    if (typeof document !== "undefined" && document.documentElement && document.documentElement.lang) {
      var htmlLocale = normalizeLocale(document.documentElement.lang);
      if (htmlLocale !== DEFAULT_LOCALE || /^en/i.test(document.documentElement.lang)) return htmlLocale;
    }
    if (typeof navigator !== "undefined") {
      var languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
      for (var i = 0; i < languages.length; i += 1) {
        var candidate = normalizeLocale(languages[i]);
        if (candidate !== DEFAULT_LOCALE || /^en/i.test(String(languages[i] || ""))) return candidate;
      }
    }
    return DEFAULT_LOCALE;
  }

  function isRtl(locale) {
    return Boolean(RTL_LOCALES[normalizeLocale(locale)]);
  }

  function lookup(locale, key) {
    var dict = TRANSLATIONS[normalizeLocale(locale)] || TRANSLATIONS[DEFAULT_LOCALE];
    var parts = String(key || "").split(".");
    var current = dict;
    for (var i = 0; i < parts.length; i += 1) {
      if (!current || current[parts[i]] === undefined) return undefined;
      current = current[parts[i]];
    }
    return current;
  }

  function t(locale, key, fallback) {
    var localized = lookup(locale, key);
    if (localized !== undefined) return localized;
    var english = lookup(DEFAULT_LOCALE, key);
    return english !== undefined ? english : (fallback !== undefined ? fallback : key);
  }

  function setDocumentLocale(locale, doc) {
    var targetDoc = doc || (typeof document !== "undefined" ? document : null);
    var normalized = normalizeLocale(locale);
    if (targetDoc && targetDoc.documentElement) {
      targetDoc.documentElement.lang = normalized;
      targetDoc.documentElement.dir = isRtl(normalized) ? "rtl" : "ltr";
      targetDoc.documentElement.setAttribute("data-ai-locale", normalized);
    }
    return normalized;
  }

  function categoryName(locale, category) {
    var normalized = String(category || "none").replace(/-([a-z])/g, function (_, ch) { return ch.toUpperCase(); });
    return t(locale, "categories." + normalized, t(locale, "categories." + String(category || "none"), category || ""));
  }

  function clarificationForMissing(locale, missingInputs) {
    var missing = Array.isArray(missingInputs) ? missingInputs : [];
    var keys = ["country", "destinationCountry", "targetCountry", "grossPay", "itemValue", "itemCategory", "studyLevel", "monthlyBill"];
    for (var i = 0; i < keys.length; i += 1) {
      if (missing.indexOf(keys[i]) !== -1) return t(locale, "clarification." + keys[i]);
    }
    return missing.length ? t(locale, "clarification.default") : "";
  }

  function suggestedActions(locale, decision) {
    var actions = [t(locale, "router.openWorkflow")];
    if (decision && Array.isArray(decision.missingInputs) && decision.missingInputs.length) {
      actions.unshift(t(locale, "router.answerClarification"));
    }
    if (decision && decision.canPrefill) actions.push(t(locale, "router.usePrefill"));
    actions.push(t(locale, "router.searchIfWrong"));
    return actions;
  }

  function localizeRouterDecision(decision, locale) {
    if (!decision || typeof decision !== "object") return decision;
    var normalized = normalizeLocale(locale);
    var copy = Object.assign({}, decision);
    var isFallback = copy.selectedToolId === "tool-search" || copy.intentCategory === "search";
    copy.locale = normalized;
    copy.reasonShort = isFallback ? t(normalized, "router.fallback") : t(normalized, "router.matched");
    copy.clarificationQuestion = clarificationForMissing(normalized, copy.missingInputs);
    copy.highStakesNotice = t(normalized, "highStakes." + (copy.safetyDomain || "none"), copy.highStakesNotice || "");
    copy.suggestedNextActions = suggestedActions(normalized, copy);
    copy.labels = Object.assign({}, copy.labels || {}, {
      direction: isRtl(normalized) ? "rtl" : "ltr",
      category: categoryName(normalized, copy.intentCategory || copy.safetyDomain || "none"),
      safetyDomain: categoryName(normalized, copy.safetyDomain || "none"),
      openTool: t(normalized, "result.openTool"),
      continueBrowsing: t(normalized, "result.continueBrowsing"),
      saveProject: t(normalized, "result.saveProject"),
      privacyConfidence: t(normalized, "result.privacyConfidence"),
      missingInputs: t(normalized, "result.missingInputs"),
      inputsDetected: t(normalized, "result.inputsDetected"),
    });
    return copy;
  }

  function translationsFor(locale) {
    return TRANSLATIONS[normalizeLocale(locale)] || TRANSLATIONS[DEFAULT_LOCALE];
  }

  return {
    DEFAULT_LOCALE: DEFAULT_LOCALE,
    SUPPORTED_LOCALES: SUPPORTED_LOCALES.slice(),
    RTL_LOCALES: Object.assign({}, RTL_LOCALES),
    TRANSLATIONS: TRANSLATIONS,
    normalizeLocale: normalizeLocale,
    detectLocale: detectLocale,
    isRtl: isRtl,
    t: t,
    setDocumentLocale: setDocumentLocale,
    categoryName: categoryName,
    clarificationForMissing: clarificationForMissing,
    localizeRouterDecision: localizeRouterDecision,
    translationsFor: translationsFor,
  };
});
