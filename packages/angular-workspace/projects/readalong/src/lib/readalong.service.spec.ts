import { TestBed } from '@angular/core/testing';

import { ReadalongService } from './readalong.service';

describe('ReadalongService', () => {
  let service: ReadalongService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReadalongService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
