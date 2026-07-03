import { Extension } from "@tiptap/core";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { canSplit } from "@tiptap/pm/transform";

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
 * New paragraph, containing a new sentence — the Enter command. Exported
 * standalone (rather than only inline in `addKeyboardShortcuts`) so it can
 * be unit tested against a hand-built `EditorState` without needing a real
 * `Editor`/DOM.
 */
export function enterCommand({ state, dispatch }: CommandProps): boolean {
  if (!isCollapsedInSentence(state)) {
    return false;
  }
  const pos = state.selection.from;
  if (!canSplitIntoNewParagraph(state.doc, pos)) {
    return false;
  }
  if (dispatch) {
    const tr = state.tr;
    splitIntoNewParagraph(tr, pos);
    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * New sentence, same paragraph — the Shift+Enter command. A plain
 * depth-1 split (unlike Enter's depth-2 split), so it doesn't need the
 * `split-into-new-paragraph` helper.
 */
export function shiftEnterCommand({ state, dispatch }: CommandProps): boolean {
  if (!isCollapsedInSentence(state)) {
    return false;
  }
  const pos = state.selection.from;
  const typesAfter = [{ type: state.schema.nodes["sentence"] }];
  if (!canSplit(state.doc, pos, 1, typesAfter)) {
    return false;
  }
  if (dispatch) {
    dispatch(state.tr.split(pos, 1, typesAfter).scrollIntoView());
  }
  return true;
}

/**
 * Enter splits at the paragraph level (new paragraph, containing a new
 * sentence); Shift+Enter splits at the sentence level only (new sentence,
 * same paragraph). Default ProseMirror Enter handling only splits one
 * level (the immediate parent block), so both directions need an explicit
 * command here rather than relying on stock keymap behavior.
 *
 * Both commands no-op (return false, falling through to any other
 * handler) unless the selection is a collapsed cursor directly inside a
 * `sentence` — e.g. a NodeSelection on a pagebreak, or a cross-sentence
 * range selection, isn't handled here.
 */
export const ReadAlongKeymap = Extension.create({
  name: "readAlongKeymap",

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.command(enterCommand),
      "Shift-Enter": () => this.editor.commands.command(shiftEnterCommand),
    };
  },
});
