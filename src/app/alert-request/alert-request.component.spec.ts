import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertRequestComponent } from './alert-request.component';

describe('AlertRequestComponent', () => {
  let component: AlertRequestComponent;
  let fixture: ComponentFixture<AlertRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
