import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ToastrModule } from "ngx-toastr";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MaterialModule } from "../material.module";
import { DemoComponent } from "./demo.component";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "../shared/shared.module";
import { provideHttpClient } from "@angular/common/http";

// ==== check create or not and default value =====
describe("DemoComponent", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        BrowserAnimationsModule,
        FormsModule,
        MaterialModule,
        ToastrModule.forRoot(),
      ],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'Title'`, () => {
    expect(component.studioService.slots.title).toEqual("Title");
  });

  it(`should have as subtitle 'SubTitle'`, () => {
    expect(component.studioService.slots.subtitle).toEqual("Subtitle");
  });
});
