import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WcStylingComponent } from "./wc-styling.component";
import { ToastrModule } from "ngx-toastr";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "../../material.module";
import { FormsModule } from "@angular/forms";
describe("WcStylingComponent", () => {
  let component: WcStylingComponent;
  let fixture: ComponentFixture<WcStylingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        FormsModule,
        MaterialModule,
        ToastrModule.forRoot(),
      ],
      declarations: [WcStylingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WcStylingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
