import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { RasService } from './ras.service';
import { ASSEMBLE_MOCK, LANGS_MOCK } from '../mocks';

describe('RasService', () => {
  let service: RasService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    // Inject the http service and test controller for each test
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(RasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should be able to reach the langs endpoint', () => {
    service.getLangs$().subscribe(data => {
      expect(data).toEqual(LANGS_MOCK);
    })
    const req = httpTestingController.expectOne({ method: "GET", url: service.baseURL + '/langs' });
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');
    // // Respond with mock data, causing Observable to resolve.
    // // Subscribe callback asserts that correct data was returned.
    req.flush(LANGS_MOCK);

    // // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  });
  it('should be able to reach the assemble endpoint', () => {
    service.assembleReadalong$({
      "text": "hej verden",
      "text_languages": [
        "dan",
        "und"
      ],
      "encoding": "utf-8",
      "debug": true
    }).subscribe(data => {
      console.log(data);
      switch (data.type) {
        case HttpEventType.Response:
          expect(data).toEqual(ASSEMBLE_MOCK);
      }
    })
    const req = httpTestingController.expectOne({ method: "POST", url: service.baseURL + '/assemble' });
    expect(req.cancelled).toBeFalsy();
    expect(req.request.responseType).toEqual('json');
    expect(req.request.method).toEqual('POST');
    // // Respond with mock data, causing Observable to resolve.
    // // Subscribe callback asserts that correct data was returned.
    req.flush(ASSEMBLE_MOCK);

    // // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  });

});
