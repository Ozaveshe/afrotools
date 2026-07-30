(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.frDocumentPdf = api;
    if (root.document) api.install(root.document);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var EXACT = Object.freeze({
    'Home': 'Accueil',
    'Tools': 'Outils',
    'Document & PDF': 'Documents et PDF',
    'Document & PDF Tools': 'Outils de documents et PDF',
    'PDF workflow proof': 'Preuve du flux PDF',
    'Local-first PDF tool': 'Outil PDF local',
    'Methodology': 'Méthode',
    'Before sharing': 'Avant de partager',
    'How it works': 'Fonctionnement',
    'Frequently Asked Questions': 'Questions fréquentes',
    'Related tools': 'Outils associés',
    'Upload PDF': 'Choisir un PDF',
    'Upload a PDF': 'Choisir un PDF',
    'Choose PDF': 'Choisir un PDF',
    'Choose a PDF': 'Choisir un PDF',
    'Select PDF': 'Sélectionner un PDF',
    'Select a PDF': 'Sélectionner un PDF',
    'Add PDF': 'Ajouter un PDF',
    'Add PDFs': 'Ajouter des PDF',
    'Add files': 'Ajouter des fichiers',
    'Browse files': 'Parcourir les fichiers',
    'Drop file here': 'Déposez le fichier ici',
    'Drop files here': 'Déposez les fichiers ici',
    'Drag and drop': 'Glisser-déposer',
    'File': 'Fichier',
    'Files': 'Fichiers',
    'File name': 'Nom du fichier',
    'File size': 'Taille du fichier',
    'Page': 'Page',
    'Pages': 'Pages',
    'Page range': 'Plage de pages',
    'All pages': 'Toutes les pages',
    'Selected pages': 'Pages sélectionnées',
    'Select all': 'Tout sélectionner',
    'Deselect all': 'Tout désélectionner',
    'Clear': 'Effacer',
    'Clear list': 'Vider la liste',
    'Remove': 'Supprimer',
    'Delete': 'Supprimer',
    'Cancel': 'Annuler',
    'Close': 'Fermer',
    'Back': 'Retour',
    'Next': 'Suivant',
    'Previous': 'Précédent',
    'Continue': 'Continuer',
    'Open full tool': 'Ouvrir l’outil complet',
    'Open the full tool': 'Ouvrir l’outil complet',
    'Use the tool here': 'Utiliser l’outil ici',
    'Quick preparation': 'Préparation rapide',
    'Done': 'Terminé',
    'Save': 'Enregistrer',
    'Save draft': 'Enregistrer le brouillon',
    'Load draft': 'Charger le brouillon',
    'Reset': 'Réinitialiser',
    'Start over': 'Recommencer',
    'Copy': 'Copier',
    'Copied': 'Copié',
    'Copy text': 'Copier le texte',
    'Share': 'Partager',
    'Print': 'Imprimer',
    'Preview': 'Aperçu',
    'Download': 'Télécharger',
    'Download PDF': 'Télécharger le PDF',
    'Download ZIP': 'Télécharger le ZIP',
    'Export': 'Exporter',
    'Export PDF': 'Exporter le PDF',
    'Export JSON': 'Exporter en JSON',
    'Export TXT': 'Exporter en TXT',
    'Export CSV': 'Exporter en CSV',
    'Export DOCX': 'Exporter en DOCX',
    'Import JSON': 'Importer un JSON',
    'Processing': 'Traitement en cours',
    'Processing...': 'Traitement en cours…',
    'Loading': 'Chargement',
    'Loading...': 'Chargement…',
    'Ready': 'Prêt',
    'Complete': 'Terminé',
    'Success': 'Opération réussie',
    'Error': 'Erreur',
    'Warning': 'Attention',
    'Try again': 'Réessayer',
    'No file selected': 'Aucun fichier sélectionné',
    'No files selected': 'Aucun fichier sélectionné',
    'No results yet': 'Aucun résultat pour le moment',
    'Required': 'Obligatoire',
    'Optional': 'Facultatif',
    'Settings': 'Réglages',
    'Options': 'Options',
    'Quality': 'Qualité',
    'Low': 'Faible',
    'Medium': 'Moyenne',
    'High': 'Élevée',
    'Custom': 'Personnalisé',
    'Width': 'Largeur',
    'Height': 'Hauteur',
    'Position': 'Position',
    'Top': 'Haut',
    'Bottom': 'Bas',
    'Left': 'Gauche',
    'Right': 'Droite',
    'Center': 'Centre',
    'Opacity': 'Opacité',
    'Rotation': 'Rotation',
    'Font size': 'Taille du texte',
    'Colour': 'Couleur',
    'Color': 'Couleur',
    'Text': 'Texte',
    'Image': 'Image',
    'Images': 'Images',
    'Signature': 'Signature',
    'Draw': 'Dessiner',
    'Type': 'Saisir',
    'Upload': 'Importer',
    'Merge': 'Fusionner',
    'Split': 'Diviser',
    'Compress': 'Compresser',
    'Convert': 'Convertir',
    'Reorder': 'Réorganiser',
    'Rotate': 'Tourner',
    'Extract': 'Extraire',
    'Protect': 'Protéger',
    'Unlock': 'Déverrouiller',
    'Redact': 'Caviarder',
    'Compare': 'Comparer',
    'Translate': 'Traduire',
    'Repair': 'Réparer',
    'Find': 'Rechercher',
    'Replace': 'Remplacer',
    'Find and replace': 'Rechercher et remplacer',
    'Header': 'En-tête',
    'Footer': 'Pied de page',
    'Page numbers': 'Numéros de page',
    'Password': 'Mot de passe',
    'Confirm password': 'Confirmer le mot de passe',
    'Show password': 'Afficher le mot de passe',
    'Source language': 'Langue source',
    'Target language': 'Langue cible',
    'Language': 'Langue',
    'French': 'Français',
    'English': 'Anglais',
    'Ask a question': 'Poser une question',
    'Send': 'Envoyer',
    'Stop': 'Arrêter',
    'Play': 'Lire',
    'Pause': 'Pause',
    'Resume': 'Reprendre',
    'Voice': 'Voix',
    'Speed': 'Vitesse',
    'Search': 'Rechercher',
    'Case sensitive': 'Respecter la casse',
    'Whole word': 'Mot entier',
    'Original': 'Original',
    'Modified': 'Modifié',
    'Difference': 'Différence',
    'Differences': 'Différences',
    'First document': 'Premier document',
    'Second document': 'Deuxième document',
    'Start number': 'Numéro de départ',
    'Prefix': 'Préfixe',
    'Suffix': 'Suffixe',
    'Date': 'Date',
    'Name': 'Nom',
    'Email': 'E-mail',
    'Phone': 'Téléphone',
    'Address': 'Adresse',
    'Company': 'Entreprise',
    'Client': 'Client',
    'Description': 'Description',
    'Quantity': 'Quantité',
    'Price': 'Prix',
    'Subtotal': 'Sous-total',
    'Tax': 'Taxe',
    'Total': 'Total',
    'Balance due': 'Solde dû',
    'Notes': 'Notes',
    'Terms': 'Conditions',
    'Invoice': 'Facture',
    'Receipt': 'Reçu',
    'Business plan': 'Plan d’affaires',
    'Meeting minutes': 'Compte rendu de réunion',
    'Cover letter': 'Lettre de motivation',
    'Resume': 'CV',
    'CV / Resume Builder': 'Générateur de CV',
    'Merge PDFs': 'Fusionner des PDF',
    'Split one PDF': 'Diviser un PDF',
    'Add PDFs or drop them here': 'Ajoutez des PDF ou déposez-les ici',
    'Add one PDF or drop it here': 'Ajoutez un PDF ou déposez-le ici',
    'Add at least two PDFs to merge.': 'Ajoutez au moins deux PDF à fusionner.',
    'Split points': 'Points de découpe',
    'Custom ranges': 'Plages personnalisées',
    'Extract pages': 'Extraire des pages',
    'Every page': 'Chaque page',
    'Ranges to create': 'Plages à créer',
    'Pages to keep': 'Pages à conserver',
    'Select split points first': 'Choisissez d’abord les points de découpe',
    'Combine ranges into one PDF instead of a ZIP': 'Réunir les plages dans un seul PDF au lieu d’un ZIP',
    'Export every page as its own one-page PDF inside a ZIP file.': 'Exporter chaque page dans un PDF séparé regroupé dans un fichier ZIP.',
    'Reorder files with drag, Up, or Down': 'Réorganisez les fichiers par glisser-déposer ou avec Monter et Descendre',
    'Leave page boxes blank to include all pages': 'Laissez les champs de pages vides pour inclure toutes les pages',
    'Use ranges like 1-3, 5, 8-10': 'Utilisez des plages comme 1-3, 5, 8-10',
    'Download PDF or ZIP outputs directly': 'Téléchargez directement les fichiers PDF ou ZIP',
    'Up': 'Monter',
    'Down': 'Descendre',
    'PDF files stay local': 'Les fichiers PDF restent sur votre appareil',
    'Organize pages': 'Organiser les pages',
    'Compress/export': 'Compresser et exporter',
    'Extract text with OCR': 'Extraire le texte par OCR',
    'Compare two PDFs': 'Comparer deux PDF',
    'Translate a PDF': 'Traduire un PDF',
    'Repair a PDF': 'Réparer un PDF',
    'Choose the safest PDF action': 'Choisir l’action PDF la plus sûre',
    'Insert pages': 'Insérer des pages',
    'Clear workspace': 'Vider l’espace de travail',
    'Close file': 'Fermer le fichier',
    'Each click adds to your list. Use page ranges per file when needed.': 'Chaque clic ajoute un fichier à la liste. Utilisez une plage de pages par fichier si nécessaire.',
    'Upload a PDF first': 'Importez d’abord un PDF',
    'Check page order before downloading a combined or split PDF': 'Vérifiez l’ordre des pages avant de télécharger le PDF fusionné ou divisé',
    'How many PDFs can I merge at once?': 'Combien de PDF puis-je fusionner à la fois ?',
    'Can I reorder PDFs or merge only certain pages?': 'Puis-je réorganiser les PDF ou ne fusionner que certaines pages ?',
    'Does merging reduce the quality of my PDFs?': 'La fusion réduit-elle la qualité de mes PDF ?',
    'Click to select or drag & drop PDFs here': 'Cliquez pour sélectionner des PDF ou déposez-les ici',
    'Select one file for PDF download or multiple files for ZIP export.': 'Sélectionnez un fichier pour un téléchargement PDF ou plusieurs fichiers pour un export ZIP.',
    'High quality': 'Haute qualité',
    'JPEG Quality (70%)': 'Qualité JPEG (70 %)',
    'Target size per PDF (optional)': 'Taille cible par PDF (facultatif)',
    'Verify quality after every compression mode': 'Vérifiez la qualité après chaque mode de compression',
    'What do the quality presets mean?': 'Que signifient les préréglages de qualité ?',
    'Is there a limit on PDF file size?': 'Existe-t-il une limite de taille pour les PDF ?',
    'Render pages': 'Convertir les pages',
    'Extract embedded images': 'Extraire les images intégrées',
    'Download all as ZIP': 'Tout télécharger en ZIP',
    'Convert another': 'Convertir un autre fichier',
    'Fill page (may crop)': 'Remplir la page (peut recadrer)',
    'Stretch to page': 'Étirer à la page',
    'Compress to JPG': 'Compresser en JPG',
    'Confirm resolution, order, and file format after conversion': 'Confirmez la résolution, l’ordre et le format après la conversion',
    'Review watermark visibility before sending the file': 'Vérifiez la visibilité du filigrane avant d’envoyer le fichier',
    'Protect PDF': 'Protéger le PDF',
    'Unlock PDF': 'Déverrouiller le PDF',
    'Open Password': 'Mot de passe d’ouverture',
    'Confirm Password': 'Confirmer le mot de passe',
    'Owner Password': 'Mot de passe propriétaire',
    'Generate Strong Password': 'Générer un mot de passe robuste',
    'Copy Password': 'Copier le mot de passe',
    'Allow page extraction and assembly': 'Autoriser l’extraction et l’assemblage des pages',
    'PDF Password': 'Mot de passe du PDF',
    'Protect a copy, then test the password in another reader': 'Protégez une copie, puis testez le mot de passe dans un autre lecteur',
    'Standard footer': 'Pied de page standard',
    'Bottom center, all pages, 1, 2, 3': 'Bas centré, toutes les pages, 1, 2, 3',
    'Skip cover': 'Ignorer la couverture',
    'Start on PDF page 2, printed number 1': 'Commencer à la page PDF 2 avec le numéro imprimé 1',
    'Report style': 'Style rapport',
    'Page 1 of N, bottom right': 'Page 1 sur N, en bas à droite',
    'Page 1 of 10': 'Page 1 sur 10',
    'Start On PDF Page': 'Commencer à la page PDF',
    'Page Range': 'Plage de pages',
    'All selected pages': 'Toutes les pages sélectionnées',
    'Odd PDF pages only': 'Pages PDF impaires uniquement',
    'Even PDF pages only': 'Pages PDF paires uniquement',
    'Mirror left and right positions on facing pages': 'Inverser les positions gauche et droite sur les pages en vis-à-vis',
    'Add Page Numbers': 'Ajouter les numéros de page',
    'Choose or drop a PDF to sign': 'Choisissez ou déposez un PDF à signer',
    'Remove saved signature': 'Supprimer la signature enregistrée',
    'Upload signature image': 'Importer une image de signature',
    'Current Page': 'Page actuelle',
    'All Pages': 'Toutes les pages',
    "Add today's date": 'Ajouter la date du jour',
    'Apply & Download': 'Appliquer et télécharger',
    'Download signed PDF': 'Télécharger le PDF signé',
    'Share as Image': 'Partager comme image',
    'PDF eSignature Tool: How It Works': 'Outil de signature électronique PDF : fonctionnement',
    'Can I sign multiple pages in one document?': 'Puis-je signer plusieurs pages dans un document ?',
    'Document language': 'Langue du document',
    'Extract Text with OCR': 'Extraire le texte par OCR',
    'Copy visible text': 'Copier le texte visible',
    'Download TXT': 'Télécharger le TXT',
    'Free OCR PDF Tool -- Extract Text from Scanned Documents': 'Outil OCR PDF gratuit — Extraire le texte de documents numérisés',
    'Multi-Language Support': 'Prise en charge multilingue',
    'Clear All': 'Tout effacer',
    'Download Filled PDF': 'Télécharger le PDF rempli',
    'Fill PDF Forms Online Without Uploading Files': 'Remplir des formulaires PDF sans téléverser de fichiers',
    'Full Page': 'Page entière',
    'Clear Page': 'Effacer la page',
    'SEARCH PADDING': 'MARGE DE RECHERCHE',
    'Add Matches': 'Ajouter les correspondances',
    'Clear Terms': 'Effacer les termes',
    'OUTPUT QUALITY': 'QUALITÉ DE SORTIE',
    'Download Redacted PDF': 'Télécharger le PDF caviardé',
    'Export Redacted PDF': 'Exporter le PDF caviardé',
    'Add header separator line': 'Ajouter une ligne de séparation d’en-tête',
    'Add footer separator line': 'Ajouter une ligne de séparation de pied de page',
    'PAGE RANGE': 'PLAGE DE PAGES',
    'Odd pages': 'Pages impaires',
    'Even pages': 'Pages paires',
    'Batch ready': 'Lot prêt',
    'Enter PDF password': 'Saisissez le mot de passe du PDF',
    'PDF password': 'Mot de passe du PDF',
    'Supported File Types': 'Types de fichiers pris en charge',
    'Is there a file size limit?': 'Existe-t-il une limite de taille ?',
    'Are my files uploaded to a server?': 'Mes fichiers sont-ils envoyés à un serveur ?',
    'How do I add shapes with no fill?': 'Comment ajouter des formes sans remplissage ?',
    'Does the editor modify the original PDF content?': 'L’éditeur modifie-t-il le contenu original du PDF ?',
    'Convert to PDF': 'Convertir en PDF',
    'Convert Another': 'Convertir un autre fichier',
    'Extract Text': 'Extraire le texte',
    'Copy to Clipboard': 'Copier dans le presse-papiers',
    'Download as .txt': 'Télécharger en .txt',
    'Extract Another': 'Extraire un autre fichier',
    'Drop your PDF here or click to browse': 'Déposez votre PDF ici ou cliquez pour le sélectionner',
    'Add Pages': 'Ajouter des pages',
    'Select All': 'Tout sélectionner',
    'New File': 'Nouveau fichier',
    'PDF Page Manager: How It Works': 'Gestionnaire de pages PDF : fonctionnement',
    'How do I reorder pages?': 'Comment réorganiser les pages ?',
    'Can I rotate individual pages?': 'Puis-je faire pivoter des pages séparément ?',
    'Can I delete specific pages from a PDF?': 'Puis-je supprimer des pages précises d’un PDF ?',
    'Can I insert pages from another PDF?': 'Puis-je insérer des pages provenant d’un autre PDF ?',
    'Can I extract selected pages into a new PDF?': 'Puis-je extraire les pages sélectionnées dans un nouveau PDF ?',
    'Find Details': 'Rechercher des détails',
    'How It Works': 'Fonctionnement',
    'Source Language': 'Langue source',
    'Target Language': 'Langue cible',
    'Translate PDF': 'Traduire le PDF',
    'Page by Page': 'Page par page',
    'Show All Pages': 'Afficher toutes les pages',
    'Download Translated PDF': 'Télécharger le PDF traduit',
    'Copy Text': 'Copier le texte',
    'Changed pages only': 'Pages modifiées uniquement',
    'Copy Summary': 'Copier le résumé',
    'Download Report': 'Télécharger le rapport',
    'Select a visual mode below': 'Sélectionnez un mode visuel ci-dessous',
    'Compare PDFs Online for Free': 'Comparer des PDF gratuitement',
    'Can I export the comparison?': 'Puis-je exporter la comparaison ?',
    'Auto-advance to next page': 'Passer automatiquement à la page suivante',
    'Skip page numbers': 'Ignorer les numéros de page',
    'Preview Voice': 'Écouter la voix',
    'Download Text': 'Télécharger le texte',
    'Download Audio': 'Télécharger l’audio',
    'Does this tool upload my PDF to a server?': 'Cet outil envoie-t-il mon PDF à un serveur ?',
    'Click or drag PDF files here': 'Cliquez ou déposez des fichiers PDF ici',
    'Clear files': 'Effacer les fichiers',
    'Exclude pages': 'Exclure des pages',
    'Save preset': 'Enregistrer le préréglage',
    'Download result': 'Télécharger le résultat',
    'Download ZIP batch': 'Télécharger le lot ZIP',
    'Download audit CSV': 'Télécharger le CSV d’audit',
    'Can I stamp only specific pages?': 'Puis-je numéroter uniquement certaines pages ?',
    'Preview HTML': 'Prévisualiser le HTML',
    'HTML Source': 'Source HTML',
    'Small file': 'Petit fichier',
    'IMAGE QUALITY': 'QUALITÉ DE L’IMAGE',
    'Add generated date': 'Ajouter la date de génération',
    'Supports any PDF file': 'Prend en charge tout fichier PDF',
    'Replace with': 'Remplacer par',
    'Find Matches': 'Rechercher les correspondances',
    'Replace Selected': 'Remplacer la sélection',
    'Replace All': 'Tout remplacer',
    'Download CSV': 'Télécharger le CSV',
    'Find and Replace Text in PDF Documents': 'Rechercher et remplacer du texte dans des documents PDF',
    'REPAIR STRATEGY': 'STRATÉGIE DE RÉPARATION',
    'Raster salvage pages': 'Récupérer les pages par rastérisation',
    'SALVAGE QUALITY': 'QUALITÉ DE RÉCUPÉRATION',
    'Repair PDF': 'Réparer le PDF',
    'Download Repaired PDF': 'Télécharger le PDF réparé',
    'Why did the repair fail?': 'Pourquoi la réparation a-t-elle échoué ?',
    'Will the repaired PDF look identical to the original?': 'Le PDF réparé sera-t-il identique à l’original ?',
    'Remove file': 'Supprimer le fichier',
    'Add review preset': 'Ajouter un préréglage de vérification',
    'Save recipe': 'Enregistrer le flux',
    'Export recipe': 'Exporter le flux',
    '+ Add Step': '+ Ajouter une étape',
    'Clear steps': 'Effacer les étapes',
    'Download report': 'Télécharger le rapport',
    'Add Operation': 'Ajouter une opération',
    'Choose from 30 premium CV templates': 'Choisissez parmi 30 modèles de CV premium',
    'Create cover letter': 'Créer une lettre de motivation',
    'Frequently asked questions': 'Questions fréquentes',
    'Save Receipt': 'Enregistrer le reçu',
    'Save Profile': 'Enregistrer le profil',
    'Receipt type': 'Type de reçu',
    'Receipt details': 'Détails du reçu',
    'Plan options': 'Options du plan',
    'Plan, forecast, review, export': 'Planifier, prévoir, vérifier et exporter',
    'Choose the format that matches the job': 'Choisissez le format adapté au besoin',
    'From rough idea to document-ready plan': 'D’une idée initiale à un plan prêt à présenter',
    'Business plan questions': 'Questions du plan d’affaires',
    'Business plan sections': 'Sections du plan d’affaires',
    'Start file prep': 'Commencer la préparation',
    'Save planner': 'Enregistrer le planificateur',
    'Copy route note': 'Copier la note de parcours',
    'Create Invoice': 'Créer la facture',
    'Document settings': 'Réglages du document',
    'Invoice number': 'Numéro de facture',
    'Due on receipt': 'Paiement à réception',
    'Save Client': 'Enregistrer le client',
    'Add Item': 'Ajouter un article',
    'Add Time Row': 'Ajouter une ligne de temps',
    'Add Expense': 'Ajouter une dépense',
    'Invoice VAT %': 'TVA de la facture (%)',
    'Copy Email': 'Copier l’e-mail',
    'Copy Reminder': 'Copier le rappel'
    ,'Export drawer': 'Volet d’export'
    ,'Optimize PDF': 'Optimiser le PDF'
    ,'Browser print': 'Impression du navigateur'
    ,'Export pages as images': 'Exporter les pages en images'
    ,'Protect if available': 'Protéger si disponible'
    ,'Local runtime': 'Exécution locale'
    ,'Remove password': 'Supprimer le mot de passe'
    ,'Not wired here': 'Non disponible ici'
    ,'Flatten visual covers': 'Aplatir les calques visuels'
    ,'Safer sharing copy': 'Copie plus sûre à partager'
    ,'Page Ranges, Styling, and Batch Export': 'Plages de pages, style et export par lot'
    ,'Will this upload my PDF?': 'Mon PDF sera-t-il téléversé ?'
    ,'Confirm numbering placement before replacing the original': 'Confirmez la position des numéros avant de remplacer l’original'
    ,'Choose or drop a scanned PDF or document image': 'Choisissez ou déposez un PDF numérisé ou une image de document'
    ,'Search redaction': 'Rechercher les éléments à caviarder'
    ,'Add': 'Ajouter'
    ,'Export Images as ZIP': 'Exporter les images en ZIP'
    ,'Export Another': 'Exporter un autre fichier'
    ,'PDF to Image Export': 'Export PDF vers image'
    ,'Does reordering affect the page content quality?': 'La réorganisation modifie-t-elle la qualité du contenu des pages ?'
    ,'Translate PDFs with African Language Support': 'Traduire des PDF avec prise en charge des langues africaines'
    ,'Extract locally, translate with consent, then review before official use': 'Extraire localement, traduire avec consentement, puis vérifier avant tout usage officiel'
    ,'Compare by': 'Comparer par'
    ,'Word-level diff': 'Différences mot par mot'
    ,'Sentence-level diff': 'Différences phrase par phrase'
    ,'Line-level diff': 'Différences ligne par ligne'
    ,'Add a white backing patch behind the stamp for scanned or busy pages.': 'Ajouter un fond blanc derrière le numéro sur les pages numérisées ou chargées.'
    ,'Add page numbers': 'Ajouter des numéros de page'
    ,'Open Preview': 'Ouvrir l’aperçu'
    ,'Copy Source': 'Copier la source'
    ,'Download HTML': 'Télécharger le HTML'
    ,'Convert HTML to PDF Online': 'Convertir du HTML en PDF'
    ,'Can I convert rich text with formatting to PDF?': 'Puis-je convertir du texte enrichi avec sa mise en forme en PDF ?'
    ,'PDF Redact': 'Caviardage PDF'
    ,'Does find and replace support page ranges and regex?': 'La recherche et le remplacement prennent-ils en charge les plages de pages et les expressions régulières ?'
    ,'Drop damaged PDFs here or click to select': 'Déposez les PDF endommagés ici ou cliquez pour les sélectionner'
    ,'Accepts one or many .pdf files': 'Accepte un ou plusieurs fichiers .pdf'
    ,'Watermark': 'Filigrane'
    ,'Add text overlay': 'Ajouter un texte superposé'
    ,'Keep Pages': 'Conserver des pages'
    ,'Extract ranges': 'Extraire des plages'
    ,'Flatten': 'Aplatir'
    ,'Image-based copy': 'Copie sous forme d’images'
    ,'Rotate All': 'Tout faire pivoter'
    ,'Rotate every page': 'Faire pivoter chaque page'
    ,'What does the Compress step actually do?': 'Que fait exactement l’étape de compression ?'
    ,'Cover Letter': 'Lettre de motivation'
    ,'Scholarship Finder': 'Recherche de bourses'
    ,'Find funding routes for study, training, and career moves.': 'Trouvez des financements pour les études, la formation et l’évolution professionnelle.'
    ,'Open tool': 'Ouvrir l’outil'
    ,'open': 'ouvrir'
    ,'Open': 'Ouvrir'
    ,'close': 'fermer'
    ,'AI assist with private content This action may include document, CV, profile, education, legal, or financial content. Review it first and continue only if you want that content sent for AI help. Selected private content may be sent to AfroTools servers and a configured model provider. Continue?': 'Assistance IA avec contenu privé Cette action peut inclure un document, un CV, un profil, des données éducatives, juridiques ou financières. Vérifiez-les d’abord et continuez seulement si vous souhaitez envoyer ce contenu pour obtenir une aide par IA. Le contenu privé sélectionné peut être envoyé aux serveurs AfroTools et à un fournisseur de modèle configuré. Continuer ?'
    ,'Japa Calculator': 'Calculateur de mobilité'
    ,'Compare relocation costs, savings targets, and timelines.': 'Comparez les coûts de mobilité, les objectifs d’épargne et les délais.'
    ,'Create Cover Letter': 'Créer une lettre de motivation'
    ,'From meeting to follow-up in 4 steps': 'De la réunion au suivi en 4 étapes'
    ,'Sales receipt': 'Reçu de vente'
    ,'Tax receipt': 'Reçu fiscal'
    ,'Deposit receipt': 'Reçu d’acompte'
    ,'Refund receipt': 'Reçu de remboursement'
    ,'Gift receipt': 'Reçu cadeau'
    ,'Declined payment slip': 'Reçu de paiement refusé'
    ,'Modern': 'Moderne'
    ,'Tax invoice style': 'Style facture fiscale'
    ,'Thermal POS': 'Ticket de caisse thermique'
    ,'Compact': 'Compact'
    ,'Receipt number': 'Numéro de reçu'
    ,'Order / invoice reference': 'Référence de commande ou de facture'
    ,'SEVERAL EDITS': 'PLUSIEURS MODIFICATIONS'
    ,'Open PDF Workspace': 'Ouvrir l’espace PDF'
    ,'Organize, annotate, sign, protect, and export in one desk.': 'Organisez, annotez, signez, protégez et exportez depuis un seul espace.'
    ,'Clean & protect': 'Nettoyer et protéger'
    ,'Merge & organize': 'Fusionner et organiser'
    ,'Convert & publish': 'Convertir et publier'
    ,'Clean, compress, protect': 'Nettoyer, compresser et protéger'
    ,'Merge and organize pack': 'Parcours de fusion et d’organisation'
    ,'Convert and publish': 'Convertir et publier'
    ,'Review, redact, sign': 'Vérifier, caviarder et signer'
    ,'Career and meeting pack': 'Parcours carrière et réunion'
    ,'Download route note': 'Télécharger la note de parcours'
    ,'Copy WhatsApp': 'Copier pour WhatsApp'
    ,'Freelancers need more than a printable receipt': 'Les freelances ont besoin de plus qu’un reçu imprimable'
    ,'Freelance invoice questions': 'Questions sur la facture freelance'
    ,'Can clients pay from the invoice?': 'Les clients peuvent-ils payer depuis la facture ?'
  });

  var PHRASES = [
    [/\bPrivate by default\b/gi, 'Privé par défaut'],
    [/\bBrowser only\b/gi, 'Navigateur uniquement'],
    [/\bNo upload\b/gi, 'Aucun envoi'],
    [/\bLocal processing\b/gi, 'Traitement local'],
    [/\bLive preview\b/gi, 'Aperçu en direct'],
    [/\bPage citations\b/gi, 'Références de page'],
    [/\bPage confidence\b/gi, 'Confiance par page'],
    [/\bPage ranges\b/gi, 'Plages de pages'],
    [/\bBatch files\b/gi, 'Fichiers par lot'],
    [/\bLocal libraries\b/gi, 'Bibliothèques locales'],
    [/\bHeaders and footers\b/gi, 'En-têtes et pieds de page'],
    [/\bText presets\b/gi, 'Préréglages de texte'],
    [/\bLogo\/image\b/gi, 'Logo ou image'],
    [/\bUpload PDFs\b/gi, 'Choisir des PDF'],
    [/\bUpload files\b/gi, 'Choisir des fichiers'],
    [/\bUpload file\b/gi, 'Choisir un fichier'],
    [/\bUpload Word document\b/gi, 'Choisir un document Word'],
    [/\bUpload PDF with form fields\b/gi, 'Choisir un PDF avec des champs de formulaire'],
    [/\bChoose mode\b/gi, 'Choisir le mode'],
    [/\bChoose compression\b/gi, 'Choisir la compression'],
    [/\bChoose the job\b/gi, 'Choisir l’action'],
    [/\bChoose the tool group\b/gi, 'Choisir le groupe d’outils'],
    [/\bChoose the right surface\b/gi, 'Choisir le bon espace'],
    [/\bProtection settings\b/gi, 'Réglages de protection'],
    [/\bComparison settings\b/gi, 'Réglages de comparaison'],
    [/\bLanguage settings\b/gi, 'Réglages de langue'],
    [/\bWatermark content\b/gi, 'Contenu du filigrane'],
    [/\bWatermark type\b/gi, 'Type de filigrane'],
    [/\bQuick preset\b/gi, 'Préréglage rapide'],
    [/\bPlacement and pages\b/gi, 'Placement et pages'],
    [/\bPlacement and style\b/gi, 'Placement et style'],
    [/\bTokens and templates\b/gi, 'Jetons et modèles'],
    [/\bResult and audit log\b/gi, 'Résultat et journal d’audit'],
    [/\bText preview\b/gi, 'Aperçu du texte'],
    [/\bPDF preview\b/gi, 'Aperçu du PDF'],
    [/\bLive draft preview\b/gi, 'Aperçu du brouillon en direct'],
    [/\bFollow-through preview\b/gi, 'Aperçu du suivi'],
    [/\bLive plan preview\b/gi, 'Aperçu du plan en direct'],
    [/\bSource HTML\b/gi, 'HTML source'],
    [/\bRich Text Editor\b/gi, 'Éditeur de texte enrichi'],
    [/\bImage to PDF\b/gi, 'Image vers PDF'],
    [/\bPDF to Image\b/gi, 'PDF vers image'],
    [/\bPDF to Text\b/gi, 'PDF vers texte'],
    [/\bOffice, Text & Images\b/gi, 'Bureautique, texte et images'],
    [/\bAdd Text\b/gi, 'Ajouter du texte'],
    [/\bHighlight Text\b/gi, 'Surligner le texte'],
    [/\bAdd & Extract\b/gi, 'Ajouter et extraire'],
    [/\bEdit and annotate\b/gi, 'Modifier et annoter'],
    [/\bSign and stamp\b/gi, 'Signer et marquer'],
    [/\bMerge and split PDFs\b/gi, 'Fusionner et diviser des PDF'],
    [/\bMerge a packet\b/gi, 'Fusionner un dossier'],
    [/\bCompress export\b/gi, 'Compresser l’export'],
    [/\bClean keeps structure\b/gi, 'Le mode propre conserve la structure'],
    [/\bCheck the result\b/gi, 'Vérifier le résultat'],
    [/\bVerify before sending\b/gi, 'Vérifier avant l’envoi'],
    [/\bPreview and save\b/gi, 'Prévisualiser et enregistrer'],
    [/\bProtect or unlock\b/gi, 'Protéger ou déverrouiller'],
    [/\bSet password\b/gi, 'Définir le mot de passe'],
    [/\bKnown-password unlock\b/gi, 'Déverrouillage avec mot de passe connu'],
    [/\bApply to\b/gi, 'Appliquer à'],
    [/\bExclude pages\b/gi, 'Exclure des pages'],
    [/\bSkip first page\b/gi, 'Ignorer la première page'],
    [/\bStamp template\b/gi, 'Modèle de marquage'],
    [/\bConfigure Bates stamp\b/gi, 'Configurer le marquage Bates'],
    [/\bUpload and order files\b/gi, 'Choisir et ordonner les fichiers'],
    [/\bHow to use\b/gi, 'Mode d’emploi'],
    [/\bHow PDF repair works\b/gi, 'Fonctionnement de la réparation PDF'],
    [/\bHow the PDF Form Filler Works\b/gi, 'Fonctionnement du remplissage de formulaire PDF'],
    [/\bPrivacy and Security\b/gi, 'Confidentialité et sécurité'],
    [/\bBusiness details\b/gi, 'Coordonnées de l’entreprise'],
    [/\bBusiness logo\b/gi, 'Logo de l’entreprise'],
    [/\bBusiness name\b/gi, 'Nom de l’entreprise'],
    [/\bProducts and services\b/gi, 'Produits et services'],
    [/\bTaxes and charges\b/gi, 'Taxes et frais'],
    [/\bTerms and messages\b/gi, 'Conditions et messages'],
    [/\bDocument type\b/gi, 'Type de document'],
    [/\bYour details\b/gi, 'Vos coordonnées'],
    [/\bClient or company\b/gi, 'Client ou entreprise'],
    [/\bWork, time, and expenses\b/gi, 'Travail, temps et dépenses'],
    [/\bTax, deposits, and payment\b/gi, 'Taxe, acomptes et paiement'],
    [/\bName or studio\b/gi, 'Nom ou studio'],
    [/\bEmail or phone\b/gi, 'E-mail ou téléphone'],
    [/\bTax ID or registration\b/gi, 'Identifiant fiscal ou immatriculation'],
    [/\bUse sample\b/gi, 'Utiliser l’exemple'],
    [/\bStart your plan\b/gi, 'Commencer votre plan'],
    [/\bLender-ready\b/gi, 'Prêt pour un prêteur'],
    [/\bBuilt for real applications, not generic text\b/gi, 'Conçu pour de vraies candidatures, pas pour un texte générique'],
    [/\bLocal PDF export\b/gi, 'Export PDF local'],
    [/\bWord, TXT, and JSON\b/gi, 'Word, TXT et JSON'],
    [/\bNext meeting file\b/gi, 'Fichier de la prochaine réunion'],
    [/\bMeeting Minutes\b/gi, 'Compte rendu de réunion'],
    [/\bBusiness Plan\b/gi, 'Plan d’affaires'],
    [/\bFreelance Invoice\b/gi, 'Facture freelance'],
    [/\bDocument & PDF Workspace\b/gi, 'Espace Documents et PDF'],
    [/\bBrowse \d+ tools\b/gi, 'Parcourir les outils'],
    [/\bWhat PDF job are you doing\?/gi, 'Quelle action PDF souhaitez-vous effectuer ?'],
    [/\bOne action or a full editing desk\?/gi, 'Une action ou un espace d’édition complet ?'],
    [/\bUse a specialist route\b/gi, 'Utiliser un outil spécialisé'],
    [/\bFast, focused, and easier to verify\b/gi, 'Rapide, ciblé et plus facile à vérifier'],
    [/\bKeep an untouched original\b/gi, 'Conserver un original intact'],
    [/\bSource files stay on this device by default\b/gi, 'Les fichiers source restent sur cet appareil par défaut'],
    [/\bVerify the exported copy\b/gi, 'Vérifier la copie exportée'],
    [/\bReady\. Paste HTML or start with a template\./gi, 'Prêt. Collez du HTML ou partez d’un modèle.'],
    [/\bLeave blank for every page\b/gi, 'Laissez vide pour toutes les pages'],
    [/\bClick a field first\b/gi, 'Cliquez d’abord sur un champ'],
    [/\bClick to browse\b/gi, 'Cliquez pour parcourir'],
    [/\bor click to choose (?:one or more files|a file)\b/gi, 'ou cliquez pour choisir un ou plusieurs fichiers'],
    [/\bDrag & drop your PDF here, or click to browse\b/gi, 'Glissez-déposez votre PDF ici ou cliquez pour parcourir'],
    [/\bDrop a PDF here to start editing\b/gi, 'Déposez un PDF ici pour commencer la modification'],
    [/\bAll processing happens in your browser; nothing is uploaded by this workflow\./gi, 'Tout le traitement s’effectue dans votre navigateur ; ce flux n’envoie aucun fichier.'],
    [/\bEverything runs in your browser\b/gi, 'Tout s’exécute dans votre navigateur'],
    [/\bEverything happens locally in your browser\b/gi, 'Tout s’effectue localement dans votre navigateur'],
    [/\bYour file never leaves your device\b/gi, 'Votre fichier ne quitte jamais votre appareil'],
    [/\bYour files stay in the browser\b/gi, 'Vos fichiers restent dans le navigateur'],
    [/\bFiles stay in your browser\b/gi, 'Les fichiers restent dans votre navigateur'],
    [/\bSource files stay in this browser\b/gi, 'Les fichiers source restent dans ce navigateur'],
    [/\bPDF files only\b/gi, 'Fichiers PDF uniquement'],
    [/\bPDF only\b/gi, 'PDF uniquement'],
    [/\bSingle PDF or batch ZIP\b/gi, 'PDF unique ou lot ZIP'],
    [/\bText-based PDFs work best\b/gi, 'Les PDF contenant du texte donnent les meilleurs résultats'],
    [/\bScanned or image-only PDFs\b/gi, 'Les PDF numérisés ou composés uniquement d’images'],
    [/\bPlease paste some HTML code first\./gi, 'Veuillez d’abord coller du code HTML.'],
    [/\bConversion failed\b/gi, 'La conversion a échoué'],
    [/\bProcessing failed\b/gi, 'Le traitement a échoué'],
    [/\bWatermarking failed\b/gi, 'L’ajout du filigrane a échoué'],
    [/\bPreparing watermark\b/gi, 'Préparation du filigrane'],
    [/\bApplying Watermark\b/gi, 'Application du filigrane'],
    [/\bApply Watermark\b/gi, 'Appliquer le filigrane'],
    [/\bDownload PDF\b/gi, 'Télécharger le PDF'],
    [/\bDownload ZIP\b/gi, 'Télécharger le ZIP'],
    [/\bDownload HTML\b/gi, 'Télécharger le HTML'],
    [/\bBackup JSON\b/gi, 'Sauvegarder en JSON'],
    [/\bCopy Source\b/gi, 'Copier la source'],
    [/\bOpen Preview\b/gi, 'Ouvrir l’aperçu'],
    [/\bSave preset\b/gi, 'Enregistrer le préréglage'],
    [/\bLoad preset\b/gi, 'Charger le préréglage'],
    [/\bClick to select or drag & drop\b/gi, 'Cliquez pour sélectionner ou glissez-déposez'],
    [/\bClick or drag & drop\b/gi, 'Cliquez ou glissez-déposez'],
    [/\bDrop your PDF here or click to browse\b/gi, 'Déposez votre PDF ici ou cliquez pour le sélectionner'],
    [/\bChoose or drop a PDF\b/gi, 'Choisissez ou déposez un PDF'],
    [/\bSupports any PDF file\b/gi, 'Prend en charge tout fichier PDF'],
    [/\bSupported:\b/gi, 'Formats pris en charge :'],
    [/\bHigh quality\b/gi, 'Haute qualité'],
    [/\bSmall file\b/gi, 'Petit fichier'],
    [/\bCurrent page\b/gi, 'Page actuelle'],
    [/\bAll pages\b/gi, 'Toutes les pages'],
    [/\bOdd pages\b/gi, 'Pages impaires'],
    [/\bEven pages\b/gi, 'Pages paires'],
    [/\bDownload all\b/gi, 'Tout télécharger'],
    [/\bDownload signed PDF\b/gi, 'Télécharger le PDF signé'],
    [/\bDownload translated PDF\b/gi, 'Télécharger le PDF traduit'],
    [/\bDownload repaired PDF\b/gi, 'Télécharger le PDF réparé'],
    [/\bDownload redacted PDF\b/gi, 'Télécharger le PDF caviardé'],
    [/\bDownload filled PDF\b/gi, 'Télécharger le PDF rempli'],
    [/\bDownload report\b/gi, 'Télécharger le rapport'],
    [/\bDownload text\b/gi, 'Télécharger le texte'],
    [/\bDownload audio\b/gi, 'Télécharger l’audio'],
    [/\bDownload as\b/gi, 'Télécharger en'],
    [/\bCopy to clipboard\b/gi, 'Copier dans le presse-papiers'],
    [/\bCopy summary\b/gi, 'Copier le résumé'],
    [/\bCopy visible text\b/gi, 'Copier le texte visible'],
    [/\bClear all\b/gi, 'Tout effacer'],
    [/\bClear files\b/gi, 'Effacer les fichiers'],
    [/\bClear page\b/gi, 'Effacer la page'],
    [/\bClear terms\b/gi, 'Effacer les termes'],
    [/\bClear steps\b/gi, 'Effacer les étapes'],
    [/\bAdd pages\b/gi, 'Ajouter des pages'],
    [/\bAdd matches\b/gi, 'Ajouter les correspondances'],
    [/\bAdd operation\b/gi, 'Ajouter une opération'],
    [/\bAdd step\b/gi, 'Ajouter une étape'],
    [/\bSelect a visual mode below\b/gi, 'Sélectionnez un mode visuel ci-dessous'],
    [/\bSelect one file\b/gi, 'Sélectionnez un fichier'],
    [/\bSelect multiple files\b/gi, 'Sélectionnez plusieurs fichiers'],
    [/\bSource language\b/gi, 'Langue source'],
    [/\bTarget language\b/gi, 'Langue cible'],
    [/\bDocument language\b/gi, 'Langue du document'],
    [/\bOutput quality\b/gi, 'Qualité de sortie'],
    [/\bImage quality\b/gi, 'Qualité de l’image'],
    [/\bRepair strategy\b/gi, 'Stratégie de réparation'],
    [/\bSalvage quality\b/gi, 'Qualité de récupération'],
    [/\bPage range\b/gi, 'Plage de pages'],
    [/\bStart on PDF page\b/gi, 'Commencer à la page PDF'],
    [/\bEnable AI Assist\b/gi, 'Activer l’assistance IA'],
    [/\breview and approve sending\b/gi, 'vérifiez et autorisez l’envoi'],
    [/\bLeave off for local page-cited answers\b/gi, 'Laissez désactivé pour des réponses locales avec références de page'],
    [/\bSave signature on this device\b/gi, 'Enregistrer la signature sur cet appareil'],
    [/\bOnly enable this on a private device you control\b/gi, 'Activez uniquement sur un appareil privé que vous contrôlez'],
    [/\bI checked\b/gi, 'J’ai vérifié'],
    [/\bI verified\b/gi, 'J’ai vérifié'],
    [/\bI understand\b/gi, 'Je comprends'],
    [/\bthe preview page\b/gi, 'la page d’aperçu'],
    [/\bthe visible page order\b/gi, 'l’ordre visible des pages'],
    [/\bevery marked page\b/gi, 'chaque page marquée'],
    [/\bthe exported PDF is flattened for sharing\b/gi, 'le PDF exporté est aplati pour le partage'],
    [/\bI will keep the original separately\b/gi, 'je conserverai l’original séparément'],
    [/\bthe selected PDF files\b/gi, 'les fichiers PDF sélectionnés'],
    [/\bpage order, rotations, deleted pages, and inserted pages\b/gi, 'l’ordre des pages, les rotations, les pages supprimées et les pages insérées'],
    [/\bnames, dates, amounts, official terms, untranslated text, and the route label\b/gi, 'les noms, dates, montants, termes officiels, textes non traduits et le libellé du parcours'],
    [/\bextracted text against the PDF\b/gi, 'le texte extrait par rapport au PDF'],
    [/\bthe current page\b/gi, 'la page actuelle'],
    [/\bthe source, page preview, layout metrics, headers, footers, and page numbering\b/gi, 'la source, l’aperçu, la mise en page, les en-têtes, les pieds de page et la numérotation'],
    [/\bthe preview and understand this is visual replacement, not redaction\b/gi, 'l’aperçu et je comprends qu’il s’agit d’un remplacement visuel, pas d’un caviardage'],
    [/\bthe repair method, recovered-page count, warnings, and output report\b/gi, 'la méthode de réparation, le nombre de pages récupérées, les avertissements et le rapport de sortie'],
    [/\bthe operation order, step report, final page count, and output size\b/gi, 'l’ordre des opérations, le rapport des étapes, le nombre final de pages et la taille de sortie'],
    [/\bthe freelancer, client, dates, billable lines, tax, withholding, amount paid, balance, and payment instructions\b/gi, 'le freelance, le client, les dates, les lignes facturables, la taxe, la retenue, le montant payé, le solde et les instructions de paiement'],
    [/\bComplete and review the document\b/gi, 'Complétez et vérifiez le document'],
    [/\bbefore download, print, or client handoff\b/gi, 'avant téléchargement, impression ou remise au client'],
    [/\bSupport(?:s|ed)?\b/gi, 'Prise en charge'],
    [/\bEnglish\b/gi, 'Anglais'],
    [/\bFrench\b/gi, 'Français'],
    [/\bJPEG Quality\b/gi, 'Qualité JPEG'],
    [/\bExport audio\b/gi, 'exporter l’audio'],
    [/\bsave a workflow\b/gi, 'enregistrer un flux'],
    [/\badd page numbers\b/gi, 'ajouter des numéros de page'],
    [/\bbefore download\b/gi, 'avant le téléchargement'],
    [/\bHow it works\b/gi, 'Fonctionnement'],
    [/\bFrequently asked questions\b/gi, 'Questions fréquentes'],
    [/\bCan I\b/gi, 'Puis-je'],
    [/\bHow do I\b/gi, 'Comment'],
    [/\bIs there\b/gi, 'Existe-t-il'],
    [/\bYour files never leave your browser\b/gi, 'Vos fichiers restent dans votre navigateur'],
    [/\bFiles never leave your browser\b/gi, 'Les fichiers restent dans votre navigateur'],
    [/\bprocessed locally in your browser\b/gi, 'traité localement dans votre navigateur'],
    [/\bprocessing happens locally in your browser\b/gi, 'le traitement s’effectue localement dans votre navigateur'],
    [/\bruns locally in your browser\b/gi, 's’exécute localement dans votre navigateur'],
    [/\bCore processing runs locally\b/gi, 'Le traitement principal s’effectue localement'],
    [/\bNo upload required\b/gi, 'Aucun téléversement requis'],
    [/\bNo server upload\b/gi, 'Aucun envoi au serveur'],
    [/\bNo account required\b/gi, 'Aucun compte requis'],
    [/\bOpen the output in another reader\b/gi, 'Ouvrez le résultat dans un autre lecteur'],
    [/\bverify the final (?:PDF|file|document)\b/gi, 'vérifiez le fichier final'],
    [/\bbefore sharing\b/gi, 'avant de partager'],
    [/\bbefore downloading\b/gi, 'avant de télécharger'],
    [/\bbefore export\b/gi, 'avant l’export'],
    [/\bSelect (?:a|one) PDF file\b/gi, 'Sélectionnez un fichier PDF'],
    [/\bSelect PDF files\b/gi, 'Sélectionnez des fichiers PDF'],
    [/\bChoose (?:a|one) PDF file\b/gi, 'Choisissez un fichier PDF'],
    [/\bChoose PDF files\b/gi, 'Choisissez des fichiers PDF'],
    [/\bPlease select\b/gi, 'Veuillez sélectionner'],
    [/\bPlease enter\b/gi, 'Veuillez saisir'],
    [/\bPlease wait\b/gi, 'Veuillez patienter'],
    [/\bInvalid page range\b/gi, 'Plage de pages invalide'],
    [/\bInvalid PDF\b/gi, 'PDF invalide'],
    [/\bUnable to (?:read|open) (?:the )?PDF\b/gi, 'Impossible de lire le PDF'],
    [/\bSomething went wrong\b/gi, 'Une erreur est survenue'],
    [/\bOperation failed\b/gi, 'L’opération a échoué'],
    [/\bDownload failed\b/gi, 'Le téléchargement a échoué'],
    [/\bExport failed\b/gi, 'L’export a échoué'],
    [/\bpages? selected\b/gi, 'pages sélectionnées'],
    [/\bpages? total\b/gi, 'pages au total'],
    [/\bfile selected\b/gi, 'fichier sélectionné'],
    [/\bfiles selected\b/gi, 'fichiers sélectionnés'],
    [/\bfile added\b/gi, 'fichier ajouté'],
    [/\bfiles added\b/gi, 'fichiers ajoutés'],
    [/\bDownload the result\b/gi, 'Télécharger le résultat'],
    [/\bCreate PDF\b/gi, 'Créer le PDF'],
    [/\bSave PDF\b/gi, 'Enregistrer le PDF'],
    [/\bMerge PDF\b/gi, 'Fusionner le PDF'],
    [/\bMerge PDFs\b/gi, 'Fusionner les PDF'],
    [/\bSplit PDF\b/gi, 'Diviser le PDF'],
    [/\bCompress PDF\b/gi, 'Compresser le PDF'],
    [/\bConvert PDF\b/gi, 'Convertir le PDF'],
    [/\bRotate pages\b/gi, 'Tourner les pages'],
    [/\bDelete pages\b/gi, 'Supprimer des pages'],
    [/\bMove page\b/gi, 'Déplacer la page'],
    [/\bOriginal size\b/gi, 'Taille d’origine'],
    [/\bNew size\b/gi, 'Nouvelle taille'],
    [/\bCompression level\b/gi, 'Niveau de compression'],
    [/\bOutput format\b/gi, 'Format de sortie'],
    [/\bOutput file\b/gi, 'Fichier de sortie'],
    [/\bPage size\b/gi, 'Format de page'],
    [/\bPage orientation\b/gi, 'Orientation de la page'],
    [/\bPortrait\b/gi, 'Portrait'],
    [/\bLandscape\b/gi, 'Paysage'],
    [/\bPrivacy\b/gi, 'Confidentialité'],
    [/\bLocal-first\b/gi, 'Local par défaut'],
    [/\bReviewed\b/gi, 'Vérifié'],
    [/\bSource\b/gi, 'Source'],
    [/\bSources\b/gi, 'Sources'],
    [/\bLimitations\b/gi, 'Limites'],
    [/\bAssumptions\b/gi, 'Hypothèses'],
    [/\bLast updated\b/gi, 'Dernière mise à jour'],
    [/\bRelated tools\b/gi, 'Outils associés'],
    [/\bPDF Workspace\b/gi, 'Espace PDF'],
    [/\bPDF Editor\b/gi, 'Éditeur PDF'],
    [/\bPDF Compressor\b/gi, 'Compresseur PDF'],
    [/\bPDF Format Converter\b/gi, 'Convertisseur de documents'],
    [/\bPDF Merge & Split\b/gi, 'Fusion et division de PDF'],
    [/\bPDF Merge and Split\b/gi, 'Fusion et division de PDF'],
    [/\bPDF Page Manager\b/gi, 'Gestionnaire de pages PDF'],
    [/\bPDF Translator\b/gi, 'Traducteur PDF'],
    [/\bPDF Compare Tool\b/gi, 'Comparateur de PDF'],
    [/\bPDF to Audio Reader\b/gi, 'Lecteur audio de PDF'],
    [/\bPDF Repair Tool\b/gi, 'Outil de réparation PDF'],
    [/\bPDF Workflow Builder\b/gi, 'Créateur de flux PDF'],
    [/\bInvoice Generator\b/gi, 'Générateur de factures'],
    [/\bReceipt Generator\b/gi, 'Générateur de reçus'],
    [/\bBusiness Plan Builder\b/gi, 'Créateur de plan d’affaires'],
    [/\bMeeting Minutes Generator\b/gi, 'Générateur de comptes rendus'],
    [/\bCover Letter Generator\b/gi, 'Générateur de lettres de motivation'],
    [/\bFreelance Invoice Generator\b/gi, 'Générateur de factures freelance']
  ];

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function preserveCase(source, translated) {
    if (!source) return translated;
    if (source.toUpperCase() === source && /[A-Z]/.test(source)) return translated.toUpperCase();
    return translated;
  }

  function translate(value, routeExact) {
    var source = String(value == null ? '' : value);
    var normalized = clean(source);
    if (!normalized) return source;
    var readinessMatch = normalized.match(/^Fill your name, contact, and summary to open these private next steps\. Readiness: (\d+)%\.$/);
    if (readinessMatch) {
      return (source.match(/^\s*/) || [''])[0]
        + 'Renseignez votre nom, vos coordonnées et votre résumé pour ouvrir ces étapes privées. Progression : '
        + readinessMatch[1]
        + ' %.'
        + (source.match(/\s*$/) || [''])[0];
    }
    if (routeExact && Object.prototype.hasOwnProperty.call(routeExact, normalized)) {
      return (source.match(/^\s*/) || [''])[0]
        + preserveCase(normalized, routeExact[normalized])
        + (source.match(/\s*$/) || [''])[0];
    }
    if (Object.prototype.hasOwnProperty.call(EXACT, normalized)) {
      return (source.match(/^\s*/) || [''])[0]
        + preserveCase(normalized, EXACT[normalized])
        + (source.match(/\s*$/) || [''])[0];
    }
    return source;
  }

  function translateDialog(value, routeExact) {
    var translated = translate(value, routeExact);
    if (translated !== value) return translated;
    var source = String(value == null ? '' : value);
    var deleteMatch = source.match(/^Delete "([\s\S]+)" from this browser\?$/);
    if (deleteMatch) return 'Supprimer « ' + deleteMatch[1] + ' » de ce navigateur ?';
    return source;
  }

  function translateElement(element, routeExact) {
    if (!element || element.nodeType !== 1) return;
    var tag = element.tagName;
    if (/^(SCRIPT|STYLE|CODE|PRE)$/i.test(tag)) return;
    if (element.isContentEditable || element.closest('[contenteditable="true"]')) return;
    ['placeholder', 'title', 'aria-label', 'aria-description', 'data-name', 'data-desc'].forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var source = element.getAttribute(name);
      var translated = translate(source, routeExact);
      if (translated !== source) element.setAttribute(name, translated);
    });
  }

  function translateTree(root, routeExact) {
    if (!root) return;
    if (root.nodeType === 1) translateElement(root, routeExact);
    var doc = root.ownerDocument || root;
    if (!doc.createTreeWalker) return;
    var walker = doc.createTreeWalker(root, 4);
    var node;
    while ((node = walker.nextNode())) {
      var parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|CODE|PRE|TEXTAREA)$/i.test(parent.tagName)) continue;
      if (parent.isContentEditable || parent.closest('[contenteditable="true"]')) continue;
      var translatedText = translate(node.nodeValue, routeExact);
      if (translatedText !== node.nodeValue) node.nodeValue = translatedText;
    }
    if (root.querySelectorAll) {
      root.querySelectorAll('*').forEach(function (element) {
        translateElement(element, routeExact);
      });
    }
  }

  function translateCvText(root, routeExact) {
    if (!root) return;
    var doc = root.ownerDocument || root;
    if (!doc.createTreeWalker) return;
    var walker = doc.createTreeWalker(root, 4);
    var node;
    while ((node = walker.nextNode())) {
      var parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|CODE|PRE|TEXTAREA)$/i.test(parent.tagName)) continue;
      if (parent.isContentEditable || parent.closest('[contenteditable="true"], #cvpreview')) continue;
      var translatedText = translate(node.nodeValue, routeExact);
      if (translatedText !== node.nodeValue) node.nodeValue = translatedText;
    }
  }

  function translateCvTree(root, routeExact) {
    translateCvText(root, routeExact);
    if (root.querySelectorAll) {
      root.querySelectorAll('*').forEach(function (element) {
        if (element.closest('.cv-preview-top, #cvpreview')) return;
        translateElement(element, routeExact);
      });
    }
  }

  function rewriteRoutes(doc, routeMap) {
    if (!routeMap) return;
    doc.querySelectorAll('a[href]').forEach(function (link) {
      var raw = link.getAttribute('href');
      if (!raw || !raw.startsWith('/')) return;
      var path = raw.split(/[?#]/)[0];
      var suffix = raw.slice(path.length);
      var mapped = routeMap[path] || routeMap[path.replace(/\/$/, '')] || routeMap[path + '/'];
      if (mapped) link.setAttribute('href', mapped + suffix);
    });
  }

  function keepDownloadsLocal(doc) {
    if (typeof window === 'undefined') return;

    function continueImmediately(callback, options) {
      if (typeof callback === 'function') callback(true, options || {});
      return true;
    }

    function patchGateApi(api) {
      if (!api || api.__frLocalFirstPatched) return;
      api.guard = continueImmediately;
      api.open = continueImmediately;
      api.guardPromise = function (options) {
        return Promise.resolve({ user: null, context: options || {} });
      };
      api.isRegistered = function () { return true; };
      api.__frLocalFirstPatched = true;
    }

    patchGateApi(window.AfroPdfDownloadGate);
    if (window.AfroTools) patchGateApi(window.AfroTools.pdfDownloadGate);

    if (window.customElements) {
      var gateClass = window.customElements.get('email-gate-modal');
      if (gateClass && gateClass.prototype) gateClass.prototype.show = continueImmediately;
    }

    if (window.HTMLAnchorElement && !window.HTMLAnchorElement.prototype.__frLocalFirstPatched) {
      var inheritedClick = window.HTMLAnchorElement.prototype.click;
      if (!/\[native code\]/.test(String(inheritedClick))) {
        window.HTMLAnchorElement.prototype.click = function () {
          if (this.dataset) this.dataset.noPdfGate = 'true';
          return inheritedClick.call(this);
        };
      }
      window.HTMLAnchorElement.prototype.__frLocalFirstPatched = true;
    }

    if (doc.querySelectorAll) {
      doc.querySelectorAll('email-gate-modal').forEach(function (gate) {
        gate.show = continueImmediately;
        gate.open = continueImmediately;
      });
      doc.querySelectorAll('a[download]').forEach(function (link) {
        link.dataset.noPdfGate = 'true';
      });
      doc.querySelectorAll('.pdg-overlay').forEach(function (overlay) {
        overlay.remove();
      });
    }
  }

  function install(doc) {
    if (!doc || doc.documentElement.dataset.frDocumentPdfInstalled === 'true') return;
    doc.documentElement.dataset.frDocumentPdfInstalled = 'true';
    doc.documentElement.lang = 'fr';
    var context = (typeof window !== 'undefined' && window.__AFROTOOLS_FR_DOCUMENT_PDF__) || {};
    var routeExact = context.exact || {};
    var run = function () {
      if (context.localFirstDownloads === true) keepDownloadsLocal(doc);
      translateTree(doc.body, routeExact);
      rewriteRoutes(doc, context.routeMap);
      if (doc.body) doc.body.classList.add('fr-document-pdf-native');
      doc.documentElement.dataset.frDocumentPdfReady = 'true';
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', run, { once: true });
    else run();
    if (context.refreshOnInteraction === true) {
      var refreshPending = false;
      var refresh = function () {
        refreshPending = false;
        if (context.id === 'cv-builder') translateCvTree(doc.body, routeExact);
        else translateTree(doc.body, routeExact);
        rewriteRoutes(doc, context.routeMap);
        if (context.localFirstDownloads === true) keepDownloadsLocal(doc);
      };
      var scheduleRefresh = function () {
        if (refreshPending) return;
        refreshPending = true;
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(function () {
            window.setTimeout(refresh, 0);
          });
        } else {
          window.setTimeout(refresh, 0);
        }
      };
      var patchRuntimeOwner = function (owner, methodName) {
        if (!owner || typeof owner[methodName] !== 'function' || owner[methodName].__frLocalizedOwner) return;
        var original = owner[methodName];
        var localizedOwner = function () {
          var result = original.apply(this, arguments);
          scheduleRefresh();
          return result;
        };
        localizedOwner.__frLocalizedOwner = true;
        owner[methodName] = localizedOwner;
      };
      var patchRuntimeOwners = function () {
        if (context.id !== 'cv-builder') return;
        patchRuntimeOwner(window.CVApp, 'renderAll');
        patchRuntimeOwner(window.CVBuilderPolish, 'openExportPanel');
      };
      ['click', 'change', 'input', 'submit'].forEach(function (eventName) {
        doc.addEventListener(eventName, function () {
          scheduleRefresh();
          window.setTimeout(scheduleRefresh, 100);
          window.setTimeout(scheduleRefresh, 400);
        }, true);
      });
      [50, 250, 1000, 3000].forEach(function (delay) {
        window.setTimeout(function () {
          patchRuntimeOwners();
          scheduleRefresh();
        }, delay);
      });
      window.addEventListener('load', scheduleRefresh, { once: true });
    }
    if (context.observeDynamic !== false && typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (context.localFirstDownloads === true && node.nodeType === 1) {
              if (node.matches && node.matches('email-gate-modal')) {
                node.show = function (callback, options) {
                  if (typeof callback === 'function') callback(true, options || {});
                  return true;
                };
                node.open = node.show;
              }
              if (node.matches && node.matches('a[download]')) node.dataset.noPdfGate = 'true';
              if (node.querySelectorAll) {
                node.querySelectorAll('a[download]').forEach(function (link) {
                  link.dataset.noPdfGate = 'true';
                });
              }
            }
            if (node.nodeType === 1 || node.nodeType === 11) translateTree(node, routeExact);
            else if (node.nodeType === 3 && node.parentElement) {
              var translatedNode = translate(node.nodeValue, routeExact);
              if (translatedNode !== node.nodeValue) node.nodeValue = translatedNode;
            }
          });
          if (mutation.type === 'characterData' && mutation.target.parentElement) {
            var translatedMutation = translate(mutation.target.nodeValue, routeExact);
            if (translatedMutation !== mutation.target.nodeValue) mutation.target.nodeValue = translatedMutation;
          }
          if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
            translateElement(mutation.target, routeExact);
          }
        });
      });
      var observe = function () {
        if (doc.body) observer.observe(doc.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['placeholder', 'title', 'aria-label', 'aria-description', 'data-name', 'data-desc']
        });
      };
      if (doc.body) observe();
      else doc.addEventListener('DOMContentLoaded', observe, { once: true });
    }
    if (typeof window !== 'undefined') {
      if (typeof window.alert === 'function') {
        var originalAlert = window.alert.bind(window);
        window.alert = function (message) { return originalAlert(translateDialog(message, routeExact)); };
      }
      if (typeof window.confirm === 'function') {
        var originalConfirm = window.confirm.bind(window);
        window.confirm = function (message) { return originalConfirm(translateDialog(message, routeExact)); };
      }
    }
  }

  return {
    exact: EXACT,
    translate: translate,
    translateTree: translateTree,
    keepDownloadsLocal: keepDownloadsLocal,
    install: install
  };
});
