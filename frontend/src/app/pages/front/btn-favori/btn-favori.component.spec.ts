import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BtnFavoriComponent } from './btn-favori.component';

describe('BtnFavoriComponent', () => {
  let component: BtnFavoriComponent;
  let fixture: ComponentFixture<BtnFavoriComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BtnFavoriComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BtnFavoriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
