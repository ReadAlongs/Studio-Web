import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Missing404Component } from "./missing404.component";

describe("Missing404Component", () => {
  let component: Missing404Component;
  let fixture: ComponentFixture<Missing404Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Missing404Component],
    }).compileComponents();

    fixture = TestBed.createComponent(Missing404Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
