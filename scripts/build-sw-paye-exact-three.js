#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

const TARGETS = {
  burundi: {
    id: 'bi-paye',
    file: 'sw/burundi/kikokotoo-kodi-mshahara/index.html',
    englishFile: 'burundi/bi-paye.html',
    route: '/sw/burundi/kikokotoo-kodi-mshahara/',
    country: 'Burundi',
    currency: 'BIF',
    authority: 'OBR',
    period: '2025/26',
    checkedDate: '2 Agosti 2026',
    fixture: { gross: 500000, tax: 84600, employeeSocial: 18000, net: 397400, employerCost: 529400 },
    seoDescription: 'Kokotoa PAYE ya Burundi kwa mabanda ya OBR pamoja na pensheni ya INSS yenye kikomo cha BIF 450,000 na hatari ya kazi ya mwajiri yenye kikomo cha BIF 80,000.',
    hero: 'PAYE ya OBR yenye mabanda ya 0%, 20% na 30%; pensheni ya mfanyakazi 4% yenye kikomo cha BIF 450,000; pensheni ya mwajiri 6% kwa kikomo hicho; na hatari ya kazi 3% yenye kikomo cha BIF 80,000.',
    fact: '<strong>Ukweli Muhimu 2025/26:</strong> PAYE ni 0% hadi BIF 150,000, 20% kwa sehemu ya BIF 150,001–300,000 na 30% zaidi ya BIF 300,000. Pensheni ya mfanyakazi ni 4% hadi msingi wa BIF 450,000. Mwajiri hulipa 6% kwa msingi huo na 3% ya hatari ya kazi hadi BIF 80,000.',
    sourceMeta: 'Imethibitishwa: 2 Agosti 2026 · Vyanzo: OBR na INSS Burundi · Uhakika wa juu kwa mabanda, viwango na vikomo; thibitisha aina maalum ya mfanyakazi na OBR/INSS',
    toggles: `
              <div class="tog on" data-tog="cnss" onclick="togItem(this)">
                <div class="tog-box"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div><div class="tog-label" id="cnssLabel">Pensheni ya INSS/CNSS</div><div class="tog-rate">4% · kikomo cha msingi BIF 450,000</div></div>
              </div>
              <div class="tog" data-tog="secondary" onclick="togItem(this)">
                <div class="tog-box"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div><div class="tog-label">Ajira ya Pili</div><div class="tog-rate">30% kwa mapato ya ajira yanayotozwa kodi</div></div>
              </div>`,
    note: 'Pensheni ya mfanyakazi ni 4% ya msingi wenye kikomo cha BIF 450,000 na hupunguza mapato yanayotozwa PAYE. Mwajiri hulipa pensheni 6% kwa msingi huo pamoja na hatari ya kazi 3% kwa msingi wenye kikomo cha BIF 80,000.',
    bandsComment: 'OBR TAX BANDS',
    nextComment: 'CNSS',
    cards: `
      <!-- OBR TAX BANDS -->
      <div class="card bands-card">
        <div class="card-head" onclick="toggleBands(this)"><span class="card-title">Mabanda ya OBR 2025/26 (Kwa Mwezi)</span><span class="tog-arrow">▾</span></div>
        <div class="bands-body">
          <div class="band-row"><span class="band-range">BIF 0 – 150,000</span><span class="band-zero">0% — haitozwi kodi</span></div>
          <div class="band-row"><span class="band-range">BIF 150,001 – 300,000</span><span class="band-rate">20% ya sehemu hii</span></div>
          <div class="band-row"><span class="band-range">Zaidi ya BIF 300,000</span><span class="band-rate">BIF 30,000 + 30% ya ziada</span></div>
          <p class="band-note">Mabanda hutumika kwa mapato baada ya pensheni ya mfanyakazi yenye kikomo. Ajira ya pili hutumia 30% kwa mapato ya ajira yanayotozwa kodi.</p>
        </div>
      </div>
      <!-- CNSS -->
      <div class="card bands-card">
        <div class="card-head" onclick="toggleBands(this)"><span class="card-title">Pensheni na Hatari ya Kazi</span><span class="tog-arrow">▾</span></div>
        <div class="bands-body">
          <div class="band-row"><span class="band-range">Mfanyakazi</span><span class="band-rate">4% · msingi hadi BIF 450,000</span></div>
          <div class="band-row"><span class="band-range">Mwajiri — pensheni</span><span class="band-rate">6% · msingi hadi BIF 450,000</span></div>
          <div class="band-row"><span class="band-range">Mwajiri — hatari ya kazi</span><span class="band-rate">3% · msingi hadi BIF 80,000</span></div>
          <p class="band-note">Kwa BIF 500,000, mfanyakazi hulipa BIF 18,000; gharama ya mwajiri ya pensheni na hatari ni BIF 29,400.</p>
        </div>
      </div>`,
    faqs: [
      ['Mabanda ya PAYE ya Burundi ni yapi?', 'PAYE ni 0% hadi BIF 150,000, 20% kwa sehemu ya BIF 150,001–300,000, na 30% kwa sehemu inayozidi BIF 300,000 kwa mwezi.'],
      ['Pensheni ya mfanyakazi Burundi inahesabiwaje?', 'Mchango wa mfanyakazi ni 4% ya mshahara hadi msingi wa BIF 450,000, hivyo mchango wa juu unaokokotolewa hapa ni BIF 18,000 kwa mwezi. Mchango huo hupunguza mapato yanayotozwa PAYE.'],
      ['Mwajiri analipa kiasi gani?', 'Mwajiri hulipa pensheni 6% kwa msingi wenye kikomo cha BIF 450,000 pamoja na hatari ya kazi 3% kwa msingi wenye kikomo cha BIF 80,000.'],
      ['Mfano wa BIF 500,000 unatoka vipi?', 'Kwa BIF 500,000: pensheni ya mfanyakazi ni BIF 18,000, PAYE ni BIF 84,600, mshahara halisi ni BIF 397,400, na gharama ya mwajiri ni BIF 529,400.'],
    ],
    guide: [
      'Kikokotoo hiki hutumia mabanda ya kila mwezi ya OBR: 0% hadi BIF 150,000, 20% hadi BIF 300,000, na 30% kwa ziada.',
      'Pensheni ya mfanyakazi ni 4% kwa msingi wenye kikomo cha BIF 450,000. Kwa upande wa mwajiri, pensheni ni 6% kwa msingi huo na hatari ya kazi ni 3% kwa msingi wenye kikomo cha BIF 80,000.',
      '<strong>Mfano uliokaguliwa:</strong> ghafi BIF 500,000 → PAYE BIF 84,600; pensheni ya mfanyakazi BIF 18,000; halisi BIF 397,400; gharama ya mwajiri BIF 529,400.',
    ],
    sources: [
      ['OBR — tovuti rasmi ya mamlaka ya kodi', 'https://obr.gov.bi'],
      ['INSS Burundi — vikomo na viwango vya michango', 'https://inss.gov.bi/calcul-des-cotisations/'],
    ],
    law: 'Mabanda ya OBR 0%/20%/30% · pensheni 4%/6% yenye kikomo · hatari ya kazi 3% yenye kikomo.',
  },
  rwanda: {
    id: 'rw-paye',
    file: 'sw/rwanda/kikokotoo-kodi-mshahara/index.html',
    englishFile: 'rwanda/rw-paye.html',
    route: '/sw/rwanda/kikokotoo-kodi-mshahara/',
    country: 'Rwanda',
    currency: 'RWF',
    authority: 'RRA',
    period: '2025/26',
    checkedDate: '3 Agosti 2026',
    fixture: { gross: 300000, tax: 48600, employeeSocial: 19157, net: 231343, employerCost: 324900 },
    seoDescription: 'Kokotoa PAYE ya Rwanda pamoja na pensheni na uzazi wa RSSB, CBHI ya lazima ya 0.5% ya mshahara halisi, na mchango wa hatari ya kazi wa mwajiri 2%.',
    hero: 'PAYE ya RRA yenye mabanda ya 0%, 10%, 20% na 30%; pensheni ya RSSB 6% kwa kila upande; uzazi 0.3% kwa kila upande; CBHI 0.5% ya mshahara halisi wa mfanyakazi; na hatari ya kazi ya mwajiri 2%.',
    fact: '<strong>Ukweli Muhimu wa sasa:</strong> PAYE ni 0% hadi RWF 60,000, 10% hadi RWF 100,000, 20% hadi RWF 200,000 na 30% zaidi ya hapo. Pensheni ya RSSB ni 6% kwa kila upande, uzazi ni 0.3% kwa kila upande, CBHI ni 0.5% ya mshahara halisi wa mfanyakazi, na hatari ya kazi ni 2% kwa mwajiri.',
    sourceMeta: 'Imethibitishwa: 3 Agosti 2026 · Vyanzo: RRA, RSSB na Gazeti Rasmi · Uhakika wa juu kwa PAYE, pensheni, uzazi na hatari ya kazi; wastani kwa tafsiri na mzunguko wa CBHI',
    toggles: `
              <div class="tog on" data-tog="rssb" onclick="togItem(this)">
                <div class="tog-box"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div><div class="tog-label" id="rssbLabel">RSSB Pensheni</div><div class="tog-rate">6% mfanyakazi — inapunguza mapato ya PAYE</div></div>
              </div>
              <div class="tog" data-tog="secondary" onclick="togItem(this)">
                <div class="tog-box"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div><div class="tog-label">Ajira ya Pili</div><div class="tog-rate">Kiwango tambarare 30% kwa ghafi</div></div>
              </div>`,
    note: 'Pensheni ya RSSB ya mfanyakazi ni 6% na hupunguza mapato yanayotozwa PAYE. Uzazi ni 0.3% kwa kila upande. CBHI ya lazima ni 0.5% ya mshahara halisi wa mfanyakazi na hutatuliwa pamoja na halisi; mwajiri hukusanya na kuwasilisha. Mwajiri pia hulipa 2% kwa hatari ya kazi.',
    bandsComment: 'RRA TAX BANDS',
    nextComment: 'RSSB & MATERNITY',
    cards: `
      <!-- RRA TAX BANDS -->
      <div class="card bands-card">
        <div class="card-head" onclick="toggleBands(this)"><span class="card-title">Mabanda ya RRA 2025/26 (Kwa Mwezi)</span><span class="tog-arrow">▾</span></div>
        <div class="bands-body">
          <div class="band-row"><span class="band-range">RWF 0 – 60,000</span><span class="band-zero">0%</span></div>
          <div class="band-row"><span class="band-range">RWF 60,001 – 100,000</span><span class="band-rate">10%</span></div>
          <div class="band-row"><span class="band-range">RWF 100,001 – 200,000</span><span class="band-rate">20%</span></div>
          <div class="band-row"><span class="band-range">Zaidi ya RWF 200,000</span><span class="band-rate">30%</span></div>
          <p class="band-note">Mabanda hutumika kwa mapato baada ya RSSB ya mfanyakazi. Ajira ya pili hutumia 30% kwa ghafi.</p>
        </div>
      </div>
      <!-- RSSB & MATERNITY -->
      <div class="card bands-card">
        <div class="card-head" onclick="toggleBands(this)"><span class="card-title">RSSB na Mchango wa Uzazi</span><span class="tog-arrow">▾</span></div>
        <div class="bands-body">
          <div class="band-row"><span class="band-range">RSSB ya mfanyakazi</span><span class="band-rate">6%</span></div>
          <div class="band-row"><span class="band-range">RSSB ya mwajiri</span><span class="band-rate">6%</span></div>
          <div class="band-row"><span class="band-range">Mchango wa uzazi</span><span class="band-rate">0.3% mfanyakazi + 0.3% mwajiri</span></div>
          <div class="band-row"><span class="band-range">CBHI ya lazima</span><span class="band-rate">0.5% ya mshahara halisi</span></div>
          <div class="band-row"><span class="band-range">Hatari ya kazi</span><span class="band-rate">2% mwajiri</span></div>
          <p class="band-note">Kwa RWF 300,000, pensheni ni RWF 18,000 kwa kila upande, uzazi ni RWF 900 kwa kila upande, CBHI ni RWF 1,157 baada ya kutatua 0.5% ya mshahara halisi, na hatari ya kazi ya mwajiri ni RWF 6,000.</p>
        </div>
      </div>`,
    faqs: [
      ['Mabanda ya PAYE ya Rwanda ni yapi?', 'PAYE ni 0% hadi RWF 60,000, 10% kwa RWF 60,001–100,000, 20% kwa RWF 100,001–200,000, na 30% kwa sehemu inayozidi RWF 200,000 kwa mwezi.'],
      ['Kiwango cha RSSB ni kiasi gani?', 'RSSB ni 6% ya mshahara ghafi kwa mfanyakazi na 6% kwa mwajiri. Mchango wa mfanyakazi hupunguza mapato yanayotozwa PAYE.'],
      ['CBHI na hatari ya kazi hulipwa na nani?', 'CBHI ya lazima ni 0.5% ya mshahara halisi wa mfanyakazi na hukusanywa na kuwasilishwa na mwajiri. Mwajiri hulipa mchango wa hatari ya kazi wa 2%; hakuna sehemu ya mfanyakazi katika mchango huo.'],
      ['Mfano wa RWF 300,000 unatoka vipi?', 'Kwa RWF 300,000: PAYE ni RWF 48,600; pensheni ya mfanyakazi ni RWF 18,000; uzazi wa mfanyakazi ni RWF 900; CBHI ni RWF 1,157; halisi ni RWF 231,343; na gharama ya mwajiri ni RWF 324,900.'],
    ],
    guide: [
      'Kikokotoo hutumia mabanda manne ya kila mwezi ya RRA: 0% hadi RWF 60,000, 10% hadi RWF 100,000, 20% hadi RWF 200,000, na 30% kwa ziada.',
      'Pensheni ya RSSB ni 6% kwa mfanyakazi na 6% kwa mwajiri. Uzazi ni 0.3% kwa kila upande; CBHI ni 0.5% ya mshahara halisi wa mfanyakazi. Kwa kuwa notisi ya RSSB haielezi mpangilio wa mzunguko, kikokotoo hutumia CBHI = round((halisi kabla ya CBHI × 0.5%) / 1.005); thibitisha mzunguko wa malipo na RSSB. Hatari ya kazi ya mwajiri ni 2%.',
      '<strong>Mfano uliokaguliwa:</strong> ghafi RWF 300,000 → PAYE RWF 48,600; pensheni RWF 18,000; uzazi RWF 900; CBHI RWF 1,157; halisi RWF 231,343; gharama ya mwajiri RWF 324,900.',
    ],
    sources: [
      ['RRA — tovuti rasmi ya mamlaka ya kodi', 'https://rra.gov.rw'],
      ['RSSB — mpango wa CBHI', 'https://www.rssb.rw/scheme/cbhi-scheme'],
      ['RSSB — notisi kwa waajiri: CBHI 0.5% ya mshahara halisi', 'https://www.rssb.rw/fileadmin/user_upload/Announcement_to_all_employers_.pdf'],
      ['Gazeti Rasmi — Agizo la Waziri Mkuu N° 034/01, 13 Februari 2020', 'https://www.rssb.rw/fileadmin/user_upload/Prime_Minister_s_order_CBHI-subsidies_13th_February_2020.pdf'],
      ['RSSB — hatari ya kazi 2% ya mwajiri', 'https://www.rssb.rw/scheme/occupational-hazards'],
    ],
    law: 'Mabanda ya RRA 0%/10%/20%/30% · pensheni RSSB 6% kila upande · uzazi 0.3% kila upande · CBHI 0.5% ya mshahara halisi wa mfanyakazi · hatari ya kazi 2% mwajiri.',
  },
  uganda: {
    id: 'ug-paye',
    file: 'sw/uganda/kikokotoo-kodi-mshahara/index.html',
    englishFile: 'uganda/ug-paye.html',
    route: '/sw/uganda/kikokotoo-kodi-mshahara/',
    country: 'Uganda',
    currency: 'UGX',
    authority: 'URA',
    period: 'viwango vya sasa vya URA',
    checkedDate: '2 Agosti 2026',
    fixture: { gross: 2000000, tax: 472000, employeeSocial: 100000, lst: 100000, net: 1328000, employerCost: 2200000 },
    seoDescription: 'Kokotoa PAYE ya sasa ya Uganda kwa mkazi au asiye mkazi, NSSF tofauti, na LST ya mwaka inayotathminiwa kwa mshahara ghafi na kupunguzwa kabla ya PAYE.',
    hero: 'PAYE ya sasa ya URA kwa mkazi: 0% hadi UGX 235,000, kisha 10%, 20% na 30%, pamoja na nyongeza ya 10% kwa sehemu inayozidi UGX 10,000,000. Jedwali la asiye mkazi ni la hatua. NSSF ni 5%/10% na haipunguzi PAYE; LST huchaguliwa kwa mshahara ghafi wa mwezi, kisha hukatwa kabla ya PAYE.',
    fact: '<strong>Viwango vilivyothibitishwa 2 Agosti 2026:</strong> Mkazi hulipa 0% hadi UGX 235,000, 10% hadi UGX 335,000, 20% hadi UGX 410,000 na 30% zaidi ya hapo; sehemu inayozidi UGX 10,000,000 ina nyongeza ya 10%. Asiye mkazi hutumia jedwali la 10%, 20% na 30% pamoja na nyongeza hiyo. Muswada ambao haujaidhinishwa haujatumiwa kama sheria inayotumika.',
    sourceMeta: 'Imethibitishwa: 2 Agosti 2026 · Vyanzo: URA, KCCA na NSSF Uganda · Uhakika wa juu kwa mabanda ya PAYE, LST na NSSF; si muswada ambao haujaidhinishwa',
    disclaimer: '<strong>Onyo:</strong> Kwa madhumuni ya habari na kupanga pekee. Si ushauri wa kodi au kisheria. Viwango vya sasa vimetokana na kurasa rasmi za URA; LST imetokana na mwongozo wa KCCA; NSSF imetokana na NSSF Uganda. Imethibitishwa 2 Agosti 2026.',
    toggles: `
              <div class="tog on" data-tog="nssf" onclick="togItem(this)">
                <div class="tog-box"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div><div class="tog-label" id="nssfLabel">NSSF</div><div class="tog-rate">5% mfanyakazi · haipunguzi PAYE</div></div>
              </div>
              <div class="tog" data-tog="lst" onclick="togItem(this)">
                <div class="tog-box"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div><div class="tog-label">LST (hiari)</div><div class="tog-rate">Jedwali rasmi la mwaka · imezimwa kwa chaguo-msingi</div></div>
              </div>
              <div class="tog" data-tog="nonres" onclick="togItem(this)">
                <div class="tog-box"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div><div class="tog-label">Asiye Mkazi</div><div class="tog-rate">Jedwali la 10% / 20% / 30% + nyongeza ya mapato ya juu</div></div>
              </div>`,
    note: 'NSSF ya mfanyakazi ni 5% na ya mwajiri ni 10%; NSSF haipunguzwi kabla ya PAYE. LST ni ya hiari na imezimwa kwa chaguo-msingi. Ukiiwasha, jedwali la KCCA hutumia mshahara ghafi wa mwezi; tathmini ya mwaka hukatwa kabla ya PAYE. Mwajiri anaweza kukusanya tathmini hiyo kwa awamu zisizozidi nne.',
    bandsComment: 'URA TAX BANDS',
    nextComment: 'NSSF',
    cards: `
      <!-- URA TAX BANDS -->
      <div class="card bands-card">
        <div class="card-head" onclick="toggleBands(this)"><span class="card-title">Mabanda ya Sasa ya URA (Kwa Mwezi)</span><span class="tog-arrow">▾</span></div>
        <div class="bands-body">
          <div class="band-row"><span class="band-range">Mkazi: UGX 0 – 235,000</span><span class="band-zero">0%</span></div>
          <div class="band-row"><span class="band-range">Mkazi: UGX 235,001 – 335,000</span><span class="band-rate">10%</span></div>
          <div class="band-row"><span class="band-range">Mkazi: UGX 335,001 – 410,000</span><span class="band-rate">20%</span></div>
          <div class="band-row"><span class="band-range">Mkazi: UGX 410,001 – 10,000,000</span><span class="band-rate">UGX 25,000 + 30% ya ziada</span></div>
          <div class="band-row"><span class="band-range">Mkazi: zaidi ya UGX 10,000,000</span><span class="band-rate">Kiasi cha bendi + nyongeza ya 10% ya ziada</span></div>
          <div class="band-row"><span class="band-range">Asiye mkazi: UGX 0 – 335,000</span><span class="band-rate">10%</span></div>
          <div class="band-row"><span class="band-range">Asiye mkazi: UGX 335,001 – 410,000</span><span class="band-rate">UGX 33,500 + 20% ya ziada</span></div>
          <div class="band-row"><span class="band-range">Asiye mkazi: zaidi ya UGX 410,000</span><span class="band-rate">UGX 48,500 + 30% ya ziada; nyongeza ya 10% juu ya UGX 10m</span></div>
          <p class="band-note">LST huchaguliwa kutoka jedwali la KCCA kwa mshahara ghafi wa mwezi, kisha hupunguzwa kutoka ghafi kabla ya kutumia jedwali la PAYE. NSSF haipunguzi msingi wa PAYE.</p>
        </div>
      </div>
      <!-- NSSF -->
      <div class="card bands-card">
        <div class="card-head" onclick="toggleBands(this)"><span class="card-title">NSSF na LST</span><span class="tog-arrow">▾</span></div>
        <div class="bands-body">
          <div class="band-row"><span class="band-range">NSSF ya mfanyakazi</span><span class="band-rate">5% · haitolewi kabla ya PAYE</span></div>
          <div class="band-row"><span class="band-range">NSSF ya mwajiri</span><span class="band-rate">10%</span></div>
          <div class="band-row"><span class="band-range">LST</span><span class="band-rate">Jedwali rasmi la mwaka · hiari</span></div>
          <p class="band-note">LST imezimwa kwa chaguo-msingi. Ukiiwasha, injini hutathmini jedwali la KCCA kwa mshahara ghafi wa mwezi na kupunguza LST kabla ya PAYE. Kiasi cha mwaka kinaweza kukusanywa kwa awamu zisizozidi nne.</p>
        </div>
      </div>`,
    faqs: [
      ['Mabanda ya PAYE ya mkazi Uganda ni yapi?', 'PAYE ni 0% hadi UGX 235,000, 10% kwa UGX 235,001–335,000, 20% kwa UGX 335,001–410,000, na UGX 25,000 pamoja na 30% ya sehemu inayozidi UGX 410,000. Zaidi ya UGX 10,000,000 kuna nyongeza ya 10% kwa sehemu ya ziada.'],
      ['Asiye mkazi hulipa PAYE kiasi gani?', 'Asiye mkazi hutumia jedwali la hatua: 10% hadi UGX 335,000; UGX 33,500 pamoja na 20% ya ziada hadi UGX 410,000; kisha UGX 48,500 pamoja na 30% ya ziada. Sehemu inayozidi UGX 10,000,000 ina nyongeza ya 10%.'],
      ['NSSF inapunguza mapato ya PAYE?', 'Hapana. NSSF ni 5% kwa mfanyakazi na 10% kwa mwajiri, lakini PAYE hukokotolewa kwa mshahara ghafi bila kupunguza NSSF.'],
      ['LST inahesabiwaje?', 'LST ni chaguo la hiari lililozimwa kwa chaguo-msingi. Jedwali la KCCA hutumia mshahara ghafi wa mwezi, na tathmini ya mwaka hupunguzwa kabla ya PAYE. Mwajiri anaweza kuikusanya kwa awamu zisizozidi nne.'],
      ['Mfano rasmi wa UGX 420,000 unatoka vipi?', 'Mwongozo wa KCCA unaonyesha ghafi UGX 420,000: LST ya mwaka ni UGX 30,000, msingi wa PAYE ni UGX 390,000, PAYE ni UGX 21,000. NSSF ikiwa imewashwa ni UGX 21,000 na halisi ni UGX 348,000.'],
      ['Mfano wa UGX 2,000,000 unatoka vipi?', 'LST ikiwa imewashwa, jedwali linatoa LST ya mwaka UGX 100,000 na msingi wa PAYE ni UGX 1,900,000. PAYE ni UGX 472,000; NSSF ya mfanyakazi ni UGX 100,000; halisi ni UGX 1,328,000; gharama ya mwajiri ni UGX 2,200,000.'],
    ],
    guide: [
      'Kwa mkazi, kikokotoo hutumia 0% hadi UGX 235,000, 10% hadi UGX 335,000, 20% hadi UGX 410,000 na 30% kwa ziada. Sehemu inayozidi UGX 10,000,000 ina nyongeza ya 10%. Asiye mkazi hutumia jedwali rasmi la hatua, si kiwango tambarare.',
      'NSSF ni 5% kwa mfanyakazi na 10% kwa mwajiri na haipunguzi PAYE. LST ikiwa imechaguliwa hutokana na jedwali la KCCA la mshahara ghafi wa mwezi na hupunguzwa kabla ya PAYE. Tathmini ya mwaka inaweza kukusanywa kwa awamu zisizozidi nne.',
      '<strong>Mfano rasmi wa KCCA uliokaguliwa:</strong> ghafi UGX 420,000 na LST imewashwa → LST UGX 30,000; msingi wa PAYE UGX 390,000; PAYE UGX 21,000; NSSF UGX 21,000; halisi UGX 348,000.',
      '<strong>Mfano uliokaguliwa:</strong> ghafi UGX 2,000,000 na LST imewashwa → LST UGX 100,000; msingi wa PAYE UGX 1,900,000; PAYE UGX 472,000; NSSF UGX 100,000; halisi UGX 1,328,000; gharama ya mwajiri UGX 2,200,000.',
    ],
    sources: [
      ['URA — viwango vya PAYE', 'https://ura.go.ug/en/domestic-taxes/paye-rates/'],
      ['Bunge la Uganda — Muswada wa 2026 ulirejeshwa bila idhini', 'https://www.parliament.go.ug/news/4488/president-museveni-returns-two-tax-bills-parliament'],
      ['Sheria ya Kodi ya Mapato ya Uganda — maandishi yaliyounganishwa', 'https://ulii.org/en/akn/ug/act/1997/11/eng@2024-12-23'],
      ['URA — kodi ya mapato ya ajira na punguzo la LST', 'https://ura.go.ug/en/taxes-on-employment-income/'],
      ['KCCA — jedwali rasmi na awamu za LST', 'https://kcca.go.ug/uDocs/Local_Service_Tax_FAQs.pdf'],
      ['NSSF Uganda — 5% ya mfanyakazi na 10% ya mwajiri', 'https://www.nssfug.org/about-us/membership/'],
    ],
    law: 'Viwango vya sasa vya URA: mkazi 0%/10%/20%/30% + nyongeza ya 10% juu ya UGX 10m; asiye mkazi 10%/20%/30% + nyongeza; NSSF 5%/10% isiyopunguza PAYE; LST ya KCCA huchaguliwa kwa mshahara ghafi wa mwezi na hupunguzwa kabla ya PAYE. Imethibitishwa 2 Agosti 2026.',
  },
};

function replaceOne(source, regex, replacement, label) {
  const matches = source.match(regex);
  if (!matches) throw new Error(`Missing ${label}`);
  return source.replace(regex, replacement);
}

function replaceNamedFunction(source, name, replacement) {
  const matcher = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`, 'g');
  const match = matcher.exec(source);
  if (!match) throw new Error(`Missing function ${name}`);
  const start = match.index;
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let templateDepth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (escaped) { escaped = false; continue; }
    if (quote) {
      if (char === '\\') escaped = true;
      else if (quote === '`' && char === '$' && next === '{') { templateDepth += 1; index += 1; }
      else if (quote === '`' && char === '}' && templateDepth > 0) templateDepth -= 1;
      else if (char === quote && templateDepth === 0) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) {
      return `${source.slice(0, start)}${replacement}${source.slice(index + 1)}`;
    }
  }
  throw new Error(`Unbalanced function ${name}`);
}

function schema(config) {
  const items = config.faqs.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  }));
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items,
  })}</script>`;
}

function howTo(config) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Jinsi ya Kukokotoa PAYE ya ${config.country} ${config.period}`,
    description: config.hero,
    totalTime: 'PT1M',
    tool: { '@type': 'HowToTool', name: `AfroTools PAYE ${config.country}` },
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Ingiza mshahara ghafi', text: `Ingiza mshahara wa mwezi kwa ${config.currency}.` },
      { '@type': 'HowToStep', position: 2, name: 'Kagua chaguo', text: config.note },
      { '@type': 'HowToStep', position: 3, name: 'Kokotoa', text: 'Angalia PAYE, makato ya mfanyakazi, mshahara halisi na gharama ya mwajiri.' },
      { '@type': 'HowToStep', position: 4, name: 'Hamisha ripoti', text: 'Pakua ripoti ya ndani ya PDF baada ya matokeo halali.' },
    ],
  })}</script>`;
}

function faqHtml(config) {
  return `<!-- FAQ -->
<section class="faq-sec">
  <div class="faq-inner">
    <span class="eyebrow">Maswali ya Kodi ${config.country}</span>
    <h2 class="sec-title">Maswali ya Kawaida kuhusu PAYE</h2>
    <div class="faq-grid">
${config.faqs.map(([q, a]) => `      <div class="faq-item"><div class="faq-q">${q}</div><p class="faq-a">${a}</p></div>`).join('\n')}
    </div>
  </div>
</section>`;
}

function guideHtml(config) {
  const sources = config.sources?.length
    ? `<h3 style="font-size:1rem;font-weight:700;margin:1.5rem 0 0.5rem;color:#1e293b;">Vyanzo rasmi na uhakiki</h3>
  <ul style="color:#374151;line-height:1.75;margin:0 0 1rem 1.25rem;">${config.sources.map(([label, href]) => `<li><a href="${href}" rel="noopener noreferrer">${label}</a></li>`).join('')}</ul>
  <p style="color:#6b7280;font-size:0.85rem;line-height:1.6;">Imethibitishwa: ${config.checkedDate}. Viwango vinaweza kubadilika; angalia vyanzo rasmi kabla ya uamuzi wa mishahara.</p>`
    : '';
  return `<!-- SEO GUIDE SECTION -->
<section style="max-width:800px;margin:2.5rem auto;padding:2rem;background:#fff;border-radius:0.875rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <h2 style="font-size:1.35rem;font-weight:700;margin-bottom:1rem;color:#1e293b;">Jinsi PAYE ya ${config.country} Inavyohesabiwa ${config.period}</h2>
  ${config.guide.map((p) => `<p style="color:#374151;line-height:1.75;margin-bottom:1rem;">${p}</p>`).join('\n  ')}
  ${sources}
  <p style="color:#6b7280;font-size:0.85rem;line-height:1.6;margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e5e7eb;">Makadirio ya kupanga pekee. Thibitisha viwango na ${config.authority} au mtaalamu wa kodi aliyehitimu kabla ya uamuzi wa mishahara.</p>
</section>

<!-- MORE TOOLS -->`;
}

function controller(config) {
  const invalid = `
function invalidateResult(message) {
  RESULT = null;
  const results = document.getElementById('resultsCard');
  if (results) results.classList.remove('on');
  const strip = document.getElementById('employerStrip');
  if (strip) { strip.classList.remove('on'); strip.textContent = ''; }
  const aiBtn = document.getElementById('aiBtn');
  if (aiBtn) { aiBtn.disabled = true; aiBtn.textContent = 'Kokotoa kwanza ili kufungua →'; }
  const aiStatus = document.getElementById('aiStatus');
  if (aiStatus) { aiStatus.style.display = ''; aiStatus.textContent = message || 'Ingiza mshahara halali ili kupata matokeo mapya.'; }
}`;
  const preset = `
function setPreset(val, btn) {
  document.getElementById('grossSalary').value = val;
  document.getElementById('salarySlider').value = val;
  onSlider(document.getElementById('salarySlider'));
  document.querySelectorAll('.preset-btn').forEach((button) => button.classList.remove('active'));
  if (btn) btn.classList.add('active');
  calculate();
}`;

  if (config.id === 'bi-paye') return `<!-- sw-paye-exact-three:controller:start -->
function calcMonthlyPAYE(monthlyTaxableIncome) {
  const income = Math.max(0, monthlyTaxableIncome);
  const bandBreakdown = [];
  if (income <= 150000) return { tax: 0, bandBreakdown: [{ rate: 0, income, tax: 0 }] };
  let tax = 0;
  bandBreakdown.push({ rate: 0, income: 150000, tax: 0 });
  const middle = Math.min(income - 150000, 150000);
  tax += middle * 0.20;
  bandBreakdown.push({ rate: 0.20, income: middle, tax: middle * 0.20 });
  if (income > 300000) {
    const top = income - 300000;
    tax += top * 0.30;
    bandBreakdown.push({ rate: 0.30, income: top, tax: top * 0.30 });
  }
  return { tax, bandBreakdown: bandBreakdown.filter((band) => band.income > 0) };
}
${preset}
${invalid}
function calculate() {
  const gross = Number(document.getElementById('grossSalary').value);
  if (!Number.isFinite(gross) || gross <= 0) {
    invalidateResult('Ingiza mshahara halali ulio zaidi ya sifuri.');
    document.getElementById('grossSalary').focus();
    return;
  }
  const isSecondary = isOn('secondary');
  const hasPension = isOn('cnss');
  const pensionBase = Math.min(gross, 450000);
  const riskBase = Math.min(gross, 80000);
  const socialRate = hasPension ? 0.04 : 0;
  const social = pensionBase * socialRate;
  const employerPension = pensionBase * 0.06;
  const employerRisk = riskBase * 0.03;
  const empSocial = employerPension + employerRisk;
  const taxableIncome = Math.max(0, gross - social);
  const taxResult = isSecondary
    ? { tax: taxableIncome * 0.30, bandBreakdown: [{ rate: 0.30, income: taxableIncome, tax: taxableIncome * 0.30, isFlat: true }] }
    : calcMonthlyPAYE(taxableIncome);
  const monthlyPAYE = taxResult.tax;
  const totalEmployeeDeductions = social + monthlyPAYE;
  const netMonthly = gross - totalEmployeeDeductions;
  const annual = (value) => value * 12;
  RESULT = {
    gross, monthly: gross, social, socialRate, empSocial, pensionBase, riskBase,
    employerPension, employerRisk, taxableIncome, monthlyPAYE,
    bandBreakdown: taxResult.bandBreakdown, isSecondary, sector: SECTOR,
    totalEmployeeDeductions, netMonthly, effectiveRate: monthlyPAYE / gross,
    annualGross: annual(gross), annualNet: annual(netMonthly),
    annualTax: annual(monthlyPAYE), annualSocial: annual(social),
    annualTaxableIncome: annual(taxableIncome),
    totalEmployerCostMonthly: gross + empSocial,
  };
  publishResult('Ghafi pamoja na pensheni ya mwajiri ' + fmt(employerPension) + ' na hatari ya kazi ' + fmt(employerRisk) + '.', gross, netMonthly, monthlyPAYE);
}
<!-- sw-paye-exact-three:controller:end -->`;

  if (config.id === 'rw-paye') return `<!-- sw-paye-exact-three:controller:start -->
function calcMonthlyPAYE(monthlyTaxableIncome) {
  const income = Math.max(0, monthlyTaxableIncome);
  const bandBreakdown = [];
  if (income <= 60000) return { tax: 0, bandBreakdown: [{ rate: 0, income, tax: 0 }] };
  let tax = 0;
  bandBreakdown.push({ rate: 0, income: 60000, tax: 0 });
  const second = Math.min(income - 60000, 40000);
  tax += second * 0.10;
  bandBreakdown.push({ rate: 0.10, income: second, tax: second * 0.10 });
  if (income > 100000) {
    const third = Math.min(income - 100000, 100000);
    tax += third * 0.20;
    bandBreakdown.push({ rate: 0.20, income: third, tax: third * 0.20 });
  }
  if (income > 200000) {
    const top = income - 200000;
    tax += top * 0.30;
    bandBreakdown.push({ rate: 0.30, income: top, tax: top * 0.30 });
  }
  return { tax, bandBreakdown: bandBreakdown.filter((band) => band.income > 0) };
}
function solveEmployeeCbhi(preCbhiNet) {
  const availableNet = Math.max(0, preCbhiNet);
  return Math.round((availableNet * 0.005) / 1.005);
}
${preset}
${invalid}
function calculate() {
  const gross = Number(document.getElementById('grossSalary').value);
  if (!Number.isFinite(gross) || gross <= 0) {
    invalidateResult('Ingiza mshahara halali ulio zaidi ya sifuri.');
    document.getElementById('grossSalary').focus();
    return;
  }
  const isSecondary = isOn('secondary');
  const hasRSSB = isOn('rssb');
  const rssbRate = hasRSSB ? 0.06 : 0;
  const rssb = gross * rssbRate;
  const empRssb = gross * 0.06;
  const employeeMaternity = gross * 0.003;
  const employerMaternity = gross * 0.003;
  const employerOccupationalHazard = gross * 0.02;
  const taxableIncome = Math.max(0, gross - rssb);
  const taxResult = isSecondary
    ? { tax: gross * 0.30, bandBreakdown: [{ rate: 0.30, income: gross, tax: gross * 0.30, isFlat: true }] }
    : calcMonthlyPAYE(taxableIncome);
  const monthlyPAYE = taxResult.tax;
  const employeeCbhi = solveEmployeeCbhi(gross - rssb - employeeMaternity - monthlyPAYE);
  const totalEmployeeDeductions = rssb + employeeMaternity + employeeCbhi + monthlyPAYE;
  const netMonthly = gross - totalEmployeeDeductions;
  const annual = (value) => value * 12;
  RESULT = {
    gross, monthly: gross, rssb, social: rssb + employeeCbhi, rssbRate, socialRate: (rssb + employeeCbhi) / gross,
    empRssb, empSocial: empRssb + employerOccupationalHazard,
    employeeMaternity, empMaternity: employeeMaternity, employeeCbhi,
    employerMaternity, maternity: employerMaternity, employerOccupationalHazard, taxableIncome, monthlyPAYE,
    bandBreakdown: taxResult.bandBreakdown, isSecondary, sector: SECTOR,
    totalEmployeeDeductions, netMonthly, effectiveRate: monthlyPAYE / gross,
    annualGross: annual(gross), annualNet: annual(netMonthly),
    annualTax: annual(monthlyPAYE), annualRssb: annual(rssb),
    annualSocial: annual(rssb + employeeCbhi), annualEmployeeMaternity: annual(employeeMaternity),
    annualEmployeeCbhi: annual(employeeCbhi),
    totalEmployerCostMonthly: gross + empRssb + employerMaternity + employerOccupationalHazard,
  };
  publishResult('Ghafi pamoja na pensheni ya mwajiri ' + fmt(empRssb) + ', uzazi ' + fmt(employerMaternity) + ' na hatari ya kazi ' + fmt(employerOccupationalHazard) + '.', gross, netMonthly, monthlyPAYE);
}
<!-- sw-paye-exact-three:controller:end -->`;

  return `<!-- sw-paye-exact-three:controller:start -->
function ugandaPayeEngine() {
  const engine = window.AfroTools && window.AfroTools.ugandaPaye;
  if (!engine) throw new Error('Injini ya PAYE ya Uganda haikupatikana. Pakia ukurasa upya.');
  return engine;
}
function calcMonthlyPAYE(monthlyTaxableIncome, isNonResident) {
  const value = ugandaPayeEngine().taxMonthly(monthlyTaxableIncome, isNonResident ? 'NON_RESIDENT' : 'RESIDENT');
  if (!value.ok) throw new Error(value.error);
  return { tax: value.tax, bandBreakdown: value.bands };
}
function calcAnnualLST(monthlyGross, regime) { return ugandaPayeEngine().annualLst(monthlyGross, regime || 'RESIDENT'); }
${preset}
${invalid}
function calculate() {
  const gross = Number(document.getElementById('grossSalary').value);
  if (!Number.isFinite(gross) || gross <= 0) {
    invalidateResult('Ingiza mshahara halali ulio zaidi ya sifuri.');
    document.getElementById('grossSalary').focus();
    return;
  }
  const isNonRes = isOn('nonres');
  const hasNSSF = isOn('nssf');
  const hasLST = isOn('lst');
  const value = ugandaPayeEngine().calculate({ grossMonthly: gross, regime: isNonRes ? 'NON_RESIDENT' : 'RESIDENT', nssfEnabled: hasNSSF, lstEnabled: hasLST });
  if (!value.ok) { invalidateResult(value.error); return; }
  const nssf = value.employeeNssfMonthly;
  const empNSSF = value.employerNssfMonthly;
  const lstAnnual = value.lstAnnual;
  const taxableIncome = value.taxableIncome;
  const monthlyPAYE = value.monthlyPaye;
  const lstPayrollDeduction = value.lstPayrollDeduction;
  const totalEmployeeDeductions = nssf + monthlyPAYE + lstPayrollDeduction;
  const netMonthly = value.netMonthly;
  const annual = (amount) => amount * 12;
  const annualTax = value.annualPaye;
  const annualNSSF = value.employeeNssfAnnual;
  const annualNet = value.netAnnual;
  RESULT = {
    gross, monthly: gross, nssf, social: nssf, empNSSF, empSocial: empNSSF,
    monthlyPAYE, bandBreakdown: value.bands, isNonRes, taxableIncome,
    lstBase: value.lstAssessmentGross,
    lstAssessmentGross: value.lstAssessmentGross,
    lstCollectionSchedule: value.lstCollectionSchedule,
    lstPayrollDeduction, lstAnnual, hasLST,
    totalEmployeeDeductions, netMonthly, effectiveRate: value.effectiveTaxRate,
    annualGross: annual(gross), annualNet,
    annualTax, annualNSSF,
    annualSocial: annualNSSF, annualLST: lstAnnual,
    totalEmployerCostMonthly: value.employerCostMonthly,
  };
  publishResult('Ghafi pamoja na NSSF ya mwajiri ' + fmt(empNSSF) + '.', gross, netMonthly, monthlyPAYE);
}
<!-- sw-paye-exact-three:controller:end -->`;
}

function publishHelper() {
  return `function publishResult(employerCopy, gross, netMonthly, monthlyPAYE) {
  const annual = (value) => value * 12;
  const effectiveRate = RESULT.effectiveRate;
  document.getElementById('resAmount').textContent = fmt(netMonthly);
  document.getElementById('resGross').textContent = 'Ghafi: ' + fmt(gross) + '/mwezi · ' + fmt(annual(gross)) + '/mwaka';
  document.getElementById('resContent').innerHTML = renderRows(RESULT, PERIOD);
  document.getElementById('effRateDisplay').textContent = pct(effectiveRate);
  setTimeout(() => { document.getElementById('rateFill').style.width = Math.min(effectiveRate * 200, 100) + '%'; }, 80);
  const strip = document.getElementById('employerStrip');
  strip.innerHTML = '<strong>Gharama Jumla za Mwajiri: ' + fmt(RESULT.totalEmployerCostMonthly) + '/mwezi</strong><br>' + employerCopy;
  strip.classList.add('on');
  document.getElementById('resultsCard').classList.add('on');
  renderChart(CHART_TYPE);
  document.getElementById('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById('aiBtn').disabled = false;
  document.getElementById('aiBtn').textContent = 'Pata Uchambuzi wa AI wa Kodi →';
  document.getElementById('aiStatus').textContent = 'Ghafi: ' + fmt(gross) + '/mwezi · Halisi: ' + fmt(netMonthly) + '/mwezi · PAYE: ' + fmt(monthlyPAYE) + '/mwezi · Kiwango: ' + pct(RESULT.effectiveRate);
}`;
}

function renderRows(config) {
  if (config.id === 'bi-paye') return `function renderRows(R, period) {
  const annual = period === 'annual';
  const multiplier = annual ? 12 : 1;
  const suffix = annual ? '/mwaka' : '/mwezi';
  const row = (label, value, cls = '') => '<div class="res-row"><span class="res-row-lbl">' + label + '</span><span class="res-row-val ' + cls + '">' + value + '</span></div>';
  return '<div class="res-section"><div class="res-section-title">Mapato Ghafi</div>' + row('Mshahara Ghafi ' + suffix, fmt(R.gross * multiplier)) +
    '</div><div class="res-section"><div class="res-section-title">Makato</div>' +
    (R.social > 0 ? row('Pensheni ya mfanyakazi (4%, yenye kikomo)', fmt(R.social * multiplier), 'c-red') : '') +
    row('Mapato yanayotozwa PAYE ' + suffix, fmt(R.taxableIncome * multiplier), 'c-mut') +
    '</div><div class="res-section"><div class="res-section-title">PAYE (OBR)</div>' + row('Kodi ya mapato', fmt(R.monthlyPAYE * multiplier), 'c-red') +
    '</div><div class="res-section">' + row('Makato Yote', fmt(R.totalEmployeeDeductions * multiplier), 'c-red') +
    '<div class="res-row total"><span class="res-row-lbl">Mshahara Halisi</span><span class="res-row-val c-grn">' + fmt(R.netMonthly * multiplier) + '</span></div></div>';
}`;
  if (config.id === 'rw-paye') return `function renderRows(R, period) {
  const annual = period === 'annual';
  const multiplier = annual ? 12 : 1;
  const suffix = annual ? '/mwaka' : '/mwezi';
  const row = (label, value, cls = '') => '<div class="res-row"><span class="res-row-lbl">' + label + '</span><span class="res-row-val ' + cls + '">' + value + '</span></div>';
  return '<div class="res-section"><div class="res-section-title">Mapato Ghafi</div>' + row('Mshahara Ghafi ' + suffix, fmt(R.gross * multiplier)) +
    '</div><div class="res-section"><div class="res-section-title">Makato</div>' +
    (R.rssb > 0 ? row('RSSB ya mfanyakazi (6%)', fmt(R.rssb * multiplier), 'c-red') : '') +
    row('Mchango wa uzazi wa mfanyakazi (0.3%)', fmt(R.employeeMaternity * multiplier), 'c-red') +
    row('CBHI ya mfanyakazi (0.5% ya mshahara halisi)', fmt(R.employeeCbhi * multiplier), 'c-red') +
    row('Mapato yanayotozwa PAYE ' + suffix, fmt(R.taxableIncome * multiplier), 'c-mut') +
    '</div><div class="res-section"><div class="res-section-title">PAYE (RRA)</div>' + row('Kodi ya mapato', fmt(R.monthlyPAYE * multiplier), 'c-red') +
    '</div><div class="res-section">' + row('Makato Yote', fmt(R.totalEmployeeDeductions * multiplier), 'c-red') +
    '<div class="res-row total"><span class="res-row-lbl">Mshahara Halisi</span><span class="res-row-val c-grn">' + fmt(R.netMonthly * multiplier) + '</span></div></div>';
}`;
  return `function renderRows(R, period) {
  const annual = period === 'annual';
  const suffix = annual ? '/mwaka' : '/mwezi';
  const row = (label, value, cls = '') => '<div class="res-row"><span class="res-row-lbl">' + label + '</span><span class="res-row-val ' + cls + '">' + value + '</span></div>';
  const gross = annual ? R.annualGross : R.gross;
  const nssf = annual ? R.annualNSSF : R.nssf;
  const paye = annual ? R.annualTax : R.monthlyPAYE;
  const lst = annual ? R.lstAnnual : R.lstPayrollDeduction;
  const net = annual ? R.annualNet : R.netMonthly;
  const deductions = nssf + paye + lst;
  return '<div class="res-section"><div class="res-section-title">Mapato Ghafi</div>' + row('Mshahara Ghafi ' + suffix, fmt(gross)) +
    '</div><div class="res-section"><div class="res-section-title">Makato</div>' +
    (nssf > 0 ? row('NSSF ya mfanyakazi (5%, haipunguzi PAYE)', fmt(nssf), 'c-red') : '') +
    (lst > 0 ? row(annual ? 'LST ya mwaka iliyotathminiwa' : 'LST iliyokusanywa kwenye malipo haya', fmt(lst), 'c-red') : '') +
    (R.lstAnnual > 0 ? row('Mshahara ghafi uliotumika kwa jedwali la LST', fmt(R.lstAssessmentGross), 'c-mut') : '') +
    row('Msingi wa PAYE wa malipo yenye LST', fmt(R.taxableIncome), 'c-mut') +
    '</div><div class="res-section"><div class="res-section-title">PAYE (URA)</div>' + row('Kodi ya mapato', fmt(paye), 'c-red') +
    '</div><div class="res-section">' + row('Makato Yote', fmt(deductions), 'c-red') +
    '<div class="res-row total"><span class="res-row-lbl">Mshahara Halisi</span><span class="res-row-val c-grn">' + fmt(net) + '</span></div></div>';
}`;
}

function pdfFunction(config) {
  const sourceSection = config.sources?.length
    ? `+ '<h2>Vyanzo Rasmi na Uhakiki<\\/h2><ul>${config.sources.map(([label, href]) => `<li>${label}: ${href}<\\/li>`).join('')}<\\/ul><p class="note">Imethibitishwa ${config.checkedDate}.<\\/p>'`
    : '';
  let socialRows = config.id === 'bi-paye'
    ? `+ '<tr><td>Pensheni ya mfanyakazi (4%, kikomo)<\\/td><td>' + fmt(R.social) + '<\\/td><\\/tr>'`
    : config.id === 'rw-paye'
      ? `+ '<tr><td>RSSB ya mfanyakazi (6%)<\\/td><td>' + fmt(R.rssb) + '<\\/td><\\/tr>' + '<tr><td>Uzazi wa mfanyakazi (0.3%)<\\/td><td>' + fmt(R.employeeMaternity) + '<\\/td><\\/tr>'`
      : `+ '<tr><td>NSSF ya mfanyakazi (5%, haipunguzi PAYE)<\\/td><td>' + fmt(R.nssf) + '<\\/td><\\/tr>' + (R.lstAnnual > 0 ? '<tr><td>LST ya mwaka iliyotathminiwa<\\/td><td>' + fmt(R.lstAnnual) + '<\\/td><\\/tr><tr><td>Mshahara ghafi kwa jedwali la LST<\\/td><td>' + fmt(R.lstAssessmentGross) + '<\\/td><\\/tr>' : '') + '<tr><td>Msingi wa PAYE baada ya LST<\\/td><td>' + fmt(R.taxableIncome) + '<\\/td><\\/tr>'`;
  if (config.id === 'rw-paye') socialRows += `+ '<tr><td>CBHI ya mfanyakazi (0.5%)<\\/td><td>' + fmt(R.employeeCbhi) + '<\\/td><\\/tr>'`;
  let employerRows = config.id === 'bi-paye'
    ? `+ '<tr><td>Pensheni ya mwajiri (6%, kikomo)<\\/td><td>' + fmt(R.employerPension) + '<\\/td><\\/tr>' + '<tr><td>Hatari ya kazi (3%, kikomo)<\\/td><td>' + fmt(R.employerRisk) + '<\\/td><\\/tr>'`
    : config.id === 'rw-paye'
      ? `+ '<tr><td>RSSB ya mwajiri (6%)<\\/td><td>' + fmt(R.empRssb) + '<\\/td><\\/tr>' + '<tr><td>Uzazi wa mwajiri (0.3%)<\\/td><td>' + fmt(R.employerMaternity) + '<\\/td><\\/tr>'`
      : `+ '<tr><td>NSSF ya mwajiri (10%)<\\/td><td>' + fmt(R.empNSSF) + '<\\/td><\\/tr>'`;
  if (config.id === 'rw-paye') employerRows += `+ '<tr><td>Hatari ya kazi ya mwajiri (2%)<\\/td><td>' + fmt(R.employerOccupationalHazard) + '<\\/td><\\/tr>'`;
  return `function generatePdf() {
  if (!RESULT) {
    window.alert('Kokotoa matokeo halali kabla ya kufungua PDF.');
    return;
  }
  const R = RESULT;
  const refNo = 'AFT-${config.id.toUpperCase()}-SW-' + Date.now().toString(36).toUpperCase().slice(-6);
  const bandRows = R.bandBreakdown.map((band) => '<tr><td>' + (band.isFlat ? 'Kiwango tambarare ' : 'Bendi ') + Math.round(band.rate * 100) + '%<\\/td><td>' + fmt(band.tax) + '<\\/td><\\/tr>').join('');
  const css = 'body{font-family:Arial,sans-serif;color:#172033;margin:0}main{padding:32px}h1{font-size:24px;margin:0 0 6px}h2{font-size:15px;margin:24px 0 8px;color:#075985}p{line-height:1.55}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #dbe4ef}td:last-child{text-align:right;font-weight:700}.hero{background:#eff6ff;padding:18px;border-radius:12px}.note{font-size:12px;color:#5b6472}.total{font-weight:800;color:#075985}@media print{main{padding:18px}.no-print{display:none}}';
  const html = '<!DOCTYPE html><html lang="sw"><head><meta charset="UTF-8"><title>AfroTools ${config.country} PAYE — ' + refNo + '<\\/title><style>' + css + '<\\/style><\\/head><body onload="window.print()"><main>'
    + '<h1>Ripoti ya PAYE ya ${config.country}<\\/h1><p class="note">${config.authority} ${config.period} · Kumbukumbu ' + refNo + '<\\/p>'
    + '<div class="hero"><strong>Mshahara Halisi wa Mwezi: ' + fmt(R.netMonthly) + '<\\/strong><br>Ghafi ' + fmt(R.gross) + ' · PAYE ' + fmt(R.monthlyPAYE) + '<\\/div>'
    + '<h2>Sehemu 1 — Makato ya Mfanyakazi<\\/h2><table><tr><td>Mshahara ghafi<\\/td><td>' + fmt(R.gross) + '<\\/td><\\/tr>'
    ${socialRows}
    + '<tr><td>PAYE<\\/td><td>' + fmt(R.monthlyPAYE) + '<\\/td><\\/tr><tr class="total"><td>Mshahara halisi<\\/td><td>' + fmt(R.netMonthly) + '<\\/td><\\/tr><\\/table>'
    + '<h2>Sehemu 2 — Mabanda ya PAYE<\\/h2><table>' + bandRows + '<\\/table>'
    + '<h2>Sehemu 3 — Gharama ya Mwajiri<\\/h2><table><tr><td>Ghafi<\\/td><td>' + fmt(R.gross) + '<\\/td><\\/tr>'
    ${employerRows}
    + '<tr class="total"><td>Jumla ya gharama ya mwajiri<\\/td><td>' + fmt(R.totalEmployerCostMonthly) + '<\\/td><\\/tr><\\/table>'
    ${sourceSection}
    + '<h2>Msingi wa Kisheria na Makadirio<\\/h2><p>${config.law}<\\/p><p class="note">Makadirio ya kupanga pekee. Si ushauri wa kodi au kisheria. Thibitisha na ${config.authority} au mtaalamu aliyehitimu.<\\/p>'
    + '<\\/main><\\/body><\\/html>';
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, '_blank');
  if (!popup) window.alert('Ruhusu dirisha jipya ili kufungua PDF.');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}`;
}

function aiFunction(config) {
  let detail = config.id === 'bi-paye'
    ? `'- Pensheni ya mfanyakazi (4%, kikomo BIF 450,000): ' + fmt(R.social) + '\\n- Pensheni ya mwajiri (6%, kikomo): ' + fmt(R.employerPension) + '\\n- Hatari ya kazi (3%, kikomo BIF 80,000): ' + fmt(R.employerRisk)`
    : config.id === 'rw-paye'
      ? `'- RSSB ya mfanyakazi (6%): ' + fmt(R.rssb) + '\\n- Mchango wa uzazi wa mfanyakazi (0.3%): ' + fmt(R.employeeMaternity) + '\\n- RSSB ya mwajiri (6%): ' + fmt(R.empRssb) + '\\n- Mchango wa uzazi wa mwajiri (0.3%): ' + fmt(R.employerMaternity)`
      : `'- NSSF ya mfanyakazi (5%, haipunguzi PAYE): ' + fmt(R.nssf) + '\\n- NSSF ya mwajiri (10%): ' + fmt(R.empNSSF) + '\\n- LST ya mwaka iliyotathminiwa: ' + fmt(R.lstAnnual) + '\\n- Mshahara ghafi kwa jedwali la LST: ' + fmt(R.lstAssessmentGross) + '\\n- Msingi wa PAYE baada ya LST: ' + fmt(R.taxableIncome) + '\\n- Hali ya ukaazi: ' + (R.isNonRes ? 'Asiye mkazi, jedwali la 10%/20%/30% pamoja na nyongeza ya mapato ya juu' : 'Mkazi, jedwali la 0%/10%/20%/30% pamoja na nyongeza ya mapato ya juu')`;
  if (config.id === 'rw-paye') detail += ` + '\\n- CBHI ya mfanyakazi (0.5%): ' + fmt(R.employeeCbhi) + '\\n- Hatari ya kazi ya mwajiri (2%): ' + fmt(R.employerOccupationalHazard)`;
  return `async function getAI() {
  if (!ensureSwAiConsent()) return;
  if (!RESULT) {
    invalidateResult('Kokotoa matokeo halali kabla ya kuomba uchambuzi wa AI.');
    return;
  }
  const R = RESULT;
  const button = document.getElementById('aiBtn');
  const response = document.getElementById('aiResp');
  button.disabled = true;
  button.textContent = 'Inachambua…';
  response.style.display = 'block';
  response.className = 'ai-response typing';
  response.textContent = '';
  document.getElementById('aiStatus').style.display = 'none';
  const prompt = 'Uchambuzi wa PAYE ${config.country} (${config.period}, ${config.authority}):\\n'
    + '- Mshahara ghafi: ' + fmt(R.gross) + '\\n'
    + ${detail} + '\\n'
    + '- PAYE: ' + fmt(R.monthlyPAYE) + '\\n'
    + '- Mshahara halisi: ' + fmt(R.netMonthly) + '\\n'
    + '- Gharama ya mwajiri: ' + fmt(R.totalEmployerCostMonthly) + '\\n'
    + 'Eleza matokeo kwa Kiswahili kwa tahadhari. Tumia viwango vilivyo kwenye muktadha huu pekee; usibuni makato, msamaha au ushauri wa kisheria. Chini ya maneno 200.';
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (window.AFROTOOLS_AI_TOKEN) headers.Authorization = 'Bearer ' + window.AFROTOOLS_AI_TOKEN;
    const result = await fetch('/.netlify/functions/ai-advisor', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        system: 'Wewe ni msaidizi wa PAYE wa AfroTools kwa ${config.country}. Jibu kwa Kiswahili kwa ufupi, tumia muktadha uliotolewa, na sema ni makadirio.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!result.ok) throw new Error('Huduma ya AI haikujibu.');
    const data = await result.json();
    const text = data.text || data.reply || data.response || data.analysis || 'Uchambuzi haupatikani.';
    response.className = 'ai-response';
    response.textContent = text;
    document.getElementById('aiChat').classList.add('on');
    CHAT_HISTORY = [{ role: 'user', content: prompt }, { role: 'assistant', content: text }];
  } catch (error) {
    response.className = 'ai-response';
    response.textContent = error.message || 'Uchambuzi wa AI haupatikani kwa sasa.';
  } finally {
    button.disabled = false;
    button.textContent = 'Chambua tena →';
  }
}`;
}

function contributionBlock(config) {
  const accessibleToggles = config.toggles.replace(
    /<div class="tog( on)?" data-tog="([^"]+)" onclick="togItem\(this\)">/g,
    (_match, on, name) => `<div class="tog${on || ''}" data-tog="${name}" role="switch" tabindex="0" aria-checked="${on ? 'true' : 'false'}" data-sw-keyboard-ready="true" onclick="togItem(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">`,
  );
  return `<!-- CONTRIBUTION TOGGLES -->
          <div class="field">
            <div class="f-label"><span class="f-label-text">Makato Yanayotumika</span><span class="f-hint">Bonyeza ili kujumuisha / kutojumuisha</span></div>
            <div class="toggles">${accessibleToggles}
            </div>
            <p class="f-note">${config.note}</p>
          </div>

          <button type="button" class="calc-btn" onclick="calculate()">Kokotoa Mshahara Wangu Halisi →</button>`;
}

function staleResultGuards() {
  return `<!-- sw-paye-exact-three:stale-result-guards:start -->
function syncChoiceState(control) {
  const selected = control.classList.contains('on');
  if (control.matches('[data-tog]')) control.setAttribute('aria-checked', String(selected));
  if (control.matches('.sec-btn')) control.setAttribute('aria-pressed', String(selected));
}
document.querySelectorAll('[data-tog], .sec-btn').forEach(syncChoiceState);
document.getElementById('grossSalary').addEventListener('input', () => {
  if (RESULT) invalidateResult('Mshahara umebadilika. Kokotoa tena kabla ya kuhifadhi au kuomba AI.');
});
document.getElementById('salarySlider').addEventListener('input', () => {
  if (RESULT) invalidateResult('Mshahara umebadilika. Kokotoa tena kabla ya kuhifadhi au kuomba AI.');
});
document.querySelectorAll('[data-tog], .sec-btn').forEach((control) => {
  control.addEventListener('click', () => {
    document.querySelectorAll('[data-tog], .sec-btn').forEach(syncChoiceState);
    if (RESULT) invalidateResult('Chaguo limebadilika. Kokotoa tena kabla ya kuhifadhi au kuomba AI.');
  });
});
<!-- sw-paye-exact-three:stale-result-guards:end -->`;
}

function contrastContract() {
  return `<style data-sw-paye-contrast-contract>
body.tool-page {
  --sw-paye-surface: #ffffff;
  --sw-paye-surface-subtle: #f0f5ff;
  --sw-paye-text: #1e293b;
  --sw-paye-muted: #334155;
  --sw-paye-boundary: #52627a;
  --sw-paye-active-surface: #ffffff;
  --sw-paye-active-text: #1e40af;
  --sw-paye-focus: #0f172a;
  --sw-paye-link: #1d4ed8;
  --sw-paye-danger: #991b1b;
  --sw-paye-success: #166534;
}
html[data-theme="dark"] body.tool-page {
  --sw-paye-surface: #121f33;
  --sw-paye-surface-subtle: #182940;
  --sw-paye-text: #f1f5f9;
  --sw-paye-muted: #e2e8f0;
  --sw-paye-boundary: #94a3b8;
  --sw-paye-active-surface: #e2e8f0;
  --sw-paye-active-text: #1e40af;
  --sw-paye-focus: #facc15;
  --sw-paye-link: #bfdbfe;
  --sw-paye-danger: #fca5a5;
  --sw-paye-success: #86efac;
}
@media (prefers-color-scheme: dark) {
  html:not([data-theme]) body.tool-page {
    --sw-paye-surface: #121f33;
    --sw-paye-surface-subtle: #182940;
    --sw-paye-text: #f1f5f9;
    --sw-paye-muted: #e2e8f0;
    --sw-paye-boundary: #94a3b8;
    --sw-paye-active-surface: #e2e8f0;
    --sw-paye-active-text: #1e40af;
    --sw-paye-focus: #facc15;
    --sw-paye-link: #bfdbfe;
    --sw-paye-danger: #fca5a5;
    --sw-paye-success: #86efac;
  }
}
body.tool-page :is(.card,.ai-card,.tool-info-card,.ng-guide-sec),
body.tool-page :is(.card-body,.ai-body,.res-body,.chart-section,.tool-info-body,.bands-body) {
  background-color: var(--sw-paye-surface) !important;
  border-color: var(--sw-paye-boundary) !important;
}
body.tool-page :is(.amendment-bar,.res-row,.faq-item,#fav-btn,#afro-analytics-consent-accept) {
  border-color: var(--sw-paye-boundary) !important;
}
body.tool-page #afro-analytics-consent-accept { border-color: #f8fafc !important; }
body.tool-page :is(.faq-item,.res-row.total) {
  background-color: var(--sw-paye-surface-subtle) !important;
}
body.tool-page :is(.card-head,.sector-row,.period-row,.disclaimer,.tool-info-header,.tool-info-footer) {
  background-color: var(--sw-paye-surface-subtle) !important;
  border-color: var(--sw-paye-boundary) !important;
}
body.tool-page .tool-main {
  color: var(--sw-paye-text) !important;
}
body.tool-page .card-head { border-bottom: 1.5px solid var(--sw-paye-boundary) !important; }
body.tool-page :is(.card-title,.f-label-text,.slider-label,.tog-label,.rate-bar-lbl,.res-section-title,.band-range,.tool-info-name,.tool-feat,.faq-q,.tog-arrow) {
  color: var(--sw-paye-text) !important;
}
body.tool-page :is(.slider-val,.f-prefix,.res-row-lbl,.res-row-val,.rate-bar-pct) {
  color: var(--sw-paye-text) !important;
}
body.tool-page .res-row-val.c-red { color: var(--sw-paye-danger) !important; }
body.tool-page .res-row-val.c-grn { color: var(--sw-paye-success) !important; }
body.tool-page .res-row-val.c-mut { color: var(--sw-paye-muted) !important; }
body.tool-page :is(.card-sub,.f-hint,.f-note,.tog-rate,.ai-status,.band-note,.disclaimer,.tool-info-cat,.tool-info-updated,.tool-stat-lbl,.faq-a,.rt-desc) {
  color: var(--sw-paye-muted) !important;
}
body.tool-page :is(.slider-limits span,.faq-sec .eyebrow) {
  color: var(--sw-paye-muted) !important;
}
body.tool-page .tool-main :is(h1,h2,h3,h4,h5,h6,summary,strong) {
  color: var(--sw-paye-text) !important;
}
body.tool-page .tool-main a:not(.act-btn):not(.calc-btn):not(.chat-send) {
  color: var(--sw-paye-link) !important;
}
body.tool-page .tool-stat-val { color: var(--sw-paye-link) !important; }
body.tool-page .tool-feat {
  background: var(--sw-paye-surface-subtle) !important;
  border-color: var(--sw-paye-boundary) !important;
}
body.tool-page .tool-info-action {
  background: var(--sw-paye-surface) !important;
  border-color: var(--sw-paye-boundary) !important;
  color: var(--sw-paye-link) !important;
}
body.tool-page .disclaimer strong { color: var(--sw-paye-text) !important; }
body.tool-page .ng-guide-sec :is(h1,h2,h3,h4,h5,h6,summary,strong) { color: var(--sw-paye-text) !important; }
body.tool-page .ng-guide-sec :is(p,li,small) { color: var(--sw-paye-muted) !important; }
body.tool-page :is(.sec-btn,.per-btn,.chart-tab,.preset-btn) {
  color: var(--sw-paye-text) !important;
  border: 1.5px solid var(--sw-paye-boundary) !important;
}
body.tool-page :is(.sec-btn.on,.per-btn.on,.preset-btn.active) {
  background: var(--sw-paye-active-surface) !important;
  color: var(--sw-paye-active-text) !important;
}
body.tool-page .chart-tab.on {
  background: #1d4ed8 !important;
  border-color: var(--sw-paye-boundary) !important;
  color: #ffffff !important;
}
body.tool-page :is(.tog,.f-wrap,.f-input,.chat-in,.chat-send,.act-btn) {
  border-color: var(--sw-paye-boundary) !important;
}
body.tool-page .tog { background: var(--sw-paye-surface-subtle) !important; }
body.tool-page .preset-btn { background: var(--sw-paye-surface) !important; }
body.tool-page :is(.f-input,.chat-in) {
  background: var(--sw-paye-surface) !important;
  color: var(--sw-paye-text) !important;
}
body.tool-page .res-hero {
  background: #0f3d6e !important;
  background-image: none !important;
  border-color: #94a3b8 !important;
}
body.tool-page .res-hero :is(.res-hero-label,.res-hero-amount,.res-hero-period,.res-hero-gross) {
  color: #ffffff !important;
  opacity: 1 !important;
}
body.tool-page .act-btn:not(.act-pdf):not(.act-share) {
  background: #166534 !important;
  border-color: var(--sw-paye-boundary) !important;
  color: #ffffff !important;
}
body.tool-page .act-btn.act-pdf {
  background: #1e40af !important;
  border-color: var(--sw-paye-boundary) !important;
  color: #ffffff !important;
}
body.tool-page .act-btn.act-share {
  background: #5b21b6 !important;
  border-color: var(--sw-paye-boundary) !important;
  color: #ffffff !important;
}
body.tool-page :is(a,button,[role="button"],[role="switch"],input,select,textarea):focus,
body.tool-page :is(a,button,[role="button"],[role="switch"],input,select,textarea):focus-visible {
  outline: 3px solid var(--sw-paye-focus) !important;
  outline-offset: 3px !important;
  box-shadow: 0 0 0 6px var(--sw-paye-surface) !important;
}
body.tool-page #resultsCard .sw-paye-action-row button.act-btn:focus,
body.tool-page #resultsCard .sw-paye-action-row button.act-btn:focus-visible {
  outline: 3px solid #ffffff !important;
}
body.tool-page .tool-hero .badge {
  background: #f8fafc !important;
  border: 1.5px solid #94a3b8 !important;
  color: #0f172a !important;
}
body.tool-page .tool-hero :is(h1,h1 span,h1 em,.hero-sub) {
  color: #ffffff !important;
  opacity: 1 !important;
}
body.tool-page .tool-hero :is(.hero-meta,.breadcrumb,.breadcrumb a,.breadcrumb span) {
  color: #e2e8f0 !important;
  opacity: 1 !important;
}
body.tool-page .tool-hero .tool-hero-inner > p:not(.hero-sub):not(.hero-meta),
body.tool-page .tool-hero .tool-hero-inner > p:not(.hero-sub):not(.hero-meta) a {
  color: #f1f5f9 !important;
  opacity: 1 !important;
}
body.tool-page .related-tools {
  background: var(--sw-paye-surface-subtle) !important;
  color: var(--sw-paye-text) !important;
}
body.tool-page .related-tools h2 { color: var(--sw-paye-text) !important; }
body.tool-page .related-tools .rt-card {
  background: var(--sw-paye-surface) !important;
  border-color: var(--sw-paye-boundary) !important;
}
body.tool-page .related-tools :is(.rt-name,.rt-desc) { color: var(--sw-paye-text) !important; }
body.tool-page :is(.faq-sec,.more-tools-sec) {
  background: var(--sw-paye-surface-subtle) !important;
  color: var(--sw-paye-text) !important;
}
body.tool-page :is(.more-tools-inner,.more-tools-grid,.more-tools-title) {
  background: var(--sw-paye-surface-subtle) !important;
}
body.tool-page :is(.faq-sec,.more-tools-sec) :is(.sec-title,.more-tools-title) {
  color: var(--sw-paye-text) !important;
}
body.tool-page .more-tool-link {
  background: var(--sw-paye-surface) !important;
  border-color: var(--sw-paye-boundary) !important;
  color: var(--sw-paye-link) !important;
}
html[data-theme="dark"] body.tool-page .tool-hero .hero-badges .badge {
  background: #17263d !important;
  border-color: #94a3b8 !important;
  color: #eef5ff !important;
}
html[data-theme="dark"] body.tool-page .tool-main :is(
  .card,.card-head,.sec-btn,.per-btn,.chart-tab,.preset-btn,.tog,.f-wrap,.f-input,.chat-in,.chat-send,.act-btn,
  .tool-info-card,.tool-info-header,.tool-info-footer,.tool-feat,.tool-info-action
) {
  border-color: #94a3b8 !important;
}
@media (prefers-color-scheme: dark) {
  html:not([data-theme]) body.tool-page .tool-hero .hero-badges .badge {
    background: #17263d !important;
    border-color: #94a3b8 !important;
    color: #eef5ff !important;
  }
  html:not([data-theme]) body.tool-page .tool-main :is(
    .card,.card-head,.sec-btn,.per-btn,.chart-tab,.preset-btn,.tog,.f-wrap,.f-input,.chat-in,.chat-send,.act-btn,
    .tool-info-card,.tool-info-header,.tool-info-footer,.tool-feat,.tool-info-action
  ) {
    border-color: #94a3b8 !important;
  }
}
body.tool-page .sw-paye-action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 16px 22px 22px;
  background: #0f172a !important;
  opacity: 1 !important;
}
body.tool-page .results-card.on,
body.tool-page .sw-paye-action-row .act-btn { opacity: 1 !important; }
body.tool-page #resultsCard .sw-paye-action-row button.act-btn { border-color: #94a3b8 !important; }
@media (max-width: 768px) {
  body.tool-page .sw-paye-action-row { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  body.tool-page .tool-main-inner { grid-template-columns: minmax(0, 1fr); padding-inline: 12px; }
  body.tool-page .tool-main-inner > *,
  body.tool-page :is(.card,.card-body,.sidebar,.ai-card,.tool-info-card,.faq-item,.rt-grid,.rt-card,.results-card,.res-hero,.res-body,.employer-strip,.chart-section,section,.container) {
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;
  }
  body.tool-page :is(.card-head,.f-label,.slider-row,.res-row,.band-row) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    align-items: start;
  }
  body.tool-page :is(.sector-row,.period-row,.presets,.toggles) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  body.tool-page :is(h1,h2,h3,a,p,li,ul,.card-title,.card-sub,.f-label-text,.f-hint,.f-note,.tog-label,.tog-rate,.res-hero-amount,.res-hero-gross,.res-row-lbl,.res-row-val,.employer-strip,.ai-status,.band-range,.band-rate,.rt-name,.rt-desc) {
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  body.tool-page :is(.res-hero,.res-body,.employer-strip) > * { min-width: 0; max-width: 100%; }
  body.tool-page .chart-section { padding-inline: 16px; }
  body.tool-page .chart-tabs { display: grid; grid-template-columns: minmax(0, 1fr); }
  body.tool-page .chart-tab { width: 100%; white-space: normal; }
  body.tool-page .related-tools .rt-grid { grid-template-columns: minmax(0, 1fr); }
  body.tool-page .related-tools .rt-card { box-sizing: border-box; overflow-wrap: anywhere; }
}
</style>`;
}

function applyTarget(config) {
  const absolute = path.join(ROOT, config.file);
  let source = fs.readFileSync(absolute, 'utf8');
  source = source
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${config.seoDescription}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${config.seoDescription}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${config.seoDescription}">`)
    .replace(/("description":\s*)"[^"]*"/, `$1"${config.seoDescription}"`)
    .replace(/"dateModified": "[^"]*"/, '"dateModified": "2026-08-02"')
    .replace(/<meta http-equiv="last-modified" content="[^"]*">/, '<meta http-equiv="last-modified" content="2026-08-02">')
    .replace(/<meta property="article:modified_time" content="[^"]*">/, '<meta property="article:modified_time" content="2026-08-02">');
  if (config.id === 'ug-paye') {
    source = source
      .replace(/2025\/26|2026\/27/g, 'viwango vya sasa')
      .replace(/Machi 2026/g, '2 Agosti 2026')
      .replace('/blog/tax-updates-2026/', 'https://ura.go.ug/en/domestic-taxes/paye-rates/')
      .replace("bands.map(b => b.isFlat ? '30% tambarare' : (b.rate*100)+'%')", "bands.map(b => (b.rate*100)+'%')")
      .replace(
        /Viwango vya Sheria ya (?:Fedha|Kodi ya Mapato)[^<.]*(?:\.|(?=<))/g,
        'Viwango vya sasa vya URA vilivyothibitishwa 2 Agosti 2026.',
      );
    if (!source.includes('/assets/js/engines/ug-paye.js')) {
      source = source.replace(
        '<script src="/assets/js/lib/chart-config.js?v=b81750bb"></script>',
        '<script src="/assets/js/lib/chart-config.js?v=b81750bb"></script>\n<script src="/assets/js/engines/ug-paye.js"></script>',
      );
    }
  }
  if (!source.includes('name="sw-paye-source-owner"')) {
    source = replaceOne(
      source,
      /(<meta name="tool-id" content="[^"]+">)/,
      `$1\n<meta name="sw-paye-source-owner" content="scripts/build-sw-paye-exact-three.js">`,
      `${config.id} owner meta`,
    );
  }
  if (!source.includes('sw-paye-skip-link')) {
    source = source
      .replace(
        /(<body class="[^"]+">)/,
        '$1\n<a class="skip-main skip-link sw-paye-skip-link" href="#main-content">Ruka hadi kikokotoo</a>',
      )
      .replace('<div class="tool-main">', '<div class="tool-main" id="main-content" tabindex="-1">')
      .replace(
        '</head>',
        '<style>.sw-paye-skip-link{position:fixed;top:12px;left:12px;z-index:10000;padding:10px 16px;border-radius:8px;background:#071b31;color:#fff;font-weight:800;text-decoration:none;transform:translateY(calc(-100% - 28px))}.sw-paye-skip-link:focus,.sw-paye-skip-link:focus-visible{transform:translateY(0);outline:3px solid #facc15;outline-offset:3px}</style>\n</head>',
      );
  }
  source = source.replace('class="skip-link sw-paye-skip-link"', 'class="skip-main skip-link sw-paye-skip-link"');
  if (source.includes('data-sw-paye-contrast-contract')) {
    source = source.replace(/<style data-sw-paye-contrast-contract>[\s\S]*?<\/style>/, contrastContract());
  } else {
    source = source.replace('</head>', `${contrastContract()}\n</head>`);
  }
  source = source.replace(
    /<p class="ai-status" id="aiStatus"(?:\s[^>]*)?>/,
    '<p class="ai-status" id="aiStatus" role="status" aria-live="polite" aria-atomic="true">',
  );
  source = replaceOne(source, /<p class="hero-sub">[\s\S]*?<\/p>/, `<p class="hero-sub">${config.hero}</p>`, `${config.id} hero`);
  if (config.sourceMeta) {
    source = replaceOne(source, /<p class="hero-meta">[\s\S]*?<\/p>/, `<p class="hero-meta">${config.sourceMeta}</p>`, `${config.id} source meta`);
  }
  source = replaceOne(source, /(<div class="amendment-bar">[\s\S]*?<p>)[\s\S]*?(<\/p>[\s\S]*?<\/div>\s*<\/div>)/, `$1${config.fact}$2`, `${config.id} fact`);
  source = replaceOne(source, /<!-- CONTRIBUTION TOGGLES -->[\s\S]*?<button type="button" class="calc-btn" onclick="calculate\(\)">[\s\S]*?<\/button>/, contributionBlock(config), `${config.id} toggles`);
  const accessibleCards = config.cards.replace(
    /<div class="card-head" onclick="toggleBands\(this\)">/g,
    '<div class="card-head" role="button" tabindex="0" aria-expanded="false" data-sw-keyboard-ready="true" onclick="toggleBands(this)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click();}">',
  );
  source = replaceOne(
    source,
    new RegExp(`\\s*<!-- ${config.bandsComment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} -->[\\s\\S]*?(?=\\s*<div class="disclaimer">)`),
    `\n${accessibleCards}\n`,
    `${config.id} rate cards`,
  );
  if (config.disclaimer) {
    source = replaceOne(source, /<div class="disclaimer">[\s\S]*?<\/div>/, `<div class="disclaimer">${config.disclaimer}</div>`, `${config.id} disclaimer`);
  }
  source = replaceOne(source, /<!-- FAQ -->[\s\S]*?<\/section>\s*\n\s*<!-- PDF MODAL -->/, `${faqHtml(config)}\n\n<!-- PDF MODAL -->`, `${config.id} faq`);
  source = replaceOne(source, /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?<\/script>/, schema(config), `${config.id} FAQ schema`);
  source = replaceOne(source, /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"HowTo"[\s\S]*?<\/script>/, howTo(config), `${config.id} HowTo schema`);
  source = replaceOne(source, /<!-- SEO GUIDE SECTION -->[\s\S]*?<!-- MORE TOOLS -->/, guideHtml(config), `${config.id} guide`);

  if (config.id === 'bi-paye') {
    source = replaceNamedFunction(source, 'setSekta', `function setSekta(s, btn) {
  SECTOR = s;
  document.querySelectorAll('.sec-btn').forEach((button) => button.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('cnssLabel').textContent = s === 'private' ? 'Pensheni ya CNSS' : 'Pensheni ya INSS';
  document.querySelector('[data-tog="cnss"] .tog-rate').textContent = '4% · kikomo cha msingi BIF 450,000';
}`);
  }
  if (config.id === 'ug-paye') {
    source = replaceNamedFunction(source, 'setSekta', `function setSekta(s, btn) {
  SECTOR = s;
  document.querySelectorAll('.sec-btn').forEach((button) => button.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('nssfLabel').textContent = 'NSSF';
  document.querySelector('[data-tog="nssf"] .tog-rate').textContent = '5% mfanyakazi · haipunguzi PAYE';
}`);
    source = source.replace(/R\.lstMonthly/g, 'R.lstPayrollDeduction');
  }
  source = replaceNamedFunction(source, 'togItem', `function togItem(el) {
  el.classList.toggle('on');
  el.setAttribute('aria-checked', String(el.classList.contains('on')));
}`);
  source = replaceNamedFunction(source, 'toggleBands', `function toggleBands(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('.tog-arrow');
  body.classList.toggle('open');
  arrow.classList.toggle('open');
  header.setAttribute('aria-expanded', String(body.classList.contains('open')));
}`);

  const controllerStart = source.indexOf('<!-- sw-paye-exact-three:controller:start -->');
  if (controllerStart >= 0) {
    const controllerEnd = source.indexOf('<!-- sw-paye-exact-three:controller:end -->', controllerStart);
    if (controllerEnd < 0) throw new Error(`Missing ${config.id} controller end marker`);
    const after = controllerEnd + '<!-- sw-paye-exact-three:controller:end -->'.length;
    source = `${source.slice(0, controllerStart)}${controller(config)}${source.slice(after)}`;
  } else {
    source = replaceOne(source, /function calcMonthlyPAYE[\s\S]*?(?=function renderRows)/, controller(config), `${config.id} controller`);
  }
  if (!source.includes('function publishResult(')) {
    source = source.replace(controller(config), `${controller(config)}\n${publishHelper()}\n`);
  } else {
    source = replaceNamedFunction(source, 'publishResult', publishHelper());
  }
  source = replaceNamedFunction(source, 'renderRows', renderRows(config));
  source = replaceNamedFunction(source, 'generatePdf', pdfFunction(config));
  source = replaceNamedFunction(source, 'getAI', aiFunction(config));
  source = source.replace(/class="action-row"/g, 'class="sw-paye-action-row"');
  source = source.replace(
    /\n?<script src="\/assets\/js\/share-image-inject\.js[^>]*><\/script>/,
    '',
  );
  const staleStart = '<!-- sw-paye-exact-three:stale-result-guards:start -->';
  if (source.includes(staleStart)) {
    source = source.replace(
      /<!-- sw-paye-exact-three:stale-result-guards:start -->[\s\S]*?<!-- sw-paye-exact-three:stale-result-guards:end -->/,
      staleResultGuards(),
    );
  } else {
    source = source.replace(
      "document.getElementById('grossSalary').addEventListener('keydown'",
      `${staleResultGuards()}\n\ndocument.getElementById('grossSalary').addEventListener('keydown'`,
    );
  }
  source = source.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');

  const before = fs.readFileSync(absolute, 'utf8');
  if (source !== before && WRITE) fs.writeFileSync(absolute, source, 'utf8');
  return source !== before;
}

function applyLocalFirstPageContract(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  let source = fs.readFileSync(absolute, 'utf8');
  const before = source;
  const localPolicy = '<meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts/build-sw-paye-exact-three.js">';
  if (source.includes('/assets/js/lib/local-first-afro-auth.js')) {
    source = source.replace('<script id="afro-auth-js" src="/assets/js/lib/local-first-afro-auth.js"></script>', localPolicy);
  } else if (!source.includes('name="afrotools-network-policy"')) {
    source = replaceOne(
      source,
      /(<script src="\/assets\/js\/components\/navbar\.min\.js[^>]*><\/script>)/,
      `${localPolicy}\n$1`,
      `${relativePath} local-only network policy`,
    );
  }
  if (!source.includes('local-first-chart-fallback')) {
    source = replaceOne(
      source,
      /function renderChart\(type\)\s*\{/,
      `function renderChart(type) {
  /* local-first-chart-fallback */
  const chartSection = document.querySelector('.chart-section');
  if (typeof window.Chart !== 'function') {
    if (chartSection) { chartSection.hidden = true; chartSection.setAttribute('aria-hidden', 'true'); }
    return;
  }
  if (chartSection) { chartSection.hidden = false; chartSection.removeAttribute('aria-hidden'); }`,
      `${relativePath} Chart.js fallback`,
    );
  }
  if (source !== before && WRITE) fs.writeFileSync(absolute, source, 'utf8');
  return source !== before;
}

function applyRwandaEnglishContract() {
  const relativePath = 'rwanda/rw-paye.html';
  const absolute = path.join(ROOT, relativePath);
  let source = fs.readFileSync(absolute, 'utf8');
  const before = source;
  const description = 'Calculate Rwanda PAYE with RSSB pension and maternity, mandatory CBHI at 0.5% of employee net salary, and the employer-only 2% occupational-hazard contribution.';
  source = source
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${description}">`)
    .replace(/Calculate Rwanda take-home pay using 2025\/26 RRA PAYE rates, RSSB pension, and maternity contributions\./g, description)
    .replace(
      'RRA progressive tax (0%–30%), RSSB social security (6% employee + 6% employer), and maternity contribution (0.3% employee + 0.3% employer). Monthly computation per RRA bands.',
      'RRA progressive tax (0%–30%), RSSB pension (6% employee + 6% employer), maternity (0.3% each), mandatory CBHI (0.5% of employee net salary), and employer occupational hazard (2%).',
    )
    .replace('<span class="badge b-blue">RSSB · Maternity</span>', '<span class="badge b-blue">RSSB · Maternity · CBHI · Occupational hazard</span>')
    .replace(/Last verified: March 2025 · Source: RRA \(rra\.gov\.rw\) · Law No\. 016\/2024 · RSSB Act 2016/g, 'Last verified: 3 August 2026 · Sources: RRA, RSSB and Official Gazette')
    .replace('<span class="tool-verification-badge">Last verified 2025-03-01</span>', '<span class="tool-verification-badge">Last verified 2026-08-02</span>')
    .replace('<p class="tool-verification-note">Rwanda - high risk - AfroTools source audit</p>', '<p class="tool-verification-note">Rwanda · high risk · current RRA/RSSB source review</p>')
    .replace('<li><a href="https://rra.gov.rw" target="_blank" rel="noopener">rra.gov.rw</a></li>\n<li><a href="https://rssb.gov.rw" target="_blank" rel="noopener">rssb.gov.rw</a></li>', '<li><a href="https://rra.gov.rw" target="_blank" rel="noopener">Rwanda Revenue Authority</a></li>\n<li><a href="https://www.rssb.rw/scheme/cbhi-scheme" target="_blank" rel="noopener">RSSB Community Based Health Insurance</a></li>\n<li><a href="https://www.rssb.rw/fileadmin/user_upload/Prime_Minister_s_order_CBHI-subsidies_13th_February_2020.pdf" target="_blank" rel="noopener">Official Gazette: Prime Minister Order N° 034/01</a></li>\n<li><a href="https://www.rssb.rw/scheme/occupational-hazards" target="_blank" rel="noopener">RSSB Occupational Hazards</a></li>')
    .replace('<p class="tool-verification-meta">Last verified: March 2025 · Source: RRA (rra</p>', '<p class="tool-verification-meta">Current RRA PAYE bands and RSSB pension, maternity, CBHI and occupational-hazard schemes reviewed 3 August 2026.</p>')
    .replace('<p class="tool-verification-meta">The calculator annualizes salary where needed, applies modeled employee statutory deductions, runs taxable income through the country PAYE bands, and derives net pay from gross pay minus modeled PAYE and statutory deductions. Employer-cost lines are informational where the page exposes them.</p>', '<p class="tool-verification-meta">The calculator deducts the 6% employee pension before PAYE, deducts employee maternity at 0.3%, and solves mandatory CBHI at 0.5% of employee net salary as a rounded fixed point. Employer cost adds pension 6%, maternity 0.3%, and employer-only occupational hazard 2%.</p>')
    .replace(
      'Employer matches 6%. Maternity levy <strong>0.3% employee + 0.3% employer</strong>.',
      'Employer matches 6%. Maternity levy <strong>0.3% employee + 0.3% employer</strong>, mandatory CBHI is <strong>0.5% of employee net salary</strong>, and employer occupational hazard is <strong>2%</strong>.',
    )
    .replace(
      'RSSB employee contribution (6%) is fully deductible from taxable income before PAYE is calculated. Employer RSSB (6%) is an additional cost shown in employer chart. No RSSB cap — applies to full gross salary.',
      'RSSB employee pension (6%) is deductible from taxable income before PAYE. Employee maternity (0.3%) is a separate deduction; mandatory CBHI is solved at 0.5% of employee net salary. Employer cost adds pension 6%, maternity 0.3%, and occupational hazard 2%.',
    )
    .replace('Maternity levy 0.3% also deducted from employee. Secondary employment: flat 30% on gross.', 'Employee maternity 0.3% and mandatory CBHI 0.5% are separate deductions. Employer occupational hazard is 2%. Secondary employment: flat 30% on gross.')
    .replace('Maternity contribution is 0.3% each for employee and employer. RSSB contributions are due by the 15th of the following month via rssb.gov.rw.', 'Maternity is 0.3% each for employee and employer, mandatory employee CBHI is 0.5%, and employer occupational hazard is 2%. Confirm current remittance treatment through the linked RSSB scheme pages.')
    .replace('<span class="card-title">RSSB · Maternity Rates 2025</span>', '<span class="card-title">RSSB · Maternity · CBHI · Occupational Hazard</span>')
    .replace(
      /<div class="band-row"><span class="band-range">Maternity \(employee \+ employer\)<\/span><span class="band-rate">0\.3% each of monthly salary<\/span><\/div>[\s\S]*?(?=\s*<p class="band-note">)/,
      '<div class="band-row"><span class="band-range">Maternity (employee + employer)</span><span class="band-rate">0.3% each of monthly salary</span></div>\n          <div class="band-row"><span class="band-range">Mandatory employee CBHI</span><span class="band-rate">0.5% of employee net salary</span></div>\n          <div class="band-row"><span class="band-range">Employer occupational hazard</span><span class="band-rate">2% of gross · employer only</span></div>',
    )
    .replace(
      'const empMaternity = gross * 0.003;   // 0.3% employee deduction\n  const maternity = gross * 0.003;      // 0.3% employer cost',
      'const employeeMaternity = gross * 0.003;\n  const employerMaternity = gross * 0.003;\n  const employerOccupationalHazard = gross * 0.02;',
    )
    .replace('const totalEmployeeDeductions = rssb + monthlyPAYE + empMaternity;', 'const totalEmployeeDeductions = rssb + monthlyPAYE + employeeMaternity + employeeCbhi;')
    .replace('empMaternity, maternity, empRssb,', 'employeeMaternity, employerMaternity, employeeCbhi, employerOccupationalHazard, social: rssb + employeeCbhi, empRssb,')
    .replace('annualEmpMaternity: annual(empMaternity),', 'annualEmployeeMaternity: annual(employeeMaternity), annualEmployeeCbhi: annual(employeeCbhi),')
    .replace('totalEmployerCostMonthly: gross + empRssb + maternity,', 'totalEmployerCostMonthly: gross + empRssb + employerMaternity + employerOccupationalHazard,')
    .replace('Gross + Employer RSSB ${fmt(empRssb)}/mo + employer maternity ${fmt(maternity)}/mo.', 'Gross + employer RSSB ${fmt(empRssb)}/mo + maternity ${fmt(employerMaternity)}/mo + occupational hazard ${fmt(employerOccupationalHazard)}/mo.')
    .replace('const empMat = isAnnual ? R.annualEmpMaternity : R.empMaternity;', 'const empMat = isAnnual ? R.annualEmployeeMaternity : R.employeeMaternity;\n  const cbhi = isAnnual ? R.annualEmployeeCbhi : R.employeeCbhi;')
    .replace('const totalDeductions = isAnnual ? R.annualTax + R.annualRssb + R.annualEmpMaternity : R.totalEmployeeDeductions;', 'const totalDeductions = isAnnual ? R.annualTax + R.annualRssb + R.annualEmployeeMaternity + R.annualEmployeeCbhi : R.totalEmployeeDeductions;')
    .replace(/\$\{row\(`Maternity levy \(0\.3%\)\$\{lbl\}`, fmt\(empMat\), 'c-red'\)\}(?:\s*\$\{row\(`Mandatory employee CBHI \(0\.5%\)\$\{lbl\}`, fmt\(cbhi\), 'c-red'\)\})*/, "${row(`Maternity levy (0.3%)${lbl}`, fmt(empMat), 'c-red')}\n      ${row(`Mandatory employee CBHI (0.5%)${lbl}`, fmt(cbhi), 'c-red')}")
    .replace("labels: ['Take-Home', 'PAYE Tax', 'RSSB']", "labels: ['Take-Home', 'PAYE Tax', 'RSSB', 'Maternity', 'CBHI']")
    .replace('data: [R.netMonthly, R.monthlyPAYE, R.rssb]', 'data: [R.netMonthly, R.monthlyPAYE, R.rssb, R.employeeMaternity, R.employeeCbhi]')
    .replace("labels: ['Take-Home', 'PAYE', 'Emp RSSB', 'Maternity']", "labels: ['Take-Home', 'PAYE', 'Emp RSSB', 'Maternity', 'Occupational hazard']")
    .replace('data:[R.netMonthly, R.monthlyPAYE, R.empRssb, R.maternity]', 'data:[R.netMonthly, R.monthlyPAYE, R.empRssb, R.employerMaternity, R.employerOccupationalHazard]')
    .replace(/subtitle: 'RRA PAYE, RSSB, and maternity levy estimate'/g, "subtitle: 'RRA PAYE, RSSB, maternity, CBHI and occupational-hazard estimate'")
    .replace("['Employee maternity levy', fmt(R.empMaternity)],", "['Employee maternity levy', fmt(R.employeeMaternity)],\n        ['Mandatory employee CBHI', fmt(R.employeeCbhi)],")
    .replace("['Annual maternity levy', fmt(R.annualEmpMaternity)],", "['Annual maternity levy', fmt(R.annualEmployeeMaternity)],\n        ['Annual employee CBHI', fmt(R.annualEmployeeCbhi)],")
    .replace("['Employer maternity levy', fmt(R.maternity)],", "['Employer maternity levy', fmt(R.employerMaternity)],\n        ['Employer occupational hazard', fmt(R.employerOccupationalHazard)],")
    .replace(/R\.empMaternity/g, 'R.employeeMaternity')
    .replace(/R\.maternity/g, 'R.employerMaternity')
    .replace('Employer RSSB Pension (6%)</td><td class="num red">RWF ${Math.round(R.empRssb).toLocaleString()}</td></tr>\n    <tr><td>Maternity Leave Contribution (0.3%, employer only)</td><td class="num red">RWF ${Math.round(R.employerMaternity).toLocaleString()}</td></tr>', 'Employer RSSB Pension (6%)</td><td class="num red">RWF ${Math.round(R.empRssb).toLocaleString()}</td></tr>\n    <tr><td>Maternity Leave Contribution (0.3%, employer)</td><td class="num red">RWF ${Math.round(R.employerMaternity).toLocaleString()}</td></tr>\n    <tr><td>Occupational Hazard Contribution (2%, employer only)</td><td class="num red">RWF ${Math.round(R.employerOccupationalHazard).toLocaleString()}</td></tr>')
    .replace(/(?:<tr><td>Employee maternity \(0\.3%\)<\/td><td class="num red">\(RWF \$\{Math\.round\(R\.employeeMaternity\)\.toLocaleString\(\)\}\)<\/td><\/tr>\s*<tr><td>Mandatory employee CBHI \(0\.5%\)<\/td><td class="num red">\(RWF \$\{Math\.round\(R\.employeeCbhi\)\.toLocaleString\(\)\}\)<\/td><\/tr>\s*)*<tr><td>PAYE income tax<\/td><td class="num red">\(RWF \$\{Math\.round\(R\.monthlyPAYE\)\.toLocaleString\(\)\}\)<\/td><\/tr>/, '<tr><td>Employee maternity (0.3%)</td><td class="num red">(RWF ${Math.round(R.employeeMaternity).toLocaleString()})</td></tr>\n    <tr><td>Mandatory employee CBHI (0.5%)</td><td class="num red">(RWF ${Math.round(R.employeeCbhi).toLocaleString()})</td></tr>\n    <tr><td>PAYE income tax</td><td class="num red">(RWF ${Math.round(R.monthlyPAYE).toLocaleString()})</td></tr>')
    .replace('maternity is a separate payroll deduction.', 'maternity and mandatory 0.5% employee CBHI are separate payroll deductions.')
    .replace(/Funds statutory maternity leave benefits\.<\/td><\/tr>(?:\s*<tr><td><span class="src">RSSB CBHI<\/span>[\s\S]*?rssb\.rw\/scheme\/occupational-hazards<\/td><\/tr>)*/, 'Funds statutory maternity leave benefits.</td></tr>\n    <tr><td><span class="src">RSSB CBHI</span>Employee health contribution</td><td style="color:#6b7280;font-size:8pt">Mandatory employee CBHI is 0.5% of employee net salary, solved as a rounded fixed point. Official sources: https://www.rssb.rw/scheme/cbhi-scheme and https://www.rssb.rw/fileadmin/user_upload/Prime_Minister_s_order_CBHI-subsidies_13th_February_2020.pdf</td></tr>\n    <tr><td><span class="src">RSSB Occupational Hazards</span>Employer risk contribution</td><td style="color:#6b7280;font-size:8pt">Employer-only occupational hazard contribution is 2% of gross. Official source: https://www.rssb.rw/scheme/occupational-hazards</td></tr>')
    .replace(/- Employer maternity \(0\.3%\):[^\r\n]*(?:\r?\n- (?:Employee CBHI|Employer occupational hazard)[^\r\n]*)*/, '- Employer maternity (0.3%): RWF ${Math.round(R.employerMaternity).toLocaleString()}/mo\n- Employee CBHI (0.5% of net salary): RWF ${Math.round(R.employeeCbhi).toLocaleString()}/mo\n- Employer occupational hazard (2%): RWF ${Math.round(R.employerOccupationalHazard).toLocaleString()}/mo');
  source = source
    .replace(/Calculate Rwanda PAYE with RSSB pension and maternity, mandatory 0\.5% employee CBHI, and the employer-only 2% occupational-hazard contribution\./g, description)
    .replace(/https:\/\/www\.rssb\.rw\/scheme\/cbhi(?!-scheme)/g, 'https://www.rssb.rw/scheme/cbhi-scheme')
    .replace(/0\.5% of gross/g, '0.5% of employee net salary')
    .replace(/mandatory 0\.5% employee CBHI/g, 'mandatory CBHI at 0.5% of employee net salary')
    .replace(/mandatory employee CBHI is 0\.5%/g, 'mandatory CBHI is 0.5% of employee net salary')
    .replace(/RWF 1,500/g, 'RWF 1,157')
    .replace(/RWF 231,000/g, 'RWF 231,343')
    .replace(/2 August 2026/g, '3 August 2026')
    .replace(/Last verified 2026-08-02/g, 'Last verified 2026-08-03')
    .replace(/Sources: RRA and RSSB official scheme pages/g, 'Sources: RRA, RSSB and Official Gazette');
  source = source
    .replace(
      '<p class="tool-verification-meta">Current RRA PAYE bands and RSSB pension, maternity, CBHI and occupational-hazard schemes reviewed 3 August 2026.</p>',
      '<p class="tool-verification-meta">Current RRA PAYE bands and RSSB pension, maternity, CBHI and occupational-hazard schemes reviewed 3 August 2026. Confidence is high for the published rates; CBHI payroll ordering and nearest-franc rounding are a documented calculator assumption because the RSSB notice does not specify them.</p>',
    )
    .replace(
      '<p class="tool-verification-meta">The calculator deducts the 6% employee pension before PAYE, then separately deducts employee maternity 0.3% and mandatory CBHI 0.5%. Employer cost adds pension 6%, maternity 0.3%, and employer-only occupational hazard 2%.</p>',
      '<p class="tool-verification-meta">The calculator deducts the 6% employee pension before PAYE, then separately deducts employee maternity 0.3%. It models CBHI as round((net before CBHI × 0.5%) / 1.005); confirm payroll ordering and rounding with RSSB. Employer cost adds pension 6%, maternity 0.3%, and employer-only occupational hazard 2%.</p>',
    );
  if (!source.includes('function solveEmployeeCbhi(preCbhiNet)')) {
    source = source.replace('  function calculate() {', `  function solveEmployeeCbhi(preCbhiNet) {
    const availableNet = Math.max(0, preCbhiNet);
    return Math.round((availableNet * 0.005) / 1.005);
  }

  function calculate() {`);
  }
  source = source.replace('  const employeeCbhi = gross * 0.005;\n', '');
  if (!source.includes('const employeeCbhi = solveEmployeeCbhi(')) {
    source = source.replace('  const totalEmployeeDeductions = rssb + monthlyPAYE + employeeMaternity + employeeCbhi;', '  const employeeCbhi = solveEmployeeCbhi(gross - rssb - monthlyPAYE - employeeMaternity);\n  const totalEmployeeDeductions = rssb + monthlyPAYE + employeeMaternity + employeeCbhi;');
  }
  const cbhiGazetteUrl = 'https://www.rssb.rw/fileadmin/user_upload/Prime_Minister_s_order_CBHI-subsidies_13th_February_2020.pdf';
  if (!source.includes(`href="${cbhiGazetteUrl}"`)) {
    source = source.replace(
      '<li><a href="https://www.rssb.rw/scheme/cbhi-scheme" target="_blank" rel="noopener">RSSB Community Based Health Insurance</a></li>',
      '<li><a href="https://www.rssb.rw/scheme/cbhi-scheme" target="_blank" rel="noopener">RSSB Community Based Health Insurance</a></li>\n<li><a href="' + cbhiGazetteUrl + '" target="_blank" rel="noopener">Official Gazette: Prime Minister Order N° 034/01</a></li>',
    );
  }
  const cbhiEmployerNoticeUrl = 'https://www.rssb.rw/fileadmin/user_upload/Announcement_to_all_employers_.pdf';
  if (!source.includes(`href="${cbhiEmployerNoticeUrl}"`)) {
    source = source.replace(
      '<li><a href="https://www.rssb.rw/scheme/cbhi-scheme" target="_blank" rel="noopener">RSSB Community Based Health Insurance</a></li>',
      '<li><a href="https://www.rssb.rw/scheme/cbhi-scheme" target="_blank" rel="noopener">RSSB Community Based Health Insurance</a></li>\n<li><a href="' + cbhiEmployerNoticeUrl + '" target="_blank" rel="noopener">RSSB employer notice: CBHI is 0.5% of employee net salary</a></li>',
    );
  }
  if (!source.includes('name="rw-paye-current-contribution-owner"')) {
    source = source.replace('<meta name="tool-id" content="rw-paye">', '<meta name="tool-id" content="rw-paye">\n<meta name="rw-paye-current-contribution-owner" content="scripts/build-sw-paye-exact-three.js">');
  }
  if (source !== before && WRITE) fs.writeFileSync(absolute, source, 'utf8');
  return source !== before;
}

let changed = 0;
for (const config of Object.values(TARGETS)) {
  if (applyTarget(config)) changed += 1;
}
if (applyRwandaEnglishContract()) changed += 1;
for (const page of [
  'uganda/ug-paye.html',
  'sw/uganda/kikokotoo-kodi-mshahara/index.html',
  'sw/rwanda/kikokotoo-kodi-mshahara/index.html',
  'sw/burundi/kikokotoo-kodi-mshahara/index.html',
]) {
  if (applyLocalFirstPageContract(page)) changed += 1;
}

if (!WRITE && changed) {
  throw new Error(`${changed} PAYE owner consumer(s) are stale. Run node scripts/build-sw-paye-exact-three.js --write.`);
}

console.log(`${WRITE ? 'Updated' : 'Verified'} exact-three PAYE owners (${changed} changed).`);

module.exports = { TARGETS, controller, renderRows, pdfFunction, aiFunction, staleResultGuards, contrastContract };
