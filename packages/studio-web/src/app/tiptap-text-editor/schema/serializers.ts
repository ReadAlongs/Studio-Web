import { Fragment, Node as PMNode } from "@tiptap/pm/model";

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
 * plainText -> tipTapDoc: the pre-TipTap convention (one blank line = a
 * paragraph break, two or more = a page break) is restored here — it's what
 * users pasting or uploading a `.txt` file authored under that convention
 * still expect, even though live typing has its own Enter-driven mechanism
 * and never infers a page from blank-line count (there's no page-break key
 * combo to type).
 *
 * Non-blank lines accumulate into the current paragraph as sentences. A run
 * of exactly one blank line closes the current paragraph and becomes its
 * own empty paragraph (a paragraph break). A run of two or more blank lines
 * becomes one `pagebreak` node — the two blanks that signal the page are
 * consumed by it; any further blanks in that run become ordinary empty
 * paragraphs after the break, so a bigger gap still produces a bigger
 * visual gap once docToReadAlongXml's spacer collapsing runs.
 */
export function plainTextToDoc(text: string): PMNode {
  const lines = text.split(/\r\n|\r|\n/);
  const blocks: PMNode[] = [];
  let current: string[] = [];
  let blankRun = 0;

  // A paragraph with zero sentence children (as opposed to one empty
  // sentence) renders as a childless <div>, which collapses to no visible
  // height — matching live typing's blank-line paragraphs (schema/nodes.ts's
  // Sentence Enter handler) here is what makes a pasted blank line actually
  // show up as a blank line in the editor.
  const emptyParagraph = () =>
    schema.nodes["paragraph"].create(null, [schema.nodes["sentence"].create()]);

  const flushCurrent = () => {
    if (current.length === 0) {
      return;
    }
    blocks.push(
      schema.nodes["paragraph"].create(
        null,
        current.map((line) =>
          schema.nodes["sentence"].create(null, schema.text(line)),
        ),
      ),
    );
    current = [];
  };

  const flushBlankRun = () => {
    if (blankRun === 1) {
      blocks.push(emptyParagraph());
    } else if (blankRun >= 2) {
      blocks.push(schema.nodes["pagebreak"].create());
      for (let i = 0; i < blankRun - 2; i++) {
        blocks.push(emptyParagraph());
      }
    }
    blankRun = 0;
  };

  for (const line of lines) {
    if (line.trim() === "") {
      flushCurrent();
      blankRun += 1;
    } else {
      flushBlankRun();
      current.push(line);
    }
  }
  flushCurrent();
  flushBlankRun();

  return blocks.length > 0
    ? schema.nodes["doc"].create(null, blocks)
    : emptyDoc();
}

/**
 * Not one of the three main serializers — bridges `uploadService.$currentText`
 * (a plain-text `Blob`) now that the doc is the source of truth, and also
 * doubles as the editor's `clipboardTextSerializer` (given a copied
 * selection's `Slice.content` instead of a whole doc — same shape, both
 * expose `forEach` over their top-level page/paragraph/pagebreak children).
 * Each paragraph's sentences join with "\n"; an explicit `pagebreak` exports
 * as two blank lines and an empty paragraph as one — the inverse of
 * plainTextToDoc's page/paragraph-break convention, so copying out and
 * pasting back in round-trips. One-way export, not a round-trip contract in
 * itself.
 */
export function docToPlainText(content: PMNode | Fragment): string {
  const paragraphTexts: string[] = [];
  content.forEach((node) => {
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
