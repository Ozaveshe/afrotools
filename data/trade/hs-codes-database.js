/* AfroTools — HS Codes Database /data/trade/hs-codes-database.js */
const HS_DATABASE = {
  chapters: [
    { chapter:"01", title:"Live Animals", section:"I", sectionTitle:"Live Animals; Animal Products",
      headings:[
        { code:"0101", description:"Live horses, asses, mules and hinnies", subheadings:[
          { code:"0101.21", description:"Purebred breeding horses", keywords:["horse","stallion","mare","breeding","equine"] },
          { code:"0101.29", description:"Other live horses", keywords:["horse","pony"] },
          { code:"0101.30", description:"Live asses", keywords:["donkey","ass"] },
          { code:"0101.90", description:"Mules and hinnies", keywords:["mule"] }
        ]},
        { code:"0102", description:"Live bovine animals", subheadings:[
          { code:"0102.21", description:"Purebred breeding cattle", keywords:["cattle","cow","bull","breeding bovine"] },
          { code:"0102.29", description:"Other live cattle", keywords:["cattle","cow","bull","beef cattle"] },
          { code:"0102.31", description:"Purebred breeding buffalo", keywords:["buffalo","breeding"] },
          { code:"0102.39", description:"Other live buffalo", keywords:["buffalo"] },
          { code:"0102.90", description:"Other live bovine animals", keywords:["bovine"] }
        ]},
        { code:"0103", description:"Live swine", subheadings:[
          { code:"0103.10", description:"Purebred breeding swine", keywords:["pig","swine","pork","hog","breeding pig"] },
          { code:"0103.91", description:"Swine weighing less than 50kg", keywords:["piglet","pig"] },
          { code:"0103.92", description:"Swine weighing 50kg or more", keywords:["pig","sow","boar"] }
        ]},
        { code:"0105", description:"Live poultry", subheadings:[
          { code:"0105.11", description:"Fowls of the species Gallus domesticus <185g", keywords:["chick","day-old chick","poultry","chicken","broiler"] },
          { code:"0105.12", description:"Turkeys <185g", keywords:["turkey","poultry"] },
          { code:"0105.94", description:"Fowls of species Gallus domesticus ≥185g", keywords:["chicken","hen","rooster","live chicken","poultry"] },
          { code:"0105.99", description:"Other poultry ≥185g", keywords:["duck","goose","guinea fowl","poultry"] }
        ]}
      ]
    },
    { chapter:"02", title:"Meat and Edible Meat Offal", section:"I", sectionTitle:"Live Animals; Animal Products",
      headings:[
        { code:"0201", description:"Meat of bovine animals, fresh or chilled", subheadings:[
          { code:"0201.10", description:"Carcasses and half-carcasses of bovine", keywords:["beef","carcass","fresh beef"] },
          { code:"0201.20", description:"Other cuts of bovine, bone-in", keywords:["beef","steak","chops","bone-in beef"] },
          { code:"0201.30", description:"Boneless beef, fresh or chilled", keywords:["beef","boneless","mince","ground beef"] }
        ]},
        { code:"0202", description:"Meat of bovine animals, frozen", subheadings:[
          { code:"0202.10", description:"Frozen carcasses of bovine", keywords:["frozen beef","carcass"] },
          { code:"0202.20", description:"Frozen cuts of bovine, bone-in", keywords:["frozen beef","bone-in"] },
          { code:"0202.30", description:"Frozen boneless beef", keywords:["frozen beef","boneless","minced beef","ground beef"] }
        ]},
        { code:"0207", description:"Meat and edible offal of poultry", subheadings:[
          { code:"0207.12", description:"Frozen whole fowl (chicken)", keywords:["frozen chicken","whole chicken","broiler"] },
          { code:"0207.14", description:"Frozen cuts and offal of fowl", keywords:["frozen chicken","chicken parts","drumstick","thigh","wing","breast","chicken pieces"] },
          { code:"0207.25", description:"Frozen whole turkey", keywords:["turkey","frozen turkey"] },
          { code:"0207.27", description:"Frozen turkey cuts", keywords:["turkey","frozen turkey pieces"] }
        ]}
      ]
    },
    { chapter:"03", title:"Fish, Crustaceans, Molluscs", section:"I", sectionTitle:"Live Animals; Animal Products",
      headings:[
        { code:"0302", description:"Fish, fresh or chilled (excluding fillets)", subheadings:[
          { code:"0302.11", description:"Trout, fresh/chilled", keywords:["trout","fresh fish"] },
          { code:"0302.85", description:"Tilapia, fresh/chilled", keywords:["tilapia","fresh fish","nile perch"] }
        ]},
        { code:"0303", description:"Fish, frozen (excluding fillets)", subheadings:[
          { code:"0303.13", description:"Atlantic salmon, frozen", keywords:["salmon","frozen fish"] },
          { code:"0303.89", description:"Other frozen fish", keywords:["frozen fish","mackerel","herring"] }
        ]},
        { code:"0304", description:"Fish fillets and other fish meat", subheadings:[
          { code:"0304.61", description:"Tilapia fillets, fresh/chilled", keywords:["tilapia fillet","fish fillet"] },
          { code:"0304.87", description:"Frozen fillets of other fish", keywords:["fish fillet","frozen fillet","hake","cod"] }
        ]},
        { code:"0306", description:"Crustaceans", subheadings:[
          { code:"0306.17", description:"Shrimps and prawns, frozen", keywords:["shrimp","prawn","seafood","frozen shrimp"] },
          { code:"0306.36", description:"Other shrimps and prawns", keywords:["shrimp","prawn"] }
        ]}
      ]
    },
    { chapter:"04", title:"Dairy Produce; Birds' Eggs; Honey", section:"I", sectionTitle:"Live Animals; Animal Products",
      headings:[
        { code:"0401", description:"Milk and cream, not concentrated", subheadings:[
          { code:"0401.10", description:"Milk fat ≤1%", keywords:["milk","fresh milk","skimmed milk"] },
          { code:"0401.20", description:"Milk fat 1–6%", keywords:["milk","whole milk","fresh milk"] },
          { code:"0401.40", description:"Milk fat >6%", keywords:["cream","milk","fresh cream"] }
        ]},
        { code:"0402", description:"Milk and cream, concentrated or sweetened", subheadings:[
          { code:"0402.10", description:"Milk powder, skimmed", keywords:["milk powder","skimmed milk powder","SMP","powdered milk"] },
          { code:"0402.21", description:"Whole milk powder", keywords:["milk powder","WMP","powdered milk","full cream milk powder"] },
          { code:"0402.91", description:"Condensed milk, unsweetened", keywords:["condensed milk","evaporated milk"] },
          { code:"0402.99", description:"Condensed milk, sweetened", keywords:["condensed milk","sweetened condensed milk","Peak milk","tin milk"] }
        ]},
        { code:"0406", description:"Cheese and curd", subheadings:[
          { code:"0406.10", description:"Fresh cheese", keywords:["cheese","fresh cheese","cottage cheese"] },
          { code:"0406.90", description:"Other cheese", keywords:["cheese","cheddar","gouda","mozzarella","processed cheese"] }
        ]},
        { code:"0407", description:"Birds' eggs, in shell", subheadings:[
          { code:"0407.11", description:"Fertilised poultry eggs", keywords:["eggs","hatching eggs","fertile eggs"] },
          { code:"0407.21", description:"Fresh poultry eggs", keywords:["eggs","chicken eggs","table eggs","fresh eggs"] }
        ]}
      ]
    },
    { chapter:"08", title:"Edible Fruit and Nuts; Citrus Peel", section:"II", sectionTitle:"Vegetable Products",
      headings:[
        { code:"0801", description:"Coconuts, Brazil nuts and cashew nuts", subheadings:[
          { code:"0801.11", description:"Desiccated coconut", keywords:["coconut","desiccated coconut","shredded coconut"] },
          { code:"0801.12", description:"Coconuts in inner shell", keywords:["coconut","fresh coconut"] },
          { code:"0801.31", description:"Cashew nuts, in shell", keywords:["cashew","cashew nuts","in shell"] },
          { code:"0801.32", description:"Cashew nuts, shelled", keywords:["cashew","cashew nuts","kernels","shelled cashew"] },
          { code:"0801.19", description:"Other coconuts", keywords:["coconut","coconut oil source"] }
        ]},
        { code:"0803", description:"Bananas and plantains", subheadings:[
          { code:"0803.10", description:"Plantains", keywords:["plantain","cooking banana","plantain banana"] },
          { code:"0803.90", description:"Bananas", keywords:["banana","fresh banana"] }
        ]},
        { code:"0804", description:"Dates, figs, pineapples, avocados, guavas, mangoes", subheadings:[
          { code:"0804.10", description:"Dates", keywords:["dates","fresh dates","dried dates"] },
          { code:"0804.30", description:"Pineapples", keywords:["pineapple","fresh pineapple"] },
          { code:"0804.40", description:"Avocados", keywords:["avocado","fresh avocado"] },
          { code:"0804.50", description:"Guavas, mangoes and mangosteens", keywords:["mango","guava","fresh mango","mangosteen"] }
        ]},
        { code:"0805", description:"Citrus fruit, fresh or dried", subheadings:[
          { code:"0805.10", description:"Oranges", keywords:["orange","fresh orange","citrus"] },
          { code:"0805.20", description:"Mandarins, clementines, tangerines", keywords:["mandarin","tangerine","clementine","citrus"] },
          { code:"0805.40", description:"Grapefruit", keywords:["grapefruit","citrus"] },
          { code:"0805.50", description:"Lemons and limes", keywords:["lemon","lime","citrus"] }
        ]},
        { code:"0901", description:"Coffee", subheadings:[
          { code:"0901.11", description:"Coffee, not roasted, not decaffeinated", keywords:["green coffee","raw coffee","coffee beans","arabica","robusta"] },
          { code:"0901.12", description:"Coffee, not roasted, decaffeinated", keywords:["decaf coffee","green decaf"] },
          { code:"0901.21", description:"Roasted coffee, not decaffeinated", keywords:["roasted coffee","coffee beans","ground coffee","coffee"] },
          { code:"0901.22", description:"Roasted coffee, decaffeinated", keywords:["decaf coffee","roasted decaf"] }
        ]}
      ]
    },
    { chapter:"09", title:"Coffee, Tea, Maté and Spices", section:"II", sectionTitle:"Vegetable Products",
      headings:[
        { code:"0902", description:"Tea", subheadings:[
          { code:"0902.10", description:"Green tea, not fermented, ≤3kg packs", keywords:["green tea","tea","loose tea"] },
          { code:"0902.20", description:"Green tea, not fermented, >3kg packs", keywords:["green tea","bulk tea","tea"] },
          { code:"0902.30", description:"Black tea (fermented) ≤3kg packs", keywords:["black tea","tea bags","Kenyan tea","Ceylon tea","tea"] },
          { code:"0902.40", description:"Other black tea and other partially fermented tea >3kg", keywords:["black tea","bulk tea","tea","Kenyan tea"] }
        ]},
        { code:"0904", description:"Pepper; dried/crushed capsicum", subheadings:[
          { code:"0904.11", description:"Pepper, neither crushed nor ground", keywords:["pepper","black pepper","white pepper","peppercorn","spice"] },
          { code:"0904.12", description:"Pepper, crushed or ground", keywords:["ground pepper","pepper powder","spice"] },
          { code:"0904.21", description:"Dried sweet pepper", keywords:["sweet pepper","paprika","dried chilli","spice"] },
          { code:"0904.22", description:"Crushed/ground capsicum", keywords:["chilli powder","cayenne","paprika","ground chilli","spice"] }
        ]},
        { code:"0910", description:"Ginger, saffron, turmeric, thyme, bay leaves, curry", subheadings:[
          { code:"0910.11", description:"Ginger, neither crushed nor ground", keywords:["ginger","fresh ginger","ginger root","spice"] },
          { code:"0910.12", description:"Ginger, crushed or ground", keywords:["ground ginger","ginger powder","spice"] },
          { code:"0910.30", description:"Turmeric (curcuma)", keywords:["turmeric","curcuma","spice","yellow powder"] },
          { code:"0910.91", description:"Mixtures of spices", keywords:["curry powder","mixed spice","spice blend","masala","suya spice"] }
        ]}
      ]
    },
    { chapter:"10", title:"Cereals", section:"II", sectionTitle:"Vegetable Products",
      headings:[
        { code:"1001", description:"Wheat and meslin", subheadings:[
          { code:"1001.11", description:"Durum wheat seed", keywords:["wheat","durum wheat","seed wheat"] },
          { code:"1001.19", description:"Other durum wheat", keywords:["wheat","durum","pasta wheat"] },
          { code:"1001.91", description:"Spelt and common wheat seed", keywords:["wheat seed","wheat","common wheat"] },
          { code:"1001.99", description:"Other wheat and meslin", keywords:["wheat","common wheat","flour wheat","bread wheat"] }
        ]},
        { code:"1005", description:"Maize (corn)", subheadings:[
          { code:"1005.10", description:"Maize seed", keywords:["maize seed","corn seed","seed maize"] },
          { code:"1005.90", description:"Other maize", keywords:["maize","corn","yellow maize","white maize","grain corn"] }
        ]},
        { code:"1006", description:"Rice", subheadings:[
          { code:"1006.10", description:"Rice in the husk (paddy or rough)", keywords:["paddy","rough rice","paddy rice","unhusked rice"] },
          { code:"1006.20", description:"Husked (brown) rice", keywords:["brown rice","husked rice","cargo rice"] },
          { code:"1006.30", description:"Semi-milled or wholly milled rice", keywords:["rice","white rice","milled rice","parboiled rice","long grain rice","basmati"] },
          { code:"1006.40", description:"Broken rice", keywords:["broken rice","rice","cheap rice"] }
        ]},
        { code:"1007", description:"Grain sorghum", subheadings:[
          { code:"1007.10", description:"Sorghum seed", keywords:["sorghum","guinea corn","milo"] },
          { code:"1007.90", description:"Other grain sorghum", keywords:["sorghum","guinea corn","dawa"] }
        ]}
      ]
    },
    { chapter:"15", title:"Animal or Vegetable Fats and Oils", section:"III", sectionTitle:"Animal or Vegetable Fats and Oils",
      headings:[
        { code:"1507", description:"Soya-bean oil", subheadings:[
          { code:"1507.10", description:"Crude soya-bean oil", keywords:["soybean oil","soya oil","crude oil"] },
          { code:"1507.90", description:"Other soya-bean oil", keywords:["soybean oil","refined soya oil","cooking oil"] }
        ]},
        { code:"1511", description:"Palm oil", subheadings:[
          { code:"1511.10", description:"Crude palm oil", keywords:["crude palm oil","CPO","palm oil"] },
          { code:"1511.90", description:"Other palm oil and fractions", keywords:["palm oil","refined palm oil","RBD palm oil","cooking oil","palm olein"] }
        ]},
        { code:"1512", description:"Sunflower, safflower or cotton seed oil", subheadings:[
          { code:"1512.11", description:"Crude sunflower/safflower oil", keywords:["sunflower oil","crude sunflower","sunflower seed oil"] },
          { code:"1512.19", description:"Other sunflower/safflower oil", keywords:["sunflower oil","refined sunflower oil","cooking oil","vegetable oil"] },
          { code:"1512.21", description:"Crude cotton seed oil", keywords:["cottonseed oil","crude cotton oil"] },
          { code:"1512.29", description:"Other cotton seed oil", keywords:["cottonseed oil","refined cotton oil"] }
        ]},
        { code:"1514", description:"Rapeseed, colza and mustard oil", subheadings:[
          { code:"1514.11", description:"Crude rapeseed oil", keywords:["rapeseed oil","canola oil","crude canola"] },
          { code:"1514.19", description:"Other rapeseed oil", keywords:["rapeseed oil","canola oil","cooking oil"] }
        ]},
        { code:"1516", description:"Hydrogenated animal/vegetable fats (margarine)", subheadings:[
          { code:"1516.20", description:"Vegetable fats and oils, hydrogenated", keywords:["margarine","shortening","hydrogenated oil","vegetable fat","Blue Band","Stork"] }
        ]}
      ]
    },
    { chapter:"17", title:"Sugars and Sugar Confectionery", section:"IV", sectionTitle:"Prepared Foodstuffs",
      headings:[
        { code:"1701", description:"Cane or beet sugar and chemically pure sucrose", subheadings:[
          { code:"1701.12", description:"Raw beet sugar", keywords:["raw sugar","beet sugar","white sugar"] },
          { code:"1701.13", description:"Cane sugar, raw, specified for refining", keywords:["raw cane sugar","raw sugar","refinery sugar"] },
          { code:"1701.14", description:"Other raw cane sugar", keywords:["raw sugar","cane sugar","brown sugar"] },
          { code:"1701.91", description:"Refined sugar with added flavouring", keywords:["flavoured sugar","vanilla sugar"] },
          { code:"1701.99", description:"Other refined sugar", keywords:["white sugar","refined sugar","table sugar","granulated sugar","sugar"] }
        ]},
        { code:"1704", description:"Sugar confectionery (not containing cocoa)", subheadings:[
          { code:"1704.10", description:"Chewing gum", keywords:["gum","chewing gum","bubble gum","Wrigley","Orbit"] },
          { code:"1704.90", description:"Other sugar confectionery", keywords:["candy","sweets","lollipop","toffee","boiled sweets","confectionery"] }
        ]}
      ]
    },
    { chapter:"18", title:"Cocoa and Cocoa Preparations", section:"IV", sectionTitle:"Prepared Foodstuffs",
      headings:[
        { code:"1801", description:"Cocoa beans, whole or broken", subheadings:[
          { code:"1801.00", description:"Cocoa beans", keywords:["cocoa beans","cacao","raw cocoa","cocoa"] }
        ]},
        { code:"1805", description:"Cocoa powder, not sweetened", subheadings:[
          { code:"1805.00", description:"Cocoa powder, unsweetened", keywords:["cocoa powder","cacao powder","baking cocoa"] }
        ]},
        { code:"1806", description:"Chocolate and other cocoa preparations", subheadings:[
          { code:"1806.10", description:"Cocoa powder with added sugar", keywords:["hot chocolate","cocoa mix","Milo","Ovaltine","Bournvita"] },
          { code:"1806.20", description:"Chocolate in blocks >2kg", keywords:["bulk chocolate","chocolate"] },
          { code:"1806.31", description:"Filled chocolate in ≤2kg packs", keywords:["chocolate","filled chocolate","praline","boxed chocolate"] },
          { code:"1806.32", description:"Other chocolate not in blocks", keywords:["chocolate bar","milk chocolate","dark chocolate","Kit Kat","Twix"] },
          { code:"1806.90", description:"Other cocoa preparations", keywords:["chocolate spread","Nutella","cocoa preparation"] }
        ]}
      ]
    },
    { chapter:"19", title:"Preparations of Cereals, Flour, Starch", section:"IV", sectionTitle:"Prepared Foodstuffs",
      headings:[
        { code:"1901", description:"Malt extract; food preparations of flour", subheadings:[
          { code:"1901.10", description:"Preparations for infant use", keywords:["baby food","infant formula","cerelac","baby cereal"] },
          { code:"1901.20", description:"Mixes and doughs for bread, cakes", keywords:["cake mix","baking mix","pancake mix","dough"] },
          { code:"1901.90", description:"Other food preparations of flour", keywords:["food preparation","cereal mix","flour mix"] }
        ]},
        { code:"1902", description:"Pasta", subheadings:[
          { code:"1902.11", description:"Uncooked pasta with eggs", keywords:["pasta","egg pasta","noodles"] },
          { code:"1902.19", description:"Other uncooked pasta", keywords:["pasta","spaghetti","macaroni","noodles","instant noodles"] },
          { code:"1902.30", description:"Other pasta", keywords:["pasta","cooked pasta"] },
          { code:"1902.40", description:"Couscous", keywords:["couscous"] }
        ]},
        { code:"1905", description:"Bread, pastry, cakes, biscuits", subheadings:[
          { code:"1905.10", description:"Crispbread", keywords:["crispbread","crackers","rye crackers"] },
          { code:"1905.20", description:"Gingerbread and the like", keywords:["gingerbread","spiced bread"] },
          { code:"1905.31", description:"Sweet biscuits", keywords:["biscuits","cookies","sweet biscuits","digestive","shortbread"] },
          { code:"1905.32", description:"Waffles and wafers", keywords:["wafer","waffles","wafer biscuit"] },
          { code:"1905.40", description:"Rusks and toasted bread", keywords:["rusk","toast","Melba toast"] },
          { code:"1905.90", description:"Other biscuits, bread and baked goods", keywords:["biscuits","crackers","pastry","bread","cake"] }
        ]}
      ]
    },
    { chapter:"22", title:"Beverages, Spirits and Vinegar", section:"IV", sectionTitle:"Prepared Foodstuffs",
      headings:[
        { code:"2201", description:"Waters (natural mineral, aerated, drinking)", subheadings:[
          { code:"2201.10", description:"Mineral waters and aerated waters", keywords:["mineral water","sparkling water","fizzy water","bottled water"] },
          { code:"2201.90", description:"Other drinking water", keywords:["drinking water","bottled water","still water"] }
        ]},
        { code:"2202", description:"Waters flavoured, sweetened; other non-alcoholic beverages", subheadings:[
          { code:"2202.10", description:"Waters with added sugar or sweeteners", keywords:["soft drink","soda","carbonated drink","cola","Coca-Cola","Pepsi","Fanta","sprite"] },
          { code:"2202.91", description:"Non-alcoholic beer", keywords:["non-alcoholic beer","alcohol-free beer","malt drink"] },
          { code:"2202.99", description:"Other non-alcoholic beverages", keywords:["energy drink","Red Bull","juice drink","sports drink"] }
        ]},
        { code:"2203", description:"Beer made from malt", subheadings:[
          { code:"2203.00", description:"Beer made from malt", keywords:["beer","lager","ale","stout","malt beer","Star beer","Heineken","Castle","Tusker"] }
        ]},
        { code:"2204", description:"Wine of fresh grapes", subheadings:[
          { code:"2204.10", description:"Sparkling wine", keywords:["sparkling wine","champagne","prosecco","cava"] },
          { code:"2204.21", description:"Other wine ≤2L containers", keywords:["wine","red wine","white wine","rose","table wine"] },
          { code:"2204.29", description:"Other wine >2L", keywords:["wine","bulk wine","bag in box wine"] }
        ]},
        { code:"2208", description:"Spirits and liqueurs", subheadings:[
          { code:"2208.20", description:"Spirits obtained by distilling grape wine", keywords:["brandy","cognac","grappa","spirits"] },
          { code:"2208.30", description:"Whiskies", keywords:["whisky","whiskey","Scotch","bourbon","spirits"] },
          { code:"2208.40", description:"Rum and other spirits from sugar cane", keywords:["rum","spirits","cane spirits"] },
          { code:"2208.60", description:"Vodka", keywords:["vodka","spirits"] },
          { code:"2208.70", description:"Liqueurs and cordials", keywords:["liqueur","cordial","spirits mix","Baileys"] },
          { code:"2208.90", description:"Other spirits (includes local spirits)", keywords:["gin","spirits","local gin","schnapps","ogogoro","konyagi","Uganda waragi"] }
        ]}
      ]
    },
    { chapter:"25", title:"Salt; Sulphur; Earths; Stone; Cement", section:"V", sectionTitle:"Mineral Products",
      headings:[
        { code:"2501", description:"Salt; pure sodium chloride; sea water", subheadings:[
          { code:"2501.00", description:"Salt, table salt, industrial salt", keywords:["salt","table salt","sea salt","sodium chloride","industrial salt"] }
        ]},
        { code:"2523", description:"Portland cement, aluminous cement, slag cement", subheadings:[
          { code:"2523.10", description:"Cement clinkers", keywords:["cement clinker","clinker"] },
          { code:"2523.21", description:"White cement", keywords:["white cement","cement"] },
          { code:"2523.29", description:"Other Portland cement", keywords:["cement","Portland cement","building materials","construction","OPC"] },
          { code:"2523.30", description:"Aluminous cement", keywords:["aluminous cement","high alumina cement"] },
          { code:"2523.90", description:"Other hydraulic cements", keywords:["cement","slag cement","mixed cement"] }
        ]}
      ]
    },
    { chapter:"27", title:"Mineral Fuels, Petroleum, Bitumen", section:"V", sectionTitle:"Mineral Products",
      headings:[
        { code:"2709", description:"Petroleum oils, crude", subheadings:[
          { code:"2709.00", description:"Crude petroleum oils", keywords:["crude oil","petroleum","oil","crude"] }
        ]},
        { code:"2710", description:"Petroleum oils, not crude", subheadings:[
          { code:"2710.12", description:"Light petroleum distillates (petrol/gasoline)", keywords:["petrol","gasoline","premium motor spirit","PMS","fuel","unleaded fuel"] },
          { code:"2710.19", description:"Other medium/heavy petroleum oils (diesel)", keywords:["diesel","AGO","automotive gas oil","fuel","diesel fuel"] },
          { code:"2710.20", description:"Petroleum oils containing biodiesel", keywords:["biodiesel","biofuel","diesel blend"] }
        ]},
        { code:"2711", description:"Petroleum gas and other gaseous hydrocarbons", subheadings:[
          { code:"2711.11", description:"Natural gas, liquefied", keywords:["LNG","natural gas","liquefied natural gas"] },
          { code:"2711.12", description:"Propane, liquefied", keywords:["LPG","propane","cooking gas","gas cylinder","bottled gas"] },
          { code:"2711.13", description:"Butane, liquefied", keywords:["LPG","butane","cooking gas","bottled gas"] },
          { code:"2711.19", description:"Other liquefied petroleum gas", keywords:["LPG","petroleum gas","cooking gas"] },
          { code:"2711.21", description:"Natural gas in gaseous state", keywords:["natural gas","CNG","compressed natural gas","piped gas"] }
        ]},
        { code:"2713", description:"Petroleum coke, petroleum bitumen", subheadings:[
          { code:"2713.20", description:"Petroleum bitumen", keywords:["bitumen","asphalt","road tar","tarmac material"] }
        ]}
      ]
    },
    { chapter:"30", title:"Pharmaceutical Products", section:"VI", sectionTitle:"Chemical Products",
      headings:[
        { code:"3002", description:"Blood, antisera, vaccines, toxins", subheadings:[
          { code:"3002.12", description:"Antisera and other blood fractions", keywords:["antisera","antibody","immunoglobulin","blood fraction"] },
          { code:"3002.20", description:"Vaccines for human medicine", keywords:["vaccine","immunisation","vaccination","anti-malaria","anti-COVID","measles vaccine"] },
          { code:"3002.30", description:"Vaccines for veterinary medicine", keywords:["veterinary vaccine","animal vaccine","livestock vaccine"] }
        ]},
        { code:"3003", description:"Medicaments (mixed), not in measured doses", subheadings:[
          { code:"3003.20", description:"Medicaments with antibiotics", keywords:["antibiotics","medicine","drug","amoxicillin","penicillin"] },
          { code:"3003.31", description:"Medicaments with insulin", keywords:["insulin","diabetes medicine","drug"] },
          { code:"3003.90", description:"Other medicaments, mixed", keywords:["medicine","drug","pharmaceutical","tablets","pills"] }
        ]},
        { code:"3004", description:"Medicaments in measured doses (retail)", subheadings:[
          { code:"3004.10", description:"Penicillin antibiotics, retail packs", keywords:["penicillin","amoxicillin","antibiotic","medicine","drugs"] },
          { code:"3004.20", description:"Other antibiotic medicaments, retail", keywords:["antibiotics","ciprofloxacin","tetracycline","medicine","drugs"] },
          { code:"3004.32", description:"Insulin medicaments, retail", keywords:["insulin","diabetes","medicine"] },
          { code:"3004.41", description:"Alkaloid or derivative medicaments (excl. antibiotics)", keywords:["morphine","codeine","quinine","alkaloid","malaria drug","antimalarial","Coartem"] },
          { code:"3004.50", description:"Vitamin medicaments, retail", keywords:["vitamins","vitamin C","multivitamin","supplement","medicine"] },
          { code:"3004.90", description:"Other medicaments, retail packs", keywords:["medicine","drugs","paracetamol","ibuprofen","aspirin","OTC drugs","pharmaceutical"] }
        ]}
      ]
    },
    { chapter:"31", title:"Fertilisers", section:"VI", sectionTitle:"Chemical Products",
      headings:[
        { code:"3102", description:"Mineral or chemical fertilisers, nitrogenous", subheadings:[
          { code:"3102.10", description:"Urea", keywords:["urea","nitrogen fertiliser","fertilizer","NPK","urea fertilizer"] },
          { code:"3102.21", description:"Ammonium sulphate", keywords:["ammonium sulphate","sulphate of ammonia","fertilizer","fertiliser"] },
          { code:"3102.30", description:"Ammonium nitrate", keywords:["ammonium nitrate","AN fertilizer","fertilizer","fertiliser"] }
        ]},
        { code:"3105", description:"Mineral or chemical fertilisers, NPK", subheadings:[
          { code:"3105.20", description:"NPK fertilisers", keywords:["NPK","fertilizer","fertiliser","compound fertilizer","15-15-15","20-10-10"] }
        ]}
      ]
    },
    { chapter:"33", title:"Essential Oils; Cosmetics; Perfumery", section:"VI", sectionTitle:"Chemical Products",
      headings:[
        { code:"3301", description:"Essential oils", subheadings:[
          { code:"3301.12", description:"Orange essential oil", keywords:["orange oil","essential oil","fragrance"] },
          { code:"3301.29", description:"Other essential oils", keywords:["essential oil","lavender oil","eucalyptus oil","tea tree oil","fragrance oil"] }
        ]},
        { code:"3303", description:"Perfumes and toilet waters", subheadings:[
          { code:"3303.00", description:"Perfumes and toilet waters (eau de toilette)", keywords:["perfume","cologne","fragrance","eau de parfum","EDT","EDP","body spray","deodorant spray"] }
        ]},
        { code:"3304", description:"Beauty/make-up preparations and skin care", subheadings:[
          { code:"3304.10", description:"Lip make-up preparations", keywords:["lipstick","lip gloss","lip liner","make-up","cosmetics","beauty"] },
          { code:"3304.20", description:"Eye make-up preparations", keywords:["mascara","eye shadow","eyeliner","eye make-up","cosmetics","beauty"] },
          { code:"3304.30", description:"Manicure/pedicure preparations", keywords:["nail polish","nail varnish","manicure","pedicure","nail care"] },
          { code:"3304.91", description:"Powders for body/face", keywords:["face powder","body powder","foundation","compact powder","beauty","cosmetics"] },
          { code:"3304.99", description:"Other beauty preparations and skin care", keywords:["skin cream","moisturiser","lotion","face cream","body lotion","shea butter","fair and lovely","Dove","Nivea","cosmetics","skincare"] }
        ]},
        { code:"3305", description:"Preparations for use on the hair", subheadings:[
          { code:"3305.10", description:"Shampoos", keywords:["shampoo","hair wash","hair cleanser","Pantene","Head and Shoulders"] },
          { code:"3305.20", description:"Preparations for permanent waving/straightening", keywords:["relaxer","perm","hair relaxer","texturiser","Dark and Lovely","Just for Me"] },
          { code:"3305.30", description:"Hair lacquers (hairspray)", keywords:["hairspray","hair lacquer","styling spray"] },
          { code:"3305.90", description:"Other hair preparations", keywords:["hair conditioner","hair oil","hair cream","hair gel","hair treatment","wig care","hair care","weave","extensions"] }
        ]},
        { code:"3307", description:"Shaving, body odour and deodorant preparations", subheadings:[
          { code:"3307.10", description:"Shaving preparations", keywords:["shaving cream","shaving gel","shaving foam","aftershave"] },
          { code:"3307.20", description:"Personal deodorants and antiperspirants", keywords:["deodorant","antiperspirant","roll-on","body spray","Sure","Rexona","Degree"] }
        ]}
      ]
    },
    { chapter:"39", title:"Plastics and Articles Thereof", section:"VII", sectionTitle:"Plastics and Rubber",
      headings:[
        { code:"3923", description:"Articles of plastics for packing of goods", subheadings:[
          { code:"3923.10", description:"Boxes, cases, crates of plastics", keywords:["plastic box","plastic crate","plastic case","packaging","container"] },
          { code:"3923.21", description:"Sacks and bags of polymers of ethylene", keywords:["polythene bag","plastic bag","polyethylene bag","shopping bag","carrier bag","nylon bag","cellophane"] },
          { code:"3923.29", description:"Sacks and bags of other plastics", keywords:["plastic bag","sack","sachet","polypropylene bag","PP bag"] },
          { code:"3923.30", description:"Carboys, bottles, flasks of plastics", keywords:["plastic bottle","PET bottle","water bottle","plastic container","jerry can"] },
          { code:"3923.90", description:"Other packing articles of plastics", keywords:["plastic packaging","container","cap","lid","closure"] }
        ]}
      ]
    },
    { chapter:"52", title:"Cotton", section:"XI", sectionTitle:"Textiles",
      headings:[
        { code:"5201", description:"Cotton, not carded or combed", subheadings:[
          { code:"5201.00", description:"Cotton, raw (lint)", keywords:["raw cotton","cotton lint","seed cotton","cotton fibre","cotton"] }
        ]},
        { code:"5209", description:"Woven fabrics of cotton, ≥85%, >200g/m²", subheadings:[
          { code:"5209.11", description:"Unbleached plain weave cotton", keywords:["cotton fabric","grey fabric","grey cloth","cotton textile"] },
          { code:"5209.51", description:"Printed plain weave cotton fabric", keywords:["printed cotton","fabric","Ankara","African print","wax print","Kente","cotton fabric"] }
        ]}
      ]
    },
    { chapter:"61", title:"Articles of Apparel, Knitted or Crocheted", section:"XI", sectionTitle:"Textiles",
      headings:[
        { code:"6101", description:"Men's overcoats, anoraks (knitted)", subheadings:[
          { code:"6101.20", description:"Men's overcoats of cotton (knitted)", keywords:["men coat","jacket","overcoat","clothing","apparel"] },
          { code:"6101.30", description:"Men's overcoats of man-made fibres (knitted)", keywords:["men jacket","coat","polyester jacket","clothing"] }
        ]},
        { code:"6105", description:"Men's shirts, knitted or crocheted", subheadings:[
          { code:"6105.10", description:"Men's cotton shirts, knitted", keywords:["men shirt","t-shirt","polo shirt","cotton shirt","top","men clothing"] },
          { code:"6105.20", description:"Men's shirts of man-made fibres, knitted", keywords:["men shirt","polyester shirt","synthetic shirt","top","men clothing"] }
        ]},
        { code:"6109", description:"T-shirts, singlets and other vests (knitted)", subheadings:[
          { code:"6109.10", description:"T-shirts of cotton", keywords:["t-shirt","tee shirt","cotton t-shirt","vest","singlet","clothing","tops"] },
          { code:"6109.90", description:"T-shirts of other fibres", keywords:["t-shirt","polyester shirt","synthetic top","clothing"] }
        ]},
        { code:"6110", description:"Jerseys, pullovers, sweatshirts (knitted)", subheadings:[
          { code:"6110.20", description:"Jerseys, pullovers of cotton", keywords:["jumper","sweater","pullover","sweatshirt","hoodie","cotton jumper","clothing"] },
          { code:"6110.30", description:"Jerseys, pullovers of man-made fibres", keywords:["hoodie","sweatshirt","polyester top","sports jersey","jersey","clothing"] }
        ]}
      ]
    },
    { chapter:"62", title:"Articles of Apparel, Not Knitted or Crocheted", section:"XI", sectionTitle:"Textiles",
      headings:[
        { code:"6201", description:"Men's overcoats, cloaks, anoraks, etc. (woven)", subheadings:[
          { code:"6201.11", description:"Men's overcoats of wool (woven)", keywords:["men coat","wool coat","overcoat","woven clothing"] },
          { code:"6201.13", description:"Men's overcoats of man-made fibres", keywords:["men coat","windbreaker","jacket","woven clothing"] },
          { code:"6201.91", description:"Men's anoraks of cotton", keywords:["anorak","men jacket","cotton jacket","clothing"] }
        ]},
        { code:"6203", description:"Men's suits, ensembles, jackets, trousers (woven)", subheadings:[
          { code:"6203.11", description:"Men's suits of wool", keywords:["men suit","suit","wool suit","formal wear","clothing"] },
          { code:"6203.19", description:"Men's suits of other fibres", keywords:["men suit","suit","formal wear","clothing"] },
          { code:"6203.41", description:"Men's trousers of wool", keywords:["trousers","slacks","men pants","clothing"] },
          { code:"6203.42", description:"Men's trousers of cotton", keywords:["trousers","chinos","jeans","cotton trousers","men pants","clothing","jeans","denim"] },
          { code:"6203.43", description:"Men's trousers of synthetic fibres", keywords:["trousers","men pants","polyester trousers","clothing"] }
        ]},
        { code:"6211", description:"Track suits, ski suits, swimwear (woven)", subheadings:[
          { code:"6211.11", description:"Men's swimwear", keywords:["swimwear","swimsuit","swim shorts","clothing","sportswear"] },
          { code:"6211.32", description:"Other garments of cotton (woven)", keywords:["clothing","uniform","workwear","cotton garment","woven clothing","second hand clothing","used clothing","mitumba","okrika","bale"] },
          { code:"6211.33", description:"Other garments of man-made fibres (woven)", keywords:["clothing","sportswear","tracksuit","uniform","workwear","synthetic clothing","second hand","mitumba","bale"] }
        ]}
      ]
    },
    { chapter:"63", title:"Other Made-Up Textile Articles", section:"XI", sectionTitle:"Textiles",
      headings:[
        { code:"6304", description:"Bed linen, curtains, other furnishing articles", subheadings:[
          { code:"6304.11", description:"Bed nets, mosquito nets", keywords:["mosquito net","bed net","malaria net","insecticide treated net","ITN"] },
          { code:"6304.91", description:"Other furnishing articles, knitted", keywords:["curtain","furnishing","home textile","bed cover"] },
          { code:"6304.99", description:"Other furnishing articles, woven", keywords:["curtain","furnishing","home textile","tablecloth"] }
        ]},
        { code:"6309", description:"Worn clothing and worn textile articles", subheadings:[
          { code:"6309.00", description:"Worn clothing, used textiles (secondhand)", keywords:["secondhand clothing","used clothing","mitumba","okrika","bale","thrift","okirika","fankase","bend down select","used clothes"] }
        ]}
      ]
    },
    { chapter:"64", title:"Footwear", section:"XII", sectionTitle:"Footwear, Headgear",
      headings:[
        { code:"6401", description:"Waterproof footwear with outer soles and uppers of rubber or plastics", subheadings:[
          { code:"6401.92", description:"Waterproof footwear covering the ankle", keywords:["rubber boots","wellies","wellington boots","rain boots","waterproof shoes"] }
        ]},
        { code:"6402", description:"Other footwear with outer soles and uppers of rubber or plastics", subheadings:[
          { code:"6402.19", description:"Sports footwear", keywords:["sneakers","trainers","sports shoes","running shoes","Nike","Adidas","Puma","athletic shoes"] },
          { code:"6402.91", description:"Footwear covering ankle, rubber/plastics", keywords:["shoes","boots","ankle boots"] },
          { code:"6402.99", description:"Other footwear, rubber/plastics", keywords:["shoes","sandals","flip flops","slippers","rubber shoes"] }
        ]},
        { code:"6403", description:"Footwear with outer soles of rubber/plastics/leather, uppers of leather", subheadings:[
          { code:"6403.51", description:"Footwear with metal toecap, leather upper", keywords:["safety boots","steel toe boots","work boots","safety shoes"] },
          { code:"6403.91", description:"Other leather footwear, covering ankle", keywords:["leather shoes","leather boots","formal shoes","dress shoes","men shoes"] },
          { code:"6403.99", description:"Other leather footwear", keywords:["leather shoes","loafers","moccasins","pumps","women shoes","flat shoes","heels"] }
        ]}
      ]
    },
    { chapter:"72", title:"Iron and Steel", section:"XV", sectionTitle:"Base Metals",
      headings:[
        { code:"7206", description:"Iron and non-alloy steel in ingots or other primary forms", subheadings:[
          { code:"7206.10", description:"Iron ingots", keywords:["iron ingot","steel ingot","primary steel","billet"] }
        ]},
        { code:"7213", description:"Bars and rods of iron/steel, hot-rolled, in coils", subheadings:[
          { code:"7213.10", description:"Bars/rods with indentations (deformed bars)", keywords:["rebar","deformed bar","iron rod","reinforcement bar","steel rod","Y12","Y16","construction steel"] },
          { code:"7213.91", description:"Other bars/rods, circular cross-section <14mm", keywords:["steel rod","mild steel","round bar","binding wire"] },
          { code:"7213.99", description:"Other bars and rods in coils", keywords:["steel rod","coil","wire rod","steel wire"] }
        ]},
        { code:"7214", description:"Bars and rods of iron/steel, not in coils", subheadings:[
          { code:"7214.20", description:"Bars with indentations/ribs, not in coils", keywords:["rebar","deformed bar","iron rod","high yield rebar","HYD bar","construction steel","building material"] },
          { code:"7214.99", description:"Other bars and rods", keywords:["flat bar","steel bar","structural steel"] }
        ]},
        { code:"7216", description:"Angles, shapes and sections of iron or steel", subheadings:[
          { code:"7216.10", description:"U, I or H sections <80mm", keywords:["I-beam","H-beam","channel","angle iron","steel section","structural steel"] },
          { code:"7216.31", description:"U sections ≥80mm", keywords:["channel","steel channel","structural steel","construction"] },
          { code:"7216.33", description:"H sections ≥80mm", keywords:["H-beam","steel beam","structural steel","construction","column"] },
          { code:"7216.50", description:"Angles, shapes and sections from flat-rolled products", keywords:["angle iron","steel angle","structural steel","equal angle","unequal angle"] }
        ]},
        { code:"7217", description:"Wire of iron or non-alloy steel", subheadings:[
          { code:"7217.10", description:"Wire, not plated", keywords:["wire","steel wire","binding wire","tie wire","plain wire"] },
          { code:"7217.20", description:"Wire, plated or coated with zinc", keywords:["galvanized wire","GI wire","fencing wire","barbed wire"] },
          { code:"7217.30", description:"Wire, plated or coated with base metals", keywords:["wire","galvanized","coated wire"] }
        ]}
      ]
    },
    { chapter:"73", title:"Articles of Iron or Steel", section:"XV", sectionTitle:"Base Metals",
      headings:[
        { code:"7308", description:"Structures and parts thereof of iron or steel", subheadings:[
          { code:"7308.10", description:"Bridges and bridge-sections", keywords:["bridge","steel bridge","structural steel"] },
          { code:"7308.90", description:"Other structures of iron or steel", keywords:["steel structure","frame","column","beam","building structure","prefab","steel building"] }
        ]},
        { code:"7312", description:"Stranded wire, ropes, cables of iron or steel", subheadings:[
          { code:"7312.10", description:"Stranded wire, ropes, cables", keywords:["steel cable","wire rope","stranded wire","crane cable","lift cable"] }
        ]},
        { code:"7313", description:"Barbed wire and fencing of iron or steel", subheadings:[
          { code:"7313.00", description:"Barbed wire and similar wire (fencing)", keywords:["barbed wire","fencing wire","razor wire","fence wire","security fence","concertina wire"] }
        ]},
        { code:"7317", description:"Nails, tacks, drawing pins of iron or steel", subheadings:[
          { code:"7317.00", description:"Nails, tacks, staples, pins of iron or steel", keywords:["nails","steel nails","tacks","staples","construction nails","common nails"] }
        ]},
        { code:"7318", description:"Screws, bolts, nuts, washers of iron or steel", subheadings:[
          { code:"7318.15", description:"Other screws and bolts of iron or steel", keywords:["screws","bolts","fasteners","anchor bolts","machine screws","coach bolts"] },
          { code:"7318.16", description:"Nuts of iron or steel", keywords:["nuts","hex nut","wing nut","fasteners"] }
        ]},
        { code:"7326", description:"Other articles of iron or steel", subheadings:[
          { code:"7326.90", description:"Other articles of iron or steel", keywords:["iron sheet","steel sheet","roofing sheet","iron pan","steel article","corrugated iron","zinc roof"] }
        ]}
      ]
    },
    { chapter:"84", title:"Nuclear Reactors, Boilers, Machinery", section:"XVI", sectionTitle:"Machinery and Electrical",
      headings:[
        { code:"8413", description:"Pumps for liquids", subheadings:[
          { code:"8413.11", description:"Pumps for dispensing fuel at service stations", keywords:["fuel pump","petrol pump","filling station pump","dispenser pump"] },
          { code:"8413.70", description:"Other centrifugal pumps", keywords:["water pump","centrifugal pump","pump","borehole pump","submersible pump"] },
          { code:"8413.91", description:"Parts of pumps for liquids", keywords:["pump parts","impeller","pump repair"] }
        ]},
        { code:"8415", description:"Air conditioning machines", subheadings:[
          { code:"8415.10", description:"Window/wall type air conditioners", keywords:["air conditioner","AC unit","window AC","split AC","window air con","A/C"] },
          { code:"8415.20", description:"Air conditioning of a kind used in motor vehicles", keywords:["car AC","vehicle air conditioning","auto AC"] },
          { code:"8415.81", description:"Other air conditioning, split systems", keywords:["split unit","split AC","air conditioner","inverter AC","mini split","AC","air con"] },
          { code:"8415.82", description:"Other air conditioning multi-split systems", keywords:["multi-split","cassette AC","air conditioner","HVAC"] }
        ]},
        { code:"8422", description:"Dishwashers; filling and sealing machines", subheadings:[
          { code:"8422.11", description:"Dishwashing machines for domestic use", keywords:["dishwasher","domestic dishwasher"] }
        ]},
        { code:"8450", description:"Household washing machines", subheadings:[
          { code:"8450.11", description:"Fully automatic washing machines ≤10kg", keywords:["washing machine","laundry machine","automatic washing machine","front loader","top loader","clothes washer"] },
          { code:"8450.12", description:"Washing machines with dryer ≤10kg", keywords:["washer dryer","washing machine","combo washer"] },
          { code:"8450.19", description:"Other washing machines", keywords:["washing machine","industrial washing machine","laundry machine"] }
        ]},
        { code:"8471", description:"Automatic data processing machines (computers)", subheadings:[
          { code:"8471.30", description:"Portable digital automatic data processing machines (laptops)", keywords:["laptop","notebook","MacBook","Dell","HP","Lenovo","computer","portable computer","chromebook"] },
          { code:"8471.41", description:"Other computing machines with CPU", keywords:["desktop computer","PC","computer","all-in-one PC","workstation"] },
          { code:"8471.50", description:"Processing units other than those of 8471.41/49", keywords:["CPU","processor","computing unit","server"] },
          { code:"8471.60", description:"Input/output units", keywords:["monitor","keyboard","mouse","input device","computer peripheral"] },
          { code:"8471.70", description:"Data storage units (hard drives, SSDs)", keywords:["hard drive","HDD","SSD","storage","USB drive","flash drive","external hard drive"] }
        ]},
        { code:"8473", description:"Parts and accessories for computing machines", subheadings:[
          { code:"8473.30", description:"Parts for computing machines", keywords:["computer parts","RAM","motherboard","graphics card","computer accessories"] }
        ]},
        { code:"8481", description:"Valves, cocks and similar appliances for pipes", subheadings:[
          { code:"8481.20", description:"Valves for oleohydraulic or pneumatic transmissions", keywords:["hydraulic valve","pneumatic valve","control valve"] },
          { code:"8481.80", description:"Other valves, taps, cocks", keywords:["valve","tap","cock","ball valve","gate valve","check valve","water tap"] }
        ]},
        { code:"8502", description:"Electric generating sets", subheadings:[
          { code:"8502.11", description:"Generating sets with compression-ignition internal combustion piston engines ≤75kVA", keywords:["generator","diesel generator","genset","backup generator","small generator","power plant"] },
          { code:"8502.12", description:"Generating sets ≤375kVA", keywords:["generator","diesel generator","genset","industrial generator","power generator"] },
          { code:"8502.13", description:"Generating sets >375kVA", keywords:["generator","large generator","power plant","industrial genset"] },
          { code:"8502.20", description:"Generating sets with spark-ignition internal combustion piston engines", keywords:["petrol generator","gasoline generator","portable generator","Honda generator","inverter generator"] }
        ]}
      ]
    },
    { chapter:"85", title:"Electrical Machinery and Equipment", section:"XVI", sectionTitle:"Machinery and Electrical",
      headings:[
        { code:"8504", description:"Electrical transformers, static converters, inductors", subheadings:[
          { code:"8504.21", description:"Liquid dielectric transformers ≤650kVA", keywords:["transformer","power transformer","distribution transformer","step down"] },
          { code:"8504.40", description:"Static converters (inverters, rectifiers, chargers)", keywords:["inverter","power inverter","UPS","battery charger","rectifier","solar inverter","off-grid inverter","Luminous","Microtek","Felicity"] },
          { code:"8504.50", description:"Other inductors", keywords:["inductor","choke","ballast"] }
        ]},
        { code:"8507", description:"Electric accumulators (batteries)", subheadings:[
          { code:"8507.10", description:"Lead-acid batteries for starting piston engines (car batteries)", keywords:["car battery","lead acid battery","battery","automotive battery","starting battery","12V battery"] },
          { code:"8507.20", description:"Other lead-acid batteries", keywords:["battery","deep cycle battery","UPS battery","solar battery","lead acid battery","inverter battery"] },
          { code:"8507.60", description:"Lithium-ion batteries", keywords:["lithium battery","li-ion battery","lithium ion","battery","phone battery","laptop battery","EV battery","power bank battery"] },
          { code:"8507.80", description:"Other electric accumulators", keywords:["battery","accumulator","NiMH battery","rechargeable battery"] }
        ]},
        { code:"8516", description:"Electric water heaters, hair dryers, flat irons", subheadings:[
          { code:"8516.10", description:"Electric instantaneous or storage water heaters", keywords:["water heater","geyser","electric water heater","instant water heater","shower heater","boiler"] },
          { code:"8516.31", description:"Hairdryers", keywords:["hairdryer","hair dryer","hair styling","blow dryer"] },
          { code:"8516.40", description:"Electric smoothing irons", keywords:["iron","clothes iron","steam iron","electric iron","pressing iron"] },
          { code:"8516.50", description:"Microwave ovens", keywords:["microwave","microwave oven","microwave cooker"] },
          { code:"8516.60", description:"Other ovens, cookers, cooking plates, grills", keywords:["electric cooker","electric oven","hotplate","induction cooker","air fryer","toaster oven"] },
          { code:"8516.72", description:"Toasters", keywords:["toaster","bread toaster","sandwich toaster"] }
        ]},
        { code:"8517", description:"Telephone sets; smartphones; routers", subheadings:[
          { code:"8517.11", description:"Line telephone sets with cordless handsets", keywords:["telephone","landline","cordless phone","DECT phone"] },
          { code:"8517.12", description:"Telephones for cellular/wireless networks (smartphones)", keywords:["smartphone","mobile phone","cell phone","iPhone","Samsung","Tecno","Itel","Infinix","Android phone","handset","feature phone","4G phone","5G phone"] },
          { code:"8517.13", description:"Smartphones", keywords:["smartphone","iPhone","Samsung Galaxy","Android","5G smartphone","Apple phone"] },
          { code:"8517.62", description:"Routers, network switches", keywords:["router","wifi router","network switch","hub","LAN equipment","broadband router"] },
          { code:"8517.69", description:"Other apparatus for transmission/reception of data", keywords:["router","access point","wifi","network equipment","modem","4G router","5G router"] }
        ]},
        { code:"8518", description:"Microphones, loudspeakers, headphones, amplifiers", subheadings:[
          { code:"8518.21", description:"Single loudspeakers in enclosures", keywords:["speaker","loudspeaker","bluetooth speaker","portable speaker","sound system"] },
          { code:"8518.30", description:"Headphones, earphones and combined headsets", keywords:["headphones","earphones","earbuds","AirPods","TWS earbuds","headset","wireless earbuds"] },
          { code:"8518.40", description:"Audio-frequency electric amplifiers", keywords:["amplifier","audio amp","car amplifier","power amplifier"] },
          { code:"8518.50", description:"Electric sound amplifier sets", keywords:["sound system","PA system","speaker system","sound bar"] }
        ]},
        { code:"8519", description:"Sound recording/reproducing apparatus", subheadings:[
          { code:"8519.81", description:"Other sound reproducing apparatus", keywords:["speaker","bluetooth speaker","MP3 player","sound device"] }
        ]},
        { code:"8523", description:"Discs, tapes, solid-state storage devices", subheadings:[
          { code:"8523.51", description:"Solid-state non-volatile storage (USB flash drives)", keywords:["USB drive","flash drive","memory stick","pen drive","thumb drive"] },
          { code:"8523.52", description:"Smart cards", keywords:["smart card","SIM card","chip card","NFC card"] },
          { code:"8523.59", description:"Other solid-state storage", keywords:["SSD","memory card","SD card","MicroSD","storage card"] }
        ]},
        { code:"8525", description:"Transmission apparatus for radio/TV; cameras", subheadings:[
          { code:"8525.81", description:"Television cameras (broadcast quality)", keywords:["TV camera","broadcast camera","professional camera","studio camera"] },
          { code:"8525.89", description:"Other cameras and video cameras", keywords:["camera","digital camera","DSLR","mirrorless camera","video camera","camcorder","action camera","GoPro","Canon","Nikon","Sony"] }
        ]},
        { code:"8527", description:"Reception apparatus for radio-broadcasting", subheadings:[
          { code:"8527.13", description:"Radio-broadcast receivers combined with sound recording/reproducing apparatus", keywords:["radio","radio cassette","radio player"] },
          { code:"8527.91", description:"Other radio receivers for motor vehicles", keywords:["car radio","car stereo","head unit","radio"] }
        ]},
        { code:"8528", description:"Monitors and projectors; television reception apparatus", subheadings:[
          { code:"8528.52", description:"Monitors capable of displaying signals from ADP machines", keywords:["computer monitor","PC monitor","display screen","LED monitor","LCD monitor"] },
          { code:"8528.72", description:"Colour television reception apparatus (TVs)", keywords:["TV","television","smart TV","LED TV","flat screen","LCD TV","OLED TV","Samsung TV","LG TV","Hisense"] }
        ]},
        { code:"8541", description:"Semiconductor devices; photovoltaic cells", subheadings:[
          { code:"8541.40", description:"Photovoltaic cells (solar cells)", keywords:["solar cell","solar panel","photovoltaic","PV panel","solar module","solar energy","renewable energy"] },
          { code:"8541.49", description:"Modules and panels of photovoltaic cells", keywords:["solar panel","solar module","PV panel","solar energy","solar power","250W solar","300W solar","400W solar"] }
        ]},
        { code:"8544", description:"Insulated wire, cable and other conductors", subheadings:[
          { code:"8544.11", description:"Winding wire of copper", keywords:["copper wire","winding wire","magnet wire","enamelled wire"] },
          { code:"8544.42", description:"Electric conductors fitted with connectors (USB cables, phone chargers)", keywords:["USB cable","phone charger","charging cable","Lightning cable","Type-C cable","data cable","power cable","charger"] },
          { code:"8544.49", description:"Other electric conductors for voltage ≤1000V", keywords:["electric cable","cable","wire","electrical wire","power cable","flexible cable","NYY cable","SWA cable"] },
          { code:"8544.60", description:"Electric conductors for voltage >1000V", keywords:["high voltage cable","power cable","HV cable","transmission cable","overhead cable"] }
        ]}
      ]
    },
    { chapter:"87", title:"Vehicles (Not Railway)", section:"XVII", sectionTitle:"Transport",
      headings:[
        { code:"8701", description:"Tractors", subheadings:[
          { code:"8701.10", description:"Pedestrian controlled tractors", keywords:["mini tractor","walk-behind tractor","two-wheel tractor","hand tractor","agricultural tractor"] },
          { code:"8701.93", description:"Tractors with engine >75kW ≤130kW (medium)", keywords:["tractor","farm tractor","agricultural tractor","John Deere","Massey Ferguson"] },
          { code:"8701.95", description:"Tractors with engine >130kW", keywords:["tractor","large tractor","farm tractor","heavy tractor"] }
        ]},
        { code:"8702", description:"Motor vehicles for transport of ≥10 persons (buses)", subheadings:[
          { code:"8702.10", description:"Buses with compression-ignition engine (diesel buses)", keywords:["bus","diesel bus","minibus","coach","public transport","commercial bus","Coaster bus","Hiace bus"] },
          { code:"8702.20", description:"Buses with spark-ignition internal combustion engine", keywords:["bus","petrol bus","minibus"] },
          { code:"8702.40", description:"Electric buses", keywords:["electric bus","EV bus","e-bus","electric vehicle"] }
        ]},
        { code:"8703", description:"Motor cars and other vehicles principally for passenger transport", subheadings:[
          { code:"8703.10", description:"Vehicles for snow, golf cars and similar", keywords:["golf cart","golf car","special vehicle"] },
          { code:"8703.21", description:"Petrol engine cars ≤1000cc", keywords:["small car","1000cc car","mini car","city car","Suzuki Alto","Daihatsu","entry car"] },
          { code:"8703.22", description:"Petrol engine cars 1000cc–1500cc", keywords:["car","sedan","1.0","1.2","1.4","1.5 litre","Toyota Corolla","Honda Fit","Kia Picanto","Hyundai i10","passenger car","used car"] },
          { code:"8703.23", description:"Petrol engine cars 1500cc–3000cc", keywords:["car","sedan","SUV","1.6","2.0","2.4","2.5","Toyota Camry","Honda Accord","Mazda","Hyundai","VW","BMW","Mercedes","passenger car"] },
          { code:"8703.24", description:"Petrol engine cars >3000cc", keywords:["luxury car","V6","V8","3.0 litre","4.0","5.0","BMW 7 Series","Mercedes S-Class","Range Rover","Porsche","Lexus","large engine car"] },
          { code:"8703.31", description:"Diesel engine cars ≤1500cc", keywords:["diesel car","small diesel car","diesel sedan","compact diesel"] },
          { code:"8703.32", description:"Diesel engine cars 1500cc–2500cc", keywords:["diesel car","diesel SUV","Toyota Land Cruiser diesel","Prado diesel","RAV4 diesel","VW Passat diesel"] },
          { code:"8703.40", description:"Vehicles with both piston engine and electric motor (hybrid)", keywords:["hybrid car","Toyota Prius","hybrid","petrol electric","mild hybrid","full hybrid","HEV"] },
          { code:"8703.80", description:"Other vehicles with electric motor only (EV)", keywords:["electric car","EV","Tesla","electric vehicle","battery electric","BEV","Nissan Leaf"] }
        ]},
        { code:"8704", description:"Motor vehicles for transport of goods (trucks)", subheadings:[
          { code:"8704.10", description:"Dumpers for off-highway use", keywords:["dumper","tipper","dump truck","off-road tipper","quarry truck"] },
          { code:"8704.21", description:"GVW ≤5 tonnes diesel goods vehicles", keywords:["pickup truck","small truck","delivery van","cargo van","light truck","Nissan Navara","Toyota Hilux pickup"] },
          { code:"8704.22", description:"GVW >5 tonnes ≤20 tonnes diesel goods vehicles", keywords:["medium truck","lorry","cargo truck","delivery truck","5-tonne truck","10-tonne truck"] },
          { code:"8704.23", description:"GVW >20 tonnes diesel goods vehicles", keywords:["heavy truck","articulated truck","18-wheeler","semi-truck","trailer truck","Volvo truck","MAN truck","Mercedes Actros"] },
          { code:"8704.31", description:"GVW ≤5 tonnes petrol goods vehicles", keywords:["pickup","van","light goods vehicle","petrol pickup"] }
        ]},
        { code:"8711", description:"Motorcycles (including mopeds)", subheadings:[
          { code:"8711.20", description:"Motorcycles with engine 50cc–250cc", keywords:["motorcycle","motorbike","bodaboda","okada","125cc","250cc","TVS","Bajaj","Honda motorcycle","Hero"] },
          { code:"8711.30", description:"Motorcycles with engine 250cc–500cc", keywords:["motorcycle","motorbike","250cc","500cc","boda boda"] },
          { code:"8711.40", description:"Motorcycles with engine 500cc–800cc", keywords:["motorcycle","motorbike","500cc","650cc","750cc","Yamaha","Kawasaki","Suzuki"] },
          { code:"8711.60", description:"Motorcycles with electric motor", keywords:["electric motorcycle","e-bike","electric motorbike","EV motorcycle"] }
        ]},
        { code:"8714", description:"Parts and accessories for motorcycles", subheadings:[
          { code:"8714.10", description:"Parts and accessories for motorcycles", keywords:["motorcycle parts","motorbike parts","tyre","sprocket","chain","brake pad","motorcycle accessories"] }
        ]}
      ]
    },
    { chapter:"90", title:"Optical, Medical, Measuring Instruments", section:"XVIII", sectionTitle:"Instruments",
      headings:[
        { code:"9018", description:"Instruments for medical/surgical/dental use", subheadings:[
          { code:"9018.11", description:"Electro-cardiographs (ECG machines)", keywords:["ECG","EKG","cardiograph","heart monitor","medical equipment"] },
          { code:"9018.19", description:"Other electro-diagnostic apparatus", keywords:["diagnostic equipment","medical device","ultrasound","scanner","medical equipment"] },
          { code:"9018.90", description:"Other surgical/medical instruments", keywords:["medical equipment","surgical instruments","scalpel","forceps","syringe","medical device"] }
        ]},
        { code:"9027", description:"Instruments for physical/chemical analysis", subheadings:[
          { code:"9027.80", description:"Other instruments and apparatus for analysis", keywords:["analyser","laboratory equipment","spectrophotometer","blood analyser","diagnostic equipment"] }
        ]}
      ]
    },
    { chapter:"94", title:"Furniture; Bedding; Lamps", section:"XX", sectionTitle:"Miscellaneous Manufactured",
      headings:[
        { code:"9401", description:"Seats (not 9402)", subheadings:[
          { code:"9401.20", description:"Seats of a kind used for motor vehicles", keywords:["car seat","vehicle seat","auto seat","seat"] },
          { code:"9401.51", description:"Seats of bamboo or rattan", keywords:["rattan chair","bamboo chair","cane chair","furniture"] },
          { code:"9401.61", description:"Upholstered seats with wooden frames", keywords:["sofa","couch","armchair","settee","upholstered chair","living room furniture"] },
          { code:"9401.71", description:"Seats with metal frames", keywords:["office chair","metal chair","stacking chair","plastic chair","monobloc chair"] },
          { code:"9401.80", description:"Other seats", keywords:["chair","seat","folding chair","camping chair","furniture"] }
        ]},
        { code:"9403", description:"Other furniture and parts thereof", subheadings:[
          { code:"9403.10", description:"Metal furniture for offices", keywords:["office furniture","metal desk","filing cabinet","steel furniture","office"] },
          { code:"9403.20", description:"Other metal furniture", keywords:["metal furniture","iron bed","metal shelf","steel furniture","bunk bed","metal bookcase"] },
          { code:"9403.30", description:"Wooden furniture for offices", keywords:["office desk","wooden desk","office furniture","executive desk","conference table"] },
          { code:"9403.40", description:"Wooden furniture for kitchens", keywords:["kitchen cabinet","kitchen furniture","kitchen unit","cupboard"] },
          { code:"9403.50", description:"Wooden furniture for bedrooms", keywords:["bed","bedroom furniture","wardrobe","chest of drawers","bedside table","dressing table"] },
          { code:"9403.60", description:"Other wooden furniture", keywords:["wooden furniture","wooden table","dining table","dining chair","bookcase","shelving"] },
          { code:"9403.70", description:"Furniture of plastics", keywords:["plastic furniture","plastic chair","plastic table","plastic shelving","plastic stool"] }
        ]},
        { code:"9404", description:"Mattress supports; mattresses; sleeping bags", subheadings:[
          { code:"9404.21", description:"Mattresses of cellular rubber or plastics", keywords:["foam mattress","rubber mattress","sponge mattress","mattress"] },
          { code:"9404.29", description:"Other mattresses", keywords:["spring mattress","mattress","orthopedic mattress","bed mattress","double mattress","single mattress"] }
        ]},
        { code:"9405", description:"Lamps and lighting fittings", subheadings:[
          { code:"9405.11", description:"Chandeliers and other ceiling/wall light fittings for electric light", keywords:["chandelier","ceiling light","light fitting","luminaire","pendant light"] },
          { code:"9405.40", description:"Other electric lamps and lighting fittings", keywords:["LED light","bulb","lamp","lighting","energy saving bulb","fluorescent lamp","street light"] },
          { code:"9405.50", description:"Non-electrical lamps and lighting", keywords:["kerosene lamp","solar lamp","lantern","gas lamp","hurricane lamp"] }
        ]}
      ]
    }
  ]
};

// Build a flat search index at load time
(function buildSearchIndex() {
  HS_DATABASE.searchIndex = [];
  HS_DATABASE.chapterMap = {};
  HS_DATABASE.chapters.forEach(function(ch) {
    HS_DATABASE.chapterMap[ch.chapter] = ch;
    (ch.headings || []).forEach(function(h) {
      (h.subheadings || []).forEach(function(sh) {
        HS_DATABASE.searchIndex.push({
          code: sh.code,
          description: sh.description,
          keywords: (sh.keywords || []).join(' '),
          chapter: ch.chapter,
          chapterTitle: ch.title,
          headingCode: h.code,
          headingDesc: h.description,
          searchText: (sh.description + ' ' + (sh.keywords || []).join(' ')).toLowerCase()
        });
      });
    });
  });
})();

if (typeof module !== 'undefined') module.exports = { HS_DATABASE };
