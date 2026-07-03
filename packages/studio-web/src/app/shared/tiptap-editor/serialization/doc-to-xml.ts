import { Node as PMNode } from "@tiptap/pm/model";

const XML_DECLARATION = "<?xml version='1.0' encoding='utf-8'?>";

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function serializeSentence(sentence: PMNode): string {
  return `<s>${escapeXmlText(sentence.textContent)}</s>`;
}

function serializeParagraph(paragraph: PMNode): string {
  const sentences: string[] = [];
  paragraph.forEach((sentence) => sentences.push(serializeSentence(sentence)));
  return `<p>${sentences.join("")}</p>`;
}

/**
 * Serializes a ReadAlong TipTap doc (schema/nodes.ts) to read-along-1.2
 * input XML: `<div type="page">` per pagebreak-delimited run of
 * paragraphs, `<p>` per paragraph, `<s>` per sentence, sentence content as
 * plain text (not pre-split into `<w>` elements — the assemble endpoint
 * tokenizes and runs g2p itself, same as it does for plain-text input;
 * `<w>` only appears in what the server returns).
 *
 * The first page's `<div>` opens implicitly at the start of the doc; a
 * `pagebreak` node closes the current page div and opens a new one rather
 * than mapping onto any element of its own.
 */
export function docToReadAlongXml(doc: PMNode): string {
  const pages: string[][] = [[]];

  doc.forEach((node) => {
    if (node.type.name === "pagebreak") {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(serializeParagraph(node));
    }
  });

  const divs = pages
    .filter((paragraphs) => paragraphs.length > 0)
    .map((paragraphs) => `<div type="page">${paragraphs.join("")}</div>`)
    .join("");

  return `${XML_DECLARATION}\n<read-along version="1.2"><text><body>${divs}</body></text></read-along>`;
}
