import { of } from "rxjs";
import { ToastrModule, ToastrService } from "ngx-toastr";

import { provideHttpClient } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MaterialModule } from "../material.module";
import { UploadComponent } from "./upload.component";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TiptapTextEditorComponent } from "../tiptap-text-editor/tiptap-text-editor.component";
import { plainTextToDoc } from "../tiptap-text-editor/schema/serializers";

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
      declarations: [UploadComponent, TiptapTextEditorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Real toasts render an actual overlay component asynchronously,
        // which can outlive a test that's already moved on to the next
        // spec's TestBed reset — a spy keeps these tests hermetic.
        {
          provide: ToastrService,
          useValue: jasmine.createSpyObj("ToastrService", [
            "success",
            "error",
            "clear",
          ]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("loads an uploaded text file directly when the editor is empty", (done) => {
    const dialogSpy = spyOn((component as any).dialog as MatDialog, "open");
    const file = new File(["Hello from a file."], "hello.txt", {
      type: "text/plain",
    });
    const input = { files: [file] } as unknown as HTMLInputElement;

    component.studioService.textControl$.valueChanges.subscribe((doc) => {
      expect(dialogSpy).not.toHaveBeenCalled();
      expect(doc?.textContent).toContain("Hello from a file.");
      done();
    });
    component.onTextFileSelected({ target: input } as unknown as Event);
  });

  it("asks for confirmation before an upload replaces existing text, and only replaces on confirm", (done) => {
    component.studioService.textControl$.setValue(
      plainTextToDoc("Existing text."),
    );
    const dialogSpy = spyOn(
      (component as any).dialog as MatDialog,
      "open",
    ).and.returnValue({ afterClosed: () => of(true) } as any);
    const file = new File(["Uploaded text."], "uploaded.txt", {
      type: "text/plain",
    });
    const input = { files: [file] } as unknown as HTMLInputElement;

    component.studioService.textControl$.valueChanges.subscribe((doc) => {
      expect(dialogSpy).toHaveBeenCalled();
      expect(doc?.textContent).toContain("Uploaded text.");
      done();
    });
    component.onTextFileSelected({ target: input } as unknown as Event);
  });
});
