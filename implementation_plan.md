# Implementation plan — TipTap editor for ReadAlong Studio text input

This plan covers Prompt 0 (discovery) of the four-prompt TipTap editor feature
(`.agent_history/prompts.md`). No feature code is written in this step.

## 1. Design decisions (given, verbatim)

1. The TipTap document is the source of truth. Convert only at the boundaries,
   via three serializers: `plainText → tipTapDoc` and `readAlongXml → tipTapDoc`
   for paste/upload, and `tipTapDoc → readAlongXml` to send to the backend. The
   `tipTapDoc → readAlongXml` shape is fixed by the reference serializer in
   Prompt 1.
2. g2p runs only when the user starts the align (text + audio) step, through
   the existing request path, and may return the error
   `{ detail, g2p_error_words: string[], partial_ras: string }`.
3. Highlighting is token-precise: highlight the exact failing token(s), not
   every occurrence of the word. Highlights ride along when surrounding text
   changes and clear when the token's own text changes.
4. The editor has **no inline marks** (no bold/italic/link/heading) — only
   pages, paragraphs, sentences, and text.
5. Highlight style: a red underline plus a highlight over the offending
   character(s). No tooltip, count, or navigation for now.
6. Use `@tiptap/core` directly, **not** `ngx-tiptap`, unless concretely
   blocked — and then stop and ask.
7. `plainText → tipTapDoc` grouping: within a page, one paragraph; each line
   becomes a sentence; 2+ empty lines start a new page. Confirmed below; the
   alternative is one paragraph per hard line.
8. Write legible, reviewable code: small focused diffs, clarity over
   cleverness, and only a few focused spec tests — enough to document intent,
   not so many that review becomes hard.

## 2. Current architecture (as found)

### Text input component

- `packages/studio-web/src/app/upload/upload.component.html:110-131` — a
  `<textarea matInput>` inside a `mat-form-field`, shown when
  `studioService.inputMethod.text === "edit"` (toggled by a
  `mat-button-toggle-group`, same file lines 19-36).
- Binding is **not** Angular Forms — it's a hand-rolled two-way binding to a
  plain `BehaviorSubject<string>`:
  `[ngModel]="studioService.$textInput | async"` +
  `(ngModelChange)="studioService.$textInput.next($event)"`.
  `$textInput` lives at `packages/studio-web/src/app/studio/studio.service.ts:44`.
- Downstream: in `UploadComponent`'s constructor
  (`upload.component.ts:135-145`), non-empty `$textInput` changes are wrapped
  into a `Blob` and pushed into `studioService.textControl$` — a real
  `FormControl<File | Blob | null>` (`studio.service.ts:36-39`), which is part
  of `uploadFormGroup` alongside `langControl$` and `audioControl$`
  (`studio.service.ts:44-48`). Typed text and uploaded files **converge on
  this one `FormControl`**.
- No `ControlValueAccessor` exists anywhere in this codebase today (verified
  by repo-wide grep) — there's no existing CVA pattern to copy. **Confirmed
  by human review**: the new editor will implement `ControlValueAccessor`
  and plug directly into `uploadFormGroup` in place of `textControl$`'s
  current manual-push wiring. This is a new pattern for this codebase (no
  existing CVA to model it on), so keep it small and conventional
  (`writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState`)
  rather than inventing anything clever.

### Blank-line parsing — does not exist client-side

There is **no client-side parser** that turns typed text into
pages/paragraphs. The raw string (newlines intact) is sent as-is to the
backend's `/assemble` endpoint, which does the segmentation server-side. The
rules are only documented to the user, in
`packages/studio-web/src/app/text-format-dialog/text-format-dialog.component.html:5-14`:

```html
<p i18n="Suggestion for one sentence per line">
  Each line should ideally contain one sentence, although that is not a strict
  rule.
</p>
<p i18n="Paragraph break directive">
  Paragraph breaks are indicated by inserting a blank line.
</p>
<p i18n="Page break directive">
  Page breaks are indicated by inserting two consecutive blank lines.
</p>
```

The _inverse_ (aligned XML → plain text, used for the "download as text"
export flow) does exist and confirms single-newline intent empirically —
`DownloadService.rasXMLToText()`,
`packages/studio-web/src/app/shared/download/download.service.ts:536-579`:

```ts
const nl = "\n";
const pageBreak = nl + nl;
const paraBreak = nl;
...
switch (true) {
  case tag === "div" && state != "page":
    state = "page";
    output.push(pageBreak);
    break;
  case tag === "p" && state != "page":
    output.push(paraBreak);
    break;
  case tag === "s":
    state = "sen";
    output.push(block.textContent ?? "", nl);
    break;
}
```

This walks `div[type=page]` / `p` / `s` and emits two `\n` before a new page,
one `\n` before a new paragraph, and one `\n` after every sentence's text —
i.e. **one line = one sentence**, single newlines are meaningful and not
collapsed. This matches decision 7 (see §4 below).

### File upload path (.txt / .readalong)

- Input element: `upload.component.html:49-57`, `accept="{{ textUploadAccepts }}"`
  where `textUploadAccepts = ".txt,.xml,.readalong"` (`upload.component.ts:81`).
- Handler `onTextFileSelected()` (`upload.component.ts:668-715`) does **not**
  read file contents at selection time — it just validates type/size and
  stores the raw `File` on the same `studioService.textControl$` used for
  typed text, clearing `$textInput`.
- Content is read later, in `nextStep()`, via
  `FileService.readFile$()` (`file.service.ts:54-70`, `FileReader.readAsText`).

### The align (text + audio) request

Built in `UploadComponent.nextStep()`, `upload.component.ts:484-626`:

- `input_type` is chosen by file extension
  (`upload.component.ts:505-520`): `"application/readalong+xml"` for
  `.xml`/`.readalong` uploads, else `"text/plain"`.
- Request body (`ReadAlongRequest`, `ras.service.ts:20-25`):
  ```ts
  export interface ReadAlongRequest {
    input?: string;
    type?: string;
    debug?: boolean;
    text_languages: Array<string>;
  }
  ```
  Sent as plain JSON via `HttpClient.post` (`RasService.assembleReadalong$`,
  `ras.service.ts:74-84`) to `POST {apiBaseURL}/assemble`
  (`environment.apiBaseURL`, an external Python backend, not in this repo).
  **No FormData/multipart anywhere in the app.**
- So the endpoint **already accepts either plain text or `read-along-1.2`
  XML** via `body.input` + `body.type` — this is the "existing request path"
  decision 2 refers to.
- Note: `/assemble` only runs g2p/tokenization and returns `processed_ras`
  (phonemicized XML) + a `lexicon`. The actual audio alignment happens
  **client-side** afterwards via WASM SoundSwallower
  (`soundswallower.service.ts`, invoked at `upload.component.ts:548`).

### g2p/build error handling

`reportRasError()`, `upload.component.ts:169-191`, invoked from the
`.subscribe({ error })` callback at `upload.component.ts:615-624`:

```ts
reportRasError(err: HttpErrorResponse) {
  if (err.status == 422) {
    if (err.error.detail.includes("is empty")) {
      this.toastr.error(...);
    }
    this.toastr.error(err.error.detail, $localize`Text processing failed.`, {...});
  } else {
    this.toastr.error(err.message, $localize`Hmm, we can't connect to the ReadAlongs API...`, {...});
  }
}
```

**`err.error.detail.includes("is empty")` — confirmed to keep the message,
fix the condition.** Human review: the toast text is right, but string-matching
a substring of the backend's human-readable error prose is brittle (silently
breaks if the backend rewords, capitalizes, or translates that message; would
also throw if `detail` is ever `undefined`). Now that the TipTap doc is the
source of truth, the client can check for this case **before** the request is
even sent, instead of pattern-matching the server's response after the fact:
treat "document has no non-whitespace sentence text" as a pre-flight
validation check (alongside the existing `validateTextControl()`-style checks
already run in `nextStep()`), and show the same "is empty" toast directly from
that client-side check. This makes the `err.error.detail.includes("is empty")`
branch in `reportRasError` dead code to remove in Prompt 1 — the remaining
`422` branch still falls back to showing `err.error.detail` verbatim for any
other 422 the backend returns (e.g. genuine g2p errors), which needs no string
matching at all.

**Confirmed gap, not a match**: only `err.error.detail` (a string) is read
today. Repo-wide grep for `g2p_error_words` and `partial_ras` returns zero
hits, and the `ReadAlong` response interface (`ras.service.ts:9-18`) has no
such fields. So decision 2's error shape
(`{ detail, g2p_error_words, partial_ras }`) is **new surface to add**, not
an existing contract to preserve — Prompt 3 will need to extend the error
handling to read `g2p_error_words`/`partial_ras` off the same 422 response,
alongside the existing `detail` toast.

### Language code

- UI: a `mat-select` in `upload.component.html:374-384`, bound to
  `studioService.langControl$` (a `FormControl<string>`), populated from
  `RasService.getLangs$()` (`GET {baseURL}/langs`).
- It reaches the backend as a **separate JSON field**, not an XML attribute:
  ```ts
  text_languages: [this.studioService.langControl$.value as string, "und"],
  ```
  (`upload.component.ts:523`). The client never writes `xml:lang` /
  `fallback-langs` itself — those attributes only appear in the XML
  **returned by** `/assemble` (confirmed in the mock,
  `packages/studio-web/src/mocks/index.ts:265`:
  `<text xml:lang="dan" fallback-langs="und" id="t0">...`), generated
  server-side from `text_languages`.

### Existing XML construction (closest precedent)

No client-side builder constructs a fresh `<read-along>` document from
scratch today. `DownloadService` (`shared/download/download.service.ts`)
manipulates the **already-aligned** `Document` returned after alignment
(e.g. building `<s>` translation elements at lines 105-116, `<graphic>`
elements at 138-151, using `new XMLSerializer()` at line 33) — useful as a
style precedent for DOM/string XML construction, but it is not a
tipTapDoc → XML serializer; no such serializer exists yet (grep for
`tiptap`/`tipTapDoc`/`readAlongXml` across the repo returns nothing).

## 3. Node schema

New module, `packages/studio-web/src/app/tiptap-text-editor/schema/nodes.ts`
(new `tiptap-text-editor` feature folder, confirmed by human review — the
existing `app/editor/` folder is the unrelated post-alignment
WaveSurfer/segments editor and must not be reused for this).

```
tipTapDoc → (paragraph | pagebreak)*
paragraph → sentence*
sentence  → text*        (leaf: holds plain text, no further nesting)
pagebreak → atomic block node, no content, selectable, no text
```

- Register only: `Document`, our `paragraph` node (content `sentence+`), our
  `sentence` node (content `text*`), `Text`, `History`, and `pagebreak`.
- **No** Bold/Italic/Link/Heading or any other mark extension (decision 4).
- `pagebreak` is atomic (`atom: true`), has `content: ""`, `group: "block"`,
  and is `selectable: true` so it can be clicked and deleted like a normal
  block, per Prompt 2's page-break UX requirement.

## 4. The three serializers

New module (naming to be finalized in Prompt 1, e.g.
`packages/studio-web/src/app/tiptap-text-editor/schema/serializers.ts`):

### `tipTapDoc → readAlongXml` (fixed contract)

Authoritative reference implementation, given verbatim in Prompt 1
(`.agent_history/prompts.md`):

```ts
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
```

Notably: no `id` attributes, no `<w>` tokens (the backend tokenizes and runs
g2p itself, same as for plain-text input today), and **no `xml:lang`**. See
§5 for what that means for language.

### `readAlongXml → tipTapDoc` (inverse)

Parse `<div type="page">` runs into `pagebreak`-delimited pages, `<p>` into
paragraphs, `<s>` into sentences. Take each `<s>` element's `.textContent`
directly as the sentence's text — this **automatically discards** any `<w>`
wrapper elements, their `ARPABET` attributes, and any `id` attributes on
`<div>`/`<p>`/`<s>`, since `.textContent` flattens child markup to the
concatenated text (word text nodes are already separated by literal spaces in
the source XML, e.g. `<w ...>hej</w> <w ...>verden</w>` → `"hej verden"`).
This round-trips with `docToReadAlongXml` above for documents that only use
the page/paragraph/sentence/text structure it produces.

### `plainText → tipTapDoc`

Non-blank lines become sentences, accumulating into a paragraph; each blank
line closes the current paragraph and becomes its own empty paragraph. See
§4a for the full rule and why it supersedes decision 7's original wording.

### 4a. Blank-line grouping in plainTextToDoc

Each blank line produces its own empty `paragraph` node — not a `sentence`,
and not a `pagebreak`. A run of N consecutive blank lines produces N empty
paragraphs, whose margins stack so the visible gap scales with blank-line
count, all on a **single page**. Page breaks are never inferred from
blank-line count; `pagebreak` nodes are only ever created by explicit user
action (the "Insert page break" toolbar command, Prompt 2). This supersedes
decision 7's original "2+ empty lines start a new page" wording.

**Why paragraphs, not sentences**: `@readalongs/web-component`'s
`Paragraph` renderer
(`read-along-component/read-along.tsx:1716-1721`) skips empty `<s>`
elements entirely:

```jsx
props.sentences.map(
  (sentence: Element) =>
    sentence.childNodes.length > 0 && (
      <this.Sentence sentenceData={sentence} />
    ),
)
```

so no number of empty sentences packed into one paragraph can ever produce
visible spacing. Empty _paragraphs_, by contrast, still get a
`.sentence__container` wrapper with real CSS margin
(`web-component/src/scss/modules/_pages.scss`) even with no sentence
content — that's what makes gap size scale with blank-line count.

This grouping lives in `plainTextToDoc` (the paste and file-upload
boundary). Live typing needs its own mechanism to turn Enter presses into
empty paragraphs — see the Prompt 2 checklist entry.

**Algorithm**: accumulate non-blank lines into a "current" paragraph; on a
blank line, flush the current paragraph (if it has content) and push a
separate empty paragraph for the blank line itself; flush any remaining
paragraph at the end.

This does not touch the `tipTapDoc → readAlongXml` contract
(`docToReadAlongXml`, §4) — only the plain-text grouping rule changed.

## 5. How language attaches

`docToReadAlongXml(doc, lang = "und")` embeds the language directly on the
`<text>` element — `xml:lang="${lang}" fallback-langs="und"` — in addition
to the existing `text_languages: [code, "und"]` request field, which is
unchanged. Per human decision: this is what tells the backend's g2p engine
which language to use for tokenization; the Prompt 1 reference serializer
omitted it, but this diverges from that reference by design. Both
`nextStep()` and `downloadText()` call
`docToReadAlongXml(doc, studioService.langControl$.value ?? undefined)`.

Separately: `body.type` is always `"application/readalong+xml"` in
`nextStep()` now that the doc is always the source of truth — the old
file-extension-sniffing branch (`.xml`/`.readalong` upload →
`"application/readalong+xml"`, else `"text/plain"`) was removed as dead
code.

## 6. Highlighting approach

- Implemented as ProseMirror **decorations** (`DecorationSet` in a small
  TipTap `Extension`'s plugin state) — **never** marks. Decorations live only
  in `EditorView` render state; they are not part of the document, don't
  enter `history`, and are invisible to both serializers (`docToReadAlongXml`
  only walks `doc.forEach`/node content, never plugin state).
- **Locating failing tokens**: on a 422 with `g2p_error_words`/`partial_ras`,
  parse `partial_ras` (a `read-along-1.2` XML string) and find `<w>` elements
  with an **empty `ARPABET` attribute** — these are exactly the tokens g2p
  couldn't process. Take their **ordinal position** in the document's overall
  word sequence (not string/text matching, so that a second, successfully
  processed occurrence of the same word elsewhere is not also highlighted).
  Independently tokenize the live editor doc into the same word sequence
  (whitespace-split within each `sentence` node, in document order) and map
  ordinal index → character range in that word's sentence node.
- **Lifecycle**: decorations are mapped forward through every transaction
  (`DecorationSet.map`) so they track their token through edits elsewhere in
  the doc. Each decoration stores its original covered text; on every
  transaction that touches its range, compare current text to the stored
  original and drop the decoration if they differ (typing into the flagged
  token clears its own highlight, but edits elsewhere leave it in place).
  Re-running align rebuilds the whole set from scratch via a command/meta
  transaction.
- **Style**: a CSS class applying `text-decoration: underline red` (or
  equivalent) plus a background highlight, no tooltip/count/navigation
  (decision 5).

## 7. Testing plan (minimal, per decision 8)

Two specs, one per highest-value contract, colocated next to source
(`*.spec.ts`, Karma/Jasmine, matching existing convention):

1. **`tipTapDoc ↔ readAlongXml` round-trip** — build a small `PMNode` doc
   (2 pages, 2 paragraphs, a few sentences) using the real schema, run
   `docToReadAlongXml`, parse the result back with `readAlongXmlToDoc`,
   assert the reconstructed doc's page/paragraph/sentence text structure
   equals the original. Keep to one representative doc, not a matrix of
   edge cases.
2. **`plainText → tipTapDoc` transform** — one input string exercising a
   run of blank lines of varying length, asserting the resulting doc's
   paragraph/sentence structure matches §4a's rule (one empty paragraph per
   blank line, never a page break).

Prompt 2 added a few more, one per distinct behavior fixed along the way
(page-break cursor continuity, paste normalization, empty-paragraph
collapsing, live-typing paragraph breaks — see its checklist entry for
specifics). Prompt 3 gets one for highlight decoration placement +
clearing-on-edit, per `.agent_history/prompts.md`.

Explicitly **not** doing: exhaustive edge-case matrices, snapshot tests of
generated HTML/CSS, or component-level TestBed specs beyond a smoke test for
the new editor component (matching the existing `upload.component.spec.ts`
style — one `it("should create", ...)`).

## 8. Decisions confirmed by human review

All five items previously raised here have been resolved. Recorded for
traceability; each is now reflected inline in the section noted:

1. **Decision 7 reconciliation** — superseded by §4a's later revision: each
   blank line gets its own empty paragraph (not "2+ blank lines start a new
   page"); page breaks are explicit-only.
2. **`body.type` always `"application/readalong+xml"`** (§5) — confirmed.
   The file-extension sniffing branch in `nextStep()` is removed; every
   input funnels through `docToReadAlongXml`.
3. **New feature folder location** (§3, §4) — confirmed:
   `packages/studio-web/src/app/tiptap-text-editor/`.
4. **`ControlValueAccessor`** (§2) — confirmed. The new editor implements
   `ControlValueAccessor` and plugs into `uploadFormGroup` in place of the
   old hand-rolled `BehaviorSubject` binding.
5. **`err.error.detail.includes("is empty")` special case** (§2) — the
   toast message is right, but the substring match is brittle. On closer
   inspection this condition is about the backend's g2p output being empty
   (e.g. all-numeric input), not about the textbox being blank, so it can't
   be checked client-side without running g2p — deferred to Prompt 3's
   g2p-error-shape work rather than fixed here.

## 9. Ordered checklist (mirrors Prompts 1–4)

- [x] **Prompt 1** — Node schema (`tiptap-text-editor/schema/nodes.ts`),
      TipTap editor component (implementing `ControlValueAccessor`) replacing
      the textarea in `upload.component.html`, three serializers, wire
      `.txt`/`.readalong` uploads and the align request through them
      (`body.type` always `"application/readalong+xml"`, drop the
      file-extension sniffing branch). Two specs (round-trip, plainText
      transform). `err.error.detail.includes("is empty")` was left
      untouched — see §8 item 5. Also fixed post-Prompt-1: a CSS bug where
      the editable surface didn't fill its wrapper's `min-height` (clicks
      below short content did nothing), and the decision-7 revision in §4a.
- [x] **Prompt 2**

      **Page break.** `pagebreak` gets a NodeView (clickable/deletable
      divider; DOM built via `addNodeView()`, since there's no
      framework-specific NodeView renderer for `@tiptap/core` outside
      React/Vue) and an `insertPageBreak` command, exposed as an i18n'd
      "Insert page break" button inside the editor's own toolbar
      (`tiptap-text-editor.component.html`). Since `pagebreak` is atomic,
      there's nowhere to place a cursor immediately after one with nothing
      else following it — `continueAfterPageBreakSelection(editor)`
      (`schema/nodes.ts`) checks whether the selection is a `NodeSelection`
      on a pagebreak and, if so, inserts a trailing paragraph and moves the
      cursor in. It's called both from `insertPageBreak()` (the component
      method, right after inserting) and from the `pagebreak` node's own
      `addKeyboardShortcuts` Enter handler (pressing Enter on an
      already-selected trailing pagebreak). Two specs cover this.

      **Paste normalization.** `editorProps.handlePaste` strips incoming
      content to plain text and rebuilds it via `plainTextToDoc`, so no
      formatting survives a paste. Pasting into a genuinely empty editor
      replaces the whole doc (`editor.isEmpty` → `setContent`) rather than
      inserting alongside the placeholder empty paragraph. One spec covers
      normalization of a multi-blank-line paste.

      **Blank-line spacing.** `docToReadAlongXml` collapses runs of R
      consecutive empty paragraphs to `floor(R/2)` spacer elements: a lone
      empty paragraph contributes nothing, a run of 2-3 contributes one
      spacer, larger runs scale from there. This applies uniformly
      regardless of whether the empty paragraphs came from typing, pasting,
      or editing artifacts (e.g. an unfilled `insertPageBreak` placeholder);
      `plainTextToDoc` itself is unchanged, one empty paragraph per blank
      line — collapsing happens only at serialization. Live typing needed
      its own mechanism to *create* those empty paragraphs, since Enter by
      default only splits into a new sentence: `Sentence`'s
      `addKeyboardShortcuts` (Enter) now treats pressing Enter on an
      already-empty sentence as confirming that line as blank, promoting it
      into its own paragraph, then opening a fresh paragraph for whatever
      comes next — mirroring `plainTextToDoc`'s per-blank-line paragraph,
      one keystroke at a time. One spec each cover the collapsing
      (`serializers.spec.ts`) and the live-typing paragraph break
      (`tiptap-text-editor.component.spec.ts`).

      **Also this pass** (human decisions, not part of the original
      prompts): removed the "Format" help dialog (`text-format-dialog/`),
      superseded by the page-break button; `downloadText()` exports
      `.readalong` XML instead of plain text, since plain text can't
      represent an explicit page break; `docToReadAlongXml` takes a `lang`
      parameter and embeds `xml:lang`/`fallback-langs` on `<text>` (§5).

      **Open, not yet resolved**: two adjacent non-empty paragraphs that
      end up directly touching after a run collapses to zero don't merge
      into one (e.g. two separate one-sentence paragraphs, not one
      two-sentence paragraph); holding the Up arrow with a leading
      pagebreak (nothing before it) flickers the selection instead of
      settling.

- [ ] **Prompt 3** — Token-precise highlight decorations driven by
      `g2p_error_words`/`partial_ras` on 422, extending `reportRasError`.
      One spec (decoration placement + clears on edit, with a repeated-token
      case).
- [ ] **Prompt 4** — Review pass: i18n coverage, round-trip stability for a
      multi-page/multi-sentence doc, decorations never leak into XML/undo,
      no stray dependencies or inline marks, build/test/lint clean, diff
      legibility pass, update this checklist.
