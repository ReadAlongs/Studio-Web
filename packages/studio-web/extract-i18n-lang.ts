// Update the language files with the new keys from the English file
// Usage:
//   npx tsx extract-i18n-lang.ts src/i18n/messages.json src/i18n/messages.fr.json > src/i18n/messages.fr-updated.json
//   npx tsx extract-i18n-lang.ts src/i18n/messages.json src/i18n/messages.es.json > src/i18n/messages.es-updated.json
// and then manually inspect the results, translate the new keys and copy the
// updated files back to the original files.

import fs from "fs";
import process from "process";

// Get the messages file from the command line
const englishMessagesFile = process.argv[2];
const languageMessagesFile = process.argv[3];

// Check if filename is provided
if (!englishMessagesFile || !languageMessagesFile) {
  console.error(
    "Please provide the English message file and translated message file as first and second CLI argument",
  );
  process.exit(1);
}

// Read the English file synchronously
const englishDataRaw = fs.readFileSync(englishMessagesFile, "utf8");
const englishData = JSON.parse(englishDataRaw);
//console.log(englishDataParsed);

// Read the language file synchronously
const languageDataRaw = fs.readFileSync(languageMessagesFile, "utf8");
let languageData = JSON.parse(languageDataRaw);
//assert(englishData, 'English data is null');
//assert(languageData, 'Language data is null');

for (const key in englishData.translations) {
  if (!languageData.translations[key]) {
    console.error(`Adding missing key ${key} to the language file`);
    languageData.translations[key] =
      "ENGLISH: " + englishData.translations[key] + " (Please translate)";
  }
}
for (const key in languageData.translations) {
  if (!englishData.translations[key]) {
    console.error(
      `Removing key ${key} from the language file. Old message: ${languageData.translations[key]}`,
    );
    delete languageData.translations[key];
  }
}
//console.log(languageData)

let sortedTranslations = {};
for (const key in englishData.translations) {
  sortedTranslations[key] = languageData.translations[key];
}
//console.log(sortedTranslations);
languageData.translations = sortedTranslations;
console.log(JSON.stringify(languageData, null, 2));
