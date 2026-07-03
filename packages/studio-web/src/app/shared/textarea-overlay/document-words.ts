/** A character range in the raw document string: [start, end). */
export interface TextRange {
  start: number;
  end: number;
}

export interface DocumentWord extends TextRange {
  /** The word's literal text (no surrounding whitespace). */
  text: string;
}

/**
 * Walks `text` in the same page → paragraph → line → word order used to
 * build an alignment request, returning each word with its character
 * offsets in the raw string.
 *
 * Blank separator lines (paragraph/page breaks) contribute no words, since
 * they're pure whitespace by definition — no separate pass over
 * findBlankLineRuns is needed to skip them.
 *
 * Shared by the g2p error underlining (matching a submitted word against
 * the corresponding `<w>` in the API's error response) and, later, any
 * other feature that needs to map "the Nth word of the document" to "its
 * range in the raw text."
 */
export function walkDocumentWords(text: string): DocumentWord[] {
  const words: DocumentWord[] = [];
  const lines = text.split("\n");

  let lineStart = 0;
  for (const line of lines) {
    const wordPattern = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = wordPattern.exec(line)) !== null) {
      words.push({
        text: match[0],
        start: lineStart + match.index,
        end: lineStart + match.index + match[0].length,
      });
    }
    lineStart += line.length + 1; // +1 for the "\n" this line was split on
  }

  return words;
}

/**
 * Describes where two word sequences (e.g. the document's words before and
 * after an edit) stop agreeing at the start, and resume agreeing at the
 * end — a cheap (O(n)) alternative to a full sequence alignment, good
 * enough to remap word indices across a *local* edit: everything before
 * `prefixLength` and everything from `oldSuffixStart`/`newSuffixStart`
 * onward is unchanged; everything between is the edited region.
 */
export interface WordSequenceDiff {
  prefixLength: number;
  oldSuffixStart: number;
  newSuffixStart: number;
}

export function diffWordSequences(
  oldWords: readonly DocumentWord[],
  newWords: readonly DocumentWord[],
): WordSequenceDiff {
  const maxPrefix = Math.min(oldWords.length, newWords.length);
  let prefixLength = 0;
  while (
    prefixLength < maxPrefix &&
    oldWords[prefixLength].text === newWords[prefixLength].text
  ) {
    prefixLength++;
  }

  const maxSuffix = Math.min(
    oldWords.length - prefixLength,
    newWords.length - prefixLength,
  );
  let suffixLength = 0;
  while (
    suffixLength < maxSuffix &&
    oldWords[oldWords.length - 1 - suffixLength].text ===
      newWords[newWords.length - 1 - suffixLength].text
  ) {
    suffixLength++;
  }

  return {
    prefixLength,
    oldSuffixStart: oldWords.length - suffixLength,
    newSuffixStart: newWords.length - suffixLength,
  };
}

/**
 * Maps `oldIndex` (an index into the word list `diff` was computed from)
 * onto the corresponding index in the newer word list, using the
 * unchanged prefix/suffix regions `diff` identified. Returns `null` if
 * `oldIndex` falls in the edited middle region, where it has no reliable
 * correspondent — words genuinely changed there, so callers should treat
 * this as "no longer the same word" rather than guess.
 */
export function remapWordIndex(
  diff: WordSequenceDiff,
  oldIndex: number,
): number | null {
  if (oldIndex < diff.prefixLength) {
    return oldIndex;
  }
  if (oldIndex >= diff.oldSuffixStart) {
    return diff.newSuffixStart + (oldIndex - diff.oldSuffixStart);
  }
  return null;
}
