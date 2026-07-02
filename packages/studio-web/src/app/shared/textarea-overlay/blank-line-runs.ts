/**
 * A run's `kind` follows the ReadAlong plain-text convention: a single
 * blank line separates paragraphs, two or more consecutive blank lines
 * separate pages.
 */
export type BlankLineRunKind = "paragraph" | "page";

export interface BlankLineRun {
  /** 0-based index (into `text.split("\n")`) of the first blank line. */
  startLine: number;
  /** 0-based index of the last blank line in the run (inclusive). */
  endLine: number;
  /** Number of consecutive blank lines in the run. */
  length: number;
  kind: BlankLineRunKind;
}

/**
 * Finds every run of one or more consecutive blank lines in `text`.
 *
 * Shared between the overlay's background tint and, later, the gutter
 * markers, so it deliberately returns raw line-index data rather than
 * anything rendering-specific.
 */
export function findBlankLineRuns(text: string): BlankLineRun[] {
  if (text === "") {
    // An empty document has no lines to separate, not one blank line.
    return [];
  }

  const lines = text.split("\n");
  const runs: BlankLineRun[] = [];
  let runStart: number | null = null;

  for (let i = 0; i <= lines.length; i++) {
    const isBlankLine = i < lines.length && lines[i].length === 0;
    if (isBlankLine) {
      if (runStart === null) {
        runStart = i;
      }
      continue;
    }
    if (runStart !== null) {
      const length = i - runStart;
      runs.push({
        startLine: runStart,
        endLine: i - 1,
        length,
        kind: length >= 2 ? "page" : "paragraph",
      });
      runStart = null;
    }
  }

  return runs;
}
