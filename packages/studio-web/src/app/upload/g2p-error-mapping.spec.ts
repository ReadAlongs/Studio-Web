import {
  isG2pAssembleErrorBody,
  mapG2pErrorsToRanges,
} from "./g2p-error-mapping";

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

describe("mapG2pErrorsToRanges", () => {
  it("maps the failing word to its index and character range in the submitted text (real example)", () => {
    const submittedText = "hej verden 2";
    const errors = mapG2pErrorsToRanges(submittedText, EXAMPLE_PARTIAL_RAS);
    expect(errors).toEqual([{ index: 2, start: 11, end: 12 }]);
    expect(submittedText.slice(11, 12)).toBe("2");
  });

  it("returns one entry per failing word, in document order", () => {
    const submittedText = "one 2 three 4";
    const partialRas = `<read-along><text><body><div type="page"><p><s>
      <w ARPABET="W AH N">one</w>
      <w ARPABET="">2</w>
      <w ARPABET="TH R IY">three</w>
      <w ARPABET="">4</w>
    </s></p></div></body></text></read-along>`;
    const errors = mapG2pErrorsToRanges(submittedText, partialRas);
    expect(errors).toEqual([
      { index: 1, start: 4, end: 5 },
      { index: 3, start: 12, end: 13 },
    ]);
  });

  it("disambiguates repeated words by position, not by string matching", () => {
    // Both instances of "2" are the same string, but only the second one
    // failed g2p in this partial_ras — a name-based match against
    // g2p_error_words couldn't tell them apart.
    const submittedText = "2 is not 2";
    const partialRas = `<read-along><text><body><div type="page"><p><s>
      <w ARPABET="T UW">2</w>
      <w ARPABET="IH Z">is</w>
      <w ARPABET="N AA T">not</w>
      <w ARPABET="">2</w>
    </s></p></div></body></text></read-along>`;
    const errors = mapG2pErrorsToRanges(submittedText, partialRas);
    expect(errors).toEqual([{ index: 3, start: 9, end: 10 }]);
  });

  it("returns an empty array when every word succeeded", () => {
    const submittedText = "hej verden";
    const partialRas = `<read-along><text><body><div type="page"><p><s>
      <w ARPABET="HH EH Y">hej</w>
      <w ARPABET="V Y D EH N">verden</w>
    </s></p></div></body></text></read-along>`;
    expect(mapG2pErrorsToRanges(submittedText, partialRas)).toEqual([]);
  });

  it("returns null for unparseable XML rather than guessing", () => {
    expect(mapG2pErrorsToRanges("hej verden 2", "<not valid xml")).toBeNull();
  });

  it("returns null when the word counts don't match, rather than guessing", () => {
    const submittedText = "hej verden 2 extra";
    const ranges = mapG2pErrorsToRanges(submittedText, EXAMPLE_PARTIAL_RAS);
    expect(ranges).toBeNull();
  });
});
