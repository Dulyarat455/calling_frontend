import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Status = 'wait' | 'pending';

interface RowItem {
  time: string;
  station: string;
  status: Status;
}


interface Group {
  key: 'general' | 'stator';
  title: string;
  base: 'green' | 'blue';        // ใช้กำหนดสีพื้นฐานของคอลัมน์
  waitCount: number;
  pendingCount: number;
  rows: RowItem[];
}



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  token: string | undefined = '';
  check: number = 0;

  ngOnInit() {
    this.token = localStorage.getItem('calling_token')!;
    
  }

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
      ]
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
      ]
    }
  ]; 



  rowClass(item: RowItem) {
    return {
      'row-normal': item.status === 'wait',
      'row-wait': item.status === 'wait',
      'row-pending': item.status === 'pending',
    };

  }


   // class ของแถวตามสถานะ + สีพื้นฐานคอลัมน์
  //  rowClass(g: Group, r: RowItem) {
  //   return {
  //     'row-wait--green':   g.base === 'green' && r.status === 'wait',
  //     'row-wait--blue':    g.base === 'blue'  && r.status === 'wait',
  //     'row-pending':       r.status === 'pending',
  //   };
  // }

  // trackByRow = (_: number, r: RowItem) => `${r.time}-${r.station}`;

   



}
