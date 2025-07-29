import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WcStylingComponent } from "./wc-styling.component";
import { ToastrModule } from "ngx-toastr";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "../../material.module";
import { FormsModule } from "@angular/forms";
import { provideHttpClient } from "@angular/common/http";

describe("WcStylingComponent", () => {
  let component: WcStylingComponent;
  let fixture: ComponentFixture<WcStylingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MaterialModule,
        ToastrModule.forRoot(),
      ],
      declarations: [WcStylingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(WcStylingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
