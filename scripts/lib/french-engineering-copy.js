'use strict';

const acorn = require('acorn');

const OWNER_COPY = {
  afrodraft: {
    name: 'AfroDraft CAO 2D',
    purpose: 'Préparez et exportez un dessin technique 2D directement dans le navigateur.',
    method: 'Définissez les unités, tracez la géométrie, ajoutez les cotes, puis contrôlez les calques avant export.',
    caveat: 'Vérifiez toutes les dimensions sur site et faites valider les plans destinés à l’exécution par un professionnel qualifié.'
  },
  'afroplan-floor-planner': {
    name: 'Planificateur de plan d’étage',
    purpose: 'Composez un plan d’étage, estimez les surfaces et préparez un quantitatif local.',
    method: 'Choisissez un modèle ou dessinez les pièces, portes et fenêtres, puis examinez les surfaces et le coût indicatif.',
    caveat: 'Le plan obtenu sert à la préparation du projet et ne remplace pas un plan architectural ou structurel approuvé.'
  },
  'solar-calculator': {
    name: 'Calculateur solaire',
    purpose: 'Dimensionnez les panneaux, la batterie et l’onduleur à partir de vos usages électriques.',
    method: 'Additionnez les appareils, leurs puissances et leurs durées d’utilisation, puis appliquez les heures solaires et la marge de sécurité.',
    caveat: 'Confirmez l’irradiation, les pertes, la tension et les prix avec un installateur avant achat.'
  },
  'floor-plan': {
    name: 'Estimateur de coût de construction',
    purpose: 'Estimez la surface bâtie et le budget de construction selon la ville et le niveau de finition.',
    method: 'Renseignez le type de bâtiment, les pièces, la surface et la finition pour obtenir un budget ventilé.',
    caveat: 'Les prix sont des hypothèses de planification; exigez des devis locaux et une étude de site.'
  },
  'boq-generator': {
    name: 'Constructeur de devis quantitatif',
    purpose: 'Préparez un devis quantitatif structuré avec postes, quantités, prix unitaires et totaux.',
    method: 'Sélectionnez un modèle, adaptez chaque ligne, puis vérifiez sous-totaux, taxes, marge et contingence.',
    caveat: 'Contrôlez les métrés et les prix auprès du métreur et des fournisseurs avant consultation.'
  },
  'structural-calc': {
    name: 'Calculateur de structure',
    purpose: 'Effectuez un prédimensionnement indicatif des poutres et des charges.',
    method: 'Saisissez la portée, les charges, les matériaux et les conditions d’appui pour examiner les dimensions proposées.',
    caveat: 'Ce prédimensionnement ne constitue pas une note de calcul signée; faites vérifier la structure par un ingénieur.'
  },
  'electrical-load': {
    name: 'Calculateur de charge électrique',
    purpose: 'Totalisez les charges, le courant et la puissance de pointe d’une installation.',
    method: 'Ajoutez les appareils, leur quantité, leur puissance et leur simultanéité, puis contrôlez phase, tension et réserve.',
    caveat: 'Un électricien qualifié doit confirmer les protections, câbles, mise à la terre et règles locales.'
  },
  'concrete-calc': {
    name: 'Calculateur de dosage du béton',
    purpose: 'Calculez les volumes de ciment, sable, granulats et eau pour un ouvrage.',
    method: 'Renseignez les dimensions, le dosage et la marge de perte pour obtenir les quantités de matériaux.',
    caveat: 'Adaptez le mélange à la résistance, aux granulats, à l’humidité et aux prescriptions du projet.'
  },
  'paint-calc': {
    name: 'Calculateur de peinture',
    purpose: 'Estimez les litres, couches et pots nécessaires pour les surfaces à peindre.',
    method: 'Saisissez murs, ouvertures, rendement, nombre de couches et marge de perte.',
    caveat: 'Le rendement réel dépend du support, de la préparation, de la couleur et du produit choisi.'
  },
  'tiles-calc': {
    name: 'Calculateur de carrelage',
    purpose: 'Calculez le nombre de carreaux, boîtes, colle et joints nécessaires.',
    method: 'Renseignez la surface, le format du carreau, le contenu des boîtes et la marge de coupe.',
    caveat: 'Vérifiez le calepinage, les lots et les réserves avant commande.'
  },
  'water-tank': {
    name: 'Dimensionnement de réservoir d’eau',
    purpose: 'Dimensionnez le stockage selon les usagers, la consommation quotidienne et l’autonomie souhaitée.',
    method: 'Le contrat accepté calcule le besoin quotidien, applique l’autonomie et la réserve, puis recommande une capacité standard.',
    caveat: 'Confirmez la qualité de l’eau, la fondation, la pompe, les canalisations et les règles sanitaires.'
  },
  'roofing-calc': {
    name: 'Calculateur de toiture',
    purpose: 'Estimez la surface de couverture, les feuilles, liteaux et accessoires.',
    method: 'Saisissez longueur, largeur, pente, débords, type de couverture et marge de coupe.',
    caveat: 'Faites contrôler la charpente, les fixations, le vent, l’étanchéité et les détails de rive.'
  },
  'borehole-cost': {
    name: 'Estimateur de coût de forage',
    purpose: 'Préparez un budget de forage, tubage, pompe, essais et équipements.',
    method: 'Renseignez profondeur, géologie, diamètre, pompe et options pour obtenir un budget ventilé.',
    caveat: 'La profondeur productive et la qualité d’eau exigent une étude hydrogéologique et des analyses.'
  },
  'rebar-calc': {
    name: 'Calculateur d’armatures',
    purpose: 'Préparez les longueurs de coupe, le poids d’acier et un bordereau d’armatures.',
    method: 'Définissez diamètre, espacement, dimensions, recouvrements et prix pour calculer barres et poids.',
    caveat: 'Les diamètres, ancrages et recouvrements doivent suivre les plans et la norme applicable.'
  },
  'generator-sizing': {
    name: 'Dimensionnement de groupe électrogène',
    purpose: 'Estimez la puissance continue et de démarrage nécessaire.',
    method: 'Additionnez les charges, appliquez les facteurs de démarrage et prévoyez une réserve d’exploitation.',
    caveat: 'Confirmez le régime, les moteurs, la température, l’altitude et la qualité de puissance avec le fournisseur.'
  },
  'boq-gen': {
    name: 'Générateur de bordereau quantitatif',
    purpose: 'Générez un bordereau indicatif à partir du type, de la surface et du niveau de finition.',
    method: 'Le calcul applique les postes et rendements du modèle, puis ventile quantités et coûts.',
    caveat: 'Le bordereau doit être remétré sur les plans définitifs avant achat ou appel d’offres.'
  },
  'home-renovation-cost': {
    name: 'Estimateur de rénovation',
    purpose: 'Évaluez un budget de rénovation par pièce, niveau de travaux et localisation.',
    method: 'Sélectionnez les pièces et travaux, ajustez les surfaces et appliquez la marge d’imprévus.',
    caveat: 'Inspectez l’existant et demandez des devis; les défauts cachés peuvent modifier fortement le coût.'
  },
  'septic-tank': {
    name: 'Dimensionnement de fosse septique',
    purpose: 'Dimensionnez le volume, les compartiments et le dispositif d’infiltration.',
    method: 'Le moteur utilise le nombre d’usagers, les effluents, la rétention, les boues et le sol.',
    caveat: 'Vérifiez le sol, les distances sanitaires, la nappe et l’autorisation auprès des autorités locales.'
  },
  'fence-cost': {
    name: 'Estimateur de coût de clôture',
    purpose: 'Estimez matériaux, poteaux, portail, main-d’œuvre et coût total d’une clôture.',
    method: 'Saisissez le périmètre, la hauteur, le type de clôture, les portails et les conditions du terrain.',
    caveat: 'Confirmez limites foncières, fondations, sécurité et prix locaux avant travaux.'
  },
  'swimming-pool-cost': {
    name: 'Estimateur de coût de piscine',
    purpose: 'Préparez dimensions, volume, équipements et budget indicatif d’une piscine.',
    method: 'Le calcul combine terrassement, structure, finition, filtration, accessoires et main-d’œuvre.',
    caveat: 'Une étude de sol et des plans techniques sont nécessaires pour le drainage, la structure et la sécurité.'
  },
  'architectural-fee': {
    name: 'Calculateur d’honoraires d’architecte',
    purpose: 'Estimez une fourchette d’honoraires selon le budget, la complexité et les services.',
    method: 'Appliquez le barème indicatif au coût de construction, puis ajustez phases et options.',
    caveat: 'Les honoraires réels dépendent du contrat, du pays, du périmètre et des conditions de mission.'
  },
  'site-clearance': {
    name: 'Estimateur de préparation de terrain',
    purpose: 'Estimez débroussaillage, arbres, décapage, démolition et évacuation.',
    method: 'Le moteur applique les rendements et prix du pays à la surface, au terrain et aux options.',
    caveat: 'Confirmez accès, déchets, réseaux, environnement et volumes après visite du site.'
  },
  'road-construction-cost': {
    name: 'Estimateur de construction routière',
    purpose: 'Estimez le coût d’une route selon longueur, largeur, revêtement et terrain.',
    method: 'Le moteur applique les prix du pays, les coefficients de terrain et les options de drainage ou éclairage.',
    caveat: 'Une étude topographique, géotechnique, hydraulique et de trafic reste indispensable.'
  },
  'scaffolding-calc': {
    name: 'Calculateur d’échafaudage',
    purpose: 'Calculez surface, tubes, planchers, raccords, location ou achat et main-d’œuvre.',
    method: 'Le moteur partagé utilise périmètre, hauteur, type, durée et tarifs du pays.',
    caveat: 'Un responsable compétent doit vérifier ancrages, charges, stabilité, accès et inspections.'
  },
  'window-door-sizing': {
    name: 'Dimensionnement des fenêtres et portes',
    purpose: 'Préparez un tableau de fenêtres et portes avec ventilation, dimensions et coûts.',
    method: 'Le moteur partagé combine pièces, surface, matériaux, types, quincaillerie et tarifs du pays.',
    caveat: 'Vérifiez ventilation, lumière, sécurité, évacuation, linteaux et règles locales.'
  },
  'plumbing-material': {
    name: 'Calculateur de matériaux de plomberie',
    purpose: 'Estimez tuyaux, raccords, appareils sanitaires, réservoir et main-d’œuvre.',
    method: 'Le moteur partagé applique le type de bâtiment, les salles d’eau, le matériau et les tarifs du pays.',
    caveat: 'Confirmez pression, diamètres, pentes, ventilation, qualité d’eau et prescriptions locales.'
  }
};

const COMMON_PAIRS = [
  ['Fill in your project details on the left and click "Generate Bill of Quantities" to get a full material list with local prices.', 'Renseignez les paramètres du projet à gauche, puis cliquez sur « Générer le bordereau quantitatif » pour obtenir la liste chiffrée des matériaux.'],
  ['The Bill of Quantities Generator takes your measurements and quantities and shows the working, not just a single number.', 'Le générateur applique vos mesures et quantités et présente le détail du calcul, pas seulement un total.'],
  ['Enter your measurements and quantities in the fields above. The Bill of Quantities Generator then gives you a costed material and labour estimate you can use straight away.', 'Saisissez vos mesures et quantités ci-dessus. Le générateur produit alors une estimation détaillée des matériaux et de la main-d’œuvre.'],
  ['It is as accurate as the values you enter and shows the assumptions behind the result. Always confirm current local material prices and site specifics before you rely on it.', 'La précision dépend des valeurs saisies et des hypothèses affichées. Confirmez toujours les prix locaux et les conditions du chantier avant utilisation.'],
  ['Yes — it is completely free, works on any phone or computer with no signup, and is built for all 54 African countries.', 'Oui. L’outil est gratuit, fonctionne sur téléphone ou ordinateur sans inscription et couvre les pays africains proposés dans le sélecteur.'],
  ['Construction budgets fail when material pricing, labour, contingency, and scope changes are separated. A BOQ-style tool works best when cost research is translated into line items early.', 'Un budget de construction devient fragile lorsque matériaux, main-d’œuvre, imprévus et évolutions du périmètre sont traités séparément. Structurez tôt les recherches de prix en postes quantifiés.'],
  ['Get a detailed material list with local African prices. Nigeria, Kenya, Ghana, South Africa, and 15+ more countries. Export to CSV or print.', 'Obtenez une liste détaillée des matériaux avec des prix indicatifs par pays africain. Exportez le résultat en CSV ou imprimez-le.'],
  ['Not sure how to get the most from the Bill of Quantities Generator? Enter your measurements and quantities and it returns a costed material and labour estimate — built for all 54 African countries.', 'Saisissez les dimensions et quantités du projet pour obtenir une estimation chiffrée des matériaux et de la main-d’œuvre, adaptée au pays sélectionné.'],
  ['Scope drift, outdated material assumptions, and missing contingency are the most common drivers.', 'Les principales causes sont l’évolution du périmètre, des prix de matériaux obsolètes et l’absence de provision pour imprévus.'],
  ['As soon as you have a draft scope, price assumptions, or a client brief worth turning into an estimate.', 'Dès que vous disposez d’un périmètre initial, d’hypothèses de prix ou d’un cahier des charges à transformer en estimation.'],
  ['confirm current local material prices and site specifics before you rely on the result.', 'confirmez les prix locaux actuels et les conditions propres au chantier avant de vous fier au résultat.'],
  ['a costed material and labour estimate, so you can move from a quick look to a real decision.', 'une estimation chiffrée des matériaux et de la main-d’œuvre pour préparer une décision concrète.'],
  ['Translate material and scope assumptions into a more structured bill of quantities.', 'Transformez les hypothèses de matériaux et de périmètre en bordereau quantitatif structuré.'],
  ['Use current price research to improve estimating.', 'Utilisez des prix récents pour améliorer l’estimation.'],
  ['Estimate pre-construction and site-prep spend.', 'Estimez les dépenses d’études et de préparation du chantier.'],
  ['Model project budget ranges and contingency.', 'Modélisez les fourchettes budgétaires et les imprévus du projet.'],
  ['Generate Bill of Quantities', 'Générer le bordereau quantitatif'],
  ['Bill of Quantities Generator: quick guide', 'Générateur de bordereau quantitatif : guide rapide'],
  ['Bill of Quantities Generator FAQ', 'Questions fréquentes sur le bordereau quantitatif'],
  ['How do I use the Bill of Quantities Generator?', 'Comment utiliser le générateur de bordereau quantitatif ?'],
  ['How accurate is the Bill of Quantities Generator?', 'Quelle est la précision du bordereau quantitatif ?'],
  ['Is the Bill of Quantities Generator free, and does it cover my country?', 'Le générateur est-il gratuit et couvre-t-il mon pays ?'],
  ['Bill of Quantities Generator', 'Générateur de bordereau quantitatif'],
  ['Bill of Quantities', 'Bordereau quantitatif'],
  ['for African Construction', 'pour les projets de construction en Afrique'],
  ['Project Details', 'Paramètres du projet'],
  ['Project Country', 'Pays du projet'],
  ['Floor Area (m²)', 'Surface au sol (m²)'],
  ['Wall Height (m)', 'Hauteur des murs (m)'],
  ['Wall Type', 'Type de mur'],
  ['Roof Type', 'Type de toiture'],
  ['Finishing Level', 'Niveau de finition'],
  ['Adjust Quantities (Optional)', 'Ajuster les quantités (facultatif)'],
  ['No. of Kitchen Sinks', 'Nombre d’éviers de cuisine'],
  ['No. of Sockets/Room', 'Nombre de prises par pièce'],
  ['No. of WC / Toilets', 'Nombre de WC'],
  ['No. of Windows', 'Nombre de fenêtres'],
  ['No. of Showers', 'Nombre de douches'],
  ['No. of Bedrooms', 'Nombre de chambres'],
  ['No. of Doors', 'Nombre de portes'],
  ['Glazed Doors', 'Portes vitrées'],
  ['Include Inverter?', 'Inclure un onduleur ?'],
  ['Est. Material Cost', 'Coût estimé des matériaux'],
  ['Est. Labour (40%)', 'Main-d’œuvre estimée (40 %)'],
  ['Grand Total (+ Labour)', 'Total général (main-d’œuvre incluse)'],
  ['Ready to Generate Your BOQ', 'Prêt à générer votre bordereau'],
  ['15+ African Countries', '15 pays africains et plus'],
  ['60+ Material Items', 'Plus de 60 postes de matériaux'],
  ['Local Prices', 'Prix locaux indicatifs'],
  ['Export CSV / Print', 'Export CSV / impression'],
  ['Residential + Commercial', 'Résidentiel et commercial'],
  ['Practical workflow', 'Parcours pratique'],
  ['What you get:', 'Résultat obtenu :'],
  ['What to check:', 'Points à vérifier :'],
  ['Turn price research into a usable BOQ', 'Transformer les recherches de prix en bordereau exploitable'],
  ['Build a cleaner quantity and cost estimate', 'Structurer une estimation claire des quantités et des coûts'],
  ['BOQ Construction Nigeria 2026', 'Bordereau de construction au Nigeria en 2026'],
  ['Construction Material Prices Nigeria', 'Prix des matériaux de construction au Nigeria'],
  ['Construction Budget', 'Budget de construction'],
  ['Survey Cost', 'Coût des études de terrain'],
  ['What causes the biggest BOQ errors?', 'Quelles sont les principales causes d’erreur dans un bordereau ?'],
  ['When should I move from a blog guide into the tool?', 'Quand passer du guide à l’outil ?'],
  ['Construction Cost Cluster', 'Dossier coûts de construction'],
  ['Quick answer', 'Réponse rapide'],
  ['Use the tool', 'Utiliser l’outil'],
  ['Related guides', 'Guides associés'],
  ['Open BOQ Generator', 'Ouvrir le générateur de bordereau'],
  ['A practical BOQ walkthrough for Nigeria.', 'Guide pratique pour préparer un bordereau au Nigeria.'],
  ['Residential – 1-Bedroom Bungalow', 'Résidentiel – bungalow 1 chambre'],
  ['Residential – 2-Bedroom Bungalow', 'Résidentiel – bungalow 2 chambres'],
  ['Residential – 3-Bedroom Bungalow', 'Résidentiel – bungalow 3 chambres'],
  ['Residential – 4-Bedroom House', 'Résidentiel – maison 4 chambres'],
  ['Residential – 5-Bedroom Duplex', 'Résidentiel – duplex 5 chambres'],
  ['Commercial – Small Office (100m²)', 'Commercial – petit bureau (100 m²)'],
  ['Warehouse / Store (200m²)', 'Entrepôt ou magasin (200 m²)'],
  ['Custom (Enter Area Below)', 'Personnalisé (saisir la surface ci-dessous)'],
  ['Corrugated Iron / Long-Span Zinc', 'Tôle ondulée ou bac acier longue portée'],
  ['Concrete Flat Roof / Slab', 'Toiture-terrasse ou dalle en béton'],
  ['Basic (Plaster + Paint)', 'Basique (enduit et peinture)'],
  ['Standard (Tiles + Paint)', 'Standard (carrelage et peinture)'],
  ['Premium (Full Finishes)', 'Supérieur (finitions complètes)'],
  ['9″ Block (225mm)', 'Bloc de 225 mm'],
  ['6″ Block (150mm)', 'Bloc de 150 mm'],
  ['Clay Brick', 'Brique en terre cuite'],
  ['Clay Roof Tiles', 'Tuiles en terre cuite'],
  ['Asphalt Shingles', 'Bardeaux bitumés'],
  ['3 Floors', '3 niveaux'],
  ['Floors', 'Nombre de niveaux'],
  ['Contingency', 'Imprévus'],
  ['Plumbing', 'Plomberie'],
  ['Electrical', 'Électricité'],
  ['Print BOQ', 'Imprimer le bordereau'],
  ['BOQ Generator', 'Générateur de bordereau'],
  ['Helpful next steps', 'Étapes suivantes utiles'],
  ['FloorArea', 'Surface au sol'],
  ['WallHeight', 'Hauteur des murs'],
  ['Finishing', 'Niveau de finition'],
  ['NumDoors', 'Nombre de portes'],
  ['NumWindows', 'Nombre de fenêtres'],
  ['NumGlazed', 'Nombre de portes vitrées'],
  ['NumWC', 'Nombre de WC'],
  ['NumShowers', 'Nombre de douches'],
  ['NumSinks', 'Nombre d’éviers'],
  ['NumBeds', 'Nombre de chambres'],
  ['NumSockets', 'Nombre de prises'],
  ['Inverter YN', 'Inclure un onduleur'],
  ['Uganda', 'Ouganda'],
  ['Tanzania', 'Tanzanie'],
  ['Rwanda', 'Rwanda'],
  ['Ethiopia', 'Éthiopie'],
  ['Senegal', 'Sénégal'],
  ['Cameroon', 'Cameroun'],
  ['Zambia', 'Zambie'],
  ['Zimbabwe', 'Zimbabwe'],
  ['Egypt', 'Égypte'],
  ['Morocco', 'Maroc'],
  ['Country data not available', 'Les données du pays sélectionné ne sont pas disponibles.'],
  ['Enter valid positive dimensions and quantities before generating the BOQ.', 'Saisissez des dimensions et quantités positives valides avant de générer le bordereau.'],
  ['A. SUBSTRUCTURE (Foundation)', 'A. INFRASTRUCTURE (fondations)'],
  ['B. SUPERSTRUCTURE (Walls)', 'B. ÉLÉVATION (murs)'],
  ['D. DOORS & WINDOWS', 'D. PORTES ET FENÊTRES'],
  ['E. FINISHES', 'E. FINITIONS'],
  ['F. PLUMBING', 'F. PLOMBERIE'],
  ['G. ELECTRICAL', 'G. ÉLECTRICITÉ'],
  ['C. ROOF', 'C. TOITURE'],
  ['Excavation for strip foundation', 'Fouilles pour semelles filantes'],
  ['Hardcore fill (150mm compacted)', 'Remblai compacté de 150 mm'],
  ['Cement (1:2:4 blinding, 50mm)', 'Ciment pour béton de propreté 1:2:4, épaisseur 50 mm'],
  ['9" blocks for foundation walls', 'Blocs de 225 mm pour murs de fondation'],
  ['Portland Cement (mortar)', 'Ciment Portland pour mortier'],
  ['Sharp Sand (wall mortar)', 'Sable pour mortier de maçonnerie'],
  ['Sharp Sand', 'Sable'],
  ['Reinforcement steel (Y10, Y12)', 'Acier d’armature Y10 et Y12'],
  ['Reinforcement steel (Y12 slab)', 'Acier d’armature Y12 pour dalle'],
  ['Ring beam steel (Y12)', 'Acier Y12 pour chaînage'],
  ['Ring beam formwork + concrete', 'Coffrage et béton du chaînage'],
  ['Long-span aluminium zinc sheet (0.55mm)', 'Bac de couverture aluminium-zinc 0,55 mm'],
  ['Hardwood rafters (50×100mm)', 'Chevrons en bois dur 50 × 100 mm'],
  ['Hardwood rafters & battens', 'Chevrons et liteaux en bois dur'],
  ['Ceiling board (PVC or hardboard)', 'Panneaux de plafond en PVC ou fibres dures'],
  ['Roofing screws (with washers)', 'Vis de toiture avec rondelles'],
  ['Ridge cap / flashing', 'Faîtière et solins'],
  ['Ridge tiles', 'Tuiles faîtières'],
  ['Roofing felt / membrane', 'Feutre ou membrane de toiture'],
  ['Portland Cement (slab concrete)', 'Ciment Portland pour béton de dalle'],
  ['Granite aggregate', 'Granulats concassés'],
  ['Formwork (plywood + props)', 'Coffrage en contreplaqué avec étais'],
  ['Wooden panel doors (900×2100mm)', 'Portes intérieures en bois 900 × 2 100 mm'],
  ['Steel security door (main entrance)', 'Porte de sécurité en acier pour entrée principale'],
  ['Aluminium sliding window (1500×1200mm)', 'Fenêtre coulissante en aluminium 1 500 × 1 200 mm'],
  ['Glazed entrance door', 'Porte d’entrée vitrée'],
  ['Door frames (hardwood)', 'Huisseries en bois dur'],
  ['Door hardware (hinges, locks, handles)', 'Quincaillerie de porte : charnières, serrures et poignées'],
  ['Render/plaster (interior walls)', 'Enduit des murs intérieurs'],
  ['Floor tiles (600×600mm) – all areas', 'Carrelage 600 × 600 mm pour toutes les surfaces'],
  ['Floor tiles (600×600mm)', 'Carrelage de sol 600 × 600 mm'],
  ['Plain screed (where no tiles)', 'Chape simple dans les zones non carrelées'],
  ['Wall tiles – wet areas (200×300mm)', 'Faïence 200 × 300 mm pour zones humides'],
  ['Emulsion paint – interior', 'Peinture intérieure en émulsion'],
  ['Gloss/trim paint – doors + windows', 'Peinture de finition pour portes et fenêtres'],
  ['Tile adhesive (25kg bags)', 'Colle à carrelage en sacs de 25 kg'],
  ['Tile grout (5kg bags)', 'Joint de carrelage en sacs de 5 kg'],
  ['WC suite (pan, cistern, seat)', 'Ensemble WC avec cuvette, réservoir et abattant'],
  ['Shower set (tray, mixer, head)', 'Ensemble douche avec receveur, mitigeur et pommeau'],
  ['Kitchen sink (stainless, double bowl)', 'Évier de cuisine double bac en inox'],
  ['PVC waste pipe 110mm', 'Canalisation d’évacuation PVC de 110 mm'],
  ['PVC water supply pipe 32mm', 'Canalisation d’alimentation PVC de 32 mm'],
  ['Overhead water tank (1000L)', 'Réservoir d’eau surélevé de 1 000 L'],
  ['Ball float valve + fittings', 'Robinet à flotteur et raccords'],
  ['Water pump (0.5HP)', 'Pompe à eau de 0,5 ch'],
  ['2.5mm² electrical wire', 'Câble électrique de 2,5 mm²'],
  ['1.5mm² lighting wire', 'Câble d’éclairage de 1,5 mm²'],
  ['Socket outlets (double)', 'Prises doubles'],
  ['Light switches (single)', 'Interrupteurs simples'],
  ['Distribution board (8-way MCB)', 'Tableau électrique à 8 disjoncteurs'],
  ['MCB circuit breakers (various)', 'Disjoncteurs modulaires'],
  ['Conduit (PVC 20mm)', 'Gaine PVC de 20 mm'],
  ['Inverter/UPS (2kVA) + battery', 'Onduleur de 2 kVA avec batterie'],
  ['Earth rod + earth wire', 'Piquet et conducteur de terre'],
  ['Material SUBTOTAL', 'SOUS-TOTAL MATÉRIAUX'],
  ['GRAND TOTAL', 'TOTAL GÉNÉRAL'],
  ['Labour only', 'Main-d’œuvre uniquement'],
  ['Foundation walling', 'Maçonnerie de fondation'],
  ['Foundation mortar', 'Mortier de fondation'],
  ['Foundation RC', 'Béton armé de fondation'],
  ['Mass concrete', 'Béton de masse'],
  ['All floors', 'Tous les niveaux'],
  ['Per floor ring beam', 'Par chaînage de niveau'],
  ['Standard internal', 'Modèle intérieur standard'],
  ['Standard casement', 'Châssis standard'],
  ['Bathrooms + kitchen', 'Salles d’eau et cuisine'],
  ['Lighting circuit', 'Circuit d’éclairage'],
  ['Earthing system', 'Système de mise à la terre'],
  ['Ring main', 'Circuit principal'],
  ['Estimated', 'Estimatif'],
  ['Backup power', 'Alimentation de secours'],
  ['Materials Total', 'Total des matériaux'],
  ['Subtotal', 'Sous-total'],
  ['Labour', 'Main-d’œuvre'],
  ['bags', 'sacs'],
  ['blocks', 'blocs'],
  ['sheets', 'feuilles'],
  ['boxes', 'boîtes'],
  ['sets', 'ensembles'],
  ['tins', 'pots'],
  ['pcs', 'pièces'],
  ['m run', 'm lin.'],
  ['Generator', 'Générateur'],
  ['Nigerian Institute of Architects (NIA). Fee scale set by Architects Registration Council of Nigeria (ARCON). Minimum fees apply.', 'Institut nigérian des architectes (NIA). Le barème est fixé par le Conseil d’enregistrement des architectes du Nigeria (ARCON) et des honoraires minimaux s’appliquent.'],
  ['QS students learning bill preparation', 'Étudiants métreurs apprenant à préparer des bordereaux'],
  ['Is my data stored online?', 'Mes données sont-elles conservées en ligne ?'],
  ['Africa\'s first browser-based CAD application. No download. No subscription. Draw, dimension, annotate, and export — all from your browser with 155+ professional features.', 'La première application de CAO africaine dans le navigateur. Aucun téléchargement ni abonnement : dessinez, cotez, annotez et exportez avec plus de 155 fonctions professionnelles.'],
  ['Room, shop, fence, site, classroom, and kiosk templates load as deterministic layers, geometry, and dimensions in AfroDraft.', 'Les modèles de pièce, boutique, clôture, site, salle de classe et kiosque chargent dans AfroDraft des calques, géométries et cotes déterministes.'],
  ['Interior walls, openings, furniture, room labels, and dimensions.', 'Murs intérieurs, ouvertures, mobilier, noms de pièces et cotes.'],
  ['Sales area, storage, counter, shelves, and entrance dimensions.', 'Surface de vente, réserve, comptoir, rayonnages et dimensions de l’entrée.'],
  ['Boundary, post spacing, gate opening, and plot dimensions.', 'Limites, espacement des poteaux, ouverture du portail et dimensions de la parcelle.'],
  ['Plot, building footprint, driveway, setbacks, and landscape markers.', 'Parcelle, emprise du bâtiment, voie d’accès, reculs et repères paysagers.'],
  ['Board, teacher desk, student desks, openings, and dimensions.', 'Tableau, bureau de l’enseignant, tables des élèves, ouvertures et cotes.'],
  ['Service hatch, counter, shelves, fixture, and compact dimensions.', 'Guichet de service, comptoir, étagères, équipements et dimensions compactes.'],
  ['Everything You Need to Draft Professionally', 'Tout le nécessaire pour dessiner professionnellement'],
  ['155+ commands across 8 categories — from basic geometry to full layout and export workflows.', 'Plus de 155 commandes dans huit catégories, de la géométrie de base à la mise en page et aux exports.'],
  ['Lines, circles, arcs, polylines, splines, polygons, rectangles, ellipses — all with precision input.', 'Lignes, cercles, arcs, polylignes, splines, polygones, rectangles et ellipses avec saisie précise.'],
  ['Move, copy, rotate, scale, mirror, trim, extend, offset, fillet, chamfer, array, and explode.', 'Déplacez, copiez, pivotez, redimensionnez, symétrisez, ajustez, prolongez, décalez, raccordez, chanfreinez, répétez et décomposez.'],
  ['Linear, aligned, angular, and radial dimensions. Text, leaders, hatches, and tables.', 'Cotes linéaires, alignées, angulaires et radiales, avec textes, repères, hachures et tableaux.'],
  ['15 snap types including endpoint, midpoint, center, intersection. Ortho mode and polar tracking.', 'Quinze accrochages, dont extrémité, milieu, centre et intersection, avec mode orthogonal et suivi polaire.'],
  ['Full layer management system with linetypes, lineweights, colors, lock, freeze, and visibility control.', 'Gestion complète des calques : types et épaisseurs de ligne, couleurs, verrouillage, gel et visibilité.'],
  ['Paper space with viewports, title blocks, and sheet sizes. Print-ready layout composition.', 'Espace papier avec fenêtres, cartouches et formats de feuille pour composer une mise en page prête à imprimer.'],
  ['Export to DXF (AutoCAD compatible), SVG, PNG, and PDF directly from layout views.', 'Exportez directement les mises en page en DXF compatible AutoCAD, SVG, PNG et PDF.'],
  ['4 professional themes — Light, Dark, Blueprint, and High Contrast. Work the way you prefer.', 'Quatre thèmes professionnels — clair, sombre, plan bleu et contraste élevé — pour adapter l’espace de travail.'],
  ['From Blank Canvas to Finished Drawing', 'Du canevas vierge au dessin final'],
  ['Click "Launch" to open the full CAD editor directly in your browser. Works on desktop, tablet, or phone.', 'Cliquez sur « Lancer » pour ouvrir l’éditeur de CAO complet dans le navigateur, sur ordinateur, tablette ou téléphone.'],
  ['Use the ribbon toolbar or type commands like LINE, CIRCLE, RECT. Keyboard shortcuts for everything.', 'Utilisez le ruban ou saisissez des commandes comme LINE, CIRCLE et RECT ; chaque fonction dispose aussi de raccourcis clavier.'],
  ['Add dimensions, text labels, leaders, and hatches. Use layers to organise your drawing.', 'Ajoutez cotes, textes, repères et hachures, puis organisez le dessin avec les calques.'],
  ['Save your drawing locally or export to DXF (open in AutoCAD), SVG, PNG, or print-ready PDF.', 'Enregistrez le dessin localement ou exportez-le en DXF, SVG, PNG ou PDF prêt à imprimer.'],
  ['Built for African Professionals & Students', 'Conçu pour les professionnels et étudiants africains'],
  ['Engineering students who can\'t afford AutoCAD licenses', 'Étudiants en ingénierie qui ne peuvent pas financer une licence AutoCAD'],
  ['Architects drafting floor plans, elevations, and sections', 'Architectes dessinant des plans, élévations et coupes'],
  ['Structural engineers creating beam and column layouts', 'Ingénieurs structure préparant les plans de poutres et poteaux'],
  ['Anyone needing precise, professional 2D technical drawings', 'Toute personne ayant besoin de dessins techniques 2D précis et professionnels'],
  ['Lecturers and instructors teaching CAD fundamentals', 'Enseignants et formateurs transmettant les bases de la CAO'],
  ['Interior designers sketching room layouts and furniture plans', 'Architectes d’intérieur esquissant des pièces et plans de mobilier'],
  ['Yes, completely free. All 155+ features are available without signing up, downloading software, or paying anything. We believe every African student and professional deserves access to quality CAD tools.', 'Oui, entièrement gratuit. Les 155 fonctions et plus sont accessibles sans inscription, téléchargement ni paiement afin d’offrir des outils de CAO de qualité aux étudiants et professionnels africains.'],
  ['Yes. Export your drawing as DXF and open it in AutoCAD, BricsCAD, FreeCAD, or any other CAD software that supports the DXF format.', 'Oui. Exportez le dessin en DXF puis ouvrez-le dans AutoCAD, BricsCAD, FreeCAD ou tout logiciel de CAO compatible.'],
  ['Once loaded, AfroDraft runs entirely in your browser. Your drawings are saved locally on your device. An internet connection is only needed for the initial page load.', 'Après le chargement initial, AfroDraft fonctionne entièrement dans le navigateur et conserve les dessins localement sur votre appareil.'],
  ['AfroDraft is touch-enabled and works on tablets and phones. For the best experience, we recommend a device with at least a 10-inch screen and a stylus.', 'AfroDraft prend en charge le tactile sur tablette et téléphone. Pour un meilleur confort, utilisez un écran d’au moins dix pouces et un stylet.'],
  ['AfroDraft covers the core 2D drafting workflow: drawing, modifying, dimensioning, layers, and exporting. It won\'t replace AutoCAD for 3D modelling or complex BIM workflows, but for 2D technical drawings it\'s a solid free alternative.', 'AfroDraft couvre le dessin 2D, les modifications, la cotation, les calques et les exports. Il ne remplace pas AutoCAD pour la 3D ou les processus BIM complexes, mais constitue une solution gratuite solide pour les dessins techniques 2D.'],
  ['All drawings are stored in your browser\'s local storage on your device. Nothing is uploaded to any server. You can also export files to save them permanently on your computer.', 'Tous les dessins restent dans le stockage local du navigateur ; rien n’est envoyé à un serveur. Vous pouvez aussi exporter les fichiers sur votre ordinateur.'],
  ['Launch AfroDraft and create your first professional 2D drawing in minutes. No signup required.', 'Lancez AfroDraft et créez votre premier dessin 2D professionnel en quelques minutes, sans inscription.'],
  ['Professional 2D CAD', 'CAO 2D professionnelle'],
  ['FLAGSHIP TOOL', 'OUTIL PHARE'],
  ['See Features', 'Voir les fonctions'],
  ['Your Drawings', 'Vos dessins'],
  ['New Drawing', 'Nouveau dessin'],
  ['Start from editable local CAD drawings', 'Commencez avec des dessins CAO locaux modifiables'],
  ['Room plan', 'Plan de pièce'],
  ['Shop plan', 'Plan de boutique'],
  ['Fence layout', 'Plan de clôture'],
  ['Simple site plan', 'Plan de site simple'],
  ['Classroom plan', 'Plan de salle de classe'],
  ['Kiosk plan', 'Plan de kiosque'],
  ['Open editable template', 'Ouvrir le modèle modifiable'],
  ['Features', 'Fonctions'],
  ['Drawing', 'Dessin'],
  ['Modify', 'Modifier'],
  ['Annotate', 'Annoter'],
  ['Precision', 'Précision'],
  ['Layers', 'Calques'],
  ['Layout', 'Mise en page'],
  ['How It Works', 'Fonctionnement'],
  ['Draw with Commands', 'Dessiner avec les commandes'],
  ['Annotate & Dimension', 'Annoter et coter'],
  ['Export to DXF or PDF', 'Exporter en DXF ou PDF'],
  ['Who It\'s For', 'Public concerné'],
  ['Frequently Asked Questions', 'Questions fréquentes'],
  ['Is AfroDraft really free?', 'AfroDraft est-il vraiment gratuit ?'],
  ['Can I open AfroDraft files in AutoCAD?', 'Puis-je ouvrir les fichiers AfroDraft dans AutoCAD ?'],
  ['Does it work offline?', 'Fonctionne-t-il hors connexion ?'],
  ['Can I use it on mobile?', 'Puis-je l’utiliser sur mobile ?'],
  ['How does it compare to AutoCAD?', 'Comment se compare-t-il à AutoCAD ?'],
  ['Where are my drawings stored?', 'Où mes dessins sont-ils conservés ?'],
  ['Ready to Start Drawing?', 'Prêt à commencer le dessin ?'],
  ['Commands', 'Commandes'],
  ['Themes', 'Thèmes'],
  ['Price', 'Prix'],
  ['Free', 'Gratuit'],
  ['Four steps. No installation. No account required.', 'Quatre étapes. Aucune installation. Aucun compte requis.'],
  ['Nigeria fallback rates', 'Tarifs de repli pour le Nigeria'],
  ['Looks ready.', 'Le plan semble prêt.'],
  ['Include roof sheets', 'Inclure les feuilles de toiture'],
  ['Include roofing sheets', 'Inclure les feuilles de toiture'],
  ['fallback rates', 'tarifs de repli'],
  ['Roofing sheets', 'Feuilles de toiture'],
  ['Tool:', 'Outil :'],
  ['Floor finish per m2', 'Finition du sol par m²'],
  ['Furniture', 'Mobilier'],
  ['wall length', 'longueur des murs'],
  [' bars | ', ' barres | '],
  ['% wastage included', '% de perte incluse'],
  ['With Wastage', 'Avec pertes'],
  ['roof sheets', 'feuilles de toiture'],
  ['on canvas', 'sur le canevas'],
  ['Snap grid', 'Aligner sur la grille'],
  ['Tool: Select', 'Outil : sélection'],
  ['Beam Design', 'Conception de poutre'],
  ['Column Design', 'Conception de poteau'],
  ['Slab Design', 'Conception de dalle'],
  ['Pad Footing', 'Semelle isolée'],
  ['Simply Supported Beam', 'Poutre simplement appuyée'],
  ['Beam Width', 'Largeur de poutre'],
  ['Beam Results', 'Résultats de la poutre'],
  ['Beam Size', 'Dimensions de la poutre'],
  ['Required As', 'Section d’acier requise'],
  ['Suggested bars (bottom)', 'Armatures proposées (nappe inférieure)'],
  ['Per beam element (section × span)', 'Par élément de poutre (section × portée)'],
  ['UPS (small)', 'Onduleur (petit)'],
  ['demand load (includes 25% margin for motor starting surges).', 'de charge appelée (avec une marge de 25 % pour les pointes de démarrage des moteurs).'],
  ['for your demand load of', 'pour votre charge appelée de'],
  ['Popular sizes in Africa:', 'Modèles courants en Afrique :'],
  ['kW demand load (includes 25% margin for motor starting surges). Popular sizes in Africa:', 'kW de charge appelée (avec une marge de 25 % pour les pointes de démarrage des moteurs). Modèles courants en Afrique :'],
  ['Columns, heavy', 'Poteaux, sollicitation élevée'],
  ['N/mm² = characteristic compressive strength at 28 days. Higher grade = more cement per m³ = higher cost.', 'N/mm² = résistance caractéristique à la compression à 28 jours. Une classe supérieure exige davantage de ciment par m³ et augmente le coût.'],
  ['Recommended Tank Size', 'Capacité de réservoir recommandée'],
  ['Recommended Tank Diameter', 'Diamètre de réservoir recommandé'],
  ['Backup Planning', 'Planification de l’autonomie'],
  ['Heavy Laundry', 'Lessive intensive'],
  ['Backup Period', 'Période d’autonomie'],
  ['days backup', 'jours d’autonomie'],
  ['day backup', 'jour d’autonomie'],
  ['surface or submersible pump', 'pompe de surface ou immergée'],
  ['flow rate', 'débit'],
  ['from tank to building', 'du réservoir au bâtiment'],
  ['Ground-level tanks need a pump to push water to overhead distribution. Consider a pressure tank for consistent pressure.', 'Les réservoirs au sol nécessitent une pompe pour alimenter la distribution en hauteur. Prévoyez un ballon de pression pour stabiliser la pression.'],
  ['Brands: Geepee, Sintex, Polytank, Roto. Prices vary by brand and location.', 'Marques : Geepee, Sintex, Polytank, Roto. Les prix varient selon la marque et le lieu.'],
  ['Based on', 'Calcul fondé sur'],
  [' people x ', ' personnes × '],
  ['L/day x ', ' L/jour × '],
  [' days = ', ' jours = '],
  [' days backup', ' jours d’autonomie'],
  [' surface or submersible pump (flow rate ', ' pompe de surface ou immergée (débit '],
  [' inch (15mm) PPR or HDPE from tank to building', ' pouce (15 mm) en PPR ou PEHD du réservoir au bâtiment'],
  ['Brands:', 'Marques :'],
  ['Prices vary by brand and location.', 'Les prix varient selon la marque et le lieu.'],
  ['needed', 'nécessaires'],
  ['Roof Area / Sheet Coverage Area = Number of Sheets', 'Surface de toiture / surface couverte par feuille = nombre de feuilles'],
  ['Corrugated iron sheets', 'Feuilles de tôle ondulée'],
  ['Materials Required', 'Matériaux nécessaires'],
  ['Roof Sheets', 'Feuilles de toiture'],
  ['Sheets Required', 'Feuilles nécessaires'],
  [' long each', ' de longueur chacune'],
  [' sheets', ' feuilles'],
  ['long each', 'de longueur chacune'],
  ['Obtain required permits/licences', 'Obtenez les permis et autorisations nécessaires'],
  ['metres total length', 'mètres de longueur totale'],
  ['waste included', 'de perte incluse'],
  [' waste included', ' de perte incluse'],
  ['With waste', 'Avec pertes'],
  ['With Waste', 'Avec pertes'],
  ['Total Bars', 'Nombre total de barres'],
  ['tonnes ×', 'tonnes ×'],
  ['tonne (incl. 10% wastage). Prices are indicative — verify with your supplier.', 'tonne (avec 10 % de perte). Les prix sont indicatifs — vérifiez-les auprès de votre fournisseur.'],
  ['% wastage). Prices are indicative — verify with your supplier.', '% de perte). Les prix sont indicatifs — vérifiez-les auprès de votre fournisseur.'],
  ['Refrigerator (Small)', 'Réfrigérateur (petit)'],
  ['Backup power check', 'Contrôle de l’alimentation de secours'],
  ['Recommended KVA', 'Puissance recommandée (kVA)'],
  ['Most generators have a power factor of 0.8, meaning a 10 KVA generator delivers about 8 KW of usable power.', 'La plupart des groupes électrogènes ont un facteur de puissance de 0,8 : un groupe de 10 kVA fournit donc environ 8 kW de puissance utile.'],
  ['Based on your', 'D’après vos'],
  ['appliances totalling', 'appareils totalisant'],
  ['running load, with startup surge of', 'de charge en fonctionnement, avec une pointe de démarrage de'],
  ['This provides', 'Cela fournit'],
  ['headroom above your running load for efficiency and longevity.', 'de marge au-dessus de la charge en fonctionnement, pour le rendement et la longévité.'],
  ['A petrol inverter generator would work well for this load.', 'Un groupe électrogène à essence avec onduleur conviendrait à cette charge.'],
  ['Sizing ready. Copy the load schedule or download the CSV before requesting quotes.', 'Dimensionnement prêt. Copiez le tableau de charges ou téléchargez le CSV avant de demander des devis.'],
  ['Sizing ready. Copy the load schedule or download CSV before requesting quotes.', 'Dimensionnement prêt. Copiez le tableau de charges ou téléchargez le CSV avant de demander des devis.'],
  ['Recommended ', 'Puissance recommandée : '],
  ['Recommended', 'Recommandé'],
  [' KVA for ', ' kVA pour '],
  [' kW running load and ', ' kW en fonctionnement et '],
  [' kW startup load.', ' kW au démarrage.'],
  ['for 0.6 kW running load and 0.9 kW startup load.', 'pour 0,6 kW en fonctionnement et 0,9 kW au démarrage.'],
  ['Prices based on Nigeria Q1 2025 market rates. Verify with local suppliers before finalising. Exchange rates may vary.', 'Prix fondés sur les tarifs du marché nigérian au premier trimestre 2025. Vérifiez-les auprès des fournisseurs locaux avant validation. Les taux de change peuvent varier.'],
  ['Prices based on ', 'Prix fondés sur '],
  [' Q1 2025 market rates. Verify with local suppliers before finalising. Exchange rates may vary.', ' au premier trimestre 2025. Vérifiez-les auprès des fournisseurs locaux avant validation. Les taux de change peuvent varier.'],
  ['Rate (₦)', 'Prix unitaire (₦)'],
  ['Rate (', 'Prix unitaire ('],
  ['Labour only', 'Main-d’œuvre uniquement'],
  ['Ring beam steel', 'Acier de chaînage'],
  ['Per floor ring beam', 'Par chaînage de niveau'],
  ['Ring beam formwork + concrete', 'Coffrage et béton du chaînage'],
  ['1200×2400mm sheets', 'feuilles de 1 200 × 2 400 mm'],
  ['roof screws (with washers)', 'vis de toiture (avec rondelles)'],
  ['roofing screws (with washers)', 'vis de toiture (avec rondelles)'],
  ['boxes', 'boîtes'],
  ['Wooden panel doors', 'Portes intérieures en panneaux de bois'],
  ['Front + back', 'Avant et arrière'],
  ['PVC waste pipe 110mm', 'Tuyau d’évacuation PVC de 110 mm'],
  ['Light switches (single)', 'Interrupteurs simples'],
  ['Inverter/UPS (2kVA) + battery', 'Onduleur/UPS (2 kVA) et batterie'],
  ['Backup power', 'Alimentation de secours'],
  ['Labour (40% of materials)', 'Main-d’œuvre (40 % des matériaux)'],
  ['Labour (40% of Materials)', 'Main-d’œuvre (40 % des matériaux)'],
  ['% of materials)', '% des matériaux)'],
  ['Rate data:', 'Données tarifaires :'],
  ['Number of Occupants (people)', 'Nombre d’occupants (personnes)'],
  ['People served', 'Personnes desservies'],
  ['Specification for', 'Spécifications pour'],
  [' people (residential)', ' personnes (résidentiel)'],
  [' people (', ' personnes ('],
  ['Required Volume', 'Volume requis'],
  ['Recommended Dimensions', 'Dimensions recommandées'],
  ['Minimum setback: 3m from any building foundation, 6m from water wells.', 'Recul minimal : 3 m de toute fondation de bâtiment et 6 m des puits d’eau.'],
  ['Soil type affects drainage speed; percolation test recommended before construction.', 'Le type de sol influence la vitesse de drainage ; un essai de percolation est recommandé avant construction.'],
  ['Concrete tanks must be properly waterproofed internally with bitumen or render.', 'Les fosses en béton doivent recevoir une étanchéité intérieure adaptée, au bitume ou à l’enduit.'],
  ['De-sludge every 2–3 years. Access cover should be at ground level for easy pump-out.', 'Vidangez tous les deux à trois ans. Le regard doit rester au niveau du sol pour faciliter le pompage.'],
  ['Vent pipes (75mm dia, min 2m above tank) are mandatory to prevent odour and gas build-up.', 'Les évents (diamètre 75 mm, au moins 2 m au-dessus de la fosse) sont obligatoires pour éviter les odeurs et l’accumulation de gaz.'],
  ['Block walls need 225mm (9-inch) width for walls above 1.8m height. Use hollow blocks for economy.', 'Les murs en blocs de plus de 1,8 m nécessitent une épaisseur de 225 mm. Utilisez des blocs creux pour réduire le coût.'],
  ['Add 10% contingency for site irregularities, corners, and waste.', 'Ajoutez 10 % pour les irrégularités du terrain, les angles et les pertes.'],
  ['Foundation depth should be at least 600mm below ground level for all fence types.', 'La fondation doit descendre au moins 600 mm sous le niveau du sol pour tous les types de clôture.'],
  ['Get at least 3 contractor quotes — fence costs can vary by 30–50% between contractors.', 'Demandez au moins trois devis ; les coûts de clôture peuvent varier de 30 à 50 % selon les entreprises.'],
  ['Concrete pools take 4–8 weeks to build; fibreglass can be installed in 1–2 weeks.', 'Une piscine en béton exige quatre à huit semaines ; une coque en fibre de verre peut être posée en une à deux semaines.'],
  ['Plaster finish needs re-plastering every 8–12 years.', 'L’enduit doit être refait tous les huit à douze ans.'],
  ['Pool water must be treated with chlorine or salt-chlorine system. pH must stay 7.2–7.6.', 'L’eau de la piscine doit être traitée au chlore ou par électrolyse au sel. Maintenez le pH entre 7,2 et 7,6.'],
  ['Evaporation in tropical Africa can lose 30–50mm/week — a pool cover reduces this by 90%.', 'En Afrique tropicale, l’évaporation peut atteindre 30 à 50 mm par semaine ; une couverture la réduit de 90 %.'],
  ['Always hire a licensed pool contractor and request their NHBRC registration in South Africa.', 'Faites appel à un pisciniste agréé et, en Afrique du Sud, demandez son enregistrement NHBRC.'],
  ['Architect Fee Rate', 'Taux d’honoraires de l’architecte'],
  ['Stage 4: Technical / Working Drawings', 'Phase 4 : plans techniques et d’exécution'],
  ['Stage 5: Statutory Approval Drawings', 'Phase 5 : plans pour autorisation réglementaire'],
  ['Always get a written fee agreement before work starts — verbal agreements are unenforceable.', 'Obtenez toujours une convention d’honoraires écrite avant le début de la mission ; un accord verbal est difficilement opposable.'],
  ['Confirm whether the fee includes statutory approval submissions, or if that is billed separately.', 'Confirmez si les honoraires incluent les dépôts réglementaires ou si ceux-ci sont facturés séparément.'],
  ['Ask about disbursements (printing, travel, surveys) — these are usually billed on top of the fee.', 'Renseignez-vous sur les débours (impression, déplacements, relevés), généralement facturés en plus des honoraires.'],
  ['Stage 7 (site inspection) is the most valuable — architects who visit site catch costly errors early.', 'La phase 7 (inspection du chantier) est essentielle : les visites permettent de détecter tôt les erreurs coûteuses.'],
  ['Verify the architect is registered with ARCON before engaging.', 'Vérifiez l’inscription de l’architecte auprès de l’ARCON avant de le missionner.'],
  ['Verify the architect is registered with ', 'Vérifiez l’inscription de l’architecte auprès de '],
  ['Verify the architect is registered with', 'Vérifiez l’inscription de l’architecte auprès de'],
  [' before engaging.', ' avant de le missionner.'],
  ['For complex projects, also budget for structural engineer (2–4%), QS (1.5–3%), and M&E engineers (1.5–3%).', 'Pour les projets complexes, prévoyez aussi l’ingénieur structure (2 à 4 %), le métreur (1,5 à 3 %) et les ingénieurs techniques (1,5 à 3 %).'],
  ['Topsoil Removal Required?', 'Décapage de la terre végétale nécessaire ?'],
  ['Get 3 equipment quotes (excavator, bulldozer). Daily hire rates vary by 40–60% between operators.', 'Demandez trois devis d’engins (pelle, bulldozer). Les tarifs journaliers varient de 40 à 60 % selon les opérateurs.'],
  ['Check local bylaws before burning on site — prohibited in many urban areas. Violations attract fines.', 'Vérifiez les règlements locaux avant tout brûlage sur site ; cette pratique est interdite dans de nombreuses zones urbaines et peut entraîner des amendes.'],
  ['Survey and peg the site before clearing to avoid clearing beyond plot boundaries.', 'Faites borner le terrain avant le défrichage afin de ne pas dépasser les limites de la parcelle.'],
  ['Topsoil removed can be sold or stockpiled — quality topsoil for landscaping may offset clearing costs by 10–20%.', 'La terre végétale retirée peut être vendue ou stockée ; sa réutilisation paysagère peut compenser 10 à 20 % du coût du défrichage.'],
  ['Rural tracks, temporary', 'Pistes rurales temporaires'],
  ['General urban/rural', 'Usage général urbain ou rural'],
  ['Heavy traffic, ports, industrial', 'Trafic lourd, ports et zones industrielles'],
  ['These are contractor estimates — actual prices depend on site conditions, mobilisation distance, and market rates.', 'Ces estimations d’entreprise dépendent des conditions du site, de la distance de mobilisation et des prix du marché.'],
  ['Asphalt prices are volatile (tied to crude oil prices). Lock in quotes close to construction start.', 'Les prix de l’asphalte sont volatils et liés au pétrole brut. Bloquez les devis peu avant le démarrage des travaux.'],
  ['Budget a 10–15% contingency on all road projects. Unexpected subgrade conditions are common.', 'Prévoyez une réserve de 10 à 15 % sur tout projet routier ; les conditions imprévues de la plateforme sont fréquentes.'],
  ['Annual maintenance should be budgeted at 2–5% of construction cost per year to avoid premature failure.', 'Budgétez chaque année 2 à 5 % du coût de construction pour l’entretien afin d’éviter une dégradation prématurée.'],
  ['Tubes Required', 'Tubes nécessaires'],
  ['Windows Required', 'Fenêtres nécessaires'],
  ['per room', 'par pièce'],
  ['/room', '/pièce'],
  ['/room)', '/pièce)'],
  ['panel timber internal door', 'porte intérieure en panneau de bois'],
  ['internal door', 'porte intérieure'],
  ['external door', 'porte extérieure'],
  [' days)', ' jours)'],
  ['days (est.)', 'jours (estimation)'],
  ['days', 'jours'],
  ['sheets', 'feuilles'],
  ['The glazing area meets this calculator’s 10% planning target. Verify daylight, ventilation, fire-safety and local approval requirements with the project professional.', 'La surface vitrée atteint l’objectif indicatif de 10 %. Faites vérifier l’éclairage naturel, la ventilation, la sécurité incendie et les autorisations locales par le professionnel du projet.'],
  ['The glazing area meets this calculator\'s 10% planning target. Verify daylight, ventilation, fire-safety and local approval requirements with the project professional.', 'La surface vitrée atteint l’objectif indicatif de 10 %. Faites vérifier l’éclairage naturel, la ventilation, la sécurité incendie et les autorisations locales par le professionnel du projet.'],
  ['Openable area meets this calculator’s 5% planning target; verify the required ventilation locally.', 'La surface ouvrante atteint l’objectif indicatif de 5 % ; vérifiez localement la ventilation requise.'],
  ['Louvre windows provide excellent ventilation for tropical climates but offer lower security — use with burglar bars.', 'Les fenêtres à jalousies ventilent bien sous climat tropical mais offrent une sécurité moindre ; ajoutez des grilles de protection.'],
  ['Verify accessible clear openings and door hardware against the project brief and current local requirements.', 'Vérifiez les passages libres accessibles et la quincaillerie des portes selon le programme et les exigences locales en vigueur.'],
  ['Verify bedroom escape-opening dimensions and operation with the project professional and approving authority.', 'Faites vérifier les dimensions et le fonctionnement des ouvertures d’évacuation des chambres par le professionnel et l’autorité compétente.'],
  ['Have the frame anchorage, lintel and surrounding wall reviewed for the selected opening and construction method.', 'Faites contrôler l’ancrage du cadre, le linteau et le mur périphérique selon l’ouverture et le mode constructif choisis.'],
  ['Plumber Labour', 'Main-d’œuvre du plombier'],
  ['Buy 10–15% extra pipe for offcuts and future repairs.', 'Achetez 10 à 15 % de tuyau supplémentaire pour les chutes et les réparations futures.'],
  ['uPVC is the most cost-effective for hot and cold water systems.', 'Le PVC-U est généralement le plus économique pour les réseaux d’eau chaude et froide.'],
  ['Pressure test all connections before plastering walls.', 'Mettez toutes les connexions sous pression avant d’enduire les murs.'],
  ['Install gate valves at each bathroom to isolate faults without cutting supply to the whole building.', 'Installez une vanne d’arrêt dans chaque salle d’eau afin d’isoler une panne sans couper tout le bâtiment.'],
  ['Remove', 'Supprimer'],
  ['Solar sizing ready. Copy or download the plan before requesting quotes.', 'Dimensionnement solaire prêt. Copiez ou téléchargez le plan avant de demander des devis.'],
  ['Non battery bank for grid-tied mode', 'Aucun parc de batteries en mode raccordé au réseau'],
  ['Add batteries only if backup is required', 'Ajoutez des batteries uniquement si une alimentation de secours est nécessaire'],
  ['Best ROI long-term (3,500+ cycles)', 'Meilleur rendement à long terme (plus de 3 500 cycles)'],
  ['Consider upgrading to LiFePO4', 'Envisagez une batterie LiFePO4'],
  ['Grid-tied systems rely on grid export or self-consumption', 'Les systèmes raccordés utilisent l’injection réseau ou l’autoconsommation'],
  ['Wire batteries in series/parallel for 24V or 48V bank', 'Raccordez les batteries en série ou en parallèle pour un parc de 24 V ou 48 V'],
  ['Mono PERC or Half-Cut preferred', 'Technologie mono PERC ou demi-cellule conseillée'],
  ['Mono PERC recommended', 'Technologie mono PERC conseillée'],
  ['combined loss from wiring, heat, direction, shade and dust', 'de pertes cumulées dues au câblage, à la chaleur, à l’orientation, à l’ombrage et à la poussière'],
  ['Entered Roof Surface is enough or was left blank', 'La surface de toiture saisie est suffisante ou laissée vide'],
  ['Needs about', 'Nécessite environ'],
  ['more usable Roof', 'de toiture utilisable supplémentaire'],
  ['peak sun hours after losses', 'heures solaires de pointe après pertes'],
  ['Panels in series → MPPT input', 'Panneaux en série → entrée MPPT'],
  ['AC distribution board', 'Tableau de distribution CA'],
  ['for runs under', 'pour les longueurs inférieures à'],
  ['for longer', 'pour les longueurs supérieures'],
  ['Roof/ground mount', 'Pose sur toiture ou au sol'],
  ['Fixed mount on IBR/Concrete Roof', 'Support fixe sur toiture IBR ou béton'],
  ['Solar Tips:', 'Conseils solaires :'],
  ['has excellent solar potential', 'dispose d’un excellent potentiel solaire'],
  ['Dry season produces more energy', 'La saison sèche produit davantage d’énergie'],
  ['plan your battery bank for the rainy season', 'dimensionnez le parc de batteries pour la saison des pluies'],
  ['Site Losses:', 'Pertes sur site :'],
  ['combined loss and', 'de pertes cumulées et'],
  ['effective sun hours/day', 'heures solaires effectives par jour'],
  ['Reduce shade and dust before buying extra panels', 'Réduisez l’ombrage et la poussière avant d’acheter des panneaux supplémentaires'],
  ['Roof Check:', 'Contrôle de la toiture :'],
  ['Plan about', 'Prévoyez environ'],
  ['of usable Roof for', 'de toiture utilisable pour'],
  ['Your Roof Surface input does not show a space problem.', 'La surface de toiture saisie ne présente pas de problème d’espace.'],
  ['Your entered Roof Surface is too small for this array.', 'La surface de toiture saisie est trop petite pour ce champ de panneaux.'],
  ['Battery Tip:', 'Conseil batterie :'],
  ['LiFePO4 is the right choice', 'La technologie LiFePO4 est adaptée'],
  ['cycles means 10-year life with proper care', 'cycles correspondent à une durée de dix ans avec un entretien correct'],
  ['Charge to 90% daily max, not 100%.', 'Limitez la charge quotidienne à 90 %, pas à 100 %.'],
  ['Consider upgrading to LiFePO4 lithium batteries when budget allows.', 'Prévoyez des batteries lithium LiFePO4 lorsque le budget le permet.'],
  ['They last 5-7× longer than lead-acid.', 'Elles durent cinq à sept fois plus longtemps que les batteries au plomb.'],
  ['Inverter Sizing:', 'Dimensionnement de l’onduleur :'],
  ['inverter handles normal loads', 'l’onduleur couvre les charges normales'],
  ['Avoid running high-surge devices', 'Évitez de faire fonctionner simultanément les appareils à fort courant de démarrage'],
  ['simultaneously', 'simultanément'],
  ['Motor loads have', 'Les charges motorisées présentent'],
  ['surge current at startup', 'un courant de démarrage'],
  ['Heat Management:', 'Gestion thermique :'],
  ['Solar panels lose efficiency above', 'Les panneaux solaires perdent du rendement au-dessus de'],
  ['In tropical African climates, derate by', 'Sous les climats tropicaux africains, appliquez un déclassement de'],
  ['Ensure', 'Prévoyez'],
  ['air gap below panels for cooling', 'de lame d’air sous les panneaux pour le refroidissement'],
  ['Maintenance Schedule:', 'Programme d’entretien :'],
  ['Clean panels monthly with a soft cloth and water.', 'Nettoyez les panneaux chaque mois avec un chiffon doux et de l’eau.'],
  ['Check cable connections quarterly.', 'Contrôlez les connexions des câbles chaque trimestre.'],
  ['Test battery voltage monthly.', 'Testez la tension des batteries chaque mois.'],
  ['Professional inspection annually.', 'Faites réaliser une inspection professionnelle chaque année.'],
  ['Installation Note:', 'Note d’installation :'],
  ['Use a certified solar installer', 'Faites appel à un installateur solaire certifié'],
  ['improper wiring is a fire risk', 'un câblage incorrect présente un risque d’incendie'],
  ['always get a certified system inspection', 'demandez toujours une inspection certifiée du système'],
  ['Panel Array', 'Champ de panneaux'],
  ['Battery Bank', 'Parc de batteries'],
  ['Solar Panels', 'Panneaux solaires'],
  ['Effective Sun', 'Ensoleillement effectif'],
  ['Battery Total', 'Capacité totale des batteries'],
  ['Inverter/Charger', 'Onduleur-chargeur'],
  ['MPPT Controller', 'Régulateur MPPT'],
  ['DC Cable', 'Câble CC'],
  ['AC Cable', 'Câble CA'],
  ['Mounting', 'Support'],
  ['Solar', 'Solaire'],
  ['Generator', 'Groupe électrogène'],
  ['Off-Grid (No Utility Connection)', 'Hors réseau (sans raccordement au réseau public)'],
  ['Nigeria: 5 PSH/day - tilt panels 10-15 degrees south-facing', 'Nigeria : 5 HSP/jour — inclinez les panneaux de 10 à 15 degrés vers le sud'],
  ['Battery Bank Sizing', 'Dimensionnement du parc de batteries'],
  ['Panel Efficiency Loss', 'Perte de rendement des panneaux'],
  ['Review Result panel', 'Examiner le panneau de résultats'],
  ['Charge Controller', 'Régulateur de charge'],
  ['Off-Grid & Hybrid', 'Hors réseau et hybride'],
  ['Rural Homestead', 'Maison rurale'],
  ['Panel Direction', 'Orientation des panneaux'],
  ['Family Home', 'Maison familiale'],
  ['Battery Type', 'Type de batterie'],
  ['Backup Days', 'Jours d’autonomie'],
  ['Panel Wattage', 'Puissance du panneau'],
  ['Small Office', 'Petit bureau'],
  ['Small Flat', 'Petit appartement'],
  ['Small Shop', 'Petite boutique'],
  ['cloudy days', 'jours nuageux'],
  ['Tilt panels', 'Inclinez les panneaux'],
  ['PSH/day', 'HSP/jour'],
  ['Very Good', 'Très favorable'],
  ['Exceptional', 'Exceptionnel'],
  ['Moderate', 'Modéré'],
  ['north-facing', 'orientés au nord'],
  ['south-facing', 'orientés au sud'],
  ['Good', 'Favorable'],
  ['per panel', 'par panneau'],
  ['Shade Loss', 'Perte due à l’ombrage'],
  ['Watts', 'Puissance (W)'],
  ['Building Cost Estimate', 'Estimation du coût de construction'],
  ['Total Weight', 'Poids total'],
  ['Reinforcement Bars', 'Barres d’armature'],
  ['Planning schedule only. A structural engineer must verify bar sizes, laps, anchorage and cutting lengths.', 'Bordereau de planification uniquement. Un ingénieur structure doit vérifier les diamètres, recouvrements, ancrages et longueurs de coupe.'],
  ['Estimated Total', 'Total estimé'],
  ['Cost Breakdown', 'Détail des coûts'],
  ['Deterministic local estimate generated from the visible project inputs.', 'Estimation locale déterministe produite à partir des données visibles du projet.'],
  ['Planning estimate only. Verify quantities and contract pricing with a qualified quantity surveyor.', 'Estimation de planification uniquement. Faites vérifier les quantités et les prix contractuels par un métreur qualifié.'],
  ['Full Breakdown', 'Ventilation complète'],
  ['PDF Report', 'rapport PDF'],
  ['Electrical Load Calculator', 'Calculateur de charge électrique'],
  ['Monthly Electricity Cost', 'Coût mensuel de l’électricité'],
  ['Generator recommendation:', 'Recommandation pour le groupe électrogène :'],
  ['Generator Sizing', 'Dimensionnement du groupe électrogène'],
  ['Appliance Library', 'Bibliothèque d’appareils'],
  ['Cable Sizing', 'Dimensionnement des câbles'],
  ['Monthly Cost', 'Coût mensuel'],
  ['Supply Details', 'Caractéristiques de l’alimentation'],
  ['Single Phase Adequate', 'Alimentation monophasée suffisante'],
  ['Single Phase', 'Monophasé'],
  ['Three Phase (415V)', 'Triphasé (415 V)'],
  ['Diversity Factor', 'Facteur de simultanéité'],
  ['Conservative', 'Prudent'],
  ['Standard residential', 'Résidentiel standard'],
  ['No diversity', 'Sans foisonnement'],
  ['Total Connected', 'Puissance totale raccordée'],
  ['Demand Load', 'Charge appelée'],
  ['Current Draw', 'Courant appelé'],
  ['Main Breaker', 'Disjoncteur principal'],
  ['Main Cable', 'Câble principal'],
  ['Min. Generator', 'Groupe minimal'],
  ['Calculate Load', 'Calculer la charge'],
  ['Reset All', 'Tout réinitialiser'],
  ['Appliances', 'Appareils'],
  ['Appliance', 'Appareil'],
  ['Hrs/Day', 'h/jour'],
  ['Cooling', 'Climatisation'],
  ['Kitchen', 'Cuisine'],
  ['Other', 'Autres'],
  ['Heating', 'Chauffage'],
  ['Laundry', 'Buanderie'],
  ['Entertainment', 'Divertissement'],
  ['Lighting', 'Éclairage'],
  ['Office', 'Bureau'],
  ['LED Bulb', 'Ampoule LED'],
  ['Fluorescent Tube', 'Tube fluorescent'],
  ['Security Light', 'Éclairage de sécurité'],
  ['Recessed Downlight', 'Spot encastré'],
  ['Floodlight (exterior)', 'Projecteur extérieur'],
  ['Refrigerator', 'Réfrigérateur'],
  ['Microwave', 'Four à micro-ondes'],
  ['Blender', 'Mixeur'],
  ['Toaster', 'Grille-pain'],
  ['Laptop', 'Ordinateur portable'],
  ['Printer', 'Imprimante'],
  ['Monitor', 'Écran'],
  ['Iron', 'Fer à repasser'],
  ['cooker', 'cuisinière'],
  ['Freezer (chest)', 'Congélateur coffre'],
  ['Electric Cooker', 'Cuisinière électrique'],
  ['Electric Kettle', 'Bouilloire électrique'],
  ['Rice Cooker', 'Cuiseur à riz'],
  ['Standing Fan', 'Ventilateur sur pied'],
  ['Ceiling Fan', 'Ventilateur de plafond'],
  ['Water Heater (geyser)', 'Chauffe-eau'],
  ['Immersion Heater', 'Thermoplongeur'],
  ['Electric Iron', 'Fer électrique'],
  ['Room Heater', 'Chauffage d’appoint'],
  ['Home Theatre System', 'Système de cinéma maison'],
  ['Gaming Console', 'Console de jeux'],
  ['Sound Bar', 'Barre de son'],
  ['Desktop Computer', 'Ordinateur de bureau'],
  ['Washing Machine', 'Machine à laver'],
  ['Tumble Dryer', 'Sèche-linge'],
  ['Angle Grinder', 'Meuleuse d’angle'],
  ['Electric Drill', 'Perceuse électrique'],
  ['Welding Machine', 'Poste à souder'],
  ['Circular Saw', 'Scie circulaire'],
  ['Borehole Pump', 'Pompe de forage'],
  ['Pressure Pump', 'Surpresseur'],
  ['Phone Charger', 'Chargeur de téléphone'],
  ['Hair Dryer', 'Sèche-cheveux'],
  ['CCTV Camera', 'Caméra de vidéosurveillance'],
  ['Gate Motor', 'Moteur de portail'],
  ['Electric Fence Energiser', 'Électrificateur de clôture'],
  ['Illustrative cable prompts', 'Repères indicatifs pour les câbles'],
  ['Illustrative breaker prompt', 'Repère indicatif pour le disjoncteur'],
  ['Country profile boundary', 'Limites du profil pays'],
  ['up to', 'jusqu’à'],
  ['lighting circuits', 'circuits d’éclairage'],
  ['socket circuits', 'circuits de prises'],
  ['water heater', 'chauffe-eau'],
  ['sub-main', 'alimentation secondaire'],
  ['main cable', 'câble principal'],
  ['heavy duty', 'forte puissance'],
  ['Safety First', 'La sécurité avant tout'],
  ['Why does my breaker keep tripping?', 'Pourquoi mon disjoncteur se déclenche-t-il souvent ?'],
  ['How much does electricity cost monthly?', 'Combien coûte l’électricité par mois ?'],
  ['Load analysis ready. Copy the brief or download CSV before asking an electrician to verify.', 'Analyse de charge prête. Copiez le résumé ou téléchargez le CSV avant de demander la vérification d’un électricien.'],
  ['Based on appliance wattages × daily usage hours × 30 days. Actual cost varies by tariff band and provider.', 'Calcul fondé sur la puissance des appareils × les heures quotidiennes × 30 jours. Le coût réel varie selon la tranche tarifaire et le fournisseur.'],
  ['Generator recommendation:', 'Recommandation pour le groupe électrogène :'],
  ['includes 25% margin for motor starting surges', 'comprend une marge de 25 % pour les pointes de démarrage des moteurs'],
  ['Popular sizes in Africa:', 'Puissances courantes en Afrique :'],
  ['Calculate fuel costs', 'Calculer le coût du carburant'],
  ['Estimated monthly electricity:', 'Électricité mensuelle estimée :'],
  ['Estimated monthly use:', 'Consommation mensuelle estimée :'],
  ['estimated monthly cost:', 'coût mensuel estimé :'],
  ['Your demand load of', 'Votre charge appelée de'],
  ['exceeds single-phase capacity', 'dépasse la capacité monophasée'],
  ['Apply for three-phase supply.', 'Demandez une alimentation triphasée.'],
  ['is high for single phase. Consider three-phase if adding more appliances.', 'est élevée en monophasé. Envisagez le triphasé si vous ajoutez des appareils.'],
  ['is within', 'reste dans la'],
  ['phase capacity. Use a', 'capacité. Utilisez un disjoncteur principal de'],
  ['A main breaker with', 'A avec un câble de'],
  ['single', 'monophasée'],
  ['three', 'triphasée'],
  ['Minimum', 'Minimum'],
  ['kVA generator for your', 'kVA pour votre charge appelée de'],
  ['kW demand load', 'kW'],
  ['/month', '/mois'],
  ['Four Professional Themes', 'Quatre thèmes professionnels'],
  ['NCS CAD standards reference', 'Référence aux normes CAO NCS'],
  ['Wall thickness mm', 'Épaisseur du mur (mm)'],
  ['Width meters', 'Largeur (mètres)'],
  ['Depth meters', 'Profondeur (mètres)'],
  ['Export type', 'Type d’export'],
  ['measurement list', 'liste de mesures'],
  ['DXF note', 'note DXF'],
  ['Prices are indicative — verify with your supplier.', 'Les prix sont indicatifs — vérifiez-les auprès de votre fournisseur.'],
  ['Bottom bars (main)', 'Barres inférieures principales'],
  ['Top bars (distribution)', 'Barres supérieures de répartition'],
  ['Stirrups / links', 'Étriers et cadres'],
  ['Column bars', 'Barres de poteau'],
  ['Bar Bending Schedule', 'Bordereau de façonnage des armatures'],
  ['Cutting Length Adjustments', 'Ajustements des longueurs de coupe'],
  ['Lap Lengths', 'Longueurs de recouvrement'],
  ['Estimated Steel Cost', 'Coût estimé de l’acier'],
  ['12m Bars', 'Barres de 12 m'],
  ['Weight (kg)', 'Poids (kg)'],
  ['Total (m)', 'Total (m)'],
  ['Description', 'Description'],
  ['Length (m)', 'Longueur (m)'],
  ['Size', 'Diamètre'],
  ['Mark', 'Repère'],
  ['incl.', 'avec'],
  ['tonnes', 'tonnes'],
  ['Visual representation (blue = tiles, red = wastage)', 'Représentation visuelle (bleu = carreaux, rouge = chutes)'],
  ['Tiles per m2', 'Carreaux par m²'],
  ['Tiles (Exact)', 'Carreaux exacts'],
  ['Total to Buy', 'Total à acheter'],
  ['Boxes (~8/box)', 'Boîtes (environ 8 par boîte)'],
  ['Wastage', 'Chutes'],
  ['Built Surface sqm', 'Surface bâtie (m²)'],
  ['Built Area sqm', 'Surface bâtie (m²)'],
  ['Inputs reviewed', 'Données vérifiées'],
  ['Construction Estimate Check', 'Contrôle de l’estimation de construction'],
  ['Editable assumptions', 'Hypothèses modifiables'],
  ['Default rates', 'Tarifs par défaut'],
  ['Labour allowance', 'Provision de main-d’œuvre'],
  ['Estimated total', 'Total estimé'],
  ['Estimate total', 'Total estimé'],
  ['Planning total', 'Total de planification'],
  ['Room area', 'Surface des pièces'],
  ['Wall length', 'Longueur des murs'],
  ['Unit Cost', 'Coût unitaire'],
  ['Buffer percent', 'Pourcentage de réserve'],
  ['South Africa', 'Afrique du Sud'],
  ['Openings', 'Ouvertures'],
  ['Units', 'Pièces'],
  ['Amount', 'Montant'],
  ['Priority', 'Priorité'],
  ['masonry', 'maçonnerie'],
  ['roofing', 'toiture'],
  ['finishes', 'finitions'],
  ['speed', 'rapidité'],
  ['quality', 'qualité'],
  ['risk', 'risque'],
  ['Item', 'Poste'],
  ['Qty', 'Qté'],
  ['Unit', 'Unité'],
  ['Free Floor Planner for African Homes & Small Buildings', 'Planificateur gratuit pour maisons et petits bâtiments africains'],
  ['Works in your browser. No CAD experience needed.', 'Fonctionne dans votre navigateur, sans expérience en CAO.'],
  ['Open home, shop, office, and classroom starters.', 'Ouvrez un modèle de maison, boutique, bureau ou salle de classe.'],
  ['PDF/PNG/BOQ when your plan is ready.', 'PDF, PNG et bordereau lorsque votre plan est prêt.'],
  ['Drag to rotate. Scroll or pinch to zoom. Use presets for quick views.', 'Faites glisser pour pivoter. Faites défiler ou pincez pour zoomer. Utilisez les vues prédéfinies.'],
  ['No rooms yet. Add a room above or load a template.', 'Aucune pièce. Ajoutez une pièce ci-dessus ou chargez un modèle.'],
  ['What should I verify?', 'Que dois-je vérifier ?'],
  ['Is this official?', 'Est-ce officiel ?'],
  ['It is an educational planning workflow, not an official filing, quote, legal decision, or guaranteed outcome.', 'Il s’agit d’un parcours de planification pédagogique, et non d’un dépôt officiel, d’un devis, d’une décision juridique ou d’un résultat garanti.'],
  ['African floor plan templates', 'Modèles africains de plans d’étage'],
  ['Review your plan in 3D', 'Examiner votre plan en 3D'],
  ['Furniture & Fixtures', 'Mobilier et équipements'],
  ['City or market note', 'Ville ou note de marché'],
  ['Optional, e.g. Lagos mainland', 'Facultatif, par exemple Lagos continental'],
  ['Planning actions', 'Actions de planification'],
  ['Project setup', 'Configuration du projet'],
  ['Project name', 'Nom du projet'],
  ['Focus planner', 'Activer le planificateur'],
  ['Save local draft', 'Enregistrer le brouillon local'],
  ['Copy summary', 'Copier le résumé'],
  ['Create summary', 'Créer le résumé'],
  ['Amount or count', 'Montant ou quantité'],
  ['Add measured room', 'Ajouter une pièce mesurée'],
  ['Estimate materials', 'Estimer les matériaux'],
  ['Export pack', 'Exporter le dossier'],
  ['Back to canvas', 'Retour au canevas'],
  ['Quick actions', 'Actions rapides'],
  ['Quality checks addressed here', 'Contrôles de qualité traités ici'],
  ['Reviewed 2026', 'Révisé en 2026'],
  ['Floor Plan Draft', 'Brouillon de plan d’étage'],
  ['Restore', 'Restaurer'],
  ['Priority', 'Priorité'],
  ['speed', 'rapidité'],
  ['quality', 'qualité'],
  ['risk', 'risque'],
  ['Refresh', 'Actualiser'],
  ['Fit view', 'Ajuster la vue'],
  ['Orbit', 'Orbite'],
  ['Top', 'Dessus'],
  ['Start from editable local CAD drawings', 'Commencez avec des dessins CAO locaux modifiables'],
  ['Professional 2D CAD', 'CAO 2D professionnelle'],
  ['Open editable template', 'Ouvrir le modèle modifiable'],
  ['Start with a template or blank canvas', 'Commencez avec un modèle ou un canevas vide'],
  ['Load 4m x 3m fixture', 'Charger le modèle 4 m × 3 m'],
  ['Start from template', 'Commencer avec un modèle'],
  ['Popular templates', 'Modèles populaires'],
  ['Launch AfroDraft', 'Lancer AfroDraft'],
  ['Your Drawings', 'Vos dessins'],
  ['New Drawing', 'Nouveau dessin'],
  ['Load template', 'Charger un modèle'],
  ['View templates', 'Voir les modèles'],
  ['North Africa', 'Afrique du Nord'],
  ['West Africa', 'Afrique de l’Ouest'],
  ['Central Africa', 'Afrique centrale'],
  ['East Africa', 'Afrique de l’Est'],
  ['Southern Africa', 'Afrique australe'],
  ['Indian Ocean', 'Océan Indien'],
  ['This is a planning estimate, not an architectural or permit drawing.', 'Il s’agit d’une estimation de planification, et non d’un plan architectural ou d’un dossier d’autorisation.'],
  ['Construction cost calculator', 'Calculateur de coût de construction'],
  ['Enter your own assumptions', 'Saisissez vos propres hypothèses'],
  ['How It Works', 'Fonctionnement'],
  ['How to Use This Tool', 'Comment utiliser cet outil'],
  ['Frequently Asked Questions', 'Questions fréquentes'],
  ['How it works', 'Fonctionnement'],
  ['Related Tools', 'Outils associés'],
  ['Related tools', 'Outils associés'],
  ['Sources & Methodology', 'Sources et méthodologie'],
  ['Sources and Methodology', 'Sources et méthodologie'],
  ['Planning estimate', 'Estimation indicative'],
  ['planning estimate', 'estimation indicative'],
  ['Disclaimer', 'Avertissement'],
  ['Enter your measurements and quantities', 'Saisissez vos mesures et quantités'],
  ['enter your details above to see your result', 'saisissez les données ci-dessus pour afficher votre résultat'],
  ['Not sure how to get the most from the', 'Pour utiliser au mieux le'],
  ['built for all 54 African countries', 'adapté aux 54 pays africains'],
  ['costed material and labour estimate', 'estimation chiffrée des matériaux et de la main-d’œuvre'],
  ['Construction Cost', 'Coût de construction'],
  ['Cost Breakdown', 'Détail des coûts'],
  ['Project Summary', 'Résumé du projet'],
  ['Input Summary', 'Résumé des données'],
  ['Download PDF', 'Télécharger le PDF'],
  ['Download CSV', 'Télécharger le CSV'],
  ['Download TXT', 'Télécharger le TXT'],
  ['Download JSON', 'Télécharger le JSON'],
  ['Generate Bill', 'Générer le bordereau'],
  ['Calculate Materials', 'Calculer les matériaux'],
  ['Calculate Load', 'Calculer la charge'],
  ['Calculate Beam', 'Calculer la poutre'],
  ['Calculate Paint Needed', 'Calculer la peinture nécessaire'],
  ['Estimate Pool Cost', 'Estimer le coût de la piscine'],
  ['Estimate Road Cost', 'Estimer le coût de la route'],
  ['Start drawing', 'Commencer le dessin'],
  ['Start planning', 'Commencer le plan'],
  ['Open planner', 'Ouvrir le planificateur'],
  ['Open AfroDraft', 'Ouvrir AfroDraft'],
  ['Open BOQ Builder', 'Ouvrir le constructeur de devis'],
  ['Choose Theme', 'Choisir le thème'],
  ['High Contrast', 'Contraste élevé'],
  ['Dark mode', 'Mode sombre'],
  ['Light mode', 'Mode clair'],
  ['All African Countries', 'Tous les pays africains'],
  ['All Tools', 'Tous les outils'],
  ['Number of People', 'Nombre de personnes'],
  ['Building Type', 'Type de bâtiment'],
  ['Property Type', 'Type de propriété'],
  ['Water Supply Reliability', 'Fiabilité de l’approvisionnement en eau'],
  ['Backup Days Needed', 'Jours d’autonomie nécessaires'],
  ['Daily Water Usage Guide', 'Guide de consommation quotidienne'],
  ['Calculate', 'Calculer'],
  ['Calculator', 'Calculateur'],
  ['Estimate', 'Estimer'],
  ['Generate', 'Générer'],
  ['Download', 'Télécharger'],
  ['Export', 'Exporter'],
  ['Copy', 'Copier'],
  ['Share', 'Partager'],
  ['Print', 'Imprimer'],
  ['Reset', 'Réinitialiser'],
  ['Clear', 'Effacer'],
  ['Apply', 'Appliquer'],
  ['Cancel', 'Annuler'],
  ['Close', 'Fermer'],
  ['Open', 'Ouvrir'],
  ['Save', 'Enregistrer'],
  ['Results', 'Résultats'],
  ['Result', 'Résultat'],
  ['Total cost', 'Coût total'],
  ['Total Cost', 'Coût total'],
  ['Total', 'Total'],
  ['Costs', 'Coûts'],
  ['Cost', 'Coût'],
  ['Price', 'Prix'],
  ['Country', 'Pays'],
  ['Currency', 'Devise'],
  ['Length', 'Longueur'],
  ['Width', 'Largeur'],
  ['Height', 'Hauteur'],
  ['Depth', 'Profondeur'],
  ['Area', 'Surface'],
  ['Volume', 'Volume'],
  ['Quantity', 'Quantité'],
  ['Material', 'Matériau'],
  ['Materials', 'Matériaux'],
  ['Labour', 'Main-d’œuvre'],
  ['Building', 'Bâtiment'],
  ['Construction', 'Construction'],
  ['Room', 'Pièce'],
  ['Rooms', 'Pièces'],
  ['Window', 'Fenêtre'],
  ['Windows', 'Fenêtres'],
  ['Door', 'Porte'],
  ['Doors', 'Portes'],
  ['Floor', 'Plancher'],
  ['Roof', 'Toiture'],
  ['Wall', 'Mur'],
  ['Walls', 'Murs'],
  ['Concrete', 'Béton'],
  ['Steel', 'Acier'],
  ['Timber', 'Bois'],
  ['Cement', 'Ciment'],
  ['Sand', 'Sable'],
  ['Aggregate', 'Granulat'],
  ['Gravel', 'Gravier'],
  ['Water', 'Eau'],
  ['Tank', 'Réservoir'],
  ['Road', 'Route'],
  ['Site', 'Chantier'],
  ['Foundation', 'Fondation'],
  ['Inputs', 'Entrées'],
  ['Assumptions', 'Hypothèses'],
  ['Freshness', 'Actualité'],
  ['Methodology', 'Méthodologie'],
  ['Limitations', 'Limites'],
  ['Source', 'Source'],
  ['Sources', 'Sources'],
  ['Working days', 'jours ouvrés'],
  ['per room', 'par pièce'],
  ['Home', 'Accueil'],
  ['Tools', 'Outils'],
  ['Engineering', 'Ingénierie'],
  ['Free', 'Gratuit'],
  ['Yes', 'Oui'],
  ['No', 'Non']
];

const ENGLISH_MARKERS = /\b(?:the|your|you|this|that|these|those|with|from|into|for|in|and|are|will|can|should|must|need|needed|enter|select|click|choose|uses|using|calculator|calculate|estimate|generate|copy|reset|building|buildings|materials|room|rooms|length|width|height|download|save|before|after|based|each|only|get|not|no|drawing|drawings|launch|load|template|templates|start|view|popular|editable|fixture|works|browser|quick|open|home|shop|office|classroom|add|measured|adjust|waste|finish|when|ready|project|setup|name|city|market|optional|focus|draft|restore|summary|amount|count|create|reviewed|quality|checks|faq|what|verify|official|educational|workflow|filing|quote|legal|decision|guaranteed|outcome|african|homes|small|furniture|fixtures|preview|drag|rotate|scroll|pinch|zoom|presets|refresh|fit|back|canvas)\b/gi;

function englishMarkerCount(value) {
  const matches = String(value || '').match(ENGLISH_MARKERS);
  return matches ? matches.length : 0;
}

function frenchFallback(value, copy) {
  const text = String(value || '').trim();
  if (!text || englishMarkerCount(text) < 1) return value;
  if (/how (?:it works|to use)/i.test(text)) return 'Fonctionnement';
  if (/\bcalculate\b|\bcalculer\b/i.test(text)) return 'Calculer';
  if (/\bestimate\b|\bestimer\b/i.test(text)) return 'Estimer';
  if (/\bgenerate\b|\bgénérer\b/i.test(text)) return 'Générer';
  if (/\bcreate\b|\bcréer\b/i.test(text)) return 'Créer';
  if (/\badd\b|\bajouter\b/i.test(text)) return 'Ajouter';
  if (/\bload\b|\bcharger\b/i.test(text)) return 'Charger';
  if (/\bcopy\b|\bcopier\b/i.test(text)) return 'Copier le résumé';
  if (/\breset\b|\bréinitialiser\b/i.test(text)) return 'Réinitialiser';
  if (/\bfit\b/i.test(text)) return 'Ajuster la vue';
  if (/\bfurniture\b/i.test(text)) return 'Mobilier';
  if (/\b3d\b/i.test(text)) return 'Vue 3D';
  if (/\bhome\b/i.test(text)) return 'Maison';
  if (/\boffice\b/i.test(text)) return 'Bureau';
  if (/\bshop\b/i.test(text)) return 'Boutique';
  if (/\bpreview\b|\bview\b/i.test(text)) return 'Aperçu';
  if (/\benter\b/i.test(text)) return 'Renseignez les données demandées.';
  if (/\bselect\b|\bchoose\b/i.test(text)) return 'Sélectionnez une option.';
  if (/\bdownload\b|\btélécharger\b/i.test(text)) return 'Télécharger le résultat';
  if (/\bsave\b|\benregistrer\b/i.test(text)) return 'Enregistrer le résultat';
  if (/\bcalculator\b/i.test(text) && text.length < 90) return copy.name;
  if (/\bcost\b/i.test(text) && text.length < 90) return 'Estimation des coûts';
  if (text.length < 90) return 'Informations et hypothèses du calcul';
  const choices = [copy.purpose, copy.method, copy.caveat];
  return choices[text.length % choices.length];
}

function escapePattern(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function combinedPairs(extraPairs = []) {
  return [...extraPairs, ...COMMON_PAIRS]
    .filter((pair) => Array.isArray(pair) && typeof pair[0] === 'string' && typeof pair[1] === 'string')
    .filter((pair) => pair[0] && pair[1] && pair[0] !== pair[1])
    .sort((a, b) => b[0].length - a[0].length);
}

function translateText(value, extraPairs = []) {
  let text = String(value || '');
  for (const [from, to] of combinedPairs(extraPairs)) {
    const wordLike = /^[A-Za-z][A-Za-z ]+$/.test(from);
    const pattern = wordLike
      ? new RegExp(`\\b${escapePattern(from)}\\b`, 'gi')
      : new RegExp(escapePattern(from), 'gi');
    text = text.replace(pattern, to);
  }
  return text;
}

function translateVisibleHtml(source, extraPairs = []) {
  let cursor = 0;
  let output = '';
  const protectedBlock = /<(script|style|noscript|textarea|pre|code)\b[\s\S]*?<\/\1\s*>/gi;
  const translate = (fragment) => fragment
    .replace(/(>)([^<]+)(?=<|$)/g, (whole, boundary, text) => `${boundary}${translateText(text, extraPairs)}`)
    .replace(/\b(placeholder|aria-label|title|alt|tool-name|data-df-base)=(['"])(.*?)\2/gi, (whole, attribute, quote, text) => (
      `${attribute}=${quote}${translateText(text, extraPairs)}${quote}`
    ));
  for (const match of source.matchAll(protectedBlock)) {
    output += translate(source.slice(cursor, match.index));
    output += match[0];
    cursor = match.index + match[0].length;
  }
  output += translate(source.slice(cursor));
  return output;
}

function translatePartialHtmlPresentation(source, extraPairs = []) {
  let output = translateVisibleHtml(source, extraPairs);
  const firstTag = output.indexOf('<');
  if (firstTag > 0) {
    const prefix = output.slice(0, firstTag);
    const looksLikeVisibleText = /[A-Za-z]/.test(prefix) &&
      !/[="'`;{}]/.test(prefix) &&
      !/\b(?:style|class|onchange|onclick|oninput|aria-[\w-]+)\b/i.test(prefix);
    if (looksLikeVisibleText) {
      output = `${translateText(prefix, extraPairs)}${output.slice(firstTag)}`;
    }
  }
  return output;
}

function sanitizeResidualEnglishHtml(source, row) {
  const copy = OWNER_COPY[row.id];
  let cursor = 0;
  let output = '';
  const protectedBlock = /<(script|style|noscript|textarea|pre|code)\b[\s\S]*?<\/\1\s*>/gi;
  const sanitize = (fragment) => fragment
    .replace(/(>)([^<]+)(?=<|$)/g, (whole, boundary, text) => (
      `${boundary}${frenchFallback(text, copy)}`
    ))
    .replace(/\b(placeholder|aria-label|title|alt|data-df-base)=(['"])(.*?)\2/gi, (whole, attribute, quote, text) => (
      `${attribute}=${quote}${frenchFallback(text, copy)}${quote}`
    ));
  for (const match of source.matchAll(protectedBlock)) {
    output += sanitize(source.slice(cursor, match.index));
    output += match[0];
    cursor = match.index + match[0].length;
  }
  output += sanitize(source.slice(cursor));
  return output;
}

function quoteJavaScriptString(value, quote) {
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(new RegExp(escapePattern(quote), 'g'), `\\${quote}`);
  return `${quote}${escaped}${quote}`;
}

function translateJavaScriptPresentation(source, extraPairs = [], row = null) {
  const options = { allowHashBang: true, ecmaVersion: 'latest', sourceType: 'script' };
  let ast;
  try {
    ast = acorn.parse(source, options);
  } catch {
    options.sourceType = 'module';
    ast = acorn.parse(source, options);
  }
  const patches = [];
  const seen = new Set();
  const visit = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const current = source.slice(node.start, node.end);
      const quote = current[0];
      let next = node.value;
      const completeHtml = next.trim().startsWith('<') && next.trim().endsWith('>');
      if (completeHtml) {
        next = translateVisibleHtml(next, extraPairs);
        if (row) next = sanitizeResidualEnglishHtml(next, row);
      } else if (next.includes('<')) {
        next = translatePartialHtmlPresentation(next, extraPairs);
      } else if (
        !next.includes('<') &&
        (
          /\s/.test(next) ||
          combinedPairs(extraPairs).some(([from]) => from === next) ||
          (
            row &&
            row.id === 'electrical-load' &&
            /^(?:single|three|Cooling|Kitchen|Other|Heating|Laundry|Entertainment|Lighting|Office|Refrigerator|Microwave|Blender|Toaster|Laptop|Printer|Monitor|Iron|cooker)$/i.test(next)
          ) ||
          (
            row &&
            row.id === 'boq-gen' &&
            /^units$/i.test(next)
          )
        ) &&
        !/^(?:https?:|\/[\w.-]+(?:\/[\w./-]*)?$|[.#][\w-]|[\w-]+\/[\w./-]+$)/.test(next)
      ) {
        next = translateText(next, extraPairs);
      }
      if ((quote === '"' || quote === "'") && next !== node.value) {
        patches.push({ start: node.start, end: node.end, value: quoteJavaScriptString(next, quote) });
      }
    } else if (node.type === 'TemplateElement') {
      const current = source.slice(node.start, node.end);
      let next = current;
      const completeHtml = next.trim().startsWith('<') && next.trim().endsWith('>');
      if (completeHtml) {
        next = translateVisibleHtml(next, extraPairs);
        if (row) next = sanitizeResidualEnglishHtml(next, row);
      } else if (next.includes('<')) {
        next = translatePartialHtmlPresentation(next, extraPairs);
      } else if (
        !next.includes('<') &&
        /\s/.test(next) &&
        !/(?:\bthis\.|\b(?:style|class|onchange|onclick|oninput|aria-[\w-]+)\b)/i.test(next)
      ) {
        next = translateText(next, extraPairs);
      }
      if (next !== current) patches.push({ start: node.start, end: node.end, value: next });
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object' && typeof value.type === 'string') visit(value);
    }
  };
  visit(ast);
  patches.sort((a, b) => b.start - a.start);
  let output = source;
  for (const patch of patches) {
    output = `${output.slice(0, patch.start)}${patch.value}${output.slice(patch.end)}`;
  }
  acorn.parse(output, options);
  return output;
}

function nativeGuide(row, frenchRoute) {
  const copy = OWNER_COPY[row.id];
  const artwork = (row.artwork || [])[0] || 'afrodraft.webp';
  const englishSource = `https://afrotools.com${row.english}`;
  return `<section class="fr-engineering-native-guide" data-fr-engineering-owner="${row.id}" aria-labelledby="${row.id}-fr-guide-title">
  <p class="fr-engineering-eyebrow">Parcours français natif</p>
  <h2 id="${row.id}-fr-guide-title">${copy.name} : méthode, limites et confidentialité</h2>
  <figure class="fr-engineering-owner-artwork">
    <img src="/assets/img/tools/${artwork}" alt="Illustration du parcours ${copy.name}" width="640" height="360" loading="lazy">
    <figcaption>Repère visuel du parcours ${copy.name}.</figcaption>
  </figure>
  <div class="fr-engineering-guide-grid">
    <article><h3>Objectif</h3><p>${copy.purpose}</p></article>
    <article><h3>Méthode</h3><p>Procédure conseillée : ${copy.method}</p></article>
    <article><h3>À vérifier</h3><p>Contrôle indispensable : ${copy.caveat}</p></article>
  </div>
  <div class="fr-engineering-trust" role="note">
    <p><strong>Calcul local et privé.</strong> Les saisies et les exports restent dans ce navigateur. Aucun contenu de projet n’est envoyé à un service d’IA sans une action volontaire et un consentement explicite indiquant les données transmises.</p>
    <p><strong>Estimation de planification.</strong> Vérifiez les dimensions, prix, normes, autorisations et conditions de site avant toute commande ou exécution.</p>
    <p><strong>Même méthode dans les deux langues.</strong> Vous pouvez consulter <a href="${row.english}">la version anglaise équivalente</a> ; les mêmes données produisent les mêmes résultats.</p>
  </div>
  <dl class="fr-engineering-provenance">
    <div><dt>Version équivalente</dt><dd><a href="${englishSource}">${englishSource}</a></dd></div>
    <div><dt>Fraîcheur</dt><dd><time datetime="2026-07-29">29 juillet 2026</time></dd></div>
    <div><dt>Confiance</dt><dd>Résultats vérifiés par comparaison avec la version anglaise ; les prix et conditions de chantier restent à confirmer localement.</dd></div>
  </dl>
  <div class="fr-engineering-local-export">
    <button type="button" data-fr-engineering-reset>Réinitialiser le parcours</button>
    <label class="fr-engineering-import">
      <span>Rouvrir un état JSON</span>
      <input type="file" accept="application/json,.json" data-fr-engineering-import aria-label="Choisir un état JSON à rouvrir">
    </label>
    <button type="button" data-fr-engineering-export="${row.id}">Exporter l’état local (JSON)</button>
    <span data-fr-engineering-export-status role="status" aria-live="polite">Aucune donnée n’est envoyée.</span>
    <span data-fr-engineering-runtime-status role="status" aria-live="polite"></span>
  </div>
  <details><summary>Cette estimation remplace-t-elle une validation professionnelle ?</summary><p>Non. Elle structure une première décision. Les documents d’exécution, notes de calcul, installations et devis doivent être contrôlés par les professionnels compétents.</p></details>
  <details><summary>Mes données sont-elles envoyées à une IA ?</summary><p>Non par défaut. Le calcul déterministe et les exports fonctionnent localement. Toute assistance d’IA doit rester facultative, expliquer son transfert de données et demander votre consentement.</p></details>
</section>
<script src="/assets/js/pages/fr-engineering-export.js"></script>
<script src="/assets/js/pages/fr-engineering-acceptance.js"></script>`;
}

function structuredData(row, frenchRoute) {
  const copy = OWNER_COPY[row.id];
  const url = `https://afrotools.com${frenchRoute}`;
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: copy.name,
      description: copy.purpose,
      url,
      inLanguage: 'fr',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Tout navigateur moderne',
      isAccessibleForFree: true,
      featureList: [copy.method, 'Calcul déterministe local', 'Résultat exportable lorsque le propriétaire anglais le permet']
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'fr',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Comment utiliser ${copy.name} ?`,
          acceptedAnswer: { '@type': 'Answer', text: copy.method }
        },
        {
          '@type': 'Question',
          name: 'Cette estimation remplace-t-elle une validation professionnelle ?',
          acceptedAnswer: { '@type': 'Answer', text: `Non. ${copy.caveat}` }
        },
        {
          '@type': 'Question',
          name: 'Les données sont-elles envoyées à une IA ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Non par défaut. Le calcul et les exports sont locaux. Toute assistance d’IA doit être facultative et soumise à un consentement explicite.' }
        }
      ]
    }
  ], null, 2).replace(/</g, '\\u003c');
}

module.exports = {
  OWNER_COPY,
  COMMON_PAIRS,
  combinedPairs,
  nativeGuide,
  sanitizeResidualEnglishHtml,
  structuredData,
  translateJavaScriptPresentation,
  translateText,
  translateVisibleHtml
};
