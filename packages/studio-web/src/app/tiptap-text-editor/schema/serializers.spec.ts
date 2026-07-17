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

describe("docToReadAlongXml empty-paragraph collapsing", () => {
  it("collapses a run of R consecutive empty paragraphs to floor(R/2) spacers", () => {
    const emptyParagraph = () => schema.nodes["paragraph"].create(null, []);
    const textParagraph = (text: string) =>
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text(text)),
      ]);
    const spacer = () => "<p><s></s></p>";

    const doc = schema.nodes["doc"].create(null, [
      emptyParagraph(), // isolated run of 1 -> 0 spacers
      textParagraph("First."),
      emptyParagraph(),
      emptyParagraph(), // run of 2 -> 1 spacer
      textParagraph("Second."),
      emptyParagraph(),
      emptyParagraph(),
      emptyParagraph(),
      emptyParagraph(), // run of 4 -> 2 spacers
      textParagraph("Third."),
    ]);

    const xml = docToReadAlongXml(doc);

    expect(xml).toContain(
      `<body><div type="page"><p><s>First.</s></p>${spacer()}<p><s>Second.</s></p>${spacer()}${spacer()}<p><s>Third.</s></p></div></body>`,
    );
  });
});

describe("plainTextToDoc", () => {
  it("gives each blank line its own empty paragraph, scaling with run length, and never inserts a page break", () => {
    const text = [
      "Hello world.",
      "Second sentence.",
      "",
      "Middle line.",
      "",
      "",
      "Last line.",
    ].join("\n");

    const doc = plainTextToDoc(text);

    const expected = schema.nodes["doc"].create(null, [
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Hello world.")),
        schema.nodes["sentence"].create(null, schema.text("Second sentence.")),
      ]),
      schema.nodes["paragraph"].create(null, []),
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Middle line.")),
      ]),
      schema.nodes["paragraph"].create(null, []),
      schema.nodes["paragraph"].create(null, []),
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Last line.")),
      ]),
    ]);

    expect(doc.toJSON()).toEqual(expected.toJSON());
  });
});
