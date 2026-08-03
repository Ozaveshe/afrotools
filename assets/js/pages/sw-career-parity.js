(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports){module.exports=api;}
  if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.SwCareerParity=api;}
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  var SCHEMA='afrotools.sw-career-plan.v1';
  var CURRENCY={
    NG:{code:'NGN',symbol:'₦',name:'Nigeria'},KE:{code:'KES',symbol:'KES ',name:'Kenya'},
    ZA:{code:'ZAR',symbol:'R',name:'Afrika Kusini'},GH:{code:'GHS',symbol:'GHS ',name:'Ghana'},
    EG:{code:'EGP',symbol:'EGP ',name:'Misri'},ET:{code:'ETB',symbol:'ETB ',name:'Ethiopia'},
    TZ:{code:'TZS',symbol:'TZS ',name:'Tanzania'},UG:{code:'UGX',symbol:'UGX ',name:'Uganda'},
    RW:{code:'RWF',symbol:'RWF ',name:'Rwanda'},CI:{code:'XOF',symbol:'XOF ',name:"Côte d'Ivoire"},
    CM:{code:'XAF',symbol:'XAF ',name:'Cameroon'},SN:{code:'XOF',symbol:'XOF ',name:'Senegal'},
    MA:{code:'MAD',symbol:'MAD ',name:'Morocco'},TN:{code:'TND',symbol:'TND ',name:'Tunisia'},
    AO:{code:'AOA',symbol:'AOA ',name:'Angola'},USD:{code:'USD',symbol:'$',name:'USD'}
  };

  var GROWTH={
    levels:[1,1.5,2.2,3.2,4.5,6.5],
    levelNames:['Ngazi ya kuingia','Junior','Ngazi ya kati','Senior','Kiongozi / Meneja','Mkurugenzi / VP'],
    industries:{tech:1.4,finance:1.35,healthcare:1.1,engineering:1.2,marketing:.95,fmcg:1.05,telecom:1.25,energy:1.5,ngo:.85,govt:.8},
    countryBase:{NG:120000,KE:35000,ZA:18000,GH:2200,EG:5000,ET:8000,TZ:800000,UG:1200000,RW:250000,CI:180000,CM:180000,SN:200000,MA:5000,TN:1800,AO:150000},
    education:{diploma:.85,degree:1,masters:1.15,phd:1.25},
    promotion:{ic:[0,2,3,4,5,6],management:[0,2,2,3,3,4],entrepreneur:[0,1,2,2,3,4],consultant:[0,2,3,3,4,5]},
    raise:{ic:.05,management:.07,entrepreneur:.12,consultant:.09},
    hop:{no:0,sometimes:.15,yes:.2},
    learning:{'0':1,'2':1.02,'5':1.04,'10':1.07},
    network:{low:1,medium:1.02,high:1.05}
  };

  function issue(field,message){var error=new Error(message);error.field=field;throw error;}
  function number(input,field,min,max,integer,message){
    var value=Number(input);
    if(!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value))){issue(field,message);}
    return value;
  }
  function choice(value,map,field,message){if(!Object.prototype.hasOwnProperty.call(map,value)){issue(field,message);}return value;}
  function formatMoney(symbol,value){
    var absolute=Math.abs(value);
    var text;
    if(absolute>=1000000000){text=(absolute/1000000000).toFixed(1)+'B';}
    else if(absolute>=1000000){text=(absolute/1000000).toFixed(1)+'M';}
    else if(absolute>=1000){text=(absolute/1000).toFixed(0)+'K';}
    else{text=Math.round(absolute).toLocaleString('en-US');}
    return (value<0?'-':'')+symbol+text;
  }
  function exactMoney(symbol,value){return (value<0?'-':'')+symbol+Math.round(Math.abs(value)).toLocaleString('en-US');}

  function calculateCareerGrowth(raw){
    var country=choice(raw.country,GROWTH.countryBase,'country','Chagua nchi iliyo kwenye orodha.');
    var industry=choice(raw.industry,GROWTH.industries,'industry','Chagua sekta iliyo kwenye orodha.');
    var level=number(raw.level,'level',0,5,true,'Chagua ngazi halali ya kazi.');
    var salary=number(raw.salary,'salary',0,1000000000000,false,'Weka mshahara wa mwezi kati ya 0 na 1,000,000,000,000.');
    var experience=number(raw.experience,'experience',0,40,false,'Weka uzoefu kati ya miaka 0 na 40.');
    var education=choice(raw.education,GROWTH.education,'education','Chagua kiwango halali cha elimu.');
    var path=choice(raw.path,GROWTH.raise,'path','Chagua njia halali ya ukuaji.');
    var learning=choice(String(raw.learning),GROWTH.learning,'learning','Chagua muda halali wa kujifunza.');
    var network=choice(raw.network,GROWTH.network,'network','Chagua kiwango halali cha mtandao wa kitaaluma.');
    var mobility=choice(raw.mobility,GROWTH.hop,'mobility','Chagua mpango halali wa kubadili mwajiri.');
    var symbol=CURRENCY[country].symbol;
    var start=salary>0?salary:GROWTH.countryBase[country]*GROWTH.levels[level]*GROWTH.industries[industry]*GROWTH.education[education];
    var annualRaise=GROWTH.raise[path]+(GROWTH.learning[learning]-1)*2+(GROWTH.network[network]-1)*2;
    var hopGain=GROWTH.hop[mobility];
    var intervals=GROWTH.promotion[path];
    var yearsToPromotion=intervals[Math.min(level,intervals.length-1)];
    if(yearsToPromotion===0&&level<intervals.length-1){yearsToPromotion=intervals[level+1];}
    var promotionPremium=(GROWTH.levels[Math.min(level+1,5)]/GROWTH.levels[level]-1)*.5;
    var rows=[];
    var milestones=[];
    var currentSalary=start;
    var cumulative=0;
    var currentLevel=level;
    var yearsInLevel=0;
    for(var year=0;year<=10;year++){
      var event=year===0?'Mwanzo':'';
      if(year>0){
        currentSalary*=1+annualRaise;
        currentSalary*=GROWTH.learning[learning]*GROWTH.network[network];
        yearsInLevel++;
        var interval=intervals[Math.min(currentLevel,intervals.length-1)];
        if(currentLevel<GROWTH.levelNames.length-1&&yearsInLevel>=interval&&interval>0){
          currentLevel++;
          var premium=GROWTH.levels[currentLevel]/GROWTH.levels[currentLevel-1]-1;
          currentSalary*=1+premium*.5;
          yearsInLevel=0;
          event='Kupandishwa hadi '+GROWTH.levelNames[currentLevel];
          milestones.push('Mwaka '+year+': '+event+' — '+formatMoney(symbol,currentSalary)+'/mwezi');
        }
        if(mobility==='yes'&&year%2===0){
          currentSalary*=1+hopGain;
          event=event||'Kubadili mwajiri (+'+Math.round(hopGain*100)+'%)';
          milestones.push('Mwaka '+year+': kubadili mwajiri — '+formatMoney(symbol,currentSalary)+'/mwezi');
        }else if(mobility==='sometimes'&&year%4===0){
          currentSalary*=1+hopGain;
          event=event||'Hatua mpya ya kazi (+'+Math.round(hopGain*100)+'%)';
          milestones.push('Mwaka '+year+': hatua mpya — '+formatMoney(symbol,currentSalary)+'/mwezi');
        }
        cumulative+=currentSalary*12;
      }
      rows.push({year:year,level:GROWTH.levelNames[Math.min(currentLevel,5)],salary:currentSalary,annual:currentSalary*12,event:event||'Ukuaji wa kawaida'});
    }
    var input={country:country,industry:industry,level:level,salary:salary,experience:experience,education:education,path:path,learning:learning,network:network,mobility:mobility};
    var growthDrivers=[
      {label:'Ongezeko la mwaka',value:Math.round(annualRaise*100)+'% kwa mwaka',note:'Msingi '+Math.round(GROWTH.raise[path]*100)+'% pamoja na nyongeza za kujifunza na mtandao'},
      {label:'Nyongeza ya kupandishwa ngazi',value:'+'+Math.round(promotionPremium*100)+'% katika ngazi inayofuata',note:'Makadirio ya miaka hadi kupandishwa: '+(yearsToPromotion||'haitumiki')},
      {label:'Nyongeza ya kubadili mwajiri',value:hopGain>0?'+'+Math.round(hopGain*100)+'% kwa kila hatua':'Haitumiki',note:hopGain>0?'Modeli huweka nyongeza katika kila hatua iliyochaguliwa':'Ukuaji wa ndani pekee; hakuna nyongeza ya kubadili mwajiri'}
    ];
    var recommendedNextSteps=[];
    if(learning==='0'){recommendedNextSteps.push('Tenga saa 2 hadi 5 kwa wiki kwa ujuzi unaofaa na jenga mradi wa ushahidi unaoonyesha maendeleo.');}
    if(network==='low'){recommendedNextSteps.push('Panua mtandao wako wa kitaaluma: hudhuria tukio moja la sekta kila robo mwaka na shiriki kitaaluma mtandaoni kila wiki.');}
    if(mobility==='no'){recommendedNextSteps.push('Linganisha mara kwa mara nafasi za nje na maendeleo ya ndani bila kudhani kuwa kubadili kazi huongeza malipo au masharti kila wakati.');}
    if(currentLevel<4){recommendedNextSteps.push('Andika mafanikio yako kila mwezi ili ujenge rekodi kwa tathmini ya utendaji au ombi la kazi.');}
    recommendedNextSteps.push('Jiandae kwa mazungumzo yanayofaa ukitumia ushahidi wa sasa wa soko na rekodi wazi ya matokeo yako.');
    recommendedNextSteps.push('Kuza uongozi na mawasiliano pamoja na ujuzi wa kiufundi, kisha thibitisha uwezo unaohitajika na nafasi unayolenga.');
    return {
      app:'career-growth',input:input,symbol:symbol,country:CURRENCY[country].name,
      startSalary:start,annualRaise:annualRaise,hopGain:hopGain,yearsToPromotion:yearsToPromotion||null,
      promotionPremium:promotionPremium,growthDrivers:growthDrivers,recommendedNextSteps:recommendedNextSteps,
      fiveYearSalary:rows[5].salary,tenYearSalary:rows[10].salary,cumulativeEarnings:cumulative,
      projectedLevel:rows[10].level,rows:rows,milestones:milestones,
      display:{
        headline:rows[10].level+' baada ya miaka 10',
        subtitle:'Hali ya kupanga; si ahadi ya mshahara au kupandishwa cheo.',
        metrics:[
          ['Mshahara wa kuanzia',formatMoney(symbol,start)+'/mwezi'],
          ['Baada ya miaka 5',formatMoney(symbol,rows[5].salary)+'/mwezi'],
          ['Baada ya miaka 10',formatMoney(symbol,rows[10].salary)+'/mwezi'],
          ['Mapato ya miaka 10',formatMoney(symbol,cumulative)]
        ],
        table:{headers:['Mwaka','Ngazi','Kwa mwezi','Kwa mwaka','Tukio'],rows:rows.map(function(row){return ['Y'+row.year,row.level,formatMoney(symbol,row.salary),formatMoney(symbol,row.annual),row.event];})},
        notes:(milestones.length?milestones:['Hakuna tukio maalum katika hali hii. Linganisha tena na ushahidi wa soko.']),
        sections:[
          {heading:'Vichocheo vya ukuaji',kind:'drivers',items:growthDrivers},
          {heading:'Hatua zinazopendekezwa',kind:'ordered',items:recommendedNextSteps}
        ]
      }
    };
  }

  function calculateCareerSwitch(raw){
    var currency=choice(raw.currency,{NGN:1,KES:1,ZAR:1,GHS:1,USD:1},'currency','Chagua sarafu halali.');
    var current=number(raw.currentSalary,'currentSalary',.01,1000000000000,false,'Weka mshahara wa sasa unaozidi 0.');
    var benefits=number(raw.currentBenefits,'currentBenefits',0,1000000000000,false,'Weka thamani ya manufaa kati ya 0 na 1,000,000,000,000.');
    var next=number(raw.newSalary,'newSalary',.01,1000000000000,false,'Weka mshahara mpya unaotarajiwa unaozidi 0.');
    var trainingCost=number(raw.trainingCost,'trainingCost',0,1000000000000,false,'Weka gharama ya mafunzo kati ya 0 na 1,000,000,000,000.');
    var trainingMonths=number(raw.trainingMonths,'trainingMonths',0,48,true,'Weka miezi kamili ya mafunzo kati ya 0 na 48.');
    var searchMonths=number(raw.searchMonths,'searchMonths',0,18,true,'Weka miezi kamili ya kutafuta kazi kati ya 0 na 18.');
    var partTime=number(raw.partTimeRatio,'partTimeRatio',0,1,false,'Chagua asilimia halali ya mapato wakati wa mafunzo.');
    var growth=number(raw.growthRate,'growthRate',0,50,false,'Weka ukuaji wa mwaka kati ya 0% na 50%.')/100;
    var satisfaction=number(raw.satisfaction,'satisfaction',1,10,true,'Weka alama ya kuridhika kati ya 1 na 10.');
    var symbol={NGN:'₦',KES:'KES ',ZAR:'R',GHS:'GHS ',USD:'$'}[currency];
    var currentPackage=current+benefits;
    var forfeited=currentPackage*trainingMonths*(1-partTime);
    var searchGap=currentPackage*searchMonths;
    var totalCost=trainingCost+forfeited+searchGap;
    var monthlyGain=next-currentPackage;
    var breakEven=monthlyGain>0?Math.ceil(totalCost/monthlyGain):999;
    var gap=trainingMonths+searchMonths;
    var cumulativeCurrent=0;
    var cumulativeNew=-trainingCost;
    var rows=[];
    for(var year=1;year<=5;year++){
      var startMonth=(year-1)*12;
      var endMonth=year*12;
      for(var month=startMonth;month<endMonth;month++){
        cumulativeCurrent+=currentPackage;
        if(month<trainingMonths){cumulativeNew+=currentPackage*partTime;}
        else if(month>=gap){cumulativeNew+=next*Math.pow(1+growth/12,month-gap);}
      }
      rows.push({year:year,current:cumulativeCurrent,newCareer:cumulativeNew,difference:cumulativeNew-cumulativeCurrent});
    }
    var input={currency:currency,currentSalary:current,currentBenefits:benefits,newSalary:next,trainingCost:trainingCost,trainingMonths:trainingMonths,searchMonths:searchMonths,partTimeRatio:partTime,growthRate:growth*100,satisfaction:satisfaction};
    return {
      app:'career-switch',input:input,symbol:symbol,currentPackage:currentPackage,forfeitedIncome:forfeited,
      searchGap:searchGap,totalCost:totalCost,monthlyGain:monthlyGain,breakEven:breakEven,rows:rows,
      display:{
        headline:exactMoney(symbol,totalCost),
        subtitle:monthlyGain>0?'Makadirio ya gharama; break-even miezi '+breakEven+' baada ya kuanza kazi mpya.':'Mshahara mpya ni chini ya kifurushi cha sasa; break-even haipatikani.',
        metrics:[
          ['Gharama ya mafunzo',exactMoney(symbol,trainingCost)],
          ['Mapato yaliyokosekana',exactMoney(symbol,forfeited)],
          ['Pengo la kutafuta kazi',exactMoney(symbol,searchGap)],
          ['Faida ya mwezi',exactMoney(symbol,monthlyGain)]
        ],
        table:{headers:['Mwaka','Endelea sasa','Kazi mpya','Tofauti'],rows:rows.map(function(row){return ['Mwaka '+row.year,exactMoney(symbol,row.current),exactMoney(symbol,row.newCareer),exactMoney(symbol,row.difference)];})},
        notes:['Alama yako ya kuridhika ni '+satisfaction+'/10; ichukulie kama ishara moja pamoja na fedha, afya, familia na mahitaji halisi ya kazi.']
      }
    };
  }

  function projectSavings(current,monthly,years,rate){
    var monthlyRate=rate/12;
    var months=years*12;
    var future=current*Math.pow(1+monthlyRate,months);
    if(monthlyRate>0){future+=monthly*(Math.pow(1+monthlyRate,months)-1)/monthlyRate;}
    else{future+=monthly*months;}
    return future;
  }

  function calculateRetirement(raw){
    var country=choice(raw.country,CURRENCY,'country','Chagua nchi iliyo kwenye orodha.');
    if(country==='USD'){issue('country','Chagua nchi iliyo kwenye orodha.');}
    var age=number(raw.age,'age',18,65,true,'Weka umri wa sasa kati ya miaka 18 na 65.');
    var retireAge=number(raw.retireAge,'retireAge',40,75,true,'Weka umri wa kustaafu kati ya miaka 40 na 75.');
    if(retireAge<=age){issue('retireAge','Umri wa kustaafu lazima uzidi umri wako wa sasa.');}
    var savings=number(raw.savings,'savings',0,1000000000000000,false,'Weka akiba kati ya 0 na 1,000,000,000,000,000.');
    var contribution=number(raw.contribution,'contribution',0,1000000000000,false,'Weka mchango wa mwezi kati ya 0 na 1,000,000,000,000.');
    var salary=number(raw.salary,'salary',0,1000000000000,false,'Weka mshahara wa mwezi kati ya 0 na 1,000,000,000,000.');
    var pension=number(raw.pensionPayout,'pensionPayout',0,1000000000000,false,'Weka malipo ya pensheni kati ya 0 na 1,000,000,000,000.');
    var expenses=number(raw.expenses,'expenses',.01,1000000000000,false,'Weka matumizi ya kustaafu yanayozidi 0.');
    var dependants=number(raw.dependants,'dependants',0,20,true,'Weka idadi halali ya watu unaowategemeza.');
    var housing=choice(raw.housing,{owned:1,renting:1,mortgage:1,family:1},'housing','Chagua hali halali ya makazi.');
    var health=choice(raw.health,{none:1,public:1,employer:1,private:1},'health','Chagua mpango halali wa afya.');
    var years=retireAge-age;
    var target=expenses*12*25;
    var pessimistic=projectSavings(savings,contribution,years,0);
    var projected=projectSavings(savings,contribution,years,.03);
    var optimistic=projectSavings(savings,contribution,years,.05);
    var score=Math.min(Math.round(projected/target*100),100);
    var gap=target-projected;
    var extra=0;
    if(gap>0){
      var r=.03/12;
      var n=years*12;
      extra=gap/((Math.pow(1+r,n)-1)/r);
    }
    var fromSavings=projected*.04/12;
    var totalIncome=fromSavings+pension;
    var shortfall=totalIncome-expenses;
    var grade=score>=80?'A — Ufunikaji thabiti':score>=60?'B — Ufunikaji wa kati':score>=40?'C — Pengo kubwa':score>=20?'D — Pengo pana':'F — Pengo kubwa sana';
    var flags=[];
    if(health==='none'){flags.push('Hakuna mpango wa afya baada ya kustaafu; ongeza makadirio yaliyothibitishwa kwenye matumizi.');}
    if(housing==='renting'||housing==='mortgage'){flags.push('Malipo ya makazi yanaendelea; hakikisha yamo kwenye matumizi ya mwezi.');}
    if(dependants>=2){flags.push('Unatarajia kusaidia watu wawili au zaidi; jumuisha gharama zao zinazoendelea.');}
    if(contribution===0){flags.push('Hakuna mchango wa mwezi uliowekwa; hakiki kama michango hufanyika mahali pengine.');}
    if(years<10){flags.push('Miaka chini ya 10 imebaki; pima mawazo ya mapato kwa tahadhari zaidi.');}
    if(score<40){flags.push('Mfano unaonyesha pengo kubwa; hakiki ingizo na tafuta ushauri wa fedha unaofaa nchi yako.');}
    var input={country:country,age:age,retireAge:retireAge,savings:savings,contribution:contribution,salary:salary,pensionPayout:pension,expenses:expenses,dependants:dependants,housing:housing,health:health};
    var symbol=CURRENCY[country].symbol;
    return {
      app:'retirement-readiness',input:input,country:CURRENCY[country].name,symbol:symbol,yearsLeft:years,
      target:target,pessimistic:pessimistic,projected:projected,optimistic:optimistic,score:score,grade:grade,
      extraContribution:extra,monthlyFromSavings:fromSavings,totalMonthlyIncome:totalIncome,shortfall:shortfall,flags:flags,
      display:{
        headline:score+'% — '+grade,
        subtitle:'Ufunikaji wa lengo la 25×; si uhakikisho wa matokeo ya kustaafu.',
        metrics:[
          ['Akiba iliyokadiriwa',formatMoney(symbol,projected)],
          ['Lengo la 25×',formatMoney(symbol,target)],
          ['Mapato ya mwezi',formatMoney(symbol,totalIncome)],
          ['Pengo / ziada ya mwezi',formatMoney(symbol,shortfall)],
          ['Mchango wa ziada unaohitajika',gap>0?formatMoney(symbol,extra)+'/mwezi':'Hakuna pengo la modeli']
        ],
        table:{headers:['Hali','Akiba iliyokadiriwa','Tofauti na lengo'],rows:[
          ['0% real return',formatMoney(symbol,pessimistic),formatMoney(symbol,pessimistic-target)],
          ['3% real return',formatMoney(symbol,projected),formatMoney(symbol,projected-target)],
          ['5% real return',formatMoney(symbol,optimistic),formatMoney(symbol,optimistic-target)]
        ]},
        notes:flags.length?flags:['Hakuna ishara kubwa katika ingizo hili; endelea kuhakiki kila mwaka.']
      }
    };
  }

  function calculateSalaryNegotiation(raw){
    var country=choice(raw.country,{NG:1,KE:1,ZA:1,GH:1,EG:1,ET:1,RW:1,CI:1,SN:1},'country','Chagua nchi iliyo kwenye orodha.');
    var experience=number(raw.experience,'experience',0,40,true,'Weka miaka kamili ya uzoefu kati ya 0 na 40.');
    var benchmark=number(raw.benchmark,'benchmark',1,1000000000000,false,'Weka kiwango cha kati kilichothibitishwa kati ya 1 na 1,000,000,000,000.');
    var current=number(raw.currentSalary,'currentSalary',0,1000000000000,false,'Weka mshahara wa sasa kati ya 0 na 1,000,000,000,000.');
    var offer=number(raw.offerSalary,'offerSalary',0,1000000000000,false,'Weka ofa kati ya 0 na 1,000,000,000,000.');
    var industry=String(raw.industry||'other');
    var role=String(raw.role||'other');
    var companySize=String(raw.companySize||'unknown');
    var location=String(raw.location||'unknown');
    var median=Math.round(benchmark);
    var lower=Math.round(median*.9);
    var upper=Math.round(median*1.1);
    var counter=Math.round(median*1.05);
    var comparison='Haijawekwa';
    var assessment='Weka ofa ili kuilinganisha na kiwango ulichoweka.';
    if(offer>0){
      var ratio=offer/median;
      if(ratio<.9){comparison='Chini ya ukingo wa chini';assessment='Ofa iko '+Math.round((1-ratio)*100)+'% chini ya kiwango chako. Hakiki ushahidi, wajibu na kifurushi chote.';}
      else if(ratio<.98){comparison='Chini ya kiwango cha kati';assessment='Ofa iko chini ya kiwango cha kati. Linganisha manufaa na wajibu kabla ya kujibu.';}
      else if(ratio<=1.02){comparison='Karibu na kiwango cha kati';assessment='Ofa iko karibu na kiwango cha kati. Hakiki kifurushi chote na vipaumbele vyako.';}
      else if(ratio<=1.1){comparison='Juu ya kiwango cha kati';assessment='Ofa iko juu ya kiwango cha kati. Hakiki masharti yote kwa maandishi.';}
      else{comparison='Juu ya ukingo wa juu';assessment='Ofa iko juu ya ukingo wa kupanga. Thibitisha wajibu, malipo yanayobadilika na masharti.';}
    }
    var symbol=CURRENCY[country].symbol;
    var script='Asante kwa ofa hii. Nimefurahia nafasi na wajibu wake. Nimekagua ushahidi wa karibuni wa nafasi zinazofanana na matokeo ninayoweza kuonyesha. Kwa uzoefu wangu wa miaka '+experience+', ningependa kujadili kifurushi kinachokaribia '+exactMoney(symbol,counter)+' kwa mwezi. Je, kuna nafasi ya kusogeza ofa kuelekea '+exactMoney(symbol,median)+'–'+exactMoney(symbol,counter)+'? Ninaweza kushiriki ushahidi unaounga mkono kiwango hicho na ningependa pia kuelewa muundo wa kifurushi chote. Ikiwa mshahara wa msingi hauwezi kubadilika, niko tayari kujadili bonasi ya utendaji, siku za ziada za likizo, unyumbufu wa kufanya kazi kwa mbali au tathmini ya utendaji baada ya miezi 6.';
    var input={country:country,industry:industry,role:role,experience:experience,benchmark:benchmark,currentSalary:current,offerSalary:offer,companySize:companySize,location:location};
    return {
      app:'salary-negotiation',input:input,symbol:symbol,lower:lower,median:median,upper:upper,counter:counter,
      current:current,offer:offer,comparison:comparison,assessment:assessment,script:script,
      display:{
        headline:exactMoney(symbol,median),
        subtitle:'Kiwango cha kati ulichothibitisha — '+comparison+'.',
        metrics:[
          ['Ukingo wa chini (90%)',exactMoney(symbol,lower)],
          ['Kiwango cha kati (100%)',exactMoney(symbol,median)],
          ['Hali ya counter-ofa (105%)',exactMoney(symbol,counter)],
          ['Ukingo wa juu (110%)',exactMoney(symbol,upper)]
        ],
        table:null,
        notes:[assessment,script]
      }
    };
  }

  var calculators={
    'career-growth':calculateCareerGrowth,
    'career-switch':calculateCareerSwitch,
    'retirement-readiness':calculateRetirement,
    'salary-negotiation':calculateSalaryNegotiation
  };

  function report(plan){
    var lines=['AfroTools — mpango wa '+plan.app,'schema: '+SCHEMA,'locale: sw','reviewed: 2026-07-31',''];
    if(plan.app==='career-growth'){
      lines.push('Nchi: '+plan.country,'Mshahara wa kuanzia: '+formatMoney(plan.symbol,plan.startSalary),'Mshahara mwaka wa 5: '+formatMoney(plan.symbol,plan.fiveYearSalary),'Mshahara mwaka wa 10: '+formatMoney(plan.symbol,plan.tenYearSalary),'Mapato ya miaka 10: '+formatMoney(plan.symbol,plan.cumulativeEarnings),'Ongezeko la mwaka: '+(plan.annualRaise*100).toFixed(2)+'%','');
      plan.rows.forEach(function(row){lines.push('Y'+row.year+': '+row.level+' | '+formatMoney(plan.symbol,row.salary)+'/mwezi | '+row.event);});
      lines.push('','Vichocheo vya ukuaji');
      plan.growthDrivers.forEach(function(driver){lines.push('- '+driver.label+': '+driver.value+' — '+driver.note);});
      lines.push('','Hatua zinazopendekezwa');
      plan.recommendedNextSteps.forEach(function(step,index){lines.push((index+1)+'. '+step);});
    }else if(plan.app==='career-switch'){
      lines.push('Gharama ya kubadili: '+exactMoney(plan.symbol,plan.totalCost),'Faida ya mwezi: '+exactMoney(plan.symbol,plan.monthlyGain),'Break-even: '+(plan.breakEven<900?plan.breakEven+' miezi':'haipatikani'),'');
      plan.rows.forEach(function(row){lines.push('Mwaka '+row.year+': sasa '+exactMoney(plan.symbol,row.current)+' | mpya '+exactMoney(plan.symbol,row.newCareer)+' | tofauti '+exactMoney(plan.symbol,row.difference));});
    }else if(plan.app==='retirement-readiness'){
      lines.push('Nchi: '+plan.country,'Miaka iliyobaki: '+plan.yearsLeft,'Alama: '+plan.score+'%','Daraja: '+plan.grade,'Lengo: '+formatMoney(plan.symbol,plan.target),'Akiba iliyokadiriwa: '+formatMoney(plan.symbol,plan.projected),'Pengo/ziada ya mwezi: '+formatMoney(plan.symbol,plan.shortfall),'Mchango wa ziada unaohitajika: '+(plan.extraContribution>0?formatMoney(plan.symbol,plan.extraContribution)+'/mwezi':'Hakuna'));
    }else{
      lines.push('Kiwango cha chini: '+exactMoney(plan.symbol,plan.lower),'Kiwango cha kati: '+exactMoney(plan.symbol,plan.median),'Counter-ofa: '+exactMoney(plan.symbol,plan.counter),'Kiwango cha juu: '+exactMoney(plan.symbol,plan.upper),'Ulinganisho: '+plan.comparison,'','Script:',plan.script);
    }
    lines.push('','Mipaka: makadirio ya kupanga tu. Hakiki ushahidi wa soko, mwajiri, HR, mtoa pensheni, mshauri aliyedhibitiwa au chanzo rasmi kinachofaa kabla ya kuamua.');
    return lines.join('\n');
  }

  function envelope(plan){return {schema:SCHEMA,locale:'sw',app:plan.app,exportedAt:new Date().toISOString(),input:plan.input,output:plan};}
  function storageKey(app){return 'afrotools-sw-'+app+'-plan-v1';}
  function filename(app,extension){return 'mpango-'+app+'-sw.'+extension;}
  function download(text,name,type){
    var blob=new Blob([text],{type:type});
    var url=URL.createObjectURL(blob);
    var link=document.createElement('a');
    link.href=url;link.download=name;
    document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  }
  function setStatus(message){var node=document.querySelector('[data-career-status]');if(node){node.textContent=message||'';}}
  function setError(message,field){
    var node=document.querySelector('[data-career-error]');
    if(node){node.textContent=message||'';}
    if(field){var target=document.querySelector('[name="'+field+'"]');if(target){target.focus();}}
  }
  function clearResult(state){
    state.plan=null;
    var results=document.querySelector('[data-career-results]');
    if(results){results.hidden=true;}
    setError('');setStatus('');
  }
  function addTextElement(parent,tag,text,className){
    var node=document.createElement(tag);
    if(className){node.className=className;}
    node.textContent=String(text);
    parent.appendChild(node);
    return node;
  }
  function render(plan){
    var results=document.querySelector('[data-career-results]');
    document.querySelector('[data-result-headline]').textContent=plan.display.headline;
    document.querySelector('[data-result-subtitle]').textContent=plan.display.subtitle;
    var metrics=document.querySelector('[data-result-metrics]');
    metrics.textContent='';
    plan.display.metrics.forEach(function(metric){
      var card=document.createElement('div');card.className='sc-metric';
      addTextElement(card,'strong',metric[1]);
      addTextElement(card,'span',metric[0]);
      metrics.appendChild(card);
    });
    var tableWrap=document.querySelector('[data-result-table]');
    tableWrap.textContent='';
    if(plan.display.table){
      var table=document.createElement('table');table.className='sc-table';
      var head=document.createElement('thead');var headRow=document.createElement('tr');
      plan.display.table.headers.forEach(function(label){addTextElement(headRow,'th',label);});
      head.appendChild(headRow);table.appendChild(head);
      var body=document.createElement('tbody');
      plan.display.table.rows.forEach(function(row){
        var tr=document.createElement('tr');
        row.forEach(function(value){addTextElement(tr,'td',value);});
        body.appendChild(tr);
      });
      table.appendChild(body);tableWrap.appendChild(table);tableWrap.hidden=false;
    }else{tableWrap.hidden=true;}
    var notes=document.querySelector('[data-result-notes]');
    notes.textContent='';
    plan.display.notes.forEach(function(note){addTextElement(notes,'li',note);});
    var oldSections=results.querySelector('.sc-result-sections');
    if(oldSections){oldSections.remove();}
    if(plan.display.sections&&plan.display.sections.length){
      var sections=document.createElement('div');sections.className='sc-result-sections';
      plan.display.sections.forEach(function(section){
        addTextElement(sections,'h3',section.heading);
        if(section.kind==='drivers'){
          var grid=document.createElement('div');grid.className='sc-metrics';
          section.items.forEach(function(item){
            var card=document.createElement('div');card.className='sc-metric';
            addTextElement(card,'strong',item.value);addTextElement(card,'span',item.label);addTextElement(card,'small',item.note);
            grid.appendChild(card);
          });
          sections.appendChild(grid);
        }else{
          var list=document.createElement('ol');list.className='sc-list';
          section.items.forEach(function(item){addTextElement(list,'li',item);});sections.appendChild(list);
        }
      });
      var actions=results.querySelector('.sc-actions');
      results.insertBefore(sections,actions||null);
    }
    results.hidden=false;
  }
  function formInput(form){
    var input={};
    form.querySelectorAll('[name]').forEach(function(field){
      input[field.name]=field.hasAttribute('data-number')?Number(field.value):field.value;
    });
    return input;
  }
  function populate(form,input){
    Object.keys(input).forEach(function(name){
      var field=form.querySelector('[name="'+name+'"]');
      if(field){field.value=String(input[name]);}
    });
  }
  function parseEnvelope(text,app){
    if(text.length>200000){throw new Error('Faili ni kubwa kuliko kikomo cha KB 200.');}
    var parsed=JSON.parse(text);
    if(!parsed||parsed.schema!==SCHEMA||parsed.locale!=='sw'||parsed.app!==app||!parsed.input){throw new Error('Faili si mpango halali wa app hii.');}
    return parsed;
  }
  function copyText(text){
    if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(text);}
    var field=document.createElement('textarea');
    field.value=text;field.setAttribute('readonly','');field.style.position='fixed';field.style.left='-9999px';
    document.body.appendChild(field);field.select();document.execCommand('copy');field.remove();
    return Promise.resolve();
  }
  function init(){
    if(typeof document==='undefined'){return;}
    var app=document.body&&document.body.getAttribute('data-sw-career-app');
    if(!app||!calculators[app]){return;}
    var form=document.querySelector('[data-career-form]');
    var state={plan:null};
    form.addEventListener('input',function(){clearResult(state);});
    form.addEventListener('change',function(){clearResult(state);});
    form.addEventListener('submit',function(event){
      event.preventDefault();
      try{
        var plan=calculators[app](formInput(form));
        state.plan=plan;setError('');render(plan);setStatus('Mpango uko tayari kwa kunakili, kupakua au kuhifadhi binafsi.');
      }catch(error){clearResult(state);setError(error.message,error.field);}
    });
    document.querySelectorAll('[data-career-action]').forEach(function(button){
      button.addEventListener('click',function(){
        var action=button.getAttribute('data-career-action');
        if(action==='theme'){
          document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
          button.setAttribute('aria-pressed',document.documentElement.dataset.theme==='dark'?'true':'false');
          return;
        }
        if(!state.plan&&action!=='open'&&action!=='delete'){setStatus('Kokotoa mpango kwanza.');return;}
        if(action==='copy'){copyText(report(state.plan)).then(function(){setStatus('Mpango umenakiliwa.');}).catch(function(){setStatus('Kunakili hakukufaulu; pakua TXT badala yake.');});}
        if(action==='txt'){download(report(state.plan),filename(app,'txt'),'text/plain;charset=utf-8');setStatus('TXT imepakuliwa.');}
        if(action==='json'){download(JSON.stringify(envelope(state.plan),null,2),filename(app,'json'),'application/json');setStatus('JSON imepakuliwa.');}
        if(action==='save'){try{localStorage.setItem(storageKey(app),JSON.stringify(envelope(state.plan)));setStatus('Mpango umehifadhiwa kwenye kivinjari hiki.');}catch(error){setStatus('Hifadhi ya kivinjari haipatikani; pakua JSON.');}}
        if(action==='open'){
          try{
            var stored=localStorage.getItem(storageKey(app));
            if(!stored){setStatus('Hakuna mpango uliohifadhiwa kwenye kivinjari hiki.');return;}
            var parsed=parseEnvelope(stored,app);populate(form,parsed.input);
            state.plan=calculators[app](parsed.input);render(state.plan);setError('');setStatus('Mpango wa kivinjari umefunguliwa na kukokotolewa upya.');
          }catch(error){clearResult(state);setError('Mpango uliohifadhiwa haukusomeka: '+error.message);}
        }
        if(action==='delete'){localStorage.removeItem(storageKey(app));setStatus('Mpango wa kivinjari umefutwa.');}
      });
    });
    var file=document.querySelector('[data-career-import]');
    if(file){
      file.addEventListener('change',function(){
        var selected=file.files&&file.files[0];
        if(!selected){return;}
        if(selected.size>200000){clearResult(state);setError('Faili ni kubwa kuliko kikomo cha KB 200.');file.value='';return;}
        var reader=new FileReader();
        reader.onload=function(){
          try{
            var parsed=parseEnvelope(String(reader.result||''),app);populate(form,parsed.input);
            state.plan=calculators[app](parsed.input);render(state.plan);setError('');setStatus('JSON imefunguliwa na kukokotolewa upya.');
          }catch(error){clearResult(state);setError('JSON haikusomeka: '+error.message);}
          file.value='';
        };
        reader.onerror=function(){clearResult(state);setError('Faili haikuweza kusomwa.');file.value='';};
        reader.readAsText(selected);
      });
    }
  }

  if(typeof document!=='undefined'){
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
    else{init();}
  }
  return {
    SCHEMA:SCHEMA,GROWTH:GROWTH,CURRENCY:CURRENCY,
    calculateCareerGrowth:calculateCareerGrowth,
    calculateCareerSwitch:calculateCareerSwitch,
    calculateRetirement:calculateRetirement,
    calculateSalaryNegotiation:calculateSalaryNegotiation,
    projectSavings:projectSavings,report:report,envelope:envelope,parseEnvelope:parseEnvelope
  };
});
