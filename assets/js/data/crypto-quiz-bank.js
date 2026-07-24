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

  return {
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
});
