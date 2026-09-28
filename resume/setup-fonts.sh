#!/usr/bin/env bash
# Download Roboto + Source Sans Pro from their official repos, strip ligature
# features (see strip-ligatures.py), and install them to ~/Library/Fonts.
# The patched fonts are generated locally and not committed, because the
# Source Sans Pro license reserves its name for unmodified copies.
set -euo pipefail
cd "$(dirname "$0")"
dir=assets/fonts
mkdir -p "$dir"
for f in Roboto-Thin Roboto-Light Roboto-Regular Roboto-Medium Roboto-Bold Roboto-Italic; do
  curl -sSfL -o "$dir/$f.ttf" "https://github.com/googlefonts/roboto-2/raw/main/src/hinted/$f.ttf"
done
for f in SourceSansPro-Regular SourceSansPro-It SourceSansPro-Semibold SourceSansPro-Bold SourceSansPro-Light; do
  curl -sSfL -o "$dir/$f.ttf" "https://github.com/adobe-fonts/source-sans/raw/2.045R-ro/1.095R-it/TTF/$f.ttf"
done
python3 -c 'import fontTools' 2>/dev/null || python3 -m pip install --user fonttools
python3 strip-ligatures.py "$dir"/*.ttf
cp "$dir"/*.ttf ~/Library/Fonts/
echo "Installed $(ls "$dir"/*.ttf | wc -l | tr -d ' ') fonts. Quit and reopen Pages if it is running."
