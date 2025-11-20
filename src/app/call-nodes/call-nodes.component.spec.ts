import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallNodesComponent } from './call-nodes.component';

describe('CallNodesComponent', () => {
  let component: CallNodesComponent;
  let fixture: ComponentFixture<CallNodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallNodesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CallNodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
