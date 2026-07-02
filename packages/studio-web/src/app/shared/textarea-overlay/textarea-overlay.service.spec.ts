import { TestBed } from "@angular/core/testing";
import { TextareaOverlayService } from "./textarea-overlay.service";

describe("TextareaOverlayService", () => {
  let service: TextareaOverlayService;
  let source: HTMLTextAreaElement;
  let target: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextareaOverlayService);

    source = document.createElement("textarea");
    source.style.fontFamily = "monospace";
    source.style.fontSize = "17px";
    source.style.lineHeight = "24px";
    source.style.padding = "5px 7px";
    source.style.width = "200px";
    source.style.height = "80px";
    document.body.appendChild(source);

    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    source.remove();
    target.remove();
  });

  it("copies text-layout affecting styles from source to target", () => {
    service.applyMirrorStyles(source, target);

    expect(target.style.fontFamily).toBe("monospace");
    expect(target.style.fontSize).toBe("17px");
    expect(target.style.lineHeight).toBe("24px");
    expect(target.style.paddingTop).toBe("5px");
    expect(target.style.paddingLeft).toBe("7px");
  });

  it("sizes target to match source's content box, ignoring source's own border", () => {
    source.style.border = "3px solid black";

    service.applyMirrorStyles(source, target);

    expect(target.style.border).toBe("0px");
    expect(target.style.width).toBe(`${source.clientWidth}px`);
    expect(target.style.height).toBe(`${source.clientHeight}px`);
  });

  it("mirrors scroll position", () => {
    source.style.width = "20px";
    source.style.height = "20px";
    source.value = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8";

    // Give target far more scrollable room than source could ever need, so
    // it's never the one clamping the assigned scrollTop/scrollLeft (real
    // browser layout, not the mirroring logic under test, decides how far
    // `source` itself can scroll).
    target.style.height = "20px";
    target.style.width = "20px";
    target.style.overflow = "scroll";
    const spacer = document.createElement("div");
    spacer.style.width = "1000px";
    spacer.style.height = "1000px";
    target.appendChild(spacer);

    source.scrollTop = 10;
    source.scrollLeft = 3;

    service.syncScroll(source, target);

    expect(target.scrollTop).toBe(source.scrollTop);
    expect(target.scrollLeft).toBe(source.scrollLeft);
  });

  it("observeResize invokes the callback and can be disposed", (done) => {
    const callback = jasmine.createSpy("callback");
    const stop = service.observeResize(source, callback);

    source.style.width = "500px";

    // ResizeObserver callbacks are asynchronous.
    setTimeout(() => {
      expect(callback).toHaveBeenCalled();
      stop();
      done();
    }, 100);
  });
});
