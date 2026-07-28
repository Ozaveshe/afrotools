(function () {
  'use strict';
  var rows = [
    ['Bonjour', 'Báwo ni?', 'BAH-woh nee', 'salutation courante; le niveau de respect peut changer'],
    ['Bonjour le matin', 'Ẹ káàárọ̀', 'EH kah-ROH', 'salutation du matin'],
    ['Bonjour l’après-midi', 'Ẹ káàsán', 'EH kah-SAHN', 'salutation de l’après-midi'],
    ['Bonsoir', 'Ẹ káalẹ́', 'EH kah-LEH', 'salutation du soir'],
    ['Comment allez-vous ?', 'Báwo ni o ṣe wà?', 'BAH-woh nee oh sheh wah', 'forme familière; une adresse respectueuse diffère'],
    ['Je vais bien', 'Mo wà dáadáa', 'moh wah DAH-dah', 'réponse courante'],
    ['Bienvenue', 'Ẹ káàbọ̀', 'EH kah-BOH', 'salutation'],
    ['Au revoir', 'Ó dàbọ̀', 'oh DAH-boh', 'formule de départ'],
    ['Oui', 'Bẹ́ẹ̀ni', 'BEH-nee', 'réponse'],
    ['Non', 'Bẹ́ẹ̀kọ́ / Rárá', 'BEH-koh / RAH-rah', 'réponse'],
    ['S’il vous plaît', 'Ẹ jọ̀ọ́ / Jọ̀ọ́', 'EH-joh / joh', 'Ẹ est respectueux ou pluriel'],
    ['Merci', 'Ẹ ṣéun', 'EH sheh-OON', 'remerciement'],
    ['Merci beaucoup', 'Ẹ ṣéun púpọ̀', 'EH sheh-OON POO-poh', 'remerciement'],
    ['Je ne comprends pas', 'Mi ò gbọ́', 'mee oh GBOH', 'brouillon à confirmer selon le contexte'],
    ['Aidez-moi !', 'Ẹ gba mi!', 'EH gbah mee', 'urgence; demander un interprète si possible'],
    ['Combien ?', 'Èló ni?', 'EH-loh nee', 'prix ou quantité selon le contexte'],
    ['Eau', 'Omi', 'OH-mee', 'nom courant'],
    ['Nourriture', 'Oúnjẹ', 'OH-oon-jeh', 'nom courant'],
    ['Argent', 'Owó', 'OH-woh', 'les tons et points souscrits distinguent plusieurs mots'],
    ['Marché', 'Ọjà', 'oh-JAH', 'nom courant'],
    ['Je veux acheter', 'Mo fẹ́ rà', 'moh feh RAH', 'phrase de marché'],
    ['Combien coûte ceci ?', 'Èló ni èyí?', 'EH-loh nee eh-yee', 'confirmer monnaie et unité'],
    ['Où est l’hôpital ?', 'Níbo ni ilé ìwòsàn wà?', 'NEE-boh nee ee-LEH ee-WOH-sahn wah', 'faire vérifier en situation médicale'],
    ['Sans problème', 'Kò sí wàhálà', 'koh-SEE wah-HAH-lah', 'registre conversationnel']
  ];
  var form = document.getElementById('yorubaForm');
  if (!form) return;
  var direction = document.getElementById('direction');
  var context = document.getElementById('context');
  var source = document.getElementById('sourceText');
  var result = document.getElementById('result');
  var error = document.getElementById('yorubaError');
  var status = document.getElementById('status');
  var lastText = '';
  function normalize(value) {
    return String(value || '').toLocaleLowerCase('fr').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[ẹ]/g, 'e').replace(/[ọ]/g, 'o')
      .replace(/[ṣ]/g, 's').replace(/[’']/g, ' ').replace(/[?!.,;:]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function findRow(value, column) {
    var query = normalize(value);
    if (!query) return null;
    return rows.find(function (row) {
      var candidate = normalize(row[column]);
      return candidate === query || candidate.indexOf(query) !== -1 || query.indexOf(candidate) !== -1;
    }) || null;
  }
  function render(options) {
    var value = source.value.trim();
    error.hidden = true;
    source.removeAttribute('aria-invalid');
    if (!value) {
      result.textContent = 'Saisissez une phrase française ou yoruba.';
      lastText = '';
      if (options && options.submitted) {
        error.textContent = 'Saisissez une phrase avant de lancer la recherche.';
        error.hidden = false;
        source.setAttribute('aria-invalid', 'true');
        source.focus();
      }
      return false;
    }
    var toYoruba = direction.value === 'fr-yo';
    var row = findRow(value, toYoruba ? 0 : 1);
    if (!row) {
      lastText = 'Aucun résultat local pour « ' + value + ' ».\nReformulez avec une phrase courte ou demandez une traduction humaine.';
    } else {
      var output = toYoruba ? row[1] : row[0];
      var outputLanguage = toYoruba ? 'yo' : 'fr';
      result.setAttribute('lang', outputLanguage);
      lastText = [
        output,
        '',
        'Prononciation indicative : ' + row[2],
        'Contexte : ' + context.options[context.selectedIndex].text,
        'Note : ' + row[3],
        'Limite : brouillon local à faire relire par un locuteur qualifié.'
      ].join('\n');
    }
    result.textContent = lastText;
    return Boolean(row);
  }
  function summary() {
    render();
    return ['AfroTools · Traducteur yoruba français', 'Direction : ' + direction.options[direction.selectedIndex].text, '', lastText].join('\n');
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = render({ submitted: true }) ? 'Traduction locale trouvée.' : '';
  });
  direction.addEventListener('change', function () { render(); status.textContent = ''; });
  context.addEventListener('change', function () { render(); status.textContent = ''; });
  source.addEventListener('input', function () { error.hidden = true; source.removeAttribute('aria-invalid'); status.textContent = ''; });
  document.getElementById('exampleBtn').addEventListener('click', function () {
    direction.value = 'fr-yo'; source.value = 'Merci beaucoup'; render(); status.textContent = 'Exemple chargé.';
  });
  document.getElementById('copyBtn').addEventListener('click', function () {
    if (!source.value.trim()) { render({ submitted: true }); return; }
    navigator.clipboard.writeText(summary()).then(function () { status.textContent = 'Résultat copié.'; })
      .catch(function () { status.textContent = 'Copie indisponible. Utilisez le fichier TXT.'; });
  });
  document.getElementById('downloadBtn').addEventListener('click', function () {
    if (!source.value.trim()) { render({ submitted: true }); return; }
    var link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([summary()], { type: 'text/plain;charset=utf-8' }));
    link.download = 'traduction-yoruba-afrotools.txt';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
    status.textContent = 'Fichier TXT préparé.';
  });
  document.getElementById('saveBtn').addEventListener('click', function () {
    if (!source.value.trim()) { render({ submitted: true }); return; }
    try {
      localStorage.setItem('afrotools:traducteur-yoruba-fr:last', JSON.stringify({
        direction: direction.value, context: context.value, source: source.value, result: summary()
      }));
      status.textContent = 'Résultat sauvegardé sur cet appareil.';
    } catch (saveError) {
      status.textContent = 'Stockage local indisponible.';
    }
  });
}());
