import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ToastrModule } from "ngx-toastr";
import { EditorComponent } from "./editor.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { FormsModule } from "@angular/forms";
import { MaterialModule } from "../material.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("EditorComponent", () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ToastrModule.forRoot(),
        FormsModule,
        MaterialModule,
        BrowserAnimationsModule,
      ],
      declarations: [EditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
