import { Node as PMNode } from "@tiptap/pm/model";

/** A word in the doc, with its ProseMirror position range: [from, to). */
export interface DocumentWord {
  /** The word's literal text (no surrounding whitespace). */
  text: string;
  from: number;
  to: number;
}

/**
 * Whether `token` has any word-forming content — a letter, number, or
 * combining mark (e.g. a stray diacritic) — as opposed to being pure
 * punctuation/symbols.
 */
function hasWordFormingContent(token: string): boolean {
  return /[\p{L}\p{N}\p{M}]/u.test(token);
}

/**
 * Walks `doc` in document order, returning each word (a run of
 * non-whitespace characters within a text node that contains at least
 * one letter, number, or mark) with its absolute ProseMirror position
 * range.
 *
 * A standalone run of pure punctuation (a lone `:`, an em dash used as
 * its own token, etc.) is *not* a word here, matching the assemble API's
 * own tokenizer: verified against a real 422 response where a
 * space-delimited `:` never got a `<w>` element at all (left as bare
 * text between its neighbors' `<w>`s), while punctuation *attached* to a
 * real word (`"und"`, `letter...`) stayed part of that word's single
 * `<w>`, and a digit run (`234`) or an orphan combining diacritic (a
 * `Mn`-category mark with no base letter) each got their own `<w>`.
 * Skipping punctuation-only tokens here keeps `walkDocumentWords`'s
 * count aligned with the API's `<w>` count — without it, one dropped
 * `:` shifts every later index by one, `mapG2pErrorsToPositions`'s
 * length check fails, and *no* word in the whole document gets flagged,
 * not just the mismatched one.
 *
 * Non-text nodes (in particular `pagebreak`) contribute no words on
 * their own — `doc.descendants` simply skips over them since they have
 * no text content to match against.
 *
 * Used once per g2p error response, to match the API's `<w>` elements
 * positionally against the doc that was submitted (see
 * g2p-error-mapping.ts). Unlike the old textarea overlay's equivalent
 * (which had to hand-roll a word-index diff to survive edits, since raw
 * string offsets don't track position across changes), the *positions*
 * this returns are real ProseMirror positions — `tr.mapping` already
 * keeps those valid across further edits, so no re-walk or index-remap
 * is needed after the fact (see error-highlight-extension.ts).
 */
export function walkDocumentWords(doc: PMNode): DocumentWord[] {
  const words: DocumentWord[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) {
      return;
    }
    const text = node.text ?? "";
    const wordPattern = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = wordPattern.exec(text)) !== null) {
      if (!hasWordFormingContent(match[0])) {
        continue;
      }
      words.push({
        text: match[0],
        from: pos + match.index,
        to: pos + match.index + match[0].length,
      });
    }
  });
  return words;
}
