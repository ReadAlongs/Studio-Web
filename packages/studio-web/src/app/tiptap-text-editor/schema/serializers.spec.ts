import { schema } from "./nodes";
import {
  docToReadAlongXml,
  plainTextToDoc,
  readAlongXmlToDoc,
} from "./serializers";

describe("tipTapDoc <-> readAlongXml", () => {
  it("round-trips a multi-page, multi-sentence document", () => {
    const doc = schema.nodes["doc"].create(null, [
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Hello & world.")),
        schema.nodes["sentence"].create(null, schema.text("Second sentence.")),
      ]),
      schema.nodes["pagebreak"].create(),
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Page two.")),
      ]),
    ]);

    const xml = docToReadAlongXml(doc);
    const roundTripped = readAlongXmlToDoc(xml);

    expect(roundTripped.toJSON()).toEqual(doc.toJSON());
  });
});

describe("plainTextToDoc", () => {
  it("groups one paragraph per page, a line per sentence, a single blank line does nothing, 2+ blank lines start a new page", () => {
    const text = [
      "Hello world.",
      "Second sentence.",
      "",
      "Still page one.",
      "",
      "",
      "Page two.",
    ].join("\n");

    const doc = plainTextToDoc(text);

    const expected = schema.nodes["doc"].create(null, [
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Hello world.")),
        schema.nodes["sentence"].create(null, schema.text("Second sentence.")),
        schema.nodes["sentence"].create(null, schema.text("Still page one.")),
      ]),
      schema.nodes["pagebreak"].create(),
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Page two.")),
      ]),
    ]);

    expect(doc.toJSON()).toEqual(expected.toJSON());
  });
});
