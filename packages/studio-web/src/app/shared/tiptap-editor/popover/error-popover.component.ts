import { Component, Input } from "@angular/core";

export interface PopoverPosition {
  /** Pixels from the top of the popover's positioned ancestor. */
  top: number;
  /** Pixels from the left of the popover's positioned ancestor. */
  left: number;
}

/**
 * A small fixed-message tooltip shown next to a g2p-error-flagged word
 * (see g2p/error-highlight-extension.ts), explaining the underline in
 * place of only a flat toastr message. Purely presentational — the host
 * (tiptap-editor.component) owns when it's shown and where.
 */
@Component({
  selector: "ras-shared-error-popover",
  templateUrl: "./error-popover.component.html",
  styleUrl: "./error-popover.component.sass",
  standalone: false,
})
export class ErrorPopoverComponent {
  @Input() position: PopoverPosition | null = null;
  @Input() message = "";
}
