import { getSchema } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";

import { readAlongExtensions } from "../schema/nodes";
import { docToReadAlongXml } from "./doc-to-xml";
import { textToDoc } from "./text-to-doc";

function buildTestSchema(): Schema {
  return getSchema(readAlongExtensions);
}

describe("textToDoc", () => {
  it("parses an empty string as the schema's empty-doc fallback", () => {
    const schema = buildTestSchema();
    const doc = textToDoc(schema, "");
    expect(doc.childCount).toBe(1);
    expect(doc.child(0).type.name).toBe("paragraph");
    expect(doc.child(0).child(0).type.name).toBe("sentence");
  });

  it("parses a single line as one paragraph containing one sentence", () => {
    const schema = buildTestSchema();
    const doc = textToDoc(schema, "Hello world.");
    expect(doc.childCount).toBe(1);
    expect(doc.child(0).type.name).toBe("paragraph");
    expect(doc.child(0).childCount).toBe(1);
    expect(doc.child(0).textContent).toBe("Hello world.");
  });

  it("parses consecutive lines as sentences within one paragraph", () => {
    const schema = buildTestSchema();
    const doc = textToDoc(schema, "Sentence one.\nSentence two.");
    expect(doc.childCount).toBe(1);
    expect(doc.child(0).childCount).toBe(2);
    expect(doc.child(0).child(0).textContent).toBe("Sentence one.");
    expect(doc.child(0).child(1).textContent).toBe("Sentence two.");
  });

  it("splits into a new paragraph on a single blank line", () => {
    const schema = buildTestSchema();
    const doc = textToDoc(schema, "Paragraph one.\n\nParagraph two.");
    expect(doc.childCount).toBe(2);
    expect(doc.child(0).type.name).toBe("paragraph");
    expect(doc.child(1).type.name).toBe("paragraph");
    expect(doc.child(0).textContent).toBe("Paragraph one.");
    expect(doc.child(1).textContent).toBe("Paragraph two.");
  });

  it("inserts a pagebreak on two or more consecutive blank lines", () => {
    const schema = buildTestSchema();
    const doc = textToDoc(schema, "Page one.\n\n\nPage two.");
    expect(doc.childCount).toBe(3);
    expect(doc.child(0).type.name).toBe("paragraph");
    expect(doc.child(1).type.name).toBe("pagebreak");
    expect(doc.child(2).type.name).toBe("paragraph");
  });

  it("drops a trailing blank run instead of emitting an empty paragraph or pagebreak", () => {
    const schema = buildTestSchema();
    const doc = textToDoc(schema, "Only paragraph.\n\n\n");
    expect(doc.childCount).toBe(1);
    expect(doc.child(0).textContent).toBe("Only paragraph.");
  });

  it("round-trips through docToReadAlongXml/textToDoc for multi-page, multi-paragraph text", () => {
    const schema = buildTestSchema();
    const original =
      "Sentence one.\nSentence two.\n\nParagraph two.\n\n\nPage two sentence.";
    const doc = textToDoc(schema, original);
    const xml = docToReadAlongXml(doc);
    expect(xml).toContain(
      '<div type="page"><p><s>Sentence one.</s><s>Sentence two.</s></p><p><s>Paragraph two.</s></p></div>',
    );
    expect(xml).toContain(
      '<div type="page"><p><s>Page two sentence.</s></p></div>',
    );
  });
});
