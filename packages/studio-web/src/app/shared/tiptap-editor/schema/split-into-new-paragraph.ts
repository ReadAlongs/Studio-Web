import { Node as PMNode, Schema } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import { canSplit } from "@tiptap/pm/transform";

/**
 * `Transform.split(pos, depth, typesAfter)` expects `typesAfter` ordered
 * outermost-first. For our doc > paragraph > sentence > text nesting, a
 * depth-2 split at a position inside a sentence's text needs the outer
 * (paragraph) type first, then the inner (sentence) type — see
 * prosemirror-transform's `split()`, which walks from `$pos.depth` down to
 * `$pos.depth - depth` and reads `typesAfter` in that same outer-to-inner
 * order.
 */
function twoLevelSplitTypesAfter(schema: Schema) {
  return [
    { type: schema.nodes["paragraph"] },
    { type: schema.nodes["sentence"] },
  ];
}

/**
 * Whether the sentence and its parent paragraph can both be split at
 * `pos` in `doc`, producing a new sentence wrapped in a new paragraph.
 */
export function canSplitIntoNewParagraph(doc: PMNode, pos: number): boolean {
  return canSplit(doc, pos, 2, twoLevelSplitTypesAfter(doc.type.schema));
}

/**
 * Splits the sentence at `pos` and its parent paragraph in one operation,
 * mutating `tr` in place. Default ProseMirror `splitBlock` only splits one
 * level, which isn't enough for "new sentence AND new paragraph" — used by
 * both the Enter keymap command and the mid-paragraph page-break insert
 * command, which both need to divide a paragraph into a "before" and
 * "after" half without corrupting the surrounding text.
 *
 * Returns `false` (leaving `tr` untouched) if the split isn't valid at
 * `pos` — callers should treat this the same as any other failed
 * ProseMirror command and not dispatch the transaction.
 */
export function splitIntoNewParagraph(tr: Transaction, pos: number): boolean {
  if (!canSplitIntoNewParagraph(tr.doc, pos)) {
    return false;
  }
  tr.split(pos, 2, twoLevelSplitTypesAfter(tr.doc.type.schema));
  return true;
}
