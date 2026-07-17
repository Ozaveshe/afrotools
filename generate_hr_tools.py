#!/usr/bin/env python3
"""
Generate HR & Payroll tool hub + country pages for AfroTools.
8 tools total: 6 x54-country + 2 x15-country.
Run: python generate_hr_tools.py
"""
import os, html

BASE = os.path.dirname(os.path.abspath(__file__))

# ── 54 African countries ──
COUNTRIES_54 = [
    ("NG", "nigeria", "Nigeria", "\U0001f1f3\U0001f1ec"),
    ("KE", "kenya", "Kenya", "\U0001f1f0\U0001f1ea"),
    ("ZA", "south-africa", "South Africa", "\U0001f1ff\U0001f1e6"),
    ("GH", "ghana", "Ghana", "\U0001f1ec\U0001f1ed"),
    ("EG", "egypt", "Egypt", "\U0001f1ea\U0001f1ec"),
    ("ET", "ethiopia", "Ethiopia", "\U0001f1ea\U0001f1f9"),
    ("TZ", "tanzania", "Tanzania", "\U0001f1f9\U0001f1ff"),
    ("UG", "uganda", "Uganda", "\U0001f1fa\U0001f1ec"),
    ("RW", "rwanda", "Rwanda", "\U0001f1f7\U0001f1fc"),
    ("CI", "cote-divoire", "C\u00f4te d'Ivoire", "\U0001f1e8\U0001f1ee"),
    ("CM", "cameroon", "Cameroon", "\U0001f1e8\U0001f1f2"),
    ("SN", "senegal", "Senegal", "\U0001f1f8\U0001f1f3"),
    ("MA", "morocco", "Morocco", "\U0001f1f2\U0001f1e6"),
    ("TN", "tunisia", "Tunisia", "\U0001f1f9\U0001f1f3"),
    ("AO", "angola", "Angola", "\U0001f1e6\U0001f1f4"),
    ("ZM", "zambia", "Zambia", "\U0001f1ff\U0001f1f2"),
    ("ZW", "zimbabwe", "Zimbabwe", "\U0001f1ff\U0001f1fc"),
    ("MZ", "mozambique", "Mozambique", "\U0001f1f2\U0001f1ff"),
    ("MW", "malawi", "Malawi", "\U0001f1f2\U0001f1fc"),
    ("MG", "madagascar", "Madagascar", "\U0001f1f2\U0001f1ec"),
    ("BW", "botswana", "Botswana", "\U0001f1e7\U0001f1fc"),
    ("NA", "namibia", "Namibia", "\U0001f1f3\U0001f1e6"),
    ("LS", "lesotho", "Lesotho", "\U0001f1f1\U0001f1f8"),
    ("SZ", "eswatini", "Eswatini", "\U0001f1f8\U0001f1ff"),
    ("MU", "mauritius", "Mauritius", "\U0001f1f2\U0001f1fa"),
    ("SC", "seychelles", "Seychelles", "\U0001f1f8\U0001f1e8"),
    ("DJ", "djibouti", "Djibouti", "\U0001f1e9\U0001f1ef"),
    ("ER", "eritrea", "Eritrea", "\U0001f1ea\U0001f1f7"),
    ("SO", "somalia", "Somalia", "\U0001f1f8\U0001f1f4"),
    ("SS", "south-sudan", "South Sudan", "\U0001f1f8\U0001f1f8"),
    ("SD", "sudan", "Sudan", "\U0001f1f8\U0001f1e9"),
    ("LY", "libya", "Libya", "\U0001f1f1\U0001f1fe"),
    ("DZ", "algeria", "Algeria", "\U0001f1e9\U0001f1ff"),
    ("CD", "dr-congo", "DR Congo", "\U0001f1e8\U0001f1e9"),
    ("CG", "republic-of-congo", "Republic of Congo", "\U0001f1e8\U0001f1ec"),
    ("TD", "chad", "Chad", "\U0001f1f9\U0001f1e9"),
    ("CF", "central-african-republic", "Central African Republic", "\U0001f1e8\U0001f1eb"),
    ("GA", "gabon", "Gabon", "\U0001f1ec\U0001f1e6"),
    ("GQ", "equatorial-guinea", "Equatorial Guinea", "\U0001f1ec\U0001f1f6"),
    ("ST", "sao-tome", "S\u00e3o Tom\u00e9 & Pr\u00edncipe", "\U0001f1f8\U0001f1f9"),
    ("KM", "comoros", "Comoros", "\U0001f1f0\U0001f1f2"),
    ("BI", "burundi", "Burundi", "\U0001f1e7\U0001f1ee"),
    ("BJ", "benin", "Benin", "\U0001f1e7\U0001f1ef"),
    ("BF", "burkina-faso", "Burkina Faso", "\U0001f1e7\U0001f1eb"),
    ("CV", "cape-verde", "Cape Verde", "\U0001f1e8\U0001f1fb"),
    ("GM", "gambia", "Gambia", "\U0001f1ec\U0001f1f2"),
    ("GN", "guinea", "Guinea", "\U0001f1ec\U0001f1f3"),
    ("GW", "guinea-bissau", "Guinea-Bissau", "\U0001f1ec\U0001f1fc"),
    ("LR", "liberia", "Liberia", "\U0001f1f1\U0001f1f7"),
    ("ML", "mali", "Mali", "\U0001f1f2\U0001f1f1"),
    ("NE", "niger", "Niger", "\U0001f1f3\U0001f1ea"),
    ("SL", "sierra-leone", "Sierra Leone", "\U0001f1f8\U0001f1f1"),
    ("TG", "togo", "Togo", "\U0001f1f9\U0001f1ec"),
    ("MR", "mauritania", "Mauritania", "\U0001f1f2\U0001f1f7"),
]

COUNTRIES_15 = COUNTRIES_54[:15]  # First 15 major economies

# ── Tool definitions ──
TOOLS = [
    {
        "slug": "employee-cost",
        "name": "Employee Cost Calculator",
        "short": "Total Cost to Company",
        "icon": "\U0001f4b8",
        "countries": 54,
        "data_scripts": ["/data/hr/employer-cost-data.js"],
        "engine_script": "/engines/employee-cost-engine.js",
        "seo_title": "Employee Cost Calculator {COUNTRY} 2026 \u2014 Total Cost to Company | AfroTools",
        "seo_desc": "Calculate the true cost of employing someone in {COUNTRY}. Gross salary + employer pension + social security + levies. See full employer contributions breakdown.",
        "hub_desc": "Enter gross salary \u2192 see the TRUE total cost to company. Pension, social security, skills levy, workers comp, insurance \u2014 all employer contributions broken down.",
        "form_fields": [
            {"id": "grossSalary", "label": "Gross Monthly Salary", "type": "number", "placeholder": "e.g. 500000", "prefix": True},
            {"id": "basicSalary", "label": "Basic Salary (if known)", "type": "number", "placeholder": "Leave blank for default", "prefix": True, "optional": True},
        ],
        "calc_fn": "AfroTools.HREngine.calculateEmployeeCost",
        "result_template": "employee-cost",
    },
    {
        "slug": "gratuity-calculator",
        "name": "Gratuity & Severance Calculator",
        "short": "End of Service",
        "icon": "\U0001f4b5",
        "countries": 54,
        "data_scripts": ["/data/hr/employer-cost-data.js", "/data/hr/severance-data.js"],
        "engine_script": "/engines/employee-cost-engine.js",
        "seo_title": "Gratuity & Severance Calculator {COUNTRY} 2026 | AfroTools",
        "seo_desc": "Calculate end-of-service gratuity or severance pay in {COUNTRY}. Statutory formulas, contractual defaults, and legal references.",
        "hub_desc": "Calculate end-of-service gratuity or severance pay. Statutory formulas, contractual defaults, and legal references for each country.",
        "form_fields": [
            {"id": "lastSalary", "label": "Last Monthly Salary", "type": "number", "placeholder": "e.g. 500000", "prefix": True},
            {"id": "yearsOfService", "label": "Years of Service", "type": "number", "placeholder": "e.g. 5"},
        ],
        "calc_fn": "AfroTools.HREngine.calculateSeverance",
        "result_template": "severance",
    },
    {
        "slug": "maternity-leave",
        "name": "Maternity & Paternity Leave Calculator",
        "short": "Parental Leave",
        "icon": "\U0001f930",
        "countries": 54,
        "data_scripts": ["/data/hr/employer-cost-data.js", "/data/hr/maternity-data.js"],
        "engine_script": "/engines/employee-cost-engine.js",
        "seo_title": "Maternity & Paternity Leave Calculator {COUNTRY} 2026 | AfroTools",
        "seo_desc": "Calculate maternity and paternity leave entitlements in {COUNTRY}. Duration, pay rate, who pays, eligibility, and legal references.",
        "hub_desc": "Duration, pay rate, who pays (employer vs social insurance), eligibility, and legal references for maternity and paternity leave.",
        "form_fields": [
            {"id": "monthlySalary", "label": "Monthly Salary", "type": "number", "placeholder": "e.g. 500000", "prefix": True},
        ],
        "calc_fn": "AfroTools.HREngine.calculateMaternity",
        "result_template": "maternity",
    },
    {
        "slug": "retrenchment-calculator",
        "name": "Retrenchment Package Calculator",
        "short": "Retrenchment",
        "icon": "\U0001f4e6",
        "countries": 54,
        "data_scripts": ["/data/hr/employer-cost-data.js", "/data/hr/severance-data.js"],
        "engine_script": "/engines/employee-cost-engine.js",
        "seo_title": "Retrenchment Package Calculator {COUNTRY} 2026 | AfroTools",
        "seo_desc": "Calculate the full retrenchment package in {COUNTRY}. Severance + notice pay + accrued leave payout. Know total obligations.",
        "hub_desc": "Full retrenchment package: severance + notice period pay + accrued leave payout. Know the total obligation before restructuring.",
        "form_fields": [
            {"id": "salary", "label": "Monthly Salary", "type": "number", "placeholder": "e.g. 500000", "prefix": True},
            {"id": "yearsOfService", "label": "Years of Service", "type": "number", "placeholder": "e.g. 5"},
            {"id": "unusedLeave", "label": "Unused Leave Days", "type": "number", "placeholder": "e.g. 15"},
        ],
        "calc_fn": "AfroTools.HREngine.calculateRetrenchment",
        "result_template": "retrenchment",
    },
    {
        "slug": "contractor-vs-employee",
        "name": "Contractor vs Employee Cost",
        "short": "Contractor Comparison",
        "icon": "\u2696\ufe0f",
        "countries": 54,
        "data_scripts": ["/data/hr/employer-cost-data.js", "/data/hr/severance-data.js"],
        "engine_script": "/engines/employee-cost-engine.js",
        "seo_title": "Contractor vs Employee Cost {COUNTRY} 2026 | AfroTools",
        "seo_desc": "Compare the cost of hiring a contractor vs employee in {COUNTRY}. Side-by-side: total cost, WHT, pension, social security savings.",
        "hub_desc": "Side-by-side comparison: same amount paid to a contractor vs employee. See total cost difference, WHT, pension savings, and compliance risk.",
        "form_fields": [
            {"id": "monthlyAmount", "label": "Monthly Amount", "type": "number", "placeholder": "e.g. 500000", "prefix": True},
        ],
        "calc_fn": "AfroTools.HREngine.contractorVsEmployee",
        "result_template": "contractor",
    },
    {
        "slug": "work-permit-cost",
        "name": "Work Permit Cost Guide",
        "short": "Work Permits",
        "icon": "\U0001f6c2",
        "countries": 54,
        "data_scripts": ["/data/hr/work-permit-data.js"],
        "engine_script": None,
        "seo_title": "Work Permit Cost & Requirements {COUNTRY} 2026 | AfroTools",
        "seo_desc": "Work permit costs, timelines, required documents, and issuing authorities in {COUNTRY}. Everything you need to hire foreign workers.",
        "hub_desc": "Costs, timelines, required documents, and issuing authorities for work permits across Africa.",
        "form_fields": [],
        "calc_fn": None,
        "result_template": "work-permit",
    },
    {
        "slug": "freelancer-rate",
        "name": "Freelancer Rate Card",
        "short": "Rate Card",
        "icon": "\U0001f4cb",
        "countries": 15,
        "data_scripts": ["/data/hr/freelancer-rates-data.js"],
        "engine_script": None,
        "seo_title": "Freelancer Rate Card {COUNTRY} 2026 \u2014 Market Rates by Skill | AfroTools",
        "seo_desc": "Market rates for freelancers in {COUNTRY}. Hourly, daily, and monthly rates for software developers, designers, writers, and more.",
        "hub_desc": "Market rate guide for freelancers. Hourly, daily, and monthly rates by skill and experience level.",
        "form_fields": [],
        "calc_fn": None,
        "result_template": "freelancer",
    },
    {
        "slug": "domestic-worker",
        "name": "Domestic Worker Salary Guide",
        "short": "Domestic Workers",
        "icon": "\U0001f3e0",
        "countries": 15,
        "data_scripts": ["/data/hr/domestic-worker-data.js"],
        "engine_script": None,
        "seo_title": "Domestic Worker Salary & Rights {COUNTRY} 2026 | AfroTools",
        "seo_desc": "Minimum wages, employment rights, UIF obligations, and leave entitlements for domestic workers in {COUNTRY}.",
        "hub_desc": "Minimum wages, UIF obligations, leave entitlements, and employment rights for domestic workers.",
        "form_fields": [],
        "calc_fn": None,
        "result_template": "domestic",
    },
]

CSS_VER = "?v=1"
TOKENS_VER = "?v=6977389f"
GLOBAL_VER = "?v=1eef2cf2"

def esc(s):
    return html.escape(s, quote=True)

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ── Result display templates (JS) ──
RESULT_JS = {
    "employee-cost": """
var r=E.calculateEmployeeCost(CC,fv('grossSalary'),{basicSalary:fv('basicSalary')||undefined,hasFivePlusEmployees:true});
if(r.error){alert(r.error);return;}
var h='<div class="hr-res-hero"><div class="hr-res-hero-label">Total Cost to Company (Monthly)</div>';
h+='<div class="hr-res-hero-amount">'+r.formatted.total+'</div>';
h+='<div class="hr-res-hero-sub">'+r.burdenPercentage+'% above gross | Annual: '+r.formatted.annual+'</div></div>';
h+='<table class="hr-summary-table"><thead><tr><th>Contribution</th><th>Rate</th><th>Amount</th></tr></thead><tbody>';
for(var i=0;i<r.employerContributions.length;i++){var c=r.employerContributions[i];h+='<tr><td>'+c.name+(c.law?' <small style="color:#94a3b8">('+c.law+')</small>':'')+'</td><td>'+c.rate+'</td><td class="highlight">'+E.fmt(c.amount,r.symbol)+'</td></tr>';}
h+='<tr style="font-weight:800;border-top:2px solid #0d9488"><td>Total Employer Contributions</td><td>'+r.burdenPercentage+'%</td><td class="highlight">'+r.formatted.contributions+'</td></tr>';
h+='</tbody></table>';
h+='<div class="hr-metrics"><div class="hr-metric"><div class="hr-metric-val">'+r.formatted.gross+'</div><div class="hr-metric-label">Gross Salary</div></div>';
h+='<div class="hr-metric"><div class="hr-metric-val">'+r.formatted.contributions+'</div><div class="hr-metric-label">Employer Costs</div></div>';
h+='<div class="hr-metric"><div class="hr-metric-val">'+r.formatted.total+'</div><div class="hr-metric-label">Total Cost/Month</div></div></div>';
""",
    "severance": """
var r=E.calculateSeverance(CC,fv('lastSalary'),fv('yearsOfService'));
if(r.error){alert(r.error);return;}
var h='<div class="hr-res-hero"><div class="hr-res-hero-label">Estimated Severance / Gratuity</div>';
h+='<div class="hr-res-hero-amount">'+r.formatted+'</div>';
h+='<div class="hr-res-hero-sub">Method: '+r.method+'</div></div>';
h+='<div class="hr-info"><strong>Formula:</strong> '+r.formula+'<br><strong>Calculation:</strong> '+(r.detail||'See notes')+'</div>';
if(r.law)h+='<div class="hr-info" style="margin-top:.5rem"><strong>Law:</strong> '+r.law+'</div>';
if(r.notes)h+='<div class="hr-warn"><strong>Note:</strong> '+r.notes+'</div>';
""",
    "maternity": """
var r=E.calculateMaternity(CC,fv('monthlySalary'));
if(r.error){alert(r.error);return;}
var h='<div class="hr-res-hero"><div class="hr-res-hero-label">Maternity Leave Benefit</div>';
h+='<div class="hr-res-hero-amount">'+r.formatted.maternityPay+'</div>';
h+='<div class="hr-res-hero-sub">'+r.maternityDuration+' at '+r.maternityPayRate+'</div></div>';
h+='<table class="hr-summary-table"><thead><tr><th>Detail</th><th>Value</th></tr></thead><tbody>';
h+='<tr><td>Maternity Duration</td><td><strong>'+r.maternityDuration+'</strong></td></tr>';
h+='<tr><td>Pay Rate</td><td><strong>'+r.maternityPayRate+'</strong></td></tr>';
h+='<tr><td>Paid By</td><td><strong>'+r.maternityPaidBy+'</strong></td></tr>';
if(r.maternityLaw)h+='<tr><td>Law</td><td>'+r.maternityLaw+'</td></tr>';
if(r.maternityEligibility)h+='<tr><td>Eligibility</td><td>'+r.maternityEligibility+'</td></tr>';
h+='<tr><td colspan="2" style="border-top:2px solid #0d9488;font-weight:700">Paternity Leave</td></tr>';
h+='<tr><td>Paternity Duration</td><td><strong>'+r.paternityDuration+'</strong></td></tr>';
h+='<tr><td>Paternity Pay</td><td>'+r.paternityPay+'</td></tr>';
h+='</tbody></table>';
if(r.maternityNotes)h+='<div class="hr-info"><strong>Note:</strong> '+r.maternityNotes+'</div>';
if(r.paternityNotes)h+='<div class="hr-warn">'+r.paternityNotes+'</div>';
""",
    "retrenchment": """
var r=E.calculateRetrenchment(CC,fv('salary'),fv('yearsOfService'),fv('unusedLeave'));
if(r.error){alert(r.error);return;}
var h='<div class="hr-res-hero"><div class="hr-res-hero-label">Total Retrenchment Package</div>';
h+='<div class="hr-res-hero-amount">'+r.formatted.total+'</div></div>';
h+='<table class="hr-summary-table"><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>';
h+='<tr><td>Severance Pay'+(r.severanceDetail?' <small>('+r.severanceDetail+')</small>':'')+'</td><td class="highlight">'+r.formatted.severance+'</td></tr>';
h+='<tr><td>Notice Period Pay ('+r.noticePeriodMonths+' month'+(r.noticePeriodMonths>1?'s':'')+')</td><td class="highlight">'+r.formatted.notice+'</td></tr>';
h+='<tr><td>Unused Leave Payout ('+r.unusedLeaveDays+' days)</td><td class="highlight">'+r.formatted.leave+'</td></tr>';
h+='<tr style="font-weight:800;border-top:2px solid #0d9488"><td>Total Package</td><td class="highlight">'+r.formatted.total+'</td></tr>';
h+='</tbody></table>';
""",
    "contractor": """
var r=E.contractorVsEmployee(CC,fv('monthlyAmount'));
if(r.error){alert(r.error||'Error');return;}
var h='<div class="hr-res-hero"><div class="hr-res-hero-label">Monthly Savings as Contractor</div>';
h+='<div class="hr-res-hero-amount">'+r.formatted.savings+'</div>';
h+='<div class="hr-res-hero-sub">'+r.savingsPercent+'% lower than employee cost</div></div>';
h+='<table class="hr-summary-table"><thead><tr><th>Item</th><th>Employee</th><th>Contractor</th></tr></thead><tbody>';
h+='<tr><td>Gross / Invoice</td><td>'+r.formatted.employeeCost+'</td><td>'+r.formatted.contractorCost+'</td></tr>';
h+='<tr><td>Employer Contributions</td><td>'+E.fmt(r.employee.totalEmployerContributions,r.employee.symbol)+'</td><td>None</td></tr>';
h+='<tr><td>WHT Deduction</td><td>N/A</td><td>'+r.contractor.whtRate+'%</td></tr>';
h+='<tr style="font-weight:800"><td>Total Cost to Company</td><td>'+r.formatted.employeeCost+'</td><td>'+r.formatted.contractorCost+'</td></tr>';
h+='</tbody></table>';
h+='<div class="hr-warn"><strong>Compliance Warning:</strong> Misclassifying employees as contractors carries legal risk. Ensure the engagement genuinely qualifies as independent contracting under local labour law.</div>';
""",
}

# ── Work permit, freelancer, domestic worker use static display (no calc button) ──
STATIC_DISPLAY = {
    "work-permit": """
<script>
!function(){
  var CC='__CC__';
  var d=(typeof WORK_PERMIT_COSTS!=='undefined')?WORK_PERMIT_COSTS[CC]:null;
  if(!d){document.getElementById('results').innerHTML='<div class="hr-warn">No data available for this country.</div>';document.getElementById('results').classList.add('on');return;}
  var h='<table class="hr-summary-table"><tbody>';
  h+='<tr><td>Permit Type</td><td><strong>'+d.type+'</strong></td></tr>';
  if(d.cost){var c=typeof d.cost==='object'?(d.currency+' '+d.cost.min.toLocaleString()+' - '+d.cost.max.toLocaleString()):(d.currency+' '+d.cost.toLocaleString());h+='<tr><td>Cost</td><td><strong>'+c+'</strong></td></tr>';}
  h+='<tr><td>Timeline</td><td><strong>'+(d.timeline||'Variable')+'</strong></td></tr>';
  if(d.authority)h+='<tr><td>Authority</td><td>'+d.authority+'</td></tr>';
  h+='</tbody></table>';
  if(d.requirements&&d.requirements.length){h+='<div style="margin-top:1rem"><strong>Required Documents:</strong><ul style="margin:.5rem 0 0 1.25rem">';for(var i=0;i<d.requirements.length;i++)h+='<li style="font-size:.88rem;margin-bottom:.25rem">'+d.requirements[i]+'</li>';h+='</ul></div>';}
  if(d.notes)h+='<div class="hr-info" style="margin-top:1rem">'+d.notes+'</div>';
  document.getElementById('results').innerHTML=h;document.getElementById('results').classList.add('on');
}();
</script>""",
    "freelancer": """
<script>
!function(){
  var CC='__CC__';
  var d=(typeof FREELANCER_RATES!=='undefined')?FREELANCER_RATES[CC]:null;
  if(!d){document.getElementById('results').innerHTML='<div class="hr-warn">No data available for this country.</div>';document.getElementById('results').classList.add('on');return;}
  var sym=d.symbol||'';var h='';
  var skills=Object.keys(d.skills);
  for(var s=0;s<skills.length;s++){var sk=d.skills[skills[s]];
    h+='<div class="hr-card" style="margin-top:1rem"><div class="hr-card-head" onclick="var b=this.nextElementSibling;b.classList.toggle(\\'collapsed\\');this.setAttribute(\\'aria-expanded\\',b.classList.contains(\\'collapsed\\')\\'false\\':\\'true\\')" aria-expanded="true"><span>'+sk.label+'</span><h2>'+sk.label+'</h2><span class="hr-card-toggle">&#x25BE;</span></div>';
    h+='<div class="hr-card-body"><table class="hr-summary-table"><thead><tr><th>Level</th><th>Hourly</th><th>Monthly</th></tr></thead><tbody>';
    ['junior','mid','senior'].forEach(function(lv){var r=sk[lv];if(r){h+='<tr><td style="text-transform:capitalize">'+lv+'</td><td>'+(r.hourly?sym+' '+r.hourly.toLocaleString():'—')+'</td><td>'+(r.monthly?sym+' '+r.monthly.toLocaleString():'—')+'</td></tr>';}});
    h+='</tbody></table></div></div>';
  }
  document.getElementById('results').innerHTML=h;document.getElementById('results').classList.add('on');
}();
</script>""",
    "domestic": """
<script>
!function(){
  var CC='__CC__';
  var d=(typeof DOMESTIC_WORKER!=='undefined')?DOMESTIC_WORKER[CC]:null;
  if(!d){document.getElementById('results').innerHTML='<div class="hr-warn">No data available for this country.</div>';document.getElementById('results').classList.add('on');return;}
  var sym=d.symbol||'';var h='<table class="hr-summary-table"><tbody>';
  if(d.minimumWage!=null)h+='<tr><td>Minimum Wage</td><td><strong>'+sym+' '+d.minimumWage.toLocaleString()+' '+d.unit+'</strong></td></tr>';
  if(d.monthly!=null)h+='<tr><td>Monthly Equivalent</td><td><strong>'+sym+' '+d.monthly.toLocaleString()+'</strong></td></tr>';
  h+='<tr><td>UIF / Social Security</td><td>'+(d.uif?'Required':'Not required / Not enforced')+'</td></tr>';
  if(d.sickLeave)h+='<tr><td>Sick Leave</td><td>'+d.sickLeave+'</td></tr>';
  if(d.annualLeave)h+='<tr><td>Annual Leave</td><td>'+d.annualLeave+'</td></tr>';
  if(d.law)h+='<tr><td>Law</td><td>'+d.law+'</td></tr>';
  h+='</tbody></table>';
  if(d.notes)h+='<div class="hr-info" style="margin-top:1rem">'+d.notes+'</div>';
  if(d.protections&&d.protections.length){h+='<div style="margin-top:1rem"><strong>Worker Protections:</strong><ul style="margin:.5rem 0 0 1.25rem">';for(var i=0;i<d.protections.length;i++)h+='<li style="font-size:.88rem;margin-bottom:.25rem">'+d.protections[i]+'</li>';h+='</ul></div>';}
  document.getElementById('results').innerHTML=h;document.getElementById('results').classList.add('on');
}();
</script>""",
}


def gen_hub(tool):
    """Generate the hub page (country grid) for a tool."""
    countries = COUNTRIES_54 if tool["countries"] == 54 else COUNTRIES_15
    slug = tool["slug"]
    name = tool["name"]
    icon = tool["icon"]
    n = tool["countries"]

    cards = ""
    for code, cslug, cname, flag in countries:
        cards += f'<a href="/tools/{slug}/{cslug}/" class="hr-country-card">\n<span class="hr-country-flag">{flag}</span>\n<span class="hr-country-name">{esc(cname)}</span>\n</a>\n'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(name)} \u2014 All {n} African Countries | AfroTools</title>
<meta name="description" content="Free {esc(name)} for all {n} African countries. Select your country to calculate with local rates and data.">
<link rel="canonical" href="https://afrotools.com/tools/{slug}/">
<meta property="og:title" content="{esc(name)} \u2014 All {n} African Countries | AfroTools">
<meta property="og:description" content="Free {esc(name)} for all {n} African countries. Select your country.">
<meta property="og:url" content="https://afrotools.com/tools/{slug}/">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"WebPage","name":"{esc(name)} \u2014 All {n} African Countries | AfroTools","url":"https://afrotools.com/tools/{slug}/"}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css{TOKENS_VER}"><link rel="stylesheet" href="/assets/css/global.min.css{GLOBAL_VER}"><link rel="stylesheet" href="/assets/css/hr-payroll.css{CSS_VER}">
<script src="/assets/js/components/navbar.min.js?v=da613fd9" defer></script><script src="/assets/js/components/footer.min.js?v=0f040e13" defer></script>
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}}a{{text-decoration:none;color:inherit}}</style>
</head>
<body>
<afro-navbar theme="dark" active="hr-payroll"></afro-navbar>
<section class="hr-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>\u203a</span> <a href="/hr-payroll/">HR &amp; Payroll</a> <span>\u203a</span> {esc(name)}</nav>
<h1>{icon} <em>{esc(name)}</em></h1>
<p class="hr-tool-hero-sub">{esc(tool['hub_desc'])} Covering {n} African nations with local data.</p>
</div></section>
<main class="hr-main">
<section class="hr-hub">
<div class="container">
<h2>Select Your Country</h2>
<div class="hr-hub-country-grid">
{cards}</div>
</div>
</section>
<section class="hr-seo-section">
<h2>{esc(name)} \u2014 Why It Matters</h2>
<p>{esc(tool['hub_desc'])} Select your country above to get started with local data and calculations.</p>
<p><strong>Disclaimer:</strong> Estimates based on published labour laws and contribution rates. Always verify with official sources and consult qualified professionals.</p>
</section>
</main>
<afro-footer></afro-footer>
</body>
</html>"""


def gen_country_page(tool, code, cslug, cname, flag):
    """Generate a country-specific tool page."""
    slug = tool["slug"]
    name = tool["name"]
    icon = tool["icon"]
    tmpl = tool["result_template"]

    title = tool["seo_title"].replace("{COUNTRY}", cname)
    desc = tool["seo_desc"].replace("{COUNTRY}", cname)

    data_tags = ""
    for ds in tool["data_scripts"]:
        data_tags += f'<script src="{ds}?v=1"></script>\n'
    if tool["engine_script"]:
        data_tags += f'<script src="{tool["engine_script"]}?v=1"></script>\n'

    # Build form
    form_html = ""
    if tool["form_fields"]:
        form_html += '<div class="hr-form-grid">\n'
        for f in tool["form_fields"]:
            opt = " (optional)" if f.get("optional") else ""
            inp = f'<input class="hr-f-input" type="{f["type"]}" id="{f["id"]}" placeholder="{f["placeholder"]}" inputmode="numeric">'
            if f.get("prefix"):
                inp = f'<div class="hr-input-wrap"><span class="hr-prefix" id="currPrefix"></span>{inp}</div>'
            form_html += f'<div class="hr-field"><label class="hr-f-label" for="{f["id"]}">{f["label"]}{opt}</label>{inp}</div>\n'
        form_html += '</div>\n<button class="hr-calc-btn" id="calcBtn" type="button">Calculate</button>\n'

    # Build inline script
    if tmpl in STATIC_DISPLAY:
        script = STATIC_DISPLAY[tmpl].replace("__CC__", code)
    elif tmpl in RESULT_JS:
        js_body = RESULT_JS[tmpl]
        script = f"""<script>
!function(){{
"use strict";
var CC='{code}';
var E=window.AfroTools.HREngine;
function fv(id){{var el=document.getElementById(id);return el?parseFloat(el.value)||0:0;}}
var rules=(typeof EMPLOYER_COST_RULES!=='undefined')?EMPLOYER_COST_RULES[CC]:null;
if(rules){{var p=document.getElementById('currPrefix');if(p)p.textContent=rules.symbol||'';}}
document.getElementById("calcBtn").addEventListener("click",function(){{
{js_body}
document.getElementById('results').innerHTML=h;
document.getElementById('results').classList.add('on');
}});
}}();
</script>"""
    else:
        script = ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="https://afrotools.com/tools/{slug}/{cslug}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="https://afrotools.com/tools/{slug}/{cslug}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"WebApplication","name":"{esc(title)}","url":"https://afrotools.com/tools/{slug}/{cslug}","applicationCategory":"FinanceApplication","provider":{{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"}},"offers":{{"@type":"Offer","price":"0","priceCurrency":"USD"}}}}</script>
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"Home","item":"https://afrotools.com/"}},{{"@type":"ListItem","position":2,"name":"HR & Payroll","item":"https://afrotools.com/hr-payroll/"}},{{"@type":"ListItem","position":3,"name":"{esc(name)}","item":"https://afrotools.com/tools/{slug}/"}},{{"@type":"ListItem","position":4,"name":"{esc(cname)}","item":"https://afrotools.com/tools/{slug}/{cslug}"}}]}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css{TOKENS_VER}"><link rel="stylesheet" href="/assets/css/global.min.css{GLOBAL_VER}"><link rel="stylesheet" href="/assets/css/hr-payroll.css{CSS_VER}">
<script src="/assets/js/components/navbar.min.js?v=da613fd9" defer></script><script src="/assets/js/components/footer.min.js?v=0f040e13" defer></script>
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}}a{{text-decoration:none;color:inherit}}</style>
</head>
<body>
<afro-navbar theme="dark" active="hr-payroll"></afro-navbar>
<section class="hr-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>\u203a</span> <a href="/hr-payroll/">HR &amp; Payroll</a> <span>\u203a</span> <a href="/tools/{slug}/">{esc(name)}</a> <span>\u203a</span> {esc(cname)}</nav>
<h1>{flag} {esc(cname)} <em>{esc(name)}</em></h1>
<p class="hr-tool-hero-sub">{esc(desc)}</p>
</div></section>
<main class="hr-main">
<div class="hr-card"><div class="hr-card-head" onclick="var b=this.nextElementSibling;b.classList.toggle('collapsed');this.setAttribute('aria-expanded',b.classList.contains('collapsed')?'false':'true')" aria-expanded="true"><span>{icon}</span><h2>{esc(name)}</h2><span class="hr-card-toggle">&#x25BE;</span></div>
<div class="hr-card-body">
{form_html}</div></div>
<div class="hr-results" id="results"></div>
<section class="hr-seo-section">
<h2>{esc(cname)} {esc(name)} \u2014 What You Need to Know</h2>
<p>Use this free tool to calculate and understand HR obligations in {esc(cname)}. Based on published labour laws and official contribution rates.</p>
<p><strong>Disclaimer:</strong> Estimates based on available data. Always verify with official sources and consult qualified professionals for employment decisions.</p>
</section>
</main>
<afro-footer></afro-footer>
{data_tags}
{script}
</body>
</html>"""


def main():
    total = 0
    for tool in TOOLS:
        slug = tool["slug"]
        countries = COUNTRIES_54 if tool["countries"] == 54 else COUNTRIES_15

        # Hub page
        hub_path = os.path.join(BASE, "tools", slug, "index.html")
        write_file(hub_path, gen_hub(tool))
        total += 1

        # Country pages
        for code, cslug, cname, flag in countries:
            cp = os.path.join(BASE, "tools", slug, cslug, "index.html")
            write_file(cp, gen_country_page(tool, code, cslug, cname, flag))
            total += 1

        print(f"  {slug}: hub + {len(countries)} country pages")

    print(f"\nDone! Generated {total} pages for {len(TOOLS)} tools.")


if __name__ == "__main__":
    main()
