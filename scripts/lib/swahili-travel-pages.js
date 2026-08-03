"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

const OWNER_CONTRACTS = Object.freeze({
  "africa-flight": {
    action: "calcFlightPrice",
    resultId: "flightResults",
    invalid: { select: "flightCountry" },
    planningNote: "Safu hii ni kumbukumbu tuli kutoka programu ya Kiingereza. Thibitisha nauli, ratiba, mizigo na nafasi moja kwa moja kwa shirika la ndege kabla ya kulipa.",
    source: {
      state: "Kumbukumbu tuli ya njia na bei",
      confidence: "C — inafaa kulinganisha hali; si nauli au ratiba ya sasa",
      cadence: "Kabla ya kila utafutaji au ununuzi",
      links: []
    }
  },
  "airbnb-vs-hotel": {
    action: "calcCompare",
    resultId: "results",
    invalid: { numbers: ["groupSize", "nights"] },
    planningNote: "Linganisha jumla na masharti ya sasa ya malazi. Usalama, upatikanaji, kodi na sera ya kufuta lazima zithibitishwe kwenye nukuu halisi.",
    source: {
      state: "Viwango vya miji vilivyohifadhiwa kwenye programu ya Kiingereza",
      confidence: "C — inafaa kwa ulinganisho wa hali; si bei au nafasi ya sasa",
      cadence: "Kabla ya kila nafasi ya malazi",
      links: []
    }
  },
  "airport-transfer": {
    action: "calcTransfer",
    resultId: "results",
    invalid: { numbers: ["groupSize"], select: "airport" },
    planningNote: "Tumia jedwali hili kulinganisha chaguo, kisha thibitisha bei, eneo la kuchukuliwa, leseni, usalama na muda kwa mtoa huduma wa sasa.",
    source: {
      state: "Viwango tuli vya viwanja na maeneo",
      confidence: "C — inafaa kupanga; si bei, usalama au upatikanaji wa sasa",
      cadence: "Kabla ya kila safari ya uwanja wa ndege",
      links: []
    }
  },
  "beach-holiday-budget": {
    action: "calcBeach",
    resultId: "results",
    invalid: { numbers: ["nights", "groupSize"] },
    planningNote: "Badilisha viwango vya kumbukumbu kwa nukuu zako za sasa. Hali ya hewa, usalama, masharti ya kuingia na nafasi havijathibitishwa na programu.",
    source: {
      state: "Viwango tuli vya malazi, chakula, shughuli na usafiri",
      confidence: "C — inafaa kutengeneza bajeti; si nukuu ya sasa",
      cadence: "Kabla ya kuweka nafasi au kulipa",
      links: []
    }
  },
  "festival-travel-budget": {
    action: "calcFestival",
    resultId: "results",
    invalid: { numbers: ["days", "grp"] },
    planningNote: "Thibitisha kwanza kuwa tukio, tarehe na njia rasmi ya tiketi bado ni halali. Jedwali ni bajeti ya hali, si uthibitisho wa tukio au kiingilio.",
    source: {
      state: "Kumbukumbu tuli za matukio na gharama",
      confidence: "C — inafaa kupanga bajeti; si uthibitisho wa tukio",
      cadence: "Baada ya tangazo rasmi na kabla ya kila malipo",
      links: []
    }
  },
  "hotel-star-guide": {
    action: "calcHotel",
    resultId: "results",
    invalid: { numbers: ["nights"], select: "city" },
    planningNote: "Nyota na viwango ni kumbukumbu za kulinganisha. Thibitisha daraja, kodi, ada, huduma, eneo na sera ya kufuta kwenye nukuu ya hoteli.",
    source: {
      state: "Viwango tuli vya hoteli kwa mji na nyota",
      confidence: "C — inafaa kulinganisha; si bei au daraja la sasa",
      cadence: "Kabla ya kila nafasi ya hoteli",
      links: []
    }
  },
  "safari-cost": {
    action: "calcSafari",
    resultId: "results",
    invalid: { numbers: ["duration", "groupSize"], select: "safariCountry" },
    planningNote: "Ada za hifadhi, vibali, usafiri na nafasi hubadilika. Thibitisha kwa mamlaka ya hifadhi na operator aliyeidhinishwa kabla ya kulipa.",
    source: {
      state: "Viwango tuli vya safari na misimu",
      confidence: "C — inafaa kwa hali ya bajeti; si ada, kibali au nafasi ya sasa",
      cadence: "Kabla ya kila nukuu au malipo",
      links: [
        ["Kenya Wildlife Service", "https://www.kws.go.ke/"],
        ["Tanzania National Parks", "https://www.tanzaniaparks.go.tz/tourism/visitor-information/tariff"],
        ["Uganda Wildlife Authority", "https://ugandawildlife.org/uwa-rates/"]
      ]
    }
  },
  "travel-packing-list": {
    action: "generateList",
    resultId: "results",
    invalid: { numbers: ["duration"] },
    planningNote: "Orodha inatokana na checklist ya programu ya Kiingereza. Hakiki nyaraka, afya, hali ya hewa na sheria za mzigo kando kabla ya kusafiri.",
    source: {
      state: "Checklist tuli inayochujwa kwa aina ya safari na hali ya hewa",
      confidence: "B — inafaa kuandaa mizigo; si uthibitisho wa afya, mpaka au shirika la ndege",
      cadence: "Kabla ya kila safari na baada ya kukagua sheria za mtoa huduma",
      links: [["IATA Travel Centre", "https://www.iata.org/en/travel-centre/"]]
    }
  },
  "travel-vaccination-cost": {
    action: "calcVacc",
    resultId: "results",
    invalid: { numbers: ["tripDays", "travellers"] },
    safetyMode: "deterministic-cost-schedule",
    planningNote: "Makisio ya gharama na ratiba yanatokana na jedwali tuli la programu ya Kiingereza. Hayapendekezi chanjo, dawa, cheti wala ruhusa ya kuingia; mtaalamu wa afya na mamlaka rasmi lazima wakague njia na hali yako binafsi.",
    source: {
      state: "Jedwali tuli la gharama na ratiba kutoka kwa programu ya Kiingereza",
      confidence: "C — inafaa kupanga bajeti na miadi tu; si ushauri wa afya wala sharti la kuingia",
      cadence: "Thibitisha gharama, ratiba na masharti kwa mtaalamu na mamlaka kabla ya kila safari",
      links: [
        ["WHO — ushauri wa chanjo za safari", "https://www.who.int/travel-advice/vaccines"],
        ["IATA Travel Centre", "https://www.iata.org/en/travel-centre/"]
      ]
    }
  }
});

const COPY = Object.freeze({
  "Route & Travel Details": "Maelezo ya njia na safari",
  "Country": "Nchi",
  "South Africa": "Afrika Kusini",
  "Ethiopia": "Ethiopia",
  "Egypt": "Misri",
  "Morocco": "Moroko",
  "Route": "Njia",
  "Flight Route": "Njia ya ndege",
  "Flight Class": "Daraja la ndege",
  "Flight Booking": "Muda wa kuweka nafasi ya ndege",
  "Cabin Class": "Daraja la ndege",
  "Economy": "Daraja la kawaida",
  "Business Class": "Daraja la biashara",
  "Booking Window": "Muda wa kuweka nafasi",
  "3+ weeks ahead": "Wiki 3 au zaidi mapema",
  "1-2 weeks ahead": "Wiki 1–2 mapema",
  "Last minute (≤3 days)": "Dakika za mwisho (siku 3 au chini)",
  "Show Planning Range": "Onyesha safu ya kupanga",
  "Static Planning Range (Economy)": "Safu tuli ya kupanga (daraja la kawaida)",
  "Replace with a current carrier quote": "Badilisha kwa nukuu ya sasa ya shirika la ndege",
  "Best time to book": "Muda bora wa kuweka nafasi",
  "Last minute premium": "Nyongeza ya dakika za mwisho",
  "Typically Cheapest": "Kwa kawaida nafuu zaidi",
  "Distance": "Umbali",
  "Flight Time": "Muda wa ndege",
  "Minimum Fare": "Nauli ya chini",
  "Options": "Chaguo",
  "Your Stay Details": "Maelezo ya malazi yako",
  "City": "Mji",
  "Purpose": "Sababu ya safari",
  "Leisure / Holiday": "Mapumziko au likizo",
  "Business Travel": "Safari ya biashara",
  "Family Trip": "Safari ya familia",
  "Group Size": "Idadi ya watu",
  "GroupSize": "Idadi ya watu",
  "Grp": "Idadi ya watu",
  "Nights": "Usiku",
  "nights)": "usiku)",
  "Days": "Siku",
  "Duration": "Muda",
  "Level": "Kiwango",
  "Cooking": "Mpango wa kupika",
  "Departure": "Eneo la kuondoka",
  "Baggage": "Kanuni ya mzigo",
  "Dest Area": "Eneo la kwenda",
  "Dest Country": "Nchi ya kwenda",
  "TripDays": "Siku za safari",
  "Travellers": "Wasafiri",
  "Duration (Nights)": "Muda (usiku)",
  "Accommodation Level": "Kiwango cha malazi",
  "Budget": "Bajeti",
  "Mid-Range": "Kiwango cha kati",
  "Premium": "Kiwango cha juu",
  "Will you cook? (Airbnb)": "Utapika? (Airbnb)",
  "Yes, often (saves a lot)": "Ndiyo, mara nyingi (huokoa zaidi)",
  "Sometimes": "Wakati mwingine",
  "No, always eating out": "Hapana, tutakula nje kila wakati",
  "Compare Airbnb vs Hotel →": "Linganisha Airbnb na hoteli →",
  "Recommended Option": "Chaguo linalopendekezwa",
  "You save $X over 7 nights": "Akiba yako itaonekana hapa",
  "Savings": "Akiba",
  "Detailed Cost Comparison": "Ulinganisho wa kina wa gharama",
  "Category": "Kipengele",
  "Hotel": "Hoteli",
  "Difference": "Tofauti",
  "City Tips & Recommendations": "Mambo ya kuthibitisha kwa mji",
  "Airbnb Total": "Jumla ya Airbnb",
  "Food Saving (cooking)": "Akiba ya chakula (kupika)",
  "Airbnb Net Cost": "Gharama halisi ya Airbnb",
  "Hotel Total": "Jumla ya hoteli",
  "Accommodation": "Malazi",
  "Food (cooking savings)": "Chakula (akiba ya kupika)",
  "Long-Stay Discount": "Punguzo la kukaa muda mrefu",
  "Loyalty points only": "Alama za uaminifu pekee",
  "Transfer Details": "Maelezo ya usafiri",
  "Airport": "Uwanja wa ndege",
  "Destination Area": "Eneo la kwenda",
  "Group Size (passengers)": "Idadi ya abiria",
  "Compare Transfer Options →": "Linganisha njia za usafiri →",
  "Best Value Option": "Chaguo lenye thamani bora",
  "Estimated cost shown below": "Makisio ya gharama yanaonekana hapa chini",
  "Journey Time": "Muda wa safari",
  "Transfer Options Comparison": "Ulinganisho wa njia za usafiri",
  "Transfer Type": "Aina ya usafiri",
  "Cost (Per Trip)": "Gharama kwa safari",
  "Per Person": "Kwa mtu",
  "Safety": "Usalama",
  "Notes": "Maelezo",
  "Booking Tips": "Mambo ya kuthibitisha kabla ya kuweka nafasi",
  "Metered / Yellow Taxi": "Teksi yenye mita au ya njano",
  "Uber / Bolt / Ride App": "Uber, Bolt au programu ya usafiri",
  "Airport Shuttle / Bus": "Shuttle au basi la uwanja",
  "Private Car / Transfer": "Gari binafsi au transfer",
  "Per person, shared": "Kwa mtu, safari ya pamoja",
  "passengers": "abiria",
  "Estimated:": "Makisio:",
  "for your group": "kwa kundi lako",
  "Your Beach Holiday Details": "Maelezo ya likizo yako ya ufukweni",
  "Beach Destination": "Mahali pa ufukweni",
  "Hostel / Backpacker": "Hosteli au backpacker",
  "Guesthouse / B&B": "Nyumba ya wageni au B&B",
  "3-Star Hotel": "Hoteli ya nyota 3",
  "4-Star Hotel": "Hoteli ya nyota 4",
  "5-Star / Resort": "Nyota 5 au resort",
  "Departure Country": "Nchi ya kuondoka",
  "Europe / UK": "Ulaya au Uingereza",
  "USA / Canada": "Marekani au Kanada",
  "Calculate Beach Budget →": "Kokotoa bajeti ya ufukweni →",
  "Total Holiday Budget (USD)": "Jumla ya bajeti ya likizo (USD)",
  "Per person: $0": "Kwa mtu: $0",
  "Daily Spend": "Matumizi ya siku",
  "Budget Breakdown": "Mgawanyo wa bajeti",
  "Per Night/Day": "Kwa usiku au siku",
  "Total": "Jumla",
  "Saving Tips": "Mambo ya kuthibitisha ili kuokoa",
  "Food & Dining": "Chakula",
  "Activities": "Shughuli",
  "Local Transport": "Usafiri wa ndani",
  "Flights (return)": "Ndege ya kwenda na kurudi",
  "Visa Fees": "Ada za visa",
  "Festival Details": "Maelezo ya tamasha",
  "Festival / Event": "Tamasha au tukio",
  "Origin City": "Mji wa kuondoka",
  "Same country (local travel)": "Ndani ya nchi hiyo",
  "Duration (Days)": "Muda (siku)",
  "Calculate Festival Budget →": "Kokotoa bajeti ya tamasha →",
  "Total Festival Budget (USD)": "Jumla ya bajeti ya tamasha (USD)",
  "Best Time to Book": "Muda bora wa kuweka nafasi",
  "3 months ahead": "Miezi 3 mapema",
  "Component": "Kipengele",
  "Festival Guide & Tips": "Mambo ya kuthibitisha kuhusu tamasha",
  "Hotels (surged)": "Hoteli (bei iliyopanda)",
  "Event Tickets": "Tiketi za tukio",
  "Activities & Extras": "Shughuli na nyongeza",
  "Search Hotels": "Linganisha hoteli",
  "Star Rating": "Daraja la nyota",
  "1 Star (Budget)": "Nyota 1 (bajeti)",
  "2 Star (Economy)": "Nyota 2 (kawaida)",
  "3 Star (Standard)": "Nyota 3 (wastani)",
  "4 Star (Superior)": "Nyota 4 (juu)",
  "5 Star (Luxury)": "Nyota 5 (anasa)",
  "Season": "Msimu",
  "Peak Season": "Msimu wenye mahitaji makubwa",
  "Normal Season": "Msimu wa kawaida",
  "Low Season": "Msimu wa chini",
  "Stay Duration (Nights)": "Muda wa kukaa (usiku)",
  "Get Hotel Price Guide →": "Onyesha mwongozo wa bei →",
  "Nightly Rate Range": "Safu ya bei kwa usiku",
  "Total est.: $0": "Makisio ya jumla: $0",
  "Currency": "Fedha",
  "All Star Ratings Comparison": "Ulinganisho wa madaraja yote ya nyota",
  "Stars": "Nyota",
  "Nightly Range": "Safu kwa usiku",
  "Examples": "Mifano",
  "Best Neighborhoods & Tips": "Maeneo na masharti ya kuthibitisha",
  "Nightly (local)": "Kwa usiku (fedha ya ndani)",
  "Nightly (USD)": "Kwa usiku (USD)",
  "Monthly Rate": "Bei ya mwezi",
  "Safari Details": "Maelezo ya safari",
  "Safari Country": "Nchi ya safari",
  "Safari Type": "Aina ya safari",
  "Budget Camping": "Kambi ya bajeti",
  "Mid-Range Lodge": "Lodge ya kiwango cha kati",
  "Luxury Tented Camp": "Kambi ya hema ya anasa",
  "Gorilla Trekking": "Kutembea kuona sokwe",
  "in-country": "ndani ya nchi",
  "Peak (Jul–Oct / Dec–Jan)": "Msimu wa juu (Jul–Okt / Des–Jan)",
  "Shoulder (Nov / Apr–Jun)": "Msimu wa kati (Nov / Apr–Jun)",
  "Low / Green (Feb–Mar)": "Msimu wa chini/kijani (Feb–Mac)",
  "Departure Region": "Eneo la kuondoka",
  "Within Africa": "Ndani ya Afrika",
  "Asia / Middle East": "Asia au Mashariki ya Kati",
  "Calculate Safari Cost →": "Kokotoa gharama ya safari →",
  "Total Trip Cost (USD)": "Jumla ya gharama ya safari (USD)",
  "Per Day / Person": "Kwa siku na mtu",
  "Cost Breakdown": "Mgawanyo wa gharama",
  "Cost (USD)": "Gharama (USD)",
  "Seasonal Price Comparison": "Ulinganisho wa bei kwa msimu",
  "Daily Rate/Person": "Bei ya siku kwa mtu",
  "Total Trip": "Jumla ya safari",
  "vs Your Choice": "dhidi ya chaguo lako",
  "Best Time to Visit": "Mambo ya kuthibitisha kuhusu msimu",
  "Safari Cost": "Gharama ya safari",
  "Flights Est.": "Makisio ya ndege",
  "Visas & Fees": "Visa na ada",
  "Extras & Tips": "Nyongeza na bakshishi",
  "Your Trip Profile": "Wasifu wa safari yako",
  "Destination Climate": "Hali ya hewa ya unakoenda",
  "Tropical (West/Central Africa, coastal)": "Tropiki (Afrika Magharibi/Kati, pwani)",
  "Desert / Semi-Arid (Sahel, North Africa)": "Jangwa au ukame kiasi (Sahel, Afrika Kaskazini)",
  "Mountainous (Ethiopia, Rwanda, Kenya highlands)": "Milimani (Ethiopia, Rwanda, nyanda za Kenya)",
  "Coastal / Beach (Zanzibar, Seychelles, Diani)": "Pwani au ufukweni (Zanzibar, Seychelles, Diani)",
  "Mediterranean (Morocco, Tunisia, Cape Town)": "Mediterania (Moroko, Tunisia, Cape Town)",
  "Trip Type": "Aina ya safari",
  "Safari / Wildlife": "Safari ya wanyama",
  "Beach Holiday": "Likizo ya ufukweni",
  "Adventure / Trekking": "Matembezi yenye changamoto",
  "Backpacker / Budget": "Backpacker au bajeti",
  "Family Holiday": "Likizo ya familia",
  "Baggage Policy": "Kanuni ya mzigo",
  "Checked Bag Allowed": "Begi la kuhifadhiwa linaruhusiwa",
  "Carry-On Only": "Mzigo wa mkononi pekee",
  "Generate Packing List →": "Tengeneza orodha ya mizigo →",
  "Total Items to Pack": "Jumla ya vitu vya kubeba",
  "Est. luggage weight: 0 kg": "Makisio ya uzito wa mzigo: 0 kg",
  "Checked / Carry-on": "Begi la kuhifadhiwa / mkononi",
  "Your Packing Checklist": "Orodha yako ya ukaguzi wa mizigo",
  "0 of 0 items checked": "Vitu 0 kati ya 0 vimehakikiwa",
  "Print / Save List": "Chapisha au hifadhi orodha",
  "African Airline Baggage Tips": "Mambo ya kuthibitisha kuhusu mzigo wa ndege",
  "Documents & Money": "Nyaraka na fedha",
  "Health & Medical": "Afya na huduma za kwanza",
  "Electronics": "Vifaa vya kielektroniki",
  "Toiletries": "Vifaa vya usafi",
  "Clothing": "Mavazi",
  "Trip-Specific": "Vitu maalum vya safari",
  "Passport (valid 6+ months)": "Pasipoti (halali kwa miezi 6 au zaidi)",
  "Visa / e-visa printout": "Nakala ya visa au e-visa",
  "Yellow Fever certificate": "Cheti cha homa ya manjano, ikiwa mamlaka inahitaji",
  "Travel insurance documents": "Nyaraka za bima ya safari",
  "Accommodation booking confirmations": "Uthibitisho wa nafasi za malazi",
  "Flight tickets / e-tickets": "Tiketi au e-tiketi za ndege",
  "Emergency contact card": "Kadi ya mawasiliano ya dharura",
  "Copies of all documents (separate bag)": "Nakala za nyaraka zote kwenye begi tofauti",
  "Credit card + debit card": "Kadi ya mkopo na kadi ya benki",
  "US dollars / local currency cash": "Fedha taslimu za USD au fedha ya ndani",
  "Malaria prophylaxis tablets": "Dawa za kuzuia malaria ulizoandikiwa na mtaalamu",
  "DEET insect repellent (30%+)": "Dawa ya kufukuza wadudu yenye DEET 30% au zaidi",
  "Hand sanitiser": "Kisafisha mikono",
  "Oral rehydration salts": "Chumvi za kurejesha maji mwilini",
  "Paracetamol / ibuprofen": "Paracetamol au ibuprofen, ikiwa inakufaa",
  "Antidiarrhoeal medication": "Dawa ya kuharisha iliyokaguliwa na mtaalamu",
  "Antibiotic (travel doctor prescription)": "Antibiotiki iliyoandikwa na daktari wa safari",
  "Plasters / wound dressings": "Plasta na vifaa vya kufunika jeraha",
  "Sunscreen SPF 50+": "Krimu ya jua SPF 50+",
  "Prescription medications (sufficient supply)": "Dawa zako za kuandikiwa, kiasi cha kutosha",
  "Phone + charger": "Simu na chaja",
  "Universal travel adapter (Africa uses Type D/G)": "Adapta ya safari (aina hutofautiana kwa nchi)",
  "Portable power bank": "Power bank",
  "Camera + memory cards": "Kamera na kadi za kumbukumbu",
  "Laptop / tablet + charger": "Kompyuta/tablet na chaja",
  "Earphones / headphones": "Earphone au headphone",
  "Local SIM card (buy at airport)": "SIM ya ndani baada ya kuthibitisha usajili na bei",
  "Toothbrush + toothpaste": "Mswaki na dawa ya meno",
  "Deodorant": "Deodorant",
  "Shampoo + body wash": "Shampoo na sabuni ya mwili",
  "Moisturiser (dry climates)": "Krimu ya ngozi kwa hali kavu",
  "Lip balm with SPF": "Lip balm yenye SPF",
  "Wet wipes / facial wipes": "Tishu zenye unyevunyevu",
  "Lightweight cotton T-shirts (×4–6)": "T-shirt nyepesi za pamba (×4–6)",
  "Cotton/linen trousers or shorts": "Suruali au kaptula za pamba/linen",
  "Light long-sleeve shirt (sun/mosquitoes)": "Shati jepesi la mikono mirefu",
  "Breathable underwear (moisture-wicking)": "Nguo za ndani zinazopitisha hewa",
  "Sandals / flip flops": "Sandali au flip-flop",
  "Lightweight trainers": "Viatu vyepesi vya kutembea",
  "Light rain jacket (compact)": "Jacket nyepesi ya mvua",
  "Wide-brim sun hat": "Kofia pana ya jua",
  "Loose linen/cotton shirts (long sleeve)": "Mashati mapana ya linen/pamba, mikono mirefu",
  "Lightweight long trousers": "Suruali ndefu nyepesi",
  "Light fleece or cardigan (cold nights)": "Fleece au cardigan nyepesi kwa usiku wa baridi",
  "Scarf / shemagh (sand protection)": "Skafu ya kujikinga na mchanga",
  "Closed-toe shoes for sand": "Viatu vilivyofungwa kwa mchanga",
  "Sunglasses (wraparound)": "Miwani ya jua",
  "Wide-brim hat": "Kofia pana",
  "Warm layer for evenings": "Tabaka la joto kwa jioni",
  "Warm fleece jacket": "Jacket ya fleece yenye joto",
  "Waterproof outer layer": "Tabaka la nje lisilopitisha maji",
  "Thermal base layers (×2)": "Mavazi ya ndani ya joto (×2)",
  "Sturdy hiking boots": "Buti imara za kutembea",
  "Wool socks": "Soksi za sufu",
  "Light T-shirts for warm days": "T-shirt nyepesi kwa siku za joto",
  "Gloves + beanie": "Glavu na beanie",
  "Lightweight down jacket": "Jacket nyepesi yenye joto",
  "Swimwear (×2–3)": "Mavazi ya kuogelea (×2–3)",
  "Beach cover-up / sarong": "Sarong au vazi la kujifunika ufukweni",
  "Light shorts and T-shirts": "Kaptula na T-shirt nyepesi",
  "Flip flops / beach sandals": "Flip-flop au sandali za ufukweni",
  "Smart-casual outfit (restaurants)": "Vazi la smart-casual kwa migahawa",
  "Light cardigan (AC)": "Cardigan nyepesi kwa kiyoyozi",
  "Water shoes / reef shoes": "Viatu vya maji",
  "T-shirts + light shirts (×4)": "T-shirt na mashati mepesi (×4)",
  "Smart casual trousers": "Suruali ya smart-casual",
  "Light sweater/cardigan": "Sweta au cardigan nyepesi",
  "Comfortable walking shoes": "Viatu vizuri vya kutembea",
  "Swimwear (coastal cities)": "Mavazi ya kuogelea kwa miji ya pwani",
  "Sun hat": "Kofia ya jua",
  "Modest clothing (religious sites)": "Mavazi ya heshima kwa maeneo ya kidini",
  "Neutral/khaki clothing ONLY (no bright colours)": "Mavazi ya khaki au rangi tulivu, si rangi kali",
  "Binoculars (8×42 or 10×42)": "Darubini (8×42 au 10×42)",
  "Dust-proof bag for electronics": "Begi lisilopitisha vumbi kwa vifaa",
  "Head torch (camp use)": "Taa ya kichwani kwa kambi",
  "Long trousers for evening (insects)": "Suruali ndefu kwa jioni",
  "Warm fleece (early morning game drives are cold)": "Fleece yenye joto kwa safari za alfajiri",
  "Walking shoes with ankle support": "Viatu vya kutembea vinavyoshika kifundo",
  "Waterproof phone pouch": "Kifuko cha simu kisichopitisha maji",
  "Snorkel + mask": "Snorkel na mask",
  "Dry bag": "Begi lisilopitisha maji",
  "After-sun lotion": "Losheni ya baada ya jua",
  "Beach towel (quick-dry)": "Taulo ya ufukweni inayokauka haraka",
  "Underwater camera": "Kamera ya chini ya maji",
  "Formal shirt/blouse (×3)": "Shati au blauzi rasmi (×3)",
  "Business trousers/skirt": "Suruali au sketi ya biashara",
  "Dress shoes": "Viatu rasmi",
  "Suit jacket": "Jacket ya suti",
  "Business cards": "Kadi za biashara",
  "Laptop + power cable": "Kompyuta na kebo ya umeme",
  "Notebook + pens": "Daftari na kalamu",
  "Portable WiFi / local SIM": "WiFi ya kubeba au SIM ya ndani",
  "Trekking poles": "Fimbo za kutembea",
  "First aid kit (comprehensive)": "Kifurushi kamili cha huduma ya kwanza",
  "Sleeping bag liner": "Liner ya sleeping bag",
  "Headlamp + extra batteries": "Taa ya kichwani na betri za ziada",
  "Water purification tablets": "Vidonge vya kusafisha maji",
  "Trekking boots (broken in)": "Buti za trekking ulizozizoea",
  "Gaiters": "Gaiter za miguu",
  "Emergency whistle": "Filimbi ya dharura",
  "Padlock for hostel locker": "Kufuli la locker ya hosteli",
  "Packable daypack": "Begi dogo linalokunjika",
  "Sleep sheet (hostels)": "Shuka ya kulalia hosteli",
  "Ear plugs": "Vifaa vya kuziba masikio",
  "Quick-dry towel": "Taulo inayokauka haraka",
  "Cash belt (concealed)": "Mkanda wa fedha uliofichika",
  "Children's sunscreen SPF 50+": "Krimu ya jua ya watoto SPF 50+",
  "Children's insect repellent": "Dawa ya kufukuza wadudu ya watoto",
  "Baby/child paracetamol": "Paracetamol ya mtoto baada ya ushauri",
  "Travel games / activity books": "Michezo na vitabu vya shughuli",
  "Child carrier (if applicable)": "Kibebea mtoto ikiwa kinahitajika",
  "Favourite comfort items": "Vitu vya faraja anavyopenda mtoto",
  "Laundry bag (longer trip)": "Begi la nguo chafu kwa safari ndefu",
  "Est. luggage weight: ~": "Makisio ya uzito wa mzigo: ~",
  "kg checked": "kg kwenye begi la kuhifadhiwa",
  "kg carry-on": "kg kwenye mzigo wa mkononi",
  "items checked": "vitu vimehakikiwa",
  "Your Trip Details": "Maelezo ya safari yako",
  "Destination Country": "Nchi ya kwenda",
  "United Kingdom": "Uingereza",
  "Trip Duration (Days)": "Muda wa safari (siku)",
  "Number of Travellers": "Idadi ya wasafiri",
  "Create appointment brief": "Andaa muhtasari wa miadi",
  "Travel-health review status": "Hali ya ukaguzi wa afya ya safari",
  "Per traveller: $0": "Kwa msafiri: $0",
  "Start Vaccines": "Hatua ya kwanza",
  "6 weeks before": "Anza ukaguzi mapema",
  "Appointment brief": "Muhtasari wa miadi",
  "Verification checklist": "Orodha ya mambo ya kuthibitisha",
  "When Before Travel": "Wakati kabla ya safari",
  "Action": "Hatua",
  "Medical Disclaimer": "Tahadhari ya afya",
  "This worksheet is not medical advice. A qualified clinician must personalize health advice. Check current entry and transit rules with official authorities and your carrier.": "Karatasi hii si ushauri wa kitabibu. Mtaalamu wa afya lazima akague hali yako; thibitisha masharti ya kuingia na transit kwa mamlaka na mtoa huduma.",
  "Yellow Fever": "Homa ya manjano",
  "Typhoid": "Homa ya matumbo",
  "Hepatitis A": "Homa ya ini A",
  "Hepatitis B": "Homa ya ini B",
  "Meningitis (MenACWY)": "Homa ya uti wa mgongo (MenACWY)",
  "Malaria Prophylaxis": "Dawa za kujikinga na malaria",
  "Rabies (Pre-exposure)": "Kichaa cha mbwa kabla ya uwezekano wa kuathiriwa",
  "Required": "Thibitisha kwa mamlaka",
  "Required (some areas)": "Thibitisha kwa eneo husika",
  "Hajj/Umrah only": "Thibitisha kwa Hajj/Umrah",
  "Recommended": "Jadili na mtaalamu",
  "If rural/wildlife": "Jadili ikiwa ni kijijini au karibu na wanyamapori",
  "No risk": "Jedwali linaonyesha hatari ndogo",
  "Low risk": "Jedwali linaonyesha hatari ya chini",
  "Certificate valid 10 years": "Jedwali la mmiliki: cheti miaka 10; thibitisha sasa",
  "Injection valid 3 years / oral 5 years": "Jedwali la mmiliki: sindano miaka 3 au ya mdomo miaka 5; thibitisha sasa",
  "2 doses for lifetime protection": "Jedwali la mmiliki: dozi 2; mtaalamu athibitishe",
  "3 doses over 6 months": "Jedwali la mmiliki: dozi 3 ndani ya miezi 6; mtaalamu athibitishe",
  "Required for Hajj/Umrah travel": "Thibitisha masharti ya Hajj/Umrah kwa mamlaka",
  "3 doses if rural or wildlife contact": "Jedwali la mmiliki: dozi 3 kwa hali fulani; mtaalamu athibitishe",
  "4+ weeks before": "Wiki 4 au zaidi kabla",
  "2+ weeks before": "Wiki 2 au zaidi kabla",
  "6 months before": "Miezi 6 kabla",
  "1+ week before": "Wiki 1 au zaidi kabla",
  "1–2 weeks before departure": "Wiki 1–2 kabla ya kuondoka",
  "6 wks before": "Wiki 6 kabla",
  "6+ weeks before": "Wiki 6 au zaidi kabla",
  "1–2 weeks before": "Wiki 1–2 kabla",
  "Day before": "Siku moja kabla",
  "During travel": "Wakati wa safari",
  "After return": "Baada ya kurudi",
  "Visit travel medicine clinic. Get Yellow Fever vaccine (requires certificate). Start Hepatitis B series if not completed.": "Panga miadi na mtaalamu wa afya ya safari. Muulize kuhusu homa ya manjano, cheti na dozi zozote ambazo hazijakamilika.",
  "Typhoid, Meningitis, Hepatitis A vaccinations. Rabies pre-exposure if needed. Get malaria prophylaxis prescription.": "Muulize mtaalamu kuhusu homa ya matumbo, uti wa mgongo, homa ya ini A, kichaa cha mbwa na dawa za malaria kulingana na hali yako.",
  "Start malaria tablets (some require 1 week lead). Pack mosquito repellent (DEET 30%+), bed net for rural areas.": "Fuata ratiba ya dawa aliyoagiza mtaalamu; thibitisha pia kinga ya mbu na mahitaji ya eneo unaloenda.",
  "Pack Yellow Fever certificate (keep in hand luggage). Pack malaria tablets + personal medication supply.": "Thibitisha nyaraka za afya zinazohitajika na weka dawa binafsi kulingana na maelekezo ya mtaalamu.",
  "Take malaria tablets daily/weekly as prescribed. Continue for 4 weeks after return if on Mefloquine.": "Tumia dawa yoyote kulingana na maagizo binafsi ya mtaalamu, wakati na baada ya safari.",
  "Continue malaria prophylaxis as directed. Report any fever within 3 months to a doctor — could be malaria.": "Fuata maagizo ya mtaalamu baada ya kurudi na tafuta huduma ya afya ukipata homa au dalili nyingine."
});

function readOwner(row) {
  return fs.readFileSync(path.join(ROOT, row.englishRoute, "index.html"), "utf8");
}

function extractBalancedDiv(html, startNeedle) {
  const start = html.indexOf(startNeedle);
  if (start < 0) throw new Error(`English owner widget missing: ${startNeedle}`);
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tags.exec(html))) {
    if (/^<\/div/i.test(match[0])) depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  throw new Error(`English owner widget is unbalanced: ${startNeedle}`);
}

function extractOwnerScript(html) {
  const scripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi))
    .map((match) => match[1].trim())
    .filter((script) => script && !/^\s*\{[\s\S]*"@context"\s*:/i.test(script));
  if (!scripts.length) throw new Error("English owner calculation script missing");
  return scripts[scripts.length - 1];
}

function extractOwnerStyles(html) {
  return Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1])
    .join("\n");
}

function translateStatic(markup) {
  const keys = Object.keys(COPY).sort((left, right) => right.length - left.length);
  const translateValue = (value) => {
    const leading = value.match(/^\s*/)?.[0] || "";
    const trailing = value.match(/\s*$/)?.[0] || "";
    const core = value.slice(leading.length, value.length - trailing.length);
    const decoded = core.replace(/&amp;/g, "&").replace(/&le;/g, "≤");
    if (COPY[decoded]) return `${leading}${COPY[decoded]}${trailing}`;
    let translated = core;
    for (const key of keys) {
      const encodedKey = key.replace(/&/g, "&amp;").replace(/≤/g, "&le;");
      if (translated.includes(encodedKey)) translated = translated.split(encodedKey).join(COPY[key]);
      if (translated.includes(key)) translated = translated.split(key).join(COPY[key]);
    }
    return `${leading}${translated}${trailing}`;
  };

  return markup
    .replace(/>([^<>]+)</g, (match, text) => `>${translateValue(text)}<`)
    .replace(
      /\b(aria-label|placeholder|title)="([^"]*)"/g,
      (match, attribute, value) => `${attribute}="${translateValue(value).trim()}"`
    );
}

function ownerContract(row) {
  const contract = OWNER_CONTRACTS[row.toolId];
  if (!contract) throw new Error(`No Swahili Travel owner contract for ${row.toolId}`);
  const html = readOwner(row);
  const script = extractOwnerScript(html);
  const ownerHash = crypto.createHash("sha256").update(script).digest("hex");
  const widget = extractBalancedDiv(
    html,
    row.toolId === "africa-flight" ? '<div class="card">' : '<div class="en-tool-layout">'
  );
  const fieldIds = Array.from(widget.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/gi))
    .map((match) => match[1]);
  const source = {
    ...contract.source,
    reviewedAt: "2026-07-31",
    asOf: `${contract.source.state}; si data ya moja kwa moja.`,
    live: false,
    assumptions: [contract.planningNote],
    mutableBaselines: [contract.source.cadence],
    sourceRationale: contract.source.links.length
      ? "Viungo rasmi vinasaidia ukaguzi wa sasa; viwango vya modeli bado si data ya moja kwa moja."
      : "Programu hutumia dataset na fomula ya mmiliki wa Kiingereza iliyopachikwa; badilisha viwango tuli kwa ushahidi wa sasa."
  };
  return {
    action: contract.action,
    copy: COPY,
    fieldIds,
    healthBoundary: false,
    invalid: contract.invalid,
    ownerHash,
    ownerScript: script,
    planningNote: contract.planningNote,
    resultId: contract.resultId,
    safetyMode: contract.safetyMode || null,
    source,
    styles: extractOwnerStyles(html),
    widget: translateStatic(widget)
  };
}

function renderOwnerWorkflow(row) {
  const owner = ownerContract(row);
  const calculationScript = `<script data-sw-english-owner-model="${owner.ownerHash}">\n${owner.ownerScript}\n</script>`;
  return {
    owner,
    html: `<style data-sw-owner-styles>${owner.styles}</style>
<div class="sw-owner-workflow" data-sw-owner-workflow="${row.toolId}" data-english-owner-sha256="${owner.ownerHash}">
${owner.widget}
</div>
${calculationScript}
<div class="sw-owner-export" data-sw-owner-export>
  <h2>Hifadhi au fungua tena matokeo</h2>
  <p>Nakili, chapisha, pakua JSON au PDF, au fungua tena JSON kwenye kifaa hiki. Hakuna akaunti au barua pepe inayohitajika.</p>
  <div class="sw-actions">
    <button type="button" data-sw-copy>Nakili</button>
    <button type="button" data-sw-print>Chapisha</button>
    <button type="button" data-sw-json>Pakua JSON</button>
    <button type="button" data-sw-pdf>Pakua PDF</button>
    <button type="button" class="secondary" data-sw-import-trigger aria-controls="sw-travel-import">Fungua JSON</button>
    <input id="sw-travel-import" type="file" accept="application/json,.json" data-sw-import hidden>
    <button type="button" class="secondary" data-sw-owner-reset>Rudisha mwanzo</button>
  </div>
  <p data-sw-export-status aria-live="polite"></p>
</div>`
  };
}

module.exports = {
  COPY,
  OWNER_CONTRACTS,
  extractBalancedDiv,
  extractOwnerScript,
  ownerContract,
  renderOwnerWorkflow
};
