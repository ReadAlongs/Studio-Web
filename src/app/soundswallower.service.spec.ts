import { TestBed } from "@angular/core/testing";

import { SoundswallowerService } from "./soundswallower.service";

describe("SoundswallowerService", () => {
  let service: SoundswallowerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoundswallowerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
