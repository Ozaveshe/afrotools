(function () {
  'use strict';

  var DEFAULT_MODES = ['Client estimate', 'Contractor quote', 'Site handoff', 'Tender review'];
  var COMMON_COMPANIONS = [
    { label: 'BOQ Builder', href: '/tools/boq-builder/' },
    { label: 'Building Cost', href: '/tools/floor-plan/' },
    { label: 'AfroDraft', href: '/engineering/afrodraft/' }
  ];

  function makeConfig(config) {
    config.modes = config.modes || DEFAULT_MODES;
    config.presets = config.presets || [];
    config.checks = config.checks || [];
    config.risks = config.risks || [];
    config.procurement = config.procurement || [];
    config.sequence = config.sequence || [];
    config.companions = config.companions || COMMON_COMPANIONS;
    config.thresholds = config.thresholds || [];
    config.benchmark = config.benchmark || '';
    return config;
  }

  var CONFIGS = {
    '/engineering/': makeConfig({
      kind: 'category',
      name: 'Engineering Section Control Board',
      kicker: 'Section upgrade',
      description: 'A practical pass across engineering apps: calculator output, field checks, procurement notes, and next-tool handoff.',
      modes: ['Owner planning', 'Estimator review', 'Site team handoff', 'Student practice'],
      checks: [
        'Start with the calculator that matches the current site decision, then build a handoff note before moving to the next estimate.',
        'Use the companion links to turn a single result into a BOQ, CAD note, or cost comparison.',
        'Treat rates as planning assumptions until supplier quotes and local approvals are checked.'
      ],
      procurement: [
        'Keep screenshots or PDFs of major estimates beside contractor quotations.',
        'Record country, city, material grade, and wastage assumptions for every result.',
        'Mark whether a result is for budget planning, tender comparison, or site procurement.'
      ],
      sequence: [
        'Pick one engineering app.',
        'Run the calculator or planner with project-specific inputs.',
        'Generate the field pack and copy it into the project notes.',
        'Open the next companion tool only after the current decision is documented.'
      ]
    }),

    '/tools/solar-calculator/': makeConfig({
      name: 'Solar Site Pack',
      kicker: 'PV sizing review',
      description: 'Turn the solar result into an installation brief with autonomy, loss, inverter, and generator comparison checks.',
      modes: ['Home backup', 'Shop uptime', 'Clinic or school', 'Generator replacement'],
      presets: [
        { label: 'Lagos 3-bed backup', values: { systemType: 'hybrid', panelWatts: '450', battType: 'lifepo4', backupDays: '2', currency: 'NGN', degradation: '0.7', genCost: '950' } },
        { label: 'Nairobi shop', values: { systemType: 'hybrid', panelWatts: '550', battType: 'lifepo4', backupDays: '1', currency: 'KES', degradation: '0.6' } }
      ],
      checks: ['Confirm roof shade, tilt, azimuth, and usable roof area before buying panels.', 'Keep inverter continuous load below its rating and check motor start surge.', 'Add battery autonomy only after reducing loads that should not run overnight.', 'Record assumed system losses and panel degradation.'],
      risks: ['Oversized batteries can hide wasteful loads.', 'Undersized inverter surge rating causes nuisance trips.', 'Dust and shading can reduce output more than the calculator estimate.'],
      procurement: ['Panel wattage and count', 'Inverter size and surge rating', 'Battery chemistry and usable kWh', 'DC isolators, earthing, cable size, breakers, mounting rails'],
      sequence: ['Audit loads', 'Run solar sizing', 'Check roof and battery location', 'Compare generator fuel cost', 'Request installer quote'],
      thresholds: [{ id: 'backupDays', min: 3, message: 'Backup above 3 days needs a load-shedding schedule or a larger battery budget.' }],
      companions: [{ label: 'Generator sizing', href: '/tools/generator-sizing/' }, { label: 'Electrical load', href: '/tools/electrical-load/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/floor-plan/': makeConfig({
      name: 'Building Cost Review Pack',
      kicker: 'Cost estimator',
      description: 'Convert area and finish assumptions into a scope note that is ready for a QS or contractor quote.',
      modes: ['Early budget', 'Client feasibility', 'Contractor comparison', 'Loan estimate'],
      presets: [
        { label: 'Lagos bungalow', values: { buildType: 'bungalow', finishQuality: 'standard', location: 'lagos' } },
        { label: 'Nairobi apartment', values: { buildType: 'apartment', finishQuality: 'premium', location: 'nairobi' } }
      ],
      checks: ['Separate gross floor area from net usable room area.', 'State the finish tier and what it excludes.', 'Add preliminaries, approvals, utilities, and external works if not in the estimate.', 'Keep a contingency line for inflation and site uncertainty.'],
      risks: ['Finish quality is the biggest user-controlled cost swing.', 'City rates can miss rural access costs or urban logistics costs.', 'External works are often excluded from simple per-area estimates.'],
      procurement: ['Area schedule', 'Finish schedule', 'External works allowance', 'Professional fees allowance', 'Contingency note'],
      sequence: ['Set location and finish tier', 'Build room list', 'Generate estimate', 'Add contingency', 'Move to BOQ Builder'],
      companions: [{ label: 'BOQ Builder', href: '/tools/boq-builder/' }, { label: 'AfroPlan', href: '/engineering/floor-planner/' }, { label: 'Renovation cost', href: '/tools/home-renovation-cost/' }]
    }),

    '/engineering/floor-planner/': makeConfig({
      floating: true,
      name: 'AfroPlan Layout Review',
      kicker: 'Floor planner',
      description: 'Capture adjacency, circulation, window, door, and BOQ handoff notes while editing the plan.',
      modes: ['New bungalow', 'Apartment layout', 'Rental unit', 'Shop conversion'],
      presets: [
        { label: '3-bed bungalow prompt', values: { fpAiInput: '3 bedroom bungalow with living room, kitchen, 2 bathrooms, front porch, and laundry on a 60x120 ft plot' } },
        { label: 'Compact rental prompt', values: { fpAiInput: '2 bedroom rental apartment with open living area, cross ventilation, compact kitchen, and shared bathroom stack' } }
      ],
      checks: ['Keep wet areas close enough to reduce plumbing runs.', 'Check door swings against furniture and circulation paths.', 'Mark bedroom windows for daylight, ventilation, and escape review.', 'Export BOQ after room labels and dimensions are stable.'],
      risks: ['A pretty plan can still fail on circulation, ventilation, or plumbing stack cost.', 'AI generated layouts need manual dimension checks before approval.', 'Furniture placement can hide undersized rooms.'],
      procurement: ['Room schedule', 'Door and window schedule', 'Plumbing stack note', 'Furniture clearance note', 'Cost export or BOQ'],
      sequence: ['Generate or draw plan', 'Lock dimensions', 'Place openings', 'Review circulation', 'Estimate cost and export'],
      companions: [{ label: 'Building Cost', href: '/tools/floor-plan/' }, { label: 'Window and door sizing', href: '/tools/window-door-sizing/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/boq-builder/': makeConfig({
      name: 'BOQ Tender Pack',
      kicker: 'Quantity surveying',
      description: 'Turn a BOQ draft into a tender-ready checklist for preliminaries, measurement basis, VAT, contingency, and exclusions.',
      modes: ['Tender issue', 'Client budget', 'Contractor pricing', 'Variation pricing'],
      checks: ['Include preliminaries and general items before comparing totals.', 'State the method of measurement and any assumptions.', 'Keep contingency, VAT, and markup visibly separate.', 'List exclusions so contractors price the same scope.'],
      risks: ['Missing preliminaries can make the lowest quote misleading.', 'Imported CSV rows may land in the wrong trade category.', 'Different VAT treatment by country can change the final number.'],
      procurement: ['Measured line items', 'Preliminaries schedule', 'VAT and levy note', 'Exclusions register', 'Signature and approval lines'],
      sequence: ['Choose template', 'Complete line items', 'Check categories', 'Review summary', 'Export PDF or CSV'],
      companions: [{ label: 'Concrete mix', href: '/tools/concrete-mix/' }, { label: 'Rebar', href: '/tools/rebar-calculator/' }, { label: 'Roofing', href: '/tools/roof-calculator/' }]
    }),

    '/tools/boq-builder/app': makeConfig({
      floating: true,
      name: 'BOQ Tender Audit',
      kicker: 'Live BOQ app',
      description: 'Audit the open BOQ for missing project metadata, preliminaries, contingency, VAT, and line-item completeness.',
      modes: ['Tender issue', 'Client budget', 'Internal review', 'Variation pricing'],
      checks: ['Fill project name, client, location, prepared by, and reference before exporting.', 'Scan all trade categories for blank rates or placeholder quantities.', 'Keep contingency and markup intentional rather than default.', 'Export both PDF and CSV for backup.'],
      risks: ['Blank rates can make a professional-looking PDF understate the tender value.', 'Collapsed categories can hide incomplete items.', 'VAT changes by country and should be verified before submission.'],
      procurement: ['Project metadata', 'Measured schedule', 'Trade subtotals', 'Adjustment percentages', 'PDF and CSV exports'],
      sequence: ['Load template', 'Fill metadata', 'Price categories', 'Audit adjustments', 'Save and export'],
      companions: [{ label: 'BOQ landing', href: '/tools/boq-builder/' }, { label: 'Building Cost', href: '/tools/floor-plan/' }, { label: 'Concrete mix', href: '/tools/concrete-mix/' }]
    }),

    '/tools/structural-calc/': makeConfig({
      name: 'Structural Design Review Pack',
      kicker: 'Structural calculator',
      description: 'Document span, load, concrete grade, steel grade, cover, and engineer-review assumptions.',
      modes: ['Beam check', 'Column check', 'Slab check', 'Footing check'],
      presets: [
        { label: 'Typical RC beam', values: { 'b-span': '4.5', 'b-udl': '12', 'b-fcu': '25', 'b-fy': '500', 'b-width': '225', 'b-cover': '25' } },
        { label: 'Pad footing', values: { 'f-load': '450', 'f-sbc': '150', 'f-fcu': '25', 'f-colsize': '300' } }
      ],
      checks: ['State load source before relying on any member size.', 'Check deflection, cover, bar spacing, and minimum reinforcement.', 'Confirm soil bearing capacity from site investigation for foundations.', 'Treat this as preliminary sizing unless signed by a qualified engineer.'],
      risks: ['Changing concrete grade without site supply confirmation can break the design intent.', 'Long spans can pass strength checks and still fail serviceability.', 'Foundation numbers are only as good as the bearing capacity assumption.'],
      procurement: ['Design load note', 'Concrete grade', 'Steel grade', 'Cover and exposure class', 'Engineer review signoff'],
      sequence: ['Select member type', 'Enter loads and span', 'Run calculation', 'Review warnings', 'Document assumptions'],
      companions: [{ label: 'Rebar', href: '/tools/rebar-calculator/' }, { label: 'Concrete mix', href: '/tools/concrete-mix/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/electrical-load/': makeConfig({
      name: 'Electrical Load Handoff',
      kicker: 'Load and breaker sizing',
      description: 'Prepare a load schedule with diversity, phase, generator, breaker, and voltage-drop checks.',
      modes: ['House wiring', 'Shop load', 'Office panel', 'Generator backup'],
      presets: [
        { label: 'Small home', values: { country: 'NG', phase: '1', diversity: '0.7' } },
        { label: 'Commercial 3-phase', values: { country: 'KE', phase: '3', diversity: '0.8' } }
      ],
      checks: ['Separate running watts from starting surge loads.', 'Record phase, voltage, and diversity factor used.', 'Check cable length and voltage drop for long runs.', 'Reserve spare panel capacity for future circuits.'],
      risks: ['High motor loads can exceed breaker or generator surge capacity.', 'Diversity assumptions can be unsafe for clinics, cold rooms, and pumps.', 'Undersized neutral or earthing can create site hazards.'],
      procurement: ['Load schedule', 'Breaker schedule', 'Cable size note', 'Earthing note', 'Generator or inverter interface'],
      sequence: ['List appliances', 'Apply diversity', 'Size panel and generator', 'Check cable runs', 'Issue electrician brief'],
      companions: [{ label: 'Generator sizing', href: '/tools/generator-sizing/' }, { label: 'Solar calculator', href: '/tools/solar-calculator/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/concrete-mix/': makeConfig({
      name: 'Concrete Pour Pack',
      kicker: 'Concrete materials',
      description: 'Turn volume, grade, bag size, and wastage into a pour-day brief with slump, moisture, curing, and testing checks.',
      modes: ['Slab pour', 'Foundation pour', 'Column pour', 'Small site batching'],
      presets: [
        { label: 'M20 slab', values: { grade: 'M20', shape: 'slab', sLen: '10', sWid: '8', sDep: '0.125', bagSize: '50', wastage: '10', country: 'NG' } },
        { label: 'M25 columns', values: { grade: 'M25', shape: 'column', cW: '0.3', cD: '0.3', cH: '3', cQ: '8', wastage: '10' } }
      ],
      checks: ['Confirm mix grade and whether batching is by volume or weight.', 'Do not add site water without controlling slump and strength risk.', 'Adjust for wet sand and aggregate bulking.', 'Plan curing water and cube tests for structural pours.'],
      risks: ['Too much water improves workability but weakens finished concrete.', 'Small bag sizes can create hidden material shortages.', 'Manual batching needs supervision to keep ratios consistent.'],
      procurement: ['Cement bags', 'Fine aggregate', 'Coarse aggregate', 'Water source', 'Curing sheet or compound', 'Cube moulds'],
      sequence: ['Measure volume', 'Choose grade', 'Add wastage', 'Plan labour and mixer', 'Record pour notes'],
      companions: [{ label: 'Rebar', href: '/tools/rebar-calculator/' }, { label: 'Structural', href: '/tools/structural-calc/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/paint-calculator/': makeConfig({
      name: 'Paint Workpack',
      kicker: 'Finishes',
      description: 'Capture wall area, coats, surface condition, brand coverage, primer, access, and final colour approval.',
      modes: ['Interior repaint', 'New plaster', 'Exterior weathercoat', 'Rental refresh'],
      presets: [
        { label: 'New apartment', values: { unit: 'm', roomShape: 'rect', length: '5', width: '4', height: '3', ceiling: 'yes', paintType: 'emulsion', surfaceType: 'new', coats: '2', brandCountry: 'NG' } },
        { label: 'Exterior repaint', values: { paintType: 'weathercoat', surfaceType: 'rough', coats: '2', brandCountry: 'ZA' } }
      ],
      checks: ['Confirm surface condition before trusting coverage.', 'Use primer or sealer on new plaster and stains.', 'Add access cost for stairwells, exterior walls, and high ceilings.', 'Approve colour samples before buying full quantities.'],
      risks: ['Rough surfaces can consume far more paint than smooth walls.', 'One-coat estimates often understate labour and material.', 'Door and window deductions can be overdone on small rooms.'],
      procurement: ['Paint litres', 'Primer or sealer', 'Rollers and brushes', 'Masking tape', 'Scaffold or ladder', 'Touch-up allowance'],
      sequence: ['Measure surfaces', 'Choose paint type', 'Set coats', 'Review brand coverage', 'Buy with touch-up margin'],
      companions: [{ label: 'Renovation cost', href: '/tools/home-renovation-cost/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }, { label: 'Tiles', href: '/tools/tiles-calc/' }]
    }),

    '/tools/tiles-calc/': makeConfig({
      name: 'Tile Layout Pack',
      kicker: 'Floor and wall finishes',
      description: 'Convert tile count into a layout note with pattern waste, grout, edge cuts, skirting, and surface preparation.',
      modes: ['Floor tiling', 'Bathroom walls', 'Kitchen splashback', 'External paving'],
      presets: [
        { label: 'Living room floor', values: { roomLength: '6', roomWidth: '4', surfaceType: 'floor', tileSize: '60x60', wastage: '10', pattern: 'straight' } },
        { label: 'Bathroom walls', values: { roomLength: '3', roomWidth: '2.4', surfaceType: 'both', wallHeight: '2.4', tileSize: '30x60', wastage: '15', pattern: 'brick' } }
      ],
      checks: ['Increase waste for diagonal, herringbone, and many corners.', 'Check batch numbers and shade consistency before fixing.', 'Add grout, adhesive, trim, and skirting to the material list.', 'Confirm screed flatness and waterproofing before wall or wet-area tiling.'],
      risks: ['Buying tile boxes too tightly can leave no stock for breakage or repairs.', 'Large-format tiles need flatter surfaces and stronger adhesive.', 'Wet areas need waterproofing checks before finishes hide defects.'],
      procurement: ['Tile boxes', 'Adhesive', 'Grout', 'Edge trims', 'Spacers', 'Waterproofing material'],
      sequence: ['Measure area', 'Choose tile and pattern', 'Apply waste', 'Check surface prep', 'Order same batch stock'],
      companions: [{ label: 'Paint', href: '/tools/paint-calculator/' }, { label: 'Renovation cost', href: '/tools/home-renovation-cost/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/water-tank/': makeConfig({
      name: 'Water Storage Pack',
      kicker: 'Tank sizing',
      description: 'Translate tank litres into a water security brief with demand, backup days, rainwater, pump, and maintenance checks.',
      modes: ['Household backup', 'Compound storage', 'School storage', 'Rainwater harvesting'],
      presets: [
        { label: 'Family backup', values: { people: '5', propertyType: 'duplex', reliability: '3', backupDays: '3', country: 'NG', tankPosition: 'elevated', rainwater: 'no' } },
        { label: 'Rainwater roof', values: { people: '6', propertyType: 'bungalow', reliability: '5', backupDays: '5', rainwater: 'yes', roofArea: '120' } }
      ],
      checks: ['Size for daily demand and dry-day backup, not just tank price.', 'Add cleaning reserve and dead storage where practical.', 'Check stand, slab, or roof structure for loaded tank weight.', 'Include first-flush and filtration when rainwater is enabled.'],
      risks: ['A 5000 L tank weighs about 5 tonnes when full before tank self-weight.', 'Poorly supported elevated tanks can fail suddenly.', 'Rainwater systems without first flush and screens collect debris.'],
      procurement: ['Tank capacity', 'Tank stand or slab', 'Pump and float switch', 'Overflow route', 'First flush filter', 'Cleaning access'],
      sequence: ['Set demand', 'Choose backup days', 'Check placement', 'Add rainwater option', 'Plan pump and overflow'],
      companions: [{ label: 'Plumbing materials', href: '/tools/plumbing-material/' }, { label: 'Borehole cost', href: '/tools/borehole-cost/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/roof-calculator/': makeConfig({
      name: 'Roofing Procurement Pack',
      kicker: 'Roof materials',
      description: 'Create a roofing order note with pitch, laps, fasteners, ridges, valleys, waste, and site access.',
      modes: ['New roof', 'Replacement roof', 'Small extension', 'Warehouse roof'],
      presets: [
        { label: 'Gable long-span', values: { bldgLength: '12', bldgWidth: '9', roofType: 'gable', roofPitch: '25', overhang: '0.45', sections: '2', material: 'longspan', wastage: '10' } },
        { label: 'Hip step-tile', values: { roofType: 'hip', roofPitch: '30', material: 'steptile', wastage: '15' } }
      ],
      checks: ['Confirm pitch, overhang, and roof shape before ordering sheets.', 'Add ridges, valleys, flashings, gutters, and fasteners.', 'Check sheet cover width after side laps.', 'Plan safe access for installation and inspection.'],
      risks: ['Hip roofs and valleys create more cutting waste than simple gables.', 'Wrong cover width can under-order sheets.', 'Fasteners and flashings are common missing items in small estimates.'],
      procurement: ['Roof sheets', 'Ridge caps', 'Valley gutters', 'Flashings', 'Fasteners', 'Underlay', 'Access equipment'],
      sequence: ['Measure footprint', 'Confirm roof type and pitch', 'Apply waste', 'Add accessories', 'Request supplier cut list'],
      companions: [{ label: 'Scaffolding', href: '/tools/scaffolding-calc/' }, { label: 'Building Cost', href: '/tools/floor-plan/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/borehole-cost/': makeConfig({
      name: 'Borehole Feasibility Pack',
      kicker: 'Water infrastructure',
      description: 'Prepare a drilling brief with geology, depth, pump, tank, yield, water quality, and permit assumptions.',
      modes: ['Domestic borehole', 'Commercial supply', 'Irrigation', 'Community water'],
      presets: [
        { label: 'Domestic hard rock', values: { country: 'ng', purpose: 'domestic', depth: '80', geology: 'hard', pump: 'submersible', tank: '2000' } },
        { label: 'Solar community', values: { purpose: 'community', depth: '120', geology: 'medium', pump: 'solar', tank: '10000' } }
      ],
      checks: ['Request hydrogeology advice before drilling in uncertain zones.', 'Confirm casing, gravel pack, sanitary seal, and pump warranty.', 'Plan yield test and water quality test after drilling.', 'Match tank size to pump flow and daily demand.'],
      risks: ['Depth estimates can change when geology is harder than expected.', 'Cheap boreholes often exclude casing, testing, or pump protection.', 'Water can be abundant but unsuitable without treatment.'],
      procurement: ['Drilling quote', 'Casing schedule', 'Pump and controller', 'Tank and stand', 'Yield test', 'Water quality test'],
      sequence: ['Set purpose and country', 'Estimate depth and geology', 'Choose pump and tank', 'Add tests', 'Compare contractor quotes'],
      companions: [{ label: 'Water tank', href: '/tools/water-tank/' }, { label: 'Solar calculator', href: '/tools/solar-calculator/' }, { label: 'Plumbing materials', href: '/tools/plumbing-material/' }]
    }),

    '/tools/rebar-calculator/': makeConfig({
      name: 'Rebar BBS Pack',
      kicker: 'Steel reinforcement',
      description: 'Turn bar quantities into a bending schedule note with mark, diameter, shape, lap, hook, stock length, and waste checks.',
      modes: ['Beam bars', 'Column links', 'Slab mesh', 'Footing reinforcement'],
      presets: [
        { label: 'Nigeria 10 percent waste', values: { country: 'NG', wastage: '10' } },
        { label: 'Kenya 15 percent waste', values: { country: 'KE', wastage: '15' } }
      ],
      checks: ['Use unique bar marks and avoid ambiguous shape descriptions.', 'Confirm lap length, anchorage, and hook rules with the design standard.', 'Check stock length before cutting to reduce offcuts.', 'Separate supply weight from installed weight and waste.'],
      risks: ['Wrong bend allowance can make bars too short on site.', 'Unmarked revisions cause duplicated or missing steel.', 'Wastage below 5 percent is rarely realistic for complex detailing.'],
      procurement: ['Bar mark schedule', 'Diameter and grade list', 'Cutting lengths', 'Lap and hook note', 'Binding wire', 'Spacer blocks'],
      sequence: ['List member bars', 'Set diameters and marks', 'Add lap and hooks', 'Compute weight', 'Issue BBS to fabricator'],
      companions: [{ label: 'Structural', href: '/tools/structural-calc/' }, { label: 'Concrete mix', href: '/tools/concrete-mix/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/generator-sizing/': makeConfig({
      name: 'Generator Load Pack',
      kicker: 'Backup power',
      description: 'Convert connected load into a generator brief with starting surge, target loading, fuel, ventilation, and transfer checks.',
      modes: ['Home backup', 'Office standby', 'Shop cold chain', 'Site generator'],
      presets: [
        { label: 'Home essentials', values: { presetAppliance: '-- Select appliance --', customName: 'Water pump', customWatts: '750' } },
        { label: 'Office add-on', values: { customName: 'Printer and router cluster', customWatts: '900' } }
      ],
      checks: ['Separate running watts from motor starting watts.', 'Avoid running small loads on a generator that is far too large.', 'Plan ventilation, exhaust direction, fuel storage, and noise control.', 'Check ATS or changeover switch rating.'],
      risks: ['Motor starting current can be several times running load.', 'Continuous operation at very low load can damage diesel generators.', 'Indoor or enclosed generator locations are unsafe.'],
      procurement: ['Generator kVA', 'Changeover or ATS', 'Fuel tank', 'Exhaust and ventilation', 'Earthing', 'Service schedule'],
      sequence: ['List essential loads', 'Add surge factor', 'Choose kVA band', 'Check fuel and noise', 'Issue installer brief'],
      companions: [{ label: 'Electrical load', href: '/tools/electrical-load/' }, { label: 'Solar calculator', href: '/tools/solar-calculator/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/boq-generator/': makeConfig({
      name: 'Quick BOQ Generator Pack',
      kicker: 'Automated quantities',
      description: 'Turn high-level project inputs into a reviewable BOQ note with assumptions, openings, services, and adjustment checks.',
      modes: ['Residential estimate', 'Commercial estimate', 'Warehouse estimate', 'Owner budget'],
      presets: [
        { label: '3-bed bungalow', values: { country: 'NG', buildType: 'res3', floorArea: '160', floors: '1', wallHeight: '3', wallType: 'block9', roofType: 'zinc', finishing: 'standard', contingency: '10' } },
        { label: 'Small office', values: { country: 'KE', buildType: 'comm', floorArea: '300', floors: '2', finishing: 'premium', contingency: '12' } }
      ],
      checks: ['Verify generated quantities against drawings before tender use.', 'Review openings and services counts manually.', 'Add preliminaries, permits, and external works if missing.', 'Export and hand off to the editable BOQ Builder for detailed pricing.'],
      risks: ['Auto-generated quantities can miss unusual geometry.', 'Door, window, and fixture counts drive multiple trade totals.', 'High-level estimates should not replace a measured BOQ for contract pricing.'],
      procurement: ['Generated trade list', 'Openings schedule', 'Services count', 'Contingency setting', 'Exported BOQ'],
      sequence: ['Set country and building type', 'Enter area and storeys', 'Set openings and services', 'Review totals', 'Export to BOQ workflow'],
      companions: [{ label: 'BOQ Builder', href: '/tools/boq-builder/' }, { label: 'AfroPlan', href: '/engineering/floor-planner/' }, { label: 'Building Cost', href: '/tools/floor-plan/' }]
    }),

    '/tools/home-renovation-cost/': makeConfig({
      name: 'Renovation Scope Pack',
      kicker: 'Renovation planning',
      description: 'Capture renovation scope, hidden-risk allowances, occupied-site constraints, waste, and quote-comparison notes.',
      modes: ['Cosmetic refresh', 'Kitchen and bath', 'Full renovation', 'Rental turnover'],
      presets: [
        { label: 'Budget repaint', values: { country: 'NG', quality: 'budget', propSize: '90', scope: 'cosmetic' } },
        { label: 'Full apartment', values: { country: 'ZA', quality: 'mid', propSize: '120', scope: 'full' } }
      ],
      checks: ['Inspect plumbing, electrical, damp, and structural defects before pricing finishes.', 'Separate demolition, disposal, and making-good costs.', 'Add occupied-site phasing if people will live or work there during renovation.', 'Keep allowances for hidden defects.'],
      risks: ['Old buildings often hide damp, wiring, or plumbing defects.', 'Low quotes may exclude demolition and waste removal.', 'Changing finish selections after work starts causes variation costs.'],
      procurement: ['Scope schedule', 'Demolition allowance', 'Waste disposal', 'Finish schedule', 'Hidden-defect contingency'],
      sequence: ['Define rooms', 'Inspect hidden risks', 'Set quality tier', 'Add disposal and phasing', 'Compare quotes'],
      companions: [{ label: 'Paint', href: '/tools/paint-calculator/' }, { label: 'Tiles', href: '/tools/tiles-calc/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/septic-tank/': makeConfig({
      name: 'Septic System Pack',
      kicker: 'Wastewater',
      description: 'Turn tank volume into a site sanitation brief with percolation, setbacks, soakaway, ventilation, and maintenance access.',
      modes: ['Private home', 'School toilets', 'Clinic sanitation', 'Compound upgrade'],
      presets: [
        { label: '6-person home', values: { 'st-country': 'NG', 'st-people': '6', 'st-btype': 'residential', 'st-toilets': '2', 'st-soil': 'loam', 'st-material': 'concrete', 'st-soak': 'yes' } },
        { label: 'School block', values: { 'st-people': '60', 'st-btype': 'school', 'st-toilets': '8', 'st-soil': 'laterite', 'st-material': 'concrete', 'st-soak': 'yes' } }
      ],
      checks: ['Confirm local setback rules from wells, property lines, and buildings.', 'Run a percolation or soakaway suitability check before excavation.', 'Keep manholes accessible for desludging.', 'Vent the system and protect the soakaway from vehicle loads.'],
      risks: ['Clay soil or high groundwater can make a normal soakaway unsuitable.', 'No pump-out access turns maintenance into reconstruction.', 'Undersized tanks fail faster in schools and clinics.'],
      procurement: ['Tank dimensions', 'Soakaway or leach field', 'Vent pipe', 'Access covers', 'Waterproofing', 'Desludging plan'],
      sequence: ['Set occupants and use', 'Check soil', 'Size tank', 'Review setbacks', 'Plan maintenance access'],
      thresholds: [{ id: 'st-people', min: 30, message: 'High-occupancy sanitation needs stronger maintenance and desludging planning.' }],
      companions: [{ label: 'Plumbing materials', href: '/tools/plumbing-material/' }, { label: 'Water tank', href: '/tools/water-tank/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/fence-cost/': makeConfig({
      name: 'Fence Quote Pack',
      kicker: 'Boundary works',
      description: 'Document perimeter, gates, posts, topping, foundation, property-line, and security assumptions before contractor quotes.',
      modes: ['Residential boundary', 'Farm perimeter', 'Commercial security', 'Estate frontage'],
      presets: [
        { label: '100 m block wall', values: { 'fc-country': 'NG', 'fc-length': '100', 'fc-height': '1.8', 'fc-type': 'block_render', 'fc-gates': '1', 'fc-gate-type': 'manual_double', 'fc-topping': 'none' } },
        { label: 'Security fence', values: { 'fc-height': '2.4', 'fc-type': 'electric', 'fc-gates': '2', 'fc-gate-type': 'sliding', 'fc-topping': 'razor' } }
      ],
      checks: ['Confirm boundary survey before building permanent walls.', 'Add corner, gate, and end-post reinforcement.', 'State post depth and concrete footing assumptions.', 'Include old fence removal if this is replacement work.'],
      risks: ['Gate posts are often underpriced and then fail first.', 'Razor or electric toppings can require approvals and safety signage.', 'A fence built off-boundary can create expensive disputes.'],
      procurement: ['Fence material', 'Posts and footings', 'Gate hardware', 'Security topping', 'Survey line', 'Finishing or rendering'],
      sequence: ['Confirm boundary', 'Measure perimeter', 'Choose fence type', 'Add gates and topping', 'Compare quote per metre'],
      companions: [{ label: 'Site clearing', href: '/tools/site-clearing/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }, { label: 'Road cost', href: '/tools/road-construction-cost/' }]
    }),

    '/tools/swimming-pool-cost/': makeConfig({
      name: 'Pool Scope Pack',
      kicker: 'Pool construction',
      description: 'Turn pool size and finish into a scope note with excavation, filtration, waterproofing, decking, safety, and maintenance checks.',
      modes: ['Home pool', 'Short-let amenity', 'Hotel pool', 'Training pool'],
      presets: [
        { label: 'Family pool', values: { 'sp-country': 'NG', 'sp-length': '8', 'sp-width': '4', 'sp-depth': '1.5', 'sp-type': 'concrete', 'sp-finish': 'tile', 'sp-use': 'residential', 'sp-extras': 'lighting' } },
        { label: 'Commercial pool', values: { 'sp-length': '15', 'sp-width': '6', 'sp-depth': '1.8', 'sp-type': 'concrete', 'sp-finish': 'pebble', 'sp-use': 'commercial', 'sp-extras': 'fence' } }
      ],
      checks: ['Confirm soil, groundwater, and excavation access.', 'Include filtration, pump room, waterproofing, decking, and safety fence.', 'Plan water supply and backwash drainage.', 'Budget commissioning chemicals and maintenance.'],
      risks: ['Pool shell cost is only part of the real project cost.', 'High groundwater can change excavation and waterproofing requirements.', 'Commercial pools need stricter safety and filtration assumptions.'],
      procurement: ['Excavation', 'Shell system', 'Waterproofing', 'Tiles or finish', 'Pump and filter', 'Decking', 'Safety barrier'],
      sequence: ['Set size and depth', 'Choose shell and finish', 'Add extras', 'Check services', 'Request pool contractor quote'],
      companions: [{ label: 'Water tank', href: '/tools/water-tank/' }, { label: 'Plumbing materials', href: '/tools/plumbing-material/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/architectural-fee/': makeConfig({
      name: 'Architect Fee Scope Pack',
      kicker: 'Professional services',
      description: 'Clarify drawing deliverables, approvals, revisions, site visits, and handoff boundaries before agreeing fees.',
      modes: ['Concept design', 'Approval drawings', 'Working drawings', 'Full service'],
      presets: [
        { label: 'Simple residence', values: { 'af-country': 'NG', 'af-btype': 'residential_simple', 'af-area': '180', 'af-value': '45000000', 'af-scope': 'full', 'af-arch-cat': 'small_firm' } },
        { label: 'Commercial approval', values: { 'af-btype': 'commercial_small', 'af-area': '350', 'af-scope': 'approval', 'af-arch-cat': 'large_firm' } }
      ],
      checks: ['State exactly which drawings are included.', 'Separate concept, approval, working drawings, and site supervision.', 'Agree revision rounds and response time.', 'Confirm who handles authority submissions and consultant coordination.'],
      risks: ['A low drawing fee may exclude approval follow-up and revisions.', 'Structural, MEP, survey, and planning fees may be separate.', 'Scope creep starts when deliverables are not listed.'],
      procurement: ['Architect scope', 'Drawing list', 'Revision allowance', 'Authority submission note', 'Consultant exclusions'],
      sequence: ['Define building type', 'Set scope', 'List deliverables', 'Confirm exclusions', 'Agree fee and milestones'],
      companions: [{ label: 'AfroPlan', href: '/engineering/floor-planner/' }, { label: 'AfroDraft', href: '/engineering/afrodraft/' }, { label: 'Building Cost', href: '/tools/floor-plan/' }]
    }),

    '/tools/site-clearing/': makeConfig({
      name: 'Site Clearing Pack',
      kicker: 'Site preparation',
      description: 'Turn vegetation and terrain inputs into a clearing brief with access, disposal, topsoil, erosion, and utility checks.',
      modes: ['House plot', 'Farm clearing', 'Road corridor', 'Commercial site'],
      presets: [
        { label: 'Urban plot', values: { 'sc-country': 'NG', 'sc-area': '0.25', 'sc-veg': 'medium', 'sc-terrain': 'flat', 'sc-topsoil': 'yes', 'sc-trees': '5', 'sc-demo': 'small', 'sc-waste': 'haul' } },
        { label: 'Dense rural site', values: { 'sc-area': '1', 'sc-veg': 'dense', 'sc-terrain': 'gentle', 'sc-topsoil': 'yes', 'sc-trees': '40', 'sc-waste': 'chip' } }
      ],
      checks: ['Walk the site for utilities, wells, trees to retain, and access limits.', 'Separate clearing, grubbing, topsoil strip, demolition, and disposal.', 'Plan erosion control if slopes or rainy season work are involved.', 'Confirm disposal rules before burning or hauling waste.'],
      risks: ['Limited access can change equipment choice and daily output.', 'Clearing everything can destroy useful topsoil and increase erosion.', 'Hidden rubble or stumps can delay foundation work.'],
      procurement: ['Survey limits', 'Equipment access', 'Tree count', 'Waste route', 'Topsoil stockpile', 'Erosion control'],
      sequence: ['Mark site limits', 'Check access and utilities', 'Estimate clearing', 'Plan disposal', 'Hand off to excavation team'],
      thresholds: [{ id: 'sc-trees', min: 20, message: 'High tree count needs a separate stump, disposal, and access allowance.' }],
      companions: [{ label: 'Road cost', href: '/tools/road-construction-cost/' }, { label: 'Fence cost', href: '/tools/fence-cost/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/road-construction-cost/': makeConfig({
      name: 'Road Estimate Pack',
      kicker: 'Civil works',
      description: 'Create a road estimate brief with width, terrain, drainage, pavement layers, traffic control, and lighting assumptions.',
      modes: ['Estate road', 'Farm access', 'Urban street', 'Industrial yard'],
      presets: [
        { label: 'Rural gravel road', values: { 'rc-country': 'KE', 'rc-length': '1', 'rc-width': '3.5', 'rc-surface': 'gravel', 'rc-terrain': 'rolling', 'rc-location': 'rural', 'rc-drainage': 'yes', 'rc-lighting': 'no' } },
        { label: 'Urban asphalt', values: { 'rc-length': '0.5', 'rc-width': '7.3', 'rc-surface': 'asphalt', 'rc-terrain': 'flat', 'rc-location': 'urban', 'rc-drainage': 'yes', 'rc-lighting': 'yes' } }
      ],
      checks: ['Separate earthworks, subbase, base, surface, drainage, and traffic control.', 'Check subgrade strength and wet spots before choosing pavement depth.', 'Include culverts, side drains, and utility crossings.', 'Add mobilisation for remote or short road jobs.'],
      risks: ['Drainage failures destroy road budgets after construction.', 'Urban jobs need traffic control and utility coordination.', 'A cheap surface on weak subgrade will fail early.'],
      procurement: ['Survey alignment', 'Earthworks quantity', 'Subbase and base', 'Surface layer', 'Drainage', 'Traffic control'],
      sequence: ['Set length and width', 'Choose surface', 'Review terrain and drainage', 'Add lighting or urban controls', 'Compare per-km cost'],
      companions: [{ label: 'Site clearing', href: '/tools/site-clearing/' }, { label: 'Concrete mix', href: '/tools/concrete-mix/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/scaffolding-calc/': makeConfig({
      name: 'Scaffold Safety Pack',
      kicker: 'Temporary works',
      description: 'Turn scaffold quantities into a safety handoff with platform width, guardrails, ties, base plates, inspection, and load checks.',
      modes: ['Facade works', 'Roof access', 'Painting access', 'Heavy-duty platform'],
      presets: [
        { label: 'Facade rental', values: { 'sg-country': 'NG', 'sg-perimeter': '60', 'sg-height': '6', 'sg-type': 'system', 'sg-mode': 'rent', 'sg-weeks': '4', 'sg-labour': 'yes' } },
        { label: 'Low paint access', values: { 'sg-perimeter': '30', 'sg-height': '3', 'sg-type': 'tube_coupler', 'sg-mode': 'rent', 'sg-weeks': '2', 'sg-labour': 'yes' } }
      ],
      checks: ['Have a competent person inspect before use and after changes.', 'Use base plates or firm foundations, not loose blocks.', 'Provide guardrails or fall protection where required.', 'Tie or brace tall scaffolds against overturning.'],
      risks: ['Scaffold components must not be overloaded beyond rated capacity.', 'Open platforms and missing guardrails are life-safety issues.', 'Soft ground and uneven bases cause settlement and collapse risk.'],
      procurement: ['Frames or tubes', 'Platforms', 'Base plates', 'Guardrails and toe boards', 'Ties and braces', 'Inspection tag'],
      sequence: ['Measure perimeter and height', 'Choose system', 'Plan access and ties', 'Estimate hire duration', 'Issue inspection checklist'],
      thresholds: [{ id: 'sg-height', min: 3.1, message: 'Height above 3 m needs fall-protection and scaffold supervision attention.' }],
      companions: [{ label: 'Roofing', href: '/tools/roof-calculator/' }, { label: 'Paint', href: '/tools/paint-calculator/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/window-door-sizing/': makeConfig({
      name: 'Openings Schedule Pack',
      kicker: 'Windows and doors',
      description: 'Convert room counts into an openings schedule with egress, ventilation, security, frame, hardware, and installation checks.',
      modes: ['Residential schedule', 'Office fit-out', 'Retail frontage', 'Replacement work'],
      presets: [
        { label: '3-bed house', values: { 'wd-country': 'NG', 'wd-btype': 'residential', 'wd-rooms': '6', 'wd-room-area': '14', 'wd-ext-doors': '2', 'wd-int-doors': '8', 'wd-win-mat': 'aluminium', 'wd-win-type': 'casement', 'wd-door-mat': 'steel_security', 'wd-int-mat': 'flush_hdf' } },
        { label: 'Retail unit', values: { 'wd-btype': 'retail', 'wd-rooms': '3', 'wd-room-area': '30', 'wd-ext-doors': '2', 'wd-win-type': 'fixed', 'wd-door-mat': 'aluminium_glass' } }
      ],
      checks: ['Mark which rooms need emergency escape or special ventilation.', 'Check natural light and ventilation areas against local code.', 'Separate frame, glazing, ironmongery, security bars, and installation.', 'Confirm rough opening sizes before fabrication.'],
      risks: ['A window can be large but still fail clear-opening requirements.', 'Security bars can block escape if not releasable from inside.', 'Late frame material changes affect wall openings and cost.'],
      procurement: ['Opening schedule', 'Frame material', 'Glazing type', 'Ironmongery', 'Security bars', 'Installation sealant'],
      sequence: ['Count rooms', 'Set opening strategy', 'Check egress and ventilation', 'Confirm materials', 'Issue fabrication schedule'],
      companions: [{ label: 'AfroPlan', href: '/engineering/floor-planner/' }, { label: 'Architectural fee', href: '/tools/architectural-fee/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/tools/plumbing-material/': makeConfig({
      name: 'Plumbing Takeoff Pack',
      kicker: 'Pipes and fixtures',
      description: 'Turn bathrooms, pipe type, and tank choices into a pipe, fitting, fixture, pressure-test, and access note.',
      modes: ['New house', 'Duplex services', 'Small commercial', 'Renovation plumbing'],
      presets: [
        { label: '3-bed house', values: { 'pm-country': 'NG', 'pm-type': '3bed', 'pm-pipe': 'ppr', 'pm-baths': '3', 'pm-tank': 'yes', 'pm-tank-size': '2000', 'pm-labour': 'yes' } },
        { label: 'Commercial toilets', values: { 'pm-type': 'commercial', 'pm-pipe': 'upvc', 'pm-baths': '6', 'pm-tank': 'yes', 'pm-tank-size': '5000', 'pm-labour': 'yes' } }
      ],
      checks: ['Separate water supply, waste, vent, and rainwater lines.', 'Add fittings because elbows, tees, valves, and unions are often undercounted.', 'Pressure-test before closing walls or screeds.', 'Keep cleanout and valve access visible.'],
      risks: ['Pipe length alone misses fittings and isolation valves.', 'Wrong pipe type for hot water or pressure shortens service life.', 'No cleanouts make future blockage repair expensive.'],
      procurement: ['Pipe lengths', 'Fittings', 'Valves', 'Fixtures', 'Tank connection', 'Pressure-test kit', 'Access panels'],
      sequence: ['Set building type', 'Count bathrooms', 'Choose pipe material', 'Add tank and pump', 'Review fittings and labour'],
      companions: [{ label: 'Water tank', href: '/tools/water-tank/' }, { label: 'Septic tank', href: '/tools/septic-tank/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/engineering/afrodraft/': makeConfig({
      name: 'AfroDraft Drawing Pack',
      kicker: 'CAD handoff',
      description: 'Prepare a drawing-quality checklist with layers, units, dimensions, blocks, title block, and export compatibility.',
      modes: ['Student drawing', 'Site sketch', 'Approval sheet', 'Contractor detail'],
      checks: ['Set units and scale before dimensioning.', 'Use layers for walls, dimensions, text, services, and hidden lines.', 'Add title block, revision, and north or grid references where needed.', 'Export DXF plus PDF or PNG for mixed teams.'],
      risks: ['Unlayered drawings are hard to review or edit later.', 'Missing dimensions force contractors to guess.', 'PDF-only exports can block downstream CAD edits.'],
      procurement: ['Layer list', 'Block library note', 'Dimension style', 'Title block', 'DXF export', 'Review comments'],
      sequence: ['Launch app', 'Set units and layers', 'Draw and dimension', 'Review with trace notes', 'Export DXF and PDF'],
      companions: [{ label: 'Launch AfroDraft', href: '/engineering/afrodraft/app' }, { label: 'AfroPlan', href: '/engineering/floor-planner/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    }),

    '/engineering/afrodraft/app': makeConfig({
      floating: true,
      afrodraft: true,
      name: 'AfroDraft CAD QA',
      kicker: 'Special CAD review',
      description: 'A lightweight review drawer for units, layers, dimensions, title block, export formats, and issue notes while drafting.',
      modes: ['Technical detail', 'Floor plan draft', 'Site markup', 'Teaching demo'],
      checks: ['Check units before sharing a DXF.', 'Use named layers for walls, doors, dimensions, services, and notes.', 'Run zoom extents before export to catch stray geometry.', 'Export a DXF for CAD users and a PDF or PNG for non-CAD reviewers.'],
      risks: ['A single-layer drawing is difficult to revise.', 'Stray geometry can enlarge exports and confuse print scale.', 'Unclear revision notes make site teams use the wrong drawing.'],
      procurement: ['Drawing units', 'Layer list', 'Dimension coverage', 'Title block', 'Revision note', 'DXF and PDF export'],
      sequence: ['Set units', 'Create layers', 'Draft geometry', 'Dimension and annotate', 'Export and save'],
      companions: [{ label: 'AfroDraft landing', href: '/engineering/afrodraft/' }, { label: 'AfroPlan', href: '/engineering/floor-planner/' }, { label: 'BOQ Builder', href: '/tools/boq-builder/' }]
    })
  };

  CONFIGS['/tools/boq-builder/app.html'] = CONFIGS['/tools/boq-builder/app'];
  CONFIGS['/engineering/afrodraft/app.html'] = CONFIGS['/engineering/afrodraft/app'];

  var BENCHMARKS = {
    '/engineering/': 'Inspired by Procore and Autodesk Build style command centers: keep drawings, estimates, RFIs, quantities, and handoff decisions connected instead of sending users back to a flat tool directory.',
    '/tools/solar-calculator/': 'PVWatts-style review: expose losses, roof orientation, soiling, battery autonomy, and generator comparison before users treat a panel count as a quote.',
    '/tools/floor-plan/': 'RSMeans and Homewyse style estimators make assumptions visible. This pack forces area, finish tier, exclusions, and contingency into the handoff note.',
    '/engineering/floor-planner/': 'RoomSketcher-style planning focuses on dimensions, furniture clearance, openings, and printable plans. The pack keeps those checks beside the canvas.',
    '/tools/boq-builder/': 'Bluebeam and PlanSwift style takeoff workflows separate measured items, preliminaries, exclusions, and export evidence. The tender pack mirrors that discipline.',
    '/tools/boq-builder/app': 'Tender apps win when missing prices are obvious before export. The live BOQ audit checks metadata, blanks, adjustments, VAT, and backup exports.',
    '/tools/structural-calc/': 'SkyCiv-style calculators expose support assumptions, load cases, deflection, and code review. This pack keeps engineer signoff and serviceability front and center.',
    '/tools/electrical-load/': 'Panel schedulers and generator sizers distinguish connected load, demand, phase, cable length, surge, and spare capacity. This handoff makes those assumptions explicit.',
    '/tools/concrete-mix/': 'Ready-mix and site batching tools separate grade, volume, moisture, slump, waste, curing, and tests. The pour pack turns the calculator into a pour-day checklist.',
    '/tools/paint-calculator/': 'Dulux and retailer calculators account for coats, surface condition, primer, and coverage. This workpack adds access, colour approval, and touch-up margin.',
    '/tools/tiles-calc/': 'Tile retailer calculators usually stop at area and waste. This pack adds pattern waste, batch shade, grout, trims, waterproofing, and surface prep.',
    '/tools/water-tank/': 'Tank sizing calculators should connect demand, backup days, roof catchment, support weight, pump control, and maintenance access. This pack ties those decisions together.',
    '/tools/roof-calculator/': 'Roofing supplier calculators focus on sheet coverage, pitch, laps, flashings, and accessories. This procurement pack adds valleys, safe access, and supplier cut-list handoff.',
    '/tools/borehole-cost/': 'Drilling quote tools need geology, casing, yield testing, water quality, pump, tank, and permits. The feasibility pack keeps hidden borehole costs visible.',
    '/tools/rebar-calculator/': 'Bar scheduling tools are useful when marks, shapes, laps, stock length, and waste are traceable. This BBS pack adds fabrication and revision checks.',
    '/tools/generator-sizing/': 'Generator sizing competitors ask users to choose essential circuits and starting watts. This pack captures surge, loading band, ventilation, fuel, and changeover switch.',
    '/tools/boq-generator/': 'Automated BOQ tools are strongest when their assumptions are auditable. This pack makes generated quantities, openings, services, and exclusions reviewable.',
    '/tools/home-renovation-cost/': 'Renovation estimators need hidden-risk allowances. This pack adds demolition, disposal, damp, old wiring, phasing, and finish-change control.',
    '/tools/septic-tank/': 'Septic calculators should not stop at volume. This pack adds percolation, groundwater, setbacks, soakaway, ventilation, and desludging access.',
    '/tools/fence-cost/': 'Fence quote tools often miss surveys, gates, post footings, toppings, and removals. This pack turns a perimeter estimate into a quote checklist.',
    '/tools/swimming-pool-cost/': 'Pool cost tools understate filtration, waterproofing, decking, safety barriers, water supply, and maintenance. This pack makes the full scope visible.',
    '/tools/architectural-fee/': 'Professional-fee calculators work better when deliverables are spelled out. This pack separates concept, approvals, working drawings, revisions, and consultant exclusions.',
    '/tools/site-clearing/': 'Site-prep estimators should cover access, utilities, topsoil, stumps, disposal, erosion, and rainy-season risk. This pack adds those field checks.',
    '/tools/road-construction-cost/': 'Civil cost tools need pavement layers, subgrade, drainage, culverts, utility crossings, and traffic control. This pack adds road-estimate controls.',
    '/tools/scaffolding-calc/': 'PERI-style scaffold planning thinks in components, platforms, ties, loads, and inspection tags. This safety pack keeps temporary-works risks in the estimate.',
    '/tools/window-door-sizing/': 'Opening schedulers should connect light, ventilation, escape, security, hardware, frame material, and fabrication sizes. This pack adds those checks.',
    '/tools/plumbing-material/': 'Plumbing takeoffs need pipes plus fittings, valves, cleanouts, pressure tests, and access panels. This pack prevents a length-only estimate.'
  };

  Object.keys(BENCHMARKS).forEach(function (path) {
    if (CONFIGS[path]) CONFIGS[path].benchmark = BENCHMARKS[path];
  });

  function normalizePath(path) {
    path = (path || '/').split('?')[0].split('#')[0];
    path = path.replace(/\\/g, '/').replace(/\/index\.html$/i, '/');
    if (/\/app\.html$/i.test(path)) return path.replace(/\/app\.html$/i, '/app');
    if (/\/app$/i.test(path)) return path;
    if (!/\.[a-z0-9]+$/i.test(path) && path.charAt(path.length - 1) !== '/') path += '/';
    return path;
  }

  function getConfig() {
    var path = normalizePath(window.location.pathname);
    return CONFIGS[path] || null;
  }

  function text(value) {
    return (value == null ? '' : String(value)).replace(/\s+/g, ' ').trim();
  }

  function esc(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var PACK_KEY = 'afro_engineering_packs';
  var WORKFLOW_KEY = 'afro_engineering_workflows';
  var EMAIL_GATE_KEYS = ['afrotools-email-gate', 'afrotools_lead_email'];
  var workspaceLoadPromise = null;

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function toolSlugFromPath(path) {
    var bits = normalizePath(path || window.location.pathname).split('/').filter(Boolean);
    return bits[bits.length - 1] || bits[bits.length - 2] || 'engineering';
  }

  function dispatchWorkspaceChange(detail) {
    try {
      window.dispatchEvent(new CustomEvent('afro-workspace-change', { detail: detail || {} }));
    } catch (err) {}
  }

  function upsertLocalList(key, item) {
    var list = readJson(key, []);
    if (!Array.isArray(list)) list = [];
    list = list.filter(function (entry) {
      return entry && entry.itemKey !== item.itemKey && entry.id !== item.id;
    });
    list.unshift(item);
    if (list.length > 24) list = list.slice(0, 24);
    writeJson(key, list);
    dispatchWorkspaceChange({ source: 'engineering', itemType: item.itemType, itemKey: item.itemKey });
    return item;
  }

  function ensureWorkspaceSync() {
    if (window.AfroWorkspace) return Promise.resolve(window.AfroWorkspace);
    if (workspaceLoadPromise) return workspaceLoadPromise;
    workspaceLoadPromise = new Promise(function (resolve) {
      var script = document.createElement('script');
      script.src = '/assets/js/lib/workspace-sync.js?v=20260417a';
      script.defer = true;
      script.onload = function () { resolve(window.AfroWorkspace || null); };
      script.onerror = function () { resolve(null); };
      document.head.appendChild(script);
    });
    return workspaceLoadPromise;
  }

  function syncWorkspaceItem(item) {
    return ensureWorkspaceSync().then(function (api) {
      if (!api || !api.isSignedIn || !api.isSignedIn() || !api.upsert) return 'local';
      return api.upsert({
        itemType: item.itemType,
        itemKey: item.itemKey,
        toolSlug: item.toolSlug || '',
        title: item.title,
        summary: item.summary,
        href: item.href,
        payload: item.payload || {},
        meta: item.meta || {}
      }).then(function () {
        return 'cloud';
      }).catch(function () {
        return 'local';
      });
    });
  }

  function buildPackItem(config, copy, controls, results, values, risks) {
    var path = normalizePath(window.location.pathname);
    var toolSlug = toolSlugFromPath(path);
    var itemKey = 'engineering-pack:' + path;
    var summary = (values.mode || config.modes[0]) + ' | ' + (values.confidence || 'Medium') + ' confidence | ' + controls.length + ' input' + (controls.length === 1 ? '' : 's') + ' captured';
    return {
      id: itemKey,
      itemType: 'engineering-pack',
      itemKey: itemKey,
      toolSlug: toolSlug,
      title: config.name,
      summary: summary,
      href: path,
      updatedAt: nowIso(),
      sourceHref: path,
      syncStatus: 'local',
      mode: values.mode || '',
      payload: {
        copy: copy,
        controls: controls,
        results: results,
        values: values,
        risks: risks,
        benchmark: config.benchmark || '',
        companions: config.companions || []
      },
      meta: {
        category: 'engineering',
        path: path,
        dashboardSurface: 'engineering'
      }
    };
  }

  function persistPack(shell, sync) {
    var latest = shell && shell._engLatestPack;
    if (!latest) {
      buildOutput(shell._engConfig, shell);
      latest = shell._engLatestPack;
    }
    if (!latest) return Promise.resolve('empty');
    var item = buildPackItem(latest.config, latest.copy, latest.controls, latest.results, latest.values, latest.risks);
    upsertLocalList(PACK_KEY, item);
    if (!sync) return Promise.resolve('local');
    return syncWorkspaceItem(item).then(function (status) {
      item.syncStatus = status;
      upsertLocalList(PACK_KEY, item);
      return status;
    });
  }

  function saveWorkflowToDashboard(workflow) {
    var item = workflow || {};
    var id = item.itemKey || ('engineering-workflow:' + (item.stage || 'project') + ':' + Date.now());
    var saved = {
      id: id,
      itemType: 'engineering-workflow',
      itemKey: id,
      toolSlug: 'engineering',
      title: item.title || 'Engineering project workflow',
      summary: item.summary || 'Saved workflow from the Engineering hub.',
      href: item.href || '/engineering/',
      updatedAt: nowIso(),
      sourceHref: item.href || '/engineering/',
      syncStatus: 'local',
      steps: Array.isArray(item.steps) ? item.steps : [],
      projectType: item.projectType || '',
      stage: item.stage || '',
      need: item.need || '',
      payload: item,
      meta: { category: 'engineering', dashboardSurface: 'engineering' }
    };
    upsertLocalList(WORKFLOW_KEY, saved);
    return syncWorkspaceItem(saved).then(function (status) {
      saved.syncStatus = status;
      upsertLocalList(WORKFLOW_KEY, saved);
      return saved;
    });
  }

  function labelFor(el) {
    if (!el) return '';
    if (el.id) {
      var labels = document.getElementsByTagName('label');
      for (var i = 0; i < labels.length; i++) {
        if (labels[i].getAttribute('for') === el.id) return text(labels[i].textContent);
      }
    }
    var field = el.closest && el.closest('.en-field, .proj-field, .adj-row, .fp-ai-bar-inner');
    if (field) {
      var found = field.querySelector('label, .en-label');
      if (found) return text(found.textContent);
    }
    return el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.id || el.name || el.tagName;
  }

  function optionText(select) {
    if (!select || select.selectedIndex < 0) return select ? select.value : '';
    return select.options[select.selectedIndex].text || select.value;
  }

  function harvestControls(root) {
    root = root || document;
    var controls = root.querySelectorAll('input, select, textarea');
    var out = [];
    for (var i = 0; i < controls.length; i++) {
      var el = controls[i];
      if (!el.id && !el.name) continue;
      if (el.closest && el.closest('.eng-toolkit, .eng-floating-panel')) continue;
      if (el.type === 'hidden' || el.type === 'file' || el.disabled) continue;
      var value = '';
      if (el.type === 'checkbox') value = el.checked ? 'Yes' : 'No';
      else if (el.tagName.toLowerCase() === 'select') value = optionText(el);
      else value = el.value;
      value = text(value);
      if (!value) continue;
      out.push({ id: el.id || el.name, label: labelFor(el), value: value });
    }
    return out.slice(0, 18);
  }

  function findControlValue(controls, id) {
    for (var i = 0; i < controls.length; i++) {
      if (controls[i].id === id) return controls[i].value;
    }
    return '';
  }

  function harvestResults() {
    var selectors = [
      '.en-results.on',
      '.summary',
      '.running-total',
      '#summaryTotals',
      '#st-results.on',
      '#fc-results.on',
      '#fpCostContent',
      '#cad-app #status-bar'
    ];
    var results = [];
    for (var i = 0; i < selectors.length; i++) {
      var nodes = document.querySelectorAll(selectors[i]);
      for (var j = 0; j < nodes.length; j++) {
        var value = text(nodes[j].textContent);
        if (value) results.push(value.slice(0, 360));
      }
    }
    return results.slice(0, 4);
  }

  function applyPreset(preset) {
    var values = preset.values || {};
    for (var id in values) {
      if (!Object.prototype.hasOwnProperty.call(values, id)) continue;
      var el = document.getElementById(id);
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = values[id] === true || values[id] === 'true' || values[id] === 'yes';
      else el.value = values[id];
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (preset.note) {
      var note = document.querySelector('.eng-site-note');
      if (note) note.value = preset.note;
    }
    var firstCalc = document.querySelector('.en-btn, button[onclick*="calc"], button[onclick*="calculate"], #fpAiGenerate');
    if (firstCalc && preset.autoRun) firstCalc.click();
  }

  function dynamicRisks(config, controls) {
    var risks = config.risks.slice(0);
    for (var i = 0; i < config.thresholds.length; i++) {
      var rule = config.thresholds[i];
      var value = parseFloat(findControlValue(controls, rule.id));
      if (!isFinite(value)) continue;
      if (rule.min != null && value >= rule.min) risks.unshift(rule.message);
      if (rule.max != null && value <= rule.max) risks.unshift(rule.message);
    }
    if (config.afrodraft && window.app && window.app.engine) {
      var entities = window.app.engine.entities;
      var count = entities && typeof entities.size === 'number' ? entities.size : 0;
      risks.unshift(count + ' drawing entities detected in the current AfroDraft session.');
    }
    return risks.slice(0, 8);
  }

  function buildTextPack(config, controls, results, formValues, risks) {
    var mode = formValues.mode || config.modes[0];
    var pressure = formValues.pressure || 'Normal';
    var confidence = formValues.confidence || 'Medium';
    var buffer = formValues.buffer || '10';
    var note = formValues.note || 'No site note added.';
    var lines = [];
    lines.push(config.name);
    lines.push('Mode: ' + mode);
    lines.push('Delivery pressure: ' + pressure);
    lines.push('Quote confidence: ' + confidence);
    lines.push('Suggested buffer: ' + buffer + '%');
    lines.push('');
    lines.push('Captured assumptions:');
    if (controls.length) {
      for (var i = 0; i < Math.min(controls.length, 10); i++) {
        lines.push('- ' + controls[i].label + ': ' + controls[i].value);
      }
    } else {
      lines.push('- No calculator inputs detected on this page.');
    }
    if (results.length) {
      lines.push('');
      lines.push('Visible result snapshot:');
      for (var r = 0; r < results.length; r++) lines.push('- ' + results[r]);
    }
    lines.push('');
    lines.push('Checks:');
    for (var c = 0; c < config.checks.length; c++) lines.push('- ' + config.checks[c]);
    lines.push('');
    lines.push('Risk flags:');
    for (var k = 0; k < risks.length; k++) lines.push('- ' + risks[k]);
    lines.push('');
    lines.push('Procurement notes:');
    for (var p = 0; p < config.procurement.length; p++) lines.push('- ' + config.procurement[p]);
    lines.push('');
    lines.push('Site note: ' + note);
    return lines.join('\n');
  }

  function readToolkitValues(shell) {
    return {
      mode: shell.querySelector('[data-eng-field="mode"]').value,
      pressure: shell.querySelector('[data-eng-field="pressure"]').value,
      confidence: shell.querySelector('[data-eng-field="confidence"]').value,
      buffer: shell.querySelector('[data-eng-field="buffer"]').value,
      note: shell.querySelector('[data-eng-field="note"]').value
    };
  }

  function listHtml(items, ordered) {
    var tag = ordered ? 'ol' : 'ul';
    var html = '<' + tag + '>';
    for (var i = 0; i < items.length; i++) html += '<li>' + esc(items[i]) + '</li>';
    html += '</' + tag + '>';
    return html;
  }

  function buildOutput(config, shell) {
    var controls = harvestControls();
    var results = harvestResults();
    var values = readToolkitValues(shell);
    var risks = dynamicRisks(config, controls);
    var copy = buildTextPack(config, controls, results, values, risks);
    var assumptions = controls.length ? controls.slice(0, 8).map(function (item) {
      return item.label + ': ' + item.value;
    }) : ['No calculator inputs detected yet. Run the app, then rebuild this pack.'];

    var companionHtml = '';
    for (var i = 0; i < config.companions.length; i++) {
      companionHtml += '<a href="' + esc(config.companions[i].href) + '">' + esc(config.companions[i].label) + '</a>';
    }

    var output = shell.querySelector('.eng-output');
    output.innerHTML =
      '<div class="eng-status-strip">' +
      '<span class="eng-status-pill">Mode: ' + esc(values.mode) + '</span>' +
      '<span class="eng-status-pill">Pressure: ' + esc(values.pressure) + '</span>' +
      '<span class="eng-status-pill">Buffer: ' + esc(values.buffer) + '%</span>' +
      '</div>' +
      '<div class="eng-output-grid">' +
      '<div class="eng-card"><h4>Assumptions Captured</h4>' + listHtml(assumptions, false) + '</div>' +
      '<div class="eng-card"><h4>Risk Flags</h4>' + listHtml(risks, false) + '</div>' +
      '<div class="eng-card"><h4>Procurement Notes</h4>' + listHtml(config.procurement, false) + '</div>' +
      '<div class="eng-card"><h4>Work Sequence</h4>' + listHtml(config.sequence, true) + '</div>' +
      '</div>' +
      (config.benchmark ? '<div class="eng-card eng-benchmark"><h4>Market Check Upgrade</h4><p>' + esc(config.benchmark) + '</p></div>' : '') +
      '<div class="eng-card"><h4>Companion Tools</h4><div class="eng-companions">' + companionHtml + '</div></div>' +
      '<div class="eng-save-status" aria-live="polite">Saved on this device. Use Save Dashboard to sync when signed in.</div>' +
      '<textarea class="eng-copybox" readonly>' + esc(copy) + '</textarea>';
    output.classList.add('is-on');
    output.dataset.copyText = copy;
    shell._engLatestPack = { config: config, copy: copy, controls: controls, results: results, values: values, risks: risks };
    try {
      localStorage.setItem('afrotools:' + normalizePath(window.location.pathname) + ':engineering-pack', copy);
    } catch (err) {}
    persistPack(shell, false);
  }

  function copyPack(shell) {
    var output = shell.querySelector('.eng-output');
    var value = output ? output.dataset.copyText : '';
    if (!value) {
      buildOutput(shell._engConfig, shell);
      output = shell.querySelector('.eng-output');
      value = output ? output.dataset.copyText : '';
    }
    if (!value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        flash(shell, 'Copied');
      }).catch(function () {
        fallbackCopy(shell, value);
      });
    } else {
      fallbackCopy(shell, value);
    }
  }

  function fallbackCopy(shell, value) {
    var box = shell.querySelector('.eng-copybox');
    if (box) {
      box.focus();
      box.select();
      try { document.execCommand('copy'); } catch (err) {}
      flash(shell, 'Selected');
      return;
    }
    var temp = document.createElement('textarea');
    temp.value = value;
    document.body.appendChild(temp);
    temp.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(temp);
    flash(shell, 'Copied');
  }

  function hasLeadAccess() {
    try {
      for (var i = 0; i < EMAIL_GATE_KEYS.length; i++) {
        if (localStorage.getItem(EMAIL_GATE_KEYS[i])) return true;
      }
      var auth = JSON.parse(localStorage.getItem('afrotools-auth') || '{}');
      if (auth && (auth.email || auth.tier === 'pro')) return true;
    } catch (err) {}
    try {
      if (window.AfroAuth && AfroAuth.getUser && AfroAuth.getUser()) return true;
    } catch (err2) {}
    return false;
  }

  function rememberLead(email) {
    try {
      localStorage.setItem('afrotools-email-gate', email);
      localStorage.setItem('afrotools_lead_email', email);
    } catch (err) {}
  }

  function captureLead(payload) {
    var data = payload || {};
    try {
      fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          source: 'engineering-pdf-gate',
          toolSlug: data.toolSlug || toolSlugFromPath(window.location.pathname),
          name: data.name || null,
          company: data.company || null,
          role: data.role || null,
          industry: 'Construction',
          pageUrl: window.location.href,
          referrerUrl: document.referrer || null
        })
      }).catch(function () {});
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'pdf-leads',
          email: data.email,
          name: data.name || '',
          company: data.company || '',
          role: data.role || '',
          source: 'engineering-pdf-gate',
          tool: data.toolSlug || toolSlugFromPath(window.location.pathname)
        }).toString()
      }).catch(function () {});
    } catch (err) {}
  }

  function showLeadGate(meta, callback) {
    var old = document.querySelector('.eng-lead-overlay');
    if (old) old.remove();
    var toolName = (meta && meta.toolName) || document.title.replace(/\s+\|\s+AfroTools.*/i, '') || 'Engineering report';
    var overlay = document.createElement('div');
    overlay.className = 'eng-lead-overlay';
    overlay.innerHTML =
      '<div class="eng-lead-modal" role="dialog" aria-modal="true" aria-label="Download engineering report">' +
      '<button type="button" class="eng-lead-close" aria-label="Close">x</button>' +
      '<p class="eng-lead-kicker">Engineering PDF gate</p>' +
      '<h2>Send the export to your workspace</h2>' +
      '<p>Enter your work email before downloading this ' + esc(toolName) + ' report. We store the address on this device so future exports are faster.</p>' +
      '<form class="eng-lead-form">' +
      '<input type="email" name="email" placeholder="Work email" required autocomplete="email">' +
      '<input type="text" name="name" placeholder="Full name" required autocomplete="name">' +
      '<input type="text" name="company" placeholder="Company or project" required autocomplete="organization">' +
      '<button type="submit">Continue to export</button>' +
      '</form>' +
      '<small>No spam. This is used for report delivery, product follow-up, and dashboard recovery.</small>' +
      '</div>';
    document.body.appendChild(overlay);
    var form = overlay.querySelector('form');
    var email = overlay.querySelector('[name="email"]');
    var close = overlay.querySelector('.eng-lead-close');
    function dismiss() { overlay.remove(); }
    close.addEventListener('click', dismiss);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) dismiss();
    });
    setTimeout(function () { if (email) email.focus(); }, 30);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var value = text(form.email.value);
      var name = text(form.name.value);
      var company = text(form.company.value);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || !name || !company) return;
      rememberLead(value);
      captureLead({
        email: value,
        name: name,
        company: company,
        role: 'Engineering user',
        toolSlug: (meta && meta.toolSlug) || toolSlugFromPath(window.location.pathname)
      });
      dismiss();
      callback();
    });
  }

  function withLeadGate(callback, meta) {
    if (hasLeadAccess()) {
      callback();
      return;
    }
    showLeadGate(meta || {}, callback);
  }

  function wirePdfGates() {
    var selector = '[onclick*="download" i],[onclick*="export" i],[onclick*="print" i],.pdf-btn,.download-pdf,[data-action="pdf"],.act-pdf';
    var buttons = document.querySelectorAll(selector);
    for (var i = 0; i < buttons.length; i++) {
      (function (button) {
        if (!button || button.dataset.engGateReady === '1' || button.dataset.noGate === 'true') return;
        if (button.closest && button.closest('.eng-toolkit, .eng-floating-panel')) return;
        var id = (button.id || '').toLowerCase();
        if (id.indexOf('mode') === 0 || button.classList.contains('mode-btn')) return;
        var inline = button.getAttribute('onclick');
        if (!inline) return;
        button.dataset.engGateReady = '1';
        button.dataset.engOrigAction = inline;
        button.removeAttribute('onclick');
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          withLeadGate(function () {
            try {
              new Function(inline).call(button);
            } catch (err) {
              console.warn('[Engineering gate] export action failed:', err.message || err);
            }
          }, {
            toolName: document.title.replace(/\s+\|\s+AfroTools.*/i, ''),
            toolSlug: toolSlugFromPath(window.location.pathname)
          });
        });
      })(buttons[i]);
    }
  }

  function flash(shell, label) {
    var btn = shell.querySelector('[data-eng-action="copy"]');
    if (!btn) return;
    var old = btn.textContent;
    btn.textContent = label;
    setTimeout(function () { btn.textContent = old; }, 1200);
  }

  function renderInner(config) {
    var modeOptions = config.modes.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('');
    var presetHtml = '';
    for (var i = 0; i < config.presets.length; i++) {
      presetHtml += '<button type="button" class="eng-preset" data-preset="' + i + '">' + esc(config.presets[i].label) + '</button>';
    }
    return '<section class="eng-toolkit" aria-label="' + esc(config.name) + '">' +
      '<div class="eng-toolkit-head">' +
      '<div><div class="eng-toolkit-kicker">' + esc(config.kicker || 'Engineering pack') + '</div>' +
      '<h2 class="eng-toolkit-title">' + esc(config.name) + '</h2>' +
      '<p class="eng-toolkit-copy">' + esc(config.description) + '</p></div>' +
      '<div class="eng-toolkit-actions">' +
      '<button type="button" class="eng-btn eng-btn-primary" data-eng-action="build">Build Pack</button>' +
      '<button type="button" class="eng-btn eng-btn-dashboard" data-eng-action="dashboard">Save Dashboard</button>' +
      '<button type="button" class="eng-btn" data-eng-action="copy">Copy</button>' +
      '<button type="button" class="eng-btn eng-btn-gold" data-eng-action="print">Print</button>' +
      '</div></div>' +
      '<div class="eng-toolkit-body">' +
      (presetHtml ? '<div class="eng-presets">' + presetHtml + '</div>' : '') +
      '<div class="eng-grid">' +
      '<div class="eng-panel"><h3>Project Context</h3><div class="eng-field-grid">' +
      '<div class="eng-field"><label class="eng-label">Mode</label><select class="eng-select" data-eng-field="mode">' + modeOptions + '</select></div>' +
      '<div class="eng-field"><label class="eng-label">Delivery Pressure</label><select class="eng-select" data-eng-field="pressure"><option>Normal</option><option>Fast quote</option><option>Urgent site decision</option><option>Audit only</option></select></div>' +
      '<div class="eng-field"><label class="eng-label">Quote Confidence</label><select class="eng-select" data-eng-field="confidence"><option>Medium</option><option>Low</option><option>High</option><option>Supplier confirmed</option></select></div>' +
      '<div class="eng-field"><label class="eng-label">Buffer %</label><input class="eng-input" data-eng-field="buffer" type="number" min="0" max="50" value="10"></div>' +
      '<div class="eng-field eng-field-full"><label class="eng-label">Site Note</label><textarea class="eng-textarea eng-site-note" data-eng-field="note" placeholder="Access, soil, client constraint, supplier quote, drawing revision..."></textarea></div>' +
      '</div></div>' +
      '<div class="eng-panel"><h3>Checks To Keep</h3>' + listHtml(config.checks.slice(0, 5), false) +
      (config.benchmark ? '<div class="eng-market-note"><strong>Market check:</strong> ' + esc(config.benchmark) + '</div>' : '') + '</div>' +
      '</div><div class="eng-output" aria-live="polite"></div></div>' +
      '</section>';
  }

  function wireShell(shell, config) {
    shell._engConfig = config;
    shell.addEventListener('click', function (event) {
      var preset = event.target.closest('[data-preset]');
      if (preset) {
        applyPreset(config.presets[parseInt(preset.getAttribute('data-preset'), 10)]);
        buildOutput(config, shell);
        return;
      }
      var action = event.target.closest('[data-eng-action]');
      if (!action) return;
      var name = action.getAttribute('data-eng-action');
      if (name === 'build') buildOutput(config, shell);
      if (name === 'copy') copyPack(shell);
      if (name === 'dashboard') {
        var status = shell.querySelector('.eng-save-status');
        if (status) status.textContent = 'Saving to dashboard...';
        persistPack(shell, true).then(function (syncStatus) {
          if (status) status.textContent = syncStatus === 'cloud' ? 'Saved locally and synced to your account workspace.' : 'Saved locally. Sign in to sync it across devices.';
        });
      }
      if (name === 'print') {
        withLeadGate(function () { window.print(); }, { toolName: config.name, toolSlug: toolSlugFromPath(window.location.pathname) });
      }
    });
  }

  function insertBlock(config) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = renderInner(config);
    var shell = wrapper.firstElementChild;
    wireShell(shell, config);

    var anchor;
    if (config.kind === 'category') {
      anchor = document.querySelector('.quote') || document.querySelector('.hero');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(shell, anchor.nextSibling);
      else document.body.appendChild(shell);
      return;
    }

    anchor = document.querySelector('main .en-container') ||
      document.querySelector('main') ||
      document.querySelector('.landing-page') ||
      document.querySelector('.main') ||
      document.body;

    if (anchor.classList && anchor.classList.contains('landing-page')) {
      var firstSection = anchor.querySelector('.landing-section, .landing-saved');
      if (firstSection) anchor.insertBefore(shell, firstSection);
      else anchor.appendChild(shell);
    } else {
      anchor.appendChild(shell);
    }
  }

  function insertFloating(config) {
    var launch = document.createElement('button');
    launch.type = 'button';
    launch.className = 'eng-floating-launch';
    launch.textContent = 'Engineering Pack';
    var panel = document.createElement('aside');
    panel.className = 'eng-floating-panel';
    panel.innerHTML = renderInner(config);
    document.body.appendChild(launch);
    document.body.appendChild(panel);
    var shell = panel.querySelector('.eng-toolkit');
    wireShell(shell, config);
    launch.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function init() {
    var config = getConfig();
    wirePdfGates();
    if (!config) return;
    if (document.querySelector('.eng-toolkit, .eng-floating-launch')) return;
    if (config.floating) insertFloating(config);
    else insertBlock(config);
    setTimeout(wirePdfGates, 250);
  }

  window.AfroEngineering = window.AfroEngineering || {};
  window.AfroEngineering.saveWorkflow = saveWorkflowToDashboard;
  window.AfroEngineering.withLeadGate = withLeadGate;
  window.AfroEngineering.wirePdfGates = wirePdfGates;
  window.AfroEngineering.keys = { packs: PACK_KEY, workflows: WORKFLOW_KEY };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
