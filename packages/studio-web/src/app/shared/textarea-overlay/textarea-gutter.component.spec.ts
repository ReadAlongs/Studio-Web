import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MaterialModule } from "../../material.module";
import { TextareaGutterComponent } from "./textarea-gutter.component";

// A real template binding (rather than poking `component.text` directly)
// so `text`/`textareaEl` flow through Angular's normal top-down change
// detection on every `fixture.detectChanges()` call — see
// TextareaOverlayComponent's spec for why this matters.
@Component({
  template: `<app-textarea-gutter
    [textareaEl]="textareaEl"
    [text]="text"
  ></app-textarea-gutter>`,
  standalone: false,
})
class HostComponent {
  text = "";
  textareaEl: HTMLTextAreaElement | null = null;
}

describe("TextareaGutterComponent", () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let textarea: HTMLTextAreaElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [TextareaGutterComponent, HostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;

    // The gutter only measures/renders rows once it has a textarea to
    // mirror, so every test needs a real, attached one.
    textarea = document.createElement("textarea");
    textarea.style.width = "300px";
    textarea.style.height = "200px";
    document.body.appendChild(textarea);
    host.textareaEl = textarea;
  });

  afterEach(() => {
    textarea.remove();
  });

  function rowEls(): NodeListOf<HTMLElement> {
    return hostFixture.nativeElement.querySelectorAll(".textarea-gutter__row");
  }

  it("should create", () => {
    hostFixture.detectChanges();
    expect(
      hostFixture.debugElement.query(By.css("app-textarea-gutter")),
    ).toBeTruthy();
  });

  it("renders one row per line with no marker for ordinary text", () => {
    host.text = "line one\nline two";
    hostFixture.detectChanges();

    const rows = rowEls();
    expect(rows.length).toBe(2);
    rows.forEach((row) => {
      expect(row.querySelector(".textarea-gutter__pilcrow")).toBeNull();
      expect(row.querySelector(".textarea-gutter__page-icon")).toBeNull();
    });
  });

  it("renders a pilcrow on a single blank line (paragraph break)", () => {
    host.text = "para one\n\npara two";
    hostFixture.detectChanges();

    const rows = rowEls();
    expect(rows.length).toBe(3);
    expect(rows[1].querySelector(".textarea-gutter__pilcrow")).not.toBeNull();
    expect(rows[1].querySelector(".textarea-gutter__page-icon")).toBeNull();
  });

  it("merges a page-break run into a single row with a page icon", () => {
    host.text = "page one\n\n\npage two";
    hostFixture.detectChanges();

    const rows = rowEls();
    // 2 text rows + 1 merged blank-run row, not 2 text rows + 2 blank rows.
    expect(rows.length).toBe(3);
    expect(rows[1].querySelector(".textarea-gutter__page-icon")).not.toBeNull();
    expect(rows[1].querySelector(".textarea-gutter__pilcrow")).toBeNull();
  });

  it("sizes the merged page-break row taller than an ordinary row", () => {
    host.text = "a\n\n\nb";
    hostFixture.detectChanges();

    const rows = rowEls();
    const ordinaryHeight = rows[0].getBoundingClientRect().height;
    const pageRowHeight = rows[1].getBoundingClientRect().height;
    expect(pageRowHeight).toBeGreaterThan(ordinaryHeight);
  });

  it("syncs scroll position with the textarea", () => {
    textarea.style.height = "20px";
    textarea.value = Array.from({ length: 50 }, (_, i) => `line ${i}`).join(
      "\n",
    );
    host.text = textarea.value;
    hostFixture.detectChanges();

    textarea.scrollTop = 5;
    textarea.dispatchEvent(new Event("scroll"));

    const gutter: HTMLElement =
      hostFixture.nativeElement.querySelector(".textarea-gutter");
    expect(gutter.scrollTop).toBe(textarea.scrollTop);
  });
});
