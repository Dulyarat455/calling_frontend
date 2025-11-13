import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalTemplateComponent } from '../modal-template/modal-template.component';


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
  columns?: RowItem[][];  // ✅ โครงสร้างใหม่แบบรวมคอลัมน์
  left: RowItem[];
  right: RowItem[];
}

@Component({
  selector: 'app-lamination-panel',
  standalone: true,
  imports: [CommonModule,ModalTemplateComponent],
  templateUrl: './lamination-panel.component.html',
  styleUrl: './lamination-panel.component.css'
})
export class LaminationPanelComponent {
  @Input() section!: LaminationSection;
  @Output() updateRow = new EventEmitter<RowItem>();

  @ViewChild('foodTypeModal') modal!: ModalTemplateComponent;

  openModal() {
    this.modal.open({ group: 'Lamination' });
  }

  onSaved(data: any) {
    console.log('บันทึกข้อมูลแล้ว:', data);
  }


  // แปลง section ให้กลายเป็นลิสต์คอลัมน์เดียวเสมอ (ใหม่/เก่าใช้ร่วมกัน)
  columns(): RowItem[][] {
    if (this.section?.columns?.length) return this.section.columns!;
    return [this.section?.left ?? [], this.section?.right ?? []];
  }

  rowClass(item: RowItem) {
    return {
      'row-wait': item.status === 'wait',
      'row-pending': item.status === 'pending',
    };
  }

  onUpdate(item: RowItem) {
    this.updateRow.emit(item);
  }

  trackCol = (i: number, _c: RowItem[]) => i;                       // คอลัมน์
  trackRow = (_: number, r: RowItem) => `${r.time}-${r.station}`;   // แถว
}
