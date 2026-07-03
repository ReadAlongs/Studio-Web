import { getSchema } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";

import { readAlongExtensions } from "../schema/nodes";
import {
  isG2pAssembleErrorBody,
  mapG2pErrorsToPositions,
} from "./g2p-error-mapping";

const schema: Schema = getSchema(readAlongExtensions);

function docOf(text: string) {
  return schema.nodes["doc"].createChecked(null, [
    schema.nodes["paragraph"].createChecked(null, [
      schema.nodes["sentence"].createChecked(null, schema.text(text)),
    ]),
  ]);
}

const EXAMPLE_PARTIAL_RAS = `<?xml version='1.0' encoding='utf-8'?>
<read-along version="1.2">
    <meta name="generator" content="@readalongs/studio (cli) 1.2.2" id="meta0"/>
    <text xml:lang="dan" fallback-langs="und" id="t0">
        <body id="t0b0">
            <div type="page" id="t0b0d0">
                <p id="t0b0d0p0">
                    <s id="t0b0d0p0s0"><w id="t0b0d0p0s0w0" ARPABET="HH EH Y">hej</w> <w id="t0b0d0p0s0w1" ARPABET="V Y D EH N">verden</w> <w id="t0b0d0p0s0w2" ARPABET="">2</w></s>
                </p>
            </div>
        </body>
    </text>
</read-along>`;

describe("isG2pAssembleErrorBody", () => {
  it("recognizes a body with g2p_error_words and partial_ras", () => {
    expect(
      isG2pAssembleErrorBody({
        detail: "g2p could not be performed...",
        g2p_error_words: ["2"],
        partial_ras: EXAMPLE_PARTIAL_RAS,
      }),
    ).toBeTrue();
  });

  it("rejects a plain error body", () => {
    expect(isG2pAssembleErrorBody({ detail: "text is empty" })).toBeFalse();
  });

  it("rejects null/non-object bodies", () => {
    expect(isG2pAssembleErrorBody(null)).toBeFalse();
    expect(isG2pAssembleErrorBody("just a string")).toBeFalse();
  });

  it("rejects a body missing partial_ras", () => {
    expect(
      isG2pAssembleErrorBody({ detail: "x", g2p_error_words: ["2"] }),
    ).toBeFalse();
  });
});

describe("mapG2pErrorsToPositions", () => {
  it("maps the failing word to its index and position in the submitted doc (real example)", () => {
    const doc = docOf("hej verden 2");
    const errors = mapG2pErrorsToPositions(doc, EXAMPLE_PARTIAL_RAS);
    expect(errors).toEqual([{ index: 2, from: 13, to: 14 }]);
    expect(doc.textBetween(13, 14)).toBe("2");
  });

  it("returns one entry per failing word, in document order", () => {
    const doc = docOf("one 2 three 4");
    const partialRas = `<read-along><text><body><div type="page"><p><s>
      <w ARPABET="W AH N">one</w>
      <w ARPABET="">2</w>
      <w ARPABET="TH R IY">three</w>
      <w ARPABET="">4</w>
    </s></p></div></body></text></read-along>`;
    const errors = mapG2pErrorsToPositions(doc, partialRas);
    expect(errors?.map((e) => e.index)).toEqual([1, 3]);
    expect(errors!.map((e) => doc.textBetween(e.from, e.to))).toEqual([
      "2",
      "4",
    ]);
  });

  it("disambiguates repeated words by position, not by string matching", () => {
    // Both instances of "2" are the same string, but only the second one
    // failed g2p in this partial_ras — a name-based match against
    // g2p_error_words couldn't tell them apart.
    const doc = docOf("2 is not 2");
    const partialRas = `<read-along><text><body><div type="page"><p><s>
      <w ARPABET="T UW">2</w>
      <w ARPABET="IH Z">is</w>
      <w ARPABET="N AA T">not</w>
      <w ARPABET="">2</w>
    </s></p></div></body></text></read-along>`;
    const errors = mapG2pErrorsToPositions(doc, partialRas);
    expect(errors?.length).toBe(1);
    expect(errors![0].index).toBe(3);
    expect(doc.textBetween(errors![0].from, errors![0].to)).toBe("2");
  });

  it("returns an empty array when every word succeeded", () => {
    const doc = docOf("hej verden");
    const partialRas = `<read-along><text><body><div type="page"><p><s>
      <w ARPABET="HH EH Y">hej</w>
      <w ARPABET="V Y D EH N">verden</w>
    </s></p></div></body></text></read-along>`;
    expect(mapG2pErrorsToPositions(doc, partialRas)).toEqual([]);
  });

  it("returns null for unparseable XML rather than guessing", () => {
    expect(
      mapG2pErrorsToPositions(docOf("hej verden 2"), "<not valid xml"),
    ).toBeNull();
  });

  it("returns null when the word counts don't match, rather than guessing", () => {
    const doc = docOf("hej verden 2 extra");
    expect(mapG2pErrorsToPositions(doc, EXAMPLE_PARTIAL_RAS)).toBeNull();
  });

  it("flags a digit run and an orphan diacritic without a standalone punctuation token throwing off the count (regression: a real 422 response where a bare ':' between words has no <w> at all)", () => {
    // Real response body for a paragraph of 3 sentences, one of which
    // contains a space-delimited ':' — the API never emits a <w> for it,
    // unlike the digit run and the orphan diacritic mark, which each get
    // their own (empty-ARPABET) <w>.
    const partialRas =
      "<?xml version='1.0' encoding='utf-8'?>\n" +
      '<read-along version="1.2"><text id="t0"><body id="t0b0"><div type="page" id="t0b0d0"><p id="t0b0d0p0">' +
      '<s id="t0b0d0p0s0"><w id="t0b0d0p0s0w0" ARPABET="CH OW L OW N">Colon</w> : <w id="t0b0d0p0s0w1" ARPABET="D EY AA L L Y">really</w> <w id="t0b0d0p0s0w2" ARPABET="S HH OW UW L D">should</w> <w id="t0b0d0p0s0w3" ARPABET="B EY">be</w> <w id="t0b0d0p0s0w4" ARPABET="IY G N OW D EY D">ignored</w> <w id="t0b0d0p0s0w5" ARPABET="AA S">as</w> <w id="t0b0d0p0s0w6" ARPABET="P UW N CH T UW AA T IY OW N">punctuation</w>, <w id="t0b0d0p0s0w7" ARPABET="B UW T">but</w> "<w id="t0b0d0p0s0w8" ARPABET="UW N D">und</w>" <w id="t0b0d0p0s0w9" ARPABET="CH OW N S IY D EY D S">considers</w> <w id="t0b0d0p0s0w10" ARPABET="IY T">it</w> <w id="t0b0d0p0s0w11" ARPABET="AA">a</w> <w id="t0b0d0p0s0w12" ARPABET="L EY T T EY D">letter</w>...</s>' +
      '<s id="t0b0d0p0s1"><w id="t0b0d0p0s1w0" ARPABET="N UW M B EY D S">Numbers</w> <w id="t0b0d0p0s1w1" ARPABET="">234</w> <w id="t0b0d0p0s1w2" ARPABET="S HH OW UW L D">should</w> <w id="t0b0d0p0s1w3" ARPABET="B EY">be</w> <w id="t0b0d0p0s1w4" ARPABET="S P EY L L EY D">spelled</w> <w id="t0b0d0p0s1w5" ARPABET="OW UW T">out</w>!</s>' +
      '<s id="t0b0d0p0s2"><w id="t0b0d0p0s2w0" ARPABET="S T D AA Y">Stray</w> <w id="t0b0d0p0s2w1" ARPABET="D IY AA CH D IY T IY CH S">diacritics</w> <w id="t0b0d0p0s2w2" ARPABET="">̓</w>  <w id="t0b0d0p0s2w3" ARPABET="AA D EY">are</w> <w id="t0b0d0p0s2w4" ARPABET="AA">a</w> <w id="t0b0d0p0s2w5" ARPABET="P D OW B L EY M">problem</w>.</s>' +
      "</p></div></body></text></read-along>";

    const doc = schema.nodes["doc"].createChecked(null, [
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(
          null,
          schema.text(
            'Colon : really should be ignored as punctuation, but "und" considers it a letter...',
          ),
        ),
        schema.nodes["sentence"].createChecked(
          null,
          schema.text("Numbers 234 should be spelled out!"),
        ),
        schema.nodes["sentence"].createChecked(
          null,
          schema.text("Stray diacritics ̓  are a problem."),
        ),
      ]),
    ]);

    const errors = mapG2pErrorsToPositions(doc, partialRas);
    expect(errors).not.toBeNull();
    expect(errors!.map((e) => doc.textBetween(e.from, e.to))).toEqual([
      "234",
      "̓",
    ]);
  });
});
