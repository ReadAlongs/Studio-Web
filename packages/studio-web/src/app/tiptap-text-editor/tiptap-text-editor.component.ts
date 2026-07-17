import { Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { Placeholder } from "@tiptap/extensions/placeholder";

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  forwardRef,
  inject,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

import {
  continueAfterPageBreakSelection,
  emptyDoc,
  schemaExtensions,
} from "./schema/nodes";
import { plainTextToDoc } from "./schema/serializers";

@Component({
  selector: "app-tiptap-text-editor",
  templateUrl: "./tiptap-text-editor.component.html",
  styleUrls: ["./tiptap-text-editor.component.sass"],
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TiptapTextEditorComponent),
      multi: true,
    },
  ],
})
export class TiptapTextEditorComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @ViewChild("editorContainer")
  private editorContainer!: ElementRef<HTMLElement>;
  @Input() placeholder = "";
  // Aliased so callers keep writing the usual `data-test-id="..."` attribute;
  // forwarded onto the actual editable element below, since Playwright's
  // getByTestId(...).fill() needs a real input/textarea/contenteditable, not
  // this component's host tag.
  @Input("data-test-id") testId = "";

  private hostElement = inject(ElementRef);
  protected editor?: Editor;

  private pendingContent: PMNode | null = null;
  private onChange: (doc: PMNode) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    // Angular keeps the plain `data-test-id="..."` attribute on the host
    // tag in addition to reading it into the `testId` Input above; remove
    // it so only the real editable node below carries the test id (Angular
    // getByTestId(...) would otherwise match both and throw a strict-mode
    // "resolved to 2 elements" error).
    this.hostElement.nativeElement.removeAttribute("data-test-id");

    this.editor = new Editor({
      element: this.editorContainer.nativeElement,
      extensions: [
        ...schemaExtensions,
        // `sentence`, not `paragraph`, is the textblock in this schema, so
        // the default placeholder traversal (which doesn't descend into
        // non-textblock parents) would never reach it without this.
        Placeholder.configure({
          placeholder: this.placeholder,
          includeChildren: true,
        }),
      ],
      content: (this.pendingContent ?? emptyDoc()).toJSON(),
      // TipTap mounts its own contenteditable node as a child of `element`
      // above, so the test id has to be attached here to land on the actual
      // editable DOM node (what Playwright's getByTestId(...).fill() needs),
      // not on our static container div.
      editorProps: {
        attributes: { "data-test-id": this.testId },
        // Paste normalization (implementation_plan.md §4a / Prompt 2):
        // always strip incoming content to plain text and rebuild it via
        // plainTextToDoc, rather than letting the schema's parseHTML rules
        // interpret whatever HTML the clipboard offers — that's the only
        // way to guarantee no bold/italic/link survives a paste, since the
        // schema has no marks to begin with but pasted markup could still
        // carry structure parseHTML would otherwise honor.
        handlePaste: (_view, event) => {
          const text = event.clipboardData?.getData("text/plain");
          if (!text) {
            return false;
          }
          event.preventDefault();
          const content = plainTextToDoc(text).toJSON().content ?? [];
          // A blank editor's cursor sits inside the placeholder empty
          // sentence, a collapsed position; inserting block-level content
          // there breaks out of it rather than consuming it, leaving that
          // empty paragraph as a stray leading block. Replace the whole doc
          // in that case instead of inserting at the cursor.
          if (this.editor!.isEmpty) {
            this.editor!.commands.setContent(content);
          } else {
            this.editor!.commands.insertContent(content);
          }
          return true;
        },
      },
      onUpdate: ({ editor }) => this.onChange(editor.state.doc),
      onBlur: () => this.onTouched(),
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  insertPageBreak(): void {
    const editor = this.editor;
    if (!editor) {
      return;
    }
    editor.chain().focus().insertPageBreak().run();
    // If nothing followed the just-inserted pagebreak (e.g. it landed at
    // the end of the doc), the selection is now a NodeSelection on it —
    // same situation as Enter on an already-selected pagebreak, so this
    // reuses that fix (schema/nodes.ts) to add somewhere to keep typing.
    continueAfterPageBreakSelection(editor);
  }

  writeValue(doc: PMNode | null): void {
    this.pendingContent = doc;
    this.editor?.commands.setContent((doc ?? emptyDoc()).toJSON(), {
      emitUpdate: false,
    });
  }

  registerOnChange(fn: (doc: PMNode) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.editor?.setEditable(!isDisabled);
  }
}
