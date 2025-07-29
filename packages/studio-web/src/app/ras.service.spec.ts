import { HttpClient, provideHttpClient } from "@angular/common/http";
import { ToastrModule } from "ngx-toastr";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { ASSEMBLE_MOCK, LANGS_MOCK } from "../mocks";
import { RasService } from "./ras.service";
import { environment } from "../environments/environment";

describe("RasService", () => {
  let service: RasService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj("HttpClient", ["get"]);
    TestBed.configureTestingModule({
      imports: [ToastrModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    // Inject the http service and test controller for each test
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(RasService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
  it("should be able to reach the langs endpoint", () => {
    service.getLangs$().subscribe((data) => {
      expect(data).toEqual(LANGS_MOCK);
    });
    const req = httpTestingController.expectOne({
      method: "GET",
      url: `${environment.apiBaseURL}/langs`,
    });
    expect(req.request.method).toEqual("GET");
    expect(req.request.responseType).toEqual("json");
    // // Respond with mock data, causing Observable to resolve.
    // // Subscribe callback asserts that correct data was returned.
    req.flush(LANGS_MOCK);

    // // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  });
  it("should be able to reach the assemble endpoint", () => {
    service
      .assembleReadalong$({
        input: "hej verden",
        type: "text/plain",
        text_languages: ["dan", "und"],
        debug: true,
      })
      .subscribe((data) => {
        expect(data).toEqual(ASSEMBLE_MOCK);
      });
    const req = httpTestingController.expectOne({
      method: "POST",
      url: `${environment.apiBaseURL}/assemble`,
    });
    expect(req.cancelled).toBeFalsy();
    expect(req.request.responseType).toEqual("json");
    expect(req.request.method).toEqual("POST");
    // // Respond with mock data, causing Observable to resolve.
    // // Subscribe callback asserts that correct data was returned.
    req.flush(ASSEMBLE_MOCK);

    // // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  });
});
