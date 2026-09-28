"""Remove ligature features (liga/clig/dlig) from the resume fonts in place.

Pages always applies standard ligatures and writes no text mapping for them,
so "software" extracts as "so ware" in the PDF. Fonts without ligature
features keep the PDF text layer clean for ATS parsers.
Usage: python strip-ligatures.py assets/fonts/*.ttf  (needs fonttools)
"""
import sys
from fontTools.ttLib import TTFont

for path in sys.argv[1:]:
    font = TTFont(path)
    removed = 0
    if 'GSUB' in font and font['GSUB'].table.FeatureList:
        for rec in font['GSUB'].table.FeatureList.FeatureRecord:
            if rec.FeatureTag in ('liga', 'clig', 'dlig') and rec.Feature.LookupListIndex:
                rec.Feature.LookupListIndex = []
                rec.Feature.LookupCount = 0
                removed += 1
    font.save(path)
    print(f'{path}: cleared {removed} ligature feature records')
