import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type Status = 'wait' | 'pending';
export interface RowItem {
  time: string;
  station: string;
  status: Status;
}
export interface LaminationSection {
  title?: string;   // ชื่อหัวการ์ด (แถบสีดำ)
  header?: string;  // ชื่อแถบเขียว ("Lamination")
  waitCount: number;
  pendingCount: number;
  left: RowItem[];
  right: RowItem[];
}

@Component({
  selector: 'app-lamination-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lamination-panel.component.html',
  styleUrl: './lamination-panel.component.css'
})
export class LaminationPanelComponent {
  @Input() section!: LaminationSection;
  @Output() updateRow = new EventEmitter<RowItem>();

  rowClass(item: RowItem) {
    return {
      'row-wait': item.status === 'wait',
      'row-pending': item.status === 'pending',
    };
  }

  onUpdate(item: RowItem) {
    this.updateRow.emit(item);
  }

  trackRow = (_: number, r: RowItem) => `${r.time}-${r.station}`;
}
