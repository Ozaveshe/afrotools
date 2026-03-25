// /data/agriculture/livestock-feed-data.js
// AfroTools — Livestock Feed Calculator Data
// Animal requirements (NRC standards adapted for African tropical breeds)
// Feed ingredients database + country-specific prices (15 countries)
!function(){"use strict";
var D={};

// ── Animal Requirements ──────────────────────────────────────────────────────
D.cattle={
  classes:{
    "dairy_lactating_high":   {label:"Dairy cow — High producing (>15L/day)",    dmi_pct:3.5, cp_pct:16, tdn_pct:70, me_mj:11.0, roughagePct:0.45},
    "dairy_lactating_medium": {label:"Dairy cow — Medium producing (8-15L/day)", dmi_pct:3.0, cp_pct:14, tdn_pct:65, me_mj:10.0, roughagePct:0.50},
    "dairy_lactating_low":    {label:"Dairy cow — Low producing (<8L/day)",       dmi_pct:2.8, cp_pct:12, tdn_pct:60, me_mj:9.0,  roughagePct:0.55},
    "dairy_dry":              {label:"Dairy cow — Dry period",                    dmi_pct:2.0, cp_pct:10, tdn_pct:55, me_mj:8.5,  roughagePct:0.65},
    "dairy_dry_late":         {label:"Dairy cow — Late pregnancy (dry)",          dmi_pct:2.0, cp_pct:12, tdn_pct:55, me_mj:8.5,  roughagePct:0.60},
    "beef_growing_young":     {label:"Beef — Growing young (6-12 months)",        dmi_pct:2.8, cp_pct:14, tdn_pct:65, me_mj:10.0, roughagePct:0.55},
    "beef_growing_older":     {label:"Beef — Growing older (12-24 months)",       dmi_pct:2.5, cp_pct:12, tdn_pct:65, me_mj:10.0, roughagePct:0.58},
    "beef_fattening":         {label:"Beef — Fattening",                          dmi_pct:2.5, cp_pct:11, tdn_pct:70, me_mj:11.0, roughagePct:0.40},
    "beef_maintenance":       {label:"Beef — Maintenance / dry season",           dmi_pct:2.0, cp_pct:8,  tdn_pct:50, me_mj:7.5,  roughagePct:0.70},
    "calf_pre_weaning":       {label:"Calf — Pre-weaning",                        dmi_pct:3.0, cp_pct:18, tdn_pct:75, me_mj:12.0, roughagePct:0.35},
    "bull_breeding":          {label:"Bull — Breeding",                            dmi_pct:2.2, cp_pct:10, tdn_pct:55, me_mj:8.5,  roughagePct:0.65}
  },
  breeds:{
    "zebu_cow":          {label:"Zebu cow (Boran / White Fulani / Sokoto Gudali)", bw:300},
    "zebu_bull":         {label:"Zebu bull",                                       bw:400},
    "ankole_cow":        {label:"Ankole cow (East Africa)",                        bw:350},
    "friesian_cross":    {label:"Friesian cross cow (common dairy cross)",         bw:450},
    "jersey_cross":      {label:"Jersey cross cow",                                bw:380},
    "brahman_cross":     {label:"Brahman cross",                                   bw:500},
    "nguni_cow":         {label:"Nguni cow (South Africa indigenous)",             bw:320},
    "ndama_cow":         {label:"N'Dama cow (West Africa trypanotolerant)",        bw:280},
    "sahiwal_cross":     {label:"Sahiwal cross — dairy (Kenya / Tanzania)",        bw:420},
    "calf_3m":           {label:"Calf — 3 months old",                             bw:80},
    "calf_6m":           {label:"Calf — 6 months old",                             bw:150},
    "weaner_12m":        {label:"Weaner — 12 months old",                          bw:200}
  }
};

D.goat={
  classes:{
    "doe_lactating":     {label:"Doe — Lactating",             dmi_pct:4.5, cp_pct:14, tdn_pct:65, me_mj:9.5,  roughagePct:0.50},
    "doe_dry":           {label:"Doe — Dry",                   dmi_pct:3.0, cp_pct:10, tdn_pct:55, me_mj:8.0,  roughagePct:0.65},
    "doe_pregnant_late": {label:"Doe — Late pregnancy",        dmi_pct:3.5, cp_pct:12, tdn_pct:60, me_mj:8.5,  roughagePct:0.58},
    "buck_breeding":     {label:"Buck — Breeding",             dmi_pct:3.0, cp_pct:10, tdn_pct:55, me_mj:8.0,  roughagePct:0.65},
    "kid_growing":       {label:"Kid — Growing",               dmi_pct:4.0, cp_pct:14, tdn_pct:68, me_mj:10.0, roughagePct:0.45},
    "fattening":         {label:"Fattening",                   dmi_pct:3.5, cp_pct:12, tdn_pct:70, me_mj:10.0, roughagePct:0.40},
    "maintenance":       {label:"Maintenance",                 dmi_pct:3.0, cp_pct:8,  tdn_pct:50, me_mj:7.5,  roughagePct:0.72}
  },
  breeds:{
    "west_african_dwarf":{label:"West African Dwarf (Nigeria / Ghana — small, prolific)",bw:25},
    "red_sokoto":        {label:"Red Sokoto (Nigeria — leather value)",                  bw:30},
    "boer_cross":        {label:"Boer cross (meat breed — South Africa)",                bw:50},
    "sahel_goat":        {label:"Sahel goat (Sahel belt)",                               bw:30},
    "east_african_goat": {label:"East African goat (Kenya / Tanzania)",                  bw:35},
    "alpine_cross":      {label:"Alpine cross (dairy)",                                  bw:45},
    "toggenburg_cross":  {label:"Toggenburg cross (dairy — Kenya)",                      bw:40},
    "kid_3m":            {label:"Kid — 3 months old",                                    bw:8},
    "kid_6m":            {label:"Kid — 6 months old",                                    bw:15}
  }
};

D.sheep={
  classes:{
    "ewe_lactating":     {label:"Ewe — Lactating",             dmi_pct:4.0, cp_pct:14, tdn_pct:65, me_mj:9.5,  roughagePct:0.50},
    "ewe_dry":           {label:"Ewe — Dry",                   dmi_pct:2.5, cp_pct:9,  tdn_pct:55, me_mj:8.0,  roughagePct:0.68},
    "ewe_pregnant_late": {label:"Ewe — Late pregnancy",        dmi_pct:3.5, cp_pct:12, tdn_pct:60, me_mj:8.5,  roughagePct:0.55},
    "ram_breeding":      {label:"Ram — Breeding",              dmi_pct:3.0, cp_pct:10, tdn_pct:55, me_mj:8.0,  roughagePct:0.65},
    "lamb_growing":      {label:"Lamb — Growing",              dmi_pct:4.5, cp_pct:16, tdn_pct:70, me_mj:10.0, roughagePct:0.45},
    "fattening":         {label:"Fattening",                   dmi_pct:3.5, cp_pct:12, tdn_pct:70, me_mj:10.0, roughagePct:0.40},
    "maintenance":       {label:"Maintenance",                 dmi_pct:2.5, cp_pct:8,  tdn_pct:50, me_mj:7.5,  roughagePct:0.72}
  },
  breeds:{
    "dorper":              {label:"Dorper (South Africa — top meat breed in Africa)",    bw:70},
    "yankasa":             {label:"Yankasa (Nigeria)",                                   bw:35},
    "uda":                 {label:"Uda (Nigeria — bicoloured)",                          bw:40},
    "balami":              {label:"Balami (Nigeria — largest West African breed)",       bw:50},
    "blackhead_persian":   {label:"Blackhead Persian (East / Southern Africa)",          bw:45},
    "red_maasai":          {label:"Red Maasai (Kenya / Tanzania — trypanotolerant)",    bw:40},
    "djallonke":           {label:"Djallonkê (West Africa — small, trypanotolerant)",   bw:25},
    "barbarine":           {label:"Barbarine (North Africa — Tunisia / Algeria)",        bw:50},
    "awassi":              {label:"Awassi (Egypt / Sudan — fat-tailed dairy)",           bw:60},
    "lamb_3m":             {label:"Lamb — 3 months old",                                 bw:12},
    "lamb_6m":             {label:"Lamb — 6 months old",                                 bw:25}
  }
};

// ── Feed Ingredients Database ─────────────────────────────────────────────────
// dm=dry matter%, cp=crude protein% DM-basis, tdn=total digestible nutrients%, me=MJ/kg DM
// maxInc=max inclusion in diet DM (%), avail=countries where commonly available
D.ingredients={
  // ── ENERGY FEEDS ──
  "maize_grain":    {name:"Maize grain (whole / cracked)", cat:"energy",   dm:88, cp:9.0,  tdn:88, me:13.0, cf:2.5,  maxInc:50, notes:"Primary energy source. Widely available.",           avail:["NG","KE","ZA","GH","ET","EG","TZ","UG","RW","CI","CM","SN","MA","TN","AO"]},
  "maize_bran":     {name:"Maize bran",                    cat:"energy",   dm:90, cp:10.0, tdn:70, me:10.5, cf:9.0,  maxInc:30, notes:"Milling byproduct. Cheaper than whole grain.",         avail:["NG","KE","GH","TZ","UG","RW","CI","CM","SN","AO"]},
  "wheat_bran":     {name:"Wheat bran",                    cat:"energy",   dm:89, cp:16.0, tdn:67, me:10.0, cf:11.0, maxInc:30, notes:"Excellent dairy supplement. High phosphorus.",          avail:["KE","ET","EG","ZA","MA","TN","UG","RW"]},
  "rice_bran":      {name:"Rice bran",                     cat:"energy",   dm:91, cp:13.0, tdn:65, me:9.5,  cf:12.0, maxInc:25, notes:"High oil content (rancidity risk). Use fresh.",         avail:["NG","SN","TZ","EG"]},
  "sorghum_grain":  {name:"Sorghum grain",                 cat:"energy",   dm:89, cp:10.0, tdn:82, me:12.0, cf:2.5,  maxInc:40, notes:"Good maize alternative. Tannin varieties need processing.",avail:["NG","ET","SN","MA","TN","AO","TZ"]},
  "millet_grain":   {name:"Pearl millet grain",            cat:"energy",   dm:90, cp:11.0, tdn:80, me:11.5, cf:2.0,  maxInc:40, notes:"Sahel staple. Good energy source.",                    avail:["NG","SN","MA"]},
  "cassava_chips":  {name:"Cassava chips / pellets",       cat:"energy",   dm:88, cp:2.5,  tdn:75, me:11.0, cf:4.0,  maxInc:30, notes:"High energy, very low protein — MUST supplement protein. Sun-dry to reduce HCN.",avail:["NG","GH","TZ","AO","CI","CM"]},
  "cassava_peel":   {name:"Cassava peel (dried)",          cat:"energy",   dm:85, cp:5.0,  tdn:60, me:8.5,  cf:12.0, maxInc:20, notes:"Free / cheap waste. Dry properly. Good for goats.",     avail:["NG","GH","CI","CM","AO"]},
  "molasses":       {name:"Molasses (sugar cane)",         cat:"energy",   dm:75, cp:4.0,  tdn:72, me:10.0, cf:0,    maxInc:15, notes:"Palatability enhancer. Too much causes diarrhea.",       avail:["KE","EG","ZA","ET","TZ","MA","TN","AO"]},
  "brewers_grain":  {name:"Brewers grain (wet)",           cat:"energy",   dm:25, cp:26.0, tdn:66, me:9.5,  cf:17.0, maxInc:25, notes:"Cheap near breweries. Use within 2-3 days.",              avail:["KE","ET","ZA","UG"]},
  // ── PROTEIN FEEDS ──
  "cottonseed_cake":{name:"Cottonseed cake",               cat:"protein",  dm:92, cp:42.0, tdn:75, me:11.0, cf:12.0, maxInc:20, notes:"Excellent protein. Contains gossypol — limit to 20%.",  avail:["NG","TZ","ET","EG","MA","SN","AO","CI","CM"]},
  "groundnut_cake": {name:"Groundnut cake",                cat:"protein",  dm:92, cp:48.0, tdn:78, me:11.5, cf:7.0,  maxInc:25, notes:"High quality protein. Aflatoxin risk if poorly stored.",  avail:["NG","SN","GH","EG"]},
  "soybean_meal":   {name:"Soybean meal",                  cat:"protein",  dm:90, cp:44.0, tdn:82, me:12.0, cf:7.0,  maxInc:25, notes:"Gold standard protein. Must be heat-treated.",            avail:["NG","ZA","KE","TZ","UG","RW","CM","MA","TN","AO","GH","ET"]},
  "sunflower_cake": {name:"Sunflower seed cake",           cat:"protein",  dm:92, cp:34.0, tdn:60, me:9.0,  cf:25.0, maxInc:20, notes:"Good protein but high fibre.",                            avail:["TZ","ZA","ET","MA","TN"]},
  "palm_kernel_cake":{name:"Palm kernel cake",             cat:"protein",  dm:92, cp:18.0, tdn:72, me:10.5, cf:16.0, maxInc:25, notes:"Byproduct of palm oil. Very common West/Central Africa.",   avail:["NG","GH","CI","CM","AO"]},
  "fish_meal":      {name:"Fish meal",                     cat:"protein",  dm:92, cp:60.0, tdn:75, me:11.0, cf:1.0,  maxInc:5,  notes:"Highest protein. Expensive. Primarily for poultry.",       avail:["NG","KE","GH","TZ","SN","MA","AO"]},
  "blood_meal":     {name:"Blood meal (abattoir)",         cat:"protein",  dm:90, cp:80.0, tdn:65, me:9.5,  cf:1.0,  maxInc:5,  notes:"Very high protein. Low palatability. Max 5% of diet.",     avail:["NG","KE","ZA","GH"]},
  "leucaena_leaf":  {name:"Leucaena leaf meal (free tree)", cat:"protein", dm:90, cp:25.0, tdn:55, me:8.0,  cf:15.0, maxInc:30, notes:"FREE protein from trees. Contains mimosine — limit 30%.",  avail:["NG","KE","GH","TZ","UG","CI","CM","AO"]},
  "moringa_leaf":   {name:"Moringa leaf meal (free tree)",  cat:"protein", dm:90, cp:27.0, tdn:58, me:8.5,  cf:12.0, maxInc:15, notes:"Excellent supplement. Grows across tropical Africa.",       avail:["NG","KE","GH","ET","SN","CI","CM","AO","TZ","UG"]},
  "noug_cake":      {name:"Noug / Niger seed cake",         cat:"protein", dm:91, cp:32.0, tdn:62, me:9.0,  cf:18.0, maxInc:20, notes:"Ethiopia-specific protein source. Good for dairy.",         avail:["ET"]},
  // ── ROUGHAGES ──
  "napier_grass":   {name:"Napier / Elephant grass (fresh)", cat:"roughage",dm:20, cp:10.0, tdn:55, me:8.0, cf:30.0, maxInc:100,notes:"Africa's #1 fodder grass. Harvest at 60-90cm for best quality.", avail:["KE","UG","TZ","RW","ET","NG","CI","CM","AO","GH"]},
  "rhodes_grass_hay":{name:"Rhodes grass hay",              cat:"roughage",dm:88, cp:8.0,  tdn:50, me:7.5,  cf:32.0, maxInc:100,notes:"Good quality grass hay. Common East/Southern Africa.",       avail:["KE","ZA","ET","TZ"]},
  "maize_stover":   {name:"Maize stover (crop residue)",    cat:"roughage",dm:85, cp:5.0,  tdn:45, me:6.5,  cf:35.0, maxInc:100,notes:"FREE but low quality. Urea treatment improves digestibility.",avail:["NG","KE","ZA","ET","TZ","GH","UG","RW","CI","CM","SN","MA","AO"]},
  "rice_straw":     {name:"Rice straw",                     cat:"roughage",dm:88, cp:4.0,  tdn:40, me:6.0,  cf:38.0, maxInc:100,notes:"Very low quality. Treat with urea or NaOH to improve.",       avail:["NG","SN","EG","TZ","MA"]},
  "sweet_potato_vines":{name:"Sweet potato vines (fresh)", cat:"roughage",dm:15, cp:18.0, tdn:60, me:9.0,  cf:18.0, maxInc:100,notes:"Excellent FREE roughage. High protein for a roughage.",        avail:["UG","RW","KE","TZ"]},
  "cowpea_haulm":   {name:"Cowpea haulm (post-harvest)",    cat:"roughage",dm:85, cp:15.0, tdn:55, me:8.0,  cf:25.0, maxInc:100,notes:"Excellent legume residue. High protein roughage.",             avail:["NG","SN","GH","CI"]},
  "groundnut_haulm":{name:"Groundnut haulm",                cat:"roughage",dm:85, cp:12.0, tdn:52, me:7.5,  cf:28.0, maxInc:100,notes:"Good quality legume hay.",                                     avail:["NG","SN","GH","EG"]},
  "lucerne_hay":    {name:"Lucerne (Alfalfa) hay",           cat:"roughage",dm:88, cp:18.0, tdn:58, me:8.5,  cf:28.0, maxInc:100,notes:"Premium roughage. High protein and calcium.",                  avail:["ZA","EG","KE","MA","TN"]},
  "teff_straw":     {name:"Teff straw",                      cat:"roughage",dm:88, cp:5.0,  tdn:42, me:6.2,  cf:38.0, maxInc:100,notes:"Primary roughage in Ethiopia. Low quality — supplement.",     avail:["ET"]},
  "berseem_hay":    {name:"Berseem clover hay",              cat:"roughage",dm:88, cp:16.0, tdn:56, me:8.2,  cf:26.0, maxInc:100,notes:"Excellent legume hay. Egypt's key dairy roughage.",             avail:["EG","MA","TN"]},
  "cereal_straw":   {name:"Cereal straw (wheat / barley)",  cat:"roughage",dm:88, cp:4.0,  tdn:42, me:6.0,  cf:40.0, maxInc:100,notes:"Low quality. Supplement with protein. North Africa staple.",   avail:["MA","TN","EG"]},
  // ── MINERALS & ADDITIVES ──
  "bone_meal":      {name:"Bone meal",                       cat:"mineral", dm:95, cp:10.0, ca:24.0, p:12.0, maxInc:3,  notes:"Ca + P source. Sterilize to prevent disease.",  avail:["ALL"]},
  "limestone":      {name:"Limestone / calcium carbonate",   cat:"mineral", dm:100,ca:38.0, p:0,     maxInc:2,  notes:"Calcium source only. Combine with bone meal for P.", avail:["ALL"]},
  "dcp":            {name:"Dicalcium phosphate (DCP)",        cat:"mineral", dm:100,ca:23.0, p:18.0,  maxInc:2,  notes:"Best Ca + P supplement. More expensive.",            avail:["ALL"]},
  "salt":           {name:"Common salt (NaCl)",               cat:"mineral", dm:100,maxInc:1,          notes:"Always include at 0.5% of diet. Essential.",        avail:["ALL"]},
  "urea":           {name:"Urea (feed grade — ruminants only)",cat:"additive",dm:100,cp:281,           maxInc:1,  notes:"RUMINANTS ONLY. Toxic to pigs/poultry. Max 1% of diet. Introduce gradually.", avail:["ALL"]}
};

// ── Feed Prices — local currency per kg (as-purchased / fresh weight) ────────
D.prices={
  "NG":{currency:"NGN",symbol:"₦",
    maize_grain:450,maize_bran:250,wheat_bran:350,rice_bran:200,sorghum_grain:350,millet_grain:280,cassava_chips:150,cassava_peel:50,molasses:200,
    cottonseed_cake:400,groundnut_cake:500,soybean_meal:600,palm_kernel_cake:200,fish_meal:1500,blood_meal:300,leucaena_leaf:0,moringa_leaf:50,
    napier_grass:20,maize_stover:30,rice_straw:20,cowpea_haulm:100,groundnut_haulm:80,
    bone_meal:250,limestone:120,dcp:800,salt:100,urea:600,
    note:"Feed prices volatile. Maize especially affected by seasonal variation and forex."
  },
  "KE":{currency:"KES",symbol:"KSh",
    maize_grain:50,maize_bran:25,wheat_bran:30,molasses:15,brewers_grain:5,
    cottonseed_cake:40,sunflower_cake:30,soybean_meal:70,fish_meal:150,blood_meal:40,leucaena_leaf:0,moringa_leaf:5,
    napier_grass:3,rhodes_grass_hay:15,lucerne_hay:30,sweet_potato_vines:2,maize_stover:5,
    bone_meal:30,limestone:12,dcp:80,salt:15,urea:60,
    note:"Dairy meal widely available from Unga, Pembe. Smallholders often buy pre-mixed."
  },
  "ZA":{currency:"ZAR",symbol:"R",
    maize_grain:4.5,wheat_bran:3.5,sorghum_grain:4.0,molasses:2.0,
    soybean_meal:8.0,sunflower_cake:4.5,blood_meal:12.0,fish_meal:20.0,
    lucerne_hay:4.0,rhodes_grass_hay:2.0,maize_stover:1.0,
    bone_meal:3.0,limestone:1.0,dcp:12.0,salt:1.5,urea:8.0,
    note:"Most commercialised feed market in Africa. AFMA members produce standardised feeds."
  },
  "GH":{currency:"GHS",symbol:"GH₵",
    maize_grain:5.0,maize_bran:3.0,wheat_bran:4.0,rice_bran:2.5,cassava_chips:2.0,cassava_peel:0.1,
    cottonseed_cake:5.0,groundnut_cake:6.0,palm_kernel_cake:2.5,soybean_meal:7.0,fish_meal:15.0,blood_meal:8.0,leucaena_leaf:0,moringa_leaf:0.5,
    napier_grass:0.3,maize_stover:0.5,cowpea_haulm:1.5,groundnut_haulm:1.0,
    bone_meal:3.0,limestone:1.0,dcp:10.0,salt:1.0,urea:6.0,
    note:"Palm kernel cake is cheap and widely available. Cassava peel is essentially free."
  },
  "ET":{currency:"ETB",symbol:"Br",
    maize_grain:30,wheat_bran:20,sorghum_grain:25,molasses:10,brewers_grain:5,
    noug_cake:25,cottonseed_cake:30,sunflower_cake:28,soybean_meal:45,moringa_leaf:3,
    napier_grass:2,rhodes_grass_hay:8,teff_straw:5,maize_stover:3,
    bone_meal:20,limestone:8,dcp:60,salt:8,urea:40,
    note:"Noug cake (niger seed) is Ethiopia's unique protein source. Teff straw is primary roughage."
  },
  "EG":{currency:"EGP",symbol:"E£",
    maize_grain:12,wheat_bran:8,rice_bran:6,sorghum_grain:11,molasses:4,
    cottonseed_cake:20,groundnut_cake:22,soybean_meal:35,fish_meal:80,
    lucerne_hay:10,berseem_hay:6,rice_straw:2,cereal_straw:2,groundnut_haulm:7,
    bone_meal:15,limestone:5,dcp:45,salt:3,urea:25,
    note:"Berseem (Egyptian clover) is the cornerstone of Egyptian livestock feeding."
  },
  "TZ":{currency:"TZS",symbol:"TSh",
    maize_grain:1000,maize_bran:600,wheat_bran:800,sorghum_grain:900,cassava_chips:500,molasses:400,
    cottonseed_cake:1200,sunflower_cake:800,soybean_meal:2000,palm_kernel_cake:700,fish_meal:4000,leucaena_leaf:0,moringa_leaf:100,
    napier_grass:100,maize_stover:150,sweet_potato_vines:80,rhodes_grass_hay:400,rice_straw:100,
    bone_meal:700,limestone:250,dcp:2500,salt:300,urea:1500,
    note:"Sisal waste and sunflower cake commonly available near processing plants."
  },
  "UG":{currency:"UGX",symbol:"USh",
    maize_grain:1500,maize_bran:800,wheat_bran:1200,brewers_grain:400,
    soybean_meal:3000,palm_kernel_cake:900,cottonseed_cake:1800,fish_meal:6000,leucaena_leaf:0,moringa_leaf:200,
    napier_grass:100,sweet_potato_vines:50,maize_stover:150,
    bone_meal:1000,limestone:350,dcp:3500,salt:400,urea:2000,
    note:"Napier grass is the backbone of Uganda's smallholder dairy system."
  },
  "RW":{currency:"RWF",symbol:"RF",
    maize_grain:350,maize_bran:200,wheat_bran:280,
    soybean_meal:600,cottonseed_cake:450,moringa_leaf:30,
    napier_grass:30,sweet_potato_vines:20,maize_stover:50,
    bone_meal:200,limestone:70,dcp:700,salt:80,urea:500,
    note:"Sweet potato vines abundant year-round. High-quality free roughage for smallholders."
  },
  "CI":{currency:"XOF",symbol:"FCFA",
    maize_grain:250,maize_bran:150,rice_bran:100,cassava_chips:80,cassava_peel:10,
    cottonseed_cake:300,palm_kernel_cake:120,soybean_meal:450,fish_meal:900,leucaena_leaf:0,moringa_leaf:30,
    napier_grass:30,maize_stover:50,cowpea_haulm:100,
    bone_meal:200,limestone:70,dcp:600,salt:50,urea:350,
    note:"Palm kernel cake is very cheap and available. Cocoa pod husks also used as roughage."
  },
  "CM":{currency:"XAF",symbol:"FCFA",
    maize_grain:250,maize_bran:150,wheat_bran:200,cassava_peel:10,
    cottonseed_cake:280,palm_kernel_cake:100,soybean_meal:400,fish_meal:800,leucaena_leaf:0,moringa_leaf:30,
    napier_grass:20,maize_stover:40,
    bone_meal:180,limestone:60,dcp:550,salt:50,urea:300,
    note:"North Cameroon (Adamawa) is the traditional cattle belt. Napier grass in south."
  },
  "SN":{currency:"XOF",symbol:"FCFA",
    maize_grain:280,millet_grain:200,sorghum_grain:220,rice_bran:120,
    cottonseed_cake:300,groundnut_cake:350,soybean_meal:450,fish_meal:1000,moringa_leaf:30,
    maize_stover:60,rice_straw:30,cowpea_haulm:150,groundnut_haulm:100,
    bone_meal:200,limestone:70,dcp:650,salt:60,urea:380,
    note:"Groundnut cake and haulm are Senegal's traditional livestock feeds."
  },
  "MA":{currency:"MAD",symbol:"DH",
    maize_grain:4.0,wheat_bran:3.0,sorghum_grain:3.8,millet_grain:3.5,molasses:2.0,
    cottonseed_cake:6.0,sunflower_cake:5.0,soybean_meal:8.0,fish_meal:20.0,
    lucerne_hay:3.5,berseem_hay:3.0,cereal_straw:1.5,maize_stover:2.0,rice_straw:1.2,
    bone_meal:3.0,limestone:1.0,dcp:12.0,salt:0.8,urea:7.0,
    note:"Barley grain and cereal straw are traditional Moroccan livestock feeds."
  },
  "TN":{currency:"TND",symbol:"DT",
    maize_grain:1.8,wheat_bran:1.2,sorghum_grain:1.6,molasses:0.9,
    cottonseed_cake:3.0,sunflower_cake:2.5,soybean_meal:4.0,fish_meal:9.0,
    lucerne_hay:1.5,berseem_hay:1.2,cereal_straw:0.6,maize_stover:1.0,
    bone_meal:1.5,limestone:0.5,dcp:6.0,salt:0.4,urea:3.5,
    note:"Barbarine and Sicilo-Sarde breeds are Tunisia's main sheep. Olive marc also used."
  },
  "AO":{currency:"AOA",symbol:"Kz",
    maize_grain:350,cassava_chips:150,cassava_peel:20,sorghum_grain:300,molasses:120,
    cottonseed_cake:400,palm_kernel_cake:200,soybean_meal:600,fish_meal:1200,leucaena_leaf:0,moringa_leaf:50,
    napier_grass:40,maize_stover:60,
    bone_meal:300,limestone:100,dcp:800,salt:80,urea:500,
    note:"Angola has large cattle population in southern highlands. Feed market still developing."
  }
};

window.AfroTools=window.AfroTools||{};
window.AfroTools.LivestockFeedData=D;
}();
