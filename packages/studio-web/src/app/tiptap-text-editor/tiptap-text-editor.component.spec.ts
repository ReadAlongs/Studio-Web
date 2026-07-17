import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TiptapTextEditorComponent } from "./tiptap-text-editor.component";

describe("TiptapTextEditorComponent", () => {
  let component: TiptapTextEditorComponent;
  let fixture: ComponentFixture<TiptapTextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TiptapTextEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TiptapTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
