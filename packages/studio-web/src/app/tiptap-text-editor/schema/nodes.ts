import { getSchema, Node } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
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
