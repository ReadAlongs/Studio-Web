import { getSchema } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";

import { readAlongExtensions } from "../schema/nodes";
import { docToReadAlongXml } from "./doc-to-xml";
import { xmlToDoc } from "./xml-to-doc";

function buildTestSchema(): Schema {
  return getSchema(readAlongExtensions);
}

describe("xmlToDoc", () => {
  it("throws on unparseable XML", () => {
    const schema = buildTestSchema();
    expect(() => xmlToDoc(schema, "<not<valid")).toThrow();
  });

  it("parses an XML doc with no page content as the schema's empty-doc fallback", () => {
    const schema = buildTestSchema();
    const doc = xmlToDoc(
      schema,
      '<read-along version="1.2"><text><body></body></text></read-along>',
    );
    expect(doc.childCount).toBe(1);
    expect(doc.child(0).type.name).toBe("paragraph");
  });

  it("parses a single page/paragraph/sentence", () => {
    const schema = buildTestSchema();
    const doc = xmlToDoc(
      schema,
      '<read-along version="1.2"><text><body><div type="page"><p><s>Hello world.</s></p></div></body></text></read-along>',
    );
    expect(doc.childCount).toBe(1);
    expect(doc.child(0).type.name).toBe("paragraph");
    expect(doc.child(0).textContent).toBe("Hello world.");
  });

  it("reconstructs sentence text from already-aligned <w> elements and their surrounding whitespace", () => {
    const schema = buildTestSchema();
    const doc = xmlToDoc(
      schema,
      '<read-along version="1.2"><text><body><div type="page"><p>' +
        '<s><w ARPABET="T HH IY S" time="0.5" dur="0.57">This</w> <w ARPABET="IY S" time="1.07" dur="0.13">is</w>.</s>' +
        "</p></div></body></text></read-along>",
    );
    expect(doc.child(0).child(0).textContent).toBe("This is.");
  });

  it("skips do-not-align translation sentences", () => {
    const schema = buildTestSchema();
    const doc = xmlToDoc(
      schema,
      '<read-along version="1.2"><text><body><div type="page"><p>' +
        "<s>Real sentence.</s>" +
        '<s do-not-align="true" xml:lang="eng">Translation.</s>' +
        "</p></div></body></text></read-along>",
    );
    expect(doc.child(0).childCount).toBe(1);
    expect(doc.child(0).textContent).toBe("Real sentence.");
  });

  it("inserts a pagebreak between page divs", () => {
    const schema = buildTestSchema();
    const doc = xmlToDoc(
      schema,
      '<read-along version="1.2"><text><body>' +
        '<div type="page"><p><s>Page one.</s></p></div>' +
        '<div type="page"><p><s>Page two.</s></p></div>' +
        "</body></text></read-along>",
    );
    expect(doc.childCount).toBe(3);
    expect(doc.child(1).type.name).toBe("pagebreak");
  });

  it("round-trips through docToReadAlongXml/xmlToDoc for multi-page, multi-paragraph XML", () => {
    const schema = buildTestSchema();
    const original = docToReadAlongXml(
      schema.nodes["doc"].createChecked(null, [
        schema.nodes["paragraph"].createChecked(null, [
          schema.nodes["sentence"].createChecked(null, schema.text("Hi.")),
          schema.nodes["sentence"].createChecked(null, schema.text("Bye.")),
        ]),
        schema.nodes["pagebreak"].createChecked(),
        schema.nodes["paragraph"].createChecked(null, [
          schema.nodes["sentence"].createChecked(
            null,
            schema.text("Page two."),
          ),
        ]),
      ]),
    );
    const roundTripped = xmlToDoc(schema, original);
    expect(docToReadAlongXml(roundTripped)).toBe(original);
  });
});
