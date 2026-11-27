"""Build the static lookup. Pass --source-html PATH to refresh from the official monthly table."""
import argparse
import json
import re
from datetime import datetime
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "data/travel/us-visa-waits.json"
PAGE = ROOT / "tools/embassy-wait-time/index.html"
LABELS = ["Visitor B1/B2 · previous month's average", "Visitor B1/B2 · next interview",
          "Students and exchange visitors F/M/J · next interview", "Petition-based H/L/O/P/Q · next interview",
          "Crew and transit C/D/C1/D · next interview"]


def refresh(snapshot, source):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(source, "html.parser")
    clean = lambda cell: " ".join(cell.stripped_strings)
    date = re.search(r"Last updated:\s*(\d{1,2}-[A-Z]{3}-\d{4})", soup.get_text(" ", strip=True), re.I)
    if not date:
        raise ValueError("Source revision date missing")
    revision = datetime.strptime(date[1], "%d-%b-%Y").date().isoformat()
    if revision < snapshot["updated"]:
        raise ValueError("Source predates installed snapshot")
    wanted = snapshot["posts"]
    found = {}
    for table in soup.select("table"):
        rows = table.select("tr")
        if not rows:
            continue
        headers = [clean(c).upper() for c in rows[0].select("th,td")]
        if len(headers) != 6 or not all(token in h for token,h in zip(
            ["POST","AVERAGE","B1/B2","F,M,J","H,L,O,P,Q","C1/D"],headers)):
            continue
        for row in rows[1:]:
            cells = [clean(c) for c in row.select("td")]
            if cells and cells[0] in wanted:
                if len(cells) != 6 or cells[0] in found or not all(
                    re.fullmatch(r"NA|(?:<\s*)?\d+(?:\.\d+)?\s+Months?", v, re.I) for v in cells[1:]):
                    raise ValueError("Unexpected values for " + cells[0])
                found[cells[0]] = cells[1:]
    if set(found) != set(wanted):
        raise ValueError("Review changed coverage before replacing the snapshot")
    for post, waits in found.items():
        wanted[post]["waits"] = waits
    snapshot["updated"] = revision


def render(data):
    rows = []
    for city, post in sorted(data["posts"].items(), key=lambda entry: (entry[1]["country"], entry[0])):
        title = escape(post["country"] + " · " + city)
        values = "".join("<dt>" + escape(label) + "</dt><dd>" + escape(value if value != "NA" else "NA · no figure published") + "</dd>"
                         for label, value in zip(LABELS, post["waits"], strict=True))
        rows.append(f"<details><summary>{title}</summary><dl>{values}</dl></details>")
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>U.S. visa interview wait times at African posts | AfroTools</title>
<meta name="description" content="Look up published U.S. nonimmigrant visa interview estimates by African city and visa category.">
<link rel="canonical" href="https://afrotools.com/tools/embassy-wait-time/">
<style>body{{margin:auto;padding:1.2rem;max-width:48rem;font:1rem/1.6 system-ui;color:#16332c}}h1{{line-height:1.15}}a{{color:#086044}}input{{box-sizing:border-box;width:100%;padding:.7rem;font:inherit}}summary{{cursor:pointer;padding:.8rem 0;font-weight:650}}details{{border-bottom:1px solid #b5cbc2}}dt{{color:#344c45}}dd{{font-weight:650;margin:0 0 .8rem}}</style></head>
<body><nav aria-label="Breadcrumb"><a href="/">AfroTools</a> / <a href="/tools/">Tools</a></nav><main>
<h1>U.S. visa interview wait times at African posts</h1>
<p>Choose a post to see estimated waits for in-person nonimmigrant visa interviews. The B1/B2 average measures how long visitors waited in the previous month. The next interview estimates can change as posts release appointments.</p>
<p>Source updated <time datetime="{data['updated']}">{data['updated']}</time> · <a href="{escape(data['source'])}">U.S. Department of State global wait times</a></p>
<p>Figures use 30-day months. NA means the department did not publish a figure for that field. For schedules and interview-waiver information, visit the <a href="https://www.usembassy.gov/">embassy or consulate website</a>.</p>
<div id="filterBox" hidden><label for="postFilter">Filter by country or city</label><input type="search" id="postFilter"><p id="matches" role="status"></p></div>
{chr(10).join(rows)}</main><script>
const search = document.getElementById('postFilter');
const posts = Array.from(document.querySelectorAll('details'));
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’`]/g,'').toLowerCase();
function filterPosts() {{
  const term = normalize(search.value.trim());
  let count = 0;
  for (const post of posts) {{
    post.hidden = !normalize(post.querySelector('summary').textContent).includes(term);
    if (!post.hidden) count++;
  }}
  document.getElementById('matches').textContent = count ? count + (count === 1 ? ' post' : ' posts') : 'No matching post. Try another city or check the global table above.';
}}
document.getElementById('filterBox').hidden = false;
search.addEventListener('input', filterPosts);
filterPosts();
</script></body></html>"""


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-html", type=Path)
    args = parser.parse_args()
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    if args.source_html:
        refresh(snapshot, args.source_html.read_text(encoding="utf-8"))
    content = render(snapshot)
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(content, encoding="utf-8")
    if args.source_html:
        SNAPSHOT.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
