import { TestBed } from "@angular/core/testing";

import { StudioService } from "./studio.service";

describe("StudioService", () => {
  let service: StudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudioService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
