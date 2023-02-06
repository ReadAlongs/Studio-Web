import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TextFormatDialogComponent } from "./text-format-dialog.component";

describe("TextFormatDialogComponent", () => {
  let component: TextFormatDialogComponent;
  let fixture: ComponentFixture<TextFormatDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextFormatDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextFormatDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
