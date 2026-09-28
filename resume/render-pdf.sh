#!/usr/bin/env bash
# Export a .docx to PDF using Pages (macOS). Requires Roboto + Source Sans Pro
# installed (copy resume/assets/fonts/*.ttf to ~/Library/Fonts once).
# Usage: render-pdf.sh in.docx out.pdf
set -euo pipefail
in="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
out="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
rm -f "$out"
osascript <<EOF
tell application "Pages"
  set theDoc to open POSIX file "$in"
  delay 2
  export theDoc to POSIX file "$out" as PDF
  close theDoc saving no
end tell
EOF
[ -s "$out" ] || { echo "PDF export failed: $out" >&2; exit 1; }
