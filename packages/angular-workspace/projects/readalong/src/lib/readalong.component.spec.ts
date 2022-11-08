import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadalongComponent } from './readalong.component';

describe('ReadalongComponent', () => {
  let component: ReadalongComponent;
  let fixture: ComponentFixture<ReadalongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReadalongComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReadalongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
