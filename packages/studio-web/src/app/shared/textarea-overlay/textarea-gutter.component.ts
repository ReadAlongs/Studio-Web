import {
  AfterViewInit,
  ChangeDetectorRef,
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

interface GutterRow {
  heightPx: number;
  marker: BlankLineRunKind | null;
}

/**
 * Renders a narrow, non-interactive marker column beside (not behind) a
 * `<textarea>`: a pilcrow for a single blank line (paragraph break), and a
 * page icon spanning the combined height of a page-break run. Reuses the
 * same blank-line-run detection and CSS-parity plumbing as
 * TextareaOverlayComponent.
 *
 * Unlike the overlay, this column doesn't render the textarea's actual
 * text, so it can't get wrapped-line alignment "for free" the way the
 * overlay does. A hidden, full-width mirror (`measurer`) is used purely to
 * measure each line's real rendered height (accounting for word-wrap),
 * which then sizes this column's rows.
 *
 * Usage: same contract as TextareaOverlayComponent — place as a sibling of
 * the target `<textarea>` and bind `text`/`textareaEl`.
 */
@Component({
  selector: "app-textarea-gutter",
  templateUrl: "./textarea-gutter.component.html",
  styleUrl: "./textarea-gutter.component.sass",
  standalone: false,
})
export class TextareaGutterComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() text: string | null = "";
  @Input() textareaEl: HTMLTextAreaElement | null = null;

  @ViewChild("gutter", { static: true })
  private gutterRef!: ElementRef<HTMLDivElement>;
  @ViewChild("measurer", { static: true })
  private measurerRef!: ElementRef<HTMLDivElement>;

  protected rows: GutterRow[] = [];

  private attachedTextarea: HTMLTextAreaElement | null = null;
  private stopObservingResize: (() => void) | null = null;
  private readonly handleScroll = () => this.syncScroll();
  private readonly handleResizingActivity = () => this.refresh();

  constructor(
    private readonly overlayService: TextareaOverlayService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Attach first: updateRows() below needs `attachedTextarea` to measure
    // against, regardless of which order these two inputs are bound in.
    if (changes["textareaEl"]) {
      this.attachToTextarea();
    }
    if (changes["text"]) {
      // A no-op until the view (and its measurer) exists; ngAfterViewInit
      // covers the initial computation once it does.
      this.updateRows();
    }
  }

  ngAfterViewInit(): void {
    this.attachToTextarea();
    this.refresh();
  }

  ngOnDestroy(): void {
    this.detachFromTextarea();
  }

  /** Re-syncs vertical alignment/scroll and re-measures row heights, then
   * flushes the view synchronously. Used outside the normal pre-render
   * window (post-view-init, resize/input events) where mutating `rows`
   * would otherwise trigger ExpressionChangedAfterItHasBeenCheckedError. */
  private refresh(): void {
    if (!this.attachedTextarea) {
      return;
    }
    const gutter = this.gutterRef.nativeElement;
    this.overlayService.applyVerticalMetrics(this.attachedTextarea, gutter);
    this.syncScroll();
    this.updateRows();
    this.cdr.detectChanges();
  }

  private syncScroll(): void {
    if (!this.attachedTextarea) {
      return;
    }
    this.overlayService.syncScroll(
      this.attachedTextarea,
      this.gutterRef.nativeElement,
    );
  }

  private updateRows(): void {
    const measurer = this.measurerRef?.nativeElement;
    if (!measurer || !this.attachedTextarea) {
      return;
    }

    const text = this.text ?? "";
    const lines = text.split("\n");

    // Give the (invisible) measurer the textarea's exact width and text
    // metrics so its lines wrap at the same points as the real textarea.
    this.overlayService.applyMirrorStyles(this.attachedTextarea, measurer);
    measurer.replaceChildren(
      ...lines.map((line) => {
        const div = document.createElement("div");
        div.textContent = line.length > 0 ? line : "​";
        return div;
      }),
    );
    const heights = Array.from(measurer.children).map(
      (child) => (child as HTMLElement).offsetHeight,
    );

    const runByStartLine = new Map(
      findBlankLineRuns(text).map((run) => [run.startLine, run]),
    );

    const rows: GutterRow[] = [];
    for (let i = 0; i < lines.length; ) {
      const run = runByStartLine.get(i);
      if (run) {
        // A run's blank lines collapse into a single row spanning their
        // combined height, so its marker can be centered once rather than
        // repeated per line.
        const heightPx = heights
          .slice(run.startLine, run.endLine + 1)
          .reduce((sum, height) => sum + height, 0);
        rows.push({ heightPx, marker: run.kind });
        i = run.endLine + 1;
      } else {
        rows.push({ heightPx: heights[i], marker: null });
        i++;
      }
    }

    this.rows = rows;
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

    this.attachedTextarea.addEventListener("scroll", this.handleScroll);
    this.attachedTextarea.addEventListener(
      "input",
      this.handleResizingActivity,
    );
    window.addEventListener("resize", this.handleResizingActivity);
    this.stopObservingResize = this.overlayService.observeResize(
      this.attachedTextarea,
      this.handleResizingActivity,
    );
  }

  private detachFromTextarea(): void {
    this.attachedTextarea?.removeEventListener("scroll", this.handleScroll);
    this.attachedTextarea?.removeEventListener(
      "input",
      this.handleResizingActivity,
    );
    window.removeEventListener("resize", this.handleResizingActivity);
    this.stopObservingResize?.();
    this.stopObservingResize = null;
    this.attachedTextarea = null;
  }
}
