(function (root, factory) {
  'use strict';
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.hausaPhrasebook = data;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  return {
    checkedAt: '2026-07-26',
    script: 'Boko',
    confidence: 'starter-draft',
    sourceUrl: 'https://aflang.humanities.ucla.edu/language-materials/chadic-languages/hausa/hausa-online-grammar/pronunciation-writing/hausa-writing/',
    entries: [
      { en: 'Hello', ha: 'Sannu', pron: 'SAHN-noo', cat: 'Gaisuwa' },
      { en: 'Peace be upon you', ha: 'Salamu alaikum', pron: 'sah-LAH-moo ah-LAY-koom', cat: 'Gaisuwa' },
      { en: 'How are you?', ha: 'Yaya kake? / Yaya kike?', pron: 'YAH-yah KAH-keh / YAH-yah KEE-keh', cat: 'Gaisuwa', note: '“Kake” ga namiji ne; “kike” ga mace.' },
      { en: 'I am fine', ha: 'Lafiya lau', pron: 'lah-FEE-yah LOW', cat: 'Gaisuwa' },
      { en: 'Good morning', ha: 'Ina kwana', pron: 'ee-NAH KWAH-nah', cat: 'Gaisuwa' },
      { en: 'Good afternoon', ha: 'Ina wuni', pron: 'ee-NAH WOO-nee', cat: 'Gaisuwa' },
      { en: 'Welcome', ha: 'Sannu da zuwa', pron: 'SAHN-noo dah ZOO-wah', cat: 'Gaisuwa' },
      { en: 'What is your name?', ha: 'Mene ne sunanka? / Mene ne sunanki?', pron: 'MEH-neh neh soo-NAHN-kah / soo-NAHN-kee', cat: 'Gaisuwa', note: '“Sunanka” ga namiji ne; “sunanki” ga mace.' },
      { en: 'My name is…', ha: 'Sunana…', pron: 'soo-NAH-nah', cat: 'Gaisuwa' },
      { en: 'Goodbye', ha: 'Sai an jima', pron: 'sigh ahn JEE-mah', cat: 'Gaisuwa' },
      { en: 'Yes', ha: 'Ee', pron: 'EE', cat: 'Muhimman kalmomi' },
      { en: 'No', ha: 'A’a', pron: 'AH-ah', cat: 'Muhimman kalmomi' },
      { en: 'Please', ha: 'Don Allah', pron: 'dohn AH-lah', cat: 'Muhimman kalmomi' },
      { en: 'Thank you', ha: 'Na gode', pron: 'nah GOH-deh', cat: 'Muhimman kalmomi' },
      { en: 'Sorry', ha: 'Yi haƙuri', pron: 'yee hah-KOO-ree', cat: 'Muhimman kalmomi' },
      { en: 'I do not understand', ha: 'Ban gane ba', pron: 'bahn GAH-neh bah', cat: 'Muhimman kalmomi' },
      { en: 'Do you speak English?', ha: 'Kana iya Turanci? / Kina iya Turanci?', pron: 'KAH-nah / KEE-nah ee-YAH too-RAHN-chee', cat: 'Muhimman kalmomi', note: 'Zaɓi “kana” ko “kina” gwargwadon wanda ake magana da shi.' },
      { en: 'Help!', ha: 'Taimako!', pron: 'tye-MAH-koh', cat: 'Gaggawa' },
      { en: 'No problem', ha: 'Babu matsala', pron: 'BAH-boo maht-SAH-lah', cat: 'Muhimman kalmomi' },
      { en: 'Where is…?', ha: 'Ina…?', pron: 'ee-NAH', cat: 'Tafiya' },
      { en: 'How much?', ha: 'Nawa ne?', pron: 'NAH-wah neh', cat: 'Kasuwa' },
      { en: 'Water', ha: 'Ruwa', pron: 'ROO-wah', cat: 'Abinci' },
      { en: 'Food', ha: 'Abinci', pron: 'ah-BEEN-chee', cat: 'Abinci' },
      { en: 'I am hungry', ha: 'Ina jin yunwa', pron: 'ee-NAH jeen YOON-wah', cat: 'Abinci' },
      { en: 'Money', ha: 'Kuɗi', pron: 'KOO-dee', cat: 'Kasuwa' },
      { en: 'Market', ha: 'Kasuwa', pron: 'kah-SOO-wah', cat: 'Kasuwa' },
      { en: 'Too expensive', ha: 'Ya yi tsada', pron: 'yah yee TSAH-dah', cat: 'Kasuwa' },
      { en: 'Reduce the price', ha: 'Ka rage farashin / Ki rage farashin', pron: 'kah / kee RAH-geh fah-RAH-sheen', cat: 'Kasuwa', note: 'Umarnin ya bambanta ga namiji da mace.' },
      { en: 'I want to buy', ha: 'Ina son saya', pron: 'ee-NAH sohn SAH-yah', cat: 'Kasuwa' },
      { en: 'Receipt, please', ha: 'Don Allah, ba ni rasit', pron: 'dohn AH-lah bah nee RAH-seet', cat: 'Kasuwa' },
      { en: 'Today', ha: 'Yau', pron: 'YOW', cat: 'Lokaci' },
      { en: 'Tomorrow', ha: 'Gobe', pron: 'GOH-beh', cat: 'Lokaci' },
      { en: 'Hospital', ha: 'Asibiti', pron: 'ah-see-BEE-tee', cat: 'Gaggawa' },
      { en: 'Doctor', ha: 'Likita', pron: 'lee-KEE-tah', cat: 'Gaggawa' },
      { en: 'Pharmacy', ha: 'Kantin magani', pron: 'KAHN-teen mah-GAH-nee', cat: 'Gaggawa' },
      { en: 'I need medicine', ha: 'Ina buƙatar magani', pron: 'ee-NAH boo-KAH-tahr mah-GAH-nee', cat: 'Gaggawa', note: 'A nemi shawarar ƙwararren ma’aikacin lafiya.' },
      { en: 'House', ha: 'Gida', pron: 'GEE-dah', cat: 'Tafiya' },
      { en: 'Road', ha: 'Hanya', pron: 'HAHN-yah', cat: 'Tafiya' },
      { en: 'I want to go to…', ha: 'Ina so in je…', pron: 'ee-NAH soh een jeh', cat: 'Tafiya' },
      { en: 'Stop here', ha: 'Tsaya nan', pron: 'TSAH-yah nahn', cat: 'Tafiya' },
      { en: 'Bank', ha: 'Banki', pron: 'BAHN-kee', cat: 'Kuɗi' },
      { en: 'Loan', ha: 'Bashi', pron: 'BAH-shee', cat: 'Kuɗi' },
      { en: 'What is the exchange rate?', ha: 'Nawa ne kuɗin musaya?', pron: 'NAH-wah neh KOO-deen moo-SAH-yah', cat: 'Kuɗi', note: 'A tabbatar da nau’in kuɗaɗen da ake musaya da sabon farashi.' },
      { en: 'Farm', ha: 'Gona', pron: 'GOH-nah', cat: 'Noma' },
      { en: 'Fertiliser', ha: 'Taki', pron: 'TAH-kee', cat: 'Noma' },
      { en: 'Harvest', ha: 'Girbi', pron: 'GEER-bee', cat: 'Noma' }
    ]
  };
}));
