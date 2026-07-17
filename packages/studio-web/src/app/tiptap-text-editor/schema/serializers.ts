import { Node as PMNode } from "@tiptap/pm/model";

import { emptyDoc, schema } from "./nodes";

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
 *
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

/**
 * Inverse of docToReadAlongXml. Reads `<div type="page">` / `<p>` / `<s>`
 * structure and text only — `.textContent` on each `<s>` naturally discards
 * any `<w>` wrapper elements and their `ARPABET`/`id` attributes that a real
 * uploaded `.readalong` file may contain, since it flattens child markup to
 * concatenated text.
 */
export function readAlongXmlToDoc(xml: string): PMNode {
  const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");
  if (xmlDoc.querySelector("parsererror")) {
    throw new Error("Could not parse read-along XML.");
  }

  const pageDivs = Array.from(xmlDoc.querySelectorAll('div[type="page"]'));
  const blocks: PMNode[] = [];
  pageDivs.forEach((div, i) => {
    if (i > 0) {
      blocks.push(schema.nodes["pagebreak"].create());
    }
    Array.from(div.querySelectorAll(":scope > p")).forEach((p) => {
      const sentences = Array.from(p.querySelectorAll(":scope > s")).map(
        (s) => {
          const text = s.textContent ?? "";
          return schema.nodes["sentence"].create(
            null,
            text.length > 0 ? schema.text(text) : undefined,
          );
        },
      );
      blocks.push(schema.nodes["paragraph"].create(null, sentences));
    });
  });

  return blocks.length > 0
    ? schema.nodes["doc"].create(null, blocks)
    : emptyDoc();
}

/**
 * plainText -> tipTapDoc grouping
 * within a page, one paragraph; each non-empty line becomes a
 * sentence; a run of 2+ empty lines starts a new page. A single blank line
 * carries no meaning on its own.
 */
export function plainTextToDoc(text: string): PMNode {
  const lines = text.split(/\r\n|\r|\n/);
  const pages: string[][] = [[]];
  let blankRun = 0;
  for (const line of lines) {
    if (line.trim() === "") {
      blankRun += 1;
      if (blankRun === 2) {
        pages.push([]);
      }
      continue;
    }
    blankRun = 0;
    pages[pages.length - 1].push(line);
  }

  const blocks: PMNode[] = [];
  pages
    .filter((sentenceLines) => sentenceLines.length > 0)
    .forEach((sentenceLines, i) => {
      if (i > 0) {
        blocks.push(schema.nodes["pagebreak"].create());
      }
      blocks.push(
        schema.nodes["paragraph"].create(
          null,
          sentenceLines.map((line) =>
            schema.nodes["sentence"].create(null, schema.text(line)),
          ),
        ),
      );
    });

  return blocks.length > 0
    ? schema.nodes["doc"].create(null, blocks)
    : emptyDoc();
}

/**
 * Not one of the three main architectural serializers
 * rather, a small convenience used only by the pre-existing "Save a copy"
 * plain-text export button, so that feature keeps working now that the
 * TipTap doc (not a raw string) is the source of truth. Mirrors
 * plainTextToDoc's line/page conventions in reverse.
 */
export function docToPlainText(doc: PMNode): string {
  const pageTexts: string[] = [];
  let currentPageLines: string[] = [];
  doc.forEach((node) => {
    if (node.type.name === "pagebreak") {
      pageTexts.push(currentPageLines.join("\n"));
      currentPageLines = [];
    } else {
      node.forEach((sentence) => currentPageLines.push(sentence.textContent));
    }
  });
  pageTexts.push(currentPageLines.join("\n"));
  return pageTexts.join("\n\n\n");
}
