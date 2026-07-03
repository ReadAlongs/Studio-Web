import { getSchema } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";

import { readAlongExtensions } from "../schema/nodes";
import { docToReadAlongXml } from "./doc-to-xml";

function buildTestSchema(): Schema {
  return getSchema(readAlongExtensions);
}

function sentence(schema: Schema, text: string) {
  return schema.nodes["sentence"].createChecked(null, schema.text(text));
}

function paragraph(schema: Schema, ...sentences: string[]) {
  return schema.nodes["paragraph"].createChecked(
    null,
    sentences.map((text) => sentence(schema, text)),
  );
}

describe("docToReadAlongXml", () => {
  it("serializes a single page, single paragraph, single sentence doc", () => {
    const schema = buildTestSchema();
    const doc = schema.nodes["doc"].createChecked(null, [
      paragraph(schema, "Hello world."),
    ]);
    expect(docToReadAlongXml(doc)).toBe(
      "<?xml version='1.0' encoding='utf-8'?>\n" +
        '<read-along version="1.2"><text><body>' +
        '<div type="page"><p><s>Hello world.</s></p></div>' +
        "</body></text></read-along>",
    );
  });

  it("serializes multiple sentences within a paragraph", () => {
    const schema = buildTestSchema();
    const doc = schema.nodes["doc"].createChecked(null, [
      paragraph(schema, "Hi.", "Bye."),
    ]);
    expect(docToReadAlongXml(doc)).toContain("<p><s>Hi.</s><s>Bye.</s></p>");
  });

  it("serializes multiple paragraphs within a page", () => {
    const schema = buildTestSchema();
    const doc = schema.nodes["doc"].createChecked(null, [
      paragraph(schema, "Paragraph one."),
      paragraph(schema, "Paragraph two."),
    ]);
    const xml = docToReadAlongXml(doc);
    expect(xml).toContain(
      '<div type="page"><p><s>Paragraph one.</s></p><p><s>Paragraph two.</s></p></div>',
    );
  });

  it("splits into a new page div at a pagebreak node", () => {
    const schema = buildTestSchema();
    const doc = schema.nodes["doc"].createChecked(null, [
      paragraph(schema, "Page one."),
      schema.nodes["pagebreak"].createChecked(),
      paragraph(schema, "Page two."),
    ]);
    const xml = docToReadAlongXml(doc);
    expect(xml).toContain(
      '<div type="page"><p><s>Page one.</s></p></div><div type="page"><p><s>Page two.</s></p></div>',
    );
  });

  it("does not emit an empty page div for a trailing pagebreak", () => {
    const schema = buildTestSchema();
    const doc = schema.nodes["doc"].createChecked(null, [
      paragraph(schema, "Only page."),
      schema.nodes["pagebreak"].createChecked(),
    ]);
    const xml = docToReadAlongXml(doc);
    expect(xml.match(/<div type="page">/g)?.length).toBe(1);
  });

  it("escapes XML special characters in sentence text", () => {
    const schema = buildTestSchema();
    const doc = schema.nodes["doc"].createChecked(null, [
      paragraph(schema, "A & B < C > D"),
    ]);
    expect(docToReadAlongXml(doc)).toContain("<s>A &amp; B &lt; C &gt; D</s>");
  });
});
