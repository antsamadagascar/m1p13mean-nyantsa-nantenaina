import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerantRegistrationComponent } from './gerant-registration.component';

describe('GerantRegistrationComponent', () => {
  let component: GerantRegistrationComponent;
  let fixture: ComponentFixture<GerantRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GerantRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GerantRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
