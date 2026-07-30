#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sourceRel = 'tools/api-tester/index.html';
const outputRel = 'fr/tools/testeur-api/index.html';
const source = fs.readFileSync(path.join(root, sourceRel), 'utf8').replace(/\r\n/g, '\n');

const replacements = [
  ['Online REST API Tester for African Developers | AfroTools', 'Testeur API REST en ligne pour développeurs africains | AfroTools'],
  ['Test REST APIs in your browser with cURL import, local environments, request preflight, assertions, response headers, JSON export and African API presets.', 'Testez des API REST dans votre navigateur avec import cURL, environnements locaux, contrôle avant envoi, assertions, en-têtes de réponse, export JSON et modèles africains.'],
  ['A privacy-first API workbench with environments, request preflight, saved requests, cURL import, assertions, response headers and African API presets.', 'Un atelier API respectueux de la confidentialité avec environnements, contrôle avant envoi, requêtes enregistrées, import cURL, assertions, réponses et modèles africains.'],
  ['Test APIs with environments, request preflight, saved requests, cURL import, assertions and African API presets.', 'Testez des API avec environnements, contrôle avant envoi, requêtes enregistrées, import cURL, assertions et modèles africains.'],
  ['Browser-based REST API tester with environments, cURL import, request preflight, saved requests, assertions, response headers, code export and African API presets.', 'Testeur API REST dans le navigateur avec environnements, import cURL, contrôle avant envoi, requêtes enregistrées, assertions, en-têtes, export de code et modèles africains.'],
  ['Developer Tools', 'Outils développeur'],
  ['API Tester', 'Testeur API'],
  ['Tester', 'Testeur'],
  ['A browser API workbench for quick checks, sandbox calls, webhook debugging and African API exploration. Build requests, swap environments, import cURL, run assertions, save useful calls and export code.', 'Un atelier API dans le navigateur pour les contrôles rapides, appels sandbox, webhooks et API africaines. Construisez la requête, changez d’environnement, importez un cURL, lancez les assertions et exportez un code sûr.'],
  ['Environments', 'Environnements'],
  ['Saved requests', 'Requêtes enregistrées'],
  ['Assertions', 'Assertions'],
  ['Africa presets', 'Modèles Afrique'],
  ['Environment', 'Environnement'],
  ['Save non-secret variables', 'Enregistrer les variables non sensibles'],
  ['Clear variables', 'Effacer les variables'],
  ['No environment', 'Aucun environnement'],
  ['Local API', 'API locale'],
  ['Production', 'Production'],
  ['Variables are replaced in URLs, headers and bodies with', 'Les variables sont remplacées dans les URL, en-têtes et corps avec'],
  ['provider secrets, and African API keys. Only non-secret values can be saved. Credentials stay in memory and are cleared after send, cancel or page exit.', 'les secrets fournisseur et les clés d’API africaines. Seules les valeurs non sensibles peuvent être enregistrées. Les identifiants restent en mémoire et sont effacés après envoi, annulation ou fermeture de la page.'],
  ['Request preflight', 'Contrôle avant envoi'],
  ['Request body', 'Corps de la requête'],
  ['Request', 'Requête'],
  ['Send', 'Envoyer'],
  ['Params', 'Paramètres'],
  ['Headers', 'En-têtes'],
  ['Body', 'Corps'],
  ['Auth', 'Authentification'],
  ['Tests', 'Tests'],
  ['+ Add query parameter', '+ Ajouter un paramètre'],
  ['+ Add header', '+ Ajouter un en-tête'],
  ['Body type', 'Type de corps'],
  ['Raw text', 'Texte brut'],
  ['Form URL encoded', 'Formulaire encodé URL'],
  ['Shortcut', 'Raccourci'],
  ['Format JSON', 'Formater le JSON'],
  ['Authorization type', 'Type d’autorisation'],
  ['Bearer token', 'Jeton Bearer'],
  ['Basic auth', 'Authentification Basic'],
  ['API key header', 'En-tête de clé API'],
  ['Token, password or key', 'Jeton, mot de passe ou clé'],
  ['Username or API key header', 'Nom utilisateur ou en-tête de clé API'],
  ['Header prefix', 'Préfixe d’en-tête'],
  ['Expected status', 'Statut attendu'],
  ['Max response time (ms)', 'Temps de réponse maximal (ms)'],
  ['Response contains', 'La réponse contient'],
  ['JSON path exists', 'Le chemin JSON existe'],
  ['Copy safe debug brief', 'Copier le résumé de diagnostic expurgé'],
  ['Save request', 'Enregistrer la requête'],
  ['Copy cURL', 'Copier le cURL expurgé'],
  ['Copy fetch()', 'Copier fetch() expurgé'],
  ['Download JSON', 'Télécharger le JSON expurgé'],
  ['Clear', 'Effacer'],
  ['Response headers', 'En-têtes de réponse'],
  ['Response', 'Réponse'],
  ['Copy response', 'Copier la réponse'],
  ['No request sent yet', 'Aucune requête envoyée'],
  ['Send a request to see the response body here.', 'Envoyez une requête pour afficher ici le corps de la réponse.'],
  ['No tests have run yet.', 'Aucun test exécuté.'],
  ['No headers yet.', 'Aucun en-tête pour le moment.'],
  ['Africa API presets', 'Modèles d’API africaines'],
  ['Import cURL', 'Importer un cURL'],
  ['Import handles common `curl -X`, `-H`, `-d` and URL patterns. Complex shell scripts should still be checked before sending.', 'L’import gère les formes courantes `curl -X`, `-H`, `-d` et les URL. Vérifiez les scripts shell complexes avant tout envoi.'],
  ['Import', 'Importer'],
  ['History', 'Historique'],
  ['Privacy model:', 'Modèle de confidentialité :'],
  ['AfroTools does not proxy these API requests. The browser sends directly to the endpoint, so CORS rules still apply. For APIs that block browser calls, use Copy cURL and run the request from your terminal or backend.', 'AfroTools ne relaie pas ces requêtes. Le navigateur envoie directement vers le point de terminaison confirmé ; les règles CORS s’appliquent. Si une API bloque le navigateur, utilisez le cURL expurgé et ajoutez les identifiants uniquement dans votre terminal ou backend de confiance.'],
  ['API Testing Built For Practical African Workflows', 'Tests API adaptés aux flux de travail africains'],
  ['Generic API testers are useful, but African developers often need to jump between local services, fintech sandboxes, USSD callbacks, mobile money authentication, identity providers and deployment constraints. This tool keeps the quick browser workflow while adding environments, presets, cURL export and saved requests for repeat debugging.', 'Les développeurs africains passent souvent entre services locaux, sandboxes fintech, callbacks USSD, authentification mobile money, fournisseurs d’identité et contraintes de déploiement. Cet outil conserve un flux rapide dans le navigateur avec environnements, modèles, export cURL expurgé et requêtes réutilisables.'],
  ["Use the built-in same-origin AfroTools status endpoint for a first browser-safe test, then switch to templates for Paystack, Flutterwave, M-Pesa Daraja, MTN MoMo and Africa's Talking. Some production APIs intentionally reject browser-origin requests. That is not a tool failure. It is a security rule, and the cURL export gives you a safer terminal path for those requests.", "Commencez par le point de statut AfroTools sans authentification, puis utilisez les modèles Paystack, Flutterwave, M-Pesa Daraja, MTN MoMo et Africa's Talking. Certaines API refusent volontairement les appels depuis un navigateur. Le cURL expurgé fournit alors une base plus sûre à compléter dans votre terminal."],
  ['Frequently Asked Questions', 'Questions fréquentes'],
  ['Why did my request fail with CORS?', 'Pourquoi ma requête échoue-t-elle avec CORS ?'],
  ['Browsers block responses from APIs that do not allow your page origin. If the API is not browser-enabled, copy the generated cURL command and run it from a terminal or backend service.', 'Les navigateurs bloquent les réponses des API qui n’autorisent pas l’origine de cette page. Copiez le cURL expurgé et exécutez-le depuis un terminal ou backend autorisé.'],
  ['Are my API keys uploaded to AfroTools?', 'Mes clés API sont-elles envoyées à AfroTools ?'],
  ['No. Credentialed requests are sent only after you confirm the exact endpoint. AfroTools blocks credentialed sends to its own domains and telemetry routes, does not proxy the request, and never stores secret values. Saved requests and code previews keep redacted placeholders only.', 'Non. Une requête authentifiée part uniquement après confirmation du point exact. AfroTools bloque ses propres domaines et les routes de télémétrie, ne relaie pas la requête et ne stocke jamais les secrets. Les requêtes enregistrées et aperçus de code gardent uniquement des marqueurs expurgés.'],
  ['Can I use this instead of Postman?', 'Puis-je remplacer Postman par cet outil ?'],
  ['Use it for quick browser checks, sandbox templates, cURL generation, classroom demos and lightweight debugging. For team workspaces, secrets vaulting and automated CI collections, a full API client is still better.', 'Utilisez-le pour des contrôles rapides, modèles sandbox, génération cURL, démonstrations et diagnostics légers. Pour le travail d’équipe, les coffres de secrets et les collections CI, préférez un client API complet.'],
  ['Related tools', 'Outils associés'],
  ['Enter a request URL', 'Saisissez une URL de requête'],
  ['Sending request...', 'Envoi de la requête…'],
  ['Waiting for response...', 'Réponse en attente…'],
  ['Credentialed request cancelled', 'Requête authentifiée annulée'],
  ['Redirect blocked. Re-enter and confirm the final endpoint explicitly.', 'Redirection bloquée. Saisissez et confirmez explicitement le point final.'],
  ['Only non-secret environment values were saved', 'Seules les variables non sensibles ont été enregistrées'],
  ['Saved environment variables cleared', 'Variables enregistrées effacées'],
  ['Request saved', 'Requête enregistrée'],
  ['No saved requests yet.', 'Aucune requête enregistrée.'],
  ['No request history yet.', 'Aucun historique de requête.'],
  ['Credential values will leave this browser for that endpoint only. They are not saved by AfroTools.', 'Les identifiants quitteront ce navigateur uniquement vers ce point de terminaison. AfroTools ne les enregistre pas.'],
  ['Send credentials to this exact endpoint?', 'Envoyer les identifiants vers ce point exact ?'],
  ['Destination:', 'Destination :'],
  ['Credential header names:', 'Noms des en-têtes d’identification :'],
  ['Extra warning: this is a localhost or private-network target. Confirm that you control it.', 'Avertissement supplémentaire : il s’agit d’une cible locale ou privée. Confirmez que vous la contrôlez.'],
  ['Add a URL before sending.', 'Ajoutez une URL avant l’envoi.'],
  ['Resolve {{variables}} before sending.', 'Résolvez les {{variables}} avant l’envoi.'],
  ['URL is ready for a browser request.', 'L’URL est prête pour une requête depuis le navigateur.'],
  ['HTTPS pages cannot call insecure HTTP endpoints.', 'Une page HTTPS ne peut pas appeler un point HTTP non sécurisé.'],
  ['External APIs may block browser calls with CORS. Keep cURL ready.', 'Les API externes peuvent bloquer les appels du navigateur via CORS. Gardez le cURL prêt.'],
  ['Endpoint should be reachable from this browser context.', 'Le point de terminaison devrait être accessible depuis ce navigateur.'],
  ['JSON body is not valid yet.', 'Le corps JSON n’est pas encore valide.'],
  ['JSON body parses correctly.', 'Le corps JSON est analysé correctement.'],
  ['No JSON body validation needed for this request.', 'Aucune validation du corps JSON n’est nécessaire pour cette requête.'],
  ['Requires a modern browser with Fetch API support. Requests are sent directly from the browser to the endpoint you choose.', 'Nécessite un navigateur moderne prenant en charge Fetch API. Les requêtes sont envoyées directement du navigateur au point de terminaison choisi.'],
  ['How to test a REST API request in AfroTools', 'Comment tester une requête API REST dans AfroTools'],
  ['Build a browser API request, run local preflight checks, send it when CORS allows, then copy a redacted replay brief.', 'Construisez une requête API dans le navigateur, effectuez les contrôles locaux, envoyez-la lorsque CORS l’autorise, puis copiez un résumé de répétition expurgé.'],
  ['Select GET, POST, PUT, PATCH or DELETE and enter the endpoint URL or an environment variable such as {{baseUrl}}.', 'Sélectionnez GET, POST, PUT, PATCH ou DELETE, puis saisissez l’URL du point de terminaison ou une variable d’environnement telle que {{baseUrl}}.'],
  ['Add query parameters, headers, body content and optional authorization values in the browser.', 'Ajoutez dans le navigateur les paramètres de requête, les en-têtes, le contenu du corps et les valeurs d’autorisation facultatives.'],
  ['Review request preflight', 'Vérifier le contrôle préalable de la requête'],
  ['Check unresolved variables, mixed-content risk, JSON validity, auth-secret handling and response assertions before sending.', 'Vérifiez avant l’envoi les variables non résolues, le risque de contenu mixte, la validité JSON, le traitement des secrets et les assertions de réponse.'],
  ['Inspect and export the result', 'Inspecter et exporter le résultat'],
  ['Review response status, headers, body and assertions, then copy cURL, fetch or a redacted debug brief for replay.', 'Vérifiez le statut, les en-têtes, le corps et les assertions de la réponse, puis copiez le cURL, fetch ou un résumé de diagnostic expurgé pour la répétition.'],
  ['No. Requests are sent directly from your browser to the endpoint you choose. If you save environment variables, they are stored in your own browser localStorage, so avoid saving production secrets on shared devices.', 'Non. Les requêtes sont envoyées directement de votre navigateur au point de terminaison choisi. Les variables d’environnement enregistrées restent dans le localStorage de votre navigateur ; n’enregistrez donc pas de secrets de production sur un appareil partagé.']
];
const orderedReplacements = [...replacements].sort((a, b) => b[0].length - a[0].length);

function replaceAll(text) {
  let result = text;
  for (const [from, to] of orderedReplacements) result = result.split(from).join(to);
  return result;
}

function replaceScriptLiterals(text) {
  let result = text;
  for (const [from, to] of orderedReplacements) {
    for (const quote of ["'", '"']) {
      const escapeLiteral = value => value
        .replace(/\\/g, '\\\\')
        .replace(new RegExp(quote, 'g'), `\\${quote}`)
        .replace(/\n/g, '\\n');
      result = result
        .split(`${quote}${escapeLiteral(from)}${quote}`)
        .join(`${quote}${escapeLiteral(to)}${quote}`);
    }
  }
  return result;
}

let output = '';
let cursor = 0;
const protectedBlock = /<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi;
for (const match of source.matchAll(protectedBlock)) {
  output += replaceAll(source.slice(cursor, match.index));
  output += /^<script/i.test(match[0]) && !/application\/ld\+json/i.test(match[2])
    ? replaceScriptLiterals(match[0])
    : replaceAll(match[0]);
  cursor = match.index + match[0].length;
}
output += replaceAll(source.slice(cursor));
output = output.replace(/(<html\b[^>]*\blang=")en(")/i, '$1fr$2');

output = output
  .replace(/https:\/\/afrotools\.com\/tools\/api-tester\//g, 'https://afrotools.com/fr/tools/testeur-api/')
  .replace(/(<link rel="alternate" hreflang="en" href=")https:\/\/afrotools\.com\/fr\/tools\/testeur-api\/(">)/, '$1https://afrotools.com/tools/api-tester/$2')
  .replace(/(<link rel="alternate" hreflang="x-default" href=")https:\/\/afrotools\.com\/fr\/tools\/testeur-api\/(">)/, '$1https://afrotools.com/tools/api-tester/$2')
  .replace(/<meta property="og:locale" content="[^"]+">/, '<meta property="og:locale" content="fr_FR">');

const hash = crypto.createHash('sha256').update(source).digest('hex').slice(0, 16);
output = output.replace(
  '<head>',
  `<head>\n<meta name="afrotools-content-id" content="fr-developer:api-tester">\n<meta name="afrotools-source-owner" content="scripts/build-french-developer-api-tester.js">\n<meta name="afrotools-source-hash" content="${hash}">`
);

const target = path.join(root, outputRel);
const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';
if (process.argv.includes('--check')) {
  if (current !== output) {
    console.error(`${outputRel} is stale`);
    process.exitCode = 1;
  } else {
    console.log(`${outputRel} is current`);
  }
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, output, 'utf8');
  console.log(`wrote ${outputRel}`);
}
