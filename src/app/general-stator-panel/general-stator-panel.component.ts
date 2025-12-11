import { Component, Input, ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalTemplateComponent } from '../modal-template/modal-template.component';

type Status = 'wait' | 'pending';

export interface RowItem {
  time: string;
  station: string;
  status: Status;
  date: string;
  toNodeName: string;
}

export interface GroupPanel {
  title: string;        // เช่น "General" หรือ "Stator"
  waitCount: number;
  pendingCount: number;
  rows: RowItem[];
}


@Component({
  selector: 'app-general-stator-panel',
  standalone: true,
  imports: [CommonModule,ModalTemplateComponent],
  templateUrl: './general-stator-panel.component.html',
  styleUrls: ['./general-stator-panel.component.css'],
})
export class GeneralStatorPanelComponent {
   /** ข้อมูลฝั่ง General (ซ้าย) */
   @Input() general!: GroupPanel;
   /** ข้อมูลฝั่ง Stator (ขวา) */
   @Input() stator!: GroupPanel;

  @ViewChild('assignJobModal') modal!: ModalTemplateComponent;

  openModal() {
    this.modal.open();
  }

  onSaved(data: any) {
    console.log('บันทึกข้อมูลแล้ว:', data);
  }

 
}
