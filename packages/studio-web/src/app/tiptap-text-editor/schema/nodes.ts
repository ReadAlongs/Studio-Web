import { Editor, getSchema, Node } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
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
        selectNode: () => dom.classList.add("pagebreak-node--selected"),
        deselectNode: () => dom.classList.remove("pagebreak-node--selected"),
      };
    };
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
