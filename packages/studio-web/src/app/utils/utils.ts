import unidecode from "unidecode";

export const slugify = (str: string, character_limit: number = 0) => {
  // Adapted from https://byby.dev/js-slugify-string
  // Character limit of 0 (default) means there is no limit
  const slug = String(unidecode(str))
    .normalize("NFC") // split accented characters into their base characters and diacritical marks
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens

  if (character_limit) {
    return slug.substring(0, character_limit);
  }
  return slug;
};
