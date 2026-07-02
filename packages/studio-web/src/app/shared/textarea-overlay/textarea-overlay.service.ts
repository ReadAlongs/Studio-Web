import { Injectable } from "@angular/core";

/**
 * CSS properties that affect where text wraps and sits inside an element.
 * Copied verbatim from the textarea onto its mirror so the two layers'
 * text lines up exactly. Width/height and border are handled separately
 * in `applyMirrorStyles` because computed `width`/`height` behave
 * inconsistently across browsers under `box-sizing: border-box`.
 */
const MIRRORED_STYLE_PROPERTIES = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontVariant",
  "fontKerning",
  "letterSpacing",
  "lineHeight",
  "textIndent",
  "textTransform",
  "whiteSpace",
  "wordSpacing",
  "wordWrap",
  "overflowWrap",
  "tabSize",
  "direction",
] as const satisfies readonly (keyof CSSStyleDeclaration)[];

/**
 * Reusable plumbing for building a decoration layer that mirrors a
 * `<textarea>`: keeping a target element's text layout and scroll
 * position identical to the source textarea. Used by the background-tint
 * overlay, and intended for reuse by the gutter, error underlines and
 * bubble menu built on top of it in later iterations.
 */
@Injectable({ providedIn: "root" })
export class TextareaOverlayService {
  /**
   * Copies every CSS property that affects text layout from `source`
   * onto `target`, and sizes `target` to match `source`'s content box
   * (via `clientWidth`/`clientHeight`, which already exclude border and
   * any scrollbar gutter) so wrapped lines land in the same place on
   * both elements.
   */
  applyMirrorStyles(source: HTMLElement, target: HTMLElement): void {
    const computed = getComputedStyle(source);
    const targetStyle = target.style as unknown as Record<string, string>;
    const computedStyle = computed as unknown as Record<string, string>;
    for (const property of MIRRORED_STYLE_PROPERTIES) {
      targetStyle[property] = computedStyle[property];
    }
    target.style.boxSizing = "border-box";
    target.style.border = "0";
    target.style.margin = "0";
    target.style.width = `${source.clientWidth}px`;
    target.style.height = `${source.clientHeight}px`;
  }

  /** Mirrors the scroll position of `source` onto `target`. */
  syncScroll(source: HTMLElement, target: HTMLElement): void {
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
  }

  /**
   * Copies just the vertical box metrics (top/bottom padding and height)
   * from `source` onto `target`, without touching width, horizontal
   * padding, or font/text properties. For elements like the gutter that
   * sit beside the textarea rather than behind it: they need their first
   * row to start at the same vertical offset as the textarea's first line
   * of text, but have their own fixed width and don't render the
   * textarea's actual text.
   */
  applyVerticalMetrics(source: HTMLElement, target: HTMLElement): void {
    const computed = getComputedStyle(source);
    target.style.paddingTop = computed.paddingTop;
    target.style.paddingBottom = computed.paddingBottom;
    target.style.boxSizing = "border-box";
    target.style.height = `${source.clientHeight}px`;
  }

  /**
   * Observes `element` for box-size changes (window resizes, manual
   * textarea resizing, etc.) and invokes `callback` each time. Returns a
   * disposer that stops observing.
   */
  observeResize(element: Element, callback: () => void): () => void {
    const observer = new ResizeObserver(() => callback());
    observer.observe(element);
    return () => observer.disconnect();
  }
}
