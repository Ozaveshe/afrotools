'use strict';

const COPY = {
  fr: {
    code: 'fr', locale: 'fr_FR', root: '/fr/', about: '/fr/about/', contact: '/fr/contact/', faq: '/fr/faq/', cookies: '/fr/cookies/', privacy: '/fr/privacy/', terms: '/fr/terms-of-use/', tools: '/fr/all-tools/', countries: '/fr/countries/', blog: '/fr/blog/', suggest: '/fr/suggest-tool/', advertise: '/fr/advertise/',
    aboutTitle: 'À propos d’AfroTools', aboutDescription: 'Découvrez la mission, la méthode, les limites et les engagements d’AfroTools pour des outils africains utiles, vérifiables et respectueux de la vie privée.',
    contactTitle: 'Contacter AfroTools', contactDescription: 'Signalez une erreur, proposez un outil, posez une question ou présentez un partenariat à l’équipe AfroTools.',
    faqTitle: 'Questions fréquentes sur AfroTools', faqDescription: 'Réponses sur les calculs, les sources, la confidentialité, les langues, les exports, AfroTools AI et les fonctions Pro.',
    cookiesTitle: 'Politique relative aux cookies', cookiesDescription: 'Comprendre les cookies, le stockage local, la mesure d’audience et les choix de consentement sur AfroTools.',
    skip: 'Aller au contenu', home: 'Accueil', updated: 'Mise à jour : août 2026',
    mission: 'Des outils pratiques conçus autour des décisions africaines.',
    missionLead: 'AfroTools aide une personne à calculer, vérifier, préparer, comparer ou exporter un résultat sans devoir adapter un produit pensé pour un autre marché. La langue de l’interface, le pays, la devise, la juridiction et la source sont traités comme des dimensions distinctes.',
    principles: [
      ['Le besoin avant la fonctionnalité', 'Chaque page doit conduire à une tâche concrète : obtenir une estimation, préparer un document, comprendre une règle, comparer des options ou conserver une preuve portable.'],
      ['Le pays avant l’hypothèse', 'Un taux ou une règle n’est utilisé que dans le contexte annoncé. Les outils à données variables affichent la source, la date, la confiance et les limites quand ces éléments influencent le résultat.'],
      ['Le navigateur avant le serveur', 'Les calculs et documents sensibles restent locaux lorsque le produit l’annonce. Tout envoi vers un compte, un formulaire, une fonction cloud ou un fournisseur d’IA doit être visible et volontaire.'],
      ['Une sortie réutilisable', 'Un bon outil ne s’arrête pas à un nombre à l’écran. Selon la tâche, AfroTools propose copie, impression ou exports structurés que l’utilisateur peut rouvrir et vérifier.']
    ],
    aboutSections: [
      ['Pourquoi AfroTools existe', 'Les réalités africaines ne se résument pas à traduire une interface. Les systèmes fiscaux, monnaies, pratiques commerciales, formats administratifs, infrastructures et niveaux de connectivité diffèrent. AfroTools construit donc des parcours qui commencent par le contexte réel de la décision.'],
      ['Comment les outils sont construits', 'Les moteurs déterministes sont séparés de l’interface quand un calcul ou une règle doit être testé. Les pages expliquent les entrées, les hypothèses et le résultat. Les workflows de fichiers vérifient les exports en les rouvrant plutôt qu’en considérant un simple clic comme une preuve.'],
      ['Sources et actualité', 'Une source disponible ne prouve pas qu’un taux est encore actuel. Les données sensibles au temps sont associées à une date de contrôle et, lorsque le risque l’exige, le produit s’arrête plutôt que d’afficher une valeur dépassée comme si elle était actuelle.'],
      ['Langues et couverture', 'Le français, le swahili, le haoussa et le yoruba sont des produits à part entière, avec leurs routes, métadonnées et contrôles. Une route anglaise de secours doit être indiquée clairement ; elle ne compte pas comme une expérience localisée terminée.'],
      ['Confidentialité et IA', 'AfroTools privilégie le traitement local. Une assistance IA est facultative et ne doit pas remplacer le moteur vérifiable d’un calcul. Lorsque du contenu utilisateur doit quitter l’appareil, l’interface décrit ce qui sera envoyé et demande un consentement explicite.'],
      ['Accessibilité et appareils modestes', 'Les parcours sont conçus pour le clavier, les petits écrans, le zoom du texte et les connexions contraintes. Les libellés, le focus, les messages d’état et les limites de largeur font partie du produit, pas d’une finition facultative.'],
      ['Ce qu’AfroTools ne promet pas', 'Les estimations ne sont ni une déclaration officielle, ni un devis garanti, ni un conseil juridique, médical ou financier. Un résultat important doit être confirmé avec l’autorité, le professionnel ou le fournisseur compétent.'],
      ['Comment contribuer', 'Vous pouvez signaler une erreur avec le nom de l’outil, le pays, la source concernée et un exemple reproductible. Vous pouvez aussi proposer un outil, une correction linguistique ou un partenariat clairement identifié.']
    ],
    contactIntro: 'Choisissez le motif le plus précis possible. Le formulaire envoie uniquement les champs visibles au service de formulaire configuré afin que l’équipe puisse répondre. N’incluez pas de mot de passe, de document d’identité, de dossier médical, de CV complet ni de données financières sensibles.',
    form: { name: 'Nom', email: 'E-mail', reason: 'Motif', tool: 'Outil ou page concernée', country: 'Pays ou marché', message: 'Message', submit: 'Envoyer le message', privacy: 'En envoyant ce formulaire, vous acceptez que ces informations soient utilisées pour répondre à votre demande.', reasons: ['Erreur de calcul ou de contenu','Proposition d’outil','Correction de langue','Partenariat ou publicité','Compte ou Pro','Autre question'] },
    contactCards: [
      ['Signaler une erreur utilement', 'Indiquez la route ou le nom de l’outil, les entrées utilisées, le résultat attendu, le résultat observé et la source officielle si vous en avez une. N’envoyez pas de vraies données personnelles.'],
      ['Proposer un outil', 'Expliquez la décision à prendre, le pays concerné, les entrées nécessaires et la sortie utile. Une proposition précise est plus facile à évaluer qu’un simple nom.'],
      ['Partenariats', 'Les partenariats et placements doivent être clairement identifiés. Ils ne déterminent pas les formules, classements, sources, résultats ni l’éligibilité affichée par un outil.'],
      ['Délai et autres canaux', 'Pour une question de confidentialité, écrivez à privacy@afrotools.com. Pour le reste, hello@afrotools.com reste disponible. Le formulaire ne constitue pas un canal d’urgence.']
    ],
    faqIntro: 'Ces réponses couvrent le fonctionnement général. La page de chaque outil reste la référence pour ses entrées, ses sources, ses exports et ses limites.',
    faqs: [
      ['AfroTools est-il gratuit ?', 'Les outils essentiels du catalogue public sont accessibles sans abonnement payant. Certaines fonctions de compte, synchronisation, API ou applications Pro peuvent être payantes et doivent l’indiquer avant l’achat.'],
      ['Les résultats sont-ils officiels ?', 'Non. Ce sont des calculs, comparaisons ou guides de préparation. Vérifiez toute décision importante auprès de l’autorité, du professionnel ou du fournisseur compétent.'],
      ['Comment savoir si une donnée est actuelle ?', 'Les outils dépendant de taux, règles ou disponibilités variables affichent une source, une date de contrôle et une limite de confiance. Une donnée expirée doit être bloquée ou présentée comme historique.'],
      ['Pourquoi deux outils similaires donnent-ils des résultats différents ?', 'Vérifiez le pays, la période, la devise, les déductions, la méthode d’arrondi et les hypothèses. Une différence peut être correcte si le contexte n’est pas le même.'],
      ['Mes données quittent-elles mon appareil ?', 'Les workflows annoncés comme locaux s’exécutent dans le navigateur. Les comptes, formulaires, paiements, synchronisations et fonctions IA sont des flux séparés qui peuvent envoyer les informations affichées.'],
      ['Puis-je utiliser AfroTools sans compte ?', 'Oui pour le noyau public. Un compte est requis uniquement lorsqu’une fonction annonce une synchronisation, un historique cloud, un droit Pro ou une autre capacité liée au compte.'],
      ['Comment fonctionne AfroTools AI ?', 'L’assistant aide à trouver un outil, clarifier une tâche ou expliquer un résultat. Il ne doit pas inventer une formule, une source ou un taux à la place d’un moteur déterministe disponible.'],
      ['Puis-je télécharger mes résultats ?', 'Cela dépend du workflow. Les formats annoncés peuvent inclure TXT, JSON, CSV, image ou PDF. Un outil ne doit pas annoncer un format qu’il ne génère pas réellement.'],
      ['Les PDF et fichiers sont-ils envoyés au serveur ?', 'Les opérations décrites comme locales restent dans le navigateur. Si un futur parcours cloud est proposé, l’envoi doit être annoncé avant le transfert.'],
      ['Que signifie une route de secours en anglais ?', 'Cela signifie qu’une expérience localisée complète n’existe pas encore. Le changement de langue doit être indiqué clairement et ne doit pas être compté comme une page traduite.'],
      ['Comment changer de pays sans changer de langue ?', 'Utilisez le sélecteur de pays ou l’option du calculateur. La langue contrôle l’interface ; le pays contrôle la juridiction, la devise ou la source applicable.'],
      ['Comment signaler une traduction incorrecte ?', 'Utilisez la page Contact et précisez la route, le texte actuel, la correction proposée et, si utile, la variante régionale concernée.'],
      ['AfroTools vend-il mes données ?', 'Non. Les prestataires peuvent recevoir les données limitées nécessaires au flux choisi, conformément à la politique de confidentialité.'],
      ['Puis-je citer ou intégrer un résultat ?', 'Vous pouvez utiliser votre résultat sous votre responsabilité, en conservant la source, la date et les hypothèses. Pour réutiliser une marque, un moteur ou un contenu protégé, demandez une autorisation si la loi l’exige.'],
      ['Comment demander la suppression de données ?', 'Effacez d’abord les brouillons locaux depuis l’outil ou le navigateur. Pour des données de compte ou de formulaire éligibles, contactez privacy@afrotools.com avec suffisamment d’informations pour vérifier la demande.'],
      ['Comment proposer une nouvelle source ?', 'Envoyez le lien officiel, le pays, la règle concernée, sa date d’effet et la partie de l’outil qu’elle devrait modifier. Un lien seul ne prouve pas qu’une valeur publique est actuelle.']
    ],
    cookiesIntro: 'AfroTools distingue les cookies, le stockage local du navigateur et les requêtes techniques. Refuser le stockage d’analyse n’empêche pas nécessairement le serveur de recevoir les métadonnées minimales nécessaires pour livrer une page.',
    cookieSections: [
      ['Cookies strictement nécessaires', 'Ils peuvent servir à la sécurité, à la session, au consentement ou à une fonction demandée. Les désactiver dans le navigateur peut empêcher une connexion ou une préférence de fonctionner.'],
      ['Stockage local et IndexedDB', 'Des outils peuvent conserver le pays, la langue, le thème, des favoris, des brouillons ou des fichiers de travail sur votre appareil. Ces données ne sont pas automatiquement synchronisées. Vous pouvez les effacer avec les contrôles du produit ou les réglages du navigateur.'],
      ['Mesure d’audience', 'Lorsque le stockage d’analyse est refusé, certaines pages peuvent envoyer des signaux techniques limités sans identifiant persistant. Les événements produit détaillés, identifiants et stockages d’analyse nécessitent le consentement prévu par l’interface.'],
      ['Services tiers', 'Un formulaire, un paiement, un compte, une vidéo intégrée ou une fonction IA peut déclencher une requête vers le prestataire annoncé. Ce flux est distinct de la simple ouverture d’un calculateur local.'],
      ['Gérer vos choix', 'Utilisez le panneau de consentement lorsqu’il est disponible, les réglages du navigateur pour supprimer le stockage, et les contrôles de chaque outil pour effacer ses brouillons. Le retrait s’applique aux traitements futurs.'],
      ['Ce qui ne doit pas entrer dans l’analyse', 'Les valeurs de calcul, le contenu de documents, les identifiants personnels, les textes de CV, les données médicales, juridiques ou financières et les paramètres sensibles d’URL ne doivent pas être envoyés comme événements analytiques.'],
      ['Durée et modifications', 'La durée dépend du mécanisme et du prestataire. Une modification importante de la mesure, des prestataires ou du consentement doit être reflétée dans cette page et dans la politique de confidentialité.'],
      ['Questions', 'Pour une question sur les cookies, le stockage ou la suppression de données éligibles, écrivez à privacy@afrotools.com.']
    ]
  },
  sw: {
    code: 'sw', locale: 'sw_KE', root: '/sw/', about: '/sw/kuhusu/', contact: '/sw/wasiliana/', faq: '/sw/maswali-ya-mara-kwa-mara/', cookies: '/sw/vidakuzi/', privacy: '/sw/faragha/', terms: '/sw/masharti/', tools: '/sw/zana-zote/', countries: '/sw/nchi/', blog: '/sw/blogu/', suggest: '/sw/pendekeza-zana/', advertise: '/sw/tangaza/',
    aboutTitle: 'Kuhusu AfroTools', aboutDescription: 'Jifunze dhamira, mbinu, mipaka na ahadi za AfroTools katika kujenga zana za Afrika zinazofaa, zinazoweza kuhakikiwa na zinazolinda faragha.',
    contactTitle: 'Wasiliana na AfroTools', contactDescription: 'Ripoti hitilafu, pendekeza zana, uliza swali au eleza ushirikiano kwa timu ya AfroTools.',
    faqTitle: 'Maswali yanayoulizwa mara kwa mara kuhusu AfroTools', faqDescription: 'Majibu kuhusu hesabu, vyanzo, faragha, lugha, upakuaji, AfroTools AI na vipengele vya Pro.',
    cookiesTitle: 'Sera ya vidakuzi', cookiesDescription: 'Elewa vidakuzi, hifadhi ya ndani, uchanganuzi na chaguo za idhini kwenye AfroTools.',
    skip: 'Ruka hadi maudhui', home: 'Mwanzo', updated: 'Ilisasishwa: Agosti 2026',
    mission: 'Zana za vitendo zilizojengwa kuzunguka maamuzi ya Afrika.',
    missionLead: 'AfroTools humsaidia mtu kukokotoa, kuthibitisha, kuandaa, kulinganisha au kupakua matokeo bila kulazimika kubadilisha bidhaa iliyoundwa kwa soko jingine. Lugha ya kiolesura, nchi, sarafu, mamlaka na chanzo hushughulikiwa kama vipengele tofauti.',
    principles: [
      ['Kazi kabla ya kipengele', 'Kila ukurasa unapaswa kuongoza kwenye kazi halisi: kupata makadirio, kuandaa hati, kuelewa kanuni, kulinganisha chaguo au kuhifadhi ushahidi unaoweza kuhamishwa.'],
      ['Nchi kabla ya dhana', 'Kiwango au kanuni hutumiwa tu katika muktadha ulioelezwa. Zana zenye data inayobadilika huonyesha chanzo, tarehe, uhakika na mipaka vinapoathiri matokeo.'],
      ['Kivinjari kabla ya seva', 'Hesabu na hati nyeti hubaki kwenye kifaa inaposemwa hivyo. Utumaji kwa akaunti, fomu, wingu au mtoa huduma wa AI lazima uonekane na uchaguliwe na mtumiaji.'],
      ['Tokeo linaloweza kutumiwa tena', 'Zana nzuri haiishii kwenye namba ya skrini. Kulingana na kazi, AfroTools hutoa kunakili, kuchapisha au faili zilizopangwa ambazo zinaweza kufunguliwa tena na kuhakikiwa.']
    ],
    aboutSections: [
      ['Kwa nini AfroTools ipo', 'Hali za Afrika haziwezi kutatuliwa kwa kutafsiri kiolesura pekee. Mifumo ya kodi, sarafu, biashara, hati za serikali, miundombinu na kasi za mtandao hutofautiana. Ndiyo maana AfroTools huanza na muktadha halisi wa uamuzi.'],
      ['Jinsi zana zinavyojengwa', 'Injini za hesabu hutenganishwa na kiolesura pale kanuni inapotakiwa kupimwa. Kurasa hueleza ingizo, dhana na matokeo. Mtiririko wa faili huthibitisha faili kwa kuifungua tena badala ya kuchukulia kubofya kitufe kuwa ushahidi.'],
      ['Vyanzo na uhalali wa wakati', 'Kupatikana kwa chanzo hakuthibitishi kuwa kiwango bado ni cha sasa. Data inayobadilika huambatanishwa na tarehe ya ukaguzi na, inapohitajika, zana husimama badala ya kuonyesha thamani iliyopitwa na wakati kama ya sasa.'],
      ['Lugha na upatikanaji', 'Kiswahili, Kifaransa, Hausa na Yoruba ni bidhaa kamili zenye njia, metadata na vidhibiti vyake. Njia ya Kiingereza ya muda lazima iwe na alama wazi; haihesabiwi kama uzoefu uliotafsiriwa.'],
      ['Faragha na AI', 'AfroTools hupendelea uchakataji wa ndani. AI ni ya hiari na haichukui nafasi ya injini inayoweza kuhakikiwa. Maudhui yanapotoka kwenye kifaa, kiolesura hueleza yatakayotumwa na kuomba idhini ya wazi.'],
      ['Ufikiaji na simu za kawaida', 'Mtiririko huundwa kwa kibodi, skrini ndogo, kukuza maandishi na mitandao yenye vikwazo. Lebo, focus, ujumbe wa hali na kuzuia overflow ni sehemu ya bidhaa.'],
      ['Kile AfroTools haiahidi', 'Makadirio si uwasilishaji rasmi, nukuu iliyohakikishwa, wala ushauri wa sheria, afya au fedha. Uamuzi muhimu uthibitishwe kwa mamlaka, mtaalamu au mtoa huduma husika.'],
      ['Jinsi ya kuchangia', 'Ripoti hitilafu ukiweka jina la zana, nchi, chanzo na mfano unaoweza kurudiwa. Unaweza pia kupendekeza zana, marekebisho ya lugha au ushirikiano ulioelezwa wazi.']
    ],
    contactIntro: 'Chagua sababu iliyo sahihi. Fomu hutuma tu sehemu zinazoonekana kwa huduma ya fomu ili timu ijibu. Usiweke nenosiri, kitambulisho, rekodi ya afya, CV kamili au data nyeti ya fedha.',
    form: { name: 'Jina', email: 'Barua pepe', reason: 'Sababu', tool: 'Zana au ukurasa', country: 'Nchi au soko', message: 'Ujumbe', submit: 'Tuma ujumbe', privacy: 'Kwa kutuma fomu hii, unakubali taarifa hizi zitumike kujibu ombi lako.', reasons: ['Hitilafu ya hesabu au maudhui','Pendekezo la zana','Marekebisho ya lugha','Ushirikiano au tangazo','Akaunti au Pro','Swali jingine'] },
    contactCards: [
      ['Ripoti hitilafu kwa usahihi', 'Taja njia au jina la zana, ingizo ulilotumia, matokeo yaliyotarajiwa, matokeo uliyopata na chanzo rasmi ukikuwa nacho. Usitume data halisi ya mtu.'],
      ['Pendekeza zana', 'Eleza uamuzi unaotakiwa, nchi, ingizo muhimu na tokeo linalohitajika. Pendekezo lenye maelezo ni rahisi kutathmini kuliko jina pekee.'],
      ['Ushirikiano', 'Ushirikiano na matangazo lazima yawekwe alama wazi. Hayaamui fomula, viwango, vyanzo, matokeo au ustahiki unaoonyeshwa na zana.'],
      ['Muda na njia nyingine', 'Kwa swali la faragha andika privacy@afrotools.com. Kwa mengine hello@afrotools.com inapatikana. Fomu si njia ya dharura.']
    ],
    faqIntro: 'Majibu haya yanaeleza mfumo kwa ujumla. Ukurasa wa kila zana ndio rejea ya ingizo, vyanzo, faili na mipaka yake.',
    faqs: [
      ['Je, AfroTools ni bure?', 'Zana muhimu za umma zinapatikana bila usajili wa kulipia. Baadhi ya akaunti, usawazishaji, API au programu za Pro zinaweza kulipiwa na lazima zionyeshe hilo kabla ya ununuzi.'],
      ['Je, matokeo ni rasmi?', 'Hapana. Ni hesabu, ulinganisho au mwongozo wa maandalizi. Thibitisha uamuzi muhimu kwa mamlaka, mtaalamu au mtoa huduma husika.'],
      ['Nitajuaje data ni ya sasa?', 'Zana zinazotegemea viwango au kanuni hubainisha chanzo, tarehe ya ukaguzi na kiwango cha uhakika. Data iliyopitwa na wakati huzuiwa au kuonyeshwa kama ya kihistoria.'],
      ['Kwa nini zana zinazofanana zinatoa matokeo tofauti?', 'Kagua nchi, kipindi, sarafu, makato, kuzungusha na dhana. Tofauti inaweza kuwa sahihi ikiwa muktadha si sawa.'],
      ['Je, data yangu hutoka kwenye kifaa?', 'Mtiririko ulioelezwa kuwa wa ndani hufanya kazi kwenye kivinjari. Akaunti, fomu, malipo, usawazishaji na AI ni mitiririko tofauti inayoweza kutuma taarifa zilizoonyeshwa.'],
      ['Naweza kutumia AfroTools bila akaunti?', 'Ndiyo kwa msingi wa umma. Akaunti huhitajika tu pale kipengele kinapotangaza usawazishaji, historia ya wingu, haki ya Pro au uwezo mwingine wa akaunti.'],
      ['AfroTools AI hufanya kazi vipi?', 'Msaidizi husaidia kupata zana, kufafanua kazi au kueleza matokeo. Hapaswi kubuni fomula, chanzo au kiwango badala ya injini inayoweza kuhakikiwa.'],
      ['Naweza kupakua matokeo?', 'Inategemea zana. Miundo inaweza kuwa TXT, JSON, CSV, picha au PDF. Zana haipaswi kutangaza muundo ambao haitengenezi.'],
      ['PDF na faili hutumwa kwa seva?', 'Operesheni zinazoelezwa kuwa za ndani hubaki kwenye kivinjari. Mtiririko wa wingu ukitolewa, utumaji lazima uelezwe kabla ya kuhamisha faili.'],
      ['Njia ya muda ya Kiingereza maana yake nini?', 'Inamaanisha uzoefu kamili wa lugha haujakamilika. Kubadilisha lugha lazima kuwe na alama wazi na kusihesabiwe kama ukurasa uliotafsiriwa.'],
      ['Ninabadilishaje nchi bila kubadilisha lugha?', 'Tumia kichagua nchi au chaguo la zana. Lugha inadhibiti kiolesura; nchi inadhibiti mamlaka, sarafu au chanzo.'],
      ['Ninaripotije tafsiri isiyo sahihi?', 'Tumia ukurasa wa mawasiliano na taja njia, maandishi ya sasa, marekebisho na lahaja ya eneo inapohitajika.'],
      ['AfroTools huuza data yangu?', 'Hapana. Watoa huduma wanaweza kupokea data ndogo inayohitajika kwa mtiririko uliochagua kulingana na sera ya faragha.'],
      ['Naweza kunukuu au kuunganisha matokeo?', 'Unaweza kutumia matokeo kwa uwajibikaji, ukihifadhi chanzo, tarehe na dhana. Omba ruhusa pale matumizi ya chapa, injini au maudhui yanapohitaji.'],
      ['Naombaje data ifutwe?', 'Futa kwanza rasimu za ndani kwenye zana au kivinjari. Kwa data ya akaunti au fomu inayostahili, wasiliana na privacy@afrotools.com.'],
      ['Ninapendekezaje chanzo kipya?', 'Tuma kiungo rasmi, nchi, kanuni, tarehe ya kuanza na sehemu ya zana inayobadilika. Kiungo pekee hakithibitishi kuwa thamani ya umma ni ya sasa.']
    ],
    cookiesIntro: 'AfroTools hutofautisha vidakuzi, hifadhi ya kivinjari na maombi ya kiufundi. Kukataa hifadhi ya uchanganuzi hakuzuii seva kupokea metadata ndogo inayohitajika kuwasilisha ukurasa.',
    cookieSections: [
      ['Vidakuzi muhimu', 'Vinaweza kutumika kwa usalama, session, idhini au kazi uliyoomba. Kuvizima kwenye kivinjari kunaweza kuzuia kuingia au mapendeleo kufanya kazi.'],
      ['Hifadhi ya ndani na IndexedDB', 'Zana zinaweza kuhifadhi nchi, lugha, mandhari, vipendwa, rasimu au faili kwenye kifaa. Data hii haisawazishwi moja kwa moja. Ifute kwa vidhibiti vya bidhaa au mipangilio ya kivinjari.'],
      ['Uchanganuzi', 'Hifadhi ya uchanganuzi ikikataliwa, baadhi ya kurasa zinaweza kutuma ishara chache za kiufundi bila kitambulishi cha kudumu. Matukio ya bidhaa na vitambulishi vinahitaji idhini inayotolewa na kiolesura.'],
      ['Huduma za wengine', 'Fomu, malipo, akaunti, video au AI inaweza kuanzisha ombi kwa mtoa huduma aliyeelezwa. Huu ni mtiririko tofauti na kufungua kikokotoo cha ndani.'],
      ['Dhibiti chaguo zako', 'Tumia paneli ya idhini, mipangilio ya kivinjari na vidhibiti vya kila zana kufuta rasimu. Kuondoa idhini hutumika kwa uchakataji wa baadaye.'],
      ['Data isiyo ya uchanganuzi', 'Thamani za hesabu, hati, vitambulisho, CV, data ya afya, sheria au fedha na vigezo nyeti vya URL havipaswi kutumwa kama matukio ya uchanganuzi.'],
      ['Muda na mabadiliko', 'Muda hutegemea mfumo na mtoa huduma. Mabadiliko muhimu ya uchanganuzi, mtoa huduma au idhini yaonyeshwe hapa na kwenye sera ya faragha.'],
      ['Maswali', 'Kwa swali kuhusu vidakuzi, hifadhi au kufuta data inayostahili, andika privacy@afrotools.com.']
    ]
  }
};

function esc(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function alternates(type) {
  const routes = { about: ['/about/','/fr/about/','/sw/kuhusu/'], contact: ['/contact/','/fr/contact/','/sw/wasiliana/'], faq: ['/faq/','/fr/faq/','/sw/maswali-ya-mara-kwa-mara/'], cookies: ['/cookies/','/fr/cookies/','/sw/vidakuzi/'] }[type];
  return `<link rel="alternate" hreflang="en" href="https://afrotools.com${routes[0]}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${routes[1]}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${routes[2]}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${routes[0]}">`;
}
function head(c, type, title, description, canonical, schema) {
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="content-language" content="${c.code}"><title>${esc(title)} | AfroTools</title><meta name="description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:locale" content="${c.locale}"><meta property="og:site_name" content="AfroTools"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://afrotools.com${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/og/og-home-v2.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://afrotools.com/assets/img/og/og-home-v2.webp"><link rel="canonical" href="https://afrotools.com${canonical}">${alternates(type)}<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/localized-institutional.css"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script>`;
}
function shell(c, type, title, description, canonical, schema, eyebrow, lead, body) {
  return `<!doctype html><html lang="${c.code}"><head>${head(c,type,title,description,canonical,schema)}</head><body><a class="skip-link" href="#main">${c.skip}</a><afro-navbar></afro-navbar><main id="main" class="li-page"><header class="li-hero"><div class="li-wrap"><nav aria-label="Breadcrumb"><a href="${c.root}">${c.home}</a> <span aria-hidden="true">›</span> ${esc(title)}</nav><p class="li-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="li-lead">${esc(lead)}</p></div></header>${body}</main><afro-footer></afro-footer><script defer src="/assets/js/lazy-analytics.js"></script></body></html>\n`;
}
function cards(items) { return `<div class="li-grid">${items.map(([h,p]) => `<article class="li-card"><h2>${esc(h)}</h2><p>${esc(p)}</p></article>`).join('')}</div>`; }
function renderAbout(locale) {
  const c = COPY[locale]; const schema = {'@context':'https://schema.org','@type':'AboutPage',name:c.aboutTitle,url:`https://afrotools.com${c.about}`,inLanguage:c.code,isPartOf:{'@type':'WebSite',name:'AfroTools',url:`https://afrotools.com${c.root}`}};
  const body = `<section class="li-section"><div class="li-wrap">${cards(c.principles)}</div></section><section class="li-section li-muted"><div class="li-wrap li-prose">${c.aboutSections.map(([h,p])=>`<section><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('')}<div class="li-actions"><a class="btn btn-primary" href="${c.tools}">${locale==='fr'?'Explorer les outils':'Vinjari zana'}</a><a class="btn btn-secondary" href="${c.contact}">${locale==='fr'?'Contacter l’équipe':'Wasiliana na timu'}</a><a class="btn btn-secondary" href="${c.blog}">${locale==='fr'?'Lire les guides':'Soma miongozo'}</a></div></div></section>`;
  return shell(c,'about',c.aboutTitle,c.aboutDescription,c.about,schema,locale==='fr'?'Notre mission':'Dhamira yetu',c.missionLead,body);
}
function renderContact(locale) {
  const c=COPY[locale], f=c.form; const schema={'@context':'https://schema.org','@type':'ContactPage',name:c.contactTitle,url:`https://afrotools.com${c.contact}`,inLanguage:c.code};
  const options=f.reasons.map(v=>`<option>${esc(v)}</option>`).join('');
  const form=`<form class="li-form" name="contact-${c.code}" method="POST" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="contact-${c.code}"><p class="li-honeypot"><label>Leave empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p><div class="li-form-grid"><label>${f.name}<input name="name" autocomplete="name" required></label><label>${f.email}<input name="email" type="email" autocomplete="email" required></label><label>${f.reason}<select name="reason" required><option value="">—</option>${options}</select></label><label>${f.tool}<input name="tool" autocomplete="off"></label><label>${f.country}<input name="country" autocomplete="country-name"></label><label class="li-wide">${f.message}<textarea name="message" rows="7" required></textarea></label></div><p class="li-note">${esc(f.privacy)} <a href="${c.privacy}">${locale==='fr'?'Politique de confidentialité':'Sera ya faragha'}</a>.</p><button class="btn btn-primary" type="submit">${f.submit}</button></form>`;
  const body=`<section class="li-section"><div class="li-wrap li-two"><div><h2>${locale==='fr'?'Envoyer une demande':'Tuma ombi'}</h2><p>${esc(c.contactIntro)}</p>${form}</div><aside>${c.contactCards.map(([h,p])=>`<section class="li-card"><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('')}</aside></div></section>`;
  return shell(c,'contact',c.contactTitle,c.contactDescription,c.contact,schema,locale==='fr'?'Une voie claire pour chaque demande':'Njia wazi kwa kila ombi',c.contactDescription,body);
}
function renderFaq(locale) {
  const c=COPY[locale]; const schema={'@context':'https://schema.org','@type':'FAQPage',mainEntity:c.faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))};
  const statusText = locale === 'fr'
    ? "shown+' réponse'+(shown>1?'s':'')+' affichée'+(shown>1?'s':'')"
    : "shown+' jibu limeonyeshwa'";
  const body=`<section class="li-section"><div class="li-wrap li-prose"><form class="li-faq-search" role="search" onsubmit="return false"><label for="${locale}FaqSearch">${locale==='fr'?'Rechercher dans les réponses':'Tafuta ndani ya majibu'}</label><input id="${locale}FaqSearch" type="search" autocomplete="off" placeholder="${locale==='fr'?'Ex. confidentialité, PDF, pays':'Mfano: faragha, PDF, nchi'}"></form><div class="li-faq">${c.faqs.map(([q,a])=>`<section class="li-faq-item"><h2>${esc(q)}</h2><p>${esc(a)}</p></section>`).join('')}</div><p class="li-faq-status" aria-live="polite"></p><div class="li-actions"><a class="btn btn-primary" href="${c.tools}">${locale==='fr'?'Trouver un outil':'Tafuta zana'}</a><a class="btn btn-secondary" href="${c.contact}">${locale==='fr'?'Poser une autre question':'Uliza swali jingine'}</a><a class="btn btn-secondary" href="${c.privacy}">${locale==='fr'?'Lire la confidentialité':'Soma faragha'}</a></div></div></section><script>(function(){var input=document.getElementById('${locale}FaqSearch'),items=[].slice.call(document.querySelectorAll('.li-faq-item')),status=document.querySelector('.li-faq-status');input.addEventListener('input',function(){var q=input.value.toLocaleLowerCase('${locale}'),shown=0;items.forEach(function(item){var visible=!q||item.textContent.toLocaleLowerCase('${locale}').indexOf(q)>=0;item.hidden=!visible;if(visible)shown++;});status.textContent=${statusText};});})();</script>`;
  return shell(c,'faq',c.faqTitle,c.faqDescription,c.faq,schema,locale==='fr'?'Aide et fonctionnement':'Msaada na matumizi',c.faqIntro,body);
}
function renderCookies(locale) {
  const c=COPY[locale]; const schema={'@context':'https://schema.org','@type':'WebPage',name:c.cookiesTitle,url:`https://afrotools.com${c.cookies}`,inLanguage:c.code,dateModified:'2026-08-12'};
  const body=`<section class="li-section"><div class="li-wrap li-prose">${c.cookieSections.map(([h,p])=>`<section><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('')}<div class="li-actions"><button class="btn btn-primary" type="button" data-afro-cookie-consent-open>${locale==='fr'?'Gérer mon choix d’analyse':'Dhibiti chaguo la uchanganuzi'}</button><a class="btn btn-secondary" href="${c.privacy}">${locale==='fr'?'Politique de confidentialité':'Sera ya faragha'}</a><a class="btn btn-secondary" href="${c.contact}">${locale==='fr'?'Contacter AfroTools':'Wasiliana na AfroTools'}</a></div></div></section>`;
  return shell(c,'cookies',c.cookiesTitle,c.cookiesDescription,c.cookies,schema,locale==='fr'?'Confidentialité et contrôle':'Faragha na udhibiti',c.cookiesIntro,body);
}

function enhanceLegalSurface(html, locale) {
  const c = COPY[locale];
  const title = ((html.match(/<title>([^<]+)<\/title>/i) || [,'AfroTools'])[1]).replace(/\s*[—-]\s*AfroTools\s*$/i, '');
  const description = (html.match(/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']+)["']/i) || [,'AfroTools'])[1];
  const canonical = (html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i) || [,'https://afrotools.com/'])[1];
  let output = html;
  if (!/<meta\b[^>]*\bproperty=["']og:title["']/i.test(output)) {
    const tags = `<meta property="og:type" content="website"><meta property="og:locale" content="${c.locale}"><meta property="og:site_name" content="AfroTools"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="https://afrotools.com/assets/img/og/og-home-v2.webp"><meta name="twitter:card" content="summary_large_image">`;
    output = output.replace('</head>', `${tags}</head>`);
  }
  if (!/application\/ld\+json/i.test(output)) {
    const schema = JSON.stringify({ '@context':'https://schema.org', '@type':'WebPage', name:title, description, url:canonical, inLanguage:locale }).replace(/</g, '\\u003c');
    output = output.replace('</head>', `<script type="application/ld+json">${schema}</script></head>`);
  }
  const labels = locale === 'fr'
    ? [['Confidentialité',c.privacy],['Conditions',c.terms],['Cookies',c.cookies],['FAQ',c.faq],['Contact',c.contact],['À propos',c.about],['Tous les outils',c.tools]]
    : [['Faragha',c.privacy],['Masharti',c.terms],['Vidakuzi',c.cookies],['Maswali',c.faq],['Wasiliana',c.contact],['Kuhusu',c.about],['Zana zote',c.tools]];
  const nav = `<nav class="sw-contract-actions li-actions" aria-label="${locale==='fr'?'Pages institutionnelles':'Kurasa za taarifa'}">${labels.map(([label,href],index)=>`<a${index?' class="alt btn btn-secondary"':' class="btn btn-primary"'} href="${href}">${label}</a>`).join('')}</nav>`;
  return output.replace('</main>', `${nav}</main>`);
}

module.exports = { COPY, renderAbout, renderContact, renderFaq, renderCookies, enhanceLegalSurface };
