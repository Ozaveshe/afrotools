#!/usr/bin/env bash
# Keep the legacy entry point on the shared Python/template generator.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$DIR/_gen.py" "$@"
