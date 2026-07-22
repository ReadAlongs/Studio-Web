import { Editor, getSchema, Node } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { UndoRedo } from "@tiptap/extensions/undo-redo";

// tipTapDoc -> (paragraph | pagebreak)*
// The default `Document` content expression already matches this, since
// both Paragraph and PageBreak below declare group: "block".
export const Document = Node.create({
  name: "doc",
  topNode: true,
  content: "block+",
});

export const Text = Node.create({
  name: "text",
  group: "inline",
});

// paragraph -> sentence*
export const Paragraph = Node.create({
  name: "paragraph",
  group: "block",
  content: "sentence*",
  parseHTML() {
    return [{ tag: 'div[data-type="paragraph"]' }];
  },
  renderHTML() {
    return ["div", { "data-type": "paragraph" }, 0];
  },
});

// sentence holds plain inline text; rendered as its own line within a
// paragraph, since "each line becomes a sentence"
// needs a visual line break per sentence, not per paragraph.
export const Sentence = Node.create({
  name: "sentence",
  content: "text*",
  parseHTML() {
    return [{ tag: 'p[data-type="sentence"]' }];
  },
  renderHTML() {
    return ["p", { "data-type": "sentence" }, 0];
  },
  addKeyboardShortcuts() {
    return {
      // By default Enter only splits into a new sentence, never a new
      // paragraph, so typed blank lines would stay invisible to
      // docToReadAlongXml's paragraph-based spacing. Pressing Enter on an
      // already-empty sentence confirms that line as blank, promotes it to
      // its own paragraph, and opens a fresh paragraph for what comes next
      // — mirroring plainTextToDoc's per-blank-line paragraph, one Enter at
      // a time.
      Enter: () => {
        const editor = this.editor;
        const { $from } = editor.state.selection;
        if (
          $from.parent.type.name !== "sentence" ||
          $from.parent.content.size > 0
        ) {
          return false;
        }
        const paragraph = $from.node(-1);
        if (!paragraph || paragraph.type.name !== "paragraph") {
          return false;
        }

        const newParagraph = () => ({
          type: "paragraph",
          content: [{ type: "sentence" }],
        });
        // nodeSize of an empty { paragraph: [sentence] }: 2 (paragraph's
        // own open/close) + 2 (its empty sentence's open/close) = 4.
        const emptyParagraphSize = 4;

        if (paragraph.childCount > 1) {
          // The empty sentence trails real content — close the paragraph
          // with just its real content; the blank line it represented gets
          // its own preserved empty paragraph, separate from the fresh one
          // opened for whatever comes after it.
          editor
            .chain()
            .deleteRange({ from: $from.before(), to: $from.after() })
            .run();
          const insertAt = editor.state.selection.$from.after(-1);
          editor
            .chain()
            .insertContentAt(insertAt, [newParagraph(), newParagraph()])
            .setTextSelection(insertAt + emptyParagraphSize + 2)
            .run();
        } else {
          // This paragraph is already just a lone empty sentence — an
          // already-confirmed blank line from an earlier Enter-on-empty —
          // so it needs no change; just open a fresh paragraph after it.
          const insertAt = $from.after(-1);
          editor
            .chain()
            .insertContentAt(insertAt, newParagraph())
            .setTextSelection(insertAt + 2)
            .run();
        }
        return true;
      },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pagebreak: {
      insertPageBreak: () => ReturnType;
    };
  }
}

// pagebreak is atomic, so there's nowhere to type once it's selected with
// nothing after it — used both right after inserting one (tiptap-text-
// editor.component.ts's insertPageBreak()) and when Enter is pressed while
// an existing one is selected (this node's addKeyboardShortcuts below).
// No-ops (returns false) unless a pagebreak is actually NodeSelection'd.
export function continueAfterPageBreakSelection(editor: Editor): boolean {
  const { selection } = editor.state;
  if (
    !(selection instanceof NodeSelection) ||
    selection.node.type.name !== "pagebreak"
  ) {
    return false;
  }
  const afterPos = selection.to;
  editor
    .chain()
    .insertContentAt(afterPos, {
      type: "paragraph",
      content: [{ type: "sentence" }],
    })
    // +1 enters the paragraph, +2 enters the empty sentence inside it.
    .setTextSelection(afterPos + 2)
    .run();
  return true;
}

// Atomic, selectable divider — click to select, Backspace/Delete to remove,
// like any other block. The NodeView below controls the live editing
// appearance; renderHTML is still needed for getHTML()/copy-paste.
export const PageBreak = Node.create({
  name: "pagebreak",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'hr[data-type="pagebreak"]' }];
  },
  renderHTML() {
    return ["hr", { "data-type": "pagebreak" }];
  },
  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => continueAfterPageBreakSelection(this.editor),
    };
  },
  addNodeView() {
    return () => {
      const dom = document.createElement("div");
      dom.className = "pagebreak-node";
      dom.setAttribute("data-type", "pagebreak");
      dom.setAttribute("contenteditable", "false");

      const label = document.createElement("span");
      label.className = "pagebreak-node__label";
      label.textContent = $localize`Page break`;
      dom.appendChild(label);

      return {
        dom,
        // Single source of truth for the "selected" look: it must cover
        // both an exact NodeSelection on this pagebreak (clicking it) and a
        // broader selection merely passing over it (select-all, or a text
        // drag-select that spans a page break) — the latter has no native
        // browser highlight to fall back on, since this node's DOM is
        // contenteditable="false" with no text for ::selection to paint.
        // Both cases are covered by the decoration this node's plugin
        // (below) applies whenever the node's own position falls inside
        // the current selection's range.
        update: (updatedNode, decorations) => {
          if (updatedNode.type.name !== "pagebreak") {
            return false;
          }
          dom.classList.toggle(
            "pagebreak-node--selected",
            decorations.some(
              (d) => (d.spec as { selected?: boolean })?.selected,
            ),
          );
          return true;
        },
      };
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (
                node.type.name === "pagebreak" &&
                pos >= state.selection.from &&
                pos < state.selection.to
              ) {
                decorations.push(
                  Decoration.node(
                    pos,
                    pos + node.nodeSize,
                    {},
                    { selected: true },
                  ),
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export const schemaExtensions = [
  Document,
  Text,
  Paragraph,
  Sentence,
  PageBreak,
  UndoRedo,
];

export const schema = getSchema(schemaExtensions);

// A doc's minimal valid state is NOT zero blocks: `sentence`, not
// `paragraph`, is the textblock (it's the one with inline text content), so
// a paragraph filled with zero sentences leaves no textblock anywhere in
// the doc for the cursor to occupy. The genuinely-empty state needs one
// empty sentence for a cursor position to exist at all.
export function emptyDoc(): PMNode {
  return schema.nodes["doc"].create(null, [
    schema.nodes["paragraph"].create(null, [schema.nodes["sentence"].create()]),
  ]);
}
