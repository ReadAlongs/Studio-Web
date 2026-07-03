import { Node as PMNode, Schema } from "@tiptap/pm/model";

/**
 * Parses read-along XML (the DTD's `<div type="page">`/`<p>`/`<s>`
 * structure) into a ReadAlong TipTap doc (schema/nodes.ts), so an
 * uploaded `.xml`/`.readalong` file can seed the editor for further
 * editing — whether it's hand-authored (bare `<s>text</s>`) or a
 * previously-assembled file (`<s>` containing `<w>` word elements with
 * ARPABET/time attributes): either way, `<s>`'s `textContent` reconstructs
 * the plain sentence text, since assembled output keeps the original
 * inter-word spacing as text nodes between `<w>` elements.
 *
 * `<s do-not-align="true">` elements are sentence-level translations
 * (see the `sentence__translation` class in assembled output), not part
 * of the editable base text, and are skipped — including them would
 * duplicate content that docToReadAlongXml has no matching place to
 * serialize back out to.
 *
 * Throws if `xml` isn't parseable XML. Returns the schema's empty-doc
 * fallback if it parses but contains no page/paragraph/sentence content.
 */
export function xmlToDoc(schema: Schema, xml: string): PMNode {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  if (parsed.querySelector("parsererror")) {
    throw new Error("Invalid read-along XML: failed to parse.");
  }

  const children: PMNode[] = [];
  const pageDivs = Array.from(parsed.querySelectorAll('div[type="page"]'));

  pageDivs.forEach((div, index) => {
    const paragraphs: PMNode[] = [];
    Array.from(div.children)
      .filter((child) => child.tagName.toLowerCase() === "p")
      .forEach((p) => {
        const sentences = Array.from(p.children)
          .filter(
            (child) =>
              child.tagName.toLowerCase() === "s" &&
              child.getAttribute("do-not-align") !== "true",
          )
          .map((s) => {
            const text = (s.textContent ?? "").trim();
            return schema.nodes["sentence"].createChecked(
              null,
              text ? schema.text(text) : undefined,
            );
          });
        if (sentences.length > 0) {
          paragraphs.push(
            schema.nodes["paragraph"].createChecked(null, sentences),
          );
        }
      });

    if (paragraphs.length > 0) {
      if (index > 0 && children.length > 0) {
        children.push(schema.nodes["pagebreak"].createChecked());
      }
      children.push(...paragraphs);
    }
  });

  if (children.length === 0) {
    return schema.nodes["doc"].createAndFill() as PMNode;
  }
  return schema.nodes["doc"].createChecked(null, children);
}
