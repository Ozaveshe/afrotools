!function(e){var t=function(){"use strict";function e(e,t,a,r){return{id:e,label:t,type:"number",value:a,unit:r||""}}function t(e,t){return{id:e,label:t,type:"date"}}function a(e,t,a,r,i,n,s,o){return{id:e,title:t,category:a,description:r,fullToolLink:i,calc:n,fields:s,note:o||"Use this as a planning estimate and confirm local rates, rules, and partner terms before making a final decision."}}var r=[a("seed-rate","Seed Rate Calculator","agriculture","Estimate seed quantity from field size and planting rate.","/agriculture/seed-rate/",{type:"area-rate",area:"area",rate:"rate",buffer:"buffer",label:"Seed required",unit:"kg"},[e("area","Farm area",2,"ha"),e("rate","Seed rate",25,"kg/ha"),e("buffer","Waste buffer",5,"%")]),a("fertilizer-rate","Fertilizer Rate Calculator","agriculture","Plan fertilizer quantity from area, rate, and buffer.","/agriculture/fertilizer/",{type:"area-rate",area:"area",rate:"rate",buffer:"buffer",label:"Fertilizer required",unit:"kg"},[e("area","Farm area",3,"ha"),e("rate","Application rate",150,"kg/ha"),e("buffer","Handling buffer",4,"%")]),a("irrigation-volume","Irrigation Volume Calculator","agriculture","Convert irrigation depth and land area into water volume.","/agriculture/irrigation/",{type:"product",fields:["area","depth"],multiplier:10,label:"Water volume",unit:"m3"},[e("area","Irrigated area",1.5,"ha"),e("depth","Water depth",12,"mm")]),a("crop-yield-estimator","Crop Yield Estimator","agriculture","Estimate harvest volume from area and expected yield.","/agriculture/crop-yield/",{type:"product",fields:["area","yield"],label:"Expected harvest",unit:"tonnes"},[e("area","Farm area",4,"ha"),e("yield","Yield per hectare",2.8,"t/ha")]),a("farm-budget-estimator","Farm Budget Estimator","agriculture","Add up seed, inputs, labor, transport, and other farm costs.","/agriculture/farm-budget/",{type:"sum",label:"Estimated farm budget",unit:"currency units"},[e("seed","Seed cost",75e3),e("inputs","Fertilizer and chemicals",18e4),e("labor","Labor",12e4),e("transport","Transport",45e3),e("other","Other costs",3e4)]),a("poultry-roi-estimator","Poultry ROI Estimator","agriculture","Compare expected poultry revenue against feed and operating costs.","/agriculture/poultry-roi/",{type:"roi",revenue:"revenue",cost:"cost",label:"Estimated ROI"},[e("revenue","Expected sales",95e4),e("cost","Total cost",72e4)]),a("livestock-feed-cost","Livestock Feed Cost Calculator","agriculture","Estimate feed spend from animals, days, daily feed, and feed price.","/agriculture/livestock-feed/",{type:"product",fields:["animals","days","daily","price"],label:"Feed cost",unit:"currency units"},[e("animals","Animals",40),e("days","Feeding days",30),e("daily","Daily feed per animal",2.5,"kg"),e("price","Feed price per kg",420)]),a("harvest-date-planner","Harvest Date Planner","agriculture","Estimate the harvest date from planting day and crop cycle.","/agriculture/harvest-date/",{type:"date-add",start:"planting",days:"cycle",label:"Estimated harvest date"},[t("planting","Planting date"),e("cycle","Crop cycle",95,"days")]),a("crop-insurance-premium","Crop Insurance Premium","agriculture","Estimate a crop insurance premium from insured value and rate.","/agriculture/crop-insurance/",{type:"percent-cost",amount:"value",percent:"rate",fixed:"admin",label:"Estimated premium",unit:"currency units"},[e("value","Insured crop value",12e5),e("rate","Premium rate",4.5,"%"),e("admin","Admin fee",0)]),a("input-price-checker","Input Price Checker","agriculture","Compare input quote totals before buying.","/agriculture/input-prices/",{type:"sum",label:"Input basket total",unit:"currency units"},[e("seed","Seed",6e4),e("fertilizer","Fertilizer",15e4),e("chemical","Crop protection",45e3),e("transport","Transport",25e3)]),a("greenhouse-area","Greenhouse Area Calculator","agriculture","Calculate usable greenhouse floor area.","/agriculture/greenhouse/",{type:"product",fields:["length","width","beds"],label:"Usable bed area",unit:"m2"},[e("length","Bed length",18,"m"),e("width","Bed width",1.2,"m"),e("beds","Number of beds",8)]),a("fish-farm-stocking","Fish Farm Stocking Calculator","agriculture","Estimate stocking count from pond area and density.","/agriculture/fish-farming/",{type:"product",fields:["area","density"],label:"Suggested fingerlings",unit:"fish"},[e("area","Pond area",120,"m2"),e("density","Stocking density",8,"fish/m2")]),a("tractor-hire-cost","Tractor Hire Cost Calculator","agriculture","Estimate tractor hire cost from hours and hourly rate.","/agriculture/tractor-calculator/",{type:"product",fields:["hours","rate"],label:"Hire cost",unit:"currency units"},[e("hours","Machine hours",6),e("rate","Rate per hour",35e3)]),a("storage-loss-estimator","Storage Loss Estimator","agriculture","Estimate harvest value lost during storage.","/agriculture/storage-loss/",{type:"percent-cost",amount:"value",percent:"loss",fixed:"handling",label:"Estimated loss",unit:"currency units"},[e("value","Stored crop value",8e5),e("loss","Expected loss",8,"%"),e("handling","Handling loss",0)]),a("rent-affordability-widget","Rent Affordability Calculator","property","Estimate a monthly rent ceiling from household income.","/property/rent-buy/",{type:"affordability",income:"income",ratio:"ratio",label:"Suggested monthly rent",unit:"currency units"},[e("income","Monthly income",6e5),e("ratio","Rent share",30,"%")]),a("rental-yield-widget","Rental Yield Calculator","property","Estimate gross annual rental yield.","/property/yield/",{type:"ratio",numerator:"rent",denominator:"value",multiplier:1200,label:"Gross rental yield",unit:"%"},[e("rent","Monthly rent",65e4),e("value","Property value",45e6)]),a("property-roi-widget","Property ROI Calculator","property","Compare annual rent and resale gain against total property cost.","/property/yield/",{type:"roi",revenue:"return",cost:"cost",label:"Estimated ROI"},[e("return","Annual rent plus gain",52e5),e("cost","Purchase and closing cost",48e6)]),a("tenancy-deposit-widget","Tenancy Deposit Calculator","property","Calculate deposit needed from monthly rent and deposit months.","/property/rent-buy/",{type:"product",fields:["rent","months"],label:"Deposit required",unit:"currency units"},[e("rent","Monthly rent",45e4),e("months","Deposit months",2)]),a("property-management-fee","Property Management Fee","property","Estimate annual management fees from rent and fee rate.","/property/yield/",{type:"percent-cost",amount:"annual",percent:"rate",fixed:"fixed",label:"Management fee",unit:"currency units"},[e("annual","Annual rent",72e5),e("rate","Fee rate",8,"%"),e("fixed","Fixed fee",0)]),a("vacancy-loss-widget","Vacancy Loss Calculator","property","Estimate income lost while a unit is empty.","/property/yield/",{type:"product",fields:["rent","months"],label:"Vacancy loss",unit:"currency units"},[e("rent","Monthly rent",5e5),e("months","Vacant months",1.5)]),a("land-size-converter","Land Size Converter","property","Convert acres to square metres for quick property checks.","/property/",{type:"product",fields:["acres"],multiplier:4046.856,label:"Land size",unit:"m2"},[e("acres","Acres",1)]),a("rent-vs-buy-widget","Rent vs Buy Quick Check","property","Compare annual rent against estimated ownership cost.","/property/rent-buy/",{type:"ratio",numerator:"rent",denominator:"ownership",multiplier:100,label:"Rent as share of ownership cost",unit:"%"},[e("rent","Annual rent",6e6),e("ownership","Annual ownership cost",85e5)]),a("invoice-fee-widget","Invoice Fee Calculator","business","Estimate payment platform fees before sending an invoice.","/business/invoice/",{type:"percent-cost",amount:"invoice",percent:"rate",fixed:"fixed",label:"Estimated fee",unit:"currency units"},[e("invoice","Invoice value",25e4),e("rate","Fee rate",1.5,"%"),e("fixed","Fixed fee",100)]),a("cash-flow-runway","Cash Flow Runway Calculator","business","Estimate how many months available cash can cover burn.","/business/",{type:"runway",cash:"cash",burn:"burn",label:"Runway",unit:"months"},[e("cash","Cash available",5e6),e("burn","Monthly burn",85e4)]),a("break-even-lite","Break-Even Lite","business","Estimate units needed to cover fixed costs.","/business/break-even/",{type:"breakeven",fixed:"fixed",price:"price",variable:"variable",label:"Break-even units",unit:"units"},[e("fixed","Fixed cost",12e5),e("price","Selling price per unit",4500),e("variable","Variable cost per unit",1800)]),a("markup-planner","Markup Planner","business","Calculate selling price from cost and markup.","/business/",{type:"percent-cost",amount:"cost",percent:"markup",fixed:"cost",label:"Selling price",unit:"currency units"},[e("cost","Unit cost",3e3),e("markup","Markup",35,"%")]),a("meeting-cost-widget","Meeting Cost Calculator","business","Estimate the staff cost of a meeting.","/business/",{type:"product",fields:["people","hours","rate"],label:"Meeting cost",unit:"currency units"},[e("people","People",6),e("hours","Hours",1.5),e("rate","Hourly cost",8e3)]),a("startup-runway","Startup Runway Calculator","business","Estimate runway after new funding or revenue.","/business/",{type:"runway",cash:"cash",burn:"burn",label:"Startup runway",unit:"months"},[e("cash","Cash plus confirmed revenue",12e6),e("burn","Monthly net burn",15e5)]),a("business-license-budget","Business License Budget","business","Add registration, permits, tax, and professional fees.","/business/setup/",{type:"sum",label:"Setup budget",unit:"currency units"},[e("registration","Registration",35e3),e("permit","Permit",85e3),e("tax","Tax clearance",25e3),e("professional","Professional support",15e4)]),a("subscription-margin","Subscription Margin Calculator","business","Estimate monthly gross margin for a subscription product.","/business/",{type:"roi",revenue:"revenue",cost:"cost",label:"Gross margin"},[e("revenue","Monthly recurring revenue",3e6),e("cost","Monthly delivery cost",9e5)]),a("freelancer-quote","Freelancer Quote Calculator","business","Build a client quote from hours, rate, and buffer.","/jobs/freelance-rates/",{type:"percent-cost",amount:"base",percent:"buffer",fixed:"fixed",label:"Suggested quote",unit:"currency units"},[e("base","Base project value",4e5),e("buffer","Scope buffer",15,"%"),e("fixed","Fixed expenses",5e4)]),a("customer-ltv-widget","Customer LTV Calculator","business","Estimate customer lifetime value from spend and retention.","/business/",{type:"product",fields:["spend","months","margin"],divisor:100,label:"Estimated LTV",unit:"currency units"},[e("spend","Monthly spend",12e4),e("months","Retention",18,"months"),e("margin","Gross margin",55,"%")]),a("freelance-rate-widget","Freelance Rate Calculator","jobs","Convert monthly income target into an hourly freelance rate.","/jobs/freelance-rates/",{type:"ratio",numerator:"target",denominator:"hours",multiplier:1,label:"Hourly rate",unit:"currency units/hour"},[e("target","Monthly income target",12e5),e("hours","Billable hours per month",90)]),a("leave-days-widget","Leave Days Calculator","jobs","Estimate leave balance from entitlement and used days.","/jobs/",{type:"difference",a:"entitlement",b:"used",label:"Leave days left",unit:"days"},[e("entitlement","Annual entitlement",21,"days"),e("used","Days used",8,"days")]),a("severance-estimator","Severance Estimator","jobs","Estimate severance from monthly salary and months payable.","/jobs/",{type:"product",fields:["salary","months"],label:"Estimated severance",unit:"currency units"},[e("salary","Monthly salary",45e4),e("months","Months payable",3)]),a("employer-cost-widget","Employer Cost Calculator","jobs","Estimate employer cost from salary and contribution rate.","/business/payroll/",{type:"percent-cost",amount:"salary",percent:"rate",fixed:"salary",label:"Total employer cost",unit:"currency units"},[e("salary","Monthly salary",5e5),e("rate","Employer on-cost",12,"%")]),a("contractor-vs-employee","Contractor vs Employee Cost","jobs","Compare contractor fee against employee cost.","/jobs/",{type:"difference",a:"contractor",b:"employee",label:"Cost difference",unit:"currency units"},[e("contractor","Contractor monthly fee",85e4),e("employee","Employee all-in cost",72e4)]),a("salary-benchmark-budget","Salary Benchmark Budget","jobs","Estimate team payroll from benchmark salary and headcount.","/jobs/salary-benchmarks/",{type:"product",fields:["salary","headcount"],label:"Monthly payroll budget",unit:"currency units"},[e("salary","Benchmark salary",65e4),e("headcount","Headcount",5)]),a("data-usage-widget","Data Usage Calculator","telecom","Estimate monthly data usage from daily use.","/telecom/data-usage-calc/",{type:"product",fields:["daily","days"],label:"Monthly data need",unit:"GB"},[e("daily","Daily use",1.5,"GB"),e("days","Days",30)]),a("data-plan-value","Data Plan Value Calculator","telecom","Compare data bundle value by price per GB.","/telecom/data-plan-compare/",{type:"ratio",numerator:"price",denominator:"gb",multiplier:1,label:"Price per GB",unit:"currency units/GB"},[e("price","Bundle price",5e3),e("gb","Data included",20,"GB")]),a("bulk-sms-cost","Bulk SMS Cost Calculator","telecom","Estimate campaign spend from message volume and SMS price.","/telecom/bulk-sms-pricing/",{type:"product",fields:["messages","price"],label:"Campaign cost",unit:"currency units"},[e("messages","Messages",1e4),e("price","Price per SMS",3.5)]),a("roaming-cost-widget","Roaming Cost Calculator","telecom","Estimate roaming spend from days and daily usage.","/telecom/roaming-cost/",{type:"product",fields:["days","daily"],label:"Roaming cost",unit:"currency units"},[e("days","Travel days",7),e("daily","Daily roaming cost",4500)]),a("whatsapp-vs-sms-widget","WhatsApp vs SMS Cost","telecom","Compare SMS campaign spend with WhatsApp message fees.","/telecom/whatsapp-vs-sms/",{type:"difference",a:"sms",b:"whatsapp",label:"Estimated saving",unit:"currency units"},[e("sms","SMS campaign cost",12e4),e("whatsapp","WhatsApp campaign cost",65e3)]),a("business-internet-cost","Business Internet Cost","telecom","Estimate annual connectivity cost for an office.","/telecom/business-internet/",{type:"product",fields:["monthly","months"],label:"Annual internet cost",unit:"currency units"},[e("monthly","Monthly plan",75e3),e("months","Months",12)]),a("airtime-value-widget","Airtime Value Calculator","telecom","Estimate effective value after bonus airtime or discounts.","/telecom/airtime-value/",{type:"percent-cost",amount:"topup",percent:"bonus",fixed:"topup",label:"Effective airtime value",unit:"currency units"},[e("topup","Top-up amount",5e3),e("bonus","Bonus",25,"%")]),a("device-finance-widget","Device Finance Calculator","telecom","Estimate monthly device payment after deposit.","/telecom/",{type:"ratio",numerator:"balance",denominator:"months",multiplier:1,label:"Monthly device payment",unit:"currency units"},[e("balance","Price minus deposit",36e4),e("months","Payment months",12)]),a("visa-budget-widget","Visa Budget Calculator","travel","Estimate visa application budget from fees and support costs.","/travel/visa/",{type:"sum",label:"Visa budget",unit:"currency units"},[e("fee","Visa fee",85e3),e("biometrics","Biometrics",25e3),e("documents","Documents",4e4),e("travel","Travel to appointment",3e4)]),a("trip-budget-widget","Trip Budget Calculator","travel","Add flight, stay, local transport, food, and buffer.","/african/",{type:"sum",label:"Trip budget",unit:"currency units"},[e("flight","Flight",42e4),e("stay","Accommodation",3e5),e("food","Food",12e4),e("transport","Local transport",8e4),e("buffer","Buffer",7e4)]),a("flight-change-cost","Flight Change Cost","travel","Estimate total cost of changing a flight.","/travel/flights/",{type:"sum",label:"Change cost",unit:"currency units"},[e("airline","Airline change fee",6e4),e("fare","Fare difference",85e3),e("agency","Agency fee",15e3)]),a("airport-transfer-cost","Airport Transfer Cost","travel","Estimate airport transfer cost from distance and per-km rate.","/african/",{type:"fuel-cost",distance:"distance",efficiency:"km",price:"rate",label:"Transfer cost",unit:"currency units"},[e("distance","Distance",38,"km"),e("km","Km per billing unit",1,"km"),e("rate","Rate per km",850)]),a("travel-forex-buffer","Travel FX Buffer","travel","Estimate extra travel money needed for FX movement.","/travel/forex/",{type:"percent-cost",amount:"budget",percent:"buffer",fixed:"fixed",label:"FX buffer",unit:"currency units"},[e("budget","Foreign spend",1e3),e("buffer","FX buffer",7,"%"),e("fixed","Fixed fees",25)]),a("per-diem-widget","Per Diem Calculator","travel","Calculate per diem allowance from daily rate and trip days.","/african/",{type:"product",fields:["daily","days"],label:"Per diem allowance",unit:"currency units"},[e("daily","Daily allowance",35e3),e("days","Days",6)]),a("landed-cost-lite","Landed Cost Lite","trade","Estimate landed cost from item value, duty, freight, and fees.","/trade/",{type:"percent-cost",amount:"value",percent:"duty",fixed:"fees",label:"Duty plus fixed costs",unit:"currency units"},[e("value","Goods value",25e5),e("duty","Duty and tax rate",20,"%"),e("fees","Freight and fees",4e5)]),a("freight-weight-widget","Freight Weight Calculator","trade","Compare actual and volumetric freight weight.","/trade/",{type:"freight-weight",length:"length",width:"width",height:"height",actual:"actual",divisor:"divisor",label:"Chargeable weight",unit:"kg"},[e("length","Length",80,"cm"),e("width","Width",50,"cm"),e("height","Height",40,"cm"),e("actual","Actual weight",35,"kg"),e("divisor","Volumetric divisor",5e3)]),a("customs-time-buffer","Customs Time Buffer","trade","Estimate clearance window with inspection and document buffers.","/trade/",{type:"sum",label:"Clearance window",unit:"days"},[e("base","Base processing",3,"days"),e("inspection","Inspection buffer",2,"days"),e("documents","Document buffer",1,"day")]),a("export-margin-widget","Export Margin Calculator","trade","Estimate export margin after product, freight, and handling costs.","/trade/",{type:"roi",revenue:"revenue",cost:"cost",label:"Export margin"},[e("revenue","Export sales value",7e6),e("cost","Product plus logistics cost",56e5)]),a("afcfta-duty-saving","AfCFTA Duty Saving","trade","Estimate savings from a lower preferential duty rate.","/trade/",{type:"difference",a:"normal",b:"preferential",label:"Potential duty saving",unit:"currency units"},[e("normal","Normal duty",45e4),e("preferential","Preferential duty",18e4)]),a("container-split-cost","Container Split Cost","trade","Split shared container cost across importers or SKUs.","/trade/",{type:"split",total:"total",count:"parties",label:"Share per party",unit:"currency units"},[e("total","Container cost",22e5),e("parties","Parties or SKUs",4)]),a("demurrage-risk-widget","Demurrage Risk Calculator","trade","Estimate demurrage exposure from delayed days.","/trade/",{type:"product",fields:["days","rate"],label:"Demurrage exposure",unit:"currency units"},[e("days","Delayed days",4),e("rate","Daily demurrage",65e3)]),a("fx-landed-price","FX Landed Price Calculator","trade","Convert supplier cost using exchange rate and landed-cost uplift.","/trade/",{type:"percent-cost",amount:"local",percent:"uplift",fixed:"fees",label:"Local landed price",unit:"currency units"},[e("local","Supplier value in local currency",32e5),e("uplift","Duty and logistics uplift",28,"%"),e("fees","Fixed fees",15e4)]),a("school-fees-budget","School Fees Budget","education","Add tuition, boarding, transport, books, and exam charges.","/education/fees/",{type:"sum",label:"School budget",unit:"currency units"},[e("tuition","Tuition",35e4),e("boarding","Boarding",18e4),e("transport","Transport",75e3),e("books","Books",6e4),e("exam","Exam charges",25e3)]),a("scholarship-gap","Scholarship Gap Calculator","education","Estimate what remains after scholarship support.","/education/scholarships/",{type:"difference",a:"cost",b:"award",label:"Funding gap",unit:"currency units"},[e("cost","Total study cost",25e5),e("award","Scholarship award",18e5)]),a("exam-countdown-widget","Exam Countdown","education","Count days until an exam or application deadline.","/education/afrostudy/",{type:"days-until",date:"exam",label:"Days remaining",unit:"days"},[t("exam","Exam date")]),a("study-hours-planner","Study Hours Planner","education","Plan study hours from subjects, weeks, and hours per subject.","/education/afrostudy/",{type:"product",fields:["subjects","weeks","hours"],label:"Total study hours",unit:"hours"},[e("subjects","Subjects",6),e("weeks","Weeks",8),e("hours","Hours per subject per week",3)]),a("classroom-capacity","Classroom Capacity Calculator","education","Estimate classroom capacity from floor area and area per learner.","/education/",{type:"ratio",numerator:"area",denominator:"perLearner",multiplier:1,label:"Estimated capacity",unit:"learners"},[e("area","Room area",56,"m2"),e("perLearner","Area per learner",1.4,"m2")]),a("boarding-school-cost","Boarding School Cost","education","Estimate term cost for boarding students.","/education/fees/",{type:"sum",label:"Term cost",unit:"currency units"},[e("boarding","Boarding",21e4),e("meals","Meals",12e4),e("uniform","Uniform",45e3),e("extras","Extras",35e3)]),a("solar-payback-widget","Solar Payback Calculator","energy","Estimate how long solar savings take to cover setup cost.","/energy/",{type:"ratio",numerator:"cost",denominator:"saving",multiplier:1,label:"Payback period",unit:"months"},[e("cost","System cost",35e5),e("saving","Monthly saving",18e4)]),a("generator-runtime-cost","Generator Runtime Cost","energy","Estimate generator fuel cost for a usage period.","/energy/",{type:"product",fields:["hours","litres","price"],label:"Runtime cost",unit:"currency units"},[e("hours","Hours",8),e("litres","Litres per hour",2.2),e("price","Fuel price per litre",900)]),a("battery-backup-time","Battery Backup Time","energy","Estimate backup hours from battery size and load.","/energy/",{type:"ratio",numerator:"capacity",denominator:"load",multiplier:.85,label:"Backup time",unit:"hours"},[e("capacity","Battery capacity",2400,"Wh"),e("load","Average load",300,"W")]),a("appliance-cost-widget","Appliance Power Cost","energy","Estimate appliance electricity cost.","/energy/",{type:"product",fields:["watts","hours","days","tariff"],divisor:1e3,label:"Electricity cost",unit:"currency units"},[e("watts","Appliance watts",150,"W"),e("hours","Hours per day",8),e("days","Days",30),e("tariff","Tariff per kWh",120)]),a("water-bill-widget","Water Bill Calculator","energy","Estimate utility bill from usage and tariff.","/energy/",{type:"product",fields:["usage","tariff"],label:"Water bill",unit:"currency units"},[e("usage","Usage",18,"m3"),e("tariff","Tariff per m3",650)]),a("utility-arrears-plan","Utility Arrears Plan","energy","Split arrears into a payment plan.","/energy/",{type:"split",total:"arrears",count:"months",label:"Monthly payment",unit:"currency units"},[e("arrears","Arrears",24e4),e("months","Repayment months",6)]),a("car-insurance-lite","Car Insurance Estimator","insurance","Estimate annual premium from car value and premium rate.","/insurance/",{type:"percent-cost",amount:"value",percent:"rate",fixed:"fixed",label:"Annual premium",unit:"currency units"},[e("value","Vehicle value",8e6),e("rate","Premium rate",4,"%"),e("fixed","Policy fees",15e3)]),a("health-cover-budget","Health Cover Budget","insurance","Estimate family health cover budget.","/insurance/",{type:"product",fields:["people","premium"],label:"Monthly cover budget",unit:"currency units"},[e("people","People covered",4),e("premium","Premium per person",25e3)]),a("microinsurance-premium","Microinsurance Premium","insurance","Estimate a low-ticket premium from insured value and rate.","/insurance/",{type:"percent-cost",amount:"value",percent:"rate",fixed:"fixed",label:"Premium",unit:"currency units"},[e("value","Insured value",25e4),e("rate","Rate",2.5,"%"),e("fixed","Fixed fee",500)]),a("crop-cover-budget","Crop Cover Budget","insurance","Estimate crop cover spend for a farm season.","/agriculture/crop-insurance/",{type:"percent-cost",amount:"value",percent:"rate",fixed:"admin",label:"Cover budget",unit:"currency units"},[e("value","Crop value",15e5),e("rate","Cover rate",3.5,"%"),e("admin","Admin",5e3)]),a("court-fee-widget","Court Fee Estimator","legal","Estimate filing cost from claim value and fee rate.","/legal/",{type:"percent-cost",amount:"claim",percent:"rate",fixed:"fixed",label:"Estimated filing cost",unit:"currency units"},[e("claim","Claim value",1e6),e("rate","Fee rate",2,"%"),e("fixed","Fixed fees",1e4)]),a("legal-aid-eligibility","Legal Aid Eligibility Score","legal","Score basic affordability and urgency factors.","/legal/",{type:"score",label:"Eligibility score",unit:"/100"},[e("income","Low income score",8,"0-10"),e("urgency","Urgency score",7,"0-10"),e("documents","Document readiness",6,"0-10"),e("risk","Case risk score",5,"0-10")]),a("notice-period-widget","Notice Period Calculator","legal","Find the end date from notice start and notice days.","/legal/",{type:"date-add",start:"start",days:"days",label:"Notice ends on"},[t("start","Notice start date"),e("days","Notice period",30,"days")]),a("contract-deposit-widget","Contract Deposit Calculator","legal","Calculate deposit due from contract value and deposit rate.","/legal/",{type:"percent-cost",amount:"value",percent:"rate",fixed:"fixed",label:"Deposit due",unit:"currency units"},[e("value","Contract value",25e5),e("rate","Deposit rate",30,"%"),e("fixed","Fixed fees",0)]),a("clinic-visit-budget","Clinic Visit Budget","health","Estimate clinic visit cost with transport and tests.","/health/costs/",{type:"sum",label:"Visit budget",unit:"currency units"},[e("consultation","Consultation",15e3),e("tests","Tests",25e3),e("medicine","Medicine",18e3),e("transport","Transport",6e3)]),a("medicine-cost-planner","Medicine Cost Planner","health","Estimate medicine spend from daily dose, days, and unit price.","/health/costs/",{type:"product",fields:["daily","days","price"],label:"Medicine cost",unit:"currency units"},[e("daily","Units per day",2),e("days","Days",30),e("price","Price per unit",450)]),a("maternal-care-budget","Maternal Care Budget","health","Plan maternity care costs across visits, delivery, and transport.","/health/pregnancy-due-date/",{type:"sum",label:"Care budget",unit:"currency units"},[e("visits","Antenatal visits",9e4),e("delivery","Delivery estimate",35e4),e("tests","Tests and scans",12e4),e("transport","Transport",45e3)]),a("insurance-gap-health","Health Insurance Gap","health","Estimate out-of-pocket cost after insurance cover.","/health/insurance/",{type:"difference",a:"bill",b:"cover",label:"Out-of-pocket gap",unit:"currency units"},[e("bill","Expected bill",65e4),e("cover","Insurance cover",45e4)])];function i(e){for(var t=0;t<r.length;t+=1)if(r[t].id===e)return r[t];return null}function n(e){return String(null==e?"":e).replace(/[&<>"']/g,function(e){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[e]})}function s(){return(new Date).toISOString().slice(0,10)}function o(e){var t=parseFloat(e);return Number.isFinite(t)?t:0}function l(e,t){if("string"==typeof e)return e;var a=function(e){if("string"==typeof e)return e;var t=Math.abs(e)<10&&e%1!=0?2:0;return e.toLocaleString("en",{maximumFractionDigits:t,minimumFractionDigits:t})}(e);return t?a+" "+t:a}function u(e,t,a){return{label:e,value:l(t,a||"")}}function c(e,t,locale){var a=e.calc||{},r=0,i=[],n=a.unit||"";if("area-rate"===a.type){var c=o(t[a.area]),d=o(t[a.rate]),p=o(t[a.buffer]);r=c*d*(1+p/100),i=[u("Base quantity",c*d,n),u("Buffer",p,"%")]}else if("product"===a.type)r=(a.fields||[]).reduce(function(e,a){return e*o(t[a])},1),a.multiplier&&(r*=a.multiplier),a.divisor&&(r/=a.divisor),i=(a.fields||[]).map(function(e){return u(e.replace(/([A-Z])/g," $1").replace(/-/g," "),o(t[e]))});else if("sum"===a.type)r=e.fields.reduce(function(e,a){return e+o(t[a.id])},0),i=e.fields.map(function(e){return u(e.label,o(t[e.id]),e.unit||"")});else if("percent-cost"===a.type){var m=o(t[a.amount]),y=o(t[a.percent]);r=m*y/100+(C=o(t[a.fixed])),i=[u("Percentage component",m*y/100,n),u("Fixed component",C,n)]}else if("loan-payment"===a.type){var f=o(t[a.principal]),g=o(t[a.rate])/1200,b=Math.max(o(t[a.months]),1);i=[u("Total repaid",(r=g?f*g/(1-Math.pow(1+g,-b)):f/b)*b,n),u("Estimated interest",r*b-f,n)]}else if("roi"===a.type){var h=o(t[a.revenue]),v=o(t[a.cost]),w=h-v;r=v?w/v*100:0,i=[u("Net result",w,"currency units"),u("Revenue",h,"currency units"),u("Cost",v,"currency units")],n="%"}else if("split"===a.type)r=o(t[a.total])/Math.max(o(t[a.count]),1),i=[u("Total",o(t[a.total]),n),u("Parts",o(t[a.count]))];else if("fuel-cost"===a.type)r=o(t[a.distance])/Math.max(o(t[a.efficiency]),1e-4)*o(t[a.price]),i=[u("Distance",o(t[a.distance]),"km"),u("Rate",o(t[a.price]),"currency units")];else if("date-add"===a.type)r=function(e,t){var a=e?new Date(e+"T00:00:00"):new Date;return Number.isNaN(a.getTime())&&(a=new Date),a.setDate(a.getDate()+Math.round(t||0)),a.toLocaleDateString(locale || "en-GB",{day:"numeric",month:"short",year:"numeric"})}(t[a.start],o(t[a.days])),i=[u("Days added",o(t[a.days]),"days")],n="";else if("days-until"===a.type)r=function(e){var t=e?new Date(e+"T00:00:00"):new Date,a=new Date;return t.setHours(0,0,0,0),a.setHours(0,0,0,0),Math.ceil((t-a)/864e5)}(t[a.date]),i=[u("Target date",t[a.date]||s())];else if("runway"===a.type)r=o(t[a.cash])/Math.max(o(t[a.burn]),1e-4),i=[u("Cash available",o(t[a.cash]),"currency units"),u("Monthly burn",o(t[a.burn]),"currency units")];else if("affordability"===a.type)r=o(t[a.income])*o(t[a.ratio])/100,i=[u("Income used",o(t[a.ratio]),"%"),u("Annual equivalent",12*r,n)];else if("ratio"===a.type)r=o(t[a.numerator])/Math.max(o(t[a.denominator]),1e-4)*(a.multiplier||1),i=[u("Numerator",o(t[a.numerator])),u("Denominator",o(t[a.denominator]))];else if("difference"===a.type)r=o(t[a.a])-o(t[a.b]),i=[u("First value",o(t[a.a]),n),u("Second value",o(t[a.b]),n)];else if("score"===a.type)r=e.fields.reduce(function(e,a){return e+Math.max(0,Math.min(o(t[a.id]),10))},0)/Math.max(10*e.fields.length,1)*100,i=e.fields.map(function(e){return u(e.label,Math.max(0,Math.min(o(t[e.id]),10)),"/10")});else if("breakeven"===a.type){var C=o(t[a.fixed]),x=o(t[a.price]),E=o(t[a.variable]);r=x>E?Math.ceil(C/(x-E)):0,i=[u("Contribution per unit",x-E,"currency units"),u("Fixed cost",C,"currency units")]}else if("freight-weight"===a.type){var k=o(t[a.length])*o(t[a.width])*o(t[a.height])/Math.max(o(t[a.divisor]),1);r=Math.max(k,o(t[a.actual])),i=[u("Volumetric weight",k,n),u("Actual weight",o(t[a.actual]),n)]}return{label:a.label||"Estimated result",value:l(r,n),rows:i,note:e.note}}
function frenchPoultryResult(result) {
  const labels = { "Net result": "Résultat net", Revenue: "Recettes", Cost: "Coûts" };
  const format = value => String(value).replace(/(\d),(?=\d{3}(?:[,\.]|\b))/g, "$1\u202f")
    .replace(/(\d)\.(?=\d)/g, "$1,").replace("currency units", "unités monétaires");
  return {
    label: "Rentabilité estimée",
    value: format(result.value),
    rows: result.rows.map(row => ({ label: labels[row.label] || row.label, value: format(row.value) })),
    note: "Estimation indicative. Vérifiez vos prix et vos coûts avant de prendre une décision."
  };
}
const frenchUnits = { learners: "élèves", day: "jour", "currency units/hour": "unités monétaires/heure", hours: "heures", months: "mois", units: "unités", "currency units": "unités monétaires", days: "jours", fish: "poissons", "fish/m2": "poissons/m²", m2: "m²", m3: "m³" };
const frenchRows = {"Distance": "Distance du trajet", "Rate": "Tarif par unité", "Numerator": "Numérateur", "Denominator": "Dénominateur", "Target date": "Date cible", "First value": "Première valeur", "Second value": "Deuxième valeur", "Total": "Total", "Parts": "Nombre de parts", "Net result": "Résultat net", "Revenue": "Recettes", "Cost": "Coût", "Volumetric weight": "Poids volumétrique", "Actual weight": "Poids réel", "Base quantity": "Quantité de base", "Buffer": "Marge", "Percentage component": "Part proportionnelle", "Fixed component": "Part fixe", "Days added": "Durée ajoutée" };

function frenchWidgetResult(result, spec, locale) {
  const labels = Object.assign({}, frenchRows);
  for (const field of spec.fields) {
    labels[field.id.replace(/([A-Z])/g, " $1").replace(/-/g, " ")] = locale.fields[field.id];
    labels[field.label] = locale.fields[field.id];
  }
  Object.assign(labels, locale.rowLabels);
  function value(text) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split("-");
      return day + "/" + month + "/" + year;
    }
    return String(text).replace(/^(-?[0-9,.]+)(?: (.*))?$/, (_, digits, unit) =>
      digits.replace(/,/g, " ").replace(".", ",") + (unit ? " " + (frenchUnits[unit] || unit) : ""));
  }
  return {
    label: locale.resultLabel,
    value: value(result.value),
    rows: result.rows.map(row => ({ label: labels[row.label] || row.label, value: value(row.value) })),
    note: locale.note
  };
}
const frenchWidgets = {

  "crop-cover-budget": {
    "title": "Budget d’assurance récolte",
    "description": "Estimez la prime et les frais de dossier pour une récolte.",
    "fields": {
      "value": "Valeur de la récolte",
      "rate": "Taux de couverture appliqué",
      "admin": "Frais de dossier"
    },
    "resultLabel": "Budget de couverture",
    "note": "Utilisez le taux figurant sur votre devis et exprimez tous les frais dans la même devise."
  },
  "visa-budget-widget": {
    "title": "Budget de demande de visa",
    "description": "Additionnez les dépenses liées au dépôt d’une demande.",
    "fields": {
      "fee": "Frais de visa",
      "biometrics": "Biométrie",
      "documents": "Documents et traductions",
      "travel": "Trajet jusqu’au rendez-vous"
    },
    "resultLabel": "Budget pour la demande",
    "note": "Reportez les frais demandés par le consulat pour votre destination et votre type de visa."
  },
  "trip-budget-widget": {
    "title": "Budget de voyage",
    "description": "Évaluez le coût du séjour avec une réserve pour imprévus.",
    "fields": {
      "flight": "Vol",
      "stay": "Hébergement",
      "food": "Repas",
      "transport": "Transports sur place",
      "buffer": "Réserve pour imprévus"
    },
    "resultLabel": "Budget du séjour",
    "note": "Convertissez tous les montants dans une même devise avant de les additionner."
  },
  "flight-change-cost": {
    "title": "Coût d’une modification de vol",
    "description": "Additionnez les pénalités et la différence de tarif.",
    "fields": {
      "airline": "Frais de modification de la compagnie",
      "fare": "Différence de tarif",
      "agency": "Frais d’agence"
    },
    "resultLabel": "Coût de modification",
    "note": "Reprenez les montants proposés lors de la modification du billet."
  },
  "airport-transfer-cost": {
    "title": "Coût du transfert depuis l’aéroport",
    "description": "Divisez le trajet par la distance facturée par unité, puis appliquez le tarif unitaire.",
    "fields": {
      "distance": "Distance du trajet",
      "km": "Distance par unité facturée",
      "rate": "Prix d’une unité facturée"
    },
    "resultLabel": "Coût du transfert",
    "note": "Pour un tarif au kilomètre, saisissez 1 km comme distance par unité. Ajoutez les péages séparément."
  },
  "per-diem-widget": {
    "title": "Indemnité de déplacement",
    "description": "Calculez l’indemnité totale pour la durée de votre mission.",
    "fields": {
      "daily": "Indemnité journalière",
      "days": "Nombre de jours"
    },
    "resultLabel": "Indemnité totale",
    "note": "Utilisez le montant journalier convenu pour la mission."
  },
  "travel-forex-buffer": {
    "title": "Réserve pour frais de change",
    "description": "Estimez le supplément à prévoir pour le change et les frais fixes.",
    "fields": {
      "budget": "Dépenses à convertir",
      "buffer": "Marge de change",
      "fixed": "Frais fixes"
    },
    "resultLabel": "Réserve de change",
    "note": "Ajoutez cette réserve à votre budget de départ pour obtenir votre enveloppe totale."
  },
  "classroom-capacity": {
    "title": "Capacité d’une salle de classe",
    "description": "Divisez la surface disponible par la surface prévue par élève.",
    "fields": {
      "area": "Surface disponible",
      "perLearner": "Surface prévue par élève"
    },
    "resultLabel": "Capacité indicative",
    "note": "Arrondissez à l’entier inférieur et vérifiez les règles de sécurité applicables.",
    "rowLabels": {
      "Numerator": "Surface disponible",
      "Denominator": "Surface par élève"
    }
  },
  "exam-countdown-widget": {
    "title": "Compte à rebours avant un examen",
    "description": "Comptez les jours entre aujourd’hui et la date de l’épreuve.",
    "fields": {
      "exam": "Date de l’examen"
    },
    "resultLabel": "Jours avant l’examen",
    "note": "Une valeur négative indique que la date est passée.",
    "rowLabels": {
      "Target date": "Date de l’examen"
    }
  },
  "boarding-school-cost": {
    "title": "Budget d’internat",
    "description": "Additionnez les dépenses prévues pour une période scolaire.",
    "fields": {
      "boarding": "Internat",
      "meals": "Repas",
      "uniform": "Uniforme",
      "extras": "Autres frais"
    },
    "resultLabel": "Coût de la période",
    "note": "Utilisez la même durée pour chaque poste, par exemple un trimestre."
  },
  "school-fees-budget": {
    "title": "Budget scolaire",
    "description": "Préparez le budget de scolarité en regroupant les principaux postes.",
    "fields": {
      "tuition": "Scolarité",
      "boarding": "Internat",
      "transport": "Transport",
      "books": "Livres",
      "exam": "Frais d’examen"
    },
    "resultLabel": "Budget scolaire total",
    "note": "Utilisez les tarifs de l’établissement pour une même période scolaire."
  },
  "study-hours-planner": {
    "title": "Planification des révisions",
    "description": "Estimez le temps total consacré aux matières de votre programme.",
    "fields": {
      "subjects": "Nombre de matières",
      "weeks": "Nombre de semaines",
      "hours": "Heures par matière et par semaine"
    },
    "resultLabel": "Durée totale des révisions",
    "note": "Le calcul suppose le même nombre d’heures pour chaque matière."
  },
  "scholarship-gap": {
    "title": "Reste à financer après bourse",
    "description": "Soustrayez la bourse obtenue du coût des études.",
    "fields": {
      "cost": "Coût total des études",
      "award": "Montant de la bourse"
    },
    "resultLabel": "Reste à financer",
    "note": "Un résultat négatif correspond à un excédent de financement.",
    "rowLabels": {
      "First value": "Coût total des études",
      "Second value": "Bourse accordée"
    }
  },
  "contract-deposit-widget": {
    "title": "Acompte sur contrat",
    "description": "Calculez l’acompte prévu et ajoutez les frais fixes.",
    "fields": {
      "value": "Montant du contrat",
      "rate": "Taux d’acompte",
      "fixed": "Frais fixes"
    },
    "resultLabel": "Acompte et frais à verser",
    "note": "Reprenez le taux et les frais figurant dans votre contrat."
  },
  "legal-aid-eligibility": {
    "title": "Préparation d’une demande d’aide juridique",
    "description": "Évaluez quatre éléments de votre dossier sur une échelle de zéro à dix.",
    "fields": {
      "income": "Faiblesse des ressources",
      "urgency": "Urgence de la situation",
      "documents": "Préparation des documents",
      "risk": "Niveau de risque du dossier"
    },
    "resultLabel": "Score indicatif de préparation",
    "note": "Ce score ne décide pas de l’admissibilité. Vérifiez les critères auprès de l’organisme d’aide juridique compétent."
  },
  "court-fee-widget": {
    "title": "Estimation des frais de dépôt",
    "description": "Appliquez le taux au montant de la demande et ajoutez les frais fixes.",
    "fields": {
      "claim": "Montant de la demande",
      "rate": "Taux des frais",
      "fixed": "Frais fixes"
    },
    "resultLabel": "Frais de dépôt estimés",
    "note": "Vérifiez le barème et les exemptions éventuelles auprès du greffe compétent."
  },
  "notice-period-widget": {
    "title": "Fin de préavis",
    "description": "Ajoutez le nombre de jours du préavis à sa date de début.",
    "fields": {
      "start": "Date de début",
      "days": "Durée du préavis"
    },
    "resultLabel": "Date de fin indicative",
    "note": "Le calcul utilise des jours calendaires. Vérifiez les modalités de décompte prévues pour votre situation."
  },
  "contractor-vs-employee": {
    "title": "Prestataire ou salarié",
    "description": "Comparez les deux coûts sur un même mois.",
    "fields": {
      "contractor": "Honoraires mensuels du prestataire",
      "employee": "Coût mensuel total du salarié"
    },
    "resultLabel": "Surcoût du prestataire",
    "note": "Un résultat négatif signifie que le prestataire coûte moins cher.",
    "rowLabels": {
      "First value": "Honoraires du prestataire",
      "Second value": "Coût du salarié"
    }
  },
  "employer-cost-widget": {
    "title": "Coût mensuel employeur",
    "description": "Ajoutez les charges patronales au salaire mensuel.",
    "fields": {
      "salary": "Salaire mensuel",
      "rate": "Taux des charges patronales"
    },
    "resultLabel": "Coût mensuel total",
    "note": "Utilisez le taux applicable à votre entreprise et à ce salaire.",
    "rowLabels": {
      "Fixed component": "Salaire mensuel",
      "Percentage component": "Charges patronales"
    }
  },
  "severance-estimator": {
    "title": "Indemnité de départ",
    "description": "Multipliez le salaire mensuel de référence par le nombre de mois dus.",
    "fields": {
      "salary": "Salaire mensuel de référence",
      "months": "Nombre de mois dus"
    },
    "resultLabel": "Indemnité estimée",
    "note": "Vérifiez les éléments du salaire de référence et le nombre de mois applicable à votre situation."
  },
  "leave-days-widget": {
    "title": "Solde de congés",
    "description": "Soustrayez les jours déjà pris des droits annuels.",
    "fields": {
      "entitlement": "Droits annuels",
      "used": "Jours déjà pris"
    },
    "resultLabel": "Jours de congé restants",
    "note": "Utilisez la même convention de décompte pour les jours acquis et pris.",
    "rowLabels": {
      "First value": "Droits annuels",
      "Second value": "Jours pris"
    }
  },
  "freelance-rate-widget": {
    "title": "Tarif horaire indépendant",
    "description": "Répartissez votre objectif mensuel sur les seules heures facturables.",
    "fields": {
      "target": "Objectif de revenu mensuel",
      "hours": "Heures facturables par mois"
    },
    "resultLabel": "Tarif horaire visé",
    "note": "Intégrez vos charges dans l’objectif mensuel si vous souhaitez couvrir ces dépenses.",
    "rowLabels": {
      "Numerator": "Revenu mensuel visé",
      "Denominator": "Heures facturables"
    }
  },
  "maternal-care-budget": {
    "title": "Budget de suivi de grossesse",
    "description": "Additionnez les dépenses de suivi, d’accouchement et de transport.",
    "fields": {
      "visits": "Consultations prénatales",
      "delivery": "Accouchement",
      "tests": "Examens et échographies",
      "transport": "Transport"
    },
    "resultLabel": "Budget prévisionnel",
    "note": "Utilisez les devis de votre établissement et ses indications sur les prestations prises en charge."
  },
  "medicine-cost-planner": {
    "title": "Budget d’un traitement",
    "description": "Estimez le coût à partir des quantités prescrites et du prix unitaire.",
    "fields": {
      "daily": "Unités prescrites par jour",
      "days": "Nombre de jours prescrits",
      "price": "Prix par unité"
    },
    "resultLabel": "Coût du traitement",
    "note": "Reprenez les quantités de l’ordonnance sans modifier le traitement."
  },
  "clinic-visit-budget": {
    "title": "Budget d’une consultation",
    "description": "Estimez vos dépenses pour la visite et le déplacement.",
    "fields": {
      "consultation": "Consultation",
      "tests": "Examens",
      "medicine": "Médicaments",
      "transport": "Transport"
    },
    "resultLabel": "Budget de la visite",
    "note": "Saisissez les prix de votre établissement ou de la pharmacie."
  },
  "insurance-gap-health": {
    "title": "Reste à charge santé",
    "description": "Déduisez la prise en charge prévue de la facture estimée.",
    "fields": {
      "bill": "Facture estimée",
      "cover": "Montant pris en charge"
    },
    "resultLabel": "Écart après prise en charge",
    "note": "Un résultat positif représente le montant restant à financer. Vérifiez les plafonds du contrat.",
    "rowLabels": {
      "First value": "Facture estimée",
      "Second value": "Prise en charge"
    }
  },
  "landed-cost-lite": {
    "title": "Droits et frais d’importation",
    "description": "Calculez les droits sur la valeur des marchandises et ajoutez le fret et les frais.",
    "fields": {
      "value": "Valeur des marchandises",
      "duty": "Taux des droits et taxes",
      "fees": "Fret et frais"
    },
    "resultLabel": "Droits, fret et frais",
    "note": "Le prix d’achat des marchandises est exclu du résultat. Utilisez le taux applicable à votre importation."
  },
  "afcfta-duty-saving": {
    "title": "Économie de droits de douane",
    "description": "Comparez les droits au tarif normal et au tarif préférentiel.",
    "fields": {
      "normal": "Droits au tarif normal",
      "preferential": "Droits au tarif préférentiel"
    },
    "resultLabel": "Économie potentielle",
    "note": "Vérifiez l’origine préférentielle du produit et les justificatifs requis auprès des douanes.",
    "rowLabels": {
      "First value": "Droits au tarif normal",
      "Second value": "Droits préférentiels"
    }
  },
  "customs-time-buffer": {
    "title": "Délai de dédouanement",
    "description": "Ajoutez les marges de contrôle et de documentation à la durée de traitement.",
    "fields": {
      "base": "Durée de traitement",
      "inspection": "Marge pour inspection",
      "documents": "Marge pour les documents"
    },
    "resultLabel": "Délai prévisionnel",
    "note": "Utilisez des délais exprimés dans une même convention de jours."
  },
  "export-margin-widget": {
    "title": "Rentabilité d’une exportation",
    "description": "Rapportez le bénéfice aux coûts de marchandise et de logistique.",
    "fields": {
      "revenue": "Recettes d’exportation",
      "cost": "Coût des produits et de la logistique"
    },
    "resultLabel": "Rentabilité sur coûts",
    "note": "Un bénéfice de 50 pour un coût de 100 correspond ici à 50 %."
  },
  "container-split-cost": {
    "title": "Partage du coût d’un conteneur",
    "description": "Divisez la facture en parts égales.",
    "fields": {
      "total": "Coût total du conteneur",
      "parties": "Nombre de parts"
    },
    "resultLabel": "Coût par part",
    "note": "Utilisez une part par participant ou par lot si la répartition est uniforme."
  },
  "freight-weight-widget": {
    "title": "Poids facturable du fret",
    "description": "Comparez le poids réel au poids volumétrique pour déterminer le poids facturable.",
    "fields": {
      "length": "Longueur",
      "width": "Largeur",
      "height": "Hauteur",
      "actual": "Poids réel",
      "divisor": "Diviseur volumétrique"
    },
    "resultLabel": "Poids facturable",
    "note": "Utilisez le diviseur de votre transporteur pour des dimensions exprimées en centimètres."
  },
  "fx-landed-price": {
    "title": "Supplément de droits et logistique",
    "description": "Appliquez la majoration à la valeur fournisseur en devise locale et ajoutez les frais.",
    "fields": {
      "local": "Valeur fournisseur en devise locale",
      "uplift": "Majoration pour droits et logistique",
      "fees": "Frais fixes"
    },
    "resultLabel": "Supplément en devise locale",
    "note": "Ajoutez la valeur fournisseur à ce supplément pour obtenir le coût total."
  },
  "demurrage-risk-widget": {
    "title": "Coût des surestaries",
    "description": "Calculez le coût du retard après la période de franchise.",
    "fields": {
      "days": "Jours facturés au-delà de la franchise",
      "rate": "Tarif journalier de surestaries"
    },
    "resultLabel": "Coût estimé des surestaries",
    "note": "Si le tarif change par tranche de jours, calculez chaque tranche séparément."
  }
,

  "battery-backup-time": {
    "title": "Autonomie de la batterie",
    "description": "Estimez la durée d’alimentation à puissance constante.",
    "fields": {
      "capacity": "Capacité de la batterie (Wh)",
      "load": "Puissance moyenne (W)"
    },
    "resultLabel": "Autonomie estimée",
    "note": "Une capacité utilisable de 1 000 Wh pour une charge de 100 W donne 10 heures avant prise en compte des pertes.",
    "rowLabels": {
      "Numerator": "Capacité de la batterie (Wh)",
      "Denominator": "Puissance moyenne (W)"
    }
  },
  "generator-runtime-cost": {
    "title": "Coût du carburant du groupe électrogène",
    "description": "Estimez la dépense de carburant sur la durée prévue.",
    "fields": {
      "hours": "Durée de fonctionnement (h)",
      "litres": "Consommation horaire (L/h)",
      "price": "Prix du litre"
    },
    "resultLabel": "Coût du carburant",
    "note": "Utilisez la consommation observée à la charge prévue et le prix local du litre.",
    "rowLabels": {
      "hours": "Durée de fonctionnement (h)",
      "litres": "Consommation horaire (L/h)",
      "price": "Prix du litre"
    }
  },
  "appliance-cost-widget": {
    "title": "Coût d’utilisation d’un appareil",
    "description": "Estimez le coût de l’électricité consommée par un appareil sur plusieurs jours.",
    "fields": {
      "watts": "Puissance (W)",
      "hours": "Utilisation quotidienne (h)",
      "days": "Nombre de jours",
      "tariff": "Tarif par kWh"
    },
    "resultLabel": "Coût estimé",
    "note": "Un appareil de 1 000 W utilisé 2 heures par jour pendant 5 jours consomme 10 kWh.",
    "rowLabels": {
      "watts": "Puissance (W)",
      "hours": "Utilisation quotidienne (h)",
      "days": "Nombre de jours",
      "tariff": "Tarif par kWh"
    }
  },
  "water-bill-widget": {
    "title": "Coût de l’eau consommée",
    "description": "Multipliez le volume consommé par le tarif applicable au mètre cube.",
    "fields": {
      "usage": "Volume consommé (m³)",
      "tariff": "Tarif par m³"
    },
    "resultLabel": "Coût de la consommation",
    "note": "Ajoutez séparément les frais fixes éventuels. Pour un tarif par tranches, traitez chaque tranche séparément.",
    "rowLabels": {
      "usage": "Volume consommé (m³)",
      "tariff": "Tarif par m³"
    }
  },
  "utility-arrears-plan": {
    "title": "Échelonnement des impayés",
    "description": "Répartissez le solde impayé en mensualités égales.",
    "fields": {
      "arrears": "Montant des impayés",
      "months": "Nombre de mois"
    },
    "resultLabel": "Mensualité estimée",
    "note": "Le calcul répartit la dette existante. Vérifiez les intérêts et les frais éventuels avec votre fournisseur.",
    "rowLabels": {
      "Total": "Montant des impayés",
      "Parts": "Nombre de mois"
    }
  },
  "solar-payback-widget": {
    "title": "Délai de récupération d’une installation solaire",
    "description": "Estimez combien de mois d’économies sont nécessaires pour couvrir le coût initial.",
    "fields": {
      "cost": "Coût de l’installation",
      "saving": "Économies mensuelles"
    },
    "resultLabel": "Délai de récupération",
    "note": "Saisissez une économie mensuelle positive et utilisez la même devise pour les deux montants.",
    "rowLabels": {
      "Numerator": "Coût de l’installation",
      "Denominator": "Économies mensuelles"
    }
  },
  "device-finance-widget": {
    "title": "Mensualité de financement d’un appareil",
    "description": "Répartissez le solde à payer après l’acompte sur le nombre de mois prévu.",
    "fields": {
      "balance": "Prix après déduction de l’acompte",
      "months": "Nombre de mensualités"
    },
    "resultLabel": "Mensualité estimée",
    "note": "Un solde de 360 000 réparti sur 12 mois donne 30 000 par mois, hors intérêts et frais.",
    "rowLabels": {
      "Numerator": "Solde à payer",
      "Denominator": "Nombre de mensualités"
    }
  },
  "whatsapp-vs-sms-widget": {
    "title": "Coût d’une campagne WhatsApp ou SMS",
    "description": "Comparez le coût total de la même campagne sur les deux canaux.",
    "fields": {
      "sms": "Coût de la campagne SMS",
      "whatsapp": "Coût de la campagne WhatsApp"
    },
    "resultLabel": "Économie avec WhatsApp",
    "note": "Utilisez la même devise. Un résultat négatif indique que la campagne WhatsApp coûte plus cher que la campagne SMS.",
    "rowLabels": {
      "First value": "Coût des SMS",
      "Second value": "Coût des messages WhatsApp"
    }
  }
,

  "business-license-budget": {
    "title": "Budget de création d’entreprise",
    "description": "Additionnez les frais prévus pour immatriculer votre entreprise et obtenir les documents nécessaires.",
    "fields": {
      "registration": "Immatriculation",
      "permit": "Permis et autorisations",
      "tax": "Attestation de régularité fiscale",
      "professional": "Honoraires professionnels"
    },
    "resultLabel": "Budget total de création",
    "note": "Saisissez les montants dans une même devise. Indiquez zéro pour les démarches qui ne vous concernent pas.",
    "rowLabels": {
      "Registration": "Immatriculation",
      "Permit": "Permis et autorisations",
      "Tax clearance": "Attestation de régularité fiscale",
      "Professional support": "Honoraires professionnels"
    }
  },
  "markup-planner": {
    "title": "Prix de vente à partir du coût",
    "description": "Calculez un prix de vente en ajoutant au coût unitaire une majoration de votre choix.",
    "fields": {
      "cost": "Coût unitaire",
      "markup": "Majoration du coût"
    },
    "resultLabel": "Prix de vente unitaire",
    "note": "Une majoration de 35 % sur un coût de 3 000 donne un prix de vente de 4 050.",
    "rowLabels": {
      "Percentage component": "Montant de la majoration",
      "Fixed component": "Coût unitaire"
    }
  },
  "meeting-cost-widget": {
    "title": "Coût d’une réunion",
    "description": "Estimez le coût du temps de travail mobilisé en fonction de la durée et du nombre de participants.",
    "fields": {
      "people": "Nombre de participants",
      "hours": "Durée en heures",
      "rate": "Coût horaire moyen par personne"
    },
    "resultLabel": "Coût de la réunion",
    "note": "Pour une réunion d’une heure et demie, comptez 1,5 heure par personne.",
    "rowLabels": {
      "people": "Nombre de participants",
      "hours": "Durée en heures",
      "rate": "Coût horaire moyen par personne"
    }
  },
  "freelancer-quote": {
    "title": "Devis de prestation indépendante",
    "description": "Ajoutez au prix de base une provision pour les imprévus et vos frais fixes.",
    "fields": {
      "base": "Prix de base de la prestation",
      "buffer": "Provision pour imprévus",
      "fixed": "Frais fixes à ajouter"
    },
    "resultLabel": "Montant du devis",
    "note": "La provision s’applique au prix de base. Ajoutez uniquement les frais qui ne sont pas déjà inclus.",
    "rowLabels": {
      "Percentage component": "Provision pour imprévus",
      "Fixed component": "Frais fixes"
    }
  },
  "invoice-fee-widget": {
    "title": "Frais d’encaissement d’une facture",
    "description": "Estimez les frais prélevés sur un paiement selon la commission et le montant fixe de votre prestataire.",
    "fields": {
      "invoice": "Montant de la facture",
      "rate": "Taux de commission",
      "fixed": "Frais fixes par paiement"
    },
    "resultLabel": "Frais d’encaissement estimés",
    "note": "Utilisez le tarif de votre prestataire pour le moyen de paiement choisi.",
    "rowLabels": {
      "Percentage component": "Commission proportionnelle",
      "Fixed component": "Frais fixes"
    }
  },
  "subscription-margin": {
    "title": "Rentabilité d’une offre par abonnement",
    "description": "Mesurez le gain mensuel dégagé pour chaque unité monétaire dépensée pour fournir le service.",
    "fields": {
      "revenue": "Chiffre d’affaires mensuel récurrent",
      "cost": "Coût mensuel de fourniture du service"
    },
    "resultLabel": "Gain mensuel en pourcentage des coûts",
    "note": "Le calcul divise la différence entre recettes et coûts par les coûts. Avec 150 de recettes et 100 de coûts, le résultat est de 50 %.",
    "rowLabels": {
      "Net result": "Gain mensuel",
      "Revenue": "Recettes mensuelles",
      "Cost": "Coûts mensuels"
    }
  },
  "cash-flow-runway": {
    "title": "Autonomie de trésorerie",
    "description": "Estimez combien de mois votre entreprise peut financer avec sa trésorerie disponible.",
    "fields": {
      "cash": "Trésorerie disponible",
      "burn": "Sorties nettes de trésorerie par mois"
    },
    "resultLabel": "Autonomie de trésorerie estimée",
    "note": "Utilisez un montant mensuel positif correspondant aux décaissements diminués des encaissements.",
    "rowLabels": {
      "Cash available": "Trésorerie disponible",
      "Monthly burn": "Sorties nettes mensuelles"
    }
  },
  "startup-runway": {
    "title": "Autonomie financière d’une jeune entreprise",
    "description": "Estimez la durée de financement de l’activité à partir des fonds disponibles et des sorties nettes mensuelles.",
    "fields": {
      "cash": "Trésorerie et fonds confirmés",
      "burn": "Sorties nettes de trésorerie par mois"
    },
    "resultLabel": "Durée de financement estimée",
    "note": "Comptez chaque encaissement une seule fois, soit dans les fonds disponibles, soit dans le calcul des sorties nettes mensuelles.",
    "rowLabels": {
      "Cash available": "Fonds disponibles",
      "Monthly burn": "Sorties nettes mensuelles"
    }
  },
  "customer-ltv-widget": {
    "title": "Valeur d’un client sur la durée",
    "description": "Estimez la marge brute cumulée sur la durée prévue de la relation client.",
    "fields": {
      "spend": "Dépense mensuelle moyenne du client",
      "months": "Durée de la relation client",
      "margin": "Taux de marge brute"
    },
    "resultLabel": "Marge brute cumulée par client",
    "note": "Le calcul multiplie la dépense mensuelle par le nombre de mois, puis applique le taux de marge brute.",
    "rowLabels": {
      "spend": "Dépense mensuelle moyenne du client",
      "months": "Durée de la relation client",
      "margin": "Taux de marge brute"
    }
  },
  "land-size-converter": {
    "title": "Conversion d’acres en mètres carrés",
    "description": "Saisissez la superficie du terrain en acres pour obtenir son équivalent en mètres carrés.",
    "fields": {
      "acres": "Superficie en acres"
    },
    "resultLabel": "Superficie en mètres carrés",
    "note": "Un acre correspond à environ 4 047 m².",
    "rowLabels": {
      "acres": "Superficie en acres"
    }
  },
  "tenancy-deposit-widget": {
    "title": "Dépôt de garantie locative",
    "description": "Calculez le dépôt de garantie prévu par votre bail à partir du loyer mensuel.",
    "fields": {
      "rent": "Loyer mensuel",
      "months": "Nombre de mois de loyer demandés"
    },
    "resultLabel": "Dépôt de garantie",
    "note": "Reprenez le nombre de mois indiqué dans le bail. Les loyers payés d’avance se comptent séparément.",
    "rowLabels": {
      "rent": "Loyer mensuel",
      "months": "Nombre de mois de loyer demandés"
    }
  },
  "property-management-fee": {
    "title": "Frais de gestion locative",
    "description": "Estimez les honoraires annuels à partir du loyer annuel, du taux de gestion et des frais fixes.",
    "fields": {
      "annual": "Loyer annuel",
      "rate": "Taux des honoraires de gestion",
      "fixed": "Frais fixes annuels"
    },
    "resultLabel": "Frais de gestion annuels",
    "note": "Si les frais fixes sont mensuels, multipliez-les par douze avant de les saisir.",
    "rowLabels": {
      "Percentage component": "Honoraires proportionnels",
      "Fixed component": "Frais fixes annuels"
    }
  },
  "rent-vs-buy-widget": {
    "title": "Coût annuel de la location et de l’achat",
    "description": "Comparez le loyer annuel au coût annuel que vous avez estimé pour le même logement en tant que propriétaire.",
    "fields": {
      "rent": "Loyer annuel",
      "ownership": "Coût annuel du logement en tant que propriétaire"
    },
    "resultLabel": "Loyer en pourcentage du coût de propriété",
    "note": "Un résultat de 80 % signifie que le loyer représente quatre cinquièmes du coût annuel de propriété saisi.",
    "rowLabels": {
      "Numerator": "Loyer annuel",
      "Denominator": "Coût annuel de propriété"
    }
  },
  "rent-affordability-widget": {
    "title": "Budget de loyer mensuel",
    "description": "Fixez la part de votre revenu mensuel que vous souhaitez consacrer au loyer.",
    "fields": {
      "income": "Revenu mensuel du ménage",
      "ratio": "Part du revenu consacrée au loyer"
    },
    "resultLabel": "Loyer mensuel correspondant",
    "note": "Un revenu mensuel de 600 000 et une part de 30 % donnent un budget de loyer de 180 000 par mois.",
    "rowLabels": {
      "Income used": "Part du revenu retenue",
      "Annual equivalent": "Budget de loyer annuel"
    }
  },
  "vacancy-loss-widget": {
    "title": "Perte de loyers en période de vacance",
    "description": "Estimez les loyers qui ne seront pas perçus pendant la période où le logement reste inoccupé.",
    "fields": {
      "rent": "Loyer mensuel",
      "months": "Durée de vacance en mois"
    },
    "resultLabel": "Loyers non perçus",
    "note": "Pour six semaines de vacance environ, vous pouvez saisir 1,5 mois.",
    "rowLabels": {
      "rent": "Loyer mensuel",
      "months": "Durée de vacance en mois"
    }
  },
  "rental-yield-widget": {
    "title": "Rendement locatif brut",
    "description": "Rapportez douze mois de loyer à la valeur du bien.",
    "fields": {
      "rent": "Loyer mensuel",
      "value": "Valeur du bien"
    },
    "resultLabel": "Rendement locatif brut annuel",
    "note": "Le calcul suppose douze mois de location et exclut les charges, les impôts et les travaux.",
    "rowLabels": {
      "Numerator": "Loyer mensuel",
      "Denominator": "Valeur du bien"
    }
  },
  "property-roi-widget": {
    "title": "Rentabilité d’un investissement immobilier",
    "description": "Comparez les sommes récupérées sur l’investissement à son coût d’acquisition total.",
    "fields": {
      "return": "Loyers encaissés et prix de revente total",
      "cost": "Prix d’achat et frais d’acquisition"
    },
    "resultLabel": "Rentabilité sur la période",
    "note": "Incluez le prix de revente total avec les loyers. Le calcul déduit le coût d’acquisition, puis divise le gain obtenu par ce coût.",
    "rowLabels": {
      "Revenue": "Loyers et prix de revente",
      "Cost": "Coût d’acquisition",
      "Net result": "Gain ou perte sur la période"
    }
  }
,

  "seed-rate": {
    "title": "Quantité de semences",
    "description": "Calculez la quantité à prévoir pour la parcelle.",
    "fields": {
      "area": "Surface cultivée",
      "rate": "Dose de semis",
      "buffer": "Marge pour pertes"
    },
    "resultLabel": "Semences à prévoir",
    "note": "La marge s’ajoute à la quantité calculée à partir de la surface et de la dose de semis."
  },
  "fertilizer-rate": {
    "title": "Quantité d’engrais",
    "description": "Calculez la quantité à préparer pour la surface à fertiliser.",
    "fields": {
      "area": "Surface à fertiliser",
      "rate": "Dose d’application",
      "buffer": "Marge pour pertes"
    },
    "resultLabel": "Engrais à prévoir",
    "note": "Utilisez la dose adaptée à la culture et au produit. La marge couvre les pertes de manutention."
  },
  "crop-yield-estimator": {
    "title": "Estimation de la récolte",
    "description": "Multipliez le rendement prévu par la surface cultivée.",
    "fields": {
      "area": "Surface cultivée",
      "yield": "Rendement prévu par hectare"
    },
    "resultLabel": "Récolte prévue",
    "note": "Saisissez le rendement attendu dans vos parcelles pour cette campagne."
  },
  "farm-budget-estimator": {
    "title": "Budget de la campagne agricole",
    "description": "Additionnez vos dépenses prévisionnelles dans une même devise.",
    "fields": {
      "seed": "Semences",
      "inputs": "Engrais et produits de traitement",
      "labor": "Main-d’œuvre",
      "transport": "Transport",
      "other": "Autres dépenses"
    },
    "resultLabel": "Budget total",
    "note": "Saisissez les montants de toute la campagne, dans une seule devise."
  },
  "livestock-feed-cost": {
    "title": "Coût de l’alimentation du bétail",
    "description": "Estimez la dépense à partir du cheptel, de la ration et du prix de l’aliment.",
    "fields": {
      "animals": "Nombre d’animaux",
      "days": "Nombre de jours",
      "daily": "Ration quotidienne par animal",
      "price": "Prix par kilogramme"
    },
    "resultLabel": "Coût de l’alimentation",
    "note": "Le total est exprimé dans la devise utilisée pour le prix au kilogramme."
  },
  "harvest-date-planner": {
    "title": "Date prévisionnelle de récolte",
    "description": "Ajoutez la durée du cycle à votre date de plantation.",
    "fields": {
      "planting": "Date de plantation",
      "cycle": "Durée du cycle"
    },
    "resultLabel": "Date de récolte prévue",
    "note": "La variété et les conditions de culture peuvent avancer ou retarder la récolte."
  },
  "crop-insurance-premium": {
    "title": "Prime d’assurance récolte",
    "description": "Estimez la prime à partir de la valeur assurée, du taux et des frais.",
    "fields": {
      "value": "Valeur de la récolte assurée",
      "rate": "Taux de prime",
      "admin": "Frais de dossier"
    },
    "resultLabel": "Prime estimée",
    "note": "Utilisez le taux et les frais indiqués par votre assureur, dans la même devise."
  },
  "input-price-checker": {
    "title": "Coût des intrants",
    "description": "Additionnez vos achats et les frais de transport avant de comparer les offres.",
    "fields": {
      "seed": "Semences",
      "fertilizer": "Engrais",
      "chemical": "Produits de protection des cultures",
      "transport": "Transport"
    },
    "resultLabel": "Coût total des intrants",
    "note": "Utilisez une même devise pour tous les postes du panier."
  },
  "greenhouse-area": {
    "title": "Surface cultivable sous serre",
    "description": "Calculez la surface totale de planches de mêmes dimensions.",
    "fields": {
      "length": "Longueur d’une planche",
      "width": "Largeur d’une planche",
      "beds": "Nombre de planches"
    },
    "resultLabel": "Surface totale des planches",
    "note": "Les allées ne sont pas comprises dans cette surface."
  },
  "fish-farm-stocking": {
    "title": "Empoissonnement d’un bassin",
    "description": "Estimez le nombre d’alevins à partir de la surface et de la densité choisie.",
    "fields": {
      "area": "Surface du bassin",
      "density": "Densité d’empoissonnement"
    },
    "resultLabel": "Nombre d’alevins",
    "note": "Adaptez la densité à l’espèce, à la qualité de l’eau et à l’aération disponibles."
  },
  "tractor-hire-cost": {
    "title": "Coût de location d’un tracteur",
    "description": "Multipliez la durée prévue par le tarif horaire.",
    "fields": {
      "hours": "Nombre d’heures",
      "rate": "Tarif par heure"
    },
    "resultLabel": "Coût de location",
    "note": "Vérifiez si le carburant et le conducteur sont inclus dans le tarif horaire."
  },
  "storage-loss-estimator": {
    "title": "Pertes de stockage",
    "description": "Estimez la valeur perdue pendant le stockage et la manutention.",
    "fields": {
      "value": "Valeur de la récolte stockée",
      "loss": "Taux de perte prévu",
      "handling": "Pertes de manutention en valeur"
    },
    "resultLabel": "Valeur estimée des pertes",
    "note": "Saisissez les pertes de manutention dans la même devise que la valeur de la récolte."
  }
,
  "poultry-roi-estimator": {
    title: "Rentabilité avicole",
    description: "Comparez les recettes prévues et les coûts de votre élevage de volailles.",
    fields: { revenue: "Recettes prévues", cost: "Coût total" },
    result: frenchPoultryResult
  },
  "irrigation-volume": {
    title: "Volume d’irrigation",
    description: "Calculez le volume d’eau à apporter à votre parcelle.",
    fields: { area: "Surface irriguée", depth: "Hauteur d’eau" },
    result(result) {
      const number = value => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 8 })
        .format(Number.parseFloat(String(value).replace(/,/g, "")));
      return {
        label: "Volume d’eau",
        value: number(result.value) + " m³",
        rows: result.rows.map(row => ({
          label: row.label === "area" ? "Surface irriguée" : "Hauteur d’eau",
          value: number(row.value) + (row.label === "area" ? " ha" : " mm")
        })),
        note: "Un millimètre d’eau sur un hectare correspond à 10 m³. Ce volume ne tient pas compte des pertes pendant l’irrigation."
      };
    }
  }
};
function d(e,t){var a=i((t=t||{}).widgetId)||r[0],fr=t.locale==="fr"&&frenchWidgets[a.id],l="aw-lite-"+a.id+"-"+Math.random().toString(36).slice(2,7),u=a.fields.map(function(e){var t=l+"-"+e.id,a="date"===e.type?s():e.value;return'<div class="aw-field"><label class="aw-label" for="'+t+'">'+n(fr?fr.fields[e.id]:e.label)+(e.unit && !(fr && fr.fields[e.id].endsWith("(" + (frenchUnits[e.unit] || e.unit) + ")"))?" ("+n(fr ? frenchUnits[e.unit] || e.unit : e.unit)+")":"")+'</label><input class="aw-input" id="'+t+'" data-field="'+n(e.id)+'" type="'+("date"===e.type?"date":"number")+'" inputmode="decimal" step="any" value="'+n(a)+'"></div>'}).join("");e.innerHTML='<div class="aw-title">'+n(fr?fr.title:a.title)+'</div><p class="aw-result-label" style="margin:-8px 0 14px">'+n(fr?fr.description:a.description)+"</p>"+u+'<button class="aw-btn aw-btn--primary" type="button">'+(fr?"Calculer":"Calculate")+'</button><div class="aw-result-box" style="display:none"></div>'+(t.footerHTML||"");var d=e.querySelector(".aw-result-box");function p(){var t={};return e.querySelectorAll("[data-field]").forEach(function(e){t[e.getAttribute("data-field")]="date"===e.type?e.value:o(e.value)}),t}function m(){var e=c(a,p(),fr?"fr-FR":"en-GB");if(fr)e=fr.result?fr.result(e):frenchWidgetResult(e,a,fr);d.style.display="block",d.innerHTML='<div class="aw-result-label">'+n(e.label)+'</div><div class="aw-result-main">'+n(e.value)+"</div>"+(e.rows.length?'<hr class="aw-divider">'+e.rows.map(function(e){return'<div class="aw-result-row"><span class="aw-result-label">'+n(e.label)+"</span><span>"+n(e.value)+"</span></div>"}).join(""):"")+'<p class="aw-result-label" style="margin-top:10px">'+n(e.note)+"</p>"}e.querySelector(".aw-btn").addEventListener("click",m),e.querySelectorAll("input").forEach(function(e){e.addEventListener("change",m),e.addEventListener("keyup",function(e){"Enter"===e.key&&m()})}),m()}return{specs:r,byId:i,frenchWidget:function(id){return frenchWidgets[id]},install:function(e){var t=e.AfroWidgets=e.AfroWidgets||{};t.renderLiteWidget=d,r.forEach(function(e){var a=function(t,a){(a=a||{}).widgetId=e.id,d(t,a)};t[function(e){return e.replace(/-/g,"_")}(e.id)]=a,t[function(e){return e.replace(/-([a-z])/g,function(e,t){return t.toUpperCase()})}(e.id)]=a})},renderLiteWidget:d}}();"undefined"!=typeof module&&module.exports&&(module.exports=t),e&&(e.AfroWidgetLitePack=t,e.document&&t.install(e))}("undefined"!=typeof window?window:globalThis);