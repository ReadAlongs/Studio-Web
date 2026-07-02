import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from "@angular/core";

import { BlankLineRunKind, findBlankLineRuns } from "./blank-line-runs";
import { TextareaOverlayService } from "./textarea-overlay.service";

interface OverlayLine {
  text: string;
  tint: BlankLineRunKind | null;
}

/**
 * Renders a non-interactive decoration layer positioned exactly behind a
 * `<textarea>`, mirroring its text so that per-line styling (background
 * tints for now; gutter markers, error underlines and a bubble menu in
 * later iterations) can be drawn without ever touching the textarea's
 * value, which remains the single source of truth.
 *
 * Usage: place as a sibling immediately before the target `<textarea>`
 * inside a `position: relative` host, and bind `text` to the textarea's
 * current value and `textareaEl` to a template reference for the
 * textarea's native element.
 */
@Component({
  selector: "app-textarea-overlay",
  templateUrl: "./textarea-overlay.component.html",
  styleUrl: "./textarea-overlay.component.sass",
  standalone: false,
})
export class TextareaOverlayComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  private _text: string | null = "";

  // An input setter (rather than ngOnChanges) so `lines` is always
  // recomputed synchronously at assignment time — whether `text` arrives
  // via a real template binding or is set directly, and always before
  // this component's own view is next checked. Recomputing it later (e.g.
  // in ngAfterViewInit, after the view already rendered with the old
  // value) would trigger ExpressionChangedAfterItHasBeenCheckedError.
  @Input()
  set text(value: string | null) {
    this._text = value;
    this.renderLines();
  }
  get text(): string | null {
    return this._text;
  }

  @Input() textareaEl: HTMLTextAreaElement | null = null;

  @ViewChild("mirror", { static: true })
  private mirrorRef!: ElementRef<HTMLDivElement>;

  protected lines: OverlayLine[] = [];

  private attachedTextarea: HTMLTextAreaElement | null = null;
  private stopObservingResize: (() => void) | null = null;
  private readonly handleTextareaActivity = () => this.applyMirrorStyles();
  private readonly handleWindowResize = () => this.applyMirrorStyles();

  constructor(private readonly overlayService: TextareaOverlayService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["textareaEl"]) {
      this.attachToTextarea();
    }
  }

  ngAfterViewInit(): void {
    // Redundant with ngOnChanges for real template bindings, but needed
    // when textareaEl was set directly (no binding, so ngOnChanges never
    // fired). Doesn't touch template-bound state, so — unlike `text` —
    // it's safe to do here.
    this.attachToTextarea();
  }

  ngOnDestroy(): void {
    this.detachFromTextarea();
  }

  private renderLines(): void {
    const text = this.text ?? "";
    const lines = text.split("\n");
    const tintByLine = new Map<number, BlankLineRunKind>();
    for (const run of findBlankLineRuns(text)) {
      for (let i = run.startLine; i <= run.endLine; i++) {
        tintByLine.set(i, run.kind);
      }
    }
    this.lines = lines.map((line, index) => ({
      text: line,
      tint: tintByLine.get(index) ?? null,
    }));
  }

  private attachToTextarea(): void {
    if (this.attachedTextarea === this.textareaEl) {
      return;
    }
    this.detachFromTextarea();

    this.attachedTextarea = this.textareaEl;
    if (!this.attachedTextarea) {
      return;
    }

    this.attachedTextarea.addEventListener(
      "scroll",
      this.handleTextareaActivity,
    );
    this.attachedTextarea.addEventListener(
      "input",
      this.handleTextareaActivity,
    );
    window.addEventListener("resize", this.handleWindowResize);
    this.stopObservingResize = this.overlayService.observeResize(
      this.attachedTextarea,
      this.handleTextareaActivity,
    );

    this.applyMirrorStyles();
  }

  private detachFromTextarea(): void {
    this.attachedTextarea?.removeEventListener(
      "scroll",
      this.handleTextareaActivity,
    );
    this.attachedTextarea?.removeEventListener(
      "input",
      this.handleTextareaActivity,
    );
    window.removeEventListener("resize", this.handleWindowResize);
    this.stopObservingResize?.();
    this.stopObservingResize = null;
    this.attachedTextarea = null;
  }

  private applyMirrorStyles(): void {
    if (!this.attachedTextarea) {
      return;
    }
    const mirror = this.mirrorRef.nativeElement;
    this.overlayService.applyMirrorStyles(this.attachedTextarea, mirror);
    this.overlayService.syncScroll(this.attachedTextarea, mirror);
  }
}
