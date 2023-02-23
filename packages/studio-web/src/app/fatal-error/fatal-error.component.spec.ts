import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FatalErrorComponent } from "./fatal-error.component";

describe("FatalErrorComponent", () => {
  let component: FatalErrorComponent;
  let fixture: ComponentFixture<FatalErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FatalErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FatalErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
