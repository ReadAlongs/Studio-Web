npx nx extract-i18n studio-web
cd packages/studio-web/
npx tsx extract-i18n-lang.ts src/i18n/messages.json src/i18n/messages.es.json >src/i18n/messages.es-updated.json
mv src/i18n/messages.es-updated.json src/i18n/messages.es.json
npx tsx extract-i18n-lang.ts src/i18n/messages.json src/i18n/messages.fr.json >src/i18n/messages.fr-updated.json
mv src/i18n/messages.fr-updated.json src/i18n/messages.fr.json
