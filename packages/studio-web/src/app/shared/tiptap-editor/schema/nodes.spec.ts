import { getSchema } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";

import { readAlongExtensions } from "./nodes";

function buildTestSchema() {
  return getSchema(readAlongExtensions);
}

describe("ReadAlong document schema", () => {
  it("registers doc/paragraph/sentence/text/pagebreak node types", () => {
    const schema = buildTestSchema();
    expect(Object.keys(schema.nodes)).toEqual(
      jasmine.arrayContaining([
        "doc",
        "paragraph",
        "sentence",
        "text",
        "pagebreak",
      ]),
    );
  });

  it("auto-fills an empty document to one empty paragraph containing one empty sentence", () => {
    const schema = buildTestSchema();
    const doc = schema.nodes["doc"].createAndFill();
    expect(doc).not.toBeNull();
    expect(doc!.childCount).toBe(1);
    const paragraph = doc!.child(0);
    expect(paragraph.type.name).toBe("paragraph");
    expect(paragraph.childCount).toBe(1);
    expect(paragraph.child(0).type.name).toBe("sentence");
  });

  it("allows a paragraph containing multiple sentences", () => {
    const schema = buildTestSchema();
    const paragraph = schema.nodes["paragraph"].createChecked(null, [
      schema.nodes["sentence"].createChecked(null, schema.text("Hello.")),
      schema.nodes["sentence"].createChecked(null, schema.text("World.")),
    ]);
    expect(paragraph.childCount).toBe(2);
    expect(paragraph.textContent).toBe("Hello.World.");
  });

  it("allows paragraph and pagebreak nodes at the top level", () => {
    const schema = buildTestSchema();
    const doc = schema.nodes["doc"].createChecked(null, [
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("Page one.")),
      ]),
      schema.nodes["pagebreak"].createChecked(),
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("Page two.")),
      ]),
    ]);
    expect(doc.childCount).toBe(3);
    expect(doc.child(1).type.name).toBe("pagebreak");
  });

  it("rejects a sentence placed directly at the top level, without a paragraph wrapper", () => {
    const schema = buildTestSchema();
    expect(() =>
      schema.nodes["doc"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("orphan")),
      ]),
    ).toThrow();
  });

  it("rejects text placed directly inside a paragraph, without a sentence wrapper", () => {
    const schema = buildTestSchema();
    expect(() =>
      schema.nodes["paragraph"].createChecked(null, schema.text("orphan")),
    ).toThrow();
  });

  it("marks the pagebreak node as an atom with no content", () => {
    const schema = buildTestSchema();
    expect(schema.nodes["pagebreak"].isAtom).toBeTrue();
    expect(schema.nodes["pagebreak"].isLeaf).toBeTrue();
  });

  it('renders the pagebreak node as <hr data-type="pagebreak">', () => {
    const schema = buildTestSchema();
    const serializer = DOMSerializer.fromSchema(schema);
    const dom = serializer.serializeNode(schema.nodes["pagebreak"].create());
    expect((dom as HTMLElement).tagName.toLowerCase()).toBe("hr");
    expect((dom as HTMLElement).getAttribute("data-type")).toBe("pagebreak");
  });

  it('renders a paragraph as <p> wrapping one <div class="tiptap-sentence"> per sentence', () => {
    const schema = buildTestSchema();
    const serializer = DOMSerializer.fromSchema(schema);
    const paragraph = schema.nodes["paragraph"].createChecked(null, [
      schema.nodes["sentence"].createChecked(null, schema.text("Hi.")),
      schema.nodes["sentence"].createChecked(null, schema.text("Bye.")),
    ]);
    const dom = serializer.serializeNode(paragraph) as HTMLElement;
    expect(dom.tagName.toLowerCase()).toBe("p");
    const sentenceEls = dom.querySelectorAll("div.tiptap-sentence");
    expect(sentenceEls.length).toBe(2);
    expect(sentenceEls[0].textContent).toBe("Hi.");
    expect(sentenceEls[1].textContent).toBe("Bye.");
  });
});
