import {
  diffWordSequences,
  remapWordIndex,
  walkDocumentWords,
} from "./document-words";

describe("walkDocumentWords", () => {
  it("returns nothing for empty text", () => {
    expect(walkDocumentWords("")).toEqual([]);
  });

  it("splits a single line on whitespace, tracking offsets", () => {
    const text = "hej verden 2";
    expect(walkDocumentWords(text)).toEqual([
      { text: "hej", start: 0, end: 3 },
      { text: "verden", start: 4, end: 10 },
      { text: "2", start: 11, end: 12 },
    ]);
  });

  it("collapses runs of whitespace between words", () => {
    const text = "one   two\tthree";
    expect(walkDocumentWords(text)).toEqual([
      { text: "one", start: 0, end: 3 },
      { text: "two", start: 6, end: 9 },
      { text: "three", start: 10, end: 15 },
    ]);
  });

  it("tracks offsets correctly across multiple lines", () => {
    const text = "line one\nline two";
    expect(walkDocumentWords(text)).toEqual([
      { text: "line", start: 0, end: 4 },
      { text: "one", start: 5, end: 8 },
      { text: "line", start: 9, end: 13 },
      { text: "two", start: 14, end: 17 },
    ]);
    expect(text.slice(9, 13)).toBe("line");
    expect(text.slice(14, 17)).toBe("two");
  });

  it("contributes no words for blank paragraph/page break lines", () => {
    const text = "para one\n\npara two\n\n\npage two";
    const words = walkDocumentWords(text);
    expect(words.map((w) => w.text)).toEqual([
      "para",
      "one",
      "para",
      "two",
      "page",
      "two",
    ]);
    for (const word of words) {
      expect(text.slice(word.start, word.end)).toBe(word.text);
    }
  });

  it("ignores leading/trailing whitespace on a line", () => {
    const text = "  leading and trailing  ";
    const words = walkDocumentWords(text);
    expect(words[0]).toEqual({ text: "leading", start: 2, end: 9 });
    const last = words[words.length - 1];
    expect(last).toEqual({ text: "trailing", start: 14, end: 22 });
  });
});

function words(text: string) {
  return walkDocumentWords(text);
}

describe("diffWordSequences / remapWordIndex", () => {
  it("maps every index unchanged when nothing changed", () => {
    const oldWords = words("hello 1 2 3");
    const newWords = words("hello 1 2 3");
    const diff = diffWordSequences(oldWords, newWords);
    for (let i = 0; i < oldWords.length; i++) {
      expect(remapWordIndex(diff, i)).toBe(i);
    }
  });

  it("remaps a word after a deletion earlier in the sequence, rather than dropping it (regression: deleting one flagged word cleared unrelated marks after it)", () => {
    // "hello 1 2 3" -> delete "2 " -> "hello 1 3"
    const oldWords = words("hello 1 2 3");
    const newWords = words("hello 1 3");
    const diff = diffWordSequences(oldWords, newWords);

    // "1" (index 1) is untouched and before the edit: keeps its index.
    expect(remapWordIndex(diff, 1)).toBe(1);
    // "2" (index 2) was the word actually deleted: no longer present.
    expect(remapWordIndex(diff, 2)).toBeNull();
    // "3" (index 3) shifted left to index 2, but is still "3" — must not
    // be dropped just because a word before it was removed.
    const newIndex = remapWordIndex(diff, 3);
    expect(newIndex).toBe(2);
    expect(newWords[newIndex!].text).toBe("3");
  });

  it("remaps indices after an insertion earlier in the sequence", () => {
    const oldWords = words("hello 1 2 3");
    const newWords = words("hello there 1 2 3");
    const diff = diffWordSequences(oldWords, newWords);

    expect(remapWordIndex(diff, 1)).toBe(2); // "1" shifted right by 1
    expect(remapWordIndex(diff, 3)).toBe(4); // "3" shifted right by 1
  });

  it("returns null for an index whose word was actually edited", () => {
    const oldWords = words("hello 1 2 3");
    const newWords = words("hello 1 two 3");
    const diff = diffWordSequences(oldWords, newWords);

    expect(remapWordIndex(diff, 1)).toBe(1); // "1" unaffected
    expect(remapWordIndex(diff, 2)).toBeNull(); // "2" -> "two": edited
    expect(remapWordIndex(diff, 3)).toBe(3); // "3" unaffected
  });

  it("returns null for every index when the whole sequence changed", () => {
    const oldWords = words("hello 1 2 3");
    const newWords = words("completely different text");
    const diff = diffWordSequences(oldWords, newWords);
    for (let i = 0; i < oldWords.length; i++) {
      expect(remapWordIndex(diff, i)).toBeNull();
    }
  });
});
