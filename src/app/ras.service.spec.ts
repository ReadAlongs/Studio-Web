import { TestBed } from '@angular/core/testing';

import { RasService } from './ras.service';

describe('RasService', () => {
  let service: RasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
