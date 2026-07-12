#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const write = process.argv.includes("--write");
const replacements = [
  ["Kíriíro", "Kíriíro"],
  ["Ko alaye pataki sile ki o si irinse to ye. Akopo naa wa ninu browser re, ko si ran data re si server.", "Kọ àlàyé pàtàkì sílẹ̀ kí o sì lọ sí irinṣẹ́ tó yẹ. Àkópọ̀ náà wà nínú aṣàwákiri rẹ; kò sì rán data rẹ sí server."],
  ["Fi alaye pataki kun, leyin naa si irinse to ye. Akopo naa wa ninu browser re.", "Fi àlàyé pàtàkì kún, lẹ́yìn náà lọ sí irinṣẹ́ tó yẹ. Àkópọ̀ náà wà nínú aṣàwákiri rẹ."],
  ["Fi ipo, ise tabi alaye kun lati gba akopo.", "Fi ipò, iṣẹ́ tàbí àlàyé kún láti gba àkópọ̀."],
  ["Ise: Ona: lo eyi fun eto akoko. Sayewo owo, ofin, ojo, faili tabi orisun osise saaju ipinnu owo, ilera, ile-iwe tabi isowo.", "Iṣẹ́: Ọ̀nà: lo èyí fún ètò àkókò. Ṣàyẹ̀wò owó, òfin, ọjọ́, fáìlì tàbí orísun tó jẹ́ òfìsì ṣáájú ìpinnu owó, ìlera, ilé-ẹ̀kọ́ tàbí ìṣòwò."],
  ["2026: Lo eyi fun eto akoko. Sayewo owo, ofin, ojo, ilera, faili tabi orisun osise saaju ipinnu owo, rira, ilera, ile-iwe tabi isowo.", "2026: Lo èyí fún ètò àkókò. Ṣàyẹ̀wò owó, òfin, ọjọ́, ìlera, fáìlì tàbí orísun tó jẹ́ òfìsì ṣáájú ìpinnu owó, rírà, ìlera, ilé-ẹ̀kọ́ tàbí ìṣòwò."],
  ["2026: Akiyesi 2026: owo oja, ojo, agbegbe ati irugbin le yato. Lo iye ti o gba ni oja re ki o sayewo pelu olutaja tabi amoye ogbin.", "2026: Àkíyèsí 2026: owó ọjà, ojò, agbègbè àti irúgbìn lè yàtọ̀. Lo iye tí o gba ní ọjà rẹ kí o ṣàyẹ̀wò pẹ̀lú olùtajà tàbí amòye ọ̀gbìn."],
  ["Sayewo: fi abajade we iye ọja agbegbe, ADP tabi extension officer, ẹgbẹ agbẹ, olutaja, olura gidi ati iwe adehun ṣaaju ki o to ra ohun elo tabi gba gbese.", "Ṣàyẹ̀wò: fi àbájáde wé iye ọjà agbègbè, ADP tàbí extension officer, ẹgbẹ́ agbẹ, olùtajà, olùrà gidi àti ìwé àdéhùn ṣáájú kí o tó ra ohun èlò tàbí gba gbèsè."],
  ["Si irinse kikun", "Sí irinṣẹ́ kíkún"],
  ["Da akopo kopi", "Dà àkópọ̀ kọ́"],
  ["Akopo ti daako.", "A ti dà àkópọ̀ kọ́."],
  ["A ti daako akopo CIT.", "A ti dà àkópọ̀ CIT kọ́."],
  ["Daako akopo CIT", "Dà àkópọ̀ CIT kọ́"],
  ["Daako akopo VAT", "Dà àkópọ̀ VAT kọ́"],
  ["Dín ìwọ̀n PDF ki o gba akopo", "Dín ìwọ̀n PDF kí o gba àkópọ̀"],
  [">Ise<", ">Iṣẹ́<"],
  [">Seto ise<", ">Ṣètò iṣẹ́<"],
  [">Seto iye oja<", ">Ṣètò iye ọjà<"],
  [">Seto oko<", ">Ṣètò oko<"],
  [">Da akopo fun rira<", ">Dà àkópọ̀ fún rírà<"],
  [">Fi alaye we<", ">Fi àlàyé wé<"],
  [">Sayewo saaju lilo<", ">Ṣàyẹ̀wò ṣáájú lílò<"],
  [">Seto eko<", ">Ṣètò ẹ̀kọ́<"],
  [">Gbiyanju ibeere<", ">Gbìyànjú ìbéèrè<"],
  [">Sayewo abajade<", ">Ṣàyẹ̀wò àbájáde<"],
  [">Seto<", ">Ṣètò<"],
  [">Fiwe<", ">Fi wé<"],
  [">Sayewo<", ">Ṣàyẹ̀wò<"],
  ["Orisun ati alabapade:", "Orísun àti àkókò ìmúdójúìwọ̀n:"],
  ["A tun sayewo oju-iwe yii", "A tún ṣàyẹ̀wò ojú-ìwé yìí"],
  ["Daako gbolohun", "Dà gbólóhùn kọ́"],
  ["Daako akosile", "Dà àkọsílẹ̀ kọ́"],
  [">Daako<", ">Dàkọ<"],
  ["Ko si nkan lati daako sibe.", "Kò sí nǹkan láti dàkọ síbẹ̀."],
  ["ti daako.", "ti dàkọ."],
  ["Ko ohun ti o fe so, yan ibi lilo, ki AfroTools fun o ni akopo lati daako sinu phrasebook tabi ranse si onitumo eniyan fun ayewo.", "Kọ ohun tí o fẹ́ sọ, yan ibi lílò, kí AfroTools fún ọ ní àkópọ̀ láti dàkọ sínú phrasebook tàbí ránṣẹ́ sí onítumọ̀ ènìyàn fún àyẹ̀wò."],
  [">Se akopo<", ">Ṣe àkópọ̀<"],
  ["Ona ise: oju yii ko n se itumo alaifọwọyi. O n ran e lowo lati seto oro re, yan oju Yoruba tabi fallback Gẹẹsi, ki o si mura ohun ti eniyan to mo ede le ṣayẹwo.", "Ọ̀nà iṣẹ́: ojú yìí kò ń ṣe ìtumọ̀ aláìfọwọ́yí. Ó ń ràn ẹ́ lọ́wọ́ láti ṣètò ọ̀rọ̀ rẹ, yan ojú Yorùbá tàbí fallback Gẹ̀ẹ́sì, kí o sì múra ohun tí ènìyàn tó mọ èdè lè ṣàyẹ̀wò."],
  ["Orisun: awon ọna asopọ wa lati katalogi irinse AfroTools ati phrasebook Yoruba. Atunse oju yii: June 2026.", "Orísun: àwọn ọ̀nà àsopọ̀ wá láti katalogi irinṣẹ́ AfroTools àti phrasebook Yorùbá. Àtúnṣe ojú yìí: June 2026."],
  ["Te oro, gbolohun tabi apejuwe ise re sii ki o to se akopo.", "Tẹ ọ̀rọ̀, gbólóhùn tàbí àpèjúwe iṣẹ́ rẹ sí i kí o tó ṣe àkópọ̀."],
  ["\\n\\nA ti daako akopo naa.", "\\n\\nA ti dà àkópọ̀ náà kọ́."],
  ["Da tabi gba akopo", "Dà tàbí gba àkópọ̀"],
  ["Lo paneli yii leyin lilo oju yii. Akopo naa rorun lati pin pelu dokita, ebi tabi egbe.", "Lo pánẹ́lì yìí lẹ́yìn lílo ojú yìí. Àkópọ̀ náà rọrùn láti pín pẹ̀lú dókítà, ẹbí tàbí ẹgbẹ́."],
  ["Da akopo kopi", "Dà àkópọ̀ kọ́"],
  ["Local-first: Asiri agbegbe: paneli yii n se akopo ninu browser re. Ma fi alaye ikoko kun ti ko ba ye.", "Local-first: Àṣírí agbègbè: pánẹ́lì yìí ń ṣe àkópọ̀ nínú aṣàwákiri rẹ. Má fi àlàyé ìkọ̀kọ̀ kún tí kò bá yẹ."],
  ["Freshness Ayewo 2026: ofin, owo, data ati orisun le yipada. Sayewo saaju ipinnu.", "Freshness Àyẹ̀wò 2026: òfin, owó, data àti orísun lè yí padà. Ṣàyẹ̀wò ṣáájú ìpinnu."],
  ["Methodology Ona: darapo alaye ti o fi kun, abajade irinse ati awon ikilo. Ko je eri osise.", "Methodology Ọ̀nà: darapọ̀ àlàyé tí o fi kún, àbájáde irinṣẹ́ àti àwọn ìkìlọ̀. Kò jẹ́ ẹ̀rí òfìsì."],
  ["Fi alaye kun tabi lo oju yii ki o to pin akopo.", "Fi àlàyé kún tàbí lo ojú yìí kí o tó pín àkópọ̀."],
  ["Akopo ti gba.", "A ti gba àkópọ̀."],
  ["2026: Asiri: pa faili pataki mo ninu browser re ki o sayewo oju-iwe kikun saaju fifiranse tabi gbigbasil?.", "2026: Àṣírí: pa fáìlì pàtàkì mọ́ nínú aṣàwákiri rẹ kí o ṣàyẹ̀wò ojú-ìwé kíkún ṣáájú fífi ránṣẹ́ tàbí gbígbà sílẹ̀."],
  ["Ilana, orisun ati ikilo: Irinse yii n ka iye Naira ninu browser, pin Naira ati kobo, ki o si kọ ọrọ Yoruba fun risiti, akọsilẹ isanwo ati iṣẹ agbegbe.", "Ìlànà, orísun àti ìkìlọ̀: Irinṣẹ́ yìí ń ka iye Naira nínú aṣàwákiri, pín Naira àti kobo, kí o sì kọ ọ̀rọ̀ Yorùbá fún risiti, àkọsílẹ̀ ìsanwó àti iṣẹ́ agbègbè."],
  ["Methodology cue Ilana Ilana re ni wa gbolohun, yan apere, satunse pelu eniyan, ki o si daako abajade. Ikilo: ko se itumo osise.", "Methodology cue Ìlànà: ìlànà rẹ ni wá gbólóhùn, yan àpẹẹrẹ, ṣàtúnṣe pẹ̀lú ènìyàn, kí o sì dàkọ àbájáde. Ìkìlọ̀: kò ṣe ìtumọ̀ òfìsì."],
  ["Ise Seto iwe Gbejade faili Sayewo asiri", "Iṣẹ́ Ṣètò ìwé Gbé fáìlì jáde Ṣàyẹ̀wò àṣírí"],
  ["Ise:</strong> Ona:", "Iṣẹ́:</strong> Ọ̀nà:"],
  ["lo eyi fun eto akoko. Sayewo owo, ofin, ojo, faili tabi orisun osise saaju ipinnu owo, ilera, ile-iwe tabi isowo.", "lo èyí fún ètò àkókò. Ṣàyẹ̀wò owó, òfin, ọjọ́, fáìlì tàbí orísun tó jẹ́ òfìsì ṣáájú ìpinnu owó, ìlera, ilé-ẹ̀kọ́ tàbí ìṣòwò."],
  ["lo eyi fun eto akoko. Sayewo owo, ofin, ojo, ilera, faili tabi orisun osise saaju ipinnu owo, rira, ilera, ile-iwe tabi isowo.", "lo èyí fún ètò àkókò. Ṣàyẹ̀wò owó, òfin, ọjọ́, ìlera, fáìlì tàbí orísun tó jẹ́ òfìsì ṣáájú ìpinnu owó, rírà, ìlera, ilé-ẹ̀kọ́ tàbí ìṣòwò."],
  ["Akiyesi 2026:", "Àkíyèsí 2026:"],
  ["owo oja, ojo, agbegbe ati irugbin le yato. Lo iye ti o gba ni oja re ki o sayewo pelu olutaja tabi amoye ogbin.", "owó ọjà, ojò, agbègbè àti irúgbìn lè yàtọ̀. Lo iye tí o gba ní ọjà rẹ kí o ṣàyẹ̀wò pẹ̀lú olùtajà tàbí amòye ọ̀gbìn."],
  ["Sayewo:</strong>", "Ṣàyẹ̀wò:</strong>"],
  ["fi abajade we iye ọja agbegbe, ADP tabi extension officer, ẹgbẹ agbẹ, olutaja, olura gidi ati iwe adehun ṣaaju ki o to ra ohun elo tabi gba gbese.", "fi àbájáde wé iye ọjà agbègbè, ADP tàbí extension officer, ẹgbẹ́ agbẹ, olùtajà, olùrà gidi àti ìwé àdéhùn ṣáájú kí o tó ra ohun èlò tàbí gba gbèsè."],
  ["Asiri:</strong> pa faili pataki mo ninu browser re ki o sayewo oju-iwe kikun saaju fifiranse tabi gbigbasil?.", "Àṣírí:</strong> pa fáìlì pàtàkì mọ́ nínú aṣàwákiri rẹ kí o ṣàyẹ̀wò ojú-ìwé kíkún ṣáájú fífi ránṣẹ́ tàbí gbígbà sílẹ̀."],
  ["Ilana, orisun ati ikilo:", "Ìlànà, orísun àti ìkìlọ̀:"],
  ["Irinse yii n ka iye Naira ninu browser", "Irinṣẹ́ yìí ń ka iye Naira nínú aṣàwákiri"],
  ["ọrọ Yoruba fun risiti", "ọ̀rọ̀ Yorùbá fún risiti"],
  ["Atunse oju yii:", "Àtúnṣe ojú yìí:"],
  ["ki o si daako abajade.", "kí o sì dàkọ àbájáde."],
  ["Ikilo: ko se itumo osise.", "Ìkìlọ̀: kò ṣe ìtumọ̀ òfìsì."],
  ["Ona ise: oju yii ko n se itumo", "Ọ̀nà iṣẹ́: ojú yìí kò ń ṣe ìtumọ̀"],
  ["o n ran e lowo lati seto oro re, yan oju Yoruba", "ó ń ràn ẹ́ lọ́wọ́ láti ṣètò ọ̀rọ̀ rẹ, yan ojú Yorùbá"],
  ["Orisun: awon ọna asopọ wa lati katalogi irinse AfroTools ati phrasebook Yoruba.", "Orísun: àwọn ọ̀nà àsopọ̀ wá láti katalogi irinṣẹ́ AfroTools àti phrasebook Yorùbá."],
  ["Asiri agbegbe: paneli yii n se akopo ninu browser re.", "Àṣírí agbègbè: pánẹ́lì yìí ń ṣe àkópọ̀ nínú aṣàwákiri rẹ."],
  ["Ayewo 2026: ofin, owo, data ati orisun le yipada. Sayewo saaju ipinnu.", "Àyẹ̀wò 2026: òfin, owó, data àti orísun lè yí padà. Ṣàyẹ̀wò ṣáájú ìpinnu."],
  ["Ona: darapo alaye ti o fi kun, abajade irinse ati awon ikilo. Ko je eri osise.", "Ọ̀nà: darapọ̀ àlàyé tí o fi kún, àbájáde irinṣẹ́ àti àwọn ìkìlọ̀. Kò jẹ́ ẹ̀rí òfìsì."],
  ["<strong>2026:</strong> Lo eyi fun eto akoko. Sayewo owo, ofin, ojo, ilera, faili tabi orisun osise saaju ipinnu owo, rira, ilera, ile-iwe tabi isowo.", "<strong>2026:</strong> Lo èyí fún ètò àkókò. Ṣàyẹ̀wò owó, òfin, ọjọ́, ìlera, fáìlì tàbí orísun tó jẹ́ òfìsì ṣáájú ìpinnu owó, rírà, ìlera, ilé-ẹ̀kọ́ tàbí ìṣòwò."],
  [">Seto iwe<", ">Ṣètò ìwé<"],
  [">Gbejade faili<", ">Gbé fáìlì jáde<"],
  [">Sayewo asiri<", ">Ṣàyẹ̀wò àṣírí<"],
  ["<strong>2026:</strong> Asiri: pa faili pataki mo ninu browser re ki o sayewo oju-iwe kikun saaju fifiranse tabi gbigbasil?.", "<strong>2026:</strong> Àṣírí: pa fáìlì pàtàkì mọ́ nínú aṣàwákiri rẹ kí o ṣàyẹ̀wò ojú-ìwé kíkún ṣáájú fífi ránṣẹ́ tàbí gbígbà sílẹ̀."],
  ["<strong>Ona ise:</strong> oju yii ko n se itumo alaifọwọyi. O n ran e lowo lati seto oro re, yan oju Yoruba tabi fallback Gẹẹsi, ki o si mura ohun ti eniyan to mo ede le ṣayẹwo.", "<strong>Ọ̀nà iṣẹ́:</strong> ojú yìí kò ń ṣe ìtumọ̀ aláìfọwọ́yí. Ó ń ràn ẹ́ lọ́wọ́ láti ṣètò ọ̀rọ̀ rẹ, yan ojú Yorùbá tàbí fallback Gẹ̀ẹ́sì, kí o sì múra ohun tí ènìyàn tó mọ èdè lè ṣàyẹ̀wò."],
  ["<strong>Orisun:</strong> awon ọna asopọ wa lati katalogi irinse AfroTools ati phrasebook Yoruba.", "<strong>Orísun:</strong> àwọn ọ̀nà àsopọ̀ wá láti katalogi irinṣẹ́ AfroTools àti phrasebook Yorùbá."]
];

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else if (entry.isFile() && /\.(?:html|js)$/i.test(entry.name)) output.push(file);
  }
  return output;
}

function main() {
  const changed = [];
  const files = walk(path.join(ROOT, "yo")).concat([
    path.join(ROOT, "assets", "js", "components", "tool-registry.js")
  ]);
  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    const before = content;
    for (const pair of replacements.sort((left, right) => right[0].length - left[0].length)) {
      content = content.split(pair[0]).join(pair[1]);
    }
    if (content === before) continue;
    changed.push(path.relative(ROOT, file).replace(/\\/g, "/"));
    if (write) fs.writeFileSync(file, content, "utf8");
  }
  if (changed.length && !write) {
    console.error("Reviewed Yoruba orthography repairs required: " + changed.join(", "));
    process.exitCode = 1;
    return;
  }
  console.log((write ? "Applied" : "Validated") + " reviewed Yoruba orthography repairs in " + changed.length + " file(s).");
}

if (require.main === module) main();

module.exports = { replacements };
