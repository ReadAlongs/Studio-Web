import { Node as PMNode, Schema } from "@tiptap/pm/model";

/**
 * Parses the ReadAlong plain-text convention (one sentence per line; a
 * single blank line separates paragraphs; two or more consecutive blank
 * lines separate pages — see the historical `findBlankLineRuns`) into a
 * ReadAlong TipTap doc (schema/nodes.ts), so existing plain-text content
 * ($textInput, placeholder examples, plain .txt uploads) can seed the
 * editor.
 *
 * A trailing blank run (blank lines with no further content after them)
 * is dropped rather than turned into an empty trailing paragraph or a
 * pointless final pagebreak, mirroring how docToReadAlongXml drops empty
 * trailing page divs.
 */
export function textToDoc(schema: Schema, text: string): PMNode {
  const children: PMNode[] = [];
  let currentLines: string[] = [];
  let blankRun = 0;

  const flushParagraph = () => {
    if (currentLines.length > 0) {
      children.push(
        schema.nodes["paragraph"].createChecked(
          null,
          currentLines.map((line) =>
            schema.nodes["sentence"].createChecked(
              null,
              line ? schema.text(line) : undefined,
            ),
          ),
        ),
      );
      currentLines = [];
    }
  };

  for (const line of text.split("\n")) {
    if (line.length === 0) {
      blankRun++;
      continue;
    }
    if (blankRun > 0) {
      flushParagraph();
      if (blankRun >= 2) {
        children.push(schema.nodes["pagebreak"].createChecked());
      }
      blankRun = 0;
    }
    currentLines.push(line);
  }
  flushParagraph();

  if (children.length === 0) {
    return schema.nodes["doc"].createAndFill() as PMNode;
  }
  return schema.nodes["doc"].createChecked(null, children);
}
