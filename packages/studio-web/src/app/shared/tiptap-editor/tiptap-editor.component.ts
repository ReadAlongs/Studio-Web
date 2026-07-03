import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { Editor, getSchema } from "@tiptap/core";
import { History } from "@tiptap/extension-history";
import { Node as PMNode, Schema } from "@tiptap/pm/model";

import {
  ErrorHighlightExtension,
  ErrorRange,
} from "./g2p/error-highlight-extension";
import { PopoverPosition } from "./popover/error-popover.component";
import { ReadAlongKeymap } from "./schema/keymap-extension";
import { readAlongExtensions } from "./schema/nodes";
import { ReadAlongPasteHandler } from "./schema/paste-extension";
import { docToReadAlongXml } from "./serialization/doc-to-xml";
import { textToDoc } from "./serialization/text-to-doc";
import { xmlToDoc } from "./serialization/xml-to-doc";

export type { ErrorRange } from "./g2p/error-highlight-extension";

const ERROR_WORD_CLASS = "readalong-error-word";

const schema: Schema = getSchema(readAlongExtensions);

/**
 * A rich-text editor for authoring ReadAlong input, replacing the old
 * `<textarea>` + blank-line convention: page breaks are a real, visible
 * node in the document (see schema/nodes.ts) rather than an invisible run
 * of blank lines, so pagination is always on-screen instead of needing a
 * separate overlay/gutter to reveal it. `xmlChange` emits the document
 * serialized straight to read-along input XML, for submission with
 * `type: "application/readalong+xml"` instead of `text/plain`.
 */
@Component({
  selector: "ras-shared-tiptap-editor",
  templateUrl: "./tiptap-editor.component.html",
  styleUrl: "./tiptap-editor.component.sass",
  standalone: false,
  // ProseMirror renders the paragraph/sentence/pagebreak/decoration nodes
  // inside .tiptap-editor__content imperatively, outside Angular's own
  // template compiler, so those elements never receive the `_ngcontent-*`
  // attribute Angular's default emulated encapsulation scopes selectors
  // to — every rule in tiptap-editor.component.sass targeting that
  // content (pagebreak styling, error underlines, etc.) would otherwise
  // silently never match.
  encapsulation: ViewEncapsulation.None,
})
export class TiptapEditorComponent implements AfterViewInit, OnDestroy {
  /**
   * The document's initial content, in the ReadAlong plain-text
   * blank-line convention. Only consulted once, when the editor is first
   * created — like a native `<textarea>`'s `defaultValue`, further
   * changes to this input are not observed. Call `loadText`/`loadXml`
   * explicitly to replace the content afterward (e.g. switching to a
   * different uploaded file); reacting to every `initialText` change
   * instead would fight the user's own edits on each keystroke.
   */
  @Input() initialText: string | null = null;

  /** Emits the current doc, serialized to read-along input XML, on every edit. */
  @Output() readonly xmlChange = new EventEmitter<string>();

  /** Emits the current doc on every edit, for callers that need ProseMirror positions (e.g. g2p error mapping). */
  @Output() readonly docChange = new EventEmitter<PMNode>();

  @ViewChild("editorRoot", { static: true })
  private editorRootRef!: ElementRef<HTMLDivElement>;

  @ViewChild("editorContainer", { static: true })
  private editorContainerRef!: ElementRef<HTMLDivElement>;

  protected editor: Editor | null = null;
  protected errorPopoverPosition: PopoverPosition | null = null;
  protected errorPopoverMessage = "";

  constructor(
    private readonly hostRef: ElementRef<HTMLElement>,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    const initialDoc = this.initialText
      ? textToDoc(schema, this.initialText)
      : schema.nodes["doc"].createAndFill();

    // ProseMirror manages its own DOM and fires far more native events
    // (every keystroke, selection change, etc.) than Angular's bindings
    // care about; constructing it outside the zone avoids a full change
    // detection pass for each one. `onUpdate` re-enters the zone
    // explicitly (via `emitChange`/`ngZone.run`) at the one point where
    // Angular-bound state actually needs to update, which also keeps
    // that update on Angular's normal, single change-detection pass
    // instead of racing a stray zone task against a caller's own
    // `detectChanges()`.
    this.ngZone.runOutsideAngular(() => {
      this.editor = new Editor({
        element: this.editorRootRef.nativeElement,
        extensions: [
          ...readAlongExtensions,
          ReadAlongKeymap,
          ReadAlongPasteHandler,
          History,
          ErrorHighlightExtension,
        ],
        content: initialDoc?.toJSON(),
        onUpdate: () => this.ngZone.run(() => this.emitChange()),
        // Content can be in any language, so the browser's native
        // (English-dictionary-based) spellchecker would misflag
        // legitimate words — same as the old <textarea>'s
        // spellcheck="false".
        editorProps: {
          attributes: {
            spellcheck: "false",
            autocapitalize: "off",
            autocorrect: "off",
          },
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  /** Inserts a page break at the cursor. See schema/insert-page-break-command.ts. */
  insertPageBreak(): void {
    this.editor?.chain().focus().insertPageBreak().run();
  }

  /**
   * Replaces the document with `text` parsed as the plain-text blank-line
   * convention. `setContent` triggers `onUpdate` on its own, so this
   * doesn't need to call `emitXml` itself.
   */
  loadText(text: string): void {
    this.editor?.commands.setContent(textToDoc(schema, text).toJSON());
  }

  /** Replaces the document with `xml` parsed as read-along input XML. */
  loadXml(xml: string): void {
    this.editor?.commands.setContent(xmlToDoc(schema, xml).toJSON());
  }

  /**
   * Underlines the given ranges (ProseMirror positions in the *current*
   * doc — see g2p/error-highlight-extension.ts) as g2p errors, replacing
   * any previously flagged ranges. Pass an empty array to clear.
   */
  setErrorRanges(ranges: ErrorRange[]): void {
    this.editor?.commands.setErrorRanges(ranges);
  }

  /**
   * Shows the error popover next to a clicked flagged word, or hides it if
   * the click landed anywhere else in the editor content.
   */
  protected onContentClick(event: MouseEvent): void {
    const errorWordEl = (event.target as HTMLElement).closest<HTMLElement>(
      `.${ERROR_WORD_CLASS}`,
    );
    if (!errorWordEl) {
      this.hideErrorPopover();
      return;
    }

    const containerRect =
      this.editorContainerRef.nativeElement.getBoundingClientRect();
    const wordRect = errorWordEl.getBoundingClientRect();
    this.errorPopoverPosition = {
      top: wordRect.top - containerRect.top,
      left: wordRect.left - containerRect.left + wordRect.width / 2,
    };
    this.errorPopoverMessage = $localize`This word may not have been pronounceable — check its spelling.`;
    this.cdr.detectChanges();
  }

  @HostListener("document:click", ["$event"])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.hostRef.nativeElement.contains(event.target as Node)) {
      this.hideErrorPopover();
    }
  }

  private hideErrorPopover(): void {
    if (this.errorPopoverPosition === null) {
      return;
    }
    this.errorPopoverPosition = null;
    // Editor mutations reach us via ProseMirror's own dispatch pipeline,
    // not an Angular input/event binding, so Angular's change-detection
    // bookkeeping for this view has no reason to expect this field to
    // have moved — without an explicit, synchronous refresh right here,
    // a later `detectChanges()` call (e.g. in a test, or a subsequent
    // unrelated event elsewhere in the app) can find this binding already
    // stale relative to Angular's last-recorded value and throw NG0100.
    this.cdr.detectChanges();
  }

  private emitChange(): void {
    // Positions may have shifted or the flagged word may be gone entirely
    // by the time any edit lands; rather than track it, just close the
    // popover and let a fresh click reopen it against the current doc.
    this.hideErrorPopover();
    if (this.editor) {
      this.xmlChange.emit(docToReadAlongXml(this.editor.state.doc));
      this.docChange.emit(this.editor.state.doc);
    }
  }
}
