# ReadAlong Studio — TipTap Editor Feature Prompts

Prompts for driving Claude Code through three features:

1. Replace the plain-text input area with a TipTap rich text editor (no `ngx-tiptap` unless forced).
2. Treat page breaks as real, insertable/clickable/removable nodes, and normalize pasted plain text (strip styling; 2+ empty lines become a page break).
3. Highlight the specific "un-processable" words the g2p engine reports, token-precisely.

The central architectural fact: **the TipTap document is the source of truth.** We serialize it to `read-along-1.2` input XML to send to the backend, and deserialize `.txt` and `.readalong` XML back into the document for upload/paste. So the real substance is a node schema plus three serializers.

## How to use this file

- Send the prompts to Claude Code **one at a time, in order**, in the same session.
- **The design decisions live inside Prompt 0.** Edit them there before sending — what you edit is what Claude Code receives. Prompt 0 records those decisions into `implementation_plan.md` and `CLAUDE.md`, and every later prompt begins by reading those two files, so each pasted prompt is self-sufficient (even in a fresh session).
- **Stop after Prompt 0.** Read and edit `implementation_plan.md` and `CLAUDE.md`, then continue.
- Commit after each prompt so each feature is a reviewable diff.

---

## Prompt 0 — Discovery, implementation plan, and CLAUDE.md

> You are working in the ReadAlong Studio codebase (an Angular app for building text/audio-aligned "readalongs"). Do **not** write any feature code in this step. Your only outputs are `implementation_plan.md` and `CLAUDE.md`. You may read anything and run read-only commands (list files, print configs, run the existing tests once to confirm they pass).
>
> **Design decisions (already made — treat as given).** Record this list **verbatim** in `implementation_plan.md` as resolved decisions, and fold the build-relevant ones (4, 6, 8) into `CLAUDE.md`:
>
> 1. The TipTap document is the source of truth. Convert only at the boundaries, via three serializers: `plainText → tipTapDoc` and `readAlongXml → tipTapDoc` for paste/upload, and `tipTapDoc → readAlongXml` to send to the backend. The `tipTapDoc → readAlongXml` shape is fixed by the reference serializer in Prompt 1.
> 2. g2p runs only when the user starts the align (text + audio) step, through the existing request path, and may return the error `{ detail, g2p_error_words: string[], partial_ras: string }`.
> 3. Highlighting is token-precise: highlight the exact failing token(s), not every occurrence of the word. Highlights ride along when surrounding text changes and clear when the token's own text changes.
> 4. The editor has **no inline marks** (no bold/italic/link/heading) — only pages, paragraphs, sentences, and text.
> 5. Highlight style: a red underline plus a highlight over the offending character(s). No tooltip, count, or navigation for now.
> 6. Use `@tiptap/core` directly, **not** `ngx-tiptap`, unless concretely blocked — and then stop and ask.
> 7. `plainText → tipTapDoc` grouping: within a page, one paragraph; each line becomes a sentence; 2+ empty lines start a new page. **Confirm or challenge this in `implementation_plan.md`** before building; the alternative is one paragraph per hard line.
> 8. Write legible, reviewable code: small focused diffs, clarity over cleverness, and only a few focused spec tests — enough to document intent, not so many that review becomes hard.
>
> **Inventory the codebase.** Read closely and take notes on:
>
> - The component(s) that render the plain-text input area today, and how their value is stored and consumed downstream.
> - **The exact current blank-line parsing** (one empty line = paragraph break, two = page break) — quote the code. We are replacing it; note single-newline handling so we can match intent.
> - The align (text + audio) request: which endpoint it calls, what body/content-type it sends, and **whether it accepts `read-along-1.2` XML or plain text as input**. Find where the g2p/build **error** is handled and confirm its shape matches decision 2.
> - **Where the language code is collected in the UI, and how it reaches the backend** — is it an `xml:lang` (and `fallback-langs`) attribute on `<text>`, or a separate request field/param? This determines how `tipTapDoc → readAlongXml` must attach language (the reference serializer omits it).
> - The file-upload path for `.txt` and `.readalong` files, and where uploaded content currently enters the pipeline.
> - Angular idioms: standalone components vs NgModules, signals vs RxJS, forms wiring, any existing `ControlValueAccessor` to copy.
> - The i18n setup (this project is heavily translated): how UI strings are registered/referenced and where keys live.
> - UI conventions: any component library (e.g. Angular Material) for buttons/toolbars.
> - Test runner, spec location/conventions, and how heavy existing specs are.
> - `package.json` (is TipTap/ProseMirror already present?), lint/format config, and the exact build/test/lint commands.
>
> **Verify library facts, don't trust memory.** Check the current major version of TipTap and the correct way to embed `@tiptap/core` in an Angular component for that version, against the official docs. Record both in `CLAUDE.md`.
>
> **Write `implementation_plan.md`** containing:
>
> - The design decisions above, verbatim.
> - A concise map of the current architecture: where input lives, how it's parsed, how the align request is built and sent, and where g2p errors surface (cite file paths).
> - The **node schema** to introduce: `tipTapDoc → (paragraph | pagebreak)*`, `paragraph → sentence*`, `sentence` holds plain text, `pagebreak` is an atomic block node. No inline marks. Point at where this schema will live (e.g. a `schema/nodes.ts`).
> - The **three serializers** and their contracts, with `tipTapDoc → readAlongXml` fixed by the reference implementation in Prompt 1. Define `readAlongXml → tipTapDoc` as its inverse (extract page/paragraph/sentence text; **discard** any `<w>`, `ARPABET`, and `id` attributes) and `plainText → tipTapDoc` per decision 7 — **confirm or challenge decision 7 here.**
> - How **language** attaches to `tipTapDoc → readAlongXml` (per your discovery) — state the concrete decision.
> - The **highlighting** approach: ProseMirror **decorations** (never marks — highlights must never enter the document, undo history, or serialized XML), token-precise via the ordinal positions of empty-`ARPABET` `<w>` elements in `partial_ras`, remapped through transactions and self-removing when the covered text changes.
> - A **minimal** testing plan. Highest-value specs: the `tipTapDoc ↔ readAlongXml` round-trip and the `plainText → tipTapDoc` transform. One focused spec each.
> - An "Open questions for the human" section.
> - A short ordered checklist mirroring Prompts 1–4.
>
> **Write `CLAUDE.md`** — short standing instructions:
>
> - Exact build/test/lint commands.
> - Observed code style (standalone vs modules, signals vs RxJS, naming, layout, formatting) so new code is indistinguishable from existing.
> - i18n requirement and the exact mechanism/key location.
> - UI convention to match (component library, button patterns).
> - TipTap decision: use `@tiptap/core` directly (record the verified version + integration pattern); consider `ngx-tiptap` only if blocked — and then stop and ask.
> - Decision 8's directive on legible code and minimal tests.
> - "Stop and ask before": adding un-discussed dependencies, changing the `tipTapDoc → readAlongXml` contract, large refactors, or touching the align/g2p request contract.
>
> Do not install anything or modify other files in this step.

---

## Prompt 1 — Node schema, editor shell, and the three serializers

> First read `CLAUDE.md` and `implementation_plan.md`; they carry the design decisions and the plan. Keep the diff small and reviewable.
>
> Build the foundation: the node schema, the TipTap editor component that replaces the textarea, and the three serializers. Page-break UI and paste normalization are Prompt 2; highlighting is Prompt 3 — leave clean seams.
>
> **Node schema** (`schema/nodes.ts` or as the plan specifies): `tipTapDoc → (paragraph | pagebreak)*`, `paragraph → sentence*`, `sentence` holding inline text, `pagebreak` an atomic, selectable block node with no content. Register only Document, Paragraph (as our paragraph), our sentence node, Text, History, and pagebreak — **no** bold/italic/link/heading marks.
>
> **Editor component:** instantiate a `@tiptap/core` `Editor`, created after view init and destroyed on teardown, bridged to the existing form mechanism the plan identified (implement `ControlValueAccessor` if that matches surrounding code). Swap it into the component currently hosting the textarea; preserve labels/placeholder/validation; route any new string through i18n; match existing styling.
>
> **Serializers** — implement three functions in one module:
>
> - `tipTapDoc → readAlongXml`: use this reference implementation as the **authoritative contract** (adapt imports/naming to the final schema; attach the language code per the plan's decision):
>
> ```ts
> import { Node as PMNode } from "@tiptap/pm/model";
>
> const XML_DECLARATION = "<?xml version='1.0' encoding='utf-8'?>";
>
> function escapeXmlText(text: string): string {
>   return text
>     .replace(/&/g, "&amp;")
>     .replace(/</g, "&lt;")
>     .replace(/>/g, "&gt;");
> }
>
> function serializeSentence(sentence: PMNode): string {
>   return `<s>${escapeXmlText(sentence.textContent)}</s>`;
> }
>
> function serializeParagraph(paragraph: PMNode): string {
>   const sentences: string[] = [];
>   paragraph.forEach((sentence) =>
>     sentences.push(serializeSentence(sentence)),
>   );
>   return `<p>${sentences.join("")}</p>`;
> }
>
> /**
>  * Serializes a ReadAlong TipTap doc (schema/nodes.ts) to read-along-1.2
>  * input XML: `<div type="page">` per pagebreak-delimited run of
>  * paragraphs, `<p>` per paragraph, `<s>` per sentence, sentence content as
>  * plain text (not pre-split into `<w>` elements — the assemble endpoint
>  * tokenizes and runs g2p itself, same as it does for plain-text input;
>  * `<w>` only appears in what the server returns).
>  *
>  * The first page's `<div>` opens implicitly at the start of the doc; a
>  * `pagebreak` node closes the current page div and opens a new one rather
>  * than mapping onto any element of its own.
>  */
> export function docToReadAlongXml(doc: PMNode): string {
>   const pages: string[][] = [[]];
>   doc.forEach((node) => {
>     if (node.type.name === "pagebreak") {
>       pages.push([]);
>     } else {
>       pages[pages.length - 1].push(serializeParagraph(node));
>     }
>   });
>   const divs = pages
>     .filter((paragraphs) => paragraphs.length > 0)
>     .map((paragraphs) => `<div type="page">${paragraphs.join("")}</div>`)
>     .join("");
>   return `${XML_DECLARATION}\n<read-along version="1.2"><text><body>${divs}</body></text></read-along>`;
> }
> ```
>
> - `readAlongXml → tipTapDoc`: the inverse. Parse `<div type="page">` runs into `pagebreak`-delimited pages, `<p>` into paragraphs, `<s>` into sentences, element text into sentence text. **Discard** any `<w>`, `ARPABET`, and `id` attributes present in an uploaded file — keep only page/paragraph/sentence structure and text. Round-trips with the serializer above.
> - `plainText → tipTapDoc` (per the plan's confirmed grouping decision): split into pages on 2+ consecutive empty lines; within a page, one paragraph whose sentences are the remaining non-empty lines. Match the single-newline intent documented in the plan.
>
> **Wire the boundaries:** route `.txt` uploads through `plainText → tipTapDoc` and `.readalong` uploads through `readAlongXml → tipTapDoc`; send `docToReadAlongXml(editor.state.doc)` on the align request (with language attached per the plan). Do not otherwise change the request contract.
>
> Testing: one spec for the `tipTapDoc ↔ readAlongXml` round-trip, one for `plainText → tipTapDoc`. Nothing more.
>
> Report changed files and confirm build/test/lint pass.

---

## Prompt 2 — Page-break UX and paste normalization

> First read `CLAUDE.md` and `implementation_plan.md`. Small, reviewable diff.
>
> **Page-break node UX:** render the `pagebreak` node (from Prompt 1) via a NodeView as a clear, clickable divider that can be selected and deleted like any block. Add an "Insert page break" toolbar control and a command that inserts it at the cursor, matching existing UI/button conventions; route the label through i18n.
>
> **Paste normalization:** intercept paste, strip everything to plain text, then reuse the Prompt 1 `plainText → tipTapDoc` rules to build the pasted fragment — so 2+ empty lines become page-break nodes and lines become sentences, and no bold/italic/hyperlink survives. Do not rely on the schema alone to strip formatting; normalize explicitly.
>
> Testing: one spec — pasting legacy-format plain text (with a double blank line) yields the expected paragraph + sentence + page-break structure. No exhaustive edge cases.
>
> Report changed files and confirm build/test/lint pass.

---

## Prompt 3 — Token-precise highlighting of un-processable words

> First read `CLAUDE.md` and `implementation_plan.md`. Small, reviewable diff.
>
> When the align request returns the g2p error `{ detail, g2p_error_words, partial_ras }`, highlight the exact failing tokens in the editor.
>
> - Implement highlighting as ProseMirror **decorations** via a small TipTap extension holding a decoration set in plugin state, updated through a command/meta transaction. Decorations must **never** enter the document, undo history, or serialized XML.
> - **Token-precise mapping:** parse `partial_ras`; the failing tokens are the `<w>` elements with an empty `ARPABET` attribute. Use their **ordinal positions** within the document's word sequence (not string matching) to locate the corresponding tokens in the editor doc, and decorate those exact character ranges. This distinguishes a failing token from an identical-looking token elsewhere.
> - **Lifecycle:** map decorations forward through every transaction so they stay on their token when surrounding text changes; store each decoration's original token text and **drop the decoration when the text it covers no longer equals that original** (so editing the token clears its highlight). Re-running align rebuilds the set.
> - **Style:** a red underline plus a highlight over the offending character(s), via a CSS class. No tooltip.
>
> Testing: one spec — given a sample `partial_ras` (include a repeated token where only one instance failed) and a known doc, decorations land on the expected ranges, and editing a flagged token removes its decoration. Nothing more.
>
> Report changed files and confirm build/test/lint pass.

---

## Prompt 4 — Review and tidy pass

> First read `CLAUDE.md` and `implementation_plan.md`. Self-review the three features against them:
>
> - Confirm every new user-facing string is translated.
> - Confirm the `tipTapDoc ↔ readAlongXml` round-trip is stable for a mixed document (multiple pages, multiple sentences) and that language is attached correctly.
> - Confirm highlights are decorations only and never appear in serialized XML.
> - Confirm no stray dependencies and no inline marks leaked into the schema.
> - Run build, tests, and lint; fix failures.
> - Review the diff for legibility: remove dead code, make comments explain _why_, and flag anything larger than it should be for my review.
> - Update the checklist in `implementation_plan.md`.
>
> Summarize what changed per feature and list anything still needing a human decision.
