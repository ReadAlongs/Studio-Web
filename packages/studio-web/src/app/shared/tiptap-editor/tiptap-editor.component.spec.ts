import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MaterialModule } from "../../material.module";
import { SharedModule } from "../shared.module";
import { TiptapEditorComponent } from "./tiptap-editor.component";

describe("TiptapEditorComponent", () => {
  let component: TiptapEditorComponent;
  let fixture: ComponentFixture<TiptapEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, MaterialModule, BrowserAnimationsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TiptapEditorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("creates an editor with an empty doc when no initialText is given", () => {
    fixture.detectChanges();
    expect(component["editor"]).toBeTruthy();
    expect(component["editor"]!.state.doc.textContent).toBe("");
  });

  it("seeds the editor from initialText using the blank-line convention", () => {
    component.initialText = "Page one.\n\n\nPage two.";
    fixture.detectChanges();
    expect(component["editor"]!.state.doc.childCount).toBe(3);
    expect(component["editor"]!.state.doc.child(1).type.name).toBe("pagebreak");
  });

  it("emits read-along input XML reflecting an edit", () => {
    fixture.detectChanges();
    const emitted: string[] = [];
    component.xmlChange.subscribe((xml) => emitted.push(xml));
    // A no-op edit (identical content) wouldn't be `docChanged`, so load
    // genuinely different text to trigger the update event.
    component.loadText("Hello world.");
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toContain("<s>Hello world.</s>");
  });

  it("inserts a pagebreak node at the cursor via insertPageBreak()", () => {
    fixture.detectChanges();
    const editor = component["editor"]!;
    editor.commands.setTextSelection(1);
    component.insertPageBreak();
    expect(
      editor.state.doc.content.content.some(
        (node) => node.type.name === "pagebreak",
      ),
    ).toBeTrue();
  });

  it("loadXml replaces the document and emits its XML", () => {
    fixture.detectChanges();
    const emitted: string[] = [];
    component.xmlChange.subscribe((xml) => emitted.push(xml));
    component.loadXml(
      '<read-along version="1.2"><text><body><div type="page"><p><s>From XML.</s></p></div></body></text></read-along>',
    );
    expect(component["editor"]!.state.doc.textContent).toBe("From XML.");
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toContain("<s>From XML.</s>");
  });

  it("destroys the underlying editor on ngOnDestroy", () => {
    fixture.detectChanges();
    const editor = component["editor"]!;
    spyOn(editor, "destroy");
    fixture.destroy();
    expect(editor.destroy).toHaveBeenCalled();
  });

  it("disables the browser's native spellcheck (content can be any language)", () => {
    fixture.detectChanges();
    const dom = component["editor"]!.view.dom as HTMLElement;
    expect(dom.getAttribute("spellcheck")).toBe("false");
  });

  it("makes the contenteditable fill the whole content box, not just its own short content (regression: clicking below a single line of text hit the non-editable wrapper instead of focusing the editor)", () => {
    document.body.appendChild(fixture.nativeElement);
    component.loadText("Short.");
    fixture.detectChanges();

    const wrapper: HTMLElement = fixture.nativeElement.querySelector(
      '[data-test-id="tiptap-editor-content"]',
    );
    const wrapperRect = wrapper.getBoundingClientRect();
    const proseMirrorDom = component["editor"]!.view.dom as HTMLElement;
    const proseMirrorRect = proseMirrorDom.getBoundingClientRect();

    // The contenteditable should now span nearly the wrapper's full
    // min-height (only its own padding excluded), not just the height of
    // "Short." — before the fix this would be one line tall (~24px)
    // inside a 150px box.
    expect(proseMirrorRect.height).toBeGreaterThan(wrapperRect.height * 0.8);

    // A point well below the single short line of text, but still
    // clearly inside the contenteditable's own (now much taller) box.
    const x = proseMirrorRect.left + 5;
    const y = proseMirrorRect.bottom - 5;
    const elementAtPoint = document.elementFromPoint(x, y);
    expect(proseMirrorDom.contains(elementAtPoint)).toBeTrue();

    document.body.removeChild(fixture.nativeElement);
  });

  describe("error popover", () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.loadText("hello world");
      // "world" sits at [8, 13) in "hello world" (doc-start 0, paragraph
      // content 1, sentence text-start 2, then 6 chars of "hello ").
      component.setErrorRanges([{ from: 8, to: 13 }]);
      fixture.detectChanges();
    });

    function flaggedWordEl(): HTMLElement {
      return fixture.nativeElement.querySelector(".readalong-error-word");
    }

    it("renders the flagged word with the error decoration class", () => {
      const el = flaggedWordEl();
      expect(el).toBeTruthy();
      expect(el.textContent).toBe("world");
    });

    it("gives a flagged zero-advance-width character (e.g. an orphan combining diacritic) a visible background fill (regression: neither the underline nor the box's own min-width was actually visible — text-decoration paints along the glyph run's advance width, not the box, so it stayed invisible even once the box itself measured non-zero)", () => {
      component.loadText("Stray diacritics ̓ are a problem.");
      fixture.detectChanges();
      const doc = component["editor"]!.state.doc;
      let markFrom = -1;
      doc.descendants((node, pos) => {
        if (node.isText) {
          const idx = (node.text ?? "").indexOf("̓");
          if (idx !== -1) {
            markFrom = pos + idx;
          }
        }
      });
      component.setErrorRanges([{ from: markFrom, to: markFrom + 1 }]);
      fixture.detectChanges();

      const el = flaggedWordEl();
      expect(el).toBeTruthy();
      expect(el.textContent).toBe("̓");
      expect(el.getBoundingClientRect().width).toBeGreaterThan(0);
      expect(getComputedStyle(el).backgroundColor).toBe(
        "rgba(211, 47, 47, 0.2)",
      );
    });

    it("shows the popover when the flagged word is clicked", () => {
      flaggedWordEl().click();
      fixture.detectChanges();
      expect(component["errorPopoverPosition"]).toBeTruthy();
      expect(component["errorPopoverMessage"]).not.toBe("");
      const popoverEl = fixture.nativeElement.querySelector(
        '[data-test-id="tiptap-error-popover"]',
      );
      expect(popoverEl).toBeTruthy();
    });

    it("hides the popover when clicking elsewhere in the editor content", () => {
      flaggedWordEl().click();
      fixture.detectChanges();
      expect(component["errorPopoverPosition"]).toBeTruthy();

      fixture.nativeElement
        .querySelector('[data-test-id="tiptap-editor-content"]')
        .click();
      fixture.detectChanges();
      expect(component["errorPopoverPosition"]).toBeNull();
    });

    it("hides the popover on any subsequent edit", () => {
      flaggedWordEl().click();
      fixture.detectChanges();
      expect(component["errorPopoverPosition"]).toBeTruthy();

      component.loadText("something else entirely");
      fixture.detectChanges();
      expect(component["errorPopoverPosition"]).toBeNull();
    });

    it("hides the popover when clicking outside the component entirely", () => {
      flaggedWordEl().click();
      fixture.detectChanges();
      expect(component["errorPopoverPosition"]).toBeTruthy();

      document.body.click();
      fixture.detectChanges();
      expect(component["errorPopoverPosition"]).toBeNull();
    });
  });
});
