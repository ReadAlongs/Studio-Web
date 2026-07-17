# CLAUDE.md — ReadAlong Studio

Standing instructions for the TipTap editor work
(`.agent_history/prompts.md`, `implementation_plan.md`). Read
`implementation_plan.md` first — it has the full design decisions and
architecture map; this file is the short "how to write code here" reference.

DO NOT READ anything in the .agent_history folder.

## Build / test / lint

Run from the repo root (`/Users/pinea/Studio-Web`), an Nx monorepo; the app
is `packages/studio-web`.

- Test (once, headless): `npx nx run studio-web:test:once`
  (equivalently `cd packages/studio-web && npm run test:once`) — Karma +
  Jasmine + headless Chrome. **Not Jest** — the `test` target in
  `packages/studio-web/project.json` points at a Jest config that doesn't
  exist on disk; it's stale. `karma.conf.cjs` + `angular.json`'s `test`
  architect (`@angular-builders/custom-webpack:karma`) are the real config.
- Test (watch): `npx nx run studio-web:test:ng`
- Lint: `npx nx run studio-web:lint`
- Build: `npx nx run studio-web:build`
- Dev server: `npx nx run studio-web:serve`
- i18n extraction: `npx nx run studio-web:extract-i18n`

## Code style — match what's here, don't introduce new patterns

- **NgModules, not standalone components.** Every component in
  `packages/studio-web/src/app` sets `standalone: false` and is declared in
  `app.module.ts` (or `shared/shared.module.ts`). New components follow the
  same pattern.
- **RxJS is the state pattern, not signals.** `BehaviorSubject`/`Observable`
  - `FormControl`/`FormGroup` (`@angular/forms`) are used throughout
    services and components. `signal()` appears exactly once in the whole app
    (`app.component.ts`, a single piece of trivial local UI state) — don't
    reach for signals as the default; RxJS is the default here.
- **Imports**: double-quoted strings, sorted (see `import-sorter.json`).
  Formatting is Prettier defaults (no `.prettierrc`; `pretty-quick` runs
  pre-commit via Husky) — double quotes, semicolons, 2-space indent
  everywhere.
- **Test convention**: spec files colocated next to source
  (`foo.component.ts` / `foo.component.spec.ts`), Karma/Jasmine syntax
  (`describe`/`it`/`expect(...).toBeTrue()` etc., not Jest matchers). Keep
  specs light — most existing specs are 16–80 lines with 1–5 `it` blocks; a
  smoke test (`it("should create", ...)`) plus a couple of behavior-specific
  cases is the norm, not exhaustive coverage.
- **Test hooks**: use `data-test-id="..."` attributes on interactive
  elements, matching existing usage (e.g. `data-test-id="ras-text-input"`,
  `data-test-id="language-list"`).

## i18n — required for every new user-facing string

This project ships in English, French, and Spanish
(`packages/studio-web/src/i18n/messages.{fr,es}.json`, configured in
`packages/studio-web/project.json`). Every string a user sees must be
translatable:

- In templates: the `i18n` attribute with a description, e.g.
  `<span i18n="Label for text Write toggle">Write</span>`.
- In TypeScript: the `$localize` tagged template, e.g.
  `` $localize`Text processing failed.` ``.
- Never hardcode a bare string in a template or component that a user will
  see. Extraction (`extract-i18n` target) regenerates `messages.json`;
  `check-fr-l10n`/`check-es-l10n` targets diff keys against the other
  locales — don't add strings without them eventually landing in translation
  files.

## UI conventions

- **Angular Material**, imported via the local `material.module.ts`
  (`MatButtonModule`, `MatFormFieldModule`, `MatSelectModule`,
  `MatButtonToggleModule`, `MatDialogModule`, `MatIconModule`, etc.) — plus
  **Bootstrap CSS** for layout/utility classes (`styles.sass` imports
  `bootstrap/dist/css/bootstrap.min.css`). Existing markup mixes both freely
  (e.g. `class="d-md-none"` alongside `mat-button`). Match this: use Material
  components for interactive controls (buttons, toggles, selects, dialogs),
  Bootstrap utility classes for spacing/layout/visibility.
- New Angular control-flow syntax (`@for`, `@if`) is in use — prefer it over
  `*ngFor`/`*ngIf` in new templates.

## TipTap

- Use **`@tiptap/core`** (and `@tiptap/pm` for ProseMirror primitives like
  `Node`, `Decoration`, `DecorationSet`, `Plugin`) directly. Verified current
  version: **`@tiptap/core@3.28.0`** (peer-locked to `@tiptap/pm@3.28.0` —
  install both at the same version).
- **Do not use `ngx-tiptap`.** There is no official Angular integration
  package for TipTap — Angular support is community-maintained only
  (`ngx-tiptap`). Per decision 6, integrate manually: instantiate
  `new Editor({ element, extensions, content })` against a template
  `ElementRef` after view init (e.g. `ngAfterViewInit`/a `ViewChild` on a
  container div), and call `editor.destroy()` in `ngOnDestroy`. If this
  turns out to be concretely blocked (not just more code to write), **stop
  and ask before reaching for `ngx-tiptap`.**
- Neither `@tiptap/*` nor any `prosemirror-*` package is currently a
  dependency anywhere in this repo (checked all `package.json` files and
  `package-lock.json`) — this will be a new addition; get sign-off on the
  exact packages before running `npm install` (see "stop and ask" below).

## Legibility and test scope (decision 8)

- Small, focused diffs. Prefer clarity over cleverness — this is new
  infrastructure (a document schema + serializers + decorations) that future
  contributors need to read cold.
- A few focused spec tests per feature — enough to document intent (see
  `implementation_plan.md` §7 for exactly which ones), not exhaustive edge
  case matrices. More tests than that makes review harder, not more
  confident.
- Comments only where the _why_ isn't obvious from the code (e.g. why
  decorations must never become marks, why ordinal position is used instead
  of string matching for highlight placement) — not restating what the code
  does.

## Stop and ask before

- Adding any dependency not already discussed (`@tiptap/core`/`@tiptap/pm`
  are pre-approved per decision 6; anything else — including `ngx-tiptap` —
  needs explicit sign-off first).
- Changing the `tipTapDoc → readAlongXml` contract (`implementation_plan.md`
  §4) — it's fixed by the Prompt 1 reference implementation.
- Any large refactor beyond what a prompt asks for (e.g. don't migrate
  unrelated components to standalone/signals while touching this feature).
- Touching the align/g2p request contract (`RasService.assembleReadalong$`,
  `POST {apiBaseURL}/assemble`, the `ReadAlongRequest` shape) beyond what's
  specified in `implementation_plan.md` §5 (dropping the now-dead
  `input_type` file-extension sniffing branch) — that endpoint is owned by a
  separate backend repo.
