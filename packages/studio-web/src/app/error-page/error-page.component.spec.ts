import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ErrorPageComponent } from "./error-page.component";
import { provideRouter } from "@angular/router";
import { routes } from "../app-routing.module";

describe("ErrorPageComponent", () => {
  let component: ErrorPageComponent;
  let fixture: ComponentFixture<ErrorPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorPageComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
