import { Node as PMNode } from "@tiptap/pm/model";

import { DocumentWord, walkDocumentWords } from "./document-words";

/**
 * The `/assemble` API's error body for a g2p-conversion failure: alongside
 * the generic `detail` message, it includes the words it couldn't convert
 * and a partially-assembled RAS document containing a `<w>` element for
 * every word actually submitted, in document order, with the words that
 * failed g2p carrying an empty `ARPABET` attribute.
 */
export interface G2pAssembleErrorBody {
  detail: string;
  g2p_error_words?: string[];
  partial_ras?: string;
}

export function isG2pAssembleErrorBody(
  body: unknown,
): body is G2pAssembleErrorBody {
  const candidate = body as Partial<G2pAssembleErrorBody> | null;
  return (
    !!candidate &&
    Array.isArray(candidate.g2p_error_words) &&
    typeof candidate.partial_ras === "string"
  );
}

/**
 * A word that failed g2p, both by its position in the document's word
 * sequence (stable identity, for tracking whether the user has since
 * edited it) and its current ProseMirror position range (for decorating
 * it).
 */
export interface G2pErrorWord {
  /** Index into `walkDocumentWords(submittedDoc)`. */
  index: number;
  from: number;
  to: number;
}

/**
 * Maps a g2p assemble error's `partial_ras` back onto the words in the
 * doc that was actually submitted, by matching each `<w>` element in
 * `partial_ras` positionally against `walkDocumentWords(submittedDoc)` —
 * the Nth word submitted is assumed to be the Nth `<w>` returned. This is
 * deliberately *not* a string match against `g2p_error_words`: repeated
 * words/symbols in the document would be indistinguishable that way.
 *
 * Returns `null` (rather than a best-effort guess) if `partial_ras` isn't
 * parseable XML, or if its word count doesn't match the submitted doc's
 * word count — callers should fall back to non-positional error reporting
 * in that case, since the mapping can no longer be trusted to point at the
 * right word.
 */
export function mapG2pErrorsToPositions(
  submittedDoc: PMNode,
  partialRas: string,
): G2pErrorWord[] | null {
  const wordElements = parsePartialRasWords(partialRas);
  if (wordElements === null) {
    return null;
  }

  const words = walkDocumentWords(submittedDoc);
  if (words.length !== wordElements.length) {
    return null;
  }

  const errors: G2pErrorWord[] = [];
  words.forEach((word: DocumentWord, index: number) => {
    if (!wordElements[index]) {
      errors.push({ index, from: word.from, to: word.to });
    }
  });
  return errors;
}

/**
 * Parses `partial_ras` and returns, for each `<w>` element in document
 * order, whether it has a non-empty `ARPABET` attribute (i.e. g2p
 * succeeded for that word). Returns `null` if the string isn't valid XML.
 */
function parsePartialRasWords(partialRas: string): boolean[] | null {
  const doc = new DOMParser().parseFromString(partialRas, "application/xml");
  if (doc.querySelector("parsererror")) {
    return null;
  }
  return Array.from(doc.querySelectorAll("w")).map(
    (w) => (w.getAttribute("ARPABET") ?? "").length > 0,
  );
}
