import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Carpooling } from './carpooling';

describe('Carpooling', () => {
  let component: Carpooling;
  let fixture: ComponentFixture<Carpooling>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carpooling]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Carpooling);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
