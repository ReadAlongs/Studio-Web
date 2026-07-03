import { mergeAttributes, Node } from "@tiptap/core";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";

import { insertPageBreakCommand } from "./insert-page-break-command";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pagebreak: {
      /**
       * Inserts a pagebreak at the cursor, splitting the enclosing
       * paragraph around it if the cursor isn't already at a paragraph
       * boundary. @example editor.commands.insertPageBreak()
       */
      insertPageBreak: () => ReturnType;
    };
  }
}

/**
 * The document schema maps directly onto the ReadAlong XML structure
 * (read-along-1.2.dtd) instead of the plain-text blank-line convention:
 * `<div type="page">` <-> pagebreak-delimited runs of paragraphs, `<p>` <->
 * paragraph, `<s>` <-> sentence. One-sentence-per-line is preserved from
 * the textarea-based implementation: a paragraph is a sequence of
 * sentences, never bare inline text.
 */

export const ReadAlongDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(paragraph|pagebreak)+",
});

export const Paragraph = Node.create({
  name: "paragraph",
  group: "block",
  content: "sentence+",
  marks: "",
  parseHTML() {
    return [{ tag: "p" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      mergeAttributes(HTMLAttributes, { class: "tiptap-paragraph" }),
      0,
    ];
  },
});

/**
 * A single sentence/line within a paragraph. Kept as a real block node
 * (rather than a `hardBreak` mark inside the paragraph) so Enter/
 * Shift+Enter can use native ProseMirror block-split operations, and so
 * each sentence maps 1:1 onto a `<s>` element with no reconstruction
 * needed at serialization time.
 */
export const Sentence = Node.create({
  name: "sentence",
  content: "text*",
  marks: "",
  parseHTML() {
    return [{ tag: "div.tiptap-sentence" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "tiptap-sentence" }),
      0,
    ];
  },
});

/**
 * Any node literally named "text" is auto-recognized by prosemirror-model
 * as the schema's text node type (see `NodeType` construction in
 * prosemirror-model), so no `@tiptap/extension-text` dependency is needed.
 */
export const TextNode = Node.create({
  name: "text",
  group: "inline",
});

/**
 * A page break: a real, atomic, non-editable node <-> `<div type="page">`
 * boundary. Extends Tiptap's HorizontalRule (atomic `<hr>` node) rather
 * than TipTap's paid Pages extension, rendered far more prominently than
 * the paragraph separator (see tiptap-editor.component.sass) so the two
 * are unambiguous at a glance. `setHorizontalRule`'s chain-based insert
 * command is replaced entirely by `insertPageBreak` (insert-page-break-
 * command.ts), which needs to split the surrounding paragraph rather than
 * just insert at the cursor.
 */
export const PageBreak = HorizontalRule.extend({
  name: "pagebreak",
  selectable: true,
  addInputRules() {
    return [];
  },
  addCommands() {
    return {
      insertPageBreak: () => insertPageBreakCommand,
    };
  },
  parseHTML() {
    return [{ tag: 'hr[data-type="pagebreak"]' }];
  },
  renderHTML() {
    return [
      "hr",
      mergeAttributes({
        "data-type": "pagebreak",
        // Read by tiptap-editor.component.sass via attr(data-label),
        // rather than a hardcoded CSS ::after string, so the on-canvas
        // page-break label goes through $localize like the rest of the
        // app's user-facing text.
        "data-label": $localize`Page break`,
      }),
    ];
  },
});

export const readAlongExtensions = [
  ReadAlongDocument,
  Paragraph,
  Sentence,
  TextNode,
  PageBreak,
];
