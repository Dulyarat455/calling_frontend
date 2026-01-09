import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarChartComponent } from './navbar-chart.component';

describe('NavbarChartComponent', () => {
  let component: NavbarChartComponent;
  let fixture: ComponentFixture<NavbarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
