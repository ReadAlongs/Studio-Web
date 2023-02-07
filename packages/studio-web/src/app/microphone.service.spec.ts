import { TestBed } from "@angular/core/testing";

import { MicrophoneService } from "./microphone.service";

describe("MicrophoneService", () => {
  let service: MicrophoneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MicrophoneService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
