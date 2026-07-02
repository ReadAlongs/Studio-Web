import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TextareaOverlayComponent } from "./textarea-overlay.component";

// A real template binding (rather than poking `component.text` directly)
// so `text`/`textareaEl` flow through Angular's normal top-down change
// detection on every `fixture.detectChanges()` call, exactly as they do
// in the real app. Setting an @Input directly from test code bypasses
// that and can trip Angular's dev-mode "changed after checked" guard when
// a test changes the input more than once.
@Component({
  template: `<app-textarea-overlay
    [text]="text"
    [textareaEl]="textareaEl"
  ></app-textarea-overlay>`,
  standalone: false,
})
class HostComponent {
  text = "";
  textareaEl: HTMLTextAreaElement | null = null;
}

describe("TextareaOverlayComponent", () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextareaOverlayComponent, HostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
  });

  it("should create", () => {
    hostFixture.detectChanges();
    expect(
      hostFixture.debugElement.query(By.css("app-textarea-overlay")),
    ).toBeTruthy();
  });

  it("renders one line per source line, with no tint on plain text", () => {
    host.text = "line one\nline two";
    hostFixture.detectChanges();

    const lineEls: NodeListOf<HTMLElement> =
      hostFixture.nativeElement.querySelectorAll(".textarea-overlay__line");
    expect(lineEls.length).toBe(2);
    expect(lineEls[0].textContent).toBe("line one");
    expect(lineEls[1].textContent).toBe("line two");
    lineEls.forEach((el) => {
      expect(el.classList).not.toContain("textarea-overlay__line--paragraph");
      expect(el.classList).not.toContain("textarea-overlay__line--page");
    });
  });

  it("tints a single blank line as a paragraph break", () => {
    host.text = "para one\n\npara two";
    hostFixture.detectChanges();

    const lineEls: NodeListOf<HTMLElement> =
      hostFixture.nativeElement.querySelectorAll(".textarea-overlay__line");
    expect(lineEls.length).toBe(3);
    expect(
      lineEls[1].classList.contains("textarea-overlay__line--paragraph"),
    ).toBeTrue();
    expect(
      lineEls[1].classList.contains("textarea-overlay__line--page"),
    ).toBeFalse();
  });

  it("tints a run of two blank lines as a page break", () => {
    host.text = "page one\n\n\npage two";
    hostFixture.detectChanges();

    const lineEls: NodeListOf<HTMLElement> =
      hostFixture.nativeElement.querySelectorAll(".textarea-overlay__line");
    expect(lineEls.length).toBe(4);
    expect(
      lineEls[1].classList.contains("textarea-overlay__line--page"),
    ).toBeTrue();
    expect(
      lineEls[2].classList.contains("textarea-overlay__line--page"),
    ).toBeTrue();
  });

  it("attaches to the given textarea and syncs its scroll position", () => {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.style.height = "20px";
    textarea.value = Array.from({ length: 50 }, (_, i) => `line ${i}`).join(
      "\n",
    );

    host.textareaEl = textarea;
    hostFixture.detectChanges();

    textarea.scrollTop = 5;
    textarea.dispatchEvent(new Event("scroll"));

    const mirror: HTMLElement =
      hostFixture.nativeElement.querySelector(".textarea-overlay");
    // The real textarea may itself clamp the requested scrollTop depending
    // on layout; assert the mirror matches whatever that landed on, not a
    // hardcoded value.
    expect(mirror.scrollTop).toBe(textarea.scrollTop);
    expect(textarea.scrollTop).toBeGreaterThan(0);

    textarea.remove();
  });
});
