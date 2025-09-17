#!/bin/sh

# Run this script to extract new translations from the code and updated the
# Spanish and French message files with placeholders for missing translations.
# WARNING: overwrites messages.es.json and messages.fr.json, so commit any
# changes first!

npx nx extract-i18n studio-web
cd packages/studio-web/ || exit 1
npx tsx extract-i18n-lang.ts --inplace src/i18n/messages.json src/i18n/messages.es.json
npx tsx extract-i18n-lang.ts --inplace src/i18n/messages.json src/i18n/messages.fr.json
