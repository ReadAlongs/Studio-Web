export const slugify = (str: string, character_limit: number = 0) => {
  // Adapted from https://byby.dev/js-slugify-string
  // Character limit of 0 (default) means there is no limit
  const slug = String(str)
    .normalize("NFC") // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens

  if (character_limit) {
    return slug.substring(0, character_limit);
  }
  return slug;
};
