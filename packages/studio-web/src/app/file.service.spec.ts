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
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, ToastrModule.forRoot()],});
        // Inject the http service and test controller for each test
        httpClient = TestBed.inject(HttpClient);
        httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(FileService);

  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
