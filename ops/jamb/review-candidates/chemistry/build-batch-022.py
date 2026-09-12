"""Private Chemistry review, normalized records 841–850. No shared bank writes."""
import copy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]; OUT=Path(__file__).parent
qs=[q for q in json.loads((ROOT/'ops/jamb/source-pool.json').read_text(encoding='utf8'))['questions'] if q['subject']=='chemistry'][840:850]
RX='https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions'
GAS='https://openstax.org/books/chemistry-2e/pages/9-4-effusion-and-diffusion-of-gases'
EL='https://openstax.org/books/chemistry/pages/17-7-electrolysis'
REB='https://elearning.reb.rw/pluginfile.php/11670/mod_resource/content/1/S3%20Chemistry%20SB.pdf'
rows=[]
def page(q):
 return 68 if q['year']==2003 else 70

def yes(i,a,e,urls,*,question=None,options=None,year=None,num=None,audit='',check=None):
 q=qs[i-841];u=copy.deepcopy(q)
 if year:u['year']=year
 if num:u['num']=num
 if question:u['question']=question
 if options:u['options']=dict(zip('ABCDE',options))
 u['answer']=a;u['ai_explanation']=e;u['has_diagram']=False;u['format']=len(u['options'])
 rows.append({'id':q['id'],'before':q,'update':u,'source_pdf_page':page(u),'actual_source_year':u['year'],'actual_source_number':u['num'],'publication_candidate':True,'review_method':'ai-calculation-checked' if check else 'ai-source-checked','independent_reasoning':e,'source_urls':urls,'source_checked_at':'2026-09-12','private_repair_history':audit or 'Compared complete question and options against the supplied PDF; independently solved and wrote a teaching explanation.','calculation_check':check})
def no(i,why,*,year=None,answer=None):
 q=qs[i-841];temp={**q,'year':year or q['year']}
 rows.append({'id':q['id'],'before':q,'update':None,'source_pdf_page':page(temp),'actual_source_year':temp['year'],'actual_source_number':temp['num'],'publication_candidate':False,'hold_reason':why,'independently_indicated_answer':answer,'source_checked_at':'2026-09-12'})
ORG='https://openstax.org/books/chemistry-2e/pages/20-1-hydrocarbons'
CARB='https://edu.rsc.org/resources/carbonyl-chemistry-16-18/4010284.article'
ACID='https://openstax.org/books/chemistry-2e/pages/14-2-ph-and-poh'
CAT='https://openstax.org/books/chemistry-2e/pages/12-7-catalysis'

yes(841,'B','The outer s and nearby d electrons of transition metals can participate in bonding or ion formation. Their relatively similar energies allow different numbers of electrons to be involved, producing several oxidation states.',[REB],question='Variable oxidation states of transition metals are closely associated with participation of their',options=['s electrons alone','d electrons as well as outer s electrons','Partly filled p orbitals','Variable numbers of p electrons'],audit='Clarified d participation alongside s rather than claiming d occupancy alone sufficient.')
yes(842,'D','Porous charcoal adsorbs coloured substances onto its large internal surface. Activated charcoal is therefore useful for removing colour from solutions such as sugar solutions.',[REB],question='Which form of carbon is used to decolourise sugar solutions?',options=['Soot','Lampblack','Graphite','Charcoal'],audit='Used form rather than implying charcoal is a single pure crystalline allotrope.')
no(843,'Hybridisation models bonding but is not alone a cause of carbon tetravalence. Carbon can form four bonds in sp3/sp2/sp environments; none of options states four valence electrons and bond formation accurately. Do not teach all carbon must sp3-hybridise.')
no(844,'B and D both explain protective oil storage: sodium reacts with water/moisture and exposed air. C can also describe reactions with air components. No mutually exclusive criterion; cannot select broad D while calling B false.')
yes(845,'D','Catalytic reforming rearranges hydrocarbon structures and can form branched, cyclic or aromatic molecules. It improves fuel properties such as octane rating; cracking chiefly breaks larger molecules into smaller ones.',[ORG],question='In petroleum refining, the process that rearranges hydrocarbon structures to improve fuel quality is',options=['Catalytic cracking','Hydrocracking','Polymerisation','Reforming'],year=2003,audit='Actual2003Q48 PDF68, not2004; original stable ID preserved.')
yes(846,'A','A common alloy-making method melts and mixes the constituent metals, then allows the mixture to solidify. This distributes the constituents through the resulting metallic material.',[REB],question='A common method of preparing an alloy from metals is',options=['Cooling a molten mixture of the metals','Reducing a mixture of their metallic oxides','Arc welding','Electroplating'],audit='Removed universal best claim because other alloy-production methods exist.')
yes(847,'B','Cotton fibres consist mainly of cellulose, a polymer of glucose units joined by β(1→4) glycosidic bonds. Starch is a different glucose polymer used chiefly for energy storage.',[ORG],question='The main structural substance in cotton fibre is',options=['Starch','Cellulose','Fat','Oil'],year=2003,audit='Actual2003Q49 PDF68, not2004; preserved stable ID.')
yes(848,'B','Sulfur dioxide acts as a reducing bleaching agent, converting susceptible coloured substances into colourless forms. In some materials the colour can return when air reoxidises the reduced substance.',[REB],question='The characteristic bleaching action of sulfur(IV) oxide is by',options=['Hydration','Reduction','Absorption','Oxidation'])
yes(849,'A','Natural gas consists mainly of methane, CH₄, although its composition varies and it can also contain ethane, propane and other components.',[ORG],question='The principal hydrocarbon constituent of natural gas is',options=['Methane','Ethane','Propane','Butane'],year=2003,audit='Actual2003Q50 PDF68, not2004; preserved stable ID.')
no(850,'Downward delivery can collect gases denser than air. Both oxygen and chlorine satisfy this; oxygen is often collected over water but can also use air displacement. Stem says can, not best, so no unique C answer without changed premise.')
assert len(rows)==10
b={'schema_version':1,'batch_id':'chemistry-earliest-normalized-022','reviewed_at':'2026-09-12','reviewer':'Codex (AI), independent chemistry review','base_commit':'f6b5ab0beb0b24a15cdde38f0b7e6c2dc4043540','source_file':'CHEMISTRY-JAMB-Past-Questions.pdf','source_pdf_sha256':'d70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75','scope':'Normalized Chemistry841–850; source2003–2004. PDF68/70 visually inspected; full source context and independently solved answers.','counts':{'examined':10,'candidates':sum(r['publication_candidate'] for r in rows),'held':sum(not r['publication_candidate'] for r in rows)},'records':rows}
(OUT/'batch-022.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(b['counts'])
