(function initSwahiliElectricityParity(root) {
  "use strict";

  var exact = [
    // Native names, eligibility notes and tier labels from the maintained tariff records.
    ["Domestic standard — Code 10.1","Nyumbani kawaida — msimbo 10.1"],
    ["Average domestic rate. Receipt totals can still differ because of arrears, debt recovery, or vending adjustments not included in the published energy rate.","Tarifa ya wastani ya nyumbani. Jumla ya risiti inaweza kutofautiana kwa sababu ya malimbikizo, urejeshaji wa madeni au marekebisho wakati wa ununuzi ambayo hayajajumuishwa kwenye bei ya nishati iliyochapishwa."],
    ["Domestic energy charge","Gharama ya nishati ya nyumbani"],
    ["Domestic lifeline eligible — Code 10.1","Nyumbani wanaostahiki tarifa nafuu — msimbo 10.1"],
    ["Only choose this class when the account qualifies: the regulator says the rolling six-month average must not exceed 100 kWh. The calculator does not infer eligibility.","Chagua daraja hili tu ikiwa akaunti inastahiki: mdhibiti anasema wastani unaosogea wa miezi sita usizidi 100 kWh. Kikokotoo hakiamui ustahiki."],
    ["Lifeline — first 15 kWh","Tarifa nafuu — kWh 15 za kwanza"],
    ["Standard domestic rate after 15 kWh","Tarifa ya kawaida ya nyumbani baada ya kWh 15"],
    ["Commercial low voltage — Code 10.2 average","Biashara ya volteji ya chini — wastani wa msimbo 10.2"],
    ["Uses the published average commercial rate. Time-of-use peak, shoulder and off-peak pricing is outside this first release.","Hutumia tarifa ya wastani ya biashara iliyochapishwa. Bei kulingana na vipindi vya matumizi ya juu, ya kati na ya chini haijajumuishwa katika toleo hili."],
    ["Commercial average energy charge","Wastani wa gharama ya nishati ya biashara"],
    [" TANESCO D1 low-usage domestic and T1 general-use classes from EWURA’s published schedule.", " madaraja ya TANESCO D1 ya matumizi madogo ya nyumbani na T1 ya matumizi ya jumla kutoka ratiba iliyochapishwa na EWURA."],
    ["View monthly rates and service charges", "Angalia bei za mwezi na ada za huduma"],
    ["Monthly kWh", "kWh kwa mwezi"],
    ["Service charge (ETB)", "Ada ya huduma (ETB)"],
    ["Monthly budget → maximum kWh", "Bajeti ya mwezi → kiwango cha juu cha kWh"],
    ["Monthly budget (ETB)", "Bajeti ya mwezi (ETB)"],
    ["Enter the total budget for one billing month, including the service charge.", "Ingiza bajeti yote ya mwezi mmoja wa bili, ikijumuisha ada ya huduma."],
    ["Maximum monthly usage within budget", "Matumizi ya juu ya mwezi kwa bajeti hii"],
    ["Budget left after monthly charges", "Bajeti inayobaki baada ya gharama za mwezi"],
    ["Residential · prepaid", "Nyumbani · malipo ya kabla"],
    ["Residential · postpaid", "Nyumbani · malipo baada ya matumizi"],
    ["Regulatory fee (0.5%)", "Ada ya mdhibiti (0.5%)"],
    ["TV licence", "Ada ya leseni ya TV"],
    ["VAT (15%)", "VAT (15%)"],
    ["EEU residential tariff schedule", "ratiba ya tarifa za nyumbani za EEU"],
    ["Enter the full monthly budget or total monthly kWh. All units use the rate for the block reached. The estimate includes one service charge, the 0.5% regulator fee, ETB 10 TV licence above 50 kWh and 15% VAT above 200 kWh. A budget between blocks leaves money unused. Individual token top-ups and arrears are outside this monthly estimate.", "Ingiza bajeti au matumizi yote ya mwezi kwa kWh. Bei ya daraja lililofikiwa hutumika kwa matumizi yote. Makadirio yanajumuisha ada ya huduma ya mwezi, ada ya mdhibiti ya 0.5%, leseni ya TV ya ETB 10 kwa zaidi ya kWh 50 na VAT ya 15% kwa zaidi ya kWh 200. Bajeti iliyo kati ya madaraja huacha pesa ambazo hazijatumika. Makadirio hayahusishi ununuzi mmoja wa tokeni wala madeni ya nyuma."],
    ["Additional receipt deductions not already included in the tariff. Do not enter 18% again for Uganda domestic VAT.", "Makato ya ziada ya risiti ambayo hayajajumuishwa kwenye tarifa. Usiweke tena VAT ya 18% kwa akaunti ya nyumbani Uganda."],
    ["D1 low-usage domestic","D1 matumizi madogo ya nyumbani"],
    ["D1 is for domestic customers averaging less than 75 kWh per month. Select this class only when TANESCO assigns it to the account.","D1 ni kwa wateja wa nyumbani wenye wastani wa matumizi chini ya kWh 75 kwa mwezi. Chagua daraja hili tu ikiwa TANESCO imeipa akaunti daraja hilo."],
    ["First 75 kWh","kWh 75 za kwanza"],
    ["Usage above 75 kWh","Matumizi zaidi ya kWh 75"],
    ["T1 general-use low voltage","T1 matumizi ya jumla ya volteji ya chini"],
    ["T1 covers low-voltage general use, including residential, small commercial, light industrial, public lighting and billboards.","T1 inahusu matumizi ya jumla ya volteji ya chini, yakiwemo makazi, biashara ndogo, viwanda vyepesi, taa za maeneo ya umma na mabango."],
    ["General-use energy charge","Gharama ya nishati kwa matumizi ya jumla"],
    ["Home", "Mwanzo"],
    ["Energy & Utilities", "Nishati na Huduma"],
    ["Electricity cost", "Gharama ya umeme"],
    ["Electricity Cost & Prepaid Units", "Gharama ya Umeme na Unit za Kulipia Kabla"],
    ["Convert money to estimated prepaid units or kWh to an estimated bill. Automatic results appear only where an exact provider-and-class tariff passes its freshness check.", "Badilisha pesa kuwa makadirio ya unit za kulipia kabla, au kWh kuwa makadirio ya bili. Matokeo ya moja kwa moja huonyeshwa tu pale tarifa sahihi ya mtoa huduma na daraja la mteja inapopita ukaguzi wa upya."],
    ["Calculate with a current tariff", "Kokotoa kwa tarifa ya sasa"],
    ["Amounts stay in this browser. Do not enter a token, meter number, address, phone number or payment reference.", "Kiasi chako kinabaki kwenye kivinjari hiki. Usiweke tokeni, namba ya mita, anwani, simu au kumbukumbu ya malipo."],
    ["Calculation direction", "Mwelekeo wa hesabu"],
    ["Money → prepaid units", "Pesa → unit za kulipia kabla"],
    ["Units → bill", "Unit → bili"],
    ["Country", "Nchi"],
    ["Uganda", "Uganda"],
    ["Tanzania", "Tanzania"],
    ["Nigeria", "Nigeria"],
    ["Ghana", "Ghana"],
    ["Kenya", "Kenya"],
    ["South Africa", "Afrika Kusini"],
    ["Zambia", "Zambia"],
    ["Ivory Coast", "Côte d’Ivoire"],
    ["Senegal", "Senegal"],
    ["Priority markets are listed; unsupported markets switch to local custom-rate mode.", "Masoko ya kipaumbele yameorodheshwa; yasiyoungwa mkono hubadilika kwenda tarifa maalum ya eneo lako."],
    ["Provider (when available)", "Mtoa huduma (anapopatikana)"],
    ["Loading providers…", "Inapakia watoa huduma…"],
    ["Provider selection is automatic when only one verified schedule is maintained.", "Mtoa huduma huchaguliwa moja kwa moja ikiwa ratiba moja tu iliyothibitishwa inatunzwa."],
    ["Customer class", "Daraja la mteja"],
    ["Loading customer classes…", "Inapakia madaraja ya wateja…"],
    ["Use the class shown on the account, bill, token receipt or utility notice. The calculator does not infer eligibility.", "Tumia daraja lililo kwenye akaunti, bili, risiti ya tokeni au taarifa ya mtoa huduma. Kikokotoo hakikadirii ustahiki."],
    ["Purchase amount", "Kiasi cha kununua"],
    ["Enter the money paid for the token; do not enter a token or meter number.", "Weka pesa iliyolipwa; usiweke tokeni au namba ya mita."],
    ["Receipt deductions (%)", "Makato ya risiti (%)"],
    ["Optional VAT, levy or percentage deduction shown on the receipt.", "VAT, ushuru au kato la asilimia lililo kwenye risiti, ikiwa lipo."],
    ["Fixed receipt deductions (", "Makato ya kudumu ya risiti ("],
    ["Optional arrears, debt recovery or fixed vending deduction.", "Madeni, urejeshaji wa deni au kato la kudumu la mauzo, ikiwa lipo."],
    ["Use a current local rate", "Tumia tarifa ya sasa ya eneo lako"],
    ["Copy the currency, price per kWh and any fixed charge or tax/levy from a current bill or official notice. AfroTools does not store or validate these values.", "Nakili sarafu, bei kwa kWh na ada ya kudumu au kodi/ushuru kutoka bili ya sasa au taarifa rasmi. AfroTools haihifadhi wala kuthibitisha thamani hizi."],
    ["Currency", "Sarafu"],
    ["Rate per kWh (", "Bei kwa kWh ("],
    ["Fixed bill charge (", "Ada ya kudumu ya bili ("],
    ["Tax or levy (%)", "Kodi au ushuru (%)"],
    ["Calculate electricity estimate", "Kokotoa makadirio ya umeme"],
    ["Estimated prepaid units", "Makadirio ya unit za kulipia kabla"],
    ["Estimated electricity bill", "Makadirio ya bili ya umeme"],
    ["Amount for energy", "Kiasi cha nishati"],
    ["Energy charge", "Gharama ya nishati"],
    ["Deductions", "Makato"],
    ["Effective cost per kWh", "Gharama halisi kwa kWh"],
    ["Tariff breakdown", "Mchanganuo wa tarifa"],
    ["Fixed charge:", "Ada ya kudumu:"],
    ["User-entered tax or levy", "Kodi au ushuru uliowekwa na mtumiaji"],
    ["Minimum charge applied.", "Ada ya chini imetumika."],
    ["Tariff source and freshness", "Chanzo na upya wa tarifa"],
    ["Loading tariff source…", "Inapakia chanzo cha tarifa…"],
    ["Checking the maintained tariff record.", "Inakagua rekodi ya tarifa inayotunzwa."],
    ["Open official source", "Fungua chanzo rasmi"],
    ["Immediate tariff examples", "Mifano ya tarifa ya haraka"],
    ["These crawlable examples use the same maintained records as the calculator and make the class assumptions explicit.", "Mifano hii inayosomeka na injini za utafutaji hutumia rekodi zilezile zinazotunzwa na kikokotoo na inaonyesha wazi dhana za daraja."],
    ["Uganda standard: UGX 10,000", "Uganda kawaida: UGX 10,000"],
    ["Uganda domestic billing context", "Muktadha wa bili ya nyumbani Uganda"],
    ["Units already purchased this month (kWh)", "Uniti zilizonunuliwa tayari mwezi huu (kWh)"],
    ["Use 0 for the first purchase; later purchases continue the same monthly tariff bands.", "Weka 0 kwa ununuzi wa kwanza; ununuzi unaofuata unaendelea katika madaraja yale yale ya mwezi."],
    ["Unpaid monthly service charges", "Idadi ya ada za huduma za miezi ambayo haijalipwa"],
    ["UGX 3,360 per month before VAT. Use 1 for this month only, 0 if already paid, or the number of unpaid months shown by UEDCL. A full monthly bill normally includes one charge.", "UGX 3,360 kwa mwezi kabla ya VAT. Weka 1 kwa mwezi huu pekee, 0 ikiwa imelipwa, au idadi ya miezi isiyolipwa iliyoonyeshwa na UEDCL. Bili kamili ya mwezi kwa kawaida ina ada moja."],
    ["Uganda domestic estimates include 18% VAT on energy and service charges. Do not add this VAT or the same service charge again under receipt deductions. Confirm lifeline eligibility with UEDCL; no eligibility is inferred.", "Makadirio ya nyumbani Uganda yanajumuisha VAT ya 18% kwenye nishati na ada za huduma. Usiongeze VAT hii au ada hiyo tena katika makato ya risiti. Thibitisha ustahiki wa lifeline na UEDCL; haukadiriwi hapa."],
    ["Official explanation of service charges and VAT", "Maelezo rasmi ya ada za huduma na VAT"],
    ["For a Q4 2026 non-lifeline account with no units bought yet, one unpaid service charge and no other deductions, UGX 10,000 buys about ", "Ununuzi wa kwanza wa mwezi bila lifeline wala makato mengine: UGX 10,000 hununua takribani "],
    [" after the UGX 3,360 charge and 18% VAT.", " baada ya ada moja ya UGX 3,360 na VAT ya 18% (robo ya nne 2026)."],
    ["For an eligible UEDCL account, 30 monthly kWh cost UGX 15,441 for energy. Adding one UGX 3,360 service charge and 18% VAT gives ", "Akaunti inayostahiki lifeline: kWh 30 zina gharama ya nishati ya UGX 15,441. Kwa ada moja ya UGX 3,360 na VAT ya 18%: "],
    [", excluding other account adjustments.", ", bila kujumuisha marekebisho mengine ya akaunti."],
    [" UEDCL Q4 2026 domestic standard and eligible lifeline classes, including the cooking band, service charge and VAT. Commercial automatic estimates remain paused until their full billing components are verified. ", " Madaraja ya nyumbani ya UEDCL ya robo ya nne 2026: kawaida na lifeline inayostahiki, pamoja na daraja la kupikia, ada za huduma na VAT. Makadirio ya biashara yamesitishwa hadi ada zote zithibitishwe. "],
    [" before receipt-specific deductions.", " kabla ya makato maalum ya risiti."],
    ["Uganda lifeline: 30 kWh", "Uganda lifeline: 30 kWh"],
    ["Tanzania D1: 100 kWh", "Tanzania D1: 100 kWh"],
    ["For a TANESCO D1 account, 75 kWh at TZS 100 plus 25 kWh at TZS 350 totals ", "Kwa akaunti ya TANESCO D1, kWh 75 kwa TZS 100 pamoja na kWh 25 kwa TZS 350 ni jumla ya "],
    ["Coverage and limitations", "Ufikikaji na mipaka"],
    ["Automatic at release", "Hesabu ya moja kwa moja wakati wa uzinduzi"],
    ["Uganda:", "Uganda:"],
    ["Tanzania:", "Tanzania:"],
    ["Custom-rate only", "Tarifa maalum pekee"],
    ["Nigeria, Ghana, Kenya, South Africa, Zambia, Côte d'Ivoire and Senegal are not auto-calculated until exact current provider/class schedules are parsed and reviewed. A regulator homepage or national benchmark is not enough.", "Nigeria, Ghana, Kenya, Afrika Kusini, Zambia, Côte d’Ivoire na Senegal hazikokotolewi moja kwa moja hadi ratiba sahihi za sasa za mtoa huduma na daraja zichambuliwe na kuhakikiwa. Ukurasa wa mdhibiti au wastani wa kitaifa pekee hautoshi."],
    ["Nigeria, Ghana, Kenya, Afrika Kusini, Zambia, Côte d'Ivoire and Senegal are not auto-calculated until exact current provider/class schedules are parsed and reviewed. A regulator homepage or national benchmark is not enough.", "Nigeria, Ghana, Kenya, Afrika Kusini, Zambia, Côte d’Ivoire na Senegal hazikokotolewi moja kwa moja hadi ratiba sahihi za sasa za mtoa huduma na daraja zichambuliwe na kuhakikiwa. Ukurasa wa mdhibiti au wastani wa kitaifa pekee hautoshi."],
    ["Actual bills and token receipts may include taxes, levies, fixed charges, minimum charges, arrears, debt recovery, meter corrections or time-of-use pricing. Enter receipt deductions where known and verify the result before paying or disputing a charge.", "Bili na risiti za tokeni zinaweza kujumuisha kodi, ushuru, ada za kudumu, ada za chini, madeni, urejeshaji wa deni, marekebisho ya mita au bei kulingana na muda. Weka makato ya risiti unayoyajua na uthibitishe matokeo kabla ya kulipa au kupinga gharama."],
    ["Need to compare a meter reading with a bill?", "Unahitaji kulinganisha usomaji wa mita na bili?"],
    ["Need to estimate appliance usage first?", "Unahitaji kukadiria matumizi ya vifaa kwanza?"],
    ["Electricity tariff questions", "Maswali ya tarifa ya umeme"],
    ["How many prepaid electricity units will I get?", "Nitapata unit ngapi za umeme wa kulipia kabla?"],
    ["Choose the country, provider and customer class, then enter the purchase amount. Actual units can differ when a receipt includes deductions not entered here.", "Chagua nchi, mtoa huduma na daraja la mteja, kisha weka kiasi cha kununua. Unit halisi zinaweza kutofautiana ikiwa risiti ina makato ambayo hujaweka hapa."],
    ["Why is my country not calculated automatically?", "Kwa nini nchi yangu haikokotolewi moja kwa moja?"],
    ["Automatic estimates need an exact official provider-and-class schedule plus a passing validity and freshness check. Use a current local rate when that evidence is missing.", "Makadirio ya moja kwa moja yanahitaji ratiba rasmi sahihi ya mtoa huduma na daraja pamoja na ukaguzi wa uhalali na upya. Tumia tarifa ya sasa ya eneo lako ikiwa ushahidi huo haupo."],
    ["Automatic estimates need an exact official provider-and-class schedule plus a passing validity and freshness check. ", "Makadirio ya moja kwa moja yanahitaji ratiba rasmi sahihi ya mtoa huduma na daraja pamoja na ukaguzi wa uhalali na upya. "],
    [" when that evidence is missing.", " ikiwa ushahidi huo haupo."],
    ["Is this an official bill or token receipt?", "Hii ni bili rasmi au risiti ya tokeni?"],
    ["No. It is a planning estimate. Confirm the result with the regulator or utility schedule and your actual receipt.", "Hapana. Haya ni makadirio ya kupanga. Thibitisha matokeo kwa ratiba ya mdhibiti au mtoa huduma na risiti yako halisi."],
    ["No verified provider available", "Hakuna mtoa huduma aliyethibitishwa"],
    ["Use a custom local rate", "Tumia tarifa maalum ya eneo lako"],
    ["This tariff is no longer current enough for an automatic estimate. Enter a rate from a current bill or official notice instead.", "Tarifa hii si mpya vya kutosha kwa makadirio ya moja kwa moja. Weka tarifa kutoka bili ya sasa au taarifa rasmi."],
    ["No current provider-and-class tariff is maintained for this country. Enter a current rate from your bill or official notice; it stays in this browser.", "Hakuna tarifa ya sasa ya mtoa huduma na daraja inayotunzwa kwa nchi hii. Weka tarifa ya sasa kutoka bili au taarifa rasmi; itabaki kwenye kivinjari hiki."],
    ["Automatic estimate paused", "Makadirio ya moja kwa moja yamesitishwa"],
    ["Custom-rate mode", "Hali ya tarifa maalum"],
    ["The stored official record failed its validity or verification window.", "Rekodi rasmi iliyohifadhiwa haikupita muda wa uhalali au uthibitishaji."],
    ["No automatic tariff is claimed. Your rate is processed locally and is not saved.", "Hakuna tarifa ya moja kwa moja inayodaiwa. Tarifa yako inachakatwa kwenye kifaa hiki na haihifadhiwi."],
    ["Effective ", "Inatumika "],
    [" · verified ", " · imethibitishwa "],
    [" · official provider schedule · high confidence.", " · ratiba rasmi ya mtoa huduma · uhakika mkubwa."],
    ["Open ", "Fungua "],
    ["User-entered energy rate", "Bei ya nishati iliyowekwa na mtumiaji"],
    ["User-entered percentage deduction", "Kato la asilimia lililowekwa na mtumiaji"],
    ["User-entered fixed deduction", "Kato la kudumu lililowekwa na mtumiaji"],
    [" Custom rates are not verified by AfroTools.", " Tarifa maalum hazijathibitishwa na AfroTools."],
    [" This is a planning estimate, not an official bill or token receipt.", " Haya ni makadirio ya kupanga, si bili rasmi wala risiti ya tokeni."],
    ["Enter a purchase amount greater than zero.", "Weka kiasi cha kununua kilicho zaidi ya sifuri."],
    ["Enter electricity units greater than zero.", "Weka unit za umeme zilizo zaidi ya sifuri."],
    ["Enter a current tariff rate greater than zero.", "Weka tarifa ya sasa iliyo zaidi ya sifuri."],
    ["Tariff charges use the available purchase amount; no money remains for electricity units.", "Ada za tarifa zimetumia kiasi chote cha ununuzi; hakuna pesa iliyobaki kwa unit za umeme."],
    ["Electricity units", "Unit za umeme"],
    ["Enter monthly or billing-period consumption in kWh.", "Weka matumizi ya mwezi au kipindi cha bili kwa kWh."],
    ["The tariff dataset could not be loaded. Automatic estimates are unavailable; try again later.", "Data ya tarifa haikuweza kupakiwa. Makadirio ya moja kwa moja hayapatikani; jaribu tena baadaye."]
  ];

  function translateText(value) {
    var output = value;
    exact.forEach(function (pair) { output = output.split(pair[0]).join(pair[1]); });
    return output;
  }

  function localize(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (/^(SCRIPT|STYLE|NOSCRIPT)$/.test(node.parentElement && node.parentElement.tagName || '')) continue;
      var translated = translateText(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    }
    scope.querySelectorAll('[aria-label], [title], [placeholder]').forEach(function (element) {
      ['aria-label', 'title', 'placeholder'].forEach(function (attribute) {
        if (element.hasAttribute(attribute)) element.setAttribute(attribute, translateText(element.getAttribute(attribute)));
      });
    });
  }

  document.documentElement.lang = 'sw';
  localize(document.body);
  var scheduled = false;
  new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    root.requestAnimationFrame(function () { scheduled = false; localize(document.body); });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}(window));
