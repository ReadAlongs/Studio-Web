import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ToastrModule } from "ngx-toastr";
import { DownloadComponent } from "./download.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MaterialModule } from "../../material.module";
import { FormsModule } from "@angular/forms";
describe("DownloadComponent", () => {
  let component: DownloadComponent;
  let fixture: ComponentFixture<DownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        FormsModule,
        MaterialModule,
        ToastrModule.forRoot(),
      ],
      declarations: [DownloadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
