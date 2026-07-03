import { getSchema } from "@tiptap/core";
import { Node as PMNode, Schema } from "@tiptap/pm/model";

import { readAlongExtensions } from "../schema/nodes";
import { walkDocumentWords } from "./document-words";

const schema: Schema = buildTestSchema();

function buildTestSchema(): Schema {
  return getSchema(readAlongExtensions);
}

function sentence(text: string) {
  return schema.nodes["sentence"].createChecked(
    null,
    text ? schema.text(text) : undefined,
  );
}

function paragraph(...sentences: string[]) {
  return schema.nodes["paragraph"].createChecked(
    null,
    sentences.map((text) => sentence(text)),
  );
}

/** A one-paragraph, one-sentence doc, for tests only concerned with word text. */
function docOf(text: string): PMNode {
  return schema.nodes["doc"].createChecked(null, [paragraph(text)]);
}

describe("walkDocumentWords", () => {
  it("returns nothing for the schema's empty-doc fallback", () => {
    const doc = schema.nodes["doc"].createAndFill() as PMNode;
    expect(walkDocumentWords(doc)).toEqual([]);
  });

  it("splits a single sentence on whitespace, tracking positions", () => {
    const doc = docOf("hej verden 2");
    // doc-start(0), paragraph content(1), sentence content/text start(2).
    expect(walkDocumentWords(doc)).toEqual([
      { text: "hej", from: 2, to: 5 },
      { text: "verden", from: 6, to: 12 },
      { text: "2", from: 13, to: 14 },
    ]);
  });

  it("collapses runs of whitespace between words", () => {
    const doc = docOf("one   two\tthree");
    expect(walkDocumentWords(doc).map((w) => w.text)).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("tracks positions correctly across multiple sentences and paragraphs, resolvable via textBetween", () => {
    const doc = schema.nodes["doc"].createChecked(null, [
      paragraph("line one", "line two"),
      paragraph("para two"),
    ]);
    const words = walkDocumentWords(doc);
    expect(words.map((w) => w.text)).toEqual([
      "line",
      "one",
      "line",
      "two",
      "para",
      "two",
    ]);
    for (const word of words) {
      expect(doc.textBetween(word.from, word.to)).toBe(word.text);
    }
  });

  it("contributes no words for a pagebreak node", () => {
    const doc = schema.nodes["doc"].createChecked(null, [
      paragraph("page one"),
      schema.nodes["pagebreak"].createChecked(),
      paragraph("page two"),
    ]);
    const words = walkDocumentWords(doc);
    expect(words.map((w) => w.text)).toEqual(["page", "one", "page", "two"]);
  });

  it("ignores leading/trailing whitespace in a sentence", () => {
    const doc = docOf("  leading and trailing  ");
    const words = walkDocumentWords(doc);
    expect(words[0].text).toBe("leading");
    expect(words[words.length - 1].text).toBe("trailing");
    for (const word of words) {
      expect(doc.textBetween(word.from, word.to)).toBe(word.text);
    }
  });

  it("skips a standalone punctuation-only token (matches the assemble API's own tokenizer, which never emits a <w> for one)", () => {
    const doc = docOf("Colon : really");
    expect(walkDocumentWords(doc).map((w) => w.text)).toEqual([
      "Colon",
      "really",
    ]);
  });

  it("counts punctuation attached to a real word as part of that one word, not a separate token", () => {
    const doc = docOf('punctuation, but "und" considers it a letter...');
    expect(walkDocumentWords(doc).map((w) => w.text)).toEqual([
      "punctuation,",
      "but",
      '"und"',
      "considers",
      "it",
      "a",
      "letter...",
    ]);
  });

  it("counts a digit run as a word", () => {
    const doc = docOf("Numbers 234 should be spelled out!");
    expect(walkDocumentWords(doc).map((w) => w.text)).toEqual([
      "Numbers",
      "234",
      "should",
      "be",
      "spelled",
      "out!",
    ]);
  });

  it("counts an orphan combining diacritic as a word (it gets its own <w> from the API, unlike bare punctuation)", () => {
    const doc = docOf("Stray diacritics ̓ are a problem.");
    expect(walkDocumentWords(doc).map((w) => w.text)).toEqual([
      "Stray",
      "diacritics",
      "̓",
      "are",
      "a",
      "problem.",
    ]);
  });
});
