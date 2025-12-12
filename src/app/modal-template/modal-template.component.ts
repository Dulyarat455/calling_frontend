import { Component,ViewChild,EventEmitter, Output, Input } from '@angular/core';
import {MyModal } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AutoGrowDirective } from './auto-grow.directive';


export type NameForm = {
  createBy: string;
  group: number | null;
  machine: string;
  callFrom: number | null;
  callTo: string;
  empNo: String;
  Remark: String; 
  priority: 'urgent' | 'normal';
};

type GroupRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
};


type CallNodeRow ={
  id:number;
  code: string;
  sectionId: number;
  sectionName: string;
  groupId: number;
  groupName: string;
  subSectionId: number;
  subSectionName: string;
  isActive: number;
  state: string;
}

type MachineRow = {
  id: number;
  code: string;
  createdAt: number;
  state: string;
  groupId: number;
  groupName: string;
  isActive:number;

};



@Component({
  selector: 'app-modal-template',
  standalone: true,
  imports: [FormsModule,MyModal,CommonModule,AutoGrowDirective],
  templateUrl: './modal-template.component.html',
  styleUrl: './modal-template.component.css'
})

export class ModalTemplateComponent {
  @ViewChild(MyModal) myModal!: MyModal;

  // รับ input จาก parent
  @Input() groups: GroupRow[] = [];
  @Input() machines: MachineRow[] = [];
  @Input() callNodes: CallNodeRow[] = [];
  @Input() filterByGroupFromNodecallNodes: CallNodeRow[] = [];
  @Input() userName: string = "";
  @Input() modalName: string = "";
  @Input() empNo: string = "";
  @Input() userId: number | null = null;
  @Input() userCallNodeId: number | null = null;
  @Input() userGroupId: number | null = null;
  @Input() isLoading : boolean = false;
  

   // --- state มาตรฐาน ---
   model: NameForm = this.defaultModel();
   errorMsg = '';

  @Output() saved = new EventEmitter<NameForm>();
  @Output() cleared = new EventEmitter<void>();

  @Output() groupSelected = new EventEmitter<number>();
  @Output() machineSelectedId = new EventEmitter<number>();
  @Output() callNodeToSelectedId = new EventEmitter<number>();
  @Output() remarkValue = new EventEmitter<string>();
  @Output() priorityValue = new EventEmitter<string>();


  private defaultModel(): NameForm {
    return { createBy: '',empNo: '', group: null , machine: '', callFrom: null, callTo: '', Remark:'', priority: 'normal', };
  }

   // เรียกจากข้างนอกได้ (ผ่าน parent อื่น)
  open(data?: Partial<NameForm>) {
        this.model = { ...this.defaultModel(), createBy: this.userName, empNo: this.empNo, group: this.userGroupId, callFrom: this.userCallNodeId ,...(data ?? {}) };
        this.errorMsg = '';
        // ระวัง: MyModal พร้อมใช้หลัง AfterViewInit เท่านั้น → เรียกจากปุ่ม/เหตุการณ์หลังหน้าเรนเดอร์แล้วจะปลอดภัย

        // ✅ ส่งค่า priority เริ่มต้น (normal) ไปก่อน
        this.priorityValue.emit(this.model.priority);
        this.myModal?.open();
  }


  togglePriority(p: 'urgent' | 'normal') {
    this.model.priority = p; // เลือกได้ทีละอันเสมอ
    this.priorityValue.emit(p); //ส่งค่า
  }

  onMachineChange(event: any) {
    const selectedId = Number(event.target.value);
    this.machineSelectedId.emit(selectedId);
  }

  onCallNodeToChange(event: any){
    const selectedId = Number(event.target.value);
    this.callNodeToSelectedId.emit(selectedId);
  }

  onRemarkChange(event: any){
    const value = event.target.value;
    this.remarkValue.emit(value);
    console.log("at OnRemarkChange at modal-template");
  }
 
  close() {
    this.myModal?.close();
  }

  clear() {
    this.model = this.defaultModel();
    this.cleared.emit();
  }

  get canSave() {
    return !!this.model.group && 
    !!this.model.machine && 
    !!this.model.callFrom && 
    !!this.model.callTo && 
    !!this.model.priority &&
    !this.isLoading;
  }


  async save() {
    if (!this.canSave) return;
    this.errorMsg = '';
    // ส่ง model กลับไปให้ parent (LaminationPanel)
    this.saved.emit({ ...this.model });
  }

}
