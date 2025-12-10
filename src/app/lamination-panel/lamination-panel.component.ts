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
  status: Status;
  date: string; 
  //addnew
  jobId:number;
  createByUserId: number;
  createByUserName: string;
  createByUserEmpNo: string;
  remark: string;
  machineId: number;
  machineName: string;
  groupId: number;
  groupName: string;
  fromNodeId: number;
  fromNodeName: string;
  toNodeId: number;
  toNodeName: string;
}


export interface LaminationSection {
  title?: string;   // ชื่อหัวการ์ด (แถบสีดำ)
  header?: string;  // ชื่อแถบเขียว ("Lamination")
  waitCount: number;
  pendingCount: number;
  Rows: RowItem[]
}


//at modal form
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
  @Input() checkNotifyWait: number = 1; //add new 
  @Input() checkNotifyPending: number = 1;
  @Output() updateRow = new EventEmitter<RowItem>();

  @ViewChild('assignJobModal') modal!: ModalTemplateComponent;

  constructor(private http: HttpClient, private router: Router) {}
  //user current
  modalName: string = "Lamination AssignJob"
  userName: string = "";
  userId: number | null = null; 
  sectionId: number | null = null;
  sectionName: string = "";
  empNo: string = "";
  subSectionId: number | null = null;
  subSectionName: string = "";
  groupId: number | null = null;
  groupName: string = "";
  valueUserCallNodeId: number | null = null;
  valueUserCallNodeName: string = "";
  //at modal form
  machines: MachineRow[] = [];
  groups: GroupRow[] = [];
  callNodes: CallNodeRow[] = []; 
  filterByGroupFromNodecallNodes: CallNodeRow[] = [];

  selectedGroupId: number | null = null;
  selectedMachineId: number | null = null;
  selectedToCallNodeId: number | null = null;
  remarkJobValue: string = "";
  isLoading = false;


  ngOnInit() {
    this.userName = localStorage.getItem('calling_name')!;
    this.empNo = localStorage.getItem('calling_empNo')!;
    this.userId = parseInt(localStorage.getItem('calling_id')!);
    this.sectionId = parseInt(localStorage.getItem("calling_sectionId")!);
    this.sectionName = localStorage.getItem("calling_section")!;
    this.subSectionId = parseInt(localStorage.getItem("calling_subSectionId")!);
    this.subSectionName = localStorage.getItem("calling_subSection")!;
    this.groupId = parseInt(localStorage.getItem("calling_groupId")!);
    this.groupName = localStorage.getItem("calling_group")!;
    this.valueUserCallNodeName = localStorage.getItem("calling_callNodeCode")!;

    this.fetchGroup();
    this.fetchMachineByGroup();
    this.fetchCallNodeByGroup();
    this.fetchCallNodeFollowUser();

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

  fetchMachineByGroup(){
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
        this.selectedToCallNodeId = null; 
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
      this.fetchCallNodeByGroupFromNode();
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

  fetchCallNodeByGroupFromNode(){
    this.http
    .post(config.apiServer + '/api/callnode/filterByGroupFromNode',{
      groupId: this.groupId,
      fromNodeId: this.valueUserCallNodeId  //***must call fetchCallNodeFollowUser success before use this value*/
    })
    .subscribe({
      next: (res: any) => {
        this.filterByGroupFromNodecallNodes =  res.results || [] ;
        },
        error: (err) => {
          Swal.fire({
            title: 'Error',
            text: err.message || 'Cannot load Node',
            icon: 'error',
          });
        },
    })
  }


  openModal(item?: RowItem) {
   
    // const preset = item ? { machine: item.machineName } : {};
    // console.log("check preset: ",preset)
    this.modal.open();
  }

  

  onSaved(data: any) {
     if(this.isLoading) return ;
      console.log(`onSaved :  remark: ${this.remarkJobValue} 
        groupId: ${this.groupId} selectedToCallNodeId ${this.selectedToCallNodeId} 
        selectedMachineId: ${this.selectedMachineId} userId: ${this.userId}    
        `
        
      )
     if ( this.groupId == null || this.selectedToCallNodeId == null || this.selectedMachineId == null
        || this.userId == null || this.valueUserCallNodeId == null
     ){
            Swal.fire({
              title: 'ตรวจสอบข้อมูล',
              text: 'กรุณากรอก ข้อมูลให้ครบ',
              icon: 'warning',
            });
            return;
      }

      const payload = {
        groupId: this.groupId,
        machineId: this.selectedMachineId,
        fromNodeId: this.valueUserCallNodeId,
        toNodeId: this.selectedToCallNodeId,
        userId: this.userId,
        remark: this.remarkJobValue
      };

      this.isLoading = true;

      this.http.post(config.apiServer + '/api/job/create', payload).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          
          Swal.fire({
            title: 'สำเร็จ',
            text: 'Assign Job Success',
            icon: 'success',
            timer: 1500,
          });
           // ปิด modal + เคลียร์ฟอร์ม
           this.modal.close();

          // เคลียร์ค่าใน parent ถ้าต้องการ
          this.selectedMachineId = null;
          this.selectedToCallNodeId = null;
          this.remarkJobValue = '';
  
      
          //  this.fetchCallNode();
  
         },
         error: (err) => {
           this.isLoading = false;
   
           let msg =
             err.error?.message ||
             err.message ||
             'เกิดข้อผิดพลาดในการสร้าง Assign Job';

   
           Swal.fire({
             title: 'ไม่สามารถ Assign Job',
             text: msg,
             icon: 'error',
           });
         },
       });

    console.log('บันทึกข้อมูลแล้ว:', data);

  }

  onUpdate(item: RowItem) {
    this.openModal(item);
    this.updateRow.emit(item);
  }

  onMachineSelected(machineId: number) {
    this.selectedMachineId = machineId;
    console.log('Selected machine:', machineId);
  }

  onCallNodeToSelected(callNodeId: number) {
    this.selectedToCallNodeId = callNodeId;
    console.log("selected callNode:",callNodeId);
  }

  onRemarkValue(remarkValue: string){
     this.remarkJobValue = remarkValue;
     console.log("input remark:", remarkValue); 
  }

  // onGroupSelected(groupId: number) {
  //   this.selectedGroupId = groupId;
  //   this.fetchMachineByGroup();
    
  //   console.log("Selected group:", groupId);
  // }
  
}
