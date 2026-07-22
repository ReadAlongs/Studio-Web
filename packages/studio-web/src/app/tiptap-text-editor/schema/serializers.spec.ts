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
  it("treats one blank line as a paragraph break and two or more as a page break", () => {
    const text = [
      "Hello world.",
      "Second sentence.",
      "",
      "Middle line.",
      "",
      "",
      "Page two.",
      "",
      "",
      "",
      "",
      "Last line.",
    ].join("\n");

    const doc = plainTextToDoc(text);
    // A blank line becomes a paragraph holding one empty sentence, not zero
    // — matching live typing, and what keeps it visible as a blank line
    // rather than a collapsed, invisible <div> (see plainTextToDoc's
    // emptyParagraph comment).
    const emptyParagraph = () =>
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(),
      ]);

    const expected = schema.nodes["doc"].create(null, [
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Hello world.")),
        schema.nodes["sentence"].create(null, schema.text("Second sentence.")),
      ]),
      emptyParagraph(), // one blank line -> paragraph break
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Middle line.")),
      ]),
      schema.nodes["pagebreak"].create(), // two blank lines -> page break
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Page two.")),
      ]),
      schema.nodes["pagebreak"].create(), // four blank lines -> page break ...
      emptyParagraph(), // ... plus 2 leftover blanks
      emptyParagraph(),
      schema.nodes["paragraph"].create(null, [
        schema.nodes["sentence"].create(null, schema.text("Last line.")),
      ]),
    ]);

    expect(doc.toJSON()).toEqual(expected.toJSON());
  });
});
