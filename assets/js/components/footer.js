/**
 * AFROTOOLS FOOTER — Web Component
 * Colours: dark navy #111827, accent Apple Blue via --color-primary (#0062CC)
 * Links: readable opacity — no more 0.18/0.25 ghost text
 * Font: DM Sans throughout (Barlow removed)
 */
(function () {
  'use strict';

  const YEAR = new Date().getFullYear();

  /* i18n: all 5 languages */
  const L = {
    tools:      { en: 'Tools', fr: 'Outils', sw: 'Zana', yo: 'Àwọn Iṣẹ́', ha: 'Kayan Aiki' },
    countries:  { en: 'Countries', fr: 'Pays', sw: 'Nchi', yo: 'Orílẹ̀-èdè', ha: 'Ƙasashe' },
    company:    { en: 'Company', fr: 'Entreprise', sw: 'Kampuni', yo: 'Ilé-iṣẹ́', ha: 'Kamfani' },
    legal:      { en: 'Legal', fr: 'Légal', sw: 'Sheria', yo: 'Òfin', ha: 'Doka' },
    logoTagline:{ en: "Africa's Everything Platform", fr: 'La plateforme africaine', sw: 'Jukwaa la Afrika', yo: 'Pẹpẹ irinṣẹ Afirika', ha: 'Dandalin kayan aikin Afirka' },
    nlEyebrow:  { en: 'Stay Updated', fr: 'Restez informé', sw: 'Pata Habari', yo: 'Ṣe Àjọjú', ha: 'Sabbin kayan aiki' },
    nlTitle:    { en: 'New tools. Every week. Free.', fr: 'Nouveaux outils et guides.', sw: 'Sasisho za zana na vyanzo.', yo: 'Iṣẹ́ tuntun. Ọ̀fẹ́.', ha: 'Sabbin kayan aiki da bayanai, kyauta.' },
    placeholder:{ en: 'your@email.com', fr: 'votre@email.com', sw: 'barua@pepe.com', yo: 'imeeli@rẹ.com', ha: 'adireshin imel dinka' },
    btnLabel:   { en: 'Notify Me →', fr: "M'inscrire →", sw: 'Nijulishe →', yo: 'Fara mọ́ →', ha: 'Sanar da ni →' },
    note:       { en: 'No spam. Unsubscribe anytime.', fr: 'Pas de spam. Désinscription facile.', sw: 'Barua pepe huchakatwa na huduma ya fomu; tumia kiungo cha kujiondoa kinapopatikana.', yo: 'Kò sí àdàlù. Yọ ara rẹ nígbàkígbà.', ha: 'Babu sakon talla. Kana iya fita a kowane lokaci. Shafin tabbatarwa yana Turanci.' },
    tagline:    { en: 'Tax calculators, PDF tools, CV builder, currency tools and more — built for all 54 African nations. Core use without a paid subscription.',
                  fr: 'Calculateurs, outils PDF, CV et devises adaptés aux marchés africains. Les fonctions essentielles restent accessibles sans abonnement payant.',
                  sw: 'PAYE, PDF, sarafu na zana za vitendo kwa masoko ya Afrika. Chagua lugha na nchi kando; matumizi ya msingi hayahitaji usajili wa kulipia.',
                  yo: 'Àṣeàṣe owó-orí, iṣẹ́ PDF, owó — fún gbogbo orílẹ̀-èdè 54 Áfíríkà. Ọ̀fẹ́.',
                  ha: 'PAYE, VAT, PDF, CV, Naira da kayan kasuwanci domin Najeriya da kasashen Afirka 54. Kyauta.' },
    disc:       { en: 'AfroTools tools are for informational purposes only and do not constitute financial, tax, or legal advice. Always verify with a qualified professional or your country\'s revenue authority before making financial decisions.',
                  fr: "AfroTools est à titre informatif uniquement. Vérifiez auprès d'un professionnel qualifié avant toute décision financière.",
                  sw: 'Zana za AfroTools ni kwa madhumuni ya taarifa pekee. Hakikisha na mtaalamu aliyeidhinishwa kabla ya maamuzi ya kifedha.',
                  yo: 'Àwọn iṣẹ́ AfroTools jẹ́ fún ìfitónilétí nìkan. Ṣe ìjẹ́rìísí pẹ̀lú ọ̀jọ̀gbọ́n kí o tó ṣe ìpinnu owó.',
                  ha: 'Kayan aikin AfroTools na bayar da bayani ne kawai. Ba shawarar kudi, haraji ko doka ba ne. Ka tabbatar da sakamako wajen kwararre ko hukumar haraji kafin ka yanke hukunci.' },
    affDisc:    { en: 'Some tools include affiliate links to trusted partners. AfroTools may earn a commission at no extra cost to you.',
                  fr: "Certains outils contiennent des liens d'affiliation vers des partenaires de confiance. AfroTools peut percevoir une commission sans frais supplémentaires pour vous.",
                  sw: 'Baadhi ya zana zina viungo vya washirika vilivyo na lebo. AfroTools inaweza kupata tume; hesabu na mpangilio wa matokeo havipaswi kutegemea udhamini.',
                  yo: 'Àwọn iṣẹ́ kan ní àwọn ọ̀nà ìsopọ̀ afilieti sí àwọn alábàáṣiṣẹ́pọ̀ tí a gbẹ́kẹ̀lé. AfroTools lè ní èrè láì ní idiyele àfikún fún ọ.',
                  ha: 'Wasu shafuka na iya dauke da hanyoyin abokan hulda. AfroTools na iya samun rabo ba tare da karin kudi daga gare ka ba.' },
    stats:      { countries: { en: 'African countries', fr: 'Pays africains', sw: 'Nchi za Afrika', yo: 'Orílẹ̀-èdè Áfíríkà', ha: 'Ƙasashen Afirka' },
                   categories: { en: 'Tool categories', fr: 'Catégories', sw: 'Kategoria', yo: 'Ẹ̀ka', ha: 'Rukunan kayan aiki' },
                   paye:       { en: 'PAYE countries live', fr: 'Pays PAYE en ligne', sw: 'Vitovu vya nchi', yo: 'Àwọn orílẹ̀-èdè PAYE tó wà', ha: 'Kasashen PAYE da ke aiki' },
                   free:       { en: 'Core guest use', fr: 'accès essentiel sans abonnement payant', sw: 'matumizi ya msingi bila usajili wa kulipia', yo: 'Lílo pàtàkì láìsí ìsanwó ìforúkọsílẹ̀', ha: 'Amfani na asali ba tare da biyan rajista ba' } },
    freeValue:  { en: 'Free', fr: 'Essentiel', sw: 'Msingi', yo: 'Ọ̀fẹ́', ha: 'Kyauta' },
    privacy:    { en: 'Privacy', fr: 'Confidentialité', sw: 'Faragha', yo: 'Aṣírí - ojú ìwé Gẹẹsi', ha: 'Sirri - shafi na Turanci' },
    terms:      { en: 'Terms', fr: 'Conditions', sw: 'Masharti', yo: 'Òfin - ojú ìwé Gẹẹsi', ha: 'Sharudda - shafi na Turanci' },
    sitemap:    { en: 'Sitemap', fr: 'Plan du site', sw: 'Ramani', yo: 'Àtòjọ ojú-ìwé', ha: 'Taswirar shafi' },
    contact:    { en: 'Contact', fr: 'Contact', sw: 'Wasiliana', yo: 'Kan sí wa - ojú ìwé Gẹẹsi', ha: 'Tuntube mu - shafi na Turanci' },
    emailLabel: { en: 'Email address', fr: 'Adresse e-mail', sw: 'Anwani ya barua pepe', yo: 'Àdírẹ́sì imeeli', ha: 'Adireshin imel' },
    subscribed: { en: '✓ Subscribed!', fr: '✓ Inscription confirmée !', sw: '✓ Umejiandikisha!', yo: '✓ A ti forúkọ sílẹ̀!', ha: '✓ An yi rajista!' },
    retry:      { en: '✗ Try again', fr: '✗ Réessayer', sw: '✗ Jaribu tena', yo: '✗ Gbìyànjú lẹ́ẹ̀kan sí', ha: '✗ Sake gwadawa' },
    builtWith:  { en: 'Built with ♥ for Africa', fr: 'Fait avec ♥ pour l\'Afrique', sw: 'Imejengwa kwa ♥ kwa Afrika', yo: 'A kọ́ pẹ̀lú ♥ fún Áfíríkà', ha: 'An gina shi don Afirka' },
  };

  const LINKS = {
    tools: [
      { en: 'Salary & Tax',        fr: 'Salaire & Impôts', sw: 'Mshahara & PAYE', yo: 'Owó oṣù àti owó-orí', ha: 'Albashi da PAYE', href: '/salary-tax/', hrefFr: '/fr/salary-tax/', hrefSw: '/sw/mshahara-na-kodi/', hrefHa: '/ha/albashi-da-haraji/', hrefYo: '/yo/owo-osu-ati-owo-ori/' },
      { en: 'PDF Workspace',       fr: 'Espace PDF',       sw: 'Eneo la PDF',     yo: 'Ìwé àti PDF',          ha: 'Takardu da PDF', href: '/tools/pdf-workspace/', hrefFr: '/fr/document-pdf/', hrefSw: '/sw/zana/nafasi-pdf/', hrefHa: '/ha/takardu-da-pdf/', hrefYo: '/yo/iwe-ati-pdf/' },
      { en: 'Education',           ha: 'Ilimi',             href: '/education/', hrefHa: '/ha/ilimi/', haOnly: true },
      { en: 'Telecom & Mobile',    ha: 'Sadarwa',           href: '/telecom/', hrefHa: '/ha/sadarwa/', haOnly: true },
      { en: 'Health',              ha: 'Lafiya',             href: '/health/', hrefHa: '/ha/lafiya/', haOnly: true },
      { en: 'Agriculture',         ha: 'Noma',               href: '/agriculture/', hrefHa: '/ha/noma/', haOnly: true },
      { en: 'Education',           yo: 'Ẹ̀kọ́',             href: '/education/', hrefYo: '/yo/eko/', yoOnly: true },
      { en: 'Telecom & Mobile',    yo: 'Ìbáraẹnisọrọ',     href: '/telecom/', hrefYo: '/yo/ibaraenisoro/', yoOnly: true },
      { en: 'Health',              yo: 'Ìlera',             href: '/health/', hrefYo: '/yo/ilera/', yoOnly: true },
      { en: 'Agriculture',         yo: 'Ọ̀gbìn',            href: '/agriculture/', hrefYo: '/yo/ogbin/', yoOnly: true },
      { en: 'Language & Translation', yo: 'Èdè àti Ìtumọ̀', href: '/language/', hrefYo: '/yo/ede-ati-itumo/', yoOnly: true },
      { en: 'Language & Translation', ha: 'Harshe da Fassara', href: '/language/', hrefHa: '/ha/harshe-da-fassara/', haOnly: true },
      { en: 'CV Builder',          fr: 'Créer un CV',      sw: 'Tengeneza CV',     yo: 'Kọ CV - ojú ìwé Gẹẹsi',             ha: 'Mai gina CV',      href: '/tools/cv-builder/', hrefFr: '/fr/tools/generateur-cv/', hrefSw: '/sw/zana/mjenzi-cv/', hrefHa: '/ha/kayan-aiki/gina-cv/' },
      { en: 'Invoice Generator',   fr: 'Facture',          sw: 'Ankara',           yo: 'Ìwé owó - ojú ìwé Gẹẹsi',      ha: 'Kirkiro takardar kudi', href: '/tools/invoice-generator/', hrefFr: '/fr/tools/generateur-factures/', hrefSw: '/sw/zana/kizalishaji-ankara/', hrefHa: '/ha/kayan-aiki/kirkiro-invoice/' },
      { en: 'VAT Calculator',      fr: 'Calculateur TVA',  sw: 'Kikokotoo VAT',    yo: 'VAT àti owó-orí iṣẹ́',       ha: 'Kalkuletan VAT',  href: '/tools/vat-calculator/', hrefFr: '/fr/tools/calculateur-tva/', hrefSw: '/sw/zana/kikokotoo-vat/', hrefHa: '/ha/kayan-aiki/kalkuletan-vat/', hrefYo: '/yo/owo-ori-owo-ise/' },
      { en: 'Currency Converter',  fr: 'Convertisseur',    sw: 'Kubadili Sarafu',  yo: 'Iyípadà owó - ojú ìwé Gẹẹsi',       ha: 'Canjin kudi',     href: '/tools/currency-converter/', hrefFr: '/fr/tools/convertisseur-devises/', hrefSw: '/sw/zana/kibadilishaji-sarafu/', hrefHa: '/ha/kayan-aiki/canja-kudi/' },
    ],
    countries: [
      { en: 'All countries', ha: 'Duk ƙasashe - gadar Turanci', href: '/countries/', hrefHa: '/ha/kasashe/', haOnly: true },
      { en: 'Nigeria', fr: 'Nigéria', yo: 'Naijiria', ha: 'Najeriya', href: '/nigeria/', hrefFr: '/fr/nigeria/', hrefSw: '/sw/nigeria/', hrefHa: '/ha/najeriya/', hrefYo: '/yo/naijiria/' },
      { en: 'Kenya',        yo: 'Kenya - ojú ìwé Gẹẹsi',              ha: 'Kenya - shafi na Turanci',           href: '/kenya/', hrefSw: '/sw/kenya/' },
      { en: 'Ghana',        yo: 'Ghana - ojú ìwé Gẹẹsi',              ha: 'Ghana - shafi na Turanci',           href: '/ghana/', hrefSw: '/sw/ghana/' },
      { en: 'South Africa', fr: 'Afrique du Sud', sw: 'Afrika Kusini', yo: 'South Africa - ojú ìwé Gẹẹsi', ha: 'Afirka ta Kudu - shafi na Turanci', href: '/south-africa/', hrefFr: '/fr/afrique-du-sud/', hrefSw: '/sw/south-africa/' },
      { en: 'Egypt', fr: 'Égypte', sw: 'Misri', yo: 'Egypt - ojú ìwé Gẹẹsi', ha: 'Masar - shafi na Turanci', href: '/egypt/', hrefFr: '/fr/egypte/', hrefSw: '/sw/egypt/' },
      { en: 'Tanzania', fr: 'Tanzanie', yo: 'Tanzania - ojú ìwé Gẹẹsi', ha: 'Tanzania - shafi na Turanci', href: '/tanzania/', hrefFr: '/fr/tanzanie/', hrefSw: '/sw/tanzania/' },
    ],
    company: [
      { en: 'About',       fr: 'À propos',        sw: 'Kuhusu (Kiingereza)',        yo: 'Nípa wa - ojú ìwé Gẹẹsi',          ha: 'Game da mu - gadar Turanci',    href: '/about/', hrefSw: '/about/', hrefHa: '/ha/game-da-mu/' },
      { en: 'Blog',        fr: 'Blog',             sw: 'Blogu',         yo: 'Blọ́ọ̀gì - ojú ìwé Gẹẹsi',          ha: 'Labaran shafi - shafi na Turanci',          href: '/blog/', hrefSw: '/sw/blogu/' },
      { en: 'Contact',     fr: 'Contact',          sw: 'Wasiliana',     yo: 'Kan sí wa - ojú ìwé Gẹẹsi',        ha: 'Tuntuɓe mu - gadar Turanci',    href: '/contact/', hrefSw: '/sw/wasiliana/', hrefHa: '/ha/tuntube-mu/' },
      { en: 'Help',        fr: 'Aide',             sw: 'Msaada',        yo: 'Ìrànlọ́wọ́ - ojú ìwé Gẹẹsi',       ha: 'Taimako - shafi na Turanci',       href: '/help/', hrefSw: '/sw/msaada/' },
      { en: 'Pricing',     fr: 'Tarifs',           sw: 'Bei na Pro',    yo: 'Iye - ojú ìwé Gẹẹsi',              ha: 'Farashi - gadar Turanci',       href: '/pricing/', hrefSw: '/sw/bei/', hrefHa: '/ha/farashi/' },
      { en: 'Changelog',   fr: 'Mises à jour',     sw: 'Mabadiliko (Kiingereza)',    yo: 'Àwọn àyípadà - ojú ìwé Gẹẹsi',    ha: 'Canje-canje - shafi na Turanci',   href: '/changelog/', hrefSw: '/changelog/' },
      { en: 'All Tools',   fr: 'Tous les outils',  sw: 'Zana Zote',     yo: 'Gbogbo irinṣẹ',      ha: 'Duk kayan aiki',href: '/tools/', hrefFr: '/fr/all-tools/', hrefSw: '/sw/zana-zote/', hrefHa: '/ha/kayan-aiki/', hrefYo: '/yo/awon-ise/' },
      { en: 'API Docs', fr: 'Documentation API', sw: 'API kwa Kiswahili', yo: 'Ìwé API - ojú ìwé Gẹẹsi', ha: 'Takardun API - shafi na Turanci', href: '/api/', hrefSw: '/sw/api/' },
      { en: 'Embed Tools', fr: 'Intégrer',         sw: 'Chomeka Zana (Kiingereza)',  yo: 'Fi irinṣẹ sínú - ojú ìwé Gẹẹsi',     ha: 'Saka kayan aiki - shafi na Turanci', href: '/widgets/demo/', hrefFr: '/fr/widgets/', hrefSw: '/widgets/demo/' },
    ],
    legal: [
      { en: 'Privacy Policy', fr: 'Confidentialité', sw: 'Sera ya Faragha', yo: 'Ìlànà aṣírí - ojú ìwé Gẹẹsi',  ha: 'Manufar sirri - gadar Turanci', href: '/privacy/', hrefSw: '/sw/faragha/', hrefHa: '/ha/sirri/' },
      { en: 'Terms of Use', fr: 'Conditions', sw: 'Masharti ya Matumizi', yo: 'Òfin lílò - ojú ìwé Gẹẹsi', ha: 'Sharuɗɗan amfani - gadar Turanci', href: '/terms/', hrefFr: '/fr/terms-of-use/', hrefSw: '/sw/masharti/', hrefHa: '/ha/sharuddan-amfani/' },
      { en: 'Sitemap',        fr: 'Plan du site',    sw: 'Ramani',          yo: 'Àtòjọ Ojú-ìwé', ha: 'Taswirar shafi',href: '/sitemap.xml' },
    ],
  };

  const MARK = `
    <svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:34px;width:34px;flex-shrink:0">
      <polygon points="34,20 48,34 34,48 20,34" fill="#0062CC"/>
      <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
      <polygon points="34,48 44,60 34,68 24,60" fill="#0047AB"/>
      <polygon points="2,24  14,34 2,44  -10,34" fill="#0062CC" opacity="0.6"/>
      <polygon points="52,24 64,34 52,44 40,34"  fill="#0062CC" opacity="0.48"/>
    </svg>`;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

    *, *::before, *::after {
      box-sizing: border-box; margin: 0; padding: 0;
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    :host { display: block; }

    /* ─────────────────────────────────────────────
       SHELL
       #111827 — dark navy, clean and modern.
       Accent: Apple Blue #0062CC via --color-primary.
    ───────────────────────────────────────────── */
    footer {
      background: #111827;
      border-top: 2px solid #1f2937;
      color: #d1d5db;
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

    /* ─────────────────────────────────────────────
       TOP — logo + newsletter
    ───────────────────────────────────────────── */
    .top {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 56px; padding: 56px 0 48px;
      border-bottom: 1px solid #1f2937;
      align-items: start;
    }

    .logo-row {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; margin-bottom: 14px;
    }
    .logo-name {
      font-size: 1.1rem; font-weight: 800;
      letter-spacing: 0.02em; color: #ffffff;
    }
    .logo-name b { color: #3B8AE5; }
    .logo-tagline {
      font-size: 0.46rem; font-weight: 600;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: #8B95A3; display: block; margin-top: 3px;
    }

    /* Tagline under logo — readable, not ghost */
    .tagline {
      font-size: 0.85rem; font-weight: 400;
      color: #9ca3af;
      line-height: 1.7; max-width: 300px;
    }

    /* Newsletter */
    .nl-eyebrow {
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: #3B8AE5; margin-bottom: 6px;
    }
    .nl-title {
      font-size: 1.25rem; font-weight: 800;
      color: #f9fafb; line-height: 1.25; margin-bottom: 18px;
      letter-spacing: -0.02em;
    }
    .nl-form { display: flex; gap: 8px; max-width: 400px; }
    .nl-input {
      flex: 1; min-width: 0;
      padding: 11px 14px;
      background: rgba(255,255,255,0.05);
      border: 1px solid #374151;
      border-radius: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.875rem; color: #f3f4f6; outline: none;
      transition: border-color 0.18s;
    }
    .nl-input::placeholder { color: #6b7280; }
    .nl-input:focus { border-color: var(--color-primary); background: rgba(255,255,255,0.09); }
    .nl-btn {
      padding: 11px 18px; flex-shrink: 0;
      background: var(--color-primary); color: white; border: none;
      border-radius: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem; font-weight: 700;
      cursor: pointer; transition: background 0.15s; white-space: nowrap;
    }
    .nl-btn:hover { background: #005BBF; }
    .nl-note {
      margin-top: 10px; font-size: 0.72rem;
      font-weight: 500; color: #8B95A3;
    }

    /* ─────────────────────────────────────────────
       LINKS GRID
       Col titles: Apple Blue via --color-primary.
       Links: #9ca3af — comfortably readable.
    ───────────────────────────────────────────── */
    .links {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 32px; padding: 44px 0;
      border-bottom: 1px solid #1f2937;
    }
    .col-title {
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: #3B8AE5; margin-bottom: 14px;
    }
    .col-link {
      display: block; padding: 4px 0;
      font-size: 0.84rem; font-weight: 500;
      color: #9ca3af;
      text-decoration: none;
      transition: color 0.13s; line-height: 1.5;
    }
    .col-link:hover { color: #ffffff; }

    /* ─────────────────────────────────────────────
       STATS — numbers that pop
    ───────────────────────────────────────────── */
    .stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; padding: 32px 0;
      border-bottom: 1px solid #1f2937;
      text-align: center;
    }
    .stat-n {
      font-size: 1.8rem; font-weight: 800;
      color: var(--color-primary); line-height: 1;
      letter-spacing: -0.02em;
    }
    .stats > div:last-child .stat-n { color: #f9fafb; }
    .stat-l {
      font-size: 0.72rem; font-weight: 500;
      color: #8B95A3; margin-top: 5px;
    }

    /* ─────────────────────────────────────────────
       BOTTOM BAR
    ───────────────────────────────────────────── */
    .bottom {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 20px 0; flex-wrap: wrap; gap: 12px;
    }
    .copy {
      font-size: 0.75rem; font-weight: 500;
      color: #8B95A3;
    }
    .legal { display: flex; gap: 20px; flex-wrap: wrap; }
    .legal a {
      font-size: 0.75rem; font-weight: 500;
      color: #8B95A3; text-decoration: none;
      transition: color 0.13s;
    }
    .legal a:hover { color: #9ca3af; }

    /* Disclaimer — readable, not invisible */
    .disc {
      width: 100%; padding-top: 14px;
      border-top: 1px solid #1f2937;
      font-size: 0.7rem; font-weight: 400;
      color: #8B95A3; line-height: 1.7;
    }

    /* ─────────────────────────────────────────────
       RESPONSIVE
    ───────────────────────────────────────────── */
    /* Social links */
    .social { display: flex; gap: 12px; margin-top: 16px; }
    .social a {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.06); border: 1px solid #374151;
      color: #9ca3af; text-decoration: none; font-size: 1rem;
      transition: all 0.15s;
    }
    .social a:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

    .built-with {
      font-size: 0.78rem; font-weight: 500; color: #8B95A3;
      margin-top: 18px;
    }

    @media (max-width: 900px) {
      .top   { grid-template-columns: 1fr; gap: 36px; padding: 40px 0 36px; }
      .links { grid-template-columns: 1fr 1fr; }
      .stats { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 560px) {
      .wrap  { padding: 0 20px; }
      .links { grid-template-columns: 1fr 1fr; gap: 24px; }
      .nl-form { flex-direction: column; }
      .bottom { flex-direction: column; align-items: flex-start; }
      .stats  { grid-template-columns: repeat(2, 1fr); }
    }
  `;

  class AfroFooter extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._lang = 'en';
    }

    connectedCallback() {
      // Detect language from URL prefix (matches i18n-detect.js logic)
      var segs = window.location.pathname.split('/');
      var first = segs[1];
      if (['fr','sw','yo','ha'].indexOf(first) !== -1) this._lang = first;
      else this._lang = document.documentElement.lang || 'en';
      this._render(); this._bind();
      if (this._langChangeFn) document.removeEventListener('afrotools:langchange', this._langChangeFn);
      this._langChangeFn = e => {
        this._lang = e.detail.lang; this._render(); this._bind();
      };
      document.addEventListener('afrotools:langchange', this._langChangeFn);
      if (this._registryReadyFn) document.removeEventListener('afrotools:registry-ready', this._registryReadyFn);
      this._registryReadyFn = () => {
        this._render(); this._bind();
      };
      document.addEventListener('afrotools:registry-ready', this._registryReadyFn);
      this._ensureRegistryCounts();
    }

    disconnectedCallback() {
      if (this._langChangeFn) document.removeEventListener('afrotools:langchange', this._langChangeFn);
      if (this._registryReadyFn) document.removeEventListener('afrotools:registry-ready', this._registryReadyFn);
    }

    _l(obj) { return obj[this._lang] || obj.en; }
    _t(item) { return item[this._lang] || item.en; }

    _col(titleObj, items) {
      const t = this._l(titleObj);
      const visibleItems = items.filter(i => (this._lang === 'ha' || !i.haOnly) && (this._lang === 'yo' || !i.yoOnly));
      const links = visibleItems.map(i => `<a href="${this._linkHref(i)}" class="col-link">${this._t(i)}</a>`).join('');
      return `<div><div class="col-title">${t}</div>${links}</div>`;
    }

    _prefixHref(href) {
      if (this._lang === 'en' || href.startsWith('http') || href.startsWith('/sitemap')) return href;
      return '/' + this._lang + href;
    }

    _linkHref(item) {
      var href = item && item.href ? item.href : '#';
      if (this._lang === 'fr') return item.hrefFr || this._prefixHref(href);
      if (this._lang === 'sw') return item.hrefSw || this._prefixHref(href);
      if (this._lang === 'ha') return item.hrefHa || href;
      if (this._lang === 'yo') return item.hrefYo || href;
      return this._prefixHref(href);
    }

    _footerHref(href, haHref, yoHref, swHref) {
      if (this._lang === 'sw') return swHref || this._prefixHref(href);
      if (this._lang === 'ha') return haHref || href;
      if (this._lang === 'yo') return yoHref || href;
      return this._prefixHref(href);
    }

    _ensureRegistryCounts() {
      if (window.AFRO_REGISTRY_COUNTS || document.querySelector('script[data-afro-registry-counts]')) return;
      var script = document.createElement('script');
      script.src = '/assets/js/data/registry-counts.js';
      script.dataset.afroRegistryCounts = 'true';
      script.addEventListener('load', () => {
        this._render();
        this._bind();
      });
      document.head.appendChild(script);
    }

    _getRegistryStats() {
      var counts = window.AFRO_REGISTRY_COUNTS || {};
      var categories = Number(counts['categories.published']);
      var countries = Number(counts['countries.published']);
      var payeCountries = Number(counts['widgets.country_paye']);
      var tools = Array.isArray(window.AFRO_TOOLS) ? window.AFRO_TOOLS : [];
      var registryCategories = window.AFRO_CATEGORIES && typeof window.AFRO_CATEGORIES === 'object'
        ? window.AFRO_CATEGORIES
        : null;

      if (!Number.isFinite(categories) && registryCategories) {
        categories = Object.keys(registryCategories).length;
      }

      if (!Number.isFinite(payeCountries) && tools.length) {
        var payeSet = new Set();
        tools.forEach(function(tool) {
          var countries = Array.isArray(tool.countries) ? tool.countries : [];
          var text = ((tool.name || '') + ' ' + (tool.href || '')).toLowerCase();
          var isLive = tool.status === 'live' || tool.status === 'new';
          var isCountrySpecific = countries.length === 1 && countries[0] !== 'ALL';
          var looksLikePaye = text.indexOf('paye') !== -1 || text.indexOf('salary-tax') !== -1 || text.indexOf('income tax') !== -1;
          if (isLive && isCountrySpecific && looksLikePaye) {
            payeSet.add(countries[0]);
          }
        });
        if (payeSet.size) payeCountries = payeSet.size;
      }

      return {
        countries: Number.isFinite(countries) ? countries : '',
        categories: Number.isFinite(categories) ? categories : '',
        payeCountries: Number.isFinite(payeCountries) ? payeCountries : '',
      };
    }

    _render() {
      const nlEyebrow = this._l(L.nlEyebrow);
      const nlTitle   = this._l(L.nlTitle);
      const ph        = this._l(L.placeholder);
      const btnLbl    = this._l(L.btnLabel);
      const note      = this._l(L.note);
      const tagline   = this._l(L.tagline);
      const disc      = this._l(L.disc);
      const affDisc   = this._l(L.affDisc);
      const emailLabel = this._l(L.emailLabel);
      const freeValue = this._l(L.freeValue);
      const stats     = this._getRegistryStats();

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <footer role="contentinfo">
          <div class="wrap">

            <div class="top">
              <div>
                <a href="${this._footerHref('/', '/ha/', '/yo/')}" class="logo-row">
                  ${MARK}
                  <div>
                    <span class="logo-name">AFRO<b>TOOLS</b></span>
                    <span class="logo-tagline">${this._l(L.logoTagline)}</span>
                  </div>
                </a>
                <p class="tagline">${tagline}</p>
                <div class="social">
                  <a href="https://x.com/afrotoolsHQ" target="_blank" rel="noopener noreferrer" aria-label="&#120143; X (Twitter)">&#120143;</a>
                  <a href="https://www.linkedin.com/company/afrotools/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
                  <a href="https://www.facebook.com/afrotoolsHQ" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
                </div>
                <p class="built-with">${this._l(L.builtWith)}</p>
              </div>
              <div>
                <div class="nl-eyebrow">${nlEyebrow}</div>
                <div class="nl-title">${nlTitle}</div>
                <form class="nl-form" name="newsletter" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you/">
                  <input type="hidden" name="form-name" value="newsletter">
                  <p style="display:none"><input name="bot-field"></p>
                  <input type="hidden" name="source" value="footer">
                  <input class="nl-input" type="email" name="email" placeholder="${ph}" required aria-label="${emailLabel}">
                  <button class="nl-btn" type="submit">${btnLbl}</button>
                </form>
                <p class="nl-note">${note}</p>
              </div>
            </div>

            <div class="links">
              ${this._col(L.tools, LINKS.tools)}
              ${this._col(L.countries, LINKS.countries)}
              ${this._col(L.company, LINKS.company)}
              ${this._col(L.legal, LINKS.legal)}
            </div>

            <div class="stats">
              <div><div class="stat-n">${stats.countries}</div><div class="stat-l">${this._l(L.stats.countries)}</div></div>
              <div><div class="stat-n">${stats.categories}</div><div class="stat-l">${this._l(L.stats.categories)}</div></div>
              <div><div class="stat-n">${stats.payeCountries}</div><div class="stat-l">${this._l(L.stats.paye)}</div></div>
              <div><div class="stat-n">${freeValue}</div><div class="stat-l">${this._l(L.stats.free)}</div></div>
            </div>

            <div class="bottom">
              <p class="copy">© ${YEAR} AfroTools.com</p>
              <div class="legal">
                <a href="${this._lang === 'sw' ? '/sw/faragha/' : this._footerHref('/privacy/', '/ha/sirri/', null, '/privacy/')}">${this._l(L.privacy)}</a>
                <a href="${this._lang === 'sw' ? '/sw/masharti/' : this._lang === 'fr' ? '/fr/terms-of-use/' : this._footerHref('/terms/', '/ha/sharuddan-amfani/', null, '/terms/')}">${this._l(L.terms)}</a>
                <a href="/sitemap.xml">${this._l(L.sitemap)}</a>
                <a href="${this._footerHref('/contact/', '/ha/tuntube-mu/', null, '/sw/wasiliana/')}">${this._l(L.contact)}</a>
              </div>
              <p class="disc">${disc}</p>
              <p class="disc">${affDisc}</p>
            </div>

          </div>
        </footer>`;
    }

    _bind() {
      this.shadowRoot.querySelector('form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const inp = e.target.querySelector('input[type="email"]');
        if (!inp || !inp.value || !inp.checkValidity()) return;
        btn.disabled = true;
        btn.textContent = '…';
        try {
          // Submit to Netlify Forms via POST (Shadow DOM forms are invisible to Netlify's build-time parser)
          const body = new URLSearchParams({
            'form-name': 'newsletter',
            'email': inp.value,
            'source': 'footer'
          }).toString();
          const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
          if (res.ok) {
            btn.textContent = this._l(L.subscribed);
            inp.value = '';
          } else {
            btn.textContent = this._l(L.retry);
          }
        } catch {
          btn.textContent = this._l(L.retry);
        }
        btn.disabled = false;
        setTimeout(() => { btn.textContent = this._l(L.btnLabel); }, 3000);
      });
    }
  }

  if (!customElements.get('afro-footer')) customElements.define('afro-footer', AfroFooter);

  /* ── Auto-load site-wide AI advisor (deferred until idle) ── */
  /* Uses chat bundle if available (from manifest), falls back to individual file */
  var _idle = window.requestIdleCallback || function(cb) { setTimeout(cb, 2000); };
  var _assistantLoaded = false;
  function _loadAssistant() {
    if (_assistantLoaded) return;
    if (document.querySelector('script[src*="site-assistant"]') || document.querySelector('script[src*="chat."]')) return;
    _assistantLoaded = true;
    const s = document.createElement('script');
    // Try chat bundle first, fall back to individual file
    var bundlePath = document.documentElement.getAttribute('data-chat-bundle');
    s.src = bundlePath || '/assets/js/components/site-assistant.min.js';
    s.defer = true;
    document.head.appendChild(s);
  }
  ['pointerdown','keydown'].forEach(function(eventName) {
    window.addEventListener(eventName, _loadAssistant, { once: true, passive: true });
  });
  window.addEventListener('load', function() {
    setTimeout(function() { _idle(_loadAssistant); }, 12000);
  }, { once: true });

})();
