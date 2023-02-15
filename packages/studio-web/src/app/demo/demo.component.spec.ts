import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ToastrModule } from "ngx-toastr";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
// add By to query
import { By } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MaterialModule } from "../material.module";
import { DemoComponent } from "./demo.component";
import { FormsModule } from "@angular/forms";

// ==== check create or not and default value =====
describe("DemoComponent", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule,  BrowserAnimationsModule, FormsModule, MaterialModule, ToastrModule.forRoot()],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'Title'`, () => {
    expect(component.slots.title).toEqual("Title");
  });

  it(`should have as subtitle 'SubTitle'`, () => {
    expect(component.slots.subtitle).toEqual("Subtitle");
  });

  it(`should have as page title 'ReadAlong Studio'`, () => {
    expect(component.slots.pageTitle).toEqual("PageTitle");
  });

  it("test editable page title when it is simple value", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = "new";
    formData.nativeElement.dispatchEvent(new Event("input"));

    expect(formData.nativeElement.value).toBe("new");
  });

  it("test empty editable page title", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = "";
    formData.nativeElement.dispatchEvent(new Event("input"));

    expect(formData.nativeElement.value).toBe("");
  });

  it("test empty editable page title", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = "111";
    formData.nativeElement.dispatchEvent(new Event("input"));
    formData.nativeElement.value = "222";
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe("222");
  });

  it("test editable page title including special characters", () => {
    let car: string = '!"§$%&/()=?\u{20ac}';
    let res: string = car.substring(Math.floor(car.length * Math.random()), 1);
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = "new";
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe("new");
  });

  it("test editable page title after third edit ", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = "new editable Page";
    formData.nativeElement.dispatchEvent(new Event("input"));
    formData.nativeElement.value = "new editable Page 2";
    formData.nativeElement.dispatchEvent(new Event("input"));
    formData.nativeElement.value = "new editable Page 3";
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe("new editable Page 3");
  });

  it("test editable page title after random times of edit ", () => {
    let num: number = Math.ceil(Math.random() * 10);
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = num;
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe(num);
  });

  it("test editable page title after random times of space in the front", () => {
    let num: number = Math.ceil(Math.random() * 10);
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value =
      Array(num).fill("\xa0").join("") + "new editable Page";
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe(
      Array(num).fill("\xa0").join("") + "new editable Page"
    );
  });

  it("test editable page title after random times of space in the end", () => {
    let num: number = Math.ceil(Math.random() * 10);
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value =
      "new editable Page" + Array(num).fill("\xa0").join("");
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe(
      "new editable Page" + "\xa0".repeat(num)
    );
  });

  it("test editable page title including special characters", () => {
    let car: string = '!"§$%&/()=?\u{20ac}';
    let res: string = car.substring(Math.floor(car.length * Math.random()), 1);
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = "new editable Page" + res;
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe("new editable Page" + res);
  });

  it("test editable page title including special characters", () => {
    let car: string = '!"§$%&/()=?\u{20ac}';
    let res: string = car.substring(Math.floor(car.length * Math.random()), 1);
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = "new editable Page" + res;
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe("new editable Page" + res);
  });

  it("test editable page title too short", () => {
    let tmp: string = randomRange(1, 3);
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = tmp;
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe(tmp);
  });

  it("test editable page title too long", () => {
    let tmp: string = randomRange(100, 500);
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css("#newpagetitle"));
    formData.nativeElement.value = tmp;
    formData.nativeElement.dispatchEvent(new Event("input"));
    expect(formData.nativeElement.value).toBe(tmp);
  });
});

function randomRange(min: number, max: number) {
  var returnStr = "";
  var range = max ? Math.round(Math.random() * (max - min)) + min : min,
    arr = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];

  for (var i = 0; i < range; i++) {
    var index = Math.round(Math.random() * (arr.length - 1));
    returnStr += arr[index];
  }
  return returnStr;
}
