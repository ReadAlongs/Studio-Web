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

import { emptyDoc, schemaExtensions } from "./schema/nodes";

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
      },
      onUpdate: ({ editor }) => this.onChange(editor.state.doc),
      onBlur: () => this.onTouched(),
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
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
