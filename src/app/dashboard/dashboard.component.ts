import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaminationPanelComponent,RowItem } from '../lamination-panel/lamination-panel.component';
import { GeneralStatorPanelComponent,Group } from '../general-stator-panel/general-stator-panel.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,LaminationPanelComponent,GeneralStatorPanelComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  token: string | undefined = '';
  check: number | undefined = 1;
  ngOnInit() {
    this.token = localStorage.getItem('calling_token')!;
    
  }



  //part for lam
  section1 = {
    waitCount: 8,
    pendingCount: 2,
    left: <RowItem[]>[
      { time: '7:10', station: 'C10', status: 'wait' },
      { time: '7:25', station: 'A6 R', status: 'pending' },
      { time: '8:23', station: 'A8 S', status: 'wait' },
      { time: '8:38', station: 'B12 S', status: 'wait' },
      { time: '9:15', station: 'C13', status: 'wait' },
    ],
    right: <RowItem[]>[
      { time: '9:20', station: 'C11', status: 'wait' },
      { time: '9:25', station: 'B11 S', status: 'wait' },
      { time: '9:30', station: 'B11 S', status: 'wait' },
      { time: '9:40', station: 'B11 S', status: 'pending' },
      { time: '9:50', station: 'B11 S', status: 'wait' },
    ]
  };



  onUpdateRow(row: RowItem) {
    // TODO: เปิด modal / เรียก API / เปลี่ยนสถานะ ฯลฯ
    console.log('Update clicked:', row);
  }

// general stator
  groups: Group[] = [
    {
      key: 'general',
      title: 'General',
      base: 'green',
      waitCount: 8,
      pendingCount: 2,
      rows: [
        { time: '7:10', station: 'D2', status: 'wait' },
        { time: '7:25', station: 'A5', status: 'pending' },
        { time: '8:23', station: 'A3', status: 'wait' },
        { time: '8:38', station: 'D3', status: 'wait' },
        { time: '9:15', station: 'A1', status: 'wait' },
      ],
    },
    {
      key: 'stator',
      title: 'stator',
      base: 'blue',
      waitCount: 1,
      pendingCount: 1,
      rows: [
        { time: '9:20', station: 'B1', status: 'pending' },
        { time: '9:25', station: 'C5', status: 'wait' },
      ],
    },
  ];




}
