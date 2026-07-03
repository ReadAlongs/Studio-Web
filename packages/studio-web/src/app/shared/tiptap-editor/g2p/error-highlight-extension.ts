import { Extension } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface ErrorRange {
  from: number;
  to: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    errorHighlight: {
      /**
       * Replaces the set of underlined error ranges, resolved against
       * the doc at the moment this command runs. Call it again whenever
       * you have a fresh set to show (e.g. right after mapping a g2p
       * error response onto the current doc) — already-set ranges don't
       * need re-setting on every keystroke, since they keep themselves
       * in sync with edits on their own (see
       * `applyErrorHighlightTransaction`).
       */
      setErrorRanges: (ranges: ErrorRange[]) => ReturnType;
    };
  }
}

export const errorHighlightPluginKey = new PluginKey<DecorationSet>(
  "errorHighlight",
);

function makeDecoration(doc: PMNode, from: number, to: number): Decoration {
  return Decoration.inline(
    from,
    to,
    { class: "readalong-error-word" },
    { word: doc.textBetween(from, to) },
  );
}

/**
 * Computes the next decoration set for `tr`:
 *  - if `tr` carries a fresh set of ranges (via the `setErrorRanges`
 *    command's meta), rebuilds from those;
 *  - otherwise, if the doc changed, maps each existing decoration
 *    forward and drops it unless its text survived *exactly* unchanged
 *    — a flagged range collapsing to nothing means its word was deleted,
 *    and a surviving-but-different range means the word was edited into
 *    something else, both cases where the old g2p flag no longer applies
 *    (matching the old textarea overlay's per-word-clears-on-edit
 *    behavior, but via `tr.mapping`'s built-in position tracking instead
 *    of a hand-rolled word-index diff over raw string offsets);
 *  - otherwise, passes the existing set through unchanged.
 *
 * Exported standalone (rather than only inline in the plugin's `apply`)
 * so it can be unit tested against hand-built `Transaction`s.
 */
export function applyErrorHighlightTransaction(
  tr: Transaction,
  decorations: DecorationSet,
): DecorationSet {
  const setRanges = tr.getMeta(errorHighlightPluginKey) as
    | ErrorRange[]
    | undefined;
  if (setRanges) {
    return DecorationSet.create(
      tr.doc,
      setRanges.map((range) => makeDecoration(tr.doc, range.from, range.to)),
    );
  }

  if (!tr.docChanged) {
    return decorations;
  }

  const survivors: Decoration[] = [];
  decorations.find().forEach((decoration) => {
    const from = tr.mapping.map(decoration.from, 1);
    const to = tr.mapping.map(decoration.to, -1);
    if (from >= to) {
      return;
    }
    const word = (decoration.spec as { word: string }).word;
    if (tr.doc.textBetween(from, to) !== word) {
      return;
    }
    survivors.push(makeDecoration(tr.doc, from, to));
  });
  return DecorationSet.create(tr.doc, survivors);
}

/**
 * Underlines words flagged by a g2p error (see g2p-error-mapping.ts) via
 * Decorations rather than a mark: decorations live in plugin state, not
 * the document, so error flags never enter undo history and are never
 * serialized back out to XML.
 */
export const ErrorHighlightExtension = Extension.create({
  name: "errorHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: errorHighlightPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: applyErrorHighlightTransaction,
        },
        props: {
          decorations(state) {
            return errorHighlightPluginKey.getState(state);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setErrorRanges:
        (ranges: ErrorRange[]) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(errorHighlightPluginKey, ranges);
            dispatch(tr);
          }
          return true;
        },
    };
  },
});
