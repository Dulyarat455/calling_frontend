import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalTemplateComponent } from '../modal-template/modal-template.component';
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';


import Swal from 'sweetalert2';
import config from '../../config';


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

type GroupRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
};

type MachineRow = {
  id: number;
  code: string;
  createdAt: number;
  state: string;
  groupId: number;
  groupName: string;
  isActive:number;

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

  @ViewChild('assignJobModal') modal!: ModalTemplateComponent;

  constructor(private http: HttpClient, private router: Router) {}
  //user current
  modalName: string = "Lamination AssignJob"
  userName: string = "";
  userId: number | null = null; 
  sectionId: number | null = null;
  sectionName: string = "";
  subSectionId: number | null = null;
  subSectionName: string = "";
  groupId: number | null = null;
  valueUserCallNodeId: number | null = null;
  //at modal form
  machines: MachineRow[] = [];
  groups: GroupRow[] = [];
  callNodes: CallNodeRow[] = []; 

  selectedGroupId: number | null = null;
  selectedMachineId: number | null = null;
  selectedCallNodeId: number | null = null;


  ngOnInit() {
    this.userName = localStorage.getItem('calling_name')!;
    this.userId = parseInt(localStorage.getItem('calling_id')!);
    this.sectionId = parseInt(localStorage.getItem("calling_sectionId")!);
    this.sectionName = localStorage.getItem("calling_section")!;
    this.subSectionId = parseInt(localStorage.getItem("calling_subSectionId")!);
    this.subSectionName = localStorage.getItem("calling_subSection")!;
    this.groupId = parseInt(localStorage.getItem("calling_groupId")!);
    this.fetchGroup();
    this.fetchMachine();
    this.fetchCallNodeFollowUser();
    this.fetchCallNodeByGroup();
  }


  fetchGroup(){
    this.http.get(config.apiServer + '/api/group/list').subscribe({
      next: (res: any) => {
        this.groups = res.results || [];
     
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      },
    });
  }

  fetchMachine(){
    this.http.get(config.apiServer + '/api/machine/list').subscribe({
      next: (res: any) => {
      this.machines = (res.results || []).map((r: any) => ({
          id: r.id,
          code: r.code ,
          groupId: r.groupId,
          isActive: r.isActive,
          state: r.State,
          groupName: r.Groups?.name ?? '',
        }))

      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      },
    }); 
  }

  fetchMachineByGroup(){

    // if (!this.selectedGroupId) {
    //   this.machines = [];
    //   this.selectedMachineId = null;
    //   return;
    // }

    this.http
      .post(config.apiServer + '/api/machine/filterByGroup', {
        groupId: this.groupId,
      })
      .subscribe({
        next: (res: any) => {
          this.machines = (res.results || []).map((r: any) => ({
            id: r.id,
            code: r.code ,
            groupId: r.groupId,
            isActive: r.isActive,
            state: r.State,
            groupName: r.Groups?.name ?? '',
          }))
          this.selectedMachineId = null; // เลือกใหม่ทุกครั้งที่เปลี่ยน Group
        },
        error: (err) => {
          Swal.fire({
            title: 'Error',
            text: err.message || 'Cannot load Machines',
            icon: 'error',
          });
        },
      });
  }

  fetchCallNodeByGroup(){
    this.http
    .post(config.apiServer + '/api/callnode/filterByGroup', {
      groupId: this.groupId,
    })
    .subscribe({
      next: (res: any) => {
        this.callNodes = res.results || [];
        this.selectedCallNodeId = null; // เลือกใหม่ทุกครั้งที่เปลี่ยน Group
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Cannot load Node',
          icon: 'error',
        });
      },
    });
  }

  fetchCallNodeFollowUser(){
    this.http
    .post(config.apiServer + '/api/callnode/filterTriParam', {
      groupId: this.groupId,
      sectionId: this.sectionId,
      subSectionId: this.subSectionId
    })
    .subscribe({
      next: (res: any) => {
      this.valueUserCallNodeId = res.row.id;
      // console.log("fromcallnodefollowUser", res.row.id);
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Cannot load Node',
          icon: 'error',
        });
      },
    });
  }


  openModal(item?: RowItem) {
    // const preset = item
    // ? { group: 'Lamination', machine: item.station }  // เอาชื่อ station ไปเติมในช่อง Machine
    // : { group: 'Lamination' };
    const preset = item ? { machine: item.station } : {};
    this.modal.open(preset);
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
    this.openModal(item);
  }

  onMachineSelected(machineId: number) {
    this.selectedMachineId = machineId;
    console.log('Selected machine:', machineId);
  }

  onCallNodeSelected(callNodeId: number) {
    this.selectedCallNodeId = callNodeId;
    console.log("selected callNode:",callNodeId);
  }

  onGroupSelected(groupId: number) {
    this.selectedGroupId = groupId;
    this.fetchMachineByGroup();
    
    console.log("Selected group:", groupId);
  }
  

  trackCol = (i: number, _c: RowItem[]) => i;                       // คอลัมน์
  trackRow = (_: number, r: RowItem) => `${r.time}-${r.station}`;   // แถว
}
