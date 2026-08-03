import json
import sys

from pypdf import PdfReader


if len(sys.argv) != 2:
    raise SystemExit("PDF path is required")

reader = PdfReader(sys.argv[1], strict=False)
text = "\n".join((page.extract_text() or "") for page in reader.pages)
json.dump({"text": text, "pages": len(reader.pages)}, sys.stdout, ensure_ascii=False)
