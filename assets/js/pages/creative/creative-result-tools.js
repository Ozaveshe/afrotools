(function (global) {
  "use strict";

  function isFrench() {
    return (document.documentElement.lang || "").toLowerCase().indexOf("fr") === 0;
  }

  function text(english, french) {
    return isFrench() ? french : english;
  }

  function installReflowStyles() {
    if (document.getElementById("creative-result-tools-style")) return;
    var style = document.createElement("style");
    style.id = "creative-result-tools-style";
    style.textContent =
      ".fr-tool-shell,.fr-tool-shell h1,#tool-mount,#tool-mount *{box-sizing:border-box;min-width:0;max-width:100%}" +
      ".fr-tool-shell h1{overflow-wrap:anywhere;word-break:break-word}" +
      "#tool-mount,.en-results,.en-card,.en-results-table-wrap{min-width:0;max-width:100%}" +
      "#tool-mount .en-results-hero,#tool-mount .en-results-hero-inner,#tool-mount .en-results-hero-grid{min-width:0;max-width:100%;overflow-wrap:anywhere}" +
      ".en-results-table-wrap{overflow-x:auto}" +
      "#tool-mount table{width:100%;table-layout:fixed}" +
      "#tool-mount th,#tool-mount td{min-width:0;overflow-wrap:anywhere;word-break:break-word}" +
      "#tool-mount .en-results-hero-inner,#tool-mount .en-form-actions,#tool-mount [style*='display:flex']{flex-wrap:wrap}" +
      "#tool-mount button{max-width:100%;white-space:normal;overflow-wrap:anywhere}" +
      "@media(max-width:480px){#tool-mount .en-results-hero-grid{grid-template-columns:minmax(0,1fr)!important}#tool-mount .en-results-table{font-size:.68rem}#tool-mount th,#tool-mount td{padding:6px 4px}}";
    document.head.appendChild(style);
  }

  function statusNode() {
    var node = document.querySelector("[data-creative-result-status]");
    if (node) return node;
    node = document.createElement("p");
    node.setAttribute("data-creative-result-status", "");
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    node.style.marginTop = "12px";
    node.style.fontWeight = "700";
    var actions = document.querySelector(".en-form-actions");
    if (actions) actions.appendChild(node);
    return node;
  }

  function reject(message, targetId) {
    var node = statusNode();
    node.textContent = message;
    node.style.color = "#b42318";
    var target = targetId && document.getElementById(targetId);
    if (target) {
      target.setAttribute("aria-invalid", "true");
      target.focus();
    }
    return false;
  }

  function clearStatus() {
    var node = statusNode();
    node.textContent = "";
    document.querySelectorAll("[aria-invalid='true']").forEach(function (field) {
      field.removeAttribute("aria-invalid");
    });
  }

  function resultText(toolName) {
    var results = document.getElementById("results");
    var warning = text(
      "Planning output only. Verify assumptions and market values before acting.",
      "Résultat de planification uniquement. Vérifiez les hypothèses et les valeurs du marché avant d'agir."
    );
    return [
      toolName,
      warning,
      "",
      results ? results.innerText.trim() : "",
      "",
      text(
        "Generated locally in this browser by AfroTools.",
        "Généré localement dans ce navigateur par AfroTools."
      ),
    ].join("\n");
  }

  var FRENCH_RESULT_COPY = [
    ["using the built-in planning rate", "avec le taux de planification intégré"],
    ["Break-Even Copies", "Exemplaires au seuil de rentabilité"],
    ["Editing Costs", "Coûts de révision"],
    ["Dev + Copy + Proof", "Structure + édition + relecture"],
    ["Setup Costs", "Coûts de préparation"],
    ["Cover, layout, ISBN", "Couverture, mise en page, ISBN"],
    ["Print Run", "Tirage imprimé"],
    ["Monthly Revenue", "Revenu mensuel"],
    ["Royalty Comparison by Platform", "Comparaison des redevances par plateforme"],
    ["Traditional Publisher", "Éditeur traditionnel"],
    ["African Publishing Platforms", "Plateformes de publication africaines"],
    ["Consider Okadabooks and Bambooks for Nigerian ebook distribution (70% royalty). IngramSpark gives access to 39,000+ bookstores globally. Amazon KDP is still the largest ebook platform — price between $2.99–$9.99 to qualify for the 70% royalty tier.", "Envisagez Okadabooks et Bambooks pour distribuer un ebook au Nigeria (70 % de redevance). IngramSpark donne accès à plus de 39 000 librairies dans le monde. Amazon KDP reste une grande plateforme : un prix entre 2,99 $ et 9,99 $ peut ouvrir le palier de 70 %, sous réserve des conditions en vigueur."],
    ["Your Engagement Rate", "Votre taux d'engagement"],
    ["total interactions per post", "interactions totales par publication"],
    ["Avg per post", "Moyenne par publication"],
    ["Shares + Saves", "Partages + enregistrements"],
    ["Engagement Rate", "Taux d'engagement"],
    ["Platform Benchmarks", "Repères de la plateforme"],
    ["You qualify", "Seuil atteint"],
    ["Monetization Readiness", "Préparation à la monétisation"],
    ["Monetisation Readiness", "Préparation à la monétisation"],
    ["Monetization Status", "Statut de monétisation"],
    ["Ready to monetize", "Prêt à monétiser"],
    ["Not yet ready", "Pas encore prêt"],
    ["Your engagement rate is above the Instagram average. You can pitch brands for sponsorships. Focus on growing your niche and document value for potential partners.", "Votre taux d'engagement dépasse la moyenne Instagram. Vous pouvez présenter une offre de parrainage aux marques. Développez votre niche et documentez la valeur créée pour vos partenaires potentiels."],
    ["Your engagement rate is below the Instagram average of 3%. Focus on content quality and community building before pitching brands. Aim for 6% before monetizing.", "Votre taux d'engagement est inférieur à la moyenne Instagram de 3 %. Renforcez la qualité du contenu et la communauté avant de contacter des marques. Visez 6 % avant de monétiser."],
    ["Nano/Micro Brand Deals", "Partenariats nano/micro"],
    ["Affiliate Marketing", "Marketing d'affiliation"],
    ["Platform Monetization", "Monétisation de la plateforme"],
    ["Premium Content / Patreon", "Contenu premium / Patreon"],
    ["Tips to Improve Your Engagement", "Conseils pour améliorer votre engagement"],
    ["Post Reels 3–4x per week — algorithm heavily favours video", "Publiez 3 à 4 Reels par semaine : l'algorithme favorise fortement la vidéo"],
    ["Carousel posts get 3x more reach than single images", "Les carrousels obtiennent environ trois fois plus de portée que les images uniques"],
    ["Story polls and question stickers boost engagement signals", "Les sondages et questions en story renforcent les signaux d'engagement"],
    ["Post at 7:30am, 12:30pm, or 8pm WAT for peak reach", "Testez 7 h 30, 12 h 30 ou 20 h WAT, puis confirmez avec vos statistiques"],
    ["Use 8–12 relevant hashtags (avoid generic ones with 500M+ posts)", "Utilisez 8 à 12 hashtags pertinents et évitez les hashtags trop génériques"],
    ["Your Personal Brand Score", "Votre score de marque personnelle"],
    ["Brand building hasn't started. LinkedIn profile creation is your first action today.", "La construction de votre marque n'a pas encore commencé. Créer ou compléter votre profil LinkedIn est la première action à mener."],
    ["Early stage. Start with LinkedIn optimisation and one content channel.", "Phase initiale. Commencez par optimiser LinkedIn et choisissez un seul canal de contenu."],
    ["Emerging brand. Your offline reputation may be stronger than your digital presence.", "Marque émergente. Votre réputation hors ligne est peut-être plus forte que votre présence numérique."],
    ["Score Breakdown by Category", "Détail du score par catégorie"],
    ["Social Media", "Réseaux sociaux"],
    ["Content Creation", "Création de contenu"],
    ["Offline Reputation", "Réputation hors ligne"],
    ["Credentials", "Qualifications"],
    ["90-Day Action Plan", "Plan d'action sur 90 jours"],
    ["Quick wins", "Actions rapides"],
    ["Update LinkedIn headline to include your top 3 keywords. Add a professional headshot if missing. Set posting schedule reminder (Tuesday + Thursday 8am is peak).", "Mettez à jour votre titre LinkedIn avec vos trois mots-clés principaux. Ajoutez un portrait professionnel si nécessaire. Planifiez deux créneaux de publication et confirmez-les avec vos statistiques."],
    ["Content launch", "Lancement de contenu"],
    ["Write and publish your first thought-leadership article on LinkedIn. Topic: your biggest lesson from", "Rédigez et publiez un premier article d'expertise sur LinkedIn. Sujet : votre principal enseignement après"],
    ["years in", "années dans le secteur"],
    ["Share across all your platforms.", "Partagez-le sur vos plateformes pertinentes."],
    ["This is your lowest-scoring area. Specifically:", "C'est votre domaine le moins bien noté. Action prioritaire :"],
    ["Build LinkedIn", "Renforcer LinkedIn"],
    ["Complete every section of your LinkedIn profile. Request 3 recommendations from former colleagues. Turn on Creator Mode.", "Complétez chaque section de votre profil LinkedIn. Demandez trois recommandations à d'anciens collègues et activez le mode créateur si disponible."],
    ["Offline visibility", "Visibilité hors ligne"],
    ["Apply to speak at one industry event or webinar. Guest appearances on podcasts count. Target 2 applications this period.", "Proposez une intervention à un événement ou webinaire de votre secteur. Les invitations sur des podcasts comptent aussi. Visez deux candidatures sur cette période."],
    ["Consistency & systems", "Régularité et systèmes"],
    ["Schedule content 2 weeks ahead using Buffer or Hootsuite. Review score again. Track follower growth weekly. Set 6-month brand target.", "Planifiez le contenu deux semaines à l'avance. Recalculez le score, suivez l'évolution de l'audience chaque semaine et fixez un objectif à six mois."],
    ["Your brand score (2/100) means you're not yet ready for significant brand monetisation. Invest the next 6–12 months building visibility. Most brand revenue comes after crossing the 60/100 threshold. Start with free speaking, free content, free community — then monetise when you have an audience.", "Votre score de marque (2/100) indique qu'une monétisation importante serait prématurée. Investissez les 6 à 12 prochains mois dans votre visibilité. Commencez par des interventions, du contenu et une communauté utiles, puis monétisez lorsque l'audience est établie."],
    ["Early Stage", "Phase initiale"],
    ["Suggested Session Price", "Prix de séance suggéré"],
    ["Day rate", "Tarif journalier"],
    ["Daily Overhead", "Frais généraux journaliers"],
    ["Rent + depreciation", "Loyer + amortissement"],
    ["Session Hours", "Heures par séance"],
    ["Shoot + editing", "Prise de vue + retouche"],
    ["Hourly Rate", "Taux horaire"],
    ["Effective hourly", "Taux horaire effectif"],
    ["Profit Margin", "Marge bénéficiaire"],
    ["After overhead", "Après frais généraux"],
    ["Market Rate Reference", "Repères tarifaires du marché"],
    ["DAY RATE", "TARIF JOURNALIER"],
    ["Session Price RANGE", "Fourchette de prix de séance"],
    ["Nigerian Wedding Photography Note", "Note sur la photographie de mariage au Nigeria"],
    ["Experience", "Expérience"],
    ["Session Price Range", "Fourchette de prix de séance"],
    ["Wedding Range", "Fourchette mariage"],
    ["New (0–1yr)", "Débutant (0–1 an)"],
    ["Experienced (2–5yr)", "Expérimenté (2–5 ans)"],
    ["Senior (5+yr)", "Senior (5 ans et +)"],
    ["Established", "Établi"],
    ["An experienced Nigerian wedding photographer charges ₦200,000–₦2,000,000+ per wedding depending on packages. Always charge a non-refundable booking deposit (minimum 50%) to secure dates. Delivery timeline should be clearly stated in contracts — aim for 2–4 weeks.", "Au Nigeria, un photographe de mariage expérimenté facture souvent de 200 000 ₦ à plus de 2 000 000 ₦ selon le forfait. Prévoyez un acompte de réservation clairement documenté et indiquez le délai de livraison dans le contrat. Confirmez toujours les pratiques et conditions locales."],
    ["Total Monthly Revenue", "Revenu mensuel total"],
    ["Annual Potential", "Potentiel annuel"],
    ["Direct deals", "Accords directs"],
    ["Patreon/Support", "Patreon / soutien"],
    ["Downloads/Episode", "Téléchargements/épisode"],
    ["Revenue by Stream", "Revenus par source"],
    ["Pre-Roll Ads", "Publicités pré-roll"],
    ["Mid-Roll Ads", "Publicités mid-roll"],
    ["Post-Roll Ads", "Publicités post-roll"],
    ["Direct Sponsorships", "Parrainages directs"],
    ["Patreon / Listeners", "Patreon / auditeurs"],
    ["Active", "Actif"],
    ["Downloads Needed to Unlock Each Stream", "Téléchargements requis pour chaque source"],
    ["Downloads Required", "Téléchargements requis"],
    ["Your Status", "Votre statut"],
    ["Programmatic Ads", "Publicités programmatiques"],
    ["Premium Sponsors", "Sponsors premium"],
    ["Brand Deals (major)", "Partenariats de marque majeurs"],
    ["more downloads needed", "téléchargements supplémentaires nécessaires"],
    ["CPM Rates for Africa", "Taux CPM en Afrique"],
    ["African audiences command lower CPM rates ($3–8) vs US ($18–25) or UK ($15–20). But sponsorships from African brands — Flutterwave, GTBank, MTN, Jumia — can pay flat rates of $500–$5,000 per episode regardless of CPM. Pitch sponsors directly rather than relying solely on programmatic ads.", "Les audiences africaines peuvent avoir des CPM plus faibles que les audiences américaines ou britanniques. Des marques africaines peuvent toutefois proposer des forfaits directs par épisode. Présentez une offre aux sponsors potentiels et ne dépendez pas uniquement des publicités programmatiques ; confirmez chaque tarif réel."],
    ["copies", "exemplaires"],
    ["sales/mo", "ventes/mois"],
    ["downloads/ep", "téléchargements/épisode"],
    ["eps/month", "épisodes/mois"],
    ["patrons", "soutiens"],
    ["Grade", "Niveau"],
    ["Low", "Faible"],
    ["Average", "Moyen"],
    ["Good", "Bon"],
    ["Excellent", "Excellent"],
    ["gap", "d'écart"],
  ];

  function localizeFrenchResults() {
    if (!isFrench()) return;
    var root = document.getElementById("results");
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var value = node.nodeValue;
      FRENCH_RESULT_COPY.slice().sort(function (a, b) {
        return b[0].length - a[0].length;
      }).forEach(function (pair) {
        var escaped = pair[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        var boundaryStart = /^[A-Za-z0-9]/.test(pair[0]) ? "\\b" : "";
        var boundaryEnd = /[A-Za-z0-9]$/.test(pair[0]) ? "\\b" : "";
        value = value.replace(
          new RegExp(boundaryStart + escaped + boundaryEnd, "gi"),
          function () {
            return pair[1];
          }
        );
      });
      value = value
        .replace(/\bAt ([\d\s,.]+) ventes\/mois\b/g, "Pour $1 ventes/mois")
        .replace(/\bYear ([123])\b/g, "Année $1")
        .replace(/\bfor ([A-Za-z/]+) —/g, "sur $1 —")
        .replace(/\bvs ([\d,.]+)% platform avg\b/g, "contre $1 % en moyenne sur la plateforme")
        .replace(/\/month estimated\b/g, "/mois estimé")
        .replace(/\bDays ([\d–-]+)/g, "Jours $1");
      node.nodeValue = value;
    });
  }

  function publish(options) {
    localizeFrenchResults();
    setTimeout(localizeFrenchResults, 0);
    clearStatus();
    var actions = document.querySelector(".en-form-actions");
    if (!actions) return;
    var button = actions.querySelector("[data-creative-result-export]");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "en-btn";
      button.setAttribute("data-creative-result-export", "");
      button.textContent = text("Download result (TXT)", "Télécharger le résultat (TXT)");
      actions.appendChild(button);
    }
    button.onclick = function () {
      var blob = new Blob([resultText(options.name)], {
        type: "text/plain;charset=utf-8",
      });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        options.fileBase + (isFrench() ? "-resultat.txt" : "-result.txt");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 0);
      var node = statusNode();
      node.style.color = "";
      node.textContent = text(
        "TXT result downloaded.",
        "Résultat TXT téléchargé."
      );
    };
  }

  global.AfroTools = global.AfroTools || {};
  installReflowStyles();
  global.AfroTools.CreativeResultTools = Object.freeze({
    isFrench: isFrench,
    text: text,
    reject: reject,
    clearStatus: clearStatus,
    publish: publish,
    localizeFrenchResults: localizeFrenchResults,
  });
})(window);
