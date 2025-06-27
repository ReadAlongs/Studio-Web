import unidecode from "unidecode";
import librarySlugify from "@sindresorhus/slugify";

export const slugify = (str: string, character_limit: number = 0) => {
  // Adapted from https://byby.dev/js-slugify-string
  // Character limit of 0 (default) means there is no limit
  const slug = librarySlugify(
    String(unidecode(str))
      .normalize("NFC") // split accented characters into their base characters and diacritical marks
      .trim() // trim leading or trailing whitespace
      .toLowerCase() // convert to lowercase
      .replace(/\s+/g, "-") // replace spaces with hyphens
      .replace(/-+/g, "-"), // remove consecutive hyphens
  );

  if (character_limit) {
    return slug.substring(0, character_limit);
  }
  return slug;
};

/**
 * Validates the file matches the expected file type.
 *
 * The accept parameter is a comma separated value as specified
 * here: https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)
 */
export function validateFileType(file: File, accept: string): boolean {
  const accepts = accept
    .toLowerCase()
    .split(",")
    .map((ext) => ext.trim())
    .filter((ext) => ext);

  // The file extension specification is defined as:
  //  A string whose first character is a U+002E FULL STOP character (.)
  const byExtension = accepts
    .filter((ext) => ext.startsWith("."))
    .some((ext) => file.name.toLowerCase().endsWith(ext));

  // A valid MIME type string with no parameters (that does not contain U+003B (;))
  const byMimeType = accepts
    .filter((mimetype) => !mimetype.startsWith("."))
    .filter((mimetype) => mimetype.indexOf("*") === -1)
    .filter((mimetype) => mimetype.indexOf(";") === -1)
    .some((mimetype) => file.type.toLowerCase() === mimetype);

  // Only the following three strings are valid mimetype wildcards
  const validWildcards = ["image/*", "video/*", "audio/*"];
  const byMimeTypeWildcard = accepts
    .filter((mimetype) => validWildcards.indexOf(mimetype) >= 0)
    .map((mimetype) => mimetype.substring(0, mimetype.length - 1))
    .some((mimetype) => file.type.toLowerCase().startsWith(mimetype));

  return byExtension || byMimeType || byMimeTypeWildcard;
}
