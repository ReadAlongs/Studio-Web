import { TestBed } from '@angular/core/testing';

import { G2pService } from './g2p.service';

describe('G2pService', () => {
  let service: G2pService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(G2pService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
