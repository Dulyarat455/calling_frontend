import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralStatorPanelComponent } from './general-stator-panel.component';

describe('GeneralStatorPanelComponent', () => {
  let component: GeneralStatorPanelComponent;
  let fixture: ComponentFixture<GeneralStatorPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralStatorPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralStatorPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
