import { Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { MachinesComponent } from './machines/machines.component';
import { GroupsComponent } from './groups/groups.component';
import { UserGroupComponent } from './user-group/user-group.component';
import { UserSectionComponent } from './user-section/user-section.component';
import { SectionsComponent } from './sections/sections.component';
import { CallNodesComponent } from './call-nodes/call-nodes.component';
import { SubSectionComponent } from './sub-section/sub-section.component';
import { FlowJobComponent } from './flow-job/flow-job.component';


export const routes: Routes = [
  
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'signin',
    component: SignInComponent,
  },
  {
    path: 'signup',
    component: SignUpComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'machine',
    component: MachinesComponent
  },
  {
    path: 'group',
    component: GroupsComponent
  },
  {
    path: 'userGroups',
    component: UserGroupComponent
  },
  {
    path: 'section',
    component: SectionsComponent
  },
  {
    path: 'subSection',
    component: SubSectionComponent
  },
  {
    path: 'callNodes',
    component: CallNodesComponent
  },
  {
    path: 'flowJob',
    component: FlowJobComponent
  },
  {
    path: '404',
    component: NotFoundComponent,
  },
  {
    path: '**',
    redirectTo: '404',
  },

  // {
  //   path: '**',
  //   redirectTo: '',
  // },
];
