(function (window, document) {
  "use strict";

  var configNode = document.getElementById("sw-tool-config");
  var mount = document.getElementById("sw-sports-root");
  if (!configNode || !mount) return;
  var page = JSON.parse(configNode.textContent);
  var engine = window.AfroSports;
  if (!engine || !engine.tools || !engine.tools[page.toolId]) {
    mount.innerHTML = '<p class="sw-error" role="alert">Programu ya hesabu haikupatikana. Ukurasa umefungwa ili usitoe jibu lisilothibitishwa.</p>';
    return;
  }
  var tool = engine.tools[page.toolId];
  var last = null;

  var FIELD = {
    oddsFormat:"Muundo wa odds",oddsValue:"Thamani ya odds",opponentOddsFormat:"Muundo wa odds za upande mwingine",opponentOddsValue:"Odds za upande mwingine",
    stake:"Dau au amana ya wallet",currency:"Fedha",estimatedProbability:"Makisio yako ya uwezekano wa kushinda (%)",parlayLegs:"Idadi ya mechi kwenye mkeka",averageLegOdds:"Wastani wa odds kwa mechi",
    mode:"Aina ya modeli",favorite:"Timu ya kupima",formBoost:"Nguvu ya kiwango cha karibuni",defenseBoost:"Nguvu ya ulinzi",hostBoost:"Faida ya mwenyeji au mashabiki",upsetTolerance:"Uwezekano wa matokeo ya kushangaza",
    position:"Nafasi",captain:"Kizidishi",minutes:"Dakika zilizochezwa",goals:"Mabao",assists:"Pasi za mabao",cleanSheet:"Bila kuruhusu bao",goalsConceded:"Mabao yaliyoruhusiwa",saves:"Save za kipa",defensiveActions:"Vitendo vya ulinzi",playerPrice:"Bei ya mchezaji, milioni",startProbability:"Uwezekano wa kuanza (%)",fixtureDifficulty:"Ugumu wa mechi, 1-5",yellowCards:"Kadi za njano",redCards:"Kadi nyekundu",ownGoals:"Mabao ya kujifunga",penaltySaves:"Penalti zilizookolewa",penaltyMisses:"Penalti zilizokosa",bonus:"Alama za bonasi",
    market:"Soko la kodi",grossPayout:"Malipo yote ukishinda",actualReceived:"Kiasi halisi kilichopokelewa",depositTaxPct:"Ushuru maalum wa amana/dau (%)",whtPct:"Zuio maalum la ushindi (%)",
    spotifyStreams:"Streams za Spotify",appleStreams:"Streams za Apple Music",boomplayStreams:"Streams za Boomplay",audiomackStreams:"Streams za Audiomack",youtubeStreams:"Streams za YouTube Music",deezerStreams:"Streams za Deezer",tidalStreams:"Streams za Tidal",distributorFee:"Ada ya msambazaji (%)",artistMasterShare:"Mgao wa master wa msanii (%)",songwriterShare:"Mgao wa mtunzi (%)",collaboratorShare:"Mgao wa producer/mshirika (%)",recoupableAdvance:"Advance ambayo haijarejeshwa, USD",marketingSpend:"Gharama ya masoko iliyotozwa, USD",targetIncome:"Lengo la mapato halisi, USD",
    productionBudget:"Bajeti ya uzalishaji, NGN",marketingBudget:"Bajeti ya masoko, NGN",admissions:"Makisio ya watazamaji",avgTicket:"Wastani wa bei ya tiketi, NGN",cinemaShare:"Mgao wa sinema (%)",distributionExpenses:"Gharama za usambazaji, NGN",streamingDeal:"Mkataba wa streaming, NGN",brandTieIns:"Mapato ya chapa, NGN",investorRecoupPct:"Mgao wa urejeshaji wa mwekezaji (%)",
    country:"Soko",eventType:"Aina ya tukio",experience:"Kiwango cha DJ",hours:"Muda wa seti (saa)",equipment:"Vifaa vinavyotolewa",crowdSize:"Makisio ya umati",setupHours:"Saa za maandalizi na soundcheck",mcService:"Ongeza huduma ya MC/host",travelCost:"Safari na logistics",peakDay:"Tarehe yenye mahitaji au Desemba",
    capacity:"Uwezo wa ukumbi",attendance:"Makisio ya mahudhurio (%)",regularTicket:"Bei ya tiketi ya kawaida",vipTicket:"Bei ya tiketi ya VIP",vipShare:"Mgao wa VIP kati ya tiketi zinazouzwa (%)",sponsorRevenue:"Mapato ya udhamini",vendorRevenue:"Mapato ya vibanda",artistFees:"Ada za wasanii",venueCost:"Gharama ya ukumbi",productionCost:"Gharama ya uzalishaji",securityCost:"Usalama na uzingatiaji",permitCost:"Vibali na leseni",insuranceCost:"Bima na huduma ya afya",marketingCost:"Gharama ya masoko",ticketingFee:"Ada ya tiketi/payment gateway (%)",contingency:"Akiba ya dharura (%)",
    startupCost:"Uwekezaji wa kuanza",members:"Wanachama wanaolipa",monthlyFee:"Wastani wa ada ya mwezi",ptRevenue:"Mapato ya mafunzo binafsi",retailRevenue:"Mapato ya bidhaa na vinywaji",monthlyChurn:"Wanaoondoka kwa mwezi (%)",cac:"Gharama ya kupata mteja",rent:"Kodi ya mwezi",staffCost:"Gharama ya wafanyakazi kwa mwezi",utilities:"Huduma na intaneti",equipmentFinance:"Malipo ya vifaa",ownerSalary:"Mshahara wa mmiliki au mwendeshaji",otherCosts:"Gharama nyingine za mwezi",
    vipTickets:"Tiketi za VIP zilizouzwa",vipPrice:"Bei ya VIP",regularTickets:"Tiketi za kawaida zilizouzwa",regularPrice:"Bei ya kawaida",studentTickets:"Tiketi za wanafunzi",studentPrice:"Bei ya mwanafunzi",earlyBirdTickets:"Tiketi za early-bird",earlyBirdPrice:"Bei ya early-bird",compTickets:"Tiketi za bure",affiliateFee:"Malipo ya affiliate/influencer",platformFee:"Ada ya jukwaa (%)",gatewayFee:"Ada ya payment gateway (%)",refundRate:"Akiba ya refund/no-show (%)",fixedCosts:"Gharama za kudumu za tukio",
    matchTier:"Kiwango cha mashindano",seatType:"Aina ya kiti",demand:"Kiwango cha mahitaji",quantity:"Idadi ya tiketi",channel:"Njia ya kununua",seasonPassPrice:"Bei ya season pass",homeMatches:"Mechi za nyumbani kwenye pass",transportCost:"Gharama ya usafiri",foodCost:"Chakula na vinywaji",parkingCost:"Maegesho au kufikia uwanja",
    pathway:"Njia unayolenga",competitionLevel:"Kiwango cha juu cha mashindano",gpa:"Makisio ya GPA kwa 4.0",coreCourses:"Kozi za msingi zilizolinganishwa",age:"Umri",englishScore:"Alama ya Kiingereza au sawa",video:"Video ya highlights iko tayari",transcripts:"Transcripts rasmi ziko tayari",targetSchools:"Shule zilizofanyiwa utafiti",coachEmails:"Barua zilizotumwa kwa makocha",responseRate:"Kiwango cha majibu ya makocha (%)",
    sport:"Mchezo",level:"Kiwango cha sasa",monthlySalary:"Mshahara wa mwezi (hiari)",signingBonus:"Bonasi ya kusaini",monthlyEndorsements:"Udhamini wa mwezi",yearsRemaining:"Miaka iliyobaki",annualGrowth:"Ukuaji wa mkataba kwa mwaka (%)",agentFee:"Ada ya wakala/usimamizi (%)",taxReserve:"Akiba ya kodi (%)",injuryReserve:"Akiba ya jeraha (%)",relocationCost:"Gharama ya kuhama/msaada wa familia",retirementContribution:"Akiba ya kustaafu (%)",savingsRate:"Kiwango cha akiba cha mapato halisi (%)",
    budget:"Bajeti yote kwa fedha ya ndani",gameType:"Kazi kuu",resolution:"Resolution unayolenga",sourceType:"Njia ya kununua",usedParts:"Tumia vifaa vilivyotumika vilivyohakikiwa",peripherals:"Jumuisha monitor na vifaa",
    projectType:"Aina ya mradi",shootDays:"Siku za kupiga",editDays:"Siku za kuhariri",extraCrew:"Wahudumu wa ziada",equipmentCost:"Kukodi vifaa kwa siku",deliverables:"Idadi ya kazi za mwisho",revisionRounds:"Mizunguko ya marekebisho",usage:"Haki za matumizi",albumCost:"Uzalishaji wa albamu/print",drone:"Huduma ya drone",overheadPct:"Gharama za biashara (%)",rush:"Uwasilishaji wa haraka"
  };

  var TEXT = {
    "Positive value":"Thamani chanya","Thin value":"Thamani ndogo","Negative value":"Thamani hasi","Implied chance":"Uwezekano unaodokezwa","Your edge":"Faida ya makisio yako","Expected value":"Thamani inayotarajiwa",
    "Decimal odds":"Odds za desimali","Fractional odds":"Odds za sehemu","American odds":"Odds za Marekani","Fair odds from your estimate":"Odds halali kutoka makisio yako","Parlay stress test":"Jaribio la mkeka","Potential profit":"Faida inayowezekana","Total return":"Malipo yote",
    "Top contender":"Timu inayoongoza","Favorite rank":"Nafasi ya timu uliyochagua","Field pressure":"Nguvu ya timu nyingine","Most likely final path":"Njia inayowezekana ya fainali","Upset setting":"Mpangilio wa matokeo ya kushangaza",
    "Gameweek points":"Alama za gameweek","Base score":"Alama za msingi","Value":"Thamani","Minutes":"Dakika","Appearance, 60+ minutes":"Kucheza dakika 60 au zaidi","Appearance, under 60 minutes":"Kucheza chini ya dakika 60","Goals scored":"Mabao yaliyofungwa","Assists":"Pasi za mabao","Clean sheet":"Bila kuruhusu bao","Bonus points":"Alama za bonasi","Fixture-adjusted expectation":"Makisio yaliyorekebishwa kwa ugumu wa mechi","Player value":"Thamani ya mchezaji",
    "Net betting profit after modeled tax":"Faida halisi baada ya kodi ya modeli","Withheld on winnings":"Zuio kwenye ushindi","Deposit or stake duty":"Ushuru wa amana au dau","Effective drag":"Athari ya kodi","Gross payout if won":"Malipo yote ukishinda","Stake or wallet deposit":"Dau au amana ya pochi","Net winnings before tax":"Ushindi halisi kabla ya kodi","WHT on winnings":"Zuio la kodi kwenye ushindi","Net payout":"Malipo halisi","Slip audit gap":"Tofauti ya ukaguzi wa slip",
    "Estimated artist net":"Makisio ya mapato halisi ya msanii","Gross estimate":"Makisio ya jumla","Distributor fee":"Ada ya msambazaji","Recoup left":"Kiasi cha advance kilichobaki","Streams for target":"Streams za kufikia lengo","Artist master share":"Mgao wa master wa msanii","Songwriter/publishing estimate":"Makisio ya mtunzi/uchapishaji","Collaborator split":"Mgao wa mshirika","Advance recouped this period":"Advance iliyorejeshwa kipindi hiki","Marketing spend charged":"Gharama ya masoko iliyotozwa","Estimated net":"Makisio ya halisi",
    "Producer-side profit estimate":"Makisio ya faida ya producer","Box office gross":"Mauzo yote ya sinema","Producer revenue":"Mapato ya producer","Investor recoup":"Urejeshaji wa mwekezaji","ROI":"Faida ya uwekezaji","Production budget":"Bajeti ya uzalishaji","Marketing budget":"Bajeti ya masoko","Distribution expenses":"Gharama za usambazaji","Producer cinema share":"Mgao wa sinema wa producer","Streaming and brand revenue":"Mapato ya streaming na chapa","Investor recoup waterfall":"Mpangilio wa urejeshaji wa mwekezaji","Break-even admissions":"Watazamaji wa kufikia break-even","2025 market benchmark":"Kigezo cha soko cha 2025",
    "Recommended DJ quote":"Nukuu ya DJ inayopendekezwa","Deposit":"Amana","Extra hours":"Saa za ziada","MC or host add-on":"Nyongeza ya MC/host","Equipment line":"Kipengele cha vifaa","Base performance fee":"Ada ya msingi ya kazi","Peak-day premium":"Nyongeza ya tarehe yenye mahitaji","Setup and soundcheck time":"Muda wa maandalizi na soundcheck","MC/host service":"Huduma ya MC/host","Travel and logistics":"Safari na logistics","Crowd-size lift":"Nyongeza ya ukubwa wa umati","Suggested quote range":"Safu ya nukuu inayopendekezwa",
    "Event net profit":"Faida halisi ya tukio","Ticket revenue":"Mapato ya tiketi","Total costs":"Gharama zote","Sponsor/vendor cover":"Mchango wa wadhamini na vibanda","Average ticket yield":"Wastani wa mapato kwa tiketi","Artist fees":"Ada za wasanii","Venue and production":"Ukumbi na uzalishaji","Security and marketing":"Usalama na masoko","Permits and insurance":"Vibali na bima","Vendor booth revenue":"Mapato ya vibanda","Ticketing and gateway fees":"Ada za tiketi na gateway","Contingency":"Akiba ya dharura","50% attendance stress test":"Jaribio la mahudhurio 50%","75% attendance stress test":"Jaribio la mahudhurio 75%",
    "Monthly operating profit":"Faida ya uendeshaji kwa mwezi","Break-even members":"Wanachama wa kufikia kutofanya hasara","LTV/CAC":"LTV/CAC","Non-dues revenue":"Mapato nje ya ada","Monthly churn":"Wanaoondoka kwa mwezi","Membership revenue":"Mapato ya uanachama","PT and retail revenue":"Mapato ya mafunzo binafsi na bidhaa","Monthly fixed costs":"Gharama za kudumu za mwezi","Owner/operator salary":"Mshahara wa mmiliki au mwendeshaji","Startup investment":"Uwekezaji wa kuanza","Payback period":"Muda wa kurejesha uwekezaji","Estimated member LTV":"Makisio ya LTV ya mwanachama",
    "Net ticket revenue":"Mapato halisi ya tiketi","Gross sales":"Mauzo yote","Fees and refunds":"Ada na marejesho","Average paid ticket":"Wastani wa tiketi iliyolipiwa","VIP gross":"Mauzo ya VIP","Regular gross":"Mauzo ya kawaida","Student gross":"Mauzo ya wanafunzi","Early-bird gross":"Mauzo ya early-bird","Sponsor revenue":"Mapato ya udhamini","Affiliate or influencer payout":"Malipo ya affiliate/influencer","Comp tickets":"Tiketi za bure","Marketing and fixed costs":"Masoko na gharama za kudumu",
    "Estimated match-day ticket cost":"Makisio ya gharama ya siku ya mechi","Single ticket":"Tiketi moja","Channel fee":"Ada ya njia ya mauzo","Match-day extras":"Gharama nyingine za siku ya mechi","Season per match":"Season pass kwa mechi","Ticket quantity":"Idadi ya tiketi","Ticket subtotal with channel fee":"Tiketi pamoja na ada","Transport":"Usafiri","Food and drinks":"Chakula na vinywaji","Parking or local access":"Maegesho au kufikia uwanja","Base country benchmark":"Kigezo cha msingi cha nchi","Match tier and demand lift":"Nyongeza ya mashindano na mahitaji","Seat multiplier":"Kizidishi cha kiti","Season pass value":"Thamani ya season pass",
    "Scholarship readiness":"Utayari wa ufadhili","Athletic proof":"Ushahidi wa uwezo wa michezo","GPA target":"Lengo la GPA","Outreach engine":"Mawasiliano na makocha","Age review":"Ukaguzi wa umri","GPA entered":"GPA iliyoingizwa","Core courses entered":"Kozi za msingi zilizoingizwa","Highlight video":"Video ya highlights","Transcripts":"Transcripts","English score":"Alama ya Kiingereza","Target schools":"Shule zinazolengwa","Coach reply rate":"Kiwango cha majibu ya makocha",
    "Projected career net":"Makisio ya mapato halisi ya taaluma","Career gross":"Mapato yote ya taaluma","Suggested savings":"Akiba inayopendekezwa","Retirement reserve":"Akiba ya kustaafu","Monthly baseline":"Msingi wa mwezi","Signing bonus":"Bonasi ya kusaini","Agent fee reserve":"Akiba ya ada ya wakala","Tax reserve":"Akiba ya kodi","Injury reserve":"Akiba ya jeraha","Relocation and family support":"Kuhama na msaada wa familia","Endorsements per month":"Udhamini kwa mwezi","Next contract target":"Lengo la mkataba unaofuata",
    "Recommended build tier":"Kiwango cha kompyuta kinachopendekezwa","Core build budget":"Bajeti ya kompyuta","Expected performance":"Utendaji unaotarajiwa","Price uplift":"Nyongeza ya bei","PSU guidance":"Mwongozo wa PSU","Motherboard":"Motherboard","Storage":"Hifadhi","Power and case":"Nguvu na case","Cooling and extras":"Cooling na vifaa vya ziada","Target resolution":"Resolution inayolengwa","Used-parts discount model":"Modeli ya punguzo la vifaa vilivyotumika",
    "Recommended creative quote":"Nukuu ya kazi inayopendekezwa","Booking deposit":"Amana ya nafasi","Shoot fee":"Ada ya kupiga","Usage fee":"Ada ya matumizi","Overhead":"Gharama za biashara","Editing fee":"Ada ya kuhariri","Extra crew":"Wahudumu wa ziada","Equipment rental":"Kukodi vifaa","Deliverable handling":"Maandalizi ya kazi za mwisho","Extra revision rounds":"Mizunguko ya ziada ya marekebisho","Album/print production":"Uzalishaji wa albamu/print","Drone add-on":"Nyongeza ya drone","Rush premium":"Nyongeza ya haraka","Travel":"Safari"
  };

  var OPTIONS = {
    "Decimal, e.g. 2.50":"Desimali, mfano 2.50","Decimal, e.g. 2.70":"Desimali, mfano 2.70","Fractional, e.g. 6/4":"Sehemu, mfano 6/4","Fractional, e.g. 17/10":"Sehemu, mfano 17/10",
    "American, e.g. +150 or -200":"Marekani, mfano +150 au -200","American, e.g. +170 or -150":"Marekani, mfano +170 au -150","Local multiplier, e.g. 2.5":"Kizidishi cha ndani, mfano 2.5","Local multiplier, e.g. 2.7":"Kizidishi cha ndani, mfano 2.7",
    "2027 planning mode":"Hali ya kupanga 2027","2025 review and what-if mode":"Hali ya ukaguzi na majaribio ya 2025",
    Morocco:"Moroko",Egypt:"Misri",Algeria:"Aljeria",Tunisia:"Tunisia","South Africa":"Afrika Kusini",Cameroon:"Kamerun","Cote d'Ivoire":"Côte d’Ivoire","DR Congo":"Jamhuri ya Kidemokrasia ya Kongo","Equatorial Guinea":"Guinea ya Ikweta",
    Yes:"Ndiyo",No:"Hapana","Normal player":"Mchezaji wa kawaida","Captain, 2x":"Nahodha, 2x","Triple captain, 3x":"Nahodha mara tatu, 3x",
    Goalkeeper:"Kipa",Defender:"Beki",Midfielder:"Kiungo",Forward:"Mshambuliaji",
    "Nigeria - Lagos licensed online gaming":"Nigeria — kampuni ya mtandaoni yenye leseni ya Lagos","Custom market":"Soko maalum",
    Wedding:"Harusi","Club night":"Usiku wa klabu",Festival:"Tamasha","Corporate event":"Tukio la kampuni","Private party":"Sherehe binafsi",
    Emerging:"Anayeanza kujulikana","Working professional":"Mtaalamu anayefanya kazi","Known city act":"Anayejulikana mjini","Headline act":"Msanii mkuu",
    "Client supplies everything":"Mteja anatoa kila kitu","Deck/controller only":"Deck/controller pekee","Sound system":"Mfumo wa sauti","Sound, lights, booth":"Sauti, taa na booth",
    "Local retailers":"Wauzaji wa ndani","Continental/top club":"Klabu ya bara/juu","Top national league":"Ligi kuu ya kitaifa","Major derby or rivalry":"Derby au ushindani mkubwa",
    "Terrace/standard end":"Terrace/sehemu ya kawaida","Regular seat":"Kiti cha kawaida","Box/hospitality":"Box/hospitality","Normal fixture":"Mechi ya kawaida","Title race or qualifier":"Mbio za ubingwa au kufuzu","Rivalry match":"Mechi ya ushindani","Final or trophy game":"Fainali au mechi ya kombe",
    "Gate or club office":"Getini au ofisi ya klabu","Official online platform":"Jukwaa rasmi la mtandaoni","Reseller/agent":"Muuzaji wa pili/wakala",
    "UK university sport":"Michezo ya chuo kikuu Uingereza","Canada university sport":"Michezo ya chuo kikuu Kanada","State/regional":"Jimbo/kanda","International selection":"Uteuzi wa kimataifa",
    Football:"Mpira wa miguu",Basketball:"Mpira wa kikapu",Athletics:"Riadha",Boxing:"Ndondi","Academy or amateur":"Academy au amateur","Europe or global league":"Ulaya au ligi ya kimataifa",
    "Esports, 1080p high FPS":"Esports, 1080p FPS ya juu","AAA gaming":"Michezo ya AAA","Gaming plus content creation":"Michezo pamoja na kutengeneza maudhui","Import parts":"Agiza vifaa",
    "Portrait/session":"Picha/kipindi","Commercial campaign":"Kampeni ya biashara","Music video":"Video ya muziki","Event coverage":"Kufunika tukio","Real estate/property":"Mali isiyohamishika",
    "Personal/private use":"Matumizi binafsi","Small business marketing":"Masoko ya biashara ndogo","Paid campaign":"Kampeni ya kulipiwa","Broadcast or large campaign":"Matangazo au kampeni kubwa",
    "Local retail":"Duka la ndani","Imported parts":"Vifaa vya kuagiza","Verified used mix":"Mchanganyiko wa vilivyotumika vilivyohakikiwa"
  };

  var INSIGHTS = {
    "betting-odds": [
      "Makisio yako yakizidi kiwango cha kutofanya hasara, dau linaweza kuonekana na thamani; hilo halithibitishi matokeo.",
      "Linganisha thamani inayotarajiwa kwa dau zenye kiasi sawa badala ya kufuata malipo makubwa pekee.",
      "Hesabu ya bila margin huondoa margin rahisi ya soko la pande mbili ili uone uwezekano wa msingi.",
      "Kwa mkeka, hitilafu ndogo za bei huongezeka haraka; tumia kipimo cha mechi nyingi kwa tahadhari."
    ],
    "afcon-predictor": [
      "Tumia viingizo vya kiwango na ulinzi kama mawazo ya uchunguzi, si nafasi za moja kwa moja.",
      "Modeli inaonyesha nafasi ya timu, presha ya kundi na njia inayowezekana badala ya jedwali la mtoano pekee.",
      "Uwezekano mdogo wa timu moja ni wa kawaida kwenye mashindano ya mtoano ya timu 24.",
      "Kwa kupanga maudhui, orodha ya timu sita za juu ni muhimu kuliko kutaja bingwa mmoja."
    ],
    "fantasy-football": [
      "Ongeza vitendo vya ulinzi ikiwa mchezaji alikuwa na clearances, blocks, interceptions au tackles nyingi.",
      "Alama nzuri pekee haitoshi kuchagua nahodha; zingatia ugumu wa mechi na uhakika wa dakika.",
      "Thamani kwa bei na uwezekano wa kuanza husaidia kufanya uamuzi wa uhamisho.",
      "FPL inaweza kurekebisha assists na bonasi baada ya ukaguzi; haya ni makisio ya kupanga."
    ],
    "betting-tax": [
      "Kodi ya kamari hubadilika; modeli hutenganisha ushuru wa amana na zuio la ushindi.",
      "Linganisha malipo halisi ya slip na mstari wa zuio kabla ya kudhani kuna kosa.",
      "Mstari wa ukaguzi husaidia kuona tofauti ya malipo ya mwendeshaji, si malipo halisi pekee.",
      "Kwa soko lisiloorodheshwa, tumia kiwango cha sasa kutoka kwa mdhibiti au masharti ya mwendeshaji."
    ],
    "streaming-royalties": [
      "Boomplay na Audiomack zinaweza kusaidia ugunduzi wa wasikilizaji hata safu yao ya malipo ikiwa chini.",
      "Idadi ya mitiririko ya lengo ni ya kupanga kampeni; taarifa ya msambazaji ndiyo kumbukumbu ya malipo.",
      "Ikiwa kampuni ya muziki inamiliki haki ya rekodi, punguza mgao wa msanii na ulinganishe mchango wa haki za utunzi.",
      "Weka advance na matumizi ya kampeni ili kuona lini fedha zinaanza kumfikia msanii."
    ],
    "nollywood-box-office": [
      "Mradi unaweza kurejesha gharama ikiwa makisio ya watazamaji ni ya kweli.",
      "Bei ya wastani ya tiketi inaweza kubadilisha mauzo huku ikiathiri ukubwa wa hadhira.",
      "Tumia mkataba wa utiririshaji kama nyongeza iliyojadiliwa, si mapato yaliyohakikishwa.",
      "Ondoa gharama za usambazaji na urejeshaji wa mwekezaji kabla ya kutaja faida."
    ],
    "dj-booking-rate": [
      "Tenganisha ada ya kazi, vifaa na safari ili mteja aone kinachobadilisha bei.",
      "Amana ya asilimia 50 inaweza kulinda tarehe ngumu kubadilisha, kwa masharti yaliyoandikwa.",
      "Kwa klabu, malipo madogo ya msingi yanafaa tu ikiwa mgao wa mapato ya mlangoni au faida ya kurudia imeandikwa.",
      "Orodhesha maandalizi na kazi ya mtangazaji kando ili mabadiliko ya wigo yasipunguze ada."
    ],
    "concert-budget": [
      "Ikiwa bajeti ina upungufu, kagua udhamini, ada ya msanii na mapato ya VIP kabla ya kutangaza.",
      "Tumia asilimia halisi ya mahudhurio; kudhani ukumbi utajaa huficha hatari.",
      "Acha akiba ya dharura ionekane kwa mabadiliko ya uzalishaji na tukio la nje.",
      "Pima hali za mahudhurio ya asilimia 50 na 75 kabla ya kuweka amana."
    ],
    "gym-roi-business": [
      "Uchumi wa kupata wateja unaweza kuonekana mzuri, lakini kiwango cha kubaki ndiyo kithibitishe ukuaji.",
      "Idadi ya wanachama ya kutofanya hasara ndiyo kipimo cha kufuatilia kila wiki.",
      "Mkopo wa vifaa unafaa tu ikiwa ukuaji wa wanachama unalipa gharama yake.",
      "Mapato ya mazoezi binafsi na bidhaa yanaonyesha kama biashara ina chanzo cha pili cha faida."
    ],
    "event-ticket-revenue": [
      "Mchanganyiko wa tiketi unapaswa kulipa gharama zote za modeli kabla ya kuitwa wenye faida.",
      "Tiketi za bure hutumia uwezo ambao usingeweza kuuzwa.",
      "Linganisha mapato halisi, si bei ya tiketi pekee, unapokagua ada za mtandaoni.",
      "Jumuisha malipo ya washirika, mawakala wa vyuo au watangazaji wanaouza tiketi."
    ],
    "match-tickets": [
      "Tumia makisio kama kilinganisha kabla ya kununua kwa muuzaji wa pili au getini.",
      "Derby, fainali na mechi za bara zinaweza kuzidi wastani wa ligi.",
      "Usafiri na chakula vinaweza kuwa sehemu kubwa ya gharama ya familia.",
      "Linganisha gharama yote ya siku ya mechi, si bei ya msingi ya tiketi pekee."
    ],
    "sports-scholarship": [
      "Andaa transcripts rasmi na tafsiri zilizothibitishwa inapohitajika.",
      "Tengeneza orodha ya angalau shule 20 kwa kiwango, kozi, nafasi ya kikosi na bajeti.",
      "Tuma barua binafsi kwa kocha ikiwa na video, hali ya transcript, nafasi na mwaka wa kuhitimu.",
      "Alama ya mawasiliano inaweka mchakato wa kutafuta nafasi wazi pamoja na masharti ya masomo."
    ],
    "athlete-earnings": [
      "Muda wa mkataba na malipo yaliyohakikishwa yanaweza kuwa muhimu kuliko mshahara unaotangazwa.",
      "Tenganisha akiba ya jeraha na akiba ya muda mrefu; zinalinda hatari tofauti.",
      "Pima mapato ya udhamini kwa hali ya jeraha au uhamisho kwa sababu yanaweza kushuka haraka.",
      "Gharama ya kuhama na akiba ya kustaafu hulinda kipindi baada ya mkataba."
    ],
    "gaming-pc-build": [
      "Kwa gaming, weka karibu theluthi moja ya bajeti ya tower kwenye GPU kabla ya mapambo.",
      "Kwa vifaa vya kuagiza, linganisha dhamana na hatari ya forodha dhidi ya akiba.",
      "Kwa kituo cha michezo ya kompyuta, tanguliza kifaa cha nguvu, ubaridi na vifaa rahisi kubadilisha.",
      "Modeli hurekebisha bei ya ndani au uagizaji na hukuruhusu kupima vifaa vilivyotumika."
    ],
    "photo-video-pricing": [
      "Andika haki za matumizi kwenye ankara; matumizi binafsi si sawa na kampeni ya kulipiwa.",
      "Amana inalinda tarehe, hasa wikendi na vipindi vyenye mahitaji.",
      "Bajeti ikipunguzwa, punguza kazi za mwisho au wigo wa matumizi kabla ya muda wa kuhariri.",
      "Marekebisho, albamu na gharama za biashara ni mambo ambayo mara nyingi hupunguza faida."
    ]
  };

  var OPTIONAL_FIELDS = {
    "betting-odds": ["opponentOddsValue"],
    "betting-tax": ["actualReceived"],
    "athlete-earnings": ["monthlySalary"]
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }
  function tr(value) {
    var text = String(value == null ? "" : value);
    var atoms = {
      mid:"Kiungo", gk:"Kipa", def:"Beki", fwd:"Mshambuliaji", local:"ya ndani",
      import:"uagizaji", none:"hakuna", yes:"ndiyo", no:"hapana",
      Morocco:"Moroko", Egypt:"Misri", Nigeria:"Nigeria", Kenya:"Kenya",
      Ghana:"Ghana", Tanzania:"Tanzania", Uganda:"Uganda",
      "South Africa":"Afrika Kusini", "Not applied":"Haijatumika"
    };
    if (atoms[text]) return atoms[text];
    if (TEXT[text]) return TEXT[text];
    if (text === "Market implied") return "Uwezekano unaodokezwa na soko";
    if (text === "Your estimate") return "Makisio yako";
    if (text === "Readiness") return "Utayari";
    if (/ title model$/.test(text)) return text.replace(/ title model$/, " — modeli ya ubingwa");
    if (/^Recommended /.test(text)) return text.replace(/^Recommended /, "Pendekezo la ");
    return text
      .replace(/^Potential profit on a (.+) stake\. Total return if it wins: (.+)\.$/, "Faida inayowezekana kwa dau la $1. Jumla ya malipo ikishinda: $2.")
      .replace(/^Planning mode estimates the title path from rating strength plus your form, defensive, and host assumptions\.$/, "Hali ya kupanga inakadiria njia ya ubingwa kwa nguvu ya timu na mawazo yako ya kiwango, ulinzi na mwenyeji.")
      .replace(/^Base points before bench or chip rules\.$/, "Alama za msingi kabla ya sheria za benchi au chip.")
      .replace(/^After modeled (.+) rules\.$/, "Baada ya kanuni za modeli ya $1.")
      .replace(/^Startup payback is about (.+) at this run-rate\.$/, "Uwekezaji wa kuanza unaweza kurejea baada ya takribani $1 kwa kasi hii ya mapato.")
      .replace(/^Two-way market overround$/, "Margin ya soko la pande mbili")
      .replace(/^No-vig probability for your side$/i, "Uwezekano wa upande wako bila margin")
      .replace(/^No-vig fair odds for your side$/i, "Odds halali za upande wako bila margin")
      .replace(/^Nigeria - Lagos licensed online gaming: 5 percent withholding on net winnings for Lagos-licensed platforms\.$/, "Nigeria — kampuni za mtandaoni zenye leseni ya Lagos: zuio la asilimia 5 kwenye ushindi halisi.")
      .replace(/^Enter actual received to audit a slip$/, "Weka kiasi halisi kilichopokelewa ili kukagua slip")
      .replace(/^After distributor fee, master split, and a simple publishing estimate\. Streaming platforms do not pay one universal fixed rate\.$/, "Baada ya ada ya msambazaji, mgao wa master na makisio rahisi ya publishing. Majukwaa ya streaming hayalipi kiwango kimoja cha kudumu.")
      .replace(/^Cinema gross, exhibitor split, distributor fee, streaming, brand tie-ins, production, and marketing combined\.$/, "Mauzo ya sinema pamoja na mgao wa exhibitor, ada ya msambazaji, streaming, chapa, uzalishaji na masoko.")
      .replace(/^FilmOne yearbook references a high-growth West African box office market\. Use current distributor data for release decisions\.$/, "Yearbook ya FilmOne inaeleza ukuaji wa soko la sinema Afrika Magharibi. Tumia data ya sasa ya msambazaji kwa uamuzi wa kuachia filamu.")
      .replace(/^Includes event type, experience level, set length, equipment, crowd size, travel, and peak-day pressure\.$/, "Inajumuisha aina ya tukio, uzoefu, muda wa seti, vifaa, umati, safari na presha ya tarehe yenye mahitaji.")
      .replace(/^Break-even average ticket price is (.+) at (.+) attendance\.$/, "Wastani wa bei ya tiketi ya kutofanya hasara ni $1 kwa mahudhurio ya $2.")
      .replace(/^After platform fees, gateway fees, refunds, marketing, and fixed event costs\.$/, "Baada ya ada za jukwaa na malipo, marejesho, masoko na gharama za kudumu za tukio.")
      .replace(/^(.+) per ticket before channel fees for (.+)\.$/, "$1 kwa tiketi kabla ya ada ya njia ya mauzo nchini $2.")
      .replace(/^Strong fit for (.+)\.$/i, "Anafaa vizuri kwa $1.")
      .replace(/^Across (.+) remaining years after agent fee, tax reserve, and injury reserve\.$/, "Kwa miaka $1 iliyobaki baada ya ada ya wakala na akiba za kodi na jeraha.")
      .replace(/^Uses a (.+) planning range, not a fixed per-stream promise\.$/, "Inatumia safu ya kupanga ya $1, si ahadi ya malipo maalum kwa kila stream.")
      .replace(/^Includes shoot days, editing, crew, equipment, deliverables, travel, rush, and usage rights\.$/, "Inajumuisha siku za kupiga, kuhariri, timu, vifaa, kazi za mwisho, safari, uharaka na haki za matumizi.")
      .replace(/^Effective component power is about (.+) after local\/import uplift\.$/, "Nguvu halisi ya bajeti ya vifaa ni takribani $1 baada ya nyongeza ya bei ya ndani/uagizaji.")
      .replace(/^Includes ticket, channel fee, transport, food, and parking\.$/, "Inajumuisha tiketi, ada ya njia ya mauzo, usafiri, chakula na maegesho.")
      .replace(/^Across (.+) modeled years after agent, tax, injury, relocation, and retirement reserves\.$/, "Kwa miaka $1 ya modeli baada ya ada ya wakala na akiba za kodi, jeraha, kuhama na kustaafu.")
      .replace(/^Based on academic, athletic, evidence, and outreach inputs\.$/, "Kulingana na viingizo vya masomo, michezo, ushahidi na mawasiliano.")
      .replace(/^After platform, gateway, affiliate, refund reserve, marketing, and fixed costs\.$/, "Baada ya ada za jukwaa, gateway, affiliate, akiba ya marejesho, masoko na gharama za kudumu.")
      .replace(/^After monthly operating costs and owner salary\.$/, "Baada ya gharama za uendeshaji za mwezi na mshahara wa mmiliki.")
      .replace(/^At (.+) expected attendance\.$/, "Kwa makisio ya mahudhurio ya $1.")
      .replace(/^Includes performance, setup, equipment, crowd, peak-day, MC, and travel adjustments\.$/, "Inajumuisha marekebisho ya kazi, maandalizi, vifaa, umati, tarehe yenye mahitaji, MC na safari.")
      .replace(/^After production, marketing, distribution, cinema share, streaming, brand, and investor recoup\.$/, "Baada ya uzalishaji, masoko, usambazaji, mgao wa sinema, streaming, chapa na urejeshaji wa mwekezaji.")
      .replace(/^After distributor, master, collaborator, recoupment, and marketing deductions\.$/, "Baada ya ada ya msambazaji, mgao wa master na mshirika, urejeshaji wa advance na masoko.")
      .replace(/\bmodel share\b/gi, "mgao wa modeli").replace(/\bamong 24 teams\b/gi, "kati ya timu 24").replace(/\bchance someone else wins\b/gi, "uwezekano wa timu nyingine kushinda")
      .replace(/\btitle probability\b/gi, "uwezekano wa ubingwa").replace(/\bhigher means less confidence in favorites\b/gi, "juu humaanisha uhakika mdogo kwa timu zinazopendelewa")
      .replace(/\bbefore multiplier\b/gi, "kabla ya kizidishi").replace(/\bpoints per million\b/gi, "alama kwa milioni").replace(/\bclean-sheet eligible\b/gi, "anastahili alama za clean sheet").replace(/\blimited minutes\b/gi, "dakika chache")
      .replace(/\busing ([\d.,]+)% start probability\b/gi, "kwa uwezekano wa kuanza wa $1%").replace(/\bpts\b/gi, "alama")
      .replace(/\bper bet at your estimate\b/gi, "kwa dau kwa makisio yako").replace(/\bestimate minus market\b/gi, "makisio ukiondoa soko").replace(/\bbreak-even probability\b/gi, "uwezekano wa break-even")
      .replace(/\bof gross payout\b/gi, "ya malipo yote")
      .replace(/\bafter this period\b/gi, "baada ya kipindi hiki")
      .replace(/\bfor (USD [\d,.]+) net\b/gi, "kwa mapato halisi ya $1")
      .replace(/\bafter cinema\/distributor split\b/gi, "baada ya mgao wa sinema na msambazaji")
      .replace(/\brecommended booking hold\b/gi, "amana inayopendekezwa ya kuhifadhi nafasi")
      .replace(/\bover base\b/gi, "zaidi ya kiwango cha msingi")
      .replace(/\bgear and setup\b/gi, "vifaa na maandalizi")
      .replace(/\bincluding fees and contingency\b/gi, "pamoja na ada na akiba ya dharura")
      .replace(/\bsalary plus endorsements\b/gi, "mshahara pamoja na udhamini")
      .replace(/\bof net\b/gi, "ya mapato halisi")
      .replace(/\bof post-reserve gross\b/gi, "ya mapato baada ya akiba")
      .replace(/\bmonthly\b/gi, "kwa mwezi")
      .replace(/\bbefore splits\b/gi, "kabla ya migao")
      .replace(/\bactive paying members\b/gi, "wanachama wanaolipa")
      .replace(/\bretention economics\b/gi, "uchumi wa kuhifadhi wanachama")
      .replace(/\bmember loss assumption\b/gi, "wazo la wanachama wanaoondoka")
      .replace(/\bof revenue\b/gi, "ya mapato")
      .replace(/\bmodeled\b/gi, "ya modeli")
      .replace(/\b([\d,.]+) streams, est\. (.+)$/gi, "$1 mitiririko, makisio $2")
      .replace(/\b([\d.,]+) percent upfront\b/gi, "$1% kama amana")
      .replace(/\bday\(s\)\b/gi, "siku")
      .replace(/\blegs at avg\b/gi, "mechi kwa wastani wa").replace(/\bimplied chance\b/gi, "uwezekano unaodokezwa").replace(/\bno-vig\b/gi, "bila margin")
      .replace(/\bper month\b/gi, "kwa mwezi").replace(/\bper year\b/gi, "kwa mwaka").replace(/\bper member\b/gi, "kwa mwanachama").replace(/\bper ticket\b/gi, "kwa tiketi")
      .replace(/\bFPS at\b/gi, "FPS kwa").replace(/\bdo not underspec\b/gi, "usichague uwezo mdogo").replace(/\bbronze baseline\b/gi, "msingi wa bronze")
      .replace(/\btower only\b/gi, "kompyuta pekee").replace(/\bperipherals reserved\b/gi, "bajeti ya vifaa imetengwa").replace(/\bused mix\b/gi, "mchanganyiko wa vilivyotumika")
      .replace(/\byes\b/gi, "ndiyo").replace(/\bno\b/gi, "hapana").replace(/\bnone\b/gi, "hakuna")
      .replace(/\bstrong\b/gi, "imara").replace(/\bworkable\b/gi, "inawezekana").replace(/\bneeds work\b/gi, "inahitaji kazi")
      .replace(/\bmonths\b/gi, "miezi").replace(/\bmonth\b/gi, "mwezi").replace(/\byears\b/gi, "miaka").replace(/\byear\b/gi, "mwaka")
      .replace(/\bdays\b/gi, "siku").replace(/\bday\b/gi, "siku").replace(/\bhours\b/gi, "saa").replace(/\bhour\b/gi, "saa")
      .replace(/\bplayer\b/gi, "mchezaji").replace(/\bmembers\b/gi, "wanachama").replace(/\bmember\b/gi, "mwanachama")
      .replace(/\bpersonal\b/gi, "binafsi").replace(/\bbroadcast\b/gi, "matangazo").replace(/\bcampaign\b/gi, "kampeni")
      .replace(/\bentry esports\b/gi, "esports ya kuanzia").replace(/\b1080p balanced\b/gi, "1080p iliyosawazika").replace(/\b1440p value\b/gi, "1440p yenye thamani").replace(/\b4K enthusiast\b/gi, "4K ya kiwango cha juu")
      .replace(/\bprofit\b/gi, "faida").replace(/\brevenue\b/gi, "mapato")
      .replace(/\bcosts?\b/gi, "gharama").replace(/\bmonths?\b/gi, "miezi")
      .replace(/\byears?\b/gi, "miaka").replace(/\bper match\b/gi, "kwa mechi")
      .replace(/\bplanning\b/gi, "kupanga").replace(/\bestimate\b/gi, "makisio");
  }
  function optionLabel(option) { return OPTIONS[option.label] || tr(option.label); }
  function isOptional(fieldId) {
    return (OPTIONAL_FIELDS[page.toolId] || []).indexOf(fieldId) !== -1;
  }
  function fieldHtml(field) {
    if (field.type === "heading") return '<h3 class="sw-field-heading">' + esc(tr(field.label)) + "</h3>";
    var label = FIELD[field.id] || tr(field.label || field.id);
    var html = '<label for="sw-sport-' + esc(field.id) + '">' + esc(label);
    if (field.type === "select") {
      html += '<select id="sw-sport-' + esc(field.id) + '" name="' + esc(field.id) + '" required>';
      (field.options || []).forEach(function (option) {
        html += '<option value="' + esc(option.value) + '"' + (String(option.value) === String(field.value) ? " selected" : "") + ">" + esc(optionLabel(option)) + "</option>";
      });
      html += "</select>";
    } else {
      html += '<input id="sw-sport-' + esc(field.id) + '" name="' + esc(field.id) + '" type="' + esc(field.type || "text") + '" value="' + esc(field.value) + '" ' + (field.type === "number" ? 'inputmode="decimal" min="0" step="any" ' : "") + (isOptional(field.id) ? "" : "required") + ">";
    }
    return html + "</label>";
  }
  function inputs() {
    var data = {};
    tool.fields.forEach(function (field) {
      if (field.type !== "heading") data[field.id] = form.elements[field.id] ? form.elements[field.id].value : field.value;
    });
    return data;
  }
  function validate(data) {
    form.querySelectorAll("[aria-invalid]").forEach(function (field) { field.removeAttribute("aria-invalid"); });
    function invalid(fieldId, message) {
      var field = form.elements[fieldId];
      if (field) {
        field.setAttribute("aria-invalid", "true");
        field.focus();
      }
      throw new Error(message);
    }
    tool.fields.forEach(function (field) {
      if (field.type === "heading") return;
      var value = data[field.id];
      if (isOptional(field.id) && String(value == null ? "" : value).trim() === "") return;
      if (value == null || String(value).trim() === "") invalid(field.id, "Jaza sehemu ya “" + (FIELD[field.id] || field.label) + "”.");
      if (field.type === "number" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        invalid(field.id, "Weka namba halali kwenye “" + (FIELD[field.id] || field.label) + "”.");
      }
    });
    var positiveByTool = {
      "betting-odds": ["stake"],
      "betting-tax": ["grossPayout"],
      "nollywood-box-office": ["admissions", "avgTicket"],
      "dj-booking-rate": ["hours"],
      "concert-budget": ["capacity", "regularTicket"],
      "gym-roi-business": ["members", "monthlyFee"],
      "event-ticket-revenue": ["regularPrice"],
      "match-tickets": ["quantity"],
      "sports-scholarship": ["age"],
      "athlete-earnings": ["yearsRemaining"],
      "gaming-pc-build": ["budget"]
    };
    (positiveByTool[page.toolId] || []).forEach(function (fieldId) {
      if (Number(data[fieldId]) <= 0) invalid(fieldId, "Thamani hii lazima iwe zaidi ya sifuri.");
    });
    [
      "estimatedProbability", "startProbability", "depositTaxPct", "whtPct", "distributorFee",
      "artistMasterShare", "songwriterShare", "collaboratorShare", "cinemaShare", "investorRecoupPct",
      "attendance", "vipShare", "ticketingFee", "contingency", "monthlyChurn", "platformFee",
      "gatewayFee", "refundRate", "responseRate", "annualGrowth", "agentFee", "taxReserve",
      "injuryReserve", "retirementContribution", "savingsRate", "overheadPct"
    ].forEach(function (fieldId) {
      if (Object.prototype.hasOwnProperty.call(data, fieldId) && Number(data[fieldId]) > 100) {
        invalid(fieldId, "Asilimia lazima iwe kati ya 0 na 100.");
      }
    });
    if (page.toolId === "betting-odds" && data.oddsFormat === "decimal" && Number(data.oddsValue) <= 1) {
      invalid("oddsValue", "Odds za desimali lazima ziwe zaidi ya 1.00.");
    }
    if (page.toolId === "afcon-predictor") {
      ["formBoost", "defenseBoost", "hostBoost", "upsetTolerance"].forEach(function (fieldId) {
        if (Number(data[fieldId]) > 10) invalid(fieldId, "Kipimo hiki lazima kiwe kati ya 0 na 10.");
      });
    }
    if (page.toolId === "fantasy-football") {
      if (Number(data.minutes) > 130) invalid("minutes", "Dakika lazima ziwe kati ya 0 na 130.");
      if (Number(data.fixtureDifficulty) < 1 || Number(data.fixtureDifficulty) > 5) {
        invalid("fixtureDifficulty", "Ugumu wa mechi lazima uwe kati ya 1 na 5.");
      }
    }
    if (page.toolId === "streaming-royalties") {
      var totalStreams = ["spotifyStreams", "appleStreams", "boomplayStreams", "audiomackStreams", "youtubeStreams", "deezerStreams", "tidalStreams"]
        .reduce(function (sum, fieldId) { return sum + Number(data[fieldId] || 0); }, 0);
      if (totalStreams <= 0) invalid("spotifyStreams", "Weka angalau stream moja kwenye jukwaa moja.");
    }
    if (page.toolId === "event-ticket-revenue") {
      var paidTickets = ["vipTickets", "regularTickets", "studentTickets", "earlyBirdTickets"]
        .reduce(function (sum, fieldId) { return sum + Number(data[fieldId] || 0); }, 0);
      if (paidTickets <= 0) invalid("vipTickets", "Weka angalau tiketi moja inayolipiwa.");
    }
    if (page.toolId === "sports-scholarship" && Number(data.gpa) > 4) {
      invalid("gpa", "GPA lazima iwe kati ya 0 na 4.0.");
    }
    if (page.toolId === "photo-video-pricing" && Number(data.shootDays) + Number(data.editDays) <= 0) {
      invalid("shootDays", "Weka angalau siku moja ya kupiga au kuhariri.");
    }
  }
  function assertFiniteResult(result) {
    function visit(value) {
      if (typeof value === "number" && !Number.isFinite(value)) {
        throw new Error("Modeli imetoa thamani isiyo namba; kagua viingizo.");
      }
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") Object.keys(value).forEach(function (key) { visit(value[key]); });
    }
    if (!result || typeof result !== "object") throw new Error("Modeli haikutoa matokeo kamili.");
    visit(result);
  }
  function sourceStateLabel(state) {
    return {
      "archived-snapshot": "Snapshot ya kumbukumbu",
      "static-formula": "Fomula tuli",
      "static-reference": "Rejea tuli",
      "static-scenario": "Hali tuli ya kupanga"
    }[state] || "Hali tuli";
  }
  function reviewAge(reviewedAt) {
    var reviewed = new Date(String(reviewedAt || "") + "T00:00:00Z");
    if (!Number.isFinite(reviewed.getTime())) return "tarehe si halali";
    var today = new Date();
    var todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    var days = Math.floor((todayUtc - reviewed.getTime()) / 86400000);
    if (days < 0) return "tarehe iko mbele; usasishaji haujathibitishwa";
    return days + " siku";
  }
  function insightsFor(result) {
    var engineInsights = Array.isArray(result.insights) ? result.insights : [];
    var translated = INSIGHTS[page.toolId] || [];
    return engineInsights.map(function (insight, index) {
      return translated[index] || tr(insight);
    });
  }
  function inputDisplay(field, value) {
    if (field.type === "select") {
      var selected = (field.options || []).find(function (option) {
        return String(option.value) === String(value);
      });
      if (selected) return optionLabel(selected);
    }
    return tr(value);
  }
  function localizedResult(result) {
    return {
      heroLabel: tr(result.heroLabel),
      heroValue: tr(result.heroValue),
      heroSub: tr(result.heroSub),
      metrics: (result.metrics || []).map(function (item) {
        return { label: tr(item.label), value: tr(item.value), unit: tr(item.unit || "") };
      }),
      rows: (result.rows || []).map(function (item) { return [tr(item[0]), tr(item[1])]; }),
      bars: (result.bars || []).map(function (item) {
        return { label: tr(item.label), value: item.value, text: tr(item.text || "") };
      }),
      insights: insightsFor(result)
    };
  }
  function reportText(input, result) {
    var lines = [page.name, "", tr(result.heroLabel) + ": " + tr(result.heroValue), tr(result.heroSub), "", "Vipimo"];
    (result.metrics || []).forEach(function (item) { lines.push("- " + tr(item.label) + ": " + tr(item.value) + (item.unit ? " (" + tr(item.unit) + ")" : "")); });
    lines.push("", "Maelezo");
    (result.rows || []).forEach(function (item) { lines.push("- " + tr(item[0]) + ": " + tr(item[1])); });
    if (result.bars && result.bars.length) {
      lines.push("", "Milinganisho");
      result.bars.forEach(function (item) { lines.push("- " + tr(item.label) + ": " + tr(item.text)); });
    }
    lines.push("", "Mambo ya kuzingatia");
    insightsFor(result).forEach(function (item) { lines.push("- " + item); });
    lines.push("", "Viingizo");
    tool.fields.forEach(function (field) {
      if (field.type !== "heading") {
        lines.push("- " + (FIELD[field.id] || tr(field.label)) + ": " + inputDisplay(field, input[field.id]));
      }
    });
    if (page.sourceReview) {
      lines.push("", "Chanzo na usasishaji");
      lines.push("- Data ya moja kwa moja: hapana (live=false)");
      lines.push("- Hali: " + sourceStateLabel(page.sourceReview.state));
      lines.push("- Imehakikiwa: " + page.sourceReview.reviewedAt);
      lines.push("- Umri wa ukaguzi: " + reviewAge(page.sourceReview.reviewedAt));
      lines.push("- Inawakilisha: " + page.sourceReview.asOf);
      lines.push("- Uhakika: " + page.sourceReview.confidence.grade + " — " + page.sourceReview.confidence.label);
      lines.push("- Sababu: " + page.sourceReview.confidence.rationale);
      lines.push("- Kagua upya: " + page.sourceReview.cadence);
      lines.push("", "Mawazo na mipaka");
      (page.sourceReview.assumptions || []).forEach(function (item) { lines.push("- " + item); });
      if (page.sourceReview.mutableBaselines && page.sourceReview.mutableBaselines.length) {
        lines.push("", "Viwango vinavyoweza kubadilika: " + page.sourceReview.mutableBaselines.join("; "));
      }
      if (page.sourceReview.sources && page.sourceReview.sources.length) {
        lines.push("", "Rejea");
        page.sourceReview.sources.forEach(function (item) {
          lines.push("- " + item.title + " — " + item.url);
          if (item.note) lines.push("  Maelezo: " + item.note);
        });
      } else {
        lines.push("", "Hali ya chanzo: " + page.sourceReview.sourceRationale);
      }
    }
    lines.push("", "Faragha: hesabu na export zimefanyika kwenye kivinjari hiki; hakuna data iliyotumwa.");
    return lines.join("\n");
  }
  function render(input, result) {
    var html = '<div class="sw-result"><p class="sw-kicker">' + esc(tr(result.heroLabel)) + '</p><h2>' + esc(tr(result.heroValue)) + '</h2><p>' + esc(tr(result.heroSub)) + "</p>";
    if (result.metrics && result.metrics.length) {
      html += '<div class="sw-metrics">';
      result.metrics.forEach(function (item) { html += '<div class="sw-metric"><span>' + esc(tr(item.label)) + '</span><strong>' + esc(tr(item.value)) + '</strong><small>' + esc(tr(item.unit || "")) + "</small></div>"; });
      html += "</div>";
    }
    if (result.rows && result.rows.length) {
      html += '<div class="sw-table-wrap"><table class="sw-table"><thead><tr><th>Kipengele</th><th>Thamani</th></tr></thead><tbody>';
      result.rows.forEach(function (item) { html += "<tr><td>" + esc(tr(item[0])) + "</td><td>" + esc(tr(item[1])) + "</td></tr>"; });
      html += "</tbody></table></div>";
    }
    if (result.bars && result.bars.length) {
      html += '<section class="sw-bars" aria-labelledby="sw-bars-title"><h3 id="sw-bars-title">Milinganisho ya modeli</h3>';
      result.bars.forEach(function (item) {
        var width = Math.max(0, Math.min(100, Number(item.value) || 0));
        html += '<div class="sw-bar"><div><span>' + esc(tr(item.label)) + '</span><strong>' + esc(tr(item.text)) + '</strong></div><div class="sw-bar-track" aria-hidden="true"><span style="width:' + width + '%"></span></div></div>';
      });
      html += "</section>";
    }
    html += '<section class="sw-insights" aria-labelledby="sw-insights-title"><h3 id="sw-insights-title">Mambo ya kuzingatia</h3><ul>';
    insightsFor(result).forEach(function (item) { html += "<li>" + esc(item) + "</li>"; });
    html += "</ul></section>";
    if (page.sourceReview) {
      html += '<section class="sw-result-source" aria-labelledby="sw-result-source-title"><h3 id="sw-result-source-title">Vyanzo, usasishaji na uhakika</h3>' +
        "<p><strong>Data ya moja kwa moja:</strong> Hapana (live=false)</p>" +
        "<p><strong>Hali:</strong> " + esc(sourceStateLabel(page.sourceReview.state)) + "</p>" +
        "<p><strong>Imehakikiwa:</strong> " + esc(page.sourceReview.reviewedAt) + " · umri wa ukaguzi: " + esc(reviewAge(page.sourceReview.reviewedAt)) + "</p>" +
        "<p><strong>Inawakilisha:</strong> " + esc(page.sourceReview.asOf) + "</p>" +
        "<p><strong>Uhakika:</strong> " + esc(page.sourceReview.confidence.grade + " — " + page.sourceReview.confidence.label) + "</p>" +
        "<p>" + esc(page.sourceReview.confidence.rationale) + "</p>" +
        "<p><strong>Kagua upya:</strong> " + esc(page.sourceReview.cadence) + "</p>" +
        "<h4>Mawazo na mipaka</h4><ul>" + (page.sourceReview.assumptions || []).map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") + "</ul>" +
        (page.sourceReview.mutableBaselines && page.sourceReview.mutableBaselines.length ? "<p><strong>Viwango vinavyoweza kubadilika:</strong> " + esc(page.sourceReview.mutableBaselines.join("; ")) + ".</p>" : "") +
        (page.sourceReview.sources && page.sourceReview.sources.length
          ? "<h4>Rejea</h4><ul>" + page.sourceReview.sources.map(function (item) { return '<li><a href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' + esc(item.title) + "</a>" + (item.note ? "<span>" + esc(item.note) + "</span>" : "") + "</li>"; }).join("") + "</ul>"
          : "<p>" + esc(page.sourceReview.sourceRationale) + "</p>") +
        "</section>";
    }
    html += '<div class="sw-actions"><button type="button" data-sw-copy>Nakili</button><button type="button" data-sw-print>Chapisha kupitia kivinjari</button><button type="button" data-sw-json>Pakua JSON</button><button type="button" class="secondary" data-sw-import-trigger aria-controls="sw-sport-import">Fungua JSON</button><input id="sw-sport-import" type="file" accept="application/json,.json" data-sw-import hidden></div><p data-sw-status aria-live="polite"></p><pre tabindex="0">' + esc(reportText(input, result)) + "</pre></div>";
    resultRoot.innerHTML = html;
  }
  function download(payload) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
    var url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = page.swSlug + "-scenario.json"; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  mount.innerHTML = '<form class="sw-sports-form" novalidate><div class="sw-sports-fields">' + tool.fields.map(fieldHtml).join("") + '</div><div class="sw-actions"><button type="submit">Kokotoa</button><button type="button" class="secondary" data-sw-sport-reset>Futa</button></div><p class="sw-error" data-sw-sport-error role="alert"></p></form><section data-sw-sport-result aria-live="polite"></section>';
  var form = mount.querySelector("form");
  var error = mount.querySelector("[data-sw-sport-error]");
  var resultRoot = mount.querySelector("[data-sw-sport-result]");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var input = inputs(); validate(input);
      var result = engine.calculate(page.toolId, input);
      if (!result || !Array.isArray(result.metrics) || !Array.isArray(result.rows)) throw new Error("Modeli haikutoa matokeo kamili.");
      assertFiniteResult(result);
      last = { input:input, result:result };
      error.textContent = ""; render(input, result);
    } catch (problem) {
      last = null; resultRoot.innerHTML = ""; error.textContent = problem.message || "Kagua viingizo.";
    }
  });
  function clearStaleResult() {
    error.textContent = "";
    last = null;
    resultRoot.innerHTML = "";
  }
  form.addEventListener("input", clearStaleResult);
  form.addEventListener("change", clearStaleResult);
  mount.querySelector("[data-sw-sport-reset]").addEventListener("click", function () {
    tool.fields.forEach(function (field) { if (field.type !== "heading" && form.elements[field.id]) form.elements[field.id].value = field.value; });
    last = null; resultRoot.innerHTML = ""; error.textContent = "";
    var first = form.querySelector("input,select"); if (first) first.focus();
  });
  resultRoot.addEventListener("click", function (event) {
    if (!last) return;
    var status = resultRoot.querySelector("[data-sw-status]");
    if (event.target.closest("[data-sw-import-trigger]")) {
      var importControl = resultRoot.querySelector("[data-sw-import]");
      if (importControl) importControl.click();
      return;
    }
    if (event.target.closest("[data-sw-print]")) { window.print(); return; }
    if (event.target.closest("[data-sw-copy]")) {
      var text = reportText(last.input, last.result);
      var operation = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject();
      operation.then(function () { status.textContent = "Ripoti imenakiliwa."; }).catch(function () { status.textContent = "Chagua ripoti na unakili mwenyewe."; });
    }
    if (event.target.closest("[data-sw-json]")) {
      download({ schemaVersion:1, locale:"sw", toolId:page.toolId, fields:last.input, result:localizedResult(last.result), sourceReview:page.sourceReview, privacy:"local-export", exportedAt:new Date().toISOString() });
      status.textContent = "JSON imeundwa kwenye kifaa hiki.";
    }
  });
  resultRoot.addEventListener("change", function (event) {
    if (!event.target.matches("[data-sw-import]")) return;
    var file = event.target.files && event.target.files[0], status = resultRoot.querySelector("[data-sw-status]");
    if (!file) return;
    file.text().then(function (text) {
      var payload = JSON.parse(text);
      if (payload.schemaVersion !== 1 || payload.locale !== "sw" || payload.toolId !== page.toolId || !payload.fields) throw new Error("Faili si ya programu hii.");
      Object.keys(payload.fields).forEach(function (id) { if (form.elements[id]) form.elements[id].value = payload.fields[id]; });
      form.dispatchEvent(new Event("submit", { bubbles:true, cancelable:true }));
      resultRoot.querySelector("[data-sw-status]").textContent = "Scenario imefunguliwa kutoka JSON ya kifaa.";
    }).catch(function (problem) {
      if (status) status.textContent = problem.message || "JSON si halali.";
    }).finally(function () {
      event.target.value = "";
    });
  });

  var consent = document.querySelector("[data-ai-consent]");
  var aiButton = document.querySelector("[data-ai-prompt]");
  var aiOutput = document.querySelector("[data-ai-output]");
  consent.addEventListener("change", function () { aiButton.disabled = !consent.checked; if (!consent.checked) aiOutput.textContent = ""; });
  aiButton.addEventListener("click", function () {
    if (!consent.checked) return;
    aiOutput.textContent = "Swali limeandaliwa kwenye kifaa; halijatumwa:\n“Nisaidie kuhakiki mawazo ya " + page.name + " bila kubuni bei, kanuni, matokeo, nafasi au ushauri. Onyesha vyanzo vya sasa vya kuangalia.”";
  });
  var themeButton = document.querySelector("[data-theme-toggle]");
  if (themeButton) themeButton.addEventListener("click", function () {
    if (window.AfroTools && window.AfroTools.darkMode) window.AfroTools.darkMode.toggle();
  });
})(window, document);
