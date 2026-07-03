import { ToastrModule } from "ngx-toastr";

import { provideHttpClient } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MaterialModule } from "../material.module";
import { UploadComponent } from "./upload.component";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("UploadComponent", () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        FormsModule,
        ToastrModule.forRoot(),
        MaterialModule,
      ],
      declarations: [UploadComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("reportRasError — g2p errors", () => {
    const PARTIAL_RAS = `<?xml version='1.0' encoding='utf-8'?>
<read-along version="1.2">
  <text xml:lang="dan" fallback-langs="und" id="t0">
    <body id="t0b0">
      <div type="page" id="t0b0d0">
        <p id="t0b0d0p0">
          <s id="t0b0d0p0s0"><w ARPABET="HH EH Y">hej</w> <w ARPABET="V Y D EH N">verden</w> <w ARPABET="">2</w></s>
        </p>
      </div>
    </body>
  </text>
</read-along>`;

    // Simulates a request having just been submitted with `text`, and the
    // textarea still holding that same value (the common case — the
    // request typically resolves before the user types anything else).
    function setLastSubmittedText(text: string): void {
      (
        component as unknown as { lastSubmittedText: string }
      ).lastSubmittedText = text;
      component.studioService.$textInput.next(text);
    }

    it("underlines the failing word and shows the adjusted toast", () => {
      setLastSubmittedText("hej verden 2");
      const toastrSpy = spyOn((component as any).toastr, "error");

      let ranges: { start: number; end: number }[] = [];
      component.studioService.$textInputErrors.subscribe((r) => (ranges = r));

      component.reportRasError({
        status: 422,
        error: {
          detail: "g2p could not be performed...",
          g2p_error_words: ["2"],
          partial_ras: PARTIAL_RAS,
        },
      } as any);

      expect(ranges).toEqual([{ start: 11, end: 12 }]);
      expect(toastrSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/highlighted text/),
        jasmine.any(String),
        jasmine.any(Object),
      );
    });

    it("falls back to the generic toast when the error has no partial_ras", () => {
      setLastSubmittedText("hej verden 2");
      const toastrSpy = spyOn((component as any).toastr, "error");

      component.reportRasError({
        status: 422,
        error: { detail: "some generic failure" },
      } as any);

      expect(toastrSpy).toHaveBeenCalledWith(
        "some generic failure",
        jasmine.any(String),
        jasmine.any(Object),
      );
    });

    it("falls back to the generic toast when word counts don't line up", () => {
      setLastSubmittedText("hej verden 2 extra");
      const toastrSpy = spyOn((component as any).toastr, "error");

      component.reportRasError({
        status: 422,
        error: {
          detail: "g2p could not be performed...",
          g2p_error_words: ["2"],
          partial_ras: PARTIAL_RAS,
        },
      } as any);

      expect(toastrSpy).toHaveBeenCalledWith(
        "g2p could not be performed...",
        jasmine.any(String),
        jasmine.any(Object),
      );
    });

    it("clears the error mark once the user edits that word", () => {
      setLastSubmittedText("hej verden 2");
      spyOn((component as any).toastr, "error");
      component.reportRasError({
        status: 422,
        error: {
          detail: "x",
          g2p_error_words: ["2"],
          partial_ras: PARTIAL_RAS,
        },
      } as any);

      let ranges: { start: number; end: number }[] = [];
      component.studioService.$textInputErrors.subscribe((r) => (ranges = r));
      expect(ranges.length).toBe(1);

      component.studioService.$textInput.next("hej verden two");
      expect(ranges).toEqual([]);
    });

    it("keeps the error mark when a different word is edited", () => {
      setLastSubmittedText("hej verden 2");
      spyOn((component as any).toastr, "error");
      component.reportRasError({
        status: 422,
        error: {
          detail: "x",
          g2p_error_words: ["2"],
          partial_ras: PARTIAL_RAS,
        },
      } as any);

      const newText = "hi verden 2";
      component.studioService.$textInput.next(newText);

      let ranges: { start: number; end: number }[] = [];
      component.studioService.$textInputErrors.subscribe((r) => (ranges = r));
      const expectedStart = newText.indexOf("2");
      expect(ranges).toEqual([
        { start: expectedStart, end: expectedStart + 1 },
      ]);
    });

    it("regression: deleting one flagged word doesn't clear a different flagged word after it", () => {
      // "hello 1 2 3" — 1, 2 and 3 all fail g2p.
      setLastSubmittedText("hello 1 2 3");
      spyOn((component as any).toastr, "error");
      const partialRas = `<read-along><text><body><div type="page"><p><s>
        <w ARPABET="HH EH L OW">hello</w>
        <w ARPABET="">1</w>
        <w ARPABET="">2</w>
        <w ARPABET="">3</w>
      </s></p></div></body></text></read-along>`;
      component.reportRasError({
        status: 422,
        error: {
          detail: "x",
          g2p_error_words: ["1", "2", "3"],
          partial_ras: partialRas,
        },
      } as any);

      let ranges: { start: number; end: number }[] = [];
      component.studioService.$textInputErrors.subscribe((r) => (ranges = r));
      expect(ranges.length).toBe(3);

      // Delete "2 " (the middle flagged word plus its trailing space).
      const newText = "hello 1 3";
      component.studioService.$textInput.next(newText);

      // "1" and "3" are both still present (just shifted) and must stay
      // flagged; only "2" (actually removed) should drop off.
      const oneStart = newText.indexOf("1");
      const threeStart = newText.indexOf("3");
      expect(ranges).toEqual([
        { start: oneStart, end: oneStart + 1 },
        { start: threeStart, end: threeStart + 1 },
      ]);
    });
  });
});
