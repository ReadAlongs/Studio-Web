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
import { TextRange } from "./document-words";
import { TextareaOverlayService } from "./textarea-overlay.service";

interface OverlaySpan {
  text: string;
  error: boolean;
}

interface OverlayLine {
  spans: OverlaySpan[];
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

  private _errorRanges: readonly TextRange[] = [];

  // Same rationale as the `text` setter above: recompute synchronously at
  // assignment time so both inputs are always reflected together in the
  // next render, whichever one changed.
  @Input()
  set errorRanges(value: readonly TextRange[] | null) {
    this._errorRanges = value ?? [];
    this.renderLines();
  }
  get errorRanges(): readonly TextRange[] {
    return this._errorRanges;
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

    let lineStart = 0;
    this.lines = lines.map((line, index) => {
      const overlayLine: OverlayLine = {
        spans: this.buildLineSpans(line, lineStart),
        tint: tintByLine.get(index) ?? null,
      };
      lineStart += line.length + 1; // +1 for the "\n" this line was split on
      return overlayLine;
    });
  }

  /**
   * Splits `lineText` (which starts at absolute offset `lineStart` in the
   * full document) into spans at any `errorRanges` boundaries that fall
   * within it, so those substrings can be rendered with an error
   * decoration while the rest of the line renders normally. A word never
   * spans a newline, so a given error range only ever intersects one line.
   */
  private buildLineSpans(lineText: string, lineStart: number): OverlaySpan[] {
    const lineEnd = lineStart + lineText.length;
    const errorsInLine = this._errorRanges
      .map((range) => ({
        start: Math.max(range.start, lineStart) - lineStart,
        end: Math.min(range.end, lineEnd) - lineStart,
      }))
      .filter((range) => range.start < range.end)
      .sort((a, b) => a.start - b.start);

    if (errorsInLine.length === 0) {
      return [{ text: lineText, error: false }];
    }

    const spans: OverlaySpan[] = [];
    let cursor = 0;
    for (const range of errorsInLine) {
      if (range.start > cursor) {
        spans.push({ text: lineText.slice(cursor, range.start), error: false });
      }
      spans.push({ text: lineText.slice(range.start, range.end), error: true });
      cursor = range.end;
    }
    if (cursor < lineText.length) {
      spans.push({ text: lineText.slice(cursor), error: false });
    }
    return spans;
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
