(function () {
  'use strict';
  var rows = [
    { phrase: 'Y a pas de problème / Pas de souci', sense: 'Tout va bien, aucun problème', place: '', note: 'Registre et provenance à confirmer.' },
    { phrase: 'On se débrouille', sense: 'On trouve les moyens de gérer une situation difficile', place: '', note: 'Le ton dépend du contexte.' },
    { phrase: 'Mon frère / Mon gars', sense: 'Adresse amicale entre proches', place: '', note: 'Peut être trop familier dans un cadre formel.' },
    { phrase: 'Le grand / Le patron', sense: 'Personne importante ou responsable', place: '', note: 'Peut être respectueux, familier ou ironique.' },
    { phrase: 'Se débrouiller', sense: 'Gérer, trouver une solution avec les moyens disponibles', place: '', note: 'Usage très contextuel.' },
    { phrase: 'Dogo-dogo', sense: 'Petit à petit, en petite quantité', place: 'Afrique de l’Ouest (repère historique non sourcé par pays)', note: 'Faire confirmer le pays et la langue de contact.' },
    { phrase: 'Y a quoi ?', sense: 'Quoi de neuf ? Que se passe-t-il ?', place: '', note: 'Registre familier.' },
    { phrase: 'C’est chaud', sense: 'La situation est intense, difficile ou sérieuse', place: '', note: 'Le sens varie selon l’intonation.' },
    { phrase: 'Tantie', sense: 'Adresse respectueuse ou affectueuse pour une femme plus âgée', place: '', note: 'Le lien familial n’est pas toujours littéral.' },
    { phrase: 'Tonton', sense: 'Adresse respectueuse ou affectueuse pour un homme plus âgé', place: '', note: 'Le lien familial n’est pas toujours littéral.' },
    { phrase: 'Toubab / Mundele', sense: 'Terme pour une personne blanche ou étrangère selon le contexte', place: 'Toubab : Afrique de l’Ouest; mundele : RDC (repères à faire confirmer)', note: 'Peut être descriptif, familier ou sensible.' },
    { phrase: 'Maquis / Nganda', sense: 'Restaurant ou lieu de convivialité local', place: 'Maquis : Afrique de l’Ouest; nganda : RDC (repères à confirmer)', note: 'Le type d’établissement varie.' },
    { phrase: 'Zémidjan / bendskin / boda', sense: 'Taxi-moto', place: 'Terme variable selon le pays', note: 'Ne pas supposer l’équivalence exacte partout.' },
    { phrase: 'Inchallah / Si Dieu veut', sense: 'Expression d’espoir ou de condition liée à la volonté divine', place: '', note: 'Usage religieux et social à respecter.' },
    { phrase: 'Embouteillage / go-slow', sense: 'Circulation très ralentie', place: '', note: 'Go-slow est aussi employé dans des espaces anglophones.' },
    { phrase: 'Portable / téléphone', sense: 'Téléphone mobile', place: '', note: 'Usage courant, non spécifique à un seul pays.' },
    { phrase: 'Puce', sense: 'Carte SIM', place: '', note: 'Exemple : acheter une puce.' },
    { phrase: 'Crédit / unités', sense: 'Solde téléphonique prépayé', place: '', note: 'Exemple : recharger son crédit.' },
    { phrase: 'Matabiche / motivation', sense: 'Euphémisme historique pouvant désigner un paiement informel', place: '', note: 'Terme sensible : ne normalise ni ne conseille la corruption.' },
    { phrase: 'L’ambiance', sense: 'La fête, l’atmosphère festive ou l’énergie d’un lieu', place: '', note: 'Sens très dépendant du contexte.' }
  ];
  var form = document.getElementById('africanFrenchForm');
  if (!form) return;
  var search = document.getElementById('search');
  var scope = document.getElementById('scope');
  var list = document.getElementById('africanFrenchResults');
  var count = document.getElementById('resultCount');
  var status = document.getElementById('africanFrenchStatus');
  var current = [];
  function normalize(value) {
    return String(value || '').toLocaleLowerCase('fr').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function filteredRows() {
    var query = normalize(search.value);
    return rows.filter(function (row) {
      var placeMatch = scope.value === 'all' || (scope.value === 'country' ? Boolean(row.place) : !row.place);
      var textMatch = !query || normalize([row.phrase, row.sense, row.place, row.note].join(' ')).indexOf(query) !== -1;
      return placeMatch && textMatch;
    });
  }
  function render() {
    current = filteredRows();
    list.replaceChildren();
    current.forEach(function (row) {
      var item = document.createElement('li');
      var title = document.createElement('strong');
      var sense = document.createElement('p');
      var place = document.createElement('p');
      var note = document.createElement('p');
      title.textContent = row.phrase;
      sense.textContent = row.sense;
      place.textContent = row.place || 'Provenance pays et registre : non vérifiés.';
      note.textContent = row.note;
      item.append(title, sense, place, note);
      list.appendChild(item);
    });
    if (!current.length) {
      var empty = document.createElement('li');
      empty.textContent = 'Aucune entrée ne correspond. Effacez le filtre ou essayez un terme plus court.';
      list.appendChild(empty);
    }
    count.textContent = '(' + current.length + '/20)';
    return current;
  }
  function summary() {
    render();
    return ['AfroTools · Expressions françaises en Afrique', 'Résultats : ' + current.length + '/20', ''].concat(
      current.map(function (row) {
        return '- ' + row.phrase + ' : ' + row.sense + ' · ' + (row.place || 'provenance non vérifiée') + ' · ' + row.note;
      })
    ).concat(['', 'Limite : faire vérifier tout usage public par une personne du pays et du registre visés.']).join('\n');
  }
  form.addEventListener('submit', function (event) { event.preventDefault(); render(); status.textContent = current.length + ' résultat(s) affiché(s).'; });
  search.addEventListener('input', function () { render(); status.textContent = ''; });
  scope.addEventListener('change', function () { render(); status.textContent = ''; });
  document.getElementById('clearBtn').addEventListener('click', function () { search.value = ''; scope.value = 'all'; render(); search.focus(); status.textContent = 'Filtres effacés.'; });
  document.getElementById('copyAfricanFrench').addEventListener('click', function () {
    navigator.clipboard.writeText(summary()).then(function () { status.textContent = 'Résultats copiés.'; })
      .catch(function () { status.textContent = 'Copie indisponible. Utilisez le fichier TXT.'; });
  });
  document.getElementById('downloadAfricanFrench').addEventListener('click', function () {
    var link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([summary()], { type: 'text/plain;charset=utf-8' }));
    link.download = 'expressions-francaises-afrique-afrotools.txt';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
    status.textContent = 'Fichier TXT préparé.';
  });
  document.getElementById('saveAfricanFrench').addEventListener('click', function () {
    try {
      localStorage.setItem('afrotools:francais-africain-fr:last', JSON.stringify({ search: search.value, scope: scope.value, results: summary() }));
      status.textContent = 'Recherche sauvegardée sur cet appareil.';
    } catch (saveError) {
      status.textContent = 'Stockage local indisponible.';
    }
  });
  render();
}());
