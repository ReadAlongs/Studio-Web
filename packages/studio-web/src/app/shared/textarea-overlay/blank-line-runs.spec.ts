import { findBlankLineRuns } from "./blank-line-runs";

describe("findBlankLineRuns", () => {
  it("returns nothing for text with no blank lines", () => {
    expect(findBlankLineRuns("hello\nworld")).toEqual([]);
  });

  it("classifies a single blank line as a paragraph break", () => {
    const runs = findBlankLineRuns("line one\n\nline two");
    expect(runs).toEqual([
      { startLine: 1, endLine: 1, length: 1, kind: "paragraph" },
    ]);
  });

  it("classifies two consecutive blank lines as a page break", () => {
    const runs = findBlankLineRuns("line one\n\n\nline two");
    expect(runs).toEqual([
      { startLine: 1, endLine: 2, length: 2, kind: "page" },
    ]);
  });

  it("classifies more than two consecutive blank lines as a page break", () => {
    const runs = findBlankLineRuns("line one\n\n\n\nline two");
    expect(runs).toEqual([
      { startLine: 1, endLine: 3, length: 3, kind: "page" },
    ]);
  });

  it("finds multiple runs", () => {
    const runs = findBlankLineRuns("a\n\nb\n\n\nc");
    expect(runs).toEqual([
      { startLine: 1, endLine: 1, length: 1, kind: "paragraph" },
      { startLine: 3, endLine: 4, length: 2, kind: "page" },
    ]);
  });

  it("handles blank lines at the start and end of the text", () => {
    const runs = findBlankLineRuns("\n\na\nb\n\n");
    expect(runs).toEqual([
      { startLine: 0, endLine: 1, length: 2, kind: "page" },
      { startLine: 4, endLine: 5, length: 2, kind: "page" },
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(findBlankLineRuns("")).toEqual([]);
  });

  it("treats a whitespace-only line as non-blank", () => {
    // A line with a stray space is not a true blank line, so it should
    // not be counted as part of a paragraph/page break run.
    const runs = findBlankLineRuns("a\n \nb");
    expect(runs).toEqual([]);
  });
});
