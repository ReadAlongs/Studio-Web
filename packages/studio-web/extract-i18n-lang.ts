import fs from "fs";
import process from "process";
import { parseArgs } from "node:util";

function showHelp() {
  console.log(`Update the language files with the new keys from the English file.

Then manually inspect the results, translate the new keys and copy the
updated files back to the original files.

Usage:
    npx tsx extract-i18n-lang.ts [options] englishFile otherLanguageFile

Options:
    --output filePath   writes the utf-8 encoded data to the specified output file
    -i, --inplace       overwrites the translated language file
    -h, --help              displays this message

Examples:
    npx tsx extract-i18n-lang.ts src/i18n/messages.json src/i18n/messages.fr.json > src/i18n/messages.fr-updated.json
    npx tsx extract-i18n-lang.ts src/i18n/messages.json src/i18n/messages.es.json > src/i18n/messages.es-updated.json

    npx tsx extract-i18n-lang.ts --output src/i18n/messages.es-updated.json src/i18n/messages.json src/i18n/messages.es.json
    npx tsx extract-i18n-lang.ts --inplace src/i18n/messages.json src/i18n/messages.es.json

Note:
    In a Windows PowerShell environment, please use either the --output or the --inplace flags.
`);
}

function parseCommandLine() {
  const { values: flags, positionals: args } = parseArgs({
    args: process.argv.slice(2),
    options: {
      output: {
        type: "string",
        default: "-",
      },
      inplace: { type: "boolean", short: "i" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  // show help message
  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  // Check if filenames are provided
  if (args.length < 2) {
    console.error(
      "Please provide the English message file and translated message file as first and second CLI argument",
    );
    process.exit(1);
  }

  // In-place implementation, replace the output file with the
  // source of the translated data, but only if the user has not
  // specified an output file path.
  if (flags.output === "-" && flags.inplace) {
    flags.output = args[1];
  }

  // If a Windows user is using stdout, provide a warning message. This is really targeted
  // at PowerShell users but we cannot reliably determine which shell is being used.
  if (process.platform === "win32" && flags.output === "-") {
    console.error(
      "Windows warning: please provide either the --output or --inplace flags to generate a valid utf-8 file",
    );
  }

  return { flags, args };
}

interface TranslationFile {
  locale: string;
  translations: {
    [key: string]: string;
  };
}

function readJSON(filePath: string): TranslationFile {
  try {
    const rawData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(rawData);
  } catch (err: any) {
    console.error(
      `An error occurred while reading "${filePath}":\n   ${"message" in err ? err.message : err}`,
    );
    process.exit(1);
  }
}

// Get the arguments from the command line
const { flags, args } = parseCommandLine();

const englishMessagesFile = args[0];
const languageMessagesFile = args[1];

const englishData = readJSON(englishMessagesFile);
const languageData = readJSON(languageMessagesFile);

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

const sortedTranslations: any = {};
for (const key in englishData.translations) {
  sortedTranslations[key] = languageData.translations[key];
}
languageData.translations = sortedTranslations;

// Save the new translated file to the user provided output path.
try {
  const writer =
    flags.output !== "-" ? fs.openSync(flags.output, "w") : process.stdout.fd;

  fs.writeSync(
    writer,
    Buffer.from(JSON.stringify(languageData, null, 2), "utf-8"),
  );

  fs.closeSync(writer);
} catch (err: any) {
  console.error(
    `An error occurred while saving the new translation file:\n` +
      `   ${"message" in err ? err.message : err}`,
  );
  process.exit(1);
}
