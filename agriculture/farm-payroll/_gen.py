#!/usr/bin/env python3
"""Generate all 54 farm-payroll country pages using simple string replacement."""
import os

DIR = os.path.dirname(os.path.abspath(__file__))

COUNTRIES = [
    ("NG", "Nigeria", "&#127475;&#127468;", "nigeria", "/nigeria/ng-salary-tax.html", "nigeria"),
    ("GH", "Ghana", "&#127468;&#127469;", "ghana", "/ghana/gh-paye.html", "ghana"),
    ("CI", "Cote d'Ivoire", "&#127464;&#127470;", "cote-d-ivoire", "/cote-divoire/ci-paye.html", "cote-d-ivoire"),
    ("SN", "Senegal", "&#127480;&#127475;", "senegal", "/senegal/sn-paye.html", "senegal"),
    ("ML", "Mali", "&#127474;&#127473;", "mali", "/mali/ml-paye.html", "mali"),
    ("BF", "Burkina Faso", "&#127463;&#127467;", "burkina-faso", "/burkina-faso/bf-paye.html", "burkina-faso"),
    ("NE", "Niger", "&#127475;&#127466;", "niger", "/niger/ne-paye.html", "niger"),
    ("GN", "Guinea", "&#127468;&#127475;", "guinea", "/guinea/gn-paye.html", "guinea"),
    ("BJ", "Benin", "&#127463;&#127471;", "benin", "/benin/bj-paye.html", "benin"),
    ("TG", "Togo", "&#127481;&#127468;", "togo", "/togo/tg-paye.html", "togo"),
    ("SL", "Sierra Leone", "&#127480;&#127473;", "sierra-leone", "/sierra-leone/sl-paye.html", "sierra-leone"),
    ("LR", "Liberia", "&#127473;&#127479;", "liberia", "/liberia/lr-paye.html", "liberia"),
    ("MR", "Mauritania", "&#127474;&#127479;", "mauritania", "/mauritania/mr-paye.html", "mauritania"),
    ("GM", "Gambia", "&#127468;&#127474;", "gambia", "/gambia/gm-paye.html", "gambia"),
    ("GW", "Guinea-Bissau", "&#127468;&#127484;", "guinea-bissau", "/guinea-bissau/gw-paye.html", "guinea-bissau"),
    ("CV", "Cabo Verde", "&#127464;&#127483;", "cabo-verde", "/cape-verde/cv-paye.html", "cabo-verde"),
    ("KE", "Kenya", "&#127472;&#127466;", "kenya", "/kenya/ke-paye.html", "kenya"),
    ("ET", "Ethiopia", "&#127466;&#127481;", "ethiopia", "/ethiopia/et-paye.html", "ethiopia"),
    ("TZ", "Tanzania", "&#127481;&#127487;", "tanzania", "/tanzania/tz-paye.html", "tanzania"),
    ("UG", "Uganda", "&#127482;&#127468;", "uganda", "/uganda/ug-paye.html", "uganda"),
    ("RW", "Rwanda", "&#127479;&#127484;", "rwanda", "/rwanda/rw-paye.html", "rwanda"),
    ("BI", "Burundi", "&#127463;&#127470;", "burundi", "/burundi/bi-paye.html", "burundi"),
    ("SO", "Somalia", "&#127480;&#127476;", "somalia", "/somalia/so-paye.html", "somalia"),
    ("DJ", "Djibouti", "&#127465;&#127471;", "djibouti", "/djibouti/dj-paye.html", "djibouti"),
    ("ER", "Eritrea", "&#127466;&#127479;", "eritrea", "/eritrea/er-paye.html", "eritrea"),
    ("SS", "South Sudan", "&#127480;&#127480;", "south-sudan", "/south-sudan/ss-paye.html", "south-sudan"),
    ("CD", "DR Congo", "&#127464;&#127465;", "dr-congo", "/dr-congo/cd-paye.html", "dr-congo"),
    ("CM", "Cameroon", "&#127464;&#127474;", "cameroon", "/cameroon/cm-paye.html", "cameroon"),
    ("CG", "Congo (Brazzaville)", "&#127464;&#127468;", "congo-brazzaville", "/congo/cg-paye.html", "congo-brazzaville"),
    ("GA", "Gabon", "&#127468;&#127462;", "gabon", "/gabon/ga-paye.html", "gabon"),
    ("GQ", "Equatorial Guinea", "&#127468;&#127478;", "equatorial-guinea", "/eq-guinea/gq-paye.html", "equatorial-guinea"),
    ("CF", "Central African Republic", "&#127464;&#127467;", "central-african-republic", "/car/cf-paye.html", "central-african-republic"),
    ("TD", "Chad", "&#127481;&#127465;", "chad", "/chad/td-paye.html", "chad"),
    ("ST", "Sao Tome and Principe", "&#127480;&#127481;", "sao-tome-and-principe", "/sao-tome/st-paye.html", "sao-tome-and-principe"),
    ("ZA", "South Africa", "&#127487;&#127462;", "south-africa", "/south-africa/za-paye.html", "south-africa"),
    ("MZ", "Mozambique", "&#127474;&#127487;", "mozambique", "/mozambique/mz-paye.html", "mozambique"),
    ("ZM", "Zambia", "&#127487;&#127474;", "zambia", "/zambia/zm-paye.html", "zambia"),
    ("ZW", "Zimbabwe", "&#127487;&#127484;", "zimbabwe", "/zimbabwe/zw-paye.html", "zimbabwe"),
    ("MW", "Malawi", "&#127474;&#127484;", "malawi", "/malawi/mw-paye.html", "malawi"),
    ("AO", "Angola", "&#127462;&#127476;", "angola", "/angola/ao-paye.html", "angola"),
    ("NA", "Namibia", "&#127475;&#127462;", "namibia", "/namibia/na-paye.html", "namibia"),
    ("BW", "Botswana", "&#127463;&#127484;", "botswana", "/botswana/bw-paye.html", "botswana"),
    ("LS", "Lesotho", "&#127473;&#127480;", "lesotho", "/lesotho/ls-paye.html", "lesotho"),
    ("SZ", "Eswatini", "&#127480;&#127487;", "eswatini", "/eswatini/sz-paye.html", "eswatini"),
    ("EG", "Egypt", "&#127466;&#127468;", "egypt", "/egypt/eg-paye.html", "egypt"),
    ("MA", "Morocco", "&#127474;&#127462;", "morocco", "/morocco/ma-paye.html", "morocco"),
    ("DZ", "Algeria", "&#127465;&#127487;", "algeria", "/algeria/dz-paye.html", "algeria"),
    ("TN", "Tunisia", "&#127481;&#127475;", "tunisia", "/tunisia/tn-paye.html", "tunisia"),
    ("LY", "Libya", "&#127473;&#127486;", "libya", "/libya/ly-paye.html", "libya"),
    ("SD", "Sudan", "&#127480;&#127465;", "sudan", "/sudan/sd-paye.html", "sudan"),
    ("MG", "Madagascar", "&#127474;&#127468;", "madagascar", "/madagascar/mg-paye.html", "madagascar"),
    ("MU", "Mauritius", "&#127474;&#127482;", "mauritius", "/mauritius/mu-paye.html", "mauritius"),
    ("SC", "Seychelles", "&#127480;&#127464;", "seychelles", "/seychelles/sc-paye.html", "seychelles"),
    ("KM", "Comoros", "&#127472;&#127474;", "comoros", "/comoros/km-paye.html", "comoros"),
]

# Template uses __CODE__, __NAME__, __FLAG__, __SLUG__, __FARM_PROFIT_SLUG__
# to avoid Python format() conflicts
PAGE_TEMPLATE = open(os.path.join(DIR, '_template.html'), 'r', encoding='utf-8').read()

def generate(code, name, flag, slug, paye_link, fp_slug):
    content = PAGE_TEMPLATE
    content = content.replace('__CODE__', code)
    content = content.replace('__NAME__', name)
    content = content.replace('__FLAG__', flag)
    content = content.replace('__SLUG__', slug)
    content = content.replace('__FARM_PROFIT_SLUG__', fp_slug)
    path = os.path.join(DIR, slug + '.html')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

count = 0
for c in COUNTRIES:
    code, name, flag, slug, paye_link, fp_slug = c
    generate(code, name, flag, slug, paye_link, fp_slug)
    count += 1
    print(f"  {count:2d}. {slug}.html")

print(f"\nDone! Generated {count} country pages.")
