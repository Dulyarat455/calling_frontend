import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSectionsComponent } from './user-sections.component';

describe('UserSectionsComponent', () => {
  let component: UserSectionsComponent;
  let fixture: ComponentFixture<UserSectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
