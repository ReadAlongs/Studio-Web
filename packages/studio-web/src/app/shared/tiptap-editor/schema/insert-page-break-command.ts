import { Node as PMNode } from "@tiptap/pm/model";
import { EditorState, TextSelection, Transaction } from "@tiptap/pm/state";

import {
  canSplitIntoNewParagraph,
  splitIntoNewParagraph,
} from "./split-into-new-paragraph";

interface CommandProps {
  state: EditorState;
  dispatch?: (tr: Transaction) => void;
}

function isCollapsedInSentence(state: EditorState): boolean {
  const { selection } = state;
  return selection.empty && selection.$from.parent.type.name === "sentence";
}

/**
 * Inserts a pagebreak node at the cursor, and leaves the cursor at the
 * start of the paragraph that follows it — the first line of the new
 * page — creating an empty one there first if the pagebreak would
 * otherwise land at the very end of the document (e.g. the cursor was at
 * the end of the last paragraph), so there's always somewhere to
 * immediately continue typing rather than a page break with nothing
 * after it.
 *
 * If the cursor sits exactly at the start or end of its enclosing
 * paragraph, the pagebreak is inserted as a sibling of that paragraph (no
 * split — avoids a spurious empty paragraph). Otherwise, the paragraph is
 * split at the cursor (reusing the same two-level split the Enter command
 * uses) and the pagebreak is inserted between the two resulting halves —
 * text on both sides of the cursor is preserved, never corrupted.
 *
 * No-ops (returns false) unless the selection is a collapsed cursor
 * inside a `sentence` — in particular, a NodeSelection on an
 * already-selected pagebreak is rejected, same as the Enter/Shift+Enter
 * commands.
 */
export function insertPageBreakCommand({
  state,
  dispatch,
}: CommandProps): boolean {
  if (!isCollapsedInSentence(state)) {
    return false;
  }

  const { $from } = state.selection;
  const pos = $from.pos;
  const pagebreakType = state.schema.nodes["pagebreak"];
  const paragraphType = state.schema.nodes["paragraph"];
  // $from.start(1)/end(1) are the paragraph's own content boundaries, one
  // token outside any sentence — unreachable while isCollapsedInSentence
  // holds. The reachable boundary is one token in: the first/last
  // sentence's own start/end.
  const paragraphStart = $from.start(1) + 1;
  const paragraphEnd = $from.end(1) - 1;

  const tr = state.tr;
  let insertAt: number;
  if (pos === paragraphStart) {
    insertAt = $from.before(1);
  } else if (pos === paragraphEnd) {
    insertAt = $from.after(1);
  } else {
    if (!canSplitIntoNewParagraph(state.doc, pos)) {
      return false;
    }
    splitIntoNewParagraph(tr, pos);
    // tr.mapping.map(pos) (default, rightward-biased) lands *inside* the
    // new right-hand sentence, at its first character — inserting an
    // atom there isn't a valid position for a `sentence`-only-allows-text
    // child, so ProseMirror's replace "fits" it by implicitly splitting
    // again, producing a spurious empty paragraph. Mapping leftward
    // instead lands just after the left-hand sentence's last character
    // (still depth `$from.depth`, i.e. inside a sentence); walking back
    // up `$from.depth` tokens (once per closing tag reopened by the
    // split) reaches the actual top-level gap between the two halves.
    insertAt = tr.mapping.map(pos, -1) + $from.depth;
  }

  if (dispatch) {
    const pagebreak = pagebreakType.create();
    const followingNode = tr.doc.nodeAt(insertAt);
    const afterPagebreak = insertAt + pagebreak.nodeSize;

    tr.insert(insertAt, pagebreak);
    if (followingNode?.type === paragraphType) {
      // A paragraph is already there (the pre-existing paragraph, for the
      // at-start case; the split-off second half, for the mid-paragraph
      // case) — just move the cursor into its first sentence.
      tr.setSelection(TextSelection.create(tr.doc, afterPagebreak + 2));
    } else {
      // The pagebreak landed at the very end of the document (or right
      // before another pagebreak) — nothing to continue typing into, so
      // create an empty paragraph and put the cursor there.
      const emptyParagraph = paragraphType.createAndFill() as PMNode;
      tr.insert(afterPagebreak, emptyParagraph);
      tr.setSelection(TextSelection.create(tr.doc, afterPagebreak + 2));
    }
    dispatch(tr.scrollIntoView());
  }
  return true;
}
