import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaminationPanelComponent } from './lamination-panel.component';

describe('LaminationPanelComponent', () => {
  let component: LaminationPanelComponent;
  let fixture: ComponentFixture<LaminationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaminationPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaminationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
