import { TestBed } from '@angular/core/testing';

import { B64Service } from './b64.service';

describe('B64Service', () => {
  let service: B64Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(B64Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
