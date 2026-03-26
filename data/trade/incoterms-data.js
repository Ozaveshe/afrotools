/* AfroTools — Incoterms 2020 Data /data/trade/incoterms-data.js */
var INCOTERMS_DATA = (function() {
  'use strict';

  var terms = [
    {
      code: 'EXW', name: 'Ex Works', group: 'E', groupName: 'Departure',
      transport: 'any', transportIcon: '🚢✈️🚛',
      riskTransfer: 'Seller\'s named premises (factory/warehouse)',
      sellerPays: ['Packaging'],
      buyerPays: ['Loading at origin', 'Export customs clearance', 'Export duties/taxes', 'Inland transport (origin)', 'Main freight (sea/air)', 'Cargo insurance', 'Import customs clearance', 'Import duties & taxes', 'Inland transport (destination)', 'Unloading'],
      sellerRisk: 'Until goods are placed at buyer\'s disposal at seller\'s premises',
      buyerRisk: 'From seller\'s premises to final destination — ALL risk on buyer',
      bestFor: 'Buyer wants maximum control over entire logistics chain.',
      africaNote: 'Common for factory pickups in China/India. African buyer must arrange export customs in origin country — often difficult. Risky unless buyer has local agent in origin country.',
      popularity: 2,
      color: '#6B7280'
    },
    {
      code: 'FCA', name: 'Free Carrier', group: 'F', groupName: 'Pre-Carriage',
      transport: 'any', transportIcon: '🚢✈️🚛',
      riskTransfer: 'Named carrier location (seller\'s premises or carrier\'s terminal)',
      sellerPays: ['Packaging', 'Loading at origin', 'Export customs clearance', 'Export duties', 'Inland transport to named carrier location'],
      buyerPays: ['Main freight (sea/air)', 'Cargo insurance', 'Import customs clearance', 'Import duties & taxes', 'Inland transport (destination)', 'Unloading'],
      sellerRisk: 'Until goods are handed to carrier at named location',
      buyerRisk: 'From the moment goods are handed to carrier',
      bestFor: 'Most versatile Incoterm. Ideal for containerized cargo. Better than FOB for containers.',
      africaNote: 'Recommended for African importers buying from China/Turkey. Seller handles export procedures in their country — buyer arranges international shipping. Works with LC (FCA seller\'s premises with on-board BL notation).',
      popularity: 5,
      color: '#3B82F6'
    },
    {
      code: 'FAS', name: 'Free Alongside Ship', group: 'F', groupName: 'Pre-Carriage',
      transport: 'sea/inland waterway only', transportIcon: '🚢',
      riskTransfer: 'Alongside vessel at port of shipment',
      sellerPays: ['Packaging', 'Inland transport to port', 'Export customs clearance', 'Export duties', 'Delivery alongside vessel'],
      buyerPays: ['Loading onto vessel', 'Main freight', 'Cargo insurance', 'Import customs clearance', 'Import duties & taxes', 'Inland transport (destination)'],
      sellerRisk: 'Until goods are placed alongside the vessel at origin port',
      buyerRisk: 'From the moment goods are placed alongside vessel',
      bestFor: 'Bulk cargo like grain, oil, minerals where goods are loaded via crane.',
      africaNote: 'Used for commodity exports (coal, grain, ores) from African ports. Less common for manufactured goods.',
      popularity: 2,
      color: '#6B7280'
    },
    {
      code: 'FOB', name: 'Free On Board', group: 'F', groupName: 'Pre-Carriage',
      transport: 'sea/inland waterway only', transportIcon: '🚢',
      riskTransfer: 'On board vessel at port of shipment',
      sellerPays: ['Packaging', 'Inland transport (origin)', 'Export customs clearance', 'Export duties', 'Loading onto vessel'],
      buyerPays: ['Main freight', 'Cargo insurance', 'Import customs clearance', 'Import duties & taxes', 'Inland transport (destination)', 'Unloading'],
      sellerRisk: 'Until goods are loaded on board vessel at origin port',
      buyerRisk: 'Once goods are on board vessel at origin port',
      bestFor: 'Buyer arranges and pays for shipping. Most common for bulk/commodity trade.',
      africaNote: 'Very common in Africa. Most duty calculations use FOB as base value. African customs declarations require FOB value declaration. Use FCA instead for containerized cargo — FOB technically applies once goods cross the ship\'s rail.',
      popularity: 5,
      color: '#3B82F6'
    },
    {
      code: 'CFR', name: 'Cost and Freight', group: 'C', groupName: 'Main Carriage Paid',
      transport: 'sea/inland waterway only', transportIcon: '🚢',
      riskTransfer: 'On board vessel at port of shipment (NOTE: risk ≠ cost transfer point)',
      sellerPays: ['Packaging', 'Inland transport (origin)', 'Export customs clearance', 'Export duties', 'Loading onto vessel', 'Main freight to destination port'],
      buyerPays: ['Cargo insurance', 'Import customs clearance', 'Import duties & taxes', 'Inland transport (destination)', 'Unloading'],
      sellerRisk: 'Until goods are on board at origin — even though seller pays freight to destination',
      buyerRisk: 'From origin port once goods are on board — risk and cost split at different points!',
      bestFor: 'Seller arranges shipping. Useful when seller has better freight rates.',
      africaNote: 'WARNING: Risk transfers at origin port, NOT destination. Buyer bears all risk during the ocean voyage despite seller paying freight. African buyers should always arrange additional cargo insurance on CFR terms.',
      popularity: 3,
      color: '#F59E0B'
    },
    {
      code: 'CIF', name: 'Cost, Insurance and Freight', group: 'C', groupName: 'Main Carriage Paid',
      transport: 'sea/inland waterway only', transportIcon: '🚢',
      riskTransfer: 'On board vessel at port of shipment (seller pays freight + minimum insurance)',
      sellerPays: ['Packaging', 'Inland transport (origin)', 'Export customs clearance', 'Export duties', 'Loading onto vessel', 'Main freight', 'Minimum cargo insurance (110% of value)'],
      buyerPays: ['Import customs clearance', 'Import duties & taxes', 'Inland transport (destination)', 'Unloading'],
      sellerRisk: 'Until goods are on board vessel at origin port',
      buyerRisk: 'During ocean transit (seller only provides minimum insurance — buyer may want more)',
      bestFor: 'Most common for African imports. Standard for customs valuation.',
      africaNote: 'CIF is THE standard for African customs valuation. Import duty = CIF value × duty rate. Almost all African customs authorities use CIF as the dutiable value base. If quoting FOB, add freight + insurance to estimate CIF for duty calculation.',
      popularity: 5,
      color: '#10B981'
    },
    {
      code: 'CPT', name: 'Carriage Paid To', group: 'C', groupName: 'Main Carriage Paid',
      transport: 'any', transportIcon: '🚢✈️🚛',
      riskTransfer: 'When goods are handed to first carrier (seller pays freight to named destination)',
      sellerPays: ['Packaging', 'Inland transport (origin)', 'Export customs clearance', 'Export duties', 'All carriage costs to named destination'],
      buyerPays: ['Cargo insurance', 'Import customs clearance', 'Import duties & taxes', 'Unloading at destination'],
      sellerRisk: 'Until handed to first carrier',
      buyerRisk: 'From first carrier — even though freight is paid to destination',
      bestFor: 'Multimodal transport. FCA equivalent for multi-modal with seller paying freight.',
      africaNote: 'Good for air freight and multimodal shipments to Africa. CPT plus insurance = CIP.',
      popularity: 2,
      color: '#6B7280'
    },
    {
      code: 'CIP', name: 'Carriage and Insurance Paid To', group: 'C', groupName: 'Main Carriage Paid',
      transport: 'any', transportIcon: '🚢✈️🚛',
      riskTransfer: 'When goods are handed to first carrier (seller pays freight + all-risks insurance)',
      sellerPays: ['Packaging', 'Inland transport (origin)', 'Export customs clearance', 'Export duties', 'All carriage to named destination', 'All-risks cargo insurance (Institute Cargo Clauses A)'],
      buyerPays: ['Import customs clearance', 'Import duties & taxes', 'Unloading at destination'],
      sellerRisk: 'Until handed to first carrier',
      buyerRisk: 'From first carrier — but seller provides comprehensive insurance (unlike CIF minimum)',
      bestFor: 'Air freight, multimodal. Provides better insurance than CIF (all-risks vs minimum).',
      africaNote: 'CIP requires Institute Cargo Clause A (all-risks) insurance — significantly better than CIF minimum (Clause C). Good for high-value goods shipped to Africa by air.',
      popularity: 2,
      color: '#6B7280'
    },
    {
      code: 'DAP', name: 'Delivered At Place', group: 'D', groupName: 'Delivery',
      transport: 'any', transportIcon: '🚢✈️🚛',
      riskTransfer: 'Named place of destination (ready for unloading by buyer)',
      sellerPays: ['Packaging', 'Export customs clearance', 'Export duties', 'All inland transport (origin)', 'Main freight', 'Cargo insurance', 'All inland transport (destination) up to named place'],
      buyerPays: ['Import customs clearance', 'Import duties & taxes', 'Unloading'],
      sellerRisk: 'Until goods are at destination, ready for unloading',
      buyerRisk: 'Only during unloading and after',
      bestFor: 'Buyer wants door delivery but handles own customs clearance.',
      africaNote: 'Good for African buyers who want door delivery but manage their own customs clearance. Seller takes risk during transit. Watch out: seller does NOT clear customs — buyer does. Any delays at customs accrue demurrage at buyer\'s risk.',
      popularity: 3,
      color: '#F59E0B'
    },
    {
      code: 'DPU', name: 'Delivered at Place Unloaded', group: 'D', groupName: 'Delivery',
      transport: 'any', transportIcon: '🚢✈️🚛',
      riskTransfer: 'Named place of destination, after unloading',
      sellerPays: ['Everything including unloading at destination', 'Export customs', 'Main freight', 'Insurance', 'All delivery to destination including unloading'],
      buyerPays: ['Import customs clearance', 'Import duties & taxes'],
      sellerRisk: 'Until goods are unloaded at destination — includes unloading risk',
      buyerRisk: 'Only after unloading is completed, and for customs',
      bestFor: 'Unique: seller is responsible for unloading (only Incoterm where seller unloads).',
      africaNote: 'Rare in Africa. Seller must be able to arrange unloading at African port/destination — often impractical.',
      popularity: 1,
      color: '#EF4444'
    },
    {
      code: 'DDP', name: 'Delivered Duty Paid', group: 'D', groupName: 'Delivery',
      transport: 'any', transportIcon: '🚢✈️🚛',
      riskTransfer: 'Named place of destination (seller handles EVERYTHING including import customs)',
      sellerPays: ['Everything — packaging, export customs, main freight, insurance, import customs, import duties, inland delivery to destination'],
      buyerPays: ['Nothing (possibly unloading from delivery vehicle)'],
      sellerRisk: 'Until goods are at named destination, duties paid',
      buyerRisk: 'Essentially zero — seller handles all',
      bestFor: 'Maximum buyer convenience. Seller has complete logistics control.',
      africaNote: 'RARE in Africa because sellers rarely want to handle African customs clearance. Complex import procedures, unpredictable costs. If a seller offers DDP to an African country, verify they have a bonded/licensed customs agent there. Many Chinese suppliers offer DDP but use informal channels — ensure legitimacy.',
      popularity: 1,
      color: '#EF4444'
    }
  ];

  var costComponents = [
    { id: 'packaging', label: 'Packaging & Marking', typical: 0.5 },
    { id: 'loading_origin', label: 'Loading at Origin', typical: 0.3 },
    { id: 'export_customs', label: 'Export Customs Clearance', typical: 0.2 },
    { id: 'inland_origin', label: 'Inland Transport (Origin)', typical: 1.5 },
    { id: 'loading_vessel', label: 'Loading onto Vessel/Aircraft', typical: 0.5 },
    { id: 'freight', label: 'Main Freight (Sea/Air)', typical: 8.0 },
    { id: 'insurance', label: 'Cargo Insurance', typical: 0.5 },
    { id: 'unloading_dest', label: 'Unloading at Destination Port', typical: 0.5 },
    { id: 'import_customs', label: 'Import Customs Clearance', typical: 1.0 },
    { id: 'duties_taxes', label: 'Import Duties & Taxes', typical: 15.0 },
    { id: 'inland_dest', label: 'Inland Transport (Destination)', typical: 3.0 },
    { id: 'delivery', label: 'Final Delivery to Warehouse', typical: 1.0 }
  ];

  // Which components each term's SELLER pays (true = seller pays)
  var sellerPaysMatrix = {
    EXW:  { packaging: true, loading_origin: false, export_customs: false, inland_origin: false, loading_vessel: false, freight: false, insurance: false, unloading_dest: false, import_customs: false, duties_taxes: false, inland_dest: false, delivery: false },
    FCA:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: false, freight: false, insurance: false, unloading_dest: false, import_customs: false, duties_taxes: false, inland_dest: false, delivery: false },
    FAS:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: false, freight: false, insurance: false, unloading_dest: false, import_customs: false, duties_taxes: false, inland_dest: false, delivery: false },
    FOB:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: true, freight: false, insurance: false, unloading_dest: false, import_customs: false, duties_taxes: false, inland_dest: false, delivery: false },
    CFR:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: true, freight: true, insurance: false, unloading_dest: false, import_customs: false, duties_taxes: false, inland_dest: false, delivery: false },
    CIF:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: true, freight: true, insurance: true, unloading_dest: false, import_customs: false, duties_taxes: false, inland_dest: false, delivery: false },
    CPT:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: true, freight: true, insurance: false, unloading_dest: false, import_customs: false, duties_taxes: false, inland_dest: false, delivery: false },
    CIP:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: true, freight: true, insurance: true, unloading_dest: false, import_customs: false, duties_taxes: false, inland_dest: false, delivery: false },
    DAP:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: true, freight: true, insurance: true, unloading_dest: true, import_customs: false, duties_taxes: false, inland_dest: true, delivery: true },
    DPU:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: true, freight: true, insurance: true, unloading_dest: true, import_customs: false, duties_taxes: false, inland_dest: true, delivery: true },
    DDP:  { packaging: true, loading_origin: true, export_customs: true, inland_origin: true, loading_vessel: true, freight: true, insurance: true, unloading_dest: true, import_customs: true, duties_taxes: true, inland_dest: true, delivery: true }
  };

  return { terms: terms, costComponents: costComponents, sellerPaysMatrix: sellerPaysMatrix };
})();

if (typeof module !== 'undefined') module.exports = { INCOTERMS_DATA: INCOTERMS_DATA };
