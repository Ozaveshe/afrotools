(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AfroTransliterationEngine = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var GEEZ = {
    h:'ሀሁሂሃሄህሆ',l:'ለሉሊላሌልሎ',m:'መሙሚማሜምሞ',r:'ረሩሪራሬርሮ',s:'ሰሱሲሳሴስሶ',sh:'ሸሹሺሻሼሽሾ',
    q:'ቀቁቂቃቄቅቆ',b:'በቡቢባቤብቦ',t:'ተቱቲታቴትቶ',ch:'ቸቹቺቻቼችቾ',n:'ነኑኒናኔንኖ',gn:'ኘኙኚኛኜኝኞ',
    k:'ከኩኪካኬክኮ',w:'ወዉዊዋዌውዎ',z:'ዘዙዚዛዜዝዞ',y:'የዩዪያዬይዮ',d:'ደዱዲዳዴድዶ',j:'ጀጁጂጃጄጅጆ',
    g:'ገጉጊጋጌግጎ',f:'ፈፉፊፋፌፍፎ',p:'ፐፑፒፓፔፕፖ'
  };
  // Simple route-local input convention: e=first order, u=second, i=third,
  // a/aa=fourth, ee=fifth, bare consonant=sixth, o=seventh.
  var VOWELS = { e:0, u:1, i:2, a:3, aa:3, ee:4, '':5, o:6 };
  var TIFINAGH = {a:'ⴰ',b:'ⴱ',g:'ⴳ',d:'ⴷ',e:'ⴻ',f:'ⴼ',k:'ⴾ',h:'ⵀ',q:'ⵇ',i:'ⵉ',j:'ⵊ',l:'ⵍ',m:'ⵎ',n:'ⵏ',u:'ⵓ',r:'ⵔ',s:'ⵙ',t:'ⵜ',w:'ⵡ',y:'ⵢ',z:'ⵣ',o:'ⵓ',sh:'ⵛ',ch:'ⵞ',gh:'ⵖ',kh:'ⵅ'};
  var ARABIC = {th:'ث',kh:'خ',dh:'ذ',sh:'ش',gh:'غ',aa:'ا',ee:'ي',oo:'و',a:'ا',b:'ب',t:'ت',j:'ج',h:'ه',d:'د',r:'ر',z:'ز',s:'س',f:'ف',q:'ق',k:'ك',l:'ل',m:'م',n:'ن',w:'و',y:'ي',i:'ِ',u:'ُ',e:'ِ',o:'ُ',"'":'ء'};
  function mapTokens(text, table) {
    var original = String(text || ''), input = original.toLowerCase(), output = '', index = 0;
    var keys = Object.keys(table).sort(function (a, b) { return b.length - a.length; });
    while (index < input.length) {
      var match = keys.find(function (key) { return input.slice(index, index + key.length) === key; });
      if (match) { output += table[match]; index += match.length; }
      else { output += original[index]; index += 1; }
    }
    return output;
  }
  function toEthiopic(text) {
    var original = String(text || ''), input = original.toLowerCase(), output = '', index = 0;
    while (index < input.length) {
      var consonant = GEEZ[input.slice(index, index + 2)] ? input.slice(index, index + 2) : (GEEZ[input[index]] ? input[index] : '');
      if (!consonant) { output += original[index++]; continue; }
      index += consonant.length;
      var vowel = '';
      if (/[aeiou]/.test(input[index] || '')) {
        vowel = input[index];
        if ((vowel === 'a' || vowel === 'e') && input[index + 1] === vowel) { vowel += vowel; index += 2; }
        else index += 1;
      }
      output += GEEZ[consonant][VOWELS[vowel]];
    }
    return output;
  }
  function convert(script, text) {
    if (script === 'geez') return toEthiopic(text);
    if (script === 'tifinagh') return mapTokens(text, TIFINAGH);
    if (script === 'arabic') return mapTokens(text, ARABIC);
    return String(text || '');
  }
  function analyze(script, text) {
    var output = convert(script, text);
    var unsupported = [];
    (output.match(/[A-Za-z]/g) || []).forEach(function (character) {
      var normalized = character.toLowerCase();
      if (unsupported.indexOf(normalized) === -1) unsupported.push(normalized);
    });
    return { output: output, unsupportedLatin: unsupported };
  }
  return {
    GEEZ: GEEZ, TIFINAGH: TIFINAGH, ARABIC: ARABIC,
    coverage: { geezBaseRows: Object.keys(GEEZ).length, geezForms: Object.keys(GEEZ).length * 7, tifinaghTokens: Object.keys(TIFINAGH).length, arabicTokens: Object.keys(ARABIC).length },
    toEthiopic: toEthiopic, convert: convert, analyze: analyze
  };
}));
