import { Component,ViewChild,EventEmitter, Output, Input } from '@angular/core';
import {MyModal } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


export type NameForm = {
  createBy: string;
  group: string;
  machine: string;
  callFrom: string;
  callTo: string;
};

@Component({
  selector: 'app-modal-template',
  standalone: true,
  imports: [FormsModule,MyModal,CommonModule],
  templateUrl: './modal-template.component.html',
  styleUrl: './modal-template.component.css'
})

export class ModalTemplateComponent {
  @ViewChild(MyModal) myModal!: MyModal;

  // รับ input จาก parent
  @Input() groups: { id: number; name: string }[] = [];
  @Input() machines: { id: number; code: string }[] = [];
  @Input() callNodes: { id:number; code: string }[] = [];
  @Input() userName: string = "";
  @Input() modalName: string = "";
  @Input() userId : number | null = null;

   // --- state มาตรฐาน ---
   model: NameForm = this.defaultModel();
   isSaving = false;
   errorMsg = '';

  @Output() saved = new EventEmitter<NameForm>();
  @Output() cleared = new EventEmitter<void>();

  @Output() groupSelected = new EventEmitter<number>();
  @Output() machineSelected = new EventEmitter<number>();
  @Output() callNodeSelected = new EventEmitter<number>();


  private defaultModel(): NameForm {
    return { createBy: '', group: '', machine: '', callFrom: '', callTo: '' };
  }

   // เรียกจากข้างนอกได้ (ผ่าน parent อื่น)
  open(data?: Partial<NameForm>) {
        this.model = { ...this.defaultModel(), createBy: this.userName ,...(data ?? {}) };
        this.errorMsg = '';
        // ระวัง: MyModal พร้อมใช้หลัง AfterViewInit เท่านั้น → เรียกจากปุ่ม/เหตุการณ์หลังหน้าเรนเดอร์แล้วจะปลอดภัย
        this.myModal?.open();
  }

  onMachineChange(event: any) {
    const selectedId = Number(event.target.value);
    this.machineSelected.emit(selectedId);
  }

  onGroupChange(ev: any) {
    const id = Number(ev.target.value);
    this.groupSelected.emit(id);
  }

  onCallNodeChange(event: any){
    const selectedId = Number(event.target.value);
    this.callNodeSelected.emit(selectedId);
  }

  close() {
    this.myModal?.close();
  }

  clear() {
    this.model = this.defaultModel();
    this.cleared.emit();
  }

  get canSave() {
    return !!this.model.group && !!this.model.machine && !!this.model.callFrom && !!this.model.callTo && !this.isSaving;
  }

  async save() {
    if (!this.canSave) return;
    this.isSaving = true;
    this.errorMsg = '';
    try {
      // TODO: call API ที่นี่
      this.saved.emit({ ...this.model });
      this.close();
    } catch (e: any) {
      this.errorMsg = e?.message ?? 'Save failed';
    } finally {
      this.isSaving = false;
    }
  }


}
