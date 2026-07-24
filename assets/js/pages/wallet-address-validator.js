(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.WalletAddressValidator;
  var form = document.getElementById('walletValidatorForm');
  if (!engine || !form) return;
  var network = document.getElementById('walletNetwork');
  var address = document.getElementById('walletAddress');
  var output = document.getElementById('walletResult');
  var status = document.getElementById('walletStatus');
  var copy = document.getElementById('walletCopy');
  var requestId = 0;
  var lastReceipt = '';
  var isFrench = document.documentElement.lang === 'fr';
  var labels = isFrench ? {
    valid: 'Format valid selon les contrôles disponibles',
    unverified: 'Structure reconnue, somme de contrôle non vérifiée',
    invalid: 'Format invalide',
    network: 'Réseau', type: 'Type', checksum: 'Somme de contrôle', method: 'Méthode',
    copied: 'Reçu expurgé copié.', copy: 'Copier le reçu expurgé',
    changed: 'L’entrée a changé. Relancez la validation.'
  } : {
    valid: 'Format valid for the checks performed',
    unverified: 'Structure matched; checksum not verified',
    invalid: 'Invalid format',
    network: 'Network', type: 'Type', checksum: 'Checksum', method: 'Method',
    copied: 'Redacted receipt copied.', copy: 'Copy redacted receipt',
    changed: 'The input changed. Run validation again.'
  };
  var badgeLabels = isFrench
    ? { valid: 'Valide', unverified: 'Non vérifié', invalid: 'Invalide' }
    : { valid: 'Valid', unverified: 'Unverified', invalid: 'Invalid' };

  function localize(value) {
    if (!isFrench || !value) return value;
    var translations = {
      'Passed': 'Réussie',
      'Failed': 'Échouée',
      'Not evaluated': 'Non évaluée',
      'Not applicable': 'Sans objet',
      'Not present': 'Absente',
      'Not established': 'Non établi',
      'Base58Check account address': 'Adresse de compte Base58Check',
      '32-byte public key': 'Clé publique de 32 octets',
      '20-byte hexadecimal address': 'Adresse hexadécimale de 20 octets',
      'Bitcoin mainnet version byte': 'Octet de version Bitcoin mainnet',
      'Bitcoin mainnet Base58Check or SegWit validation': 'Validation Bitcoin mainnet Base58Check ou SegWit',
      'Base58Check with double SHA-256': 'Base58Check avec double SHA-256',
      'Bech32 checksum and witness-program validation': 'Somme de contrôle Bech32 et validation du programme témoin',
      'Bech32m checksum and witness-program validation': 'Somme de contrôle Bech32m et validation du programme témoin',
      'TRON Base58Check validation': 'Validation TRON Base58Check',
      'TRON 0x41 payload prefix': 'Préfixe 0x41 de la charge utile TRON',
      'Base58 decoding and byte-length validation': 'Décodage Base58 et validation de la longueur en octets',
      'Solana Base58 and decoded-length validation': 'Validation Base58 et de la longueur décodée Solana',
      '20-byte hexadecimal structure validation': 'Validation de la structure hexadécimale de 20 octets',
      '20-byte structure validation only': 'Validation de la structure de 20 octets uniquement',
      'Uniform-case EVM address; EIP-55 checksum is not present': 'Adresse EVM en casse uniforme ; aucune somme de contrôle EIP-55 présente',
      'Mixed-case EIP-55 checksum requires Keccak-256 and is not evaluated by this browser-local validator.': 'La somme EIP-55 en casse mixte exige Keccak-256 et n’est pas évaluée par ce validateur local.',
      'Do not treat this result as checksum-verified. Confirm the address in a trusted wallet.': 'Ne considérez pas ce résultat comme vérifié par somme de contrôle. Confirmez l’adresse dans un portefeuille fiable.',
      'This is the all-zero/default public key. Confirm that this is intentional.': 'Il s’agit de la clé publique nulle ou par défaut. Confirmez que cela est intentionnel.',
      'This is the zero address and is commonly not a usable recipient. Confirm before any transfer.': 'Il s’agit de l’adresse nulle, généralement inutilisable comme destinataire. Confirmez avant tout transfert.',
      'A Solana account address must decode to exactly 32 bytes.': 'Une adresse de compte Solana doit se décoder en exactement 32 octets.',
      'Use 0x followed by exactly 40 hexadecimal characters.': 'Utilisez 0x suivi d’exactement 40 caractères hexadécimaux.',
      'TRON Base58Check checksum, prefix, or decoded length does not match.': 'La somme Base58Check, le préfixe ou la longueur décodée TRON ne correspond pas.',
      'Base58Check checksum or decoded length does not match.': 'La somme Base58Check ou la longueur décodée ne correspond pas.',
      'Bitcoin witness checksum does not match.': 'La somme de contrôle Bitcoin témoin ne correspond pas.',
      'Bech32 must not mix letter case.': 'Bech32 ne doit pas mélanger les majuscules et les minuscules.',
      'Invalid Base58 length.': 'Longueur Base58 invalide.',
      'Invalid Base58 character.': 'Caractère Base58 invalide.',
      'Local SHA-256 is unavailable.': 'SHA-256 local est indisponible.',
      'Invalid witness data.': 'Données du programme témoin invalides.',
      'Invalid witness padding.': 'Remplissage du programme témoin invalide.',
      'Invalid Bech32 separator or checksum length.': 'Séparateur Bech32 ou longueur de somme de contrôle invalide.',
      'Only Bitcoin mainnet addresses with the bc prefix are supported.': 'Seules les adresses Bitcoin mainnet avec le préfixe bc sont prises en charge.',
      'Invalid Bech32 character.': 'Caractère Bech32 invalide.',
      'Invalid witness version.': 'Version du programme témoin invalide.',
      'Invalid witness program length.': 'Longueur du programme témoin invalide.',
      'Witness v0 programs must contain 20 or 32 bytes.': 'Les programmes témoin v0 doivent contenir 20 ou 32 octets.',
      'Checksum encoding does not match the witness version.': 'L’encodage de la somme de contrôle ne correspond pas à la version du programme témoin.',
      'Address is not a supported Bitcoin mainnet P2PKH or P2SH address.': 'L’adresse n’est pas une adresse Bitcoin mainnet P2PKH ou P2SH prise en charge.',
      'No validation run': 'Aucune validation effectuée',
      'Enter an address.': 'Saisissez une adresse.',
      'Input limit': 'Limite de saisie',
      'Address exceeds the 120-character limit.': 'L’adresse dépasse la limite de 120 caractères.',
      'Explicit network selection required': 'Sélection explicite du réseau requise',
      'Choose one of the four supported networks.': 'Choisissez l’un des quatre réseaux pris en charge.'
    };
    if (translations[value]) return translations[value];
    return value
      .replace(/^(\d+)-byte witness program$/, 'Programme témoin de $1 octets')
      .replace(/^(\d+) decoded bytes$/, '$1 octets décodés')
      .replace(/^Witness v(\d+)$/, 'Témoin v$1');
  }

  function addMetric(label, value) {
    var item = document.createElement('div');
    var term = document.createElement('span');
    var data = document.createElement('strong');
    term.textContent = label;
    data.textContent = localize(value);
    item.append(term, data);
    return item;
  }

  function render(result, input) {
    var title = document.createElement('h3');
    title.textContent = labels[result.status];
    var badge = document.createElement('span');
    badge.className = 'wallet-badge is-' + result.status;
    badge.textContent = badgeLabels[result.status];
    var metrics = document.createElement('div');
    metrics.className = 'wallet-metrics';
    metrics.append(addMetric(labels.network, result.network || '—'), addMetric(labels.type, result.type), addMetric(labels.checksum, result.checksum), addMetric(labels.method, result.method));
    var list = document.createElement('ul');
    result.details.forEach(function (detail) { var item = document.createElement('li'); item.textContent = localize(detail); list.appendChild(item); });
    var note = document.createElement('p');
    note.className = 'wallet-boundary';
    note.textContent = localize(result.warning) || (isFrench
      ? 'Un format valide ne prouve ni le propriétaire, ni le solde, ni la sécurité. Confirmez le destinataire par un canal fiable.'
      : 'A valid format does not prove ownership, balance, activity, or safety. Confirm the recipient through a trusted channel.');
    output.replaceChildren(badge, title, metrics, list, note);
    var receiptTitle = isFrench ? 'Reçu local de format d’adresse' : 'Local wallet-address format receipt';
    lastReceipt = [receiptTitle, labels.network + ': ' + (result.network || '—'), (isFrench ? 'Adresse' : 'Address') + ': ' + engine.redact(input), (isFrench ? 'Statut' : 'Status') + ': ' + labels[result.status], labels.checksum + ': ' + localize(result.checksum), labels.method + ': ' + localize(result.method), 'AfroTools: https://afrotools.com/crypto/address-validator/'].join('\n');
    copy.disabled = false;
    output.scrollIntoView({ behavior: 'auto', block: 'center' });
    window.scrollBy({ top: 80, behavior: 'auto' });
    output.focus({ preventScroll: true });
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var token = ++requestId;
    var signature = network.value + '\n' + address.value.trim();
    status.textContent = isFrench ? 'Validation locale…' : 'Running local validation…';
    copy.disabled = true;
    var result = await engine.validate(network.value, address.value);
    if (token !== requestId || signature !== network.value + '\n' + address.value.trim()) {
      status.textContent = labels.changed;
      return;
    }
    render(result, address.value);
    status.textContent = '';
  });

  function markStale() {
    requestId += 1;
    lastReceipt = '';
    copy.disabled = true;
    status.textContent = output.childElementCount ? labels.changed : '';
  }
  address.addEventListener('input', markStale);
  network.addEventListener('change', markStale);
  copy.addEventListener('click', async function () {
    if (!lastReceipt) return;
    await navigator.clipboard.writeText(lastReceipt);
    status.textContent = labels.copied;
    copy.textContent = labels.copied;
    setTimeout(function () { copy.textContent = labels.copy; }, 1600);
  });
})();
