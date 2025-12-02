import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowJobComponent } from './flow-job.component';

describe('FlowJobComponent', () => {
  let component: FlowJobComponent;
  let fixture: ComponentFixture<FlowJobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowJobComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlowJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
