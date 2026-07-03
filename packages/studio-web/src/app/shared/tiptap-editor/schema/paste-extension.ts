import { Extension } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import { EditorState, Plugin, Transaction } from "@tiptap/pm/state";

import { textToDoc } from "../serialization/text-to-doc";

interface CommandProps {
  state: EditorState;
  dispatch?: (tr: Transaction) => void;
}

/**
 * Replaces the current selection with `text`, re-parsed as the ReadAlong
 * plain-text blank-line convention (see serialization/text-to-doc.ts).
 * Exported standalone (rather than only inline in `handlePaste`) so it
 * can be unit tested against a hand-built `EditorState` without needing
 * a real `EditorView`/DOM paste event.
 *
 * Always returns true (paste is always handled this way, unlike the
 * schema's other commands, which no-op on an invalid selection) —
 * `replaceSelection` with a closed (openStart/openEnd 0) slice is valid
 * from any selection, splitting the surrounding structure as needed the
 * same way a paste always would.
 */
export function pasteTextCommand(
  { state, dispatch }: CommandProps,
  text: string,
): boolean {
  const parsed = textToDoc(state.schema, text);
  if (dispatch) {
    const tr = state.tr.replaceSelection(new Slice(parsed.content, 0, 0));
    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Intercepts plain-text paste and re-parses it as the ReadAlong
 * plain-text blank-line convention, instead of letting ProseMirror's
 * default paste handling turn every line into its own paragraph and
 * lose the paragraph/page distinction entirely (verified empirically:
 * an unhandled paste of "line one\n\nline two\n\n\nline three" produces
 * three *separate* paragraphs, no pagebreak, and no per-paragraph
 * sentence grouping).
 *
 * This is how users bring in text prepared elsewhere (a plain .txt file
 * opened in another editor, content copied from an email, etc.) — the
 * same role the blank-line convention played for the old `<textarea>`,
 * which needed no special handling only because a textarea's value
 * *is* a raw string; a structured doc needs an explicit re-parse.
 */
export const ReadAlongPasteHandler = Extension.create({
  name: "readAlongPasteHandler",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData("text/plain");
            if (!text) {
              return false;
            }
            return pasteTextCommand(
              { state: view.state, dispatch: view.dispatch },
              text,
            );
          },
        },
      }),
    ];
  },
});
