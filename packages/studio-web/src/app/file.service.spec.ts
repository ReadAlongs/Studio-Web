import { TestBed } from "@angular/core/testing";
import { HttpClient, HttpEventType } from "@angular/common/http";
import { ToastrModule } from "ngx-toastr";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { FileService } from "./file.service";

describe("FileService", () => {
  let service: FileService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ToastrModule.forRoot()],
    });
    // Inject the http service and test controller for each test
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(FileService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should read a text file from a promise", async () => {
    const got = await service.readFile("this is a test");
    expect(got).toBe("this is a test");
  });

  it("should create a data URL from a promise", async () => {
    const got = await service.readFileAsDataURL("this is a test");
    expect(got.startsWith("data:text/plain;base64")).toBeTrue();

    // reverse the readFileAsDataURL operation.
    const reversed = await fetch(got).then((resp) => resp.text());
    expect(reversed).toBe("this is a test");
  });

  it("should turn utf8 to b64 and back", async () => {
    const testUTF8 = `󳬏ۓ脶򍫐䏷򻱚1󔊣򧰗J鷍ˑ⨘󝳗ʳꟴ󆋔=є򻥼Ӳ򦿴¦槩7}摠꾀𴮣۝م𬷊
    ,^⒆!טФ񤨷Յe󫱷ъ"Ҁ*=ߋ󻅷񌍖_ᾀ\ꡝ񲁿g"՝MU񔡆ЀL
    劆֒񦘰ˑ{坋𹔸lǼc&񓱬񊄸Ӽ:󌈅=̹ɽ渭觙􈯶൰ȣ¡圤𹷟򱄢揋ﺝ􊃻^
    E̶򱩀򑪟eٌϐ򔜮霗燨综*􍪻񭚴oꕃ𷴨2ҽT񺆥uR혙񗊭:򉪼񙏺ۤƓ騡
    񱺡􌡩PȌ񸛍񩍢􅓴冖㌃ۄ𦄜7Ž⇆*zѱ澁nަvۭË́듍JҢ䆹M󩗟繶`;

    const got = await service
      .readFileAsDataURL(testUTF8)
      .then((dataURL) => fetch(dataURL))
      .then((resp) => resp.text());

    expect(got).toEqual(testUTF8);
  });
});
