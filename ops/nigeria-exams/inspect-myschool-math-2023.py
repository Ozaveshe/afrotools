"""Inspect publicly accessible Myschool collection items for editorial review.

This prints a small human review summary; it does not publish or infer a sitting.
"""
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
import requests
import sys
import re

def inspect(item):
    url = f"https://myschool.ng/classroom/mathematics/{item}?exam_type=jamb&exam_year=2023"
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        heading = soup.find("h1")
        if not heading:
            return item, "missing heading"
        section = heading.find_parent("section")
        body = section.get_text(" ", strip=True) if section else heading.get_text(" ", strip=True)
        question = body.split("Download Offline App", 1)[0]
        answer = re.search(r"Correct Option\s+([a-d])", body, re.I)
        figures = len(heading.find_all("img"))
        return item, f"{question[:500]} | key={answer.group(1).upper() if answer else '?'} | heading_images={figures}"
    except Exception as exc:
        return item, f"error: {type(exc).__name__}: {exc}"

if __name__ == "__main__":
    ids = [int(value) for value in sys.argv[1:]]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for item, body in pool.map(inspect, ids):
            print(f"{item}: {body}\n")
