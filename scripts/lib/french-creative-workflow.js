'use strict';
const routes = {
 'book-publishing-cost':['Budget de publication d’un livre','Chiffrez la révision, la couverture et le tirage à partir de vos devis. Comparez ensuite le coût total et les ventes nécessaires pour le couvrir.'],
 'self-publishing-royalty':['Revenus d’autoédition','Comparez les revenus simulés par exemplaire, par mois et par an selon le format et le volume de ventes.'],
 'podcast-monetization':['Budget de monétisation d’un podcast','Estimez les revenus simulés par source à partir de vos téléchargements, de vos épisodes et des contributions des auditeurs.'],
 'engagement-rate':['Taux d’engagement par publication','Saisissez le nombre d’abonnés et les interactions moyennes sur dix publications pour calculer un taux comparable.'],
 'photography-pricing':['Tarif d’une séance photo','Estimez votre prix par séance et votre revenu horaire en intégrant les retouches, le loyer et le matériel.'],
 'music-royalty-splitter':['Partage des redevances musicales','Répartissez les recettes entre les collaborateurs, vérifiez que leurs parts représentent 100 % et exportez la répartition.'],
 'linkedin-optimizer':['Évaluer mon profil LinkedIn','Cochez les éléments présents sur votre profil pour obtenir votre score et choisir les prochaines améliorations.'],
 'african-palette':['Palettes de couleurs africaines','Choisissez une palette, vérifiez les contrastes et copiez ses couleurs pour votre projet.'],
 'art-commission':['Devis pour une commande artistique','Choisissez le support, le format et les droits pour estimer le prix de la commande et votre revenu horaire.']
};
const labels = [
["Fiction / Novel","Roman"],
["Non-Fiction","Essai ou documentaire"],
["Children's Book","Livre jeunesse"],
["Academic / Textbook","Manuel scolaire ou universitaire"],
["Poetry Collection","Recueil de poésie"],
["Short (10k–30k words)","Court (10 000 à 30 000 mots)"],
["Standard (40k–80k words)","Standard (40 000 à 80 000 mots)"],
["Long (80k–120k words)","Long (80 000 à 120 000 mots)"],
["Very Long (120k+ words)","Très long (plus de 120 000 mots)"],
["Self-Publishing","Autoédition"],
["Traditional Publisher","Édition traditionnelle"],
["Hybrid Publishing","Édition hybride"],
["Layout / Typesetting","Mise en page"],
["ISBN + Copyright","ISBN et droits d’auteur"],
["imprimer Copies (qty)","Tirage (exemplaires)"],
["Net Profit","Bénéfice net"],
["Ebook","Livre numérique"],
["Paperback (imprimer)","Livre broché"],
["Hardcover","Livre relié"],
["Pays (for local currency)","Pays de comparaison monétaire"],
["Meilleur choix Plateforme Mensuel Earnings","Revenu mensuel maximal simulé"],
["Annuel Meilleur choix-Case","Projection annuelle du scénario maximal"],
["Plateforme Comparison","Comparaison des scénarios"],
["Price Analyse du prix optimal","Simulation selon le prix de vente"],
["Price Point","Prix de vente"],
["Mensuel @ est. sales","Projection mensuelle"],
["Business / Finance","Affaires et finance"],
["Entertainment / Comedy","Divertissement et humour"],
["News / Current Affairs","Actualité"],
["Education / Self-Help","Éducation et développement personnel"],
["Culture / Lifestyle","Culture et société"],
["Technology","Technologie"],
["Mostly Africa (70%+)","Principalement en Afrique (70 % et plus)"],
["Mixed (Africa + Diaspora)","Afrique et diaspora"],
["Mostly Diaspora / Global","Principalement hors d’Afrique"],
["Downloads Needed to Unlock Each Stream","Seuils de téléchargements du modèle"],
["Downloads obligatoire","Téléchargements requis"],
["Your Statut","Votre statut"],
["CPM Rates for Africa","Hypothèses publicitaires"],
["Plateforme Benchmarks","Repères par plateforme"],
["Monetization Readiness","Scénarios de monétisation"],
["Tips to Improve Your Engagement","Pistes pour améliorer l’engagement"],
["Speciality","Spécialité"],
["Wedding Range","Fourchette pour un mariage"],
["Wedding","Mariage"],
["Real Estate","Immobilier"],
["Product Photography","Photographie de produits"],
["Events","Événements"],
["Fashion / Editorial","Mode et éditorial"],
["New (0–1 yr)","Débutant (0 à 1 an)"],
["Experienced (2–5 yr)","Confirmé (2 à 5 ans)"],
["Senior (5+ yr)","Expérimenté (plus de 5 ans)"],
["Established / Brand","Studio établi"],
["Entry (kit lens, basic body)","Entrée de gamme"],
["Mid-range (full-frame, 2+ lenses)","Intermédiaire"],
["Professional (top-tier system)","Professionnel"],
["Mensuel Location du studio (0 if none)","Loyer mensuel du studio (0 si aucun)"],
["Mensuel Working Days","Jours travaillés par mois"],
["(local currency)","(devise du pays)"],
["Tirages ou albums Included?","Tirages ou album inclus"],
["No — digital delivery only","Non, livraison numérique"],
["Basic prints (+10%)","Tirages simples (+10 %)"],
["Full album (+25%)","Album complet (+25 %)"],
["Suggested Prix de la séance","Tarif simulé de la séance"],
["Prix de la séance Range","Fourchette par séance"],
["Day Rate","Tarif à la journée"],
["Experience","Expérience"],
["Nigerian Wedding Photography Note","Préparer le devis"],
["South Africa","Afrique du Sud"],
["Egypt","Égypte"],
["Tanzania","Tanzanie"],
["Uganda","Ouganda"],
["Ethiopia","Éthiopie"],
["Cameroon","Cameroun"],
["Senegal","Sénégal"],
["Morocco","Maroc"],
["Tunisia","Tunisie"],
["Period","Période"],
["Part Breakdown","Répartition des droits"],
["Quarterly Projections","Projections trimestrielles"],
["Collaborator","Collaborateur"],
["Part Sheet Tip","Formaliser le partage"],
["Profile Checklist Statut","État des rubriques"],
["Suggested Headlines","Titres proposés"],
["Keywords to Include","Mots-clés suggérés"],
["Add these to your headline, About section, and experience descriptions to appear in recruiter searches.","Retenez les mots-clés qui décrivent précisément vos compétences."],
["Connection Growth Strategy","Développer votre réseau"],
["Quarterly Projections","Projections trimestrielles"],
 ['Photographer Details','Profil du photographe'],['Your Account Stats (Average of last 10 posts)','Moyennes des dix dernières publications'],['Avg Likes per Post','Mentions J’aime par publication'],['Avg Comments per Post','Commentaires par publication'],['Avg Shares per Post','Partages par publication'],['Avg Saves per Post','Enregistrements par publication'],['Total Followers','Nombre d’abonnés'],['Cost Structure','Charges et temps de travail'],['Shooting Hours per Session','Heures de prise de vue'],['Post-Processing Hours','Heures de retouche'],['Patreon / Listener Supporters','Auditeurs contributeurs'],['Avg Patron Mensuel Fee (USD)','Contribution mensuelle moyenne (USD)'],['Choose a Palette Style','Choisir un style de palette'],['CSS Variables','Variables CSS'],['Tailwind Config','Configuration Tailwind'],['Contrast Check','Vérifier le contraste'],['Quarterly','Trimestriel'],['Profile Completeness Checklist','Éléments présents sur le profil'],['Current Connections','Relations actuelles'],['Career Level','Expérience professionnelle'],['Industry / Rôle','Secteur ou métier'],['Break-Even Copies','Seuil de rentabilité en exemplaires'],['Comparaison des redevances by Plateforme','Comparaison des droits simulés'],['Royalty %','Droits simulés (%)'],['Country','Pays'],['Total Mensuel Revenue','Revenu mensuel estimé'],['Annuel Potential','Projection annuelle'],['Revenue by Stream','Revenus par source'],['Your Engagement Rate','Votre taux d’engagement'],['Market Rate Reference','Fourchettes indicatives du modèle'],['Your LinkedIn Détails du profil','Votre profil LinkedIn'],['Add each collaborator with their role and percentage split. All splits must total exactly 100%.','Indiquez le rôle et la part de chaque collaborateur. Le total doit atteindre 100 %.']
];
function finish(html,id) {
 const route=routes[id];
 if(!route)return html;
 const [title,intro]=route;
 let result=html.replace(/<h1>[^<]*<\/h1>/,'<h1>'+title+'</h1>').replace(/<p class="lead">[\s\S]*?<\/p>/,'<p class="lead">'+intro+'</p>')
   .replace(/<div class="route-note">[\s\S]*?<\/div>/,'')
   .replace(/<a class="secondary-action" href="\/tools\/[^"]+">[\s\S]*?<\/a>/,'')
   .replace(/<section class="prep-panel"[^>]*>[\s\S]*?<\/section>/,'')
   .replace(/<section><h2>M[ée]thodologie<\/h2><p>[\s\S]*?<\/p><\/section>/,'<section><h2>Méthodologie</h2><p>'+intro+'</p></section>');
 if (id.includes('publishing')) {
   const other=id==='book-publishing-cost'?'calculateur-de-droits-d-autoedition':'cout-publication-livre';
   const title=id==='book-publishing-cost'?'Comparer les droits par exemplaire':'Calculer le budget du livre';
   const note='Les taux, coûts et conversions du modèle servent à comparer des scénarios. Vérifiez les conditions de votre distributeur et votre contrat. <a href="https://kdp.amazon.com/fr_FR/help/topic/G201723080">Consulter les conditions de prix de KDP</a>.';
   result=result.replace(/<div class="en-tip-text">[\s\S]*?<\/div>/g,'<div class="en-tip-text">'+note+'</div>').replace(/<div class="en-tip-label">[\s\S]*?<\/div>/g,'<div class="en-tip-label">Hypothèses de simulation</div>').replace(/<section><h2>Liens utiles<\/h2>[\s\S]*?<\/section>/,'<section><h2>Outil associé</h2><a href="/fr/tools/'+other+'/">'+title+'</a></section>');
 }
 if (['podcast-monetization','photography-pricing','music-royalty-splitter'].includes(id)) {
   const note={'podcast-monetization':'Les revenus présentés utilisent des seuils et tarifs de simulation. Comparez ces projections avec les devis de vos annonceurs et vos contributions réelles.', 'photography-pricing':'Le prix obtenu dépend des hypothèses du modèle. Précisez dans votre devis le nombre de photos, la retouche, les tirages et les conditions de paiement.', 'music-royalty-splitter':'Consignez par écrit les parts convenues, les personnes concernées et la période de versement.'}[id];
   result=result.replace(/<div class="en-tip-text">[\s\S]*?<\/div>/g,'<div class="en-tip-text">'+note+'</div>');
 }
 // Translate visible labels without changing JS strings, field identifiers or export keys.
 result=result.replace(/(<section id="tool-mount"[\s\S]*?<\/section>)/,mount=>mount.replace(/>([^<>]+)</g,(whole,text)=>{
   let translated=text;
   for(const [from,to] of labels) translated=translated.replace(from,to);
   return '>'+translated+'<';
 }));
 if (id==='linkedin-optimizer' && !result.includes('/assets/js/pages/creative/fr-linkedin-workflow-locale.js')) result=result.replace('<script src="/assets/js/pages/creative/linkedin-optimizer-controller.js','<script src="/assets/js/pages/creative/fr-linkedin-workflow-locale.js"></script>\n<script src="/assets/js/pages/creative/linkedin-optimizer-controller.js');
 if (!result.includes('/assets/js/pages/creative/fr-workflow-feedback.js')) result=result.replace('</body>','<script src="/assets/js/pages/creative/fr-workflow-feedback.js" defer></script>\n</body>');
 return result.replace(/[ \t]+$/gm, "");
}
module.exports={finish,hasWorkflow:id=>Object.hasOwn(routes,id)};
