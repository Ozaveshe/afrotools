(function (root, factory) {
  var bank = factory();
  if (typeof module === "object" && module.exports) module.exports = bank;
  root.AfroToolsCryptoQuizBank = bank;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var reviewedAt = "2026-07-23";
  var topics = {
    Networks: { en: "Networks", fr: "Réseaux" },
    Wallets: { en: "Wallets", fr: "Portefeuilles" },
    Privacy: { en: "Privacy", fr: "Confidentialité" },
    Accounts: { en: "Accounts", fr: "Comptes" },
    Fees: { en: "Fees", fr: "Frais" },
    Stablecoins: { en: "Stablecoins", fr: "Stablecoins" },
    Secrets: { en: "Secrets", fr: "Secrets" },
    Recovery: { en: "Recovery", fr: "Récupération" },
    Transfers: { en: "Transfers", fr: "Transferts" },
    Devices: { en: "Devices", fr: "Appareils" },
    Keys: { en: "Keys", fr: "Clés" },
  };
  function source(publisher, url) {
    return { publisher: publisher, url: url, reviewedAt: reviewedAt };
  }
  function q(
    id,
    topic,
    promptEn,
    promptFr,
    optionsEn,
    optionsFr,
    answer,
    explanationEn,
    explanationFr,
    citation,
  ) {
    var rotation =
      id.split("").reduce(function (total, character) {
        return total + character.charCodeAt(0);
      }, 0) % optionsEn.length;
    var rotatedEn = optionsEn
      .slice(rotation)
      .concat(optionsEn.slice(0, rotation));
    var rotatedFr = optionsFr
      .slice(rotation)
      .concat(optionsFr.slice(0, rotation));
    return {
      id: id,
      topic: topics[topic],
      status: "durable",
      prompt: { en: promptEn, fr: promptFr },
      options: { en: rotatedEn, fr: rotatedFr },
      answer: (answer - rotation + optionsEn.length) % optionsEn.length,
      explanation: { en: explanationEn, fr: explanationFr },
      source: citation,
    };
  }

  var bank = {
    schemaVersion: 1,
    reviewedAt: reviewedAt,
    boundary: {
      en: "Educational knowledge check only. It is not financial advice, a certification, a risk assessment or a suitability test.",
      fr: "Questionnaire éducatif uniquement. Ce n'est ni un conseil financier, ni une certification, ni une évaluation du risque ou de l'adéquation.",
    },
    sets: [
      {
        id: "fundamentals",
        name: { en: "Fundamentals", fr: "Fondamentaux" },
        description: {
          en: "Six durable questions about networks, wallets, accounts, fees and stablecoins.",
          fr: "Six questions durables sur les réseaux, portefeuilles, comptes, frais et stablecoins.",
        },
        questions: [
          q(
            "fund-peer-cash",
            "Networks",
            "How does the Bitcoin whitepaper describe Bitcoin?",
            "Comment le livre blanc de Bitcoin décrit-il Bitcoin ?",
            [
              "A peer-to-peer electronic cash system",
              "A bank-operated payment card",
              "A guaranteed investment fund",
              "A private messaging network",
            ],
            [
              "Un système d'argent électronique pair à pair",
              "Une carte de paiement exploitée par une banque",
              "Un fonds d'investissement garanti",
              "Un réseau de messagerie privé",
            ],
            0,
            "The whitepaper presents Bitcoin as a peer-to-peer electronic cash system.",
            "Le livre blanc présente Bitcoin comme un système d'argent électronique pair à pair.",
            source("Bitcoin.org", "https://bitcoin.org/en/bitcoin-paper"),
          ),
          q(
            "fund-wallet-keys",
            "Wallets",
            "What does wallet software primarily manage?",
            "Que gère principalement un logiciel de portefeuille ?",
            [
              "Private and public keys used to control funds",
              "Coins stored inside the browser",
              "Guaranteed exchange prices",
              "A government identity record",
            ],
            [
              "Les clés privées et publiques utilisées pour contrôler les fonds",
              "Des pièces stockées dans le navigateur",
              "Des prix de change garantis",
              "Un dossier d'identité gouvernemental",
            ],
            0,
            "Wallet software manages keys. The network records balances and transactions; coins are not files stored inside the wallet.",
            "Le logiciel de portefeuille gère les clés. Le réseau enregistre les soldes et transactions ; les pièces ne sont pas des fichiers stockés dans le portefeuille.",
            source(
              "Bitcoin Developer Documentation",
              "https://developer.bitcoin.org/devguide/wallets.html",
            ),
          ),
          q(
            "fund-public-ledger",
            "Privacy",
            "Which statement best describes confirmed Bitcoin transactions?",
            "Quelle affirmation décrit le mieux les transactions Bitcoin confirmées ?",
            [
              "They are public, while addresses are pseudonymous rather than automatically tied to a real name",
              "They are visible only to banks",
              "They are hidden from public block explorers",
              "They disappear after one year",
            ],
            [
              "Elles sont publiques, tandis que les adresses sont pseudonymes et ne sont pas automatiquement liées à un vrai nom",
              "Elles ne sont visibles que par les banques",
              "Elles sont masquées dans les explorateurs publics de blocs",
              "Elles disparaissent après un an",
            ],
            0,
            "Bitcoin transaction history is public. Addresses are pseudonymous, but activity can still reveal links and patterns.",
            "L'historique des transactions Bitcoin est public. Les adresses sont pseudonymes, mais l'activité peut tout de même révéler des liens et des habitudes.",
            source(
              "Bitcoin.org",
              "https://bitcoin.org/en/bitcoin-core/features/privacy",
            ),
          ),
          q(
            "fund-ethereum-accounts",
            "Accounts",
            "What controls an Ethereum externally owned account?",
            "Qu’est-ce qui contrôle un compte Ethereum détenu en externe ?",
            [
              "A private key",
              "Smart-contract code only",
              "A public block explorer",
              "A stablecoin issuer",
            ],
            [
              "Une clé privée",
              "Uniquement le code d’un contrat intelligent",
              "Un explorateur public de blocs",
              "Un émetteur de stablecoin",
            ],
            0,
            "Externally owned accounts are controlled by private keys; contract accounts are controlled by deployed code.",
            "Les comptes détenus en externe sont contrôlés par des clés privées ; les comptes de contrat sont contrôlés par du code déployé.",
            source(
              "Ethereum.org",
              "https://ethereum.org/en/developers/docs/accounts/",
            ),
          ),
          q(
            "fund-gas",
            "Fees",
            "What is Ethereum gas used to measure?",
            "À quoi sert le gas sur Ethereum ?",
            [
              "The computational work required by a transaction or operation",
              "The market price of ether",
              "The age of a wallet",
              "A fixed monthly subscription",
            ],
            [
              "Le travail informatique requis par une transaction ou une opération",
              "Le prix de marché de l'ether",
              "L'âge d'un portefeuille",
              "Un abonnement mensuel fixe",
            ],
            0,
            "Gas accounts for computational resources. The fee paid can vary with the work required and network demand.",
            "Le gas comptabilise les ressources informatiques. Les frais peuvent varier selon le travail requis et la demande du réseau.",
            source(
              "Ethereum.org",
              "https://ethereum.org/en/developers/docs/gas/",
            ),
          ),
          q(
            "fund-stablecoins",
            "Stablecoins",
            "What is the intended purpose of a stablecoin?",
            "Quel est le but recherché d’un stablecoin ?",
            [
              "To aim for a relatively stable value using a stated mechanism",
              "To guarantee profit",
              "To remove all issuer and reserve risk",
              "To make every transaction private",
            ],
            [
              "Viser une valeur relativement stable grâce à un mécanisme déclaré",
              "Garantir un bénéfice",
              "Supprimer tout risque lié à l'émetteur et aux réserves",
              "Rendre chaque transaction privée",
            ],
            0,
            "Stablecoins are designed to reduce price volatility, but mechanisms and risks differ and a peg is not a guarantee.",
            "Les stablecoins sont conçus pour réduire la volatilité, mais leurs mécanismes et risques diffèrent et un ancrage n’est pas une garantie.",
            source("Ethereum.org", "https://ethereum.org/stablecoins/"),
          ),
        ],
      },
      {
        id: "wallet-safety",
        name: { en: "Wallet Safety", fr: "Sécurité du portefeuille" },
        description: {
          en: "Six practical questions about recovery phrases, private keys and safe transfers.",
          fr: "Six questions pratiques sur les phrases de récupération, les clés privées et les transferts sûrs.",
        },
        questions: [
          q(
            "safe-never-share",
            "Secrets",
            "Who should receive your Secret Recovery Phrase or private key?",
            "À qui faut-il communiquer votre phrase secrète de récupération ou votre clé privée ?",
            [
              "Nobody, including support staff",
              "A support agent who messages first",
              "Any verified social-media account",
              "A buyer before payment",
            ],
            [
              "À personne, y compris au personnel d’assistance",
              "À un agent d’assistance qui vous contacte en premier",
              "À tout compte vérifié sur les réseaux sociaux",
              "À un acheteur avant le paiement",
            ],
            0,
            "Anyone with the phrase or private key can control the associated accounts. Legitimate support should not ask for it.",
            "Toute personne disposant de la phrase ou de la clé privée peut contrôler les comptes associés. Une assistance légitime ne doit pas la demander.",
            source(
              "MetaMask Help Center",
              "https://support.metamask.io/stay-safe/safety-in-web3/basic-safety-and-security-tips-for-metamask",
            ),
          ),
          q(
            "safe-restore",
            "Recovery",
            "What can a wallet Secret Recovery Phrase commonly restore?",
            "Que peut généralement restaurer la phrase secrète de récupération d’un portefeuille ?",
            [
              "The wallet accounts derived from that phrase",
              "Only the last transaction",
              "An exchange password",
              "A guaranteed refund",
            ],
            [
              "Les comptes du portefeuille dérivés de cette phrase",
              "Uniquement la dernière transaction",
              "Le mot de passe d’une plateforme d’échange",
              "Un remboursement garanti",
            ],
            0,
            "A recovery phrase can restore the wallet accounts derived from it, which is why it must remain secret.",
            "Une phrase de récupération peut restaurer les comptes du portefeuille qui en dérivent, c’est pourquoi elle doit rester secrète.",
            source(
              "MetaMask Help Center",
              "https://support.metamask.io/configure/wallet/how-to-reveal-your-secret-recovery-phrase",
            ),
          ),
          q(
            "safe-full-address",
            "Transfers",
            "Before sending crypto, what part of the destination address should you verify?",
            "Avant d’envoyer des cryptoactifs, quelle partie de l’adresse de destination faut-il vérifier ?",
            [
              "The full address",
              "Only the first four characters",
              "Only the final four characters",
              "Only the wallet logo",
            ],
            [
              "L’adresse complète",
              "Uniquement les quatre premiers caractères",
              "Uniquement les quatre derniers caractères",
              "Uniquement le logo du portefeuille",
            ],
            0,
            "Malware can substitute similar-looking addresses. Verify the full destination address through a trusted channel.",
            "Un logiciel malveillant peut substituer une adresse ressemblante. Vérifiez l’adresse complète par un canal fiable.",
            source("Bitcoin.org", "https://bitcoin.org/en/scams"),
          ),
          q(
            "safe-irreversible",
            "Transfers",
            "Why should transaction details be checked before broadcasting a Bitcoin payment?",
            "Pourquoi faut-il vérifier les détails avant de diffuser un paiement Bitcoin ?",
            [
              "Confirmed payments generally cannot be reversed by a central operator",
              "The address will expire immediately",
              "Every payment is automatically refunded",
              "A bank must approve the amount",
            ],
            [
              "Les paiements confirmés ne peuvent généralement pas être annulés par un opérateur central",
              "L’adresse expire immédiatement",
              "Chaque paiement est automatiquement remboursé",
              "Une banque doit approuver le montant",
            ],
            0,
            "Bitcoin payments are not reversed by a central operator, so the recipient, address, network and amount require careful checking.",
            "Les paiements Bitcoin ne sont pas annulés par un opérateur central ; il faut donc vérifier soigneusement le destinataire, l’adresse, le réseau et le montant.",
            source("Bitcoin.org", "https://bitcoin.org/en/scams"),
          ),
          q(
            "safe-device-seed",
            "Devices",
            "What is a warning sign when setting up a new hardware wallet?",
            "Quel est un signal d’alerte lors de la configuration d’un nouveau portefeuille matériel ?",
            [
              "A recovery phrase arrives pre-printed with the device",
              "The device asks you to verify its screen",
              "You compare the manufacturer packaging",
              "You install an official update",
            ],
            [
              "Une phrase de récupération est fournie préimprimée avec l’appareil",
              "L’appareil vous demande de vérifier son écran",
              "Vous comparez l’emballage du fabricant",
              "Vous installez une mise à jour officielle",
            ],
            0,
            "A pre-generated or pre-printed phrase may already be known to an attacker. Generate the phrase in the trusted setup flow.",
            "Une phrase prégénérée ou préimprimée peut déjà être connue d’un attaquant. Générez-la dans le processus de configuration fiable.",
            source("Bitcoin.org", "https://bitcoin.org/en/scams"),
          ),
          q(
            "safe-public-private",
            "Keys",
            "Which information is used to authorize spending from a wallet?",
            "Quelle information sert à autoriser une dépense depuis un portefeuille ?",
            [
              "The private key",
              "The public receiving address alone",
              "The transaction explorer URL",
              "The token ticker",
            ],
            [
              "La clé privée",
              "L’adresse publique de réception seule",
              "L’URL de l’explorateur de transaction",
              "Le symbole du jeton",
            ],
            0,
            "A private key authorizes spending. A public address can be shared to receive funds but does not authorize spending by itself.",
            "Une clé privée autorise la dépense. Une adresse publique peut être partagée pour recevoir des fonds, mais n’autorise pas à elle seule une dépense.",
            source(
              "Bitcoin Developer Documentation",
              "https://developer.bitcoin.org/devguide/wallets.html",
            ),
          ),
        ],
      },
    ],
  };
  var swTopics={Networks:"Mitandao",Wallets:"Pochi",Privacy:"Faragha",Accounts:"Akaunti",Fees:"Ada",Stablecoins:"Stablecoin",Secrets:"Siri",Recovery:"Urejeshaji",Transfers:"Uhamisho",Devices:"Vifaa",Keys:"Funguo"};
  Object.keys(topics).forEach(function(key){topics[key].sw=swTopics[key];});
  bank.boundary.sw="Jaribio la elimu tu. Si ushauri wa fedha, cheti, tathmini ya hatari wala kipimo cha kufaa.";
  var swSets={fundamentals:{name:"Misingi",description:"Maswali sita ya kudumu kuhusu mitandao, pochi, akaunti, ada na stablecoin."},"wallet-safety":{name:"Usalama wa pochi",description:"Maswali sita ya vitendo kuhusu vifungu vya urejeshaji, funguo binafsi na uhamisho salama."}};
  var sw={
    "fund-peer-cash":["Karatasi nyeupe ya Bitcoin inaelezaje Bitcoin?",["Mfumo wa pesa za kielektroniki wa moja kwa moja kati ya watumiaji","Kadi ya malipo inayoendeshwa na benki","Mfuko wa uwekezaji wenye faida iliyohakikishwa","Mtandao binafsi wa ujumbe"],"Karatasi nyeupe inaeleza Bitcoin kama mfumo wa pesa za kielektroniki wa moja kwa moja kati ya watumiaji."],
    "fund-wallet-keys":["Programu ya pochi husimamia nini hasa?",["Funguo binafsi na za umma zinazotumika kudhibiti fedha","Sarafu zilizohifadhiwa ndani ya kivinjari","Bei za ubadilishaji zilizohakikishwa","Rekodi ya utambulisho wa serikali"],"Programu ya pochi husimamia funguo. Mtandao hurekodi salio na miamala; sarafu si faili ndani ya pochi."],
    "fund-public-ledger":["Kauli ipi inaeleza vizuri miamala ya Bitcoin iliyothibitishwa?",["Ni ya umma, huku anwani zikiwa majina bandia yasiyounganishwa moja kwa moja na jina halisi","Inaonekana kwa benki pekee","Imefichwa kwa vivinjari vya blockchain vya umma","Hutoweka baada ya mwaka mmoja"],"Historia ya miamala ya Bitcoin ni ya umma. Anwani ni majina bandia, lakini shughuli bado zinaweza kufichua uhusiano na mifumo."],
    "fund-ethereum-accounts":["Ni nini hudhibiti akaunti ya Ethereum inayomilikiwa moja kwa moja?",["Ufunguo binafsi","Msimbo wa mkataba mahiri pekee","Kivinjari cha blockchain cha umma","Mtoaji wa stablecoin"],"Akaunti zinazomilikiwa moja kwa moja hudhibitiwa na funguo binafsi; akaunti za mkataba hudhibitiwa na msimbo uliowekwa."],
    "fund-gas":["Gas ya Ethereum hupima nini?",["Kazi ya ukokotoaji inayohitajika na muamala au operesheni","Bei ya soko ya ether","Umri wa pochi","Ada maalumu ya kila mwezi"],"Gas huhesabu rasilimali za ukokotoaji. Ada inaweza kutofautiana kulingana na kazi na mahitaji ya mtandao."],
    "fund-stablecoins":["Lengo la stablecoin ni nini?",["Kulenga thamani tulivu kwa kutumia utaratibu uliotajwa","Kuhakikisha faida","Kuondoa hatari zote za mtoaji na akiba","Kufanya kila muamala kuwa wa siri"],"Stablecoin zimeundwa kupunguza mabadiliko ya bei, lakini taratibu na hatari hutofautiana na uthabiti hauhakikishwi."],
    "safe-never-share":["Nani anapaswa kupewa kifungu chako cha siri cha urejeshaji au ufunguo binafsi?",["Hakuna mtu, hata wafanyakazi wa usaidizi","Mhudumu wa usaidizi anayekutumia ujumbe kwanza","Akaunti yoyote ya mitandao ya kijamii iliyothibitishwa","Mnunuzi kabla ya malipo"],"Mtu mwenye kifungu au ufunguo binafsi anaweza kudhibiti akaunti husika. Usaidizi halali haupaswi kuviomba."],
    "safe-restore":["Kifungu cha siri cha urejeshaji wa pochi kwa kawaida kinaweza kurejesha nini?",["Akaunti za pochi zilizotokana na kifungu hicho","Muamala wa mwisho pekee","Nenosiri la jukwaa la ubadilishaji","Marejesho ya fedha yaliyohakikishwa"],"Kifungu cha urejeshaji kinaweza kurejesha akaunti zilizotokana nacho, ndiyo maana lazima kibaki siri."],
    "safe-full-address":["Kabla ya kutuma crypto, ni sehemu gani ya anwani ya mpokeaji unapaswa kuhakiki?",["Anwani nzima","Herufi nne za kwanza pekee","Herufi nne za mwisho pekee","Nembo ya pochi pekee"],"Programu hasidi inaweza kubadilisha anwani kwa inayofanana. Hakiki anwani nzima kupitia njia unayoamini."],
    "safe-irreversible":["Kwa nini ukague maelezo kabla ya kutangaza malipo ya Bitcoin?",["Malipo yaliyothibitishwa kwa kawaida hayawezi kubatilishwa na msimamizi mkuu","Anwani itaisha mara moja","Kila malipo hurejeshwa kiotomatiki","Benki lazima iidhinishe kiasi"],"Malipo ya Bitcoin hayabatilishwi na msimamizi mkuu, kwa hiyo kagua mpokeaji, anwani, mtandao na kiasi kwa makini."],
    "safe-device-seed":["Ni ishara gani ya tahadhari unapoweka pochi mpya ya kifaa?",["Kifungu cha urejeshaji kinakuja kimechapishwa pamoja na kifaa","Kifaa kinakuomba uhakiki skrini yake","Unalinganisha kifungashio cha mtengenezaji","Unasakinisha sasisho rasmi"],"Kifungu kilichotengenezwa au kuchapishwa mapema huenda tayari kinajulikana na mshambuliaji. Kitengeneze katika mchakato wa kuaminika wa kuweka kifaa."],
    "safe-public-private":["Ni taarifa gani hutumika kuidhinisha matumizi kutoka kwenye pochi?",["Ufunguo binafsi","Anwani ya umma ya kupokea pekee","URL ya kivinjari cha muamala","Kifupi cha tokeni"],"Ufunguo binafsi huidhinisha matumizi. Anwani ya umma inaweza kushirikiwa kupokea fedha lakini haiwezi kuidhinisha matumizi yenyewe."]
  };
  bank.sets.forEach(function(set){set.name.sw=swSets[set.id].name;set.description.sw=swSets[set.id].description;set.questions.forEach(function(question){var row=sw[question.id];var rotation=question.id.split("").reduce(function(total,ch){return total+ch.charCodeAt(0);},0)%row[1].length;question.prompt.sw=row[0];question.options.sw=row[1].slice(rotation).concat(row[1].slice(0,rotation));question.explanation.sw=row[2];});});
  return bank;
});
