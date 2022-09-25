import { TestBed } from '@angular/core/testing';

import { AlertLoadingService } from './alert-loading.service';

describe('AlertLoadingService', () => {
  let service: AlertLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertLoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
