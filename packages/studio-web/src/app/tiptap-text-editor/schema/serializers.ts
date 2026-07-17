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

function isEmptyParagraph(paragraph: PMNode): boolean {
  return paragraph.textContent.trim() === "";
}

// Collapses a run of R consecutive empty paragraphs to floor(R/2) `<p>`
// placeholders: a lone empty paragraph (isolated editing artifacts, e.g.
// the placeholder insertPageBreak leaves when its trailing paragraph never
// gets typed into) contributes nothing, a run of 2-3 (a single typed blank
// line, or that plus a stray artifact) contributes one spacer, and bigger
// runs (a deliberate larger gap) scale from there — matching how
// plainTextToDoc treats a run of blank lines, but applied here to whatever
// the live doc actually contains, not just parsed plain text.
function serializePageParagraphs(paragraphs: PMNode[]): string[] {
  const result: string[] = [];
  let emptyRun = 0;
  const flushEmptyRun = () => {
    const spacerCount = Math.floor(emptyRun / 2);
    for (let i = 0; i < spacerCount; i++) {
      result.push("<p><s></s></p>");
    }
    emptyRun = 0;
  };
  for (const paragraph of paragraphs) {
    if (isEmptyParagraph(paragraph)) {
      emptyRun += 1;
    } else {
      flushEmptyRun();
      result.push(serializeParagraph(paragraph));
    }
  }
  flushEmptyRun();
  return result;
}

/**
 * Serializes a TipTap doc to read-along-1.2 XML: pagebreak-delimited runs
 * of paragraphs become `<div type="page">`, paragraphs become `<p>`,
 * sentences become `<s>` holding plain text (the backend tokenizes and runs
 * g2p itself; `<w>` only appears in what it returns). Language is embedded
 * as `xml:lang`/`fallback-langs` on `<text>`.
 */
export function docToReadAlongXml(doc: PMNode, lang: string = "und"): string {
  const pages: PMNode[][] = [[]];
  doc.forEach((node) => {
    if (node.type.name === "pagebreak") {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(node);
    }
  });
  const divs = pages
    .map((paragraphs) => serializePageParagraphs(paragraphs))
    .filter((paragraphXml) => paragraphXml.length > 0)
    .map((paragraphXml) => `<div type="page">${paragraphXml.join("")}</div>`)
    .join("");
  return `${XML_DECLARATION}\n<read-along version="1.2"><text xml:lang="${lang}" fallback-langs="und"><body>${divs}</body></text></read-along>`;
}

/**
 * Inverse of docToReadAlongXml. `.textContent` on each `<s>` discards any
 * `<w>`/`ARPABET`/`id` markup a real uploaded `.readalong` file may have.
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
 * plainText -> tipTapDoc: non-blank lines accumulate into
 * the current paragraph as sentences; each blank line closes the current
 * paragraph and becomes its own empty paragraph, so N blank lines produce N
 * empty paragraphs — not a page break, which is an explicit tiptap element only.
 * Empty sentences render as nothing in the web-component's Paragraph
 * renderer; empty paragraphs get their own margined container, which is
 * what makes gaps scale with blank-line count.
 */
export function plainTextToDoc(text: string): PMNode {
  const lines = text.split(/\r\n|\r|\n/);
  const paragraphs: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
      paragraphs.push([]);
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) {
    paragraphs.push(current);
  }

  const blocks = paragraphs.map((sentenceLines) =>
    schema.nodes["paragraph"].create(
      null,
      sentenceLines.map((line) =>
        schema.nodes["sentence"].create(null, schema.text(line)),
      ),
    ),
  );

  return blocks.length > 0
    ? schema.nodes["doc"].create(null, blocks)
    : emptyDoc();
}

/**
 * Not one of the three main serializers — bridges `uploadService.$currentText`
 * (a plain-text `Blob`) now that the doc is the source of truth. Each
 * paragraph's sentences join with "\n"; an explicit `pagebreak` exports as
 * two blank lines (the old page-break convention), an empty paragraph as
 * one. One-way export, not a round-trip contract.
 */
export function docToPlainText(doc: PMNode): string {
  const paragraphTexts: string[] = [];
  doc.forEach((node) => {
    if (node.type.name === "pagebreak") {
      paragraphTexts.push("", "");
    } else {
      const sentenceLines: string[] = [];
      node.forEach((sentence) => sentenceLines.push(sentence.textContent));
      paragraphTexts.push(sentenceLines.join("\n"));
    }
  });
  return paragraphTexts.join("\n");
}
