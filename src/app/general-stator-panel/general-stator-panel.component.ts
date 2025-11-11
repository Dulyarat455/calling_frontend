import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type Status = 'wait' | 'pending';

export interface RowItem {
  time: string;
  station: string;
  status: Status;
}

export interface Group {
  key: 'general' | 'stator';  /** คีย์ระบุประเภทคอลัมน์ */
  title: string;              /** ข้อความหัวคอลัมน์ */
  base: 'green' | 'blue';     /** โทนสีพื้นฐานของคอลัมน์ */
  waitCount: number;          /** ตัวเลขสรุป */
  pendingCount: number;
  rows: RowItem[];
}

@Component({
  selector: 'app-general-stator-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './general-stator-panel.component.html',
  styleUrls: ['./general-stator-panel.component.css'],
})
export class GeneralStatorPanelComponent {
  /** ใส่ได้ 1–2 คอลัมน์ (เช่น General และ stator) */
  @Input() groups: Group[] = [];

  /** สร้างคลาสของแถวตามสถานะ + สีธีมคอลัมน์ */
  rowClass(g: Group, r: RowItem) {
    return {
      'row-wait--green': g.base === 'green' && r.status === 'wait',
      'row-wait--blue': g.base === 'blue' && r.status === 'wait',
      'row-pending': r.status === 'pending',
    };
  }

  trackByRow = (_: number, r: RowItem) => `${r.time}-${r.station}`;
}
