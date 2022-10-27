import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
// add By to query
import { By } from "@angular/platform-browser";

import { MaterialModule } from "../material.module";
import { DemoComponent } from "./demo.component";

// ==== check create or not and defalut value =====
describe("DemoComponent", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
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
    expect(component.slots.pageTitle).toEqual("ReadAlong Studio");
  });
});

// ================test page title=================
// === test editable test page before edited ===
describe("DemoComponent-pagetitle-simplevalue", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test editable page title when it is simple value", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = "new";
    formData.nativeElement.dispatchEvent(new Event('input'));

    expect(formData.nativeElement.value).toBe("new");
});
});

// === test editable test page after edited empty value ===
describe("DemoComponent-pagetitle-editempty", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test empty editable page title", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = "";
    formData.nativeElement.dispatchEvent(new Event('input'));

    expect(formData.nativeElement.value).toBe("");
  });
});

// === test editable test page after twice edited ====
describe("DemoComponent-pagetitle-edittwice", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test empty editable page title", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = "111";
    formData.nativeElement.dispatchEvent(new Event('input'));
    formData.nativeElement.value = "222";
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe("222");
  });
});

describe("DemoComponent-pagetitle-editrandom-special-characters", () => {

  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let car: string = '!"§$%&/()=?\u{20ac}';
  let res: string = car.substring(Math.floor(car.length * Math.random()), 1);
  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test editable page title including special characters", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = "new";
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe("new");
  });
});

// === test editable test page after third edited ====
describe("DemoComponent-pagetitle-editthreetimes", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test editable page title after third edit ", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = "new editable Page";
    formData.nativeElement.dispatchEvent(new Event('input'));
    formData.nativeElement.value = "new editable Page 2";
    formData.nativeElement.dispatchEvent(new Event('input'));
    formData.nativeElement.value = "new editable Page 3";
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe("new editable Page 3");
  });
});

// === test editable test page after a random number times of edited ====
describe("DemoComponent-pagetitle-editrandom", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let num: number = Math.ceil(Math.random() * 10);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test editable page title after random times of edit ", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = num;
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe(num);
  });
});

// === test editable test page after a title including some space in the front ====
describe("DemoComponent-pagetitle-editrandom-space-inthefront", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let num: number = Math.ceil(Math.random() * 10);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    // component.titleService.setTitle(Array(num).fill("\xa0").join("") + "new editable Page");
    fixture.detectChanges();
  });

  it("test editable page title after random times of space in the front", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = Array(num).fill("\xa0").join("") + "new editable Page";
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe(Array(num).fill("\xa0").join("") + "new editable Page");
  });
});

// === test editable test page after a title including some space in the end ====
describe("DemoComponent-pagetitle-editrandom-space-intheend", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let num: number = Math.ceil(Math.random() * 10);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test editable page title after random times of space in the end", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = "new editable Page" + Array(num).fill("\xa0").join("");
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe("new editable Page" + "\xa0".repeat(num));
  });
});

// === test editable test page including some special characters ====
describe("DemoComponent-pagetitle-editrandom-special-characters", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let car: string = '!"§$%&/()=?\u{20ac}';
  let res: string = car.substring(Math.floor(car.length * Math.random()), 1);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    component.titleService.setTitle("new editable Page" + res);
    fixture.detectChanges();
  });

  it("test editable page title including special characters", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = "new editable Page" + res;
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe("new editable Page" + res);
  });
});

// === test editable test page including some special characters ====
describe("DemoComponent-pagetitle-editrandom-special-characters", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let car: string = '!"§$%&/()=?\u{20ac}';
  let res: string = car.substring(Math.floor(car.length * Math.random()), 1);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test editable page title including special characters", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = "new editable Page" + res;
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe("new editable Page" + res);
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

// === test editable page when the title is too short ====
describe("DemoComponent-pagetitle-tooshort", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let tmp: string = randomRange(1, 3);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test editable page title too short", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = tmp;
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe(tmp);
  });
});

// === test editable page when the title is too long ====
describe("DemoComponent-pagetitle-toolong", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let tmp: string = randomRange(100, 500);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DemoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("test editable page title too long", () => {
    const { debugElement } = fixture;
    const formData = fixture.debugElement.query(By.css('#newpagetitle'));
    formData.nativeElement.value = tmp;
    formData.nativeElement.dispatchEvent(new Event('input'));
    expect(formData.nativeElement.value).toBe(tmp);
  });
});
