"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  root = path.resolve(__dirname, "..");
let s = fs.readFileSync(
    path.join(root, "crypto/scam-checker/index.html"),
    "utf8",
  ),
  route = "https://afrotools.com/sw/zana/kifurushi-ushahidi-ulaghai-crypto/";
s = s
  .replace('lang="en"', 'lang="sw"')
  .replaceAll("https://afrotools.com/crypto/scam-checker/", route)
  .replace('"en",\n    "fr"', '"sw"')
  .replace(
    '<meta property="og:image"',
    '<meta property="og:locale" content="sw_KE">\n  <meta property="og:image"',
  );
s = s
  .replace(
    `<link rel="alternate" hreflang="en" href="${route}">`,
    '<link rel="alternate" hreflang="en" href="https://afrotools.com/crypto/scam-checker/">',
  )
  .replace(
    `<link rel="alternate" hreflang="x-default" href="${route}">`,
    '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/crypto/scam-checker/">',
  );
const p = [
  [
    "Crypto Scam Red-Flag Checklist & Evidence Pack",
    "Orodha ya Ishara na Kifurushi cha Ushahidi wa Ulaghai wa Crypto",
  ],
  [
    "Organize crypto incident red flags, evidence, timeline notes and user-entered losses privately in your browser. Local JSON, text, PDF and print exports.",
    "Panga ishara za tukio la crypto, ushahidi, mfululizo wa matukio na hasara ndani ya kivinjari. JSON, maandishi, PDF na uchapishaji wa ndani.",
  ],
  [
    "A private, browser-local organizer for incident evidence. It does not check a database or decide whether something is safe.",
    "Kipangaji binafsi cha ushahidi ndani ya kivinjari. Hakikagui hifadhidata wala kuamua kitu ni salama.",
  ],
  ["Private evidence organizer", "Kipangaji binafsi cha ushahidi"],
  [
    "Record generic warning signs, evidence items, timeline notes and losses you already know. Nothing is looked up, submitted, verified or stored by AfroTools.",
    "Rekodi ishara za jumla, vipengee vya ushahidi, mfululizo wa matukio na hasara unazojua. Hakuna kinachotafutwa, kutumwa, kuthibitishwa wala kuhifadhiwa na AfroTools.",
  ],
  [
    "Never enter a private key, seed phrase, password or one-time code.",
    "Usiingize kamwe ufunguo binafsi, kifungu cha kurejesha, nenosiri wala msimbo wa mara moja.",
  ],
  [
    "Anyone asking for one may be trying to take control of your wallet or account. Stop contact and use the provider’s independently verified support channel.",
    "Anayeomba mojawapo anaweza kujaribu kutwaa pochi au akaunti yako. Sitisha mawasiliano na tumia njia ya usaidizi ya mtoa huduma uliyoihakiki mwenyewe.",
  ],
  ["Build your private record", "Jenga rekodi yako binafsi"],
  ["Incident label", "Jina la tukio"],
  ["Incident date", "Tarehe ya tukio"],
  ["Platform or service label", "Jina la jukwaa au huduma"],
  ["Contact reference", "Rejea ya mawasiliano"],
  ["Generic red flags you observed", "Ishara za jumla ulizoona"],
  [
    "Urgency, threats or pressure to act now",
    "Haraka, vitisho au shinikizo la kuchukua hatua sasa",
  ],
  [
    "Private key, seed phrase, password or OTP requested",
    "Ufunguo binafsi, kifungu cha kurejesha, nenosiri au OTP imeombwa",
  ],
  [
    "Guaranteed return or risk-free profit claim",
    "Dai la faida iliyohakikishwa au isiyo na hatari",
  ],
  [
    "Fee or tax demanded before withdrawal",
    "Ada au kodi imeombwa kabla ya kutoa fedha",
  ],
  [
    "Unsolicited direct message or impersonation",
    "Ujumbe usioombwa au kujifanya mtu mwingine",
  ],
  [
    "Remote-access software or screen sharing requested",
    "Programu ya kufikia kifaa kwa mbali au kushiriki skrini imeombwa",
  ],
  [
    "Payment destination changed unexpectedly",
    "Mahali pa malipo pamebadilika bila kutarajiwa",
  ],
  [
    "Discouraged from independent verification",
    "Umezuiwa kuhakiki kwa njia huru",
  ],
  [
    "Evidence items — one per line",
    "Vipengee vya ushahidi — kimoja kwa kila mstari",
  ],
  [
    "Timeline — one event per line",
    "Mfululizo wa matukio — tukio moja kwa kila mstari",
  ],
  ["Loss display currency", "Sarafu ya kuonyesha hasara"],
  ["Optional user-entered loss entries", "Hasara za hiari unazoingiza"],
  ["Add loss entry", "Ongeza hasara"],
  ["Organize evidence pack", "Panga kifurushi cha ushahidi"],
  ["Record status", "Hali ya rekodi"],
  [
    "A completeness summary will appear here. It will never declare the incident safe, fraudulent or verified.",
    "Muhtasari wa ukamilifu utaonekana hapa. Hautatangaza tukio kuwa salama, la ulaghai wala lililothibitishwa.",
  ],
  ["Local evidence exports", "Vipakuliwa vya ushahidi ndani ya kifaa"],
  ["Download JSON", "Pakua JSON"],
  ["Download text", "Pakua maandishi"],
  ["Download PDF", "Pakua PDF"],
  ["Print / Save PDF", "Chapisha / Hifadhi PDF"],
  ["Method:", "Mbinu:"],
  ["Local by design", "Ndani ya kifaa kwa muundo"],
  [
    "Inputs remain in this browser tab. The tool makes no incident lookup or submission request and does not save a draft to browser storage.",
    "Data hubaki kwenye kichupo hiki. Zana haitafuti wala kutuma tukio na haihifadhi rasimu kwenye kivinjari.",
  ],
  ["Preserve originals", "Hifadhi asili"],
  [
    "Keep original screenshots, messages, transaction records and device timestamps unchanged. An exported organizer is not a substitute for the original evidence.",
    "Hifadhi picha, ujumbe, rekodi za miamala na nyakati za kifaa bila kuzibadili. Kifurushi kilichopakuliwa si mbadala wa ushahidi wa asili.",
  ],
  ["Act through trusted channels", "Chukua hatua kupitia njia za kuaminika"],
  [
    "If funds or account access may be at risk, independently locate the provider’s official support channel and consider contacting appropriate local authorities. AfroTools does not investigate incidents.",
    "Ikiwa fedha au ufikiaji wa akaunti uko hatarini, tafuta mwenyewe njia rasmi ya usaidizi na fikiria kuwasiliana na mamlaka husika. AfroTools haichunguzi matukio.",
  ],
  [
    "Questions about the evidence organizer",
    "Maswali kuhusu kipangaji cha ushahidi",
  ],
  [
    "Does this tool check a scam database or validate a wallet?",
    "Je, zana inakagua hifadhidata ya ulaghai au kuthibitisha pochi?",
  ],
  [
    "Does AfroTools receive the incident details?",
    "Je, AfroTools inapokea maelezo ya tukio?",
  ],
  ["What should never be entered?", "Ni nini kisichoingizwa kamwe?"],
  ["No.", "Hapana."],
  ["Related tools", "Zana zinazohusiana"],
];
p.push(
  ["It only organizes information you enter and never labels a person, wallet, platform or transaction safe, fraudulent or verified.","Hupanga tu taarifa unazoingiza na haitangazi mtu, pochi, jukwaa wala muamala kuwa salama, wa ulaghai au uliothibitishwa."],
  ["The organizer and exports run in your browser without a lookup, submission or storage request.","Kipangaji na vipakuliwa hufanya kazi kwenye kivinjari bila utafutaji, utumaji wala ombi la kuhifadhi."],
  ["Never enter a private key, seed phrase, password, one-time code or other secret that can control an account or wallet.","Usiingize ufunguo binafsi, kifungu cha kurejesha, nenosiri, msimbo wa mara moja wala siri nyingine inayoweza kudhibiti akaunti au pochi."],
  ["Example: unexpected support message","Mfano: ujumbe wa usaidizi usiotarajiwa"],
  ["Use a label you understand. Avoid unnecessary names or personal details.","Tumia jina unaloelewa. Epuka majina au maelezo binafsi yasiyohitajika."],
  ["Your own reference","Rejea yako mwenyewe"], ["This is not checked against any database.","Hii haikaguliwi katika hifadhidata yoyote."],
  ["Handle, channel or case reference","Jina la mtumiaji, njia au rejea ya kesi"], ["Do not enter passwords, recovery phrases or one-time codes.","Usiingize manenosiri, vifungu vya kurejesha wala misimbo ya mara moja."],
  ["Screenshot filename and time","Jina la faili ya picha na muda"], ["Transaction reference copied from your own wallet","Rejea ya muamala iliyonakiliwa kutoka pochi yako"], ["Support case reference","Rejea ya kesi ya usaidizi"],
  ["Describe where evidence is stored; do not paste secrets. Maximum 20 bounded lines.","Eleza ushahidi umehifadhiwa wapi; usibandike siri. Mistari isiyozidi 20."],
  ["first message received","ujumbe wa kwanza ulipokelewa"], ["independently contacted provider support","uliwasiliana mwenyewe na usaidizi wa mtoa huduma"],
  ["Maximum 30 bounded lines. This tool does not validate dates or claims inside notes.","Mistari isiyozidi 30. Zana haithibitishi tarehe wala madai ndani ya maelezo."],
  ["One three-letter display code. No FX conversion, valuation or aggregate claim is made.","Msimbo mmoja wa herufi tatu. Hakuna ubadilishaji wa FX, uthamini wala dai la jumla."],
  ["the status counts six organization sections only: label, date, platform/contact reference, selected generic red flags, evidence notes and timeline notes. Entered losses are totalled only within one display currency. No lookup, risk score, safety decision, moderation or verification occurs.","hali huhesabu sehemu sita za upangaji pekee: jina, tarehe, jukwaa au rejea ya mawasiliano, ishara zilizochaguliwa, ushahidi na mfululizo wa matukio. Hasara hujumlishwa ndani ya sarafu moja tu. Hakuna utafutaji, alama ya hatari, uamuzi wa usalama, usimamizi wala uthibitishaji."]
);
for (const [a, b] of p) s = s.replaceAll(a, b);
s = s
  .replace(
    /<script src="\/assets\/js\/analytics-bootstrap[^>]*><\/script>\s*/,
    "",
  )
  .replace(/<script src="\/assets\/js\/lazy-analytics[^>]*><\/script>/, "");
fs.mkdirSync(path.join(root, "sw/zana/kifurushi-ushahidi-ulaghai-crypto"), {
  recursive: true,
});
fs.writeFileSync(
  path.join(root, "sw/zana/kifurushi-ushahidi-ulaghai-crypto/index.html"),
  s,
);
